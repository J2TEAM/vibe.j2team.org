<template>
  <div
    class="min-h-screen bg-black text-text-primary font-body flex flex-col items-center px-4 relative overflow-hidden select-none"
    @mousemove="onMouseMove"
  >
    <RouterLink
      to="/"
      class="fixed top-4 left-4 z-50 text-text-dim text-xs font-display hover:text-text-secondary transition-colors"
    >
      &larr; Thoát
    </RouterLink>

    <!-- Stage 0: Intro -->
    <div
      v-if="stage === 0"
      class="flex-1 flex flex-col items-center justify-center z-10 animate-fade-up"
    >
      <h1 class="font-display text-4xl sm:text-5xl font-bold text-text-primary mb-4">
        Phòng Nghiệp Ảnh
      </h1>
      <p class="text-text-secondary text-sm max-w-md mx-auto mb-8 leading-relaxed text-center">
        Gương không phản chiếu khuôn mặt.<br />
        Nó phản chiếu <span class="text-accent-amber">điều bạn mang theo</span>.
      </p>
      <button
        class="border border-accent-coral/40 px-8 py-3 font-display text-sm tracking-widest text-accent-coral hover:bg-accent-coral/5 transition-all duration-500 mb-4"
        @click="startWithCamera"
      >
        MỞ GƯƠNG (Camera)
      </button>
      <button
        class="border border-text-dim/20 px-8 py-3 font-display text-xs tracking-widest text-text-dim hover:text-text-secondary transition-all"
        @click="startWithoutCamera"
      >
        KHÔNG DÙNG CAMERA
      </button>
    </div>

    <!-- Stage 1: Mirror + Questions -->
    <div
      v-if="stage >= 1 && stage <= 6"
      class="flex-1 flex flex-col items-center w-full max-w-xl pt-8 z-10"
    >
      <!-- Mirror -->
      <div class="relative w-full aspect-square max-w-sm mb-6">
        <!-- Mirror frame -->
        <div
          class="absolute inset-0 border-2 transition-colors duration-1000"
          :style="{ borderColor: auraColor + '60' }"
        >
          <!-- Webcam -->
          <video
            v-if="hasCamera"
            ref="videoEl"
            autoplay
            playsinline
            muted
            class="w-full h-full object-cover"
            :style="{
              filter: `hue-rotate(${hueRotate}deg) saturate(${saturation}) brightness(${brightness})`,
              transform: 'scaleX(-1)',
            }"
          />
          <!-- No camera fallback: animated silhouette -->
          <canvas v-else ref="silhouetteCanvas" class="w-full h-full" />
        </div>

        <!-- Aura overlay canvas -->
        <canvas
          ref="auraCanvas"
          class="absolute inset-0 w-full h-full pointer-events-none mix-blend-screen"
        />

        <!-- Aura label -->
        <div
          v-if="stage >= 2"
          class="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1 font-display text-xs tracking-widest transition-all duration-1000"
          :style="{ color: auraColor, backgroundColor: 'black' }"
        >
          {{ auraLabel }}
        </div>
      </div>

      <!-- Question / Interaction area -->
      <div v-if="stage >= 1 && stage <= 5" class="w-full animate-fade-up" :key="stage">
        <p class="text-text-dim text-xs font-display tracking-widest mb-3 text-center">
          CÂU HỎI {{ stage }} / 5
        </p>

        <!-- Different interaction type per question -->
        <!-- Q1: Speed choice (timed) -->
        <div v-if="stage === 1" class="text-center">
          <p class="text-text-primary text-sm mb-4">{{ questions[0]!.text }}</p>
          <div class="flex gap-2 justify-center flex-wrap">
            <button
              v-for="(opt, i) in questions[0]!.options"
              :key="i"
              class="border border-text-dim/20 px-5 py-3 text-xs text-text-secondary hover:text-accent-coral hover:border-accent-coral/40 transition-all"
              @click="answerQuestion(0, i)"
            >
              {{ opt.text }}
            </button>
          </div>
          <div class="mt-3 w-full h-1 bg-white/5">
            <div
              class="h-full bg-accent-coral/50 transition-all duration-100"
              :style="{ width: `${timerPercent}%` }"
            />
          </div>
        </div>

        <!-- Q2: Slider -->
        <div v-if="stage === 2" class="text-center">
          <p class="text-text-primary text-sm mb-6">{{ questions[1]!.text }}</p>
          <div class="relative px-4">
            <input
              v-model.number="sliderValue"
              type="range"
              min="0"
              max="100"
              class="w-full accent-amber-500"
            />
            <div class="flex justify-between text-xs text-text-dim mt-1">
              <span>Bản thân</span>
              <span>Người khác</span>
            </div>
          </div>
          <button
            class="mt-4 border border-accent-amber/30 px-6 py-2 font-display text-xs text-accent-amber hover:bg-accent-amber/5 transition-all"
            @click="answerSlider"
          >
            KHẲNG ĐỊNH
          </button>
        </div>

        <!-- Q3: Drag and drop -->
        <div v-if="stage === 3" class="text-center">
          <p class="text-text-primary text-sm mb-4">{{ questions[2]!.text }}</p>
          <div class="flex gap-3 justify-center flex-wrap mb-4">
            <button
              v-for="(word, i) in dragWords"
              :key="i"
              class="border px-4 py-2 text-xs transition-all cursor-pointer"
              :class="
                selectedWords.includes(i)
                  ? 'border-accent-sky/60 text-accent-sky bg-accent-sky/10'
                  : 'border-text-dim/20 text-text-secondary hover:border-accent-sky/30'
              "
              @click="toggleWord(i)"
            >
              {{ word }}
            </button>
          </div>
          <p class="text-text-dim text-xs mb-3">Chọn đúng 3 từ</p>
          <button
            class="border border-accent-sky/30 px-6 py-2 font-display text-xs transition-all"
            :class="
              selectedWords.length === 3
                ? 'text-accent-sky hover:bg-accent-sky/5'
                : 'text-text-dim cursor-not-allowed'
            "
            :disabled="selectedWords.length !== 3"
            @click="answerWords"
          >
            XONG
          </button>
        </div>

        <!-- Q4: Tap speed game -->
        <div v-if="stage === 4" class="text-center">
          <p class="text-text-primary text-sm mb-4">{{ questions[3]!.text }}</p>
          <div class="relative">
            <button
              class="w-32 h-32 border-2 border-accent-coral/40 font-display text-3xl font-bold text-accent-coral hover:bg-accent-coral/5 transition-all mx-auto block"
              @click="tapCount++"
            >
              {{ tapCount }}
            </button>
            <p class="text-text-dim text-xs mt-3">
              {{ tapGameActive ? `${tapTimeLeft}s còn lại — nhấn nhanh nhất có thể!` : '' }}
            </p>
          </div>
          <button
            v-if="!tapGameActive && tapCount === 0"
            class="mt-4 border border-accent-coral/30 px-6 py-2 font-display text-xs text-accent-coral hover:bg-accent-coral/5 transition-all"
            @click="startTapGame"
          >
            BẮT ĐẦU
          </button>
        </div>

        <!-- Q5: Eyes closed meditation -->
        <div v-if="stage === 5" class="text-center">
          <p class="text-text-primary text-sm mb-4">{{ questions[4]!.text }}</p>
          <button
            v-if="!meditating"
            class="border border-accent-amber/30 px-8 py-4 font-display text-sm text-accent-amber hover:bg-accent-amber/5 transition-all"
            @click="startMeditation"
          >
            NHẮM MẮT (Nhấn giữ chuột)
          </button>
          <div v-else>
            <div
              class="w-24 h-24 mx-auto border-2 border-accent-amber/30 flex items-center justify-center"
              @mousedown="holdStart"
              @mouseup="holdEnd"
              @mouseleave="holdEnd"
              @touchstart.prevent="holdStart"
              @touchend="holdEnd"
            >
              <span class="font-display text-2xl text-accent-amber">{{ holdSeconds }}s</span>
            </div>
            <p class="text-text-dim text-xs mt-3">Nhấn giữ ít nhất 5 giây</p>
            <button
              v-if="holdSeconds >= 5"
              class="mt-3 border border-accent-amber/30 px-6 py-2 font-display text-xs text-accent-amber hover:bg-accent-amber/5 transition-all"
              @click="finishMeditation"
            >
              XONG
            </button>
          </div>
        </div>
      </div>

      <!-- Stage 6: Loading -->
      <div v-if="stage === 6" class="text-center animate-fade-up">
        <p class="text-text-dim text-xs font-display tracking-widest animate-pulse mb-4">
          GƯƠNG ĐANG ĐỌC...
        </p>
      </div>
    </div>

    <!-- Stage 7: Result -->
    <div
      v-if="stage === 7"
      class="flex-1 flex flex-col items-center justify-center z-10 max-w-lg animate-fade-up"
    >
      <!-- Aura visualization -->
      <div class="relative w-48 h-48 mb-6">
        <canvas ref="resultAuraCanvas" class="w-full h-full" />
      </div>

      <div
        class="font-display text-2xl font-bold mb-2 transition-colors duration-500"
        :style="{ color: auraColor }"
      >
        {{ resultTitle }}
      </div>
      <p class="text-text-dim text-xs font-display mb-6">{{ auraLabel }}</p>

      <!-- Stats -->
      <div class="grid grid-cols-3 gap-4 w-full mb-6">
        <div class="border border-text-dim/10 bg-white/[0.02] p-3 text-center">
          <div class="font-display text-xl font-bold text-accent-coral">{{ scores.karma }}</div>
          <div class="text-text-dim text-xs">Nghiệp</div>
        </div>
        <div class="border border-text-dim/10 bg-white/[0.02] p-3 text-center">
          <div class="font-display text-xl font-bold text-accent-amber">{{ scores.virtue }}</div>
          <div class="text-text-dim text-xs">Đức</div>
        </div>
        <div class="border border-text-dim/10 bg-white/[0.02] p-3 text-center">
          <div class="font-display text-xl font-bold text-accent-sky">{{ scores.balance }}</div>
          <div class="text-text-dim text-xs">Cân bằng</div>
        </div>
      </div>

      <!-- Reading -->
      <div class="border border-text-dim/10 bg-white/[0.02] p-6 mb-6 w-full">
        <p class="text-text-primary italic text-sm leading-relaxed mb-3">"{{ reading.main }}"</p>
        <p class="text-text-secondary text-xs leading-relaxed">{{ reading.detail }}</p>
      </div>

      <!-- Behavioral insights -->
      <div class="w-full space-y-2 mb-6">
        <div v-for="(insight, i) in insights" :key="i" class="flex gap-2 text-xs text-text-dim">
          <span class="text-accent-amber">▸</span>
          <span>{{ insight }}</span>
        </div>
      </div>

      <button
        class="border border-text-dim/20 px-6 py-2 font-display text-xs tracking-widest text-text-dim hover:text-accent-coral hover:border-accent-coral/40 transition-all"
        @click="reset"
      >
        SOI LẠI
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useIntervalFn } from '@vueuse/core'

