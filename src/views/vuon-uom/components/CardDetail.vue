<script setup lang="ts">
import type { Card, ResourceKey } from '../types'
import { BIOMES } from '../data/biomes'
import { useI18n } from '../composables/useI18n'
import { Icon } from '@iconify/vue'
import { trackIcon, RESOURCE_LUCIDE, UI_LUCIDE } from '../constants/icons'

const props = defineProps<{
  card: Card
}>()

const emit = defineEmits<{
  close: []
}>()

const { t, locale } = useI18n()

const TRACK_LABELS: Record<string, { en: string; vi: string }> = {
  nature: { en: 'Nature', vi: 'Thiên nhiên' },
  human: { en: 'Human', vi: 'Con người' },
  economy: { en: 'Economy', vi: 'Kinh tế' },
  digital: { en: 'Digital', vi: 'Công nghệ' },
}

const STAT_COLORS: Record<string, string> = {
  nature: 'text-green-400',
  human: 'text-amber-400',
  economy: 'text-orange-400',
  digital: 'text-sky-400',
}

const TIER_LABELS: Record<string, { en: string; vi: string }> = {
  foundation: { en: 'Foundation', vi: 'Nền tảng' },
  culture: { en: 'Culture', vi: 'Văn hóa' },
  vision: { en: 'Vision', vi: 'Tầm nhìn' },
  regional: { en: 'Regional', vi: 'Vùng miền' },
}

const TIER_COLORS: Record<string, string> = {
  foundation: 'bg-[#253549] text-text-secondary',
  culture: 'bg-accent-amber/20 text-accent-amber',
  vision: 'bg-accent-coral/20 text-accent-coral',
  regional: 'bg-accent-sky/20 text-accent-sky',
}

const TRACK_HEX: Record<string, string> = {
  nature: '#4ADE80',
  human: '#FFB830',
  economy: '#FF6B4A',
  digital: '#38BDF8',
}

function getBiomeName() {
  if (props.card.biome === 'global') return locale.value === 'vi' ? 'Toàn cầu' : 'Global'
  const biome = BIOMES.find((b) => b.id === props.card.biome)
  return biome ? `${biome.emoji} ${t(biome.name)}` : props.card.biome
}

