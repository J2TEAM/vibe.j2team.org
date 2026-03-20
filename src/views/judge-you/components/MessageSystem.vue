<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useBehaviorStore } from '../useBehaviorStore'
import { useMouse, useWindowSize } from '@vueuse/core'

const store = useBehaviorStore()
const { x, y } = useMouse()
const { width, height } = useWindowSize()

const currentMessage = ref('...')
const displayedMessage = ref('')
let typeInterval: number | null = null

// Self-doubt delay
let delayTimer: number | null = null
const isTyping = ref(false)

watch(
  () => [
    store.clicks,
    store.mouseMoves,
    store.idleTime,
    store.phase,
    store.isRapidClicking,
    store.isFastMoving,
    store.hasFollowedInstruction,
    store.hasEscaped,
    store.isMobileTapSpam,
  ],
  ([clicks, moves, idle, phase, rapid, fastMoving, followed, escaped, mobileSpam]) => {
    const p = phase as number
    const i = idle as number
    const c = clicks as number
    const m = moves as number

    let nextMsg = currentMessage.value

    const isAggressive = store.personality === 'aggressive'
    const isSarcastic = store.personality === 'sarcastic'

    if (escaped || p === 9) {
      nextMsg = 'This page is not judging you.\nYou are revealing yourself.'
    } else if (p === 8) {
      nextMsg = 'This is the end.\nThank you for participating.'
    } else if (p === 7) {
      nextMsg = 'Everything is falling apart. Just like your focus.'
    } else if (p === 6) {
      if (followed) nextMsg = 'Good. You listen. Very obedient.'
      else nextMsg = 'Try clicking the top right corner. I am waiting.'
    } else if (mobileSpam) {
      nextMsg = "You're getting frustrated tapping the screen?"
    } else if (rapid) {
      nextMsg = isAggressive
        ? 'STOP CLICKING!'
        : isSarcastic
          ? 'Click click click... is that all you can do?'
          : "You're panicking, aren't you?"
    } else if (fastMoving && p > 2) {
      nextMsg = isAggressive ? 'Why are you running?' : "You're nervous."
    } else if (p === 5) {
      if (store.totalTime > 120000)
        nextMsg = isSarcastic
          ? "Are you sure that's what you meant?"
          : "You're taking too long. Why are you still here?"
      else if (i > 15000) nextMsg = isAggressive ? 'DO SOMETHING!' : 'Silence says a lot.'
      else nextMsg = 'The pressure is building.'
    } else if (p === 4) {
      if (i > 15000) nextMsg = 'Are you waiting for permission?'
      else if (m > 1500) nextMsg = "Are you sure that's what you meant?"
      else nextMsg = "Why do you keep clicking? It won't help."
    } else if (p === 3) {
      if (store.totalTime > 45000) nextMsg = "You're taking too long. Time is slipping."
      else if (i > 8000)
        nextMsg = isSarcastic ? 'Did you fall asleep?' : 'Still there? Or just frozen?'
      else if (m > 800) nextMsg = "Searching for a meaning that isn't there."
      else if (c > 15) nextMsg = 'Fascinating behavior...'
    } else if (p === 2) {
      if (c > 10) nextMsg = 'You seem impatient.'
      else if (i > 5000) nextMsg = "You're hesitating."
      else if (m > 200) nextMsg = "You're searching for something."
    } else if (p === 1) {
      if (i > 3000) nextMsg = 'Are you going to do something?'
      else if (c > 2) nextMsg = 'Interesting that you clicked.'
      else {
        if (store.visitCount > 1) {
          if (store.lastDuration < 10000) nextMsg = "You didn't stay long last time."
          else nextMsg = isSarcastic ? 'Oh, you came back. How desperate.' : 'You came back...'
        } else {
          nextMsg = 'We are observing how you interact...'
        }
      }
    }

    if (nextMsg !== currentMessage.value) {
      // Simulate self-doubt or network delay
      if (delayTimer) clearTimeout(delayTimer)
      const randomDelay = Math.random() < 0.3 ? 1500 : 300 // 30% chance of a long pause
      delayTimer = window.setTimeout(() => {
        currentMessage.value = nextMsg
      }, randomDelay)
    }
  },
  { immediate: true },
)

