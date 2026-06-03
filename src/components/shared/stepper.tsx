interface StepperProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  suffix?: string
}

/** +/- number stepper — matches .stepper from prototype. */
export function Stepper({ value, onChange, min = 1, max = 60, suffix }: StepperProps) {
  const set = (v: number) => onChange(Math.max(min, Math.min(max, v)))

  return (
    <div className="inline-flex items-center rounded-xl border border-bline bg-bsurface-2">
      <button
        type="button"
        onClick={() => set(value - 1)}
        disabled={value <= min}
        aria-label="Decrease"
        className="flex h-10 w-[38px] items-center justify-center text-[20px] text-bink-2 disabled:opacity-30"
      >
        –
      </button>

      <div className="mono-num min-w-[44px] text-center text-[15px] font-bold text-bink">
        {value}
        {suffix && (
          <span className="ml-0.5 text-[12px] font-medium text-bmuted">{suffix}</span>
        )}
      </div>

      <button
        type="button"
        onClick={() => set(value + 1)}
        disabled={value >= max}
        aria-label="Increase"
        className="flex h-10 w-[38px] items-center justify-center text-[20px] text-bink-2 disabled:opacity-30"
      >
        +
      </button>
    </div>
  )
}
