<script setup lang="ts">
// Skeleton loading component for post cards
</script>

<template>
  <div class="bg-bg-surface border border-border-default p-4 animate-pulse">
    <!-- Header -->
    <div class="flex items-center gap-3 mb-3">
      <div class="w-10 h-10 bg-bg-deep rounded-full" />
      <div class="flex-1">
        <div class="h-4 bg-bg-deep rounded w-24 mb-2" />
        <div class="h-3 bg-bg-deep rounded w-16" />
      </div>
    </div>

    <!-- Content -->
    <div class="space-y-2 mb-4">
      <div class="h-5 bg-bg-deep rounded w-3/4" />
      <div class="h-4 bg-bg-deep rounded w-full" />
      <div class="h-4 bg-bg-deep rounded w-2/3" />
    </div>

    <!-- Actions -->
    <div class="flex gap-6 pt-3 border-t border-border-default">
      <div class="h-5 bg-bg-deep rounded w-16" />
      <div class="h-5 bg-bg-deep rounded w-16" />
      <div class="h-5 bg-bg-deep rounded w-16" />
    </div>
  </div>
</template>

<style scoped>
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
