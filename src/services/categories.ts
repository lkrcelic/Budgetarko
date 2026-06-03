import { supabase } from '@/lib/supabase'
import type { Category, CategoryType } from '@/types'
import { DEFAULT_CATEGORIES } from '@/lib/constants'

/**
 * Fetch categories for a given owner (user_id).
 * When viewing a shared account, pass the owner's user_id.
 * RLS permits the query as long as a share exists.
 */
export async function fetchCategories(ownerId: string): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', ownerId)
    .order('is_default', { ascending: false })
    .order('name', { ascending: true })

  if (error) throw error
  return data as Category[]
}

/** Create a single custom category */
export async function createCategory(
  category: Pick<Category, 'name' | 'type'>,
): Promise<Category> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('categories')
    .insert({
      name: category.name,
      type: category.type,
      user_id: user.id,
      active: true,
      is_default: false,
    })
    .select()
    .single()

  if (error) throw error
  return data as Category
}

/** Toggle a category's active state */
export async function toggleCategory(id: string, active: boolean): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .update({ active })
    .eq('id', id)

  if (error) throw error
}

/** Rename a category */
export async function renameCategory(id: string, name: string): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .update({ name: name.trim() })
    .eq('id', id)

  if (error) throw error
}

/** Delete a category row */
export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)

  if (error) throw error
}

/**
 * Seed all default categories for a new user.
 * Called once on first sign-in. Uses upsert so it's idempotent.
 */
export async function seedDefaultCategories(userId: string): Promise<void> {
  const rows: Array<{
    user_id: string
    name: string
    type: CategoryType
    active: boolean
    is_default: boolean
  }> = []

  for (const [type, names] of Object.entries(DEFAULT_CATEGORIES)) {
    for (const name of names) {
      rows.push({
        user_id: userId,
        name,
        type: type as CategoryType,
        active: true,
        is_default: true,
      })
    }
  }

  const { error } = await supabase
    .from('categories')
    .upsert(rows, { onConflict: 'user_id,name,type', ignoreDuplicates: true })

  if (error) throw error
}
