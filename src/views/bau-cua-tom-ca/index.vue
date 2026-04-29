<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { Icon } from '@iconify/vue'
import { RouterLink } from 'vue-router'

// ─── Types ───────────────────────────────────────────────────────────────────
type DiceFace = 'bầu' | 'cua' | 'tôm' | 'cá' | 'gà' | 'nai'
type DiceIndex = 1 | 2 | 3 | 4 | 5 | 6

interface HistoryEntry {
  results: DiceFace[]
  time: string
}

// ─── Constants ───────────────────────────────────────────────────────────────
const DICE_MAP: Record<DiceIndex, DiceFace> = {
  1: 'bầu',
  2: 'gà',
  3: 'nai',
  4: 'tôm',
  5: 'cá',
  6: 'cua',
}

const SYMBOL_IMAGES: Record<DiceFace, string> = {
  bầu: '/bau-cua-tom-ca/bau.webp',
  cua: '/bau-cua-tom-ca/cua.webp',
  tôm: '/bau-cua-tom-ca/tom.webp',
  cá: '/bau-cua-tom-ca/ca.webp',
  gà: '/bau-cua-tom-ca/ga.webp',
  nai: '/bau-cua-tom-ca/nai.webp',
}

const SYMBOL_EMOJIS: Record<DiceFace, string> = {
  bầu: '🍐',
  cua: '🦀',
  tôm: '🦐',
  cá: '🐟',
  gà: '🐓',
  nai: '🦌',
}

// Face transforms for 3D dice cube
// side order: 1=bầu, 2=gà, 3=nai, 4=tôm, 5=cá, 6=cua
const SIDE_TRANSFORMS: string[] = [
  'translateZ(3.1em)', // face 1
  'rotateY(180deg) translateZ(3.1em)', // face 2
  'rotateY(-90deg) translateZ(3.1em)', // face 3
  'rotateX(90deg) translateZ(3.1em)', // face 4
  'rotateX(-90deg) translateZ(3.1em)', // face 5
  'rotateY(90deg) translateZ(3.1em)', // face 6
]

// Cube rotation to show each face
// Face positions in SIDE_TRANSFORMS: 1=front(+Z), 2=back(-Z), 3=left(-X), 4=top(+Y), 5=bottom(-Y), 6=right(+X)
// To show face N, rotate the cube so that face comes to the front:
//   face 1 (front)  → identity (no rotation)
//   face 2 (back)   → rotateX(180°) brings back to front
//   face 3 (left)   → rotateY(+90°) brings left to front
//   face 4 (top)    → rotateX(-90°) brings top to front
//   face 5 (bottom) → rotateX(+90°) brings bottom to front
//   face 6 (right)  → rotateY(-90°) brings right to front
const SHOW_TRANSFORMS: Record<DiceIndex, string> = {
  1: 'rotateX(720deg) rotateZ(-720deg)', // net: 0° — shows face 1 (bầu)
  2: 'rotateX(-900deg) rotateZ(1080deg)', // net: X=180° — shows face 2 (gà)
  3: 'rotateY(810deg) rotateZ(720deg)', // net: Y=+90° — shows face 3 (nai)
  4: 'rotateX(-810deg) rotateZ(-1080deg)', // net: X=-90° — shows face 4 (tôm)
  5: 'rotateX(450deg) rotateZ(-720deg)', // net: X=+90° — shows face 5 (cá)
  6: 'rotateY(-450deg) rotateZ(-1440deg)', // net: Y=-90° — shows face 6 (cua)
}

// ─── Reactive State ───────────────────────────────────────────────────────────
const diceResult = ref<[DiceIndex, DiceIndex, DiceIndex]>([1, 1, 1])
const diceTransforms = ref<[string, string, string]>([
  SHOW_TRANSFORMS[1],
  SHOW_TRANSFORMS[1],
  SHOW_TRANSFORMS[1],
])
const isRolling = ref(false)
const hasRolled = ref(false)
const showGame = ref(false)
const showHistoryPanel = ref(false)

const history = useLocalStorage<HistoryEntry[]>('bau-cua-history', [])

// ─── Computed ─────────────────────────────────────────────────────────────────
const resultNames = computed(() => diceResult.value.map((d) => DICE_MAP[d]))

