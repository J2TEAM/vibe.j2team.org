<script setup lang="ts">
import type { GameResult, Character } from '../types'

const props = defineProps<{
  result: GameResult
  characters: Character[]
}>()

const emit = defineEmits<{ rematch: []; quitMatch: [] }>()

const winner = props.characters.find((c) => c.id === props.result.winnerId)
const loser = props.characters.find((c) => c.id !== props.result.winnerId)
</script>

<template>
  <div class="fixed inset-0 bg-bg-deep/90 flex items-center justify-center z-50 p-4">
    <div
      class="border border-border-default bg-bg-surface max-w-sm w-full flex flex-col items-center gap-6 p-8 animate-fade-up"
    >
      <!-- Title -->
      <div class="flex flex-col items-center gap-2">
        <span class="font-display text-xs tracking-widest text-accent-coral"
          >// KẾT QUẢ TRẬN ĐẤU</span
        >
        <h2 class="font-display text-4xl font-bold text-text-primary text-center">
          {{ result.winnerId === null ? 'HÒA TRẬN' : 'CHIẾN THẮNG!' }}
        </h2>
      </div>

      <!-- Winner display -->
      <div
        v-if="winner"
        class="flex flex-col items-center gap-2 border border-accent-amber px-8 py-4 bg-bg-elevated w-full"
      >
        <span class="w-8 h-8 inline-block" :style="{ backgroundColor: winner.color }" />
        <span class="font-display text-2xl font-bold" :style="{ color: winner.color }">{{
          winner.name
        }}</span>
        <span class="text-sm text-text-secondary">🏆 Người chiến thắng</span>
        <span class="text-xs text-text-dim tabular-nums">
          Còn lại {{ winner.hp }} HP / {{ winner.maxHp }}
        </span>
      </div>

      <div v-else class="text-text-secondary text-center">Cả hai đều ngã xuống cùng lúc!</div>

      <!-- Stats -->
      <div class="flex flex-col gap-1 w-full text-sm text-text-secondary">
        <div class="flex justify-between">
          <span>Số lượt đấu</span>
          <span class="font-display tabular-nums text-text-primary">{{ result.turns }}</span>
        </div>
        <div v-if="loser" class="flex justify-between">
          <span>{{ loser.name }}</span>
          <span class="font-display text-accent-coral tabular-nums">THUA</span>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex flex-col w-full gap-2">
        <button
          class="w-full border-2 border-accent-coral bg-accent-coral/10 py-2.5 font-display text-base tracking-widest text-accent-coral transition-all hover:bg-accent-coral hover:text-bg-deep cursor-pointer"
          @click="emit('rematch')"
        >
          CHƠI LẠI
        </button>
        <button
          class="w-full border border-border-default py-2.5 font-display text-sm tracking-widest text-text-secondary text-center transition-all hover:border-accent-coral hover:text-text-primary cursor-pointer"
          @click="emit('quitMatch')"
        >
          ← Thoát trận
        </button>
      </div>
    </div>
  </div>
</template>
