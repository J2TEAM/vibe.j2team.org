<script setup lang="ts">
type BuaControlSide = 'left' | 'right'

const props = defineProps<{
  side: BuaControlSide
  title: string
}>()
</script>

<template>
  <section
    class="pointer-events-auto border border-border-default bg-bg-surface p-3 sm:p-4"
    :class="
      props.side === 'left' ? 'animate-fade-up animate-delay-2' : 'animate-fade-up animate-delay-3'
    "
  >
    <h2
      class="mb-3 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wider text-text-primary"
    >
      <span class="text-accent-coral">//</span>
      {{ props.title }}
    </h2>
    <div class="space-y-3 text-sm text-text-secondary">
      <slot />
    </div>
  </section>
</template>
