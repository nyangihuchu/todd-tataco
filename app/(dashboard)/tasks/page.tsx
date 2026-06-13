import { getTasks } from '@/lib/actions/tasks'
import { TasksClient } from '@/components/tasks/tasks-client'

interface TasksPageProps {
  searchParams: Promise<{
    category_id?: string
    priority?: string
  }>
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const params = await searchParams

  const { data: tasks } = await getTasks({
    category_id: params.category_id,
    priority: params.priority,
  })

  return <TasksClient initialTasks={tasks ?? []} />
}
