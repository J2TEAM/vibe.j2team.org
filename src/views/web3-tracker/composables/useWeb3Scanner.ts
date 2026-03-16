import { ref } from 'vue'
import type { WalletStats, TokenAsset } from '../types'

export const networksInfo = [
  {
    name: 'Ethereum',
    id: 'eth',
    chainId: '0x1',
    icon: 'logos:ethereum',
    color: '#627EEA',
    native: 'ETH',
    cgId: 'ethereum',
  },
  {
    name: 'BSC',
    id: 'bsc',
    chainId: '0x38',
    icon: 'simple-icons:binance',
    color: '#F3BA2F',
    native: 'BNB',
    cgId: 'binancecoin',
  },
  {
    name: 'Polygon',
    id: 'polygon',
    chainId: '0x89',
    icon: 'cryptocurrency-color:matic',
    color: '#8247E5',
    native: 'POL',
    cgId: 'matic-network',
  },
  {
    name: 'Arbitrum One',
    id: 'arb',
    chainId: '0xa4b1',
    icon: 'logos:arbitrum-icon',
    color: '#28A0F0',
    native: 'ETH',
    cgId: 'ethereum',
  },
  {
    name: 'Base',
    id: 'base',
    chainId: '0x2105',
    icon: 'logos:base',
    color: '#0052FF',
    native: 'ETH',
    cgId: 'ethereum',
  },
  {
    name: 'Optimism',
    id: 'op',
    chainId: '0xa',
    icon: 'logos:optimism-icon',
    color: '#FF0420',
    native: 'ETH',
    cgId: 'ethereum',
  },
  {
    name: 'Linea',
    id: 'linea',
    chainId: '0xe708',
    icon: 'logos:linea-icon',
    color: '#121212',
    native: 'ETH',
    cgId: 'ethereum',
  },
  {
    name: 'Avalanche',
    id: 'avalanche',
    chainId: '0xa86a',
    icon: 'logos:avalanche-icon',
    color: '#E84142',
    native: 'AVAX',
    cgId: 'avalanche-2',
  },
  {
    name: 'Fantom',
    id: 'fantom',
    chainId: '0xfa',
    icon: 'logos:fantom-icon',
    color: '#1969FF',
    native: 'FTM',
    cgId: 'fantom',
  },
]

