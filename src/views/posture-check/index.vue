<script setup lang="ts">
import { ref, onUnmounted, computed, nextTick } from 'vue'
import { Icon } from '@iconify/vue'
import { useScriptTag, useLocalStorage } from '@vueuse/core'

// --- Types ---
interface PostureAlert {
  type: 'head_tilt' | 'shoulder_uneven' | 'too_close' | 'head_forward'
  message: string
  icon: string
}

type Landmark = { x: number; y: number; z: number; visibility: number }

// --- State ---
const videoRef = ref<HTMLVideoElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const stream = ref<MediaStream | null>(null)
const isLoading = ref(false)
const isRunning = ref(false)
const errorMessage = ref('')
const currentAlerts = ref<PostureAlert[]>([])
const postureScore = ref(100)
const sessionDuration = ref(0)
const goodPostureTime = ref(0)
const totalChecks = ref(0)
const goodChecks = ref(0)
const detected = ref(false)
const showSummary = ref(false)

// Summary data (saved before reset)
const summaryScore = ref(0)
const summaryDuration = ref(0)
const summaryGoodTime = ref(0)
const summaryGoodPercent = ref(0)

// Settings
const sensitivity = useLocalStorage('posture-sensitivity', 50)
const soundEnabled = useLocalStorage('posture-sound', true)

// MediaPipe
let pose: { close: () => void; send: (input: { image: HTMLVideoElement }) => Promise<void> } | null = null
let rafId = 0
let sessionTimer = 0
let audioCtx: AudioContext | null = null
let sending = false

// Calibration
const isCalibrated = ref(false)
const wantCalibrate = ref(false)
const calibrationData = ref<{
  noseY: number
  shoulderDiff: number
  shoulderWidth: number
  earDiff: number
} | null>(null)

// --- Load MediaPipe Pose only ---
const { load: loadPose } = useScriptTag(
  'https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/pose.js',
  undefined,
  { manual: true },
)

// --- Audio alert ---
function playAlertSound() {
  if (!soundEnabled.value) return
  try {
    if (!audioCtx) audioCtx = new AudioContext()
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    osc.frequency.setValueAtTime(440, audioCtx.currentTime)
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5)
    osc.start(audioCtx.currentTime)
    osc.stop(audioCtx.currentTime + 0.5)
  } catch {
    // Audio not available
  }
}

// --- Process each frame ---
function onPoseResults(landmarks: Landmark[]) {
  const nose = landmarks[0]
  const leftShoulder = landmarks[11]
  const rightShoulder = landmarks[12]
  const leftEar = landmarks[7]
  const rightEar = landmarks[8]

  if (!nose || !leftShoulder || !rightShoulder || !leftEar || !rightEar) return
  if ((nose.visibility ?? 0) < 0.5 || (leftShoulder.visibility ?? 0) < 0.5) return

  detected.value = true

  // If calibration was requested, capture now
  if (wantCalibrate.value) {
    calibrationData.value = {
      noseY: nose.y,
      shoulderDiff: Math.abs(leftShoulder.y - rightShoulder.y),
      shoulderWidth: Math.abs(leftShoulder.x - rightShoulder.x),
      earDiff: Math.abs(leftEar.y - rightEar.y),
    }
    isCalibrated.value = true
    wantCalibrate.value = false
    errorMessage.value = ''
    return
  }

  // If not calibrated yet, don't analyze
  if (!isCalibrated.value || !calibrationData.value) return

  // --- Analyze posture ---
  totalChecks.value++
  const alerts: PostureAlert[] = []
  const cal = calibrationData.value
  const sensFactor = sensitivity.value / 50

  const shoulderDiff = Math.abs(leftShoulder.y - rightShoulder.y)
  const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x)
  const earDiff = Math.abs(leftEar.y - rightEar.y)

  // 1. Head tilt
  if (earDiff > cal.earDiff + 0.035 / sensFactor) {
    alerts.push({ type: 'head_tilt', message: 'Đầu đang nghiêng! Giữ thẳng.', icon: 'lucide:move-horizontal' })
  }

  // 2. Shoulders uneven
  if (shoulderDiff > cal.shoulderDiff + 0.025 / sensFactor) {
    alerts.push({ type: 'shoulder_uneven', message: 'Vai không đều! Thả lỏng vai.', icon: 'lucide:equal' })
  }

  // 3. Too close
  if (shoulderWidth > cal.shoulderWidth * (1.25 / sensFactor)) {
    alerts.push({ type: 'too_close', message: 'Quá gần màn hình! Lùi lại.', icon: 'lucide:monitor' })
  }

  // 4. Head forward / hunching
  if (nose.y > cal.noseY + 0.05 / sensFactor) {
    alerts.push({ type: 'head_forward', message: 'Đang cúi đầu! Ngẩng lên.', icon: 'lucide:arrow-up' })
  }

  currentAlerts.value = alerts

  if (alerts.length === 0) {
    goodChecks.value++
    postureScore.value = Math.min(100, postureScore.value + 0.3)
  } else {
    postureScore.value = Math.max(0, postureScore.value - alerts.length * 1.5)
    if (postureScore.value < 40) playAlertSound()
  }
}

