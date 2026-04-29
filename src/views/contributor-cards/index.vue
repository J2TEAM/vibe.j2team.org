<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import { getAllAuthors } from '@/data/authors'
import { categories, type CategoryId } from '@/data/categories'

// ── Types ──
type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic'
type Phase = 'idle' | 'ripping' | 'reveal'

// ── Audio engine (Web Audio API — no files needed) ──
let audioCtx: AudioContext | null = null
function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext()
  if (audioCtx.state === 'suspended') audioCtx.resume()
  return audioCtx
}
function shouldPlay(): boolean {
  return !muted.value
}

const sfx = {
  packRip() {
    if (!shouldPlay()) return
    const ctx = getCtx()
    const t = ctx.currentTime
    // Smooth 3-note descending swoosh
    ;[0, 0.07, 0.15].forEach((offset, i) => {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(1200 - i * 300, t + offset)
      osc.frequency.exponentialRampToValueAtTime(400 - i * 80, t + offset + 0.12)
      const g = ctx.createGain()
      g.gain.setValueAtTime(0.18 - i * 0.04, t + offset)
      g.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.14)
      osc.connect(g).connect(ctx.destination)
      osc.start(t + offset)
      osc.stop(t + offset + 0.16)
    })
  },

  cardFlip() {
    if (!shouldPlay()) return
    const ctx = getCtx()
    const t = ctx.currentTime
    // 3-note quick whoosh: high→mid→low
    ;[1400, 900, 500].forEach((f, i) => {
      const osc = ctx.createOscillator()
      osc.type = i === 0 ? 'sine' : 'triangle'
      osc.frequency.setValueAtTime(f, t + i * 0.025)
      osc.frequency.exponentialRampToValueAtTime(f * 0.6, t + i * 0.025 + 0.04)
      const g = ctx.createGain()
      g.gain.setValueAtTime(0.15 - i * 0.03, t + i * 0.025)
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.025 + 0.06)
      osc.connect(g).connect(ctx.destination)
      osc.start(t + i * 0.025)
      osc.stop(t + i * 0.025 + 0.07)
    })
  },

  cardReveal(rarity: Rarity) {
    if (!shouldPlay()) return
    const ctx = getCtx()
    const t = ctx.currentTime
    if (rarity === 'mythic') {
      // Grand fanfare — 5-note ascending arpeggio + shimmer pad
      const notes = [523, 659, 784, 988, 1318]
      notes.forEach((f, i) => {
        const osc = ctx.createOscillator()
        osc.type = i < 3 ? 'sine' : 'triangle'
        osc.frequency.value = f
        const g = ctx.createGain()
        g.gain.setValueAtTime(0, t + i * 0.07)
        g.gain.linearRampToValueAtTime(0.18, t + i * 0.07 + 0.04)
        g.gain.setValueAtTime(0.18, t + i * 0.07 + 0.15)
        g.gain.exponentialRampToValueAtTime(0.001, t + 1.2)
        osc.connect(g).connect(ctx.destination)
        osc.start(t + i * 0.07)
        osc.stop(t + 1.3)
      })
      // Shimmer pad underneath
      const pad = ctx.createOscillator()
      pad.type = 'sine'
      pad.frequency.value = 262
      const gp = ctx.createGain()
      gp.gain.setValueAtTime(0, t)
      gp.gain.linearRampToValueAtTime(0.1, t + 0.3)
      gp.gain.exponentialRampToValueAtTime(0.001, t + 1.4)
      pad.connect(gp).connect(ctx.destination)
      pad.start(t)
      pad.stop(t + 1.5)
    } else if (rarity === 'legendary') {
      // Triumphant 4-note chord + rising sweep
      const chord = [440, 554, 659, 880]
      chord.forEach((f, i) => {
        const osc = ctx.createOscillator()
        osc.type = 'sine'
        osc.frequency.value = f
        const g = ctx.createGain()
        g.gain.setValueAtTime(0, t + i * 0.05)
        g.gain.linearRampToValueAtTime(0.14, t + i * 0.05 + 0.04)
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.8)
        osc.connect(g).connect(ctx.destination)
        osc.start(t + i * 0.05)
        osc.stop(t + 0.9)
      })
      // Rising sweep
      const sw = ctx.createOscillator()
      sw.type = 'triangle'
      sw.frequency.setValueAtTime(300, t)
      sw.frequency.exponentialRampToValueAtTime(1200, t + 0.3)
      const gs = ctx.createGain()
      gs.gain.setValueAtTime(0.06, t)
      gs.gain.exponentialRampToValueAtTime(0.001, t + 0.35)
      sw.connect(gs).connect(ctx.destination)
      sw.start(t)
      sw.stop(t + 0.4)
    } else if (rarity === 'epic') {
      // 3-note power chord: root + fifth + octave
      ;[330, 495, 660].forEach((f, i) => {
        const osc = ctx.createOscillator()
        osc.type = 'triangle'
        osc.frequency.value = f
        const g = ctx.createGain()
        g.gain.setValueAtTime(0, t + i * 0.04)
        g.gain.linearRampToValueAtTime(0.15, t + i * 0.04 + 0.03)
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.45)
        osc.connect(g).connect(ctx.destination)
        osc.start(t + i * 0.04)
        osc.stop(t + 0.5)
      })
    } else if (rarity === 'rare') {
      // 2-note rising interval
      ;[440, 660].forEach((f, i) => {
        const osc = ctx.createOscillator()
        osc.type = 'sine'
        osc.frequency.value = f
        const g = ctx.createGain()
        g.gain.setValueAtTime(0, t + i * 0.06)
        g.gain.linearRampToValueAtTime(0.12, t + i * 0.06 + 0.03)
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.3)
        osc.connect(g).connect(ctx.destination)
        osc.start(t + i * 0.06)
        osc.stop(t + 0.35)
      })
    } else {
      // Common/uncommon: gentle 2-note soft chime
      const base = rarity === 'uncommon' ? 520 : 440
      ;[base, base * 1.25].forEach((f, i) => {
        const osc = ctx.createOscillator()
        osc.type = 'sine'
        osc.frequency.value = f
        const g = ctx.createGain()
        g.gain.setValueAtTime(0, t + i * 0.05)
        g.gain.linearRampToValueAtTime(0.09, t + i * 0.05 + 0.02)
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.2)
        osc.connect(g).connect(ctx.destination)
        osc.start(t + i * 0.05)
        osc.stop(t + 0.25)
      })
    }
  },

  packSplit() {
    if (!shouldPlay()) return
    const ctx = getCtx()
    const t = ctx.currentTime
    // Bass thump + mid snap + high ping
    const bass = ctx.createOscillator()
    bass.type = 'sine'
    bass.frequency.setValueAtTime(120, t)
    bass.frequency.exponentialRampToValueAtTime(35, t + 0.18)
    const gb = ctx.createGain()
    gb.gain.setValueAtTime(0.4, t)
    gb.gain.exponentialRampToValueAtTime(0.001, t + 0.22)
    bass.connect(gb).connect(ctx.destination)
    bass.start(t)
    bass.stop(t + 0.25)
    // Mid snap — triangle tone
    const mid = ctx.createOscillator()
    mid.type = 'triangle'
    mid.frequency.setValueAtTime(800, t)
    mid.frequency.exponentialRampToValueAtTime(300, t + 0.06)
    const gm = ctx.createGain()
    gm.gain.setValueAtTime(0.18, t)
    gm.gain.exponentialRampToValueAtTime(0.001, t + 0.1)
    mid.connect(gm).connect(ctx.destination)
    mid.start(t)
    mid.stop(t + 0.12)
    // High ping — sine tap
    const hi = ctx.createOscillator()
    hi.type = 'sine'
    hi.frequency.setValueAtTime(1800, t + 0.02)
    hi.frequency.exponentialRampToValueAtTime(900, t + 0.06)
    const gh = ctx.createGain()
    gh.gain.setValueAtTime(0.12, t + 0.02)
    gh.gain.exponentialRampToValueAtTime(0.001, t + 0.08)
    hi.connect(gh).connect(ctx.destination)
    hi.start(t + 0.02)
    hi.stop(t + 0.1)
  },
}

interface CardData {
  author: string
  slug: string
  facebook: string | undefined
  apps: number
  ap: number
  cats: CategoryId[]
  rank: number | undefined
  rarity: Rarity
  initials: string
}

interface SlotData {
  card: CardData
  flipped: boolean
  isNew: boolean
  revealPhase: 'covered' | 'rarity' | 'open'
}

interface SaveData {
  owned: Record<string, number>
  packs: number
  claimedMilestones: number[]
  freePacks: number
  // gamification
  lastDaily: string // YYYY-MM-DD
  dailyLeft: number
  streak: number
  claimedCollectionPcts: number[]
  // pity system
  pullsSinceMythic: number
  totalPulls: number
  guaranteedFeatured: boolean
  featuredClaimed: boolean
}

// ── Constants ──
const RARITY: Record<Rarity, { letter: string; vi: string; hex: string; wt: number }> = {
  common: { letter: 'D', vi: 'Thường', hex: '#9ca3af', wt: 41.7 },
  uncommon: { letter: 'C', vi: 'Khá hiếm', hex: '#14b8a6', wt: 26 },
  rare: { letter: 'B', vi: 'Hiếm', hex: '#38BDF8', wt: 16 },
  epic: { letter: 'A', vi: 'Sử thi', hex: '#a855f7', wt: 7.5 },
  legendary: { letter: 'S', vi: 'Huyền thoại', hex: '#FFB830', wt: 8 },
  mythic: { letter: 'SSS', vi: 'Thần thoại', hex: '#ec4899', wt: 0.8 },
}

const RARITY_STARS: Record<Rarity, number> = {
  common: 1,
  uncommon: 2,
  rare: 3,
  epic: 4,
  legendary: 5,
  mythic: 6,
}

const FILTER_OPTS: Rarity[] = ['mythic', 'legendary', 'epic', 'rare', 'uncommon', 'common']
const PACK_SIZE = 5

