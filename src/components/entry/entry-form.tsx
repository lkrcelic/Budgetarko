import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { entryFormSchema, type EntryFormValues } from '@/lib/schemas'
import { KIND_META } from '@/lib/constants'
import { useAppStore } from '@/stores/app-store'
import { useCreateEntry, useUpdateEntry } from '@/hooks/use-entries'
import { useActiveCategories } from '@/hooks/use-categories'
import { previewSplit } from '@/logic/budget'
import { money } from '@/lib/money'
import { toast, toastError } from '@/components/shared/toast'
import { MonthPicker } from '@/components/shared/month-picker'
import { AmountPad, applyAmountKey } from './amount-pad'
import { CategoryChips } from './category-chips'
import { InstallmentFields } from './installment-fields'
import { SubscriptionFields } from './subscription-fields'
import type { EntryKind, FrequencyType } from '@/types'
import type { Entry } from '@/types'

interface EntryFormProps {
  kind: EntryKind
  /** Pass when editing an existing entry */
  entry?: Entry
  /** Called after a successful save or delete */
  onSuccess: () => void
  onCancel: () => void
  /** Mobile shows the numeric keypad; desktop shows a standard number input */
  variant?: 'mobile' | 'desktop'
}

/**
 * Unified add / edit form for all entry kinds.
 * Uses React Hook Form + Zod; delegates to sub-components for custom fields.
 */
