<script setup lang="ts">
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import type { Idiom } from '../../data/types'

defineProps<{
  idiom: Idiom
  index?: number
  isLearned?: boolean
}>()

const emit = defineEmits<{
  (e: 'learned'): void
  (e: 'relearn'): void
}>()

const face = ref<0 | 1 | 2>(0)

function flip() {
  face.value = ((face.value + 1) % 3) as 0 | 1 | 2
}

function handleLearned() {
  emit('learned')
  face.value = 0
}

function handleRelearn() {
  emit('relearn')
  face.value = 0
}
</script>

<template>
  <div class="relative w-full">
    <!-- Background number -->
    <span
      v-if="index !== undefined"
      class="pointer-events-none absolute right-4 top-3 select-none font-display text-8xl font-bold text-accent-coral/5"
    >
      {{ String(index + 1).padStart(2, '0') }}
    </span>

    <!-- Card container with 3D perspective -->
    <div
      class="relative cursor-pointer border border-border-default bg-bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5"
      style="min-height: 280px"
      @click="flip"
    >
      <!-- Learned badge -->
      <div
        v-if="isLearned"
        class="absolute left-4 top-4 flex items-center gap-1 text-xs font-display text-accent-sky"
      >
        <Icon icon="lucide:check-circle" class="size-4" />
        Đã thuộc
      </div>

      <!-- Face 0: English phrase -->
      <div
        v-if="face === 0"
        class="flex h-full min-h-[240px] flex-col items-center justify-center text-center"
      >
        <span class="mb-4 text-4xl">{{ idiom.emoji }}</span>
        <h3 class="font-display text-2xl font-bold text-accent-coral">
          {{ idiom.phrase }}
        </h3>
        <p class="mt-4 text-sm text-text-secondary">
          <Icon icon="lucide:pointer" class="mr-1 inline size-4" />
          Nhấn để lật xem dịch thẳng 🤡
        </p>
      </div>

      <!-- Face 1: Literal Vietnamese (funny) -->
      <div
        v-else-if="face === 1"
        class="flex h-full min-h-[240px] flex-col items-center justify-center text-center"
      >
        <p class="mb-2 text-xs font-display tracking-widest text-text-dim">DỊCH THẲNG</p>
        <h3 class="font-display text-xl font-semibold text-accent-amber">
          {{ idiom.literal_vi }}
        </h3>
        <p class="mt-6 text-sm text-text-secondary">Nhấn để xem nghĩa thật →</p>
      </div>

      <!-- Face 2: Real meaning + context -->
      <div v-else class="flex h-full min-h-[240px] flex-col justify-center">
        <p class="mb-2 text-xs font-display tracking-widest text-accent-coral">// NGHĨA THẬT</p>
        <h3 class="font-display text-lg font-semibold text-text-primary">
          {{ idiom.meaning_vi }}
        </h3>

        <div class="mt-4 border border-border-default bg-bg-elevated p-4">
          <p class="text-sm italic text-text-secondary">
            {{ idiom.funny_context }}
          </p>
        </div>

        <div class="mt-4 space-y-1 text-sm">
          <p class="text-accent-sky">🇬🇧 {{ idiom.example_en }}</p>
          <p class="text-text-secondary">🇻🇳 {{ idiom.example_vi }}</p>
        </div>

        <!-- Action buttons -->
        <div class="mt-4 flex gap-3">
          <button
            class="flex flex-1 items-center justify-center gap-2 border border-accent-sky bg-accent-sky/10 px-4 py-2 text-sm font-display text-accent-sky transition hover:bg-accent-sky/20"
            @click.stop="handleLearned"
          >
            <Icon icon="lucide:check" class="size-4" />
            Thuộc Rồi ✅
          </button>
          <button
            class="flex flex-1 items-center justify-center gap-2 border border-border-default px-4 py-2 text-sm font-display text-text-secondary transition hover:border-accent-amber hover:text-accent-amber"
            @click.stop="handleRelearn"
          >
            <Icon icon="lucide:refresh-cw" class="size-4" />
            Học Lại 🔄
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
