<script setup lang="ts">
import { ref, nextTick, onUnmounted } from 'vue'
import { useHead } from '@unhead/vue'
import { Icon } from '@iconify/vue'
import { RouterLink } from 'vue-router'

import GameCanvas from './components/GameCanvas.vue'
import HUD from './components/HUD.vue'
import TurnOrder from './components/TurnOrder.vue'
import WeaponSelect from './components/WeaponSelect.vue'
import BuffPanel from './components/BuffPanel.vue'
import ResultScreen from './components/ResultScreen.vue'

import { useGameState, MAPS, BUFFS, ANIMAL_PRESETS } from './composables/useGameState'
import { useTerrain } from './composables/useTerrain'
import { usePhysics } from './composables/usePhysics'
import { useInput } from './composables/useInput'
import { useAI, type AIHardness } from './composables/useAI'
import { useGameLoop, stepFall } from './composables/useGameLoop'

import type { WeaponId, MapId, Character, CharacterPreset } from './types'

useHead({ title: 'Gunny Lite — Bắn súng tọa độ' })

// ─── Screen ──────────────────────────────────────────────────────────────────

const screen = ref<'menu' | 'playing'>('menu')

// ─── Composables ─────────────────────────────────────────────────────────────

const state = useGameState()
const terrain = useTerrain()
const physics = usePhysics()
const input = useInput()
const ai = useAI()

const canvasComp = ref<InstanceType<typeof GameCanvas> | null>(null)

// ─── Constants ───────────────────────────────────────────────────────────────

const ANGLE_SPEED = 60 // degrees/sec
const MOVE_SPEED = 100 // px/sec
const MAX_SLOPE_RATIO = Math.tan((60 * Math.PI) / 180) // tan(60°) ≈ 1.732
const STAMINA_PER_PX = 0.5 // stamina drained per pixel moved

/** Try to step character by dx, snapping to ground. Blocks if slope > 60°, no ground, or out of stamina. */
function tryMove(char: Character, dx: number): void {
  if (char.stamina <= 0) return

  // Clamp dx so we don't overshoot remaining stamina
  const maxPx = char.stamina / STAMINA_PER_PX
  const clampedDx = Math.sign(dx) * Math.min(Math.abs(dx), maxPx)

  const newX = Math.max(20, Math.min(terrain.mapWidth.value - 20, char.x + clampedDx))
  if (newX === char.x) return

  const newGroundY = terrain.getGroundY(newX, 0)
  if (newGroundY <= 0) return // no ground at destination

  // rise = how many px UP we'd climb (positive = climbing up)
  const feetY = char.y + 20
  const rise = feetY - newGroundY
  const run = Math.abs(newX - char.x)
  if (rise > 0 && run > 0 && rise / run > MAX_SLOPE_RATIO) return // too steep

  const moved = Math.abs(newX - char.x)
  char.x = newX
  char.y = newGroundY - 20
  char.stamina = Math.max(0, char.stamina - moved * STAMINA_PER_PX)
}

// ─── Game loop tick ───────────────────────────────────────────────────────────

