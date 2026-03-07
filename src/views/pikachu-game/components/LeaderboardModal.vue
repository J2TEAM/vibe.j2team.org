<script setup lang="ts">
import BaseModal from './BaseModal.vue'
import type { LeaderboardStep, RecordItem } from '../types'

interface Props {
  open: boolean
  step: LeaderboardStep
  selectedDifficulty: number
  difficultyOptions: number[]
  classicBoard: RecordItem[]
  timedBoard: RecordItem[]
}

defineProps<Props>()

defineEmits<{
  close: []
  'update:step': [value: LeaderboardStep]
  'update:selectedDifficulty': [value: number]
}>()

function toLocalTime(iso: string): string {
  const date = new Date(iso)
  return `${date.toLocaleDateString('vi-VN')} ${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
}
</script>

<template>
  <BaseModal :open="open" title="K? l?c" max-width-class="max-w-3xl" @close="$emit('close')">
    <div v-if="step === 'pick'" class="grid gap-3">
      <p class="text-sm text-text-secondary">Ch?n level d? xem b?ng x?p h?ng.</p>
      <select
        class="border border-border-default bg-bg-deep px-3 py-2"
        :value="selectedDifficulty"
        @change="$emit('update:selectedDifficulty', Number(($event.target as HTMLSelectElement).value))"
      >
        <option v-for="item in difficultyOptions" :key="item" :value="item">Level {{ item }}</option>
      </select>
      <button type="button" class="border border-accent-coral bg-bg-deep px-3 py-2 font-display text-sm transition hover:bg-bg-elevated" @click="$emit('update:step', 'view')">
        Xem b?ng x?p h?ng
      </button>
    </div>

    <div v-else class="grid gap-4">
      <button type="button" class="justify-self-start border border-border-default bg-bg-deep px-3 py-2 text-sm transition hover:border-accent-amber" @click="$emit('update:step', 'pick')">
        ? Ch?n level khác
      </button>

      <div class="grid gap-4 lg:grid-cols-2">
        <section class="border border-border-default bg-bg-deep p-3">
          <h3 class="mb-2 font-display text-sm text-accent-coral">Classic</h3>
          <p v-if="classicBoard.length === 0" class="text-xs text-text-secondary">Chua có d? li?u.</p>
          <ul v-else class="grid gap-1.5 text-xs">
            <li v-for="(item, index) in classicBoard" :key="`${item.name}-${index}-c`" class="grid grid-cols-[28px_1fr_auto_auto] items-center gap-2 border border-border-default/40 px-2 py-1">
              <span class="font-display text-accent-amber">#{{ index + 1 }}</span>
              <span class="truncate">{{ item.name }}</span>
              <span class="font-display text-accent-coral">{{ item.score }}</span>
              <span class="text-text-secondary">{{ toLocalTime(item.createdAt) }}</span>
            </li>
          </ul>
        </section>

        <section class="border border-border-default bg-bg-deep p-3">
          <h3 class="mb-2 font-display text-sm text-accent-sky">Timed</h3>
          <p v-if="timedBoard.length === 0" class="text-xs text-text-secondary">Chua có d? li?u.</p>
          <ul v-else class="grid gap-1.5 text-xs">
            <li v-for="(item, index) in timedBoard" :key="`${item.name}-${index}-t`" class="grid grid-cols-[28px_1fr_auto_auto] items-center gap-2 border border-border-default/40 px-2 py-1">
              <span class="font-display text-accent-amber">#{{ index + 1 }}</span>
              <span class="truncate">{{ item.name }}</span>
              <span class="font-display text-accent-coral">{{ item.score }}</span>
              <span class="text-text-secondary">{{ item.timeSpent }}s</span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  </BaseModal>
</template>

