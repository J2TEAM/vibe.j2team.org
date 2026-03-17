<script setup lang="ts">
import { ref, onUnmounted, onMounted } from 'vue'
import { useRouter } from 'vue-router'

interface Seed {
  id: number
  type: string
  x: number
  y: number
  rotation: number
  instanceId: number
  isBotTarget?: boolean
}

const router = useRouter()
const role = ref<'none' | 'tam' | 'dighe'>('none')
const gameState = ref<'select' | 'setup' | 'playing' | 'won' | 'lost'>('select')
const seeds = ref<Seed[]>([])
const scoreLeft = ref(0)
const scoreRight = ref(0)
let instanceCounter = 0

const mixingOptions = [
  { id: 'gao_daudo', name: 'Gạo Trắng & Đậu Đỏ', left: 'gao', right: 'daudo' },
  { id: 'dauxanh_daudo', name: 'Đậu Xanh & Đậu Đỏ', left: 'dauxanh', right: 'daudo' },
  { id: 'gao_cat', name: 'Gạo Trắng & Cát', left: 'gao', right: 'cat' },
]

const currentMix = ref({ id: 'gao_daudo', name: 'Gạo Trắng & Đậu Đỏ', left: 'gao', right: 'daudo' })

// --- HỆ THỐNG SÁCH HƯỚNG DẪN ---
const showGuide = ref(false)

// --- HỆ THỐNG ÂM THANH (VITE URL RESOLVE) ---
const bgmUrl = new URL('./music_effect/background.mp3', import.meta.url).href
const windUrl = new URL('./music_effect/wind.mp3', import.meta.url).href
const winUrl = new URL('./music_effect/winner.mp3', import.meta.url).href
const loseUrl = new URL('./music_effect/lose.mp3', import.meta.url).href
const sparrowUrl = new URL('./music_effect/bird.mp3', import.meta.url).href
const cryUrl = new URL('./music_effect/cry.mp3', import.meta.url).href

const sfxBgm = new Audio(bgmUrl)
sfxBgm.loop = true
sfxBgm.volume = 0.3
const sfxWind = new Audio(windUrl)
const sfxWin = new Audio(winUrl)
const sfxLose = new Audio(loseUrl)
const sfxSparrow = new Audio(sparrowUrl)
const sfxCry = new Audio(cryUrl)

const isMuted = ref(false)
let bgmStarted = false

function initBgm() {
  if (!bgmStarted && !isMuted.value) {
    sfxBgm.play().catch(() => {})
    bgmStarted = true
  }
}

function toggleMute() {
  isMuted.value = !isMuted.value
  if (isMuted.value) {
    sfxBgm.pause()
    stopAllSfx()
  } else {
    sfxBgm.play().catch(() => {})
  }
}

const sfxTimeouts: Record<string, ReturnType<typeof setTimeout>> = {}
function playSfx(audio: HTMLAudioElement, key: string) {
  if (isMuted.value) return
  if (sfxTimeouts[key]) clearTimeout(sfxTimeouts[key])

  audio.currentTime = 0
  audio.play().catch(() => {})

  sfxTimeouts[key] = setTimeout(() => {
    audio.pause()
    audio.currentTime = 0
  }, 2500)
}

function stopAllSfx() {
  ;[sfxWind, sfxWin, sfxLose, sfxSparrow, sfxCry].forEach((audio) => {
    audio.pause()
    audio.currentTime = 0
  })
}

function stopAllAudio() {
  sfxBgm.pause()
  sfxBgm.currentTime = 0
  bgmStarted = false
  stopAllSfx()
}

// --- BIẾN TRẠNG THÁI GAME ---
const timeLeft = ref(60)
let timerInterval: ReturnType<typeof setInterval> | null = null
const toastMsg = ref('')

function showToast(msg: string) {
  toastMsg.value = msg
  setTimeout(() => {
    toastMsg.value = ''
  }, 2500)
}

// --- KỸ NĂNG CỦA TẤM ---
const sparrowUses = ref(2)
const sparrowCooldown = ref(0)
let sparrowCdInterval: ReturnType<typeof setInterval> | null = null

const isCrying = ref(false)
const cryCooldown = ref(0)
let cryCdInterval: ReturnType<typeof setInterval> | null = null

const isWindy = ref(false)
let windInterval: ReturnType<typeof setInterval> | null = null
let bongInterval: ReturnType<typeof setInterval> | null = null
let digheAIsabotage: ReturnType<typeof setInterval> | null = null

// --- BOT & DÌ GHẺ ---
const botX = ref(window.innerWidth / 2)
const botY = ref(window.innerHeight / 2)
const botGrabbing = ref(false)
let botTimeout: ReturnType<typeof setTimeout> | null = null

const sabotageActive = ref(false)
const sabotageType = ref<'wind' | 'add'>('wind')
const sabotageCooldown = ref(0)

const mgCursorPos = ref(0)
const mgTargetPos = ref(50)
const mgTargetWidth = ref(20)
let mgDirection = 1
const mgSpeed = 1.2
let minigameRaf: number | null = null
const showShoe = ref(false)
const shoeCooldown = ref(0)
let shoeCdInterval: ReturnType<typeof setInterval> | null = null

// --- CON TRỎ ĐŨA ---
const mouseX = ref(window.innerWidth / 2)
const mouseY = ref(window.innerHeight / 2)
const isGrabbing = ref(false)
const draggingSeed = ref<Seed | null>(null)
const offset = { x: 0, y: 0 }

