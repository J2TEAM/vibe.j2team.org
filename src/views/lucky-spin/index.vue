<script setup lang="ts">
import { ref, computed, watch, onUnmounted, nextTick } from 'vue'
import { RouterLink } from 'vue-router'

// ── Types ──────────────────────────────────────────────
interface FruitEntry {
  emoji: string
  color: string
}

interface Participant {
  name: string
  fruit: string
  color: string
}

interface HistoryEntry {
  name: string
  fruit: string
  color: string
  timestamp: number
}

// ── Fruit data ─────────────────────────────────────────
const FRUITS: FruitEntry[] = [
  { emoji: '🍎', color: '#E63946' },
  { emoji: '🍊', color: '#F77F00' },
  { emoji: '🍋', color: '#FFD60A' },
  { emoji: '🍌', color: '#F4D35E' },
  { emoji: '🍉', color: '#2A9D8F' },
  { emoji: '🍇', color: '#6A4C93' },
  { emoji: '🍓', color: '#D62828' },
  { emoji: '🍒', color: '#C1121F' },
  { emoji: '🍑', color: '#FFB4A2' },
  { emoji: '🍍', color: '#FFBE0B' },
  { emoji: '🥝', color: '#588157' },
  { emoji: '🫐', color: '#4361EE' },
  { emoji: '🍐', color: '#90BE6D' },
  { emoji: '🍈', color: '#A7C957' },
  { emoji: '🥭', color: '#FF8800' },
]

// ── Helpers ────────────────────────────────────────────
function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = copy[i]!
    copy[i] = copy[j]!
    copy[j] = temp
  }
  return copy
}

function getContrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.55 ? '#1a1a2e' : '#ffffff'
}

function polarToCartesian(cx: number, cy: number, radius: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) }
}

