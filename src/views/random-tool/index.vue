<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useLocalStorage } from '@vueuse/core'

// ── Tabs ──────────────────────────────────────────────────────────────────
type TabId = 'number' | 'wheel' | 'race' | 'bracket' | 'coin' | 'dice' | 'teams'
const activeTab = ref<TabId>('number')

const tabNavRef = ref<HTMLElement | null>(null)
const tabNavCanScrollLeft = ref(false)
const tabNavCanScrollRight = ref(false)

function updateTabNavScroll() {
  const el = tabNavRef.value
  if (!el) return
  tabNavCanScrollLeft.value = el.scrollLeft > 2
  tabNavCanScrollRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 2
}

function scrollTabNav(direction: 'left' | 'right') {
  const el = tabNavRef.value
  if (!el) return
  el.scrollBy({ left: direction === 'left' ? -160 : 160, behavior: 'smooth' })
}

function scrollActiveTabIntoView() {
  const el = tabNavRef.value
  if (!el) return
  const active = el.querySelector<HTMLElement>('[data-active="true"]')
  if (active) active.scrollIntoView({ inline: 'nearest', behavior: 'smooth' })
}

function selectTab(id: TabId) {
  activeTab.value = id
  scrollActiveTabIntoView()
}

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'number', label: 'Số ngẫu nhiên', icon: 'lucide:dice-5' },
  { id: 'wheel', label: 'Hộp ngẫu nhiên', icon: 'lucide:gift' },
  { id: 'race', label: 'Đua về đích', icon: 'lucide:flag' },
  { id: 'bracket', label: 'Bốc thăm', icon: 'lucide:trophy' },
  { id: 'coin', label: 'Đúng / Sai', icon: 'lucide:circle-dot' },
  { id: 'dice', label: 'Xúc xắc', icon: 'lucide:box' },
  { id: 'teams', label: 'Chia đội', icon: 'lucide:users' },
]

// ── TAB 1: Random Number ──────────────────────────────────────────────────
const numMin = useLocalStorage<number>('rt-num-min', 1)
const numMax = useLocalStorage<number>('rt-num-max', 100)
const numResult = ref<number | null>(null)
const numAnimating = ref(false)
const numBounce = ref(false)
const numHistory = useLocalStorage<number[]>('rt-num-history', [])

function rollNumber() {
  if (numAnimating.value) return
  const min = Math.min(Number(numMin.value), Number(numMax.value))
  const max = Math.max(Number(numMin.value), Number(numMax.value))
  numAnimating.value = true
  let ticks = 0
  const totalTicks = 22

  function tick() {
    numResult.value = Math.floor(Math.random() * (max - min + 1)) + min
    ticks++
    if (ticks < totalTicks) {
      const delay = 30 + Math.pow(ticks / totalTicks, 2) * 250
      setTimeout(tick, delay)
    } else {
      numAnimating.value = false
      numBounce.value = true
      setTimeout(() => {
        numBounce.value = false
      }, 600)
      if (numResult.value !== null) {
        numHistory.value = [numResult.value, ...numHistory.value.slice(0, 9)]
      }
    }
  }

  tick()
}

function clearNumHistory() {
  numHistory.value = []
}

// ── TAB 2: Spin Wheel ─────────────────────────────────────────────────────
const wheelInputText = useLocalStorage(
  'rt-wheel-items',
  'Phần thưởng 1\nPhần thưởng 2\nPhần thưởng 3\nPhần thưởng 4\nPhần thưởng 5\nPhần thưởng 6',
)
const wheelResult = ref('')
const wheelSpinning = ref(false)

const wheelItems = computed(() =>
  wheelInputText.value
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean),
)

// ── Box open mode ──────────────────────────────────────────────────────────
type WheelMode = 'manual' | 'auto'
const wheelMode = ref<WheelMode>('auto')
const wheelBoxOrder = ref<string[]>([])
const wheelOpenedIndices = ref<number[]>([])
const wheelRevealingIdx = ref<number | null>(null)
const wheelScanningIdx = ref<number | null>(null) // highlight chạy qua hộp khi auto

const BOX_STYLES = [
  {
    closed: 'border-accent-coral/30 hover:border-accent-coral',
    opened: 'border-accent-coral bg-accent-coral/10',
    icon: 'text-accent-coral',
    text: 'text-accent-coral',
  },
  {
    closed: 'border-accent-amber/30 hover:border-accent-amber',
    opened: 'border-accent-amber bg-accent-amber/10',
    icon: 'text-accent-amber',
    text: 'text-accent-amber',
  },
  {
    closed: 'border-accent-sky/30 hover:border-accent-sky',
    opened: 'border-accent-sky bg-accent-sky/10',
    icon: 'text-accent-sky',
    text: 'text-accent-sky',
  },
] as const

function shuffleBoxes() {
  const arr = [...wheelItems.value]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j]!, arr[i]!]
  }
  wheelBoxOrder.value = arr
  wheelOpenedIndices.value = []
  wheelResult.value = ''
}

watch(
  () => wheelItems.value.length,
  () => shuffleBoxes(),
  { immediate: true },
)

function openBox(idx: number, alreadyLocked = false) {
  if (!alreadyLocked && (wheelSpinning.value || wheelOpenedIndices.value.includes(idx))) return
  if (!alreadyLocked) wheelSpinning.value = true
  wheelRevealingIdx.value = idx
  setTimeout(() => {
    wheelResult.value = wheelBoxOrder.value[idx] ?? ''
    wheelOpenedIndices.value = [...wheelOpenedIndices.value, idx]
    wheelRevealingIdx.value = null
    wheelSpinning.value = false
  }, 700)
}

function autoOpenBox() {
  if (wheelSpinning.value) return
  const unopened = wheelBoxOrder.value
    .map((_, i) => i)
    .filter((i) => !wheelOpenedIndices.value.includes(i))
  if (unopened.length === 0) return

  const targetIdx = unopened[Math.floor(Math.random() * unopened.length)]!
  wheelSpinning.value = true
  wheelResult.value = ''

  // Scanning: chạy qua tất cả hộp chưa mở, tăng tốc rồi chậm lại trước khi dừng
  const totalFrames = 28
  const scanSequence: number[] = []
  // Tạo chuỗi scan: nhanh đầu → chậm cuối → dừng ở targetIdx
  for (let f = 0; f < totalFrames; f++) {
    scanSequence.push(unopened[f % unopened.length]!)
  }
  // 5 frame cuối chậm lại và kết thúc ở target
  for (let f = 0; f < 5; f++) scanSequence.push(targetIdx)

  let frame = 0
  function tick() {
    wheelScanningIdx.value = scanSequence[frame] ?? null
    frame++
    if (frame < scanSequence.length) {
      // Delay tăng dần ở cuối (hồi hộp)
      const delay = frame < totalFrames ? 60 + frame * 4 : 180 + (frame - totalFrames) * 80
      setTimeout(tick, delay)
    } else {
      wheelScanningIdx.value = null
      openBox(targetIdx, true)
    }
  }
  tick()
}

function resetBoxes() {
  shuffleBoxes()
}

function setWheelMode(mode: WheelMode) {
  wheelMode.value = mode
}

function handleBoxClick(idx: number) {
  if (wheelMode.value !== 'manual') return
  openBox(idx)
}

function boxClasses(idx: number): string {
  const s = BOX_STYLES[idx % 3]!
  if (wheelOpenedIndices.value.includes(idx)) return `${s.opened} cursor-default`
  if (wheelRevealingIdx.value === idx) return 'border-accent-amber bg-accent-amber/20 scale-110'
  if (wheelScanningIdx.value === idx)
    return 'border-accent-amber bg-accent-amber/15 scale-105 shadow-[0_0_12px_rgba(255,184,48,0.5)]'
  if (wheelMode.value === 'manual' && !wheelSpinning.value)
    return `bg-bg-surface ${s.closed} hover:scale-105 cursor-pointer active:scale-95`
  return `bg-bg-surface ${s.closed} cursor-default opacity-60`
}

function openedBoxIconClass(idx: number): string {
  return BOX_STYLES[idx % 3]!.icon
}

function openedBoxTextClass(idx: number): string {
  return BOX_STYLES[idx % 3]!.text
}

// ── TAB 3: Race ───────────────────────────────────────────────────────────
interface Racer {
  id: number
  name: string
  emoji: string
  progress: number
  duration: number
  rank: number | null
}

const raceInputText = useLocalStorage('rt-race-items', 'Alice\nBob\nCarol\nDave\nEve')
const raceMinDuration = useLocalStorage<number>('rt-race-min-duration', 10)
const RACE_EMOJIS = ['🦆', '🐇', '🐢', '🦊', '🐴', '🦁', '🐊', '🐆', '🦓', '🦒']
const raceState = ref<'idle' | 'racing' | 'finished'>('idle')
const racers = ref<Racer[]>([])
let raceAnimFrame: number | null = null
let raceStartTime = 0
let raceRankCounter = 0

const raceParticipants = computed(() =>
  raceInputText.value
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 10),
)

const raceFinishOrder = computed(() =>
  racers.value.filter((r) => r.rank !== null).sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0)),
)

