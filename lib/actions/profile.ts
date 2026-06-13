'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from './types'

/**
 * 현재 로그인한 사용자의 표시 이름(display_name) 업데이트
 * 레이아웃 전체를 revalidate하여 헤더 등에 즉시 반영
 */
export async function updateDisplayName(
  displayName: string
): Promise<ActionResult<null>> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: '인증이 필요합니다' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ display_name: displayName })
    .eq('id', user.id)

  if (error) {
    return { data: null, error: error.message }
  }

  // 레이아웃 전체 revalidate — 헤더의 사용자 이름 등에 즉시 반영
  revalidatePath('/', 'layout')

  return { data: null, error: null }
}

export async function updateProfile(values: {
  display_name?: string | null
  phone?: string | null
}): Promise<ActionResult<null>> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: '인증이 필요합니다' }
  }

  const { error } = await supabase
    .from('profiles')
    .update(values)
    .eq('id', user.id)

  if (error) {
    return { data: null, error: error.message }
  }

  revalidatePath('/', 'layout')

  return { data: null, error: null }
}
