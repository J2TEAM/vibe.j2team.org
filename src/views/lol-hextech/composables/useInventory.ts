import { useLocalStorage } from '@vueuse/core'
import {
  ITEMS,
  DUST_VALUES,
  type HextechDrop,
  type InventoryItem,
  type ItemDefinition,
} from '../data'

// We don't have uuid installed, let's use a simpler uid generator function instead of uuidv4
const generateUid = () => Math.random().toString(36).substring(2, 9)

export function useInventory() {
  const orangeEssence = useLocalStorage('hextech-oe', 1000)
  const shards = useLocalStorage<InventoryItem[]>('hextech-shards', [])
  const permanents = useLocalStorage<InventoryItem[]>('hextech-permanents', [])

  const addShard = (item: ItemDefinition) => {
    shards.value.unshift({
      uid: generateUid(),
      item,
      isPermanent: false,
    })
  }

  const addPermanent = (item: ItemDefinition) => {
    permanents.value.unshift({
      uid: generateUid(),
      item,
      isPermanent: true,
    })
  }

  const openChest = (): HextechDrop => {
    const roll = Math.random()
    if (roll < 0.6) {
      // 60% Skin Shard
      const skins = ITEMS.filter((i) => i.type === 'Skin')
      const skin = skins[Math.floor(Math.random() * skins.length)]
      if (skin) addShard(skin)
      return { type: 'Skin', item: skin }
    } else if (roll < 0.8) {
      // 20% Ward Shard
      const wards = ITEMS.filter((i) => i.type === 'Ward')
      const ward = wards[Math.floor(Math.random() * wards.length)]
      if (ward) addShard(ward)
      return { type: 'Ward', item: ward }
    } else {
      // 20% OE
      const amount = Math.floor(Math.random() * 350) + 150 // 150 to 499 OE
      orangeEssence.value += amount
      return { type: 'OrangeEssence', amount }
    }
  }

  const getCost = (item: ItemDefinition, action: 'upgrade' | 'disenchant'): number => {
    const values = DUST_VALUES[item.type as keyof typeof DUST_VALUES]
    const rarityCosts = values[item.rarity as keyof typeof values]
    return rarityCosts ? rarityCosts[action] : 0
  }

  const disenchant = (uid: string) => {
    const index = shards.value.findIndex((s) => s.uid === uid)
    if (index === -1) return false

    const shard = shards.value[index]
    if (shard) {
      const oeValue = getCost(shard.item, 'disenchant')
      orangeEssence.value += oeValue
      shards.value.splice(index, 1)
      return true
    }
    return false
  }

  const upgrade = (uid: string) => {
    const index = shards.value.findIndex((s) => s.uid === uid)
    if (index === -1) return false

    const shard = shards.value[index]
    if (shard) {
      const cost = getCost(shard.item, 'upgrade')
      if (orangeEssence.value >= cost) {
        orangeEssence.value -= cost
        shards.value.splice(index, 1)
        addPermanent(shard.item)
        return true
      }
    }
    return false
  }

  const reroll = (uids: [string, string, string]) => {
    // Verify we have all 3
    const selectedShards = uids
      .map((uid) => shards.value.find((s) => s.uid === uid))
      .filter(Boolean) as InventoryItem[]
    if (selectedShards.length !== 3) return null

    // Verify all are skins
    if (!selectedShards.every((s) => s.item.type === 'Skin')) return null

    // Remove shards
    for (const uid of uids) {
      const idx = shards.value.findIndex((s) => s.uid === uid)
      if (idx !== -1) shards.value.splice(idx, 1)
    }

    // Give 1 random skin permanent
    const skins = ITEMS.filter((i) => i.type === 'Skin')
    const newSkin = skins[Math.floor(Math.random() * skins.length)]
    if (newSkin) addPermanent(newSkin)

    return newSkin
  }

  const ownsItem = (itemId: string) => {
    return permanents.value.some((p) => p.item.id === itemId)
  }

  return {
    orangeEssence,
    shards,
    permanents,
    openChest,
    disenchant,
    upgrade,
    reroll,
    getCost,
    ownsItem,
    ITEMS,
  }
}
