<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useWindowSize, useRafFn, useMouse, useMagicKeys } from '@vueuse/core'
import { useDriftEngine } from './composables/useDriftEngine'

const { width, height } = useWindowSize()
const { x: mouseX, y: mouseY } = useMouse()
const { w, a, s, d, arrowup, arrowleft, arrowdown, arrowright } = useMagicKeys()
const canvasRef = ref<HTMLCanvasElement | null>(null)
const { fragments, theme, speed, driftOffset, currentSector, init, loadData, update } = useDriftEngine()

const showUI = ref(true)
const shipPos = ref({ x: 0, y: 0 }) 
const isAutoPilot = ref(true)

let ctx: CanvasRenderingContext2D | null = null

function initCanvas() {
  if (!canvasRef.value) return
  ctx = canvasRef.value.getContext('2d', { alpha: false })
}

const sensitivity = 0.02

const { pause, resume } = useRafFn(() => {
  if (!ctx || !canvasRef.value) return

  // 1. Update Ship
  if (w?.value || arrowup?.value) shipPos.value.y = Math.max(-1, shipPos.value.y - sensitivity)
  if (s?.value || arrowdown?.value) shipPos.value.y = Math.min(1, shipPos.value.y + sensitivity)
  if (a?.value || arrowleft?.value) shipPos.value.x = Math.max(-1, shipPos.value.x - sensitivity)
  if (d?.value || arrowright?.value) shipPos.value.x = Math.min(1, shipPos.value.x + sensitivity)

  if (isAutoPilot.value) {
    const targetX = (mouseX.value / width.value - 0.5) * 2
    const targetY = (mouseY.value / height.value - 0.5) * 2
    shipPos.value.x += (targetX - shipPos.value.x) * 0.08
    shipPos.value.y += (targetY - shipPos.value.y) * 0.08
  }

  driftOffset.value.x = -shipPos.value.x * 20
  driftOffset.value.y = -shipPos.value.y * 20

  // 2. Clear & Render
  ctx.fillStyle = theme.value.bg
  ctx.fillRect(0, 0, width.value, height.value)

  update()

  const centerX = width.value / 2
  const centerY = height.value / 2
  const zoom = 800

  // 3. Render Fragments
  fragments.value.forEach(f => {
    if (!ctx) return
    const scale = zoom / f.z
    const px = centerX + (f.x + driftOffset.value.x * (2000 - f.z) * 0.05) * scale
    const py = centerY + (f.y + driftOffset.value.y * (2000 - f.z) * 0.05) * scale
    
    if (px < -100 || px > width.value + 100 || py < -100 || py > height.value + 100) return

    const alpha = f.opacity
    const size = f.size * scale
    
    // Minimal Warp (only stretch slightly at high speeds)
    const stretch = speed.value > 45 ? (speed.value - 45) * 0.3 : 0
    
    ctx.globalAlpha = alpha
    ctx.fillStyle = f.color
    
    if (stretch > 2) {
      ctx.fillRect(px, py, 1.5, size * (1 + stretch))
    } else {
      ctx.textAlign = f.text.length > 5 ? 'left' : 'center'
      ctx.font = `${f.text.length > 10 ? 'italic' : ''} ${Math.max(1, size)}px "Anybody"`
      ctx.fillText(f.text, px, py)
    }
  })
  ctx.globalAlpha = 1

  // 4. Minimal HUD
  renderHUD(centerX, centerY)

  // 5. Spaceship
  renderShip(centerX, centerY)
})

function renderHUD(centerX: number, centerY: number) {
  if (!ctx) return
  const isMobile = width.value < 640
  
  // Crosshair
  ctx.save()
  ctx.strokeStyle = theme.value.primary + '22'
  ctx.lineWidth = 1
  ctx.setLineDash([2, 10])
  ctx.beginPath()
  const chSize = isMobile ? 80 : 120
  ctx.moveTo(centerX - chSize, centerY)
  ctx.lineTo(centerX + chSize, centerY)
  ctx.moveTo(centerX, centerY - chSize)
  ctx.lineTo(centerX, centerY + chSize)
  ctx.stroke()
  
  // Dynamic Corner Accents
  const size = isMobile ? 100 : 150
  const cornerLen = isMobile ? 10 : 20
  ctx.setLineDash([])
  ctx.strokeStyle = theme.value.secondary + '44'
  // Top Left
  ctx.beginPath()
  ctx.moveTo(centerX - size, centerY - size + cornerLen); ctx.lineTo(centerX - size, centerY - size); ctx.lineTo(centerX - size + cornerLen, centerY - size)
  ctx.stroke()
  // Bottom Right
  ctx.beginPath()
  ctx.moveTo(centerX + size, centerY + size - cornerLen); ctx.lineTo(centerX + size, centerY + size); ctx.lineTo(centerX + size - cornerLen, centerY + size)
  ctx.stroke()
  
  ctx.restore()

  // Sector Info (Modern floating style)
  ctx.font = `800 ${isMobile ? '8px' : '10px'} "Anybody"`
  ctx.letterSpacing = isMobile ? '1px' : '2px'
  ctx.fillStyle = theme.value.primary
  ctx.textAlign = 'left'
  ctx.shadowBlur = 10
  ctx.shadowColor = theme.value.primary
  ctx.fillText(`// SECTOR: ${currentSector.value.toUpperCase()}`, isMobile ? 20 : 40, height.value - (isMobile ? 20 : 40))
  ctx.shadowBlur = 0
}