function updateMouse(e: MouseEvent | TouchEvent) {
  if ('touches' in e) {
    const touchEvent = e as TouchEvent
    if (touchEvent.touches && touchEvent.touches.length > 0) {
      const touch = touchEvent.touches[0]
      if (touch) {
        mouseX.value = touch.clientX
        mouseY.value = touch.clientY
      }
    }
  } else {
    const mouseEvent = e as MouseEvent
    mouseX.value = mouseEvent.clientX
    mouseY.value = mouseEvent.clientY
  }
}

// --- KHỞI TẠO GAME & ĐIỀU HƯỚNG ---
function clearAllTimers() {
  if (timerInterval) clearInterval(timerInterval)
  if (windInterval) clearInterval(windInterval)
  if (bongInterval) clearInterval(bongInterval)
  if (digheAIsabotage) clearInterval(digheAIsabotage)
  if (botTimeout) clearTimeout(botTimeout)
  if (minigameRaf) cancelAnimationFrame(minigameRaf)
}

function quitToMainHome() {
  clearAllTimers()
  stopAllAudio()
  router.push('/') // Điều hướng về trang chủ Web
}

function goHome() {
  clearAllTimers()
  stopAllAudio()
  gameState.value = 'select' // Trở về Sảnh Chọn Phe
}

function startGame(selectedRole: 'tam' | 'dighe') {
  role.value = selectedRole
  if (selectedRole === 'tam') {
    const randomMix = mixingOptions[Math.floor(Math.random() * mixingOptions.length)]
    if (randomMix) currentMix.value = randomMix
    startPlaying()
  } else {
    gameState.value = 'setup'
  }
}

function spawnSingleSeed(type: string) {
  seeds.value.push({
    id: instanceCounter,
    type: type,
    x: window.innerWidth / 2 - 150 + Math.random() * 300,
    y: window.innerHeight / 2 - 150 + Math.random() * 300,
    rotation: Math.random() * 360,
    instanceId: instanceCounter++,
  })
}

function endGame() {
  clearAllTimers()
  stopAllSfx()

  let isWin = false
  if (role.value === 'tam')
    isWin = seeds.value.filter((s) => s.type !== 'bong' && s.type !== 'xuong').length === 0
  else isWin = seeds.value.filter((s) => s.type !== 'bong' && s.type !== 'xuong').length > 0

  gameState.value = isWin ? 'won' : 'lost'
  if (isWin) playSfx(sfxWin, 'win')
  else playSfx(sfxLose, 'lose')
}

function startPlaying() {
  gameState.value = 'playing'
  seeds.value = []
  scoreLeft.value = 0
  scoreRight.value = 0
  timeLeft.value = 60

  isWindy.value = false
  isCrying.value = false
  showShoe.value = false
  sparrowUses.value = 2
  sparrowCooldown.value = 0
  cryCooldown.value = 0
  sabotageCooldown.value = 0
  shoeCooldown.value = 0
  sabotageActive.value = false

  stopAllAudio()
  if (!isMuted.value) {
    sfxBgm.play().catch(() => {})
    bgmStarted = true
  }

  toastMsg.value =
    role.value === 'tam' ? 'Cố nhặt cho xong để đi trẩy hội!' : 'Làm khó con Tấm ngay!'
  for (let i = 0; i < 35; i++)
    spawnSingleSeed(Math.random() > 0.5 ? currentMix.value.left : currentMix.value.right)

  if (timerInterval) clearInterval(timerInterval)
  timerInterval = setInterval(() => {
    if (!isCrying.value) timeLeft.value--
    if (timeLeft.value <= 0) endGame()
  }, 1000)

  if (role.value === 'tam') {
    if (windInterval) clearInterval(windInterval)
    if (bongInterval) clearInterval(bongInterval)
    if (digheAIsabotage) clearInterval(digheAIsabotage)

    windInterval = setInterval(() => {
      if (Math.random() < 0.2) triggerWind()
    }, 12000)
    bongInterval = setInterval(() => {
      if (Math.random() < 0.4) spawnSingleSeed('bong')
    }, 10000)

    digheAIsabotage = setInterval(() => {
      showToast('😈 Dì ghẻ lén gạt đũa phá mâm!')
      for (let i = 0; i < 3; i++)
        spawnSingleSeed(Math.random() > 0.5 ? currentMix.value.left : currentMix.value.right)
      seeds.value.forEach((s) => {
        if (Math.random() > 0.4) {
          s.x = window.innerWidth / 2 - 200 + Math.random() * 400
          s.y = window.innerHeight / 2 - 200 + Math.random() * 400
        }
      })
    }, 12000)
  } else if (role.value === 'dighe') {
    if (botTimeout) clearTimeout(botTimeout)
    if (bongInterval) clearInterval(bongInterval)
    runBotCycle()
    bongInterval = setInterval(() => {
      if (Math.random() < 0.4) spawnSingleSeed('bong')
    }, 10000)
  }
}

// --- LOGIC TƯƠNG TÁC HẠT ---
function handleSeedInteract(e: MouseEvent | TouchEvent, seed: Seed) {
  if (gameState.value !== 'playing') return

  if (role.value === 'tam') {
    if (isCrying.value) return
    updateMouse(e)
    isGrabbing.value = true
    draggingSeed.value = seed
    offset.x = mouseX.value - seed.x
    offset.y = mouseY.value - seed.y
  } else if (role.value === 'dighe') {
    if (seed.type === 'bong') {
      seed.type = 'xuong'
      showToast('😈 Khà khà! Đã biến Bống thành Xương!')
    }
  }
}

