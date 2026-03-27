<script setup lang="ts">
import { computed, ref } from 'vue'
import { useNow } from '@vueuse/core'

import type { CronFormat } from '../types'
import { analyzeCronExpression, formatDateTimeInTimeZone } from '../utils/cron'
import { generateOccurrencesInRange } from '../utils/cron-scheduler'

const props = defineProps<{
  cronExpression: string
  format: CronFormat
  timezone: string
}>()

const windowPreset = ref<'24h' | '7d' | '30d'>('24h')
const now = useNow({ interval: 60_000 })

const windowOptions: Array<{ label: string; value: '24h' | '7d' | '30d' }> = [
  { label: '24 giờ', value: '24h' },
  { label: '7 ngày', value: '7d' },
  { label: '30 ngày', value: '30d' },
]

const windowHours = computed(() => {
  if (windowPreset.value === '7d') {
    return 24 * 7
  }

  if (windowPreset.value === '30d') {
    return 24 * 30
  }

  return 24
})

const startDate = computed(() => new Date(now.value.getTime()))
const endDate = computed(() => new Date(now.value.getTime() + windowHours.value * 3_600_000))

const analysis = computed(() => analyzeCronExpression(props.cronExpression, props.format))

const occurrences = computed(() =>
  analysis.value.alerts.some((alert) => alert.level === 'error')
    ? []
    : generateOccurrencesInRange(
        props.cronExpression,
        props.timezone,
        startDate.value,
        endDate.value,
        300,
      ),
)

const averageGapLabel = computed(() => {
  if (occurrences.value.length < 2) {
    return 'Chưa đủ dữ liệu'
  }

  const totalGap = occurrences.value
    .slice(1)
    .reduce(
      (sum, current, index) => sum + (current.getTime() - occurrences.value[index]!.getTime()),
      0,
    )

  return formatDuration(totalGap / (occurrences.value.length - 1))
})

const hourBuckets = computed(() => {
  const buckets = Array.from({ length: 12 }, (_, index) => ({
    label: `${String(index * 2).padStart(2, '0')}:00`,
    count: 0,
  }))

  for (const occurrence of occurrences.value) {
    const hour = getHourInTimeZone(occurrence, props.timezone)
    const bucketIndex = Math.floor(hour / 2)
    const bucket = buckets[bucketIndex]

    if (bucket) {
      bucket.count += 1
    }
  }

  const maxCount = Math.max(...buckets.map((bucket) => bucket.count), 1)
  return buckets.map((bucket) => ({
    ...bucket,
    height: Math.max(12, (bucket.count / maxCount) * 100),
  }))
})

function getHourInTimeZone(date: Date, timezone: string) {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    hourCycle: 'h23',
  })

  return Number.parseInt(formatter.format(date), 10)
}

function formatDuration(durationMs: number) {
  const totalMinutes = Math.max(0, Math.round(durationMs / 60_000))
  const days = Math.floor(totalMinutes / (24 * 60))
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60)
  const minutes = totalMinutes % 60

  if (days > 0) {
    return `${days} ngày ${hours} giờ`
  }

  if (hours > 0) {
    return `${hours} giờ ${minutes} phút`
  }

  if (minutes > 0) {
    return `${minutes} phút`
  }

  return 'Dưới 1 phút'
}
</script>

