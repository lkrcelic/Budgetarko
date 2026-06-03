import { supabase } from '@/lib/supabase'
import type { Entry, AmountVersion } from '@/types'

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

// ── Subscription / scheduled-income management ────────────────

/**
 * Update the amount of a recurring entry, preserving price-change history.
 *
 * 1. Reads the current entry to get existing amount_history
 * 2. Appends a new version {amount, from: effectiveDate}
 * 3. Updates entry.amount to the new value
 */
export async function updateEntryAmount(
  id: string,
  newAmount: number,
  effectiveDate: string,     // "YYYY-MM-DD"
): Promise<Entry> {
  // Read current entry to get existing history
  const { data: current, error: readError } = await supabase
    .from('entries')
    .select('amount, amount_history')
    .eq('id', id)
    .single()

  if (readError) throw readError

  const history: AmountVersion[] = (current.amount_history as AmountVersion[] | null) ?? []

  // If there's no history yet, add the original amount as the first version
  // using the entry's creation date (approximation — the entry's month/year)
  if (history.length === 0 && current.amount !== newAmount) {
    // We'll read the full entry to get the original date
    const { data: fullEntry, error: fullError } = await supabase
      .from('entries')
      .select('year, month')
      .eq('id', id)
      .single()

    if (fullError) throw fullError
    const origDate = `${fullEntry.year}-${String(fullEntry.month).padStart(2, '0')}-01`
    history.push({ amount: current.amount, from: origDate })
  }

  // Append the new version
  history.push({ amount: newAmount, from: effectiveDate })

  const { data, error } = await supabase
    .from('entries')
    .update({ amount: newAmount, amount_history: history })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Entry
}

/** Stop a subscription / scheduled income — sets end_date */
export async function stopEntry(id: string, endDate: string): Promise<Entry> {
  const { data, error } = await supabase
    .from('entries')
    .update({ end_date: endDate })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Entry
}

/** Reactivate a stopped subscription / scheduled income — clears end_date */
export async function reactivateEntry(id: string): Promise<Entry> {
  const { data, error } = await supabase
    .from('entries')
    .update({ end_date: null })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Entry
}

/** Update basic details of a recurring entry (description, category, frequency) */
export async function updateEntryDetails(
  id: string,
  patch: { description?: string; category?: string; frequency?: string },
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
