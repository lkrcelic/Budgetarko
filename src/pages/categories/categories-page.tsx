import { useState } from 'react'
import { useCategories, useCreateCategory, useToggleCategory } from '@/hooks/use-categories'
import { Segmented } from '@/components/shared/segmented'
import { catColor } from '@/lib/constants'
import { toast } from '@/components/shared/toast'
import type { Category } from '@/types'

export default function CategoriesPage() {
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<'income' | 'expense'>('expense')

  const { data: categories = [] } = useCategories()
  const createCategory = useCreateCategory()
  const toggleCategory = useToggleCategory()

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
          className="h-[40px] flex-1 rounded-[11px] border border-bline bg-bsurface-2 px-3 text-[14px] text-bink outline-none transition-colors focus:border-bink"
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
          Add category
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
                    className={`flex items-center gap-3 rounded-[12px] px-3 py-[10px] transition-colors ${
                      cat.active ? '' : 'opacity-40'
                    }`}
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: catColor(cat.name) }}
                    />
                    <span className="flex-1 text-[13.5px] font-semibold text-bink">
                      {cat.name}
                    </span>
                    {/* Toggle switch */}
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
