<script setup lang="ts">
import { ref, watch } from 'vue'
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

const INITIAL_LAT = 10.799
const INITIAL_LNG = 106.7

const mapRef = ref<MapboxMap | null>(null)
provideMap(mapRef)

const isWalkable = (lat: number, lng: number) => checkWalkable(mapRef.value, lat, lng)

const getUnstuck = (lat: number, lng: number) => findWalkableNear(lat, lng, isWalkable)

const { position, keys } = usePlayerMovement(INITIAL_LAT, INITIAL_LNG, {
  isWalkable,
  getUnstuck,
})

const { zombies, hitZombie, reset: resetZombies } = useZombies(position, { isWalkable })

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

const { hp, maxHp } = usePlayerHP(position, zombies)

const isGameOver = ref(false)
const finalScore = ref(0)

watch(hp, (val) => {
  if (val <= 0) {
    isGameOver.value = true
    finalScore.value = score.value
  }
})

function playAgain() {
  isGameOver.value = false
  hp.value = maxHp
  score.value = 0
  position.value = { lat: INITIAL_LAT, lng: INITIAL_LNG }
  resetZombies()
  bullets.value = []
}
</script>

<template>
  <div class="resident-lor-view">
    <GameMap :center="position" />
    <GamePlayer :keys="keys" />
    <GameZombies :zombies="zombies" />
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

    <RouterLink to="/" class="home-link" title="Về trang chủ"> 🏠 Về trang chủ </RouterLink>
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
</style>
