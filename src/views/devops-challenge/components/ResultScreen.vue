<script setup lang="ts">
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import type { Challenge, EvaluationResult } from '../types'
import { techMap } from '../data/technologies'
import { CATEGORY_LABELS } from '../types'
import type { TechCategory } from '../types'
import StarRating from './StarRating.vue'
import MetricBar from './MetricBar.vue'

defineProps<{
  result: EvaluationResult
  challenge: Challenge
  hasNextLevel: boolean
}>()

defineEmits<{
  retry: []
  next: []
  menu: []
}>()

const showOptimal = ref(false)
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-4 sm:space-y-6 animate-fade-up">
    <!-- Header: Pass or Fail -->
    <div class="border border-border-default bg-bg-surface overflow-hidden">
      <div class="h-1" :class="result.passed ? 'bg-green-500' : 'bg-accent-coral'" />
      <div class="p-6 sm:p-10 text-center">
        <div v-if="result.passed" class="space-y-4">
          <div
            class="inline-flex items-center gap-2 border border-green-500/30 bg-green-500/10 px-4 py-1.5"
          >
            <Icon icon="lucide:trophy" class="size-5 text-green-400" />
            <span
              class="font-display text-lg sm:text-2xl font-black text-green-400 animate-fade-up"
            >
              HOÀN THÀNH!
            </span>
          </div>
          <div>
            <StarRating :stars="result.stars" size="lg" />
          </div>
          <div
            class="font-display text-5xl sm:text-6xl font-black tabular-nums text-text-primary animate-fade-up animate-delay-1"
          >
            {{ result.score }}
            <span class="text-2xl sm:text-3xl text-text-dim">/100</span>
          </div>
        </div>
        <div v-else class="space-y-4">
          <div
            class="inline-flex items-center gap-2 border border-accent-coral/30 bg-accent-coral/10 px-4 py-1.5"
          >
            <Icon icon="lucide:x-circle" class="size-5 text-accent-coral" />
            <span
              class="font-display text-lg sm:text-2xl font-black text-accent-coral animate-fade-up"
            >
              CHƯA ĐẠT
            </span>
          </div>
          <div>
            <StarRating :stars="0" size="lg" />
          </div>
          <div
            class="font-display text-5xl sm:text-6xl font-black tabular-nums text-text-dim animate-fade-up animate-delay-1"
          >
            {{ result.score }}
            <span class="text-2xl sm:text-3xl text-text-dim/50">/100</span>
          </div>
          <p class="text-xs sm:text-sm text-text-secondary">
            Giải pháp chưa đạt yêu cầu tối thiểu. Hãy xem gợi ý bên dưới!
          </p>
        </div>
      </div>
    </div>

    <!-- Score breakdown -->
    <div
      class="border border-border-default bg-bg-surface overflow-hidden animate-fade-up animate-delay-2"
    >
      <div class="flex items-center gap-2 border-b border-border-default bg-bg-deep/50 px-4 py-2.5">
        <Icon icon="lucide:bar-chart-3" class="size-4 text-accent-sky" />
        <h3 class="font-display text-xs font-bold uppercase tracking-wider text-text-secondary">
          Chi tiết điểm số
        </h3>
      </div>
      <div class="space-y-3 p-4 sm:p-5">
        <div v-for="item in result.breakdown" :key="item.metric">
          <MetricBar
            :label="`${item.metricVi} — ${item.subScore}đ`"
            :value="item.actual"
            :max="Math.max(item.actual, item.required) * 1.5"
            :target="item.required"
            :unit="item.unit"
            :lower-is-better="item.metric === 'latency' || item.metric === 'cost'"
          />
          <div
            class="mt-0.5 flex justify-between text-[10px] sm:text-[11px] text-text-dim tabular-nums"
          >
            <span>Thực tế: {{ item.actual.toLocaleString() }}{{ item.unit }}</span>
            <span>Yêu cầu: {{ item.required.toLocaleString() }}{{ item.unit }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Tips -->
    <div
      class="border border-border-default bg-bg-surface overflow-hidden animate-fade-up animate-delay-3"
    >
      <div class="flex items-center gap-2 border-b border-border-default bg-bg-deep/50 px-4 py-2.5">
        <Icon icon="lucide:lightbulb" class="size-4 text-accent-amber" />
        <h3 class="font-display text-xs font-bold uppercase tracking-wider text-text-secondary">
          Nhận xét &amp; gợi ý
        </h3>
      </div>
      <ul class="space-y-2 p-4 sm:p-5">
        <li
          v-for="(tip, i) in result.tips"
          :key="i"
          class="flex items-start gap-2 text-xs sm:text-sm text-text-secondary leading-relaxed"
        >
          <Icon icon="lucide:chevron-right" class="mt-0.5 size-3.5 shrink-0 text-accent-amber" />
          <span>{{ tip }}</span>
        </li>
      </ul>
    </div>

    <!-- Optimal solution (collapsible) -->
    <div
      class="border border-border-default bg-bg-surface overflow-hidden animate-fade-up animate-delay-4"
    >
      <button
        class="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-bg-elevated"
        @click="showOptimal = !showOptimal"
      >
        <div class="flex items-center gap-2">
          <Icon icon="lucide:trophy" class="size-4 text-accent-coral" />
          <span class="font-display text-xs font-bold uppercase tracking-wider text-text-secondary">
            Gợi ý giải pháp tối ưu
          </span>
        </div>
        <Icon
          :icon="showOptimal ? 'lucide:chevron-up' : 'lucide:chevron-down'"
          class="size-4 text-text-dim"
        />
      </button>
      <div v-if="showOptimal" class="border-t border-border-default p-4 sm:p-5">
        <div class="grid gap-2 grid-cols-2 sm:grid-cols-3">
          <div
            v-for="techId in result.optimalTechIds"
            :key="techId"
            class="flex items-center gap-2 border border-green-500/20 bg-green-500/5 p-2 sm:p-2.5"
          >
            <Icon
              v-if="techMap.get(techId)?.icon"
              :icon="techMap.get(techId)!.icon"
              class="size-4 shrink-0"
            />
            <div class="min-w-0">
              <div class="text-xs font-semibold text-text-primary truncate">
                {{ techMap.get(techId)?.nameVi ?? techId }}
              </div>
              <div class="text-[10px] text-text-dim">
                {{ CATEGORY_LABELS[techMap.get(techId)?.category as TechCategory] ?? '' }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="grid grid-cols-2 gap-2 sm:flex sm:gap-3 animate-fade-up animate-delay-5">
      <button
        class="flex items-center justify-center gap-1.5 border border-accent-coral bg-accent-coral/10 px-4 py-3 font-display text-xs sm:text-sm font-bold text-accent-coral transition-all hover:bg-accent-coral/20 hover:shadow-lg hover:shadow-accent-coral/10 active:scale-[0.98] sm:flex-1"
        @click="$emit('retry')"
      >
        <Icon icon="lucide:rotate-ccw" class="size-4" />
        Chơi lại
      </button>
      <button
        v-if="result.passed && hasNextLevel"
        class="flex items-center justify-center gap-1.5 border border-green-500 bg-green-500/10 px-4 py-3 font-display text-xs sm:text-sm font-bold text-green-400 transition-all hover:bg-green-500/20 hover:shadow-lg hover:shadow-green-500/10 active:scale-[0.98] sm:flex-1"
        @click="$emit('next')"
      >
        Level tiếp
        <Icon icon="lucide:arrow-right" class="size-4" />
      </button>
      <button
        class="col-span-2 flex items-center justify-center gap-1.5 border border-border-default bg-bg-surface px-4 py-3 text-xs sm:text-sm text-text-secondary transition-all hover:border-text-dim hover:text-text-primary hover:bg-bg-elevated active:scale-[0.98]"
        @click="$emit('menu')"
      >
        <Icon icon="lucide:home" class="size-3.5" />
        Về menu
      </button>
    </div>
  </div>
</template>
