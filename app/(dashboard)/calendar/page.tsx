import { getTasks } from '@/lib/actions/tasks'
import { MonthlyCalendar } from '@/components/calendar/monthly-calendar'

export default async function CalendarPage() {
  // 서버에서 업무 목록 조회 후 캘린더 컴포넌트에 전달
  const { data: tasks } = await getTasks()

  return (
    <div className='space-y-6'>
      <h1 className='text-2xl font-bold'>캘린더</h1>
      <MonthlyCalendar tasks={tasks ?? []} />
    </div>
  )
}
