<script setup lang="ts">
import type { CalculatorMode } from '../types'

const emit = defineEmits<{ select: [mode: CalculatorMode] }>()

const modes: {
  id: CalculatorMode
  label: string
  labelVi: string
  icon: string
  ready: boolean
}[] = [
  { id: 'calculate', label: 'Calculate', labelVi: 'Tính toán', icon: '∑', ready: true },
  { id: 'statistics', label: 'Statistics', labelVi: 'Thống kê', icon: 'σ', ready: false },
  { id: 'distribution', label: 'Distribution', labelVi: 'Phân phối', icon: '∿', ready: false },
  { id: 'spreadsheet', label: 'Spreadsheet', labelVi: 'Bảng tính', icon: '⊞', ready: false },
  { id: 'table', label: 'Table', labelVi: 'Bảng giá trị', icon: '≡', ready: false },
  { id: 'equation', label: 'Equation', labelVi: 'Phương trình', icon: '⇌', ready: false },
]
</script>

<template>
  <div class="p-5">
    <div class="text-center mb-6">
      <p class="font-display text-xs tracking-[0.3em] text-accent-coral mb-1">//</p>
      <h2 class="font-display text-xl font-bold text-text-primary">Máy Tính Khoa Học</h2>
    </div>
    <div class="grid grid-cols-3 gap-3">
      <button
        v-for="m in modes"
        :key="m.id"
        :disabled="!m.ready"
        class="flex flex-col items-center gap-1.5 py-5 px-2 border transition-all touch-manipulation"
        :class="
          m.ready
            ? 'border-border-default bg-bg-surface hover:border-accent-sky cursor-pointer active:scale-95'
            : 'border-border-default/20 bg-bg-deep/30 cursor-not-allowed opacity-30'
        "
        @click="m.ready && emit('select', m.id)"
      >
        <span
          class="text-2xl font-display leading-none"
          :class="m.ready ? 'text-accent-sky' : 'text-text-dim'"
          >{{ m.icon }}</span
        >
        <span class="text-[11px] font-display font-bold text-text-primary">{{ m.label }}</span>
        <span class="text-[9px] text-text-dim">{{ m.labelVi }}</span>
      </button>
    </div>
  </div>
</template>