function tick(dt: number) {
  const {
    turn,
    characters,
    wind,
    activeChar,
    isGameOver,
    advanceTurn,
    adjustAngle,
    tickPowerCharge,
    startPowerCharge,
    releasePower,
    applyHit,
    applyFallOutOfMap,
    tickTimer,
    confirmBuffs,
    toggleBuff,
  } = state

  if (isGameOver()) return

  const char = activeChar.value
  if (!char) return

  // ── Input handling (human player only) ────────────────────────────────────
  if (!char.isAI) {
    if (turn.phase === 'aiming') {
      if (input.isDown('ArrowUp')) adjustAngle(ANGLE_SPEED * dt)
      if (input.isDown('ArrowDown')) adjustAngle(-ANGLE_SPEED * dt)

      if (input.isDown('ArrowLeft')) {
        char.facingRight = false
        tryMove(char, -MOVE_SPEED * dt)
      }
      if (input.isDown('ArrowRight')) {
        char.facingRight = true
        tryMove(char, MOVE_SPEED * dt)
      }

      if (input.isDown('Space') && !turn.powerCharging) {
        startPowerCharge()
      }
      if (!input.isDown('Space') && turn.powerCharging) {
        const power = releasePower()
        doFire(char.x, char.y - 20, turn.angle, power)
      }
    }

    if (turn.phase === 'buff_select') {
      if (input.consumeKey('Enter')) confirmBuffs()
      // Number keys 1-8 toggle corresponding buff
      const buffIds = Object.keys(BUFFS) as import('./types').BuffId[]
      for (let i = 0; i < buffIds.length; i++) {
        const code = `Digit${i + 1}`
        if (input.consumeKey(code)) {
          const id = buffIds[i]
          if (id) toggleBuff(id)
        }
      }
    }

    const timedOut = tickTimer(dt)
    if (timedOut && turn.phase === 'aiming') {
      const power = releasePower()
      doFire(char.x, char.y - 20, turn.angle, power)
    }
  } else {
    // ── AI turn ──────────────────────────────────────────────────────────────
    if (turn.phase === 'ai_thinking') {
      const enemy = characters.find((c) => c.id !== char.id && c.alive)
      if (enemy) {
        setTimeout(
          () => {
            const decision = ai.computeDecision(char, enemy, wind)

            for (const buffId of decision.buffIds) {
              toggleBuff(buffId)
            }
            confirmBuffs()

            turn.angle = decision.angle
            turn.power = decision.power
            physics.fireProjectile(
              char.x,
              char.y - 20,
              decision.angle,
              decision.power,
              wind.value,
              char.facingRight,
              char.weapon,
              char.id,
              turn.activeBuffCoeff,
              turn.activeShotCount,
              turn.isTrident,
              false,
            )
            turn.phase = 'firing'
          },
          1000 + Math.random() * 1000,
        )
      }
      turn.phase = 'ai_aiming' // show aiming for a bit before firing
    }
  }

  tickPowerCharge(dt)

  // ── Projectile simulation ──────────────────────────────────────────────────
  if (turn.phase === 'firing') {
    const charTargets = characters
      .filter((c) => c.alive)
      .map((c) => ({ id: c.id, x: c.x, y: c.y, alive: c.alive }))

    const newExplosions = physics.tickProjectiles(
      wind.value,
      terrain.mapWidth.value,
      terrain.mapHeight.value,
      terrain.checkSolid,
      charTargets,
      dt,
    )

    for (const ex of newExplosions) {
      console.log(ex)
      if (ex.isTeleport) {
        // Move owner to landing position — no terrain damage, no enemy damage
        const owner = characters.find((c) => c.id === ex.ownerId && c.alive)
        if (owner) {
          const landX = Math.max(20, Math.min(terrain.mapWidth.value - 20, Math.round(ex.x)))
          const landY = terrain.getGroundY(landX, 0)
          if (landY > 0 && landY < terrain.mapHeight.value) {
            owner.x = landX
            owner.y = landY - 20
          }
          const enemy = characters.find((c) => c.id !== owner.id && c.alive)
          if (enemy) owner.facingRight = enemy.x > owner.x
        }
        continue
      }

      terrain.explode(ex.x, ex.y, ex.radius)

      for (const c of characters) {
        if (!c.alive) continue
        const dx = c.x - ex.x
        const dy = c.y - ex.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < ex.radius + 20) {
          const falloff = Math.max(0, 1 - dist / (ex.radius + 20))
          const { damage, isCrit } = applyHit(c.id, ex.ownerId)
          const actual = Math.round(damage * falloff)
          if (actual > 0) {
            physics.addDamageEvent({
              targetId: c.id,
              damage: actual,
              isCrit,
              x: c.x,
              y: c.y - 10,
              ttl: 1.5,
            })
          }
        }
      }
    }

    if (!physics.hasActiveProjectiles()) {
      turn.phase = 'resolving'
    }
  }

  physics.tickExplosions(dt)
  physics.tickDamageEvents(dt)

  // ── Character gravity / fall ───────────────────────────────────────────────
  let anyFalling = false
  for (const c of characters) {
    if (!c.alive) continue
    const grounded = terrain.checkGrounded(c.x, c.y, 32, 40)
    if (!grounded) {
      c.isFalling = true
      c.fallVy = stepFall(c.fallVy, dt)
      c.y += c.fallVy * dt
      if (c.y > terrain.mapHeight.value + 60) {
        applyFallOutOfMap(c.id)
        continue
      }
      anyFalling = true
    } else {
      const gy = terrain.getGroundY(c.x, c.y - 5)
      if (gy > 0 && c.isFalling) c.y = gy - 20
      c.isFalling = false
      c.fallVy = 0
    }
  }

  // ── Advance turn ───────────────────────────────────────────────────────────
  if (
    turn.phase === 'resolving' &&
    !anyFalling &&
    !physics.hasActiveProjectiles() &&
    physics.explosions.length === 0
  ) {
    if (!isGameOver()) advanceTurn()
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  const map = MAPS[state.selectedMap.value]
  canvasComp.value?.render((ctx) => terrain.renderTerrain(ctx, map.groundColor, map.skyColor))
}

