<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Laso } from './lib/canchi-engine'
import { CUNG_NAMES } from './lib/canchi-engine'

const props = defineProps<{
  laso: Laso
}>()

const emit = defineEmits<{
  cungClick: [viTri: number]
  tieuHanClick: [viTri: number]
}>()

const selectedDaiHan = ref<number | null>(null)
const lastSelected = ref<number | null>(null)

function mod12(n: number): number {
  return ((((n - 1) % 12) + 12) % 12) + 1
}

function calcTieuHanInDaiHan(cungDH: number, numYears: number, isNghich: boolean): number[] {
  const opposite = mod12(cungDH + 6)
  const dir = isNghich ? 1 : -1
  const result: number[] = []
  for (let i = 0; i < numYears; i++) {
    if (i === 0) result.push(cungDH)
    else if (i === 1) result.push(opposite)
    else if (i === 2) result.push(mod12(opposite + dir))
    else if (i === 3) result.push(opposite)
    else result.push(mod12(opposite - (i - 3) * dir))
  }
  return result
}

const daiHanList = props.laso.cung
  .map((c) => ({
    viTri: c.viTri,
    tenCung: c.tenCungMenh,
    chiCung: c.chiCung,
    daiHan: c.daiHan,
    isMenh: c.isMenh,
  }))
  .sort((a, b) => a.daiHan - b.daiHan)

const tuoiHienTai = props.laso.tuoiHan
const isNghich = props.laso.isNghichLy

const cungNameMap: Record<number, string> = {}
for (const c of props.laso.cung) {
  cungNameMap[c.viTri] = c.tenCungMenh
}

function getEndAge(idx: number) {
  const next = daiHanList[idx + 1]
  const current = daiHanList[idx]
  if (!current) return 0
  return next ? next.daiHan - 1 : current.daiHan + 9
}

function getTieuHanForDaiHan(cungDH: number, startAge: number, endAge: number) {
  const numYears = endAge - startAge + 1
  const cungList = calcTieuHanInDaiHan(cungDH, numYears, isNghich)
  return cungList.map((cungViTri, idx) => ({
    tuoi: startAge + idx,
    cungViTri,
    tenCung: cungNameMap[cungViTri] || CUNG_NAMES[cungViTri],
    chiCung: CUNG_NAMES[cungViTri],
  }))
}

function toggleDaiHan(idx: number, viTri: number) {
  emit('cungClick', viTri)
  if (selectedDaiHan.value === idx) {
    selectedDaiHan.value = null
  } else {
    lastSelected.value = idx
    selectedDaiHan.value = idx
  }
}

const displayIdx = computed(() => selectedDaiHan.value ?? lastSelected.value)

function handleTieuHanClick(viTri: number) {
  emit('tieuHanClick', viTri)
}
</script>

<template>
  <div class="dai-han-timeline">
    <div class="flex items-center gap-2 mb-2">
      <span class="text-xs font-display font-bold text-text-secondary uppercase tracking-wider"
        >Đại Hạn</span
      >
      <span class="text-[10px] text-text-dim">( Click để xem tiểu hạn )</span>
    </div>
    <div class="dai-han-scroll">
      <div class="flex gap-0">
        <button
          v-for="(item, idx) in daiHanList"
          :key="item.viTri"
          class="dai-han-item"
          :class="{
            'dai-han-active': selectedDaiHan === idx,
            'dai-han-current': tuoiHienTai >= item.daiHan && tuoiHienTai <= getEndAge(idx),
            'dai-han-selected': selectedDaiHan === idx,
          }"
          :title="`${item.tenCung} (${CUNG_NAMES[item.viTri]}): ${item.daiHan}-${getEndAge(idx)} tuổi`"
          @click="toggleDaiHan(idx, item.viTri)"
        >
          <span class="text-[10px] font-semibold truncate">{{ item.tenCung }}</span>
          <span class="text-[10px] text-text-dim">{{ item.chiCung }}</span>
          <span class="text-xs font-bold">{{ item.daiHan }}</span>
          <span class="text-[9px] text-text-dim">-{{ getEndAge(idx) }}</span>
        </button>
      </div>
    </div>

    <!-- Tiểu Hạn sub-timeline -->
    <div class="tieu-han-wrapper" :class="{ 'tieu-han-open': selectedDaiHan !== null }">
      <div class="tieu-han-inner">
        <template v-if="displayIdx !== null && daiHanList[displayIdx]">
          <div class="tieu-han-sub mt-2">
            <div class="flex items-center gap-2 mb-1.5">
              <span
                class="text-[10px] font-display font-bold text-text-secondary uppercase tracking-wider"
              >
                Tiểu Hạn — {{ daiHanList[displayIdx]!.tenCung }} ({{
                  daiHanList[displayIdx]!.daiHan
                }}–{{ getEndAge(displayIdx) }})
              </span>
              <span class="text-[10px] text-text-dim">({{ isNghich ? 'Nghịch' : 'Thuận' }})</span>
            </div>
            <div class="dai-han-scroll">
              <div class="flex gap-0">
                <button
                  v-for="th in getTieuHanForDaiHan(
                    daiHanList[displayIdx]!.viTri,
                    daiHanList[displayIdx]!.daiHan,
                    getEndAge(displayIdx),
                  )"
                  :key="th.tuoi"
                  class="tieu-han-item"
                  :class="{ 'tieu-han-current': th.tuoi === tuoiHienTai }"
                  :title="`Tuổi ${th.tuoi} — ${th.chiCung} — ${th.tenCung}`"
                  @click="handleTieuHanClick(th.cungViTri)"
                >
                  <span class="text-[10px] font-bold">{{ th.tuoi }}</span>
                  <span class="text-[9px] text-text-dim">{{ th.chiCung }}</span>
                  <span class="text-[9px] font-medium truncate max-w-full">{{ th.tenCung }}</span>
                </button>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Indicator -->
    <div class="flex items-center gap-2 mt-1.5">
      <div class="flex items-center gap-1 text-[10px] text-text-dim">
        <span
          class="w-2 h-2 rounded-sm bg-accent-amber/20 border border-accent-amber inline-block"
        />
        <span>Đại hạn hiện tại ({{ tuoiHienTai }} tuổi)</span>
      </div>
      <div class="flex items-center gap-1 text-[10px] text-text-dim">
        <span class="w-2 h-2 rounded-sm bg-accent-coral border border-accent-coral inline-block" />
        <span>Cung đang xem</span>
      </div>
    </div>
  </div>
</template>
