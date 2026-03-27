<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useClipboard, useLocalStorage } from '@vueuse/core'

import type { CronAlertLevel, CronFormat } from './types'
import { useCron } from './composables/useCron'
import CronBuilder from './components/CronBuilder.vue'
import CronDiff from './components/CronDiff.vue'
import NaturalLanguagePanel from './components/NaturalLanguagePanel.vue'
import ScheduleSimulator from './components/ScheduleSimulator.vue'
import SnippetLibrary from './components/SnippetLibrary.vue'
import TimezoneCompare from './components/TimezoneCompare.vue'
import VisualTimeline from './components/VisualTimeline.vue'
import { buildTimezoneOptions } from './utils/timezones'

const {
  analysis,
  cronExpression,
  error,
  format,
  formattedNextRuns,
  humanReadable,
  nextRunCountdown,
  nextRuns,
  shareLink,
  timezone,
  updateExpression,
  updateFormat,
  updateTimezone,
} = useCron()

const { copy, copied } = useClipboard()
const activeTab = useLocalStorage<
  'overview' | 'builder' | 'simulator' | 'natural' | 'compare' | 'snippets'
>('cron-parser-active-tab', 'overview')

const tabs = [
  { key: 'overview', label: 'Tổng quan' },
  { key: 'builder', label: 'Builder' },
  { key: 'simulator', label: 'Simulator' },
  { key: 'natural', label: 'Dịch cron' },
  { key: 'compare', label: 'So sánh' },
  { key: 'snippets', label: 'Snippets' },
] as const

const timezones = computed(() => buildTimezoneOptions(timezone.value))

function handleTimezoneChange(event: Event) {
  const target = event.target

  if (!(target instanceof HTMLSelectElement)) {
    return
  }

  updateTimezone(target.value)
}

function copyShareLink() {
  if (!shareLink.value) {
    return
  }

  copy(shareLink.value)
}

function applyCron(payload: { expression: string; format: CronFormat }) {
  updateExpression(payload.expression)
  updateFormat(payload.format)
}

function formatButtonClass(value: CronFormat) {
  return [
    'px-3 py-2 text-xs font-display tracking-widest transition-colors',
    format.value === value
      ? 'bg-accent-coral text-bg-deep'
      : 'text-text-dim hover:bg-bg-elevated hover:text-text-primary',
  ]
}

function chipClass(tone: 'accent-coral' | 'accent-amber' | 'accent-sky') {
  if (tone === 'accent-coral') {
    return 'border-accent-coral/30 bg-accent-coral/10 text-accent-coral'
  }

  if (tone === 'accent-amber') {
    return 'border-accent-amber/30 bg-accent-amber/10 text-accent-amber'
  }

  return 'border-accent-sky/30 bg-accent-sky/10 text-accent-sky'
}

function alertClass(level: CronAlertLevel) {
  if (level === 'error') {
    return 'border-accent-coral/30 bg-accent-coral/10 text-accent-coral'
  }

  if (level === 'warning') {
    return 'border-accent-amber/30 bg-accent-amber/10 text-accent-amber'
  }

  return 'border-accent-sky/30 bg-accent-sky/10 text-accent-sky'
}

function alertIcon(level: CronAlertLevel) {
  if (level === 'error') {
    return 'lucide:ban'
  }

  if (level === 'warning') {
    return 'lucide:alert-triangle'
  }

  return 'lucide:info'
}
</script>

