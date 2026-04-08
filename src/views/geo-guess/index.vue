<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import * as THREE from 'three'

interface LocationPoint {
  name: string
  province: string
  lng: number
  lat: number
}

interface PanoramaFeature {
  id: string
  assets?: {
    sd?: { href: string }
    thumb?: { href: string }
  }
  properties?: {
    'view:azimuth'?: number
  }
}

interface SearchResponse {
  features?: PanoramaFeature[]
}

interface RoundQuestion {
  id: string
  correct: LocationPoint
  options: LocationPoint[]
  imageUrl: string
  thumbUrl: string
  azimuth: number
}

interface RoundResult {
  round: number
  correct: boolean
  selected: LocationPoint
  answer: LocationPoint
}

type GameState = 'ready' | 'loading' | 'playing' | 'answered' | 'finished' | 'error'

const API_BASE = 'https://api-view.ndamaps.vn/v1/search'
const TARGET_ROUNDS = 5
const MAX_FETCH_RETRIES = 3
const REQUEST_TIMEOUT = 10000

const locationPool: LocationPoint[] = [
  { name: 'Hồ Hoàn Kiếm', province: 'Hà Nội', lng: 105.853609546, lat: 21.027620821 },
  { name: 'Nhà thờ Lớn Hà Nội', province: 'Hà Nội', lng: 105.849486555, lat: 21.029074684 },
  { name: 'Văn Miếu Quốc Tử Giám', province: 'Hà Nội', lng: 105.835505718, lat: 21.027271603 },
  { name: 'Lăng Chủ tịch Hồ Chí Minh', province: 'Hà Nội', lng: 105.836478997, lat: 21.036262987 },
  { name: 'Phố Tạ Hiện', province: 'Hà Nội', lng: 105.852110102, lat: 21.034873505 },
  { name: 'Chợ Đồng Xuân', province: 'Hà Nội', lng: 105.848888044, lat: 21.03795194 },
  { name: 'Cầu Long Biên', province: 'Hà Nội', lng: 105.857317088, lat: 21.042840595 },
  { name: 'Hồ Tây - Trấn Quốc', province: 'Hà Nội', lng: 105.837941, lat: 21.048132 },
  { name: 'Nhà thờ Đức Bà', province: 'TP. Hồ Chí Minh', lng: 106.69918601, lat: 10.779948914 },
  { name: 'Bưu điện Thành phố', province: 'TP. Hồ Chí Minh', lng: 106.699738072, lat: 10.779450926 },
  { name: 'Phố đi bộ Nguyễn Huệ', province: 'TP. Hồ Chí Minh', lng: 106.7033, lat: 10.7749 },
  { name: 'Chợ Bến Thành', province: 'TP. Hồ Chí Minh', lng: 106.698405418, lat: 10.772003698 },
  { name: 'Cầu Rồng', province: 'Đà Nẵng', lng: 108.2271417381588, lat: 16.061251770443373 },
  { name: 'Cầu Sông Hàn', province: 'Đà Nẵng', lng: 108.226671028, lat: 16.072132252 },
  { name: 'Biển Mỹ Khê', province: 'Đà Nẵng', lng: 108.247831617, lat: 16.053711286 },
  { name: 'Nhà hát Lớn Hải Phòng', province: 'Hải Phòng', lng: 106.6819, lat: 20.85696 },
  { name: 'Bãi Cháy', province: 'Quảng Ninh', lng: 107.041975047, lat: 20.953487847 },
  { name: 'Hồ Xuân Hương', province: 'Lâm Đồng', lng: 108.442796888, lat: 11.941401163 },
  { name: 'Chợ Đà Lạt', province: 'Lâm Đồng', lng: 108.437277641, lat: 11.943110792 },
  { name: 'Chợ Cần Thơ', province: 'Cần Thơ', lng: 105.78793195, lat: 10.031398729 },
  { name: 'Bãi Sau', province: 'TP. Hồ Chí Minh', lng: 107.090062552, lat: 10.334447068 },
  { name: 'Tràng An', province: 'Ninh Bình', lng: 105.917767025, lat: 20.253610564 },
  { name: 'Phố cổ Hội An', province: 'Đà Nẵng', lng: 108.327636687, lat: 15.879853551 },
  { name: 'Quảng trường Lâm Viên', province: 'Lâm Đồng', lng: 108.445514244, lat: 11.938027506 },
]