// --- Draw skeleton ---
function drawSkeleton(landmarks: Landmark[], ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h)

  const hasAlert = currentAlerts.value.length > 0 && isCalibrated.value
  const color = hasAlert ? '#FF6B4A' : '#38BDF8'

  const connections = [
    [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
    [0, 7], [0, 8], [11, 23], [12, 24], [23, 24],
  ]

  ctx.strokeStyle = color
  ctx.lineWidth = 3
  ctx.shadowColor = color
  ctx.shadowBlur = 6

  for (const [a, b] of connections) {
    const lmA = landmarks[a ?? 0]
    const lmB = landmarks[b ?? 0]
    if (!lmA || !lmB) continue
    if ((lmA.visibility ?? 0) < 0.5 || (lmB.visibility ?? 0) < 0.5) continue
    ctx.beginPath()
    ctx.moveTo(lmA.x * w, lmA.y * h)
    ctx.lineTo(lmB.x * w, lmB.y * h)
    ctx.stroke()
  }

  ctx.shadowBlur = 0
  const keyPoints = [0, 7, 8, 11, 12, 13, 14, 15, 16, 23, 24]
  for (const idx of keyPoints) {
    const lm = landmarks[idx]
    if (!lm || (lm.visibility ?? 0) < 0.5) continue
    ctx.beginPath()
    ctx.arc(lm.x * w, lm.y * h, 5, 0, 2 * Math.PI)
    ctx.fillStyle = color
    ctx.fill()
    ctx.strokeStyle = '#0F1923'
    ctx.lineWidth = 2
    ctx.stroke()
  }
}

