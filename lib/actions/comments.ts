'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Tables } from '@/lib/supabase/database.types'
import type { ActionResult } from './types'

// profiles JOIN 결과를 포함한 댓글 타입
export type CommentWithAuthor = Tables<'comments'> & { author_name: string | null }

/**
 * 특정 업무의 댓글 목록 조회
 * profiles 테이블과 JOIN하여 작성자 이름을 함께 반환
 */
export async function getComments(
  taskId: string
): Promise<ActionResult<CommentWithAuthor[]>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('comments')
    .select('*, profiles(display_name)')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true })

  if (error) {
    return { data: null, error: error.message }
  }

  // profiles 중첩 객체를 author_name 필드로 평탄화
  const flattened = (data ?? []).map((c) => ({
    ...c,
    author_name: (c.profiles as { display_name: string | null } | null)?.display_name ?? null,
    profiles: undefined,
  })) as CommentWithAuthor[]

  return { data: flattened, error: null }
}

/**
 * 댓글 생성
 * 현재 로그인한 사용자를 author_id로 설정
 */
export async function createComment(
  taskId: string,
  content: string
): Promise<ActionResult<Tables<'comments'>>> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: '인증이 필요합니다' }
  }

  const { data, error } = await supabase
    .from('comments')
    .insert({
      task_id: taskId,
      content,
      author_id: user.id,
    })
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  revalidatePath('/tasks')

  return { data, error: null }
}

/**
 * 댓글 삭제
 * RLS 정책으로 본인 댓글만 삭제 가능
 */
export async function deleteComment(id: string): Promise<ActionResult<null>> {
  const supabase = await createClient()

  const { error } = await supabase.from('comments').delete().eq('id', id)

  if (error) {
    return { data: null, error: error.message }
  }

  revalidatePath('/tasks')

  return { data: null, error: null }
}
