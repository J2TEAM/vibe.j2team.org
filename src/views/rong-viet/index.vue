<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { RouterLink } from 'vue-router'

// ─── Types ──────────────────────────────────────
interface Pos {
  x: number
  y: number
}
type Dir = 'up' | 'down' | 'left' | 'right'
type Screen = 'intro' | 'story' | 'playing' | 'levelComplete' | 'gameOver' | 'victory'

interface Level {
  id: number
  name: string
  region: string
  subtitle: string
  story: string
  completeStory: string
  foods: string[]
  foodNames: string[]
  speed: number
  targetScore: number
}

// ─── Level Data ─────────────────────────────────
const LEVELS: Level[] = [
  {
    id: 1,
    name: 'Chương 1',
    region: 'Hà Nội',
    subtitle: 'Phố cổ ngàn năm',
    story:
      'Truyền thuyết kể rằng, trong bọc trăm trứng của Âu Cơ, có một quả trứng nhỏ nhất bị rơi lại. Hàng ngàn năm sau, chú Rồng con chui ra ngay giữa phố cổ Hà Nội.\n\nMùi phở nóng hổi bay trong gió sớm dẫn lối chú qua ba mươi sáu phố phường...',
    completeStory:
      'No bụng, Rồng con vươn vai ngắm Hồ Gươm. Chú nhớ lời cha kể — "Con phải đi về phương Nam, nơi chín con rồng đổ ra biển lớn."\n\nRồng con cất cánh.',
    foods: ['🍜', '🍲'],
    foodNames: ['Phở', 'Bún chả'],
    speed: 180,
    targetScore: 5,
  },
  {
    id: 2,
    name: 'Chương 2',
    region: 'Huế',
    subtitle: 'Cố đô mộng mơ',
    story:
      'Bay qua đèo Ngang, Rồng con đáp xuống bờ sông Hương. Hoàng cung Huế hiện ra trong sương sớm.\n\nTiếng chuông chùa Thiên Mụ ngân nga, hương bún bò cay nồng tỏa ra từ con hẻm nhỏ...',
    completeStory:
      'Huế ngọt ngào và cay nồng. Rồng con lớn thêm một chút, đôi cánh dần mạnh mẽ hơn.\n\nPhía trước, đèo Hải Vân sừng sững như cánh cổng mở ra miền đất mới...',
    foods: ['🥢', '🍡'],
    foodNames: ['Bún bò Huế', 'Chè Huế'],
    speed: 150,
    targetScore: 7,
  },
  {
    id: 3,
    name: 'Chương 3',
    region: 'Đà Nẵng',
    subtitle: 'Thành phố bên sông Hàn',
    story:
      'Rồng con bay qua đèo Hải Vân — nơi mây trời giao hòa. Bên dưới, Đà Nẵng rực rỡ ánh đèn.\n\nCầu Rồng bắc qua sông Hàn phun lửa trong đêm. "Anh ơi! Anh có phải họ hàng không?" — Rồng con gọi, nhưng cầu Rồng chỉ biết phun lửa...',
    completeStory:
      'Đà Nẵng — nơi cầu Rồng phun lửa và biển xanh vô tận. Rồng con cảm nhận sức mạnh dâng lên trong từng thớ vảy.\n\nCon đường về Biển Đông đang dần rõ ràng hơn!',
    foods: ['🍜', '🥟'],
    foodNames: ['Mì Quảng', 'Bánh xèo'],
    speed: 130,
    targetScore: 10,
  },
  {
    id: 4,
    name: 'Chương 4',
    region: 'Sài Gòn',
    subtitle: 'Thành phố không ngủ',
    story:
      'Sài Gòn không bao giờ ngủ. Rồng con lạc vào những con hẻm nhỏ, nơi xe máy chạy như dòng sông.\n\nMùi bánh mì nóng giòn và cơm tấm sườn bì chả quyến rũ không thể cưỡng lại...',
    completeStory:
      'Sài Gòn hào sảng đã cho Rồng con thêm sức mạnh. Giờ chỉ còn một chặng cuối — miền Tây sông nước.\n\nNơi đó, chín nhánh Cửu Long đổ ra Biển Đông...',
    foods: ['🥖', '🍚'],
    foodNames: ['Bánh mì', 'Cơm tấm'],
    speed: 110,
    targetScore: 12,
  },
  {
    id: 5,
    name: 'Chương cuối',
    region: 'Miền Tây',
    subtitle: 'Sông nước Cửu Long',
    story:
      'Đồng bằng sông Cửu Long — chín nhánh sông mênh mông đổ ra Biển Đông.\n\nRồng con gần đến nhà. Nhưng trước khi trở về biển lớn, chú phải thưởng thức trái cây miền Tây — ngon nhất trần đời!',
    completeStory: '',
    foods: ['🍉', '🥥'],
    foodNames: ['Dưa hấu', 'Dừa tươi'],
    speed: 90,
    targetScore: 15,
  },
]

