import { ref, computed } from 'vue'
import { useTimeoutFn } from '@vueuse/core'

interface SpotlightProduct {
  name: string
  tagline: string
  logo_url: string
  votes_count: number
  url: string
}

const CACHE_KEY = 'vibe-spotlight-product'
const DISMISS_KEY = 'vibe-spotlight-dismissed'
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const SHOW_DELAY = 3000 // 3 seconds

export function useSpotlightProduct() {
  const product = ref<SpotlightProduct | null>(null)
  const dismissed = ref(sessionStorage.getItem(DISMISS_KEY) === 'true')
  const delayPassed = ref(false)

  const visible = computed(() => !dismissed.value && product.value !== null && delayPassed.value)

  function dismiss() {
    dismissed.value = true
    sessionStorage.setItem(DISMISS_KEY, 'true')
  }

  async function fetchProduct() {
    if (dismissed.value) return

    // Check cache
    const cached = sessionStorage.getItem(CACHE_KEY)
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached)
        if (Date.now() - timestamp < CACHE_TTL) {
          product.value = data
          return
        }
      } catch {
        // ignore invalid cache
      }
    }

    try {
      const res = await fetch('https://launch.j2team.dev/api/spotlight/random')
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      const data = json.data as SpotlightProduct
      if (!data?.name || !data?.url) throw new Error('Invalid data')

      product.value = data
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }))
    } catch {
      // Silently fail — widget simply won't show
    }
  }

  // Start delay timer
  useTimeoutFn(() => {
    delayPassed.value = true
  }, SHOW_DELAY)

  // Fetch immediately
  fetchProduct()

  return { product, visible, dismiss }
}
