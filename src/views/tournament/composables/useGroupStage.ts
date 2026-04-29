import type { Group, GroupStanding, Match, Participant } from '../types'

function generateId(): string {
  return Math.random().toString(36).slice(2, 10)
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = a[i]!
    a[i] = a[j]!
    a[j] = temp
  }
  return a
}

export function autoGroupCount(participantCount: number): number {
  if (participantCount <= 5) return 2
  if (participantCount <= 8) return 2
  if (participantCount <= 12) return 3
  if (participantCount <= 16) return 4
  if (participantCount <= 24) return 6
  return 8
}

export function generateGroups(
  participants: Participant[],
  groupCount: number,
  randomize: boolean,
): Group[] {
  const ordered = randomize ? shuffle(participants) : [...participants]
  const groups: Group[] = []
  const groupNames = 'ABCDEFGHIJKLMNOP'

  for (let i = 0; i < groupCount; i++) {
    groups.push({
      name: `Bảng ${groupNames[i] ?? String(i + 1)}`,
      participantIds: [],
      matches: [],
      standings: [],
    })
  }

  for (let i = 0; i < ordered.length; i++) {
    const p = ordered[i]!
    const group = groups[i % groupCount]!
    group.participantIds.push(p.id)
  }

  for (const group of groups) {
    group.matches = generateRoundRobinMatchesForGroup(group.participantIds, groups.indexOf(group))
    group.standings = initStandings(group.participantIds)
  }

  return groups
}

function generateRoundRobinMatchesForGroup(participantIds: string[], groupIndex: number): Match[] {
  const matches: Match[] = []
  let roundIndex = 0

  for (let i = 0; i < participantIds.length; i++) {
    for (let j = i + 1; j < participantIds.length; j++) {
      matches.push({
        id: generateId(),
        roundIndex,
        matchIndex: matches.length,
        participantA: participantIds[i]!,
        participantB: participantIds[j]!,
        scoreA: null,
        scoreB: null,
        status: 'pending',
        winner: null,
        groupIndex,
      })
    }
    roundIndex++
  }

  return matches
}

function initStandings(participantIds: string[]): GroupStanding[] {
  return participantIds.map((id) => ({
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
}

export function recalcStandings(group: Group): void {
  group.standings = initStandings(group.participantIds)

  for (const match of group.matches) {
    if (match.status !== 'done') continue
    if (match.scoreA === null || match.scoreB === null) continue

    const standingA = group.standings.find((s) => s.participantId === match.participantA)
    const standingB = group.standings.find((s) => s.participantId === match.participantB)

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

  group.standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference
    return b.goalsFor - a.goalsFor
  })
}

export function isGroupStageComplete(groups: Group[]): boolean {
  return groups.every((g) => g.matches.every((m) => m.status === 'done'))
}

export function getAdvancingParticipants(groups: Group[], advancePerGroup: number): string[] {
  const result: string[] = []
  for (const group of groups) {
    recalcStandings(group)
    for (let i = 0; i < advancePerGroup && i < group.standings.length; i++) {
      const standing = group.standings[i]
      if (standing) {
        result.push(standing.participantId)
      }
    }
  }
  return result
}
