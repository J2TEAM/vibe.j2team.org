import { useLocalStorage } from '@vueuse/core'
import { computed } from 'vue'
import type { BadgeId, QuizRecord, UserProgress } from '../data/types'
import { LEVELS } from '../data/types'
import { badges } from '../data/badges'

const STORAGE_KEY = 'golingduo-progress'

const defaultProgress: UserProgress = {
  learnedIds: [],
  quizScores: [],
  streak: { current: 0, longest: 0, lastActiveDate: '' },
  xp: 0,
  unlockedBadges: [],
  spinHistory: [],
}

export function useProgress() {
  const progress = useLocalStorage<UserProgress>(STORAGE_KEY, { ...defaultProgress })

  const today = () => new Date().toISOString().slice(0, 10)

  function updateStreak() {
    const t = today()
    const last = progress.value.streak.lastActiveDate
    if (last === t) return

    const lastDate = last ? new Date(last) : null
    const todayDate = new Date(t)
    const diffMs = lastDate ? todayDate.getTime() - lastDate.getTime() : 0
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      progress.value.streak.current += 1
    } else if (diffDays > 1 || !lastDate) {
      progress.value.streak.current = 1
    }

    progress.value.streak.longest = Math.max(
      progress.value.streak.longest,
      progress.value.streak.current,
    )
    progress.value.streak.lastActiveDate = t
  }

  function addXp(amount: number) {
    progress.value.xp += amount
    updateStreak()
    checkBadges()
  }

  function markLearned(idiomId: string) {
    if (!progress.value.learnedIds.includes(idiomId)) {
      progress.value.learnedIds.push(idiomId)
      addXp(10)
    }
  }

  function unmarkLearned(idiomId: string) {
    const idx = progress.value.learnedIds.indexOf(idiomId)
    if (idx !== -1) {
      progress.value.learnedIds.splice(idx, 1)
    }
  }

  function addQuizScore(record: QuizRecord) {
    progress.value.quizScores.push(record)
    const { score, total } = record
    const ratio = score / total
    let xp = 10
    if (ratio === 1) xp = 100
    else if (ratio >= 0.7) xp = 60
    else if (ratio >= 0.4) xp = 30
    addXp(xp)
  }

  function addSpinHistory(idiomId: string) {
    progress.value.spinHistory.push(idiomId)
    addXp(5)
  }

  function checkBadges(): BadgeId[] {
    const newBadges: BadgeId[] = []
    for (const badge of badges) {
      if (!progress.value.unlockedBadges.includes(badge.id) && badge.condition(progress.value)) {
        progress.value.unlockedBadges.push(badge.id)
        newBadges.push(badge.id)
      }
    }
    return newBadges
  }

  const currentLevel = computed(() => {
    const xp = progress.value.xp
    let level: (typeof LEVELS)[number] = LEVELS[0]
    for (const l of LEVELS) {
      if (xp >= l.min) level = l
    }
    return level
  })

  const nextLevel = computed(() => {
    const xp = progress.value.xp
    for (const l of LEVELS) {
      if (xp < l.min) return l
    }
    return null
  })

  const isLearned = (idiomId: string) => progress.value.learnedIds.includes(idiomId)

  function resetProgress() {
    progress.value = { ...defaultProgress }
  }

  return {
    progress,
    addXp,
    markLearned,
    unmarkLearned,
    addQuizScore,
    addSpinHistory,
    checkBadges,
    currentLevel,
    nextLevel,
    isLearned,
    resetProgress,
    updateStreak,
  }
}