// === State ===
const stage = ref(0)
const hasCamera = ref(false)
const videoEl = ref<HTMLVideoElement | null>(null)
const auraCanvas = ref<HTMLCanvasElement | null>(null)
const silhouetteCanvas = ref<HTMLCanvasElement | null>(null)
const resultAuraCanvas = ref<HTMLCanvasElement | null>(null)

const auraColor = ref('#FF6B4A')
const auraLabel = ref('ĐANG PHÂN TÍCH...')
const hueRotate = ref(0)
const saturation = ref(1)
const brightness = ref(1)

// Question data
interface QuestionOption {
  text: string
  karma: number
  virtue: number
}
interface Question {
  text: string
  options: QuestionOption[]
}

const questions: Question[] = [
  {
    text: 'Bạn thấy một người lạ đánh rơi ví. Phản xạ đầu tiên?',
    options: [
      { text: '🏃 Chạy đến nhặt', karma: 5, virtue: 25 },
      { text: '👀 Nhìn quanh trước', karma: 15, virtue: 10 },
      { text: '📱 Quay phim lại', karma: 25, virtue: 0 },
      { text: '🚶 Đi tiếp', karma: 20, virtue: 5 },
    ],
  },
  { text: 'Bạn sống vì ai nhiều hơn?', options: [] }, // slider
  { text: 'Chọn 3 từ mô tả bạn nhất:', options: [] }, // word pick
  { text: 'Nhấn nút nhanh nhất có thể trong 5 giây:', options: [] }, // tap game
  { text: 'Nhắm mắt, giữ yên tâm trí. Nhấn giữ chuột càng lâu càng tốt.', options: [] }, // hold
]

