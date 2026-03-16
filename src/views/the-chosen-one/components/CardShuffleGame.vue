<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'

const props = defineProps<{
  names: string[]
}>()

const emit = defineEmits<{
  winner: [name: string]
}>()

// ── Phase ──────────────────────────────────────────────
type Phase = 'idle' | 'shuffling' | 'selecting' | 'revealing' | 'done'
const phase = ref<Phase>('idle')

// ── Card state ─────────────────────────────────────────
interface CardState {
  id: number
  name: string
  x: number // current CSS left % relative to deck area
  y: number // current CSS top % relative to deck area
  rot: number // z-rotation degrees
  rotY: number // flip progress (0=face-down, 180=face-up)
  scale: number
  zIndex: number
  glowColor: string
  isWinner: boolean
}

const cards = ref<CardState[]>([])
let nextId = 0

// Magical glow palette — jewel tones
const GLOW_COLORS = [
  '#FF6B4A',
  '#FFB830',
  '#38BDF8',
  '#C77DFF',
  '#06D6A0',
  '#F72585',
  '#4CC9F0',
  '#FFD166',
  '#EF476F',
  '#118AB2',
  '#4361EE',
  '#F77F00',
]

// ── Particle system ────────────────────────────────────
interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number // 0–1 (1=new, 0=dead)
  decay: number
  size: number
  color: string
  shape: 'star' | 'sparkle' | 'diamond'
}

const particleCanvas = ref<HTMLCanvasElement | null>(null)
const particles = ref<Particle[]>([])
let particleAnimId = 0
let lastParticleTs = 0

function spawnParticles(cx: number, cy: number, count: number, color: string): void {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 1.5 + Math.random() * 3.5
    particles.value.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.2,
      life: 1,
      decay: 0.018 + Math.random() * 0.022,
      size: 3 + Math.random() * 5,
      color,
      shape: (['star', 'sparkle', 'diamond'] as const)[Math.floor(Math.random() * 3)]!,
    })
  }
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  spikes: number,
): void {
  const step = Math.PI / spikes
  ctx.beginPath()
  for (let i = 0; i < spikes * 2; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45
    ctx.lineTo(
      x + Math.cos(i * step - Math.PI / 2) * rad,
      y + Math.sin(i * step - Math.PI / 2) * rad,
    )
  }
  ctx.closePath()
  ctx.fill()
}

function drawSparkle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + Math.cos(angle) * r, y + Math.sin(angle) * r)
    ctx.lineWidth = r * 0.4
    ctx.strokeStyle = ctx.fillStyle as string
    ctx.stroke()
  }
}

function renderParticles(ts: number): void {
  const canvas = particleCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const dt = lastParticleTs === 0 ? 0 : Math.min((ts - lastParticleTs) / 16.67, 3)
  lastParticleTs = ts

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  particles.value = particles.value.filter((p) => p.life > 0)

  for (const p of particles.value) {
    p.x += p.vx * dt
    p.y += p.vy * dt
    p.vy += 0.08 * dt
    p.life -= p.decay * dt

    ctx.globalAlpha = Math.max(0, p.life)
    ctx.fillStyle = p.color

    if (p.shape === 'star') {
      drawStar(ctx, p.x, p.y, p.size, 5)
    } else if (p.shape === 'sparkle') {
      drawSparkle(ctx, p.x, p.y, p.size)
    } else {
      // diamond
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(Math.PI / 4)
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size)
      ctx.restore()
    }
  }

  ctx.globalAlpha = 1

  if (particles.value.length > 0) {
    particleAnimId = requestAnimationFrame(renderParticles)
  } else {
    lastParticleTs = 0
  }
}

function startParticles(): void {
  cancelAnimationFrame(particleAnimId)
  lastParticleTs = 0
  particleAnimId = requestAnimationFrame(renderParticles)
}

// ── Container ref for coord mapping ───────────────────
const deckEl = ref<HTMLDivElement | null>(null)

