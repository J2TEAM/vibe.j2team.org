<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'

// ===== GAME STATE =====
const currentLevel = ref(1)
const showSecret = ref(false)
const winFlash = ref(false)

const toggleSecret = () => { showSecret.value = !showSecret.value }
const jumpTo = (lv: number) => {
  winFlash.value = false
  currentLevel.value = lv
  showSecret.value = false
}

const doWin = () => {
  winFlash.value = true
  setTimeout(() => {
    winFlash.value = false
    if (currentLevel.value < 4) currentLevel.value++
  }, 1500)
}

// ===== LEVEL 1: GRAVITY SLIDER =====
const volume = ref(0)
const sliderAngle = ref(0)
const knobPos = ref(0)
const velocity = ref(0)
let isDragging = false
let startY = 0
let startAngle = 0
let animFrameId = 0
let winCounter = 0

const physicsLoop = () => {
  if (currentLevel.value === 1 && !winFlash.value) {
    const rad = (sliderAngle.value * Math.PI) / 180
    velocity.value = (velocity.value + Math.sin(rad) * 0.5) * 0.95
    knobPos.value += velocity.value
    if (knobPos.value <= 0) { knobPos.value = 0; velocity.value *= -0.4 }
    else if (knobPos.value >= 100) { knobPos.value = 100; velocity.value *= -0.4 }
    volume.value = Math.round(knobPos.value)
    if (volume.value === 69) { winCounter++; if (winCounter >= 40) doWin() }
    else { winCounter = 0 }
  }
  animFrameId = requestAnimationFrame(physicsLoop)
}

const onSliderDown = (e: MouseEvent | TouchEvent) => {
  if (currentLevel.value !== 1) return
  isDragging = true
  startY = 'touches' in e ? (e as TouchEvent).touches[0]?.clientY ?? 0 : (e as MouseEvent).clientY
  startAngle = sliderAngle.value
  document.body.style.userSelect = 'none'
}
const onPointerMove = (e: MouseEvent | TouchEvent) => {
  if (!isDragging) return
  const y = 'touches' in e ? (e as TouchEvent).touches[0]?.clientY ?? 0 : (e as MouseEvent).clientY
  sliderAngle.value = Math.max(-45, Math.min(45, startAngle + (y - startY) / 5))
}
const onPointerUp = () => { isDragging = false; document.body.style.userSelect = '' }
const onTilt = (e: DeviceOrientationEvent) => {
  if (currentLevel.value !== 1 || isDragging || e.gamma === null) return
  sliderAngle.value = Math.max(-45, Math.min(45, e.gamma))
}

// ===== LEVEL 2: RUNAWAY BUTTON =====
const btnX = ref(50)
const btnY = ref(50)
const btnClicks = ref(0)
const btnScale = ref(1)
const decoys = ref<Array<{ id: number; x: number; y: number; text: string }>>([])
const wrongFlash = ref(false)
const gameAreaRef = ref<HTMLElement | null>(null)
let decoyId = 0
const TYPOS = ['SUBM1T', 'SUBIMT', 'SUBMLT', 'SUBMlT', 'SUMBIT']

const teleportBtn = (ax: number, ay: number) => {
  let nx: number, ny: number, t = 0
  do { nx = 15 + Math.random() * 70; ny = 15 + Math.random() * 70; t++ }
  while (Math.hypot(nx - ax, ny - ay) < 30 && t < 30)
  btnX.value = nx; btnY.value = ny
}

const onAreaMove = (e: MouseEvent | TouchEvent) => {
  if (currentLevel.value !== 2 || winFlash.value) return
  const area = gameAreaRef.value
  if (!area) return
  const rect = area.getBoundingClientRect()
  const pt = 'touches' in e ? (e as TouchEvent).touches[0] : (e as MouseEvent)
  if (!pt) return
  const mx = ((pt.clientX - rect.left) / rect.width) * 100
  const my = ((pt.clientY - rect.top) / rect.height) * 100
  if (Math.hypot(mx - btnX.value, my - btnY.value) < 14) teleportBtn(mx, my)
}