const VICTORY_STORY =
  'Rồng con đứng trên bờ biển, nhìn ra Biển Đông mênh mông. Hành trình từ Bắc vào Nam đã cho chú sức mạnh, nhưng hơn cả — chú mang theo hương vị của cả một đất nước.\n\n"Con sẽ quay lại," Rồng con nói, rồi vẫy đuôi lần cuối trước khi lặn xuống biển sâu.\n\nTruyền thuyết kể rằng, mỗi khi biển lặng sóng yên, người ta lại thấy một con rồng nhỏ bay lên từ mặt nước — tìm về đất Việt.'

// ─── Constants ──────────────────────────────────
const COLS = 20
const ROWS = 20

// ─── State ──────────────────────────────────────
const screen = ref<Screen>('intro')
const currentLevel = ref(0)
const score = ref(0)
const totalScore = ref(0)
const highScore = ref(0)

const snake = ref<Pos[]>([])
const direction = ref<Dir>('right')
const nextDir = ref<Dir>('right')
const food = ref<Pos>({ x: 10, y: 10 })
const foodEmoji = ref('🍜')

let gameLoop: number | null = null
let animFrame: number | null = null
const canvasRef = ref<HTMLCanvasElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)
let cellSize = 0
let dpr = 1

const level = computed(() => LEVELS[currentLevel.value])

// ─── Game Logic ─────────────────────────────────
function initSnake() {
  const cx = Math.floor(COLS / 2)
  const cy = Math.floor(ROWS / 2)
  snake.value = [
    { x: cx, y: cy },
    { x: cx - 1, y: cy },
    { x: cx - 2, y: cy },
  ]
  direction.value = 'right'
  nextDir.value = 'right'
  score.value = 0
  spawnFood()
}

function spawnFood() {
  let pos: Pos
  do {
    pos = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) }
  } while (snake.value.some((s) => s.x === pos.x && s.y === pos.y))
  food.value = pos
  const lvl = level.value
  foodEmoji.value = lvl.foods[Math.floor(Math.random() * lvl.foods.length)]
}

function tick() {
  direction.value = nextDir.value
  const head = { ...snake.value[0] }

  switch (direction.value) {
    case 'up':
      head.y--
      break
    case 'down':
      head.y++
      break
    case 'left':
      head.x--
      break
    case 'right':
      head.x++
      break
  }

  if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
    endGame()
    return
  }
  if (snake.value.some((s) => s.x === head.x && s.y === head.y)) {
    endGame()
    return
  }

  snake.value.unshift(head)

  if (head.x === food.value.x && head.y === food.value.y) {
    score.value++
    totalScore.value++
    if (score.value >= level.value.targetScore) {
      completeLevel()
      return
    }
    spawnFood()
  } else {
    snake.value.pop()
  }
  render()
}

function startPlaying() {
  initSnake()
  screen.value = 'playing'
  nextTick(() => {
    setupCanvas()
    startLoop()
    startAnimLoop()
  })
}