function emitParticlesAt(cardEl: HTMLElement | null, color: string, count: number): void {
  if (!cardEl || !particleCanvas.value) return
  const cr = cardEl.getBoundingClientRect()
  const pr = particleCanvas.value.getBoundingClientRect()
  const cx = cr.left + cr.width / 2 - pr.left
  const cy = cr.top + cr.height / 2 - pr.top
  spawnParticles(cx, cy, count, color)
  startParticles()
}

// ── Init / reset ───────────────────────────────────────
function buildCards(): void {
  cards.value = props.names.map((name, i) => ({
    id: nextId++,
    name,
    x: 50,
    y: 50,
    rot: (Math.random() - 0.5) * 8,
    rotY: 0,
    scale: 1,
    zIndex: i,
    glowColor: GLOW_COLORS[i % GLOW_COLORS.length]!,
    isWinner: false,
  }))
  phase.value = 'idle'
}

watch(() => props.names, buildCards, { immediate: true })

// ── Shuffle animation ──────────────────────────────────
const SHUFFLE_ROUNDS = 4
const SHUFFLE_INTERVAL = 90 // ms per swap
let shuffleTimer = 0

function doShuffle(round: number, swaps: number): void {
  if (swaps <= 0) {
    if (round < SHUFFLE_ROUNDS) {
      doShuffle(round + 1, 18 - round * 2)
    } else {
      // Shuffle done — fan out for selection
      fanOut()
    }
    return
  }

  const n = cards.value.length
  const a = Math.floor(Math.random() * n)
  let b = Math.floor(Math.random() * n)
  if (b === a) b = (b + 1) % n

  // Swap positions + add wild rotation
  const tmp = { x: cards.value[a]!.x, y: cards.value[a]!.y, rot: cards.value[a]!.rot }
  cards.value[a]!.x = cards.value[b]!.x
  cards.value[a]!.y = cards.value[b]!.y
  cards.value[a]!.rot = (Math.random() - 0.5) * 45
  cards.value[b]!.x = tmp.x
  cards.value[b]!.y = tmp.y
  cards.value[b]!.rot = (Math.random() - 0.5) * 45

  // Briefly pop z-index
  const savedZ = n + 10
  cards.value[a]!.zIndex = savedZ
  cards.value[b]!.zIndex = savedZ - 1

  shuffleTimer = window.setTimeout(() => doShuffle(round, swaps - 1), SHUFFLE_INTERVAL)
}

// ── Fan out after shuffle ──────────────────────────────
function fanOut(): void {
  phase.value = 'selecting'
  const n = cards.value.length

  if (n <= 10) {
    // Arc layout
    const totalAngle = Math.min(160, n * 22)
    const startAngle = -totalAngle / 2
    const step = n > 1 ? totalAngle / (n - 1) : 0
    const arcRadius = 55 // % distance from center

    cards.value.forEach((card, i) => {
      const angleDeg = startAngle + step * i
      const angleRad = (angleDeg * Math.PI) / 180
      card.x = 50 + arcRadius * Math.sin(angleRad)
      card.y = 50 - arcRadius * Math.cos(angleRad) * 0.5
      card.rot = angleDeg * 0.6
      card.scale = 1
      card.zIndex = i
    })
  } else {
    // Grid layout
    const cols = Math.ceil(Math.sqrt(n))
    const rows = Math.ceil(n / cols)
    const xStep = 80 / (cols + 1)
    const yStep = 80 / (rows + 1)

    cards.value.forEach((card, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      card.x = 10 + xStep * (col + 1)
      card.y = 10 + yStep * (row + 1)
      card.rot = (Math.random() - 0.5) * 12
      card.scale = 1
      card.zIndex = i
    })
  }
}

// ── Pick winner + flip reveal ──────────────────────────
const cardEls = ref<Record<number, HTMLElement>>({})
const centerCard = ref<CardState | null>(null)

