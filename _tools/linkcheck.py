# -*- coding: utf-8 -*-
"""docs/ 와 examples/ 안 마크다운 내부 링크 중 대상 파일이 없는 '깨진 링크'를 찾는다."""
import os, re, glob

ROOT = r"C:\Users\김세영\Desktop\부산코딩스쿨_강의자료\treasure"
LINK = re.compile(r"\[[^\]]+\]\(([^)]+)\)")

mds = (glob.glob(os.path.join(ROOT, "docs", "**", "*.md"), recursive=True)
       + glob.glob(os.path.join(ROOT, "examples", "**", "*.md"), recursive=True))

broken = []
for md in mds:
    with open(md, encoding="utf-8") as f:
        text = f.read()
    base = os.path.dirname(md)
    for m in LINK.finditer(text):
        target = m.group(1).strip()
        # 외부/앵커/메일 링크는 제외
        if target.startswith(("http://", "https://", "#", "mailto:", "tel:")):
            continue
        path = target.split("#")[0].split("?")[0]
        if not path:
            continue
        # 절대 사이트 경로(/...)는 스킵(드묾)
        if path.startswith("/"):
            continue
        resolved = os.path.normpath(os.path.join(base, path))
        # 디렉터리 링크면 index.md 허용
        ok = os.path.exists(resolved)
        if not ok and os.path.isdir(resolved):
            ok = os.path.exists(os.path.join(resolved, "index.md"))
        if not ok:
            rel = os.path.relpath(md, ROOT)
            broken.append((rel, target))

if not broken:
    print("OK: 깨진 내부 링크 없음")
else:
    print("깨진 링크 %d개:" % len(broken))
    for src, tgt in broken:
        print("  %s  ->  %s" % (src, tgt))
