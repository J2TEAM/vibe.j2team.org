<template>
  <div class="blow-page" :class="`state-${gameState}`">
    <!-- Dark editorial background -->
    <div class="editorial-bg">
      <div class="bg-grid"></div>
      <div class="bg-noise"></div>
      <span class="bg-number">💨</span>
      <div class="vol-badge">VOL.01 / 2026</div>
    </div>

    <!-- Home link -->
    <router-link to="/" class="home-link"> &larr; Home </router-link>

    <!-- ===== INTRO STATE ===== -->
    <div v-if="gameState === 'intro'" class="screen intro-screen">
      <div class="title-block">
        <div class="section-marker">// GAME</div>
        <h1 class="game-title">
          BLOW<br /><span class="title-accent-2">YOUR</span><span class="title-accent"> JOB</span>
        </h1>
        <p class="subtitle">Phổi bạn có khoẻ và lâu không?</p>
      </div>

      <div class="object-chooser">
        <p class="chooser-label">🎯 Chọn đối tượng bạn muốn thổi bay:</p>
        <div class="object-options">
          <button
            v-for="obj in defaultObjects"
            :key="obj.id"
            class="obj-btn"
            :class="{ selected: selectedObject.id === obj.id && !customObjectUrl }"
            @click="selectDefaultObject(obj)"
          >
            <span class="obj-emoji">{{ obj.emoji }}</span>
            <span class="obj-name">{{ obj.name }}</span>
          </button>
        </div>

        <div class="upload-section">
          <p class="upload-label">— hoặc tải lên đối tượng riêng của bạn —</p>
          <label class="upload-btn">
            📁 Tải hình ảnh lên
            <input type="file" accept="image/*" class="hidden-input" @change="handleFileUpload" />
          </label>
          <div v-if="customObjectUrl" class="custom-preview">
            <img :src="customObjectUrl" alt="Custom object" class="custom-img" />
            <button class="remove-btn" @click="removeCustom">✕</button>
          </div>
        </div>
      </div>

      <button class="start-btn" @click="requestMic">
        <span>IT'S BLOWING TIME!</span>
      </button>
    </div>

    <!-- ===== PERMISSION STATE ===== -->
    <div v-if="gameState === 'permission'" class="screen permission-screen">
      <div class="permission-card">
        <div class="perm-icon">🎙️</div>
        <h2 class="perm-title">Cho phép sử dụng Micro</h2>
        <p class="perm-text">
          Ứng dụng này cần quyền truy cập micro của bạn để biết bạn thổi giỏi như nào.
        </p>
        <div class="perm-dots">
          <span class="dot dot-1"></span>
          <span class="dot dot-2"></span>
          <span class="dot dot-3"></span>
        </div>
      </div>
    </div>

    <!-- ===== READY STATE ===== -->
    <div v-if="gameState === 'ready'" class="screen ready-screen">
      <div class="countdown-wrap">
        <p class="get-ready-text">CHUẨN BỊ</p>
        <div class="countdown-num">{{ countdown }}</div>
        <p class="position-text">HÍT THẬT SÂU, GIỮ HƠI THẬT NHIỀU!! 💪</p>
      </div>
    </div>

    <!-- ===== GO FLASH STATE ===== -->
    <div v-if="gameState === 'go'" class="screen go-screen">
      <div class="go-wrap">
        <div class="go-text">START</div>
        <div class="go-sub">💨 THỔI MẠNH!!</div>
      </div>
    </div>

    <!-- ===== PLAYING STATE ===== -->
    <div v-if="gameState === 'playing'" class="screen playing-screen">
      <!-- Blow meter on side -->
      <div class="meter-wrap">
        <div class="meter-track">
          <div class="meter-fill" :style="{ height: `${currentVolume * 100}%` }"></div>
          <div class="meter-glow" :style="{ opacity: currentVolume }"></div>
        </div>
        <span class="meter-label">POWER</span>
      </div>

      <!-- Flying object -->
      <div
        class="flying-object"
        :style="{
          bottom: `${objectPosition}%`,
          left: `${objectX}%`,
          transform: `translateX(-50%) scale(${objectScale}) rotate(${rotationAngle}deg)`,
        }"
      >
        <span v-if="!customObjectUrl" class="fly-emoji">{{ selectedObject.emoji }}</span>
        <img v-else :src="customObjectUrl" alt="object" class="fly-img" />
        <div class="trails" v-if="currentVolume > 0.1">
          <span class="trail t1">~</span>
          <span class="trail t2">~</span>
          <span class="trail t3">~</span>
        </div>
      </div>

      <!-- Instructions -->
      <div class="blow-hint">
        <span class="hint-icon">💨</span>
        <span>THỔI mạnh và liên tục vào mic của bạn!</span>
        <span class="hint-timer" :class="{ active: currentVolume > 0.05 }">
          {{ blowDurationSec.toFixed(1) }}s
        </span>
      </div>

      <!-- Volume bars decoration -->
      <div class="vol-bars">
        <div
          v-for="i in 12"
          :key="i"
          class="vol-bar"
          :style="{
            height: `${Math.random() * currentVolume * 60 + 8}px`,
            opacity: currentVolume > 0.05 ? 1 : 0.3,
          }"
        ></div>
      </div>
    </div>

    <!-- ===== RESULT STATE ===== -->
    <div v-if="gameState === 'result'" class="screen result-screen">
      <div class="result-card" :class="`tier-${resultTier}`">
        <div class="result-object">
          <span v-if="!customObjectUrl" class="result-emoji">{{ selectedObject.emoji }}</span>
          <img v-else :src="customObjectUrl" alt="object" class="result-img" />
        </div>

        <div class="result-content">
          <p class="result-height-label">Bạn đạt được</p>
          <div class="result-height">{{ finalScore.toLocaleString() }}</div>
          <p class="result-height-label">điểm 💨</p>

          <div class="result-tier-badge">
            <span class="tier-icon">{{ tierData[resultTier].icon }}</span>
            <h2 class="tier-title">{{ tierData[resultTier].title }}</h2>
          </div>

          <p class="tier-desc">{{ tierData[resultTier].desc }}</p>

          <div class="stats-row">
            <div class="stat-badge">
              <span class="stat-icon">🎙️</span>
              <span class="stat-label">Cường độ</span>
              <span class="stat-value">{{ peakDb.toFixed(1) }}</span>
              <span class="stat-unit">dB</span>
            </div>
            <div class="stats-divider"></div>
            <div class="stat-badge">
              <span class="stat-icon">⏱️</span>
              <span class="stat-label">Thời gian giữ hơi</span>
              <span class="stat-value">{{ blowDurationSec.toFixed(1) }}</span>
              <span class="stat-unit">s</span>
            </div>
          </div>

          <div class="stars">
            <span
              v-for="i in 3"
              :key="i"
              class="star"
              :class="{ lit: i <= tierData[resultTier].stars }"
              >⭐</span
            >
          </div>
        </div>
      </div>

      <div class="result-actions">
        <button class="retry-btn" @click="resetGame">🔄 Thử lại</button>
        <button class="change-btn" @click="goToIntro">🎯 Đổi đối tượng</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'

