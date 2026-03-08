import { describe, expect, it } from 'vitest'

import type { DailyLeaderboardEntry } from '../types'
import { upsertDailyLeaderboardEntry } from '../utils/stateUtils'

describe('upsertDailyLeaderboardEntry', () => {
  it('sorts by score desc, chaos asc, then timeLeft desc', () => {
    const entries: DailyLeaderboardEntry[] = [
      { id: 'a', player: 'A', score: 80, rank: 'R1', chaos: 30, timeLeft: 12, createdAt: 'now' },
      { id: 'b', player: 'B', score: 80, rank: 'R1', chaos: 20, timeLeft: 8, createdAt: 'now' },
      { id: 'c', player: 'C', score: 76, rank: 'R2', chaos: 10, timeLeft: 20, createdAt: 'now' },
    ]

    const inserted: DailyLeaderboardEntry = {
      id: 'd',
      player: 'D',
      score: 80,
      rank: 'R1',
      chaos: 20,
      timeLeft: 15,
      createdAt: 'now',
    }

    const ranked = upsertDailyLeaderboardEntry(entries, inserted, 5)

    expect(ranked.map((item) => item.id)).toEqual(['d', 'b', 'a', 'c'])
  })

  it('replaces duplicated run id and enforces limit', () => {
    const entries: DailyLeaderboardEntry[] = [
      { id: 'same', player: 'A', score: 40, rank: 'R3', chaos: 50, timeLeft: 2, createdAt: 'old' },
      { id: 'b', player: 'B', score: 88, rank: 'R1', chaos: 25, timeLeft: 18, createdAt: 'now' },
      { id: 'c', player: 'C', score: 83, rank: 'R1', chaos: 31, timeLeft: 12, createdAt: 'now' },
    ]

    const inserted: DailyLeaderboardEntry = {
      id: 'same',
      player: 'A+',
      score: 91,
      rank: 'R1',
      chaos: 15,
      timeLeft: 22,
      createdAt: 'new',
    }

    const ranked = upsertDailyLeaderboardEntry(entries, inserted, 3)

    expect(ranked).toHaveLength(3)
    expect(ranked[0]?.id).toBe('same')
    expect(ranked.filter((item) => item.id === 'same')).toHaveLength(1)
    expect(ranked[0]?.player).toBe('A+')
  })
})