// Typing effect
watch(
  currentMessage,
  (newVal) => {
    if (typeInterval) clearInterval(typeInterval)
    displayedMessage.value = ''
    let idx = 0
    const speed = store.phase >= 4 ? 25 : 45
    isTyping.value = true
    typeInterval = window.setInterval(() => {
      if (idx < newVal.length) {
        displayedMessage.value += newVal.charAt(idx)
        idx++
      } else {
        isTyping.value = false
        if (typeInterval) clearInterval(typeInterval)
      }
    }, speed)
  },
  { immediate: true },
)

// Floating Position Logic
// Instead of purely cursor-based, randomly detach in later phases
const messagePos = computed(() => {
  if (store.phase >= 7) {
    // Drift towards random edges
    return { x: width.value * 0.1, y: height.value * 0.8 }
  }
  return {
    x: Math.min(x.value + 20, width.value - 250),
    y: Math.min(y.value + 20, height.value - 100),
  }
})

function resetPage() {
  window.location.reload()
}
</script>

<template>
  <div class="fixed inset-0 pointer-events-none z-50 overflow-hidden text-text-primary">
    <!-- Prediction Fake AI element -->
    <div
      v-if="store.predictionTarget.show"
      class="fixed w-32 h-32 border-4 border-dashed border-accent-amber/60 flex items-center justify-center transition-all duration-300 ease-out z-[40] judge-predict"
      :style="{
        left: store.predictionTarget.x - 64 + 'px',
        top: store.predictionTarget.y - 64 + 'px',
      }"
    >
      <span
        class="text-[10px] font-mono text-accent-amber uppercase tracking-[0.22em] opacity-70 absolute -top-7 whitespace-nowrap animate-pulse"
        >PREDICTED ZONE</span
      >
    </div>

    <Transition name="fade" mode="out-in">
      <div
        v-if="store.phase >= 9 || store.hasEscaped"
        class="absolute inset-0 flex flex-col items-center justify-center bg-black/95 pointer-events-auto z-[100] judge-reveal"
      >
        <div class="judge-reveal-panel max-w-3xl w-full mx-auto px-5 py-6 md:px-8 md:py-10">
          <div
            class="font-mono uppercase tracking-[0.22em] text-[11px] text-text-secondary flex items-center justify-between gap-3"
          >
            <span>FINAL SYSTEM MESSAGE</span>
            <span class="text-accent-coral">REVEAL</span>
          </div>

          <p
            class="mt-6 text-xl md:text-3xl font-mono text-text-primary tracking-[0.18em] leading-relaxed text-center whitespace-pre-wrap judge-reveal-text"
          >
            {{ displayedMessage }}
          </p>

          <button v-if="!isTyping" @click="resetPage" class="mt-10 judge-btn focus:outline-none">
            REFRESH
          </button>
        </div>
      </div>

      <div
        v-else-if="store.phase === 8"
        class="absolute inset-0 flex flex-col items-center justify-center bg-transparent z-[100] pointer-events-none transition-colors duration-[3s] bg-bg-deep/80"
      >
        <div class="judge-end-panel px-5 py-4">
          <p
            class="text-base md:text-xl font-mono text-text-primary uppercase tracking-[0.22em] animate-pulse-slow text-center"
          >
            {{ displayedMessage }}
          </p>
        </div>
      </div>

      <div v-else class="absolute inset-0">
        <!-- Floating pixel text (follows cursor early, drifts late) -->
        <div
          class="absolute max-w-[320px] judge-float transition-all duration-700 ease-out"
          :class="{
            'judge-float-sky': store.phase === 1,
            'judge-float-amber': store.phase === 2 || store.phase === 3,
            'judge-float-coral pixel-glitch': store.phase >= 4,
          }"
          :style="{ left: messagePos.x + 'px', top: messagePos.y + 'px' }"
        >
          <p
            class="font-mono text-[11px] uppercase tracking-[0.22em] leading-relaxed whitespace-pre-wrap"
            :class="{ 'opacity-60': isTyping }"
          >
            {{ displayedMessage }}<span class="judge-caret">_</span>
          </p>
        </div>

        <!-- Bottom dialogue box (game UI) -->
        <div class="fixed inset-x-0 bottom-0 z-[90] pb-4 px-4">
          <div class="mx-auto max-w-5xl judge-dialog">
            <div class="judge-dialog-head">
              <span class="text-accent-sky">//</span>
              <span class="ml-2">SYSTEM MESSAGE</span>
              <span class="ml-auto text-text-dim">{{
                store.phase < 4 ? 'CALIBRATING' : 'ANALYZING'
              }}</span>
            </div>

            <div class="judge-dialog-body">
              <p
                class="font-mono text-[12px] md:text-[13px] uppercase tracking-[0.22em] leading-relaxed whitespace-pre-wrap"
                :class="{ 'opacity-70': isTyping }"
              >
                {{ displayedMessage }}<span class="judge-caret">_</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 1.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.animate-pulse-slow {
  animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.judge-predict {
  background: color-mix(in srgb, var(--color-bg-deep) 35%, transparent);
  box-shadow: 6px 6px 0 rgb(0 0 0 / 0.35);
}

.judge-reveal {
  background: repeating-linear-gradient(
    to bottom,
    rgb(0 0 0 / 0.92) 0px,
    rgb(0 0 0 / 0.92) 10px,
    rgb(0 0 0 / 0.98) 11px
  );
}

.judge-reveal-panel {
  border: 6px solid var(--color-border-default);
  background: color-mix(in srgb, var(--color-bg-deep) 75%, black);
  box-shadow: 10px 10px 0 rgb(0 0 0 / 0.55);
}

.judge-reveal-text {
  text-shadow: 2px 2px 0 rgb(0 0 0 / 0.55);
}

.judge-end-panel {
  border: 4px solid var(--color-border-default);
  background: color-mix(in srgb, var(--color-bg-surface) 80%, transparent);
  box-shadow: 6px 6px 0 rgb(0 0 0 / 0.35);
}

.judge-float {
  border: 4px solid var(--color-border-default);
  background: color-mix(in srgb, var(--color-bg-surface) 88%, transparent);
  box-shadow: 6px 6px 0 rgb(0 0 0 / 0.4);
  padding: 0.75rem 0.75rem;
  animation: float-flicker 1.6s steps(2, end) infinite;
}

.judge-float-sky {
  border-left-color: var(--color-accent-sky);
}

.judge-float-amber {
  border-left-color: var(--color-accent-amber);
}

.judge-float-coral {
  border-left-color: var(--color-accent-coral);
}

.pixel-glitch {
  animation: pixel-glitch 0.26s steps(2, end) infinite;
}

@keyframes pixel-glitch {
  0% {
    transform: translate(0, 0);
    filter: contrast(1.05);
  }
  50% {
    transform: translate(1px, -1px);
    filter: contrast(1.25) saturate(1.15);
  }
  100% {
    transform: translate(-1px, 1px);
    filter: contrast(1.05);
  }
}

@keyframes float-flicker {
  0%,
  49% {
    opacity: 0.92;
  }
  50%,
  100% {
    opacity: 0.72;
  }
}

.judge-dialog {
  border: 6px solid var(--color-border-default);
  background: color-mix(in srgb, var(--color-bg-surface) 96%, transparent);
  box-shadow: 10px 10px 0 rgb(0 0 0 / 0.55);
}

.judge-dialog-head {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-bottom: 4px solid color-mix(in srgb, var(--color-border-default) 70%, transparent);
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
    monospace;
  text-transform: uppercase;
  letter-spacing: 0.22em;
  font-size: 11px;
}

.judge-dialog-body {
  padding: 0.9rem 1rem 1rem;
}

.judge-caret {
  display: inline-block;
  margin-left: 0.25rem;
  animation: caret-blink 0.9s steps(2, end) infinite;
}

@keyframes caret-blink {
  0%,
  49% {
    opacity: 1;
  }
  50%,
  100% {
    opacity: 0.15;
  }
}

.judge-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.25rem;
  border: 6px solid var(--color-border-default);
  background: var(--color-bg-surface);
  color: var(--color-text-primary);
  box-shadow: 8px 8px 0 rgb(0 0 0 / 0.55);
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
    monospace;
  text-transform: uppercase;
  letter-spacing: 0.22em;
  font-size: 11px;
  transition:
    transform 80ms steps(2, end),
    background 120ms steps(2, end),
    border-color 120ms steps(2, end),
    color 120ms steps(2, end);
}

.judge-btn:hover {
  background: var(--color-bg-elevated);
  border-color: var(--color-accent-coral);
}

.judge-btn:active {
  transform: translate(2px, 2px);
  box-shadow: 6px 6px 0 rgb(0 0 0 / 0.6);
}
</style>
