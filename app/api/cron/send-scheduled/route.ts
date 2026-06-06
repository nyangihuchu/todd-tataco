import { createAdminClient } from '@/lib/supabase/admin'
import { sendKakaoNotification } from '@/lib/solapi'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Cron은 쿠키 세션 없이 실행되므로 service_role 클라이언트 사용
  const supabase = createAdminClient()

  // 발송 시각이 지난 pending 예약 목록 조회
  const { data: schedules, error } = await supabase
    .from('notification_schedules')
    .select('id, task_id, company_id, phone')
    .eq('status', 'pending')
    .lte('scheduled_at', new Date().toISOString())

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!schedules || schedules.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  let sentCount = 0
  const templateId = process.env.KAKAO_TASK_TEMPLATE_ID ?? ''

  const statusLabel: Record<string, string> = {
    pending: '대기',
    in_progress: '진행중',
    review: '확인요청',
    done: '완료',
  }

  for (const schedule of schedules) {
    if (!schedule.task_id) continue

    const { data: task } = await supabase
      .from('tasks')
      .select('title, status, due_date, memo, assignee_id, companies(name, contact_name), profiles!tasks_assignee_id_fkey(display_name)')
      .eq('id', schedule.task_id)
      .single()

    const company = task?.companies as { name: string; contact_name: string | null } | null
    const assignee = task?.profiles as unknown as { display_name: string | null } | null
    const dueDateLabel = task?.due_date
      ? new Date(task.due_date).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
      : '미정'

    try {
      await sendKakaoNotification({
        to: schedule.phone,
        templateId,
        variables: {
          '#{업체명}': company?.name ?? '',
          '#{담당자명}': company?.contact_name ?? '담당자',
          '#{업무명}': task?.title ?? '',
          '#{마감일}': dueDateLabel,
          '#{담당자}': assignee?.display_name ?? '미지정',
          '#{메모}': task?.memo ?? '없음',
          '#{상태}': statusLabel[task?.status ?? ''] ?? '',
          '#{서비스URL}': process.env.NEXT_PUBLIC_SITE_URL ?? '',
        },
      })

      await supabase
        .from('notification_schedules')
        .update({ status: 'sent' })
        .eq('id', schedule.id)

      sentCount++
    } catch (e) {
      const msg = e instanceof Error ? e.message : '알 수 없는 오류'
      await supabase
        .from('notification_schedules')
        .update({ status: 'failed', error_msg: msg })
        .eq('id', schedule.id)
    }
  }

  return NextResponse.json({ sent: sentCount, total: schedules.length })
}
