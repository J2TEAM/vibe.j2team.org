<script setup lang="ts">
import type { Province } from '../types'

defineProps<{
  province: Province | null
  x: number
  y: number
  visible: boolean
}>()
</script>

<template>
  <Teleport to="body">
    <Transition name="popup">
      <div
        v-if="visible && province"
        class="fixed z-50 pointer-events-none"
        :style="{
          left: x + 'px',
          top: y + 'px',
          transform: 'translate(-50%, -110%)',
        }"
      >
        <div class="bg-bg-surface border border-accent-sky p-3 min-w-[200px]
                    shadow-lg shadow-accent-sky/10 text-sm">
          <h4 class="font-display font-bold text-accent-sky text-base mb-1">
            {{ province.name }}
          </h4>
          <div class="space-y-0.5 text-text-secondary">
            <p>
              <span class="text-text-dim">Vùng:</span>
              {{ province.zone }} — {{ province.region }}
            </p>
            <p>
              <span class="text-text-dim">Tỉnh lỵ:</span>
              {{ province.capital }}
            </p>
            <p>
              <span class="text-text-dim">Diện tích:</span>
              {{ province.area.toLocaleString('vi-VN') }} km²
            </p>
            <p>
              <span class="text-text-dim">Dân số:</span>
              {{ province.population.toLocaleString('vi-VN') }}
            </p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.popup-enter-active,
.popup-leave-active {
  transition: all 0.2s ease;
}
.popup-enter-from,
.popup-leave-to {
  opacity: 0;
  transform: translate(-50%, -100%) scale(0.95);
}
</style>