<template>
  <section
    class="relative overflow-hidden border border-border-default bg-bg-surface p-6 animate-fade-up animate-delay-6 lg:col-span-12"
  >
    <span
      class="pointer-events-none absolute right-4 top-3 select-none font-display text-6xl font-bold text-accent-amber/5"
    >
      05
    </span>

    <div class="flex items-center gap-3">
      <span class="font-display text-sm tracking-widest text-accent-sky">//</span>
      <h2 class="font-display text-xl font-semibold">SCHEDULE SIMULATOR</h2>
    </div>

    <p class="mt-3 max-w-3xl text-sm leading-7 text-text-secondary">
      Mô phỏng lịch chạy trong một khoảng thời gian để nhìn mật độ thực tế, thay vì chỉ xem vài mốc
      kế tiếp.
    </p>

    <div class="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div class="inline-flex border border-border-default bg-bg-deep p-1">
        <button
          v-for="option in windowOptions"
          :key="option.value"
          type="button"
          class="px-3 py-2 text-xs font-display tracking-widest transition-colors"
          :class="
            windowPreset === option.value
              ? 'bg-accent-coral text-bg-deep'
              : 'text-text-dim hover:bg-bg-elevated hover:text-text-primary'
          "
          @click="windowPreset = option.value"
        >
          {{ option.label }}
        </button>
      </div>

      <div class="flex flex-wrap gap-2">
        <span
          class="border border-accent-sky/30 bg-accent-sky/10 px-3 py-1.5 font-display text-[10px] tracking-widest text-accent-sky"
        >
          {{ occurrences.length }} LẦN CHẠY
        </span>
        <span
          class="border border-accent-amber/30 bg-accent-amber/10 px-3 py-1.5 font-display text-[10px] tracking-widest text-accent-amber"
        >
          TB: {{ averageGapLabel }}
        </span>
        <span
          class="border border-border-default bg-bg-deep px-3 py-1.5 font-display text-[10px] tracking-widest text-text-secondary"
        >
          {{ analysis.cadenceLabel }}
        </span>
      </div>
    </div>

    <div
      v-if="analysis.alerts.some((alert) => alert.level === 'error')"
      class="mt-6 border border-accent-coral/30 bg-accent-coral/10 px-4 py-3 text-sm text-accent-coral"
    >
      {{ analysis.alerts.find((alert) => alert.level === 'error')?.message }}
    </div>

    <div
      v-else-if="occurrences.length === 0"
      class="mt-6 border border-dashed border-border-default bg-bg-deep px-4 py-8 text-center text-text-dim"
    >
      Không có lần chạy nào trong cửa sổ thời gian này.
    </div>

    <div v-else class="mt-6 space-y-6">
      <div class="border border-border-default bg-bg-deep p-4">
        <div class="flex items-center justify-between gap-3">
          <p class="font-display text-xs tracking-widest text-text-dim">BIỂU ĐỒ MẬT ĐỘ</p>
          <p class="text-xs text-text-dim">
            {{
              formatDateTimeInTimeZone(startDate, props.timezone, {
                dateStyle: 'medium',
                timeStyle: 'short',
              })
            }}
            -
            {{
              formatDateTimeInTimeZone(endDate, props.timezone, {
                dateStyle: 'medium',
                timeStyle: 'short',
              })
            }}
          </p>
        </div>

        <div class="mt-4 grid grid-cols-12 gap-2">
          <div
            v-for="bucket in hourBuckets"
            :key="bucket.label"
            class="flex h-32 flex-col justify-end gap-2"
          >
            <div class="flex flex-1 items-end">
              <div
                class="w-full border border-accent-amber/30 bg-accent-amber/20 transition-colors hover:bg-accent-amber/40"
                :style="{ height: `${bucket.height}%` }"
              />
            </div>
            <span class="text-center font-mono text-[10px] text-text-dim">
              {{ bucket.label }}
            </span>
          </div>
        </div>
      </div>

      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article class="border border-border-default bg-bg-deep p-4">
          <p class="font-display text-xs tracking-widest text-text-dim">TỔNG LẦN CHẠY</p>
          <p class="mt-3 font-display text-3xl text-accent-coral">{{ occurrences.length }}</p>
        </article>

        <article class="border border-border-default bg-bg-deep p-4">
          <p class="font-display text-xs tracking-widest text-text-dim">MỐC ĐẦU</p>
          <p class="mt-3 font-mono text-sm text-text-primary">
            {{
              formatDateTimeInTimeZone(occurrences[0]!, props.timezone, {
                dateStyle: 'medium',
                timeStyle: 'short',
              })
            }}
          </p>
        </article>

        <article class="border border-border-default bg-bg-deep p-4">
          <p class="font-display text-xs tracking-widest text-text-dim">MỐC CUỐI</p>
          <p class="mt-3 font-mono text-sm text-text-primary">
            {{
              formatDateTimeInTimeZone(occurrences[occurrences.length - 1]!, props.timezone, {
                dateStyle: 'medium',
                timeStyle: 'short',
              })
            }}
          </p>
        </article>

        <article class="border border-border-default bg-bg-deep p-4">
          <p class="font-display text-xs tracking-widest text-text-dim">KHOẢNG CÁCH TB</p>
          <p class="mt-3 font-display text-3xl text-accent-amber">{{ averageGapLabel }}</p>
        </article>
      </div>

      <div>
        <p class="font-display text-xs tracking-widest text-text-dim">DANH SÁCH MÔ PHỎNG</p>
        <div class="mt-4 grid gap-3">
          <div
            v-for="(occurrence, index) in occurrences.slice(0, 8)"
            :key="`${occurrence.getTime()}-${index}`"
            class="flex items-center gap-3 border border-border-default bg-bg-deep p-3"
          >
            <div
              class="flex size-8 items-center justify-center border border-border-default bg-bg-elevated font-display text-xs text-accent-sky"
            >
              {{ index + 1 }}
            </div>
            <div class="min-w-0">
              <p class="truncate font-mono text-sm text-text-primary">
                {{
                  formatDateTimeInTimeZone(occurrence, props.timezone, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })
                }}
              </p>
              <p class="mt-1 text-xs text-text-dim">
                Mô phỏng trong
                {{
                  windowPreset === '24h' ? '24 giờ' : windowPreset === '7d' ? '7 ngày' : '30 ngày'
                }}
              </p>
            </div>
          </div>
        </div>

        <p v-if="occurrences.length > 8" class="mt-3 text-xs text-text-dim">
          Hiển thị 8 mốc đầu tiên trong tổng số {{ occurrences.length }} lần chạy.
        </p>
      </div>
    </div>
  </section>
</template>