// ---- Types ----
type GameState = 'intro' | 'permission' | 'ready' | 'go' | 'playing' | 'result'
type ResultTier = 'noob' | 'soso' | 'god'

interface DefaultObject {
  id: string
  emoji: string
  name: string
}

// ---- State ----
const gameState = ref<GameState>('intro')
const currentVolume = ref(0)
const objectPosition = ref(5)
const objectX = ref(50)
const objectScale = ref(1)
const rotationAngle = ref(0)
const finalScore = ref(0)
const peakDb = ref(-60)
const blowDurationSec = ref(0)
const resultTier = ref<ResultTier>('noob')
const countdown = ref(3)
const customObjectUrl = ref<string | null>(null)

const defaultObjects: DefaultObject[] = [
  { id: 'feather', emoji: '💸', name: 'Lương tháng của bạn' },
  { id: 'balloon', emoji: '😼', name: 'Quàng thượng' },
  { id: 'cloud', emoji: '💔', name: 'Traitimcodon' },
  { id: 'leaf', emoji: '🧑‍💻', name: 'Sếp' },
  { id: 'paper', emoji: '📄', name: 'Final6969EmSuaThemTyNuaLaDuoc' },
  { id: 'star', emoji: '🐍', name: 'Đồng nghiệp' },
]

const selectedObject = ref<DefaultObject>(defaultObjects[0]!)

