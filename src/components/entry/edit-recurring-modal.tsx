import { useState, useEffect, useMemo } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, StopCircle, RotateCcw, History } from 'lucide-react'
import { Money } from '@/components/shared/money'
import { catColor, KIND_META } from '@/lib/constants'
import { useActiveCategories } from '@/hooks/use-categories'
import {
  useUpdateEntryAmount,
  useUpdateEntryDetails,
  useStopEntry,
  useReactivateEntry,
} from '@/hooks/use-entries'
import { toast } from '@/components/shared/toast'
import type { Entry, FrequencyType, AmountVersion } from '@/types'

// ── Helpers ────────────────────────────────────────────────────

function toISOMonth(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}-01`
}

function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
}

const FREQ_OPTIONS: { value: FrequencyType; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'once', label: 'Once' },
]

// ── Component ──────────────────────────────────────────────────

interface Props {
  entry: Entry
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditRecurringModal({ entry, open, onOpenChange }: Props) {
  const isIncome = entry.kind === 'scheduled_income'
  const meta = KIND_META[entry.kind]
  const isStopped = !!entry.end_date

  // Hooks
  const updateAmount = useUpdateEntryAmount()
  const updateDetails = useUpdateEntryDetails()
  const stopEntry = useStopEntry()
  const reactivateEntry = useReactivateEntry()

  const categoryType = isIncome ? 'income' : 'expense'
  const categories = useActiveCategories(categoryType)

  // ── Local form state ─────────────────────────────────────────

  const [amount, setAmount] = useState('')
  const [effectiveDate, setEffectiveDate] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [frequency, setFrequency] = useState<FrequencyType>('monthly')

  // Stop controls
  const [showStopPicker, setShowStopPicker] = useState(false)
  const [stopDate, setStopDate] = useState('')

  // Reset state when entry changes or modal opens
  useEffect(() => {
    if (!open) return
    setAmount(String(entry.amount))
    setEffectiveDate(toISOMonth(new Date()))
    setDescription(entry.description)
    setCategory(entry.category)
    setFrequency(entry.frequency ?? 'monthly')
    setShowStopPicker(false)
    setStopDate(new Date().toISOString().slice(0, 10))
  }, [entry, open])

  // ── Derived ──────────────────────────────────────────────────

  const amountNum = parseFloat(amount)
  const amountChanged = !isNaN(amountNum) && amountNum > 0 && amountNum !== entry.amount
  const detailsChanged =
    description !== entry.description ||
    category !== entry.category ||
    frequency !== (entry.frequency ?? 'monthly')

  const hasChanges = amountChanged || detailsChanged

  // Sort history for display
  const history: AmountVersion[] = useMemo(() => {
    const h = entry.amount_history ?? []
    return [...h].sort((a, b) => a.from.localeCompare(b.from))
  }, [entry.amount_history])

  // ── Handlers ─────────────────────────────────────────────────

  async function handleSave() {
    try {
      if (amountChanged) {
        await updateAmount.mutateAsync({
          id: entry.id,
          amount: amountNum,
          effectiveDate,
        })
      }
      if (detailsChanged) {
        await updateDetails.mutateAsync({
          id: entry.id,
          description,
          category,
          frequency,
        })
      }
      toast('Entry updated')
      onOpenChange(false)
    } catch {
      toast('Failed to update')
    }
  }

  async function handleStop() {
    try {
      await stopEntry.mutateAsync({ id: entry.id, endDate: stopDate })
      toast('Subscription stopped')
      onOpenChange(false)
    } catch {
      toast('Failed to stop')
    }
  }

  async function handleReactivate() {
    try {
      await reactivateEntry.mutateAsync(entry.id)
      toast('Reactivated')
      onOpenChange(false)
    } catch {
      toast('Failed to reactivate')
    }
  }

  const isPending =
    updateAmount.isPending ||
    updateDetails.isPending ||
    stopEntry.isPending ||
    reactivateEntry.isPending

  const name = entry.description || entry.category

  // ── Render ───────────────────────────────────────────────────

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/40 animate-in fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[101] w-[460px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 rounded-[22px] border border-bline bg-bsurface p-6 shadow-[0_20px_60px_rgba(0,0,0,.18)] animate-in fade-in-0 zoom-in-95">
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
                  {name}
                </Dialog.Title>
                <div className="text-[12px] text-bmuted">
                  {meta.label}
                  {isStopped && (
                    <span className="ml-2 rounded-full bg-bred-soft px-2 py-0.5 text-[10px] font-bold text-bred">
                      Cancelled {formatDate(entry.end_date!)}
                    </span>
                  )}
                </div>
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

          {/* ── Effective date (only shown when amount changed) ── */}
          {amountChanged && (
            <div className="mb-4">
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.07em] text-bmuted">
                New amount effective from
              </label>
              <input
                type="date"
                value={effectiveDate}
                onChange={e => setEffectiveDate(e.target.value)}
                className="h-[44px] w-full rounded-[12px] border border-bline bg-bsurface-2 px-3.5 text-[14px] text-bink outline-none transition-colors focus:border-bink"
              />
            </div>
          )}

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

          {/* ── Frequency ── */}
          <div className="mb-5">
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.07em] text-bmuted">
              Frequency
            </label>
            <div className="flex gap-1.5">
              {FREQ_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFrequency(opt.value)}
                  className={`flex-1 rounded-[10px] border py-[8px] text-center text-[12.5px] font-semibold transition-all ${
                    frequency === opt.value
                      ? 'border-bink bg-bink text-white'
                      : 'border-bline bg-bsurface-2 text-bink-2 hover:bg-bsurface'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Price history ── */}
          {history.length > 0 && (
            <div className="mb-5 rounded-[14px] border border-bline-2 bg-bsurface-2 p-3.5">
              <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.07em] text-bmuted">
                <History size={12} />
                Price history
              </div>
              <div className="space-y-1">
                {history.map((v, i) => {
                  const isCurrent = i === history.length - 1
                  return (
                    <div
                      key={`${v.from}-${v.amount}`}
                      className={`flex items-center justify-between text-[12.5px] ${
                        isCurrent ? 'font-bold text-bink' : 'text-bmuted'
                      }`}
                    >
                      <span>
                        <Money value={v.amount} auto />
                      </span>
                      <span className="text-[11.5px]">
                        from {formatDate(v.from)}
                        {isCurrent && (
                          <span className="ml-1.5 rounded-full bg-bgreen-soft px-1.5 py-0.5 text-[10px] font-bold text-bgreen">
                            current
                          </span>
                        )}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Save button ── */}
          <button
            type="button"
            onClick={handleSave}
            disabled={!hasChanges || isPending}
            className="mb-4 h-[44px] w-full rounded-[12px] bg-bink text-[14px] font-bold text-white transition-colors hover:bg-bink/90 disabled:opacity-40"
          >
            {isPending ? 'Saving…' : 'Save changes'}
          </button>

          {/* ── Danger zone ── */}
          <div className="rounded-[14px] border border-bline-2 bg-bsurface-2 p-3.5">
            {isStopped ? (
              /* ── Reactivate ── */
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[12.5px] font-semibold text-bink">
                    This entry is cancelled
                  </div>
                  <div className="text-[11.5px] text-bmuted">
                    Ended {formatDate(entry.end_date!)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleReactivate}
                  disabled={isPending}
                  className="flex items-center gap-1.5 rounded-[10px] border border-bgreen bg-bgreen-soft px-3.5 py-[7px] text-[12.5px] font-bold text-bgreen transition-colors hover:bg-bgreen/10 disabled:opacity-40"
                >
                  <RotateCcw size={13} />
                  Reactivate
                </button>
              </div>
            ) : showStopPicker ? (
              /* ── Stop date picker ── */
              <div>
                <div className="mb-2.5 text-[12px] font-bold text-bred">
                  Stop this {isIncome ? 'income' : 'subscription'}
                </div>
                <div className="mb-2.5">
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.07em] text-bmuted">
                    End date
                  </label>
                  <input
                    type="date"
                    value={stopDate}
                    onChange={e => setStopDate(e.target.value)}
                    className="h-[40px] w-full rounded-[10px] border border-bline bg-bsurface px-3 text-[14px] text-bink outline-none focus:border-bred"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleStop}
                    disabled={isPending || !stopDate}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-[10px] bg-bred py-[8px] text-[12.5px] font-bold text-white transition-colors hover:bg-bred/90 disabled:opacity-40"
                  >
                    <StopCircle size={13} />
                    Confirm stop
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowStopPicker(false)}
                    className="rounded-[10px] border border-bline px-4 py-[8px] text-[12.5px] font-semibold text-bink-2 transition-colors hover:bg-bsurface"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* ── Stop button ── */
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[12.5px] font-semibold text-bink">
                    Danger zone
                  </div>
                  <div className="text-[11.5px] text-bmuted">
                    Stop generating future occurrences
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowStopPicker(true)}
                  className="flex items-center gap-1.5 rounded-[10px] border border-bred bg-bred-soft px-3.5 py-[7px] text-[12.5px] font-bold text-bred transition-colors hover:bg-bred/10"
                >
                  <StopCircle size={13} />
                  Stop {isIncome ? 'income' : 'subscription'}
                </button>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
