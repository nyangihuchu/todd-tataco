import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'

export default function SettingsLoading() {
  return (
    <div className='max-w-lg space-y-8'>
      <Skeleton className='h-8 w-24' />

      <section className='space-y-4'>
        <div className='space-y-1'>
          <Skeleton className='h-5 w-20' />
          <Skeleton className='h-4 w-48' />
        </div>
        <Separator />
        <div className='space-y-4'>
          <div className='space-y-2'>
            <Skeleton className='h-4 w-16' />
            <Skeleton className='h-10 w-full' />
          </div>
          <div className='space-y-2'>
            <Skeleton className='h-4 w-16' />
            <Skeleton className='h-10 w-full' />
          </div>
          <Skeleton className='h-10 w-24' />
        </div>
      </section>

      <section className='space-y-4'>
        <div className='space-y-1'>
          <Skeleton className='h-5 w-24' />
          <Skeleton className='h-4 w-56' />
        </div>
        <Separator />
        <div className='space-y-2'>
          {[1, 2, 3].map((i) => (
            <div key={i} className='flex items-center gap-2'>
              <Skeleton className='h-6 w-6 rounded-full' />
              <Skeleton className='h-8 flex-1' />
              <Skeleton className='h-8 w-16' />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