const gameState = ref<GameState>('ready')
const rounds = ref<RoundQuestion[]>([])
const currentRoundIndex = ref(0)
const selectedOption = ref<LocationPoint | null>(null)
const score = ref(0)
const isImageLoading = ref(false)
const errorMessage = ref('')
const results = ref<RoundResult[]>([])
const hintUsed = ref(false)

// Three.js refs
const viewerContainer = ref<HTMLDivElement | null>(null)
let threeRenderer: THREE.WebGLRenderer | null = null
let threeScene: THREE.Scene | null = null
let threeCamera: THREE.PerspectiveCamera | null = null
let threeSphereMesh: THREE.Mesh | null = null
let animFrameId = 0
let isDragging = false
let prevPointerX = 0
let prevPointerY = 0
let lon = 0
let lat = 0
const DEFAULT_FOV = 75
const MIN_FOV = 30
const MAX_FOV = 110

const currentRound = computed(() => rounds.value[currentRoundIndex.value])
const totalRounds = computed(() => rounds.value.length)
const isLastRound = computed(() => currentRoundIndex.value >= totalRounds.value - 1)
const progressPercent = computed(() => {
  if (totalRounds.value === 0) return 0
  return ((currentRoundIndex.value + 1) / totalRounds.value) * 100
})

const hintUrl = computed(() => {
  if (!currentRound.value) return ''
  const { lat: la, lng } = currentRound.value.correct
  return `https://view.ndamaps.vn/?lat=${la}&lng=${lng}`
})

const resultEmoji = computed(() => {
  if (score.value === 5) return '🏆'
  if (score.value === 4) return '🌟'
  if (score.value === 3) return '😊'
  if (score.value === 2) return '🤔'
  return '😅'
})

const resultMessage = computed(() => {
  if (score.value === 5) return 'Đỉnh cao địa lý Việt Nam! Bạn đoán đúng tuyệt đối.'
  if (score.value >= 4) return 'Rất ấn tượng! Bạn có trực giác định vị rất tốt.'
  if (score.value >= 3) return 'Làm tốt lắm! Thêm chút quan sát nữa là lên pro.'
  if (score.value >= 2) return 'Không tệ! Chơi thêm vài vòng sẽ quen manh mối nhanh hơn.'
  return 'Khởi đầu ổn rồi! Hãy để ý biển hiệu và cảnh quan kỹ hơn ở vòng sau.'
})

// --- Three.js panorama viewer ---
function initThree(): void {
  if (!viewerContainer.value) return

  const container = viewerContainer.value
  const width = container.clientWidth
  const height = container.clientHeight

  threeScene = new THREE.Scene()
  threeCamera = new THREE.PerspectiveCamera(DEFAULT_FOV, width / height, 0.1, 1000)
  threeCamera.position.set(0, 0, 0)

  threeRenderer = new THREE.WebGLRenderer({ antialias: true })
  threeRenderer.outputColorSpace = THREE.LinearSRGBColorSpace
  threeRenderer.setSize(width, height)
  threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  container.appendChild(threeRenderer.domElement)

  // Sphere geometry — camera inside, so invert normals via negative scaleX
  const geometry = new THREE.SphereGeometry(500, 60, 40)
  geometry.scale(-1, 1, 1)

  const material = new THREE.MeshBasicMaterial({ color: 0x111111 })
  threeSphereMesh = new THREE.Mesh(geometry, material)
  threeScene.add(threeSphereMesh)

  renderLoop()
}