function pickWinner(): void {
  if (phase.value !== 'selecting') return
  phase.value = 'revealing'

  const winnerIdx = Math.floor(Math.random() * cards.value.length)
  const winner = cards.value[winnerIdx]!
  winner.isWinner = true
  centerCard.value = winner

  // Fly winner to center, dim others
  cards.value.forEach((card, i) => {
    if (i === winnerIdx) {
      card.x = 50
      card.y = 50
      card.rot = 0
      card.scale = 1.35
      card.zIndex = 100
    } else {
      card.scale = 0.82
      card.zIndex = i
    }
  })

  // Flip the winner card after it flies in
  window.setTimeout(() => {
    winner.rotY = 180

    // Spawn magic burst when card face reveals
    window.setTimeout(() => {
      const el = cardEls.value[winner.id] ?? null
      emitParticlesAt(el, winner.glowColor, 40)
      // Secondary burst with white
      window.setTimeout(() => emitParticlesAt(el, '#FFFFFF', 20), 180)

      // Fire winner event
      window.setTimeout(() => {
        phase.value = 'done'
        emit('winner', winner.name)
      }, 600)
    }, 450)
  }, 500)
}

// ── Public API ─────────────────────────────────────────
function spin(): void {
  if (phase.value === 'shuffling' || phase.value === 'revealing') return
  if (props.names.length < 2) return

  // Reset cards before new round
  buildCards()
  phase.value = 'shuffling'

  // Stack all cards at center to start
  cards.value.forEach((card, i) => {
    card.x = 50
    card.y = 50
    card.rot = (Math.random() - 0.5) * 6
    card.scale = 1
    card.zIndex = i
  })

  // Short delay before shuffle begins
  clearTimeout(shuffleTimer)
  shuffleTimer = window.setTimeout(() => doShuffle(0, 18), 300)
}

defineExpose({ spin })

onUnmounted(() => {
  clearTimeout(shuffleTimer)
  cancelAnimationFrame(particleAnimId)
})

// ── Tooltip for hover ──────────────────────────────────
const hoveredCard = ref<number | null>(null)

const isInteractive = computed(() => phase.value === 'selecting')

// ── Canvas resize ──────────────────────────────────────
function resizeCanvas(): void {
  const canvas = particleCanvas.value
  const deck = deckEl.value
  if (!canvas || !deck) return
  canvas.width = deck.clientWidth
  canvas.height = deck.clientHeight
}

watch(deckEl, (el) => {
  if (!el) return
  resizeCanvas()
})
</script>