// --- Start/Stop ---
async function startPostureCheck() {
  errorMessage.value = ''
  isLoading.value = true

  try {
    // 1. Show the running UI first so <video> element renders
    isRunning.value = true
    await nextTick()

    // 2. Get webcam
    const media = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
    })
    stream.value = media

    if (!videoRef.value) throw new Error('Video element not found')
    videoRef.value.srcObject = media
    await videoRef.value.play()

    // 2. Load MediaPipe Pose script
    await loadPose()

    const Pose = (window as unknown as Record<string, unknown>).Pose as new (config: Record<string, unknown>) => {
      setOptions: (opts: Record<string, unknown>) => void
      onResults: (cb: (results: { poseLandmarks?: Landmark[] }) => void) => void
      send: (input: { image: HTMLVideoElement }) => Promise<void>
      close: () => void
    }

    const mpPose = new Pose({
      locateFile: (file: string) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}`,
    })

    mpPose.setOptions({
      modelComplexity: 0,
      smoothLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    })

    mpPose.onResults((results) => {
      if (!results.poseLandmarks || !canvasRef.value) return
      const ctx = canvasRef.value.getContext('2d')
      if (!ctx) return
      const w = canvasRef.value.width
      const h = canvasRef.value.height
      drawSkeleton(results.poseLandmarks, ctx, w, h)
      onPoseResults(results.poseLandmarks)
    })

    pose = mpPose

    // 3. rAF loop — send video frames to Pose manually
    const video = videoRef.value
    async function processFrame() {
      if (!pose || !video || video.paused || video.ended) return
      if (!sending) {
        sending = true
        try {
          await pose.send({ image: video })
        } catch {
          // Frame skipped
        }
        sending = false
      }
      rafId = requestAnimationFrame(processFrame)
    }
    rafId = requestAnimationFrame(processFrame)

    // Session timer
    sessionTimer = window.setInterval(() => {
      sessionDuration.value++
      if (currentAlerts.value.length === 0 && isCalibrated.value) {
        goodPostureTime.value++
      }
    }, 1000)

    isRunning.value = true
    isLoading.value = false
  } catch (err) {
    console.error(err)
    errorMessage.value = 'Không thể khởi tạo camera hoặc AI model. Kiểm tra quyền camera.'
    isLoading.value = false
    isRunning.value = false
  }
}

function requestCalibration() {
  if (!detected.value) {
    errorMessage.value = 'AI chưa nhận diện được bạn. Hãy đảm bảo webcam thấy mặt và vai của bạn.'
    return
  }
  wantCalibrate.value = true
  errorMessage.value = ''
}

function stopPostureCheck() {
  // Save results for summary
  summaryScore.value = Math.round(postureScore.value)
  summaryDuration.value = sessionDuration.value
  summaryGoodTime.value = goodPostureTime.value
  summaryGoodPercent.value = totalChecks.value > 0
    ? Math.round((goodChecks.value / totalChecks.value) * 100)
    : 0

  // Cleanup
  if (rafId) cancelAnimationFrame(rafId)
  if (pose) pose.close()
  if (stream.value) stream.value.getTracks().forEach((t) => t.stop())
  if (sessionTimer) clearInterval(sessionTimer)

  rafId = 0
  pose = null
  stream.value = null
  sending = false
  isRunning.value = false
  isCalibrated.value = false
  detected.value = false
  currentAlerts.value = []
  postureScore.value = 100
  sessionDuration.value = 0
  goodPostureTime.value = 0
  totalChecks.value = 0
  goodChecks.value = 0

  // Show summary
  showSummary.value = true
}

function closeSummary() {
  showSummary.value = false
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const goodPercentage = computed(() => {
  if (totalChecks.value === 0) return 0
  return Math.round((goodChecks.value / totalChecks.value) * 100)
})

const scoreColor = computed(() => {
  if (postureScore.value >= 80) return 'text-emerald-400'
  if (postureScore.value >= 50) return 'text-accent-amber'
  return 'text-red-400'
})

const scoreBarColor = computed(() => {
  if (postureScore.value >= 80) return 'bg-emerald-400'
  if (postureScore.value >= 50) return 'bg-accent-amber'
  return 'bg-red-400'
})

onUnmounted(() => {
  stopPostureCheck()
  if (audioCtx) audioCtx.close()
})
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body">
    <!-- Header -->
    <div class="border-b border-border-default bg-bg-surface">
      <div class="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <RouterLink to="/" class="flex items-center gap-1.5 text-text-secondary text-sm hover:text-accent-coral transition">
          <Icon icon="lucide:arrow-left" class="w-4 h-4" />
          Trang chủ
        </RouterLink>
        <div class="flex items-center gap-2">
          <Icon icon="lucide:scan-eye" class="w-5 h-5 text-accent-coral" />
          <span class="font-display font-bold text-accent-coral">Posture AI</span>
        </div>
        <span class="text-[10px] text-text-dim font-display">
          bởi <a href="https://www.facebook.com/nmdung.dev" target="_blank" rel="noopener noreferrer" class="text-accent-coral hover:underline">nmdung.dev</a>
        </span>
      </div>
    </div>

    <div class="max-w-5xl mx-auto px-4 py-6">
      <!-- SUMMARY -->
      <template v-if="showSummary">
        <div class="max-w-md mx-auto animate-fade-up">
          <div class="border border-border-default bg-bg-surface p-6 md:p-8 text-center mb-6">
            <Icon icon="lucide:scan-eye" class="w-10 h-10 text-accent-coral mx-auto mb-3" />
            <h2 class="font-display text-2xl font-bold text-text-primary mb-1">Phiên kết thúc</h2>
            <p class="text-text-dim text-sm">Tổng kết tư thế của bạn</p>
          </div>

          <div class="border border-border-default bg-bg-surface p-6 mb-4">
            <div class="text-center mb-4">
              <span
                :class="[
                  'font-display text-5xl font-bold',
                  summaryScore >= 80 ? 'text-emerald-400' : summaryScore >= 50 ? 'text-accent-amber' : 'text-red-400',
                ]"
              >
                {{ summaryScore }}
              </span>
              <span class="text-text-dim text-lg">/100</span>
              <p class="text-xs text-text-dim mt-1 font-display">
                {{ summaryScore >= 80 ? 'Tuyệt vời! Tư thế rất tốt.' : summaryScore >= 50 ? 'Khá ổn, cần cải thiện thêm.' : 'Cần chú ý tư thế hơn!' }}
              </p>
            </div>

            <div class="h-3 bg-bg-deep overflow-hidden mb-4">
              <div
                class="h-full"
                :class="summaryScore >= 80 ? 'bg-emerald-400' : summaryScore >= 50 ? 'bg-accent-amber' : 'bg-red-400'"
                :style="{ width: summaryScore + '%' }"
              />
            </div>

            <div class="space-y-3 text-sm">
              <div class="flex justify-between p-2 border border-border-default bg-bg-deep">
                <span class="text-text-secondary flex items-center gap-1.5">
                  <Icon icon="lucide:clock" class="w-3.5 h-3.5" /> Thời gian phiên
                </span>
                <span class="font-display font-semibold">{{ formatTime(summaryDuration) }}</span>
              </div>
              <div class="flex justify-between p-2 border border-border-default bg-bg-deep">
                <span class="text-text-secondary flex items-center gap-1.5">
                  <Icon icon="lucide:check-circle" class="w-3.5 h-3.5" /> Tư thế tốt
                </span>
                <span class="font-display font-semibold text-emerald-400">{{ formatTime(summaryGoodTime) }}</span>
              </div>
              <div class="flex justify-between p-2 border border-border-default bg-bg-deep">
                <span class="text-text-secondary flex items-center gap-1.5">
                  <Icon icon="lucide:percent" class="w-3.5 h-3.5" /> Tỷ lệ tư thế tốt
                </span>
                <span
                  class="font-display font-semibold"
                  :class="summaryGoodPercent >= 70 ? 'text-emerald-400' : 'text-accent-amber'"
                >
                  {{ summaryGoodPercent }}%
                </span>
              </div>
            </div>
          </div>

          <div class="flex gap-3">
            <button
              class="flex-1 px-4 py-3 bg-accent-coral text-bg-deep font-display font-bold text-sm transition hover:bg-accent-coral/90 active:scale-95 flex items-center justify-center gap-2"
              @click="closeSummary"
            >
              <Icon icon="lucide:rotate-ccw" class="w-4 h-4" />
              Phiên mới
            </button>
            <RouterLink
              to="/"
              class="flex-1 px-4 py-3 border border-border-default text-text-secondary font-display font-semibold text-sm transition hover:border-accent-coral hover:text-text-primary flex items-center justify-center gap-2"
            >
              <Icon icon="lucide:home" class="w-4 h-4" />
              Trang chủ
            </RouterLink>
          </div>
        </div>
      </template>

      <!-- NOT RUNNING -->
      <template v-if="!isRunning && !isLoading && !showSummary">
        <div class="text-center mb-8 animate-fade-up">
          <div class="w-20 h-20 mx-auto mb-4 border-2 border-accent-coral/30 flex items-center justify-center">
            <Icon icon="lucide:scan-eye" class="w-10 h-10 text-accent-coral" />
          </div>
          <h1 class="font-display text-3xl md:text-5xl font-bold text-accent-coral mb-3">Posture AI</h1>
          <p class="text-text-secondary text-base max-w-lg mx-auto leading-relaxed">
            AI phát hiện tư thế ngồi sai qua webcam — cảnh báo khi bạn cúi đầu, nghiêng vai, hoặc quá gần màn hình.
          </p>
        </div>

        <div class="grid gap-4 sm:grid-cols-3 mb-8 animate-fade-up animate-delay-1">
          <div class="border border-border-default bg-bg-surface p-5 text-center">
            <span class="text-2xl block mb-2">📷</span>
            <h3 class="font-display text-sm font-semibold mb-1">Bật Camera</h3>
            <p class="text-xs text-text-dim">AI chạy 100% trên trình duyệt. Không gửi dữ liệu đi đâu.</p>
          </div>
          <div class="border border-border-default bg-bg-surface p-5 text-center">
            <span class="text-2xl block mb-2">🧘</span>
            <h3 class="font-display text-sm font-semibold mb-1">Ngồi Ngay Ngắn</h3>
            <p class="text-xs text-text-dim">Đợi AI nhận diện, rồi nhấn "Chuẩn hóa" để ghi nhớ tư thế chuẩn.</p>
          </div>
          <div class="border border-border-default bg-bg-surface p-5 text-center">
            <span class="text-2xl block mb-2">🔔</span>
            <h3 class="font-display text-sm font-semibold mb-1">Nhận Cảnh Báo</h3>
            <p class="text-xs text-text-dim">Skeleton xanh = tốt, đỏ = sai tư thế.</p>
          </div>
        </div>

        <div class="text-center animate-fade-up animate-delay-2">
          <button
            class="px-8 py-4 bg-accent-coral text-bg-deep font-display font-bold text-lg transition hover:bg-accent-coral/90 active:scale-95 inline-flex items-center gap-3"
            @click="startPostureCheck"
          >
            <Icon icon="lucide:play" class="w-5 h-5" />
            Bắt đầu
          </button>
        </div>

        <p v-if="errorMessage" class="text-center text-red-400 text-sm mt-4">{{ errorMessage }}</p>
      </template>

      <!-- LOADING -->
      <template v-if="isLoading">
        <div class="text-center py-20 animate-fade-up">
          <Icon icon="lucide:loader-2" class="w-12 h-12 text-accent-coral mx-auto animate-spin mb-4" />
          <p class="text-text-secondary font-display">Đang tải AI model...</p>
          <p class="text-text-dim text-xs mt-2">Lần đầu mất 10-20 giây</p>
        </div>
      </template>

      <!-- RUNNING -->
      <template v-if="isRunning">
        <div class="grid gap-4 lg:grid-cols-3">
          <!-- Video + Canvas -->
          <div class="lg:col-span-2">
            <div class="relative border border-border-default bg-black overflow-hidden aspect-video">
              <video
                ref="videoRef"
                class="w-full h-full object-cover scale-x-[-1]"
                autoplay
                muted
                playsinline
              />
              <canvas
                ref="canvasRef"
                width="640"
                height="480"
                class="absolute inset-0 w-full h-full scale-x-[-1] pointer-events-none"
              />

              <!-- Detection status (before calibration) -->
              <div v-if="!isCalibrated" class="absolute inset-0 flex items-end p-4">
                <div class="w-full">
                  <!-- Detection indicator -->
                  <div class="flex items-center gap-2 mb-3">
                    <div :class="['w-2.5 h-2.5 rounded-full', detected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400']" />
                    <span class="text-white text-sm font-semibold drop-shadow-lg">
                      {{ detected ? '✅ Đã nhận diện! Giữ tư thế ngay ngắn.' : '⏳ Đang tìm kiếm...' }}
                    </span>
                  </div>
                  <!-- Calibrate button -->
                  <button
                    :disabled="!detected"
                    class="w-full px-6 py-3 bg-accent-amber text-bg-deep font-display font-bold text-sm transition hover:bg-accent-amber/90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    @click="requestCalibration"
                  >
                    <Icon icon="lucide:check" class="w-4 h-4" />
                    Chuẩn hóa tư thế hiện tại
                  </button>
                </div>
              </div>

              <!-- Alert overlays -->
              <div v-if="currentAlerts.length > 0 && isCalibrated" class="absolute top-3 left-3 right-3 space-y-1.5">
                <div
                  v-for="alert in currentAlerts"
                  :key="alert.type"
                  class="flex items-center gap-2 px-3 py-2 bg-red-500/90 text-white text-sm font-semibold"
                >
                  <Icon :icon="alert.icon" class="w-4 h-4 shrink-0" />
                  {{ alert.message }}
                </div>
              </div>

              <!-- Good posture -->
              <div
                v-if="currentAlerts.length === 0 && isCalibrated"
                class="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/90 text-white text-xs font-semibold"
              >
                <Icon icon="lucide:check-circle" class="w-3.5 h-3.5" />
                Tư thế tốt
              </div>
            </div>

            <p v-if="errorMessage" class="text-red-400 text-xs mt-2">{{ errorMessage }}</p>
          </div>

          <!-- Stats panel -->
          <div class="space-y-4">
            <!-- Posture Score -->
            <div class="border border-border-default bg-bg-surface p-4">
              <h3 class="font-display text-xs font-semibold text-text-dim tracking-widest mb-3 flex items-center gap-2">
                <span class="text-accent-coral">//</span> ĐIỂM TƯ THẾ
              </h3>
              <div class="text-center">
                <span :class="['font-display text-5xl font-bold', scoreColor]">{{ Math.round(postureScore) }}</span>
                <span class="text-text-dim text-lg">/100</span>
              </div>
              <div class="h-2 bg-bg-deep mt-3 overflow-hidden">
                <div class="h-full transition-all duration-500" :class="scoreBarColor" :style="{ width: postureScore + '%' }" />
              </div>
            </div>

            <!-- Session stats -->
            <div class="border border-border-default bg-bg-surface p-4">
              <h3 class="font-display text-xs font-semibold text-text-dim tracking-widest mb-3 flex items-center gap-2">
                <span class="text-accent-sky">//</span> PHIÊN LÀM VIỆC
              </h3>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-text-secondary flex items-center gap-1.5">
                    <Icon icon="lucide:clock" class="w-3.5 h-3.5" /> Thời gian
                  </span>
                  <span class="font-display font-semibold">{{ formatTime(sessionDuration) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-text-secondary flex items-center gap-1.5">
                    <Icon icon="lucide:check-circle" class="w-3.5 h-3.5" /> Tư thế tốt
                  </span>
                  <span class="font-display font-semibold text-emerald-400">{{ formatTime(goodPostureTime) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-text-secondary flex items-center gap-1.5">
                    <Icon icon="lucide:percent" class="w-3.5 h-3.5" /> Tỷ lệ tốt
                  </span>
                  <span class="font-display font-semibold" :class="goodPercentage >= 70 ? 'text-emerald-400' : 'text-accent-amber'">
                    {{ goodPercentage }}%
                  </span>
                </div>
              </div>
            </div>

            <!-- Settings -->
            <div class="border border-border-default bg-bg-surface p-4">
              <h3 class="font-display text-xs font-semibold text-text-dim tracking-widest mb-3 flex items-center gap-2">
                <span class="text-accent-amber">//</span> CÀI ĐẶT
              </h3>
              <div class="space-y-3">
                <div>
                  <label class="text-xs text-text-secondary mb-1 block">Độ nhạy: {{ sensitivity }}%</label>
                  <input v-model.number="sensitivity" type="range" min="20" max="100" class="w-full accent-accent-amber" />
                </div>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input v-model="soundEnabled" type="checkbox" class="accent-accent-amber" />
                  <span class="text-xs text-text-secondary">Cảnh báo âm thanh</span>
                </label>
              </div>
            </div>

            <!-- Action buttons -->
            <div class="space-y-2">
              <button
                v-if="isCalibrated"
                class="w-full px-4 py-2 text-sm border border-accent-amber/30 text-accent-amber font-display font-semibold transition hover:bg-accent-amber/10 active:scale-[0.99] flex items-center justify-center gap-2"
                @click="requestCalibration"
              >
                <Icon icon="lucide:refresh-cw" class="w-3.5 h-3.5" />
                Chuẩn hóa lại
              </button>
              <button
                class="w-full px-4 py-2 text-sm border border-accent-coral/30 text-accent-coral font-display font-semibold transition hover:bg-accent-coral/10 active:scale-[0.99] flex items-center justify-center gap-2"
                @click="stopPostureCheck"
              >
                <Icon icon="lucide:square" class="w-3.5 h-3.5" />
                Dừng
              </button>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
