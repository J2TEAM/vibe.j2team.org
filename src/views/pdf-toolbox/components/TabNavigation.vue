<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { Tab } from '../types'

defineProps<{
  activeTab: Tab
}>()

defineEmits<{
  (e: 'update:activeTab', tab: Tab): void
}>()

const tabs = [
  { id: 'merger', label: 'Hợp nhất', icon: 'lucide:layers' },
  { id: 'splitter', label: 'Tách trang', icon: 'lucide:scissors' },
  { id: 'history', label: 'Lịch sử', icon: 'lucide:history' },
] as const
</script>

<template>
  <div class="flex gap-1 mb-8 border-b border-border-default overflow-x-auto no-scrollbar">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      @click="$emit('update:activeTab', tab.id)"
      class="flex items-center gap-2 px-6 py-3 font-display font-semibold text-sm transition-all duration-300 relative"
      :class="
        activeTab === tab.id
          ? 'text-accent-coral translate-y-px'
          : 'text-text-secondary hover:text-text-primary'
      "
    >
      <Icon :icon="tab.icon" class="size-4" />
      {{ tab.label }}
      <div
        v-if="activeTab === tab.id"
        class="absolute bottom-0 left-0 w-full h-0.5 bg-accent-coral"
      ></div>
    </button>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