// === Scoring ===
const scores = ref({ karma: 0, virtue: 0, balance: 0 })
const insights = ref<string[]>([])

// Q1: Timed choice
const timerPercent = ref(100)
let timerInterval: ReturnType<typeof setInterval> | null = null

function startTimer() {
  timerPercent.value = 100
  const startTime = Date.now()
  timerInterval = setInterval(() => {
    const elapsed = Date.now() - startTime
    timerPercent.value = Math.max(0, 100 - elapsed / 80) // 8 seconds
    if (timerPercent.value <= 0) {
      clearInterval(timerInterval!)
      answerQuestion(0, 3) // default: walk away
    }
  }, 50)
}

function answerQuestion(qIndex: number, optIndex: number) {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
  const q = questions[qIndex]!
  const opt = q.options[optIndex]!
  scores.value.karma += opt.karma
  scores.value.virtue += opt.virtue

  const elapsed = 100 - timerPercent.value
  if (elapsed < 20) insights.value.push('Phản xạ cực nhanh — bạn hành động theo bản năng')
  else if (elapsed > 60) insights.value.push('Bạn suy nghĩ kỹ trước khi hành động')

  stage.value = 2
}

// Q2: Slider
const sliderValue = ref(50)
function answerSlider() {
  scores.value.karma += Math.round(sliderValue.value * 0.3)
  scores.value.virtue += Math.round((100 - sliderValue.value) * 0.3)
  if (sliderValue.value > 70)
    insights.value.push('Bạn ưu tiên bản thân — không sai, nhưng gương thấy')
  else if (sliderValue.value < 30)
    insights.value.push('Bạn sống vì người khác nhiều hơn — nhưng bạn có ổn không?')
  stage.value = 3
}

