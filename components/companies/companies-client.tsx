'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { CompanyCard } from '@/components/companies/company-card'
import { CompanyFormModal } from '@/components/companies/company-form-modal'
import { EmptyState } from '@/components/ui/empty-state'
import type { Tables } from '@/lib/supabase/database.types'

interface CompaniesClientProps {
  initialCompanies: Tables<'companies'>[]
  currentUserId: string
}

export function CompaniesClient({ initialCompanies, currentUserId }: CompaniesClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // 모달 상태: 신규 생성(target: null) 또는 수정(target: 업체 데이터)
  const [modal, setModal] = useState<{
    open: boolean
    target: Tables<'companies'> | null
  }>({ open: false, target: null })

  function openCreate() {
    setModal({ open: true, target: null })
  }

  function openEdit(company: Tables<'companies'>) {
    setModal({ open: true, target: company })
  }

  function closeModal() {
    setModal({ open: false, target: null })
  }

  // 모달 저장 성공 후 목록 갱신
  function handleSaved() {
    closeModal()
    startTransition(() => {
      router.refresh()
    })
  }

  // 카드에서 삭제 성공 후 목록 갱신
  function handleDeleted(companyName: string) {
    toast.success(`'${companyName}' 업체가 삭제되었습니다`)
    startTransition(() => {
      router.refresh()
    })
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold'>업체 관리</h1>
        <Button onClick={openCreate} disabled={isPending}>
          <Plus size={16} className='mr-2' />
          업체 추가
        </Button>
      </div>

      {initialCompanies.length === 0 ? (
        <EmptyState
          icon={<Building2 size={40} />}
          title='등록된 업체가 없습니다'
          description='업체 추가 버튼을 눌러 첫 업체를 등록하세요'
        />
      ) : (
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {initialCompanies.map((company) => (
            <CompanyCard
              key={company.id}
              company={company}
              isOwner={company.user_id === currentUserId}
              onEdit={openEdit}
              onDelete={handleDeleted}
            />
          ))}
        </div>
      )}

      <CompanyFormModal
        open={modal.open}
        onOpenChange={(open) => {
          if (!open) closeModal()
        }}
        mode={modal.target ? 'edit' : 'create'}
        defaultValues={modal.target ?? undefined}
        onSaved={handleSaved}
      />
    </div>
  )
}
