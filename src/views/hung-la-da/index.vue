<template>
  <div class="page">
  <div class="wrap">
    <canvas ref="canvasRef" />
    <iframe
      ref="scIframe"
      src="https://w.soundcloud.com/player/?url=https%3A%2F%2Fapi.soundcloud.com%2Ftracks%2F624179754&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&visual=false"
      style="display:none"
      allow="autoplay"
    />

    <button class="mute-btn" @click="toggleMute" :title="muted ? 'Bật nhạc' : 'Tắt nhạc'">
      {{ muted ? '🔇' : '🔊' }}
    </button>

    <button
      v-if="screen === 'playing'"
      class="pause-btn"
      @click="togglePause"
      :title="paused ? 'Tiếp tục' : 'Tạm dừng'"
    >
      {{ paused ? '▶' : '⏸' }}
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
      <p class="overlay-sub">tích lũy công đức trong hơn 1 phút</p>
      <button class="g-btn" @click="startGame">🙏 Bắt đầu</button>
      <RouterLink class="home-link" to="/"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:6px;margin-bottom:2px"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>Trang chủ</RouterLink>
    </div>

    <!-- Màn hình tạm dừng -->
    <div v-if="paused && screen === 'playing'" class="overlay">
      <div class="overlay-title">⏸ Tạm dừng</div>
      <p class="overlay-sub" style="margin-bottom:6px">Công đức hiện tại</p>
      <div class="overlay-score" style="margin-bottom:20px">{{ score }}</div>
      <button class="g-btn" @click="togglePause">▶ Tiếp tục</button>
      <button class="g-btn g-btn-ghost" @click="restartGame" style="margin-top:8px">↩ Chơi lại</button>
      <RouterLink class="home-link" to="/"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:6px;margin-bottom:2px"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>Trang chủ</RouterLink>
    </div>

    <!-- Màn hình kết thúc -->
    <div v-if="screen === 'end'" class="overlay">
      <div class="overlay-title">🙏 Hết giờ!</div>
      <p class="overlay-label">Công đức tích được</p>
      <div class="overlay-score">{{ score }}</div>
      <div class="best-score-row">
        <span class="best-icon">🏆</span>
        <span class="best-label">Cao nhất:</span>
        <span class="best-val">{{ bestScore ?? 0 }}</span>
      </div>
      <button class="g-btn" @click="restartGame">↩ Chơi lại</button>
      <RouterLink class="home-link" to="/"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:6px;margin-bottom:2px"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>Trang chủ</RouterLink>
    </div>
  </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface Leaf {
  x: number; y: number; vx: number; vy: number
  rot: number; rotV: number; w: number; h: number
  wave: number; waveSpd: number
  col: string; col2: string
  caught: boolean; alpha: number; dying: boolean
}
interface Spark { x: number; y: number; vx: number; vy: number; a: number; r: number; c: string }
interface FloatText { txt: string; x: number; y: number; a: number; size: number }
interface Bowl { x: number; y: number; w: number; h: number }

const canvasRef = ref<HTMLCanvasElement | null>(null)
const scIframe  = ref<HTMLIFrameElement | null>(null)
const W = 480, H = 580

const score     = ref(0)
const timeLeft  = ref(90)
const screen    = ref<'start' | 'playing' | 'end'>('start')
const muted     = ref(false)
const paused    = ref(false)
const bestScore = ref<number | null>(null)

const timerDisplay = computed(() => {
  const m = Math.floor(timeLeft.value / 60)
  const s = Math.floor(timeLeft.value % 60)
  return `${m}:${String(s).padStart(2, '0')}`
})

let ctx:       CanvasRenderingContext2D | null = null
let frame      = 0
let startTime: number | null = null
let pausedAt   = 0
let rafId:     number | null = null
let leaves:    Leaf[]      = []
let sparks:    Spark[]     = []
let floats:    FloatText[] = []
let bowl:      Bowl        = { x: W / 2, y: H - 55, w: 76, h: 28 }

let audioCtx:   AudioContext | null = null
let masterGain: GainNode | null     = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let scWidget:   any = null

