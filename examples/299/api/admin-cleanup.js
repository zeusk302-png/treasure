// api/admin-cleanup.js
// ── 서버에서만 도는 코드 (브라우저로 절대 안 감) ────────────────
//
// 이 파일은 Vercel의 서버리스 함수(서버 측)에서만 실행됩니다.
// 브라우저로 번들되어 내려가지 않으므로, 여기서는 service_role(secret) 키를
// 써도 됩니다. 단, 값은 반드시 서버 환경변수(process.env)에서만 읽습니다.
//
// 핵심 규칙:
//  - VITE_ 접두가 "없는" SUPABASE_SERVICE_ROLE_KEY 만 사용 → 브라우저로 안 나감
//  - 진짜 값은 .env.local / Vercel 환경변수에만 있고, 코드에 직접 박지 않음

import { createClient } from '@supabase/supabase-js'

// 🟢 안전(서버 한정): service_role 키를 서버 환경변수에서만 읽음
const supabaseUrl = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY // ← 절대 VITE_ 접두 금지

// service_role 클라이언트는 RLS를 통째로 우회합니다(마스터키).
// 그래서 오직 서버에서, 관리자 작업에만 씁니다.
const admin = createClient(supabaseUrl, serviceRoleKey)

export default async function handler(req, res) {
  // 예: 30일 지난 임시 글 정리 (관리자만 가능한 작업)
  const { error } = await admin
    .from('posts')
    .delete()
    .lt('created_at', new Date(Date.now() - 30 * 864e5).toISOString())

  if (error) return res.status(500).json({ ok: false })
  return res.status(200).json({ ok: true })
}
