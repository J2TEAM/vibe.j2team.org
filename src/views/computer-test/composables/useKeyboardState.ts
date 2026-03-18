import { ref, reactive, computed, onMounted, onUnmounted, type Ref } from 'vue'

export type KeyStatus = 'idle' | 'active' | 'pressed'

export function useKeyboardState(soundEnabled?: Ref<boolean>) {
  const keyStates = reactive<Record<string, KeyStatus>>({})
  const pressCount = ref(0)
  const activeKeys = ref<string[]>([])
  const lastKeyCode = ref('')
  const mostPressed = ref({ code: '', label: '', count: 0 })
  const pressFrequency = reactive<Record<string, number>>({})
  const keyHistory = ref<{ code: string; label: string; id: number }[]>([])
  let historyId = 0
  let audioCtx: AudioContext | null = null

  // Performance Monitor
  const cpsHistory = ref<number[]>(Array.from({ length: 60 }).fill(0) as number[])
  const currentCps = ref(0)
  const currentApm = computed(() => currentCps.value * 60)
  let pressesInCurrentSecond = 0
  let performanceInterval: ReturnType<typeof setInterval> | null = null

  // Track last interval
  const lastPressTime = ref(0)
  const lastInterval = ref(0)

  function handleContextMenu(e: Event) {
    e.preventDefault()
  }

  function handleKeyDown(e: KeyboardEvent) {
    const code = e.code

    // We block ALL keys, including F5, F12, Windows, Menu, Alt, Tab, etc.
    // However, some keys like the Windows (Meta) key cannot be completely
    // stopped from opening the OS start menu by browsers due to security.
    // We still call preventDefault on everything to try our best.
    e.preventDefault()
    e.stopPropagation()

    lastKeyCode.value = code

    const playClick = () => {
      if (!soundEnabled?.value) return
      try {
        if (!audioCtx) {
          const ACtx =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
          audioCtx = new ACtx()
        }
        if (audioCtx.state === 'suspended') {
          audioCtx.resume()
        }

        const osc = audioCtx.createOscillator()
        const gain = audioCtx.createGain()
        const filter = audioCtx.createBiquadFilter()

        osc.type = 'square'
        osc.frequency.setValueAtTime(150, audioCtx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.03)

        filter.type = 'lowpass'
        filter.frequency.setValueAtTime(1000, audioCtx.currentTime)

        gain.gain.setValueAtTime(0.5, audioCtx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.03)

        osc.connect(filter)
        filter.connect(gain)
        gain.connect(audioCtx.destination)

        osc.start()
        osc.stop(audioCtx.currentTime + 0.03)
      } catch {
        // ignore
      }
    }

    if (keyStates[code] !== 'active') {
      playClick()
      keyStates[code] = 'active'
      if (!activeKeys.value.includes(code)) {
        activeKeys.value.push(code)
      }

      keyHistory.value.unshift({
        code,
        label: e.key === ' ' ? 'Space' : e.key,
        id: historyId++,
      })
      if (keyHistory.value.length > 25) {
        keyHistory.value.pop()
      }

      pressesInCurrentSecond++
      pressCount.value++
      pressFrequency[code] = (pressFrequency[code] || 0) + 1

      if (pressFrequency[code] > mostPressed.value.count) {
        mostPressed.value = {
          code,
          label: e.key === ' ' ? 'Space' : e.key,
          count: pressFrequency[code],
        }
      }

      const now = performance.now()
      if (lastPressTime.value > 0) {
        lastInterval.value = Number((now - lastPressTime.value).toFixed(1))
      }
      lastPressTime.value = now
    }
  }

  function handleKeyUp(e: KeyboardEvent) {
    const code = e.code
    keyStates[code] = 'pressed'
    activeKeys.value = activeKeys.value.filter((k) => k !== code)
  }

  function reset() {
    Object.keys(keyStates).forEach((key) => {
      keyStates[key] = 'idle'
    })
    pressCount.value = 0
    activeKeys.value = []
    lastKeyCode.value = ''
    mostPressed.value = { code: '', label: '', count: 0 }
    keyHistory.value = []
    historyId = 0

    // Reset performance
    pressesInCurrentSecond = 0
    currentCps.value = 0
    cpsHistory.value = Array.from({ length: 60 }).fill(0) as number[]
    lastInterval.value = 0
    lastPressTime.value = 0
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('contextmenu', handleContextMenu)
    // Also handle blur to clear active keys if user switches window
    window.addEventListener('blur', () => {
      activeKeys.value.forEach((code) => {
        keyStates[code] = 'pressed'
      })
      activeKeys.value = []
    })

    performanceInterval = setInterval(() => {
      const cps = pressesInCurrentSecond
      pressesInCurrentSecond = 0
      currentCps.value = cps

      const newHistory = [...cpsHistory.value.slice(1), cps]
      cpsHistory.value = newHistory
    }, 1000)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
    window.removeEventListener('keyup', handleKeyUp)
    window.removeEventListener('contextmenu', handleContextMenu)
    if (performanceInterval) clearInterval(performanceInterval)
  })

  return {
    keyStates,
    pressCount,
    activeKeys,
    lastKeyCode,
    mostPressed,
    lastInterval,
    keyHistory,
    currentCps,
    currentApm,
    cpsHistory,
    reset,
  }
}