// ── Helpers ──
const J2TEAM_SLUGS = new Set(['j2team', 'j2team-community'])

function toRarity(n: number, slug: string): Rarity {
  if (J2TEAM_SLUGS.has(slug)) return 'mythic'
  if (n >= 8) return 'legendary'
  if (n >= 5) return 'epic'
  if (n >= 3) return 'rare'
  if (n >= 2) return 'uncommon'
  return 'common'
}

function makeInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function catIcon(id: CategoryId): string {
  return categories.find((c) => c.id === id)?.icon ?? 'lucide:layout-grid'
}

// AP weights per category — harder apps earn more
const CAT_AP: Record<CategoryId, number> = {
  game: 15,
  creative: 14,
  tool: 12,
  learn: 11,
  finance: 11,
  health: 10,
  connect: 10,
  spiritual: 10,
  fun: 8,
  other: 8,
}
// Bonus AP for category diversity
const DIVERSITY_BONUS = 5

function calcAP(apps: { category: CategoryId }[]): number {
  const seen = new Set<CategoryId>()
  let ap = 0
  for (const app of apps) {
    ap += CAT_AP[app.category] ?? 10
    seen.add(app.category)
  }
  // diversity bonus: extra AP per unique category after the first
  if (seen.size > 1) ap += (seen.size - 1) * DIVERSITY_BONUS
  return ap
}

// ── Card pool ──
const pool = computed<CardData[]>(() => {
  const out: CardData[] = []
  for (const [, a] of getAllAuthors()) {
    const rarity = toRarity(a.apps.length, a.slug)
    out.push({
      author: a.author,
      slug: a.slug,
      facebook: a.facebook,
      apps: a.apps.length,
      ap: rarity === 'mythic' ? 999 : calcAP(a.apps),
      cats: a.categories,
      rank: a.rank,
      rarity,
      initials: makeInitials(a.author),
    })
  }
  return out
})

const byRarity = computed(() => {
  const m: Record<Rarity, CardData[]> = {
    common: [],
    uncommon: [],
    rare: [],
    epic: [],
    legendary: [],
    mythic: [],
  }
  for (const c of pool.value) m[c.rarity].push(c)
  return m
})

// ── Featured banner card (rotates weekly) ──
const featuredMythic = computed(() => {
  const mythics = byRarity.value.mythic
  if (mythics.length === 0) return null
  const week = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000))
  return mythics[week % mythics.length]!
})

// ── State ──
const view = ref<'pack' | 'collection'>('pack')
const phase = ref<Phase>('idle')
const slots = ref<SlotData[]>([])
const save = ref<SaveData>({
  owned: {},
  packs: 0,
  claimedMilestones: [],
  freePacks: 0,
  lastDaily: '',
  dailyLeft: 0,
  streak: 0,
  claimedCollectionPcts: [],
  pullsSinceMythic: 0,
  totalPulls: 0,
  guaranteedFeatured: false,
  featuredClaimed: false,
})
const selected = ref<CardData | null>(null)
const confirmReset = ref(false)
const showHelp = ref(false)
const filterRarity = ref<Rarity | 'all'>('all')
const onlyOwned = ref(false)
const stars = ref(0)
const sideTooltip = ref<string | null>(null)
const muted = ref(localStorage.getItem('j2team-cards-muted') === '1')

function toggleMute() {
  muted.value = !muted.value
  localStorage.setItem('j2team-cards-muted', muted.value ? '1' : '0')
}

function toggleTooltip(key: string) {
  sideTooltip.value = sideTooltip.value === key ? null : key
}

// ── Gamification constants ──
const DAILY_PACKS = 5
const STREAK_REWARDS: Record<number, number> = { 3: 2, 7: 5, 14: 8, 30: 10 }
const COLLECTION_MILESTONES = [25, 50, 75, 100]
const COLLECTION_REWARDS: Record<number, number> = { 25: 3, 50: 5, 75: 10, 100: 20 }
// ── Pity system ──
const SOFT_PITY_START = 65
const HARD_PITY = 80
const FEATURED_GUARANTEE = 120
const PITY_RATE_INCREASE = 6.613

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function processDaily() {
  const today = todayStr()
  if (save.value.lastDaily === today) return // already claimed today

  // Check streak
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yStr = yesterday.toISOString().slice(0, 10)
  if (save.value.lastDaily === yStr) {
    save.value.streak++
  } else if (save.value.lastDaily) {
    save.value.streak = 1 // streak reset
  } else {
    save.value.streak = 1 // first visit
  }

  // Grant daily packs
  save.value.dailyLeft = DAILY_PACKS
  save.value.lastDaily = today

  // Streak bonus
  const bonus = STREAK_REWARDS[save.value.streak]
  if (bonus) save.value.freePacks += bonus

  persist()
}

// Collection milestone rewards
const collectionUnlocks = computed(() => {
  return COLLECTION_MILESTONES.map((p) => ({
    pct: p,
    reward: COLLECTION_REWARDS[p]!,
    reached: pct.value >= p,
    claimed: save.value.claimedCollectionPcts.includes(p),
  }))
})

const unclaimedCollection = computed(() =>
  collectionUnlocks.value.filter((m) => m.reached && !m.claimed),
)

function claimCollection() {
  for (const m of unclaimedCollection.value) {
    save.value.claimedCollectionPcts.push(m.pct)
    save.value.freePacks += m.reward
  }
  persist()
}

// Pity display
const pullsUntilPity = computed(() => HARD_PITY - save.value.pullsSinceMythic)
const currentMythicRate = computed(() => {
  const n = save.value.pullsSinceMythic
  if (n >= SOFT_PITY_START)
    return Math.min(100, +(0.8 + (n - SOFT_PITY_START + 1) * PITY_RATE_INCREASE).toFixed(1))
  return 0.8
})
const pullsUntilFeatured = computed(() =>
  save.value.featuredClaimed ? null : FEATURED_GUARANTEE - save.value.totalPulls,
)

// Streak display
const nextStreakReward = computed(() => {
  const sorted = Object.keys(STREAK_REWARDS)
    .map(Number)
    .sort((a, b) => a - b)
  return sorted.find((d) => d > save.value.streak) ?? null
})

// ── Star milestones ──
const STAR_STEP = 100
const BONUS_PACKS = 10

const milestones = computed(() => {
  const list: { target: number; claimed: boolean }[] = []
  for (let t = STAR_STEP; t <= stars.value; t += STAR_STEP) {
    list.push({ target: t, claimed: save.value.claimedMilestones.includes(t) })
  }
  return list
})

const nextMilestone = computed(() => {
  return Math.ceil((stars.value + 1) / STAR_STEP) * STAR_STEP
})

const unclaimedCount = computed(() => milestones.value.filter((m) => !m.claimed).length)

const starProgress = computed(() => {
  if (stars.value <= 0) return 0
  const current = stars.value % STAR_STEP
  return current === 0 && stars.value > 0 ? 100 : Math.round((current / STAR_STEP) * 100)
})

function claimAll() {
  for (const m of milestones.value) {
    if (!m.claimed) {
      save.value.claimedMilestones.push(m.target)
      save.value.freePacks += BONUS_PACKS
    }
  }
  persist()
}

// ── Persistence ──
function persist() {
  localStorage.setItem('j2team-cards-v1', JSON.stringify(save.value))
}

onMounted(async () => {
  const raw = localStorage.getItem('j2team-cards-v1')
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as SaveData
      save.value = {
        owned: parsed.owned ?? {},
        packs: parsed.packs ?? 0,
        claimedMilestones: parsed.claimedMilestones ?? [],
        freePacks: parsed.freePacks ?? 0,
        lastDaily: parsed.lastDaily ?? '',
        dailyLeft: parsed.dailyLeft ?? 0,
        streak: parsed.streak ?? 0,
        claimedCollectionPcts: parsed.claimedCollectionPcts ?? [],
        pullsSinceMythic: parsed.pullsSinceMythic ?? 0,
        totalPulls: parsed.totalPulls ?? 0,
        guaranteedFeatured: parsed.guaranteedFeatured ?? false,
        featuredClaimed: parsed.featuredClaimed ?? false,
      }
    } catch {
      /* ignore corrupt data */
    }
  }
  processDaily()
  try {
    const res = await fetch('https://api.github.com/repos/J2TEAM/vibe.j2team.org', {
      headers: { Accept: 'application/vnd.github.v3+json' },
    })
    if (res.ok) {
      const data = (await res.json()) as { stargazers_count: number }
      stars.value = data.stargazers_count
    }
  } catch {
    /* offline — no bonus */
  }
})

// ── Pack logic (pity system) ──
function rollRarity(): Rarity {
  const n = save.value.pullsSinceMythic
  let mythicRate = 0.8
  if (n >= SOFT_PITY_START) {
    mythicRate = Math.min(100, 0.8 + (n - SOFT_PITY_START + 1) * PITY_RATE_INCREASE)
  }

  const roll = Math.random() * 100
  if (roll < mythicRate) return 'mythic'
  if (roll < mythicRate + 8) return 'legendary'

  // Distribute remaining among lower rarities
  const sub = Math.random() * 91.2
  if (sub < 7.5) return 'epic'
  if (sub < 23.5) return 'rare'
  if (sub < 49.5) return 'uncommon'
  return 'common'
}

function pickFrom(r: Rarity): CardData {
  const p = byRarity.value[r]
  if (p.length > 0) return p[Math.floor(Math.random() * p.length)]!
  return pool.value[Math.floor(Math.random() * pool.value.length)]!
}

