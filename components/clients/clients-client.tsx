'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Plus, Building2, Phone, Mail, Globe } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ClientFormModal } from '@/components/clients/client-form-modal'
import { deleteClient } from '@/lib/actions/clients'
import { deleteClientImage } from '@/lib/utils/storage'
import { createClient } from '@/lib/supabase/client'
import type { Client } from '@/lib/actions/clients'

interface ClientsClientProps {
  initialClients: Client[]
}

export function ClientsClient({ initialClients }: ClientsClientProps) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [isPending, startTransition] = useTransition()
  const supabase = createClient()

  function handleAdd() {
    setSelectedClient(null)
    setIsModalOpen(true)
  }

  function handleEdit(client: Client) {
    setSelectedClient(client)
    setIsModalOpen(true)
  }

  function handleDelete(client: Client) {
    if (!window.confirm(`'${client.name}' 거래처를 삭제하시겠습니까?`)) return

    startTransition(async () => {
      if (client.image_url) {
        await deleteClientImage(supabase, client.image_url)
      }

      const result = await deleteClient(client.id)
      if (result.error) {
        toast.error(`삭제 실패: ${result.error}`)
        return
      }

      toast.success('거래처가 삭제되었습니다.')
      router.refresh()
    })
  }

  function handleSuccess() {
    router.refresh()
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-xl font-bold sm:text-2xl'>거래처</h1>
        <Button onClick={handleAdd} size='sm'>
          <Plus size={16} className='mr-1' />
          거래처 추가
        </Button>
      </div>

      {initialClients.length === 0 ? (
        <div className='flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed py-16 text-center'>
          <Building2 size={40} className='text-muted-foreground' />
          <div className='space-y-1'>
            <p className='font-medium'>등록된 거래처가 없습니다.</p>
            <p className='text-sm text-muted-foreground'>
              거래처를 추가하여 연락처를 관리하세요.
            </p>
          </div>
          <Button onClick={handleAdd} variant='outline' size='sm'>
            <Plus size={16} className='mr-1' />
            거래처 추가
          </Button>
        </div>
      ) : (
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {initialClients.map((client) => (
            <div
              key={client.id}
              className='relative flex flex-col gap-3 rounded-lg border bg-card p-4 shadow-sm'
            >
              <div className='flex items-start gap-3'>
                <Avatar className='h-12 w-12 shrink-0'>
                  {client.image_url && (
                    <AvatarImage src={client.image_url} alt={client.name} />
                  )}
                  <AvatarFallback className='text-base font-semibold'>
                    {client.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className='min-w-0 flex-1'>
                  <p className='truncate font-semibold'>{client.name}</p>
                  {client.contact_name && (
                    <p className='truncate text-sm text-muted-foreground'>
                      {client.contact_name}
                    </p>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='h-7 w-7 shrink-0'
                      disabled={isPending}
                    >
                      <MoreHorizontal size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuItem onClick={() => handleEdit(client)}>
                      수정
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(client)}
                      className='text-destructive focus:text-destructive'
                    >
                      삭제
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className='flex flex-col gap-1.5 text-sm text-muted-foreground'>
                {client.phone && (
                  <div className='flex items-center gap-2'>
                    <Phone size={13} className='shrink-0' />
                    <span className='truncate'>{client.phone}</span>
                  </div>
                )}
                {client.email && (
                  <div className='flex items-center gap-2'>
                    <Mail size={13} className='shrink-0' />
                    <span className='truncate'>{client.email}</span>
                  </div>
                )}
                {client.website_url && (
                  <div className='flex items-center gap-2'>
                    <Globe size={13} className='shrink-0' />
                    <a
                      href={client.website_url}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='truncate hover:text-foreground hover:underline'
                    >
                      {client.website_url.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ClientFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        client={selectedClient}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
