import { cn } from '@/lib/utils'

type Option = string | { value: string; label: string }

interface SegmentedProps {
  options: Option[]
  value: string
  onChange: (value: string) => void
  /** Stretch to fill parent width */
  full?: boolean
}

/** iOS-style segmented control — matches .seg / .seg-btn from prototype. */
export function Segmented({ options, value, onChange, full }: SegmentedProps) {
  return (
    <div
      className={cn(
        'inline-flex gap-0.5 rounded-xl border border-bline bg-bsurface-2 p-[3px]',
        full && 'flex w-full',
      )}
    >
      {options.map(opt => {
        const val = typeof opt === 'string' ? opt : opt.value
        const label = typeof opt === 'string' ? opt : opt.label
        const active = val === value
        return (
          <button
            key={val}
            type="button"
            onClick={() => onChange(val)}
            className={cn(
              'rounded-[9px] px-[13px] py-[7px] text-[13px] font-semibold whitespace-nowrap transition-all duration-100',
              full && 'flex-1',
              active
                ? 'bg-bsurface text-bink shadow-[0_1px_3px_rgba(22,36,29,.10)]'
                : 'text-bmuted hover:text-bink-2',
            )}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
