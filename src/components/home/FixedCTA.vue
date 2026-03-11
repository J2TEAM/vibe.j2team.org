<script setup lang="ts">
import { ref, computed } from 'vue'
import { useIntersectionObserver } from '@vueuse/core'
import { Icon } from '@iconify/vue'

const props = defineProps<{
  observeTarget: HTMLElement | undefined
  hideTarget: HTMLElement | undefined
}>()

const pastHero = ref(false)
const footerVisible = ref(false)
const visible = computed(() => pastHero.value && !footerVisible.value)

useIntersectionObserver(
  () => props.observeTarget,
  ([entry]) => {
    if (entry) pastHero.value = !entry.isIntersecting
  },
  { threshold: 0 },
)

useIntersectionObserver(
  () => props.hideTarget,
  ([entry]) => {
    if (entry) footerVisible.value = entry.isIntersecting
  },
  { threshold: 0 },
)
</script>

<template>
  <Transition name="fixed-cta">
    <a
      v-show="visible"
      href="#cach-tham-gia"
      class="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 border border-accent-coral bg-accent-coral/10 px-6 py-2.5 font-display font-semibold text-accent-coral tracking-wide backdrop-blur-sm transition-all duration-300 hover:bg-accent-coral hover:text-bg-deep"
    >
      <Icon icon="lucide:rocket" class="inline w-4 h-4 -mt-0.5" />
      Tham gia ngay
    </a>
  </Transition>
</template>

<style scoped>
.fixed-cta-enter-active,
.fixed-cta-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.fixed-cta-enter-from,
.fixed-cta-leave-to {
  opacity: 0;
  transform: translate(-50%, 12px);
}
</style>
