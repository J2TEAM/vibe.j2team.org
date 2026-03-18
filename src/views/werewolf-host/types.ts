export type RoleId =
  | 'wolf'
  | 'wolf-cub'
  | 'cursed-wolf'
  | 'villager'
  | 'seer'
  | 'guard'
  | 'witch'
  | 'hunter'
  | 'disruptor'

export type Faction = 'wolf' | 'villager'

export type GamePhase =
  | 'setup'
  | 'role-reveal'
  | 'night'
  | 'day-result'
  | 'day-discussion'
  | 'day-nominate'
  | 'day-explain'
  | 'day-hang'
  | 'game-over'

export type NightStep = 'disruptor' | 'wolves' | 'seer' | 'guard' | 'witch' | 'hunter'

export type NightUiState = 'calling' | 'acting' | 'fake-wait' | 'sleeping'

export type DeathReason = 'wolf' | 'witch-poison' | 'hunter-shot' | 'hanged'

export interface Player {
  id: string
  name: string
  role: RoleId
  faction: Faction
  alive: boolean
  deathRound?: number
  deathTime?: 'night' | 'day'
  deathReason?: DeathReason
  isSilenced: boolean
}

export interface RoleConfig {
  wolf: number
  'wolf-cub': number
  'cursed-wolf': number
  villager: number
  seer: number
  guard: number
  witch: number
  hunter: number
  disruptor: number
}

export interface TimeConfig {
  discussionSeconds: number
  nominateSeconds: number
  explainSeconds: number
  hangVoteSeconds: number
  nightDelayMs: number
}

export interface DeathRecord {
  playerId: string
  reason: DeathReason
}

export interface NightRecord {
  night: number
  wolfTargets: string[]
  seerTarget?: string
  seerIsWolf?: boolean
  guardTarget?: string
  witchSaved?: string
  witchKilled?: string
  disruptorTarget?: string
  hunterTarget?: string
  deaths: DeathRecord[]
  curseConverted?: string
  wolfCubDied: boolean
}

export interface DayRecord {
  day: number
  silenced?: string
  nominations: Record<string, string | null>
  nominated: string[]
  hangVotes: Record<string, string | null>
  hanged?: string
  deaths: DeathRecord[]
}

export interface GameHistory {
  nights: NightRecord[]
  days: DayRecord[]
}

export const ROLE_NAMES: Record<RoleId, string> = {
  wolf: 'Sói thường',
  'wolf-cub': 'Sói con',
  'cursed-wolf': 'Sói nguyền',
  villager: 'Dân thường',
  seer: 'Tiên tri',
  guard: 'Bảo vệ',
  witch: 'Phù thủy',
  hunter: 'Thợ săn',
  disruptor: 'Kẻ phá hoại',
}

export const ROLE_EMOJI: Record<RoleId, string> = {
  wolf: '🐺',
  'wolf-cub': '🐺',
  'cursed-wolf': '😈',
  villager: '👤',
  seer: '🔮',
  guard: '🛡️',
  witch: '🧙',
  hunter: '🏹',
  disruptor: '🤫',
}

export const ROLE_DESC: Record<RoleId, string> = {
  wolf: 'Mỗi đêm cùng bầy cắn 1 người dân.',
  'wolf-cub': 'Khi chết, đêm sau sói được cắn 2 người.',
  'cursed-wolf': 'Ban đầu là Dân. Khi bị cắn, chuyển sang phe Sói.',
  villager: 'Không có kỹ năng đặc biệt.',
  seer: 'Mỗi đêm soi 1 người: kết quả là Sói hay Dân.',
  guard: 'Mỗi đêm bảo vệ 1 người khỏi bị cắn.',
  witch: 'Có 1 bình cứu và 1 bình độc, dùng 1 lần mỗi loại.',
  hunter: 'Khi chết, người bị chỉ định cũng chết theo.',
  disruptor: 'Mỗi đêm cấm 1 người nói chuyện sáng hôm sau.',
}

export const NIGHT_ORDER: NightStep[] = ['disruptor', 'wolves', 'seer', 'guard', 'witch', 'hunter']

export const NIGHT_CALL: Record<NightStep, string> = {
  disruptor: 'Kẻ phá hoại hãy mở mắt và chọn người muốn cấm thảo luận.',
  wolves: 'Bầy sói hãy mở mắt và chọn người muốn cắn.',
  seer: 'Tiên tri hãy mở mắt và chọn người muốn soi.',
  guard: 'Bảo vệ hãy mở mắt và chọn người muốn bảo vệ.',
  witch: 'Phù thủy hãy mở mắt.',
  hunter: 'Thợ săn hãy mở mắt và chọn người muốn chỉ định.',
}

export const NIGHT_SLEEP: Record<NightStep, string> = {
  disruptor: 'Kẻ phá hoại hãy nhắm mắt.',
  wolves: 'Bầy sói hãy nhắm mắt.',
  seer: 'Tiên tri hãy nhắm mắt.',
  guard: 'Bảo vệ hãy nhắm mắt.',
  witch: 'Phù thủy hãy nhắm mắt.',
  hunter: 'Thợ săn hãy nhắm mắt.',
}

export const ROLE_STEP_MAP: Partial<Record<NightStep, RoleId | RoleId[]>> = {
  disruptor: 'disruptor',
  wolves: ['wolf', 'wolf-cub', 'cursed-wolf'],
  seer: 'seer',
  guard: 'guard',
  witch: 'witch',
  hunter: 'hunter',
}
