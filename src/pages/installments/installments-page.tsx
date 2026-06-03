import { useAppStore } from '@/stores/app-store'
import { useActiveInstallments } from '@/hooks/use-year-data'
import { useProfiles } from '@/hooks/use-profiles'
import { Money } from '@/components/shared/money'
import { MONTHS } from '@/lib/constants'
import { money } from '@/lib/money'
import { fromIdx, toIdx } from '@/logic/budget'

export default function InstallmentsPage() {
  const year  = useAppStore(s => s.year)
  const month = useAppStore(s => s.month)
  const currentProfileId = useAppStore(s => s.currentProfileId)
  const { data: profiles } = useProfiles()
  const profile = profiles?.find(p => p.id === currentProfileId)

  const plans = useActiveInstallments()
  const curIdx = toIdx(year, month)

  return (
    <div className="min-h-full p-7">
      {/* ── Page header ── */}
      <div className="mb-6">
        <div className="text-[11px] font-bold uppercase tracking-[0.07em] text-bmuted">
          Installments
        </div>
        <h1 className="mt-0.5 text-[26px] font-extrabold tracking-tight text-bink">
          Card payment plans
        </h1>
      </div>

      {/* ── Plan list ── */}
      <div className="flex flex-col gap-4">
        {plans.length === 0 ? (
          <div className="rounded-[20px] border border-bline bg-bsurface px-6 py-10 text-center text-[14px] text-bmuted">
            No active installment plans for {profile?.name ?? 'this profile'}.
          </div>
        ) : (
          plans.map(plan => {
            const monthIdxs = Array.from({ length: plan.total }, (_, i) => plan.start + i)

            return (
              <div
                key={plan.entry.id}
                className="rounded-[20px] border border-bline bg-bsurface p-5"
              >
                {/* Plan header */}
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[15px] font-bold text-bink">
                      {plan.entry.description || plan.entry.category}
                    </div>
                    <div className="mt-0.5 text-[12.5px] text-bmuted">
                      <Money value={plan.entry.amount} auto /> ·{' '}
                      {plan.total} installments ·{' '}
                      {money(plan.per, { cents: true })}/mo
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-[12px] font-bold ${
                      plan.done
                        ? 'bg-bgreen-soft text-bgreen'
                        : 'bg-bamber-soft text-bamber'
                    }`}
                  >
                    {plan.done ? 'Completed' : `${plan.paid}/${plan.total} paid`}
                  </span>
                </div>

                {/* Month track */}
                <div className="flex gap-[6px] overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {monthIdxs.map((mi, i) => {
                    const { year: my, month: mm } = fromIdx(mi)
                    const isPaid    = mi < curIdx
                    const isCurrent = mi === curIdx
                    const isFuture  = mi > curIdx

                    return (
                      <div
                        key={i}
                        className={`min-w-[62px] flex-none rounded-[11px] p-[9px] text-center transition-colors ${
                          isPaid
                            ? 'bg-bgreen-soft'
                            : isCurrent
                            ? 'bg-bamber'
                            : isFuture
                            ? 'bg-bsurface-2'
                            : ''
                        }`}
                      >
                        <span
                          className={`block text-[11px] font-semibold ${
                            isCurrent ? 'text-white' : isPaid ? 'text-bgreen' : 'text-bmuted'
                          }`}
                        >
                          {MONTHS[mm - 1]}
                          {(mm === 1 || i === 0)
                            ? ` '${String(my).slice(2)}`
                            : ''}
                        </span>
                        <span
                          className={`mt-[3px] block text-[12.5px] font-bold ${
                            isCurrent ? 'text-white' : isPaid ? 'text-bgreen' : 'text-bink-2'
                          }`}
                        >
                          {money(plan.per, { cents: true })}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
