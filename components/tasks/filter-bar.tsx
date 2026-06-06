'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Tables } from '@/lib/supabase/database.types'

const priorityOptions = [
  { value: 'high', label: '높음' },
  { value: 'medium', label: '보통' },
  { value: 'low', label: '낮음' },
]

interface FilterBarProps {
  // DB에서 가져온 업체 목록 (Server Component에서 prop으로 전달)
  companies: Tables<'companies'>[]
}

export function FilterBar({ companies }: FilterBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const companyId = searchParams.get('company_id') ?? ''
  const priority = searchParams.get('priority') ?? ''
  const hasFilter = companyId || priority

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  function clearFilters() {
    router.push(pathname)
  }

  return (
    <div className='flex flex-wrap items-center gap-2'>
      <Select
        value={companyId}
        onValueChange={(v) => updateParam('company_id', v === 'all' ? '' : v)}
      >
        {/* 모바일에서 full-width, sm 이상에서 고정 너비 */}
        <SelectTrigger className='h-8 w-full text-xs sm:w-40'>
          <SelectValue placeholder='업체 전체' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>업체 전체</SelectItem>
          {companies.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={priority}
        onValueChange={(v) => updateParam('priority', v === 'all' ? '' : v)}
      >
        {/* 모바일에서 full-width, sm 이상에서 고정 너비 */}
        <SelectTrigger className='h-8 w-full text-xs sm:w-36'>
          <SelectValue placeholder='우선순위 전체' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>우선순위 전체</SelectItem>
          {priorityOptions.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilter && (
        <Button variant='ghost' size='sm' className='h-8 gap-1 text-xs' onClick={clearFilters}>
          <X size={12} />
          초기화
        </Button>
      )}
    </div>
  )
}
