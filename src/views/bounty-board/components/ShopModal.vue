<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { PlayerState, ShopItem } from '../types'

const props = defineProps<{
  player: PlayerState
  items: ShopItem[]
}>()

const emit = defineEmits<{
  buy: [itemId: string]
}>()

const itemColors: Record<string, string> = {
  hp_potion: 'border-red-500 text-red-400',
  exp_scroll: 'border-accent-amber text-accent-amber',
  dragon_heart: 'border-violet-400 text-violet-300',
  quest_slot: 'border-teal-400 text-teal-300',
  big_hp_potion: 'border-rose-400 text-rose-300',
  gold_scroll: 'border-yellow-400 text-yellow-300',
  free_skip: 'border-indigo-400 text-indigo-300',
  big_exp_scroll: 'border-cyan-400 text-cyan-300',
  instant_exp: 'border-emerald-400 text-emerald-300',
  big_gold: 'border-amber-400 text-amber-300',
  time_extend: 'border-orange-400 text-orange-300',
  warrior_gauntlet: 'border-slate-400 text-slate-300',
}

const itemBgColors: Record<string, string> = {
  hp_potion: 'bg-red-500/5',
  exp_scroll: 'bg-accent-amber/5',
  dragon_heart: 'bg-violet-500/5',
  quest_slot: 'bg-teal-500/5',
  big_hp_potion: 'bg-rose-500/5',
  gold_scroll: 'bg-yellow-500/5',
  free_skip: 'bg-indigo-500/5',
  big_exp_scroll: 'bg-cyan-500/5',
  instant_exp: 'bg-emerald-500/5',
  big_gold: 'bg-amber-500/5',
  time_extend: 'bg-orange-500/5',
  warrior_gauntlet: 'bg-slate-500/5',
}

function handleBuy(itemId: string) {
  emit('buy', itemId)
}

function canAfford(item: ShopItem) {
  return props.player.gold >= item.price
}
</script>

<template>
  <div class="space-y-4">
    <!-- Shop header -->
    <div class="border border-border-default bg-bg-surface p-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Icon icon="lucide:store" class="size-5 text-accent-amber" />
          <h3 class="font-display text-lg font-semibold text-text-primary">Vật Phẩm</h3>
        </div>
        <div
          class="flex items-center gap-1.5 border border-accent-amber/30 bg-accent-amber/10 px-3 py-1.5"
        >
          <Icon icon="lucide:coins" class="size-4 text-accent-amber" />
          <span class="font-display font-bold text-accent-amber">{{ player.gold }} Gold</span>
        </div>
      </div>
      <p class="mt-2 text-xs text-text-secondary">
        Hoàn thành nhiệm vụ để kiếm thêm Vàng. Mỗi vật phẩm có thể mua nhiều lần.
      </p>
    </div>

    <!-- Item list -->
    <div class="grid gap-4 sm:grid-cols-3">
      <div
        v-for="item in items"
        :key="item.id"
        class="relative flex flex-col border-2 p-4 transition-all duration-200"
        :class="[
          itemColors[item.effect] ?? 'border-border-default text-text-secondary',
          itemBgColors[item.effect] ?? 'bg-bg-surface',
          canAfford(item) ? 'hover:-translate-y-0.5' : 'opacity-60',
        ]"
      >
        <!-- Item price badge -->
        <div
          class="absolute z-10 -top-3 -right-2 flex items-center gap-1 bg-accent-amber px-2.5 py-1 font-display text-xs font-bold tracking-wider text-bg-deep shadow-md shadow-accent-amber/20"
        >
          <Icon icon="lucide:coins" class="size-3.5" />
          {{ item.price }}
        </div>

        <!-- Item icon + name -->
        <div class="flex items-center gap-3 pt-2 mb-3">
          <div
            class="flex size-12 items-center justify-center border-2"
            :class="itemColors[item.effect] ?? 'border-border-default'"
          >
            <Icon :icon="item.icon" class="size-6" />
          </div>
          <h4 class="font-display font-bold text-sm text-text-primary leading-tight">
            {{ item.name }}
          </h4>
        </div>

        <!-- Description -->
        <p class="flex-1 text-xs text-text-secondary leading-relaxed mb-4">
          {{ item.description }}
        </p>

        <!-- Buy button -->
        <button
          class="w-full border py-2.5 font-display text-xs tracking-widest uppercase transition"
          :class="
            canAfford(item)
              ? `${itemColors[item.effect]} hover:bg-white/5`
              : 'border-border-default text-text-dim cursor-not-allowed'
          "
          :disabled="!canAfford(item)"
          @click="handleBuy(item.id)"
        >
          <span v-if="canAfford(item)">🛒 Mua ({{ item.price }}G)</span>
          <span v-else>Không đủ Vàng</span>
        </button>
      </div>
    </div>

    <!-- EXP Boost indicator -->
    <div
      v-if="player.expBoostCharges > 0"
      class="flex items-center gap-3 border border-accent-amber/40 bg-accent-amber/10 p-4"
    >
      <Icon icon="lucide:zap" class="size-5 text-accent-amber flex-shrink-0" />
      <div>
        <div class="font-display text-sm font-semibold text-accent-amber">
          Cuộn EXP đang hoạt động!
        </div>
        <div class="text-xs text-text-secondary">
          EXP x2 còn lại cho
          <span class="text-accent-amber font-bold">{{ player.expBoostCharges }}</span> nhiệm vụ
          tiếp theo.
        </div>
      </div>
    </div>
  </div>
</template>
