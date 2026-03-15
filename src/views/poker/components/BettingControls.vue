<script setup lang="ts">
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'
import type { Player, GameState, PlayerAction } from '../types'

const props = defineProps<{
  player: Player
  state: GameState
  timerSecondsLeft?: number
  showTimer?: boolean
}>()

const emit = defineEmits<{
  action: [action: PlayerAction]
}>()

const raiseSliderValue = ref(0)

const callAmount = computed(() => Math.max(0, props.state.currentBet - props.player.roundBet))
const canCheck = computed(() => callAmount.value === 0)
const canCall = computed(() => callAmount.value > 0 && callAmount.value < props.player.chips)
const minRaise = computed(() => props.state.currentBet + props.state.bigBlind)
const maxRaise = computed(() => props.player.chips + props.player.roundBet)
const canRaise = computed(
  () => props.player.chips > callAmount.value && maxRaise.value > minRaise.value,
)
const isAllIn = computed(() => callAmount.value >= props.player.chips)

const raiseAmount = computed(() => {
  const min = minRaise.value
  const max = maxRaise.value
  if (raiseSliderValue.value === 0) return min
  return Math.min(max, Math.round(min + (raiseSliderValue.value / 100) * (max - min)))
})

function onFold() {
  emit('action', { type: 'fold' })
}
function onCheck() {
  emit('action', { type: 'check' })
}

function onCall() {
  emit('action', isAllIn.value ? { type: 'all-in' } : { type: 'call' })
}

function onRaise() {
  const target = raiseAmount.value
  emit('action', target >= maxRaise.value ? { type: 'all-in' } : { type: 'raise', amount: target })
}

function onAllIn() {
  emit('action', { type: 'all-in' })
}

function quickRaise(factor: number) {
  const target = Math.min(
    props.player.chips + props.player.roundBet,
    Math.max(minRaise.value, Math.round(props.state.pot * factor + props.state.currentBet)),
  )
  raiseSliderValue.value = ((target - minRaise.value) / (maxRaise.value - minRaise.value)) * 100
}
</script>

<template>
  <div class="bg-bg-surface border-t border-border-default px-3 py-2.5 space-y-2">
    <!-- Timer + turn indicator -->
    <div
      v-if="showTimer && timerSecondsLeft !== undefined"
      class="flex items-center justify-between"
    >
      <span class="text-text-dim text-xs font-body">Lượt của bạn</span>
      <span
        :class="[
          'font-display font-bold text-sm',
          timerSecondsLeft <= 5 ? 'text-red-400' : 'text-accent-amber',
        ]"
      >
        {{ timerSecondsLeft }}s
      </span>
    </div>

    <!-- Raise controls -->
    <div v-if="canRaise" class="space-y-1.5">
      <div class="flex items-center gap-2">
        <input
          v-model="raiseSliderValue"
          type="range"
          min="0"
          max="100"
          class="flex-1 accent-[#FF6B4A] h-1.5 cursor-pointer"
        />
        <span class="text-accent-coral font-display text-sm font-bold min-w-16 text-right">
          {{ raiseAmount.toLocaleString() }}
        </span>
      </div>
      <div class="flex gap-1">
        <button
          v-for="opt in [
            { f: 0.33, label: '⅓ Pot' },
            { f: 0.5, label: '½ Pot' },
            { f: 0.75, label: '¾ Pot' },
            { f: 1, label: 'Pot' },
          ]"
          :key="opt.f"
          class="flex-1 text-xs py-1 border border-border-default bg-bg-elevated text-text-secondary font-display hover:border-accent-coral/60 hover:text-accent-coral transition-colors"
          @click="quickRaise(opt.f)"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>

    <!-- Action buttons -->
    <div class="flex gap-1.5">
      <!-- Fold -->
      <button
        class="flex-1 flex items-center justify-center gap-1 py-2.5 border border-border-default bg-bg-elevated text-text-secondary font-display font-semibold text-sm hover:border-red-500/60 hover:text-red-400 transition-colors active:scale-95"
        @click="onFold"
      >
        <Icon icon="lucide:x" class="size-4" />
        Fold
      </button>

      <!-- Check -->
      <button
        v-if="canCheck"
        class="flex-1 flex items-center justify-center gap-1 py-2.5 border border-accent-sky/40 bg-accent-sky/10 text-accent-sky font-display font-semibold text-sm hover:border-accent-sky hover:bg-accent-sky/20 transition-colors active:scale-95"
        @click="onCheck"
      >
        <Icon icon="lucide:check" class="size-4" />
        Check
      </button>

      <!-- Call -->
      <button
        v-if="canCall"
        class="flex-1 flex items-center justify-center gap-1 py-2.5 border border-accent-amber/50 bg-accent-amber/10 text-accent-amber font-display font-semibold text-sm hover:border-accent-amber hover:bg-accent-amber/20 transition-colors active:scale-95"
        @click="onCall"
      >
        <Icon icon="lucide:circle-dollar-sign" class="size-4" />
        Call {{ callAmount.toLocaleString() }}
      </button>

      <!-- All-in (when must call more than chips) -->
      <button
        v-if="isAllIn && !canCheck"
        class="flex-1 flex items-center justify-center gap-1 py-2.5 border border-accent-coral bg-accent-coral/20 text-accent-coral font-display font-bold text-sm hover:bg-accent-coral/30 transition-colors active:scale-95"
        @click="onCall"
      >
        <Icon icon="lucide:zap" class="size-4" />
        All-in {{ player.chips.toLocaleString() }}
      </button>

      <!-- Raise -->
      <button
        v-if="canRaise"
        class="flex-1 flex items-center justify-center gap-1 py-2.5 border border-accent-coral bg-accent-coral/20 text-accent-coral font-display font-bold text-sm hover:bg-accent-coral/30 transition-colors active:scale-95"
        @click="onRaise"
      >
        <Icon icon="lucide:trending-up" class="size-4" />
        Raise
      </button>

      <!-- All-in standalone -->
      <button
        v-if="canRaise"
        class="py-2.5 px-2.5 border border-accent-coral/40 text-accent-coral/70 font-display text-xs hover:border-accent-coral hover:text-accent-coral transition-colors active:scale-95"
        title="All-in"
        @click="onAllIn"
      >
        <Icon icon="lucide:zap" class="size-4" />
      </button>
    </div>
  </div>
</template>
