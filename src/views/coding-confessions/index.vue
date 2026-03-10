<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { confessions } from './confessions'

function getRandomIndex(excludeIndex: number): number {
  if (confessions.length <= 1) return 0
  let next: number
  do {
    next = Math.floor(Math.random() * confessions.length)
  } while (next === excludeIndex)
  return next
}

const currentIndex = ref(getRandomIndex(-1))
const current = computed(() => confessions[currentIndex.value]!)

function next() {
  currentIndex.value = getRandomIndex(currentIndex.value)
}
</script>

<template>
  <div
    class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col items-center justify-center px-4 py-12"
  >
    <h1
      class="font-display text-3xl min-[375px]:text-4xl sm:text-5xl font-bold text-accent-coral text-center animate-fade-up"
    >
      Coding Confessions
    </h1>
    <p
      class="mt-3 text-text-secondary text-sm sm:text-base text-center animate-fade-up animate-delay-2"
    >
      Những tâm sự mà dev nào cũng từng trải qua...
    </p>

    <div class="mt-10 w-full max-w-lg animate-fade-up animate-delay-3">
      <Transition name="confession" mode="out-in">
        <div
          :key="currentIndex"
          class="relative border border-border-default bg-bg-surface p-6 sm:p-8"
        >
          <span
            class="absolute -top-3 -left-3 font-display text-5xl text-accent-coral leading-none select-none"
            >"</span
          >
          <p class="text-text-primary text-lg sm:text-xl leading-relaxed pl-4">
            {{ current.text }}
          </p>
          <span
            class="absolute -bottom-3 -right-3 font-display text-5xl text-accent-coral leading-none select-none rotate-180"
            >"</span
          >
        </div>
      </Transition>

      <div class="mt-4 flex items-center justify-between">
        <span class="text-text-dim text-xs">
          #{{ currentIndex + 1 }}/{{ confessions.length }}
        </span>
        <span
          v-if="current.tag"
          class="text-accent-amber text-xs border border-accent-amber/30 px-2 py-0.5"
        >
          {{ current.tag }}
        </span>
      </div>
    </div>

    <button
      class="mt-8 inline-flex items-center gap-2 border border-accent-coral bg-accent-coral/10 px-6 py-3 text-sm text-accent-coral font-display font-bold transition hover:bg-accent-coral hover:text-bg-deep cursor-pointer animate-fade-up animate-delay-4"
      @click="next"
    >
      Confession tiếp theo &rarr;
    </button>

    <RouterLink
      to="/"
      class="mt-6 inline-flex items-center gap-2 border border-border-default bg-bg-surface px-5 py-2.5 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary animate-fade-up animate-delay-5"
    >
      &larr; Về trang chủ
    </RouterLink>
  </div>
</template>

<style scoped>
.confession-enter-active,
.confession-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.confession-enter-from {
  opacity: 0;
  transform: translateY(1rem);
}

.confession-leave-to {
  opacity: 0;
  transform: translateY(-1rem);
}
</style>
