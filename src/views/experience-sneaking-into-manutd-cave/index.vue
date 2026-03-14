<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { nextTick, onUnmounted, ref } from 'vue'

// ─── Asset Imports ───────────────────────────────────────
import slide1 from './assets/1.webp'
import slide2 from './assets/2.jpg'
import slide3 from './assets/3.jpg'
import slide4 from './assets/4.jpg'
import slide5 from './assets/5.jpg'
import slide6 from './assets/6.jpeg'
import slide7 from './assets/7.webp'
import muLogoUrl from './assets/manutd-logo.png'
import memeMuUrl from './assets/meme-mu.png'
import gloryMusicUrl from './assets/glory.mp3'
import gateBgUrl from './assets/background.jpg'

const slideImages = [slide1, slide2, slide3, slide4, slide5, slide6, slide7]

// ─── Flow State ──────────────────────────────────────────
type Phase =
  | 'gate'
  | 'shaking'
  | 'blackout'
  | 'cave_form'
  | 'id_ready'
  | 'descending'
  | 'in_cave'

const phase = ref<Phase>('gate')
const fanType = ref<'mu' | 'visitor' | null>(null)
const showToast = ref(false)
const toastMessage = ref('')

// ─── Cave Form State ─────────────────────────────────────
const excuses = [
  'Tại cỏ dài',
  'Trọng tài ép',
  'Đang tái thiết',
  'Bảo toàn lực lượng',
  'Trọng lực sân khách quá lớn',
  'Đối thủ dùng bùa',
  'VAR đã chết',
  'Thời tiết xấu',
]
const selectedExcuse = ref(excuses[0] ?? '')
const customExcuse = ref('')
const isCustomExcuse = ref(false)
const userName = ref('')

// ─── Canvas ID Card ──────────────────────────────────────
const canvasRef = ref<HTMLCanvasElement | null>(null)
const cardImageUrl = ref('')
const isCardGenerated = ref(false)

// ─── Descent State ───────────────────────────────────────
const depth = ref(0)
const currentSlideIndex = ref(0)
const slideOffset = ref(0)
let descentInterval: ReturnType<typeof setInterval> | null = null
let slideInterval: ReturnType<typeof setInterval> | null = null
let bgMusic: HTMLAudioElement | null = null

// ─── In-Cave State ───────────────────────────────────────
const isAntonySpinning = ref(false)
const caveLit = ref(false)
const showLeagueTable = ref(false)
let antonyTimeout: ReturnType<typeof setTimeout> | null = null

// ─── Entry Gate Actions ──────────────────────────────────
function enterAsFan() {
  fanType.value = 'mu'
  phase.value = 'shaking'
  setTimeout(() => {
    phase.value = 'blackout'
    setTimeout(() => {
      phase.value = 'cave_form'
    }, 1500)
  }, 1200)
}

function enterAsVisitor() {
  fanType.value = 'visitor'
  toastMessage.value =
    'Chào mừng đến với Khu Bảo Tồn Hang Động lớn nhất nước Anh! 🏴󠁧󠁢󠁥󠁮󠁧󠁿'
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
    phase.value = 'cave_form'
  }, 2500)
}

// ─── Excuse handling ─────────────────────────────────────
function handleExcuseChange(e: Event) {
  const value = (e.target as HTMLSelectElement).value
  if (value === '__custom__') {
    isCustomExcuse.value = true
    selectedExcuse.value = ''
  } else {
    isCustomExcuse.value = false
    selectedExcuse.value = value
  }
}

// ─── Load MU logo as Image ───────────────────────────────
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

