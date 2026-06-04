import { getTasks } from '@/lib/actions/tasks'
import { getCompanies } from '@/lib/actions/companies'
import { MonthlyCalendar } from '@/components/calendar/monthly-calendar'

export default async function CalendarPage() {
  const [{ data: tasks }, { data: companies }] = await Promise.all([
    getTasks(),
    getCompanies(),
  ])

  return (
    <div className='space-y-6'>
      <h1 className='text-2xl font-bold'>캘린더</h1>
      <MonthlyCalendar tasks={tasks ?? []} companies={companies ?? []} />
    </div>
  )
}
