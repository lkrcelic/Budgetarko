export type EntryKind = 'expense' | 'income' | 'card' | 'subscription' | 'scheduled_income'
export type FrequencyType = 'monthly' | 'yearly' | 'once'
export type CategoryType = 'income' | 'expense'

/** A single price-change record stored in entries.amount_history JSONB */
export interface AmountVersion {
  amount: number
  from: string   // ISO date string "YYYY-MM-DD"
}

// ── DB row shapes ──────────────────────────────────────────────

export interface Profile {
  id: string
  user_id: string
  name: string
  initials: string
  tint: string
  created_at: string
}

export interface Category {
  id: string
  user_id: string
  name: string
  type: CategoryType
  active: boolean
  is_default: boolean
}

export interface Entry {
  id: string
  profile_id: string
  kind: EntryKind
  amount: number
  category: string
  description: string
  year: number
  month: number          // 1–12
  // Card installment
  installments?: number
  start_year?: number
  start_month?: number
  // Subscription / scheduled income
  frequency?: FrequencyType
  end_date?: string | null            // ISO date — when stopped; null = active
  amount_history?: AmountVersion[] | null  // price-change versions; null = always use .amount
  created_at: string
  updated_at: string
}

// ── Computed / derived ─────────────────────────────────────────

/** A single entry occurrence resolved to a specific month */
export interface MonthOccurrence {
  idx: number    // absolute: year * 12 + (month - 1)
  amount: number
}

/** One item in the monthly list view */
export interface MonthItem {
  entry: Entry
  amount: number
  income: boolean
  inst?: { n: number; of: number }   // installment progress
}

/** A card installment plan with progress tracking */
export interface InstallmentPlan {
  entry: Entry
  start: number      // absolute month index of first installment
  end: number        // absolute month index of last installment
  per: number        // amount per installment
  paid: number       // installments paid so far
  total: number      // total number of installments
  done: boolean
  remaining: number  // remaining amount
}

// ── Account sharing ────────────────────────────────────────────

export interface UserLookup {
  user_id: string
  email: string
  created_at: string
}

export interface AccountShare {
  id: string
  owner_user_id: string
  shared_with_uid: string
  created_at: string
}

/** Share record enriched with the other party's email */
export interface AccountShareWithEmail extends AccountShare {
  email: string
}

/** Aggregated yearly data for the annual matrix */
export interface YearData {
  incomeCats: Record<string, number[]>   // category -> 12-month array
  expenseCats: Record<string, number[]>
  incTotals: number[]
  expTotals: number[]
  net: number[]
  cumulative: number[]
  incYear: number
  expYear: number
}
