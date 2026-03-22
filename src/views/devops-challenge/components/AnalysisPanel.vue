<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { Challenge, SystemMetrics } from '../types'
import MetricBar from './MetricBar.vue'

defineProps<{
  systemMetrics: SystemMetrics
  challenge: Challenge
  warnings: string[]
  canSubmit: boolean
  missingCategories: string[]
}>()

defineEmits<{
  submit: []
}>()
</script>

<template>
  <div class="space-y-3">
    <!-- Metrics card -->
    <div class="border border-border-default bg-bg-surface overflow-hidden">
      <div class="flex items-center gap-2 border-b border-border-default bg-bg-deep/50 px-4 py-2.5">
        <Icon icon="lucide:bar-chart-3" class="size-4 text-accent-sky" />
        <h3 class="font-display text-xs font-bold uppercase tracking-wider text-text-secondary">
          Phân tích hệ thống
        </h3>
      </div>

      <div class="space-y-3 p-4">
        <MetricBar
          label="Throughput"
          icon="lucide:activity"
          :value="systemMetrics.throughput"
          :max="challenge.constraints.minThroughput * 2"
          :target="challenge.constraints.minThroughput"
          unit="req/s"
        />
        <MetricBar
          label="Latency"
          icon="lucide:timer"
          :value="systemMetrics.latency"
          :max="challenge.constraints.maxLatency * 2"
          :target="challenge.constraints.maxLatency"
          unit="ms"
          lower-is-better
        />
        <MetricBar
          label="Bảo mật"
          icon="lucide:shield"
          :value="systemMetrics.security"
          :max="100"
          :target="challenge.constraints.minSecurity"
          unit="/100"
        />
        <MetricBar
          label="Chi phí"
          icon="lucide:dollar-sign"
          :value="systemMetrics.cost"
          :max="challenge.constraints.maxCost * 2"
          :target="challenge.constraints.maxCost"
          unit="$/th"
          lower-is-better
        />
        <MetricBar
          label="Độ tin cậy"
          icon="lucide:heart-pulse"
          :value="systemMetrics.reliability"
          :max="100"
          :target="challenge.constraints.minReliability"
          unit="%"
        />
      </div>
    </div>

    <!-- Warnings -->
    <div
      v-if="warnings.length > 0"
      class="border border-accent-amber/30 bg-accent-amber/5 overflow-hidden"
    >
      <div class="flex items-center gap-2 border-b border-accent-amber/20 px-3 py-2">
        <Icon icon="lucide:alert-triangle" class="size-3.5 text-accent-amber" />
        <span class="text-[11px] font-display font-semibold text-accent-amber">Cảnh báo</span>
      </div>
      <ul class="space-y-1 p-3">
        <li
          v-for="(warning, i) in warnings"
          :key="i"
          class="flex items-start gap-1.5 text-[11px] text-text-secondary leading-relaxed"
        >
          <span class="mt-0.5 size-1 shrink-0 bg-accent-amber/50" />
          {{ warning }}
        </li>
      </ul>
    </div>

    <!-- Missing categories -->
    <div
      v-if="missingCategories.length > 0"
      class="border border-accent-coral/30 bg-accent-coral/5 overflow-hidden"
    >
      <div class="flex items-center gap-2 border-b border-accent-coral/20 px-3 py-2">
        <Icon icon="lucide:alert-circle" class="size-3.5 text-accent-coral" />
        <span class="text-[11px] font-display font-semibold text-accent-coral">Chưa chọn đủ</span>
      </div>
      <div class="flex flex-wrap gap-1.5 p-3">
        <span
          v-for="cat in missingCategories"
          :key="cat"
          class="border border-accent-coral/20 bg-accent-coral/5 px-2 py-0.5 text-[11px] text-accent-coral"
        >
          {{ cat }}
        </span>
      </div>
    </div>

    <!-- Submit button -->
    <button
      class="flex w-full items-center justify-center gap-2 border px-6 py-3 font-display text-sm font-bold transition-all"
      :class="
        canSubmit
          ? 'border-accent-coral bg-accent-coral/10 text-accent-coral hover:bg-accent-coral/20 hover:shadow-lg hover:shadow-accent-coral/10 active:scale-[0.98]'
          : 'border-border-default bg-bg-surface text-text-dim cursor-not-allowed'
      "
      :disabled="!canSubmit"
      @click="$emit('submit')"
    >
      <template v-if="canSubmit">
        <Icon icon="lucide:send" class="size-4" />
        Nộp giải pháp
      </template>
      <template v-else>
        <Icon icon="lucide:lock" class="size-3.5" />
        <span class="text-xs">Chọn đủ danh mục bắt buộc</span>
      </template>
    </button>
  </div>
</template>
