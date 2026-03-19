<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import type { Province } from '../types'
import { provinces } from '../data/provinces'
import { useMapZoom } from '../composables/useMapZoom'

// [Optimization] MapPathData type được inline thay vì import từ map-paths.ts.
// File map-paths.ts (412 kB) đã được convert sang public/blind-map-challenge/blind-map-paths.json
// và load async qua fetch() để tránh bundle 442 kB vào GameScreen chunk.
type MapPathData = { id: string; d: string; cx: number; cy: number }

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
const mapContainer = ref<HTMLDivElement | null>(null)
const zoom = useMapZoom(mapContainer)

const isMobile = ref(false)

// [Optimization] Thay vì import { mapPaths, vietnamOutline } from '../data/map-paths' (412 kB),
// dữ liệu được fetch lazy từ public/blind-map-challenge/blind-map-paths.json khi component mount.
// Điều này giúp GameScreen chunk giảm từ ~442 kB xuống ~25 kB.
// JSON được tạo bằng: node scripts/generate-map-data.mjs (cần chạy lại sau khi cập nhật map-paths.ts).
const mapPaths = ref<MapPathData[]>([])
const vietnamOutline = ref('')
const mapDataLoading = ref(true)

onMounted(async () => {
  isMobile.value = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  )
  const response = await fetch('/blind-map-challenge/blind-map-paths.json')
  const mapData = (await response.json()) as { mapPaths: MapPathData[]; vietnamOutline: string }
  mapPaths.value = mapData.mapPaths
  vietnamOutline.value = mapData.vietnamOutline
  mapDataLoading.value = false
})

// Build a map from svgPathId to province for quick lookup
const svgIdToProvince = computed(() => {
  const map = new Map<string, Province>()
  provinces.forEach((p) => map.set(p.svgPathId, p))
  return map
})

// Build map of correctly placed provinces
const correctSvgIds = computed(() => {
  const ids = new Set<string>()
  props.placedProvinces.forEach((placed) => {
    if (placed.status === 'correct') {
      const prov = provinces.find((p) => p.id === placed.provinceId)
      if (prov) ids.add(prov.svgPathId)
    }
  })
  return ids
})

// Province zone color mapping for correct provinces
const zoneColors: Record<string, { fill: string; stroke: string }> = {
  Bắc: { fill: '#38BDF8', stroke: '#7DD3FC' }, // sky
  Trung: { fill: '#34D399', stroke: '#6EE7B7' }, // emerald
  Nam: { fill: '#FBBF24', stroke: '#FCD34D' }, // amber
}

function getZoneForSvgId(svgPathId: string): string {
  const prov = svgIdToProvince.value.get(svgPathId)
  return prov?.zone ?? 'Bắc'
}

// Determine fill color for each province path
function getPathFill(svgPathId: string): string {
  if (props.wrongProvinceId === svgPathId) return '#FF6B4A'
  if (props.hintedProvinceId === svgPathId) return 'rgba(56, 189, 248, 0.45)'
  if (correctSvgIds.value.has(svgPathId)) {
    const zone = getZoneForSvgId(svgPathId)
    return zoneColors[zone]?.fill ?? '#38BDF8'
  }
  if (hoveredPath.value === svgPathId && props.selectedProvinceId) return '#1E3A52'
  if (hoveredPath.value === svgPathId) return '#1A3040'
  return '#14283A'
}

function getPathStroke(svgPathId: string): string {
  if (props.wrongProvinceId === svgPathId) return '#FF6B4A'
  if (props.hintedProvinceId === svgPathId) return '#38BDF8'
  if (correctSvgIds.value.has(svgPathId)) {
    const zone = getZoneForSvgId(svgPathId)
    return zoneColors[zone]?.stroke ?? '#7DD3FC'
  }
  if (hoveredPath.value === svgPathId) return '#38BDF8'
  return '#1E3448'
}

function getStrokeWidth(svgPathId: string): number {
  if (props.wrongProvinceId === svgPathId) return 2
  if (props.hintedProvinceId === svgPathId) return 2
  if (correctSvgIds.value.has(svgPathId)) return 1.2
  if (hoveredPath.value === svgPathId) return 1.5
  return 0.8
}