function rollOnePull(): CardData {
  // 120-pull featured guarantee (one-time)
  if (!save.value.featuredClaimed && save.value.totalPulls >= FEATURED_GUARANTEE - 1) {
    save.value.pullsSinceMythic = 0
    save.value.totalPulls++
    save.value.featuredClaimed = true
    save.value.guaranteedFeatured = false
    return featuredMythic.value ?? pickFrom('mythic')
  }

  const rarity = rollRarity()
  save.value.totalPulls++

  if (rarity === 'mythic') {
    save.value.pullsSinceMythic = 0
    let isFeatured: boolean
    if (save.value.guaranteedFeatured) {
      isFeatured = true
    } else {
      isFeatured = Math.random() < 0.5
    }
    if (isFeatured) {
      save.value.guaranteedFeatured = false
      save.value.featuredClaimed = true
      return featuredMythic.value ?? pickFrom('mythic')
    } else {
      save.value.guaranteedFeatured = true
      const mythics = byRarity.value.mythic
      const featured = featuredMythic.value
      const others = featured ? mythics.filter((c) => c.slug !== featured.slug) : mythics
      if (others.length > 0) return others[Math.floor(Math.random() * others.length)]!
      return pickFrom('mythic')
    }
  }

  save.value.pullsSinceMythic++
  return pickFrom(rarity)
}

function openPack() {
  // auto-flip any unrevealed cards from previous pack
  if (!allFlipped.value && slots.value.length > 0) flipAll()

  // consume daily pack or free pack
  if (save.value.dailyLeft > 0) {
    save.value.dailyLeft--
  } else if (save.value.freePacks > 0) {
    save.value.freePacks--
  }
  phase.value = 'ripping'
  sfx.packRip()

  const cards: CardData[] = []
  for (let i = 0; i < PACK_SIZE; i++) cards.push(rollOnePull())

  slots.value = cards.map((card) => ({
    card,
    flipped: false,
    isNew: !save.value.owned[card.slug],
    revealPhase: 'covered' as const,
  }))
  setTimeout(() => {
    sfx.packSplit()
    phase.value = 'reveal'
  }, 1300)
}

function flipCard(i: number) {
  const s = slots.value[i]
  if (!s || s.flipped) return
  s.revealPhase = 'rarity'
  sfx.cardFlip()
  setTimeout(() => {
    s.revealPhase = 'open'
    s.flipped = true
    sfx.cardReveal(s.card.rarity)
    save.value.owned[s.card.slug] = (save.value.owned[s.card.slug] ?? 0) + 1
    if (allFlipped.value) save.value.packs++
    persist()
  }, 700)
}

function flipAll() {
  slots.value.forEach((s, i) => {
    if (s.flipped) return
    const delay = i * 120
    setTimeout(() => {
      s.revealPhase = 'rarity'
      sfx.cardFlip()
      setTimeout(() => {
        s.revealPhase = 'open'
        s.flipped = true
        sfx.cardReveal(s.card.rarity)
        save.value.owned[s.card.slug] = (save.value.owned[s.card.slug] ?? 0) + 1
        if (allFlipped.value) {
          save.value.packs++
          persist()
        }
      }, 700)
    }, delay)
  })
}

function switchView(v: 'pack' | 'collection') {
  view.value = v
  if (v === 'pack') phase.value = 'idle'
}

function handleReset() {
  if (confirmReset.value) {
    save.value = {
      owned: {},
      packs: 0,
      claimedMilestones: [],
      freePacks: 0,
      lastDaily: '',
      dailyLeft: 0,
      streak: 0,
      claimedCollectionPcts: [],
      pullsSinceMythic: 0,
      totalPulls: 0,
      guaranteedFeatured: false,
      featuredClaimed: false,
    }
    processDaily()
    persist()
    confirmReset.value = false
  } else {
    confirmReset.value = true
    setTimeout(() => {
      confirmReset.value = false
    }, 3000)
  }
}

// ── Computed ──
const allFlipped = computed(() => slots.value.length > 0 && slots.value.every((s) => s.flipped))
const flippedCount = computed(() => slots.value.filter((s) => s.flipped).length)
const canOpenPack = computed(() => save.value.dailyLeft > 0 || save.value.freePacks > 0)
const totalCards = computed(() => pool.value.length)
const ownedCount = computed(() => Object.keys(save.value.owned).length)
const pct = computed(() =>
  totalCards.value ? Math.round((ownedCount.value / totalCards.value) * 100) : 0,
)

const gallery = computed(() => {
  let list = pool.value
  if (filterRarity.value !== 'all') list = list.filter((c) => c.rarity === filterRarity.value)
  if (onlyOwned.value) list = list.filter((c) => save.value.owned[c.slug])
  const order: Record<Rarity, number> = {
    mythic: 0,
    legendary: 1,
    epic: 2,
    rare: 3,
    uncommon: 4,
    common: 5,
  }
  return [...list].sort((a, b) => {
    const ao = save.value.owned[a.slug] ? 0 : 1
    const bo = save.value.owned[b.slug] ? 0 : 1
    if (ao !== bo) return ao - bo
    if (order[a.rarity] !== order[b.rarity]) return order[a.rarity] - order[b.rarity]
    return a.author.localeCompare(b.author)
  })
})
</script>

