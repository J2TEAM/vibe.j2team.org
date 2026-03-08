<script setup lang="ts">
import { ref, watch } from 'vue'
import type { CSSProperties } from 'vue'

defineProps<{
  open: boolean
  surfaceClass: string
  panelInnerClass: string
  textMutedClass: string
  creditsTransformStyle: CSSProperties
  gravityUnlocked: boolean
  easterMessage: string
}>()

const emit = defineEmits<{
  close: []
  unlock: []
  'bind:creditsContainer': [value: HTMLElement | null]
  'bind:creditsContent': [value: HTMLElement | null]
  'bind:creditsEasterButton': [value: HTMLElement | null]
  'start-boost': []
  'stop-boost': []
}>()

const localContainerRef = ref<HTMLElement | null>(null)
const localContentRef = ref<HTMLElement | null>(null)
const localEasterButtonRef = ref<HTMLElement | null>(null)

watch(
  localContainerRef,
  (value) => {
    emit('bind:creditsContainer', value)
  },
  { immediate: true },
)

watch(
  localContentRef,
  (value) => {
    emit('bind:creditsContent', value)
  },
  { immediate: true },
)

watch(
  localEasterButtonRef,
  (value) => {
    emit('bind:creditsEasterButton', value)
  },
  { immediate: true },
)
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-bg-deep/85 px-4">
    <div class="w-full max-w-lg overflow-hidden border p-5" :class="surfaceClass">
      <h2 class="font-display text-xl font-semibold text-accent-coral">Credit</h2>
      <div
        ref="localContainerRef"
        class="relative mt-4 h-56 overflow-hidden border"
        :class="panelInnerClass"
        @mousedown="emit('start-boost')"
        @mouseup="emit('stop-boost')"
        @mouseleave="emit('stop-boost')"
        @touchstart="emit('start-boost')"
        @touchend="emit('stop-boost')"
        @touchcancel="emit('stop-boost')"
      >
        <div ref="localContentRef" class="credits-scroll px-4 py-3 text-center text-sm" :style="creditsTransformStyle">
          <p class="font-display text-accent-amber">// Pikachu Puzzle</p>
          <p class="mt-4 text-accent-coral">Ý tưởng</p>
          <p>Gemini</p>
          <p class="mt-4 text-accent-coral">Coding</p>
          <p>CodeX</p>
          <p class="mt-4 text-accent-coral">Nhạc</p>
          <p>Gemini (Lyria) + Online Audio Joiner</p>
          <p class="mt-4 text-accent-coral">Người ngồi xem</p>
          <p>Tôi</p>
          <p class="mt-4" :class="textMutedClass">Cảm ơn vì đã chơi.</p>
          <p class="mt-80" :class="textMutedClass">Hết rồi, đừng xem nữa</p>
          <p class="mt-56" :class="textMutedClass">Đã bảo đừng xem nữa, chơi game đi</p>
          <p class="mt-56" :class="textMutedClass">...</p>
          <button
            ref="localEasterButtonRef"
            type="button"
            class="mt-56 border px-2 py-1 text-xs transition hover:border-accent-coral"
            :class="panelInnerClass"
            @click="emit('unlock')"
          >
            Được rồi, đây là Easter Egg
          </button>
        </div>
      </div>

      <div class="mt-4 border p-3" :class="panelInnerClass">
        <p class="text-xs" :class="textMutedClass">
          {{
            gravityUnlocked
              ? 'Gravity mode đã mở khóa. Vào Tạo ván mới để chơi.'
              : 'Mở khóa Gravity mode bằng cách tìm và bấm đúng Easter Egg.'
          }}
        </p>
        <p v-if="easterMessage" class="mt-2 text-xs text-accent-amber">{{ easterMessage }}</p>
      </div>

      <button type="button" class="mt-4 w-full border px-3 py-2 text-sm transition hover:border-accent-coral" :class="panelInnerClass" @click="emit('close')">
        Đóng
      </button>
    </div>
  </div>
</template>

<style scoped>
.credits-scroll {
  will-change: transform;
}
</style>
