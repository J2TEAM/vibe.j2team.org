<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'

const hours = ref(0)
const minutes = ref(0)
const seconds = ref(0)

let intervalId: ReturnType<typeof setInterval>

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

onMounted(() => {
  intervalId = setInterval(() => {
    seconds.value++
    if (seconds.value >= 60) {
      seconds.value = 0
      minutes.value++
    }
    if (minutes.value >= 60) {
      minutes.value = 0
      hours.value++
    }
  }, 1000)
})

onUnmounted(() => {
  clearInterval(intervalId)
})
</script>

<template>
  <div
    class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col items-center justify-center px-4"
  >
    <p
      class="font-display text-sm tracking-widest text-accent-coral uppercase animate-fade-up animate-delay-1"
    >
      // thời gian của bạn
    </p>

    <h1
      class="mt-4 font-display text-3xl sm:text-4xl font-bold text-text-primary text-center animate-fade-up animate-delay-2"
    >
      Bạn đã phí:
    </h1>

    <div class="mt-10 flex items-end gap-2 animate-fade-up animate-delay-3">
      <template v-if="hours > 0">
        <div class="flex flex-col items-center">
          <span
            class="font-display font-bold text-accent-coral tabular-nums"
            :class="hours >= 10 ? 'text-7xl sm:text-9xl' : 'text-8xl sm:text-[10rem]'"
          >
            {{ pad(hours) }}
          </span>
          <span class="text-text-dim text-xs tracking-widest font-display uppercase mt-1">giờ</span>
        </div>
        <span class="font-display font-bold text-accent-coral/50 pb-6 text-6xl sm:text-8xl">:</span>
      </template>

      <div class="flex flex-col items-center">
        <span
          class="font-display font-bold text-accent-coral tabular-nums"
          :class="hours > 0 ? 'text-7xl sm:text-9xl' : 'text-8xl sm:text-[10rem]'"
        >
          {{ pad(minutes) }}
        </span>
        <span class="text-text-dim text-xs tracking-widest font-display uppercase mt-1">phút</span>
      </div>

      <span
        class="font-display font-bold text-accent-coral/50 pb-6"
        :class="hours > 0 ? 'text-6xl sm:text-8xl' : 'text-7xl sm:text-9xl'"
        >:</span
      >

      <div class="flex flex-col items-center">
        <span
          class="font-display font-bold text-accent-amber tabular-nums"
          :class="hours > 0 ? 'text-7xl sm:text-9xl' : 'text-8xl sm:text-[10rem]'"
        >
          {{ pad(seconds) }}
        </span>
        <span class="text-text-dim text-xs tracking-widest font-display uppercase mt-1">giây</span>
      </div>
    </div>

    <p
      class="mt-8 text-text-secondary text-sm text-center max-w-xs animate-fade-up animate-delay-4"
    >
      Tính từ khi bạn mở trang này.
    </p>

    <RouterLink
      to="/"
      class="mt-10 inline-flex items-center gap-2 border border-border-default bg-bg-surface px-5 py-2.5 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary animate-fade-up animate-delay-5"
    >
      &larr; Về trang chủ
    </RouterLink>
  </div>
</template>
