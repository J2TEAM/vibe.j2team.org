<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { GAME_WIDTH, GAME_HEIGHT, WEAPON_TYPES } from './config'
import { useGame } from './useGame'

const {
  gameState,
  gamePhase,
  currentWave,
  weaponType,
  weaponLevel,
  togglePause,
  isMuted,
  toggleMute,
  bgHue,
  player,
  score,
  lives,
  bullets,
  enemyBullets,
  enemies,
  powerUps,
  bosses,
  waveAnnouncement,
  initGame,
  boardRotation,
  activeWidth,
  activeHeight,
  setPointerState,
  isRotating,
  startGame,
  resumingCountdown,
  handleBoardPointerDown,
} = useGame()

const gameScale = ref(1)
const boardWrapper = ref<HTMLElement | null>(null)

const updateScale = () => {
  if (!boardWrapper.value) return
  const availableWidth = boardWrapper.value.clientWidth
  const availableHeight = boardWrapper.value.clientHeight

  const scaleX = availableWidth / GAME_WIDTH
  const scaleY = availableHeight / GAME_HEIGHT

  if (window.innerWidth < 1024) {
    gameScale.value = Math.min(scaleX, scaleY)
  } else {
    gameScale.value = Math.min(scaleX, scaleY, 1.2)
  }
}

onMounted(() => {
  window.addEventListener('resize', updateScale)
  setTimeout(updateScale, 100)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateScale)
})
watch(boardRotation, () => {
  updateScale()
})

// const setMobileKey = (key: 'left' | 'right' | 'fire', state: boolean) => { mobileKeys.value[key] = state }

const getTailwindColor = (colorClass: string) => {
  const colors: Record<string, string> = {
    yellow: 'border-yellow-400 text-yellow-400 drop-shadow-[0_0_10px_#facc15]',
    cyan: 'border-cyan-400 text-cyan-400 drop-shadow-[0_0_10px_#22d3ee]',
    red: 'border-red-500 text-red-500 drop-shadow-[0_0_10px_#ef4444]',
    green: 'border-green-400 text-green-400 drop-shadow-[0_0_10px_#4ade80]',
    purple: 'border-purple-500 text-purple-500 drop-shadow-[0_0_10px_#a855f7]',
    blue: 'border-blue-400 text-blue-400 drop-shadow-[0_0_10px_#60a5fa]',
    pink: 'border-pink-500 text-pink-500 drop-shadow-[0_0_10px_#ec4899]',
    lime: 'border-lime-500 text-lime-500 drop-shadow-[0_0_10px_#84cc16]',
    orange: 'border-orange-500 text-orange-500 drop-shadow-[0_0_10px_#f97316]',
  }
  const key = Object.keys(colors).find((k) => colorClass.includes(k))
  return key ? colors[key] : 'border-border-default text-text-primary'
}
</script>

