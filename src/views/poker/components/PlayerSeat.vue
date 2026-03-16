<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import type { Player, GamePhase } from '../types'
import PlayingCard from './PlayingCard.vue'

const props = defineProps<{
  player: Player
  isActive: boolean
  isDealer: boolean
  phase: GamePhase
  isLocalPlayer: boolean
  blindRole?: 'sb' | 'bb' | null
}>()

const statusLabel = computed(() => {
  switch (props.player.status) {
    case 'folded':
      return 'Fold'
    case 'all-in':
      return 'All-in'
    case 'out':
      return 'Out'
    default:
      return null
  }
})

const showCards = computed(() => {
  return props.isLocalPlayer || props.phase === 'showdown'
})

const cardCount = computed(() => {
  if (props.player.status === 'out') return 0
  if (props.player.holeCards.length > 0) return props.player.holeCards.length
  if (props.phase !== 'waiting') return 2
  return 0
})
</script>

<template>
  <div
    :class="[
      'flex flex-col items-center gap-1 transition-all duration-300',
      player.status === 'folded' || player.status === 'out' ? 'opacity-40' : 'opacity-100',
    ]"
  >
    <!-- Cards -->
    <div v-if="phase !== 'waiting' && cardCount > 0" class="flex gap-0.5">
      <template v-if="showCards && player.holeCards.length > 0">
        <PlayingCard
          v-for="(card, i) in player.holeCards"
          :key="i"
          :card="card"
          :small="!isLocalPlayer"
        />
      </template>
      <template v-else>
        <PlayingCard v-for="i in cardCount" :key="i" face-down :small="!isLocalPlayer" />
      </template>
    </div>

    <!-- Seat info -->
    <div
      :class="[
        'flex flex-col items-center gap-0.5 px-3 py-2 border transition-all duration-200',
        isActive
          ? 'border-accent-amber bg-bg-elevated shadow-amber-400/20 shadow-md'
          : 'border-border-default bg-bg-surface',
        isLocalPlayer ? 'min-w-32' : 'min-w-24',
      ]"
    >
      <div class="flex items-center gap-1.5 w-full justify-between">
        <div class="flex items-center gap-1">
          <Icon icon="lucide:user" class="size-3 text-text-dim shrink-0" />
          <span
            :class="[
              'font-body font-medium truncate max-w-20',
              isLocalPlayer ? 'text-text-primary text-sm' : 'text-text-secondary text-xs',
            ]"
          >
            {{ player.name }}
            <span v-if="isLocalPlayer" class="text-accent-sky text-xs"> (bạn)</span>
          </span>
        </div>
        <div class="flex items-center gap-0.5 shrink-0">
          <span
            v-if="isDealer"
            class="text-xs bg-accent-amber text-bg-deep font-display font-bold px-1"
            >D</span
          >
          <span
            v-if="blindRole === 'sb'"
            class="text-xs bg-accent-sky/20 text-accent-sky font-display font-bold px-1"
            >SB</span
          >
          <span
            v-if="blindRole === 'bb'"
            class="text-xs bg-accent-coral/20 text-accent-coral font-display font-bold px-1"
            >BB</span
          >
        </div>
      </div>

      <!-- Chip count -->
      <div class="flex items-center gap-1 w-full">
        <Icon icon="lucide:circle-dollar-sign" class="size-3 text-accent-amber shrink-0" />
        <span class="text-accent-amber font-display text-xs font-bold">
          {{ player.chips.toLocaleString() }}
        </span>
      </div>

      <!-- Current bet -->
      <div v-if="player.roundBet > 0" class="flex items-center gap-1 w-full">
        <Icon icon="lucide:coins" class="size-3 text-accent-sky shrink-0" />
        <span class="text-accent-sky font-display text-xs">
          +{{ player.roundBet.toLocaleString() }}
        </span>
      </div>

      <!-- Status badge -->
      <div
        v-if="statusLabel"
        :class="[
          'text-xs font-display font-bold px-1.5 w-full text-center',
          player.status === 'all-in' ? 'bg-accent-coral/20 text-accent-coral' : 'text-text-dim',
        ]"
      >
        {{ statusLabel }}
      </div>

      <!-- Thinking indicator -->
      <div v-if="isActive && player.isBot && !statusLabel" class="flex gap-0.5 mt-0.5">
        <span
          v-for="i in 3"
          :key="i"
          class="size-1 rounded-full bg-accent-amber animate-pulse"
          :style="{ animationDelay: `${(i - 1) * 200}ms` }"
        />
      </div>
    </div>
  </div>
</template>
