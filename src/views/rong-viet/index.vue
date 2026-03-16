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

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  char?: string
  size: number
}

type PowerUpType = 'coffee' | 'tea' | 'chili'
interface PowerUp {
  pos: Pos
  type: PowerUpType
  emoji: string
  timeToLive: number
}

// ─── Level Data ─────────────────────────────────
const CHUONG_NGAI_VAT = ['🧱', '🌲', '🛵', '🪨']

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

const ENDLESS_LEVEL: Level = {
  id: 0,
  name: 'Vô Tận',
  region: 'Khắp Việt Nam',
  subtitle: 'Chuyến bay không mỏi',
  story: '',
  completeStory: '',
  foods: ['🍜', '🍲', '🥢', '🍡', '🥟', '🥖', '🍚', '🍉', '🥥'],
  foodNames: ['Món ngon'],
  speed: 140, // Tốc độ bắt đầu
  targetScore: Infinity,
}

const VICTORY_STORY =
  'Rồng con đứng trên bờ biển, nhìn ra Biển Đông mênh mông. Hành trình từ Bắc vào Nam đã cho chú sức mạnh, nhưng hơn cả — chú mang theo hương vị của cả một đất nước.\n\n"Con sẽ quay lại," Rồng con nói, rồi vẫy đuôi lần cuối trước khi lặn xuống biển sâu.\n\nTruyền thuyết kể rằng, mỗi khi biển lặng sóng yên, người ta lại thấy một con rồng nhỏ bay lên từ mặt nước — tìm về đất Việt.'

// ─── Constants ──────────────────────────────────
const COLS = 20
const ROWS = 20

// ─── State ──────────────────────────────────────
const screen = ref<Screen>('intro')
const currentLevel = ref(0)
const isEndless = ref(false)
const score = ref(0)
const totalScore = ref(0)
const highScore = ref(0)
const endlessHighScore = ref(0)

const snake = ref<Pos[]>([])
const direction = ref<Dir>('right')
const nextDir = ref<Dir>('right')
const food = ref<Pos>({ x: 10, y: 10 })
const foodEmoji = ref('🍜')
const obstacles = ref<(Pos & { emoji: string })[]>([])
const activePowerUp = ref<PowerUp | null>(null)
const powerUpEffect = ref<{ type: PowerUpType; timeLeft: number } | null>(null)
const particles = ref<Particle[]>([])

const popMessage = ref<{ text: string; color: string; life: number; maxLife: number }>({
  text: '',
  color: '',
  life: 0,
  maxLife: 0,
})

let animFrame: number | null = null
let lastTime = 0
let accumulator = 0
let screenShake = 0

const canvasRef = ref<HTMLCanvasElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)
let cellSize = 0
let dpr = 1

const level = computed(
  () => (isEndless.value ? ENDLESS_LEVEL : LEVELS[currentLevel.value]) as Level,
)

// ─── Utils ──────────────────────────────────────
function isPosOccupied(pos: Pos, includeHead = true): boolean {
  if (pos.x === food.value.x && pos.y === food.value.y) return true
  if (
    activePowerUp.value &&
    pos.x === activePowerUp.value.pos.x &&
    pos.y === activePowerUp.value.pos.y
  )
    return true
  if (obstacles.value.some((o) => o.x === pos.x && o.y === pos.y)) return true
  if (snake.value.some((s, i) => (includeHead || i > 0) && s.x === pos.x && s.y === pos.y))
    return true
  return false
}

function getRandomEmptyPos(): Pos {
  let pos: Pos
  let attempts = 0
  do {
    pos = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) }
    attempts++
  } while (isPosOccupied(pos) && attempts < 100)
  return pos
}

function createExplosion(x: number, y: number, color: string, char?: string, count: number = 10) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = Math.random() * 40 + 20
    particles.value.push({
      x: x * cellSize + cellSize / 2,
      y: y * cellSize + cellSize / 2,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      maxLife: Math.random() * 0.5 + 0.3,
      color,
      char: Math.random() > 0.5 ? char : undefined,
      size: Math.random() * 6 + 2,
    })
  }
}

