<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useGameStore } from '../stores/gameStore'

// Multi-word component name for lint compliance
defineOptions({ name: 'TypingZombieGameOver' })

const store = useGameStore()
const emit = defineEmits<{ restart: [] }>()

function restart() {
  emit('restart')
}
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 pixel-overlay"
    role="dialog"
    aria-modal="true"
  >
    <div
      class="w-full max-w-md bg-bg-surface border border-border-default p-6 sm:p-8 text-center pixel-panel animate-fade-up"
    >
      <h2
        class="text-3xl sm:text-5xl font-display font-extrabold text-accent-coral mb-2 tracking-tight"
      >
        <span class="blink">GAME OVER</span>
      </h2>
      <p class="text-text-secondary text-sm mb-6 font-display tracking-widest uppercase">
        Zombie đã nuốt chửng bạn
      </p>

      <div class="space-y-3 mb-6">
        <div
          class="flex justify-between items-center px-4 py-2 bg-bg-deep border border-border-default"
        >
          <span class="text-text-dim text-[10px] font-display tracking-widest uppercase">Điểm</span>
          <span class="text-text-primary text-2xl font-display font-bold tabular-nums">{{
            store.score
          }}</span>
        </div>
        <div
          class="flex justify-between items-center px-4 py-2 bg-bg-deep border border-border-default"
        >
          <span class="text-text-dim text-[10px] font-display tracking-widest uppercase"
            >Level</span
          >
          <span class="text-text-primary text-lg font-display font-bold tabular-nums">{{
            store.level
          }}</span>
        </div>
        <div
          class="flex justify-between items-center px-4 py-2 bg-bg-deep border border-border-default"
        >
          <span class="text-text-dim text-[10px] font-display tracking-widest uppercase"
            >Highest combo</span
          >
          <span class="text-text-primary text-lg font-display font-bold tabular-nums">{{
            store.highestCombo
          }}</span>
        </div>
        <div
          class="flex justify-between items-center px-4 py-2 bg-bg-deep border border-border-default"
        >
          <span class="text-text-dim text-[10px] font-display tracking-widest uppercase"
            >Kỷ lục</span
          >
          <span class="text-text-primary text-lg font-display font-bold tabular-nums">{{
            store.highScore
          }}</span>
        </div>
      </div>

      <button
        type="button"
        class="w-full px-6 py-3 bg-accent-coral text-bg-deep text-lg font-display font-bold tracking-widest uppercase border border-accent-coral transition hover:brightness-105 active:translate-y-0.5"
        @click="restart"
      >
        Chơi lại
      </button>

      <RouterLink
        to="/"
        class="mt-3 inline-flex items-center justify-center w-full px-6 py-3 border border-border-default bg-bg-deep text-text-secondary text-sm font-display tracking-widest uppercase transition hover:border-accent-coral hover:text-text-primary"
      >
        Về trang chủ
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.pixel-overlay {
  image-rendering: pixelated;
}

.pixel-panel {
  outline: 4px solid #000;
  outline-offset: -4px;
}

.blink {
  animation: blink 800ms steps(2) infinite;
}

@keyframes blink {
  0%,
  49% {
    opacity: 1;
  }
  50%,
  100% {
    opacity: 0.25;
  }
}
</style>