const tierData = {
  noob: {
    icon: '🥤',
    title: 'NGƯỜI THỔI SÁO',
    desc: 'Có vẻ bạn là một người đi nhẹ nói khẽ cười duyên 🥹.',
    stars: 1,
  },
  soso: {
    icon: '💨',
    title: 'NGƯỜI THỔI KÈN',
    desc: 'Bạn thuộc nhóm "bẫy hít thở trung bình", cố gắng hơn nữa nhé 😤!',
    stars: 2,
  },
  god: {
    icon: '🌪️',
    title: 'VUA THỔI LỌ',
    desc: 'Bạn biết cách nén cơn đau vào từng hơi thở. Một khi bùng nổ, bạn sẽ thổi bay cả văn phòng 🤯.',
    stars: 3,
  },
}

// ---- Audio ----
let audioContext: AudioContext | null = null
let analyser: AnalyserNode | null = null
let microphone: MediaStreamAudioSourceNode | null = null
let stream: MediaStream | null = null
let animFrame: number | null = null
let maxReached = 0
let maxDb = -60
let totalDbSum = 0
let totalBlowFrames = 0
let silenceTimer = 0
let noBlowFrames = 0
let blowDetected = false
let blowStartTs = 0
let totalBlowMs = 0
let gameTimer: ReturnType<typeof setTimeout> | null = null
let countdownTimer: ReturnType<typeof setTimeout> | null = null

let velX = 0
let velY = 0
let spinSpeed = 0

const DB_MIN = -60
const DB_MAX = -5
const DB_BLOW_THRESHOLD = -35
const NO_BLOW_TIMEOUT_FRAMES = 130

function computeDb(analyserNode: AnalyserNode): number {
  const buf = new Float32Array(analyserNode.fftSize)
  analyserNode.getFloatTimeDomainData(buf)
  const rms = Math.sqrt(buf.reduce((sum, v) => sum + v * v, 0) / buf.length)
  if (rms === 0) return DB_MIN
  return Math.max(DB_MIN, Math.min(0, 20 * Math.log10(rms)))
}

function dbToNorm(db: number): number {
  return Math.max(0, Math.min(1, (db - DB_MIN) / (DB_MAX - DB_MIN)))
}

function selectDefaultObject(obj: DefaultObject) {
  selectedObject.value = obj
  customObjectUrl.value = null
}

function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (customObjectUrl.value) URL.revokeObjectURL(customObjectUrl.value)
  customObjectUrl.value = URL.createObjectURL(file)
}

function removeCustom() {
  if (customObjectUrl.value) URL.revokeObjectURL(customObjectUrl.value)
  customObjectUrl.value = null
}

async function requestMic() {
  gameState.value = 'permission'
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    audioContext = new AudioContext()
    analyser = audioContext.createAnalyser()
    analyser.fftSize = 2048
    analyser.smoothingTimeConstant = 0.4
    microphone = audioContext.createMediaStreamSource(stream)
    microphone.connect(analyser)
    startCountdown()
  } catch {
    alert('Microphone permission denied! Please allow mic access and try again.')
    gameState.value = 'intro'
  }
}

function startCountdown() {
  gameState.value = 'ready'
  countdown.value = 3
  const tick = () => {
    countdown.value--
    if (countdown.value <= 0) {
      gameState.value = 'go'
      countdownTimer = setTimeout(() => startGame(), 900)
    } else {
      countdownTimer = setTimeout(tick, 1000)
    }
  }
  countdownTimer = setTimeout(tick, 1000)
}

function startGame() {
  gameState.value = 'playing'
  objectPosition.value = 5
  objectX.value = 50
  objectScale.value = 1
  rotationAngle.value = 0
  velX = 0
  velY = 0
  spinSpeed = 0
  maxReached = 0
  maxDb = DB_MIN
  totalDbSum = 0
  totalBlowFrames = 0
  silenceTimer = 0
  noBlowFrames = 0
  blowDetected = false
  blowStartTs = 0
  totalBlowMs = 0
  currentVolume.value = 0
  peakDb.value = DB_MIN
  blowDurationSec.value = 0

  gameTimer = setTimeout(() => endGame(), 8000)
  tickAudio()
}

