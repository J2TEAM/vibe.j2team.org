import type { EquipmentConfig, EquipSlot, Rarity, EquipmentDrop, PassiveType } from '../types'

// === RARITY COLORS ===
export const RARITY_COLORS: Record<Rarity, string> = {
    common: '#9ca3af',
    uncommon: '#4ade80',
    rare: '#60a5fa',
    epic: '#c084fc',
    legendary: '#fb923c',
}

export const RARITY_NAMES: Record<Rarity, string> = {
    common: 'Thường',
    uncommon: 'Không Phổ Biến',
    rare: 'Hiếm',
    epic: 'Sử Thi',
    legendary: 'Huyền Thoại',
}

export const SLOT_NAMES: Record<EquipSlot, string> = {
    head: '🎩 Mũ', chest: '👕 Áo', legs: '👖 Quần',
    gloves: '🧤 Găng', boots: '👟 Giày', accessory: '📿 Phụ Kiện',
}

export const SLOT_ICONS: Record<EquipSlot, string> = {
    head: '🎩', chest: '👕', legs: '👖',
    gloves: '🧤', boots: '👟', accessory: '📿',
}

// === PASSIVE SKILLS ===
export const PASSIVE_NAMES: Record<PassiveType, string> = {
    lightning: '⚡ Sấm Sét',
    lifesteal: '🩸 Hút Máu',
    thorns: '🌵 Gai Phản',
    speed_aura: '� Hào Quang Tốc',
    mana_shield: '🛡 Khiên Mana',
    crit_burst: '💥 Bùng Nổ Chí Mạng',
    none: '',
}
export const PASSIVE_DESCS: Record<PassiveType, string> = {
    lightning: 'Tấn công có 15% tạo sấm sét',
    lifesteal: 'Hồi 8% dmg thành HP',
    thorns: 'Phản 20% dmg nhận lại quái',
    speed_aura: 'Tăng 15% tốc độ di chuyển',
    mana_shield: 'Giảm 10% dmg, trừ MP thay HP',
    crit_burst: 'Crit tăng 2x dmg thay vì 1.8x',
    none: '',
}

let uidCounter = 1

// === EQUIPMENT TEMPLATES (base stats, will be randomized) ===
interface EquipTemplate {
    id: string; name: string; slot: EquipSlot; rarity: Rarity; icon: string; color: string
    baseStats: { hp?: number; atk?: number; def?: number; speed?: number; jumpPower?: number; manaRegen?: number; critChance?: number }
    description: string
    possiblePassives: PassiveType[]
}

