<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

type Team = 'blue' | 'red'

type Bot = {
  x: number
  y: number
  vx: number
  vy: number
  hp: number
  team: Team
  fireCd: number
}

const wrap = ref<HTMLDivElement | null>(null)
const hp = ref(100)
const ammo = ref(30)
const reserve = ref(90)
const kills = ref(0)
const team = ref<'Blue' | 'Red'>('Blue')
const roundBlue = ref(0)
const roundRed = ref(0)
const winText = ref('')
const fragPopup = ref(false)

let disposed = false
let raf = 0
let ctx: CanvasRenderingContext2D | null = null
let canvas: HTMLCanvasElement | null = null

const W = 1280
const H = 720

const player = { x: W * 0.5, y: H * 0.65, speed: 260 }
const keys: Record<string, boolean> = {}
const mouse = { x: W * 0.5, y: H * 0.5 }

let roundTransition = false
let shotCd = 0
let spray = 0

const bots: Bot[] = []
const walls = [
  { x: 150, y: 130, w: 280, h: 24 },
  { x: 430, y: 250, w: 24, h: 210 },
  { x: 760, y: 220, w: 24, h: 240 },
  { x: 1000, y: 150, w: 220, h: 24 },
  { x: 1040, y: 450, w: 24, h: 200 },
  { x: 250, y: 520, w: 24, h: 170 },
  { x: 520, y: 560, w: 300, h: 24 },
]

function spawnBots(perTeam = 6) {
  bots.length = 0
  const n = Math.min(8, perTeam)
  for (let i = 0; i < n; i++) {
    bots.push({
      x: 130 + Math.random() * 350,
      y: 80 + Math.random() * 200,
      vx: 0,
      vy: 0,
      hp: 100,
      team: 'red',
      fireCd: Math.random(),
    })
    bots.push({
      x: 820 + Math.random() * 300,
      y: 380 + Math.random() * 220,
      vx: 0,
      vy: 0,
      hp: 100,
      team: 'blue',
      fireCd: Math.random(),
    })
  }
}

function resetRound() {
  hp.value = 100
  ammo.value = 30
  reserve.value = 90
  shotCd = 0
  spray = 0
  player.x = W * 0.5
  player.y = H * 0.65
  spawnBots(6)
}

function reload() {
  if (ammo.value >= 30 || reserve.value <= 0) return
  const need = 30 - ammo.value
  const take = Math.min(need, reserve.value)
  ammo.value += take
  reserve.value -= take
}

function damagePlayer(dmg: number) {
  hp.value = Math.max(0, hp.value - dmg)
  if (hp.value <= 0) {
    hp.value = 100
    player.x = W * 0.5
    player.y = H * 0.65
  }
}

function nearestEnemy(b: Bot): Bot | null {
  let best: Bot | null = null
  let bestD = 1e9
  for (const o of bots) {
    if (o === b || o.team === b.team || o.hp <= 0) continue
    const dx = o.x - b.x
    const dy = o.y - b.y
    const d = dx * dx + dy * dy
    if (d < bestD) {
      bestD = d
      best = o
    }
  }
  return best
}

function checkRoundWin() {
  if (roundTransition) return
  const red = bots.filter((b) => b.hp > 0 && b.team === 'red').length
  const blue = bots.filter((b) => b.hp > 0 && b.team === 'blue').length
  if (red === 0 || blue === 0) {
    roundTransition = true
    const winner = red === 0 ? 'BLUE WIN' : 'RED WIN'
    if (winner === 'BLUE WIN') roundBlue.value++
    else roundRed.value++

    let c = 3
    winText.value = `${winner} — NEXT ROUND IN ${c}`
    const timer = setInterval(() => {
      c--
      if (c >= 0) winText.value = `${winner} — NEXT ROUND IN ${c}`
      else {
        clearInterval(timer)
        resetRound()
        winText.value = 'FIGHT!'
        setTimeout(() => {
          winText.value = ''
          roundTransition = false
        }, 500)
      }
    }, 1000)
  }
}