export function useWeb3Scanner() {
  const isScanning = ref(false)
  const stats = ref<WalletStats | null>(null)
  const error = ref('')
  const scanProgress = ref(0)
  const currentScanningNet = ref('')
  const networkStatuses = ref<Record<string, 'pending' | 'scanning' | 'done' | 'error'>>({})

  // API Key Management from LocalStorage
  const moralisApiKey = ref(localStorage.getItem('vibe_moralis_api_key') || '')
  const usageStats = ref({
    limit: 0,
    remaining: 0,
    estimatedScans: 0,
  })

  const updateApiKey = (key: string) => {
    const cleanKey = key.trim()
    moralisApiKey.value = cleanKey
    localStorage.setItem('vibe_moralis_api_key', cleanKey)
  }

  const fetchMoralis = async (endpoint: string, params: Record<string, string> = {}) => {
    const url = new URL(`https://deep-index.moralis.io/api/v2.2${endpoint}`)
    Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value))

    const response = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
        'X-API-Key': moralisApiKey.value,
      },
    })

    if (!response.ok) {
      if (response.status === 401) throw new Error('Moralis API Key không hợp lệ hoặc đã hết hạn.')
      throw new Error(`Moralis API error: ${response.status}`)
    }

    return await response.json()
  }

  const scanWallets = async (addressesStr: string) => {
    const addresses = addressesStr
      .split(/[\s,]+/)
      .map((a) => a.trim())
      .filter((a) => a.startsWith('0x') && a.length === 42)

    if (addresses.length === 0) {
      error.value = 'Địa chỉ ví không hợp lệ (Cần dạng 0x...).'
      return
    }

    if (!moralisApiKey.value) {
      error.value = 'Vui lòng nhập Moralis API Key trong phần cài đặt bên dưới.'
      return
    }

    isScanning.value = true
    error.value = ''
    scanProgress.value = 0

    // Initialize statuses
    networksInfo.forEach((net) => {
      networkStatuses.value[net.id] = 'pending'
    })

    try {
      const rawAssetsMap = new Map<string, TokenAsset>()
      // totalSteps = 12 chain requests per address
      const totalSteps = addresses.length * networksInfo.length
      let finished = 0

      for (const addr of addresses) {
        // Run network scans in parallel
        const scanPromises = networksInfo.map(async (net) => {
          try {
            networkStatuses.value[net.id] = 'scanning'
            currentScanningNet.value = net.name

            interface MoralisToken {
              balance_formatted: string
              usd_price?: number
              usd_value?: number
              native_token?: boolean
              token_address?: string
              symbol?: string
              name?: string
              thumbnail?: string
              logo?: string
              usd_price_24h_percent_change?: number
            }

            const tokenData = await fetchMoralis(`/wallets/${addr}/tokens`, {
              chain: net.chainId,
              exclude_spam: 'true',
            })

            if (Array.isArray(tokenData.result)) {
              tokenData.result.forEach((t: MoralisToken) => {
                const balance = parseFloat(t.balance_formatted) || 0
                if (balance <= 0.00000001) return

                const price = t.usd_price || 0
                const value = t.usd_value || balance * price
                const isNative = t.native_token === true

                const tokenAddress = (t.token_address || 'native').toLowerCase()
                const key = `${addr}-${net.id}-${tokenAddress}`

                const existing = rawAssetsMap.get(key)
                if (existing) {
                  existing.balance += balance
                  existing.value += value
                } else {
                  rawAssetsMap.set(key, {
                    symbol: t.symbol || 'UNKNOWN',
                    name: t.name || 'Token',
                    balance,
                    price,
                    value,
                    logo:
                      t.thumbnail || t.logo || (isNative ? net.icon : 'lucide:circle-dollar-sign'),
                    network: net.id,
                    address: t.token_address,
                    ownerAddress: addr,
                    priceChange24h: t.usd_price_24h_percent_change || 0,
                  })
                }
              })
            }
            networkStatuses.value[net.id] = 'done'
          } catch (err) {
            console.error(`Error scanning ${net.name}:`, err)
            networkStatuses.value[net.id] = 'error'
          } finally {
            finished++
            scanProgress.value = Math.round((finished / totalSteps) * 100)
          }
        })

        // Wait for all chains for this address to complete
        await Promise.allSettled(scanPromises)
      }

      // Process results
      const allAssets = Array.from(rawAssetsMap.values())
      const totalValue = allAssets.reduce((sum, a) => sum + a.value, 0)

      // Weighted 24h change calculation
      let totalChangeValue = 0
      allAssets.forEach((a) => {
        if (a.priceChange24h) {
          totalChangeValue += (a.value * a.priceChange24h) / 100
        }
      })

      const netSummaries = networksInfo
        .map((n) => {
          const value = allAssets
            .filter((a) => a.network === n.id)
            .reduce((sum, a) => sum + a.value, 0)
          return {
            name: n.name,
            id: n.id,
            value,
            icon: n.icon,
            color: n.color,
          }
        })
        .filter((n) => n.value > 0)

      stats.value = {
        totalValue,
        change24h: totalChangeValue,
        networks: netSummaries.sort((a, b) => b.value - a.value),
        assets: allAssets.sort((a, b) => b.value - a.value),
      }

      if (allAssets.length === 0 && !error.value) {
        error.value = 'Không thấy tài sản nào trên các mạng lưới đã quét.'
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      error.value = errorMsg || 'Lỗi hệ thống truy vấn.'
    } finally {
      isScanning.value = false
      scanProgress.value = 100
    }
  }

  return {
    isScanning,
    stats,
    error,
    scanProgress,
    currentScanningNet,
    networkStatuses,
    moralisApiKey,
    usageStats,
    updateApiKey,
    scanWallets,
  }
}
