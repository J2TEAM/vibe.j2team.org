<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import type { Platform, Particle, FloatingText, Monster, MonsterType, Player, Chest, ItemType, WeaponType, WeaponDrop, Projectile, SkillType, EquipmentConfig, EquipmentDrop, EquipSlot, ConsumableType, ConsumableItem, PassiveType } from './types'
// Engine
import {
  CANVAS_WIDTH, CANVAS_HEIGHT, MAP_WIDTH,
  PLAYER_WIDTH, PLAYER_HEIGHT, PLAYER_BASE_SPEED, PLAYER_JUMP_POWER,
  PLAYER_MAX_HP, PLAYER_MAX_MP, PLAYER_BASE_ATK, PLAYER_MANA_REGEN, PLAYER_BASE_CRIT,
  PLAYER_SPAWN_X, PLAYER_SPAWN_OFFSET_Y, PLAYER_SPAWN_INVINCIBLE,
  FRICTION, MAX_JUMPS, INVINCIBLE_FRAMES, DASH_INVINCIBLE_FRAMES, HURT_TIMER_FRAMES, MINOR_HURT_TIMER,
  CRIT_MULT_DEFAULT, CRIT_MULT_BURST,
  LIFESTEAL_PERCENT, THORNS_PERCENT, LIGHTNING_CHANCE, LIGHTNING_MULT, MANA_SHIELD_REDUCTION, MANA_SHIELD_COST_MULT,
  SHIELD_DAMAGE_MULT, KNOCKBACK_VX, KNOCKBACK_VY,
  MONSTER_ATTACK_TIMER, MONSTER_ATTACK_COOLDOWN, MONSTER_HIT_KNOCKBACK, SCORE_COMBO_SCALE,
  ATTACK_TIMER, ATTACK_COOLDOWN_BASE, ATTACK_COOLDOWN_MIN,
  ATTACK_HITBOX_PAD_Y, ATTACK_HITBOX_PAD_H,
  DAMAGE_LEVEL_SCALE, DAMAGE_ATK_BOOST_MULT, DAMAGE_VARIANCE,
  SPEED_BOOST_MULT, EFFECT_DECAY_RATE, CHEST_OPEN_TIMER,
  DASH_TIMER, DASH_SPEED, DASH_SLASH_DAMAGE, DASH_SLASH_LIFE,
  HEAL_BASE, HEAL_LEVEL_SCALE,
  CHEST_DROP_CHANCE, WEAPON_DROP_CHANCE, EQUIP_DROP_CHANCE, CONSUMABLE_DROP_CHANCE,
  INITIAL_SPAWN_RATE, INITIAL_MAX_MONSTERS, MAX_MAX_MONSTERS, MIN_SPAWN_RATE, SPAWN_RATE_DECREASE,
  CHEST_SPAWN_INTERVAL, INITIAL_HP_POTIONS, INITIAL_MP_POTIONS,
  HP_POTION_HEAL, MP_POTION_HEAL, HP_POTION_HEAL_CHEST,
  BASE_EXP_MAX, EXP_GEM_BASE, EXP_GEM_LEVEL_SCALE,
  EXP_GROWTH, LEVEL_HP_BONUS, LEVEL_MP_BONUS, LEVEL_ATK_BONUS,
  LEVEL_HP_HEAL, LEVEL_MP_HEAL, LEVEL_SPEED_BONUS,
  SHAKE_INTENSITY_HIT, SHAKE_INTENSITY_CRIT, SHAKE_INTENSITY_BOSS, SHAKE_DECAY,
  COMBO_TIMEOUT, COMBO_DMG_SCALE, COMBO_MAX_MULT,
  BOSS_PHASE2_HP, BOSS_PHASE3_HP,
  BOSS_PHASE1_SPEED, BOSS_PHASE2_SPEED, BOSS_PHASE3_SPEED,
  BOSS_PHASE1_COOLDOWN, BOSS_PHASE2_COOLDOWN, BOSS_PHASE3_COOLDOWN,
  AUTOSAVE_KEY, AUTOSAVE_INTERVAL,
} from './engine/constants'
import { rectCollide, resolveGravity } from './engine/physics'
import { sfxAttack, sfxHit, sfxKill, sfxPlayerHurt, sfxJump, sfxLevelUp, sfxChestOpen, sfxItem, sfxGameOver, sfxMenuSelect, initAudio } from './engine/sound'
// Entities
import { createMonster as _createMonster } from './entities/monsters'
import { createChest, drawChest, ITEM_COLORS, ITEM_NAMES, ITEM_DURATIONS } from './entities/items'
import { WEAPONS, createWeaponDrop, drawWeaponDrop } from './entities/weapons'
import { SKILLS, getUltimateName, createWeaponProjectile, createUltimateProjectile, drawProjectile, drawSkillBar } from './entities/skills'
import { getRandomEquipment, createEquipmentDrop, drawEquipmentDrop, calcEquipmentBonuses, RARITY_COLORS, RARITY_NAMES, upgradeEquipment, canUpgrade, findUpgradeMaterials, getActivePassives, PASSIVE_NAMES } from './entities/equipment'
import { MATERIALS, monsterGoldDrop, rollMaterialDrop, stonesNeeded, upgradeSuccessRate, rollUpgradeSuccess } from './entities/materials'
import type { MaterialInventory, MaterialType } from './entities/materials'
import { WINGS, getRandomWingDrop, drawWings } from './entities/wings'
import type { WingType, WingConfig } from './entities/wings'
import { drawNPC, drawShopUI, drawUpgradeUI } from './entities/npc'
import type { NPC } from './entities/npc'
// Rendering
import { spawnParticles as _spawnParticles, spawnFloatingText as _spawnFloatingText, updateParticles as _updateParticles, updateFloatingTexts as _updateFloatingTexts, drawParticles as _drawParticles, drawFloatingTexts as _drawFloatingTexts } from './rendering/particles'
// World
import { generateBackground } from './world/map'
import { getBiomeConfig, getBiomeForLevel, BIOMES } from './world/biomes'
import { MAP_CONFIGS, BATTLE_MAPS, generateMapPlatforms, generateHubNPCs, drawPortal, drawMapSelection, getPlayerZone, drawZoneIndicator, drawZoneBoundaries } from './world/maps'
import type { MapId } from './world/maps'
// UI
import { saveScore, isHighScore, drawLeaderboard } from './ui/leaderboard'
import { drawGoldHUD, drawWingHUD } from './ui/shop-upgrade'

const canvasRef = ref<HTMLCanvasElement | null>(null)
const gameState = ref<'menu' | 'naming' | 'playing' | 'gameover'>('menu')
const score = ref(0)
const level = ref(1)
const playerHp = ref(PLAYER_MAX_HP)
const playerMaxHp = ref(PLAYER_MAX_HP)
const playerExp = ref(0)
const playerExpMax = ref(BASE_EXP_MAX)
const combo = ref(0)
const playerMp = ref(PLAYER_MAX_MP)
const playerMaxMp = ref(PLAYER_MAX_MP)
const killCount = ref(0)
const showInventory = ref(false)

// === PLAYER NAME & ADMIN ===
const playerName = ref('Ninja')
let nameInput = ''
let nameBlinkTimer = 0
let isAdmin = false
const ADMIN_NAME = 'nmdung.dev'

let animationId = 0
let ctx: CanvasRenderingContext2D | null = null
let W = CANVAS_WIDTH
let H = CANVAS_HEIGHT

const keys: Record<string, boolean> = {}
const keyJustPressed: Record<string, boolean> = {}
function onKeyDown(e: KeyboardEvent) {
  // Skip game controls during naming input
  if (gameState.value === 'naming') {
    if (e.code === 'Enter' || e.code === 'Space') initAudio()
    return
  }
  if (!keys[e.code]) keyJustPressed[e.code] = true
  keys[e.code] = true
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault()
  if (e.code === 'Enter' || e.code === 'Space') initAudio()
  // Inventory toggle
  if (e.code === 'KeyB' && gameState.value === 'playing') showInventory.value = !showInventory.value
  // Tab switch in inventory (4 tabs: weapons, equipment, consumables, wings)
  if (e.code === 'Tab' && showInventory.value) { e.preventDefault(); invTab = (invTab + 1) % 4 }
  // Quick equip 1-6
  if (gameState.value === 'playing' && !showInventory.value) {
    const weaponKeys: WeaponType[] = ['sword', 'dual_swords', 'axe', 'bow', 'shuriken', 'hammer']
    for (let i = 0; i < 6; i++) {
      if (e.code === `Digit${i + 1}` && inventory.includes(weaponKeys[i]!)) {
        player.weapon = weaponKeys[i]!
        sfxItem()
        spawnFloatingText(player.x + player.w / 2, player.y - 20, WEAPONS[weaponKeys[i]!].name, WEAPONS[weaponKeys[i]!].color, 14)
      }
    }
  }
  // Use consumables: F for HP potion, G for MP potion
  if (e.code === 'KeyF' && gameState.value === 'playing' && !showInventory.value) {
    const hp = consumables.find(c => c.type === 'hp_potion' && c.count > 0)
    if (hp && playerHp.value < playerMaxHp.value) {
      hp.count--; playerHp.value = Math.min(playerHp.value + HP_POTION_HEAL, playerMaxHp.value)
      spawnFloatingText(player.x + player.w / 2, player.y - 20, `+${HP_POTION_HEAL} HP`, '#ef4444', 16)
      spawnParticles(player.x + player.w / 2, player.y + player.h / 2, '#ef4444', 10, 4)
      sfxItem()
    }
  }
  if (e.code === 'KeyG' && gameState.value === 'playing' && !showInventory.value) {
    const mp = consumables.find(c => c.type === 'mp_potion' && c.count > 0)
    if (mp && playerMp.value < playerMaxMp.value) {
      mp.count--; playerMp.value = Math.min(playerMp.value + MP_POTION_HEAL, playerMaxMp.value)
      spawnFloatingText(player.x + player.w / 2, player.y - 20, `+${MP_POTION_HEAL} MP`, '#3b82f6', 16)
      spawnParticles(player.x + player.w / 2, player.y + player.h / 2, '#818cf8', 10, 4)
      sfxItem()
    }
  }
  // Skills: Q=dash, E=heal, R=ultimate
  if (gameState.value === 'playing' && !showInventory.value) {
    if (e.code === 'KeyQ') tryUseSkill('dash')
    if (e.code === 'KeyE') tryUseSkill('heal')
    if (e.code === 'KeyR') tryUseSkill('ultimate')
  }
  // Equipment interaction in inventory
  if (showInventory.value && invTab === 1 && gameState.value === 'playing') {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') equipSelectedSlot = Math.max(0, equipSelectedSlot - 1)
    if (e.code === 'ArrowRight' || e.code === 'KeyD') equipSelectedSlot = Math.min(5, equipSelectedSlot + 1)
  }
  // NPC blacksmith keyboard controls
  if (activeNPC?.type === 'blacksmith') {
    if (e.code === 'Escape') { upgradeSelectedEquip = null; upgradeResult = 'none' }
    if (e.code === 'KeyD') { upgradeUseRefineDust = !upgradeUseRefineDust && materialInventory.refine_dust > 0 }
    if (e.code === 'KeyF') { upgradeUseProtection = !upgradeUseProtection && materialInventory.protection_scroll > 0 }
    if (!upgradeSelectedEquip) {
      const allUpgradeable = getAllUpgradeableItems()
      if (e.code === 'ArrowUp') upgradeListIdx = Math.max(0, upgradeListIdx - 1)
      if (e.code === 'ArrowDown') upgradeListIdx = Math.min(allUpgradeable.length - 1, upgradeListIdx + 1)
      if (e.code === 'Enter' && allUpgradeable[upgradeListIdx]) {
        upgradeSelectedEquip = allUpgradeable[upgradeListIdx]!
      }
    } else if (e.code === 'Enter') { performUpgrade() }
  }
  // NPC merchant keyboard controls
  if (activeNPC?.type === 'merchant') {
    if (e.code === 'ArrowUp') shopSelectedIdx = Math.max(0, shopSelectedIdx - 1)
    if (e.code === 'ArrowDown') shopSelectedIdx = Math.min(2, shopSelectedIdx + 1)
    if (e.code === 'Enter') {
      const items: { mat: MaterialType; price: number }[] = [
        { mat: 'upgrade_stone', price: 100 },
        { mat: 'refine_dust', price: 250 },
        { mat: 'protection_scroll', price: 500 },
      ]
      const item = items[shopSelectedIdx]
      if (item && playerGold.value >= item.price) {
        playerGold.value -= item.price
        materialInventory[item.mat]++
        sfxChestOpen()
        spawnFloatingText(player.x + player.w / 2, player.y - 20, `${MATERIALS[item.mat].icon} +1`, MATERIALS[item.mat].color, 14)
      } else { sfxPlayerHurt() }
    }
  }
}
function onKeyUp(e: KeyboardEvent) { keys[e.code] = false }

function onCanvasClick(e: MouseEvent) {
  if (!canvasRef.value) return
  const rect = canvasRef.value.getBoundingClientRect()
  // Convert to game coordinates
  const scaleX = W / rect.width
  const scaleY = H / rect.height
  const mx = (e.clientX - rect.left) * scaleX
  const my = (e.clientY - rect.top) * scaleY

  // Menu/gameover: start game
  if (gameState.value === 'menu' || gameState.value === 'gameover') {
    initAudio(); startGame(); return
  }

  // NPC interaction clicks (merchant shop, blacksmith upgrade)
  if (activeNPC?.type === 'merchant') {
    const panelW = 360, panelH = 300
    const px = (W - panelW) / 2, py = H - panelH - 50
    const items: { mat: MaterialType; price: number }[] = [
      { mat: 'upgrade_stone', price: 100 },
      { mat: 'refine_dust', price: 250 },
      { mat: 'protection_scroll', price: 500 },
    ]
    items.forEach((item, i) => {
      const iy = py + 54 + i * 68
      const btnX = px + panelW - 88, btnY2 = iy + 14, bw = 70, bh = 28
      if (mx >= btnX && mx <= btnX + bw && my >= btnY2 && my <= btnY2 + bh) {
        if (playerGold.value >= item.price) {
          playerGold.value -= item.price
          materialInventory[item.mat]++
          sfxChestOpen()
          spawnFloatingText(player.x + player.w / 2, player.y - 20, `${MATERIALS[item.mat].icon} +1`, MATERIALS[item.mat].color, 14)
        } else { sfxPlayerHurt() }
      }
    })
    return
  }

  if (activeNPC?.type === 'blacksmith') {
    const panelW = 420, panelH = 360
    const px = (W - panelW) / 2, py = H - panelH - 50
    if (!upgradeSelectedEquip) {
      // Click to select equipment
      const allItems = getAllUpgradeableItems()
      const maxVisible = 7
      const startI = Math.max(0, upgradeListIdx - 3)
      for (let i = startI; i < Math.min(allItems.length, startI + maxVisible); i++) {
        const iy = py + 56 + (i - startI) * 40
        if (mx >= px + 12 && mx <= px + panelW - 12 && my >= iy && my <= iy + 34) {
          upgradeSelectedEquip = allItems[i]!; upgradeListIdx = i; sfxItem(); return
        }
      }
    } else {
      // Click upgrade button
      upgradeSuccessRate(upgradeSelectedEquip.level, upgradeUseRefineDust)
      const optY = py + 38 + 60 + 18 + 40 + 6 + 18 + 28
      const btnY = optY + 36
      if (mx >= px + panelW / 2 - 90 && mx <= px + panelW / 2 + 90 && my >= btnY && my <= btnY + 34) {
        performUpgrade(); return
      }
      // Click refine dust toggle
      if (mx >= px + 16 && mx <= px + 16 + (panelW - 40) / 2 - 4 && my >= optY && my <= optY + 26) {
        upgradeUseRefineDust = !upgradeUseRefineDust && materialInventory.refine_dust > 0; return
      }
      // Click protection toggle
      const optX2 = px + 16 + (panelW - 40) / 2 + 4
      if (mx >= optX2 && mx <= optX2 + (panelW - 40) / 2 - 4 && my >= optY && my <= optY + 26) {
        upgradeUseProtection = !upgradeUseProtection && materialInventory.protection_scroll > 0; return
      }
    }
    return
  }

  // Map selection clicks
  if (showMapSelection) {
    const panelW = 400, panelH = 320
    const px = (W - panelW) / 2, py = H - panelH - 50
    for (let i = 0; i < BATTLE_MAPS.length; i++) {
      const iy = py + 40 + i * 62
      if (mx >= px + 12 && mx <= px + panelW - 12 && my >= iy && my <= iy + 52) {
        const targetMap = BATTLE_MAPS[i]
        if (targetMap && unlockedMaps.value.includes(targetMap)) {
          switchMap(targetMap); return
        }
      }
    }
    return
  }

  if (!showInventory.value) return

  const panelW = 480, panelH = 380
  const px = (W - panelW) / 2, py = (H - panelH) / 2

  // Tab clicks
  const tabW = panelW / 4
  if (my >= py && my <= py + 24) {
    for (let i = 0; i < 4; i++) {
      if (mx >= px + i * tabW && mx < px + (i + 1) * tabW) {
        invTab = i; sfxItem(); return
      }
    }
  }

  if (invTab === 0) {
    // Weapon slots click
    const allWeapons: WeaponType[] = ['sword', 'dual_swords', 'axe', 'bow', 'shuriken', 'hammer']
    const slotSize = 56, slotGap = 8
    const startX = px + 20, startY = py + 72
    for (let i = 0; i < allWeapons.length; i++) {
      const col = i % 3, row = Math.floor(i / 3)
      const sx = startX + col * (slotSize + slotGap)
      const sy = startY + row * (slotSize + slotGap + 20)
      if (mx >= sx && mx <= sx + slotSize && my >= sy && my <= sy + slotSize) {
        if (inventory.includes(allWeapons[i]!)) {
          player.weapon = allWeapons[i]!
          sfxItem()
          spawnFloatingText(player.x + player.w / 2, player.y - 20, WEAPONS[allWeapons[i]!].name, WEAPONS[allWeapons[i]!].color, 14)
        }
        return
      }
    }
  } else if (invTab === 1) {
    const slots: EquipSlot[] = ['head', 'chest', 'legs', 'gloves', 'boots', 'accessory']
    const eqSlotW = 130, eqSlotH = 44, eqGap = 6
    const eqStartX = px + 12, eqStartY = py + 54

    // Click on equipment slots (select or unequip)
    for (let i = 0; i < slots.length; i++) {
      const col = i % 3, row = Math.floor(i / 3)
      const sx = eqStartX + col * (eqSlotW + eqGap)
      const sy = eqStartY + row * (eqSlotH + eqGap + 18)
      const eq = player.equipment[slots[i]!]

      // Unequip button [Gỡ]
      if (eq) {
        const btnX = sx + eqSlotW - 28, btnY = sy + 4
        if (mx >= btnX && mx <= btnX + 24 && my >= btnY && my <= btnY + 16) {
          player.equipment[slots[i]!] = null
          equipInventory.push(eq)
          sfxItem()
          spawnFloatingText(player.x + player.w / 2, player.y - 20, `${eq.icon} Gỡ ${eq.name}`, '#ef4444', 14)
          return
        }
      }

      // Select slot
      if (mx >= sx && mx <= sx + eqSlotW && my >= sy && my <= sy + eqSlotH) {
        equipSelectedSlot = i; sfxItem(); return
      }
    }

    // Inventory items - equip and discard buttons
    const invX = px + 14
    const invY = eqStartY + 2 * (eqSlotH + eqGap + 18) + 16
    const maxShow = 6
    for (let i = 0; i < Math.min(equipInventory.length, maxShow); i++) {
      const ey = invY + 14 + i * 22
      const eq = equipInventory[i]!
      let btnX = invX + panelW - 128

      // [⬆] Upgrade button (1 base + 2 same-slot materials)
      const canUp = canUpgrade(eq, equipInventory)
      if (canUp) {
        if (mx >= btnX && mx <= btnX + 20 && my >= ey - 2 && my <= ey + 12) {
          const materials = findUpgradeMaterials(eq, equipInventory)
          if (materials.length >= 2) {
            // Remove materials from inventory (by uid)
            for (const mat of materials) {
              const idx = equipInventory.findIndex(x => x.uid === mat.uid)
              if (idx >= 0) equipInventory.splice(idx, 1)
            }
            // Find base again after removals
            const baseIdx = equipInventory.findIndex(x => x.uid === eq.uid)
            if (baseIdx >= 0) {
              const upgraded = upgradeEquipment(eq, materials)
              equipInventory[baseIdx] = upgraded
              sfxLevelUp()
              spawnFloatingText(player.x + player.w / 2, player.y - 20, `⬆ ${upgraded.name} Lv.${upgraded.level}!`, '#fbbf24', 16)
            }
            return
          }
        }
        btnX += 24
      }

      // [Mặc] button - equip to MATCHING slot
      const eqBtnX = btnX, eqBtnY = ey - 2
      if (mx >= eqBtnX && mx <= eqBtnX + 30 && my >= eqBtnY && my <= eqBtnY + 14) {
        const oldEquip = player.equipment[eq.slot]
        player.equipment[eq.slot] = eq
        equipInventory.splice(i, 1)
        if (oldEquip) equipInventory.push(oldEquip)
        sfxChestOpen()
        spawnFloatingText(player.x + player.w / 2, player.y - 20, `${eq.icon} ${eq.name} trang bị!`, RARITY_COLORS[eq.rarity], 14)
        return
      }

      // [Bỏ] button - discard
      const delBtnX = eqBtnX + 36
      if (mx >= delBtnX && mx <= delBtnX + 24 && my >= eqBtnY && my <= eqBtnY + 14) {
        equipInventory.splice(i, 1)
        sfxItem()
        spawnFloatingText(player.x + player.w / 2, player.y - 20, `Bỏ ${eq.name}`, '#64748b', 12)
        return
      }
    }
  } else if (invTab === 2) {
    // Consumable clicks
    const items = ['hp_potion', 'mp_potion']
    for (let i = 0; i < items.length; i++) {
      const iy = py + 70 + i * 60
      if (mx >= px + 40 && mx <= px + panelW - 40 && my >= iy && my <= iy + 48) {
        if (items[i] === 'hp_potion') {
          const hp = consumables.find(c => c.type === 'hp_potion' && c.count > 0)
          if (hp && playerHp.value < playerMaxHp.value) {
            hp.count--; playerHp.value = Math.min(playerHp.value + HP_POTION_HEAL, playerMaxHp.value)
            spawnFloatingText(player.x + player.w / 2, player.y - 20, `+${HP_POTION_HEAL} HP`, '#ef4444', 16)
            sfxItem()
          }
        } else {
          const mp = consumables.find(c => c.type === 'mp_potion' && c.count > 0)
          if (mp && playerMp.value < playerMaxMp.value) {
            mp.count--; playerMp.value = Math.min(playerMp.value + MP_POTION_HEAL, playerMaxMp.value)
            spawnFloatingText(player.x + player.w / 2, player.y - 20, `+${MP_POTION_HEAL} MP`, '#3b82f6', 16)
            sfxItem()
          }
        }
        return
      }
    }
  } else if (invTab === 3) {
    // Wings tab click - equip/unequip wings
    ownedWings.forEach((wt, i) => {
      const col = i % 4, row = Math.floor(i / 4)
      const wx = px + 20 + col * 110
      const wy = py + 66 + row * 80
      if (mx >= wx && mx <= wx + 100 && my >= wy && my <= wy + 66) {
        equipWing(wt); return
      }
    })
  }
}

