<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ref, watch } from 'vue'

import BuaControlPanel from './BuaControlPanel.vue'

const props = defineProps<{
  open: boolean
  brushColor: string
  brushSize: number
  brushOpacity: number
  brushSizeRandomness: number
  brushOpacityRandomness: number
  brushTool: 'draw' | 'erase'
  freeDraw: boolean
  paperTint: string
  frameTint: string
}>()

const emit = defineEmits<{
  'update:brushColor': [value: string]
  'update:brushSize': [value: number]
  'update:brushOpacity': [value: number]
  'update:brushSizeRandomness': [value: number]
  'update:brushOpacityRandomness': [value: number]
  'update:brushTool': [value: 'draw' | 'erase']
  'update:freeDraw': [value: boolean]
  'update:paperTint': [value: string]
  'update:frameTint': [value: string]
  'reset-brush-color': []
  'reset-brush-size': []
  'reset-brush-opacity': []
  'reset-brush-randomness': []
  'reset-paper-tint': []
  'reset-frame-tint': []
}>()

function toNumber(value: string): number {
  const next = Number(value)
  return Number.isFinite(next) ? next : 0
}

const localBrushOpacity = ref(props.brushOpacity)

watch(
  () => props.brushOpacity,
  (next) => {
    localBrushOpacity.value = next
  },
)

function emitBrushOpacity(value: number) {
  const clamped = Math.min(100, Math.max(10, value))
  localBrushOpacity.value = clamped
  emit('update:brushOpacity', clamped)
}
</script>

