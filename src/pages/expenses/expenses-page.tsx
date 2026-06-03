import { useState, useMemo } from 'react'
import { useAppStore } from '@/stores/app-store'
import { useExpenseEntries, useSubscriptionExpenseEntries } from '@/hooks/use-year-data'
import { useDeleteEntry } from '@/hooks/use-entries'
import { Money } from '@/components/shared/money'
import { EditEntryModal } from '@/components/entry/edit-entry-modal'
import { EditRecurringModal } from '@/components/entry/edit-recurring-modal'
import { catColor, MONTHS_LONG, KIND_META } from '@/lib/constants'
import { toast } from '@/components/shared/toast'
import { Trash2, ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react'
import type { Entry } from '@/types'

// ── Helpers ────────────────────────────────────────────────────

function perMonth(e: Entry): number {
  if (e.frequency === 'monthly') return e.amount
  if (e.frequency === 'yearly')  return e.amount / 12
  return 0
}

function perYear(e: Entry): number {
  if (e.frequency === 'monthly') return e.amount * 12
  if (e.frequency === 'yearly')  return e.amount
  return 0
}

const FREQ_LABELS: Record<string, string> = {
  monthly: 'Monthly',
  yearly:  'Yearly',
  once:    'One-time',
}

function isCancelled(e: Entry): boolean {
  if (!e.end_date) return false
  return new Date(e.end_date) < new Date()
}

function isFutureCancelled(e: Entry): boolean {
  if (!e.end_date) return false
  return new Date(e.end_date) >= new Date()
}

function formatEndDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
}

// ── Page ───────────────────────────────────────────────────────