function ensureAudio(): void {
  if (audioCtx) return
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const AC = window.AudioContext ?? (window as any).webkitAudioContext as typeof AudioContext
  audioCtx   = new AC()
  masterGain = audioCtx.createGain()
  masterGain.gain.value = 1
  masterGain.connect(audioCtx.destination)
  initScWidget()
}

function initScWidget(): void {
  const iframe = scIframe.value
  if (!iframe) return
  const SC = (window as unknown as Record<string, unknown>)['SC'] as Record<string, unknown> | undefined
  if (!SC) return
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SCWidget = (SC as any).Widget
  scWidget = SCWidget(iframe)
  scWidget.bind(SCWidget.Events.READY, () => {
    scWidget.setVolume(20)
    if (!muted.value) scWidget.play()
  })
}

function scPlay(): void {
  if (scWidget && !muted.value && scIframe.value?.contentWindow) {
    try { scWidget.play() } catch { /* iframe not ready */ }
  }
}
function scPause(): void {
  if (scWidget && scIframe.value?.contentWindow) {
    try { scWidget.pause() } catch { /* iframe not ready */ }
  }
}

function playBellNote(freq: number, vol: number, dur: number): void {
  if (!audioCtx || !masterGain || muted.value) return
  const ac = audioCtx, mg = masterGain
  ;([[freq, vol, dur], [freq * 2.756, vol * 0.3, dur * 0.6]] as [number, number, number][])
    .forEach(([f, v, d]) => {
      const o = ac.createOscillator(), g = ac.createGain()
      o.type = 'sine'; o.frequency.value = f
      g.gain.setValueAtTime(0, ac.currentTime)
      g.gain.linearRampToValueAtTime(v, ac.currentTime + 0.01)
      g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + d)
      o.connect(g); g.connect(mg); o.start(); o.stop(ac.currentTime + d + 0.05)
    })
}

function playTing(): void {
  if (!audioCtx || !masterGain || muted.value) return
  const ac = audioCtx, mg = masterGain
  ;([[880, 0.22, 1.4], [880 * 2.65, 0.10, 0.9], [880 * 5.1, 0.05, 0.5]] as [number, number, number][])
    .forEach(([f, v, d]) => {
      const o = ac.createOscillator(), g = ac.createGain()
      o.type = 'sine'; o.frequency.value = f
      g.gain.setValueAtTime(0, ac.currentTime)
      g.gain.linearRampToValueAtTime(v, ac.currentTime + 0.005)
      g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + d)
      o.connect(g); g.connect(mg); o.start(); o.stop(ac.currentTime + d + 0.05)
    })
  const buf = ac.createBuffer(1, ac.sampleRate * 0.02, ac.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++)
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 3)
  const src = ac.createBufferSource(), g = ac.createGain()
  g.gain.value = 0.04
  src.buffer = buf; src.connect(g); g.connect(mg); src.start()
}

function playEndBell(): void {
  if (!audioCtx) return
  ;[261.63, 329.63, 392, 523.25].forEach((f, i) =>
    setTimeout(() => playBellNote(f, 0.18, 3.5), i * 300),
  )
}

function toggleMute(): void {
  muted.value = !muted.value
  if (muted.value) { scPause() } else { scPlay() }
}

function togglePause(): void {
  if (screen.value !== 'playing') return
  paused.value = !paused.value
  if (paused.value) {
    scPause()
  } else {
    if (startTime !== null) startTime += performance.now() - pausedAt
    if (!muted.value) scPlay()
  }
}

function rnd(a: number, b: number): number { return a + Math.random() * (b - a) }


const CANOPY = [
  { x: 100, y: 70 }, { x: 60, y: 90 }, { x: 140, y: 55 }, { x: 185, y: 80 },
  { x: 30, y: 110 }, { x: 220, y: 100 }, { x: 80, y: 130 }, { x: 160, y: 110 },
]

function getSpeedMult(): number { return 1.6 + Math.min((90 - timeLeft.value) / 30, 2.0) }

