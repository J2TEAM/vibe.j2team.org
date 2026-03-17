<script setup lang="ts">
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { useElementSize, usePreferredReducedMotion } from '@vueuse/core'
import { RouterLink } from 'vue-router'

const nameInput = ref('')
const nameError = ref('')
const names = ref<string[]>([])

const isSpinning = ref(false)
const showWinnerModal = ref(false)
const winnerName = ref('')
const winnerOrder = ref(0)

const showCelebration = ref(false)
const celebrationKey = ref(0)

const viewportRef = ref<HTMLElement | null>(null)
const { width: viewportWidth } = useElementSize(viewportRef)
const prefersReducedMotion = usePreferredReducedMotion()

const trackOffset = ref(0)
const trackTransition = ref('none')
const spinTrackItems = ref<string[]>([])
const spinTrackKey = ref(0)
const spinPhase = ref<'idle' | 'accelerate' | 'decelerate'>('idle')

const idleTrackKey = ref(0)

const itemWidth = 180
const itemGap = 12
const itemStep = itemWidth + itemGap

const randomPalette = ['bg-accent-coral', 'bg-accent-amber', 'bg-accent-sky'] as const

interface ConfettiPiece {
  id: number
  left: number
  delay: number
  duration: number
  colorClass: (typeof randomPalette)[number]
}

const confettiPieces = computed<ConfettiPiece[]>(() => {
  return Array.from({ length: 28 }, (_, index) => ({
    id: index + celebrationKey.value * 100,
    left: Math.random() * 100,
    delay: Math.random() * 0.35,
    duration: 1.6 + Math.random() * 1.2,
    colorClass:
      randomPalette[Math.floor(Math.random() * randomPalette.length)] ?? 'bg-accent-coral',
  }))
})

const hasNames = computed(() => names.value.length > 0)

const singleLoopWidth = computed(() => {
  return names.value.length * itemStep
})

const idleRepeatCount = computed(() => {
  if (!hasNames.value || singleLoopWidth.value <= 0) {
    return 0
  }

  // Keep enough repeated items so viewport never sees the tail gap before reset.
  const viewport = Math.max(viewportWidth.value, itemStep * 2)
  const minimumTrackWidth = singleLoopWidth.value + viewport + itemStep * 2
  return Math.max(3, Math.ceil(minimumTrackWidth / singleLoopWidth.value))
})

const idleTrackItems = computed(() => {
  if (!hasNames.value) {
    return []
  }

  return Array.from({ length: idleRepeatCount.value }, () => names.value).flat()
})

const visibleTrackItems = computed(() => {
  return isSpinning.value ? spinTrackItems.value : idleTrackItems.value
})

const idleLoopDistance = computed(() => {
  return singleLoopWidth.value
})

const canSpin = computed(() => names.value.length > 0 && !isSpinning.value)

const trackStyle = computed<Record<string, string>>(() => {
  const style: Record<string, string> = {
    '--loop-distance': `${idleLoopDistance.value}px`,
    '--loop-duration': '8s',
  }

  if (isSpinning.value) {
    style.transform = `translateX(${trackOffset.value}px)`
    style.transition = trackTransition.value
  }

  return style
})

function restartIdleLoop() {
  if (isSpinning.value) {
    return
  }

  idleTrackKey.value += 1
}

function addName() {
  const trimmed = nameInput.value.trim()
  if (!trimmed) {
    nameError.value = 'Vui lòng nhập tên trước khi thêm.'
    return
  }

  const normalizedName = trimmed.toLocaleLowerCase('vi-VN')
  const hasDuplicate = names.value.some((item) => {
    return item.toLocaleLowerCase('vi-VN') === normalizedName
  })

  if (hasDuplicate) {
    nameError.value = 'Tên này đã có trong danh sách.'
    return
  }

  names.value.push(trimmed)
  nameInput.value = ''
  nameError.value = ''
  restartIdleLoop()
}

function removeName(index: number) {
  if (isSpinning.value) {
    return
  }

  names.value.splice(index, 1)
  restartIdleLoop()
}

function clearAllNames() {
  if (isSpinning.value) {
    return
  }

  names.value = []
  winnerName.value = ''
  winnerOrder.value = 0
  nameError.value = ''
  restartIdleLoop()
}

