<script setup lang="ts">
import type { FireworkBurst } from '../types'

defineProps<{
  show: boolean
  fireworks: FireworkBurst[]
}>()
</script>

<template>
  <div v-if="show" class="fixed inset-0 pointer-events-none overflow-hidden">
    <div
      v-for="burst in fireworks"
      :key="burst.id"
      class="absolute"
      :style="{
        left: `${burst.x}%`,
        top: `${burst.y}%`,
        animationDelay: `${burst.delay}s`,
      }"
    >
      <span class="firework-core" :style="{ '--core-delay': `${burst.delay}s` }" />

      <span
        v-for="particle in burst.particles"
        :key="particle.id"
        class="firework-particle"
        :class="particle.colorClass"
        :style="{
          width: `${particle.size}px`,
          height: `${particle.size}px`,
          '--dx': `${particle.dx}px`,
          '--dy': `${particle.dy}px`,
          '--particle-delay': `${particle.delay + burst.delay}s`,
          '--particle-duration': `${particle.duration}s`,
        }"
      />
    </div>

    <!-- Removed falling stars, hearts, and sparkles as requested -->
  </div>
</template>

<style scoped src="../assets/celebration.css"></style>