// Q3: Word pick
const dragWords = [
  'Kiên nhẫn',
  'Tham vọng',
  'Nhạy cảm',
  'Lý trí',
  'Ích kỷ',
  'Trung thực',
  'Bốc đồng',
  'Dũng cảm',
  'Cô đơn',
]
const selectedWords = ref<number[]>([])
const wordScores: Record<number, { karma: number; virtue: number }> = {
  0: { karma: 0, virtue: 10 },
  1: { karma: 10, virtue: 5 },
  2: { karma: 5, virtue: 8 },
  3: { karma: 3, virtue: 7 },
  4: { karma: 15, virtue: 0 },
  5: { karma: 0, virtue: 12 },
  6: { karma: 12, virtue: 2 },
  7: { karma: 5, virtue: 10 },
  8: { karma: 8, virtue: 5 },
}
function toggleWord(i: number) {
  if (selectedWords.value.includes(i)) {
    selectedWords.value = selectedWords.value.filter((w) => w !== i)
  } else if (selectedWords.value.length < 3) {
    selectedWords.value.push(i)
  }
}
function answerWords() {
  for (const w of selectedWords.value) {
    scores.value.karma += wordScores[w]!.karma
    scores.value.virtue += wordScores[w]!.virtue
  }
  const words = selectedWords.value.map((i) => dragWords[i])
  insights.value.push(`Bạn tự nhận mình: ${words.join(', ')}`)
  stage.value = 4
}

// Q4: Tap game
const tapCount = ref(0)
const tapGameActive = ref(false)
const tapTimeLeft = ref(5)
function startTapGame() {
  tapCount.value = 0
  tapGameActive.value = true
  tapTimeLeft.value = 5
  const interval = setInterval(() => {
    tapTimeLeft.value--
    if (tapTimeLeft.value <= 0) {
      clearInterval(interval)
      tapGameActive.value = false
      // Score based on taps
      if (tapCount.value > 30) {
        scores.value.karma += 15
        insights.value.push(
          `${tapCount.value} taps — năng lượng mạnh, nhưng có đang chạy trốn gì không?`,
        )
      } else if (tapCount.value > 15) {
        scores.value.virtue += 10
        scores.value.karma += 5
      } else {
        scores.value.virtue += 15
        insights.value.push(`Chỉ ${tapCount.value} taps — bạn bình tĩnh, hoặc đang buồn`)
      }
      stage.value = 5
    }
  }, 1000)
}

// Q5: Hold meditation
const meditating = ref(false)
const holdSeconds = ref(0)
let holdInterval: ReturnType<typeof setInterval> | null = null
function startMeditation() {
  meditating.value = true
}
function holdStart() {
  holdSeconds.value = 0
  holdInterval = setInterval(() => {
    holdSeconds.value++
  }, 1000)
}
function holdEnd() {
  if (holdInterval) {
    clearInterval(holdInterval)
    holdInterval = null
  }
}
function finishMeditation() {
  if (holdSeconds.value >= 15) {
    scores.value.virtue += 20
    insights.value.push(`Giữ yên ${holdSeconds.value}s — tâm bạn đang yên`)
  } else if (holdSeconds.value >= 8) {
    scores.value.virtue += 10
    scores.value.karma += 5
  } else {
    scores.value.karma += 10
    insights.value.push('Bạn buông sớm — tâm trí đang bận rộn')
  }

  stage.value = 6
  setTimeout(() => {
    calculateResults()
    stage.value = 7
  }, 2500)
}

