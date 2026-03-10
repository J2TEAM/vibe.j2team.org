<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useCornerStore } from '../store/useCornerStore'

const store = useCornerStore()

const { filteredPredictions, selectedIndex, filters, bookmarks } = storeToRefs(store)

const hasResults = computed(() => filteredPredictions.value.length > 0)
</script>

<template>
  <section
    class="border border-border-default bg-bg-surface p-4 sm:p-5 transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5"
  >
    <h2 class="font-display text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
      <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
      Lịch thi đấu &amp; kèo góc
    </h2>

    <div class="flex items-center gap-2 mb-3">
      <div class="relative flex-1">
        <Icon
          icon="lucide:search"
          class="size-3.5 text-text-dim absolute left-2.5 top-1/2 -translate-y-1/2"
        />
        <input
          v-model="filters.teamQuery"
          type="text"
          class="w-full bg-bg-elevated border border-border-default pl-7 pr-3 py-1.5 text-xs text-text-primary placeholder:text-text-dim focus:border-accent-coral focus:outline-none transition"
          placeholder="Tìm theo tên đội..."
        />
      </div>
      <button
        class="border border-border-default bg-bg-surface px-2.5 py-1 text-[11px] text-text-dim flex items-center gap-1 transition hover:border-accent-sky hover:text-accent-sky"
        :class="filters.onlyFuture ? 'border-accent-sky text-accent-sky bg-accent-sky/10' : ''"
        @click="store.updateFilters({ onlyFuture: !filters.onlyFuture })"
      >
        <Icon icon="lucide:calendar" class="size-3" />
        Sắp đá
      </button>
      <button
        class="border border-border-default bg-bg-surface px-2.5 py-1 text-[11px] text-text-dim flex items-center gap-1 transition hover:border-accent-amber hover:text-accent-amber"
        :class="
          filters.bookmarkedOnly ? 'border-accent-amber text-accent-amber bg-accent-amber/10' : ''
        "
        @click="store.updateFilters({ bookmarkedOnly: !filters.bookmarkedOnly })"
      >
        <Icon icon="lucide:bookmark" class="size-3" />
        Ưa thích
      </button>
    </div>

    <div
      v-if="!hasResults"
      class="border border-border-default bg-bg-elevated p-3 text-xs text-text-dim"
    >
      Không tìm thấy trận phù hợp với bộ lọc hiện tại.
    </div>

    <div
      v-else
      class="max-h-72 overflow-auto border border-border-default bg-bg-elevated divide-y divide-border-default"
    >
      <button
        v-for="entry in filteredPredictions"
        :key="`${entry.item.date}-${entry.item.homeTeam}-${entry.item.awayTeam}`"
        class="w-full text-left px-3 py-2.5 text-xs sm:text-[13px] flex items-center gap-2 hover:bg-bg-surface transition group"
        :class="
          entry.index === selectedIndex
            ? 'bg-bg-surface border-l-2 border-l-accent-coral'
            : 'border-l border-l-transparent'
        "
        @click="store.setSelectedIndex(entry.index)"
      >
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1.5">
            <span class="font-mono text-[11px] text-text-dim shrink-0">
              {{ entry.item.date }}
            </span>
            <span
              v-if="entry.item.isFuture"
              class="inline-flex items-center gap-1 border border-accent-sky/40 bg-accent-sky/10 text-accent-sky text-[10px] font-display tracking-widest px-1.5 py-0.5 uppercase"
            >
              <span class="size-1.5 rounded-full bg-accent-sky" />
              Upcoming
            </span>
          </div>
          <div class="mt-0.5 font-display text-[13px] text-text-primary truncate">
            {{ entry.item.homeTeam }}
            <span class="text-text-dim">vs</span>
            {{ entry.item.awayTeam }}
          </div>
          <div class="mt-0.5 text-[11px] text-text-dim flex items-center gap-1">
            <span>{{ entry.item.prediction }}</span>
            <span class="text-text-secondary">·</span>
            <span
              :class="{
                'text-accent-coral': entry.item.confidence === 'High',
                'text-accent-amber': entry.item.confidence === 'Medium',
              }"
            >
              {{ entry.item.confidence }}
            </span>
            <span v-if="entry.item.actualCorners !== null" class="ml-1">
              (thực tế: {{ entry.item.actualCorners }})
            </span>
          </div>
        </div>
        <button
          class="ml-1 text-text-dim hover:text-accent-amber transition"
          type="button"
          @click.stop="store.toggleBookmark(entry.index)"
        >
          <Icon
            :icon="
              bookmarks.includes(entry.index) ? 'lucide:bookmark-check' : 'lucide:bookmark-plus'
            "
            class="size-4"
          />
        </button>
      </button>
    </div>
  </section>
</template>