const EQUIPMENT_TEMPLATES: EquipTemplate[] = [
    // HEAD
    { id: 'cloth_hood', name: 'Mũ Vải', slot: 'head', rarity: 'common', icon: '🎩', color: '#9ca3af', baseStats: { hp: 10 }, description: 'Mũ vải đơn giản', possiblePassives: ['none'] },
    { id: 'iron_helm', name: 'Mũ Sắt', slot: 'head', rarity: 'uncommon', icon: '⛑️', color: '#4ade80', baseStats: { hp: 25, def: 3 }, description: 'Mũ sắt bảo vệ tốt hơn', possiblePassives: ['none', 'thorns'] },
    { id: 'ninja_mask', name: 'Mặt Nạ Ninja', slot: 'head', rarity: 'rare', icon: '🥷', color: '#60a5fa', baseStats: { hp: 35, speed: 0.3, critChance: 5 }, description: 'Tăng tốc và crit', possiblePassives: ['none', 'speed_aura', 'crit_burst'] },
    { id: 'dragon_crown', name: 'Vương Miện Rồng', slot: 'head', rarity: 'epic', icon: '👑', color: '#c084fc', baseStats: { hp: 60, atk: 8, def: 5 }, description: 'Vương miện của Rồng Cổ Đại', possiblePassives: ['lightning', 'crit_burst', 'none'] },
    { id: 'shadow_hood', name: 'Mũ Trùm Bóng Tối', slot: 'head', rarity: 'legendary', icon: '🌑', color: '#fb923c', baseStats: { hp: 80, atk: 12, critChance: 15 }, description: 'Bóng tối bao phủ', possiblePassives: ['lifesteal', 'crit_burst', 'lightning'] },
    // CHEST
    { id: 'cloth_shirt', name: 'Áo Vải', slot: 'chest', rarity: 'common', icon: '👕', color: '#9ca3af', baseStats: { def: 3 }, description: 'Áo vải nhẹ nhàng', possiblePassives: ['none'] },
    { id: 'leather_armor', name: 'Giáp Da', slot: 'chest', rarity: 'uncommon', icon: '🦺', color: '#4ade80', baseStats: { def: 8, hp: 15 }, description: 'Giáp da cứng cáp', possiblePassives: ['none', 'thorns'] },
    { id: 'chain_mail', name: 'Giáp Xích', slot: 'chest', rarity: 'rare', icon: '🛡️', color: '#60a5fa', baseStats: { def: 15, hp: 30 }, description: 'Giáp xích bảo vệ tốt', possiblePassives: ['thorns', 'mana_shield', 'none'] },
    { id: 'flame_plate', name: 'Giáp Lửa', slot: 'chest', rarity: 'epic', icon: '🔥', color: '#c084fc', baseStats: { def: 22, hp: 40, atk: 5 }, description: 'Giáp phủ ngọn lửa', possiblePassives: ['lightning', 'thorns', 'lifesteal'] },
    { id: 'divine_robe', name: 'Áo Thần Thánh', slot: 'chest', rarity: 'legendary', icon: '✨', color: '#fb923c', baseStats: { def: 30, hp: 60, manaRegen: 0.05 }, description: 'Hồi mana mạnh', possiblePassives: ['mana_shield', 'lifesteal', 'lightning'] },
    // LEGS
    { id: 'cloth_pants', name: 'Quần Vải', slot: 'legs', rarity: 'common', icon: '👖', color: '#9ca3af', baseStats: { speed: 0.2 }, description: 'Quần vải thoải mái', possiblePassives: ['none'] },
    { id: 'runner_pants', name: 'Quần Chạy Bộ', slot: 'legs', rarity: 'uncommon', icon: '🩳', color: '#4ade80', baseStats: { speed: 0.5, def: 2 }, description: 'Tăng tốc di chuyển', possiblePassives: ['none', 'speed_aura'] },
    { id: 'shadow_legs', name: 'Quần Bóng Đêm', slot: 'legs', rarity: 'rare', icon: '🌙', color: '#60a5fa', baseStats: { speed: 0.8, def: 5, critChance: 3 }, description: 'Nhanh như bóng đêm', possiblePassives: ['speed_aura', 'none'] },
    { id: 'storm_greaves', name: 'Quần Bão Tố', slot: 'legs', rarity: 'epic', icon: '⚡', color: '#c084fc', baseStats: { speed: 1.0, def: 8, jumpPower: -1 }, description: 'Sức mạnh bão tố', possiblePassives: ['lightning', 'speed_aura'] },
    { id: 'wind_hakama', name: 'Hakama Gió', slot: 'legs', rarity: 'legendary', icon: '🌪️', color: '#fb923c', baseStats: { speed: 1.5, def: 12, jumpPower: -2 }, description: 'Bay như gió', possiblePassives: ['speed_aura', 'lightning', 'crit_burst'] },
    // GLOVES
    { id: 'cloth_gloves', name: 'Găng Vải', slot: 'gloves', rarity: 'common', icon: '🧤', color: '#9ca3af', baseStats: { atk: 3 }, description: 'Găng tay vải mỏng', possiblePassives: ['none'] },
    { id: 'iron_gauntlets', name: 'Găng Sắt', slot: 'gloves', rarity: 'uncommon', icon: '🥊', color: '#4ade80', baseStats: { atk: 8, def: 2 }, description: 'Đấm mạnh hơn', possiblePassives: ['none', 'lifesteal'] },
    { id: 'blade_gloves', name: 'Găng Lưỡi Dao', slot: 'gloves', rarity: 'rare', icon: '🗡️', color: '#60a5fa', baseStats: { atk: 15, critChance: 5 }, description: 'Có lưỡi sắc', possiblePassives: ['crit_burst', 'lifesteal', 'none'] },
    { id: 'dragon_claws', name: 'Vuốt Rồng', slot: 'gloves', rarity: 'epic', icon: '🐉', color: '#c084fc', baseStats: { atk: 22, critChance: 10, speed: 0.2 }, description: 'Vuốt rồng sắc bén', possiblePassives: ['lightning', 'crit_burst', 'lifesteal'] },
    { id: 'god_fists', name: 'Nắm Đấm Thần', slot: 'gloves', rarity: 'legendary', icon: '💥', color: '#fb923c', baseStats: { atk: 35, critChance: 15, def: 5 }, description: 'Sức mạnh thần thánh', possiblePassives: ['lightning', 'crit_burst', 'lifesteal'] },
    // BOOTS
    { id: 'sandals', name: 'Dép Rơm', slot: 'boots', rarity: 'common', icon: '👟', color: '#9ca3af', baseStats: { speed: 0.1, jumpPower: -0.3 }, description: 'Dép rơm đơn giản', possiblePassives: ['none'] },
    { id: 'ninja_tabi', name: 'Giày Tabi', slot: 'boots', rarity: 'uncommon', icon: '🥋', color: '#4ade80', baseStats: { speed: 0.3, jumpPower: -0.8 }, description: 'Giày ninja', possiblePassives: ['none', 'speed_aura'] },
    { id: 'wind_boots', name: 'Giày Gió', slot: 'boots', rarity: 'rare', icon: '💨', color: '#60a5fa', baseStats: { speed: 0.5, jumpPower: -1.5, def: 3 }, description: 'Nhảy cao chạy nhanh', possiblePassives: ['speed_aura', 'none'] },
    { id: 'thunder_boots', name: 'Giày Sấm Sét', slot: 'boots', rarity: 'epic', icon: '⚡', color: '#c084fc', baseStats: { speed: 0.8, jumpPower: -2, def: 5 }, description: 'Nhanh như sấm', possiblePassives: ['lightning', 'speed_aura'] },
    { id: 'celestial_step', name: 'Bước Chân Tiên', slot: 'boots', rarity: 'legendary', icon: '🌟', color: '#fb923c', baseStats: { speed: 1.2, jumpPower: -2.5, manaRegen: 0.03 }, description: 'Bay bước trên mây', possiblePassives: ['speed_aura', 'mana_shield', 'lightning'] },
    // ACCESSORY
    { id: 'lucky_charm', name: 'Bùa May Mắn', slot: 'accessory', rarity: 'common', icon: '🍀', color: '#9ca3af', baseStats: { critChance: 3 }, description: 'Tăng chút may mắn', possiblePassives: ['none'] },
    { id: 'ruby_ring', name: 'Nhẫn Hồng Ngọc', slot: 'accessory', rarity: 'uncommon', icon: '💍', color: '#4ade80', baseStats: { atk: 5, hp: 10 }, description: 'Nhẫn quý', possiblePassives: ['none', 'lifesteal'] },
    { id: 'mana_crystal', name: 'Pha Lê Mana', slot: 'accessory', rarity: 'rare', icon: '🔮', color: '#60a5fa', baseStats: { manaRegen: 0.05, hp: 20 }, description: 'Hồi mana nhanh', possiblePassives: ['mana_shield', 'none'] },
    { id: 'phoenix_feather', name: 'Lông Phượng Hoàng', slot: 'accessory', rarity: 'epic', icon: '🪶', color: '#c084fc', baseStats: { hp: 50, atk: 10, manaRegen: 0.03 }, description: 'Sức mạnh tái sinh', possiblePassives: ['lifesteal', 'mana_shield', 'crit_burst'] },
    { id: 'dragon_heart', name: 'Tim Rồng', slot: 'accessory', rarity: 'legendary', icon: '❤️‍🔥', color: '#fb923c', baseStats: { hp: 80, atk: 20, def: 10, critChance: 10 }, description: 'Trái tim rồng', possiblePassives: ['lightning', 'lifesteal', 'crit_burst'] },
]

