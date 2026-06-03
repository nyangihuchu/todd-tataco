import { Skeleton } from '@/components/ui/skeleton'

export function KanbanSkeleton() {
  return (
    <div className='flex gap-4 overflow-x-auto pb-4'>
      {Array.from({ length: 4 }).map((_, colIdx) => (
        <div key={colIdx} className='w-72 shrink-0 rounded-lg bg-muted/50 p-3'>
          <div className='mb-3 flex items-center gap-2'>
            <Skeleton className='h-4 w-16' />
            <Skeleton className='h-4 w-6 rounded-full' />
          </div>
          <div className='flex flex-col gap-2'>
            {Array.from({ length: 3 }).map((_, cardIdx) => (
              <div key={cardIdx} className='rounded-md border bg-background p-3 space-y-2'>
                <Skeleton className='h-4 w-3/4' />
                <Skeleton className='h-3 w-1/2' />
                <Skeleton className='h-3 w-1/3' />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
