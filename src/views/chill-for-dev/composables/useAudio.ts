export function useAudio(src: string | string[]) {
  const sources = Array.isArray(src) ? src : [src]
  const audio = new Audio(sources[0] || '')
  audio.loop = true

  let currentIndex = 0
  function tryNext() {
    currentIndex += 1
    if (currentIndex < sources.length && sources[currentIndex]) {
      audio.src = sources[currentIndex]
      audio.load()
    }
  }

  audio.addEventListener('error', tryNext)
  audio.addEventListener('canplaythrough', () => {
    audio.removeEventListener('error', tryNext)
  })

  function play() {
    audio.play().catch(() => {})
  }

  function pause() {
    audio.pause()
  }

  function setVolume(v: number) {
    audio.volume = Math.max(0, Math.min(1, v))
  }

  function setSrc(newSrc: string) {
    audio.src = newSrc
  }

  return { play, pause, volume: setVolume, setVolume: setVolume, setSrc }
}