// === RANDOM STAT VARIATION ===
function randomizeStat(base: number, variance = 0.3): number {
    const mult = 1 + (Math.random() * 2 - 1) * variance // 0.7x - 1.3x
    if (base >= 1) return Math.max(1, Math.round(base * mult))
    return Math.round(base * mult * 100) / 100 // for decimals like speed
}

function randomizeStats(base: EquipTemplate['baseStats']): EquipmentConfig['stats'] {
    const stats: EquipmentConfig['stats'] = {}
    if (base.hp) stats.hp = randomizeStat(base.hp)
    if (base.atk) stats.atk = randomizeStat(base.atk)
    if (base.def) stats.def = randomizeStat(base.def)
    if (base.speed) stats.speed = randomizeStat(base.speed, 0.25)
    if (base.jumpPower) stats.jumpPower = randomizeStat(base.jumpPower, 0.2)
    if (base.manaRegen) stats.manaRegen = randomizeStat(base.manaRegen, 0.3)
    if (base.critChance) stats.critChance = randomizeStat(base.critChance, 0.25)
    return stats
}

function pickPassive(possibles: PassiveType[]): PassiveType {
    return possibles[Math.floor(Math.random() * possibles.length)] ?? 'none'
}

function createEquipFromTemplate(template: EquipTemplate): EquipmentConfig {
    const passive = pickPassive(template.possiblePassives)
    return {
        id: template.id,
        uid: uidCounter++,
        name: template.name,
        slot: template.slot,
        rarity: template.rarity,
        icon: template.icon,
        level: 1,
        stats: randomizeStats(template.baseStats),
        passive,
        passiveDesc: passive !== 'none' ? PASSIVE_DESCS[passive] : undefined,
        description: template.description,
        color: template.color,
    }
}

