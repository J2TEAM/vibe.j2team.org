<template>
  <div class="flex flex-col items-center w-full">
    <p class="text-text-primary font-display font-medium text-lg mb-4 text-center">
      Di chuột <span class="italic">loằng ngoằng</span> bên trong ô vuông này.
    </p>

    <div
      class="w-full max-w-sm h-48 bg-bg-surface border-2 border-dashed relative overflow-hidden flex flex-col items-center justify-center transition-colors"
      :class="boxClass"
      @mousemove="onMouseMove"
      @mouseleave="onMouseLeave"
    >
      <p
        v-if="state === 'idle' || state === 'failed'"
        class="text-text-dim text-sm text-center px-4 font-mono pointer-events-none"
      >
        Hover và di chuyển loạn xạ lên để chứng minh không phải là rùa.
      </p>
      <p
        v-else-if="state === 'tracking'"
        class="text-accent-sky font-bold text-lg z-10 pointer-events-none"
      >
        Đang theo dõi...
      </p>
      <p
        v-else-if="state === 'success'"
        class="text-emerald-500 font-bold text-xl z-10 pointer-events-none uppercase tracking-widest"
      >
        Đạt yêu cầu!
      </p>

      <!-- Show tiny path dots just for fun visualization -->
      <div
        v-for="(pt, idx) in path"
        :key="idx"
        class="absolute w-1 h-1 bg-accent-sky/30 rounded-full pointer-events-none"
        :style="{ left: pt.x + 'px', top: pt.y + 'px' }"
      />
    </div>

    <p v-if="state === 'failed'" class="mt-4 text-sm text-accent-coral font-medium text-center">
      Chuyển động quá máy móc hoặc chưa đủ rối rắm. Hãy thử lại.
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const emit = defineEmits(['pass'])

type State = 'idle' | 'tracking' | 'failed' | 'success'
const state = ref<State>('idle')

interface Point {
  x: number
  y: number
}
const path = ref<Point[]>([])

let trackingTimeout: number | null = null

const boxClass = computed(() => {
  if (state.value === 'tracking') return 'border-accent-sky shadow-[0_0_15px_rgba(56,189,248,0.2)]'
  if (state.value === 'success') return 'border-emerald-500 bg-emerald-500/5'
  if (state.value === 'failed') return 'border-accent-coral bg-accent-coral/5'
  return 'border-border-default'
})

const checkHumanity = () => {
  if (path.value.length < 20) {
    state.value = 'failed'
    return
  }

  // Calculate direction changes
  let directionChanges = 0
  for (let i = 2; i < path.value.length; i++) {
    const p1 = path.value[i - 2]
    const p2 = path.value[i - 1]
    const p3 = path.value[i]
    if (!p1 || !p2 || !p3) continue

    // Cross product to find direction change (>0 left, <0 right)
    const crossProduct = (p2.x - p1.x) * (p3.y - p2.y) - (p2.y - p1.y) * (p3.x - p2.x)
    if (Math.abs(crossProduct) > 50) {
      // arbitrary threshold for "wiggle"
      directionChanges++
    }
  }

  // Calculate variance (spreadness of points)
  const xs = path.value.map((p) => p.x)
  const ys = path.value.map((p) => p.y)
  const minX = Math.min(...xs),
    maxX = Math.max(...xs)
  const minY = Math.min(...ys),
    maxY = Math.max(...ys)

  const spreadScore = maxX - minX + (maxY - minY)

  if (directionChanges > 5 && spreadScore > 100) {
    state.value = 'success'
    setTimeout(() => {
      emit('pass')
    }, 1000)
  } else {
    state.value = 'failed'
  }
}

const onMouseMove = (e: MouseEvent) => {
  if (state.value === 'success') return

  if (state.value !== 'tracking') {
    state.value = 'tracking'
    path.value = []

    // Check results after 2.5 seconds of hovering
    if (trackingTimeout) clearTimeout(trackingTimeout)
    trackingTimeout = window.setTimeout(() => {
      checkHumanity()
    }, 2500)
  }

  // Throttle points visually a bit, but capture for logic
  // Just use offset within the box
  const target = e.target as HTMLElement
  const rect = target.getBoundingClientRect()

  // To avoid storing too many points:
  if (path.value.length === 0 || Math.random() > 0.3) {
    path.value.push({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }
}

const onMouseLeave = () => {
  if (state.value === 'tracking') {
    if (trackingTimeout) clearTimeout(trackingTimeout)
    state.value = 'failed'
    path.value = []
  }
}
</script>
