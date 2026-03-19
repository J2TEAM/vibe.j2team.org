import { ref, onUnmounted } from 'vue'
import { useStorage } from '@vueuse/core'
import { FRUIT_TYPES, BOARD_WIDTH, BOARD_HEIGHT, GRAVITY, BOUNCE, FRICTION, ENGINE_ITERATIONS, type FruitData } from './config.ts'

export interface Fruit {
  id: number
  typeId: number
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  icon: string
  colorClass: string
  isMerged: boolean
  spawnTime: number
  hasCollided: boolean // Thêm dòng này: mặc định là false khi mới sinh ra
}

export type GameStatus = 'idle' | 'playing' | 'gameover'

// --- BỘ TỔNG HỢP ÂM THANH (WEB AUDIO API) ---
let audioCtx: AudioContext | null = null

const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
}

// 1. Tiếng va chạm "lanh canh" như thủy tinh
const playGlassSound = (impact: number) => {
  if (!audioCtx) return
  if (impact < 1.5) return // Bỏ qua các va chạm quá nhẹ (trượt nhẹ lên nhau)

  const t = audioCtx.currentTime
  const osc = audioCtx.createOscillator()
  const gain = audioCtx.createGain()

  osc.type = 'triangle'
  // Tần số cao ngẫu nhiên (1500Hz - 2000Hz) tạo cảm giác lanh canh
  osc.frequency.setValueAtTime(1500 + Math.random() * 500, t)

  // Âm lượng dựa vào lực va đập (impact)
  const vol = Math.min(impact / 15, 0.15)
  gain.gain.setValueAtTime(vol, t)
  gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1) // Tắt âm cực nhanh (0.1s)

  osc.connect(gain)
  gain.connect(audioCtx.destination)

  osc.start(t)
  osc.stop(t + 0.1)
}

// 2. Tiếng "tinh tinh" trong trẻo khi Merge
const playMergeSound = (level: number) => {
  if (!audioCtx) return
  const t = audioCtx.currentTime

  const osc = audioCtx.createOscillator()
  const gain = audioCtx.createGain()

  osc.type = 'sine' // Sóng Sine cho âm thanh cực kỳ tròn trịa, trong trẻo

  // Trái cây level càng cao, cao độ âm thanh càng trầm ấm dần
  const baseFreq = 1000 + (level * 100)

  // Tạo hiệu ứng 2 nốt nhạc nhanh (Tinh - Tíinh)
  osc.frequency.setValueAtTime(baseFreq, t)
  osc.frequency.setValueAtTime(baseFreq * 1.5, t + 0.1)

  gain.gain.setValueAtTime(0, t)
  gain.gain.linearRampToValueAtTime(0.3, t + 0.02) // Fade in cực nhanh
  gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4) // Ngân vang nhẹ trong 0.4s

  osc.connect(gain)
  gain.connect(audioCtx.destination)

  osc.start(t)
  osc.stop(t + 0.4)
}

