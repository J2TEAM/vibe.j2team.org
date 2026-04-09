import type { Track } from '../../stores/musicStore'

import lofi1 from './delosound-lofi-lofi-chill-405232.mp3'
import lofi2 from './delosound-lofi-chill-374877.mp3'
import lofi3 from './delosound-lofi-lofi-chill-3-398301.mp3'
import lofi4 from './tunetank-chill-lofi-347217.mp3'
import lofi5 from './lofi_hour-empty-mind-118973.mp3'

/** Chill / lofi tracks từ assets/lofi — phát full bài, không qua Deezer */
export const LOFI_TRACKS: Track[] = [
  { id: 'lofi-1', title: 'Chill Dev 1', artist: 'Delosound', source: 'lofi', preview: lofi1 },
  { id: 'lofi-2', title: 'Chill Dev 2', artist: 'Delosound', source: 'lofi', preview: lofi2 },
  { id: 'lofi-3', title: 'Chill Dev 3', artist: 'Delosound', source: 'lofi', preview: lofi3 },
  { id: 'lofi-4', title: 'Chill Lofi', artist: 'Tunetank', source: 'lofi', preview: lofi4 },
  { id: 'lofi-5', title: 'Empty Mind', artist: 'Lofi Hour', source: 'lofi', preview: lofi5 },
]
