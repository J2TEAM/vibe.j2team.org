<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { RouterLink } from 'vue-router'

type Scope = 'arena' | 'target'

interface CssOption {
  id: string
  label: string
  scope: Scope
  property: string
  value: string
}

interface Level {
  id: number
  title: string
  objective: string
  hint: string
  optionIds: string[]
  requiredIds: string[]
  targetCount?: number
}

const optionsMap: Record<string, CssOption> = {
  'arena-flex': {
    id: 'arena-flex',
    label: 'display: flex',
    scope: 'arena',
    property: 'display',
    value: 'flex',
  },
  'arena-grid': {
    id: 'arena-grid',
    label: 'display: grid',
    scope: 'arena',
    property: 'display',
    value: 'grid',
  },
  'arena-justify-center': {
    id: 'arena-justify-center',
    label: 'justify-content: center',
    scope: 'arena',
    property: 'justify-content',
    value: 'center',
  },
  'arena-align-center': {
    id: 'arena-align-center',
    label: 'align-items: center',
    scope: 'arena',
    property: 'align-items',
    value: 'center',
  },
  'arena-place-center': {
    id: 'arena-place-center',
    label: 'place-items: center',
    scope: 'arena',
    property: 'place-items',
    value: 'center',
  },
  'arena-relative': {
    id: 'arena-relative',
    label: 'position: relative',
    scope: 'arena',
    property: 'position',
    value: 'relative',
  },
  'arena-grid-2': {
    id: 'arena-grid-2',
    label: 'grid-template-columns: repeat(2, minmax(0, 1fr))',
    scope: 'arena',
    property: 'grid-template-columns',
    value: 'repeat(2, minmax(0, 1fr))',
  },
  'arena-grid-3': {
    id: 'arena-grid-3',
    label: 'grid-template-columns: repeat(3, minmax(0, 1fr))',
    scope: 'arena',
    property: 'grid-template-columns',
    value: 'repeat(3, minmax(0, 1fr))',
  },
  'arena-gap': {
    id: 'arena-gap',
    label: 'gap: 12px',
    scope: 'arena',
    property: 'gap',
    value: '12px',
  },
  'arena-overflow': {
    id: 'arena-overflow',
    label: 'overflow-y: auto',
    scope: 'arena',
    property: 'overflow-y',
    value: 'auto',
  },
  'arena-height': {
    id: 'arena-height',
    label: 'height: 240px',
    scope: 'arena',
    property: 'height',
    value: '240px',
  },
  'target-absolute': {
    id: 'target-absolute',
    label: 'position: absolute',
    scope: 'target',
    property: 'position',
    value: 'absolute',
  },
  'target-sticky': {
    id: 'target-sticky',
    label: 'position: sticky',
    scope: 'target',
    property: 'position',
    value: 'sticky',
  },
  'target-top-0': {
    id: 'target-top-0',
    label: 'top: 0',
    scope: 'target',
    property: 'top',
    value: '0',
  },
  'target-right-0': {
    id: 'target-right-0',
    label: 'right: 0',
    scope: 'target',
    property: 'right',
    value: '0',
  },
  'target-bottom-0': {
    id: 'target-bottom-0',
    label: 'bottom: 0',
    scope: 'target',
    property: 'bottom',
    value: '0',
  },
  'target-left-0': {
    id: 'target-left-0',
    label: 'left: 0',
    scope: 'target',
    property: 'left',
    value: '0',
  },
  'target-top-50': {
    id: 'target-top-50',
    label: 'top: 50%',
    scope: 'target',
    property: 'top',
    value: '50%',
  },
  'target-transform-y': {
    id: 'target-transform-y',
    label: 'transform: translateY(-50%)',
    scope: 'target',
    property: 'transform',
    value: 'translateY(-50%)',
  },
  'target-inset-0': {
    id: 'target-inset-0',
    label: 'inset: 0',
    scope: 'target',
    property: 'inset',
    value: '0',
  },
  'target-margin-auto': {
    id: 'target-margin-auto',
    label: 'margin: auto',
    scope: 'target',
    property: 'margin',
    value: 'auto',
  },
  'target-size': {
    id: 'target-size',
    label: 'width: 96px + height: 96px',
    scope: 'target',
    property: 'width',
    value: '96px',
  },
  'target-height': {
    id: 'target-height',
    label: 'height: 96px',
    scope: 'target',
    property: 'height',
    value: '96px',
  },
}

