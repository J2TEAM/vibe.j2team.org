<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Card, StatKey, ResourceKey } from '../types'
import { useI18n } from '../composables/useI18n'
import { Icon } from '@iconify/vue'
import { TRACK_LUCIDE, RESOURCE_LUCIDE, UI_LUCIDE } from '../constants/icons'

const props = defineProps<{
  card: Card
  mode: 'hand' | 'slot'
  selected?: boolean
  deactivated?: boolean
  affordable?: boolean
  ghost?: boolean
  pending?: boolean
}>()

const emit = defineEmits<{
  click: []
  pause: []
  remove: []
  inspect: []
}>()

let pressTimer: ReturnType<typeof setTimeout> | null = null
const isPressed = ref(false)
const tiltX = ref(0)
const tiltY = ref(0)

function onPointerDown(e: PointerEvent) {
  isPressed.value = true
  updateTilt(e)
  pressTimer = setTimeout(() => {
    pressTimer = null
    emit('inspect')
  }, 400)
}

function onPointerUp() {
  isPressed.value = false
  tiltX.value = 0
  tiltY.value = 0
  if (pressTimer !== null) {
    clearTimeout(pressTimer)
    pressTimer = null
  }
}

function updateTilt(e: PointerEvent) {
  const el = e.currentTarget as HTMLElement
  if (!el) return
  const rect = el.getBoundingClientRect()
  const x = (e.clientX - rect.left) / rect.width - 0.5
  const y = (e.clientY - rect.top) / rect.height - 0.5
  tiltX.value = y * -8
  tiltY.value = x * 8
}

const { t } = useI18n()

// Solid background color per track
const TRACK_BG: Record<string, string> = {
  nature: '#4ADE80',
  human: '#FFB830',
  economy: '#FF6B4A',
  digital: '#38BDF8',
}

// Darker shade for bottom section
const TRACK_BG_DARK: Record<string, string> = {
  nature: '#22803D',
  human: '#A67520',
  economy: '#A63E25',
  digital: '#1E6A8F',
}

// Dark icon color on solid bg
const ICON_COLOR: Record<string, string> = {
  nature: '#0A1F12',
  human: '#1A1000',
  economy: '#1A0800',
  digital: '#0A1520',
}

// Build the Daybreak-style effect equation: costs → gains
const effectIcons = computed(() => {
  const costs: { icon: string; value: number; color: string }[] = []
  const gains: { icon: string; value: number; color: string }[] = []

  // Stat effects (homeEffects as primary)
  const fx = props.card.homeEffects
  for (const [k, v] of Object.entries(fx)) {
    if (v == null || v === 0) continue
    const icon = TRACK_LUCIDE[k as StatKey]
    if (!icon) continue
    if (v < 0) {
      costs.push({ icon, value: v, color: TRACK_BG[k] ?? '#fff' })
    } else {
      gains.push({ icon, value: v, color: TRACK_BG[k] ?? '#fff' })
    }
  }

  return { costs, gains }
})

// Production entries
const productionEntries = computed(() => {
  if (!props.card.produces) return []
  const RES_ICONS: Record<ResourceKey, { icon: string; color: string }> = {
    food: { icon: RESOURCE_LUCIDE.food, color: '#4ADE80' },
    materials: { icon: RESOURCE_LUCIDE.materials, color: '#FDBA74' },
    knowledge: { icon: RESOURCE_LUCIDE.knowledge, color: '#A78BFA' },
  }
  return (Object.entries(props.card.produces) as [ResourceKey, number][])
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ ...RES_ICONS[k], value: v }))
})

// Has any cost at all
const hasCost = computed(
  () =>
    props.card.costBudget > 0 ||
    props.card.costEnergy > 0 ||
    (props.card.costResources && Object.values(props.card.costResources).some((v) => v && v > 0)),
)
</script>

