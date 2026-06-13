import { createClient } from '@/lib/supabase/server'
import { getCategories } from '@/lib/actions/categories'
import { ProfileForm } from '@/components/settings/profile-form'
import { CategoryManager } from '@/components/settings/category-manager'
import { Separator } from '@/components/ui/separator'

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [profileResult, categoriesResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('display_name, phone')
      .eq('id', user!.id)
      .single(),
    getCategories(),
  ])

  return (
    <div className='max-w-lg space-y-8'>
      <h1 className='text-xl font-bold sm:text-2xl'>설정</h1>

      <section className='space-y-4'>
        <div>
          <h2 className='text-base font-semibold'>프로필</h2>
          <p className='text-sm text-muted-foreground'>이름과 연락처를 관리합니다.</p>
        </div>
        <Separator />
        <ProfileForm
          displayName={profileResult.data?.display_name ?? null}
          phone={profileResult.data?.phone ?? null}
        />
      </section>

      <section className='space-y-4'>
        <div>
          <h2 className='text-base font-semibold'>카테고리</h2>
          <p className='text-sm text-muted-foreground'>업무를 분류할 카테고리를 관리합니다.</p>
        </div>
        <Separator />
        <CategoryManager initialCategories={categoriesResult.data ?? []} />
      </section>
    </div>
  )
}
