// Lucide icon names for consistent usage across all game components
// Usage: <Icon :icon="TRACK_LUCIDE[key]" class="w-4 h-4" />

const _TRACK_LUCIDE = {
  nature: 'lucide:leaf',
  human: 'lucide:users',
  economy: 'lucide:coins',
  digital: 'lucide:monitor',
} as const

/** Safe lookup — always returns a string (falls back to lucide:circle) */
export function trackIcon(key: string): string {
  return _TRACK_LUCIDE[key as keyof typeof _TRACK_LUCIDE] ?? 'lucide:circle'
}

// Re-export as object for destructured/known-key access
export const TRACK_LUCIDE = _TRACK_LUCIDE

export const DERIVED_LUCIDE = {
  harmony: 'lucide:scale',
  sustainability: 'lucide:sprout',
  connection: 'lucide:link',
} as const

export const RESOURCE_LUCIDE = {
  budget: 'lucide:wallet',
  energy: 'lucide:zap',
  food: 'lucide:wheat',
  materials: 'lucide:hammer',
  knowledge: 'lucide:book-open',
} as const

export const EVENT_LUCIDE = {
  opportunity: 'lucide:sun',
  challenge: 'lucide:cloud-rain',
} as const

export const UI_LUCIDE = {
  close: 'lucide:x',
  pause: 'lucide:pause',
  play: 'lucide:play',
  info: 'lucide:info',
  add: 'lucide:plus',
  lock: 'lucide:lock',
  unlock: 'lucide:lock-open',
  map: 'lucide:map',
  shuffle: 'lucide:shuffle',
  chart: 'lucide:bar-chart-2',
  upkeep: 'lucide:repeat',
} as const
