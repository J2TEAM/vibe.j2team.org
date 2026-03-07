<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ref, onMounted, onUnmounted } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)
const isLoading = ref(true)
const isRunning = ref(false)
const status = ref('Initializing...')
const romLoaded = ref(false)

let gb: any = null
let animationId: number
let initModule: any = null
let Boytacean: any = null

// PadKey Mapping from Boytacean v0.11.5
// Up: 0, Down: 1, Left: 2, Right: 3, Start: 4, Select: 5, A: 6, B: 7
const PAD_KEYS = {
  UP: 0,
  DOWN: 1,
  LEFT: 2,
  RIGHT: 3,
  START: 4,
  SELECT: 5,
  A: 6,
  B: 7
}

const KEY_MAP: Record<string, number> = {
  'z': PAD_KEYS.A, 'Z': PAD_KEYS.A,
  'x': PAD_KEYS.B, 'X': PAD_KEYS.B,
  'Shift': PAD_KEYS.SELECT,
  'Enter': PAD_KEYS.START,
  'ArrowRight': PAD_KEYS.RIGHT,
  'ArrowLeft': PAD_KEYS.LEFT,
  'ArrowUp': PAD_KEYS.UP,
  'ArrowDown': PAD_KEYS.DOWN
}

onMounted(async () => {
  try {
    // 1. Load Boytacean from CDN
    // @ts-expect-error - CDN import
    Boytacean = await import('https://unpkg.com/boytacean@0.11.5/boytacean.js')
    initModule = Boytacean.default
    const { GameBoy, GameBoyMode } = Boytacean

    // 2. Initialize WASM
    await initModule('https://unpkg.com/boytacean@0.11.5/boytacean_bg.wasm')
    
    // Initialize with default mode (CGB)
    gb = new GameBoy(GameBoyMode.Cgb)
    isLoading.value = false
    status.value = 'Sẵn sàng. Tải lên ROM .gb hoặc .gbc để chơi!'
  } catch (err) {
    console.error('Failed to initialize Boytacean:', err)
    status.value = 'Tải trình giả lập thất bại. Vui lòng kiểm tra kết nối.'
  }

  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
})

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId)
  if (gb) gb.free()
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
})

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    const buffer = await target.files[0].arrayBuffer()
    loadRom(new Uint8Array(buffer))
  }
}

const loadDemo = async () => {
  status.value = 'Đang lấy ROM demo...'
  try {
    const response = await fetch('https://cdn.jsdelivr.net/gh/m1el/2048-gb@master/2048.gb')
    if (!response.ok) throw new Error('Network response was not ok')
    const buffer = await response.arrayBuffer()
    loadRom(new Uint8Array(buffer))
    status.value = 'Đang chơi Demo: 2048 (Mã nguồn mở)'
  } catch (err) {
    console.error('Demo load error:', err)
    status.value = 'Tải ROM demo thất bại. Hãy thử tải lên ROM của riêng bạn!'
  }
}

const startLoop = () => {
  if (animationId) cancelAnimationFrame(animationId)
  
  const loop = () => {
    if (!gb || !canvasRef.value || !isRunning.value) return
    
    try {
      // Execute frame
      gb.next_frame()
      
      const ctx = canvasRef.value.getContext('2d', { alpha: false })
      if (ctx) {
        // frame_buffer_raw_eager returns a Uint8Array with RGBA data
        const frameBuffer = gb.frame_buffer_raw_eager()
        const imageData = new ImageData(new Uint8ClampedArray(frameBuffer), 160, 144)
        ctx.putImageData(imageData, 0, 0)
      }
      
      animationId = requestAnimationFrame(loop)
    } catch (err) {
      console.error('Emulator execution error:', err)
      isRunning.value = false
      status.value = 'Trình giả lập bị lỗi. ROM này có thể không được hỗ trợ.'
    }
  }
  
  loop()
}

const loadRom = (romData: Uint8Array) => {
  if (!gb) return
  
  try {
    // 1. Stop current loop
    isRunning.value = false
    if (animationId) cancelAnimationFrame(animationId)

    // 2. Infer and set mode
    gb.infer_mode_wa(romData)
    
    // 3. Load the ROM
    gb.load_rom_wa(romData)
    
    // 4. Boot the system
    gb.boot()
    
    romLoaded.value = true
    isRunning.value = true
    startLoop()
  } catch (err) {
    console.error('Failed to load ROM:', err)
    status.value = 'Lỗi khi tải ROM. Kiểm tra console để biết chi tiết.'
  }
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (gb && KEY_MAP[e.key] !== undefined) {
    gb.key_press(KEY_MAP[e.key])
    e.preventDefault()
  }
}

const handleKeyUp = (e: KeyboardEvent) => {
  if (gb && KEY_MAP[e.key] !== undefined) {
    gb.key_lift(KEY_MAP[e.key])
    e.preventDefault()
  }
}

const sendKey = (keyIndex: number, isDown: boolean) => {
  if (!gb) return
  if (isDown) gb.key_press(keyIndex)
  else gb.key_lift(keyIndex)
}
</script>

