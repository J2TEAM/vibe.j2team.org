export type ItemType = 'Skin' | 'Ward' | 'OrangeEssence'
export type Rarity = 'Common' | 'Epic' | 'Legendary' | 'Ultimate' | 'Rare'

export interface ItemDefinition {
  id: string
  name: string
  type: 'Skin' | 'Ward'
  rarity: Rarity
}

export interface HextechDrop {
  type: ItemType
  item?: ItemDefinition
  amount?: number // For Orange Essence dropping raw
}

export interface InventoryItem {
  uid: string // Unique instance ID
  item: ItemDefinition
  isPermanent: boolean
}

// OE Costs mapping based on typical LoL values
export const DUST_VALUES = {
  Skin: {
    Common: { upgrade: 675, disenchant: 195 },
    Epic: { upgrade: 1050, disenchant: 270 },
    Legendary: { upgrade: 1520, disenchant: 364 },
    Ultimate: { upgrade: 2950, disenchant: 650 },
  },
  Ward: {
    Rare: { upgrade: 340, disenchant: 128 },
    Epic: { upgrade: 450, disenchant: 150 }, // Approximation
  },
} as const

// Mock items
export const ITEMS: ItemDefinition[] = [
  // Skins
  { id: 'sk_1', name: 'Yasuo Ma Kiếm', type: 'Skin', rarity: 'Legendary' },
  { id: 'sk_2', name: 'Lee Sin Nộ Long Cước', type: 'Skin', rarity: 'Legendary' },
  { id: 'sk_3', name: 'Lux Thập Đại Nguyên Tố', type: 'Skin', rarity: 'Ultimate' },
  { id: 'sk_4', name: 'Ezreal Vũ Khí Tối Thượng', type: 'Skin', rarity: 'Ultimate' },
  { id: 'sk_5', name: 'Jhin Hắc Tinh', type: 'Skin', rarity: 'Legendary' },
  { id: 'sk_6', name: 'Zed Tử Thần Không Gian', type: 'Skin', rarity: 'Legendary' },
  { id: 'sk_7', name: 'Ashe Siêu Phẩm', type: 'Skin', rarity: 'Legendary' },
  { id: 'sk_8', name: 'Vayne Siêu Phẩm', type: 'Skin', rarity: 'Legendary' },
  { id: 'sk_9', name: 'Ahri Vệ Binh Tinh Tú', type: 'Skin', rarity: 'Legendary' },
  { id: 'sk_10', name: 'Teemo Phi Hành Gia', type: 'Skin', rarity: 'Epic' },
  { id: 'sk_11', name: 'Katarina Siêu Phẩm', type: 'Skin', rarity: 'Epic' },
  { id: 'sk_12', name: 'Riven Giả Lập', type: 'Skin', rarity: 'Epic' },
  { id: 'sk_13', name: 'Irelia Băng Kiếm', type: 'Skin', rarity: 'Epic' },
  { id: 'sk_14', name: 'Akali K/DA', type: 'Skin', rarity: 'Epic' },
  { id: 'sk_15', name: 'Evelynn K/DA', type: 'Skin', rarity: 'Epic' },
  { id: 'sk_16', name: "Kai'Sa K/DA", type: 'Skin', rarity: 'Epic' },
  { id: 'sk_17', name: 'Seraphine K/DA ALL OUT', type: 'Skin', rarity: 'Ultimate' },
  { id: 'sk_18', name: 'Miss Fortune Vệ Binh Pajama', type: 'Skin', rarity: 'Epic' },
  { id: 'sk_19', name: 'Tristana Luyện Rồng', type: 'Skin', rarity: 'Legendary' },
  { id: 'sk_20', name: 'Lucian Cao Bồi', type: 'Skin', rarity: 'Legendary' },
  { id: 'sk_21', name: 'Garen Phong Thần Kiếm', type: 'Skin', rarity: 'Common' },
  { id: 'sk_22', name: 'Darius Sừng Trâu', type: 'Skin', rarity: 'Common' },
  { id: 'sk_23', name: 'Master Yi Sát Thủ', type: 'Skin', rarity: 'Common' },
  { id: 'sk_24', name: 'Annie Lửa Đỏ', type: 'Skin', rarity: 'Common' },
  { id: 'sk_25', name: 'Warwick Sói Điên', type: 'Skin', rarity: 'Common' },

  // Wards
  { id: 'w_1', name: 'Mẫu Mắt Vinh Quang', type: 'Ward', rarity: 'Rare' },
  { id: 'w_2', name: 'Mẫu Mắt Siêu Phẩm', type: 'Ward', rarity: 'Epic' },
  { id: 'w_3', name: 'Mẫu Mắt Huyết Nguyệt', type: 'Ward', rarity: 'Epic' },
  { id: 'w_4', name: 'Mẫu Mắt Giả Lập', type: 'Ward', rarity: 'Rare' },
  { id: 'w_5', name: 'Mẫu Mắt Quái Vật Không Gian', type: 'Ward', rarity: 'Rare' },
  { id: 'w_6', name: 'Mẫu Mắt K/DA', type: 'Ward', rarity: 'Epic' },
  { id: 'w_7', name: 'Mẫu Mắt Hoa Hồng Pha Lê', type: 'Ward', rarity: 'Rare' },
  { id: 'w_8', name: 'Mẫu Mắt Bóng Ma', type: 'Ward', rarity: 'Rare' },
  { id: 'w_9', name: 'Mẫu Mắt Mèo Cưng', type: 'Ward', rarity: 'Rare' },
  { id: 'w_10', name: 'Mẫu Mắt Rồng Nhỏ', type: 'Ward', rarity: 'Epic' },
]

export const RARITY_COLORS: Record<Rarity, string> = {
  Common: 'from-gray-400 to-gray-600',
  Rare: 'from-blue-400 to-blue-600',
  Epic: 'from-cyan-400 to-cyan-600',
  Legendary: 'from-red-500 to-red-700',
  Ultimate: 'from-orange-400 to-orange-600',
}

export const OE_ICON = 'lucide:droplet'
