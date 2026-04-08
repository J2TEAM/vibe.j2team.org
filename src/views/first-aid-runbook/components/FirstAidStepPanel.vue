<script setup lang="ts">
import { Icon } from '@iconify/vue'

import type { Scenario, ScenarioStep, Severity } from '../types'

defineProps<{
  scenario: Scenario
  currentStep: ScenarioStep
  timeLeft: number
  timerRatio: number
  timerToneClass: string
  severityLabelMap: Record<Severity, string>
}>()

const emit = defineEmits<{
  choose: [choiceId: string]
}>()

function toneClass(severity: Severity): string {
  if (severity === 'safe') {
    return 'text-accent-sky border-accent-sky/35'
  }

  if (severity === 'warning') {
    return 'text-accent-amber border-accent-amber/35'
  }

  return 'text-accent-coral border-accent-coral/35'
}

function severityIcon(severity: Severity): string {
  if (severity === 'safe') {
    return 'lucide:shield-check'
  }

  if (severity === 'warning') {
    return 'lucide:triangle-alert'
  }

  return 'lucide:octagon-alert'
}
</script>

<template>
  <section
    class="mt-8 border border-border-default bg-bg-surface p-6 animate-fade-up animate-delay-2"
  >
    <div class="grid gap-5 lg:grid-cols-[1.1fr_1.5fr]">
      <article class="space-y-4">
        <div class="flex items-center gap-2 text-accent-coral">
          <Icon :icon="scenario.icon" class="size-4" />
          <p class="font-display text-xs tracking-widest">{{ currentStep.title }}</p>
        </div>

        <img
          :src="scenario.image"
          :alt="`Tình huống ${scenario.name}`"
          class="aspect-video w-full border border-border-default bg-bg-deep object-contain p-1"
        />

        <p class="text-sm text-text-secondary">{{ currentStep.reference }}</p>

        <div class="border border-border-default bg-bg-deep px-3 py-2 text-center">
          <p class="font-display text-xs tracking-widest text-text-dim">THỜI GIAN CÒN LẠI</p>
          <p class="mt-1 font-display text-3xl text-accent-amber">{{ timeLeft }}s</p>
        </div>
      </article>

      <article>
        <div class="h-1 w-full bg-bg-deep">
          <div
            class="h-1 transition-all duration-500"
            :class="timerToneClass"
            :style="{ width: `${timerRatio * 100}%` }"
          ></div>
        </div>

        <p class="mt-4 text-base leading-relaxed text-text-primary">{{ currentStep.prompt }}</p>

        <div class="mt-4 grid gap-3 md:grid-cols-2">
          <button
            v-for="choice in currentStep.choices"
            :key="choice.id"
            type="button"
            class="border bg-bg-deep p-4 text-left transition-all duration-300 hover:-translate-y-1 hover:bg-bg-elevated"
            :class="toneClass(choice.severity)"
            @click="emit('choose', choice.id)"
          >
            <div class="flex items-center gap-2 text-xs">
              <Icon :icon="severityIcon(choice.severity)" class="size-4" />
              <span class="font-display tracking-widest">{{
                severityLabelMap[choice.severity]
              }}</span>
            </div>
            <p class="mt-2 text-sm leading-relaxed text-text-primary">{{ choice.label }}</p>
          </button>
        </div>

        <p class="mt-4 text-xs text-text-dim">
          Hết giờ, hệ thống sẽ tự chọn lựa chọn mặc định của bước hiện tại.
        </p>
      </article>
    </div>
  </section>
</template>