function tickAudio() {
  if (!analyser) return

  const db = computeDb(analyser)
  const vol = dbToNorm(db)
  currentVolume.value = vol

  const isBlow = db > DB_BLOW_THRESHOLD
  const now = performance.now()

  if (isBlow) {
    if (!blowDetected || silenceTimer > 0) {
      blowStartTs = now
      velX += (Math.random() - 0.5) * 1.6
    }
    blowDetected = true
    noBlowFrames = 0
    silenceTimer = 0

    if (db > maxDb) {
      maxDb = db
      peakDb.value = db
    }

    totalDbSum += vol
    totalBlowFrames++

    blowDurationSec.value = (totalBlowMs + (now - blowStartTs)) / 1000

    velY = vol * 2.2
    velX += (Math.random() - 0.5) * 0.18
    velX = Math.max(-3.0, Math.min(3.0, velX))
    spinSpeed = velX * 4 + (Math.random() - 0.5) * vol * 8

    maxReached = Math.max(maxReached, objectPosition.value)
  } else {
    if (!blowDetected) {
      noBlowFrames++
      if (noBlowFrames > NO_BLOW_TIMEOUT_FRAMES) {
        endGame()
        return
      }
    } else {
      if (silenceTimer === 0 && blowStartTs > 0) {
        totalBlowMs += now - blowStartTs
        blowStartTs = 0
      }
      silenceTimer++

      velY = Math.max(velY - 0.14, -2.0)
      velX *= 0.96
      spinSpeed *= 0.94

      if (silenceTimer > 40) {
        endGame()
        return
      }
    }
  }

  objectPosition.value = Math.max(4, Math.min(92, objectPosition.value + velY))
  objectX.value = objectX.value + velX
  rotationAngle.value = rotationAngle.value + spinSpeed

  if (objectX.value < 6) {
    objectX.value = 6
    velX = Math.abs(velX) * 0.7
    spinSpeed = Math.abs(spinSpeed)
  }
  if (objectX.value > 94) {
    objectX.value = 94
    velX = -Math.abs(velX) * 0.7
    spinSpeed = -Math.abs(spinSpeed)
  }

  objectScale.value = 1 + (objectPosition.value / 100) * 2.5

  animFrame = requestAnimationFrame(tickAudio)
}

function endGame() {
  if (animFrame) cancelAnimationFrame(animFrame)
  if (gameTimer) clearTimeout(gameTimer)

  if (blowStartTs > 0) {
    totalBlowMs += performance.now() - blowStartTs
    blowStartTs = 0
  }
  blowDurationSec.value = totalBlowMs / 1000
  currentVolume.value = 0

  const avgDbNorm = totalBlowFrames > 0 ? totalDbSum / totalBlowFrames : 0
  finalScore.value = Math.round(avgDbNorm * blowDurationSec.value * 1000)

  const powerScore = dbToNorm(maxDb)
  const enduranceScore = Math.min(blowDurationSec.value / 12, 1)
  const combined = powerScore * 0.6 + enduranceScore * 0.4

  if (combined < 0.4) resultTier.value = 'noob'
  else if (combined < 0.7) resultTier.value = 'soso'
  else resultTier.value = 'god'

  gameState.value = 'result'
  stopAudio()
}

function stopAudio() {
  if (animFrame) cancelAnimationFrame(animFrame)
  if (stream) stream.getTracks().forEach((t) => t.stop())
  if (audioContext) audioContext.close()
  stream = null
  audioContext = null
  analyser = null
  microphone = null
}

function resetGame() {
  stopAudio()
  objectPosition.value = 5
  objectX.value = 50
  objectScale.value = 1
  rotationAngle.value = 0
  requestMic()
}

function goToIntro() {
  stopAudio()
  if (countdownTimer) clearTimeout(countdownTimer)
  if (gameTimer) clearTimeout(gameTimer)
  objectPosition.value = 5
  objectX.value = 50
  objectScale.value = 1
  rotationAngle.value = 0
  gameState.value = 'intro'
}

onUnmounted(() => {
  stopAudio()
  if (countdownTimer) clearTimeout(countdownTimer)
  if (gameTimer) clearTimeout(gameTimer)
  if (customObjectUrl.value) URL.revokeObjectURL(customObjectUrl.value)
})
</script>

