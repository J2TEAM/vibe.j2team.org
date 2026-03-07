<template>
  <div class="blow-page" :class="`state-${gameState}`">
    <!-- Sky background with animated clouds -->
    <div class="sky-bg">
      <div class="cloud cloud-1">☁️</div>
      <div class="cloud cloud-2">☁️</div>
      <div class="cloud cloud-3">☁️</div>
      <div class="sun">☀️</div>
      <div class="ground"></div>
    </div>

    <!-- Home link -->
    <router-link to="/" class="home-link">
      <span>🏠</span> Home
    </router-link>

    <!-- ===== INTRO STATE ===== -->
    <div v-if="gameState === 'intro'" class="screen intro-screen">
      <div class="title-block">
        <div class="title-emoji">💨</div>
        <h1 class="game-title">BLOW<br /><span class="title-accent-2">YOUR</span><span class="title-accent">JOB</span></h1>
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
            <input
              type="file"
              accept="image/*"
              class="hidden-input"
              @change="handleFileUpload"
            />
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
        <p class="perm-text">Ứng dụng này cần quyền truy cập micro của bạn để biết bạn thổi giỏi như nào.</p>
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
        <!-- wind trails -->
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
        <div v-for="i in 12" :key="i" class="vol-bar" :style="{ height: `${Math.random() * currentVolume * 60 + 8}px`, opacity: currentVolume > 0.05 ? 1 : 0.3 }"></div>
      </div>
    </div>

    <!-- ===== RESULT STATE ===== -->
    <div v-if="gameState === 'result'" class="screen result-screen">
      <div class="result-card" :class="`tier-${resultTier}`">
        <!-- Object at final height (smaller preview) -->
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

          <!-- Stats row: peak dB + duration -->
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

          <!-- Stars -->
          <div class="stars">
            <span v-for="i in 3" :key="i" class="star" :class="{ lit: i <= tierData[resultTier].stars }">⭐</span>
          </div>
        </div>
      </div>

      <div class="result-actions">
        <button class="retry-btn" @click="resetGame">
          🔄 Thử lại
        </button>
        <button class="change-btn" @click="goToIntro">
          🎯 Đổi đối tượng
        </button>
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
const objectPosition = ref(5)   // bottom %
const objectX = ref(50)         // left % (center of object)
const objectScale = ref(1)
const rotationAngle = ref(0)    // degrees, driven by physics each frame
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

const selectedObject = ref<DefaultObject>(defaultObjects[0])

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
let totalDbSum = 0      // sum of normalised dB values while blowing
let totalBlowFrames = 0 // frame count while blowing, for avg dB
let silenceTimer = 0
let noBlowFrames = 0
let blowDetected = false
let blowStartTs = 0
let totalBlowMs = 0
let gameTimer: ReturnType<typeof setTimeout> | null = null
let countdownTimer: ReturnType<typeof setTimeout> | null = null

// Physics (non-reactive, updated every rAF frame)
let velX = 0        // horizontal velocity % per frame
let velY = 0        // vertical velocity % per frame
let spinSpeed = 0   // rotation degrees per frame

// dB helpers
const DB_MIN = -60
const DB_MAX = -5
const DB_BLOW_THRESHOLD = -35
const NO_BLOW_TIMEOUT_FRAMES = 130  // ~2.2s at 60fps

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

