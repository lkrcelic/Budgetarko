export const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const

export const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const

export const ENTRY_KINDS = ['expense', 'income', 'card', 'subscription', 'scheduled_income'] as const

export const KIND_META = {
  expense:           { label: 'Expense',            color: '#b5503e', soft: '#f7ece9' },
  income:            { label: 'Income',             color: '#1f8a5b', soft: '#e9f3ee' },
  card:              { label: 'Card installment',   color: '#b08a3e', soft: '#f5efe1' },
  subscription:      { label: 'Subscription',       color: '#8a5b9e', soft: '#f1ebf4' },
  scheduled_income:  { label: 'Scheduled income',   color: '#0e7490', soft: '#e0f7fa' },
} as const

export const DEFAULT_CATEGORIES = {
  income: ['Salary', 'Side job', 'Refund', 'Gifts', 'Other income'],
  expense: [
    'Living expenses', 'Housing', 'Loan payment', 'Card installment',
    'Car', 'Travel', 'Gifts', 'Groceries', 'Subscriptions',
    'Health', 'Entertainment', 'Investing',
  ],
} as const

/** Stable color map for well-known categories */
export const CAT_COLORS: Record<string, string> = {
  Salary:             '#1f8a5b',
  'Side job':         '#3f7c6b',
  Gifts:              '#8a7a3e',
  'Other income':     '#6b8a3e',
  Refund:             '#4a7c9e',
  Living:             '#b5503e',
  'Living expenses':  '#b5503e',
  Housing:            '#5b7c9e',
  'Loan payment':     '#9e6b5b',
  'Card installment': '#b08a3e',
  Car:                '#6b6b8a',
  Travel:             '#3f8a8a',
  Subscriptions:      '#8a5b9e',
  Investing:          '#4a7c5b',
  Groceries:          '#6b8a5b',
  Health:             '#5b9e7c',
  Entertainment:      '#8a6b5b',
}

/** Returns a stable color for any category name */
export function catColor(name: string): string {
  return CAT_COLORS[name] ?? '#7c887f'
}