function showPopMessage(text: string, color: string) {
  popMessage.value = { text, color, life: 1.5, maxLife: 1.5 }
}

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
  obstacles.value = []
  activePowerUp.value = null
  powerUpEffect.value = null
  particles.value = []
  screenShake = 0
  accumulator = 0
  lastTime = 0
  popMessage.value.life = 0

  if (isEndless.value) {
    spawnObstacles(0) // Will spawn dynamic later
  } else {
    spawnObstacles(currentLevel.value + 1) // Obstacle count increases by chapter
  }

  spawnFood()
}

function spawnObstacles(count: number) {
  for (let i = 0; i < count; i++) {
    const pos = getRandomEmptyPos()
    // Don't spawn too close to center (where snake starts)
    if (Math.abs(pos.x - COLS / 2) < 4 && Math.abs(pos.y - ROWS / 2) < 4) continue

    obstacles.value.push({
      ...pos,
      emoji: CHUONG_NGAI_VAT[Math.floor(Math.random() * CHUONG_NGAI_VAT.length)] || '🧱',
    })
  }
}

function spawnFood() {
  food.value = getRandomEmptyPos()
  const lvl = level.value
  foodEmoji.value = lvl.foods[Math.floor(Math.random() * lvl.foods.length)] || '🍲'

  // Consider spawning powerup
  if (!activePowerUp.value && Math.random() < 0.2) {
    const typeRnd = Math.random()
    let type: PowerUpType = 'coffee'
    let emoji = '☕'
    if (typeRnd < 0.33) {
      type = 'tea'
      emoji = '🧊'
    } else if (typeRnd < 0.66) {
      type = 'chili'
      emoji = '🌶️'
    }

    activePowerUp.value = {
      pos: getRandomEmptyPos(),
      type,
      emoji,
      timeToLive: 10 + Math.random() * 5, // 10-15 seconds
    }
  }
}

function handlePowerupCollect(type: PowerUpType) {
  createExplosion(
    activePowerUp.value!.pos.x,
    activePowerUp.value!.pos.y,
    '#FFB830',
    activePowerUp.value!.emoji,
    15,
  )
  activePowerUp.value = null

  if (type === 'coffee') {
    powerUpEffect.value = { type, timeLeft: 5 } // 5s duration
    showPopMessage('TỐC CHÓP!', '#FFF')
  } else if (type === 'tea') {
    powerUpEffect.value = { type, timeLeft: 6 } // 6s duration
    showPopMessage('SỐNG CHẬM...', '#8ECDDD')
  } else if (type === 'chili') {
    // Cut tail up to 3 segments if long enough, else just invincible
    if (snake.value.length > 5) {
      snake.value.splice(snake.value.length - 2, 2)
    }
    powerUpEffect.value = { type, timeLeft: 4 } // 4s duration
    screenShake = 0.2
    showPopMessage('CAY XÉ LƯỠI!', '#FF6B4A')
  }
}

