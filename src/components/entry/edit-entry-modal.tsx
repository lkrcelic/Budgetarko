import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { catColor, KIND_META } from '@/lib/constants'
import { useActiveCategories } from '@/hooks/use-categories'
import { useUpdateEntry } from '@/hooks/use-entries'
import { toast, toastError } from '@/components/shared/toast'
import { MONTHS } from '@/lib/constants'
import type { Entry } from '@/types'

// ── Component ──────────────────────────────────────────────────

interface Props {
  entry: Entry
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditEntryModal({ entry, open, onOpenChange }: Props) {
  const isIncome = entry.kind === 'income'
  const meta = KIND_META[entry.kind]

  const updateEntry = useUpdateEntry()
  const categoryType = isIncome ? 'income' : 'expense'
  const categories = useActiveCategories(categoryType)

  // ── Local form state ─────────────────────────────────────────

  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [year, setYear] = useState(2026)
  const [month, setMonth] = useState(1)

  // Reset state when entry changes or modal opens
  useEffect(() => {
    if (!open) return
    setAmount(String(entry.amount))
    setDescription(entry.description)
    setCategory(entry.category)
    setYear(entry.year)
    setMonth(entry.month)
  }, [entry, open])

  // ── Derived ──────────────────────────────────────────────────

  const amountNum = parseFloat(amount)
  const hasChanges =
    (!isNaN(amountNum) && amountNum > 0 && amountNum !== entry.amount) ||
    description !== entry.description ||
    category !== entry.category ||
    year !== entry.year ||
    month !== entry.month

  // ── Handlers ─────────────────────────────────────────────────

  async function handleSave() {
    if (!hasChanges || isNaN(amountNum) || amountNum <= 0) return
    try {
      await updateEntry.mutateAsync({
        id: entry.id,
        amount: amountNum,
        description,
        category,
        year,
        month,
      })
      toast('Entry updated')
      onOpenChange(false)
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Failed to update')
    }
  }

  const name = entry.description || entry.category

  // ── Render ───────────────────────────────────────────────────

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/40 animate-in fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[101] w-[420px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 rounded-[22px] border border-bline bg-bsurface p-6 shadow-[0_20px_60px_rgba(0,0,0,.18)] animate-in fade-in-0 zoom-in-95">
          {/* Header */}
          <div className="mb-5 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span
                className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] text-[14px] font-bold text-white"
                style={{ background: meta.color }}
              >
                <span
                  className="h-[10px] w-[10px] rounded-full"
                  style={{ background: catColor(entry.category) }}
                />
              </span>
              <div>
                <Dialog.Title className="text-[16px] font-bold text-bink">
                  Edit {name}
                </Dialog.Title>
                <div className="text-[12px] text-bmuted">{meta.label}</div>
              </div>
            </div>
            <Dialog.Close className="flex h-7 w-7 items-center justify-center rounded-[8px] text-bmuted transition-colors hover:bg-bsurface-2 hover:text-bink">
              <X size={16} />
            </Dialog.Close>
          </div>

          {/* ── Amount ── */}
          <div className="mb-4">
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.07em] text-bmuted">
              Amount (€)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="h-[44px] w-full rounded-[12px] border border-bline bg-bsurface-2 px-3.5 text-[15px] font-semibold text-bink outline-none transition-colors focus:border-bink"
            />
          </div>

          {/* ── Description ── */}
          <div className="mb-4">
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.07em] text-bmuted">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Optional description"
              className="h-[44px] w-full rounded-[12px] border border-bline bg-bsurface-2 px-3.5 text-[14px] text-bink outline-none transition-colors focus:border-bink"
            />
          </div>

          {/* ── Category ── */}
          <div className="mb-4">
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.07em] text-bmuted">
              Category
            </label>
            <div className="flex flex-wrap gap-1.5">
              {categories.map(c => {
                const active = c === category
                const color = catColor(c)
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={`inline-flex items-center gap-1.5 rounded-[10px] border px-3 py-[7px] text-[12.5px] font-semibold transition-all ${
                      active
                        ? 'font-bold text-bink'
                        : 'border-bline bg-bsurface-2 text-bink-2'
                    }`}
                    style={
                      active
                        ? { borderColor: color, background: color + '14' }
                        : undefined
                    }
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
                    {c}
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Date (month + year) ── */}
          <div className="mb-5">
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.07em] text-bmuted">
              Date
            </label>
            <div className="flex gap-2">
              {/* Month selector */}
              <div className="flex flex-1 flex-wrap gap-1">
                {MONTHS.map((m, i) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMonth(i + 1)}
                    className={`rounded-[8px] px-[8px] py-[6px] text-[11.5px] font-semibold transition-colors ${
                      month === i + 1
                        ? 'bg-bink text-white'
                        : 'bg-bsurface-2 text-bink-2 hover:bg-bline'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
              {/* Year input */}
              <input
                type="number"
                value={year}
                onChange={e => setYear(parseInt(e.target.value) || year)}
                className="h-[44px] w-[80px] shrink-0 rounded-[12px] border border-bline bg-bsurface-2 px-2.5 text-center text-[14px] font-bold text-bink outline-none transition-colors focus:border-bink"
              />
            </div>
          </div>

          {/* ── Save button ── */}
          <button
            type="button"
            onClick={handleSave}
            disabled={!hasChanges || updateEntry.isPending}
            className="h-[44px] w-full rounded-[12px] bg-bink text-[14px] font-bold text-white transition-colors hover:bg-bink/90 disabled:opacity-40"
          >
            {updateEntry.isPending ? 'Saving…' : 'Save changes'}
          </button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
