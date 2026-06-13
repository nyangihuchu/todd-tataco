'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { updateProfile } from '@/lib/actions/profile'

const schema = z.object({
  display_name: z.string().min(1, '이름을 입력하세요').max(50),
  phone: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface ProfileFormProps {
  displayName: string | null
  phone: string | null
}

export function ProfileForm({ displayName, phone }: ProfileFormProps) {
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      display_name: displayName ?? '',
      phone: phone ?? '',
    },
  })

  function onSubmit(data: FormValues) {
    startTransition(async () => {
      const result = await updateProfile({
        display_name: data.display_name,
        phone: data.phone || null,
      })

      if (result.error) {
        toast.error(`저장 실패: ${result.error}`)
        return
      }

      toast.success('프로필이 저장되었습니다')
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
      <div className='flex flex-col gap-1'>
        <Label htmlFor='display_name'>이름</Label>
        <Input
          id='display_name'
          {...register('display_name')}
          placeholder='표시 이름 입력'
        />
        {errors.display_name && (
          <p className='text-xs text-destructive'>{errors.display_name.message}</p>
        )}
      </div>

      <div className='flex flex-col gap-1'>
        <Label htmlFor='phone'>전화번호</Label>
        <Input
          id='phone'
          {...register('phone')}
          placeholder='010-0000-0000'
        />
      </div>

      <Button type='submit' disabled={isPending}>
        {isPending ? '저장 중...' : '저장'}
      </Button>
    </form>
  )
}
