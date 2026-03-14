<script setup lang="ts">
import { ref } from 'vue'
import { useIntersectionObserver } from '@vueuse/core'

defineProps<{
  src: string
}>()

const target = ref<HTMLElement | null>(null)
const isVisible = ref(false)
const isError = ref(false)

const { stop } = useIntersectionObserver(
  target,
  (entries) => {
    const isIntersecting = entries[0]?.isIntersecting
    if (isIntersecting && !isVisible.value) {
      isVisible.value = true
      stop() // Stop observing once it's loaded to save resources
    }
  },
  { rootMargin: '2500px 0px 2500px 0px' }, // Load images ~2.5 screens before they appear
)
</script>

<template>
  <div
    ref="target"
    class="w-full min-h-[300px] flex items-center justify-center bg-bg-deep relative"
  >
    <img
      v-if="isVisible"
      :src="src"
      class="w-full object-contain block m-0 p-0 border-none leading-none align-bottom min-h-[300px]"
      alt="Trang truyện"
      style="margin-bottom: -1px"
      @error="
        (e) => {
          isError = true
          ;(e.target as HTMLImageElement).src =
            'data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'100%\' height=\'300\'><rect width=\'100%\' height=\'300\' fill=\'%23111\'/><text x=\'50%\' y=\'50%\' font-family=\'sans-serif\' font-size=\'14\' fill=\'%23666\' text-anchor=\'middle\'>Không thể tải ảnh này</text></svg>'
        }
      "
    />
    <div
      v-if="!isVisible || isError"
      class="absolute inset-0 flex items-center justify-center pointer-events-none"
    >
      <!-- Extremely subtle loading state, usually user won't see this since we load 2500px in advance -->
      <div
        v-if="!isVisible"
        class="w-8 h-8 rounded-full border-2 border-white/5 border-t-white/20 animate-spin"
      ></div>
    </div>
  </div>
</template>
