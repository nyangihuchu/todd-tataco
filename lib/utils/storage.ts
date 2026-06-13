import type { SupabaseClient } from '@supabase/supabase-js'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 2 * 1024 * 1024

export async function uploadClientImage(
  supabase: SupabaseClient,
  file: File,
  userId: string,
): Promise<{ url: string } | { error: string }> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: 'jpeg, png, webp 형식만 업로드 가능합니다.' }
  }

  if (file.size > MAX_SIZE) {
    return { error: '파일 크기는 2MB 이하여야 합니다.' }
  }

  const ext = file.type.split('/')[1]
  const path = `${userId}/${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage
    .from('client-images')
    .upload(path, file, { upsert: false })

  if (error) return { error: error.message }

  const { data } = supabase.storage.from('client-images').getPublicUrl(path)

  return { url: data.publicUrl }
}

export async function deleteClientImage(
  supabase: SupabaseClient,
  imageUrl: string,
): Promise<{ error: string | null }> {
  const marker = 'client-images/'
  const idx = imageUrl.indexOf(marker)

  if (idx === -1) return { error: null }

  const path = imageUrl.slice(idx + marker.length)

  const { error } = await supabase.storage.from('client-images').remove([path])

  return { error: error ? error.message : null }
}
