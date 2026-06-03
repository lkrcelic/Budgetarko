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
