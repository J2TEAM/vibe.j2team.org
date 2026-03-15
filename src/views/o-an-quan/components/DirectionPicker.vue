<script setup lang="ts">
/**
 * DirectionPicker — Popup chọn hướng rải quân (trái/phải)
 * Hiển thị khi người chơi click vào 1 ô dân
 */
import { Icon } from '@iconify/vue'
import type { Direction, CellIndex } from '../composables/useOAnQuan'

defineProps<{
  cellIndex: CellIndex
  stones: number
}>()

const emit = defineEmits<{
  (e: 'select-direction', direction: Direction): void
  (e: 'cancel'): void
}>()
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-bg-deep/80 backdrop-blur-sm"
    @click.self="emit('cancel')"
  >
    <div
      class="border-2 border-accent-coral bg-bg-surface p-6 sm:p-8 max-w-sm w-full mx-4 animate-fade-up"
    >
      <!-- Tiêu đề -->
      <h3 class="font-display text-xl font-bold text-text-primary text-center mb-2">
        Chọn hướng đi
      </h3>
      <p class="text-text-secondary text-sm text-center mb-6">
        Ô {{ cellIndex }} — <span class="text-accent-coral font-bold">{{ stones }}</span> quân
      </p>

      <!-- 2 nút chọn hướng -->
      <div class="grid grid-cols-2 gap-4 mb-4">
        <!-- Sang trái -->
        <button
          class="border-2 border-border-default bg-bg-elevated p-5 flex flex-col items-center gap-3 transition-all duration-300 cursor-pointer hover:border-accent-amber hover:bg-accent-amber/10 hover:-translate-y-1 group"
          @click="emit('select-direction', 'left')"
        >
          <Icon
            icon="lucide:arrow-left"
            class="w-8 h-8 text-text-secondary group-hover:text-accent-amber transition-colors"
          />
          <span
            class="font-display font-bold text-sm text-text-secondary group-hover:text-accent-amber transition-colors"
          >
            SANG TRÁI
          </span>
        </button>

        <!-- Sang phải -->
        <button
          class="border-2 border-border-default bg-bg-elevated p-5 flex flex-col items-center gap-3 transition-all duration-300 cursor-pointer hover:border-accent-coral hover:bg-accent-coral/10 hover:-translate-y-1 group"
          @click="emit('select-direction', 'right')"
        >
          <Icon
            icon="lucide:arrow-right"
            class="w-8 h-8 text-text-secondary group-hover:text-accent-coral transition-colors"
          />
          <span
            class="font-display font-bold text-sm text-text-secondary group-hover:text-accent-coral transition-colors"
          >
            SANG PHẢI
          </span>
        </button>
      </div>

      <!-- Nút huỷ -->
      <button
        class="w-full py-2 text-text-dim text-sm font-display tracking-wide border border-border-default transition hover:text-text-secondary cursor-pointer"
        @click="emit('cancel')"
      >
        Huỷ
      </button>
    </div>
  </div>
</template>
