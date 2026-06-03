import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Header } from '@/components/dashboard/header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense>
      <AuthenticatedLayout>{children}</AuthenticatedLayout>
    </Suspense>
  )
}

async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()

  if (error || !data?.claims) {
    redirect('/auth/login')
  }

  const userEmail = (data.claims.email as string) ?? ''

  // 현재 사용자의 표시 이름 조회
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', data.claims.sub as string)
    .single()

  const displayName = profile?.display_name ?? null

  return (
    <div className='flex h-screen overflow-hidden'>
      <Sidebar />
      <div className='flex flex-1 flex-col overflow-hidden'>
        <Header userEmail={userEmail} displayName={displayName} />
        <main className='flex-1 overflow-y-auto p-6'>{children}</main>
      </div>
    </div>
  )
}
