<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import type { PlayerState } from '../types'
import { RANK_CONFIG } from '../constants'

const props = defineProps<{
  player: PlayerState
  expProgress: number
  hpPercent: number
}>()

const rankConfig = computed(() => RANK_CONFIG.find((r) => r.label === props.player.rank))
const nextRankConfig = computed(() => {
  const idx = RANK_CONFIG.findIndex((r) => r.label === props.player.rank)
  return idx >= 0 && idx < RANK_CONFIG.length - 1 ? RANK_CONFIG[idx + 1] : null
})

const rankColor = computed(() => {
  const map: Record<string, string> = {
    F: 'text-text-dim',
    E: 'text-text-secondary',
    D: 'text-accent-sky',
    C: 'text-green-400',
    B: 'text-accent-amber',
    A: 'text-accent-coral',
    S: 'text-violet-400',
    SS: 'text-accent-amber',
  }
  return map[props.player.rank] ?? 'text-text-dim'
})

const hpBarColor = computed(() => {
  if (props.hpPercent > 60) return 'bg-red-500'
  if (props.hpPercent > 30) return 'bg-orange-500'
  return 'bg-red-700 animate-pulse'
})
</script>

<template>
  <div
    class="fixed top-0 left-0 right-0 z-50 border-b border-border-default bg-bg-deep/95 backdrop-blur-md"
  >
    <div class="mx-auto max-w-5xl px-3 py-2">
      <div class="flex items-center gap-2 sm:gap-4">
        <!-- Home Button -->
        <RouterLink
          to="/"
          class="group flex h-10 flex-shrink-0 items-center justify-center gap-2 border border-border-default bg-bg-surface px-3 transition hover:border-accent-amber hover:bg-accent-amber/5 sm:h-12 sm:px-4"
          title="Về Trang Chủ"
        >
          <Icon
            icon="lucide:home"
            class="size-4 sm:size-5 text-text-dim transition-colors group-hover:text-accent-amber"
          />
          <span
            class="hidden font-display text-xs font-bold tracking-wider text-text-secondary transition-colors group-hover:text-accent-amber sm:block"
          >
            TRANG CHỦ
          </span>
        </RouterLink>

        <!-- Rank Badge -->
        <div class="flex-shrink-0">
          <div
            class="flex size-10 sm:size-12 flex-col items-center justify-center border border-border-default bg-bg-surface"
          >
            <span class="font-display text-[10px] tracking-widest text-text-dim">RANK</span>
            <span class="font-display text-lg font-bold sm:text-xl" :class="rankColor">
              {{ player.rank }}
            </span>
          </div>
        </div>

        <!-- HP + EXP Bars -->
        <div class="min-w-0 flex-1 space-y-1.5">
          <!-- HP Bar -->
          <div class="flex items-center gap-2">
            <Icon icon="lucide:heart" class="size-3 flex-shrink-0 text-red-400" />
            <div class="flex-1 overflow-hidden bg-bg-elevated" style="height: 8px">
              <div
                class="h-full transition-all duration-500"
                :class="hpBarColor"
                :style="{ width: `${hpPercent}%` }"
              />
            </div>
            <span class="w-14 flex-shrink-0 text-right font-display text-xs text-text-dim">
              {{ player.hp }}/{{ player.maxHp }}
            </span>
          </div>

          <!-- EXP Bar -->
          <div class="flex items-center gap-2">
            <Icon icon="lucide:star" class="size-3 flex-shrink-0 text-accent-amber" />
            <div class="flex-1 overflow-hidden bg-bg-elevated" style="height: 8px">
              <div
                class="h-full bg-accent-amber transition-all duration-700"
                :style="{ width: `${expProgress}%` }"
              />
            </div>
            <span class="w-14 flex-shrink-0 text-right font-display text-xs text-text-dim">
              {{ player.exp }} EXP
            </span>
          </div>
        </div>

        <!-- Gold + Meta -->
        <div class="flex flex-shrink-0 flex-col items-end gap-1">
          <div class="flex items-center gap-1">
            <Icon icon="lucide:coins" class="size-3.5 text-accent-amber" />
            <span class="font-display text-sm font-bold text-accent-amber">
              {{ player.gold }}
            </span>
          </div>
          <div class="text-right">
            <span class="font-display text-[10px] tracking-wider text-text-dim">
              {{ rankConfig?.title }}
            </span>
          </div>
          <div v-if="nextRankConfig" class="text-right">
            <span class="font-display text-[10px] text-text-dim">
              → {{ nextRankConfig.label }}: {{ nextRankConfig.minExp }} EXP
            </span>
          </div>
        </div>

        <!-- EXP Boost indicator -->
        <div v-if="player.expBoostCharges > 0" class="flex-shrink-0">
          <div
            class="flex items-center gap-1 border border-accent-amber/50 bg-accent-amber/10 px-2 py-1"
          >
            <Icon icon="lucide:zap" class="size-3 text-accent-amber" />
            <span class="font-display text-xs text-accent-amber"
              >x2 EXP ×{{ player.expBoostCharges }}</span
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
