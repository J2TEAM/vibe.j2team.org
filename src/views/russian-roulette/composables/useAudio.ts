import pumpSoundFile from '../assets/fortnite-pump-shotgun.mp3'
import outOfAmmoSoundFile from '../assets/outofammo.wav'
import reloadingSoundFile from '../assets/reloading.mp3'
import defibrillatorSoundFile from '../assets/defibrillator.mp3'
import introBgFile from '../assets/intro.mp3'

// --- Âm thanh vật phẩm ---
import smokingSoundFile from '../assets/smoking.mp3'
import beerSoundFile from '../assets/beer.mp3'
import glassSoundFile from '../assets/glass.mp3'
import handcuffsSoundFile from '../assets/handcuffs.mp3'
import sawingSoundFile from '../assets/sawing.wav'
import superShotgun from '../assets/shotgunnnnn.mp3'

// --- Kiểu dữ liệu trả về cho AudioController ---
export interface AudioController {
  playPump: () => Promise<void>
  playOutOfAmmo: () => Promise<void>
  playReloading: () => Promise<void>
  playDefibrillator: () => Promise<void>
  playIntroBgm: () => Promise<void>
  stopBgm: () => void
  setSfxVolume: (volume: number) => void
  toggleSfx: (enabled: boolean) => void
  warmUp: () => Promise<void>
  dispose: () => void
  // Âm thanh vật phẩm
  playCigarette: () => Promise<void>
  playBeer: () => Promise<void>
  playGlass: () => Promise<void>
  playCuffs: () => Promise<void>
  playSaw: () => Promise<void>
  playSuperShotgun: () => Promise<void>
}