<template>
  <div class="page-root" @click="sideTooltip = null">
    <!-- ═══ TOP NAV ═══ -->
    <header class="page-header">
      <RouterLink to="/" class="header-back">
        <Icon icon="lucide:arrow-left" class="size-3" />
        Về trang chủ
      </RouterLink>
      <nav class="header-nav">
        <a
          href="https://github.com/J2TEAM/vibe.j2team.org"
          target="_blank"
          rel="noopener noreferrer"
          class="tab-btn github-star"
        >
          <Icon icon="lucide:star" class="size-3" /> Star
        </a>
        <button class="tab-btn" :class="{ active: view === 'pack' }" @click="switchView('pack')">
          <Icon icon="lucide:package" class="size-3" /> Mở thẻ
        </button>
        <button
          class="tab-btn"
          :class="{ active: view === 'collection' }"
          @click="switchView('collection')"
        >
          <Icon icon="lucide:layout-grid" class="size-3" /> {{ ownedCount }}/{{ totalCards }}
        </button>
      </nav>
    </header>

    <!-- ═══ FLOATING SIDE MENUS (casual-game style) ═══ -->
    <div v-if="view === 'pack' && phase === 'idle'" class="side-menu side-left">
      <div class="side-btn" @click.stop="toggleMute">
        <span class="side-icon">{{ muted ? '🔇' : '🔊' }}</span>
        <span class="side-lbl">{{ muted ? 'Tắt' : 'Bật' }}</span>
      </div>
      <div
        v-if="save.freePacks > 0"
        class="side-btn side-pulse"
        @click.stop="toggleTooltip('free')"
      >
        <span class="side-icon">🎁</span>
        <span class="side-val coral">{{ save.freePacks }}</span>
        <span class="side-lbl">Miễn phí</span>
        <div v-if="sideTooltip === 'free'" class="side-tip side-tip-right">
          Gói miễn phí từ GitHub Stars và mốc bộ sưu tập
        </div>
      </div>
      <div class="side-btn" @click.stop="toggleTooltip('daily')">
        <span class="side-icon">📦</span>
        <span class="side-val" :class="{ dim: save.dailyLeft === 0 }"
          >{{ save.dailyLeft }}/{{ DAILY_PACKS }}</span
        >
        <span class="side-lbl">Hôm nay</span>
        <div v-if="sideTooltip === 'daily'" class="side-tip side-tip-right">
          Gói mở được hôm nay. Hồi lại lúc 00:00
        </div>
      </div>
      <div class="side-btn" @click.stop="toggleTooltip('streak')">
        <span class="side-icon">🔥</span>
        <span class="side-val">{{ save.streak }}</span>
        <span class="side-lbl">Chuỗi</span>
        <span v-if="nextStreakReward" class="side-sub"
          >+{{ STREAK_REWARDS[nextStreakReward] }} ở {{ nextStreakReward }}d</span
        >
        <div v-if="sideTooltip === 'streak'" class="side-tip side-tip-right">
          Số ngày liên tiếp mở gói. Chuỗi dài = thưởng gói!
        </div>
      </div>
      <div class="side-btn" @click.stop="toggleTooltip('pity')">
        <span class="side-icon">🎯</span>
        <span class="side-val" :class="{ coral: save.pullsSinceMythic >= SOFT_PITY_START }">{{
          pullsUntilPity
        }}</span>
        <span class="side-lbl">Pity</span>
        <span v-if="save.pullsSinceMythic >= SOFT_PITY_START" class="side-sub"
          >{{ currentMythicRate }}%</span
        >
        <div v-if="sideTooltip === 'pity'" class="side-tip side-tip-right">
          Rút thêm {{ pullsUntilPity }} lần nữa chắc chắn ra SSS. Tỉ lệ hiện tại:
          {{ currentMythicRate }}%.
          {{
            save.guaranteedFeatured
              ? 'Lần SSS kế tiếp chắc chắn là UP!'
              : 'Lần SSS kế tiếp có 50% là UP'
          }}
        </div>
      </div>
      <div
        v-if="pullsUntilFeatured != null"
        class="side-btn"
        @click.stop="toggleTooltip('featured')"
      >
        <span class="side-icon">👑</span>
        <span class="side-val amber">{{ pullsUntilFeatured }}</span>
        <span class="side-lbl">UP</span>
        <div v-if="sideTooltip === 'featured'" class="side-tip side-tip-right">
          Rút thêm {{ pullsUntilFeatured }} lần nữa chắc chắn nhận
          {{ featuredMythic?.author ?? 'thẻ UP' }}
        </div>
      </div>
    </div>

    <div v-if="view === 'pack' && phase === 'idle'" class="side-menu side-right">
      <div v-if="stars > 0" class="side-btn" @click.stop="toggleTooltip('stars')">
        <span class="side-icon">⭐</span>
        <span class="side-val amber">{{ stars }}</span>
        <div class="side-star-bar">
          <div class="side-star-fill" :style="{ width: starProgress + '%' }"></div>
        </div>
        <span class="side-sub">{{ nextMilestone }}⭐=+{{ BONUS_PACKS }}</span>
        <div v-if="sideTooltip === 'stars'" class="side-tip side-tip-left">
          Mỗi {{ STAR_STEP }} sao GitHub = +{{ BONUS_PACKS }} gói miễn phí
        </div>
      </div>
      <div class="side-btn" @click.stop="toggleTooltip('cards')">
        <span class="side-icon">🃏</span>
        <span class="side-val">{{ ownedCount }}/{{ totalCards }}</span>
        <span class="side-lbl">Thẻ</span>
        <div v-if="sideTooltip === 'cards'" class="side-tip side-tip-left">
          Số thẻ đã thu thập được
        </div>
      </div>
      <div
        v-for="m in collectionUnlocks"
        :key="m.pct"
        class="side-btn side-milestone"
        :class="{ reached: m.reached, claimed: m.claimed }"
      >
        <span class="side-val">{{ m.pct }}%</span>
        <span class="side-sub">{{ m.claimed ? 'Đã nhận' : `+${m.reward} gói` }}</span>
      </div>
      <button v-if="unclaimedCount > 0" class="side-btn side-claim" @click="claimAll">
        <span class="side-icon">🎁</span>
        <span class="side-lbl">Nhận!</span>
        <span class="side-badge">{{ unclaimedCount * BONUS_PACKS }}</span>
      </button>
      <button
        v-if="unclaimedCollection.length > 0"
        class="side-btn side-claim"
        @click="claimCollection"
      >
        <span class="side-icon">🏆</span>
        <span class="side-lbl">Nhận!</span>
        <span class="side-badge">{{ unclaimedCollection.reduce((s, m) => s + m.reward, 0) }}</span>
      </button>
    </div>

    <!-- ═══ PACK VIEW ═══ -->
    <div v-if="view === 'pack' && phase === 'idle'" class="pack-view">
      <!-- Center: pack hero -->
      <main class="pack-hero">
        <p class="hero-credit">
          made with ❤ from
          <a href="https://github.com/duckocancode" target="_blank" rel="noopener noreferrer"
            >duckocancode</a
          >
        </p>
        <h1 class="hero-title">
          <span>//</span> Thẻ Cộng Tác Viên
          <button class="help-btn" @click="showHelp = true">?</button>
        </h1>
        <div class="pack-box" @click="openPack">
          <div class="pack-pattern">
            <span v-for="j in 15" :key="j" class="back-mark">//</span>
          </div>
          <div class="pack-inner">
            <div class="pack-brand">// J2TEAM</div>
            <div class="pack-sub">Thẻ Cộng Tác Viên</div>
            <div class="pack-count-badge">★ {{ PACK_SIZE }} thẻ mỗi gói</div>
          </div>
        </div>

        <div v-if="save.freePacks > 0" class="free-packs-pill">
          🎉 {{ save.freePacks }} gói miễn phí còn lại
        </div>

        <button class="action-btn action-btn--coral" :disabled="!canOpenPack" @click="openPack">
          Mở gói thẻ
        </button>

        <p class="pack-meta">
          {{ save.packs }} gói đã mở — <strong>{{ ownedCount }}/{{ totalCards }}</strong> thẻ thu
          thập
        </p>
      </main>
    </div>

    <!-- Ripping animation -->
    <div
      v-else-if="view === 'pack' && phase === 'ripping'"
      class="flex flex-1 items-center justify-center min-h-0"
    >
      <div class="pack-rip-stage">
        <div class="pack-box pack-rip-half pack-rip-top">
          <div class="pack-inner">
            <div class="pack-brand">// J2TEAM</div>
            <div class="pack-sub">Thẻ Cộng Tác Viên</div>
          </div>
        </div>
        <div class="pack-box pack-rip-half pack-rip-bottom">
          <div class="pack-inner">
            <div class="pack-brand">// J2TEAM</div>
            <div class="pack-sub">Thẻ Cộng Tác Viên</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══ REVEAL VIEW ═══ -->
    <div v-else-if="view === 'pack' && phase === 'reveal'" class="reveal-view">
      <div class="reveal-header">
        <span class="reveal-title">Kết quả mở gói</span>
        <span class="reveal-hint">
          Bấm vào từng thẻ để lật — hoặc
          <span class="reveal-flip-link" @click="flipAll">lật tất cả</span>
        </span>
      </div>

      <div class="cards-stage">
        <div
          v-for="(s, i) in slots"
          :key="i"
          class="card-slot"
          :style="{ animationDelay: `${i * 100 + 50}ms` }"
          @click="flipCard(i)"
        >
          <div class="card-reveal" :class="{ revealed: s.flipped }">
            <!-- Front (always visible underneath) -->
            <div
              class="card-face card-front"
              :class="s.card.rarity"
              :style="{ '--rc': RARITY[s.card.rarity].hex }"
            >
              <div class="cf-topbar">
                <span class="cf-badge">{{ RARITY[s.card.rarity].letter }}</span>
                <span class="cf-name">{{ s.card.author }}</span>
                <span class="cf-hp"><small>AP</small>{{ s.card.ap }}</span>
              </div>
              <div class="cf-art-frame">
                <div class="cf-initials">{{ s.card.initials }}</div>
              </div>
              <div class="cf-info-line">
                {{ RARITY[s.card.rarity].vi }}
                <template v-if="s.card.rank"> · #{{ s.card.rank }}</template>
              </div>
              <div class="cf-move">
                <div class="cf-move-row">
                  <span class="cf-energy">
                    <Icon
                      v-for="cat in s.card.cats.slice(0, 3)"
                      :key="cat"
                      :icon="catIcon(cat)"
                      class="size-3"
                    />
                  </span>
                  <span class="cf-move-name">Đóng góp</span>
                  <span class="cf-move-dmg">{{ s.card.ap }}</span>
                </div>
                <p class="cf-move-desc">
                  {{ s.card.apps }} ứng dụng · {{ s.card.cats.length }} thể loại
                </p>
              </div>
              <div class="cf-footer">
                <div class="cf-fstat">
                  <span class="cf-fval">{{ s.card.apps }}</span>
                  <span class="cf-flbl">ứng dụng</span>
                </div>
                <div class="cf-fstat">
                  <span class="cf-fval">{{ s.card.cats.length }}</span>
                  <span class="cf-flbl">thể loại</span>
                </div>
                <div class="cf-fstat">
                  <span class="cf-fval">{{ s.card.rank ?? '—' }}</span>
                  <span class="cf-flbl">hạng</span>
                </div>
              </div>
              <div v-if="s.isNew" class="new-badge">MỚI!</div>
            </div>
            <!-- Card back (dark branding face) -->
            <div v-if="s.revealPhase !== 'open'" class="card-back">
              <span class="back-brand">J2TEAM</span>
              <span v-if="s.revealPhase === 'covered'" class="back-hint">Bấm để mở</span>
            </div>
            <!-- Curtain (solid rarity color that slides away) -->
            <div
              class="card-curtain"
              :class="{
                'curtain-rarity': s.revealPhase === 'rarity',
                'curtain-open': s.revealPhase === 'open',
              }"
              :style="{ '--rc': RARITY[s.card.rarity].hex }"
            >
              <span
                v-if="s.revealPhase === 'rarity'"
                class="curtain-rarity-badge"
                :class="s.card.rarity"
              >
                <span
                  v-for="n in RARITY_STARS[s.card.rarity]"
                  :key="n"
                  class="curtain-star"
                  :style="{ animationDelay: `${(n - 1) * 80}ms` }"
                  >★</span
                >
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="reveal-actions">
        <span class="reveal-all-hint">Đã lật: {{ flippedCount }}/{{ PACK_SIZE }}</span>
        <button class="action-btn action-btn--ghost" @click="flipAll">Lật tất cả</button>
        <button class="action-btn action-btn--coral" @click="openPack">Mở gói tiếp</button>
        <button class="action-btn action-btn--sky" @click="switchView('collection')">
          Xem bộ sưu tập
        </button>
      </div>
    </div>

    <!-- ═══ GALLERY VIEW ═══ -->
    <div v-else class="gallery-view">
      <div class="gallery-filters">
        <span class="filter-label">Độ hiếm:</span>
        <button
          class="rarity-chip all"
          :class="{ active: filterRarity === 'all' }"
          @click="filterRarity = 'all'"
        >
          Tất cả ({{ totalCards }})
        </button>
        <button
          v-for="r in FILTER_OPTS"
          :key="r"
          class="rarity-chip"
          :class="[r, { active: filterRarity === r }]"
          @click="filterRarity = r"
        >
          {{ RARITY[r].letter }} ({{ byRarity[r].length }})
        </button>
        <label
          class="flex items-center gap-1.5 text-xs cursor-pointer ml-auto"
          style="color: var(--color-text-dim)"
        >
          <input v-model="onlyOwned" type="checkbox" class="accent-[#FF6B4A]" />
          Chỉ đã có
        </label>
      </div>

      <div class="gallery-stats">
        <span class="gallery-progress-text">
          Thu thập: <strong>{{ ownedCount }}</strong> / {{ totalCards }} thẻ
        </span>
        <div class="gallery-progress-bar">
          <div class="gallery-progress-fill" :style="{ width: pct + '%' }"></div>
        </div>
        <span class="gallery-progress-text" style="color: var(--color-text-dim)">{{ pct }}%</span>
      </div>

      <div class="gallery-grid">
        <div
          v-for="card in gallery"
          :key="card.slug"
          class="gallery-slot"
          :class="{ uncollected: !save.owned[card.slug] }"
          @click="save.owned[card.slug] ? ((selected = card), sfx.cardFlip()) : undefined"
        >
          <div
            class="gallery-card"
            :class="card.rarity"
            :style="{ '--rc': RARITY[card.rarity].hex }"
          >
            <div class="gc-topbar">
              <span class="gc-badge">{{ RARITY[card.rarity].letter }}</span>
              <span class="gc-hp">{{ card.ap }}</span>
            </div>
            <div class="gc-art">
              <span class="gc-initials">{{ card.initials }}</span>
            </div>
            <div class="gc-name">{{ card.author }}</div>
            <div class="gc-stats">{{ card.apps }} apps</div>
            <div v-if="(save.owned[card.slug] ?? 0) > 1" class="gc-dupes">
              ×{{ save.owned[card.slug] }}
            </div>
          </div>
        </div>
      </div>

      <!-- Reset -->
      <div style="margin-top: 2rem; text-align: center">
        <button
          class="text-xs hover:text-accent-coral transition-colors"
          style="color: var(--color-text-dim)"
          @click="handleReset"
        >
          {{ confirmReset ? 'Chắc chắn? Nhấn lần nữa' : 'Xoá dữ liệu' }}
        </button>
      </div>
    </div>

    <!-- ═══ CARD DETAIL MODAL ═══ -->
    <div
      v-if="selected"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      @click.self="selected = null"
    >
      <div
        class="card-detail animate-fade-up"
        :class="selected.rarity"
        :style="{ '--rc': RARITY[selected.rarity].hex }"
      >
        <div class="cd-topbar">
          <span class="cd-badge">{{ RARITY[selected.rarity].letter }}</span>
          <span class="cd-name">{{ selected.author }}</span>
          <span class="cd-hp"><small>AP</small>{{ selected.ap }}</span>
        </div>
        <div class="cd-art-frame">
          <div class="cd-initials">{{ selected.initials }}</div>
        </div>
        <div class="cd-info-line">
          {{ RARITY[selected.rarity].vi }}
          <template v-if="selected.rank"> · Hạng #{{ selected.rank }}</template>
        </div>
        <div class="cd-move">
          <div class="cd-move-row">
            <span class="cd-energy">
              <Icon
                v-for="cat in selected.cats.slice(0, 5)"
                :key="cat"
                :icon="catIcon(cat)"
                class="size-5"
              />
            </span>
            <span class="cd-move-name">Đóng góp</span>
            <span class="cd-move-dmg">{{ selected.ap }}</span>
          </div>
          <p class="cd-move-desc">
            Đóng góp {{ selected.apps }} ứng dụng trong {{ selected.cats.length }} thể loại
          </p>
        </div>
        <div class="cd-stats">
          <div class="cd-stat">
            <span class="cd-stat-val">{{ selected.apps }}</span>
            <span class="cd-stat-lbl">Ứng dụng</span>
          </div>
          <div class="cd-stat">
            <span class="cd-stat-val">{{ selected.cats.length }}</span>
            <span class="cd-stat-lbl">Thể loại</span>
          </div>
          <div v-if="selected.rank" class="cd-stat">
            <span class="cd-stat-val">#{{ selected.rank }}</span>
            <span class="cd-stat-lbl">Hạng</span>
          </div>
        </div>
        <div class="cd-pulled">Đã rút {{ save.owned[selected.slug] ?? 0 }} lần</div>
      </div>
    </div>
  </div>

  <!-- ═══ HELP OVERLAY ═══ -->
  <Teleport to="body">
    <div v-if="showHelp" class="help-overlay" @click.self="showHelp = false">
      <div class="help-panel">
        <button class="help-close" @click="showHelp = false">
          <Icon icon="lucide:x" class="size-4" />
        </button>
        <h2 class="help-heading">// Thẻ Cộng Tác Viên</h2>
        <p class="help-desc">
          Thu thập thẻ của các cộng tác viên đã đóng góp ứng dụng cho J2TEAM. Mỗi thẻ đại diện cho
          một contributor thực tế!
        </p>

        <h3 class="help-sub">🎴 Cách chơi</h3>
        <ul class="help-list">
          <li>
            Mỗi ngày bạn được mở <strong>{{ DAILY_PACKS }} gói</strong> miễn phí, mỗi gói có
            {{ PACK_SIZE }} thẻ
          </li>
          <li>Duy trì chuỗi ngày liên tiếp để nhận thưởng gói thêm</li>
          <li>Star repo trên GitHub để mở khóa thêm gói miễn phí</li>
        </ul>

        <h3 class="help-sub">⭐ Độ hiếm</h3>
        <ul class="help-list">
          <li><span style="color: #9ca3af">D</span> Thường — 1★</li>
          <li><span style="color: #14b8a6">C</span> Khá hiếm — 2★</li>
          <li><span style="color: #38bdf8">B</span> Hiếm — 3★</li>
          <li><span style="color: #a855f7">A</span> Sử thi — 4★</li>
          <li><span style="color: #ffb830">S</span> Huyền thoại — 5★</li>
          <li><span style="color: #ec4899">SSS</span> Thần thoại — 6★</li>
        </ul>

        <h3 class="help-sub">🎯 Hệ thống Pity</h3>
        <ul class="help-list">
          <li>Tỉ lệ cơ bản SSS (6★): <strong>0.8%</strong>, S (5★): <strong>8%</strong></li>
          <li>Sau {{ SOFT_PITY_START }} lần rút không ra SSS, tỉ lệ tăng dần</li>
          <li>Đến lần thứ {{ HARD_PITY }}, chắc chắn ra SSS</li>
          <li>Khi ra SSS, có <strong>50%</strong> là thẻ UP và 50% là SSS khác</li>
          <li>Nếu thua 50/50, lần SSS kế tiếp chắc chắn là UP</li>
          <li>Sau {{ FEATURED_GUARANTEE }} lần rút, bảo đảm nhận thẻ UP (1 lần)</li>
        </ul>

        <h3 class="help-sub">🏆 Mốc bộ sưu tập</h3>
        <ul class="help-list">
          <li>Thu thập đủ 25%, 50%, 75%, 100% thẻ để nhận gói thưởng</li>
        </ul>

        <h3 class="help-sub">🔄 Cập nhật thẻ</h3>
        <ul class="help-list">
          <li>Thẻ mới được thêm tự động khi có contributor mới đóng góp ứng dụng cho J2TEAM</li>
        </ul>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* ═══════════════════════════════════════
   PAGE ROOT
