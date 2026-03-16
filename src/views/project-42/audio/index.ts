/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Project 42 - Audio Orchestrator (Core)
 */

import { loadTone } from './loader'
import { createInstruments } from './instruments'
import { updateAudioZones, stopArp, resetZonesState } from './zones'

let _Tone: any = null
let _instruments: any = null
let _initialized = false

export async function preloadAudio(): Promise<void> {
  await loadTone()
}

export async function initAudio(): Promise<boolean> {
  if (_initialized) return true

  try {
    _Tone = (window as any).Tone

    if (!_Tone) {
      console.warn('Tone.js not loaded.')
      return false
    }

    _instruments = createInstruments(_Tone)
    // Explicitly mute everything immediately after creation
    if (_instruments.masterVol) _instruments.masterVol.volume.value = -100
    _initialized = true
    return true
  } catch (err) {
    console.warn('Audio init failed.', err)
    return false
  }
}

let _lastTickTime = 0
let _lastProgress = -1

export function tickAudio(progress: number) {
  if (!_initialized || !_instruments || !_Tone) return

  const now = performance.now()
  if (now - _lastTickTime < 33) return
  _lastTickTime = now

  if (Math.abs(progress - _lastProgress) < 0.1) return
  _lastProgress = progress

  updateAudioZones(progress, _instruments, _Tone)
}

export function cleanupAudio() {
  if (_initialized && _Tone) {
    stopArp()
    resetZonesState(_instruments)
    _Tone.Transport.stop()
    _Tone.Transport.cancel()

    // Dispose all instruments to kill sound immediately
    if (_instruments) {
      Object.keys(_instruments).forEach((key) => {
        const inst = _instruments[key]
        if (inst && typeof inst.dispose === 'function') {
          try {
            inst.dispose()
          } catch {
            // Silently ignore disposal errors
          }
        }
      })
    }

    _initialized = false
    _instruments = null
    _Tone = null
    _lastProgress = -1
  }
}