function tickLogic() {
  direction.value = nextDir.value
  const head = { ...snake.value[0] } as Pos

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

  const isInvincible = powerUpEffect.value?.type === 'chili'

  // Wall collision
  if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
    if (isEndless.value) {
      // Loop around in endless mode
      head.x = (head.x + COLS) % COLS
      head.y = (head.y + ROWS) % ROWS
    } else {
      endGame()
      return
    }
  }

  // Self collision
  if (snake.value.some((s) => s.x === head.x && s.y === head.y)) {
    if (!isInvincible) {
      endGame()
      return
    }
  }

  // Obstacle collision
  const hitObstacle = obstacles.value.findIndex((o) => o.x === head.x && o.y === head.y)
  if (hitObstacle >= 0) {
    if (!isInvincible) {
      endGame()
      return
    } else {
      // Destroy obstacle if invincible
      createExplosion(head.x, head.y, '#AAAAAA', '💨', 15)
      obstacles.value.splice(hitObstacle, 1)
      screenShake = 0.3
    }
  }

  snake.value.unshift(head)

  let ate = false

  // Food collision
  if (head.x === food.value.x && head.y === food.value.y) {
    score.value++
    totalScore.value++
    ate = true
    createExplosion(head.x, head.y, '#FFB830', foodEmoji.value)

    if (isEndless.value && score.value % 5 === 0) {
      spawnObstacles(1) // Add difficulty
    }

    if (!isEndless.value && score.value >= level.value.targetScore) {
      completeLevel()
      return
    }
    spawnFood()
  }

  // Powerup collision
  if (
    activePowerUp.value &&
    head.x === activePowerUp.value.pos.x &&
    head.y === activePowerUp.value.pos.y
  ) {
    handlePowerupCollect(activePowerUp.value.type)
  }

  if (!ate) {
    snake.value.pop()
  }
}

function startPlaying() {
  initSnake()
  screen.value = 'playing'
  nextTick(() => {
    setupCanvas()
    startAnimLoop()
  })
}

function stopLoop() {
  if (animFrame) {
    cancelAnimationFrame(animFrame)
    animFrame = null
  }
}

function startAnimLoop() {
  stopLoop()
  lastTime = performance.now()
  animFrame = requestAnimationFrame(gameLoop)
}

function gameLoop(time: number) {
  if (screen.value !== 'playing') return

  const dt = (time - lastTime) / 1000 // delta time in seconds
  lastTime = time

  // Update particles
  for (let i = particles.value.length - 1; i >= 0; i--) {
    const p = particles.value[i] as Particle
    p.x += p.vx * dt
    p.y += p.vy * dt
    p.vy += 100 * dt // gravity
    p.life -= dt
    if (p.life <= 0) particles.value.splice(i, 1)
  }

  // Update powerup TTL
  if (activePowerUp.value) {
    activePowerUp.value.timeToLive -= dt
    if (activePowerUp.value.timeToLive <= 0) activePowerUp.value = null
  }

  // Update powerup effect
  if (powerUpEffect.value) {
    powerUpEffect.value.timeLeft -= dt
    if (powerUpEffect.value.timeLeft <= 0) powerUpEffect.value = null
  }

  // Update screen shake
  if (screenShake > 0) screenShake = Math.max(0, screenShake - dt)

  // Update pop message
  if (popMessage.value.life > 0) popMessage.value.life -= dt

  // Calculate current speed
  let currentSpeedMs = level.value.speed
  if (isEndless.value) {
    // Min speed 60ms, gets faster as score increases
    currentSpeedMs = Math.max(60, 140 - Math.floor(score.value / 3) * 5)
  }

  if (powerUpEffect.value) {
    if (powerUpEffect.value.type === 'coffee')
      currentSpeedMs *= 0.6 // faster
    else if (powerUpEffect.value.type === 'tea')
      currentSpeedMs *= 1.8 // slower
    else if (powerUpEffect.value.type === 'chili') currentSpeedMs *= 0.5 // much faster
  }

  accumulator += dt * 1000
  while (accumulator >= currentSpeedMs && screen.value === 'playing') {
    tickLogic()
    accumulator -= currentSpeedMs
  }

  render()
  animFrame = requestAnimationFrame(gameLoop)
}

function endGame() {
  screenShake = 0.5
  stopLoop()
  updateHighScores()
  setTimeout(() => {
    screen.value = 'gameOver'
  }, 500) // Small delay for effect
}

function updateHighScores() {
  if (isEndless.value) {
    const saved = localStorage.getItem('rong-viet-endless-hs')
    if (!saved || totalScore.value > parseInt(saved)) {
      localStorage.setItem('rong-viet-endless-hs', totalScore.value.toString())
      endlessHighScore.value = totalScore.value
    }
  } else {
    const saved = localStorage.getItem('rong-viet-hs')
    if (!saved || totalScore.value > parseInt(saved)) {
      localStorage.setItem('rong-viet-hs', totalScore.value.toString())
      highScore.value = totalScore.value
    }
  }
}

