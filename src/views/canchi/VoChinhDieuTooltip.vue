<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Cung } from './lib/canchi-engine'

const props = defineProps<{ cung: Cung }>()

const show = ref(false)
const position = ref<'top' | 'bottom'>('top')
const triggerEl = ref<HTMLDivElement>()

function handleMouseEnter() {
  if (triggerEl.value) {
    const rect = triggerEl.value.getBoundingClientRect()
    position.value = rect.top < 250 ? 'bottom' : 'top'
  }
  show.value = true
}

const saoPhuNote = computed(() =>
  props.cung.saoPhu.length > 0
    ? `Có ${props.cung.saoPhu.length} phụ tinh hỗ trợ.`
    : 'Không có phụ tinh hỗ trợ.',
)
</script>

<template>
  <div
    ref="triggerEl"
    class="relative w-full h-full flex items-center justify-center cursor-help"
    :style="{ zIndex: show ? 50 : undefined }"
    @mouseenter="handleMouseEnter"
    @mouseleave="show = false"
  >
    <span class="w-full h-full" />
    <div
      v-if="show"
      class="sao-tooltip"
      :class="position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'"
      :style="{ left: '50%', transform: 'translateX(-50%)', minWidth: '260px', zIndex: 60 }"
    >
      <div
        class="absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-bg-elevated border-border-default transform rotate-45"
        :class="
          position === 'top' ? 'bottom-[-5px] border-b border-r' : 'top-[-5px] border-t border-l'
        "
      />
      <div class="flex items-center gap-2 mb-1.5">
        <span class="font-bold text-sm text-text-primary">Vô Chính Diệu</span>
        <span
          class="text-[10px] px-1.5 py-0.5 rounded-full bg-bg-elevated text-text-secondary font-semibold"
          >Không Cung</span
        >
      </div>
      <p class="text-[11px] text-text-secondary leading-relaxed mb-1.5">
        Cung <strong>{{ cung.tenCungMenh }}</strong> không có chính tinh tọa thủ. Tính chất của cung
        phụ thuộc vào các sao chiếu từ cung xung chiếu và tam hợp (Tam Phương Tứ Chính).
      </p>
      <p class="text-[11px] text-text-primary leading-relaxed font-medium mb-1.5">
        Người có cung Vô Chính Diệu thường linh hoạt, dễ thích nghi nhưng thiếu chủ kiến. Cần xem kỹ
        phụ tinh và sao chiếu để luận đoán.
      </p>
      <div class="text-[10px] text-text-dim border-t border-border-default pt-1.5">
        {{ saoPhuNote }}
      </div>
    </div>
  </div>
</template>
