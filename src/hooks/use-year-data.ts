import { useMemo } from 'react'
import { useEntries } from './use-entries'
import { useAppStore } from '@/stores/app-store'
import * as budget from '@/logic/budget'
import type { YearData, MonthItem, InstallmentPlan } from '@/types'

/** Build the annual matrix for the current profile + year */
export function useYearData(): YearData | null {
  const { data: entries } = useEntries()
  const profileId = useAppStore(s => s.currentProfileId)
  const year = useAppStore(s => s.year)

  return useMemo(() => {
    if (!entries || !profileId) return null
    return budget.buildYear(entries, profileId, year)
  }, [entries, profileId, year])
}

/** Get all items that land in the current month */
export function useMonthItems(): MonthItem[] {
  const { data: entries } = useEntries()
  const profileId = useAppStore(s => s.currentProfileId)
  const year = useAppStore(s => s.year)
  const month = useAppStore(s => s.month)

  return useMemo(() => {
    if (!entries || !profileId) return []
    return budget.monthItems(entries, profileId, year, month)
  }, [entries, profileId, year, month])
}

/**
 * All subscription + scheduled_income entries for the current profile.
 * Used by the Subscriptions page.
 */
export function useSubscriptionEntries() {
  const { data: entries } = useEntries()
  const profileId = useAppStore(s => s.currentProfileId)

  return useMemo(() => {
    if (!entries || !profileId) return []
    return entries.filter(
      e =>
        e.profile_id === profileId &&
        (e.kind === 'subscription' || e.kind === 'scheduled_income'),
    )
  }, [entries, profileId])
}

/**
 * All one-time expense entries for the current profile in the selected year.
 * Used by the Expenses overview page.
 */
export function useExpenseEntries() {
  const { data: entries } = useEntries()
  const profileId = useAppStore(s => s.currentProfileId)
  const year = useAppStore(s => s.year)

  return useMemo(() => {
    if (!entries || !profileId) return []
    return entries.filter(
      e =>
        e.profile_id === profileId &&
        e.kind === 'expense' &&
        e.year === year,
    )
  }, [entries, profileId, year])
}

/**
 * All one-time income entries for the current profile in the selected year.
 * Used by the Income overview page.
 */
export function useIncomeEntries() {
  const { data: entries } = useEntries()
  const profileId = useAppStore(s => s.currentProfileId)
  const year = useAppStore(s => s.year)

  return useMemo(() => {
    if (!entries || !profileId) return []
    return entries.filter(
      e =>
        e.profile_id === profileId &&
        e.kind === 'income' &&
        e.year === year,
    )
  }, [entries, profileId, year])
}

/** Get all active installment plans relative to the current month */
export function useActiveInstallments(): InstallmentPlan[] {
  const { data: entries } = useEntries()
  const profileId = useAppStore(s => s.currentProfileId)
  const year = useAppStore(s => s.year)
  const month = useAppStore(s => s.month)

  return useMemo(() => {
    if (!entries || !profileId) return []
    return budget.activeInstallments(entries, profileId, year, month)
  }, [entries, profileId, year, month])
}
