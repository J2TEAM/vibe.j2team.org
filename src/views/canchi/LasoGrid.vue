<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import type { Laso } from './lib/canchi-engine'
import { CUNG_NAMES, formatCanChi, getGioTimeRange } from './lib/canchi-engine'
import CungCell from './CungCell.vue'
import DaiHanTimeline from './DaiHanTimeline.vue'
import LegendPanel from './LegendPanel.vue'

const props = defineProps<{
  laso: Laso
  ten?: string
}>()

const hoveredCung = ref<number | null>(null)
const gridRef = ref<HTMLDivElement>()
const scalerRef = ref<HTMLDivElement>()
const scale = ref(1)
const scaledHeight = ref<number | undefined>(undefined)
const gridOffsetLeft = ref(0)
const showLegend = ref(false)

const GRID_FIXED_WIDTH = 960

const CUNG_EDGE_POINT: Record<number, { x: number; y: number }> = {
  1: { x: 62.5, y: 100 },
  2: { x: 37.5, y: 100 },
  3: { x: 0, y: 87.5 },
  4: { x: 0, y: 62.5 },
  5: { x: 0, y: 37.5 },
  6: { x: 0, y: 12.5 },
  7: { x: 37.5, y: 0 },
  8: { x: 62.5, y: 0 },
  9: { x: 100, y: 12.5 },
  10: { x: 100, y: 37.5 },
  11: { x: 100, y: 62.5 },
  12: { x: 100, y: 87.5 },
}

const GRID_POSITIONS: Record<number, [number, number]> = {
  6: [0, 0],
  7: [0, 1],
  8: [0, 2],
  9: [0, 3],
  5: [1, 0],
  10: [1, 3],
  4: [2, 0],
  11: [2, 3],
  3: [3, 0],
  2: [3, 1],
  1: [3, 2],
  12: [3, 3],
}

function getCungXung(viTri: number): number {
  return ((viTri - 1 + 6) % 12) + 1
}

function getCungTamHop(viTri: number): [number, number] {
  return [((viTri - 1 + 4) % 12) + 1, ((viTri - 1 + 8) % 12) + 1]
}

function getHighlight(viTri: number): 'in-tam-phuong' | 'dimmed' | null {
  if (hoveredCung.value === null) return null
  const xung = getCungXung(hoveredCung.value)
  const [tamHop1, tamHop2] = getCungTamHop(hoveredCung.value)
  if (viTri === hoveredCung.value || viTri === xung || viTri === tamHop1 || viTri === tamHop2) {
    return 'in-tam-phuong'
  }
  return 'dimmed'
}

function getCungByPosition(row: number, col: number) {
  const cungNum = Object.entries(GRID_POSITIONS).find(
    ([, pos]) => pos[0] === row && pos[1] === col,
  )?.[0]
  if (!cungNum) return null
  return props.laso.cung.find((c) => c.viTri === parseInt(cungNum))
}

function getCanChiNam(nam: number): { can: number; chi: number } {
  const can = ((nam - 4) % 10) + 1
  const chi = ((nam - 4) % 12) + 1
  return { can, chi }
}

function getBadgeGridPosition(cung1: number, cung2: number): { x: number; y: number } | null {
  const pos1 = GRID_POSITIONS[cung1]
  const pos2 = GRID_POSITIONS[cung2]
  if (!pos1 || !pos2) return null
  if (pos1[0] === pos2[0] && Math.abs(pos1[1] - pos2[1]) === 1) {
    const row = pos1[0]
    const x = Math.max(pos1[1], pos2[1]) * 25
    const isCenterAdj = pos1[1] >= 1 && pos1[1] <= 2 && pos2[1] >= 1 && pos2[1] <= 2
    let y: number
    if (isCenterAdj && row === 0) y = 25
    else if (isCenterAdj && row === 3) y = 75
    else y = (row + 0.5) * 25
    return { x, y }
  }
  if (pos1[1] === pos2[1] && Math.abs(pos1[0] - pos2[0]) === 1) {
    const col = pos1[1]
    const y = Math.max(pos1[0], pos2[0]) * 25
    const isCenterAdj = pos1[0] >= 1 && pos1[0] <= 2 && pos2[0] >= 1 && pos2[0] <= 2
    let x: number
    if (isCenterAdj && col === 0) x = 25
    else if (isCenterAdj && col === 3) x = 75
    else x = (col + 0.5) * 25
    return { x, y }
  }
  return null
}

