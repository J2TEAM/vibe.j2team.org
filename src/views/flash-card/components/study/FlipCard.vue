<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  front: string
  back: string
  showFrontFirst: boolean
  isFlipped: boolean
  offsetX?: number
}>()

const emit = defineEmits<{
  flip: []
}>()

const dragStyle = computed(() => {
  const x = props.offsetX ?? 0
  const flipPart = props.isFlipped ? ' rotateY(180deg)' : ''
  if (x === 0) {
    // No drag — let CSS class handle flip
    return {}
  }
  const rotation = x * 0.08
  const opacity = Math.max(0.3, 1 - Math.abs(x) / 500)
  return {
    transform: `translateX(${x}px) rotate(${rotation}deg)${flipPart}`,
    opacity: `${opacity}`,
    transition: 'none',
  }
})

const hasDragStyle = computed(() => (props.offsetX ?? 0) !== 0)
</script>

<template>
  <div class="flip-container w-full aspect-[3/2] max-w-lg mx-auto select-none relative">
    <div
      class="flip-card w-full h-full cursor-pointer"
      :class="{ flipped: isFlipped && !hasDragStyle }"
      :style="dragStyle"
      @click="emit('flip')"
    >
      <!-- First side -->
      <div
        class="flip-face flip-front border border-border-default bg-bg-surface flex items-center justify-center p-8"
      >
        <p
          class="font-display text-2xl sm:text-3xl font-semibold text-text-primary break-words text-center"
        >
          {{ showFrontFirst ? front : back }}
        </p>
      </div>

      <!-- Second side -->
      <div
        class="flip-face flip-back border-2 border-accent-coral/40 bg-bg-deep flex items-center justify-center p-8"
      >
        <p
          class="font-display text-2xl sm:text-3xl font-semibold text-accent-coral break-words text-center"
        >
          {{ showFrontFirst ? back : front }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.flip-container {
  perspective: 1000px;
}

.flip-card {
  position: relative;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;
}

.flip-card.flipped {
  transform: rotateY(180deg);
}

.flip-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.flip-back {
  transform: rotateY(180deg);
}
</style>