// ─── Canvas Card Generator ───────────────────────────────
async function generateCard() {
  await nextTick()
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const w = 600
  const h = 380
  canvas.width = w
  canvas.height = h

  // Background gradient: use warm navy tones (Design System)
  const grad = ctx.createLinearGradient(0, 0, w, h)
  grad.addColorStop(0, '#0F1923') // bg-bg-deep
  grad.addColorStop(0.5, '#162232') // bg-bg-surface
  grad.addColorStop(1, '#1E2F42') // bg-bg-elevated
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)

  // Border: use Coral and Amber accents
  ctx.strokeStyle = '#FF6B4A' // accent-coral
  ctx.lineWidth = 3
  ctx.strokeRect(8, 8, w - 16, h - 16)
  ctx.strokeStyle = '#FFB8304D' // accent-amber with opacity
  ctx.lineWidth = 1
  ctx.strokeRect(16, 16, w - 32, h - 32)

  // MU Logo watermark (top-right)
  try {
    const logo = await loadImage(muLogoUrl)
    const logoSize = 80
    ctx.globalAlpha = 0.12
    ctx.drawImage(logo, w - logoSize - 30, 24, logoSize, logoSize)
    ctx.globalAlpha = 1
  } catch {
    // Fallback: devil emoji watermark
    ctx.font = '120px serif'
    ctx.globalAlpha = 0.06
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.fillText('😈', w / 2, h / 2 + 40)
    ctx.globalAlpha = 1
  }

  // Title
  ctx.font = 'bold 26px "Anybody", sans-serif'
  ctx.fillStyle = '#FFB830'
  ctx.textAlign = 'center'
  ctx.fillText('🏚️ THẺ CĂN CƯỚC CHUI HANG 🏚️', w / 2, 60)

  // Subtitle
  ctx.font = '13px "Be Vietnam Pro", sans-serif'
  ctx.fillStyle = 'rgba(240, 237, 230, 0.5)'
  ctx.fillText('HỆ SINH THÁI CHUI HANG M.U — PHÁT HÀNH GIỚI HẠN', w / 2, 84)

  // Divider
  ctx.strokeStyle = 'rgba(255, 184, 48, 0.3)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(40, 98)
  ctx.lineTo(w - 40, 98)
  ctx.stroke()

  // Content
  ctx.textAlign = 'left'
  const startX = 50
  let y = 135

  ctx.font = '14px "Be Vietnam Pro", sans-serif'
  ctx.fillStyle = 'rgba(240, 237, 230, 0.6)'
  ctx.fillText('Họ và tên:', startX, y)
  ctx.font = 'bold 20px "Anybody", sans-serif'
  ctx.fillStyle = '#f0ede6'
  ctx.fillText(userName.value.trim() || 'Fan Ẩn Danh', startX, y + 28)
  y += 65

  ctx.font = '14px "Be Vietnam Pro", sans-serif'
  ctx.fillStyle = 'rgba(240, 237, 230, 0.6)'
  ctx.fillText('Tư cách:', startX, y)
  ctx.font = 'bold 16px "Anybody", sans-serif'
  ctx.fillStyle = fanType.value === 'mu' ? '#FF6B4A' : '#38BDF8'
  ctx.fillText(
    fanType.value === 'mu'
      ? '🔴 Fan MU tị nạn'
      : '🔵 Fan đội khác tham quan',
    startX,
    y + 24,
  )
  y += 58

  ctx.font = '14px "Be Vietnam Pro", sans-serif'
  ctx.fillStyle = 'rgba(240, 237, 230, 0.6)'
  ctx.fillText('Lý do chui hang:', startX, y)
  ctx.font = 'bold 16px "Anybody", sans-serif'
  ctx.fillStyle = '#FFB830'
  const excuse = isCustomExcuse.value
    ? customExcuse.value || 'Không dám nói'
    : selectedExcuse.value
  ctx.fillText(`"${excuse}"`, startX, y + 24)

  // Footer
  ctx.strokeStyle = 'rgba(255, 184, 48, 0.3)'
  ctx.beginPath()
  ctx.moveTo(40, h - 60)
  ctx.lineTo(w - 40, h - 60)
  ctx.stroke()
  ctx.font = '12px "Be Vietnam Pro", sans-serif'
  ctx.fillStyle = 'rgba(240, 237, 230, 0.4)'
  ctx.textAlign = 'center'
  ctx.fillText(
    '⏳ Thời hạn: Đến trận thắng tiếp theo  •  📍 Đáy BXH Ngoại Hạng',
    w / 2,
    h - 35,
  )
  ctx.font = 'bold 11px "Anybody", sans-serif'
  ctx.fillStyle = '#FF6B4AB3' // accent-coral with opacity
  ctx.textAlign = 'right'
  ctx.fillText('ĐÃ DUYỆT ✓', w - 40, h - 15)

  cardImageUrl.value = canvas.toDataURL('image/png')
  isCardGenerated.value = true
  phase.value = 'id_ready'
}

function downloadCard() {
  if (!cardImageUrl.value) return
  const link = document.createElement('a')
  link.download = `the-chui-hang-mu-${Date.now()}.png`
  link.href = cardImageUrl.value
  link.click()
}

// ─── Descent Phase ───────────────────────────────────────
const descentText = ref('Đang tụt xuống tầng hầm...')

