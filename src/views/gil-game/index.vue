<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useStorage } from '@vueuse/core'
import { Icon } from '@iconify/vue'

const linesOfCode = useStorage('gil-game-loc', 0)
const totalLinesOfCode = useStorage('gil-game-total-loc', 0)

interface Upgrade {
  id: string
  name: string
  description: string
  baseCost: number
  costMultiplier: number
  level: number
  lpsBonus: number // Lines per second
  lpcBonus: number // Lines per click
  icon: string
}

const defaultUpgrades: Upgrade[] = [
  {
    id: 'keyboard',
    name: 'Bàn phím cơ xịn',
    description: 'Gõ sướng tay, code nhanh hơn.',
    baseCost: 10,
    costMultiplier: 1.5,
    level: 0,
    lpsBonus: 0,
    lpcBonus: 1,
    icon: 'mdi:keyboard',
  },
  {
    id: 'monitor',
    name: 'Màn hình phụ',
    description: 'Không phải Alt+Tab nhiều.',
    baseCost: 50,
    costMultiplier: 1.5,
    level: 0,
    lpsBonus: 2,
    lpcBonus: 0,
    icon: 'mdi:monitor',
  },
  {
    id: 'intern',
    name: 'Thực tập sinh',
    description: 'Sai vặt, thi thoảng code được vài dòng.',
    baseCost: 200,
    costMultiplier: 1.5,
    level: 0,
    lpsBonus: 10,
    lpcBonus: 0,
    icon: 'mdi:account-school',
  },
  {
    id: 'energy',
    name: 'Bò húc M',
    description: 'Tràn trề năng lượng, spam phím điên cuồng.',
    baseCost: 1000,
    costMultiplier: 2,
    level: 0,
    lpsBonus: 0,
    lpcBonus: 10,
    icon: 'mdi:bottle-tonic',
  },
  {
    id: 'ide',
    name: 'Premium IDE',
    description: 'Code completion thông minh, tự động import.',
    baseCost: 3000,
    costMultiplier: 1.6,
    level: 0,
    lpsBonus: 50,
    lpcBonus: 0,
    icon: 'mdi:code-braces',
  },
  {
    id: 'senior',
    name: 'Dev Senior',
    description: 'Cỗ máy đẻ code, ít bug.',
    baseCost: 15000,
    costMultiplier: 1.8,
    level: 0,
    lpsBonus: 300,
    lpcBonus: 0,
    icon: 'mdi:account-tie',
  },
  {
    id: 'ai',
    name: 'AI Copilot Pro',
    description: 'Code tự sinh ra từ prompt ảo não.',
    baseCost: 100000,
    costMultiplier: 2,
    level: 0,
    lpsBonus: 2500,
    lpcBonus: 0,
    icon: 'mdi:robot-outline',
  },
]

const upgrades = useStorage<Upgrade[]>('gil-game-upgrades', defaultUpgrades)

onMounted(() => {
  // Đồng bộ cấu trúc upgrade lỡ có thay đổi mảng defaultUpgrades
  if (upgrades.value.length !== defaultUpgrades.length) {
    const upgradedMap = new Map(upgrades.value.map((u) => [u.id, u]))
    upgrades.value = defaultUpgrades.map((defaultU) => {
      const existing = upgradedMap.get(defaultU.id)
      return existing ? { ...defaultU, level: existing.level } : defaultU
    })
  }
})

const lpc = computed(() => {
  return 1 + upgrades.value.reduce((acc, curr) => acc + curr.level * curr.lpcBonus, 0)
})

const lps = computed(() => {
  return upgrades.value.reduce((acc, curr) => acc + curr.level * curr.lpsBonus, 0)
})

const writeCode = () => {
  linesOfCode.value += lpc.value
  totalLinesOfCode.value += lpc.value
}

const getUpgradeCost = (upgrade: Upgrade) => {
  return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.level))
}

const buyUpgrade = (upgrade: Upgrade) => {
  const cost = getUpgradeCost(upgrade)
  if (linesOfCode.value >= cost) {
    linesOfCode.value -= cost
    upgrade.level++
  }
}

let timer: number
onMounted(() => {
  timer = setInterval(() => {
    if (lps.value > 0) {
      linesOfCode.value += lps.value
      totalLinesOfCode.value += lps.value
    }
  }, 1000)
})

