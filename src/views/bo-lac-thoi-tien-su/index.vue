<script setup lang="ts">
// CheerpJ is a fully dynamic runtime API, cannot be statically typed
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'

const GAME_JAR = 'Bolacthoitiensu.jar'

// Compute the base URL path from this module's URL
// In Vite dev: /src/views/j2me-emulator/
// This lets CheerpJ fetch JARs from the Vite dev server
const moduleBaseUrl = new URL('.', import.meta.url).pathname

const loadingState = ref('init')
const loadingPercent = ref(0)
const loadingText = ref('Đang khởi tạo...')
const errorMessage = ref('')
const isFullscreen = ref(false)


const displayRef = ref(null)
const containerRef = ref(null)

const cleanupFns = []

function updateLoading(percent, state) {
  loadingPercent.value = percent
  loadingState.value = state
  const messages = {
    init: 'Đang khởi tạo...',
    cheerpj: 'Đang tải CheerpJ Runtime...',
    emulator: 'Đang tải trình giả lập...',
    game: 'Đang tải game...',
    starting: 'Đang khởi động game...',
    ready: 'Sẵn sàng!',
    error: 'Có lỗi xảy ra!',
  }
  loadingText.value = messages[state] || state
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }
    const s = document.createElement('script')
    s.src = src
    s.onload = () => resolve()
    s.onerror = () => reject(new Error(`Không thể tải: ${src}`))
    document.head.appendChild(s)
  })
}

function autoscale() {
  const display = displayRef.value
  const container = containerRef.value
  if (!display || !container) return

  const rect = container.getBoundingClientRect()
  const scale = Math.min(rect.width / display.width, rect.height / display.height)
  const intScale = Math.max(1, Math.floor(scale))
  display.style.zoom = intScale
}

