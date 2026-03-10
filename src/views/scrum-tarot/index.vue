<template>
  <div class="min-h-screen bg-[#050510] text-text-primary font-body relative overflow-hidden">
    <!-- Nền vũ trụ tâm linh có các hạt nhiễu (stars/dust) -->
    <div
      class="absolute inset-0 pointer-events-none opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxmaWx0ZXIgaWQ9Im4iPjxmZVR1cmJ1bGVuY2UgdHlwZT0iZnJhY3RhbE5vaXNlIiBiYXNlRnJlcXVlbmN5PSIwLjk5IiBudW1PY3RhdmVzPSIxIiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI24pIiBvcGFjaXR5PSIwLjA1Ii8+PC9zdmc+')]"
    ></div>

    <header
      class="w-full flex items-center justify-between px-6 py-4 border-b border-white/5 relative z-10"
    >
      <RouterLink
        to="/"
        class="font-display text-sm tracking-widest text-text-secondary hover:text-accent-coral transition-colors"
      >
        RETURN /
      </RouterLink>
      <div
        class="bg-purple-900 text-purple-100 font-display font-black text-xs tracking-widest px-3 py-1.5 rotate-2 shadow-[0_0_15px_#581c87]"
      >
        ARCANA / 2026
      </div>
    </header>

    <main class="max-w-6xl mx-auto px-6 py-12 relative z-10 flex flex-col items-center">
      <!-- Tiêu đề -->
      <div class="text-center mb-10 animate-fade-up">
        <h1 class="font-display text-5xl md:text-7xl font-bold tracking-tight">
          <span class="text-purple-500 font-display text-base tracking-widest block mb-1"
            >✧ THE ARCANA OF AGILE ✧</span
          >
          <span class="text-gray-100 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">Scrum_</span>
          <span class="text-purple-400 animate-pulse">Tarot</span>
        </h1>
        <p class="mt-4 text-purple-200/80 text-lg">
          Trải Bài Vận Mệnh Sprint. Xem tương lai bạn có OT rẽ đất không?
        </p>
      </div>

      <!-- Khu vực trải bài -->
      <div class="w-full mb-12 relative">
        <!-- Đường Line huyền bí chia bài -->
        <div
          class="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent -translate-y-1/2"
        ></div>

        <div
          class="flex flex-col md:flex-row justify-center items-center gap-6 md:gap-10 relative z-10"
        >
          <!-- Lặp 3 lá bài -->
          <div
            v-for="(slot, i) in spread"
            :key="i"
            class="flex flex-col items-center w-64 origin-bottom transition-all duration-700 hover:-translate-y-4 hover:scale-105"
          >
            <!-- Tiêu đề Vị trí trải bài -->
            <div class="mb-4 text-center h-8">
              <span
                v-if="hasDrawn"
                class="font-display text-xs tracking-widest text-purple-300/80 uppercase"
              >
                ✧ {{ slot.positionName }} ✧
              </span>
            </div>

            <!-- Lá bài container (Dùng 3D Transform) -->
            <div
              class="relative w-full aspect-[2/3] cursor-pointer perspective-1000 group"
              @click="flipCard(i)"
            >
              <div
                class="w-full h-full relative transition-transform duration-[800ms] preserve-3d"
                :class="slot.isFlipped ? 'rotate-y-180' : ''"
              >
                <!-- Mặt Úp (Mặt lưng bài) -->
                <div
                  class="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br from-gray-900 to-purple-950 border border-purple-500/30 rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.1)] flex flex-col items-center justify-center p-4 ring-1 ring-inset ring-white/5"
                  :class="{
                    'animate-pulse border-purple-400 shadow-[0_0_30px_rgba(168,85,247,0.3)]':
                      hasDrawn && !slot.isFlipped,
                  }"
                >
                  <div
                    class="w-full h-full border border-purple-500/20 rounded-lg flex items-center justify-center bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMTgiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgxNjgsODUsMjQ3LDAuMikiIHN0cm9rZS13aWR0aD0iMSIvPjwvc3ZnPg==')] hover:bg-[length:40px_40px]"
                  >
                    <span class="text-4xl text-purple-700/50">👁️‍🗨️</span>
                  </div>
                </div>

                <!-- Mặt Lật (Kết quả) -->
                <div
                  class="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-xl flex flex-col items-center justify-center p-1"
                  :class="
                    slot.card?.color
                      ? `shadow-[0_0_40px_currentColor] ${slot.card.color}`
                      : 'shadow-lg border-gray-600'
                  "
                  style="background: #111; border: 2px solid currentColor"
                >
                  <!-- Pattern rùng rợn lúc lật ngược -->
                  <div
                    class="w-full h-full border border-current/20 rounded-lg p-4 flex flex-col relative overflow-hidden bg-gradient-to-b from-transparent to-black/80"
                    :class="slot.isReversed ? 'rotate-180' : ''"
                  >
                    <!-- Text Arcana -->
                    <div class="text-center mt-2 z-10">
                      <p class="font-display text-[10px] tracking-[0.3em] opacity-70 uppercase">
                        {{ slot.card?.arcana }}
                      </p>
                    </div>

                    <!-- Icon khổng lồ -->
                    <div class="flex-1 flex items-center justify-center z-10 relative">
                      <span
                        class="text-7xl group-hover:scale-110 transition-transform duration-500 drop-shadow-[0_0_15px_currentColor]"
                      >
                        {{ slot.card?.icon }}
                      </span>
                    </div>

                    <!-- Tên lá bài -->
                    <div class="text-center mb-2 z-10">
                      <p
                        class="font-bold font-display text-sm tracking-wider uppercase border-t border-b border-current/30 py-1 bg-black/50 backdrop-blur-sm shadow-[0_0_10px_#000]"
                      >
                        {{ slot.card?.name }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Nơi hiển thị Lời Phán (hiện sau khi lật) -->
            <div class="mt-6 w-full text-center h-48">
              <Transition name="fade-slide">
                <div
                  v-if="slot.isFlipped && slot.card"
                  class="bg-gray-900/80 border border-white/10 p-4 rounded text-sm text-gray-300"
                >
                  <div class="mb-2 flex items-center justify-center gap-2">
                    <span
                      class="w-1.5 h-1.5 rounded-full"
                      :class="slot.isReversed ? 'bg-red-500' : 'bg-green-500'"
                    ></span>
                    <span
                      class="font-display text-xs tracking-widest uppercase font-bold text-gray-400"
                    >
                      {{ slot.isReversed ? 'Tương Nghịch (Reversed)' : 'Tương Thuận (Upright)' }}
                    </span>
                  </div>
                  <p class="italic leading-relaxed">
                    "{{ slot.isReversed ? slot.card.reversedMeaning : slot.card.uprightMeaning }}"
                  </p>
                </div>
              </Transition>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Button -->
      <div class="mt-4 mb-8 animate-fade-up animate-delay-2 flex flex-col items-center z-20">
        <button
          v-if="!hasDrawn"
          class="relative border border-purple-500/50 bg-[#150a21] px-10 py-4 font-display text-lg tracking-widest text-purple-200 transition-all duration-300 hover:bg-purple-900 hover:text-white hover:border-purple-400 hover:shadow-[0_0_30px_#7e22ce] active:scale-95 cursor-pointer uppercase font-bold"
          @click="drawCards"
        >
          <span class="relative z-10 flex items-center gap-2"> 👁️ TỤ KHÍ SPRINT — RÚT BÀI </span>
        </button>
        <button
          v-else-if="allFlipped"
          class="relative border border-gray-600 bg-gray-900 px-6 py-3 font-display text-sm tracking-widest text-gray-400 transition-all duration-300 hover:bg-white hover:text-black cursor-pointer uppercase animate-fade-in"
          @click="resetDeck"
        >
          TẨY UẾ BÀI — RÚT LẠI TỪ TOU
        </button>
      </div>

      <div class="flex gap-1.5 justify-center opacity-30">
        <span v-for="n in 30" :key="n" class="w-1 h-1 rounded-full bg-border-default" />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { tarotCards, type TarotCard } from './data/cards'

interface SpreadSlot {
  positionName: string
  card: TarotCard | null
  isReversed: boolean
  isFlipped: boolean
}

// 3 Vị trí trải bài bói Scrum
const POSITIONS = [
  'Quá Khứ (Bớt Bug Trị Nghiệp)',
  'Hiện Tại (Sprint Này)',
  'Tương Lai (Deploy Thứ 6)',
]

const spread = ref<SpreadSlot[]>([
  { positionName: POSITIONS[0]!, card: null, isReversed: false, isFlipped: false },
  { positionName: POSITIONS[1]!, card: null, isReversed: false, isFlipped: false },
  { positionName: POSITIONS[2]!, card: null, isReversed: false, isFlipped: false },
])

const hasDrawn = ref(false)

const allFlipped = computed(() => {
  return hasDrawn.value && spread.value.every((s) => s.isFlipped)
})

// Xáo bài logic
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[newArray[i], newArray[j]] = [newArray[j]!, newArray[i]!]
  }
  return newArray
}

