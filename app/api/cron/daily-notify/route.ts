import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendKakaoNotificationBulk, type KakaoNotificationPayload } from '@/lib/solapi'

// Vercel Cron이 호출하는 엔드포인트 — vercel.json에서 매일 UTC 00:00 (KST 09:00) 실행
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 })
  }

  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

  // 오늘 마감이고 완료되지 않은 업무 조회 (업체 정보 포함)
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('id, title, status, company_id, companies(id, name, contact_name, phone)')
    .eq('due_date', today)
    .neq('status', 'done')

  if (error) {
    console.error('[daily-notify] 업무 조회 실패:', error.message)
    return NextResponse.json({ error: '업무 조회 실패' }, { status: 500 })
  }

  if (!tasks || tasks.length === 0) {
    return NextResponse.json({ message: '오늘 마감 업무 없음' })
  }

  // 업체별로 업무 묶기
  const groupedByCompany = new Map<
    string,
    { company: { id: string; name: string; contact_name: string | null; phone: string | null }; taskTitles: string[] }
  >()

  for (const task of tasks) {
    const company = task.companies as { id: string; name: string; contact_name: string | null; phone: string | null } | null
    if (!company?.phone) continue

    if (!groupedByCompany.has(company.id)) {
      groupedByCompany.set(company.id, { company, taskTitles: [] })
    }
    groupedByCompany.get(company.id)!.taskTitles.push(task.title)
  }

  const payloads: KakaoNotificationPayload[] = []
  const logInserts: {
    type: string
    company_id: string
    phone: string
    status: string
  }[] = []

  const dateLabel = `${new Date().getMonth() + 1}월 ${new Date().getDate()}일`

  for (const { company, taskTitles } of groupedByCompany.values()) {
    payloads.push({
      to: company.phone!,
      templateId: process.env.KAKAO_DAILY_TEMPLATE_ID!,
      variables: {
        '#{업체명}': company.name,
        '#{담당자명}': company.contact_name ?? '담당자',
        '#{날짜}': dateLabel,
        '#{업무목록}': taskTitles.map((t) => `· ${t}`).join('\n'),
        '#{서비스URL}': process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tataco.vercel.app',
      },
    })
    logInserts.push({ type: 'daily', company_id: company.id, phone: company.phone!, status: 'sent' })
  }

  if (payloads.length === 0) {
    return NextResponse.json({ message: '전화번호 등록된 업체 없음' })
  }

  try {
    await sendKakaoNotificationBulk(payloads)

    // service_role 클라이언트로 RLS 우회 후 로그 저장
    const adminClient = createAdminClient()
    const { error: logError } = await adminClient
      .from('notification_logs')
      .insert(logInserts)
    if (logError) {
      console.error('[daily-notify] 로그 저장 실패:', logError.message)
    }

    console.log('[daily-notify] 발송 완료:', logInserts.length, '건')
    return NextResponse.json({ sent: logInserts.length })
  } catch (err) {
    console.error('[daily-notify] 발송 실패:', err)
    return NextResponse.json({ error: '발송 실패' }, { status: 500 })
  }
}
