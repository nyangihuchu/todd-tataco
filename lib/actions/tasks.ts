'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Tables, TablesInsert, TablesUpdate } from '@/lib/supabase/database.types'
import type { ActionResult } from './types'

// companies JOIN 결과를 평탄화한 업무 타입
export type TaskWithCompany = Tables<'tasks'> & { company_name: string | null }

// Supabase JOIN 응답의 중간 타입 (평탄화 전)
type TaskWithCompanyRaw = Tables<'tasks'> & {
  companies: { name: string } | null
}

// 업무 목록 조회 (업체 이름 포함, 생성일 내림차순)
// 선택적으로 company_id, priority 필터 적용 가능
export async function getTasks(filters?: {
  company_id?: string
  priority?: string
}): Promise<ActionResult<TaskWithCompany[]>> {
  const supabase = await createClient()

  let query = supabase
    .from('tasks')
    .select('*, companies(name)')
    .order('created_at', { ascending: false })

  // 업체 ID 필터 동적 적용
  if (filters?.company_id) {
    query = query.eq('company_id', filters.company_id)
  }

  // 우선순위 필터 동적 적용
  if (filters?.priority) {
    query = query.eq('priority', filters.priority)
  }

  const { data, error } = await query

  if (error) {
    return { data: null, error: error.message }
  }

  // companies 중첩 객체를 company_name 필드로 평탄화
  const flattened = (data as TaskWithCompanyRaw[]).map((t) => ({
    ...t,
    company_name: t.companies?.name ?? null,
    companies: undefined,
  })) as TaskWithCompany[]

  return { data: flattened, error: null }
}

// 업무 생성 후 생성된 레코드 반환
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

// 업무 수정 후 수정된 레코드 반환
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

// 업무 삭제
export async function deleteTask(id: string): Promise<ActionResult<null>> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)

  if (error) {
    return { data: null, error: error.message }
  }

  revalidatePath('/tasks')
  return { data: null, error: null }
}

// 업무 상태만 업데이트 (칸반 보드 드래그 등 상태 전환에 활용)
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
