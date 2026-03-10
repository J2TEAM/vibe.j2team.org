<script setup lang="ts">
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import { useFavorites } from '@/composables/useFavorites'

const props = defineProps<{
  path: string
  /** Always show the button (e.g. on bookmarks page). Default: show on hover only. */
  alwaysVisible?: boolean
}>()

const { toggleFavorite, isFavorite } = useFavorites()

const isAnimating = ref(false)

function handleClick() {
  const willBeFavorite = !isFavorite(props.path)
  toggleFavorite(props.path)
  if (willBeFavorite) {
    isAnimating.value = true
    setTimeout(() => {
      isAnimating.value = false
    }, 500)
  }
}
</script>

<template>
  <button
    class="heart-btn absolute z-10 p-1.5 transition-all duration-200 hover:scale-110"
    :class="[
      isFavorite(path)
        ? 'text-accent-coral'
        : alwaysVisible
          ? 'text-text-dim'
          : 'text-text-dim opacity-100 sm:opacity-0 sm:group-hover:opacity-100',
      isAnimating && 'is-animating',
    ]"
    :aria-label="isFavorite(path) ? 'Bỏ yêu thích' : 'Thêm yêu thích'"
    @click.stop.prevent="handleClick"
  >
    <Icon icon="lucide:heart" class="w-5 h-5" :class="isFavorite(path) && 'icon-filled'" />
  </button>
</template>

<style scoped>
@keyframes heart-pop {
  0% {
    transform: scale(0.2);
    opacity: 0.8;
  }
  40% {
    transform: scale(1.3);
    opacity: 1;
  }
  70% {
    transform: scale(0.85);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes heart-particles {
  0% {
    opacity: 1;
    box-shadow:
      0 -10px 0 0 var(--color-accent-coral),
      7px -7px 0 0 var(--color-accent-amber),
      10px 0 0 0 var(--color-accent-coral),
      7px 7px 0 0 var(--color-accent-amber),
      0 10px 0 0 var(--color-accent-coral),
      -7px 7px 0 0 var(--color-accent-amber),
      -10px 0 0 0 var(--color-accent-coral),
      -7px -7px 0 0 var(--color-accent-amber);
  }
  100% {
    opacity: 0;
    box-shadow:
      0 -20px 0 -2px var(--color-accent-coral),
      14px -14px 0 -2px var(--color-accent-amber),
      20px 0 0 -2px var(--color-accent-coral),
      14px 14px 0 -2px var(--color-accent-amber),
      0 20px 0 -2px var(--color-accent-coral),
      -14px 14px 0 -2px var(--color-accent-amber),
      -20px 0 0 -2px var(--color-accent-coral),
      -14px -14px 0 -2px var(--color-accent-amber);
  }
}

.heart-btn.is-animating svg {
  animation: heart-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.icon-filled :deep(path) {
  fill: currentColor;
}

.heart-btn.is-animating::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 3px;
  height: 3px;
  margin: -1.5px 0 0 -1.5px;
  border-radius: 50%;
  background: transparent;
  animation: heart-particles 0.5s ease-out forwards;
  pointer-events: none;
}
</style>
