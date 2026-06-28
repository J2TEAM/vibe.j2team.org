<script setup lang="ts">
defineProps<{
  label: string
  helper?: string
}>()
</script>

<template>
  <div class="text-left sm:text-right sm:max-w-[min(100%,12rem)] sm:shrink-0">
    <div class="font-display text-xs text-text-dim tracking-widest">Trạng thái</div>
    <p class="font-display text-sm text-text-secondary mt-1 leading-snug break-words">
      {{ label }}
    </p>
    <p v-if="helper" class="mt-1 text-xs text-text-dim leading-snug">
      {{ helper }}
    </p>
  </div>
</template>
