'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { TaskWithCategory } from '@/lib/actions/tasks'

const DAYS_OF_WEEK = ['일', '월', '화', '수', '목', '금', '토']

type TaskPriority = 'high' | 'medium' | 'low'

const priorityDotColor: Record<TaskPriority, string> = {
  high: 'bg-rose-500',
  medium: 'bg-amber-400',
  low: 'bg-slate-400',
}

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  d.setDate(d.getDate() - d.getDay())
  d.setHours(0, 0, 0, 0)
  return d
}

function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return d
  })
}

function toDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

interface WeeklyCalendarProps {
  tasks?: TaskWithCategory[]
  selectedCategoryId?: string
}

export function WeeklyCalendar({ tasks = [], selectedCategoryId = '' }: WeeklyCalendarProps) {
  const now = new Date()
  const todayStr = toDateStr(now)

  const [weekStart, setWeekStart] = useState(() => getWeekStart(now))

  const weekDays = getWeekDays(weekStart)

  const weekLabel = (() => {
    const start = weekDays[0]
    const end = weekDays[6]
    if (start.getMonth() === end.getMonth()) {
      return `${start.getFullYear()}년 ${start.getMonth() + 1}월 ${start.getDate()}일 — ${end.getDate()}일`
    }
    return `${start.getFullYear()}년 ${start.getMonth() + 1}월 ${start.getDate()}일 — ${end.getMonth() + 1}월 ${end.getDate()}일`
  })()

  function prevWeek() {
    setWeekStart((prev) => {
      const d = new Date(prev)
      d.setDate(d.getDate() - 7)
      return d
    })
  }

  function nextWeek() {
    setWeekStart((prev) => {
      const d = new Date(prev)
      d.setDate(d.getDate() + 7)
      return d
    })
  }

  function getTasksForDate(date: Date): TaskWithCategory[] {
    const dateStr = toDateStr(date)
    return tasks.filter((t) => {
      if (!t.due_date?.startsWith(dateStr)) return false
      if (selectedCategoryId && t.category_id !== selectedCategoryId) return false
      return true
    })
  }

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between'>
        <Button variant='ghost' size='icon' onClick={prevWeek}>
          <ChevronLeft size={18} />
        </Button>
        <span className='text-sm font-medium'>{weekLabel}</span>
        <Button variant='ghost' size='icon' onClick={nextWeek}>
          <ChevronRight size={18} />
        </Button>
      </div>

      <div className='overflow-x-auto'>
        <div className='grid min-w-[560px] grid-cols-7 gap-px rounded-lg border bg-border'>
          {weekDays.map((date, idx) => {
            const dateStr = toDateStr(date)
            const isToday = dateStr === todayStr
            const dayTasks = getTasksForDate(date)

            return (
              <div key={dateStr} className='flex flex-col bg-background'>
                <div
                  className={cn(
                    'border-b px-2 py-1.5 text-center',
                    isToday && 'bg-primary/10',
                  )}
                >
                  <p
                    className={cn(
                      'text-xs font-medium text-muted-foreground',
                      idx === 0 && 'text-rose-500',
                      idx === 6 && 'text-blue-500',
                    )}
                  >
                    {DAYS_OF_WEEK[idx]}
                  </p>
                  <p
                    className={cn(
                      'mx-auto flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
                      isToday && 'bg-primary text-primary-foreground',
                    )}
                  >
                    {date.getDate()}
                  </p>
                </div>

                <div className='min-h-24 space-y-0.5 p-1'>
                  {dayTasks.map((task) => (
                    <div
                      key={task.id}
                      className='flex items-center gap-1 rounded px-1 py-0.5 hover:bg-accent/50'
                    >
                      <span
                        className={cn(
                          'h-1.5 w-1.5 shrink-0 rounded-full',
                          !task.category_color &&
                            (priorityDotColor[task.priority as TaskPriority] ??
                              priorityDotColor.low),
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
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
