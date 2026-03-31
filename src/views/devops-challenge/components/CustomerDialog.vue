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
  <div class="mx-auto max-w-3xl animate-fade-up">
    <!-- Customer card -->
    <div class="border border-border-default bg-bg-surface overflow-hidden">
      <!-- Top accent bar -->
      <div class="h-1 bg-linear-to-r from-accent-coral via-accent-amber to-accent-sky" />

      <div class="p-5 sm:p-8">
        <!-- Customer info -->
        <div class="flex items-start gap-4">
          <div
            class="flex size-14 sm:size-16 shrink-0 items-center justify-center border border-accent-sky/20 bg-bg-deep"
          >
            <Icon :icon="challenge.customerAvatar" class="size-7 sm:size-8 text-accent-sky" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="font-display text-xl sm:text-2xl font-bold text-text-primary">
                {{ challenge.customerName }}
              </h3>
              <span
                class="border px-2 py-0.5 text-xs font-display font-semibold"
                :class="[DIFFICULTY_COLORS[challenge.difficulty], 'border-current/30']"
              >
                {{ DIFFICULTY_LABELS[challenge.difficulty] }}
              </span>
            </div>
            <div class="mt-1 flex items-center gap-2 text-xs text-text-dim">
              <Icon icon="lucide:users" class="size-3.5" />
              <span>{{ challenge.targetUsers.toLocaleString() }} người dùng mục tiêu</span>
            </div>
          </div>
        </div>

        <!-- Requirement quote -->
        <div class="mt-5 border-l-2 border-accent-coral/50 bg-bg-deep/50 p-4 sm:p-5">
          <Icon icon="lucide:quote" class="mb-2 size-5 text-accent-coral/40" />
          <p class="text-sm sm:text-base text-text-primary leading-relaxed italic">
            "{{ challenge.requirement }}"
          </p>
        </div>

        <!-- Detailed requirements -->
        <div class="mt-5">
          <h4
            class="flex items-center gap-2 text-xs font-display font-semibold text-text-dim uppercase tracking-wider"
          >
            <Icon icon="lucide:file-text" class="size-3.5" />
            Chi tiết yêu cầu
          </h4>
          <p class="mt-2 text-xs sm:text-sm text-text-secondary leading-relaxed">
            {{ challenge.detailedRequirements }}
          </p>
        </div>

        <!-- Constraints grid -->
        <div class="mt-5">
          <h4
            class="flex items-center gap-2 text-xs font-display font-semibold text-text-dim uppercase tracking-wider"
          >
            <Icon icon="lucide:gauge" class="size-3.5" />
            Yêu cầu kỹ thuật
          </h4>
          <div class="mt-3 grid gap-2 grid-cols-3 sm:grid-cols-5">
            <div class="border border-border-default bg-bg-deep p-2.5 sm:p-3">
              <Icon icon="lucide:activity" class="size-3.5 text-green-400" />
              <div
                class="mt-1 font-display text-sm sm:text-base font-bold tabular-nums text-text-primary"
              >
                {{ challenge.constraints.minThroughput.toLocaleString() }}
              </div>
              <div class="text-[10px] text-text-dim">req/s</div>
            </div>
            <div class="border border-border-default bg-bg-deep p-2.5 sm:p-3">
              <Icon icon="lucide:timer" class="size-3.5 text-accent-sky" />
              <div
                class="mt-1 font-display text-sm sm:text-base font-bold tabular-nums text-text-primary"
              >
                &lt;{{ challenge.constraints.maxLatency }}
              </div>
              <div class="text-[10px] text-text-dim">ms latency</div>
            </div>
            <div class="border border-border-default bg-bg-deep p-2.5 sm:p-3">
              <Icon icon="lucide:shield" class="size-3.5 text-accent-amber" />
              <div
                class="mt-1 font-display text-sm sm:text-base font-bold tabular-nums text-text-primary"
              >
                {{ challenge.constraints.minSecurity }}
              </div>
              <div class="text-[10px] text-text-dim">bảo mật</div>
            </div>
            <div class="border border-border-default bg-bg-deep p-2.5 sm:p-3">
              <Icon icon="lucide:dollar-sign" class="size-3.5 text-accent-coral" />
              <div
                class="mt-1 font-display text-sm sm:text-base font-bold tabular-nums text-text-primary"
              >
                ${{ challenge.constraints.maxCost.toLocaleString() }}
              </div>
              <div class="text-[10px] text-text-dim">ngân sách</div>
            </div>
            <div class="border border-border-default bg-bg-deep p-2.5 sm:p-3">
              <Icon icon="lucide:heart-pulse" class="size-3.5 text-red-400" />
              <div
                class="mt-1 font-display text-sm sm:text-base font-bold tabular-nums text-text-primary"
              >
                {{ challenge.constraints.minReliability }}%
              </div>
              <div class="text-[10px] text-text-dim">uptime</div>
            </div>
          </div>
        </div>

        <!-- Required categories -->
        <div class="mt-5">
          <h4
            class="flex items-center gap-2 text-xs font-display font-semibold text-text-dim uppercase tracking-wider"
          >
            <Icon icon="lucide:puzzle" class="size-3.5" />
            Danh mục bắt buộc
          </h4>
          <div class="mt-2 flex flex-wrap gap-1.5">
            <span
              v-for="cat in challenge.constraints.requiredCategories"
              :key="cat"
              class="flex items-center gap-1 border border-accent-amber/30 bg-accent-amber/5 px-2 py-1 text-xs text-accent-amber"
            >
              <Icon icon="lucide:check-square" class="size-3" />
              {{ CATEGORY_LABELS[cat] }}
            </span>
          </div>
        </div>

        <!-- Start button -->
        <button
          class="mt-6 sm:mt-8 flex w-full items-center justify-center gap-2 border border-accent-coral bg-accent-coral/10 px-6 py-3.5 font-display text-sm font-bold text-accent-coral transition-all hover:bg-accent-coral/20 hover:shadow-lg hover:shadow-accent-coral/10 active:scale-[0.98]"
          @click="$emit('start')"
        >
          <Icon icon="lucide:rocket" class="size-4" />
          Bắt đầu chọn Tech Stack!
        </button>
      </div>
    </div>
  </div>
</template>
