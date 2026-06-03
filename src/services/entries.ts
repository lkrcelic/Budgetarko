import { supabase } from '@/lib/supabase'
import type { Entry } from '@/types'

/** Fetch all entries for a specific profile */
export async function fetchEntries(profileId: string): Promise<Entry[]> {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Entry[]
}

/** Create a new entry */
export async function createEntry(
  entry: Omit<Entry, 'id' | 'created_at' | 'updated_at'>,
): Promise<Entry> {
  const { data, error } = await supabase
    .from('entries')
    .insert(entry)
    .select()
    .single()

  if (error) throw error
  return data as Entry
}

/** Update an existing entry */
export async function updateEntry(
  id: string,
  patch: Partial<Omit<Entry, 'id' | 'profile_id' | 'created_at' | 'updated_at'>>,
): Promise<Entry> {
  const { data, error } = await supabase
    .from('entries')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Entry
}

/** Delete an entry (installment children are deleted automatically since they don't exist — we compute them) */
export async function deleteEntry(id: string): Promise<void> {
  const { error } = await supabase
    .from('entries')
    .delete()
    .eq('id', id)

  if (error) throw error
}

/**
 * Reset all entries that have the given category name to 'uncategorized'.
 * Called before deleting a category so existing entries don't become orphaned.
 * RLS ensures only the current user's entries are affected.
 */
export async function resetCategoryOnEntries(categoryName: string): Promise<void> {
  const { error } = await supabase
    .from('entries')
    .update({ category: 'uncategorized' })
    .eq('category', categoryName)

  if (error) throw error
}