const levels: Level[] = [
  {
    id: 1,
    title: 'Khởi động: Canh giữa',
    objective: 'Đưa khối target vào chính giữa arena.',
    hint: 'Flexbox + 2 trục ngang dọc.',
    optionIds: [
      'arena-flex',
      'arena-justify-center',
      'arena-align-center',
      'arena-grid',
      'target-absolute',
      'target-right-0',
    ],
    requiredIds: ['arena-flex', 'arena-justify-center', 'arena-align-center'],
  },
  {
    id: 2,
    title: 'Góc phải dưới',
    objective: 'Neo target vào góc phải dưới của arena.',
    hint: 'Cha phải relative, con absolute.',
    optionIds: [
      'arena-relative',
      'target-absolute',
      'target-right-0',
      'target-bottom-0',
      'target-top-0',
      'arena-justify-center',
    ],
    requiredIds: ['arena-relative', 'target-absolute', 'target-right-0', 'target-bottom-0'],
  },
  {
    id: 3,
    title: 'Dashboard 3 cột',
    objective: 'Dàn đều 6 item thành 3 cột, có khoảng cách giữa các item.',
    hint: 'Grid + template columns + gap.',
    optionIds: [
      'arena-grid',
      'arena-grid-3',
      'arena-gap',
      'arena-flex',
      'arena-align-center',
      'target-absolute',
    ],
    requiredIds: ['arena-grid', 'arena-grid-3', 'arena-gap'],
    targetCount: 6,
  },
  {
    id: 4,
    title: 'Modal chính giữa',
    objective: 'Đặt modal ở giữa bằng absolute + inset + margin auto.',
    hint: 'Set kích thước modal trước khi margin auto.',
    optionIds: [
      'arena-relative',
      'target-absolute',
      'target-inset-0',
      'target-margin-auto',
      'target-size',
      'target-height',
      'arena-grid',
    ],
    requiredIds: [
      'arena-relative',
      'target-absolute',
      'target-inset-0',
      'target-margin-auto',
      'target-size',
      'target-height',
    ],
  },
  {
    id: 5,
    title: 'Sticky thông báo',
    objective: 'Tạo target sticky ở đầu vùng cuộn.',
    hint: 'Arena cần cuộn được thì sticky mới thấy tác dụng.',
    optionIds: [
      'arena-overflow',
      'arena-height',
      'target-sticky',
      'target-top-0',
      'target-bottom-0',
      'arena-flex',
    ],
    requiredIds: ['arena-overflow', 'arena-height', 'target-sticky', 'target-top-0'],
  },
  {
    id: 6,
    title: 'Canh giữa theo trục dọc',
    objective: 'Đặt target ở mép trái nhưng căn giữa theo trục dọc bằng transform.',
    hint: 'Top 50% rồi kéo ngược lại.',
    optionIds: [
      'arena-relative',
      'target-absolute',
      'target-left-0',
      'target-top-50',
      'target-transform-y',
      'target-right-0',
      'arena-grid',
    ],
    requiredIds: [
      'arena-relative',
      'target-absolute',
      'target-left-0',
      'target-top-50',
      'target-transform-y',
    ],
  },
  {
    id: 7,
    title: 'Split layout 2 cột',
    objective: 'Dựng layout 2 cột đều nhau cho 2 item.',
    hint: 'Grid 2 cột là đủ.',
    optionIds: [
      'arena-grid',
      'arena-grid-2',
      'arena-gap',
      'arena-flex',
      'target-absolute',
      'arena-justify-center',
    ],
    requiredIds: ['arena-grid', 'arena-grid-2', 'arena-gap'],
    targetCount: 2,
  },
  {
    id: 8,
    title: 'Boss cuối: One-liner center',
    objective: 'Kết liễu boss bằng 1 dòng center kinh điển của Grid.',
    hint: 'Dùng place-items thay vì tách 2 thuộc tính.',
    optionIds: [
      'arena-grid',
      'arena-place-center',
      'arena-flex',
      'arena-justify-center',
      'arena-align-center',
      'target-absolute',
    ],
    requiredIds: ['arena-grid', 'arena-place-center'],
  },
]

const currentLevelIndex = ref(0)
const score = ref(0)
const levelHp = ref(100)
const combo = ref(0)
const tries = ref(0)
const timeLeft = ref(180)
const feedback = ref('Chọn thuộc tính, bấm Tấn công boss!')
const isVictory = ref(false)
const isGameOver = ref(false)
const selectedIds = ref<string[]>([])

