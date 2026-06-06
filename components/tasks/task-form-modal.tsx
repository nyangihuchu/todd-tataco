'use client'

import { useEffect, useTransition } from 'react'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { createTask, updateTask } from '@/lib/actions/tasks'
import { sendTaskNotification, scheduleTaskNotification } from '@/lib/actions/notifications'
import type { TaskWithCompany } from '@/lib/actions/tasks'
import type { Tables } from '@/lib/supabase/database.types'

// ISO 문자열을 datetime-local input 값으로 변환 (YYYY-MM-DDTHH:mm)
function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return ''
  // 이미 datetime-local 형식인 경우 그대로 사용
  const match = iso.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/)
  if (match) return `${match[1]}T${match[2]}`
  // 날짜만 있는 경우 시간 00:00 추가
  const dateOnly = iso.match(/^(\d{4}-\d{2}-\d{2})/)
  if (dateOnly) return `${dateOnly[1]}T00:00`
  return ''
}

const schema = z.object({
  title: z.string().min(1, '업무명을 입력하세요'),
  company_id: z.string().min(1, '업체를 선택하세요'),
  priority: z.enum(['high', 'medium', 'low']),
  status: z.enum(['pending', 'in_progress', 'review', 'done']),
  start_date: z.string().optional(),
  due_date: z.string().optional(),
  memo: z.string().optional(),
  send_notification: z.boolean(),
  notification_type: z.enum(['immediate', 'scheduled']).optional(),
  notification_scheduled_at: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const priorityOptions = [
  { value: 'high', label: '높음' },
  { value: 'medium', label: '보통' },
  { value: 'low', label: '낮음' },
]

const statusOptions = [
  { value: 'pending', label: '대기' },
  { value: 'in_progress', label: '진행중' },
  { value: 'review', label: '확인요청' },
  { value: 'done', label: '완료' },
]

interface TaskFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  // DB 타입 기반 defaultValues (edit 모드에서 전달)
  defaultValues?: TaskWithCompany
  // Server Component에서 전달받는 업체 목록
  companies: Tables<'companies'>[]
  // 성공 후 목록 갱신을 위한 콜백
  onSuccess?: () => void
}

export function TaskFormModal({
  open,
  onOpenChange,
  mode,
  defaultValues,
  companies,
  onSuccess,
}: TaskFormModalProps) {
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      company_id: '',
      priority: 'medium',
      status: 'pending',
      start_date: '',
      due_date: '',
      memo: '',
      send_notification: false,
      notification_type: 'immediate',
      notification_scheduled_at: '',
    },
  })

  const watchedCompanyId = useWatch({ control, name: 'company_id' })
  const watchedSendNotification = useWatch({ control, name: 'send_notification' })
  const watchedNotificationType = useWatch({ control, name: 'notification_type' })
  const selectedCompany = companies.find((c) => c.id === watchedCompanyId)
  const hasPhone = !!selectedCompany?.phone

  // Sheet가 열릴 때마다 폼 초기화
  useEffect(() => {
    if (open) {
      reset({
        title: defaultValues?.title ?? '',
        company_id: defaultValues?.company_id ?? '',
        // DB의 priority/status는 string이지만 스키마 enum으로 캐스팅
        priority: (['high', 'medium', 'low'].includes(defaultValues?.priority ?? '')
          ? defaultValues?.priority
          : 'medium') as FormValues['priority'],
        status: (
          ['pending', 'in_progress', 'review', 'done'].includes(defaultValues?.status ?? '')
            ? defaultValues?.status
            : 'pending'
        ) as FormValues['status'],
        start_date: toDatetimeLocal(defaultValues?.start_date),
        due_date: toDatetimeLocal(defaultValues?.due_date),
        memo: defaultValues?.memo ?? '',
        send_notification: false,
        notification_type: 'immediate',
        notification_scheduled_at: '',
      })
    }
  }, [open, defaultValues, reset])

  function onSubmit(data: FormValues) {
    startTransition(async () => {
      // datetime-local 값을 ISO 문자열로 변환 (빈 값은 null 처리)
      const start_date = data.start_date ? new Date(data.start_date).toISOString() : null
      const due_date = data.due_date ? new Date(data.due_date).toISOString() : null

      if (mode === 'create') {
        // 신규 업무 생성
        const result = await createTask({
          title: data.title,
          company_id: data.company_id,
          priority: data.priority,
          status: data.status,
          start_date,
          due_date,
          memo: data.memo || null,
        })

        if (result.error) {
          toast.error(`등록 실패: ${result.error}`)
          return
        }

        if (data.send_notification && result.data?.id) {
          if (data.notification_type === 'scheduled' && data.notification_scheduled_at) {
            const schedResult = await scheduleTaskNotification(result.data.id, data.notification_scheduled_at)
            if (schedResult.error) {
              toast.warning(`업무는 등록되었으나 알림 예약에 실패했습니다: ${schedResult.error}`)
            } else {
              toast.info('알림이 예약되었습니다')
            }
          } else {
            const notifResult = await sendTaskNotification(result.data.id)
            if (!notifResult.success) {
              toast.warning('업무는 등록되었으나 알림 발송에 실패했습니다')
            }
          }
        }

        toast.success('업무가 등록되었습니다')
      } else {
        // 기존 업무 수정 (edit 모드에서는 defaultValues.id 필수)
        if (!defaultValues?.id) return

        const result = await updateTask(defaultValues.id, {
          title: data.title,
          company_id: data.company_id,
          priority: data.priority,
          status: data.status,
          start_date,
          due_date,
          memo: data.memo || null,
        })

        if (result.error) {
          toast.error(`수정 실패: ${result.error}`)
          return
        }

        toast.success('업무가 수정되었습니다')
      }

      onOpenChange(false)
      onSuccess?.()
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {/* 오른쪽에서 슬라이드되는 패널, 너비 고정 */}
      <SheetContent side='right' className='flex w-full flex-col gap-0 sm:max-w-md'>
        <SheetHeader className='border-b px-4 py-3'>
          <SheetTitle>{mode === 'create' ? '업무 추가' : '업무 수정'}</SheetTitle>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className='flex flex-1 flex-col overflow-y-auto'
        >
          {/* 폼 본문 — 스크롤 가능 영역 */}
          <div className='flex flex-col gap-3 px-4 py-3'>
            {/* 업무명 */}
            <div className='flex flex-col gap-1'>
              <Label htmlFor='title'>업무명 *</Label>
              <Input id='title' {...register('title')} placeholder='업무명 입력' />
              {errors.title && (
                <p className='text-xs text-destructive'>{errors.title.message}</p>
              )}
            </div>

            {/* 업체 선택 */}
            <div className='flex flex-col gap-1'>
              <Label>업체 *</Label>
              <Controller
                name='company_id'
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder='업체 선택' />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.company_id && (
                <p className='text-xs text-destructive'>{errors.company_id.message}</p>
              )}
            </div>

            {/* 우선순위 + 상태 — 2열 그리드 */}
            <div className='grid grid-cols-2 gap-2'>
              <div className='flex flex-col gap-1'>
                <Label>우선순위</Label>
                <Controller
                  name='priority'
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priorityOptions.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className='flex flex-col gap-1'>
                <Label>상태</Label>
                <Controller
                  name='status'
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            {/* 시작일 (datetime-local) */}
            <div className='flex flex-col gap-1'>
              <Label htmlFor='start_date'>시작일</Label>
              <Input
                id='start_date'
                type='datetime-local'
                {...register('start_date')}
                className='cursor-pointer'
              />
            </div>

            {/* 마감일 (datetime-local) */}
            <div className='flex flex-col gap-1'>
              <Label htmlFor='due_date'>마감일</Label>
              <Input
                id='due_date'
                type='datetime-local'
                {...register('due_date')}
                className='cursor-pointer'
              />
            </div>

            {/* 메모 */}
            <div className='flex flex-col gap-1'>
              <Label htmlFor='memo'>메모</Label>
              <Input id='memo' {...register('memo')} placeholder='메모 입력' />
            </div>

            {/* 알림 발송 — create 모드에서만 표시 */}
            {mode === 'create' && (
              <div className='flex flex-col gap-2'>
                <div className='flex items-center gap-2'>
                  <Controller
                    name='send_notification'
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        id='send_notification'
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!hasPhone}
                      />
                    )}
                  />
                  <Label
                    htmlFor='send_notification'
                    className={!hasPhone ? 'cursor-default text-muted-foreground' : 'cursor-pointer'}
                  >
                    업체에 알림 발송
                  </Label>
                </div>

                {/* 발송 시간 선택 — 알림 ON + 전화번호 있을 때만 표시 */}
                {watchedSendNotification && hasPhone && (
                  <div className='ml-6 flex flex-col gap-2 rounded-md border p-3'>
                    <Controller
                      name='notification_type'
                      control={control}
                      render={({ field }) => (
                        <div className='flex flex-col gap-2'>
                          <label className='flex cursor-pointer items-center gap-2 text-sm'>
                            <input
                              type='radio'
                              value='immediate'
                              checked={field.value === 'immediate'}
                              onChange={() => field.onChange('immediate')}
                              className='accent-primary'
                            />
                            즉시 발송
                          </label>
                          <label className='flex cursor-pointer items-center gap-2 text-sm'>
                            <input
                              type='radio'
                              value='scheduled'
                              checked={field.value === 'scheduled'}
                              onChange={() => field.onChange('scheduled')}
                              className='accent-primary'
                            />
                            예약 발송
                          </label>
                        </div>
                      )}
                    />
                    {watchedNotificationType === 'scheduled' && (
                      <div className='flex flex-col gap-1'>
                        <Input
                          type='datetime-local'
                          min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                          {...register('notification_scheduled_at')}
                          className='cursor-pointer text-sm'
                        />
                        <p className='text-xs text-muted-foreground'>현재 시각 이후로 설정해 주세요</p>
                      </div>
                    )}
                  </div>
                )}

                {watchedCompanyId && !hasPhone && (
                  <p className='text-xs text-muted-foreground'>전화번호가 등록되지 않은 업체입니다</p>
                )}
              </div>
            )}
          </div>

          {/* 하단 버튼 영역 */}
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
                ? mode === 'create'
                  ? '등록 중...'
                  : '저장 중...'
                : mode === 'create'
                  ? '등록'
                  : '저장'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
