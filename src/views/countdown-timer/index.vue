<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useNow } from '@vueuse/core'

const now = useNow({ interval: 1000 })
const targetDateInput = ref('')
const targetDate = ref<Date | null>(null)
const isExpired = computed(() => targetDate.value && now.value >= targetDate.value)

onMounted(() => {
  // Default to tomorrow at midnight
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)
  targetDate.value = tomorrow
  
  // Format for local datetime-local input: YYYY-MM-DDThh:mm
  const offset = tomorrow.getTimezoneOffset()
  const adjusted = new Date(tomorrow.getTime() - (offset * 60 * 1000))
  targetDateInput.value = adjusted.toISOString().slice(0, 16)
})

const parseTargetDate = () => {
  if (targetDateInput.value) {
    targetDate.value = new Date(targetDateInput.value)
  }
}

const timeRemaining = computed(() => {
  if (!targetDate.value) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  const diff = targetDate.value.getTime() - now.value.getTime()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / 1000 / 60) % 60),
    seconds: Math.floor((diff / 1000) % 60)
  }
})

const formatNumber = (num: number) => num.toString().padStart(2, '0')
</script>

<template>
  <div class="min-h-screen bg-[#000000] text-text-primary font-body flex flex-col relative overflow-hidden selection:bg-white/20">
    <!-- Ambient glowing liquid background -->
    <div class="absolute inset-0 z-0 pointer-events-none opacity-50">
      <div class="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-accent-sky/30 rounded-full mix-blend-screen filter blur-[120px] animate-pulse"></div>
      <div class="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent-amber/30 rounded-full mix-blend-screen filter blur-[120px] animate-pulse" style="animation-duration: 4s; animation-delay: 1s;"></div>
    </div>

    <!-- Top Navigation -->
    <header class="relative z-10 p-6 flex items-center justify-between">
      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm text-text-dim transition hover:text-white hover:bg-white/10 backdrop-blur-md"
      >
        <Icon icon="lucide:arrow-left" class="size-4" />
        Về trang chủ
      </RouterLink>
    </header>

    <main class="relative z-10 flex-1 flex flex-col items-center justify-center px-4 w-full max-w-4xl mx-auto pb-16">
      <div 
        class="w-full flex flex-col items-center p-8 sm:p-12 rounded-[2rem] border border-white/20 border-t-white/40 border-b-black/40 bg-white/5 backdrop-blur-[32px] shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),_0_20px_60px_rgba(0,0,0,0.6)] transition-all duration-700"
        :class="isExpired ? 'shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),_0_20px_80px_rgba(239,68,68,0.4)] border-accent-coral/30 hover:border-accent-coral/50' : ''"
      >
        <h1 class="text-4xl sm:text-5xl font-display text-white font-light tracking-wider mb-12 text-center drop-shadow-lg transition-colors">
          {{ isExpired ? 'Thời gian đã điểm!' : 'Đếm Ngược' }}
        </h1>

        <!-- Timer Display -->
        <div class="flex items-center justify-center gap-3 sm:gap-6 mb-12">
          <!-- Days -->
          <div class="flex flex-col items-center">
            <div class="w-16 h-16 sm:w-24 sm:h-24 flex items-center justify-center text-3xl sm:text-5xl font-display text-white font-light tracking-widest bg-white/10 rounded-2xl border border-white/10 shadow-inner">
              {{ formatNumber(timeRemaining.days) }}
            </div>
            <span class="text-text-dim text-xs tracking-widest uppercase mt-4">Ngày</span>
          </div>
          <div class="text-2xl sm:text-4xl text-white/30 font-light -mt-8 mx-1">:</div>
          <!-- Hours -->
          <div class="flex flex-col items-center">
            <div class="w-16 h-16 sm:w-24 sm:h-24 flex items-center justify-center text-3xl sm:text-5xl font-display text-white font-light tracking-widest bg-white/10 rounded-2xl border border-white/10 shadow-inner">
              {{ formatNumber(timeRemaining.hours) }}
            </div>
            <span class="text-text-dim text-xs tracking-widest uppercase mt-4">Giờ</span>
          </div>
          <div class="text-2xl sm:text-4xl text-white/30 font-light -mt-8 mx-1">:</div>
          <!-- Minutes -->
          <div class="flex flex-col items-center">
            <div class="w-16 h-16 sm:w-24 sm:h-24 flex items-center justify-center text-3xl sm:text-5xl font-display text-white font-light tracking-widest bg-white/10 rounded-2xl border border-white/10 shadow-inner">
              {{ formatNumber(timeRemaining.minutes) }}
            </div>
            <span class="text-text-dim text-xs tracking-widest uppercase mt-4">Phút</span>
          </div>
          <div class="text-2xl sm:text-4xl text-white/30 font-light -mt-8 mx-1">:</div>
          <!-- Seconds -->
          <div class="flex flex-col items-center">
            <div class="w-16 h-16 sm:w-24 sm:h-24 flex items-center justify-center text-3xl sm:text-5xl font-display text-white font-light tracking-widest bg-white/10 rounded-2xl border border-white/10 shadow-[inset_0_0_15px_rgba(255,255,255,0.1)] transition-transform"
                 :class="{ 'text-accent-coral scale-105 border-accent-coral/50': isExpired, 'text-accent-sky border-accent-sky/30 shadow-[inset_0_0_20px_rgba(56,189,248,0.2)]': !isExpired && timeRemaining.seconds % 2 === 0 }">
              {{ formatNumber(timeRemaining.seconds) }}
            </div>
            <span class="text-xs tracking-widest uppercase mt-4 transition-colors"
                  :class="isExpired ? 'text-accent-coral' : 'text-accent-sky/80'">Giây</span>
          </div>
        </div>

        <!-- Input Control -->
        <div class="w-full max-w-sm flex items-center gap-3">
          <Icon icon="lucide:calendar" class="size-5 text-text-dim" />
          <input 
            type="datetime-local" 
            v-model="targetDateInput"
            @change="parseTargetDate"
            class="flex-1 bg-black/50 border border-white/10 rounded-full px-5 py-3 text-sm text-white placeholder:text-text-dim focus:border-accent-sky focus:outline-none transition-all shadow-inner"
          />
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* Hidden scrollbars or any highly specific customizations */
input[type="datetime-local"]::-webkit-calendar-picker-indicator {
  filter: invert(1);
  cursor: pointer;
  opacity: 0.7;
}
input[type="datetime-local"]::-webkit-calendar-picker-indicator:hover {
  opacity: 1;
}
</style>
