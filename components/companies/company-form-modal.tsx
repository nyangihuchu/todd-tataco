'use client'

import { useEffect, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createCompany, updateCompany } from '@/lib/actions/companies'
import type { Tables } from '@/lib/supabase/database.types'

const schema = z.object({
  name: z.string().min(1, '업체명을 입력하세요'),
  contact_name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  memo: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface CompanyFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  defaultValues?: Tables<'companies'>
  // 저장 성공 시 부모에서 router.refresh() + 모달 닫기 처리
  onSaved: () => void
}

export function CompanyFormModal({
  open,
  onOpenChange,
  mode,
  defaultValues,
  onSaved,
}: CompanyFormModalProps) {
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      contact_name: defaultValues?.contact_name ?? '',
      phone: defaultValues?.phone ?? '',
      email: defaultValues?.email ?? '',
      memo: defaultValues?.memo ?? '',
    },
  })

  // 모달이 열릴 때마다 defaultValues로 폼 초기화
  useEffect(() => {
    if (open) {
      reset({
        name: defaultValues?.name ?? '',
        contact_name: defaultValues?.contact_name ?? '',
        phone: defaultValues?.phone ?? '',
        email: defaultValues?.email ?? '',
        memo: defaultValues?.memo ?? '',
      })
    }
  }, [open, defaultValues, reset])

  function onSubmit(data: FormValues) {
    startTransition(async () => {
      if (mode === 'create') {
        // 신규 업체 생성
        const result = await createCompany(data)
        if (result.error) {
          toast.error(result.error)
          return
        }
        toast.success('업체가 등록되었습니다')
      } else {
        // 기존 업체 수정 — defaultValues.id 필수
        if (!defaultValues?.id) return
        const result = await updateCompany(defaultValues.id, data)
        if (result.error) {
          toast.error(result.error)
          return
        }
        toast.success('업체 정보가 수정되었습니다')
      }

      // 성공: 부모에서 모달 닫기 + router.refresh() 처리
      onSaved()
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='w-full sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? '업체 추가' : '업체 수정'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
          <div className='space-y-1'>
            <Label htmlFor='name'>업체명 *</Label>
            <Input id='name' {...register('name')} placeholder='업체명 입력' />
            {errors.name && (
              <p className='text-xs text-destructive'>{errors.name.message}</p>
            )}
          </div>
          <div className='space-y-1'>
            <Label htmlFor='contact_name'>담당자</Label>
            <Input id='contact_name' {...register('contact_name')} placeholder='담당자 이름' />
          </div>
          <div className='space-y-1'>
            <Label htmlFor='phone'>연락처</Label>
            <Input id='phone' {...register('phone')} placeholder='010-0000-0000' />
          </div>
          <div className='space-y-1'>
            <Label htmlFor='email'>이메일</Label>
            <Input id='email' {...register('email')} placeholder='example@email.com' />
          </div>
          <div className='space-y-1'>
            <Label htmlFor='memo'>메모</Label>
            <Input id='memo' {...register('memo')} placeholder='메모 입력' />
          </div>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              취소
            </Button>
            <Button type='submit' disabled={isPending}>
              {isPending ? '저장 중...' : mode === 'create' ? '등록' : '저장'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