function startRace() {
  if (raceAnimFrame) cancelAnimationFrame(raceAnimFrame)
  raceRankCounter = 0
  const minMs = Math.max(5, Number(raceMinDuration.value)) * 1000
  racers.value = raceParticipants.value.map((name, i) => ({
    id: i,
    name,
    emoji: RACE_EMOJIS[i % RACE_EMOJIS.length]!,
    progress: 0,
    duration: minMs + Math.random() * 5000,
    rank: null,
  }))
  raceState.value = 'racing'
  raceStartTime = performance.now()

  function frame(now: number) {
    const elapsed = now - raceStartTime
    let allDone = true

    for (let i = 0; i < racers.value.length; i++) {
      const racer = racers.value[i]!
      if (racer.rank !== null) continue
      const progress = Math.min(100, (elapsed / racer.duration) * 100)
      if (progress >= 100) {
        raceRankCounter++
        racer.progress = 100
        racer.rank = raceRankCounter
      } else {
        racer.progress = progress
        allDone = false
      }
    }

    if (!allDone) {
      raceAnimFrame = requestAnimationFrame(frame)
    } else {
      raceState.value = 'finished'
      const entry: RaceHistoryEntry = {
        participants: racers.value
          .filter((r) => r.rank !== null)
          .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
          .map((r) => ({ name: r.name, emoji: r.emoji, rank: r.rank! })),
        date: Date.now(),
      }
      raceHistory.value = [entry, ...raceHistory.value.slice(0, 4)]
    }
  }

  raceAnimFrame = requestAnimationFrame(frame)
}

function resetRace() {
  if (raceAnimFrame) cancelAnimationFrame(raceAnimFrame)
  raceState.value = 'idle'
  racers.value = []
}

interface RaceHistoryEntry {
  participants: { name: string; emoji: string; rank: number }[]
  date: number
}

const raceHistory = useLocalStorage<RaceHistoryEntry[]>('rt-race-history', [])

function clearRaceHistory() {
  raceHistory.value = []
}

// ── TAB 4: Bốc thăm (Single Draw) ────────────────────────────────────────
const bracketInputText = useLocalStorage(
  'rt-bracket-items',
  'Alice\nBob\nCarol\nDave\nEve\nFrank\nGrace\nHenry',
)
const bracketNewItem = ref('')
const bracketParticipants = computed(() =>
  bracketInputText.value
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean),
)
const bracketListExpanded = ref(false)

const drawPool = ref<string[]>([])
const drawnList = ref<string[]>([])
const drawAnimating = ref(false)
const drawCurrentFlash = ref('')
const drawResult = ref('')
const drawShowResult = ref(false)
const drawConfetti = ref(false)
const drawState = ref<'idle' | 'ready' | 'done'>('idle')
const confettiPieces = ref<
  { id: number; x: number; y: number; color: string; delay: number; angle: number }[]
>([])

function addBracketItem() {
  const names = bracketNewItem.value
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
  if (names.length === 0) return
  const existing = new Set(bracketParticipants.value)
  const newNames = names.filter((n) => !existing.has(n))
  if (newNames.length > 0) {
    bracketInputText.value = bracketInputText.value.trim()
      ? bracketInputText.value.trim() + '\n' + newNames.join('\n')
      : newNames.join('\n')
  }
  bracketNewItem.value = ''
}

function removeBracketItem(name: string) {
  bracketInputText.value = bracketParticipants.value.filter((i) => i !== name).join('\n')
}

function startDrawSession() {
  const shuffled = [...bracketParticipants.value]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = shuffled[i]!
    shuffled[i] = shuffled[j]!
    shuffled[j] = tmp
  }
  drawPool.value = shuffled
  drawnList.value = []
  drawResult.value = ''
  drawShowResult.value = false
  drawCurrentFlash.value = ''
  drawConfetti.value = false
  drawState.value = 'ready'
}

function spawnConfetti() {
  const colors = ['#FF6B4A', '#FFB830', '#38BDF8', '#4ADE80', '#C084FC', '#F472B6']
  confettiPieces.value = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    color: colors[Math.floor(Math.random() * colors.length)]!,
    delay: Math.random() * 0.4,
    angle: Math.random() * 360,
  }))
}

function drawNextPerson() {
  if (drawAnimating.value || drawPool.value.length === 0) return
  drawAnimating.value = true
  drawShowResult.value = false
  drawConfetti.value = false
  drawResult.value = ''

  const picked = drawPool.value[0]!
  const allNames = bracketParticipants.value
  let ticks = 0
  const totalTicks = 22

  function tick() {
    drawCurrentFlash.value = allNames[Math.floor(Math.random() * allNames.length)]!
    ticks++
    if (ticks < totalTicks) {
      const delay = 50 + Math.pow(ticks / totalTicks, 2) * 400
      setTimeout(tick, delay)
    } else {
      drawCurrentFlash.value = picked
      drawResult.value = picked
      drawShowResult.value = true
      drawAnimating.value = false
      drawConfetti.value = true
      spawnConfetti()
      drawnList.value = [...drawnList.value, picked]
      drawPool.value = drawPool.value.slice(1)

      if (drawPool.value.length === 0) {
        drawState.value = 'done'
      }

      setTimeout(() => {
        drawConfetti.value = false
      }, 2500)
    }
  }

  tick()
}

function resetDraw() {
  drawState.value = 'idle'
  drawPool.value = []
  drawnList.value = []
  drawResult.value = ''
  drawShowResult.value = false
  drawCurrentFlash.value = ''
  drawConfetti.value = false
  drawAnimating.value = false
  confettiPieces.value = []
}

// ── TAB 5: Coin (Icon) ────────────────────────────────────────────────────
interface CoinIconPreset {
  icon: string
  label: string
}

const COIN_ICON_PRESETS: CoinIconPreset[] = [
  { icon: 'lucide:check-circle-2', label: 'Đúng' },
  { icon: 'lucide:x-circle', label: 'Sai' },
  { icon: 'lucide:thumbs-up', label: 'Có' },
  { icon: 'lucide:thumbs-down', label: 'Không' },
  { icon: 'lucide:sun', label: 'Ngày' },
  { icon: 'lucide:moon', label: 'Đêm' },
  { icon: 'lucide:smile', label: 'Vui' },
  { icon: 'lucide:frown', label: 'Buồn' },
  { icon: 'lucide:heart', label: 'Tim' },
  { icon: 'lucide:heart-crack', label: 'Vỡ tim' },
  { icon: 'lucide:star', label: 'Sao' },
  { icon: 'lucide:zap', label: 'Sấm' },
  { icon: 'lucide:trophy', label: 'Trophy' },
  { icon: 'lucide:crown', label: 'Vương miện' },
  { icon: 'lucide:flame', label: 'Lửa' },
  { icon: 'lucide:shield', label: 'Khiên' },
  { icon: 'lucide:coffee', label: 'Cà phê' },
  { icon: 'lucide:rocket', label: 'Rocket' },
  { icon: 'lucide:bug', label: 'Bug' },
  { icon: 'lucide:gift', label: 'Quà' },
  { icon: 'lucide:gem', label: 'Gem' },
  { icon: 'lucide:skull', label: 'Đầu lâu' },
  { icon: 'lucide:dice-5', label: 'Xúc xắc' },
  { icon: 'lucide:hand', label: 'Tay' },
]

const coinIcon1 = useLocalStorage('rt-coin-icon1', 'lucide:check-circle-2')
const coinIcon2 = useLocalStorage('rt-coin-icon2', 'lucide:x-circle')
const coinPickerFor = ref<'heads' | 'tails' | null>(null)
const coinFlipping = ref(false)
const coinResult = ref<'heads' | 'tails' | null>(null)
const coinRotation = ref(0)

const coinResultIcon = computed(() =>
  coinResult.value === 'heads'
    ? coinIcon1.value
    : coinResult.value === 'tails'
      ? coinIcon2.value
      : '',
)

function getIconLabel(icon: string) {
  return COIN_ICON_PRESETS.find((p) => p.icon === icon)?.label ?? ''
}

function openCoinPicker(face: 'heads' | 'tails') {
  coinPickerFor.value = coinPickerFor.value === face ? null : face
}

function selectCoinIcon(icon: string) {
  if (coinPickerFor.value === 'heads') {
    coinIcon1.value = icon
  } else if (coinPickerFor.value === 'tails') {
    coinIcon2.value = icon
  }
  coinPickerFor.value = null
}

function flipCoin() {
  if (coinFlipping.value) return
  coinFlipping.value = true
  coinResult.value = null

  const isHeads = Math.random() < 0.5
  const result: 'heads' | 'tails' = isHeads ? 'heads' : 'tails'

  const fullSpins = (6 + Math.floor(Math.random() * 4)) * 360
  const targetMod = result === 'heads' ? 0 : 180
  const currentMod = ((coinRotation.value % 360) + 360) % 360
  let extra = targetMod - currentMod
  if (extra <= 0) extra += 360

  coinRotation.value += fullSpins + extra

  setTimeout(() => {
    coinResult.value = result
    coinFlipping.value = false
  }, 1300)
}

