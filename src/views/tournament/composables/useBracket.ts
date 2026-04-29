import type { Match, Participant } from '../types'

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

function nextPowerOf2(n: number): number {
  let p = 1
  while (p < n) p *= 2
  return p
}

export function generateSingleEliminationMatches(
  participants: Participant[],
  randomize: boolean,
): Match[] {
  const ordered = randomize ? shuffle(participants) : [...participants]
  const n = ordered.length
  const bracketSize = nextPowerOf2(n)
  const totalRounds = Math.log2(bracketSize)
  const matches: Match[] = []

  const firstRoundMatchCount = bracketSize / 2
  let matchIndex = 0

  for (let i = 0; i < firstRoundMatchCount; i++) {
    const topSeed = ordered[i] ?? null
    const bottomIndex = bracketSize - 1 - i
    const bottomSeed = ordered[bottomIndex] ?? null

    const isBye = topSeed !== null && bottomSeed === null

    const match: Match = {
      id: generateId(),
      roundIndex: 0,
      matchIndex,
      participantA: topSeed?.id ?? null,
      participantB: bottomSeed?.id ?? null,
      scoreA: isBye ? 0 : null,
      scoreB: isBye ? 0 : null,
      status: isBye ? 'done' : 'pending',
      winner: isBye ? (topSeed?.id ?? null) : null,
      isBye,
    }
    matches.push(match)
    matchIndex++
  }

  for (let round = 1; round < totalRounds; round++) {
    const matchesInRound = bracketSize / Math.pow(2, round + 1)
    for (let i = 0; i < matchesInRound; i++) {
      matches.push({
        id: generateId(),
        roundIndex: round,
        matchIndex: i,
        participantA: null,
        participantB: null,
        scoreA: null,
        scoreB: null,
        status: 'pending',
        winner: null,
      })
    }
  }

  propagateByes(matches, totalRounds)
  return matches
}

function propagateByes(matches: Match[], totalRounds: number): void {
  for (let round = 0; round < totalRounds - 1; round++) {
    const currentRoundMatches = matches
      .filter((m) => m.roundIndex === round)
      .sort((a, b) => a.matchIndex - b.matchIndex)

    for (const match of currentRoundMatches) {
      if (match.status === 'done' && match.winner) {
        const nextMatchIndex = Math.floor(match.matchIndex / 2)
        const nextMatch = matches.find(
          (m) => m.roundIndex === round + 1 && m.matchIndex === nextMatchIndex,
        )
        if (nextMatch) {
          if (match.matchIndex % 2 === 0) {
            nextMatch.participantA = match.winner
          } else {
            nextMatch.participantB = match.winner
          }

          if (nextMatch.participantA && nextMatch.participantB === null && nextMatch.isBye) {
            nextMatch.status = 'done'
            nextMatch.winner = nextMatch.participantA
            nextMatch.scoreA = 0
            nextMatch.scoreB = 0
          }
        }
      }
    }
  }
}

export function advanceWinner(matches: Match[], match: Match): void {
  const totalRounds = Math.max(...matches.map((m) => m.roundIndex)) + 1
  if (match.roundIndex >= totalRounds - 1) return

  const nextMatchIndex = Math.floor(match.matchIndex / 2)
  const nextMatch = matches.find(
    (m) =>
      m.roundIndex === match.roundIndex + 1 &&
      m.matchIndex === nextMatchIndex &&
      m.bracket === match.bracket,
  )
  if (!nextMatch || !match.winner) return

  if (match.matchIndex % 2 === 0) {
    nextMatch.participantA = match.winner
  } else {
    nextMatch.participantB = match.winner
  }
}

export function clearDownstreamMatches(matches: Match[], match: Match, oldWinner: string): void {
  const totalRounds = Math.max(...matches.map((m) => m.roundIndex)) + 1
  let currentRound = match.roundIndex + 1
  let currentMatchIndex = Math.floor(match.matchIndex / 2)

  while (currentRound < totalRounds) {
    const nextMatch = matches.find(
      (m) =>
        m.roundIndex === currentRound &&
        m.matchIndex === currentMatchIndex &&
        m.bracket === match.bracket,
    )
    if (!nextMatch) break

    const isInA = nextMatch.participantA === oldWinner
    const isInB = nextMatch.participantB === oldWinner

    if (!isInA && !isInB) break

    if (nextMatch.status === 'done') {
      nextMatch.status = 'pending'
      nextMatch.scoreA = null
      nextMatch.scoreB = null
      nextMatch.winner = null
    }

    if (isInA) nextMatch.participantA = null
    if (isInB) nextMatch.participantB = null

    currentMatchIndex = Math.floor(currentMatchIndex / 2)
    currentRound++
  }
}