<template>
  <div class="flex flex-col card-wrapper" :class="{ 'card-pending': pending }">
    <button
      :class="[
        'relative flex flex-col w-full overflow-hidden text-left select-none',
        'aspect-[9/14] touch-manipulation card-face',
        mode === 'slot' ? 'rounded-t-lg' : 'rounded-lg',
        ghost ? 'border border-dashed border-text-dim/30 opacity-40' : '',
        selected ? 'ring-2 ring-accent-coral ring-offset-1 ring-offset-bg-deep card-selected' : '',
        deactivated ? 'opacity-40 grayscale' : '',
        ghost ? 'pointer-events-none' : '',
        mode === 'hand' && affordable === false
          ? 'opacity-30 cursor-not-allowed'
          : mode === 'hand'
            ? 'cursor-pointer'
            : 'cursor-default',
        isPressed ? 'card-pressed' : '',
      ]"
      :style="{
        transform: isPressed
          ? `perspective(400px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(0.96)`
          : 'perspective(400px) rotateX(0) rotateY(0) scale(1)',
      }"
      @click="emit('click')"
      @pointerdown="onPointerDown"
      @pointerup="onPointerUp"
      @pointerleave="onPointerUp"
    >
      <!-- ═══ Top: Art area (colored) ═══ -->
      <div
        class="flex-1 relative flex flex-col"
        :style="{ backgroundColor: TRACK_BG[card.tracks[0]!] }"
      >
        <!-- Track badges top-right -->
        <div class="absolute top-1 right-1 flex gap-0.5 z-10">
          <div
            v-for="track in card.tracks"
            :key="track"
            class="w-4 h-4 rounded-full flex items-center justify-center"
            :style="{ backgroundColor: ICON_COLOR[track] + '80' }"
          >
            <Icon :icon="TRACK_LUCIDE[track]" class="w-2.5 h-2.5 text-white/90" />
          </div>
        </div>

        <!-- Cost badges top-left -->
        <div v-if="hasCost" class="absolute top-1 left-1 flex gap-0.5 z-10">
          <div
            v-if="card.costBudget > 0"
            class="flex items-center gap-px px-1 py-0.5 rounded-full bg-black/40"
          >
            <Icon :icon="RESOURCE_LUCIDE.budget" class="w-2.5 h-2.5 text-amber-200" />
            <span class="text-[8px] font-bold text-white leading-none">{{ card.costBudget }}</span>
          </div>
          <div
            v-if="card.costEnergy > 0"
            class="flex items-center gap-px px-1 py-0.5 rounded-full bg-black/40"
          >
            <Icon :icon="RESOURCE_LUCIDE.energy" class="w-2.5 h-2.5 text-sky-200" />
            <span class="text-[8px] font-bold text-white leading-none">{{ card.costEnergy }}</span>
          </div>
          <template v-if="card.costResources">
            <div
              v-if="card.costResources.food"
              class="flex items-center gap-px px-1 py-0.5 rounded-full bg-black/40"
            >
              <Icon :icon="RESOURCE_LUCIDE.food" class="w-2.5 h-2.5 text-green-200" />
              <span class="text-[8px] font-bold text-white leading-none">{{
                card.costResources.food
              }}</span>
            </div>
            <div
              v-if="card.costResources.materials"
              class="flex items-center gap-px px-1 py-0.5 rounded-full bg-black/40"
            >
              <Icon :icon="RESOURCE_LUCIDE.materials" class="w-2.5 h-2.5 text-orange-200" />
              <span class="text-[8px] font-bold text-white leading-none">{{
                card.costResources.materials
              }}</span>
            </div>
            <div
              v-if="card.costResources.knowledge"
              class="flex items-center gap-px px-1 py-0.5 rounded-full bg-black/40"
            >
              <Icon :icon="RESOURCE_LUCIDE.knowledge" class="w-2.5 h-2.5 text-violet-200" />
              <span class="text-[8px] font-bold text-white leading-none">{{
                card.costResources.knowledge
              }}</span>
            </div>
          </template>
        </div>

        <!-- Big central icon -->
        <div class="flex-1 flex items-center justify-center">
          <Icon
            :icon="TRACK_LUCIDE[card.tracks[0]!]"
            class="w-10 h-10 select-none drop-shadow-sm"
            :style="{ color: ICON_COLOR[card.tracks[0]!], opacity: 0.45 }"
            aria-hidden="true"
          />
        </div>
      </div>

      <!-- ═══ Bottom: Info strip (darker) ═══ -->
      <div
        class="shrink-0 px-1.5 py-1 flex flex-col gap-0.5"
        :style="{ backgroundColor: TRACK_BG_DARK[card.tracks[0]!] }"
      >
        <!-- Card name -->
        <span class="text-[9px] font-bold font-display text-white leading-tight truncate">
          {{ t(card.name) }}
        </span>

        <!-- Effect equation: costs → gains (Daybreak-style) -->
        <div
          v-if="effectIcons.costs.length > 0 || effectIcons.gains.length > 0"
          class="flex items-center gap-0.5 flex-wrap"
        >
          <!-- Costs (what you lose) -->
          <template v-for="(c, i) in effectIcons.costs" :key="'c' + i">
            <div class="flex items-center gap-px effect-pip">
              <Icon :icon="c.icon" class="w-2.5 h-2.5" :style="{ color: c.color }" />
              <span class="text-[8px] font-bold text-red-200 leading-none">{{ c.value }}</span>
            </div>
          </template>

          <!-- Arrow separator -->
          <span
            v-if="effectIcons.costs.length > 0 && effectIcons.gains.length > 0"
            class="text-[8px] text-white/50 mx-px"
            >→</span
          >

          <!-- Gains (what you get) -->
          <template v-for="(g, i) in effectIcons.gains" :key="'g' + i">
            <div class="flex items-center gap-px effect-pip">
              <Icon :icon="g.icon" class="w-2.5 h-2.5" :style="{ color: g.color }" />
              <span class="text-[8px] font-bold text-white leading-none">+{{ g.value }}</span>
            </div>
          </template>
        </div>

        <!-- Production line -->
        <div v-if="productionEntries.length > 0" class="flex items-center gap-1">
          <Icon icon="lucide:factory" class="w-2 h-2 text-white/50" />
          <div class="flex items-center gap-0.5">
            <template v-for="(p, i) in productionEntries" :key="'p' + i">
              <Icon :icon="p.icon" class="w-2.5 h-2.5" :style="{ color: p.color }" />
              <span class="text-[8px] font-bold text-white/80 leading-none">+{{ p.value }}</span>
            </template>
          </div>
        </div>
      </div>

      <!-- Shimmer overlay for newly placed cards -->
      <div v-if="pending" class="absolute inset-0 pointer-events-none card-shimmer" />

      <!-- Deactivated overlay -->
      <div v-if="deactivated" class="absolute inset-0 flex items-center justify-center bg-black/50">
        <Icon :icon="UI_LUCIDE.pause" class="w-4 h-4 text-white/60" />
      </div>

      <!-- Selected check -->
      <div
        v-if="selected"
        class="absolute top-0 right-0 w-4 h-4 bg-accent-coral flex items-center justify-center rounded-bl card-check"
      >
        <span class="text-[8px] text-white font-bold">&#10003;</span>
      </div>
    </button>

    <!-- Slot actions -->
    <div
      v-if="mode === 'slot' && !ghost"
      class="flex bg-bg-surface/80 rounded-b-lg overflow-hidden border-t border-border-default/20"
    >
      <template v-if="card.tier !== 'vision'">
        <button
          class="flex-1 py-0.5 flex items-center justify-center transition-colors touch-manipulation active:scale-90"
          :class="deactivated ? 'text-accent-amber' : 'text-text-dim hover:text-text-secondary'"
          @click.stop="emit('pause')"
        >
          <Icon :icon="deactivated ? UI_LUCIDE.play : UI_LUCIDE.pause" class="w-3 h-3" />
        </button>
        <button
          class="flex-1 py-0.5 flex items-center justify-center text-text-dim hover:text-text-secondary transition-colors touch-manipulation active:scale-90"
          @click.stop="emit('inspect')"
        >
          <Icon :icon="UI_LUCIDE.info" class="w-3 h-3" />
        </button>
        <button
          class="flex-1 py-0.5 flex items-center justify-center text-text-dim hover:text-accent-coral transition-colors touch-manipulation active:scale-90"
          @click.stop="emit('remove')"
        >
          <Icon :icon="UI_LUCIDE.close" class="w-3 h-3" />
        </button>
      </template>
      <button
        v-else
        class="flex-1 py-0.5 flex items-center justify-center text-text-dim hover:text-text-secondary transition-colors touch-manipulation active:scale-90"
        @click.stop="emit('inspect')"
      >
        <Icon :icon="UI_LUCIDE.info" class="w-3 h-3" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.card-face {
  transition:
    transform 0.15s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.15s ease;
  will-change: transform;
}