function spawnLeaf(): void {
  const src = CANOPY[Math.floor(Math.random() * CANOPY.length)]!
  const hue = rnd(95, 130), lit = rnd(22, 38), sat = rnd(45, 65), sm = getSpeedMult()
  leaves.push({
    x: src.x + rnd(-20, 20), y: src.y + rnd(-10, 20),
    vx: rnd(-0.8, 0.8), vy: rnd(0.9, 1.6) * sm,
    rot: rnd(0, Math.PI * 2), rotV: rnd(-0.03, 0.03),
    w: rnd(22, 30), h: rnd(14, 20),
    wave: rnd(0, Math.PI * 2), waveSpd: rnd(0.015, 0.03),
    col: `hsl(${hue},${sat}%,${lit}%)`,
    col2: `hsl(${hue + 10},${sat - 10}%,${lit + 8}%)`,
    caught: false, alpha: 1, dying: false,
  })
}

function drawSky(): void {
  const c = ctx!
  const g = c.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0, '#100800'); g.addColorStop(0.3, '#2a1200')
  g.addColorStop(0.65, '#4a2200'); g.addColorStop(1, '#1a0e00')
  c.fillStyle = g; c.fillRect(0, 0, W, H)
  const mg = c.createRadialGradient(W * 0.75, 50, 0, W * 0.75, 50, 120)
  mg.addColorStop(0, 'rgba(255,220,100,0.18)'); mg.addColorStop(0.4, 'rgba(255,180,60,0.06)'); mg.addColorStop(1, 'rgba(0,0,0,0)')
  c.fillStyle = mg; c.fillRect(0, 0, W, H)
  c.fillStyle = 'rgba(255,240,180,0.7)'; c.beginPath(); c.arc(W * 0.75, 42, 18, 0, Math.PI * 2); c.fill()
  c.fillStyle = 'rgba(255,250,220,0.5)'; c.beginPath(); c.arc(W * 0.75, 42, 12, 0, Math.PI * 2); c.fill()
}

function drawGround(): void {
  const c = ctx!
  c.fillStyle = '#0a0500'; c.fillRect(0, H - 55, W, 55)
  c.fillStyle = '#160b00'; c.beginPath(); c.ellipse(W / 2, H - 30, 200, 25, 0, 0, Math.PI * 2); c.fill()
  c.strokeStyle = 'rgba(80,40,0,0.4)'; c.lineWidth = 0.5
  for (let i = -3; i <= 3; i++) { c.beginPath(); c.ellipse(W / 2 + i * 60, H - 30, 25, 10, 0, 0, Math.PI * 2); c.stroke() }
}

function drawBuddha(): void {
  const c = ctx!, bx = W * 0.63, by = H * 0.58
  c.save()
  const ag = c.createRadialGradient(bx, by - 105, 5, bx, by - 105, 90)
  ag.addColorStop(0, 'rgba(255,190,50,0.3)'); ag.addColorStop(0.5, 'rgba(255,140,20,0.08)'); ag.addColorStop(1, 'rgba(0,0,0,0)')
  c.fillStyle = ag; c.fillRect(0, 0, W, H)
  c.strokeStyle = 'rgba(255,180,40,0.45)'; c.lineWidth = 1.5; c.beginPath(); c.arc(bx, by - 105, 42, 0, Math.PI * 2); c.stroke()
  c.strokeStyle = 'rgba(255,180,40,0.12)'; c.lineWidth = 10; c.beginPath(); c.arc(bx, by - 105, 48, 0, Math.PI * 2); c.stroke()
  c.fillStyle = 'rgba(20,10,0,0.9)'
  c.beginPath(); c.ellipse(bx, by + 5, 52, 12, 0, 0, Math.PI * 2); c.fill()
  c.beginPath(); c.moveTo(bx - 50, by + 5); c.lineTo(bx + 50, by + 5); c.lineTo(bx + 38, by - 10); c.lineTo(bx - 38, by - 10); c.closePath(); c.fill()
  c.strokeStyle = 'rgba(255,180,40,0.25)'; c.lineWidth = 0.8
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; c.beginPath(); c.ellipse(bx + Math.cos(a) * 30, by + 3 + Math.sin(a) * 6, 8, 4, a, 0, Math.PI * 2); c.stroke() }
  c.fillStyle = 'rgba(15,7,0,0.92)'
  c.beginPath(); c.moveTo(bx - 42, by)
  c.bezierCurveTo(bx - 45, by - 50, bx - 22, by - 95, bx - 12, by - 115)
  c.quadraticCurveTo(bx, by - 122, bx + 12, by - 115)
  c.bezierCurveTo(bx + 22, by - 95, bx + 45, by - 50, bx + 42, by); c.closePath(); c.fill()
  c.beginPath(); c.ellipse(bx, by, 50, 18, 0, 0, Math.PI * 2); c.fill()
  c.beginPath(); c.ellipse(bx, by - 25, 30, 10, 0, 0, Math.PI * 2); c.fill()
  c.beginPath(); c.ellipse(bx, by - 118, 10, 8, 0, 0, Math.PI * 2); c.fill()
  c.beginPath(); c.ellipse(bx, by - 133, 20, 23, 0, 0, Math.PI * 2); c.fill()
  c.beginPath(); c.ellipse(bx, by - 158, 9, 12, 0, 0, Math.PI * 2); c.fill()
  c.strokeStyle = 'rgba(255,180,40,0.2)'; c.lineWidth = 0.8; c.beginPath(); c.ellipse(bx, by - 133, 20, 23, 0, 0, Math.PI * 2); c.stroke()
  const t = frame * 0.012
  for (let i = 0; i < 2; i++) {
    c.strokeStyle = `rgba(255,220,150,${0.06 + i * 0.02})`; c.lineWidth = 1.5
    c.beginPath(); c.moveTo(bx - 15 + i * 30, by + 10)
    for (let j = 1; j <= 18; j++) c.lineTo(bx - 15 + i * 30 + Math.sin(t + j * 0.45 + i * 2) * 6, by + 10 - j * 10)
    c.stroke()
  }
  c.restore()
}

