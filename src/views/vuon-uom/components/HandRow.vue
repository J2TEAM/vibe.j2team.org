<script setup lang="ts">
import type { Card } from '../types'
import CardItem from './CardItem.vue'
import { useI18n } from '../composables/useI18n'
import { Icon } from '@iconify/vue'
import { RESOURCE_LUCIDE } from '../constants/icons'

const props = defineProps<{
  hand: Card[]
  selectedIds: Set<number>
  budget: number
  energy: number
}>()

const emit = defineEmits<{
  toggle: [cardId: number]
  confirm: []
  extraCard: []
  discount: [cardId: number]
}>()

const { locale } = useI18n()

function isAffordable(card: Card): boolean {
  return props.budget >= card.costBudget && props.energy >= card.costEnergy
}
</script>

<template>
  <div class="px-4 py-3 border-t border-border-default max-w-4xl mx-auto w-full">
    <div class="flex items-center justify-between mb-2">
      <span class="text-xs text-text-dim uppercase tracking-widest">
        {{ locale === 'vi' ? '— bài trên tay —' : '— hand this turn —' }}
      </span>
      <span class="text-xs text-text-secondary">
        {{ selectedIds.size }}/2
        {{ locale === 'vi' ? 'đã chọn' : 'selected' }}
      </span>
    </div>

    <!-- Card hand: fixed height, horizontal scroll -->
    <div class="flex gap-2 overflow-x-auto pb-1 mb-3 h-36 scrollbar-none">
      <div v-for="card in hand" :key="card.id" class="shrink-0 w-24 h-full">
        <CardItem
          :card="card"
          mode="hand"
          :selected="selectedIds.has(card.id)"
          :affordable="isAffordable(card)"
          @click="emit('toggle', card.id)"
        />
      </div>
    </div>

    <!-- Actions row -->
    <div class="flex items-center gap-2 flex-wrap">
      <!-- ⚡ actions -->
      <button
        class="text-xs border border-border-default px-3 py-2.5 min-h-[44px] text-text-secondary hover:border-accent-sky hover:text-accent-sky transition-colors disabled:opacity-40 touch-manipulation"
        :disabled="energy < 3"
        @click="emit('extraCard')"
      >
        3<Icon :icon="RESOURCE_LUCIDE.energy" class="w-3 h-3 inline" /> → +1
        {{ locale === 'vi' ? 'bài' : 'card' }}
      </button>

      <!-- Confirm button -->
      <button
        class="ml-auto text-sm border px-5 py-2.5 min-h-[44px] font-semibold transition-colors touch-manipulation"
        :class="
          selectedIds.size > 0
            ? 'border-accent-coral text-accent-coral hover:bg-accent-coral hover:text-bg-deep'
            : 'border-border-default text-text-dim cursor-not-allowed'
        "
        :disabled="selectedIds.size === 0"
        @click="emit('confirm')"
      >
        {{ locale === 'vi' ? 'Xác nhận →' : 'Confirm →' }}
      </button>
    </div>
  </div>
</template>