═══════════════════════════════════════ */
.page-root {
  background:
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cpath d='M72 80h16M80 72v16' stroke='white' stroke-width='1' opacity='.12' fill='none'/%3E%3C/svg%3E"),
    linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px), var(--color-bg-deep);
  background-size:
    160px 160px,
    40px 40px,
    40px 40px,
    100% 100%;
  color: var(--color-text-primary);
  font-family: var(--font-body);
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ═══════════════════════════════════════
   GLOBAL NAV HEADER
═══════════════════════════════════════ */
.page-header {
  display: flex;
  align-items: center;
  padding: 6px 14px;
  border-bottom: 1px solid var(--color-border-default);
  background: var(--color-bg-surface);
  position: sticky;
  top: 0;
  z-index: 100;
  gap: 10px;
}
.header-title {
  font-family: var(--font-display);
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  white-space: nowrap;
}
.header-title span {
  color: var(--color-accent-coral);
}
.hero-title {
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-align: center;
}
.hero-credit {
  font-family: var(--font-body);
  font-size: 0.6rem;
  color: var(--color-text-dim);
  text-align: center;
  margin-bottom: 2px;
}
.hero-credit a {
  color: var(--color-accent-coral);
  text-decoration: none;
  font-weight: 600;
}
.hero-credit a:hover {
  text-decoration: underline;
}
.hero-title span {
  color: var(--color-accent-coral);
}
.help-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid var(--color-border-default);
  background: transparent;
  color: var(--color-text-dim);
  font-family: var(--font-display);
  font-size: 0.6rem;
  font-weight: 700;
  cursor: pointer;
  margin-left: 6px;
  vertical-align: middle;
  transition: all 0.2s;
}
.help-btn:hover {
  border-color: var(--color-accent-coral);
  color: var(--color-accent-coral);
}

/* Help overlay */
.help-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fade-in 0.2s ease-out;
}
@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
.help-panel {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-default);
  border-radius: 8px;
  padding: 28px 24px;
  max-width: 440px;
  width: 90vw;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
  animation: panel-in 0.2s ease-out;
}
@keyframes panel-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
.help-close {
  position: absolute;
  top: 12px;
  right: 12px;
  background: none;
  border: none;
  color: var(--color-text-dim);
  cursor: pointer;
  padding: 4px;
  transition: color 0.2s;
}
.help-close:hover {
  color: var(--color-accent-coral);
}
.help-heading {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 800;
  margin-bottom: 8px;
  color: var(--color-text-primary);
}
.help-sub {
  font-family: var(--font-display);
  font-size: 0.75rem;
  font-weight: 700;
  margin-top: 16px;
  margin-bottom: 6px;
  color: var(--color-text-primary);
}
.help-desc {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  line-height: 1.5;
}
.help-list {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 0.72rem;
  color: var(--color-text-secondary);
  line-height: 1.7;
}
.help-list li::before {
  content: '•';
  color: var(--color-accent-coral);
  margin-right: 6px;
}
.help-list strong {
  color: var(--color-text-primary);
}
.header-nav {
  display: flex;
  gap: 6px;
  margin-left: auto;
}
.tab-btn {
  font-family: var(--font-display);
  font-size: 0.7rem;
  font-weight: 700;
  padding: 5px 12px;
  border: 1px solid var(--color-border-default);
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  letter-spacing: 0.03em;
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
  justify-content: center;
}
.tab-btn.active {
  border-color: var(--color-accent-coral);
  color: var(--color-accent-coral);
  background: color-mix(in srgb, var(--color-accent-coral) 8%, transparent);
}
.tab-btn:hover:not(.active) {
  border-color: var(--color-text-dim);
  color: var(--color-text-primary);
}
.github-star {
  border-color: var(--color-accent-amber);
  color: var(--color-accent-amber);
  text-decoration: none;
}
.github-star:hover {
  background: color-mix(in srgb, var(--color-accent-amber) 12%, transparent);
}
.header-back {
  font-family: var(--font-display);
  font-size: 0.7rem;
  color: var(--color-text-dim);
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: color 0.2s;
}
.header-back:hover {
  color: var(--color-text-primary);
}