// ---- Methods ----
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
  // Reset position & physics
  objectPosition.value = 5
  objectX.value = 50
  objectScale.value = 1
  rotationAngle.value = 0
  velX = 0
  velY = 0
  spinSpeed = 0
  // Reset tracking
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
    // Kick horizontal randomly at start of each new blow streak
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

    // Accumulate for average dB score
    totalDbSum += vol
    totalBlowFrames++

    // Live duration
    blowDurationSec.value = (totalBlowMs + (now - blowStartTs)) / 1000

    // Upward push proportional to volume
    velY = vol * 2.2

    // Gentle continuous horizontal drift while blowing — makes it wobble
    velX += (Math.random() - 0.5) * 0.18
    velX = Math.max(-3.0, Math.min(3.0, velX))

    // Spin speed tracks horizontal direction & power
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
      // Finalise streak timing on first silent frame
      if (silenceTimer === 0 && blowStartTs > 0) {
        totalBlowMs += now - blowStartTs
        blowStartTs = 0
      }
      silenceTimer++

      // Gravity pulls object back down
      velY = Math.max(velY - 0.14, -2.0)
      // Air resistance bleeds off horizontal & spin
      velX *= 0.96
      spinSpeed *= 0.94

      if (silenceTimer > 40) {
        endGame()
        return
      }
    }
  }

  // ---- Apply physics ----
  objectPosition.value = Math.max(4, Math.min(92, objectPosition.value + velY))
  objectX.value = objectX.value + velX
  rotationAngle.value = rotationAngle.value + spinSpeed

  // Bounce off left wall
  if (objectX.value < 6) {
    objectX.value = 6
    velX = Math.abs(velX) * 0.7        // reverse & lose a bit of energy
    spinSpeed = Math.abs(spinSpeed)     // spin feels natural after bounce
  }
  // Bounce off right wall
  if (objectX.value > 94) {
    objectX.value = 94
    velX = -Math.abs(velX) * 0.7
    spinSpeed = -Math.abs(spinSpeed)
  }

  // Scale grows with height
  objectScale.value = 1 + (objectPosition.value / 100) * 2.5

  animFrame = requestAnimationFrame(tickAudio)
}

