import { useState, useMemo } from 'react'
import { useAppStore } from '@/stores/app-store'
import { useIncomeEntries } from '@/hooks/use-year-data'
import { useDeleteEntry } from '@/hooks/use-entries'
import { Money } from '@/components/shared/money'
import { EditEntryModal } from '@/components/entry/edit-entry-modal'
import { catColor, MONTHS_LONG } from '@/lib/constants'
import { toast } from '@/components/shared/toast'
import { Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Entry } from '@/types'

// ── Page ───────────────────────────────────────────────────────

export default function IncomePage() {
  const year    = useAppStore(s => s.year)
  const setYear = useAppStore(s => s.setYear)

  const entries     = useIncomeEntries()
  const deleteEntry = useDeleteEntry()

  const [editEntry, setEditEntry] = useState<Entry | null>(null)

  // Group entries by month (descending — newest month first)
  const grouped = useMemo(() => {
    const byMonth: Record<number, Entry[]> = {}
    for (const e of entries) {
      if (!byMonth[e.month]) byMonth[e.month] = []
      byMonth[e.month].push(e)
    }
    for (const m of Object.keys(byMonth)) {
      byMonth[Number(m)].sort((a, b) => b.amount - a.amount)
    }
    return Object.entries(byMonth)
      .map(([m, items]) => ({ month: Number(m), items }))
      .sort((a, b) => b.month - a.month)
  }, [entries])

  const yearTotal = entries.reduce((sum, e) => sum + e.amount, 0)

  async function handleDelete(e: React.MouseEvent, id: string, name: string) {
    e.stopPropagation()
    await deleteEntry.mutateAsync(id)
    toast(`"${name}" deleted`)
  }

  return (
    <div className="min-h-full p-7">
      {/* ── Page header ── */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.07em] text-bmuted">
            Overview
          </div>
          <h1 className="mt-0.5 text-[26px] font-extrabold tracking-tight text-bink">
            Income
          </h1>
        </div>

        {/* Year switcher */}
        <div className="flex items-center gap-2 rounded-[11px] border border-bline bg-bsurface-2 px-3 py-[7px]">
          <button
            type="button"
            onClick={() => setYear(year - 1)}
            className="flex h-6 w-6 items-center justify-center rounded-[7px] text-bink-2 hover:bg-bline"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="mono-num w-[38px] text-center text-[14px] font-bold text-bink">
            {year}
          </span>
          <button
            type="button"
            onClick={() => setYear(year + 1)}
            className="flex h-6 w-6 items-center justify-center rounded-[7px] text-bink-2 hover:bg-bline"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* ── Year summary ── */}
      {entries.length > 0 && (
        <div className="mb-7 grid grid-cols-2 gap-4">
          <div className="rounded-[20px] border border-bline bg-bsurface p-5">
            <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.07em] text-bmuted">
              Total income in {year}
            </div>
            <Money
              value={yearTotal}
              auto
              className="block text-[28px] font-extrabold tracking-tight text-bgreen"
            />
          </div>
          <div className="rounded-[20px] border border-bline bg-bsurface p-5">
            <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.07em] text-bmuted">
              Monthly average
            </div>
            <Money
              value={yearTotal / 12}
              auto
              className="block text-[28px] font-extrabold tracking-tight text-bink-2"
            />
            <div className="mt-1 text-[12px] text-bmuted">
              across {entries.length} entries
            </div>
          </div>
        </div>
      )}

      {/* ── Monthly groups ── */}
      {grouped.map(({ month, items }) => {
        const monthTotal = items.reduce((s, e) => s + e.amount, 0)
        return (
          <div key={month} className="mb-5">
            {/* Month header */}
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-[13px] font-bold text-bink">
                {MONTHS_LONG[month - 1]}
              </span>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-bgreen/10 px-2 py-0.5 text-[11px] font-bold text-bgreen">
                  {items.length}
                </span>
                <Money
                  value={monthTotal}
                  auto
                  className="text-[13px] font-bold text-bgreen"
                />
              </div>
            </div>

            {/* Rows */}
            <div className="rounded-[20px] border border-bline bg-bsurface">
              {items.map((entry, i) => {
                const name   = entry.description || entry.category
                const isLast = i === items.length - 1
                return (
                  <div
                    key={entry.id}
                    onClick={() => setEditEntry(entry)}
                    className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-bsurface-2 ${!isLast ? 'border-b border-bline-2' : ''}`}
                  >
                    <span
                      className="h-[8px] w-[8px] shrink-0 rounded-full"
                      style={{ background: catColor(entry.category) }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13.5px] font-semibold text-bink">{name}</div>
                      <div className="text-[11.5px] text-bmuted">{entry.category}</div>
                    </div>
                    <Money
                      value={entry.amount}
                      auto
                      className="shrink-0 text-[13.5px] font-bold text-bgreen"
                    />
                    <button
                      type="button"
                      onClick={e => handleDelete(e, entry.id, name)}
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
      })}

      {/* Empty state */}
      {entries.length === 0 && (
        <div className="rounded-[20px] border border-bline bg-bsurface px-6 py-14 text-center">
          <div className="text-[15px] font-semibold text-bink">No income in {year}</div>
          <div className="mt-1 text-[13px] text-bmuted">
            Add an income entry to start tracking your earnings.
          </div>
        </div>
      )}

      {/* ── Edit modal ── */}
      {editEntry && (
        <EditEntryModal
          entry={editEntry}
          open
          onOpenChange={open => { if (!open) setEditEntry(null) }}
        />
      )}
    </div>
  )
}
