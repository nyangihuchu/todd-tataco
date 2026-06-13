import { Clock, Loader2, CheckCircle2, MessageSquare, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getDashboardStats, getChartStats } from '@/lib/actions/dashboard'
import { TaskStatusChart } from '@/components/dashboard/task-status-chart'

export default async function DashboardPage() {
  const [{ data: stats }, { data: chartStats }] = await Promise.all([
    getDashboardStats(),
    getChartStats(),
  ])

  // 통계가 없을 경우 0으로 fallback
  const todayDueCount = stats?.todayDueCount ?? 0
  const inProgressCount = stats?.inProgressCount ?? 0
  const doneCount = stats?.doneCount ?? 0
  const overdueCount = stats?.overdueCount ?? 0
  const recentComments = stats?.recentComments ?? []

  const summaryCards = [
    { label: '오늘 마감', count: todayDueCount, icon: Clock, color: 'text-rose-500' },
    { label: '진행중', count: inProgressCount, icon: Loader2, color: 'text-blue-500' },
    { label: '완료', count: doneCount, icon: CheckCircle2, color: 'text-emerald-500' },
    { label: '지연', count: overdueCount, icon: AlertCircle, color: 'text-orange-500' },
  ]

  return (
    <div className='space-y-8'>
      <h1 className='text-2xl font-bold'>대시보드</h1>

      {/* 요약 카드 */}
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-4'>
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

      {/* 최근 댓글 */}
      <div className='space-y-3'>
        <div className='flex items-center gap-2'>
          <MessageSquare size={18} className='text-muted-foreground' />
          <h2 className='text-lg font-semibold'>최근 댓글</h2>
        </div>
        <div className='space-y-2'>
          {recentComments.map((comment) => (
            <Card key={comment.id}>
              <CardContent className='py-4'>
                <div className='flex items-start justify-between gap-4'>
                  <div className='space-y-1'>
                    <p className='text-sm'>{comment.content}</p>
                    <p className='text-xs text-muted-foreground'>
                      {comment.author_name} · {comment.task_title}
                    </p>
                  </div>
                  <p className='shrink-0 text-xs text-muted-foreground'>
                    {new Date(comment.created_at).toLocaleString('ko-KR', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
