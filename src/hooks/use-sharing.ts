import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '@/services/sharing'

const MY_SHARES_KEY     = ['sharing', 'mine']    as const
const SHARED_WITH_ME_KEY = ['sharing', 'with-me'] as const

/** Accounts you've granted access to (you are the owner) */
export function useMyShares() {
  return useQuery({
    queryKey: MY_SHARES_KEY,
    queryFn:  api.getMyShares,
  })
}

/** Accounts others have shared with you (you are the recipient) */
export function useSharedWithMe() {
  return useQuery({
    queryKey: SHARED_WITH_ME_KEY,
    queryFn:  api.getSharedWithMe,
  })
}

/** Share your account with a user found by email */
export function useShareWithUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (email: string) => {
      const found = await api.findUserByEmail(email)
      if (!found) throw new Error('No Budgetarko account found for that email.')
      await api.shareWithUser(found.user_id)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MY_SHARES_KEY })
    },
  })
}

/** Revoke a share by its ID */
export function useRevokeShare() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.revokeShare,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MY_SHARES_KEY })
    },
  })
}
