<script setup lang="ts">
defineProps<{
  hours: string
  minutes: string
  seconds: string
  date: string
}>()
</script>

<template>
  <div class="text-center flex flex-col items-center justify-center">
    <div class="font-display font-bold tracking-tighter leading-none text-text-primary">
      <span class="text-[6rem] min-[375px]:text-[7rem] sm:text-[9rem] md:text-[12rem] lg:text-[16rem]">
        {{ hours }}:{{ minutes }}
      </span>
    </div>
    <div class="flex items-center gap-4 mt-2">
      <div class="h-px flex-1 max-w-24 bg-border-default" />
      <span class="text-accent-coral font-display text-lg sm:text-xl tracking-widest">
        {{ seconds }}
      </span>
      <div class="h-px flex-1 max-w-24 bg-border-default" />
    </div>
    <p class="mt-4 text-text-dim text-xs sm:text-sm font-display tracking-[0.3em]">
      {{ date }}
    </p>
  </div>
</template>
