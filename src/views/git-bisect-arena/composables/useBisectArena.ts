import { computed, ref, watch } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import type { BisectLevel, CommitStatus, Difficulty } from '../types'

const LEVELS: BisectLevel[] = [
  {
    id: 1,
    name: 'First Bug Hunt',
    difficulty: 'easy',
    commitCount: 7,
    badCommit: 5,
    untestable: [],
    description: '7 commit tuyến tính. Tìm commit đầu tiên gây lỗi.',
    hint: 'Bắt đầu từ commit giữa để giảm số bước.',
  },
  {
    id: 2,
    name: 'Bigger Timeline',
    difficulty: 'easy',
    commitCount: 15,
    badCommit: 11,
    untestable: [],
    description: '15 commit với tín hiệu pass/fail ổn định.',
    hint: 'Giữ chiến thuật chia đôi thay vì đoán ngẫu nhiên.',
  },
  {
    id: 3,
    name: 'Sharp Split',
    difficulty: 'easy',
    commitCount: 31,
    badCommit: 18,
    untestable: [],
    description: 'Độ dài lịch sử tăng mạnh, cần tối ưu số lượt test.',
    hint: 'Nhìn dải nghi vấn hiện tại rồi test điểm giữa.',
  },
  {
    id: 4,
    name: 'One Broken Build',
    difficulty: 'easy',
    commitCount: 31,
    badCommit: 24,
    untestable: [13],
    description: 'Một commit không thể test được vì build hỏng.',
    hint: 'Nếu gặp SKIP, quay lại commit giữa bên trái hoặc phải.',
  },
  {
    id: 5,
    name: 'Skipped Islands',
    difficulty: 'medium',
    commitCount: 63,
    badCommit: 40,
    untestable: [12, 33, 52],
    description: 'Nhiều commit skip rải rác làm nhiễu quá trình khoanh vùng.',
    hint: 'Ưu tiên commit gần midpoint nhưng vẫn test được.',
  },
  {
    id: 6,
    name: 'Narrow Corridor',
    difficulty: 'medium',
    commitCount: 63,
    badCommit: 27,
    untestable: [9, 10, 11],
    description: 'Một cụm commit liền nhau không test được.',
    hint: 'Đừng mắc kẹt trong cụm SKIP, hãy đổi hướng test.',
  },
  {
    id: 7,
    name: 'Late Regression',
    difficulty: 'medium',
    commitCount: 95,
    badCommit: 71,
    untestable: [49, 50],
    description: 'Bug xuất hiện khá muộn trong lịch sử commit.',
    hint: 'Nếu nhiều lần PASS, hãy đẩy thấp cận trái lên nhanh.',
  },
  {
    id: 8,
    name: 'Noisy Middle',
    difficulty: 'medium',
    commitCount: 95,
    badCommit: 58,
    untestable: [44, 45, 46, 47],
    description: 'Vùng giữa có chuỗi commit không test được.',
    hint: 'Tận dụng thông tin từ hai phía của vùng giữa.',
  },
  {
    id: 9,
    name: 'Long History',
    difficulty: 'hard',
    commitCount: 127,
    badCommit: 64,
    untestable: [31, 32, 33, 34, 35],
    description: 'Lịch sử dài và có block SKIP lớn gần vùng trọng tâm.',
    hint: 'Đừng test dàn trải. Mỗi lượt cần giảm dải nghi vấn rõ rệt.',
  },
  {
    id: 10,
    name: 'Shifting Window',
    difficulty: 'hard',
    commitCount: 127,
    badCommit: 91,
    untestable: [70, 71, 72, 90],
    description: 'Vùng gần culprit chứa nhiều commit khó test.',
    hint: 'Khi cận phải đã gần, cần test chính xác để chốt nhanh.',
  },
  {
    id: 11,
    name: 'Dense Chaos',
    difficulty: 'hard',
    commitCount: 127,
    badCommit: 102,
    untestable: [48, 49, 50, 66, 67, 68, 69, 84],
    description: 'Nhiều cụm SKIP khiến lựa chọn midpoint thường thất bại.',
    hint: 'Tìm commit test được gần midpoint nhất.',
  },
  {
    id: 12,
    name: 'Arena Finale',
    difficulty: 'hard',
    commitCount: 127,
    badCommit: 73,
    untestable: [24, 25, 26, 62, 63, 74, 75, 76, 109],
    description: 'Màn cuối tổng hợp lịch sử dài, nhiều SKIP và bẫy quyết định.',
    hint: 'Chỉ tố cáo khi phạm vi nghi vấn đã thu hẹp đủ nhỏ.',
  },
]

