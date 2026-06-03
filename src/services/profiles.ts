import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'

/** Fetch all profiles owned by the current user */
export async function fetchProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) throw error
  return data as Profile[]
}

/** Create a new profile for the current user */
export async function createProfile(
  profile: Pick<Profile, 'name' | 'initials' | 'tint'>,
): Promise<Profile> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('profiles')
    .insert({ ...profile, user_id: user.id })
    .select()
    .single()

  if (error) throw error
  return data as Profile
}

/** Update an existing profile */
export async function updateProfile(
  id: string,
  patch: Partial<Pick<Profile, 'name' | 'initials' | 'tint'>>,
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Profile
}

/** Delete a profile and all its entries (cascade via FK) */
export async function deleteProfile(id: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', id)

  if (error) throw error
}
