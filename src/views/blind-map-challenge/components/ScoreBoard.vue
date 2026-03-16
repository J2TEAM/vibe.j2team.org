<script setup lang="ts">
defineProps<{
  displayTime: string
  correctCount: number
  totalProvinces: number
  score: number
  progressPercent: number
  hasTimeLimit: boolean
}>()
</script>

<template>
  <div class="flex items-center gap-4 md:gap-6 flex-wrap text-sm font-display">
    <!-- Timer -->
    <div class="flex items-center gap-1.5">
      <span class="text-accent-amber">⏱️</span>
      <span
        class="font-bold tracking-wider"
        :class="hasTimeLimit ? 'text-accent-coral' : 'text-text-primary'"
      >
        {{ displayTime }}
      </span>
    </div>

    <!-- Progress -->
    <div class="flex items-center gap-1.5">
      <span class="text-accent-sky">✅</span>
      <span class="text-text-primary font-semibold">
        {{ correctCount }}/{{ totalProvinces }}
      </span>
    </div>

    <!-- Score -->
    <div class="flex items-center gap-1.5">
      <span class="text-accent-coral">💯</span>
      <span class="text-text-primary font-bold">
        {{ score }}đ
      </span>
    </div>

    <!-- Progress bar -->
    <div class="flex-1 min-w-[80px] hidden md:block">
      <div class="h-1.5 bg-border-default overflow-hidden">
        <div
          class="h-full bg-accent-sky transition-all duration-500 ease-out"
          :style="{ width: progressPercent + '%' }"
        />
      </div>
    </div>
  </div>
</template>
