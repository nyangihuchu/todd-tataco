import { getTasks } from '@/lib/actions/tasks'
import { getCompanies } from '@/lib/actions/companies'
import { TasksClient } from '@/components/tasks/tasks-client'

interface TasksPageProps {
  searchParams: Promise<{
    company_id?: string
    priority?: string
  }>
}

// Server Component — 쿼리 파라미터 기반으로 데이터를 서버에서 직접 페칭
export default async function TasksPage({ searchParams }: TasksPageProps) {
  // Next.js 15: searchParams는 Promise이므로 await 필요
  const params = await searchParams

  // 업무 목록과 업체 목록을 병렬로 조회
  const [{ data: tasks }, { data: companies }] = await Promise.all([
    getTasks({
      company_id: params.company_id,
      priority: params.priority,
    }),
    getCompanies(),
  ])

  return (
    <TasksClient
      initialTasks={tasks ?? []}
      companies={companies ?? []}
    />
  )
}