/* ═══════════════════════════════════════
   FLOATING SIDE MENUS (casual-game style)
═══════════════════════════════════════ */
.side-menu {
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 50;
  pointer-events: none;
}
.side-left {
  left: 6px;
}
.side-right {
  right: 6px;
}
.side-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 8px 5px;
  background: rgba(0, 0, 0, 0.55);
  border: 1px solid var(--color-border-default);
  border-radius: 10px;
  min-width: 64px;
  pointer-events: auto;
  position: relative;
  backdrop-filter: blur(6px);
  transition: border-color 0.2s;
}
.side-btn:hover {
  border-color: var(--color-text-dim);
}
.side-icon {
  font-size: 1.1rem;
  line-height: 1;
}
.side-val {
  font-family: var(--font-display);
  font-size: 0.85rem;
  font-weight: 800;
  line-height: 1.3;
  color: var(--color-text-primary);
}
.side-val.coral {
  color: var(--color-accent-coral);
}
.side-val.amber {
  color: var(--color-accent-amber);
}
.side-val.sky {
  color: var(--color-accent-sky);
}
.side-val.dim {
  color: var(--color-text-dim);
}
.side-lbl {
  font-family: var(--font-display);
  font-size: 0.48rem;
  font-weight: 600;
  color: var(--color-text-dim);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  line-height: 1.2;
}
.side-sub {
  font-size: 0.45rem;
  color: var(--color-text-dim);
  white-space: nowrap;
  line-height: 1.2;
}
.side-star-bar {
  width: 44px;
  height: 4px;
  border-radius: 2px;
  background: var(--color-bg-deep);
  border: 1px solid var(--color-border-default);
  overflow: hidden;
  margin: 2px 0;
}
.side-star-fill {
  height: 100%;
  border-radius: 2px;
  background: linear-gradient(90deg, #ffb830, #ff6b4a);
  transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
}
.side-milestone {
  opacity: 0.35;
  padding: 4px 6px 3px;
}
.side-milestone.reached {
  opacity: 1;
  border-color: var(--color-accent-amber);
}
.side-milestone.claimed {
  opacity: 0.5;
  border-color: var(--color-accent-sky);
}
.side-claim {
  cursor: pointer;
  border-color: var(--color-accent-coral);
  animation: side-pulse 1.5s ease-in-out infinite;
}
.side-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: var(--color-accent-coral);
  color: var(--color-bg-deep);
  font-family: var(--font-display);
  font-size: 0.5rem;
  font-weight: 900;
  padding: 1px 4px;
  border-radius: 6px;
  line-height: 1.3;
}
.side-pulse {
  animation: side-pulse 2s ease-in-out infinite;
}
@keyframes side-pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.06);
  }
}

/* Tooltip overlay */
.side-tip {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-default);
  border-radius: 6px;
  padding: 6px 10px;
  font-family: var(--font-body);
  font-size: 0.7rem;
  color: var(--color-text-primary);
  white-space: nowrap;
  z-index: 60;
  pointer-events: none;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
  animation: tip-in 0.15s ease-out;
}
@media (max-width: 600px) {
  .side-tip {
    white-space: normal;
    width: max-content;
    max-width: 55vw;
  }
}
.side-tip-right {
  left: calc(100% + 8px);
}
.side-tip-left {
  right: calc(100% + 8px);
}
@keyframes tip-in {
  from {
    opacity: 0;
    transform: translateY(-50%) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(-50%) scale(1);
  }
}

/* ═══════════════════════════════════════
   PACK VIEW
═══════════════════════════════════════ */
.pack-view {
  flex: 1;
  display: flex;
  align-items: stretch;
  justify-content: center;
  min-height: 0;
  animation: clip-wipe 0.5s ease-out both;
}

/* Center — pack hero */
.pack-hero {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  gap: 28px;
  position: relative;
}
.pack-hero::before {
  content: '';
  position: absolute;
  width: 420px;
  height: 420px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    color-mix(in srgb, var(--color-accent-coral) 6%, transparent),
    transparent 70%
  );
  pointer-events: none;
}

.pack-box {
  width: 240px;
  height: 336px;
  border: 2px solid var(--color-border-default);
  background: linear-gradient(160deg, #0c1520, #162232 50%, #0c1520);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition:
    transform 0.3s,
    box-shadow 0.3s,
    border-color 0.3s;
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  z-index: 1;
}
.pack-box::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    transparent 40%,
    rgba(255, 107, 74, 0.04) 50%,
    transparent 60%
  );
  background-size: 200% 100%;
  animation: pack-sheen 4s ease-in-out infinite;
}
@keyframes pack-sheen {
  0%,
  100% {
    background-position: 200% center;
  }
  50% {
    background-position: -200% center;
  }
}
.pack-box:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 20px 60px rgba(255, 107, 74, 0.18);
  border-color: color-mix(in srgb, var(--color-accent-coral) 60%, var(--color-border-default));
}
.pack-box::after {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: 12px;
  background: conic-gradient(
    from var(--scan-angle, 0deg),
    transparent 0deg,
    var(--color-accent-coral) 30deg,
    transparent 60deg
  );
  opacity: 0;
  transition: opacity 0.4s;
  pointer-events: none;
  z-index: -1;
  mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  mask-composite: exclude;
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  padding: 2px;
}
.pack-box:hover::after {
  opacity: 0.6;
  animation: edge-scan 2s linear infinite;
}
@keyframes edge-scan {
  to {
    --scan-angle: 360deg;
  }
}
.pack-pattern {
  position: absolute;
  inset: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: center;
  opacity: 0.04;
  transform: rotate(-20deg) scale(1.4);
  pointer-events: none;
}
.pack-inner {
  text-align: center;
  z-index: 1;
}
.pack-brand {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 900;
  color: var(--color-accent-coral);
  letter-spacing: 0.06em;
  animation: glitch-flash 1.2s ease-out both;
}
@keyframes glitch-flash {
  0% {
    opacity: 0;
  }
  10% {
    opacity: 0.5;
  }
  11% {
    opacity: 0;
  }
  20% {
    opacity: 0.5;
  }
  21% {
    opacity: 0;
  }
  40% {
    opacity: 0.5;
  }
  41% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
.pack-sub {
  font-family: var(--font-display);
  font-size: 0.55rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  letter-spacing: 0.2em;
  text-transform: uppercase;
  margin-top: 8px;
}
.pack-count-badge {
  margin-top: 16px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: color-mix(in srgb, var(--color-accent-amber) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-accent-amber) 40%, transparent);
  border-radius: 20px;
  padding: 4px 12px;
  font-family: var(--font-display);
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--color-accent-amber);
}

/* ── Pack split-open animation ── */
.pack-rip-stage {
  position: relative;
  width: 240px;
  height: 336px;
}
/* Border trace line */
.pack-rip-stage::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 12px;
  background: conic-gradient(
    from 0deg,
    var(--color-accent-coral) 0deg,
    var(--color-accent-coral) var(--trace-angle, 0deg),
    transparent var(--trace-angle, 0deg)
  );
  mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  mask-composite: exclude;
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  padding: 2px;
  z-index: 10;
  animation: border-trace 0.5s linear forwards;
}
/* Horizontal split line */
.pack-rip-stage::after {
  content: '';
  position: absolute;
  left: -12px;
  right: -12px;
  top: 50%;
  height: 2px;
  background: var(--color-accent-coral);
  transform: translateY(-50%) scaleX(0);
  z-index: 10;
  animation: split-line-appear 0.15s ease-out 0.5s forwards;
  box-shadow:
    0 0 16px var(--color-accent-coral),
    0 0 4px var(--color-accent-coral);
}
.pack-rip-half {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  cursor: default;
}
.pack-rip-top {
  clip-path: inset(0 0 50% 0);
  animation: rip-up 0.5s ease-in 0.65s forwards;
}
.pack-rip-bottom {
  clip-path: inset(50% 0 0 0);
  animation: rip-down 0.5s ease-in 0.65s forwards;
}
@keyframes border-trace {
  to {
    --trace-angle: 360deg;
  }
}
@keyframes split-line-appear {
  to {
    transform: translateY(-50%) scaleX(1);
  }
}
@keyframes rip-up {
  0% {
    transform: translateY(0);
    opacity: 1;
  }
  100% {
    transform: translateY(-70px);
    opacity: 0;
  }
}
@keyframes rip-down {
  0% {
    transform: translateY(0);
    opacity: 1;
  }
  100% {
    transform: translateY(70px);
    opacity: 0;
  }
}

/* Free packs callout */
.free-packs-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: color-mix(in srgb, var(--color-accent-coral) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-accent-coral) 35%, transparent);
  border-radius: 20px;
  font-family: var(--font-display);
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--color-accent-coral);
  z-index: 1;
}

.pack-meta {
  font-family: var(--font-display);
  font-size: 0.65rem;
  color: var(--color-text-dim);
  z-index: 1;
}
.pack-meta strong {
  color: var(--color-accent-coral);
}

/* ── Buttons ── */
.action-btn {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.7rem;
  padding: 6px 18px;
  border: 1px solid;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s;
  letter-spacing: 0.04em;
  z-index: 1;
}
.action-btn:hover {
  transform: translateY(-2px);
}
.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}
.action-btn--coral {
  border-color: var(--color-accent-coral);
  color: var(--color-accent-coral);
}
.action-btn--coral:hover:not(:disabled) {
  background: var(--color-accent-coral);
  color: var(--color-bg-deep);
  box-shadow: 0 4px 16px rgba(255, 107, 74, 0.25);
}
.action-btn--sky {
  border-color: var(--color-accent-sky);
  color: var(--color-accent-sky);
}
.action-btn--sky:hover {
  background: var(--color-accent-sky);
  color: var(--color-bg-deep);
}
.action-btn--ghost {
  border-color: var(--color-border-default);
  color: var(--color-text-secondary);
}
.action-btn--ghost:hover {
  border-color: var(--color-accent-coral);
  color: var(--color-text-primary);
}

/* ═══════════════════════════════════════
   REVEAL VIEW
═══════════════════════════════════════ */
.reveal-view {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  animation: clip-wipe 0.5s ease-out both;
}
.reveal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid var(--color-border-default);
}
.reveal-title {
  font-family: var(--font-display);
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--color-text-secondary);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.reveal-hint {
  font-family: var(--font-display);
  font-size: 0.65rem;
  color: var(--color-text-dim);
}
.reveal-flip-link {
  color: var(--color-accent-coral);
  cursor: pointer;
}
.reveal-flip-link:hover {
  text-decoration: underline;
}

