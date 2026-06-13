'use client'

import { useState, useEffect, useTransition } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { updateTask } from '@/lib/actions/tasks'
import { TaskFormModal } from '@/components/tasks/task-form-modal'
import type { TaskWithCategory } from '@/lib/actions/tasks'
import type { Category } from '@/lib/actions/categories'

type TaskPriority = 'high' | 'medium' | 'low'

const priorityLabel: Record<TaskPriority, string> = {
  high: '높음',
  medium: '보통',
  low: '낮음',
}

const priorityBadgeClass: Record<TaskPriority, string> = {
  high: 'border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-400',
  medium:
    'border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400',
  low: 'border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400',
}

const DAY_LABELS = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']

function toDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function formatDateLabel(date: Date): string {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${DAY_LABELS[date.getDay()]})`
}

interface DailyCalendarProps {
  tasks?: TaskWithCategory[]
  categories?: Category[]
  selectedCategoryId?: string
}

export function DailyCalendar({
  tasks = [],
  categories = [],
  selectedCategoryId = '',
}: DailyCalendarProps) {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [localTasks, setLocalTasks] = useState<TaskWithCategory[]>(tasks)
  const [modalOpen, setModalOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setLocalTasks(tasks)
  }, [tasks])

  const todayStr = toDateStr(new Date())
  const dateStr = toDateStr(selectedDate)
  const isToday = dateStr === todayStr

  const dayTasks = localTasks.filter((t) => {
    if (!t.due_date?.startsWith(dateStr)) return false
    if (selectedCategoryId && t.category_id !== selectedCategoryId) return false
    return true
  })

  function prevDay() {
    setSelectedDate((prev) => {
      const d = new Date(prev)
      d.setDate(d.getDate() - 1)
      return d
    })
  }

  function nextDay() {
    setSelectedDate((prev) => {
      const d = new Date(prev)
      d.setDate(d.getDate() + 1)
      return d
    })
  }

  function handleToggleStatus(task: TaskWithCategory) {
    const newStatus = task.status === 'done' ? 'pending' : 'done'
    startTransition(async () => {
      const result = await updateTask(task.id, { status: newStatus })
      if (result.error) {
        toast.error(`상태 변경 실패: ${result.error}`)
        return
      }
      setLocalTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
      )
    })
  }

  const presetValues = {
    due_date: `${dateStr}T00:00:00.000Z`,
  } as unknown as TaskWithCategory

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <Button variant='ghost' size='icon' onClick={prevDay}>
          <ChevronLeft size={18} />
        </Button>
        <span className={cn('text-sm font-medium', isToday && 'text-primary')}>
          {formatDateLabel(selectedDate)}
          {isToday && (
            <span className='ml-1.5 text-xs font-normal text-muted-foreground'>오늘</span>
          )}
        </span>
        <Button variant='ghost' size='icon' onClick={nextDay}>
          <ChevronRight size={18} />
        </Button>
      </div>

      <div className='rounded-lg border'>
        {dayTasks.length === 0 ? (
          <p className='px-4 py-8 text-center text-sm text-muted-foreground'>
            이 날은 마감 업무가 없습니다.
          </p>
        ) : (
          <div className='divide-y'>
            {dayTasks.map((task) => (
              <div key={task.id} className='flex items-center gap-3 px-4 py-3'>
                <Checkbox
                  checked={task.status === 'done'}
                  onCheckedChange={() => handleToggleStatus(task)}
                  disabled={isPending}
                />
                <div className='min-w-0 flex-1'>
                  <p
                    className={cn(
                      'text-sm',
                      task.status === 'done' && 'text-muted-foreground line-through',
                    )}
                  >
                    {task.title}
                  </p>
                  {task.category_name && (
                    <p className='mt-0.5 flex items-center gap-1 text-xs text-muted-foreground'>
                      {task.category_color && (
                        <span
                          className='inline-block h-2 w-2 rounded-full'
                          style={{ background: task.category_color }}
                        />
                      )}
                      {task.category_name}
                    </p>
                  )}
                </div>
                <Badge
                  variant='outline'
                  className={cn(
                    'shrink-0 text-xs',
                    priorityBadgeClass[task.priority as TaskPriority] ?? priorityBadgeClass.low,
                  )}
                >
                  {priorityLabel[task.priority as TaskPriority] ?? task.priority}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      <Button
        variant='outline'
        size='sm'
        className='gap-1.5'
        onClick={() => setModalOpen(true)}
      >
        <Plus size={14} />
        업무 추가
      </Button>

      <TaskFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        mode='create'
        defaultValues={presetValues}
        categories={categories}
        onSuccess={() => router.refresh()}
      />
    </div>
  )
}
