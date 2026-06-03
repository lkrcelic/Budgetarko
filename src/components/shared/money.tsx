import { cn } from '@/lib/utils'
import { money, type MoneyOptions } from '@/lib/money'

interface MoneyProps extends MoneyOptions {
  value: number
  className?: string
  style?: React.CSSProperties
}

/** Formatted EUR amount. Matches the prototype's <Money> exactly. */
export function Money({ value, cents, auto, sign, className, style }: MoneyProps) {
  return (
    <span className={cn('mono-num', className)} style={style}>
      {money(value, { cents, auto, sign })}
    </span>
  )
}