const { start, stop } = useGameLoop(tick)

// ─── Fire helper ─────────────────────────────────────────────────────────────

function doFire(x: number, y: number, angle: number, power: number) {
  const char = state.activeChar.value
  if (!char) return
  physics.fireProjectile(
    x,
    y,
    angle,
    power,
    state.wind.value,
    char.facingRight,
    char.weapon,
    char.id,
    state.turn.activeBuffCoeff,
    state.turn.activeShotCount,
    state.turn.isTrident,
    state.turn.hasTeleport,
  )
  state.turn.phase = 'firing'
}

// ─── Start / rematch ─────────────────────────────────────────────────────────

async function startGame(
  p1Name: string,
  p1Weapon: WeaponId,
  p1Preset: CharacterPreset,
  p2Name: string,
  p2Weapon: WeaponId,
  p2Preset: CharacterPreset,
  vsAI: boolean,
  mapId: MapId,
  aiHardness: AIHardness = 'medium',
) {
  stop()
  physics.clearAll()

  const map = MAPS[mapId]
  ai.setHardness(aiHardness)
  state.setupGame(p1Name, p1Weapon, p1Preset, p2Name, p2Weapon, p2Preset, vsAI, mapId)
  terrain.initTerrain(map, Math.random() * 100)

  screen.value = 'playing'
  await nextTick()
  state.placeCharacters(map, terrain.getGroundY)
  start()
}

function rematch() {
  const p1 =
    ANIMAL_PRESETS.find((p) => p.emoji === state.characters[0]?.emoji) ?? ANIMAL_PRESETS[0]!
  const p2 =
    ANIMAL_PRESETS.find((p) => p.emoji === state.characters[1]?.emoji) ?? ANIMAL_PRESETS[1]!
  startGame(
    state.characters[0]?.name ?? 'P1',
    state.characters[0]?.weapon.id ?? 'brick',
    p1,
    state.characters[1]?.name ?? 'P2',
    state.characters[1]?.weapon.id ?? 'grenade',
    p2,
    state.characters[1]?.isAI ?? false,
    state.selectedMap.value,
  )
}

function quitMatch() {
  stop()
  state.clearResult()
  screen.value = 'menu'
}

