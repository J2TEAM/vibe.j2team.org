<script setup lang="ts">
import { ref, computed, useTemplateRef } from 'vue'
import { RouterLink } from 'vue-router'
import { useHead, useSeoMeta } from '@unhead/vue'
import { Icon } from '@iconify/vue'
import { getAllAuthors, toAuthorSlug } from '@/data/authors'
import { getCategoryLabel } from '@/data/categories'
import { useSearchShortcut } from '@/composables/useSearchShortcut'
import { useFilteredList } from '@/composables/useFilteredList'
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
import AuthorAvatar from '@/components/AuthorAvatar.vue'

useHead({ title: 'Thành viên - vibe.j2team.org' })
useSeoMeta({
  description: 'Danh sách tất cả thành viên đóng góp trên vibe.j2team.org.',
  ogTitle: 'Thành viên - vibe.j2team.org',
  ogDescription: 'Danh sách tất cả thành viên đóng góp trên vibe.j2team.org.',
})

const { searchQuery: search, filteredList: filteredBySearch } = useFilteredList({
  items: () => Array.from(getAllAuthors().values()),
  searchFields: ['author'],
  debounce: 0,
})

const searchInputRef = useTemplateRef<HTMLInputElement>('searchInput')
useSearchShortcut(searchInputRef)

type SortMode = 'apps' | 'name'
const sortBy = ref<SortMode>('name')
const sortAsc = ref(false)

function toggleSort(mode: SortMode) {
  if (sortBy.value === mode) {
    sortAsc.value = !sortAsc.value
  } else {
    sortBy.value = mode
    sortAsc.value = false
  }
}

const sortLabels: Record<SortMode, [string, string]> = {
  apps: ['Nhiều nhất', 'Ít nhất'],
  name: ['A → Z', 'Z → A'],
}

const sortIcons: Record<SortMode, [string, string]> = {
  apps: ['lucide:arrow-down-wide-narrow', 'lucide:arrow-up-wide-narrow'],
  name: ['lucide:arrow-down-a-z', 'lucide:arrow-up-z-a'],
}

const totalMembers = getAllAuthors().size

const filteredMembers = computed(() => {
  const list = [...filteredBySearch.value]
  const dir = sortAsc.value ? -1 : 1

  if (sortBy.value === 'name') {
    list.sort((a, b) => dir * a.author.localeCompare(b.author))
  } else {
    list.sort((a, b) => {
      if (b.apps.length !== a.apps.length) return dir * (b.apps.length - a.apps.length)
      return a.author.localeCompare(b.author)
    })
  }

  return list
})
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 pt-20 sm:pt-28 pb-16 sm:pb-24">
      <AppBreadcrumb :items="[{ label: 'Thành viên' }]" />

      <!-- Header -->
      <h1
        class="mt-8 font-display text-3xl sm:text-4xl font-bold text-text-primary flex items-center gap-3"
      >
        <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
        Thành viên
      </h1>
      <p class="mt-4 text-text-secondary">
        {{ totalMembers }} thành viên đã đóng góp ứng dụng trên vibe.j2team.org
      </p>

      <!-- Search & Sort -->
      <div class="mt-8 flex flex-wrap items-center gap-3">
        <div class="relative">
          <Icon
            icon="lucide:search"
            class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim"
          />
          <input
            ref="searchInput"
            v-model="search"
            type="search"
            placeholder="Tìm thành viên..."
            class="w-full sm:w-80 pl-10 pr-12 py-2.5 bg-bg-surface border border-border-default text-text-primary text-sm font-display tracking-wide placeholder:text-text-dim focus:outline-none focus:border-accent-coral transition-colors"
          />
          <kbd
            class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono text-text-dim border border-border-default rounded bg-bg-elevated"
          >
            /
          </kbd>
        </div>

        <div class="flex gap-1">
          <button
            v-for="mode in ['apps', 'name'] as const"
            :key="mode"
            class="inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-display tracking-wide border transition-colors"
            :class="
              sortBy === mode
                ? 'border-accent-coral bg-accent-coral/10 text-accent-coral'
                : 'border-border-default bg-bg-surface text-text-dim hover:border-border-hover hover:text-text-secondary'
            "
            @click="toggleSort(mode)"
          >
            <Icon :icon="sortIcons[mode][sortBy === mode && sortAsc ? 1 : 0]" class="w-4 h-4" />
            {{ sortLabels[mode][sortBy === mode && sortAsc ? 1 : 0] }}
          </button>
        </div>
      </div>

      <!-- Members grid -->
      <div class="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <RouterLink
          v-for="member in filteredMembers"
          :key="member.slug"
          :to="`/author/${toAuthorSlug(member.author)}`"
          class="group border border-border-default bg-bg-surface p-5 transition-all duration-300 hover:-translate-y-1 hover:bg-bg-elevated hover:shadow-lg hover:border-accent-coral/50"
        >
          <!-- Author -->
          <div class="flex items-center gap-3">
            <AuthorAvatar :author="member.author" size="md" />
            <div class="min-w-0 flex-1">
              <h2
                class="font-display text-lg font-bold truncate transition-colors group-hover:text-accent-coral"
              >
                {{ member.author }}
              </h2>
              <p class="text-sm text-text-secondary">
                <span class="font-display font-bold text-accent-coral">{{
                  member.apps.length
                }}</span>
                ứng dụng
              </p>
            </div>
          </div>

          <!-- Categories -->
          <div v-if="member.categories.length" class="mt-3 flex flex-wrap gap-1.5">
            <span
              v-for="cat in member.categories"
              :key="cat"
              class="text-[10px] px-1.5 py-0.5 bg-bg-elevated text-text-dim font-display tracking-wide border border-border-default"
            >
              {{ getCategoryLabel(cat) }}
            </span>
          </div>
        </RouterLink>
      </div>

      <!-- Empty state -->
      <div
        v-if="filteredMembers.length === 0"
        class="mt-16 flex flex-col items-center justify-center text-center"
      >
        <Icon icon="lucide:search-x" class="w-12 h-12 text-text-dim mb-4" />
        <p class="text-text-secondary">
          Không tìm thấy thành viên nào với từ khóa
          <span class="text-accent-coral">"{{ search }}"</span>
        </p>
      </div>
    </div>
  </div>
</template>
