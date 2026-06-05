'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <div className='flex min-h-screen flex-col items-center justify-center gap-4 p-4'>
      <AlertTriangle className='h-12 w-12 text-destructive' />
      <h2 className='text-xl font-semibold'>문제가 발생했습니다</h2>
      <p className='max-w-sm text-center text-sm text-muted-foreground'>
        {error.message || '예기치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'}
      </p>
      <div className='flex gap-2'>
        <Button variant='outline' onClick={reset}>
          다시 시도
        </Button>
        <Button asChild>
          <Link href='/'>홈으로</Link>
        </Button>
      </div>
    </div>
  )
}
