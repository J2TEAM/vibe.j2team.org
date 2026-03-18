<script setup lang="ts">
// Multi-word component name for lint compliance
defineOptions({ name: 'TypingZombiePlayer' })
</script>

<template>
  <div class="absolute left-[6%] sm:left-[7%] top-1/2 -translate-y-1/2 select-none">
    <div class="pixel-player text-3xl sm:text-4xl leading-none">🧍</div>
  </div>
</template>

<style scoped>
@keyframes player-bob {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(-2px);
  }
}

.pixel-player {
  image-rendering: pixelated;
  animation: player-bob 600ms steps(2) infinite;
}
</style>
