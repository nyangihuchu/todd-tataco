import { createClient } from '@/lib/supabase/server'
import { getCompanies } from '@/lib/actions/companies'
import { CompaniesClient } from '@/components/companies/companies-client'

export default async function CompaniesPage() {
  const supabase = await createClient()
  const [{ data: { user } }, { data: companies }] = await Promise.all([
    supabase.auth.getUser(),
    getCompanies(),
  ])

  return (
    <CompaniesClient
      initialCompanies={companies ?? []}
      currentUserId={user?.id ?? ''}
    />
  )
}
