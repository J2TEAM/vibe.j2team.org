<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { idiomCategories } from '../../data/categories'

const props = defineProps<{
  isSpinning: boolean
  rotation: number
}>()

defineEmits<{
  (e: 'spin'): void
}>()

const segmentAngle = computed(() => 360 / idiomCategories.length)

const wheelStyle = computed(() => ({
  transform: `rotate(${props.rotation}deg)`,
  transition: props.isSpinning ? 'transform 3.5s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
}))

const conicGradient = computed(() => {
  const colors = ['rgba(255,107,74,0.15)', 'rgba(255,184,48,0.15)']
  const segments = idiomCategories
    .map((_, idx) => {
      const start = idx * segmentAngle.value
      const end = (idx + 1) * segmentAngle.value
      const color = colors[idx % 2]
      return `${color} ${start}deg ${end}deg`
    })
    .join(', ')
  return `conic-gradient(${segments})`
})
</script>

<template>
  <div class="relative mx-auto" style="max-width: 320px">
    <!-- Arrow pointer -->
    <div class="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1">
      <div
        class="size-0 border-x-[12px] border-t-[20px] border-x-transparent border-t-accent-coral"
      />
    </div>

    <!-- Wheel -->
    <div
      class="relative mx-auto aspect-square w-full overflow-hidden rounded-full border-4 border-border-default"
      :style="{ ...wheelStyle, background: conicGradient }"
    >
      <!-- Segment labels -->
      <div
        v-for="(cat, idx) in idiomCategories"
        :key="cat.id"
        class="absolute left-1/2 top-1/2 origin-bottom-left"
        :style="{
          transform: `rotate(${idx * segmentAngle + segmentAngle / 2}deg) translateY(-40%)`,
          width: '50%',
        }"
      >
        <span class="block text-center text-lg">{{ cat.emoji }}</span>
      </div>

      <!-- Center circle -->
      <div
        class="absolute left-1/2 top-1/2 z-10 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-accent-coral bg-bg-deep"
      >
        <span class="text-xl">🦜</span>
      </div>
    </div>

    <!-- Spin button -->
    <button
      :disabled="isSpinning"
      class="mt-6 flex w-full items-center justify-center gap-2 border-2 border-accent-coral bg-accent-coral/10 px-6 py-3 font-display text-lg font-bold text-accent-coral transition hover:bg-accent-coral/20 disabled:opacity-50"
      @click="$emit('spin')"
    >
      <Icon v-if="!isSpinning" icon="lucide:rotate-cw" class="size-5" />
      <Icon v-else icon="lucide:loader-2" class="size-5 animate-spin" />
      {{ isSpinning ? 'Đang quay...' : 'QUAY THÔI! 🎲' }}
    </button>
  </div>
</template>