function drawTree(): void {
  const c = ctx!; c.save()
  const tx = 105, ty = H - 55
  c.fillStyle = '#0e0600'
  c.beginPath(); c.moveTo(tx - 22, ty)
  c.bezierCurveTo(tx - 18, ty - 90, tx - 12, ty - 200, tx - 4, ty - 300)
  c.bezierCurveTo(tx + 4, ty - 302, tx + 18, ty - 200, tx + 22, ty - 90)
  c.lineTo(tx + 22, ty); c.closePath(); c.fill()
  c.strokeStyle = 'rgba(60,30,0,0.5)'; c.lineWidth = 1
  for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(tx - 12 + i * 7, ty); c.quadraticCurveTo(tx - 10 + i * 6, ty - 150, tx - 6 + i * 4, ty - 295); c.stroke() }
  ;([[tx, ty-290,-0.4,110],[tx,ty-265,0.5,95],[tx,ty-240,-0.9,80],[tx,ty-215,1.0,85],[tx,ty-310,-0.1,130]] as [number,number,number,number][])
    .forEach(([bx, by, ang, len]) => {
      c.lineWidth = 7; c.strokeStyle = '#0e0600'; c.beginPath(); c.moveTo(bx, by)
      c.quadraticCurveTo(bx + Math.cos(ang) * len * 0.5, by + Math.sin(ang - Math.PI / 2) * len * 0.4, bx + Math.cos(ang) * len, by + Math.sin(ang - Math.PI / 2) * len); c.stroke()
    })
  ;([[tx-45,ty-185],[tx+50,ty-170],[tx-75,ty-200],[tx+85,ty-185],[tx-100,ty-165],[tx+110,ty-175],[tx-25,ty-155]] as [number,number][])
    .forEach(([rx, ry]) => {
      c.strokeStyle = 'rgba(12,6,0,0.8)'; c.lineWidth = 2; c.beginPath(); c.moveTo(rx, ry)
      c.bezierCurveTo(rx + rnd(-15,15), ry + (ty-ry)*0.35, rx + rnd(-12,12), ry + (ty-ry)*0.65, rx + rnd(-8,8), ty); c.stroke()
    })
  ;([{x:tx,y:ty-320,rx:108,ry:65},{x:tx-85,y:ty-295,rx:75,ry:50},{x:tx+85,y:ty-285,rx:80,ry:52},
    {x:tx-130,y:ty-265,rx:60,ry:42},{x:tx+115,y:ty-260,rx:65,ry:45},{x:tx-45,y:ty-350,rx:70,ry:48},
    {x:tx+40,y:ty-340,rx:75,ry:52},{x:tx-15,y:ty-285,rx:85,ry:55},{x:tx+155,y:ty-240,rx:50,ry:38}])
    .forEach((cl, i) => {
      c.fillStyle = i%3===0?'rgba(12,38,4,0.97)':i%3===1?'rgba(18,52,6,0.94)':'rgba(22,60,8,0.92)'
      c.beginPath(); c.ellipse(cl.x, cl.y, cl.rx, cl.ry, i*0.35-0.6, 0, Math.PI*2); c.fill()
    })
  c.restore()
}

