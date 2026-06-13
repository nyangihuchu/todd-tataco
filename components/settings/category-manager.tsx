'use client'

import { useState, useTransition } from 'react'
import { Pencil, Trash2, Plus, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createCategory, updateCategory, deleteCategory } from '@/lib/actions/categories'
import type { Category } from '@/lib/actions/categories'

const COLOR_PALETTE = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#64748b',
  '#84cc16',
  '#14b8a6',
  '#f43f5e',
]

interface CategoryManagerProps {
  initialCategories: Category[]
}

export function CategoryManager({ initialCategories }: CategoryManagerProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState(COLOR_PALETTE[0])
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(COLOR_PALETTE[0])
  const [isPending, startTransition] = useTransition()

  function startEdit(cat: Category) {
    setEditingId(cat.id)
    setEditName(cat.name)
    setEditColor(cat.color)
    setAdding(false)
  }

  function cancelEdit() {
    setEditingId(null)
  }

  function handleUpdate(id: string) {
    if (!editName.trim()) return
    startTransition(async () => {
      const result = await updateCategory(id, { name: editName.trim(), color: editColor })
      if (result.error) {
        toast.error(`수정 실패: ${result.error}`)
        return
      }
      setCategories((prev) => prev.map((c) => (c.id === id ? result.data! : c)))
      setEditingId(null)
      toast.success('카테고리가 수정되었습니다')
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteCategory(id)
      if (result.error) {
        toast.error(`삭제 실패: ${result.error}`)
        return
      }
      setCategories((prev) => prev.filter((c) => c.id !== id))
      toast.success('카테고리가 삭제되었습니다')
    })
  }

  function handleCreate() {
    if (!newName.trim()) return
    startTransition(async () => {
      const result = await createCategory({ name: newName.trim(), color: newColor })
      if (result.error) {
        toast.error(`추가 실패: ${result.error}`)
        return
      }
      setCategories((prev) => [...prev, result.data!])
      setNewName('')
      setNewColor(COLOR_PALETTE[0])
      setAdding(false)
      toast.success('카테고리가 추가되었습니다')
    })
  }

  return (
    <div className='space-y-2'>
      {categories.length === 0 && !adding && (
        <p className='text-sm text-muted-foreground'>등록된 카테고리가 없습니다.</p>
      )}

      {categories.map((cat) =>
        editingId === cat.id ? (
          <div key={cat.id} className='space-y-2 rounded-md border p-3'>
            <div className='flex items-center gap-2'>
              <span
                className='h-4 w-4 shrink-0 rounded-full border'
                style={{ background: editColor }}
              />
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className='h-8 flex-1 text-sm'
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleUpdate(cat.id)
                  if (e.key === 'Escape') cancelEdit()
                }}
                autoFocus
              />
              <Button
                size='icon'
                variant='ghost'
                className='h-8 w-8'
                onClick={() => handleUpdate(cat.id)}
                disabled={isPending || !editName.trim()}
              >
                <Check size={14} />
              </Button>
              <Button
                size='icon'
                variant='ghost'
                className='h-8 w-8'
                onClick={cancelEdit}
              >
                <X size={14} />
              </Button>
            </div>
            <ColorPalette value={editColor} onChange={setEditColor} />
          </div>
        ) : (
          <div key={cat.id} className='flex items-center gap-2 rounded-md border px-3 py-2'>
            <span
              className='h-4 w-4 shrink-0 rounded-full'
              style={{ background: cat.color }}
            />
            <span className='flex-1 text-sm'>{cat.name}</span>
            <Button
              size='icon'
              variant='ghost'
              className='h-8 w-8'
              onClick={() => startEdit(cat)}
              disabled={isPending}
            >
              <Pencil size={14} />
            </Button>
            <Button
              size='icon'
              variant='ghost'
              className='h-8 w-8 text-destructive hover:text-destructive'
              onClick={() => handleDelete(cat.id)}
              disabled={isPending}
            >
              <Trash2 size={14} />
            </Button>
          </div>
        )
      )}

      {adding ? (
        <div className='space-y-2 rounded-md border p-3'>
          <div className='flex items-center gap-2'>
            <span
              className='h-4 w-4 shrink-0 rounded-full border'
              style={{ background: newColor }}
            />
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className='h-8 flex-1 text-sm'
              placeholder='카테고리 이름'
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate()
                if (e.key === 'Escape') setAdding(false)
              }}
              autoFocus
            />
            <Button
              size='icon'
              variant='ghost'
              className='h-8 w-8'
              onClick={handleCreate}
              disabled={isPending || !newName.trim()}
            >
              <Check size={14} />
            </Button>
            <Button
              size='icon'
              variant='ghost'
              className='h-8 w-8'
              onClick={() => setAdding(false)}
            >
              <X size={14} />
            </Button>
          </div>
          <ColorPalette value={newColor} onChange={setNewColor} />
        </div>
      ) : (
        <Button
          variant='outline'
          size='sm'
          className='gap-1.5'
          onClick={() => {
            setAdding(true)
            setEditingId(null)
          }}
        >
          <Plus size={14} />
          카테고리 추가
        </Button>
      )}
    </div>
  )
}

function ColorPalette({
  value,
  onChange,
}: {
  value: string
  onChange: (color: string) => void
}) {
  return (
    <div className='flex flex-wrap gap-1.5'>
      {COLOR_PALETTE.map((color) => (
        <button
          key={color}
          type='button'
          className='h-5 w-5 rounded-full transition-transform hover:scale-110'
          style={{
            background: color,
            outline: value === color ? '2px solid currentColor' : 'none',
            outlineOffset: '2px',
          }}
          onClick={() => onChange(color)}
        />
      ))}
    </div>
  )
}