function onMove(e: MouseEvent | TouchEvent) {
  updateMouse(e)
  if (!draggingSeed.value) return
  draggingSeed.value.x = mouseX.value - offset.x
  draggingSeed.value.y = mouseY.value - offset.y
}

function endMove() {
  isGrabbing.value = false
  if (!draggingSeed.value) return

  const current = draggingSeed.value
  const mix = currentMix.value
  let isSorted = false

  if (current.x < 300) {
    if (current.type === 'bong') {
      timeLeft.value += 3
      showToast('🐟 Cá Bống: Thưởng 3s!')
    } else if (current.type === mix.left) scoreLeft.value++
    else if (current.type === 'xuong') {
      timeLeft.value -= 5
      showToast('🦴 Xương Bống: Bị trừ 5s!')
    } else {
      timeLeft.value = Math.max(0, timeLeft.value - 3)
      showToast('Phạt 3s: Gắp sai rổ!')
    }
    isSorted = true
  } else if (current.x > window.innerWidth - 300) {
    if (current.type === 'bong') {
      timeLeft.value += 3
      showToast('🐟 Cá Bống: Thưởng 3s!')
    } else if (current.type === mix.right) scoreRight.value++
    else if (current.type === 'xuong') {
      timeLeft.value -= 5
      showToast('🦴 Xương Bống: Bị trừ 5s!')
    } else {
      timeLeft.value = Math.max(0, timeLeft.value - 3)
      showToast('Phạt 3s: Hỏng hết đồ!')
    }
    isSorted = true
  }

  if (isSorted) {
    seeds.value = seeds.value.filter((s) => s.instanceId !== current.instanceId)
    if (seeds.value.filter((s) => s.type !== 'bong' && s.type !== 'xuong').length === 0) endGame()
  }
  draggingSeed.value = null
}

// --- KỸ NĂNG CỦA TẤM ---
function triggerWind() {
  showToast('🌪️ GIÓ LỚN THỔI BAY RỔ!!!')
  isWindy.value = true
  playSfx(sfxWind, 'wind')

  setTimeout(() => {
    isWindy.value = false
  }, 2000)
  for (let i = 0; i < 3; i++) {
    if (scoreLeft.value > 0) {
      scoreLeft.value--
      spawnSingleSeed(currentMix.value.left)
    }
    if (scoreRight.value > 0) {
      scoreRight.value--
      spawnSingleSeed(currentMix.value.right)
    }
  }
}

function callSparrow() {
  if (sparrowCooldown.value > 0 || sparrowUses.value <= 0) return
  sparrowUses.value--
  sparrowCooldown.value = 15
  showToast('🐦 Chim sẻ: Để đó cho trẫm!')
  playSfx(sfxSparrow, 'sparrow')

  for (let i = 0; i < 5; i++) {
    const validSeeds = seeds.value.filter(
      (s) => s.type === currentMix.value.left || s.type === currentMix.value.right,
    )
    if (validSeeds.length > 0) {
      const removed = validSeeds[0]
      if (removed) {
        seeds.value = seeds.value.filter((s) => s.instanceId !== removed.instanceId)
        if (removed.type === currentMix.value.left) scoreLeft.value++
        else scoreRight.value++
      }
    }
  }
  if (seeds.value.filter((s) => s.type !== 'bong' && s.type !== 'xuong').length === 0) endGame()

  if (sparrowCdInterval) clearInterval(sparrowCdInterval)
  sparrowCdInterval = setInterval(() => {
    sparrowCooldown.value--
    if (sparrowCooldown.value <= 0 && sparrowCdInterval) clearInterval(sparrowCdInterval)
  }, 1000)
}

function cryToBuddha() {
  if (cryCooldown.value > 0) return
  isCrying.value = true
  cryCooldown.value = 25
  showToast('😭 Đang khóc... (Ngừng đếm thời gian)')
  playSfx(sfxCry, 'cry')

  setTimeout(() => {
    isCrying.value = false
    showToast('✨ Bụt giúp lọc 5 hạt!')
    for (let i = 0; i < 5; i++) {
      const validSeeds = seeds.value.filter(
        (s) => s.type === currentMix.value.left || s.type === currentMix.value.right,
      )
      if (validSeeds.length > 0) {
        const removed = validSeeds[0]
        if (removed) {
          seeds.value = seeds.value.filter((s) => s.instanceId !== removed.instanceId)
          if (removed.type === currentMix.value.left) scoreLeft.value++
          else scoreRight.value++
        }
      }
    }
    if (seeds.value.filter((s) => s.type !== 'bong' && s.type !== 'xuong').length === 0) endGame()
  }, 3000)

  if (cryCdInterval) clearInterval(cryCdInterval)
  cryCdInterval = setInterval(() => {
    cryCooldown.value--
    if (cryCooldown.value <= 0 && cryCdInterval) clearInterval(cryCdInterval)
  }, 1000)
}

// --- KỸ NĂNG CỦA DÌ GHẺ ---
function dropShoe() {
  if (shoeCooldown.value > 0) return
  showShoe.value = true
  shoeCooldown.value = 15
  showToast('🥿 Dì Ghẻ ném hài che mâm!')
  // Note: Không có file thud.mp3 nên bạn có thể dùng tạm tiếng gió hoặc bỏ qua.
  setTimeout(() => {
    showShoe.value = false
  }, 3000)

  if (shoeCdInterval) clearInterval(shoeCdInterval)
  shoeCdInterval = setInterval(() => {
    shoeCooldown.value--
    if (shoeCooldown.value <= 0 && shoeCdInterval) clearInterval(shoeCdInterval)
  }, 1000)
}

