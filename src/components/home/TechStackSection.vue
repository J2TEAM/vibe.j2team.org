<script setup lang="ts">
import { techStack } from '@/data/homepage'
</script>

<template>
  <section class="max-w-5xl mx-auto px-4 sm:px-6 pb-16 scroll-reveal">
    <h2 class="font-display text-2xl font-semibold text-text-primary mb-8 flex items-center gap-3">
      <span class="text-accent-amber font-display text-sm tracking-widest">//</span>
      Tech Stack chung
    </h2>

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <a
        v-for="tech in techStack"
        :key="tech.name"
        :href="tech.url"
        target="_blank"
        rel="noopener noreferrer nofollow"
        class="group flex items-center gap-4 border border-border-default bg-bg-surface p-5 transition-all duration-300 hover:-translate-y-1 hover:border-accent-amber hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-amber/5"
      >
        <div>
          <span
            class="font-display font-semibold text-text-primary group-hover:text-accent-amber transition-colors"
          >
            {{ tech.name }}
          </span>
          <p class="text-xs text-text-dim mt-1">{{ tech.description }}</p>
        </div>
      </a>
    </div>
  </section>
</template>
