<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useMouse, useWindowSize } from '@vueuse/core'
import { useBehaviorStore } from '../useBehaviorStore'

const store = useBehaviorStore()
const { x, y } = useMouse()
const { width, height } = useWindowSize()

const currentMessage = ref('...')
const displayedMessage = ref('')
const isTyping = ref(false)

let typeInterval: number | null = null
let delayTimer: number | null = null
let targetMsg = '...'
let lastAmbientTime = 0

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

    let desiredMsg = targetMsg
    let isHighPriority = false

    const isAggressive = store.personality === 'aggressive'
    const isSarcastic = store.personality === 'sarcastic'

    if (escaped || p === 9) {
      desiredMsg = 'This page is not judging you.\nYou are revealing yourself.'
      isHighPriority = true
    } else if (p === 8) {
      desiredMsg = 'This is the end.\nThank you for participating.'
      isHighPriority = true
    } else if (p === 7) {
      desiredMsg = 'Everything is falling apart. Just like your focus.'
      isHighPriority = true
    } else if (p === 6 && followed) {
      desiredMsg = 'Good. You listen. Very obedient.'
      isHighPriority = true
    } else if (mobileSpam) {
      desiredMsg = "You're getting frustrated tapping the screen?"
      isHighPriority = true
    } else if (rapid) {
      desiredMsg = isAggressive
        ? 'STOP CLICKING!'
        : isSarcastic
          ? 'Click click click... is that all you can do?'
          : "You're panicking, aren't you?"
      isHighPriority = true
    } else if (fastMoving && p > 2) {
      desiredMsg = isAggressive ? 'Why are you running?' : "You're nervous."
      isHighPriority = true
    } else {
      let ambientMsg = targetMsg
      if (p === 6) {
        ambientMsg = 'Try clicking the top right corner. I am waiting.'
      } else if (p === 5) {
        if (store.totalTime > 120000) {
          ambientMsg = isSarcastic
            ? "Are you sure that's what you meant?"
            : "You're taking too long. Why are you still here?"
        } else if (i > 15000) {
          ambientMsg = isAggressive ? 'DO SOMETHING!' : 'Silence says a lot.'
        } else {
          ambientMsg = 'The pressure is building.'
        }
      } else if (p === 4) {
        if (i > 15000) ambientMsg = 'Are you waiting for permission?'
        else if (m > 1500) ambientMsg = "Are you sure that's what you meant?"
        else if (c > 30) ambientMsg = "Why do you keep clicking? It won't help."
        else ambientMsg = 'Observing tension...'
      } else if (p === 3) {
        if (store.totalTime > 45000) ambientMsg = "You're taking too long. Time is slipping."
        else if (i > 8000)
          ambientMsg = isSarcastic ? 'Did you fall asleep?' : 'Still there? Or just frozen?'
        else if (m > 800) ambientMsg = "Searching for a meaning that isn't there."
        else if (c > 15) ambientMsg = 'Fascinating behavior...'
        else ambientMsg = 'Judgment is passing.'
      } else if (p === 2) {
        if (c > 10) ambientMsg = 'You seem impatient.'
        else if (i > 5000) ambientMsg = "You're hesitating."
        else if (m > 200) ambientMsg = "You're searching for something."
        else ambientMsg = 'Gathering patterns...'
      } else if (p === 1) {
        if (i > 3000) ambientMsg = 'Are you going to do something?'
        else if (c > 2) ambientMsg = 'Interesting that you clicked.'
        else if (store.visitCount > 1) {
          if (store.lastDuration < 10000) ambientMsg = "You didn't stay long last time."
          else ambientMsg = isSarcastic ? 'Oh, you came back. How desperate.' : 'You came back...'
        } else {
          ambientMsg = 'We are observing how you interact...'
        }
      }
      desiredMsg = ambientMsg
    }

    const now = Date.now()
    if (desiredMsg !== targetMsg) {
      // Apply message only if high priority OR enough time has passed for ambient texts
      if (isHighPriority || now - lastAmbientTime > 3500) {
        targetMsg = desiredMsg
        if (!isHighPriority) lastAmbientTime = now

        if (delayTimer) clearTimeout(delayTimer)
        const randomDelay = Math.random() < 0.3 ? 1200 : 200
        delayTimer = window.setTimeout(() => {
          currentMessage.value = targetMsg
        }, randomDelay)
      }
    }
  },
  { immediate: true },
)

watch(
  currentMessage,
  (newValue) => {
    if (typeInterval) clearInterval(typeInterval)
    displayedMessage.value = ''
    let index = 0
    const speed = store.phase >= 4 ? 25 : 45
    isTyping.value = true

    typeInterval = window.setInterval(() => {
      if (index < newValue.length) {
        displayedMessage.value += newValue.charAt(index)
        index++
      } else {
        isTyping.value = false
        if (typeInterval) clearInterval(typeInterval)
      }
    }, speed)
  },
  { immediate: true },
)

