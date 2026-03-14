<script setup lang="ts">
import { computed } from 'vue'
import { BUFFS } from '../composables/useGameState'
import type { BuffId, Character } from '../types'

const props = defineProps<{
  activeChar: Character
  selectedBuffs: BuffId[]
  stamina: number
  maxStamina: number
  phase: string
  turnCount: number
}>()

const emit = defineEmits<{
  toggle: [id: BuffId]
  confirm: []
}>()

const buffList = Object.values(BUFFS)

function canAfford(id: BuffId): boolean {
  const buff = BUFFS[id]
  if (props.selectedBuffs.includes(id)) return true
  return props.stamina >= buff.staminaCost
}

function isSelected(id: BuffId): boolean {
  return props.selectedBuffs.includes(id)
}

function isDisabled(id: BuffId): boolean {
  if (props.phase !== 'buff_select') return true
  if (isSelected(id)) return false
  if (!canAfford(id)) return true
  const buff = BUFFS[id]
  if (buff.isTrident && props.selectedBuffs.includes('extra1')) return true
  if (id === 'extra1' && props.selectedBuffs.some((b) => BUFFS[b].isTrident)) return true
  return false
}

const phaseLabel = computed(() => {
  const map: Record<string, string> = {
    buff_select: '📦 Chọn vật phẩm',
    aiming: '🎯 Nhắm bắn',
    firing: '💣 Đạn đang bay...',
    resolving: '⏳ Chờ ổn định...',
    ai_thinking: '🤖 AI đang tính...',
    ai_aiming: '🤖 AI đang nhắm...',
  }
  return map[props.phase] ?? ''
})

const staminaPct = computed(() => (props.stamina / props.maxStamina) * 100)
</script>

<template>
  <div class="flex flex-col gap-2 p-3 bg-bg-surface border border-border-default w-52 shrink-0">
    <!-- Turn -->
    <div class="flex justify-center items-center gap-2 border py-2 border-border-default">
      <span class="text-xs">Lượt</span>
      <span class="text-xs font-bold text-accent-sky">
        {{ turnCount }}
      </span>
    </div>

    <!-- Active character + phase -->
    <div class="flex flex-col gap-0.5">
      <span class="text-xs text-text-dim">Đang chơi:</span>
      <span class="font-display text-sm font-bold" :style="{ color: activeChar.color }">{{
        activeChar.name
      }}</span>
      <span class="font-display text-xs text-text-secondary">{{ phaseLabel }}</span>
    </div>

    <span class="font-display text-xs tracking-widest text-text-dim">// VẬT PHẨM</span>

    <!-- Stamina -->
    <div class="flex flex-col gap-1">
      <div class="flex items-center justify-between">
        <span class="text-xs text-text-secondary">Thể lực</span>
        <span class="font-display text-xs text-text-primary tabular-nums"
          >{{ Math.floor(stamina) }}/{{ maxStamina }}</span
        >
      </div>
      <div class="h-2 bg-bg-elevated w-full">
        <div
          class="h-2 bg-accent-sky transition-all duration-300"
          :style="{ width: staminaPct + '%' }"
        />
      </div>
    </div>

    <!-- Buff grid -->
    <div class="flex flex-col gap-1">
      <button
        v-for="(b, idx) in buffList"
        :key="b.id"
        class="border px-2 py-1.5 text-left flex items-center gap-2 transition-all duration-150"
        :class="[
          isSelected(b.id) ? 'border-accent-amber bg-bg-elevated text-text-primary' : '',
          isDisabled(b.id)
            ? 'opacity-30 cursor-not-allowed border-border-default text-text-dim'
            : '',
          !isSelected(b.id) && !isDisabled(b.id)
            ? 'border-border-default text-text-secondary hover:border-accent-amber hover:text-text-primary cursor-pointer'
            : '',
        ]"
        :disabled="isDisabled(b.id)"
        @click="!isDisabled(b.id) && emit('toggle', b.id)"
      >
        <span
          class="font-display text-xs w-4 shrink-0 tabular-nums"
          :class="isSelected(b.id) ? 'text-accent-amber' : 'text-text-dim'"
          >{{ idx + 1 }}</span
        >
        <div class="flex flex-col flex-1 min-w-0">
          <span class="font-display text-xs leading-tight">{{ b.name }}</span>
          <span class="text-xs text-text-dim">-{{ b.staminaCost }} thể lực</span>
        </div>
        <span v-if="isSelected(b.id)" class="text-accent-amber text-sm shrink-0">✓</span>
      </button>
    </div>

    <!-- Confirm -->
    <button
      class="border py-2 font-display text-sm tracking-wide transition-all"
      :class="
        phase === 'buff_select'
          ? 'border-accent-coral bg-accent-coral/10 text-accent-coral hover:bg-accent-coral hover:text-bg-deep cursor-pointer'
          : 'border-border-default text-text-dim cursor-not-allowed opacity-40'
      "
      :disabled="phase !== 'buff_select'"
      @click="phase === 'buff_select' && emit('confirm')"
    >
      Bắt đầu nhắm 🎯
    </button>
  </div>
</template>
