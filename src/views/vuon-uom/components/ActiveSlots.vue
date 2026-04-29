<script setup lang="ts">
import type { SlotCard, Card } from '../types'
import CardItem from './CardItem.vue'
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { UI_LUCIDE } from '../constants/icons'

const props = defineProps<{
  slots: (SlotCard | null)[]
  canAdd?: boolean
  pendingCards?: Card[]
  playedThisTurnIds?: Set<number>
}>()

const emit = defineEmits<{
  deactivate: [index: number]
  remove: [index: number]
  add: []
  inspect: [card: import('../types').Card]
}>()

// Map pending cards to empty slot positions
const ghostSlots = computed(() => {
  const pending = props.pendingCards ?? []
  const result: (Card | null)[] = props.slots.map(() => null)
  let pi = 0
  for (let i = 0; i < props.slots.length && pi < pending.length; i++) {
    if (props.slots[i] === null) {
      result[i] = pending[pi++] ?? null
    }
  }
  return result
})
</script>

<template>
  <div class="grid grid-cols-3 gap-2">
    <div
      v-for="(slot, i) in slots"
      :key="i"
      class="slot-cell"
      :style="{ animationDelay: `${i * 60}ms` }"
    >
      <!-- Filled slot -->
      <CardItem
        v-if="slot"
        :card="slot.card"
        mode="slot"
        :deactivated="slot.deactivated"
        :pending="playedThisTurnIds?.has(slot.card.id)"
        @pause="emit('deactivate', i)"
        @remove="emit('remove', i)"
        @inspect="emit('inspect', slot.card)"
      />

      <!-- Ghost preview -->
      <CardItem v-else-if="ghostSlots[i]" :card="ghostSlots[i]!" mode="slot" :ghost="true" />

      <!-- Empty slot: + Add -->
      <button
        v-else-if="canAdd"
        class="w-full aspect-[9/14] rounded-lg border border-dashed border-border-default/40 bg-bg-surface/20 flex items-center justify-center transition-all touch-manipulation cursor-pointer active:scale-90 hover:border-text-dim/50 hover:bg-bg-surface/30 empty-slot"
        @click="emit('add')"
      >
        <Icon :icon="UI_LUCIDE.add" class="w-5 h-5 text-text-dim/40 add-icon" />
      </button>

      <!-- Empty slot: no interaction -->
      <div
        v-else
        class="w-full aspect-[9/14] rounded-lg border border-dashed border-border-default/20 empty-slot-idle"
      />
    </div>
  </div>
</template>

<style scoped>
/* Staggered slot entrance */
.slot-cell {
  animation: slot-rise 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;
}
@keyframes slot-rise {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Empty slot subtle pulse */
.empty-slot {
  animation: slot-breathe 3s ease-in-out infinite;
}
@keyframes slot-breathe {
  0%,
  100% {
    border-color: rgba(255, 255, 255, 0.08);
  }
  50% {
    border-color: rgba(255, 255, 255, 0.15);
  }
}

/* Plus icon pulse */
.add-icon {
  animation: icon-pulse 2s ease-in-out infinite;
}
@keyframes icon-pulse {
  0%,
  100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.1);
  }
}

/* Idle empty slots very subtle shift */
.empty-slot-idle {
  animation: idle-fade 4s ease-in-out infinite;
}
@keyframes idle-fade {
  0%,
  100% {
    opacity: 0.4;
  }
  50% {
    opacity: 0.6;
  }
}
</style>
