<script setup lang="ts">
import { computed } from 'vue'
import type { Card, ResourceKey } from '../types'
import { BIOMES } from '../data/biomes'
import { useI18n } from '../composables/useI18n'
import { Icon } from '@iconify/vue'
import { trackIcon, RESOURCE_LUCIDE, UI_LUCIDE } from '../constants/icons'

const props = defineProps<{
  hand: Card[]
  selectedIds: Set<number>
  budget: number
  energy: number
  food: number
  materials: number
  knowledge: number
}>()

const emit = defineEmits<{
  toggle: [cardId: number]
  extraCard: []
  close: []
}>()

const { t, locale } = useI18n()

const selectedCost = computed(() => {
  let b = 0,
    e = 0,
    f = 0,
    m = 0,
    k = 0
  for (const card of props.hand) {
    if (props.selectedIds.has(card.id)) {
      b += card.costBudget
      e += card.costEnergy
      f += card.costResources?.food ?? 0
      m += card.costResources?.materials ?? 0
      k += card.costResources?.knowledge ?? 0
    }
  }
  return { budget: b, energy: e, food: f, materials: m, knowledge: k }
})

const remaining = computed(() => ({
  budget: props.budget - selectedCost.value.budget,
  energy: props.energy - selectedCost.value.energy,
  food: props.food - selectedCost.value.food,
  materials: props.materials - selectedCost.value.materials,
  knowledge: props.knowledge - selectedCost.value.knowledge,
}))

function isAffordable(card: Card): boolean {
  if (props.selectedIds.has(card.id)) return true
  const r = remaining.value
  if (r.budget < card.costBudget || r.energy < card.costEnergy) return false
  const cr = card.costResources
  if (cr) {
    if (r.food < (cr.food ?? 0)) return false
    if (r.materials < (cr.materials ?? 0)) return false
    if (r.knowledge < (cr.knowledge ?? 0)) return false
  }
  return true
}

const TRACK_COLORS: Record<string, string> = {
  nature: '#4ADE80',
  human: '#FFB830',
  economy: '#FF6B4A',
  digital: '#38BDF8',
}

const TRACK_LABELS: Record<string, { en: string; vi: string }> = {
  nature: { en: 'Nature', vi: 'Thiên nhiên' },
  human: { en: 'Human', vi: 'Con người' },
  economy: { en: 'Economy', vi: 'Kinh tế' },
  digital: { en: 'Digital', vi: 'Công nghệ' },
}

const RES_LABELS: Record<ResourceKey, { en: string; vi: string; icon: string; color: string }> = {
  food: { en: 'Food', vi: 'Lương thực', icon: RESOURCE_LUCIDE.food, color: 'text-green-400' },
  materials: {
    en: 'Materials',
    vi: 'Vật liệu',
    icon: RESOURCE_LUCIDE.materials,
    color: 'text-orange-300',
  },
  knowledge: {
    en: 'Knowledge',
    vi: 'Tri thức',
    icon: RESOURCE_LUCIDE.knowledge,
    color: 'text-violet-400',
  },
}

function getEffectBullets(card: Card) {
  const bullets: { icon: string; text: string; color?: string }[] = []

  // Stat effects
  const fx = card.homeEffects
  const statParts = Object.entries(fx)
    .filter(([, v]) => v != null && v !== 0)
    .map(([k, v]) => {
      const label = t(TRACK_LABELS[k] || { en: k, vi: k })
      return `${v! > 0 ? '+' : ''}${v} ${label}`
    })
  if (statParts.length > 0) {
    bullets.push({ icon: UI_LUCIDE.chart, text: statParts.join(', ') })
  }

  // Production
  if (card.produces) {
    const parts = (Object.entries(card.produces) as [ResourceKey, number][])
      .filter(([, v]) => v > 0)
      .map(([k, v]) => `+${v} ${locale.value === 'vi' ? RES_LABELS[k].vi : RES_LABELS[k].en}`)
    if (parts.length > 0) {
      bullets.push({
        icon: 'lucide:factory',
        text:
          locale.value === 'vi'
            ? `Sản xuất: ${parts.join(', ')}/lượt`
            : `Produces: ${parts.join(', ')}/turn`,
        color: 'text-green-400',
      })
    }
  }

  // Resource cost
  if (card.costResources) {
    const parts = (Object.entries(card.costResources) as [ResourceKey, number][])
      .filter(([, v]) => v > 0)
      .map(([k, v]) => `${v} ${locale.value === 'vi' ? RES_LABELS[k].vi : RES_LABELS[k].en}`)
    if (parts.length > 0) {
      bullets.push({
        icon: 'lucide:package',
        text: locale.value === 'vi' ? `Cần: ${parts.join(', ')}` : `Needs: ${parts.join(', ')}`,
      })
    }
  }

  // Resource upkeep
  if (card.upkeepResources) {
    const parts = (Object.entries(card.upkeepResources) as [ResourceKey, number][])
      .filter(([, v]) => v > 0)
      .map(([k, v]) => `${v} ${locale.value === 'vi' ? RES_LABELS[k].vi : RES_LABELS[k].en}`)
    if (parts.length > 0) {
      bullets.push({
        icon: UI_LUCIDE.upkeep,
        text:
          locale.value === 'vi'
            ? `Duy trì: ${parts.join(', ')}/lượt`
            : `Upkeep: ${parts.join(', ')}/turn`,
        color: 'text-accent-coral',
      })
    }
  }

  // Away effects
  const awayParts = Object.entries(card.awayEffects)
    .filter(([, v]) => v != null && v !== 0)
    .map(([k, v]) => {
      const label = t(TRACK_LABELS[k] || { en: k, vi: k })
      return `${v! > 0 ? '+' : ''}${v} ${label}`
    })
  if (awayParts.length > 0) {
    bullets.push({
      icon: UI_LUCIDE.shuffle,
      text:
        locale.value === 'vi' ? `Lệch: ${awayParts.join(', ')}` : `Away: ${awayParts.join(', ')}`,
    })
  }

  if (card.developsIome) {
    const biome = BIOMES.find((b) => b.id === card.developsIome)
    if (biome) {
      bullets.push({ icon: UI_LUCIDE.map, text: t(biome.name) })
    }
  }

  if (card.upkeep > 0) {
    bullets.push({
      icon: UI_LUCIDE.upkeep,
      text: locale.value === 'vi' ? `${card.upkeep} ngân sách/lượt` : `${card.upkeep} budget/turn`,
    })
  }

  return bullets
}

