'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function updateCompanyOnboarding(formData: FormData) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()

  if (error || !data?.claims) {
    redirect('/auth/login')
  }

  const uid = data.claims.sub as string
  const name = (formData.get('name') as string)?.trim()
  const contactName = (formData.get('contact_name') as string)?.trim()
  const phone = (formData.get('phone') as string)?.trim() || null
  const email = (formData.get('email') as string)?.trim() || null

  if (!name || !contactName) {
    throw new Error('업체명과 담당자명은 필수입니다.')
  }

  const { data: existing } = await supabase
    .from('companies')
    .select('id')
    .eq('user_id', uid)
    .single()

  if (existing) {
    const { error: updateError } = await supabase
      .from('companies')
      .update({ name, contact_name: contactName, phone, email })
      .eq('user_id', uid)
    if (updateError) throw new Error(updateError.message)
  } else {
    const { error: insertError } = await supabase
      .from('companies')
      .insert({ user_id: uid, created_by: uid, name, contact_name: contactName, phone, email })
    if (insertError) throw new Error(insertError.message)
  }

  redirect('/dashboard')
}
