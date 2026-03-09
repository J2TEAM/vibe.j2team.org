<script setup lang="ts">
import { ref, watch, onErrorCaptured } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()
const error = ref<Error | null>(null)

onErrorCaptured((err: Error) => {
  error.value = err
  return false
})

watch(
  () => route.fullPath,
  () => {
    error.value = null
  },
)

function retry() {
  error.value = null
}
</script>

<template>
  <div v-if="error" class="min-h-screen bg-bg-deep flex items-center justify-center px-6">
    <div class="text-center max-w-md">
      <p class="text-6xl" aria-hidden="true">💥</p>
      <p
        class="mt-4 font-display text-7xl sm:text-8xl font-bold text-accent-coral -rotate-2"
        aria-hidden="true"
      >
        Oops!
      </p>
      <h1 class="mt-6 text-xl text-text-primary font-display font-bold">
        Ứng dụng này gặp sự cố rồi
      </h1>
      <p class="mt-3 text-base text-text-secondary leading-relaxed">
        Đừng lo, chỉ có trang này bị lỗi thôi — các trang khác vẫn chạy bình thường.
        <br />
        Bạn có thể thử lại hoặc quay về trang chủ.
      </p>
      <div class="mt-8 flex items-center justify-center gap-4">
        <button
          type="button"
          class="bg-accent-coral text-bg-deep font-display font-bold text-sm tracking-widest px-6 py-3 hover:bg-accent-amber transition-colors cursor-pointer"
          @click="retry"
        >
          THỬ LẠI
        </button>
        <RouterLink
          to="/"
          class="border border-text-secondary text-text-primary font-display font-bold text-sm tracking-widest px-6 py-3 hover:border-accent-coral hover:text-accent-coral transition-colors"
        >
          VỀ TRANG CHỦ
        </RouterLink>
      </div>
    </div>
  </div>
  <slot v-else />
</template>
