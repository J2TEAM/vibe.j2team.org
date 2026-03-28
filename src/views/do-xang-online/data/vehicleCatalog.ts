import type { VehicleBodyType, VehicleOption } from '../types'
import { publicAssetUrl } from '../utils/publicAsset'

type VariantDef = {
  id: string
  yearLabel: string
  capacityLiters: number
  description: string
  imageSearchHint: string
}

type ModelDef = {
  id: string
  name: string
  icon: string
  bodyType: VehicleBodyType
  variants: VariantDef[]
}

type BrandDef = {
  id: string
  name: string
  icon: string
  models: ModelDef[]
}

const IMG = {
  scooter: '/do-xang-online/vehicles/scooter.svg',
  sport: '/do-xang-online/vehicles/sport-bike.svg',
  car: '/do-xang-online/vehicles/car.svg',
} as const

export const VEHICLE_CATALOG: BrandDef[] = [
  {
    id: 'honda',
    name: 'Honda',
    icon: 'lucide:circle-dot',
    models: [
      {
        id: 'air-blade',
        name: 'Air Blade',
        icon: 'lucide:bike',
        bodyType: 'scooter',
        variants: [
          {
            id: 'honda-air-blade-2024-160',
            yearLabel: '2024 · 160',
            capacityLiters: 5.7,
            description: 'Phiên bản 160cc',
            imageSearchHint: 'Honda Air Blade 160 2024 ảnh chính hãng / Wikimedia',
          },
          {
            id: 'honda-air-blade-2025',
            yearLabel: '2025',
            capacityLiters: 5.7,
            description: 'Màu/tem mới — thông số minh họa',
            imageSearchHint: 'Honda Air Blade 2025 Vietnam official',
          },
          {
            id: 'honda-air-blade-2026',
            yearLabel: '2026',
            capacityLiters: 5.7,
            description: 'Đời mới nhất trong bản demo',
            imageSearchHint: 'Honda Air Blade 2026 scooter photo',
          },
        ],
      },
      {
        id: 'vision',
        name: 'Vision',
        icon: 'lucide:bike',
        bodyType: 'scooter',
        variants: [
          {
            id: 'honda-vision-2024',
            yearLabel: '2024',
            capacityLiters: 5.2,
            description: 'Tay ga nhỏ gọn',
            imageSearchHint: 'Honda Vision 2024',
          },
          {
            id: 'honda-vision-2025',
            yearLabel: '2025',
            capacityLiters: 5.2,
            description: 'Cập nhật đèn LED',
            imageSearchHint: 'Honda Vision 2025',
          },
          {
            id: 'honda-vision-2026',
            yearLabel: '2026',
            capacityLiters: 5.2,
            description: 'Bản demo năm hiện tại',
            imageSearchHint: 'Honda Vision 2026 Vietnam',
          },
        ],
      },
      {
        id: 'winner-x',
        name: 'Winner X',
        icon: 'lucide:bike',
        bodyType: 'sport',
        variants: [
          {
            id: 'honda-winner-x-2024',
            yearLabel: '2024',
            capacityLiters: 4.5,
            description: 'Xe côn tay thể thao',
            imageSearchHint: 'Honda Winner X 2024',
          },
          {
            id: 'honda-winner-x-2025',
            yearLabel: '2025',
            capacityLiters: 4.5,
            description: 'Tem racing',
            imageSearchHint: 'Honda Winner X 2025',
          },
          {
            id: 'honda-winner-x-2026',
            yearLabel: '2026',
            capacityLiters: 4.5,
            description: 'Đời demo 2026',
            imageSearchHint: 'Honda Winner X 2026',
          },
        ],
      },
      {
        id: 'sh-mode',
        name: 'SH Mode',
        icon: 'lucide:bike',
        bodyType: 'scooter',
        variants: [
          {
            id: 'honda-sh-mode-2024',
            yearLabel: '2024',
            capacityLiters: 5.5,
            description: 'Tay ga cao cấp',
            imageSearchHint: 'Honda SH Mode 2024',
          },
          {
            id: 'honda-sh-mode-2025',
            yearLabel: '2025',
            capacityLiters: 5.5,
            description: 'Nâng cấp nhẹ',
            imageSearchHint: 'Honda SH Mode 2025',
          },
          {
            id: 'honda-sh-mode-2026',
            yearLabel: '2026',
            capacityLiters: 5.5,
            description: 'Bản demo 2026',
            imageSearchHint: 'Honda SH Mode 2026',
          },
        ],
      },
      {
        id: 'wave-alpha',
        name: 'Wave Alpha',
        icon: 'lucide:bike',
        bodyType: 'scooter',
        variants: [
          {
            id: 'honda-wave-alpha-2024',
            yearLabel: '2024',
            capacityLiters: 4,
            description: 'Xe số phổ thông',
            imageSearchHint: 'Honda Wave Alpha 2024',
          },
          {
            id: 'honda-wave-alpha-2025',
            yearLabel: '2025',
            capacityLiters: 4,
            description: 'Màu mới',
            imageSearchHint: 'Honda Wave Alpha 2025',
          },
          {
            id: 'honda-wave-alpha-2026',
            yearLabel: '2026',
            capacityLiters: 4,
            description: 'Đời demo 2026',
            imageSearchHint: 'Honda Wave Alpha 2026',
          },
        ],
      },
    ],
  },
  {
    id: 'yamaha',
    name: 'Yamaha',
    icon: 'lucide:circle-dot',
    models: [
      {
        id: 'janus',
        name: 'Janus',
        icon: 'lucide:bike',
        bodyType: 'scooter',
        variants: [
          {
            id: 'yamaha-janus-2024',
            yearLabel: '2024',
            capacityLiters: 5.5,
            description: 'Tay ga đô thị',
            imageSearchHint: 'Yamaha Janus 2024 Vietnam',
          },
          {
            id: 'yamaha-janus-2025',
            yearLabel: '2025',
            capacityLiters: 5.5,
            description: 'Smart Key',
            imageSearchHint: 'Yamaha Janus 2025',
          },
          {
            id: 'yamaha-janus-2026',
            yearLabel: '2026',
            capacityLiters: 5.5,
            description: 'Đời demo 2026',
            imageSearchHint: 'Yamaha Janus 2026',
          },
        ],
      },
      {
        id: 'exciter',
        name: 'Exciter',
        icon: 'lucide:bike',
        bodyType: 'sport',
        variants: [
          {
            id: 'yamaha-exciter-2024',
            yearLabel: '2024',
            capacityLiters: 4.2,
            description: 'Xe côn tay',
            imageSearchHint: 'Yamaha Exciter 155 2024',
          },
          {
            id: 'yamaha-exciter-2025',
            yearLabel: '2025',
            capacityLiters: 4.2,
            description: 'Giải đua',
            imageSearchHint: 'Yamaha Exciter 2025',
          },
          {
            id: 'yamaha-exciter-2026',
            yearLabel: '2026',
            capacityLiters: 4.2,
            description: 'Đời demo 2026',
            imageSearchHint: 'Yamaha Exciter 2026',
          },
        ],
      },
    ],
  },
  {
    id: 'suzuki',
    name: 'Suzuki',
    icon: 'lucide:circle-dot',
    models: [
      {
        id: 'address-125',
        name: 'Address 125',
        icon: 'lucide:bike',
        bodyType: 'scooter',
        variants: [
          {
            id: 'suzuki-address-125-2024',
            yearLabel: '2024',
            capacityLiters: 5,
            description: 'Tay ga đô thị',
            imageSearchHint: 'Suzuki Address 125 2024 Vietnam',
          },
          {
            id: 'suzuki-address-125-2025',
            yearLabel: '2025',
            capacityLiters: 5,
            description: 'Tem / màu mới',
            imageSearchHint: 'Suzuki Address 125 2025',
          },
          {
            id: 'suzuki-address-125-2026',
            yearLabel: '2026',
            capacityLiters: 5,
            description: 'Bản demo 2026',
            imageSearchHint: 'Suzuki Address 125 2026',
          },
        ],
      },
      {
        id: 'raider-r150',
        name: 'Raider R150',
        icon: 'lucide:bike',
        bodyType: 'sport',
        variants: [
          {
            id: 'suzuki-raider-2024',
            yearLabel: '2024',
            capacityLiters: 4,
            description: 'Xe côn tay underbone',
            imageSearchHint: 'Suzuki Raider R150 2024',
          },
          {
            id: 'suzuki-raider-2025',
            yearLabel: '2025',
            capacityLiters: 4,
            description: 'Cập nhật nhẹ',
            imageSearchHint: 'Suzuki Raider 2025',
          },
          {
            id: 'suzuki-raider-2026',
            yearLabel: '2026',
            capacityLiters: 4,
            description: 'Đời demo 2026',
            imageSearchHint: 'Suzuki Raider 2026',
          },
        ],
      },
    ],
  },
  {
    id: 'sym',
    name: 'SYM',
    icon: 'lucide:circle-dot',
    models: [
      {
        id: 'attila-v',
        name: 'Attila Victoria',
        icon: 'lucide:bike',
        bodyType: 'scooter',
        variants: [
          {
            id: 'sym-attila-2024',
            yearLabel: '2024',
            capacityLiters: 5.2,
            description: 'Tay ga phổ thông',
            imageSearchHint: 'SYM Attila Victoria 2024',
          },
          {
            id: 'sym-attila-2025',
            yearLabel: '2025',
            capacityLiters: 5.2,
            description: 'Đèn / tem mới',
            imageSearchHint: 'SYM Attila 2025 Vietnam',
          },
          {
            id: 'sym-attila-2026',
            yearLabel: '2026',
            capacityLiters: 5.2,
            description: 'Bản demo 2026',
            imageSearchHint: 'SYM Attila 2026',
          },
        ],
      },
    ],
  },
  {
    id: 'toyota',
    name: 'Toyota',
    icon: 'lucide:circle-dot',
    models: [
      {
        id: 'vios',
        name: 'Vios',
        icon: 'lucide:car',
        bodyType: 'car',
        variants: [
          {
            id: 'toyota-vios-2024',
            yearLabel: '2024',
            capacityLiters: 42,
            description: 'Sedan phổ thông — minh họa',
            imageSearchHint: 'Toyota Vios 2024 Vietnam',
          },
          {
            id: 'toyota-vios-2025',
            yearLabel: '2025',
            capacityLiters: 42,
            description: 'Nâng cấp nội thất',
            imageSearchHint: 'Toyota Vios 2025',
          },
          {
            id: 'toyota-vios-2026',
            yearLabel: '2026',
            capacityLiters: 42,
            description: 'Đời demo 2026',
            imageSearchHint: 'Toyota Vios 2026',
          },
        ],
      },
    ],
  },
  {
    id: 'kia',
    name: 'Kia',
    icon: 'lucide:circle-dot',
    models: [
      {
        id: 'morning',
        name: 'Morning',
        icon: 'lucide:car',
        bodyType: 'car',
        variants: [
          {
            id: 'kia-morning-2024',
            yearLabel: '2024',
            capacityLiters: 35,
            description: 'Xe nhỏ hatchback — minh họa',
            imageSearchHint: 'Kia Morning 2024 Vietnam',
          },
          {
            id: 'kia-morning-2025',
            yearLabel: '2025',
            capacityLiters: 35,
            description: 'Bản facelift',
            imageSearchHint: 'Kia Morning 2025',
          },
          {
            id: 'kia-morning-2026',
            yearLabel: '2026',
            capacityLiters: 35,
            description: 'Đời demo 2026',
            imageSearchHint: 'Kia Morning 2026',
          },
        ],
      },
    ],
  },
  {
    id: 'vinfast',
    name: 'VinFast',
    icon: 'lucide:circle-dot',
    models: [
      {
        id: 'vf5',
        name: 'VF 5',
        icon: 'lucide:car',
        bodyType: 'car',
        variants: [
          {
            id: 'vinfast-vf5-2024',
            yearLabel: '2024',
            capacityLiters: 45,
            description: 'Ô tô điện — đầy pin',
            imageSearchHint: 'VinFast VF 5 2024 official ảnh',
          },
          {
            id: 'vinfast-vf5-2025',
            yearLabel: '2025',
            capacityLiters: 45,
            description: 'Nâng cấp phần mềm / option',
            imageSearchHint: 'VinFast VF 5 2025',
          },
          {
            id: 'vinfast-vf5-2026',
            yearLabel: '2026',
            capacityLiters: 45,
            description: 'Đời demo 2026 — hình xe hơi riêng',
            imageSearchHint: 'VinFast VF 5 2026 electric SUV photo',
          },
        ],
      },
      {
        id: 'vfe34',
        name: 'VF e34',
        icon: 'lucide:car',
        bodyType: 'car',
        variants: [
          {
            id: 'vinfast-vfe34-2024',
            yearLabel: '2024',
            capacityLiters: 50,
            description: 'Crossover điện',
            imageSearchHint: 'VinFast VF e34 2024',
          },
          {
            id: 'vinfast-vfe34-2025',
            yearLabel: '2025',
            capacityLiters: 50,
            description: 'Bản nâng cấp',
            imageSearchHint: 'VinFast VF e34 2025',
          },
          {
            id: 'vinfast-vfe34-2026',
            yearLabel: '2026',
            capacityLiters: 50,
            description: 'Đời demo 2026',
            imageSearchHint: 'VinFast VF e34 2026 ảnh xe',
          },
        ],
      },
    ],
  },
]

