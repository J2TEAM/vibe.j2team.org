<template>
  <transition name="fade">
    <div
      v-if="gameOver"
      class="absolute inset-0 bg-bg-deep/95 flex flex-col items-center justify-center z-[150] backdrop-blur-md px-4 text-center"
    >
      <!-- Decoration -->
      <h2
        class="font-display text-3xl sm:text-5xl lg:text-7xl xl:text-8xl font-bold mb-6 tracking-tight uppercase drop-shadow-[0_0_20px_rgba(255,107,74,0.3)] animate-fade-up text-center px-2"
        :class="winner === 'Player' ? 'text-accent-sky' : 'text-accent-coral'"
      >
        {{ winner === 'Player' ? 'BẠN CHIẾN THẮNG' : 'BẠN ĐÃ THUA' }}
      </h2>
      <div
        class="mb-12 text-text-primary text-xl md:text-2xl font-body max-w-lg mx-auto !leading-relaxed animate-fade-up animate-delay-2 p-6 border border-border-default bg-bg-surface/50 shadow-xl"
      >
        {{
          winner === 'Player'
            ? 'Furina gục ngã.\nMạng sống của bạn được bảo toàn.'
            : 'Một kết cục được dự báo trước.\nHãy nghỉ ngơi và thử lại sau.'
        }}
      </div>

      <button
        @click="$emit('startNewGame')"
        class="group relative px-12 py-5 bg-transparent border-2 border-accent-amber text-accent-amber text-xl font-display font-bold transition-all duration-300 hover:bg-accent-amber hover:text-bg-deep hover:shadow-[0_0_30px_rgba(255,184,48,0.5)] tracking-widest animate-fade-up animate-delay-3 overflow-hidden rounded-none cursor-pointer"
      >
        <span class="relative z-10">CHƠI LẠI</span>
      </button>

      <RouterLink
        to="/"
        class="mt-8 text-text-dim hover:text-text-primary transition-colors underline decoration-border-default hover:decoration-accent-coral underline-offset-4 animate-fade-up animate-delay-4"
      >
        Trở về trang chủ
      </RouterLink>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'

defineProps<{
  gameOver: boolean
  winner: string | null
}>()

defineEmits<{
  (e: 'startNewGame'): void
}>()
</script>
