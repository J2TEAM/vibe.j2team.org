<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import type { Province } from '../types'
import { provinces } from '../data/provinces'

const props = defineProps<{
  gameProvinces: Province[]
  placedProvinces: Map<string, { provinceId: string; status: string; attempts: number }>
  selectedProvinceId: string | null
  hintedProvinceId: string | null
  wrongProvinceId: string | null
  difficulty: string
}>()

const emit = defineEmits<{
  (e: 'drop', provinceId: string, svgPathId: string): void
  (e: 'click-province', svgPathId: string): void
}>()

const hoveredPath = ref<string | null>(null)
const svgContainer = ref<HTMLDivElement | null>(null)

// Build a map from svgPathId to province for quick lookup
const svgIdToProvince = computed(() => {
  const map = new Map<string, Province>()
  provinces.forEach(p => map.set(p.svgPathId, p))
  return map
})

// Build map of correctly placed provinces
const correctSvgIds = computed(() => {
  const ids = new Set<string>()
  props.placedProvinces.forEach((placed) => {
    if (placed.status === 'correct') {
      const prov = provinces.find(p => p.id === placed.provinceId)
      if (prov) ids.add(prov.svgPathId)
    }
  })
  return ids
})

// Determine fill color for each province path
function getPathFill(svgPathId: string): string {
  if (props.wrongProvinceId === svgPathId) return '#FF6B4A' // coral — wrong flash
  if (props.hintedProvinceId === svgPathId) return 'rgba(56, 189, 248, 0.4)' // sky/40
  if (correctSvgIds.value.has(svgPathId)) return '#38BDF8' // sky — correct
  if (hoveredPath.value === svgPathId) return '#1E2F42' // elevated
  return '#162232' // surface — default
}

function getPathStroke(svgPathId: string): string {
  if (props.wrongProvinceId === svgPathId) return '#FF6B4A'
  if (props.hintedProvinceId === svgPathId) return '#38BDF8'
  if (correctSvgIds.value.has(svgPathId)) return '#38BDF8'
  return '#253549' // border-default
}

// Drag and drop handlers
function onDragOver(e: DragEvent) {
  e.preventDefault()
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
}

function onDrop(e: DragEvent, svgPathId: string) {
  e.preventDefault()
  const provinceId = e.dataTransfer?.getData('text/plain')
  if (provinceId) {
    emit('drop', provinceId, svgPathId)
  }
}

function onPathClick(svgPathId: string) {
  emit('click-province', svgPathId)
}

function onMouseEnter(svgPathId: string) {
  hoveredPath.value = svgPathId
}

function onMouseLeave() {
  hoveredPath.value = null
}

// SVG path data for all 63 provinces — inline simplified shapes
// These represent approximate geographic positions for interactive gameplay
const provincePaths = ref<{id: string; d: string}[]>([])

onMounted(() => {
  generateMapPaths()
})

