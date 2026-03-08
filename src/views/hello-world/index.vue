<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <div
    class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col items-center justify-center px-4"
  >
    <h1
      class="font-display text-4xl min-[375px]:text-5xl sm:text-6xl font-bold text-accent-coral animate-fade-up"
    >
      Hello World!
    </h1>
    <p
      class="mt-4 text-text-secondary text-lg text-center max-w-md animate-fade-up animate-delay-2"
    >
      Đây là trang mẫu đầu tiên của dự án vibe.j2team.org. Bạn có thể dùng trang này làm template để
      tạo trang của riêng mình.
    </p>
    <RouterLink
      to="/"
      class="mt-8 inline-flex items-center gap-2 border border-border-default bg-bg-surface px-5 py-2.5 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary animate-fade-up animate-delay-3"
    >
      &larr; Về trang chủ
    </RouterLink>
  </div>
</template>
