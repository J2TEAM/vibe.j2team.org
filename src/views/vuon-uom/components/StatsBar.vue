<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import type { Stats, DerivedStats, StatKey, ResourceKey } from '../types'
import { Icon } from '@iconify/vue'
import { TRACK_LUCIDE, DERIVED_LUCIDE, RESOURCE_LUCIDE } from '../constants/icons'

const props = defineProps<{
  stats: Stats
  derived: DerivedStats
  production?: Record<ResourceKey, number>
}>()

const STAT_CONFIG: { key: StatKey; color: string }[] = [
  { key: 'nature', color: '#4ADE80' },
  { key: 'human', color: '#FFB830' },
  { key: 'economy', color: '#FF6B4A' },
  { key: 'digital', color: '#38BDF8' },
]

// ── Animated display values ──────────────────────────────────────────────
const displayStats = ref<Stats>({ ...props.stats })

const activeIntervals = new Set<ReturnType<typeof setInterval>>()
const activeTimers = new Set<ReturnType<typeof setTimeout>>()

function animateValue(key: StatKey, from: number, to: number) {
  const diff = to - from
  if (diff === 0) return
  const steps = Math.min(Math.abs(diff), 12)
  const stepSize = diff / steps
  let current = from
  let step = 0
  const interval = setInterval(() => {
    step++
    current += stepSize
    displayStats.value[key] = Math.round(current)
    if (step >= steps) {
      displayStats.value[key] = to
      clearInterval(interval)
      activeIntervals.delete(interval)
    }
  }, 35)
  activeIntervals.add(interval)
}

const deltas = ref<Partial<Record<StatKey, number>>>({})
const showDeltas = ref(false)
const bounceKeys = ref<Set<StatKey>>(new Set())

watch(
  () => ({ ...props.stats }),
  (newStats, oldStats) => {
    if (!oldStats) {
      displayStats.value = { ...newStats }
      return
    }
    const newDeltas: Partial<Record<StatKey, number>> = {}
    const newBounce = new Set<StatKey>()
    for (const key of ['nature', 'human', 'economy', 'digital'] as StatKey[]) {
      const diff = newStats[key] - oldStats[key]
      if (diff !== 0) {
        newDeltas[key] = diff
        newBounce.add(key)
        animateValue(key, oldStats[key], newStats[key])
      } else {
        displayStats.value[key] = newStats[key]
      }
    }
    if (Object.keys(newDeltas).length > 0) {
      deltas.value = newDeltas
      showDeltas.value = true
      bounceKeys.value = newBounce
      const id = setTimeout(() => {
        showDeltas.value = false
        bounceKeys.value = new Set()
        activeTimers.delete(id)
      }, 1800)
      activeTimers.add(id)
    }
  },
  { deep: true },
)

onUnmounted(() => {
  activeIntervals.forEach(clearInterval)
  activeTimers.forEach(clearTimeout)
})
</script>