const mousePos = { x: -1, y: -1 }
function onMouseMove(e: MouseEvent) {
  if (!canvasRef.value) return
  const rect = canvasRef.value.getBoundingClientRect()
  mousePos.x = (e.clientX - rect.left) * (W / rect.width)
  mousePos.y = (e.clientY - rect.top) * (H / rect.height)
}

const camera = { x: 0, y: 0 }
// === COMBAT FEEL STATE ===
const screenShake = { x: 0, y: 0, intensity: 0 }
// hitStopTimer removed - screen shake only
let comboTimer = 0 // frames since last hit - combo resets when > COMBO_TIMEOUT
let newGamePlusLevel = 0 // 0 = normal, 1+ = NG+
const particles: Particle[] = []
const floatingTexts: FloatingText[] = []
const platforms: Platform[] = []
const monsters: Monster[] = []
const chests: Chest[] = []
const weaponDrops: WeaponDrop[] = []
const inventory: WeaponType[] = ['sword']
const projectiles: Projectile[] = []
const equipmentDrops: EquipmentDrop[] = []
const equipInventory: EquipmentConfig[] = []
const consumables: ConsumableItem[] = [
  { type: 'hp_potion', count: INITIAL_HP_POTIONS },
  { type: 'mp_potion', count: INITIAL_MP_POTIONS },
]
let invTab = 0 // 0=weapons, 1=equipment, 2=consumables, 3=shop, 4=upgrade
let equipSelectedSlot = 0

// === GOLD & MATERIALS ===
const playerGold = ref(0)
const materialInventory: MaterialInventory = {
  upgrade_stone: 0, refine_dust: 0, protection_scroll: 0,
}
// === WINGS ===
const ownedWings: WingType[] = []
let equippedWing: WingConfig | null = null
let flyTimer = 0 // frames of hover remaining
// === SHOP & UPGRADE STATE ===
let shopSelectedIdx = 0
let upgradeSelectedEquip: EquipmentConfig | null = null
let upgradeUseRefineDust = false
let upgradeUseProtection = false
let upgradeResult: 'none' | 'success' | 'fail' = 'none'
let upgradeAnim = 0
let upgradeListIdx = 0  // index in the combined list for selecting equipment

// === MAP SYSTEM ===
const currentMapId = ref<MapId>('hub')
const npcs: NPC[] = []
const unlockedMaps = ref<MapId[]>(['forest'])  // start with forest unlocked
let showMapSelection = false
let mapSelectIdx = 0
let activeNPC: NPC | null = null  // currently interacting NPC



let spawnRate = INITIAL_SPAWN_RATE
let maxMonsters = INITIAL_MAX_MONSTERS
let chestSpawnTimer = 0
let scoreSaved = false
let menuReady = 0
const invSelectedIdx = 0

// ===== PLAYER =====
const player: Player = {
  x: PLAYER_SPAWN_X, y: H - PLAYER_SPAWN_OFFSET_Y, vx: 0, vy: 0, w: PLAYER_WIDTH, h: PLAYER_HEIGHT,
  speed: PLAYER_BASE_SPEED, jumpPower: PLAYER_JUMP_POWER, onGround: false, facing: 1,
  attacking: false, attackTimer: 0, attackCooldown: 0, attackFrame: 0,
  invincible: 0, animFrame: 0, animTimer: 0, state: 'idle',
  baseAtk: PLAYER_BASE_ATK, atkBoost: 0, speedBoost: 0, shield: 0,
  jumpCount: 0, maxJumps: MAX_JUMPS, weapon: 'sword',
  mp: PLAYER_MAX_MP, maxMp: PLAYER_MAX_MP, manaRegen: PLAYER_MANA_REGEN,
  skillCooldowns: { dash: 0, heal: 0, ultimate: 0 },
  equipment: { head: null, chest: null, legs: null, gloves: null, boots: null, accessory: null },
  defense: 0, critChance: PLAYER_BASE_CRIT,
  dashing: false, dashTimer: 0,
}

function resetPlayer() {
  Object.assign(player, {
    x: PLAYER_SPAWN_X, y: H - PLAYER_SPAWN_OFFSET_Y, vx: 0, vy: 0, onGround: false,
    attacking: false, attackTimer: 0, attackCooldown: 0,
    invincible: PLAYER_SPAWN_INVINCIBLE, state: 'idle', facing: 1,
    baseAtk: PLAYER_BASE_ATK, atkBoost: 0, speedBoost: 0, shield: 0,
    speed: PLAYER_BASE_SPEED, animFrame: 0, jumpCount: 0, weapon: 'sword',
    mp: PLAYER_MAX_MP, maxMp: PLAYER_MAX_MP, manaRegen: PLAYER_MANA_REGEN,
    skillCooldowns: { dash: 0, heal: 0, ultimate: 0 },
    equipment: { head: null, chest: null, legs: null, gloves: null, boots: null, accessory: null },
    defense: 0, critChance: PLAYER_BASE_CRIT,
    dashing: false, dashTimer: 0,
  })
  playerHp.value = PLAYER_MAX_HP; playerMaxHp.value = PLAYER_MAX_HP
  playerMp.value = PLAYER_MAX_MP; playerMaxMp.value = PLAYER_MAX_MP
  playerExp.value = 0; level.value = 1
  score.value = 0; combo.value = 0; killCount.value = 0
  playerExpMax.value = BASE_EXP_MAX
  inventory.length = 0; inventory.push('sword')
  weaponDrops.length = 0; projectiles.length = 0
  equipmentDrops.length = 0; equipInventory.length = 0
  consumables.length = 0
  consumables.push({ type: 'hp_potion', count: INITIAL_HP_POTIONS }, { type: 'mp_potion', count: INITIAL_MP_POTIONS })
  showInventory.value = false; invTab = 0
  // Reset gold, materials, wings
  playerGold.value = 0
  materialInventory.upgrade_stone = 0
  materialInventory.refine_dust = 0
  materialInventory.protection_scroll = 0
  ownedWings.length = 0
  equippedWing = null; flyTimer = 0
  shopSelectedIdx = 0; upgradeSelectedEquip = null
  upgradeUseRefineDust = false; upgradeUseProtection = false
  upgradeResult = 'none'; upgradeAnim = 0
}

// === WINGS ===
function equipWing(wingType: WingType) {
  const cfg = WINGS[wingType]
  if (equippedWing?.id === wingType) {
    // Unequip
    player.maxJumps = MAX_JUMPS
    equippedWing = null
    spawnFloatingText(player.x + player.w / 2, player.y - 20, 'Gỡ cánh', '#ef4444', 14)
  } else {
    equippedWing = cfg
    player.maxJumps = MAX_JUMPS + cfg.extraJumps
    spawnFloatingText(player.x + player.w / 2, player.y - 20, `${cfg.icon} ${cfg.name}`, cfg.color, 16)
    spawnParticles(player.x + player.w / 2, player.y + player.h / 2, cfg.color, 15, 5)
  }
  sfxItem()
}

// === UPGRADE SYSTEM ===
function getAllUpgradeableItems(): EquipmentConfig[] {
  const items: EquipmentConfig[] = []
  const slots: EquipSlot[] = ['head', 'chest', 'legs', 'gloves', 'boots', 'accessory']
  for (const slot of slots) {
    const eq = player.equipment[slot]
    if (eq) items.push(eq)
  }
  for (const eq of equipInventory) items.push(eq)
  return items
}

function performUpgrade() {
  if (!upgradeSelectedEquip) return
  const eq = upgradeSelectedEquip
  if (eq.level >= 10) return

  const needed = stonesNeeded(eq.level)
  if (materialInventory.upgrade_stone < needed) {
    spawnFloatingText(player.x + player.w / 2, player.y - 20, 'Thiếu Đá Nâng Cấp!', '#ef4444', 14)
    sfxPlayerHurt(); return
  }

  // Consume materials
  materialInventory.upgrade_stone -= needed
  if (upgradeUseRefineDust && materialInventory.refine_dust > 0) materialInventory.refine_dust--
  if (upgradeUseProtection && materialInventory.protection_scroll > 0) materialInventory.protection_scroll--

  // Roll success
  const success = rollUpgradeSuccess(eq.level, upgradeUseRefineDust)
  upgradeAnim = 60

  if (success) {
    upgradeResult = 'success'
    // Upgrade stats in-place
    const newLevel = Math.min(10, eq.level + 1)
    const boost = 1 + (newLevel - 1) * 0.15
    const prevBoost = 1 + (eq.level - 1) * 0.15
    if (eq.stats.hp) eq.stats.hp = Math.round(eq.stats.hp / prevBoost * boost)
    if (eq.stats.atk) eq.stats.atk = Math.round(eq.stats.atk / prevBoost * boost)
    if (eq.stats.def) eq.stats.def = Math.round(eq.stats.def / prevBoost * boost)
    if (eq.stats.speed) eq.stats.speed = Math.round(eq.stats.speed / prevBoost * boost * 100) / 100
    if (eq.stats.critChance) eq.stats.critChance = Math.round(eq.stats.critChance / prevBoost * boost)
    eq.level = newLevel
    eq.name = eq.name.replace(/ \+\d+$/, '') + (newLevel > 1 ? ` +${newLevel - 1}` : '')
    sfxLevelUp()
    spawnFloatingText(player.x + player.w / 2, player.y - 40, `${eq.icon} Nâng cấp thành công!`, '#4ade80', 18)
    spawnParticles(player.x + player.w / 2, player.y + player.h / 2, '#4ade80', 25, 6)
  } else {
    upgradeResult = 'fail'
    sfxPlayerHurt()
    // Fail penalty: lose 1 level unless protected
    if (!upgradeUseProtection && eq.level > 1) {
      const prevLevel = eq.level - 1
      const prevBoost = 1 + (prevLevel - 1) * 0.15
      const curBoost = 1 + (eq.level - 1) * 0.15
      if (eq.stats.hp) eq.stats.hp = Math.round(eq.stats.hp / curBoost * prevBoost)
      if (eq.stats.atk) eq.stats.atk = Math.round(eq.stats.atk / curBoost * prevBoost)
      if (eq.stats.def) eq.stats.def = Math.round(eq.stats.def / curBoost * prevBoost)
      eq.level = prevLevel
      eq.name = eq.name.replace(/ \+\d+$/, '') + (prevLevel > 1 ? ` +${prevLevel - 1}` : '')
      spawnFloatingText(player.x + player.w / 2, player.y - 40, `${eq.icon} Thất bại! -1 Lv`, '#ef4444', 18)
    } else {
      spawnFloatingText(player.x + player.w / 2, player.y - 40, `${eq.icon} Thất bại! (Được bảo vệ)`, '#fbbf24', 16)
    }
    spawnParticles(player.x + player.w / 2, player.y + player.h / 2, '#ef4444', 15, 4)
  }
}

function tryUseSkill(skill: SkillType) {
  const cfg = SKILLS[skill]
  if (player.skillCooldowns[skill] > 0) return
  if (playerMp.value < cfg.manaCost) {
    spawnFloatingText(player.x + player.w / 2, player.y - 30, 'Không đủ MP!', '#ef4444', 12)
    return
  }
  playerMp.value -= cfg.manaCost
  player.skillCooldowns[skill] = cfg.cooldown
  sfxAttack()

  if (skill === 'dash') {
    player.dashing = true; player.dashTimer = DASH_TIMER
    player.vx = player.facing * DASH_SPEED; player.invincible = DASH_INVINCIBLE_FRAMES
    spawnFloatingText(player.x + player.w / 2, player.y - 20, '💨 DASH!', '#38bdf8', 16)
    spawnParticles(player.x + player.w / 2, player.y + player.h / 2, '#38bdf8', 15, 6)
    // Dash slash projectile
    projectiles.push({
      x: player.x + (player.facing > 0 ? player.w : -40), y: player.y,
      vx: player.facing * 8, vy: 0, w: 40, h: player.h,
      damage: DASH_SLASH_DAMAGE + player.baseAtk, life: DASH_SLASH_LIFE, type: 'dash_slash',
      color: '#38bdf8', rotation: 0, piercing: true, hitTargets: [],
    })
  } else if (skill === 'heal') {
    const healAmt = HEAL_BASE + level.value * HEAL_LEVEL_SCALE
    playerHp.value = Math.min(playerHp.value + healAmt, playerMaxHp.value)
    spawnFloatingText(player.x + player.w / 2, player.y - 20, `💚 +${healAmt} HP`, '#4ade80', 18)
    spawnParticles(player.x + player.w / 2, player.y + player.h / 2, '#4ade80', 25, 8)
  } else if (skill === 'ultimate') {
    const ultProjs = createUltimateProjectile(player)
    projectiles.push(...ultProjs)
    const ultName = getUltimateName(player.weapon)
    spawnFloatingText(player.x + player.w / 2, player.y - 40, ultName, '#f97316', 20)
    spawnParticles(player.x + player.w / 2, player.y + player.h / 2, '#f97316', 30, 10)
  }
}

// Delegate to modules (wrappers for backward compat)
function spawnParticles(x: number, y: number, color: string, count: number, spread = 3) {
  _spawnParticles(particles, x, y, color, count, spread)
}
function spawnFloatingText(x: number, y: number, text: string, color: string, size = 16) {
  _spawnFloatingText(floatingTexts, x, y, text, color, size)
}
function generateMap() {

  platforms.length = 0
  const newPlatforms = generateMapPlatforms(currentMapId.value, H)
  for (const p of newPlatforms) platforms.push(p)
  // Generate NPCs for hub
  npcs.length = 0
  if (currentMapId.value === 'hub') {
    const hubNPCs = generateHubNPCs(H)
    for (const n of hubNPCs) npcs.push(n)
  }
}
function createMonster(type: MonsterType, x: number): Monster {
  const biome = MAP_CONFIGS[currentMapId.value].biome
  return _createMonster(type, x, level.value, H, biome)
}
// Zone spawn timers - mỗi zone có timer riêng
const zoneSpawnTimers: Record<string, number> = {}

function spawnMonster() {
  const mapCfg = MAP_CONFIGS[currentMapId.value]
  if (mapCfg.zones.length === 0) return  // No zones (hub)

  // Spawn theo từng zone
  for (const zone of mapCfg.zones) {
    const zoneKey = `${mapCfg.id}_${zone.name}`
    if (!zoneSpawnTimers[zoneKey]) zoneSpawnTimers[zoneKey] = 0
    zoneSpawnTimers[zoneKey]++

    if (zoneSpawnTimers[zoneKey]! < zone.spawnRate) continue
    zoneSpawnTimers[zoneKey] = 0

    // Đếm quái trong zone
    const zoneMonsters = monsters.filter(m =>
      !m.dead && m.x >= zone.xStart - 100 && m.x <= zone.xEnd + 100
    )
    if (zoneMonsters.length >= zone.maxMonsters) continue

    // Spawn quái tại vị trí random trong zone
    const spawnX = zone.xStart + Math.random() * (zone.xEnd - zone.xStart)
    monsters.push(createMonster(zone.monsterType, spawnX))
  }

  // Boss spawn logic (toàn map)
  const hasBoss = monsters.some(m => m.type === 'boss')
  if (mapCfg.bossType && level.value >= mapCfg.minLevel + 2 && !hasBoss && Math.random() < 0.003) {
    // Boss spawn ở giữa map
    const bossX = mapCfg.width / 2
    monsters.push(createMonster(mapCfg.bossType, bossX))
  }
}

// ===== COLLISION (uses imported rectCollide from physics.ts) =====
// resolveGravity wrapper adds map bounds
function _resolveGravity(e: { x: number; y: number; vx: number; vy: number; w: number; h: number; onGround: boolean }) {
  resolveGravity(e, platforms)
  const mapWidth = MAP_CONFIGS[currentMapId.value].width
  if (e.x < 0) e.x = 0
  if (e.x + e.w > mapWidth) e.x = mapWidth - e.w
}

