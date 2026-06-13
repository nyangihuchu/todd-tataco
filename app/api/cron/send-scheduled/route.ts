import { createAdminClient } from '@/lib/supabase/admin'
import { sendKakaoNotification } from '@/lib/solapi'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  const { data: schedules, error } = await supabase
    .from('notification_schedules')
    .select('id, task_id, phone')
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
    pending: '할일',
    in_progress: '진행중',
    done: '완료',
  }

  for (const schedule of schedules) {
    if (!schedule.task_id) continue

    const { data: task } = await supabase
      .from('tasks')
      .select('title, status, due_date, memo')
      .eq('id', schedule.task_id)
      .single()

    const dueDateLabel = task?.due_date
      ? new Date(task.due_date).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
      : '미정'

    try {
      await sendKakaoNotification({
        to: schedule.phone,
        templateId,
        variables: {
          '#{업무명}': task?.title ?? '',
          '#{마감일}': dueDateLabel,
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
