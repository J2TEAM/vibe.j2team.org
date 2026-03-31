<script setup lang="ts">
import { ref } from 'vue'
import { useGithubAvatar } from '@/composables/useGithubAvatar'

const props = withDefaults(
  defineProps<{
    author: string
    size?: 'sm' | 'md' | 'lg'
  }>(),
  { size: 'sm' },
)

const { avatarUrl: initialUrl, avatarColor, initial, onAvatarError } = useGithubAvatar(props.author)

const showImg = ref(initialUrl !== null)

function handleError() {
  onAvatarError()
  showImg.value = false
}

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
    v-if="showImg && initialUrl"
    :src="initialUrl"
    :alt="author"
    :width="sizePixels[size]"
    :height="sizePixels[size]"
    loading="lazy"
    decoding="async"
    class="rounded-full object-cover shrink-0"
    :class="sizeClasses[size]"
    @error="handleError"
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
