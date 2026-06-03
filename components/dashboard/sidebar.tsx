import { SidebarNav } from '@/components/dashboard/sidebar-nav'

export function Sidebar() {
  return (
    <aside className='hidden w-64 shrink-0 flex-col border-r bg-background md:flex'>
      <div className='flex h-16 items-center border-b px-6'>
        <span className='text-lg font-bold tracking-tight'>TATACO</span>
      </div>
      <div className='flex-1 overflow-y-auto'>
        <SidebarNav />
      </div>
    </aside>
  )
}