function generateMapPaths() {
  // Simplified Vietnam map paths — positioned to approximate real geography
  // The SVG viewBox is 0 0 400 700 representing the elongated shape of Vietnam
  const pathData: {id: string; d: string}[] = [
    // === BẮC ===
    // Hà Giang
    { id: 'VN-HG', d: 'M168,12 L192,8 L210,18 L215,35 L200,45 L180,42 L165,30 Z' },
    // Cao Bằng
    { id: 'VN-CB', d: 'M215,15 L240,10 L258,20 L260,38 L245,48 L225,45 L215,35 Z' },
    // Lào Cai
    { id: 'VN-LC', d: 'M130,20 L155,15 L168,28 L165,45 L148,50 L132,40 Z' },
    // Lai Châu
    { id: 'VN-LCh', d: 'M100,35 L130,25 L140,42 L135,60 L115,65 L98,52 Z' },
    // Điện Biên
    { id: 'VN-DB', d: 'M72,52 L98,45 L108,60 L102,80 L85,88 L70,75 Z' },
    // Sơn La
    { id: 'VN-SL', d: 'M88,80 L115,65 L145,62 L155,78 L140,98 L110,105 L88,95 Z' },
    // Yên Bái
    { id: 'VN-YB', d: 'M148,42 L175,38 L185,52 L178,68 L158,72 L145,60 Z' },
    // Tuyên Quang
    { id: 'VN-TQ', d: 'M178,38 L200,42 L208,58 L198,72 L180,70 L175,55 Z' },
    // Lạng Sơn
    { id: 'VN-LS', d: 'M245,42 L268,35 L280,48 L275,65 L258,72 L240,65 Z' },
    // Bắc Kạn
    { id: 'VN-BK', d: 'M210,42 L232,40 L240,55 L232,70 L215,72 L208,58 Z' },
    // Phú Thọ
    { id: 'VN-PT', d: 'M140,65 L165,60 L175,75 L168,90 L148,92 L138,80 Z' },
    // Thái Nguyên
    { id: 'VN-TN', d: 'M198,62 L218,58 L228,72 L222,88 L205,90 L195,78 Z' },
    // Vĩnh Phúc
    { id: 'VN-VP', d: 'M175,72 L198,68 L205,82 L198,95 L180,96 L172,85 Z' },
    // Bắc Giang
    { id: 'VN-BG', d: 'M228,65 L252,60 L262,75 L255,90 L235,92 L225,80 Z' },
    // Quảng Ninh
    { id: 'VN-QN', d: 'M262,55 L295,48 L310,62 L305,82 L285,92 L262,88 L258,72 Z' },
    // Hà Nội
    { id: 'VN-HN', d: 'M185,90 L210,86 L218,100 L212,115 L192,118 L182,105 Z' },
    // Bắc Ninh
    { id: 'VN-BN', d: 'M218,85 L238,82 L244,95 L238,108 L222,110 L216,98 Z' },
    // Hải Dương
    { id: 'VN-HD', d: 'M240,88 L262,85 L270,98 L265,112 L245,115 L238,102 Z' },
    // Hải Phòng
    { id: 'VN-HP', d: 'M268,92 L295,88 L305,102 L298,118 L275,120 L265,108 Z' },
    // Hưng Yên
    { id: 'VN-HY', d: 'M218,108 L240,105 L245,118 L238,130 L220,132 L215,120 Z' },
    // Hoà Bình
    { id: 'VN-HB', d: 'M145,95 L175,90 L185,105 L178,125 L155,128 L142,115 Z' },
    // Hà Nam
    { id: 'VN-HNm', d: 'M192,118 L215,115 L220,130 L212,142 L195,144 L188,132 Z' },
    // Thái Bình
    { id: 'VN-TB', d: 'M238,118 L268,115 L275,130 L268,145 L242,148 L235,135 Z' },
    // Nam Định
    { id: 'VN-ND', d: 'M210,140 L238,136 L245,150 L238,165 L215,168 L208,155 Z' },
    // Ninh Bình
    { id: 'VN-NB', d: 'M178,138 L205,135 L212,150 L205,168 L182,170 L175,155 Z' },

    // === TRUNG ===
    // Thanh Hoá
    { id: 'VN-TH', d: 'M148,155 L195,148 L210,168 L205,195 L170,205 L140,195 L135,175 Z' },
    // Nghệ An
    { id: 'VN-NA', d: 'M128,195 L175,188 L195,210 L185,245 L155,255 L125,240 L118,215 Z' },
    // Hà Tĩnh
    { id: 'VN-HT', d: 'M148,255 L178,248 L190,268 L182,290 L160,295 L145,278 Z' },
    // Quảng Bình
    { id: 'VN-QB', d: 'M155,290 L180,285 L192,308 L185,330 L165,335 L152,318 Z' },
    // Quảng Trị
    { id: 'VN-QTr', d: 'M158,332 L182,328 L190,345 L185,362 L165,365 L155,350 Z' },
    // Thừa Thiên Huế
    { id: 'VN-TTH', d: 'M155,362 L185,355 L195,375 L188,395 L165,400 L152,385 Z' },
    // Đà Nẵng
    { id: 'VN-DN', d: 'M178,395 L198,390 L205,405 L198,418 L182,420 L175,408 Z' },
    // Quảng Nam
    { id: 'VN-QNm', d: 'M155,405 L185,398 L200,418 L195,440 L168,448 L148,432 Z' },
    // Kon Tum
    { id: 'VN-KT', d: 'M118,410 L148,405 L158,425 L152,445 L128,450 L115,435 Z' },
    // Quảng Ngãi
    { id: 'VN-QNg', d: 'M168,440 L198,435 L208,452 L202,468 L178,472 L165,458 Z' },
    // Gia Lai
    { id: 'VN-GL', d: 'M118,445 L155,438 L170,458 L165,485 L138,492 L115,478 Z' },
    // Bình Định
    { id: 'VN-BD', d: 'M178,468 L208,462 L218,480 L212,498 L188,502 L175,488 Z' },
    // Phú Yên
    { id: 'VN-PY', d: 'M180,498 L210,492 L220,510 L215,525 L192,530 L178,515 Z' },
    // Đắk Lắk
    { id: 'VN-DL', d: 'M115,488 L158,480 L172,502 L168,528 L138,535 L112,520 Z' },
    // Đắk Nông
    { id: 'VN-DNo', d: 'M108,520 L140,515 L150,535 L145,555 L122,560 L105,545 Z' },
    // Khánh Hoà
    { id: 'VN-KH', d: 'M192,525 L220,518 L230,538 L225,558 L200,562 L188,548 Z' },
    // Lâm Đồng
    { id: 'VN-LD', d: 'M135,548 L170,540 L188,558 L182,580 L155,588 L130,575 Z' },
    // Ninh Thuận
    { id: 'VN-NT', d: 'M200,558 L225,552 L232,568 L228,582 L208,586 L198,572 Z' },
    // Bình Thuận
    { id: 'VN-BTh', d: 'M175,580 L210,575 L228,590 L225,608 L195,615 L172,600 Z' },

    // === NAM ===
    // Bình Phước
    { id: 'VN-BP', d: 'M108,558 L138,552 L148,572 L142,592 L118,598 L105,580 Z' },
    // Tây Ninh
    { id: 'VN-TNi', d: 'M92,590 L118,585 L128,602 L122,618 L100,622 L88,608 Z' },
    // Bình Dương
    { id: 'VN-BDg', d: 'M122,595 L148,590 L155,608 L148,622 L128,625 L118,612 Z' },
    // Đồng Nai
    { id: 'VN-DNa', d: 'M148,585 L182,578 L195,598 L190,620 L162,628 L145,612 Z' },
    // TP. Hồ Chí Minh
    { id: 'VN-HCM', d: 'M115,618 L148,612 L158,628 L152,645 L128,650 L112,638 Z' },
    // Bà Rịa - Vũng Tàu
    { id: 'VN-BRVT', d: 'M165,622 L195,615 L205,632 L198,648 L175,652 L162,638 Z' },
    // Long An
    { id: 'VN-LA', d: 'M82,635 L112,628 L122,645 L115,662 L90,668 L78,652 Z' },
    // Tiền Giang
    { id: 'VN-TG', d: 'M108,658 L138,652 L148,668 L142,682 L118,685 L105,672 Z' },
    // Bến Tre
    { id: 'VN-BTr', d: 'M138,668 L165,662 L172,678 L168,692 L145,695 L135,682 Z' },
    // Đồng Tháp
    { id: 'VN-DT', d: 'M62,655 L90,648 L100,665 L95,682 L72,688 L58,672 Z' },
    // Vĩnh Long
    { id: 'VN-VL', d: 'M108,680 L135,675 L142,690 L138,705 L115,708 L105,695 Z' },
    // An Giang
    { id: 'VN-AG', d: 'M42,672 L68,665 L78,682 L72,700 L50,705 L38,690 Z' },
    // Trà Vinh
    { id: 'VN-TV', d: 'M138,695 L165,690 L172,705 L168,718 L145,722 L135,708 Z' },
    // Cần Thơ
    { id: 'VN-CTh', d: 'M82,695 L108,690 L115,705 L110,718 L88,722 L78,708 Z' },
    // Hậu Giang
    { id: 'VN-HGi', d: 'M78,718 L105,712 L112,728 L108,742 L85,745 L75,732 Z' },
    // Sóc Trăng
    { id: 'VN-ST', d: 'M110,725 L140,718 L148,735 L142,750 L118,755 L108,740 Z' },
    // Kiên Giang
    { id: 'VN-KG', d: 'M30,705 L62,698 L72,718 L68,745 L42,755 L25,738 Z' },
    // Bạc Liêu
    { id: 'VN-BLi', d: 'M82,745 L112,738 L120,755 L115,770 L90,775 L78,760 Z' },
    // Cà Mau
    { id: 'VN-CM', d: 'M55,760 L88,752 L98,772 L92,795 L65,800 L48,785 Z' },
  ]

  provincePaths.value = pathData
}

