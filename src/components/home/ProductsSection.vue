<script setup lang="ts">
import { j2teamProducts } from '@/data/homepage'
</script>

<template>
  <section class="max-w-5xl mx-auto px-4 sm:px-6 pb-20 scroll-reveal">
    <h2 class="font-display text-2xl font-semibold text-text-primary mb-8 flex items-center gap-3">
      <span class="text-accent-amber font-display text-sm tracking-widest">//</span>
      Sản phẩm J2TEAM
    </h2>

    <div class="flex flex-col sm:flex-row sm:flex-wrap gap-4">
      <a
        v-for="product in j2teamProducts"
        :key="product.name"
        :href="product.url"
        target="_blank"
        rel="noopener noreferrer nofollow"
        class="group border border-border-default bg-bg-surface px-6 py-4 transition-all duration-300 hover:-translate-y-1 hover:border-accent-amber hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-amber/5"
      >
        <span
          class="font-display font-semibold text-text-primary group-hover:text-accent-amber transition-colors"
        >
          {{ product.name }}
        </span>
      </a>
    </div>
  </section>
</template>