// ===== DRAW CHARACTER (improved) =====
function drawPixelChar(x: number, y: number, f: 1 | -1, state: string, frame: number, isInv: boolean) {
  if (!ctx) return
  if (isInv && Math.floor(Date.now() / 80) % 2 === 0) return
  const cx = x - camera.x, cy = y - camera.y, w = player.w, h = player.h

  // --- Afterimage ghosts for attack & dash ---
  if (state === 'attack' || player.dashing) {
    for (let g = 1; g <= 2; g++) {
      ctx.save(); ctx.globalAlpha = 0.15 / g
      const gx = cx - f * g * 8, gy = cy + g
      if (f < 0) { ctx.translate(gx + w, gy); ctx.scale(-1, 1) } else { ctx.translate(gx, gy) }
      ctx.fillStyle = player.dashing ? '#38bdf8' : WEAPONS[player.weapon].color
      ctx.fillRect(6, 14, w - 12, h - 22)
      ctx.fillRect(6, 0, w - 12, 14)
      ctx.restore()
    }
  }

  ctx.save()

  // === NINJA SPIN on double jump ===
  const isDoubleJump = state === 'jump' && player.jumpCount >= 2
  if (isDoubleJump) {
    const spinSpeed = 8 // frames per full rotation (faster!)
    const spinProgress = Math.min(1, (frame % spinSpeed) / (spinSpeed - 1))
    const spinAngle = f * spinProgress * Math.PI * 2 // direction follows facing
    ctx.translate(cx + w / 2, cy + h / 2)
    ctx.rotate(spinAngle)
    ctx.translate(-w / 2, -h / 2)
  } else {
    if (f < 0) { ctx.translate(cx + w, cy); ctx.scale(-1, 1) } else { ctx.translate(cx, cy) }
  }

  // === WINGS (behind character) ===
  if (equippedWing) {
    const isFlying = !player.onGround || state === 'jump'
    drawWings(ctx!, equippedWing, w, h, player.facing, player.animFrame, isFlying)
  }

  // Shadow
  if (!isDoubleJump) {
    ctx.fillStyle = 'rgba(0,0,0,0.3)'
    ctx.beginPath(); ctx.ellipse(w / 2, h + 2, 12, 3, 0, 0, Math.PI * 2); ctx.fill()
  }

  // Cape/scarf flowing
  const capeWave = Math.sin(Date.now() * 0.008 + frame * 0.3) * 4
  const capeLen = state === 'run' ? h - 2 : h - 4
  ctx.fillStyle = '#dc2626'
  ctx.beginPath()
  ctx.moveTo(8, 12)
  ctx.quadraticCurveTo(4 + capeWave, 26, 2 + capeWave * 1.5, capeLen)
  ctx.lineTo(12, capeLen - 4)
  ctx.lineTo(14, 12)
  ctx.fill()
  // Cape shine
  ctx.fillStyle = 'rgba(255,100,100,0.2)'
  ctx.beginPath()
  ctx.moveTo(10, 13)
  ctx.quadraticCurveTo(6 + capeWave * 0.5, 20, 6 + capeWave, 30)
  ctx.lineTo(12, 28)
  ctx.lineTo(13, 13)
  ctx.fill()

  // Body
  const bodyColor = player.shield > 0 ? '#7c3aed' : '#2563eb'
  const breathe = state === 'idle' ? Math.sin(Date.now() * 0.003) * 0.5 : 0
  ctx.fillStyle = bodyColor
  ctx.fillRect(6, 14 + breathe, w - 12, h - 22)
  // Chest highlight
  ctx.fillStyle = 'rgba(255,255,255,0.08)'
  ctx.fillRect(8, 16 + breathe, w - 16, 6)
  // Belt
  ctx.fillStyle = '#92400e'
  ctx.fillRect(6, 24, w - 12, 3)
  ctx.fillStyle = '#fbbf24'
  ctx.fillRect(w / 2 - 2, 23, 4, 5)

  // Equipment visual - chest armor tint
  if (player.equipment.chest) {
    ctx.fillStyle = `${RARITY_COLORS[player.equipment.chest.rarity]}30`
    ctx.fillRect(6, 14, w - 12, h - 22)
  }

  // Arms with attack animation   
  const armSwing = state === 'run' ? Math.sin(frame * 0.4) * 6 : state === 'attack' ? Math.sin(frame * 0.8) * 10 : 0
  const armY = state === 'jump' && !isDoubleJump ? -3 : 0
  ctx.fillStyle = '#1d4ed8'
  ctx.fillRect(2, 16 + armSwing + armY, 5, 10)
  ctx.fillRect(w - 7, 16 - armSwing + armY, 5, 10)
  // Gloves equipment visual
  if (player.equipment.gloves) {
    ctx.fillStyle = `${RARITY_COLORS[player.equipment.gloves.rarity]}60`
    ctx.fillRect(1, 24 + armSwing + armY, 5, 4)
    ctx.fillRect(w - 6, 24 - armSwing + armY, 5, 4)
  }
  ctx.fillStyle = '#fcd9b6'
  ctx.fillRect(1, 24 + armSwing + armY, 5, 4)
  ctx.fillRect(w - 6, 24 - armSwing + armY, 5, 4)

  // Head
  ctx.fillStyle = '#fcd9b6'
  ctx.fillRect(6, 0, w - 12, 14)
  // Hair
  ctx.fillStyle = '#1a1a2e'
  ctx.fillRect(6, 0, w - 12, 4)
  ctx.fillRect(4, 2, 3, 3)

  // Headband - color from helmet equipment
  const headbandColor = player.equipment.head ? RARITY_COLORS[player.equipment.head.rarity] : '#ef4444'
  ctx.fillStyle = headbandColor
  ctx.fillRect(4, 4, w - 8, 3)
  // Headband tail (flowing)
  const tailWave = Math.sin(Date.now() * 0.01) * 3
  const tailLen = state === 'run' ? 1.5 : 1
  ctx.fillRect(-3, 4, 7, 2)
  ctx.fillRect(-6 + tailWave * tailLen, 5, 5, 2)
  ctx.fillRect(-8 + tailWave * 1.3 * tailLen, 6, 4, 1)
  if (state === 'run') { ctx.fillRect(-11 + tailWave * 1.5, 6, 3, 1) }

  // Eyes
  const blinkOpen = Math.floor(Date.now() / 3000) % 15 !== 0
  ctx.fillStyle = '#1a1a2e'
  if (state === 'attack') {
    // Fierce eyes when attacking
    ctx.fillRect(9, 7, 3, 4); ctx.fillRect(16, 7, 3, 4)
    ctx.fillStyle = '#fff'; ctx.fillRect(10, 7, 1, 2); ctx.fillRect(17, 7, 1, 2)
    // Angry eyebrows
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(8, 6, 4, 1); ctx.fillRect(16, 6, 4, 1)
  } else if (blinkOpen) {
    ctx.fillRect(9, 8, 3, 3); ctx.fillRect(16, 8, 3, 3)
    ctx.fillStyle = '#fff'; ctx.fillRect(10, 8, 1, 1); ctx.fillRect(17, 8, 1, 1)
  } else {
    ctx.fillRect(9, 9, 3, 1); ctx.fillRect(16, 9, 3, 1)
  }
  // Mouth
  ctx.fillStyle = state === 'attack' ? '#fff' : '#b45a3a'
  if (state === 'attack') {
    ctx.fillRect(11, 12, 6, 2) // shouting mouth
  } else {
    ctx.fillRect(12, 12, 4, 1)
  }

  // Legs - tucked up during jumps
  if (state === 'jump' && !isDoubleJump) {
    // Jump pose - legs bent
    ctx.fillStyle = '#1e3a5f'
    ctx.fillRect(7, h - 12, 6, 6); ctx.fillRect(w - 13, h - 12, 6, 6)
    ctx.fillStyle = '#3b2a1a'
    ctx.fillRect(7, h - 7, 7, 3); ctx.fillRect(w - 14, h - 7, 7, 3)
  } else if (isDoubleJump) {
    // Tucked spin legs
    ctx.fillStyle = '#1e3a5f'
    ctx.fillRect(6, h - 14, 6, 4); ctx.fillRect(w - 12, h - 14, 6, 4)
    ctx.fillStyle = '#3b2a1a'
    ctx.fillRect(6, h - 10, 6, 2); ctx.fillRect(w - 12, h - 10, 6, 2)
  } else {
    const legOff = state === 'run' ? Math.sin(frame * 0.5) * 5 : 0
    ctx.fillStyle = '#1e3a5f'
    ctx.fillRect(8, h - 10, 5, 10 + legOff)
    ctx.fillRect(w - 13, h - 10, 5, 10 - legOff)
    // Boots - color from equipment
    ctx.fillStyle = player.equipment.boots ? RARITY_COLORS[player.equipment.boots.rarity] : '#3b2a1a'
    ctx.fillRect(7, h - 2 + legOff, 7, 3)
    ctx.fillRect(w - 14, h - 2 - legOff, 7, 3)
  }

  // Run dust particles
  if (state === 'run' && frame % 4 === 0 && !isDoubleJump) {
    ctx.fillStyle = 'rgba(180,160,140,0.4)'
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(-4 + Math.random() * 6, h + Math.random() * 4, 2 + Math.random() * 2, 1 + Math.random())
    }
  }

  // Weapon - unique per weapon type
  const wColor = WEAPONS[player.weapon].color
  if (state === 'attack') {
    ctx.save()
    ctx.translate(w - 2, 14)
    if (player.weapon === 'sword') {
      ctx.rotate(-0.8 + frame * 0.35)
      const bg = ctx.createLinearGradient(0, 0, 32, 0)
      bg.addColorStop(0, '#94a3b8'); bg.addColorStop(0.5, '#e2e8f0'); bg.addColorStop(1, '#94a3b8')
      ctx.fillStyle = bg; ctx.fillRect(0, -2, 32, 3)
      ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(4, -2, 28, 1)
      ctx.fillStyle = '#fbbf24'; ctx.fillRect(-3, -4, 7, 7)
      ctx.fillStyle = '#92400e'; ctx.fillRect(-8, -2, 6, 3)
    } else if (player.weapon === 'dual_swords') {
      ctx.rotate(-0.5 + frame * 0.4)
      ctx.fillStyle = '#60a5fa'; ctx.fillRect(0, -3, 26, 2); ctx.fillRect(0, 1, 26, 2)
      ctx.fillStyle = '#fbbf24'; ctx.fillRect(-2, -4, 5, 8)
    } else if (player.weapon === 'axe') {
      ctx.rotate(-1.0 + frame * 0.3)
      ctx.fillStyle = '#92400e'; ctx.fillRect(0, -1, 28, 3) // handle
      ctx.fillStyle = '#a78bfa'; ctx.fillRect(22, -6, 10, 12) // blade head
      ctx.fillStyle = '#c4b5fd'; ctx.fillRect(24, -4, 6, 8)
    } else if (player.weapon === 'bow') {
      ctx.rotate(-0.3)
      ctx.strokeStyle = '#fb923c'; ctx.lineWidth = 2
      ctx.beginPath(); ctx.arc(10, 0, 14, -1.2, 1.2); ctx.stroke()
      ctx.fillStyle = '#fb923c'; ctx.fillRect(10, -10, 1, 20) // arrow
      ctx.fillStyle = '#ef4444'; ctx.fillRect(10, -12, 3, 4) // arrowhead
    } else if (player.weapon === 'shuriken') {
      const sRot = Date.now() * 0.02
      ctx.translate(16, 0); ctx.rotate(sRot)
      ctx.fillStyle = '#5eead4'
      for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 2); ctx.fillRect(-1, -8, 2, 8); ctx.fillRect(-2, -8, 4, 2) }
      ctx.fillRect(-2, -2, 4, 4)
    } else if (player.weapon === 'hammer') {
      ctx.rotate(-1.2 + frame * 0.25)
      ctx.fillStyle = '#92400e'; ctx.fillRect(0, -1, 24, 3) // handle
      ctx.fillStyle = '#fbbf24'; ctx.fillRect(18, -8, 14, 16) // head
      ctx.fillStyle = '#f59e0b'; ctx.fillRect(20, -6, 10, 12)
    }
    ctx.restore()
    // Slash trail effect
    ctx.strokeStyle = `${wColor}55`; ctx.lineWidth = 2
    ctx.beginPath(); ctx.arc(w + 8, 16, 20 + frame * 2, -1.2, 0.8); ctx.stroke()
  } else {
    // Weapon on back (idle) - varies per weapon
    if (player.weapon === 'sword' || player.weapon === 'dual_swords') {
      ctx.fillStyle = '#64748b'; ctx.fillRect(w - 4, -6, 2, 22)
      ctx.fillStyle = '#fbbf24'; ctx.fillRect(w - 5, 14, 4, 3)
      if (player.weapon === 'dual_swords') { ctx.fillStyle = '#60a5fa'; ctx.fillRect(w - 7, -4, 2, 18) }
    } else if (player.weapon === 'axe') {
      ctx.fillStyle = '#92400e'; ctx.fillRect(w - 4, -4, 2, 20)
      ctx.fillStyle = '#a78bfa'; ctx.fillRect(w - 8, -6, 8, 6)
    } else if (player.weapon === 'bow') {
      ctx.strokeStyle = '#fb923c'; ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.arc(w - 2, 6, 10, -1, 1); ctx.stroke()
    } else if (player.weapon === 'shuriken') {
      ctx.fillStyle = '#5eead4'; ctx.fillRect(w - 6, 0, 4, 4); ctx.fillRect(w - 4, -2, 4, 4)
    } else if (player.weapon === 'hammer') {
      ctx.fillStyle = '#92400e'; ctx.fillRect(w - 3, -2, 2, 16)
      ctx.fillStyle = '#fbbf24'; ctx.fillRect(w - 7, -6, 10, 6)
    }
  }



  // Dash glow
  if (player.dashing) {
    ctx.strokeStyle = `rgba(56,189,248,${0.5 + Math.sin(Date.now() * 0.02) * 0.3})`
    ctx.lineWidth = 3
    ctx.beginPath(); ctx.ellipse(w / 2, h / 2, w / 2 + 8, h / 2 + 6, 0, 0, Math.PI * 2); ctx.stroke()
  }

  // Shield glow
  if (player.shield > 0) {
    ctx.strokeStyle = `rgba(168,85,247,${0.3 + Math.sin(Date.now() * 0.005) * 0.2})`
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.ellipse(w / 2, h / 2, w / 2 + 6, h / 2 + 4, 0, 0, Math.PI * 2)
    ctx.stroke()
  }

  ctx.restore()
}