.cards-stage {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  gap: 16px;
  flex-wrap: wrap;
  position: relative;
}
.cards-stage::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(255, 255, 255, 0.006) 2px,
    rgba(255, 255, 255, 0.006) 4px
  );
  pointer-events: none;
}

.reveal-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 12px;
  border-top: 1px solid var(--color-border-default);
  background: color-mix(in srgb, var(--color-bg-surface) 60%, var(--color-bg-deep));
}
.reveal-all-hint {
  font-family: var(--font-display);
  font-size: 0.6rem;
  color: var(--color-text-dim);
}

/* ── Card Slot (3D flip) ── */
.card-slot {
  perspective: 800px;
  width: 180px;
  height: 252px;
  cursor: pointer;
  animation: card-enter 0.5s ease-out both;
  flex-shrink: 0;
}
@keyframes card-enter {
  from {
    transform: scale(0.5) translateY(30px);
    opacity: 0;
  }
  to {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}
.card-slot:nth-child(1) {
  animation-delay: 0.05s;
}
.card-slot:nth-child(2) {
  animation-delay: 0.15s;
}
.card-slot:nth-child(3) {
  animation-delay: 0.25s;
}
.card-slot:nth-child(4) {
  animation-delay: 0.35s;
}
.card-slot:nth-child(5) {
  animation-delay: 0.45s;
}

/* Card reveal container */
.card-reveal {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

/* Card back — dark branding face */
.card-back {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: linear-gradient(160deg, #0c1520, #162232 50%, #0c1520);
  border: 2px solid var(--color-border-default);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}
.back-brand {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1rem;
  color: var(--color-accent-coral);
  letter-spacing: 0.2em;
  animation: breathe 2.5s ease-in-out infinite;
}
@keyframes breathe {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.9;
  }
  50% {
    transform: scale(1.08);
    opacity: 1;
  }
}
.back-hint {
  font-family: var(--font-display);
  font-size: 0.45rem;
  color: var(--color-text-dim);
  margin-top: 8px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

/* Curtain — solid rarity color block */
.card-curtain {
  position: absolute;
  inset: 0;
  z-index: 2;
  background: var(--rc, #1a2b3c);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  transform: translateY(-100%);
  transition: none;
}
/* Phase: rarity — curtain slides down into view */
.card-curtain.curtain-rarity {
  transform: translateY(0);
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    inset 0 0 40px rgba(255, 255, 255, 0.15),
    0 0 20px var(--rc);
}
/* Phase: open — curtain continues sliding down out */
.card-curtain.curtain-open {
  transform: translateY(100%);
  transition: transform 0.45s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Rarity badge flash */
.curtain-rarity-badge {
  position: absolute;
  display: flex;
  gap: 4px;
  align-items: center;
}
.curtain-star {
  font-size: 1.6rem;
  color: #fff;
  text-shadow:
    0 0 12px rgba(255, 255, 255, 0.8),
    0 0 30px rgba(255, 255, 255, 0.4);
  animation: star-pop 0.5s ease-out both;
}
.curtain-rarity-badge.legendary .curtain-star,
.curtain-rarity-badge.mythic .curtain-star {
  font-size: 1.4rem;
  animation: star-pop-epic 0.6s ease-out both;
}
@keyframes star-pop {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  30% {
    transform: scale(1.4);
    opacity: 1;
  }
  55% {
    transform: scale(1);
    opacity: 1;
  }
  80% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(0.5);
    opacity: 0;
  }
}
@keyframes star-pop-epic {
  0% {
    transform: scale(0) rotate(-20deg);
    opacity: 0;
  }
  25% {
    transform: scale(1.6) rotate(5deg);
    opacity: 1;
  }
  45% {
    transform: scale(0.9) rotate(0deg);
    opacity: 1;
  }
  70% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(0.5);
    opacity: 0;
  }
}

/* Card front */
.card-front {
  width: 100%;
  height: 100%;
  background: var(--color-bg-surface);
  display: flex;
  flex-direction: column;
  border: 3px solid var(--rc);
  position: relative;
  overflow: hidden;
}
.cf-topbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 7px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, transparent 100%);
  border-bottom: 1px solid color-mix(in srgb, var(--rc) 30%, transparent);
}
.cf-badge {
  font-family: var(--font-display);
  font-size: 0.55rem;
  font-weight: 800;
  color: var(--color-bg-deep);
  background: var(--rc);
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 2px;
  flex-shrink: 0;
}
.cf-name {
  font-family: var(--font-display);
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--color-text-primary);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}
.cf-hp {
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 900;
  color: var(--rc);
  flex-shrink: 0;
  line-height: 1;
}
.cf-hp small {
  font-size: 0.45rem;
  font-weight: 600;
  margin-right: 1px;
  opacity: 0.6;
}
.cf-art-frame {
  margin: 5px 7px;
  border: 2px solid color-mix(in srgb, var(--rc) 50%, var(--color-border-default));
  background: linear-gradient(
    135deg,
    var(--color-bg-deep),
    color-mix(in srgb, var(--rc) 8%, var(--color-bg-deep))
  );
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 0;
  position: relative;
  overflow: hidden;
  border-radius: 4px;
}
.cf-art-frame::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at 70% 30%,
    color-mix(in srgb, var(--rc) 12%, transparent),
    transparent 60%
  );
}
.cf-initials {
  font-family: var(--font-display);
  font-size: 2.8rem;
  font-weight: 900;
  color: var(--rc);
  line-height: 1;
  text-shadow: 0 0 24px color-mix(in srgb, var(--rc) 40%, transparent);
  z-index: 1;
}
.cf-info-line {
  font-family: var(--font-display);
  font-size: 0.5rem;
  color: var(--color-text-dim);
  text-align: center;
  padding: 2px 7px;
  letter-spacing: 0.05em;
}
.cf-move {
  margin: 0 7px;
  padding: 5px 6px;
  border-top: 1px solid var(--color-border-default);
}
.cf-move-row {
  display: flex;
  align-items: center;
  gap: 4px;
}
.cf-energy {
  display: flex;
  gap: 2px;
  color: var(--rc);
  flex-shrink: 0;
  max-width: 56px;
  overflow: hidden;
}
.cf-move-name {
  font-family: var(--font-display);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-text-primary);
  flex: 1;
}
.cf-move-dmg {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 900;
  color: var(--color-text-primary);
}
.cf-move-desc {
  font-size: 0.5rem;
  color: var(--color-text-dim);
  margin: 2px 0 0;
  line-height: 1.3;
}
.cf-footer {
  display: flex;
  justify-content: space-around;
  padding: 4px 7px 5px;
  border-top: 1px solid var(--color-border-default);
  background: linear-gradient(0deg, rgba(255, 255, 255, 0.03), transparent);
}
.cf-fstat {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.cf-flbl {
  font-size: 0.4rem;
  text-transform: uppercase;
  color: var(--color-text-dim);
  letter-spacing: 0.1em;
}
.cf-fval {
  font-family: var(--font-display);
  font-size: 0.85rem;
  font-weight: 800;
  color: var(--rc);
  line-height: 1.2;
}

/* Rarity effects */
.card-front.legendary {
  animation: rarity-glow 2s ease-in-out infinite;
}
.card-front.legendary::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    105deg,
    transparent 40%,
    rgba(255, 184, 48, 0.15) 50%,
    transparent 60%
  );
  background-size: 200% 100%;
  animation: shimmer 3s ease-in-out infinite;
  pointer-events: none;
}
.card-front.epic {
  box-shadow: inset 0 0 20px rgba(255, 184, 48, 0.08);
}
.card-front.mythic {
  animation: mythic-glow 2.5s ease-in-out infinite;
}
.card-front.mythic::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    105deg,
    transparent 20%,
    rgba(236, 72, 153, 0.15) 30%,
    rgba(168, 85, 247, 0.15) 40%,
    rgba(56, 189, 248, 0.12) 50%,
    rgba(20, 184, 166, 0.12) 60%,
    rgba(255, 184, 48, 0.12) 70%,
    transparent 80%
  );
  background-size: 400% 100%;
  animation: shimmer 2.5s linear infinite;
  pointer-events: none;
}
.new-badge {
  position: absolute;
  top: 22px;
  right: -2px;
  background: var(--color-accent-coral);
  color: var(--color-bg-deep);
  font-family: var(--font-display);
  font-size: 0.5rem;
  font-weight: 800;
  padding: 1px 6px;
  animation: badge-pop 0.4s ease-out 0.6s both;
}
@keyframes badge-pop {
  0% {
    transform: scale(0);
  }
  60% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}
@keyframes rarity-glow {
  0%,
  100% {
    box-shadow: 0 0 6px var(--rc);
  }
  50% {
    box-shadow: 0 0 20px var(--rc);
  }
}
@keyframes mythic-glow {
  0%,
  100% {
    box-shadow:
      0 0 8px #ec4899,
      0 0 20px rgba(236, 72, 153, 0.3);
  }
  33% {
    box-shadow:
      0 0 14px #a855f7,
      0 0 35px rgba(168, 85, 247, 0.4);
  }
  66% {
    box-shadow:
      0 0 14px #38bdf8,
      0 0 35px rgba(56, 189, 248, 0.4);
  }
}
@keyframes shimmer {
  0% {
    background-position: 200% center;
  }
  100% {
    background-position: -200% center;
  }
}

