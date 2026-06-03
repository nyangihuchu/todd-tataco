'use client'

import { useState, useEffect, useTransition } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { toast } from 'sonner'
import { KanbanColumn } from '@/components/tasks/kanban-column'
import { TaskDetailSheet } from '@/components/tasks/task-detail-sheet'
import { TaskCardContent } from '@/components/tasks/task-card'
import { updateTaskStatus } from '@/lib/actions/tasks'
import { getComments } from '@/lib/actions/comments'
import type { TaskWithCompany } from '@/lib/actions/tasks'
import type { CommentWithAuthor } from '@/lib/actions/comments'

// tasks 테이블 status 컬럼의 UI 리터럴 타입
type Status = 'pending' | 'in_progress' | 'review' | 'done'

const STATUSES: Status[] = ['pending', 'in_progress', 'review', 'done']

interface KanbanBoardProps {
  tasks: TaskWithCompany[]
  onEditTask: (task: TaskWithCompany) => void
}

export function KanbanBoard({ tasks, onEditTask }: KanbanBoardProps) {
  const [localTasks, setLocalTasks] = useState<TaskWithCompany[]>(tasks)
  const [activeTask, setActiveTask] = useState<TaskWithCompany | null>(null)
  const [selectedTask, setSelectedTask] = useState<TaskWithCompany | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [comments, setComments] = useState<CommentWithAuthor[]>([])
  const [, startTransition] = useTransition()

  // 부모로부터 tasks prop이 변경될 때 로컬 상태 동기화
  useEffect(() => {
    setLocalTasks(tasks)
  }, [tasks])

  // selectedTask 변경 시 댓글 목록 자동 로드
  useEffect(() => {
    if (!selectedTask) {
      setComments([])
      return
    }
    getComments(selectedTask.id).then((r) => {
      if (r.data) setComments(r.data)
    })
  }, [selectedTask])

  // 댓글 추가/삭제 후 목록 재로드
  function handleCommentAdded() {
    if (!selectedTask) return
    getComments(selectedTask.id).then((r) => {
      if (r.data) setComments(r.data)
    })
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  function handleDragStart({ active }: DragStartEvent) {
    const task = localTasks.find((t) => t.id === active.id)
    setActiveTask(task ?? null)
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveTask(null)
    if (!over) return

    const newStatus = over.id as Status
    if (!STATUSES.includes(newStatus)) return

    const task = localTasks.find((t) => t.id === active.id)
    if (!task || task.status === newStatus) return

    // 낙관적 업데이트: UI를 먼저 변경
    const prevTasks = localTasks
    setLocalTasks((prev) =>
      prev.map((t) => (t.id === active.id ? { ...t, status: newStatus } : t)),
    )

    // 비동기 DB 업데이트 (실패 시 원복)
    startTransition(() => {
      updateTaskStatus(active.id as string, newStatus).then((result) => {
        if (result.error) {
          setLocalTasks(prevTasks)
          toast.error(`상태 변경 실패: ${result.error}`)
        }
      })
    })
  }

  function handleCardClick(task: TaskWithCompany) {
    setSelectedTask(task)
    setSheetOpen(true)
  }

  // 삭제 시 로컬 상태에서도 제거 (router.refresh()로 서버 재패치 전까지 반영)
  function handleDeleteTask(id: string) {
    setLocalTasks((prev) => prev.filter((t) => t.id !== id))
  }

  const tasksByStatus = STATUSES.reduce<Record<Status, TaskWithCompany[]>>(
    (acc, status) => {
      acc[status] = localTasks.filter((t) => t.status === status)
      return acc
    },
    { pending: [], in_progress: [], review: [], done: [] },
  )

  // 마감일 초과 + 완료 아님 (ISO 문자열 직접 비교)
  const now = new Date().toISOString()
  const overdueTasks = localTasks.filter(
    (t) => t.due_date != null && t.due_date < now && t.status !== 'done',
  )

  return (
    <>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        {/* 칸반 컬럼 컨테이너: 5개 컬럼이 뷰포트 너비를 균등 분배 */}
        <div className='flex gap-4'>
          {/* 지연 컬럼: STATUSES에 없으므로 드롭해도 상태 변경 안 됨 */}
          <KanbanColumn
            status='overdue'
            tasks={overdueTasks}
            onCardClick={handleCardClick}
            onEditTask={(task) => onEditTask(task)}
            onDeleteTask={handleDeleteTask}
            activeTaskId={activeTask?.id ?? null}
          />
          {STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={tasksByStatus[status]}
              onCardClick={handleCardClick}
              onEditTask={(task) => onEditTask(task)}
              onDeleteTask={handleDeleteTask}
              activeTaskId={activeTask?.id ?? null}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTask ? <TaskCardContent task={activeTask} isDragOverlay /> : null}
        </DragOverlay>
      </DndContext>
      <TaskDetailSheet
        task={selectedTask}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        comments={comments}
        onCommentAdded={handleCommentAdded}
      />
    </>
  )
}
