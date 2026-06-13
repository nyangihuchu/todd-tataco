'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ImagePlus, X } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient as createClientAction, updateClient } from '@/lib/actions/clients'
import { uploadClientImage, deleteClientImage } from '@/lib/utils/storage'
import { createClient } from '@/lib/supabase/client'
import type { Client } from '@/lib/actions/clients'

const schema = z.object({
  name: z.string().min(1, '거래처명을 입력하세요'),
  contact_name: z.string().optional(),
  phone: z.string().optional(),
  email: z
    .string()
    .email('올바른 이메일 형식을 입력하세요')
    .optional()
    .or(z.literal('')),
  website_url: z
    .string()
    .url('올바른 URL 형식을 입력하세요 (https://...)')
    .optional()
    .or(z.literal('')),
})

type FormValues = z.infer<typeof schema>

interface ClientFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client?: Client | null
  onSuccess?: () => void
}

export function ClientFormModal({
  open,
  onOpenChange,
  client,
  onSuccess,
}: ClientFormModalProps) {
  const [isPending, startTransition] = useTransition()
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const isEdit = !!client

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      contact_name: '',
      phone: '',
      email: '',
      website_url: '',
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        name: client?.name ?? '',
        contact_name: client?.contact_name ?? '',
        phone: client?.phone ?? '',
        email: client?.email ?? '',
        website_url: client?.website_url ?? '',
      })
      setImageFile(null)
      setImagePreview(client?.image_url ?? null)
    }
  }, [open, client, reset])

  useEffect(() => {
    return () => {
      if (imagePreview && !imagePreview.startsWith('http')) {
        URL.revokeObjectURL(imagePreview)
      }
    }
  }, [imagePreview])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      toast.error('jpeg, png, webp 형식만 업로드 가능합니다.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('파일 크기는 2MB 이하여야 합니다.')
      return
    }

    setImageFile(file)
    const prev = imagePreview
    const objectUrl = URL.createObjectURL(file)
    setImagePreview(objectUrl)
    if (prev && !prev.startsWith('http')) {
      URL.revokeObjectURL(prev)
    }
  }

  function handleRemoveImage() {
    if (imagePreview && !imagePreview.startsWith('http')) {
      URL.revokeObjectURL(imagePreview)
    }
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function onSubmit(data: FormValues) {
    startTransition(async () => {
      let imageUrl: string | null = isEdit ? (client.image_url ?? null) : null

      if (imageFile) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          toast.error('인증이 필요합니다.')
          return
        }

        if (isEdit && client.image_url) {
          await deleteClientImage(supabase, client.image_url)
        }

        const uploadResult = await uploadClientImage(supabase, imageFile, user.id)
        if ('error' in uploadResult) {
          toast.error(`이미지 업로드 실패: ${uploadResult.error}`)
          return
        }
        imageUrl = uploadResult.url
      } else if (!imagePreview && isEdit && client.image_url) {
        await deleteClientImage(supabase, client.image_url)
        imageUrl = null
      }

      const values = {
        name: data.name,
        contact_name: data.contact_name || null,
        phone: data.phone || null,
        email: data.email || null,
        website_url: data.website_url || null,
        image_url: imageUrl,
      }

      if (isEdit) {
        const result = await updateClient(client.id, values)
        if (result.error) {
          toast.error(`수정 실패: ${result.error}`)
          return
        }
        toast.success('거래처가 수정되었습니다.')
      } else {
        const result = await createClientAction(values)
        if (result.error) {
          toast.error(`등록 실패: ${result.error}`)
          return
        }
        toast.success('거래처가 등록되었습니다.')
      }

      onOpenChange(false)
      onSuccess?.()
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='right' className='flex w-full flex-col gap-0 sm:max-w-md'>
        <SheetHeader className='border-b px-4 py-3'>
          <SheetTitle>{isEdit ? '거래처 수정' : '거래처 추가'}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className='flex flex-1 flex-col overflow-y-auto'>
          <div className='flex flex-col gap-4 px-4 py-4'>
          <div className='flex flex-col items-center gap-2'>
            <div className='relative'>
              {imagePreview ? (
                <>
                  <img
                    src={imagePreview}
                    alt='거래처 이미지'
                    className='h-20 w-20 rounded-full object-cover'
                  />
                  <button
                    type='button'
                    onClick={handleRemoveImage}
                    className='absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-destructive text-destructive-foreground'
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
                <button
                  type='button'
                  onClick={() => fileInputRef.current?.click()}
                  className='flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-full border-2 border-dashed border-muted-foreground/40 text-muted-foreground transition-colors active:border-primary active:text-primary'
                >
                  <ImagePlus size={20} />
                  <span className='text-xs'>사진</span>
                </button>
              )}
            </div>
            {imagePreview && (
              <button
                type='button'
                onClick={() => fileInputRef.current?.click()}
                className='min-h-[36px] px-3 text-xs text-muted-foreground underline'
              >
                이미지 변경
              </button>
            )}
            <input
              ref={fileInputRef}
              type='file'
              accept='image/jpeg,image/png,image/webp'
              className='hidden'
              onChange={handleFileChange}
            />
          </div>

          <div className='flex flex-col gap-1'>
            <Label htmlFor='name'>거래처명 *</Label>
            <Input id='name' {...register('name')} placeholder='거래처명 입력' />
            {errors.name && (
              <p className='text-xs text-destructive'>{errors.name.message}</p>
            )}
          </div>

          <div className='flex flex-col gap-1'>
            <Label htmlFor='contact_name'>담당자</Label>
            <Input
              id='contact_name'
              {...register('contact_name')}
              placeholder='담당자명 입력'
            />
          </div>

          <div className='flex flex-col gap-1'>
            <Label htmlFor='phone'>연락처</Label>
            <Input
              id='phone'
              type='tel'
              inputMode='tel'
              {...register('phone')}
              placeholder='010-0000-0000'
            />
          </div>

          <div className='flex flex-col gap-1'>
            <Label htmlFor='email'>이메일</Label>
            <Input
              id='email'
              type='email'
              inputMode='email'
              {...register('email')}
              placeholder='example@email.com'
            />
            {errors.email && (
              <p className='text-xs text-destructive'>{errors.email.message}</p>
            )}
          </div>

          <div className='flex flex-col gap-1'>
            <Label htmlFor='website_url'>웹사이트</Label>
            <Input
              id='website_url'
              type='url'
              inputMode='url'
              {...register('website_url')}
              placeholder='https://example.com'
            />
            {errors.website_url && (
              <p className='text-xs text-destructive'>{errors.website_url.message}</p>
            )}
          </div>
        </div>

        <SheetFooter className='border-t px-4 py-3'>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className='flex-1'
            >
              취소
            </Button>
            <Button type='submit' disabled={isPending} className='flex-1'>
              {isPending
                ? isEdit
                  ? '저장 중...'
                  : '등록 중...'
                : isEdit
                  ? '저장'
                  : '등록'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