function startDescent() {
  phase.value = 'descending'
  depth.value = 0
  currentSlideIndex.value = 0
  slideOffset.value = 0

  // Background music
  if (!bgMusic) {
    bgMusic = new Audio(gloryMusicUrl)
    bgMusic.loop = true
    bgMusic.volume = 0.5
  }
  bgMusic.play().catch((err) => console.warn('Autoplay blocked:', err))

  // Depth counter
  descentInterval = setInterval(() => {
    depth.value += 2
    if (depth.value <= 50) {
      descentText.value = 'Đang tụt xuống tầng hầm... 🏚️'
    } else if (depth.value <= 150) {
      descentText.value = 'Đang đi xuyên qua lớp vỏ trái đất... 🌍'
    } else {
      descentText.value = 'Đã xuyên thủng đáy xã hội... 💀'
    }
    if (depth.value >= 200) {
      depth.value = 200
      if (descentInterval) clearInterval(descentInterval)
      descentInterval = null
    }
  }, 150)

  // Image slideshow — accelerates from slow to fast
  let slideSpeed = 2000 // Start slow (ms per slide)
  function advanceSlide() {
    currentSlideIndex.value =
      (currentSlideIndex.value + 1) % slideImages.length
    // Accelerate each iteration
    slideSpeed = Math.max(200, slideSpeed - 150)
    slideInterval = setTimeout(advanceSlide, slideSpeed)
  }
  slideInterval = setTimeout(advanceSlide, slideSpeed)

  setTimeout(() => {
    if (descentInterval) {
      clearInterval(descentInterval)
      descentInterval = null
    }
    if (slideInterval) {
      clearTimeout(slideInterval)
      slideInterval = null
    }
    depth.value = 200
    phase.value = 'in_cave'
  }, 15000)
}

// ─── In-Cave Actions ─────────────────────────────────────
function activateAntony() {
  isAntonySpinning.value = true
  caveLit.value = true
  if (antonyTimeout) clearTimeout(antonyTimeout)
  antonyTimeout = setTimeout(() => {
    isAntonySpinning.value = false
    caveLit.value = false
    antonyTimeout = null
  }, 5000)
}

// ─── League Table Data ───────────────────────────────────
const leagueTable = [
  { pos: 10, team: 'Fulham', pts: 44 },
  { pos: 11, team: 'Bournemouth', pts: 43 },
  { pos: 12, team: 'Man United', pts: 39, highlight: true },
  { pos: 13, team: 'Crystal Palace', pts: 37 },
  { pos: 14, team: 'Wolves', pts: 35 },
]

// ─── Cleanup ─────────────────────────────────────────────
onUnmounted(() => {
  if (descentInterval) clearInterval(descentInterval)
  if (slideInterval) clearTimeout(slideInterval)
  if (antonyTimeout) clearTimeout(antonyTimeout)
  if (bgMusic) {
    bgMusic.pause()
    bgMusic = null
  }
})
</script>

