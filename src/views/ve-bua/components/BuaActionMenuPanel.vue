<script setup lang="ts">
import BuaControlPanel from './BuaControlPanel.vue'
import type { DrawingStats } from '../types/drawing'

const props = defineProps<{
  open: boolean
  designName: string
  infoText: string
  drawingStats: DrawingStats | null
}>()

const emit = defineEmits<{
  'update:designName': [value: string]
  'save-design': []
  'open-credits': []
  'reset-paper-transform': []
  'clear-drawing': []
  'undo-drawing': []
}>()
</script>

<template>
  <div
    v-if="props.open"
    class="absolute inset-y-0 right-0 z-40 w-[min(320px,85vw)] overflow-auto pl-2"
  >
    <BuaControlPanel side="right" title="Mã bùa và thao tác">
      <label class="block">
        <span class="mb-1 block text-xs uppercase tracking-wider text-text-dim"
          >Tên thiết kế để lưu</span
        >
        <input
          :value="props.designName"
          type="text"
          class="w-full border border-border-default bg-bg-elevated px-3 py-2 text-sm"
          placeholder="Ví dụ: Bùa hộ thể cá nhân"
          @input="emit('update:designName', ($event.target as HTMLInputElement).value)"
        />
      </label>

      <button
        class="w-full border border-accent-amber bg-accent-amber/15 px-3 py-2 text-left text-sm text-accent-amber transition hover:bg-accent-amber/25"
        @click="emit('save-design')"
      >
        Lưu vào bộ sưu tập
      </button>

      <div
        v-if="props.drawingStats"
        class="border border-border-default bg-bg-elevated px-3 py-2 text-xs text-text-dim"
      >
        <p class="uppercase tracking-wider text-text-dim">// Thông số</p>
        <p class="mt-1">
          Vùng vẽ: {{ Math.round(props.drawingStats.canvasWidth) }}×{{
            Math.round(props.drawingStats.canvasHeight)
          }}px
        </p>
        <p>Nét: {{ props.drawingStats.strokeCount }} · Điểm: {{ props.drawingStats.pointCount }}</p>
      </div>

      <button
        class="w-full border border-border-default px-3 py-2 text-left text-sm text-text-secondary transition hover:border-accent-amber hover:bg-bg-elevated hover:text-text-primary"
        @click="emit('open-credits')"
      >
        Credit
      </button>

      <button
        class="w-full border border-border-default px-3 py-2 text-left text-sm text-text-secondary transition hover:border-accent-sky hover:bg-bg-elevated hover:text-text-primary"
        @click="emit('reset-paper-transform')"
      >
        Reset vị trí lá bùa
      </button>

      <button
        class="w-full border border-border-default px-3 py-2 text-left text-sm text-text-secondary transition hover:border-accent-sky hover:bg-bg-elevated hover:text-text-primary"
        @click="emit('clear-drawing')"
      >
        Dọn nét vẽ
      </button>

      <button
        class="w-full border border-border-default px-3 py-2 text-left text-sm text-text-secondary transition hover:border-accent-amber hover:bg-bg-elevated hover:text-text-primary"
        @click="emit('undo-drawing')"
      >
        Hoàn tác (Ctrl+Z)
      </button>

      <p
        v-if="props.infoText"
        class="border border-border-default px-3 py-2 text-xs text-text-secondary"
      >
        {{ props.infoText }}
      </p>
    </BuaControlPanel>
  </div>
</template>
