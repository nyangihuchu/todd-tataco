'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from './types'

// 업무 등록 폼에서 "즉시 발송" 선택 시 호출
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

// 업무 등록 폼에서 "예약 발송" 선택 시 호출 — notification_schedules에 저장
export async function scheduleTaskNotification(
  taskId: string,
  scheduledAt: string,
): Promise<ActionResult<null>> {
  const supabase = await createClient()

  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select('id, company_id, companies(phone)')
    .eq('id', taskId)
    .single()

  if (taskError || !task) {
    return { data: null, error: '업무 정보를 찾을 수 없습니다.' }
  }

  const company = task.companies as { phone: string | null } | null
  const phone = company?.phone

  if (!phone) {
    return { data: null, error: '업체에 전화번호가 등록되어 있지 않습니다.' }
  }

  const { error } = await supabase.from('notification_schedules').insert({
    task_id: taskId,
    company_id: task.company_id,
    phone,
    scheduled_at: new Date(scheduledAt).toISOString(),
    status: 'pending',
  })

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: null, error: null }
}
