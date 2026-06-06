import { createClient } from '@/lib/supabase/server'
import { sendKakaoNotification } from '@/lib/solapi'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

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

  for (const schedule of schedules) {
    if (!schedule.task_id) continue

    const { data: task } = await supabase
      .from('tasks')
      .select('title, due_date, companies(name)')
      .eq('id', schedule.task_id)
      .single()

    const company = task?.companies as { name: string } | null

    try {
      await sendKakaoNotification({
        to: schedule.phone,
        templateId,
        variables: {
          '#{업무명}': task?.title ?? '',
          '#{업체명}': company?.name ?? '',
          '#{마감일}': task?.due_date ?? '미정',
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
