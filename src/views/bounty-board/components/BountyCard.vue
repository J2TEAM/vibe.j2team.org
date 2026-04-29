<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import type { Quest } from '../types'
import { RARITY_CONFIG, CATEGORY_CONFIG } from '../constants'

const props = defineProps<{
  quest: Quest
  disabled?: boolean
}>()

const emit = defineEmits<{
  accept: [uid: string]
}>()

const rarityConfig = computed(() => RARITY_CONFIG[props.quest.rarity])
const categoryConfig = computed(() => CATEGORY_CONFIG[props.quest.category])

const durationLabel = computed(() => {
  const m = props.quest.durationMinutes
  if (m < 60) return `${m} phút`
  const h = Math.floor(m / 60)
  const rem = m % 60
  return rem ? `${h} giờ ${rem} phút` : `${h} giờ`
})

const rarityStars = computed(() => {
  const map: Record<string, number> = { white: 1, blue: 2, purple: 3, gold: 4 }
  return map[props.quest.rarity] ?? 1
})

function handleAccept() {
  emit('accept', props.quest.uid)
}
</script>

<template>
  <div
    class="group relative flex flex-col border-2 transition-all duration-300"
    :class="[
      rarityConfig.borderClass,
      rarityConfig.bgClass,
      disabled ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-1 cursor-pointer',
      quest.rarity !== 'white' ? `shadow-lg ${rarityConfig.shadowClass}` : '',
    ]"
  >
    <!-- Pin decoration -->
    <div class="absolute -top-1.5 left-1/2 -translate-x-1/2">
      <div
        class="size-3 rounded-full border border-bg-deep shadow-md"
        :class="rarityConfig.pinClass"
      />
    </div>

    <!-- Rarity badge + category -->
    <div class="flex items-center justify-between px-3 pt-4 pb-1">
      <div
        class="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-display tracking-widest uppercase"
        :class="rarityConfig.badgeClass"
      >
        <span>{{ rarityConfig.label }}</span>
        <span>{{ '★'.repeat(rarityStars) }}</span>
      </div>
      <div :class="categoryConfig.color" class="text-xs font-display flex items-center gap-1">
        <Icon :icon="categoryConfig.icon" class="size-3" />
        <span class="hidden sm:inline tracking-wide">{{ categoryConfig.label }}</span>
      </div>
    </div>

    <!-- Quest icon + Name -->
    <div class="px-3 pt-2 pb-1">
      <div class="flex items-start gap-2">
        <div
          class="flex-shrink-0 flex size-9 items-center justify-center border"
          :class="[rarityConfig.borderClass, rarityConfig.bgClass]"
        >
          <Icon :icon="quest.icon" class="size-5" :class="rarityConfig.textClass" />
        </div>
        <h3 class="font-display text-sm font-bold leading-tight text-text-primary">
          {{ quest.name }}
        </h3>
      </div>
    </div>

    <!-- Description -->
    <div class="flex-1 px-3 py-1">
      <p class="text-xs text-text-secondary leading-relaxed">{{ quest.description }}</p>
    </div>

    <!-- Divider -->
    <div class="mx-3 border-t border-border-default/50 my-1" />

    <!-- Rewards row -->
    <div class="px-3 py-2 grid grid-cols-3 gap-1 text-center">
      <div>
        <div class="font-display text-[10px] text-text-dim tracking-wide">THỜI GIAN</div>
        <div class="font-display text-xs font-semibold text-accent-coral">{{ durationLabel }}</div>
      </div>
      <div>
        <div class="font-display text-[10px] text-text-dim tracking-wide">EXP</div>
        <div class="font-display text-xs font-semibold text-accent-amber">+{{ quest.exp }}</div>
      </div>
      <div>
        <div class="font-display text-[10px] text-text-dim tracking-wide">GOLD</div>
        <div class="font-display text-xs font-semibold text-accent-amber">+{{ quest.gold }}</div>
      </div>
    </div>

    <!-- Accept Button -->
    <button
      class="mx-3 mb-3 border py-2 text-center font-display text-xs tracking-widest uppercase transition-colors"
      :class="[
        disabled
          ? 'border-border-default text-text-dim cursor-not-allowed'
          : `${rarityConfig.borderClass} ${rarityConfig.textClass} hover:bg-white/5`,
      ]"
      :disabled="disabled"
      @click="handleAccept"
    >
      ⚔ Chấp Nhận
    </button>
  </div>
</template>
