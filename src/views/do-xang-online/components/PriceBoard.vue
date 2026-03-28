<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { FuelOption } from '../types'

defineProps<{
  fuels: FuelOption[]
  pricesLoading: boolean
  lastUpdated: string
  priceError: string
  isUsingFallback: boolean
}>()

const emit = defineEmits<{
  refresh: []
}>()

function formatMoneyVn(amount: number) {
  return Math.round(amount).toLocaleString('vi-VN') + 'đ'
}
</script>

<template>
  <section class="mb-8 sm:mb-10" aria-labelledby="price-board-heading">
    <div class="flex flex-wrap items-end justify-between gap-3 sm:gap-4 mb-4">
      <h2
        id="price-board-heading"
        class="font-display text-lg min-[400px]:text-xl sm:text-2xl font-semibold flex items-center gap-2 sm:gap-3 text-text-primary min-w-0"
      >
        <span class="text-accent-amber text-sm tracking-widest font-display">//</span>
        Bảng giá bán lẻ
      </h2>
      <div class="flex flex-wrap items-center justify-end gap-2 sm:gap-3 w-full sm:w-auto">
        <span
          class="text-text-dim text-[11px] sm:text-xs font-display tabular-nums text-right"
          aria-live="polite"
        >
          <template v-if="pricesLoading">Đang tải…</template>
          <template v-else-if="lastUpdated">Cập nhật: {{ lastUpdated }}</template>
        </span>
        <button
          type="button"
          class="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-text-secondary font-display text-xs transition-colors hover:border-accent-amber hover:bg-bg-elevated cursor-pointer disabled:opacity-40"
          :disabled="pricesLoading"
          aria-label="Làm mới giá xăng dầu"
          @click="emit('refresh')"
        >
          <Icon
            icon="lucide:refresh-cw"
            class="size-4 shrink-0"
            :class="pricesLoading ? 'animate-spin' : ''"
            aria-hidden="true"
          />
          <span class="hidden sm:inline">Làm mới</span>
        </button>
      </div>
    </div>

    <div
      v-if="priceError && isUsingFallback"
      class="mb-4 border border-accent-amber/30 bg-accent-amber/5 px-4 py-3 text-xs text-accent-amber font-display"
      role="status"
    >
      Không lấy được giá thực ({{ priceError }}). Đang dùng giá mẫu.
    </div>

    <div
      class="border border-border-default bg-bg-surface overflow-hidden"
      :aria-busy="pricesLoading"
      aria-live="polite"
    >
      <div
        class="grid grid-cols-[minmax(0,1fr)_minmax(5.25rem,auto)_minmax(4.5rem,auto)] gap-x-2 sm:gap-x-3 gap-y-0 border-b border-border-default bg-bg-elevated/50 px-2.5 py-2 text-[11px] sm:text-xs font-display tracking-widest text-text-dim sm:px-4"
      >
        <span>Mặt hàng</span>
        <span class="text-right tabular-nums">VNĐ/lít</span>
        <span class="text-right hidden sm:block">Biến động</span>
      </div>

      <template v-if="pricesLoading">
        <div
          v-for="n in 3"
          :key="`sk-${n}`"
          class="grid grid-cols-[minmax(0,1fr)_minmax(5.25rem,auto)_minmax(4.5rem,auto)] items-center gap-x-2 sm:gap-x-3 border-b border-border-default px-2.5 py-3 last:border-b-0 sm:px-4"
        >
          <div class="h-4 w-[min(60%,12rem)] animate-pulse bg-border-default/80" />
          <div class="h-6 justify-self-end w-24 animate-pulse bg-border-default/80" />
          <div
            class="hidden h-3 w-16 justify-self-end animate-pulse bg-border-default/60 sm:block"
          />
        </div>
      </template>

      <template v-else>
        <div
          v-for="f in fuels"
          :key="f.id"
          class="grid grid-cols-[minmax(0,1fr)_minmax(5.25rem,auto)_minmax(4.5rem,auto)] items-center gap-x-2 sm:gap-x-3 gap-y-1 border-b border-border-default px-2.5 py-3 last:border-b-0 sm:px-4"
        >
          <div class="flex items-center gap-2 min-w-0">
            <Icon :icon="f.icon" class="size-4 shrink-0 text-accent-amber" aria-hidden="true" />
            <span class="font-display text-sm font-semibold text-text-primary truncate">{{
              f.label
            }}</span>
          </div>
          <span
            class="font-display text-base min-[400px]:text-lg font-bold tabular-nums text-accent-amber text-right tracking-tight"
          >
            {{ formatMoneyVn(f.pricePerLiter) }}
          </span>
          <span
            class="hidden text-right text-xs font-display text-text-secondary tabular-nums sm:block"
          >
            {{ f.changeText || '—' }}
          </span>
        </div>
      </template>

      <div
        class="border-t border-border-default bg-bg-deep/40 px-2.5 py-2 text-[10px] sm:text-[11px] text-text-dim font-display leading-relaxed sm:px-4"
      >
        Nguồn: VnExpress (qua proxy). Giá có thể khác tại từng trạm.
      </div>
    </div>
  </section>
</template>
