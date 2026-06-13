'use client'

import { Tag, CalendarDays, GripVertical, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { deleteTask } from '@/lib/actions/tasks'
import type { TaskWithCategory } from '@/lib/actions/tasks'

type Priority = 'high' | 'medium' | 'low'

const priorityClass: Record<Priority, string> = {
  high: 'border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-400',
  medium: 'border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400',
  low: 'border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400',
}

const priorityLabel: Record<Priority, string> = {
  high: '높음',
  medium: '보통',
  low: '낮음',
}

interface TaskCardProps {
  task: TaskWithCategory
  onClick: (task: TaskWithCategory) => void
  onEdit: (task: TaskWithCategory) => void
  onDelete?: (id: string) => void
  isDragging?: boolean
}

export function TaskCard({ task, onClick, onEdit, onDelete, isDragging }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: task.id })

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined

  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && 'opacity-40')}>
      <TaskCardContent
        task={task}
        onClick={onClick}
        onEdit={onEdit}
        onDelete={onDelete}
        dragHandleProps={{ ...listeners, ...attributes }}
      />
    </div>
  )
}

interface TaskCardContentProps {
  task: TaskWithCategory
  onClick?: (task: TaskWithCategory) => void
  onEdit?: (task: TaskWithCategory) => void
  onDelete?: (id: string) => void
  isDragOverlay?: boolean
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>
}

export function TaskCardContent({
  task,
  onClick,
  onEdit,
  onDelete,
  isDragOverlay,
  dragHandleProps,
}: TaskCardContentProps) {
  const today = new Date().toISOString().split('T')[0]
  const isOverdue =
    task.due_date != null && task.due_date < today && task.status !== 'done'

  const priority = (
    ['high', 'medium', 'low'].includes(task.priority) ? task.priority : 'medium'
  ) as Priority

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    const result = await deleteTask(task.id)
    if (result.error) {
      toast.error(`삭제 실패: ${result.error}`)
      return
    }
    toast.success(`'${task.title}' 업무가 삭제되었습니다`)
    onDelete?.(task.id)
  }

  return (
    <Card
      className={cn(
        'transition-shadow',
        onClick && 'cursor-pointer hover:shadow-md',
        isDragOverlay && 'rotate-2 shadow-lg',
      )}
      onClick={onClick ? () => onClick(task) : undefined}
    >
      <CardContent className='space-y-2 p-3 sm:p-4'>
        <div className='flex flex-wrap items-start gap-1'>
          <div
            {...dragHandleProps}
            className='mt-0.5 hidden shrink-0 cursor-grab touch-none text-muted-foreground/40 active:cursor-grabbing md:flex'
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical size={14} />
          </div>
          <p className='min-w-0 flex-1 truncate text-sm font-medium leading-snug'>{task.title}</p>
          <div className='flex shrink-0 items-center gap-1'>
            <Badge variant='outline' className={cn('text-xs', priorityClass[priority])}>
              {priorityLabel[priority]}
            </Badge>
            {onEdit && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='h-7 w-7 sm:h-6 sm:w-6'
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical size={14} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit(task)
                    }}
                  >
                    <Pencil size={14} className='mr-2' />
                    수정
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className='text-destructive focus:text-destructive'
                  >
                    <Trash2 size={14} className='mr-2' />
                    삭제
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        {task.category_name && (
          <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
            <Tag size={12} className='shrink-0' />
            <span className='truncate'>{task.category_name}</span>
          </div>
        )}
        {task.due_date && (
          <div
            className={cn(
              'flex items-center gap-1.5 text-xs',
              isOverdue ? 'font-medium text-rose-500' : 'text-muted-foreground',
            )}
          >
            <CalendarDays size={12} className='shrink-0' />
            <span>{task.due_date}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
