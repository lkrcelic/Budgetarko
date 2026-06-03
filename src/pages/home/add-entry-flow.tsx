import { useState } from 'react'
import { X, ChevronLeft, TrendingDown, TrendingUp, CreditCard, RefreshCw } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { KIND_META } from '@/lib/constants'
import { EntryForm } from '@/components/entry/entry-form'
import type { EntryKind } from '@/types'

const TYPE_CARDS: Array<{ kind: EntryKind; sub: string; Icon: LucideIcon }> = [
  { kind: 'expense',      sub: 'A one-off cost',      Icon: TrendingDown },
  { kind: 'income',       sub: 'Money coming in',     Icon: TrendingUp   },
  { kind: 'card',         sub: 'Split across months', Icon: CreditCard   },
  { kind: 'subscription', sub: 'Recurring charge',    Icon: RefreshCw    },
]

interface AddEntryFlowProps {
  onClose: () => void
}

export function AddEntryFlow({ onClose }: AddEntryFlowProps) {
  const [kind, setKind] = useState<EntryKind | null>(null)

  // ── Step 1: type chooser ──────────────────────────────────────
  if (!kind) {
    return (
      <div className="absolute inset-0 z-20 flex flex-col bg-bbg">
        <div className="flex h-[56px] items-center justify-between px-4">
          <div style={{ width: 36 }} />
          <span className="text-[16px] font-bold text-bink">New entry</span>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-bsurface-2 text-bink-2"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto px-5 pt-3">
          <p className="mb-5 text-[18px] font-extrabold tracking-tight text-bink">
            What are you adding?
          </p>
          <div className="grid grid-cols-2 gap-3">
            {TYPE_CARDS.map(({ kind: k, sub, Icon }) => {
              const meta = KIND_META[k]
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  className="flex flex-col items-start gap-3 rounded-[20px] border border-bline bg-bsurface p-4 text-left transition-colors active:bg-bsurface-2"
                >
                  <span
                    className="flex h-[42px] w-[42px] items-center justify-center rounded-[13px]"
                    style={{ background: meta.soft }}
                  >
                    <Icon size={22} color={meta.color} />
                  </span>
                  <div>
                    <div className="text-[14px] font-bold text-bink">{meta.label}</div>
                    <div className="mt-0.5 text-[12px] text-bmuted">{sub}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // ── Step 2: form ──────────────────────────────────────────────
  const meta = KIND_META[kind]
  const KindIcon = TYPE_CARDS.find(t => t.kind === kind)!.Icon

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-bbg">
      <div className="flex h-[56px] shrink-0 items-center justify-between px-4">
        <button
          type="button"
          onClick={() => setKind(null)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-bsurface-2 text-bink-2"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="flex items-center gap-2 text-[15px] font-bold text-bink">
          <KindIcon size={16} color={meta.color} />
          {meta.label}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-bsurface-2 text-bink-2"
        >
          <X size={18} />
        </button>
      </div>

      <EntryForm
        kind={kind}
        onSuccess={onClose}
        onCancel={() => setKind(null)}
        variant="mobile"
      />
    </div>
  )
}