function startLoop() {
  stopLoop()
  gameLoop = window.setInterval(tick, level.value.speed)
}

function stopLoop() {
  if (gameLoop) {
    clearInterval(gameLoop)
    gameLoop = null
  }
  if (animFrame) {
    cancelAnimationFrame(animFrame)
    animFrame = null
  }
}

function startAnimLoop() {
  function loop() {
    if (screen.value === 'playing') {
      render()
      animFrame = requestAnimationFrame(loop)
    }
  }
  animFrame = requestAnimationFrame(loop)
}

function endGame() {
  stopLoop()
  const saved = localStorage.getItem('rong-viet-hs')
  if (!saved || totalScore.value > parseInt(saved)) {
    localStorage.setItem('rong-viet-hs', totalScore.value.toString())
    highScore.value = totalScore.value
  }
  screen.value = 'gameOver'
}

function completeLevel() {
  stopLoop()
  if (currentLevel.value >= LEVELS.length - 1) {
    const saved = localStorage.getItem('rong-viet-hs')
    if (!saved || totalScore.value > parseInt(saved)) {
      localStorage.setItem('rong-viet-hs', totalScore.value.toString())
      highScore.value = totalScore.value
    }
    screen.value = 'victory'
  } else {
    screen.value = 'levelComplete'
  }
}

function goNextLevel() {
  currentLevel.value++
  screen.value = 'story'
}

function restart() {
  currentLevel.value = 0
  totalScore.value = 0
  screen.value = 'story'
}

function beginJourney() {
  currentLevel.value = 0
  totalScore.value = 0
  screen.value = 'story'
}

// ─── Canvas ─────────────────────────────────────
function setupCanvas() {
  const canvas = canvasRef.value
  const container = containerRef.value
  if (!canvas || !container) return

  const w = container.clientWidth
  const size = Math.min(w, 500)
  cellSize = size / COLS
  dpr = window.devicePixelRatio || 1

  canvas.width = size * dpr
  canvas.height = size * dpr
  canvas.style.width = `${size}px`
  canvas.style.height = `${size}px`

  const ctx = canvas.getContext('2d')
  if (ctx) ctx.scale(dpr, dpr)
  render()
}

let frameCount = 0

