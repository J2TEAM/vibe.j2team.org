<script setup lang="ts">
import { computed, inject, unref } from 'vue'
import { TIME_OPTIONS } from '../types'
import type { TypingRecord } from '../types'

const game = inject<
  ReturnType<typeof import('../useTypingGame').useTypingGame> & {
    selectedTime: { value: number }
    TIME_OPTIONS: readonly number[]
  }
>('typingGame')

const historyList = computed<TypingRecord[]>(() => unref(game?.history) ?? [])

function selectTime(sec: number) {
  if (game?.selectedTime) game.selectedTime.value = sec
}
</script>

<template>
  <div v-if="game" class="flex flex-col items-center gap-6 animate-fade-up animate-delay-2 w-full">
    <div class="w-full max-w-lg space-y-3">
      <p class="font-display text-xs tracking-widest text-accent-coral">// THỜI GIAN</p>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="sec in game.TIME_OPTIONS ?? TIME_OPTIONS"
          :key="sec"
          type="button"
          class="font-display text-sm font-semibold px-4 py-2 border transition-all"
          :class="
            game.selectedTime?.value === sec
              ? 'border-accent-coral bg-accent-coral/20 text-accent-coral'
              : 'border-border-default bg-bg-surface text-text-secondary hover:border-accent-amber hover:text-text-primary'
          "
          @click="selectTime(sec)"
        >
          {{ sec }}s
        </button>
      </div>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-lg">
      <div class="border border-border-default bg-bg-surface p-4 text-center">
        <p class="font-display text-2xl font-bold text-accent-coral">
          {{ game.selectedTime?.value ?? 15 }}
        </p>
        <p class="text-text-dim text-xs mt-1">Giây</p>
      </div>
      <div class="border border-border-default bg-bg-surface p-4 text-center">
        <p class="font-display text-2xl font-bold text-accent-sky">∞</p>
        <p class="text-text-dim text-xs mt-1">Từ</p>
      </div>
      <div
        class="border border-border-default bg-bg-surface p-4 text-center col-span-2 sm:col-span-1"
      >
        <p class="font-display text-2xl font-bold text-accent-amber">VI</p>
        <p class="text-text-dim text-xs mt-1">Tiếng Việt</p>
      </div>
    </div>

    <div
      class="border border-border-default bg-bg-surface p-4 w-full max-w-lg text-sm text-text-secondary space-y-2"
    >
      <p class="font-display text-xs tracking-widest text-accent-amber mb-3">// HƯỚNG DẪN</p>
      <p>
        ✦ Nhấn <strong class="text-text-primary">Space</strong> để xác nhận từ và chuyển sang từ
        tiếp theo
      </p>
      <p>
        ✦ Ký tự đúng: <span class="text-accent-sky font-semibold">xanh</span> · Ký tự sai:
        <span class="text-accent-coral font-semibold">đỏ cam</span>
      </p>
      <p>✦ WPM = (số từ đúng / thời gian đã gõ) × 60 — chọn thời gian trước khi bắt đầu</p>
    </div>

    <button
      class="font-display text-sm font-bold tracking-widest px-10 py-4 bg-accent-coral text-bg-deep transition-all hover:bg-accent-amber active:scale-95"
      @click="game.startGame"
    >
      BẮT ĐẦU
    </button>

    <div
      v-if="historyList.length > 0"
      class="w-full max-w-lg border border-border-default bg-bg-surface p-4"
    >
      <p class="font-display text-xs tracking-widest text-accent-sky mb-3">// LỊCH SỬ</p>
      <ul class="space-y-2 max-h-48 overflow-y-auto">
        <li
          v-for="(record, i) in historyList"
          :key="i"
          class="flex items-center justify-between text-sm py-1.5 border-b border-border-default last:border-0"
        >
          <span class="text-text-dim text-xs">{{ game.formatRecordDate(record.date) }}</span>
          <span class="font-display font-semibold text-accent-coral">{{ record.wpm }} WPM</span>
          <span class="text-text-secondary">{{ record.accuracy }}%</span>
          <span class="text-text-dim text-xs"
            >{{ record.correct }}/{{ record.correct + record.incorrect }} từ ·
            {{ record.durationSeconds }}s</span
          >
        </li>
      </ul>
    </div>
  </div>
</template>