// === Aura Animation ===
let auraAnimId = 0
const mouseX = ref(0.5)
const mouseY = ref(0.5)

function onMouseMove(e: MouseEvent) {
  mouseX.value = e.clientX / window.innerWidth
  mouseY.value = e.clientY / window.innerHeight
}

function drawAura() {
  const canvas = auraCanvas.value
  if (!canvas) {
    auraAnimId = requestAnimationFrame(drawAura)
    return
  }
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const dpr = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  ctx.scale(dpr, dpr)

  ctx.clearRect(0, 0, rect.width, rect.height)

  const time = Date.now() / 1000

  // Draw aura particles around edges
  for (let i = 0; i < 30; i++) {
    const angle = (i / 30) * Math.PI * 2 + time * 0.3
    const radius = Math.min(rect.width, rect.height) * 0.48 + Math.sin(time * 2 + i) * 10
    const x = rect.width / 2 + Math.cos(angle) * radius
    const y = rect.height / 2 + Math.sin(angle) * radius
    const size = 3 + Math.sin(time * 3 + i * 0.5) * 2

    ctx.beginPath()
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.fillStyle = auraColor.value + '40'
    ctx.fill()
  }

  // Inner glow following mouse
  const glowX = mouseX.value * rect.width
  const glowY = mouseY.value * rect.height
  const gradient = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, 80)
  gradient.addColorStop(0, auraColor.value + '15')
  gradient.addColorStop(1, 'transparent')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, rect.width, rect.height)

  auraAnimId = requestAnimationFrame(drawAura)
}

// Silhouette for no-camera mode
let silAnimId = 0
function drawSilhouette() {
  const canvas = silhouetteCanvas.value
  if (!canvas) {
    silAnimId = requestAnimationFrame(drawSilhouette)
    return
  }
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const dpr = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  ctx.scale(dpr, dpr)
  const w = rect.width
  const h = rect.height
  const time = Date.now() / 1000

  ctx.fillStyle = '#0a0f1a'
  ctx.fillRect(0, 0, w, h)

  // Abstract silhouette
  ctx.beginPath()
  ctx.ellipse(w / 2, h * 0.3, w * 0.15, h * 0.15, 0, 0, Math.PI * 2)
  ctx.fillStyle = '#1a2538'
  ctx.fill()

  ctx.beginPath()
  ctx.ellipse(w / 2, h * 0.65, w * 0.25, h * 0.3, 0, 0, Math.PI * 2)
  ctx.fill()

  // Breathing pulse
  const pulse = Math.sin(time * 1.5) * 0.02 + 0.03
  const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.5)
  grad.addColorStop(
    0,
    auraColor.value +
      Math.round(pulse * 255)
        .toString(16)
        .padStart(2, '0'),
  )
  grad.addColorStop(1, 'transparent')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)

  silAnimId = requestAnimationFrame(drawSilhouette)
}

// Result aura
function drawResultAura() {
  const canvas = resultAuraCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const dpr = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  ctx.scale(dpr, dpr)
  const cx = rect.width / 2
  const cy = rect.height / 2
  const time = Date.now() / 1000

  ctx.clearRect(0, 0, rect.width, rect.height)

  // Multiple aura rings
  const colors = [auraColor.value, '#FFB830', '#38BDF8']
  for (let ring = 0; ring < 3; ring++) {
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2 + time * (0.5 + ring * 0.2)
      const r = 30 + ring * 25 + Math.sin(time * 2 + i + ring) * 8
      const x = cx + Math.cos(angle) * r
      const y = cy + Math.sin(angle) * r
      ctx.beginPath()
      ctx.arc(x, y, 2 + Math.sin(time + i) * 1, 0, Math.PI * 2)
      ctx.fillStyle = colors[ring]! + '50'
      ctx.fill()
    }
  }

  requestAnimationFrame(drawResultAura)
}

// === Camera ===
let stream: MediaStream | null = null

