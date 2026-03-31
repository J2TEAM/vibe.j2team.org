<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { Icon } from '@iconify/vue'
import { useRecentlyViewedStore } from '@/stores/useRecentlyViewedStore'
import PageCard from '@/components/PageCard.vue'

const recentlyViewedStore = useRecentlyViewedStore()
const { recentPages } = storeToRefs(recentlyViewedStore)
const { clearHistory } = recentlyViewedStore
</script>

<template>
  <section v-if="recentPages.length > 0" class="max-w-5xl mx-auto px-4 sm:px-6 pb-10">
    <div class="flex items-center justify-between mb-5">
      <h2
        class="font-display text-lg sm:text-xl font-semibold text-text-primary flex items-center gap-3"
      >
        <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
        Xem gần đây
        <span
          class="ml-1 inline-flex items-center justify-center rounded-full bg-accent-coral/10 px-2.5 py-0.5 text-xs font-medium text-accent-coral"
        >
          {{ recentPages.length }}
        </span>
      </h2>
      <button
        class="flex items-center gap-1.5 text-xs font-display tracking-wide text-text-dim hover:text-accent-coral transition-colors duration-200"
        @click="clearHistory"
      >
        <Icon icon="lucide:trash-2" class="w-3.5 h-3.5" />
        Xóa
      </button>
    </div>

    <div class="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6 scrollbar-thin">
      <PageCard
        v-for="page in recentPages"
        :key="page.path"
        :page="page"
        compact
        class="flex-shrink-0 w-56"
      />
    </div>
  </section>
</template>

<style scoped>
.scrollbar-thin {
  scrollbar-width: thin;
  scrollbar-color: var(--color-border-default) transparent;
}
.scrollbar-thin::-webkit-scrollbar {
  height: 4px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: var(--color-border-default);
  border-radius: 2px;
}
</style>
