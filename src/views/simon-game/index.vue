<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useEventListener, useLocalStorage } from '@vueuse/core'
import { computed, onBeforeUnmount, ref } from 'vue'
import { RouterLink } from 'vue-router'

type PadId = 0 | 1 | 2 | 3
type GameStatus = 'idle' | 'showing' | 'playing' | 'success' | 'failure'
type SpeedMode = 'relaxed' | 'classic' | 'rapid'

interface PadConfig {
  id: PadId
  label: string
  keyLabel: string
  note: number
  baseClass: string
  glowClass: string
}

const pads = [
  {
    id: 0,
    label: 'Đỏ',
    keyLabel: '1',
    note: 261.63,
    baseClass: 'border-accent-coral bg-accent-coral/18 text-accent-coral',
    glowClass:
      'border-accent-coral bg-accent-coral/90 text-bg-deep shadow-[0_0_40px_rgba(255,107,74,0.35)]',
  },
  {
    id: 1,
    label: 'Vàng',
    keyLabel: '2',
    note: 329.63,
    baseClass: 'border-accent-amber bg-accent-amber/18 text-accent-amber',
    glowClass:
      'border-accent-amber bg-accent-amber/92 text-bg-deep shadow-[0_0_40px_rgba(255,184,48,0.35)]',
  },
  {
    id: 2,
    label: 'Xanh',
    keyLabel: '3',
    note: 392,
    baseClass: 'border-accent-sky bg-accent-sky/18 text-accent-sky',
    glowClass:
      'border-accent-sky bg-accent-sky/90 text-bg-deep shadow-[0_0_40px_rgba(56,189,248,0.35)]',
  },
  {
    id: 3,
    label: 'Cam',
    keyLabel: '4',
    note: 523.25,
    baseClass: 'border-[#ff8f6b] bg-[#ff8f6b]/16 text-[#ff8f6b]',
    glowClass:
      'border-[#ff8f6b] bg-[#ff8f6b]/92 text-bg-deep shadow-[0_0_40px_rgba(255,143,107,0.35)]',
  },
] as const satisfies readonly [PadConfig, PadConfig, PadConfig, PadConfig]

const speedOptions: Record<SpeedMode, { label: string; duration: number; gap: number }> = {
  relaxed: {
    label: 'Chậm',
    duration: 540,
    gap: 220,
  },
  classic: {
    label: 'Chuẩn',
    duration: 420,
    gap: 160,
  },
  rapid: {
    label: 'Nhanh',
    duration: 320,
    gap: 110,
  },
}

const speedEntries = [
  {
    key: 'relaxed',
    label: speedOptions.relaxed.label,
  },
  {
    key: 'classic',
    label: speedOptions.classic.label,
  },
  {
    key: 'rapid',
    label: speedOptions.rapid.label,
  },
] as const

const authorName = 'DongTranMTA'

const status = ref<GameStatus>('idle')
const sequence = ref<PadId[]>([])
const playerIndex = ref(0)
const round = ref(0)
const activePad = ref<PadId | null>(null)
const strictMode = ref(false)
const soundEnabled = ref(true)
const speed = ref<SpeedMode>('classic')
const message = ref('Nhấn bắt đầu để nghe chuỗi đầu tiên.')
const bestScore = useLocalStorage<number>('simon-game-best-score', 0)

const audioContext = ref<AudioContext | null>(null)
const timeouts = new Set<number>()

const currentScore = computed(() => Math.max(round.value - 1, 0))
const isBusy = computed(() => status.value === 'showing')
const canPlay = computed(() => status.value === 'playing')
const statusLabel = computed(() => {
  if (status.value === 'showing') return 'Simon đang phát chuỗi'

  if (status.value === 'playing') return 'Đến lượt bạn'

  if (status.value === 'success') return 'Chuẩn luôn'

  if (status.value === 'failure') return 'Sai mất rồi'

  return 'Sẵn sàng'
})

function clearScheduledTasks() {
  for (const timeoutId of timeouts) window.clearTimeout(timeoutId)

  timeouts.clear()
}

