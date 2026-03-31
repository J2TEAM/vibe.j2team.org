<script setup lang="ts">
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { categories, type CategoryId } from '@/data/categories'

withDefaults(
  defineProps<{
    totalCount: number
    categoryCounts: Partial<Record<CategoryId, number>>
    resultCount: number
    searchPlaceholder?: string
    hideResultWhen?: boolean
  }>(),
  {
    searchPlaceholder: 'Tìm theo tên, mô tả hoặc tác giả...',
    hideResultWhen: false,
  },
)

const search = defineModel<string>('search', { required: true })
const category = defineModel<CategoryId | null>('category', { required: true })

const categoryExpanded = ref(false)

const isFiltering = computed(() => search.value.trim() !== '' || category.value !== null)

function toggleCategory(id: CategoryId) {
  category.value = category.value === id ? null : id
}

function clearFilters() {
  search.value = ''
  category.value = null
}

const searchInputRef = ref<HTMLInputElement | null>(null)

defineExpose({ searchInputRef })
</script>

<template>
  <div class="space-y-4">
    <!-- Search input + actions slot -->
    <div class="flex flex-col sm:flex-row gap-3">
      <div class="relative flex-1">
        <Icon
          icon="lucide:search"
          aria-hidden="true"
          class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim pointer-events-none"
        />
        <input
          ref="searchInputRef"
          v-model="search"
          type="search"
          :placeholder="searchPlaceholder"
          class="w-full bg-bg-surface border border-border-default pl-11 pr-12 py-3 text-sm text-text-primary placeholder-text-dim font-body transition-colors duration-200 focus:outline-none focus:border-accent-coral"
        />
        <kbd
          class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono text-text-dim border border-border-default rounded bg-bg-elevated"
        >
          /
        </kbd>
      </div>
      <slot name="actions" />
    </div>

    <!-- Category tags -->
    <div class="relative">
      <div
        class="flex flex-wrap gap-2 transition-[max-height] duration-300 ease-in-out overflow-hidden sm:!max-h-none"
        :class="categoryExpanded ? 'max-h-[500px]' : 'max-h-[4.5rem]'"
      >
        <button
          class="px-3 py-1.5 text-xs font-display tracking-wide border transition-colors duration-200"
          :class="
            category === null
              ? 'bg-accent-coral text-bg-deep border-accent-coral'
              : 'bg-bg-elevated text-text-secondary border-border-default hover:border-accent-coral hover:text-text-primary'
          "
          @click="category = null"
        >
          Tất cả ({{ totalCount }})
        </button>
        <button
          v-for="cat in categories"
          :key="cat.id"
          :title="cat.description"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-display tracking-wide border transition-colors duration-200"
          :class="
            category === cat.id
              ? 'bg-accent-coral text-bg-deep border-accent-coral'
              : categoryCounts[cat.id]
                ? 'bg-bg-elevated text-text-secondary border-border-default hover:border-accent-coral hover:text-text-primary'
                : 'bg-bg-surface text-text-dim border-border-default border-dashed hover:border-accent-coral/50 hover:text-text-secondary'
          "
          @click="toggleCategory(cat.id)"
        >
          <Icon :icon="cat.icon" aria-hidden="true" class="w-3.5 h-3.5 shrink-0" />
          <span class="translate-y-px">{{ cat.label }}</span>
          <span v-if="categoryCounts[cat.id]">({{ categoryCounts[cat.id] }})</span>
          <span v-else class="text-accent-coral/70">&#10022;</span>
        </button>
      </div>
      <!-- Expand/collapse toggle (mobile only) -->
      <button
        class="sm:hidden mt-1.5 flex items-center gap-1 text-xs text-text-dim hover:text-accent-coral transition-colors duration-200"
        @click="categoryExpanded = !categoryExpanded"
      >
        <Icon
          :icon="categoryExpanded ? 'lucide:chevron-up' : 'lucide:chevron-down'"
          aria-hidden="true"
          class="w-3.5 h-3.5 shrink-0"
        />
        <span class="translate-y-px">{{ categoryExpanded ? 'Thu gọn' : 'Xem thêm danh mục' }}</span>
      </button>
    </div>

    <!-- Result count when filtering -->
    <div
      v-if="isFiltering && !hideResultWhen"
      class="flex items-center gap-3 text-sm text-text-secondary"
    >
      <span>
        {{ resultCount }} kết quả
        <span v-if="resultCount === 0">— </span>
      </span>
      <button
        v-if="resultCount === 0"
        class="text-accent-coral hover:underline text-sm"
        @click="clearFilters"
      >
        Xóa bộ lọc
      </button>
    </div>
  </div>
</template>
