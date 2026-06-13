'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Tables, TablesInsert, TablesUpdate } from '@/lib/supabase/database.types'
import type { ActionResult } from './types'

export type TaskWithCategory = Tables<'tasks'> & {
  category_name: string | null
  category_color: string | null
}

type TaskWithCategoryRaw = Tables<'tasks'> & {
  categories: { name: string; color: string } | null
}

export async function getTasks(filters?: {
  category_id?: string
  priority?: string
}): Promise<ActionResult<TaskWithCategory[]>> {
  const supabase = await createClient()

  let query = supabase
    .from('tasks')
    .select('id, title, status, priority, due_date, start_date, created_by, category_id, memo, updated_at, categories(name, color)')
    .order('created_at', { ascending: false })

  if (filters?.category_id) {
    query = query.eq('category_id', filters.category_id)
  }

  if (filters?.priority) {
    query = query.eq('priority', filters.priority)
  }

  const { data, error } = await query

  if (error) {
    return { data: null, error: error.message }
  }

  const flattened = (data as TaskWithCategoryRaw[]).map((t) => ({
    ...t,
    category_name: t.categories?.name ?? null,
    category_color: t.categories?.color ?? null,
    categories: undefined,
  })) as TaskWithCategory[]

  return { data: flattened, error: null }
}

export async function createTask(
  values: TablesInsert<'tasks'>
): Promise<ActionResult<Tables<'tasks'>>> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: '인증이 필요합니다.' }
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert({ ...values, created_by: user.id })
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  revalidatePath('/tasks')
  return { data, error: null }
}

export async function updateTask(
  id: string,
  values: TablesUpdate<'tasks'>
): Promise<ActionResult<Tables<'tasks'>>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tasks')
    .update(values)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  revalidatePath('/tasks')
  return { data, error: null }
}

export async function deleteTask(id: string): Promise<ActionResult<null>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)
    .select('id')

  if (error) {
    return { data: null, error: error.message }
  }

  if (!data || data.length === 0) {
    return { data: null, error: '삭제 권한이 없습니다' }
  }

  revalidatePath('/tasks')
  return { data: null, error: null }
}

export async function updateTaskStatus(
  id: string,
  status: Tables<'tasks'>['status']
): Promise<ActionResult<Tables<'tasks'>>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tasks')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  revalidatePath('/tasks')
  return { data, error: null }
}