const tamPhuongCung = computed(() => hoveredCung.value ?? props.laso.cungMenh)
const tamPhuongXung = computed(() => getCungXung(tamPhuongCung.value))
const tamPhuongTamHop = computed(() => getCungTamHop(tamPhuongCung.value))
const defaultEdge = { x: 50, y: 50 }
const edgeToCung = computed(() => CUNG_EDGE_POINT[tamPhuongCung.value] ?? defaultEdge)
const edgeToXung = computed(() => CUNG_EDGE_POINT[tamPhuongXung.value] ?? defaultEdge)
const edgeToTamHop1 = computed(() => CUNG_EDGE_POINT[tamPhuongTamHop.value[0]] ?? defaultEdge)
const edgeToTamHop2 = computed(() => CUNG_EDGE_POINT[tamPhuongTamHop.value[1]] ?? defaultEdge)

const gridBadges = computed(() => {
  const [triet1, triet2] = props.laso.trietLo
  const [tuan1, tuan2] = props.laso.tuanTriet
  const trietPos = getBadgeGridPosition(triet1, triet2)
  const tuanPos = getBadgeGridPosition(tuan1, tuan2)
  const isSame = triet1 === tuan1 && triet2 === tuan2
  const badges: { label: string; x: number; y: number }[] = []
  if (isSame && trietPos) {
    badges.push({ label: 'Tuần - Triệt', ...trietPos })
  } else {
    if (trietPos) badges.push({ label: 'Triệt', ...trietPos })
    if (tuanPos) badges.push({ label: 'Tuần', ...tuanPos })
  }
  return badges
})

// Row data
const row0 = computed(() => [0, 1, 2, 3].map((col) => getCungByPosition(0, col)).filter(Boolean))
const cung5 = computed(() => getCungByPosition(1, 0))
const cung10 = computed(() => getCungByPosition(1, 3))
const cung4 = computed(() => getCungByPosition(2, 0))
const cung11 = computed(() => getCungByPosition(2, 3))
const row3 = computed(() => [0, 1, 2, 3].map((col) => getCungByPosition(3, col)).filter(Boolean))

// Center panel data
const namXem = computed(() => props.laso.input.namXem || new Date().getFullYear())
const canChiNamXem = computed(() => getCanChiNam(namXem.value))

let ro: ResizeObserver | null = null

onMounted(() => {
  const scaler = scalerRef.value
  const grid = gridRef.value
  if (!scaler || !grid) return

  const update = () => {
    const w = scaler.clientWidth
    const s = Math.min(1, w / GRID_FIXED_WIDTH)
    scale.value = s
    gridOffsetLeft.value = Math.max(0, (w - GRID_FIXED_WIDTH * s) / 2)
    requestAnimationFrame(() => {
      if (grid) scaledHeight.value = grid.offsetHeight * s
    })
  }

  ro = new ResizeObserver(update)
  ro.observe(scaler)
  ro.observe(grid)
})

onUnmounted(() => {
  ro?.disconnect()
})
</script>

