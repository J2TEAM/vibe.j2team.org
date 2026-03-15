import { ref } from 'vue'

// Shared state between music players
export const currentPlayingId = ref<string | null>(null)

export function useSharedMusic(playerId: string) {
  const isPlaying = ref(false)

  const onPlay = () => {
    // If another player is playing, stop it
    if (currentPlayingId.value && currentPlayingId.value !== playerId) {
      // Dispatch custom event to stop other players
      window.dispatchEvent(new CustomEvent('stop-music', { detail: { except: playerId } }))
    }
    currentPlayingId.value = playerId
    isPlaying.value = true
  }

  const onStop = () => {
    isPlaying.value = false
    if (currentPlayingId.value === playerId) {
      currentPlayingId.value = null
    }
  }

  return { isPlaying, onPlay, onStop }
}