function initiateSabotage(type: 'wind' | 'add') {
  if (sabotageCooldown.value > 0) return
  sabotageActive.value = true
  sabotageType.value = type

  mgTargetPos.value = 15 + Math.random() * 70
  mgCursorPos.value = 0
  mgDirection = 1

  function animateMinigame() {
    mgCursorPos.value += mgDirection * mgSpeed
    if (mgCursorPos.value >= 100) {
      mgCursorPos.value = 100
      mgDirection = -1
    } else if (mgCursorPos.value <= 0) {
      mgCursorPos.value = 0
      mgDirection = 1
    }
    minigameRaf = requestAnimationFrame(animateMinigame)
  }
  minigameRaf = requestAnimationFrame(animateMinigame)
}

function hitMinigame() {
  if (minigameRaf) cancelAnimationFrame(minigameRaf)
  sabotageActive.value = false

  const hitMin = mgTargetPos.value - mgTargetWidth.value / 2
  const hitMax = mgTargetPos.value + mgTargetWidth.value / 2

  if (mgCursorPos.value >= hitMin && mgCursorPos.value <= hitMax) {
    executeSabotage(sabotageType.value)
  } else {
    showToast('❌ MISS RỒI! Bấm trượt rồi Dì Ghẻ ơi!')
    startSabotageCooldown()
  }
}

function executeSabotage(type: 'wind' | 'add') {
  playSfx(sfxWind, 'wind')

  if (type === 'wind') {
    showToast('🌪️ Dì Ghẻ đã gọi Gió Cuốn!')
    seeds.value.forEach((s) => {
      s.x = window.innerWidth / 2 - 150 + Math.random() * 300
      s.y = window.innerHeight / 2 - 150 + Math.random() * 300
    })
  } else {
    showToast('😈 Dì Ghẻ: Trộn thêm nguyên liệu nè!')
    for (let i = 0; i < 8; i++)
      spawnSingleSeed(Math.random() > 0.5 ? currentMix.value.left : currentMix.value.right)
  }
  startSabotageCooldown()
}

function startSabotageCooldown() {
  sabotageCooldown.value = 8
  const cdInterval = setInterval(() => {
    sabotageCooldown.value--
    if (sabotageCooldown.value <= 0) clearInterval(cdInterval)
  }, 1000)
}

// --- LOGIC BOT TẤM ---
const delay = (ms: number) =>
  new Promise((res) => {
    botTimeout = setTimeout(res, ms)
  })

async function runBotCycle() {
  if (gameState.value !== 'playing' || seeds.value.length === 0) return

  const validSeeds = seeds.value.filter(
    (s) => s.type === currentMix.value.left || s.type === currentMix.value.right,
  )
  if (validSeeds.length === 0) {
    endGame()
    return
  }

  const targetIndex = Math.floor(Math.random() * validSeeds.length)
  const target = validSeeds[targetIndex]
  if (!target) {
    runBotCycle()
    return
  }

  botX.value = target.x
  botY.value = target.y
  await delay(600)

  if (!seeds.value.find((s) => s.instanceId === target.instanceId)) {
    runBotCycle()
    return
  }
  botGrabbing.value = true
  target.isBotTarget = true
  await delay(200)

  if (target.type === currentMix.value.left) botX.value = 150
  else botX.value = window.innerWidth - 150
  botY.value = window.innerHeight / 2

  target.x = botX.value
  target.y = botY.value
  await delay(600)

  botGrabbing.value = false
  const actualIndex = seeds.value.findIndex((s) => s.instanceId === target.instanceId)
  if (actualIndex > -1) {
    seeds.value.splice(actualIndex, 1)
    if (target.type === currentMix.value.left) scoreLeft.value++
    else scoreRight.value++
  }

  if (
    seeds.value.filter((s) => s.type !== 'bong' && s.type !== 'xuong').length > 0 &&
    gameState.value === 'playing'
  )
    setTimeout(runBotCycle, 200)
  else endGame()
}

onMounted(() => {
  window.addEventListener('mousemove', updateMouse)
  // Gắn sự kiện bật nhạc khi click lần đầu trong game
  window.addEventListener('click', initBgm)
})
onUnmounted(() => {
  quitToMainHome()
  window.removeEventListener('mousemove', updateMouse)
  // FIX TẠI ĐÂY: Gỡ bỏ sự kiện click khi rời game, đảm bảo ra ngoài Web click không bị kêu nhạc nữa!
  window.removeEventListener('click', initBgm)
})
</script>

