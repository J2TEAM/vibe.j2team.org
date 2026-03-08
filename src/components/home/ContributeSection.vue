<script setup lang="ts">
import { steps, padIndex } from '@/data/homepage'
</script>

<template>
  <section
    id="cach-tham-gia"
    class="max-w-5xl mx-auto px-4 sm:px-6 pb-20 scroll-reveal scroll-mt-8"
  >
    <h2 class="font-display text-2xl font-semibold text-text-primary mb-10 flex items-center gap-3">
      <span class="text-accent-sky font-display text-sm tracking-widest">//</span>
      Cách tham gia
    </h2>

    <div class="grid gap-8 sm:grid-cols-2">
      <div v-for="(step, i) in steps" :key="i" class="flex gap-5 items-start">
        <span
          class="font-display text-4xl font-bold text-accent-coral/30 leading-none shrink-0 w-12"
        >
          {{ padIndex(i) }}
        </span>
        <!-- eslint-disable-next-line vue/no-v-html -->
        <p class="text-sm text-text-secondary leading-relaxed pt-1" v-html="step" />
      </div>
    </div>
  </section>
</template>
