import { ref } from 'vue'

export type FuelId = 'ron95' | 'e5' | 'diesel'

export interface LiveFuelPrice {
  id: FuelId
  pricePerLiter: number
  changeText: string
}

const API_SOURCE = 'https://vnexpress.net/chu-de/gia-xang-dau-3026'
const PROXY_URL = `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(API_SOURCE)}`

const FALLBACK_PRICES: LiveFuelPrice[] = [
  { id: 'ron95', pricePerLiter: 20826, changeText: '' },
  { id: 'e5', pricePerLiter: 19540, changeText: '' },
  { id: 'diesel', pricePerLiter: 17990, changeText: '' },
]

function parseVnd(raw: string): number {
  const digits = raw.replace(/[^\d]/g, '')
  return digits ? parseInt(digits, 10) : 0
}

function mapRowToFuelId(name: string): FuelId | null {
  const n = name.toLowerCase()
  if (n.includes('95')) return 'ron95'
  if (n.includes('e5') || n.includes('92')) return 'e5'
  if (n.includes('diesel') || n.includes('dầu') || n.includes('dau')) return 'diesel'
  return null
}

export function useFuelRetailPrices() {
  const prices = ref<LiveFuelPrice[]>(FALLBACK_PRICES.map((p) => ({ ...p })))
  const isLoading = ref(false)
  const isUsingFallback = ref(true)
  const lastUpdated = ref('')
  const errorMsg = ref('')

  async function fetchPrices() {
    isLoading.value = true
    errorMsg.value = ''

    try {
      const res = await fetch(PROXY_URL)
      if (!res.ok) throw new Error(`Proxy error ${res.status}`)
      const html = await res.text()
      if (!html) throw new Error('Proxy trả về nội dung rỗng')

      const doc = new DOMParser().parseFromString(html, 'text/html')
      const table = doc.querySelector('table')
      if (!table) throw new Error('Không tìm thấy bảng giá')

      const rows = table.querySelectorAll('tr')
      const parsed = new Map<FuelId, LiveFuelPrice>()

      const headerRow = rows[0]
      if (headerRow) {
        const priceHeader = headerRow.querySelectorAll('th, td')[1]?.textContent ?? ''
        const timeMatch = priceHeader.match(/(\d{1,2}h\s+\d{1,2}\/\d{1,2}\/\d{4})/)
        lastUpdated.value = timeMatch?.[1] ?? new Date().toLocaleString('vi-VN')
      }

      rows.forEach((row, idx) => {
        if (idx === 0) return
        const tds = row.querySelectorAll('td')
        if (tds.length < 2) return
        const name = tds[0]?.textContent?.trim() ?? ''
        const priceRaw = tds[1]?.textContent?.trim() ?? ''
        const change = tds[2]?.textContent?.trim() ?? ''
        const id = mapRowToFuelId(name)
        if (!id || !priceRaw || !/\d/.test(priceRaw)) return
        const pricePerLiter = parseVnd(priceRaw)
        if (pricePerLiter > 0 && !parsed.has(id)) {
          parsed.set(id, { id, pricePerLiter, changeText: change })
        }
      })

      if (parsed.size === 0) throw new Error('Không parse được giá nào')

      prices.value = FALLBACK_PRICES.map((fb) => parsed.get(fb.id) ?? { ...fb })
      isUsingFallback.value = false
      if (!lastUpdated.value) lastUpdated.value = new Date().toLocaleString('vi-VN')
    } catch (err: unknown) {
      errorMsg.value = err instanceof Error ? err.message : 'Lỗi không xác định'
      prices.value = FALLBACK_PRICES.map((p) => ({ ...p }))
      isUsingFallback.value = true
      lastUpdated.value = `${new Date().toLocaleString('vi-VN')} · mẫu`
    } finally {
      isLoading.value = false
    }
  }

  return { prices, isLoading, isUsingFallback, lastUpdated, errorMsg, fetchPrices }
}