function scheduleTask(callback: () => void, delay: number) {
  const timeoutId = window.setTimeout(() => {
    timeouts.delete(timeoutId)
    callback()
  }, delay)

  timeouts.add(timeoutId)
}

function ensureAudioContext() {
  if (!soundEnabled.value || typeof window === 'undefined' || typeof AudioContext === 'undefined')
    return null

  if (!audioContext.value) audioContext.value = new AudioContext()

  if (audioContext.value.state === 'suspended') void audioContext.value.resume()

  return audioContext.value
}

function playTone(padId: PadId, duration: number) {
  if (!soundEnabled.value) return

  const context = ensureAudioContext()

  if (!context) return

  const oscillator = context.createOscillator()
  const gainNode = context.createGain()
  const now = context.currentTime

  oscillator.type = 'sine'
  oscillator.frequency.value = pads[padId].note

  gainNode.gain.setValueAtTime(0.0001, now)
  gainNode.gain.exponentialRampToValueAtTime(0.12, now + 0.02)
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration / 1000)

  oscillator.connect(gainNode)
  gainNode.connect(context.destination)
  oscillator.start(now)
  oscillator.stop(now + duration / 1000 + 0.03)
}

function pulsePad(padId: PadId, duration: number) {
  activePad.value = padId
  playTone(padId, duration)

  scheduleTask(() => {
    if (activePad.value === padId) activePad.value = null
  }, duration)
}

function randomPad(): PadId {
  return Math.floor(Math.random() * pads.length) as PadId
}

function handleSuccessState() {
  status.value = 'success'
  message.value = 'Bạn lặp lại chính xác. Chuẩn bị cho lượt tiếp theo.'

  scheduleTask(() => {
    beginRound()
  }, 850)
}

function handleFailureState() {
  status.value = 'failure'
  activePad.value = null
  message.value = strictMode.value
    ? 'Sai thứ tự. Chế độ nghiêm khắc sẽ khởi động lại từ đầu.'
    : 'Sai rồi. Nhấn chơi lại để thử chuỗi mới.'

  if (currentScore.value > bestScore.value) bestScore.value = currentScore.value

  if (strictMode.value) {
    scheduleTask(() => {
      startGame()
    }, 1200)
  }
}

function playSequence() {
  status.value = 'showing'
  activePad.value = null
  playerIndex.value = 0
  message.value = `Ghi nhớ ${sequence.value.length} bước và chuẩn bị lặp lại.`

  const { duration, gap } = speedOptions[speed.value]

  sequence.value.forEach((padId, index) => {
    const startAt = index * (duration + gap)

    scheduleTask(() => {
      pulsePad(padId, duration)
    }, startAt)
  })

  scheduleTask(
    () => {
      activePad.value = null
      status.value = 'playing'
      message.value = 'Lặp lại chuỗi bằng cách chạm hoặc bấm phím 1-4.'
    },
    sequence.value.length * (duration + gap) + 120,
  )
}

function beginRound() {
  clearScheduledTasks()
  round.value += 1
  sequence.value.push(randomPad())
  playSequence()
}

function startGame() {
  clearScheduledTasks()
  sequence.value = []
  playerIndex.value = 0
  round.value = 0
  activePad.value = null
  message.value = 'Simon đang chuẩn bị lượt đầu tiên.'
  beginRound()
}

function toggleSound() {
  soundEnabled.value = !soundEnabled.value
}

function toggleStrictMode() {
  strictMode.value = !strictMode.value
}

function setSpeed(mode: SpeedMode) {
  if (isBusy.value) return

  speed.value = mode
}

function handlePadInput(padId: PadId) {
  if (!canPlay.value) return

  pulsePad(padId, 220)

  if (padId !== sequence.value[playerIndex.value]) {
    handleFailureState()
    return
  }

  playerIndex.value += 1

  if (playerIndex.value >= sequence.value.length) handleSuccessState()
}

function pressPad(padId: PadId) {
  handlePadInput(padId)
}

