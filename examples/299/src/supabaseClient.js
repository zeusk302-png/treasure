// src/supabaseClient.js
// ── 브라우저(프론트)에서 쓰는 Supabase 클라이언트 ──────────────
//
// 여기서는 anon(publishable) 키만 씁니다.
// anon 키는 "공개돼도 되는 출입증"이라 화면(브라우저)에 노출돼도 됩니다.
// 단, 진짜 보안은 이 키가 아니라 Supabase의 RLS(행 수준 보안)가 책임집니다.
//
// VITE_ 접두가 붙은 값만 브라우저로 전달됩니다.
// 진짜 값은 .env.local 에 넣고, 깃허브에는 .env.example(빈 견본)만 올립니다.

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// 🟢 안전: anon(publishable) 키만 사용 — 브라우저로 가도 OK
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
