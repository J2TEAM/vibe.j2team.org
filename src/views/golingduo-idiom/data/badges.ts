import type { Badge, UserProgress } from './types'
import { idioms } from './idioms'

export const badges: readonly Badge[] = [
  {
    id: 'newbie',
    name: 'Newbie Mơ Tây',
    description: 'Học idiom đầu tiên — hành trình vạn dặm bắt đầu từ một bước chân',
    emoji: '🐣',
    condition: (p: UserProgress) => p.learnedIds.length >= 1,
  },
  {
    id: 'streak-7',
    name: 'Cháy Không Tắt',
    description: 'Streak 7 ngày liên tiếp — chăm chỉ quá trời!',
    emoji: '🔥',
    condition: (p: UserProgress) => p.streak.current >= 7,
  },
  {
    id: 'brain-50',
    name: 'Não To Bá Đạo',
    description: 'Học 50 idioms — não mày đang lên level rồi',
    emoji: '🧠',
    condition: (p: UserProgress) => p.learnedIds.length >= 50,
  },
  {
    id: 'perfect-quiz',
    name: 'Bắn Không Trượt',
    description: 'Quiz 10/10 — bắn phát nào trúng phát đó',
    emoji: '🎯',
    condition: (p: UserProgress) => p.quizScores.some((s) => s.score === s.total && s.total >= 10),
  },
  {
    id: 'spin-10',
    name: 'Số Hên Vip Pro',
    description: 'Quay vòng quay 10 lần — nghiện không cai được',
    emoji: '🌀',
    condition: (p: UserProgress) => p.spinHistory.length >= 10,
  },
  {
    id: 'master',
    name: 'Người Việt Nói Tiếng Anh Như Tây',
    description: 'Học hết tất cả idioms — mày chính là legend',
    emoji: '👑',
    condition: (p: UserProgress) => p.learnedIds.length >= idioms.length,
  },
] as const
