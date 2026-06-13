import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendKakaoNotification } from '@/lib/solapi'
import { z } from 'zod'

const bodySchema = z.object({
  taskId: z.string().uuid(),
})

export async function POST(request: Request) {
  const json = await request.json()
  const parsed = bodySchema.safeParse(json)

  if (!parsed.success) {
    return NextResponse.json({ error: '잘못된 요청' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '인증 필요' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('phone, display_name')
    .eq('id', user.id)
    .single()

  if (!profile?.phone) {
    return NextResponse.json({ error: '설정에서 알림 수신 전화번호를 먼저 등록해 주세요.' }, { status: 422 })
  }

  const { taskId } = parsed.data

  const { data: task, error } = await supabase
    .from('tasks')
    .select('id, title, status, due_date, memo')
    .eq('id', taskId)
    .single()

  if (error || !task) {
    return NextResponse.json({ error: '업무 없음' }, { status: 404 })
  }

  const dueDateLabel = task.due_date
    ? new Date(task.due_date).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
    : '미정'

  const statusLabel: Record<string, string> = {
    pending: '할일',
    in_progress: '진행중',
    done: '완료',
  }

  try {
    await sendKakaoNotification({
      to: profile.phone,
      templateId: process.env.KAKAO_TASK_TEMPLATE_ID!,
      variables: {
        '#{이름}': profile.display_name ?? '사용자',
        '#{업무명}': task.title,
        '#{마감일}': dueDateLabel,
        '#{메모}': task.memo ?? '없음',
        '#{상태}': statusLabel[task.status] ?? task.status,
        '#{서비스URL}': process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tataco.vercel.app',
      },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[notify/task] 발송 실패:', err)
    return NextResponse.json({ error: '발송 실패' }, { status: 500 })
  }
}
