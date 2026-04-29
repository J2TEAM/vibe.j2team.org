<script setup lang="ts">
import type { DifficultyLevel, GameMode, GamePhase } from '../types'

interface Props {
  gameMode: GameMode
  difficultyLevel: DifficultyLevel
  difficultyLabel: string
  phase: GamePhase
  activePlayerLabel: string
  stageLabel: string
  turnSummaryButtonLabel: string
  timeLeft: number
  boatHits: number
  windPower: number
  playerOneScore: number | null
  playerTwoScore: number | null
}

defineProps<Props>()

const emit = defineEmits<{
  (event: 'set-mode', mode: GameMode): void
  (event: 'set-difficulty', level: DifficultyLevel): void
  (event: 'start-match'): void
  (event: 'start-second-turn'): void
  (event: 'replay-match'): void
  (event: 'return-setup'): void
}>()
</script>

<template>
  <aside class="animate-fade-up animate-delay-2 border border-border-default bg-bg-surface p-5">
    <h2 class="mb-4 flex items-center gap-2 font-display text-xl font-semibold">
      <span class="text-sm tracking-widest text-accent-amber">//</span>
      Điều Khiển
    </h2>

    <div class="mb-4 border border-border-default bg-bg-elevated p-3">
      <p class="mb-2 font-display text-xs tracking-widest text-accent-sky">// LEVEL</p>
      <div class="grid grid-cols-3 gap-2">
        <button
          type="button"
          class="border px-2 py-2 text-xs transition"
          :class="
            difficultyLevel === 'easy'
              ? 'border-accent-coral bg-accent-coral/10 text-text-primary'
              : 'border-border-default bg-bg-surface text-text-secondary hover:border-accent-coral'
          "
          :disabled="phase !== 'setup'"
          @click="emit('set-difficulty', 'easy')"
        >
          Dễ
        </button>
        <button
          type="button"
          class="border px-2 py-2 text-xs transition"
          :class="
            difficultyLevel === 'medium'
              ? 'border-accent-coral bg-accent-coral/10 text-text-primary'
              : 'border-border-default bg-bg-surface text-text-secondary hover:border-accent-coral'
          "
          :disabled="phase !== 'setup'"
          @click="emit('set-difficulty', 'medium')"
        >
          Trung bình
        </button>
        <button
          type="button"
          class="border px-2 py-2 text-xs transition"
          :class="
            difficultyLevel === 'hard'
              ? 'border-accent-coral bg-accent-coral/10 text-text-primary'
              : 'border-border-default bg-bg-surface text-text-secondary hover:border-accent-coral'
          "
          :disabled="phase !== 'setup'"
          @click="emit('set-difficulty', 'hard')"
        >
          Khó
        </button>
      </div>
      <p class="mt-2 text-xs text-text-secondary">
        Mức hiện tại: <span class="font-display text-text-primary">{{ difficultyLabel }}</span>
      </p>
    </div>

    <div class="mb-4 grid grid-cols-2 gap-2">
      <button
        type="button"
        class="border px-3 py-2 text-sm transition"
        :class="
          gameMode === 'single'
            ? 'border-accent-coral bg-accent-coral/10 text-text-primary'
            : 'border-border-default bg-bg-elevated text-text-secondary hover:border-accent-coral'
        "
        :disabled="phase !== 'setup'"
        @click="emit('set-mode', 'single')"
      >
        1 Người
      </button>
      <button
        type="button"
        class="border px-3 py-2 text-sm transition"
        :class="
          gameMode === 'hotseat'
            ? 'border-accent-coral bg-accent-coral/10 text-text-primary'
            : 'border-border-default bg-bg-elevated text-text-secondary hover:border-accent-coral'
        "
        :disabled="phase !== 'setup'"
        @click="emit('set-mode', 'hotseat')"
      >
        Hot-seat
      </button>
    </div>

    <div class="space-y-2 border border-border-default bg-bg-elevated p-4 text-sm">
      <p class="text-text-secondary">Lượt hiện tại</p>
      <p class="font-display text-lg text-text-primary">{{ activePlayerLabel }}</p>
      <p class="text-text-secondary">
        Stage: <span class="font-display text-text-primary">{{ stageLabel }}</span>
      </p>
      <p class="text-text-secondary">
        Thời gian: <span class="font-display text-text-primary">{{ timeLeft.toFixed(1) }}s</span>
      </p>
      <p class="text-text-secondary">
        Va chạm: <span class="font-display text-text-primary">{{ boatHits }}</span>
      </p>
      <p class="text-text-secondary">
        Wind power: <span class="font-display text-accent-sky">{{ windPower }}%</span>
      </p>
    </div>

    <div class="mt-4 border border-border-default bg-bg-elevated p-4 text-sm text-text-secondary">
      <p class="mb-2 font-display text-xs tracking-widest text-accent-coral">// HƯỚNG DẪN</p>
      <p>Vuốt nhanh theo hướng muốn đẩy thuyền. Vuốt ngắn và liên tục sẽ dễ điều chỉnh hơn.</p>
      <p class="mt-2">Mỗi lần va chạm sẽ bị trừ thời gian, nên ưu tiên luồn qua khoảng trống.</p>
    </div>

    <div class="mt-4 border border-border-default bg-bg-elevated p-4 text-sm text-text-secondary">
      <p class="font-display text-xs tracking-widest text-accent-amber">// ĐIỂM HOT-SEAT</p>
      <p class="mt-2">
        Người chơi 1: <span class="text-text-primary">{{ playerOneScore ?? '-' }}</span>
      </p>
      <p>
        Người chơi 2: <span class="text-text-primary">{{ playerTwoScore ?? '-' }}</span>
      </p>
    </div>

    <div class="mt-4 flex flex-col gap-2">
      <button
        v-if="phase === 'setup'"
        type="button"
        class="border border-accent-coral bg-accent-coral/15 px-4 py-2 text-sm font-display tracking-wide text-text-primary transition hover:bg-accent-coral/25"
        @click="emit('start-match')"
      >
        Bắt đầu lượt đua
      </button>

      <button
        v-if="phase === 'turn-summary'"
        type="button"
        class="border border-accent-coral bg-accent-coral/15 px-4 py-2 text-sm font-display tracking-wide text-text-primary transition hover:bg-accent-coral/25"
        @click="emit('start-second-turn')"
      >
        {{ turnSummaryButtonLabel }}
      </button>

      <button
        v-if="phase === 'match-summary'"
        type="button"
        class="border border-accent-coral bg-accent-coral/15 px-4 py-2 text-sm font-display tracking-wide text-text-primary transition hover:bg-accent-coral/25"
        @click="emit('replay-match')"
      >
        Chơi lại
      </button>

      <button
        v-if="phase !== 'setup'"
        type="button"
        class="border border-border-default bg-bg-elevated px-4 py-2 text-sm text-text-secondary transition hover:border-accent-sky hover:text-text-primary"
        @click="emit('return-setup')"
      >
        Về màn hình chuẩn bị
      </button>
    </div>
  </aside>
</template>
