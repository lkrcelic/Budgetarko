import { supabase } from '@/lib/supabase'
import type { AccountShareWithEmail, UserLookup } from '@/types'

/** Look up a registered user by their email address */
export async function findUserByEmail(email: string): Promise<UserLookup | null> {
  const { data, error } = await supabase
    .from('user_lookup')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle()

  if (error) throw error
  return data as UserLookup | null
}

/** Share your account (full access) with another registered user */
export async function shareWithUser(sharedWithUserId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('account_shares')
    .insert({ owner_user_id: user.id, shared_with_uid: sharedWithUserId })

  if (error) throw error
}

/** Revoke a share by its ID */
export async function revokeShare(shareId: string): Promise<void> {
  const { error } = await supabase
    .from('account_shares')
    .delete()
    .eq('id', shareId)

  if (error) throw error
}

/**
 * List the people you've granted access to (you are the owner).
 * Returns share records enriched with the recipient's email.
 */
export async function getMyShares(): Promise<AccountShareWithEmail[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: shares, error } = await supabase
    .from('account_shares')
    .select('*')
    .eq('owner_user_id', user.id)
    .order('created_at', { ascending: true })

  if (error) throw error
  if (!shares || shares.length === 0) return []

  // Enrich with recipient emails
  const uids = shares.map((s: any) => s.shared_with_uid)
  const { data: lookups } = await supabase
    .from('user_lookup')
    .select('user_id, email')
    .in('user_id', uids)

  const emailMap: Record<string, string> = Object.fromEntries(
    (lookups ?? []).map((l: any) => [l.user_id, l.email]),
  )

  return shares.map((s: any) => ({
    ...s,
    email: emailMap[s.shared_with_uid] ?? '(unknown)',
  }))
}

/**
 * List the accounts other people have shared with you (you are the recipient).
 * Returns share records enriched with the owner's email.
 */
export async function getSharedWithMe(): Promise<AccountShareWithEmail[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: shares, error } = await supabase
    .from('account_shares')
    .select('*')
    .eq('shared_with_uid', user.id)
    .order('created_at', { ascending: true })

  if (error) throw error
  if (!shares || shares.length === 0) return []

  // Enrich with owner emails
  const ownerIds = shares.map((s: any) => s.owner_user_id)
  const { data: lookups } = await supabase
    .from('user_lookup')
    .select('user_id, email')
    .in('user_id', ownerIds)

  const emailMap: Record<string, string> = Object.fromEntries(
    (lookups ?? []).map((l: any) => [l.user_id, l.email]),
  )

  return shares.map((s: any) => ({
    ...s,
    email: emailMap[s.owner_user_id] ?? '(unknown)',
  }))
}

/** Upsert the current user's email into user_lookup (call on every login) */
export async function upsertUserLookup(userId: string, email: string): Promise<void> {
  const { error } = await supabase
    .from('user_lookup')
    .upsert({ user_id: userId, email: email.toLowerCase().trim() })

  if (error) throw error
}
