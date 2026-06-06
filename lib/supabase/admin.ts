import { createClient } from '@supabase/supabase-js'
import { type Database } from './database.types'

// RLS를 우회하는 서비스 역할 클라이언트 — 서버 전용 (Route Handler, Server Action)
// 쿠키 세션 없이 동작하므로 Cron 라우트 등 인증 없는 서버 컨텍스트에서 사용
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
