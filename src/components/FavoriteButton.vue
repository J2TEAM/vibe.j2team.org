<script setup lang="ts">
import { ref } from 'vue'
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
    <svg v-if="isFavorite(path)" class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
      />
    </svg>
    <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
      />
    </svg>
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