<template>
  <div
    class="alchemy-container no-select"
    :class="{ 'hide-native-cursor': role === 'tam' }"
    @mousemove="onMove"
    @mouseup="endMove"
    @touchmove="onMove"
    @touchend="endMove"
  >
    <div
      v-if="role === 'tam' && gameState === 'playing' && !isCrying"
      class="chopsticks player-chopsticks"
      :style="{ left: mouseX + 'px', top: mouseY + 'px' }"
      :class="{ grabbing: isGrabbing }"
    >
      <div class="crosshair"></div>
      <div class="stick left-stick"></div>
      <div class="stick right-stick"></div>
    </div>

    <div
      v-if="role === 'dighe' && gameState === 'playing'"
      class="chopsticks bot-chopsticks"
      :style="{ left: botX + 'px', top: botY + 'px' }"
      :class="{ grabbing: botGrabbing }"
    >
      <div class="crosshair"></div>
      <div class="stick left-stick"></div>
      <div class="stick right-stick"></div>
      <div class="bot-label">TẤM (BOT)</div>
    </div>

    <div class="top-nav-bar">
      <button v-if="gameState === 'select'" @click="quitToMainHome()" class="btn-ui">
        TRANG CHỦ WEB
      </button>
      <button v-else @click="goHome()" class="btn-ui">VỀ SẢNH GAME</button>

      <button
        v-if="gameState === 'select'"
        @click="showGuide = true"
        class="btn-ui"
        style="margin-left: auto; margin-right: 15px"
      >
        HƯỚNG DẪN
      </button>

      <button
        @click="toggleMute"
        class="btn-ui audio-btn"
        :style="{ marginLeft: gameState !== 'select' ? 'auto' : '0' }"
      >
        {{ isMuted ? '🔇 TẮT ÂM' : '🔊 BẬT ÂM' }}
      </button>
    </div>

    <div v-if="showGuide" class="overlay guide-overlay">
      <div class="modal guide-modal scrollbar-hidden">
        <h2 class="title">📖 LUẬT CHƠI TẤM CÁM</h2>
        <div class="guide-content">
          <h3>👧 VAI TẤM (NGƯỜI LỌC)</h3>
          <ul>
            <li>
              <b>Nhiệm vụ:</b> Dùng đũa gắp đúng loại nguyên liệu vào 2 rổ. Gắp sạch trước khi hết
              giờ để thắng!
            </li>
            <li>
              <b>Bẫy/Thưởng:</b> Gắp trúng Cá Bống 🐟 <b>(+3s)</b>. Gắp nhầm Xương Bống 🦴
              <b>(-5s)</b>. Gắp sai rổ <b>(-3s)</b>.
            </li>
            <li>
              <b>Kỹ năng:</b>
              <ul>
                <li>🐦 <b>Gọi Sẻ (2 Lượt):</b> Gọi chim sẻ bay xuống nhặt nhanh giúp 5 hạt.</li>
                <li>😭 <b>Khóc Tu Tu:</b> Đóng băng thời gian 3s để Bụt hiện ra lọc hộ 5 hạt.</li>
              </ul>
            </li>
          </ul>
          <h3>😈 VAI DÌ GHẺ (KẺ PHÁ BĨNH)</h3>
          <ul>
            <li><b>Nhiệm vụ:</b> Phá rối không cho Tấm (Bot) nhặt xong hạt trước khi hết giờ.</li>
            <li>
              <b>Cơ chế Minigame:</b> Ấn kỹ năng sẽ mở thanh chạy Audition. Căn vạch đỏ vào vùng
              <b>XANH LÁ</b> và ấn Dừng Lại. Bấm trượt sẽ bị xịt kỹ năng.
            </li>
            <li>
              <b>Kỹ năng:</b>
              <ul>
                <li>🌪️ <b>Gọi Gió:</b> Thổi đảo lộn tung tóe các hạt đang nằm trên mâm.</li>
                <li>😈 <b>Đổ Hạt:</b> Trộn thêm hạt mới vào mâm.</li>
                <li>🥿 <b>Rớt Hài:</b> Ném chiếc hài to đùng che khuất màn hình của Tấm.</li>
              </ul>
            </li>
            <li>
              <b>Bẫy Bống:</b> Nhanh tay click vào Cá Bống 🐟 biến nó thành Xương Bống 🦴 để dụ Tấm
              gắp bị phạt!
            </li>
          </ul>
        </div>
        <button
          @click="showGuide = false"
          class="btn-spam"
          style="padding: 15px; margin-top: 20px; font-size: 1.2rem"
        >
          ĐÃ HIỂU!
        </button>
      </div>
    </div>

    <div v-if="gameState === 'select'" class="overlay">
      <div class="modal">
        <h1 class="title">TẤM CÁM: ĐẠI CHIẾN</h1>
        <p>Chọn số phận của bạn:</p>
        <div class="role-grid">
          <button @click="startGame('tam')" class="btn-tam">
            <h3>ĐÓNG VAI TẤM 😭</h3>
            <p>Tự tay gắp phân loại nguyên liệu thật nhanh trước khi hết giờ!</p>
          </button>
          <button @click="startGame('dighe')" class="btn-dighe">
            <h3>LÀM DÌ GHẺ 😈</h3>
            <p>Tìm mọi cách không cho con Tấm đi hội.</p>
          </button>
        </div>
      </div>
    </div>

    <div v-if="gameState === 'setup'" class="overlay">
      <div class="modal">
        <h2 class="title">TRỘN NGUYÊN LIỆU</h2>
        <div class="mix-options">
          <button
            v-for="mix in mixingOptions"
            :key="mix.id"
            class="btn-mix"
            :class="{ active: currentMix.id === mix.id }"
            @click="currentMix = mix"
          >
            {{ mix.name }}
          </button>
        </div>
        <button @click="startPlaying" class="btn-evil-start">BẮT ĐẦU HÀNH HẠ</button>
      </div>
    </div>

    <div v-if="sabotageActive" class="overlay minigame-overlay">
      <div class="minigame-box">
        <h2>🎯 CĂN CHUẨN ĐỂ PHÁ! 🎯</h2>
        <p style="color: #fbbf24; margin-bottom: 10px">
          Bấm DỪNG LẠI khi vạch đỏ nằm trong Vùng Xanh
        </p>

        <div class="audition-bar">
          <div
            class="target-zone"
            :style="{
              left: `calc(${mgTargetPos}% - ${mgTargetWidth / 2}%)`,
              width: `${mgTargetWidth}%`,
            }"
          ></div>
          <div class="cursor-line" :style="{ left: `${mgCursorPos}%` }"></div>
        </div>

        <button @click="hitMinigame" class="btn-spam">BẤM DỪNG!</button>
      </div>
    </div>

    <div
      v-if="gameState === 'playing' || gameState === 'won' || gameState === 'lost'"
      class="game-area"
    >
      <div class="header">
        <div class="role-badge">VAI: {{ role === 'tam' ? 'TẤM' : 'DÌ GHẺ' }}</div>
        <div class="timer" :class="{ danger: timeLeft <= 15 }">
          <span v-if="isCrying">❄️ ĐÓNG BĂNG</span>
          <span v-else>⏳ {{ timeLeft }}s</span>
        </div>
      </div>

      <Transition name="bounce"
        ><div v-if="toastMsg" class="toast-msg">{{ toastMsg }}</div></Transition
      >

      <div class="skills-panel">
        <template v-if="role === 'tam'">
          <button
            @click="callSparrow"
            class="btn-skill"
            :disabled="sparrowCooldown > 0 || sparrowUses <= 0"
          >
            🐦 Sẻ ({{ sparrowUses }})
            <span v-if="sparrowCooldown > 0">[{{ sparrowCooldown }}s]</span>
          </button>
          <button @click="cryToBuddha" class="btn-skill" :disabled="cryCooldown > 0 || isCrying">
            😭 Khóc Tu Tu <span v-if="cryCooldown > 0">[{{ cryCooldown }}s]</span>
          </button>
        </template>

        <template v-if="role === 'dighe'">
          <button
            @click="initiateSabotage('wind')"
            class="btn-skill evil"
            :disabled="sabotageCooldown > 0"
          >
            🌪️ Gọi Gió <span v-if="sabotageCooldown > 0">[{{ sabotageCooldown }}s]</span>
          </button>
          <button
            @click="initiateSabotage('add')"
            class="btn-skill evil"
            :disabled="sabotageCooldown > 0"
          >
            😈 Đổ Hạt <span v-if="sabotageCooldown > 0">[{{ sabotageCooldown }}s]</span>
          </button>
          <button @click="dropShoe" class="btn-skill evil" :disabled="shoeCooldown > 0">
            🥿 Rớt Hài <span v-if="shoeCooldown > 0">[{{ shoeCooldown }}s]</span>
          </button>
        </template>
      </div>

      <Transition name="fade">
        <div v-if="showShoe" class="giant-shoe-overlay"><div class="giant-shoe">🥿</div></div>
      </Transition>

      <div class="basket left-basket" :class="{ 'wind-shake': isWindy }">
        <div class="basket-label">{{ currentMix.left.toUpperCase() }}</div>
        <div class="count">{{ scoreLeft }}</div>
      </div>

      <div class="basket right-basket" :class="{ 'wind-shake': isWindy }">
        <div class="basket-label">{{ currentMix.right.toUpperCase() }}</div>
        <div class="count">{{ scoreRight }}</div>
      </div>

      <div class="workspace">
        <div class="mam-dong"></div>
        <div
          v-for="seed in seeds"
          :key="seed.instanceId"
          class="seed-shape"
          :class="[seed.type, { 'bot-target': seed.isBotTarget }]"
          :style="{
            left: seed.x + 'px',
            top: seed.y + 'px',
            transform:
              draggingSeed?.instanceId === seed.instanceId
                ? 'translate(-50%, -50%) scale(1.5)'
                : `translate(-50%, -50%) rotate(${seed.rotation}deg)`,
          }"
          @mousedown.stop="handleSeedInteract($event, seed)"
          @touchstart.prevent="handleSeedInteract($event, seed)"
        >
          <span v-if="seed.type === 'bong'">🐟</span>
          <span v-if="seed.type === 'xuong'">🦴</span>
        </div>
      </div>
    </div>

    <div v-if="gameState === 'won' || gameState === 'lost'" class="overlay">
      <div class="modal result-card">
        <template v-if="role === 'tam'">
          <h1 v-if="gameState === 'won'" class="win-text">✨ ĐI TRẨY HỘI!</h1>
          <h1 v-else class="lose-text">😭 BỊ Ở NHÀ!</h1>
        </template>
        <template v-else>
          <h1 v-if="gameState === 'won'" class="win-text">😈 KẾ HOẠCH HOÀN HẢO!</h1>
          <h1 v-else class="lose-text">🤬 TẤM NÓ THOÁT RỒI!</h1>
        </template>
        <button @click="goHome" class="btn-replay">VỀ SẢNH GAME</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hide-native-cursor {
  cursor: none !important;
}
.no-select {
  -webkit-user-select: none;
  user-select: none;
  -webkit-user-drag: none;
}
.scrollbar-hidden::-webkit-scrollbar {
  display: none;
}

