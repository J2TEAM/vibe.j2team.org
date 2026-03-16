<script setup lang="ts">
import { computed } from 'vue'
import { useScroll } from '@vueuse/core'
import { Icon } from '@iconify/vue'

const { y } = useScroll(window)
const visible = computed(() => y.value > 300)

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <Transition name="back-to-top">
    <button
      v-show="visible"
      class="fixed bottom-6 right-6 z-40 flex h-10 w-10 items-center justify-center border border-border-default bg-accent-coral text-bg-deep font-display text-lg font-bold transition-colors duration-300 hover:bg-accent-amber hover:border-accent-amber cursor-pointer"
      aria-label="Về đầu trang"
      @click="scrollToTop"
    >
      <Icon icon="lucide:arrow-up" class="w-5 h-5" />
    </button>
  </Transition>
</template>

<style scoped>
.back-to-top-enter-active,
.back-to-top-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.back-to-top-enter-from,
.back-to-top-leave-to {
  opacity: 0;
  transform: translateY(12px);
}
</style>
