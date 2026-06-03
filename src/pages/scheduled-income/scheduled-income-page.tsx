import { useState } from 'react'
import { useSubscriptionEntries } from '@/hooks/use-year-data'
import { useDeleteEntry } from '@/hooks/use-entries'
import { Money } from '@/components/shared/money'
import { EditRecurringModal } from '@/components/entry/edit-recurring-modal'
import { catColor, KIND_META } from '@/lib/constants'
import { toast } from '@/components/shared/toast'
import { Trash2, Eye, EyeOff } from 'lucide-react'
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

export default function ScheduledIncomePage() {
  const entries     = useSubscriptionEntries()
  const deleteEntry = useDeleteEntry()

  // Only scheduled_income entries
  const allIncome = entries.filter(e => e.kind === 'scheduled_income')

  const activeIncome    = allIncome.filter(e => !isCancelled(e))
  const cancelledIncome = allIncome.filter(e => isCancelled(e))

  const [showCancelled, setShowCancelled] = useState(false)

  // Recurring-only totals (exclude 'once' and cancelled)
  const recurActive = activeIncome.filter(e => e.frequency !== 'once' && !e.end_date)
  const incMonthly = recurActive.reduce((s, e) => s + perMonth(e), 0)
  const incYearly  = recurActive.reduce((s, e) => s + perYear(e),  0)

  // Modal state
  const [editEntry, setEditEntry] = useState<Entry | null>(null)

  async function handleDelete(e: React.MouseEvent, id: string, name: string) {
    e.stopPropagation()
    await deleteEntry.mutateAsync(id)
    toast(`"${name}" deleted`)
  }

  const accentColor = KIND_META.scheduled_income.color
  const accentSoft  = KIND_META.scheduled_income.soft

  return (
    <div className="min-h-full p-7">

      {/* ── Page header ── */}
      <div className="mb-6">
        <div className="text-[11px] font-bold uppercase tracking-[0.07em] text-bmuted">
          Recurring
        </div>
        <h1 className="mt-0.5 text-[26px] font-extrabold tracking-tight text-bink">
          Scheduled Income
        </h1>
      </div>

      {/* ── Summary stats ── */}
      {activeIncome.length > 0 && (
        <div className="mb-7 grid grid-cols-2 gap-4">
          {/* Monthly income */}
          <div className="rounded-[20px] border border-bline bg-bsurface p-5">
            <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.07em] text-bmuted">
              Per month
            </div>
            <Money
              value={incMonthly}
              auto
              className="block text-[28px] font-extrabold tracking-tight"
              style={{ color: accentColor }}
            />
          </div>

          {/* Yearly income */}
          <div className="rounded-[20px] border border-bline bg-bsurface p-5">
            <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.07em] text-bmuted">
              Per year
            </div>
            <Money
              value={incYearly}
              auto
              className="block text-[28px] font-extrabold tracking-tight"
              style={{ color: accentColor }}
            />
          </div>
        </div>
      )}

      {/* ── Active income entries ── */}
      <Section
        title="Active scheduled income"
        entries={activeIncome}
        monthlyTotal={incMonthly}
        yearlyTotal={incYearly}
        accentColor={accentColor}
        accentSoft={accentSoft}
        onDelete={handleDelete}
        onClickRow={setEditEntry}
      />

      {/* ── Cancelled toggle ── */}
      {cancelledIncome.length > 0 && (
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowCancelled(v => !v)}
            className="flex items-center gap-2 rounded-[10px] px-3 py-2 text-[12.5px] font-semibold text-bmuted transition-colors hover:bg-bsurface-2 hover:text-bink-2"
          >
            {showCancelled ? <EyeOff size={14} /> : <Eye size={14} />}
            {showCancelled ? 'Hide' : 'Show'} cancelled ({cancelledIncome.length})
          </button>
        </div>
      )}

      {/* ── Cancelled income ── */}
      {showCancelled && cancelledIncome.length > 0 && (
        <Section
          title="Cancelled"
          entries={cancelledIncome}
          monthlyTotal={0}
          yearlyTotal={0}
          accentColor="#8a948c"
          accentSoft="#f4f3ef"
          onDelete={handleDelete}
          onClickRow={setEditEntry}
          dimmed
        />
      )}

      {/* Empty state */}
      {allIncome.length === 0 && (
        <div className="rounded-[20px] border border-bline bg-bsurface px-6 py-14 text-center">
          <div className="text-[15px] font-semibold text-bink">No scheduled income yet</div>
          <div className="mt-1 text-[13px] text-bmuted">
            Add a scheduled income entry to track recurring revenue like salary, rent income, etc.
          </div>
        </div>
      )}

      {/* ── Edit modal ── */}
      {editEntry && (
        <EditRecurringModal
          entry={editEntry}
          open
          onOpenChange={open => { if (!open) setEditEntry(null) }}
        />
      )}
    </div>
  )
}

