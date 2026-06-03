import type { Entry, AmountVersion, MonthOccurrence, MonthItem, InstallmentPlan, YearData } from '@/types'

// ── Index helpers ──────────────────────────────────────────────

/** Convert (year, month) to an absolute month index: e.g. Jun 2026 → 24317 */
export function toIdx(year: number, month: number): number {
  return year * 12 + (month - 1)
}

/** Convert an absolute index back to { year, month } */
export function fromIdx(idx: number): { year: number; month: number } {
  return { year: Math.floor(idx / 12), month: (idx % 12) + 1 }
}

// ── Amount versioning ──────────────────────────────────────────

/**
 * Given an entry's amount_history and a target month index,
 * return the effective amount for that period.
 *
 * History entries are sorted by `from` date; we pick the latest one
 * whose `from` is ≤ the target month's first day.
 * Falls back to entry.amount when history is null/empty.
 */
export function getEffectiveAmount(entry: Entry, idx: number): number {
  const history = entry.amount_history
  if (!history || history.length === 0) return entry.amount

  const { year, month } = fromIdx(idx)
  // First day of the target month as "YYYY-MM-DD"
  const target = `${year}-${String(month).padStart(2, '0')}-01`

  // Sort ascending by `from` so we can pick the last applicable version
  const sorted = [...history].sort((a, b) => a.from.localeCompare(b.from))

  let effective = sorted[0].amount // fallback to first version
  for (const v of sorted) {
    if (v.from <= target) {
      effective = v.amount
    } else {
      break
    }
  }
  return effective
}

// ── End-date helpers ──────────────────────────────────────────

/** Convert an end_date ISO string to an absolute month index (inclusive upper bound) */
function endDateIdx(endDate: string): number {
  const [y, m] = endDate.split('-').map(Number)
  return toIdx(y, m)
}

// ── Core expansion ─────────────────────────────────────────────

/**
 * Expand a single entry into a flat list of (absolute-index, amount) pairs.
 *
 * Rules:
 * - expense / income  → one occurrence in entry.month
 * - card (n=1)        → one occurrence in entry.month
 * - card (n>1)        → n occurrences starting the month after entry (or custom start_month)
 * - subscription once → one occurrence in entry.month
 * - subscription yearly → one per year for 20 years (capped by end_date)
 * - subscription monthly → one per month for 10 years (capped by end_date)
 *
 * Respects end_date: no occurrences are generated past end_date's month.
 * Respects amount_history: each occurrence uses the effective amount for its period.
 */
export function expand(entry: Entry): MonthOccurrence[] {
  const entryBase = toIdx(entry.year, entry.month)
  const out: MonthOccurrence[] = []
  const cap = entry.end_date ? endDateIdx(entry.end_date) : Infinity

  switch (entry.kind) {
    case 'card': {
      const n = Math.max(1, entry.installments ?? 1)
      if (n === 1) {
        out.push({ idx: entryBase, amount: entry.amount })
      } else {
        const startIdx =
          entry.start_month != null
            ? toIdx(entry.start_year ?? entry.year, entry.start_month)
            : entryBase + 1 // default: next month
        const per = entry.amount / n
        for (let i = 0; i < n; i++) {
          out.push({ idx: startIdx + i, amount: per })
        }
      }
      break
    }

    case 'subscription':
    case 'scheduled_income': {
      const freq = entry.frequency ?? 'monthly'
      if (freq === 'once') {
        if (entryBase <= cap) {
          out.push({ idx: entryBase, amount: getEffectiveAmount(entry, entryBase) })
        }
      } else if (freq === 'yearly') {
        for (let y = 0; y < 20; y++) {
          const idx = entryBase + y * 12
          if (idx > cap) break
          out.push({ idx, amount: getEffectiveAmount(entry, idx) })
        }
      } else {
        // monthly — 10 years of occurrences, filtered downstream by year
        for (let i = 0; i < 120; i++) {
          const idx = entryBase + i
          if (idx > cap) break
          out.push({ idx, amount: getEffectiveAmount(entry, idx) })
        }
      }
      break
    }

    default:
      // expense or income — single month
      out.push({ idx: entryBase, amount: entry.amount })
  }

  return out
}

// ── Annual matrix ──────────────────────────────────────────────

/**
 * Aggregate all profile entries into the 12-column annual matrix.
 * Returns per-category arrays + totals + net + cumulative.
 */