function drawMonster(m: Monster) {
  if (!ctx) return
  const cx = m.x - camera.x, cy = m.y - camera.y
  if (cx + m.w < -50 || cx > W + 50) return
  const biome = MAP_CONFIGS[currentMapId.value].biome
  ctx.save()
  if (m.facing < 0) { ctx.translate(cx + m.w, cy); ctx.scale(-1, 1) } else { ctx.translate(cx, cy) }
  if (m.hurtTimer > 0) ctx.globalAlpha = 0.6 + Math.sin(m.hurtTimer) * 0.4

  if (m.type === 'slime') {
    const squash = 1 + Math.sin(m.animFrame * 0.15) * 0.1
    ctx.fillStyle = m.color
    ctx.beginPath()
    ctx.ellipse(m.w / 2, m.h - 4, m.w / 2 * squash, m.h / 2 / squash, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(6, m.h / 2 - 6, 3, 4); ctx.fillRect(m.w - 10, m.h / 2 - 6, 3, 4)
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(8, m.h / 2 - 10, 4, 3)
    if (biome === 'desert') {
      ctx.fillStyle = '#92400e'
      ctx.fillRect(m.w / 2 - 1, m.h / 2 - 12, 2, 6)
      ctx.fillRect(m.w / 2 + 4, m.h / 2 - 10, 2, 5)
      ctx.fillRect(m.w / 2 - 6, m.h / 2 - 10, 2, 5)
    } else if (biome === 'ice') {
      ctx.fillStyle = '#e0f2fe'
      ctx.fillRect(m.w / 2 - 3, m.h / 2 - 13, 2, 7)
      ctx.fillRect(m.w / 2 + 1, m.h / 2 - 11, 2, 5)
      ctx.fillStyle = 'rgba(147,197,253,0.4)'
      ctx.beginPath(); ctx.ellipse(m.w / 2, m.h - 4, m.w / 2 * squash + 2, m.h / 2 / squash + 1, 0, 0, Math.PI * 2); ctx.fill()
    } else if (biome === 'volcano') {
      ctx.fillStyle = 'rgba(251,146,60,0.4)'
      ctx.beginPath(); ctx.ellipse(m.w / 2, m.h - 4, m.w / 2 * squash + 3, m.h / 2 / squash + 2, 0, 0, Math.PI * 2); ctx.fill()
      const ft = Date.now() * 0.01
      ctx.fillStyle = '#fbbf24'
      ctx.fillRect(m.w / 2 + Math.sin(ft) * 6, m.h / 2 - 10 + Math.cos(ft) * 2, 2, 3)
    }
  } else if (m.type === 'skeleton') {
    ctx.fillStyle = m.color
    ctx.fillRect(6, 6, m.w - 12, 14); ctx.fillRect(8, 20, m.w - 16, 12)
    const ribColor = biome === 'desert' ? '#c2a23d' : biome === 'ice' ? '#93c5fd' : biome === 'volcano' ? '#64748b' : '#94a3b8'
    ctx.fillStyle = ribColor
    for (let i = 0; i < 3; i++) ctx.fillRect(9, 22 + i * 3, m.w - 18, 1)
    const eyeColor = biome === 'desert' ? '#f59e0b' : biome === 'ice' ? '#38bdf8' : biome === 'volcano' ? '#ef4444' : '#ef4444'
    ctx.fillStyle = eyeColor; ctx.fillRect(9, 10, 3, 3); ctx.fillRect(m.w - 13, 10, 3, 3)
    const lOff = Math.sin(m.animFrame * 0.2) * 3
    ctx.fillStyle = m.color
    ctx.fillRect(8, 32, 4, 6 + lOff); ctx.fillRect(m.w - 12, 32, 4, 6 - lOff)
    const weaponColor = biome === 'desert' ? '#b45309' : biome === 'ice' ? '#60a5fa' : biome === 'volcano' ? '#dc2626' : '#64748b'
    ctx.fillStyle = weaponColor; ctx.fillRect(m.w - 4, 14, 3, 20)
    if (biome === 'desert') {
      ctx.fillStyle = '#f59e0b'; ctx.fillRect(5, 3, m.w - 10, 5); ctx.fillRect(8, 0, 4, 5)
    } else if (biome === 'ice') {
      ctx.fillStyle = '#bae6fd'; ctx.fillRect(6, 18, m.w - 12, 3)
      ctx.fillStyle = 'rgba(147,197,253,0.5)'; ctx.fillRect(4, 8, 2, 8); ctx.fillRect(m.w - 6, 8, 2, 8)
    } else if (biome === 'volcano') {
      ctx.fillStyle = '#f97316'; ctx.fillRect(10, 12, 2, 6); ctx.fillRect(m.w - 13, 14, 2, 4)
      const ft = Date.now() * 0.008
      ctx.fillStyle = '#ef4444'; ctx.fillRect(m.w / 2 + Math.sin(ft) * 5, -2 + Math.cos(ft * 1.5) * 2, 2, 2)
    }
  } else if (m.type === 'demon') {
    ctx.fillStyle = m.color; ctx.fillRect(4, 8, m.w - 8, m.h - 12)
    const hornColor = biome === 'ice' ? '#3b82f6' : biome === 'volcano' ? '#1a1a2e' : '#7f1d1d'
    ctx.fillStyle = hornColor; ctx.fillRect(4, 0, 4, 10); ctx.fillRect(m.w - 8, 0, 4, 10)
    if (biome === 'volcano') { ctx.fillRect(2, -2, 3, 6); ctx.fillRect(m.w - 5, -2, 3, 6) }
    const demonEyeColor = biome === 'ice' ? '#93c5fd' : '#fbbf24'
    ctx.fillStyle = demonEyeColor; ctx.fillRect(10, 14, 4, 4); ctx.fillRect(m.w - 14, 14, 4, 4)
    const wingColor = biome === 'ice' ? '99,102,241' : biome === 'volcano' ? '239,68,68' : '248,113,113'
    const wingAlpha = biome === 'volcano' ? '0.7' : '0.5'
    ctx.fillStyle = `rgba(${wingColor},${wingAlpha})`
    ctx.fillRect(-8, 12, 12, 16); ctx.fillRect(m.w - 4, 12, 12, 16)
    const feetColor = biome === 'ice' ? '#312e81' : biome === 'volcano' ? '#450a0a' : '#991b1b'
    ctx.fillStyle = feetColor; ctx.fillRect(8, m.h - 6, 6, 6); ctx.fillRect(m.w - 14, m.h - 6, 6, 6)
    if (biome === 'ice') {
      ctx.strokeStyle = 'rgba(147,197,253,0.3)'; ctx.lineWidth = 1
      ctx.beginPath(); ctx.ellipse(m.w / 2, m.h / 2, m.w / 2 + 4, m.h / 2 + 2, 0, 0, Math.PI * 2); ctx.stroke()
    } else if (biome === 'volcano') {
      const ft = Date.now() * 0.006; ctx.fillStyle = '#fbbf24'
      for (let i = 0; i < 3; i++) {
        ctx.fillRect(m.w / 2 + Math.sin(ft + i * 2) * (m.w / 2 + 6), m.h / 3 + Math.cos(ft + i * 2.5) * 8, 2, 3)
      }
    }
  } else if (m.type === 'boss') {
    ctx.fillStyle = m.color; ctx.fillRect(6, 10, m.w - 12, m.h - 16)
    const crownColor = biome === 'desert' ? '#f59e0b' : biome === 'ice' ? '#93c5fd' : biome === 'volcano' ? '#ef4444' : '#fbbf24'
    ctx.fillStyle = crownColor
    ctx.fillRect(10, 0, m.w - 20, 6); ctx.fillRect(10, -4, 4, 6)
    ctx.fillRect(m.w / 2 - 2, -6, 4, 8); ctx.fillRect(m.w - 14, -4, 4, 6)
    ctx.fillStyle = '#1a1a2e'; ctx.fillRect(14, 18, 6, 6); ctx.fillRect(m.w - 20, 18, 6, 6)
    ctx.fillStyle = '#ef4444'; ctx.fillRect(16, 30, m.w - 32, 4)
    const auraColor = biome === 'desert' ? 'rgba(245,158,11,0.4)' : biome === 'ice' ? 'rgba(59,130,246,0.4)' : biome === 'volcano' ? 'rgba(239,68,68,0.5)' : 'rgba(168,85,247,0.4)'
    ctx.strokeStyle = auraColor; ctx.lineWidth = 2
    ctx.beginPath(); ctx.ellipse(m.w / 2, m.h / 2, m.w / 2 + 6 + Math.sin(Date.now() * 0.005) * 4, m.h / 2 + 4, 0, 0, Math.PI * 2); ctx.stroke()
    if (biome === 'desert') {
      ctx.fillStyle = '#f59e0b'; ctx.fillRect(4, 4, 4, 14); ctx.fillRect(m.w - 8, 4, 4, 14)
      ctx.fillStyle = '#b45309'; ctx.fillRect(8, 8, m.w - 16, 2)
    } else if (biome === 'ice') {
      ctx.fillStyle = '#e0f2fe'; ctx.fillRect(m.w / 2 - 1, -10, 2, 6); ctx.fillRect(m.w / 2 - 6, -7, 2, 5); ctx.fillRect(m.w / 2 + 4, -7, 2, 5)
    } else if (biome === 'volcano') {
      ctx.fillStyle = '#fb923c'; ctx.fillRect(10, 14, 3, m.h - 24); ctx.fillRect(m.w - 13, 18, 3, m.h - 28)
      const ft = Date.now() * 0.005
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#fbbf24' : '#ef4444'
        ctx.fillRect(m.w / 2 + Math.sin(ft + i * 1.3) * (m.w / 2 + 10), m.h / 3 + Math.cos(ft + i * 1.7) * 12, 2, 3)
      }
    }
  } else if (m.type === 'bat') {
    ctx.fillStyle = m.color
    ctx.beginPath(); ctx.ellipse(m.w / 2, m.h / 2 + 2, 6, 5, 0, 0, Math.PI * 2); ctx.fill()
    const wingAngle = Math.sin(m.animFrame * 0.3) * 0.6
    const wingSize = biome === 'volcano' ? 14 : biome === 'ice' ? 13 : 12
    ctx.save(); ctx.translate(m.w / 2 - 5, m.h / 2); ctx.rotate(-wingAngle)
    ctx.fillStyle = m.color; ctx.fillRect(-wingSize, -3, wingSize, 6)
    if (biome === 'desert') { ctx.fillStyle = 'rgba(146,64,14,0.4)'; ctx.fillRect(-wingSize + 2, -1, wingSize - 4, 2) }
    else if (biome === 'volcano') { ctx.fillStyle = 'rgba(251,146,60,0.5)'; ctx.fillRect(-wingSize + 1, -2, wingSize - 2, 4) }
    ctx.restore()
    ctx.save(); ctx.translate(m.w / 2 + 5, m.h / 2); ctx.rotate(wingAngle)
    ctx.fillStyle = m.color; ctx.fillRect(0, -3, wingSize, 6)
    if (biome === 'desert') { ctx.fillStyle = 'rgba(146,64,14,0.4)'; ctx.fillRect(2, -1, wingSize - 4, 2) }
    else if (biome === 'volcano') { ctx.fillStyle = 'rgba(251,146,60,0.5)'; ctx.fillRect(1, -2, wingSize - 2, 4) }
    ctx.restore()
    const batEyeColor = biome === 'desert' ? '#f59e0b' : biome === 'ice' ? '#93c5fd' : biome === 'volcano' ? '#ef4444' : '#fbbf24'
    ctx.fillStyle = batEyeColor; ctx.fillRect(m.w / 2 - 4, m.h / 2 - 2, 2, 2); ctx.fillRect(m.w / 2 + 2, m.h / 2 - 2, 2, 2)
    ctx.fillStyle = '#fff'; ctx.fillRect(m.w / 2 - 2, m.h / 2 + 4, 1, 2); ctx.fillRect(m.w / 2 + 1, m.h / 2 + 4, 1, 2)
    if (biome === 'ice') { ctx.fillStyle = 'rgba(186,230,253,0.3)'; ctx.fillRect(m.w / 2 - 8, m.h / 2 + 5, 16, 2) }
  } else if (m.type === 'ghost') {
    const ghostAlpha = biome === 'ice' ? 0.45 : biome === 'volcano' ? 0.7 : 0.6
    const wave = Math.sin(Date.now() * 0.003 + m.x * 0.01) * 3
    ctx.globalAlpha = ghostAlpha + Math.sin(Date.now() * 0.004) * 0.15
    ctx.fillStyle = m.color
    ctx.beginPath(); ctx.ellipse(m.w / 2, m.h / 3, m.w / 2, m.h / 3, 0, Math.PI, 0)
    ctx.rect(0, m.h / 3, m.w, m.h / 2); ctx.fill()
    ctx.beginPath()
    for (let i = 0; i <= m.w; i += 4) {
      const yy = m.h - 2 + Math.sin(i * 0.5 + Date.now() * 0.005) * 3
      if (i === 0) ctx.moveTo(i, yy); else ctx.lineTo(i, yy)
    }
    ctx.lineTo(m.w, m.h / 2); ctx.lineTo(0, m.h / 2); ctx.fill()
    const ghostEyeColor = biome === 'desert' ? '#f59e0b' : biome === 'volcano' ? '#ef4444' : '#1a1a2e'
    ctx.fillStyle = ghostEyeColor
    ctx.beginPath(); ctx.ellipse(m.w / 3, m.h / 3 + 2 + wave * 0.3, 3, 4, 0, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.ellipse(m.w * 2 / 3, m.h / 3 + 2 + wave * 0.3, 3, 4, 0, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.ellipse(m.w / 2, m.h / 2 + wave * 0.3, 4, 3, 0, 0, Math.PI); ctx.fill()
    ctx.globalAlpha = 1
    if (biome === 'ice') {
      ctx.fillStyle = '#e0f2fe'; const ft = Date.now() * 0.003
      ctx.fillRect(m.w / 2 + Math.sin(ft) * 10, m.h / 4 + Math.cos(ft) * 6, 2, 2)
      ctx.fillRect(m.w / 2 + Math.cos(ft) * 8, m.h / 2 + Math.sin(ft) * 5, 2, 2)
    } else if (biome === 'volcano') {
      ctx.fillStyle = '#fb923c'; const ft = Date.now() * 0.006
      ctx.fillRect(m.w / 2 + Math.sin(ft) * 8, -4 + Math.cos(ft) * 3, 2, 3)
    }
  }

  // === DESERT MONSTERS ===
  else if (m.type === 'scorpion') {
    // Body segments
    ctx.fillStyle = m.color
    ctx.beginPath(); ctx.ellipse(m.w / 2, m.h - 4, m.w / 2 - 2, 6, 0, 0, Math.PI * 2); ctx.fill()
    // Claws
    const clawAnim = Math.sin(m.animFrame * 0.2) * 3
    ctx.fillStyle = '#b45309'
    ctx.fillRect(2, m.h / 2 - 6 + clawAnim, 6, 4); ctx.fillRect(0, m.h / 2 - 8 + clawAnim, 3, 3)
    ctx.fillRect(m.w - 8, m.h / 2 - 6 - clawAnim, 6, 4); ctx.fillRect(m.w - 3, m.h / 2 - 8 - clawAnim, 3, 3)
    // Tail (curved up)
    const tailSway = Math.sin(m.animFrame * 0.15) * 2
    ctx.fillStyle = '#d97706'
    ctx.fillRect(m.w / 2 - 1, m.h / 2 - 8, 2, 8)
    ctx.fillRect(m.w / 2 - 2 + tailSway, m.h / 2 - 14, 2, 7)
    ctx.fillStyle = '#ef4444'; ctx.fillRect(m.w / 2 - 2 + tailSway, m.h / 2 - 16, 3, 3) // stinger
    // Eyes
    ctx.fillStyle = '#1a1a2e'; ctx.fillRect(m.w / 2 - 5, m.h - 8, 2, 2); ctx.fillRect(m.w / 2 + 3, m.h - 8, 2, 2)
    // Legs
    ctx.fillStyle = '#92400e'
    for (let i = 0; i < 3; i++) {
      const lOff = Math.sin(m.animFrame * 0.25 + i) * 2
      ctx.fillRect(5 + i * 4, m.h - 2 + lOff, 2, 3 + lOff)
      ctx.fillRect(m.w - 7 - i * 4, m.h - 2 - lOff, 2, 3 - lOff)
    }
  } else if (m.type === 'mummy') {
    // Body wrap
    ctx.fillStyle = m.color
    ctx.fillRect(6, 8, m.w - 12, m.h - 12)
    // Bandage lines
    ctx.fillStyle = '#78716c'
    for (let i = 0; i < 6; i++) {
      const bOff = Math.sin(i * 1.2 + m.animFrame * 0.05) * 1
      ctx.fillRect(6 + bOff, 10 + i * 5, m.w - 12, 1)
    }
    // Head shape
    ctx.fillStyle = '#d6d3d1'; ctx.fillRect(8, 4, m.w - 16, 10)
    // Glowing eyes
    const eyeGlow = 0.6 + Math.sin(Date.now() * 0.005) * 0.4
    ctx.fillStyle = `rgba(251,191,36,${eyeGlow})`
    ctx.fillRect(10, 8, 3, 3); ctx.fillRect(m.w - 13, 8, 3, 3)
    // Dangling bandages
    const dangle = Math.sin(Date.now() * 0.004 + m.x) * 3
    ctx.fillStyle = '#a8a29e'
    ctx.fillRect(4, 12, 3, 10 + dangle); ctx.fillRect(m.w - 7, 16, 3, 8 - dangle)
    // Arms reaching forward
    const armSwing = Math.sin(m.animFrame * 0.15) * 4
    ctx.fillStyle = '#d6d3d1'
    ctx.fillRect(m.w - 2, 14 + armSwing, 8, 4); ctx.fillRect(m.w + 4, 12 + armSwing, 3, 3)
    // Legs shuffle
    const lOff = Math.sin(m.animFrame * 0.12) * 3
    ctx.fillStyle = m.color
    ctx.fillRect(8, m.h - 6, 5, 6 + lOff); ctx.fillRect(m.w - 13, m.h - 6, 5, 6 - lOff)
  } else if (m.type === 'sand_worm') {
    // Segmented worm body
    const segments = 5
    const seg = m.w / segments
    for (let i = 0; i < segments; i++) {
      const sy = Math.sin(m.animFrame * 0.2 + i * 0.8) * 4
      const segColor = i === 0 ? '#a16207' : i % 2 === 0 ? m.color : '#b45309'
      ctx.fillStyle = segColor
      ctx.beginPath()
      ctx.ellipse(seg * i + seg / 2, m.h / 2 + sy, seg / 2 + 1, m.h / 2 - 2, 0, 0, Math.PI * 2)
      ctx.fill()
    }
    // Head (first segment)
    ctx.fillStyle = '#78350f'
    ctx.beginPath(); ctx.ellipse(seg / 2, m.h / 2 + Math.sin(m.animFrame * 0.2) * 4, seg / 2 + 3, m.h / 2, 0, 0, Math.PI * 2); ctx.fill()
    // Mouth
    ctx.fillStyle = '#ef4444'
    ctx.beginPath(); ctx.arc(2, m.h / 2 + Math.sin(m.animFrame * 0.2) * 4, 4, -0.8, 0.8); ctx.fill()
    // Eyes
    ctx.fillStyle = '#fbbf24'; ctx.fillRect(4, m.h / 2 - 5 + Math.sin(m.animFrame * 0.2) * 4, 2, 2)
    // Sand particles around
    ctx.fillStyle = 'rgba(202,138,4,0.4)'
    const ft = Date.now() * 0.008
    ctx.fillRect(m.w / 2 + Math.sin(ft) * m.w / 2, m.h + 2, 3, 2)
    ctx.fillRect(m.w / 3 + Math.cos(ft) * 6, m.h + 1, 2, 2)
  }

  // === ICE MONSTERS ===
  else if (m.type === 'ice_golem') {
    // Blocky body
    ctx.fillStyle = m.color
    ctx.fillRect(4, 12, m.w - 8, m.h - 16)
    // Frost crystal head
    ctx.fillStyle = '#bfdbfe'; ctx.fillRect(6, 2, m.w - 12, 14)
    ctx.fillStyle = '#dbeafe'; ctx.fillRect(8, 0, 4, 6); ctx.fillRect(m.w - 12, 0, 4, 6)
    // Crystal crown
    ctx.fillStyle = '#e0f2fe'
    ctx.fillRect(m.w / 2 - 2, -6, 4, 8); ctx.fillRect(m.w / 2 - 6, -3, 3, 5); ctx.fillRect(m.w / 2 + 3, -3, 3, 5)
    // Eyes (glowing blue)
    const iceGlow = 0.7 + Math.sin(Date.now() * 0.004) * 0.3
    ctx.fillStyle = `rgba(59,130,246,${iceGlow})`
    ctx.fillRect(10, 8, 4, 4); ctx.fillRect(m.w - 14, 8, 4, 4)
    // Ice texture lines
    ctx.fillStyle = 'rgba(219,234,254,0.4)'
    ctx.fillRect(8, 18, m.w - 16, 1); ctx.fillRect(10, 26, m.w - 20, 1); ctx.fillRect(8, 34, m.w - 16, 1)
    // Arms (blocky)
    const armSwing2 = Math.sin(m.animFrame * 0.1) * 3
    ctx.fillStyle = '#93c5fd'
    ctx.fillRect(-4, 16 + armSwing2, 8, 6); ctx.fillRect(m.w - 4, 16 - armSwing2, 8, 6)
    ctx.fillStyle = '#60a5fa'; ctx.fillRect(-2, 20 + armSwing2, 6, 8); ctx.fillRect(m.w - 4, 20 - armSwing2, 6, 8)
    // Legs
    ctx.fillStyle = m.color
    ctx.fillRect(8, m.h - 6, 6, 6); ctx.fillRect(m.w - 14, m.h - 6, 6, 6)
    // Frost particles
    ctx.fillStyle = '#e0f2fe'
    const ift = Date.now() * 0.003
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(m.w / 2 + Math.sin(ift + i * 2) * (m.w / 2 + 4), Math.cos(ift + i * 2) * m.h / 2 + m.h / 3, 2, 2)
    }
  } else if (m.type === 'yeti') {
    // Furry body
    ctx.fillStyle = m.color
    ctx.fillRect(4, 10, m.w - 8, m.h - 14)
    // Fur texture
    ctx.fillStyle = '#f1f5f9'
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(6 + i * 5, 12, 2, m.h - 20)
    }
    // Head
    ctx.fillStyle = '#e2e8f0'; ctx.fillRect(6, 2, m.w - 12, 14)
    // Horns
    ctx.fillStyle = '#94a3b8'; ctx.fillRect(4, -2, 4, 8); ctx.fillRect(m.w - 8, -2, 4, 8)
    // Angry eyes
    ctx.fillStyle = '#ef4444'; ctx.fillRect(10, 6, 4, 3); ctx.fillRect(m.w - 14, 6, 4, 3)
    ctx.fillStyle = '#1a1a2e'; ctx.fillRect(11, 7, 2, 2); ctx.fillRect(m.w - 13, 7, 2, 2)
    // Mouth/roar
    const roar = Math.sin(m.animFrame * 0.15) > 0.5
    if (roar) {
      ctx.fillStyle = '#1a1a2e'; ctx.fillRect(12, 12, m.w - 24, 3)
      ctx.fillStyle = '#fff'; ctx.fillRect(13, 12, 2, 2); ctx.fillRect(m.w - 15, 12, 2, 2) // fangs
    }
    // Big arms
    const yArmSwing = Math.sin(m.animFrame * 0.15) * 5
    ctx.fillStyle = '#d1d5db'
    ctx.fillRect(-4, 14 + yArmSwing, 8, 12); ctx.fillRect(m.w - 4, 14 - yArmSwing, 8, 12)
    ctx.fillStyle = '#e2e8f0'; ctx.fillRect(-2, 24 + yArmSwing, 6, 5); ctx.fillRect(m.w - 4, 24 - yArmSwing, 6, 5) // fists
    // Legs
    const yLeg = Math.sin(m.animFrame * 0.15) * 3
    ctx.fillStyle = '#d1d5db'
    ctx.fillRect(8, m.h - 6, 7, 6 + yLeg); ctx.fillRect(m.w - 15, m.h - 6, 7, 6 - yLeg)
    // Snow dust
    if (m.state === 'chase') {
      ctx.fillStyle = 'rgba(241,245,249,0.5)'
      ctx.fillRect(m.w / 2 - 4 + Math.random() * 8, m.h + 1, 2, 2)
    }
  } else if (m.type === 'frost_spirit') {
    // Ethereal ice form
    const wave = Math.sin(Date.now() * 0.004 + m.x * 0.01) * 3
    ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.005) * 0.2
    // Core body glow
    ctx.fillStyle = 'rgba(191,219,254,0.6)'
    ctx.beginPath(); ctx.ellipse(m.w / 2, m.h / 2 + wave, m.w / 2 + 4, m.h / 2 + 2, 0, 0, Math.PI * 2); ctx.fill()
    // Inner core
    ctx.fillStyle = m.color
    ctx.beginPath(); ctx.ellipse(m.w / 2, m.h / 2 + wave, m.w / 3, m.h / 3, 0, 0, Math.PI * 2); ctx.fill()
    // Ice crystal core
    ctx.fillStyle = '#e0f2fe'
    ctx.fillRect(m.w / 2 - 2, m.h / 3 + wave - 4, 4, 8); ctx.fillRect(m.w / 2 - 4, m.h / 3 + wave - 1, 8, 3)
    // Eyes
    ctx.fillStyle = '#3b82f6'
    ctx.fillRect(m.w / 3, m.h / 3 + wave, 3, 3); ctx.fillRect(m.w * 2 / 3 - 2, m.h / 3 + wave, 3, 3)
    // Floating ice shards
    const ft2 = Date.now() * 0.004
    ctx.fillStyle = '#bfdbfe'
    for (let i = 0; i < 4; i++) {
      const sx = m.w / 2 + Math.cos(ft2 + i * 1.6) * (m.w / 2 + 6)
      const sy = m.h / 2 + Math.sin(ft2 + i * 1.6) * (m.h / 2 + 4) + wave
      ctx.fillRect(sx - 1, sy - 1, 2, 3)
    }
    ctx.globalAlpha = 1
  }

  // === VOLCANO MONSTERS ===
  else if (m.type === 'lava_snake') {
    // Segmented snake
    const segments2 = 6
    const segW = m.w / segments2
    for (let i = 0; i < segments2; i++) {
      const sy2 = Math.sin(m.animFrame * 0.25 + i * 0.7) * 3
      ctx.fillStyle = i % 2 === 0 ? m.color : '#dc2626'
      ctx.beginPath(); ctx.ellipse(segW * i + segW / 2, m.h / 2 + sy2, segW / 2 + 1, m.h / 2 - 1, 0, 0, Math.PI * 2); ctx.fill()
    }
    // Head
    ctx.fillStyle = '#b91c1c'
    ctx.beginPath(); ctx.ellipse(segW / 2, m.h / 2 + Math.sin(m.animFrame * 0.25) * 3, segW / 2 + 3, m.h / 2 + 1, 0, 0, Math.PI * 2); ctx.fill()
    // Flame eyes
    const fGlow = 0.7 + Math.sin(Date.now() * 0.008) * 0.3
    ctx.fillStyle = `rgba(251,191,36,${fGlow})`
    ctx.fillRect(4, m.h / 2 - 4 + Math.sin(m.animFrame * 0.25) * 3, 3, 3)
    ctx.fillRect(4, m.h / 2 + 1 + Math.sin(m.animFrame * 0.25) * 3, 3, 2)
    // Tongue
    ctx.fillStyle = '#fbbf24'
    const tongueLen = Math.sin(m.animFrame * 0.3) * 4 + 3
    ctx.fillRect(-tongueLen, m.h / 2 - 1 + Math.sin(m.animFrame * 0.25) * 3, tongueLen, 1)
    // Fire trail
    ctx.fillStyle = 'rgba(251,146,60,0.4)'
    const lft = Date.now() * 0.01
    ctx.fillRect(m.w - 2 + Math.sin(lft) * 3, m.h / 2 - 2, 3, 4)
    ctx.fillRect(m.w + Math.cos(lft) * 2, m.h / 2, 2, 3)
  } else if (m.type === 'fire_elemental') {
    // Flame body (animated)
    const flameTime = Date.now() * 0.008
    ctx.fillStyle = m.color
    ctx.beginPath(); ctx.ellipse(m.w / 2, m.h / 2 + 4, m.w / 2 - 2, m.h / 2 - 4, 0, 0, Math.PI * 2); ctx.fill()
    // Inner flame
    ctx.fillStyle = '#fbbf24'
    ctx.beginPath(); ctx.ellipse(m.w / 2, m.h / 2 + 2, m.w / 3, m.h / 3, 0, 0, Math.PI * 2); ctx.fill()
    // Core
    ctx.fillStyle = '#fef3c7'
    ctx.beginPath(); ctx.ellipse(m.w / 2, m.h / 2, m.w / 5, m.h / 5, 0, 0, Math.PI * 2); ctx.fill()
    // Flame tips on top
    for (let i = 0; i < 4; i++) {
      const fx = m.w / 5 + i * (m.w / 5)
      const fh = 6 + Math.sin(flameTime + i * 1.5) * 5
      ctx.fillStyle = i % 2 === 0 ? '#ef4444' : '#f97316'
      ctx.fillRect(fx - 1, 2 - fh, 3, fh)
    }
    // Eyes (dark)
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(m.w / 3, m.h / 3 + 2, 3, 4); ctx.fillRect(m.w * 2 / 3 - 2, m.h / 3 + 2, 3, 4)
    // Ember particles
    ctx.fillStyle = '#fbbf24'
    for (let i = 0; i < 4; i++) {
      const ex = m.w / 2 + Math.sin(flameTime + i * 1.7) * (m.w / 2 + 8)
      const ey = m.h / 4 + Math.cos(flameTime + i * 2.1) * m.h / 3
      ctx.fillRect(ex - 1, ey - 1, 2, 2)
    }
  } else if (m.type === 'magma_golem') {
    // Large rocky body
    ctx.fillStyle = m.color
    ctx.fillRect(4, 10, m.w - 8, m.h - 14)
    // Rock texture
    ctx.fillStyle = '#44403c'
    ctx.fillRect(8, 14, 6, 6); ctx.fillRect(m.w - 14, 20, 5, 5); ctx.fillRect(12, 30, 7, 5)
    // Head
    ctx.fillStyle = '#292524'; ctx.fillRect(8, 2, m.w - 16, 12)
    // Lava cracks (glowing)
    const lavaGlow = 0.6 + Math.sin(Date.now() * 0.003) * 0.4
    ctx.fillStyle = `rgba(251,146,60,${lavaGlow})`
    ctx.fillRect(10, 8, m.w - 20, 2) // face crack
    ctx.fillRect(6, 20, 2, m.h - 28); ctx.fillRect(m.w - 8, 18, 2, m.h - 26) // body cracks
    ctx.fillRect(12, 28, m.w - 24, 2); ctx.fillRect(10, 38, m.w - 20, 2) // horizontal cracks
    // Lava eyes
    ctx.fillStyle = `rgba(239,68,68,${lavaGlow})`
    ctx.fillRect(12, 5, 5, 4); ctx.fillRect(m.w - 17, 5, 5, 4)
    // Fists
    const mgArmSwing = Math.sin(m.animFrame * 0.1) * 4
    ctx.fillStyle = '#1c1917'
    ctx.fillRect(-6, 14 + mgArmSwing, 10, 10)
    ctx.fillRect(m.w - 4, 14 - mgArmSwing, 10, 10)
    ctx.fillStyle = `rgba(251,146,60,${lavaGlow * 0.5})`
    ctx.fillRect(-4, 18 + mgArmSwing, 6, 3); ctx.fillRect(m.w - 2, 18 - mgArmSwing, 6, 3)
    // Legs
    ctx.fillStyle = '#292524'
    ctx.fillRect(8, m.h - 6, 8, 6); ctx.fillRect(m.w - 16, m.h - 6, 8, 6)
    // Molten drips
    ctx.fillStyle = '#fb923c'
    const mft = Date.now() * 0.004
    ctx.fillRect(m.w / 2 + Math.sin(mft) * 4, m.h - 2, 2, 3 + Math.sin(mft) * 2)
  }

  ctx.restore()

  // HP bar
  if (m.hp < m.maxHp) {
    const bw = m.w + 8
    ctx.fillStyle = '#1a1a2e'; ctx.fillRect(cx - 4, cy - 10, bw, 4)
    ctx.fillStyle = m.hp > m.maxHp * 0.3 ? '#ef4444' : '#fbbf24'
    ctx.fillRect(cx - 4, cy - 10, bw * (m.hp / m.maxHp), 4)
  }
}

// ===== BACKGROUND (data from map.ts) =====
let stars: { x: number; y: number; s: number; b: number }[] = []
let bgTrees: { x: number; h: number; w: number }[] = []
let bgMountains: { x: number; h: number; w: number }[] = []

function initBackground() {
  const bg = generateBackground(W, H)
  stars = bg.stars; bgTrees = bg.bgTrees; bgMountains = bg.bgMountains
}

