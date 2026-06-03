import { Trash2 } from 'lucide-react'
import { catColor } from '@/lib/constants'
import { Money } from '@/components/shared/money'
import type { MonthItem } from '@/types'

interface EntryRowProps {
  item: MonthItem
  onDelete?: () => void
  onClick?: () => void
  variant?: 'mobile' | 'desktop'
}

/**
 * Single entry row — used in both mobile recent list and desktop item lists.
 * Matches .m-item (mobile) and .d-il-row (desktop) from prototype.
 */
export function EntryRow({ item, onDelete, onClick, variant = 'desktop' }: EntryRowProps) {
  const { entry, amount, income, inst } = item
  const color = catColor(entry.category)
  const isWhole = Number.isInteger(amount)

  const subParts = [
    entry.category,
    inst ? `installment ${inst.n}/${inst.of}` : null,
    entry.kind === 'subscription' ? 'subscription' : null,
  ].filter(Boolean)
  const subText = subParts.join(' · ')

  // ── Mobile variant ──
  if (variant === 'mobile') {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-3 rounded-[13px] px-2 py-[11px] text-left transition-colors active:bg-bsurface-2"
      >
        <span
          className="h-[9px] w-[9px] flex-none rounded-full"
          style={{ background: color }}
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14.5px] font-semibold text-bink">
            {entry.description || entry.category}
          </span>
          <span className="mt-[1px] block text-[12px] text-bmuted">{subText}</span>
        </span>
        <Money
          value={income ? amount : -amount}
          sign
          cents={!isWhole}
          className="text-[15px] font-bold"
          style={{ color: income ? 'var(--green)' : 'var(--ink)' }}
        />
      </button>
    )
  }

  // ── Desktop variant ──
  return (
    <div className="group flex items-center gap-[11px] border-b border-bline-2 px-[6px] py-[10px] last:border-0">
      <span
        className="h-[9px] w-[9px] flex-none rounded-full"
        style={{ background: color }}
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13.5px] font-semibold text-bink">
          {entry.description || entry.category}
        </span>
        <span className="mt-[1px] block text-[11.5px] text-bmuted">{subText}</span>
      </span>
      <Money
        value={amount}
        cents={!isWhole}
        className="text-[14px] font-bold"
        style={{ color: income ? 'var(--green)' : 'var(--ink)' }}
      />
      {onDelete && (
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onDelete() }}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-bmuted opacity-0 transition-all hover:bg-bred-soft hover:text-bred group-hover:opacity-100"
          aria-label="Delete entry"
        >
          <Trash2 size={15} />
        </button>
      )}
    </div>
  )
}
