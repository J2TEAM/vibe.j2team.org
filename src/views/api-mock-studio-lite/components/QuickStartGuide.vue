<script setup lang="ts">
import { Icon } from '@iconify/vue'
</script>

<template>
  <section class="border border-border-default bg-bg-surface p-5 animate-fade-up animate-delay-1">
    <h2 class="font-display text-lg font-semibold text-text-primary">
      <span class="mr-2 text-accent-sky">//</span>
      Hướng Dẫn Nhanh
    </h2>

    <div class="mt-4 grid gap-3 md:grid-cols-3">
      <article class="border border-border-default bg-bg-deep p-3">
        <p class="inline-flex items-center gap-2 font-display text-xs tracking-wide text-accent-coral">
          <Icon icon="lucide:pen-line" class="size-3.5" />
          Bước 1: Tạo request
        </p>
        <p class="mt-2 text-xs text-text-secondary">
          Nhập Method, Endpoint, Query, Header ở cột trái.
        </p>
      </article>

      <article class="border border-border-default bg-bg-deep p-3">
        <p class="inline-flex items-center gap-2 font-display text-xs tracking-wide text-accent-amber">
          <Icon icon="lucide:filter" class="size-3.5" />
          Bước 2: Chọn rule
        </p>
        <p class="mt-2 text-xs text-text-secondary">
          Rule đầu tiên khớp sẽ quyết định response trả về.
        </p>
      </article>

      <article class="border border-border-default bg-bg-deep p-3">
        <p class="inline-flex items-center gap-2 font-display text-xs tracking-wide text-accent-sky">
          <Icon icon="lucide:send" class="size-3.5" />
          Bước 3: Simulate
        </p>
        <p class="mt-2 text-xs text-text-secondary">
          Bấm Simulate Response để xem status, headers, body và cURL.
        </p>
      </article>
    </div>
  </section>
</template>