const clickReal = () => {
  if (winFlash.value) return
  btnClicks.value++
  if (btnClicks.value >= 3) { doWin(); return }
  btnScale.value *= 0.65
  for (let i = 0; i < btnClicks.value; i++) {
    decoys.value.push({
      id: decoyId++,
      x: 15 + Math.random() * 70, y: 15 + Math.random() * 70,
      text: TYPOS[Math.floor(Math.random() * TYPOS.length)]!,
    })
  }
  teleportBtn(btnX.value, btnY.value)
}

const clickDecoy = () => {
  btnClicks.value = 0; btnScale.value = 1; decoys.value = []
  wrongFlash.value = true
  setTimeout(() => { wrongFlash.value = false }, 600)
}

// ===== LEVEL 3: REBELLIOUS CHECKBOXES =====
const boxes = reactive([
  { id: 0, checked: false, label: 'Tôi đồng ý' },
  { id: 1, checked: false, label: 'Không phải robot' },
  { id: 2, checked: false, label: 'Đã đọc điều khoản' },
  { id: 3, checked: false, label: 'Xác nhận 18+' },
  { id: 4, checked: false, label: 'Chấp nhận cookie' },
])
const boxOrder = ref([0, 1, 2, 3, 4])
const orderedBoxes = computed(() => boxOrder.value.map(i => boxes[i]!))
const checkedCount = computed(() => boxes.filter(b => b.checked).length)
let uncheckTimers: number[] = []
let shuffleTimer = 0
let winCheckTimer = 0
let holdCount = 0

const toggleBox = (id: number) => {
  if (winFlash.value) return
  const b = boxes.find(b => b.id === id)
  if (!b) return
  b.checked = !b.checked
  if (Math.random() < 0.3) {
    const others = boxes.filter(o => o.id !== id)
    const v = others[Math.floor(Math.random() * others.length)]
    if (v) v.checked = !v.checked
  }
}

const startChaos = () => {
  stopChaos()
  uncheckTimers = boxes.map(b =>
    window.setInterval(() => { if (b.checked && !winFlash.value) b.checked = false }, 2500 + Math.random() * 2000)
  )
  shuffleTimer = window.setInterval(() => {
    if (winFlash.value) return
    const arr = [...boxOrder.value]
    const i = Math.floor(Math.random() * 5)
    let j = Math.floor(Math.random() * 5)
    while (j === i) j = Math.floor(Math.random() * 5)
    const tmp = arr[i]!; arr[i] = arr[j]!; arr[j] = tmp
    boxOrder.value = arr
  }, 3500)
  holdCount = 0
  winCheckTimer = window.setInterval(() => {
    if (boxes.every(b => b.checked)) { holdCount++; if (holdCount >= 10) doWin() }
    else { holdCount = 0 }
  }, 100)
}
const stopChaos = () => {
  uncheckTimers.forEach(t => clearInterval(t)); uncheckTimers = []
  clearInterval(shuffleTimer); clearInterval(winCheckTimer)
}

// ===== LEVEL TRANSITIONS =====
watch(currentLevel, (lv) => {
  winCounter = 0; holdCount = 0
  if (lv === 1) { volume.value = 0; knobPos.value = 0; velocity.value = 0; sliderAngle.value = 0 }
  if (lv === 2) { btnX.value = 50; btnY.value = 50; btnClicks.value = 0; btnScale.value = 1; decoys.value = []; wrongFlash.value = false }
  if (lv === 3) { boxes.forEach(b => { b.checked = false }); boxOrder.value = [0,1,2,3,4]; nextTick(() => startChaos()) }
  else { stopChaos() }
})