function drawLeaf(l: Leaf): void {
  const c = ctx!
  c.save(); c.translate(l.x, l.y); c.rotate(l.rot); c.globalAlpha = l.alpha
  c.fillStyle = 'rgba(0,0,0,0.2)'; c.beginPath(); c.ellipse(2, 2, l.w/2, l.h/2, 0, 0, Math.PI*2); c.fill()
  const lg = c.createLinearGradient(-l.w/2, 0, l.w/2, 0)
  lg.addColorStop(0, l.col); lg.addColorStop(0.5, l.col2); lg.addColorStop(1, l.col)
  c.fillStyle = lg
  c.beginPath(); c.moveTo(-l.w/2,0); c.quadraticCurveTo(-l.w/4,-l.h/2,0,-l.h/2); c.quadraticCurveTo(l.w/4,-l.h/2,l.w/2,0)
  c.quadraticCurveTo(l.w/3,l.h/2,0,l.h/1.8); c.quadraticCurveTo(-l.w/3,l.h/2,-l.w/2,0); c.closePath(); c.fill()
  c.strokeStyle = 'rgba(0,0,0,0.28)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(-l.w/2+1,0); c.lineTo(0,l.h/1.8-2); c.stroke()
  c.strokeStyle = 'rgba(0,0,0,0.14)'; c.lineWidth = 0.5
  for (let i = -2; i <= 2; i++) { if (i===0) continue; c.beginPath(); c.moveTo(0,0); c.lineTo(i*(l.w/6), i>0?-l.h/2+2:l.h/2); c.stroke() }
  c.restore()
}

function drawBowl(): void {
  const c = ctx!, { x, y, w, h } = bowl
  c.save()
  c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(x, y+h/2+6, w/2+6, 7, 0, 0, Math.PI*2); c.fill()
  const bg = c.createLinearGradient(x-w/2, 0, x+w/2, 0)
  bg.addColorStop(0,'#6b3d1a'); bg.addColorStop(0.3,'#b8713a'); bg.addColorStop(0.65,'#cc845a'); bg.addColorStop(1,'#6b3d1a')
  c.fillStyle = bg; c.beginPath(); c.moveTo(x-w/2,y-1); c.bezierCurveTo(x-w/2,y+h,x-w/4+2,y+h+2,x,y+h+2); c.bezierCurveTo(x+w/4-2,y+h+2,x+w/2,y+h,x+w/2,y-1); c.closePath(); c.fill()
  const rg = c.createLinearGradient(x-w/2, 0, x+w/2, 0)
  rg.addColorStop(0,'#7a4820'); rg.addColorStop(0.5,'#d4956a'); rg.addColorStop(1,'#7a4820')
  c.fillStyle = rg; c.beginPath(); c.ellipse(x, y, w/2, h/4, 0, 0, Math.PI*2); c.fill()
  c.fillStyle = 'rgba(25,10,0,0.7)'; c.beginPath(); c.ellipse(x, y, w/2-4, h/4-2, 0, 0, Math.PI*2); c.fill()
  c.strokeStyle = 'rgba(255,200,80,0.45)'; c.lineWidth = 0.8; c.beginPath(); c.arc(x, y+h*0.45, 5, 0, Math.PI*2); c.stroke()
  for (let i = 0; i < 8; i++) { const a = (i/8)*Math.PI*2; c.fillStyle='rgba(255,200,80,0.4)'; c.beginPath(); c.arc(x+Math.cos(a)*10, y+h*0.45+Math.sin(a)*5, 1.2, 0, Math.PI*2); c.fill() }
  c.strokeStyle = 'rgba(255,220,160,0.5)'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(x, y, w/2, h/4, 0, Math.PI*1.05, Math.PI*1.95); c.stroke()
  c.restore()
}

