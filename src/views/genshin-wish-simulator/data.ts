import type { WishBannerInfo, WishBannerKey, WishBannerPool, WishItem } from './types'

function createItem(
  id: string,
  name: string,
  rarity: WishItem['rarity'],
  type: WishItem['type'],
  isRateUp: boolean,
  visualSeed: number,
): WishItem {
  return {
    id,
    name,
    rarity,
    type,
    isRateUp,
    visualSeed,
  }
}

const THREE_STAR_POOL: readonly WishItem[] = [
  createItem('3-dawn-blade', 'Kiếm Bình Minh', 3, 'Vũ khí', false, 11),
  createItem('3-cold-steel', 'Lãnh Cương Kiếm', 3, 'Vũ khí', false, 22),
  createItem('3-raven-bow', 'Cung Quạ Đêm', 3, 'Vũ khí', false, 33),
  createItem('3-emerald-orb', 'Ngọc Lục Linh', 3, 'Vũ khí', false, 44),
  createItem('3-thrilling-tales', 'Truyện Kinh Dị Cổ', 3, 'Vũ khí', false, 55),
  createItem('3-ferrous-shadow', 'Thiết Ảnh Đại Kiếm', 3, 'Vũ khí', false, 66),
  createItem('3-debate-club', 'Gậy Tranh Biện', 3, 'Vũ khí', false, 77),
  createItem('3-skyrider-sword', 'Thiên Hành Kiếm', 3, 'Vũ khí', false, 88),
]

const characterBannerInfo: WishBannerInfo = {
  key: 'character',
  name: 'Banner Nhân vật',
  title: 'Khúc Ca Tinh Vân',
  subtitle: 'Banner nhân vật giới hạn (mô phỏng frontend)',
  rateUp5Names: ['Astrella - Vũ Khúc Sao Băng'],
  rateUp4Names: ['Liora - Cung Sương', 'Kavin - Khiên Lửa', 'Mirae - Họa Sĩ Ánh Trăng'],
}

const characterBannerPools: WishBannerPool = {
  threeStarPool: THREE_STAR_POOL,
  fourStarRateUpPool: [
    createItem('4-liora', 'Liora - Cung Sương', 4, 'Nhân vật', true, 101),
    createItem('4-kavin', 'Kavin - Khiên Lửa', 4, 'Nhân vật', true, 102),
    createItem('4-mirae', 'Mirae - Họa Sĩ Ánh Trăng', 4, 'Nhân vật', true, 103),
  ],
  fourStarStandardPool: [
    createItem('4-yuna', 'Yuna - Pháp Sư Gió', 4, 'Nhân vật', false, 111),
    createItem('4-ryo', 'Ryo - Kiếm Sĩ Mưa', 4, 'Nhân vật', false, 112),
    createItem('4-serin', 'Serin - Nhạc Công Mộc', 4, 'Nhân vật', false, 113),
    createItem('4-spear-azure', 'Thương Lam Chớp', 4, 'Vũ khí', false, 114),
    createItem('4-bow-whisper', 'Cung Lời Thì Thầm', 4, 'Vũ khí', false, 115),
    createItem('4-catalyst-ember', 'Pháp Khí Hồng Tàn', 4, 'Vũ khí', false, 116),
    createItem('4-claymore-tide', 'Đại Kiếm Triều Dâng', 4, 'Vũ khí', false, 117),
  ],
  fiveStarRateUpPool: [
    createItem('5-astrella', 'Astrella - Vũ Khúc Sao Băng', 5, 'Nhân vật', true, 201),
  ],
  fiveStarStandardPool: [
    createItem('5-valen', 'Valen - Kỵ Sĩ Hoàng Hôn', 5, 'Nhân vật', false, 211),
    createItem('5-elysia', 'Elysia - Mộng Sương', 5, 'Nhân vật', false, 212),
    createItem('5-hyorin', 'Hyorin - Tuyết Ảnh', 5, 'Nhân vật', false, 213),
    createItem('5-ragnar', 'Ragnar - Bão Kiếm', 5, 'Nhân vật', false, 214),
    createItem('5-noctis', 'Noctis - Sao Rơi Bóng Đêm', 5, 'Nhân vật', false, 215),
  ],
}

const weaponBannerInfo: WishBannerInfo = {
  key: 'weapon',
  name: 'Banner Vũ khí',
  title: 'Khí Phách Binh Khí',
  subtitle: 'Banner vũ khí giới hạn (mô phỏng frontend)',
  rateUp5Names: ['Tinh Vẫn Trường Cung', 'Thiên Quang Đại Kiếm'],
  rateUp4Names: ['Thánh Kiếm Lưu Quang', 'Nguyệt Ảnh Pháp Điển', 'Thương Hải Lam'],
}

const weaponBannerPools: WishBannerPool = {
  threeStarPool: THREE_STAR_POOL,
  fourStarRateUpPool: [
    createItem('4-weapon-sacred-blade', 'Thánh Kiếm Lưu Quang', 4, 'Vũ khí', true, 301),
    createItem('4-weapon-moon-codex', 'Nguyệt Ảnh Pháp Điển', 4, 'Vũ khí', true, 302),
    createItem('4-weapon-ocean-spear', 'Thương Hải Lam', 4, 'Vũ khí', true, 303),
  ],
  fourStarStandardPool: [
    createItem('4-weapon-frost-bow', 'Băng Tuyết Trường Cung', 4, 'Vũ khí', false, 311),
    createItem('4-weapon-shadow-sword', 'Ảnh Dạ Kiếm', 4, 'Vũ khí', false, 312),
    createItem('4-weapon-ruby-claymore', 'Hồng Ngọc Đại Kiếm', 4, 'Vũ khí', false, 313),
    createItem('4-weapon-sand-catalyst', 'Sa Mạc Pháp Khí', 4, 'Vũ khí', false, 314),
    createItem('4-weapon-thunder-polearm', 'Lôi Phạt Trường Thương', 4, 'Vũ khí', false, 315),
  ],
  fiveStarRateUpPool: [
    createItem('5-weapon-starlit-bow', 'Tinh Vẫn Trường Cung', 5, 'Vũ khí', true, 401),
    createItem('5-weapon-skygreatsword', 'Thiên Quang Đại Kiếm', 5, 'Vũ khí', true, 402),
  ],
  fiveStarStandardPool: [
    createItem('5-weapon-ocean-blade', 'Hải Triều Kiếm', 5, 'Vũ khí', false, 411),
    createItem('5-weapon-thunder-codex', 'Lôi Ảnh Pháp Điển', 5, 'Vũ khí', false, 412),
    createItem('5-weapon-ember-polearm', 'Xích Viêm Trường Thương', 5, 'Vũ khí', false, 413),
    createItem('5-weapon-forest-bow', 'Lâm Phong Trường Cung', 5, 'Vũ khí', false, 414),
  ],
}

export const BANNER_KEYS: readonly WishBannerKey[] = ['character', 'weapon']

export const BANNER_CONFIGS: Record<WishBannerKey, WishBannerInfo> = {
  character: characterBannerInfo,
  weapon: weaponBannerInfo,
}

export const BANNER_POOLS: Record<WishBannerKey, WishBannerPool> = {
  character: characterBannerPools,
  weapon: weaponBannerPools,
}
