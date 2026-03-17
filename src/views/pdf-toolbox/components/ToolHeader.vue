<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { RouterLink } from 'vue-router'
</script>

<template>
  <header
    class="sticky top-0 z-50 bg-bg-deep/80 backdrop-blur-xl border-b border-border-default pb-6 mb-8 pt-6"
  >
    <!-- Top Bar -->
    <div class="flex flex-wrap items-center justify-between gap-6">
      <div class="flex items-center gap-4">
        <RouterLink
          to="/"
          class="flex items-center gap-2 px-4 py-2 border border-border-default bg-bg-surface hover:border-accent-coral transition-all text-xs font-display tracking-widest text-text-secondary hover:text-text-primary group"
        >
          <span class="group-hover:-translate-x-1 transition-transform">←</span>
          Về trang chủ
        </RouterLink>

        <div
          class="hidden md:flex items-center gap-2 px-4 py-2 bg-bg-elevated border border-border-default font-display text-[10px] font-bold tracking-[0.2em] text-accent-sky uppercase"
        >
          Workspace / PDF Toolbox
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <div
          class="hidden sm:flex items-center gap-2 px-3 py-1.5 border border-border-default text-[10px] font-display text-text-dim tracking-wider uppercase"
        >
          2 tác vụ
        </div>
        <div
          class="hidden sm:flex items-center gap-2 px-3 py-1.5 border border-border-default text-[10px] font-display text-text-dim tracking-wider uppercase"
        >
          Author: Arter
        </div>
        <div
          class="flex items-center gap-2 px-3 py-1.5 border border-border-default text-[10px] font-display text-text-dim tracking-wider uppercase hover:border-accent-sky transition-colors cursor-help group"
        >
          <Icon
            icon="lucide:shield-check"
            class="size-3 text-accent-sky group-hover:animate-pulse"
          />
          100% Client-Side
        </div>
        <div
          class="bg-accent-coral text-bg-deep font-display font-bold text-[10px] tracking-[0.2em] px-3 py-1.5 rotate-2 hover:rotate-0 transition-transform cursor-default uppercase"
        >
          Vol.01 / 2026
        </div>
      </div>
    </div>
  </header>
</template>
