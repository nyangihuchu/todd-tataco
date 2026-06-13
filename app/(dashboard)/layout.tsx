import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Header } from '@/components/dashboard/header'
import { BottomNav } from '@/components/dashboard/bottom-nav'

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
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/auth/login')
  }

  const userEmail = user.email ?? ''
  const uid = user.id

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', uid)
    .single()

  const displayName = profile?.display_name ?? null

  return (
    <div className='flex h-screen overflow-hidden'>
      <Sidebar />
      <div className='flex flex-1 flex-col overflow-hidden'>
        <Header userEmail={userEmail} displayName={displayName} />
        <main className='flex-1 overflow-y-auto p-6 pb-20 md:pb-6'>{children}</main>
      </div>
      <BottomNav />
    </div>
  )
}