function describeArc(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
): string {
  const start = polarToCartesian(cx, cy, radius, endAngle)
  const end = polarToCartesian(cx, cy, radius, startAngle)
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y} Z`
}

// ── State ──────────────────────────────────────────────
const rawInput = ref('An, Bình, Cường, Dũng, Em, Phúc, Giang, Hùng, Inh, Kim')
const isSpinning = ref(false)
const winner = ref<Participant | null>(null)
const showPopup = ref(false)
const currentRotation = ref(0)
const removeWinners = ref(false)
const history = ref<HistoryEntry[]>([])
const showHistory = ref(false)

// Confetti state
const confettiCanvas = ref<HTMLCanvasElement | null>(null)
let confettiAnimationId = 0
let confettiParticles: ConfettiParticle[] = []

// Popup focus trap
const popupRef = ref<HTMLDivElement | null>(null)

interface ConfettiParticle {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  size: number
  rotation: number
  rotationSpeed: number
  opacity: number
  shape: number
}

// ── Parsing ────────────────────────────────────────────
const parsedNames = computed<string[]>(() => {
  const text = rawInput.value
  const items = text.includes(',') ? text.split(',') : text.split('\n')
  const trimmed = items.map((s) => s.trim()).filter((s) => s.length > 0)
  return [...new Set(trimmed)]
})

const participants = ref<Participant[]>([])

function assignFruits(names: string[]): Participant[] {
  const shuffled = shuffleArray(FRUITS)
  return names.map((name, i) => {
    const fruit = shuffled[i % shuffled.length]!
    return { name, fruit: fruit.emoji, color: fruit.color }
  })
}

watch(
  parsedNames,
  (names) => {
    participants.value = assignFruits(names)
  },
  { immediate: true },
)

const activeParticipants = computed<Participant[]>(() => {
  if (!removeWinners.value) return participants.value
  const wonNames = new Set(history.value.map((h) => h.name))
  return participants.value.filter((p) => !wonNames.has(p.name))
})

// ── Localization ───────────────────────────────────────
const locale = ref<'vi' | 'en'>('vi')

const translations = {
  vi: {
    title: '🎰 Vòng Quay Lựa Chọn',
    back: 'Về trang chủ',
    inputLabel: 'Danh sách người tham gia',
    placeholder: 'Nhập tên, phân cách bằng dấu phẩy hoặc xuống dòng\nVí dụ: An, Bình, Cường',
    hint: 'Hỗ trợ phân cách bằng dấu phẩy (,) hoặc xuống dòng',
    participantCount: 'Người tham gia',
    validationShort: 'Vui lòng nhập ít nhất 2 người',
    validationOne: 'Cần ít nhất 2 người để quay',
    removeWinners: 'Loại người đã trúng khỏi vòng quay',
    reset: 'Reset',
    history: 'Lịch sử',
    hideHistory: 'Ẩn lịch sử',
    historyTitle: 'Lịch sử người trúng',
    listTitle: 'Danh sách',
    wheelPlaceholder: 'Nhập danh sách để bắt đầu',
    spin: 'Quay',
    spinning: 'Đang quay...',
    congrats: '🎉 Chúc mừng!',
    chosenOne: 'Bạn là người được chọn!',
    close: 'Đóng',
    spinAgain: 'Quay tiếp',
    createdBy: 'Được tạo bởi',
  },
  en: {
    title: '🎰 Lucky Spin',
    back: 'Back to home',
    inputLabel: 'Participant list',
    placeholder: 'Enter names, separated by commas or new lines\nExample: Alice, Bob, Charlie',
    hint: 'Supports comma (,) or newline separation',
    participantCount: 'Participants',
    validationShort: 'Please enter at least 2 people',
    validationOne: 'Need at least 2 people to spin',
    removeWinners: 'Remove winners from wheel',
    reset: 'Reset',
    history: 'History',
    hideHistory: 'Hide history',
    historyTitle: 'Winner history',
    listTitle: 'List',
    wheelPlaceholder: 'Enter list to start',
    spin: 'Spin',
    spinning: 'Spinning...',
    congrats: '🎉 Congratulations!',
    chosenOne: 'You are the chosen one!',
    close: 'Close',
    spinAgain: 'Spin again',
    createdBy: 'Created by',
  },
}

function t(key: keyof (typeof translations)['vi']): string {
  return translations[locale.value][key]
}

const canSpin = computed(() => activeParticipants.value.length >= 2 && !isSpinning.value)
const validationMessage = computed(() => {
  if (activeParticipants.value.length === 0) return t('validationShort')
  if (activeParticipants.value.length === 1) return t('validationOne')
  return ''
})

// ── Wheel geometry ─────────────────────────────────────
const WHEEL_SIZE = 360
const WHEEL_CENTER = WHEEL_SIZE / 2
const WHEEL_RADIUS = WHEEL_SIZE / 2 - 8

const segments = computed(() => {
  const list = activeParticipants.value
  if (list.length === 0) return []
  const anglePerSegment = 360 / list.length
  return list.map((p, i) => {
    const startAngle = i * anglePerSegment
    const endAngle = startAngle + anglePerSegment
    const midAngle = startAngle + anglePerSegment / 2
    const path = describeArc(WHEEL_CENTER, WHEEL_CENTER, WHEEL_RADIUS, startAngle, endAngle)
    const textRadius = WHEEL_RADIUS * 0.65
    const textPos = polarToCartesian(WHEEL_CENTER, WHEEL_CENTER, textRadius, midAngle)
    let textRotation = midAngle
    if (textRotation > 90 && textRotation < 270) {
      textRotation += 180
    }
    const maxChars = list.length > 12 ? 6 : list.length > 6 ? 10 : 14
    const displayName = p.name.length > maxChars ? p.name.slice(0, maxChars - 1) + '…' : p.name
    const fontSize = list.length > 20 ? 10 : list.length > 10 ? 12 : 14
    return {
      ...p,
      path,
      startAngle,
      endAngle,
      midAngle,
      textX: textPos.x,
      textY: textPos.y,
      textRotation,
      displayName,
      fontSize,
      emojiSize: fontSize * 2,
      textColor: getContrastColor(p.color),
    }
  })
})

// ── Spin logic ─────────────────────────────────────────
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function spin(): void {
  if (!canSpin.value) return

  const list = activeParticipants.value
  const winnerIndex = Math.floor(Math.random() * list.length)
  const selectedWinner: Participant = list[winnerIndex]!

  const anglePerSegment = 360 / list.length
  // The pointer is at the top (0 degrees / 360 degrees).
  // We need the winner's segment center to align with the top.
  // Segment center angle = winnerIndex * anglePerSegment + anglePerSegment / 2
  // We rotate clockwise, so target = 360 - segmentCenter + extraFullRotations
  const segmentCenter = winnerIndex * anglePerSegment + anglePerSegment / 2
  const fullRotations = (5 + Math.floor(Math.random() * 4)) * 360 // 5-8 full rotations
  const targetAngle =
    currentRotation.value + fullRotations + (360 - segmentCenter) - (currentRotation.value % 360)

  isSpinning.value = true
  winner.value = null
  showPopup.value = false

  const startRotation = currentRotation.value
  const totalDelta = targetAngle - startRotation
  const duration = 4000 // 4 seconds
  const startTime = performance.now()

  function animate(now: number): void {
    const elapsed = now - startTime
    const progress = Math.min(elapsed / duration, 1)
    const easedProgress = easeOutCubic(progress)
    currentRotation.value = startRotation + totalDelta * easedProgress

    if (progress < 1) {
      requestAnimationFrame(animate)
    } else {
      currentRotation.value = targetAngle
      isSpinning.value = false
      winner.value = selectedWinner
      history.value.unshift({
        name: selectedWinner.name,
        fruit: selectedWinner.fruit,
        color: selectedWinner.color,
        timestamp: Date.now(),
      })
      showPopup.value = true
      startConfetti()
      nextTick(() => {
        popupRef.value?.focus()
      })
    }
  }

  requestAnimationFrame(animate)
}

// ── Confetti ───────────────────────────────────────────
const CONFETTI_COLORS = [
  '#FF6B4A',
  '#FFB830',
  '#38BDF8',
  '#E63946',
  '#F77F00',
  '#6A4C93',
  '#2A9D8F',
  '#FFD60A',
  '#D62828',
  '#FF8800',
]

function createConfettiParticles(): ConfettiParticle[] {
  const particles: ConfettiParticle[] = []
  for (let i = 0; i < 150; i++) {
    particles.push({
      x: Math.random() * window.innerWidth,
      y: -20 - Math.random() * 200,
      vx: (Math.random() - 0.5) * 6,
      vy: Math.random() * 3 + 2,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)] ?? '#FF6B4A',
      size: Math.random() * 8 + 4,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      opacity: 1,
      shape: Math.floor(Math.random() * 3), // 0: rect, 1: circle, 2: triangle
    })
  }
  return particles
}

function startConfetti(): void {
  const canvas = confettiCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  confettiParticles = createConfettiParticles()

  const startTime = performance.now()
  const confettiDuration = 3000

  function animateConfetti(now: number): void {
    const elapsed = now - startTime
    if (elapsed > confettiDuration) {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height)
      return
    }

    ctx!.clearRect(0, 0, canvas!.width, canvas!.height)
    const fadeProgress = Math.max(0, (elapsed - confettiDuration * 0.7) / (confettiDuration * 0.3))

    for (const p of confettiParticles) {
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.05
      p.rotation += p.rotationSpeed
      p.opacity = 1 - fadeProgress

      ctx!.save()
      ctx!.translate(p.x, p.y)
      ctx!.rotate((p.rotation * Math.PI) / 180)
      ctx!.globalAlpha = p.opacity
      ctx!.fillStyle = p.color

      if (p.shape === 0) {
        ctx!.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
      } else if (p.shape === 1) {
        ctx!.beginPath()
        ctx!.arc(0, 0, p.size / 2, 0, Math.PI * 2)
        ctx!.fill()
      } else {
        ctx!.beginPath()
        ctx!.moveTo(0, -p.size / 2)
        ctx!.lineTo(p.size / 2, p.size / 2)
        ctx!.lineTo(-p.size / 2, p.size / 2)
        ctx!.closePath()
        ctx!.fill()
      }

      ctx!.restore()
    }

    confettiAnimationId = requestAnimationFrame(animateConfetti)
  }

  confettiAnimationId = requestAnimationFrame(animateConfetti)
}

// ── Actions ────────────────────────────────────────────
function closePopup(): void {
  showPopup.value = false
}

function spinAgain(): void {
  showPopup.value = false
  nextTick(() => spin())
}

function resetAll(): void {
  rawInput.value = ''
  history.value = []
  winner.value = null
  showPopup.value = false
  currentRotation.value = 0
}

function handlePopupKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape') {
    closePopup()
    return
  }
  // Focus trap
  if (e.key === 'Tab') {
    const popup = popupRef.value
    if (!popup) return
    const focusable = popup.querySelectorAll<HTMLElement>('button, [tabindex]')
    if (focusable.length === 0) return
    const first = focusable[0]!
    const last = focusable[focusable.length - 1]!
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }
}

onUnmounted(() => {
  if (confettiAnimationId) cancelAnimationFrame(confettiAnimationId)
})
</script>

<template>
  <div class="lucky-spin-page min-h-screen bg-bg-deep text-text-primary font-body">
    <!-- Confetti canvas -->
    <canvas ref="confettiCanvas" class="pointer-events-none fixed inset-0 z-50" />

    <!-- Header -->
    <header class="border-b border-border-default bg-bg-surface/80 backdrop-blur-sm">
      <div class="mx-auto flex gap-4 max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 text-sm text-text-secondary transition hover:text-accent-coral"
          :aria-label="t('back')"
        >
          <svg
            class="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          <span class="max-sm:hidden">{{ t('back') }}</span>
        </RouterLink>
        <h1 class="font-display text-lg font-bold tracking-tight text-accent-coral sm:text-xl">
          {{ t('title') }}
        </h1>
        <select
          v-model="locale"
          class="bg-bg-deep border border-border-default text-xs text-text-secondary px-2 py-0.5 ml-auto outline-none focus:border-accent-coral"
        >
          <option value="vi">Tiếng Việt</option>
          <option value="en">English</option>
        </select>
      </div>
    </header>

    <!-- Main Content -->
    <main class="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <div class="grid grid-cols-1 gap-8 lg:grid-cols-[380px_1fr]">
        <!-- Left Panel: Input -->
        <div class="space-y-5 animate-fade-up">
          <div class="border border-border-default bg-bg-surface p-5">
            <label
              for="name-input"
              class="mb-2 block font-display text-sm font-semibold tracking-wide text-text-secondary"
            >
              <span class="text-accent-coral mr-1">//</span> {{ t('inputLabel') }}
            </label>
            <textarea
              id="name-input"
              v-model="rawInput"
              :disabled="isSpinning"
              class="w-full rounded-none border border-border-default bg-bg-deep px-4 py-3 text-sm text-text-primary placeholder-text-dim outline-none transition focus:border-accent-coral disabled:opacity-50"
              rows="6"
              :placeholder="t('placeholder')"
            />
            <p class="mt-2 text-xs text-text-dim">
              {{ t('hint') }}
            </p>
          </div>

          <!-- Participant count -->
          <div
            class="flex items-center justify-between border border-border-default bg-bg-surface px-5 py-3"
          >
            <span class="font-display text-sm text-text-secondary">
              <span class="text-accent-amber mr-1">//</span> {{ t('participantCount') }}
            </span>
            <span class="font-display text-lg font-bold text-accent-coral">
              {{ activeParticipants.length }}
            </span>
          </div>

          <!-- Validation message -->
          <p
            v-if="validationMessage"
            class="border border-accent-coral/30 bg-accent-coral/5 px-4 py-2.5 text-xs text-accent-coral"
            role="alert"
          >
            ⚠ {{ validationMessage }}
          </p>

          <!-- Options -->
          <div class="space-y-3 border border-border-default bg-bg-surface p-5">
            <label
              class="flex cursor-pointer items-center gap-3 text-sm text-text-secondary transition hover:text-text-primary"
            >
              <input
                v-model="removeWinners"
                type="checkbox"
                :disabled="isSpinning"
                class="accent-accent-coral h-4 w-4"
              />
              {{ t('removeWinners') }}
            </label>

            <div class="flex gap-3 pt-1">
              <button
                type="button"
                :disabled="isSpinning"
                class="border border-border-default px-4 py-1.5 text-xs text-text-secondary transition hover:border-accent-coral hover:text-text-primary disabled:opacity-40"
                @click="resetAll"
              >
                {{ t('reset') }}
              </button>
              <button
                type="button"
                class="border border-border-default px-4 py-1.5 text-xs text-text-secondary transition hover:border-accent-amber hover:text-text-primary"
                @click="showHistory = !showHistory"
              >
                {{ showHistory ? t('hideHistory') : t('history') }}
                <span v-if="history.length" class="ml-1 text-accent-amber"
                  >({{ history.length }})</span
                >
              </button>
            </div>
          </div>

          <!-- History -->
          <div
            v-if="showHistory && history.length > 0"
            class="border border-border-default bg-bg-surface p-5 animate-fade-up"
          >
            <h3 class="mb-3 font-display text-sm font-semibold text-text-secondary">
              <span class="text-accent-sky mr-1">//</span> {{ t('historyTitle') }}
            </h3>
            <ul class="space-y-2">
              <li
                v-for="(entry, i) in history"
                :key="i"
                class="flex items-center gap-3 border-b border-border-default pb-2 last:border-0"
              >
                <span class="text-lg">{{ entry.fruit }}</span>
                <span class="text-sm text-text-primary">{{ entry.name }}</span>
                <span class="ml-auto text-xs text-text-dim"> #{{ history.length - i }} </span>
              </li>
            </ul>
          </div>

          <!-- Participant list -->
          <div
            v-if="activeParticipants.length > 0"
            class="border border-border-default bg-bg-surface p-5"
          >
            <h3 class="mb-3 font-display text-sm font-semibold text-text-secondary">
              <span class="text-accent-amber mr-1">//</span> {{ t('listTitle') }}
            </h3>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="p in activeParticipants"
                :key="p.name"
                class="inline-flex items-center gap-1.5 border border-border-default bg-bg-deep px-3 py-1 text-xs text-text-primary"
              >
                <span>{{ p.fruit }}</span>
                {{ p.name }}
              </span>
            </div>
          </div>
        </div>

        <!-- Right Panel: Wheel -->
        <div class="flex flex-col items-center gap-6 animate-fade-up animate-delay-2">
          <!-- Wheel container -->
          <div class="wheel-wrapper relative">
            <!-- Pointer -->
            <div
              class="pointer-container absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1"
            >
              <svg width="30" height="30" viewBox="0 0 30 30">
                <polygon points="15,28 4,4 26,4" fill="#FF6B4A" stroke="#0F1923" stroke-width="2" />
              </svg>
            </div>

            <!-- SVG Wheel -->
            <svg
              :width="WHEEL_SIZE"
              :height="WHEEL_SIZE"
              :viewBox="`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`"
              class="wheel-svg drop-shadow-2xl"
              :class="{ 'wheel-pulse': winner && !isSpinning }"
            >
              <!-- Outer ring -->
              <circle
                :cx="WHEEL_CENTER"
                :cy="WHEEL_CENTER"
                :r="WHEEL_RADIUS + 3"
                fill="none"
                stroke="#253549"
                stroke-width="6"
              />
              <g :style="{ transform: `rotate(${currentRotation}deg)`, transformOrigin: 'center' }">
                <template v-if="segments.length > 0">
                  <g v-for="(seg, i) in segments" :key="i">
                    <path :d="seg.path" :fill="seg.color" stroke="#0F1923" stroke-width="1" />
                    <text
                      :x="seg.textX"
                      :y="seg.textY"
                      :fill="seg.textColor"
                      font-family="'Be Vietnam Pro', sans-serif"
                      font-weight="600"
                      text-anchor="middle"
                      dominant-baseline="central"
                      :transform="`rotate(${seg.textRotation}, ${seg.textX}, ${seg.textY})`"
                    >
                      <tspan :x="seg.textX" :font-size="seg.emojiSize" dy="-0.4em">
                        {{ seg.fruit }}
                      </tspan>
                      <tspan :x="seg.textX" :font-size="seg.fontSize" dy="1.7em">
                        {{ seg.displayName }}
                      </tspan>
                    </text>
                  </g>
                </template>
                <template v-else>
                  <circle :cx="WHEEL_CENTER" :cy="WHEEL_CENTER" :r="WHEEL_RADIUS" fill="#162232" />
                  <text
                    :x="WHEEL_CENTER"
                    :y="WHEEL_CENTER"
                    fill="#4A6180"
                    font-size="14"
                    text-anchor="middle"
                    dominant-baseline="central"
                  >
                    {{ t('wheelPlaceholder') }}
                  </text>
                </template>
              </g>
              <!-- Center dot -->
              <circle
                :cx="WHEEL_CENTER"
                :cy="WHEEL_CENTER"
                r="14"
                fill="#0F1923"
                stroke="#253549"
                stroke-width="3"
              />
              <circle :cx="WHEEL_CENTER" :cy="WHEEL_CENTER" r="6" fill="#FF6B4A" />
            </svg>
          </div>

          <!-- Spin button -->
          <button
            type="button"
            :disabled="!canSpin"
            class="spin-button font-display text-base font-bold tracking-widest uppercase transition-all"
            :class="isSpinning ? 'is-spinning' : ''"
            @click="spin"
            @keydown.enter.prevent="spin"
            @keydown.space.prevent="spin"
            :aria-label="isSpinning ? t('spinning') : t('spin')"
          >
            <span v-if="isSpinning" class="inline-flex items-center gap-2">
              <svg class="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                />
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              {{ t('spinning') }}
            </span>
            <span v-else>🎰 {{ t('spin') }}</span>
          </button>
        </div>
      </div>
    </main>

    <!-- Winner Popup -->
    <Teleport to="body">
      <Transition name="popup">
        <div
          v-if="showPopup && winner"
          class="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          @click.self="closePopup"
          @keydown="handlePopupKeydown"
        >
          <div
            ref="popupRef"
            tabindex="-1"
            class="popup-card relative mx-4 w-full max-w-sm border border-border-default bg-bg-surface p-8 text-center"
            :style="{ borderTopColor: winner.color, borderTopWidth: '4px' }"
            role="dialog"
            aria-modal="true"
            aria-labelledby="winner-title"
          >
            <!-- Celebration title -->
            <p id="winner-title" class="font-display text-2xl font-bold text-accent-coral">
              {{ t('congrats') }}
            </p>

            <!-- Winner fruit avatar -->
            <div
              class="mx-auto mt-5 flex h-20 w-20 items-center justify-center rounded-full text-5xl"
              :style="{ backgroundColor: winner.color + '20' }"
            >
              {{ winner.fruit }}
            </div>

            <!-- Winner name -->
            <p class="mt-4 font-display text-3xl font-bold text-text-primary">
              {{ winner.name }}
            </p>
            <p class="mt-2 text-sm text-text-secondary">
              {{ t('chosenOne') }}
            </p>

            <!-- Actions -->
            <div class="mt-8 flex justify-center gap-4">
              <button
                type="button"
                class="border border-border-default bg-bg-deep px-6 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
                @click="closePopup"
              >
                {{ t('close') }}
              </button>
              <button
                type="button"
                class="bg-accent-coral px-6 py-2 text-sm font-semibold text-bg-deep transition hover:brightness-110"
                @click="spinAgain"
              >
                {{ t('spinAgain') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Footer -->
    <footer class="border-t border-border-default py-4 text-center text-xs text-text-dim">
      {{ t('createdBy') }}
      <a
        href="https://www.facebook.com/thanhhoa214"
        target="_blank"
        rel="noopener noreferrer"
        class="text-accent-sky transition hover:text-accent-coral"
      >
        Nguyễn Thanh Hoà
      </a>
    </footer>
  </div>
</template>

<style scoped>
/* ── Wheel ──────────────────────────────────────────── */
.wheel-wrapper {
  width: min(360px, calc(100vw - 3rem));
  height: min(360px, calc(100vw - 3rem));
}

.wheel-svg {
  width: 100%;
  height: 100%;
}

.wheel-pulse {
  animation: wheel-scale-pulse 0.6s ease-in-out;
}

@keyframes wheel-scale-pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.04);
  }
  100% {
    transform: scale(1);
  }
}

/* ── Spin Button ────────────────────────────────────── */
.spin-button {
  background: linear-gradient(135deg, #ff6b4a, #ff8800);
  color: #0f1923;
  padding: 14px 48px;
  border: none;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(255, 107, 74, 0.3);
}

.spin-button:hover:not(:disabled) {
  box-shadow: 0 6px 32px rgba(255, 107, 74, 0.5);
  transform: translateY(-2px);
}

.spin-button:active:not(:disabled) {
  transform: translateY(0);
}

.spin-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  box-shadow: none;
}

.spin-button.is-spinning {
  opacity: 0.8;
  cursor: wait;
}

/* ── Popup Transitions ──────────────────────────────── */
.popup-enter-active {
  transition: all 0.3s ease-out;
}
.popup-leave-active {
  transition: all 0.2s ease-in;
}
.popup-enter-from {
  opacity: 0;
}
.popup-enter-from .popup-card {
  transform: scale(0.9) translateY(20px);
}
.popup-leave-to {
  opacity: 0;
}
.popup-leave-to .popup-card {
  transform: scale(0.95);
}

.popup-card {
  transition: transform 0.3s ease-out;
}

/* ── Responsive ─────────────────────────────────────── */
@media (max-width: 1023px) {
  .wheel-wrapper {
    width: min(320px, calc(100vw - 3rem));
    height: min(320px, calc(100vw - 3rem));
  }
}

@media (max-width: 480px) {
  .wheel-wrapper {
    width: min(280px, calc(100vw - 2rem));
    height: min(280px, calc(100vw - 2rem));
  }
}
</style>