// Show shortName label when zoomed in enough
const showLabels = computed(() => zoom.scale.value >= 1.5)

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
  // Suppress click if user was panning
  if (zoom.wasDragging.value) return
  emit('click-province', svgPathId)
}

function onMouseEnter(svgPathId: string) {
  hoveredPath.value = svgPathId
}

function onMouseLeave() {
  hoveredPath.value = null
}

// Hovered province name (for tooltip)
const hoveredProvinceName = computed(() => {
  if (!hoveredPath.value) return ''
  const prov = svgIdToProvince.value.get(hoveredPath.value)
  if (!prov) return ''
  // If correctly placed, show name; otherwise show "?"
  if (correctSvgIds.value.has(hoveredPath.value)) return prov.name
  return ''
})
</script>

<template>
  <div class="relative w-full h-full select-none">
    <!-- Map loading skeleton -->
    <div v-if="mapDataLoading" class="absolute inset-0 flex items-center justify-center bg-bg-base">
      <Icon icon="lucide:loader-circle" class="size-8 text-accent-sky animate-spin" />
    </div>

    <!-- Map viewport (handles zoom/pan) -->
    <div
      v-if="!mapDataLoading"
      ref="mapContainer"
      class="relative w-full h-full overflow-hidden touch-none"
      :class="{ 'cursor-grabbing': zoom.isPanning.value, 'cursor-grab': !zoom.isPanning.value }"
    >
      <div
        class="w-full h-full flex items-center justify-center transition-transform duration-100 ease-out will-change-transform"
        :style="{ transform: zoom.transform.value, transformOrigin: 'center center' }"
      >
        <svg
          viewBox="-20 -20 743 920"
          class="w-full h-full max-h-[80vh] md:max-h-full"
          preserveAspectRatio="xMidYMid meet"
          shape-rendering="geometricPrecision"
        >
          <defs>
            <!-- Sea gradient -->
            <radialGradient id="sea-gradient" cx="50%" cy="40%" r="65%">
              <stop offset="0%" stop-color="#0D2137" />
              <stop offset="100%" stop-color="#081420" />
            </radialGradient>
            <!-- Glow filter for correct provinces -->
            <filter id="glow-correct" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <!-- Glow for hinted -->
            <filter id="glow-hint" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <!-- Sea background -->
          <rect x="-20" y="-20" width="743" height="920" fill="url(#sea-gradient)" />

          <!-- Vietnam national outline (coastline shadow) -->
          <path :d="vietnamOutline" fill="none" stroke="#1E3448" stroke-width="3" opacity="0.3" />

          <!-- Province paths -->
          <g>
            <path
              v-for="p in mapPaths"
              :key="p.id"
              :d="p.d"
              :fill="getPathFill(p.id)"
              :stroke="getPathStroke(p.id)"
              :stroke-width="getStrokeWidth(p.id)"
              stroke-linejoin="round"
              class="map-province"
              :class="{
                'animate-shake': wrongProvinceId === p.id,
                'animate-pulse-hint': hintedProvinceId === p.id,
                'province-correct': correctSvgIds.has(p.id),
                'province-hovered': hoveredPath === p.id && selectedProvinceId,
              }"
              :filter="
                isMobile
                  ? undefined
                  : hintedProvinceId === p.id
                    ? 'url(#glow-hint)'
                    : correctSvgIds.has(p.id)
                      ? 'url(#glow-correct)'
                      : undefined
              "
              @mouseenter="onMouseEnter(p.id)"
              @mouseleave="onMouseLeave()"
              @dragover="onDragOver"
              @drop="(e: DragEvent) => onDrop(e, p.id)"
              @click="onPathClick(p.id)"
            />
          </g>

          <!-- Labels for correctly placed provinces -->
          <g v-if="showLabels">
            <template v-for="p in mapPaths" :key="'label-' + p.id">
              <text
                v-if="correctSvgIds.has(p.id) && svgIdToProvince.get(p.id)"
                :x="p.cx"
                :y="p.cy"
                text-anchor="middle"
                dominant-baseline="central"
                fill="#F0EDE6"
                :font-size="Math.max(5, 8 / zoom.scale.value)"
                font-family="'Be Vietnam Pro', sans-serif"
                font-weight="600"
                class="pointer-events-none select-none"
                opacity="0.9"
              >
                {{ svgIdToProvince.get(p.id)?.shortName }}
              </text>
            </template>
          </g>

          <!-- Dot labels for correctly placed provinces (when zoomed out) -->
          <g v-if="!showLabels">
            <template v-for="p in mapPaths" :key="'dot-' + p.id">
              <circle
                v-if="correctSvgIds.has(p.id)"
                :cx="p.cx"
                :cy="p.cy"
                r="2"
                fill="#F0EDE6"
                opacity="0.6"
                class="pointer-events-none"
              />
            </template>
          </g>
        </svg>
      </div>
    </div>

    <!-- Hover tooltip -->
    <Transition name="tooltip">
      <div
        v-if="hoveredProvinceName"
        class="absolute top-3 left-1/2 -translate-x-1/2 border border-accent-sky/30 bg-bg-surface/90 backdrop-blur-sm px-3 py-1.5 text-xs font-display text-accent-sky pointer-events-none z-10 whitespace-nowrap"
      >
        {{ hoveredProvinceName }}
      </div>
    </Transition>

    <!-- Zoom controls -->
    <div class="absolute bottom-3 right-3 flex flex-col gap-1.5 z-10">
      <button class="zoom-btn" title="Phóng to" @click="zoom.zoomIn()">
        <Icon icon="lucide:plus" class="size-4" />
      </button>
      <div
        class="border border-border-default bg-bg-surface/90 backdrop-blur-sm px-1.5 py-0.5 text-[10px] font-display text-text-dim text-center min-w-[36px] tabular-nums"
      >
        {{ zoom.zoomPercent.value }}%
      </div>
      <button class="zoom-btn" title="Thu nhỏ" @click="zoom.zoomOut()">
        <Icon icon="lucide:minus" class="size-4" />
      </button>
      <button class="zoom-btn mt-1" title="Đặt lại zoom" @click="zoom.resetZoom()">
        <Icon icon="lucide:maximize-2" class="size-3.5" />
      </button>
    </div>

    <!-- Region legend -->
    <div class="absolute bottom-3 left-3 flex flex-col gap-1 z-10">
      <div class="flex items-center gap-1.5 text-[10px] font-display text-text-dim">
        <span class="inline-block w-2 h-2 rounded-full bg-[#38BDF8]" />
        Bắc
      </div>
      <div class="flex items-center gap-1.5 text-[10px] font-display text-text-dim">
        <span class="inline-block w-2 h-2 rounded-full bg-[#34D399]" />
        Trung
      </div>
      <div class="flex items-center gap-1.5 text-[10px] font-display text-text-dim">
        <span class="inline-block w-2 h-2 rounded-full bg-[#FBBF24]" />
        Nam
      </div>
    </div>
  </div>
