<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'

const props = defineProps<{
  duration: number
  isActive: boolean
}>()

const emit = defineEmits<{
  (e: 'timeout'): void
}>()

const remaining = ref(props.duration)
let timer: ReturnType<typeof setInterval> | null = null

function startTimer() {
  stopTimer()
  remaining.value = props.duration
  timer = setInterval(() => {
    remaining.value -= 0.1
    if (remaining.value <= 0) {
      remaining.value = 0
      stopTimer()
      emit('timeout')
    }
  }, 100)
}

function stopTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

watch(
  () => props.isActive,
  (active) => {
    if (active) startTimer()
    else stopTimer()
  },
  { immediate: true },
)

onUnmounted(stopTimer)

const percent = () => (remaining.value / props.duration) * 100
</script>

<template>
  <div class="h-2 overflow-hidden bg-bg-elevated">
    <div
      class="h-full transition-all duration-100"
      :class="remaining > props.duration * 0.3 ? 'bg-accent-amber' : 'bg-accent-coral'"
      :style="{ width: `${percent()}%` }"
    />
  </div>
</template>
