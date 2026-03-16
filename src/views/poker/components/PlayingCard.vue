<script setup lang="ts">
import type { Card } from '../types'
import { rankLabel, suitSymbol, isRedSuit } from '../utils/deck'

withDefaults(
  defineProps<{
    card?: Card | null
    faceDown?: boolean
    small?: boolean
  }>(),
  {
    card: null,
    faceDown: false,
    small: false,
  },
)
</script>

<template>
  <div
    :class="[
      'relative flex flex-col items-center justify-center border font-display font-bold select-none',
      small ? 'w-11 h-16 text-sm' : 'w-16 h-24 text-base',
      faceDown || !card ? 'bg-bg-elevated border-accent-coral/60' : 'bg-white border-gray-300',
    ]"
  >
    <!-- Face Down -->
    <template v-if="faceDown || !card">
      <span :class="['text-accent-coral/30', small ? 'text-xl' : 'text-3xl']">♠</span>
    </template>

    <!-- Face Up -->
    <template v-else>
      <!-- Top-left rank + suit stacked -->
      <div
        :class="[
          'absolute top-1 left-1 leading-none flex flex-col items-center',
          isRedSuit(card.suit) ? 'text-accent-coral' : 'text-neutral-900',
        ]"
      >
        <span :class="small ? 'text-xs font-black' : 'text-sm font-black'">{{
          rankLabel(card.rank)
        }}</span>
        <span :class="small ? 'text-xs' : 'text-xs'">{{ suitSymbol(card.suit) }}</span>
      </div>

      <!-- Center suit symbol -->
      <span
        :class="[
          'font-normal',
          isRedSuit(card.suit) ? 'text-accent-coral' : 'text-neutral-900',
          small ? 'text-2xl' : 'text-3xl',
        ]"
      >
        {{ suitSymbol(card.suit) }}
      </span>

      <!-- Bottom-right (rotated) -->
      <div
        :class="[
          'absolute bottom-1 right-1 leading-none flex flex-col items-center rotate-180',
          isRedSuit(card.suit) ? 'text-accent-coral' : 'text-neutral-900',
        ]"
      >
        <span :class="small ? 'text-xs font-black' : 'text-sm font-black'">{{
          rankLabel(card.rank)
        }}</span>
        <span :class="small ? 'text-xs' : 'text-xs'">{{ suitSymbol(card.suit) }}</span>
      </div>
    </template>
  </div>
</template>
