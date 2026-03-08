<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  x: number
  y: number
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'action', actionName: string): void
}>()

const menuRef = ref<HTMLElement | null>(null)

// Adjust position if it goes off-screen
const adjustedX = ref(props.x)
const adjustedY = ref(props.y)

onMounted(() => {
  if (menuRef.value) {
    const rect = menuRef.value.getBoundingClientRect()
    if (props.x + rect.width > window.innerWidth) {
      adjustedX.value = window.innerWidth - rect.width - 5
    }
    if (props.y + rect.height > window.innerHeight - 40) { // 40px for taskbar
      adjustedY.value = window.innerHeight - rect.height - 45
    }
  }

  // Close on outside click is handled by the parent overlay mostly, but fallback here
  const onClickOutside = (e: MouseEvent) => {
    // Ignore right clicks (which might be the one that opened this menu)
    if (e.button === 2) return;
    
    if (menuRef.value && !menuRef.value.contains(e.target as Node)) {
      emit('close')
    }
  }
  
  // Use timeout to prevent immediate closure on the same right click event
  setTimeout(() => window.addEventListener('mousedown', onClickOutside), 50)
  
  onUnmounted(() => {
    window.removeEventListener('mousedown', onClickOutside)
  })
})
</script>

<template>
  <div 
    ref="menuRef"
    class="absolute bg-[#f0f0f0] border border-[#716f64] shadow-[2px_2px_3px_rgba(0,0,0,0.4)] z-[100] py-0.5 min-w-[220px] font-sans text-xs text-black cursor-default select-none"
    :style="{ left: `${adjustedX}px`, top: `${adjustedY}px` }"
  >
    <div class="flex items-center px-4 py-1 hover:bg-[#316ac5] hover:text-white group" @click="emit('action', 'back')">
      <span class="flex-1">Back</span>
      <span class="text-right text-gray-500 group-hover:text-gray-300">Alt+Left Arrow</span>
    </div>
    <div class="flex items-center px-4 py-1 hover:bg-[#316ac5] hover:text-white group" @click="emit('action', 'forward')">
      <span class="flex-1">Forward</span>
      <span class="text-right text-gray-500 group-hover:text-gray-300">Alt+Right Arrow</span>
    </div>
    <div class="flex items-center px-4 py-1 hover:bg-[#316ac5] hover:text-white group" @click="emit('action', 'reload')">
      <span class="flex-1">Reload</span>
      <span class="text-right text-gray-500 group-hover:text-gray-300">Ctrl+R</span>
    </div>
    
    <div class="h-[1px] bg-[#cbcbcb] border-b border-white my-1 mx-[2px]"></div>

    <div class="flex items-center px-4 py-1 hover:bg-[#316ac5] hover:text-white group" @click="emit('action', 'save-as')">
      <span class="flex-1">Save as...</span>
      <span class="text-right text-gray-500 group-hover:text-gray-300">Ctrl+S</span>
    </div>
    <div class="flex items-center px-4 py-1 hover:bg-[#316ac5] hover:text-white group" @click="emit('action', 'print')">
      <span class="flex-1">Print...</span>
      <span class="text-right text-gray-500 group-hover:text-gray-300">Ctrl+P</span>
    </div>

    <div class="h-[1px] bg-[#cbcbcb] border-b border-white my-1 mx-[2px]"></div>
    
    <div class="flex items-center px-4 py-1 hover:bg-[#316ac5] hover:text-white group" @click="emit('action', 'view-source')">
      <span class="flex-1">View page source</span>
      <span class="text-right text-gray-500 group-hover:text-gray-300">Ctrl+U</span>
    </div>

    <div class="flex items-center px-4 py-1 hover:bg-[#316ac5] hover:text-white group" @click="emit('action', 'inspect')">
      <span class="flex-1">Inspect</span>
    </div>
  </div>
</template>

<style scoped>
/* Windows XP classic menu style adjustments */
</style>
