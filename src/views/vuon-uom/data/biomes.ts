import type { Biome } from '../types'

export const BIOMES: Biome[] = [
  {
    id: 'mangrove-coast',
    emoji: '🌊',
    name: { en: 'Mangrove Coast', vi: 'Rừng Sác Ven Biển' },
    specialty: { en: 'Mangroves, river life, floating culture', vi: 'Rừng ngập mặn, chợ nổi' },
  },
  {
    id: 'coastal-winds',
    emoji: '☀️',
    name: { en: 'Coastal Winds', vi: 'Duyên Hải Gió Cát' },
    specialty: { en: 'Wind/solar, coral, fishing', vi: 'Năng lượng sạch, san hô, đánh bắt' },
  },
  {
    id: 'highland-mists',
    emoji: '🏔️',
    name: { en: 'Highland Mists', vi: 'Cao Nguyên Mây Phủ' },
    specialty: {
      en: 'Terraced fields, mountain trade',
      vi: 'Ruộng bậc thang, giao thương vùng cao',
    },
  },
  {
    id: 'ancient-forests',
    emoji: '🐆',
    name: { en: 'Ancient Forests', vi: 'Đại Ngàn Trường Sơn' },
    specialty: {
      en: 'Rarest species, sacred spaces',
      vi: 'Loài vật quý hiếm, không gian linh thiêng',
    },
  },
  {
    id: 'highland-plateaus',
    emoji: '☕',
    name: { en: 'Highland Plateaus', vi: 'Cao Nguyên Đất Đỏ' },
    specialty: { en: 'Coffee forests, elephants', vi: 'Rừng cà phê, đàn voi đại ngàn' },
  },
  {
    id: 'river-delta-plains',
    emoji: '🌾',
    name: { en: 'River Delta Plains', vi: 'Phù Sa Đồng Bằng' },
    specialty: { en: 'Rice, festivals, living dikes', vi: 'Lúa nước, lễ hội, đê điều' },
  },
  {
    id: 'grand-port',
    emoji: '🏙️',
    name: { en: 'The Grand Port', vi: 'Viễn Đông Thương Cảng' },
    specialty: {
      en: 'Innovation hub, trade capital, digital frontier',
      vi: 'Trung tâm đổi mới, giao thương, công nghệ số',
    },
  },
]
