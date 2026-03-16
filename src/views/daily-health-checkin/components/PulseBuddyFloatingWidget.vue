<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useDraggable, useLocalStorage, useWindowSize } from '@vueuse/core'
import PulseBuddyStateGuidePopup from './PulseBuddyStateGuidePopup.vue'

const props = defineProps<{
  imageSrc: string
  stateText: string
  idleImageSrc?: string
  reminderImageSrc?: string
  savedImageSrc?: string
  goodStreakImageSrc?: string
  greetTalkImageSrc?: string
  dragStartImageSrc?: string
  draggingImageSrc?: string
  dragReleaseImageSrc?: string
  contextMenuImageSrc?: string
  reappearImageSrc?: string
  annoyedImageSrc?: string
}>()

const emit = defineEmits<{
  hide: []
}>()

type BuddySize = 'sm' | 'md' | 'lg'

const sizeToPx: Record<BuddySize, number> = {
  sm: 132,
  md: 152,
  lg: 176,
}

const widgetRef = ref<HTMLElement | null>(null)
const { width, height } = useWindowSize()
const buddySize = useLocalStorage<BuddySize>('daily-health-checkin.buddy-size', 'md')
const contextMenuVisible = ref(false)
const isStateGuideOpen = ref(false)
const contextMenuX = ref(0)
const contextMenuY = ref(0)
const contextMenuOpenedAt = ref(0)
const interactionMode = ref<
  'none' | 'drag-start' | 'dragging' | 'drag-release' | 'context-menu' | 'reappear'
>('none')
const wasDragging = ref(false)
const interactionTimer = ref<number | null>(null)
const annoyedTimer = ref<number | null>(null)
const isAnnoyed = ref(false)
const annoyedRunId = ref(0)
const rapidClickStreak = ref(0)
const lastRapidClickAt = ref(0)
const activePointerId = ref<number | null>(null)
const pointerDownAt = ref(0)
const pointerDownX = ref(0)
const pointerDownY = ref(0)
const pointerMovedDistance = ref(0)

const contextMenuWidth = 196
const contextMenuHeight = 232
const clickSpamGapMs = 1200
const clickSpamThreshold = 3
const annoyedDurationMs = 2500
const clickMaxMovePx = 8
const clickMaxDurationMs = 320
const dragIntentMovePx = 10

const buddyStateGuide = computed<
  Array<{ name: string; trigger: string; src: string; oneShot?: boolean }>
>(() => [
  {
    name: 'Idle',
    trigger: 'Mặc định khi không có điều kiện ưu tiên khác.',
    src: props.idleImageSrc ?? props.imageSrc,
  },
  {
    name: 'Reminder',
    trigger: 'Khi completion trong ngày còn thấp (<= 1 chỉ số).',
    src: props.reminderImageSrc ?? props.imageSrc,
  },
  {
    name: 'Saved',
    trigger: 'Ngay sau khi người dùng lưu check-in thành công.',
    src: props.savedImageSrc ?? props.imageSrc,
    oneShot: true,
  },
  {
    name: 'Good Streak',
    trigger: 'Khi streak >= 7 ngày và completion hôm nay >= 3.',
    src: props.goodStreakImageSrc ?? props.imageSrc,
  },
  {
    name: 'Greet Talk',
    trigger: 'Kích hoạt theo timer chào định kỳ khi đang hiển thị buddy.',
    src: props.greetTalkImageSrc ?? props.imageSrc,
  },
  {
    name: 'Drag Start',
    trigger: 'Khi bắt đầu kéo và vượt ngưỡng drag intent.',
    src: props.dragStartImageSrc ?? props.imageSrc,
    oneShot: true,
  },
  {
    name: 'Dragging',
    trigger: 'Trong lúc đang kéo buddy.',
    src: props.draggingImageSrc ?? props.imageSrc,
  },
  {
    name: 'Drag Release',
    trigger: 'Ngay khi thả kéo buddy.',
    src: props.dragReleaseImageSrc ?? props.imageSrc,
    oneShot: true,
  },
  {
    name: 'Reappear',
    trigger: 'Khi buddy vừa hiện lại từ trạng thái ẩn.',
    src: props.reappearImageSrc ?? props.imageSrc,
    oneShot: true,
  },
  {
    name: 'Annoyed',
    trigger: 'Khi click nhanh liên tiếp đạt ngưỡng spam click.',
    src: props.annoyedImageSrc ?? props.imageSrc,
    oneShot: true,
  },
])