function renderShip(centerX: number, centerY: number) {
  if (!ctx) return
  const shipX = centerX + shipPos.value.x * (width.value * 0.4)
  const shipY = centerY + shipPos.value.y * (height.value * 0.4)
  const heat = speed.value / 60
  
  ctx.save()
  ctx.translate(shipX, shipY)
  ctx.rotate(shipPos.value.x * 0.3)
  
  // 1. Engine Flame (Layered)
  if (speed.value > 2) {
    ctx.shadowBlur = 20 * heat
    ctx.shadowColor = theme.value.accent
    
    // Outer flame
    ctx.beginPath()
    ctx.moveTo(-6, 8); ctx.lineTo(6, 8); ctx.lineTo(0, 8 + Math.random() * 30 * heat)
    ctx.fillStyle = theme.value.accent + '44'
    ctx.fill()
    
    // Inner core
    ctx.beginPath()
    ctx.moveTo(-3, 8); ctx.lineTo(3, 8); ctx.lineTo(0, 8 + Math.random() * 15 * heat)
    ctx.fillStyle = '#fff'
    ctx.fill()
    ctx.shadowBlur = 0
  }

  // 2. Ship Wings (Glassmorphic)
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(-20, 10); ctx.lineTo(-10, 0); ctx.lineTo(-15, 15); ctx.closePath()
  ctx.fillStyle = theme.value.secondary + '22'
  ctx.fill()
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(20, 10); ctx.lineTo(10, 0); ctx.lineTo(15, 15); ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // 3. Main Body (Stealth Diamond)
  ctx.beginPath()
  ctx.moveTo(0, -18) // Nose
  ctx.lineTo(-10, 8) // Left tail
  ctx.lineTo(0, 2)   // Back intake
  ctx.lineTo(10, 8)  // Right tail
  ctx.closePath()
  
  ctx.fillStyle = '#111'
  ctx.fill()
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 1.5
  ctx.stroke()

  // 4. Cockpit Highlight
  ctx.beginPath()
  ctx.ellipse(0, -6, 2, 4, 0, 0, Math.PI * 2)
  ctx.fillStyle = theme.value.primary
  ctx.fill()
  
  ctx.restore()
}

onMounted(async () => {
  await loadData()
  const isMobile = width.value < 768
  init(isMobile ? 250 : 400)
  initCanvas()
  resume()
})

onUnmounted(() => {
  pause()
})

watch([width, height], () => {
  initCanvas()
})

</script>

<template>
  <div class="fixed inset-0 bg-black overflow-hidden font-body select-none">
    <canvas
      ref="canvasRef"
      :width="width"
      :height="height"
      class="block touch-none"
    />

    <!-- Navigation -->
    <nav class="absolute top-4 left-4 sm:top-6 sm:left-6 z-50 animate-fade-up">
      <RouterLink
        to="/"
        class="group flex items-center gap-2 sm:gap-3 px-3 py-1.5 sm:px-4 sm:py-2 bg-black/40 backdrop-blur-md border border-white/10 text-white/40 hover:text-white transition-all duration-300"
      >
        <Icon icon="lucide:arrow-left" class="size-3.5 sm:size-4" />
        <span class="text-[10px] sm:text-xs font-display tracking-[0.2em] uppercase">Vibe Home</span>
      </RouterLink>
    </nav>

    <!-- Zen HUD -->
    <Transition name="fade">
      <div v-if="showUI" class="absolute inset-x-0 bottom-8 sm:bottom-12 px-4 sm:px-8 pointer-events-none flex flex-col items-center gap-4 sm:gap-8 z-40">
        
        <div class="text-center space-y-1">
          <h1 class="font-display text-lg sm:text-2xl font-bold tracking-[0.4em] text-white/20 uppercase">
             Cyber Drift
          </h1>
        </div>

        <div class="w-full max-w-[calc(100vw-2rem)] sm:max-w-lg bg-black/60 backdrop-blur-xl border border-white/5 p-4 sm:p-8 pointer-events-auto animate-fade-up">
          <div class="flex items-center justify-between mb-4 sm:mb-8">
            <div class="flex items-center gap-4 sm:gap-8">
              <button 
                class="group p-2 text-white/20 hover:text-white transition-colors"
                @click="isAutoPilot = !isAutoPilot"
              >
                <Icon :icon="isAutoPilot ? 'lucide:navigation' : 'lucide:mouse-pointer-2'" class="size-5 sm:size-6" />
              </button>
              
              <div class="space-y-0.5 sm:space-y-1">
                <div class="text-[8px] sm:text-[10px] uppercase tracking-widest text-white/20">Warp</div>
                <div class="text-xs sm:text-sm font-display text-white/60 tracking-widest">{{ speed.toFixed(0) }}</div>
              </div>
            </div>

            <div class="hidden sm:block text-[10px] uppercase tracking-widest text-white/20 text-right">
              Control: WASD / Arrows
            </div>
            <div class="sm:hidden text-[8px] uppercase tracking-widest text-white/20 text-right">
              Touch to Steering
            </div>
          </div>

          <input 
            v-model.number="speed" 
            type="range" 
            min="1" 
            max="60" 
            class="w-full h-px bg-white/10 appearance-none accent-white cursor-pointer"
          />
        </div>
      </div>
    </Transition>

    <button 
      class="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 z-50 p-2 text-white/10 hover:text-white/40 transition-all pointer-events-auto"
      @click="showUI = !showUI"
    >
      <Icon :icon="showUI ? 'lucide:eye-off' : 'lucide:eye'" class="size-4 sm:size-5" />
    </button>
  </div>
</template>

<style scoped>
.font-display { font-family: 'Anybody', sans-serif; }
.font-body { font-family: 'Be Vietnam Pro', sans-serif; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.8s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@keyframes fade-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-up { animation: fade-up 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 10px;
  height: 10px;
  background: white;
  border-radius: 50%;
  cursor: pointer;
}
</style>
