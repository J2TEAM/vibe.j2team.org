<script setup lang="ts">
import { ref, computed, nextTick, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import SpinWheelGame from './components/SpinWheelGame.vue'
import DuckRaceGame from './components/DuckRaceGame.vue'
import CardShuffleGame from './components/CardShuffleGame.vue'
import KongBeautyGame from './components/KongBeautyGame.vue'
import { MAX_NAMES, AVAILABLE_GAMES } from './types'

// ── Name input state ───────────────────────────────────
const rawInput = ref('')

const names = computed<string[]>(() => {
  const text = rawInput.value
  const sep = text.includes(',') ? ',' : '\n'
  const items = text.split(sep)
  const unique = [...new Set(items.map((s) => s.trim()).filter((s) => s.length > 0))]
  return unique.slice(0, MAX_NAMES)
})

const isAtMax = computed(() => names.value.length >= MAX_NAMES)

function clearNames(): void {
  rawInput.value = ''
  winner.value = null
  showWinner.value = false
}

// ── Game / winner state ────────────────────────────────
// Pick a random game once per page load
const activeGameId = ref(AVAILABLE_GAMES[Math.floor(Math.random() * AVAILABLE_GAMES.length)]!.id)
const activeGame = computed(
  () => AVAILABLE_GAMES.find((g) => g.id === activeGameId.value) ?? AVAILABLE_GAMES[0]!,
)

const spinWheelRef = ref<InstanceType<typeof SpinWheelGame> | null>(null)
const duckRaceRef = ref<InstanceType<typeof DuckRaceGame> | null>(null)
const cardShuffleRef = ref<InstanceType<typeof CardShuffleGame> | null>(null)
const kongBeautyRef = ref<InstanceType<typeof KongBeautyGame> | null>(null)
const winner = ref<string | null>(null)
const showWinner = ref(false)

function handleWinner(name: string): void {
  winner.value = name
  showWinner.value = true
  startConfetti()
}

function closeWinner(): void {
  showWinner.value = false
}

function spinAgain(): void {
  showWinner.value = false
  nextTick(() => {
    if (activeGameId.value === 'spin-wheel') {
      spinWheelRef.value?.spin()
    } else if (activeGameId.value === 'duck-race') {
      duckRaceRef.value?.spin()
    } else if (activeGameId.value === 'card-shuffle') {
      cardShuffleRef.value?.spin()
    } else if (activeGameId.value === 'kong-beauty') {
      kongBeautyRef.value?.spin()
    }
  })
}

// ── Confetti ───────────────────────────────────────────
const confettiCanvas = ref<HTMLCanvasElement | null>(null)
let confettiAnimId = 0

const CONFETTI_COLORS = [
  '#FF6B4A',
  '#FFB830',
  '#38BDF8',
  '#E63946',
  '#2A9D8F',
  '#6A4C93',
  '#F77F00',
  '#06D6A0',
  '#EF476F',
  '#118AB2',
]

interface ConfettiParticle {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  size: number
  rot: number
  rotSpeed: number
  opacity: number
  shape: number
}

function createConfetti(): ConfettiParticle[] {
  return Array.from({ length: 130 }, () => ({
    x: Math.random() * window.innerWidth,
    y: -20 - Math.random() * 160,
    vx: (Math.random() - 0.5) * 6,
    vy: Math.random() * 3 + 2,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)] ?? '#FF6B4A',
    size: Math.random() * 8 + 4,
    rot: Math.random() * 360,
    rotSpeed: (Math.random() - 0.5) * 9,
    opacity: 1,
    shape: Math.floor(Math.random() * 3),
  }))
}

