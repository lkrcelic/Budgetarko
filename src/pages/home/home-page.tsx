import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useAppStore } from '@/stores/app-store'
import { useProfiles } from '@/hooks/use-profiles'
import { useYearData, useMonthItems, useActiveInstallments } from '@/hooks/use-year-data'
import { Money } from '@/components/shared/money'
import { Avatar } from '@/components/shared/avatar'
import { EntryRow } from '@/components/entry/entry-row'
import { MONTHS_LONG } from '@/lib/constants'
import { AddEntryFlow } from './add-entry-flow'

export default function HomePage() {
  const [adding, setAdding] = useState(false)

  const currentProfileId = useAppStore(s => s.currentProfileId)
  const year  = useAppStore(s => s.year)
  const month = useAppStore(s => s.month)
  const prevMonth  = useAppStore(s => s.prevMonth)
  const nextMonth  = useAppStore(s => s.nextMonth)
  const setProfileId = useAppStore(s => s.setProfileId)

  const { data: profiles } = useProfiles()
  const profile = profiles?.find(p => p.id === currentProfileId)

  const yearData    = useYearData()
  const items       = useMonthItems()
  const installments = useActiveInstallments()

  const net = yearData?.net[month - 1]       ?? 0
  const inc = yearData?.incTotals[month - 1] ?? 0
  const exp = yearData?.expTotals[month - 1] ?? 0
  const positive = net >= 0

  // Active non-done plans with at least one payment made
  const activeInsts = installments.filter(p => !p.done && p.paid > 0)

  // Income first, then expenses; cap at 6 recent
  const recent = [...items]
    .sort((a, b) => (a.income === b.income ? 0 : a.income ? -1 : 1))
    .slice(0, 6)

  function switchProfile() {
    if (!profiles || profiles.length < 2) return
    const ids = profiles.map(p => p.id)
    const i = ids.indexOf(currentProfileId ?? '')
    setProfileId(ids[(i + 1) % ids.length])
  }

  return (
    <div className="relative h-dvh overflow-hidden bg-bbg font-sans">
      <div className="h-full overflow-y-auto">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 pb-2 pt-[52px]">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-bgreen">
              Budgetarko
            </div>
            <div className="text-[22px] font-extrabold tracking-tight text-bink">
              Hi, {profile?.name ?? '…'}
            </div>
          </div>
          {profile && (
            <button type="button" onClick={switchProfile} className="rounded-full">
              <Avatar profile={profile} size={38} />
            </button>
          )}
        </div>

        {/* ── Month navigation ── */}
        <div className="flex items-center justify-between px-5 pb-2">
          <button
            type="button"
            onClick={prevMonth}
            className="flex h-8 w-8 items-center justify-center rounded-full text-bmuted active:bg-bsurface-2"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-[14px] font-semibold text-bink-2">
            {MONTHS_LONG[month - 1]} {year}
          </span>
          <button
            type="button"
            onClick={nextMonth}
            className="flex h-8 w-8 items-center justify-center rounded-full text-bmuted active:bg-bsurface-2"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* ── Balance card ── */}
        <div
          className="mx-5 mt-1 rounded-[22px] p-5"
          style={{ background: positive ? 'var(--green)' : 'var(--red)' }}
        >
          <div className="mb-0.5 flex items-center justify-between">
            <span className="text-[13px] font-semibold text-white/70">
              {MONTHS_LONG[month - 1]} {year}
            </span>
            <span className="rounded-full bg-white/20 px-2.5 py-[3px] text-[12px] font-bold text-white">
              {positive ? 'Surplus' : 'Deficit'}
            </span>
          </div>
          <Money
            value={net}
            sign
            className="mt-1 block text-[38px] font-extrabold tracking-tight text-white"
          />
          <div className="mt-4 flex items-center gap-5">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-white/60">
                Income
              </div>
              <Money value={inc} className="text-[15px] font-bold text-white" />
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-white/60">
                Expenses
              </div>
              <Money value={exp} className="text-[15px] font-bold text-white" />
            </div>
          </div>
        </div>

        {/* ── Add button ── */}
        <div className="mx-5 mt-4">
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex h-[54px] w-full items-center justify-center gap-2.5 rounded-2xl bg-bink text-[15.5px] font-bold text-white transition-opacity active:opacity-80"
          >
            <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-white/20 text-[22px] font-light leading-none">
              +
            </span>
            Add entry
          </button>
        </div>

        {/* ── Active installments ── */}
        {activeInsts.length > 0 && (
          <div className="mx-5 mt-6">
            <div className="mb-3 text-[12px] font-bold uppercase tracking-[0.04em] text-bmuted">
              Active installments
            </div>
            <div className="flex flex-col gap-2.5">
              {activeInsts.map(plan => (
                <div
                  key={plan.entry.id}
                  className="rounded-[16px] border border-bline bg-bsurface p-4"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[14px] font-semibold text-bink">
                      {plan.entry.description || plan.entry.category}
                    </span>
                    <Money value={plan.per} cents className="text-[14px] font-bold text-bamber" />
                  </div>
                  <div className="h-[5px] overflow-hidden rounded-full bg-bline">
                    <div
                      className="h-full rounded-full bg-bamber"
                      style={{ width: `${(plan.paid / plan.total) * 100}%` }}
                    />
                  </div>
                  <div className="mt-1.5 text-[11.5px] text-bmuted">
                    {plan.paid} of {plan.total} paid ·{' '}
                    <Money value={plan.remaining} cents /> left
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── This month ── */}
        <div className="mx-5 mt-6 pb-10">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[12px] font-bold uppercase tracking-[0.04em] text-bmuted">
              This month
            </span>
            <span className="text-[12px] font-semibold text-bmuted">{items.length} items</span>
          </div>
          {recent.length === 0 ? (
            <p className="text-[14px] text-bmuted">No entries yet — tap Add entry.</p>
          ) : (
            <div className="rounded-[18px] border border-bline bg-bsurface px-2">
              {recent.map((item, i) => (
                <EntryRow key={item.entry.id + i} item={item} variant="mobile" />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Add-entry overlay ── */}
      {adding && <AddEntryFlow onClose={() => setAdding(false)} />}
    </div>
  )
}
