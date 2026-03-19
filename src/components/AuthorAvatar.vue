<script setup lang="ts">
import { useGithubAvatar } from '@/composables/useGithubAvatar'

const props = withDefaults(
  defineProps<{
    author: string
    size?: 'sm' | 'md' | 'lg'
  }>(),
  { size: 'sm' },
)

const { avatarUrl, avatarColor, initial, onAvatarError } = useGithubAvatar(props.author)

const sizeClasses: Record<string, string> = {
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-10 h-10 text-sm',
  lg: 'w-20 h-20 text-2xl',
}

const sizePixels: Record<string, number> = {
  sm: 24,
  md: 40,
  lg: 80,
}
</script>

<template>
  <img
    v-if="avatarUrl"
    :src="avatarUrl"
    :alt="author"
    :width="sizePixels[size]"
    :height="sizePixels[size]"
    loading="lazy"
    class="rounded-full object-cover shrink-0"
    :class="sizeClasses[size]"
    @error="onAvatarError"
  />
  <div
    v-else
    class="rounded-full flex items-center justify-center font-display font-bold text-white shrink-0"
    :class="sizeClasses[size]"
    :style="{ backgroundColor: avatarColor }"
  >
    {{ initial }}
  </div>
</template>
