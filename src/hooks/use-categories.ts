import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '@/services/categories'
import type { Category } from '@/types'

const CATEGORIES_KEY = ['categories'] as const

/** Fetch all categories for the current user */
export function useCategories() {
  return useQuery({
    queryKey: CATEGORIES_KEY,
    queryFn: api.fetchCategories,
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
    onSuccess: () => qc.invalidateQueries({ queryKey: CATEGORIES_KEY }),
  })
}

/** Toggle category active state */
export function useToggleCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api.toggleCategory(id, active),
    onSuccess: () => qc.invalidateQueries({ queryKey: CATEGORIES_KEY }),
  })
}
