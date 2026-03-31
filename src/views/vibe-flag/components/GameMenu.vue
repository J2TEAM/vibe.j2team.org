<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { GameMode } from '../types'

const emit = defineEmits<{
  start: [mode: GameMode]
}>()

const modes: { id: GameMode; icon: string; label: string; desc: string; detail: string }[] = [
  {
    id: 'classic',
    icon: 'lucide:globe',
    label: 'Classic',
    desc: '20 câu · 10 giây/câu',
    detail: 'Tích điểm theo combo streak',
  },
  {
    id: 'survival',
    icon: 'lucide:heart',
    label: 'Survival',
    desc: '3 mạng · 8 giây/câu',
    detail: 'Sai 3 lần là thua — bạn dám thử không?',
  },
  {
    id: 'hard',
    icon: 'lucide:eye-off',
    label: 'Hard Mode',
    desc: '15 câu · 12 giây/câu',
    detail: 'Chỉ hiện ¼ góc cờ — dành cho người dũng cảm',
  },
]
</script>

<template>
  <div class="animate-fade-up flex w-full max-w-lg flex-col items-center gap-8">
    <!-- Header -->
    <div class="flex flex-col items-center gap-3 text-center">
      <div class="flex gap-1.5">
        <span v-for="n in 30" :key="n" class="bg-border-default h-1 w-1 rounded-full" />
      </div>
      <h1 class="font-display text-accent-coral text-5xl font-bold tracking-tight">🎌 VIBE FLAG</h1>
      <p class="text-text-secondary font-body text-base">
        Quiz đoán cờ quốc gia — thử thách kiến thức địa lý của bạn
      </p>
      <div class="flex gap-1.5">
        <span v-for="n in 30" :key="n" class="bg-border-default h-1 w-1 rounded-full" />
      </div>
    </div>

    <!-- Mode selection -->
    <div class="flex w-full flex-col gap-4">
      <h2 class="font-display text-text-secondary flex items-center gap-2 text-sm tracking-widest">
        <span class="text-accent-coral">// </span>CHỌN CHẾ ĐỘ
      </h2>
      <div
        v-for="mode in modes"
        :key="mode.id"
        class="border-border-default bg-bg-surface group cursor-pointer border p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5"
        @click="emit('start', mode.id)"
      >
        <div class="flex items-center gap-4">
          <div
            class="bg-bg-elevated border-border-default group-hover:border-accent-coral/50 border p-2.5 transition-colors duration-300"
          >
            <Icon :icon="mode.icon" class="text-accent-coral size-5" />
          </div>
          <div class="flex-1">
            <div class="flex items-center gap-3">
              <span
                class="font-display text-text-primary text-base font-semibold group-hover:text-accent-coral transition-colors duration-300"
              >
                {{ mode.label }}
              </span>
              <span
                class="font-display text-text-dim border-border-default border px-2 py-0.5 text-xs tracking-wide"
              >
                {{ mode.desc }}
              </span>
            </div>
            <p class="font-body text-text-secondary mt-1 text-sm">{{ mode.detail }}</p>
          </div>
          <Icon
            icon="lucide:chevron-right"
            class="text-text-dim group-hover:text-accent-coral size-4 transition-colors duration-300"
          />
        </div>
      </div>
    </div>

    <!-- Badge -->
    <div
      class="bg-accent-coral/10 border-accent-coral/30 font-display text-accent-coral border px-4 py-2 text-xs tracking-widest"
    >
      195+ QUỐC GIA · CỜ TỪ FLAGCDN.COM
    </div>
  </div>
</template>
