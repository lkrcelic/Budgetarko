import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MONTHS } from '@/lib/constants'

interface MonthPickerProps {
  year: number
  /** Currently selected month (1-12), or null if none */
  month: number | null
  /** Called with (year, month) — month is null when cleared */
  onChange: (year: number, month: number | null) => void
  /** Show year navigation arrows (default true) */
  allowYear?: boolean
  /** Text shown when month is null */
  placeholder?: string
  className?: string
}

/**
 * Compact month picker — pill trigger + floating grid.
 * Matches .mfield / .mpop from prototype.
 */
export function MonthPicker({
  year,
  month,
  onChange,
  allowYear = true,
  placeholder = 'Select',
  className,
}: MonthPickerProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const label = month
    ? `${MONTHS[month - 1]}${allowYear ? ' ' + year : ''}`
    : placeholder

  return (
    <div ref={ref} className={cn('relative', className)}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={cn(
          'inline-flex items-center gap-2 rounded-xl border border-bline bg-bsurface-2 px-3 py-[9px] text-[13.5px] font-semibold transition-colors',
          month ? 'text-bink' : 'font-medium text-bmuted',
        )}
      >
        {label}
        <ChevronDown size={11} className="text-bmuted" />
      </button>

      {/* Popover */}
      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-40 w-[248px] rounded-2xl border border-bline bg-bsurface p-3 shadow-[0_14px_40px_rgba(22,36,29,.16)]">
          {/* Year nav */}
          {allowYear && (
            <div className="mb-2.5 flex items-center justify-between">
              <button
                type="button"
                onClick={() => onChange(year - 1, month)}
                className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-bsurface-2 text-bink-2"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="mono-num text-[14px] font-bold text-bink">{year}</span>
              <button
                type="button"
                onClick={() => onChange(year + 1, month)}
                className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-bsurface-2 text-bink-2"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}

          {/* Month grid */}
          <div className="grid grid-cols-4 gap-[5px]">
            {MONTHS.map((m, i) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  onChange(year, i + 1)
                  setOpen(false)
                }}
                className={cn(
                  'rounded-[10px] py-[9px] text-[12.5px] font-semibold transition-colors',
                  month === i + 1
                    ? 'bg-bink text-white'
                    : 'bg-bsurface-2 text-bink-2 hover:bg-bline',
                )}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Clear button — only shown when there's a placeholder (optional field) */}
          {placeholder && month !== null && (
            <button
              type="button"
              onClick={() => {
                onChange(year, null)
                setOpen(false)
              }}
              className="mt-2 w-full rounded-[10px] bg-bsurface-2 py-2 text-[12.5px] font-semibold text-bmuted hover:text-bink-2"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  )
}
