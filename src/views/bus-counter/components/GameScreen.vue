<script setup lang="ts">
import { Icon } from '@iconify/vue'
import BusCanvas from './BusCanvas.vue'
import RouteMap from './RouteMap.vue'
import HudOverlay from './HudOverlay.vue'
import CountingInput from './CountingInput.vue'
import type { useGameEngine } from '../composables/useGameEngine'

const props = defineProps<{
  engine: ReturnType<typeof useGameEngine>
}>()

const emit = defineEmits<{
  quit: []
}>()

function handleSubmit(answer: number) {
  props.engine.submitAnswer(answer)
}

function handleQuit() {
  emit('quit')
}

function handleToggleMute() {
  props.engine.busAudio.toggleMute()
}
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <!-- HUD -->
    <HudOverlay
      :lives="engine.scoreEngine.lives.value"
      :score="engine.scoreEngine.score.value"
      :phase="engine.phase.value"
      :boarding-timer="engine.boardingTimer.value"
      :counting-timer="engine.countingTimer.value"
      :total-time="engine.totalTime.value"
      :current-stop-index="engine.currentStopIndex.value"
      :total-stops="engine.totalStops.value"
      :stop-name="engine.currentStop.value?.name ?? ''"
      :is-muted="engine.busAudio.isMuted.value"
      @quit="handleQuit"
      @toggle-mute="handleToggleMute"
    />

    <!-- Main content: Route on left, Bus on right -->
    <div class="flex flex-1 flex-col lg:flex-row">
      <!-- Left sidebar: Route Map (visible on lg+, horizontal on mobile) -->
      <div
        class="border-border-default bg-bg-surface shrink-0 border-b lg:w-64 lg:border-r lg:border-b-0 xl:w-72"
      >
        <RouteMap :current-stop-index="engine.currentStopIndex.value" layout="auto" />
      </div>

      <!-- Right: Bus + game controls -->
      <div class="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-4">
        <!-- Transit message -->
        <div
          v-if="
            engine.phase.value === 'TRANSIT' ||
            engine.phase.value === 'COUNTING' ||
            engine.phase.value === 'SCORING'
          "
          class="animate-fade-up text-text-secondary flex items-center gap-2 text-sm"
        >
          <Icon icon="lucide:bus" class="text-accent-sky size-5 animate-bounce" />
          <span>Đang di chuyển đến điểm dừng tiếp theo...</span>
        </div>

        <!-- Bus Canvas -->
        <div class="w-full max-w-3xl">
          <BusCanvas
            :passengers="engine.passengerManager.passengers.value"
            :is-door-open="engine.phase.value === 'BOARDING'"
            :is-transit="['TRANSIT', 'COUNTING', 'SCORING'].includes(engine.phase.value)"
          />
        </div>

        <!-- Scoring result -->
        <div
          v-if="engine.phase.value === 'SCORING' && engine.lastResult.value"
          class="animate-fade-up w-full max-w-sm"
        >
          <div
            class="border p-4 text-center"
            :class="
              engine.lastResult.value.correct
                ? 'border-green-500/50 bg-green-500/10'
                : engine.lastResult.value.close
                  ? 'border-accent-amber/50 bg-accent-amber/10'
                  : 'border-accent-coral/50 bg-accent-coral/10'
            "
          >
            <div class="mb-1 text-2xl">
              {{
                engine.lastResult.value.correct ? '🎯' : engine.lastResult.value.close ? '👍' : '❌'
              }}
            </div>
            <p
              class="font-display mb-1 text-sm font-semibold"
              :class="
                engine.lastResult.value.correct
                  ? 'text-green-400'
                  : engine.lastResult.value.close
                    ? 'text-accent-amber'
                    : 'text-accent-coral'
              "
            >
              {{
                engine.lastResult.value.correct
                  ? 'Chính xác!'
                  : engine.lastResult.value.close
                    ? `Gần đúng! (sai ${engine.lastResult.value.diff} người)`
                    : `Sai rồi! (sai ${engine.lastResult.value.diff} người)`
              }}
            </p>
            <p class="text-text-secondary text-xs">
              Bạn đoán: {{ engine.lastResult.value.playerAnswer }} — Thực tế:
              {{ engine.lastResult.value.actualCount }}
            </p>
            <p
              v-if="engine.lastResult.value.pointsEarned > 0"
              class="text-accent-amber font-display mt-1 text-sm font-bold"
            >
              +{{ engine.lastResult.value.pointsEarned }} điểm
            </p>
            <p
              v-if="!engine.lastResult.value.correct && !engine.lastResult.value.close"
              class="text-accent-coral mt-1 text-xs"
            >
              -1 mạng
            </p>
          </div>
        </div>

        <!-- Counting Input -->
        <div v-if="engine.phase.value === 'COUNTING'" class="w-full max-w-sm">
          <CountingInput :counting-timer="engine.countingTimer.value" @submit="handleSubmit" />
        </div>
      </div>
    </div>
  </div>
</template>
