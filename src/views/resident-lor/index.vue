<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { provideMap } from './composables/useMap'
import { usePlayerMovement } from './composables/usePlayerMovement'
import { useZombies } from './composables/useZombies'
import { usePlayerShooting } from './composables/usePlayerShooting'
import { usePlayerHP } from './composables/usePlayerHP'
import { isWalkable as checkWalkable, findWalkableNear } from './utils/collision'
import GameMap from './components/GameMap.vue'
import GamePlayer from './components/GamePlayer.vue'
import GameZombies from './components/GameZombies.vue'
import GameBullets from './components/GameBullets.vue'
import type { Map as MapboxMap } from 'mapbox-gl'

const BASE = '/resident-lor'
const MAPBOX_TOKEN =
  'pk.eyJ1IjoidHVhbnRhbXR1b25nIiwiYSI6ImNsZ3lpd3Y4ODBhMzEzbHBlejh1Zjc3eGYifQ.i6qdKYjYC6bof7_KDOfGQA'

interface Province {
  name: string
  code: number
}

const provinces = ref<Province[]>([])
const selectedCode = ref<number>(1) // Hà Nội mặc định
const isLoadingProvinces = ref(true)
const isGeocoding = ref(false)

onMounted(async () => {
  try {
    const res = await fetch('https://provinces.open-api.vn/api/v2/')
    provinces.value = (await res.json()) as Province[]
  } catch {
    // Dùng vị trí mặc định nếu không tải được
  } finally {
    isLoadingProvinces.value = false
  }
})

interface GeocodeFeature {
  center: [number, number]
  bbox?: [number, number, number, number] // [minLng, minLat, maxLng, maxLat]
}