// Check if any resource is relevant (non-zero) for top bar display
const hasResources = computed(
  () =>
    props.food > 0 ||
    props.materials > 0 ||
    props.knowledge > 0 ||
    selectedCost.value.food > 0 ||
    selectedCost.value.materials > 0 ||
    selectedCost.value.knowledge > 0,
)
</script>

<template>
  <div class="fixed inset-0 z-40 bg-bg-deep/95 backdrop-blur flex flex-col hand-panel">
    <!-- Top bar -->
    <div class="flex items-center justify-between px-4 pt-3 pb-2 shrink-0">
      <div class="flex items-center gap-2 text-xs flex-wrap">
        <span class="text-text-dim"
          >{{ selectedIds.size }} {{ locale === 'vi' ? 'chọn' : 'sel.' }}</span
        >
        <span
          class="font-bold tabular-nums flex items-center gap-0.5"
          :class="remaining.budget < budget ? 'text-accent-amber' : 'text-text-dim'"
        >
          <Icon :icon="RESOURCE_LUCIDE.budget" class="w-3 h-3" />{{ remaining.budget }}
        </span>
        <span
          class="font-bold tabular-nums flex items-center gap-0.5"
          :class="remaining.energy < energy ? 'text-accent-sky' : 'text-text-dim'"
        >
          <Icon :icon="RESOURCE_LUCIDE.energy" class="w-3 h-3" />{{ remaining.energy }}
        </span>
        <template v-if="hasResources">
          <span class="w-px h-3 bg-border-default/40" />
          <span
            v-if="food > 0 || selectedCost.food > 0"
            class="font-bold tabular-nums flex items-center gap-0.5 text-green-400"
          >
            <Icon :icon="RESOURCE_LUCIDE.food" class="w-3 h-3" />{{ remaining.food }}
          </span>
          <span
            v-if="materials > 0 || selectedCost.materials > 0"
            class="font-bold tabular-nums flex items-center gap-0.5 text-orange-300"
          >
            <Icon :icon="RESOURCE_LUCIDE.materials" class="w-3 h-3" />{{ remaining.materials }}
          </span>
          <span
            v-if="knowledge > 0 || selectedCost.knowledge > 0"
            class="font-bold tabular-nums flex items-center gap-0.5 text-violet-400"
          >
            <Icon :icon="RESOURCE_LUCIDE.knowledge" class="w-3 h-3" />{{ remaining.knowledge }}
          </span>
        </template>
      </div>
      <button
        class="w-7 h-7 flex items-center justify-center rounded-full text-text-dim hover:text-text-primary transition-colors touch-manipulation active:scale-90 shrink-0"
        @click="emit('close')"
      >
        <Icon :icon="UI_LUCIDE.close" class="w-4 h-4" />
      </button>
    </div>

    <!-- Card carousel -->
    <div
      class="flex-1 overflow-x-auto overflow-y-hidden snap-x snap-mandatory scroll-smooth flex items-center"
    >
      <div class="inline-flex items-stretch gap-3 px-4 py-3">
        <div
          v-for="(card, ci) in hand"
          :key="card.id"
          class="snap-center shrink-0 w-[80vw] sm:w-[320px] lg:w-[360px] flex flex-col hand-card"
          :style="{ animationDelay: `${ci * 80}ms` }"
        >
          <div
            :class="[
              'flex flex-col h-full rounded-xl overflow-hidden transition-all duration-200',
              selectedIds.has(card.id) ? 'ring-2 ring-accent-coral hand-card-selected' : '',
              !isAffordable(card) && !selectedIds.has(card.id) ? 'opacity-40' : '',
            ]"
          >
            <!-- Card face -->
            <div
              class="flex items-center gap-3 px-4 py-3"
              :style="{ backgroundColor: TRACK_COLORS[card.tracks[0]!] }"
            >
              <Icon
                :icon="trackIcon(card.tracks[0]!)"
                class="w-7 h-7 shrink-0 opacity-60"
                style="color: rgba(0, 0, 0, 0.5)"
              />
              <div class="flex-1 min-w-0">
                <h2 class="font-display font-bold text-sm text-white leading-snug truncate">
                  {{ t(card.name) }}
                </h2>
                <div class="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span
                    v-if="card.costBudget > 0"
                    class="text-xs font-bold text-white/80 flex items-center gap-0.5"
                  >
                    <Icon :icon="RESOURCE_LUCIDE.budget" class="w-3 h-3" />{{ card.costBudget }}
                  </span>
                  <span
                    v-if="card.costEnergy > 0"
                    class="text-xs font-bold text-white/80 flex items-center gap-0.5"
                  >
                    <Icon :icon="RESOURCE_LUCIDE.energy" class="w-3 h-3" />{{ card.costEnergy }}
                  </span>
                  <span
                    v-if="card.costResources?.food"
                    class="text-xs font-bold text-white/80 flex items-center gap-0.5"
                  >
                    <Icon :icon="RESOURCE_LUCIDE.food" class="w-3 h-3" />{{
                      card.costResources.food
                    }}
                  </span>
                  <span
                    v-if="card.costResources?.materials"
                    class="text-xs font-bold text-white/80 flex items-center gap-0.5"
                  >
                    <Icon :icon="RESOURCE_LUCIDE.materials" class="w-3 h-3" />{{
                      card.costResources.materials
                    }}
                  </span>
                  <span
                    v-if="card.costResources?.knowledge"
                    class="text-xs font-bold text-white/80 flex items-center gap-0.5"
                  >
                    <Icon :icon="RESOURCE_LUCIDE.knowledge" class="w-3 h-3" />{{
                      card.costResources.knowledge
                    }}
                  </span>
                  <span
                    v-if="card.costBudget === 0 && card.costEnergy === 0 && !card.costResources"
                    class="text-xs text-white/50"
                    >free</span
                  >
                </div>
              </div>
            </div>

            <!-- Effects -->
            <div class="flex-1 px-4 py-3 bg-bg-surface space-y-1.5">
              <div
                v-for="(bullet, bi) in getEffectBullets(card)"
                :key="bi"
                class="flex items-start gap-2 text-xs leading-relaxed"
              >
                <Icon
                  :icon="bullet.icon"
                  class="w-3.5 h-3.5 shrink-0 mt-0.5"
                  :class="bullet.color ?? 'text-text-dim'"
                />
                <span :class="bullet.color ?? 'text-text-secondary'">{{ bullet.text }}</span>
              </div>
            </div>

            <!-- Action -->
            <button
              class="px-4 py-2.5 text-xs font-bold font-display transition-all touch-manipulation border-t border-border-default/20 active:scale-[0.97]"
              :class="[
                selectedIds.has(card.id)
                  ? 'bg-accent-coral/15 text-accent-coral'
                  : isAffordable(card)
                    ? 'bg-bg-surface text-text-primary hover:bg-bg-elevated'
                    : 'bg-bg-surface text-text-dim cursor-not-allowed',
              ]"
              :disabled="!isAffordable(card) && !selectedIds.has(card.id)"
              @click="emit('toggle', card.id)"
            >
              {{
                selectedIds.has(card.id)
                  ? locale === 'vi'
                    ? 'Bỏ chọn'
                    : 'Deselect'
                  : locale === 'vi'
                    ? 'Chọn'
                    : 'Select'
              }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom -->
    <div
      class="flex items-center justify-between px-4 py-2.5 border-t border-border-default/30 shrink-0"
    >
      <button
        class="text-[11px] text-text-dim hover:text-accent-sky transition-colors disabled:opacity-30 touch-manipulation flex items-center gap-1 active:scale-95"
        :disabled="energy < 3"
        @click="emit('extraCard')"
      >
        3<Icon :icon="RESOURCE_LUCIDE.energy" class="w-3 h-3 inline" /> +1
      </button>
      <button
        class="text-xs font-bold px-4 py-1.5 rounded-lg bg-bg-elevated text-text-primary hover:bg-border-default transition-colors touch-manipulation active:scale-95"
        @click="emit('close')"
      >
        {{ locale === 'vi' ? 'Xong' : 'Done' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.overflow-x-auto {
  scrollbar-width: none;
}
.overflow-x-auto::-webkit-scrollbar {
  display: none;
}
.hand-panel {
  animation: panel-up 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}
@keyframes panel-up {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.hand-card {
  animation: card-deal 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
@keyframes card-deal {
  0% {
    opacity: 0;
    transform: translateY(40px) scale(0.9) rotate(-2deg);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1) rotate(0);
  }
}
.hand-card-selected {
  animation: select-bounce 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes select-bounce {
  0% {
    transform: scale(1);
  }
  40% {
    transform: scale(0.95);
  }
  70% {
    transform: scale(1.02);
  }
  100% {
    transform: scale(1);
  }
}
</style>
