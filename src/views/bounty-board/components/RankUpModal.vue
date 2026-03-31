<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import type { Rank, BossConfig } from '../types'
import { RANK_CONFIG } from '../constants'

const props = defineProps<{
  event: { rank: Rank; boss: BossConfig } | null
}>()

const emit = defineEmits<{ close: [] }>()

const rankCfg = computed(() => RANK_CONFIG.find((r) => r.label === props.event?.rank))

const rankColors: Record<Rank, string> = {
  F: 'text-text-dim',
  E: 'text-green-400',
  D: 'text-accent-sky',
  C: 'text-blue-400',
  B: 'text-violet-400',
  A: 'text-accent-amber',
  S: 'text-accent-coral',
  SS: 'text-red-400',
}

const rankBg: Record<Rank, string> = {
  F: 'bg-text-dim/10',
  E: 'bg-green-500/10',
  D: 'bg-accent-sky/10',
  C: 'bg-blue-500/10',
  B: 'bg-violet-500/10',
  A: 'bg-accent-amber/10',
  S: 'bg-accent-coral/10',
  SS: 'bg-red-500/10',
}

const rankBorder: Record<Rank, string> = {
  F: 'border-text-dim/30',
  E: 'border-green-400/50',
  D: 'border-accent-sky/50',
  C: 'border-blue-400/50',
  B: 'border-violet-400/50',
  A: 'border-accent-amber/50',
  S: 'border-accent-coral/50',
  SS: 'border-red-400/50',
}
</script>

<template>
  <Teleport to="body">
    <Transition name="rankup">
      <div
        v-if="event"
        class="fixed inset-0 z-[200] flex items-center justify-center p-4"
        style="background: rgba(0, 0, 0, 0.75); backdrop-filter: blur(4px)"
        @click.self="emit('close')"
      >
        <div
          class="relative w-full max-w-md border-2 bg-bg-deep p-8 text-center shadow-2xl"
          :class="event ? [rankBorder[event.rank]] : []"
        >
          <!-- Sparkle corners -->
          <div class="absolute top-2 left-2 text-accent-amber text-xs">✦</div>
          <div class="absolute top-2 right-2 text-accent-amber text-xs">✦</div>
          <div class="absolute bottom-2 left-2 text-accent-amber text-xs">✦</div>
          <div class="absolute bottom-2 right-2 text-accent-amber text-xs">✦</div>

          <!-- Rank badge -->
          <div
            class="mx-auto mb-4 flex size-20 items-center justify-center border-2 text-4xl font-display font-black"
            :class="
              event ? [rankColors[event.rank], rankBg[event.rank], rankBorder[event.rank]] : []
            "
          >
            {{ event?.rank }}
          </div>

          <!-- Title -->
          <div class="font-display text-[10px] tracking-[0.3em] text-text-dim mb-1">
            🎉 THĂNG HẠNG
          </div>
          <h2
            class="font-display text-3xl font-black tracking-widest mb-1"
            :class="event ? rankColors[event.rank] : ''"
          >
            {{ event?.rank }}
          </h2>
          <p class="font-display text-sm text-text-secondary mb-6">
            {{ rankCfg?.title }}
          </p>

          <!-- Divider -->
          <div class="flex items-center gap-3 mb-5">
            <div class="flex-1 h-px bg-red-500/30" />
            <span class="font-display text-[10px] tracking-widest text-red-400"
              >⚠ NHIỆM VỤ THĂNG CẤP</span
            >
            <div class="flex-1 h-px bg-red-500/30" />
          </div>

          <!-- Boss quest preview -->
          <div class="border border-red-500/30 bg-red-500/5 p-4 text-left mb-6">
            <div class="flex items-center gap-3 mb-2">
              <div
                class="flex size-9 items-center justify-center border border-red-500/40 bg-red-500/10"
              >
                <Icon :icon="event?.boss.icon ?? 'lucide:skull'" class="size-5 text-red-400" />
              </div>
              <div>
                <div class="font-display text-xs text-red-400 font-semibold">
                  {{ event?.boss.name }}
                </div>
                <div class="font-display text-[10px] text-text-dim tracking-wider">
                  {{ event?.boss.durationMinutes }} phút · +{{ event?.boss.goldReward }} Gold · Hồi
                  Đầy Máu
                </div>
              </div>
            </div>
            <p class="text-xs text-text-secondary leading-relaxed">{{ event?.boss.description }}</p>
            <p class="mt-2 text-[10px] text-red-400/70 font-display">
              ⚡ Thất bại: mất {{ Math.round((event?.boss.failHpLossPercent ?? 0.4) * 100) }}% HP
            </p>
          </div>

          <!-- CTA -->
          <button
            class="w-full border border-accent-coral bg-accent-coral/10 py-3 font-display text-sm tracking-widest text-accent-coral transition hover:bg-accent-coral/20"
            @click="emit('close')"
          >
            ⚔️ CHẤP NHẬN THỬ THÁCH
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.rankup-enter-active,
.rankup-leave-active {
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.rankup-enter-from,
.rankup-leave-to {
  opacity: 0;
  transform: scale(0.85);
}
</style>
