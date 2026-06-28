<script setup lang="ts">
defineProps<{
  padded?: boolean
}>()
</script>

<template>
  <div
    class="border border-border-default bg-bg-elevated/80"
    :class="padded !== false ? 'p-3 sm:p-4' : ''"
  >
    <slot />
  </div>
</template>
