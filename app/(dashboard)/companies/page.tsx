import { createClient } from '@/lib/supabase/server'
import { getCompanies } from '@/lib/actions/companies'
import { CompaniesClient } from '@/components/companies/companies-client'

export default async function CompaniesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: companies } = await getCompanies()

  return (
    <CompaniesClient
      initialCompanies={companies ?? []}
      currentUserId={user?.id ?? ''}
    />
  )
}
