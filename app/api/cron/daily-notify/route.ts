import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendKakaoNotification } from '@/lib/solapi'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('id, title, status, created_by')
    .eq('due_date', today)
    .neq('status', 'done')

  if (error) {
    console.error('[daily-notify] 업무 조회 실패:', error.message)
    return NextResponse.json({ error: '업무 조회 실패' }, { status: 500 })
  }

  if (!tasks || tasks.length === 0) {
    return NextResponse.json({ message: '오늘 마감 업무 없음' })
  }

  // 사용자별로 업무 묶기
  const groupedByUser = new Map<string, string[]>()
  for (const task of tasks) {
    if (!task.created_by) continue
    if (!groupedByUser.has(task.created_by)) {
      groupedByUser.set(task.created_by, [])
    }
    groupedByUser.get(task.created_by)!.push(task.title)
  }

  const dateLabel = `${new Date().getMonth() + 1}월 ${new Date().getDate()}일`
  let sentCount = 0

  for (const [userId, taskTitles] of groupedByUser.entries()) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('phone, display_name')
      .eq('id', userId)
      .single()

    if (!profile?.phone) continue

    try {
      await sendKakaoNotification({
        to: profile.phone,
        templateId: process.env.KAKAO_DAILY_TEMPLATE_ID!,
        variables: {
          '#{이름}': profile.display_name ?? '사용자',
          '#{날짜}': dateLabel,
          '#{업무목록}': taskTitles.map((t) => `· ${t}`).join('\n'),
          '#{서비스URL}': process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tataco.vercel.app',
        },
      })

      await supabase.from('notification_logs').insert({
        type: 'daily',
        phone: profile.phone,
        status: 'sent',
      })

      sentCount++
    } catch (err) {
      console.error('[daily-notify] 발송 실패:', err)
    }
  }

  console.log('[daily-notify] 발송 완료:', sentCount, '건')
  return NextResponse.json({ sent: sentCount })
}
