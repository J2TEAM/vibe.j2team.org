<script setup lang="ts">
import { Icon } from '@iconify/vue'

import type { SafetyAssessment } from '../types'

defineProps<{
  score: number
  dangerCount: number
  timeoutCount: number
  safetyAssessment: SafetyAssessment
  debrief: readonly string[]
}>()
</script>

<template>
  <section class="mt-8 grid gap-5 animate-fade-up animate-delay-3 lg:grid-cols-3">
    <article class="border border-border-default bg-bg-surface p-5">
      <p class="font-display text-xs tracking-widest text-text-dim">SCORE</p>
      <p class="mt-2 font-display text-4xl text-accent-sky">{{ score }}</p>
      <p class="mt-3 text-sm text-text-secondary">Điểm tổng hợp từ các lựa chọn trong phiên.</p>
    </article>

    <article class="border border-border-default bg-bg-surface p-5">
      <p class="font-display text-xs tracking-widest text-text-dim">LỖI NGUY HIỂM</p>
      <p class="mt-2 font-display text-4xl text-accent-coral">{{ dangerCount }}</p>
      <p class="mt-3 text-sm text-text-secondary">
        Số quyết định có nguy cơ làm tình huống xấu đi.
      </p>
    </article>

    <article class="border border-border-default bg-bg-surface p-5">
      <p class="font-display text-xs tracking-widest text-text-dim">AUTO-CHỌN</p>
      <p class="mt-2 font-display text-4xl text-accent-amber">{{ timeoutCount }}</p>
      <p class="mt-3 text-sm text-text-secondary">
        Số bước bạn bị hết giờ trước khi ra quyết định.
      </p>
    </article>
  </section>

  <section class="mt-5 border bg-bg-surface p-6" :class="safetyAssessment.borderClass">
    <div class="flex items-center gap-2 text-xs text-text-dim">
      <Icon icon="lucide:activity" class="size-4" />
      <p class="font-display tracking-widest">ĐÁNH GIÁ PHIÊN</p>
    </div>
    <h2 class="mt-2 font-display text-2xl" :class="safetyAssessment.textClass">
      {{ safetyAssessment.label }}
    </h2>
    <p class="mt-2 text-sm text-text-secondary">{{ safetyAssessment.description }}</p>
  </section>

  <section class="mt-5 border border-border-default bg-bg-surface p-6">
    <div class="flex items-center gap-2 text-accent-sky">
      <Icon icon="lucide:notebook-pen" class="size-4" />
      <h3 class="font-display text-lg font-semibold">Ghi nhớ nhanh</h3>
    </div>
    <ul class="mt-4 grid gap-3 text-sm text-text-secondary md:grid-cols-2">
      <li
        v-for="tip in debrief"
        :key="tip"
        class="flex items-start gap-2 border border-border-default bg-bg-deep p-3"
      >
        <Icon icon="lucide:check" class="mt-0.5 size-4 text-accent-coral" />
        <span>{{ tip }}</span>
      </li>
    </ul>
  </section>
</template>
