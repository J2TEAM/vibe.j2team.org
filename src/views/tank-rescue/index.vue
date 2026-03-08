<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useGameEngine } from './useGameEngine'
import { MAP_W, MAP_H } from './useGameEngine'
import { LEVELS } from './levels'
import type { Direction } from './types'

const canvasRef = ref<HTMLCanvasElement | null>(null)

const {
  gameState,
  score,
  playerHealth,
  playerMaxHealth,
  enemiesLeft,
  currentLevel,
  levelName,
  hasShield,
  hasRapidFire,
  shieldPercent,
  rapidFirePercent,
  highScore,
  start,
  resume,
  togglePause,
  setTouchDir,
  setTouchShoot,
} = useGameEngine(() => canvasRef.value)

function handleTouchStart(dir: Direction) {
  setTouchDir(dir)
}

function handleTouchEnd() {
  setTouchDir(null)
}

function handleShootStart() {
  setTouchShoot(true)
}

function handleShootEnd() {
  setTouchShoot(false)
}
</script>

<template>
  <!-- ==================== MENU SCREEN ==================== -->
  <div
    v-if="gameState === 'menu'"
    class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col tr-menu-bg overflow-hidden"
  >
    <div class="tr-grid-overlay" />
    <div class="tr-scanline" />

    <nav class="relative z-20 w-full px-4 pt-4">
      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 border border-border-default bg-bg-surface/80 backdrop-blur-sm px-3 py-1.5 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
      >
        &larr; Trang chủ
      </RouterLink>
    </nav>

    <main class="relative z-10 flex-1 flex flex-col items-center justify-center px-4 -mt-8">
      <div class="tr-float-tank tr-float-tank--left" aria-hidden="true">
        <svg viewBox="0 0 64 40" class="w-16 h-10 text-accent-coral/15">
          <rect x="4" y="12" width="40" height="20" rx="3" fill="currentColor" />
          <rect x="30" y="18" width="28" height="6" rx="2" fill="currentColor" />
          <circle cx="24" cy="22" r="8" fill="currentColor" opacity="0.7" />
          <rect x="0" y="14" width="6" height="16" rx="1" fill="currentColor" opacity="0.5" />
          <rect x="38" y="14" width="6" height="16" rx="1" fill="currentColor" opacity="0.5" />
        </svg>
      </div>
      <div class="tr-float-tank tr-float-tank--right" aria-hidden="true">
        <svg viewBox="0 0 64 40" class="w-12 h-8 text-accent-amber/10">
          <rect x="4" y="12" width="40" height="20" rx="3" fill="currentColor" />
          <rect x="30" y="18" width="28" height="6" rx="2" fill="currentColor" />
          <circle cx="24" cy="22" r="8" fill="currentColor" opacity="0.7" />
        </svg>
      </div>

      <p class="text-[11px] tracking-[0.3em] text-accent-amber/80 uppercase mb-3 animate-fade-up">
        // Nhiệm vụ giải cứu
      </p>

      <h1
        class="text-5xl sm:text-6xl font-display font-bold text-center leading-tight mb-2 animate-fade-up animate-delay-1"
      >
        <span class="tr-title-glow">TANK</span>
        <br />
        <span class="text-accent-coral tr-title-glow-coral">RESCUE</span>
      </h1>

      <div
        class="w-24 h-px bg-gradient-to-r from-transparent via-accent-coral/60 to-transparent my-4 animate-fade-up animate-delay-1"
      />

      <p
        class="text-text-secondary text-center max-w-sm text-sm leading-relaxed mb-1 animate-fade-up animate-delay-2"
      >
        Điều khiển xe tăng, tiêu diệt kẻ địch<br class="hidden sm:block" />
        và giải cứu công chúa khỏi lâu đài bóng tối!
      </p>

      <div class="flex items-center gap-3 mt-2 mb-8 animate-fade-up animate-delay-2">
        <span class="tr-badge">3 Màn chơi</span>
        <span class="tr-badge-dot" />
        <span class="tr-badge">3 Loại địch</span>
        <span class="tr-badge-dot" />
        <span class="tr-badge">Power-ups</span>
      </div>

      <!-- High score -->
      <p
        v-if="highScore > 0"
        class="text-accent-amber/60 text-xs mb-4 animate-fade-up animate-delay-2"
      >
        Kỷ lục: <span class="font-bold tabular-nums">{{ highScore }}</span>
      </p>

      <button class="tr-btn-play group animate-fade-up animate-delay-3" @click="start">
        <span class="relative z-10 flex items-center gap-2">
          <svg
            class="w-5 h-5 transition group-hover:translate-x-0.5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              d="M6.3 2.8A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.31l9.56-5.89a1.5 1.5 0 000-2.62L6.3 2.8z"
            />
          </svg>
          BẮT ĐẦU
        </span>
      </button>

      <div
        class="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-10 w-full max-w-lg animate-fade-up animate-delay-4"
      >
        <div class="tr-info-card">
          <p class="tr-info-label">Điều khiển</p>
          <div class="space-y-1.5 text-xs">
            <div class="flex justify-between">
              <span class="text-text-secondary">Di chuyển</span>
              <span class="text-text-primary font-mono">WASD</span>
            </div>
            <div class="flex justify-between">
              <span class="text-text-secondary">Bắn</span>
              <span class="text-text-primary font-mono">SPACE</span>
            </div>
            <div class="flex justify-between">
              <span class="text-text-secondary">Tạm dừng</span>
              <span class="text-text-primary font-mono">ESC</span>
            </div>
          </div>
        </div>
        <div class="tr-info-card">
          <p class="tr-info-label">Loại địch</p>
          <div class="space-y-1.5 text-xs">
            <div class="flex items-center gap-1.5">
              <span class="tr-enemy-dot bg-red-500" />
              <span class="text-text-secondary">Trinh sát</span>
              <span class="text-text-secondary/50 ml-auto">nhanh</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="tr-enemy-dot bg-orange-700" />
              <span class="text-text-secondary">Hạng nặng</span>
              <span class="text-text-secondary/50 ml-auto">3+ HP</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="tr-enemy-dot bg-purple-600" />
              <span class="text-text-secondary">Bắn tỉa</span>
              <span class="text-text-secondary/50 ml-auto">chính xác</span>
            </div>
          </div>
        </div>
        <div class="tr-info-card">
          <p class="tr-info-label">Vật phẩm</p>
          <div class="space-y-1.5 text-xs">
            <div class="flex items-center gap-1.5">
              <span
                class="w-4 h-4 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center text-green-400 text-[9px] font-bold"
                >+</span
              >
              <span class="text-text-secondary">Hồi máu</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span
                class="w-4 h-4 rounded-full bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center text-yellow-400 text-[9px] font-bold"
                >F</span
              >
              <span class="text-text-secondary">Bắn nhanh</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span
                class="w-4 h-4 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 text-[9px] font-bold"
                >S</span
              >
              <span class="text-text-secondary">Khiên bảo vệ</span>
            </div>
          </div>
        </div>
      </div>
    </main>

    <footer class="relative z-10 w-full border-t border-border-default/50 mt-auto">
      <div
        class="max-w-[860px] mx-auto px-4 py-3 flex items-center justify-between text-xs text-text-secondary"
      >
        <span
          >Made with &#9829; by
          <a
            href="https://www.facebook.com/nosiaht"
            target="_blank"
            rel="noopener noreferrer"
            class="text-accent-coral hover:underline"
            >sondt</a
          ></span
        >
        <span class="text-text-secondary/40">vibe.j2team.org</span>
      </div>
    </footer>
  </div>

  <!-- ==================== GAME SCREEN ==================== -->
  <div
    v-else
    class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col items-center"
  >
    <!-- Header — z-20 to stay above canvas overlays -->
    <header class="relative z-20 w-full border-b border-border-default">
      <div class="max-w-[860px] mx-auto px-4 py-3 flex items-center justify-between">
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-3 py-1.5 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
        >
          &larr; Trang chủ
        </RouterLink>
        <div class="text-center">
          <p class="text-[10px] tracking-widest text-accent-amber uppercase">// Tank Rescue</p>
          <h1 class="text-lg font-display font-bold text-accent-coral leading-tight">
            Giải Cứu Công Chúa
          </h1>
        </div>
        <button
          v-if="gameState === 'playing' || gameState === 'paused'"
          class="border border-border-default bg-bg-surface px-3 py-1.5 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
          @click="togglePause"
        >
          {{ gameState === 'paused' ? '▶' : '⏸' }}
        </button>
        <div v-else class="w-[52px]" />
      </div>
    </header>

    <!-- HUD -->
    <div
      v-if="gameState === 'playing' || gameState === 'paused' || gameState === 'level_transition'"
      class="w-full max-w-[860px] px-4 py-2"
    >
      <div
        class="flex flex-wrap items-center justify-between gap-2 rounded border border-border-default bg-bg-surface/80 px-3 py-2 text-sm backdrop-blur-sm sm:px-4"
      >
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-1.5">
            <span class="text-text-secondary text-xs">HP</span>
            <div class="flex gap-0.5">
              <span
                v-for="i in playerMaxHealth"
                :key="i"
                class="inline-block h-3 w-3 rounded-sm border"
                :class="
                  i <= playerHealth
                    ? 'bg-green-500 border-green-400'
                    : 'bg-bg-deep border-border-default'
                "
              />
            </div>
          </div>
          <!-- Buff indicators with timer bars -->
          <div v-if="hasShield" class="flex items-center gap-1">
            <span
              class="rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] text-blue-400 border border-blue-500/30"
              >Khiên</span
            >
            <div class="w-8 h-1.5 bg-bg-deep rounded-full overflow-hidden">
              <div
                class="h-full bg-blue-400 transition-all duration-200"
                :style="{ width: shieldPercent + '%' }"
              />
            </div>
          </div>
          <div v-if="hasRapidFire" class="flex items-center gap-1">
            <span
              class="rounded bg-yellow-500/20 px-1.5 py-0.5 text-[10px] text-yellow-400 border border-yellow-500/30"
              >Bắn nhanh</span
            >
            <div class="w-8 h-1.5 bg-bg-deep rounded-full overflow-hidden">
              <div
                class="h-full bg-yellow-400 transition-all duration-200"
                :style="{ width: rapidFirePercent + '%' }"
              />
            </div>
          </div>
        </div>
        <div class="flex items-center gap-3 sm:gap-4">
          <span class="text-accent-amber font-bold tabular-nums">{{ score }}</span>
          <span class="text-text-secondary text-xs">
            Địch: <span class="text-accent-coral font-bold tabular-nums">{{ enemiesLeft }}</span>
          </span>
          <span class="text-text-secondary text-xs">
            Màn:
            <span class="text-text-primary font-bold tabular-nums"
              >{{ currentLevel + 1 }}/{{ LEVELS.length }}</span
            >
          </span>
        </div>
      </div>
    </div>

    <!-- Canvas area -->
    <div class="relative px-2 py-2 flex-shrink-0">
      <!-- Level Transition Overlay -->
      <div
        v-if="gameState === 'level_transition'"
        class="absolute inset-0 z-10 flex flex-col items-center justify-center bg-bg-deep/90 backdrop-blur-sm"
      >
        <p class="text-[10px] tracking-widest text-accent-amber uppercase mb-2">// Màn tiếp theo</p>
        <h2 class="text-3xl font-display font-bold text-accent-coral mb-2">
          Màn {{ currentLevel + 1 }}
        </h2>
        <p class="text-text-secondary text-lg">{{ levelName }}</p>
      </div>

      <!-- Pause Overlay -->
      <div
        v-if="gameState === 'paused'"
        class="absolute inset-0 z-10 flex flex-col items-center justify-center bg-bg-deep/85 backdrop-blur-sm"
      >
        <h2 class="text-3xl font-display font-bold text-accent-amber mb-6">Tạm dừng</h2>
        <button
          class="mb-3 border-2 border-accent-coral text-accent-coral px-8 py-3 font-display font-bold transition hover:bg-accent-coral hover:text-bg-deep"
          @click="resume"
        >
          TIẾP TỤC
        </button>
        <button
          class="border border-border-default text-text-secondary px-6 py-2 text-sm transition hover:border-accent-coral hover:text-text-primary"
          @click="start"
        >
          Chơi lại từ đầu
        </button>
      </div>

      <!-- Victory Overlay -->
      <div
        v-if="gameState === 'won'"
        class="absolute inset-0 z-10 flex flex-col items-center justify-center bg-bg-deep/95 backdrop-blur-sm"
      >
        <div
          class="border border-accent-coral bg-bg-surface p-8 text-center max-w-sm tr-ending-fade"
        >
          <p class="text-[10px] tracking-widest text-accent-amber uppercase mb-2">// Chiến thắng</p>
          <h2 class="text-3xl font-display font-bold text-green-400 mb-2">
            Công chúa đã được giải cứu!
          </h2>
          <p class="text-5xl mb-4">👸</p>
          <div class="grid grid-cols-2 gap-3 mb-4 text-sm">
            <div class="border border-border-default p-2">
              <p class="text-text-secondary text-xs">Tổng điểm</p>
              <p class="text-accent-amber font-bold text-xl tabular-nums">{{ score }}</p>
            </div>
            <div class="border border-border-default p-2">
              <p class="text-text-secondary text-xs">Kỷ lục</p>
              <p class="text-accent-coral font-bold text-xl tabular-nums">{{ highScore }}</p>
            </div>
          </div>
          <button
            class="w-full border-2 border-green-400 text-green-400 px-8 py-3 font-display font-bold transition hover:bg-green-400 hover:text-bg-deep"
            @click="start"
          >
            CHƠI LẠI
          </button>
        </div>
      </div>

      <!-- Game Over Overlay -->
      <div
        v-if="gameState === 'lost'"
        class="absolute inset-0 z-10 flex flex-col items-center justify-center bg-bg-deep/95 backdrop-blur-sm"
      >
        <div class="border border-red-500/50 bg-bg-surface p-8 text-center max-w-sm tr-ending-fade">
          <p class="text-[10px] tracking-widest text-accent-amber uppercase mb-2">// Thất bại</p>
          <h2 class="text-3xl font-display font-bold text-red-400 mb-2">Xe tăng đã bị phá hủy!</h2>
          <p class="text-5xl mb-4">💥</p>
          <div class="grid grid-cols-2 gap-3 mb-4 text-sm">
            <div class="border border-border-default p-2">
              <p class="text-text-secondary text-xs">Điểm</p>
              <p class="text-accent-amber font-bold text-xl tabular-nums">{{ score }}</p>
            </div>
            <div class="border border-border-default p-2">
              <p class="text-text-secondary text-xs">Kỷ lục</p>
              <p class="text-accent-coral font-bold text-xl tabular-nums">{{ highScore }}</p>
            </div>
          </div>
          <button
            class="w-full border-2 border-red-400 text-red-400 px-8 py-3 font-display font-bold transition hover:bg-red-400 hover:text-bg-deep"
            @click="start"
          >
            THỬ LẠI
          </button>
        </div>
      </div>

      <canvas
        ref="canvasRef"
        class="block max-w-full border border-border-default"
        :style="{ aspectRatio: `${MAP_W}/${MAP_H}` }"
      />
    </div>

    <!-- Mobile controls — includes pause -->
    <div
      v-if="gameState === 'playing'"
      class="lg:hidden w-full max-w-[440px] px-4 py-3 select-none"
    >
      <div class="flex items-center justify-between">
        <!-- D-pad (bigger: 168px = 56px cells) -->
        <div class="grid grid-cols-3 grid-rows-3 gap-1.5 w-[168px] h-[168px]">
          <div />
          <button
            class="tr-dpad-btn touch-none"
            @touchstart.prevent="handleTouchStart('up')"
            @touchend.prevent="handleTouchEnd"
          >
            <svg class="w-6 h-6" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 5l5 7H5z" />
            </svg>
          </button>
          <div />
          <button
            class="tr-dpad-btn touch-none"
            @touchstart.prevent="handleTouchStart('left')"
            @touchend.prevent="handleTouchEnd"
          >
            <svg class="w-6 h-6" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5 10l7-5v10z" />
            </svg>
          </button>
          <!-- Center: pause button -->
          <button
            class="tr-dpad-btn touch-none text-accent-amber text-lg"
            @touchstart.prevent="togglePause"
          >
            ⏸
          </button>
          <button
            class="tr-dpad-btn touch-none"
            @touchstart.prevent="handleTouchStart('right')"
            @touchend.prevent="handleTouchEnd"
          >
            <svg class="w-6 h-6" viewBox="0 0 20 20" fill="currentColor">
              <path d="M15 10l-7 5V5z" />
            </svg>
          </button>
          <div />
          <button
            class="tr-dpad-btn touch-none"
            @touchstart.prevent="handleTouchStart('down')"
            @touchend.prevent="handleTouchEnd"
          >
            <svg class="w-6 h-6" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 15l-5-7h10z" />
            </svg>
          </button>
          <div />
        </div>

        <!-- Fire button -->
        <button
          class="w-[80px] h-[80px] rounded-full bg-red-600 border-4 border-red-400 text-white font-display font-bold text-sm flex items-center justify-center active:bg-red-800 active:scale-95 transition touch-none shadow-lg shadow-red-600/30"
          @touchstart.prevent="handleShootStart"
          @touchend.prevent="handleShootEnd"
        >
          BẮN
        </button>
      </div>
    </div>

    <!-- Footer -->
    <footer class="w-full border-t border-border-default mt-auto">
      <div
        class="max-w-[860px] mx-auto px-4 py-4 flex items-center justify-between text-xs text-text-secondary"
      >
        <span
          >Made with &#9829; by
          <a
            href="https://www.facebook.com/nosiaht"
            target="_blank"
            rel="noopener noreferrer"
            class="text-accent-coral hover:underline"
            >sondt</a
          ></span
        >
        <span class="text-text-secondary/50">vibe.j2team.org</span>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.tr-menu-bg {
  position: relative;
  background:
    radial-gradient(ellipse 80% 60% at 50% 40%, rgba(255, 107, 107, 0.04) 0%, transparent 70%),
    radial-gradient(ellipse 60% 50% at 20% 80%, rgba(251, 191, 36, 0.03) 0%, transparent 60%),
    var(--color-bg-deep);
}