// ── TAB 5: Dice ───────────────────────────────────────────────────────────
interface DiceRoll {
  values: number[]
  total: number
}

// pip cell indices (1–9) for each die face in a 3×3 grid
const DICE_PIPS: Record<number, number[]> = {
  1: [5],
  2: [3, 7],
  3: [3, 5, 7],
  4: [1, 3, 7, 9],
  5: [1, 3, 5, 7, 9],
  6: [1, 3, 4, 6, 7, 9],
}

const diceCount = useLocalStorage<number>('rt-dice-count', 2)
const diceValues = ref<number[]>([])
const diceRolling = ref(false)
const diceHistory = useLocalStorage<DiceRoll[]>('rt-dice-history', [])

const diceTotal = computed(() => diceValues.value.reduce((a, b) => a + b, 0))

function rollDice() {
  if (diceRolling.value) return
  const count = Math.max(1, Math.min(6, Number(diceCount.value)))
  diceRolling.value = true
  let ticks = 0
  const totalTicks = 20

  function tick() {
    diceValues.value = Array.from({ length: count }, () => Math.floor(Math.random() * 6) + 1)
    ticks++
    if (ticks < totalTicks) {
      const delay = 40 + Math.pow(ticks / totalTicks, 2) * 180
      setTimeout(tick, delay)
    } else {
      diceRolling.value = false
      const roll = { values: [...diceValues.value], total: diceTotal.value }
      diceHistory.value = [roll, ...diceHistory.value.slice(0, 4)]
    }
  }

  tick()
}

function clearDiceHistory() {
  diceHistory.value = []
}

// ── TAB 6: Teams ──────────────────────────────────────────────────────────
const teamsInputText = useLocalStorage(
  'rt-teams-items',
  'Alice\nBob\nCarol\nDave\nEve\nFrank\nGrace\nHenry',
)
const splitMode = ref<'by-teams' | 'by-size'>('by-teams')
const teamCount = ref(2)
const teamSize = ref(2)
const teams = ref<string[][]>([])
const teamsAnimating = ref(false)

const TEAM_COLORS = [
  '#FF6B4A',
  '#FFB830',
  '#38BDF8',
  '#4ADE80',
  '#C084FC',
  '#F472B6',
  '#FB923C',
  '#34D399',
]
const TEAM_LABELS = ['Đội A', 'Đội B', 'Đội C', 'Đội D', 'Đội E', 'Đội F', 'Đội G', 'Đội H']

const teamParticipants = computed(() =>
  teamsInputText.value
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean),
)

function splitTeams() {
  if (teamsAnimating.value || teamParticipants.value.length === 0) return
  teamsAnimating.value = true
  teams.value = []

  const shuffled = [...teamParticipants.value]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = shuffled[i]!
    shuffled[i] = shuffled[j]!
    shuffled[j] = tmp
  }

  let numTeams: number
  if (splitMode.value === 'by-teams') {
    numTeams = Math.max(2, Math.min(teamCount.value, shuffled.length))
  } else {
    numTeams = Math.max(2, Math.ceil(shuffled.length / Math.max(1, teamSize.value)))
  }

  const result: string[][] = Array.from({ length: numTeams }, () => [])
  shuffled.forEach((person, i) => {
    result[i % numTeams]!.push(person)
  })

  setTimeout(() => {
    teams.value = result
    teamsAnimating.value = false
  }, 500)
}

function setSplitByTeams() {
  splitMode.value = 'by-teams'
}

function setSplitBySize() {
  splitMode.value = 'by-size'
}

// ── Lifecycle ─────────────────────────────────────────────────────────────
onMounted(() => {
  shuffleBoxes()
  updateTabNavScroll()
  window.addEventListener('resize', updateTabNavScroll)
})

onUnmounted(() => {
  if (raceAnimFrame) cancelAnimationFrame(raceAnimFrame)
  window.removeEventListener('resize', updateTabNavScroll)
})
</script>

