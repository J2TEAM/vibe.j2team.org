<template>
  <div class="flex flex-col items-center">
    <p class="text-text-primary font-display font-medium text-lg mb-6 text-center">
      Click vào ô vuông khi nó đổi sang màu <span class="text-accent-sky font-bold">XANH</span>.
    </p>

    <div
      class="w-48 h-48 rounded-lg cursor-pointer transition-colors duration-100 flex items-center justify-center shadow-lg active:scale-95"
      :class="boxClass"
      @click="handleClick"
    >
      <span v-if="state === 'waiting'" class="text-text-secondary font-medium">Chờ đã...</span>
      <span v-else-if="state === 'ready'" class="text-bg-deep font-bold text-xl">CLICK NOW!</span>
      <span v-else-if="state === 'failed'" class="text-bg-deep font-bold text-xl">Thất bại!</span>
      <span v-else-if="state === 'success'" class="text-bg-deep font-bold text-xl">Pass!</span>
    </div>

    <p
      v-if="message"
      class="mt-4 text-sm font-medium"
      :class="state === 'success' ? 'text-accent-sky' : 'text-accent-coral'"
    >
      {{ message }}
    </p>

    <button
      v-if="state === 'failed'"
      @click="startChallenge"
      class="mt-6 text-sm underline text-text-secondary hover:text-text-primary transition-colors"
    >
      Thử lại
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'

const emit = defineEmits(['pass'])

type State = 'idle' | 'waiting' | 'ready' | 'failed' | 'success'
const state = ref<State>('idle')
const message = ref('')

let timeoutId: number | null = null
let trollTimeoutId: number | null = null

const startChallenge = () => {
  state.value = 'waiting'
  message.value = ''

  // Random time between 1.5s - 5s
  const delay = 1500 + Math.random() * 3500

  timeoutId = window.setTimeout(() => {
    state.value = 'ready'

    // 20% chance to be a troll speed (50ms)
    const isTroll = Math.random() < 0.2

    if (isTroll) {
      trollTimeoutId = window.setTimeout(() => {
        if (state.value === 'ready') {
          state.value = 'failed'
          message.value = 'Chậm quá, xanh có 50ms thôi.'
        }
      }, 50)
    }
  }, delay)
}

const handleClick = () => {
  if (state.value === 'waiting') {
    state.value = 'failed'
    message.value = 'Click quá sớm! Kém bình tĩnh.'
    if (timeoutId) clearTimeout(timeoutId)
    if (trollTimeoutId) clearTimeout(trollTimeoutId)
  } else if (state.value === 'ready') {
    state.value = 'success'
    message.value = 'Phản xạ tốt đấy!'
    if (trollTimeoutId) clearTimeout(trollTimeoutId)

    setTimeout(() => {
      emit('pass')
    }, 1000)
  }
}

const boxClass = computed(() => {
  switch (state.value) {
    case 'waiting':
      return 'bg-bg-deep border-2 border-border-default'
    case 'ready':
      return 'bg-accent-sky border-2 border-accent-sky'
    case 'failed':
      return 'bg-accent-coral border-2 border-accent-coral'
    case 'success':
      return 'bg-emerald-500 border-2 border-emerald-500'
    default:
      return 'bg-bg-deep border-2 border-border-default'
  }
})

onMounted(() => {
  startChallenge()
})

onUnmounted(() => {
  if (timeoutId) clearTimeout(timeoutId)
  if (trollTimeoutId) clearTimeout(trollTimeoutId)
})
</script>