const buddyPixelSize = computed(() => sizeToPx[buddySize.value])
const widgetWidth = computed(() => buddyPixelSize.value + 12)
const widgetHeight = computed(() => buddyPixelSize.value + 12)
const topSafePadding = computed(() => Math.max(124, Math.round(buddyPixelSize.value * 0.8)))

const { x, y, isDragging } = useDraggable(widgetRef, {
  initialValue: { x: 20, y: 360 },
  preventDefault: true,
  stopPropagation: true,
})

const clampedX = computed(() => {
  const maxX = Math.max(10, width.value - widgetWidth.value - 10)
  return Math.min(Math.max(10, x.value), maxX)
})

const clampedY = computed(() => {
  const maxY = Math.max(10, height.value - widgetHeight.value - 10)
  return Math.min(Math.max(topSafePadding.value, y.value), maxY)
})

const styleObject = computed(() => ({
  left: `${clampedX.value}px`,
  top: `${clampedY.value}px`,
}))

const contextMenuStyle = computed(() => ({
  left: `${contextMenuX.value}px`,
  top: `${contextMenuY.value}px`,
}))

const imageToRender = computed(() => {
  if (isAnnoyed.value) {
    return props.annoyedImageSrc ?? props.imageSrc
  }

  switch (interactionMode.value) {
    case 'drag-start':
      return props.dragStartImageSrc ?? props.draggingImageSrc ?? props.imageSrc
    case 'dragging':
      return props.draggingImageSrc ?? props.imageSrc
    case 'drag-release':
      return props.dragReleaseImageSrc ?? props.imageSrc
    case 'reappear':
      return props.reappearImageSrc ?? props.imageSrc
    default:
      return props.imageSrc
  }
})

const imageRenderKey = computed(() => {
  if (isAnnoyed.value) {
    return `annoyed-${annoyedRunId.value}`
  }
  return `base-${interactionMode.value}-${imageToRender.value}`
})

function clearInteractionTimer(): void {
  if (interactionTimer.value !== null) {
    window.clearTimeout(interactionTimer.value)
    interactionTimer.value = null
  }
}

function clearAnnoyedTimer(): void {
  if (annoyedTimer.value !== null) {
    window.clearTimeout(annoyedTimer.value)
    annoyedTimer.value = null
  }
}

function setInteraction(mode: typeof interactionMode.value, durationMs?: number): void {
  clearInteractionTimer()
  interactionMode.value = mode
  if (durationMs && durationMs > 0) {
    interactionTimer.value = window.setTimeout(() => {
      interactionMode.value = 'none'
      interactionTimer.value = null
    }, durationMs)
  }
}

function hideContextMenu(): void {
  contextMenuVisible.value = false
  if (interactionMode.value === 'context-menu') {
    interactionMode.value = 'none'
  }
}

function onContextMenu(event: MouseEvent): void {
  if (isAnnoyed.value) {
    event.preventDefault()
    return
  }

  event.preventDefault()
  event.stopPropagation()
  const nextX = Math.min(event.clientX, Math.max(8, width.value - contextMenuWidth - 8))
  const nextY = Math.min(event.clientY, Math.max(8, height.value - contextMenuHeight - 8))

  contextMenuX.value = nextX
  contextMenuY.value = nextY
  contextMenuOpenedAt.value = Date.now()
  contextMenuVisible.value = true
  setInteraction('context-menu')
}

function onHideFromContextMenu(event?: MouseEvent): void {
  if (event && event.button !== 0) {
    return
  }
  if (Date.now() - contextMenuOpenedAt.value < 180) {
    return
  }
  hideContextMenu()
  emit('hide')
}

function onSetSize(size: BuddySize): void {
  buddySize.value = size
}

function onResetPosition(): void {
  x.value = 20
  y.value = Math.max(topSafePadding.value, 360)
  hideContextMenu()
}

function onGlobalPointerDown(event: PointerEvent): void {
  const target = event.target as HTMLElement | null
  if (contextMenuVisible.value && !target?.closest('[data-buddy-context-menu="true"]')) {
    hideContextMenu()
  }

  if (isStateGuideOpen.value && !target?.closest('[data-buddy-state-guide="true"]')) {
    isStateGuideOpen.value = false
  }
}