export function generateDoubleEliminationMatches(
  participants: Participant[],
  randomize: boolean,
): Match[] {
  const ordered = randomize ? shuffle(participants) : [...participants]
  const n = ordered.length
  const bracketSize = nextPowerOf2(n)
  const wbRounds = Math.log2(bracketSize)
  const matches: Match[] = []

  const firstRoundMatchCount = bracketSize / 2
  let matchIndex = 0
  for (let i = 0; i < firstRoundMatchCount; i++) {
    const topSeed = ordered[i] ?? null
    const bottomIndex = bracketSize - 1 - i
    const bottomSeed = ordered[bottomIndex] ?? null
    const isBye = topSeed !== null && bottomSeed === null

    matches.push({
      id: generateId(),
      roundIndex: 0,
      matchIndex,
      participantA: topSeed?.id ?? null,
      participantB: bottomSeed?.id ?? null,
      scoreA: isBye ? 0 : null,
      scoreB: isBye ? 0 : null,
      status: isBye ? 'done' : 'pending',
      winner: isBye ? (topSeed?.id ?? null) : null,
      isBye,
      bracket: 'winners',
    })
    matchIndex++
  }

  for (let round = 1; round < wbRounds; round++) {
    const matchesInRound = bracketSize / Math.pow(2, round + 1)
    for (let i = 0; i < matchesInRound; i++) {
      matches.push({
        id: generateId(),
        roundIndex: round,
        matchIndex: i,
        participantA: null,
        participantB: null,
        scoreA: null,
        scoreB: null,
        status: 'pending',
        winner: null,
        bracket: 'winners',
      })
    }
  }

  const lbRounds = (wbRounds - 1) * 2
  for (let round = 0; round < lbRounds; round++) {
    const matchesInRound =
      round === 0
        ? bracketSize / 4
        : Math.max(1, Math.ceil(bracketSize / Math.pow(2, Math.floor(round / 2) + 2)))
    for (let i = 0; i < matchesInRound; i++) {
      matches.push({
        id: generateId(),
        roundIndex: round,
        matchIndex: i,
        participantA: null,
        participantB: null,
        scoreA: null,
        scoreB: null,
        status: 'pending',
        winner: null,
        bracket: 'losers',
      })
    }
  }

  matches.push({
    id: generateId(),
    roundIndex: 0,
    matchIndex: 0,
    participantA: null,
    participantB: null,
    scoreA: null,
    scoreB: null,
    status: 'pending',
    winner: null,
    bracket: 'grand-final',
  })

  const wbMatches = matches.filter((m) => m.bracket === 'winners')
  propagateByesForBracket(wbMatches, wbRounds)
  for (const wm of wbMatches) {
    const orig = matches.find((m) => m.id === wm.id)
    if (orig) Object.assign(orig, wm)
  }

  return matches
}

function propagateByesForBracket(matches: Match[], totalRounds: number): void {
  for (let round = 0; round < totalRounds - 1; round++) {
    const currentRoundMatches = matches
      .filter((m) => m.roundIndex === round)
      .sort((a, b) => a.matchIndex - b.matchIndex)

    for (const match of currentRoundMatches) {
      if (match.status === 'done' && match.winner) {
        const nextMatchIndex = Math.floor(match.matchIndex / 2)
        const nextMatch = matches.find(
          (m) => m.roundIndex === round + 1 && m.matchIndex === nextMatchIndex,
        )
        if (nextMatch) {
          if (match.matchIndex % 2 === 0) {
            nextMatch.participantA = match.winner
          } else {
            nextMatch.participantB = match.winner
          }
        }
      }
    }
  }
}

export function getRoundName(roundIndex: number, totalRounds: number, bracket?: string): string {
  if (bracket === 'grand-final') return 'Grand Final'
  if (bracket === 'losers') return `LB Vòng ${roundIndex + 1}`

  if (roundIndex === totalRounds - 1) return 'Chung kết'
  if (roundIndex === totalRounds - 2) return 'Bán kết'
  if (roundIndex === totalRounds - 3) return 'Tứ kết'
  return `Vòng ${roundIndex + 1}`
}
