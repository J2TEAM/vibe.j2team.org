import { ref } from 'vue'
import type { TripPlan } from '../types'

export function useShare() {
  const exporting = ref(false)
  const sharing = ref(false)

  async function exportImage(el: HTMLElement, name: string): Promise<void> {
    if (exporting.value) return
    exporting.value = true
    try {
      const { toPng } = await import('html-to-image')
      const dataUrl = await toPng(el, {
        backgroundColor: '#0F1923',
        pixelRatio: 2,
      })
      const link = document.createElement('a')
      link.download = `${name.replace(/\s+/g, '-').toLowerCase()}.png`
      link.href = dataUrl
      link.click()
    } finally {
      exporting.value = false
    }
  }

  async function copyShareLink(trip: TripPlan): Promise<boolean> {
    sharing.value = true
    try {
      const json = JSON.stringify(trip)
      const encoded = btoa(unescape(encodeURIComponent(json)))
      const url = `${window.location.origin}${window.location.pathname}#share=${encoded}`

      if (url.length > 8000) {
        await navigator.clipboard.writeText(encoded)
        return false
      }

      await navigator.clipboard.writeText(url)
      return true
    } finally {
      sharing.value = false
    }
  }

  function getSharedTrip(): TripPlan | null {
    const hash = window.location.hash
    if (!hash.startsWith('#share=')) return null
    try {
      const encoded = hash.slice(7)
      const json = decodeURIComponent(escape(atob(encoded)))
      const trip = JSON.parse(json) as TripPlan
      window.location.hash = ''
      return trip
    } catch {
      return null
    }
  }

  return { exporting, sharing, exportImage, copyShareLink, getSharedTrip }
}