.tr-grid-overlay {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
  background-size: 40px 40px;
  pointer-events: none;
}

.tr-scanline {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(255, 107, 107, 0.3), transparent);
  animation: tr-scan 4s ease-in-out infinite;
  pointer-events: none;
  z-index: 5;
}

@keyframes tr-scan {
  0%,
  100% {
    top: 0;
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    top: 100%;
    opacity: 0;
  }
}

.tr-title-glow {
  color: var(--color-text-primary);
  text-shadow: 0 0 40px rgba(255, 255, 255, 0.1);
}

.tr-title-glow-coral {
  text-shadow:
    0 0 30px rgba(255, 107, 107, 0.3),
    0 0 60px rgba(255, 107, 107, 0.1);
}

.tr-float-tank {
  position: absolute;
  pointer-events: none;
}
.tr-float-tank--left {
  left: 5%;
  top: 35%;
  animation: tr-float 6s ease-in-out infinite;
}
.tr-float-tank--right {
  right: 8%;
  bottom: 30%;
  animation: tr-float 8s ease-in-out infinite reverse;
}

@keyframes tr-float {
  0%,
  100% {
    transform: translateY(0) rotate(-5deg);
  }
  50% {
    transform: translateY(-12px) rotate(5deg);
  }
}

.tr-badge {
  font-size: 11px;
  color: var(--color-text-secondary);
  opacity: 0.6;
}
.tr-badge-dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--color-text-secondary);
  opacity: 0.3;
}

