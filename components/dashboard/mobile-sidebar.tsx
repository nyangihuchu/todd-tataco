'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { SidebarNav } from '@/components/dashboard/sidebar-nav'

export function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button variant='ghost' size='icon' onClick={() => setIsOpen(true)}>
        <Menu size={20} />
        <span className='sr-only'>메뉴 열기</span>
      </Button>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side='left' className='w-64 p-0'>
          <SheetTitle className='flex h-16 items-center border-b px-6 text-lg font-bold tracking-tight'>
            TATACO
          </SheetTitle>
          <SidebarNav />
        </SheetContent>
      </Sheet>
    </>
  )
}
