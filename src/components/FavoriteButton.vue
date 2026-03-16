<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useTimeoutFn } from '@vueuse/core'
import { useFavorites } from '@/composables/useFavorites'

const props = defineProps<{
  path: string
  /** Always show the button (e.g. on bookmarks page). Default: show on hover only. */
  alwaysVisible?: boolean
}>()

const { toggleFavorite, isFavorite } = useFavorites()

const { isPending: isAnimating, start: startAnimation } = useTimeoutFn(() => {}, 500, {
  immediate: false,
})

function handleClick() {
  const willBeFavorite = !isFavorite(props.path)
  toggleFavorite(props.path)
  if (willBeFavorite) {
    startAnimation()
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
