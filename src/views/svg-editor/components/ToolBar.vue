<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { ToolType, LineCap, LineJoin, GridConfig } from '../types'

interface Tool {
  id: ToolType
  icon: string
  label: string
  shortcut: string
}

const tools: Tool[] = [
  { id: 'select', icon: 'lucide:mouse-pointer-2', label: 'Chọn', shortcut: 'V' },
  { id: 'rect', icon: 'lucide:square', label: 'Hình chữ nhật', shortcut: 'R' },
  { id: 'circle', icon: 'lucide:circle', label: 'Hình tròn', shortcut: 'C' },
  { id: 'ellipse', icon: 'lucide:circle', label: 'Hình elip', shortcut: 'E' },
  { id: 'line', icon: 'lucide:minus', label: 'Đường thẳng', shortcut: 'L' },
  { id: 'path', icon: 'lucide:pen-tool', label: 'Vẽ tự do', shortcut: 'P' },
  { id: 'polygon', icon: 'lucide:hexagon', label: 'Đa giác', shortcut: 'G' },
  { id: 'text', icon: 'lucide:type', label: 'Chữ', shortcut: 'T' },
]

defineExpose({ tools })

defineProps<{
  activeTool: ToolType
  fillColor: string
  strokeColor: string
  strokeWidth: number
  strokeDasharray: string
  lineCap: LineCap
  lineJoin: LineJoin
  grid: GridConfig
}>()

const emit = defineEmits<{
  'update:activeTool': [ToolType]
  'update:fillColor': [string]
  'update:strokeColor': [string]
  'update:strokeWidth': [number]
  'update:strokeDasharray': [string]
  'update:lineCap': [LineCap]
  'update:lineJoin': [LineJoin]
  toggleGrid: []
  toggleSnap: []
}>()

const dashOptions = [
  { label: '—', value: '' },
  { label: '- -', value: '8 4' },
  { label: '· ·', value: '2 4' },
  { label: '-·-', value: '8 4 2 4' },
]
</script>

<template>
  <aside class="w-[52px] border-r border-border-default bg-bg-surface flex flex-col items-center py-2 gap-0.5 shrink-0">
    <button
      v-for="tool in tools" :key="tool.id"
      class="relative group w-10 h-9 flex items-center justify-center border transition-all duration-150"
      :class="activeTool === tool.id
        ? 'border-accent-coral bg-accent-coral/10 text-accent-coral'
        : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-bg-elevated'"
      @click="emit('update:activeTool', tool.id)"
    >
      <Icon :icon="tool.icon" class="size-[18px]" :class="tool.id === 'ellipse' ? 'scale-x-[1.4] scale-y-[0.8]' : ''" />
      
      <!-- Quick Brush Size for Pen -->
      <div v-if="tool.id === 'path' && activeTool === 'path'" class="absolute left-full ml-1 p-2 bg-bg-surface border border-accent-coral shadow-xl z-[60] flex flex-col items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
        <span class="text-[9px] text-accent-coral font-mono font-bold">{{ strokeWidth }}px</span>
        <input 
          :value="strokeWidth" type="range" min="0.5" max="25" step="0.5" 
          class="h-24 [writing-mode:bt-lr] -rotate-180 accent-accent-coral cursor-pointer"
          @input="emit('update:strokeWidth', Number(($event.target as HTMLInputElement).value))"
          @click.stop
        />
      </div>

      <div class="absolute left-full ml-2 top-1/2 -translate-y-1/2 pointer-events-none bg-bg-elevated border border-border-default px-2.5 py-1.5 text-[11px] text-text-primary font-body whitespace-nowrap opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 z-50 flex items-center gap-2">
        {{ tool.label }}
        <span class="text-[9px] text-text-dim bg-bg-deep px-1.5 py-0.5 font-mono border border-border-default">{{ tool.shortcut }}</span>
      </div>
    </button>

    <div class="w-8 h-px bg-border-default my-2" />

    <!-- Grid / Snap -->
    <button
      class="relative group w-10 h-9 flex items-center justify-center border transition-all duration-150"
      :class="grid.enabled ? 'border-accent-coral bg-accent-coral/10 text-accent-coral' : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-bg-elevated'"
      @click="emit('toggleGrid')"
    >
      <Icon icon="lucide:grid-3x3" class="size-[18px]" />
    </button>
    <button
      class="relative group w-10 h-9 flex items-center justify-center border transition-all duration-150"
      :class="grid.snap ? 'border-accent-coral bg-accent-coral/10 text-accent-coral' : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-bg-elevated'"
      @click="emit('toggleSnap')"
    >
      <Icon icon="lucide:magnet" class="size-[18px]" />
    </button>

    <div class="flex-1" />

    <!-- Stroke Width -->
    <div class="flex flex-col items-center gap-1 px-1 mb-2">
      <span class="text-[8px] text-text-dim tracking-wider uppercase font-display">Độ dày</span>
      <input
        :value="strokeWidth" type="number" min="0" max="50" step="0.5"
        class="w-10 bg-bg-elevated border border-border-default text-center text-[10px] text-text-primary py-0.5 font-mono focus:border-accent-coral focus:outline-none"
        @input="emit('update:strokeWidth', Number(($event.target as HTMLInputElement).value))"
      />
    </div>

    <!-- Stroke Dash -->
    <div class="flex flex-col items-center gap-1 px-1 mb-2">
      <span class="text-[8px] text-text-dim tracking-wider uppercase font-display">Nét đứt</span>
      <select
        :value="strokeDasharray"
        class="w-10 bg-bg-elevated border border-border-default text-[10px] text-text-primary py-0.5 font-mono focus:border-accent-coral focus:outline-none cursor-pointer"
        @change="emit('update:strokeDasharray', ($event.target as HTMLSelectElement).value)"
      >
        <option v-for="d in dashOptions" :key="d.value" :value="d.value">{{ d.label }}</option>
      </select>
    </div>

    <!-- Color pickers -->
    <div class="flex flex-col items-center gap-1 mb-1">
      <span class="text-[8px] text-text-dim tracking-wider uppercase font-display">Nền</span>
      <label class="relative w-8 h-8 border-2 border-border-default overflow-hidden cursor-pointer hover:border-text-secondary hover:scale-105 transition-all duration-200" :style="{ backgroundColor: fillColor }">
        <input :value="fillColor" type="color" class="sr-only" @input="emit('update:fillColor', ($event.target as HTMLInputElement).value)" />
      </label>
    </div>
    <div class="flex flex-col items-center gap-1 mb-2">
      <span class="text-[8px] text-text-dim tracking-wider uppercase font-display">Viền</span>
      <label class="relative w-8 h-8 border-2 border-border-default overflow-hidden cursor-pointer hover:border-text-secondary hover:scale-105 transition-all duration-200" :style="{ backgroundColor: strokeColor }">
        <input :value="strokeColor" type="color" class="sr-only" @input="emit('update:strokeColor', ($event.target as HTMLInputElement).value)" />
      </label>
    </div>
  </aside>
</template>
