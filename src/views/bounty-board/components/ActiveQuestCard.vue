<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useNow } from '@vueuse/core'
import type { ActiveQuest } from '../types'
import { RARITY_CONFIG, CATEGORY_CONFIG } from '../constants'

const props = defineProps<{
  quest: ActiveQuest
}>()

const emit = defineEmits<{
  complete: [uid: string]
  skip: [uid: string]
}>()

const now = useNow({ interval: 1000 })

const remainingMs = computed(() => Math.max(0, props.quest.endTime - now.value.getTime()))
const totalMs = computed(() => props.quest.endTime - props.quest.acceptedAt)
const progressPercent = computed(() => Math.round((remainingMs.value / totalMs.value) * 100))

const isExpiring = computed(() => progressPercent.value < 20)
const rarityConfig = computed(() => RARITY_CONFIG[props.quest.rarity])
const categoryConfig = computed(() => CATEGORY_CONFIG[props.quest.category])

const timeLabel = computed(() => {
  const totalSec = Math.floor(remainingMs.value / 1000)
  if (totalSec <= 0) return '00:00'
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

function handleComplete() {
  emit('complete', props.quest.uid)
}

function handleSkip() {
  emit('skip', props.quest.uid)
}
</script>

<template>
  <div
    class="relative flex flex-col sm:flex-row items-start sm:items-center gap-3 border-l-4 border bg-bg-surface p-4 transition-all"
    :class="[
      quest.isBoss
        ? 'border-l-red-500 border-red-500/40 bg-red-500/5'
        : rarityConfig.borderClass.replace('border-', 'border-l-') + ' border-border-default',
      isExpiring ? 'animate-pulse' : '',
    ]"
  >
    <!-- Boss glow ring -->
    <div
      v-if="quest.isBoss"
      class="absolute inset-0 pointer-events-none border border-red-500/20 animate-pulse"
    />

    <!-- Category icon -->
    <div
      class="flex-shrink-0 flex size-10 items-center justify-center border"
      :class="
        quest.isBoss
          ? 'border-red-500/50 bg-red-500/10'
          : [rarityConfig.borderClass, rarityConfig.bgClass]
      "
    >
      <Icon
        :icon="quest.isBoss ? quest.icon : quest.icon"
        class="size-5"
        :class="quest.isBoss ? 'text-red-400' : rarityConfig.textClass"
      />
    </div>

    <!-- Quest info -->
    <div class="flex-1 min-w-0">
      <div class="flex flex-wrap items-center gap-2 mb-1">
        <span
          class="font-display text-xs tracking-widest px-1.5 py-0.5"
          :class="quest.isBoss ? 'bg-red-500/20 text-red-400' : rarityConfig.badgeClass"
        >
          {{ quest.isBoss ? '⚠ BOSS' : rarityConfig.label }}
        </span>
        <span v-if="!quest.isBoss" class="text-xs" :class="categoryConfig.color">{{
          categoryConfig.label
        }}</span>
        <span v-if="quest.isBoss" class="text-xs text-red-400/70 font-display"
          >NHIỆM VỤ ĐẶC BIỆT</span
        >
      </div>
      <h4
        class="font-display font-semibold text-sm leading-tight"
        :class="quest.isBoss ? 'text-red-300' : 'text-text-primary'"
      >
        {{ quest.name }}
      </h4>
      <p v-if="quest.isBoss" class="text-xs text-text-dim mt-0.5 line-clamp-2">
        {{ quest.description }}
      </p>

      <!-- Progress bar -->
      <div class="mt-2 flex items-center gap-2">
        <div class="flex-1 h-1.5 bg-bg-elevated overflow-hidden">
          <div
            class="h-full transition-all duration-1000"
            :class="isExpiring ? 'bg-red-500' : quest.isBoss ? 'bg-red-400' : 'bg-accent-sky'"
            :style="{ width: `${progressPercent}%` }"
          />
        </div>
        <span
          class="font-display text-xs tabular-nums flex-shrink-0"
          :class="isExpiring ? 'text-red-400 font-bold' : 'text-text-dim'"
        >
          {{ timeLabel }}
        </span>
      </div>

      <!-- Rewards -->
      <div class="mt-1 flex items-center gap-3 text-xs text-text-dim">
        <!-- Boss: no EXP, show Gold + Full HP -->
        <template v-if="quest.isBoss">
          <span class="flex items-center gap-1 text-accent-amber font-semibold">
            <Icon icon="lucide:coins" class="size-3 text-accent-amber" />
            +{{ quest.gold }} Gold
          </span>
          <span class="flex items-center gap-1 text-red-400 font-semibold">
            <Icon icon="lucide:heart" class="size-3 text-red-400" />
            Hồi Đầy Máu
          </span>
          <span class="flex items-center gap-1 text-text-dim/60 line-through">
            <Icon icon="lucide:star" class="size-3" />
            0 EXP
          </span>
        </template>
        <!-- Normal quest rewards -->
        <template v-else>
          <span class="flex items-center gap-1">
            <Icon icon="lucide:star" class="size-3 text-accent-amber" />
            +{{ quest.exp }} EXP
          </span>
          <span class="flex items-center gap-1">
            <Icon icon="lucide:coins" class="size-3 text-accent-amber" />
            +{{ quest.gold }} G
          </span>
          <span class="flex items-center gap-1">
            <Icon icon="lucide:heart" class="size-3 text-red-400" />
            +{{ quest.hpRestore }} HP
          </span>
        </template>
      </div>
    </div>

    <!-- Action buttons -->
    <div class="flex gap-2 flex-shrink-0">
      <button
        class="flex items-center gap-1 border px-3 py-1.5 font-display text-xs tracking-wide transition"
        :class="
          quest.isBoss
            ? 'border-red-500 bg-red-500/10 text-red-400 hover:bg-red-500/20'
            : 'border-accent-coral bg-accent-coral/10 text-accent-coral hover:bg-accent-coral/20'
        "
        @click="handleComplete"
      >
        <Icon :icon="quest.isBoss ? 'lucide:sword' : 'lucide:check'" class="size-3.5" />
        <span class="hidden sm:inline">{{ quest.isBoss ? 'Chiến Thắng' : 'Xong' }}</span>
      </button>
      <button
        v-if="!quest.isBoss"
        class="flex items-center gap-1 border border-border-default bg-bg-elevated px-3 py-1.5 font-display text-xs text-text-dim tracking-wide transition hover:border-accent-coral hover:text-accent-coral"
        @click="handleSkip"
      >
        <Icon icon="lucide:skip-forward" class="size-3.5" />
        <span class="hidden sm:inline">Bỏ qua</span>
      </button>
    </div>
  </div>
</template>
