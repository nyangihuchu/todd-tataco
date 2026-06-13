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
import { Textarea } from '@/components/ui/textarea'
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
import type { TaskWithCategory } from '@/lib/actions/tasks'

function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return ''
  const match = iso.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/)
  if (match) return `${match[1]}T${match[2]}`
  const dateOnly = iso.match(/^(\d{4}-\d{2}-\d{2})/)
  if (dateOnly) return `${dateOnly[1]}T00:00`
  return ''
}

const schema = z.object({
  title: z.string().min(1, '업무명을 입력하세요'),
  priority: z.enum(['high', 'medium', 'low']),
  status: z.enum(['pending', 'in_progress', 'done']),
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
  { value: 'pending', label: '할일' },
  { value: 'in_progress', label: '진행중' },
  { value: 'done', label: '완료' },
]

interface TaskFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  defaultValues?: TaskWithCategory
  onSuccess?: () => void
}

export function TaskFormModal({
  open,
  onOpenChange,
  mode,
  defaultValues,
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

  const watchedSendNotification = useWatch({ control, name: 'send_notification' })
  const watchedNotificationType = useWatch({ control, name: 'notification_type' })

  useEffect(() => {
    if (open) {
      reset({
        title: defaultValues?.title ?? '',
        priority: (['high', 'medium', 'low'].includes(defaultValues?.priority ?? '')
          ? defaultValues?.priority
          : 'medium') as FormValues['priority'],
        status: (
          ['pending', 'in_progress', 'done'].includes(defaultValues?.status ?? '')
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
      const start_date = data.start_date ? new Date(data.start_date).toISOString() : null
      const due_date = data.due_date ? new Date(data.due_date).toISOString() : null

      if (mode === 'create') {
        const result = await createTask({
          title: data.title,
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
        if (!defaultValues?.id) return

        const result = await updateTask(defaultValues.id, {
          title: data.title,
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

        if (data.send_notification) {
          if (data.notification_type === 'scheduled' && data.notification_scheduled_at) {
            const schedResult = await scheduleTaskNotification(defaultValues.id, data.notification_scheduled_at)
            if (schedResult.error) {
              toast.warning(`업무는 수정되었으나 알림 예약에 실패했습니다: ${schedResult.error}`)
            } else {
              toast.info('알림이 예약되었습니다')
            }
          } else {
            const notifResult = await sendTaskNotification(defaultValues.id)
            if (!notifResult.success) {
              toast.warning('업무는 수정되었으나 알림 발송에 실패했습니다')
            }
          }
        }

        toast.success('업무가 수정되었습니다')
      }

      onOpenChange(false)
      onSuccess?.()
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='right' className='flex w-full flex-col gap-0 sm:max-w-md'>
        <SheetHeader className='border-b px-4 py-3'>
          <SheetTitle>{mode === 'create' ? '업무 추가' : '업무 수정'}</SheetTitle>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className='flex flex-1 flex-col overflow-y-auto'
        >
          <div className='flex flex-col gap-3 px-4 py-3'>
            <div className='flex flex-col gap-1'>
              <Label htmlFor='title'>업무명 *</Label>
              <Input id='title' {...register('title')} placeholder='업무명 입력' />
              {errors.title && (
                <p className='text-xs text-destructive'>{errors.title.message}</p>
              )}
            </div>

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

            <div className='flex flex-col gap-1'>
              <Label htmlFor='start_date'>시작일</Label>
              <Input
                id='start_date'
                type='datetime-local'
                {...register('start_date')}
                className='cursor-pointer'
              />
            </div>

            <div className='flex flex-col gap-1'>
              <Label htmlFor='due_date'>마감일</Label>
              <Input
                id='due_date'
                type='datetime-local'
                {...register('due_date')}
                className='cursor-pointer'
              />
            </div>

            <div className='flex flex-col gap-1'>
              <Label htmlFor='memo'>메모</Label>
              <Textarea
                id='memo'
                {...register('memo')}
                placeholder='메모 입력'
                className='resize-none'
                rows={3}
              />
            </div>

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
                    />
                  )}
                />
                <Label htmlFor='send_notification' className='cursor-pointer'>
                  알림 발송
                </Label>
              </div>

              {watchedSendNotification && (
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
