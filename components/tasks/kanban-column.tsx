'use client'

import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { ChevronDown, ChevronRight, ClipboardList } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from '@/lib/utils'
import { TaskCard } from '@/components/tasks/task-card'
import type { TaskWithCategory } from '@/lib/actions/tasks'

type Status = 'pending' | 'in_progress' | 'done' | 'overdue'

const columnConfig: Record<
  Status,
  { label: string; colorClass: string; overClass: string; dotClass: string; labelClass: string }
> = {
  overdue: {
    label: '지연',
    colorClass: 'bg-rose-50 dark:bg-rose-950',
    overClass: '',
    dotClass: 'bg-rose-500',
    labelClass: 'text-rose-700 dark:text-rose-400',
  },
  pending: {
    label: '대기',
    colorClass: 'bg-slate-50 dark:bg-slate-800',
    overClass: 'ring-2 ring-slate-300',
    dotClass: 'bg-slate-400',
    labelClass: 'text-slate-600 dark:text-slate-400',
  },
  in_progress: {
    label: '진행중',
    colorClass: 'bg-blue-50 dark:bg-blue-950',
    overClass: 'ring-2 ring-blue-300',
    dotClass: 'bg-blue-500',
    labelClass: 'text-blue-700 dark:text-blue-400',
  },
  done: {
    label: '완료',
    colorClass: 'bg-emerald-50 dark:bg-emerald-950',
    overClass: 'ring-2 ring-emerald-300',
    dotClass: 'bg-emerald-500',
    labelClass: 'text-emerald-700 dark:text-emerald-400',
  },
}

interface KanbanColumnProps {
  status: Status
  tasks: TaskWithCategory[]
  onCardClick: (task: TaskWithCategory) => void
  onEditTask: (task: TaskWithCategory) => void
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
  const { label, colorClass, overClass, dotClass, labelClass } = columnConfig[status]

  // 모바일 접기/펼치기: 빈 컬럼은 기본 접힘, 내용 있으면 기본 펼침
  const [collapsed, setCollapsed] = useState(tasks.length === 0)

  return (
    <div
      ref={setNodeRef}
      className={cn(
        /* 모바일: 전체 너비 / md 이상: 최소 너비 고정으로 가로 스크롤 허용 */
        'flex w-full flex-col rounded-lg transition-all md:min-w-[200px] md:flex-1',
        colorClass,
        isOver && overClass,
      )}
    >
      {/* 헤더: 모바일에서 터치 영역 확보를 위해 패딩 확대, 클릭 시 접기/펼치기 토글 */}
      <button
        type='button'
        className='flex w-full items-center gap-2 px-4 py-3 text-left md:cursor-default md:px-3 md:py-3'
        onClick={() => setCollapsed((prev) => !prev)}
        aria-expanded={!collapsed}
      >
        <span className={cn('h-2 w-2 shrink-0 rounded-full', dotClass)} />
        <h3 className={cn('text-sm font-semibold', labelClass)}>{label}</h3>
        <Badge variant='secondary' className='text-xs'>
          {tasks.length}
        </Badge>
        {/* 접기 아이콘: 모바일에서만 표시 */}
        <span className='ml-auto md:hidden'>
          {collapsed
            ? <ChevronRight size={16} className='text-muted-foreground' />
            : <ChevronDown size={16} className='text-muted-foreground' />
          }
        </span>
      </button>

      {/* 카드 목록: 모바일 접힘 상태일 때 숨김 */}
      <div
        className={cn(
          'flex flex-col gap-2 px-3 pb-3',
          collapsed && 'hidden md:flex',
        )}
      >
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
