import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '@/services/profiles'
import type { Profile } from '@/types'

const PROFILES_KEY = ['profiles'] as const

/** Fetch all profiles for the current user */
export function useProfiles() {
  return useQuery({
    queryKey: PROFILES_KEY,
    queryFn: api.fetchProfiles,
  })
}

/** Create a new profile */
export function useCreateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (profile: Pick<Profile, 'name' | 'initials' | 'tint'>) =>
      api.createProfile(profile),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROFILES_KEY }),
  })
}

/** Update an existing profile */
export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...patch }: { id: string } & Partial<Pick<Profile, 'name' | 'initials' | 'tint'>>) =>
      api.updateProfile(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROFILES_KEY }),
  })
}

/** Delete a profile */
export function useDeleteProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteProfile(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROFILES_KEY }),
  })
}
