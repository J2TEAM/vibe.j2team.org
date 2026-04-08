<template>
  <div
    class="min-h-screen bg-black text-text-primary font-body flex flex-col items-center relative overflow-hidden select-none"
    @click="onAnyClick"
  >
    <RouterLink
      to="/"
      class="fixed top-4 left-4 z-50 text-text-dim text-xs font-display hover:text-text-secondary transition-colors"
    >
      &larr; Thoát
    </RouterLink>

    <!-- Ambient canvas background -->
    <canvas ref="bgCanvas" class="fixed inset-0 w-full h-full pointer-events-none z-0" />

    <!-- Stage 0: Intro -->
    <div
      v-if="stage === 0"
      class="flex-1 flex flex-col items-center justify-center z-10 animate-fade-up px-4"
    >
      <h1 class="font-display text-4xl sm:text-5xl font-bold text-text-primary mb-4 text-center">
        Phòng Thì Thầm
      </h1>
      <p class="text-text-secondary text-sm max-w-md mx-auto mb-10 leading-relaxed text-center">
        Phòng này lắng nghe.<br />
        Không phải từ ngữ — mà <span class="text-accent-sky">cách bạn nói</span>.
      </p>
      <button
        class="border border-accent-sky/30 px-8 py-3 font-display text-sm tracking-widest text-accent-sky hover:bg-accent-sky/5 transition-all duration-500"
        @click="enterRoom"
      >
        BƯỚC VÀO PHÒNG TỐI
      </button>
    </div>

    <!-- Stage 1: Choose input method -->
    <div
      v-if="stage === 1"
      class="flex-1 flex flex-col items-center justify-center z-10 animate-fade-up px-4"
    >
      <p class="text-text-dim text-xs font-display tracking-widest mb-8">CHỌN CÁCH THÌ THẦM</p>

      <div class="flex gap-4 flex-wrap justify-center">
        <button
          class="border border-accent-coral/30 px-6 py-8 flex flex-col items-center gap-3 hover:bg-accent-coral/5 transition-all w-36"
          @click="startVoice"
        >
          <span class="text-3xl">🎤</span>
          <span class="font-display text-xs text-accent-coral tracking-widest">GIỌNG NÓI</span>
          <span class="text-text-dim text-xs">Thì thầm bằng micro</span>
        </button>
        <button
          class="border border-accent-amber/30 px-6 py-8 flex flex-col items-center gap-3 hover:bg-accent-amber/5 transition-all w-36"
          @click="startTyping"
        >
          <span class="text-3xl">⌨️</span>
          <span class="font-display text-xs text-accent-amber tracking-widest">GÕ CHỮ</span>
          <span class="text-text-dim text-xs">Viết trong im lặng</span>
        </button>
      </div>
    </div>

    <!-- Stage 2: Voice recording -->
    <div v-if="stage === 2" class="flex-1 flex flex-col items-center justify-center z-10 px-4">
      <div class="relative mb-8">
        <!-- Waveform visualization -->
        <canvas ref="waveCanvas" class="w-80 h-40 sm:w-96 sm:h-48" />

        <!-- Recording indicator -->
        <div v-if="isRecording" class="absolute top-2 right-2 flex items-center gap-1">
          <span class="w-2 h-2 bg-accent-coral rounded-full animate-pulse" />
          <span class="text-accent-coral text-xs font-display">{{ recordTime }}s</span>
        </div>
      </div>

      <p class="text-text-secondary text-sm max-w-sm text-center mb-6 leading-relaxed">
        {{ isRecording ? 'Thì thầm điều trong lòng bạn...' : 'Nhấn nút để bắt đầu nói' }}
      </p>

      <button
        class="w-20 h-20 border-2 flex items-center justify-center transition-all duration-300"
        :class="
          isRecording
            ? 'border-accent-coral bg-accent-coral/10 animate-pulse'
            : 'border-accent-sky/40 hover:border-accent-sky'
        "
        @click="toggleRecording"
      >
        <span class="text-2xl">{{ isRecording ? '⏹' : '🎤' }}</span>
      </button>

      <p v-if="transcript" class="text-text-dim text-xs mt-6 max-w-sm text-center italic">
        "{{ transcript }}"
      </p>
    </div>

    <!-- Stage 3: Typing mode -->
    <div
      v-if="stage === 3"
      class="flex-1 flex flex-col items-center justify-center z-10 px-4 w-full max-w-lg"
    >
      <p class="text-text-dim text-xs font-display tracking-widest mb-4">THÌ THẦM VÀO BÓNG TỐI</p>

      <div class="relative w-full mb-6">
        <textarea
          ref="textInput"
          v-model="whisperText"
          placeholder="Viết điều bạn không nói được với ai..."
          class="w-full h-40 bg-transparent border border-text-dim/10 p-4 text-text-primary text-sm resize-none focus:outline-none focus:border-accent-sky/30 placeholder:text-text-dim/30 transition-colors"
          maxlength="500"
          @input="onTyping"
        />
        <!-- Typing intensity meter -->
        <div class="absolute bottom-2 right-2 flex items-center gap-1">
          <div
            v-for="i in 5"
            :key="i"
            class="w-1 h-3 transition-all duration-300"
            :style="{
              backgroundColor:
                i <= typingIntensity ? auraColorByIntensity : 'rgba(255,255,255,0.05)',
              height: `${8 + i * 3}px`,
            }"
          />
        </div>
      </div>

      <!-- Timing & behavior indicators -->
      <div class="flex gap-6 text-xs text-text-dim mb-6">
        <span>Pauses: {{ pauseCount }}</span>
        <span>Speed: {{ typingSpeed }}</span>
        <span>Deletes: {{ deleteCount }}</span>
      </div>

      <button
        class="border border-accent-sky/30 px-8 py-3 font-display text-sm tracking-widest text-accent-sky hover:bg-accent-sky/5 transition-all disabled:opacity-30"
        :disabled="whisperText.trim().length < 5"
        @click="submitWhisper"
      >
        THÌ THẦM
      </button>
    </div>

    <!-- Stage 4: Analyzing -->
    <div v-if="stage === 4" class="flex-1 flex flex-col items-center justify-center z-10 px-4">
      <canvas ref="analyzeCanvas" class="w-48 h-48 mb-6" />
      <p class="text-text-dim text-xs font-display tracking-widest animate-pulse">
        {{ analyzeText }}
      </p>
    </div>

    <!-- Stage 5: Response -->
    <div
      v-if="stage === 5"
      class="flex-1 flex flex-col items-center justify-center z-10 px-4 max-w-lg animate-fade-up"
    >
      <p class="text-text-dim text-xs font-display tracking-widest mb-6">LỜI HỒI ĐÁP</p>

      <div class="border border-text-dim/10 bg-white/[0.02] p-8 mb-6 w-full">
        <p class="text-text-primary italic text-lg leading-relaxed mb-4 font-display">
          "{{ response.oracle }}"
        </p>
        <p class="text-text-secondary text-sm leading-relaxed">{{ response.interpretation }}</p>
      </div>

      <!-- Behavioral analysis -->
      <div class="w-full border border-text-dim/10 bg-white/[0.02] p-6 mb-6">
        <p class="text-accent-amber text-xs font-display tracking-widest mb-3">PHÒNG TỐI THẤY GÌ</p>
        <div class="space-y-2">
          <div v-for="(obs, i) in observations" :key="i" class="text-text-dim text-xs flex gap-2">
            <span class="text-accent-sky">▸</span>
            <span>{{ obs }}</span>
          </div>
        </div>
      </div>

      <p class="text-text-dim/50 text-xs italic mb-6 text-center">
        Lời thì thầm của bạn đã tan vào bóng tối.
      </p>

      <div class="flex gap-3">
        <button
          class="border border-text-dim/20 px-6 py-2 font-display text-xs tracking-widest text-text-dim hover:text-accent-sky hover:border-accent-sky/30 transition-all"
          @click="resetAll"
        >
          THÌ THẦM LẠI
        </button>
        <RouterLink
          to="/"
          class="border border-text-dim/20 px-6 py-2 font-display text-xs tracking-widest text-text-dim hover:text-text-secondary transition-all"
        >
          RỜI PHÒNG
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'

