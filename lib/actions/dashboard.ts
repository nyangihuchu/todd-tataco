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
