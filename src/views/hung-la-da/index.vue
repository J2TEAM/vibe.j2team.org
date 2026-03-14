<template>
  <div class="wrap">
    <canvas ref="canvasRef" />

    <button class="mute-btn" @click="toggleMute" :title="muted ? 'Bật nhạc' : 'Tắt nhạc'">
      {{ muted ? '🔇' : '🔊' }}
    </button>

    <div class="ui">
      <div>
        <div class="lbl">☸ CÔNG ĐỨC</div>
        <div class="pts">{{ score }}</div>
      </div>
      <div style="text-align:center">
        <div class="lbl">⏱ THỜI GIAN</div>
        <div class="pts">{{ timerDisplay }}</div>
      </div>
    </div>

    <!-- Màn hình bắt đầu -->
    <div v-if="screen === 'start'" class="overlay">
      <div class="overlay-title">🍃 Hứng Lá Đa</div>
      <p class="overlay-sub">Dùng bát để hứng lá đa rơi</p>
      <p class="overlay-sub">tích lũy công đức trong 3 phút</p>
      <button class="g-btn" @click="startGame">🙏 Bắt đầu</button>
    </div>

    <!-- Màn hình kết thúc -->
    <div v-if="screen === 'end'" class="overlay">
      <div class="overlay-title">🙏 Hết giờ!</div>
      <p class="overlay-label">Công đức tích được</p>
      <div class="overlay-score">{{ score }}</div>
      <button class="g-btn" @click="restartGame">↩ Chơi lại</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

// ── Canvas & kích thước ──────────────────────────────────────
const canvasRef = ref(null)
const W = 480, H = 580

// ── State ────────────────────────────────────────────────────
const score     = ref(0)
const timeLeft  = ref(180)
const screen    = ref('start')   // 'start' | 'playing' | 'end'
const muted     = ref(false)

const timerDisplay = computed(() => {
  const m = Math.floor(timeLeft.value / 60)
  const s = Math.floor(timeLeft.value % 60)
  return `${m}:${String(s).padStart(2, '0')}`
})

// ── Game internals ───────────────────────────────────────────
let ctx        = null
let frame      = 0
let startTime  = null
let rafId      = null
let leaves     = []
let sparks     = []
let floats     = []
let bowl       = { x: W / 2, y: H - 55, w: 76, h: 28 }

// ── Audio ────────────────────────────────────────────────────
let audioCtx   = null
let masterGain = null
let bgGain     = null
let bgNodes    = []

function ensureAudio() {
  if (audioCtx) return
  audioCtx   = new (window.AudioContext || window.webkitAudioContext)()
  masterGain = audioCtx.createGain()
  masterGain.gain.value = 1
  masterGain.connect(audioCtx.destination)
  bgGain = audioCtx.createGain()
  bgGain.gain.value = 0.18
  bgGain.connect(masterGain)
  startBgMusic()
}

function startBgMusic() {
  ;[130.81, 196.00, 261.63].forEach((freq, i) => {
    const osc = audioCtx.createOscillator()
    const g   = audioCtx.createGain()
    osc.type           = 'sine'
    osc.frequency.value = freq + i * 0.3
    g.gain.value        = i === 0 ? 0.55 : 0.25
    osc.connect(g); g.connect(bgGain); osc.start(); bgNodes.push(osc)

    const lfo  = audioCtx.createOscillator()
    const lfoG = audioCtx.createGain()
    lfo.frequency.value = 0.12 + i * 0.07
    lfoG.gain.value     = 0.08
    lfo.connect(lfoG); lfoG.connect(g.gain); lfo.start(); bgNodes.push(lfo)
  })
  const b  = audioCtx.createOscillator()
  const bG = audioCtx.createGain()
  b.type = 'sine'; b.frequency.value = 523.25; bG.gain.value = 0.12
  b.connect(bG); bG.connect(bgGain); b.start(); bgNodes.push(b)
  scheduleBell()
}

function scheduleBell() {
  if (!audioCtx) return
  setTimeout(() => {
    playBellNote([392, 523.25, 659.25][Math.floor(Math.random() * 3)], 0.09, 2.2)
    scheduleBell()
  }, (6 + Math.random() * 8) * 1000)
}