function endGame() {
  if (animFrame) cancelAnimationFrame(animFrame)
  if (gameTimer) clearTimeout(gameTimer)

  // Finalise duration if still mid-blow when timer fires
  if (blowStartTs > 0) {
    totalBlowMs += performance.now() - blowStartTs
    blowStartTs = 0
  }
  blowDurationSec.value = totalBlowMs / 1000
  currentVolume.value = 0

  // Score = average normalised dB × duration (seconds) × 1000
  // Max possible ≈ 20000 (perfect 8s blast at peak volume)
  const avgDbNorm = totalBlowFrames > 0 ? totalDbSum / totalBlowFrames : 0
  finalScore.value = Math.round(avgDbNorm * blowDurationSec.value * 1000)

  // Combined tier: 60% peak dB power + 40% endurance (max 8s)
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
  if (stream) stream.getTracks().forEach(t => t.stop())
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
/* ---- Base ---- */
@import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Baloo+2:wght@400;600;700;800&display=swap');

.blow-page {
  font-family: 'Baloo 2', sans-serif;
  min-height: 100vh;
  width: 100%;
  position: relative;
  overflow: hidden;
  background: linear-gradient(180deg, #bde4ff 0%, #e8f7ff 60%, #d4f5c0 100%);
}

/* ---- Sky BG ---- */
.sky-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}
.sun {
  position: absolute;
  top: 40px;
  right: 60px;
  font-size: 64px;
  animation: sunSpin 20s linear infinite;
  filter: drop-shadow(0 0 20px #ffd60055);
}
@keyframes sunSpin { to { transform: rotate(360deg); } }

.cloud {
  position: absolute;
  font-size: 48px;
  opacity: 0.75;
  animation: drift linear infinite;
}
.cloud-1 { top: 12%; left: -80px; animation-duration: 30s; animation-delay: 0s; font-size: 36px; }
.cloud-2 { top: 28%; left: -80px; animation-duration: 45s; animation-delay: -15s; }
.cloud-3 { top: 18%; left: -80px; animation-duration: 38s; animation-delay: -7s; font-size: 56px; }
@keyframes drift { from { transform: translateX(-100px); } to { transform: translateX(110vw); } }

.ground {
  position: absolute;
  bottom: 0;
  left: 0; right: 0;
  height: 60px;
  background: linear-gradient(180deg, #86efac, #4ade80);
  border-radius: 50% 50% 0 0 / 20px 20px 0 0;
}

/* ---- Home link ---- */
.home-link {
  position: fixed;
  top: 16px;
  left: 16px;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 6px;
  background: white;
  color: #374151;
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(0,0,0,0.12);
  border: 2px solid #e5e7eb;
  transition: transform 0.15s, box-shadow 0.15s;
}
.home-link:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,0.15); }

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
.intro-screen { gap: 24px; }

.title-block { text-align: center; }
.title-emoji { font-size: 72px; line-height: 1; margin-bottom: 8px; animation: titleBounce 1.5s ease-in-out infinite; }
@keyframes titleBounce {
  0%, 100% { transform: translateY(0) rotate(-5deg); }
  50% { transform: translateY(-12px) rotate(5deg); }
}
.game-title {
  font-family: 'Fredoka One', cursive;
  font-size: clamp(48px, 10vw, 80px);
  line-height: 0.95;
  color: #1e3a5f;
  margin: 0;
  letter-spacing: -1px;
}
.title-accent {
  color: #f97316;
  -webkit-text-stroke: 2px #1e3a5f;
  paint-order: stroke fill;
}
.title-accent-2 {
  color: #ffffff;
  -webkit-text-stroke: 2px #1e3a5f;
  paint-order: stroke fill;
}
.subtitle {
  margin-top: 12px;
  font-size: 18px;
  font-weight: 700;
  color: #475569;
}

/* Object chooser */
.object-chooser {
  background: white;
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  border: 3px solid #e0f2fe;
  width: 100%;
  max-width: 480px;
}
.chooser-label, .upload-label {
  font-size: 15px;
  font-weight: 800;
  color: #374151;
  margin: 0 0 12px;
  text-align: center;
}
.object-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 20px;
}
.obj-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px;
  border: 2.5px solid #e5e7eb;
  border-radius: 16px;
  background: #f9fafb;
  cursor: pointer;
  transition: all 0.15s;
  font-family: 'Baloo 2', sans-serif;
}
.obj-btn:hover { border-color: #60a5fa; background: #eff6ff; transform: scale(1.04); }
.obj-btn.selected { border-color: #3b82f6; background: #dbeafe; box-shadow: 0 0 0 3px #93c5fd44; }
.obj-emoji { font-size: 32px; }
.obj-name { font-size: 11px; font-weight: 700; color: #6b7280; }

.upload-section { text-align: center; }
.upload-label { color: #9ca3af; font-weight: 600; font-size: 13px; margin-bottom: 10px; }
.upload-btn {
  display: inline-block;
  background: linear-gradient(135deg, #fde68a, #fbbf24);
  color: #92400e;
  padding: 10px 24px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  border: 2px solid #f59e0b;
  transition: transform 0.15s, box-shadow 0.15s;
  box-shadow: 0 4px 12px rgba(251,191,36,0.3);
}
.upload-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(251,191,36,0.4); }
.hidden-input { display: none; }
.custom-preview {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 8px 12px;
  background: #f0fdf4;
  border: 2px solid #86efac;
  border-radius: 12px;
}
.custom-img { width: 40px; height: 40px; object-fit: contain; border-radius: 8px; }
.remove-btn {
  background: #fecaca;
  border: none;
  border-radius: 999px;
  width: 24px;
  height: 24px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 800;
  color: #dc2626;
  display: flex;
  align-items: center;
  justify-content: center;
}

.start-btn {
  font-family: 'Fredoka One', cursive;
  font-size: 26px;
  padding: 18px 48px;
  border-radius: 999px;
  background: linear-gradient(135deg, #60a5fa, #3b82f6);
  color: white;
  border: 4px solid #1d4ed8;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(59,130,246,0.4), 0 4px 0 #1d4ed8;
  transition: transform 0.15s, box-shadow 0.15s;
  letter-spacing: 1px;
}
.start-btn:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 28px rgba(59,130,246,0.5), 0 4px 0 #1d4ed8;
}
.start-btn:active { transform: translateY(0); box-shadow: 0 4px 12px rgba(59,130,246,0.3), 0 2px 0 #1d4ed8; }

/* ---- PERMISSION ---- */
.permission-card {
  background: white;
  border-radius: 32px;
  padding: 48px 40px;
  text-align: center;
  box-shadow: 0 16px 48px rgba(0,0,0,0.12);
  border: 3px solid #e0f2fe;
  max-width: 360px;
}
.perm-icon { font-size: 72px; animation: pulse 1s ease-in-out infinite; }
@keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }
/* Vietnamese → Baloo 2 */
.perm-title {
  font-family: 'Baloo 2', sans-serif;
  font-weight: 800;
  font-size: 28px;
  color: #1e3a5f;
  margin: 12px 0 8px;
}
.perm-text { color: #6b7280; font-size: 16px; font-weight: 600; margin-bottom: 24px; }
.perm-dots { display: flex; gap: 10px; justify-content: center; }
.dot {
  width: 12px; height: 12px;
  background: #93c5fd;
  border-radius: 50%;
  animation: dotBounce 1s ease-in-out infinite;
}
.dot-2 { animation-delay: 0.2s; }
.dot-3 { animation-delay: 0.4s; }
@keyframes dotBounce { 0%, 100% { transform: translateY(0); background: #93c5fd; } 50% { transform: translateY(-8px); background: #3b82f6; } }

/* ---- READY ---- */
.countdown-wrap { text-align: center; }
/* Vietnamese → Baloo 2 */
.get-ready-text {
  font-family: 'Baloo 2', sans-serif;
  font-weight: 800;
  font-size: 32px;
  color: #1e3a5f;
  margin-bottom: 16px;
  letter-spacing: 3px;
}
.countdown-num {
  font-family: 'Fredoka One', cursive;
  font-size: 120px;
  color: #f97316;
  line-height: 1;
  animation: countPop 1s ease-in-out;
  text-shadow: 4px 4px 0 #9a3412;
  -webkit-text-stroke: 3px #9a3412;
}
@keyframes countPop {
  0% { transform: scale(0.5); opacity: 0; }
  60% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}
/* Vietnamese → Baloo 2 */
.position-text {
  font-family: 'Baloo 2', sans-serif;
  font-weight: 800;
  color: #475569;
  font-size: 18px;
  margin-top: 16px;
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
  width: 20px;
  height: 200px;
  background: rgba(255,255,255,0.5);
  border-radius: 999px;
  overflow: hidden;
  border: 3px solid white;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}
.meter-fill {
  width: 100%;
  border-radius: 999px;
  background: linear-gradient(180deg, #f97316 0%, #fbbf24 50%, #86efac 100%);
  transition: height 0.05s linear;
  min-height: 4px;
}
.meter-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, rgba(249,115,22,0.5), transparent);
  pointer-events: none;
  transition: opacity 0.1s;
}
.meter-label { font-size: 10px; font-weight: 900; color: #374151; letter-spacing: 1.5px; }

/* Flying object — no CSS transition, physics drives every frame */
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
  filter: drop-shadow(0 8px 16px rgba(0,0,0,0.15));
}
.fly-img {
  width: 80px;
  height: 80px;
  object-fit: contain;
  filter: drop-shadow(0 8px 16px rgba(0,0,0,0.2));
}
.trails { position: absolute; top: 50%; right: -20px; display: flex; flex-direction: column; gap: 2px; }
.trail {
  color: #93c5fd;
  font-size: 18px;
  font-weight: 900;
  opacity: 0;
  animation: trailFade 0.5s ease-in-out infinite;
}
.t2 { animation-delay: 0.15s; }
.t3 { animation-delay: 0.3s; }
@keyframes trailFade { 0%, 100% { opacity: 0; transform: translateX(0); } 50% { opacity: 0.7; transform: translateX(8px); } }

.blow-hint {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(8px);
  padding: 12px 24px;
  border-radius: 999px;
  font-size: 16px;
  font-weight: 800;
  color: #1e3a5f;
  border: 2px solid rgba(255,255,255,0.9);
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  white-space: nowrap;
}
.hint-icon { animation: hintBlow 1s ease-in-out infinite; display: inline-block; }
@keyframes hintBlow { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(6px); } }

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
  width: 6px;
  min-height: 8px;
  background: linear-gradient(180deg, #60a5fa, #93c5fd);
  border-radius: 3px 3px 0 0;
  transition: height 0.1s ease, opacity 0.3s;
}

/* ---- GO FLASH ---- */
.go-screen { background: transparent; }
.go-wrap { text-align: center; animation: goFlash 0.9s ease-in-out; }
/* "START" is English — Fredoka One fine */
.go-text {
  font-family: 'Fredoka One', cursive;
  font-size: clamp(96px, 22vw, 160px);
  color: #f97316;
  line-height: 1;
  -webkit-text-stroke: 4px #9a3412;
  text-shadow: 6px 6px 0 #9a3412;
  animation: goScale 0.9s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
/* Vietnamese → Baloo 2 */
.go-sub {
  font-family: 'Baloo 2', sans-serif;
  font-weight: 800;
  font-size: clamp(24px, 6vw, 40px);
  color: #1e3a5f;
  margin-top: 8px;
  animation: goFadeIn 0.3s ease-in 0.15s both;
}
@keyframes goScale {
  0%   { transform: scale(0.3) rotate(-10deg); opacity: 0; }
  60%  { transform: scale(1.15) rotate(3deg); opacity: 1; }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}
@keyframes goFadeIn {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes goFlash {
  0%, 100% { filter: brightness(1); }
  30%       { filter: brightness(1.3); }
}

/* ---- Stats row ---- */
.stats-row {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  padding: 12px 8px;
  margin: 10px 0 14px;
}
.stat-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  flex: 1;
}
.stat-icon { font-size: 20px; }
.stat-value {
  font-family: 'Fredoka One', cursive;
  font-size: 28px;
  color: #1e3a5f;
  line-height: 1;
}
.stat-unit {
  font-size: 13px;
  font-weight: 800;
  color: #64748b;
  margin-top: -2px;
}
.stat-label {
  font-size: 10px;
  font-weight: 700;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.stats-divider {
  width: 2px;
  height: 48px;
  background: #e2e8f0;
  border-radius: 1px;
  flex-shrink: 0;
  margin: 0 8px;
}

/* Live timer in hint */
.hint-timer {
  font-family: 'Fredoka One', cursive;
  font-size: 18px;
  color: #94a3b8;
  min-width: 44px;
  transition: color 0.15s;
}
.hint-timer.active { color: #f97316; }

/* ---- RESULT ---- */
.result-screen { gap: 24px; }

.result-card {
  background: white;
  border-radius: 32px;
  padding: 32px 28px;
  text-align: center;
  box-shadow: 0 16px 48px rgba(0,0,0,0.13);
  width: 100%;
  max-width: 420px;
  animation: resultPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
@keyframes resultPop {
  0% { transform: scale(0.7); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
.tier-noob { border: 4px solid #fbbf24; }
.tier-soso { border: 4px solid #60a5fa; }
.tier-god  { border: 4px solid #34d399; }

.result-object { margin-bottom: 8px; }
.result-emoji { font-size: 80px; display: block; animation: resultFloat 2s ease-in-out infinite; }
.result-img { width: 100px; height: 100px; object-fit: contain; animation: resultFloat 2s ease-in-out infinite; }
@keyframes resultFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }

.result-height-label { color: #9ca3af; font-size: 14px; font-weight: 700; margin: 0; }
.result-height {
  font-family: 'Fredoka One', cursive;
  font-size: 72px;
  line-height: 1;
  color: #1e3a5f;
  margin: 4px 0;
}
.result-tier-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin: 16px 0 8px;
  padding: 12px 24px;
  border-radius: 16px;
  background: #f8fafc;
}
.tier-icon { font-size: 40px; }
.tier-title {
  font-family: 'Baloo 2', sans-serif;
  font-weight: 800;
  font-size: clamp(20px, 5vw, 28px);
  margin: 0;
  color: #1e3a5f;
}
.tier-desc { color: #6b7280; font-size: 15px; font-weight: 600; margin: 0 0 16px; }

.stars { font-size: 32px; letter-spacing: 4px; }
.star { filter: grayscale(1); opacity: 0.3; transition: all 0.3s; }
.star.lit { filter: grayscale(0); opacity: 1; animation: starPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
@keyframes starPop { 0% { transform: scale(0); } 70% { transform: scale(1.3); } 100% { transform: scale(1); } }

.result-actions { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; }
.retry-btn, .change-btn {
  font-family: 'Baloo 2', sans-serif;
  font-size: 16px;
  font-weight: 800;
  padding: 14px 28px;
  border-radius: 999px;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
  border: 3px solid;
}
.retry-btn {
  background: linear-gradient(135deg, #60a5fa, #3b82f6);
  color: white;
  border-color: #1d4ed8;
  box-shadow: 0 6px 20px rgba(59,130,246,0.35);
}
.change-btn {
  background: white;
  color: #374151;
  border-color: #d1d5db;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}
.retry-btn:hover, .change-btn:hover { transform: translateY(-3px); }

/* ---- Responsive ---- */
@media (max-width: 480px) {
  .object-options { grid-template-columns: repeat(3, 1fr); }
  .game-title { font-size: 48px; }
  .start-btn { font-size: 20px; padding: 14px 32px; }
  .meter-wrap { right: 8px; }
  .meter-track { height: 140px; width: 16px; }
  .result-card { padding: 24px 16px; }
  .result-height { font-size: 56px; }
}
</style>