// Get label position (center of path bounding box approximation)
function getLabelPosition(pathId: string): { x: number; y: number } | null {
  if (!svgContainer.value) return null
  const el = svgContainer.value.querySelector(`[data-id="${pathId}"]`) as SVGPathElement | null
  if (!el) return null
  const bbox = el.getBBox()
  return { x: bbox.x + bbox.width / 2, y: bbox.y + bbox.height / 2 }
}
</script>

<template>
  <div
    ref="svgContainer"
    class="relative w-full h-full flex items-center justify-center"
  >
    <svg
      viewBox="0 0 340 810"
      class="w-full h-full max-h-[70vh] md:max-h-full"
      preserveAspectRatio="xMidYMid meet"
      style="filter: drop-shadow(0 0 20px rgba(56, 189, 248, 0.1))"
    >
      <!-- Water / background -->
      <rect x="0" y="0" width="340" height="810" fill="#0F1923" rx="0" />

      <!-- Province paths -->
      <g>
        <path
          v-for="p in provincePaths"
          :key="p.id"
          :data-id="p.id"
          :d="p.d"
          :fill="getPathFill(p.id)"
          :stroke="getPathStroke(p.id)"
          stroke-width="1"
          class="transition-all duration-200 cursor-pointer"
          :class="{
            'animate-shake': wrongProvinceId === p.id,
            'animate-pulse-hint': hintedProvinceId === p.id,
          }"
          @mouseenter="onMouseEnter(p.id)"
          @mouseleave="onMouseLeave()"
          @dragover="onDragOver"
          @drop="(e: DragEvent) => onDrop(e, p.id)"
          @click="onPathClick(p.id)"
        />
      </g>

      <!-- Labels for correctly placed provinces -->
      <g v-for="p in provincePaths" :key="'label-' + p.id">
        <template v-if="correctSvgIds.has(p.id) && svgIdToProvince.get(p.id)">
          <text
            :x="(() => { const el = svgContainer?.querySelector(`[data-id='${p.id}']`) as SVGPathElement | null; if (!el) return 0; const b = el.getBBox(); return b.x + b.width / 2 })()"
            :y="(() => { const el = svgContainer?.querySelector(`[data-id='${p.id}']`) as SVGPathElement | null; if (!el) return 0; const b = el.getBBox(); return b.y + b.height / 2 })()"
            text-anchor="middle"
            dominant-baseline="central"
            fill="#F0EDE6"
            font-size="6"
            font-family="'Be Vietnam Pro', sans-serif"
            font-weight="500"
            class="pointer-events-none select-none"
          >
            {{ svgIdToProvince.get(p.id)?.shortName }}
          </text>
        </template>
      </g>
    </svg>
  </div>
</template>

<style scoped>
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-3px); }
  40% { transform: translateX(3px); }
  60% { transform: translateX(-3px); }
  80% { transform: translateX(3px); }
}

@keyframes pulse-hint {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}

.animate-shake {
  animation: shake 0.6s ease-in-out;
}

.animate-pulse-hint {
  animation: pulse-hint 0.6s ease-in-out 3;
}
</style>