onUnmounted(() => {
  clearInterval(timer)
})

const GAME_AAA_TARGET = 1000000
const progressPercent = computed(() => {
  return Math.min((totalLinesOfCode.value / GAME_AAA_TARGET) * 100, 100).toFixed(2)
})

const resetGame = () => {
  if (confirm('Bạn có chắc chắn muốn bắt đầu lại từ đầu không? Toàn bộ Dòng Code sẽ mất!')) {
    linesOfCode.value = 0
    totalLinesOfCode.value = 0
    upgrades.value = defaultUpgrades.map((u) => ({ ...u, level: 0 }))
  }
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

// Float texts effect
const floatingTexts = ref<{ id: number; x: number; y: number; text: string }[]>([])
let clickId = 0
const handleMainClick = (e: MouseEvent) => {
  writeCode()

  const id = clickId++
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()

  // Random position around click center (which is where mouse fired relative to rect)
  const x = e.clientX - rect.left + (Math.random() - 0.5) * 80
  const y = e.clientY - rect.top + (Math.random() - 0.5) * 80

  floatingTexts.value.push({
    id,
    x,
    y,
    text: `+${formatNumber(lpc.value)}`,
  })

  // Set timeout to remove floating text
  setTimeout(() => {
    floatingTexts.value = floatingTexts.value.filter((t) => t.id !== id)
  }, 1000)
}
</script>

<template>
  <div
    class="min-h-screen bg-slate-900 text-slate-200 font-body flex gap-8 flex-col items-center justify-start p-4 md:p-8 selection:bg-emerald-500/30"
  >
    <div class="w-full max-w-6xl w-full grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mt-4">
      <!-- Left Panel: Clicker & Status -->
      <div class="lg:col-span-1 flex flex-col gap-6 items-center">
        <!-- Header -->
        <div class="text-center w-full animate-fade-up">
          <h1
            class="font-display text-4xl sm:text-5xl font-bold text-emerald-400 mb-2 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]"
          >
            Long Gil Studio
          </h1>
          <p class="text-slate-400 font-medium">Hành trình tạo game AAA</p>
        </div>

        <!-- Big Number -->
        <div
          class="bg-slate-800/80 rounded-2xl border border-slate-700/50 p-6 w-full text-center shadow-xl backdrop-blur-sm animate-fade-up animate-delay-[100ms]"
        >
          <p class="text-emerald-500/80 font-medium mb-1 uppercase tracking-wider text-sm">
            Dòng Code (LoC)
          </p>
          <p class="text-5xl font-bold text-emerald-400 font-mono tracking-tight">
            {{ formatNumber(linesOfCode) }}
          </p>
          <div class="mt-4 flex justify-between text-sm text-slate-300 px-2">
            <div
              class="text-left bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-700/50 flex flex-col items-center flex-1 mr-2"
            >
              <span class="block text-emerald-300 font-mono font-medium">{{
                formatNumber(lpc)
              }}</span>
              <span class="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5"
                >LoC / click</span
              >
            </div>
            <div
              class="text-right bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-700/50 flex flex-col items-center flex-1 ml-2"
            >
              <span class="block text-emerald-300 font-mono font-medium">{{
                formatNumber(lps)
              }}</span>
              <span class="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5"
                >LoC / sec</span
              >
            </div>
          </div>
        </div>

        <!-- Main Click Area -->
        <div
          class="relative w-full aspect-square max-w-[280px] mt-6 animate-fade-up animate-delay-[200ms]"
        >
          <button
            @mousedown="handleMainClick"
            class="w-full h-full rounded-full bg-slate-800 border-4 border-slate-700 shadow-[0_0_50px_rgba(16,185,129,0.15)] hover:border-emerald-500/50 hover:shadow-[0_0_80px_rgba(16,185,129,0.3)] active:scale-95 transition-all duration-100 flex items-center justify-center group overflow-hidden relative cursor-pointer outline-none"
          >
            <div
              class="absolute inset-0 bg-emerald-500/5 rounded-full group-hover:bg-emerald-500/10 transition-colors"
            ></div>
            <Icon
              icon="mdi:laptop-mac"
              class="text-8xl text-emerald-500/80 group-hover:text-emerald-400 group-active:text-emerald-300 transition-colors z-10"
            />
          </button>

          <!-- Floating Texts -->
          <TransitionGroup name="float">
            <div
              v-for="ft in floatingTexts"
              :key="ft.id"
              class="absolute text-emerald-400 font-bold text-2xl pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] z-20 select-none font-mono tracking-wider"
              :style="{ left: ft.x + 'px', top: ft.y + 'px' }"
            >
              {{ ft.text }}
            </div>
          </TransitionGroup>
        </div>
      </div>

      <!-- Right Panel: Upgrades and Progress -->
      <div class="lg:col-span-2 flex flex-col gap-6 w-full animate-fade-up animate-delay-[300ms]">
        <!-- AAA Progress -->
        <div
          class="bg-slate-800/80 rounded-2xl border border-slate-700/50 p-6 xl:p-8 shadow-xl backdrop-blur-sm relative overflow-hidden"
        >
          <div
            class="absolute right-0 top-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] -mr-16 -mt-16 pointer-events-none"
          ></div>

          <div class="flex justify-between items-end mb-3 relative z-10">
            <div>
              <h2 class="text-xl sm:text-2xl font-bold text-slate-100 mb-1">
                Tiến độ Phát hành AAA
              </h2>
              <p class="text-sm text-slate-400">
                Chỉ tiêu chất lượng:
                <span class="text-emerald-400 font-mono">{{ formatNumber(GAME_AAA_TARGET) }}</span>
                LoC
              </p>
            </div>
            <div class="text-right">
              <span class="text-3xl font-display font-bold text-emerald-400"
                >{{ progressPercent }}<span class="text-emerald-500/50 text-xl">%</span></span
              >
            </div>
          </div>

          <div
            class="w-full bg-slate-900 rounded-full h-5 overflow-hidden border border-slate-700 shadow-inner relative z-10"
          >
            <div
              class="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full transition-all duration-[1000ms] ease-out relative"
              :style="{ width: progressPercent + '%' }"
            >
              <div
                class="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_25%,rgba(255,255,255,0.2)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.2)_75%,rgba(255,255,255,0.2)_100%)] bg-[length:20px_20px] animate-[stripes_2s_linear_infinite]"
              ></div>
            </div>
          </div>
          <p
            v-if="parseFloat(progressPercent) >= 100"
            class="mt-4 text-center font-bold text-yellow-500 animate-bounce bg-yellow-500/10 py-2 rounded-lg border border-yellow-500/20"
          >
            🎉 CHÚC MỪNG! BẠN ĐÃ PHÁT HÀNH THÀNH CÔNG SIÊU PHẨM AAA CỦA LONG GIL STUDIO! 🎉
          </p>
        </div>

        <!-- Store Section -->
        <div
          class="bg-slate-800/80 rounded-2xl border border-slate-700/50 shadow-xl flex-1 flex flex-col overflow-hidden min-h-[400px] xl:max-h-[650px]"
        >
          <div
            class="p-5 border-b border-slate-700/50 bg-slate-800/90 flex justify-between items-center backdrop-blur-md z-10 shrink-0"
          >
            <h2 class="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Icon icon="mdi:shopping-outline" class="text-emerald-400 text-xl" /> Cửa hàng Nâng
              Cấp
            </h2>
          </div>

          <div
            class="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar bg-slate-900/40"
          >
            <div
              v-for="ug in upgrades"
              :key="ug.id"
              class="group bg-slate-800 border border-slate-700 rounded-xl py-5 px-4 flex flex-col md:flex-row items-center md:items-stretch gap-4 transition-all hover:bg-slate-700/50 hover:border-emerald-500/30 relative overflow-hidden shrink-0"
              :class="{ 'opacity-60 grayscale-[0.8]': linesOfCode < getUpgradeCost(ug) }"
            >
              <!-- Icon/Visual -->
              <div
                class="w-16 h-16 md:w-20 md:h-auto rounded-lg bg-slate-900 flex items-center justify-center shrink-0 border border-slate-700 group-hover:border-emerald-500/30 transition-colors shadow-inner"
              >
                <Icon
                  :icon="ug.icon"
                  class="text-4xl text-emerald-400 group-hover:scale-110 transition-transform duration-300"
                />
              </div>

              <!-- Content and Button wrap -->
              <div
                class="flex-1 flex flex-col sm:flex-row w-full gap-4 items-center sm:items-stretch py-1"
              >
                <!-- Desc -->
                <div class="flex-1 text-center sm:text-left flex flex-col py-1 min-w-0">
                  <div class="flex flex-col xl:flex-row xl:items-center gap-2 mb-1">
                    <h3
                      class="text-base font-bold text-slate-200 group-hover:text-white transition-colors"
                    >
                      {{ ug.name }}
                    </h3>
                    <span
                      class="text-[10px] xl:ml-auto shrink-0 font-mono px-2 py-0.5 rounded pl-1.5 border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 flex items-center gap-1 w-fit mx-auto sm:mx-0"
                    >
                      <Icon icon="mdi:arrow-up-thin" /> Lv {{ ug.level }}
                    </span>
                  </div>
                  <p
                    class="text-xs text-slate-400 group-hover:text-slate-300 transition-colors opacity-90 leading-relaxed my-1"
                  >
                    {{ ug.description }}
                  </p>
                  <div
                    class="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-3 mt-2 text-xs text-emerald-300 font-mono font-medium"
                  >
                    <span
                      v-if="ug.lpcBonus > 0"
                      class="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded shrink-0"
                      ><Icon icon="mdi:cursor-default-click" class="text-emerald-500" /> +{{
                        formatNumber(ug.lpcBonus)
                      }}
                      LoC/c</span
                    >
                    <span
                      v-if="ug.lpsBonus > 0"
                      class="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded shrink-0"
                      ><Icon icon="mdi:timer-outline" class="text-emerald-500" /> +{{
                        formatNumber(ug.lpsBonus)
                      }}
                      LoC/s</span
                    >
                  </div>
                </div>

                <!-- Action button -->
                <button
                  @click="buyUpgrade(ug)"
                  :disabled="linesOfCode < getUpgradeCost(ug)"
                  class="w-full sm:w-[130px] px-4 py-2.5 rounded-xl font-bold flex flex-col items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0 border border-transparent shadow-sm hover:shadow-md h-fit sm:my-auto"
                  :class="
                    linesOfCode >= getUpgradeCost(ug)
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:-translate-y-0.5'
                      : 'bg-slate-700/80 text-slate-400 hover:bg-slate-700 active:scale-100'
                  "
                >
                  <span class="text-sm">Nâng cấp</span>
                  <span class="text-[11px] font-mono opacity-90 mt-0.5 flex items-center gap-1">
                    <Icon icon="mdi:currency-usd" class="text-[10px]" />
                    {{ formatNumber(getUpgradeCost(ug)) }}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions Footer -->
    <div
      class="mt-4 pb-8 flex flex-wrap gap-4 items-center justify-center w-full animate-fade-up animate-delay-[400ms]"
    >
      <RouterLink
        to="/"
        class="inline-flex items-center justify-center gap-2 border border-slate-700/80 bg-slate-800/80 px-6 py-2.5 rounded-xl text-sm font-medium text-slate-300 transition-all hover:border-emerald-500/50 hover:text-emerald-400 hover:bg-slate-800 hover:-translate-y-0.5 shadow-sm min-w-[160px]"
      >
        <Icon icon="mdi:arrow-left" class="text-lg" />
        Về trang chủ
      </RouterLink>

      <button
        @click="resetGame"
        class="inline-flex items-center justify-center gap-2 border border-red-900/30 bg-red-950/20 text-red-400/80 px-6 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-red-900/40 hover:text-red-300 hover:border-red-900/50 min-w-[160px]"
      >
        <Icon icon="mdi:refresh" class="text-lg" />
        Làm lại từ đầu
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Custom Scrollbar for store */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(51, 65, 85, 0.8); /* slate-700 */
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(71, 85, 105, 1); /* slate-600 */
}

/* Float animation for click numbers */
.float-enter-active,
.float-leave-active {
  transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.float-enter-from {
  opacity: 0;
  transform: translateY(10px) scale(0.5);
}
.float-enter-to {
  opacity: 1;
  transform: translateY(0) scale(1);
}
.float-leave-to {
  opacity: 0;
  transform: translateY(-80px) scale(1.5) translateX(10px);
}

/* Stripes background animation */
@keyframes stripes {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 40px 0;
  }
}
</style>
