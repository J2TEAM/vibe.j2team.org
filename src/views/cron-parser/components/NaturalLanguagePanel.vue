<script setup lang="ts">
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'

import type { CronFormat } from '../types'
import {
  formatNaturalLanguageConfidence,
  parseNaturalLanguage,
  type NaturalLanguageResult,
} from '../utils/natural-language'

const emit = defineEmits<{
  (e: 'apply', payload: { expression: string; format: CronFormat }): void
}>()

const prompt = ref('mỗi 5 phút')

const examples = [
  'mỗi 5 phút',
  'mỗi ngày lúc 09:00',
  'mỗi thứ Hai lúc 08:30',
  'every 10 seconds',
  'mỗi tháng ngày 1 lúc 07:15',
]

const result = computed<NaturalLanguageResult>(() => parseNaturalLanguage(prompt.value))

function applyResult() {
  if (!result.value.ok) {
    return
  }

  emit('apply', {
    expression: result.value.expression,
    format: result.value.format,
  })
}

function fillExample(value: string) {
  prompt.value = value
}
</script>

<template>
  <section
    class="relative overflow-hidden border border-border-default bg-bg-surface p-6 animate-fade-up animate-delay-6 lg:col-span-12"
  >
    <span
      class="pointer-events-none absolute right-4 top-3 select-none font-display text-6xl font-bold text-accent-amber/5"
    >
      09
    </span>

    <div class="flex items-center gap-3">
      <span class="font-display text-sm tracking-widest text-accent-sky">//</span>
      <h2 class="font-display text-xl font-semibold">NATURAL LANGUAGE → CRON</h2>
    </div>

    <p class="mt-3 max-w-3xl text-sm leading-7 text-text-secondary">
      Gõ một câu mô tả ngắn bằng tiếng Việt hoặc tiếng Anh, hệ thống sẽ dịch ra cron và cho bạn xem
      trước trước khi áp dụng.
    </p>

    <div class="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div class="space-y-4">
        <div class="border border-border-default bg-bg-deep p-4">
          <label class="font-display text-[10px] tracking-[0.2em] text-text-dim">
            NHẬP MÔ TẢ
          </label>
          <input
            v-model="prompt"
            type="text"
            spellcheck="false"
            placeholder="mỗi 5 phút"
            class="mt-3 w-full border border-border-default bg-bg-surface px-4 py-3 font-mono text-sm text-accent-amber outline-none focus:border-accent-coral"
          />
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            v-for="example in examples"
            :key="example"
            type="button"
            class="border border-border-default bg-bg-deep px-3 py-2 text-xs text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
            @click="fillExample(example)"
          >
            {{ example }}
          </button>
        </div>
      </div>

      <aside class="border border-border-default bg-bg-deep p-4">
        <div v-if="result.ok" class="space-y-4">
          <div class="flex flex-wrap gap-2">
            <span
              class="border border-accent-coral/30 bg-accent-coral/10 px-3 py-1.5 font-display text-[10px] tracking-widest text-accent-coral"
            >
              {{ result.format.toUpperCase() }}
            </span>
            <span
              class="border border-accent-amber/30 bg-accent-amber/10 px-3 py-1.5 font-display text-[10px] tracking-widest text-accent-amber"
            >
              {{ formatNaturalLanguageConfidence(result.confidence) }}
            </span>
          </div>

          <div class="border border-border-default bg-bg-surface p-4">
            <p class="font-display text-xs tracking-widest text-text-dim">KẾT QUẢ</p>
            <p class="mt-3 font-display text-2xl leading-tight text-text-primary">
              {{ result.title }}
            </p>
            <p class="mt-3 text-sm leading-6 text-text-secondary">
              {{ result.explanation }}
            </p>
          </div>

          <div class="border border-border-default bg-bg-surface p-4">
            <p class="font-display text-xs tracking-widest text-text-dim">CRON</p>
            <p class="mt-2 font-mono text-sm text-accent-amber">
              {{ result.expression }}
            </p>
          </div>

          <div v-if="result.notes.length" class="space-y-2">
            <p class="font-display text-xs tracking-widest text-text-dim">GHI CHÚ</p>
            <div
              v-for="note in result.notes"
              :key="note"
              class="border border-border-default bg-bg-surface px-3 py-2 text-sm text-text-secondary"
            >
              {{ note }}
            </div>
          </div>

          <button
            type="button"
            class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-3 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
            @click="applyResult"
          >
            <Icon icon="lucide:wand-sparkles" class="size-4" />
            Áp dụng vào cron
          </button>
        </div>

        <div v-else class="space-y-4">
          <div
            class="border border-accent-amber/30 bg-accent-amber/10 p-4 text-sm text-accent-amber"
          >
            {{ result.message }}
          </div>

          <div>
            <p class="font-display text-xs tracking-widest text-text-dim">GỢI Ý</p>
            <div class="mt-3 flex flex-wrap gap-2">
              <button
                v-for="suggestion in result.suggestions"
                :key="suggestion.value"
                type="button"
                class="border border-border-default bg-bg-surface px-3 py-2 text-xs text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
                @click="fillExample(suggestion.value)"
              >
                {{ suggestion.label }}
              </button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </section>
</template>
