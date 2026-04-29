<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useGame } from './useGame'
import { BOARD_WIDTH, BOARD_HEIGHT, FRUIT_TYPES } from './config'

const boardRef = ref<HTMLElement | null>(null)

const {
  fruits, score, highScore, gameStatus, currentFruitType, nextFruitType, dropX,
  startGame, dropFruit, updateDropPosition
} = useGame()

onMounted(() => {
  startGame()
})

// Hàm xử lý khi bắt đầu chạm ngón tay / click chuột
const handlePointerDown = (e: PointerEvent) => {
  if (boardRef.value) {
    // Bắt giữ sự kiện cảm ứng: Giúp vuốt tay ra ngoài viền game vẫn không bị kẹt
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    updateDropPosition(e, boardRef.value.getBoundingClientRect())
  }
}

// Hàm xử lý khi vuốt / di chuột
const handlePointerMove = (e: PointerEvent) => {
  if (boardRef.value) {
    updateDropPosition(e, boardRef.value.getBoundingClientRect())
  }
}

// Hàm xử lý khi nhấc ngón tay / nhả chuột
const handlePointerUp = (e: PointerEvent) => {
  if (boardRef.value) {
    // Giải phóng bắt giữ và thả trái cây
    ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
    dropFruit()
  }
}

// Hàm xử lý chơi lại và cuộn lên đầu trang
const handleRestart = () => {
  startGame()
  // Cuộn mượt mà lên vị trí cao nhất của trình duyệt
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col items-center py-4 px-4 relative overflow-hidden">
    <div class="max-w-5xl w-full mx-auto relative z-10">

      <div class="grid lg:grid-cols-[1fr_300px] gap-3 items-center mb-5 animate-fade-up">

        <div class="flex justify-center w-full">
          <h1 class="font-display text-4xl font-bold text-accent-coral tracking-tight uppercase text-center">FRUITS DROP</h1>
        </div>

        <div class="flex flex-wrap justify-center lg:justify-start items-stretch gap-2 sm:gap-1">

          <div class="border border-border-default bg-bg-surface px-3 py-2 w-[70px] sm:w-[70px] text-center shadow-lg hover:border-accent-sky transition-colors flex flex-col justify-between">
            <p class="text-xs text-text-dim font-display tracking-widest mb-1">NEXT</p>
            <div class="font-display text-2xl font-bold flex-1 flex items-center justify-center" :class="nextFruitType.color">
              <span class="filter drop-shadow-md leading-none">{{ nextFruitType.icon }}</span>
            </div>
          </div>

          <div class="border border-border-default bg-bg-surface px-6 py-2 w-[100px] sm:w-[100px] text-center shadow-lg hover:border-accent-amber transition-colors flex flex-col justify-between">
            <p class="text-xs text-text-dim font-display tracking-widest mb-1">SCORE</p>
            <p class="font-display text-2xl font-bold text-accent-amber leading-none flex-1 flex items-center justify-center">{{ score }}</p>
          </div>

          <div class="border border-border-default bg-bg-surface px-6 py-2 w-[120px] sm:w-[120px] text-center shadow-lg hover:border-accent-coral transition-colors flex flex-col justify-between">
            <p class="text-xs text-text-dim font-display tracking-widest mb-1">HIGHSCORE</p>
            <p class="font-display text-2xl font-bold text-accent-coral leading-none flex-1 flex items-center justify-center">{{ highScore }}</p>
          </div>

        </div>
      </div>

      <div class="grid lg:grid-cols-[1fr_300px] gap-8 items-start animate-fade-up animate-delay-2">
        <div class="flex justify-center w-full relative">
          <div
            ref="boardRef"
            class="relative border-2 border-border-default bg-bg-surface shadow-2xl overflow-hidden touch-none cursor-crosshair group hover:border-accent-sky/50 transition-colors"
            :style="{ width: '100%', maxWidth: `${BOARD_WIDTH}px`, aspectRatio: `${BOARD_WIDTH}/${BOARD_HEIGHT}` }"
            @pointerdown.prevent="handlePointerDown"
            @pointermove.prevent="handlePointerMove"
            @pointerup.prevent="handlePointerUp"
          >
            <div
              v-if="gameStatus === 'gameover'"
              class="absolute inset-0 z-50 bg-bg-deep/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 border-2 border-accent-coral animate-fade-up"
            >
              <h3 class="font-display text-3xl font-bold mb-2 tracking-tight uppercase text-accent-coral">
                Chống Thể Bị Đầy
              </h3>
              <p class="text-text-secondary font-body text-center mb-8 text-sm max-w-[250px]">
                Khu vực lưu trữ đã quá tải. Thu thập được {{ score }} năng lượng lượng tử.
              </p>
              <button
                @click="handleRestart"
                class="border border-accent-coral bg-accent-coral/10 text-accent-coral font-display font-semibold tracking-widest py-3 px-6 transition-all hover:bg-accent-coral hover:text-bg-deep active:scale-[0.98]"
              >
                KHỞI ĐỘNG LẠI CHU KỲ
              </button>
            </div>

            <div class="absolute top-[50px] left-0 right-0 border-t border-dashed border-accent-coral/30 z-0"></div>

            <div
              v-if="gameStatus === 'playing'"
              class="absolute z-20 flex items-center justify-center pointer-events-none transition-transform duration-75"
              :class="currentFruitType.color"
              :style="{
                left: `${(dropX / BOARD_WIDTH) * 100}%`,
                top: '0px',
                width: `${(currentFruitType.radius * 2 / BOARD_WIDTH) * 100}%`,
                height: `${(currentFruitType.radius * 2 / BOARD_HEIGHT) * 100}%`,
                transform: 'translate(-50%, 0)'
              }"
            >
              <svg viewBox="0 0 100 100" class="w-full h-full overflow-visible filter drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
                <text x="50" y="50" dominant-baseline="central" text-anchor="middle" font-size="80">{{ currentFruitType.icon }}</text>
              </svg>
              <div class="absolute top-full left-1/2 w-[1px] h-[600px] bg-text-dim/20 -translate-x-1/2 hidden group-hover:block"></div>
            </div>

            <div
              v-for="fruit in fruits"
              :key="fruit.id"
              class="absolute flex items-center justify-center select-none rounded-full border border-current/20 bg-current/5 shadow-[inset_0_0_10px_currentColor]"
              :class="fruit.colorClass"
              :style="{
                left: `${(fruit.x / BOARD_WIDTH) * 100}%`,
                top: `${(fruit.y / BOARD_HEIGHT) * 100}%`,
                width: `${(fruit.radius * 2 / BOARD_WIDTH) * 100}%`,
                height: `${(fruit.radius * 2 / BOARD_HEIGHT) * 100}%`,
                transform: 'translate(-50%, -50%)'
              }"
            >
              <svg viewBox="0 0 100 100" class="w-full h-full overflow-visible">
                <text x="50" y="54" dominant-baseline="central" text-anchor="middle" font-size="75">{{ fruit.icon }}</text>
              </svg>
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-6 w-full max-w-[500px] mx-auto lg:mx-0 animate-fade-up animate-delay-3">
          <div class="border border-border-default bg-bg-surface p-6 transition-all duration-300 hover:border-accent-sky relative overflow-hidden group">
            <span class="absolute top-3 right-4 font-display text-6xl font-bold text-accent-sky/5 select-none pointer-events-none transition-transform group-hover:scale-110">01</span>

            <h2 class="font-display text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <span class="text-accent-sky font-display text-sm tracking-widest">//</span>
              Sơ đồ tiến hóa
            </h2>

            <div class="flex flex-wrap items-center gap-x-1.5 gap-y-3">
              <template v-for="(fruit, index) in FRUIT_TYPES" :key="fruit.id">

                <div
                  class="flex flex-col items-center justify-center relative group/item"
                  :title="`Cấp ${fruit.id}: +${fruit.score} điểm`"
                >
                  <div
                    class="w-10 h-10 rounded-full border border-border-default bg-bg-deep flex items-center justify-center shadow-inner group-hover/item:border-current transition-colors cursor-help"
                    :class="fruit.color"
                  >
                    <span class="text-xl filter drop-shadow-md leading-none">{{ fruit.icon }}</span>
                  </div>
                </div>

                <span v-if="index < FRUIT_TYPES.length - 1" class="text-white text-[15px] font-display">&#10141; </span>

              </template>
            </div>
          </div>

          <div class="border border-border-default bg-bg-surface p-6 transition-all duration-300 hover:border-accent-coral relative overflow-hidden group">
            <span class="absolute top-3 right-4 font-display text-6xl font-bold text-accent-coral/5 select-none pointer-events-none transition-transform group-hover:scale-110">02</span>

            <h2 class="font-display text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
              Cơ chế hoạt động
            </h2>
            <ul class="text-sm font-body text-text-secondary space-y-3 leading-relaxed">
              <li class="flex gap-1"><span class="text-accent-amber">▸</span> Di chuyển con trỏ hoặc vuốt để chọn vị trí.</li>
              <li class="flex gap-1"><span class="text-accent-amber">▸</span> Thả ra để thả hoa quả.</li>
              <li class="flex gap-1"><span class="text-accent-amber">▸</span> Hoa quả cùng loại chạm nhau sẽ hợp nhất.</li>
              <li class="flex gap-1"><span class="text-accent-amber">▸</span> Chạm vạch giới hạn sẽ thua!</li>
            </ul>
          </div>

          <div class="flex flex-col gap-3">
            <button
              @click="handleRestart"
              class="w-full border border-border-default bg-transparent text-text-secondary font-display font-semibold tracking-wide py-3 px-4 transition-all hover:border-accent-amber hover:text-accent-amber active:scale-[0.98]"
            >
              HỦY VÀ CHƠI LẠI
            </button>
            <RouterLink
              to="/"
              class="w-full text-center border border-border-default bg-bg-surface text-text-secondary font-display font-semibold tracking-wide py-3 px-4 transition-all hover:border-accent-coral hover:text-text-primary active:scale-[0.98]"
            >
              &larr; QUAY LẠI TRANG CHỦ
            </RouterLink>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>
