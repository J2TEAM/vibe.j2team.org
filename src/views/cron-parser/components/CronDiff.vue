<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { useClipboard, useNow } from '@vueuse/core'

import type { CronFormat } from '../types'
import {
  analyzeCronExpression,
  buildFallbackDescription,
  formatDateTimeInTimeZone,
} from '../utils/cron'
import { generateNextRuns } from '../utils/cron-scheduler'
import { splitCronExpression } from '../utils/cron'

const props = defineProps<{
  sourceExpression: string
  sourceFormat: CronFormat
  timezone: string
}>()

const leftExpression = ref(props.sourceExpression)
const rightExpression = ref('0 9 * * *')
const now = useNow({ interval: 60_000 })
const { copy, copied } = useClipboard()
const lastCopiedExpression = ref('')

watch(
  () => props.sourceExpression,
  (value) => {
    leftExpression.value = value
  },
  { immediate: true },
)

const leftAnalysis = computed(() => analyzeCronExpression(leftExpression.value, props.sourceFormat))
const rightAnalysis = computed(() =>
  analyzeCronExpression(rightExpression.value, props.sourceFormat),
)

const leftRuns = computed(() =>
  generateNextRuns(leftExpression.value, props.timezone, 3, now.value),
)
const rightRuns = computed(() =>
  generateNextRuns(rightExpression.value, props.timezone, 3, now.value),
)

const fieldRows = computed(() => {
  const labels = ['Giây', 'Phút', 'Giờ', 'Ngày', 'Tháng', 'Thứ']
  const leftFields = normalizeCronFields(leftExpression.value)
  const rightFields = normalizeCronFields(rightExpression.value)

  return labels.map((label, index) => ({
    label,
    left: leftFields?.[index] ?? '—',
    right: rightFields?.[index] ?? '—',
    changed: (leftFields?.[index] ?? '—') !== (rightFields?.[index] ?? '—'),
  }))
})

const sameSchedule = computed(() => {
  if (leftRuns.value.length < 3 || rightRuns.value.length < 3) {
    return false
  }

  return leftRuns.value
    .slice(0, 3)
    .every((run, index) => run.getTime() === rightRuns.value[index]?.getTime())
})

function normalizeCronFields(expression: string) {
  const fields = splitCronExpression(expression)

  if (fields.length === 5) {
    return ['0', ...fields]
  }

  if (fields.length === 6) {
    return fields
  }

  return null
}

function copyExpression(expression: string) {
  copy(expression)
  lastCopiedExpression.value = expression
}
</script>

