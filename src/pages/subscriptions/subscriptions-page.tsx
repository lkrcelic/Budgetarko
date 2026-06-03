import { useSubscriptionEntries } from '@/hooks/use-year-data'
import { useDeleteEntry } from '@/hooks/use-entries'
import { Money } from '@/components/shared/money'
import { catColor, KIND_META } from '@/lib/constants'
import { toast } from '@/components/shared/toast'
import { Trash2 } from 'lucide-react'
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

// ── Page ───────────────────────────────────────────────────────

export default function SubscriptionsPage() {
  const entries     = useSubscriptionEntries()
  const deleteEntry = useDeleteEntry()

  const subs   = entries.filter(e => e.kind === 'subscription')
  const income = entries.filter(e => e.kind === 'scheduled_income')

  // Recurring-only totals (exclude 'once')
  const recurSubs   = subs.filter(e => e.frequency !== 'once')
  const recurIncome = income.filter(e => e.frequency !== 'once')

  const subMonthly = recurSubs.reduce((s, e) => s + perMonth(e), 0)
  const subYearly  = recurSubs.reduce((s, e) => s + perYear(e),  0)
  const incMonthly = recurIncome.reduce((s, e) => s + perMonth(e), 0)
  const incYearly  = recurIncome.reduce((s, e) => s + perYear(e),  0)

  const netMonthly = incMonthly - subMonthly
  const netYearly  = incYearly  - subYearly
  const hasIncome  = recurIncome.length > 0

  async function handleDelete(id: string, name: string) {
    await deleteEntry.mutateAsync(id)
    toast(`"${name}" deleted`)
  }

  return (
    <div className="min-h-full p-7">

      {/* ── Page header ── */}
      <div className="mb-6">
        <div className="text-[11px] font-bold uppercase tracking-[0.07em] text-bmuted">
          Recurring
        </div>
        <h1 className="mt-0.5 text-[26px] font-extrabold tracking-tight text-bink">
          Subscriptions
        </h1>
      </div>

      {/* ── Summary stats ── */}
      {entries.length > 0 && (
        <div className={`mb-7 grid gap-4 ${hasIncome ? 'grid-cols-3' : 'grid-cols-2'}`}>

          {/* Monthly cost */}
          <div className="rounded-[20px] border border-bline bg-bsurface p-5">
            <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.07em] text-bmuted">
              Per month
            </div>
            <Money
              value={subMonthly}
              auto
              className="block text-[28px] font-extrabold tracking-tight text-bred"
            />
            {hasIncome && (
              <div className="mt-1 text-[12px] text-bmuted">
                subscriptions only
              </div>
            )}
          </div>

          {/* Yearly cost */}
          <div className="rounded-[20px] border border-bline bg-bsurface p-5">
            <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.07em] text-bmuted">
              Per year
            </div>
            <Money
              value={subYearly}
              auto
              className="block text-[28px] font-extrabold tracking-tight text-bred"
            />
            {hasIncome && (
              <div className="mt-1 text-[12px] text-bmuted">
                subscriptions only
              </div>
            )}
          </div>

          {/* Net recurring (only when there's scheduled income) */}
          {hasIncome && (
            <div className="rounded-[20px] border border-bline bg-bsurface p-5">
              <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.07em] text-bmuted">
                Net recurring / yr
              </div>
              <Money
                value={netYearly}
                sign
                auto
                className="block text-[28px] font-extrabold tracking-tight"
                style={{ color: netYearly >= 0 ? 'var(--green)' : 'var(--red)' }}
              />
              <div className="mt-1 text-[12px] text-bmuted">
                <Money value={netMonthly} sign auto /> /mo avg
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Subscriptions (expenses) ── */}
      <Section
        title="Subscriptions"
        entries={subs}
        monthlyTotal={subMonthly}
        yearlyTotal={subYearly}
        accentColor={KIND_META.subscription.color}
        accentSoft={KIND_META.subscription.soft}
        onDelete={handleDelete}
      />

      {/* ── Scheduled income ── */}
      {income.length > 0 && (
        <Section
          title="Recurring income"
          entries={income}
          monthlyTotal={incMonthly}
          yearlyTotal={incYearly}
          accentColor={KIND_META.scheduled_income.color}
          accentSoft={KIND_META.scheduled_income.soft}
          onDelete={handleDelete}
        />
      )}

      {/* Empty state */}
      {entries.length === 0 && (
        <div className="rounded-[20px] border border-bline bg-bsurface px-6 py-14 text-center">
          <div className="text-[15px] font-semibold text-bink">No subscriptions yet</div>
          <div className="mt-1 text-[13px] text-bmuted">
            Add a subscription or scheduled income entry to track recurring costs.
          </div>
        </div>
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
}: {
  title: string
  entries: Entry[]
  monthlyTotal: number
  yearlyTotal: number
  accentColor: string
  accentSoft: string
  onDelete: (id: string, name: string) => void
}) {
  if (entries.length === 0) return null

  const recurring = entries.filter(e => e.frequency !== 'once')
  const oneTime   = entries.filter(e => e.frequency === 'once')

  // Sort: monthly first (highest amount), then yearly (highest amount), then one-time
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
        {recurring.length > 0 && (
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
          const yearly   = perYear(entry)
          const isLast   = i === sorted.length - 1

          return (
            <div
              key={entry.id}
              className={`flex items-center gap-3 px-4 py-3 ${!isLast ? 'border-b border-bline-2' : ''}`}
            >
              {/* Category colour dot */}
              <span
                className="h-[8px] w-[8px] shrink-0 rounded-full"
                style={{ background: catColor(entry.category) }}
              />

              {/* Name + category */}
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13.5px] font-semibold text-bink">{name}</div>
                <div className="text-[11.5px] text-bmuted">{entry.category}</div>
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
                onClick={() => onDelete(entry.id, name)}
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
