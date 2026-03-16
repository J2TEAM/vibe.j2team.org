import { defineStore } from 'pinia'

export interface DailyLog {
  date: string
  weight: number
  calories: number
  activityFactor: number
}

export const useTdeeStore = defineStore('tdee-editorial', {
  state: () => ({
    // Load dữ liệu từ LocalStorage
    logs: JSON.parse(localStorage.getItem('greg_tdee_data') || '[]') as DailyLog[],
  }),

  getters: {
    // 1. Sắp xếp và lọc dữ liệu trong vòng 3 tháng
    sortedLogs(state): DailyLog[] {
      if (!state.logs || state.logs.length === 0) return []

      const threeMonthsAgo = new Date()
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

      return [...state.logs]
        .filter((log) => log && log.date && new Date(log.date) >= threeMonthsAgo)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    },

    // 2. Tính cân nặng trung bình (Tất cả log hiện có)
    avgWeight(): number {
      const sorted = this.sortedLogs
      if (sorted.length === 0) return 0
      const sum = sorted.reduce((acc, curr) => acc + (Number(curr.weight) || 0), 0)
      return sum / sorted.length
    },

    // 3. Tính TDEE thích nghi (Dựa trên biến động 7 ngày gần nhất)
    weeklyTdee(): number | null {
      const sorted = this.sortedLogs
      if (sorted.length < 2) return null

      const recent = sorted.slice(-7)
      const start = new Date(recent[0]!.date)
      const end = new Date(recent[recent.length - 1]!.date)
      const daysDiff = (end.getTime() - start.getTime()) / (1000 * 3600 * 24)

      if (daysDiff <= 0) return null

      const weightDiff = Number(recent[recent.length - 1]!.weight) - Number(recent[0]!.weight)
      const avgConsumed =
        recent.reduce((acc, curr) => acc + (Number(curr.calories) || 0), 0) / recent.length

      // Công thức: TDEE = Calo nạp vào - (Biến động cân nặng * 7700 / số ngày)
      const dailyEnergyAdjustment = (weightDiff * 7700) / daysDiff
      return Math.round(avgConsumed - dailyEnergyAdjustment)
    },

    // 4. Tính toán chênh lệch 2 tuần gần nhất (Theo công thức yêu cầu)
    weightTrend(): { currentWeekAvg: number; lastWeekAvg: number; diff: number } {
      const sorted = this.sortedLogs
      const defaultVal = { currentWeekAvg: 0, lastWeekAvg: 0, diff: 0 }

      if (sorted.length < 2) return defaultVal

      const firstDate = new Date(sorted[0]!.date)
      const lastDate = new Date(sorted[sorted.length - 1]!.date)

      // Công thức tính ngày: (Ngày cuối - Ngày đầu + 1)
      const totalDays =
        Math.floor((lastDate.getTime() - firstDate.getTime()) / (1000 * 3600 * 24)) + 1

      // Tính index tuần: lấy phần nguyên của (totalDays)/7 - 1
      const currentWeekIndex = Math.floor(totalDays / 7) - 1

      const getWeekAvg = (weekIdx: number) => {
        if (weekIdx < 0) return 0

        const startDayOffset = weekIdx * 7
        const endDayOffset = startDayOffset + 6

        const weekStart = new Date(firstDate)
        weekStart.setDate(firstDate.getDate() + startDayOffset)

        const weekEnd = new Date(firstDate)
        weekEnd.setDate(firstDate.getDate() + endDayOffset)

        const weekLogs = sorted.filter((l) => {
          const d = new Date(l.date)
          return d >= weekStart && d <= weekEnd
        })

        if (weekLogs.length === 0) return 0
        return weekLogs.reduce((acc, curr) => acc + Number(curr.weight), 0) / weekLogs.length
      }

      const currentWeekAvg = getWeekAvg(currentWeekIndex)
      const lastWeekAvg = getWeekAvg(currentWeekIndex - 1)

      // Nếu không có dữ liệu tuần trước, diff = 0
      const diff = lastWeekAvg > 0 ? currentWeekAvg - lastWeekAvg : 0

      return { currentWeekAvg, lastWeekAvg, diff }
    },

    // 5. Đếm số ngày thiếu trong 7 ngày gần nhất
    missingDaysCount(): number {
      const sorted = this.sortedLogs
      if (sorted.length < 2) return 0

      const latest = new Date(sorted[sorted.length - 1]!.date)
      const sevenDaysAgo = new Date(latest)
      sevenDaysAgo.setDate(latest.getDate() - 6)

      let missing = 0
      for (let d = new Date(sevenDaysAgo); d <= latest; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0] ?? ''
        if (!sorted.find((l) => l.date === dateStr)) missing++
      }
      return missing
    },
    latestWeight(): number {
      const sorted = this.sortedLogs
      return sorted.length > 0 ? sorted[sorted.length - 1]!.weight : 0
    },

    // Hàm hỗ trợ lọc dữ liệu theo số ngày (7, 30, 90)
    filteredLogs: (state) => (days: number) => {
      const sorted = [...state.logs].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      )
      if (days === 0) return sorted.slice(-90) // Mặc định tối đa 90

      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - days)
      return sorted.filter((log) => new Date(log.date) >= cutoff)
    },
  },

  actions: {
    addLog(log: DailyLog) {
      // Ép kiểu chắc chắn là Number để tránh lỗi cộng chuỗi hoặc NaN
      const cleanLog = {
        date: log.date,
        weight: Number(log.weight) || 0,
        calories: Number(log.calories) || 0,
        activityFactor: Number(log.activityFactor) || 1.2,
      }

      const index = this.logs.findIndex((l) => l.date === cleanLog.date)
      if (index !== -1) {
        this.logs[index] = cleanLog
      } else {
        this.logs.push(cleanLog)
      }

      localStorage.setItem('greg_tdee_data', JSON.stringify(this.logs))
    },

    deleteLog(date: string) {
      this.logs = this.logs.filter((l) => l.date !== date)
      localStorage.setItem('greg_tdee_data', JSON.stringify(this.logs))
    },

    clearData() {
      if (confirm('Xóa toàn bộ lịch sử dữ liệu?')) {
        this.logs = []
        localStorage.removeItem('greg_tdee_data')
        window.location.reload()
      }
    },
  },
})
