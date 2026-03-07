<script setup lang="ts">
import BaseModal from './BaseModal.vue'
import type { GameMode, GridSize } from '../types'

interface Props {
  open: boolean
  pendingMode: GameMode
  pendingSize: GridSize
  pendingDifficulty: number
  sizeOptions: readonly GridSize[]
  difficultyOptions: number[]
}

defineProps<Props>()

const emit = defineEmits<{
  close: []
  apply: []
  'update:pendingMode': [value: GameMode]
  'update:pendingSize': [value: GridSize]
  'update:pendingDifficulty': [value: number]
}>()

function onModeChange(value: string): void {
  emit('update:pendingMode', value as GameMode)
}

function onSizeChange(value: string): void {
  emit('update:pendingSize', Number(value) as GridSize)
}

function onDifficultyChange(value: string): void {
  emit('update:pendingDifficulty', Number(value))
}
</script>

<template>
  <BaseModal :open="open" title="T?o ván m?i" max-width-class="max-w-xl" @close="$emit('close')">
    <div class="grid gap-4">
      <label class="grid gap-1 text-sm">
        <span class="text-text-secondary">Ch? d?</span>
        <select class="border border-border-default bg-bg-deep px-3 py-2" :value="pendingMode" @change="onModeChange(($event.target as HTMLSelectElement).value)">
          <option value="classic">Classic</option>
          <option value="timed">Timed</option>
          <option value="story">Story (20x20, t? level 1)</option>
        </select>
      </label>

      <label class="grid gap-1 text-sm" :class="pendingMode === 'story' ? 'opacity-50' : ''">
        <span class="text-text-secondary">Kích thu?c bàn</span>
        <select
          class="border border-border-default bg-bg-deep px-3 py-2"
          :value="pendingMode === 'story' ? 20 : pendingSize"
          :disabled="pendingMode === 'story'"
          @change="onSizeChange(($event.target as HTMLSelectElement).value)"
        >
          <option v-for="size in sizeOptions" :key="size" :value="size">{{ size }} x {{ size }}</option>
        </select>
      </label>

      <label class="grid gap-1 text-sm">
        <span class="text-text-secondary">Ð? khó</span>
        <select class="border border-border-default bg-bg-deep px-3 py-2" :value="pendingDifficulty" @change="onDifficultyChange(($event.target as HTMLSelectElement).value)">
          <option v-for="item in difficultyOptions" :key="item" :value="item">Level {{ item }}</option>
        </select>
      </label>

      <button type="button" class="mt-1 border border-accent-coral bg-bg-deep px-3 py-2 font-display text-sm transition hover:bg-bg-elevated" @click="$emit('apply')">
        B?t d?u
      </button>
    </div>
  </BaseModal>
</template>

