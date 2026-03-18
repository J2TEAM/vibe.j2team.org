<script setup lang="ts">
import { Icon } from '@iconify/vue'

defineProps<{
  score: number
  total: number
  xpEarned: number
  message: string
}>()

defineEmits<{
  (e: 'retry'): void
  (e: 'home'): void
}>()
</script>

<template>
  <div class="animate-fade-up space-y-6 border border-border-default bg-bg-surface p-8 text-center">
    <!-- Score circle -->
    <div class="mx-auto flex size-32 items-center justify-center border-4 border-accent-coral">
      <div>
        <span class="font-display text-4xl font-bold text-accent-coral">{{ score }}</span>
        <span class="font-display text-lg text-text-dim">/{{ total }}</span>
      </div>
    </div>

    <!-- Message -->
    <p class="font-display text-xl font-semibold text-text-primary">
      {{ message }}
    </p>

    <!-- XP earned -->
    <div
      class="inline-flex items-center gap-2 border border-accent-amber bg-accent-amber/10 px-4 py-2 font-display text-accent-amber"
    >
      <Icon icon="lucide:zap" class="size-5" />
      +{{ xpEarned }} XP
    </div>

    <!-- Actions -->
    <div class="flex gap-3">
      <button
        class="flex flex-1 items-center justify-center gap-2 border border-accent-coral bg-accent-coral/10 px-4 py-3 font-display text-sm text-accent-coral transition hover:bg-accent-coral/20"
        @click="$emit('retry')"
      >
        <Icon icon="lucide:refresh-cw" class="size-4" />
        Thử Lại
      </button>
      <button
        class="flex flex-1 items-center justify-center gap-2 border border-border-default px-4 py-3 font-display text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
        @click="$emit('home')"
      >
        <Icon icon="lucide:home" class="size-4" />
        Trang Chủ
      </button>
    </div>
  </div>
</template>
