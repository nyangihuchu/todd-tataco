'use server'

// 업무 등록 폼에서 "알림 발송" 체크 시 호출하는 Server Action
export async function sendTaskNotification(taskId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/notify/task`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Server Action은 이미 인증된 컨텍스트이므로 쿠키 전달 필요
      credentials: 'include',
      body: JSON.stringify({ taskId }),
    })

    if (!res.ok) {
      const body = await res.json()
      return { success: false, error: body.error ?? '발송 실패' }
    }

    return { success: true }
  } catch {
    return { success: false, error: '네트워크 오류' }
  }
}
