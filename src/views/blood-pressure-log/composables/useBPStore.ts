import { computed } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import type { BPReading, BPCategory } from '../types'
import { classifyBP } from '../types'

export function useBPStore() {
  const readings = useLocalStorage<BPReading[]>('blood-pressure-readings', [])

  function addReading(
    systolic: number,
    diastolic: number,
    heartRate: number,
    note: string,
    date?: string,
    time?: string,
  ) {
    const now = new Date()
    const reading: BPReading = {
      id: `bp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      date: date ?? now.toISOString().split('T')[0]!,
      time:
        time ??
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
      systolic,
      diastolic,
      heartRate,
      note,
      category: classifyBP(systolic, diastolic),
      createdAt: Date.now(),
    }
    readings.value = [reading, ...readings.value]
    return reading
  }

  function deleteReading(id: string) {
    readings.value = readings.value.filter((r) => r.id !== id)
  }

  const sortedReadings = computed(() => {
    return [...readings.value].sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date)
      if (dateCompare !== 0) return dateCompare
      return b.time.localeCompare(a.time)
    })
  })

  function getReadingsInRange(days: number): BPReading[] {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    const cutoffStr = cutoff.toISOString().split('T')[0]!
    return sortedReadings.value.filter((r) => r.date >= cutoffStr)
  }

  function getStats(days?: number) {
    const data = days ? getReadingsInRange(days) : readings.value
    if (data.length === 0) {
      return {
        count: 0,
        avgSystolic: 0,
        avgDiastolic: 0,
        avgHeartRate: 0,
        minSystolic: 0,
        maxSystolic: 0,
        minDiastolic: 0,
        maxDiastolic: 0,
      }
    }

    const count = data.length
    const sumSys = data.reduce((s, r) => s + r.systolic, 0)
    const sumDia = data.reduce((s, r) => s + r.diastolic, 0)
    const sumHR = data.reduce((s, r) => s + r.heartRate, 0)

    return {
      count,
      avgSystolic: Math.round(sumSys / count),
      avgDiastolic: Math.round(sumDia / count),
      avgHeartRate: Math.round(sumHR / count),
      minSystolic: Math.min(...data.map((r) => r.systolic)),
      maxSystolic: Math.max(...data.map((r) => r.systolic)),
      minDiastolic: Math.min(...data.map((r) => r.diastolic)),
      maxDiastolic: Math.max(...data.map((r) => r.diastolic)),
    }
  }

  function getCategoryDistribution(days?: number): Record<BPCategory, number> {
    const data = days ? getReadingsInRange(days) : readings.value
    const dist: Record<BPCategory, number> = {
      low: 0,
      normal: 0,
      elevated: 0,
      high1: 0,
      high2: 0,
      crisis: 0,
    }
    for (const r of data) dist[r.category]++
    return dist
  }

  function getChartData(days: number) {
    const data = getReadingsInRange(days)
    return [...data].reverse()
  }

  return {
    readings,
    sortedReadings,
    addReading,
    deleteReading,
    getReadingsInRange,
    getStats,
    getCategoryDistribution,
    getChartData,
  }
}