function drawSparks(): void {
  const c = ctx!
  sparks = sparks.filter(s => s.a > 0)
  sparks.forEach(s => { c.save(); c.globalAlpha=s.a; c.fillStyle=s.c; c.beginPath(); c.arc(s.x,s.y,s.r,0,Math.PI*2); c.fill(); c.restore(); s.x+=s.vx; s.y+=s.vy; s.vy+=0.06; s.a-=0.035; s.r*=0.96 })
}

function addSparks(x: number, y: number): void {
  for (let i = 0; i < 14; i++) { const a=Math.random()*Math.PI*2, spd=1+Math.random()*2.5; sparks.push({x,y,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd-1.5,a:1,r:2+Math.random()*3,c:`hsl(${rnd(95,130)},60%,${rnd(35,50)}%)`}) }
  for (let i = 0; i < 6; i++) { const a=Math.random()*Math.PI*2; sparks.push({x,y,vx:Math.cos(a)*1.5,vy:Math.sin(a)*1.5-2,a:1,r:1.5+Math.random()*2,c:'rgba(255,215,50,0.9)'}) }
}

function drawFloats(): void {
  const c = ctx!
  floats = floats.filter(f => f.a > 0)
  floats.forEach(f => { c.save(); c.globalAlpha=f.a; c.fillStyle=f.txt.startsWith('-')?'#ff6b6b':'#FFD700'; c.font=`bold ${f.size}px serif`; c.textAlign='center'; c.fillText(f.txt,f.x,f.y); c.restore(); f.y-=0.8; f.a-=0.02 })
}

function drawFireflies(): void {
  const c = ctx!, t = frame * 0.012
  c.save()
  for (let i = 0; i < 6; i++) {
    const fx=(Math.sin(t*0.6+i*1.4)*0.38+0.5)*W, fy=(Math.cos(t*0.45+i*1.0)*0.28+0.38)*H, pulse=Math.sin(t*2.5+i*1.2)*0.5+0.5
    c.globalAlpha=pulse*0.5; c.fillStyle='rgba(255,230,100,1)'; c.beginPath(); c.arc(fx,fy,1.8,0,Math.PI*2); c.fill()
    c.globalAlpha=pulse*0.12; c.beginPath(); c.arc(fx,fy,5,0,Math.PI*2); c.fill()
  }
  c.restore()
}

function checkCatch(l: Leaf): boolean {
  return Math.abs(l.x - bowl.x) < bowl.w/2-4 && l.y > bowl.y-bowl.h/4 && l.y < bowl.y+bowl.h/4
}

function updateTimer(now: number): void {
  if (!startTime) startTime = now
  timeLeft.value = Math.max(0, 90 - (now - startTime) / 1000)
  if (timeLeft.value <= 0) endGame()
}

function update(now: number): void {
  if (screen.value !== 'playing' || paused.value) return
  updateTimer(now)
  const spawnRate = Math.max(15, 60 - Math.floor((90 - timeLeft.value) / 3) * 3)
  if (frame % spawnRate === 0 || leaves.length < 3) spawnLeaf()
  leaves.forEach(l => {
    if (l.dying) { l.alpha -= 0.08; return }
    l.wave += l.waveSpd; l.x += l.vx + Math.sin(l.wave) * 0.6; l.y += l.vy; l.rot += l.rotV
    if (!l.caught && l.y > H-100 && checkCatch(l)) {
      l.caught = true; l.dying = true; score.value++
      playTing(); addSparks(l.x, l.y); floats.push({txt:'+1 ✦',x:l.x,y:l.y-20,a:1,size:16})
    }
    if (!l.caught && !l.dying && l.y > H+40) {
      l.dying = true; score.value--; floats.push({txt:'-1',x:l.x,y:H-60,a:1,size:14})
    }
    if (l.dying && l.y > H+40) l.alpha = 0
  })
  leaves = leaves.filter(l => l.alpha > 0)
}

