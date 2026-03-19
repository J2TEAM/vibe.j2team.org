<script setup lang="ts">
defineOptions({ name: 'BattleshipOnboard' })
const emit = defineEmits(['start'])
</script>

<template>
  <div class="text-center py-20 sm:py-28">
    <h1
      class="font-display text-5xl sm:text-6xl font-bold text-accent-coral tracking-tight animate-fade-up"
    >
      Battleship
    </h1>
    <p class="mt-4 text-text-secondary text-lg max-w-md mx-auto animate-fade-up animate-delay-2">
      Đặt tàu, bắn đối thủ — ai tiêu diệt hết tàu trước sẽ thắng.
    </p>
    <button
      class="mt-10 border border-accent-coral bg-accent-coral px-8 py-3.5 text-bg-deep font-display font-bold text-sm tracking-widest transition hover:bg-accent-coral/90 hover:-translate-y-0.5 animate-fade-up animate-delay-3"
      @click="emit('start')"
    >
      Bắt đầu
    </button>
  </div>
</template>
