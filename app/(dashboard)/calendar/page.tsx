import { getTasks } from '@/lib/actions/tasks'
import { getCategories } from '@/lib/actions/categories'
import { CalendarClient } from '@/components/calendar/calendar-client'

export default async function CalendarPage() {
  const [{ data: tasks }, { data: categories }] = await Promise.all([
    getTasks(),
    getCategories(),
  ])

  return (
    <div className='space-y-4'>
      <h1 className='text-xl font-bold sm:text-2xl'>캘린더</h1>
      <CalendarClient tasks={tasks ?? []} categories={categories ?? []} />
    </div>
  )
}