const messagePos = computed(() => {
  if (store.phase >= 7) {
    return { x: width.value * 0.12, y: height.value * 0.74 }
  }

  return {
    x: Math.min(x.value + 24, width.value - 280),
    y: Math.min(y.value + 26, height.value - 140),
  }
})

const floatStyle = computed(() => {
  const widthSafe = Math.max(width.value, 1)
  const heightSafe = Math.max(height.value, 1)
  const offsetX = (x.value / widthSafe - 0.5) * 14
  const offsetY = (y.value / heightSafe - 0.5) * 10

  return {
    left: `${messagePos.value.x}px`,
    top: `${messagePos.value.y}px`,
    transform: `translate3d(${offsetX}px, ${offsetY}px, 0)`,
  }
})

const floatToneClass = computed(() => {
  if (store.phase >= 4) return 'judge-float-coral'
  if (store.phase >= 2) return 'judge-float-amber'
  return 'judge-float-sky'
})

function resetPage() {
  window.location.reload()
}
</script>

<template>
  <div class="fixed inset-0 z-50 overflow-hidden pointer-events-none text-text-primary">
    <div
      v-if="store.predictionTarget.show"
      class="judge-predict fixed z-[40]"
      :style="{
        left: `${store.predictionTarget.x - 48}px`,
        top: `${store.predictionTarget.y - 48}px`,
      }"
    >
      <span class="judge-predict-label">predicted zone</span>
    </div>

    <Transition name="fade" mode="out-in">
      <div
        v-if="store.phase >= 9 || store.hasEscaped"
        class="judge-reveal absolute inset-0 z-[100] flex items-center justify-center pointer-events-auto"
      >
        <div class="judge-reveal-noise"></div>

        <div class="judge-reveal-copy">
          <p class="judge-reveal-kicker">
            <span class="text-accent-coral">//</span>
            <span>FINAL SYSTEM MESSAGE</span>
          </p>

          <p class="judge-reveal-text whitespace-pre-wrap">
            {{ displayedMessage }}
          </p>

          <button v-if="!isTyping" @click="resetPage" class="judge-reset focus:outline-none">
            Refresh
          </button>
        </div>
      </div>

      <div
        v-else-if="store.phase === 8"
        class="absolute inset-0 z-[100] flex items-center justify-center"
      >
        <div class="judge-end-message">
          <p class="judge-end-kicker">
            <span class="text-accent-coral">//</span>
            <span>TERMINATION</span>
          </p>
          <p class="judge-end-text whitespace-pre-wrap">
            {{ displayedMessage }}
          </p>
        </div>
      </div>

      <div v-else class="absolute inset-0">
        <div class="judge-float" :class="floatToneClass" :style="floatStyle">
          <div class="judge-float-grain"></div>
          <p class="judge-float-label">
            <span class="text-accent-coral">//</span>
            <span>{{ store.phase < 4 ? 'system thought' : 'active reading' }}</span>
          </p>
          <p class="judge-float-text whitespace-pre-wrap" :class="{ 'opacity-65': isTyping }">
            {{ displayedMessage }}<span class="judge-caret">_</span>
          </p>
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

.judge-predict {
  width: 96px;
  height: 96px;
  border: 1px solid color-mix(in srgb, var(--color-accent-amber) 45%, transparent);
  background:
    radial-gradient(circle at center, rgb(255 184 48 / 0.18), transparent 65%),
    repeating-linear-gradient(
      90deg,
      rgb(255 255 255 / 0.05) 0px,
      rgb(255 255 255 / 0.05) 8px,
      transparent 9px,
      transparent 18px
    );
  box-shadow:
    0 0 0 1px rgb(255 255 255 / 0.04),
    0 0 36px rgb(255 184 48 / 0.18);
  animation: predict-pulse 1.2s ease-in-out infinite;
}

.judge-predict-label {
  position: absolute;
  left: 50%;
  top: -1.7rem;
  transform: translateX(-50%);
  color: color-mix(in srgb, var(--color-accent-amber) 84%, transparent);
  font-family: 'Anybody', sans-serif;
  font-size: 0.58rem;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  white-space: nowrap;
}

.judge-float {
  position: absolute;
  width: min(20rem, calc(100vw - 2.5rem));
  padding: 1rem 1rem 1.05rem;
  border: 1px solid rgb(255 255 255 / 0.08);
  background: linear-gradient(135deg, rgb(255 255 255 / 0.07), rgb(15 25 35 / 0.38));
  backdrop-filter: blur(14px);
  box-shadow:
    0 0 0 1px rgb(255 255 255 / 0.03),
    0 22px 70px rgb(0 0 0 / 0.28);
  overflow: hidden;
  transition:
    transform 700ms ease,
    border-color 500ms ease,
    box-shadow 500ms ease;
}

