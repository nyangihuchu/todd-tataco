'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Tag, CalendarDays, MessageSquare, Send, X } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { createComment, deleteComment } from '@/lib/actions/comments'
import type { CommentWithAuthor } from '@/lib/actions/comments'
import type { TaskWithCategory } from '@/lib/actions/tasks'

type Status = 'pending' | 'in_progress' | 'done'
type Priority = 'high' | 'medium' | 'low'

const statusLabel: Record<Status, string> = {
  pending: '대기',
  in_progress: '진행중',
  done: '완료',
}

const priorityLabel: Record<Priority, string> = {
  high: '높음',
  medium: '보통',
  low: '낮음',
}

const priorityVariant: Record<Priority, 'destructive' | 'secondary' | 'outline'> = {
  high: 'destructive',
  medium: 'secondary',
  low: 'outline',
}

interface TaskDetailSheetProps {
  task: TaskWithCategory | null
  open: boolean
  onOpenChange: (open: boolean) => void
  comments?: CommentWithAuthor[]
  onCommentAdded?: () => void
}

export function TaskDetailSheet({
  task,
  open,
  onOpenChange,
  comments = [],
  onCommentAdded,
}: TaskDetailSheetProps) {
  const [comment, setComment] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleCommentSubmit() {
    if (!comment.trim() || !task) return

    startTransition(async () => {
      const result = await createComment(task.id, comment)
      if (result.error) {
        toast.error(result.error)
        return
      }
      setComment('')
      onCommentAdded?.()
    })
  }

  function handleDeleteComment(commentId: string) {
    startTransition(async () => {
      const result = await deleteComment(commentId)
      if (result.error) {
        toast.error(result.error)
        return
      }
      onCommentAdded?.()
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleCommentSubmit()
    }
  }

  if (!task) return null

  const status = (
    ['pending', 'in_progress', 'done'].includes(task.status)
      ? task.status
      : 'pending'
  ) as Status

  const priority = (
    ['high', 'medium', 'low'].includes(task.priority) ? task.priority : 'medium'
  ) as Priority

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='right' className='flex w-full flex-col gap-0 p-0 sm:max-w-md'>
        <SheetHeader className='border-b p-6'>
          <SheetTitle className='text-left text-base leading-snug'>{task.title}</SheetTitle>
          <div className='flex flex-wrap gap-2 pt-1'>
            <Badge variant={priorityVariant[priority]}>
              {priorityLabel[priority]}
            </Badge>
            <Badge variant='outline'>{statusLabel[status]}</Badge>
          </div>
        </SheetHeader>

        <div className='flex-1 overflow-y-auto p-6 space-y-4'>
          <div className='space-y-2 text-sm'>
            {task.category_name && (
              <div className='flex items-center gap-2 text-muted-foreground'>
                <Tag size={14} />
                <span>{task.category_name}</span>
              </div>
            )}
            {task.due_date && (
              <div className='flex items-center gap-2 text-muted-foreground'>
                <CalendarDays size={14} />
                <span>마감일: {task.due_date}</span>
              </div>
            )}
            {task.memo && (
              <p className='rounded-md bg-muted p-3 text-sm'>{task.memo}</p>
            )}
          </div>

          <Separator />

          <div className='space-y-3'>
            <div className='flex items-center gap-2 text-sm font-medium'>
              <MessageSquare size={14} />
              <span>댓글 {comments.length > 0 && `(${comments.length})`}</span>
            </div>

            {comments.length === 0 ? (
              <p className='text-xs text-muted-foreground'>첫 댓글을 남겨보세요.</p>
            ) : (
              <ul className='space-y-2'>
                {comments.map((c) => (
                  <li key={c.id} className='group flex items-start gap-2 rounded-md bg-muted/50 px-3 py-2'>
                    <div className='flex-1 space-y-0.5'>
                      <div className='flex items-center gap-1.5'>
                        <span className='text-xs font-medium'>
                          {c.author_name ?? '알 수 없음'}
                        </span>
                        <span className='text-xs text-muted-foreground'>
                          {new Date(c.created_at).toLocaleString('ko-KR', {
                            month: 'numeric',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className='text-sm'>{c.content}</p>
                    </div>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity'
                      onClick={() => handleDeleteComment(c.id)}
                      disabled={isPending}
                      aria-label='댓글 삭제'
                    >
                      <X size={12} />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className='border-t p-4'>
          <div className='flex gap-2'>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='댓글을 입력하세요... (Enter로 제출, Shift+Enter로 줄바꿈)'
              rows={2}
              disabled={isPending}
              className='flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50'
            />
            <Button
              size='icon'
              onClick={handleCommentSubmit}
              disabled={!comment.trim() || isPending}
            >
              <Send size={16} />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
