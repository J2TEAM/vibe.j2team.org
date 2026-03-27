<script setup lang="ts">
import { ref } from 'vue'
import { useClipboard } from '@vueuse/core'
import { Icon } from '@iconify/vue'

import type { CronFormat } from '../types'

interface SnippetItem {
  title: string
  description: string
  expression: string
  format: CronFormat
  accent: 'accent-coral' | 'accent-amber' | 'accent-sky'
}

const emit = defineEmits<{
  (e: 'apply', payload: { expression: string; format: CronFormat }): void
}>()

const { copy, copied } = useClipboard()
const lastCopiedExpression = ref('')

const snippets: SnippetItem[] = [
  {
    title: 'Mỗi 5 phút',
    description: 'Tốt cho healthcheck, sync nhẹ hoặc poll API.',
    expression: '*/5 * * * *',
    format: 'linux',
    accent: 'accent-coral',
  },
  {
    title: 'Mỗi 15 phút',
    description: 'Phù hợp cho job báo cáo hoặc refresh cache.',
    expression: '*/15 * * * *',
    format: 'linux',
    accent: 'accent-amber',
  },
  {
    title: 'Mỗi ngày lúc 09:00',
    description: 'Dùng cho email report hoặc job buổi sáng.',
    expression: '0 9 * * *',
    format: 'linux',
    accent: 'accent-sky',
  },
  {
    title: 'Thứ Hai 08:30',
    description: 'Lịch họp, nhắc việc hoặc batch đầu tuần.',
    expression: '30 8 * * 1',
    format: 'linux',
    accent: 'accent-coral',
  },
  {
    title: 'Quartz mỗi 10 giây',
    description: 'Demo workload chạy sát hơn, cần Quartz 6 field.',
    expression: '*/10 * * * * *',
    format: 'quartz',
    accent: 'accent-amber',
  },
  {
    title: 'Quartz mỗi phút',
    description: 'Phiên bản có field giây để tương thích Quartz.',
    expression: '0 * * * * *',
    format: 'quartz',
    accent: 'accent-sky',
  },
]

function applySnippet(snippet: SnippetItem) {
  emit('apply', {
    expression: snippet.expression,
    format: snippet.format,
  })
}

function copySnippet(snippet: SnippetItem) {
  copy(snippet.expression)
  lastCopiedExpression.value = snippet.expression
}

function accentClass(accent: SnippetItem['accent']) {
  if (accent === 'accent-coral') {
    return 'text-accent-coral'
  }

  if (accent === 'accent-amber') {
    return 'text-accent-amber'
  }

  return 'text-accent-sky'
}
</script>

<template>
  <section
    class="relative overflow-hidden border border-border-default bg-bg-surface p-6 animate-fade-up animate-delay-7 lg:col-span-12"
  >
    <span
      class="pointer-events-none absolute right-4 top-3 select-none font-display text-6xl font-bold text-accent-amber/5"
    >
      08
    </span>

    <div class="flex items-center gap-3">
      <span class="font-display text-sm tracking-widest text-accent-coral">//</span>
      <h2 class="font-display text-xl font-semibold">ONE-CLICK SNIPPETS</h2>
    </div>

    <p class="mt-3 max-w-3xl text-sm leading-7 text-text-secondary">
      Bộ mẫu cron phổ biến để áp dụng ngay, copy nhanh hoặc dùng làm điểm khởi đầu cho lịch mới.
    </p>

    <div class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="snippet in snippets"
        :key="snippet.expression"
        class="border border-border-default bg-bg-deep p-4 transition-colors hover:bg-bg-elevated"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="font-display text-xs tracking-widest" :class="accentClass(snippet.accent)">
              {{ snippet.format.toUpperCase() }}
            </p>
            <h3 class="mt-2 font-display text-lg text-text-primary">{{ snippet.title }}</h3>
          </div>

          <span
            class="border px-3 py-1 font-display text-[10px] tracking-widest"
            :class="
              snippet.accent === 'accent-coral'
                ? 'border-accent-coral/30 bg-accent-coral/10 text-accent-coral'
                : snippet.accent === 'accent-amber'
                  ? 'border-accent-amber/30 bg-accent-amber/10 text-accent-amber'
                  : 'border-accent-sky/30 bg-accent-sky/10 text-accent-sky'
            "
          >
            MẪU
          </span>
        </div>

        <p class="mt-3 text-sm leading-6 text-text-secondary">
          {{ snippet.description }}
        </p>

        <div
          class="mt-4 border border-border-default bg-bg-surface px-3 py-2 font-mono text-sm text-accent-amber"
        >
          {{ snippet.expression }}
        </div>

        <div class="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-3 py-2 text-xs text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
            @click="applySnippet(snippet)"
          >
            <Icon icon="lucide:arrow-up-right" class="size-4" />
            Áp dụng
          </button>

          <button
            type="button"
            class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-3 py-2 text-xs text-text-secondary transition hover:border-accent-amber hover:text-text-primary"
            @click="copySnippet(snippet)"
          >
            <Icon
              :icon="
                lastCopiedExpression === snippet.expression && copied
                  ? 'lucide:check'
                  : 'lucide:copy'
              "
              class="size-4"
            />
            Copy
          </button>
        </div>
      </article>
    </div>
  </section>
</template>
