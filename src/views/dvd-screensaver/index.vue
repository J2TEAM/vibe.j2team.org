<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'

// DVD Logo as inline SVG data URI for reliability
const dvdLogoSrc =
  'data:image/svg+xml;base64,' +
  btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 270 108" width="230" height="108">
  <rect width="270" height="108" fill="none"/>
  <text x="135" y="65" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="60" fill="white">J2TEAM</text>
  <text x="135" y="95" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="white"> D E V </text>
</svg>`)

// --- State ---
let canvas: HTMLCanvasElement | null = null
let ctx: CanvasRenderingContext2D | null = null
let dvdLogo: HTMLImageElement | null = null

const dvdArray: EpicDvdLogo[] = []
const speedRatio = 1
const logoSize = 0.78

let lastRun: number | null = null
let gameRunning = false
let animationId: number | null = null

// --- EpicDvdLogo class ---
class EpicDvdLogo {
  x: number
  y: number
  dx: number
  dy: number
  size: number
  speed: number

  constructor(x: number, y: number, dx: number, dy: number, size: number, speed: number) {
    this.x = x
    this.y = y
    this.dx = dx
    this.dy = dy
    this.size = size
    this.speed = speed
  }

  run() {
    this.draw()
    this.update()
  }

  draw() {
    if (!ctx || !dvdLogo) return
    ctx.beginPath()
    ctx.drawImage(dvdLogo, this.x, this.y, dvdLogo.width * this.size, dvdLogo.height * this.size)
  }

  update() {
    if (!dvdLogo) return

    if (this.x + dvdLogo.width * this.size > window.innerWidth || this.x < 0) {
      this.dx = -this.dx
    }
    if (this.y + dvdLogo.height * this.size > window.innerHeight || this.y < 0) {
      this.dy = -this.dy
    }

    this.x += this.dx * this.speed
    this.y += this.dy * this.speed
  }
}

// --- Load DVD logo image ---
function loadDvdPng() {
  dvdLogo = new Image()
  dvdLogo.src = dvdLogoSrc
  dvdLogo.onload = function () {
    gameRunning = true
    animate()
  }
}

// --- Animation ---
function animate() {
  if (!ctx || !canvas) return

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  if (!lastRun) {
    lastRun = performance.now()
    animationId = requestAnimationFrame(animate)
    return
  }
  lastRun = performance.now()

  if (gameRunning) {
    animationId = requestAnimationFrame(animate)
  }

  for (const dvd of dvdArray) {
    dvd.run()
  }
}

// --- Generate DVD logo ---
function generateDvdLogo() {
  const x = Math.random() * (window.innerWidth - 300) + 50
  const y = Math.random() * (window.innerHeight - 200) + 50
  const dx = 2.5
  const dy = 1.5
  const size = logoSize
  const speed = speedRatio
  dvdArray.push(new EpicDvdLogo(x, y, dx, dy, size, speed))
}

// --- Resize handler ---
function resizeEventHandler() {
  if (!canvas) return
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
}

// --- Lifecycle ---
onMounted(() => {
  canvas = document.getElementById('mainCanvas') as HTMLCanvasElement
  ctx = canvas.getContext('2d')

  resizeEventHandler()
  window.addEventListener('resize', resizeEventHandler)

  generateDvdLogo()
  loadDvdPng()
})

onUnmounted(() => {
  gameRunning = false
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  window.removeEventListener('resize', resizeEventHandler)
})
</script>

<template>
  <div class="dvd-screensaver">
    <canvas id="mainCanvas"></canvas>

    <div id="labels">
      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-5 py-2.5 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary animate-fade-up animate-delay-3"
      >
        &larr; Về trang chủ
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.dvd-screensaver {
  background-color: var(--color-bg-deep);
  overflow: hidden;
  margin: 0;
  padding: 0;
  width: 100vw;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
}

#labels {
  z-index: 1;
  position: fixed;
  top: 20px;
  left: 20px;
  pointer-events: none;
}

#labels > * {
  pointer-events: auto;
}

#mainCanvas {
  display: block;
}
</style>
