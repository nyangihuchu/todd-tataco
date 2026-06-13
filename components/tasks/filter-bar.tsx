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

const priorityOptions = [
  { value: 'high', label: '높음' },
  { value: 'medium', label: '보통' },
  { value: 'low', label: '낮음' },
]

export function FilterBar() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const priority = searchParams.get('priority') ?? ''
  const hasFilter = !!priority

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
        value={priority}
        onValueChange={(v) => updateParam('priority', v === 'all' ? '' : v)}
      >
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
