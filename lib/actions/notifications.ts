'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from './types'

export async function sendTaskNotification(taskId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/notify/task`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ taskId }),
    })

    if (!res.ok) {
      const body = await res.json()
      return { success: false, error: body.error ?? '발송 실패' }
    }

    return { success: true }
  } catch {
    return { success: false, error: '네트워크 오류' }
  }
}

export async function scheduleTaskNotification(
  taskId: string,
  scheduledAt: string,
): Promise<ActionResult<null>> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: '인증이 필요합니다.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('phone')
    .eq('id', user.id)
    .single()

  const phone = profile?.phone
  if (!phone) {
    return { data: null, error: '설정에서 알림 수신 전화번호를 먼저 등록해 주세요.' }
  }

  const { error } = await supabase.from('notification_schedules').insert({
    task_id: taskId,
    phone,
    scheduled_at: new Date(scheduledAt).toISOString(),
    status: 'pending',
  })

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: null, error: null }
}
