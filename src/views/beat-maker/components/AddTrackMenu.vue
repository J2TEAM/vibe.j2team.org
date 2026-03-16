<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { INSTRUMENT_LIBRARY } from '../types'

const emit = defineEmits<{
  (e: 'add', instrumentId: string): void
  (e: 'close'): void
}>()

const categories = [
  { id: 'drums', label: 'Bộ Trống (Drums)' },
  { id: 'bass', label: 'Bass' },
  { id: 'melodic', label: 'Nhạc Cụ (Melodic)' },
  { id: 'strings', label: 'Nhạc Cụ Dây (Strings)' },
  { id: 'guitar', label: 'Guitar' },
] as const
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-border-default">
      <h3 class="font-display text-sm uppercase tracking-widest">
        <span class="text-accent-coral">//</span> Thư Viện Nhạc Cụ
      </h3>
      <button
        @click="$emit('close')"
        class="text-text-secondary hover:text-accent-coral transition-colors"
      >
        <Icon icon="lucide:x" class="size-4" />
      </button>
    </div>

    <!-- Instrument Categories -->
    <div class="flex-1 overflow-y-auto p-4 space-y-6">
      <div v-for="cat in categories" :key="cat.id">
        <div class="text-[9px] font-display uppercase tracking-[0.3em] text-text-secondary mb-3">
          {{ cat.label }}
        </div>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="inst in INSTRUMENT_LIBRARY.filter((i) => i.category === cat.id)"
            :key="inst.id"
            @click="(emit('add', inst.id), emit('close'))"
            class="flex items-center gap-2 p-3 bg-bg-elevated border border-border-default text-left transition-all hover:border-accent-coral group"
          >
            <div
              class="flex h-8 w-8 items-center justify-center flex-shrink-0 transition-colors"
              :style="{ color: inst.color }"
            >
              <Icon :icon="inst.icon" class="size-5" />
            </div>
            <div>
              <div
                class="text-xs font-display text-text-primary group-hover:text-accent-coral transition-colors"
              >
                {{ inst.name }}
              </div>
              <div class="text-[9px] text-text-secondary uppercase tracking-widest">
                {{ inst.type }}
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- Footer hint -->
    <div class="px-4 py-3 border-t border-border-default">
      <p class="text-[9px] text-text-secondary font-display">Click để thêm vào pattern hiện tại</p>
    </div>
  </div>
</template>
