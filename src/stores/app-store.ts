import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppState {
  /** ID of the currently active profile (set after login) */
  currentProfileId: string | null
  /** Year shown in the overview screens */
  year: number
  /** Month shown in the monthly overview (1–12) */
  month: number

  setProfileId: (id: string) => void
  setYear: (year: number) => void
  setMonth: (month: number) => void
  /** Navigate to previous month, rolling back the year when needed */
  prevMonth: () => void
  /** Navigate to next month, rolling forward the year when needed */
  nextMonth: () => void
}

const now = new Date()

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentProfileId: null,
      year: now.getFullYear(),
      month: now.getMonth() + 1,

      setProfileId: (id) => set({ currentProfileId: id }),
      setYear: (year) => set({ year }),
      setMonth: (month) => set({ month }),

      prevMonth: () => {
        const { year, month } = get()
        if (month === 1) set({ year: year - 1, month: 12 })
        else set({ month: month - 1 })
      },

      nextMonth: () => {
        const { year, month } = get()
        if (month === 12) set({ year: year + 1, month: 1 })
        else set({ month: month + 1 })
      },
    }),
    {
      name: 'budgetarko-ui',
      // Only persist the navigation preferences, not derived state
      partialize: (state) => ({
        currentProfileId: state.currentProfileId,
        year: state.year,
        month: state.month,
      }),
    },
  ),
)
