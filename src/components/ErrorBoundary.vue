<script setup lang="ts">
import { computed, ref, watch, onErrorCaptured } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

const GITHUB_ISSUES_URL = 'https://github.com/J2TEAM/vibe.j2team.org/issues/new'

const route = useRoute()
const error = ref<Error | null>(null)

const reportUrl = computed(() => {
  if (!error.value) return ''
  const title = `[Bug] ${error.value.message}`
  const body = [
    '## Mô tả lỗi',
    '',
    `- **Trang:** \`${route.fullPath}\``,
    `- **Lỗi:** \`${error.value.message}\``,
    `- **User Agent:** \`${navigator.userAgent}\``,
    '',
    '## Các bước tái hiện',
    '',
    '1. ',
  ].join('\n')
  const params = new URLSearchParams({ title, body })
  return `${GITHUB_ISSUES_URL}?${params}`
})

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
      <a
        :href="reportUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="mt-6 inline-block text-sm text-text-secondary hover:text-accent-coral transition-colors underline underline-offset-4"
      >
        Báo lỗi trên GitHub
      </a>
    </div>
  </div>
  <slot v-else />
</template>
