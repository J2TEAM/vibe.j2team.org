<script setup lang="ts">
import { useEventListener } from '@vueuse/core'
import { onMounted, ref, watch } from 'vue'
import { useGameStore } from '../stores/gameStore'

const store = useGameStore()
const inputRef = ref<HTMLInputElement | null>(null)
const localText = ref('')
const isShaking = ref(false)
let shakeTimer: number | undefined

watch(
  () => store.typedText,
  (val) => {
    if (val === '') localText.value = ''
  },
)

function onInput() {
  const text = localText.value.toLowerCase().trim()
  store.handleInput(text)
}

function focusInput() {
  inputRef.value?.focus()
}

onMounted(() => focusInput())

useEventListener(window, 'keydown', (e) => {
  if (!store.isPlaying) return

  // Quick power-up hotkeys without polluting typed words
  if (e.altKey) {
    if (e.key === '1') store.activatePowerUp('slow')
    if (e.key === '2') store.activatePowerUp('auto')
    if (e.key === '3') store.activatePowerUp('bomb')
    if (e.key === '4') store.activatePowerUp('double')
  }

  if (document.activeElement !== inputRef.value) focusInput()
})

useEventListener(inputRef, 'blur', () => {
  if (!store.isPlaying) return
  window.setTimeout(() => focusInput(), 0)
})

watch(
  () => store.mistakePulse,
  (v, prev) => {
    if (prev !== undefined && v !== prev) {
      isShaking.value = true
      if (shakeTimer) window.clearTimeout(shakeTimer)
      shakeTimer = window.setTimeout(() => {
        isShaking.value = false
      }, 160)
    }
  },
)

defineExpose({ focusInput })
</script>

<template>
  <div
    class="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-3 border-t border-border-default bg-bg-surface"
    @click="focusInput"
  >
    <span class="text-accent-coral text-xs font-display shrink-0 tracking-widest uppercase">
      &gt;_
    </span>
    <input
      ref="inputRef"
      v-model="localText"
      type="text"
      inputmode="text"
      autocomplete="off"
      autocapitalize="off"
      spellcheck="false"
      placeholder="Gõ từ để tiêu diệt zombie..."
      class="flex-1 bg-transparent text-text-primary text-sm sm:text-lg font-body placeholder-text-dim outline-none border-none caret-accent-coral tracking-wide uppercase typing-input"
      :class="isShaking ? 'is-shaking' : ''"
      :disabled="!store.isPlaying"
      @input="onInput"
    />
    <span v-if="localText" class="text-accent-sky text-xs font-display tracking-widest">
      {{ localText.length }} ký tự
    </span>
  </div>
</template>

<style scoped>
.typing-input {
  animation: none;
}

.typing-input:disabled {
  opacity: 0.6;
}

.typing-input.is-shaking {
  animation: inputShake 150ms ease-out both;
}

@keyframes inputShake {
  0% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-2px);
  }
  50% {
    transform: translateX(2px);
  }
  75% {
    transform: translateX(-1px);
  }
  100% {
    transform: translateX(0);
  }
}
</style>