.card-face:active {
  transition-duration: 0.08s;
}

/* Spring bounce back when released */
.card-face:not(.card-pressed) {
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Selected card subtle float */
.card-selected {
  animation: card-float 2s ease-in-out infinite;
}
@keyframes card-float {
  0%,
  100% {
    transform: perspective(400px) translateY(0);
  }
  50% {
    transform: perspective(400px) translateY(-2px);
  }
}

/* New card shimmer sweep */
.card-shimmer {
  background: linear-gradient(
    105deg,
    transparent 40%,
    rgba(255, 255, 255, 0.25) 45%,
    rgba(255, 255, 255, 0.35) 50%,
    rgba(255, 255, 255, 0.25) 55%,
    transparent 60%
  );
  background-size: 250% 100%;
  animation: shimmer 1.5s ease-in-out;
}
@keyframes shimmer {
  from {
    background-position: 200% center;
  }
  to {
    background-position: -50% center;
  }
}

/* Pending card entrance pop */
.card-pending {
  animation: card-pop-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes card-pop-in {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Check mark bounce */
.card-check {
  animation: check-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes check-pop {
  0% {
    transform: scale(0);
  }
  100% {
    transform: scale(1);
  }
}

/* Effect pip subtle entrance */
.effect-pip {
  animation: pip-in 0.2s ease-out both;
}
</style>