function drawBackground() {
  if (!ctx) return
  const biome = BIOMES[MAP_CONFIGS[currentMapId.value].biome]
  const skyGrad = ctx.createLinearGradient(0, 0, 0, H)
  biome.skyColors.forEach((c, i) => skyGrad.addColorStop(i / (biome.skyColors.length - 1), c))
  ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, W, H)

  for (const s of stars) {
    const tw = 0.5 + Math.sin(Date.now() * 0.003 + s.b * 10) * 0.5
    ctx.fillStyle = `rgba(255,255,255,${tw * 0.8})`; ctx.fillRect(s.x, s.y, s.s, s.s)
  }
  // Moon
  ctx.fillStyle = biome.moonColor; ctx.beginPath(); ctx.arc(W - 120, 80, 35, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = biome.skyColors[0]!; ctx.beginPath(); ctx.arc(W - 108, 72, 30, 0, Math.PI * 2); ctx.fill()

  // Mountains
  const mOff = camera.x * 0.15
  ctx.fillStyle = biome.mountainColor
  for (const m of bgMountains) {
    const mx = m.x - mOff % 4000
    ctx.beginPath(); ctx.moveTo(mx, H - 48); ctx.lineTo(mx + m.w / 2, H - 48 - m.h); ctx.lineTo(mx + m.w, H - 48); ctx.fill()
  }
  // Trees
  const tOff = camera.x * 0.3
  for (const t of bgTrees) {
    const tx = t.x - tOff % 3600
    ctx.fillStyle = biome.treeTrunk; ctx.fillRect(tx + t.w / 2 - 3, H - 48 - t.h * 0.4, 6, t.h * 0.4)
    ctx.fillStyle = biome.treeColor
    ctx.beginPath(); ctx.moveTo(tx, H - 48 - t.h * 0.3); ctx.lineTo(tx + t.w / 2, H - 48 - t.h); ctx.lineTo(tx + t.w, H - 48 - t.h * 0.3); ctx.fill()
  }
  // Biome ambient particles
  if (getBiomeForLevel(level.value) === 'ice') {
    for (let i = 0; i < 5; i++) {
      const sx = (Date.now() * 0.02 + i * 200) % W
      const sy = (Date.now() * 0.03 + i * 150) % (H - 60)
      ctx.fillStyle = 'rgba(200,230,255,0.5)'; ctx.fillRect(sx, sy, 2, 2)
    }
  } else if (getBiomeForLevel(level.value) === 'volcano') {
    for (let i = 0; i < 3; i++) {
      const sx = (Date.now() * 0.01 + i * 300) % W
      const sy = H - 60 - ((Date.now() * 0.02 + i * 200) % 80)
      ctx.fillStyle = `rgba(239,68,68,${0.3 + Math.sin(Date.now() * 0.005 + i) * 0.2})`; ctx.fillRect(sx, sy, 3, 3)
    }
  }
}

function drawPlatforms() {
  if (!ctx) return
  const biome = BIOMES[MAP_CONFIGS[currentMapId.value].biome]
  for (const p of platforms) {
    const px = p.x - camera.x, py = p.y - camera.y
    if (px + p.w < -10 || px > W + 10) continue
    if (p.type === 'ground') {
      ctx.fillStyle = biome.groundColor; ctx.fillRect(px, py, Math.min(p.w, W + 20), p.h)
      ctx.fillStyle = biome.grassColor; ctx.fillRect(px, py, Math.min(p.w, W + 20), 4)
      ctx.fillStyle = biome.grassColor2; ctx.fillRect(px, py + 4, Math.min(p.w, W + 20), 2)
    } else {
      ctx.fillStyle = biome.platformColor; ctx.fillRect(px, py, p.w, p.h)
      ctx.fillStyle = biome.platformTop; ctx.fillRect(px, py, p.w, 3)
    }
  }
}

// ===== UPDATES =====
function updatePlayer() {
  if (showInventory.value) return

  // Equipment bonuses
  const eqBonus = calcEquipmentBonuses(player.equipment)
  player.defense = eqBonus.def
  player.critChance = PLAYER_BASE_CRIT + eqBonus.critChance

  const spd = player.speed + player.speedBoost * SPEED_BOOST_MULT + eqBonus.speed
  let moving = false
  if (keys['ArrowLeft'] || keys['KeyA']) { player.vx = -spd; player.facing = -1; moving = true }
  else if (keys['ArrowRight'] || keys['KeyD']) { player.vx = spd; player.facing = 1; moving = true }
  else { player.vx *= 0.7; if (Math.abs(player.vx) < 0.1) player.vx = 0 }

  // Double jump + Wings
  if (keyJustPressed['ArrowUp'] || keyJustPressed['KeyW'] || keyJustPressed['Space']) {
    if (player.jumpCount < player.maxJumps && !player.attacking) {
      // Wings reduce gravity on extra jumps
      let jumpForce = player.jumpPower
      if (equippedWing && player.jumpCount >= MAX_JUMPS) {
        jumpForce = player.jumpPower * (1 - equippedWing.floatReduction * 0.5)
        flyTimer = equippedWing.flyDuration
        spawnParticles(player.x + player.w / 2, player.y + player.h, equippedWing.color, 8, 3)
      }
      player.vy = jumpForce
      player.onGround = false
      player.jumpCount++
      sfxJump()
      if (player.jumpCount >= 2) {
        spawnParticles(player.x + player.w / 2, player.y + player.h, '#94a3b8', 5, 2)
      }
    }
  }
  // Clear just pressed flags
  for (const k in keyJustPressed) delete keyJustPressed[k]

  // Reset jump count when on ground
  if (player.onGround) { player.jumpCount = 0; flyTimer = 0 }

  // Wing hover: reduce gravity while flying
  if (flyTimer > 0 && !player.onGround) {
    flyTimer--
    if (player.vy > 0) player.vy *= (1 - (equippedWing?.floatReduction ?? 0))
  }

  // Attack with weapon stats
  const wCfg = WEAPONS[player.weapon]
  const atkCooldown = Math.max(ATTACK_COOLDOWN_MIN, ATTACK_COOLDOWN_BASE + wCfg.speed)
  if ((keys['KeyZ'] || keys['KeyJ']) && player.attackCooldown <= 0 && !player.attacking) {
    player.attacking = true; player.attackTimer = ATTACK_TIMER; player.attackCooldown = atkCooldown; player.attackFrame = 0; sfxAttack()
    // Spawn weapon projectiles for ranged weapons
    const proj = createWeaponProjectile(player, player.weapon)
    if (proj) projectiles.push(proj)
  }

  if (player.attacking) {
    player.attackTimer--; player.attackFrame++
    if (player.attackTimer <= 0) player.attacking = false
    const range = wCfg.range
    const atkBox = { x: player.facing > 0 ? player.x + player.w : player.x - range, y: player.y - ATTACK_HITBOX_PAD_Y, w: range, h: player.h + ATTACK_HITBOX_PAD_H }
    for (const m of monsters) {
      if (m.dead || m.hurtTimer > 0) continue
      if (rectCollide(atkBox, m)) {
        const isCrit = Math.random() * 100 < player.critChance
        const passives = getActivePassives(player.equipment)
        // Combo damage scaling: +5% per combo hit, max 2x
        const comboMult = Math.min(COMBO_MAX_MULT, 1 + combo.value * COMBO_DMG_SCALE)
        let dmg = Math.floor((wCfg.damage + player.baseAtk + level.value * DAMAGE_LEVEL_SCALE + player.atkBoost * DAMAGE_ATK_BOOST_MULT + eqBonus.atk + Math.random() * DAMAGE_VARIANCE) * comboMult)
        const critMult = passives.includes('crit_burst') ? CRIT_MULT_BURST : CRIT_MULT_DEFAULT
        if (isCrit) dmg = Math.floor(dmg * critMult)
        // Lightning passive: 15% bonus lightning damage
        if (passives.includes('lightning') && Math.random() < LIGHTNING_CHANCE) {
          const lightningDmg = Math.floor(dmg * LIGHTNING_MULT)
          dmg += lightningDmg
          spawnFloatingText(m.x + m.w / 2, m.y - 26, `⚡ ${lightningDmg}`, '#fbbf24', 14)
          spawnParticles(m.x + m.w / 2, m.y, '#fbbf24', 12, 5)
        }
        m.hp -= dmg; m.hurtTimer = HURT_TIMER_FRAMES; m.vx = player.facing * MONSTER_HIT_KNOCKBACK; m.vy = m.flying ? -2 : -3
        spawnParticles(m.x + m.w / 2, m.y + m.h / 2, wCfg.color, 8, 4)
        spawnFloatingText(m.x + m.w / 2, m.y - 10, isCrit ? `💥 ${dmg}` : `-${dmg}`, isCrit ? '#ff6b6b' : '#fbbf24', isCrit ? 18 : 14)
        // === SCREEN SHAKE (always) + HIT-STOP (only if not already frozen) ===
        screenShake.intensity = Math.max(screenShake.intensity, isCrit ? SHAKE_INTENSITY_CRIT : SHAKE_INTENSITY_HIT)

        // Lifesteal passive: heal 8% of damage
        if (passives.includes('lifesteal') && playerHp.value < playerMaxHp.value) {
          const heal = Math.max(1, Math.floor(dmg * LIFESTEAL_PERCENT))
          playerHp.value = Math.min(playerHp.value + heal, playerMaxHp.value)
          spawnFloatingText(player.x + player.w / 2, player.y - 10, `🩸 +${heal}`, '#4ade80', 10)
        }
        combo.value++; comboTimer = 0; sfxHit()
        if (combo.value > 1) spawnFloatingText(player.x + player.w / 2, player.y - 30, `${combo.value} HIT! x${comboMult.toFixed(1)}`, '#f97316', 12 + Math.min(combo.value, 10))
        if (m.hp <= 0) {
          m.dead = true; killCount.value++
          // Boss kill = mega shake
          if (m.type === 'boss') { screenShake.intensity = SHAKE_INTENSITY_BOSS }
          const sc = Math.floor(m.scoreValue * (1 + combo.value * SCORE_COMBO_SCALE))
          score.value += sc; playerExp.value += m.exp; sfxKill()
          spawnFloatingText(m.x + m.w / 2, m.y - 20, `+${sc}`, '#4ade80', 16)
          spawnParticles(m.x + m.w / 2, m.y + m.h / 2, m.color, 20, 6)
          // Drop items
          if (Math.random() < CHEST_DROP_CHANCE) chests.push(createChest(m.x, m.y + m.h))
          if (Math.random() < WEAPON_DROP_CHANCE) weaponDrops.push(createWeaponDrop(m.x + m.w / 2 - 10, m.y))
          // Equipment drop
          if (Math.random() < EQUIP_DROP_CHANCE) {
            const eq = getRandomEquipment(m.type)
            equipmentDrops.push(createEquipmentDrop(m.x + m.w / 2, m.y, eq))
          }
          // Consumable drop
          if (Math.random() < CONSUMABLE_DROP_CHANCE) {
            const cType = Math.random() < 0.5 ? 'hp_potion' : 'mp_potion'
            const existing = consumables.find(c => c.type === cType)
            if (existing) existing.count++
            else consumables.push({ type: cType as ConsumableType, count: 1 })
            spawnFloatingText(m.x + m.w / 2, m.y, cType === 'hp_potion' ? '❤️ +1 HP Potion' : '💙 +1 MP Potion', cType === 'hp_potion' ? '#ef4444' : '#3b82f6', 12)
          }
          // === GOLD DROP ===
          const goldAmount = monsterGoldDrop(m.type, level.value)
          playerGold.value += goldAmount
          spawnFloatingText(m.x + m.w / 2, m.y - 30, `+${goldAmount}💰`, '#fbbf24', 11)
          // === MATERIAL DROP ===
          const matDrop = rollMaterialDrop(m.type)
          if (matDrop) {
            materialInventory[matDrop]++
            spawnFloatingText(m.x + m.w / 2, m.y - 45, `${MATERIALS[matDrop].icon} +1`, MATERIALS[matDrop].color, 13)
          }
          // === WING DROP ===
          const wingDrop = getRandomWingDrop(m.type)
          if (wingDrop && !ownedWings.includes(wingDrop)) {
            ownedWings.push(wingDrop)
            const wCfg = WINGS[wingDrop]
            spawnFloatingText(m.x + m.w / 2, m.y - 60, `${wCfg.icon} ${wCfg.name}!`, wCfg.color, 16)
            spawnParticles(m.x + m.w / 2, m.y, wCfg.color, 20, 6)
          }
          // === MAP UNLOCK ON BOSS KILL ===
          if (m.type === 'boss' && currentMapId.value !== 'hub') {
            const mapUnlockOrder: MapId[] = ['forest', 'desert', 'ice', 'volcano']
            const currentIdx = mapUnlockOrder.indexOf(currentMapId.value)
            if (currentIdx >= 0 && currentIdx < mapUnlockOrder.length - 1) {
              const nextMap = mapUnlockOrder[currentIdx + 1]!
              if (!unlockedMaps.value.includes(nextMap)) {
                unlockedMaps.value.push(nextMap)
                const nextCfg = MAP_CONFIGS[nextMap]
                spawnFloatingText(player.x + player.w / 2, player.y - 80, `🔓 ${nextCfg.name} đã mở!`, '#818cf8', 20)
              }
            }
          }
          if (playerExp.value >= playerExpMax.value) levelUp()
        }
      }
    }
  }

  if (player.attackCooldown > 0) player.attackCooldown--
  if (player.invincible > 0) player.invincible--
  // Combo timer - reset combo if no hit for COMBO_TIMEOUT frames
  comboTimer++
  if (comboTimer > COMBO_TIMEOUT) { combo.value = 0; comboTimer = 0 }

  // Effects decay
  if (player.atkBoost > 0) player.atkBoost -= EFFECT_DECAY_RATE
  if (player.speedBoost > 0) player.speedBoost -= EFFECT_DECAY_RATE
  if (player.shield > 0) player.shield -= EFFECT_DECAY_RATE
  if (player.atkBoost < 0) player.atkBoost = 0
  if (player.speedBoost < 0) player.speedBoost = 0
  if (player.shield < 0) player.shield = 0

  // Mana regen
  const manaRegenRate = player.manaRegen + eqBonus.manaRegen
  if (playerMp.value < playerMaxMp.value) {
    playerMp.value = Math.min(playerMp.value + manaRegenRate, playerMaxMp.value)
  }
  // Skill cooldowns
  for (const sk of ['dash', 'heal', 'ultimate'] as SkillType[]) {
    if (player.skillCooldowns[sk] > 0) player.skillCooldowns[sk]--
  }
  // Dash timer
  if (player.dashing) {
    player.dashTimer--
    if (player.dashTimer <= 0) player.dashing = false
  }

  player.state = player.attacking ? 'attack' : !player.onGround ? 'jump' : moving ? 'run' : 'idle'
  player.animTimer++
  if (player.animTimer >= 6) { player.animTimer = 0; player.animFrame++ }
  _resolveGravity(player)

  // Pick up weapon drops
  for (let i = weaponDrops.length - 1; i >= 0; i--) {
    const d = weaponDrops[i]!
    if (rectCollide(player, d)) {
      if (!inventory.includes(d.weapon)) {
        inventory.push(d.weapon)
        spawnFloatingText(d.x + d.w / 2, d.y - 20, `${WEAPONS[d.weapon].icon} ${WEAPONS[d.weapon].name}!`, WEAPONS[d.weapon].color, 16)
        sfxChestOpen()
      } else {
        spawnFloatingText(d.x + d.w / 2, d.y - 20, 'Đã có!', '#94a3b8', 12)
        sfxItem()
      }
      spawnParticles(d.x + d.w / 2, d.y + d.h / 2, WEAPONS[d.weapon].color, 12, 4)
      weaponDrops.splice(i, 1)
    }
  }

  // Pick up equipment drops
  for (let i = equipmentDrops.length - 1; i >= 0; i--) {
    const d = equipmentDrops[i]!
    if (rectCollide(player, d)) {
      const eq = d.equipment
      const currentEquip = player.equipment[eq.slot]
      if (!currentEquip) {
        // Auto equip if slot empty
        player.equipment[eq.slot] = eq
        spawnFloatingText(d.x + d.w / 2, d.y - 20, `${eq.icon} ${eq.name} trang bị!`, RARITY_COLORS[eq.rarity], 16)
      } else {
        // Add to inventory
        equipInventory.push(eq)
        spawnFloatingText(d.x + d.w / 2, d.y - 20, `${eq.icon} ${eq.name} → kho!`, RARITY_COLORS[eq.rarity], 14)
      }
      sfxChestOpen()
      spawnParticles(d.x + d.w / 2, d.y + d.h / 2, RARITY_COLORS[eq.rarity], 15, 5)
      equipmentDrops.splice(i, 1)
    }
  }
}

function updateMonsters() {
  // Zone-based spawn - mỗi zone quản lý timer riêng
  spawnMonster()
  for (let i = monsters.length - 1; i >= 0; i--) {
    const m = monsters[i]!
    if (m.dead) { monsters.splice(i, 1); continue }
    const dx = player.x - m.x
    const dy = player.y - m.y
    const distX = Math.abs(dx)
    const distY = Math.abs(dy)
    m.facing = dx > 0 ? 1 : -1

    if (m.hurtTimer > 0) { m.hurtTimer--; m.state = 'hurt'; m.vx *= FRICTION }
    // === BOSS MULTI-PHASE BEHAVIOR ===
    else if (m.type === 'boss') {
      const hpRatio = m.hp / m.maxHp
      const phase = hpRatio <= BOSS_PHASE3_HP ? 3 : hpRatio <= BOSS_PHASE2_HP ? 2 : 1
      // Phase visual effects (particles only, no stat overrides)
      if (phase >= 2 && Math.random() < 0.03) spawnParticles(m.x + m.w / 2, m.y, '#fbbf24', 2, 3)
      if (phase >= 3 && Math.random() < 0.06) spawnParticles(m.x + m.w / 2, m.y, '#ef4444', 3, 4)
      // Boss speed scales with phase
      const phaseSpeedMult = phase === 3 ? BOSS_PHASE3_SPEED : phase === 2 ? BOSS_PHASE2_SPEED : BOSS_PHASE1_SPEED
      const phaseCooldown = phase === 3 ? BOSS_PHASE3_COOLDOWN : phase === 2 ? BOSS_PHASE2_COOLDOWN : BOSS_PHASE1_COOLDOWN

      if (m.attackTimer > 0) { m.attackTimer--; m.state = 'attack'; m.vx = 0 }
      else if (distX < 45 && distY < 40 && m.attackCooldown <= 0 && player.invincible <= 0) {
        m.attackTimer = MONSTER_ATTACK_TIMER; m.attackCooldown = phaseCooldown
        const rawDmg = player.shield > 0 ? Math.floor(m.damage * SHIELD_DAMAGE_MULT) : m.damage
        const passives = getActivePassives(player.equipment)
        let dmg = Math.max(1, rawDmg - player.defense)
        if (passives.includes('mana_shield') && playerMp.value > 0) {
          const absorbed = Math.floor(dmg * MANA_SHIELD_REDUCTION); dmg -= absorbed
          playerMp.value = Math.max(0, playerMp.value - absorbed * MANA_SHIELD_COST_MULT)
        }
        if (!isAdmin) {
          playerHp.value -= dmg; player.invincible = INVINCIBLE_FRAMES; player.vx = -m.facing * KNOCKBACK_VX; player.vy = KNOCKBACK_VY
          spawnParticles(player.x + player.w / 2, player.y + player.h / 2, '#ef4444', 10, 5)
          spawnFloatingText(player.x + player.w / 2, player.y - 10, `-${dmg}`, '#ef4444', 16)
          sfxPlayerHurt(); screenShake.intensity = SHAKE_INTENSITY_CRIT
        } else {
          // Admin: bất tử - chỉ hiệu ứng visual
          player.invincible = 10
          spawnFloatingText(player.x + player.w / 2, player.y - 10, '🛡️ Bất Tử!', '#fbbf24', 12)
        }
        if (passives.includes('thorns') && !m.dead) {
          const thornsDmg = Math.max(1, Math.floor(rawDmg * THORNS_PERCENT))
          m.hp -= thornsDmg; m.hurtTimer = MINOR_HURT_TIMER
          spawnFloatingText(m.x + m.w / 2, m.y - 10, `🌵 ${thornsDmg}`, '#4ade80', 12)
        }
        if (!isAdmin && playerHp.value <= 0) { playerHp.value = 0; gameState.value = 'gameover'; sfxGameOver(); handleGameOver() }
      } else {
        m.state = 'chase'; m.vx = m.facing * m.speed * phaseSpeedMult
        if (m.attackCooldown > 0) m.attackCooldown--
      }
    }
    else if (m.attackTimer > 0) { m.attackTimer--; m.state = 'attack'; m.vx = 0 }
    else if (distX < 35 && distY < 30) {
      // FIX: check BOTH horizontal AND vertical distance before attacking
      if (m.attackCooldown <= 0 && player.invincible <= 0) {
        m.attackTimer = MONSTER_ATTACK_TIMER; m.attackCooldown = MONSTER_ATTACK_COOLDOWN
        const rawDmg = player.shield > 0 ? Math.floor(m.damage * SHIELD_DAMAGE_MULT) : m.damage
        const passives = getActivePassives(player.equipment)
        let dmg = Math.max(1, rawDmg - player.defense)
        // Mana Shield passive: 10% dmg reduction, absorb via MP
        if (passives.includes('mana_shield') && playerMp.value > 0) {
          const absorbed = Math.floor(dmg * MANA_SHIELD_REDUCTION)
          dmg -= absorbed
          playerMp.value = Math.max(0, playerMp.value - absorbed * MANA_SHIELD_COST_MULT)
          spawnFloatingText(player.x + player.w / 2, player.y, `🛡 -${absorbed}`, '#818cf8', 10)
        }
        if (!isAdmin) {
          playerHp.value -= dmg; player.invincible = INVINCIBLE_FRAMES; player.vx = -m.facing * KNOCKBACK_VX; player.vy = KNOCKBACK_VY
          spawnParticles(player.x + player.w / 2, player.y + player.h / 2, '#ef4444', 10, 5)
          spawnFloatingText(player.x + player.w / 2, player.y - 10, `-${dmg}`, player.shield > 0 ? '#a855f7' : '#ef4444', 16)
          sfxPlayerHurt()
          screenShake.intensity = SHAKE_INTENSITY_CRIT
        } else {
          player.invincible = 10
          spawnFloatingText(player.x + player.w / 2, player.y - 10, '🛡️ Bất Tử!', '#fbbf24', 12)
        }
        // Thorns passive: reflect 20% damage
        if (passives.includes('thorns') && !m.dead) {
          const thornsDmg = Math.max(1, Math.floor(rawDmg * THORNS_PERCENT))
          m.hp -= thornsDmg; m.hurtTimer = MINOR_HURT_TIMER
          spawnFloatingText(m.x + m.w / 2, m.y - 10, `🌵 ${thornsDmg}`, '#4ade80', 12)
        }
        if (!isAdmin && playerHp.value <= 0) { playerHp.value = 0; gameState.value = 'gameover'; sfxGameOver(); handleGameOver() }
      }
    } else {
      // Chase - flying vs ground
      if (m.flying) {
        m.state = 'chase'
        m.vx = m.facing * m.speed
        // Fly towards player Y
        const targetY = player.y - 10
        if (m.y > targetY + 5) m.vy = -m.speed * 0.6
        else if (m.y < targetY - 5) m.vy = m.speed * 0.6
        else m.vy *= 0.9
        // Slight wave motion
        m.vy += Math.sin(Date.now() * 0.003 + m.x * 0.01) * 0.1
      } else {
        m.state = 'chase'; m.vx = m.facing * m.speed
      }
    }
    if (m.attackCooldown > 0) m.attackCooldown--
    m.animTimer++; if (m.animTimer >= 8) { m.animTimer = 0; m.animFrame++ }
    // Flying monsters skip gravity
    if (m.flying) {
      m.y += m.vy; m.x += m.vx
      if (m.x < 0) m.x = 0
      if (m.x + m.w > MAP_WIDTH) m.x = MAP_WIDTH - m.w
      if (m.y < 40) m.y = 40
      if (m.y > H - 80) m.y = H - 80
    } else {
      _resolveGravity(m)
    }
    if (Math.abs(m.x - player.x) > W * 2) monsters.splice(i, 1)
  }
}

