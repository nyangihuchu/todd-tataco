import { Clock, Loader2, CheckCircle2, AlertCircle, CalendarClock, ListTodo } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getDashboardStats, getChartStats } from '@/lib/actions/dashboard'
import { TaskStatusChart } from '@/components/dashboard/task-status-chart'
import { cn } from '@/lib/utils'

type Priority = 'high' | 'medium' | 'low'

const priorityBadgeClass: Record<Priority, string> = {
  high: 'border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-400',
  medium: 'border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400',
  low: 'border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400',
}

const priorityLabel: Record<Priority, string> = {
  high: '높음',
  medium: '보통',
  low: '낮음',
}

export default async function DashboardPage() {
  const [{ data: stats }, { data: chartStats }] = await Promise.all([
    getDashboardStats(),
    getChartStats(),
  ])

  const todayDueCount = stats?.todayDueCount ?? 0
  const inProgressCount = stats?.inProgressCount ?? 0
  const doneCount = stats?.doneCount ?? 0
  const overdueCount = stats?.overdueCount ?? 0
  const weeklyDueCount = stats?.weeklyDueCount ?? 0
  const todayTasks = stats?.todayTasks ?? []

  const summaryCards = [
    { label: '오늘 마감', count: todayDueCount, icon: Clock, color: 'text-rose-500' },
    { label: '진행중', count: inProgressCount, icon: Loader2, color: 'text-blue-500' },
    { label: '완료', count: doneCount, icon: CheckCircle2, color: 'text-emerald-500' },
    { label: '지연', count: overdueCount, icon: AlertCircle, color: 'text-orange-500' },
    { label: '이번 주 마감', count: weeklyDueCount, icon: CalendarClock, color: 'text-purple-500' },
  ]

  return (
    <div className='space-y-8'>
      <h1 className='text-2xl font-bold'>대시보드</h1>

      {/* 요약 카드 */}
      <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5'>
        {summaryCards.map(({ label, count, icon: Icon, color }) => (
          <Card key={label}>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-sm font-medium text-muted-foreground'>
                {label}
              </CardTitle>
              <Icon size={20} className={color} />
            </CardHeader>
            <CardContent>
              <p className='text-3xl font-bold'>{count}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 통계 차트 */}
      <div className='grid grid-cols-1 gap-4'>
        <TaskStatusChart data={chartStats?.statusCounts ?? []} />
      </div>

      {/* 오늘 할 일 */}
      <div className='space-y-3'>
        <div className='flex items-center gap-2'>
          <ListTodo size={18} className='text-muted-foreground' />
          <h2 className='text-lg font-semibold'>오늘 할 일</h2>
        </div>
        {todayTasks.length === 0 ? (
          <p className='text-sm text-muted-foreground'>오늘 마감인 업무가 없습니다.</p>
        ) : (
          <div className='space-y-2'>
            {todayTasks.map((task) => {
              const priority = (['high', 'medium', 'low'].includes(task.priority)
                ? task.priority
                : 'medium') as Priority
              return (
                <Card key={task.id}>
                  <CardContent className='flex items-center justify-between py-3'>
                    <p className='text-sm font-medium'>{task.title}</p>
                    <Badge
                      variant='outline'
                      className={cn('text-xs', priorityBadgeClass[priority])}
                    >
                      {priorityLabel[priority]}
                    </Badge>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
