<script setup lang="ts">
import { ref, computed } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { Icon } from '@iconify/vue'

const props = defineProps<{
  pagePath: string
  reactionsCount: number
}>()

const emit = defineEmits<{
  openComments: []
}>()

// Reaction types matching Giscus style
const reactionTypes = [
  { name: 'like', icon: 'lucide:thumbs-up', color: '#6e7689' },
  { name: 'heart', icon: 'lucide:heart', color: '#f85149' },
  { name: 'haha', icon: 'lucide:laugh', color: '#f0883e' },
  { name: 'wow', icon: 'lucide:sparkles', color: '#f8e3a1' },
  { name: 'sad', icon: 'lucide:frown', color: '#6e7689' },
  { name: 'angry', icon: 'lucide:angry', color: '#f85149' },
]

// User's like state
const likedPosts = useLocalStorage<string[]>('vibebook-likes', [])
const isLiked = computed(() => likedPosts.value.includes(props.pagePath))

const showReactions = ref(false)

function toggleLike() {
  const index = likedPosts.value.indexOf(props.pagePath)
  if (index === -1) {
    likedPosts.value.push(props.pagePath)
  } else {
    likedPosts.value.splice(index, 1)
  }
  emit('openComments')
}

function selectReaction() {
  // Open Giscus modal for user to react
  emit('openComments')
}
</script>

<template>
  <div class="relative">
    <!-- Main Like Button -->
    <button
      class="flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors"
      :class="
        isLiked
          ? 'text-accent-coral'
          : 'text-text-secondary hover:text-text-primary hover:bg-bg-deep'
      "
      @click="toggleLike"
      @mouseenter="showReactions = true"
      @mouseleave="showReactions = false"
    >
      <Icon
        :icon="isLiked ? 'lucide:thumbs-up' : 'lucide:thumbs-up'"
        class="w-4 h-4"
        :class="isLiked && 'fill-current'"
      />
      <span class="text-sm font-medium">
        {{ isLiked ? 'Đã thích' : 'Thích' }}
      </span>
      <span v-if="reactionsCount > 0" class="text-xs text-text-dim">
        {{ reactionsCount }}
      </span>
    </button>

    <!-- Reactions Popup (Giscus-style) -->
    <Transition name="fade">
      <div
        v-show="showReactions"
        class="absolute bottom-full left-0 mb-2 flex gap-1 p-2 bg-bg-elevated border border-border-default shadow-lg rounded-full"
        @mouseenter="showReactions = true"
        @mouseleave="showReactions = false"
      >
        <button
          v-for="reaction in reactionTypes"
          :key="reaction.name"
          class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-bg-deep transition-transform hover:scale-125"
          :title="reaction.name"
          @click="selectReaction"
        >
          <Icon :icon="reaction.icon" class="w-5 h-5" :style="{ color: reaction.color }" />
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
