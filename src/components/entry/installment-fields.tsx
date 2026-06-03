import { MONTHS } from '@/lib/constants'
import { Money } from '@/components/shared/money'
import { MonthPicker } from '@/components/shared/month-picker'
import { Stepper } from '@/components/shared/stepper'

interface SplitMonth {
  year: number
  month: number
  amount: number
}

interface InstallmentFieldsProps {
  amount: number
  /** Entry month — used for the "Auto · Jul" placeholder */
  entryMonth: number
  installments: number
  startYear: number
  startMonth: number | undefined
  /** Pre-computed split from previewSplit() */
  split: SplitMonth[]
  onChangeInstallments: (n: number) => void
  onChangeStart: (year: number, month: number | undefined) => void
}

/**
 * Card-installment specific fields:
 *   • number-of-installments stepper
 *   • optional custom start-month picker
 *   • live month-by-month split preview
 *
 * Matches .m-card-block / .m-prev from prototype.
 */
export function InstallmentFields({
  amount,
  entryMonth,
  installments,
  startYear,
  startMonth,
  split,
  onChangeInstallments,
  onChangeStart,
}: InstallmentFieldsProps) {
  // "Auto · Jul" label uses the month AFTER the entry month
  const autoMonthLabel = MONTHS[entryMonth % 12]
  const lastSplit = split[split.length - 1]
  const crossesYear = lastSplit && lastSplit.year > startYear

  return (
    <div>
      {/* Installments count */}
      <div className="flex items-center justify-between border-t border-bline-2 py-4">
        <span className="text-[12px] font-bold uppercase tracking-[0.04em] text-bmuted">
          Number of installments
        </span>
        <Stepper
          value={installments}
          onChange={onChangeInstallments}
          min={2}
          max={36}
        />
      </div>

      {/* Custom start month */}
      <div className="flex items-center justify-between border-t border-bline-2 py-4">
        <span className="text-[12px] font-bold uppercase tracking-[0.04em] text-bmuted">
          First installment
        </span>
        <MonthPicker
          year={startYear}
          month={startMonth ?? null}
          placeholder={`Auto · ${autoMonthLabel}`}
          onChange={(y, m) => onChangeStart(y, m ?? undefined)}
        />
      </div>

      {/* Live preview — only when amount > 0 */}
      {amount > 0 && split.length > 0 && (
        <div className="mt-[18px] rounded-2xl bg-bamber-soft p-[14px]">
          {/* Header */}
          <div className="mb-[11px] flex items-center justify-between text-[13px] font-bold text-[#7a5f23]">
            <span>Monthly split</span>
            <Money
              value={amount / installments}
              cents
              className="text-[15px] text-bamber"
            />
          </div>

          {/* Scrollable track */}
          <div className="flex gap-[7px] overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {split.slice(0, 12).map((s, i) => (
              <div
                key={i}
                className="min-w-[62px] flex-none rounded-[11px] bg-white p-[9px] text-center"
              >
                <span className="block text-[11px] font-semibold text-bmuted">
                  {MONTHS[s.month - 1]}
                  {/* Show year suffix when the month is January or the first item */}
                  {(s.month === 1 || i === 0) && s.year !== split[0].year
                    ? ` '${String(s.year).slice(2)}`
                    : ''}
                </span>
                <Money
                  value={s.amount}
                  cents
                  className="mt-[3px] block text-[13px] font-bold text-bamber"
                />
              </div>
            ))}
          </div>

          {crossesYear && (
            <p className="mt-2.5 text-[11.5px] font-semibold text-[#7a5f23]">
              Rolls into {lastSplit.year} automatically
            </p>
          )}
        </div>
      )}
    </div>
  )
}