export function useGame() {
const fruits = ref<Fruit[]>([])
  const score = ref(0)
  const highScore = useStorage('quantum_mergers_highscore', 0)
  const gameStatus = ref<GameStatus>('idle')

  // Sửa 2 dòng này: Khai báo rõ kiểu <FruitData> và thêm dấu ! ở cuối
  const currentFruitType = ref<FruitData>(FRUIT_TYPES[0]!)
  const nextFruitType = ref<FruitData>(FRUIT_TYPES[1]!)
  const dropX = ref(BOARD_WIDTH / 2)

  let fruitIdCounter = 0
  let animationFrameId: number

  const getRandomBaseFruit = () => {
    // Chỉ random 4 loại trái cây nhỏ nhất cho viên thả xuống
    const maxIndex = Math.min(3, FRUIT_TYPES.length - 1)
    return FRUIT_TYPES[Math.floor(Math.random() * (maxIndex + 1))]!
  }

  const startGame = () => {
    fruits.value = []
    score.value = 0
    gameStatus.value = 'playing'
    currentFruitType.value = getRandomBaseFruit()
    nextFruitType.value = getRandomBaseFruit()
    if (!animationFrameId) gameLoop()
  }

  const dropFruit = () => {
    initAudio() // Đánh thức hệ thống âm thanh khi user chạm màn hình

    if (gameStatus.value !== 'playing') return

    const safeX = Math.max(currentFruitType.value.radius, Math.min(BOARD_WIDTH - currentFruitType.value.radius, dropX.value))

    fruits.value.push({
      id: fruitIdCounter++,
      typeId: currentFruitType.value.id,
      x: safeX,
      y: currentFruitType.value.radius,
      vx: 0,
      vy: 0,
      radius: currentFruitType.value.radius,
      icon: currentFruitType.value.icon,
      colorClass: currentFruitType.value.color,
      isMerged: false,
      spawnTime: Date.now(),
      hasCollided: false // Khởi tạo chưa va chạm
    })

    currentFruitType.value = nextFruitType.value
    nextFruitType.value = getRandomBaseFruit()
  }

  // Cập nhật vị trí thả theo con trỏ chuột/cảm ứng
  const updateDropPosition = (e: PointerEvent, containerBounds: DOMRect) => {
    if (gameStatus.value !== 'playing') return
    const relativeX = e.clientX - containerBounds.left
    const scale = BOARD_WIDTH / containerBounds.width
    dropX.value = relativeX * scale
  }

  // --- PHYSICS ENGINE TỐI GIẢN ---
  const gameLoop = () => {
    if (gameStatus.value === 'playing') {
      updatePhysics()
      checkGameOver()
    }
    animationFrameId = requestAnimationFrame(gameLoop)
  }

  const updatePhysics = () => {
    const currentFruits = fruits.value

    // 1. Áp dụng trọng lực & Di chuyển
    currentFruits.forEach(f => {
      if (f.isMerged) return
      f.vy += GRAVITY
      f.vy *= 0.99 // Cản không khí nhẹ
      f.x += f.vx
      f.y += f.vy
    })

    // 2. Xử lý va chạm nhiều vòng (Iterations) để chống lỗi xuyên thấu
    for (let iter = 0; iter < ENGINE_ITERATIONS; iter++) {
      // Va chạm tường & đáy
      currentFruits.forEach(f => {
        if (f.isMerged) return

        // Đáy
        if (f.y + f.radius > BOARD_HEIGHT) {
          f.y = BOARD_HEIGHT - f.radius
          f.vy *= -BOUNCE
          f.vx *= FRICTION
        }
        // Tường trái
        if (f.x - f.radius < 0) {
          f.x = f.radius
          f.vx *= -BOUNCE
        }
        // Tường phải
        if (f.x + f.radius > BOARD_WIDTH) {
          f.x = BOARD_WIDTH - f.radius
          f.vx *= -BOUNCE
        }
      })

      // Va chạm giữa các trái cây (Circle Collision)
      for (let i = 0; i < currentFruits.length; i++) {
        for (let j = i + 1; j < currentFruits.length; j++) {
          const f1 = currentFruits[i]
          const f2 = currentFruits[j]

          if (!f1 || !f2 || f1.isMerged || f2.isMerged) continue

          const dx = f2.x - f1.x
          const dy = f2.y - f1.y
          const distSq = dx * dx + dy * dy
          const minDist = f1.radius + f2.radius

          if (distSq < minDist * minDist) {
            const dist = Math.sqrt(distSq) || 0.1

            // Xử lý Merge nếu cùng loại
            if (f1.typeId === f2.typeId) {
              handleMerge(f1, f2)
              continue
            }

            // 1. TÍNH TOÁN KHỐI LƯỢNG (Mass)
            // Khối lượng tỉ lệ thuận với diện tích (bán kính bình phương)
            const m1 = f1.radius * f1.radius
            const m2 = f2.radius * f2.radius
            const totalMass = m1 + m2

            // Tỉ lệ phản lực: Quả nào nhẹ hơn sẽ bị đẩy đi nhiều hơn
            const ratio1 = m2 / totalMass
            const ratio2 = m1 / totalMass

            // 2. ĐẨY NHAU RA (Position Resolution)
            const overlap = minDist - dist
            const nx = dx / dist
            const ny = dy / dist

            // Hệ số làm mềm (chỉ đẩy 80% overlap để tránh giật khung hình)
            const correction = overlap * 0.8
            f1.x -= nx * correction * ratio1
            f1.y -= ny * correction * ratio1
            f2.x += nx * correction * ratio2
            f2.y += ny * correction * ratio2

            // 3. XỬ LÝ ĐỘ NẢY (Velocity / Restitution)
            const rvx = f2.vx - f1.vx
            const rvy = f2.vy - f1.vy
            // Vận tốc tương đối dọc theo trục va chạm
            const velAlongNormal = rvx * nx + rvy * ny

            // CHỈ xử lý nảy nếu 2 quả đang lao vào nhau (velAlongNormal < 0)
            // Nếu đang tách nhau ra rồi thì thôi không cộng thêm lực nữa
            if (velAlongNormal < 0) {

              // CHỈ PHÁT ÂM THANH NẾU LÀ LẦN ĐẦU CHẠM NHAU SAU KHI THẢ
              // Nếu f1 hoặc f2 là quả mới thả (hasCollided === false)
              if (!f1.hasCollided || !f2.hasCollided) {
                playGlassSound(Math.abs(velAlongNormal))

                // Đánh dấu để lần sau chạm tiếp (khi đang nằm im) sẽ không kêu nữa
                f1.hasCollided = true
                f2.hasCollided = true
              }

              // Hệ số nảy (Bounciness): Game này cần cảm giác nặng, squishy nên set rất thấp (0.1)
              const e = 0.1

              // Lực đẩy Impulse
              const j = -(1 + e) * velAlongNormal
              const impulseX = nx * j
              const impulseY = ny * j

              f1.vx -= impulseX * ratio1
              f1.vy -= impulseY * ratio1
              f2.vx += impulseX * ratio2
              f2.vy += impulseY * ratio2
            }
          }
        }
      }
    }

    // Dọn dẹp trái cây đã merge
    fruits.value = currentFruits.filter(f => !f.isMerged)
  }

  const handleMerge = (f1: Fruit, f2: Fruit) => {
    f1.isMerged = true
    f2.isMerged = true

    // Sinh trái cây cấp cao hơn
    const nextTypeIndex = FRUIT_TYPES.findIndex(t => t.id === f1.typeId) + 1
    if (nextTypeIndex < FRUIT_TYPES.length) {
      const nextType = FRUIT_TYPES[nextTypeIndex]!

      // PHÁT ÂM THANH MERGE (Truyền vào id của trái cây để điều chỉnh cao độ)
      playMergeSound(nextType.id)

      score.value += nextType.score
      if (score.value > highScore.value) {
        highScore.value = score.value
      }

      // Đẩy lực nổ nhẹ khi merge
      // Trong hàm handleMerge, đoạn push trái cây mới:
      fruits.value.push({
        id: fruitIdCounter++,
        typeId: nextType.id,
        x: (f1.x + f2.x) / 2,
        y: (f1.y + f2.y) / 2,
        vx: (Math.random() - 0.5) * 4,
        vy: -2, // Lực nẩy nhẹ lên khi merge
        radius: nextType.radius,
        icon: nextType.icon,
        colorClass: nextType.color,
        isMerged: false,
        spawnTime: Date.now(),
        hasCollided: false // Khởi tạo chưa va chạm
      })
    }
  }

  // --- GAME OVER ---
  const checkGameOver = () => {
    const now = Date.now()
    // Chỉ kiểm tra game over với những trái đã tồn tại ít nhất 1.5s
    const isOver = fruits.value.some(
      f => (now - f.spawnTime > 1500) && (f.y - f.radius < 50) && (Math.abs(f.vy) < 1)
    )
    if (isOver) {
      gameStatus.value = 'gameover'
    }
  }

  onUnmounted(() => {
    if (animationFrameId) cancelAnimationFrame(animationFrameId)
  })

  return {
    fruits,
    score,
    highScore,
    gameStatus,
    currentFruitType,
    nextFruitType,
    dropX,
    startGame,
    dropFruit,
    updateDropPosition
  }
}
