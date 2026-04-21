<script setup lang="ts">
import { Icon } from '@iconify/vue'
</script>

<template>
  <header class="relative overflow-hidden border border-border-default bg-bg-surface p-6 animate-fade-up">
    <div class="pointer-events-none absolute -right-14 -top-12 h-36 w-36 border border-accent-sky/40 bg-accent-sky/10 blur-2xl" />
    <div class="pointer-events-none absolute -bottom-10 left-8 h-28 w-28 border border-accent-amber/30 bg-accent-amber/10 blur-2xl" />
    <div class="relative z-10 space-y-4">
      <p class="font-display text-xs tracking-[0.28em] text-accent-coral">// DEV TOOL LAB</p>
      <h1 class="font-display text-3xl font-bold leading-tight md:text-5xl">API Mock Studio Lite</h1>
      <p class="max-w-3xl text-sm text-text-secondary md:text-base">
        Rule engine mô phỏng API chạy 100% trên trình duyệt. Match theo method, endpoint, header/query/body và trả response từ
        status map để frontend test nhanh mọi flow.
      </p>
      <div class="flex flex-wrap items-center gap-3 text-xs text-text-secondary">
        <span class="border border-border-default bg-bg-deep px-3 py-1 font-display tracking-wide">Header selector</span>
        <span class="border border-border-default bg-bg-deep px-3 py-1 font-display tracking-wide">Query selector</span>
        <span class="border border-border-default bg-bg-deep px-3 py-1 font-display tracking-wide">Body path matcher</span>
        <RouterLink
          to="/"
          class="ml-auto inline-flex items-center gap-2 border border-border-default bg-bg-deep px-3 py-1.5 text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
        >
          <Icon icon="lucide:house" class="size-4" />
          Về trang chủ
        </RouterLink>
      </div>
    </div>
  </header>
</template>
