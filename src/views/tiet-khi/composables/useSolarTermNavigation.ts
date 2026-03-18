import { ref, computed, watch } from 'vue'
import type { Ref } from 'vue'
import type { SolarTerm } from '../types'

/**
 * Composable quản lý logic điều hướng, tìm kiếm, lọc cho 24 Tiết Khí.
 * Tách logic khỏi index.vue để giữ component gọn gàng.
 */
export function useSolarTermNavigation(solarTerms: Ref<SolarTerm[]>) {
  const searchQuery = ref('')
  const selectedSeason = ref<string | null>(null)
  const selectedDate = ref(new Date().toISOString().slice(0, 10))
  const selectedTermIndex = ref(-1)

  // Ngày hiện tại dạng "MM-DD" theo date đã chọn
  const currentMonthDay = computed(() => {
    if (selectedDate.value) return selectedDate.value.slice(5)
    return new Date().toISOString().slice(5, 10)
  })

  // Tiết khí đang active (theo ngày chọn hoặc user click)
  const activeTermIndex = computed({
    get: () => {
      if (selectedTermIndex.value !== -1) return selectedTermIndex.value
      const target = currentMonthDay.value
      let bestIndex = -1
      const sorted = [...solarTerms.value].sort((a, b) => a.approxDate.localeCompare(b.approxDate))
      for (let i = 0; i < sorted.length; i++) {
        const term = sorted[i]
        if (term && term.approxDate <= target) bestIndex = i
      }
      if (bestIndex === -1) bestIndex = sorted.length - 1
      const activeTermRaw = sorted[bestIndex]
      return solarTerms.value.findIndex((t) => t.id === (activeTermRaw?.id || ''))
    },
    set: (val) => {
      selectedTermIndex.value = val
    },
  })

  // Mùa hiện tại
  const currentSeason = computed(() => {
    const index = activeTermIndex.value
    if (index !== -1 && solarTerms.value[index]) return solarTerms.value[index].season
    return 'Xuân'
  })

  // Countdown đến tiết khí tiếp theo
  const nextTermCountdown = computed(() => {
    const target = currentMonthDay.value
    const sorted = [...solarTerms.value].sort((a, b) => a.approxDate.localeCompare(b.approxDate))
    let next = sorted.find((t) => t.approxDate > target)
    if (!next) next = sorted[0]

    if (!next) return ''

    const dateParts = next.approxDate.split('-').map(Number)
    const m = dateParts[0]
    const d = dateParts[1]

    if (m === undefined || d === undefined) return ''

    const now = new Date()
    const year = now.getFullYear()
    const nextDate = new Date(year, m - 1, d)
    if (nextDate < now) nextDate.setFullYear(year + 1)

    const diffTime = Math.abs(nextDate.getTime() - now.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return `Còn ${diffDays} ngày nữa là đến Tiết ${next.name}`
  })

  // Danh sách đã lọc theo search + season
  const filteredTerms = computed(() => {
    return solarTerms.value.filter((term) => {
      const matchesSearch =
        term.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        term.translation.toLowerCase().includes(searchQuery.value.toLowerCase())
      const matchesSeason = !selectedSeason.value || term.season === selectedSeason.value
      return matchesSearch && matchesSeason
    })
  })

  // Chọn tiết khí từ SolarWheel hoặc click
  const handleTermSelect = (index: number) => {
    activeTermIndex.value = index
    const term = solarTerms.value[index]
    if (term) {
      const el = document.getElementById(`term-${term.id}`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  // Màu theo mùa
  const getSeasonColor = (season: string) => {
    switch (season) {
      case 'Xuân':
        return 'from-emerald-500/20 to-green-500/20 text-emerald-400 border-emerald-500/30'
      case 'Hạ':
        return 'from-orange-500/20 to-red-500/20 text-orange-400 border-orange-500/30'
      case 'Thu':
        return 'from-amber-600/20 to-orange-600/20 text-amber-400 border-amber-600/30'
      case 'Đông':
        return 'from-blue-500/20 to-cyan-500/20 text-blue-400 border-blue-500/30'
      default:
        return 'from-white/10 to-white/5 text-white border-white/10'
    }
  }

  // Cập nhật document title theo tiết khí đang active
  watch(
    () => activeTermIndex.value,
    (newIdx) => {
      const term = solarTerms.value[newIdx]
      if (term) {
        document.title = `${term.name} - ${term.translation} | Nhân Gian Tiết Khí`
      }
    },
    { immediate: true },
  )

  return {
    searchQuery,
    selectedSeason,
    selectedDate,
    currentMonthDay,
    activeTermIndex,
    currentSeason,
    nextTermCountdown,
    filteredTerms,
    handleTermSelect,
    getSeasonColor,
  }
}