function shootPlayer() {
  if (roundTransition) return
  if (shotCd > 0) return
  if (ammo.value <= 0) return

  ammo.value--
  shotCd = 1 / 10

  const spread = Math.min(20, 4 + spray * 1.2)
  spray = Math.min(25, spray + 1)

  const tx = mouse.x + (Math.random() - 0.5) * spread
  const ty = mouse.y + (Math.random() - 0.5) * spread

  let hit: Bot | null = null
  let best = 1e9
  for (const b of bots) {
    if (b.hp <= 0 || b.team === 'blue') continue
    const d = Math.hypot(b.x - tx, b.y - ty)
    if (d < 26 && d < best) {
      best = d
      hit = b
    }
  }

  if (hit) {
    hit.hp -= best < 14 ? 100 : 38
    if (hit.hp <= 0) {
      kills.value++
      fragPopup.value = true
      setTimeout(() => (fragPopup.value = false), 300)
      checkRoundWin()
    }
  }
}

function draw() {
  if (!ctx) return
  ctx.clearRect(0, 0, W, H)

  // dust background
  const g = ctx.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0, '#cdb07b')
  g.addColorStop(1, '#b58f58')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)

  // walls
  ctx.fillStyle = '#8f744a'
  for (const w of walls) ctx.fillRect(w.x, w.y, w.w, w.h)

  // player
  ctx.fillStyle = '#66aaff'
  ctx.beginPath()
  ctx.arc(player.x, player.y, 16, 0, Math.PI * 2)
  ctx.fill()

  // bots
  for (const b of bots) {
    if (b.hp <= 0) continue
    ctx.fillStyle = b.team === 'red' ? '#cc4444' : '#4da3ff'
    ctx.beginPath()
    ctx.arc(b.x, b.y, 14, 0, Math.PI * 2)
    ctx.fill()

    // hp bar
    ctx.fillStyle = 'rgba(0,0,0,.35)'
    ctx.fillRect(b.x - 15, b.y - 22, 30, 4)
    ctx.fillStyle = '#7cff82'
    ctx.fillRect(b.x - 15, b.y - 22, Math.max(0, 30 * (b.hp / 100)), 4)
  }

  // crosshair
  ctx.strokeStyle = 'rgba(255,255,255,.85)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(mouse.x - 10, mouse.y)
  ctx.lineTo(mouse.x + 10, mouse.y)
  ctx.moveTo(mouse.x, mouse.y - 10)
  ctx.lineTo(mouse.x, mouse.y + 10)
  ctx.stroke()
}

function tick(dt: number) {
  if (shotCd > 0) shotCd -= dt
  if (shotCd <= 0) spray = Math.max(0, spray - 0.45)

  const sp = (keys.ShiftLeft ? 1.45 : 1) * player.speed * dt
  if (keys.KeyW) player.y -= sp
  if (keys.KeyS) player.y += sp
  if (keys.KeyA) player.x -= sp
  if (keys.KeyD) player.x += sp
  player.x = Math.max(20, Math.min(W - 20, player.x))
  player.y = Math.max(20, Math.min(H - 20, player.y))

  for (const b of bots) {
    if (b.hp <= 0) continue

    const enemy = nearestEnemy(b)
    if (!enemy) continue

    const dx = enemy.x - b.x
    const dy = enemy.y - b.y
    const d = Math.hypot(dx, dy)
    const nx = dx / Math.max(1, d)
    const ny = dy / Math.max(1, d)

    if (d > 140) {
      b.x += nx * 70 * dt
      b.y += ny * 70 * dt
    }

    b.fireCd -= dt
    if (d < 260 && b.fireCd <= 0) {
      b.fireCd = 0.6 + Math.random() * 0.4
      const hitChance = Math.max(0.2, 0.9 - d / 450)
      if (Math.random() < hitChance) {
        if (enemy.team === 'red') {
          enemy.hp -= 24 + Math.random() * 12
          if (enemy.hp <= 0) checkRoundWin()
        }
      }

      // bot can hit player if enemy team vs player side
      if (b.team === 'red') {
        const dp = Math.hypot(player.x - b.x, player.y - b.y)
        if (dp < 260 && Math.random() < Math.max(0.2, 0.9 - dp / 450)) {
          damagePlayer(6 + Math.random() * 7)
        }
      }
    }

    b.x = Math.max(16, Math.min(W - 16, b.x))
    b.y = Math.max(16, Math.min(H - 16, b.y))
  }

  draw()
}

