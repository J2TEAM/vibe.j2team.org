<script setup lang="ts">
defineProps<{
  roundsCleared: number;
  totalTimeSeconds: number;
  playerName: string;
}>();

defineEmits<{
  (e: "playAgain"): void;
  (e: "goHome"): void;
}>();

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-4 py-12">
    <div
      class="border border-border-default bg-bg-surface p-6 md:p-8 w-full max-w-md text-center relative overflow-hidden animate-fade-up"
    >
      <span
        class="absolute top-3 right-4 font-display text-7xl font-bold text-accent-coral/5 select-none pointer-events-none"
      >
        GG
      </span>

      <div class="mb-2">
        <span class="font-display text-xs tracking-[0.3em] text-accent-amber uppercase">
          // Kết thúc
        </span>
      </div>
      <h1 class="text-4xl md:text-5xl font-display font-bold text-accent-coral mb-6">Game Over</h1>

      <!-- Stats -->
      <div class="flex justify-center gap-6 md:gap-8 mb-6">
        <div class="text-center">
          <span
            class="block text-[10px] text-text-dim font-display tracking-[0.15em] uppercase mb-1"
            >Vòng</span
          >
          <span class="block text-3xl md:text-4xl font-display font-bold text-accent-amber">
            {{ roundsCleared }}
          </span>
        </div>
        <div class="w-px bg-border-default" />
        <div class="text-center">
          <span
            class="block text-[10px] text-text-dim font-display tracking-[0.15em] uppercase mb-1"
            >Thời gian</span
          >
          <span class="block text-3xl md:text-4xl font-display font-bold text-accent-amber">
            {{ formatTime(totalTimeSeconds) }}
          </span>
        </div>
      </div>

      <div class="mb-6 text-sm text-text-secondary">
        Người chơi: <strong class="text-text-primary">{{ playerName }}</strong>
      </div>

      <!-- Actions -->
      <div class="flex flex-col gap-3">
        <button
          class="w-full py-3.5 text-lg font-display font-bold border-none bg-accent-coral text-bg-deep cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent-coral/20 tracking-wide"
          @click="$emit('playAgain')"
        >
          Chơi lại
        </button>
        <button
          class="w-full py-3 text-sm font-display font-semibold border border-border-default bg-transparent text-text-secondary cursor-pointer hover:border-accent-amber hover:text-accent-amber transition-all duration-300 tracking-wide"
          @click="$emit('goHome')"
        >
          Về màn hình chính
        </button>
      </div>
    </div>
  </div>
</template>
