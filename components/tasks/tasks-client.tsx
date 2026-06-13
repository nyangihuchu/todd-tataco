'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { KanbanBoard } from '@/components/tasks/kanban-board'
import { TaskFormModal } from '@/components/tasks/task-form-modal'
import { FilterBar } from '@/components/tasks/filter-bar'
import type { TaskWithCategory } from '@/lib/actions/tasks'
import type { Category } from '@/lib/actions/categories'

interface TasksClientProps {
  initialTasks: TaskWithCategory[]
  categories: Category[]
}

export function TasksClient({ initialTasks, categories }: TasksClientProps) {
  const router = useRouter()

  const [modal, setModal] = useState<{
    open: boolean
    target: TaskWithCategory | null
  }>({
    open: false,
    target: null,
  })

  function openCreate() {
    setModal({ open: true, target: null })
  }

  function openEdit(task: TaskWithCategory) {
    setModal({ open: true, target: task })
  }

  function closeModal() {
    setModal({ open: false, target: null })
  }

  function handleSuccess() {
    router.refresh()
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h1 className='text-xl font-bold sm:text-2xl'>업무 관리</h1>
        <Button onClick={openCreate}>
          <Plus size={16} className='sm:mr-2' />
          <span className='hidden sm:inline'>업무 추가</span>
        </Button>
      </div>

      <FilterBar categories={categories} />

      <KanbanBoard tasks={initialTasks} onEditTask={openEdit} />

      <TaskFormModal
        open={modal.open}
        onOpenChange={closeModal}
        mode={modal.target ? 'edit' : 'create'}
        defaultValues={modal.target ?? undefined}
        categories={categories}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