function render(): void {
  if (!ctx) return
  const c = ctx
  c.clearRect(0, 0, W, H)
  drawSky(); drawFireflies(); drawBuddha(); drawTree(); drawGround()
  leaves.forEach(drawLeaf); drawSparks(); drawBowl(); drawFloats()
  if (screen.value === 'playing') {
    const sm = getSpeedMult()
    if (sm > 1.5) { c.save(); c.globalAlpha=0.25; c.fillStyle='#ff6600'; c.font='11px serif'; c.textAlign='right'; c.fillText(`×${sm.toFixed(1)} tốc độ`,W-8,16); c.restore() }
  }
}

function loop(now: number): void {
  if (paused.value) { pausedAt = now; render(); rafId = requestAnimationFrame(loop); return }
  frame++; update(now); render()
  rafId = requestAnimationFrame(loop)
}

function startGame(): void {
  ensureAudio(); screen.value = 'playing'
  setTimeout(() => { if (!muted.value) scPlay() }, 300)
}

function endGame(): void {
  if (screen.value === 'end') return
  if (bestScore.value === null || score.value > bestScore.value) bestScore.value = score.value
  scPause(); screen.value = 'end'; playEndBell()
}

function restartGame(): void {
  ensureAudio(); paused.value = false
  score.value = 0; frame = 0; timeLeft.value = 90; startTime = null
  leaves = []; sparks = []; floats = []; bowl = {x:W/2,y:H-55,w:76,h:28}
  screen.value = 'playing'
  setTimeout(() => { if (!muted.value) scPlay() }, 100)
}

function onKeyDown(e: KeyboardEvent): void {
  if (e.code === 'Space' || e.code === 'Escape') { e.preventDefault(); togglePause() }
}

function onMouseMove(e: MouseEvent): void {
  const canvas = canvasRef.value; if (!canvas) return
  const r = canvas.getBoundingClientRect()
  bowl.x = Math.max(bowl.w/2, Math.min(W-bowl.w/2, (e.clientX-r.left)*(W/r.width)))
}

function onTouchMove(e: TouchEvent): void {
  if (screen.value !== 'playing' || paused.value) return
  e.preventDefault()
  const canvas = canvasRef.value; if (!canvas) return
  const r = canvas.getBoundingClientRect()
  bowl.x = Math.max(bowl.w/2, Math.min(W-bowl.w/2, (e.touches[0]!.clientX-r.left)*(W/r.width)))
}

function onTouchStart(e: TouchEvent): void {
  if (screen.value !== 'playing' || paused.value) return
  e.preventDefault()
  const canvas = canvasRef.value; if (!canvas) return
  const r = canvas.getBoundingClientRect()
  bowl.x = Math.max(bowl.w/2, Math.min(W-bowl.w/2, (e.touches[0]!.clientX-r.left)*(W/r.width)))
}

onMounted(() => {
  const canvas = canvasRef.value; if (!canvas) return
  canvas.width = W; canvas.height = H
  ctx = canvas.getContext('2d')
  canvas.addEventListener('mousemove', onMouseMove)
  canvas.addEventListener('touchmove', onTouchMove, { passive: false })
  canvas.addEventListener('touchstart', onTouchStart, { passive: false })
  window.addEventListener('keydown', onKeyDown)
  const existingSC = (window as unknown as Record<string, unknown>)['SC']
  if (!existingSC) {
    const s = document.createElement('script')
    s.src = 'https://w.soundcloud.com/player/api.js'
    s.addEventListener('load', () => { if (audioCtx) initScWidget() })
    document.head.appendChild(s)
  }
  rafId = requestAnimationFrame(loop)
})

onUnmounted(() => {
  if (rafId) cancelAnimationFrame(rafId)
  const canvas = canvasRef.value
  if (canvas) {
    canvas.removeEventListener('mousemove', onMouseMove)
    canvas.removeEventListener('touchmove', onTouchMove)
    canvas.removeEventListener('touchstart', onTouchStart)
  }
  window.removeEventListener('keydown', onKeyDown)
  scPause()
  if (audioCtx) audioCtx.close()
})
</script>

<style scoped>
* { margin: 0; padding: 0; box-sizing: border-box; }

.page {
  position: fixed; inset: 0; background: #0d0700;
  display: flex; align-items: center; justify-content: center; overflow: hidden;
}

