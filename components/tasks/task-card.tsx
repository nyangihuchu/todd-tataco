'use client'

import { Building2, CalendarDays, GripVertical, MoreVertical, Pencil, Trash2 } from 'lucide-react'
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
import type { TaskWithCompany } from '@/lib/actions/tasks'

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
  task: TaskWithCompany
  onClick: (task: TaskWithCompany) => void
  onEdit: (task: TaskWithCompany) => void
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
  task: TaskWithCompany
  onClick?: (task: TaskWithCompany) => void
  onEdit?: (task: TaskWithCompany) => void
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
  // due_date가 없거나 오늘 이전이고 완료 상태가 아니면 기한 초과로 표시
  const isOverdue =
    task.due_date != null && task.due_date < today && task.status !== 'done'

  // DB에서 오는 priority는 string 타입이므로 리터럴 타입으로 안전하게 캐스팅
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
      <CardContent className='space-y-2 p-3'>
        <div className='flex items-start justify-between gap-1'>
          {/* 드래그 핸들 */}
          <div
            {...dragHandleProps}
            className='mt-0.5 shrink-0 cursor-grab touch-none text-muted-foreground/40 active:cursor-grabbing'
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical size={14} />
          </div>
          {/* 컬럼 너비가 줄어들어도 제목이 잘리도록 truncate 처리 */}
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
                    className='h-6 w-6'
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical size={12} />
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
        <div className='flex items-center gap-1 text-xs text-muted-foreground'>
          <Building2 size={12} />
          {/* 업체명도 긴 경우 말줄임 처리 */}
          <span className='truncate'>{task.company_name}</span>
        </div>
        {task.due_date && (
          <div
            className={cn(
              'flex items-center gap-1 text-xs',
              isOverdue ? 'font-medium text-rose-500' : 'text-muted-foreground',
            )}
          >
            <CalendarDays size={12} />
            <span>{task.due_date}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