<template>
  <div
    class="mu-page"
    :class="{
      'is-shaking': phase === 'shaking',
      'is-blackout': phase === 'blackout' || phase === 'descending',
      'cave-dark': phase === 'in_cave' && !caveLit,
      'cave-dim': phase === 'in_cave' && caveLit,
    }"
  >
    <!-- ═══ PHASE: GATE ═══ -->
    <Transition name="fade">
      <div
        v-if="phase === 'gate'"
        class="gate-screen"
        :style="{ backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${gateBgUrl})` }"
      >
        <div class="gate-content animate-fade-up">
          <div class="gate-emoji">⚽</div>
          <h1 class="gate-title">M.U Cave Portal 2.0</h1>
          <p class="gate-subtitle">
            Hệ Sinh Thái Chui Hang Man United
          </p>
          <div class="gate-divider" />
          <p class="gate-question">
            Hôm nay bạn đến đây với tư cách gì?
          </p>
          <div class="gate-buttons">
            <button
              class="gate-btn gate-btn-red animate-fade-up animate-delay-2"
              @click="enterAsFan"
            >
              <span class="gate-btn-icon">🔴</span>
              <span class="gate-btn-text">Fan MU tị nạn</span>
              <span class="gate-btn-hint">Đau khổ nhưng trung thành</span>
            </button>
            <button
              class="gate-btn gate-btn-blue animate-fade-up animate-delay-3"
              @click="enterAsVisitor"
            >
              <span class="gate-btn-icon">🔵</span>
              <span class="gate-btn-text">Fan đội khác đi tham quan</span>
              <span class="gate-btn-hint">Cười nhạo nhưng tò mò</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ═══ TOAST ═══ -->
    <Transition name="slide-up">
      <div
        v-if="showToast"
        class="toast"
      >
        {{ toastMessage }}
      </div>
    </Transition>

    <!-- ═══ PHASE: CAVE FORM ═══ -->
    <Transition name="fade">
      <div
        v-if="phase === 'cave_form'"
        class="cave-screen"
      >
        <div class="cave-header animate-fade-up">
          <RouterLink
            to="/"
            class="back-link"
          >
            <Icon
              icon="lucide:arrow-left"
              class="size-4"
            />
            Trang chủ
          </RouterLink>
        </div>
        <div class="cave-body">
          <div class="cave-title-wrap animate-fade-up animate-delay-1">
            <h1 class="cave-title">
              <span class="text-accent-coral font-display text-sm tracking-widest mr-2">//</span>
              🔥 Trạm Dừng Chân Dưới Đáy Xã Hội
            </h1>
            <p class="cave-subtitle">
              {{
                fanType === 'mu'
                  ? 'Chào mừng đồng chí trở về hang ấm 🫡'
                  : 'Khách tham quan vui lòng KHÔNG cười quá to 🤫'
              }}
            </p>
          </div>
          <div class="form-card animate-fade-up animate-delay-2">
            <div class="form-group">
              <label class="form-label">
                <Icon
                  icon="lucide:user"
                  class="size-4"
                />
                Họ tên cư dân hang
              </label>
              <input
                v-model="userName"
                type="text"
                class="form-input"
                placeholder="VD: Nguyễn Văn Xuống Hạng"
              />
            </div>
            <div class="form-group">
              <label class="form-label">
                <Icon
                  icon="lucide:message-circle"
                  class="size-4"
                />
                Nguyên nhân chui hang hôm nay?
              </label>
              <select
                class="form-select"
                @change="handleExcuseChange"
              >
                <option
                  v-for="excuse in excuses"
                  :key="excuse"
                  :value="excuse"
                >
                  {{ excuse }}
                </option>
                <option value="__custom__">
                  ✏️ Tự viết lý do...
                </option>
              </select>
              <input
                v-if="isCustomExcuse"
                v-model="customExcuse"
                type="text"
                class="form-input"
                style="margin-top: 0.75rem"
                placeholder="Nhập lý do riêng của bạn..."
              />
            </div>
            <button
              class="generate-btn"
              @click="generateCard"
            >
              <Icon
                icon="lucide:id-card"
                class="size-5"
              />
              Cấp Thẻ Tạm Trú
            </button>
          </div>
          <canvas
            ref="canvasRef"
            class="hidden-canvas"
          />
        </div>
      </div>
    </Transition>

    <!-- ═══ PHASE: ID READY ═══ -->
    <Transition name="fade">
      <div
        v-if="phase === 'id_ready'"
        class="cave-screen"
      >
        <div class="cave-header animate-fade-up">
          <RouterLink
            to="/"
            class="back-link"
          >
            <Icon
              icon="lucide:arrow-left"
              class="size-4"
            />
            Trang chủ
          </RouterLink>
        </div>
        <div class="cave-body">
          <div class="card-result animate-fade-up">
            <h3 class="result-title">
              🎉 Thẻ của bạn đã sẵn sàng!
            </h3>
            <div class="card-preview">
              <img
                :src="cardImageUrl"
                alt="Thẻ chui hang MU"
                class="card-image"
              />
            </div>
            <div class="card-actions">
              <button
                class="download-btn"
                @click="downloadCard"
              >
                <Icon
                  icon="lucide:download"
                  class="size-5"
                />
                Tải Thẻ Về (PNG)
              </button>
            </div>
          </div>

          <!-- Enter Cave Button -->
          <button
            class="enter-cave-btn animate-fade-up animate-delay-2"
            @click="startDescent"
          >
            <Icon
              icon="lucide:scan-line"
              class="size-6"
            />
            <span>QUẸT THẺ NHẬP HANG</span>
          </button>
        </div>
      </div>
    </Transition>

    <!-- ═══ PHASE: DESCENDING ═══ -->
    <Transition name="fade">
      <div
        v-if="phase === 'descending'"
        class="descent-screen"
      >
        <!-- Sliding images background -->
        <div class="slide-container">
          <img
            v-for="(img, i) in slideImages"
            :key="i"
            :src="img"
            :class="{ 'slide-active': i === currentSlideIndex }"
            class="slide-image"
            alt=""
          />
        </div>

        <!-- Overlay gradient -->
        <div class="descent-overlay" />

        <div class="descent-content">
          <div class="depth-counter">
            <span class="depth-label">ĐỘ SÂU</span>
            <span class="depth-value">-{{ depth }}m</span>
          </div>
          <p class="descent-text">
            {{ descentText }}
          </p>
          <div class="descent-dots">
            <span
              v-for="n in 5"
              :key="n"
              class="descent-dot"
              :style="{ animationDelay: `${n * 0.2}s` }"
            />
          </div>
        </div>
      </div>
    </Transition>

    <!-- ═══ PHASE: IN CAVE ═══ -->
    <Transition name="fade">
      <div
        v-if="phase === 'in_cave'"
        class="in-cave-screen"
      >
        <!-- Meme background -->
        <div
          class="meme-bg"
          :style="{ backgroundImage: `url(${memeMuUrl})` }"
        />
        <div class="cave-header animate-fade-up">
          <RouterLink
            to="/"
            class="back-link"
          >
            <Icon
              icon="lucide:arrow-left"
              class="size-4"
            />
            Thoát hang
          </RouterLink>
        </div>

        <div class="in-cave-body">
          <h1 class="in-cave-title animate-fade-up">
            <span class="text-accent-coral font-display text-sm tracking-widest mr-2">//</span>
            🏚️ Hệ Sinh Thái Sinh Tồn Trong Hang
          </h1>
          <p class="in-cave-subtitle animate-fade-up animate-delay-1">
            Chào mừng {{ userName || 'Fan Ẩn Danh' }} đến vùng đất không ánh
            sáng
          </p>

          <!-- Survival Tools Grid -->
          <div class="tools-grid">
            <!-- Tool 1: Fireplace -->
            <div class="tool-card animate-fade-up animate-delay-2">
              <div class="tool-header">
                <span class="fire-emoji">🔥</span>
                <h3 class="tool-name">Lò Sưởi Dĩ Vãng</h3>
              </div>
              <p class="tool-desc">
                Đang sưởi ấm bằng Cúp C1 1999 &amp; 2008
              </p>
              <div class="fireplace-glow" />
            </div>

            <!-- Tool 2: Antony Generator -->
            <div class="tool-card animate-fade-up animate-delay-3">
              <div class="tool-header">
                <span
                  class="antony-icon"
                  :class="{ spinning: isAntonySpinning }"
                >⚡</span>
                <h3 class="tool-name">Máy Phát Điện Antony</h3>
              </div>
              <p class="tool-desc">
                {{
                  isAntonySpinning
                    ? 'Đang xoay tạo điện... 💡'
                    : 'Compa sẵn sàng kích hoạt'
                }}
              </p>
              <button
                class="tool-btn"
                :disabled="isAntonySpinning"
                @click="activateAntony"
              >
                <Icon
                  icon="lucide:zap"
                  class="size-4"
                />
                {{
                  isAntonySpinning
                    ? 'Đang xoay...'
                    : 'Kích hoạt xoay Compa tạo điện'
                }}
              </button>
            </div>

            <!-- Tool 3: Weak Wifi -->
            <div class="tool-card animate-fade-up animate-delay-4">
              <div class="tool-header">
                <span class="wifi-icon">
                  <Icon
                    icon="lucide:wifi"
                    class="size-6 wifi-weak"
                  />
                </span>
                <h3 class="tool-name">Wifi Yếu (1 vạch)</h3>
              </div>
              <p class="tool-desc">
                Tín hiệu cực kỳ yếu, chỉ đủ xem BXH
              </p>
              <button
                class="tool-btn"
                @click="showLeagueTable = true"
              >
                <Icon
                  icon="lucide:table"
                  class="size-4"
                />
                Lén xem Bảng Xếp Hạng
              </button>
            </div>
          </div>

          <!-- Footer -->
          <p class="cave-footer animate-fade-up animate-delay-5">
            ⏳ Thời gian dự kiến xuất quan: <strong>Chưa xác định</strong>
          </p>
        </div>

        <!-- League Table Modal -->
        <Transition name="fade">
          <div
            v-if="showLeagueTable"
            class="modal-overlay"
            @click.self="showLeagueTable = false"
          >
            <div class="modal-card">
              <h3 class="modal-title">
                📊 Bảng Xếp Hạng Ngoại Hạng Anh
              </h3>
              <p class="modal-warning">
                ⚠️ Cảnh báo: Nội dung có thể gây tổn thương tâm lý
              </p>
              <table class="league-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Đội</th>
                    <th>Điểm</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="row in leagueTable"
                    :key="row.pos"
                    :class="{ highlighted: row.highlight }"
                  >
                    <td>{{ row.pos }}</td>
                    <td>{{ row.team }}</td>
                    <td>{{ row.pts }}</td>
                  </tr>
                </tbody>
              </table>
              <button
                class="close-modal-btn"
                @click="showLeagueTable = false"
              >
                Tắt ngay kẻo trầm cảm 😭
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* ─── Page ─────────────────────────────────────────────── */
.mu-page {
  min-height: 100vh;
  background: var(--color-bg-deep);
  color: var(--color-text-primary);
  font-family: var(--font-body);
  transition: background-color 1s ease;
}

