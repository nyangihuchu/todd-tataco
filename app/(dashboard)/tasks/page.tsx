import { getTasks } from '@/lib/actions/tasks'
import { getCategories } from '@/lib/actions/categories'
import { TasksClient } from '@/components/tasks/tasks-client'

interface TasksPageProps {
  searchParams: Promise<{
    category_id?: string
    priority?: string
  }>
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const params = await searchParams

  const [{ data: tasks }, { data: categories }] = await Promise.all([
    getTasks({
      category_id: params.category_id,
      priority: params.priority,
    }),
    getCategories(),
  ])

  return <TasksClient initialTasks={tasks ?? []} categories={categories ?? []} />
}
