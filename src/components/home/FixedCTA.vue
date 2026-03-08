<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'

const props = defineProps<{
  observeTarget: HTMLElement | undefined
  hideTarget: HTMLElement | undefined
}>()

const pastHero = ref(false)
const footerVisible = ref(false)
const visible = computed(() => pastHero.value && !footerVisible.value)

let heroObserver: IntersectionObserver | null = null
let footerObserver: IntersectionObserver | null = null

watch(
  () => props.observeTarget,
  (target) => {
    heroObserver?.disconnect()
    if (!target || typeof IntersectionObserver === 'undefined') return

    heroObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry) pastHero.value = !entry.isIntersecting
      },
      { threshold: 0 },
    )
    heroObserver.observe(target)
  },
  { immediate: true },
)

watch(
  () => props.hideTarget,
  (target) => {
    footerObserver?.disconnect()
    if (!target || typeof IntersectionObserver === 'undefined') return

    footerObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry) footerVisible.value = entry.isIntersecting
      },
      { threshold: 0 },
    )
    footerObserver.observe(target)
  },
  { immediate: true },
)

onUnmounted(() => {
  heroObserver?.disconnect()
  footerObserver?.disconnect()
})
</script>

<template>
  <Transition name="fixed-cta">
    <a
      v-show="visible"
      href="#cach-tham-gia"
      class="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 border border-accent-coral bg-accent-coral/10 px-6 py-2.5 font-display font-semibold text-accent-coral tracking-wide backdrop-blur-sm transition-all duration-300 hover:bg-accent-coral hover:text-bg-deep"
    >
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