function startConfetti(): void {
  const canvas = confettiCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  cancelAnimationFrame(confettiAnimId)

  const particles = createConfetti()
  const startTime = performance.now()
  const duration = 3200

  // Capture non-null refs for the closure — guards above ensure these are defined
  const safeCtx = ctx
  const safeCanvas = canvas

  function animate(now: number): void {
    const elapsed = now - startTime
    if (elapsed > duration) {
      safeCtx.clearRect(0, 0, safeCanvas.width, safeCanvas.height)
      return
    }

    safeCtx.clearRect(0, 0, safeCanvas.width, safeCanvas.height)
    const fade = Math.max(0, (elapsed - duration * 0.65) / (duration * 0.35))

    for (const p of particles) {
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.06
      p.rot += p.rotSpeed
      p.opacity = 1 - fade

      safeCtx.save()
      safeCtx.translate(p.x, p.y)
      safeCtx.rotate((p.rot * Math.PI) / 180)
      safeCtx.globalAlpha = p.opacity
      safeCtx.fillStyle = p.color

      if (p.shape === 0) {
        safeCtx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
      } else if (p.shape === 1) {
        safeCtx.beginPath()
        safeCtx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
        safeCtx.fill()
      } else {
        safeCtx.beginPath()
        safeCtx.moveTo(0, -p.size / 2)
        safeCtx.lineTo(p.size / 2, p.size / 2)
        safeCtx.lineTo(-p.size / 2, p.size / 2)
        safeCtx.closePath()
        safeCtx.fill()
      }

      safeCtx.restore()
    }

    confettiAnimId = requestAnimationFrame(animate)
  }

  confettiAnimId = requestAnimationFrame(animate)
}

onUnmounted(() => {
  cancelAnimationFrame(confettiAnimId)
})
</script>