<template>
  <section
    class="relative overflow-hidden border border-border-default bg-bg-surface p-6 animate-fade-up animate-delay-7 lg:col-span-12"
  >
    <span
      class="pointer-events-none absolute right-4 top-3 select-none font-display text-6xl font-bold text-accent-amber/5"
    >
      07
    </span>

    <div class="flex items-center gap-3">
      <span class="font-display text-sm tracking-widest text-accent-coral">//</span>
      <h2 class="font-display text-xl font-semibold">CRON DIFF</h2>
    </div>

    <p class="mt-3 max-w-3xl text-sm leading-7 text-text-secondary">
      So sánh hai biểu thức cron để phát hiện field nào khác, lịch chạy nào dày hơn và hai chuỗi có
      tạo ra cùng một lịch hay không.
    </p>

    <div class="mt-6 grid gap-4 lg:grid-cols-2">
      <article class="border border-border-default bg-bg-deep p-4">
        <div class="flex items-center justify-between gap-3">
          <p class="font-display text-xs tracking-widest text-text-dim">BIỂU THỨC A</p>
          <button
            type="button"
            class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-3 py-2 text-xs text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
            @click="copyExpression(leftExpression)"
          >
            <Icon
              :icon="
                lastCopiedExpression === leftExpression && copied ? 'lucide:check' : 'lucide:copy'
              "
              class="size-4"
            />
            Copy
          </button>
        </div>

        <input
          v-model="leftExpression"
          type="text"
          spellcheck="false"
          class="mt-3 w-full border border-border-default bg-bg-surface px-4 py-3 font-mono text-sm text-accent-amber outline-none focus:border-accent-coral"
        />

        <div class="mt-3 flex flex-wrap gap-2">
          <span
            class="border border-accent-sky/30 bg-accent-sky/10 px-3 py-1.5 font-display text-[10px] tracking-widest text-accent-sky"
          >
            {{ leftAnalysis.modeLabel }}
          </span>
          <span
            class="border border-border-default bg-bg-surface px-3 py-1.5 font-display text-[10px] tracking-widest text-text-secondary"
          >
            {{ buildFallbackDescription(leftExpression) }}
          </span>
        </div>
      </article>

      <article class="border border-border-default bg-bg-deep p-4">
        <div class="flex items-center justify-between gap-3">
          <p class="font-display text-xs tracking-widest text-text-dim">BIỂU THỨC B</p>
          <button
            type="button"
            class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-3 py-2 text-xs text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
            @click="copyExpression(rightExpression)"
          >
            <Icon
              :icon="
                lastCopiedExpression === rightExpression && copied ? 'lucide:check' : 'lucide:copy'
              "
              class="size-4"
            />
            Copy
          </button>
        </div>

        <input
          v-model="rightExpression"
          type="text"
          spellcheck="false"
          class="mt-3 w-full border border-border-default bg-bg-surface px-4 py-3 font-mono text-sm text-accent-amber outline-none focus:border-accent-coral"
        />

        <div class="mt-3 flex flex-wrap gap-2">
          <span
            class="border border-accent-amber/30 bg-accent-amber/10 px-3 py-1.5 font-display text-[10px] tracking-widest text-accent-amber"
          >
            {{ rightAnalysis.modeLabel }}
          </span>
          <span
            class="border border-border-default bg-bg-surface px-3 py-1.5 font-display text-[10px] tracking-widest text-text-secondary"
          >
            {{ buildFallbackDescription(rightExpression) }}
          </span>
        </div>
      </article>
    </div>

    <div class="mt-6 flex flex-wrap gap-2">
      <span
        class="border px-3 py-1.5 font-display text-[10px] tracking-widest"
        :class="
          sameSchedule
            ? 'border-accent-sky/30 bg-accent-sky/10 text-accent-sky'
            : 'border-accent-amber/30 bg-accent-amber/10 text-accent-amber'
        "
      >
        {{ sameSchedule ? 'CÙNG LỊCH' : 'KHÁC LỊCH' }}
      </span>
      <span
        class="border border-border-default bg-bg-deep px-3 py-1.5 font-display text-[10px] tracking-widest text-text-secondary"
      >
        So sánh theo múi giờ {{ timezone }}
      </span>
    </div>

    <div class="mt-6 overflow-x-auto border border-border-default bg-bg-deep">
      <table class="min-w-full border-collapse text-left text-sm">
        <thead class="bg-bg-elevated">
          <tr>
            <th class="px-4 py-3 font-display text-[10px] tracking-widest text-text-dim">FIELD</th>
            <th class="px-4 py-3 font-display text-[10px] tracking-widest text-text-dim">A</th>
            <th class="px-4 py-3 font-display text-[10px] tracking-widest text-text-dim">B</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in fieldRows"
            :key="row.label"
            class="border-t border-border-default"
            :class="row.changed ? 'bg-accent-amber/5' : ''"
          >
            <td class="px-4 py-3 font-display text-xs tracking-widest text-text-secondary">
              {{ row.label }}
            </td>
            <td class="px-4 py-3 font-mono text-xs text-text-primary">
              {{ row.left }}
            </td>
            <td class="px-4 py-3 font-mono text-xs text-text-primary">
              {{ row.right }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-6 grid gap-4 lg:grid-cols-2">
      <article class="border border-border-default bg-bg-deep p-4">
        <p class="font-display text-xs tracking-widest text-text-dim">3 LẦN CHẠY TIẾP THEO - A</p>
        <div class="mt-3 space-y-2">
          <div
            v-for="(run, index) in leftRuns"
            :key="`left-${run.getTime()}-${index}`"
            class="border border-border-default bg-bg-surface px-3 py-2"
          >
            <p class="font-mono text-sm text-text-primary">
              {{
                formatDateTimeInTimeZone(run, timezone, { dateStyle: 'medium', timeStyle: 'short' })
              }}
            </p>
          </div>
        </div>
        <p v-if="leftAnalysis.alerts.length" class="mt-3 text-xs text-accent-amber">
          {{ leftAnalysis.alerts[0]?.message }}
        </p>
      </article>

      <article class="border border-border-default bg-bg-deep p-4">
        <p class="font-display text-xs tracking-widest text-text-dim">3 LẦN CHẠY TIẾP THEO - B</p>
        <div class="mt-3 space-y-2">
          <div
            v-for="(run, index) in rightRuns"
            :key="`right-${run.getTime()}-${index}`"
            class="border border-border-default bg-bg-surface px-3 py-2"
          >
            <p class="font-mono text-sm text-text-primary">
              {{
                formatDateTimeInTimeZone(run, timezone, { dateStyle: 'medium', timeStyle: 'short' })
              }}
            </p>
          </div>
        </div>
        <p v-if="rightAnalysis.alerts.length" class="mt-3 text-xs text-accent-amber">
          {{ rightAnalysis.alerts[0]?.message }}
        </p>
      </article>
    </div>
  </section>
</template>
