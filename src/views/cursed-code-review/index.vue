<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useHead } from '@unhead/vue'
import { Icon } from '@iconify/vue'
import { useIntervalFn } from '@vueuse/core'
import type { GameState, Bug } from './types'
import { SNIPPETS } from './data/snippets'
import GlitchEditor from './components/GlitchEditor.vue'
import metaData from './meta'

useHead({
  title: `${metaData.name} - Vibe Coding`,
  meta: [{ name: 'description', content: metaData.description }],
})

// Audio effects (using high-pitched glitchy placeholders or browser beeps)
const playGlitchSound = () => {
  // Simple check to avoid crashing in environments without Audio
  if (typeof window !== 'undefined' && 'AudioContext' in window) {
    const ctx = new (
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    )()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.setValueAtTime(Math.random() * 400 + 100, ctx.currentTime)
    gain.gain.setValueAtTime(0.1, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.1)
  }
}

const state = reactive<GameState>({
  score: 0,
  currentSnippetIdx: 0,
  foundBugIds: [],
  stability: 100,
  timeRemaining: 0,
  status: 'start',
  isGlitching: false,
})

const safeMode = ref(false)
const lastFoundBug = ref<Bug | null>(null)

const currentSnippet = computed(() => SNIPPETS[state.currentSnippetIdx]!)
const isMissionComplete = computed(
  () => state.foundBugIds.length >= currentSnippet.value.minBugsToPass,
)

const { pause, resume } = useIntervalFn(() => {
  if (state.status === 'playing') {
    state.timeRemaining--

    // Random glitching based on instability
    if (Math.random() > state.stability / 100) {
      triggerGlitch()
    }

    if (state.timeRemaining <= 0) {
      failSnippet()
    }
  }
}, 1000)

const triggerGlitch = () => {
  state.isGlitching = true
  playGlitchSound()
  setTimeout(
    () => {
      state.isGlitching = false
    },
    200 + Math.random() * 500,
  )
}

const startLevel = (idx: number) => {
  state.currentSnippetIdx = idx
  state.foundBugIds = []
  state.timeRemaining = currentSnippet.value.timeLimit
  state.status = 'playing'
  state.stability = 100
  lastFoundBug.value = null
  resume()
}

const handleBugClick = (bug: Bug) => {
  if (state.foundBugIds.includes(bug.id)) {
    lastFoundBug.value = bug
    return
  }

  state.foundBugIds.push(bug.id)
  state.score += bug.severity * 10
  lastFoundBug.value = bug
}

const finishReview = () => {
  if (state.currentSnippetIdx < SNIPPETS.length - 1) {
    state.status = 'reviewing'
  } else {
    state.status = 'success'
  }
  pause()
}

const handleMissClick = () => {
  state.stability -= 15
  triggerGlitch()
  if (state.stability <= 0) {
    failSnippet()
  }
}

const failSnippet = () => {
  state.status = 'failed'
  pause()
}

const nextLevel = () => {
  if (state.currentSnippetIdx < SNIPPETS.length - 1) {
    startLevel(state.currentSnippetIdx + 1)
  }
}

const resetGame = () => {
  state.score = 0
  startLevel(0)
}

onMounted(() => {
  pause() // Don't start until 'Bắt đầu' is clicked
})
</script>

