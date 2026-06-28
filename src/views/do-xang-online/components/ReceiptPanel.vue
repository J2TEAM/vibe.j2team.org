<script setup lang="ts">
import type { FuelOption, VehicleOption } from '../types'

defineProps<{
  selectedVehicle: VehicleOption
  selectedFuel: FuelOption
  litersText: string
  totalCostText: string
  savedCost: number
  copied: boolean
  litersOdometerKey: string
  costOdometerKey: string
}>()

const emit = defineEmits<{
  close: []
  copy: []
}>()
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-bg-deep/80 p-3 sm:p-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-[2px] overflow-y-auto overscroll-contain"
    role="dialog"
    aria-modal="true"
    aria-labelledby="receipt-title"
  >
    <div
      class="w-full max-w-lg max-h-[min(calc(100dvh-1.5rem),40rem)] overflow-y-auto overscroll-contain border border-accent-coral bg-bg-surface p-4 sm:p-6 shadow-2xl shadow-black/40"
    >
      <div class="flex gap-3 sm:gap-4 items-start justify-between">
        <div class="min-w-0 flex-1 pr-1">
          <div class="font-display text-accent-coral text-xs sm:text-sm tracking-widest">
            // RECEIPT
          </div>
          <h2
            id="receipt-title"
            class="font-display text-xl sm:text-2xl font-bold mt-2 text-text-primary leading-tight"
          >
            Biên nhận đổ xăng online
          </h2>
          <p class="text-text-secondary text-sm mt-2">
            Cho vui thôi — ngoài đời vẫn phải ra trạm thật.
          </p>
        </div>
        <button
          type="button"
          class="shrink-0 min-h-11 min-w-11 border border-border-default bg-bg-elevated text-text-primary font-display font-bold px-3 py-2 transition-colors hover:border-accent-coral hover:bg-bg-surface cursor-pointer touch-manipulation"
          aria-label="Đóng biên nhận"
          @click="emit('close')"
        >
          Đóng
        </button>
      </div>

      <div class="mt-4 sm:mt-5 border border-border-default bg-bg-elevated p-3 sm:p-4">
        <div class="grid gap-3 sm:grid-cols-2">
          <div>
            <div class="text-text-dim text-xs tracking-widest font-display">Xe</div>
            <div class="font-display font-bold mt-1 text-text-primary">
              {{ selectedVehicle.name }}
            </div>
            <div class="text-text-secondary text-sm mt-1">{{ selectedVehicle.description }}</div>
          </div>
          <div>
            <div class="text-text-dim text-xs tracking-widest font-display">Loại xăng</div>
            <div class="font-display font-bold mt-1 text-text-primary">
              {{ selectedFuel.label }}
            </div>
            <div class="text-accent-amber text-sm mt-1 font-display font-bold tabular-nums">
              {{ selectedFuel.pricePerLiter.toLocaleString('vi-VN') }}đ/L
            </div>
          </div>
          <div>
            <div class="text-text-dim text-xs tracking-widest font-display">Đã đổ</div>
            <div
              :key="litersOdometerKey"
              class="odometerNumber font-display font-bold text-accent-sky text-lg mt-1 tabular-nums"
            >
              {{ litersText }} L
            </div>
          </div>
          <div>
            <div class="text-text-dim text-xs tracking-widest font-display">Tổng tiền</div>
            <div
              :key="costOdometerKey"
              class="odometerNumber font-display font-bold text-accent-amber text-lg mt-1 tabular-nums"
            >
              {{ totalCostText }}
            </div>
          </div>
        </div>

        <div class="mt-4 border-t border-border-default pt-4">
          <div class="font-display font-bold text-accent-coral tabular-nums">
            Đã tiết kiệm: {{ Math.round(savedCost).toLocaleString('vi-VN') }}đ
          </div>
          <p class="text-text-secondary text-sm mt-2">
            So với “trạm xăng thật” giả lập (1.15x). Web muốn bạn cười nhiều hơn.
          </p>
        </div>
      </div>

      <div class="mt-4 sm:mt-5 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <button
          type="button"
          class="w-full sm:w-auto min-h-11 bg-accent-coral text-bg-deep font-display font-bold px-5 py-2.5 transition-colors hover:bg-accent-amber active:scale-[0.98] cursor-pointer touch-manipulation"
          @click="emit('copy')"
        >
          {{ copied ? 'Đã copy biên nhận' : 'Copy biên nhận' }}
        </button>
        <p class="text-text-dim text-sm">Xăng thật thì ra trạm nhé.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.odometerNumber {
  display: inline-block;
  animation: odometerFlip 0.28s ease-out;
}

@keyframes odometerFlip {
  0% {
    transform: translateY(6px);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .odometerNumber {
    animation: none;
  }
}
</style>
