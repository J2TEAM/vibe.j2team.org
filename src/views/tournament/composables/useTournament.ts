import { useLocalStorage } from '@vueuse/core'
import { computed, ref } from 'vue'
import type { Match, Tournament, TournamentFormat, TournamentView } from '../types'
import {
  advanceWinner,
  clearDownstreamMatches,
  generateDoubleEliminationMatches,
  generateSingleEliminationMatches,
} from './useBracket'
import {
  autoGroupCount,
  generateGroups,
  getAdvancingParticipants,
  isGroupStageComplete,
  recalcStandings,
} from './useGroupStage'
import { calcRoundRobinStandings, generateRoundRobinMatches } from './useRoundRobin'

function generateId(): string {
  return Math.random().toString(36).slice(2, 10)
}

export function useTournament() {
  const tournaments = useLocalStorage<Tournament[]>('vibe-tournaments', [])
  const currentView = ref<TournamentView>('list')
  const currentTournamentId = ref<string | null>(null)
  const editingTournamentId = ref<string | null>(null)

  const currentTournament = computed(
    () => tournaments.value.find((t) => t.id === currentTournamentId.value) ?? null,
  )

  function navigateTo(view: TournamentView, tournamentId?: string) {
    currentView.value = view
    if (tournamentId) currentTournamentId.value = tournamentId
  }

  function createTournament(
    name: string,
    sport: string,
    format: TournamentFormat,
  ): { ok: boolean; error?: string } {
    const trimmed = name.trim()
    if (!trimmed) return { ok: false, error: 'Tên giải đấu không được để trống' }
    if (!sport.trim()) return { ok: false, error: 'Tên bộ môn không được để trống' }

    const duplicate = tournaments.value.find((t) => t.name.toLowerCase() === trimmed.toLowerCase())
    if (duplicate) return { ok: false, error: 'Tên giải đấu đã tồn tại' }

    const tournament: Tournament = {
      id: generateId(),
      name: trimmed,
      sport: sport.trim(),
      format,
      status: 'setup',
      participants: [],
      matches: [],
      groups: [],
      knockoutStage: null,
      roundRobinLegs: 1,
      groupCount: null,
      advancePerGroup: 2,
      createdAt: Date.now(),
    }
    tournaments.value.push(tournament)
    navigateTo('detail', tournament.id)
    return { ok: true }
  }

  function updateTournament(
    id: string,
    data: { name?: string; sport?: string; format?: TournamentFormat },
  ): { ok: boolean; error?: string } {
    const t = tournaments.value.find((x) => x.id === id)
    if (!t) return { ok: false, error: 'Giải đấu không tồn tại' }
    if (t.status !== 'setup') return { ok: false, error: 'Chỉ được sửa khi đang thiết lập' }

    if (data.name !== undefined) {
      const trimmed = data.name.trim()
      if (!trimmed) return { ok: false, error: 'Tên giải đấu không được để trống' }
      const dup = tournaments.value.find(
        (x) => x.id !== id && x.name.toLowerCase() === trimmed.toLowerCase(),
      )
      if (dup) return { ok: false, error: 'Tên giải đấu đã tồn tại' }
      t.name = trimmed
    }
    if (data.sport !== undefined) t.sport = data.sport.trim()
    if (data.format !== undefined) t.format = data.format
    return { ok: true }
  }

  function deleteTournament(id: string) {
    const idx = tournaments.value.findIndex((t) => t.id === id)
    if (idx !== -1) {
      tournaments.value.splice(idx, 1)
      if (currentTournamentId.value === id) {
        navigateTo('list')
      }
    }
  }

  function addParticipant(tournamentId: string, name: string): { ok: boolean; error?: string } {
    const t = tournaments.value.find((x) => x.id === tournamentId)
    if (!t) return { ok: false, error: 'Giải đấu không tồn tại' }
    if (t.status !== 'setup') return { ok: false, error: 'Không thể thêm khi đang thi đấu' }

    const trimmed = name.trim()
    if (!trimmed) return { ok: false, error: 'Tên không được để trống' }

    const dup = t.participants.find((p) => p.name.trim().toLowerCase() === trimmed.toLowerCase())
    if (dup) return { ok: false, error: 'Tên đã tồn tại trong giải đấu' }

    t.participants.push({ id: generateId(), name: trimmed })
    return { ok: true }
  }

  function addParticipantsBulk(
    tournamentId: string,
    text: string,
  ): { ok: boolean; added: number; errors: string[] } {
    const t = tournaments.value.find((x) => x.id === tournamentId)
    if (!t) return { ok: false, added: 0, errors: ['Giải đấu không tồn tại'] }
    if (t.status !== 'setup')
      return {
        ok: false,
        added: 0,
        errors: ['Không thể thêm khi đang thi đấu'],
      }

    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
    let added = 0
    const errors: string[] = []

    for (const line of lines) {
      const result = addParticipant(tournamentId, line)
      if (result.ok) {
        added++
      } else {
        errors.push(`"${line}": ${result.error}`)
      }
    }
    return { ok: errors.length === 0, added, errors }
  }

  function removeParticipant(tournamentId: string, participantId: string) {
    const t = tournaments.value.find((x) => x.id === tournamentId)
    if (!t || t.status !== 'setup') return
    t.participants = t.participants.filter((p) => p.id !== participantId)
  }

  function editParticipant(
    tournamentId: string,
    participantId: string,
    newName: string,
  ): { ok: boolean; error?: string } {
    const t = tournaments.value.find((x) => x.id === tournamentId)
    if (!t) return { ok: false, error: 'Giải đấu không tồn tại' }
    if (t.status !== 'setup') return { ok: false, error: 'Không thể sửa khi đang thi đấu' }

    const trimmed = newName.trim()
    if (!trimmed) return { ok: false, error: 'Tên không được để trống' }

    const dup = t.participants.find(
      (p) => p.id !== participantId && p.name.trim().toLowerCase() === trimmed.toLowerCase(),
    )
    if (dup) return { ok: false, error: 'Tên đã tồn tại' }

    const participant = t.participants.find((p) => p.id === participantId)
    if (participant) participant.name = trimmed
    return { ok: true }
  }

  function startTournament(
    tournamentId: string,
    randomize: boolean = true,
  ): { ok: boolean; error?: string } {
    const t = tournaments.value.find((x) => x.id === tournamentId)
    if (!t) return { ok: false, error: 'Giải đấu không tồn tại' }
    if (t.status !== 'setup') return { ok: false, error: 'Giải đấu đã bắt đầu' }

    const n = t.participants.length
    if (n < 2) return { ok: false, error: 'Cần ít nhất 2 người tham gia' }

    if (t.format === 'group-knockout' && n < 4)
      return {
        ok: false,
        error: 'Group Stage + Knockout cần ít nhất 4 người tham gia',
      }

    switch (t.format) {
      case 'single-elimination':
        t.matches = generateSingleEliminationMatches(t.participants, randomize)
        break

      case 'double-elimination':
        t.matches = generateDoubleEliminationMatches(t.participants, randomize)
        break

      case 'group-knockout': {
        const gc = t.groupCount ?? autoGroupCount(n)
        t.groupCount = gc
        t.groups = generateGroups(t.participants, gc, randomize)
        t.knockoutStage = null
        break
      }

      case 'round-robin': {
        const ids = randomize
          ? t.participants.map((p) => p.id).sort(() => Math.random() - 0.5)
          : t.participants.map((p) => p.id)
        t.matches = generateRoundRobinMatches(ids, t.roundRobinLegs)
        break
      }
    }

    t.status = 'in-progress'
    return { ok: true }
  }

  function submitMatchResult(
    tournamentId: string,
    matchId: string,
    scoreA: number,
    scoreB: number,
  ): { ok: boolean; error?: string } {
    const t = tournaments.value.find((x) => x.id === tournamentId)
    if (!t) return { ok: false, error: 'Giải đấu không tồn tại' }
    if (t.status !== 'in-progress')
      return { ok: false, error: 'Giải đấu không ở trạng thái thi đấu' }
    if (scoreA < 0 || scoreB < 0) return { ok: false, error: 'Điểm số phải >= 0' }
    if (!Number.isInteger(scoreA) || !Number.isInteger(scoreB))
      return { ok: false, error: 'Điểm số phải là số nguyên' }

    let match: Match | undefined
    let matchList: Match[] = t.matches

    if (t.format === 'group-knockout' && !t.knockoutStage) {
      for (const group of t.groups) {
        match = group.matches.find((m) => m.id === matchId)
        if (match) {
          matchList = group.matches
          break
        }
      }
    } else if (t.format === 'group-knockout' && t.knockoutStage) {
      match = t.knockoutStage.matches.find((m) => m.id === matchId)
      if (!match) {
        for (const group of t.groups) {
          match = group.matches.find((m) => m.id === matchId)
          if (match) {
            matchList = group.matches
            break
          }
        }
      } else {
        matchList = t.knockoutStage.matches
      }
    } else {
      match = t.matches.find((m) => m.id === matchId)
    }

    if (!match) return { ok: false, error: 'Không tìm thấy trận đấu' }

    const isElimination =
      t.format === 'single-elimination' ||
      t.format === 'double-elimination' ||
      (t.format === 'group-knockout' && t.knockoutStage?.matches.includes(match))

    if (isElimination && scoreA === scoreB)
      return { ok: false, error: 'Vòng loại trực tiếp không được hòa' }

    const oldWinner = match.winner

    match.scoreA = scoreA
    match.scoreB = scoreB
    match.status = 'done'

    if (scoreA > scoreB) {
      match.winner = match.participantA
    } else if (scoreB > scoreA) {
      match.winner = match.participantB
    } else {
      match.winner = null
    }

    if (isElimination && oldWinner && oldWinner !== match.winner) {
      clearDownstreamMatches(matchList, match, oldWinner)
    }

    if (isElimination && match.winner) {
      advanceWinner(matchList, match)
    }

    if (t.format === 'group-knockout') {
      const group = t.groups.find((g) => g.matches.some((m) => m.id === matchId))
      if (group) {
        recalcStandings(group)
      }
    }

    checkTournamentCompletion(t)
    return { ok: true }
  }

  function startKnockoutStage(tournamentId: string): { ok: boolean; error?: string } {
    const t = tournaments.value.find((x) => x.id === tournamentId)
    if (!t) return { ok: false, error: 'Giải đấu không tồn tại' }
    if (t.format !== 'group-knockout')
      return { ok: false, error: 'Chỉ dùng cho Group Stage + Knockout' }
    if (!isGroupStageComplete(t.groups))
      return {
        ok: false,
        error: 'Vòng bảng chưa hoàn tất',
      }

    const advancing = getAdvancingParticipants(t.groups, t.advancePerGroup)
    if (advancing.length < 2) return { ok: false, error: 'Không đủ đội đi tiếp' }

    const advancingParticipants = advancing
      .map((id) => t.participants.find((p) => p.id === id))
      .filter((p): p is NonNullable<typeof p> => p !== undefined)

    const knockoutMatches = generateSingleEliminationMatches(advancingParticipants, false)

    const bracketSize = Math.pow(2, Math.ceil(Math.log2(advancingParticipants.length)))
    t.knockoutStage = {
      matches: knockoutMatches,
      rounds: Math.log2(bracketSize),
    }

    return { ok: true }
  }

  function checkTournamentCompletion(t: Tournament): void {
    let allDone = false

    switch (t.format) {
      case 'single-elimination':
      case 'double-elimination':
        allDone = t.matches.filter((m) => !m.isBye).every((m) => m.status === 'done')
        break

      case 'round-robin':
        allDone = t.matches.every((m) => m.status === 'done')
        break

      case 'group-knockout':
        if (t.knockoutStage) {
          const groupsDone = t.groups.every((g) => g.matches.every((m) => m.status === 'done'))
          const knockoutDone = t.knockoutStage.matches
            .filter((m) => !m.isBye)
            .every((m) => m.status === 'done')
          allDone = groupsDone && knockoutDone
        }
        break
    }

    if (allDone) t.status = 'finished'
  }

  function getParticipantName(tournament: Tournament, id: string | null): string {
    if (!id) return 'TBD'
    return tournament.participants.find((p) => p.id === id)?.name ?? 'TBD'
  }

  function getChampion(tournament: Tournament): string | null {
    if (tournament.format === 'round-robin') {
      const standings = calcRoundRobinStandings(
        tournament.participants.map((p) => p.id),
        tournament.matches,
      )
      return standings[0]?.participantId ?? null
    }

    if (tournament.format === 'group-knockout' && tournament.knockoutStage) {
      const finalMatch = tournament.knockoutStage.matches
        .filter((m) => !m.isBye)
        .reduce((a, b) => (a.roundIndex > b.roundIndex ? a : b))
      return finalMatch?.winner ?? null
    }

    const nonByeMatches = tournament.matches.filter((m) => !m.isBye)
    if (nonByeMatches.length === 0) return null
    const finalMatch = nonByeMatches.reduce((a, b) => (a.roundIndex > b.roundIndex ? a : b))
    return finalMatch?.winner ?? null
  }

  return {
    tournaments,
    currentView,
    currentTournamentId,
    editingTournamentId,
    currentTournament,
    navigateTo,
    createTournament,
    updateTournament,
    deleteTournament,
    addParticipant,
    addParticipantsBulk,
    removeParticipant,
    editParticipant,
    startTournament,
    submitMatchResult,
    startKnockoutStage,
    getParticipantName,
    getChampion,
    calcRoundRobinStandings,
  }
}