const drawCards = () => {
  if (hasDrawn.value) return

  // Bốc 3 con ngẫu nhiên
  const shuffledDeck = shuffleArray(tarotCards)

  spread.value = spread.value.map((slot, i) => ({
    ...slot,
    card: shuffledDeck[i]!,
    isReversed: Math.random() > 0.5, // Tỷ lệ úp ngửa ngẫu nhiên chuẩn Tarot
    isFlipped: false,
  }))

  hasDrawn.value = true
}

// Lật bài
const flipCard = (index: number) => {
  if (!hasDrawn.value) return
  const slot = spread.value[index]
  if (slot && !slot.isFlipped) {
    slot.isFlipped = true
  }
}

// Chơi lại
const resetDeck = () => {
  hasDrawn.value = false
  spread.value = spread.value.map((slot, i) => ({
    positionName: POSITIONS[i]!,
    card: null,
    isReversed: false,
    isFlipped: false,
  }))
}
</script>

<style scoped>
/* Flip 3D classes */
.perspective-1000 {
  perspective: 1000px;
}

.preserve-3d {
  transform-style: preserve-3d;
}

.backface-hidden {
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.rotate-y-180 {
  transform: rotateY(180deg);
}

/* Transitions */
.fade-slide-enter-active {
  transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  transition-delay: 0.2s;
  /* Đợi lật bài xong tí mới hiện chữ */
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.fade-slide-enter-to {
  opacity: 1;
  transform: translateY(0);
}

.animate-fade-in {
  animation: fadeIn 1s ease forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}
</style>
