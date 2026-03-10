<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import meta from './meta'
import IntroScreen from './components/IntroScreen.vue'
import TimeSelect from './components/TimeSelect.vue'
import HeartScan from './components/HeartScan.vue'
import SurpriseEvent from './components/SurpriseEvent.vue'
import ResultScreen from './components/ResultScreen.vue'

type AppState = 'intro' | 'select_time' | 'scan_heart' | 'surprise' | 'result'

const state = ref<AppState>('intro')
const selectedTime = ref(10)
const scanStart = ref(0)
const surpriseTime = ref(0)
const releaseTime = ref(0)
const reactionTime = ref(0)

let surpriseTimer: ReturnType<typeof setTimeout> | null = null

function clearSurpriseTimer() {
  if (surpriseTimer) {
    clearTimeout(surpriseTimer)
    surpriseTimer = null
  }
}

// Step 1: Intro → select time
function onStart() {
  state.value = 'select_time'
}

// Step 2: Select time → scan heart
function onSelectTime(time: number) {
  selectedTime.value = time
  state.value = 'scan_heart'
}

// Step 3: User starts holding the button
function onStartScan() {
  scanStart.value = Date.now()
  surpriseTime.value = 0

  const randomDelay = Math.random() * selectedTime.value * 1000

  surpriseTimer = setTimeout(() => {
    triggerSurprise()
  }, randomDelay)
}

// Step 4: Trigger the jumpscare
function triggerSurprise() {
  surpriseTime.value = Date.now()
  state.value = 'surprise'
}

// Step 5: User releases (either during scan or after surprise)
function onReleaseMouse() {
  // Released before surprise appeared → cancel and restart
  if (state.value === 'scan_heart') {
    clearSurpriseTimer()
    // Allow HeartScan to re-trigger startScan on next hold
    return
  }
}

// Step 6: User releases AFTER the surprise overlay appeared
function onSurpriseRelease() {
  releaseTime.value = Date.now()
  if (surpriseTime.value > 0) {
    reactionTime.value = releaseTime.value - surpriseTime.value
  }
  state.value = 'result'
}

// Step 7: Retry → reset to intro
function onRetry() {
  clearSurpriseTimer()
  state.value = 'intro'
  scanStart.value = 0
  surpriseTime.value = 0
  releaseTime.value = 0
  reactionTime.value = 0
}

onUnmounted(() => {
  clearSurpriseTimer()
})
</script>

<template>
  <div class="relative min-h-screen bg-bg-deep text-text-primary font-body">
    <!-- Top bar -->
    <header
      class="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border-default"
    >
      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 text-sm text-text-secondary transition hover:text-accent-coral"
      >
        <span class="font-display tracking-wide">←</span>
        <span>Về trang chủ</span>
      </RouterLink>
      <div class="flex items-center gap-2">
        <span class="w-1.5 h-1.5 rounded-full bg-accent-coral animate-pulse"></span>
        <span class="font-display text-xs tracking-widest text-text-dim uppercase"
          >Doctor Le Clinic</span
        >
      </div>
    </header>

    <!-- Main content -->
    <main class="flex flex-col items-center justify-center px-4 py-10 sm:py-16">
      <div class="w-full max-w-sm">
        <Transition name="screen" mode="out-in">
          <!-- Intro -->
          <IntroScreen v-if="state === 'intro'" key="intro" @start="onStart" />

          <!-- Time select -->
          <TimeSelect
            v-else-if="state === 'select_time'"
            key="select_time"
            @select-time="onSelectTime"
          />

          <!-- Heart scan -->
          <HeartScan
            v-else-if="state === 'scan_heart'"
            key="scan_heart"
            :selected-time="selectedTime"
            @start-scan="onStartScan"
            @release-mouse="onReleaseMouse"
          />

          <!-- Result -->
          <ResultScreen
            v-else-if="state === 'result'"
            key="result"
            :reaction-time="reactionTime"
            :selected-time="selectedTime"
            @retry="onRetry"
          />
        </Transition>

        <!-- Surprise overlay (rendered outside transition to always be on top) -->
        <SurpriseEvent v-if="state === 'surprise'" @release="onSurpriseRelease" />
      </div>
    </main>

    <!-- Footer -->
    <footer
      class="absolute bottom-0 left-0 right-0 px-4 py-3 flex items-center justify-center gap-3 border-t border-border-default"
    >
      <span class="font-display text-xs tracking-widest text-text-dim uppercase">
        Doctor Le Clinic · by
        <a
          :href="meta.facebook"
          target="_blank"
          rel="noopener noreferrer"
          class="text-accent-coral hover:underline transition-colors"
          >{{ meta.author }}</a
        >
      </span>
    </footer>
  </div>
</template>

<style scoped>
.screen-enter-active,
.screen-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}
.screen-enter-from {
  opacity: 0;
  transform: translateY(16px);
}
.screen-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}
</style>
