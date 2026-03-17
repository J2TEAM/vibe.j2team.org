<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useGameStore } from '../stores/gameStore'

const store = useGameStore()
const inputRef = ref<HTMLInputElement | null>(null)
const localText = ref('')

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

defineExpose({ focusInput })
</script>

<template>
  <div
    class="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-3 border-t-2 border-[#22c55e] bg-[#0b1220]"
    @click="focusInput"
  >
    <span
      class="text-[#22c55e] text-[10px] sm:text-xs font-mono shrink-0 tracking-[0.18em] uppercase"
    >
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
      class="flex-1 bg-transparent text-[#e2e8f0] text-sm sm:text-lg font-mono placeholder-[#334155] outline-none border-none caret-[#22c55e] tracking-wide uppercase"
      :disabled="!store.isPlaying"
      @input="onInput"
    />
    <span v-if="localText" class="text-[#38bdf8] text-[10px] sm:text-xs font-mono tracking-wider">
      {{ localText.length }} ký tự
    </span>
  </div>
</template>