<template>
  <div
    class="min-h-screen bg-black text-accent-coral font-body relative overflow-hidden flex flex-col"
  >
    <!-- Screen Flicker Effect -->
    <div
      v-if="!safeMode"
      class="absolute inset-0 pointer-events-none z-50 animate-flicker opacity-[0.015] bg-white"
    ></div>

    <div class="flex-1 max-w-5xl mx-auto w-full px-6 py-10 flex flex-col relative z-10">
      <!-- HUD -->
      <header class="flex justify-between items-start mb-12 border-b border-accent-coral/30 pb-6">
        <div class="animate-fade-up">
          <div
            class="flex items-center gap-2 text-accent-sky font-display text-xs tracking-[0.4em] mb-2 uppercase"
          >
            <Icon icon="lucide:terminal" class="size-4" />
            System Status: {{ state.status.toUpperCase() }}
          </div>
          <h1
            class="font-display text-4xl font-black italic tracking-tighter uppercase glitch-text"
            :data-text="metaData.name"
          >
            {{ metaData.name }}
          </h1>
        </div>

        <div class="flex items-center gap-10">
          <!-- Safe Mode Toggle -->
          <button
            @click="safeMode = !safeMode"
            class="flex items-center gap-2 px-3 py-1.5 border transition-all text-[9px] font-display uppercase tracking-widest"
            :class="
              safeMode
                ? 'border-accent-sky text-accent-sky bg-accent-sky/5'
                : 'border-white/10 text-text-dim hover:border-white/30'
            "
          >
            <Icon :icon="safeMode ? 'lucide:eye' : 'lucide:eye-off'" class="size-3" />
            {{ safeMode ? 'Safe Mode: ON' : 'Comfort Mode' }}
          </button>

          <!-- Score -->
          <div class="text-right">
            <div class="text-[10px] text-text-dim uppercase tracking-widest font-display mb-1">
              Reputation
            </div>
            <div class="text-3xl font-display font-bold text-accent-sky">
              {{ state.score.toString().padStart(5, '0') }}
            </div>
          </div>

          <!-- Stability Meter -->
          <div class="w-48 text-right space-y-1">
            <div class="flex justify-between text-[10px] font-display tracking-widest uppercase">
              <span>Server Stability</span>
              <span
                :class="
                  state.stability < 30 ? 'text-accent-coral animate-pulse' : 'text-accent-sky'
                "
                >{{ state.stability }}%</span
              >
            </div>
            <div class="h-1 bg-white/10 relative overflow-hidden border border-white/5">
              <div
                class="absolute inset-y-0 left-0 bg-accent-coral transition-all duration-300"
                :style="{ width: `${state.stability}%` }"
              ></div>
            </div>
          </div>

          <RouterLink
            to="/"
            class="p-3 border border-white/10 hover:border-accent-sky text-text-dim hover:text-accent-sky transition-all"
          >
            <Icon icon="lucide:home" class="size-5" />
          </RouterLink>
        </div>
      </header>

      <!-- Main Game Area -->
      <main class="flex-1 flex flex-col gap-8 relative">
        <div
          v-if="state.status === 'start'"
          class="flex-1 flex flex-col items-center justify-center text-center space-y-8 animate-fade-up"
        >
          <div
            class="size-24 border-2 border-accent-coral flex items-center justify-center animate-glitch-slow shadow-[0_0_30px_rgba(255,107,74,0.3)]"
          >
            <Icon icon="lucide:skull" class="size-12" />
          </div>
          <div class="space-y-4 max-w-md">
            <h2 class="text-2xl font-display font-bold uppercase tracking-widest">
              Đừng để server nổ...
            </h2>
            <p class="text-sm text-text-secondary leading-relaxed">
              Bạn là Senior Dev trực ca đêm. Đồ án của Junior đang đầy lỗi nghiêm trọng. Hãy soi ra
              các lỗi (Bug Smells) để cứu vãn hệ thống. Click trượt sẽ làm server tệ hơn.
            </p>
          </div>
          <button
            @click="startLevel(0)"
            class="px-12 py-4 bg-accent-coral text-black font-display font-black uppercase tracking-widest hover:bg-white transition-all shadow-[0_0_50px_rgba(255,107,74,0.4)]"
          >
            Chấp nhận Review
          </button>
        </div>

        <div
          v-else-if="state.status === 'playing' || state.status === 'reviewing'"
          class="flex-1 flex flex-col gap-6 animate-fade-up"
        >
          <div class="flex justify-between items-end">
            <div>
              <div class="text-[10px] text-accent-sky font-mono uppercase mb-1">
                Snippet {{ state.currentSnippetIdx + 1 }}/{{ SNIPPETS.length }}
              </div>
              <h3 class="text-xl font-display font-bold uppercase italic text-white">
                {{ currentSnippet.title }}
              </h3>
            </div>
            <div
              class="text-4xl font-display font-black"
              :class="state.timeRemaining < 10 ? 'text-accent-coral animate-pulse' : 'text-white'"
            >
              {{ Math.max(0, state.timeRemaining) }}s
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            <div class="lg:col-span-3">
              <GlitchEditor
                :code="currentSnippet.code"
                :bugs="currentSnippet.bugs"
                :found-bug-ids="state.foundBugIds"
                :is-glitching="state.isGlitching"
                :safe-mode="safeMode"
                @bug-click="handleBugClick"
                @miss-click="handleMissClick"
              />
            </div>

            <!-- Senior's Commentary -->
            <aside class="space-y-4">
              <div
                class="border border-accent-sky/20 bg-accent-sky/5 p-4 animate-fade-up min-h-[300px] flex flex-col group"
              >
                <div
                  class="flex items-center gap-2 text-[10px] font-display text-accent-sky uppercase tracking-widest mb-4"
                >
                  <Icon icon="lucide:message-square" class="size-3" />
                  Senior's Review
                </div>

                <div v-if="lastFoundBug" class="space-y-4 flex-1">
                  <div class="space-y-1">
                    <div class="text-[9px] text-text-dim uppercase">Issue Located</div>
                    <div class="text-xs font-bold text-accent-coral">
                      {{ lastFoundBug.description }}
                    </div>
                  </div>

                  <div class="space-y-1">
                    <div class="text-[9px] text-text-dim uppercase">Severity</div>
                    <div class="flex gap-1">
                      <div
                        v-for="i in 5"
                        :key="i"
                        class="h-1 flex-1"
                        :class="i <= lastFoundBug.severity / 2 ? 'bg-accent-coral' : 'bg-white/10'"
                      ></div>
                    </div>
                  </div>

                  <div
                    class="pt-4 border-t border-white/5 text-xs text-text-secondary leading-relaxed italic italic-quotes"
                  >
                    "{{ lastFoundBug.explanation }}"
                  </div>
                </div>

                <div
                  v-else
                  class="flex-1 flex flex-col items-center justify-center text-center opacity-30 select-none"
                >
                  <Icon icon="lucide:search" class="size-8 mb-4" />
                  <p class="text-[10px] uppercase tracking-tighter">
                    Click on problematic lines<br />to add comments
                  </p>
                </div>

                <!-- Mission Complete Action -->
                <div
                  v-if="isMissionComplete"
                  class="mt-6 pt-6 border-t border-accent-sky/30 space-y-3 animate-fade-up"
                >
                  <div
                    class="flex items-center gap-2 text-accent-sky text-[10px] uppercase font-bold"
                  >
                    <Icon icon="lucide:check-circle" class="size-3" />
                    Review Goal Met
                  </div>
                  <button
                    @click="finishReview"
                    class="w-full py-3 bg-accent-sky text-black font-display font-black uppercase text-[10px] tracking-widest hover:bg-white transition-all shadow-[0_0_20px_rgba(56,189,248,0.3)]"
                  >
                    Finish Review
                  </button>
                </div>

                <div class="mt-auto pt-4 flex items-center gap-2 text-[9px] text-text-dim">
                  <span class="animate-pulse">●</span> LIVE_REVIEW_SESSION
                </div>
              </div>
            </aside>
          </div>

          <div
            class="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest"
          >
            <div class="flex gap-4">
              <span
                >Bugs Detected: {{ state.foundBugIds.length }} /
                {{ currentSnippet.minBugsToPass }} Required</span
              >
            </div>
            <div v-if="state.status === 'reviewing'" class="animate-pulse text-accent-sky">
              ✓ Review Completed. Press Space or Click Next...
            </div>
          </div>
        </div>

        <!-- Result Overlays -->
        <Transition
          enter-active-class="transition duration-500 ease-out"
          enter-from-class="opacity-0 scale-95"
        >
          <div
            v-if="state.status === 'reviewing'"
            class="absolute inset-x-0 top-1/2 -translate-y-1/2 z-50 p-10 bg-bg-surface border border-accent-sky shadow-[0_0_100px_rgba(56,189,248,0.2)] text-center space-y-6"
          >
            <div class="flex justify-center">
              <Icon icon="lucide:check-circle" class="size-16 text-accent-sky" />
            </div>
            <h2
              class="text-3xl font-display font-black italic uppercase tracking-tighter text-white"
            >
              Xong một nợ!
            </h2>
            <p class="text-sm text-text-secondary">
              Bạn đã dọn dẹp đống rác này. Nhưng cơn ác mộng vẫn tiếp diễn...
            </p>
            <button
              @click="nextLevel"
              class="px-10 py-3 bg-accent-sky text-black font-display font-black uppercase tracking-widest hover:bg-white transition-all"
            >
              Tiếp tục Review
            </button>
          </div>
        </Transition>

        <Transition
          enter-active-class="transition duration-700 ease-out"
          enter-from-class="opacity-0 translate-y-20"
        >
          <div
            v-if="state.status === 'failed' || state.status === 'success'"
            class="absolute inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center text-center p-10 space-y-10"
          >
            <div
              class="size-32 border-4 flex items-center justify-center rotate-45"
              :class="
                state.status === 'success'
                  ? 'border-accent-sky text-accent-sky shadow-[0_0_50px_rgba(56,189,248,0.5)]'
                  : 'border-accent-coral text-accent-coral shadow-[0_0_50px_rgba(255,107,74,0.5)]'
              "
            >
              <Icon
                :icon="state.status === 'success' ? 'lucide:award' : 'lucide:bomb'"
                class="size-16 -rotate-45"
              />
            </div>

            <div class="space-y-4">
              <h2
                class="text-6xl font-display font-black italic uppercase tracking-tighter glitch-text"
                :data-text="state.status === 'success' ? 'GIẢI CỨU THÀNH CÔNG' : 'HỆ THỐNG SỤP ĐỔ'"
              >
                {{ state.status === 'success' ? 'Hết ca trực!' : 'Bị đuổi việc!' }}
              </h2>
              <p class="text-text-secondary max-w-md mx-auto">
                {{
                  state.status === 'success'
                    ? 'Bạn đã sống sót qua đêm nay. Server vẫn ổn định... cho đến ngày mai.'
                    : 'Senior thở dài: "Tôi biết ngay mà...". Server đã nổ tung.'
                }}
              </p>
            </div>

            <div class="space-y-2">
              <div class="text-[10px] uppercase font-display tracking-widest text-text-dim">
                Final Reputation
              </div>
              <div class="text-5xl font-display font-bold text-white">{{ state.score }}</div>
            </div>

            <button
              @click="resetGame"
              class="px-12 py-4 border-2 border-accent-coral text-accent-coral font-display font-black uppercase tracking-widest hover:bg-accent-coral hover:text-black transition-all"
            >
              Thử lại lần nữa
            </button>
          </div>
        </Transition>
      </main>

      <!-- Footer Info -->
      <footer
        class="mt-8 flex justify-between items-center text-[9px] font-mono text-text-dim uppercase tracking-[0.3em]"
      >
        <div>Terminal ID: CSR-99</div>
        <div class="flex gap-6">
          <span class="flex items-center gap-1"
            ><Icon icon="lucide:activity" class="size-3" /> Core: Active</span
          >
          <span class="flex items-center gap-1"
            ><Icon icon="lucide:shield" class="size-3" /> Firewall: Bypassed</span
          >
        </div>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.glitch-text {
  position: relative;
}