<template>
  <div class="flex w-full flex-col items-center gap-6">
    <!-- ── Ambient magic title ── -->
    <div class="flex items-center gap-3 text-center">
      <span class="font-display text-xs tracking-[0.25em] text-text-dim">✦</span>
      <p class="font-display text-xs tracking-[0.18em] text-text-dim">
        <template v-if="phase === 'idle'">THE ARCANE DECK AWAITS</template>
        <template v-else-if="phase === 'shuffling'">SHUFFLING THE FATES…</template>
        <template v-else-if="phase === 'selecting'">CHOOSE WHAT FATE DECIDES</template>
        <template v-else-if="phase === 'revealing'">THE SPELL IS CAST…</template>
        <template v-else>THE FATES HAVE SPOKEN</template>
      </p>
      <span class="font-display text-xs tracking-[0.25em] text-text-dim">✦</span>
    </div>

    <!-- ── Deck area ── -->
    <div ref="deckEl" class="relative w-full select-none overflow-hidden" style="height: 380px">
      <!-- Particle canvas overlay -->
      <canvas
        ref="particleCanvas"
        class="pointer-events-none absolute inset-0 z-50"
        :style="{ width: '100%', height: '100%' }"
      />

      <!-- Magic circle backdrop (visible during shuffle/select/reveal) -->
      <Transition name="magic-circle">
        <div
          v-if="phase !== 'idle'"
          class="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <svg
            class="magic-circle-svg absolute"
            viewBox="0 0 320 320"
            style="width: 320px; height: 320px; opacity: 0.12"
            aria-hidden="true"
          >
            <!-- Outer ring -->
            <circle
              cx="160"
              cy="160"
              r="148"
              fill="none"
              stroke="#FF6B4A"
              stroke-width="1.5"
              stroke-dasharray="6 4"
            />
            <circle cx="160" cy="160" r="130" fill="none" stroke="#FFB830" stroke-width="0.8" />
            <!-- Inner ring -->
            <circle
              cx="160"
              cy="160"
              r="100"
              fill="none"
              stroke="#FF6B4A"
              stroke-width="1"
              stroke-dasharray="3 6"
            />
            <!-- Runes (evenly spaced tick marks) -->
            <g stroke="#FFB830" stroke-width="1.5">
              <line x1="160" y1="12" x2="160" y2="26" />
              <line x1="160" y1="294" x2="160" y2="308" />
              <line x1="12" y1="160" x2="26" y2="160" />
              <line x1="294" y1="160" x2="308" y2="160" />
              <line x1="63.4" y1="33.5" x2="70.8" y2="46.3" />
              <line x1="256.6" y1="33.5" x2="249.2" y2="46.3" />
              <line x1="33.5" y1="256.6" x2="46.3" y2="249.2" />
              <line x1="286.5" y1="256.6" x2="273.7" y2="249.2" />
            </g>
            <!-- Stars at cardinal points -->
            <g fill="#FF6B4A">
              <polygon
                points="160,6 162,12 168,12 163,16 165,22 160,18 155,22 157,16 152,12 158,12"
              />
              <polygon
                points="160,314 162,308 168,308 163,304 165,298 160,302 155,298 157,304 152,308 158,308"
              />
              <polygon
                points="6,160 12,162 12,168 16,163 22,165 18,160 22,155 16,157 12,152 12,158"
              />
              <polygon
                points="314,160 308,162 308,168 304,163 298,165 302,160 298,155 304,157 308,152 308,158"
              />
            </g>
            <!-- Pentagram lines -->
            <polygon
              points="160,60 194,162 298,162 218,218 248,320 160,264 72,320 102,218 22,162 126,162"
              fill="none"
              stroke="#C77DFF"
              stroke-width="0.5"
              opacity="0.5"
            />
          </svg>
        </div>
      </Transition>

      <!-- Empty state -->
      <div
        v-if="names.length === 0"
        class="absolute inset-0 flex flex-col items-center justify-center gap-3"
      >
        <div class="font-display text-4xl">🃏</div>
        <p class="font-display text-xs tracking-widest text-text-dim">ENTER NAMES TO BEGIN</p>
      </div>

      <!-- Cards -->
      <div
        v-for="card in cards"
        :key="card.id"
        :ref="
          (el) => {
            if (el) cardEls[card.id] = el as HTMLElement
            else delete cardEls[card.id]
          }
        "
        class="card-root absolute"
        :style="{
          left: card.x + '%',
          top: card.y + '%',
          transform: `translate(-50%, -50%) rotate(${card.rot}deg) scale(${card.scale})`,
          zIndex: card.zIndex,
          '--glow': card.glowColor,
          '--rotY': card.rotY + 'deg',
        }"
        :class="{
          'card-hoverable cursor-pointer': isInteractive,
          'card-winner': card.isWinner && phase !== 'idle',
        }"
        @mouseenter="isInteractive ? (hoveredCard = card.id) : undefined"
        @mouseleave="hoveredCard = null"
        @click="isInteractive ? pickWinner() : undefined"
      >
        <!-- 3-D flip wrapper -->
        <div class="card-flipper" :style="{ transform: `rotateY(${card.rotY}deg)` }">
          <!-- Card back (face-down side) -->
          <div class="card-face card-back">
            <!-- ornate border pattern -->
            <svg class="absolute inset-0 w-full h-full" viewBox="0 0 80 110" aria-hidden="true">
              <!-- Background -->
              <rect width="80" height="110" rx="6" fill="#162232" />
              <!-- Outer border -->
              <rect
                x="3"
                y="3"
                width="74"
                height="104"
                rx="4"
                fill="none"
                stroke="#253549"
                stroke-width="1.5"
              />
              <!-- Inner border -->
              <rect
                x="7"
                y="7"
                width="66"
                height="96"
                rx="3"
                fill="none"
                stroke="#253549"
                stroke-width="0.8"
              />

              <!-- Central magic sigil -->
              <g transform="translate(40 55)">
                <!-- Outer ring of sigil -->
                <circle
                  r="22"
                  fill="none"
                  stroke="#FF6B4A"
                  stroke-width="0.8"
                  stroke-dasharray="3 3"
                  opacity="0.6"
                />
                <!-- Inner ring -->
                <circle r="14" fill="none" stroke="#FFB830" stroke-width="0.6" opacity="0.5" />
                <!-- Star glyph -->
                <polygon
                  points="0,-18 4.3,-5.9 17.1,-5.9 7.1,2.2 10.6,15.3 0,8.2 -10.6,15.3 -7.1,2.2 -17.1,-5.9 -4.3,-5.9"
                  fill="none"
                  stroke="#FF6B4A"
                  stroke-width="0.7"
                  opacity="0.5"
                />
                <!-- Center dot -->
                <circle r="2.5" fill="#FFB830" opacity="0.6" />
              </g>

              <!-- Corner ornaments -->
              <g fill="#253549" stroke="#FF6B4A" stroke-width="0.5" opacity="0.7">
                <polygon points="11,11 14,8 17,11 14,14" />
                <polygon points="69,11 66,8 63,11 66,14" />
                <polygon points="11,99 14,96 17,99 14,102" />
                <polygon points="69,99 66,96 63,99 66,102" />
              </g>

              <!-- Top/bottom rune dots -->
              <circle cx="40" cy="17" r="1.5" fill="#4A6180" />
              <circle cx="40" cy="93" r="1.5" fill="#4A6180" />

              <!-- Hover pulse ring (only when in selecting phase) -->
              <circle
                v-if="isInteractive && hoveredCard === card.id"
                cx="40"
                cy="55"
                r="26"
                fill="none"
                :stroke-width="1.5"
                :stroke="card.glowColor"
                opacity="0.8"
                class="card-pulse-ring"
              />
            </svg>

            <!-- Hover glow label -->
            <div
              v-if="isInteractive && hoveredCard === card.id"
              class="font-display absolute bottom-2 inset-x-0 text-center text-[8px] tracking-widest transition-opacity"
              :style="{ color: card.glowColor }"
            >
              REVEAL
            </div>
          </div>

          <!-- Card front (revealed side) -->
          <div class="card-face card-front" :style="{ '--glow': card.glowColor }">
            <svg class="absolute inset-0 w-full h-full" viewBox="0 0 80 110" aria-hidden="true">
              <rect width="80" height="110" rx="6" fill="#0F1923" />
              <rect
                x="3"
                y="3"
                width="74"
                height="104"
                rx="4"
                fill="none"
                :stroke-width="1.5"
                :stroke="card.glowColor"
              />
              <rect
                x="6"
                y="6"
                width="68"
                height="98"
                rx="3"
                fill="none"
                :stroke-width="0.6"
                :stroke="card.glowColor"
                opacity="0.4"
              />
              <!-- Sunburst from center -->
              <g opacity="0.08" :stroke="card.glowColor" :stroke-width="0.4">
                <line x1="40" y1="55" x2="40" y2="10" />
                <line x1="40" y1="55" x2="40" y2="100" />
                <line x1="40" y1="55" x2="10" y2="55" />
                <line x1="40" y1="55" x2="70" y2="55" />
                <line x1="40" y1="55" x2="19" y2="34" />
                <line x1="40" y1="55" x2="61" y2="34" />
                <line x1="40" y1="55" x2="19" y2="76" />
                <line x1="40" y1="55" x2="61" y2="76" />
              </g>
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center px-2 gap-2">
              <div
                class="font-display text-[9px] tracking-[0.2em]"
                :style="{ color: card.glowColor }"
              >
                ✦
              </div>
              <div
                class="font-display text-center font-semibold leading-tight break-words w-full"
                style="
                  font-size: clamp(8px, 2vw, 14px);
                  color: #f0ede6;
                  overflow-wrap: anywhere;
                  max-width: 60px;
                "
              >
                {{ card.name }}
              </div>
              <div
                class="font-display text-[9px] tracking-[0.2em]"
                :style="{ color: card.glowColor }"
              >
                ✦
              </div>
            </div>
          </div>
        </div>

        <!-- External name tooltip during selection (shows on hover) -->
        <Transition name="tooltip">
          <div
            v-if="isInteractive && hoveredCard === card.id"
            class="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-none border px-2 py-1 font-display text-[10px] tracking-wide"
            :style="{
              borderColor: card.glowColor,
              color: card.glowColor,
              backgroundColor: '#0F1923',
            }"
          >
            {{ card.name }}
          </div>
        </Transition>
      </div>
    </div>

    <!-- ── CTA button ── -->
    <button
      :disabled="names.length < 2 || phase === 'shuffling' || phase === 'revealing'"
      class="bg-accent-coral font-display px-14 py-4 text-base font-bold tracking-[0.15em] text-bg-deep transition-all hover:bg-accent-amber active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
      type="button"
      @click="phase === 'selecting' ? pickWinner() : spin()"
    >
      <template v-if="phase === 'idle'">SHUFFLE</template>
      <template v-else-if="phase === 'shuffling'">SHUFFLING…</template>
      <template v-else-if="phase === 'selecting'">DRAW A CARD</template>
      <template v-else-if="phase === 'revealing'">CASTING SPELL…</template>
      <template v-else>SHUFFLE AGAIN</template>
    </button>

    <!-- ── Phase hint ── -->
    <p class="font-display text-[10px] tracking-widest text-text-dim">
      <template v-if="phase === 'idle' || phase === 'done'"> Click to let fate decide </template>
      <template v-else-if="phase === 'selecting'"> Click any card — or click the button </template>
      <template v-else> &nbsp; </template>
    </p>
  </div>