function render() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  frameCount++
  const cs = cellSize
  const W = COLS * cs
  const H = ROWS * cs

  ctx.save()
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  // Background
  ctx.fillStyle = '#0F1923'
  ctx.fillRect(0, 0, W, H)

  // Grid — subtle dots at intersections
  ctx.fillStyle = '#1a2838'
  for (let x = 1; x < COLS; x++) {
    for (let y = 1; y < ROWS; y++) {
      ctx.fillRect(x * cs - 0.5, y * cs - 0.5, 1, 1)
    }
  }

  // Level number watermark
  ctx.fillStyle = 'rgba(255, 184, 48, 0.025)'
  ctx.font = `bold ${cs * 10}px Anybody, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(`0${level.value.id}`, W / 2, H / 2)

  // Food — bright pulsing indicator
  const pulse = Math.sin(frameCount * 0.15) * 0.4 + 0.6
  const fx = food.value.x * cs + cs / 2
  const fy = food.value.y * cs + cs / 2
  const foodRadius = cs * 0.4

  // Outer glow circle
  ctx.shadowColor = '#FFB830'
  ctx.shadowBlur = 10 + pulse * 12
  ctx.fillStyle = `rgba(255, 184, 48, ${0.15 + pulse * 0.1})`
  ctx.beginPath()
  ctx.arc(fx, fy, foodRadius + 2, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0

  // Inner bright circle
  ctx.fillStyle = '#FFB830'
  ctx.beginPath()
  ctx.arc(fx, fy, foodRadius * 0.6, 0, Math.PI * 2)
  ctx.fill()

  // Emoji on top
  ctx.fillStyle = '#FFFFFF'
  ctx.font = `${cs * 0.9}px serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(foodEmoji.value, fx, fy)

  // Snake body (draw tail to head so head is on top)
  const len = snake.value.length
  for (let i = len - 1; i >= 0; i--) {
    const seg = snake.value[i]
    const t = len > 1 ? i / (len - 1) : 0

    if (i === 0) {
      // Dragon head — bright and unmistakable
      const hx = seg.x * cs + cs / 2
      const hy = seg.y * cs + cs / 2

      // Outer glow
      ctx.shadowColor = '#FF6B4A'
      ctx.shadowBlur = 14
      ctx.fillStyle = 'rgba(255, 107, 74, 0.25)'
      ctx.beginPath()
      ctx.arc(hx, hy, cs * 0.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0

      // Bright coral circle
      ctx.fillStyle = '#FF6B4A'
      ctx.beginPath()
      ctx.arc(hx, hy, cs * 0.35, 0, Math.PI * 2)
      ctx.fill()

      // Dragon emoji on top
      ctx.fillStyle = '#FFFFFF'
      ctx.font = `${cs * 1.1}px serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('🐲', hx, hy)
    } else {
      // Body gradient: coral (#FF6B4A) → amber (#FFB830)
      const r = 255
      const g = Math.round(107 + t * 77)
      const b = Math.round(74 - t * 26)
      const pad = 2
      const shrink = t * cs * 0.2
      const segW = cs - pad * 2 - shrink
      const off = (cs - segW) / 2

      // Glow behind segment
      ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.4)`
      ctx.shadowBlur = 4
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
      ctx.beginPath()
      ctx.roundRect(seg.x * cs + off, seg.y * cs + off, segW, segW, 3)
      ctx.fill()
      ctx.shadowBlur = 0

      // Inner highlight
      ctx.fillStyle = `rgba(255, 255, 255, ${0.18 * (1 - t)})`
      ctx.beginPath()
      ctx.roundRect(seg.x * cs + off + 1.5, seg.y * cs + off + 1.5, segW - 3, segW * 0.35, 2)
      ctx.fill()
    }
  }

  // Scanlines
  ctx.fillStyle = 'rgba(0, 0, 0, 0.02)'
  for (let sy = 0; sy < H; sy += 3) {
    ctx.fillRect(0, sy, W, 1)
  }

  // Border
  ctx.strokeStyle = '#253549'
  ctx.lineWidth = 2
  ctx.strokeRect(0, 0, W, H)

  ctx.restore()
}

// ─── Input ──────────────────────────────────────
function setDir(d: Dir) {
  if (screen.value !== 'playing') return
  const cur = direction.value
  if (d === 'up' && cur !== 'down') nextDir.value = 'up'
  else if (d === 'down' && cur !== 'up') nextDir.value = 'down'
  else if (d === 'left' && cur !== 'right') nextDir.value = 'left'
  else if (d === 'right' && cur !== 'left') nextDir.value = 'right'
}

function onKey(e: KeyboardEvent) {
  const map: Record<string, Dir> = {
    ArrowUp: 'up',
    w: 'up',
    W: 'up',
    ArrowDown: 'down',
    s: 'down',
    S: 'down',
    ArrowLeft: 'left',
    a: 'left',
    A: 'left',
    ArrowRight: 'right',
    d: 'right',
    D: 'right',
  }
  const d = map[e.key]
  if (d) {
    setDir(d)
    e.preventDefault()
  }
}

let tx = 0,
  ty = 0
function onTouchStart(e: TouchEvent) {
  tx = e.touches[0].clientX
  ty = e.touches[0].clientY
}
function onTouchEnd(e: TouchEvent) {
  if (screen.value !== 'playing') return
  const dx = e.changedTouches[0].clientX - tx
  const dy = e.changedTouches[0].clientY - ty
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return
  if (Math.abs(dx) > Math.abs(dy)) {
    setDir(dx > 0 ? 'right' : 'left')
  } else {
    setDir(dy > 0 ? 'down' : 'up')
  }
}