// ── Section component ──────────────────────────────────────────

function Section({
  title,
  entries,
  monthlyTotal,
  yearlyTotal,
  accentColor,
  accentSoft,
  onDelete,
  onClickRow,
  dimmed = false,
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
      {/* Section header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-bold text-bink">{title}</span>
          <span
            className="rounded-full px-2 py-0.5 text-[11px] font-bold"
            style={{ background: accentSoft, color: accentColor }}
          >
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

      {/* Rows */}
      <div className="rounded-[20px] border border-bline bg-bsurface">
        {sorted.map((entry, i) => {
          const name     = entry.description || entry.category
          const isOnce   = entry.frequency === 'once'
          const monthly  = perMonth(entry)
          const isLast   = i === sorted.length - 1
          const cancelled = isCancelled(entry)
          const futureCancelled = isFutureCancelled(entry)

          return (
            <div
              key={entry.id}
              onClick={() => onClickRow(entry)}
              className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-bsurface-2 ${!isLast ? 'border-b border-bline-2' : ''} ${dimmed || cancelled ? 'opacity-50' : ''}`}
            >
              {/* Category colour dot */}
              <span
                className="h-[8px] w-[8px] shrink-0 rounded-full"
                style={{ background: catColor(entry.category) }}
              />

              {/* Name + category + cancel info */}
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13.5px] font-semibold text-bink">{name}</div>
                <div className="flex items-center gap-2 text-[11.5px] text-bmuted">
                  <span>{entry.category}</span>
                  {cancelled && (
                    <span className="rounded-full bg-bred-soft px-1.5 py-0.5 text-[10px] font-bold text-bred">
                      Cancelled {formatEndDate(entry.end_date!)}
                    </span>
                  )}
                  {futureCancelled && (
                    <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-600">
                      Cancels {formatEndDate(entry.end_date!)}
                    </span>
                  )}
                </div>
              </div>

              {/* Frequency badge */}
              <span
                className="shrink-0 rounded-full px-2.5 py-[3px] text-[11px] font-bold"
                style={{ background: isOnce ? '#f4f3ef' : accentSoft, color: isOnce ? '#8a948c' : accentColor }}
              >
                {FREQ_LABELS[entry.frequency ?? 'monthly']}
              </span>

              {/* Amount */}
              <div className="shrink-0 text-right">
                {entry.frequency === 'yearly' ? (
                  <>
                    <div
                      className="text-[13.5px] font-bold"
                      style={{ color: accentColor }}
                    >
                      <Money value={entry.amount} auto />
                      <span className="ml-0.5 text-[11px] font-semibold opacity-70">/yr</span>
                    </div>
                    <div className="text-[11.5px] text-bmuted">
                      <Money value={monthly} cents /> /mo avg
                    </div>
                  </>
                ) : entry.frequency === 'monthly' ? (
                  <div
                    className="text-[13.5px] font-bold"
                    style={{ color: accentColor }}
                  >
                    <Money value={entry.amount} auto />
                    <span className="ml-0.5 text-[11px] font-semibold opacity-70">/mo</span>
                  </div>
                ) : (
                  <div className="text-[13.5px] font-semibold text-bink-2">
                    <Money value={entry.amount} auto />
                  </div>
                )}
              </div>

              {/* Delete */}
              <button
                type="button"
                onClick={e => onDelete(e, entry.id, name)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] text-bmuted transition-colors hover:bg-bred-soft hover:text-bred"
                aria-label="Delete"
              >
                <Trash2 size={13} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
