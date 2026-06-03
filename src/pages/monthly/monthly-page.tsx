import { useAppStore } from '@/stores/app-store'
import { useYearData, useMonthItems, useActiveInstallments } from '@/hooks/use-year-data'
import { useDeleteEntry } from '@/hooks/use-entries'
import { Money } from '@/components/shared/money'
import { EntryRow } from '@/components/entry/entry-row'
import { catColor, MONTHS, MONTHS_LONG } from '@/lib/constants'
import { toast } from '@/components/shared/toast'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { toIdx } from '@/logic/budget'
import type { MonthItem } from '@/types'

export default function MonthlyPage() {
  const year  = useAppStore(s => s.year)
  const month = useAppStore(s => s.month)
  const setMonth  = useAppStore(s => s.setMonth)
  const setYear   = useAppStore(s => s.setYear)
  const prevMonth = useAppStore(s => s.prevMonth)
  const nextMonth = useAppStore(s => s.nextMonth)

  const yearData = useYearData()
  const items    = useMonthItems()
  const plans    = useActiveInstallments()
  const deleteEntry = useDeleteEntry()

  const net = yearData?.net[month - 1]       ?? 0
  const inc = yearData?.incTotals[month - 1] ?? 0
  const exp = yearData?.expTotals[month - 1] ?? 0
  const positive = net >= 0

  const incomes   = items.filter((it): it is MonthItem => it.income).sort((a, b) => b.amount - a.amount)
  const expenses  = items.filter((it): it is MonthItem => !it.income).sort((a, b) => b.amount - a.amount)

  // Expenses by category for the bar chart
  const byCat: Record<string, number> = {}
  expenses.forEach(it => {
    byCat[it.entry.category] = (byCat[it.entry.category] ?? 0) + it.amount
  })
  const catBars = Object.entries(byCat).sort((a, b) => b[1] - a[1])
  const maxCat  = Math.max(1, ...catBars.map(([, v]) => v))

  // Installments due this month
  const curIdx = toIdx(year, month)
  const instThis = plans.filter(p => curIdx >= p.start && curIdx <= p.end && p.paid > 0)

  async function handleDelete(id: string) {
    await deleteEntry.mutateAsync(id)
    toast('Entry deleted')
  }

  return (
    <div className="min-h-full p-7">
      {/* ── Page header ── */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.07em] text-bmuted">
            Monthly overview
          </div>
          <h1 className="mt-0.5 text-[26px] font-extrabold tracking-tight text-bink">
            {MONTHS_LONG[month - 1]} {year}
          </h1>
        </div>

        {/* Month strip */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={prevMonth}
            className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-bsurface-2 text-bink-2 hover:bg-bline"
          >
            <ChevronLeft size={15} />
          </button>
          <div className="flex gap-[3px]">
            {MONTHS.map((m, i) => (
              <button
                key={m}
                type="button"
                onClick={() => setMonth(i + 1)}
                className={`rounded-[8px] px-[9px] py-[6px] text-[12px] font-semibold transition-colors ${
                  month === i + 1
                    ? 'bg-bink text-white'
                    : 'bg-bsurface-2 text-bink-2 hover:bg-bline'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={nextMonth}
            className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-bsurface-2 text-bink-2 hover:bg-bline"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* ── Top section: net card + category bars ── */}
      <div className="mb-5 grid grid-cols-[1fr_320px] gap-5">
        {/* Net hero */}
        <div
          className="flex flex-col justify-between rounded-[20px] p-5"
          style={{ background: positive ? 'var(--green)' : 'var(--red)' }}
        >
          <div className="text-[13px] font-semibold text-white/70">
            {positive ? 'Surplus this month' : 'Deficit this month'}
          </div>
          <Money
            value={net}
            sign
            className="my-2 block text-[36px] font-extrabold tracking-tight text-white"
          />
          {/* Inc / exp bar */}
          {(inc + exp) > 0 && (
            <div className="mt-1 h-[7px] overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-white/70"
                style={{ width: `${(inc / (inc + exp)) * 100}%` }}
              />
            </div>
          )}
          <div className="mt-3 flex gap-5">
            <span className="flex items-center gap-1.5 text-[13px] font-semibold text-white/80">
              <i className="h-2 w-2 rounded-full bg-white/80" />
              Income <Money value={inc} className="text-white" />
            </span>
            <span className="flex items-center gap-1.5 text-[13px] font-semibold text-white/60">
              <i className="h-2 w-2 rounded-full bg-white/40" />
              Expenses <Money value={exp} className="text-white/80" />
            </span>
          </div>
        </div>

        {/* Category bars */}
        <div className="rounded-[20px] border border-bline bg-bsurface p-5">
          <div className="mb-4 text-[13px] font-bold text-bink">Expenses by category</div>
          <div className="flex flex-col gap-3">
            {catBars.length === 0 ? (
              <p className="text-[13px] text-bmuted">No expenses this month.</p>
            ) : (
              catBars.map(([cat, val]) => (
                <div key={cat} className="flex items-center gap-3">
                  <span className="flex w-[120px] shrink-0 items-center gap-1.5 text-[12.5px] font-semibold text-bink truncate">
                    <i
                      className="h-[7px] w-[7px] shrink-0 rounded-full"
                      style={{ background: catColor(cat) }}
                    />
                    {cat}
                  </span>
                  <div className="min-w-0 flex-1 overflow-hidden rounded-full bg-bsurface-2 h-[7px]">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(val / maxCat) * 100}%`,
                        background: catColor(cat),
                      }}
                    />
                  </div>
                  <Money value={val} className="shrink-0 text-[12.5px] font-semibold text-bink-2" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Installments due this month ── */}
      {instThis.length > 0 && (
        <div className="mb-5 rounded-[20px] border border-bamber-soft bg-bamber-soft p-5">
          <div className="mb-4 text-[13px] font-bold text-[#7a5f23]">
            Installments due this month
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {instThis.map(p => {
              const n = curIdx - p.start + 1
              return (
                <div key={p.entry.id} className="rounded-[14px] bg-white p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[13.5px] font-semibold text-bink">
                      {p.entry.description || p.entry.category}
                    </span>
                    <Money value={p.per} cents className="text-[13.5px] font-bold text-bamber" />
                  </div>
                  <div className="h-[5px] overflow-hidden rounded-full bg-bline">
                    <div
                      className="h-full rounded-full bg-bamber"
                      style={{ width: `${(n / p.total) * 100}%` }}
                    />
                  </div>
                  <div className="mt-1.5 text-[11.5px] text-bmuted">
                    Installment {n} of {p.total}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Item lists ── */}
      <div className="grid grid-cols-2 gap-5">
        <ItemListCard
          title="Income"
          items={incomes}
          accent="var(--green)"
          onDelete={handleDelete}
        />
        <ItemListCard
          title="Expenses"
          items={expenses}
          accent="var(--red)"
          onDelete={handleDelete}
        />
      </div>
    </div>
  )
}

function ItemListCard({
  title,
  items,
  accent,
  onDelete,
}: {
  title: string
  items: MonthItem[]
  accent: string
  onDelete: (id: string) => void
}) {
  return (
    <div className="rounded-[20px] border border-bline bg-bsurface p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[13px] font-bold text-bink">{title}</span>
        <span
          className="rounded-full px-2.5 py-0.5 text-[11.5px] font-bold"
          style={{ background: accent + '18', color: accent }}
        >
          {items.length}
        </span>
      </div>
      <div>
        {items.length === 0 ? (
          <p className="text-[13px] text-bmuted">Nothing here.</p>
        ) : (
          items.map((it, i) => (
            <EntryRow
              key={it.entry.id + i}
              item={it}
              variant="desktop"
              onDelete={() => onDelete(it.entry.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