const currentLevel = computed(() => levels[currentLevelIndex.value]!)
const hasNextLevel = computed(() => currentLevelIndex.value < levels.length - 1)
const targetDirectionLabel = computed(() => {
  switch (currentLevel.value.id) {
    case 1:
      return 'Mục tiêu: Chính giữa arena'
    case 2:
      return 'Mục tiêu: Góc phải dưới'
    case 3:
      return 'Mục tiêu: Chia thành 3 cột đều'
    case 4:
      return 'Mục tiêu: Modal nằm giữa'
    case 5:
      return 'Mục tiêu: Sticky dính ở phía trên'
    case 6:
      return 'Mục tiêu: Mép trái, canh giữa dọc'
    case 7:
      return 'Mục tiêu: Chia thành 2 cột đều'
    default:
      return 'Mục tiêu: One-liner center bằng Grid'
  }
})
const targetGhostStyle = computed<Record<string, string>>(() => {
  const base: Record<string, string> = {
    width: '80px',
    height: '80px',
    position: 'absolute',
  }

  switch (currentLevel.value.id) {
    case 1:
    case 4:
    case 8:
      return {
        ...base,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }
    case 2:
      return {
        ...base,
        right: '0',
        bottom: '0',
      }
    case 5:
      return {
        ...base,
        top: '0',
        left: '0',
      }
    case 6:
      return {
        ...base,
        left: '0',
        top: '50%',
        transform: 'translateY(-50%)',
      }
    default:
      return {
        ...base,
        top: '0',
        left: '0',
      }
  }
})
const bossPhase = computed(() => {
  if (levelHp.value > 60) return 'Ổn định'
  if (levelHp.value > 30) return 'Rung chuyển'
  return 'Báo động'
})
const bossName = computed(() => `CSS Overlord • L${currentLevel.value.id}`)
const bossCardClass = computed(() => {
  if (levelHp.value > 60) return 'border-cyan-400/40 bg-cyan-500/10'
  if (levelHp.value > 30) return 'border-amber-400/50 bg-amber-500/10'
  return 'border-rose-400/50 bg-rose-500/10'
})
const bossIconClass = computed(() => {
  if (levelHp.value > 60) return 'text-cyan-300'
  if (levelHp.value > 30) return 'text-amber-300'
  return 'text-rose-300 animate-pulse'
})
const bossHpBarClass = computed(() => {
  if (levelHp.value > 60) return 'from-cyan-300 to-cyan-500'
  if (levelHp.value > 30) return 'from-amber-300 to-amber-500'
  return 'from-rose-300 to-rose-500'
})
const bossHpStyle = computed(() => ({ width: `${levelHp.value}%` }))

const getOptionLabel = (id: string): string => optionsMap[id]?.label ?? id

let timer: ReturnType<typeof setInterval> | null = null

const makeStyle = (scope: Scope): Record<string, string> => {
  const styles: Record<string, string> = {}

  selectedIds.value.forEach((id) => {
    const option = optionsMap[id]
    if (!option || option.scope !== scope) return
    styles[option.property] = option.value
  })

  return styles
}

const arenaStyle = computed(() => makeStyle('arena'))
const targetStyle = computed(() => makeStyle('target'))

const toggleOption = (id: string): void => {
  if (isGameOver.value || isVictory.value) return

  const next = [...selectedIds.value]
  const currentIndex = next.indexOf(id)
  if (currentIndex >= 0) {
    next.splice(currentIndex, 1)
  } else {
    next.push(id)
  }
  selectedIds.value = next
}

const resetLevelState = (): void => {
  selectedIds.value = []
  levelHp.value = 100
  tries.value = 0
  feedback.value = 'Chọn thuộc tính, bấm Tấn công boss!'
}

const toLevelMap = (list: string[]) => {
  const map: Record<string, true> = {}
  list.forEach((item) => {
    map[item] = true
  })
  return map
}

const attackBoss = (): void => {
  if (isGameOver.value || isVictory.value) return

  const required = toLevelMap(currentLevel.value.requiredIds)
  const activeList = selectedIds.value.filter((id) => currentLevel.value.optionIds.includes(id))
  const active = toLevelMap(activeList)
  const requiredCount = currentLevel.value.requiredIds.length

  let correct = 0
  currentLevel.value.requiredIds.forEach((id) => {
    if (active[id]) correct += 1
  })

  let wrong = 0
  activeList.forEach((id) => {
    if (!required[id]) wrong += 1
  })

  const missing = requiredCount - correct
  const isPerfect = correct === requiredCount && wrong === 0
  const damage = isPerfect ? 100 : Math.max(5, correct * 26 - wrong * 12 - missing * 8)

  levelHp.value = Math.max(0, levelHp.value - damage)
  tries.value += 1

  if (isPerfect) {
    combo.value += 1
    feedback.value = `Perfect combo! Boss nhận -${damage}% máu.`
  } else if (damage >= 30) {
    combo.value = Math.max(0, combo.value - 1)
    feedback.value = `Tốt! Đúng ${correct}/${requiredCount} thuộc tính, boss mất ${damage}% máu.`
  } else {
    combo.value = 0
    feedback.value = `Chưa ổn: thiếu ${missing}, sai ${wrong}. Gợi ý: ${currentLevel.value.hint}`
  }

  if (levelHp.value > 0) return

  score.value += 100 + timeLeft.value + combo.value * 15 - tries.value * 5

  if (hasNextLevel.value) {
    currentLevelIndex.value += 1
    resetLevelState()
    return
  }

  isVictory.value = true
  feedback.value = 'Bạn đã hạ toàn bộ CSS boss. GG!'
}