<template>
  <div class="min-h-screen bg-bg-deep px-4 py-8 font-body text-text-primary md:py-16">
    <div class="mx-auto max-w-5xl">
      <header
        class="mb-10 flex flex-col gap-6 md:mb-14 md:flex-row md:items-end md:justify-between"
      >
        <div class="max-w-3xl animate-fade-up">
          <p class="font-display text-xs tracking-[0.35em] text-accent-amber">// TIME RULES</p>
          <h1
            class="mt-3 font-display text-5xl font-bold leading-none tracking-tight text-accent-coral md:text-7xl"
          >
            CRON
            <br />
            EXPRESSION
            <br />
            PARSER
          </h1>
          <p class="mt-5 max-w-2xl text-lg leading-8 text-text-secondary">
            Nhập cron, đọc nghĩa bằng ngôn ngữ người dùng, xem lần chạy tiếp theo, kiểm tra timezone
            và dựng lịch bằng no-code builder.
          </p>
          <div class="mt-6 flex flex-wrap gap-2">
            <span
              class="border border-border-default bg-bg-surface px-3 py-2 font-display text-xs tracking-widest text-text-secondary"
            >
              Linux 5 field
            </span>
            <span
              class="border border-border-default bg-bg-surface px-3 py-2 font-display text-xs tracking-widest text-text-secondary"
            >
              Quartz 6 field
            </span>
            <span
              class="border border-border-default bg-bg-surface px-3 py-2 font-display text-xs tracking-widest text-text-secondary"
            >
              Share link
            </span>
            <span
              class="border border-border-default bg-bg-surface px-3 py-2 font-display text-xs tracking-widest text-text-secondary"
            >
              Timezone aware
            </span>
          </div>
        </div>

        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-5 py-2.5 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
        >
          <Icon icon="lucide:arrow-left" class="size-4" />
          Về trang chủ
        </RouterLink>
      </header>

      <div class="mb-8 overflow-x-auto border border-border-default bg-bg-surface p-2">
        <div class="flex min-w-max gap-2">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            type="button"
            class="border px-4 py-2 text-xs font-display tracking-widest transition-colors"
            :class="
              activeTab === tab.key
                ? 'border-accent-coral bg-accent-coral text-bg-deep'
                : 'border-border-default bg-bg-deep text-text-dim hover:border-accent-amber hover:text-text-primary'
            "
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>

      <div class="grid gap-8 lg:grid-cols-12">
        <section
          v-if="activeTab === 'overview'"
          class="relative overflow-hidden border border-border-default bg-bg-surface p-6 animate-fade-up animate-delay-2 lg:col-span-12"
        >
          <span
            class="pointer-events-none absolute right-4 top-3 select-none font-display text-6xl font-bold text-accent-amber/5"
          >
            01
          </span>

          <div class="flex items-center gap-3">
            <span class="font-display text-sm tracking-widest text-accent-coral">//</span>
            <h2 class="font-display text-xl font-semibold">BIỂU THỨC CRON</h2>
          </div>

          <div class="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div class="space-y-4">
              <div class="space-y-2">
                <label class="font-display text-[10px] tracking-[0.2em] text-text-dim">
                  CRON INPUT
                </label>
                <input
                  v-model="cronExpression"
                  type="text"
                  spellcheck="false"
                  placeholder="*/5 * * * *"
                  class="w-full border border-border-default bg-bg-deep px-4 py-3 font-mono text-lg text-accent-amber outline-none transition focus:border-accent-coral"
                />
              </div>

              <div class="flex flex-col gap-3 xl:flex-row xl:items-center">
                <div class="inline-flex border border-border-default">
                  <button
                    type="button"
                    :class="formatButtonClass('linux')"
                    @click="updateFormat('linux')"
                  >
                    LINUX (5 FIELD)
                  </button>
                  <button
                    type="button"
                    :class="formatButtonClass('quartz')"
                    @click="updateFormat('quartz')"
                  >
                    QUARTZ (6 FIELD)
                  </button>
                </div>

                <div
                  class="flex items-center gap-2 border border-border-default bg-bg-deep px-3 py-2"
                >
                  <Icon icon="lucide:globe" class="size-4 text-accent-sky" />
                  <select
                    :value="timezone"
                    class="cursor-pointer appearance-none bg-transparent text-xs text-text-primary outline-none hover:text-text-primary"
                    @change="handleTimezoneChange"
                  >
                    <option
                      v-for="tz in timezones"
                      :key="tz.value"
                      :value="tz.value"
                      class="bg-bg-surface"
                    >
                      {{ tz.label }}
                    </option>
                  </select>
                </div>
              </div>

              <div class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
                <div class="border border-border-default bg-bg-deep px-4 py-3">
                  <p class="font-display text-xs tracking-widest text-text-dim">SHARE LINK</p>
                  <p class="mt-2 truncate font-mono text-sm text-text-secondary">
                    {{ shareLink || 'Đang tạo link chia sẻ...' }}
                  </p>
                </div>

                <button
                  type="button"
                  class="inline-flex items-center justify-center gap-2 border border-border-default bg-bg-surface px-4 py-3 text-sm transition"
                  :class="
                    copied
                      ? 'border-accent-coral text-accent-coral'
                      : 'text-text-secondary hover:border-accent-coral hover:text-text-primary'
                  "
                  @click="copyShareLink"
                >
                  <Icon :icon="copied ? 'lucide:check' : 'lucide:copy'" class="size-4" />
                  {{ copied ? 'Đã copy link' : 'Copy link' }}
                </button>
              </div>

              <div class="flex flex-wrap gap-2">
                <span
                  class="border px-3 py-1.5 font-display text-[10px] tracking-widest"
                  :class="chipClass('accent-coral')"
                >
                  {{ analysis.modeLabel }}
                </span>
                <span
                  class="border px-3 py-1.5 font-display text-[10px] tracking-widest"
                  :class="chipClass('accent-amber')"
                >
                  {{ analysis.fieldCount }}/{{ analysis.expectedFieldCount }} FIELD
                </span>
                <span
                  class="border px-3 py-1.5 font-display text-[10px] tracking-widest"
                  :class="chipClass(analysis.cadenceTone)"
                >
                  {{ analysis.cadenceLabel }}
                </span>
                <span
                  class="border border-accent-sky/30 bg-accent-sky/10 px-3 py-1.5 font-display text-[10px] tracking-widest text-accent-sky"
                >
                  {{ timezone }}
                </span>
              </div>

              <div class="border border-border-default bg-bg-deep p-4">
                <p class="font-display text-xs tracking-widest text-text-dim">DIỄN GIẢI</p>
                <p
                  v-if="humanReadable"
                  class="mt-3 text-2xl font-display leading-tight text-text-primary md:text-3xl"
                >
                  “{{ humanReadable }}”
                </p>
                <p v-else class="mt-3 italic text-text-dim">Đang phân tích...</p>

                <p
                  v-if="analysis.fieldSummary"
                  class="mt-4 break-words font-mono text-xs text-text-dim"
                >
                  {{ analysis.fieldSummary }}
                </p>

                <p
                  v-if="error"
                  class="mt-4 inline-flex items-center gap-2 border border-accent-amber/30 bg-accent-amber/10 px-3 py-2 text-sm text-accent-amber"
                >
                  <Icon icon="lucide:alert-triangle" class="size-4" />
                  {{ error }}
                </p>
              </div>
            </div>

            <aside class="border-l-4 border-l-accent-coral bg-bg-deep p-5">
              <p class="font-display text-xs tracking-widest text-text-dim">CẢNH BÁO</p>

              <div v-if="analysis.alerts.length" class="mt-4 space-y-3">
                <article
                  v-for="alert in analysis.alerts"
                  :key="`${alert.level}-${alert.title}`"
                  class="border p-4"
                  :class="alertClass(alert.level)"
                >
                  <div class="flex items-start gap-3">
                    <Icon :icon="alertIcon(alert.level)" class="mt-0.5 size-4 shrink-0" />
                    <div class="space-y-1">
                      <p class="font-display text-sm">{{ alert.title }}</p>
                      <p class="text-xs leading-5 opacity-90">
                        {{ alert.message }}
                      </p>
                    </div>
                  </div>
                </article>
              </div>

              <p v-else class="mt-4 text-sm leading-6 text-text-dim">
                Không có cảnh báo đáng chú ý. Nếu đây là lịch quan trọng, hãy thử dựng lại bằng
                builder bên dưới để kiểm tra nhanh trước khi dùng thật.
              </p>

              <div class="mt-6 border border-border-default bg-bg-elevated p-4">
                <p class="font-display text-xs tracking-widest text-text-dim">MÚI GIỜ</p>
                <p class="mt-2 text-sm text-text-secondary">
                  Kết quả chạy tiếp theo được tính theo
                  <span class="text-accent-sky">{{ timezone }}</span
                  >.
                </p>
              </div>
            </aside>
          </div>
        </section>

        <section
          v-if="activeTab === 'overview'"
          class="relative overflow-hidden border border-border-default bg-bg-surface p-6 animate-fade-up animate-delay-3 lg:col-span-5"
        >
          <span
            class="pointer-events-none absolute right-4 top-3 select-none font-display text-6xl font-bold text-accent-amber/5"
          >
            02
          </span>

          <div class="flex items-center gap-3">
            <span class="font-display text-sm tracking-widest text-accent-sky">//</span>
            <h2 class="font-display text-xl font-semibold">LẦN CHẠY TIẾP THEO</h2>
          </div>

          <div class="mt-5 border border-border-default bg-bg-deep p-4">
            <p class="font-display text-xs tracking-widest text-text-dim">ĐẾM NGƯỢC</p>
            <p v-if="nextRunCountdown" class="mt-2 font-display text-3xl text-accent-amber">
              {{ nextRunCountdown }}
            </p>
            <p v-if="formattedNextRuns[0]" class="mt-2 text-sm text-text-secondary">
              {{ formattedNextRuns[0] }}
            </p>
          </div>

          <div v-if="formattedNextRuns.length" class="mt-5 space-y-3">
            <div
              v-for="(formattedRun, index) in formattedNextRuns"
              :key="`${formattedRun}-${index}`"
              class="flex items-center gap-3 border border-border-default bg-bg-deep p-3"
            >
              <div
                class="flex size-8 items-center justify-center border border-border-default bg-bg-elevated font-display text-xs text-accent-sky"
              >
                {{ index + 1 }}
              </div>
              <div class="min-w-0">
                <p class="truncate font-mono text-sm text-text-primary">
                  {{ formattedRun }}
                </p>
                <p class="mt-1 text-xs text-text-dim">
                  {{ index === 0 ? 'Lần chạy kế tiếp' : `+${index + 1}` }}
                </p>
              </div>
            </div>
          </div>

          <div
            v-else
            class="mt-5 border border-dashed border-border-default bg-bg-deep px-4 py-8 text-center text-text-dim"
          >
            Chưa có dữ liệu hợp lệ
          </div>
        </section>

        <section
          v-if="activeTab === 'overview'"
          class="relative overflow-hidden border border-border-default bg-bg-surface p-6 animate-fade-up animate-delay-4 lg:col-span-7"
        >
          <span
            class="pointer-events-none absolute right-4 top-3 select-none font-display text-6xl font-bold text-accent-amber/5"
          >
            03
          </span>

          <div class="flex items-center gap-3">
            <span class="font-display text-sm tracking-widest text-accent-amber">//</span>
            <h2 class="font-display text-xl font-semibold">DÒNG THỜI GIAN</h2>
          </div>

          <VisualTimeline :next-runs="nextRuns" :timezone="timezone" />

          <p class="mt-4 text-xs text-text-dim">
            Mốc thời gian được render theo múi giờ
            <span class="text-accent-sky">{{ timezone }}</span
            >.
          </p>
        </section>

        <section
          v-if="activeTab === 'builder'"
          class="relative overflow-hidden border border-border-default bg-bg-surface p-6 animate-fade-up animate-delay-5 lg:col-span-12"
        >
          <span
            class="pointer-events-none absolute right-4 top-3 select-none font-display text-6xl font-bold text-accent-amber/5"
          >
            04
          </span>

          <div class="flex items-center gap-3">
            <span class="font-display text-sm tracking-widest text-accent-coral">//</span>
            <h2 class="font-display text-xl font-semibold">CRON BUILDER (NO-CODE)</h2>
          </div>

          <p class="mt-3 max-w-3xl text-sm leading-7 text-text-secondary">
            Dựng lịch bằng click chọn thay vì gõ tay. Chuyển nhanh giữa Linux và Quartz, rồi kiểm
            tra biểu thức sinh ra ngay bên trên.
          </p>

          <div class="mt-6">
            <CronBuilder
              :current-expression="cronExpression"
              :format="format"
              @update="updateExpression"
            />
          </div>
        </section>

        <ScheduleSimulator
          v-if="activeTab === 'simulator'"
          :cron-expression="cronExpression"
          :format="format"
          :timezone="timezone"
        />

        <NaturalLanguagePanel v-if="activeTab === 'natural'" @apply="applyCron" />

        <TimezoneCompare
          v-if="activeTab === 'compare'"
          :cron-expression="cronExpression"
          :format="format"
          :primary-timezone="timezone"
        />

        <CronDiff
          v-if="activeTab === 'compare'"
          :source-expression="cronExpression"
          :source-format="format"
          :timezone="timezone"
        />

        <SnippetLibrary v-if="activeTab === 'snippets'" @apply="applyCron" />
      </div>

      <div class="mt-10 flex justify-center">
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-5 py-2.5 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
        >
          <Icon icon="lucide:arrow-left" class="size-4" />
          Về trang chủ
        </RouterLink>
      </div>
    </div>
  </div>
</template>
