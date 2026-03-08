/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Project 42 - Audio Orchestrator (Core)
 */

import { loadTone } from "./loader";
import { createInstruments } from "./instruments";
import { updateAudioZones } from "./zones";

let _Tone: any = null;
let _instruments: any = null;
let _initialized = false;

/**
 * Preload Tone.js CDN - Early load without starting AudioContext
 */
export async function preloadAudio(): Promise<void> {
  await loadTone();
}

/**
 * Initialize instruments - Called after user gesture resolves Tone.start()
 */
export async function initAudio(): Promise<boolean> {
  if (_initialized) return true;

  try {
    _Tone = (window as any).Tone;

    if (!_Tone) {
      console.warn("Tone.js not loaded.");
      return false;
    }

    // Instrument construction - Context activation handled by UI gateway
    _instruments = createInstruments(_Tone);
    _initialized = true;
    return true;
  } catch (err) {
    console.warn("Audio init failed.", err);
    return false;
  }
}

let _lastTickTime = 0;
let _lastProgress = -1;

export function tickAudio(progress: number) {
  if (!_initialized || !_instruments || !_Tone) return;

  // 1. Temporal Throttle — max 30 times/sec (~33ms)
  const now = performance.now();
  if (now - _lastTickTime < 33) return;
  _lastTickTime = now;

  // 2. Delta Guard — ignore tiny movements or reactivity duplicates
  if (Math.abs(progress - _lastProgress) < 0.1) return;
  _lastProgress = progress;

  updateAudioZones(progress, _instruments, _Tone);
}

export function cleanupAudio() {
  if (_initialized && _Tone) {
    _Tone.Transport.stop();
    _initialized = false;
    _instruments = null;
    _Tone = null;
  }
}
