<script setup lang="ts">
import { ref, computed } from 'vue'
import { useElementSize, useWindowSize } from '@vueuse/core'
import type { Track } from '../types'

const props = defineProps<{
  tracks: Track[]
  currentStep: number
  stepCount: number
  selectedTrackId: string | null
}>()

const emit = defineEmits<{
  (e: 'toggleStep', trackId: string, step: number): void
  (e: 'setVelocity', trackId: string, step: number, velocity: number): void
  (e: 'selectTrack', trackId: string): void
}>()

// wrapperRef: measures viewport width (no overflow side-effects)
// innerRef:   the actual grid div has an explicit pixel width so
//             the parent overflow-auto container scrolls naturally.
const wrapperRef = ref<HTMLElement | null>(null)
const { width } = useElementSize(wrapperRef)
const { width: winW } = useWindowSize()

const isMobile = computed(() => winW.value < 640)
const TRACK_HEIGHT = computed(() => (isMobile.value ? 44 : 40))
const HEADER_HEIGHT = 28
const GAP = 1

const cellW = computed(() => {
  // Minimum 32px on mobile for comfortable touch, 20px on desktop
  const minW = isMobile.value ? 32 : 20
  // Fit all cells + gaps exactly within the measured viewport width.
  // total = stepCount * cellW + (stepCount - 1) * GAP <= width
  // => cellW = (width - (stepCount - 1) * GAP) / stepCount
  return Math.max(minW, (width.value - (props.stepCount - 1) * GAP) / props.stepCount)
})

// Explicit inner pixel width — lets parent scroll for 64-step mode.
const innerWidth = computed(() => props.stepCount * cellW.value + (props.stepCount - 1) * GAP)

const stageH = computed(() => props.tracks.length * (TRACK_HEIGHT.value + GAP) + HEADER_HEIGHT)

// Dragging velocity
const dragging = ref(false)
const dragTrackId = ref<string | null>(null)
const dragStep = ref(-1)
const startY = ref(0)
const startVelocity = ref(100)

const onCellMousedown = (e: MouseEvent, trackId: string, step: number) => {
  const track = props.tracks.find((t) => t.id === trackId)
  if (!track) return
  const cell = track.steps[step]
  if (!cell) return

  if (e.button === 2) {
    // Right click: start velocity drag
    e.preventDefault()
    if (!cell.active) {
      emit('toggleStep', trackId, step)
    }
    dragging.value = true
    dragTrackId.value = trackId
    dragStep.value = step
    startY.value = e.clientY
    startVelocity.value = cell.velocity

    const onMove = (me: MouseEvent) => {
      const delta = Math.round((startY.value - me.clientY) / 1.5)
      emit('setVelocity', trackId, step, Math.max(1, Math.min(127, startVelocity.value + delta)))
    }
    const onUp = () => {
      dragging.value = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  } else {
    // Left click: toggle
    emit('toggleStep', trackId, step)
  }
}

// Touch support for step toggle
const onCellTouchstart = (e: TouchEvent, trackId: string, step: number) => {
  e.preventDefault() // prevent mousedown from firing
  emit('toggleStep', trackId, step)
  emit('selectTrack', trackId)
}

// Compute beat group shade alternation
const getBeatGroup = (step: number) => Math.floor(step / 4) % 2

const getVelocityAlpha = (velocity: number) => 0.3 + (velocity / 127) * 0.7
</script>

<template>
  <!-- wrapperRef measures the available viewport width (no overflow, no scrollbar side-effects) -->
  <div ref="wrapperRef" class="w-full" :style="{ height: `${stageH}px` }">
    <!-- inner div has the exact pixel width of the grid; parent overflow-auto handles scroll for 64-step mode -->
    <div class="relative select-none" :style="{ width: `${innerWidth}px`, height: `${stageH}px` }">
      <!-- Step header labels -->
      <div class="absolute top-0 left-0 right-0 flex" :style="{ height: `${HEADER_HEIGHT}px` }">
        <div
          v-for="step in stepCount"
          :key="step - 1"
          class="flex items-center justify-center text-center flex-shrink-0"
          :style="{ width: `${cellW}px`, marginRight: `${GAP}px` }"
        >
          <span
            class="text-[8px] font-display"
            :class="(step - 1) % 4 === 0 ? 'text-accent-amber' : 'text-border-default'"
          >
            {{ (step - 1) % 4 === 0 ? Math.floor((step - 1) / 4) + 1 : '' }}
          </span>
        </div>
      </div>

      <!-- Tracks -->
      <div
        v-for="(track, ti) in tracks"
        :key="track.id"
        class="absolute flex"
        :style="{
          top: `${HEADER_HEIGHT + ti * (TRACK_HEIGHT + GAP)}px`,
          left: 0,
          width: `${innerWidth}px`,
          height: `${TRACK_HEIGHT}px`,
        }"
      >
        <div
          v-for="step in stepCount"
          :key="step - 1"
          class="relative flex-shrink-0 cursor-pointer transition-colors duration-75 touch-none"
          :style="{
            width: `${cellW}px`,
            height: `${TRACK_HEIGHT}px`,
            marginRight: `${GAP}px`,
          }"
          :class="selectedTrackId === track.id ? '' : ''"
          @mousedown="(e) => onCellMousedown(e, track.id, step - 1)"
          @touchstart.prevent="(e) => onCellTouchstart(e, track.id, step - 1)"
          @click="emit('selectTrack', track.id)"
          @contextmenu.prevent
        >
          <!-- Cell background (beat group shading) -->
          <div
            class="absolute inset-0"
            :class="getBeatGroup(step - 1) === 0 ? 'bg-bg-surface' : 'bg-bg-elevated'"
          ></div>

          <!-- Active cell fill -->
          <div
            v-if="track.steps[step - 1]?.active"
            class="absolute inset-0 transition-opacity"
            :style="{
              backgroundColor: track.color,
              opacity: getVelocityAlpha(track.steps[step - 1]!.velocity),
            }"
          ></div>

          <!-- Playhead overlay -->
          <div
            v-if="currentStep === step - 1"
            class="absolute inset-0 bg-white/20 pointer-events-none"
          ></div>

          <!-- Velocity bar at bottom of active cell -->
          <div
            v-if="track.steps[step - 1]?.active"
            class="absolute bottom-0 left-0 right-0 bg-white/30"
            :style="{ height: `${Math.round((track.steps[step - 1]!.velocity / 127) * 6)}px` }"
          ></div>

          <!-- Beat marker (bottom-right dot) -->
          <div
            v-if="(step - 1) % 4 === 0"
            class="absolute top-1 right-1 size-1 bg-text-secondary/20 rounded-full"
          ></div>
        </div>
      </div>

      <!-- Playhead vertical line -->
      <div
        v-if="currentStep >= 0"
        class="absolute top-0 bottom-0 w-0.5 bg-white/40 pointer-events-none transition-all duration-75"
        :style="{ left: `${currentStep * (cellW + GAP) + cellW / 2}px` }"
      ></div>
    </div>
  </div>
</template>
