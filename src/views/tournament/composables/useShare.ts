import { toPng } from 'html-to-image'
import { useClipboard } from '@vueuse/core'
import { ref } from 'vue'
import type { Tournament } from '../types'

export function useShare() {
  const exporting = ref(false)
  const sharing = ref(false)
  const { copy } = useClipboard()

  async function exportImage(el: HTMLElement, tournamentName: string): Promise<void> {
    if (exporting.value) return
    exporting.value = true
    try {
      const dataUrl = await toPng(el, {
        backgroundColor: '#0F1923',
        pixelRatio: 2,
      })
      const link = document.createElement('a')
      link.download = `${tournamentName.replace(/\s+/g, '-').toLowerCase()}.png`
      link.href = dataUrl
      link.click()
    } finally {
      exporting.value = false
    }
  }

  function encodeTournament(tournament: Tournament): string {
    const json = JSON.stringify(tournament)
    return btoa(unescape(encodeURIComponent(json)))
  }

  function decodeTournament(encoded: string): Tournament | null {
    try {
      const json = decodeURIComponent(escape(atob(encoded)))
      return JSON.parse(json) as Tournament
    } catch {
      return null
    }
  }

  async function copyShareLink(tournament: Tournament): Promise<boolean> {
    sharing.value = true
    try {
      const encoded = encodeTournament(tournament)
      const url = `${window.location.origin}${window.location.pathname}#share=${encoded}`

      if (url.length > 8000) {
        await copy(encoded)
        return false
      }

      await copy(url)
      return true
    } finally {
      sharing.value = false
    }
  }

  function getSharedTournament(): Tournament | null {
    const hash = window.location.hash
    if (!hash.startsWith('#share=')) return null
    const encoded = hash.slice(7)
    const tournament = decodeTournament(encoded)
    if (tournament) {
      window.location.hash = ''
    }
    return tournament
  }

  return {
    exporting,
    sharing,
    exportImage,
    copyShareLink,
    getSharedTournament,
  }
}
