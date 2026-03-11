<template>
  <div class="boom-artillery">
    <!-- MENU -->
    <MenuScreen
      v-if="gameState === 'menu'"
      v-model="difficulty"
      v-model:gameMode="gameMode"
      @start="handleStart"
    />

    <!-- GAME -->
    <div v-else class="game-screen">
      <GameHud
        :player-h-p="playerHP"
        :bot-h-p="botHP"
        :current-turn="currentTurn"
        :game-mode="gameMode"
        :wind="wind"
        :diff-label="diffLabel"
        @exit="exitToMenu"
        @home="goHome"
      />

      <div class="canvas-container">
        <!-- Wind Display (Floating center top) -->
        <div v-if="gameState === 'playing'" class="floating-wind">
          <span class="wind-label">Gió:</span>
          <span class="wind-arrow">
            {{ wind > 0 ? '→' : '←' }}
          </span>
          <span class="wind-value">{{ Math.abs(wind).toFixed(1) }}</span>
        </div>

        <canvas
          ref="canvasRef"
          class="game-canvas"
          @mousedown="onMouseDown"
          @mousemove="onMouseMove"
          @mouseup="onMouseUp"
          @touchstart.prevent="onTouchStart"
          @touchmove.prevent="onTouchMove"
          @touchend.prevent="onTouchEnd"
        ></canvas>
      </div>

      <GameControls
        v-if="gameState === 'playing'"
        :power="playerPower"
        :disabled="isFiring || (currentTurn === 'bot' && gameMode === 'pve')"
        :angle-disabled="isFiring"
        :is-charging="isCharging"
        :angle="playerAngle"
        :slope-angle="playerSlopeRad"
        :is-facing-right="isFacingRight"
        :show-angle="(currentTurn === 'player' || gameMode === 'pvp') && gameState === 'playing'"
        :selected-weapon-ids="selectedWeaponIds"
        :player-stamina="playerStamina"
        :terrain-slope-offset="terrainSlopeOffset"
        :remaining-shots="remainingShots"
        @charge-start="startCharging"
        @charge-release="releaseCharge"
        @move-start="startMove"
        @move-stop="stopMove"
        @angle-start="startAngleAdjust"
        @angle-stop="stopAngleAdjust"
        @toggle-weapon="toggleWeapon"
        @skip-turn="skipTurn"
      />

      <GameOverlay
        v-if="gameState === 'gameover'"
        :winner="winner"
        :game-mode="gameMode"
        :total-shots="totalShots"
        :total-hits="totalHits"
        :accuracy="accuracy"
        @restart="handleStart"
        @menu="gameState = 'menu'"
        @home="goHome"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { MAX_ANGLE, MIN_ANGLE } from './constants'
import GameControls from './GameControls.vue'
import GameHud from './GameHud.vue'
import GameOverlay from './GameOverlay.vue'
import MenuScreen from './MenuScreen.vue'
import { useGameEngine } from './useGameEngine'

const canvasRef = ref<HTMLCanvasElement | null>(null)
const router = useRouter()

const {
  gameState,
  gameMode,
  difficulty,
  currentTurn,
  isFiring,
  winner,
  playerAngle,
  playerPower,
  playerHP,
  botHP,
  wind,
  totalShots,
  totalHits,
  diffLabel,
  accuracy,
  isCharging,
  terrainSlopeOffset,
  playerStamina,
  isFacingRight,
  playerSlopeRad,
  remainingShots,
  selectedWeaponIds,
  prepareGame,
  initCanvas,
  stopGame,
  resizeCanvas,
  updateBarrelAngle,
  startCharging,
  releaseCharge,
  startMove,
  stopMove,
  startAngleAdjust,
  stopAngleAdjust,
  toggleWeapon,
  exitToMenu,
  skipTurn,
  onKeyDown,
  onKeyUp,
} = useGameEngine()

// ============ HANDLERS ============
function handleStart() {
  prepareGame()
  nextTick(() => {
    if (canvasRef.value) {
      initCanvas(canvasRef.value)
    }
  })
}

function goHome() {
  stopGame()
  router.push('/')
}

// ============ MOUSE / TOUCH (canvas drag for angle) ============
let isDragging = false
let dragStartY = 0

function onMouseDown(e: MouseEvent) {
  if (isFiring.value) return
  isDragging = true
  dragStartY = e.offsetY
}

function onMouseMove(e: MouseEvent) {
  if (!isDragging) return
  const dy = dragStartY - e.offsetY
  const newAngle = Math.round(
    Math.max(MIN_ANGLE, Math.min(MAX_ANGLE, playerAngle.value + dy * 0.3)),
  )
  playerAngle.value = newAngle
  updateBarrelAngle(newAngle)
  dragStartY = e.offsetY
}

function onMouseUp() {
  isDragging = false
}

function onTouchStart(e: TouchEvent) {
  if (isFiring.value) return
  const touch = e.touches[0]
  if (!touch) return
  isDragging = true
  dragStartY = touch.clientY
}

function onTouchMove(e: TouchEvent) {
  if (!isDragging) return
  const touch = e.touches[0]
  if (!touch) return
  const dy = dragStartY - touch.clientY
  const newAngle = Math.round(
    Math.max(MIN_ANGLE, Math.min(MAX_ANGLE, playerAngle.value + dy * 0.3)),
  )
  playerAngle.value = newAngle
  updateBarrelAngle(newAngle)
  dragStartY = touch.clientY
}

function onTouchEnd() {
  isDragging = false
}

// ============ RESIZE ============
function handleResize() {
  if (canvasRef.value) {
    resizeCanvas(canvasRef.value)
  }
}

// ============ LIFECYCLE ============
onMounted(() => {
  window.addEventListener('resize', handleResize)
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
})

onUnmounted(() => {
  stopGame()
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
})
</script>

<style scoped>
.boom-artillery {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: #0f172a;
  color: #e2e8f0;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.game-screen {
  width: 100%;
  height: 100%;
  max-width: 1000px;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  position: relative;
}

.canvas-container {
  display: flex;
  flex-direction: column;
  position: relative;
  flex: 1;
  min-height: 0;
  width: 100%;
}

.floating-wind {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  padding: 4px 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 10;
  pointer-events: none;
}

.wind-label {
  font-size: 0.8rem;
  color: #94a3b8;
}

.wind-arrow {
  color: #38bdf8;
  font-weight: 700;
  font-size: 1rem;
}

.wind-value {
  color: #38bdf8;
  font-weight: 600;
  font-size: 0.9rem;
}

.game-canvas {
  display: block;
  margin: 0 auto;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: #0f172a;
  cursor: crosshair;
  max-width: 100%;
  object-fit: contain;
  flex: 1;
  min-height: 0;
}
</style>