onUnmounted(stop)
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col">
    <!-- ── Menu ──────────────────────────────────────────────────────────── -->
    <div
      v-if="screen === 'menu'"
      class="flex flex-col items-center justify-center min-h-screen p-4 gap-8"
    >
      <RouterLink
        to="/"
        class="absolute top-4 left-4 inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
      >
        <Icon icon="lucide:arrow-left" class="size-4" />
        Trang chủ
      </RouterLink>

      <div class="flex flex-col items-center gap-3 animate-fade-up">
        <span class="font-display text-xs tracking-widest text-accent-coral">// GUNNY LITE</span>
        <h1
          class="font-display text-5xl md:text-7xl font-bold text-text-primary text-center leading-none"
        >
          GUNNY<br />
          <span class="text-accent-coral">LITE</span>
        </h1>
        <p class="text-text-secondary text-center max-w-sm">
          Game bắn súng tọa độ 2D — mô phỏng cơ chế Gunny/DDTank kinh điển.<br />
          Địa hình phá hủy, hệ thống Delay, 5 loại vũ khí.
        </p>
      </div>

      <div class="animate-fade-up animate-delay-2">
        <WeaponSelect @start="startGame" />
      </div>

      <div
        class="animate-fade-up animate-delay-3 border border-border-default bg-bg-surface p-4 text-sm text-text-secondary grid grid-cols-2 gap-x-8 gap-y-1 max-w-sm w-full"
      >
        <span class="font-display text-xs tracking-widest text-text-dim col-span-2 mb-1"
          >// ĐIỀU KHIỂN</span
        >
        <span>↑ / ↓</span><span>Điều chỉnh góc bắn</span> <span>← / →</span
        ><span>Di chuyển nhân vật</span> <span>SPACE (giữ)</span><span>Tích lực bắn</span>
        <span>SPACE (thả)</span><span>Bắn đạn</span> <span>1 – 8</span
        ><span>Chọn / bỏ vật phẩm</span> <span>ENTER</span><span>Xác nhận buff</span>
      </div>
    </div>

    <!-- ── Playing ────────────────────────────────────────────────────────── -->
    <div v-else-if="screen === 'playing'" class="flex flex-col h-screen overflow-hidden">
      <!-- Top bar -->
      <div
        class="shrink-0 flex items-center justify-between px-4 py-2 bg-bg-surface border-b border-border-default"
      >
        <RouterLink
          to="/"
          class="inline-flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary transition w-24"
        >
          <Icon icon="lucide:home" class="size-3" />
          Trang chủ
        </RouterLink>
        <span class="font-display text-xs tracking-widest text-accent-coral">// GUNNY LITE</span>
        <span class="w-24"></span>
      </div>

      <!-- Turn order bar -->
      <div class="shrink-0 overflow-x-auto">
        <TurnOrder :turn-order="state.turnOrder.value" :active-char-id="state.turn.activeCharId" />
      </div>

      <!-- Game area -->
      <div class="flex flex-1 min-h-0 overflow-hidden">
        <!-- Buff panel -->
        <div v-if="state.activeChar.value" class="shrink-0 overflow-y-auto">
          <BuffPanel
            :active-char="state.activeChar.value"
            :selected-buffs="state.turn.selectedBuffs"
            :stamina="state.activeChar.value.stamina"
            :max-stamina="state.activeChar.value.maxStamina"
            :phase="state.turn.phase"
            :turn-count="state.turnCount.value"
            @toggle="state.toggleBuff"
            @confirm="state.confirmBuffs"
          />
        </div>

        <!-- Canvas -->
        <div class="flex-1 flex items-center justify-center overflow-hidden bg-bg-deep min-w-0">
          <GameCanvas
            ref="canvasComp"
            :characters="state.characters"
            :projectiles="physics.projectiles"
            :explosions="physics.explosions"
            :damage-events="physics.damageEvents"
            :map="MAPS[state.selectedMap.value]"
            :active-char-id="state.turn.activeCharId"
            :angle="state.turn.angle"
            :power="state.turn.power"
            :power-charging="state.turn.powerCharging"
            :phase="state.turn.phase"
            :wind="state.wind.value"
          />
        </div>

        <!-- HUD -->
        <HUD
          :characters="state.characters"
          :turn="state.turn"
          :wind="state.wind"
          :active-char="state.activeChar.value"
          @quit-match="quitMatch"
        />
      </div>

      <!-- Status bar -->
      <div
        class="shrink-0 px-4 py-2 bg-bg-surface border-t border-border-default flex items-center justify-between text-xs"
      >
        <span class="text-text-dim">
          Made by: <span class="font-display text-accent-coral">nabatti99</span> with love ❤️
        </span>
        <RouterLink
          to="/"
          class="font-display text-xs text-text-dim tracking-widest hover:text-accent-coral transition-colors"
        >
          vibe.j2team.org
        </RouterLink>
      </div>
    </div>

    <!-- ── Result overlay ─────────────────────────────────────────────────── -->
    <ResultScreen
      v-if="state.result.value"
      :result="state.result.value"
      :characters="state.characters"
      @rematch="rematch"
      @quit-match="quitMatch"
    />
  </div>
</template>