const rolledFaceCounts = computed(() => {
  if (!hasRolled.value) return {}
  const counts: Partial<Record<DiceFace, number>> = {}
  for (const face of resultNames.value) {
    counts[face] = (counts[face] ?? 0) + 1
  }
  return counts
})

// ─── Game Logic ───────────────────────────────────────────────────────────────
function randomDice(): DiceIndex {
  return (Math.floor(Math.random() * 6) + 1) as DiceIndex
}

async function rollDice() {
  if (isRolling.value) return
  isRolling.value = true

  // Animate rolling: quickly cycle through random faces
  for (let i = 0; i < 12; i++) {
    await new Promise((resolve) => setTimeout(resolve, i * 15 + 60))
    const r1 = randomDice()
    const r2 = randomDice()
    const r3 = randomDice()
    diceTransforms.value = [SHOW_TRANSFORMS[r1], SHOW_TRANSFORMS[r2], SHOW_TRANSFORMS[r3]]
  }

  // Final result
  const f1 = randomDice()
  const f2 = randomDice()
  const f3 = randomDice()
  diceResult.value = [f1, f2, f3]
  diceTransforms.value = [SHOW_TRANSFORMS[f1], SHOW_TRANSFORMS[f2], SHOW_TRANSFORMS[f3]]

  isRolling.value = false
  hasRolled.value = true

  // Save to history
  const names: DiceFace[] = [DICE_MAP[f1], DICE_MAP[f2], DICE_MAP[f3]]
  const timeStr = new Date().toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  history.value = [{ results: names, time: timeStr }, ...history.value].slice(0, 50)
}

function clearHistory() {
  if (confirm('Bạn có chắc muốn xóa toàn bộ lịch sử không?')) {
    history.value = []
  }
}

