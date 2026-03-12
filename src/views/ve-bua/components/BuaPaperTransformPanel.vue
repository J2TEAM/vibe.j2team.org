<script setup lang="ts">
import type { PaperTransform } from '../types/payloads'

const props = defineProps<{
  open: boolean
  paperTransform: PaperTransform
}>()

const emit = defineEmits<{
  'update:paper-transform': [value: PaperTransform]
  'reset-paper-transform': []
}>()

function toNumber(value: string): number {
  const next = Number(value)
  return Number.isFinite(next) ? next : 0
}

function clampScale(value: number): number {
  return Math.min(3, Math.max(0.01, value))
}

function updateScale(scale: number) {
  emit('update:paper-transform', { ...props.paperTransform, scale: clampScale(scale) })
}
</script>

<template>
  <div
    v-if="props.open"
    class="pointer-events-auto w-[320px] border border-border-default bg-bg-surface p-3"
  >
    <p class="text-xs uppercase tracking-wider text-text-dim">// Thu phóng</p>
    <p class="mt-1 text-xs leading-relaxed text-text-secondary">
      Kéo để di chuyển. Chụm hai ngón để phóng/thu.
    </p>

    <div class="mt-3 space-y-2">
      <label class="block">
        <span class="mb-1 block text-xs uppercase tracking-wider text-text-dim"
          >Tỉ lệ: {{ Math.round(props.paperTransform.scale * 100) }}%</span
        >
        <input
          :value="Math.round(props.paperTransform.scale * 100)"
          type="range"
          min="1"
          max="300"
          step="1"
          class="w-full accent-[#FF6B4A]"
          @input="updateScale(toNumber(($event.target as HTMLInputElement).value) / 100)"
        />
      </label>

      <div class="grid grid-cols-2 gap-2">
        <button
          class="border border-border-default px-3 py-2 text-left text-sm text-text-secondary transition hover:border-accent-coral hover:bg-bg-elevated hover:text-text-primary"
          @click="updateScale(props.paperTransform.scale - 0.1)"
        >
          Thu nhỏ
        </button>
        <button
          class="border border-border-default px-3 py-2 text-left text-sm text-text-secondary transition hover:border-accent-amber hover:bg-bg-elevated hover:text-text-primary"
          @click="updateScale(props.paperTransform.scale + 0.1)"
        >
          Phóng to
        </button>
      </div>

      <button
        class="w-full border border-border-default px-3 py-2 text-left text-sm text-text-secondary transition hover:border-accent-sky hover:bg-bg-elevated hover:text-text-primary"
        @click="emit('reset-paper-transform')"
      >
        Reset vị trí & tỉ lệ
      </button>
    </div>
  </div>
</template>