<template>
  <div class="w-full max-w-5xl mx-auto space-y-4">
    <!-- Action buttons -->
    <LegendPanel
      :laso="laso"
      :grid-el="gridRef"
      :ten="ten"
      mode="buttons"
      @toggle-legend="showLegend = !showLegend"
    >
      <template #legend-icon>
        <template v-if="showLegend">
          <svg
            class="w-3.5 h-3.5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
          Ẩn chú thích
        </template>
        <template v-else>
          <svg
            class="w-3.5 h-3.5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
          </svg>
          Chú thích
        </template>
      </template>
    </LegendPanel>

    <!-- Legend wrapper -->
    <div class="legend-wrapper" :class="{ 'legend-open': showLegend }">
      <div class="legend-inner">
        <LegendPanel :laso="laso" :grid-el="gridRef" :ten="ten" mode="content" />
      </div>
    </div>

    <!-- Đại Hạn Timeline -->
    <DaiHanTimeline
      :laso="laso"
      @cung-click="hoveredCung = $event"
      @tieu-han-click="hoveredCung = $event"
    />

    <div
      ref="scalerRef"
      class="laso-grid-scaler"
      :style="{ height: scaledHeight ? `${scaledHeight}px` : undefined }"
    >
      <div
        ref="gridRef"
        class="laso-grid relative"
        id="laso-grid-export"
        :style="{ transform: `scale(${scale})`, marginLeft: `${gridOffsetLeft}px` }"
      >
        <!-- Row 0 -->
        <CungCell
          v-for="cung in row0"
          :key="cung!.viTri"
          :cung="cung!"
          :highlight="getHighlight(cung!.viTri)"
          @hover="hoveredCung = cung!.viTri"
          @leave="hoveredCung = null"
        />

        <!-- Row 1: left cell -->
        <CungCell
          v-if="cung5"
          :cung="cung5"
          :highlight="getHighlight(cung5.viTri)"
          @hover="hoveredCung = cung5.viTri"
          @leave="hoveredCung = null"
        />

        <!-- Center panel (2×2) -->
        <div class="laso-center">
          <p class="text-base text-center text-text-secondary">CanChi</p>
          <h1
            class="text-2xl font-display font-bold text-center uppercase tracking-wide text-accent-coral"
          >
            Lá Số CanChi
          </h1>
          <hr class="border-border-default w-1/2 mx-auto my-1" />

          <div class="space-y-1.5 text-base">
            <div class="grid grid-cols-3 gap-2">
              <span class="text-text-secondary">Tên</span>
              <span class="font-semibold col-span-2">{{ ten || 'Lá Số CanChi' }}</span>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <span class="text-text-secondary">Năm</span>
              <span class="font-semibold">
                {{ laso.input.namDuong || laso.input.namAm }}
                <span
                  v-if="laso.input.namDuong && laso.input.namDuong !== laso.input.namAm"
                  class="text-text-secondary"
                >
                  ({{ laso.input.namAm }})</span
                >
              </span>
              <span class="font-bold">{{ formatCanChi(laso.canNam, laso.chiNam) }}</span>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <span class="text-text-secondary">Tháng</span>
              <span class="font-semibold">
                {{ laso.input.thangDuong || laso.input.thangAm }}
                <span
                  v-if="laso.input.thangDuong && laso.input.thangDuong !== laso.input.thangAm"
                  class="text-text-secondary"
                >
                  ({{ laso.input.thangAm }})</span
                >
              </span>
              <span class="font-bold">{{ formatCanChi(laso.canThang, laso.chiThang) }}</span>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <span class="text-text-secondary">Ngày</span>
              <span class="font-semibold">
                {{ laso.input.ngayDuong || laso.input.ngayAm }}
                <span
                  v-if="laso.input.ngayDuong && laso.input.ngayDuong !== laso.input.ngayAm"
                  class="text-text-secondary"
                >
                  ({{ laso.input.ngayAm }})</span
                >
              </span>
              <span class="font-bold">{{
                laso.canNgay > 0 ? formatCanChi(laso.canNgay, laso.chiNgay) : '-'
              }}</span>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <span class="text-text-secondary">Giờ</span>
              <span class="font-semibold">{{ getGioTimeRange(laso.input.gio) }}</span>
              <span class="font-bold">{{
                laso.canGio > 0 ? formatCanChi(laso.canGio, laso.chiGio) : CUNG_NAMES[laso.chiGio]
              }}</span>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <span class="text-text-secondary">Năm xem</span>
              <span class="font-semibold">{{ namXem }}</span>
              <div class="flex flex-col">
                <span class="font-bold">{{
                  formatCanChi(canChiNamXem.can, canChiNamXem.chi)
                }}</span>
                <span class="font-bold">{{ laso.tuoiHan }} tuổi</span>
              </div>
            </div>
          </div>

          <hr class="border-border-default w-1/2 mx-auto my-1" />

          <div class="space-y-1.5 text-base">
            <div class="grid grid-cols-3 gap-2">
              <span class="text-text-secondary">Âm Dương</span>
              <div class="col-span-2 flex flex-col">
                <span class="font-bold"
                  >{{ laso.amDuong }} {{ laso.input.gioiTinh === 'nam' ? 'Nam' : 'Nữ' }}</span
                >
                <span class="font-bold">{{
                  laso.isNghichLy ? 'Âm dương nghịch lý' : 'Âm dương thuận lý'
                }}</span>
              </div>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <span class="text-text-secondary">Mệnh</span>
              <span class="font-bold col-span-2 capitalize">{{ laso.napAm }}</span>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <span class="text-text-secondary">Cục</span>
              <div class="col-span-2 flex flex-col">
                <span class="font-bold">{{ laso.cucTen }}</span>
                <span v-if="laso.cucSinhKhac" class="font-bold">{{ laso.cucSinhKhac }}</span>
              </div>
            </div>
          </div>

          <!-- Tam Phương lines SVG -->
          <svg
            style="
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              pointer-events: none;
              z-index: 5;
              overflow: visible;
            "
          >
            <line
              :x1="`${edgeToCung.x}%`"
              :y1="`${edgeToCung.y}%`"
              :x2="`${edgeToXung.x}%`"
              :y2="`${edgeToXung.y}%`"
              stroke="#FF6B4A"
              stroke-width="2"
              opacity="0.6"
            />
            <line
              :x1="`${edgeToCung.x}%`"
              :y1="`${edgeToCung.y}%`"
              :x2="`${edgeToTamHop1.x}%`"
              :y2="`${edgeToTamHop1.y}%`"
              stroke="#38BDF8"
              stroke-width="1.5"
              opacity="0.5"
            />
            <line
              :x1="`${edgeToCung.x}%`"
              :y1="`${edgeToCung.y}%`"
              :x2="`${edgeToTamHop2.x}%`"
              :y2="`${edgeToTamHop2.y}%`"
              stroke="#38BDF8"
              stroke-width="1.5"
              opacity="0.5"
            />
          </svg>
        </div>

        <!-- Row 1: right cell -->
        <CungCell
          v-if="cung10"
          :cung="cung10"
          :highlight="getHighlight(cung10.viTri)"
          @hover="hoveredCung = cung10.viTri"
          @leave="hoveredCung = null"
        />

        <!-- Row 2 -->
        <CungCell
          v-if="cung4"
          :cung="cung4"
          :highlight="getHighlight(cung4.viTri)"
          @hover="hoveredCung = cung4.viTri"
          @leave="hoveredCung = null"
        />
        <!-- Center continues from row 1 (span 2) -->
        <CungCell
          v-if="cung11"
          :cung="cung11"
          :highlight="getHighlight(cung11.viTri)"
          @hover="hoveredCung = cung11.viTri"
          @leave="hoveredCung = null"
        />

        <!-- Row 3 -->
        <CungCell
          v-for="cung in row3"
          :key="cung!.viTri"
          :cung="cung!"
          :highlight="getHighlight(cung!.viTri)"
          @hover="hoveredCung = cung!.viTri"
          @leave="hoveredCung = null"
        />

        <!-- Badge Tuần/Triệt -->
        <div
          v-for="(b, i) in gridBadges"
          :key="`badge-${i}`"
          class="group px-2 text-xs font-display font-semibold bg-accent-coral text-bg-deep whitespace-nowrap pt-[2px] cursor-help"
          :style="{
            position: 'absolute',
            left: `${b.x}%`,
            top: `${b.y}%`,
            transform: 'translate(-50%, -50%)',
            zIndex: 30,
          }"
        >
          {{ b.label }}
          <div
            class="hidden group-hover:block absolute bottom-full mb-1.5 w-56 p-2 bg-bg-elevated text-text-secondary text-[11px] font-normal border border-border-default shadow-lg leading-relaxed whitespace-normal"
            :style="{ zIndex: 60, left: '50%', transform: 'translateX(-50%)', maxWidth: '14rem' }"
          >
            <p v-if="b.label.includes('Triệt')">
              <b>Triệt lộ:</b> Vùng bị cắt đứt, sao trong cung bị giảm lực. Gặp cát tinh thì giảm
              tốt, gặp hung tinh thì giảm xấu.
            </p>
            <p v-if="b.label.includes('Tuần')" :class="{ 'mt-1': b.label.includes('Triệt') }">
              <b>Tuần trung:</b> Vùng ẩn tàng, sao bị che khuất. Hung tinh gặp Tuần thì bớt hung,
              cát tinh gặp Tuần thì chậm phát.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