const stage = ref(0)
const bgCanvas = ref<HTMLCanvasElement | null>(null)
const waveCanvas = ref<HTMLCanvasElement | null>(null)
const analyzeCanvas = ref<HTMLCanvasElement | null>(null)
const textInput = ref<HTMLTextAreaElement | null>(null)

// === Background animation ===
let bgAnimId = 0
const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number }[] =
  []
let clickRipples: { x: number; y: number; t: number }[] = []

function onAnyClick(e: MouseEvent) {
  clickRipples.push({ x: e.clientX, y: e.clientY, t: Date.now() })
}

function initParticles(w: number, h: number) {
  particles.length = 0
  for (let i = 0; i < 60; i++) {
    particles.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 2 + 0.5,
      alpha: Math.random() * 0.3,
    })
  }
}

function drawBackground() {
  const canvas = bgCanvas.value
  if (!canvas) {
    bgAnimId = requestAnimationFrame(drawBackground)
    return
  }
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const dpr = window.devicePixelRatio || 1
  canvas.width = window.innerWidth * dpr
  canvas.height = window.innerHeight * dpr
  ctx.scale(dpr, dpr)
  const w = window.innerWidth
  const h = window.innerHeight

  if (particles.length === 0) initParticles(w, h)

  ctx.fillStyle = 'rgba(0,0,0,0.15)'
  ctx.fillRect(0, 0, w, h)

  // Particles
  for (const p of particles) {
    p.x += p.vx
    p.y += p.vy
    if (p.x < 0) p.x = w
    if (p.x > w) p.x = 0
    if (p.y < 0) p.y = h
    if (p.y > h) p.y = 0
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(56, 189, 248, ${p.alpha})`
    ctx.fill()
  }

  // Click ripples
  const now = Date.now()
  clickRipples = clickRipples.filter((r) => now - r.t < 2000)
  for (const r of clickRipples) {
    const age = (now - r.t) / 2000
    const radius = age * 100
    ctx.beginPath()
    ctx.arc(r.x, r.y, radius, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(56, 189, 248, ${(1 - age) * 0.2})`
    ctx.lineWidth = 1
    ctx.stroke()
  }

  bgAnimId = requestAnimationFrame(drawBackground)
}

