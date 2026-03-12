<script setup lang="ts">
import { ref, watch } from 'vue'

interface BuddyStateGuideItem {
  name: string
  trigger: string
  src: string
  oneShot?: boolean
}

const props = defineProps<{
  open: boolean
  states: BuddyStateGuideItem[]
}>()

const emit = defineEmits<{
  close: []
}>()

const previewReplayMap = ref<Record<string, number>>({})
const previewAutoTick = ref(0)
const statePreviewLoopMs = 2800
let statePreviewLoopTimer: number | null = null

function onClose(): void {
  emit('close')
}

function onReplayStatePreview(stateName: string): void {
  previewReplayMap.value = {
    ...previewReplayMap.value,
    [stateName]: (previewReplayMap.value[stateName] ?? 0) + 1,
  }
}

function startStatePreviewLoop(): void {
  if (statePreviewLoopTimer !== null) {
    window.clearInterval(statePreviewLoopTimer)
  }
  statePreviewLoopTimer = window.setInterval(() => {
    previewAutoTick.value += 1
  }, statePreviewLoopMs)
}

function stopStatePreviewLoop(): void {
  if (statePreviewLoopTimer !== null) {
    window.clearInterval(statePreviewLoopTimer)
    statePreviewLoopTimer = null
  }
}

function statePreviewVersion(item: BuddyStateGuideItem): number {
  const manualReplay = previewReplayMap.value[item.name] ?? 0
  return manualReplay + (item.oneShot ? previewAutoTick.value : 0)
}

function statePreviewSrc(item: BuddyStateGuideItem): string {
  const version = statePreviewVersion(item)
  if (version === 0) {
    return item.src
  }
  const divider = item.src.includes('?') ? '&' : '?'
  return `${item.src}${divider}v=${version}`
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      previewAutoTick.value = 0
      startStatePreviewLoop()
      return
    }
    stopStatePreviewLoop()
  },
)
</script>

<template>
  <transition name="buddy-guide">
    <div
      v-if="props.open"
      class="fixed inset-0 z-[90] flex items-center justify-center bg-bg-deep/72 p-4"
      data-buddy-state-guide="true"
      @pointerdown.self="onClose"
    >
      <article
        class="w-full max-w-5xl border border-border-default bg-bg-surface p-5 shadow-2xl sm:p-6"
      >
        <div
          class="mb-3 flex items-center justify-between gap-3 border-b border-border-default pb-2"
        >
          <h3 class="font-display text-lg text-accent-sky sm:text-xl">Pulse Buddy States</h3>
          <button
            type="button"
            class="border border-border-default px-3 py-1 text-xs text-text-secondary transition hover:border-accent-coral hover:text-accent-coral"
            @click="onClose"
          >
            Đóng
          </button>
        </div>

        <p
          class="mb-3 border border-border-default bg-bg-elevated px-3 py-2 text-xs text-text-secondary"
        >
          Note: Bạn có thể xem từng trạng thái để biết lúc nào Pulse Buddy sẽ phản hồi. Đừng ngại
          tương tác với Pulse Buddy nhé, nói nhỏ là click liên tục để chọc cũng vui lắm.
        </p>

        <div class="max-h-[70vh] space-y-3 overflow-auto pr-1">
          <div
            v-for="item in props.states"
            :key="item.name"
            class="grid grid-cols-1 gap-3 border border-border-default bg-bg-elevated px-4 py-3 sm:grid-cols-[148px_1fr] sm:gap-4"
          >
            <div
              class="flex items-center justify-center border border-border-default bg-bg-deep/60 p-2"
            >
              <img
                :key="`${item.name}-${statePreviewVersion(item)}`"
                :src="statePreviewSrc(item)"
                :alt="`${item.name} preview`"
                class="h-28 w-28 object-contain"
                draggable="false"
              />
            </div>
            <div>
              <div class="flex flex-wrap items-center justify-between gap-2">
                <p class="text-base font-medium text-text-primary">{{ item.name }}</p>
                <button
                  type="button"
                  class="border border-border-default px-2.5 py-1 text-xs text-text-secondary transition hover:border-accent-sky hover:text-accent-sky"
                  @click="onReplayStatePreview(item.name)"
                >
                  Replay
                </button>
              </div>
              <p class="mt-1 text-sm text-text-secondary">{{ item.trigger }}</p>
            </div>
          </div>
        </div>

        <p class="mt-4 text-xs text-text-dim">
          Made by
          <a
            href="https://github.com/TranQui004"
            target="_blank"
            rel="noopener noreferrer"
            class="text-accent-amber underline-offset-2 transition hover:underline"
            aria-label="Made by TranQui004"
          >
            TranQui004
          </a>
          . Thiết kế bởi tôi, free to use nhưng nếu muốn sử dụng hãy vui lòng liên hệ nhé.
        </p>
      </article>
    </div>
  </transition>
</template>

<style scoped>
.buddy-guide-enter-active,
.buddy-guide-leave-active {
  transition: opacity 0.14s ease;
}

.buddy-guide-enter-from,
.buddy-guide-leave-to {
  opacity: 0;
}
</style>