/* ═══════════════════════════════════════
   GALLERY VIEW
═══════════════════════════════════════ */
.gallery-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  animation: clip-wipe 0.5s ease-out both;
}
.gallery-filters {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-bottom: 1px solid var(--color-border-default);
  background: var(--color-bg-surface);
  overflow-x: auto;
}
.filter-label {
  font-family: var(--font-display);
  font-size: 0.55rem;
  color: var(--color-text-dim);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  white-space: nowrap;
  flex-shrink: 0;
  margin-right: 4px;
}
.rarity-chip {
  font-family: var(--font-display);
  font-size: 0.6rem;
  font-weight: 700;
  padding: 4px 12px;
  border: 1px solid;
  border-radius: 20px;
  cursor: pointer;
  background: transparent;
  transition: all 0.2s;
  white-space: nowrap;
  flex-shrink: 0;
}
.rarity-chip.all {
  border-color: var(--color-border-default);
  color: var(--color-text-secondary);
}
.rarity-chip.mythic {
  border-color: #ec4899;
  color: #ec4899;
}
.rarity-chip.legendary {
  border-color: var(--color-accent-amber);
  color: var(--color-accent-amber);
}
.rarity-chip.epic {
  border-color: #a855f7;
  color: #a855f7;
}
.rarity-chip.rare {
  border-color: var(--color-accent-sky);
  color: var(--color-accent-sky);
}
.rarity-chip.uncommon {
  border-color: #14b8a6;
  color: #14b8a6;
}
.rarity-chip.common {
  border-color: #9ca3af;
  color: #9ca3af;
}
.rarity-chip.active,
.rarity-chip:hover {
  opacity: 1;
  background: color-mix(in srgb, currentColor 12%, transparent);
}

.gallery-stats {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 20px;
  border-bottom: 1px solid var(--color-border-default);
}
.gallery-progress-text {
  font-family: var(--font-display);
  font-size: 0.65rem;
  color: var(--color-text-dim);
  white-space: nowrap;
}
.gallery-progress-text strong {
  color: var(--color-accent-coral);
}
.gallery-progress-bar {
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: var(--color-bg-deep);
  position: relative;
  overflow: hidden;
}
.gallery-progress-fill {
  position: absolute;
  inset: 0;
  border-radius: 2px;
  background: linear-gradient(90deg, var(--color-accent-coral), var(--color-accent-amber));
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.gallery-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 12px;
  padding: 20px;
  align-content: start;
  overflow-y: auto;
}

.gallery-slot {
  cursor: pointer;
  transition: transform 0.3s;
}
.gallery-slot:hover {
  transform: translateY(-4px);
}
.gallery-slot.uncollected {
  opacity: 0.18;
  filter: grayscale(1);
  cursor: default;
}
.gallery-slot.uncollected:hover {
  transform: none;
}

.gallery-card {
  aspect-ratio: 5 / 7;
  border: 2px solid var(--rc, var(--color-border-default));
  background: var(--color-bg-surface);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}
.gc-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 3px 5px;
  border-bottom: 1px solid color-mix(in srgb, var(--rc) 25%, transparent);
}
.gc-badge {
  font-family: var(--font-display);
  font-size: 0.4rem;
  font-weight: 800;
  color: var(--color-bg-deep);
  background: var(--rc);
  width: 12px;
  height: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 2px;
}
.gc-hp {
  font-family: var(--font-display);
  font-size: 0.6rem;
  font-weight: 900;
  color: var(--rc);
}
.gc-art {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    135deg,
    var(--color-bg-deep),
    color-mix(in srgb, var(--rc) 6%, var(--color-bg-deep))
  );
  margin: 3px 4px;
  border: 1px solid color-mix(in srgb, var(--rc) 20%, var(--color-border-default));
  border-radius: 3px;
}
.gc-initials {
  font-family: var(--font-display);
  font-size: 1.3rem;
  font-weight: 900;
  color: var(--rc);
  line-height: 1;
}
.gc-name {
  font-family: var(--font-display);
  font-size: 0.5rem;
  font-weight: 600;
  color: var(--color-text-primary);
  text-align: center;
  padding: 0 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.gc-stats {
  font-size: 0.4rem;
  color: var(--color-text-dim);
  text-align: center;
  padding-bottom: 4px;
}
.gc-dupes {
  position: absolute;
  bottom: 3px;
  right: 4px;
  font-family: var(--font-display);
  font-size: 0.5rem;
  font-weight: 700;
  color: var(--color-accent-amber);
}
.gallery-card.mythic {
  animation: mythic-glow 2.5s ease-in-out infinite;
}

/* ═══════════════════════════════════════
   DETAIL MODAL
═══════════════════════════════════════ */
.card-detail {
  width: 320px;
  border: 4px solid var(--rc);
  background: var(--color-bg-surface);
  padding: 0;
  position: relative;
  overflow: hidden;
}
.card-detail.legendary::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    105deg,
    transparent 40%,
    rgba(255, 184, 48, 0.1) 50%,
    transparent 60%
  );
  background-size: 200% 100%;
  animation: shimmer 3s ease-in-out infinite;
  pointer-events: none;
}
.card-detail.mythic {
  animation: mythic-glow 2.5s ease-in-out infinite;
}
.card-detail.mythic::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    105deg,
    transparent 20%,
    rgba(236, 72, 153, 0.12) 30%,
    rgba(168, 85, 247, 0.12) 40%,
    rgba(56, 189, 248, 0.1) 50%,
    rgba(20, 184, 166, 0.1) 60%,
    rgba(255, 184, 48, 0.1) 70%,
    transparent 80%
  );
  background-size: 400% 100%;
  animation: shimmer 2.5s linear infinite;
  pointer-events: none;
}

.cd-topbar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, transparent 100%);
  border-bottom: 1px solid color-mix(in srgb, var(--rc) 30%, transparent);
}
.cd-badge {
  font-family: var(--font-display);
  font-size: 0.65rem;
  font-weight: 800;
  color: var(--color-bg-deep);
  background: var(--rc);
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  flex-shrink: 0;
}
.cd-name {
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-text-primary);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cd-hp {
  font-family: var(--font-display);
  font-size: 1.6rem;
  font-weight: 900;
  color: var(--rc);
  flex-shrink: 0;
  line-height: 1;
}
.cd-hp small {
  font-size: 0.6rem;
  font-weight: 600;
  margin-right: 2px;
  opacity: 0.6;
}
.cd-art-frame {
  margin: 10px 14px;
  border: 3px solid color-mix(in srgb, var(--rc) 50%, var(--color-border-default));
  border-radius: 6px;
  background: linear-gradient(
    135deg,
    var(--color-bg-deep),
    color-mix(in srgb, var(--rc) 10%, var(--color-bg-deep))
  );
  display: flex;
  align-items: center;
  justify-content: center;
  height: 120px;
  position: relative;
  overflow: hidden;
}
.cd-art-frame::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at 65% 35%,
    color-mix(in srgb, var(--rc) 15%, transparent) 0%,
    transparent 60%
  );
  pointer-events: none;
}
.cd-initials {
  font-family: var(--font-display);
  font-size: 3.5rem;
  font-weight: 900;
  color: var(--rc);
  line-height: 1;
  text-shadow: 0 0 30px color-mix(in srgb, var(--rc) 50%, transparent);
  z-index: 1;
}
.cd-info-line {
  font-family: var(--font-display);
  font-size: 0.7rem;
  color: var(--color-text-dim);
  text-align: center;
  padding: 4px 14px;
  letter-spacing: 0.05em;
}
.cd-move {
  margin: 0 14px;
  padding: 10px 10px;
  border-top: 2px solid var(--color-border-default);
}
.cd-move-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.cd-energy {
  display: flex;
  gap: 3px;
  color: var(--rc);
  flex-shrink: 0;
  max-width: 120px;
  overflow: hidden;
}
.cd-move-name {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text-primary);
  flex: 1;
}
.cd-move-dmg {
  font-family: var(--font-display);
  font-size: 1.4rem;
  font-weight: 900;
  color: var(--color-text-primary);
}
.cd-move-desc {
  font-size: 0.7rem;
  color: var(--color-text-dim);
  margin: 4px 0 0;
  line-height: 1.4;
}
.cd-stats {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 10px 14px;
  border-top: 1px solid var(--color-border-default);
  background: linear-gradient(0deg, rgba(255, 255, 255, 0.03), transparent);
}
.cd-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4px 12px;
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
}
.cd-stat-val {
  font-family: var(--font-display);
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--rc);
  line-height: 1.2;
}
.cd-stat-lbl {
  font-size: 0.55rem;
  color: var(--color-text-dim);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.cd-pulled {
  font-size: 0.75rem;
  color: var(--color-text-dim);
  text-align: center;
  padding: 8px 14px 12px;
  font-style: italic;
}

/* ═══════════════════════════════════════
   RESPONSIVE
═══════════════════════════════════════ */
/* Shared keyframes */
@keyframes clip-wipe {
  from {
    clip-path: polygon(0 0, 0 0, 0 100%, 0 100%);
  }
  to {
    clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
  }
}
@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@property --scan-angle {
  syntax: '<angle>';
  inherits: false;
  initial-value: 0deg;
}
@property --trace-angle {
  syntax: '<angle>';
  inherits: false;
  initial-value: 0deg;
}

@media (max-width: 768px) {
  .side-btn {
    min-width: 54px;
    padding: 6px 6px 4px;
  }
  .side-icon {
    font-size: 0.95rem;
  }
  .side-val {
    font-size: 0.75rem;
  }
  .side-lbl {
    font-size: 0.42rem;
  }
  .side-sub {
    font-size: 0.4rem;
  }
  .gallery-grid {
    grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
    gap: 8px;
    padding: 12px;
  }
  .cards-stage {
    gap: 10px;
    padding: 20px 12px;
  }
  .card-slot {
    width: 150px;
    height: 210px;
  }
  .reveal-actions {
    flex-wrap: wrap;
    gap: 8px;
  }
}
@media (max-width: 520px) {
  .side-menu {
    gap: 3px;
  }
  .side-btn {
    min-width: 46px;
    padding: 5px 5px 3px;
    border-radius: 8px;
  }
  .side-icon {
    font-size: 0.85rem;
  }
  .side-val {
    font-size: 0.65rem;
  }
  .side-milestone {
    padding: 3px 5px;
  }
  .cards-stage {
    gap: 8px;
  }
  .card-slot {
    width: 130px;
    height: 182px;
  }
  .page-header {
    padding: 6px 10px;
    gap: 4px;
  }
  .header-nav .tab-btn {
    flex: 1;
    text-align: center;
  }
  .gallery-filters {
    padding: 8px 12px;
  }
}
</style>