// === Voice Recording ===
const isRecording = ref(false)
const recordTime = ref(0)
const transcript = ref('')
let mediaRecorder: MediaRecorder | null = null
let audioCtx: AudioContext | null = null
let analyserNode: AnalyserNode | null = null
let waveAnimId = 0
let recordInterval: ReturnType<typeof setInterval> | null = null

async function startVoice() {
  stage.value = 2
  await nextTick()
}

function toggleRecording() {
  if (isRecording.value) stopRecording()
  else startRecording()
}

async function startRecording() {
  try {
    const micStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    audioCtx = new AudioContext()
    analyserNode = audioCtx.createAnalyser()
    analyserNode.fftSize = 256
    const source = audioCtx.createMediaStreamSource(micStream)
    source.connect(analyserNode)

    mediaRecorder = new MediaRecorder(micStream)
    isRecording.value = true
    recordTime.value = 0

    recordInterval = setInterval(() => {
      recordTime.value++
      if (recordTime.value >= 15) stopRecording()
    }, 1000)

    mediaRecorder.start()
    drawWaveform()

    // Speech recognition
    const SpeechRecognition =
      (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition
    if (SpeechRecognition) {
      const recognition = new (SpeechRecognition as {
        new (): {
          lang: string
          interimResults: boolean
          onresult: (e: { results: { transcript: string }[][] }) => void
          start: () => void
        }
      })()
      recognition.lang = 'vi-VN'
      recognition.interimResults = true
      recognition.onresult = (e: { results: { transcript: string }[][] }) => {
        const result = e.results[e.results.length - 1]
        if (result?.[0]) transcript.value = result[0].transcript
      }
      recognition.start()
    }
  } catch {
    // Fallback to typing if mic denied
    startTyping()
  }
}

function stopRecording() {
  isRecording.value = false
  if (recordInterval) {
    clearInterval(recordInterval)
    recordInterval = null
  }
  if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop()
  cancelAnimationFrame(waveAnimId)

  // Analyze voice behavior
  voiceBehavior.duration = recordTime.value
  voiceBehavior.hasContent = transcript.value.length > 0

  // Submit using transcript or behavior
  processWhisper(transcript.value || '[lời thì thầm không rõ]', 'voice')
}

function drawWaveform() {
  const canvas = waveCanvas.value
  if (!canvas || !analyserNode) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const dpr = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  ctx.scale(dpr, dpr)

  const bufferLength = analyserNode.frequencyBinCount
  const dataArray = new Uint8Array(bufferLength)
  analyserNode.getByteTimeDomainData(dataArray)

  ctx.fillStyle = 'rgba(0,0,0,0.3)'
  ctx.fillRect(0, 0, rect.width, rect.height)
  ctx.lineWidth = 2
  ctx.strokeStyle = '#38BDF8'
  ctx.beginPath()

  const sliceWidth = rect.width / bufferLength
  let x = 0
  for (let i = 0; i < bufferLength; i++) {
    const v = dataArray[i]! / 128.0
    const y = (v * rect.height) / 2
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
    x += sliceWidth
  }
  ctx.lineTo(rect.width, rect.height / 2)
  ctx.stroke()

  if (isRecording.value) waveAnimId = requestAnimationFrame(drawWaveform)
}

// === Typing Mode ===
const whisperText = ref('')
const pauseCount = ref(0)
const deleteCount = ref(0)
const typingIntensity = ref(0)
const typingSpeed = ref('---')
let lastKeyTime = 0
let keyIntervals: number[] = []
let pauseTimer: ReturnType<typeof setTimeout> | null = null

function startTyping() {
  stage.value = 3
  lastKeyTime = Date.now()
  nextTick(() => textInput.value?.focus())
}

function onTyping(e: Event) {
  const now = Date.now()
  const inputEvent = e as InputEvent

  // Track deletes
  if (inputEvent.inputType === 'deleteContentBackward') deleteCount.value++

  // Track pauses (> 2 seconds between keystrokes)
  if (lastKeyTime && now - lastKeyTime > 2000) pauseCount.value++

  // Track speed
  if (lastKeyTime) {
    keyIntervals.push(now - lastKeyTime)
    if (keyIntervals.length > 10) keyIntervals.shift()
    const avg = keyIntervals.reduce((a, b) => a + b, 0) / keyIntervals.length
    if (avg < 150) {
      typingSpeed.value = 'Rất nhanh'
      typingIntensity.value = 5
    } else if (avg < 300) {
      typingSpeed.value = 'Nhanh'
      typingIntensity.value = 4
    } else if (avg < 600) {
      typingSpeed.value = 'Vừa'
      typingIntensity.value = 3
    } else if (avg < 1200) {
      typingSpeed.value = 'Chậm'
      typingIntensity.value = 2
    } else {
      typingSpeed.value = 'Rất chậm'
      typingIntensity.value = 1
    }
  }

  lastKeyTime = now

  if (pauseTimer) clearTimeout(pauseTimer)
  pauseTimer = setTimeout(() => {
    typingIntensity.value = 0
  }, 2000)
}

const auraColorByIntensity = computed(() => {
  if (typingIntensity.value >= 4) return '#FF6B4A'
  if (typingIntensity.value >= 2) return '#FFB830'
  return '#38BDF8'
})

function submitWhisper() {
  processWhisper(whisperText.value, 'text')
}

// === Voice behavior tracking ===
const voiceBehavior = { duration: 0, hasContent: false }

// === Analyze & Response ===
const analyzeText = ref('Lắng nghe...')
const response = ref({ oracle: '', interpretation: '' })
const observations = ref<string[]>([])

const analyzeSteps = [
  'Lắng nghe...',
  'Phân tích dao động...',
  'Đọc ý nghĩa ẩn...',
  'Phòng tối phản hồi...',
]

interface OraclePool {
  keywords: string[]
  oracle: string
  interpretation: string
}

const oracleDB: OraclePool[] = [
  {
    keywords: ['nhớ', 'mẹ', 'cha', 'ba', 'bố', 'gia đình', 'nhà'],
    oracle: 'Cây lớn từ rễ không ai thấy.',
    interpretation:
      'Nỗi nhớ không phải yếu đuối. Nó là bằng chứng bạn biết yêu. Phòng tối thấy gốc rễ bạn sâu hơn bạn nghĩ.',
  },
  {
    keywords: ['sợ', 'lo', 'hoang mang', 'bất an', 'run'],
    oracle: 'Bóng tối không đuổi theo ai. Người ta tự chạy vào nó.',
    interpretation:
      'Bạn sợ — nhưng không biết sợ gì. Phòng tối nhận ra: nỗi sợ lớn nhất của bạn là sợ chính mình không đủ.',
  },
  {
    keywords: ['yêu', 'người ấy', 'anh', 'em', 'tình', 'thương', 'cô ấy', 'anh ấy'],
    oracle: 'Trái tim không có mắt. Nhưng nó thấy xa hơn mắt.',
    interpretation:
      'Bạn thì thầm về ai đó. Phòng tối không biết họ là ai — nhưng thấy rằng bạn đã cho đi nhiều hơn bạn nhận lại.',
  },
  {
    keywords: ['tiền', 'công việc', 'sự nghiệp', 'lương', 'giàu', 'nghèo'],
    oracle: 'Kho vàng lớn nhất nằm dưới nơi bạn đứng — nhưng bạn cứ đi tìm nơi khác.',
    interpretation:
      'Bạn đang lo về vật chất. Phòng tối thấy: điều bạn tìm kiếm không xa, nhưng bạn chưa nhìn xuống chân mình.',
  },
  {
    keywords: ['chết', 'mất', 'ra đi', 'vĩnh viễn', 'cuối', 'hết'],
    oracle: 'Mọi ngọn nến đều biết nó sẽ tắt. Nhưng nó vẫn cháy.',
    interpretation:
      'Suy nghĩ về cái kết không phải u ám. Nó là dấu hiệu bạn đang sống nghiêm túc. Phòng tối kính trọng sự dũng cảm đó.',
  },
  {
    keywords: ['xin lỗi', 'sorry', 'lỗi', 'sai', 'hối hận'],
    oracle: 'Vết thương không lành bằng sự quên — mà bằng sự thừa nhận.',
    interpretation:
      'Bạn mang theo lời xin lỗi chưa nói. Phòng tối thấy nó nặng. Nhưng việc bạn nghĩ đến nó — đã là bước đầu.',
  },
]

const defaultOracle: OraclePool = {
  keywords: [],
  oracle: 'Gương mờ phản chiếu rõ hơn gương sáng.',
  interpretation:
    'Điều bạn thì thầm không phải điều bạn muốn biết — mà là điều bạn đã biết nhưng chưa dám thừa nhận. Phòng tối chỉ lặp lại những gì đã có sẵn bên trong bạn.',
}

function processWhisper(text: string, mode: 'voice' | 'text') {
  stage.value = 4

  let stepIndex = 0
  const stepInterval = setInterval(() => {
    stepIndex++
    if (stepIndex < analyzeSteps.length) {
      analyzeText.value = analyzeSteps[stepIndex]!
    } else {
      clearInterval(stepInterval)
    }
  }, 800)

  // Draw analyze animation
  nextTick(() => drawAnalyzeAnim())

  setTimeout(() => {
    clearInterval(stepInterval)

    // Find matching oracle
    const lowerText = text.toLowerCase()
    const matched = oracleDB.find((o) => o.keywords.some((k) => lowerText.includes(k)))
    const oracle = matched || defaultOracle
    response.value = { oracle: oracle.oracle, interpretation: oracle.interpretation }

    // Build observations based on behavior
    observations.value = []
    if (mode === 'voice') {
      if (voiceBehavior.duration < 3)
        observations.value.push('Bạn nói rất ngắn — có gì đó khó diễn đạt')
      else if (voiceBehavior.duration > 10)
        observations.value.push('Bạn nói dài — tâm sự này đã chất chứa lâu')
      observations.value.push('Bạn chọn nói thay vì gõ — bạn muốn được nghe, không chỉ được đọc')
    } else {
      if (deleteCount.value > 5)
        observations.value.push(
          `Bạn xóa ${deleteCount.value} lần — bạn cân nhắc từng chữ, sợ nói sai`,
        )
      if (pauseCount.value > 3)
        observations.value.push(
          `${pauseCount.value} lần dừng lại — có những đoạn bạn phải suy nghĩ rất lâu`,
        )
      if (typingIntensity.value >= 4)
        observations.value.push('Bạn gõ rất nhanh — cảm xúc đang dâng, không kịp kiểm soát')
      else if (typingIntensity.value <= 1)
        observations.value.push('Bạn gõ chậm rãi — mỗi chữ đều mang trọng lượng')
      if (text.length > 200)
        observations.value.push(
          'Bạn viết nhiều — nỗi niềm này lớn hơn bạn thường cho người khác thấy',
        )
      else if (text.length < 20)
        observations.value.push('Vài chữ thôi — nhưng phòng tối thấy nó nặng hơn ngàn trang')
    }

    if (observations.value.length === 0)
      observations.value.push('Phòng tối ghi nhận sự im lặng giữa những từ ngữ')

    stage.value = 5
  }, 3500)
}

let analyzeAnimId = 0
function drawAnalyzeAnim() {
  const canvas = analyzeCanvas.value
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

  // Pulsing rings
  for (let i = 0; i < 5; i++) {
    const r = 20 + i * 15 + Math.sin(time * 2 + i) * 5
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(56, 189, 248, ${0.1 + (1 - i / 5) * 0.15})`
    ctx.lineWidth = 1
    ctx.stroke()
  }

  // Center dot
  ctx.beginPath()
  ctx.arc(cx, cy, 3 + Math.sin(time * 3) * 2, 0, Math.PI * 2)
  ctx.fillStyle = '#38BDF8'
  ctx.fill()

  if (stage.value === 4) analyzeAnimId = requestAnimationFrame(drawAnalyzeAnim)
}

function enterRoom() {
  stage.value = 1
}

function resetAll() {
  stage.value = 0
  whisperText.value = ''
  transcript.value = ''
  pauseCount.value = 0
  deleteCount.value = 0
  typingIntensity.value = 0
  typingSpeed.value = '---'
  keyIntervals = []
  recordTime.value = 0
  observations.value = []
}

onMounted(() => {
  drawBackground()
})
onUnmounted(() => {
  cancelAnimationFrame(bgAnimId)
  cancelAnimationFrame(waveAnimId)
  cancelAnimationFrame(analyzeAnimId)
  if (recordInterval) clearInterval(recordInterval)
  if (pauseTimer) clearTimeout(pauseTimer)
  if (audioCtx) audioCtx.close()
})
</script>