.glitch-text::before,
.glitch-text::after {
  content: attr(data-text);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: black;
}

.glitch-text::before {
  left: 2px;
  text-shadow: -2px 0 var(--color-accent-sky);
  clip: rect(44px, 450px, 56px, 0);
  animation: glitch-anim 5s infinite linear alternate-reverse;
}

.glitch-text::after {
  left: -2px;
  text-shadow: 2px 0 var(--color-accent-coral);
  clip: rect(44px, 450px, 56px, 0);
  animation: glitch-anim-2 5s infinite linear alternate-reverse;
}

@keyframes glitch-anim {
  0% {
    clip: rect(31px, 9999px, 94px, 0);
  }
  20% {
    clip: rect(62px, 9999px, 42px, 0);
  }
  40% {
    clip: rect(82px, 9999px, 78px, 0);
  }
  60% {
    clip: rect(56px, 9999px, 13px, 0);
  }
  80% {
    clip: rect(2px, 9999px, 84px, 0);
  }
  100% {
    clip: rect(92px, 9999px, 20px, 0);
  }
}

@keyframes glitch-anim-2 {
  0% {
    clip: rect(65px, 9999px, 100px, 0);
  }
  20% {
    clip: rect(52px, 9999px, 45px, 0);
  }
  40% {
    clip: rect(10px, 9999px, 70px, 0);
  }
  60% {
    clip: rect(80px, 9999px, 15px, 0);
  }
  80% {
    clip: rect(40px, 9999px, 60px, 0);
  }
  100% {
    clip: rect(5px, 9999px, 90px, 0);
  }
}

.animate-flicker {
  animation: flicker 0.4s infinite;
}

@keyframes flicker {
  0% {
    opacity: 0.02;
  }
  25% {
    opacity: 0.01;
  }
  50% {
    opacity: 0.03;
  }
  75% {
    opacity: 0.01;
  }
  100% {
    opacity: 0.02;
  }
}

@keyframes border-glitch {
  0% {
    border-color: var(--color-accent-coral);
  }
  33% {
    border-color: var(--color-accent-sky);
  }
  66% {
    border-color: white;
  }
  100% {
    border-color: var(--color-accent-coral);
  }
}

.animate-glitch-slow {
  animation: glitch-slow 3s infinite;
}

@keyframes glitch-slow {
  0% {
    transform: translate(0);
  }
  1% {
    transform: translate(-2px, 2px);
  }
  2% {
    transform: translate(2px, -2px);
  }
  3% {
    transform: translate(0);
  }
  100% {
    transform: translate(0);
  }
}
</style>