function renderLoop(): void {
  if (!threeRenderer || !threeScene || !threeCamera) return

  animFrameId = requestAnimationFrame(renderLoop)

  // Convert lon/lat to camera target
  const phi = THREE.MathUtils.degToRad(90 - lat)
  const theta = THREE.MathUtils.degToRad(lon)

  const target = new THREE.Vector3(
    500 * Math.sin(phi) * Math.cos(theta),
    500 * Math.cos(phi),
    500 * Math.sin(phi) * Math.sin(theta),
  )

  threeCamera.lookAt(target)
  threeRenderer.render(threeScene, threeCamera)
}

function loadPanoramaTexture(url: string): void {
  const loader = new THREE.TextureLoader()
  loader.crossOrigin = 'anonymous'
  loader.load(
    url,
    (texture) => {
      if (!threeSphereMesh) return
      texture.colorSpace = THREE.LinearSRGBColorSpace
      const mat = threeSphereMesh.material as THREE.MeshBasicMaterial
      if (mat.map) mat.map.dispose()
      mat.map = texture
      mat.color.set(0xffffff)
      mat.needsUpdate = true
      isImageLoading.value = false
      if (gameState.value === 'loading') {
        gameState.value = 'playing'
      }
    },
    undefined,
    () => {
      console.error('Failed to load panorama texture:', url)
      isImageLoading.value = false
    },
  )
}

function disposeThree(): void {
  cancelAnimationFrame(animFrameId)

  if (threeSphereMesh) {
    const mat = threeSphereMesh.material as THREE.MeshBasicMaterial
    if (mat.map) mat.map.dispose()
    mat.dispose()
    threeSphereMesh.geometry.dispose()
    threeSphereMesh = null
  }

  if (threeRenderer) {
    threeRenderer.dispose()
    if (threeRenderer.domElement.parentNode) {
      threeRenderer.domElement.parentNode.removeChild(threeRenderer.domElement)
    }
    threeRenderer = null
  }

  threeScene = null
  threeCamera = null
}

function handleResize(): void {
  if (!viewerContainer.value || !threeRenderer || !threeCamera) return
  const w = viewerContainer.value.clientWidth
  const h = viewerContainer.value.clientHeight
  threeRenderer.setSize(w, h)
  threeCamera.aspect = w / h
  threeCamera.updateProjectionMatrix()
}

// Pointer / touch events for Three.js viewer
function onViewerPointerDown(event: PointerEvent): void {
  if (gameState.value !== 'playing' && gameState.value !== 'answered') return
  isDragging = true
  prevPointerX = event.clientX
  prevPointerY = event.clientY
}

function onViewerPointerMove(event: PointerEvent): void {
  if (!isDragging) return

  const dx = event.clientX - prevPointerX
  const dy = event.clientY - prevPointerY

  prevPointerX = event.clientX
  prevPointerY = event.clientY

  lon -= dx * 0.15
  lat = Math.min(60, Math.max(-60, lat + dy * 0.15))
}

function onViewerPointerUp(): void {
  isDragging = false
}

function onViewerWheel(event: WheelEvent): void {
  if (gameState.value !== 'playing' && gameState.value !== 'answered') return
  event.preventDefault()
  if (!threeCamera) return
  threeCamera.fov = Math.min(MAX_FOV, Math.max(MIN_FOV, threeCamera.fov + event.deltaY * 0.05))
  threeCamera.updateProjectionMatrix()
}

// --- Utilities ---
function shuffle<T>(items: T[]): T[] {
  const cloned = [...items]
  for (let i = cloned.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = cloned[i]!
    cloned[i] = cloned[j]!
    cloned[j] = temp
  }
  return cloned
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), timeoutMs)

    promise
      .then((value) => {
        clearTimeout(timer)
        resolve(value)
      })
      .catch((error: unknown) => {
        clearTimeout(timer)
        reject(error)
      })
  })
}

async function preloadImage(url: string): Promise<void> {
  await new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(true)
    img.onerror = () => reject(new Error('image-load-failed'))
    img.src = url
  })
}

