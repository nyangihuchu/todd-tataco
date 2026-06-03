import { getCompanies } from '@/lib/actions/companies'
import { CompaniesClient } from '@/components/companies/companies-client'

// 업체 관리 페이지 — 서버에서 초기 데이터를 조회한 뒤 클라이언트 컴포넌트에 전달
export default async function CompaniesPage() {
  const { data: companies } = await getCompanies()
  return <CompaniesClient initialCompanies={companies ?? []} />
}
