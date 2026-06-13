'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from './types'

export type DashboardStats = {
  todayDueCount: number
  inProgressCount: number
  doneCount: number
  overdueCount: number
  recentComments: RecentComment[]
}

export type RecentComment = {
  id: string
  content: string
  created_at: string
  task_id: string
  author_name: string | null
  task_title: string | null
}

type CommentWithRelations = {
  id: string
  content: string
  created_at: string
  task_id: string
  profiles: { display_name: string | null } | null
  tasks: { title: string | null } | null
}

export async function getDashboardStats(): Promise<ActionResult<DashboardStats>> {
  const supabase = await createClient()

  const today = new Date().toISOString().split('T')[0]

  const [todayDueResult, inProgressResult, doneResult, overdueResult, commentsResult] =
    await Promise.all([
      supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('due_date', today)
        .neq('status', 'done'),

      supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'in_progress'),

      supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'done'),

      supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .lt('due_date', today)
        .neq('status', 'done'),

      supabase
        .from('comments')
        .select('id, content, created_at, task_id, profiles(display_name), tasks(title)')
        .order('created_at', { ascending: false })
        .limit(5),
    ])

  if (todayDueResult.error) return { data: null, error: todayDueResult.error.message }
  if (inProgressResult.error) return { data: null, error: inProgressResult.error.message }
  if (doneResult.error) return { data: null, error: doneResult.error.message }
  if (overdueResult.error) return { data: null, error: overdueResult.error.message }
  if (commentsResult.error) return { data: null, error: commentsResult.error.message }

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

export type ChartStats = {
  statusCounts: { status: string; label: string; count: number; fill: string }[]
}

export async function getChartStats(): Promise<ActionResult<ChartStats>> {
  const supabase = await createClient()

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('status')

  if (error) return { data: null, error: error.message }

  const statusMap: Record<string, number> = { pending: 0, in_progress: 0, done: 0 }
  for (const task of tasks ?? []) {
    if (task.status in statusMap) statusMap[task.status]++
  }

  const statusCounts = [
    { status: 'pending',     label: '할일',   count: statusMap.pending,     fill: 'var(--color-pending)'     },
    { status: 'in_progress', label: '진행중', count: statusMap.in_progress, fill: 'var(--color-in_progress)' },
    { status: 'done',        label: '완료',   count: statusMap.done,        fill: 'var(--color-done)'        },
  ]

  return { data: { statusCounts }, error: null }
}