// === DROP LOGIC ===
const RARITY_WEIGHTS: Record<Rarity, number> = {
    common: 40, uncommon: 30, rare: 18, epic: 9, legendary: 3,
}

export function rollRarity(monsterType: string): Rarity {
    const weights = { ...RARITY_WEIGHTS }
    if (monsterType === 'boss') { weights.epic += 20; weights.legendary += 12; weights.common -= 20 }
    else if (monsterType === 'demon') { weights.rare += 10; weights.epic += 5 }
    const total = Object.values(weights).reduce((a, b) => a + b, 0)
    let roll = Math.random() * total
    for (const [rarity, weight] of Object.entries(weights)) {
        roll -= weight
        if (roll <= 0) return rarity as Rarity
    }
    return 'common'
}

export function getRandomEquipment(monsterType: string): EquipmentConfig {
    const rarity = rollRarity(monsterType)
    const pool = EQUIPMENT_TEMPLATES.filter(e => e.rarity === rarity)
    const template = pool[Math.floor(Math.random() * pool.length)]
    if (!template) return createEquipFromTemplate(EQUIPMENT_TEMPLATES[0] as EquipTemplate)
    return createEquipFromTemplate(template)
}

// === UPGRADE SYSTEM ===
// Need 1 base + 2 materials of SAME SLOT to upgrade
// Materials don't need same id, just same slot
export function canUpgrade(base: EquipmentConfig, inventory: EquipmentConfig[]): boolean {
    if (base.level >= 10) return false
    // Count how many same-slot items exist (excluding the base itself by uid)
    const sameSlot = inventory.filter(i => i.slot === base.slot && i.uid !== base.uid)
    return sameSlot.length >= 2
}

export function findUpgradeMaterials(base: EquipmentConfig, inventory: EquipmentConfig[]): EquipmentConfig[] {
    return inventory.filter(i => i.slot === base.slot && i.uid !== base.uid).slice(0, 2)
}

export function upgradeEquipment(base: EquipmentConfig, materials: EquipmentConfig[]): EquipmentConfig {
    const newLevel = Math.min(10, base.level + 1)
    const boost = 1 + (newLevel - 1) * 0.15 // 15% per level
    const prevBoost = 1 + (base.level - 1) * 0.15
    const newStats: EquipmentConfig['stats'] = {}
    if (base.stats.hp) newStats.hp = Math.round(base.stats.hp / prevBoost * boost)
    if (base.stats.atk) newStats.atk = Math.round(base.stats.atk / prevBoost * boost)
    if (base.stats.def) newStats.def = Math.round(base.stats.def / prevBoost * boost)
    if (base.stats.speed) newStats.speed = Math.round(base.stats.speed / prevBoost * boost * 100) / 100
    if (base.stats.jumpPower) newStats.jumpPower = Math.round(base.stats.jumpPower / prevBoost * boost * 100) / 100
    if (base.stats.manaRegen) newStats.manaRegen = Math.round(base.stats.manaRegen / prevBoost * boost * 100) / 100
    if (base.stats.critChance) newStats.critChance = Math.round(base.stats.critChance / prevBoost * boost)

    // Keep best passive from base + materials
    const allPassives = [base.passive, ...materials.map(m => m.passive)].filter(p => p !== 'none')
    const keepPassive = allPassives.length > 0 ? allPassives[0] as PassiveType : base.passive

    return {
        ...base,
        level: newLevel,
        stats: newStats,
        passive: keepPassive,
        passiveDesc: keepPassive !== 'none' ? PASSIVE_DESCS[keepPassive] : undefined,
        name: base.name.replace(/ \+\d+$/, '') + (newLevel > 1 ? ` +${newLevel - 1}` : ''),
    }
}

export function createEquipmentDrop(x: number, y: number, equipment: EquipmentConfig): EquipmentDrop {
    return { x, y, vy: -4, w: 22, h: 22, equipment, life: 480, onGround: false, animFrame: 0 }
}