.alchemy-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  background: radial-gradient(circle at center, #291002 0%, #000 100%);
  color: #fdf6e3;
  font-family: 'JetBrains Mono', monospace;
  overflow: hidden;
  position: relative;
}

/* TOP NAV BAR & UI BUTTONS */
.top-nav-bar {
  position: absolute;
  top: 20px;
  left: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  z-index: 5000;
  pointer-events: none;
}
.btn-ui {
  background: #451a03;
  border: 2px solid #fbbf24;
  color: #fbbf24;
  padding: 10px 20px;
  border-radius: 12px;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.5);
  pointer-events: auto;
  transition: 0.2s;
}
.btn-ui:hover {
  background: #fbbf24;
  color: #451a03;
}
.audio-btn {
  width: 130px;
  text-align: center;
}

/* SÁCH HƯỚNG DẪN MODAL */
.guide-overlay {
  z-index: 9000 !important;
}
.guide-modal {
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  text-align: left !important;
  padding: 30px;
  background: #1a0f00;
  border: 3px solid #fbbf24;
}
.guide-content h3 {
  color: #fbbf24;
  margin-top: 20px;
  border-bottom: 1px solid #fbbf24;
  padding-bottom: 5px;
}
.guide-content ul {
  padding-left: 20px;
  line-height: 1.6;
  font-size: 1.1rem;
}
.guide-content li {
  margin-bottom: 8px;
}