async function geocodeProvince(name: string): Promise<{ lat: number; lng: number } | null> {
  const encoded = encodeURIComponent(name + ', Việt Nam')
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?country=vn&types=place,region&language=vi&access_token=${MAPBOX_TOKEN}`
  try {
    const res = await fetch(url)
    const data = (await res.json()) as { features: GeocodeFeature[] }
    const feature = data.features[0]
    if (!feature) return null

    // Random điểm trong bbox của tỉnh thay vì luôn lấy center
    if (feature.bbox) {
      const [minLng, minLat, maxLng, maxLat] = feature.bbox
      // Lấy 70% vùng giữa để tránh biên tỉnh
      const margin = 0.15
      const latRange = maxLat - minLat
      const lngRange = maxLng - minLng
      const lat = minLat + latRange * (margin + Math.random() * (1 - margin * 2))
      const lng = minLng + lngRange * (margin + Math.random() * (1 - margin * 2))
      return { lat, lng }
    }

    return { lat: feature.center[1], lng: feature.center[0] }
  } catch {
    return null
  }
}

// Vị trí spawn có thể thay đổi theo tỉnh được chọn
let spawnLat = 10.799
let spawnLng = 106.7

const mapRef = ref<MapboxMap | null>(null)
provideMap(mapRef)

const isWalkable = (lat: number, lng: number) => checkWalkable(mapRef.value, lat, lng)

const getUnstuck = (lat: number, lng: number) => findWalkableNear(lat, lng, isWalkable)

const { position, keys } = usePlayerMovement(spawnLat, spawnLng, {
  isWalkable,
  getUnstuck,
})

const { zombies, hitZombie, reset: resetZombies, walkFrame } = useZombies(position, { isWalkable })

const score = ref(0)
const onZombieHit = (id: string) => {
  hitZombie(id)
  score.value += 1
}

const bullets = usePlayerShooting(position, mapRef, {
  isWalkable,
  zombies,
  onZombieHit,
})

const { hp, maxHp, isHit } = usePlayerHP(position, zombies)

function setKey(dir: 'w' | 'a' | 's' | 'd', val: boolean) {
  keys.value = { ...keys.value, [dir]: val }
}

const isStarted = ref(false)
const isGameOver = ref(false)
const finalScore = ref(0)

async function startGame() {
  isGeocoding.value = true
  const province = provinces.value.find((p) => p.code === selectedCode.value)
  if (province) {
    const pos = await geocodeProvince(province.name)
    if (pos) {
      spawnLat = pos.lat
      spawnLng = pos.lng
    }
  }
  isGeocoding.value = false
  position.value = { lat: spawnLat, lng: spawnLng }
  resetZombies()
  isStarted.value = true
}

watch(hp, (val) => {
  if (val <= 0) {
    isGameOver.value = true
    finalScore.value = score.value
  }
})

function playAgain() {
  isGameOver.value = false
  isStarted.value = false
  hp.value = maxHp
  score.value = 0
  position.value = { lat: spawnLat, lng: spawnLng }
  keys.value = { w: false, a: false, s: false, d: false }
  resetZombies()
  bullets.value = []
}
</script>

<template>
  <div class="resident-lor-view">
    <!-- Màn hình bắt đầu -->
    <div v-if="!isStarted" class="start-screen">
      <img :src="`${BASE}/bg-final.jpg`" alt="Resident Lỏ" class="start-bg" />
      <div class="start-menu">
        <div class="province-select-wrap">
          <label class="province-label">🗺️ Chọn tỉnh/thành phố</label>
          <select
            v-model="selectedCode"
            class="province-select"
            :disabled="isLoadingProvinces || isGeocoding"
          >
            <option v-if="isLoadingProvinces" :value="1">Đang tải...</option>
            <option v-for="p in provinces" :key="p.code" :value="p.code">
              {{ p.name }}
            </option>
          </select>
        </div>
        <button type="button" class="btn-start" :disabled="isGeocoding" @click="startGame">
          {{ isGeocoding ? '⏳ Đang tải...' : '▶ BẮT ĐẦU' }}
        </button>
        <RouterLink to="/" class="btn-home-start">🏠 Về trang chủ</RouterLink>
      </div>
    </div>

    <template v-else>
      <GameMap :center="position" />
      <GamePlayer :keys="keys" />
      <GameZombies :zombies="zombies" :walk-frame="walkFrame" />
      <GameBullets :bullets="bullets" />

      <div v-if="isGameOver" class="game-over-overlay">
        <div class="game-over-box">
          <h2 class="game-over-title">Hết màn</h2>
          <p class="game-over-score">
            Điểm: <strong>{{ finalScore }}</strong>
          </p>
          <button type="button" class="btn-play-again" @click="playAgain">Chơi lại</button>
        </div>
      </div>

      <div v-show="!isGameOver" class="hud">
        <div class="hud-row">
          <span class="hud-label">HP</span>
          <div class="hp-bar">
            <div class="hp-fill" :style="{ width: `${Math.max(0, (hp / maxHp) * 100)}%` }" />
          </div>
          <span class="hp-text">{{ Math.max(0, hp) }} / {{ maxHp }}</span>
        </div>
        <div class="hud-row score-row">
          <span class="hud-label">Điểm</span>
          <span class="score-value">{{ score }}</span>
        </div>
      </div>

      <!-- Màn hình đỏ khi zombie đánh -->
      <div v-if="isHit" class="damage-flash" />

      <!-- D-pad di chuyển trên mobile -->
      <div v-show="!isGameOver" class="dpad" data-no-shoot>
        <button
          class="dpad-btn dpad-up"
          @touchstart.prevent.stop="setKey('w', true)"
          @touchend.prevent.stop="setKey('w', false)"
          @touchcancel.prevent.stop="setKey('w', false)"
        >
          ▲
        </button>
        <button
          class="dpad-btn dpad-left"
          @touchstart.prevent.stop="setKey('a', true)"
          @touchend.prevent.stop="setKey('a', false)"
          @touchcancel.prevent.stop="setKey('a', false)"
        >
          ◀
        </button>
        <button
          class="dpad-btn dpad-right"
          @touchstart.prevent.stop="setKey('d', true)"
          @touchend.prevent.stop="setKey('d', false)"
          @touchcancel.prevent.stop="setKey('d', false)"
        >
          ▶
        </button>
        <button
          class="dpad-btn dpad-down"
          @touchstart.prevent.stop="setKey('s', true)"
          @touchend.prevent.stop="setKey('s', false)"
          @touchcancel.prevent.stop="setKey('s', false)"
        >
          ▼
        </button>
      </div>

      <RouterLink to="/" class="home-link" title="Về trang chủ"> 🏠 Về trang chủ </RouterLink>
    </template>
  </div>
</template>

<style scoped>
.resident-lor-view {
  position: relative;
  width: 100vw;
  height: 100vh;
}

.home-link {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 20;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 0.375rem;
  text-decoration: none;
  transition: background 0.2s;
}

.home-link:hover {
  background: rgba(0, 0, 0, 0.9);
}

.hud {
  position: fixed;
  top: 1rem;
  left: 1rem;
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: rgba(0, 0, 0, 0.75);
  color: #fff;
  font-size: 0.875rem;
  border-radius: 0.375rem;
  min-width: 140px;
}

.hud-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.hud-label {
  font-weight: 600;
  flex-shrink: 0;
}

.hp-bar {
  flex: 1;
  height: 12px;
  background: #333;
  border-radius: 6px;
  overflow: hidden;
}

.hp-fill {
  height: 100%;
  background: linear-gradient(90deg, #dc2626, #ef4444);
  border-radius: 6px;
  transition: width 0.15s ease;
}

.hp-text {
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}

.score-row .score-value {
  font-weight: 700;
  font-size: 1.125rem;
  color: #fbbf24;
}

.game-over-overlay {
  position: fixed;
  inset: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.85);
}

.game-over-box {
  text-align: center;
  padding: 2rem 2.5rem;
  background: rgba(30, 30, 30, 0.95);
  border-radius: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  min-width: 260px;
}

.game-over-title {
  margin: 0 0 1rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: #f87171;
}

.game-over-score {
  margin: 0 0 1.5rem;
  font-size: 1.125rem;
  color: #e5e5e5;
}

.game-over-score strong {
  color: #fbbf24;
  font-size: 1.25rem;
}

.btn-play-again {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.625rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
  background: #22c55e;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-play-again:hover {
  background: #16a34a;
}

/* Màn hình bắt đầu */
.start-screen {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 3.5rem;
}

.start-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.start-menu {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  width: min(320px, 90vw);
}

.province-select-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  width: 100%;
}

.province-label {
  color: #fff;
  font-size: 0.85rem;
  font-weight: 600;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.7);
}

.province-select {
  width: 100%;
  padding: 0.6rem 0.875rem;
  font-size: 1rem;
  font-family: inherit;
  color: #fff;
  background: rgba(0, 0, 0, 0.7);
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-radius: 0.4rem;
  cursor: pointer;
  outline: none;
  transition: border-color 0.15s;
}

.province-select:focus {
  border-color: #dc2626;
}

.province-select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-start:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-start {
  padding: 0.875rem 3rem;
  font-size: 1.375rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  color: #fff;
  background: #dc2626;
  border: 3px solid #fff;
  border-radius: 0.5rem;
  cursor: pointer;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.5);
  transition:
    transform 0.1s,
    background 0.15s;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
}

.btn-start:hover {
  background: #b91c1c;
  transform: scale(1.04);
}

.btn-start:active {
  transform: scale(0.97);
}

.btn-home-start {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.85);
  text-decoration: none;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
  transition: color 0.15s;
}

.btn-home-start:hover {
  color: #fff;
}

/* Màn hình đỏ khi bị damage */
.damage-flash {
  position: fixed;
  inset: 0;
  z-index: 25;
  pointer-events: none;
  background: rgba(220, 38, 38, 0.45);
  animation: flash-out 0.3s ease-out forwards;
}

@keyframes flash-out {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

/* D-pad di chuyển trên mobile */
.dpad {
  position: fixed;
  bottom: 2rem;
  left: 2rem;
  z-index: 20;
  display: grid;
  grid-template-areas:
    '. up .'
    'left . right'
    '. down .';
  gap: 6px;
}

.dpad-btn {
  width: 60px;
  height: 60px;
  background: rgba(0, 0, 0, 0.55);
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-radius: 10px;
  color: #fff;
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: none;
}

.dpad-btn:active {
  background: rgba(255, 255, 255, 0.25);
}

.dpad-up {
  grid-area: up;
}
.dpad-left {
  grid-area: left;
}
.dpad-right {
  grid-area: right;
}
.dpad-down {
  grid-area: down;
}

/* Ẩn D-pad trên desktop */
@media (hover: hover) and (pointer: fine) {
  .dpad {
    display: none;
  }
}
</style>
