import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import rawCorners from '../data/corners.json'
import rawTeamsStats from '../data/teams_stats.json'
import rawH2H from '../data/h2h_corners.json'
import type {
  CornerDataFile,
  CornerThresholdKey,
  H2HFile,
  H2HPairData,
  TeamInfo,
  TeamSideStats,
  TeamsStatsFile,
} from '../types'

// Ép kiểu JSON import
const cornersData = rawCorners as CornerDataFile
const teamsData = rawTeamsStats as TeamsStatsFile
const h2hData = rawH2H as H2HFile

const DEFAULT_THRESHOLDS: CornerThresholdKey[] = ['8.5', '9.5', '10.5', '11.5', '12.5']

export const useCornerStore = defineStore('corner', () => {
  // --- State ---
  const predictions = ref(cornersData.predictions)
  const selectedHomeTeamId = ref<string | null>(null)
  const selectedAwayTeamId = ref<string | null>(null)
  const teamQuery = ref('')

  // --- Metadata ---
  const updatedAt = cornersData.updatedAt
  const modelInfo = cornersData.model

  // --- Getters: danh sách đội ---
  const allTeams = computed<TeamInfo[]>(() => teamsData.teams)

  // Lọc đội theo search query
  const filteredTeams = computed<TeamInfo[]>(() => {
    const q = teamQuery.value.trim().toLowerCase()
    if (!q) return allTeams.value
    return allTeams.value.filter(
      (t) => t.name.toLowerCase().includes(q) || t.shortName.toLowerCase().includes(q),
    )
  })

  // --- Getters: stats đội được chọn ---
  const selectedHomeStats = computed<TeamSideStats | null>(() => {
    if (!selectedHomeTeamId.value) return null
    return teamsData.homeStats[selectedHomeTeamId.value] ?? null
  })

  const selectedAwayStats = computed<TeamSideStats | null>(() => {
    if (!selectedAwayTeamId.value) return null
    return teamsData.awayStats[selectedAwayTeamId.value] ?? null
  })

  // Tìm tên đội từ id
  const selectedHomeTeam = computed<TeamInfo | null>(() => {
    if (!selectedHomeTeamId.value) return null
    return allTeams.value.find((t) => t.id === selectedHomeTeamId.value) ?? null
  })

  const selectedAwayTeam = computed<TeamInfo | null>(() => {
    if (!selectedAwayTeamId.value) return null
    return allTeams.value.find((t) => t.id === selectedAwayTeamId.value) ?? null
  })

  // --- Getter: tìm H2H cho cặp đội đã chọn ---
  // H2H key trong JSON dùng alphabetical order, lookup cả 2 chiều
  const h2hForSelection = computed<H2HPairData | null>(() => {
    const home = selectedHomeTeamId.value
    const away = selectedAwayTeamId.value
    if (!home || !away) return null

    // Thử cả 2 chiều key
    const key1 = `${home}_${away}`
    const key2 = `${away}_${home}`

    return h2hData.pairs[key1] ?? h2hData.pairs[key2] ?? null
  })

  // Kiểm tra đã chọn đủ cặp đội chưa
  const hasFullSelection = computed(() => {
    return selectedHomeTeamId.value !== null && selectedAwayTeamId.value !== null
  })

  // Tính summary từ H2H data
  const h2hSummary = computed(() => {
    const h2h = h2hForSelection.value
    if (!h2h || !h2h.h2hTotals.length) return null

    const totals = h2h.h2hTotals
    const totalCorners = totals.reduce((sum, m) => sum + m.homeCorners + m.awayCorners, 0)
    const avgTotalCorners = totalCorners / totals.length

    let homeMoreCorners = 0
    let awayMoreCorners = 0
    let equalCorners = 0

    for (const match of totals) {
      if (match.homeCorners > match.awayCorners) homeMoreCorners++
      else if (match.awayCorners > match.homeCorners) awayMoreCorners++
      else equalCorners++
    }

    return {
      avgTotalCorners,
      homeMoreCorners,
      awayMoreCorners,
      equalCorners,
      totalMatches: totals.length,
    }
  })

  // --- Actions ---
  function setHomeTeam(id: string) {
    // Không cho chọn cùng đội cho cả 2 bên
    if (id === selectedAwayTeamId.value) return
    selectedHomeTeamId.value = id
  }

  function setAwayTeam(id: string) {
    if (id === selectedHomeTeamId.value) return
    selectedAwayTeamId.value = id
  }

  function setTeamQuery(query: string) {
    teamQuery.value = query
  }

  return {
    // State
    predictions,
    selectedHomeTeamId,
    selectedAwayTeamId,
    teamQuery,

    // Metadata
    updatedAt,
    modelInfo,
    DEFAULT_THRESHOLDS,

    // Getters
    allTeams,
    filteredTeams,
    selectedHomeTeam,
    selectedAwayTeam,
    selectedHomeStats,
    selectedAwayStats,
    h2hForSelection,
    hasFullSelection,
    h2hSummary,

    // Actions
    setHomeTeam,
    setAwayTeam,
    setTeamQuery,
  }
})
