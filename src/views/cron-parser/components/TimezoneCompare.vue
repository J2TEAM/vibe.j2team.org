<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useLocalStorage, useNow } from '@vueuse/core'

import type { CronFormat } from '../types'
import { analyzeCronExpression, formatDateTimeInTimeZone } from '../utils/cron'
import { generateNextRuns } from '../utils/cron-scheduler'
import { buildTimezoneOptions, getSystemTimezone } from '../utils/timezones'

const props = defineProps<{
  cronExpression: string
  format: CronFormat
  primaryTimezone: string
}>()

const now = useNow({ interval: 60_000 })
const compareTimezoneA = useLocalStorage('cron-parser-compare-timezone-a', 'UTC')
const compareTimezoneB = useLocalStorage(
  'cron-parser-compare-timezone-b',
  getSystemTimezone() === 'UTC' ? 'Asia/Tokyo' : 'UTC',
)

const analysis = computed(() => analyzeCronExpression(props.cronExpression, props.format))

const timezoneCards = computed(() => {
  const primaryRuns = generateNextRuns(props.cronExpression, props.primaryTimezone, 3, now.value)

  return [
    {
      key: 'primary',
      label: 'Múi giờ hiện tại',
      timezone: props.primaryTimezone,
      options: buildTimezoneOptions(props.primaryTimezone),
      runs: primaryRuns,
      referenceRun: primaryRuns[0],
      fixed: true,
    },
    {
      key: 'compare-a',
      label: 'So sánh A',
      timezone: compareTimezoneA.value,
      options: buildTimezoneOptions(compareTimezoneA.value),
      runs: generateNextRuns(props.cronExpression, compareTimezoneA.value, 3, now.value),
      referenceRun: primaryRuns[0],
      fixed: false,
    },
    {
      key: 'compare-b',
      label: 'So sánh B',
      timezone: compareTimezoneB.value,
      options: buildTimezoneOptions(compareTimezoneB.value),
      runs: generateNextRuns(props.cronExpression, compareTimezoneB.value, 3, now.value),
      referenceRun: primaryRuns[0],
      fixed: false,
    },
  ]
})

function formatOffset(reference: Date | undefined, target: Date | undefined) {
  if (!reference || !target) {
    return 'Chưa có dữ liệu'
  }

  const diffMs = target.getTime() - reference.getTime()
  if (diffMs === 0) {
    return 'Cùng thời điểm'
  }

  const sign = diffMs > 0 ? '+' : '-'
  const absoluteMinutes = Math.abs(Math.round(diffMs / 60_000))
  const hours = Math.floor(absoluteMinutes / 60)
  const minutes = absoluteMinutes % 60

  if (minutes === 0) {
    return `${sign}${hours} giờ`
  }

  return `${sign}${hours} giờ ${minutes} phút`
}
</script>

<template>
  <section
    class="relative overflow-hidden border border-border-default bg-bg-surface p-6 animate-fade-up animate-delay-7 lg:col-span-12"
  >
    <span
      class="pointer-events-none absolute right-4 top-3 select-none font-display text-6xl font-bold text-accent-amber/5"
    >
      06
    </span>

    <div class="flex items-center gap-3">
      <span class="font-display text-sm tracking-widest text-accent-amber">//</span>
      <h2 class="font-display text-xl font-semibold">TIMEZONE COMPARE</h2>
    </div>

    <p class="mt-3 max-w-3xl text-sm leading-7 text-text-secondary">
      So sánh cùng một cron khi áp dụng ở nhiều múi giờ khác nhau để thấy chênh lệch thời điểm chạy
      thực tế.
    </p>

    <div v-if="analysis.alerts.length" class="mt-5 flex flex-wrap gap-2">
      <span
        v-for="alert in analysis.alerts.slice(0, 2)"
        :key="`${alert.level}-${alert.title}`"
        class="border px-3 py-1.5 font-display text-[10px] tracking-widest"
        :class="
          alert.level === 'error'
            ? 'border-accent-coral/30 bg-accent-coral/10 text-accent-coral'
            : 'border-accent-amber/30 bg-accent-amber/10 text-accent-amber'
        "
      >
        {{ alert.title }}
      </span>
    </div>

    <div class="mt-6 grid gap-4 lg:grid-cols-3">
      <article
        v-for="card in timezoneCards"
        :key="card.key"
        class="border border-border-default bg-bg-deep p-4"
      >
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="font-display text-xs tracking-widest text-text-dim">{{ card.label }}</p>
            <p class="mt-1 font-display text-lg text-text-primary">{{ card.timezone }}</p>
          </div>

          <Icon icon="lucide:clock-3" class="size-5 text-accent-sky" />
        </div>

        <div class="mt-4" v-if="!card.fixed">
          <label class="font-display text-[10px] tracking-[0.2em] text-text-dim"
            >CHỌN MÚI GIỜ</label
          >
          <select
            v-if="card.key === 'compare-a'"
            v-model="compareTimezoneA"
            class="mt-2 w-full appearance-none border border-border-default bg-bg-surface px-3 py-2 text-sm text-text-primary outline-none"
          >
            <option v-for="option in card.options" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
          <select
            v-else
            v-model="compareTimezoneB"
            class="mt-2 w-full appearance-none border border-border-default bg-bg-surface px-3 py-2 text-sm text-text-primary outline-none"
          >
            <option v-for="option in card.options" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>

        <div class="mt-4 border border-border-default bg-bg-surface p-3">
          <p class="font-display text-xs tracking-widest text-text-dim">MỐC ĐẦU TIÊN</p>
          <p v-if="card.runs[0]" class="mt-2 font-mono text-sm text-accent-amber">
            {{
              formatDateTimeInTimeZone(card.runs[0], card.timezone, {
                dateStyle: 'medium',
                timeStyle: 'medium',
              })
            }}
          </p>
          <p v-else class="mt-2 text-sm text-text-dim">Chưa có dữ liệu</p>
        </div>

        <div class="mt-4 space-y-2">
          <div
            v-for="(run, index) in card.runs"
            :key="`${card.key}-${run.getTime()}-${index}`"
            class="border border-border-default bg-bg-surface px-3 py-2"
          >
            <p class="font-mono text-sm text-text-primary">
              {{
                formatDateTimeInTimeZone(run, card.timezone, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })
              }}
            </p>
          </div>
        </div>

        <p v-if="card.key !== 'primary'" class="mt-4 text-xs text-text-dim">
          Lệch với múi giờ gốc:
          <span class="text-accent-sky">{{ formatOffset(card.referenceRun, card.runs[0]) }}</span>
        </p>
      </article>
    </div>
  </section>
</template>