<template>
  <div
    class="h-dvh w-screen bg-bg-deep text-text-primary font-body flex flex-col items-center select-none overflow-hidden touch-none relative"
  >
    <div
      class="w-full mx-auto flex justify-between items-center bg-bg-surface p-2 lg:p-4 border-b xl:border border-border-default shadow-lg z-50 shrink-0 pointer-events-auto"
      :style="{ maxWidth: `${GAME_WIDTH * gameScale}px` }"
    >
      <div
        class="flex gap-2 lg:gap-6 items-center overflow-x-auto whitespace-nowrap hide-scrollbar"
      >
        <h1
          class="text-base sm:text-lg lg:text-2xl font-display font-bold text-accent-coral uppercase tracking-tight"
        >
          ĐIỂM: {{ score }}
        </h1>
        <div
          class="flex items-center gap-1 lg:gap-2 border-l border-border-default pl-2 lg:pl-4 text-sm sm:text-base lg:text-xl font-display font-bold text-text-primary"
        >
          {{ lives }} <span class="text-accent-coral animate-pulse">💗</span>
        </div>

        <div
          class="flex items-center gap-1 lg:gap-2 font-display font-bold border border-border-default bg-bg-elevated px-1.5 py-1 lg:px-3 lg:py-1.5 transition-colors hover:border-accent-amber"
        >
          <span class="text-xs sm:text-sm lg:text-lg">{{
            WEAPON_TYPES[weaponType]?.icon || ''
          }}</span>
          <span class="hidden lg:inline text-accent-amber pl-1">{{
            WEAPON_TYPES[weaponType]?.name || ''
          }}</span>
          <span class="text-border-default hidden lg:inline">/</span>
          <span class="text-text-secondary uppercase hidden lg:inline">CẤP {{ weaponLevel }}</span>
          <span class="text-text-secondary uppercase lg:hidden text-[11px] sm:text-sm pl-1"
            >LV.{{ weaponLevel }}</span
          >
        </div>

        <div
          class="flex items-center gap-1.5 lg:gap-2 font-display font-bold border border-border-default bg-bg-elevated px-1.5 py-1 lg:px-3 lg:py-1.5"
        >
          <span class="text-accent-sky text-[10px] lg:text-xs tracking-widest">//</span>
          <span class="text-text-secondary text-[11px] sm:text-sm lg:text-base"
            >WAVE {{ currentWave }}</span
          >
        </div>
      </div>
      <div class="flex items-center gap-1 lg:gap-2 shrink-0">
        <button
          @click="toggleMute"
          class="w-7 h-7 lg:w-10 lg:h-10 flex items-center justify-center bg-bg-elevated border border-border-default text-text-secondary transition-all hover:border-accent-amber text-xs lg:text-base"
        >
          {{ isMuted ? '🔇' : '🔊' }}
        </button>
        <button
          @click="togglePause"
          class="w-7 h-7 lg:w-10 lg:h-10 flex items-center justify-center bg-bg-elevated border border-border-default text-text-secondary transition-all hover:border-accent-sky font-bold text-sm lg:text-lg"
        >
          {{ gameState === 'paused' || gameState === 'resuming' ? '▶' : '⏸' }}
        </button>
        <RouterLink
          to="/"
          class="px-2 lg:px-5 py-1 lg:py-2 font-display font-semibold text-[10px] lg:text-sm bg-bg-elevated border border-border-default text-text-secondary transition-all hover:border-accent-coral hover:text-text-primary"
        >
          <span class="hidden lg:inline">&larr; THOÁT</span>
          <span class="lg:hidden text-sm">&larr;</span>
        </RouterLink>
      </div>
    </div>

    <div
      ref="boardWrapper"
      class="flex-1 w-full flex items-center justify-center min-h-0 relative z-10 pointer-events-auto"
    >
      <div
        class="hidden max-lg:portrait:flex absolute inset-0 z-1000 bg-bg-deep/95 backdrop-blur-md flex-col items-center justify-center text-center px-4 border border-border-default"
      >
        <div class="text-[80px] mb-4 text-accent-sky animate-[bounce_2s_infinite]">📱</div>
        <div
          class="text-[50px] mb-6 text-accent-amber animate-[spin_2s_ease-in-out_infinite] rotate-90 w-16 h-16 flex items-center justify-center leading-none"
        >
          ↻
        </div>
        <h2
          class="text-2xl font-display font-bold text-accent-coral uppercase tracking-widest mb-3 drop-shadow-[0_0_10px_#FF6B4A]"
        >
          Xoay ngang màn hình
        </h2>
        <p class="text-text-secondary text-sm px-8 leading-relaxed">
          Để có trải nghiệm né đạn và tiêu diệt boss mượt mà nhất, vui lòng xoay ngang điện thoại
          của bạn!
        </p>
      </div>

      <div
        class="relative border border-border-default overflow-hidden shadow-2xl shrink-0 transition-colors duration-1000 max-lg:portrait:hidden"
        :style="{
          width: `${GAME_WIDTH}px`,
          height: `${GAME_HEIGHT}px`,
          transform: `scale(${gameScale})`,
          transformOrigin: 'center center',
          backgroundColor: `hsl(${215 + bgHue}, 46%, 8%)`,
        }"
      >
        <div
          class="absolute inset-0 pointer-events-none z-0"
          :style="{ filter: `hue-rotate(${bgHue}deg)` }"
        >
          <div class="space-layer stars-distant"></div>
          <div class="space-layer stars-near"></div>
        </div>

        <div
          v-if="gameState === 'menu'"
          class="absolute inset-0 z-600 bg-bg-deep/80 backdrop-blur-md flex flex-col items-center justify-center pointer-events-auto"
        >
          <button
            @click="startGame"
            class="px-12 py-4 mb-6 bg-accent-coral text-bg-deep text-2xl sm:text-3xl font-display font-bold tracking-widest transition-all hover:bg-accent-amber hover:scale-105 active:scale-95 shadow-[0_0_20px_#FF6B4A] rounded-sm"
          >
            CHƠI NGAY
          </button>
          <div
            class="border border-border-default bg-bg-surface p-6 max-w-sm w-full text-center shadow-xl"
          >
            <h3
              class="text-xl font-display font-bold text-accent-sky tracking-widest mb-4 uppercase border-b border-border-default pb-2"
            >
              HƯỚNG DẪN
            </h3>
            <div class="hidden lg:flex flex-col gap-4">
              <div class="flex justify-between items-center">
                <span class="text-text-secondary font-bold text-sm tracking-wider">DI CHUYỂN:</span>
                <span
                  class="bg-bg-elevated px-3 py-1.5 font-bold text-accent-amber border border-border-default text-xs tracking-widest"
                  >CHUỘT / WASD</span
                >
              </div>
              <div class="flex justify-between items-center">
                <span class="text-text-secondary font-bold text-sm tracking-wider">BẮN ĐẠN:</span>
                <span
                  class="bg-bg-elevated px-3 py-1.5 font-bold text-accent-coral border border-border-default text-xs tracking-widest"
                  >CLICK / SPACE</span
                >
              </div>
            </div>
            <div class="lg:hidden flex flex-col gap-4">
              <div class="flex flex-col items-center gap-2">
                <span class="text-text-secondary font-bold text-sm tracking-wider"
                  >DI CHUYỂN & BẮN:</span
                >
                <span
                  class="bg-bg-elevated px-3 py-1.5 font-bold text-accent-amber border border-border-default w-full text-xs tracking-widest"
                  >CHẠM KÉO & GIỮ MÀN HÌNH</span
                >
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="gameState === 'gameover'"
          class="absolute inset-0 bg-bg-deep/90 flex flex-col items-center justify-center z-500 backdrop-blur-md pointer-events-auto"
        >
          <h2
            class="text-7xl font-display font-bold mb-2 text-accent-coral tracking-tighter uppercase drop-shadow-[0_0_20px_#FF6B4A]"
          >
            GAME OVER
          </h2>
          <p class="text-3xl text-accent-amber font-display font-bold mb-10">ĐIỂM: {{ score }}</p>
          <button
            @click="initGame"
            class="px-10 py-4 bg-bg-surface border border-border-default text-text-primary font-display font-bold text-xl transition-all hover:border-accent-coral hover:text-accent-coral cursor-pointer active:scale-95 shadow-lg"
          >
            CHƠI LẠI 🔄
          </button>
        </div>

        <div
          v-if="gameState === 'paused'"
          class="absolute inset-0 bg-bg-deep/80 backdrop-blur-md flex flex-col items-center justify-center z-400 pointer-events-none"
        >
          <h2
            class="text-7xl font-display font-bold text-accent-coral mb-4 tracking-widest uppercase"
          >
            TẠM DỪNG
          </h2>
          <p class="text-xl text-text-secondary font-body text-center leading-relaxed">
            <span class="hidden lg:inline">Nhấn SPACE / CLICK để tiếp tục</span>
            <span class="lg:hidden">Nhấn nút ▶ trên thanh điều khiển để tiếp tục</span>
          </p>
        </div>

        <div
          v-if="gameState === 'resuming'"
          class="absolute inset-0 flex flex-col items-center justify-center z-400 pointer-events-none"
        >
          <span
            class="text-[150px] font-display font-bold text-accent-amber drop-shadow-[0_0_20px_#FFB830]"
            >{{ resumingCountdown }}</span
          >
        </div>

        <div
          v-if="waveAnnouncement"
          class="absolute top-1/3 left-0 w-full flex items-center justify-center z-300 pointer-events-none"
        >
          <h2
            class="text-5xl sm:text-6xl font-display font-bold text-accent-sky tracking-widest text-center px-4 uppercase drop-shadow-lg whitespace-pre-line"
          >
            {{ waveAnnouncement }}
          </h2>
        </div>

        <div
          id="touch-layer"
          class="absolute inset-0 z-200 cursor-crosshair touch-none"
          @pointermove="
            (e) => {
              setPointerState(e.clientX, e.clientY, undefined)
            }
          "
          @pointerdown="handleBoardPointerDown"
          @pointerup="
            () => {
              setPointerState(undefined, undefined, false)
            }
          "
          @pointerleave="
            () => {
              setPointerState(undefined, undefined, false)
            }
          "
        ></div>

        <div
          class="absolute top-1/2 left-1/2 pointer-events-none"
          :class="{ 'transition-transform duration-1000 ease-in-out': isRotating }"
          :style="{
            width: `${activeWidth}px`,
            height: `${activeHeight}px`,
            transform: `translate(-50%, -50%) rotate(${boardRotation}deg)`,
          }"
        >
          <div
            v-for="pu in powerUps"
            :key="'pu' + pu.id"
            class="absolute top-0 left-0 flex items-center justify-center will-change-transform z-20 pointer-events-none"
            :style="{
              transform: `translate3d(${pu.x}px, ${pu.y}px, 0)`,
              width: `${pu.width}px`,
              height: `${pu.height}px`,
            }"
          >
            <div
              class="w-full h-full flex items-center justify-center"
              :class="{ 'transition-transform duration-1000 ease-in-out': isRotating }"
              :style="{ transform: `rotate(${-boardRotation}deg)` }"
            >
              <span
                v-if="pu.wType === -1"
                class="text-3xl drop-shadow-[0_0_10px_#FFB830] animate-pulse"
                >🎁</span
              >
              <div
                v-else
                class="relative flex items-center justify-center w-8 h-8 animate-pulse drop-shadow-md"
              >
                <div
                  class="absolute inset-0 rotate-45 border-[3px] opacity-100 bg-bg-deep transition-colors"
                  :class="getTailwindColor(WEAPON_TYPES[pu.wType]?.color || '')"
                ></div>
                <span class="relative z-10 text-[12px]">{{
                  WEAPON_TYPES[pu.wType]?.icon || ''
                }}</span>
              </div>
            </div>
          </div>

          <div
            v-for="bullet in bullets"
            :key="'b' + bullet.id"
            class="absolute top-0 left-0 opacity-90 will-change-transform pointer-events-none"
            :class="[
              bullet.shape === 'beam' ? 'bullet-ion-laser z-0' : '',
              bullet.shape === 'wavy-beam' ? 'bullet-wavy z-0' : '',
              bullet.shape === 'plasma-fan'
                ? 'bg-linear-to-t from-transparent via-accent-coral to-accent-coral rounded-t-full shadow-[0_-5px_10px_#FF6B4A] z-10'
                : '',
              bullet.shape === 'dash'
                ? 'bg-accent-sky rounded-sm shadow-[0_0_8px_#38BDF8] z-10'
                : '',
              bullet.shape === 'sphere' ? 'bg-red-500 rounded-full z-10' : '',
              bullet.shape === 'wave'
                ? 'bg-linear-to-b from-green-400 to-transparent rounded-t-full z-10'
                : '',
              bullet.shape === 'bolt' ? 'bullet-bolt z-10' : '',
              bullet.shape === 'blob'
                ? 'bg-lime-400 rounded-full shadow-[0_0_10px_#a3e635] z-10'
                : '',
              bullet.shape === 'shard' ? 'bullet-shard z-10' : '',
              bullet.shape === 'needle' ? 'bg-purple-500 rounded-[50%] z-10' : '',
            ]"
            :style="{
              transform: `translate3d(${bullet.x}px, ${bullet.y}px, 0) rotate(${bullet.rotation}deg)`,
              width: `${bullet.width}px`,
              height: `${bullet.height}px`,
            }"
          ></div>

          <div
            v-for="egg in enemyBullets"
            :key="'egg' + egg.id"
            class="absolute top-0 left-0 z-20 will-change-transform flex items-center justify-center pointer-events-none"
            :style="{
              transform: `translate3d(${egg.x}px, ${egg.y}px, 0)`,
              width: `${egg.width}px`,
              height: `${egg.height}px`,
            }"
          >
            <div
              class="w-full h-full flex items-center justify-center"
              :class="{ 'transition-transform duration-1000 ease-in-out': isRotating }"
              :style="{ transform: `rotate(${-boardRotation}deg)` }"
            >
              <span
                :class="
                  egg.isMeteor
                    ? 'text-4xl animate-[spin_3s_linear_infinite]'
                    : egg.isBossEgg
                      ? 'text-4xl'
                      : 'text-xl'
                "
                class="drop-shadow-[0_0_8px_white]"
              >
                {{ egg.isMeteor ? '🪨' : '🥚' }}
              </span>
            </div>
          </div>

          <template v-if="gamePhase === 'minions' || gamePhase === 'meteors'">
            <div
              v-for="enemy in enemies"
              :key="'e' + enemy.id"
              class="absolute top-0 left-0 flex flex-col items-center justify-center backdrop-blur-sm z-10 will-change-transform pointer-events-none"
              :class="[
                enemy.isMeteor
                  ? 'bg-[#3b2314] border-2 border-[#ea580c] shadow-[0_0_15px_#ea580c]'
                  : enemy.isFallingChicken
                    ? 'bg-accent-coral/20 border border-accent-coral shadow-[0_0_15px_#FF6B4A]'
                    : enemy.isStash
                      ? 'bg-accent-amber/20 border-2 border-accent-amber shadow-[0_0_20px_#FFB830]'
                      : 'bg-accent-coral/20 border border-accent-coral shadow-[0_0_15px_#FF6B4A]',
              ]"
              :style="{
                transform: `translate3d(${enemy.x}px, ${enemy.y}px, 0)`,
                width: `${enemy.width}px`,
                height: `${enemy.height}px`,
                filter: enemy.hue ? `hue-rotate(${enemy.hue}deg)` : 'none',
              }"
            >
              <div
                v-if="enemy.hp < enemy.maxHp"
                class="absolute -top-3 w-full h-1 bg-bg-deep border border-border-default overflow-hidden z-20"
                :class="{ 'transition-transform duration-1000 ease-in-out': isRotating }"
                :style="{ transform: `rotate(${-boardRotation}deg)` }"
              >
                <div
                  class="h-full bg-accent-sky transition-all duration-75"
                  :style="{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }"
                ></div>
              </div>

              <div
                class="w-full h-full flex items-center justify-center"
                :class="{ 'transition-transform duration-1000 ease-in-out': isRotating }"
                :style="{ transform: `rotate(${-boardRotation}deg)` }"
              >
                <span
                  class="relative z-10 drop-shadow-md"
                  :class="
                    enemy.isMeteor
                      ? 'text-4xl animate-[spin_6s_linear_infinite]'
                      : enemy.isStash
                        ? 'text-6xl animate-pulse'
                        : enemy.isFallingChicken
                          ? 'text-4xl'
                          : 'text-2xl'
                  "
                >
                  {{ enemy.isMeteor ? '🪨' : enemy.isStash ? '📦' : '🐔' }}
                </span>
              </div>
            </div>
          </template>

          <template v-if="gamePhase === 'boss'">
            <template v-for="b in bosses" :key="'b' + b.id">
              <template v-if="b.hp > 0">
                <template v-if="b.bossType === 0 || b.bossType === 2 || b.bossType === 3">
                  <div
                    v-if="b.state === 'laser_warning'"
                    class="absolute top-0 left-0 bg-accent-coral/20 border-x-2 border-dashed border-accent-coral z-0 animate-pulse will-change-transform pointer-events-none"
                    :style="{
                      transform: `translate3d(${b.laserX ?? b.x + b.width / 2 - 40}px, ${b.y + b.height}px, 0)`,
                      width: `80px`,
                      height: `${activeHeight}px`,
                    }"
                  >
                    <div
                      class="w-full h-full flex flex-col items-center pt-20"
                      :class="{ 'transition-transform duration-1000 ease-in-out': isRotating }"
                      :style="{ transform: `rotate(${-boardRotation}deg)` }"
                    >
                      <div
                        class="text-center text-accent-coral font-display font-bold drop-shadow-md text-2xl"
                      >
                        ⚠️ DANGER ⚠️
                      </div>
                    </div>
                  </div>
                  <div
                    v-if="b.state === 'laser_firing'"
                    class="absolute top-0 left-0 z-20 shadow-[0_0_40px_#FF6B4A] bg-linear-to-r from-accent-coral via-white to-accent-coral will-change-transform pointer-events-none"
                    :style="{
                      transform: `translate3d(${b.laserX ?? b.x + b.width / 2 - 40}px, ${b.y + b.height}px, 0)`,
                      width: `80px`,
                      height: `${activeHeight}px`,
                    }"
                  ></div>
                </template>

                <div
                  class="absolute top-0 left-0 flex flex-col items-center justify-center z-10 will-change-transform pointer-events-none"
                  :class="[
                    b.bossType === 1 || b.bossType === 4
                      ? 'bg-amber-900/50 border-4 border-dashed border-yellow-500 rounded-full shadow-[0_0_50px_rgba(234,179,8,0.4)]'
                      : b.bossType === 2
                        ? 'bg-slate-900/80 border-y-4 border-accent-sky rounded-[50%] shadow-[0_0_60px_rgba(56,189,248,0.6)]'
                        : 'bg-[#3b1212] border-2 border-accent-coral shadow-[0_0_50px_rgba(255,107,74,0.4)]',
                  ]"
                  :style="{
                    transform: `translate3d(${b.x}px, ${b.y}px, 0)`,
                    width: `${b.width}px`,
                    height: `${b.height}px`,
                  }"
                >
                  <div
                    class="absolute -top-6 w-full h-3 bg-bg-deep border border-border-default overflow-hidden shadow-lg z-10"
                    :class="{ 'transition-transform duration-1000 ease-in-out': isRotating }"
                    :style="{ transform: `rotate(${-boardRotation}deg)` }"
                  >
                    <div
                      class="h-full transition-all duration-100"
                      :class="
                        b.bossType === 1 || b.bossType === 4
                          ? 'bg-yellow-400'
                          : b.bossType === 2
                            ? 'bg-accent-sky'
                            : 'bg-linear-to-r from-accent-coral to-accent-amber'
                      "
                      :style="{ width: `${(b.hp / b.maxHp) * 100}%` }"
                    ></div>
                  </div>

                  <div
                    class="w-full h-full flex items-center justify-center"
                    :class="{ 'transition-transform duration-1000 ease-in-out': isRotating }"
                    :style="{ transform: `rotate(${-boardRotation}deg)` }"
                  >
                    <span
                      class="drop-shadow-2xl"
                      :class="b.bossType === 1 || b.bossType === 4 ? 'text-[70px]' : 'text-[90px]'"
                    >
                      {{
                        b.bossType === 1 || b.bossType === 4
                          ? '🐔'
                          : b.bossType === 2
                            ? '🛸'
                            : b.bossType === 3
                              ? '💥'
                              : '👿'
                      }}
                    </span>
                  </div>
                </div>
              </template>
              <div
                v-else
                class="absolute top-0 left-0 flex items-center justify-center z-20 will-change-transform pointer-events-none"
                :style="{
                  transform: `translate3d(${b.x}px, ${b.y}px, 0)`,
                  width: `${b.width}px`,
                  height: `${b.height}px`,
                }"
              >
                <div
                  class="w-full h-full flex items-center justify-center"
                  :class="{ 'transition-transform duration-1000 ease-in-out': isRotating }"
                  :style="{ transform: `rotate(${-boardRotation}deg)` }"
                >
                  <span class="text-[120px] drop-shadow-[0_0_50px_#FF6B4A] boss-explode-anim"
                    >💥</span
                  >
                </div>
              </div>
            </template>
          </template>

          <div
            class="absolute top-0 left-0 flex items-center justify-center z-30 will-change-transform transition-opacity pointer-events-none"
            :class="player.invulnerable > 0 ? 'opacity-40 animate-pulse' : 'opacity-100'"
            :style="{
              transform: `translate3d(${player.x}px, ${player.y}px, 0)`,
              width: `${player.width}px`,
              height: `${player.height}px`,
            }"
          >
            <div class="w-full h-full flex flex-col items-center justify-center relative">
              <span class="text-5xl drop-shadow-[0_0_15px_#38BDF8] z-10 relative block -top-2.5"
                >🚀</span
              >
              <div
                class="absolute -bottom-2 w-5 h-10 bg-linear-to-t from-accent-sky via-accent-coral to-transparent animate-[pulse_0.5s_linear_infinite] opacity-80 blur-[2px]"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}

