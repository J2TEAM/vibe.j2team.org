<script setup lang="ts">
defineProps<{
  won: boolean
  score: number
  timeLeft: number
  hintsUsed: number
  shufflesUsed: number
}>()

const emit = defineEmits<{
  playAgain: []
  backToMenu: []
}>()

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-bg-deep/80 backdrop-blur-sm">
    <div class="border border-border-default bg-bg-surface p-8 text-center max-w-sm w-full mx-4 animate-fade-up">
      <div class="text-5xl mb-4">{{ won ? '🎉' : '⏰' }}</div>
      <h2
        class="font-display text-2xl font-bold mb-2"
        :class="won ? 'text-accent-amber' : 'text-accent-coral'"
      >
        {{ won ? 'Chiến Thắng!' : 'Hết Giờ!' }}
      </h2>
      <p class="text-text-secondary text-sm mb-6">
        {{ won ? 'Bạn đã hoàn thành bảng! Tuyệt vời!' : 'Đừng nản, thử lại nhé!' }}
      </p>

      <!-- Stats -->
      <div class="grid grid-cols-2 gap-4 mb-6">
        <div class="border border-border-default bg-bg-elevated p-3">
          <span class="font-display text-xl font-bold text-accent-coral block">{{ score.toLocaleString() }}</span>
          <span class="text-text-dim text-xs font-display tracking-widest">ĐIỂM</span>
        </div>
        <div class="border border-border-default bg-bg-elevated p-3">
          <span class="font-display text-xl font-bold text-text-primary block">
            {{ won ? formatTime(timeLeft) : '0:00' }}
          </span>
          <span class="text-text-dim text-xs font-display tracking-widest">CÒN LẠI</span>
        </div>
        <div class="border border-border-default bg-bg-elevated p-3">
          <span class="font-display text-xl font-bold text-text-primary block">{{ hintsUsed }}</span>
          <span class="text-text-dim text-xs font-display tracking-widest">GỢI Ý</span>
        </div>
        <div class="border border-border-default bg-bg-elevated p-3">
          <span class="font-display text-xl font-bold text-text-primary block">{{ shufflesUsed }}</span>
          <span class="text-text-dim text-xs font-display tracking-widest">XÁO BÀI</span>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex flex-col gap-3">
        <button
          class="w-full border border-accent-coral bg-accent-coral/10 px-5 py-3 font-display text-sm font-semibold text-accent-coral transition hover:bg-accent-coral/20"
          @click="emit('playAgain')"
        >
          🎮 Chơi Lại
        </button>
        <button
          class="w-full border border-border-default bg-bg-surface px-5 py-3 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
          @click="emit('backToMenu')"
        >
          🏠 Menu Chính
        </button>
      </div>
    </div>
  </div>
</template>