.is-blackout {
  background: #000 !important;
}
.cave-dark {
  background: #050505 !important;
}
.cave-dim {
  background: var(--color-bg-deep) !important;
}

/* ─── Shake ────────────────────────────────────────────── */
.is-shaking {
  animation: page-shake 0.8s ease-in-out;
}

@keyframes page-shake {
  0%,
  100% {
    transform: translate(0);
  }
  10% {
    transform: translate(-8px, 4px);
  }
  20% {
    transform: translate(8px, -4px);
  }
  30% {
    transform: translate(-6px, -6px);
  }
  40% {
    transform: translate(6px, 6px);
  }
  50% {
    transform: translate(-4px, 2px);
  }
  60% {
    transform: translate(4px, -2px);
  }
  70% {
    transform: translate(-2px, 4px);
  }
  80% {
    transform: translate(2px, -4px);
  }
  90% {
    transform: translate(-1px, 1px);
  }
}

/* ─── Gate Screen ──────────────────────────────────────── */
.gate-screen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
}

.gate-content {
  text-align: center;
  max-width: 500px;
  width: 100%;
}

.gate-emoji {
  font-size: 4rem;
  margin-bottom: 1rem;
  animation: bounce-slow 2s ease-in-out infinite;
}

@keyframes bounce-slow {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-12px);
  }
}