function onGlobalPointerMove(event: PointerEvent): void {
  if (activePointerId.value === null || event.pointerId !== activePointerId.value) {
    return
  }

  const deltaX = event.clientX - pointerDownX.value
  const deltaY = event.clientY - pointerDownY.value
  pointerMovedDistance.value = Math.hypot(deltaX, deltaY)

  if (
    isDragging.value &&
    !isAnnoyed.value &&
    pointerMovedDistance.value > dragIntentMovePx &&
    interactionMode.value !== 'drag-start' &&
    interactionMode.value !== 'dragging'
  ) {
    setInteraction('drag-start', 140)
    window.setTimeout(() => {
      if (isDragging.value && pointerMovedDistance.value > dragIntentMovePx) {
        interactionMode.value = 'dragging'
      }
    }, 140)
  }
}

function resetPointerIntent(): void {
  activePointerId.value = null
  pointerDownAt.value = 0
  pointerMovedDistance.value = 0
}

function onGlobalPointerUp(event: PointerEvent): void {
  if (activePointerId.value === null || event.pointerId !== activePointerId.value) {
    return
  }

  const clickDuration = Date.now() - pointerDownAt.value
  const isClickIntent =
    pointerMovedDistance.value <= clickMaxMovePx && clickDuration <= clickMaxDurationMs

  if (isClickIntent && !contextMenuVisible.value && !isStateGuideOpen.value) {
    registerRapidClick()
  }

  resetPointerIntent()
}

function onGlobalPointerCancel(event: PointerEvent): void {
  if (activePointerId.value !== null && event.pointerId === activePointerId.value) {
    resetPointerIntent()
  }
}

function onGlobalKeyDown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    isStateGuideOpen.value = false
    hideContextMenu()
  }
}

watch(isDragging, (dragging) => {
  if (isAnnoyed.value) {
    wasDragging.value = dragging
    return
  }

  if (dragging && !wasDragging.value) {
    if (pointerMovedDistance.value <= dragIntentMovePx) {
      wasDragging.value = dragging
      return
    }

    hideContextMenu()
    setInteraction('drag-start', 140)
    window.setTimeout(() => {
      if (isDragging.value && pointerMovedDistance.value > dragIntentMovePx) {
        interactionMode.value = 'dragging'
      }
    }, 140)
  }

  if (!dragging && wasDragging.value) {
    setInteraction('drag-release', 220)
  }

  wasDragging.value = dragging
})

function triggerAnnoyedState(): void {
  hideContextMenu()
  clearInteractionTimer()
  clearAnnoyedTimer()
  interactionMode.value = 'none'
  isAnnoyed.value = true
  annoyedRunId.value += 1
  rapidClickStreak.value = 0
  lastRapidClickAt.value = 0

  annoyedTimer.value = window.setTimeout(() => {
    isAnnoyed.value = false
    annoyedTimer.value = null
  }, annoyedDurationMs)
}

function registerRapidClick(): void {
  const now = Date.now()
  if (now - lastRapidClickAt.value <= clickSpamGapMs) {
    rapidClickStreak.value += 1
  } else {
    rapidClickStreak.value = 1
  }
  lastRapidClickAt.value = now

  if (rapidClickStreak.value >= clickSpamThreshold) {
    triggerAnnoyedState()
  }
}

function onWidgetPointerDownCapture(event: PointerEvent): void {
  if (contextMenuVisible.value || isStateGuideOpen.value || event.button === 2) {
    return
  }

  activePointerId.value = event.pointerId
  pointerDownAt.value = Date.now()
  pointerDownX.value = event.clientX
  pointerDownY.value = event.clientY
  pointerMovedDistance.value = 0
}

function onOpenStateGuide(): void {
  hideContextMenu()
  isStateGuideOpen.value = true
}

function onCloseStateGuide(): void {
  isStateGuideOpen.value = false
}

onMounted(() => {
  if (props.reappearImageSrc) {
    setInteraction('reappear', 700)
  }
  window.addEventListener('pointerdown', onGlobalPointerDown, true)
  window.addEventListener('pointermove', onGlobalPointerMove, true)
  window.addEventListener('pointerup', onGlobalPointerUp, true)
  window.addEventListener('pointercancel', onGlobalPointerCancel, true)
  window.addEventListener('keydown', onGlobalKeyDown)
})

