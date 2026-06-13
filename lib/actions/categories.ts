'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Tables } from '@/lib/supabase/database.types'
import type { ActionResult } from './types'

export type Category = Tables<'categories'>

export async function getCategories(): Promise<ActionResult<Category[]>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) return { data: null, error: error.message }

  return { data: data ?? [], error: null }
}

export async function createCategory(values: {
  name: string
  color: string
}): Promise<ActionResult<Category>> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { data: null, error: '인증이 필요합니다.' }

  const { data, error } = await supabase
    .from('categories')
    .insert({ name: values.name, color: values.color, user_id: user.id })
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  revalidatePath('/settings')
  return { data, error: null }
}

export async function updateCategory(
  id: string,
  values: { name?: string; color?: string }
): Promise<ActionResult<Category>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('categories')
    .update(values)
    .eq('id', id)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  revalidatePath('/settings')
  return { data, error: null }
}

export async function deleteCategory(id: string): Promise<ActionResult<null>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
    .select('id')

  if (error) return { data: null, error: error.message }

  if (!data || data.length === 0) {
    return { data: null, error: '삭제 권한이 없습니다.' }
  }

  revalidatePath('/settings')
  return { data: null, error: null }
}
