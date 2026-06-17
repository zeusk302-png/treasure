// src/App.jsx
// ── 화면(프론트) 컴포넌트 ─────────────────────────────────────
//
// 이 파일은 브라우저에서 그대로 실행됩니다.
// 그래서 여기서 import 하는 키는 무조건 "공개돼도 되는 anon 키"여야 합니다.
// service_role(secret) 키를 이런 파일에서 import 하면 즉시 🔴(유출)입니다.

import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient' // 🟢 anon 키만 들어 있는 클라이언트

export default function App() {
  const [posts, setPosts] = useState([])

  useEffect(() => {
    // 🟢 anon 키로 공개 데이터만 조회 — 무엇이 조회되는지는 RLS가 통제
    supabase
      .from('posts')
      .select('id, title')
      .then(({ data }) => setPosts(data ?? []))
  }, [])

  return (
    <ul>
      {posts.map((p) => (
        <li key={p.id}>{p.title}</li>
      ))}
    </ul>
  )
}