onBeforeUnmount(() => {
  clearInteractionTimer()
  clearAnnoyedTimer()
  window.removeEventListener('pointerdown', onGlobalPointerDown, true)
  window.removeEventListener('pointermove', onGlobalPointerMove, true)
  window.removeEventListener('pointerup', onGlobalPointerUp, true)
  window.removeEventListener('pointercancel', onGlobalPointerCancel, true)
  window.removeEventListener('keydown', onGlobalKeyDown)
})
</script>

<template>
  <div
    ref="widgetRef"
    class="fixed z-50 cursor-grab select-none overflow-visible active:cursor-grabbing"
    :style="styleObject"
    @pointerdown.capture.prevent="onWidgetPointerDownCapture"
    @contextmenu="onContextMenu"
    @dragstart.prevent
  >
    <img
      :key="imageRenderKey"
      :src="imageToRender"
      :alt="props.stateText"
      class="block object-contain transition-transform duration-150"
      :style="{ width: `${buddyPixelSize}px`, height: `${buddyPixelSize}px` }"
      :class="isDragging && !isAnnoyed ? 'scale-[1.06]' : 'scale-100'"
      draggable="false"
    />
  </div>

  <transition name="buddy-menu">
    <div
      v-if="contextMenuVisible"
      data-buddy-context-menu="true"
      class="fixed z-[70] min-w-[196px] border border-border-default bg-bg-surface p-1 shadow-xl"
      :style="contextMenuStyle"
      @pointerdown.stop
    >
      <button
        type="button"
        class="flex w-full items-center gap-2 border border-transparent px-3 py-2 text-left text-sm text-text-secondary transition hover:border-accent-coral hover:text-accent-coral"
        @pointerup.left.prevent.stop="onHideFromContextMenu"
        @click.stop.prevent
        @contextmenu.prevent
      >
        <span class="text-accent-coral">•</span>
        Ẩn Pulse Buddy
      </button>

      <div class="mt-1 border-t border-border-default px-2 pt-2 pb-1">
        <p class="mb-1 text-[11px] tracking-[0.12em] text-text-dim">KÍCH THƯỚC</p>
        <div class="grid grid-cols-3 gap-1">
          <button
            type="button"
            class="border px-2 py-1 text-xs transition"
            :class="
              buddySize === 'sm'
                ? 'border-accent-sky bg-accent-sky/10 text-accent-sky'
                : 'border-border-default text-text-secondary hover:border-accent-sky'
            "
            @click.stop.prevent="onSetSize('sm')"
          >
            Nhỏ
          </button>
          <button
            type="button"
            class="border px-2 py-1 text-xs transition"
            :class="
              buddySize === 'md'
                ? 'border-accent-sky bg-accent-sky/10 text-accent-sky'
                : 'border-border-default text-text-secondary hover:border-accent-sky'
            "
            @click.stop.prevent="onSetSize('md')"
          >
            Vừa
          </button>
          <button
            type="button"
            class="border px-2 py-1 text-xs transition"
            :class="
              buddySize === 'lg'
                ? 'border-accent-sky bg-accent-sky/10 text-accent-sky'
                : 'border-border-default text-text-secondary hover:border-accent-sky'
            "
            @click.stop.prevent="onSetSize('lg')"
          >
            Lớn
          </button>
        </div>

        <button
          type="button"
          class="mt-2 flex w-full items-center justify-center gap-2 border border-border-default px-2 py-1 text-xs text-text-secondary transition hover:border-accent-amber hover:text-accent-amber"
          @click.stop.prevent="onResetPosition"
        >
          Reset vị trí
        </button>

        <button
          type="button"
          class="mt-2 flex w-full items-center justify-center gap-2 border border-border-default px-2 py-1 text-xs text-text-secondary transition hover:border-accent-sky hover:text-accent-sky"
          @click.stop.prevent="onOpenStateGuide"
        >
          Xem trạng thái Pulse Buddy
        </button>
      </div>
    </div>
  </transition>

  <PulseBuddyStateGuidePopup
    :open="isStateGuideOpen"
    :states="buddyStateGuide"
    @close="onCloseStateGuide"
  />
</template>

<style scoped>
.buddy-menu-enter-active,
.buddy-menu-leave-active {
  transition:
    opacity 0.12s ease,
    transform 0.12s ease;
  transform-origin: top left;
}

.buddy-menu-enter-from,
.buddy-menu-leave-to {
  opacity: 0;
  transform: scale(0.96) translateY(-2px);
}
</style>