.gate-title {
  font-family: var(--font-display);
  font-size: 2.2rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
}

.gate-subtitle {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  margin-bottom: 1.5rem;
}

.gate-divider {
  width: 60px;
  height: 3px;
  background: var(--color-accent-coral);
  margin: 0 auto 1.5rem;
}

.gate-question {
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 2rem;
}

.gate-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.gate-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 1.25rem 1.5rem;
  border: 1px solid var(--color-border-default);
  background: var(--color-bg-surface);
  cursor: pointer;
  transition: all 0.3s ease;
}
.gate-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.3);
}
.gate-btn:active {
  transform: translateY(0) scale(0.98);
}
.gate-btn-icon {
  font-size: 2rem;
}
.gate-btn-text {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 700;
}
.gate-btn-hint {
  font-size: 0.75rem;
  color: var(--color-text-dim);
}
.gate-btn-red:hover {
  border-color: var(--color-accent-coral);
  background: rgba(255, 107, 74, 0.08);
  box-shadow: 0 6px 24px rgba(255, 107, 74, 0.15);
}
.gate-btn-blue:hover {
  border-color: var(--color-accent-sky);
  background: rgba(56, 189, 248, 0.08);
  box-shadow: 0 6px 24px rgba(56, 189, 248, 0.15);
}

/* ─── Toast ────────────────────────────────────────────── */
.toast {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-accent-sky);
  color: #0f1923;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.85rem;
  padding: 0.85rem 1.5rem;
  z-index: 100;
  white-space: nowrap;
  box-shadow: 0 4px 20px rgba(56, 189, 248, 0.3);
}

/* ─── Cave Screen (shared) ─────────────────────────────── */
.cave-screen {
  min-height: 100vh;
  padding: 1.5rem 1rem 3rem;
}

.cave-header {
  max-width: 600px;
  margin: 0 auto 1rem;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text-dim);
  font-family: var(--font-display);
  font-size: 0.8rem;
  letter-spacing: 0.05em;
  text-decoration: none;
  transition: color 0.2s;
}
.back-link:hover {
  color: var(--color-text-primary);
}

.cave-body {
  max-width: 600px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.cave-title-wrap {
  text-align: center;
}

.cave-title {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
}

.cave-subtitle {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
}

/* ─── Form ─────────────────────────────────────────────── */
.form-card {
  border: 1px solid var(--color-border-default);
  background: var(--color-bg-surface);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-family: var(--font-display);
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  letter-spacing: 0.03em;
}

.form-input {
  width: 100%;
  padding: 0.7rem 0.85rem;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-default);
  color: var(--color-text-primary);
  font-family: var(--font-body);
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s;
}
.form-input:focus {
  border-color: var(--color-accent-coral);
}
.form-input::placeholder {
  color: var(--color-text-dim);
}