onMounted(() => {
  if (!wrap.value) return

  canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  canvas.className = 'h-full w-full'
  wrap.value.appendChild(canvas)

  ctx = canvas.getContext('2d')
  if (!ctx) return

  spawnBots(6)

  const kd = (e: KeyboardEvent) => {
    keys[e.code] = true
    if (e.code === 'KeyR') reload()
  }
  const ku = (e: KeyboardEvent) => {
    keys[e.code] = false
  }
  const mm = (e: MouseEvent) => {
    if (!canvas) return
    const r = canvas.getBoundingClientRect()
    mouse.x = ((e.clientX - r.left) / r.width) * W
    mouse.y = ((e.clientY - r.top) / r.height) * H
  }
  const md = (e: MouseEvent) => {
    if (e.button !== 0) return
    shootPlayer()
  }

  window.addEventListener('keydown', kd)
  window.addEventListener('keyup', ku)
  canvas.addEventListener('mousemove', mm)
  canvas.addEventListener('mousedown', md)

  let last = performance.now()
  const loop = (now: number) => {
    if (disposed) return
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    tick(dt)
    raf = requestAnimationFrame(loop)
  }
  raf = requestAnimationFrame(loop)

  onUnmounted(() => {
    disposed = true
    cancelAnimationFrame(raf)
    window.removeEventListener('keydown', kd)
    window.removeEventListener('keyup', ku)
    canvas?.removeEventListener('mousemove', mm)
    canvas?.removeEventListener('mousedown', md)
  })
})
</script>

<template>
  <div class="min-h-screen bg-[#111317] text-white">
    <header class="flex items-center justify-between border-b border-white/10 px-4 py-3">
      <RouterLink to="/" class="text-sm text-white/80 hover:text-white"
        >&larr; Về trang chủ</RouterLink
      >
      <h1 class="text-sm font-bold tracking-wide text-amber-300">CS LITE ARENA</h1>
      <a
        href="https://github.com/Linh-NDD"
        target="_blank"
        rel="noopener noreferrer"
        class="text-sm text-white/70 hover:text-white"
        >GitHub</a
      >
    </header>

    <div class="relative mx-auto h-[calc(100vh-56px)] max-w-7xl p-2 sm:p-3">
      <div
        class="pointer-events-none absolute left-1/2 top-4 z-20 -translate-x-1/2 rounded-lg border border-white/15 bg-black/40 px-3 py-1.5 backdrop-blur-sm"
      >
        <span class="font-black text-sky-300">BLUE</span>
        <span class="mx-2 font-mono text-2xl font-black text-sky-300">{{ roundBlue }}</span>
        <span class="font-mono text-lg text-white/70">:</span>
        <span class="mx-2 font-mono text-2xl font-black text-red-300">{{ roundRed }}</span>
        <span class="font-black text-red-300">RED</span>
      </div>

      <div
        class="pointer-events-none absolute left-4 bottom-4 z-20 rounded-lg border border-amber-300/30 bg-black/45 px-3 py-2 text-amber-200 backdrop-blur-sm"
      >
        <div class="font-mono text-sm">
          HP <span class="text-xl font-black">{{ hp }}</span>
        </div>
        <div class="font-mono text-sm">
          AMMO <span class="text-xl font-black">{{ ammo }}</span
          >/<span>{{ reserve }}</span>
        </div>
        <div class="font-mono text-sm">
          KILLS <span class="text-xl font-black">{{ kills }}</span>
        </div>
        <div class="font-mono text-sm">
          TEAM <span class="text-lg font-black">{{ team }}</span>
        </div>
      </div>

      <div
        v-if="winText"
        class="pointer-events-none absolute left-1/2 top-20 z-20 -translate-x-1/2 text-lg font-black text-white/85"
      >
        {{ winText }}
      </div>

      <div
        v-if="fragPopup"
        class="pointer-events-none absolute inset-0 z-20 flex items-center justify-center text-5xl font-black text-white/60"
      >
        💀 +1
      </div>

      <div
        ref="wrap"
        class="h-full w-full overflow-hidden rounded-xl border border-white/10 bg-black/30"
      />
    </div>
  </div>
</template>
