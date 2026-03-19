<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { Pattern } from '../types'

const props = defineProps<{
  patterns: Pattern[]
  bpm: number
}>()

const emit = defineEmits<{
  (e: 'import', patterns: Pattern[], bpm: number): void
}>()

const serialize = () => JSON.stringify({ bpm: props.bpm, patterns: props.patterns }, null, 2)

const downloadJson = () => {
  const blob = new Blob([serialize()], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `beat-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

const importFile = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    try {
      const data = JSON.parse(ev.target?.result as string)
      emit('import', data.patterns, data.bpm)
    } catch {
      alert('File JSON không hợp lệ')
    }
  }
  reader.readAsText(file)
}
</script>

<template>
  <div class="p-6 space-y-6 max-w-lg">
    <h3 class="font-display text-sm uppercase tracking-widest">
      <span class="text-accent-coral">//</span> Export & Import
    </h3>

    <!-- Save/Load JSON -->
    <div class="space-y-3">
      <div class="text-[10px] font-display uppercase tracking-widest text-text-secondary">
        File JSON
      </div>
      <div class="flex gap-3 flex-wrap">
        <button
          @click="downloadJson"
          class="flex items-center gap-2 px-4 py-2.5 bg-accent-coral text-white font-display text-sm uppercase tracking-wider transition-all hover:scale-105 active:scale-95"
        >
          <Icon icon="lucide:download" class="size-4" />
          Lưu Beat
        </button>
        <label
          class="flex items-center gap-2 px-4 py-2.5 bg-bg-elevated text-text-primary font-display text-sm uppercase tracking-wider cursor-pointer hover:bg-bg-surface transition-colors border border-border-default"
        >
          <Icon icon="lucide:upload" class="size-4" />
          Nhập File
          <input type="file" accept=".json" class="hidden" @change="importFile" />
        </label>
      </div>
    </div>

    <!-- Beat info summary -->
    <div class="p-4 bg-bg-surface border border-border-default">
      <div class="text-[9px] font-display uppercase tracking-widest text-text-secondary mb-3">
        Thông Tin Beat
      </div>
      <div class="grid grid-cols-2 gap-2 text-xs font-display">
        <div class="text-text-secondary">Patterns</div>
        <div class="text-text-primary">{{ patterns.length }}</div>
        <div class="text-text-secondary">BPM</div>
        <div class="text-accent-amber">{{ bpm }}</div>
        <div class="text-text-secondary">Tổng tracks</div>
        <div class="text-text-primary">{{ patterns.reduce((s, p) => s + p.tracks.length, 0) }}</div>
      </div>
    </div>
  </div>
</template>
