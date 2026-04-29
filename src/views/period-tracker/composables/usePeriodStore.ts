import { computed } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import type { PeriodCycle, DayLog, SymptomType, FlowLevel, CyclePhase } from '../types'

export function usePeriodStore() {
  const cycles = useLocalStorage<PeriodCycle[]>('period-tracker-cycles', [])
  const dayLogs = useLocalStorage<DayLog[]>('period-tracker-logs', [])

  function getToday(): string {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  function addCycle(startDate: string, endDate: string) {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const length = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

    // Update previous cycle's cycleLength
    const sorted = [...cycles.value].sort((a, b) => b.startDate.localeCompare(a.startDate))
    if (sorted.length > 0) {
      const prev = sorted[0]!
      const prevStart = new Date(prev.startDate)
      const cycleLen = Math.round((start.getTime() - prevStart.getTime()) / (1000 * 60 * 60 * 24))
      const idx = cycles.value.findIndex((c) => c.id === prev.id)
      if (idx >= 0 && cycleLen > 0) {
        cycles.value[idx] = { ...prev, cycleLength: cycleLen }
      }
    }

    const cycle: PeriodCycle = {
      id: `cycle-${Date.now()}`,
      startDate,
      endDate,
      length,
      cycleLength: 0,
    }
    cycles.value = [...cycles.value, cycle]
    return cycle
  }

  function deleteCycle(id: string) {
    cycles.value = cycles.value.filter((c) => c.id !== id)
  }

  const sortedCycles = computed(() => {
    return [...cycles.value].sort((a, b) => b.startDate.localeCompare(a.startDate))
  })

  const avgCycleLength = computed(() => {
    const withLength = cycles.value.filter((c) => c.cycleLength > 0)
    if (withLength.length === 0) return 28
    return Math.round(withLength.reduce((s, c) => s + c.cycleLength, 0) / withLength.length)
  })

  const avgPeriodLength = computed(() => {
    if (cycles.value.length === 0) return 5
    return Math.round(cycles.value.reduce((s, c) => s + c.length, 0) / cycles.value.length)
  })

  const nextPeriodDate = computed(() => {
    if (cycles.value.length === 0) return null
    const latest = sortedCycles.value[0]!
    const start = new Date(latest.startDate)
    start.setDate(start.getDate() + avgCycleLength.value)
    return formatDate(start)
  })

  const nextOvulationDate = computed(() => {
    if (cycles.value.length === 0) return null
    const latest = sortedCycles.value[0]!
    const start = new Date(latest.startDate)
    start.setDate(start.getDate() + avgCycleLength.value - 14)
    return formatDate(start)
  })

  function getDayPhase(dateStr: string): CyclePhase | null {
    const date = new Date(dateStr)

    // Check if in any recorded period
    for (const cycle of cycles.value) {
      const start = new Date(cycle.startDate)
      const end = new Date(cycle.endDate)
      if (date >= start && date <= end) return 'period'
    }

    // Estimate phase based on latest cycle
    if (sortedCycles.value.length === 0) return null
    const latest = sortedCycles.value[0]!
    const latestStart = new Date(latest.startDate)
    const daysSince = Math.round((date.getTime() - latestStart.getTime()) / (1000 * 60 * 60 * 24))

    if (daysSince < 0) return null
    const dayInCycle = daysSince % avgCycleLength.value

    if (dayInCycle < avgPeriodLength.value) return 'period'
    if (dayInCycle < avgCycleLength.value - 16) return 'follicular'
    if (dayInCycle < avgCycleLength.value - 12) return 'ovulation'
    return 'luteal'
  }

  // Day logs
  function saveDayLog(
    date: string,
    symptoms: SymptomType[],
    flow: FlowLevel | null,
    notes: string,
  ) {
    const idx = dayLogs.value.findIndex((l) => l.date === date)
    const log: DayLog = { date, symptoms, flow, notes }
    if (idx >= 0) {
      dayLogs.value[idx] = log
    } else {
      dayLogs.value.push(log)
    }
    dayLogs.value = [...dayLogs.value]
  }

  function getDayLog(date: string): DayLog | undefined {
    return dayLogs.value.find((l) => l.date === date)
  }

  function getSymptomStats() {
    const counts: Record<SymptomType, number> = {
      cramps: 0,
      headache: 0,
      fatigue: 0,
      bloating: 0,
      'mood-swings': 0,
      'breast-tender': 0,
      acne: 0,
      backache: 0,
      nausea: 0,
      insomnia: 0,
    }
    for (const log of dayLogs.value) {
      for (const s of log.symptoms) {
        counts[s]++
      }
    }
    return counts
  }

  function formatDate(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  return {
    cycles,
    dayLogs,
    sortedCycles,
    avgCycleLength,
    avgPeriodLength,
    nextPeriodDate,
    nextOvulationDate,
    getToday,
    addCycle,
    deleteCycle,
    getDayPhase,
    saveDayLog,
    getDayLog,
    getSymptomStats,
  }
}