function buildOptions(correct: LocationPoint): LocationPoint[] {
  const byProvince = shuffle(
    locationPool.filter((point) => point.province !== correct.province && point.name !== correct.name),
  )

  const uniqueProvinceWrong: LocationPoint[] = []
  const usedProvince = new Set<string>()

  for (const point of byProvince) {
    if (usedProvince.has(point.province)) continue
    usedProvince.add(point.province)
    uniqueProvinceWrong.push(point)
    if (uniqueProvinceWrong.length === 3) break
  }

  if (uniqueProvinceWrong.length < 3) {
    const additional = shuffle(
      locationPool.filter(
        (point) =>
          point.name !== correct.name && !uniqueProvinceWrong.some((wrong) => wrong.name === point.name),
      ),
    ).slice(0, 3 - uniqueProvinceWrong.length)

    uniqueProvinceWrong.push(...additional)
  }

  return shuffle([correct, ...uniqueProvinceWrong.slice(0, 3)])
}

function pickDistinctLocations(count: number): LocationPoint[] {
  return shuffle(locationPool).slice(0, count)
}

async function fetchPanorama(point: LocationPoint): Promise<RoundQuestion | null> {
  const query = new URLSearchParams({
    place_position: `${point.lng},${point.lat}`,
    limit: '1',
  })

  const response = await withTimeout(fetch(`${API_BASE}?${query.toString()}`), REQUEST_TIMEOUT)

  if (!response.ok) {
    throw new Error('ndaview-request-failed')
  }

  const data = (await response.json()) as SearchResponse
  const feature = data.features?.[0]
  const sdUrl = feature?.assets?.sd?.href

  if (!feature || !sdUrl) {
    return null
  }

  const thumbUrl = feature.assets?.thumb?.href ?? sdUrl
  const azimuth = feature.properties?.['view:azimuth'] ?? 0

  return {
    id: feature.id,
    correct: point,
    options: buildOptions(point),
    imageUrl: sdUrl,
    thumbUrl,
    azimuth,
  }
}

async function buildRounds(): Promise<RoundQuestion[]> {
  const selected = pickDistinctLocations(Math.min(locationPool.length, TARGET_ROUNDS * 3))
  const built: RoundQuestion[] = []

  for (const point of selected) {
    if (built.length >= TARGET_ROUNDS) break

    let question: RoundQuestion | null = null

    for (let attempt = 0; attempt < MAX_FETCH_RETRIES; attempt += 1) {
      try {
        question = await fetchPanorama(point)
        if (question) {
          await preloadImage(question.thumbUrl)
          break
        }
      } catch (error) {
        if (attempt === MAX_FETCH_RETRIES - 1) {
          console.error(error)
        }
      }
    }

    if (question) {
      built.push(question)
    }
  }

  return built
}

function setViewFromAzimuth(azimuth: number): void {
  lon = azimuth
  lat = 0
  if (threeCamera) {
    threeCamera.fov = DEFAULT_FOV
    threeCamera.updateProjectionMatrix()
  }
}

async function startGame(): Promise<void> {
  gameState.value = 'loading'
  errorMessage.value = ''
  rounds.value = []
  currentRoundIndex.value = 0
  selectedOption.value = null
  score.value = 0
  results.value = []
  isImageLoading.value = true
  hintUsed.value = false

  try {
    const loadedRounds = await buildRounds()

    if (loadedRounds.length === 0) {
      throw new Error('ndaview-unavailable')
    }

    rounds.value = loadedRounds
    gameState.value = 'playing'

    // Init Three.js after DOM renders the viewer container
    await nextTick()
    if (!threeRenderer) {
      initThree()
      window.addEventListener('resize', handleResize)
    }

    setViewFromAzimuth(currentRound.value!.azimuth)
    loadPanoramaTexture(currentRound.value!.imageUrl)
  } catch {
    gameState.value = 'error'
    isImageLoading.value = false
    errorMessage.value =
      'Không thể kết nối NDAVIEW. Vui lòng kiểm tra mạng và thử lại. Nếu vẫn lỗi, dịch vụ NDAVIEW có thể đang tạm thời không khả dụng.'
  }
}

