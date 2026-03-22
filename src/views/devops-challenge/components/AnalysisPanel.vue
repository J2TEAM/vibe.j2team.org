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
  <div class="space-y-4">
    <!-- Metrics -->
    <div class="border border-border-default bg-bg-surface p-4">
      <h3 class="flex items-center gap-2 font-display text-sm font-semibold text-text-primary">
        <Icon icon="lucide:bar-chart-3" class="size-4 text-accent-sky" />
        Phân tích hệ thống
      </h3>

      <div class="mt-4 space-y-3">
        <MetricBar
          label="Throughput"
          :value="systemMetrics.throughput"
          :max="challenge.constraints.minThroughput * 2"
          :target="challenge.constraints.minThroughput"
          unit="req/s"
        />
        <MetricBar
          label="Latency"
          :value="systemMetrics.latency"
          :max="challenge.constraints.maxLatency * 2"
          :target="challenge.constraints.maxLatency"
          unit="ms"
          lower-is-better
        />
        <MetricBar
          label="Bảo mật"
          :value="systemMetrics.security"
          :max="100"
          :target="challenge.constraints.minSecurity"
          unit="/100"
        />
        <MetricBar
          label="Chi phí"
          :value="systemMetrics.cost"
          :max="challenge.constraints.maxCost * 2"
          :target="challenge.constraints.maxCost"
          unit="$/tháng"
          lower-is-better
        />
        <MetricBar
          label="Độ tin cậy"
          :value="systemMetrics.reliability"
          :max="100"
          :target="challenge.constraints.minReliability"
          unit="%"
        />
      </div>
    </div>

    <!-- Warnings -->
    <div v-if="warnings.length > 0" class="border border-accent-amber/30 bg-accent-amber/5 p-4">
      <h4 class="flex items-center gap-2 text-xs font-display text-accent-amber">
        <Icon icon="lucide:alert-triangle" class="size-3.5" />
        Cảnh báo
      </h4>
      <ul class="mt-2 space-y-1">
        <li v-for="(warning, i) in warnings" :key="i" class="text-xs text-text-secondary">
          {{ warning }}
        </li>
      </ul>
    </div>

    <!-- Missing categories -->
    <div
      v-if="missingCategories.length > 0"
      class="border border-accent-coral/30 bg-accent-coral/5 p-4"
    >
      <h4 class="flex items-center gap-2 text-xs font-display text-accent-coral">
        <Icon icon="lucide:alert-circle" class="size-3.5" />
        Chưa chọn đủ
      </h4>
      <p class="mt-1 text-xs text-text-secondary">Còn thiếu: {{ missingCategories.join(', ') }}</p>
    </div>

    <!-- Submit button -->
    <button
      class="w-full border px-6 py-3 font-display text-sm font-semibold transition"
      :class="
        canSubmit
          ? 'border-accent-coral bg-accent-coral/10 text-accent-coral hover:bg-accent-coral/20'
          : 'border-border-default bg-bg-surface text-text-dim cursor-not-allowed'
      "
      :disabled="!canSubmit"
      @click="$emit('submit')"
    >
      <span v-if="canSubmit">
        <Icon icon="lucide:send" class="mr-2 inline size-4" />
        Nộp giải pháp
      </span>
      <span v-else> Chọn đủ danh mục bắt buộc để nộp </span>
    </button>
  </div>
</template>