function startSpin() {
  if (!canSpin.value) {
    return
  }

  const totalNames = names.value.length
  const selectedIndex = Math.floor(Math.random() * totalNames)
  const selected = names.value[selectedIndex]
  if (!selected) {
    return
  }

  winnerName.value = selected
  winnerOrder.value = selectedIndex + 1

  showWinnerModal.value = false

  if (prefersReducedMotion.value === 'reduce') {
    openWinnerResult()
    return
  }

  const turns = 12 + Math.floor(Math.random() * 7)
  const selectedAbsoluteIndex = turns * totalNames + selectedIndex
  // Keep cards after the winning one so it feels centered in a flowing strip, not the last card.
  const trailingItems = Math.max(4, Math.ceil((viewportWidth.value || 320) / itemStep) + 2)
  const totalItems = selectedAbsoluteIndex + 1 + trailingItems
  spinTrackItems.value = Array.from({ length: totalItems }, (_, index) => {
    return names.value[index % totalNames] ?? ''
  })
  spinTrackKey.value += 1

  isSpinning.value = true
  spinPhase.value = 'accelerate'
  trackTransition.value = 'none'
  trackOffset.value = 0

  const center = viewportWidth.value > 0 ? viewportWidth.value / 2 : 320
  const winnerCenter = selectedAbsoluteIndex * itemStep + itemWidth / 2
  const finalOffset = center - winnerCenter
  const accelerateOffset = finalOffset * 0.38

  requestAnimationFrame(() => {
    trackTransition.value = 'transform 700ms cubic-bezier(0.35, 0, 0.9, 0.45)'
    trackOffset.value = accelerateOffset
  })

  // Save final offset on the instance via data attribute source of truth for phase 2.
  finalSpinOffset.value = finalOffset
}

const finalSpinOffset = ref(0)

function onSpinTransitionEnd() {
  if (!isSpinning.value) {
    return
  }

  if (spinPhase.value === 'accelerate') {
    spinPhase.value = 'decelerate'
    trackTransition.value = 'transform 3200ms cubic-bezier(0.08, 0.65, 0.12, 1)'
    trackOffset.value = finalSpinOffset.value
    return
  }

  if (spinPhase.value === 'decelerate') {
    isSpinning.value = false
    spinPhase.value = 'idle'
    trackTransition.value = 'none'
    trackOffset.value = 0
    spinTrackItems.value = []
    restartIdleLoop()
    openWinnerResult()
  }
}

function openWinnerResult() {
  showWinnerModal.value = true
  showCelebration.value = true
  celebrationKey.value += 1

  window.setTimeout(() => {
    showCelebration.value = false
  }, 2500)
}

function closeWinnerModal() {
  showWinnerModal.value = false
}

function spinAgainFromModal() {
  showWinnerModal.value = false
  startSpin()
}
</script>

