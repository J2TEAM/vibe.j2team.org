<script setup lang="ts">
import bgImage from '../res/BG.png'
</script>

<template>
  <div
    class="pointer-events-none absolute inset-0 bg-bg-deep"
    :style="{
      backgroundImage: `url(${bgImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    }"
  />
</template>
