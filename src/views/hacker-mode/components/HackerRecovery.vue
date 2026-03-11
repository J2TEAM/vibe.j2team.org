<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useEventListener, useIntervalFn } from '@vueuse/core'

const emit = defineEmits<{
  success: []
  failure: []
}>()

const sequence = ref<string[]>([])
const currentIndex = ref(0)
const attempts = ref(0)
const timeLeft = ref(10)
const MAX_ATTEMPTS = 3
const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
const icons: Record<string, string> = {
  ArrowUp: '▲',
  ArrowDown: '▼',
  ArrowLeft: '◄',
  ArrowRight: '►',
}

function generateSequence() {
  sequence.value = Array.from({ length: 5 }, () => keys[Math.floor(Math.random() * keys.length)]!)
  currentIndex.value = 0
  timeLeft.value = 10
}

const { pause } = useIntervalFn(() => {
  if (timeLeft.value > 0 && !solved.value) {
    timeLeft.value--
    if (timeLeft.value === 0) {
      pause()
      emit('failure')
    }
  }
}, 1000)

const solved = ref(false)

useEventListener(window, 'keydown', (e) => {
  if (attempts.value >= MAX_ATTEMPTS) return

  if (keys.includes(e.key)) {
    e.preventDefault()
    if (e.key === sequence.value[currentIndex.value]) {
      currentIndex.value++
      if (currentIndex.value >= sequence.value.length) {
        solved.value = true
        pause()
        emit('success')
      }
    } else {
      attempts.value++
      currentIndex.value = 0
      if (attempts.value >= MAX_ATTEMPTS) {
        emit('failure')
      }
    }
  }
})

onMounted(() => {
  generateSequence()
})
</script>

<template>
  <div class="recovery-puzzle">
    <div class="puzzle-title">LỖI HỆ THỐNG KỸ THUẬT: NHẬP MÃ KHÔI PHỤC</div>

    <div class="sequence-display">
      <div
        v-for="(key, i) in sequence"
        :key="i"
        class="key-box"
        :class="{
          active: i === currentIndex,
          done: i < currentIndex,
          fail: attempts > 0 && currentIndex === 0 && i === 0,
        }"
      >
        <span class="arrow-icon">{{ icons[key] }}</span>
      </div>
    </div>

    <div class="stats">
      <div class="attempts">LƯỢT THỬ: {{ MAX_ATTEMPTS - attempts }}</div>
      <div class="timer" :class="{ critical: timeLeft <= 3 }">THỜI GIAN: {{ timeLeft }}s</div>
      <div class="progress">TIẾN ĐỘ: {{ currentIndex }}/{{ sequence.length }}</div>
    </div>

    <div class="hint">NHẤN CÁC PHÍM MŨI TÊN THEO THỨ TỰ ĐỂ THOÁT CHẾ ĐỘ RAGE</div>
  </div>
</template>

<style scoped>
.recovery-puzzle {
  display: flex;
  flex-direction: column;
  gap: 24px;
  align-items: center;
  padding: 10px;
}
.puzzle-title {
  color: #ff3333;
  font-weight: bold;
  font-size: 14px;
  letter-spacing: 1px;
  text-align: center;
}
.sequence-display {
  display: flex;
  gap: 12px;
}
.key-box {
  width: 45px;
  height: 45px;
  border: 2px solid rgba(255, 51, 51, 0.3);
  background: rgba(255, 51, 51, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}
.key-box.active {
  border-color: #ff3333;
  box-shadow: 0 0 15px rgba(255, 51, 51, 0.5);
  transform: scale(1.1);
  background: rgba(255, 51, 51, 0.2);
}
.key-box.done {
  border-color: #00ff41;
  background: rgba(0, 255, 65, 0.1);
  opacity: 0.5;
}
.key-box.fail {
  animation: shake 0.3s ease-in-out;
}
.arrow-icon {
  font-size: 24px;
  color: #fff;
}
.stats {
  display: flex;
  justify-content: space-between;
  width: 100%;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}
.attempts {
  color: #ff3333;
}
.timer {
  color: #ffb830;
  width: 80px;
  text-align: center;
  font-weight: bold;
}
.timer.critical {
  color: #ff3333;
  animation: blink 0.5s infinite;
}
.progress {
  color: #00d4ff;
}

@keyframes blink {
  50% {
    opacity: 0.3;
  }
}

.hint {
  font-size: 10px;
  opacity: 0.6;
  text-align: center;
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-5px);
  }
  75% {
    transform: translateX(5px);
  }
}
</style>
