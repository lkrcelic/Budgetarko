import { useState, useRef, useEffect } from 'react'
import { Pencil, Trash2, Check, X } from 'lucide-react'
import {
  useCategories,
  useCreateCategory,
  useToggleCategory,
  useRenameCategory,
  useDeleteCategory,
} from '@/hooks/use-categories'
import { Segmented } from '@/components/shared/segmented'
import { catColor } from '@/lib/constants'
import { toast } from '@/components/shared/toast'
import type { Category } from '@/types'

export default function CategoriesPage() {
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<'income' | 'expense'>('expense')

  // Inline-edit state
  const [editingId, setEditingId]   = useState<string | null>(null)
  const [editValue, setEditValue]   = useState('')
  // Two-step delete state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const editInputRef = useRef<HTMLInputElement>(null)

  const { data: categories = [] } = useCategories()
  const createCategory = useCreateCategory()
  const toggleCategory = useToggleCategory()
  const renameCategory = useRenameCategory()
  const deleteCategory = useDeleteCategory()

  // Focus edit input when entering edit mode
  useEffect(() => {
    if (editingId) editInputRef.current?.focus()
  }, [editingId])

  // Cancel confirm-delete if user clicks away (via escape key or editing something else)
  function clearConfirm() { setConfirmDeleteId(null) }

  const grouped = (type: 'income' | 'expense') =>
    categories.filter((c: Category) => c.type === type)

  async function handleAdd() {
    const name = newName.trim()
    if (!name) return
    await createCategory.mutateAsync({ name, type: newType })
    toast('Category added')
    setNewName('')
  }

  async function handleToggle(cat: Category) {
    await toggleCategory.mutateAsync({ id: cat.id, active: !cat.active })
  }

  function startEdit(cat: Category) {
    setConfirmDeleteId(null)
    setEditingId(cat.id)
    setEditValue(cat.name)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditValue('')
  }

  async function handleRename(cat: Category) {
    const trimmed = editValue.trim()
    if (!trimmed || trimmed === cat.name) { cancelEdit(); return }
    await renameCategory.mutateAsync({ id: cat.id, name: trimmed })
    toast('Category renamed')
    cancelEdit()
  }

  function startDelete(cat: Category) {
    setEditingId(null)
    setConfirmDeleteId(cat.id)
  }

  async function handleDelete(cat: Category) {
    setConfirmDeleteId(null)
    await deleteCategory.mutateAsync({ id: cat.id, name: cat.name })
    toast(`"${cat.name}" deleted — affected entries set to uncategorized`)
  }

  return (
    <div className="min-h-full p-7">
      {/* ── Page header ── */}
      <div className="mb-6">
        <div className="text-[11px] font-bold uppercase tracking-[0.07em] text-bmuted">
          Categories
        </div>
        <h1 className="mt-0.5 text-[26px] font-extrabold tracking-tight text-bink">
          Manage categories
        </h1>
      </div>

      {/* ── Add new category ── */}
      <div className="mb-6 flex items-center gap-3 rounded-[18px] border border-bline bg-bsurface p-4">
        <input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdd() } }}
          placeholder="New category name"
          className="h-[40px] flex-1 rounded-[11px] border border-bline bg-bsurface-2 px-3 text-[16px] text-bink outline-none transition-colors focus:border-bink"
        />
        <Segmented
          value={newType}
          onChange={v => setNewType(v as 'income' | 'expense')}
          options={[
            { value: 'income',  label: 'Income'  },
            { value: 'expense', label: 'Expense' },
          ]}
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!newName.trim() || createCategory.isPending}
          className="h-[40px] rounded-[11px] bg-bink px-4 text-[13.5px] font-semibold text-white disabled:opacity-40"
        >
          Add
        </button>
      </div>

      {/* ── Two-column category lists ── */}
      <div className="grid grid-cols-2 gap-5">
        {(['income', 'expense'] as const).map(type => (
          <div key={type} className="rounded-[20px] border border-bline bg-bsurface p-5">
            <div className="mb-4 text-[13px] font-bold text-bink">
              {type === 'income' ? 'Income' : 'Expense'} categories
            </div>
            <div className="flex flex-col gap-[2px]">
              {grouped(type).length === 0 ? (
                <p className="text-[13px] text-bmuted">No categories yet.</p>
              ) : (
                grouped(type).map((cat: Category) => (
                  <div
                    key={cat.id}
                    className={`flex items-center gap-2 rounded-[12px] px-3 py-[9px] transition-colors ${
                      cat.active ? '' : 'opacity-40'
                    }`}
                  >
                    {/* Colour dot */}
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: catColor(cat.name) }}
                    />

                    {/* ── Edit mode ── */}
                    {editingId === cat.id ? (
                      <>
                        <input
                          ref={editInputRef}
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleRename(cat)
                            if (e.key === 'Escape') cancelEdit()
                          }}
                          className="h-[28px] flex-1 rounded-[8px] border border-bink bg-bsurface-2 px-2 text-[13px] text-bink outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleRename(cat)}
                          disabled={renameCategory.isPending}
                          className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-bgreen text-white transition-colors hover:opacity-80"
                          aria-label="Save rename"
                        >
                          <Check size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="flex h-7 w-7 items-center justify-center rounded-[8px] border border-bline text-bink-2 transition-colors hover:bg-bsurface-2"
                          aria-label="Cancel rename"
                        >
                          <X size={13} />
                        </button>
                      </>
                    ) : confirmDeleteId === cat.id ? (
                      /* ── Confirm-delete mode ── */
                      <>
                        <span className="flex-1 text-[13px] font-semibold text-bred">
                          Delete "{cat.name}"?
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDelete(cat)}
                          disabled={deleteCategory.isPending}
                          className="rounded-[8px] bg-bred px-2.5 py-1 text-[12px] font-bold text-white transition-opacity hover:opacity-80"
                        >
                          {deleteCategory.isPending ? '…' : 'Delete'}
                        </button>
                        <button
                          type="button"
                          onClick={clearConfirm}
                          className="flex h-7 w-7 items-center justify-center rounded-[8px] border border-bline text-bink-2 transition-colors hover:bg-bsurface-2"
                          aria-label="Cancel delete"
                        >
                          <X size={13} />
                        </button>
                      </>
                    ) : (
                      /* ── Normal mode ── */
                      <>
                        <span className="flex-1 text-[13.5px] font-semibold text-bink">
                          {cat.name}
                        </span>

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => startEdit(cat)}
                          className="flex h-7 w-7 items-center justify-center rounded-[8px] text-bmuted transition-colors hover:bg-bsurface-2 hover:text-bink"
                          aria-label="Edit category name"
                        >
                          <Pencil size={13} />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => startDelete(cat)}
                          className="flex h-7 w-7 items-center justify-center rounded-[8px] text-bmuted transition-colors hover:bg-bred-soft hover:text-bred"
                          aria-label="Delete category"
                        >
                          <Trash2 size={13} />
                        </button>

                        {/* Toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggle(cat)}
                          disabled={toggleCategory.isPending}
                          aria-label={cat.active ? 'Disable category' : 'Enable category'}
                          className={`relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors ${
                            cat.active ? 'bg-bgreen' : 'bg-bline'
                          }`}
                        >
                          <span
                            className={`absolute top-[3px] h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                              cat.active ? 'translate-x-[18px]' : 'translate-x-[3px]'
                            }`}
                          />
                        </button>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
