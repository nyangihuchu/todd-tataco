'use client'

import { useTransition } from 'react'
import { Building2, User, Phone, Mail, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { deleteCompany } from '@/lib/actions/companies'
import type { Tables } from '@/lib/supabase/database.types'

interface CompanyCardProps {
  company: Tables<'companies'>
  onEdit: (company: Tables<'companies'>) => void
  // 삭제 성공 후 부모(CompaniesClient)에서 router.refresh() + toast 처리
  onDelete: (companyName: string) => void
}

export function CompanyCard({ company, onEdit, onDelete }: CompanyCardProps) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteCompany(company.id)
      if (result.error) {
        toast.error(result.error)
        return
      }
      // 삭제 성공 — 부모에서 toast + router.refresh() 처리
      onDelete(company.name)
    })
  }

  return (
    <Card>
      <CardHeader className='flex flex-row items-start justify-between pb-2'>
        <div className='flex items-center gap-2'>
          <Building2 size={18} className='text-muted-foreground' />
          <CardTitle className='text-base'>{company.name}</CardTitle>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='ghost'
              size='icon'
              className='-mt-1 -mr-2 h-8 w-8'
              disabled={isPending}
            >
              <MoreVertical size={16} />
              <span className='sr-only'>더보기</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuItem onClick={() => onEdit(company)}>
              <Pencil size={14} className='mr-2' />
              수정
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleDelete}
              className='text-destructive focus:text-destructive'
              disabled={isPending}
            >
              <Trash2 size={14} className='mr-2' />
              {isPending ? '삭제 중...' : '삭제'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className='space-y-2 text-sm'>
        <div className='flex items-center gap-2 text-muted-foreground'>
          <User size={14} />
          <span>{company.contact_name ?? '-'}</span>
        </div>
        <div className='flex items-center gap-2 text-muted-foreground'>
          <Phone size={14} />
          <span>{company.phone ?? '-'}</span>
        </div>
        <div className='flex items-center gap-2 text-muted-foreground'>
          <Mail size={14} />
          <span>{company.email ?? '-'}</span>
        </div>
      </CardContent>
    </Card>
  )
}
