'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ClipboardList, CalendarDays, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: '대시보드', icon: LayoutDashboard },
  { href: '/tasks', label: '업무 관리', icon: ClipboardList },
  { href: '/calendar', label: '캘린더', icon: CalendarDays },
  { href: '/settings', label: '설정', icon: Settings },
]

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <nav className='flex flex-col gap-1 p-3'>
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )}
          >
            <Icon size={18} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
