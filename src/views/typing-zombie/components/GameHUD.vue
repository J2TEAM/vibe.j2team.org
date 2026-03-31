<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import type { PowerUpType } from '../types'
import { useGameStore } from '../stores/gameStore'

// Multi-word component name for lint compliance
defineOptions({ name: 'TypingZombieGameHUD' })

const store = useGameStore()
const emit = defineEmits<{ pause: []; resume: []; menu: [] }>()

const powerUpCounts = computed(() => {
  const counts: Record<PowerUpType, number> = { slow: 0, auto: 0, bomb: 0, double: 0 }
  for (const t of store.powerUps) counts[t]++
  return counts
})

function activate(type: PowerUpType) {
  store.activatePowerUp(type)
}

function onPause() {
  emit('pause')
}

function onResume() {
  emit('resume')
}

function onMenu() {
  emit('menu')
}
</script>

<template>
  <div
    class="flex flex-wrap items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-3 border-b border-border-default bg-bg-surface"
  >
    <!-- Score -->
    <div class="flex items-center gap-2">
      <Icon icon="lucide:trophy" class="size-4 text-accent-amber" />
      <div class="leading-none">
        <div class="text-[10px] sm:text-xs text-text-dim font-display tracking-widest uppercase">
          Điểm
        </div>
        <div
          :key="store.scorePulse"
          class="text-lg sm:text-2xl font-display font-bold tabular-nums tracking-tight hud-pop"
        >
          {{ store.score }}
        </div>
      </div>
    </div>

    <!-- Level + Combo -->
    <div class="flex items-center gap-3">
      <div class="flex items-center gap-2">
        <Icon icon="lucide:layers" class="size-4 text-accent-sky" />
        <div class="leading-none">
          <div class="text-[10px] sm:text-xs text-text-dim font-display tracking-widest uppercase">
            Level
          </div>
          <div :key="store.levelPulse" class="text-base sm:text-xl font-display font-bold hud-pop">
            {{ store.level }}
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <Icon icon="lucide:flame" class="size-4 text-accent-coral" />
        <div class="leading-none">
          <div class="text-[10px] text-text-dim font-display tracking-widest uppercase">Combo</div>
          <div :key="store.comboPulse" class="text-base font-display font-bold hud-pop">
            {{ store.combo }} <span class="text-accent-sky">x{{ store.multiplier }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Lives + Shield -->
    <div class="flex items-center gap-2">
      <div class="flex items-center gap-2">
        <Icon icon="lucide:heart" class="size-4 text-accent-coral" />
        <div class="flex gap-1">
          <span
            v-for="i in store.maxHealth"
            :key="i"
            class="inline-block size-2.5 sm:size-3.5 border border-border-default"
            :class="i <= store.health ? 'bg-accent-coral' : 'bg-transparent opacity-60'"
          >
          </span>
        </div>
      </div>

      <div v-if="store.shield > 0" class="hidden sm:flex items-center gap-2">
        <Icon icon="lucide:shield" class="size-4 text-accent-sky" />
        <div class="flex gap-1">
          <span
            v-for="i in store.shield"
            :key="i"
            class="inline-block size-2.5 sm:size-3.5 border border-border-default bg-accent-sky/70"
          />
        </div>
      </div>
    </div>

    <!-- Streak -->
    <div v-if="store.streak" class="hidden lg:flex items-center gap-2">
      <Icon icon="lucide:sparkles" class="size-4 text-accent-amber" />
      <div :key="store.comboPulse" class="text-sm font-display font-bold tracking-wide hud-pop">
        {{ store.streak }}
      </div>
    </div>

    <!-- Power-ups -->
    <div class="flex items-center gap-1.5">
      <div class="hidden md:flex items-center gap-1.5 mr-1">
        <span
          v-if="store.isSlowActive"
          class="px-2 py-1 border border-border-default bg-bg-deep text-accent-sky text-[10px] font-display tracking-widest uppercase"
        >
          Slow
        </span>
        <span
          v-if="store.isDoubleActive"
          class="px-2 py-1 border border-border-default bg-bg-deep text-accent-amber text-[10px] font-display tracking-widest uppercase"
        >
          x2
        </span>
      </div>
      <button
        type="button"
        class="hud-pu"
        :class="powerUpCounts.slow ? 'hud-pu--on' : 'hud-pu--off'"
        :disabled="!powerUpCounts.slow"
        @click="activate('slow')"
      >
        <Icon icon="lucide:clock-3" class="size-4" />
        <span class="hidden sm:inline">1</span>
        <span v-if="powerUpCounts.slow" class="hud-count">{{ powerUpCounts.slow }}</span>
      </button>
      <button
        type="button"
        class="hud-pu"
        :class="powerUpCounts.auto ? 'hud-pu--on' : 'hud-pu--off'"
        :disabled="!powerUpCounts.auto"
        @click="activate('auto')"
      >
        <Icon icon="lucide:keyboard" class="size-4" />
        <span class="hidden sm:inline">2</span>
        <span v-if="powerUpCounts.auto" class="hud-count">{{ powerUpCounts.auto }}</span>
      </button>
      <button
        type="button"
        class="hud-pu"
        :class="powerUpCounts.bomb ? 'hud-pu--on' : 'hud-pu--off'"
        :disabled="!powerUpCounts.bomb"
        @click="activate('bomb')"
      >
        <Icon icon="lucide:bomb" class="size-4" />
        <span class="hidden sm:inline">3</span>
        <span v-if="powerUpCounts.bomb" class="hud-count">{{ powerUpCounts.bomb }}</span>
      </button>
      <button
        type="button"
        class="hud-pu"
        :class="powerUpCounts.double ? 'hud-pu--on' : 'hud-pu--off'"
        :disabled="!powerUpCounts.double"
        @click="activate('double')"
      >
        <Icon icon="lucide:x" class="size-4" />
        <span class="hidden sm:inline">4</span>
        <span v-if="powerUpCounts.double" class="hud-count">{{ powerUpCounts.double }}</span>
      </button>
    </div>

    <!-- Controls -->
    <div class="flex items-center gap-2">
      <button
        v-if="store.status === 'playing'"
        type="button"
        class="px-3 py-2 border border-border-default bg-bg-deep text-text-secondary text-xs font-display tracking-widest uppercase transition hover:border-accent-sky hover:text-text-primary active:translate-y-0.5"
        @click="onPause"
      >
        Pause
      </button>
      <button
        v-else-if="store.status === 'paused'"
        type="button"
        class="px-3 py-2 border border-accent-coral bg-accent-coral text-bg-deep text-xs font-display tracking-widest uppercase transition hover:brightness-105 active:translate-y-0.5"
        @click="onResume"
      >
        Resume
      </button>
      <button
        type="button"
        class="px-3 py-2 border border-border-default bg-bg-deep text-text-secondary text-xs font-display tracking-widest uppercase transition hover:border-accent-coral hover:text-text-primary active:translate-y-0.5"
        @click="onMenu"
      >
        Menu
      </button>
    </div>
  </div>
</template>

<style scoped>
.hud-pop {
  animation: hudPop 240ms ease-out both;
}

@keyframes hudPop {
  0% {
    transform: translateY(1px) scale(0.98);
    opacity: 0.82;
  }
  100% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

.hud-pu {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border: 1px solid var(--color-border-default);
  background: var(--color-bg-deep);
  color: var(--color-text-secondary);
  font-family: var(--font-display);
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  transition:
    transform 120ms,
    filter 200ms,
    border-color 200ms,
    color 200ms,
    background-color 200ms;
}

.hud-pu:active {
  transform: translateY(1px);
}

.hud-pu--on {
  color: var(--color-text-primary);
  border-color: var(--color-accent-coral);
}

.hud-pu--off {
  opacity: 0.55;
}

.hud-pu:disabled {
  cursor: not-allowed;
}

.hud-count {
  position: absolute;
  top: -7px;
  right: -7px;
  min-width: 18px;
  height: 18px;
  display: grid;
  place-items: center;
  background: var(--color-accent-amber);
  color: var(--color-bg-deep);
  border: 1px solid #000;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.06em;
}
</style>