async function initEmulator() {
  try {
    const display = displayRef.value
    if (!display) throw new Error('Canvas element not found')

    const screenCtx = display.getContext('2d', { alpha: false, desynchronized: true })
    if (!screenCtx) throw new Error('Cannot get 2d context')
    screenCtx.imageSmoothingEnabled = false

    // Step 1: Load CheerpJ
    updateLoading(5, 'cheerpj')
    await loadScript('https://cjrtnc.leaningtech.com/4.1/loader.js')

    // Step 2: Import emulator modules — use relative paths, Vite resolves them
    updateLoading(15, 'cheerpj')

    // Use dynamic imports relative to this module
    const [
      { LibMedia },
      { LibMidi, createUnlockingAudioContext },
      { codeMap, KeyRepeatManager, KeyMappingManager },
      { EventQueue },
      canvasFontMod,
      canvasGraphicsMod,
      gles2Mod,
      jsReferenceMod,
      mediaBridgeMod,
      midiBridgeMod,
    ] = await Promise.all([
      import(/* @vite-ignore */ new URL('./libmedia/libmedia.js', import.meta.url).href),
      import(/* @vite-ignore */ new URL('./libmidi/libmidi.js', import.meta.url).href),
      import(/* @vite-ignore */ new URL('./emulator/key.js', import.meta.url).href),
      import(/* @vite-ignore */ new URL('./emulator/eventqueue.js', import.meta.url).href),
      import(/* @vite-ignore */ new URL('./libjs/libcanvasfont.js', import.meta.url).href),
      import(/* @vite-ignore */ new URL('./libjs/libcanvasgraphics.js', import.meta.url).href),
      import(/* @vite-ignore */ new URL('./libjs/libgles2.js', import.meta.url).href),
      import(/* @vite-ignore */ new URL('./libjs/libjsreference.js', import.meta.url).href),
      import(/* @vite-ignore */ new URL('./libjs/libmediabridge.js', import.meta.url).href),
      import(/* @vite-ignore */ new URL('./libjs/libmidibridge.js', import.meta.url).href),
    ])

    const evtQueue = new EventQueue()
    const keyRepeatManager = new KeyRepeatManager()
    const keyMappingManager = new KeyMappingManager()

    window.evtQueue = evtQueue
    window.codeMapRef = codeMap
    window.keyMappingManager = keyMappingManager

    // Key event handling
    let mouseDown = false
    let noMouse = false

    function handleKeyEvent(e) {
      const isDown = e.type === 'keydown'
      const mappedKeyCode = keyMappingManager.getKeyCode(e.code)

      if (mappedKeyCode !== null) {
        keyRepeatManager.post(isDown, e.code, {
          symbol: e.key.length === 1 ? e.key.charCodeAt(0) : '\x00',
          ctrlKey: e.ctrlKey,
          shiftKey: e.shiftKey,
          mappedKeyCode: mappedKeyCode,
        })
        e.preventDefault()
      } else if (codeMap[e.code]) {
        keyRepeatManager.post(isDown, e.code, {
          symbol: e.key.length === 1 ? e.key.charCodeAt(0) : '\x00',
          ctrlKey: e.ctrlKey,
          shiftKey: e.shiftKey,
        })
        e.preventDefault()
      }
    }

    document.addEventListener('keydown', handleKeyEvent)
    document.addEventListener('keyup', handleKeyEvent)
    cleanupFns.push(() => {
      document.removeEventListener('keydown', handleKeyEvent)
      document.removeEventListener('keyup', handleKeyEvent)
    })

    keyRepeatManager.register((kind, key, args) => {
      if (kind === 'click') {
        if (key === 'Maximize') autoscale()
      } else {
        const keyCode = args.mappedKeyCode !== undefined ? args.mappedKeyCode : codeMap[key]
        if (keyCode) {
          evtQueue.queueEvent({
            kind: kind === 'up' ? 'keyup' : 'keydown',
            args: [keyCode, args.symbol, args.ctrlKey, args.shiftKey],
          })
        }
      }
    })

    // Mouse events
    display.addEventListener('mousedown', (e) => {
      display.focus()
      if (noMouse) return
      evtQueue.queueEvent({
        kind: 'pointerpressed',
        x: e.offsetX / (display.currentCSSZoom || 1) | 0,
        y: e.offsetY / (display.currentCSSZoom || 1) | 0,
      })
      mouseDown = true
      e.preventDefault()
    })
    display.addEventListener('mousemove', (e) => {
      if (noMouse || !mouseDown) return
      evtQueue.queueEvent({
        kind: 'pointerdragged',
        x: e.offsetX / (display.currentCSSZoom || 1) | 0,
        y: e.offsetY / (display.currentCSSZoom || 1) | 0,
      })
      e.preventDefault()
    })
    document.addEventListener('mouseup', (e) => {
      if (noMouse || !mouseDown) return
      mouseDown = false
      evtQueue.queueEvent({
        kind: 'pointerreleased',
        x: (e.pageX - display.offsetLeft) / (display.currentCSSZoom || 1) | 0,
        y: (e.pageY - display.offsetTop) / (display.currentCSSZoom || 1) | 0,
      })
      e.preventDefault()
    })

    // Touch events
    display.addEventListener('touchstart', (e) => {
      display.focus()
      noMouse = true
      evtQueue.queueEvent({
        kind: 'pointerpressed',
        x: (e.changedTouches[0].pageX - display.offsetLeft) / (display.currentCSSZoom || 1) | 0,
        y: (e.changedTouches[0].pageY - display.offsetTop) / (display.currentCSSZoom || 1) | 0,
      })
      e.preventDefault()
    }, { passive: false })
    display.addEventListener('touchmove', (e) => {
      noMouse = true
      evtQueue.queueEvent({
        kind: 'pointerdragged',
        x: (e.changedTouches[0].pageX - display.offsetLeft) / (display.currentCSSZoom || 1) | 0,
        y: (e.changedTouches[0].pageY - display.offsetTop) / (display.currentCSSZoom || 1) | 0,
      })
      e.preventDefault()
    }, { passive: false })
    display.addEventListener('touchend', (e) => {
      noMouse = true
      evtQueue.queueEvent({
        kind: 'pointerreleased',
        x: (e.changedTouches[0].pageX - display.offsetLeft) / (display.currentCSSZoom || 1) | 0,
        y: (e.changedTouches[0].pageY - display.offsetTop) / (display.currentCSSZoom || 1) | 0,
      })
      e.preventDefault()
    })

    // Focus management
    document.addEventListener('mousedown', () => setTimeout(() => display.focus(), 20))
    display.addEventListener('blur', () => setTimeout(() => display.focus(), 10))

    const onResize = () => autoscale()
    window.addEventListener('resize', onResize)
    cleanupFns.push(() => window.removeEventListener('resize', onResize))

    // Init media
    updateLoading(20, 'cheerpj')
    window.libmidi = new LibMidi(createUnlockingAudioContext())
    await window.libmidi.init()
    if (window.libmidi.midiPlayer) {
      window.libmidi.midiPlayer.addEventListener('end-of-media', (e) => {
        evtQueue.queueEvent({ kind: 'player-eom', player: e.target })
      })
    }
    window.libmedia = new LibMedia()

    // Init CheerpJ — use moduleBaseUrl so CheerpJ finds JARs via Vite dev server
    updateLoading(30, 'cheerpj')
    // moduleBaseUrl has trailing slash from new URL('.', ...).pathname
    const cheerpjWebRoot = '/app' + moduleBaseUrl
    let scaleSet = false

    await window.cheerpjInit({
      enableDebug: false,
      status: 'splash',
      natives: {
        ...canvasFontMod.default,
        ...canvasGraphicsMod.default,
        ...gles2Mod.default,
        ...jsReferenceMod.default,
        ...mediaBridgeMod.default,
        ...midiBridgeMod.default,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        async Java_pl_zb3_freej2me_bridge_shell_Shell_setTitle(_lib, _title) {
          // don't override page title
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        async Java_pl_zb3_freej2me_bridge_shell_Shell_setIcon(_lib, _iconBytes) {
          // skip favicon override
        },
        async Java_pl_zb3_freej2me_bridge_shell_Shell_getScreenCtx() {
          return screenCtx
        },
        async Java_pl_zb3_freej2me_bridge_shell_Shell_setCanvasSize(_lib, width, height) {
          if (!scaleSet) {
            loadingState.value = 'ready'
            loadingPercent.value = 100
            display.style.display = ''
            scaleSet = true
            display.focus()
          }
          screenCtx.canvas.width = width
          screenCtx.canvas.height = height
          autoscale()
        },
        async Java_pl_zb3_freej2me_bridge_shell_Shell_waitForAndDispatchEvents(lib, listener) {
          const KeyEvent = await lib.pl.zb3.freej2me.bridge.shell.KeyEvent
          const PointerEvent = await lib.pl.zb3.freej2me.bridge.shell.PointerEvent

          const evt = await evtQueue.waitForEvent()
          if (evt.kind === 'keydown') {
            await listener.keyPressed(await new KeyEvent(...evt.args))
          } else if (evt.kind === 'keyup') {
            await listener.keyReleased(await new KeyEvent(...evt.args))
          } else if (evt.kind === 'pointerpressed') {
            await listener.pointerPressed(await new PointerEvent(evt.x, evt.y))
          } else if (evt.kind === 'pointerdragged') {
            await listener.pointerDragged(await new PointerEvent(evt.x, evt.y))
          } else if (evt.kind === 'pointerreleased') {
            await listener.pointerReleased(await new PointerEvent(evt.x, evt.y))
          } else if (evt.kind === 'player-eom') {
            await listener.playerEOM(evt.player)
          } else if (evt.kind === 'player-video-frame') {
            await listener.playerVideoFrame(evt.player)
          }
        },
        async Java_pl_zb3_freej2me_bridge_shell_Shell_restart() { location.reload() },
        async Java_pl_zb3_freej2me_bridge_shell_Shell_exit() { location.href = '/' },
        async Java_pl_zb3_freej2me_bridge_shell_Shell_sthop() {},
        async Java_pl_zb3_freej2me_bridge_shell_Shell_say(_lib, sth) { console.log('[say]', sth) },
        async Java_pl_zb3_freej2me_bridge_shell_Shell_sayObject(_lib, label, obj) { console.log('[sayobject]', label, obj) },
      },
    })

    // Load emulator JAR — path resolved via Vite dev server
    updateLoading(50, 'emulator')
    const lib = await window.cheerpjRunLibrary(cheerpjWebRoot + '/freej2me-web.jar')
    window.cheerpjLib = lib

    // Load game
    updateLoading(70, 'game')
    const FreeJ2ME = await lib.org.recompile.freej2me.FreeJ2ME
    const jarPath = cheerpjWebRoot + '/games/' + GAME_JAR

    updateLoading(90, 'starting')
    FreeJ2ME.main(['jar', jarPath]).catch((e) => {
      if (e.printStackTrace) e.printStackTrace()
      loadingState.value = 'error'
      errorMessage.value = 'Game crashed!'
    })
  } catch (e) {
    console.error('Emulator init failed:', e)
    loadingState.value = 'error'
    errorMessage.value = String(e)
  }
}

// Track pressed buttons for visual feedback
const pressedKeys = ref(new Set())

function sendKey(keyCode, isDown) {
  if (isDown) {
    pressedKeys.value.add(keyCode)
  } else {
    pressedKeys.value.delete(keyCode)
  }
  // Force reactivity
  pressedKeys.value = new Set(pressedKeys.value)

  if (!window.evtQueue) return
  const code = window.codeMapRef?.[keyCode]
  if (code) {
    window.evtQueue.queueEvent({
      kind: isDown ? 'keydown' : 'keyup',
      args: [code, '\x00', false, false],
    })
  }
}

function toggleFullscreen() {
  const container = containerRef.value
  if (!container) return
  if (!document.fullscreenElement) {
    container.requestFullscreen().then(() => { isFullscreen.value = true; setTimeout(autoscale, 100) })
  } else {
    document.exitFullscreen().then(() => { isFullscreen.value = false; setTimeout(autoscale, 100) })
  }
}

onMounted(() => initEmulator())
onUnmounted(() => { cleanupFns.forEach(fn => fn()); cleanupFns.length = 0 })

// Detect mobile for showing virtual keypad
const isMobile = ref(false)
onMounted(() => {
  isMobile.value = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    || ('ontouchstart' in window)
    || (window.innerWidth <= 768)
})
</script>

<template>
  <div class="emulator-page bg-bg-deep text-text-primary font-body flex flex-col items-center">
    <!-- Header -->
    <div class="w-full px-3 py-2 flex items-center justify-between max-w-4xl mx-auto animate-fade-up flex-shrink-0">
      <RouterLink
        to="/"
        class="inline-flex items-center gap-1 border border-border-default bg-bg-surface
               px-2 py-1 text-[11px] text-text-secondary
               transition hover:border-accent-coral hover:text-text-primary"
      >
        &larr; Về trang chủ
      </RouterLink>

      <h1 class="font-display text-sm sm:text-xl font-bold text-accent-coral tracking-tight truncate px-2">
        Bộ lạc thời tiền sử
      </h1>

      <button
        class="border border-border-default bg-bg-surface px-2 py-1 text-[11px] text-text-secondary
               transition hover:border-accent-sky hover:text-text-primary flex-shrink-0"
        @click="toggleFullscreen"
      >
        {{ isFullscreen ? '⊡' : '⊞' }}
      </button>
    </div>

    <!-- Game area -->
    <div :class="['w-full flex flex-col items-center px-2 min-h-0', loadingState !== 'ready' ? 'flex-1 justify-center' : 'justify-start']">
      <!-- Game container -->
      <div
        ref="containerRef"
        class="game-container relative border border-border-default bg-black flex items-center justify-center
               w-full max-w-[480px] animate-fade-up animate-delay-1"
      >
        <!-- Loading overlay -->
        <div
          v-if="loadingState !== 'ready'"
          class="absolute inset-0 bg-bg-deep flex flex-col items-center justify-center z-10 p-6"
        >
          <div v-if="loadingState === 'error'" class="text-center">
            <div class="font-display text-xl text-accent-coral mb-2">Lỗi!</div>
            <p class="text-text-secondary text-sm mb-4">{{ errorMessage }}</p>
            <button
              class="border border-accent-coral px-4 py-2 text-accent-coral text-sm
                     hover:bg-accent-coral hover:text-bg-deep transition"
              @click="$router.go(0)"
            >
              Thử lại
            </button>
          </div>

          <div v-else class="text-center w-full max-w-[200px]">
            <div class="pixel-loader mb-6">
              <div class="pixel-row">
                <span v-for="i in 8" :key="i" class="pixel" :style="{ animationDelay: `${i * 0.1}s` }" />
              </div>
            </div>
            <div class="font-display text-sm tracking-widest text-accent-amber mb-3">
              {{ loadingText }}
            </div>
            <div class="w-full h-1 bg-bg-elevated overflow-hidden">
              <div class="h-full bg-accent-coral transition-all duration-500" :style="{ width: `${loadingPercent}%` }" />
            </div>
            <div class="mt-2 font-display text-xs text-text-dim">{{ loadingPercent }}%</div>
          </div>
        </div>

        <!-- Game canvas -->
        <canvas
          ref="displayRef"
          id="display"
          width="240"
          height="320"
          tabindex="0"
          style="display: none; image-rendering: pixelated; outline: none;"
        />
      </div>

      <!-- ===== MOBILE: Nokia-style keypad ===== -->
      <div v-if="isMobile && loadingState === 'ready'" class="nokia-keypad animate-fade-up animate-delay-2">
        <!-- Row 1: Soft Left + D-Pad + Soft Right -->
        <div class="nk-top-row">
          <button :class="['nk-soft nk-soft-l', { pressed: pressedKeys.has('F1') }]"
            @touchstart.prevent="sendKey('F1', true)" @touchend.prevent="sendKey('F1', false)"
          ></button>
          <div class="nk-dpad">
            <button :class="['nk-dp nk-dp-up', { pressed: pressedKeys.has('ArrowUp') }]"
              @touchstart.prevent="sendKey('ArrowUp', true)" @touchend.prevent="sendKey('ArrowUp', false)">▲</button>
            <button :class="['nk-dp nk-dp-left', { pressed: pressedKeys.has('ArrowLeft') }]"
              @touchstart.prevent="sendKey('ArrowLeft', true)" @touchend.prevent="sendKey('ArrowLeft', false)">◄</button>
            <button :class="['nk-dp nk-dp-ok', { pressed: pressedKeys.has('Enter') }]"
              @touchstart.prevent="sendKey('Enter', true)" @touchend.prevent="sendKey('Enter', false)"></button>
            <button :class="['nk-dp nk-dp-right', { pressed: pressedKeys.has('ArrowRight') }]"
              @touchstart.prevent="sendKey('ArrowRight', true)" @touchend.prevent="sendKey('ArrowRight', false)">►</button>
            <button :class="['nk-dp nk-dp-down', { pressed: pressedKeys.has('ArrowDown') }]"
              @touchstart.prevent="sendKey('ArrowDown', true)" @touchend.prevent="sendKey('ArrowDown', false)">▼</button>
          </div>
          <button :class="['nk-soft nk-soft-r', { pressed: pressedKeys.has('F2') }]"
            @touchstart.prevent="sendKey('F2', true)" @touchend.prevent="sendKey('F2', false)"
          ></button>
        </div>

        <!-- Row 2: Number pad -->
        <div class="nk-numpad">
          <button v-for="k in [
            { c: 'Digit1', n: '1', s: '' },
            { c: 'Digit2', n: '2', s: 'abc' },
            { c: 'Digit3', n: '3', s: 'def' },
            { c: 'Digit4', n: '4', s: 'ghi' },
            { c: 'Digit5', n: '5', s: 'jkl' },
            { c: 'Digit6', n: '6', s: 'mno' },
            { c: 'Digit7', n: '7', s: 'pqrs' },
            { c: 'Digit8', n: '8', s: 'tuv' },
            { c: 'Digit9', n: '9', s: 'wxyz' },
            { c: 'NumpadMultiply', n: '✱', s: '' },
            { c: 'Digit0', n: '0', s: '' },
            { c: 'NumpadDivide', n: '#', s: '' },
          ]" :key="k.c"
            :class="['nk-num', { pressed: pressedKeys.has(k.c) }]"
            @touchstart.prevent="sendKey(k.c, true)" @touchend.prevent="sendKey(k.c, false)"
          >
            <span class="nk-n">{{ k.n }}</span>
            <span v-if="k.s" class="nk-s">{{ k.s }}</span>
          </button>
        </div>
      </div>

      <!-- ===== DESKTOP: Keyboard shortcuts ===== -->
      <div v-if="!isMobile && loadingState === 'ready'" class="desktop-shortcuts animate-fade-up animate-delay-2">
        <div class="font-display text-xs tracking-widest text-text-dim uppercase flex items-center gap-2">
          <span class="text-accent-coral">//</span> Phím tắt
        </div>
        <div class="shortcuts-grid">
          <div><kbd>↑↓←→</kbd> Di chuyển</div>
          <div><kbd>Enter</kbd> OK</div>
          <div><kbd>Q</kbd> Soft Left</div>
          <div><kbd>W</kbd> Soft Right</div>
          <div><kbd>Esc</kbd> Quay lại</div>
          <div><kbd>0-9</kbd> Bàn phím số</div>
          <div><kbd>E</kbd> Dấu *</div>
          <div><kbd>R</kbd> Dấu #</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.game-container {
  background: #000;
  box-shadow: 0 0 40px rgba(255, 107, 74, 0.08);
}
.game-container:focus-within {
  border-color: #ff6b4a;
}

