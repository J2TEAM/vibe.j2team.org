<template>
  <div
    class="min-h-screen bg-bg-deep text-text-primary p-4 md:p-8 font-sans selection:bg-accent-coral selection:text-text-primary flex flex-col items-center"
  >
    <!-- Header -->
    <header
      class="max-w-4xl w-full mb-10 border-b border-border-default pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4"
    >
      <div>
        <h1
          class="font-display text-4xl md:text-5xl font-bold tracking-tight text-text-primary -rotate-1"
        >
          human<span class="text-accent-sky">_</span>verification
        </h1>
        <p
          class="text-sm text-text-secondary mt-3 font-medium border-l-2 border-accent-sky pl-3 max-w-sm"
        >
          Hệ thống cần xác nhận bạn là một thực thể sinh học.
        </p>
      </div>
      <router-link
        to="/"
        class="group flex items-center gap-2 text-sm font-display font-semibold text-text-secondary hover:text-accent-sky transition-colors duration-300"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4 transform group-hover:-translate-x-1 transition-transform"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fill-rule="evenodd"
            d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
            clip-rule="evenodd"
          />
        </svg>
        Trở về sảnh chính
      </router-link>
    </header>

    <main class="max-w-2xl w-full flex-1 pb-16 flex flex-col items-center">
      <!-- Verification Complete State -->
      <div v-if="store.fullyVerified" class="w-full text-center mt-10 animate-bounce-in">
        <div
          class="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-none flex items-center justify-center mx-auto mb-6 transform -rotate-6 border border-emerald-500 shadow-[4px_4px_0_0_#10b981]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-10 w-10"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 class="text-3xl font-display font-bold text-text-primary mb-4 tracking-tight">
          Xác thực thành công.
        </h2>
        <p class="text-lg text-text-secondary">
          Chúc mừng. Bạn đã chính thức được công nhận là con người.
        </p>

        <router-link
          to="/"
          class="inline-block mt-8 bg-bg-deep border border-border-default text-text-primary px-8 py-3 font-display font-bold transition-all hover:bg-border-default"
        >
          Quay lại sảnh chính
        </router-link>
      </div>

      <!-- Active Challenges -->
      <div v-else class="w-full">
        <!-- Progress Indicator -->
        <div class="mb-8 w-full flex flex-col items-center text-center">
          <div class="flex gap-2 mb-2">
            <div
              v-for="(_, index) in store.activeChallenges"
              :key="index"
              class="w-16 h-2 rounded-full transition-all duration-500"
              :class="
                index < store.currentChallengeIndex
                  ? 'bg-accent-sky'
                  : index === store.currentChallengeIndex
                    ? 'bg-accent-sky/50 animate-pulse'
                    : 'bg-border-default'
              "
            ></div>
          </div>
          <p class="text-xs font-display font-bold text-text-secondary uppercase tracking-widest">
            Challenge {{ store.currentChallengeIndex + 1 }} of {{ store.activeChallenges.length }}
          </p>
        </div>

        <!-- Troll Message -->
        <div
          v-if="showTrollMessage"
          class="w-full text-center bg-accent-coral/10 border border-accent-coral p-6 mb-8 animate-shake"
        >
          <p class="text-accent-coral font-bold font-display text-lg uppercase tracking-wider mb-2">
            Kiểm tra lại chút...
          </p>
          <p class="text-text-primary text-sm">Chỉ để cho chắc chắn thôi. Làm lại nhé.</p>
        </div>

        <!-- Challenge Container -->
        <div
          class="w-full bg-bg-surface rounded-none border border-border-default p-6 md:p-10 relative transition-all duration-300 shadow-[8px_8px_0_0_rgba(255,255,255,0.05)] min-h-[300px] flex items-center justify-center overflow-hidden"
        >
          <Transition name="fade" mode="out-in">
            <component
              :is="currentComponent"
              :key="store.currentChallengeIndex + store.verificationSeed"
              @pass="handlePass"
            />
          </Transition>
        </div>
      </div>
    </main>

    <!-- Footer Credit -->
    <footer
      class="w-full max-w-4xl border-t border-border-default pt-6 pb-2 text-left flex justify-between items-center px-2"
    >
      <div class="text-sm font-display text-text-secondary tracking-wider">
        HUMAN VERIFICATION <span class="text-border-default opacity-50 mx-2">/</span> EST. 2026
      </div>
      <div class="text-sm text-text-dim">
        Built by
        <a
          href="https://github.com/h1n4mx0"
          target="_blank"
          rel="noopener noreferrer"
          class="font-bold text-accent-sky hover:underline transition-all"
        >
          h1n4mx0
        </a>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../the-form-game/store'

import ChallengeReaction from '../the-form-game/challenges/ChallengeReaction.vue'
import ChallengeTyping from '../the-form-game/challenges/ChallengeTyping.vue'
import ChallengeTiming from '../the-form-game/challenges/ChallengeTiming.vue'
import ChallengeMouse from '../the-form-game/challenges/ChallengeMouse.vue'

const store = useGameStore()
const router = useRouter()

const showTrollMessage = ref(false)

import type { Component } from 'vue'

const componentMap: Record<string, Component> = {
  reaction: ChallengeReaction as Component,
  typing: ChallengeTyping as Component,
  timing: ChallengeTiming as Component,
  mouse: ChallengeMouse as Component,
}

const currentComponent = computed(() => {
  const challengeKey = store.activeChallenges[store.currentChallengeIndex]
  if (!challengeKey) return null
  return componentMap[challengeKey]
})

const handlePass = () => {
  const previousTrollState = store.hasBeenTrolled
  store.passCurrentChallenge()

  if (store.hasBeenTrolled && !previousTrollState) {
    // Just got trolled
    showTrollMessage.value = true
    setTimeout(() => {
      showTrollMessage.value = false
    }, 4000)
  }
}

onMounted(() => {
  // If user accesses directly without having triggered captcha from the form game:
  if (!store.captchaRequested) {
    router.push('/the-form-game')
  }
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  10%,
  30%,
  50%,
  70%,
  90% {
    transform: translateX(-4px);
  }
  20%,
  40%,
  60%,
  80% {
    transform: translateX(4px);
  }
}

.animate-shake {
  animation: shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}

@keyframes bounce-in {
  0% {
    transform: scale(0.9);
    opacity: 0;
  }
  50% {
    transform: scale(1.05);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.animate-bounce-in {
  animation: bounce-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}
</style>
