import { useEventListener } from '@vueuse/core'

const moveUrl = '/vchess/sounds/move.wav'
const captureUrl = '/vchess/sounds/capture.wav'

/**
 * Âm nước đi: Web Audio API (buffer + AudioContext).
 * `HTMLAudioElement.play()` sau `await` dài (AI suy nghĩ) thường bị autoplay chặn
 * vì user activation hết — cách này vẫn phát được sau worker trả nước.
 */
export function useVchessSounds() {
  let ctx: AudioContext | null = null
  let moveBuffer: AudioBuffer | null = null
  let captureBuffer: AudioBuffer | null = null
  let decodeOnce: Promise<void> | null = null

  function getContext(): AudioContext {
    if (!ctx) {
      ctx = new AudioContext()
    }
    return ctx
  }

  async function ensureDecoded(): Promise<void> {
    if (moveBuffer && captureBuffer) return
    if (!decodeOnce) {
      decodeOnce = (async () => {
        const c = getContext()
        const [mr, cr] = await Promise.all([fetch(moveUrl), fetch(captureUrl)])
        const [mab, cab] = await Promise.all([mr.arrayBuffer(), cr.arrayBuffer()])
        moveBuffer = await c.decodeAudioData(mab.slice(0))
        captureBuffer = await c.decodeAudioData(cab.slice(0))
      })()
    }
    await decodeOnce
  }

  if (typeof window !== 'undefined') {
    useEventListener(
      window,
      'pointerdown',
      () => {
        // Một số trình duyệt có thể tự suspend AudioContext sau thời gian idle.
        // Resume lại ở mọi lần tương tác để âm thanh nước đi không bị mất sau khi chờ lâu.
        const c = getContext()
        void c.resume()
        if (!moveBuffer || !captureBuffer) {
          void ensureDecoded()
        }
      },
      { passive: true },
    )
  }

  function playForMoveType(type: 'move' | 'capture' | 'flip') {
    // Phải gọi resume() đồng bộ trong cùng stack với tương tác (vd. click đi quân).
    // Watcher history gọi hàm này ngay khi mutate state → vẫn nằm trong handler click.
    // Nếu await trước rồi mới resume/start, gesture đã hết → không tiếng sau khi suy nghĩ lâu.
    const c = getContext()
    void c.resume()

    void (async () => {
      try {
        await ensureDecoded()
        const buffer = type === 'capture' ? captureBuffer : moveBuffer
        if (!buffer) return
        await c.resume()
        const src = c.createBufferSource()
        src.buffer = buffer
        src.connect(c.destination)
        src.start()
      } catch {
        /* decode / autoplay */
      }
    })()
  }

  return { playForMoveType }
}