<style scoped>
/* ---- Design tokens (from project main.css) ---- */
/* bg-deep: #0F1923 | bg-surface: #162232 | bg-elevated: #1E2F42  */
/* coral: #FF6B4A | amber: #FFB830 | sky: #38BDF8                  */
/* text-primary: #F0EDE6 | text-secondary: #8B9DB5 | dim: #4A6180  */
/* border-default: #253549                                          */
/* Fonts: Anybody (display) | Be Vietnam Pro (body)                 */

/* ---- Base ---- */
.blow-page {
  font-family: 'Be Vietnam Pro', sans-serif;
  min-height: 100vh;
  width: 100%;
  position: relative;
  overflow: hidden;
  background: #0f1923;
  color: #f0ede6;
}

/* ---- Editorial background ---- */
.editorial-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

/* Subtle dot grid */
.bg-grid {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle, #253549 1px, transparent 1px);
  background-size: 32px 32px;
  opacity: 0.6;
}

/* Noise overlay */
.bg-noise {
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  opacity: 0.025;
}

/* Large faded background emoji */
.bg-number {
  position: absolute;
  bottom: -60px;
  right: -40px;
  font-size: 340px;
  opacity: 0.03;
  line-height: 1;
  user-select: none;
  filter: grayscale(1);
}

/* VOL badge */
.vol-badge {
  position: absolute;
  top: 20px;
  right: 20px;
  background: #ff6b4a;
  color: #0f1923;
  font-family: 'Anybody', cursive;
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 2px;
  padding: 6px 12px;
  transform: rotate(3deg);
}

/* ---- Home link (design system pattern) ---- */
.home-link {
  position: fixed;
  top: 16px;
  left: 16px;
  z-index: 100;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #253549;
  background: #162232;
  color: #8b9db5;
  text-decoration: none;
  padding: 8px 20px;
  font-family: 'Be Vietnam Pro', sans-serif;
  font-size: 14px;
  font-weight: 500;
  transition:
    border-color 0.2s,
    color 0.2s;
}
.home-link:hover {
  border-color: #ff6b4a;
  color: #f0ede6;
}

/* ---- Screen base ---- */
.screen {
  position: relative;
  z-index: 10;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px 40px;
}

/* ---- INTRO ---- */
.intro-screen {
  gap: 28px;
}

.title-block {
  text-align: center;
}

.section-marker {
  font-family: 'Anybody', cursive;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 3px;
  color: #ff6b4a;
  margin-bottom: 12px;
}

.game-title {
  font-family: 'Anybody', cursive;
  font-size: clamp(52px, 11vw, 88px);
  font-weight: 800;
  line-height: 0.92;
  color: #f0ede6;
  margin: 0;
  letter-spacing: -2px;
}
.title-accent {
  color: #ff6b4a;
}
.title-accent-2 {
  color: #ffb830;
}

.subtitle {
  margin-top: 16px;
  font-size: 16px;
  font-weight: 500;
  color: #8b9db5;
}

/* Object chooser card */
.object-chooser {
  background: #162232;
  border: 1px solid #253549;
  padding: 24px;
  width: 100%;
  max-width: 480px;
  transition: border-color 0.2s;
}
.object-chooser:hover {
  border-color: #ff6b4a;
}

.chooser-label {
  font-family: 'Be Vietnam Pro', sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: #8b9db5;
  margin: 0 0 14px;
  text-align: center;
  letter-spacing: 0.5px;
}

.object-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 20px;
}

.obj-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px;
  border: 1px solid #253549;
  background: #0f1923;
  cursor: pointer;
  transition: all 0.15s;
  font-family: 'Be Vietnam Pro', sans-serif;
  color: #f0ede6;
}
.obj-btn:hover {
  border-color: #38bdf8;
  background: #162232;
  transform: translateY(-2px);
}
.obj-btn.selected {
  border-color: #ff6b4a;
  background: rgba(255, 107, 74, 0.08);
}

.obj-emoji {
  font-size: 28px;
}
.obj-name {
  font-size: 10px;
  font-weight: 600;
  color: #8b9db5;
  text-align: center;
  line-height: 1.2;
}

.upload-section {
  text-align: center;
}
.upload-label {
  font-family: 'Be Vietnam Pro', sans-serif;
  color: #4a6180;
  font-weight: 500;
  font-size: 12px;
  margin-bottom: 10px;
  display: block;
}