.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.space-layer {
  position: absolute;
  top: -100%;
  left: 0;
  right: 0;
  height: 200%;
  width: 100%;
  will-change: transform;
}

.stars-distant {
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><circle cx="25" cy="25" r="1" fill="%234A6180" opacity="0.3"/><circle cx="125" cy="50" r="1" fill="%234A6180" opacity="0.6"/><circle cx="75" cy="125" r="1.5" fill="%234A6180" opacity="0.4"/><circle cx="175" cy="175" r="1" fill="%234A6180" opacity="0.2"/></svg>');
  background-repeat: repeat;
  animation: scrollSpace 18s linear infinite;
}

.stars-near {
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><circle cx="100" cy="50" r="1.5" fill="%238B9DB5" opacity="0.8"/><circle cx="250" cy="150" r="2" fill="%23FFB830" opacity="0.4"/><circle cx="50" cy="250" r="1.5" fill="%23F0EDE6" opacity="0.9"/></svg>');
  background-repeat: repeat;
  animation: scrollSpace 8s linear infinite;
}

@keyframes scrollSpace {
  0% {
    transform: translate3d(0, 0, 0);
  }

  100% {
    transform: translate3d(0, 50%, 0);
  }
}

.bullet-ion-laser {
  background: linear-gradient(90deg, #e4a735 10%, #e2c405 50%, #e4a735 90%);
  box-shadow:
    0 0 15px #ffb830,
    0 0 30px #ffb830;
}

.bullet-shard {
  background: radial-gradient(circle, #ffb830 10%, #ff6b4a 50%, #9a3412 90%);
  border-radius: 50%;
  animation: magmaPulse 0.4s infinite alternate;
}

@keyframes magmaPulse {
  from {
    box-shadow:
      0 0 20px #ffb830,
      0 0 40px #ff6b4a;
    filter: brightness(1);
  }

  to {
    box-shadow:
      0 0 40px #ffb830,
      0 0 80px #ff6b4a;
    filter: brightness(1.3);
  }
}

.bullet-wavy {
  background-color: transparent;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="80" viewBox="0 0 40 80"><path d="M20 0 C 35 20, 5 20, 20 40 C 35 60, 5 60, 20 80" fill="none" stroke="%23ec4899" stroke-width="8" stroke-linecap="round"/><path d="M20 0 C 35 20, 5 20, 20 40 C 35 60, 5 60, 20 80" fill="none" stroke="%23fbcfe8" stroke-width="3" stroke-linecap="round"/></svg>');
  background-repeat: repeat-y;
  background-size: 100% auto;
  animation: flowUp 0.3s linear infinite;
  filter: drop-shadow(0 0 10px #ec4899);
}

@keyframes flowUp {
  0% {
    background-position: 0 0;
  }

  100% {
    background-position: 0 80px;
  }
}

.bullet-bolt {
  background-color: transparent;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="30" height="60" viewBox="0 0 30 60"><path d="M15 0 L25 15 L10 30 L25 45 L15 60 L5 45 L20 30 L5 15 Z" fill="none" stroke="%2338BDF8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>');
  background-repeat: repeat-y;
  background-size: 100% 60px;
  animation: boltFlow 0.1s steps(2) infinite alternate;
}

@keyframes boltFlow {
  0% {
    background-position: 0 0;
    opacity: 1;
    filter: drop-shadow(0 0 8px #38bdf8) drop-shadow(0 0 15px #38bdf8) brightness(1);
  }

  100% {
    background-position: 5px 30px;
    opacity: 0.8;
    filter: drop-shadow(0 0 12px #38bdf8) drop-shadow(0 0 25px #38bdf8) brightness(1.4);
  }
}

.boss-explode-anim {
  animation: bossExplode 2s ease-out forwards;
}

@keyframes bossExplode {
  0% {
    transform: scale(1);
    opacity: 1;
    filter: brightness(1);
  }

  100% {
    transform: scale(2.5);
    opacity: 0;
    filter: brightness(2);
  }
}
</style>
