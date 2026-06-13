'use server'

import { revalidatePath } from 'next/cache'
import { createClient as createSupabaseClient } from '@/lib/supabase/server'
import type { Tables } from '@/lib/supabase/database.types'
import type { ActionResult } from './types'

export type Client = Tables<'clients'>

export async function getClients(): Promise<ActionResult<Client[]>> {
  const supabase = await createSupabaseClient()

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('name', { ascending: true })

  if (error) return { data: null, error: error.message }

  return { data: data ?? [], error: null }
}

export async function getClient(id: string): Promise<ActionResult<Client>> {
  const supabase = await createSupabaseClient()

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return { data: null, error: error.message }

  return { data, error: null }
}

export async function createClient(values: {
  name: string
  contact_name?: string | null
  phone?: string | null
  email?: string | null
  website_url?: string | null
  image_url?: string | null
}): Promise<ActionResult<Client>> {
  if (!values.name?.trim()) {
    return { data: null, error: '거래처명을 입력하세요.' }
  }

  const supabase = await createSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { data: null, error: '인증이 필요합니다.' }

  const { data, error } = await supabase
    .from('clients')
    .insert({ ...values, user_id: user.id })
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  revalidatePath('/clients')
  return { data, error: null }
}

export async function updateClient(
  id: string,
  values: {
    name?: string
    contact_name?: string | null
    phone?: string | null
    email?: string | null
    website_url?: string | null
    image_url?: string | null
  },
): Promise<ActionResult<Client>> {
  const supabase = await createSupabaseClient()

  const { data, error } = await supabase
    .from('clients')
    .update(values)
    .eq('id', id)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  revalidatePath('/clients')
  return { data, error: null }
}

export async function deleteClient(id: string): Promise<ActionResult<null>> {
  const supabase = await createSupabaseClient()

  const { data, error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id)
    .select('id')

  if (error) return { data: null, error: error.message }

  if (!data || data.length === 0) {
    return { data: null, error: '삭제 권한이 없습니다.' }
  }

  revalidatePath('/clients')
  return { data: null, error: null }
}