.upload-btn {
  display: inline-block;
  border: 1px solid #ffb830;
  background: rgba(255, 184, 48, 0.08);
  color: #ffb830;
  padding: 10px 24px;
  font-family: 'Be Vietnam Pro', sans-serif;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition:
    background 0.15s,
    transform 0.15s;
  letter-spacing: 0.5px;
}
.upload-btn:hover {
  background: rgba(255, 184, 48, 0.15);
  transform: translateY(-2px);
}
.hidden-input {
  display: none;
}

.custom-preview {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 8px 12px;
  background: rgba(56, 189, 248, 0.08);
  border: 1px solid #38bdf8;
}
.custom-img {
  width: 40px;
  height: 40px;
  object-fit: contain;
}
.remove-btn {
  background: rgba(255, 107, 74, 0.15);
  border: 1px solid #ff6b4a;
  width: 24px;
  height: 24px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 800;
  color: #ff6b4a;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}
.remove-btn:hover {
  background: rgba(255, 107, 74, 0.3);
}

.start-btn {
  font-family: 'Anybody', cursive;
  font-size: 22px;
  font-weight: 700;
  padding: 16px 48px;
  background: #ff6b4a;
  color: #0f1923;
  border: none;
  cursor: pointer;
  letter-spacing: 1px;
  transition:
    background 0.15s,
    transform 0.15s,
    box-shadow 0.15s;
  box-shadow: 4px 4px 0 #9a3412;
}
.start-btn:hover {
  background: #ff835e;
  transform: translateY(-3px);
  box-shadow: 4px 7px 0 #9a3412;
}
.start-btn:active {
  transform: translateY(0);
  box-shadow: 2px 2px 0 #9a3412;
}

/* ---- PERMISSION ---- */
.permission-card {
  background: #162232;
  border: 1px solid #253549;
  padding: 48px 40px;
  text-align: center;
  max-width: 360px;
  width: 100%;
}
.perm-icon {
  font-size: 64px;
  animation: pulse 1s ease-in-out infinite;
  display: block;
  margin-bottom: 16px;
}
@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.12);
  }
}
.perm-title {
  font-family: 'Be Vietnam Pro', sans-serif;
  font-weight: 800;
  font-size: 24px;
  color: #f0ede6;
  margin: 0 0 10px;
}
.perm-text {
  font-family: 'Be Vietnam Pro', sans-serif;
  color: #8b9db5;
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 28px;
  line-height: 1.6;
}
.perm-dots {
  display: flex;
  gap: 10px;
  justify-content: center;
}
.dot {
  width: 10px;
  height: 10px;
  background: #253549;
  border-radius: 50%;
  animation: dotBounce 1s ease-in-out infinite;
}
.dot-2 {
  animation-delay: 0.2s;
}
.dot-3 {
  animation-delay: 0.4s;
}
@keyframes dotBounce {
  0%,
  100% {
    transform: translateY(0);
    background: #253549;
  }
  50% {
    transform: translateY(-8px);
    background: #ff6b4a;
  }
}

