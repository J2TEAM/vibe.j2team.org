<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { Icon } from '@iconify/vue'
import CategoryGrid from '../components/collection/CategoryGrid.vue'
import SearchBar from '../components/collection/SearchBar.vue'
import IdiomCard from '../components/collection/IdiomCard.vue'
import type { IdiomCategoryId } from '../data/categories'
import { idioms } from '../data/idioms'
import { useProgress } from '../composables/useProgress'
import type { Idiom } from '../data/types'

const { progress } = useProgress()

const selectedCategory = ref<IdiomCategoryId | null>(null)
const searchQuery = ref('')
const selectedIdiom = ref<Idiom | null>(null)

const debouncedQuery = ref('')
const updateSearch = useDebounceFn((val: string) => {
  debouncedQuery.value = val
}, 300)

function handleSearch(val: string) {
  searchQuery.value = val
  updateSearch(val)
}

const filteredIdioms = computed(() => {
  let list = [...idioms]
  if (selectedCategory.value) {
    list = list.filter((i) => i.category === selectedCategory.value)
  }
  if (debouncedQuery.value) {
    const q = debouncedQuery.value.toLowerCase()
    list = list.filter(
      (i) =>
        i.phrase.toLowerCase().includes(q) ||
        i.meaning_vi.toLowerCase().includes(q) ||
        i.literal_vi.toLowerCase().includes(q),
    )
  }
  return list
})
</script>

<template>
  <div class="space-y-6">
    <h2
      class="flex items-center gap-3 font-display text-2xl font-semibold text-text-primary animate-fade-up"
    >
      <span class="font-display text-sm tracking-widest text-accent-sky">//</span>
      Bộ Sưu Tập Idiom
    </h2>

    <!-- Search -->
    <div class="animate-fade-up animate-delay-1">
      <SearchBar :model-value="searchQuery" @update:model-value="handleSearch" />
    </div>

    <!-- Categories -->
    <div class="animate-fade-up animate-delay-2">
      <CategoryGrid :selected-category="selectedCategory" @select="(c) => (selectedCategory = c)" />
    </div>

    <!-- Results count -->
    <p class="text-sm text-text-secondary animate-fade-up animate-delay-3">
      {{ filteredIdioms.length }} idiom{{ filteredIdioms.length !== 1 ? 's' : '' }}
      <span v-if="progress.learnedIds.length > 0" class="text-accent-sky">
        · {{ progress.learnedIds.length }} đã thuộc
      </span>
    </p>

    <!-- Idiom list -->
    <div class="grid gap-3 sm:grid-cols-2 animate-fade-up animate-delay-4">
      <IdiomCard
        v-for="idiom in filteredIdioms"
        :key="idiom.id"
        :idiom="idiom"
        :is-learned="progress.learnedIds.includes(idiom.id)"
        @click="selectedIdiom = idiom"
      />
    </div>

    <!-- Empty state -->
    <div v-if="filteredIdioms.length === 0" class="py-12 text-center">
      <span class="text-4xl">🤷</span>
      <p class="mt-2 text-text-secondary">Không tìm thấy idiom nào — thử tìm kiếm khác?</p>
    </div>

    <!-- Detail Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="selectedIdiom"
          class="fixed inset-0 z-50 flex items-center justify-center bg-bg-deep/80 backdrop-blur-sm p-4"
          @click.self="selectedIdiom = null"
        >
          <div class="w-full max-w-lg border border-accent-coral bg-bg-surface p-6 animate-fade-up">
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-3">
                <span class="text-3xl">{{ selectedIdiom.emoji }}</span>
                <h3 class="font-display text-xl font-bold text-accent-coral">
                  {{ selectedIdiom.phrase }}
                </h3>
              </div>
              <button class="text-text-dim hover:text-text-primary" @click="selectedIdiom = null">
                <Icon icon="lucide:x" class="size-5" />
              </button>
            </div>

            <div class="mt-4 space-y-3">
              <div>
                <p class="text-xs font-display tracking-widest text-text-dim">DỊCH THẲNG</p>
                <p class="font-display text-lg font-semibold text-accent-amber">
                  {{ selectedIdiom.literal_vi }}
                </p>
              </div>
              <div>
                <p class="text-xs font-display tracking-widest text-accent-coral">// NGHĨA THẬT</p>
                <p class="text-text-primary">{{ selectedIdiom.meaning_vi }}</p>
              </div>
              <div class="border border-border-default bg-bg-elevated p-3">
                <p class="text-sm italic text-text-secondary">{{ selectedIdiom.funny_context }}</p>
              </div>
              <div class="space-y-1 text-sm">
                <p class="text-accent-sky">🇬🇧 {{ selectedIdiom.example_en }}</p>
                <p class="text-text-secondary">🇻🇳 {{ selectedIdiom.example_vi }}</p>
              </div>
            </div>

            <button
              class="mt-4 w-full border border-border-default px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
              @click="selectedIdiom = null"
            >
              Đóng
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