<template>
  <div
    v-if="props.open"
    class="absolute inset-y-0 left-0 z-40 w-[min(300px,85vw)] overflow-auto pr-2"
  >
    <BuaControlPanel side="left" title="Bút và nền">
      <div class="grid grid-cols-2 gap-2">
        <button
          class="flex items-center justify-center gap-2 border px-3 py-2 text-sm transition hover:border-accent-coral hover:bg-bg-elevated hover:text-text-primary"
          :class="
            props.brushTool === 'draw'
              ? 'border-white bg-white text-black'
              : 'border-border-default text-text-secondary'
          "
          @click="emit('update:brushTool', 'draw')"
        >
          <Icon icon="lucide:pen-tool" class="size-4" />
          Bút
        </button>
        <button
          class="flex items-center justify-center gap-2 border px-3 py-2 text-sm transition hover:border-accent-amber hover:bg-bg-elevated hover:text-text-primary"
          :class="
            props.brushTool === 'erase'
              ? 'border-white bg-white text-black'
              : 'border-border-default text-text-secondary'
          "
          @click="emit('update:brushTool', 'erase')"
        >
          <Icon icon="lucide:eraser" class="size-4" />
          Xóa
        </button>
      </div>

      <p v-if="props.brushTool === 'erase'" class="text-xs text-text-secondary">
        Bút xóa dùng chế độ cắt (không có ngẫu nhiên) để tính toán nhẹ và ổn định hơn.
      </p>

      <label v-if="props.brushTool === 'draw'" class="block">
        <span class="mb-1 block text-xs uppercase tracking-wider text-text-dim">Màu bút loang</span>
        <input
          :value="props.brushColor"
          type="color"
          class="h-10 w-full border border-border-default bg-bg-elevated p-1"
          @input="emit('update:brushColor', ($event.target as HTMLInputElement).value)"
        />
      </label>

      <label class="block">
        <span class="mb-1 block text-xs uppercase tracking-wider text-text-dim"
          >Độ dày nét: {{ props.brushSize }}</span
        >
        <input
          :value="props.brushSize"
          type="range"
          min="1"
          max="24"
          class="w-full accent-[#FF6B4A]"
          @input="emit('update:brushSize', toNumber(($event.target as HTMLInputElement).value))"
        />
      </label>

      <label class="block">
        <span class="mb-1 block text-xs uppercase tracking-wider text-text-dim"
          >Độ đậm bút: {{ localBrushOpacity }}%</span
        >
        <input
          v-model.number="localBrushOpacity"
          type="range"
          min="10"
          max="100"
          step="1"
          class="w-full accent-[#FFB830]"
          @input="emitBrushOpacity(localBrushOpacity)"
          @change="emitBrushOpacity(localBrushOpacity)"
        />
      </label>

      <label v-if="props.brushTool === 'draw'" class="block">
        <span class="mb-1 block text-xs uppercase tracking-wider text-text-dim"
          >Ngẫu nhiên nét to/nhỏ: {{ props.brushSizeRandomness }}%</span
        >
        <input
          :value="props.brushSizeRandomness"
          type="range"
          min="0"
          max="100"
          step="1"
          class="w-full accent-[#FF6B4A]"
          @input="
            emit('update:brushSizeRandomness', toNumber(($event.target as HTMLInputElement).value))
          "
        />
      </label>

      <label v-if="props.brushTool === 'draw'" class="block">
        <span class="mb-1 block text-xs uppercase tracking-wider text-text-dim"
          >Ngẫu nhiên nét đậm/nhạt: {{ props.brushOpacityRandomness }}%</span
        >
        <input
          :value="props.brushOpacityRandomness"
          type="range"
          min="0"
          max="100"
          step="1"
          class="w-full accent-[#FFB830]"
          @input="
            emit(
              'update:brushOpacityRandomness',
              toNumber(($event.target as HTMLInputElement).value),
            )
          "
        />
      </label>

      <label
        class="flex items-center justify-between gap-2 border border-border-default px-3 py-2 text-sm"
      >
        <span>Vẽ tự do (không qua trục)</span>
        <input
          :checked="props.freeDraw"
          type="checkbox"
          class="h-4 w-4 accent-[#FF6B4A]"
          @change="emit('update:freeDraw', ($event.target as HTMLInputElement).checked)"
        />
      </label>

      <button
        v-if="props.brushTool === 'draw'"
        class="w-full border border-border-default px-3 py-2 text-left text-sm text-text-secondary transition hover:border-accent-coral hover:bg-bg-elevated hover:text-text-primary"
        @click="emit('reset-brush-color')"
      >
        Màu đỏ mặc định
      </button>

      <button
        class="w-full border border-border-default px-3 py-2 text-left text-sm text-text-secondary transition hover:border-accent-coral hover:bg-bg-elevated hover:text-text-primary"
        @click="emit('reset-brush-size')"
      >
        Độ dày mặc định
      </button>

      <button
        class="w-full border border-border-default px-3 py-2 text-left text-sm text-text-secondary transition hover:border-accent-coral hover:bg-bg-elevated hover:text-text-primary"
        @click="emit('reset-brush-opacity')"
      >
        Độ đậm mặc định
      </button>

      <button
        v-if="props.brushTool === 'draw'"
        class="w-full border border-border-default px-3 py-2 text-left text-sm text-text-secondary transition hover:border-accent-coral hover:bg-bg-elevated hover:text-text-primary"
        @click="emit('reset-brush-randomness')"
      >
        Độ ngẫu nhiên mặc định
      </button>

      <label class="block">
        <span class="mb-1 block text-xs uppercase tracking-wider text-text-dim">Màu nền bùa</span>
        <input
          :value="props.paperTint"
          type="color"
          class="h-10 w-full border border-border-default bg-bg-elevated p-1"
          @input="emit('update:paperTint', ($event.target as HTMLInputElement).value)"
        />
      </label>

      <button
        class="w-full border border-border-default px-3 py-2 text-left text-sm text-text-secondary transition hover:border-accent-coral hover:bg-bg-elevated hover:text-text-primary"
        @click="emit('reset-paper-tint')"
      >
        Trả nền bùa mặc định
      </button>

      <label class="block">
        <span class="mb-1 block text-xs uppercase tracking-wider text-text-dim">Màu viền bùa</span>
        <input
          :value="props.frameTint"
          type="color"
          class="h-10 w-full border border-border-default bg-bg-elevated p-1"
          @input="emit('update:frameTint', ($event.target as HTMLInputElement).value)"
        />
      </label>

      <button
        class="w-full border border-border-default px-3 py-2 text-left text-sm text-text-secondary transition hover:border-accent-coral hover:bg-bg-elevated hover:text-text-primary"
        @click="emit('reset-frame-tint')"
      >
        Trả viền bùa mặc định
      </button>
    </BuaControlPanel>
  </div>
</template>
