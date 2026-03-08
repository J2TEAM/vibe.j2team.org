<script setup lang="ts">
import { computed, inject, unref } from 'vue'

const game = inject<ReturnType<typeof import('../useTypingGame').useTypingGame>>('typingGame')

const wpmValue = computed(() => unref(game?.wpm) ?? 0)
const accuracyValue = computed(() => unref(game?.accuracy) ?? 0)
const correctCountValue = computed(() => unref(game?.correctCount) ?? 0)
const incorrectCountValue = computed(() => unref(game?.incorrectCount) ?? 0)
</script>

<template>
  <div v-if="game" class="w-full flex flex-col items-center gap-6 animate-fade-up">
    <div class="w-full max-w-lg">
      <div class="text-center mb-6">
        <p class="font-display text-xs tracking-widest text-accent-coral mb-2">// KẾT QUẢ</p>
        <h2 class="font-display text-3xl font-bold text-text-primary">Hoàn thành!</h2>
      </div>

      <div class="border border-accent-coral bg-bg-surface p-8 text-center mb-4">
        <p class="font-display text-8xl font-bold text-accent-coral tabular-nums leading-none">
          {{ wpmValue }}
        </p>
        <p class="font-display text-sm tracking-widest text-text-secondary mt-2">TỪ / PHÚT (WPM)</p>
      </div>

      <div class="grid grid-cols-3 gap-3 mb-4">
        <div class="border border-border-default bg-bg-surface p-4 text-center">
          <p class="font-display text-2xl sm:text-3xl font-bold text-accent-amber tabular-nums">
            {{ accuracyValue }}%
          </p>
          <p class="text-text-dim text-xs mt-1">Chính xác</p>
        </div>
        <div class="border border-border-default bg-bg-surface p-4 text-center">
          <p class="font-display text-2xl sm:text-3xl font-bold text-accent-sky tabular-nums">
            {{ correctCountValue }}
          </p>
          <p class="text-text-dim text-xs mt-1">Từ đúng</p>
        </div>
        <div class="border border-border-default bg-bg-surface p-4 text-center">
          <p class="font-display text-2xl sm:text-3xl font-bold text-accent-coral tabular-nums">
            {{ incorrectCountValue }}
          </p>
          <p class="text-text-dim text-xs mt-1">Từ sai</p>
        </div>
      </div>

      <div class="border border-border-default bg-bg-elevated p-4 text-center mb-4">
        <p class="text-text-secondary text-sm">
          <template v-if="wpmValue >= 80"
            >🔥 <span class="text-accent-coral font-semibold">Xuất sắc!</span> Bạn gõ cực kỳ
            nhanh!</template
          >
          <template v-else-if="wpmValue >= 60"
            >⚡ <span class="text-accent-amber font-semibold">Giỏi lắm!</span> Tốc độ khá ổn rồi
            đó.</template
          >
          <template v-else-if="wpmValue >= 40"
            >👍 <span class="text-accent-sky font-semibold">Không tệ!</span> Luyện tập thêm để cải
            thiện.</template
          >
          <template v-else
            >💪 <span class="text-text-primary font-semibold">Cố lên!</span> Mỗi ngày luyện một ít
            sẽ cải thiện nhé.</template
          >
        </p>
      </div>

      <p class="text-text-dim text-xs text-center mb-6">
        Kết quả đã được lưu vào lịch sử bên dưới.
      </p>

      <button
        class="w-full font-display text-sm font-bold tracking-widest py-4 bg-accent-coral text-bg-deep transition-all hover:bg-accent-amber active:scale-95"
        @click="game.restartGame"
      >
        CHƠI LẠI
      </button>
    </div>
  </div>
</template>