/* ---- CON TRỎ ĐŨA ---- */
.chopsticks {
  position: fixed;
  width: 24px;
  height: 150px;
  pointer-events: none;
  z-index: 9999;
  transform: translate(-12px, -15px);
  display: flex;
  justify-content: space-between;
}
.bot-chopsticks {
  transition:
    left 0.5s ease-in-out,
    top 0.5s ease-in-out;
}
.player-chopsticks {
  transition: none;
}
.crosshair {
  position: absolute;
  left: 12px;
  top: 15px;
  width: 6px;
  height: 6px;
  background: #ef4444;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.8);
  z-index: 10000;
}
.stick {
  width: 8px;
  height: 100%;
  background: linear-gradient(to right, #d2b48c, #8b4513, #5c4033);
  border-radius: 4px;
  box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.6);
  transform-origin: 50% 15px;
  transition: transform 0.1s ease;
}
.left-stick {
  transform: rotate(10deg);
}
.right-stick {
  transform: rotate(-10deg);
}
.chopsticks.grabbing .left-stick {
  transform: rotate(2deg);
}
.chopsticks.grabbing .right-stick {
  transform: rotate(-2deg);
}
.bot-label {
  position: absolute;
  bottom: -20px;
  left: -20px;
  background: rgba(0, 0, 0, 0.7);
  color: #22d3ee;
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: bold;
  white-space: nowrap;
}

/* ---- HÌNH HẠT THỰC TẾ & TĂNG HITBOX ---- */
.seed-shape {
  position: absolute;
  pointer-events: auto;
  box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.6);
  z-index: 10;
  transition:
    top 0.8s ease-in-out,
    left 0.8s ease-in-out;
  cursor: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}