<template>
  <div class="min-h-screen bg-bg-deep font-body text-text-primary">
    <!-- Confetti canvas (full-screen fixed overlay) -->
    <canvas ref="confettiCanvas" class="pointer-events-none fixed inset-0 z-50" />

    <!-- ── Header ── -->
    <header
      class="sticky top-0 z-20 border-b border-border-default bg-bg-surface/80 backdrop-blur-sm"
    >
      <div class="mx-auto flex max-w-6xl items-center px-4 py-3 sm:px-6">
        <RouterLink
          class="inline-flex items-center gap-1.5 text-sm text-text-secondary transition hover:text-accent-coral"
          to="/"
        >
          <Icon class="size-4" icon="lucide:arrow-left" />
          <span class="max-sm:hidden">Back to Home</span>
        </RouterLink>

        <h1
          class="font-display absolute left-1/2 -translate-x-1/2 text-base font-bold tracking-tight text-text-primary sm:text-lg"
        >
          <span class="mr-1.5 text-accent-coral">//</span>The Chosen One
        </h1>
      </div>
    </header>

    <!-- ── Main ── -->
    <main class="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <div class="grid grid-cols-1 gap-8 lg:grid-cols-[320px_1fr]">
        <!-- Left: name input panel -->
        <div class="animate-fade-up space-y-4">
          <div>
            <h2
              class="font-display flex items-center gap-2 text-xl font-semibold text-text-primary"
            >
              <span class="text-sm text-accent-coral tracking-widest">//</span>
              Who's in the pool?
            </h2>
            <p class="mt-1 text-sm text-text-secondary">
              Enter up to {{ MAX_NAMES }} names — one per line or comma-separated.
            </p>
          </div>

          <!-- Textarea input -->
          <div class="border border-border-default bg-bg-surface">
            <textarea
              v-model="rawInput"
              class="w-full resize-none bg-transparent px-4 py-3 text-sm text-text-primary placeholder-text-dim outline-none focus:outline-none"
              placeholder="Alice&#10;Bob&#10;Charlie&#10;..."
              rows="10"
            />
            <!-- Footer: count + clear -->
            <div class="flex items-center justify-between border-t border-border-default px-4 py-2">
              <span class="font-display text-xs tracking-wide text-text-dim">
                <span :class="isAtMax ? 'text-accent-amber' : 'text-accent-coral'">
                  {{ names.length }}
                </span>
                / {{ MAX_NAMES }} names
              </span>
              <button
                v-if="rawInput.length > 0"
                class="text-xs text-text-dim transition hover:text-text-secondary"
                type="button"
                @click="clearNames"
              >
                Clear
              </button>
            </div>
          </div>

          <!-- Minimum names warning -->
          <p
            v-if="names.length === 1"
            class="border border-accent-coral/30 bg-accent-coral/5 px-4 py-2.5 text-xs text-accent-coral"
            role="alert"
          >
            ⚠ Add at least 2 names to play.
          </p>

          <!-- Max names notice -->
          <p
            v-if="isAtMax"
            class="border border-accent-amber/30 bg-accent-amber/5 px-4 py-2.5 text-xs text-accent-amber"
            role="status"
          >
            ℹ Maximum of {{ MAX_NAMES }} names reached.
          </p>

          <!-- Name chips preview -->
          <div v-if="names.length > 0" class="border border-border-default bg-bg-surface p-4">
            <p class="font-display mb-2.5 text-xs tracking-widest text-text-dim">
              <span class="mr-1 text-accent-amber">//</span>PARTICIPANTS
            </p>
            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="name in names"
                :key="name"
                class="inline-block border border-border-default bg-bg-deep px-2.5 py-1 text-xs text-text-secondary"
              >
                {{ name }}
              </span>
            </div>
          </div>
        </div>

        <!-- Right: game panel -->
        <div class="animate-fade-up animate-delay-2 flex flex-col items-center gap-6">
          <!-- Game header -->
          <div class="flex w-full items-center justify-between">
            <h2
              class="font-display flex items-center gap-2 text-xl font-semibold text-text-primary"
            >
              <span class="text-sm text-accent-amber tracking-widest">//</span>
              {{ activeGame.name }}
            </h2>
            <div class="flex items-center gap-2">
              <span
                class="font-display border border-border-default px-2 py-1 text-[10px] tracking-widest text-text-dim"
              >
                RANDOM GAME
              </span>
              <!-- Game switcher pills -->
              <button
                v-for="g in AVAILABLE_GAMES"
                :key="g.id"
                class="font-display border px-2 py-1 text-[10px] tracking-wide transition"
                :class="
                  g.id === activeGameId
                    ? 'border-accent-coral text-accent-coral'
                    : 'border-border-default text-text-dim hover:border-text-secondary hover:text-text-secondary'
                "
                type="button"
                :title="g.name"
                @click="activeGameId = g.id"
              >
                {{
                  g.id === 'spin-wheel'
                    ? '🎡'
                    : g.id === 'duck-race'
                      ? '🦆'
                      : g.id === 'card-shuffle'
                        ? '🃏'
                        : '🦍'
                }}
              </button>
            </div>
          </div>

          <!-- Games -->
          <SpinWheelGame
            v-if="activeGameId === 'spin-wheel'"
            ref="spinWheelRef"
            :names="names"
            @winner="handleWinner"
          />
          <DuckRaceGame
            v-else-if="activeGameId === 'duck-race'"
            ref="duckRaceRef"
            :names="names"
            @winner="handleWinner"
          />
          <CardShuffleGame
            v-else-if="activeGameId === 'card-shuffle'"
            ref="cardShuffleRef"
            :names="names"
            @winner="handleWinner"
          />
          <KongBeautyGame
            v-else-if="activeGameId === 'kong-beauty'"
            ref="kongBeautyRef"
            :names="names"
            @winner="handleWinner"
          />
        </div>
      </div>
    </main>

    <!-- ── Winner modal ── -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showWinner"
          aria-modal="true"
          class="fixed inset-0 z-40 flex items-center justify-center bg-bg-deep/85 px-4 backdrop-blur-sm"
          role="dialog"
          @click.self="closeWinner"
        >
          <div
            class="animate-fade-up w-full max-w-sm border border-accent-coral bg-bg-surface p-8 text-center"
          >
            <p class="font-display mb-1 text-xs tracking-[0.2em] text-accent-coral">
              THE CHOSEN ONE
            </p>
            <div class="my-5 border-t border-border-default" />
            <h2 class="font-display mb-1 break-words text-3xl font-bold text-text-primary">
              {{ winner }}
            </h2>
            <div class="my-5 border-t border-border-default" />
            <p class="mb-6 text-sm text-text-secondary">🎉 Congratulations to the winner!</p>
            <div class="flex justify-center gap-3">
              <button
                class="border border-border-default px-5 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
                type="button"
                @click="closeWinner"
              >
                Close
              </button>
              <button
                class="border border-accent-coral bg-accent-coral px-5 py-2 text-sm font-semibold text-bg-deep transition hover:border-accent-amber hover:bg-accent-amber"
                type="button"
                @click="spinAgain"
              >
                {{
                  activeGameId === 'duck-race'
                    ? 'Race Again'
                    : activeGameId === 'card-shuffle'
                      ? 'Shuffle Again'
                      : activeGameId === 'kong-beauty'
                        ? 'Climb Again'
                        : 'Spin Again'
                }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.25s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
