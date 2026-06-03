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
