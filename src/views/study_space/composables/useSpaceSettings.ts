import { useLocalStorage } from '@vueuse/core'

export interface SpaceSettings {
  // Visibility
  showClock: boolean
  showDate: boolean
  showQuote: boolean
  showScenePicker: boolean
  showPomodoro: boolean
  showTodo: boolean
  showMusic: boolean
  showNotes: boolean
  // Zen mode — hides all UI
  zenMode: boolean
  // Video overlay darkness (0–80)
  overlayOpacity: number
}

const defaults: SpaceSettings = {
  showClock: true,
  showDate: true,
  showQuote: true,
  showScenePicker: true,
  showPomodoro: true,
  showTodo: true,
  showMusic: true,
  showNotes: true,
  zenMode: false,
  overlayOpacity: 40,
}

export function useSpaceSettings() {
  return useLocalStorage<SpaceSettings>('study-space-settings', defaults, {
    mergeDefaults: true,
  })
}