function variantToVehicle(brand: BrandDef, model: ModelDef, v: VariantDef): VehicleOption {
  const imageUrl = IMG[model.bodyType]
  return {
    id: v.id,
    brandId: brand.id,
    modelId: model.id,
    brandLabel: brand.name,
    modelLine: model.name,
    yearLabel: v.yearLabel,
    name: `${brand.name} ${model.name} · ${v.yearLabel}`,
    description: v.description,
    capacityLiters: v.capacityLiters,
    icon: model.icon,
    imageUrl,
    imageSearchHint: v.imageSearchHint,
    bodyType: model.bodyType,
  }
}

let cachedAllVehicles: VehicleOption[] | undefined

export function getAllVehicleOptions(): VehicleOption[] {
  if (cachedAllVehicles) return cachedAllVehicles
  const out: VehicleOption[] = []
  for (const brand of VEHICLE_CATALOG) {
    for (const model of brand.models) {
      for (const v of model.variants) {
        out.push(variantToVehicle(brand, model, v))
      }
    }
  }
  cachedAllVehicles = out
  return out
}

export function getVehicleById(id: string): VehicleOption | undefined {
  return getAllVehicleOptions().find((x) => x.id === id)
}

export const DEFAULT_VEHICLE_ID = getAllVehicleOptions()[0]!.id

export const EMPTY_VEHICLE_ID = '__empty__'

export const EMPTY_VEHICLE: VehicleOption = {
  id: EMPTY_VEHICLE_ID,
  brandId: '',
  modelId: '',
  name: 'Chưa chọn phiên bản xe',
  brandLabel: '—',
  modelLine: '—',
  yearLabel: '—',
  description: 'Chọn đủ: hãng → dòng xe → phiên bản/đời.',
  capacityLiters: 0,
  icon: 'lucide:bike',
  imageUrl: IMG.scooter,
  imageSearchHint: '',
  bodyType: 'scooter',
}

export function resolveVehicle(id: string): VehicleOption {
  if (id === EMPTY_VEHICLE_ID) return EMPTY_VEHICLE
  return getVehicleById(id) ?? EMPTY_VEHICLE
}

export function previewSrcForBodyType(body: VehicleBodyType): string {
  return publicAssetUrl(IMG[body])
}
