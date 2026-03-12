<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import type { Character, TurnState, Wind } from '../types'

const props = defineProps<{
  characters: Character[]
  turn: TurnState
  wind: Wind
  activeChar: Character | undefined
}>()

const emit = defineEmits<{ quitMatch: [] }>()

const windAnimated = ref(false)
watch(
  () => props.wind.value,
  () => {
    windAnimated.value = true
    setTimeout(() => {
      windAnimated.value = false
    }, 600)
  },
)

const windDir = computed(() => (props.wind.value >= 0 ? 'phải →' : '← trái'))
const windAbs = computed(() => Math.abs(props.wind.value).toFixed(1))
const windIcon = computed(() =>
  props.wind.value >= 0 ? 'lucide:arrow-right' : 'lucide:arrow-left',
)

const timerPct = computed(() => (props.turn.timeLeft / 15) * 100)
const timerColor = computed(() => {
  if (props.turn.timeLeft > 8) return 'bg-accent-sky'
  if (props.turn.timeLeft > 4) return 'bg-accent-amber'
  return 'bg-accent-coral'
})

// Power bar: 20 tick marks
const powerTicks = Array.from({ length: 20 }, (_, i) => (i + 1) * 5)
</script>

<template>
  <div
    class="flex flex-col gap-2 p-2 bg-bg-surface border border-border-default w-48 shrink-0 select-none"
  >
    <!-- Timer -->
    <div class="flex flex-col gap-1">
      <span class="font-display text-xs tracking-widest text-text-dim">// THỜI GIAN</span>
      <div class="h-2 bg-bg-elevated w-full">
        <div
          class="h-2 transition-all duration-500"
          :class="timerColor"
          :style="{ width: timerPct + '%' }"
        />
      </div>
      <span class="font-display text-lg text-text-primary tabular-nums"
        >{{ Math.ceil(turn.timeLeft) }}s</span
      >
    </div>

    <!-- Wind -->
    <div
      class="flex flex-col gap-1 border border-border-default p-2 transition-all duration-300"
      :class="{ 'border-accent-sky': windAnimated }"
    >
      <span class="font-display text-xs tracking-widest text-text-dim">// GIÓ</span>
      <div class="flex items-center gap-2">
        <Icon
          :icon="windIcon"
          class="text-accent-sky text-xl"
          :class="{ 'animate-bounce': windAnimated }"
        />
        <span class="font-display text-xl text-text-primary tabular-nums">{{ windAbs }}</span>
        <span class="text-xs text-text-secondary">{{ windDir }}</span>
      </div>
    </div>

    <!-- Angle -->
    <div class="flex flex-col gap-1" v-if="activeChar">
      <span class="font-display text-xs tracking-widest text-text-dim">// GÓC BẮN</span>
      <span class="font-display text-2xl text-accent-amber tabular-nums"
        >{{ turn.angle.toFixed(0) }}°</span
      >
      <div class="flex items-center gap-1 text-xs text-text-secondary">
        <span>Giới hạn:</span>
        <span class="tabular-nums"
          >{{ activeChar.weapon.minAngle }}°–{{ activeChar.weapon.maxAngle }}°</span
        >
      </div>
      <div v-if="turn.lastAngle !== null" class="text-xs text-text-dim">
        Lượt trước: {{ turn.lastAngle.toFixed(0) }}°
      </div>
    </div>

    <!-- Power -->
    <div class="flex flex-col gap-1" v-if="activeChar">
      <span class="font-display text-xs tracking-widest text-text-dim">// LỰC BẮN</span>
      <div class="flex gap-0.5 items-end h-10 relative">
        <div
          v-for="tick in powerTicks"
          :key="tick"
          class="w-1.5 transition-all duration-75"
          :class="tick <= turn.power ? 'bg-accent-amber' : 'bg-bg-elevated'"
          :style="{ height: 40 + tick * 0.4 + '%' }"
        />
        <span
          v-if="turn.powerCharging"
          class="absolute right-0 top-0 font-display text-xs text-accent-amber tabular-nums"
          >{{ turn.power.toFixed(0) }}</span
        >
      </div>
      <span class="font-display text-base text-text-primary tabular-nums"
        >{{ turn.power.toFixed(0) }} / 100</span
      >
      <span class="text-xs text-text-secondary">Giữ SPACE để tích lực</span>
    </div>

    <!-- HP bars -->
    <div class="flex flex-col gap-2 mt-1">
      <span class="font-display text-xs tracking-widest text-text-dim">// MÁU</span>
      <div v-for="char in characters" :key="char.id" class="flex flex-col gap-0.5">
        <div class="flex items-center justify-between">
          <span class="font-display text-xs tracking-wide" :style="{ color: char.color }">{{
            char.name
          }}</span>
          <span class="text-xs text-text-secondary tabular-nums"
            >{{ char.hp }}/{{ char.maxHp }}</span
          >
        </div>
        <div class="h-2 bg-bg-elevated w-full">
          <div
            class="h-2 transition-all duration-300"
            :style="{
              width: (char.hp / char.maxHp) * 100 + '%',
              backgroundColor: char.alive ? char.color : '#4A6180',
            }"
          />
        </div>
      </div>
    </div>

    <!-- Out match -->
    <button
      class="flex justify-center items-center gap-1 border py-2 text-sm tracking-wide transition-all duration-200 border-accent-coral bg-bg-elevated text-text-primary cursor-pointer hover:bg-accent-coral hover:text-bg-deep"
      @click="emit('quitMatch')"
    >
      <Icon icon="mdi:times" class="text-lg" /> Thoát trận
    </button>

    <!-- Controls hint -->
    <div class="mt-auto text-xs text-text-dim leading-4 border-t border-border-default pt-2">
      <table class="w-full text-left">
        <tbody>
          <tr>
            <td class="py-0.5">1 - 8</td>
            <td class="py-0.5">Chọn/bỏ vật phẩm</td>
          </tr>
          <tr>
            <td class="py-0.5">ENTER</td>
            <td class="py-0.5">Xác nhận buff</td>
          </tr>
          <tr>
            <td class="py-0.5">↑ ↓</td>
            <td class="py-0.5">Điều chỉnh góc</td>
          </tr>
          <tr>
            <td class="py-0.5">← →</td>
            <td class="py-0.5">Di chuyển</td>
          </tr>
          <tr>
            <td class="py-0.5">SPACE</td>
            <td class="py-0.5">Tích/bắn</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