function updateChests() {
  chestSpawnTimer++
  // Spawn chest on platforms periodically
  if (chestSpawnTimer >= CHEST_SPAWN_INTERVAL && chests.length < 3) {
    chestSpawnTimer = 0
    const validPlatforms = platforms.filter(p => p.type === 'floating')
    if (validPlatforms.length > 0) {
      const p = validPlatforms[Math.floor(Math.random() * validPlatforms.length)]!
      chests.push(createChest(p.x + p.w / 2 - 12, p.y))
    }
  }
  for (let i = chests.length - 1; i >= 0; i--) {
    const c = chests[i]!
    c.animFrame++
    if (c.opened) {
      c.openTimer--
      if (c.openTimer <= 0) { chests.splice(i, 1); continue }
    } else if (rectCollide(player, c)) {
      c.opened = true; c.openTimer = CHEST_OPEN_TIMER; sfxChestOpen()
      applyItem(c.item)
      spawnFloatingText(c.x + c.w / 2, c.y - 10, ITEM_NAMES[c.item], ITEM_COLORS[c.item], 14)
      spawnParticles(c.x + c.w / 2, c.y + c.h / 2, ITEM_COLORS[c.item], 15, 5)
    }
  }
}

function applyItem(item: ItemType) {
  sfxItem()
  switch (item) {
    case 'hp_potion':
      playerHp.value = Math.min(playerHp.value + HP_POTION_HEAL_CHEST, playerMaxHp.value)
      spawnFloatingText(player.x + player.w / 2, player.y - 20, `+${HP_POTION_HEAL_CHEST} HP`, '#ef4444', 16)
      break
    case 'atk_boost': player.atkBoost = ITEM_DURATIONS.atk_boost / 60; break
    case 'speed_boost': player.speedBoost = ITEM_DURATIONS.speed_boost / 60; break
    case 'shield': player.shield = ITEM_DURATIONS.shield / 60; break
    case 'exp_gem':
      const expGain = EXP_GEM_BASE + level.value * EXP_GEM_LEVEL_SCALE
      playerExp.value += expGain
      spawnFloatingText(player.x + player.w / 2, player.y - 20, `+${expGain} EXP`, '#10b981', 16)
      if (playerExp.value >= playerExpMax.value) levelUp()
      break
  }
}

function levelUp() {
  level.value++; playerExp.value = 0; playerExpMax.value = Math.floor(playerExpMax.value * EXP_GROWTH)
  playerMaxHp.value += LEVEL_HP_BONUS; playerHp.value = Math.min(playerHp.value + LEVEL_HP_HEAL, playerMaxHp.value)
  playerMaxMp.value += LEVEL_MP_BONUS; playerMp.value = Math.min(playerMp.value + LEVEL_MP_HEAL, playerMaxMp.value)
  player.speed += LEVEL_SPEED_BONUS; player.baseAtk += LEVEL_ATK_BONUS; sfxLevelUp()
  spawnFloatingText(player.x + player.w / 2, player.y - 40, 'LEVEL UP!', '#e879f9', 24)
  spawnParticles(player.x + player.w / 2, player.y + player.h / 2, '#e879f9', 30, 8)
  // Biome change notification
  const newBiome = BIOMES[MAP_CONFIGS[currentMapId.value].biome]
  const prevBiome = getBiomeConfig(level.value - 1)
  if (newBiome.name !== prevBiome.name) {
    setTimeout(() => spawnFloatingText(player.x + player.w / 2, player.y - 60, `🗺️ ${newBiome.name}`, '#fbbf24', 20), 500)
  }
  if (spawnRate > MIN_SPAWN_RATE) spawnRate -= SPAWN_RATE_DECREASE
  if (maxMonsters < MAX_MAX_MONSTERS) maxMonsters++
}

function handleGameOver() {
  if (!scoreSaved && score.value > 0) {
    saveScore({ name: playerName.value, score: score.value, level: level.value, kills: killCount.value, date: new Date().toLocaleDateString() })
    scoreSaved = true
  }
  // Clear auto-save on death
  localStorage.removeItem(AUTOSAVE_KEY)
}

// === AUTO-SAVE ===
let autoSaveTimer = 0
function autoSave() {
  autoSaveTimer++
  if (autoSaveTimer < AUTOSAVE_INTERVAL) return // ~15s at 60fps
  autoSaveTimer = 0
  try {
    const saveData = {
      level: level.value, score: score.value, hp: playerHp.value, maxHp: playerMaxHp.value,
      mp: playerMp.value, maxMp: playerMaxMp.value, exp: playerExp.value, expMax: playerExpMax.value,
      kills: killCount.value, ngPlus: newGamePlusLevel,
      equipment: player.equipment, equipInventory: equipInventory.slice(0, 20),
      weaponIdx: player.weapon, consumables,
    }
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(saveData))
  } catch { /* storage full - ignore */ }
}

function loadSave(): boolean {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY)
    if (!raw) return false
    const d = JSON.parse(raw)
    level.value = d.level ?? 1; score.value = d.score ?? 0
    playerHp.value = d.hp ?? 100; playerMaxHp.value = d.maxHp ?? 100
    playerMp.value = d.mp ?? 60; playerMaxMp.value = d.maxMp ?? 60
    playerExp.value = d.exp ?? 0; playerExpMax.value = d.expMax ?? 50
    killCount.value = d.kills ?? 0; newGamePlusLevel = d.ngPlus ?? 0
    if (d.equipment) player.equipment = d.equipment
    if (d.equipInventory) { equipInventory.length = 0; equipInventory.push(...d.equipInventory) }
    if (d.consumables) { consumables.length = 0; consumables.push(...d.consumables) }
    return true
  } catch { return false }
}

function updateParticles() { _updateParticles(particles) }
function updateFloatingTexts() { _updateFloatingTexts(floatingTexts) }
function updateCamera() {
  camera.x += (player.x - W / 3 - camera.x) * 0.08
  const mapWidth = MAP_CONFIGS[currentMapId.value].width
  camera.x = Math.max(0, Math.min(mapWidth - W, camera.x))
}

function updateWeaponDrops() {
  for (let i = weaponDrops.length - 1; i >= 0; i--) {
    const d = weaponDrops[i]!
    d.life--; d.animFrame++
    if (d.life <= 0) { weaponDrops.splice(i, 1); continue }
    // Gravity for drops
    if (!d.onGround) {
      d.vy += 0.3
      d.y += d.vy
      for (const p of platforms) {
        if (d.x + d.w > p.x && d.x < p.x + p.w && d.y + d.h > p.y && d.y + d.h < p.y + p.h + 10 && d.vy >= 0) {
          d.y = p.y - d.h; d.vy = 0; d.onGround = true
        }
      }
    }
  }
}

function updateProjectiles() {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i]!
    p.x += p.vx; p.y += p.vy; p.life--; p.rotation += 0.1
    if (p.life <= 0) { projectiles.splice(i, 1); continue }
    // Collision with monsters
    for (const m of monsters) {
      if (m.dead || m.hurtTimer > 0) continue
      if (!p.piercing && p.hitTargets.includes(m)) continue
      if (rectCollide(p, m)) {
        const dmg = Math.floor(p.damage + Math.random() * DAMAGE_VARIANCE)
        m.hp -= dmg; m.hurtTimer = MINOR_HURT_TIMER; m.vx = p.vx > 0 ? 3 : -3; m.vy = -2
        spawnParticles(m.x + m.w / 2, m.y + m.h / 2, p.color, 6, 3)
        spawnFloatingText(m.x + m.w / 2, m.y - 10, `-${dmg}`, p.color, 14)
        sfxHit(); combo.value++; comboTimer = 0
        screenShake.intensity = Math.max(screenShake.intensity, SHAKE_INTENSITY_HIT)
        p.hitTargets.push(m)
        // CHECK DEATH FIRST before breaking
        if (m.hp <= 0) {
          m.dead = true; killCount.value++
          score.value += m.scoreValue; playerExp.value += m.exp; sfxKill()
          spawnParticles(m.x + m.w / 2, m.y + m.h / 2, m.color, 15, 5)
          if (m.type === 'boss') screenShake.intensity = SHAKE_INTENSITY_BOSS
          if (playerExp.value >= playerExpMax.value) levelUp()
        }
        if (!p.piercing) { p.life = 0; break }
      }
    }
  }
}

function updateEquipmentDrops() {
  for (let i = equipmentDrops.length - 1; i >= 0; i--) {
    const d = equipmentDrops[i]!
    d.life--; d.animFrame++
    if (d.life <= 0) { equipmentDrops.splice(i, 1); continue }
    if (!d.onGround) {
      d.vy += 0.3; d.y += d.vy
      for (const p of platforms) {
        if (d.x + d.w > p.x && d.x < p.x + p.w && d.y + d.h > p.y && d.y + d.h < p.y + p.h + 10 && d.vy >= 0) {
          d.y = p.y - d.h; d.vy = 0; d.onGround = true
        }
      }
    }
  }
}

// ===== DRAW UI =====
// === BOSS HP BAR (top of screen) ===
function drawBossHPBar(boss: Monster) {
  if (!ctx) return
  const barW = 300, barH = 16, barX = (W - barW) / 2, barY = 20
  const hpRatio = boss.hp / boss.maxHp
  // Phase detection
  const phase = hpRatio <= BOSS_PHASE3_HP ? 3 : hpRatio <= BOSS_PHASE2_HP ? 2 : 1
  const phaseColors = ['#4ade80', '#fbbf24', '#ef4444']
  const phaseColor = phaseColors[phase - 1] ?? '#ef4444'

  // Background
  ctx.fillStyle = 'rgba(0,0,0,0.7)'
  ctx.fillRect(barX - 4, barY - 4, barW + 8, barH + 22)
  ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 2
  ctx.strokeRect(barX - 4, barY - 4, barW + 8, barH + 22)

  // Boss name + phase
  ctx.fillStyle = '#a855f7'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center'
  ctx.fillText(`👹 BOSS - Phase ${phase}/3`, W / 2, barY - 8)

  // HP bar
  ctx.fillStyle = 'rgba(255,255,255,0.1)'
  ctx.fillRect(barX, barY, barW, barH)
  // Phase transition marks
  const p2x = barX + barW * BOSS_PHASE2_HP, p3x = barX + barW * BOSS_PHASE3_HP
  ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(p2x, barY); ctx.lineTo(p2x, barY + barH); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(p3x, barY); ctx.lineTo(p3x, barY + barH); ctx.stroke()
  // HP fill
  const hpGrad = ctx.createLinearGradient(barX, 0, barX + barW * hpRatio, 0)
  hpGrad.addColorStop(0, phaseColor); hpGrad.addColorStop(1, phase >= 3 ? '#dc2626' : phaseColor)
  ctx.fillStyle = hpGrad
  ctx.fillRect(barX, barY, barW * hpRatio, barH)
  // HP text
  ctx.fillStyle = '#fff'; ctx.font = 'bold 9px monospace'
  ctx.fillText(`${boss.hp}/${boss.maxHp}`, W / 2, barY + 12)
  ctx.textAlign = 'left'

  // Phase-specific visual effects
  if (phase >= 2) {
    // Enrage glow
    ctx.shadowColor = phaseColor; ctx.shadowBlur = 10 + Math.sin(Date.now() / 200) * 5
    ctx.fillStyle = phaseColor; ctx.globalAlpha = 0.1 + Math.sin(Date.now() / 300) * 0.05
    ctx.fillRect(barX - 4, barY - 4, barW + 8, barH + 22)
    ctx.globalAlpha = 1; ctx.shadowBlur = 0
  }
}

function drawUI() {
  if (!ctx) return


  // Player panel
  ctx.fillStyle = 'rgba(15,15,35,0.85)'; ctx.fillRect(12, 12, 208, 84)
  ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 1; ctx.strokeRect(12, 12, 208, 84)

  // Tên + admin badge
  if (isAdmin) {
    ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 11px monospace'; ctx.fillText(`👑 ${playerName.value}`, 18, 28)
    ctx.fillStyle = '#ef4444'; ctx.font = '8px monospace'; ctx.fillText('ADMIN', 18, 92)
  } else {
    ctx.fillStyle = '#e2e8f0'; ctx.font = 'bold 11px monospace'; ctx.fillText(playerName.value, 18, 28)
  }
  ctx.fillStyle = '#fbbf24'; ctx.font = '10px monospace'; ctx.fillText(`Lv.${level.value}`, 110, 28)
  ctx.fillStyle = '#94a3b8'; ctx.font = '9px monospace'; ctx.fillText(MAP_CONFIGS[currentMapId.value].name, 140, 28)

  // HP
  ctx.fillStyle = '#1a1a2e'; ctx.fillRect(18, 34, 196, 16)
  const hpR = playerHp.value / playerMaxHp.value
  const hpG = ctx.createLinearGradient(18, 0, 18 + 196 * hpR, 0)
  hpG.addColorStop(0, hpR > 0.3 ? '#22c55e' : '#ef4444')
  hpG.addColorStop(1, hpR > 0.3 ? '#4ade80' : '#fbbf24')
  ctx.fillStyle = hpG; ctx.fillRect(18, 34, 196 * hpR, 16)
  ctx.fillStyle = '#fff'; ctx.font = '10px monospace'
  ctx.fillText(`HP ${playerHp.value}/${playerMaxHp.value}`, 22, 46)

  // EXP
  ctx.fillStyle = '#1a1a2e'; ctx.fillRect(18, 54, 196, 8)
  ctx.fillStyle = '#818cf8'; ctx.fillRect(18, 54, 196 * (playerExp.value / playerExpMax.value), 8)
  ctx.fillStyle = '#c7d2fe'; ctx.font = '8px monospace'
  ctx.fillText(`EXP ${playerExp.value}/${playerExpMax.value}`, 22, 62)

  // Active effects
  let effX = 18
  if (player.atkBoost > 0) { ctx.fillStyle = '#f97316'; ctx.font = '9px monospace'; ctx.fillText(`⚔${Math.ceil(player.atkBoost)}s`, effX, 80); effX += 40 }
  if (player.speedBoost > 0) { ctx.fillStyle = '#3b82f6'; ctx.fillText(`💨${Math.ceil(player.speedBoost)}s`, effX, 80); effX += 40 }
  if (player.shield > 0) { ctx.fillStyle = '#a855f7'; ctx.fillText(`🛡${Math.ceil(player.shield)}s`, effX, 80); effX += 40 }

  // Equipped weapon indicator
  const wCfg = WEAPONS[player.weapon]
  ctx.fillStyle = 'rgba(15,15,35,0.85)'; ctx.fillRect(12, 100, 120, 40)
  ctx.strokeStyle = wCfg.color; ctx.lineWidth = 1; ctx.strokeRect(12, 100, 120, 40)
  ctx.fillStyle = wCfg.color; ctx.font = 'bold 10px monospace'
  ctx.fillText(`${wCfg.icon} ${wCfg.name}`, 18, 116)
  // DEF & CRIT
  ctx.fillStyle = '#94a3b8'; ctx.font = '8px monospace'
  ctx.fillText(`🛡 DEF:${player.defense}  💥 CRIT:${player.critChance}%`, 18, 132)

  // Consumable indicators
  const hpPot = consumables.find(c => c.type === 'hp_potion')
  const mpPot = consumables.find(c => c.type === 'mp_potion')
  ctx.fillStyle = 'rgba(15,15,35,0.85)'; ctx.fillRect(12, 144, 120, 22)
  ctx.strokeStyle = '#64748b'; ctx.lineWidth = 1; ctx.strokeRect(12, 144, 120, 22)
  ctx.fillStyle = '#ef4444'; ctx.font = '9px monospace'
  ctx.fillText(`[F] ❤️x${hpPot?.count ?? 0}`, 16, 158)
  ctx.fillStyle = '#3b82f6'
  ctx.fillText(`[G] 💙x${mpPot?.count ?? 0}`, 76, 158)

  // Weapon hotbar (bottom center)
  const allW: WeaponType[] = ['sword', 'dual_swords', 'axe', 'bow', 'shuriken', 'hammer']
  const hbW = 28, hbGap = 3, hbTotal = allW.length * (hbW + hbGap)
  const hbX = (W - hbTotal) / 2, hbY = H - 36
  allW.forEach((wt, i) => {
    const sx = hbX + i * (hbW + hbGap)
    const owned = inventory.includes(wt)
    const equipped = player.weapon === wt
    ctx!.fillStyle = equipped ? 'rgba(251,191,36,0.3)' : owned ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.3)'
    ctx!.fillRect(sx, hbY, hbW, hbW)
    ctx!.strokeStyle = equipped ? '#fbbf24' : owned ? '#4b5563' : '#1f2937'
    ctx!.lineWidth = equipped ? 2 : 1
    ctx!.strokeRect(sx, hbY, hbW, hbW)
    ctx!.fillStyle = owned ? '#e2e8f0' : '#374151'
    ctx!.font = '12px monospace'; ctx!.textAlign = 'center'
    ctx!.fillText(WEAPONS[wt].icon, sx + hbW / 2, hbY + 18)
    ctx!.fillStyle = '#64748b'; ctx!.font = '7px monospace'
    ctx!.fillText(`${i + 1}`, sx + hbW / 2, hbY - 2)
    ctx!.textAlign = 'left'
  })

  // Score panel
  ctx.fillStyle = 'rgba(15,15,35,0.85)'; ctx.fillRect(W - 170, 12, 158, 48)
  ctx.strokeStyle = '#f97316'; ctx.strokeRect(W - 170, 12, 158, 48)
  ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 11px monospace'; ctx.textAlign = 'right'
  ctx.fillText(`SCORE: ${score.value}`, W - 20, 32)
  ctx.fillStyle = '#f97316'; ctx.font = '10px monospace'
  ctx.fillText(`KILLS: ${killCount.value}`, W - 20, 48)
  ctx.textAlign = 'left'

  // Combo
  if (combo.value > 1) {
    ctx.fillStyle = '#f97316'; ctx.font = `bold ${16 + Math.min(combo.value * 2, 20)}px monospace`
    ctx.textAlign = 'center'; ctx.fillText(`${combo.value} COMBO!`, W / 2, 40); ctx.textAlign = 'left'
  }

  // Skill bar (bottom right)
  drawSkillBar(ctx!, W, H, playerMp.value, playerMaxMp.value, player.skillCooldowns)

  // Gold indicator
  drawGoldHUD(ctx!, playerGold.value, W - 170, 66)
  // Wing indicator
  drawWingHUD(ctx!, equippedWing, W - 170, 92)

  ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.font = '7px monospace'
  ctx.fillText('← → Di chuyển | ↑ Nhảy | Z/J Tấn công | Q/E/R Kỹ năng | F/G Thuốc | B Túi đồ', 16, H - 42)
}

function drawParticles() { if (ctx) _drawParticles(ctx, particles, camera.x) }
function drawFloatingTexts() { if (ctx) _drawFloatingTexts(ctx, floatingTexts, camera.x) }