.form-select {
  width: 100%;
  padding: 0.7rem 0.85rem;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-default);
  color: var(--color-text-primary);
  font-family: var(--font-body);
  font-size: 0.9rem;
  outline: none;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238B9DB5' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  padding-right: 2.5rem;
}
.form-select:focus {
  border-color: var(--color-accent-coral);
}

.generate-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.85rem 1.5rem;
  background: var(--color-accent-coral);
  color: #fff;
  font-family: var(--font-display);
  font-size: 0.9rem;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: all 0.25s ease;
}
.generate-btn:hover {
  background: #e55a3d;
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(255, 107, 74, 0.3);
}

.hidden-canvas {
  position: absolute;
  left: -9999px;
  top: -9999px;
  pointer-events: none;
}

/* ─── Card Result ──────────────────────────────────────── */
.card-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.result-title {
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-accent-amber);
}

.card-preview {
  border: 1px solid var(--color-border-default);
  background: var(--color-bg-surface);
  padding: 0.5rem;
  max-width: 100%;
  overflow: hidden;
}

.card-image {
  width: 100%;
  height: auto;
  display: block;
}

.card-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: center;
}

.download-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.7rem 1.25rem;
  background: var(--color-accent-amber);
  color: #0f1923;
  font-family: var(--font-display);
  font-size: 0.8rem;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: all 0.25s ease;
}
.download-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(255, 184, 48, 0.3);
}

/* ─── Enter Cave Button ────────────────────────────────── */
.enter-cave-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1.25rem 2rem;
  background: #e94560;
  color: #fff;
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  animation: pulse-glow 2s ease-in-out infinite;
}
.enter-cave-btn:hover {
  background: #d63851;
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 8px 30px rgba(233, 69, 96, 0.4);
}

@keyframes pulse-glow {
  0%,
  100% {
    box-shadow: 0 0 15px rgba(255, 107, 74, 0.3);
  }
  50% {
    box-shadow: 0 0 30px rgba(255, 107, 74, 0.6);
  }
}

/* ─── Descent Screen ───────────────────────────────────── */
.descent-screen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
  animation: descent-shake 0.15s ease-in-out infinite;
  position: relative;
  overflow: hidden;
}

/* Slide container behind depth counter */
.slide-container {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.slide-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.4s ease;
}

.slide-image.slide-active {
  opacity: 1;
}

/* Dark overlay so text remains readable */
.descent-overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.7) 0%,
    rgba(0, 0, 0, 0.5) 50%,
    rgba(0, 0, 0, 0.8) 100%
  );
}

@keyframes descent-shake {
  0%,
  100% {
    transform: translate(0);
  }
  25% {
    transform: translate(-2px, 1px);
  }
  50% {
    transform: translate(2px, -1px);
  }
  75% {
    transform: translate(-1px, -1px);
  }
}

.descent-content {
  position: relative;
  z-index: 2;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.depth-counter {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.depth-label {
  font-family: var(--font-display);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  color: rgba(255, 107, 74, 0.6);
  margin-bottom: 0.25rem;
}

.depth-value {
  font-family: var(--font-display);
  font-size: 5rem;
  font-weight: 800;
  color: var(--color-accent-coral);
  text-shadow: 0 0 40px rgba(255, 107, 74, 0.5);
  line-height: 1;
}

.descent-text {
  font-family: var(--font-body);
  font-size: 1rem;
  color: rgba(240, 237, 230, 0.5);
}

.descent-dots {
  display: flex;
  gap: 0.5rem;
}

.descent-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-accent-coral);
  animation: dot-pulse 1s ease-in-out infinite alternate;
}

@keyframes dot-pulse {
  0% {
    opacity: 0.2;
    transform: scale(0.8);
  }
  100% {
    opacity: 1;
    transform: scale(1.2);
  }
}

/* ─── In-Cave Screen ───────────────────────────────────── */
.in-cave-screen {
  min-height: 100vh;
  padding: 1.5rem 1rem 3rem;
  position: relative;
  overflow: hidden;
}

.meme-bg {
  position: fixed;
  inset: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  opacity: 0.06;
  z-index: 0;
  pointer-events: none;
}

.in-cave-body {
  max-width: 600px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  position: relative;
  z-index: 1;
}

.in-cave-title {
  font-family: var(--font-display);
  font-size: 1.4rem;
  font-weight: 800;
  color: rgba(240, 237, 230, 0.8);
  text-align: center;
}