function completeLevel() {
  stopLoop()
  if (currentLevel.value >= LEVELS.length - 1) {
    updateHighScores()
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
  if (isEndless.value) {
    startPlaying()
  } else {
    currentLevel.value = 0
    totalScore.value = 0
    screen.value = 'story'
  }
}

function beginJourney() {
  isEndless.value = false
  currentLevel.value = 0
  totalScore.value = 0
  screen.value = 'story'
}

function beginEndless() {
  isEndless.value = true
  totalScore.value = 0
  score.value = 0
  startPlaying()
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

  // Screen shake
  let sx = 0,
    sy = 0
  if (screenShake > 0) {
    const amt = screenShake * 20
    sx = (Math.random() - 0.5) * amt
    sy = (Math.random() - 0.5) * amt
  }
  ctx.setTransform(dpr, 0, 0, dpr, sx, sy)

  // Background
  ctx.fillStyle = '#0F1923'
  ctx.fillRect(0, 0, W, H)

  // Sub-background for endless
  if (isEndless.value) {
    ctx.strokeStyle = '#FF6B4A'
    ctx.lineWidth = 4
    ctx.globalAlpha = 0.1
    ctx.strokeRect(0, 0, W, H)
    ctx.globalAlpha = 1.0
  }

  // Grid
  ctx.fillStyle = '#1a2838'
  for (let x = 1; x < COLS; x++) {
    for (let y = 1; y < ROWS; y++) {
      ctx.fillRect(x * cs - 0.5, y * cs - 0.5, 1, 1)
    }
  }

  // Level number watermark
  ctx.fillStyle = 'rgba(255, 184, 48, 0.025)'
  ctx.font = `bold ${cs * 8}px Anybody, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(isEndless.value ? 'VÔ TẬN' : `0${level.value.id}`, W / 2, H / 2)

  // Obstacles
  ctx.font = `${cs * 0.8}px serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  for (const o of obstacles.value) {
    ctx.fillText(o.emoji, o.x * cs + cs / 2, o.y * cs + cs / 2)
  }

  // PowerUp
  if (activePowerUp.value) {
    const pulse = Math.sin(frameCount * 0.2) * 0.2 + 0.8
    const px = activePowerUp.value.pos.x * cs + cs / 2
    const py = activePowerUp.value.pos.y * cs + cs / 2

    ctx.save()
    ctx.translate(px, py)
    ctx.scale(pulse, pulse)

    // Glow
    ctx.shadowColor =
      activePowerUp.value.type === 'coffee'
        ? '#7A5C43'
        : activePowerUp.value.type === 'tea'
          ? '#8ECDDD'
          : '#FF6B4A'
    ctx.shadowBlur = 10
    ctx.fillStyle = `rgba(255, 255, 255, 0.2)`
    ctx.beginPath()
    ctx.arc(0, 0, cs * 0.45, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0

    ctx.fillText(activePowerUp.value.emoji, 0, 0)
    ctx.restore()
  }

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

  // Determing snake styling based on effects
  let headColor = '#FF6B4A'
  let bodyColorStart = { r: 255, g: 107, b: 74 }
  let bodyColorEnd = { r: 255, g: 184, b: 48 }

  if (powerUpEffect.value) {
    if (powerUpEffect.value.type === 'chili') {
      headColor = '#FF0000'
      bodyColorStart = { r: 255, g: 0, b: 0 }
      bodyColorEnd = { r: 255, g: 100, b: 0 }
    } else if (powerUpEffect.value.type === 'tea') {
      headColor = '#8ECDDD'
      bodyColorStart = { r: 142, g: 205, b: 221 }
      bodyColorEnd = { r: 34, g: 166, b: 153 }
    } else if (powerUpEffect.value.type === 'coffee') {
      headColor = '#D4A373'
      bodyColorStart = { r: 212, g: 163, b: 115 }
      bodyColorEnd = { r: 250, g: 237, b: 205 }
    }
  }

  // Snake body (draw tail to head so head is on top)
  const len = snake.value.length
  for (let i = len - 1; i >= 0; i--) {
    const seg = snake.value[i] as Pos
    const t = len > 1 ? i / (len - 1) : 0

    if (i === 0) {
      // Dragon head
      const hx = seg.x * cs + cs / 2
      const hy = seg.y * cs + cs / 2

      ctx.shadowColor = headColor
      ctx.shadowBlur = 14
      ctx.fillStyle = headColor
      ctx.globalAlpha = 0.25
      ctx.beginPath()
      ctx.arc(hx, hy, cs * 0.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1.0
      ctx.shadowBlur = 0

      ctx.fillStyle = headColor
      ctx.beginPath()
      ctx.arc(hx, hy, cs * 0.35, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#FFFFFF'
      ctx.font = `${cs * 1.1}px serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      // Face direction logic roughly using emoji? Just text for now.
      ctx.fillText(powerUpEffect.value?.type === 'chili' ? '👺' : '🐲', hx, hy)
    } else {
      const g = Math.round(bodyColorStart.g + t * (bodyColorEnd.g - bodyColorStart.g))
      const b = Math.round(bodyColorStart.b + t * (bodyColorEnd.b - bodyColorStart.b))
      const r = Math.round(bodyColorStart.r + t * (bodyColorEnd.r - bodyColorStart.r))

      const pad = 2
      const shrink = t * cs * 0.2
      const segW = cs - pad * 2 - shrink
      const off = (cs - segW) / 2

      ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.4)`
      ctx.shadowBlur = powerUpEffect.value ? 8 : 4
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
      ctx.beginPath()
      ctx.roundRect(seg.x * cs + off, seg.y * cs + off, segW, segW, 3)
      ctx.fill()
      ctx.shadowBlur = 0

      ctx.fillStyle = `rgba(255, 255, 255, ${0.18 * (1 - t)})`
      ctx.beginPath()
      ctx.roundRect(seg.x * cs + off + 1.5, seg.y * cs + off + 1.5, segW - 3, segW * 0.35, 2)
      ctx.fill()
    }
  }

  // Draw Particles
  particles.value.forEach((p) => {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife)
    if (p.char) {
      ctx.font = `${p.size * 2}px serif`
      ctx.fillText(p.char, p.x, p.y)
    } else {
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1.0
  })

  // Scanlines
  ctx.fillStyle = 'rgba(0, 0, 0, 0.02)'
  for (let sy = 0; sy < H; sy += 3) {
    ctx.fillRect(0, sy, W, 1)
  }

  // Border
  ctx.strokeStyle = '#253549'
  ctx.lineWidth = 2
  ctx.strokeRect(0, 0, W, H)

  // Floating Pop Message
  if (popMessage.value.life > 0) {
    const pAmt = popMessage.value.life / popMessage.value.maxLife
    ctx.globalAlpha = pAmt
    ctx.fillStyle = popMessage.value.color
    ctx.font = `bold ${cs * 1.5}px Anybody, sans-serif`
    ctx.textAlign = 'center'
    // Starts floating from middle up
    ctx.fillText(popMessage.value.text, W / 2, H / 2 - (1 - pAmt) * 50)
    ctx.globalAlpha = 1.0
  }

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
  if (!e.touches[0]) return
  tx = e.touches[0].clientX
  ty = e.touches[0].clientY
}
function onTouchEnd(e: TouchEvent) {
  if (screen.value !== 'playing' || !e.changedTouches[0]) return
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

  const endlessSaved = localStorage.getItem('rong-viet-endless-hs')
  if (endlessSaved) endlessHighScore.value = parseInt(endlessSaved)
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

        <div
          class="flex flex-col gap-4 mt-8 w-full max-w-[280px] mx-auto animate-fade-up animate-delay-4"
        >
          <button
            class="font-display font-semibold tracking-wider border-2 border-accent-coral text-accent-coral px-8 py-3 text-sm transition hover:bg-accent-coral hover:text-bg-deep"
            @click="beginJourney"
          >
            MẬT NGỮ (STORY)
          </button>
          <button
            class="font-display font-semibold tracking-wider border-2 border-accent-amber text-accent-amber px-8 py-3 text-sm transition hover:bg-accent-amber hover:text-bg-deep"
            @click="beginEndless"
          >
            VÔ TẬN (ENDLESS)
          </button>
        </div>

        <p class="mt-8 text-text-dim text-xs animate-fade-up animate-delay-5">
          ← ↑ ↓ → hoặc WASD &nbsp;|&nbsp; Vuốt trên mobile
        </p>
        <div class="mt-4 flex gap-6 justify-center text-xs animate-fade-up animate-delay-5">
          <p v-if="highScore > 0" class="text-accent-coral/70">Kỷ lục Story: {{ highScore }}</p>
          <p v-if="endlessHighScore > 0" class="text-accent-amber/70">
            Kỷ lục Vô Tận: {{ endlessHighScore }}
          </p>
        </div>
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
          <span v-if="powerUpEffect" class="text-accent-coral text-xs font-bold animate-pulse">
            <span v-if="powerUpEffect.type === 'coffee'">☕ x2 SPEED</span>
            <span v-else-if="powerUpEffect.type === 'tea'">🧊 SLOW</span>
            <span v-else-if="powerUpEffect.type === 'chili'">🌶️ INVINCIBLE</span>
          </span>
          <span class="text-text-dim text-xs font-display"
            >{{ foodEmoji }} {{ isEndless ? score : `${score}/${level.targetScore}` }}</span
          >
          <span class="text-accent-amber text-xs font-display">★ {{ totalScore }}</span>
        </div>
      </div>

      <!-- Progress bar -->
      <div v-if="!isEndless" class="w-full max-w-[500px] h-1 bg-bg-surface mb-3">
        <div
          class="h-full bg-accent-coral transition-all duration-300"
          :style="{ width: Math.min(100, (score / level.targetScore) * 100) + '%' }"
        />
      </div>
      <div
        v-else
        class="w-full max-w-[500px] h-1 bg-bg-surface mb-3 flex items-center justify-center text-[10px] text-accent-amber/50 font-display"
      >
        CHẾ ĐỘ VÔ TẬN
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
            {{ isEndless ? score : totalScore }} <span class="text-sm text-text-dim">điểm</span>
          </p>
          <p v-if="isEndless && endlessHighScore > 0" class="mt-2 text-text-dim text-sm">
            Kỷ lục Vô Tận: {{ endlessHighScore }}
          </p>
          <p v-else-if="highScore > 0" class="mt-2 text-text-dim text-sm">
            Kỷ lục: {{ highScore }}
          </p>
        </div>
        <div class="mt-8 flex gap-4 justify-center animate-fade-up animate-delay-4">
          <button
            class="font-display font-semibold tracking-wider border-2 border-accent-coral text-accent-coral px-6 py-3 text-sm transition hover:bg-accent-coral hover:text-bg-deep"
            @click="restart"
          >
            THỬ LẠI
          </button>
          <button
            @click="screen = 'intro'"
            class="font-display font-semibold tracking-wider border-2 border-border-default text-text-secondary px-6 py-3 text-sm transition hover:border-accent-coral hover:text-text-primary"
          >
            MENU CHÍNH
          </button>
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
          <button
            @click="screen = 'intro'"
            class="font-display font-semibold tracking-wider border-2 border-border-default text-text-secondary px-6 py-3 text-sm transition hover:border-accent-amber hover:text-text-primary"
          >
            MENU CHÍNH
          </button>
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
