'use client'

import { useDroppable } from '@dnd-kit/core'
import { ClipboardList } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from '@/lib/utils'
import { TaskCard } from '@/components/tasks/task-card'
import type { TaskWithCompany } from '@/lib/actions/tasks'

// tasks 테이블 status 컬럼의 실제 값 + 지연(overdue) 가상 상태
type Status = 'pending' | 'in_progress' | 'review' | 'done' | 'overdue'

const columnConfig: Record<Status, { label: string; colorClass: string; overClass: string }> = {
  pending: {
    label: '대기',
    colorClass: 'bg-slate-100 dark:bg-slate-800',
    overClass: 'ring-2 ring-slate-400',
  },
  in_progress: {
    label: '진행중',
    colorClass: 'bg-blue-50 dark:bg-blue-950',
    overClass: 'ring-2 ring-blue-400',
  },
  review: {
    label: '확인요청',
    colorClass: 'bg-yellow-50 dark:bg-yellow-950',
    overClass: 'ring-2 ring-yellow-400',
  },
  done: {
    label: '완료',
    colorClass: 'bg-green-50 dark:bg-green-950',
    overClass: 'ring-2 ring-green-400',
  },
  overdue: {
    label: '지연',
    colorClass: 'bg-rose-50 dark:bg-rose-950',
    overClass: '',
  },
}

interface KanbanColumnProps {
  status: Status
  tasks: TaskWithCompany[]
  onCardClick: (task: TaskWithCompany) => void
  onEditTask: (task: TaskWithCompany) => void
  onDeleteTask?: (id: string) => void
  activeTaskId: string | null
}

export function KanbanColumn({
  status,
  tasks,
  onCardClick,
  onEditTask,
  onDeleteTask,
  activeTaskId,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const { label, colorClass, overClass } = columnConfig[status]

  return (
    <div
      ref={setNodeRef}
      className={cn(
        /* min-w-0: flex 자식이 내용 크기를 초과해 넘치는 것을 방지, flex-1: 균등 너비 분배 */
        'flex min-w-0 flex-1 flex-col rounded-lg p-3 transition-all',
        colorClass,
        isOver && overClass,
      )}
    >
      <div className='mb-3 flex items-center gap-2'>
        <h3 className='text-sm font-semibold'>{label}</h3>
        <Badge variant='secondary' className='text-xs'>
          {tasks.length}
        </Badge>
      </div>
      <div className='flex flex-col gap-2'>
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onClick={onCardClick}
            onEdit={onEditTask}
            onDelete={onDeleteTask}
            isDragging={task.id === activeTaskId}
          />
        ))}
        {tasks.length === 0 && (
          <EmptyState
            icon={<ClipboardList size={24} />}
            title='업무 없음'
          />
        )}
      </div>
    </div>
  )
}
