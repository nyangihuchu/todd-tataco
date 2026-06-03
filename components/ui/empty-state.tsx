import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className='flex flex-col items-center justify-center gap-2 py-12 text-center'>
      {icon && <div className='text-muted-foreground'>{icon}</div>}
      <h3 className='text-sm font-medium'>{title}</h3>
      {description && (
        <p className='text-xs text-muted-foreground'>{description}</p>
      )}
    </div>
  )
}
