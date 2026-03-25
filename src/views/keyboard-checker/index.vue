<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import KeyCap from './components/KeyCap.vue'

// --- Types ---
interface KeyInfo {
  code: string
  label: string
  sub?: string
  width?: string
  height?: string
  gridArea?: string
  isIcon?: boolean
  isKnob?: boolean
  isDisabled?: boolean
}

// --- State ---
const pressedKeys = ref<Record<string, boolean>>({})
const registeredKeys = reactive(new Set<string>())
const lastKey = ref<{ label: string; code: string; keyCode: number; timestamp: number } | null>(
  null,
)
const maxRollover = ref(0)
const layout = ref('Full')
const os = ref('WIN')
const isSoundEnabled = ref(true)

// --- Lighting & RGB ---
const primaryColor = ref('#00F0FF')
const isRGBMode = ref(true)
const showLightingMenu = ref(false)
const lightingMenuRef = ref<HTMLElement | null>(null)
const lastLatency = ref(0)

const colorPresets = [
  { name: 'Cyan', value: '#00F0FF' },
  { name: 'Magenta', value: '#FF00E6' },
  { name: 'Green', value: '#00FF66' },
  { name: 'Yellow', value: '#FFD600' },
  { name: 'Orange', value: '#FF6B00' },
  { name: 'Red', value: '#FF0000' },
  { name: 'Purple', value: '#A000FF' },
  { name: 'White', value: '#FFFFFF' },
]

let rgbAnimationId: number | null = null

const animateRGB = () => {
  if (isRGBMode.value) {
    const hue = (Date.now() / 20) % 360
    primaryColor.value = `hsl(${hue}, 100%, 50%)`
    rgbAnimationId = requestAnimationFrame(animateRGB)
  }
}

const stopRGBEffect = () => {
  if (rgbAnimationId) {
    cancelAnimationFrame(rgbAnimationId)
    rgbAnimationId = null
  }
}

const setPrimaryColor = (color: string) => {
  stopRGBEffect()
  isRGBMode.value = false
  primaryColor.value = color
}

const toggleRGB = () => {
  isRGBMode.value = !isRGBMode.value
  if (isRGBMode.value) {
    animateRGB()
  } else {
    stopRGBEffect()
    primaryColor.value = '#00F0FF'
  }
}

// --- Audio Engine ---
let audioCtx: AudioContext | null = null

const getAudioCtx = (): AudioContext => {
  if (!audioCtx) {
    const Ctor =
      window.AudioContext ??
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    audioCtx = new Ctor()
  }
  if (audioCtx.state === 'suspended') audioCtx.resume()
  return audioCtx
}

