'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from './types'

export type TodayTask = {
  id: string
  title: string
  priority: string
  status: string
}

export type DashboardStats = {
  todayDueCount: number
  inProgressCount: number
  doneCount: number
  overdueCount: number
  weeklyDueCount: number
  todayTasks: TodayTask[]
}

export async function getDashboardStats(): Promise<ActionResult<DashboardStats>> {
  const supabase = await createClient()

  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
  const weekEnd = new Date(Date.now() + 6 * 86400000).toISOString().split('T')[0]

  const [
    todayDueResult,
    inProgressResult,
    doneResult,
    overdueResult,
    weeklyDueResult,
    todayTasksResult,
  ] = await Promise.all([
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
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .gte('due_date', today)
      .lte('due_date', weekEnd)
      .neq('status', 'done'),

    supabase
      .from('tasks')
      .select('id, title, priority, status')
      .gte('due_date', today)
      .lt('due_date', tomorrow)
      .neq('status', 'done')
      .order('priority', { ascending: true }),
  ])

  if (todayDueResult.error) return { data: null, error: todayDueResult.error.message }
  if (inProgressResult.error) return { data: null, error: inProgressResult.error.message }
  if (doneResult.error) return { data: null, error: doneResult.error.message }
  if (overdueResult.error) return { data: null, error: overdueResult.error.message }
  if (weeklyDueResult.error) return { data: null, error: weeklyDueResult.error.message }
  if (todayTasksResult.error) return { data: null, error: todayTasksResult.error.message }

  return {
    data: {
      todayDueCount: todayDueResult.count ?? 0,
      inProgressCount: inProgressResult.count ?? 0,
      doneCount: doneResult.count ?? 0,
      overdueCount: overdueResult.count ?? 0,
      weeklyDueCount: weeklyDueResult.count ?? 0,
      todayTasks: (todayTasksResult.data ?? []) as TodayTask[],
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