function selectAnswer(option: LocationPoint): void {
  if (gameState.value !== 'playing' || !currentRound.value) return

  selectedOption.value = option
  const isCorrect = option.name === currentRound.value.correct.name
  if (isCorrect) {
    score.value += 1
  }

  results.value.push({
    round: currentRoundIndex.value + 1,
    correct: isCorrect,
    selected: option,
    answer: currentRound.value.correct,
  })

  gameState.value = 'answered'
}

async function nextRound(): Promise<void> {
  if (!currentRound.value) return

  if (isLastRound.value) {
    disposeThree()
    window.removeEventListener('resize', handleResize)
    gameState.value = 'finished'
    return
  }

  currentRoundIndex.value += 1
  selectedOption.value = null
  hintUsed.value = false
  isImageLoading.value = true
  gameState.value = 'loading'

  setViewFromAzimuth(currentRound.value.azimuth)
  loadPanoramaTexture(currentRound.value.imageUrl)
}

function openHint(): void {
  hintUsed.value = true
  window.open(hintUrl.value, '_blank', 'noreferrer')
}

function getOptionClass(option: LocationPoint): string {
  if (gameState.value !== 'answered' || !currentRound.value) return ''

  const isCorrect = option.name === currentRound.value.correct.name
  const isSelected = option.name === selectedOption.value?.name

  if (isCorrect) return 'is-correct'
  if (isSelected && !isCorrect) return 'is-wrong'
  return 'is-muted'
}

// Cleanup
watch(gameState, (newState) => {
  if (newState === 'ready') {
    disposeThree()
    window.removeEventListener('resize', handleResize)
  }
})

