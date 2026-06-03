import { Segmented } from '@/components/shared/segmented'
import type { FrequencyType } from '@/types'

const FREQ_OPTIONS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly',  label: 'Yearly'  },
  { value: 'once',    label: 'Once'    },
]

interface SubscriptionFieldsProps {
  frequency: FrequencyType
  onChange: (freq: FrequencyType) => void
}

/** Billing frequency selector for subscription entries */
export function SubscriptionFields({ frequency, onChange }: SubscriptionFieldsProps) {
  return (
    <div className="flex items-center justify-between border-t border-bline-2 py-4">
      <span className="text-[12px] font-bold uppercase tracking-[0.04em] text-bmuted">
        Billing
      </span>
      <Segmented
        options={FREQ_OPTIONS}
        value={frequency}
        onChange={v => onChange(v as FrequencyType)}
      />
    </div>
  )
}
