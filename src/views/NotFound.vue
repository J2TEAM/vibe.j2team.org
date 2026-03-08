<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="min-h-screen bg-bg-deep flex items-center justify-center px-6">
    <div class="text-center max-w-md">
      <p class="text-6xl" aria-hidden="true">🫠</p>
      <p
        class="mt-4 font-display text-8xl sm:text-9xl font-bold text-accent-coral -rotate-2"
        aria-hidden="true"
      >
        404
      </p>
      <h1 class="mt-6 text-xl text-text-primary font-display font-bold">
        Ối! Trang này đã bốc hơi
      </h1>
      <p class="mt-3 text-base text-text-secondary leading-relaxed">
        Có thể ai đó đã vibe code xoá mất nó, hoặc bạn vừa gõ URL bằng chân.
        <br />
        Dù sao thì... trang này không tồn tại đâu.
      </p>
      <RouterLink
        to="/"
        class="mt-8 inline-block bg-accent-coral text-bg-deep font-display font-bold text-sm tracking-widest px-6 py-3 hover:bg-accent-amber transition-colors"
      >
        QUAY VỀ NƠI AN TOÀN
      </RouterLink>
    </div>
  </div>
</template>
