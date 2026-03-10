<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

import { Icon } from '@iconify/vue'
import { REPO_URL } from '@/data/constants'
import { useFavorites } from '@/composables/useFavorites'

const props = defineProps<{
  pagePath: string
}>()

const router = useRouter()
const { toggleFavorite, isFavorite } = useFavorites()

const isDismissed = ref(false)
const isOpen = ref(false)
const isAnimating = ref(false)
let hideTimeout: ReturnType<typeof setTimeout> | undefined

const sourceUrl = computed(() => `${REPO_URL}/tree/main/src/views${props.pagePath}`)

const favorited = computed(() => isFavorite(props.pagePath))

function show() {
  clearTimeout(hideTimeout)
  isOpen.value = true
}

function scheduleHide() {
  clearTimeout(hideTimeout)
  hideTimeout = setTimeout(() => {
    isOpen.value = false
  }, 300)
}

function toggle() {
  if (isOpen.value) {
    isOpen.value = false
  } else {
    show()
  }
}

function handleFavorite() {
  const willBeFavorite = !favorited.value
  toggleFavorite(props.pagePath)
  if (willBeFavorite) {
    isAnimating.value = true
    setTimeout(() => {
      isAnimating.value = false
    }, 500)
  }
}

function goHome() {
  router.push('/')
}

function dismiss() {
  isDismissed.value = true
  isOpen.value = false
}
</script>

<template>
  <div
    v-if="!isDismissed"
    class="fixed right-0 top-1/2 -translate-y-1/2 z-50 flex items-center"
    @mouseenter="show"
    @mouseleave="scheduleHide"
  >
    <!-- Trigger tab (always flush to right edge) -->
    <button
      class="flex-shrink-0 flex items-center justify-center w-6 h-14 rounded-l-lg transition-all duration-300 cursor-pointer"
      :class="
        isOpen ? 'bg-bg-elevated/90 backdrop-blur-sm' : 'bg-bg-elevated/60 hover:bg-bg-elevated/80'
      "
      :aria-label="isOpen ? 'Ẩn toolbar' : 'Hiện toolbar'"
      @click="toggle"
    >
      <Icon
        :icon="isOpen ? 'lucide:chevron-right' : 'lucide:chevron-left'"
        class="w-4 h-4 text-text-secondary"
      />
    </button>

    <!-- Panel wrapper: collapses to 0 width when closed -->
    <div
      class="overflow-hidden transition-all duration-300"
      :class="isOpen ? 'max-w-xs' : 'max-w-0'"
    >
      <div
        class="flex flex-col gap-2 p-2 rounded-l-xl bg-bg-elevated/90 backdrop-blur-sm border border-r-0 border-border-default shadow-lg"
      >
        <!-- View source code -->
        <a
          :href="sourceUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="toolbar-btn group"
          title="Xem mã nguồn"
        >
          <Icon icon="lucide:code-2" class="w-5 h-5" />
          <span class="toolbar-label">Mã nguồn</span>
        </a>

        <!-- Bookmark -->
        <button
          class="toolbar-btn group"
          :class="[favorited && 'text-accent-coral', isAnimating && 'is-animating']"
          :title="favorited ? 'Bỏ yêu thích' : 'Thêm yêu thích'"
          @click="handleFavorite"
        >
          <Icon icon="lucide:heart" class="w-5 h-5" :class="favorited && 'icon-filled'" />
          <span class="toolbar-label">{{ favorited ? 'Đã thích' : 'Yêu thích' }}</span>
        </button>

        <!-- Home -->
        <button class="toolbar-btn group" title="Về trang chủ" @click="goHome">
          <Icon icon="lucide:home" class="w-5 h-5" />
          <span class="toolbar-label">Trang chủ</span>
        </button>

        <hr class="border-border-default" />

        <!-- Dismiss toolbar -->
        <button class="toolbar-btn group text-text-dim" title="Tắt toolbar" @click="dismiss">
          <Icon icon="lucide:x" class="w-5 h-5" />
          <span class="toolbar-label">Tắt</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.toolbar-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 0.5rem;
  color: var(--color-text-secondary);
  transition: all 0.2s;
  cursor: pointer;
  white-space: nowrap;
}

.toolbar-btn:hover {
  color: var(--color-text-primary);
  background-color: var(--color-bg-deep);
}

.toolbar-label {
  font-size: 0.75rem;
}

.icon-filled :deep(path) {
  fill: currentColor;
}

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

.toolbar-btn.is-animating svg {
  animation: heart-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
</style>