/* ===== PAGE LAYOUT ===== */
.emulator-page {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}
@media (max-width: 768px) {
  .emulator-page {
    height: 100vh;
    height: 100dvh;
    overflow: hidden;
  }
  .game-container {
    aspect-ratio: unset !important;
    flex: none;
    min-height: 0;
    height: auto;
  }
  .nokia-keypad {
    flex: 1;
    min-height: 0;
    justify-content: flex-end;
  }
}
@media (min-width: 769px) {
  .game-container {
    aspect-ratio: 3/4;
  }
}

/* ===== LOADING ===== */
.pixel-loader { display: flex; justify-content: center; }
.pixel-row { display: flex; gap: 4px; }
.pixel {
  width: 8px;
  height: 8px;
  background: #ff6b4a;
  animation: pixel-blink 1.2s ease-in-out infinite;
}
@keyframes pixel-blink {
  0%, 100% { opacity: 0.15; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1); }
}

/* ===== NOKIA KEYPAD ===== */
.nokia-keypad {
  width: 100%;
  max-width: 340px;
  padding: 4px 8px env(safe-area-inset-bottom, 8px);
  display: flex;
  flex-direction: column;
  gap: 4px;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}

/* Top row: [soft-L]  [D-pad]  [soft-R] */
.nk-top-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

