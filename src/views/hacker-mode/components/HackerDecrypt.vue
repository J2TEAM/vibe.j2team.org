<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useEventListener } from '@vueuse/core'

const props = defineProps<{
  rageMode?: boolean
}>()

const emit = defineEmits<{
  success: [points: number]
  failure: []
  close: []
}>()

const targetCode = ref<number[]>([])
const currentGuess = ref([0, 0, 0, 0])
const activeDigit = ref(0)
const attempts = ref(0)
const MAX_ATTEMPTS = props.rageMode ? 5 : 10
const logs = ref<string[]>([])
const solved = ref(false)
const slotStates = ref<('correct' | 'misplaced' | 'wrong' | null)[]>([null, null, null, null])

function initGame() {
  targetCode.value = Array.from({ length: 4 }, () => Math.floor(Math.random() * 10))
  currentGuess.value = [0, 0, 0, 0]
  activeDigit.value = 0
  attempts.value = 0
  logs.value = ['[*] HỆ THỐNG MÃ HÓA AES-256 ĐÃ KHÓA.', '[*] DÙNG PHÍM MŨI TÊN ĐỂ CHỈNH MÃ.']
  solved.value = false
  slotStates.value = [null, null, null, null]
}

useEventListener(window, 'keydown', (e) => {
  if (solved.value) return

  if (e.key === 'ArrowLeft') {
    e.preventDefault()
    activeDigit.value = (activeDigit.value + 3) % 4
  } else if (e.key === 'ArrowRight') {
    e.preventDefault()
    activeDigit.value = (activeDigit.value + 1) % 4
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    currentGuess.value[activeDigit.value] = (currentGuess.value[activeDigit.value]! + 1) % 10
  } else if (e.key === 'ArrowDown') {
    e.preventDefault()
    currentGuess.value[activeDigit.value] = (currentGuess.value[activeDigit.value]! + 9) % 10
  } else if (e.key === 'Enter') {
    e.preventDefault()
    e.stopPropagation()
    checkGuess()
  }
})

function checkGuess() {
  attempts.value++
  let correct = 0
  let misplaced = 0
  const newStates: ('correct' | 'misplaced' | 'wrong' | null)[] = [
    'wrong',
    'wrong',
    'wrong',
    'wrong',
  ]

  const targetCopy = [...targetCode.value]
  const guessCopy = [...currentGuess.value]

  for (let i = 0; i < 4; i++) {
    if (guessCopy[i] === targetCopy[i]) {
      correct++
      newStates[i] = 'correct'
      targetCopy[i] = -1
      guessCopy[i] = -2
    }
  }

  // Misplaced matches
  for (let i = 0; i < 4; i++) {
    if (guessCopy[i]! < 0) continue
    const idx = targetCopy.indexOf(guessCopy[i]!)
    if (idx !== -1) {
      misplaced++
      newStates[i] = 'misplaced'
      targetCopy[idx] = -1
    }
  }

  slotStates.value = newStates

  if (correct === 4) {
    solved.value = true
    logs.value.unshift(`[+] TRUY CẬP THÀNH CÔNG! THỜI GIAN: ${attempts.value} LƯỢT.`)
    setTimeout(() => emit('success', 1000), 1500)
  } else {
    logs.value.unshift(
      `[!] SAI: ${correct} ĐÚNG, ${misplaced} SAI VỊ TRÍ. (${attempts.value}/${MAX_ATTEMPTS})`,
    )
    if (attempts.value >= MAX_ATTEMPTS) {
      logs.value.unshift(`[!] HỆ THỐNG ĐÃ KHÓA VĨNH VIỄN.`)
      setTimeout(() => emit('failure'), 1500)
    }
  }
}

onMounted(() => {
  initGame()
})
</script>

<template>
  <div class="decrypt-game" :class="{ 'rage-mode': props.rageMode }">
    <div class="slots">
      <div
        v-for="(n, i) in currentGuess"
        :key="i"
        class="slot-box"
        :class="{
          active: activeDigit === i,
          solved: solved,
          correct: slotStates[i] === 'correct',
          misplaced: slotStates[i] === 'misplaced',
          wrong: slotStates[i] === 'wrong',
        }"
      >
        <div class="slot-num">{{ n }}</div>
        <div class="slot-arrows">
          <div class="arrow-up">▲</div>
          <div class="arrow-down">▼</div>
        </div>
      </div>
    </div>

    <div class="game-footer">
      <div v-for="(log, i) in logs.slice(0, 3)" :key="i" class="log-line">
        {{ log }}
      </div>
    </div>

    <div class="hint">DI CHUYỂN: ← → | CHỈNH: ↑ ↓ | XÁC NHẬN: ENTER</div>
  </div>
</template>

<style scoped>
.decrypt-game {
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
}
.slots {
  display: flex;
  gap: 15px;
}
.slot-box {
  width: 50px;
  height: 80px;
  background: rgba(0, 255, 65, 0.05);
  border: 1px solid rgba(0, 255, 65, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.2s;
}
.slot-box.active {
  border-color: #00d4ff;
  box-shadow: 0 0 15px rgba(0, 212, 255, 0.4);
  transform: scale(1.1);
  background: rgba(0, 212, 255, 0.1);
}
.slot-box.solved {
  border-color: #00ff41;
  color: #00ff41;
  box-shadow: 0 0 20px rgba(0, 255, 65, 0.5);
}
.decrypt-game.rage-mode .slot-box.active {
  border-color: #ff3333;
  box-shadow: 0 0 15px rgba(255, 51, 51, 0.6);
  background: rgba(255, 51, 51, 0.1);
}
.decrypt-game.rage-mode {
  color: #ff3333;
}
.slot-box.correct {
  border-color: #00ff41;
  background: rgba(0, 255, 65, 0.15);
  box-shadow: 0 0 10px rgba(0, 255, 65, 0.3);
}
.slot-box.misplaced {
  border-color: #ffb830;
  background: rgba(255, 184, 48, 0.15);
  box-shadow: 0 0 10px rgba(255, 184, 48, 0.3);
}
.slot-box.wrong {
  border-color: rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  opacity: 0.6;
}
.slot-num {
  font-size: 32px;
  font-weight: bold;
  font-family: 'Courier New', monospace;
}
.slot-arrows {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 3px 0;
  font-size: 10px;
  opacity: 0.3;
}
.slot-box.active .slot-arrows {
  opacity: 1;
}

.game-footer {
  width: 100%;
  min-height: 60px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px dashed rgba(0, 255, 65, 0.2);
  font-size: 11px;
}
.log-line {
  margin-bottom: 4px;
}
.hint {
  font-size: 9px;
  opacity: 0.5;
  letter-spacing: 1px;
}
</style>
