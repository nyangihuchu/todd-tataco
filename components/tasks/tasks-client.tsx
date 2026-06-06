'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { KanbanBoard } from '@/components/tasks/kanban-board'
import { TaskFormModal } from '@/components/tasks/task-form-modal'
import { FilterBar } from '@/components/tasks/filter-bar'
import type { TaskWithCompany } from '@/lib/actions/tasks'
import type { Tables } from '@/lib/supabase/database.types'

interface TasksClientProps {
  // Server Component에서 초기 데이터를 prop으로 전달
  initialTasks: TaskWithCompany[]
  companies: Tables<'companies'>[]
}

export function TasksClient({ initialTasks, companies }: TasksClientProps) {
  const router = useRouter()

  const [modal, setModal] = useState<{
    open: boolean
    target: TaskWithCompany | null
  }>({
    open: false,
    target: null,
  })

  function openCreate() {
    setModal({ open: true, target: null })
  }

  function openEdit(task: TaskWithCompany) {
    setModal({ open: true, target: task })
  }

  function closeModal() {
    setModal({ open: false, target: null })
  }

  // 업무 등록/수정 성공 후 서버 데이터 재패치
  function handleSuccess() {
    router.refresh()
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        {/* 모바일에서 h1이 너무 크지 않도록 크기 조정 */}
        <h1 className='text-xl font-bold sm:text-2xl'>업무 관리</h1>
        <Button onClick={openCreate}>
          <Plus size={16} className='sm:mr-2' />
          {/* 모바일에서 텍스트 숨김, sm 이상에서 표시 */}
          <span className='hidden sm:inline'>업무 추가</span>
        </Button>
      </div>

      {/* 업체/우선순위 필터 */}
      <FilterBar companies={companies} />

      {/* 칸반 보드 — 낙관적 업데이트 포함 */}
      <KanbanBoard tasks={initialTasks} onEditTask={openEdit} />

      {/* 업무 등록/수정 모달 */}
      <TaskFormModal
        open={modal.open}
        onOpenChange={closeModal}
        mode={modal.target ? 'edit' : 'create'}
        defaultValues={modal.target ?? undefined}
        companies={companies}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