export function EntryForm({
  kind,
  entry,
  onSuccess,
  onCancel,
  variant = 'mobile',
}: EntryFormProps) {
  const [padOpen, setPadOpen] = useState(variant === 'mobile' && !entry)

  const profileId = useAppStore(s => s.currentProfileId)!
  const appYear   = useAppStore(s => s.year)
  const appMonth  = useAppStore(s => s.month)

  const meta       = KIND_META[kind]
  const isIncome   = kind === 'income' || kind === 'scheduled_income'
  const catType    = isIncome ? 'income' : 'expense'
  const categories = useActiveCategories(catType)

  const createEntry = useCreateEntry()
  const updateEntry = useUpdateEntry()

  // ── Form ──────────────────────────────────────────────────────

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } =
    useForm<EntryFormValues>({
      resolver: zodResolver(entryFormSchema),
      defaultValues: entry
        ? {
            amount:       String(entry.amount),
            category:     entry.category,
            description:  entry.description,
            year:         entry.year,
            month:        entry.month,
            installments: entry.installments ?? 6,
            start_year:   entry.start_year  ?? entry.year,
            start_month:  entry.start_month,
            frequency:    (entry.frequency ?? 'monthly') as FrequencyType,
          }
        : {
            amount:       '',
            category:     'uncategorized',
            description:  '',
            year:         appYear,
            month:        appMonth,
            installments: 6,
            start_year:   appYear,
            start_month:  undefined,
            frequency:    'monthly' as FrequencyType,
          },
    })

  const amountStr  = watch('amount')
  const category   = watch('category')
  const year       = watch('year')
  const month      = watch('month')
  const installments = watch('installments')
  const startYear  = watch('start_year')
  const startMonth = watch('start_month')
  const frequency  = watch('frequency')

  // ── Amount pad key handler ────────────────────────────────────

  function handleAmountKey(key: Parameters<typeof applyAmountKey>[1]) {
    setValue('amount', applyAmountKey(amountStr, key), { shouldValidate: false })
  }

  // ── Installment preview ───────────────────────────────────────

  const split = useMemo(() => {
    if (kind !== 'card') return []
    return previewSplit({
      kind: 'card',
      amount:       parseFloat(amountStr) || 0,
      year,
      month,
      installments,
      start_year:   startYear,
      start_month:  startMonth,
    })
  }, [kind, amountStr, year, month, installments, startYear, startMonth])

  // ── Submit ────────────────────────────────────────────────────

  async function onSubmit(values: EntryFormValues) {
    const amount = parseFloat(values.amount)

    const base = {
      profile_id:  profileId,
      kind,
      amount,
      category:    values.category,
      description: values.description || values.category,
      year:        values.year,
      month:       values.month,
    }

    const extras =
      kind === 'card'
        ? {
            installments: values.installments,
            start_year:   values.start_month != null ? values.start_year : undefined,
            start_month:  values.start_month,
          }
        : (kind === 'subscription' || kind === 'scheduled_income')
        ? { frequency: values.frequency }
        : {}

    try {
      if (entry) {
        await updateEntry.mutateAsync({ id: entry.id, ...base, ...extras })
        toast('Entry updated')
      } else {
        await createEntry.mutateAsync({ ...base, ...extras })
        toast(`${meta.label} added`)
      }
      onSuccess()
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Failed to save entry')
    }
  }

  // ── Derived display ───────────────────────────────────────────

  const amountNum = parseFloat(amountStr) || 0
  const isValid   = amountNum > 0

  const saveLabel = (() => {
    const base = entry ? 'Update' : 'Save'
    const typeStr = meta.label.toLowerCase()
    if (amountNum > 0) return `${base} ${typeStr} · ${money(amountNum, { auto: true })}`
    return `${base} ${typeStr}`
  })()

  // ── Render ────────────────────────────────────────────────────

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="relative flex min-h-0 flex-1 flex-col"
      noValidate
    >
      {/* Scrollable body — hidden when pad is open */}
      <div
        className="min-h-0 flex-1 overflow-y-auto px-4"
        style={{ paddingBottom: padOpen ? 8 : 110 }}
      >
        {/* Amount display */}
        <button
          type="button"
          onClick={() => setPadOpen(true)}
          className={`mb-[22px] mt-[18px] flex w-full items-baseline justify-center gap-[6px] rounded-[18px] border bg-bsurface px-[22px] py-[22px] transition-all ${
            padOpen
              ? 'border-bink shadow-[0_0_0_3px_rgba(22,36,29,.06)]'
              : 'border-bline'
          }`}
        >
          <span
            className="text-[28px] font-bold"
            style={{ color: meta.color }}
          >
            €
          </span>
          <span className="mono-num text-[46px] font-extrabold tracking-tight text-bink">
            {amountStr || '0'}
          </span>
        </button>
        {errors.amount && (
          <p className="-mt-4 mb-3 px-1 text-[12px] text-bred">{errors.amount.message}</p>
        )}

        {/* Category */}
        <p className="mb-[9px] mt-[18px] text-[12px] font-bold uppercase tracking-[0.04em] text-bmuted">
          Category <span className="font-normal normal-case tracking-normal opacity-60">(optional)</span>
        </p>
        {/* Hidden field for RHF validation */}
        <input type="hidden" {...register('category')} />
        <CategoryChips
          categories={categories}
          selected={category}
          type={catType}
          onSelect={name => setValue('category', name, { shouldValidate: true })}
        />
        {errors.category && (
          <p className="mt-1 text-[12px] text-bred">{errors.category.message}</p>
        )}

        {/* Description */}
        <p className="mb-[9px] mt-[18px] text-[12px] font-bold uppercase tracking-[0.04em] text-bmuted">
          Description
        </p>
        <input
          {...register('description')}
          placeholder={`e.g. ${
            kind === 'card'             ? 'Madrac Vitapur' :
            kind === 'subscription'     ? 'Netflix' :
            kind === 'scheduled_income' ? 'Monthly salary' :
            kind === 'income'           ? 'Freelance project' :
            'Weekly groceries'
          }`}
          onFocus={() => setPadOpen(false)}
          className="h-[46px] w-full rounded-[13px] border border-bline bg-bsurface px-[14px] text-[14.5px] text-bink outline-none transition-colors focus:border-bink"
        />

        {/* Month */}
        <div className="mt-4 flex items-center justify-between border-t border-bline-2 py-4">
          <span className="text-[12px] font-bold uppercase tracking-[0.04em] text-bmuted">
            {kind === 'card' ? 'Purchase month' : kind === 'subscription' ? 'Starts' : 'Month'}
          </span>
          <MonthPicker
            year={year}
            month={month}
            onChange={(y, m) => {
              setValue('year', y)
              if (m) setValue('month', m)
            }}
          />
        </div>

        {/* Card-specific fields */}
        {kind === 'card' && (
          <InstallmentFields
            amount={amountNum}
            entryMonth={month}
            installments={installments}
            startYear={startYear}
            startMonth={startMonth}
            split={split}
            onChangeInstallments={n => setValue('installments', n)}
            onChangeStart={(y, m) => {
              setValue('start_year', y)
              setValue('start_month', m ?? undefined)
            }}
          />
        )}

        {/* Subscription / Scheduled-income fields (same form, different kind) */}
        {(kind === 'subscription' || kind === 'scheduled_income') && (
          <SubscriptionFields
            frequency={frequency as FrequencyType}
            onChange={f => setValue('frequency', f)}
          />
        )}
      </div>

      {/* Save button — hidden when pad is open */}
      {!padOpen && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-bbg from-70% to-transparent px-4 pb-[30px] pt-[14px]">
          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="h-[54px] w-full rounded-2xl text-[15.5px] font-bold text-white transition-opacity disabled:opacity-30"
            style={isValid ? { background: meta.color } : { background: 'var(--ink)' }}
          >
            {isSubmitting ? 'Saving…' : saveLabel}
          </button>
        </div>
      )}

      {/* Numeric keypad */}
      {padOpen && (
        <AmountPad
          onKey={handleAmountKey}
          onClose={() => setPadOpen(false)}
        />
      )}
    </form>
  )
}
