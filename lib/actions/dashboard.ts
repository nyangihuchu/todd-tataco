'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from './types'

// 대시보드 통계 집계 결과 타입
export type DashboardStats = {
  todayDueCount: number
  inProgressCount: number
  doneCount: number
  overdueCount: number
  recentComments: RecentComment[]
}

// 최근 댓글 항목 타입 (작성자명, 업무명 포함)
export type RecentComment = {
  id: string
  content: string
  created_at: string
  task_id: string
  author_name: string | null
  task_title: string | null
}

// Supabase JOIN 응답의 중간 타입 (평탄화 전)
type CommentWithRelations = {
  id: string
  content: string
  created_at: string
  task_id: string
  profiles: { display_name: string | null } | null
  tasks: { title: string | null } | null
}

// 대시보드 핵심 통계 조회
// - 오늘 마감(done 제외), 진행중, 완료 카운트
// - 최근 댓글 5개 (작성자명, 업무명 포함)
export async function getDashboardStats(): Promise<ActionResult<DashboardStats>> {
  const supabase = await createClient()

  // 오늘 날짜 (YYYY-MM-DD 형식)
  const today = new Date().toISOString().split('T')[0]

  // 5개의 쿼리를 병렬로 실행하여 응답 시간 최소화
  const [todayDueResult, inProgressResult, doneResult, overdueResult, commentsResult] =
    await Promise.all([
      // 오늘 마감이고 완료되지 않은 업무 카운트
      supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('due_date', today)
        .neq('status', 'done'),

      // 진행중 업무 카운트
      supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'in_progress'),

      // 완료 업무 카운트
      supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'done'),

      // 지연 업무 카운트 (마감일 초과 + 완료 아님)
      supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .lt('due_date', today)
        .neq('status', 'done'),

      // 최근 댓글 5개 (작성자 프로필, 업무 제목 JOIN)
      supabase
        .from('comments')
        .select('id, content, created_at, task_id, profiles(display_name), tasks(title)')
        .order('created_at', { ascending: false })
        .limit(5),
    ])

  // 각 쿼리 에러 확인
  if (todayDueResult.error) {
    return { data: null, error: todayDueResult.error.message }
  }
  if (inProgressResult.error) {
    return { data: null, error: inProgressResult.error.message }
  }
  if (doneResult.error) {
    return { data: null, error: doneResult.error.message }
  }
  if (overdueResult.error) {
    return { data: null, error: overdueResult.error.message }
  }
  if (commentsResult.error) {
    return { data: null, error: commentsResult.error.message }
  }

  // 댓글 JOIN 결과를 평탄화하여 RecentComment 배열로 변환
  const recentComments: RecentComment[] = (
    (commentsResult.data ?? []) as CommentWithRelations[]
  ).map((c) => ({
    id: c.id,
    content: c.content,
    created_at: c.created_at,
    task_id: c.task_id,
    author_name: c.profiles?.display_name ?? null,
    task_title: c.tasks?.title ?? null,
  }))

  return {
    data: {
      todayDueCount: todayDueResult.count ?? 0,
      inProgressCount: inProgressResult.count ?? 0,
      doneCount: doneResult.count ?? 0,
      overdueCount: overdueResult.count ?? 0,
      recentComments,
    },
    error: null,
  }
}

// 차트용 집계 타입
export type ChartStats = {
  statusCounts: { status: string; label: string; count: number; fill: string }[]
  companyCounts: { name: string; count: number }[]
}

// 상태별·업체별 업무 수 집계 (차트용)
export async function getChartStats(): Promise<ActionResult<ChartStats>> {
  const supabase = await createClient()

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('status, companies(name)')

  if (error) return { data: null, error: error.message }

  // 상태별 집계
  const statusMap: Record<string, number> = { pending: 0, in_progress: 0, review: 0, done: 0 }
  for (const task of tasks ?? []) {
    if (task.status in statusMap) statusMap[task.status]++
  }

  const statusCounts = [
    { status: 'pending',    label: '대기',     count: statusMap.pending,    fill: 'var(--color-pending)'    },
    { status: 'in_progress',label: '진행중',   count: statusMap.in_progress,fill: 'var(--color-in_progress)'},
    { status: 'review',     label: '확인요청', count: statusMap.review,     fill: 'var(--color-review)'     },
    { status: 'done',       label: '완료',     count: statusMap.done,       fill: 'var(--color-done)'       },
  ]

  // 업체별 집계 (상위 10개)
  const companyMap: Record<string, number> = {}
  for (const task of tasks ?? []) {
    const company = task.companies as { name: string } | null
    if (!company?.name) continue
    companyMap[company.name] = (companyMap[company.name] ?? 0) + 1
  }
  const companyCounts = Object.entries(companyMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  return { data: { statusCounts, companyCounts }, error: null }
}