/* Soft keys — pill shape like Nokia */
.nk-soft {
  width: 56px;
  height: 44px;
  border: 1px solid #2a3f55;
  background: linear-gradient(180deg, #1e3348 0%, #162232 100%);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.08s;
  flex-shrink: 0;
}
.nk-soft-l { border-radius: 10px 4px 4px 10px; }
.nk-soft-r { border-radius: 4px 10px 10px 4px; }
.nk-soft.pressed {
  background: #ff6b4a;
  border-color: #ff8a6a;
  box-shadow: 0 0 14px rgba(255, 107, 74, 0.5);
  transform: scale(0.93);
}

/* D-Pad — large circle */
.nk-dpad {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(145deg, #1c3044, #121e2c);
  border: 2px solid #2a3f55;
  box-shadow:
    inset 0 2px 6px rgba(0,0,0,0.4),
    0 1px 3px rgba(255,255,255,0.04);
  flex-shrink: 0;
}
.nk-dp {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: #5c7a94;
  font-family: 'Anybody', sans-serif;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.08s;
  z-index: 1;
}
.nk-dp.pressed {
  color: #ff6b4a;
  text-shadow: 0 0 12px rgba(255, 107, 74, 0.7);
}
.nk-dp-up    { top: 4px; left: 50%; transform: translateX(-50%); width: 44px; height: 30px; }
.nk-dp-down  { bottom: 4px; left: 50%; transform: translateX(-50%); width: 44px; height: 30px; }
.nk-dp-left  { left: 4px; top: 50%; transform: translateY(-50%); width: 30px; height: 44px; }
.nk-dp-right { right: 4px; top: 50%; transform: translateY(-50%); width: 30px; height: 44px; }
.nk-dp-up.pressed    { transform: translateX(-50%) scale(1.1); }
.nk-dp-down.pressed  { transform: translateX(-50%) scale(1.1); }
.nk-dp-left.pressed  { transform: translateY(-50%) scale(1.1); }
.nk-dp-right.pressed { transform: translateY(-50%) scale(1.1); }
.nk-dp-ok {
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 42px; height: 42px;
  border-radius: 50%;
  background: linear-gradient(145deg, #253d52, #1a2d40);
  border: 2px solid #2a3f55;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.3);
  z-index: 2;
}
.nk-dp-ok.pressed {
  background: #ff6b4a;
  border-color: #ff8a6a;
  box-shadow: 0 0 16px rgba(255, 107, 74, 0.5);
  transform: translate(-50%, -50%) scale(0.9);
}

/* Number pad — wide rounded buttons, number + letters on same line */
.nk-numpad {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 5px;
}
.nk-num {
  display: flex;
  flex-direction: row;
  align-items: baseline;
  justify-content: center;
  gap: 6px;
  padding: 10px 6px;
  border: 1px solid #2a3f55;
  background: linear-gradient(180deg, #1e3348 0%, #162232 100%);
  cursor: pointer;
  transition: all 0.08s;
  border-radius: 6px;
  min-height: 40px;
}
.nk-num.pressed {
  background: linear-gradient(180deg, #ffcc4d 0%, #ffb830 100%);
  border-color: #ffd866;
  box-shadow: 0 0 12px rgba(255, 184, 48, 0.5);
  transform: scale(0.95);
}
.nk-num.pressed .nk-n { color: #1a1000; }
.nk-num.pressed .nk-s { color: #5c4400; }
.nk-n {
  font-family: 'Anybody', sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: #f0ede6;
  line-height: 1;
}
.nk-s {
  font-family: 'Be Vietnam Pro', sans-serif;
  font-size: 10px;
  color: #5c7a94;
  letter-spacing: 0.04em;
}

/* ===== DESKTOP SHORTCUTS ===== */
.desktop-shortcuts {
  width: 100%;
  max-width: 480px;
  border: 1px solid #253549;
  background: #12202e;
  padding: 12px 16px;
  margin-top: 12px;
}
.shortcuts-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 16px;
  margin-top: 8px;
  font-size: 12px;
  color: #8b9db5;
}
.shortcuts-grid kbd {
  background: #1e2f42;
  border: 1px solid #253549;
  padding: 1px 6px;
  font-family: 'Anybody', sans-serif;
  font-size: 11px;
  color: #f0ede6;
  border-radius: 2px;
}
</style>