const restart = (): void => {
  currentLevelIndex.value = 0
  score.value = 0
  combo.value = 0
  timeLeft.value = 180
  isVictory.value = false
  isGameOver.value = false
  resetLevelState()
}

onMounted(() => {
  timer = setInterval(() => {
    if (isVictory.value || isGameOver.value) return

    if (timeLeft.value > 0) {
      timeLeft.value -= 1
      return
    }

    isGameOver.value = true
    feedback.value = 'Hết giờ! Boss đã thắng ở lần này.'
  }, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100">
    <div
      class="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-5 sm:px-6 sm:py-8 lg:px-8"
    >
      <header class="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-6">
        <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p class="text-xs tracking-[0.24em] text-cyan-300 uppercase">Vibe Coding Arena</p>
            <h1 class="mt-2 text-2xl font-black tracking-tight text-white sm:text-4xl">CSS Boss Fight</h1>
            <p class="mt-2 max-w-2xl text-sm text-slate-300 sm:text-base">
              Đánh boss bằng Flexbox, Grid, Position. Mỗi màn là một bài layout thực chiến.
            </p>
            <div class="mt-3 flex flex-wrap items-center gap-2 text-xs sm:text-sm">
              <span class="text-slate-400">Tác giả: xuanhai0913</span>
              <a
                href="https://www.facebook.com/nguyenhai0913"
                target="_blank"
                rel="noopener noreferrer"
                class="rounded-md border border-slate-700 px-2 py-1 text-cyan-300 transition hover:border-cyan-400 hover:text-cyan-200"
              >
                Facebook
              </a>
              <a
                href="https://github.com/xuanhai0913"
                target="_blank"
                rel="noopener noreferrer"
                class="rounded-md border border-slate-700 px-2 py-1 text-cyan-300 transition hover:border-cyan-400 hover:text-cyan-200"
              >
                GitHub
              </a>
            </div>
          </div>
          <RouterLink
            to="/"
            class="inline-flex h-10 items-center justify-center rounded-xl border border-slate-700 px-4 text-sm text-slate-200 transition hover:border-cyan-400 hover:text-cyan-200"
          >
            ← Về trang chủ
          </RouterLink>
        </div>

        <div class="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          <div class="rounded-xl border border-slate-800 bg-slate-900 p-3">
            <p class="text-[11px] text-slate-400 uppercase">Level</p>
            <p class="mt-1 text-xl font-bold">{{ currentLevel.id }}/{{ levels.length }}</p>
          </div>
          <div class="rounded-xl border border-slate-800 bg-slate-900 p-3">
            <p class="text-[11px] text-slate-400 uppercase">Boss HP</p>
            <p class="mt-1 text-xl font-bold text-rose-300">{{ levelHp }}%</p>
          </div>
          <div class="rounded-xl border border-slate-800 bg-slate-900 p-3">
            <p class="text-[11px] text-slate-400 uppercase">Score</p>
            <p class="mt-1 text-xl font-bold text-cyan-300">{{ score }}</p>
          </div>
          <div class="rounded-xl border border-slate-800 bg-slate-900 p-3">
            <p class="text-[11px] text-slate-400 uppercase">Time</p>
            <p class="mt-1 text-xl font-bold" :class="timeLeft <= 20 ? 'text-amber-300' : 'text-emerald-300'">
              {{ timeLeft }}s
            </p>
          </div>
        </div>
      </header>

      <section class="grid grid-cols-1 gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <article class="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h2 class="text-lg font-bold text-white sm:text-xl">{{ currentLevel.title }}</h2>
              <p class="mt-1 text-sm text-slate-300">{{ currentLevel.objective }}</p>
              <p class="mt-1 text-xs text-cyan-300">{{ targetDirectionLabel }}</p>
            </div>
            <div class="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
              Combo x{{ combo }}
            </div>
          </div>

          <div class="mt-4 rounded-xl border border-slate-700 bg-slate-950 p-3">
            <div class="mb-2 text-xs text-slate-400">ARENA PREVIEW</div>
            <div
              class="relative min-h-[260px] rounded-lg border border-dashed border-slate-700 bg-slate-900 p-3"
              :style="arenaStyle"
            >
              <div
                class="pointer-events-none z-0 flex items-center justify-center rounded-xl border border-dashed border-cyan-400/60 bg-cyan-400/10 text-[10px] font-semibold text-cyan-300"
                :style="targetGhostStyle"
              >
                GOAL
              </div>

              <div class="pointer-events-none absolute top-3 right-3 z-20 w-[210px] max-w-[65%]">
                <div class="rounded-xl border p-2 backdrop-blur-sm" :class="bossCardClass">
                  <div class="flex items-center gap-2">
                    <div class="rounded-lg border border-slate-700 bg-slate-900/80 p-2">
                      <Icon icon="lucide:skull" class="size-6" :class="bossIconClass" />
                    </div>
                    <div class="min-w-0 flex-1">
                      <p class="truncate text-[11px] font-semibold text-slate-200">{{ bossName }}</p>
                      <p class="text-[10px] text-slate-400">Trạng thái: {{ bossPhase }}</p>
                    </div>
                  </div>
                  <div class="mt-2">
                    <div class="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                      <div
                        class="h-full rounded-full bg-gradient-to-r transition-all duration-500"
                        :class="bossHpBarClass"
                        :style="bossHpStyle"
                      ></div>
                    </div>
                    <p class="mt-1 text-right text-[10px] text-slate-300">HP {{ levelHp }}%</p>
                  </div>
                </div>
              </div>

              <div
                v-for="n in (currentLevel.targetCount ?? 1)"
                :key="n"
                class="z-10 flex h-16 w-16 items-center justify-center rounded-xl border border-cyan-300/50 bg-cyan-500/20 text-xs font-bold text-cyan-200 sm:h-20 sm:w-20"
                :class="currentLevel.id === 5 ? 'mb-3' : ''"
                :style="targetStyle"
              >
                {{ n }}
              </div>

              <div v-if="currentLevel.id === 5" class="space-y-2 pt-2 text-xs text-slate-500">
                <p v-for="idx in 10" :key="idx">Nội dung cuộn #{{ idx }} - sticky sẽ dính phía trên.</p>
              </div>
            </div>
          </div>

          <div class="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-300">
            {{ feedback }}
          </div>

          <div class="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              class="rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:bg-rose-800"
              :disabled="isGameOver || isVictory"
              @click="attackBoss"
            >
              Tấn công boss
            </button>
            <button
              type="button"
              class="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-400 hover:text-cyan-200"
              @click="resetLevelState"
            >
              Reset màn
            </button>
            <button
              type="button"
              class="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-emerald-400 hover:text-emerald-200"
              @click="restart"
            >
              Chơi lại từ đầu
            </button>
          </div>
        </article>

        <aside class="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5">
          <h3 class="text-sm font-semibold tracking-[0.14em] text-slate-300 uppercase">
            Chọn Thuộc Tính CSS
          </h3>
          <p class="mt-2 text-sm text-slate-400">Nhấp để bật/tắt. Chỉ chọn những thuộc tính cần thiết.</p>

          <div class="mt-4 grid grid-cols-1 gap-2">
            <button
              v-for="optionId in currentLevel.optionIds"
              :key="optionId"
              type="button"
              class="rounded-lg border px-3 py-2 text-left text-xs transition sm:text-sm"
              :class="
                selectedIds.includes(optionId)
                  ? 'border-cyan-400 bg-cyan-400/15 text-cyan-100'
                  : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500'
              "
              @click="toggleOption(optionId)"
            >
              {{ getOptionLabel(optionId) }}
            </button>
          </div>

          <div
            v-if="isVictory"
            class="mt-5 rounded-xl border border-emerald-400/40 bg-emerald-500/10 p-3 text-sm text-emerald-200"
          >
            Chiến thắng! Bạn đã clear toàn bộ 8 màn CSS Boss Fight.
          </div>

          <div
            v-else-if="isGameOver"
            class="mt-5 rounded-xl border border-amber-400/40 bg-amber-500/10 p-3 text-sm text-amber-200"
          >
            Hết giờ. Bấm "Chơi lại từ đầu" để phục thù boss.
          </div>
        </aside>
      </section>
    </div>
  </div>
</template>