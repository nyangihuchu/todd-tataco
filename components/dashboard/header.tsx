'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MobileSidebar } from '@/components/dashboard/mobile-sidebar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { updateDisplayName } from '@/lib/actions/profile'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { createClient } from '@/lib/supabase/client'
import { LogOut, Pencil } from 'lucide-react'

interface HeaderProps {
  userEmail: string
  displayName: string | null
}

export function Header({ userEmail, displayName }: HeaderProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // 드롭다운 내 이름 편집 모드 토글 상태
  const [showEdit, setShowEdit] = useState(false)
  const [nameInput, setNameInput] = useState(displayName ?? '')

  // 표시 이름: displayName이 있으면 사용, 없으면 이메일 @ 앞부분
  const visibleName = displayName ?? userEmail.split('@')[0]

  // 아바타 fallback: 표시 이름의 첫 글자 대문자
  const avatarInitial = visibleName.charAt(0).toUpperCase()

  // 드롭다운 열릴 때 편집 모드 초기화
  function handleDropdownOpenChange(open: boolean) {
    if (open) {
      setShowEdit(false)
      setNameInput(displayName ?? '')
    }
  }

  // 이름 편집 아이템 클릭 시 인라인 편집 UI로 전환
  function handleEditClick(e: Event) {
    // 드롭다운이 닫히지 않도록 기본 동작 방지
    e.preventDefault()
    setNameInput(displayName ?? '')
    setShowEdit(true)
  }

  // 이름 저장 처리
  function handleSave() {
    const trimmed = nameInput.trim()
    if (!trimmed) return

    startTransition(async () => {
      const result = await updateDisplayName(trimmed)
      if (!result.error) {
        setShowEdit(false)
        router.refresh()
      }
    })
  }

  // 로그아웃 처리 (supabase signOut 후 로그인 페이지로 이동)
  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <header className='flex h-16 shrink-0 items-center justify-between border-b bg-background px-4'>
      {/* 모바일 사이드바 토글 버튼 */}
      <div className='md:hidden'>
        <MobileSidebar />
      </div>
      <div className='hidden md:block' />

      {/* 우측 액션 영역: 다크모드 토글 + 아바타 드롭다운 */}
      <div className='flex items-center gap-2'>
        <ThemeSwitcher />

        {/* 아바타 드롭다운 메뉴 */}
        <DropdownMenu onOpenChange={handleDropdownOpenChange}>
          <DropdownMenuTrigger asChild>
            {/* 아바타 버튼 — 클릭 시 사용자 메뉴 열기 */}
            <button
              className='rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
              aria-label='사용자 메뉴 열기'
            >
              <Avatar>
                <AvatarFallback className='bg-primary text-primary-foreground font-medium'>
                  {avatarInitial}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent className='w-64' align='end'>
            {/* 사용자 정보 헤더 영역 */}
            <div className='px-2 py-2'>
              <p className='text-sm font-medium leading-none'>{visibleName}</p>
              <p className='mt-1 text-xs text-muted-foreground truncate'>{userEmail}</p>
            </div>

            <DropdownMenuSeparator />

            {/* 이름 편집 영역: 일반 메뉴 아이템 or 인라인 Input */}
            {showEdit ? (
              // 인라인 이름 편집 UI
              <div className='px-2 py-2' onClick={(e) => e.stopPropagation()}>
                <p className='mb-2 text-xs font-medium text-muted-foreground'>표시 이름 변경</p>
                <div className='flex gap-2'>
                  <Input
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder='이름 입력'
                    className='h-8 text-sm'
                    autoFocus
                    onKeyDown={(e) => {
                      // Enter 키로도 저장 가능
                      if (e.key === 'Enter') handleSave()
                      // Escape 키로 편집 취소
                      if (e.key === 'Escape') setShowEdit(false)
                    }}
                  />
                  <Button
                    size='sm'
                    onClick={handleSave}
                    disabled={isPending || !nameInput.trim()}
                  >
                    {isPending ? '저장 중' : '저장'}
                  </Button>
                </div>
              </div>
            ) : (
              // 이름 변경 메뉴 아이템
              <DropdownMenuItem onSelect={handleEditClick} className='cursor-pointer'>
                <Pencil />
                이름 변경
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onSelect={() => handleLogout()}
              className='cursor-pointer text-destructive focus:text-destructive'
            >
              <LogOut />
              로그아웃
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