<template>
  <div class="flex min-h-screen flex-col bg-bg-deep font-body text-text-primary">
    <!-- Header -->
    <div class="border-b border-border-default bg-bg-surface">
      <div class="mx-auto flex max-w-4xl items-center gap-3 px-4 py-4">
        <RouterLink
          to="/"
          class="flex items-center gap-1.5 text-sm text-text-dim transition-colors hover:text-accent-coral"
        >
          <Icon icon="lucide:arrow-left" class="size-4" />
          Trang chủ
        </RouterLink>
        <span class="text-border-default">/</span>
        <h1 class="font-display text-lg font-bold tracking-wide text-accent-coral">Random Tool</h1>
      </div>
    </div>

    <!-- Tab nav -->
    <div class="sticky top-0 z-10 border-b border-border-default bg-bg-surface">
      <div class="relative mx-auto max-w-4xl">
        <!-- Left arrow -->
        <button
          v-if="tabNavCanScrollLeft"
          class="absolute left-0 top-0 z-10 flex h-full items-center bg-linear-to-r from-bg-surface via-bg-surface/90 to-transparent px-2 text-text-dim transition-colors hover:text-accent-coral"
          @click="scrollTabNav('left')"
        >
          <Icon icon="lucide:chevron-left" class="size-4" />
        </button>
        <!-- Right arrow -->
        <button
          v-if="tabNavCanScrollRight"
          class="absolute right-0 top-0 z-10 flex h-full items-center bg-linear-to-l from-bg-surface via-bg-surface/90 to-transparent px-2 text-text-dim transition-colors hover:text-accent-coral"
          @click="scrollTabNav('right')"
        >
          <Icon icon="lucide:chevron-right" class="size-4" />
        </button>
        <div
          ref="tabNavRef"
          class="flex overflow-x-auto px-4 scrollbar-hide"
          @scroll="updateTabNavScroll"
        >
          <button
            v-for="tab in TABS"
            :key="tab.id"
            :data-active="activeTab === tab.id"
            :class="[
              'flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'border-accent-coral text-accent-coral'
                : 'border-transparent text-text-dim hover:text-text-primary',
            ]"
            @click="selectTab(tab.id)"
          >
            <Icon :icon="tab.icon" class="size-4" />
            {{ tab.label }}
          </button>
        </div>
      </div>
    </div>

    <div class="mx-auto max-w-4xl px-4 py-8">
      <!-- ─── TAB 1: Number ──────────────────────────────────────────── -->
      <div v-if="activeTab === 'number'" class="animate-fade-up">
        <div class="mb-8 text-center">
          <p class="mb-1 text-sm text-text-dim">
            <span class="font-display text-sm tracking-widest text-accent-coral">//</span>
            SỐ NGẪU NHIÊN
          </p>
          <h2 class="font-display text-2xl font-bold">Tạo số ngẫu nhiên</h2>
        </div>

        <div class="mb-8 flex items-end justify-center gap-4">
          <div class="flex flex-col items-center gap-1">
            <label class="text-xs tracking-widest text-text-dim">TỪ</label>
            <input
              v-model.number="numMin"
              type="number"
              class="w-28 border border-border-default bg-bg-surface px-3 py-2 text-center font-mono text-lg text-text-primary focus:border-accent-coral focus:outline-none"
            />
          </div>
          <div class="pb-2">
            <Icon icon="lucide:minus" class="size-4 text-text-dim" />
          </div>
          <div class="flex flex-col items-center gap-1">
            <label class="text-xs tracking-widest text-text-dim">ĐẾN</label>
            <input
              v-model.number="numMax"
              type="number"
              class="w-28 border border-border-default bg-bg-surface px-3 py-2 text-center font-mono text-lg text-text-primary focus:border-accent-coral focus:outline-none"
            />
          </div>
        </div>

        <div class="mb-8 flex justify-center">
          <div
            :class="[
              'relative flex h-52 w-52 items-center justify-center border-2 bg-bg-surface',
              numResult !== null ? 'border-accent-coral' : 'border-border-default',
              numBounce ? 'num-bounce' : '',
            ]"
          >
            <div
              v-if="numResult !== null"
              :class="[
                'font-display text-6xl font-black text-accent-coral transition-all',
                numAnimating ? 'scale-95 opacity-60' : 'scale-100 opacity-100',
              ]"
            >
              {{ numResult }}
            </div>
            <div v-else class="font-display text-5xl font-black opacity-20">?</div>
            <div
              class="absolute left-0 top-0 size-3 -translate-x-px -translate-y-px border-l-2 border-t-2 border-accent-coral"
            />
            <div
              class="absolute right-0 top-0 size-3 -translate-y-px translate-x-px border-r-2 border-t-2 border-accent-coral"
            />
            <div
              class="absolute bottom-0 left-0 size-3 -translate-x-px translate-y-px border-b-2 border-l-2 border-accent-coral"
            />
            <div
              class="absolute bottom-0 right-0 size-3 translate-x-px translate-y-px border-b-2 border-r-2 border-accent-coral"
            />
          </div>
        </div>

        <div class="mb-8 flex justify-center">
          <button
            :disabled="numAnimating"
            class="flex items-center gap-2 bg-accent-coral px-8 py-3 font-display font-bold tracking-widest text-white uppercase transition-all hover:bg-accent-coral/80 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            @click="rollNumber"
          >
            <Icon icon="lucide:dice-5" class="size-5" :class="numAnimating ? 'animate-spin' : ''" />
            {{ numAnimating ? 'Đang quay...' : 'QUAY SỐ' }}
          </button>
        </div>

        <div v-if="numHistory.length > 0" class="border border-border-default bg-bg-surface p-4">
          <p class="mb-3 text-xs tracking-widest text-text-dim">
            <span class="text-accent-amber">//</span> LỊCH SỬ
          </p>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="(n, i) in numHistory"
              :key="i"
              :class="[
                'border px-3 py-1 font-mono text-sm',
                i === 0
                  ? 'border-accent-coral bg-accent-coral/10 text-accent-coral'
                  : 'border-border-default text-text-dim',
              ]"
              >{{ n }}</span
            >
          </div>
          <button
            class="mt-3 text-xs text-text-dim transition-colors hover:text-accent-coral"
            @click="clearNumHistory"
          >
            Xóa lịch sử
          </button>
        </div>
      </div>

      <!-- ─── TAB 2: Wheel ───────────────────────────────────────────── -->
      <div v-if="activeTab === 'wheel'" class="animate-fade-up">
        <div class="mb-8 text-center">
          <p class="mb-1 text-sm text-text-dim">
            <span class="font-display text-sm tracking-widest text-accent-coral">//</span>
            MỞ HỘP MAY MẮN
          </p>
          <h2 class="font-display text-2xl font-bold">Mở hộp ngẫu nhiên</h2>
        </div>

        <div class="grid gap-8 md:grid-cols-2">
          <!-- Left: boxes + controls -->
          <div class="flex flex-col gap-4">
            <!-- Mode toggle -->
            <div class="flex gap-2">
              <button
                class="flex-1 border py-2 font-display text-sm font-bold uppercase tracking-wider transition-all"
                :class="
                  wheelMode === 'manual'
                    ? 'border-accent-coral bg-accent-coral/10 text-accent-coral'
                    : 'border-border-default text-text-dim hover:border-accent-coral/50'
                "
                @click="setWheelMode('manual')"
              >
                <Icon icon="lucide:hand" class="mr-1.5 inline size-3.5" />
                Tự chọn
              </button>
              <button
                class="flex-1 border py-2 font-display text-sm font-bold uppercase tracking-wider transition-all"
                :class="
                  wheelMode === 'auto'
                    ? 'border-accent-coral bg-accent-coral/10 text-accent-coral'
                    : 'border-border-default text-text-dim hover:border-accent-coral/50'
                "
                @click="setWheelMode('auto')"
              >
                <Icon icon="lucide:zap" class="mr-1.5 inline size-3.5" />
                Auto
              </button>
            </div>

            <!-- Mode hint -->
            <p class="text-xs text-text-dim">
              <span v-if="wheelMode === 'manual'">
                <Icon icon="lucide:hand" class="mr-1 inline size-3" />
                Bấm vào hộp bất kỳ để mở và xem nội dung bên trong.
              </span>
              <span v-else>
                <Icon icon="lucide:zap" class="mr-1 inline size-3" />
                Bấm nút bên dưới để hệ thống chọn và mở hộp ngẫu nhiên.
              </span>
            </p>

            <!-- Boxes grid -->
            <div
              class="grid gap-2"
              :class="
                wheelBoxOrder.length <= 4
                  ? 'grid-cols-2'
                  : wheelBoxOrder.length <= 9
                    ? 'grid-cols-3'
                    : 'grid-cols-4'
              "
            >
              <button
                v-for="(item, idx) in wheelBoxOrder"
                :key="idx"
                class="relative flex aspect-square flex-col items-center justify-center border-2 p-3 text-center transition-all duration-200"
                :class="boxClasses(idx)"
                :disabled="wheelOpenedIndices.includes(idx) || wheelSpinning"
                @click="handleBoxClick(idx)"
              >
                <!-- Closed -->
                <template v-if="!wheelOpenedIndices.includes(idx) && wheelRevealingIdx !== idx">
                  <Icon
                    icon="lucide:gift"
                    class="mb-1 size-7 transition-colors"
                    :class="
                      wheelScanningIdx === idx
                        ? 'text-accent-amber'
                        : wheelMode === 'manual'
                          ? 'text-text-secondary'
                          : 'text-text-dim'
                    "
                  />
                  <span
                    class="font-display text-xs transition-colors"
                    :class="
                      wheelScanningIdx === idx ? 'text-accent-amber font-bold' : 'text-text-dim'
                    "
                    >{{ idx + 1 }}</span
                  >
                </template>

                <!-- Revealing -->
                <template v-else-if="wheelRevealingIdx === idx">
                  <Icon
                    icon="lucide:package-open"
                    class="mb-1 size-7 animate-spin text-accent-amber"
                  />
                  <span class="font-display text-xs text-accent-amber">...</span>
                </template>

                <!-- Opened -->
                <template v-else>
                  <Icon
                    icon="lucide:package-open"
                    class="mb-1 size-5"
                    :class="openedBoxIconClass(idx)"
                  />
                  <span
                    class="font-display text-xs font-bold leading-tight"
                    :class="openedBoxTextClass(idx)"
                  >
                    {{ item }}
                  </span>
                </template>
              </button>
            </div>

            <!-- Auto open button -->
            <button
              v-if="wheelMode === 'auto'"
              class="flex items-center justify-center gap-2 bg-accent-coral px-8 py-3 font-display font-bold tracking-widest text-white uppercase transition-all hover:bg-accent-coral/80 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="
                wheelSpinning ||
                wheelOpenedIndices.length >= wheelBoxOrder.length ||
                wheelBoxOrder.length < 1
              "
              @click="autoOpenBox"
            >
              <Icon
                icon="lucide:package-open"
                class="size-5"
                :class="wheelSpinning ? 'animate-bounce' : ''"
              />
              {{
                wheelScanningIdx !== null
                  ? 'Đang chọn...'
                  : wheelSpinning
                    ? 'Đang mở...'
                    : 'Mở hộp ngẫu nhiên'
              }}
            </button>

            <!-- Result -->
            <div
              v-if="wheelResult"
              class="border-2 border-accent-coral bg-accent-coral/10 px-6 py-3 text-center"
            >
              <p class="mb-1 text-xs tracking-widest text-text-dim">KẾT QUẢ</p>
              <p class="font-display text-xl font-bold text-accent-coral">{{ wheelResult }}</p>
            </div>

            <!-- Progress + reset -->
            <div v-if="wheelBoxOrder.length > 0" class="flex items-center justify-between text-xs">
              <span class="text-text-dim">
                Đã mở
                <span class="font-semibold text-text-secondary">{{
                  wheelOpenedIndices.length
                }}</span>
                /{{ wheelBoxOrder.length }} hộp
              </span>
              <button
                class="flex items-center gap-1 text-accent-sky hover:underline"
                @click="resetBoxes"
              >
                <Icon icon="lucide:shuffle" class="size-3" />
                Xáo trộn lại
              </button>
            </div>
          </div>

          <!-- Right: input -->
          <div class="flex flex-col gap-3">
            <label class="text-xs tracking-widest text-text-dim">
              <span class="text-accent-sky">//</span> DANH SÁCH (mỗi dòng 1 mục)
            </label>
            <textarea
              v-model="wheelInputText"
              class="h-56 resize-none border border-border-default bg-bg-surface p-3 font-mono text-sm text-text-primary placeholder-text-dim focus:border-accent-coral focus:outline-none"
              placeholder="Nhập danh sách..."
            />
            <p class="text-xs text-text-dim">
              {{ wheelBoxOrder.length }} hộp ·
              {{ wheelBoxOrder.length - wheelOpenedIndices.length }} chưa mở
            </p>
          </div>
        </div>
      </div>

      <!-- ─── TAB 3: Race ────────────────────────────────────────────── -->
      <div v-if="activeTab === 'race'" class="animate-fade-up">
        <div class="mb-8 text-center">
          <p class="mb-1 text-sm text-text-dim">
            <span class="font-display text-sm tracking-widest text-accent-coral">//</span>
            ĐUA VỀ ĐÍCH
          </p>
          <h2 class="font-display text-2xl font-bold">Xếp hạng ngẫu nhiên</h2>
        </div>

        <div class="grid gap-8 md:grid-cols-[220px_1fr]">
          <!-- Input + config -->
          <div class="flex flex-col gap-3">
            <label class="text-xs tracking-widest text-text-dim">
              <span class="text-accent-sky">//</span> NGƯỜI THAM GIA
            </label>
            <textarea
              v-model="raceInputText"
              :disabled="raceState === 'racing'"
              class="h-40 resize-none border border-border-default bg-bg-surface p-3 font-mono text-sm text-text-primary placeholder-text-dim focus:border-accent-coral focus:outline-none disabled:opacity-50"
              placeholder="Mỗi dòng 1 tên..."
            />
            <p class="text-xs text-text-dim">{{ raceParticipants.length }} người · tối đa 10</p>

            <!-- Min duration config -->
            <div class="border border-border-default bg-bg-surface px-3 py-2">
              <label class="mb-1 block text-xs tracking-widest text-text-dim">
                <span class="text-accent-amber">//</span> THỜI GIAN TỐI THIỂU
              </label>
              <div class="flex items-center gap-2">
                <input
                  v-model.number="raceMinDuration"
                  type="number"
                  min="5"
                  max="60"
                  :disabled="raceState === 'racing'"
                  class="w-20 border border-border-default bg-bg-deep px-2 py-1 text-center font-mono text-sm text-text-primary focus:border-accent-coral focus:outline-none disabled:opacity-50"
                />
                <span class="text-sm text-text-dim">giây</span>
              </div>
            </div>

            <button
              v-if="raceState !== 'racing'"
              :disabled="raceParticipants.length < 2"
              class="flex items-center justify-center gap-2 bg-accent-coral px-4 py-2.5 font-display text-sm font-bold tracking-widest text-white uppercase transition-all hover:bg-accent-coral/80 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              @click="startRace"
            >
              <Icon icon="lucide:play" class="size-4" />
              BẮT ĐẦU ĐUA
            </button>

            <button
              v-if="raceState !== 'idle'"
              class="flex items-center justify-center gap-2 border border-border-default px-4 py-2.5 font-display text-sm uppercase text-text-dim transition-all hover:border-accent-coral hover:text-accent-coral"
              @click="resetRace"
            >
              <Icon icon="lucide:rotate-ccw" class="size-4" />
              ĐẶT LẠI
            </button>
          </div>

          <!-- Track -->
          <div class="flex flex-col gap-2">
            <div class="mb-1 flex items-center justify-between">
              <span class="text-xs tracking-widest text-text-dim">ĐƯỜNG ĐUA</span>
              <span v-if="raceState === 'racing'" class="animate-pulse text-xs text-accent-amber">
                ● ĐANG ĐUA
              </span>
              <span v-else-if="raceState === 'finished'" class="text-xs text-accent-sky">
                ✓ KẾT THÚC
              </span>
            </div>

            <div
              v-if="racers.length > 0"
              class="overflow-hidden border border-border-default bg-bg-surface"
            >
              <div
                v-for="racer in racers"
                :key="racer.id"
                class="relative flex h-11 items-center border-b border-border-default/40 last:border-b-0"
              >
                <div class="absolute inset-0 bg-bg-deep/40" />
                <div
                  class="absolute bottom-0 left-0 top-0 bg-accent-sky/10"
                  :style="{ width: racer.progress + '%' }"
                />
                <div
                  class="absolute bottom-0 right-0 top-0 w-px border-r border-dashed border-accent-coral/40"
                />
                <div
                  class="absolute z-10 -translate-x-1/2 text-lg leading-none"
                  :style="{ left: `max(1.5rem, ${racer.progress}%)` }"
                >
                  {{ racer.emoji }}
                </div>
                <div class="absolute right-2 z-10 flex items-center gap-2">
                  <span
                    v-if="racer.rank"
                    class="font-display text-xs font-bold"
                    :class="
                      racer.rank === 1
                        ? 'text-accent-amber'
                        : racer.rank === 2
                          ? 'text-text-primary'
                          : 'text-text-dim'
                    "
                    >#{{ racer.rank }}</span
                  >
                  <span class="text-xs text-text-secondary">{{ racer.name }}</span>
                </div>
              </div>
            </div>

            <div
              v-else
              class="flex h-40 items-center justify-center border border-border-default bg-bg-surface text-sm text-text-dim"
            >
              Nhập danh sách và nhấn Bắt đầu đua
            </div>

            <div v-if="raceFinishOrder.length > 0" class="mt-2">
              <p class="mb-2 text-xs tracking-widest text-text-dim">
                <span class="text-accent-amber">//</span> BXH CHUNG CUỘC
              </p>
              <div class="flex flex-wrap gap-2">
                <div
                  v-for="racer in raceFinishOrder"
                  :key="racer.id"
                  :class="[
                    'flex items-center gap-1.5 border px-3 py-1.5 text-sm',
                    racer.rank === 1
                      ? 'border-accent-amber bg-accent-amber/10 text-accent-amber'
                      : racer.rank === 2
                        ? 'border-border-default text-text-primary'
                        : 'border-border-default/50 text-text-dim',
                  ]"
                >
                  <span>{{
                    racer.rank === 1
                      ? '🥇'
                      : racer.rank === 2
                        ? '🥈'
                        : racer.rank === 3
                          ? '🥉'
                          : `#${racer.rank}`
                  }}</span>
                  <span>{{ racer.emoji }}</span>
                  <span>{{ racer.name }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Race history -->
        <div
          v-if="raceHistory.length > 0"
          class="mt-6 border border-border-default bg-bg-surface p-4"
        >
          <div class="mb-3 flex items-center justify-between">
            <p class="text-xs tracking-widest text-text-dim">
              <span class="text-accent-amber">//</span> LỊCH SỬ ({{ raceHistory.length }} cuộc đua)
            </p>
            <button
              class="text-xs text-text-dim transition-colors hover:text-accent-coral"
              @click="clearRaceHistory"
            >
              Xóa lịch sử
            </button>
          </div>
          <div class="flex flex-col gap-3">
            <div
              v-for="(entry, i) in raceHistory"
              :key="i"
              :class="[
                'border p-3',
                i === 0 ? 'border-accent-coral/40 bg-accent-coral/5' : 'border-border-default/50',
              ]"
            >
              <p class="mb-2 text-xs text-text-dim">
                {{ i === 0 ? 'Gần nhất' : `Lần ${i + 1}` }} ·
                {{ new Date(entry.date).toLocaleTimeString('vi-VN') }}
              </p>
              <div class="flex flex-wrap gap-2">
                <div
                  v-for="p in entry.participants"
                  :key="p.rank"
                  :class="[
                    'flex items-center gap-1.5 border px-2.5 py-1 text-sm',
                    p.rank === 1
                      ? 'border-accent-amber/60 bg-accent-amber/10 text-accent-amber'
                      : p.rank === 2
                        ? 'border-border-default text-text-primary'
                        : 'border-border-default/40 text-text-dim',
                  ]"
                >
                  <span>{{
                    p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : p.rank === 3 ? '🥉' : `#${p.rank}`
                  }}</span>
                  <span>{{ p.emoji }}</span>
                  <span>{{ p.name }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ─── TAB 4: Bốc thăm (Single Draw) ─────────────────────────────── -->
      <div v-if="activeTab === 'bracket'" class="animate-fade-up">
        <div class="mb-8 text-center">
          <p class="mb-1 text-sm text-text-dim">
            <span class="font-display text-sm tracking-widest text-accent-coral">//</span>
            BỐC THĂM
          </p>
          <h2 class="font-display text-2xl font-bold">Bốc thăm từng người</h2>
        </div>

        <!-- Idle: input & start -->
        <div v-if="drawState === 'idle'" class="mx-auto max-w-lg">
          <!-- Compact participant list -->
          <label class="mb-2 block text-xs tracking-widest text-text-dim">
            <span class="text-accent-sky">//</span>
            DANH SÁCH ({{ bracketParticipants.length }} người)
          </label>

          <!-- Chips area with max-height -->
          <div class="mb-2 border border-border-default bg-bg-surface">
            <div
              :class="[
                'flex flex-wrap content-start gap-1.5 overflow-hidden p-2.5 transition-all',
                bracketParticipants.length > 12 && !bracketListExpanded ? 'max-h-24' : '',
              ]"
            >
              <template v-if="bracketParticipants.length > 0">
                <div
                  v-for="name in bracketParticipants"
                  :key="name"
                  class="group flex items-center gap-1 bg-bg-elevated px-2 py-0.5 text-xs text-text-primary"
                >
                  <span class="max-w-25 truncate">{{ name }}</span>
                  <button
                    class="text-text-dim opacity-0 transition-all hover:text-accent-coral group-hover:opacity-100"
                    @click="removeBracketItem(name)"
                  >
                    <Icon icon="lucide:x" class="size-3" />
                  </button>
                </div>
              </template>
              <span v-else class="py-1 text-xs text-text-dim">Chưa có ai...</span>
            </div>
            <button
              v-if="bracketParticipants.length > 12"
              class="w-full border-t border-border-default/50 py-1 text-xs text-text-dim transition-colors hover:text-accent-coral"
              @click="bracketListExpanded = !bracketListExpanded"
            >
              {{
                bracketListExpanded ? 'Thu gọn ▲' : `Xem tất cả (${bracketParticipants.length}) ▼`
              }}
            </button>
          </div>

          <!-- Add input -->
          <div class="mb-4">
            <div class="flex gap-2">
              <textarea
                v-model="bracketNewItem"
                rows="2"
                class="min-w-0 flex-1 resize-none border border-border-default bg-bg-surface px-3 py-1.5 font-mono text-sm text-text-primary placeholder-text-dim focus:border-accent-coral focus:outline-none"
                placeholder="Nhập tên, mỗi dòng 1 người..."
              />
              <button
                :disabled="!bracketNewItem.trim()"
                class="shrink-0 self-end border border-accent-coral px-3 py-1.5 text-accent-coral transition-all hover:bg-accent-coral hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                @click="addBracketItem"
              >
                <Icon icon="lucide:plus" class="size-4" />
              </button>
            </div>
            <p class="mt-1 text-xs text-text-dim">Mỗi dòng 1 tên, có thể dán danh sách</p>
          </div>

          <button
            :disabled="bracketParticipants.length < 2"
            class="flex w-full items-center justify-center gap-2 bg-accent-coral px-6 py-3 font-display font-bold tracking-widest text-white uppercase transition-all hover:bg-accent-coral/80 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            @click="startDrawSession"
          >
            <Icon icon="lucide:shuffle" class="size-5" />
            BẮT ĐẦU BỐC THĂM
          </button>
        </div>

        <!-- Drawing / Done state -->
        <div v-else class="mx-auto max-w-2xl">
          <!-- Progress bar -->
          <div class="mb-6">
            <div class="mb-2 flex items-center justify-between">
              <p class="text-xs tracking-widest text-text-dim">
                <span class="text-accent-coral">//</span>
                TIẾN ĐỘ — {{ drawnList.length }}/{{ drawnList.length + drawPool.length }}
              </p>
              <span v-if="drawState === 'done'" class="text-xs text-accent-sky">✓ Hoàn thành</span>
            </div>
            <div class="h-1.5 w-full bg-bg-surface">
              <div
                class="h-full bg-accent-coral transition-all duration-500"
                :style="{
                  width: `${(drawnList.length / (drawnList.length + drawPool.length)) * 100}%`,
                }"
              />
            </div>
          </div>

          <!-- Draw area -->
          <div class="relative mb-6 flex flex-col items-center">
            <!-- Confetti overlay -->
            <div
              v-if="drawConfetti"
              class="pointer-events-none absolute inset-0 z-20 overflow-hidden"
            >
              <div
                v-for="piece in confettiPieces"
                :key="piece.id"
                class="confetti-piece absolute"
                :style="{
                  left: piece.x + '%',
                  top: '50%',
                  backgroundColor: piece.color,
                  animationDelay: piece.delay + 's',
                  transform: `rotate(${piece.angle}deg)`,
                }"
              />
            </div>

            <!-- Central draw box -->
            <div
              :class="[
                'relative flex h-48 w-full max-w-md items-center justify-center border-2 transition-all',
                drawAnimating
                  ? 'draw-box-animating border-accent-amber/60 bg-bg-surface'
                  : drawShowResult
                    ? 'draw-box-reveal border-accent-coral bg-accent-coral/5'
                    : 'border-border-default bg-bg-surface',
              ]"
            >
              <!-- Corner accents -->
              <div
                class="absolute left-0 top-0 size-4 -translate-x-px -translate-y-px border-l-2 border-t-2 border-accent-coral"
              />
              <div
                class="absolute right-0 top-0 size-4 -translate-y-px translate-x-px border-r-2 border-t-2 border-accent-coral"
              />
              <div
                class="absolute bottom-0 left-0 size-4 -translate-x-px translate-y-px border-b-2 border-l-2 border-accent-coral"
              />
              <div
                class="absolute bottom-0 right-0 size-4 translate-x-px translate-y-px border-b-2 border-r-2 border-accent-coral"
              />

              <div v-if="drawAnimating || drawShowResult" class="text-center">
                <p class="mb-2 text-xs tracking-widest text-text-dim">
                  {{ drawAnimating ? 'ĐANG BỐC THĂM...' : `NGƯỜI THỨ ${drawnList.length}` }}
                </p>
                <p
                  :class="[
                    'font-display font-black transition-all',
                    drawAnimating
                      ? 'draw-flash text-3xl text-text-secondary sm:text-4xl'
                      : 'draw-reveal text-4xl text-accent-coral sm:text-5xl',
                  ]"
                >
                  {{ drawCurrentFlash }}
                </p>
              </div>
              <div v-else class="flex flex-col items-center gap-2 text-text-dim">
                <Icon icon="lucide:hand" class="size-10 opacity-30" />
                <p class="text-sm">Nhấn nút để bốc thăm</p>
                <p class="text-xs">Còn {{ drawPool.length }} người</p>
              </div>
            </div>

            <!-- Draw button -->
            <div class="mt-6 flex gap-3">
              <button
                v-if="drawPool.length > 0"
                :disabled="drawAnimating"
                class="draw-btn flex items-center gap-2 bg-accent-coral px-8 py-3 font-display font-bold tracking-widest text-white uppercase transition-all hover:bg-accent-coral/80 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                @click="drawNextPerson"
              >
                <Icon
                  icon="lucide:sparkles"
                  class="size-5"
                  :class="drawAnimating ? 'animate-spin' : ''"
                />
                {{
                  drawAnimating ? 'ĐANG BỐC...' : drawnList.length === 0 ? 'BỐC THĂM' : 'BỐC TIẾP'
                }}
              </button>
              <button
                class="flex items-center justify-center gap-2 border border-border-default px-4 py-3 font-display text-sm uppercase text-text-dim transition-all hover:border-accent-coral hover:text-accent-coral"
                @click="resetDraw"
              >
                <Icon icon="lucide:rotate-ccw" class="size-4" />
                LÀM LẠI
              </button>
            </div>
          </div>

          <!-- Drawn list -->
          <div v-if="drawnList.length > 0">
            <p class="mb-3 text-xs tracking-widest text-text-dim">
              <span class="text-accent-amber">//</span>
              KẾT QUẢ BỐC THĂM ({{ drawnList.length }})
            </p>
            <div class="grid gap-2 sm:grid-cols-2">
              <div
                v-for="(name, i) in drawnList"
                :key="i"
                :class="[
                  'drawn-item flex items-center gap-3 border px-4 py-2.5',
                  i === drawnList.length - 1 && drawShowResult
                    ? 'border-accent-coral/60 bg-accent-coral/5 drawn-item-latest'
                    : 'border-border-default bg-bg-surface',
                ]"
              >
                <span
                  :class="[
                    'flex size-7 shrink-0 items-center justify-center font-display text-xs font-bold',
                    i === 0
                      ? 'bg-accent-amber text-white'
                      : i === 1
                        ? 'bg-text-secondary text-white'
                        : i === 2
                          ? 'bg-accent-coral text-white'
                          : 'bg-bg-elevated text-text-dim',
                  ]"
                >
                  {{ i + 1 }}
                </span>
                <span class="truncate font-medium text-text-primary">{{ name }}</span>
                <span v-if="i === 0" class="ml-auto text-sm">🥇</span>
                <span v-else-if="i === 1" class="ml-auto text-sm">🥈</span>
                <span v-else-if="i === 2" class="ml-auto text-sm">🥉</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ─── TAB 5: Coin (Icon) ─────────────────────────────────────── -->
      <div v-if="activeTab === 'coin'" class="animate-fade-up">
        <div class="mb-8 text-center">
          <p class="mb-1 text-sm text-text-dim">
            <span class="font-display text-sm tracking-widest text-accent-coral">//</span>
            TUNG ĐỒNG XU
          </p>
          <h2 class="font-display text-2xl font-bold">Random Đúng / Sai</h2>
        </div>

        <!-- Icon config -->
        <div class="mb-6 flex items-end justify-center gap-8">
          <!-- Face 1 -->
          <div class="flex flex-col items-center gap-2">
            <span class="text-xs tracking-widest text-text-dim">MẶT 1</span>
            <button
              :class="[
                'border-2 p-4 transition-all hover:scale-105',
                coinPickerFor === 'heads'
                  ? 'border-accent-coral bg-accent-coral/20'
                  : 'border-accent-coral bg-bg-surface',
              ]"
              @click="openCoinPicker('heads')"
            >
              <Icon :icon="coinIcon1" class="size-10 text-accent-coral" />
            </button>
            <span class="text-xs text-text-secondary">{{ getIconLabel(coinIcon1) }}</span>
            <span class="text-xs text-text-dim">click để đổi</span>
          </div>

          <div class="pb-8">
            <Icon icon="lucide:arrow-left-right" class="size-5 text-text-dim" />
          </div>

          <!-- Face 2 -->
          <div class="flex flex-col items-center gap-2">
            <span class="text-xs tracking-widest text-text-dim">MẶT 2</span>
            <button
              :class="[
                'border-2 p-4 transition-all hover:scale-105',
                coinPickerFor === 'tails'
                  ? 'border-accent-sky bg-accent-sky/20'
                  : 'border-accent-sky bg-bg-surface',
              ]"
              @click="openCoinPicker('tails')"
            >
              <Icon :icon="coinIcon2" class="size-10 text-accent-sky" />
            </button>
            <span class="text-xs text-text-secondary">{{ getIconLabel(coinIcon2) }}</span>
            <span class="text-xs text-text-dim">click để đổi</span>
          </div>
        </div>

        <!-- Icon picker -->
        <div
          v-if="coinPickerFor !== null"
          class="mb-6 border border-border-default bg-bg-surface p-4"
        >
          <div class="mb-3 flex items-center justify-between">
            <span class="text-xs tracking-widest text-text-dim">
              <span :class="coinPickerFor === 'heads' ? 'text-accent-coral' : 'text-accent-sky'"
                >//</span
              >
              CHỌN ICON CHO MẶT {{ coinPickerFor === 'heads' ? '1' : '2' }}
            </span>
            <button
              class="text-xs text-text-dim hover:text-accent-coral"
              @click="coinPickerFor = null"
            >
              <Icon icon="lucide:x" class="size-4" />
            </button>
          </div>
          <div class="grid grid-cols-8 gap-2 sm:grid-cols-12">
            <button
              v-for="preset in COIN_ICON_PRESETS"
              :key="preset.icon"
              :title="preset.label"
              :class="[
                'flex items-center justify-center border p-2 transition-all hover:scale-110',
                (coinPickerFor === 'heads' ? coinIcon1 : coinIcon2) === preset.icon
                  ? coinPickerFor === 'heads'
                    ? 'border-accent-coral bg-accent-coral/15 text-accent-coral'
                    : 'border-accent-sky bg-accent-sky/15 text-accent-sky'
                  : 'border-border-default text-text-secondary hover:border-accent-coral/50',
              ]"
              @click="selectCoinIcon(preset.icon)"
            >
              <Icon :icon="preset.icon" class="size-5" />
            </button>
          </div>
        </div>

        <!-- Coin flip -->
        <div class="flex flex-col items-center gap-6">
          <div class="coin-scene" @click="flipCoin">
            <div class="coin" :style="{ transform: `rotateY(${coinRotation}deg)` }">
              <div class="coin-face coin-heads">
                <Icon :icon="coinIcon1" class="size-14 text-accent-coral" />
              </div>
              <div class="coin-face coin-tails">
                <Icon :icon="coinIcon2" class="size-14 text-accent-sky" />
              </div>
            </div>
          </div>

          <button
            :disabled="coinFlipping"
            class="flex items-center gap-2 bg-accent-coral px-8 py-3 font-display font-bold tracking-widest text-white uppercase transition-all hover:bg-accent-coral/80 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            @click="flipCoin"
          >
            <Icon icon="lucide:circle-dot" class="size-5" />
            {{ coinFlipping ? 'Đang tung...' : 'TUNG ĐỒNG XU' }}
          </button>

          <div v-if="coinResult && !coinFlipping" class="text-center">
            <p class="mb-2 text-xs tracking-widest text-text-dim">KẾT QUẢ</p>
            <Icon
              :icon="coinResultIcon"
              class="mx-auto size-16"
              :class="coinResult === 'heads' ? 'text-accent-coral' : 'text-accent-sky'"
            />
            <p
              class="mt-2 font-display text-2xl font-black"
              :class="coinResult === 'heads' ? 'text-accent-coral' : 'text-accent-sky'"
            >
              {{ getIconLabel(coinResultIcon) }}
            </p>
          </div>
        </div>
      </div>

      <!-- ─── TAB 5: Dice ────────────────────────────────────────────── -->
      <div v-if="activeTab === 'dice'" class="animate-fade-up">
        <div class="mb-8 text-center">
          <p class="mb-1 text-sm text-text-dim">
            <span class="font-display text-sm tracking-widest text-accent-coral">//</span>
            TUNG XÚC XẮC
          </p>
          <h2 class="font-display text-2xl font-bold">Tung xúc xắc</h2>
        </div>

        <!-- Dice count config -->
        <div class="mb-8 flex items-center justify-center gap-4">
          <span class="text-sm text-text-secondary">Số xúc xắc:</span>
          <div class="flex gap-2">
            <button
              v-for="n in 6"
              :key="n"
              :class="[
                'size-9 border font-display font-bold text-sm transition-all',
                diceCount === n
                  ? 'border-accent-coral bg-accent-coral text-white'
                  : 'border-border-default text-text-dim hover:border-accent-coral/60',
              ]"
              @click="diceCount = n"
            >
              {{ n }}
            </button>
          </div>
        </div>

        <!-- Dice display -->
        <div class="mb-8 flex min-h-28 flex-wrap items-center justify-center gap-4">
          <div v-if="diceValues.length === 0" class="text-5xl opacity-20">🎲</div>
          <div
            v-for="(val, i) in diceValues"
            :key="i"
            :class="['die', diceRolling ? 'die-rolling' : 'die-land']"
          >
            <div v-for="cell in 9" :key="cell" class="die-cell">
              <div v-if="DICE_PIPS[val]?.includes(cell)" class="die-pip" />
            </div>
          </div>
        </div>

        <!-- Sum -->
        <div v-if="diceValues.length > 0 && !diceRolling" class="mb-6 text-center">
          <p class="text-xs tracking-widest text-text-dim">TỔNG</p>
          <p class="font-display text-5xl font-black text-accent-amber">{{ diceTotal }}</p>
          <p v-if="diceValues.length > 1" class="mt-1 text-xs text-text-dim">
            {{ diceValues.join(' + ') }}
          </p>
        </div>

        <!-- Roll button -->
        <div class="mb-8 flex justify-center">
          <button
            :disabled="diceRolling"
            class="flex items-center gap-2 bg-accent-coral px-8 py-3 font-display font-bold tracking-widest text-white uppercase transition-all hover:bg-accent-coral/80 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            @click="rollDice"
          >
            <Icon icon="lucide:box" class="size-5" :class="diceRolling ? 'animate-bounce' : ''" />
            {{ diceRolling ? 'Đang tung...' : 'TUNG XÚC XẮC' }}
          </button>
        </div>

        <!-- History -->
        <div v-if="diceHistory.length > 0" class="border border-border-default bg-bg-surface p-4">
          <div class="mb-3 flex items-center justify-between">
            <p class="text-xs tracking-widest text-text-dim">
              <span class="text-accent-amber">//</span> LỊCH SỬ (5 lần gần nhất)
            </p>
            <button class="text-xs text-text-dim hover:text-accent-coral" @click="clearDiceHistory">
              Xóa
            </button>
          </div>
          <div class="flex flex-col gap-2">
            <div
              v-for="(roll, i) in diceHistory"
              :key="i"
              :class="[
                'flex items-center gap-3 border px-3 py-2',
                i === 0 ? 'border-accent-amber/50 bg-accent-amber/5' : 'border-border-default/50',
              ]"
            >
              <span
                class="font-display font-bold"
                :class="i === 0 ? 'text-accent-amber' : 'text-text-dim'"
                >{{ roll.total }}</span
              >
              <div class="flex gap-1">
                <span
                  v-for="(v, j) in roll.values"
                  :key="j"
                  class="border border-border-default px-2 py-0.5 font-mono text-xs text-text-secondary"
                  >{{ v }}</span
                >
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ─── TAB 6: Teams ───────────────────────────────────────────── -->
      <div v-if="activeTab === 'teams'" class="animate-fade-up">
        <div class="mb-8 text-center">
          <p class="mb-1 text-sm text-text-dim">
            <span class="font-display text-sm tracking-widest text-accent-coral">//</span>
            CHIA ĐỘI NGẪU NHIÊN
          </p>
          <h2 class="font-display text-2xl font-bold">Chia đội ngẫu nhiên</h2>
        </div>

        <div class="grid gap-8 md:grid-cols-2">
          <div class="flex flex-col gap-4">
            <div>
              <label class="mb-2 block text-xs tracking-widest text-text-dim">
                <span class="text-accent-sky">//</span> DANH SÁCH THÀNH VIÊN
              </label>
              <textarea
                v-model="teamsInputText"
                class="h-44 w-full resize-none border border-border-default bg-bg-surface p-3 font-mono text-sm text-text-primary placeholder-text-dim focus:border-accent-coral focus:outline-none"
                placeholder="Mỗi dòng 1 tên..."
              />
              <p class="mt-1 text-xs text-text-dim">{{ teamParticipants.length }} thành viên</p>
            </div>

            <div>
              <label class="mb-2 block text-xs tracking-widest text-text-dim">
                <span class="text-accent-sky">//</span> CHẾ ĐỘ CHIA
              </label>
              <div class="flex gap-2">
                <button
                  :class="[
                    'flex-1 border px-3 py-2 text-sm font-medium transition-colors',
                    splitMode === 'by-teams'
                      ? 'border-accent-coral bg-accent-coral/10 text-accent-coral'
                      : 'border-border-default text-text-dim hover:border-accent-coral/50',
                  ]"
                  @click="setSplitByTeams"
                >
                  Theo số đội
                </button>
                <button
                  :class="[
                    'flex-1 border px-3 py-2 text-sm font-medium transition-colors',
                    splitMode === 'by-size'
                      ? 'border-accent-coral bg-accent-coral/10 text-accent-coral'
                      : 'border-border-default text-text-dim hover:border-accent-coral/50',
                  ]"
                  @click="setSplitBySize"
                >
                  Theo số người/đội
                </button>
              </div>
            </div>

            <div v-if="splitMode === 'by-teams'" class="flex items-center gap-3">
              <label class="whitespace-nowrap text-sm text-text-secondary">Số đội:</label>
              <input
                v-model.number="teamCount"
                type="number"
                min="2"
                :max="teamParticipants.length"
                class="w-24 border border-border-default bg-bg-surface px-3 py-1.5 text-center text-text-primary focus:border-accent-coral focus:outline-none"
              />
            </div>
            <div v-else class="flex items-center gap-3">
              <label class="whitespace-nowrap text-sm text-text-secondary">Người/đội:</label>
              <input
                v-model.number="teamSize"
                type="number"
                min="1"
                class="w-24 border border-border-default bg-bg-surface px-3 py-1.5 text-center text-text-primary focus:border-accent-coral focus:outline-none"
              />
            </div>

            <button
              :disabled="teamsAnimating || teamParticipants.length === 0"
              class="flex items-center justify-center gap-2 bg-accent-coral px-6 py-3 font-display font-bold tracking-widest text-white uppercase transition-all hover:bg-accent-coral/80 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              @click="splitTeams"
            >
              <Icon
                icon="lucide:shuffle"
                class="size-5"
                :class="teamsAnimating ? 'animate-spin' : ''"
              />
              {{ teamsAnimating ? 'Đang chia...' : 'CHIA ĐỘI' }}
            </button>
          </div>

          <div>
            <div
              v-if="teams.length > 0"
              :class="['grid gap-3', teams.length <= 2 ? 'grid-cols-1' : 'grid-cols-2']"
            >
              <div
                v-for="(team, i) in teams"
                :key="i"
                class="border bg-bg-surface p-4"
                :style="{ borderColor: (TEAM_COLORS[i % TEAM_COLORS.length] ?? '#FF6B4A') + '60' }"
              >
                <div class="mb-3 flex items-center gap-2">
                  <div
                    class="size-3"
                    :style="{ backgroundColor: TEAM_COLORS[i % TEAM_COLORS.length] ?? '#FF6B4A' }"
                  />
                  <span
                    class="font-display text-sm font-bold"
                    :style="{ color: TEAM_COLORS[i % TEAM_COLORS.length] ?? '#FF6B4A' }"
                  >
                    {{ TEAM_LABELS[i] ?? `Đội ${i + 1}` }}
                  </span>
                  <span class="ml-auto text-xs text-text-dim">{{ team.length }} người</span>
                </div>
                <ul class="space-y-1">
                  <li
                    v-for="(member, j) in team"
                    :key="j"
                    class="flex items-center gap-2 text-sm text-text-primary"
                  >
                    <span class="text-xs text-text-dim">{{ j + 1 }}.</span>
                    {{ member }}
                  </li>
                </ul>
              </div>
            </div>
            <div
              v-else
              class="flex min-h-48 items-center justify-center border border-border-default bg-bg-surface p-8 text-center text-sm text-text-dim"
            >
              <div>
                <Icon icon="lucide:users" class="mx-auto mb-2 size-8 opacity-30" />
                <p>Nhập danh sách và nhấn Chia đội</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer class="mt-auto border-t border-border-default/50 bg-bg-surface/30">
      <div class="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-6 py-4">
        <div class="flex items-center gap-3">
          <span class="font-display text-xs tracking-widest text-text-dim">//</span>
          <div>
            <p class="font-display text-sm font-semibold text-text-secondary">Hachi Tu</p>
            <p class="text-xs text-text-dim">Tác giả</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <a
            href="https://github.com/hachitubg"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-1.5 border border-border-default px-3 py-1.5 text-xs text-text-dim transition hover:border-text-secondary hover:text-text-secondary"
          >
            <Icon icon="lucide:github" class="size-3.5" />
            GitHub
          </a>
          <a
            href="https://www.facebook.com/tuhachiz/"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-1.5 border border-border-default px-3 py-1.5 text-xs text-text-dim transition hover:border-accent-sky hover:text-accent-sky"
          >
            <Icon icon="lucide:facebook" class="size-3.5" />
            Facebook
          </a>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* ── Scrollbar hide ──────────────────────────────────────────────────────── */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

