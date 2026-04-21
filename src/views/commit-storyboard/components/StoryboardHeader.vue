<script setup lang="ts">
import { Icon } from '@iconify/vue'

const emit = defineEmits<{
  clearLog: []
  restoreSample: []
}>()
</script>

<template>
  <header class="border border-border-default bg-bg-surface p-6 animate-fade-up">
    <p class="font-display text-xs tracking-widest text-accent-coral">// TOOL</p>
    <h1 class="mt-3 font-display text-4xl font-bold md:text-5xl">Commit Storyboard</h1>
    <p class="mt-3 max-w-3xl text-sm text-text-secondary md:text-base">
      Paste commit log vào đây để biến đổi thành release timeline có cấu trúc. Công cụ giúp team tạo changelog theo
      kiểu narrative, dễ review và chia sẻ trong sprint demo.
    </p>

    <div class="mt-5 flex flex-wrap gap-3">
      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 border border-border-default px-4 py-2 text-sm text-text-secondary transition-colors hover:border-accent-coral hover:text-text-primary"
      >
        <Icon icon="lucide:arrow-left" class="size-4" />
        Quay về trang chủ
      </RouterLink>
      <button
        type="button"
        class="inline-flex items-center gap-2 border border-border-default px-4 py-2 text-sm text-text-secondary transition-colors hover:border-accent-amber hover:text-text-primary"
        @click="emit('restoreSample')"
      >
        <Icon icon="lucide:flask-conical" class="size-4" />
        Tải sample log
      </button>
      <button
        type="button"
        class="inline-flex items-center gap-2 border border-border-default px-4 py-2 text-sm text-text-secondary transition-colors hover:border-accent-sky hover:text-text-primary"
        @click="emit('clearLog')"
      >
        <Icon icon="lucide:eraser" class="size-4" />
        Xóa log
      </button>
    </div>
  </header>
</template>
