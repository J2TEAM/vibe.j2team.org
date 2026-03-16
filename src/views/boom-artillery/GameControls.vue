<template>
  <div class="controls-wrapper">
    <!-- Status Bars -->
    <div class="status-bars-container">
      <!-- Stamina Bar -->
      <div class="stamina-strip">
        <span class="stamina-label">🏃 Thể lực</span>
        <div class="stamina-bar-track">
          <div
            class="stamina-bar-fill"
            :style="{ width: (playerStamina / MAX_STAMINA) * 100 + '%' }"
            :class="{
              'stamina-low': playerStamina < MAX_STAMINA * 0.2,
              'stamina-empty': playerStamina <= 0,
            }"
          ></div>
        </div>
        <span class="stamina-value">{{ Math.round(playerStamina) }}</span>
      </div>

      <!-- Power Bar -->
      <div class="power-strip">
        <span class="power-label">⚡ Lực: {{ Math.round(power) }}%</span>
        <span
          v-if="Math.abs(terrainSlopeOffset) > 0.5"
          class="slope-indicator"
          :class="{ 'slope-up': terrainSlopeOffset > 0, 'slope-down': terrainSlopeOffset < 0 }"
        >
          {{ terrainSlopeOffset > 0 ? '↘' : '↗' }} {{ Math.abs(terrainSlopeOffset).toFixed(1) }}°
        </span>
        <div class="power-bar-track" @click="onPowerBarClick">
          <div class="power-bar-fill-clip">
            <div
              class="power-bar-fill"
              :style="{ width: power + '%' }"
              :class="{ charging: isCharging }"
            ></div>
          </div>
          <!-- Power marker -->
          <div
            v-if="powerMarker !== null"
            class="power-marker"
            :style="{ left: powerMarker + '%' }"
          >
            <span class="power-marker-label">{{ powerMarker }}%</span>
          </div>
        </div>
        <button
          v-if="powerMarker !== null"
          class="marker-clear-btn"
          title="Xóa đánh dấu"
          @click="powerMarker = null"
        >
          ✕
        </button>
      </div>
    </div>

    <div class="main-controls">
      <!-- D-pad (Left) -->
      <div class="control-group d-pad">
        <div class="d-pad-row top">
          <button
            class="d-pad-btn up"
            :disabled="angleDisabled"
            @mousedown="$emit('angle-start', 'up')"
            @mouseup="$emit('angle-stop')"
            @mouseleave="$emit('angle-stop')"
            @touchstart.prevent="$emit('angle-start', 'up')"
            @touchend.prevent="$emit('angle-stop')"
          >
            ▲
          </button>
        </div>
        <div class="d-pad-row mid">
          <button
            class="d-pad-btn left"
            :disabled="disabled"
            @mousedown="$emit('move-start', 'left')"
            @mouseup="$emit('move-stop')"
            @mouseleave="$emit('move-stop')"
            @touchstart.prevent="$emit('move-start', 'left')"
            @touchend.prevent="$emit('move-stop')"
          >
            ◀
          </button>

          <div class="angle-widget-container" v-if="showAngle">
            <canvas ref="angleCanvasRef" class="angle-canvas" width="48" height="48"></canvas>
            <span class="angle-text">{{ Math.round(angle) }}°</span>
          </div>
          <div v-else class="angle-widget-placeholder"></div>

          <button
            class="d-pad-btn right"
            :disabled="disabled"
            @mousedown="$emit('move-start', 'right')"
            @mouseup="$emit('move-stop')"
            @mouseleave="$emit('move-stop')"
            @touchstart.prevent="$emit('move-start', 'right')"
            @touchend.prevent="$emit('move-stop')"
          >
            ▶
          </button>
        </div>
        <div class="d-pad-row bottom">
          <button
            class="d-pad-btn down"
            :disabled="angleDisabled"
            @mousedown="$emit('angle-start', 'down')"
            @mouseup="$emit('angle-stop')"
            @mouseleave="$emit('angle-stop')"
            @touchstart.prevent="$emit('angle-start', 'down')"
            @touchend.prevent="$emit('angle-stop')"
          >
            ▼
          </button>
        </div>
      </div>

      <!-- Weapons Selection (Center) -->
      <div v-if="!disabled" class="weapons-bar">
        <button
          v-for="wp in WEAPONS"
          :key="wp.id"
          class="weapon-btn"
          :class="{
            active:
              wp.id === 'standard'
                ? selectedWeaponIds.length === 0
                : selectedWeaponIds.includes(wp.id),
          }"
          :disabled="
            angleDisabled ||
            (wp.id !== 'standard' &&
              !selectedWeaponIds.includes(wp.id) &&
              playerStamina < wp.staminaCost)
          "
          @click="$emit('toggle-weapon', wp.id)"
        >
          <span class="wp-name">{{ wp.name }}</span>
          <span class="wp-cost" v-if="wp.id !== 'standard'">-{{ wp.staminaCost }} 🏃</span>
        </button>
      </div>
      <div v-else class="weapons-placeholder"></div>

      <!-- Actions (Right) -->
      <div class="action-buttons">
        <button
          class="fire-btn"
          :class="{ charging: isCharging }"
          :disabled="disabled"
          @mousedown="$emit('charge-start')"
          @mouseup="$emit('charge-release')"
          @mouseleave="onFireLeave"
          @touchstart.prevent="$emit('charge-start')"
          @touchend.prevent="$emit('charge-release')"
        >
          <span class="fire-icon">🔥</span>
          <span class="fire-text">
            {{ isCharging ? 'TỤ LỰC' : disabled ? 'ĐANG BẮN' : 'BẮN' }}
          </span>
        </button>

        <button class="skip-btn" :disabled="disabled" @click="$emit('skip-turn')">
          <span class="skip-icon">⏭</span> BỎ LƯỢT
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue'
import { MIN_ANGLE, MAX_ANGLE, WEAPONS, MAX_STAMINA } from './constants'

