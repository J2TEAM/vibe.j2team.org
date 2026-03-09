<script setup lang="ts">
import { ref, computed } from 'vue'
import { getSaoMoTa, getDacTinhInfo, getNguHanhLabel } from './lib/sao-data'
import type { Sao } from './lib/canchi-engine'

const props = defineProps<{ sao: Sao }>()

const show = ref(false)
const position = ref<'top' | 'bottom'>('top')
const triggerEl = ref<HTMLDivElement>()

function handleMouseEnter() {
  if (triggerEl.value) {
    const rect = triggerEl.value.getBoundingClientRect()
    position.value = rect.top < 200 ? 'bottom' : 'top'
  }
  show.value = true
}

const info = computed(() => getSaoMoTa(props.sao.ten))
const dacTinhInfo = computed(() => (props.sao.dacTinh ? getDacTinhInfo(props.sao.dacTinh) : null))

const nguHanhBg: Record<string, string> = {
  hoa: 'bg-red-900/50 text-red-400',
  moc: 'bg-emerald-900/50 text-emerald-400',
  tho: 'bg-amber-900/50 text-amber-400',
  kim: 'bg-zinc-700/50 text-zinc-300',
  thuy: 'bg-sky-900/50 text-sky-400',
}

const dacTinhColor: Record<string, string> = {
  M: 'bg-emerald-900/50 text-emerald-400',
  V: 'bg-blue-900/50 text-blue-400',
  D: 'bg-purple-900/50 text-purple-400',
  H: 'bg-red-900/50 text-red-400',
  B: 'bg-bg-elevated text-text-secondary',
}
</script>

<template>
  <div
    ref="triggerEl"
    class="relative inline-block"
    @mouseenter="handleMouseEnter"
    @mouseleave="show = false"
  >
    <slot />
    <div
      v-if="show"
      class="sao-tooltip"
      :class="position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'"
    >
      <div
        class="absolute left-4 w-2 h-2 bg-bg-elevated border-border-default transform rotate-45"
        :class="
          position === 'top' ? 'bottom-[-5px] border-b border-r' : 'top-[-5px] border-t border-l'
        "
      />
      <!-- Header -->
      <div class="flex items-center gap-2 mb-1.5">
        <span class="font-bold text-sm text-text-primary">{{ sao.ten }}</span>
        <span
          v-if="sao.nguHanh"
          class="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
          :class="nguHanhBg[sao.nguHanh]"
        >
          {{ getNguHanhLabel(sao.nguHanh) }}
        </span>
        <span
          v-if="sao.isTot === true"
          class="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-900/50 text-emerald-400 font-semibold"
          >Cát ★</span
        >
        <span
          v-if="sao.isTot === false"
          class="text-[10px] px-1.5 py-0.5 rounded-full bg-red-900/50 text-red-400 font-semibold"
          >Hung ✕</span
        >
      </div>

      <!-- Đặc tính -->
      <div v-if="dacTinhInfo && sao.dacTinh" class="flex items-center gap-1.5 mb-1.5">
        <span
          class="text-[10px] px-1.5 py-0.5 rounded font-bold"
          :class="dacTinhColor[sao.dacTinh]"
          >{{ dacTinhInfo.ten }}</span
        >
        <span class="text-[11px] text-text-secondary">{{ dacTinhInfo.moTa }}</span>
      </div>

      <!-- Tứ Hóa -->
      <div v-if="sao.tuHoa" class="mb-1.5">
        <span
          class="text-[10px] px-1.5 py-0.5 rounded font-bold"
          :class="
            sao.tuHoa === 'ky' ? 'bg-red-900/50 text-red-400' : 'bg-amber-900/50 text-amber-400'
          "
        >
          {{
            sao.tuHoa === 'loc'
              ? 'Hóa Lộc'
              : sao.tuHoa === 'quyen'
                ? 'Hóa Quyền'
                : sao.tuHoa === 'khoa'
                  ? 'Hóa Khoa'
                  : 'Hóa Kỵ'
          }}
        </span>
      </div>

      <!-- Mô tả -->
      <template v-if="info">
        <p class="text-[11px] text-text-secondary leading-relaxed">{{ info.moTa }}</p>
        <p class="text-[11px] text-text-primary leading-relaxed mt-1 font-medium">
          {{ info.yNghia }}
        </p>
      </template>

      <!-- Âm Dương / Loại sao -->
      <div v-if="info && (info.amDuong || info.loai)" class="mt-1.5 text-[10px] text-text-dim">
        {{ info.amDuong === 'Dương' ? '☀ Dương' : info.amDuong === 'Âm' ? '☽ Âm' : '' }}
        {{
          info.loai === 'chinh_tinh'
            ? ' • Chính tinh'
            : info.loai === 'phu_tinh'
              ? ' • Phụ tinh'
              : info.loai === 'tu_hoa'
                ? ' • Tứ Hóa'
                : info.loai === 'luu_nien'
                  ? ' ↻ Lưu niên'
                  : ''
        }}
      </div>
    </div>
  </div>
</template>
