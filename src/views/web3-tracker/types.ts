export interface TokenAsset {
  symbol: string
  name: string
  balance: number
  price: number
  value: number
  logo: string
  network: string
  address?: string
  ownerAddress?: string
  priceChange24h?: number
}

export interface NetworkSummary {
  name: string
  id: string
  value: number
  icon: string
  color: string
}

export interface WalletStats {
  totalValue: number
  change24h: number
  networks: NetworkSummary[]
  assets: TokenAsset[]
}