async function startWithCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
    hasCamera.value = true
    stage.value = 1
    await nextTick()
    if (videoEl.value) videoEl.value.srcObject = stream
    startTimer()
    drawAura()
  } catch {
    startWithoutCamera()
  }
}

function startWithoutCamera() {
  hasCamera.value = false
  stage.value = 1
  startTimer()
  nextTick(() => {
    drawSilhouette()
    drawAura()
  })
}

// Update visual effects based on answers
watch(stage, (s) => {
  const total = scores.value.karma + scores.value.virtue
  if (total > 0) {
    const karmaRatio = scores.value.karma / total
    hueRotate.value = karmaRatio * 40 - 20 // shift warm/cold
    saturation.value = 0.8 + karmaRatio * 0.6
    brightness.value = 1 - karmaRatio * 0.2

    if (karmaRatio > 0.6) {
      auraColor.value = '#FF6B4A'
      auraLabel.value = 'NGHIỆP ĐẬM'
    } else if (karmaRatio < 0.4) {
      auraColor.value = '#FFB830'
      auraLabel.value = 'ĐỨC SÁNG'
    } else {
      auraColor.value = '#38BDF8'
      auraLabel.value = 'CÂN BẰNG'
    }
  }
  if (s === 7) nextTick(() => drawResultAura())
})

// === Results ===
const resultTitle = ref('')
const reading = ref({ main: '', detail: '' })

const readings = [
  {
    main: 'Bạn mang bóng của sự do dự.',
    detail:
      'Bên trong bạn có cuộc chiến giữa lý trí và cảm xúc. Gương thấy bạn biết đúng sai — nhưng hành động thì lag.',
  },
  {
    main: 'Ánh sáng xung quanh bạn đang mờ dần.',
    detail:
      'Bạn quen ưu tiên bản thân. Gương nhìn thấy những lần bạn biết có thể giúp mà chọn bỏ qua.',
  },
  {
    main: 'Có ai đó đang biết ơn bạn mà bạn không biết.',
    detail: 'Đức của bạn đến từ những khoảnh khắc nhỏ. Gương phản chiếu ánh sáng ấm.',
  },
  {
    main: 'Bạn sợ bị nhìn thấu — nên cố kiểm soát.',
    detail: 'Tap nhanh, chọn nhanh. Bạn muốn kiểm soát cách người khác thấy mình.',
  },
  {
    main: 'Gương thấy sự cân bằng hiếm có.',
    detail: 'Bạn không hoàn hảo, nhưng đủ tự nhận thức. Đó là dạng đức ít người có.',
  },
]

function calculateResults() {
  const total = scores.value.karma + scores.value.virtue
  scores.value.balance = Math.round(100 - Math.abs(scores.value.karma - scores.value.virtue))
  scores.value.karma = Math.min(100, scores.value.karma)
  scores.value.virtue = Math.min(100, scores.value.virtue)

  const ratio = total > 0 ? scores.value.karma / total : 0.5
  if (ratio > 0.65) {
    resultTitle.value = 'Bóng Tối Nhẹ'
    reading.value = readings[1]!
  } else if (ratio < 0.35) {
    resultTitle.value = 'Ánh Sáng Ấm'
    reading.value = readings[2]!
  } else if (tapCount.value > 25) {
    resultTitle.value = 'Năng Lượng Mạnh'
    reading.value = readings[3]!
  } else if (scores.value.balance > 70) {
    resultTitle.value = 'Thăng Bằng'
    reading.value = readings[4]!
  } else {
    resultTitle.value = 'Giao Thoa'
    reading.value = readings[0]!
  }
}

function reset() {
  stage.value = 0
  scores.value = { karma: 0, virtue: 0, balance: 0 }
  insights.value = []
  selectedWords.value = []
  tapCount.value = 0
  holdSeconds.value = 0
  meditating.value = false
  sliderValue.value = 50
  if (stream) {
    stream.getTracks().forEach((t) => t.stop())
    stream = null
  }
}

const { pause } = useIntervalFn(() => {}, 1000) // placeholder
onMounted(() => {
  pause()
})
onUnmounted(() => {
  cancelAnimationFrame(auraAnimId)
  cancelAnimationFrame(silAnimId)
  if (timerInterval) clearInterval(timerInterval)
  if (holdInterval) clearInterval(holdInterval)
  if (stream) stream.getTracks().forEach((t) => t.stop())
})
</script>