onMounted(() => {
  // Set initial dice display
  diceTransforms.value = [SHOW_TRANSFORMS[1], SHOW_TRANSFORMS[1], SHOW_TRANSFORMS[1]]
})
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body relative overflow-x-hidden">
    <!-- ─── Header ─── -->
    <header
      class="border-b border-border-default bg-bg-surface/80 backdrop-blur-sm sticky top-0 z-40"
    >
      <div class="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <RouterLink
          to="/"
          class="flex items-center gap-2 text-text-secondary text-sm transition hover:text-accent-coral"
        >
          <Icon icon="lucide:arrow-left" class="size-4" />
          <span class="font-display tracking-wide">Trang chủ</span>
        </RouterLink>
        <div class="flex items-center gap-2">
          <span
            class="bg-accent-coral text-bg-deep font-display font-bold text-xs tracking-widest px-2.5 py-1 rotate-1"
          >
            TRÒ CHƠI
          </span>
          <h1
            class="font-display text-lg font-bold text-text-primary tracking-tight hidden sm:block"
          >
            Bầu Cua Tôm Cá
          </h1>
        </div>
        <button
          class="flex items-center gap-1.5 text-text-secondary text-sm border border-border-default px-3 py-1.5 transition hover:border-accent-amber hover:text-accent-amber"
          @click="showHistoryPanel = !showHistoryPanel"
        >
          <Icon icon="lucide:history" class="size-4" />
          <span class="font-display tracking-wide hidden sm:inline">Lịch sử</span>
          <span
            v-if="history.length > 0"
            class="bg-accent-coral text-bg-deep font-bold text-xs rounded-full size-4 flex items-center justify-center"
          >
            {{ history.length > 9 ? '9+' : history.length }}
          </span>
        </button>
      </div>
    </header>

    <!-- ─── History Drawer ─── -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 translate-x-full"
      enter-to-class="opacity-100 translate-x-0"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 translate-x-0"
      leave-to-class="opacity-0 translate-x-full"
    >
      <div
        v-if="showHistoryPanel"
        class="fixed top-0 right-0 h-full w-80 max-w-[90vw] bg-bg-surface border-l border-border-default z-50 flex flex-col shadow-2xl shadow-black/50"
      >
        <div class="flex items-center justify-between p-4 border-b border-border-default">
          <h2 class="font-display text-lg font-semibold text-text-primary flex items-center gap-2">
            <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
            Lịch Sử
          </h2>
          <button
            class="text-text-dim hover:text-text-primary transition"
            @click="showHistoryPanel = false"
          >
            <Icon icon="lucide:x" class="size-5" />
          </button>
        </div>
        <div class="flex-1 overflow-y-auto p-4 space-y-2">
          <div v-if="history.length === 0" class="text-center text-text-dim text-sm py-10">
            <Icon icon="lucide:scroll" class="size-10 mb-3 mx-auto opacity-40" />
            <p>Chưa có lịch sử tung xúc xắc</p>
          </div>
          <div
            v-for="(entry, i) in history"
            :key="i"
            class="border border-border-default bg-bg-elevated p-3 text-sm"
          >
            <div class="flex items-center justify-between mb-1.5">
              <span class="text-text-dim font-display text-xs tracking-wide"
                >#{{ history.length - i }}</span
              >
              <span class="text-text-dim text-xs">{{ entry.time }}</span>
            </div>
            <div class="flex items-center gap-2">
              <img
                v-for="(face, fi) in entry.results"
                :key="fi"
                :src="SYMBOL_IMAGES[face]"
                :alt="face"
                class="size-8 object-contain"
              />
              <span class="text-text-secondary text-xs ml-1 capitalize">
                {{ entry.results.join(' • ') }}
              </span>
            </div>
          </div>
        </div>
        <div class="p-4 border-t border-border-default">
          <button
            v-if="history.length > 0"
            class="w-full flex items-center justify-center gap-2 border border-border-default text-text-secondary text-sm py-2 transition hover:border-red-500/50 hover:text-red-400"
            @click="clearHistory"
          >
            <Icon icon="lucide:trash-2" class="size-4" />
            Xóa lịch sử
          </button>
        </div>
      </div>
    </Transition>

    <!-- Overlay when history is open -->
    <div
      v-if="showHistoryPanel"
      class="fixed inset-0 bg-black/40 z-40 backdrop-blur-[2px]"
      @click="showHistoryPanel = false"
    />

    <!-- ─── Hero / Landing ─── -->
    <Transition
      enter-active-class="transition duration-500 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-300 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <section
        v-if="!showGame"
        class="min-h-[calc(100vh-56px)] flex flex-col items-center justify-center px-4 py-12"
      >
        <!-- Decorative large symbols -->
        <div class="flex gap-3 mb-8 animate-fade-up">
          <img
            v-for="face in ['bầu', 'cua', 'tôm', 'cá', 'gà', 'nai'] as DiceFace[]"
            :key="face"
            :src="SYMBOL_IMAGES[face]"
            :alt="face"
            class="size-10 sm:size-14 object-contain opacity-70 hover:opacity-100 hover:scale-110 transition duration-200"
          />
        </div>

        <h1
          class="font-display text-5xl sm:text-7xl font-bold text-text-primary tracking-tight text-center animate-fade-up animate-delay-1 leading-tight"
        >
          Bầu Cua<br />
          <span class="text-accent-coral">Tôm Cá</span>
        </h1>
        <p
          class="mt-4 text-text-secondary text-center max-w-md text-lg animate-fade-up animate-delay-2"
        >
          Trò chơi dân gian truyền thống Việt Nam — Tung 3 xúc xắc và xem vận may của bạn!
        </p>

        <div class="flex gap-3 flex-wrap justify-center mt-8 animate-fade-up animate-delay-3">
          <span
            class="border border-border-default text-text-dim text-xs font-display tracking-wider px-3 py-1"
          >
            🎲 3 Xúc Xắc
          </span>
          <span
            class="border border-border-default text-text-dim text-xs font-display tracking-wider px-3 py-1"
          >
            🏆 Lịch sử
          </span>
          <span
            class="border border-accent-coral/30 text-accent-coral text-xs font-display tracking-wider px-3 py-1"
          >
            100% Free
          </span>
        </div>

        <button
          class="mt-10 animate-fade-up animate-delay-4 group relative overflow-hidden border-2 border-accent-coral bg-accent-coral/10 text-accent-coral font-display font-bold text-lg px-10 py-4 tracking-widest transition-all duration-300 hover:bg-accent-coral hover:text-bg-deep hover:shadow-lg hover:shadow-accent-coral/20"
          @click="showGame = true"
        >
          <span class="flex items-center gap-2">
            <Icon icon="lucide:dices" class="size-5" />
            CHƠI NGAY
          </span>
        </button>

        <!-- Dot divider -->
        <div class="flex gap-1.5 mt-12 animate-fade-up animate-delay-5">
          <span v-for="n in 30" :key="n" class="w-1 h-1 rounded-full bg-border-default" />
        </div>
      </section>
    </Transition>

    <!-- ─── Game Area ─── -->
    <Transition
      enter-active-class="transition duration-500 ease-out"
      enter-from-class="opacity-0 translate-y-4"
      enter-to-class="opacity-100 translate-y-0"
    >
      <section v-if="showGame" class="max-w-5xl mx-auto px-4 py-8">
        <!-- Section Title -->
        <div class="flex items-center justify-between mb-8">
          <h2 class="font-display text-2xl font-semibold text-text-primary flex items-center gap-3">
            <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
            Tung Xúc Xắc
          </h2>
          <button
            class="text-text-dim hover:text-text-secondary text-sm flex items-center gap-1.5 transition"
            @click="showGame = false"
          >
            <Icon icon="lucide:chevron-left" class="size-4" />
            Trở về
          </button>
        </div>

        <!-- ─── Betting Board (symbol grid) ─── -->
        <div class="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-8">
          <div
            v-for="face in ['bầu', 'cua', 'tôm', 'cá', 'gà', 'nai'] as DiceFace[]"
            :key="face"
            class="border border-border-default bg-bg-surface p-3 flex flex-col items-center gap-2 transition-all duration-300 relative overflow-hidden"
            :class="{
              'border-accent-coral bg-accent-coral/10 shadow-lg shadow-accent-coral/10':
                hasRolled && rolledFaceCounts[face],
              'border-border-default': !hasRolled || !rolledFaceCounts[face],
            }"
          >
            <img :src="SYMBOL_IMAGES[face]" :alt="face" class="size-12 object-contain" />
            <span class="font-display text-xs tracking-wider capitalize text-text-secondary">
              {{ face }}
            </span>
            <!-- Count badge -->
            <Transition
              enter-active-class="transition duration-300 scale-in"
              enter-from-class="scale-0 opacity-0"
              enter-to-class="scale-100 opacity-100"
            >
              <div
                v-if="hasRolled && rolledFaceCounts[face]"
                class="absolute top-1.5 right-1.5 bg-accent-coral text-bg-deep font-display font-bold text-xs size-5 flex items-center justify-center rounded-full"
              >
                {{ rolledFaceCounts[face] }}
              </div>
            </Transition>
          </div>
        </div>

        <!-- ─── 3D Dice ─── -->
        <div class="border border-border-default bg-bg-surface p-6 sm:p-8 mb-6">
          <!-- Dice 3D scene -->
          <div
            class="flex items-center justify-center gap-6 sm:gap-10 mb-8"
            style="perspective: 600px"
          >
            <div
              v-for="(transform, idx) in diceTransforms"
              :key="idx"
              class="dice"
              :style="{ transform }"
            >
              <div
                v-for="(sideTransform, si) in SIDE_TRANSFORMS"
                :key="si"
                class="dice-side"
                :style="{ transform: sideTransform }"
              >
                <img
                  :src="SYMBOL_IMAGES[DICE_MAP[(si + 1) as DiceIndex]]"
                  :alt="DICE_MAP[(si + 1) as DiceIndex]"
                  class="w-full h-full object-contain p-1.5"
                />
              </div>
            </div>
          </div>

          <!-- Roll Button -->
          <div class="flex justify-center">
            <button
              class="group relative overflow-hidden font-display font-bold text-lg px-12 py-4 tracking-widest transition-all duration-300 border-2 disabled:opacity-50 disabled:cursor-not-allowed"
              :class="
                isRolling
                  ? 'border-accent-amber text-accent-amber bg-accent-amber/10 cursor-wait'
                  : 'border-accent-coral text-accent-coral bg-accent-coral/10 hover:bg-accent-coral hover:text-bg-deep hover:shadow-lg hover:shadow-accent-coral/20'
              "
              :disabled="isRolling"
              @click="rollDice"
            >
              <span class="flex items-center gap-2">
                <Icon
                  icon="lucide:dices"
                  class="size-5 transition-transform duration-300"
                  :class="isRolling ? 'animate-spin' : 'group-hover:rotate-12'"
                />
                {{ isRolling ? 'Đang tung...' : 'Tung Xúc Xắc!' }}
              </span>
            </button>
          </div>
        </div>

        <!-- ─── Result Display ─── -->
        <Transition
          enter-active-class="transition duration-500 ease-out"
          enter-from-class="opacity-0 translate-y-2"
          enter-to-class="opacity-100 translate-y-0"
        >
          <div
            v-if="hasRolled && !isRolling"
            class="border border-accent-amber/30 bg-bg-surface p-5 mb-6"
          >
            <div class="flex items-center gap-3 mb-3">
              <span class="text-accent-amber font-display text-sm tracking-widest">//</span>
              <span class="font-display text-sm tracking-wide text-text-secondary">KẾT QUẢ</span>
            </div>
            <div class="flex items-center gap-4 flex-wrap">
              <div
                v-for="(face, fi) in resultNames"
                :key="fi"
                class="flex items-center gap-2 border border-border-default bg-bg-elevated px-3 py-2"
              >
                <img :src="SYMBOL_IMAGES[face]" :alt="face" class="size-8 object-contain" />
                <span class="font-display font-semibold text-text-primary capitalize tracking-wide">
                  {{ face }} {{ SYMBOL_EMOJIS[face] }}
                </span>
              </div>
            </div>
            <p class="mt-3 text-text-dim text-sm">
              {{ resultNames.join(' • ') }}
            </p>
          </div>
        </Transition>

        <!-- ─── Symbol Reference Legend ─── -->
        <div class="border border-border-default bg-bg-surface p-5">
          <h3
            class="font-display text-sm font-semibold text-text-secondary flex items-center gap-2 mb-3"
          >
            <span class="text-accent-sky tracking-widest">//</span>
            Bảng biểu tượng
          </h3>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div v-for="(face, key) in DICE_MAP" :key="key" class="flex items-center gap-2 text-sm">
              <img :src="SYMBOL_IMAGES[face]" :alt="face" class="size-7 object-contain" />
              <span class="text-text-secondary capitalize font-display tracking-wide">{{
                face
              }}</span>
              <span class="text-text-dim text-xs ml-3">Mặt {{ key }}</span>
            </div>
          </div>
        </div>
      </section>
    </Transition>

    <!-- ─── Footer ─── -->
    <footer class="border-t border-border-default mt-auto">
      <div
        class="max-w-5xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3"
      >
        <p class="text-text-dim text-xs font-display tracking-wide">
          © {{ new Date().getFullYear() }} — Bầu Cua Tôm Cá
        </p>
        <a
          href="https://www.facebook.com/ntd1683/"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-1.5 text-text-dim text-xs hover:text-accent-sky transition font-display tracking-wide"
        >
          <Icon icon="lucide:user" class="size-3" />
          Made by NTD
        </a>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* ─── 3D Dice ─── */
.dice {
  position: relative;
  width: 90px;
  height: 90px;
  transform-style: preserve-3d;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

@media (min-width: 640px) {
  .dice {
    width: 110px;
    height: 110px;
  }
}

.dice-side {
  position: absolute;
  inset: 0;
  background-color: #1e2f42;
  border: 2px solid #253549;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  backface-visibility: hidden;
  box-shadow: inset 0 0 12px rgba(0, 0, 0, 0.3);
}

.dice-side img {
  width: 70%;
  height: 70%;
  object-fit: contain;
}

/* Rolling animation */
@keyframes dice-shake {
  0%,
  100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-5deg) scale(1.05);
  }
  75% {
    transform: rotate(5deg) scale(1.05);
  }
}

/* Scale-in for badge */
@keyframes scale-in {
  from {
    transform: scale(0);
  }
  to {
    transform: scale(1);
  }
}

.scale-in {
  animation: scale-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}
</style>
