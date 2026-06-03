'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { TaskWithCompany } from '@/lib/actions/tasks'

const DAYS_OF_WEEK = ['일', '월', '화', '수', '목', '금', '토']

// priority 값은 DB에서 string이므로 리터럴 유니언으로 별도 정의
type TaskPriority = 'high' | 'medium' | 'low'
type TaskStatus = 'pending' | 'in_progress' | 'review' | 'done'

const priorityDotColor: Record<TaskPriority, string> = {
  high: 'bg-rose-500',
  medium: 'bg-amber-400',
  low: 'bg-slate-400',
}

const priorityLabel: Record<TaskPriority, string> = {
  high: '높음',
  medium: '보통',
  low: '낮음',
}

const statusLabel: Record<TaskStatus, string> = {
  pending: '대기',
  in_progress: '진행중',
  review: '확인요청',
  done: '완료',
}

// priority/status 문자열을 리터럴 타입으로 안전하게 좁히는 헬퍼
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
  // 서버에서 조회한 업무 목록 (기본값 빈 배열)
  tasks?: TaskWithCompany[]
}

export function MonthlyCalendar({ tasks = [] }: MonthlyCalendarProps) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const today = now.toISOString().split('T')[0]

  const calendarDays = useMemo(() => {
    const firstDayOfWeek = new Date(year, month, 1).getDay()
    const lastDate = new Date(year, month + 1, 0).getDate()
    const days: (number | null)[] = []
    for (let i = 0; i < firstDayOfWeek; i++) days.push(null)
    for (let d = 1; d <= lastDate; d++) days.push(d)
    return days
  }, [year, month])

  // 특정 날짜의 마감 업무 필터링
  function getTasksForDay(day: number): TaskWithCompany[] {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return tasks.filter((t) => t.due_date === dateStr)
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
      {/* 네비게이션 */}
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

      {/* 요일 헤더 */}
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

      {/* 날짜 그리드 */}
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
                            getPriorityDotColor(task.priority),
                          )}
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
                        <p className='text-xs text-muted-foreground'>{task.company_name}</p>
                        <div className='flex gap-1'>
                          <Badge variant='outline' className='text-xs'>
                            {getPriorityLabel(task.priority)}
                          </Badge>
                          <Badge variant='secondary' className='text-xs'>
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
