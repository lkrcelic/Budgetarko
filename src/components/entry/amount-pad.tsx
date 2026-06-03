import { ChevronLeft } from 'lucide-react'

type PadKey = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '.' | 'del'

const KEYS: PadKey[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del']

interface AmountPadProps {
  onKey: (key: PadKey) => void
  onClose: () => void
}

/**
 * Slide-up numeric keypad for mobile amount entry.
 * Parent must be position:relative or position:absolute to anchor this.
 */
export function AmountPad({ onKey, onClose }: AmountPadProps) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-10 rounded-t-3xl bg-bsurface shadow-[0_-8px_30px_rgba(22,36,29,.13)]">
      {/* Grab handle */}
      <div className="mx-auto mb-3 mt-2 h-1 w-10 rounded-full bg-bline" />

      {/* 3×4 key grid */}
      <div className="grid grid-cols-3 gap-[9px] px-[14px] pb-2">
        {KEYS.map(k => (
          <button
            key={k}
            type="button"
            onClick={() => onKey(k)}
            className="flex h-[50px] items-center justify-center rounded-[14px] bg-bsurface-2 text-[22px] font-semibold text-bink transition-colors active:bg-bline"
          >
            {k === 'del' ? <ChevronLeft size={22} /> : k}
          </button>
        ))}
      </div>

      {/* Done button */}
      <div className="px-[14px] pb-[26px] pt-2">
        <button
          type="button"
          onClick={onClose}
          className="h-12 w-full rounded-[14px] bg-bgreen text-[15px] font-bold text-white"
        >
          Done
        </button>
      </div>
    </div>
  )
}

/** Pure function — apply a keypad key to the current amount string */
export function applyAmountKey(current: string, key: PadKey): string {
  if (key === 'del') return current.slice(0, -1)
  if (key === '.') {
    if (current.includes('.')) return current
    return current === '' ? '0.' : current + '.'
  }
  // Limit to 2 decimal places
  if (current.includes('.') && current.split('.')[1].length >= 2) return current
  // Prevent leading zeros
  return (current === '0' ? '' : current) + key
}