<template>
  <div
    class="flex items-center justify-between gap-1 px-2 py-1.5 rounded-lg bg-bg-surface/60 border border-border-default/30 stats-bar"
  >
    <!-- 4 stats -->
    <div
      v-for="stat in STAT_CONFIG"
      :key="stat.key"
      class="flex items-center gap-1 relative stat-item"
    >
      <!-- Icon with bounce + glow ring -->
      <div class="relative">
        <Icon
          :icon="TRACK_LUCIDE[stat.key]"
          class="w-3.5 h-3.5 relative z-10"
          :class="{ 'stat-icon-bounce': bounceKeys.has(stat.key) }"
          :style="{ color: stat.color }"
        />
        <!-- Glow ring on change -->
        <div
          v-if="bounceKeys.has(stat.key)"
          class="absolute inset-[-3px] rounded-full stat-glow"
          :style="{ boxShadow: `0 0 8px 2px ${stat.color}40` }"
        />
      </div>

      <!-- Number with pop -->
      <span
        class="text-xs font-bold font-display tabular-nums"
        :class="{ 'stat-num-pop': bounceKeys.has(stat.key) }"
        :style="{ color: stat.color }"
      >
        {{ displayStats[stat.key] }}
      </span>

      <!-- Delta badge -->
      <Transition name="delta">
        <span
          v-if="showDeltas && deltas[stat.key]"
          class="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-bold whitespace-nowrap pointer-events-none delta-badge"
          :class="deltas[stat.key]! > 0 ? 'text-green-400' : 'text-red-400'"
        >
          {{ deltas[stat.key]! > 0 ? '+' : '' }}{{ deltas[stat.key] }}
        </span>
      </Transition>
    </div>

    <!-- Divider -->
    <div class="w-px h-3 bg-border-default/50" />

    <!-- Derived: harmony -->
    <div class="flex items-center gap-1">
      <Icon :icon="DERIVED_LUCIDE.harmony" class="w-3 h-3 text-text-dim" />
      <span class="text-[11px] font-bold font-display tabular-nums text-text-secondary">{{
        derived.harmony
      }}</span>
    </div>

    <!-- Production rates (if any) -->
    <template
      v-if="
        production && (production.food > 0 || production.materials > 0 || production.knowledge > 0)
      "
    >
      <div class="w-px h-3 bg-border-default/50" />
      <div class="flex items-center gap-1.5 text-[10px] font-bold tabular-nums">
        <span v-if="production.food > 0" class="flex items-center gap-0.5 text-green-400/70">
          <Icon :icon="RESOURCE_LUCIDE.food" class="w-2.5 h-2.5" />+{{ production.food }}
        </span>
        <span v-if="production.materials > 0" class="flex items-center gap-0.5 text-orange-300/70">
          <Icon :icon="RESOURCE_LUCIDE.materials" class="w-2.5 h-2.5" />+{{ production.materials }}
        </span>
        <span v-if="production.knowledge > 0" class="flex items-center gap-0.5 text-violet-400/70">
          <Icon :icon="RESOURCE_LUCIDE.knowledge" class="w-2.5 h-2.5" />+{{ production.knowledge }}
        </span>
      </div>
    </template>
  </div>
</template>

<style scoped>
.stats-bar {
  transition: box-shadow 0.3s ease;
}

/* Icon bounce on stat change */
.stat-icon-bounce {
  animation: icon-bounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes icon-bounce {
  0% {
    transform: scale(1);
  }
  30% {
    transform: scale(1.4) rotate(-8deg);
  }
  60% {
    transform: scale(0.9) rotate(4deg);
  }
  100% {
    transform: scale(1) rotate(0);
  }
}

/* Number pop on change */
.stat-num-pop {
  animation: num-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes num-pop {
  0% {
    transform: scale(1);
  }
  40% {
    transform: scale(1.3);
  }
  100% {
    transform: scale(1);
  }
}

/* Glow ring pulse */
.stat-glow {
  animation: glow-ring 0.8s ease-out forwards;
}
@keyframes glow-ring {
  0% {
    opacity: 0.8;
    transform: scale(0.8);
  }
  50% {
    opacity: 0.4;
    transform: scale(1.2);
  }
  100% {
    opacity: 0;
    transform: scale(1.5);
  }
}

/* Delta badge float */
.delta-enter-active {
  animation: delta-float 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.delta-leave-active {
  animation: delta-fade 0.5s ease-in forwards;
}
@keyframes delta-float {
  0% {
    opacity: 0;
    transform: translate(-50%, 6px) scale(0.5);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, 0) scale(1);
  }
}
@keyframes delta-fade {
  from {
    opacity: 1;
    transform: translate(-50%, 0);
  }
  to {
    opacity: 0;
    transform: translate(-50%, -8px);
  }
}

/* Delta badge shake */
.delta-badge {
  animation: delta-shake 0.3s ease-out 0.1s;
}
@keyframes delta-shake {
  0%,
  100% {
    transform: translate(-50%, 0);
  }
  25% {
    transform: translate(calc(-50% + 2px), 0);
  }
  75% {
    transform: translate(calc(-50% - 2px), 0);
  }
}
</style>
