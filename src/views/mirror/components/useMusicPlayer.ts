// Music player dùng Strudel generative music
// Load từ CDN với @vite-ignore — không thêm dependency vào package.json

const INTRO_MUSIC_CODE = `
await samples('github:tidalcycles/dirt-samples')

setcps(.5)

stack(
  note("<[d2 d3]*2 [c2 c3]*2 [a1 a2]*2 [g1 g2]*2>/2")
    .s("sawtooth")
    .lpf(sine.range(200, 600).slow(8))
    .gain(.55)
    .room(.3)
    .attack(.05)
    .release(.3),

  n("<[0 2 4 7] [4 2 0 ~] [2 4 7 9] [7 4 2 0]>*2")
    .scale("D4:minor:pentatonic")
    .s("triangle")
    .delay(.4)
    .room(.5)
    .gain(.45)
    .attack(.01)
    .decay(.2)
    .sustain(.3)
    .release(.4),

  note("<[d3,a3,f4] [c3,g3,e4] [a2,e3,c4] [g2,d3,bb3]>/2")
    .s("sawtooth")
    .lpf(sine.range(400, 1500).slow(16))
    .attack(.5)
    .release(.8)
    .sustain(.4)
    .gain(.2)
    .room(.7),

  n("<[~ 4] [~ 7] [~ 9] [~ 4]>")
    .scale("D5:minor:pentatonic")
    .s("sine")
    .delay(".5:.125:.6")
    .room(.7)
    .gain(.3)
    .attack(.01)
    .decay(.3)
    .sustain(.1)
    .release(.5),

  s("~ [rim ~] ~ rim")
    .gain(.3)
    .room(.4),

  s("hh*8")
    .gain(sine.range(.05, .18))
    .pan(sine.range(.3, .7).slow(4))
    .room(.3)
)
`

// Strudel CDN (không thêm vào package.json)
const STRUDEL_CDN = 'https://cdn.jsdelivr.net/npm/@strudel/web@1.3.0/dist/index.js'

let strudelReady = false
let strudelInitPromise: Promise<void> | null = null

interface StrudelModule {
  initStrudel: () => Promise<void>
  evaluate: (code: string, reset?: boolean) => Promise<void>
  hush: () => void
}

async function loadStrudel(): Promise<StrudelModule> {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).strudel) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolve((window as any).strudel)
      return
    }

    const script = document.createElement('script')
    script.src = STRUDEL_CDN
    script.onload = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((window as any).strudel) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolve((window as any).strudel)
      } else {
        reject(new Error('Strudel window object not found after load'))
      }
    }
    script.onerror = () => reject(new Error(`Failed to load Strudel from ${STRUDEL_CDN}`))
    document.body.appendChild(script)
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

export function useMusicPlayer(_track: 'intro' | 'hoa-chanh') {
  async function play(): Promise<void> {
    try {
      await initStrudel()
      const strudel = await loadStrudel()
      await strudel.evaluate(INTRO_MUSIC_CODE, true)
    } catch (e) {
      console.warn('Strudel music failed:', e)
    }
  }

  async function stop(): Promise<void> {
    try {
      const strudel = await loadStrudel()
      strudel.hush()
    } catch {
      // Bỏ qua nếu chưa khởi tạo
    }
  }

  return { play, stop }
}
