<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed, type ComponentPublicInstance, type CSSProperties } from 'vue'
import type { BoatState, GamePhase, Obstacle, TrailPoint, Whirlpool } from '../types'

interface Props {
  phase: GamePhase
  riverStyle: CSSProperties
  whirlpools: Whirlpool[]
  obstacles: Obstacle[]
  trailPoints: TrailPoint[]
  riverTick: number
  boat: BoatState
  boatAngle: number
  progress: number
  turnMessage: string
  summaryHeadline: string
  setBoardElement: (element: HTMLElement | null) => void
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (event: 'pointerdown', payload: PointerEvent): void
  (event: 'pointermove', payload: PointerEvent): void
  (event: 'pointerup', payload: PointerEvent): void
}>()

const progressPercent = computed(() => Math.round(props.progress * 100))

function bindBoardElement(element: Element | ComponentPublicInstance | null) {
  props.setBoardElement(element instanceof HTMLElement ? element : null)
}

function onPointerDown(event: PointerEvent) {
  emit('pointerdown', event)
}

function onPointerMove(event: PointerEvent) {
  emit('pointermove', event)
}

function onPointerUp(event: PointerEvent) {
  emit('pointerup', event)
}
</script>

<template>
  <section class="animate-fade-up animate-delay-3 border border-border-default bg-bg-surface p-4 sm:p-5">
    <div
      :ref="bindBoardElement"
      class="relative mx-auto aspect-[9/14] w-full max-w-md touch-none select-none overflow-hidden border border-border-default"
      @pointercancel="onPointerUp"
      @pointerdown="onPointerDown"
      @pointerleave="onPointerUp"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
    >
      <div class="absolute inset-0" :style="riverStyle" />

      <div
        class="absolute inset-0"
        style="background: linear-gradient(90deg, rgba(255, 184, 48, 0.08) 0%, transparent 12%, transparent 88%, rgba(255, 184, 48, 0.08) 100%)"
      />

      <div
        class="absolute inset-x-0 top-0 flex h-10 items-center justify-center border-b border-border-default bg-bg-deep/75 font-display text-xs tracking-[0.18em] text-accent-amber"
      >
        BỜ ĐÍCH
      </div>
      <div
        class="absolute inset-x-0 bottom-0 flex h-12 items-center justify-center border-t border-border-default bg-bg-deep/75 font-display text-xs tracking-[0.18em] text-accent-sky"
      >
        XUẤT PHÁT
      </div>

      <div
        v-for="whirlpool in whirlpools"
        :key="whirlpool.id"
        class="absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center"
        :style="{
          left: `${whirlpool.x}px`,
          top: `${whirlpool.y}px`,
          width: `${whirlpool.radius}px`,
          height: `${whirlpool.radius}px`,
        }"
      >
        <Icon
          icon="lucide:disc-3"
          class="size-full text-accent-amber/40"
          :style="{ transform: `rotate(${riverTick * 180 + whirlpool.spinOffset}deg)` }"
        />
      </div>

      <div
        v-for="obstacle in obstacles"
        :key="obstacle.id"
        class="absolute -translate-x-1/2 -translate-y-1/2"
        :style="{ left: `${obstacle.x}px`, top: `${obstacle.y}px` }"
      >
        <Icon
          icon="lucide:trash-2"
          class="text-text-primary/70"
          :style="{
            width: `${obstacle.radius * 1.5}px`,
            height: `${obstacle.radius * 1.5}px`,
          }"
        />
      </div>

      <span
        v-for="point in trailPoints"
        :key="point.id"
        class="absolute block size-2 -translate-x-1/2 -translate-y-1/2 border border-accent-sky"
        :style="{
          left: `${point.x}px`,
          top: `${point.y}px`,
          opacity: point.life,
          transform: `translate(-50%, -50%) scale(${0.6 + point.life * 0.5})`,
        }"
      />

      <div
        class="absolute -translate-x-1/2 -translate-y-1/2"
        :style="{
          left: `${boat.x}px`,
          top: `${boat.y}px`,
          transform: `translate(-50%, -50%) rotate(${boatAngle}deg)`,
        }"
      >
        <Icon icon="lucide:sailboat" class="size-9 text-text-primary" />
      </div>

      <div class="absolute inset-x-4 top-12 border border-border-default bg-bg-deep/80 px-3 py-2">
        <div class="mb-1 flex items-center justify-between text-xs text-text-secondary">
          <span>Tiến độ</span>
          <span class="font-display text-text-primary">{{ progressPercent }}%</span>
        </div>
        <div class="h-2 border border-border-default bg-bg-surface">
          <div class="h-full bg-accent-coral transition-all duration-200" :style="{ width: `${progressPercent}%` }" />
        </div>
      </div>

      <div
        v-if="phase !== 'running'"
        class="absolute inset-0 flex items-center justify-center bg-bg-deep/70 p-4 text-center"
      >
        <div class="max-w-xs border border-border-default bg-bg-surface p-4">
          <p class="font-display text-sm tracking-widest text-accent-coral">// STATUS</p>
          <p class="mt-2 text-sm text-text-secondary">{{ turnMessage }}</p>
          <p v-if="phase === 'match-summary'" class="mt-3 font-display text-base text-text-primary">
            {{ summaryHeadline }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
