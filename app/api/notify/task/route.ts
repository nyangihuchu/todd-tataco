import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendKakaoNotification } from '@/lib/solapi'
import { z } from 'zod'

const bodySchema = z.object({
  taskId: z.string().uuid(),
})

// 업무 등록 시 관련 업체에 즉시 알림 발송 (선택 시에만 호출)
export async function POST(request: Request) {
  const json = await request.json()
  const parsed = bodySchema.safeParse(json)

  if (!parsed.success) {
    return NextResponse.json({ error: '잘못된 요청' }, { status: 400 })
  }

  const supabase = await createClient()

  // 인증 확인
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '인증 필요' }, { status: 401 })
  }

  const { taskId } = parsed.data

  // profiles가 assignee_id, created_by 두 컬럼으로 참조되므로 컬럼명 힌트 필요
  const { data: task, error } = await supabase
    .from('tasks')
    .select('id, title, status, due_date, memo, assignee_id, companies(id, name, contact_name, phone), profiles!tasks_assignee_id_fkey(display_name)')
    .eq('id', taskId)
    .single()

  if (error || !task) {
    return NextResponse.json({ error: '업무 없음' }, { status: 404 })
  }

  const company = task.companies as { id: string; name: string; contact_name: string | null; phone: string | null } | null
  if (!company?.phone) {
    return NextResponse.json({ error: '업체 전화번호 미등록' }, { status: 422 })
  }

  const assignee = task.profiles as unknown as { display_name: string | null } | null
  const dueDateLabel = task.due_date
    ? new Date(task.due_date).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
    : '미정'

  const statusLabel: Record<string, string> = {
    pending: '대기',
    in_progress: '진행중',
    review: '확인요청',
    done: '완료',
  }

  try {
    await sendKakaoNotification({
      to: company.phone,
      templateId: process.env.KAKAO_TASK_TEMPLATE_ID!,
      variables: {
        '#{업체명}': company.name,
        '#{담당자명}': company.contact_name ?? '담당자',
        '#{업무명}': task.title,
        '#{마감일}': dueDateLabel,
        '#{담당자}': assignee?.display_name ?? '미지정',
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