.in-cave-subtitle {
  font-family: var(--font-body);
  font-size: 0.85rem;
  color: rgba(240, 237, 230, 0.3);
  text-align: center;
}

/* ─── Tools Grid ───────────────────────────────────────── */
.tools-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.tool-card {
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.03);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}
.tool-card:hover {
  border-color: rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.05);
}

.tool-header {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.tool-name {
  font-family: var(--font-display);
  font-size: 0.95rem;
  font-weight: 700;
  color: rgba(240, 237, 230, 0.7);
}

.tool-desc {
  font-size: 0.8rem;
  color: rgba(240, 237, 230, 0.35);
}

.tool-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.6rem 1rem;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(240, 237, 230, 0.6);
  font-family: var(--font-display);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  align-self: flex-start;
}
.tool-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  color: #f0ede6;
  border-color: var(--color-accent-coral);
}
.tool-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Fireplace */
.fire-emoji {
  font-size: 1.8rem;
  animation: fire-flicker 0.5s ease-in-out infinite alternate;
}

@keyframes fire-flicker {
  0% {
    transform: scale(1) rotate(-2deg);
    opacity: 0.8;
  }
  100% {
    transform: scale(1.1) rotate(2deg);
    opacity: 1;
  }
}

.fireplace-glow {
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  width: 200px;
  height: 60px;
  background: radial-gradient(
    ellipse,
    rgba(255, 107, 74, 0.15),
    transparent 70%
  );
  pointer-events: none;
}

/* Antony */
.antony-icon {
  font-size: 1.8rem;
  display: inline-block;
  transition: transform 0.3s;
}
.antony-icon.spinning {
  animation: compass-spin 0.5s linear infinite;
}

@keyframes compass-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Wifi */
.wifi-weak {
  opacity: 0.3;
  animation: wifi-blink 2s ease-in-out infinite;
}

@keyframes wifi-blink {
  0%,
  100% {
    opacity: 0.15;
  }
  50% {
    opacity: 0.4;
  }
}

/* ─── Footer ───────────────────────────────────────────── */
.cave-footer {
  text-align: center;
  font-size: 0.8rem;
  color: rgba(240, 237, 230, 0.2);
  font-family: var(--font-body);
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.04);
}

/* ─── Modal ────────────────────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 1rem;
}

.modal-card {
  background: #111827;
  border: 1px solid rgba(233, 69, 96, 0.3);
  padding: 1.5rem;
  max-width: 400px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.modal-title {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 700;
  color: #f0ede6;
  text-align: center;
}

.modal-warning {
  font-size: 0.75rem;
  color: rgba(233, 69, 96, 0.7);
  text-align: center;
}

.league-table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font-body);
  font-size: 0.85rem;
}

.league-table th {
  padding: 0.5rem;
  text-align: left;
  color: rgba(240, 237, 230, 0.4);
  font-weight: 600;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  font-family: var(--font-display);
  font-size: 0.75rem;
  letter-spacing: 0.05em;
}

.league-table td {
  padding: 0.5rem;
  color: rgba(240, 237, 230, 0.6);
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.league-table .highlighted td {
  color: #e94560;
  font-weight: 700;
  background: rgba(233, 69, 96, 0.08);
}

.close-modal-btn {
  padding: 0.75rem 1.25rem;
  background: #e94560;
  color: #fff;
  font-family: var(--font-display);
  font-size: 0.85rem;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}
.close-modal-btn:hover {
  background: #d63851;
  box-shadow: 0 4px 16px rgba(233, 69, 96, 0.3);
}

/* ─── Transitions ──────────────────────────────────────── */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active {
  transition: all 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55);
}
.slide-up-leave-active {
  transition: all 0.3s ease;
}
.slide-up-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(30px);
}
.slide-up-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(30px);
}

/* ─── Responsive ───────────────────────────────────────── */
@media (max-width: 480px) {
  .gate-title {
    font-size: 1.6rem;
  }
  .cave-title,
  .in-cave-title {
    font-size: 1.2rem;
  }
  .form-card {
    padding: 1rem;
  }
  .depth-value {
    font-size: 3.5rem;
  }
  .toast {
    left: 1rem;
    right: 1rem;
    transform: none;
    white-space: normal;
    text-align: center;
    font-size: 0.8rem;
  }
  .slide-up-enter-from {
    transform: translateY(30px);
  }
  .slide-up-leave-to {
    transform: translateY(30px);
  }
}
</style>
