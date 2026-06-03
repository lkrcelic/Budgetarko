import { ArrowDown, ArrowUp, CreditCard, RefreshCw } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { KIND_META } from '@/lib/constants'
import type { EntryKind } from '@/types'

const KIND_SUBTITLES: Record<EntryKind, string> = {
  expense:      'A one-off cost',
  income:       'Money coming in',
  card:         'Split across months',
  subscription: 'Recurring charge',
}

const KIND_ICONS: Record<EntryKind, LucideIcon> = {
  expense:      ArrowDown,
  income:       ArrowUp,
  card:         CreditCard,
  subscription: RefreshCw,
}

const KINDS: EntryKind[] = ['expense', 'income', 'card', 'subscription']

interface TypeChooserProps {
  onSelect: (kind: EntryKind) => void
}

/** Step 1 of the entry flow — four type cards matching the prototype grid */
export function TypeChooser({ onSelect }: TypeChooserProps) {
  return (
    <div>
      <h2 className="mb-5 text-[21px] font-extrabold tracking-tight text-bink">
        What are you adding?
      </h2>

      <div className="grid grid-cols-2 gap-3">
        {KINDS.map(kind => {
          const meta = KIND_META[kind]
          const Icon = KIND_ICONS[kind]
          return (
            <button
              key={kind}
              type="button"
              onClick={() => onSelect(kind)}
              className="flex flex-col gap-1 rounded-[18px] border border-bline bg-bsurface p-[17px] text-left transition-transform active:scale-[0.97]"
            >
              <span
                className="mb-[9px] flex h-[42px] w-[42px] items-center justify-center rounded-[12px]"
                style={{ background: meta.soft }}
              >
                <Icon size={22} color={meta.color} />
              </span>
              <span className="text-[14.5px] font-bold text-bink">{meta.label}</span>
              <span className="text-[12px] leading-snug text-bmuted">{KIND_SUBTITLES[kind]}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