export function drawEquipmentDrop(ctx: CanvasRenderingContext2D, drop: EquipmentDrop, cameraX: number) {
    const dx = drop.x - cameraX, dy = drop.y
    const eq = drop.equipment
    const rarityColor = RARITY_COLORS[eq.rarity]
    const bob = Math.sin(Date.now() * 0.005 + drop.x) * 3

    // Glow
    const glowAlpha = 0.3 + Math.sin(Date.now() * 0.004) * 0.15
    ctx.fillStyle = `${rarityColor}${Math.floor(glowAlpha * 255).toString(16).padStart(2, '0')}`
    ctx.beginPath(); ctx.arc(dx + drop.w / 2, dy + drop.h / 2 + bob, 16, 0, Math.PI * 2); ctx.fill()

    ctx.strokeStyle = rarityColor; ctx.lineWidth = 2
    ctx.beginPath(); ctx.arc(dx + drop.w / 2, dy + drop.h / 2 + bob, 12, 0, Math.PI * 2); ctx.stroke()

    ctx.fillStyle = 'rgba(15,15,35,0.9)'
    ctx.beginPath(); ctx.arc(dx + drop.w / 2, dy + drop.h / 2 + bob, 10, 0, Math.PI * 2); ctx.fill()

    ctx.font = '12px monospace'; ctx.textAlign = 'center'
    ctx.fillText(eq.icon, dx + drop.w / 2, dy + drop.h / 2 + bob + 4)

    if (drop.life < 120 && Math.floor(Date.now() / 200) % 2 === 0) { ctx.textAlign = 'left'; return }

    ctx.fillStyle = rarityColor; ctx.font = 'bold 8px monospace'
    const lvlStr = eq.level > 1 ? ` +${eq.level - 1}` : ''
    ctx.fillText(eq.name + lvlStr, dx + drop.w / 2, dy - 6 + bob)

    // Passive indicator
    if (eq.passive !== 'none') {
        ctx.fillStyle = '#fbbf24'; ctx.font = '7px monospace'
        ctx.fillText(PASSIVE_NAMES[eq.passive], dx + drop.w / 2, dy - 14 + bob)
    }

    // Sparkles for epic+
    if (eq.rarity === 'epic' || eq.rarity === 'legendary') {
        const sparkleCount = eq.rarity === 'legendary' ? 4 : 2
        for (let i = 0; i < sparkleCount; i++) {
            const angle = Date.now() * 0.003 + i * (Math.PI * 2 / sparkleCount)
            ctx.fillStyle = rarityColor
            ctx.fillRect(dx + drop.w / 2 + Math.cos(angle) * 14 - 1, dy + drop.h / 2 + bob + Math.sin(angle) * 14 - 1, 2, 2)
        }
    }
    ctx.textAlign = 'left'
}

// drawEquipmentPanel removed - handled inline in drawTabbedInventory in index.vue

// === CALC EQUIPMENT BONUSES ===
export function calcEquipmentBonuses(equipped: Partial<Record<EquipSlot, EquipmentConfig | null>>) {
    const bonuses = { hp: 0, atk: 0, def: 0, speed: 0, jumpPower: 0, manaRegen: 0, critChance: 0 }
    for (const eq of Object.values(equipped)) {
        if (!eq) continue
        const lvlMult = 1 + (eq.level - 1) * 0.15
        if (eq.stats.hp) bonuses.hp += Math.round(eq.stats.hp * lvlMult)
        if (eq.stats.atk) bonuses.atk += Math.round(eq.stats.atk * lvlMult)
        if (eq.stats.def) bonuses.def += Math.round(eq.stats.def * lvlMult)
        if (eq.stats.speed) bonuses.speed += eq.stats.speed * lvlMult
        if (eq.stats.jumpPower) bonuses.jumpPower += eq.stats.jumpPower * lvlMult
        if (eq.stats.manaRegen) bonuses.manaRegen += eq.stats.manaRegen * lvlMult
        if (eq.stats.critChance) bonuses.critChance += Math.round(eq.stats.critChance * lvlMult)
    }
    return bonuses
}

// === GET ALL PASSIVES from equipped items ===
export function getActivePassives(equipped: Partial<Record<EquipSlot, EquipmentConfig | null>>): PassiveType[] {
    const passives: PassiveType[] = []
    for (const eq of Object.values(equipped)) {
        if (eq && eq.passive !== 'none' && !passives.includes(eq.passive)) {
            passives.push(eq.passive)
        }
    }
    return passives
}
