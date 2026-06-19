#!/usr/bin/env bash
#
# 이 파일은 무엇인가:
#   scan-secrets.js 와 같은 점검을 하는 bash 버전입니다(Git Bash·맥·리눅스·CI용).
# 왜 있는가:
#   Node 를 띄우지 않고도 셸에서 바로 점검하고 싶을 때, 그리고 CI 파이프라인에
#   한 줄로 끼워 넣기 좋게 만들기 위함입니다.
#   ① .env 류 파일이 깃에 추적되는지 ② 코드에 진짜 키 패턴이 박혔는지를 검사하고,
#   문제가 있으면 종료 코드 1 로 끝납니다(=CI 빌드를 막을 수 있음).
# 실행: bash check-secrets.sh

set -u  # 정의 안 된 변수를 쓰면 즉시 에러로 알려 줘, 조용한 버그를 막는다.

RED='\033[31m'; GREEN='\033[32m'; YELLOW='\033[33m'; RESET='\033[0m'
problems=0  # 발견한 문제 수. 0보다 크면 실패로 끝낸다.

echo "시크릿 점검 시작 (.env 추적 + 코드에 박힌 키)"
echo

# ── 검사 1: .env 류 파일이 깃에 추적되고 있는가 ───────────────
# 왜: .gitignore 에 적어도 과거에 한 번 add 된 파일은 계속 추적된다(흔한 함정).
#     .env.example(견본)은 정상이라 grep -v 로 제외한다.
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  tracked_env="$(git ls-files | grep -E '(^|/)\.env(\..+)?$' | grep -v '\.env\.example$' || true)"
  if [ -n "$tracked_env" ]; then
    problems=$((problems + 1))
    echo -e "${RED}[위험] .env 류 파일이 깃에 추적되고 있습니다:${RESET}"
    echo "$tracked_env" | sed 's/^/   - /'
    echo "   해결: 추적만 풀려면  git rm --cached <파일>  후 커밋. 이미 히스토리에 키가 올라갔다면 그 키를 폐기·재발급(회전) 하세요."
  else
    echo -e "${GREEN}[통과] .env 류 비밀 파일이 깃에 추적되고 있지 않습니다.${RESET}"
  fi
else
  echo -e "${YELLOW}(안내) 여기는 git 저장소가 아니라 .env 추적 검사는 건너뜁니다.${RESET}"
fi

# ── 검사 2: 코드에 박힌 진짜 키 패턴 ───────────────────────────
# 왜: 키를 코드에 직접 적는 실수가 가장 흔하고 위험하다. 정규식으로 미리 잡는다.
# 패턴: Claude(sk-ant-), Stripe(sk_live_/sk_test_), AWS(AKIA...), GitHub(ghp_).
pattern='sk-ant-[A-Za-z0-9_-]{8,}|sk_(live|test)_[A-Za-z0-9]{10,}|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{36}'
# 자리표시자/설명용 예시는 오탐이라 제외한다(REPLACE_ME, PLACEHOLDER, YOUR_, 말줄임 ..., 반복문자 등).
# 아래에서 grep -viE(-i = 대소문자 무시)로 거르므로 AAAA/aaaa, XXXX/xxxx 가 모두 잡힌다.
allow='REPLACE_ME|PLACEHOLDER|EXAMPLE|YOUR[_-]|xxxx|0000|aaaa|\.\.\.'

# node_modules·.git 등은 빼고, 코드/설정 파일만 훑는다.
# -n: 줄 번호 표시, -E: 확장 정규식, -r: 폴더 재귀.
hits="$(grep -rnE "$pattern" . \
  --include='*.js' --include='*.ts' --include='*.json' --include='*.html' \
  --include='*.css' --include='*.sh' --include='*.yml' --include='*.yaml' --include='*.md' \
  --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.vercel 2>/dev/null \
  | grep -viE "$allow" || true)"

if [ -n "$hits" ]; then
  problems=$((problems + 1))
  echo -e "${RED}[위험] 코드에 진짜 키 패턴이 박혀 있는 듯합니다(위치만 표시):${RESET}"
  # 값 전체를 다시 찍으면 또 유출이므로 '파일:줄' 위치만 보여 준다.
  echo "$hits" | cut -d: -f1,2 | sed 's/^/   - /'
  echo "   해결: 그 값을 코드에서 지우고 process.env.X 로 바꾼 뒤 .env 에만 적으세요. 이미 커밋됐다면 키를 폐기·재발급(회전) 하세요."
else
  echo -e "${GREEN}[통과] 코드에 박힌 진짜 키 패턴이 발견되지 않았습니다.${RESET}"
fi

echo
# 문제가 하나라도 있으면 종료 코드 1. CI 는 이를 '실패'로 보고 빌드를 막는다.
if [ "$problems" -gt 0 ]; then
  echo -e "${RED}점검 실패: 문제 ${problems}건. 위 안내대로 고친 뒤 다시 커밋하세요.${RESET}"
  exit 1
else
  echo -e "${GREEN}점검 통과: 비밀값 노출 위험이 발견되지 않았습니다.${RESET}"
  exit 0
fi
