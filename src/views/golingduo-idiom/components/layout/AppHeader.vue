<script setup lang="ts">
import { Icon } from '@iconify/vue'

interface Tab {
  id: string
  label: string
  icon: string
}

defineProps<{
  activeTab: string
  streak: number
  xp: number
}>()

defineEmits<{
  (e: 'update:activeTab', tab: string): void
}>()

const tabs: Tab[] = [
  { id: 'home', label: 'Học', icon: 'fluent-emoji:books' },
  { id: 'quiz', label: 'Quiz', icon: 'fluent-emoji:game-die' },
  { id: 'collection', label: 'Bộ Sưu Tập', icon: 'fluent-emoji:card-index-dividers' },
  { id: 'spin', label: 'Vòng Quay', icon: 'fluent-emoji:ferris-wheel' },
  { id: 'stats', label: 'Stats', icon: 'fluent-emoji:bar-chart' },
]
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-border-default bg-bg-deep/95 backdrop-blur-sm">
    <!-- Top bar with logo + stats -->
    <div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
      <div class="flex items-center gap-2">
        <span class="text-2xl">🦜</span>
        <h1 class="font-display text-lg font-bold text-accent-coral">GolingDuo</h1>
      </div>
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-1 text-sm font-display">
          <span class="text-accent-amber">🔥</span>
          <span class="text-text-primary">{{ streak }}</span>
        </div>
        <div class="flex items-center gap-1 text-sm font-display">
          <span class="text-accent-sky">⚡</span>
          <span class="text-text-primary">{{ xp }} XP</span>
        </div>
      </div>
    </div>

    <!-- Desktop tabs (hidden on mobile — bottom bar instead) -->
    <nav class="mx-auto hidden max-w-5xl sm:flex">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="flex flex-1 items-center justify-center gap-2 border-b-2 px-4 py-2.5 text-sm font-display transition-colors"
        :class="
          activeTab === tab.id
            ? 'border-accent-coral text-accent-coral'
            : 'border-transparent text-text-secondary hover:text-text-primary'
        "
        @click="$emit('update:activeTab', tab.id)"
      >
        <Icon :icon="tab.icon" class="size-5" />
        {{ tab.label }}
      </button>
    </nav>
  </header>

  <!-- Mobile bottom nav -->
  <nav
    class="fixed bottom-0 left-0 right-0 z-40 flex border-t border-border-default bg-bg-deep/95 backdrop-blur-sm sm:hidden"
  >
    <button
      v-for="tab in tabs"
      :key="tab.id"
      class="flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-display transition-colors"
      :class="activeTab === tab.id ? 'text-accent-coral' : 'text-text-dim'"
      @click="$emit('update:activeTab', tab.id)"
    >
      <Icon :icon="tab.icon" class="size-6" />
      {{ tab.label }}
    </button>
  </nav>
</template>