function drawMenu() {
  if (!ctx) return
  drawBackground()
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = '#ef4444'; ctx.font = 'bold 48px monospace'; ctx.textAlign = 'center'
  ctx.fillText('NINJA QUEST', W / 2, H / 2 - 100)
  ctx.fillStyle = '#fbbf24'; ctx.font = '14px monospace'
  ctx.fillText('⚔ Tiêu diệt quái vật • Thu thập điểm • Nâng cấp ⚔', W / 2, H / 2 - 65)
  ctx.fillStyle = '#94a3b8'; ctx.font = '11px monospace'
  ctx.fillText('🗺️ 4 Biomes: Rừng → Sa Mạc → Băng Giá → Núi Lửa', W / 2, H / 2 - 40)

  // Check for save data
  const hasSave = !!localStorage.getItem(AUTOSAVE_KEY)

  if (Math.floor(Date.now() / 500) % 2 === 0) {
    ctx.fillStyle = '#e2e8f0'; ctx.font = 'bold 20px monospace'
    ctx.fillText('Nhấn ENTER để bắt đầu', W / 2, H / 2 + 10)
  }
  if (hasSave) {
    ctx.fillStyle = '#4ade80'; ctx.font = 'bold 14px monospace'
    ctx.fillText('💾 Nhấn C để tiếp tục game đã lưu', W / 2, H / 2 + 32)
  }
  if (newGamePlusLevel > 0) {
    ctx.fillStyle = '#a855f7'; ctx.font = 'bold 12px monospace'
    ctx.fillText(`⭐ New Game+ ${newGamePlusLevel}`, W / 2, H / 2 - 20)
  }
  ctx.fillStyle = '#94a3b8'; ctx.font = '11px monospace'
  ctx.fillText('← → / A D : Di chuyển  |  ↑ / W / Space : Nhảy  |  Z / J : Tấn công', W / 2, H / 2 + 55)

  // Leaderboard
  drawLeaderboard(ctx, W / 2 - 140, H / 2 + 75, 280)

  ctx.fillStyle = '#64748b'; ctx.font = '10px monospace'
  ctx.fillText('by nmdung.dev | J2TEAM Community', W / 2, H - 16)
  ctx.textAlign = 'left'
}

// === NAME INPUT SCREEN ===
function drawNameInput() {
  if (!ctx) return
  drawBackground()
  ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, W, H)

  // Panel
  const panelW = 420, panelH = 200
  const px = (W - panelW) / 2, py = (H - panelH) / 2

  ctx.fillStyle = 'rgba(15,15,35,0.95)'; ctx.fillRect(px, py, panelW, panelH)
  ctx.strokeStyle = '#818cf8'; ctx.lineWidth = 2; ctx.strokeRect(px, py, panelW, panelH)

  // Title
  ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 20px monospace'; ctx.textAlign = 'center'
  ctx.fillText('⚔️ NINJA QUEST ⚔️', W / 2, py + 35)

  // Subtitle
  ctx.fillStyle = '#94a3b8'; ctx.font = '12px monospace'
  ctx.fillText('Hãy đặt tên cho ninja của bạn', W / 2, py + 58)

  // Input box
  const inputW = 300, inputH = 36
  const ix = (W - inputW) / 2, iy = py + 75
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(ix, iy, inputW, inputH)
  ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 2; ctx.strokeRect(ix, iy, inputW, inputH)

  // Input text + cursor blink
  nameBlinkTimer++
  const showCursor = Math.floor(nameBlinkTimer / 30) % 2 === 0
  const displayText = nameInput + (showCursor ? '▌' : '')
  ctx.fillStyle = '#e2e8f0'; ctx.font = 'bold 18px monospace'
  ctx.fillText(displayText || (showCursor ? '▌' : ''), W / 2, iy + 24)

  // Placeholder hint
  if (nameInput.length === 0 && !showCursor) {
    ctx.fillStyle = '#4b5563'; ctx.font = '14px monospace'
    ctx.fillText('Nhập tên...', W / 2, iy + 24)
  }

  // Submit hint
  if (nameInput.length > 0) {
    ctx.fillStyle = '#4ade80'; ctx.font = 'bold 14px monospace'
    ctx.fillText('Nhấn ENTER để bắt đầu', W / 2, iy + 60)
  } else {
    ctx.fillStyle = '#64748b'; ctx.font = '11px monospace'
    ctx.fillText('Tối đa 15 ký tự', W / 2, iy + 60)
  }

  // Admin hint (easter egg style - subtle)
  ctx.fillStyle = '#1e1e3a'; ctx.font = '8px monospace'
  ctx.fillText('💡 Nhập tên đặc biệt để mở khoá bí mật...', W / 2, py + panelH - 12)

  ctx.textAlign = 'left'
}

function handleNameKeyInput(e: KeyboardEvent) {
  if (gameState.value !== 'naming') return

  if (e.code === 'Enter' && nameInput.length > 0) {
    playerName.value = nameInput
    isAdmin = nameInput === ADMIN_NAME
    actualStartGame()
    return
  }

  if (e.code === 'Backspace') {
    nameInput = nameInput.slice(0, -1)
    return
  }

  if (e.code === 'Escape') {
    gameState.value = 'menu'
    nameInput = ''
    return
  }

  // Only allow printable chars
  if (e.key.length === 1 && nameInput.length < 15) {
    nameInput += e.key
  }
}

function drawGameOver() {
  if (!ctx) return
  ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, W, H)
  ctx.textAlign = 'center'
  ctx.fillStyle = '#ef4444'; ctx.font = 'bold 48px monospace'; ctx.fillText('GAME OVER', W / 2, H / 2 - 80)
  ctx.fillStyle = '#fbbf24'; ctx.font = '20px monospace'; ctx.fillText(`Score: ${score.value}`, W / 2, H / 2 - 30)
  ctx.fillStyle = '#94a3b8'; ctx.font = '14px monospace'
  ctx.fillText(`Level: ${level.value} | Kills: ${killCount.value} | Map: ${MAP_CONFIGS[currentMapId.value].name}`, W / 2, H / 2)
  if (isHighScore(score.value)) {
    ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 16px monospace'; ctx.fillText('🏆 NEW HIGH SCORE! 🏆', W / 2, H / 2 + 30)
  }
  drawLeaderboard(ctx, W / 2 - 140, H / 2 + 50, 280)
  if (Math.floor(Date.now() / 500) % 2 === 0) {
    ctx.fillStyle = '#e2e8f0'; ctx.font = 'bold 18px monospace'
    ctx.fillText('Nhấn ENTER để chơi lại', W / 2, H - 30)
  }
  ctx.textAlign = 'left'
}

// ===== GAME LOOP =====
function startGame() {
  // Show naming screen first
  gameState.value = 'naming'
  nameInput = ''
  nameBlinkTimer = 0
}

function setupAdminMode() {
  // Admin: bất tử, full trang bị legendary +9, full vũ khí, max stats
  level.value = 50
  playerMaxHp.value = 9999; playerHp.value = 9999
  playerMaxMp.value = 9999; playerMp.value = 9999
  player.baseAtk = 999
  player.speed = PLAYER_BASE_SPEED + 3
  player.critChance = 80
  player.defense = 200
  player.maxJumps = 5
  playerGold.value = 99999
  materialInventory.upgrade_stone = 999
  materialInventory.refine_dust = 999
  materialInventory.protection_scroll = 999

  // Full vũ khí
  const allWeapons: WeaponType[] = ['sword', 'dual_swords', 'axe', 'bow', 'shuriken', 'hammer']
  inventory.length = 0
  for (const w of allWeapons) inventory.push(w)
  player.weapon = 'hammer' // vũ khí mạnh nhất

  // Full trang bị legendary +9 (level 10)
  const legendaryEquips: { id: string; slot: EquipSlot; name: string; icon: string; passive: PassiveType; stats: EquipmentConfig['stats'] }[] = [
    { id: 'shadow_hood', slot: 'head', name: 'Mũ Trùm Bóng Tối +9', icon: '🌑', passive: 'crit_burst', stats: { hp: 200, atk: 30, critChance: 40 } },
    { id: 'divine_robe', slot: 'chest', name: 'Áo Thần Thánh +9', icon: '✨', passive: 'mana_shield', stats: { def: 80, hp: 150, manaRegen: 0.15 } },
    { id: 'wind_hakama', slot: 'legs', name: 'Hakama Gió +9', icon: '🌪️', passive: 'speed_aura', stats: { speed: 4, def: 30, jumpPower: -5 } },
    { id: 'god_fists', slot: 'gloves', name: 'Nắm Đấm Thần +9', icon: '💥', passive: 'lightning', stats: { atk: 90, critChance: 40, def: 12 } },
    { id: 'celestial_step', slot: 'boots', name: 'Bước Chân Tiên +9', icon: '🌟', passive: 'lifesteal', stats: { speed: 3, jumpPower: -6, manaRegen: 0.1 } },
    { id: 'dragon_heart', slot: 'accessory', name: 'Tim Rồng +9', icon: '❤️‍🔥', passive: 'lifesteal', stats: { hp: 200, atk: 50, def: 25, critChance: 25 } },
  ]

  for (const eq of legendaryEquips) {
    player.equipment[eq.slot] = {
      id: eq.id, uid: Math.floor(Math.random() * 100000),
      name: eq.name, slot: eq.slot, rarity: 'legendary', icon: eq.icon,
      level: 10, stats: eq.stats, passive: eq.passive,
      passiveDesc: eq.passive !== 'none' ? `Admin passive` : undefined,
      description: '👑 Admin Equipment', color: '#fb923c',
    }
  }

  // Full cánh - celestial
  const allWings: WingType[] = ['wood_wings', 'angel_wings', 'dragon_wings', 'shadow_wings', 'celestial_wings']
  ownedWings.length = 0
  for (const w of allWings) ownedWings.push(w)
  equipWing('celestial_wings')

  // Full consumables
  consumables.length = 0
  consumables.push({ type: 'hp_potion', count: 999 }, { type: 'mp_potion', count: 999 })

  // Unlock all maps
  unlockedMaps.value = ['forest', 'desert', 'ice', 'volcano']

  spawnFloatingText(player.x + player.w / 2, player.y - 50, '👑 ADMIN MODE ACTIVATED!', '#fbbf24', 22)
  spawnFloatingText(player.x + player.w / 2, player.y - 30, '🛡️ Bất tử | ⚔️ Full trang bị', '#fb923c', 14)
}

function actualStartGame() {
  gameState.value = 'playing'; scoreSaved = false
  currentMapId.value = 'hub'  // Start in hub town!
  resetPlayer(); generateMap(); monsters.length = 0; particles.length = 0
  floatingTexts.length = 0; chests.length = 0; for (const k in zoneSpawnTimers) delete zoneSpawnTimers[k]; spawnRate = INITIAL_SPAWN_RATE; maxMonsters = INITIAL_MAX_MONSTERS
  activeNPC = null; showMapSelection = false
  sfxMenuSelect()

  // Admin mode setup
  if (isAdmin) {
    setupAdminMode()
  }

  spawnFloatingText(player.x + player.w / 2, player.y - 30, `🏘️ Chào mừng ${playerName.value} đến Làng Ninja!`, '#fbbf24', 16)
}

function switchMap(targetMap: MapId) {
  currentMapId.value = targetMap
  // Clear combat state
  monsters.length = 0; chests.length = 0; weaponDrops.length = 0
  equipmentDrops.length = 0; projectiles.length = 0; particles.length = 0
  floatingTexts.length = 0
  // Generate new map
  generateMap()
  initBackground()
  // Reset player position
  player.x = 100; player.y = H - 100; player.vx = 0; player.vy = 0
  player.onGround = false; player.invincible = 60
  // Reset zone spawn timers
  for (const k in zoneSpawnTimers) delete zoneSpawnTimers[k]
  activeNPC = null; showMapSelection = false
  showInventory.value = false
  const mapCfg = MAP_CONFIGS[targetMap]
  spawnFloatingText(player.x + player.w / 2, player.y - 30, `${mapCfg.icon} ${mapCfg.name}`, '#818cf8', 18)
  sfxMenuSelect()
}

// NPC interaction check
function checkNPCInteraction() {
  if (currentMapId.value !== 'hub') return
  if (activeNPC) return // Already interacting

  for (const npc of npcs) {
    if (Math.abs(player.x + player.w / 2 - npc.x - npc.w / 2) < 50 &&
        Math.abs(player.y - npc.y) < 60) {
      // Check ↑ to interact
      if (keyJustPressed['ArrowUp'] || keyJustPressed['KeyW']) {
        if (npc.type === 'portal') {
          showMapSelection = true; mapSelectIdx = 0
        } else {
          activeNPC = npc; npc.interacting = true
        }
        sfxChestOpen()
        return
      }
    }
  }
}

function gameLoop() {
  if (!ctx) return
  if (gameState.value === 'menu') {
    drawMenu()
    menuReady++
    if (keys['Enter'] && menuReady > 30) { keys['Enter'] = false; startGame() }
    // Continue from save
    if ((keys['c'] || keys['C']) && menuReady > 30) {
      keys['c'] = false; keys['C'] = false
      if (loadSave()) {
        gameState.value = 'playing'; scoreSaved = false
        generateMap(); monsters.length = 0; particles.length = 0
        floatingTexts.length = 0; chests.length = 0; for (const k in zoneSpawnTimers) delete zoneSpawnTimers[k]
        spawnRate = Math.max(MIN_SPAWN_RATE, INITIAL_SPAWN_RATE - level.value * SPAWN_RATE_DECREASE)
        maxMonsters = Math.min(MAX_MAX_MONSTERS, INITIAL_MAX_MONSTERS + level.value)
        sfxMenuSelect()
        spawnFloatingText(player.x + player.w / 2, player.y - 30, '💾 Đã tải game!', '#4ade80', 18)
      }
    }
  } else if (gameState.value === 'naming') {
    drawNameInput()
  } else if (gameState.value === 'playing') {
    const isInteracting = activeNPC !== null || showMapSelection

    // NPC & portal checks BEFORE updatePlayer (keyJustPressed cleared in updatePlayer)
    if (!showInventory.value && !isInteracting) {
      if (currentMapId.value === 'hub') checkNPCInteraction()
      if (currentMapId.value !== 'hub' && keyJustPressed['KeyH']) {
        switchMap('hub')
      }
      // Battle map portal check
      if (currentMapId.value !== 'hub') {
        const mapCfg2 = MAP_CONFIGS[currentMapId.value]
        if (Math.abs(player.x - mapCfg2.portalX) < 40 && (keyJustPressed['ArrowUp'] || keyJustPressed['KeyW'])) {
          switchMap('hub')
        }
      }
    }

    if (!showInventory.value && !isInteracting) {
      updatePlayer(); updateMonsters(); updateChests(); updateWeaponDrops()
      updateProjectiles(); updateEquipmentDrops()
      updateParticles(); updateFloatingTexts(); updateCamera()
      autoSave()
    } else if (!showInventory.value && isInteracting) {
      // Still update particles/text during NPC interaction
      updateParticles(); updateFloatingTexts()
    }

    // Close NPC interaction with ↓ or B or Escape
    if (activeNPC && (keyJustPressed['ArrowDown'] || keyJustPressed['KeyS'] || keyJustPressed['KeyB'] || keyJustPressed['Escape'])) {
      activeNPC.interacting = false; activeNPC = null
      upgradeSelectedEquip = null; upgradeResult = 'none'
    }
    // Map selection controls
    if (showMapSelection) {
      if (keyJustPressed['ArrowUp']) mapSelectIdx = Math.max(0, mapSelectIdx - 1)
      if (keyJustPressed['ArrowDown']) mapSelectIdx = Math.min(BATTLE_MAPS.length - 1, mapSelectIdx + 1)
      if (keyJustPressed['Enter']) {
        const targetMap = BATTLE_MAPS[mapSelectIdx]
        if (targetMap && unlockedMaps.value.includes(targetMap)) {
          switchMap(targetMap)
        }
      }
      if (keyJustPressed['KeyB'] || keyJustPressed['Escape']) {
        showMapSelection = false
      }
    }

    // Clear just pressed in interaction mode
    if (isInteracting) {
      for (const k in keyJustPressed) delete keyJustPressed[k]
    }

    // === SCREEN SHAKE ===
    if (screenShake.intensity > 0.5) {
      screenShake.x = (Math.random() - 0.5) * screenShake.intensity * 2
      screenShake.y = (Math.random() - 0.5) * screenShake.intensity * 2
      screenShake.intensity *= SHAKE_DECAY
    } else {
      screenShake.x = 0; screenShake.y = 0; screenShake.intensity = 0
    }

    ctx.save()
    ctx.translate(screenShake.x, screenShake.y)

    drawBackground(); drawPlatforms()
    // Draw zone boundaries
    if (currentMapId.value !== 'hub') {
      drawZoneBoundaries(ctx!, currentMapId.value, camera.x, H)
    }
    // Draw NPCs
    for (const npc of npcs) drawNPC(ctx!, npc, camera.x, player.x)
    // Draw portal at map edge for battle maps
    if (currentMapId.value !== 'hub') {
      const mapCfg = MAP_CONFIGS[currentMapId.value]
      drawPortal(ctx!, mapCfg.portalX, H - 48 - 30, camera.x, '🏘️ Về Làng')
    }
    for (const c of chests) drawChest(ctx!, c, camera.x)
    for (const d of weaponDrops) drawWeaponDrop(ctx!, d, camera.x)
    for (const d of equipmentDrops) drawEquipmentDrop(ctx!, d, camera.x)
    for (const p of projectiles) drawProjectile(ctx!, p, camera.x)
    for (const m of monsters) drawMonster(m)
    drawPixelChar(player.x, player.y, player.facing, player.state, player.animFrame, player.invincible > 0)
    drawParticles(); drawFloatingTexts()

    ctx.restore()
    drawUI()

    // Map name indicator + zone indicator
    const mapCfg = MAP_CONFIGS[currentMapId.value]
    if (currentMapId.value !== 'hub') {
      const currentZone = getPlayerZone(currentMapId.value, player.x)
      drawZoneIndicator(ctx!, currentZone, W)
      ctx.fillStyle = '#64748b'; ctx.font = '7px monospace'; ctx.textAlign = 'center'
      ctx.fillText('[H] Về Làng', W / 2, 34)
      ctx.textAlign = 'left'
    } else {
      ctx.fillStyle = 'rgba(15,15,35,0.7)'; ctx.font = '9px monospace'; ctx.textAlign = 'center'
      ctx.fillText(`${mapCfg.icon} ${mapCfg.name}`, W / 2, 18)
      ctx.textAlign = 'left'
    }

    // === BOSS HP BAR ===
    const activeBoss = monsters.find(m => m.type === 'boss' && !m.dead)
    if (activeBoss) {
      drawBossHPBar(activeBoss)
    }

    // NPC interaction overlays
    if (activeNPC?.type === 'merchant') {
      drawShopUI(ctx!, W, H, playerGold.value, materialInventory)
    } else if (activeNPC?.type === 'blacksmith') {
      if (upgradeAnim > 0) upgradeAnim--
      drawUpgradeUI(ctx!, W, H, upgradeSelectedEquip, materialInventory, upgradeUseRefineDust, upgradeUseProtection, getAllUpgradeableItems(), upgradeResult, upgradeAnim, upgradeListIdx)
    } else if (activeNPC?.type === 'elder') {
      // Elder dialog
      const panelW = 360, panelH = 120
      const px = (W - panelW) / 2, py = H - panelH - 50
      ctx.fillStyle = 'rgba(15,15,35,0.92)'; ctx.fillRect(px, py, panelW, panelH)
      ctx.strokeStyle = '#a78bfa'; ctx.lineWidth = 2; ctx.strokeRect(px, py, panelW, panelH)
      ctx.fillStyle = '#a78bfa'; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center'
      ctx.fillText('👴 Trưởng Làng', px + panelW / 2, py + 22)
      ctx.fillStyle = '#e2e8f0'; ctx.font = '10px monospace'
      ctx.fillText('Chào mừng đến Làng Ninja!', px + panelW / 2, py + 46)
      ctx.fillStyle = '#94a3b8'; ctx.font = '9px monospace'
      ctx.fillText('Hãy mua đồ, nâng cấp rồi ra ngoài đánh quái!', px + panelW / 2, py + 66)
      ctx.fillStyle = '#64748b'; ctx.font = '8px monospace'
      ctx.fillText('Nhấn ↓ hoặc B để đóng', px + panelW / 2, py + panelH - 10)
      ctx.textAlign = 'left'
    }

    // Map selection
    if (showMapSelection) {
      drawMapSelection(ctx!, W, H, unlockedMaps.value, mapSelectIdx)
    }

    // Inventory overlay
    if (showInventory.value) {
      drawTabbedInventory()
    }
  } else if (gameState.value === 'gameover') {
    drawBackground(); drawPlatforms(); drawGameOver()
    if (keys['Enter']) { keys['Enter'] = false; startGame() }
  }
  animationId = requestAnimationFrame(gameLoop)
}

