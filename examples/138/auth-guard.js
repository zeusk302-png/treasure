// ============================================================
// 실습 138 — auth-guard.js  (★ 이번 실습의 주인공: 문지기 / 라우트 가드 ★)
//
// 하는 일: 보호된 페이지가 열리자마자 "이 사람 로그인했나?"를 검사해서
//   - 로그인 안 했으면  → 곧바로 login.html로 돌려보낸다 (= 페이지 접근 차단)
//   - 로그인 했으면     → 숨겨뒀던 내용을 보여준다 (= 통과)
//
// '라우트 가드(route guard)'란 특정 페이지(경로) 앞을 지키는 문지기를 뜻합니다.
// 출입증(로그인 세션)이 없는 사람을 들여보내지 않는, 건물 입구의 경비원이라고 생각하세요.
// ============================================================

// 검사하는 동안 잠깐 보여줄 '확인 중' 화면과, 통과해야 보이는 '진짜 내용'을 잡아둡니다.
const guardChecking = document.getElementById("guardChecking");
const protectedContent = document.getElementById("protectedContent");

// 이 함수가 문지기 본체입니다. 페이지가 열리면 곧바로 한 번 실행됩니다.
async function guard() {
  // getUser()는 브라우저에 저장된 로그인 세션을 Supabase 서버에 물어봐서
  // "이 사람 진짜 로그인한 유효한 사용자 맞아?"를 확인하고 사용자 정보를 돌려줍니다.
  //  - 로그인 상태면  → data.user 안에 이메일·id 등이 들어 있음
  //  - 로그아웃 상태면 → data.user 가 null
  const { data, error } = await db.auth.getUser();

  // ── 비로그인(또는 세션 만료/오류): 문 앞에서 돌려보냅니다 ──
  if (error || !data.user) {
    // 어디서 막혔는지 알 수 있게, 돌아온 뒤 다시 데려다줄 주소를 함께 넘깁니다.
    // 예) login.html?redirect=mypage.html  → 로그인 성공 후 mypage.html로 복귀
    const here = encodeURIComponent(location.pathname.split("/").pop() || "mypage.html");

    // replace를 쓰는 이유: history를 '교체'하므로, 로그인 페이지에서 '뒤로 가기'를 눌러도
    // 이 보호 페이지로 되돌아오지 못합니다. (href로 보내면 뒤로 가기로 다시 들어올 수 있음)
    location.replace("login.html?redirect=" + here);
    return; // 여기서 멈춤 → 아래 '통과 처리'는 실행되지 않음 = 내용이 안 보임
  }

  // ── 로그인 확인됨: 통과! 숨겨뒀던 내용을 보여줍니다 ──
  guardChecking.hidden = true;      // '확인 중' 화면 숨기기
  protectedContent.hidden = false;  // 진짜 내용 보이기

  // app.js가 사용할 수 있도록, 확인된 사용자 정보를 전역에 살짝 남겨둡니다.
  window.currentUser = data.user;

  // app.js에게 "가드 통과했어, 이제 화면 그려도 돼!"라고 알려줍니다.
  document.dispatchEvent(new CustomEvent("guard:passed", { detail: data.user }));
}

// 페이지가 열리면 곧바로 문지기를 실행합니다.
guard();
