'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function DashboardError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[DashboardError]', error)
  }, [error])

  return (
    <div className='flex min-h-[50vh] flex-col items-center justify-center gap-4 p-4'>
      <AlertTriangle className='h-10 w-10 text-destructive' />
      <h2 className='text-lg font-semibold'>페이지를 불러오지 못했습니다</h2>
      <p className='max-w-sm text-center text-sm text-muted-foreground'>
        {error.message || '일시적인 오류가 발생했습니다. 다시 시도해주세요.'}
      </p>
      <div className='flex gap-2'>
        <Button variant='outline' onClick={reset}>
          다시 시도
        </Button>
        <Button asChild>
          <Link href='/dashboard'>대시보드로 돌아가기</Link>
        </Button>
      </div>
    </div>
  )
}
