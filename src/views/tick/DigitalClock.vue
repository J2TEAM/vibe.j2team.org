<script setup lang="ts">
defineProps<{
  hours: string
  minutes: string
  seconds: string
  date: string
}>()
</script>

<template>
  <div class="text-center">
    <div class="font-display font-bold tracking-tight leading-none">
      <span class="text-7xl min-[375px]:text-8xl sm:text-9xl md:text-[10rem] lg:text-[12rem] text-text-primary">
        {{ hours }}<span class="text-accent-coral animate-pulse">:</span>{{ minutes }}
      </span>
      <span class="text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-text-dim ml-2 align-top mt-2 inline-block">
        {{ seconds }}
      </span>
    </div>
    <p class="mt-6 text-text-secondary text-sm sm:text-base font-display tracking-widest uppercase">
      {{ date }}
    </p>
  </div>
</template>
