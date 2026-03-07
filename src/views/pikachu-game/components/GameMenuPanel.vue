<script setup lang="ts">
import { RouterLink } from 'vue-router'

interface Props {
  isPaused: boolean
  isFullscreen: boolean
}

defineProps<Props>()

defineEmits<{
  openNewGame: []
  openSettings: []
  togglePause: []
  openLeaderboard: []
  toggleFullscreen: []
}>()
</script>

<template>
  <aside class="animate-fade-up animate-delay-1 border border-border-default bg-bg-surface p-4">
    <h2 class="mb-3 flex items-center gap-2 font-display text-lg font-semibold">
      <span class="text-xs tracking-widest text-accent-coral">//</span>
      Menu
    </h2>
    <div class="grid gap-2">
      <button type="button" class="border border-border-default bg-bg-deep px-3 py-2 text-sm transition hover:border-accent-coral" @click="$emit('openNewGame')">
        B?t d?u ván m?i
      </button>
      <button type="button" class="border border-border-default bg-bg-deep px-3 py-2 text-sm transition hover:border-accent-amber" @click="$emit('openSettings')">
        Setting
      </button>
      <button type="button" class="border border-border-default bg-bg-deep px-3 py-2 text-sm transition hover:border-accent-sky" @click="$emit('togglePause')">
        {{ isPaused ? 'Ti?p t?c' : 'T?m d?ng' }}
      </button>
      <button type="button" class="border border-border-default bg-bg-deep px-3 py-2 text-sm transition hover:border-accent-coral" @click="$emit('openLeaderboard')">
        K? l?c
      </button>
      <button type="button" class="border border-border-default bg-bg-deep px-3 py-2 text-sm transition hover:border-accent-amber" @click="$emit('toggleFullscreen')">
        {{ isFullscreen ? 'Thoát full screen' : 'Full screen' }}
      </button>
    </div>
    <RouterLink to="/" class="mt-3 inline-flex w-full items-center justify-center border border-border-default bg-bg-deep px-3 py-2 text-sm transition hover:border-accent-amber">
      ? V? trang ch?
    </RouterLink>
  </aside>
</template>

