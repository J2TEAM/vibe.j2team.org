import type { GroupStanding, Match } from '../types'

function generateId(): string {
  return Math.random().toString(36).slice(2, 10)
}

export function generateRoundRobinMatches(participantIds: string[], legs: 1 | 2): Match[] {
  const matches: Match[] = []
  const n = participantIds.length

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      matches.push({
        id: generateId(),
        roundIndex: 0,
        matchIndex: matches.length,
        participantA: participantIds[i]!,
        participantB: participantIds[j]!,
        scoreA: null,
        scoreB: null,
        status: 'pending',
        winner: null,
      })
    }
  }

  if (legs === 2) {
    const firstLegCount = matches.length
    for (let i = 0; i < firstLegCount; i++) {
      const orig = matches[i]!
      matches.push({
        id: generateId(),
        roundIndex: 1,
        matchIndex: matches.length,
        participantA: orig.participantB!,
        participantB: orig.participantA!,
        scoreA: null,
        scoreB: null,
        status: 'pending',
        winner: null,
      })
    }
  }

  return matches
}

export function calcRoundRobinStandings(
  participantIds: string[],
  matches: Match[],
): GroupStanding[] {
  const standings: GroupStanding[] = participantIds.map((id) => ({
    participantId: id,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
  }))

  for (const match of matches) {
    if (match.status !== 'done') continue
    if (match.scoreA === null || match.scoreB === null) continue

    const standingA = standings.find((s) => s.participantId === match.participantA)
    const standingB = standings.find((s) => s.participantId === match.participantB)
    if (!standingA || !standingB) continue

    standingA.played++
    standingB.played++
    standingA.goalsFor += match.scoreA
    standingA.goalsAgainst += match.scoreB
    standingB.goalsFor += match.scoreB
    standingB.goalsAgainst += match.scoreA

    if (match.scoreA > match.scoreB) {
      standingA.won++
      standingB.lost++
      standingA.points += 3
    } else if (match.scoreA < match.scoreB) {
      standingB.won++
      standingA.lost++
      standingB.points += 3
    } else {
      standingA.drawn++
      standingB.drawn++
      standingA.points += 1
      standingB.points += 1
    }

    standingA.goalDifference = standingA.goalsFor - standingA.goalsAgainst
    standingB.goalDifference = standingB.goalsFor - standingB.goalsAgainst
  }

  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference
    return b.goalsFor - a.goalsFor
  })

  return standings
}
