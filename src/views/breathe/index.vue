<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'

const isBreathing = ref(false)
const phase = ref<'idle' | 'inhale' | 'hold1' | 'exhale' | 'hold2'>('idle')
const text = ref('Sẵn sàng')

let timeout: ReturnType<typeof setTimeout>

const startCycle = () => {
  if (!isBreathing.value) return

  phase.value = 'inhale'
  text.value = 'Hít vào'
  timeout = setTimeout(() => {
    if (!isBreathing.value) return
    phase.value = 'hold1'
    text.value = 'Giữ'
    timeout = setTimeout(() => {
      if (!isBreathing.value) return
      phase.value = 'exhale'
      text.value = 'Thở ra'
      timeout = setTimeout(() => {
        if (!isBreathing.value) return
        phase.value = 'hold2'
        text.value = 'Giữ'
        timeout = setTimeout(startCycle, 4000)
      }, 4000)
    }, 4000)
  }, 4000)
}

const toggleBreathing = () => {
  isBreathing.value = !isBreathing.value
  if (isBreathing.value) {
    startCycle()
  } else {
    clearTimeout(timeout)
    phase.value = 'idle'
    text.value = 'Sẵn sàng'
  }
}

onUnmounted(() => {
  clearTimeout(timeout)
})
</script>

<template>
  <div class="min-h-screen bg-[#000000] text-text-primary font-body flex flex-col items-center justify-center relative overflow-hidden selection:bg-white/20">
    <!-- Ambient glowing orbs (Liquid blur) -->
    <div class="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      <!-- Glow corresponding to breathing phase -->
      <div
        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[100%] mix-blend-screen filter blur-[100px] transition-all duration-[4000ms] ease-in-out"
        :class="{
          'w-[600px] h-[600px] bg-accent-sky/30 scale-110': phase === 'inhale' || phase === 'hold1',
          'w-[400px] h-[400px] bg-accent-amber/20 scale-90': phase === 'exhale' || phase === 'hold2',
          'w-[300px] h-[300px] bg-white/5 scale-75': phase === 'idle'
        }"
      ></div>
    </div>

    <!-- UI Overlay -->
    <div class="relative z-10 w-full max-w-md mx-auto px-4 flex flex-col items-center justify-between min-h-[550px]">

      <!-- Top Text -->
      <div class="text-center mt-8 mb-8 transition-opacity duration-700" :class="isBreathing ? 'opacity-0 pointer-events-none' : 'opacity-100'">
        <h1 class="text-4xl sm:text-5xl font-display text-white font-light tracking-wider mb-3 drop-shadow-lg">Tập Thở</h1>
        <p class="text-text-secondary font-light text-lg">Dành một chút thời gian cho bản thân.</p>
      </div>

      <!-- Breathing Orb (The Liquid Glass element) -->
      <div class="relative w-80 h-80 flex items-center justify-center my-auto transition-all duration-1000">
        <!-- Scale transition controlled by CSS -->
        <div
          class="relative flex items-center justify-center rounded-full transition-all duration-[4000ms] ease-in-out border border-white/20 border-t-white/50 border-b-black/60 bg-white/5 backdrop-blur-[32px]"
          :class="{
            'w-72 h-72 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),_0_0_80px_rgba(56,189,248,0.3)]': phase === 'inhale' || phase === 'hold1',
            'w-48 h-48 shadow-[inset_0_2px_4px_rgba(255,255,255,0.2),_0_0_40px_rgba(245,158,11,0.2)]': phase === 'exhale' || phase === 'hold2',
            'w-56 h-56 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),_0_20px_60px_rgba(0,0,0,0.8)]': phase === 'idle'
          }"
        >
          <!-- Inner Text -->
          <div class="text-3xl font-display text-white transition-opacity duration-500 font-light tracking-wide drop-shadow-md">
            {{ text }}
          </div>
        </div>
      </div>

      <!-- Bottom Controls -->
      <div class="mt-8 flex flex-col items-center w-full gap-8 transition-all duration-700">
        <button
          @click="toggleBreathing"
          class="group px-8 py-3.5 rounded-full bg-white/10 hover:bg-white/15 active:bg-white/20 border border-white/10 border-t-white/30 backdrop-blur-xl text-white font-light tracking-wide transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex items-center gap-3"
        >
          <div class="p-1.5 rounded-full bg-white/10 shadow-inner group-hover:scale-110 transition-transform">
            <Icon :icon="isBreathing ? 'lucide:square' : 'lucide:play'" class="size-4" />
          </div>
          {{ isBreathing ? 'Dừng lại' : 'Bắt đầu' }}
        </button>

        <!-- Home Link -->
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm text-text-dim transition hover:text-white hover:bg-white/5"
        >
          <Icon icon="lucide:arrow-left" class="size-4" />
          Về trang chủ
        </RouterLink>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* Any highly specific custom CSS can go here */
</style>
