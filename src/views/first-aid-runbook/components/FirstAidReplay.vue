<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed } from 'vue'

import type { DecisionLogItem, Severity } from '../types'

const props = defineProps<{
  decisionLog: readonly DecisionLogItem[]
  replayIndex: number
  replayAuto: boolean
  severityLabelMap: Record<Severity, string>
}>()

const emit = defineEmits<{
  prev: []
  next: []
  toggleAuto: []
  setIndex: [index: number]
}>()

const replayItem = computed(() => props.decisionLog[props.replayIndex] ?? null)

function toneClass(severity: Severity): string {
  if (severity === 'safe') {
    return 'text-accent-sky'
  }

  if (severity === 'warning') {
    return 'text-accent-amber'
  }

  return 'text-accent-coral'
}
</script>

<template>
  <section class="mt-5 grid gap-5 lg:grid-cols-[1.15fr_2fr]">
    <article class="border border-border-default bg-bg-surface p-5">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2 text-accent-coral">
          <Icon icon="lucide:history" class="size-4" />
          <h3 class="font-display text-lg font-semibold">Phát Lại Hậu Quả</h3>
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="border border-border-default bg-bg-deep px-2 py-1 text-xs text-text-secondary transition-colors hover:border-accent-sky hover:text-accent-sky"
            @click="emit('prev')"
          >
            Prev
          </button>
          <button
            type="button"
            class="border border-border-default bg-bg-deep px-2 py-1 text-xs text-text-secondary transition-colors hover:border-accent-sky hover:text-accent-sky"
            @click="emit('next')"
          >
            Next
          </button>
          <button
            type="button"
            class="border px-2 py-1 text-xs transition-colors"
            :class="
              replayAuto
                ? 'border-accent-coral bg-accent-coral/10 text-accent-coral'
                : 'border-border-default bg-bg-deep text-text-secondary hover:border-accent-coral hover:text-accent-coral'
            "
            @click="emit('toggleAuto')"
          >
            {{ replayAuto ? 'Stop Auto' : 'Auto Replay' }}
          </button>
        </div>
      </div>

      <p class="mt-3 text-xs text-text-dim">Mốc {{ replayIndex + 1 }}/{{ decisionLog.length }}</p>

      <div v-if="replayItem" class="mt-4 border border-border-default bg-bg-deep p-4">
        <p class="font-display text-xs tracking-widest" :class="toneClass(replayItem.severity)">
          {{ replayItem.stepTitle }}
        </p>
        <p class="mt-3 text-sm text-text-primary">{{ replayItem.selectedLabel }}</p>
        <p class="mt-3 text-sm leading-relaxed text-text-secondary">{{ replayItem.consequence }}</p>
        <div class="mt-4 grid grid-cols-3 gap-2 text-xs">
          <p class="text-text-dim">
            Điểm: <span class="text-text-secondary">{{ replayItem.impact }}</span>
          </p>
          <p class="text-text-dim">
            Tốn: <span class="text-text-secondary">{{ replayItem.elapsedTime }}s</span>
          </p>
          <p class="text-text-dim">
            Còn: <span class="text-text-secondary">{{ replayItem.remainingTime }}s</span>
          </p>
        </div>
        <p v-if="replayItem.timedOut" class="mt-3 text-xs text-accent-coral">
          Mốc này auto-chọn do hết giờ.
        </p>
      </div>
    </article>

    <article class="border border-border-default bg-bg-surface p-5">
      <div class="flex items-center gap-2 text-accent-amber">
        <Icon icon="lucide:list-checks" class="size-4" />
        <h3 class="font-display text-lg font-semibold">Timeline Quyết Định</h3>
      </div>

      <div class="mt-4 space-y-3">
        <button
          v-for="(item, index) in decisionLog"
          :key="item.stepId + item.selectedChoiceId + index"
          type="button"
          class="w-full border p-4 text-left transition-all duration-300 hover:bg-bg-elevated"
          :class="
            replayIndex === index
              ? 'border-accent-coral bg-bg-elevated'
              : 'border-border-default bg-bg-deep'
          "
          @click="emit('setIndex', index)"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <p class="font-display text-xs tracking-widest text-text-dim">{{ item.stepTitle }}</p>
            <p class="font-display text-xs" :class="toneClass(item.severity)">
              {{ severityLabelMap[item.severity] }}
            </p>
          </div>
          <p class="mt-2 text-sm text-text-primary">{{ item.selectedLabel }}</p>
          <p class="mt-2 text-xs text-text-secondary">{{ item.reference }}</p>
        </button>
      </div>
    </article>
  </section>
</template>
