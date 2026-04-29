<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { Country } from '../types'

const props = defineProps<{
  options: Country[]
  selected: string | null
  correct: string
  isAnswered: boolean
}>()

const emit = defineEmits<{
  answer: [code: string]
}>()

function getButtonState(code: string) {
  if (!props.isAnswered) return 'default'
  if (code === props.correct) return 'correct'
  if (code === props.selected) return 'wrong'
  return 'neutral'
}

const stateClasses: Record<string, string> = {
  default:
    'border-border-default bg-bg-surface text-text-primary hover:-translate-y-0.5 hover:border-accent-coral hover:bg-bg-elevated cursor-pointer',
  correct: 'border-green-500 bg-green-500/10 text-green-400 cursor-default',
  wrong: 'border-red-500 bg-red-500/10 text-red-400 cursor-default',
  neutral: 'border-border-default bg-bg-surface text-text-dim cursor-default opacity-50',
}

const stateIcons: Record<string, string> = {
  correct: 'lucide:check-circle',
  wrong: 'lucide:x-circle',
}

function getStateIcon(state: string): string | undefined {
  return stateIcons[state]
}
</script>

<template>
  <div class="grid w-full grid-cols-2 gap-3">
    <button
      v-for="option in options"
      :key="option.code"
      :disabled="isAnswered"
      :class="[
        'border p-3 text-left font-body transition-all duration-200 flex items-center justify-between gap-2',
        stateClasses[getButtonState(option.code)],
      ]"
      @click="emit('answer', option.code)"
    >
      <span class="font-display text-sm font-semibold leading-tight">
        {{ option.nameVi }}
      </span>
      <Icon
        v-if="isAnswered && getStateIcon(getButtonState(option.code))"
        :icon="getStateIcon(getButtonState(option.code))!"
        class="size-4 shrink-0"
      />
    </button>
  </div>
</template>