// --- Factory function tạo AudioController (tham khảo pikachu-game) ---
export function createAudioController(): AudioController {
  let audioContext: AudioContext | null = null

  // Cache dữ liệu thô (ArrayBuffer) đã fetch
  const rawDataCache: Record<string, ArrayBuffer> = {}
  // Cache AudioBuffer đã decode
  const decodedCache: Record<string, AudioBuffer> = {}

  let bgmSource: AudioBufferSourceNode | null = null
  let bgmGain: GainNode | null = null
  let isSfxEnabled = true
  let currentSfxVolume = 1.0

  // --- Khởi tạo / lấy AudioContext ---
  function getAudioContext(): AudioContext | null {
    if (typeof AudioContext === 'undefined') return null

    if (!audioContext) {
      audioContext = new AudioContext()
    }

    if (audioContext.state === 'suspended') {
      void audioContext.resume()
    }

    return audioContext
  }

  // --- Fetch file âm thanh (chỉ tải, chưa decode) ---
  async function fetchAudioData(src: string): Promise<ArrayBuffer | null> {
    if (rawDataCache[src]) return rawDataCache[src]

    try {
      const response = await fetch(src)
      const arrayBuffer = await response.arrayBuffer()
      rawDataCache[src] = arrayBuffer
      return arrayBuffer
    } catch (error) {
      console.warn('Lỗi khi tải file âm thanh:', src, error)
      return null
    }
  }

  // --- Decode ArrayBuffer thành AudioBuffer (chỉ decode 1 lần) ---
  async function decodeAudio(src: string): Promise<AudioBuffer | null> {
    if (decodedCache[src]) return decodedCache[src]

    const ctx = getAudioContext()
    if (!ctx) return null

    let rawData = rawDataCache[src]
    if (!rawData) {
      rawData = (await fetchAudioData(src)) as ArrayBuffer
    }
    if (!rawData) return null

    try {
      // Phải copy vì decodeAudioData sẽ detach ArrayBuffer gốc
      const copy = rawData.slice(0)
      const audioBuffer = await ctx.decodeAudioData(copy)
      decodedCache[src] = audioBuffer
      return audioBuffer
    } catch (error) {
      console.warn('Lỗi khi decode âm thanh:', src, error)
      return null
    }
  }

  // --- Preload: fetch tất cả file trước (an toàn, không cần user interaction) ---
  function preloadAll(): void {
    fetchAudioData(pumpSoundFile)
    fetchAudioData(outOfAmmoSoundFile)
    fetchAudioData(reloadingSoundFile)
    fetchAudioData(defibrillatorSoundFile)
    fetchAudioData(introBgFile)
    // Preload âm thanh vật phẩm
    fetchAudioData(smokingSoundFile)
    fetchAudioData(beerSoundFile)
    fetchAudioData(glassSoundFile)
    fetchAudioData(handcuffsSoundFile)
    fetchAudioData(sawingSoundFile)
    fetchAudioData(superShotgun)
  }

  preloadAll()

  // --- Warm up: decode tất cả buffer sẵn (gọi sau khi user tương tác lần đầu) ---
  async function warmUp(): Promise<void> {
    await Promise.all([
      decodeAudio(pumpSoundFile),
      decodeAudio(outOfAmmoSoundFile),
      decodeAudio(reloadingSoundFile),
      decodeAudio(defibrillatorSoundFile),
      // Decode sẵn âm thanh vật phẩm
      decodeAudio(smokingSoundFile),
      decodeAudio(beerSoundFile),
      decodeAudio(glassSoundFile),
      decodeAudio(handcuffsSoundFile),
      decodeAudio(sawingSoundFile),
      decodeAudio(superShotgun),
    ])
  }

  // --- Điều khiển BGM và Volume ---

  function toggleSfx(enabled: boolean) {
    isSfxEnabled = enabled
  }

  async function playIntroBgm() {
    stopBgm()
    const ctx = getAudioContext()
    if (!ctx) return

    const buffer = await decodeAudio(introBgFile)
    if (!buffer) return

    bgmSource = ctx.createBufferSource()
    bgmGain = ctx.createGain()

    bgmSource.buffer = buffer
    bgmSource.loop = true
    // Sử dụng âm lượng mặc định 0.5 vì phần cài đặt đã bị gỡ bỏ
    bgmGain.gain.setValueAtTime(0.5, ctx.currentTime)

    bgmSource.connect(bgmGain)
    bgmGain.connect(ctx.destination)
    bgmSource.start(0)
  }

  function stopBgm() {
    if (bgmSource) {
      try {
        bgmSource.stop()
      } catch {}
      bgmSource.disconnect()
      bgmSource = null
    }
    if (bgmGain) {
      bgmGain.disconnect()
      bgmGain = null
    }
  }

  // volume nhận vào dạng 0-100
  function setSfxVolume(volume: number) {
    currentSfxVolume = Math.max(0, Math.min(1, volume / 100))
  }

  // --- Phát âm thanh từ AudioBuffer qua Web Audio API ---
  async function playSfx(src: string): Promise<void> {
    if (!isSfxEnabled || currentSfxVolume <= 0) return
    const ctx = getAudioContext()
    if (!ctx) return

    const buffer = await decodeAudio(src)
    if (!buffer) return

    const source = ctx.createBufferSource()
    const gainNode = ctx.createGain()

    // Điều chỉnh âm lượng theo state hiện tại
    gainNode.gain.setValueAtTime(currentSfxVolume, ctx.currentTime)

    source.buffer = buffer
    source.connect(gainNode)
    gainNode.connect(ctx.destination)
    source.start(0)
  }

  // --- Các hàm phát từng loại âm thanh ---
  function playPump(): Promise<void> {
    return playSfx(pumpSoundFile)
  }

  function playOutOfAmmo(): Promise<void> {
    return playSfx(outOfAmmoSoundFile)
  }

  function playReloading(): Promise<void> {
    return playSfx(reloadingSoundFile)
  }

  function playDefibrillator(): Promise<void> {
    return playSfx(defibrillatorSoundFile)
  }

  // --- Âm thanh vật phẩm ---
  function playCigarette(): Promise<void> {
    return playSfx(smokingSoundFile)
  }

  function playBeer(): Promise<void> {
    return playSfx(beerSoundFile)
  }

  function playGlass(): Promise<void> {
    return playSfx(glassSoundFile)
  }

  function playCuffs(): Promise<void> {
    return playSfx(handcuffsSoundFile)
  }

  function playSaw(): Promise<void> {
    return playSfx(sawingSoundFile)
  }

  function playSuperShotgun(): Promise<void> {
    return playSfx(superShotgun)
  }

  // --- Dọn dẹp tài nguyên khi không cần nữa ---
  function dispose(): void {
    stopBgm()
    if (audioContext) {
      void audioContext.close()
      audioContext = null
    }
  }

  return {
    playPump,
    playOutOfAmmo,
    playReloading,
    playDefibrillator,
    playIntroBgm,
    stopBgm,
    setSfxVolume,
    toggleSfx,
    warmUp,
    dispose,
    // Âm thanh vật phẩm
    playCigarette,
    playBeer,
    playGlass,
    playCuffs,
    playSaw,
    playSuperShotgun,
  }
}
