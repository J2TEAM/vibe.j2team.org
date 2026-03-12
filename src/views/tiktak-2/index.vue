<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useGame } from './composables/use-game'

const {
  rows,
  cols,
  board,
  isPlayerTurn,
  gameStatus,
  difficulty,
  score,
  statusMessage,
  isGameOver,
  startGame,
  backToSetup,
  resetGame,
  resetScore,
  handleCellClick,
  setPresetSize,
} = useGame()

const presetSizes = [3, 4, 5]

const difficulties = [
  { value: 'easy' as const, label: 'Dễ', color: 'text-accent-amber' },
  { value: 'medium' as const, label: 'Trung bình', color: 'text-accent-sky' },
  { value: 'hard' as const, label: 'Khó', color: 'text-accent-coral' },
]

const boardGridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${cols.value}, 1fr)`,
}))

const cellSize = computed(() => {
  const total = rows.value * cols.value
  if (total > 49) return 'w-8 h-8 text-sm'
  if (total > 25) return 'w-10 h-10 text-base'
  return 'w-14 h-14 text-2xl sm:w-16 sm:h-16 sm:text-3xl'
})
</script>

<template>
  <div
    class="tic-tac-toe-page min-h-screen bg-bg-deep text-text-primary font-body relative overflow-hidden"
  >
    <!-- Scanline overlay -->
    <div class="pointer-events-none fixed inset-0 z-50 scanline-overlay" aria-hidden="true" />

    <div class="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <!-- Hero -->
      <header class="mb-12 text-center animate-fade-up">
        <h1
          class="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-accent-coral title-glow tracking-tight"
        >
          TIC-TAC-TOE AI
        </h1>
        <p class="mt-3 text-text-secondary text-sm sm:text-base tracking-wide">
          Đấu trí cùng AI — bạn có thể thắng không?
        </p>
      </header>

      <!-- ============ SETUP SCREEN ============ -->
      <template v-if="gameStatus === 'setup'">
        <!-- Board size -->
        <section class="mb-8 animate-fade-up animate-delay-1">
          <h2 class="font-display text-lg font-semibold flex items-center gap-2 mb-4">
            <span class="text-accent-coral text-xs tracking-widest font-display">//</span>
            KÍCH THƯỚC
          </h2>
          <div class="border border-border-default bg-bg-surface p-5">
            <!-- Presets -->
            <div class="flex gap-2 mb-4">
              <button
                v-for="size in presetSizes"
                :key="size"
                class="flex-1 border py-2 font-display text-sm font-semibold transition-all duration-300"
                :class="
                  rows === size && cols === size
                    ? 'border-accent-coral bg-accent-coral/10 text-accent-coral preset-glow'
                    : 'border-border-default text-text-dim hover:border-accent-coral/50 hover:text-text-secondary'
                "
                @click="setPresetSize(size)"
              >
                {{ size }}×{{ size }}
              </button>
            </div>
            <!-- Custom -->
            <div class="flex items-center gap-3">
              <div class="flex-1">
                <label class="block text-text-dim text-xs mb-1 font-display tracking-wide"
                  >HÀNG</label
                >
                <input
                  v-model.number="rows"
                  type="number"
                  min="3"
                  max="10"
                  class="w-full bg-bg-elevated border border-border-default px-3 py-2 text-sm text-text-primary text-center font-mono focus:border-accent-coral focus:outline-none transition"
                />
              </div>
              <span class="text-text-dim mt-5">×</span>
              <div class="flex-1">
                <label class="block text-text-dim text-xs mb-1 font-display tracking-wide"
                  >CỘT</label
                >
                <input
                  v-model.number="cols"
                  type="number"
                  min="3"
                  max="10"
                  class="w-full bg-bg-elevated border border-border-default px-3 py-2 text-sm text-text-primary text-center font-mono focus:border-accent-coral focus:outline-none transition"
                />
              </div>
            </div>
          </div>
        </section>

        <!-- Difficulty -->
        <section class="mb-8 animate-fade-up animate-delay-2">
          <h2 class="font-display text-lg font-semibold flex items-center gap-2 mb-4">
            <span class="text-accent-sky text-xs tracking-widest font-display">//</span>
            ĐỘ KHÓ
          </h2>
          <div class="border border-border-default bg-bg-surface p-5">
            <div class="flex gap-2">
              <button
                v-for="d in difficulties"
                :key="d.value"
                class="flex-1 border py-2.5 font-display text-sm font-semibold transition-all duration-300"
                :class="
                  difficulty === d.value
                    ? `border-current bg-current/10 ${d.color} difficulty-glow`
                    : 'border-border-default text-text-dim hover:text-text-secondary'
                "
                @click="difficulty = d.value"
              >
                {{ d.label }}
              </button>
            </div>
          </div>
        </section>

        <!-- Start -->
        <div class="text-center animate-fade-up animate-delay-3">
          <button
            class="bg-accent-coral text-bg-deep font-display font-bold text-lg px-10 py-3 transition-all duration-300 hover:shadow-lg hover:shadow-accent-coral/30 start-glow active:scale-95"
            @click="startGame"
          >
            <Icon icon="lucide:zap" class="inline size-5 -mt-0.5 mr-1" />
            KHỞI ĐỘNG
          </button>
          <p class="mt-3 text-text-dim text-xs">Bàn cờ từ 3×3 đến 10×10</p>
        </div>
      </template>

      <!-- ============ GAME SCREEN ============ -->
      <template v-else>
        <!-- Status -->
        <div class="mb-6 animate-fade-up animate-delay-1">
          <div
            class="border bg-bg-surface p-4 text-center transition-colors duration-300"
            :class="
              isGameOver
                ? gameStatus === 'playerWins'
                  ? 'border-accent-coral'
                  : gameStatus === 'aiWins'
                    ? 'border-accent-sky'
                    : 'border-accent-amber'
                : 'border-border-default'
            "
          >
            <div class="flex items-center justify-center gap-2">
              <span
                v-if="!isPlayerTurn && !isGameOver"
                class="inline-block w-1.5 h-4 bg-accent-sky animate-pulse"
              />
              <span class="font-display text-lg font-semibold tracking-wide">
                {{ statusMessage }}
              </span>
            </div>
          </div>
        </div>

        <!-- Board -->
        <div class="flex justify-center mb-6 animate-fade-up animate-delay-2">
          <div class="relative">
            <!-- Corner brackets -->
            <div
              class="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-accent-coral/50"
            />
            <div
              class="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-accent-coral/50"
            />
            <div
              class="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-accent-coral/50"
            />
            <div
              class="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-accent-coral/50"
            />

            <!-- Grid -->
            <div
              class="grid gap-1 p-2 bg-bg-surface border border-border-default board-glow"
              :style="boardGridStyle"
            >
              <button
                v-for="(cell, index) in board"
                :key="index"
                class="flex items-center justify-center font-display font-bold transition-all duration-200 border border-border-default bg-bg-elevated"
                :class="[
                  cellSize,
                  cell === null && isPlayerTurn && !isGameOver
                    ? 'hover:bg-bg-surface hover:border-accent-coral/50 hover:scale-105 cursor-pointer'
                    : 'cursor-default',
                  cell === 'X' ? 'text-accent-coral x-glow' : '',
                  cell === 'O' ? 'text-accent-sky o-glow' : '',
                ]"
                :disabled="cell !== null || !isPlayerTurn || isGameOver"
                @click="handleCellClick(index)"
              >
                <span v-if="cell" class="cell-mark">{{ cell }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Scoreboard -->
        <div class="mb-6 animate-fade-up animate-delay-3">
          <div class="border border-border-default bg-bg-surface p-4">
            <div class="flex items-center justify-between mb-2">
              <h3 class="font-display text-xs tracking-widest text-text-dim">
                <span class="text-accent-amber">//</span> BẢNG ĐIỂM
              </h3>
              <button
                class="text-text-dim text-xs hover:text-accent-coral transition-colors flex items-center gap-1"
                @click="resetScore"
              >
                <Icon icon="lucide:rotate-ccw" class="size-3" />
                Reset
              </button>
            </div>
            <div class="grid grid-cols-3 gap-3">
              <div class="text-center">
                <div class="font-display text-2xl font-bold text-accent-coral tabular-nums">
                  {{ score.wins }}
                </div>
                <div class="text-text-dim text-xs font-display tracking-wide">THẮNG</div>
              </div>
              <div class="text-center">
                <div class="font-display text-2xl font-bold text-accent-sky tabular-nums">
                  {{ score.losses }}
                </div>
                <div class="text-text-dim text-xs font-display tracking-wide">THUA</div>
              </div>
              <div class="text-center">
                <div class="font-display text-2xl font-bold text-accent-amber tabular-nums">
                  {{ score.draws }}
                </div>
                <div class="text-text-dim text-xs font-display tracking-wide">HÒA</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Controls -->
        <div class="flex flex-col sm:flex-row gap-2 mb-8 animate-fade-up animate-delay-4">
          <button
            v-if="isGameOver"
            class="flex-1 border border-accent-coral bg-accent-coral/10 text-accent-coral font-display font-semibold py-2.5 text-sm transition-all hover:bg-accent-coral/20 flex items-center justify-center gap-2"
            @click="resetGame"
          >
            <Icon icon="lucide:refresh-cw" class="size-4" />
            CHƠI LẠI ({{ rows }}×{{ cols }})
          </button>
          <button
            class="flex-1 border border-border-default text-text-secondary font-display font-semibold py-2.5 text-sm transition-all hover:border-accent-sky hover:text-accent-sky flex items-center justify-center gap-2"
            @click="backToSetup"
          >
            <Icon icon="lucide:settings-2" class="size-4" />
            ĐỔI BÀN CỜ
          </button>
        </div>
      </template>

      <!-- Back to home -->
      <div
        class="text-center animate-fade-up"
        :class="gameStatus === 'setup' ? 'mt-12 animate-delay-4' : 'animate-delay-5'"
      >
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-5 py-2.5 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
        >
          <Icon icon="lucide:arrow-left" class="size-4" />
          Về trang chủ
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Scanline overlay */
.scanline-overlay {
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(56, 189, 248, 0.015) 2px,
    rgba(56, 189, 248, 0.015) 4px
  );
}

/* Neon glow effects */
.title-glow {
  text-shadow:
    0 0 20px rgba(255, 107, 74, 0.3),
    0 0 40px rgba(255, 107, 74, 0.1);
}

.x-glow {
  text-shadow:
    0 0 8px rgba(255, 107, 74, 0.6),
    0 0 20px rgba(255, 107, 74, 0.3);
}

.o-glow {
  text-shadow:
    0 0 8px rgba(56, 189, 248, 0.6),
    0 0 20px rgba(56, 189, 248, 0.3);
}

.board-glow {
  box-shadow:
    0 0 15px rgba(56, 189, 248, 0.05),
    0 0 30px rgba(56, 189, 248, 0.02);
}

.preset-glow {
  box-shadow: 0 0 10px rgba(255, 107, 74, 0.15);
}

.difficulty-glow {
  box-shadow: 0 0 10px currentColor;
  box-shadow: 0 0 10px color-mix(in srgb, currentColor 20%, transparent);
}

.start-glow {
  box-shadow: 0 0 20px rgba(255, 107, 74, 0.25);
}

.start-glow:hover {
  box-shadow: 0 0 30px rgba(255, 107, 74, 0.4);
}

/* Cell mark entrance */
.cell-mark {
  animation: cell-pop 0.2s ease-out;
}

@keyframes cell-pop {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  70% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