function handlePrimaryAction() {
  if (status.value === 'idle' || status.value === 'failure') startGame()
}

useEventListener(window, 'keydown', (event: KeyboardEvent) => {
  if (event.repeat) return

  if (event.key === 'Enter' || event.key === ' ') {
    if (status.value === 'idle' || status.value === 'failure') {
      event.preventDefault()
      startGame()
    }

    return
  }

  const keyToPad: Record<string, PadId> = {
    '1': 0,
    '2': 1,
    '3': 2,
    '4': 3,
  }

  const nextPad = keyToPad[event.key]

  if (nextPad !== undefined) {
    event.preventDefault()
    handlePadInput(nextPad)
  }
})

onBeforeUnmount(() => {
  clearScheduledTasks()

  if (audioContext.value) {
    void audioContext.value.close()
    audioContext.value = null
  }
})
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary">
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <div class="absolute left-[-6rem] top-20 h-48 w-48 bg-accent-coral/8 blur-3xl" />
      <div class="absolute right-[-4rem] top-32 h-64 w-64 bg-accent-amber/6 blur-3xl" />
    </div>

    <div class="relative mx-auto flex min-h-screen max-w-6xl flex-col px-3 py-3 sm:px-6 sm:py-5">
      <header class="animate-fade-up animate-delay-1">
        <div
          class="flex items-center justify-between gap-3 border border-border-default bg-bg-surface/80 px-3 py-3 backdrop-blur-sm sm:px-4"
        >
          <RouterLink
            to="/"
            class="inline-flex items-center gap-2 text-sm text-text-secondary transition hover:text-text-primary"
          >
            <Icon icon="lucide:arrow-left" class="size-4" />
            <span>Trang chủ</span>
          </RouterLink>

          <div class="text-right">
            <p
              class="font-display text-[10px] tracking-[0.25em] text-accent-amber uppercase sm:text-[11px] sm:tracking-[0.35em]"
            >
              VOL.01 / 2026
            </p>
            <p class="text-[11px] text-text-dim sm:text-xs">Simon ghi nhớ • {{ authorName }}</p>
          </div>
        </div>
      </header>

      <main class="grid flex-1 gap-4 py-4 sm:gap-6 sm:py-5 lg:grid-cols-[minmax(0,1.1fr)_320px]">
        <section
          class="animate-fade-up animate-delay-2 border border-border-default bg-bg-surface p-4 sm:p-6"
        >
          <div
            class="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between"
          >
            <div class="max-w-2xl">
              <p class="mb-3 font-display text-sm tracking-[0.28em] text-accent-coral uppercase">
                // Simon Memory Console
              </p>
              <h1 class="font-display text-4xl font-bold leading-none sm:text-6xl">
                Ghi nhớ
                <span class="text-accent-coral">chuỗi màu</span>
              </h1>
              <p
                class="mt-3 max-w-xl text-sm leading-6 text-text-secondary sm:mt-4 sm:text-base sm:leading-7"
              >
                Simon sẽ phát một chuỗi tín hiệu. Nhiệm vụ của bạn là lặp lại đúng thứ tự bằng cách
                chạm vào các pad màu hoặc bấm phím <span class="text-text-primary">1-4</span>.
              </p>
            </div>

            <div
              class="w-full border border-border-default bg-bg-deep px-4 py-3 text-left sm:w-auto sm:min-w-56 sm:text-right"
            >
              <p class="font-display text-xs tracking-[0.3em] text-text-dim uppercase">
                Trạng thái
              </p>
              <p class="mt-2 font-display text-xl font-semibold text-accent-amber">
                {{ statusLabel }}
              </p>
              <p class="mt-2 text-xs text-text-dim">Tác giả: {{ authorName }}</p>
            </div>
          </div>

          <div class="my-5 flex gap-1.5 overflow-hidden sm:my-6">
            <span v-for="n in 32" :key="n" class="h-1 w-1 rounded-full bg-border-default" />
          </div>

          <div class="grid grid-cols-3 gap-2 sm:gap-4">
            <article class="border border-border-default bg-bg-deep px-3 py-3 sm:px-4 sm:py-4">
              <p class="font-display text-xs tracking-[0.24em] text-text-dim uppercase">
                Điểm hiện tại
              </p>
              <p
                class="mt-2 font-display text-2xl font-bold text-accent-coral tabular-nums sm:mt-3 sm:text-4xl"
              >
                {{ currentScore }}
              </p>
            </article>

            <article class="border border-border-default bg-bg-deep px-3 py-3 sm:px-4 sm:py-4">
              <p class="font-display text-xs tracking-[0.24em] text-text-dim uppercase">
                Kỷ lục cá nhân
              </p>
              <p
                class="mt-2 font-display text-2xl font-bold text-accent-amber tabular-nums sm:mt-3 sm:text-4xl"
              >
                {{ bestScore }}
              </p>
            </article>

            <article class="border border-border-default bg-bg-deep px-3 py-3 sm:px-4 sm:py-4">
              <p class="font-display text-xs tracking-[0.24em] text-text-dim uppercase">Round</p>
              <p
                class="mt-2 font-display text-2xl font-bold text-accent-sky tabular-nums sm:mt-3 sm:text-4xl"
              >
                {{ round }}
              </p>
            </article>
          </div>

          <div class="mt-5 border border-border-default bg-bg-deep p-4 sm:mt-6">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p class="font-display text-sm tracking-[0.22em] text-accent-sky uppercase">
                  // Console Feed
                </p>
                <p class="mt-2 text-sm leading-6 text-text-secondary">
                  {{ message }}
                </p>
              </div>

              <button
                class="inline-flex w-full items-center justify-center gap-2 border border-accent-coral bg-accent-coral px-4 py-2 font-display text-sm font-semibold tracking-[0.18em] text-bg-deep uppercase transition hover:translate-y-[-1px] hover:bg-[#ff7d60] sm:w-auto"
                @click="handlePrimaryAction"
              >
                <Icon
                  :icon="status === 'failure' ? 'lucide:rotate-ccw' : 'lucide:play'"
                  class="size-4"
                />
                <span>{{ status === 'failure' ? 'Chơi lại' : 'Bắt đầu' }}</span>
              </button>
            </div>
          </div>

          <div class="mt-5 grid gap-3 sm:mt-6 sm:grid-cols-2">
            <button
              v-for="pad in pads"
              :key="pad.id"
              class="group relative min-h-32 border-2 p-4 text-left transition duration-200 select-none sm:min-h-48 sm:p-5"
              :class="
                activePad === pad.id ? pad.glowClass : `${pad.baseClass} hover:-translate-y-1`
              "
              :disabled="!canPlay"
              @click="pressPad(pad.id)"
            >
              <span
                class="absolute right-3 top-2 font-display text-5xl font-bold text-current/15 sm:right-4 sm:top-3 sm:text-6xl"
              >
                {{ pad.keyLabel }}
              </span>
              <span class="font-display text-xs tracking-[0.26em] uppercase text-current/70">
                Pad {{ pad.keyLabel }}
              </span>
              <p class="mt-8 font-display text-2xl font-bold sm:mt-10 sm:text-4xl">
                {{ pad.label }}
              </p>
              <div class="mt-4 h-px w-16 bg-current/30" />
              <p
                class="mt-2 max-w-[14rem] text-xs leading-5 text-current/80 sm:mt-3 sm:text-sm sm:leading-6"
              >
                {{ activePad === pad.id ? 'Đang phát sáng' : 'Nhấn khi đến lượt bạn' }}
              </p>
            </button>
          </div>
        </section>

        <aside class="grid gap-4 sm:gap-6">
          <section
            class="animate-fade-up animate-delay-3 border border-border-default bg-bg-surface p-4 sm:p-5"
          >
            <h2
              class="mb-4 flex items-center gap-3 font-display text-xl font-semibold sm:mb-5 sm:text-2xl"
            >
              <span class="font-display text-sm tracking-widest text-accent-amber">//</span>
              Điều khiển
            </h2>

            <div class="space-y-2 text-sm text-text-secondary sm:space-y-3">
              <div
                class="flex items-center justify-between border border-border-default bg-bg-deep px-3 py-2.5 sm:py-3"
              >
                <span>Khởi động nhanh</span>
                <span class="font-display text-text-primary">Enter</span>
              </div>
              <div
                class="flex items-center justify-between border border-border-default bg-bg-deep px-3 py-2.5 sm:py-3"
              >
                <span>Chọn pad</span>
                <span class="font-display text-text-primary">1 / 2 / 3 / 4</span>
              </div>
              <div
                class="flex items-center justify-between border border-border-default bg-bg-deep px-3 py-2.5 sm:py-3"
              >
                <span>Tương tác chuột</span>
                <span class="font-display text-text-primary">Click</span>
              </div>
            </div>
          </section>

          <section
            class="animate-fade-up animate-delay-4 border border-border-default bg-bg-surface p-4 sm:p-5"
          >
            <h2
              class="mb-4 flex items-center gap-3 font-display text-xl font-semibold sm:mb-5 sm:text-2xl"
            >
              <span class="font-display text-sm tracking-widest text-accent-coral">//</span>
              Tùy chọn
            </h2>

            <div>
              <p class="mb-3 font-display text-xs tracking-[0.24em] text-text-dim uppercase">
                Tốc độ
              </p>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="option in speedEntries"
                  :key="option.key"
                  class="border px-2 py-2 text-sm transition sm:px-3"
                  :class="
                    speed === option.key
                      ? 'border-accent-coral bg-accent-coral text-bg-deep'
                      : 'border-border-default bg-bg-deep text-text-secondary hover:border-accent-coral hover:text-text-primary'
                  "
                  @click="setSpeed(option.key)"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>

            <div class="mt-4 space-y-2 sm:mt-5 sm:space-y-3">
              <button
                class="flex w-full items-center justify-between border px-3 py-2.5 text-left text-sm transition sm:py-3"
                :class="
                  strictMode
                    ? 'border-accent-amber bg-accent-amber/12 text-text-primary'
                    : 'border-border-default bg-bg-deep text-text-secondary hover:border-accent-amber'
                "
                @click="toggleStrictMode"
              >
                <span>Chế độ nghiêm khắc</span>
                <span class="font-display uppercase">{{ strictMode ? 'On' : 'Off' }}</span>
              </button>

              <button
                class="flex w-full items-center justify-between border px-3 py-2.5 text-left text-sm transition sm:py-3"
                :class="
                  soundEnabled
                    ? 'border-accent-sky bg-accent-sky/12 text-text-primary'
                    : 'border-border-default bg-bg-deep text-text-secondary hover:border-accent-sky'
                "
                @click="toggleSound"
              >
                <span>Âm thanh</span>
                <span class="font-display uppercase">{{ soundEnabled ? 'On' : 'Off' }}</span>
              </button>
            </div>
          </section>

          <section
            class="animate-fade-up animate-delay-5 border border-border-default bg-bg-surface p-4 sm:p-5"
          >
            <h2
              class="mb-4 flex items-center gap-3 font-display text-xl font-semibold sm:mb-5 sm:text-2xl"
            >
              <span class="font-display text-sm tracking-widest text-accent-sky">//</span>
              Luật chơi
            </h2>

            <div class="space-y-2 text-sm leading-6 text-text-secondary sm:space-y-3 sm:leading-7">
              <p>1. Simon phát một chuỗi màu ngắn rồi tăng thêm một bước sau mỗi round.</p>
              <p>
                2. Bạn chỉ được nhập khi trạng thái chuyển sang
                <span class="text-text-primary">Đến lượt bạn</span>.
              </p>
              <p>
                3. Sai một bước là game kết thúc, hoặc tự khởi động lại nếu bật chế độ nghiêm khắc.
              </p>
            </div>
          </section>
        </aside>
      </main>
    </div>
  </div>
</template>
