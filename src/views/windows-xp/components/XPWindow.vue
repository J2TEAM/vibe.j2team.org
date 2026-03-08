<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  id: string
  title: string
  icon: string
  isActive: boolean
  zIndex: number
  initialX: number
  initialY: number
  width?: string
  height?: string
}>()

const emit = defineEmits<{
  (e: 'close', id: string): void
  (e: 'focus', id: string): void
}>()

const isMaximized = ref(false)
const x = ref(props.initialX)
const y = ref(props.initialY)

// Restore points prior to maximize
const preMaxX = ref(0)
const preMaxY = ref(0)

const titleBarRef = ref<HTMLElement | null>(null)
let isDragging = false
let startX = 0
let startY = 0

const toggleMaximize = () => {
  if (isMaximized.value) {
    x.value = preMaxX.value
    y.value = preMaxY.value
    isMaximized.value = false
  } else {
    preMaxX.value = x.value
    preMaxY.value = y.value
    x.value = 0
    y.value = 0
    isMaximized.value = true
  }
}

const onPointerDown = (e: MouseEvent | TouchEvent) => {
  emit('focus', props.id) // Bring to front
  if (isMaximized.value) return // Don't drag if maximized
  
  isDragging = true
  
  const clientX = 'touches' in e ? (e.touches[0]?.clientX ?? 0) : e.clientX
  const clientY = 'touches' in e ? (e.touches[0]?.clientY ?? 0) : e.clientY
  
  startX = clientX - x.value
  startY = clientY - y.value
}

const onPointerMove = (e: MouseEvent | TouchEvent) => {
  if (!isDragging || isMaximized.value) return
  
  const clientX = 'touches' in e ? (e.touches[0]?.clientX ?? 0) : e.clientX
  const clientY = 'touches' in e ? (e.touches[0]?.clientY ?? 0) : e.clientY
  
  x.value = clientX - startX
  y.value = Math.max(0, clientY - startY) // Prevent dragging above screen
}

const onPointerUp = () => {
  isDragging = false
}


onMounted(() => {
  window.addEventListener('mousemove', onPointerMove)
  window.addEventListener('mouseup', onPointerUp)
  window.addEventListener('touchmove', onPointerMove, { passive: false })
  window.addEventListener('touchend', onPointerUp)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', onPointerMove)
  window.removeEventListener('mouseup', onPointerUp)
  window.removeEventListener('touchmove', onPointerMove)
  window.removeEventListener('touchend', onPointerUp)
})
</script>

<template>
  <div 
    class="absolute flex flex-col bg-[#ece9d8] border-3 rounded-t shadow-2xl overflow-hidden transition-all duration-75"
    :class="[
      isActive ? 'border-[#0055e5] z-50' : 'border-[#7595d6]',
      isMaximized ? 'w-full h-[calc(100vh-40px)] left-0 top-0 rounded-none' : 'rounded-t-lg'
    ]"
    :style="!isMaximized ? { left: `${x}px`, top: `${y}px`, width: width || '400px', height: height || '300px', zIndex } : { zIndex }"
    @mousedown="emit('focus', id)"
    @touchstart="emit('focus', id)"
  >
    <!-- Title Bar -->
    <div 
      ref="titleBarRef"
      class="h-[30px] flex items-center justify-between px-1 cursor-default shrink-0"
      :class="isActive ? 'bg-gradient-to-r from-[#0058e6] via-[#3a93ff] to-[#0058e6]' : 'bg-gradient-to-r from-[#7a96df] via-[#a8c0f5] to-[#7a96df]'"
      @mousedown="onPointerDown"
      @touchstart.prevent="onPointerDown"
      @dblclick="toggleMaximize"
    >
      <!-- Title + Icon -->
      <div class="flex items-center gap-1 overflow-hidden pointer-events-none">
        <span class="text-lg drop-shadow">{{ icon }}</span>
        <span class="text-white font-bold text-sm tracking-wide truncate drop-shadow" style="font-family: 'Trebuchet MS', Tahoma, sans-serif;">{{ title }}</span>
      </div>

      <!-- Controls -->
      <div class="flex gap-0.5 items-center pr-1 shrink-0">
        <button class="w-5 h-[21px] rounded-[2px] bg-gradient-to-b from-[#fff] to-[#d6d6d6] border border-white flex items-center justify-center text-xs hover:brightness-110 active:brightness-90 font-bold focus:outline-none shadow-sm" style="box-shadow: inset -1px -1px 2px rgba(0,0,0,0.3)">_</button>
        <button 
          class="w-5 h-[21px] rounded-[2px] bg-gradient-to-b from-[#fff] to-[#d6d6d6] border border-white flex items-center justify-center text-[10px] hover:brightness-110 active:brightness-90 focus:outline-none shadow-sm" 
          style="box-shadow: inset -1px -1px 2px rgba(0,0,0,0.3)"
          @click.stop="toggleMaximize"
        >
          <div class="w-2.5 h-2.5 border-t-2 border-l-2 border-r-2 border-b-2 border-black" :class="{ 'relative': isMaximized }">
            <template v-if="isMaximized">
               <div class="absolute -top-[3px] -right-[3px] w-2.5 h-2.5 border-t-2 border-r-2 border-black"></div>
            </template>
          </div>
        </button>
        <button 
          class="w-[21px] h-[21px] rounded-[2px] bg-gradient-to-b from-[#e57a55] to-[#d44026] border border-white flex items-center justify-center text-white text-md hover:brightness-110 active:brightness-90 focus:outline-none shadow-sm" 
          style="box-shadow: inset -1px -1px 2px rgba(0,0,0,0.4)"
          @click.stop="emit('close', id)"
        >
          ✕
        </button>
      </div>
    </div>

    <!-- Window Body -->
    <div class="flex-1 bg-white border border-[#0055e5] overflow-auto select-auto">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
/* Disable text selection during drag on the body */
.dragging {
  user-select: none;
}
</style>
