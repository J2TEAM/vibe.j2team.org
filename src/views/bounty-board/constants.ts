import type { RarityConfig, Rarity, RankConfig, Rank } from './types'

export const BOARD_SIZE = 6
export const REFRESH_COST = 5

// SS Endgame constants
export const SS_MIN_EXP = 1500 // EXP threshold to reach SS
export const SS_BOSS_INTERVAL = 300 // Every 300 EXP above SS, a boss appears
export const SS_MAX_EXP = 3600 // Total EXP cap — game complete!

// Fixed boss quest per rank-up (E → SS), each a specific real-life challenge

// Random boss pool for SS rank (after the fixed SS boss)

export const RANK_UP_COSTS: Partial<Record<Rank, number>> = {
  E: 0, // F → E: free
  D: 10, // E → D
  C: 20, // D → C
  B: 50, // C → B
  A: 80, // B → A
  S: 100, // A → S
  SS: 200, // S → SS
}

// ─── Quest Templates ─────────────────────────────────────────────────────────

// ─── Rarity Config ────────────────────────────────────────────────────────────

export const RARITIES: Rarity[] = ['white', 'blue', 'purple', 'gold']

export const RARITY_CONFIG: Record<Rarity, RarityConfig> = {
  white: {
    label: 'Thường',
    weight: 60,
    expMult: 1,
    goldMult: 1,
    timeMult: 1,
    hpRestoreMult: 1,
    borderClass: 'border-border-default',
    bgClass: 'bg-bg-surface',
    textClass: 'text-text-secondary',
    badgeClass: 'bg-bg-elevated text-text-dim',
    shadowClass: '',
    pinClass: 'bg-text-dim',
  },
  blue: {
    label: 'Hiếm',
    weight: 25,
    expMult: 1.5,
    goldMult: 1.5,
    timeMult: 1.5,
    hpRestoreMult: 1.3,
    borderClass: 'border-accent-sky',
    bgClass: 'bg-accent-sky/5',
    textClass: 'text-accent-sky',
    badgeClass: 'bg-accent-sky/20 text-accent-sky',
    shadowClass: 'shadow-accent-sky/20',
    pinClass: 'bg-accent-sky',
  },
  purple: {
    label: 'Sử Thi',
    weight: 10,
    expMult: 2.5,
    goldMult: 2,
    timeMult: 2,
    hpRestoreMult: 1.6,
    borderClass: 'border-violet-500',
    bgClass: 'bg-violet-500/5',
    textClass: 'text-violet-400',
    badgeClass: 'bg-violet-500/20 text-violet-400',
    shadowClass: 'shadow-violet-500/20',
    pinClass: 'bg-violet-400',
  },
  gold: {
    label: 'Huyền Thoại',
    weight: 5,
    expMult: 4,
    goldMult: 3,
    timeMult: 5,
    hpRestoreMult: 2.5,
    borderClass: 'border-accent-amber',
    bgClass: 'bg-accent-amber/5',
    textClass: 'text-accent-amber',
    badgeClass: 'bg-accent-amber/20 text-accent-amber',
    shadowClass: 'shadow-accent-amber/20',
    pinClass: 'bg-accent-amber',
  },
}

// ─── Rank Config ──────────────────────────────────────────────────────────────

export const RANKS: Rank[] = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS']

export const RANK_CONFIG: RankConfig[] = [
  { label: 'F', minExp: 0, nextExp: 0, title: 'Lính Mới' },
  { label: 'E', minExp: 0, nextExp: 100, title: 'Chiến Binh' },
  { label: 'D', minExp: 100, nextExp: 200, title: 'Kiếm Sĩ' },
  { label: 'C', minExp: 200, nextExp: 500, title: 'Dũng Sĩ' },
  { label: 'B', minExp: 500, nextExp: 800, title: 'Hiệp Sĩ' },
  { label: 'A', minExp: 800, nextExp: 1000, title: 'Đại Hiệp' },
  { label: 'S', minExp: 1000, nextExp: 1500, title: 'Huyền Thoại' },
  { label: 'SS', minExp: 1500, nextExp: null, title: 'Bất Tử' },
]

// ─── Category Config ──────────────────────────────────────────────────────────

export const CATEGORY_CONFIG = {
  study: { label: 'Học Tập / IT', icon: 'lucide:book-open', color: 'text-accent-sky' },
  physical: { label: 'Thể Chất', icon: 'lucide:dumbbell', color: 'text-accent-coral' },
  life: { label: 'Đời Sống', icon: 'lucide:home', color: 'text-accent-amber' },
  mental: { label: 'Tinh Thần', icon: 'lucide:heart', color: 'text-violet-400' },
  social: { label: 'Giao Tiếp', icon: 'lucide:users', color: 'text-green-400' },
  creative: { label: 'Sáng Tạo', icon: 'lucide:palette', color: 'text-rose-400' },
  finance: { label: 'Tài Chính', icon: 'lucide:coins', color: 'text-yellow-400' },
  adventure: { label: 'Phiêu Lưu', icon: 'lucide:compass', color: 'text-teal-400' },
}

// ─── Shop Items ───────────────────────────────────────────────────────────────