.tr-btn-play {
  position: relative;
  padding: 14px 48px;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 18px;
  letter-spacing: 0.05em;
  color: var(--color-bg-deep);
  background: var(--color-accent-coral);
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  overflow: hidden;
}

.tr-btn-play::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, transparent 50%);
  pointer-events: none;
}

.tr-btn-play:hover {
  transform: translateY(-2px);
  box-shadow:
    0 8px 24px rgba(255, 107, 107, 0.3),
    0 2px 8px rgba(255, 107, 107, 0.2);
}

.tr-btn-play:active {
  transform: translateY(0);
}

.tr-info-card {
  border: 1px solid var(--color-border-default);
  background: var(--color-bg-surface);
  padding: 12px 14px;
  transition: border-color 0.2s;
}

.tr-info-card:hover {
  border-color: var(--color-accent-coral);
}

.tr-info-label {
  font-size: 9px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--color-accent-amber);
  margin-bottom: 8px;
  opacity: 0.8;
}

.tr-enemy-dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  flex-shrink: 0;
}

.tr-dpad-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid var(--color-border-default);
  background: var(--color-bg-surface);
  color: var(--color-text-secondary);
  transition: all 0.1s;
}

.tr-dpad-btn:active {
  background: var(--color-accent-coral);
  color: var(--color-bg-deep);
  border-color: var(--color-accent-coral);
}

.tr-ending-fade {
  animation: tr-ending-appear 0.4s ease-out;
}

@keyframes tr-ending-appear {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>
