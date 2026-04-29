import { ref, computed, toValue, type MaybeRefOrGetter, type Ref, type ComputedRef } from 'vue'
import { refDebounced } from '@vueuse/core'
import type { CategoryId } from '@/data/categories'
import { normalize } from '@/utils/text'

interface UseFilteredListOptions<T> {
  items: MaybeRefOrGetter<T[]>
  /** Fields to normalize and search against */
  searchFields: (keyof T & string)[]
  /** Field used for category filtering (omit to disable category support) */
  categoryField?: keyof T & string
  /** Debounce delay in ms (default 300, set 0 to disable) */
  debounce?: number
}

interface UseFilteredListReturn<T> {
  searchQuery: Ref<string>
  activeCategory: Ref<CategoryId | null>
  isFiltering: ComputedRef<boolean>
  filteredList: ComputedRef<T[]>
  categoryCounts: ComputedRef<Partial<Record<CategoryId, number>>>
}

type NormalizedEntry<T> = T & { _normalized: Record<string, string> }

export function useFilteredList<T>(options: UseFilteredListOptions<T>): UseFilteredListReturn<T> {
  const { searchFields, categoryField, debounce: debounceMs = 300 } = options

  const searchQuery = ref('')
  const activeCategory = ref<CategoryId | null>(null)

  const effectiveQuery = debounceMs > 0 ? refDebounced(searchQuery, debounceMs) : searchQuery

  const isFiltering = computed(
    () => searchQuery.value.trim() !== '' || activeCategory.value !== null,
  )

  const normalizedItems = computed<NormalizedEntry<T>[]>(() =>
    toValue(options.items).map((item) => {
      const _normalized: Record<string, string> = {}
      for (const field of searchFields) {
        _normalized[field] = normalize(String((item as Record<string, unknown>)[field] ?? ''))
      }
      return { ...item, _normalized }
    }),
  )

  const filteredList = computed<T[]>(() => {
    const query = normalize(effectiveQuery.value.trim())
    const category = activeCategory.value

    return normalizedItems.value.filter((entry) => {
      if (categoryField && category) {
        if ((entry as Record<string, unknown>)[categoryField] !== category) return false
      }
      if (query) {
        return searchFields.some((field) => entry._normalized[field]?.includes(query))
      }
      return true
    })
  })

  const categoryCounts = computed<Partial<Record<CategoryId, number>>>(() => {
    if (!categoryField) return {}
    const counts: Partial<Record<CategoryId, number>> = {}
    for (const item of toValue(options.items)) {
      const cat = (item as Record<string, unknown>)[categoryField] as CategoryId | undefined
      if (cat) {
        counts[cat] = (counts[cat] || 0) + 1
      }
    }
    return counts
  })

  return { searchQuery, activeCategory, isFiltering, filteredList, categoryCounts }
}