.wrap {
  display: flex; flex-direction: column; align-items: center;
  background: #0d0700; user-select: none; position: relative;
  width: min(480px, 100vw, calc((100dvh - 46px) * 480 / 580));
}

canvas { display: block; cursor: none; touch-action: none; width: 100%; aspect-ratio: 480 / 580; height: auto; }

.mute-btn, .pause-btn {
  position: absolute; top: 0; background: none; border: none; cursor: pointer;
  color: #c8a05a; z-index: 20; width: 44px; height: 44px;
  display: flex; align-items: center; justify-content: center; font-size: 18px;
  -webkit-tap-highlight-color: transparent;
}
.mute-btn  { right: 0; }
.pause-btn { left: 0; }

.ui {
  width: 100%; display: flex; justify-content: space-between; align-items: center;
  padding: 4px 16px; background: #0d0700; min-height: 46px;
}
.lbl { color: #c8a05a; font-family: serif; font-size: 11px; letter-spacing: 1px; }
.pts { color: #ffd700; font-family: serif; font-size: 20px; font-weight: bold; line-height: 1.2; }

.overlay {
  display: flex; position: absolute; left: 0; top: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.82); align-items: center; justify-content: center;
  flex-direction: column; z-index: 10; padding: 16px;
  touch-action: auto;
}

.overlay-title { color: #ffd700; font-family: serif; font-size: clamp(20px,5vw,28px); font-weight: bold; text-align: center; margin-bottom: 10px; }
.overlay-sub   { color: #c8a05a; font-family: serif; font-size: clamp(12px,3vw,13px); margin-bottom: 4px; text-align: center; }
.overlay-label { color: #c8a05a; font-family: serif; font-size: clamp(13px,3.5vw,15px); margin-bottom: 6px; }
.overlay-score { color: #ffd700; font-family: serif; font-size: clamp(36px,10vw,52px); font-weight: bold; margin-bottom: 16px; line-height: 1; }

.g-btn {
  background: rgba(180,100,20,0.3); border: 1px solid #c8a05a; color: #ffd700;
  font-family: serif; font-size: clamp(14px,3.5vw,16px); padding: 10px 32px;
  cursor: pointer; border-radius: 6px; margin-top: 10px; transition: background 0.2s;
  min-width: 140px; min-height: 44px; -webkit-tap-highlight-color: transparent;
}
.g-btn:hover  { background: rgba(200,130,40,0.45); }
.g-btn:active { background: rgba(220,150,50,0.55); }

.g-btn-ghost {
  background: rgba(80,40,10,0.2); border-color: rgba(200,160,90,0.4);
  color: rgba(255,215,0,0.7); font-size: clamp(12px,3vw,14px); padding: 8px 28px;
}
.g-btn-ghost:hover { background: rgba(120,60,15,0.35); }

.home-link {
  display: inline-flex; align-items: center; margin-top: 14px; color: #c8a05a;
  font-family: serif; font-size: clamp(12px,3vw,13px); letter-spacing: 0.5px;
  text-decoration: none; border: 1px solid rgba(200,160,90,0.45); border-radius: 6px;
  padding: 8px 20px; min-height: 44px;
  transition: color 0.2s, border-color 0.2s, background 0.2s;
  -webkit-tap-highlight-color: transparent;
}
.home-link:hover  { color: #ffd700; border-color: rgba(255,215,0,0.6); background: rgba(180,100,20,0.2); }
.home-link:active { background: rgba(200,120,30,0.3); }

@media (max-height: 500px) and (orientation: landscape) {
  .overlay-title { font-size: 18px; margin-bottom: 6px; }
  .overlay-score { font-size: 32px; margin-bottom: 10px; }
  .overlay-sub   { display: none; }
  .g-btn         { padding: 7px 24px; margin-top: 6px; min-height: 40px; }
  .home-link     { padding: 6px 16px; margin-top: 8px; min-height: 40px; }
}

.best-score-row { display: flex; align-items: center; gap: 6px; margin-bottom: 16px; color: #c8a05a; font-family: serif; font-size: clamp(13px,3.5vw,15px); }
.best-icon  { font-size: 16px; }
.best-label { opacity: 0.8; }
.best-val   { color: #ffd700; font-weight: bold; font-size: clamp(15px,4vw,18px); }
</style>