const playClickSound = () => {
  if (!isSoundEnabled.value) return
  const ctx = getAudioCtx()
  const now = ctx.currentTime
  const rand = Math.random() * 0.05

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(80 + rand * 15, now)
  osc.frequency.exponentialRampToValueAtTime(27, now + 0.12)
  gain.gain.setValueAtTime(0.3, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(now)
  osc.stop(now + 0.12)
}

const playReleaseSound = () => {
  if (!isSoundEnabled.value || !audioCtx) return
  const ctx = audioCtx
  const now = ctx.currentTime
  const rand = Math.random() * 0.05

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(800 + rand * 200, now)
  osc.frequency.exponentialRampToValueAtTime(1200, now + 0.02)
  gain.gain.setValueAtTime(0.02, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(now)
  osc.stop(now + 0.03)
}

// --- KPS ---
const keyPressHistory = ref<number[]>([])
const kps = computed(() => {
  const now = Date.now()
  return keyPressHistory.value.filter((t) => now - t < 1000).length
})
// --- Layout Data: Full ---
const fRow: KeyInfo[] = [
  { code: 'Escape', label: 'Esc', gridArea: 'col-span-4' },
  { code: 'F1', label: 'F1', gridArea: 'col-span-4 col-start-9' },
  { code: 'F2', label: 'F2', gridArea: 'col-span-4' },
  { code: 'F3', label: 'F3', gridArea: 'col-span-4' },
  { code: 'F4', label: 'F4', gridArea: 'col-span-4' },
  { code: 'F5', label: 'F5', gridArea: 'col-span-4 col-start-27' },
  { code: 'F6', label: 'F6', gridArea: 'col-span-4' },
  { code: 'F7', label: 'F7', gridArea: 'col-span-4' },
  { code: 'F8', label: 'F8', gridArea: 'col-span-4' },
  { code: 'F9', label: 'F9', gridArea: 'col-span-4 col-start-45' },
  { code: 'F10', label: 'F10', gridArea: 'col-span-4' },
  { code: 'F11', label: 'F11', gridArea: 'col-span-4' },
  { code: 'F12', label: 'F12', gridArea: 'col-span-4' },
]

const row1: KeyInfo[] = [
  { code: 'Backquote', label: '`', sub: '~', gridArea: 'col-span-4' },
  { code: 'Digit1', label: '1', sub: '!', gridArea: 'col-span-4' },
  { code: 'Digit2', label: '2', sub: '@', gridArea: 'col-span-4' },
  { code: 'Digit3', label: '3', sub: '#', gridArea: 'col-span-4' },
  { code: 'Digit4', label: '4', sub: '$', gridArea: 'col-span-4' },
  { code: 'Digit5', label: '5', sub: '%', gridArea: 'col-span-4' },
  { code: 'Digit6', label: '6', sub: '^', gridArea: 'col-span-4' },
  { code: 'Digit7', label: '7', sub: '&', gridArea: 'col-span-4' },
  { code: 'Digit8', label: '8', sub: '*', gridArea: 'col-span-4' },
  { code: 'Digit9', label: '9', sub: '(', gridArea: 'col-span-4' },
  { code: 'Digit0', label: '0', sub: ')', gridArea: 'col-span-4' },
  { code: 'Minus', label: '-', sub: '_', gridArea: 'col-span-4' },
  { code: 'Equal', label: '=', sub: '+', gridArea: 'col-span-4' },
  { code: 'Backspace', label: 'BACKSPACE', gridArea: 'col-span-8' },
]

const row2: KeyInfo[] = [
  { code: 'Tab', label: 'TAB', gridArea: 'col-span-6' },
  { code: 'KeyQ', label: 'Q', gridArea: 'col-span-4' },
  { code: 'KeyW', label: 'W', gridArea: 'col-span-4' },
  { code: 'KeyE', label: 'E', gridArea: 'col-span-4' },
  { code: 'KeyR', label: 'R', gridArea: 'col-span-4' },
  { code: 'KeyT', label: 'T', gridArea: 'col-span-4' },
  { code: 'KeyY', label: 'Y', gridArea: 'col-span-4' },
  { code: 'KeyU', label: 'U', gridArea: 'col-span-4' },
  { code: 'KeyI', label: 'I', gridArea: 'col-span-4' },
  { code: 'KeyO', label: 'O', gridArea: 'col-span-4' },
  { code: 'KeyP', label: 'P', gridArea: 'col-span-4' },
  { code: 'BracketLeft', label: '[', sub: '{', gridArea: 'col-span-4' },
  { code: 'BracketRight', label: ']', sub: '}', gridArea: 'col-span-4' },
  { code: 'Backslash', label: '\\', sub: '|', gridArea: 'col-span-6' },
]

const row3: KeyInfo[] = [
  { code: 'CapsLock', label: 'CAPS', gridArea: 'col-span-7' },
  { code: 'KeyA', label: 'A', gridArea: 'col-span-4' },
  { code: 'KeyS', label: 'S', gridArea: 'col-span-4' },
  { code: 'KeyD', label: 'D', gridArea: 'col-span-4' },
  { code: 'KeyF', label: 'F', gridArea: 'col-span-4' },
  { code: 'KeyG', label: 'G', gridArea: 'col-span-4' },
  { code: 'KeyH', label: 'H', gridArea: 'col-span-4' },
  { code: 'KeyJ', label: 'J', gridArea: 'col-span-4' },
  { code: 'KeyK', label: 'K', gridArea: 'col-span-4' },
  { code: 'KeyL', label: 'L', gridArea: 'col-span-4' },
  { code: 'Semicolon', label: ';', sub: ':', gridArea: 'col-span-4' },
  { code: 'Quote', label: "'", sub: '"', gridArea: 'col-span-4' },
  { code: 'Enter', label: 'ENTER', gridArea: 'col-span-9' },
]

const row4: KeyInfo[] = [
  { code: 'ShiftLeft', label: 'SHIFT', gridArea: 'col-span-9' },
  { code: 'KeyZ', label: 'Z', gridArea: 'col-span-4' },
  { code: 'KeyX', label: 'X', gridArea: 'col-span-4' },
  { code: 'KeyC', label: 'C', gridArea: 'col-span-4' },
  { code: 'KeyV', label: 'V', gridArea: 'col-span-4' },
  { code: 'KeyB', label: 'B', gridArea: 'col-span-4' },
  { code: 'KeyN', label: 'N', gridArea: 'col-span-4' },
  { code: 'KeyM', label: 'M', gridArea: 'col-span-4' },
  { code: 'Comma', label: ',', sub: '<', gridArea: 'col-span-4' },
  { code: 'Period', label: '.', sub: '>', gridArea: 'col-span-4' },
  { code: 'Slash', label: '/', sub: '?', gridArea: 'col-span-4' },
  { code: 'ShiftRight', label: 'SHIFT', gridArea: 'col-span-11' },
]

const row5: KeyInfo[] = [
  { code: 'ControlLeft', label: 'CTRL', gridArea: 'col-span-5' },
  { code: 'MetaLeft', label: 'WIN', gridArea: 'col-span-5' },
  { code: 'AltLeft', label: 'ALT', gridArea: 'col-span-5' },
  { code: 'Space', label: '', gridArea: 'col-span-25' },
  { code: 'AltRight', label: 'ALT', gridArea: 'col-span-5' },
  { code: 'MetaRight', label: 'WIN', gridArea: 'col-span-5' },
  { code: 'ContextMenu', label: 'MENU', gridArea: 'col-span-5' },
  { code: 'ControlRight', label: 'CTRL', gridArea: 'col-span-5' },
]

// --- Layout Data: 75% ---
const fRow75: KeyInfo[] = [
  { code: 'Escape', label: 'ESC', gridArea: 'col-span-4' },
  { code: 'F1', label: 'F1', gridArea: 'col-span-4 col-start-6' },
  { code: 'F2', label: 'F2', gridArea: 'col-span-4' },
  { code: 'F3', label: 'F3', gridArea: 'col-span-4' },
  { code: 'F4', label: 'F4', gridArea: 'col-span-4' },
  { code: 'F5', label: 'F5', gridArea: 'col-span-4 col-start-23' },
  { code: 'F6', label: 'F6', gridArea: 'col-span-4' },
  { code: 'F7', label: 'F7', gridArea: 'col-span-4' },
  { code: 'F8', label: 'F8', gridArea: 'col-span-4' },
  { code: 'F9', label: 'F9', gridArea: 'col-span-4 col-start-40' },
  { code: 'F10', label: 'F10', gridArea: 'col-span-4' },
  { code: 'F11', label: 'F11', gridArea: 'col-span-4' },
  { code: 'F12', label: 'F12', gridArea: 'col-span-4' },
  { code: 'Insert', label: 'INS', gridArea: 'col-span-4 col-start-57' },
  { code: 'Knob', label: '', isKnob: true, gridArea: 'col-span-4 col-start-61' },
]

const row1_75: KeyInfo[] = [
  { code: 'Backquote', label: '`', sub: '~', gridArea: 'col-span-4' },
  { code: 'Digit1', label: '1', sub: '!', gridArea: 'col-span-4' },
  { code: 'Digit2', label: '2', sub: '@', gridArea: 'col-span-4' },
  { code: 'Digit3', label: '3', sub: '#', gridArea: 'col-span-4' },
  { code: 'Digit4', label: '4', sub: '$', gridArea: 'col-span-4' },
  { code: 'Digit5', label: '5', sub: '%', gridArea: 'col-span-4' },
  { code: 'Digit6', label: '6', sub: '^', gridArea: 'col-span-4' },
  { code: 'Digit7', label: '7', sub: '&', gridArea: 'col-span-4' },
  { code: 'Digit8', label: '8', sub: '*', gridArea: 'col-span-4' },
  { code: 'Digit9', label: '9', sub: '(', gridArea: 'col-span-4' },
  { code: 'Digit0', label: '0', sub: ')', gridArea: 'col-span-4' },
  { code: 'Minus', label: '-', sub: '_', gridArea: 'col-span-4' },
  { code: 'Equal', label: '=', sub: '+', gridArea: 'col-span-4' },
  { code: 'Backspace', label: 'BACKSPACE', gridArea: 'col-span-8' },
  { code: 'Home', label: 'HOME', gridArea: 'col-span-4' },
]

const row2_75: KeyInfo[] = [
  { code: 'Tab', label: 'TAB', gridArea: 'col-span-6' },
  { code: 'KeyQ', label: 'Q', gridArea: 'col-span-4' },
  { code: 'KeyW', label: 'W', gridArea: 'col-span-4' },
  { code: 'KeyE', label: 'E', gridArea: 'col-span-4' },
  { code: 'KeyR', label: 'R', gridArea: 'col-span-4' },
  { code: 'KeyT', label: 'T', gridArea: 'col-span-4' },
  { code: 'KeyY', label: 'Y', gridArea: 'col-span-4' },
  { code: 'KeyU', label: 'U', gridArea: 'col-span-4' },
  { code: 'KeyI', label: 'I', gridArea: 'col-span-4' },
  { code: 'KeyO', label: 'O', gridArea: 'col-span-4' },
  { code: 'KeyP', label: 'P', gridArea: 'col-span-4' },
  { code: 'BracketLeft', label: '[', sub: '{', gridArea: 'col-span-4' },
  { code: 'BracketRight', label: ']', sub: '}', gridArea: 'col-span-4' },
  { code: 'Backslash', label: '\\', sub: '|', gridArea: 'col-span-6' },
  { code: 'PageUp', label: 'PGUP', gridArea: 'col-span-4' },
]

const row3_75: KeyInfo[] = [
  { code: 'CapsLock', label: 'CAPS', gridArea: 'col-span-7' },
  { code: 'KeyA', label: 'A', gridArea: 'col-span-4' },
  { code: 'KeyS', label: 'S', gridArea: 'col-span-4' },
  { code: 'KeyD', label: 'D', gridArea: 'col-span-4' },
  { code: 'KeyF', label: 'F', gridArea: 'col-span-4' },
  { code: 'KeyG', label: 'G', gridArea: 'col-span-4' },
  { code: 'KeyH', label: 'H', gridArea: 'col-span-4' },
  { code: 'KeyJ', label: 'J', gridArea: 'col-span-4' },
  { code: 'KeyK', label: 'K', gridArea: 'col-span-4' },
  { code: 'KeyL', label: 'L', gridArea: 'col-span-4' },
  { code: 'Semicolon', label: ';', sub: ':', gridArea: 'col-span-4' },
  { code: 'Quote', label: "'", sub: '"', gridArea: 'col-span-4' },
  { code: 'Enter', label: 'ENTER', gridArea: 'col-span-9' },
  { code: 'PageDown', label: 'PGDN', gridArea: 'col-span-4' },
]

const row4_75: KeyInfo[] = [
  { code: 'ShiftLeft', label: 'SHIFT', gridArea: 'col-span-9' },
  { code: 'KeyZ', label: 'Z', gridArea: 'col-span-4' },
  { code: 'KeyX', label: 'X', gridArea: 'col-span-4' },
  { code: 'KeyC', label: 'C', gridArea: 'col-span-4' },
  { code: 'KeyV', label: 'V', gridArea: 'col-span-4' },
  { code: 'KeyB', label: 'B', gridArea: 'col-span-4' },
  { code: 'KeyN', label: 'N', gridArea: 'col-span-4' },
  { code: 'KeyM', label: 'M', gridArea: 'col-span-4' },
  { code: 'Comma', label: ',', sub: '<', gridArea: 'col-span-4' },
  { code: 'Period', label: '.', sub: '>', gridArea: 'col-span-4' },
  { code: 'Slash', label: '/', sub: '?', gridArea: 'col-span-4' },
  { code: 'ShiftRight', label: 'SHIFT', gridArea: 'col-span-7' },
  { code: 'ArrowUp', label: 'Up', isIcon: true, gridArea: 'col-span-4' },
  { code: 'End', label: 'END', gridArea: 'col-span-4' },
]

const row5_75: KeyInfo[] = [
  { code: 'ControlLeft', label: 'CTRL', gridArea: 'col-span-5' },
  { code: 'MetaLeft', label: 'WIN', gridArea: 'col-span-5' },
  { code: 'AltLeft', label: 'ALT', gridArea: 'col-span-5' },
  { code: 'Space', label: '', gridArea: 'col-span-25' },
  { code: 'AltRight', label: 'ALT', gridArea: 'col-span-4' },
  { code: 'Fn', label: 'FN', gridArea: 'col-span-4', isDisabled: true },
  { code: 'ControlRight', label: 'CTRL', gridArea: 'col-span-4' },
  { code: 'ArrowLeft', label: 'Left', isIcon: true, gridArea: 'col-span-4' },
  { code: 'ArrowDown', label: 'Down', isIcon: true, gridArea: 'col-span-4' },
  { code: 'ArrowRight', label: 'Right', isIcon: true, gridArea: 'col-span-4' },
]

const navRow: KeyInfo[] = [
  { code: 'PrintScreen', label: 'PrtSc' },
  { code: 'ScrollLock', label: 'ScrLk' },
  { code: 'Pause', label: 'Pause' },
]

const navBlock: KeyInfo[][] = [
  [
    { code: 'Insert', label: 'Ins' },
    { code: 'Home', label: 'Home' },
    { code: 'PageUp', label: 'PgUp' },
  ],
  [
    { code: 'Delete', label: 'Del' },
    { code: 'End', label: 'End' },
    { code: 'PageDown', label: 'PgDn' },
  ],
]

const arrows: KeyInfo[] = [
  { code: 'ArrowUp', label: 'Up', isIcon: true },
  { code: 'ArrowLeft', label: 'Left', isIcon: true },
  { code: 'ArrowDown', label: 'Down', isIcon: true },
  { code: 'ArrowRight', label: 'Right', isIcon: true },
]

// Tìm đến đoạn khai báo const numpad: KeyInfo[]
const numpad: KeyInfo[] = [
  { code: 'NumLock', label: 'Num', gridArea: 'col-span-4' },
  { code: 'NumpadDivide', label: '/', gridArea: 'col-span-4' },
  { code: 'NumpadMultiply', label: '*', gridArea: 'col-span-4' },
  { code: 'NumpadSubtract', label: '-', gridArea: 'col-span-4' },

  { code: 'Numpad7', label: '7', gridArea: 'col-span-4' },
  { code: 'Numpad8', label: '8', gridArea: 'col-span-4' },
  { code: 'Numpad9', label: '9', gridArea: 'col-span-4' },
  // Phím + (2u cao): chiếm 4 cột, 2 hàng
  { code: 'NumpadAdd', label: '+', gridArea: 'col-span-4 row-span-2', height: 'h-full' },

  { code: 'Numpad4', label: '4', gridArea: 'col-span-4' },
  { code: 'Numpad5', label: '5', gridArea: 'col-span-4' },
  { code: 'Numpad6', label: '6', gridArea: 'col-span-4' },

  { code: 'Numpad1', label: '1', gridArea: 'col-span-4' },
  { code: 'Numpad2', label: '2', gridArea: 'col-span-4' },
  { code: 'Numpad3', label: '3', gridArea: 'col-span-4' },
  // Phím Enter (2u cao): chiếm 4 cột, 2 hàng
  { code: 'NumpadEnter', label: 'Enter', gridArea: 'col-span-4 row-span-2', height: 'h-full' },

  // Phím 0 (2u rộng): chiếm 8 cột (2 phím)
  { code: 'Numpad0', label: '0', gridArea: 'col-span-8', width: 'w-full' },
  { code: 'NumpadDecimal', label: '.', gridArea: 'col-span-4' },
]

const allLayoutKeys: KeyInfo[] = [
  ...fRow,
  ...row1,
  ...row2,
  ...row3,
  ...row4,
  ...row5,
  ...navRow,
  ...navBlock.flat(),
  ...arrows,
  ...numpad,
  ...fRow75,
  ...row1_75,
  ...row2_75,
  ...row3_75,
  ...row4_75,
  ...row5_75,
]

// --- Handlers ---
const handleKeyDown = (e: KeyboardEvent) => {
  e.preventDefault()
  const code = e.code
  const keyInfo = allLayoutKeys.find((k) => k.code === code)

  if (keyInfo?.isDisabled) return

  if (!pressedKeys.value[code]) {
    playClickSound()
  }

  pressedKeys.value[code] = true
  registeredKeys.add(code)

  let keyLabel = keyInfo?.label ?? code
  if (os.value === 'MAC' && keyInfo) {
    switch (keyInfo.code) {
      case 'MetaLeft':
      case 'MetaRight':
        keyLabel = 'CMD'
        break
      case 'AltLeft':
      case 'AltRight':
        keyLabel = 'OPT'
        break
      case 'Backspace':
        keyLabel = 'DELETE'
        break
      case 'Enter':
        keyLabel = 'RETURN'
        break
    }
  }

  lastKey.value = { label: keyLabel, code, keyCode: e.keyCode, timestamp: Date.now() }
  lastLatency.value = Math.floor(Math.random() * 2) + 1

  const activeCount = Object.values(pressedKeys.value).filter(Boolean).length
  if (activeCount > maxRollover.value) {
    maxRollover.value = activeCount
  }

  keyPressHistory.value.push(Date.now())
}

const handleKeyUp = (e: KeyboardEvent) => {
  pressedKeys.value[e.code] = false
  playReleaseSound()
}

const resetBoard = () => {
  registeredKeys.clear()
  pressedKeys.value = {}
  maxRollover.value = 0
  lastKey.value = null
  keyPressHistory.value = []
}

const handleClickOutside = (event: MouseEvent) => {
  if (
    showLightingMenu.value &&
    lightingMenuRef.value &&
    !lightingMenuRef.value.contains(event.target as Node)
  ) {
    showLightingMenu.value = false
  }
}

const setOS = (newOS: 'WIN' | 'MAC') => {
  os.value = newOS
  resetBoard()
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
  window.addEventListener('mousedown', handleClickOutside)
  if (isRGBMode.value) animateRGB()
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
  window.removeEventListener('mousedown', handleClickOutside)
  stopRGBEffect()
})
</script>
<template>
  <div class="min-h-screen flex flex-col bg-bg-deep text-text-primary font-body overflow-hidden">
    <!-- Background grid -->
    <div
      class="fixed inset-0 pointer-events-none opacity-[0.03]"
      style="
        background-image: repeating-linear-gradient(
          45deg,
          #253549 0px,
          #253549 1px,
          transparent 1px,
          transparent 8px
        );
      "
    />

    <!-- Header -->
    <header class="relative z-50 border-b border-border-default bg-bg-deep/90 backdrop-blur-sm">
      <!-- Top bar -->
      <div class="w-full px-4 md:px-10 py-3 md:py-4 flex items-center justify-between gap-4">
        <!-- Left: back + logo -->
        <div class="flex items-center gap-4 shrink-0">
          <RouterLink
            to="/"
            class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-3 sm:px-4 py-2 text-xs sm:text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
          >
            &larr; <span class="hidden sm:inline">Home</span>
          </RouterLink>
          <div class="flex items-center gap-2 md:gap-3">
            <Icon icon="lucide:keyboard" class="size-5 text-accent-coral" />
            <h1 class="font-display text-base md:text-xl font-bold text-text-primary tracking-wide">
              Keyboard Checker
            </h1>
          </div>
        </div>

        <!-- Right: RGB + Lighting -->
        <div class="flex items-center gap-2 shrink-0" ref="lightingMenuRef">
          <!-- RGB toggle -->
          <button
            @click="toggleRGB"
            class="inline-flex items-center gap-2 border px-3 py-2 text-xs font-display tracking-wide uppercase transition"
            :class="
              isRGBMode
                ? 'border-accent-coral bg-accent-coral/10 text-accent-coral'
                : 'border-border-default bg-bg-surface text-text-secondary hover:border-accent-coral hover:text-text-primary'
            "
            :style="
              isRGBMode
                ? {
                    borderColor: primaryColor,
                    color: primaryColor,
                    backgroundColor: `color-mix(in srgb, ${primaryColor} 10%, transparent)`,
                  }
                : {}
            "
          >
            <Icon icon="lucide:zap" class="size-4" :class="{ 'animate-pulse': isRGBMode }" />
            <span class="hidden sm:inline">RGB Mode</span>
            <span class="sm:hidden">RGB</span>
          </button>

          <!-- Lighting button -->
          <button
            @click="showLightingMenu = !showLightingMenu"
            class="inline-flex items-center gap-2 border px-3 py-2 text-xs font-display tracking-wide uppercase transition"
            :class="
              showLightingMenu
                ? 'border-accent-coral bg-accent-coral/10 text-accent-coral'
                : 'border-border-default bg-bg-surface text-text-secondary hover:border-accent-coral hover:text-text-primary'
            "
          >
            <Icon icon="lucide:palette" class="size-4" />
            <span class="hidden md:inline">Lighting</span>
          </button>

          <!-- Lighting Dropdown -->
          <Transition
            enter-active-class="transition-all duration-150 ease-out"
            enter-from-class="opacity-0 -translate-y-1"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition-all duration-100 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 -translate-y-1"
          >
            <div
              v-if="showLightingMenu"
              class="absolute top-full right-0 mt-2 w-64 border border-border-default bg-bg-surface shadow-lg z-[100] p-4"
            >
              <div class="flex flex-col gap-4">
                <span class="text-xs font-display tracking-widest text-text-dim uppercase"
                  >Presets</span
                >
                <div class="grid grid-cols-4 gap-2">
                  <button
                    v-for="c in colorPresets"
                    :key="c.value"
                    @click="setPrimaryColor(c.value)"
                    class="size-10 border border-border-default flex items-center justify-center transition hover:scale-110 active:scale-95"
                    :style="{ backgroundColor: c.value }"
                  >
                    <Icon
                      v-if="primaryColor === c.value && !isRGBMode"
                      icon="lucide:check"
                      class="size-4 text-black"
                    />
                  </button>
                </div>
                <div class="border-t border-border-default pt-4">
                  <span
                    class="text-xs font-display tracking-widest text-text-dim uppercase block mb-3"
                  >
                    Custom Color
                  </span>
                  <div class="relative group">
                    <div
                      class="w-full h-10 border border-border-default bg-bg-deep flex items-center gap-3 px-3 cursor-pointer group-hover:border-accent-coral transition"
                    >
                      <div
                        class="size-5 border border-border-default"
                        :style="{ backgroundColor: primaryColor }"
                      />
                      <span
                        class="text-xs font-display text-text-secondary uppercase tracking-wide"
                      >
                        Pick Color
                      </span>
                    </div>
                    <input
                      type="color"
                      v-model="primaryColor"
                      @input="isRGBMode = false"
                      class="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>

      <!-- Toolbar row -->
      <div
        class="border-t border-border-default bg-bg-deep/50 px-4 md:px-10 py-2 flex items-center justify-between gap-2 overflow-x-auto"
      >
        <!-- Layout selector -->
        <div
          class="flex h-9 items-center bg-bg-surface border border-border-default p-0.5 shrink-0"
        >
          <button
            v-for="l in ['Full', '80% (TKL)', '75%']"
            :key="l"
            @click="layout = l"
            class="px-3 h-full text-xs font-display tracking-wide uppercase transition border"
            :class="
              layout === l
                ? 'bg-accent-coral/10 border-accent-coral text-accent-coral'
                : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-default'
            "
          >
            {{ l === '80% (TKL)' ? '80%' : l }}
          </button>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <!-- OS selector -->
          <div class="flex h-9 items-center bg-bg-surface border border-border-default p-0.5">
            <button
              @click="setOS('WIN')"
              class="px-3 h-full flex items-center gap-1.5 text-xs font-display tracking-wide uppercase transition border"
              :class="
                os === 'WIN'
                  ? 'bg-accent-coral/10 border-accent-coral text-accent-coral'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              "
            >
              <Icon icon="lucide:monitor" class="size-3.5" />
              <span class="hidden xs:inline">WIN</span>
            </button>
            <div class="w-px h-4 bg-border-default mx-0.5" />
            <button
              @click="setOS('MAC')"
              class="px-3 h-full flex items-center gap-1.5 text-xs font-display tracking-wide uppercase transition border"
              :class="
                os === 'MAC'
                  ? 'bg-accent-coral/10 border-accent-coral text-accent-coral'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              "
            >
              <Icon icon="lucide:command" class="size-3.5" />
              <span class="hidden xs:inline">MAC</span>
            </button>
          </div>

          <!-- Sound toggle -->
          <button
            @click="isSoundEnabled = !isSoundEnabled"
            class="h-9 px-3 inline-flex items-center gap-1.5 border text-xs font-display tracking-wide uppercase transition"
            :class="
              isSoundEnabled
                ? 'border-accent-coral bg-accent-coral/10 text-accent-coral'
                : 'border-border-default bg-bg-surface text-text-secondary hover:border-accent-coral hover:text-text-primary'
            "
          >
            <Icon :icon="isSoundEnabled ? 'lucide:volume-2' : 'lucide:volume-x'" class="size-4" />
            <span class="hidden lg:inline">Sound:</span>
            {{ isSoundEnabled ? 'ON' : 'OFF' }}
          </button>

          <!-- Reset -->
          <button
            @click="resetBoard"
            class="h-9 px-3 inline-flex items-center gap-1.5 border border-border-default bg-bg-surface text-text-secondary text-xs font-display tracking-wide uppercase transition hover:border-accent-coral hover:text-text-primary"
          >
            <Icon icon="lucide:rotate-ccw" class="size-4" />
            <span class="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Main Workspace -->
    <main
      class="flex-1 flex flex-col items-center justify-start md:justify-center relative w-full px-4 md:px-8 pt-12 md:pt-8 pb-56 md:pb-32 overflow-x-auto overflow-y-auto"
    >
      <!-- 75% Layout -->
      <div
        v-if="layout === '75%'"
        class="flex gap-6 md:gap-10 p-6 md:p-10 bg-bg-surface border border-border-default shadow-[0_40px_100px_rgba(0,0,0,0.8)] scale-[0.3] sm:scale-[0.45] md:scale-[0.6] lg:scale-[0.85] xl:scale-[0.95] 2xl:scale-[1.1] origin-center min-w-fit transition-transform duration-300 my-auto"
      >
        <div class="flex flex-col gap-2 w-[888px]">
          <div class="grid grid-cols-64 gap-2 mb-4">
            <KeyCap
              v-for="k in fRow75"
              :key="k.code"
              :info="k"
              :is-pressed="!!pressedKeys[k.code]"
              :is-registered="registeredKeys.has(k.code)"
              :os="os"
              :primary-color="primaryColor"
            />
          </div>
          <div class="grid grid-cols-64 gap-2">
            <KeyCap
              v-for="k in row1_75"
              :key="k.code"
              :info="k"
              :is-pressed="!!pressedKeys[k.code]"
              :is-registered="registeredKeys.has(k.code)"
              :os="os"
              :primary-color="primaryColor"
            />
          </div>
          <div class="grid grid-cols-64 gap-2">
            <KeyCap
              v-for="k in row2_75"
              :key="k.code"
              :info="k"
              :is-pressed="!!pressedKeys[k.code]"
              :is-registered="registeredKeys.has(k.code)"
              :os="os"
              :primary-color="primaryColor"
            />
          </div>
          <div class="grid grid-cols-64 gap-2">
            <KeyCap
              v-for="k in row3_75"
              :key="k.code"
              :info="k"
              :is-pressed="!!pressedKeys[k.code]"
              :is-registered="registeredKeys.has(k.code)"
              :os="os"
              :primary-color="primaryColor"
            />
          </div>
          <div class="grid grid-cols-64 gap-2">
            <KeyCap
              v-for="k in row4_75"
              :key="k.code"
              :info="k"
              :is-pressed="!!pressedKeys[k.code]"
              :is-registered="registeredKeys.has(k.code)"
              :os="os"
              :primary-color="primaryColor"
            />
          </div>
          <div class="grid grid-cols-64 gap-2">
            <KeyCap
              v-for="k in row5_75"
              :key="k.code"
              :info="k"
              :is-pressed="!!pressedKeys[k.code]"
              :is-registered="registeredKeys.has(k.code)"
              :os="os"
              :primary-color="primaryColor"
            />
          </div>
        </div>
      </div>

      <!-- Full / TKL Layout -->
      <div
        v-else
        class="flex items-end gap-10 p-10 bg-bg-surface border border-border-default shadow-[0_40px_100px_rgba(0,0,0,0.8)] scale-[0.3] sm:scale-[0.45] md:scale-[0.6] lg:scale-[0.85] xl:scale-[0.95] 2xl:scale-[1.1] origin-center min-w-fit transition-transform duration-300 my-auto font-display"
      >
        <div class="flex flex-col gap-6 w-[832px]">
          <div class="grid grid-cols-60 gap-2">
            <KeyCap
              v-for="k in fRow"
              :key="k.code"
              :info="k"
              :is-pressed="!!pressedKeys[k.code]"
              :is-registered="registeredKeys.has(k.code)"
              :os="os"
              :primary-color="primaryColor"
            />
          </div>
          <div class="flex flex-col gap-2">
            <div
              class="grid grid-cols-60 gap-2"
              v-for="row in [row1, row2, row3, row4, row5]"
              :key="row[0]!.code"
            >
              <KeyCap
                v-for="k in row"
                :key="k.code"
                :info="k"
                :is-pressed="!!pressedKeys[k.code]"
                :is-registered="registeredKeys.has(k.code)"
                :os="os"
                :primary-color="primaryColor"
              />
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-6">
          <div class="flex gap-2">
            <KeyCap
              v-for="k in navRow"
              :key="k.code"
              :info="k"
              :is-pressed="!!pressedKeys[k.code]"
              :is-registered="registeredKeys.has(k.code)"
              :os="os"
              :primary-color="primaryColor"
            />
          </div>
          <div class="flex flex-col gap-2">
            <div class="flex gap-2">
              <KeyCap
                v-for="k in navBlock[0]"
                :key="k.code"
                :info="k"
                :is-pressed="!!pressedKeys[k.code]"
                :is-registered="registeredKeys.has(k.code)"
                :os="os"
                :primary-color="primaryColor"
              />
            </div>
            <div class="flex gap-2">
              <KeyCap
                v-for="k in navBlock[1]"
                :key="k.code"
                :info="k"
                :is-pressed="!!pressedKeys[k.code]"
                :is-registered="registeredKeys.has(k.code)"
                :os="os"
                :primary-color="primaryColor"
              />
            </div>
            <div class="h-[40px] w-full" />
            <div class="flex justify-center w-full">
              <div v-if="arrows[0]" class="flex justify-center w-full">
                <KeyCap
                  :info="arrows[0]"
                  :is-pressed="!!pressedKeys[arrows[0].code]"
                  :is-registered="registeredKeys.has(arrows[0].code)"
                  :os="os"
                  :primary-color="primaryColor"
                />
              </div>
            </div>
            <div class="flex gap-2">
              <KeyCap
                v-for="k in arrows.slice(1)"
                :key="k.code"
                :info="k"
                :is-pressed="!!pressedKeys[k.code]"
                :is-registered="registeredKeys.has(k.code)"
                :os="os"
                :primary-color="primaryColor"
              />
            </div>
          </div>
        </div>

        <div v-if="layout === 'Full'" class="flex flex-col gap-6">
          <div class="h-[48px]"></div>
          <div class="grid grid-cols-16 gap-2 w-[184px]">
            <KeyCap
              v-for="k in numpad"
              :key="k.code"
              :info="k"
              :is-pressed="!!pressedKeys[k.code]"
              :is-registered="registeredKeys.has(k.code)"
              :os="os"
              :primary-color="primaryColor"
            />
          </div>
        </div>
      </div>
    </main>

    <!-- Telemetry HUD -->
    <footer
      class="w-full bg-bg-surface border-t border-border-default px-4 md:px-10 py-3 md:py-4 z-50 fixed bottom-0 left-0"
    >
      <div class="flex flex-col md:flex-row justify-between items-center gap-4 font-body text-sm">
        <!-- Left: status + last key -->
        <div
          class="flex items-center gap-4 md:gap-6 overflow-x-auto w-full md:w-auto justify-center md:justify-start"
        >
          <div class="flex flex-col shrink-0">
            <span class="text-text-dim text-[10px] font-display tracking-widest uppercase"
              >Status</span
            >
            <span class="text-[#00FF66] flex items-center gap-2 text-xs font-display">
              <span class="w-1.5 h-1.5 rounded-full bg-[#00FF66] animate-pulse" />
              LISTENING
            </span>
          </div>
          <div class="w-px h-6 bg-border-default shrink-0" />
          <div class="flex flex-col shrink-0">
            <span class="text-text-dim text-[10px] font-display tracking-widest uppercase"
              >Last Key</span
            >
            <span class="text-text-primary text-xs font-display">
              {{ lastKey ? lastKey.label : '---' }}
            </span>
          </div>
          <div class="w-px h-6 bg-border-default shrink-0" />
          <div class="flex flex-col shrink-0">
            <span class="text-text-dim text-[10px] font-display tracking-widest uppercase"
              >KeyCode</span
            >
            <span class="text-text-secondary font-body text-[10px]">
              {{ lastKey ? lastKey.keyCode : '---' }}
            </span>
          </div>
        </div>

        <!-- Right: metrics -->
        <div
          class="flex items-center gap-4 md:gap-8 bg-bg-deep px-4 md:px-6 py-2 border border-border-default w-full md:w-auto justify-between md:justify-center"
        >
          <div class="flex items-center gap-2">
            <span class="text-text-dim text-[10px] font-display tracking-widest uppercase"
              >Latency</span
            >
            <span class="text-text-primary text-sm md:text-lg font-display w-8 md:w-12 text-right">
              {{ lastKey ? lastLatency : 0 }}ms
            </span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-text-dim text-[10px] font-display tracking-widest uppercase"
              >KPS</span
            >
            <span class="text-[#00FF66] text-sm md:text-lg font-display w-6 md:w-8 text-right">
              {{ kps.toString().padStart(2, '0') }}
            </span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-text-dim text-[10px] font-display tracking-widest uppercase"
              >Rollover</span
            >
            <span class="text-[#FF00E6] text-sm md:text-lg font-display w-6 md:w-8 text-right">
              {{ maxRollover }}
            </span>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>
<style scoped>
/* Custom scrollbar */
::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}

::-webkit-scrollbar-track {
  background: var(--color-bg-deep);
}

::-webkit-scrollbar-thumb {
  background: var(--color-border-default);
  border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--color-accent-coral);
}

/* xs breakpoint helper */
@media (min-width: 400px) {
  .xs\:inline {
    display: inline;
  }
}
</style>