function formatEffects(fx: Record<string, number | undefined>) {
  return Object.entries(fx)
    .filter(([, v]) => v != null && v !== 0)
    .map(([k, v]) => ({
      key: k,
      value: v!,
      color: STAT_COLORS[k] || '',
      label: TRACK_LABELS[k] ? t(TRACK_LABELS[k]) : k,
    }))
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

function getResourceEntries(obj: Partial<Record<ResourceKey, number>> | undefined) {
  if (!obj) return []
  return (Object.entries(obj) as [ResourceKey, number][]).filter(([, v]) => v > 0)
}

function getUnlockText() {
  const c = props.card.unlockCondition
  switch (c.type) {
    case 'always':
      return locale.value === 'vi' ? 'Luôn mở' : 'Always available'
    case 'meter':
      return `${t(TRACK_LABELS[c.stat] || { en: c.stat, vi: c.stat })} ≥ ${c.min}`
    case 'biome': {
      const biome = BIOMES.find((b) => b.id === c.biomeId)
      return biome
        ? locale.value === 'vi'
          ? `Vùng ${t(biome.name)} đã khai phá`
          : `${t(biome.name)} biome developed`
        : c.biomeId
    }
    case 'chain':
      return `${t(TRACK_LABELS[c.stat] || { en: c.stat, vi: c.stat })} ≥ ${c.min} + ${locale.value === 'vi' ? 'đã chơi bài' : 'cards'} #${c.cardIds.join(', #')}`
    case 'mixed-harmony':
      return locale.value === 'vi'
        ? `${c.mixedCount} track khác nhau, hòa hợp ≥ ${c.harmonyMin}`
        : `${c.mixedCount} mixed tracks, harmony ≥ ${c.harmonyMin}`
    case 'all-biomes':
      return locale.value === 'vi' ? 'Tất cả vùng miền khai phá' : 'All biomes developed'
    case 'all-meters':
      return locale.value === 'vi' ? `Tất cả chỉ số ≥ ${c.min}` : `All stats ≥ ${c.min}`
    case 'hidden-collapse':
      return locale.value === 'vi' ? 'Ẩn — sụp đổ' : 'Hidden — collapse'
    case 'hidden-no-vision':
      return locale.value === 'vi' ? 'Ẩn — không tầm nhìn' : 'Hidden — no vision'
    default:
      return '—'
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      @click.self="emit('close')"
    >
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="emit('close')" />

      <!-- Modal -->
      <div
        class="relative bg-bg-surface border border-border-default rounded-2xl w-full max-w-sm max-h-[85vh] overflow-y-auto shadow-2xl"
      >
        <!-- Close button -->
        <button
          class="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-bg-elevated text-text-dim hover:text-text-primary transition-colors touch-manipulation"
          @click="emit('close')"
        >
          <Icon :icon="UI_LUCIDE.close" class="w-4 h-4" />
        </button>

        <!-- Header: large track icon + name + tier badge -->
        <div class="pt-8 pb-4 px-5 text-center">
          <div class="flex justify-center mb-3">
            <Icon
              :icon="trackIcon(card.tracks[0]!)"
              class="w-12 h-12"
              :style="{ color: TRACK_HEX[card.tracks[0]!] }"
            />
          </div>
          <h2 class="font-display font-bold text-lg text-text-primary leading-snug mb-2">
            {{ t(card.name) }}
          </h2>
          <span
            :class="[
              'inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full',
              TIER_COLORS[card.tier],
            ]"
          >
            {{ t(TIER_LABELS[card.tier]!) }}
          </span>
        </div>

        <div class="border-t border-border-default/50 mx-4" />

        <!-- Info sections -->
        <div class="px-5 py-4 flex flex-col gap-4">
          <!-- Tracks -->
          <div>
            <p class="text-[10px] uppercase tracking-widest text-text-dim mb-1 font-display">
              {{ locale === 'vi' ? 'Chuyên môn' : 'Tracks' }}
            </p>
            <div class="flex gap-2 flex-wrap">
              <span
                v-for="track in card.tracks"
                :key="track"
                :class="['text-sm font-semibold flex items-center gap-1', STAT_COLORS[track]]"
              >
                <Icon :icon="trackIcon(track)" class="w-4 h-4" /> {{ t(TRACK_LABELS[track]!) }}
              </span>
            </div>
          </div>

          <!-- Costs -->
          <div>
            <p class="text-[10px] uppercase tracking-widest text-text-dim mb-1 font-display">
              {{ locale === 'vi' ? 'Chi phí' : 'Cost' }}
            </p>
            <div class="flex gap-3 items-center">
              <span
                v-if="card.costBudget > 0"
                class="text-accent-amber text-sm font-semibold flex items-center gap-1"
              >
                <Icon :icon="RESOURCE_LUCIDE.budget" class="w-4 h-4" /> {{ card.costBudget }}
              </span>
              <span
                v-if="card.costEnergy > 0"
                class="text-accent-sky text-sm font-semibold flex items-center gap-1"
              >
                <Icon :icon="RESOURCE_LUCIDE.energy" class="w-4 h-4" /> {{ card.costEnergy }}
              </span>
              <span
                v-if="card.costBudget === 0 && card.costEnergy === 0 && !card.costResources"
                class="text-text-dim text-sm"
              >
                {{ locale === 'vi' ? 'Miễn phí' : 'Free' }}
              </span>
              <template v-for="[rk, rv] in getResourceEntries(card.costResources)" :key="rk">
                <span
                  :class="['text-sm font-semibold flex items-center gap-1', RES_LABELS[rk].color]"
                >
                  <Icon :icon="RES_LABELS[rk].icon" class="w-4 h-4" /> {{ rv }}
                </span>
              </template>
            </div>
            <!-- Budget upkeep -->
            <div
              v-if="card.upkeep > 0"
              class="flex items-center gap-1 mt-1 text-text-secondary text-sm"
            >
              {{ locale === 'vi' ? 'Duy trì' : 'Upkeep' }}:
              <Icon :icon="RESOURCE_LUCIDE.budget" class="w-3.5 h-3.5" />{{ card.upkeep }}/{{
                locale === 'vi' ? 'lượt' : 'turn'
              }}
            </div>
            <!-- Resource upkeep -->
            <div
              v-if="getResourceEntries(card.upkeepResources).length > 0"
              class="flex items-center gap-2 mt-1"
            >
              <span class="text-sm text-accent-coral"
                >{{ locale === 'vi' ? 'Duy trì' : 'Upkeep' }}:</span
              >
              <span
                v-for="[rk, rv] in getResourceEntries(card.upkeepResources)"
                :key="rk"
                :class="['text-sm font-semibold flex items-center gap-1', RES_LABELS[rk].color]"
              >
                <Icon :icon="RES_LABELS[rk].icon" class="w-3.5 h-3.5" /> {{ rv }}/{{
                  locale === 'vi' ? 'lượt' : 'turn'
                }}
              </span>
            </div>
          </div>

          <!-- Production -->
          <div v-if="getResourceEntries(card.produces).length > 0">
            <p class="text-[10px] uppercase tracking-widest text-text-dim mb-1 font-display">
              {{ locale === 'vi' ? 'Sản xuất' : 'Production' }}
            </p>
            <div class="flex gap-3 flex-wrap">
              <span
                v-for="[rk, rv] in getResourceEntries(card.produces)"
                :key="rk"
                :class="['text-sm font-semibold flex items-center gap-1', RES_LABELS[rk].color]"
              >
                <Icon :icon="RES_LABELS[rk].icon" class="w-4 h-4" /> +{{ rv }}/{{
                  locale === 'vi' ? 'lượt' : 'turn'
                }}
              </span>
            </div>
          </div>

          <!-- Home Effects -->
          <div v-if="formatEffects(card.homeEffects).length > 0">
            <p class="text-[10px] uppercase tracking-widest text-text-dim mb-1 font-display">
              {{ locale === 'vi' ? 'Hiệu ứng (đúng vùng)' : 'Home Effects' }}
            </p>
            <div class="flex gap-3 flex-wrap">
              <span
                v-for="fx in formatEffects(card.homeEffects)"
                :key="fx.key"
                :class="['text-sm font-semibold flex items-center gap-1', fx.color]"
              >
                <Icon :icon="trackIcon(fx.key)" class="w-4 h-4" /> {{ fx.value > 0 ? '+' : ''
                }}{{ fx.value }} {{ fx.label }}
              </span>
            </div>
          </div>

          <!-- Away Effects -->
          <div v-if="formatEffects(card.awayEffects).length > 0">
            <p class="text-[10px] uppercase tracking-widest text-text-dim mb-1 font-display">
              {{ locale === 'vi' ? 'Hiệu ứng (lệch vùng)' : 'Away Effects' }}
            </p>
            <div class="flex gap-3 flex-wrap">
              <span
                v-for="fx in formatEffects(card.awayEffects)"
                :key="fx.key"
                :class="['text-sm font-semibold flex items-center gap-1', fx.color]"
              >
                <Icon :icon="trackIcon(fx.key)" class="w-4 h-4" /> {{ fx.value > 0 ? '+' : ''
                }}{{ fx.value }} {{ fx.label }}
              </span>
            </div>
          </div>

          <!-- Biome -->
          <div>
            <p class="text-[10px] uppercase tracking-widest text-text-dim mb-1 font-display">
              {{ locale === 'vi' ? 'Vùng miền' : 'Biome' }}
            </p>
            <p class="text-sm text-text-secondary">
              {{ getBiomeName() }}
              <span
                v-if="card.regionLocked"
                class="text-accent-coral text-xs ml-1 inline-flex items-center gap-0.5"
              >
                <Icon :icon="UI_LUCIDE.lock" class="w-3 h-3" />
                {{ locale === 'vi' ? 'Chỉ vùng này' : 'Region locked' }}
              </span>
            </p>
          </div>

          <!-- Develops Biome -->
          <div v-if="card.developsIome">
            <p class="text-[10px] uppercase tracking-widest text-text-dim mb-1 font-display">
              {{ locale === 'vi' ? 'Khai phá vùng' : 'Develops Biome' }}
            </p>
            <p class="text-sm text-text-secondary">
              {{
                (() => {
                  const b = BIOMES.find((b) => b.id === card.developsIome)
                  return b ? `${b.emoji} ${t(b.name)}` : card.developsIome
                })()
              }}
            </p>
          </div>

          <!-- Unlock Condition -->
          <div>
            <p class="text-[10px] uppercase tracking-widest text-text-dim mb-1 font-display">
              {{ locale === 'vi' ? 'Điều kiện mở khóa' : 'Unlock Condition' }}
            </p>
            <p class="text-sm text-text-secondary">
              {{ getUnlockText() }}
            </p>
          </div>
        </div>

        <!-- Close footer -->
        <div class="px-5 pb-5 pt-1">
          <button
            class="w-full py-2.5 rounded-lg bg-bg-elevated text-text-primary text-sm font-semibold hover:bg-bg-deep transition-colors touch-manipulation"
            @click="emit('close')"
          >
            {{ locale === 'vi' ? 'Đóng' : 'Close' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
