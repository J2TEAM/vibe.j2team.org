<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

defineProps<{
  startMenuOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'toggleStartMenu'): void
}>()

const currentTime = ref('')
let timer: number

const updateTime = () => {
  const now = new Date()
  let hours = now.getHours()
  const minutes = now.getMinutes()
  const ampm = hours >= 12 ? 'PM' : 'AM'
  
  hours = hours % 12
  hours = hours ? hours : 12 // the hour '0' should be '12'
  const minutesStr = minutes < 10 ? '0' + minutes : minutes
  
  currentTime.value = `${hours}:${minutesStr} ${ampm}`
}

onMounted(() => {
  updateTime()
  timer = window.setInterval(updateTime, 1000)
})

onUnmounted(() => {
  clearInterval(timer)
})
</script>

<template>
  <div class="absolute bottom-0 left-0 right-0 h-[30px] bg-gradient-to-b from-[#245edb] via-[#3f8cf3] to-[#245edb] flex items-center z-50 shadow-[0_-1px_1px_rgba(255,255,255,0.4)] overflow-hidden">
    <!-- Start Button -->
    <button 
      class="h-[30px] pr-5 pl-2 rounded-r-[15px] bg-gradient-to-b from-[#349e5e] via-[#48c973] to-[#2b8a4f] text-white font-bold italic drop-shadow-md flex items-center gap-2 transition-all hover:brightness-110 active:brightness-90 flex-shrink-0"
      :class="{ 'brightness-90 bg-gradient-to-t shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]': startMenuOpen }"
      @click.stop="emit('toggleStartMenu')"
      style="text-shadow: 1px 1px 2px rgba(0,0,0,0.6); box-shadow: inset 0 1px 1px rgba(255,255,255,0.6), 2px 0 3px rgba(0,0,0,0.4);"
    >
      <div class="w-5 h-5 flex flex-wrap gap-0.5 transform -skew-x-6 drop-shadow-md">
        <div class="w-2 h-2 bg-[#ff5722] rounded-sm"></div>
        <div class="w-2 h-2 bg-[#8bc34a] rounded-sm"></div>
        <div class="w-2 h-2 bg-[#03a9f4] rounded-sm"></div>
        <div class="w-2 h-2 bg-[#ffc107] rounded-sm"></div>
      </div>
      <span class="text-xl tracking-wide -ml-1 mt-0.5" style="font-family: 'Franklin Gothic Medium', 'Arial Narrow', Arial, sans-serif;">start</span>
    </button>

    <!-- Taskbar Tabs Container (Middle) -->
    <div class="flex-1 px-1 h-full flex flex-wrap items-center overflow-hidden gap-1 pl-3">
       <slot></slot>
    </div>

    <!-- System Tray Area -->
    <div class="h-full bg-gradient-to-b from-[#0e9ae1] to-[#1281cb] border-l border-[#136eb1] shadow-[inset_1px_0_0_rgba(255,255,255,0.3)] flex items-center justify-end px-3 gap-3 ml-auto text-white flex-shrink-0">
      <div class="flex gap-1">
         <div class="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]" title="Volume">🔊</div>
         <div class="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]" title="Network">💻</div>
      </div>
      <span class="text-xs cursor-default drop-shadow-md" style="font-family: Tahoma, sans-serif;">{{ currentTime }}</span>
    </div>
  </div>
</template>