/* ── Coin 3D ─────────────────────────────────────────────────────────────── */
.coin-scene {
  width: 160px;
  height: 160px;
  perspective: 600px;
  cursor: pointer;
}

.coin {
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 1.3s cubic-bezier(0.17, 0.67, 0.12, 0.99);
}

.coin-face {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  backface-visibility: hidden;
  border: 4px solid;
}

.coin-heads {
  background: linear-gradient(135deg, #1e2f42 0%, #162232 100%);
  border-color: #ff6b4a;
}

.coin-tails {
  background: linear-gradient(135deg, #162232 0%, #1e2f42 100%);
  border-color: #38bdf8;
  transform: rotateY(180deg);
}

/* ── Box open ────────────────────────────────────────────────────────────── */
@keyframes box-pop {
  0% {
    transform: scale(1);
  }
  40% {
    transform: scale(1.18) rotate(-4deg);
  }
  70% {
    transform: scale(1.12) rotate(3deg);
  }
  100% {
    transform: scale(1);
  }
}

.box-pop {
  animation: box-pop 0.65s ease-in-out;
}

/* ── Number bounce ───────────────────────────────────────────────────────── */
@keyframes numBounce {
  0%,
  100% {
    transform: scale(1);
  }
  30% {
    transform: scale(1.25);
  }
  60% {
    transform: scale(0.95);
  }
  80% {
    transform: scale(1.05);
  }
}

.num-bounce {
  animation: numBounce 0.5s ease;
}

/* ── Dice ────────────────────────────────────────────────────────────────── */
.die {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  width: 88px;
  height: 88px;
  padding: 10px;
  gap: 4px;
  background: linear-gradient(135deg, #1e2f42, #162232);
  border: 3px solid #ff6b4a;
  border-radius: 14px;
}

.die-cell {
  display: flex;
  align-items: center;
  justify-content: center;
}

.die-pip {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #ff6b4a;
  box-shadow: 0 0 6px rgba(255, 107, 74, 0.5);
}

@keyframes diceShake {
  0%,
  100% {
    transform: rotate(0deg) scale(1);
  }
  20% {
    transform: rotate(-10deg) scale(1.06);
  }
  40% {
    transform: rotate(10deg) scale(0.94);
  }
  60% {
    transform: rotate(-7deg) scale(1.04);
  }
  80% {
    transform: rotate(7deg) scale(0.97);
  }
}

@keyframes diceLand {
  0% {
    transform: scale(1.15);
  }
  60% {
    transform: scale(0.93);
  }
  100% {
    transform: scale(1);
  }
}

.die-rolling {
  animation: diceShake 0.18s ease-in-out infinite;
}

.die-land {
  animation: diceLand 0.35s ease-out;
}

/* ── Draw (Bốc thăm) ────────────────────────────────────────────────────── */
@keyframes drawFlash {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(0.96);
  }
}

.draw-flash {
  animation: drawFlash 0.12s ease-in-out infinite;
}

@keyframes drawReveal {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
  }
  70% {
    transform: scale(0.95);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.draw-reveal {
  animation: drawReveal 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes boxGlow {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(255, 107, 74, 0);
  }
  50% {
    box-shadow: 0 0 30px 4px rgba(255, 107, 74, 0.3);
  }
}

.draw-box-reveal {
  animation: boxGlow 1s ease;
}

@keyframes boxPulse {
  0%,
  100% {
    border-color: rgba(255, 184, 48, 0.3);
  }
  50% {
    border-color: rgba(255, 184, 48, 0.8);
  }
}

.draw-box-animating {
  animation: boxPulse 0.4s ease-in-out infinite;
}

@keyframes confettiFall {
  0% {
    transform: translateY(0) rotate(0deg) scale(1);
    opacity: 1;
  }
  100% {
    transform: translateY(-200px) rotate(720deg) scale(0);
    opacity: 0;
  }
}

@keyframes confettiSpread {
  0% {
    transform: translate(0, 0) rotate(0deg);
    opacity: 1;
  }
  25% {
    opacity: 1;
  }
  100% {
    transform: translate(var(--spread-x, 50px), var(--spread-y, -150px))
      rotate(var(--spread-r, 360deg));
    opacity: 0;
  }
}

.confetti-piece {
  width: 8px;
  height: 8px;
  animation: confettiSpread 2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  --spread-x: calc((var(--random-x, 0.5) - 0.5) * 300px);
  --spread-y: calc(-80px - var(--random-y, 0.5) * 200px);
  --spread-r: calc(var(--random-r, 0.5) * 720deg);
}

.confetti-piece:nth-child(odd) {
  border-radius: 50%;
}

.confetti-piece:nth-child(3n) {
  width: 6px;
  height: 10px;
}

.confetti-piece:nth-child(5n) {
  width: 10px;
  height: 6px;
}

@keyframes drawnItemPop {
  0% {
    transform: scale(0.8) translateY(10px);
    opacity: 0;
  }
  60% {
    transform: scale(1.05) translateY(-2px);
  }
  100% {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

.drawn-item-latest {
  animation: drawnItemPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
</style>