</template>

<style scoped>
/* ── Card 3-D perspective ── */
.card-root {
  width: 80px;
  height: 110px;
  perspective: 600px;
  transition:
    left 0.42s cubic-bezier(0.34, 1.56, 0.64, 1),
    top 0.42s cubic-bezier(0.34, 1.56, 0.64, 1),
    transform 0.42s cubic-bezier(0.34, 1.56, 0.64, 1);
  will-change: left, top, transform;
}

.card-flipper {
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.55s cubic-bezier(0.45, 0.05, 0.35, 1);
}

.card-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  border-radius: 6px;
  overflow: hidden;
}

.card-back {
  /* face-down: visible by default */
}

.card-front {
  transform: rotateY(180deg);
  box-shadow: 0 0 18px 4px color-mix(in srgb, var(--glow) 50%, transparent);
}

/* Winner extra glow */
.card-winner {
  filter: drop-shadow(0 0 14px var(--glow));
}

/* Hoverable lift */
.card-hoverable:hover {
  filter: drop-shadow(0 0 10px var(--glow));
}

/* Pulsing ring on hovered card back */
.card-pulse-ring {
  animation: pulse-ring 0.9s ease-in-out infinite;
}

@keyframes pulse-ring {
  0%,
  100% {
    opacity: 0.4;
    r: 24;
  }
  50% {
    opacity: 1;
    r: 28;
  }
}

/* Magic circle slow rotation */
.magic-circle-svg {
  animation: spin-slow 24s linear infinite;
}

@keyframes spin-slow {
  to {
    transform: rotate(360deg);
  }
}

/* Transitions */
.magic-circle-enter-active,
.magic-circle-leave-active {
  transition: opacity 0.5s ease;
}
.magic-circle-enter-from,
.magic-circle-leave-to {
  opacity: 0;
}

.tooltip-enter-active,
.tooltip-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}
.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(4px);
}
</style>
