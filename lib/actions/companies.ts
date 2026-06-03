'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Tables, TablesInsert, TablesUpdate } from '@/lib/supabase/database.types'
import type { ActionResult } from './types'

// 전체 업체 목록 조회 (생성일 내림차순)
export async function getCompanies(): Promise<ActionResult<Tables<'companies'>[]>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

// 업체 생성 후 생성된 레코드 반환
export async function createCompany(
  values: TablesInsert<'companies'>
): Promise<ActionResult<Tables<'companies'>>> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: '인증이 필요합니다.' }
  }

  const { data, error } = await supabase
    .from('companies')
    .insert({ ...values, created_by: user.id })
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  revalidatePath('/companies')
  return { data, error: null }
}

// 업체 수정 후 수정된 레코드 반환
export async function updateCompany(
  id: string,
  values: TablesUpdate<'companies'>
): Promise<ActionResult<Tables<'companies'>>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('companies')
    .update(values)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  revalidatePath('/companies')
  return { data, error: null }
}

// 업체 삭제
export async function deleteCompany(id: string): Promise<ActionResult<null>> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('companies')
    .delete()
    .eq('id', id)

  if (error) {
    return { data: null, error: error.message }
  }

  revalidatePath('/companies')
  return { data: null, error: null }
}
