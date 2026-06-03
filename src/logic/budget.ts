import type { Entry, MonthOccurrence, MonthItem, InstallmentPlan, YearData } from '@/types'

// ── Index helpers ──────────────────────────────────────────────

/** Convert (year, month) to an absolute month index: e.g. Jun 2026 → 24317 */
export function toIdx(year: number, month: number): number {
  return year * 12 + (month - 1)
}

/** Convert an absolute index back to { year, month } */
export function fromIdx(idx: number): { year: number; month: number } {
  return { year: Math.floor(idx / 12), month: (idx % 12) + 1 }
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
 * - subscription yearly → one per year for 20 years
 * - subscription monthly → one per month for 10 years (120); buildYear filters by year
 */
export function expand(entry: Entry): MonthOccurrence[] {
  const base = toIdx(entry.year, entry.month)
  const out: MonthOccurrence[] = []

  switch (entry.kind) {
    case 'card': {
      const n = Math.max(1, entry.installments ?? 1)
      if (n === 1) {
        out.push({ idx: base, amount: entry.amount })
      } else {
        const startIdx =
          entry.start_month != null
            ? toIdx(entry.start_year ?? entry.year, entry.start_month)
            : base + 1 // default: next month
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
        out.push({ idx: base, amount: entry.amount })
      } else if (freq === 'yearly') {
        for (let y = 0; y < 20; y++) {
          out.push({ idx: base + y * 12, amount: entry.amount })
        }
      } else {
        // monthly — 10 years of occurrences, filtered downstream by year
        for (let i = 0; i < 120; i++) {
          out.push({ idx: base + i, amount: entry.amount })
        }
      }
      break
    }

    default:
      // expense or income — single month
      out.push({ idx: base, amount: entry.amount })
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
