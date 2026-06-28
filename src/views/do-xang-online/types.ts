export type VehicleBodyType = 'scooter' | 'sport' | 'car'

export type VehicleOption = {
  id: string
  brandId: string
  modelId: string
  name: string
  brandLabel: string
  modelLine: string
  yearLabel: string
  description: string
  capacityLiters: number
  icon: string
  imageUrl: string
  imageSearchHint: string
  bodyType: VehicleBodyType
}

export type FuelOption = {
  id: string
  label: string
  icon: string
  pricePerLiter: number
  changeText: string
}

export type DropSeed = {
  key: string
  left: number
  delay: number
  duration: number
}

export type FillPhaseCode = 'idle' | 'prep' | 'walk' | 'couple' | 'hose' | 'tank' | 'done'

export type RefuelUiState =
  | 'idle'
  | 'parking'
  | 'parked'
  | 'approaching'
  | 'fuelFlowPriming'
  | 'refueling'
  | 'completed'
  | 'error'