onBeforeUnmount(() => {
  disposeThree()
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <div class="geo-guess-page">
    <header class="topbar">
      <router-link class="home-link" to="/">← Trang chủ</router-link>
      <p class="credit">
        Ảnh 360° bởi
        <a href="https://ndamaps.vn" target="_blank" rel="noopener noreferrer">NDAMaps</a>
        — Nền tảng bản đồ số quốc gia Việt Nam
      </p>
    </header>

    <main class="main-card">
      <section v-if="gameState === 'ready'" class="welcome-screen">
        <div class="welcome-icon">🗺️</div>
        <h1>GeoGuess VN</h1>
        <p class="welcome-text">Xem ảnh 360° thật từ NDAMaps và đoán xem bạn đang đứng ở đâu tại Việt Nam.</p>
        <ol>
          <li>Xoay ảnh để tìm manh mối.</li>
          <li>Chọn 1 trong 4 đáp án.</li>
          <li>Vượt qua tối đa 5 câu hỏi để chinh phục bản đồ.</li>
        </ol>
        <button class="primary-btn" type="button" @click="startGame">Bắt đầu chơi</button>
      </section>

      <section v-else-if="gameState === 'error'" class="error-screen">
        <h2>Không thể tải trò chơi</h2>
        <p>{{ errorMessage }}</p>
        <button class="primary-btn" type="button" @click="startGame">Thử lại</button>
      </section>

      <section v-else-if="gameState === 'finished'" class="result-screen">
        <div class="result-emoji">{{ resultEmoji }}</div>
        <h2>Kết quả của bạn</h2>
        <p class="score-big">{{ score }}/{{ totalRounds }}</p>
        <p class="result-message">{{ resultMessage }}</p>

        <ul class="summary-list">
          <li v-for="item in results" :key="item.round" :class="item.correct ? 'ok' : 'no'">
            Câu {{ item.round }}:
            <strong>{{ item.answer.name }} ({{ item.answer.province }})</strong>
            — {{ item.correct ? 'Đúng' : `Sai (${item.selected.name})` }}
          </li>
        </ul>

        <div class="result-actions">
          <button class="primary-btn" type="button" @click="startGame">Chơi lại</button>
          <router-link class="ghost-btn" to="/">Về trang chủ</router-link>
        </div>
      </section>

      <section v-else class="game-screen">
        <div class="progress-wrap">
          <div>
            <p class="progress-label">
              Câu {{ currentRoundIndex + 1 }}/{{ totalRounds }}
              <span>•</span>
              Điểm: {{ score }}
            </p>
            <div class="progress-track">
              <div class="progress-fill" :style="{ width: `${progressPercent}%` }" />
            </div>
          </div>
        </div>

        <div
          ref="viewerContainer"
          class="viewer"
          :class="{ dragging: isDragging }"
          @pointerdown="onViewerPointerDown"
          @pointermove="onViewerPointerMove"
          @pointerup="onViewerPointerUp"
          @pointerleave="onViewerPointerUp"
          @wheel="onViewerWheel"
        >


          <button class="hint-btn" type="button" title="Mở NDAVIEW tại khu vực này" @click="openHint">
            💡 Gợi ý
          </button>

          <div v-if="isImageLoading" class="viewer-loading">
            <span class="spinner" />
            <p>Đang tải ảnh 360°...</p>
          </div>
        </div>

        <div class="options-wrap">
          <h3>Đây là đâu?</h3>
          <div class="options-grid">
            <button
              v-for="(option, index) in currentRound?.options"
              :key="option.name"
              class="option-btn"
              :class="getOptionClass(option)"
              :disabled="gameState !== 'playing'"
              type="button"
              @click="selectAnswer(option)"
            >
              <span class="option-key">{{ String.fromCharCode(65 + index) }}</span>
              <span class="option-text">{{ option.name }} — {{ option.province }}</span>
            </button>
          </div>
        </div>

        <div v-if="gameState === 'answered'" class="answer-result">
          <p v-if="selectedOption?.name === currentRound?.correct.name" class="ok-text">✅ Chính xác!</p>
          <p v-else class="no-text">
            ❌ Sai rồi! Đáp án đúng là {{ currentRound?.correct.name }} ({{ currentRound?.correct.province }})
          </p>
          <button class="primary-btn" type="button" @click="nextRound">
            {{ isLastRound ? 'Xem kết quả' : 'Câu tiếp theo →' }}
          </button>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.geo-guess-page {
  --color-bg: #0f1923;
  --color-surface: #1a2733;
  --color-surface-2: #243442;
  --color-accent: #00d4aa;
  --color-accent-glow: rgba(0, 212, 170, 0.15);
  --color-correct: #22c55e;
  --color-wrong: #ef4444;
  --color-text: #e8edf2;
  --color-text-dim: #8899a8;
  --color-border: #2d3e4e;

  min-height: 100vh;
  color: var(--color-text);
  background: radial-gradient(circle at 20% 10%, #173044 0%, #0f1923 45%, #091118 100%);
  font-family: 'Be Vietnam Pro', system-ui, sans-serif;
  padding: 20px 16px 32px;
}

.topbar {
  max-width: 1100px;
  margin: 0 auto 14px;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.home-link {
  color: var(--color-accent);
  text-decoration: none;
  font-weight: 700;
}

.home-link:hover {
  text-decoration: underline;
}

.credit {
  margin: 0;
  color: var(--color-text-dim);
  font-size: 0.92rem;
}

.credit a {
  color: var(--color-accent);
}

.main-card {
  max-width: 1100px;
  margin: 0 auto;
  background: color-mix(in srgb, var(--color-surface) 92%, black 8%);
  border: 1px solid var(--color-border);
  border-radius: 18px;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.28);
  padding: 22px;
}

.welcome-screen,
.error-screen,
.result-screen {
  text-align: center;
  animation: fadeInUp 0.45s ease;
}

.welcome-icon {
  font-size: 3rem;
}

h1,
h2,
h3 {
  font-family: 'Baloo 2', system-ui, sans-serif;
  margin: 12px 0;
}

.welcome-text {
  max-width: 650px;
  margin: 0 auto;
  color: var(--color-text-dim);
}

ol {
  max-width: 480px;
  margin: 18px auto;
  text-align: left;
  color: var(--color-text);
  padding-left: 20px;
}

.primary-btn,
.ghost-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  border: 1px solid transparent;
  text-decoration: none;
  font-weight: 700;
  padding: 10px 18px;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.primary-btn {
  background: var(--color-accent);
  color: #032720;
  box-shadow: 0 10px 22px var(--color-accent-glow);
}

.primary-btn:hover {
  transform: translateY(-2px);
}

.ghost-btn {
  background: transparent;
  color: var(--color-text);
  border-color: var(--color-border);
}

.game-screen {
  display: grid;
  gap: 14px;
}

.progress-wrap {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-label {
  margin: 0 0 8px;
  color: var(--color-text-dim);
}

.progress-label span {
  margin: 0 6px;
}

.progress-track {
  width: 100%;
  height: 10px;
  border-radius: 999px;
  overflow: hidden;
  background: #12202c;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #14b8a6);
  transition: width 0.3s ease;
}

.viewer {
  position: relative;
  min-height: 56vh;
  border-radius: 16px;
  border: 1px solid var(--color-border);
  overflow: hidden;
  cursor: grab;
  touch-action: none;
  user-select: none;
  background: #0a141d;
}

.viewer.dragging {
  cursor: grabbing;
}

.viewer :deep(canvas) {
  display: block;
  width: 100% !important;
  height: 100% !important;
}

.hint-btn {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 7px 14px;
  border-radius: 10px;
  border: 1px solid var(--color-border);
  background: rgba(12, 20, 29, 0.84);
  color: var(--color-text);
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.hint-btn:hover {
  border-color: var(--color-accent);
  background: rgba(0, 212, 170, 0.12);
}

.viewer-loading {
  position: absolute;
  inset: 0;
  background: rgba(8, 14, 22, 0.7);
  display: grid;
  place-content: center;
  gap: 8px;
  text-align: center;
}

.spinner {
  margin: 0 auto;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 4px solid rgba(255, 255, 255, 0.2);
  border-top-color: var(--color-accent);
  animation: spin 1s linear infinite;
}

.options-wrap h3 {
  margin-bottom: 10px;
}

.options-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.option-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  background: var(--color-surface-2);
  color: var(--color-text);
  padding: 12px;
  text-align: left;
  transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease;
}

.option-btn:enabled:hover {
  transform: translateY(-2px);
  border-color: var(--color-accent);
}

.option-btn:disabled {
  cursor: default;
}

.option-key {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.09);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
}

.option-text {
  flex: 1;
}

.option-btn.is-correct {
  border-color: var(--color-correct);
  background: color-mix(in srgb, var(--color-correct) 22%, var(--color-surface-2) 78%);
}

.option-btn.is-wrong {
  border-color: var(--color-wrong);
  background: color-mix(in srgb, var(--color-wrong) 22%, var(--color-surface-2) 78%);
}

.option-btn.is-muted {
  opacity: 0.72;
}

.answer-result {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  padding-top: 6px;
  animation: fadeInUp 0.35s ease;
}

.ok-text {
  color: var(--color-correct);
}

.no-text {
  color: #fca5a5;
}

.score-big {
  margin: 6px 0;
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 900;
  color: var(--color-accent);
}

.result-message {
  color: var(--color-text-dim);
}

.summary-list {
  margin: 16px auto;
  padding: 0;
  max-width: 720px;
  list-style: none;
  display: grid;
  gap: 8px;
  text-align: left;
}

.summary-list li {
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 10px 12px;
  background: #16222d;
}

.summary-list li.ok {
  border-color: color-mix(in srgb, var(--color-correct) 60%, var(--color-border) 40%);
}

.summary-list li.no {
  border-color: color-mix(in srgb, var(--color-wrong) 60%, var(--color-border) 40%);
}

.result-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
}

@media (max-width: 600px) {
  .geo-guess-page {
    padding: 14px 10px 22px;
  }

  .main-card {
    padding: 14px;
    border-radius: 14px;
  }

  .viewer {
    min-height: 50vh;
  }

  .options-grid {
    grid-template-columns: 1fr;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