<template>
  <div class="h-full flex flex-col gap-6 animate-fade-in">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1 items-start">
      
      <!-- Screen & File Upload -->
      <div class="flex flex-col gap-4 items-center">
        <div class="relative bg-[#8b956d] p-4 border-8 border-[#333] rounded-lg shadow-2xl">
          <canvas 
            ref="canvasRef" 
            width="160" 
            height="144" 
            class="w-full max-w-[320px] aspect-[160/144] image-pixelated bg-[#9bbc0f]"
          ></canvas>
          <div v-if="!romLoaded" class="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm gap-4">
             <label class="wasm-btn cursor-pointer px-10 py-3 text-center min-w-[160px]">
               TẢI LÊN ROM
               <input type="file" accept=".gb,.gbc" class="hidden" @change="handleFileUpload" />
             </label>
             <button @click="loadDemo" class="wasm-btn bg-white/10 text-white border-white/20 px-10 py-3 min-w-[160px]">
               CHƠI THỬ DEMO
             </button>
          </div>
        </div>
        <p class="text-[10px] text-text-secondary italic text-center max-w-[320px]">
          {{ status }}
        </p>
      </div>

      <!-- Controls -->
      <div class="flex flex-col gap-8 bg-black/20 p-6 rounded-xl border border-white/5">
        <div class="flex flex-col gap-2">
          <span class="text-[10px] font-mono uppercase text-accent-coral">Phím điều khiển</span>
          <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-text-secondary font-mono">
            <span>D-Pad: Phím mũi tên</span>
            <span>Phím A: Phím Z</span>
            <span>Phím B: Phím X</span>
            <span>Start: Phím Enter</span>
            <span>Select: Phím Shift</span>
          </div>
        </div>

        <!-- Virtual Controller for Mobile -->
        <div class="flex justify-between items-end gap-4 mt-4 select-none">
          <!-- D-Pad -->
          <div class="grid grid-cols-3 gap-1">
            <div />
            <button @mousedown="sendKey(PAD_KEYS.UP, true)" @mouseup="sendKey(PAD_KEYS.UP, false)" @touchstart="sendKey(PAD_KEYS.UP, true)" @touchend="sendKey(PAD_KEYS.UP, false)" class="ctrl-btn">↑</button>
            <div />
            <button @mousedown="sendKey(PAD_KEYS.LEFT, true)" @mouseup="sendKey(PAD_KEYS.LEFT, false)" @touchstart="sendKey(PAD_KEYS.LEFT, true)" @touchend="sendKey(PAD_KEYS.LEFT, false)" class="ctrl-btn">←</button>
            <div class="w-8 h-8 bg-white/5" />
            <button @mousedown="sendKey(PAD_KEYS.RIGHT, true)" @mouseup="sendKey(PAD_KEYS.RIGHT, false)" @touchstart="sendKey(PAD_KEYS.RIGHT, true)" @touchend="sendKey(PAD_KEYS.RIGHT, false)" class="ctrl-btn">→</button>
            <div />
            <button @mousedown="sendKey(PAD_KEYS.DOWN, true)" @mouseup="sendKey(PAD_KEYS.DOWN, false)" @touchstart="sendKey(PAD_KEYS.DOWN, true)" @touchend="sendKey(PAD_KEYS.DOWN, false)" class="ctrl-btn">↓</button>
            <div />
          </div>

          <!-- Buttons A/B -->
          <div class="flex gap-4 mb-4">
            <button @mousedown="sendKey(PAD_KEYS.B, true)" @mouseup="sendKey(PAD_KEYS.B, false)" @touchstart="sendKey(PAD_KEYS.B, true)" @touchend="sendKey(PAD_KEYS.B, false)" class="action-btn bg-white/10">B</button>
            <button @mousedown="sendKey(PAD_KEYS.A, true)" @mouseup="sendKey(PAD_KEYS.A, false)" @touchstart="sendKey(PAD_KEYS.A, true)" @touchend="sendKey(PAD_KEYS.A, false)" class="action-btn bg-accent-coral/20 text-accent-coral">A</button>
          </div>
        </div>

        <div class="flex justify-center gap-8">
           <button @mousedown="sendKey(PAD_KEYS.SELECT, true)" @mouseup="sendKey(PAD_KEYS.SELECT, false)" @touchstart="sendKey(PAD_KEYS.SELECT, true)" @touchend="sendKey(PAD_KEYS.SELECT, false)" class="text-[10px] uppercase font-bold tracking-widest text-text-secondary border-b border-text-secondary/20">Select</button>
           <button @mousedown="sendKey(PAD_KEYS.START, true)" @mouseup="sendKey(PAD_KEYS.START, false)" @touchstart="sendKey(PAD_KEYS.START, true)" @touchend="sendKey(PAD_KEYS.START, false)" class="text-[10px] uppercase font-bold tracking-widest text-text-secondary border-b border-text-secondary/20">Start</button>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
@reference "@/assets/main.css";
@import "../styles.css";

.image-pixelated {
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.ctrl-btn {
  @apply w-10 h-10 bg-white/10 flex items-center justify-center rounded active:bg-accent-coral/40 transition-colors border border-white/5;
}

.action-btn {
  @apply w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg active:scale-90 transition-transform border border-white/10;
}
</style>