const props = defineProps<{
  power: number
  disabled: boolean
  angleDisabled: boolean
  isCharging: boolean

  // From HUD
  angle: number
  slopeAngle: number
  isFacingRight: boolean
  showAngle: boolean
  selectedWeaponIds: string[]
  playerStamina: number
  terrainSlopeOffset: number
}>()

const emit = defineEmits<{
  fire: []
  'charge-start': []
  'charge-release': []
  'move-start': [dir: 'left' | 'right']
  'move-stop': []
  'angle-start': [dir: 'up' | 'down']
  'angle-stop': []
  'skip-turn': []
  'toggle-weapon': [id: string]
}>()

const angleCanvasRef = ref<HTMLCanvasElement | null>(null)

const powerMarker = ref<number | null>(null)

function onPowerBarClick(e: MouseEvent) {
  const track = e.currentTarget as HTMLElement
  const rect = track.getBoundingClientRect()
  const pct = Math.round(((e.clientX - rect.left) / rect.width) * 100)
  const clampedPct = Math.max(0, Math.min(100, pct))

  // Toggle: click same spot again to remove
  if (powerMarker.value !== null && Math.abs(powerMarker.value - clampedPct) < 3) {
    powerMarker.value = null
  } else {
    powerMarker.value = clampedPct
  }
}

function onFireLeave() {
  if (props.isCharging) {
    emit('charge-release')
  }
}

function drawAngleWidget() {
  const canvas = angleCanvasRef.value
  if (!canvas || !props.showAngle) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const size = 48
  const cx = size / 2
  const cy = size / 2 + 3
  const radius = 17

  ctx.clearRect(0, 0, size, size)

  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(props.slopeAngle)

  if (!props.isFacingRight) {
    ctx.scale(-1, 1)
  }

  const minRad = (MIN_ANGLE * Math.PI) / 180
  const maxRad = (MAX_ANGLE * Math.PI) / 180

  ctx.beginPath()
  ctx.moveTo(0, 0)
  const steps = 24
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const a = minRad + (maxRad - minRad) * t
    ctx.lineTo(Math.cos(a) * radius, -Math.sin(a) * radius)
  }
  ctx.closePath()
  ctx.fillStyle = 'rgba(255, 255, 100, 0.08)'
  ctx.fill()

  ctx.strokeStyle = 'rgba(255, 255, 100, 0.25)'
  ctx.lineWidth = 1
  ctx.beginPath()
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const a = minRad + (maxRad - minRad) * t
    const px = Math.cos(a) * radius
    const py = -Math.sin(a) * radius
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.stroke()

  ctx.setLineDash([2, 2])
  ctx.strokeStyle = 'rgba(255, 255, 100, 0.15)'
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(Math.cos(minRad) * radius, -Math.sin(minRad) * radius)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(Math.cos(maxRad) * radius, -Math.sin(maxRad) * radius)
  ctx.stroke()
  ctx.setLineDash([])

  const currentRad = (props.angle * Math.PI) / 180
  const endX = Math.cos(currentRad) * radius
  const endY = -Math.sin(currentRad) * radius

  ctx.strokeStyle = 'rgba(255, 255, 100, 0.4)'
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(endX, endY)
  ctx.stroke()

  ctx.strokeStyle = 'rgba(255, 255, 100, 0.9)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(endX, endY)
  ctx.stroke()

  ctx.fillStyle = 'rgba(255, 255, 100, 0.9)'
  ctx.beginPath()
  ctx.arc(endX, endY, 2.5, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#22c55e'
  ctx.fillRect(-5, -2, 10, 4)
  ctx.fillStyle = '#16a34a'
  ctx.beginPath()
  ctx.arc(0, -2, 2.5, Math.PI, 0)
  ctx.fill()

  ctx.restore()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.arc(cx, cy, radius + 4, 0, Math.PI * 2)
  ctx.stroke()
}