// ─── Lifecycle ──────────────────────────────────
function onResize() {
  if (screen.value === 'playing') setupCanvas()
}

onMounted(() => {
  window.addEventListener('keydown', onKey)
  window.addEventListener('resize', onResize)
  const saved = localStorage.getItem('rong-viet-hs')
  if (saved) highScore.value = parseInt(saved)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('resize', onResize)
  stopLoop()
})
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body relative select-none">
    <!-- Back link -->
    <RouterLink
      to="/"
      class="fixed top-4 left-4 z-50 inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-xs text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
    >
      &larr; Trang chủ
    </RouterLink>

    <!-- ═══ INTRO ═══ -->
    <div
      v-if="screen === 'intro'"
      class="min-h-screen flex flex-col items-center justify-center px-6"
    >
      <div class="max-w-md text-center">
        <p class="text-7xl animate-fade-up">🐲</p>
        <h1
          class="font-display text-5xl sm:text-6xl font-bold text-accent-coral mt-6 animate-fade-up animate-delay-1"
        >
          Rồng Việt
        </h1>
        <p
          class="font-display text-lg text-accent-amber mt-2 tracking-wide animate-fade-up animate-delay-2"
        >
          Hành Trình Về Biển Đông
        </p>
        <p class="mt-6 text-text-secondary leading-relaxed animate-fade-up animate-delay-3">
          Trong bọc trăm trứng của Âu Cơ, có một quả trứng nhỏ nhất bị rơi lại. Hàng ngàn năm sau,
          Rồng con thức dậy — và bắt đầu hành trình về nhà...
        </p>
        <button
          class="mt-8 font-display font-semibold tracking-wider border-2 border-accent-coral text-accent-coral px-8 py-3 text-sm transition hover:bg-accent-coral hover:text-bg-deep animate-fade-up animate-delay-4"
          @click="beginJourney"
        >
          BẮT ĐẦU HÀNH TRÌNH
        </button>
        <p class="mt-6 text-text-dim text-xs animate-fade-up animate-delay-5">
          ← ↑ ↓ → hoặc WASD &nbsp;|&nbsp; Vuốt trên mobile
        </p>
        <p
          v-if="highScore > 0"
          class="mt-2 text-accent-amber/60 text-xs animate-fade-up animate-delay-5"
        >
          Kỷ lục: {{ highScore }} điểm
        </p>
      </div>
    </div>

    <!-- ═══ STORY ═══ -->
    <div
      v-if="screen === 'story'"
      class="min-h-screen flex flex-col items-center justify-center px-6"
    >
      <div class="max-w-lg w-full">
        <div class="flex items-center gap-3 animate-fade-up">
          <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
          <span class="font-display text-sm tracking-widest text-text-dim">{{ level.name }}</span>
        </div>
        <h2
          class="font-display text-4xl sm:text-5xl font-bold text-accent-coral mt-3 animate-fade-up animate-delay-1"
        >
          {{ level.region }}
        </h2>
        <p class="font-display text-accent-amber mt-1 animate-fade-up animate-delay-2">
          {{ level.subtitle }}
        </p>

        <p
          class="mt-8 text-text-secondary leading-relaxed whitespace-pre-line animate-fade-up animate-delay-3"
        >
          {{ level.story }}
        </p>

        <div class="mt-8 flex gap-4 animate-fade-up animate-delay-4">
          <div
            v-for="(f, i) in level.foods"
            :key="i"
            class="border border-border-default bg-bg-surface px-4 py-3 flex items-center gap-3"
          >
            <span class="text-2xl">{{ f }}</span>
            <span class="text-sm text-text-secondary">{{ level.foodNames[i] }}</span>
          </div>
        </div>

        <p class="mt-4 text-text-dim text-sm animate-fade-up animate-delay-5">
          Thu thập <span class="text-accent-amber font-semibold">{{ level.targetScore }}</span> món
          để qua chương
        </p>

        <button
          class="mt-8 font-display font-semibold tracking-wider border-2 border-accent-coral text-accent-coral px-8 py-3 text-sm transition hover:bg-accent-coral hover:text-bg-deep animate-fade-up animate-delay-5"
          @click="startPlaying"
        >
          SẴN SÀNG!
        </button>
      </div>
    </div>

    <!-- ═══ PLAYING ═══ -->
    <div
      v-if="screen === 'playing'"
      class="min-h-screen flex flex-col items-center px-4 pt-16 pb-4"
    >
      <!-- HUD -->
      <div class="w-full max-w-[500px] flex items-center justify-between mb-2 px-1">
        <div class="flex items-center gap-2">
          <span class="text-accent-coral font-display text-xs tracking-widest">//</span>
          <span class="font-display text-sm font-semibold">{{ level.region }}</span>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-text-dim text-xs font-display"
            >{{ foodEmoji }} {{ score }}/{{ level.targetScore }}</span
          >
          <span class="text-accent-amber text-xs font-display">★ {{ totalScore }}</span>
        </div>
      </div>

      <!-- Progress bar -->
      <div class="w-full max-w-[500px] h-1 bg-bg-surface mb-3">
        <div
          class="h-full bg-accent-coral transition-all duration-300"
          :style="{ width: Math.min(100, (score / level.targetScore) * 100) + '%' }"
        />
      </div>

      <!-- Canvas -->
      <div ref="containerRef" class="w-full max-w-[500px]">
        <canvas
          ref="canvasRef"
          class="block mx-auto"
          @touchstart.prevent="onTouchStart"
          @touchmove.prevent
          @touchend="onTouchEnd"
        />
      </div>

      <!-- Mobile D-pad -->
      <div class="mt-4 sm:hidden">
        <div class="grid grid-cols-3 gap-1.5 w-36 mx-auto">
          <div />
          <button
            class="dpad-btn"
            @touchstart.prevent="setDir('up')"
            @mousedown.prevent="setDir('up')"
          >
            ↑
          </button>
          <div />
          <button
            class="dpad-btn"
            @touchstart.prevent="setDir('left')"
            @mousedown.prevent="setDir('left')"
          >
            ←
          </button>
          <div
            class="dpad-btn bg-bg-elevated/50 flex items-center justify-center text-text-dim text-xs"
          >
            🐲
          </div>
          <button
            class="dpad-btn"
            @touchstart.prevent="setDir('right')"
            @mousedown.prevent="setDir('right')"
          >
            →
          </button>
          <div />
          <button
            class="dpad-btn"
            @touchstart.prevent="setDir('down')"
            @mousedown.prevent="setDir('down')"
          >
            ↓
          </button>
          <div />
        </div>
      </div>
    </div>

    <!-- ═══ LEVEL COMPLETE ═══ -->
    <div
      v-if="screen === 'levelComplete'"
      class="min-h-screen flex flex-col items-center justify-center px-6"
    >
      <div class="max-w-lg w-full text-center">
        <p class="text-5xl animate-fade-up">✨</p>
        <h2
          class="font-display text-3xl font-bold text-accent-amber mt-4 animate-fade-up animate-delay-1"
        >
          {{ level.region }} — Hoàn thành!
        </h2>
        <p
          class="mt-6 text-text-secondary leading-relaxed whitespace-pre-line text-left animate-fade-up animate-delay-2"
        >
          {{ level.completeStory }}
        </p>
        <p class="mt-4 text-accent-amber text-sm animate-fade-up animate-delay-3">
          Tổng điểm: <span class="font-semibold">{{ totalScore }}</span>
        </p>
        <button
          class="mt-8 font-display font-semibold tracking-wider border-2 border-accent-coral text-accent-coral px-8 py-3 text-sm transition hover:bg-accent-coral hover:text-bg-deep animate-fade-up animate-delay-4"
          @click="goNextLevel"
        >
          TIẾP TỤC HÀNH TRÌNH →
        </button>
      </div>
    </div>

    <!-- ═══ GAME OVER ═══ -->
    <div
      v-if="screen === 'gameOver'"
      class="min-h-screen flex flex-col items-center justify-center px-6"
    >
      <div class="max-w-md text-center">
        <p class="text-5xl animate-fade-up">💀</p>
        <h2
          class="font-display text-3xl font-bold text-accent-coral mt-4 animate-fade-up animate-delay-1"
        >
          Rồng con gục ngã!
        </h2>
        <p class="mt-4 text-text-secondary animate-fade-up animate-delay-2">
          Hành trình dừng lại tại
          <span class="text-accent-amber font-semibold">{{ level.region }}</span>
        </p>
        <div
          class="mt-6 border border-border-default bg-bg-surface p-6 animate-fade-up animate-delay-3"
        >
          <p class="text-text-dim text-xs font-display tracking-wider mb-3">KẾT QUẢ</p>
          <p class="text-accent-amber text-2xl font-display font-bold">
            {{ totalScore }} <span class="text-sm text-text-dim">điểm</span>
          </p>
          <p v-if="highScore > 0" class="mt-2 text-text-dim text-sm">Kỷ lục: {{ highScore }}</p>
        </div>
        <div class="mt-8 flex gap-4 justify-center animate-fade-up animate-delay-4">
          <button
            class="font-display font-semibold tracking-wider border-2 border-accent-coral text-accent-coral px-6 py-3 text-sm transition hover:bg-accent-coral hover:text-bg-deep"
            @click="restart"
          >
            THỬ LẠI
          </button>
          <RouterLink
            to="/"
            class="font-display font-semibold tracking-wider border-2 border-border-default text-text-secondary px-6 py-3 text-sm transition hover:border-accent-coral hover:text-text-primary"
          >
            VỀ NHÀ
          </RouterLink>
        </div>
      </div>
    </div>

    <!-- ═══ VICTORY ═══ -->
    <div
      v-if="screen === 'victory'"
      class="min-h-screen flex flex-col items-center justify-center px-6"
    >
      <div class="max-w-lg w-full text-center">
        <p class="text-6xl animate-fade-up">🐉</p>
        <h2
          class="font-display text-4xl font-bold text-accent-amber mt-4 animate-fade-up animate-delay-1"
        >
          Rồng con đã về nhà!
        </h2>
        <p
          class="mt-6 text-text-secondary leading-relaxed whitespace-pre-line text-left animate-fade-up animate-delay-2"
        >
          {{ VICTORY_STORY }}
        </p>
        <div
          class="mt-6 border border-accent-amber/30 bg-bg-surface p-6 animate-fade-up animate-delay-3"
        >
          <p class="text-text-dim text-xs font-display tracking-wider mb-3">TỔNG KẾT HÀNH TRÌNH</p>
          <p class="text-accent-amber text-3xl font-display font-bold">
            {{ totalScore }} <span class="text-sm text-text-dim">điểm</span>
          </p>
          <p class="mt-2 text-text-dim text-sm">
            5 vùng miền &nbsp;·&nbsp; {{ LEVELS.reduce((a, l) => a + l.targetScore, 0) }} đặc sản
          </p>
        </div>
        <div class="mt-8 flex gap-4 justify-center animate-fade-up animate-delay-4">
          <button
            class="font-display font-semibold tracking-wider border-2 border-accent-amber text-accent-amber px-6 py-3 text-sm transition hover:bg-accent-amber hover:text-bg-deep"
            @click="restart"
          >
            CHƠI LẠI
          </button>
          <RouterLink
            to="/"
            class="font-display font-semibold tracking-wider border-2 border-border-default text-text-secondary px-6 py-3 text-sm transition hover:border-accent-amber hover:text-text-primary"
          >
            VỀ NHÀ
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dpad-btn {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #253549;
  background: #162232;
  color: #8b9db5;
  font-size: 18px;
  font-weight: 600;
  transition: all 0.15s;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}
.dpad-btn:active {
  background: #1e2f42;
  border-color: #ff6b4a;
  color: #f0ede6;
}
</style>
