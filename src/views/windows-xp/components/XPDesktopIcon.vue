<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  id: string
  title: string
  icon: string
  initialX: number
  initialY: number
}>()

const emit = defineEmits<{
  (e: 'dblclick', id: string): void
}>()

const x = ref(props.initialX)
const y = ref(props.initialY)

let isDragging = false
let offsetX = 0
let offsetY = 0
const iconRef = ref<HTMLElement | null>(null)

const onPointerDown = (e: MouseEvent | TouchEvent) => {
  isDragging = true
  const clientX = 'touches' in e ? (e.touches[0]?.clientX ?? 0) : e.clientX
  const clientY = 'touches' in e ? (e.touches[0]?.clientY ?? 0) : e.clientY
  
  if (iconRef.value) {
    const rect = iconRef.value.getBoundingClientRect()
    // calculate offset relative to the component bounds
    offsetX = clientX - rect.left
    offsetY = clientY - rect.top
  }
}

const onPointerMove = (e: MouseEvent | TouchEvent) => {
  if (!isDragging) return
  
  const clientX = 'touches' in e ? (e.touches[0]?.clientX ?? 0) : e.clientX
  const clientY = 'touches' in e ? (e.touches[0]?.clientY ?? 0) : e.clientY
  
  // Set new position
  x.value = clientX - offsetX
  y.value = clientY - offsetY
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
    ref="iconRef"
    class="absolute flex flex-col items-center justify-center w-20 cursor-pointer text-white drop-shadow-md rounded p-1 touch-none"
    :class="isDragging ? 'opacity-80' : 'hover:bg-blue-300/30 active:bg-blue-600/50'"
    :style="{ left: `${x}px`, top: `${y}px` }"
    @mousedown.stop="onPointerDown"
    @touchstart.stop.prevent="onPointerDown"
    @dblclick="emit('dblclick', id)"
  >
    <div class="text-4xl drop-shadow-[2px_2px_2px_rgba(0,0,0,0.8)] filter">{{ icon }}</div>
    <span class="text-xs text-center mt-1 text-white truncate w-full" style="font-family: Tahoma, sans-serif; text-shadow: 1px 1px 2px black;">{{ title }}</span>
  </div>
</template>