function playBellNote(freq, vol, dur) {
  if (!audioCtx || muted.value) return
  ;[[freq, vol, dur], [freq * 2.756, vol * 0.3, dur * 0.6]].forEach(([f, v, d]) => {
    const o = audioCtx.createOscillator()
    const g = audioCtx.createGain()
    o.type = 'sine'; o.frequency.value = f
    g.gain.setValueAtTime(0, audioCtx.currentTime)
    g.gain.linearRampToValueAtTime(v, audioCtx.currentTime + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + d)
    o.connect(g); g.connect(masterGain)
    o.start(); o.stop(audioCtx.currentTime + d + 0.05)
  })
}

function playTing() {
  if (!audioCtx || muted.value) return
  ;[[880, 0.22, 1.4], [880 * 2.65, 0.10, 0.9], [880 * 5.1, 0.05, 0.5]].forEach(([f, v, d]) => {
    const o = audioCtx.createOscillator()
    const g = audioCtx.createGain()
    o.type = 'sine'; o.frequency.value = f
    g.gain.setValueAtTime(0, audioCtx.currentTime)
    g.gain.linearRampToValueAtTime(v, audioCtx.currentTime + 0.005)
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + d)
    o.connect(g); g.connect(masterGain)
    o.start(); o.stop(audioCtx.currentTime + d + 0.05)
  })
  const buf  = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.02, audioCtx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++)
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 3)
  const src = audioCtx.createBufferSource()
  const g   = audioCtx.createGain()
  g.gain.value = 0.04
  src.buffer = buf; src.connect(g); g.connect(masterGain); src.start()
}

function playEndBell() {
  if (!audioCtx) return
  ;[261.63, 329.63, 392, 523.25].forEach((f, i) =>
    setTimeout(() => playBellNote(f, 0.18, 3.5), i * 300)
  )
}

function toggleMute() {
  muted.value = !muted.value
  if (masterGain) masterGain.gain.value = muted.value ? 0 : 1
}

// ── Helpers ──────────────────────────────────────────────────
function rnd(a, b) { return a + Math.random() * (b - a) }

const CANOPY = [
  { x: 100, y: 70  }, { x: 60,  y: 90  }, { x: 140, y: 55  }, { x: 185, y: 80  },
  { x: 30,  y: 110 }, { x: 220, y: 100 }, { x: 80,  y: 130 }, { x: 160, y: 110 },
]

function getSpeedMult() { return 1 + Math.min((180 - timeLeft.value) / 60, 2.5) }

function spawnLeaf() {
  const src  = CANOPY[Math.floor(Math.random() * CANOPY.length)]
  const hue  = rnd(95, 130), lit = rnd(22, 38), sat = rnd(45, 65)
  const sm   = getSpeedMult()
  leaves.push({
    x: src.x + rnd(-20, 20), y: src.y + rnd(-10, 20),
    vx: rnd(-0.8, 0.8),      vy: rnd(0.5, 1.1) * sm,
    rot: rnd(0, Math.PI * 2), rotV: rnd(-0.03, 0.03),
    w: rnd(22, 30),           h: rnd(14, 20),
    wave: rnd(0, Math.PI * 2), waveSpd: rnd(0.015, 0.03),
    col:  `hsl(${hue},${sat}%,${lit}%)`,
    col2: `hsl(${hue + 10},${sat - 10}%,${lit + 8}%)`,
    caught: false, alpha: 1, dying: false,
  })
}

// ── Draw ─────────────────────────────────────────────────────
function drawSky() {
  const g = ctx.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0, '#100800'); g.addColorStop(0.3, '#2a1200')
  g.addColorStop(0.65, '#4a2200'); g.addColorStop(1, '#1a0e00')
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
  const mg = ctx.createRadialGradient(W * 0.75, 50, 0, W * 0.75, 50, 120)
  mg.addColorStop(0, 'rgba(255,220,100,0.18)')
  mg.addColorStop(0.4, 'rgba(255,180,60,0.06)')
  mg.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = mg; ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = 'rgba(255,240,180,0.7)'
  ctx.beginPath(); ctx.arc(W * 0.75, 42, 18, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = 'rgba(255,250,220,0.5)'
  ctx.beginPath(); ctx.arc(W * 0.75, 42, 12, 0, Math.PI * 2); ctx.fill()
}

