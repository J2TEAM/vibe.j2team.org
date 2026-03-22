<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { Challenge } from '../types'
import { DIFFICULTY_COLORS, DIFFICULTY_LABELS, CATEGORY_LABELS } from '../types'

defineProps<{
  challenge: Challenge
}>()

defineEmits<{
  start: []
}>()
</script>

<template>
  <div class="border border-border-default bg-bg-surface p-4 sm:p-6 animate-fade-up">
    <!-- Header -->
    <div class="flex items-start gap-3 sm:gap-4">
      <div
        class="flex size-10 sm:size-12 shrink-0 items-center justify-center border border-accent-sky/30 bg-accent-sky/10"
      >
        <Icon :icon="challenge.customerAvatar" class="size-5 sm:size-6 text-accent-sky" />
      </div>
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-2">
          <h3 class="font-display text-base sm:text-lg font-semibold text-accent-coral">
            {{ challenge.customerName }}
          </h3>
          <span
            class="border px-1.5 py-0.5 text-xs font-display"
            :class="[DIFFICULTY_COLORS[challenge.difficulty], 'border-current/30']"
          >
            {{ DIFFICULTY_LABELS[challenge.difficulty] }}
          </span>
        </div>
        <p class="mt-2 text-sm sm:text-base text-text-primary leading-relaxed">
          "{{ challenge.requirement }}"
        </p>
      </div>
    </div>

    <!-- Details -->
    <div class="mt-4 border-t border-border-default pt-4">
      <p class="text-xs sm:text-sm text-text-secondary leading-relaxed">
        {{ challenge.detailedRequirements }}
      </p>
    </div>

    <!-- Constraints summary -->
    <div class="mt-4 grid gap-2 grid-cols-3 sm:grid-cols-3 lg:grid-cols-5">
      <div class="border border-border-default bg-bg-deep p-2">
        <div class="text-[10px] sm:text-xs text-text-dim">Người dùng</div>
        <div class="font-display text-xs sm:text-sm font-semibold text-text-primary">
          {{ challenge.targetUsers.toLocaleString() }}
        </div>
      </div>
      <div class="border border-border-default bg-bg-deep p-2">
        <div class="text-[10px] sm:text-xs text-text-dim">Throughput</div>
        <div class="font-display text-xs sm:text-sm font-semibold text-text-primary">
          {{ challenge.constraints.minThroughput.toLocaleString() }} req/s
        </div>
      </div>
      <div class="border border-border-default bg-bg-deep p-2">
        <div class="text-[10px] sm:text-xs text-text-dim">Latency</div>
        <div class="font-display text-xs sm:text-sm font-semibold text-text-primary">
          &lt; {{ challenge.constraints.maxLatency }}ms
        </div>
      </div>
      <div class="border border-border-default bg-bg-deep p-2">
        <div class="text-[10px] sm:text-xs text-text-dim">Bảo mật</div>
        <div class="font-display text-xs sm:text-sm font-semibold text-text-primary">
          {{ challenge.constraints.minSecurity }}/100
        </div>
      </div>
      <div class="border border-border-default bg-bg-deep p-2">
        <div class="text-[10px] sm:text-xs text-text-dim">Ngân sách</div>
        <div class="font-display text-xs sm:text-sm font-semibold text-text-primary">
          ${{ challenge.constraints.maxCost.toLocaleString() }}/tháng
        </div>
      </div>
    </div>

    <!-- Required categories -->
    <div class="mt-4">
      <div class="text-xs text-text-dim">Danh mục bắt buộc:</div>
      <div class="mt-1 flex flex-wrap gap-1">
        <span
          v-for="cat in challenge.constraints.requiredCategories"
          :key="cat"
          class="border border-accent-amber/30 bg-accent-amber/10 px-2 py-0.5 text-xs text-accent-amber"
        >
          {{ CATEGORY_LABELS[cat] }}
        </span>
      </div>
    </div>

    <!-- Start button -->
    <button
      class="mt-6 w-full border border-accent-coral bg-accent-coral/10 px-6 py-3 font-display text-sm font-semibold text-accent-coral transition hover:bg-accent-coral/20"
      @click="$emit('start')"
    >
      Bắt đầu chọn Tech Stack!
    </button>
  </div>
</template>