watch(
  () => [props.angle, props.slopeAngle, props.isFacingRight, props.showAngle],
  () => {
    nextTick(drawAngleWidget)
  },
)

onMounted(() => {
  nextTick(drawAngleWidget)
})
</script>

<style scoped>
.controls-wrapper {
  background: rgba(15, 23, 42, 0.75);
  border-radius: 12px;
  margin-top: 0.2rem;
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Status Bars */
.status-bars-container {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.stamina-strip {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.25rem 0.5rem;
  background: rgba(0, 0, 0, 0.25);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.04);
}

.stamina-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: #60a5fa;
  white-space: nowrap;
  min-width: 60px;
}

.stamina-value {
  font-size: 0.75rem;
  font-weight: 700;
  color: #93c5fd;
  min-width: 24px;
  text-align: right;
}

.stamina-bar-track {
  flex: 1;
  height: 10px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: inset 0 1px 4px rgba(0, 0, 0, 0.3);
}

.stamina-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  border-radius: 6px;
  transition: width 0.08s linear;
  box-shadow: 0 0 8px rgba(59, 130, 246, 0.4);
}

.stamina-bar-fill.stamina-low {
  background: linear-gradient(90deg, #f59e0b, #ef4444);
  box-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
  animation: stamina-pulse 0.6s ease-in-out infinite alternate;
}

.stamina-bar-fill.stamina-empty {
  background: #6b7280;
  box-shadow: none;
  animation: none;
}

@keyframes stamina-pulse {
  from {
    filter: brightness(1);
  }
  to {
    filter: brightness(1.3);
  }
}

.power-strip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0.5rem;
  background: rgba(0, 0, 0, 0.35);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.power-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #fbbf24;
  white-space: nowrap;
  min-width: 75px;
}

.slope-indicator {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  white-space: nowrap;
  animation: slope-pulse 2s ease-in-out infinite;
}

.slope-indicator.slope-up {
  color: #34d399;
  background: rgba(52, 211, 153, 0.15);
  border: 1px solid rgba(52, 211, 153, 0.3);
}

.slope-indicator.slope-down {
  color: #f87171;
  background: rgba(248, 113, 113, 0.15);
  border: 1px solid rgba(248, 113, 113, 0.3);
}

@keyframes slope-pulse {
  0%,
  100% {
    opacity: 0.8;
  }
  50% {
    opacity: 1;
  }
}

.power-bar-track {
  flex: 1;
  height: 18px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 9px;
  overflow: visible;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.3);
  position: relative;
  cursor: pointer;
}

.power-bar-fill-clip {
  position: absolute;
  inset: 0;
  border-radius: 9px;
  overflow: hidden;
}

.power-strip .power-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #22c55e, #eab308 50%, #ef4444);
  border-radius: 9px;
  transition: width 0.05s linear;
  box-shadow: 0 0 12px rgba(234, 179, 8, 0.4);
}

.power-strip .power-bar-fill.charging {
  animation: pulse-power-strip 0.3s ease-in-out infinite alternate;
}

@keyframes pulse-power-strip {
  from {
    filter: brightness(1);
    box-shadow: 0 0 12px rgba(234, 179, 8, 0.4);
  }
  to {
    filter: brightness(1.4);
    box-shadow: 0 0 24px rgba(234, 179, 8, 0.7);
  }
}