.judge-float-grain {
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(
      90deg,
      rgb(255 255 255 / 0.02) 0px,
      rgb(255 255 255 / 0.02) 7px,
      transparent 8px,
      transparent 16px
    ),
    radial-gradient(circle at center, rgb(255 255 255 / 0.06), transparent 62%);
  opacity: 0.45;
  mix-blend-mode: screen;
}

.judge-float-sky {
  border-color: color-mix(in srgb, var(--color-accent-sky) 28%, transparent);
}

.judge-float-amber {
  border-color: color-mix(in srgb, var(--color-accent-amber) 30%, transparent);
}

.judge-float-coral {
  border-color: color-mix(in srgb, var(--color-accent-coral) 34%, transparent);
  animation: float-glitch 0.3s steps(2, end) infinite;
}

.judge-float-label {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  color: var(--color-text-secondary);
  font-family: 'Anybody', sans-serif;
  font-size: 0.62rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
}

.judge-float-text {
  position: relative;
  margin-top: 0.8rem;
  color: var(--color-text-primary);
  font-family: 'Anybody', sans-serif;
  font-size: 0.83rem;
  line-height: 1.8;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  text-shadow: 0 0 22px rgb(255 255 255 / 0.04);
}

.judge-caret {
  display: inline-block;
  margin-left: 0.25rem;
  animation: caret-blink 0.9s steps(2, end) infinite;
}

.judge-reveal {
  background:
    radial-gradient(circle at center, rgb(255 255 255 / 0.04), transparent 42%),
    linear-gradient(180deg, rgb(0 0 0 / 0.84), rgb(0 0 0 / 0.96));
}

.judge-reveal-noise {
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(
      0deg,
      rgb(255 255 255 / 0.03) 0px,
      rgb(255 255 255 / 0.03) 6px,
      transparent 7px,
      transparent 12px
    ),
    radial-gradient(circle at center, rgb(255 255 255 / 0.04), transparent 60%);
  opacity: 0.45;
  animation: dissolve-breathe 5s ease-in-out infinite;
}

.judge-reveal-copy {
  position: relative;
  display: flex;
  width: min(42rem, calc(100vw - 2.5rem));
  flex-direction: column;
  align-items: center;
  gap: 1.2rem;
  padding: 1.8rem 1.4rem 2rem;
  text-align: center;
}

.judge-reveal-kicker,
.judge-end-kicker {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  color: var(--color-text-secondary);
  font-family: 'Anybody', sans-serif;
  font-size: 0.64rem;
  letter-spacing: 0.34em;
  text-transform: uppercase;
}

.judge-reveal-text {
  color: var(--color-text-primary);
  font-family: 'Anybody', sans-serif;
  font-size: clamp(1.45rem, 4vw, 3rem);
  line-height: 1.45;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  text-shadow: 0 0 36px rgb(255 255 255 / 0.06);
}

.judge-reset {
  border: 1px solid rgb(255 255 255 / 0.12);
  background: rgb(255 255 255 / 0.05);
  padding: 0.8rem 1.2rem;
  color: var(--color-text-primary);
  font-family: 'Anybody', sans-serif;
  font-size: 0.64rem;
  letter-spacing: 0.34em;
  text-transform: uppercase;
  transition:
    border-color 220ms ease,
    background 220ms ease,
    transform 220ms ease;
}

.judge-reset:hover {
  border-color: color-mix(in srgb, var(--color-accent-coral) 45%, transparent);
  background: rgb(255 255 255 / 0.08);
  transform: translateY(-1px);
}

.judge-end-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  text-align: center;
}

.judge-end-text {
  color: var(--color-text-primary);
  font-family: 'Anybody', sans-serif;
  font-size: clamp(1rem, 3vw, 1.6rem);
  line-height: 1.7;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  animation: dissolve-breathe 4s ease-in-out infinite;
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

@keyframes predict-pulse {
  0%,
  100% {
    opacity: 0.55;
    transform: scale(1);
  }
  50% {
    opacity: 0.95;
    transform: scale(1.05);
  }
}

@keyframes float-glitch {
  0% {
    transform: translate(0, 0);
    filter: contrast(1.04);
  }
  50% {
    transform: translate(1px, -1px);
    filter: contrast(1.18) saturate(1.08);
  }
  100% {
    transform: translate(-1px, 1px);
    filter: contrast(1.04);
  }
}

@keyframes dissolve-breathe {
  0%,
  100% {
    opacity: 0.35;
    filter: blur(0);
  }
  50% {
    opacity: 0.62;
    filter: blur(0.8px);
  }
}

@media (max-width: 767px) {
  .judge-float {
    padding: 0.85rem 0.85rem 0.9rem;
  }

  .judge-float-text {
    font-size: 0.72rem;
    letter-spacing: 0.14em;
  }

  .judge-whisper-text {
    font-size: 0.58rem;
    letter-spacing: 0.26em;
  }

  .judge-predict {
    width: 82px;
    height: 82px;
  }
}
</style>
