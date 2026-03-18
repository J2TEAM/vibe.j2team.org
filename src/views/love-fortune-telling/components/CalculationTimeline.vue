<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import type { CalculationStep } from '../types'

const props = defineProps<{
  steps: CalculationStep[]
  currentStepIndex: number
}>()

const stackedSteps = computed(() => {
  return props.steps
    .map((step, index) => ({ step, index }))
    .filter(({ index }) => index <= props.currentStepIndex)
    .slice(-5)
    .reverse()
})

const progressLabel = computed(() => {
  return `Bước ${Math.max(props.currentStepIndex + 1, 1)}/${props.steps.length}`
})

const iconByStepType = (type: CalculationStep['type']): string => {
  if (type === 'input') {
    return 'lucide:scroll-text'
  }
  if (type === 'count') {
    return 'lucide:binary'
  }
  if (type === 'combine') {
    return 'lucide:sparkle'
  }
  return 'lucide:circle-dashed'
}

const cardStyle = (depth: number, index: number): Record<string, string | number> => {
  const direction = index % 2 === 0 ? 1 : -1
  const yOffset = 22 + depth * 18
  const xOffset = depth * 1.5 * direction
  const scale = Math.max(0.8, 1 - depth * 0.05)
  const rotate = direction * depth * 1.1

  return {
    top: `${yOffset}px`,
    transform: `translateX(${xOffset}px) scale(${scale}) rotate(${rotate}deg)`,
    zIndex: 30 - depth,
    opacity: Math.max(0.25, 1 - depth * 0.18),
  }
}
</script>

<template>
  <div
    class="timeline-stage relative min-h-85 overflow-hidden border border-border-default bg-bg-surface p-6"
  >
    <div class="pointer-events-none absolute inset-0">
      <div class="mystic-aura mystic-aura-coral" />
      <div class="mystic-aura mystic-aura-amber" />
      <div class="mystic-aura mystic-aura-sky" />

      <span
        v-for="star in 14"
        :key="star"
        class="mystic-star"
        :style="{
          left: `${(star * 7.3) % 100}%`,
          top: `${(star * 11.9) % 100}%`,
          animationDelay: `${(star % 6) * 0.35}s`,
          animationDuration: `${2.2 + (star % 4) * 0.5}s`,
        }"
      />
    </div>

    <TransitionGroup name="mystic-stack" tag="div" class="relative h-70">
      <article
        v-for="({ step, index }, depth) in stackedSteps"
        :key="`stack-${index}`"
        class="step-card absolute left-0 right-0 border border-border-default bg-bg-elevated/95 p-5 backdrop-blur-sm"
        :class="{
          'border-accent-coral shadow-[0_0_30px_rgba(255,107,74,0.22)]': depth === 0,
          'shadow-[0_0_18px_rgba(56,189,248,0.12)]': depth > 0,
        }"
        :style="cardStyle(depth, index)"
      >
        <div class="mb-3 flex items-center justify-between gap-3">
          <div class="inline-flex items-center gap-2">
            <Icon :icon="iconByStepType(step.type)" class="text-lg text-accent-coral" />
            <span class="font-display text-xs tracking-[0.22em] text-text-dim">BÓI TOÁN</span>
          </div>

          <span class="font-display text-xs tracking-[0.22em] text-accent-amber/90">
            #{{ index + 1 }}
          </span>
        </div>

        <p class="font-body text-sm leading-relaxed text-text-primary md:text-[15px]">
          {{ step.content }}
        </p>

        <div v-if="step.type === 'count' && step.displayItems" class="mt-4 flex flex-wrap gap-2">
          <span
            v-for="item in step.displayItems"
            :key="item"
            class="inline-flex items-center gap-1 border border-accent-amber/60 bg-accent-amber/10 px-2.5 py-1 text-xs font-semibold text-accent-amber"
          >
            <Icon icon="lucide:asterisk" class="text-[10px]" />
            {{ item }}
          </span>
        </div>
      </article>
    </TransitionGroup>

    <div class="relative z-40 mt-3 flex items-center justify-between text-xs">
      <span class="font-display tracking-[0.22em] text-text-dim">THẺ MỚI NHẤT NẰM TRÊN</span>
      <span class="font-display tracking-[0.22em] text-accent-coral">{{ progressLabel }}</span>
    </div>
  </div>
</template>

<style scoped>
.timeline-stage {
  isolation: isolate;
}

.mystic-aura {
  position: absolute;
  width: 220px;
  height: 220px;
  border-radius: 9999px;
  filter: blur(38px);
  opacity: 0.22;
  animation: aura-float 8s ease-in-out infinite;
}

.mystic-aura-coral {
  background: rgb(255 107 74 / 42%);
  left: -40px;
  top: -55px;
}

.mystic-aura-amber {
  background: rgb(255 184 48 / 34%);
  right: -55px;
  top: 22%;
  animation-delay: 1.4s;
}

.mystic-aura-sky {
  background: rgb(56 189 248 / 30%);
  left: 30%;
  bottom: -80px;
  animation-delay: 2.2s;
}

.mystic-star {
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 9999px;
  background: rgb(240 237 230 / 90%);
  box-shadow: 0 0 9px rgb(255 255 255 / 80%);
  animation: star-twinkle ease-in-out infinite;
}

.step-card {
  transition:
    transform 420ms ease,
    opacity 420ms ease;
}

.mystic-stack-enter-active,
.mystic-stack-leave-active,
.mystic-stack-move {
  transition: all 520ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.mystic-stack-enter-from,
.mystic-stack-leave-to {
  opacity: 0;
  transform: translateY(28px) scale(0.92);
}

@keyframes aura-float {
  0%,
  100% {
    transform: translateY(0) scale(1);
  }

  50% {
    transform: translateY(-10px) scale(1.08);
  }
}

@keyframes star-twinkle {
  0%,
  100% {
    opacity: 0.15;
    transform: scale(0.8);
  }

  45% {
    opacity: 1;
    transform: scale(1.55);
  }
}
</style>
