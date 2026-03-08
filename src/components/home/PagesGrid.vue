<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { pages } from '@/data/pages-loader'
import { padIndex } from '@/data/homepage'
</script>

<template>
  <main class="max-w-5xl mx-auto px-4 sm:px-6 pb-16 scroll-reveal">
    <h2 class="font-display text-2xl font-semibold text-text-primary mb-8 flex items-center gap-3">
      <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
      Các trang đã tạo
      <span
        class="ml-2 inline-flex items-center justify-center rounded-full bg-accent-coral/10 px-3 py-0.5 text-sm font-medium text-accent-coral"
      >
        {{ pages.length }}
      </span>
    </h2>

    <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <RouterLink
        v-for="(page, index) in pages"
        :key="page.path"
        :to="page.path"
        class="group relative flex flex-col border border-border-default bg-bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:border-l-4 hover:border-l-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5 animate-fade-up"
        :style="{ animationDelay: `${400 + index * 100}ms` }"
      >
        <!-- Background number -->
        <span
          class="absolute top-3 right-4 font-display text-6xl font-bold text-accent-amber/5 select-none pointer-events-none"
        >
          {{ padIndex(index) }}
        </span>

        <h3
          class="font-display text-lg font-semibold text-text-primary group-hover:text-accent-coral transition-colors"
        >
          {{ page.name }}
        </h3>
        <p class="mt-2 text-sm text-text-secondary line-clamp-2" :title="page.description">
          {{ page.description }}
        </p>
        <p class="mt-auto pt-4 text-xs text-text-dim font-display tracking-wide">
          bởi
          <a
            v-if="page.facebook"
            :href="page.facebook"
            target="_blank"
            rel="noopener noreferrer"
            class="text-accent-coral hover:underline"
            @click.stop
          >
            {{ page.author }}
          </a>
          <span v-else>{{ page.author }}</span>
        </p>
      </RouterLink>

      <!-- Placeholder card -->
      <div
        class="flex items-center justify-center border border-dashed border-border-default p-6 text-text-dim animate-pulse-border animate-fade-up animate-delay-6"
      >
        <span class="text-sm font-display tracking-wide">Trang của bạn sẽ ở đây...</span>
      </div>
    </div>
  </main>
</template>
