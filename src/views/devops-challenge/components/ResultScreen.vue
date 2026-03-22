<script setup lang="ts">
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import type { Challenge, EvaluationResult } from '../types'
import { techMap } from '../data/technologies'
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
  <div class="space-y-6 animate-fade-up">
    <!-- Header: Pass or Fail -->
    <div class="border border-border-default bg-bg-surface p-5 sm:p-8 text-center">
      <div v-if="result.passed" class="space-y-3 sm:space-y-4">
        <div class="font-display text-2xl sm:text-3xl font-bold text-green-400 animate-fade-up">
          HOÀN THÀNH!
        </div>
        <StarRating :stars="result.stars" size="lg" />
        <div
          class="font-display text-4xl sm:text-5xl font-bold text-text-primary animate-fade-up animate-delay-1"
        >
          {{ result.score }}/100
        </div>
      </div>
      <div v-else class="space-y-3 sm:space-y-4">
        <div class="font-display text-2xl sm:text-3xl font-bold text-accent-coral animate-fade-up">
          CHƯA ĐẠT
        </div>
        <StarRating :stars="0" size="lg" />
        <div
          class="font-display text-4xl sm:text-5xl font-bold text-text-dim animate-fade-up animate-delay-1"
        >
          {{ result.score }}/100
        </div>
        <p class="text-xs sm:text-sm text-text-secondary">
          Giải pháp chưa đạt yêu cầu tối thiểu. Hãy xem gợi ý bên dưới!
        </p>
      </div>
    </div>

    <!-- Score breakdown -->
    <div
      class="border border-border-default bg-bg-surface p-4 sm:p-6 animate-fade-up animate-delay-2"
    >
      <h3 class="flex items-center gap-2 font-display text-sm font-semibold text-text-primary">
        <Icon icon="lucide:bar-chart-3" class="size-4 text-accent-sky" />
        Chi tiết điểm số
      </h3>
      <div class="mt-3 sm:mt-4 space-y-3">
        <div v-for="item in result.breakdown" :key="item.metric">
          <MetricBar
            :label="`${item.metricVi} (${item.subScore}/100)`"
            :value="item.actual"
            :max="Math.max(item.actual, item.required) * 1.5"
            :target="item.required"
            :unit="item.unit"
            :lower-is-better="item.metric === 'latency' || item.metric === 'cost'"
          />
          <div class="mt-0.5 flex justify-between text-[11px] sm:text-xs text-text-dim">
            <span>Thực tế: {{ item.actual.toLocaleString() }}{{ item.unit }}</span>
            <span>Yêu cầu: {{ item.required.toLocaleString() }}{{ item.unit }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Tips -->
    <div
      class="border border-border-default bg-bg-surface p-4 sm:p-6 animate-fade-up animate-delay-3"
    >
      <h3 class="flex items-center gap-2 font-display text-sm font-semibold text-text-primary">
        <Icon icon="lucide:lightbulb" class="size-4 text-accent-amber" />
        Nhận xét &amp; gợi ý
      </h3>
      <ul class="mt-3 space-y-2">
        <li
          v-for="(tip, i) in result.tips"
          :key="i"
          class="text-xs sm:text-sm text-text-secondary leading-relaxed"
        >
          {{ tip }}
        </li>
      </ul>
    </div>

    <!-- Optimal solution (collapsible) -->
    <div
      class="border border-border-default bg-bg-surface p-4 sm:p-6 animate-fade-up animate-delay-4"
    >
      <button
        class="flex w-full items-center justify-between text-left"
        @click="showOptimal = !showOptimal"
      >
        <h3 class="flex items-center gap-2 font-display text-sm font-semibold text-text-primary">
          <Icon icon="lucide:trophy" class="size-4 text-accent-coral" />
          Gợi ý giải pháp tối ưu
        </h3>
        <Icon
          :icon="showOptimal ? 'lucide:chevron-up' : 'lucide:chevron-down'"
          class="size-4 text-text-dim"
        />
      </button>
      <div v-if="showOptimal" class="mt-4 flex flex-wrap gap-2">
        <div
          v-for="techId in result.optimalTechIds"
          :key="techId"
          class="flex items-center gap-2 border border-green-500/30 bg-green-500/5 px-2 sm:px-3 py-1.5 sm:py-2"
        >
          <Icon
            v-if="techMap.get(techId)?.icon"
            :icon="techMap.get(techId)!.icon"
            class="size-3.5 sm:size-4"
          />
          <span class="text-xs sm:text-sm text-text-primary">
            {{ techMap.get(techId)?.nameVi ?? techId }}
          </span>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div
      class="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3 animate-fade-up animate-delay-5"
    >
      <button
        class="border border-accent-coral bg-accent-coral/10 px-4 sm:px-6 py-2.5 sm:py-3 font-display text-xs sm:text-sm font-semibold text-accent-coral transition hover:bg-accent-coral/20 sm:flex-1"
        @click="$emit('retry')"
      >
        <Icon icon="lucide:rotate-ccw" class="mr-1 sm:mr-2 inline size-3.5 sm:size-4" />
        Chơi lại
      </button>
      <button
        v-if="result.passed && hasNextLevel"
        class="border border-green-500 bg-green-500/10 px-4 sm:px-6 py-2.5 sm:py-3 font-display text-xs sm:text-sm font-semibold text-green-400 transition hover:bg-green-500/20 sm:flex-1"
        @click="$emit('next')"
      >
        Level tiếp
        <Icon icon="lucide:arrow-right" class="ml-1 sm:ml-2 inline size-3.5 sm:size-4" />
      </button>
      <button
        class="col-span-2 border border-border-default bg-bg-surface px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm text-text-secondary transition hover:border-text-dim hover:text-text-primary"
        @click="$emit('menu')"
      >
        Về menu
      </button>
    </div>
  </div>
</template>