function drawGround() {
  ctx.fillStyle = '#0a0500'; ctx.fillRect(0, H - 55, W, 55)
  ctx.fillStyle = '#160b00'
  ctx.beginPath(); ctx.ellipse(W / 2, H - 30, 200, 25, 0, 0, Math.PI * 2); ctx.fill()
  ctx.strokeStyle = 'rgba(80,40,0,0.4)'; ctx.lineWidth = 0.5
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath(); ctx.ellipse(W / 2 + i * 60, H - 30, 25, 10, 0, 0, Math.PI * 2); ctx.stroke()
  }
}

function drawBuddha() {
  const bx = W * 0.63, by = H * 0.58
  ctx.save()
  const ag = ctx.createRadialGradient(bx, by - 105, 5, bx, by - 105, 90)
  ag.addColorStop(0, 'rgba(255,190,50,0.3)')
  ag.addColorStop(0.5, 'rgba(255,140,20,0.08)')
  ag.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = ag; ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = 'rgba(255,180,40,0.45)'; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.arc(bx, by - 105, 42, 0, Math.PI * 2); ctx.stroke()
  ctx.strokeStyle = 'rgba(255,180,40,0.12)'; ctx.lineWidth = 10
  ctx.beginPath(); ctx.arc(bx, by - 105, 48, 0, Math.PI * 2); ctx.stroke()
  ctx.fillStyle = 'rgba(20,10,0,0.9)'
  ctx.beginPath(); ctx.ellipse(bx, by + 5, 52, 12, 0, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath()
  ctx.moveTo(bx - 50, by + 5); ctx.lineTo(bx + 50, by + 5)
  ctx.lineTo(bx + 38, by - 10); ctx.lineTo(bx - 38, by - 10)
  ctx.closePath(); ctx.fill()
  ctx.strokeStyle = 'rgba(255,180,40,0.25)'; ctx.lineWidth = 0.8
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    ctx.beginPath(); ctx.ellipse(bx + Math.cos(a) * 30, by + 3 + Math.sin(a) * 6, 8, 4, a, 0, Math.PI * 2); ctx.stroke()
  }
  ctx.fillStyle = 'rgba(15,7,0,0.92)'
  ctx.beginPath(); ctx.moveTo(bx - 42, by)
  ctx.bezierCurveTo(bx - 45, by - 50, bx - 22, by - 95, bx - 12, by - 115)
  ctx.quadraticCurveTo(bx, by - 122, bx + 12, by - 115)
  ctx.bezierCurveTo(bx + 22, by - 95, bx + 45, by - 50, bx + 42, by)
  ctx.closePath(); ctx.fill()
  ctx.beginPath(); ctx.ellipse(bx, by,        50, 18, 0, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.ellipse(bx, by - 25,   30, 10, 0, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.ellipse(bx, by - 118,  10,  8, 0, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.ellipse(bx, by - 133,  20, 23, 0, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.ellipse(bx, by - 158,   9, 12, 0, 0, Math.PI * 2); ctx.fill()
  ctx.strokeStyle = 'rgba(255,180,40,0.2)'; ctx.lineWidth = 0.8
  ctx.beginPath(); ctx.ellipse(bx, by - 133, 20, 23, 0, 0, Math.PI * 2); ctx.stroke()
  const t = frame * 0.012
  for (let i = 0; i < 2; i++) {
    ctx.strokeStyle = `rgba(255,220,150,${0.06 + i * 0.02})`; ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.moveTo(bx - 15 + i * 30, by + 10)
    for (let j = 1; j <= 18; j++)
      ctx.lineTo(bx - 15 + i * 30 + Math.sin(t + j * 0.45 + i * 2) * 6, by + 10 - j * 10)
    ctx.stroke()
  }
  ctx.restore()
}

function drawTree() {
  ctx.save()
  const tx = 105, ty = H - 55
  ctx.fillStyle = '#0e0600'
  ctx.beginPath(); ctx.moveTo(tx - 22, ty)
  ctx.bezierCurveTo(tx - 18, ty - 90,  tx - 12, ty - 200, tx - 4, ty - 300)
  ctx.bezierCurveTo(tx + 4,  ty - 302, tx + 18, ty - 200, tx + 22, ty - 90)
  ctx.lineTo(tx + 22, ty); ctx.closePath(); ctx.fill()
  ctx.strokeStyle = 'rgba(60,30,0,0.5)'; ctx.lineWidth = 1
  for (let i = 0; i < 4; i++) {
    ctx.beginPath()
    ctx.moveTo(tx - 12 + i * 7, ty)
    ctx.quadraticCurveTo(tx - 10 + i * 6, ty - 150, tx - 6 + i * 4, ty - 295)
    ctx.stroke()
  }
  ;[[tx, ty-290, -0.4, 110],[tx, ty-265, 0.5, 95],[tx, ty-240, -0.9, 80],
    [tx, ty-215, 1.0, 85],  [tx, ty-310, -0.1, 130]].forEach(([bx, by, ang, len]) => {
    ctx.lineWidth = 7; ctx.strokeStyle = '#0e0600'
    ctx.beginPath(); ctx.moveTo(bx, by)
    ctx.quadraticCurveTo(
      bx + Math.cos(ang) * len * 0.5, by + Math.sin(ang - Math.PI / 2) * len * 0.4,
      bx + Math.cos(ang) * len,       by + Math.sin(ang - Math.PI / 2) * len)
    ctx.stroke()
  })
  ;[[tx-45, ty-185],[tx+50, ty-170],[tx-75, ty-200],
    [tx+85, ty-185],[tx-100, ty-165],[tx+110, ty-175],[tx-25, ty-155]].forEach(([rx, ry]) => {
    ctx.strokeStyle = 'rgba(12,6,0,0.8)'; ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(rx, ry)
    ctx.bezierCurveTo(
      rx + rnd(-15, 15), ry + (ty - ry) * 0.35,
      rx + rnd(-12, 12), ry + (ty - ry) * 0.65,
      rx + rnd(-8, 8),   ty)
    ctx.stroke()
  })
  ;[{x:tx,    y:ty-320, rx:108, ry:65}, {x:tx-85,  y:ty-295, rx:75, ry:50},
    {x:tx+85,  y:ty-285, rx:80,  ry:52}, {x:tx-130, y:ty-265, rx:60, ry:42},
    {x:tx+115, y:ty-260, rx:65,  ry:45}, {x:tx-45,  y:ty-350, rx:70, ry:48},
    {x:tx+40,  y:ty-340, rx:75,  ry:52}, {x:tx-15,  y:ty-285, rx:85, ry:55},
    {x:tx+155, y:ty-240, rx:50,  ry:38}].forEach((c, i) => {
    ctx.fillStyle = i%3===0 ? 'rgba(12,38,4,0.97)' : i%3===1 ? 'rgba(18,52,6,0.94)' : 'rgba(22,60,8,0.92)'
    ctx.beginPath(); ctx.ellipse(c.x, c.y, c.rx, c.ry, i * 0.35 - 0.6, 0, Math.PI * 2); ctx.fill()
  })
  ctx.restore()
}

function drawLeaf(l) {
  ctx.save(); ctx.translate(l.x, l.y); ctx.rotate(l.rot); ctx.globalAlpha = l.alpha
  ctx.fillStyle = 'rgba(0,0,0,0.2)'
  ctx.beginPath(); ctx.ellipse(2, 2, l.w / 2, l.h / 2, 0, 0, Math.PI * 2); ctx.fill()
  const lg = ctx.createLinearGradient(-l.w / 2, 0, l.w / 2, 0)
  lg.addColorStop(0, l.col); lg.addColorStop(0.5, l.col2); lg.addColorStop(1, l.col)
  ctx.fillStyle = lg
  ctx.beginPath()
  ctx.moveTo(-l.w/2, 0)
  ctx.quadraticCurveTo(-l.w/4, -l.h/2, 0, -l.h/2)
  ctx.quadraticCurveTo( l.w/4, -l.h/2, l.w/2, 0)
  ctx.quadraticCurveTo( l.w/3,  l.h/2, 0, l.h/1.8)
  ctx.quadraticCurveTo(-l.w/3,  l.h/2, -l.w/2, 0)
  ctx.closePath(); ctx.fill()
  ctx.strokeStyle = 'rgba(0,0,0,0.28)'; ctx.lineWidth = 0.8
  ctx.beginPath(); ctx.moveTo(-l.w/2 + 1, 0); ctx.lineTo(0, l.h/1.8 - 2); ctx.stroke()
  ctx.strokeStyle = 'rgba(0,0,0,0.14)'; ctx.lineWidth = 0.5
  for (let i = -2; i <= 2; i++) {
    if (i === 0) continue
    ctx.beginPath(); ctx.moveTo(0, 0)
    ctx.lineTo(i * (l.w / 6), i > 0 ? -l.h/2 + 2 : l.h/2); ctx.stroke()
  }
  ctx.restore()
}

function drawBowl() {
  const { x, y, w, h } = bowl
  ctx.save()
  ctx.fillStyle = 'rgba(0,0,0,0.35)'
  ctx.beginPath(); ctx.ellipse(x, y + h/2 + 6, w/2 + 6, 7, 0, 0, Math.PI * 2); ctx.fill()
  const bg = ctx.createLinearGradient(x - w/2, 0, x + w/2, 0)
  bg.addColorStop(0, '#6b3d1a'); bg.addColorStop(0.3, '#b8713a')
  bg.addColorStop(0.65, '#cc845a'); bg.addColorStop(1, '#6b3d1a')
  ctx.fillStyle = bg
  ctx.beginPath(); ctx.moveTo(x - w/2, y - 1)
  ctx.bezierCurveTo(x - w/2, y + h, x - w/4 + 2, y + h + 2, x, y + h + 2)
  ctx.bezierCurveTo(x + w/4 - 2, y + h + 2, x + w/2, y + h, x + w/2, y - 1)
  ctx.closePath(); ctx.fill()
  const rg = ctx.createLinearGradient(x - w/2, 0, x + w/2, 0)
  rg.addColorStop(0, '#7a4820'); rg.addColorStop(0.5, '#d4956a'); rg.addColorStop(1, '#7a4820')
  ctx.fillStyle = rg
  ctx.beginPath(); ctx.ellipse(x, y, w/2, h/4, 0, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = 'rgba(25,10,0,0.7)'
  ctx.beginPath(); ctx.ellipse(x, y, w/2 - 4, h/4 - 2, 0, 0, Math.PI * 2); ctx.fill()
  ctx.strokeStyle = 'rgba(255,200,80,0.45)'; ctx.lineWidth = 0.8
  ctx.beginPath(); ctx.arc(x, y + h * 0.45, 5, 0, Math.PI * 2); ctx.stroke()
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    ctx.fillStyle = 'rgba(255,200,80,0.4)'
    ctx.beginPath(); ctx.arc(x + Math.cos(a) * 10, y + h * 0.45 + Math.sin(a) * 5, 1.2, 0, Math.PI * 2); ctx.fill()
  }
  ctx.strokeStyle = 'rgba(255,220,160,0.5)'; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.ellipse(x, y, w/2, h/4, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke()
  ctx.restore()
}

function drawSparks() {
  sparks = sparks.filter(s => s.a > 0)
  sparks.forEach(s => {
    ctx.save(); ctx.globalAlpha = s.a; ctx.fillStyle = s.c
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill(); ctx.restore()
    s.x += s.vx; s.y += s.vy; s.vy += 0.06; s.a -= 0.035; s.r *= 0.96
  })
}

function addSparks(x, y) {
  for (let i = 0; i < 14; i++) {
    const a = Math.random() * Math.PI * 2, spd = 1 + Math.random() * 2.5
    sparks.push({ x, y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd - 1.5, a: 1, r: 2 + Math.random() * 3, c: `hsl(${rnd(95,130)},60%,${rnd(35,50)}%)` })
  }
  for (let i = 0; i < 6; i++) {
    const a = Math.random() * Math.PI * 2
    sparks.push({ x, y, vx: Math.cos(a) * 1.5, vy: Math.sin(a) * 1.5 - 2, a: 1, r: 1.5 + Math.random() * 2, c: 'rgba(255,215,50,0.9)' })
  }
}

function drawFloats() {
  floats = floats.filter(f => f.a > 0)
  floats.forEach(f => {
    ctx.save(); ctx.globalAlpha = f.a; ctx.fillStyle = '#FFD700'
    ctx.font = `bold ${f.size}px serif`; ctx.textAlign = 'center'
    ctx.fillText(f.txt, f.x, f.y); ctx.restore()
    f.y -= 0.8; f.a -= 0.02
  })
}

function drawFireflies() {
  const t = frame * 0.012
  ctx.save()
  for (let i = 0; i < 6; i++) {
    const fx    = (Math.sin(t * 0.6 + i * 1.4) * 0.38 + 0.5) * W
    const fy    = (Math.cos(t * 0.45 + i * 1.0) * 0.28 + 0.38) * H
    const pulse = Math.sin(t * 2.5 + i * 1.2) * 0.5 + 0.5
    ctx.globalAlpha = pulse * 0.5; ctx.fillStyle = 'rgba(255,230,100,1)'
    ctx.beginPath(); ctx.arc(fx, fy, 1.8, 0, Math.PI * 2); ctx.fill()
    ctx.globalAlpha = pulse * 0.12
    ctx.beginPath(); ctx.arc(fx, fy, 5, 0, Math.PI * 2); ctx.fill()
  }
  ctx.restore()
}

function checkCatch(l) {
  return Math.abs(l.x - bowl.x) < bowl.w / 2 - 4 &&
    l.y > bowl.y - bowl.h / 4 && l.y < bowl.y + bowl.h / 4
}

// ── Game loop ────────────────────────────────────────────────
function updateTimer(now) {
  if (!startTime) startTime = now
  timeLeft.value = Math.max(0, 180 - (now - startTime) / 1000)
  if (timeLeft.value <= 0) endGame()
}

function update(now) {
  if (screen.value !== 'playing') return
  updateTimer(now)
  const spawnRate = Math.max(20, 75 - Math.floor((180 - timeLeft.value) / 5) * 3)
  if (frame % spawnRate === 0 || leaves.length < 3) spawnLeaf()
  leaves.forEach(l => {
    if (l.dying) { l.alpha -= 0.08; return }
    l.wave += l.waveSpd
    l.x    += l.vx + Math.sin(l.wave) * 0.6
    l.y    += l.vy
    l.rot  += l.rotV
    if (!l.caught && l.y > H - 100 && checkCatch(l)) {
      l.caught = true; l.dying = true
      score.value++
      playTing(); addSparks(l.x, l.y)
      floats.push({ txt: '+1 ✦', x: l.x, y: l.y - 20, a: 1, size: 16 })
    }
    if (l.y > H + 40) l.alpha = 0
  })
  leaves = leaves.filter(l => l.alpha > 0)
}

function render() {
  ctx.clearRect(0, 0, W, H)
  drawSky(); drawFireflies(); drawBuddha(); drawTree(); drawGround()
  leaves.forEach(drawLeaf); drawSparks(); drawBowl(); drawFloats()
  if (screen.value === 'playing') {
    const sm = getSpeedMult()
    if (sm > 1.5) {
      ctx.save(); ctx.globalAlpha = 0.25; ctx.fillStyle = '#ff6600'
      ctx.font = '11px serif'; ctx.textAlign = 'right'
      ctx.fillText(`×${sm.toFixed(1)} tốc độ`, W - 8, 16); ctx.restore()
    }
  }
}

function loop(now) {
  frame++; update(now); render()
  rafId = requestAnimationFrame(loop)
}

// ── Game flow ────────────────────────────────────────────────
function startGame() {
  ensureAudio()
  screen.value = 'playing'
}

function endGame() {
  if (screen.value === 'end') return
  screen.value = 'end'
  playEndBell()
}

function restartGame() {
  ensureAudio()
  score.value = 0; frame = 0; timeLeft.value = 180; startTime = null
  leaves = []; sparks = []; floats = []
  bowl   = { x: W / 2, y: H - 55, w: 76, h: 28 }
  screen.value = 'playing'
}

// ── Lifecycle ────────────────────────────────────────────────
function onMouseMove(e) {
  const r = canvasRef.value.getBoundingClientRect()
  bowl.x = Math.max(bowl.w / 2, Math.min(W - bowl.w / 2, (e.clientX - r.left) * (W / r.width)))
}
function onTouchMove(e) {
  e.preventDefault()
  const r = canvasRef.value.getBoundingClientRect()
  bowl.x = Math.max(bowl.w / 2, Math.min(W - bowl.w / 2, (e.touches[0].clientX - r.left) * (W / r.width)))
}
function onTouchStart(e) {
  e.preventDefault()
  const r = canvasRef.value.getBoundingClientRect()
  bowl.x = Math.max(bowl.w / 2, Math.min(W - bowl.w / 2, (e.touches[0].clientX - r.left) * (W / r.width)))
}

onMounted(() => {
  const canvas    = canvasRef.value
  canvas.width    = W
  canvas.height   = H
  ctx             = canvas.getContext('2d')
  canvas.addEventListener('mousemove',  onMouseMove)
  canvas.addEventListener('touchmove',  onTouchMove,  { passive: false })
  canvas.addEventListener('touchstart', onTouchStart, { passive: false })
  rafId = requestAnimationFrame(loop)
})

onUnmounted(() => {
  if (rafId) cancelAnimationFrame(rafId)
  const canvas = canvasRef.value
  if (canvas) {
    canvas.removeEventListener('mousemove',  onMouseMove)
    canvas.removeEventListener('touchmove',  onTouchMove)
    canvas.removeEventListener('touchstart', onTouchStart)
  }
  bgNodes.forEach(n => { try { n.stop() } catch (_) {} })
  if (audioCtx) audioCtx.close()
})
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #0d0700;
  user-select: none;
  position: relative;
  width: 480px;
  max-width: 100vw;
}

canvas {
  display: block;
  cursor: none;
  touch-action: none;
  width: 100%;
  max-width: 480px;
}

.mute-btn {
  position: absolute;
  top: 6px;
  right: 10px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 17px;
  color: #c8a05a;
  padding: 2px 6px;
  z-index: 20;
}

.ui {
  width: 100%;
  max-width: 480px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 16px;
  background: #0d0700;
  box-sizing: border-box;
}

.lbl {
  color: #c8a05a;
  font-family: serif;
  font-size: 12px;
  letter-spacing: 1px;
}

.pts {
  color: #ffd700;
  font-family: serif;
  font-size: 22px;
  font-weight: bold;
}

.overlay {
  display: flex;
  position: absolute;
  left: 0; top: 0;
  width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.82);
  align-items: center;
  justify-content: center;
  flex-direction: column;
  z-index: 10;
}

.overlay-title {
  color: #ffd700;
  font-family: serif;
  font-size: 28px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 12px;
}

.overlay-sub {
  color: #c8a05a;
  font-family: serif;
  font-size: 13px;
  margin-bottom: 4px;
  text-align: center;
}

.overlay-label {
  color: #c8a05a;
  font-family: serif;
  font-size: 15px;
  margin-bottom: 6px;
}

.overlay-score {
  color: #ffd700;
  font-family: serif;
  font-size: 52px;
  font-weight: bold;
  margin-bottom: 20px;
}

.g-btn {
  background: rgba(180, 100, 20, 0.3);
  border: 1px solid #c8a05a;
  color: #ffd700;
  font-family: serif;
  font-size: 16px;
  padding: 10px 32px;
  cursor: pointer;
  border-radius: 6px;
  margin-top: 10px;
  transition: background 0.2s;
}

.g-btn:hover {
  background: rgba(200, 130, 40, 0.45);
}
</style>