export default function ExpensesPage() {
  const year    = useAppStore(s => s.year)
  const setYear = useAppStore(s => s.setYear)

  const oneTimeEntries = useExpenseEntries()
  const allSubs        = useSubscriptionExpenseEntries()
  const deleteEntry    = useDeleteEntry()

  // Modal state — tracks which entry is being edited and which modal to show
  const [editOneTime, setEditOneTime]       = useState<Entry | null>(null)
  const [editRecurring, setEditRecurring]   = useState<Entry | null>(null)

  // Cancelled toggle
  const activeSubs    = allSubs.filter(e => !isCancelled(e))
  const cancelledSubs = allSubs.filter(e => isCancelled(e))
  const [showCancelled, setShowCancelled] = useState(false)

  // Recurring totals (active, non-once only)
  const recurActive = activeSubs.filter(e => e.frequency !== 'once' && !e.end_date)
  const subMonthly = recurActive.reduce((s, e) => s + perMonth(e), 0)
  const subYearly  = recurActive.reduce((s, e) => s + perYear(e),  0)

  // One-time totals
  const oneTimeTotal = oneTimeEntries.reduce((sum, e) => sum + e.amount, 0)

  // Combined totals (one-time for the year + recurring annualised)
  const totalYear  = oneTimeTotal + subYearly
  const totalMonth = totalYear / 12

  // Group one-time entries by month
  const grouped = useMemo(() => {
    const byMonth: Record<number, Entry[]> = {}
    for (const e of oneTimeEntries) {
      if (!byMonth[e.month]) byMonth[e.month] = []
      byMonth[e.month].push(e)
    }
    for (const m of Object.keys(byMonth)) {
      byMonth[Number(m)].sort((a, b) => b.amount - a.amount)
    }
    return Object.entries(byMonth)
      .map(([m, items]) => ({ month: Number(m), items }))
      .sort((a, b) => b.month - a.month)
  }, [oneTimeEntries])

  const hasAnything = oneTimeEntries.length > 0 || allSubs.length > 0

  async function handleDelete(e: React.MouseEvent, id: string, name: string) {
    e.stopPropagation()
    await deleteEntry.mutateAsync(id)
    toast(`"${name}" deleted`)
  }

  // ── Render ───────────────────────────────────────────────────

  return (
    <div className="min-h-full p-7">
      {/* ── Page header ── */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.07em] text-bmuted">
            Overview
          </div>
          <h1 className="mt-0.5 text-[26px] font-extrabold tracking-tight text-bink">
            Total Expenses
          </h1>
        </div>

        <div className="flex items-center gap-2 rounded-[11px] border border-bline bg-bsurface-2 px-3 py-[7px]">
          <button type="button" onClick={() => setYear(year - 1)} className="flex h-6 w-6 items-center justify-center rounded-[7px] text-bink-2 hover:bg-bline">
            <ChevronLeft size={14} />
          </button>
          <span className="mono-num w-[38px] text-center text-[14px] font-bold text-bink">{year}</span>
          <button type="button" onClick={() => setYear(year + 1)} className="flex h-6 w-6 items-center justify-center rounded-[7px] text-bink-2 hover:bg-bline">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* ── Summary cards ── */}
      {hasAnything && (
        <>
          {/* Combined totals — prominent row */}
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div className="rounded-[20px] bg-bred p-5">
              <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.07em] text-white/70">
                Total per month
              </div>
              <Money value={totalMonth} auto className="block text-[28px] font-extrabold tracking-tight text-white" />
              <div className="mt-1 text-[12px] text-white/60">average across {year}</div>
            </div>
            <div className="rounded-[20px] border border-bred/30 bg-bred-soft p-5">
              <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.07em] text-bred/70">
                Total per year
              </div>
              <Money value={totalYear} auto className="block text-[28px] font-extrabold tracking-tight text-bred" />
              <div className="mt-1 text-[12px] text-bred/60">one-time + recurring</div>
            </div>
          </div>

          {/* Breakdown row */}
          <div className={`mb-7 grid gap-4 ${activeSubs.length > 0 ? 'grid-cols-3' : 'grid-cols-1'}`}>
            <div className="rounded-[20px] border border-bline bg-bsurface p-5">
              <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.07em] text-bmuted">
                One-time in {year}
              </div>
              <Money value={oneTimeTotal} auto className="block text-[22px] font-extrabold tracking-tight text-bred" />
              <div className="mt-1 text-[12px] text-bmuted">{oneTimeEntries.length} entries</div>
            </div>
            {activeSubs.length > 0 && (
              <>
                <div className="rounded-[20px] border border-bline bg-bsurface p-5">
                  <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.07em] text-bmuted">
                    Subscriptions /mo
                  </div>
                  <Money value={subMonthly} auto className="block text-[22px] font-extrabold tracking-tight" style={{ color: KIND_META.subscription.color }} />
                  <div className="mt-1 text-[12px] text-bmuted">{recurActive.length} active</div>
                </div>
                <div className="rounded-[20px] border border-bline bg-bsurface p-5">
                  <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.07em] text-bmuted">
                    Subscriptions /yr
                  </div>
                  <Money value={subYearly} auto className="block text-[22px] font-extrabold tracking-tight" style={{ color: KIND_META.subscription.color }} />
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* ── Recurring subscriptions section ── */}
      {activeSubs.length > 0 && (
        <RecurringSection
          title="Subscriptions"
          entries={activeSubs}
          monthlyTotal={subMonthly}
          yearlyTotal={subYearly}
          accentColor={KIND_META.subscription.color}
          accentSoft={KIND_META.subscription.soft}
          onDelete={handleDelete}
          onClickRow={setEditRecurring}
        />
      )}

      {/* Cancelled toggle */}
      {cancelledSubs.length > 0 && (
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowCancelled(v => !v)}
            className="flex items-center gap-2 rounded-[10px] px-3 py-2 text-[12.5px] font-semibold text-bmuted transition-colors hover:bg-bsurface-2 hover:text-bink-2"
          >
            {showCancelled ? <EyeOff size={14} /> : <Eye size={14} />}
            {showCancelled ? 'Hide' : 'Show'} cancelled ({cancelledSubs.length})
          </button>
        </div>
      )}
      {showCancelled && cancelledSubs.length > 0 && (
        <RecurringSection
          title="Cancelled subscriptions"
          entries={cancelledSubs}
          monthlyTotal={0}
          yearlyTotal={0}
          accentColor="#8a948c"
          accentSoft="#f4f3ef"
          onDelete={handleDelete}
          onClickRow={setEditRecurring}
          dimmed
        />
      )}

      {/* ── One-time expenses by month ── */}
      {grouped.length > 0 && (
        <div className="mb-2 mt-7 flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.07em] text-bmuted">One-time expenses</span>
          <span className="rounded-full bg-bred/10 px-2 py-0.5 text-[11px] font-bold text-bred">{oneTimeEntries.length}</span>
        </div>
      )}

      {grouped.map(({ month, items }) => {
        const monthTotal = items.reduce((s, e) => s + e.amount, 0)
        return (
          <div key={month} className="mb-5">
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-[13px] font-bold text-bink">{MONTHS_LONG[month - 1]}</span>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-bred/10 px-2 py-0.5 text-[11px] font-bold text-bred">{items.length}</span>
                <Money value={monthTotal} auto className="text-[13px] font-bold text-bred" />
              </div>
            </div>
            <div className="rounded-[20px] border border-bline bg-bsurface">
              {items.map((entry, i) => {
                const name = entry.description || entry.category
                const isLast = i === items.length - 1
                return (
                  <div
                    key={entry.id}
                    onClick={() => setEditOneTime(entry)}
                    className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-bsurface-2 ${!isLast ? 'border-b border-bline-2' : ''}`}
                  >
                    <span className="h-[8px] w-[8px] shrink-0 rounded-full" style={{ background: catColor(entry.category) }} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13.5px] font-semibold text-bink">{name}</div>
                      <div className="text-[11.5px] text-bmuted">{entry.category}</div>
                    </div>
                    <Money value={entry.amount} auto className="shrink-0 text-[13.5px] font-bold text-bred" />
                    <button type="button" onClick={e => handleDelete(e, entry.id, name)} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] text-bmuted transition-colors hover:bg-bred-soft hover:text-bred" aria-label="Delete">
                      <Trash2 size={13} />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Empty state */}
      {!hasAnything && (
        <div className="rounded-[20px] border border-bline bg-bsurface px-6 py-14 text-center">
          <div className="text-[15px] font-semibold text-bink">No expenses yet</div>
          <div className="mt-1 text-[13px] text-bmuted">
            Add an expense or subscription entry to start tracking your spending.
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {editOneTime && (
        <EditEntryModal entry={editOneTime} open onOpenChange={open => { if (!open) setEditOneTime(null) }} />
      )}
      {editRecurring && (
        <EditRecurringModal entry={editRecurring} open onOpenChange={open => { if (!open) setEditRecurring(null) }} />
      )}
    </div>
  )
}

// ── Recurring section ─────────────────────────────────────────

function RecurringSection({
  title, entries, monthlyTotal, yearlyTotal,
  accentColor, accentSoft, onDelete, onClickRow, dimmed = false,
}: {
  title: string
  entries: Entry[]
  monthlyTotal: number
  yearlyTotal: number
  accentColor: string
  accentSoft: string
  onDelete: (e: React.MouseEvent, id: string, name: string) => void
  onClickRow: (entry: Entry) => void
  dimmed?: boolean
}) {
  if (entries.length === 0) return null

  const recurring = entries.filter(e => e.frequency !== 'once')
  const oneTime   = entries.filter(e => e.frequency === 'once')
  const sorted = [
    ...recurring.filter(e => e.frequency === 'monthly').sort((a, b) => b.amount - a.amount),
    ...recurring.filter(e => e.frequency === 'yearly').sort((a, b) => b.amount - a.amount),
    ...oneTime.sort((a, b) => b.amount - a.amount),
  ]

  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-bold text-bink">{title}</span>
          <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: accentSoft, color: accentColor }}>
            {entries.length}
          </span>
        </div>
        {!dimmed && recurring.length > 0 && (
          <div className="flex items-center gap-3 text-[12.5px] font-semibold text-bink-2">
            <span>
              <Money value={monthlyTotal} auto className="font-bold" style={{ color: accentColor }} />
              <span className="ml-1 text-bmuted">/mo</span>
            </span>
            <span className="text-bline">·</span>
            <span>
              <Money value={yearlyTotal} auto className="font-bold" style={{ color: accentColor }} />
              <span className="ml-1 text-bmuted">/yr</span>
            </span>
          </div>
        )}
      </div>

      <div className="rounded-[20px] border border-bline bg-bsurface">
        {sorted.map((entry, i) => {
          const name = entry.description || entry.category
          const isOnce = entry.frequency === 'once'
          const monthly = perMonth(entry)
          const isLast = i === sorted.length - 1
          const cancelled = isCancelled(entry)
          const futureCan = isFutureCancelled(entry)

          return (
            <div
              key={entry.id}
              onClick={() => onClickRow(entry)}
              className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-bsurface-2 ${!isLast ? 'border-b border-bline-2' : ''} ${dimmed || cancelled ? 'opacity-50' : ''}`}
            >
              <span className="h-[8px] w-[8px] shrink-0 rounded-full" style={{ background: catColor(entry.category) }} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13.5px] font-semibold text-bink">{name}</div>
                <div className="flex items-center gap-2 text-[11.5px] text-bmuted">
                  <span>{entry.category}</span>
                  {cancelled && (
                    <span className="rounded-full bg-bred-soft px-1.5 py-0.5 text-[10px] font-bold text-bred">
                      Cancelled {formatEndDate(entry.end_date!)}
                    </span>
                  )}
                  {futureCan && (
                    <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-600">
                      Cancels {formatEndDate(entry.end_date!)}
                    </span>
                  )}
                </div>
              </div>
              <span className="shrink-0 rounded-full px-2.5 py-[3px] text-[11px] font-bold" style={{ background: isOnce ? '#f4f3ef' : accentSoft, color: isOnce ? '#8a948c' : accentColor }}>
                {FREQ_LABELS[entry.frequency ?? 'monthly']}
              </span>
              <div className="shrink-0 text-right">
                {entry.frequency === 'yearly' ? (
                  <>
                    <div className="text-[13.5px] font-bold" style={{ color: accentColor }}>
                      <Money value={entry.amount} auto />
                      <span className="ml-0.5 text-[11px] font-semibold opacity-70">/yr</span>
                    </div>
                    <div className="text-[11.5px] text-bmuted">
                      <Money value={monthly} cents /> /mo avg
                    </div>
                  </>
                ) : entry.frequency === 'monthly' ? (
                  <div className="text-[13.5px] font-bold" style={{ color: accentColor }}>
                    <Money value={entry.amount} auto />
                    <span className="ml-0.5 text-[11px] font-semibold opacity-70">/mo</span>
                  </div>
                ) : (
                  <div className="text-[13.5px] font-semibold text-bink-2">
                    <Money value={entry.amount} auto />
                  </div>
                )}
              </div>
              <button type="button" onClick={e => onDelete(e, entry.id, name)} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] text-bmuted transition-colors hover:bg-bred-soft hover:text-bred" aria-label="Delete">
                <Trash2 size={13} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
