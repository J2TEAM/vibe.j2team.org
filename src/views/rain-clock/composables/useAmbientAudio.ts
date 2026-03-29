import type { Ref } from 'vue'
import { computed, ref, watch } from 'vue'

export type AmbientPreset = 'deep-focus' | 'storm' | 'soft-night'

interface AudioNodes {
  master: GainNode
  rainGain: GainNode
  windGain: GainNode
  rainSource: AudioBufferSourceNode
  windSource: AudioBufferSourceNode
}

function createNoiseSource(context: AudioContext) {
  const bufferSize = context.sampleRate * 4
  const buffer = context.createBuffer(1, bufferSize, context.sampleRate)
  const data = buffer.getChannelData(0)

  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1
  }

  const source = context.createBufferSource()
  source.buffer = buffer
  source.loop = true
  return source
}

export function useAmbientAudio(rainIntensity: Ref<number>) {
  const isSoundOn = ref(false)
  const rainLevel = ref(0.72)
  const windLevel = ref(0.24)
  const preset = ref<AmbientPreset>('deep-focus')

  const AudioContextCtor =
    typeof window !== 'undefined'
      ? (window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext ?? null)
      : null

  const isSupported = !!AudioContextCtor

  let audioCtx: AudioContext | null = null
  let nodes: AudioNodes | null = null

  const rainVolumeText = computed(() => `${Math.round(rainLevel.value * 100)}%`)
  const windVolumeText = computed(() => `${Math.round(windLevel.value * 100)}%`)

  function ensureAudio() {
    if (!AudioContextCtor) return false
    if (audioCtx && nodes) return true

    audioCtx = new AudioContextCtor()

    const master = audioCtx.createGain()
    master.gain.value = 0.7
    master.connect(audioCtx.destination)

    const rainSource = createNoiseSource(audioCtx)
    const rainHighpass = audioCtx.createBiquadFilter()
    rainHighpass.type = 'highpass'
    rainHighpass.frequency.value = 950

    const rainLowpass = audioCtx.createBiquadFilter()
    rainLowpass.type = 'lowpass'
    rainLowpass.frequency.value = 7600

    const rainGainNode = audioCtx.createGain()
    rainGainNode.gain.value = 0

    rainSource.connect(rainHighpass)
    rainHighpass.connect(rainLowpass)
    rainLowpass.connect(rainGainNode)
    rainGainNode.connect(master)

    const windSource = createNoiseSource(audioCtx)
    const windLowpass = audioCtx.createBiquadFilter()
    windLowpass.type = 'lowpass'
    windLowpass.frequency.value = 520

    const windGainNode = audioCtx.createGain()
    windGainNode.gain.value = 0

    windSource.connect(windLowpass)
    windLowpass.connect(windGainNode)
    windGainNode.connect(master)

    rainSource.start()
    windSource.start()
    nodes = {
      master,
      rainGain: rainGainNode,
      windGain: windGainNode,
      rainSource,
      windSource,
    }

    return true
  }

  function updateGains() {
    if (!audioCtx || !nodes) return

    const rainBoostByIntensity = 0.45 + (rainIntensity.value / 8) * 0.55
    const nextRain = isSoundOn.value ? rainLevel.value * rainBoostByIntensity * 0.52 : 0
    const nextWind = isSoundOn.value ? windLevel.value * 0.35 : 0

    nodes.rainGain.gain.setTargetAtTime(nextRain, audioCtx.currentTime, 0.35)
    nodes.windGain.gain.setTargetAtTime(nextWind, audioCtx.currentTime, 0.35)
  }

  async function toggleSound() {
    if (!isSupported) {
      isSoundOn.value = !isSoundOn.value
      return
    }

    const ready = ensureAudio()
    if (!ready || !audioCtx) return

    if (audioCtx.state === 'suspended') {
      await audioCtx.resume()
    }

    isSoundOn.value = !isSoundOn.value
    updateGains()
  }

  function setRainLevel(value: number) {
    rainLevel.value = Math.max(0, Math.min(1, value))
  }

  function setWindLevel(value: number) {
    windLevel.value = Math.max(0, Math.min(1, value))
  }

  function applyPreset(nextPreset: AmbientPreset) {
    preset.value = nextPreset

    if (nextPreset === 'deep-focus') {
      rainLevel.value = 0.72
      windLevel.value = 0.24
      return
    }

    if (nextPreset === 'storm') {
      rainLevel.value = 0.95
      windLevel.value = 0.6
      return
    }

    rainLevel.value = 0.42
    windLevel.value = 0.12
  }

  async function shutdownAudio() {
    if (!audioCtx) return
    await audioCtx.close()
    audioCtx = null
    nodes = null
    isSoundOn.value = false
  }

  watch([rainLevel, windLevel, rainIntensity], updateGains)

  return {
    isSupported,
    isSoundOn,
    rainLevel,
    windLevel,
    preset,
    rainVolumeText,
    windVolumeText,
    setRainLevel,
    setWindLevel,
    toggleSound,
    applyPreset,
    shutdownAudio,
  }
}
