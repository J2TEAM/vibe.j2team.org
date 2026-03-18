<script setup lang="ts">
import { Icon } from '@iconify/vue'
</script>

<template>
  <footer class="border-t border-border-default bg-bg-surface px-4 py-6 pb-20 text-center sm:pb-6">
    <RouterLink
      to="/"
      class="inline-flex items-center gap-2 text-sm text-text-secondary transition hover:text-accent-coral"
    >
      <Icon icon="lucide:arrow-left" class="size-4" />
      Quay về trang chủ
    </RouterLink>
    <p class="mt-2 text-xs text-text-dim font-display">
      GolingDuo Idiom 🦜 — Học thành ngữ kiểu lầy
    </p>
  </footer>
</template>