export function buildYear(entries: Entry[], profileId: string, year: number): YearData {
  const base = year * 12
  const incomeCats: Record<string, number[]> = {}
  const expenseCats: Record<string, number[]> = {}

  for (const entry of entries) {
    if (entry.profile_id !== profileId) continue
    const bucket = (entry.kind === 'income' || entry.kind === 'scheduled_income')
      ? incomeCats
      : expenseCats

    for (const { idx, amount } of expand(entry)) {
      const m = idx - base
      if (m < 0 || m > 11) continue
      if (!bucket[entry.category]) bucket[entry.category] = new Array(12).fill(0)
      bucket[entry.category][m] += amount
    }
  }

  const sumRow = (catObj: Record<string, number[]>): number[] => {
    const r = new Array(12).fill(0) as number[]
    for (const vals of Object.values(catObj)) {
      for (let m = 0; m < 12; m++) r[m] += vals[m]
    }
    return r
  }

  const incTotals = sumRow(incomeCats)
  const expTotals = sumRow(expenseCats)
  const net = incTotals.map((v, i) => v - expTotals[i])
  let cum = 0
  const cumulative = net.map(v => (cum += v))

  return {
    incomeCats,
    expenseCats,
    incTotals,
    expTotals,
    net,
    cumulative,
    incYear: incTotals.reduce((a, b) => a + b, 0),
    expYear: expTotals.reduce((a, b) => a + b, 0),
  }
}

// ── Monthly list ───────────────────────────────────────────────

/**
 * All entry occurrences that land in the given month.
 * Card entries include installment progress info { n, of }.
 */
export function monthItems(
  entries: Entry[],
  profileId: string,
  year: number,
  month: number,
): MonthItem[] {
  const targetIdx = toIdx(year, month)
  const result: MonthItem[] = []

  for (const entry of entries) {
    if (entry.profile_id !== profileId) continue

    for (const { idx, amount } of expand(entry)) {
      if (idx !== targetIdx) continue

      let inst: MonthItem['inst'] | undefined
      if (entry.kind === 'card' && (entry.installments ?? 1) > 1) {
        const startIdx =
          entry.start_month != null
            ? toIdx(entry.start_year ?? entry.year, entry.start_month)
            : base(entry) + 1
        inst = { n: idx - startIdx + 1, of: entry.installments! }
      }

      result.push({
        entry,
        amount,
        income: entry.kind === 'income' || entry.kind === 'scheduled_income',
        inst,
      })
    }
  }

  return result
}

// ── Installment plans ──────────────────────────────────────────

/**
 * All card installment plans visible from the given reference month,
 * sorted by end date (soonest to finish first).
 */
export function activeInstallments(
  entries: Entry[],
  profileId: string,
  year: number,
  month: number,
): InstallmentPlan[] {
  const refIdx = toIdx(year, month)

  return entries
    .filter(e => e.profile_id === profileId && e.kind === 'card' && (e.installments ?? 1) > 1)
    .map(entry => {
      const startIdx =
        entry.start_month != null
          ? toIdx(entry.start_year ?? entry.year, entry.start_month)
          : base(entry) + 1
      const total = entry.installments!
      const end = startIdx + total - 1
      const per = entry.amount / total
      const paid = Math.min(total, Math.max(0, refIdx - startIdx + 1))

      return {
        entry,
        start: startIdx,
        end,
        per,
        paid,
        total,
        done: refIdx > end,
        remaining: Math.max(0, entry.amount - paid * per),
      }
    })
    .sort((a, b) => a.end - b.end)
}

// ── Add-form preview ───────────────────────────────────────────

/**
 * Preview the per-month installment split for the add form.
 * Only meaningful for card entries with installments > 1.
 */
export function previewSplit(
  entry: Pick<
    Entry,
    'kind' | 'amount' | 'year' | 'month' | 'installments' | 'start_year' | 'start_month'
  >,
): Array<{ year: number; month: number; amount: number }> {
  return expand(entry as Entry).map(({ idx, amount }) => ({
    ...fromIdx(idx),
    amount,
  }))
}

// ── Private helpers ────────────────────────────────────────────

/** Absolute index of an entry's own month (not its installment start) */
function base(entry: Entry): number {
  return toIdx(entry.year, entry.month)
}
