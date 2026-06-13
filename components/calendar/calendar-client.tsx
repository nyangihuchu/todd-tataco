'use client'

import { useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { MonthlyCalendar } from '@/components/calendar/monthly-calendar'
import { WeeklyCalendar } from '@/components/calendar/weekly-calendar'
import { DailyCalendar } from '@/components/calendar/daily-calendar'
import type { TaskWithCategory } from '@/lib/actions/tasks'
import type { Category } from '@/lib/actions/categories'

type CalendarView = 'monthly' | 'weekly' | 'daily'

interface CalendarClientProps {
  tasks: TaskWithCategory[]
  categories: Category[]
}

export function CalendarClient({ tasks, categories }: CalendarClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const view = (searchParams.get('view') ?? 'monthly') as CalendarView
  const [selectedCategoryId, setSelectedCategoryId] = useState('')

  function handleViewChange(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('view', value)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <Tabs value={view} onValueChange={handleViewChange}>
      <TabsList className='mb-4'>
        <TabsTrigger value='monthly'>월간</TabsTrigger>
        <TabsTrigger value='weekly'>주간</TabsTrigger>
        <TabsTrigger value='daily'>일간</TabsTrigger>
      </TabsList>

      {categories.length > 0 && (
        <div className='mb-3 flex flex-wrap gap-1.5'>
          <Button
            variant={selectedCategoryId === '' ? 'default' : 'outline'}
            size='sm'
            className='h-7 text-xs'
            onClick={() => setSelectedCategoryId('')}
          >
            전체
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategoryId === cat.id ? 'default' : 'outline'}
              size='sm'
              className='h-7 gap-1.5 text-xs'
              onClick={() => setSelectedCategoryId(selectedCategoryId === cat.id ? '' : cat.id)}
            >
              <span
                className='inline-block h-2.5 w-2.5 rounded-full'
                style={{ background: cat.color }}
              />
              {cat.name}
            </Button>
          ))}
        </div>
      )}

      <TabsContent value='monthly'>
        <MonthlyCalendar
          tasks={tasks}
          categories={categories}
          selectedCategoryId={selectedCategoryId}
        />
      </TabsContent>

      <TabsContent value='weekly'>
        <WeeklyCalendar tasks={tasks} selectedCategoryId={selectedCategoryId} />
      </TabsContent>

      <TabsContent value='daily'>
        <DailyCalendar
          tasks={tasks}
          categories={categories}
          selectedCategoryId={selectedCategoryId}
        />
      </TabsContent>
    </Tabs>
  )
}