.seed-shape::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 35px;
  height: 35px;
  background: transparent;
  border-radius: 50%;
}
.seed-shape:active {
  z-index: 100;
  filter: brightness(1.5);
  transition: none;
}
.seed-shape.gao {
  width: 12px;
  height: 28px;
  background: #f8fafc;
  border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
  box-shadow:
    inset -2px -2px 4px rgba(0, 0, 0, 0.1),
    2px 2px 4px rgba(0, 0, 0, 0.4);
}
.seed-shape.daudo {
  width: 18px;
  height: 18px;
  background: #7f1d1d;
  border-radius: 50%;
  box-shadow:
    inset -2px -2px 5px rgba(0, 0, 0, 0.4),
    2px 2px 3px rgba(0, 0, 0, 0.5);
}
.seed-shape.dauxanh {
  width: 16px;
  height: 16px;
  background: #166534;
  border-radius: 50%;
  box-shadow:
    inset -2px -2px 5px rgba(0, 0, 0, 0.3),
    2px 2px 3px rgba(0, 0, 0, 0.5);
}
.seed-shape.cat {
  width: 5px;
  height: 5px;
  background: #eab308;
  border-radius: 50%;
}
.seed-shape.bong {
  background: transparent;
  box-shadow: none;
  font-size: 2rem;
  filter: drop-shadow(0 0 5px #fde047);
  animation: float 2s infinite ease-in-out;
}
.seed-shape.xuong {
  background: transparent;
  box-shadow: none;
  font-size: 1.5rem;
  filter: grayscale(1);
}

.bot-target {
  filter: drop-shadow(0 0 5px #22d3ee);
  transform: scale(1.5) translateY(-20px) !important;
  opacity: 0.5;
  transition: all 0.3s;
}

/* KỸ NĂNG: RỚT HÀI */
.giant-shoe-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1200;
  pointer-events: none;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
}
.giant-shoe {
  font-size: 15rem;
  filter: drop-shadow(0 20px 20px rgba(0, 0, 0, 0.8));
  animation: fallDown 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

/* UI CHUNG */
.header {
  position: absolute;
  top: 70px;
  right: 20px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  z-index: 100;
  font-size: 1.2rem;
  font-weight: bold;
  pointer-events: none;
}
.role-badge {
  background: #1e3a8a;
  padding: 5px 15px;
  border-radius: 8px;
  margin-bottom: 10px;
}
.timer {
  background: rgba(0, 0, 0, 0.5);
  padding: 5px 15px;
  border-radius: 20px;
  border: 2px solid #fbbf24;
}
.timer.danger {
  color: #ef4444;
  border-color: #ef4444;
  animation: pulse 0.5s infinite;
}

.skills-panel {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 15px;
  z-index: 100;
  pointer-events: auto;
}
.btn-skill {
  background: #1e40af;
  border: 2px solid #60a5fa;
  color: white;
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: bold;
  font-size: 1.1rem;
  cursor: pointer;
  pointer-events: auto;
}
.btn-skill.evil {
  background: #7f1d1d;
  border-color: #fca5a5;
}
.btn-skill:disabled {
  filter: grayscale(1);
  opacity: 0.6;
  cursor: not-allowed;
}

.basket {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 200px;
  height: 200px;
  border: 6px dashed #92400e;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
}
.left-basket {
  left: 40px;
}
.right-basket {
  right: 40px;
}
.basket-label {
  font-weight: 900;
  color: #fbbf24;
  margin-bottom: 5px;
  font-size: 1.2rem;
}
.count {
  font-size: 3rem;
  font-weight: 900;
}
.wind-shake {
  animation: shake 0.5s infinite;
  border-color: #fbbf24;
  background: rgba(251, 191, 36, 0.2);
}

.workspace {
  flex: 1;
  position: relative;
}
.mam-dong {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 500px;
  height: 500px;
  border-radius: 50%;
  border: 8px solid #b45309;
  background: radial-gradient(circle, #78350f 0%, #451a03 100%);
  box-shadow: 0 10px 50px rgba(0, 0, 0, 0.8);
  pointer-events: none;
}

/* CSS CHO MINIGAME AUDITION */
.minigame-overlay {
  z-index: 3000;
  pointer-events: auto;
}
.minigame-box {
  background: #1a0f00;
  border: 3px solid #ef4444;
  padding: 40px;
  border-radius: 20px;
  text-align: center;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.9);
}
.audition-bar {
  position: relative;
  width: 400px;
  height: 40px;
  background: #3f3f46;
  border: 3px solid #fff;
  border-radius: 20px;
  overflow: hidden;
  margin: 30px 0;
}
.target-zone {
  position: absolute;
  height: 100%;
  background: rgba(34, 197, 94, 0.8);
  border-left: 2px solid #fff;
  border-right: 2px solid #fff;
}
.cursor-line {
  position: absolute;
  height: 100%;
  width: 6px;
  background: #ef4444;
  box-shadow:
    0 0 15px #ef4444,
    0 0 5px #fff;
  transform: translateX(-50%);
  z-index: 10;
}
.btn-spam {
  background: #ef4444;
  color: white;
  padding: 20px 50px;
  border-radius: 15px;
  font-size: 1.5rem;
  font-weight: 900;
  border: none;
  cursor: pointer;
  box-shadow: 0 8px 0 #991b1b;
  pointer-events: auto;
  width: 100%;
}
.btn-spam:active {
  transform: translateY(8px);
  box-shadow: 0 0 0;
}

/* MODALS */
.overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(5px);
}
.modal {
  background: #291002;
  border: 2px solid #d97706;
  padding: 40px;
  border-radius: 20px;
  text-align: center;
  pointer-events: auto;
}
.title {
  color: #fbbf24;
  margin-bottom: 20px;
  text-transform: uppercase;
  font-size: 1.8rem;
}
.role-grid {
  display: flex;
  gap: 20px;
  margin-top: 20px;
}
.btn-tam,
.btn-dighe {
  flex: 1;
  padding: 20px;
  border-radius: 15px;
  border: 2px solid;
  background: #1a0f00;
  color: white;
  cursor: pointer;
  transition: 0.2s;
  pointer-events: auto;
}
.btn-tam {
  border-color: #3b82f6;
}
.btn-dighe {
  border-color: #ef4444;
}
.mix-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}
.btn-mix {
  padding: 15px;
  border-radius: 10px;
  background: #3f3f46;
  color: white;
  border: none;
  font-weight: bold;
  cursor: pointer;
  pointer-events: auto;
}
.btn-mix.active {
  background: #d97706;
  border: 2px solid white;
}
.btn-evil-start,
.btn-replay {
  background: #ef4444;
  color: white;
  padding: 15px 30px;
  border-radius: 12px;
  font-weight: 900;
  font-size: 1.2rem;
  border: none;
  width: 100%;
  cursor: pointer;
  pointer-events: auto;
}
.btn-replay {
  background: #d97706;
}
.toast-msg {
  position: absolute;
  top: 100px;
  left: 50%;
  transform: translateX(-50%);
  background: #fff;
  color: #000;
  padding: 15px 25px;
  border-radius: 12px;
  font-weight: bold;
  z-index: 1500;
  pointer-events: none;
  border: 3px solid #d97706;
}

/* ANIMATIONS */
@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}
@keyframes shake {
  0% {
    transform: translateY(-50%) rotate(0deg) scale(1.05);
  }
  25% {
    transform: translateY(-50%) rotate(-5deg) scale(1.05);
  }
  50% {
    transform: translateY(-50%) rotate(0deg) scale(1.05);
  }
  75% {
    transform: translateY(-50%) rotate(5deg) scale(1.05);
  }
  100% {
    transform: translateY(-50%) rotate(0deg) scale(1.05);
  }
}
@keyframes fallDown {
  0% {
    transform: translateY(-200%) rotate(20deg);
    opacity: 0;
  }
  100% {
    transform: translateY(0) rotate(0deg);
    opacity: 1;
  }
}
@keyframes float {
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0px);
  }
}
.bounce-enter-active {
  animation: bounce-in 0.3s;
}
.bounce-leave-active {
  animation: bounce-in 0.3s reverse;
}
@keyframes bounce-in {
  0% {
    transform: translate(-50%, -20px) scale(0);
  }
  50% {
    transform: translate(-50%, 10px) scale(1.1);
  }
  100% {
    transform: translate(-50%, 0) scale(1);
  }
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
