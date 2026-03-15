<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useSharedMusic } from '../composables/useSharedMusic'

const PLAYER_ID = 'vibe'
const { isPlaying: isPlayingMusic, onPlay, onStop } = useSharedMusic(PLAYER_ID)

const isMusicLoading = ref(false)
const STRUDEL_CDN = 'https://cdn.jsdelivr.net/npm/@strudel/web@1.3.0/dist/index.js'
let strudelReady = false
let strudelInitPromise: Promise<void> | null = null

interface StrudelInstance {
  initStrudel: () => Promise<void>
  evaluate: (code: string, silent: boolean) => Promise<void>
  hush: () => void
}

let strudelInstance: StrudelInstance | null = null

const VIBE_MUSIC_CODE = `
// Vibe Music - Upbeat Vibe
// Tempo: 100 BPM
await samples('github:tidalcycles/dirt-samples')
setcps(.5)

stack(
  // Bass - Driving
  note("<e2 e3 e2 e3 d2 d3 d2 d3 b1 b2 b1 b2 a1 a2 a1 a2>/2")
    .s("sawtooth")
    .lpf(sine.range(200, 600).slow(8))
    .gain(.5)
    .room(.3)
    .attack(.05)
    .release(.25),

  // Lead - Pentatonic
  n("<[0 2 4 7] [4 2 0 ~] [2 4 7 9] [7 4 2 0]>*2")
    .scale("E4:minor:pentatonic")
    .s("triangle")
    .delay(.35)
    .room(.5)
    .gain(.4)
    .attack(.01)
    .decay(.2)
    .sustain(.3)
    .release(.35),

  // Pad - Chords
  note("<[e3,a3,c4] [d3,b3,g3] [b2,e3,g3] [a2,c3,e3]>/2")
    .s("sawtooth")
    .lpf(sine.range(400, 1500).slow(16))
    .attack(.5)
    .release(.8)
    .sustain(.4)
    .gain(.18)
    .room(.65),

  // High - Melody
  n("<~ 4> <~ 7> <~ 9> <~ 4>")
    .scale("E5:minor:pentatonic")
    .s("sine")
    .delay(".4:.125:.5")
    .room(.6)
    .gain(.25)
    .attack(.01)
    .decay(.25)
    .sustain(.1)
    .release(.4),

  // Perc
  s("~ [rim ~] ~ rim")
    .delay(.2)
    .room(.5)
    .gain(.35)
)
`

async function loadStrudel(): Promise<StrudelInstance> {
  if (strudelInstance) {
    return strudelInstance
  }

  const win = window as unknown as { strudel?: StrudelInstance }
  if (win.strudel) {
    strudelInstance = win.strudel
    return strudelInstance
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = STRUDEL_CDN
    script.onload = () => {
      const w = window as unknown as { strudel?: StrudelInstance }
      if (w.strudel) {
        strudelInstance = w.strudel
        resolve(strudelInstance)
      }
    }
    script.onerror = () => reject(new Error('Failed to load Strudel'))
    document.head.appendChild(script)
  })
}

async function initStrudel(): Promise<void> {
  if (strudelReady) return
  if (strudelInitPromise) {
    await strudelInitPromise
    return
  }

  strudelInitPromise = (async () => {
    const strudel = await loadStrudel()
    await strudel.initStrudel()
    strudelReady = true
  })()

  await strudelInitPromise
}

const stopCurrentMusic = async () => {
  if (strudelInstance) {
    strudelInstance.hush()
  } else {
    const s = await loadStrudel()
    s?.hush()
  }
}

const toggleMusic = async () => {
  if (isMusicLoading.value) return

  try {
    if (isPlayingMusic.value) {
      await stopCurrentMusic()
      onStop()
    } else {
      isMusicLoading.value = true
      // Stop other music first
      window.dispatchEvent(new CustomEvent('stop-music', { detail: { except: PLAYER_ID } }))
      // Wait for other music to stop
      await new Promise((r) => setTimeout(r, 100))
      await initStrudel()
      const strudel = await loadStrudel()
      await strudel.evaluate(VIBE_MUSIC_CODE, true)
      onPlay()
      isMusicLoading.value = false
    }
  } catch (e) {
    console.warn('Music failed:', e)
    isMusicLoading.value = false
  }
}

// Listen for stop event from other players
const handleStopMusic = async (e: CustomEvent) => {
  if (e.detail.except !== PLAYER_ID && isPlayingMusic.value) {
    await stopCurrentMusic()
    onStop()
  }
}

onMounted(() => {
  window.addEventListener('stop-music', handleStopMusic as unknown as EventListener)
})

onUnmounted(() => {
  // Stop music when leaving page
  stopCurrentMusic()
  window.removeEventListener('stop-music', handleStopMusic as unknown as EventListener)
})
</script>

<template>
  <div class="chill-music vibe-music">
    <div class="music-top">
      <div class="music-header">
        <span class="music-icon">🎶</span>
        <span class="music-title">Vibe Music</span>
      </div>
      <button class="music-play-btn vibe-btn" @click="toggleMusic" :disabled="isMusicLoading">
        <svg
          v-if="isMusicLoading"
          class="loading-spinner"
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="32" />
        </svg>
        <svg
          v-else-if="isPlayingMusic"
          class="icon-pause"
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <rect x="6" y="4" width="4" height="16" />
          <rect x="14" y="4" width="4" height="16" />
        </svg>
        <svg
          v-else
          class="icon-play"
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <polygon points="5 3 19 12 5 21" />
        </svg>
      </button>
    </div>
    <div class="music-info">
      <span class="music-name">JViBeOS Vibe Mix</span>
      <a
        href="https://gachbong.yellowstudio.vn/"
        target="_blank"
        rel="noopener noreferrer"
        class="music-by"
      >
        Music by @gachbong/vn
      </a>
    </div>
  </div>
</template>

<style scoped>
.chill-music {
  margin-top: 16px;
  padding: 16px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 8px;
}

.vibe-music {
  background: linear-gradient(135deg, #1e1e2f 0%, #2d1b4e 100%);
}

.music-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.music-header {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.music-icon {
  font-size: 18px;
}

.music-title {
  font-size: 13px;
  font-weight: 600;
  color: #fff;
}

.music-play-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #7c3aed;
  border: none;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.2s;
  padding: 0;
}

.vibe-btn:hover:not(:disabled) {
  background: #6d28d9;
}

.music-play-btn:hover:not(:disabled) {
  background: #cc0000;
}

.music-play-btn:disabled {
  opacity: 0.7;
  cursor: wait;
}

.icon-play,
.icon-pause {
  position: relative;
  left: 1px;
}

.icon-pause {
  left: 0;
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.music-info {
  margin-top: 8px;
}

.music-name {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.music-by {
  display: block;
  font-size: 11px;
  color: #888;
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
}

.music-by:hover {
  color: #ff0000;
}
</style>
