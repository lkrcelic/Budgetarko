import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '@/services/categories'
import * as entriesApi from '@/services/entries'
import { useAppStore } from '@/stores/app-store'
import type { Category } from '@/types'

/** Fetch all categories for the currently active account owner */
export function useCategories() {
  const activeOwnerId = useAppStore(s => s.activeOwnerId)
  return useQuery({
    queryKey: ['categories', activeOwnerId],
    queryFn:  () => api.fetchCategories(activeOwnerId!),
    enabled:  !!activeOwnerId,
  })
}

/** Get active category names for a given type */
export function useActiveCategories(type: 'income' | 'expense') {
  const { data: categories } = useCategories()
  return (categories ?? [])
    .filter(c => c.type === type && c.active)
    .map(c => c.name)
}

/** Create a new custom category */
export function useCreateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (cat: Pick<Category, 'name' | 'type'>) => api.createCategory(cat),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  })
}

/** Toggle category active state */
export function useToggleCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api.toggleCategory(id, active),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  })
}

/** Rename a category */
export function useRenameCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      api.renameCategory(id, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  })
}

/**
 * Delete a category.
 * Entries that used this category are reset to 'uncategorized' first.
 */
export function useDeleteCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      await entriesApi.resetCategoryOnEntries(name)
      await api.deleteCategory(id)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      qc.invalidateQueries({ queryKey: ['entries'] })
    },
  })
}