.power-marker {
  position: absolute;
  top: -4px;
  bottom: -4px;
  width: 3px;
  background: #ef4444;
  border-radius: 2px;
  transform: translateX(-50%);
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.6);
  z-index: 2;
  pointer-events: none;
}

.power-marker-label {
  position: absolute;
  top: -16px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.6rem;
  font-weight: 700;
  color: #ef4444;
  white-space: nowrap;
}

.marker-clear-btn {
  width: 22px;
  height: 22px;
  border: 1px solid rgba(239, 68, 68, 0.3);
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border-radius: 4px;
  font-size: 0.65rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.marker-clear-btn:hover {
  background: rgba(239, 68, 68, 0.3);
}

.main-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

/* D-PAD */
.d-pad {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}
.d-pad-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
}
.d-pad-btn {
  width: 32px;
  height: 32px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: linear-gradient(145deg, rgba(56, 189, 248, 0.15), rgba(14, 165, 233, 0.05));
  color: #38bdf8;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
.d-pad-btn:hover:not(:disabled) {
  background: linear-gradient(145deg, rgba(56, 189, 248, 0.3), rgba(14, 165, 233, 0.15));
  transform: scale(1.05);
  border-color: rgba(56, 189, 248, 0.4);
}
.d-pad-btn:active:not(:disabled) {
  transform: scale(0.95);
}
.d-pad-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* Angle Widget */
.angle-widget-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 50%;
  position: relative;
  margin: 0 4px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}
.angle-widget-placeholder {
  width: 48px;
  height: 48px;
  margin: 0 4px;
}
.angle-canvas {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  pointer-events: none;
}
.angle-text {
  position: absolute;
  bottom: 2px;
  font-size: 0.55rem;
  font-weight: 800;
  color: rgba(255, 255, 100, 0.95);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}

/* Weapons Bar */
.weapons-bar,
.weapons-placeholder {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.3rem;
  flex: 1;
  max-width: 320px;
}
.weapon-btn {
  flex-shrink: 0;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #e2e8f0;
  border-radius: 6px;
  padding: 0.35rem 0.2rem;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.weapon-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
}
.weapon-btn.active {
  background: rgba(59, 130, 246, 0.25);
  border-color: #3b82f6;
  box-shadow: 0 0 8px rgba(59, 130, 246, 0.3);
  color: #fff;
}
.weapon-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
.wp-name {
  font-size: 0.55rem;
  font-weight: 700;
  line-height: 1.1;
  text-align: center;
}
.wp-cost {
  font-size: 0.5rem;
  color: #fbbf24;
  font-weight: 600;
}

/* Actions */
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  flex-shrink: 0;
  width: 90px;
}
.fire-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  background: linear-gradient(135deg, #ef4444, #f97316);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #fff;
  padding: 0.4rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
}
.fire-icon {
  font-size: 0.9rem;
}
.fire-text {
  font-size: 0.75rem;
  font-weight: 800;
}
.fire-btn.charging {
  background: linear-gradient(135deg, #f97316, #eab308);
  box-shadow: 0 2px 12px rgba(249, 115, 22, 0.5);
  animation: charging-shake 0.1s infinite alternate;
}
@keyframes charging-shake {
  from {
    transform: translateX(-1px);
  }
  to {
    transform: translateX(1px);
  }
}
.fire-btn:hover:not(:disabled):not(.charging) {
  transform: translateY(-1px);
}
.fire-btn:active:not(:disabled) {
  transform: scale(0.97);
}
.fire-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  filter: grayscale(0.8);
}

.skip-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.2rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #cbd5e1;
  padding: 0.3rem;
  border-radius: 6px;
  font-size: 0.65rem;
  font-weight: 600;
  cursor: pointer;
}
.skip-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}
.skip-btn:active:not(:disabled) {
  transform: scale(0.95);
}
.skip-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .controls-wrapper {
    padding: 0.4rem;
  }
  .main-controls {
    flex-wrap: wrap;
    justify-content: center;
  }
  .weapons-bar {
    order: -1;
    min-width: 100%;
    margin-bottom: 0.25rem;
    grid-template-columns: repeat(3, 1fr);
  }
  .action-buttons {
    flex-direction: row;
    width: 100%;
    max-width: none;
  }
  .fire-btn {
    flex: 2;
    padding: 0.5rem;
  }
  .skip-btn {
    flex: 1;
  }
}
</style>
