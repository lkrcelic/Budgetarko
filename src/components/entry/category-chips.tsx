import { useState } from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { catColor } from '@/lib/constants'
import { useCreateCategory } from '@/hooks/use-categories'
import type { CategoryType } from '@/types'

interface CategoryChipsProps {
  categories: string[]
  selected: string
  type: CategoryType
  onSelect: (name: string) => void
}

/**
 * Horizontal chip list for category selection + inline "add new" flow.
 * Matches .m-chips / .m-chip from prototype.
 */
export function CategoryChips({ categories, selected, type, onSelect }: CategoryChipsProps) {
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const createCategory = useCreateCategory()

  async function handleAdd() {
    const name = newName.trim()
    if (!name) return
    await createCategory.mutateAsync({ name, type })
    onSelect(name)
    setAdding(false)
    setNewName('')
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {categories.map(c => {
          const active = c === selected
          const color = catColor(c)
          return (
            <button
              key={c}
              type="button"
              onClick={() => onSelect(c)}
              className={cn(
                'inline-flex items-center gap-[7px] rounded-[12px] border px-[13px] py-[9px] text-[13.5px] font-semibold transition-all',
                active
                  ? 'font-bold text-bink'
                  : 'border-bline bg-bsurface text-bink-2',
              )}
              style={
                active
                  ? { borderColor: color, background: color + '14' }
                  : undefined
              }
            >
              <span className="h-2 w-2 flex-none rounded-full" style={{ background: color }} />
              {c}
            </button>
          )
        })}

        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-[7px] rounded-[12px] border border-dashed border-bline px-[13px] py-[9px] text-[13.5px] font-semibold text-bgreen"
          >
            <Plus size={14} />
            New
          </button>
        )}
      </div>

      {adding && (
        <div className="mt-2.5 flex gap-2">
          <input
            autoFocus
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdd() } }}
            placeholder="Category name"
            className="h-[42px] flex-1 rounded-[12px] border border-bline bg-bsurface px-[13px] text-[14px] text-bink outline-none transition-colors focus:border-bink"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={createCategory.isPending || !newName.trim()}
            className="rounded-[12px] bg-bink px-4 text-[13.5px] font-semibold text-white disabled:opacity-40"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => { setAdding(false); setNewName('') }}
            className="rounded-[12px] border border-bline px-3 text-[13.5px] font-semibold text-bink-2"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
