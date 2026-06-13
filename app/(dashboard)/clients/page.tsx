import { getClients } from '@/lib/actions/clients'
import { ClientsClient } from '@/components/clients/clients-client'

export default async function ClientsPage() {
  const result = await getClients()
  const clients = result.data ?? []

  return <ClientsClient initialClients={clients} />
}
