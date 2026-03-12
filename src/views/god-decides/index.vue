<script lang="ts" setup>
import { RouterLink } from 'vue-router'
import Background from './components/BackgroundAnimation.vue'
import MysticalCard from './components/MysticalCard.vue'
import IconArrowBack from './components/icons/IconArrowBack.vue'
import { onMounted, ref } from 'vue'

const isMounted = ref(false)
onMounted(() => {
  isMounted.value = true
})
</script>

<template>
  <transition name="fade" mode="out-in">
    <div v-if="isMounted">
      <Background />
      <header>
        <div class="text-center z-10 w-full">
          <div class="flex justify-between items-center w-full max-w-4xl p-4 mx-auto">
            <RouterLink
              to="/"
              class="group inline-flex items-center gap-2 rounded-lg border border-border-default px-4 py-2 text-sm text-main-color transition hover:text-accent-coral shrink-0"
            >
              <IconArrowBack
                class="relative transition-all duration-300 left-0 group-hover:-left-1"
              />
              Về trang chủ
            </RouterLink>
            <h1 class="title font-bold flex flex-wrap justify-end items-center gap-2">
              <span class="text-main-color">God Guidance</span> |
              <span class="text-xs">Vị thần của những quyết định</span>
            </h1>
          </div>
        </div>
      </header>
      <MysticalCard />
      <footer class="fixed bottom-0 left-0 right-0 text-center z-10 w-full p-4">
        <p class="text-sm text-text-secondary">
          by
          <a
            href="https://github.com/heydayle"
            target="_blank"
            rel="noopener noreferrer"
            class="text-main-color underline"
            >heydayle</a
          >
          since 2025
        </p>
      </footer>
    </div>
  </transition>
</template>
<style scoped>
.text-main-color {
  color: #ffd700;
  text-shadow: 0 0 5px rgba(255, 215, 0, 0.5);
}

.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.5s ease,
    transform 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
  transform: translateY(0);
}
</style>
