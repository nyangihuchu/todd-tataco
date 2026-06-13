'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { TaskWithCategory } from '@/lib/actions/tasks'
import type { Category } from '@/lib/actions/categories'

const DAYS_OF_WEEK = ['일', '월', '화', '수', '목', '금', '토']

type TaskPriority = 'high' | 'medium' | 'low'
type TaskStatus = 'pending' | 'in_progress' | 'done'

const priorityDotColor: Record<TaskPriority, string> = {
  high: 'bg-rose-500',
  medium: 'bg-amber-400',
  low: 'bg-slate-400',
}

const priorityBadgeClass: Record<TaskPriority, string> = {
  high: 'border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-400',
  medium: 'border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400',
  low: 'border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400',
}

const priorityLabel: Record<TaskPriority, string> = {
  high: '높음',
  medium: '보통',
  low: '낮음',
}

const statusLabel: Record<TaskStatus, string> = {
  pending: '대기',
  in_progress: '진행중',
  done: '완료',
}

const statusBadgeClass: Record<TaskStatus, string> = {
  pending: 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400',
  in_progress: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400',
  done: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400',
}

function getPriorityDotColor(priority: string): string {
  return priorityDotColor[priority as TaskPriority] ?? 'bg-slate-400'
}

function getPriorityLabel(priority: string): string {
  return priorityLabel[priority as TaskPriority] ?? priority
}

function getStatusLabel(status: string): string {
  return statusLabel[status as TaskStatus] ?? status
}

interface MonthlyCalendarProps {
  tasks?: TaskWithCategory[]
  categories?: Category[]
  selectedCategoryId?: string
}

export function MonthlyCalendar({
  tasks = [],
  categories: _categories = [],
  selectedCategoryId = '',
}: MonthlyCalendarProps) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  const calendarDays = useMemo(() => {
    const firstDayOfWeek = new Date(year, month, 1).getDay()
    const lastDate = new Date(year, month + 1, 0).getDate()
    const days: (number | null)[] = []
    for (let i = 0; i < firstDayOfWeek; i++) days.push(null)
    for (let d = 1; d <= lastDate; d++) days.push(d)
    return days
  }, [year, month])

  function getTasksForDay(day: number): TaskWithCategory[] {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return tasks.filter((t) => {
      if (!t.due_date?.startsWith(dateStr)) return false
      if (selectedCategoryId && t.category_id !== selectedCategoryId) return false
      return true
    })
  }

  function prevMonth() {
    if (month === 0) { setYear((y) => y - 1); setMonth(11) }
    else setMonth((m) => m - 1)
  }

  function nextMonth() {
    if (month === 11) { setYear((y) => y + 1); setMonth(0) }
    else setMonth((m) => m + 1)
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <Button variant='ghost' size='icon' onClick={prevMonth}>
          <ChevronLeft size={18} />
        </Button>
        <h2 className='text-lg font-semibold'>
          {year}년 {month + 1}월
        </h2>
        <Button variant='ghost' size='icon' onClick={nextMonth}>
          <ChevronRight size={18} />
        </Button>
      </div>

      <div className='grid grid-cols-7 text-center'>
        {DAYS_OF_WEEK.map((day, i) => (
          <div
            key={day}
            className={cn(
              'py-2 text-xs font-medium text-muted-foreground',
              i === 0 && 'text-rose-500',
              i === 6 && 'text-blue-500',
            )}
          >
            {day}
          </div>
        ))}
      </div>

      <div className='grid grid-cols-7 gap-px rounded-lg border bg-border'>
        {calendarDays.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className='min-h-20 bg-muted/30' />
          }

          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const isToday = dateStr === today
          const dayTasks = getTasksForDay(day)
          const visibleTasks = dayTasks.slice(0, 2)
          const extraCount = dayTasks.length - 2

          return (
            <Popover key={day}>
              <PopoverTrigger asChild>
                <div className='min-h-20 cursor-pointer bg-background p-1 hover:bg-accent/30'>
                  <div className='mb-1 flex justify-end'>
                    <span
                      className={cn(
                        'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
                        isToday && 'bg-primary text-primary-foreground',
                        !isToday && idx % 7 === 0 && 'text-rose-500',
                        !isToday && idx % 7 === 6 && 'text-blue-500',
                      )}
                    >
                      {day}
                    </span>
                  </div>
                  <div className='space-y-0.5'>
                    {visibleTasks.map((task) => (
                      <div key={task.id} className='flex items-center gap-1 rounded px-1'>
                        <span
                          className={cn(
                            'h-1.5 w-1.5 shrink-0 rounded-full',
                            !task.category_color &&
                              getPriorityDotColor(task.priority),
                          )}
                          style={
                            task.category_color
                              ? { background: task.category_color }
                              : undefined
                          }
                        />
                        <span className='truncate text-xs'>{task.title}</span>
                      </div>
                    ))}
                    {extraCount > 0 && (
                      <p className='px-1 text-xs text-muted-foreground'>+{extraCount}개</p>
                    )}
                  </div>
                </div>
              </PopoverTrigger>
              <PopoverContent className='w-72 p-3' align='start'>
                <p className='mb-2 text-sm font-semibold'>
                  {month + 1}월 {day}일 마감 업무
                </p>
                {dayTasks.length === 0 ? (
                  <p className='text-xs text-muted-foreground'>이 날은 마감 업무가 없습니다.</p>
                ) : (
                  <div className='space-y-2'>
                    {dayTasks.map((task) => (
                      <div key={task.id} className='rounded-md border p-2 space-y-1'>
                        <p className='text-sm font-medium'>{task.title}</p>
                        {task.category_name && (
                          <p className='flex items-center gap-1 text-xs text-muted-foreground'>
                            {task.category_color && (
                              <span
                                className='inline-block h-2.5 w-2.5 shrink-0 rounded-full'
                                style={{ background: task.category_color }}
                              />
                            )}
                            {task.category_name}
                          </p>
                        )}
                        <div className='flex gap-1'>
                          <Badge
                            variant='outline'
                            className={cn(
                              'text-xs',
                              priorityBadgeClass[task.priority as TaskPriority] ??
                                priorityBadgeClass.low,
                            )}
                          >
                            {getPriorityLabel(task.priority)}
                          </Badge>
                          <Badge
                            variant='outline'
                            className={cn(
                              'text-xs',
                              statusBadgeClass[task.status as TaskStatus] ??
                                statusBadgeClass.pending,
                            )}
                          >
                            {getStatusLabel(task.status)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </PopoverContent>
            </Popover>
          )
        })}
      </div>
    </div>
  )
}
