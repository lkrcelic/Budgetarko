import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '@/services/entries'
import type { Entry } from '@/types'
import { useAppStore } from '@/stores/app-store'

function entriesKey(profileId: string | null) {
  return ['entries', profileId] as const
}

/** Fetch all entries for the currently active profile */
export function useEntries() {
  const profileId = useAppStore(s => s.currentProfileId)

  return useQuery({
    queryKey: entriesKey(profileId),
    queryFn: () => api.fetchEntries(profileId!),
    enabled: !!profileId,
  })
}

/** Create a new entry for the active profile */
export function useCreateEntry() {
  const qc = useQueryClient()
  const profileId = useAppStore(s => s.currentProfileId)

  return useMutation({
    mutationFn: (entry: Omit<Entry, 'id' | 'created_at' | 'updated_at'>) =>
      api.createEntry(entry),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: entriesKey(profileId) })
    },
  })
}

/** Update an existing entry */
export function useUpdateEntry() {
  const qc = useQueryClient()
  const profileId = useAppStore(s => s.currentProfileId)

  return useMutation({
    mutationFn: ({ id, ...patch }: { id: string } & Partial<Omit<Entry, 'id' | 'profile_id' | 'created_at' | 'updated_at'>>) =>
      api.updateEntry(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: entriesKey(profileId) })
    },
  })
}

/** Delete an entry */
export function useDeleteEntry() {
  const qc = useQueryClient()
  const profileId = useAppStore(s => s.currentProfileId)

  return useMutation({
    mutationFn: (id: string) => api.deleteEntry(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: entriesKey(profileId) })
    },
  })
}

// ── Subscription / scheduled-income mutations ─────────────────

/** Update a recurring entry's amount with effective date (price-change versioning) */
export function useUpdateEntryAmount() {
  const qc = useQueryClient()
  const profileId = useAppStore(s => s.currentProfileId)

  return useMutation({
    mutationFn: ({ id, amount, effectiveDate }: { id: string; amount: number; effectiveDate: string }) =>
      api.updateEntryAmount(id, amount, effectiveDate),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: entriesKey(profileId) })
    },
  })
}

/** Stop a subscription / scheduled income (set end_date) */
export function useStopEntry() {
  const qc = useQueryClient()
  const profileId = useAppStore(s => s.currentProfileId)

  return useMutation({
    mutationFn: ({ id, endDate }: { id: string; endDate: string }) =>
      api.stopEntry(id, endDate),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: entriesKey(profileId) })
    },
  })
}

/** Reactivate a stopped subscription / scheduled income */
export function useReactivateEntry() {
  const qc = useQueryClient()
  const profileId = useAppStore(s => s.currentProfileId)

  return useMutation({
    mutationFn: (id: string) => api.reactivateEntry(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: entriesKey(profileId) })
    },
  })
}

/** Update basic details (description, category, frequency) of a recurring entry */
export function useUpdateEntryDetails() {
  const qc = useQueryClient()
  const profileId = useAppStore(s => s.currentProfileId)

  return useMutation({
    mutationFn: ({ id, ...patch }: { id: string; description?: string; category?: string; frequency?: string }) =>
      api.updateEntryDetails(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: entriesKey(profileId) })
    },
  })
}