<template>
  <div class="relative min-h-screen bg-bg-deep text-text-primary">
    <div class="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14">
      <header class="animate-fade-up">
        <p class="mb-3 font-display text-xs tracking-[0.2em] text-accent-amber">// TOOL</p>
        <h1 class="font-display text-4xl font-bold text-accent-coral sm:text-6xl">
          Chọn người đi lấy đồ ăn
        </h1>
        <p class="mt-3 max-w-2xl text-sm text-text-secondary sm:text-base">
          Nhập danh sách tên, bấm quay và để vòng quay ngang chọn ngẫu nhiên 1 người may mắn.
        </p>
      </header>

      <section
        class="animate-fade-up animate-delay-2 border border-border-default bg-bg-surface p-5 sm:p-6"
      >
        <div class="flex flex-col gap-3 sm:flex-row">
          <input
            v-model="nameInput"
            type="text"
            placeholder="Nhập tên đồng đội..."
            class="h-11 flex-1 border border-border-default bg-bg-elevated px-4 text-sm text-text-primary outline-none transition placeholder:text-text-dim focus:border-accent-coral"
            @input="nameError = ''"
            @keyup.enter="addName"
          />
          <button
            type="button"
            class="inline-flex h-11 items-center justify-center gap-2 border border-accent-coral bg-accent-coral px-5 font-display text-sm font-semibold tracking-wide text-bg-deep transition hover:bg-accent-amber hover:border-accent-amber"
            @click="addName"
          >
            <Icon icon="lucide:user-plus" class="size-4" />
            Thêm tên
          </button>
        </div>

        <p v-if="nameError" class="mt-3 text-sm text-accent-coral">
          {{ nameError }}
        </p>

        <div class="mt-4 flex flex-wrap gap-2" v-if="hasNames">
          <div
            v-for="(name, index) in names"
            :key="`${name}-${index}`"
            class="inline-flex items-center gap-2 border border-border-default bg-bg-elevated px-3 py-1.5 text-sm"
          >
            <span class="text-text-primary">{{ name }}</span>
            <button
              type="button"
              class="text-text-dim transition hover:text-accent-coral disabled:cursor-not-allowed"
              :disabled="isSpinning"
              @click="removeName(index)"
              aria-label="Xoá tên"
            >
              <Icon icon="lucide:x" class="size-4" />
            </button>
          </div>
        </div>

        <p v-else class="mt-4 text-sm text-text-dim">Chưa có tên nào. Hãy thêm ít nhất 1 người.</p>

        <div class="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            class="inline-flex h-11 items-center justify-center gap-2 border border-accent-amber bg-accent-amber px-6 font-display text-sm font-semibold tracking-wide text-bg-deep transition hover:border-accent-coral hover:bg-accent-coral disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="!canSpin"
            @click="startSpin"
          >
            <Icon icon="lucide:rotate-cw" class="size-4" :class="{ 'animate-spin': isSpinning }" />
            {{ isSpinning ? 'Đang quay...' : 'Quay ngay' }}
          </button>

          <button
            type="button"
            class="inline-flex h-11 items-center justify-center gap-2 border border-border-default bg-bg-elevated px-5 font-display text-sm tracking-wide text-text-secondary transition hover:border-accent-coral hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="!hasNames || isSpinning"
            @click="clearAllNames"
          >
            <Icon icon="lucide:trash-2" class="size-4" />
            Xoá danh sách
          </button>
        </div>
      </section>

      <section
        class="animate-fade-up animate-delay-3 border border-border-default bg-bg-surface p-5 sm:p-6"
      >
        <h2 class="mb-4 flex items-center gap-3 font-display text-xl font-semibold">
          <span class="text-xs tracking-[0.2em] text-accent-sky">//</span>
          Vòng quay ngang
        </h2>

        <div
          ref="viewportRef"
          class="relative overflow-hidden border border-border-default bg-bg-elevated py-6"
        >
          <div
            class="pointer-events-none absolute inset-y-0 left-0 w-16 bg-linear-to-r from-bg-elevated to-transparent"
          />
          <div
            class="pointer-events-none absolute inset-y-0 right-0 w-16 bg-linear-to-l from-bg-elevated to-transparent"
          />

          <div
            class="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2"
          >
            <div class="h-16 w-0.5 bg-accent-coral" />
          </div>

          <div
            :key="isSpinning ? `spin-${spinTrackKey}` : `idle-${idleTrackKey}`"
            class="relative flex w-max gap-3 px-6"
            :class="{
              'animate-infinite-slide': !isSpinning && hasNames,
            }"
            :style="trackStyle"
            @transitionend="onSpinTransitionEnd"
          >
            <div
              v-for="(name, index) in visibleTrackItems"
              :key="`${name}-${index}`"
              class="flex h-16 w-45 shrink-0 items-center justify-center border border-border-default bg-bg-surface px-4 text-center font-display text-base font-semibold text-text-primary"
            >
              {{ name }}
            </div>
          </div>

          <p
            v-if="!hasNames"
            class="absolute inset-0 flex items-center justify-center px-4 text-center text-sm text-text-dim"
          >
            Thêm tên để hiển thị vòng quay ngang.
          </p>
        </div>
      </section>

      <RouterLink
        to="/"
        class="animate-fade-up animate-delay-4 inline-flex w-fit items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
      >
        <Icon icon="lucide:arrow-left" class="size-4" />
        Về trang chủ
      </RouterLink>
    </div>

    <Teleport to="body">
      <div
        v-if="showWinnerModal"
        class="fixed inset-0 z-60 flex items-center justify-center bg-bg-deep/80 px-4"
      >
        <div class="w-full max-w-md border border-border-default bg-bg-surface p-6">
          <p class="text-xs tracking-[0.2em] text-accent-amber">// KẾT QUẢ</p>
          <h3 class="mt-2 font-display text-3xl font-bold text-accent-coral">Chúc mừng!</h3>
          <p class="mt-3 text-sm text-text-secondary">Người được chọn đi lấy đồ ăn là:</p>
          <p
            class="mt-4 border border-accent-coral bg-bg-elevated px-4 py-3 text-center font-display text-2xl font-bold text-text-primary"
          >
            {{ winnerName }}
          </p>
          <p class="mt-3 text-center text-xs text-text-dim">
            Vị trí trong danh sách: #{{ winnerOrder }}
          </p>

          <div class="mt-6 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              class="inline-flex h-10 items-center justify-center gap-2 border border-accent-amber bg-accent-amber px-5 font-display text-sm font-semibold text-bg-deep transition hover:border-accent-coral hover:bg-accent-coral disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="!canSpin"
              @click="spinAgainFromModal"
            >
              <Icon icon="lucide:rotate-cw" class="size-4" />
              Quay lại lần nữa
            </button>

            <button
              type="button"
              class="inline-flex h-10 items-center justify-center gap-2 border border-accent-coral bg-accent-coral px-5 font-display text-sm font-semibold text-bg-deep transition hover:border-accent-amber hover:bg-accent-amber"
              @click="closeWinnerModal"
            >
              <Icon icon="lucide:party-popper" class="size-4" />
              Đóng
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <div
      v-if="showCelebration"
      :key="celebrationKey"
      class="pointer-events-none fixed inset-0 z-55 overflow-hidden"
    >
      <div
        v-for="piece in confettiPieces"
        :key="piece.id"
        class="confetti-piece absolute -top-3 h-3 w-2"
        :class="piece.colorClass"
        :style="{
          left: `${piece.left}%`,
          animationDelay: `${piece.delay}s`,
          animationDuration: `${piece.duration}s`,
        }"
      />
    </div>
  </div>
</template>

<style scoped>
@keyframes infinite-slide {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(calc(var(--loop-distance, 0px) * -1));
  }
}

@keyframes confetti-fall {
  0% {
    transform: translateY(-2vh) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  100% {
    transform: translateY(110vh) rotate(540deg);
    opacity: 0;
  }
}

.animate-infinite-slide {
  animation: infinite-slide var(--loop-duration, 8s) linear infinite;
}

.confetti-piece {
  animation-name: confetti-fall;
  animation-timing-function: ease-out;
  animation-fill-mode: both;
}
</style>
