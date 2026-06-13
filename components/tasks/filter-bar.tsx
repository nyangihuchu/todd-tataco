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
import type { Category } from '@/lib/actions/categories'

const priorityOptions = [
  { value: 'high', label: '높음' },
  { value: 'medium', label: '보통' },
  { value: 'low', label: '낮음' },
]

interface FilterBarProps {
  categories?: Category[]
}

export function FilterBar({ categories = [] }: FilterBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const categoryId = searchParams.get('category_id') ?? ''
  const priority = searchParams.get('priority') ?? ''
  const hasFilter = !!categoryId || !!priority

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
      {categories.length > 0 && (
        <Select
          value={categoryId}
          onValueChange={(v) => updateParam('category_id', v === 'all' ? '' : v)}
        >
          <SelectTrigger className='h-8 w-full text-xs sm:w-40'>
            <SelectValue placeholder='카테고리 전체' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>카테고리 전체</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                <span className='flex items-center gap-1.5'>
                  <span
                    className='inline-block h-3 w-3 shrink-0 rounded-full'
                    style={{ background: cat.color }}
                  />
                  {cat.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

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