function drawTabbedInventory() {
  if (!ctx) return
  // Overlay
  ctx.fillStyle = 'rgba(0,0,0,0.75)'
  ctx.fillRect(0, 0, W, H)

  const panelW = 480, panelH = 380
  const px = (W - panelW) / 2, py = (H - panelH) / 2

  // Panel bg
  ctx.fillStyle = 'rgba(15,15,35,0.95)'
  ctx.fillRect(px, py, panelW, panelH)
  ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2
  ctx.strokeRect(px, py, panelW, panelH)

  // Tabs
  const tabs = ['⚔ Vũ Khí', '🛡 Trang Bị', '🧪 Vật Phẩm', '🪽 Cánh']
  const tabW = panelW / 4
  tabs.forEach((t, i) => {
    const tx = px + i * tabW
    ctx!.fillStyle = invTab === i ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.05)'
    ctx!.fillRect(tx, py, tabW, 24)
    ctx!.strokeStyle = invTab === i ? '#fbbf24' : '#374151'
    ctx!.lineWidth = 1
    ctx!.strokeRect(tx, py, tabW, 24)
    ctx!.fillStyle = invTab === i ? '#fbbf24' : '#94a3b8'
    ctx!.font = 'bold 9px monospace'
    ctx!.textAlign = 'center'
    ctx!.fillText(t, tx + tabW / 2, py + 16)
  })
  ctx.textAlign = 'left'

  // Tab hint
  ctx.fillStyle = '#64748b'; ctx.font = '8px monospace'; ctx.textAlign = 'center'
  ctx.fillText('Tab: chuyển tab | B: đóng', px + panelW / 2, py + panelH - 6)
  ctx.textAlign = 'left'

  if (invTab === 0) {
    // Weapon tab - draw inline inside panel
    ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center'
    ctx.fillText('⚔ VŨ KHÍ', px + panelW / 2, py + 46)
    ctx.fillStyle = '#94a3b8'; ctx.font = '9px monospace'
    ctx.fillText('Nhấn 1-6 để trang bị', px + panelW / 2, py + 60)
    ctx.textAlign = 'left'

    const allWeapons: WeaponType[] = ['sword', 'dual_swords', 'axe', 'bow', 'shuriken', 'hammer']
    const slotSize = 56, slotGap = 8
    const startX = px + 20, startY = py + 72

    allWeapons.forEach((wt, i) => {
      const col = i % 3, row = Math.floor(i / 3)
      const sx = startX + col * (slotSize + slotGap)
      const sy = startY + row * (slotSize + slotGap + 20)
      const owned = inventory.includes(wt)
      const isEquipped = player.weapon === wt
      const cfg = WEAPONS[wt]
      const isHover = mousePos.x >= sx && mousePos.x <= sx + slotSize && mousePos.y >= sy && mousePos.y <= sy + slotSize

      ctx!.fillStyle = isEquipped ? 'rgba(251,191,36,0.2)' : isHover && owned ? 'rgba(255,255,255,0.15)' : owned ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)'
      ctx!.fillRect(sx, sy, slotSize, slotSize)
      ctx!.strokeStyle = isEquipped ? '#fbbf24' : isHover && owned ? '#e2e8f0' : owned ? '#4b5563' : '#1f2937'
      ctx!.lineWidth = isEquipped || isHover ? 2 : 1
      ctx!.strokeRect(sx, sy, slotSize, slotSize)

      if (owned) {
        ctx!.fillStyle = cfg.color; ctx!.font = '20px monospace'; ctx!.textAlign = 'center'
        ctx!.fillText(cfg.icon, sx + slotSize / 2, sy + 28)
        ctx!.fillStyle = '#e2e8f0'; ctx!.font = '8px monospace'
        ctx!.fillText(cfg.name, sx + slotSize / 2, sy + slotSize - 6)
        if (isEquipped) {
          ctx!.fillStyle = '#fbbf24'; ctx!.font = 'bold 7px monospace'
          ctx!.fillText('EQUIPPED', sx + slotSize / 2, sy + slotSize + 10)
        }
        ctx!.fillStyle = '#64748b'; ctx!.font = '9px monospace'
        ctx!.fillText(`[${i + 1}]`, sx + slotSize / 2, sy - 4)
        ctx!.textAlign = 'left'
      } else {
        ctx!.fillStyle = '#374151'; ctx!.font = '20px monospace'; ctx!.textAlign = 'center'
        ctx!.fillText('🔒', sx + slotSize / 2, sy + 28)
        ctx!.fillStyle = '#4b5563'; ctx!.font = '7px monospace'
        ctx!.fillText('Chưa có', sx + slotSize / 2, sy + slotSize - 6)
        ctx!.textAlign = 'left'
      }
    })

    // Selected weapon details (right side)
    const selWt = allWeapons[invSelectedIdx] ?? 'sword'
    const selCfg = WEAPONS[selWt]
    const detX = px + 220, detY = startY + 8
    ctx.fillStyle = '#e2e8f0'; ctx.font = 'bold 14px monospace'
    ctx.fillText(`${selCfg.icon} ${selCfg.name}`, detX, detY + 12)
    ctx.fillStyle = '#94a3b8'; ctx.font = '10px monospace'
    ctx.fillText(selCfg.description, detX, detY + 30)
    ctx.fillStyle = '#ef4444'; ctx.fillText(`⚔ DMG: ${selCfg.damage}`, detX, detY + 52)
    ctx.fillStyle = '#3b82f6'; ctx.fillText(`↔ Range: ${selCfg.range}`, detX, detY + 68)
    ctx.fillStyle = '#4ade80'; ctx.fillText(`⚡ Speed: ${selCfg.speed > 0 ? '+' : ''}${selCfg.speed}`, detX, detY + 84)
    // Damage bar
    ctx.fillStyle = '#1a1a2e'; ctx.fillRect(detX, detY + 94, 150, 6)
    ctx.fillStyle = '#ef4444'; ctx.fillRect(detX, detY + 94, Math.min(150, selCfg.damage * 4.3), 6)
    ctx.fillStyle = '#1a1a2e'; ctx.fillRect(detX, detY + 106, 150, 6)
    ctx.fillStyle = '#3b82f6'; ctx.fillRect(detX, detY + 106, Math.min(150, selCfg.range * 1.87), 6)
  } else if (invTab === 1) {
    // Equipment tab - redesigned
    const slots: EquipSlot[] = ['head', 'chest', 'legs', 'gloves', 'boots', 'accessory']
    const slotNames: Record<EquipSlot, string> = { head: '🎩 Mũ', chest: '👕 Áo', legs: '👖 Quần', gloves: '🧤 Găng', boots: '👟 Giày', accessory: '📿 P.Kiện' }

    ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center'
    ctx.fillText('🛡 TRANG BỊ NHÂN VẬT', px + panelW / 2, py + 44)
    ctx.textAlign = 'left'

    // Draw 6 equipment slots (2 rows x 3 cols)
    const eqSlotW = 130, eqSlotH = 44, eqGap = 6
    const eqStartX = px + 12, eqStartY = py + 54

    slots.forEach((slot, i) => {
      const col = i % 3, row = Math.floor(i / 3)
      const sx = eqStartX + col * (eqSlotW + eqGap)
      const sy = eqStartY + row * (eqSlotH + eqGap + 18)
      const eq = player.equipment[slot]
      const isHov = mousePos.x >= sx && mousePos.x <= sx + eqSlotW && mousePos.y >= sy && mousePos.y <= sy + eqSlotH
      const isSel = equipSelectedSlot === i

      // Slot label
      ctx!.fillStyle = '#64748b'; ctx!.font = '8px monospace'
      ctx!.fillText(slotNames[slot], sx, sy - 3)

      // Slot bg
      ctx!.fillStyle = isSel ? 'rgba(251,191,36,0.15)' : isHov ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)'
      ctx!.fillRect(sx, sy, eqSlotW, eqSlotH)
      ctx!.strokeStyle = isSel ? '#fbbf24' : isHov ? '#94a3b8' : '#374151'
      ctx!.lineWidth = isSel ? 2 : 1
      ctx!.strokeRect(sx, sy, eqSlotW, eqSlotH)

      if (eq) {
        // Equipped item with level
        const lvlStr = eq.level > 1 ? ` +${eq.level - 1}` : ''
        ctx!.fillStyle = RARITY_COLORS[eq.rarity]; ctx!.font = 'bold 9px monospace'
        ctx!.fillText(`${eq.icon} ${eq.name}${lvlStr}`, sx + 4, sy + 16)
        // Rarity + passive
        ctx!.fillStyle = RARITY_COLORS[eq.rarity]; ctx!.font = '7px monospace'
        const passiveLabel = eq.passive !== 'none' ? ` ${PASSIVE_NAMES[eq.passive]}` : ''
        ctx!.fillText(`[${RARITY_NAMES[eq.rarity]}]${passiveLabel}`, sx + 4, sy + 28)

        // Unequip button [Gỡ]
        const btnX = sx + eqSlotW - 28, btnY = sy + 4
        const btnHov = mousePos.x >= btnX && mousePos.x <= btnX + 24 && mousePos.y >= btnY && mousePos.y <= btnY + 16
        ctx!.fillStyle = btnHov ? 'rgba(239,68,68,0.4)' : 'rgba(239,68,68,0.15)'
        ctx!.fillRect(btnX, btnY, 24, 16)
        ctx!.strokeStyle = '#ef4444'; ctx!.lineWidth = 1
        ctx!.strokeRect(btnX, btnY, 24, 16)
        ctx!.fillStyle = btnHov ? '#fff' : '#ef4444'; ctx!.font = 'bold 8px monospace'; ctx!.textAlign = 'center'
        ctx!.fillText('Gỡ', btnX + 12, btnY + 12)
        ctx!.textAlign = 'left'

        // Mini stats
        const stats = []
        if (eq.stats.hp) stats.push(`❤+${eq.stats.hp}`)
        if (eq.stats.atk) stats.push(`⚔+${eq.stats.atk}`)
        if (eq.stats.def) stats.push(`🛡+${eq.stats.def}`)
        ctx!.fillStyle = '#94a3b8'; ctx!.font = '7px monospace'
        ctx!.fillText(stats.join(' '), sx + 4, sy + 40)
      } else {
        ctx!.fillStyle = '#374151'; ctx!.font = '10px monospace'; ctx!.textAlign = 'center'
        ctx!.fillText('Trống', sx + eqSlotW / 2, sy + 26)
        ctx!.textAlign = 'left'
      }
    })

    // === Inventory list (right side shows matching items from bag) ===
    const invX = px + 14, invY = eqStartY + 2 * (eqSlotH + eqGap + 18) + 16
    ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 10px monospace'
    ctx.fillText(`� Kho trang bị (${equipInventory.length})`, invX, invY)

    if (equipInventory.length === 0) {
      ctx.fillStyle = '#64748b'; ctx.font = '9px monospace'
      ctx.fillText('Trống - tiêu diệt quái vật để nhận trang bị!', invX, invY + 16)
    }

    const maxShow = 6
    equipInventory.slice(0, maxShow).forEach((eq, i) => {
      const ey = invY + 14 + i * 22
      const isItemHov = mousePos.x >= invX && mousePos.x <= invX + panelW - 28 && mousePos.y >= ey - 4 && mousePos.y <= ey + 14

      ctx!.fillStyle = isItemHov ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)'
      ctx!.fillRect(invX, ey - 4, panelW - 28, 18)

      // Item info with level
      const lvlStr = eq.level > 1 ? ` +${eq.level - 1}` : ''
      ctx!.fillStyle = RARITY_COLORS[eq.rarity]; ctx!.font = '9px monospace'
      ctx!.fillText(`${eq.icon} ${eq.name}${lvlStr}`, invX + 4, ey + 8)

      // Slot + passive
      ctx!.fillStyle = '#64748b'; ctx!.font = '7px monospace'
      const passiveStr = eq.passive !== 'none' ? ` ${PASSIVE_NAMES[eq.passive]}` : ''
      ctx!.fillText(`[${slotNames[eq.slot]}]${passiveStr}`, invX + 140, ey + 8)

      // Button positions
      let btnX = invX + panelW - 128

      // [⬆] Upgrade button (need 2 same-slot materials)
      const canUp = canUpgrade(eq, equipInventory)
      if (canUp) {
        const upgBtnHov = mousePos.x >= btnX && mousePos.x <= btnX + 20 && mousePos.y >= ey - 2 && mousePos.y <= ey + 12
        ctx!.fillStyle = upgBtnHov ? 'rgba(251,191,36,0.5)' : 'rgba(251,191,36,0.15)'
        ctx!.fillRect(btnX, ey - 2, 20, 14)
        ctx!.strokeStyle = '#fbbf24'; ctx!.lineWidth = 1; ctx!.strokeRect(btnX, ey - 2, 20, 14)
        ctx!.fillStyle = upgBtnHov ? '#fff' : '#fbbf24'; ctx!.font = 'bold 8px monospace'; ctx!.textAlign = 'center'
        ctx!.fillText('⬆', btnX + 10, ey + 9)
        ctx!.textAlign = 'left'
        btnX += 24
      }

      // [Mặc] button
      const eqBtnX = btnX, eqBtnY = ey - 2
      const eqBtnHov = mousePos.x >= eqBtnX && mousePos.x <= eqBtnX + 30 && mousePos.y >= eqBtnY && mousePos.y <= eqBtnY + 14
      ctx!.fillStyle = eqBtnHov ? 'rgba(74,222,128,0.4)' : 'rgba(74,222,128,0.15)'
      ctx!.fillRect(eqBtnX, eqBtnY, 30, 14)
      ctx!.strokeStyle = '#4ade80'; ctx!.lineWidth = 1; ctx!.strokeRect(eqBtnX, eqBtnY, 30, 14)
      ctx!.fillStyle = eqBtnHov ? '#fff' : '#4ade80'; ctx!.font = 'bold 7px monospace'; ctx!.textAlign = 'center'
      ctx!.fillText('Mặc', eqBtnX + 15, eqBtnY + 10)

      // [Bỏ] button
      const delBtnX = eqBtnX + 36
      const delBtnHov = mousePos.x >= delBtnX && mousePos.x <= delBtnX + 24 && mousePos.y >= eqBtnY && mousePos.y <= eqBtnY + 14
      ctx!.fillStyle = delBtnHov ? 'rgba(239,68,68,0.4)' : 'rgba(239,68,68,0.15)'
      ctx!.fillRect(delBtnX, eqBtnY, 24, 14)
      ctx!.strokeStyle = '#ef4444'; ctx!.lineWidth = 1; ctx!.strokeRect(delBtnX, eqBtnY, 24, 14)
      ctx!.fillStyle = delBtnHov ? '#fff' : '#ef4444'; ctx!.font = 'bold 7px monospace'
      ctx!.fillText('Bỏ', delBtnX + 12, eqBtnY + 10)
      ctx!.textAlign = 'left'
    })

    if (equipInventory.length > maxShow) {
      ctx.fillStyle = '#64748b'; ctx.font = '8px monospace'
      ctx.fillText(`... và ${equipInventory.length - maxShow} item khác`, invX + 4, invY + 14 + maxShow * 22 + 8)
    }
  } else if (invTab === 2) {
    // Consumables tab
    ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 14px monospace'; ctx.textAlign = 'center'
    ctx.fillText('🧪 VẬT PHẨM', px + panelW / 2, py + 50)
    ctx.textAlign = 'left'

    const items = [
      { type: 'hp_potion', name: '❤️ HP Potion', desc: `Hồi ${HP_POTION_HEAL} HP`, key: 'F', color: '#ef4444' },
      { type: 'mp_potion', name: '💙 MP Potion', desc: `Hồi ${MP_POTION_HEAL} MP`, key: 'G', color: '#3b82f6' },
    ]
    items.forEach((item, i) => {
      const iy = py + 70 + i * 60
      const c = consumables.find(c => c.type === item.type)
      const count = c?.count ?? 0

      ctx!.fillStyle = 'rgba(255,255,255,0.05)'
      ctx!.fillRect(px + 40, iy, panelW - 80, 48)
      ctx!.strokeStyle = item.color; ctx!.lineWidth = 1
      ctx!.strokeRect(px + 40, iy, panelW - 80, 48)

      ctx!.fillStyle = item.color; ctx!.font = 'bold 16px monospace'
      ctx!.fillText(item.name, px + 56, iy + 20)
      ctx!.fillStyle = '#94a3b8'; ctx!.font = '10px monospace'
      ctx!.fillText(item.desc, px + 56, iy + 36)

      ctx!.fillStyle = '#e2e8f0'; ctx!.font = 'bold 20px monospace'; ctx!.textAlign = 'right'
      ctx!.fillText(`x${count}`, px + panelW - 56, iy + 24)
      ctx!.fillStyle = '#64748b'; ctx!.font = '9px monospace'
      ctx!.fillText(`[${item.key}]`, px + panelW - 56, iy + 40)
      ctx!.textAlign = 'left'
    })

    // EXP gems
    ctx.fillStyle = '#94a3b8'; ctx.font = '10px monospace'
    ctx.fillText('💡 Dùng F/G để uống thuốc ngoài giao diện này', px + 40, py + panelH - 30)
  } else if (invTab === 3) {
    // WINGS TAB
    ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 14px monospace'; ctx.textAlign = 'center'
    ctx.fillText('🪽 CÁNH', px + panelW / 2, py + 50)
    ctx.textAlign = 'left'

    if (ownedWings.length === 0) {
      ctx.fillStyle = '#4b5563'; ctx.font = '10px monospace'; ctx.textAlign = 'center'
      ctx.fillText('Chưa có cánh nào!', px + panelW / 2, py + 120)
      ctx.fillText('Giết quái có cơ hội rơi cánh', px + panelW / 2, py + 140)
      ctx.textAlign = 'left'
    } else {
      ownedWings.forEach((wt, i) => {
        const wCfg = WINGS[wt]
        const col = i % 4, row = Math.floor(i / 4)
        const wx = px + 20 + col * 110
        const wy = py + 66 + row * 80
        const isEquipped = equippedWing?.id === wt
        ctx!.fillStyle = isEquipped ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.05)'
        ctx!.fillRect(wx, wy, 100, 66)
        ctx!.strokeStyle = isEquipped ? '#fbbf24' : RARITY_COLORS[wCfg.rarity]
        ctx!.lineWidth = isEquipped ? 2 : 1
        ctx!.strokeRect(wx, wy, 100, 66)
        ctx!.font = '18px monospace'; ctx!.textAlign = 'center'
        ctx!.fillText(wCfg.icon, wx + 50, wy + 24)
        ctx!.fillStyle = RARITY_COLORS[wCfg.rarity]; ctx!.font = 'bold 8px monospace'
        ctx!.fillText(wCfg.name, wx + 50, wy + 40)
        ctx!.fillStyle = '#94a3b8'; ctx!.font = '7px monospace'
        ctx!.fillText(`+${wCfg.extraJumps} Jump`, wx + 50, wy + 52)
        if (isEquipped) {
          ctx!.fillStyle = '#fbbf24'; ctx!.font = 'bold 7px monospace'
          ctx!.fillText('ĐANG ĐEO', wx + 50, wy + 62)
        } else {
          ctx!.fillStyle = '#64748b'; ctx!.font = '7px monospace'
          ctx!.fillText('Click đeo', wx + 50, wy + 62)
        }
        ctx!.textAlign = 'left'
      })
    }

    // Equipped wing info
    if (equippedWing) {
      ctx.fillStyle = 'rgba(251,191,36,0.08)'; ctx.fillRect(px + 20, py + panelH - 60, panelW - 40, 40)
      ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 1; ctx.strokeRect(px + 20, py + panelH - 60, panelW - 40, 40)
      ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 10px monospace'
      ctx.fillText(`Đang đeo: ${equippedWing.icon} ${equippedWing.name}`, px + 30, py + panelH - 42)
      ctx.fillStyle = '#94a3b8'; ctx.font = '9px monospace'
      ctx.fillText(`+${equippedWing.extraJumps} nhảy | Giảm ${Math.round(equippedWing.floatReduction * 100)}% trọng lực | Bay ${(equippedWing.flyDuration / 60).toFixed(1)}s`, px + 30, py + panelH - 28)
    }
  }
}

function resizeCanvas() {
  if (!canvasRef.value) return
  const container = canvasRef.value.parentElement
  if (!container) return
  const maxW = Math.min(container.clientWidth - 32, CANVAS_WIDTH)
  W = maxW; H = Math.floor(maxW / (CANVAS_WIDTH / CANVAS_HEIGHT))
  canvasRef.value.width = W; canvasRef.value.height = H
  if (gameState.value !== 'playing') generateMap()
}

onMounted(() => {
  if (!canvasRef.value) return
  ctx = canvasRef.value.getContext('2d')
  if (!ctx) return
  ctx.imageSmoothingEnabled = false
  resizeCanvas(); initBackground(); generateMap()
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keydown', handleNameKeyInput)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('resize', resizeCanvas)
  canvasRef.value.addEventListener('click', onCanvasClick)
  canvasRef.value.addEventListener('mousemove', onMouseMove)
  animationId = requestAnimationFrame(gameLoop)
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keydown', handleNameKeyInput)
  window.removeEventListener('keyup', onKeyUp)
  window.removeEventListener('resize', resizeCanvas)
  canvasRef.value?.removeEventListener('click', onCanvasClick)
  canvasRef.value?.removeEventListener('mousemove', onMouseMove)
})
</script>

<template>
  <div class="min-h-screen bg-[#0f0f23] text-white font-mono flex flex-col items-center justify-center px-4 py-6 relative">
    <RouterLink to="/"
      class="absolute top-4 left-4 z-10 inline-flex items-center gap-2 border border-gray-700 bg-gray-900/80 px-4 py-2 text-xs text-gray-400 transition hover:border-red-500 hover:text-white rounded">
      &larr; Về trang chủ
    </RouterLink>
    <div class="relative w-full max-w-[960px]">
      <canvas ref="canvasRef" tabindex="0"
        class="w-full border-2 border-gray-700 rounded-lg shadow-2xl shadow-purple-900/30 cursor-pointer"
        :class="{ 'border-red-500/50': gameState === 'gameover', 'border-green-500/30': gameState === 'playing' }"
        @click="($event.target as HTMLCanvasElement)?.focus()" />
    </div>
    <div class="mt-4 flex gap-3 sm:hidden">
      <button class="w-14 h-14 bg-gray-800 border border-gray-600 rounded-lg text-2xl active:bg-gray-700 active:scale-95 transition"
        @touchstart.prevent="keys['ArrowLeft'] = true" @touchend.prevent="keys['ArrowLeft'] = false">←</button>
      <button class="w-14 h-14 bg-gray-800 border border-gray-600 rounded-lg text-2xl active:bg-gray-700 active:scale-95 transition"
        @touchstart.prevent="keys['ArrowRight'] = true" @touchend.prevent="keys['ArrowRight'] = false">→</button>
      <button class="w-14 h-14 bg-blue-800 border border-blue-600 rounded-lg text-lg active:bg-blue-700 active:scale-95 transition"
        @touchstart.prevent="keys['Space'] = true" @touchend.prevent="keys['Space'] = false">⬆</button>
      <button class="w-14 h-14 bg-red-800 border border-red-600 rounded-lg text-lg active:bg-red-700 active:scale-95 transition"
        @touchstart.prevent="keys['KeyZ'] = true" @touchend.prevent="keys['KeyZ'] = false">⚔</button>
    </div>
  </div>
</template>