/* ---- READY ---- */
.countdown-wrap {
  text-align: center;
}
.get-ready-text {
  font-family: 'Be Vietnam Pro', sans-serif;
  font-weight: 800;
  font-size: 28px;
  color: #8b9db5;
  margin-bottom: 16px;
  letter-spacing: 4px;
  text-transform: uppercase;
}
.countdown-num {
  font-family: 'Anybody', cursive;
  font-size: 140px;
  font-weight: 800;
  color: #ff6b4a;
  line-height: 1;
  animation: countPop 1s ease-in-out;
  text-shadow: 6px 6px 0 rgba(255, 107, 74, 0.25);
}
@keyframes countPop {
  0% {
    transform: scale(0.4);
    opacity: 0;
  }
  60% {
    transform: scale(1.15);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
.position-text {
  font-family: 'Be Vietnam Pro', sans-serif;
  font-weight: 700;
  color: #8b9db5;
  font-size: 17px;
  margin-top: 20px;
}

/* ---- PLAYING ---- */
.playing-screen {
  position: relative;
  padding: 0;
  justify-content: flex-end;
}

/* Meter */
.meter-wrap {
  position: fixed;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  z-index: 20;
}
.meter-track {
  width: 18px;
  height: 200px;
  background: #162232;
  border: 1px solid #253549;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}
.meter-fill {
  width: 100%;
  background: linear-gradient(180deg, #ff6b4a 0%, #ffb830 60%, #38bdf8 100%);
  transition: height 0.05s linear;
  min-height: 3px;
}
.meter-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, rgba(255, 107, 74, 0.35), transparent);
  pointer-events: none;
  transition: opacity 0.1s;
}
.meter-label {
  font-family: 'Anybody', cursive;
  font-size: 9px;
  font-weight: 700;
  color: #4a6180;
  letter-spacing: 2px;
}

/* Flying object */
.flying-object {
  position: fixed;
  transform-origin: center center;
  z-index: 15;
  text-align: center;
  will-change: transform, bottom, left;
}
.fly-emoji {
  font-size: 56px;
  display: block;
  filter: drop-shadow(0 8px 20px rgba(255, 107, 74, 0.3));
}
.fly-img {
  width: 80px;
  height: 80px;
  object-fit: contain;
  filter: drop-shadow(0 8px 20px rgba(255, 107, 74, 0.3));
}
.trails {
  position: absolute;
  top: 50%;
  right: -20px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.trail {
  color: #ff6b4a;
  font-size: 18px;
  font-weight: 900;
  opacity: 0;
  animation: trailFade 0.5s ease-in-out infinite;
}
.t2 {
  animation-delay: 0.15s;
}
.t3 {
  animation-delay: 0.3s;
}
@keyframes trailFade {
  0%,
  100% {
    opacity: 0;
    transform: translateX(0);
  }
  50% {
    opacity: 0.7;
    transform: translateX(8px);
  }
}

.blow-hint {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 10px;
  background: #162232;
  border: 1px solid #253549;
  padding: 12px 24px;
  font-family: 'Be Vietnam Pro', sans-serif;
  font-size: 15px;
  font-weight: 700;
  color: #f0ede6;
  white-space: nowrap;
}
.hint-icon {
  animation: hintBlow 1s ease-in-out infinite;
  display: inline-block;
}
@keyframes hintBlow {
  0%,
  100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(6px);
  }
}

.vol-bars {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 60px;
  padding-bottom: 4px;
}
.vol-bar {
  width: 5px;
  min-height: 6px;
  background: linear-gradient(180deg, #ff6b4a, #ffb830);
  transition:
    height 0.1s ease,
    opacity 0.3s;
}

/* Live timer */
.hint-timer {
  font-family: 'Anybody', cursive;
  font-size: 18px;
  font-weight: 700;
  color: #4a6180;
  min-width: 44px;
  transition: color 0.15s;
}
.hint-timer.active {
  color: #ff6b4a;
}

/* ---- GO FLASH ---- */
.go-screen {
  background: transparent;
}
.go-wrap {
  text-align: center;
  animation: goFlash 0.9s ease-in-out;
}
.go-text {
  font-family: 'Anybody', cursive;
  font-size: clamp(96px, 22vw, 160px);
  font-weight: 800;
  color: #ff6b4a;
  line-height: 1;
  text-shadow: 6px 6px 0 rgba(255, 107, 74, 0.25);
  animation: goScale 0.9s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.go-sub {
  font-family: 'Be Vietnam Pro', sans-serif;
  font-weight: 800;
  font-size: clamp(22px, 5.5vw, 38px);
  color: #ffb830;
  margin-top: 8px;
  animation: goFadeIn 0.3s ease-in 0.15s both;
  letter-spacing: 1px;
}
@keyframes goScale {
  0% {
    transform: scale(0.3) rotate(-10deg);
    opacity: 0;
  }
  60% {
    transform: scale(1.15) rotate(2deg);
    opacity: 1;
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}
@keyframes goFadeIn {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes goFlash {
  0%,
  100% {
    filter: brightness(1);
  }
  30% {
    filter: brightness(1.2);
  }
}

/* ---- RESULT ---- */
.result-screen {
  gap: 24px;
}

.result-card {
  background: #162232;
  border: 1px solid #253549;
  padding: 32px 28px;
  text-align: center;
  width: 100%;
  max-width: 420px;
  animation: resultPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  overflow: hidden;
}
.result-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
}
.tier-noob::before {
  background: #ffb830;
}
.tier-soso::before {
  background: #38bdf8;
}
.tier-god::before {
  background: #ff6b4a;
}

@keyframes resultPop {
  0% {
    transform: scale(0.75);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.result-object {
  margin-bottom: 8px;
}
.result-emoji {
  font-size: 72px;
  display: block;
  animation: resultFloat 2s ease-in-out infinite;
}
.result-img {
  width: 90px;
  height: 90px;
  object-fit: contain;
  animation: resultFloat 2s ease-in-out infinite;
}
@keyframes resultFloat {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.result-height-label {
  font-family: 'Be Vietnam Pro', sans-serif;
  color: #4a6180;
  font-size: 13px;
  font-weight: 600;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.result-height {
  font-family: 'Anybody', cursive;
  font-size: 72px;
  font-weight: 800;
  line-height: 1;
  color: #f0ede6;
  margin: 4px 0;
}

.result-tier-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin: 16px 0 8px;
  padding: 14px 24px;
  background: #1e2f42;
  border: 1px solid #253549;
}
.tier-icon {
  font-size: 36px;
}
.tier-title {
  font-family: 'Be Vietnam Pro', sans-serif;
  font-weight: 800;
  font-size: clamp(18px, 5vw, 26px);
  margin: 0;
  color: #f0ede6;
  letter-spacing: 1px;
}

.tier-desc {
  font-family: 'Be Vietnam Pro', sans-serif;
  color: #8b9db5;
  font-size: 14px;
  font-weight: 500;
  margin: 0 0 16px;
  line-height: 1.6;
}

/* Stats row */
.stats-row {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1e2f42;
  border: 1px solid #253549;
  padding: 12px 8px;
  margin: 10px 0 14px;
}
.stat-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  flex: 1;
}
.stat-icon {
  font-size: 18px;
}
.stat-value {
  font-family: 'Anybody', cursive;
  font-size: 28px;
  font-weight: 700;
  color: #f0ede6;
  line-height: 1;
}
.stat-unit {
  font-family: 'Anybody', cursive;
  font-size: 12px;
  font-weight: 600;
  color: #8b9db5;
}
.stat-label {
  font-family: 'Be Vietnam Pro', sans-serif;
  font-size: 10px;
  font-weight: 600;
  color: #4a6180;
  letter-spacing: 0.5px;
}
.stats-divider {
  width: 1px;
  height: 44px;
  background: #253549;
  flex-shrink: 0;
  margin: 0 8px;
}

.stars {
  font-size: 28px;
  letter-spacing: 4px;
  margin-top: 4px;
}
.star {
  filter: grayscale(1);
  opacity: 0.2;
  transition: all 0.3s;
}
.star.lit {
  filter: grayscale(0);
  opacity: 1;
  animation: starPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}
@keyframes starPop {
  0% {
    transform: scale(0);
  }
  70% {
    transform: scale(1.3);
  }
  100% {
    transform: scale(1);
  }
}

/* Result actions */
.result-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}
.retry-btn,
.change-btn {
  font-family: 'Be Vietnam Pro', sans-serif;
  font-size: 15px;
  font-weight: 700;
  padding: 13px 28px;
  cursor: pointer;
  transition:
    transform 0.15s,
    box-shadow 0.15s;
  border: none;
  letter-spacing: 0.5px;
}
.retry-btn {
  background: #ff6b4a;
  color: #0f1923;
  box-shadow: 3px 3px 0 #9a3412;
}
.retry-btn:hover {
  transform: translateY(-3px);
  box-shadow: 3px 6px 0 #9a3412;
}
.change-btn {
  background: transparent;
  color: #8b9db5;
  border: 1px solid #253549;
}
.change-btn:hover {
  border-color: #ff6b4a;
  color: #f0ede6;
  transform: translateY(-2px);
}

/* ---- Responsive ---- */
@media (max-width: 480px) {
  .game-title {
    font-size: 52px;
  }
  .start-btn {
    font-size: 18px;
    padding: 14px 32px;
  }
  .meter-wrap {
    right: 8px;
  }
  .meter-track {
    height: 140px;
    width: 14px;
  }
  .result-card {
    padding: 24px 16px;
  }
  .result-height {
    font-size: 56px;
  }
  .object-options {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