const toleranceByDifficulty: Record<Difficulty, number> = {
  easy: 2,
  medium: 3,
  hard: 4,
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function formatCommit(index: number) {
  return `C${index.toString().padStart(3, '0')}`
}

export function useBisectArena() {
  const levelIndex = ref(0)
  const selectedCommit = ref<number | null>(null)
  const attempts = ref(0)
  const solved = ref(false)
  const stars = ref(0)
  const candidateStart = ref(1)
  const candidateEnd = ref(1)
  const testedStatuses = ref<Record<number, CommitStatus>>({})
  const logs = ref<string[]>([])

  const unlockedUpTo = useLocalStorage<number>('git-bisect-arena-unlocked-up-to', 1)
  const bestAttempts = useLocalStorage<Record<string, number>>(
    'git-bisect-arena-best-attempts',
    {},
  )
  const bestStars = useLocalStorage<Record<string, number>>('git-bisect-arena-best-stars', {})

  const levels = LEVELS

  const currentLevel = computed(() => levels[levelIndex.value] ?? levels[0]!)

  const currentPar = computed(() => Math.ceil(Math.log2(currentLevel.value.commitCount)))

  const maxUnlockedIndex = computed(() => clamp(unlockedUpTo.value - 1, 0, levels.length - 1))

  const canGoPrev = computed(() => levelIndex.value > 0)

  const canGoNext = computed(() => levelIndex.value < maxUnlockedIndex.value)

  const hasNextLevel = computed(() => levelIndex.value < levels.length - 1)

  const levelKey = computed(() => `level-${currentLevel.value.id}`)

  const bestAttemptForCurrent = computed(() => bestAttempts.value[levelKey.value])

  const bestStarsForCurrent = computed(() => bestStars.value[levelKey.value] ?? 0)

  const remainingCandidates = computed(() => {
    const remaining = candidateEnd.value - candidateStart.value + 1
    return remaining > 0 ? remaining : 0
  })

  const testedCommitsCount = computed(() => Object.keys(testedStatuses.value).length)

  const suggestedCommit = computed(() => {
    if (solved.value || candidateStart.value > candidateEnd.value) {
      return null
    }

    const midpoint = Math.floor((candidateStart.value + candidateEnd.value) / 2)
    const level = currentLevel.value

    if (!level.untestable.includes(midpoint)) {
      return midpoint
    }

    for (let offset = 1; offset <= level.commitCount; offset += 1) {
      const left = midpoint - offset
      const right = midpoint + offset

      if (
        left >= candidateStart.value &&
        left <= candidateEnd.value &&
        !level.untestable.includes(left)
      ) {
        return left
      }

      if (
        right >= candidateStart.value &&
        right <= candidateEnd.value &&
        !level.untestable.includes(right)
      ) {
        return right
      }
    }

    return null
  })

  function appendLog(message: string) {
    logs.value = [`• ${message}`, ...logs.value].slice(0, 24)
  }

  function resetLevel() {
    const level = currentLevel.value

    selectedCommit.value = Math.floor(level.commitCount / 2)
    attempts.value = 0
    solved.value = false
    stars.value = 0
    candidateStart.value = 1
    candidateEnd.value = level.commitCount
    testedStatuses.value = {}
    logs.value = []

    appendLog(`Màn ${level.id} bắt đầu: ${level.name}`)
    appendLog(`Phạm vi nghi vấn: ${formatCommit(1)} -> ${formatCommit(level.commitCount)}`)
  }

  function getStatus(index: number): CommitStatus {
    return testedStatuses.value[index] ?? 'unknown'
  }

  function isUntestable(index: number) {
    return currentLevel.value.untestable.includes(index)
  }

  function markStatus(index: number, status: CommitStatus) {
    testedStatuses.value[index] = status
  }

  function logRange() {
    appendLog(
      `Phạm vi hiện tại: ${formatCommit(candidateStart.value)} -> ${formatCommit(candidateEnd.value)}`,
    )
  }

  function testCommit(index: number) {
    const level = currentLevel.value

    if (index < 1 || index > level.commitCount) {
      return
    }

    selectedCommit.value = index

    if (solved.value) {
      appendLog('Màn đã hoàn thành. Hãy sang màn mới hoặc reset để chơi lại.')
      return
    }

    const existing = testedStatuses.value[index]
    if (existing) {
      appendLog(`${formatCommit(index)} đã được test trước đó (${existing.toUpperCase()}).`)
      return
    }

    attempts.value += 1

    if (isUntestable(index)) {
      markStatus(index, 'skip')
      appendLog(`${formatCommit(index)}: SKIP (build lỗi, không thể chạy test).`)
      return
    }

    if (index < level.badCommit) {
      markStatus(index, 'pass')
      candidateStart.value = Math.max(candidateStart.value, index + 1)
      appendLog(`${formatCommit(index)}: PASS`)
    } else {
      markStatus(index, 'fail')
      candidateEnd.value = Math.min(candidateEnd.value, index)
      appendLog(`${formatCommit(index)}: FAIL`)
    }

    logRange()

    if (candidateStart.value === candidateEnd.value) {
      appendLog(`Đã khoanh vùng còn 1 commit: ${formatCommit(candidateStart.value)}.`)
    }
  }

  function calculateStars(nextAttempts: number) {
    const basePar = currentPar.value
    const skipBuffer = Math.floor(currentLevel.value.untestable.length / 2)
    const tolerance = toleranceByDifficulty[currentLevel.value.difficulty]

    const threeStarsThreshold = basePar + tolerance + skipBuffer
    const twoStarsThreshold = threeStarsThreshold + 3

    if (nextAttempts <= threeStarsThreshold) {
      return 3
    }

    if (nextAttempts <= twoStarsThreshold) {
      return 2
    }

    return 1
  }

  function unlockNextLevel() {
    const nextUnlock = Math.min(currentLevel.value.id + 1, levels.length)
    if (nextUnlock > unlockedUpTo.value) {
      unlockedUpTo.value = nextUnlock
    }
  }

  function updateBestResult(nextAttempts: number, nextStars: number) {
    const key = levelKey.value
    const previousAttempts = bestAttempts.value[key]
    const previousStars = bestStars.value[key] ?? 0

    if (previousAttempts === undefined || nextAttempts < previousAttempts) {
      bestAttempts.value = {
        ...bestAttempts.value,
        [key]: nextAttempts,
      }
    }

    if (nextStars > previousStars) {
      bestStars.value = {
        ...bestStars.value,
        [key]: nextStars,
      }
    }
  }

  function accuseCommit(index: number) {
    const level = currentLevel.value

    if (index < 1 || index > level.commitCount || solved.value) {
      return false
    }

    selectedCommit.value = index
    attempts.value += 1

    if (index === level.badCommit) {
      solved.value = true
      stars.value = calculateStars(attempts.value)
      unlockNextLevel()
      updateBestResult(attempts.value, stars.value)

      appendLog(
        `Chính xác! ${formatCommit(index)} là commit đầu tiên gây lỗi. Bạn nhận ${stars.value} sao.`,
      )
      return true
    }

    appendLog(`Sai rồi: ${formatCommit(index)} không phải culprit commit.`)
    return false
  }

  function accuseSelectedCommit() {
    if (selectedCommit.value === null) {
      appendLog('Hãy chọn commit trước khi tố cáo.')
      return false
    }

    return accuseCommit(selectedCommit.value)
  }

  function goToLevel(index: number) {
    const bounded = clamp(index, 0, levels.length - 1)
    if (bounded > maxUnlockedIndex.value) {
      appendLog('Màn này chưa mở khóa.')
      return false
    }

    levelIndex.value = bounded
    return true
  }

  function nextLevel() {
    if (!canGoNext.value) {
      return false
    }

    levelIndex.value += 1
    return true
  }

  function prevLevel() {
    if (!canGoPrev.value) {
      return false
    }

    levelIndex.value -= 1
    return true
  }

  function resetProgress() {
    unlockedUpTo.value = 1
    bestAttempts.value = {}
    bestStars.value = {}
    levelIndex.value = 0
    resetLevel()
    appendLog('Đã reset toàn bộ tiến trình.')
  }

  watch(levelIndex, () => {
    resetLevel()
  }, { immediate: true })

  return {
    levels,
    levelIndex,
    currentLevel,
    currentPar,
    maxUnlockedIndex,
    canGoPrev,
    canGoNext,
    hasNextLevel,
    selectedCommit,
    attempts,
    solved,
    stars,
    candidateStart,
    candidateEnd,
    testedStatuses,
    logs,
    remainingCandidates,
    testedCommitsCount,
    suggestedCommit,
    bestAttemptForCurrent,
    bestStarsForCurrent,
    getStatus,
    isUntestable,
    testCommit,
    accuseCommit,
    accuseSelectedCommit,
    goToLevel,
    nextLevel,
    prevLevel,
    resetLevel,
    resetProgress,
    formatCommit,
  }
}
