import type {
  WishBannerPool,
  WishHistoryEntry,
  WishItem,
  WishResult,
  WishState,
  WishStateByBanner,
} from './types'

export const BASE_FIVE_STAR_RATE = 0.006
export const BASE_FOUR_STAR_RATE = 0.051
export const RATE_UP_FIVE_RATE = 0.55
export const RATE_UP_FOUR_RATE = 0.5

export const SOFT_PITY_START = 75
export const HARD_PITY_FOUR = 10
export const HARD_PITY_FIVE = 90
export const HISTORY_LIMIT = 200

const TARGET_FIVE_STAR_RATE_AT_89 = 0.66

function pickRandomItem(pool: readonly WishItem[]): WishItem {
  const picked = pool[Math.floor(Math.random() * pool.length)]
  if (!picked) {
    throw new Error('Pool vật phẩm rỗng')
  }
  return picked
}

function cloneHistoryEntry(entry: WishHistoryEntry): WishHistoryEntry {
  return {
    id: entry.id,
    rollNumber: entry.rollNumber,
    timestamp: entry.timestamp,
    itemName: entry.itemName,
    rarity: entry.rarity,
    itemType: entry.itemType,
    isRateUp: entry.isRateUp,
    visualSeed: entry.visualSeed,
    pityBefore5: entry.pityBefore5,
    pityBefore4: entry.pityBefore4,
  }
}

function toHistoryEntry(result: WishResult): WishHistoryEntry {
  return {
    id: `${result.timestamp}-${result.rollNumber}`,
    rollNumber: result.rollNumber,
    timestamp: result.timestamp,
    itemName: result.item.name,
    rarity: result.rarity,
    itemType: result.item.type,
    isRateUp: result.isRateUp,
    visualSeed: result.item.visualSeed,
    pityBefore5: result.pityBefore5,
    pityBefore4: result.pityBefore4,
  }
}

export function createEmptyWishState(): WishState {
  return {
    pity5: 0,
    pity4: 0,
    guaranteedRateUp5: false,
    stats: {
      totalRolls: 0,
      total4Star: 0,
      total5Star: 0,
      total5StarRateUp: 0,
    },
    history: [],
  }
}

export function createEmptyWishStateByBanner(): WishStateByBanner {
  return {
    character: createEmptyWishState(),
    weapon: createEmptyWishState(),
  }
}

export function cloneWishState(state: WishState): WishState {
  return {
    pity5: state.pity5,
    pity4: state.pity4,
    guaranteedRateUp5: state.guaranteedRateUp5,
    stats: {
      totalRolls: state.stats.totalRolls,
      total4Star: state.stats.total4Star,
      total5Star: state.stats.total5Star,
      total5StarRateUp: state.stats.total5StarRateUp,
    },
    history: state.history.map(cloneHistoryEntry),
  }
}

export function getFiveStarRate(pity5: number): number {
  const currentRoll = pity5 + 1

  if (currentRoll >= HARD_PITY_FIVE) {
    return 1
  }

  if (currentRoll < SOFT_PITY_START) {
    return BASE_FIVE_STAR_RATE
  }

  // Soft pity: từ roll 75 tăng dần mạnh, roll 90 luôn chắc chắn 5 sao.
  const pullsIntoSoftPity = currentRoll - SOFT_PITY_START + 1
  const softPityWindow = HARD_PITY_FIVE - SOFT_PITY_START
  const step = (TARGET_FIVE_STAR_RATE_AT_89 - BASE_FIVE_STAR_RATE) / softPityWindow
  return Math.min(BASE_FIVE_STAR_RATE + pullsIntoSoftPity * step, 0.999)
}

export function performWishBatch(
  state: WishState,
  pools: WishBannerPool,
  count: number,
  timestampSeed: number = Date.now(),
): { nextState: WishState; results: WishResult[] } {
  const nextState = cloneWishState(state)
  const results: WishResult[] = []

  for (let index = 0; index < count; index++) {
    const timestamp = timestampSeed + index
    const result = rollOne(nextState, pools, timestamp)
    results.push(result)
  }

  return { nextState, results }
}

function rollOne(state: WishState, pools: WishBannerPool, timestamp: number): WishResult {
  const pityBefore5 = state.pity5
  const pityBefore4 = state.pity4

  const guaranteedFiveByPity = pityBefore5 + 1 >= HARD_PITY_FIVE
  const fiveStarRate = guaranteedFiveByPity ? 1 : getFiveStarRate(pityBefore5)
  const gotFiveStar = guaranteedFiveByPity || Math.random() < fiveStarRate

  let item: WishItem
  let rarity: WishResult['rarity']
  let isRateUp = false
  let usedGuarantee5 = false

  if (gotFiveStar) {
    rarity = 5
    state.stats.total5Star += 1

    if (state.guaranteedRateUp5) {
      // Sau khi lệch rate, lần 5 sao kế tiếp luôn trúng rate-up.
      usedGuarantee5 = true
      isRateUp = true
      state.guaranteedRateUp5 = false
    } else {
      isRateUp = Math.random() < RATE_UP_FIVE_RATE
      if (!isRateUp) {
        state.guaranteedRateUp5 = true
      }
    }

    item = isRateUp
      ? pickRandomItem(pools.fiveStarRateUpPool)
      : pickRandomItem(pools.fiveStarStandardPool)

    if (isRateUp) {
      state.stats.total5StarRateUp += 1
    }

    state.pity5 = 0
    state.pity4 = 0
  } else {
    const guaranteedFourByPity = pityBefore4 + 1 >= HARD_PITY_FOUR
    const gotFourStar = guaranteedFourByPity || Math.random() < BASE_FOUR_STAR_RATE

    if (gotFourStar) {
      rarity = 4
      state.stats.total4Star += 1
      isRateUp = Math.random() < RATE_UP_FOUR_RATE
      item = isRateUp
        ? pickRandomItem(pools.fourStarRateUpPool)
        : pickRandomItem(pools.fourStarStandardPool)
      state.pity4 = 0
      state.pity5 += 1
    } else {
      rarity = 3
      item = pickRandomItem(pools.threeStarPool)
      state.pity4 += 1
      state.pity5 += 1
    }
  }

  state.stats.totalRolls += 1

  const result: WishResult = {
    rollNumber: state.stats.totalRolls,
    timestamp,
    item,
    rarity,
    isRateUp,
    usedGuarantee5,
    pityBefore5,
    pityBefore4,
  }

  const historyEntry = toHistoryEntry(result)
  state.history = [historyEntry, ...state.history].slice(0, HISTORY_LIMIT)

  return result
}
