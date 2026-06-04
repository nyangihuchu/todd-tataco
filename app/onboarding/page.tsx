import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateCompanyOnboarding } from '@/lib/actions/onboarding'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

async function OnboardingContent() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/auth/login')
  }

  const uid = user.id

  const { data: company } = await supabase
    .from('companies')
    .select('contact_name')
    .eq('user_id', uid)
    .single()

  if (company?.contact_name) {
    redirect('/dashboard')
  }

  return (
    <div className='flex min-h-svh w-full items-center justify-center p-6 md:p-10'>
      <div className='w-full max-w-sm'>
        <div className='mb-4 flex justify-end'>
          <Button variant='ghost' size='sm' asChild>
            <Link href='/auth/signout'>로그아웃</Link>
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className='text-2xl'>업체 정보 등록</CardTitle>
            <CardDescription>서비스 이용을 위해 업체 정보를 입력해 주세요.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateCompanyOnboarding}>
              <div className='flex flex-col gap-4'>
                <div className='grid gap-2'>
                  <Label htmlFor='name'>업체명 *</Label>
                  <Input id='name' name='name' placeholder='(주)타타코' required />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='contact_name'>담당자명 *</Label>
                  <Input id='contact_name' name='contact_name' placeholder='홍길동' required />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='phone'>연락처</Label>
                  <Input id='phone' name='phone' type='tel' placeholder='010-0000-0000' />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='email'>업체 이메일</Label>
                  <Input id='email' name='email' type='email' placeholder='company@example.com' />
                </div>
                <Button type='submit' className='w-full mt-2'>
                  등록 완료
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingContent />
    </Suspense>
  )
}