</template>

<style scoped>
.will-change-transform {
  will-change: transform;
}

.map-province {
  transition:
    fill 0.2s ease,
    stroke 0.2s ease,
    stroke-width 0.15s ease;
  cursor: pointer;
}

.province-hovered {
  filter: brightness(1.3);
}

.zoom-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--color-border-default);
  background: color-mix(in srgb, var(--color-bg-surface) 90%, transparent);
  backdrop-filter: blur(8px);
  color: var(--color-text-secondary);
  transition: all 0.15s ease;
}
.zoom-btn:hover {
  border-color: var(--color-accent-sky);
  color: var(--color-accent-sky);
  background: var(--color-bg-elevated);
}
.zoom-btn:active {
  transform: scale(0.92);
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  20% {
    transform: translateX(-3px);
  }
  40% {
    transform: translateX(3px);
  }
  60% {
    transform: translateX(-3px);
  }
  80% {
    transform: translateX(3px);
  }
}

@keyframes pulse-hint {
  0%,
  100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
}

.animate-shake {
  animation: shake 0.5s ease-in-out;
}

.animate-pulse-hint {
  animation: pulse-hint 0.7s ease-in-out 3;
}

.tooltip-enter-active,
.tooltip-leave-active {
  transition: all 0.15s ease;
}
.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
  transform: translate(-50%, -4px);
}
</style>
