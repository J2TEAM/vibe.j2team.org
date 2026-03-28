<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { FuelOption } from '../types'

defineProps<{
  fuels: FuelOption[]
  modelValue: string
  isUsingFallback: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [id: string]
}>()

function formatMoneyVn(amount: number) {
  return Math.round(amount).toLocaleString('vi-VN') + 'đ'
}
</script>

<template>
  <section aria-labelledby="fuel-heading">
    <h2
      id="fuel-heading"
      class="font-display text-base min-[400px]:text-lg font-semibold flex items-center gap-2 sm:gap-3 mb-3 text-text-primary"
    >
      <span class="text-accent-amber text-sm tracking-widest font-display">//</span>
      Vòi đang rót
    </h2>
    <div
      class="grid grid-cols-1 sm:grid-cols-3 gap-2"
      role="radiogroup"
      aria-label="Chọn loại nhiên liệu cho lần đổ"
    >
      <button
        v-for="f in fuels"
        :key="f.id"
        type="button"
        role="radio"
        :aria-checked="modelValue === f.id"
        class="min-h-12 border px-3 py-2 text-left transition-colors cursor-pointer flex flex-col justify-center touch-manipulation"
        :class="
          modelValue === f.id
            ? 'border-accent-coral bg-bg-elevated'
            : 'border-border-default bg-bg-surface hover:border-accent-amber/50 hover:bg-bg-elevated/80'
        "
        @click="emit('update:modelValue', f.id)"
      >
        <div class="flex items-center gap-2 min-w-0">
          <Icon :icon="f.icon" class="size-4 shrink-0 text-accent-amber" aria-hidden="true" />
          <span class="font-display text-xs font-bold text-text-primary leading-tight truncate">{{
            f.label
          }}</span>
        </div>
        <div
          class="mt-1 font-display text-sm font-bold tabular-nums text-accent-amber tracking-tight"
        >
          {{ formatMoneyVn(f.pricePerLiter) }}/L
        </div>
        <div class="text-[10px] text-text-dim mt-0.5 truncate">
          <template v-if="f.changeText">{{ f.changeText }}</template>
          <template v-else>{{ isUsingFallback ? 'Giá mẫu' : 'VnExpress' }}</template>
        </div>
      </button>
    </div>
  </section>
</template>