// ===== LIFECYCLE =====
onMounted(() => {
  window.addEventListener('mousemove', onPointerMove)
  window.addEventListener('mouseup', onPointerUp)
  window.addEventListener('touchmove', onPointerMove)
  window.addEventListener('touchend', onPointerUp)
  window.addEventListener('deviceorientation', onTilt)
  physicsLoop()
})
onUnmounted(() => {
  window.removeEventListener('mousemove', onPointerMove)
  window.removeEventListener('mouseup', onPointerUp)
  window.removeEventListener('touchmove', onPointerMove)
  window.removeEventListener('touchend', onPointerUp)
  window.removeEventListener('deviceorientation', onTilt)
  cancelAnimationFrame(animFrameId)
  stopChaos()
})
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">

    <!-- Back -->
    <RouterLink to="/" class="absolute top-4 left-4 inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary transition-all duration-300 hover:border-accent-coral hover:text-text-primary animate-fade-up">
      &larr; Về trang chủ
    </RouterLink>

    <!-- Header -->
    <div class="text-center mb-6 animate-fade-up">
      <h1 class="font-display text-4xl md:text-5xl font-bold text-accent-coral">Cursed UI 💀</h1>
      <div class="flex gap-2 justify-center mt-4">
        <span v-for="i in 3" :key="i" class="w-2 h-2 rounded-full transition-colors duration-300" :class="currentLevel >= i ? 'bg-accent-coral' : 'bg-border-default'" />
      </div>
    </div>

    <!-- Hint -->
    <p v-if="currentLevel === 1" class="text-text-dim text-sm tracking-widest font-display mb-8 animate-fade-up animate-delay-1">TARGET: 69</p>
    <p v-else-if="currentLevel === 2" class="text-text-dim text-sm tracking-widest font-display mb-8 tabular-nums">{{ btnClicks }} / 3</p>
    <p v-else-if="currentLevel === 3" class="text-text-dim text-sm tracking-widest font-display mb-8 tabular-nums">{{ checkedCount }} / 5</p>

    <!-- Win overlay -->
    <Transition name="fade">
      <div v-if="winFlash" class="absolute inset-0 flex items-center justify-center z-50 bg-bg-deep/80">
        <span class="font-display text-7xl text-accent-amber animate-bounce">✓</span>
      </div>
    </Transition>

    <!-- ===== LEVEL 1 ===== -->
    <div v-if="currentLevel === 1" class="w-full max-w-lg animate-fade-up animate-delay-1">
      <div class="text-center mb-12">
        <div class="font-display text-7xl font-black tabular-nums transition-colors duration-300" :class="volume === 69 ? 'text-accent-amber' : 'text-text-primary'">{{ volume }}%</div>
        <div class="text-sm text-text-dim mt-2 font-display tracking-widest">VOLUME</div>
      </div>
      <div class="h-40 flex items-center justify-center relative cursor-grab active:cursor-grabbing" @mousedown="onSliderDown" @touchstart="onSliderDown" style="touch-action: none;">
        <div class="w-full h-8 bg-bg-elevated rounded-full relative overflow-hidden transition-transform duration-75 border border-border-default" :style="{ transform: `rotate(${sliderAngle}deg)` }">
          <div class="absolute top-0 left-0 bottom-0 rounded-full transition-colors" :class="volume === 69 ? 'bg-accent-amber' : 'bg-accent-coral'" :style="{ width: `${knobPos}%` }" />
        </div>
        <div class="absolute w-full px-4 h-8 flex items-center" style="pointer-events: none;" :style="{ transform: `rotate(${sliderAngle}deg)` }">
          <div class="w-12 h-12 rounded-full shadow-lg border-4 absolute top-1/2 -translate-y-1/2 -ml-6 transition-colors" :class="volume === 69 ? 'bg-accent-amber border-accent-amber shadow-accent-amber/30' : 'bg-text-primary border-accent-coral'" :style="{ left: `${knobPos}%` }" />
        </div>
      </div>
    </div>

    <!-- ===== LEVEL 2 ===== -->
    <div v-else-if="currentLevel === 2" ref="gameAreaRef" class="w-full max-w-lg relative animate-fade-up animate-delay-1" style="height: 360px; touch-action: none;" @mousemove="onAreaMove" @touchmove.prevent="onAreaMove">
      <div class="absolute inset-0 border border-dashed border-border-default" />
      <Transition name="fade">
        <div v-if="wrongFlash" class="absolute inset-0 bg-red-500/10 z-10 flex items-center justify-center">
          <span class="font-display text-2xl text-red-400 animate-bounce">RESET!</span>
        </div>
      </Transition>
      <button v-for="d in decoys" :key="d.id" class="absolute px-5 py-2 bg-accent-coral text-bg-deep font-display font-bold text-sm tracking-wider cursor-pointer" :style="{ left: `${d.x}%`, top: `${d.y}%`, transform: 'translate(-50%, -50%)' }" @click="clickDecoy()">{{ d.text }}</button>
      <button class="absolute px-5 py-2 bg-accent-coral text-bg-deep font-display font-bold text-sm tracking-wider z-20 cursor-pointer transition-transform" :style="{ left: `${btnX}%`, top: `${btnY}%`, transform: `translate(-50%, -50%) scale(${btnScale})` }" @click="clickReal">SUBMIT</button>
    </div>

    <!-- ===== LEVEL 3 ===== -->
    <div v-else-if="currentLevel === 3" class="w-full max-w-sm animate-fade-up animate-delay-1">
      <TransitionGroup name="list" tag="div" class="flex flex-col gap-3">
        <div v-for="cb in orderedBoxes" :key="cb.id" class="flex items-center gap-3 px-4 py-3 border bg-bg-surface cursor-pointer transition-all duration-300" :class="cb.checked ? 'border-accent-amber bg-bg-elevated' : 'border-border-default hover:border-accent-coral'" @click="toggleBox(cb.id)">
          <div class="w-5 h-5 border-2 flex items-center justify-center shrink-0 transition-all" :class="cb.checked ? 'bg-accent-amber border-accent-amber' : 'border-border-default'">
            <span v-if="cb.checked" class="text-bg-deep text-xs font-bold">✓</span>
          </div>
          <span class="text-sm" :class="cb.checked ? 'text-text-primary' : 'text-text-secondary'">{{ cb.label }}</span>
        </div>
      </TransitionGroup>
    </div>

    <!-- ===== VICTORY ===== -->
    <div v-else-if="currentLevel === 4" class="text-center animate-fade-up">
      <div class="text-8xl mb-6">🏆</div>
      <h2 class="font-display text-3xl font-bold text-accent-amber mb-4">BẠN THẮNG RỒI!</h2>
      <p class="text-text-secondary mb-8">Bạn đã vượt qua 3 vòng Cursed UI. Respect 🫡</p>
      <button @click="currentLevel = 1" class="px-6 py-3 border border-accent-coral text-accent-coral font-display font-semibold tracking-wider transition-all hover:bg-accent-coral hover:text-bg-deep cursor-pointer">CHƠI LẠI</button>
    </div>

    <!-- Footer + hidden nav -->
    <div class="absolute bottom-8 text-text-dim text-sm">
      Made with ❤️ by <span class="cursor-default" @click="toggleSecret">phucnt</span>
    </div>
    <Transition name="fade">
      <div v-if="showSecret" class="absolute bottom-16 flex gap-1 bg-bg-surface border border-border-default p-1.5">
        <button v-for="i in 4" :key="i" class="w-8 h-8 text-xs font-display font-bold transition-all cursor-pointer" :class="currentLevel === i ? 'bg-accent-coral text-bg-deep' : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'" @click="jumpTo(i)">{{ i === 4 ? '🏆' : i }}</button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.list-move, .list-enter-active, .list-leave-active { transition: all 0.5s ease; }
.list-enter-from, .list-leave-to { opacity: 0; transform: translateX(30px); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
