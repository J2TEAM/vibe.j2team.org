<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { stepLabelMap } from '../levels'
import type { EchoState } from '../types'

defineProps<{
  recordingActive: boolean
  canSpawnMoreEchoes: boolean
  turn: number
  won: boolean
  levelIndex: number
  levelsCount: number
  canGoNextLevel: boolean
  currentEchoCount: number
  minEchoToClear: number
  echoes: EchoState[]
}>()

const emit = defineEmits<{
  startRecording: []
  commitRecording: []
  cancelRecording: []
  rewindTimeline: []
  resetLevel: []
  moveUp: []
  moveLeft: []
  waitOneTurn: []
  moveRight: []
  moveDown: []
  goToPreviousLevel: []
  goToNextLevel: []
}>()

function getEchoBadgeClass(id: number): string {
  const palette = [
    'bg-accent-amber text-bg-deep',
    'bg-accent-sky text-bg-deep',
    'bg-accent-coral text-bg-deep',
  ] as const

  return palette[(id - 1) % palette.length] ?? palette[0]
}
</script>

<template>
  <aside class="animate-fade-up animate-delay-2 border border-border-default bg-bg-surface p-4">
    <h2 class="font-display text-xl">
      <span class="text-accent-coral">//</span>
      Điều khiển
    </h2>

    <div class="mt-3 grid gap-2">
      <button
        class="inline-flex items-center justify-center gap-2 border border-border-default bg-bg-elevated px-3 py-2 text-sm font-medium transition hover:border-accent-coral hover:text-accent-coral disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="recordingActive || !canSpawnMoreEchoes || turn !== 0 || won"
        @click="emit('startRecording')"
      >
        <Icon icon="lucide:circle-dot" class="size-4" />
        Ghi vòng lặp
      </button>

      <button
        class="inline-flex items-center justify-center gap-2 border border-border-default bg-bg-elevated px-3 py-2 text-sm font-medium transition hover:border-accent-sky hover:text-accent-sky disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="!recordingActive"
        @click="emit('commitRecording')"
      >
        <Icon icon="lucide:rewind" class="size-4" />
        Chốt Echo + tua đầu
      </button>

      <button
        class="inline-flex items-center justify-center gap-2 border border-border-default bg-bg-elevated px-3 py-2 text-sm font-medium transition hover:border-accent-amber hover:text-accent-amber disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="!recordingActive"
        @click="emit('cancelRecording')"
      >
        <Icon icon="lucide:x" class="size-4" />
        Hủy bản ghi
      </button>

      <button
        class="inline-flex items-center justify-center gap-2 border border-border-default bg-bg-elevated px-3 py-2 text-sm font-medium transition hover:border-accent-sky hover:text-accent-sky"
        @click="emit('rewindTimeline')"
      >
        <Icon icon="lucide:rotate-ccw" class="size-4" />
        Tua timeline (T)
      </button>

      <button
        class="inline-flex items-center justify-center gap-2 border border-border-default bg-bg-elevated px-3 py-2 text-sm font-medium transition hover:border-accent-coral hover:text-accent-coral"
        @click="emit('resetLevel')"
      >
        <Icon icon="lucide:refresh-cw" class="size-4" />
        Reset level
      </button>
    </div>

    <div class="mt-4 border border-border-default bg-bg-elevated p-3">
      <p class="mb-2 text-sm font-medium text-text-secondary">Di chuyển</p>

      <div class="grid grid-cols-3 gap-2">
        <div />
        <button
          class="inline-flex items-center justify-center border border-border-default bg-bg-surface px-3 py-2 transition hover:border-accent-coral hover:text-accent-coral"
          @click="emit('moveUp')"
        >
          <Icon icon="lucide:arrow-up" class="size-4" />
        </button>
        <div />

        <button
          class="inline-flex items-center justify-center border border-border-default bg-bg-surface px-3 py-2 transition hover:border-accent-coral hover:text-accent-coral"
          @click="emit('moveLeft')"
        >
          <Icon icon="lucide:arrow-left" class="size-4" />
        </button>
        <button
          class="inline-flex items-center justify-center border border-border-default bg-bg-surface px-3 py-2 transition hover:border-accent-amber hover:text-accent-amber"
          @click="emit('waitOneTurn')"
        >
          <Icon icon="lucide:pause" class="size-4" />
        </button>
        <button
          class="inline-flex items-center justify-center border border-border-default bg-bg-surface px-3 py-2 transition hover:border-accent-coral hover:text-accent-coral"
          @click="emit('moveRight')"
        >
          <Icon icon="lucide:arrow-right" class="size-4" />
        </button>

        <div />
        <button
          class="inline-flex items-center justify-center border border-border-default bg-bg-surface px-3 py-2 transition hover:border-accent-coral hover:text-accent-coral"
          @click="emit('moveDown')"
        >
          <Icon icon="lucide:arrow-down" class="size-4" />
        </button>
        <div />
      </div>
    </div>

    <div class="mt-4 flex gap-2">
      <button
        class="flex-1 border border-border-default bg-bg-elevated px-3 py-2 text-sm transition hover:border-accent-coral hover:text-accent-coral disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="levelIndex === 0"
        @click="emit('goToPreviousLevel')"
      >
        Level trước
      </button>
      <button
        class="flex-1 border border-border-default bg-bg-elevated px-3 py-2 text-sm transition hover:border-accent-coral hover:text-accent-coral disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="!canGoNextLevel"
        @click="emit('goToNextLevel')"
      >
        Level sau
      </button>
    </div>

    <p v-if="!won && levelIndex < levelsCount - 1" class="mt-2 text-xs text-accent-amber">
      Thắng level hiện tại để mở level sau.
    </p>

    <p class="mt-2 text-xs text-text-secondary">
      Điều kiện qua màn: ít nhất {{ minEchoToClear }} Echo (hiện tại: {{ currentEchoCount }}).
    </p>

    <div
      class="mt-4 border border-border-default bg-bg-elevated p-3 text-xs text-text-secondary sm:text-sm"
    >
      <p class="font-medium text-text-primary">Shortcut</p>
      <p class="mt-1">WASD / Arrow: di chuyển</p>
      <p>Space: chờ 1 nhịp</p>
      <p>R: bắt đầu ghi / chốt Echo</p>
      <p>Esc: hủy bản ghi</p>
      <p>T: tua timeline</p>
      <p>Backspace: reset level</p>
    </div>

    <div
      class="mt-4 border border-border-default bg-bg-elevated p-3 text-xs text-text-secondary sm:text-sm"
    >
      <p class="font-medium text-text-primary">Echo scripts</p>
      <div v-if="echoes.length === 0" class="mt-1">Chưa có Echo nào.</div>
      <ul v-else class="mt-2 space-y-2">
        <li
          v-for="echo in echoes"
          :key="echo.id"
          class="border border-border-default bg-bg-surface p-2"
        >
          <div class="mb-1 flex items-center justify-between">
            <span
              class="inline-flex min-w-7 items-center justify-center px-2 py-0.5 text-xs font-semibold"
              :class="getEchoBadgeClass(echo.id)"
            >
              E{{ echo.id }}
            </span>
            <span>{{ echo.script.length }} bước</span>
          </div>

          <p class="break-all font-mono text-[11px] text-text-secondary">
            {{ echo.script.map((step) => stepLabelMap[step]).join(' ') }}
          </p>
        </li>
      </ul>
    </div>
  </aside>
</template>
