import { computed, ref } from 'vue'
import { useIntervalFn, useLocalStorage } from '@vueuse/core'

interface FocusTask {
  id: number
  title: string
  done: boolean
}

export function useFocusBoard() {
  const timerMinutes = ref(25)
  const timerActive = ref(false)
  const timerRemaining = ref(0)
  const timerDone = ref(false)

  const completedSessions = useLocalStorage('rain-clock-completed-sessions', 0)
  const totalFocusedMinutes = useLocalStorage('rain-clock-total-minutes', 0)
  const tasks = useLocalStorage<FocusTask[]>('rain-clock-tasks', [
    { id: 1, title: 'Đặt mục tiêu cho phiên tập trung', done: false },
    { id: 2, title: 'Tắt thông báo gây xao nhãng', done: false },
  ])

  const newTaskTitle = ref('')

  const doneTasksCount = computed(() => tasks.value.filter(task => task.done).length)

  const focusScore = computed(() => {
    const sessionScore = Math.min(completedSessions.value * 12, 60)
    const taskScore = tasks.value.length === 0
      ? 20
      : Math.round((doneTasksCount.value / tasks.value.length) * 40)
    return Math.min(sessionScore + taskScore, 100)
  })

  const timerDisplay = computed(() => {
    const minutes = String(Math.floor(timerRemaining.value / 60)).padStart(2, '0')
    const seconds = String(timerRemaining.value % 60).padStart(2, '0')
    return `${minutes}:${seconds}`
  })

  const timerProgress = computed(() => {
    const total = timerMinutes.value * 60
    if (total <= 0) return 0
    return ((total - timerRemaining.value) / total) * 100
  })

  function setDuration(minutes: number) {
    timerMinutes.value = minutes
  }

  function startTimer() {
    timerRemaining.value = timerMinutes.value * 60
    timerActive.value = true
    timerDone.value = false
  }

  function stopTimer() {
    timerActive.value = false
    timerRemaining.value = 0
    timerDone.value = false
  }

  function restartTimer() {
    timerDone.value = false
    startTimer()
  }

  function addTask() {
    const title = newTaskTitle.value.trim()
    if (!title) return

    tasks.value = [
      ...tasks.value,
      {
        id: Date.now(),
        title,
        done: false,
      },
    ]
    newTaskTitle.value = ''
  }

  function toggleTask(id: number) {
    tasks.value = tasks.value.map(task =>
      task.id === id
        ? { ...task, done: !task.done }
        : task
    )
  }

  function removeTask(id: number) {
    tasks.value = tasks.value.filter(task => task.id !== id)
  }

  useIntervalFn(() => {
    if (!timerActive.value || timerRemaining.value <= 0) return

    timerRemaining.value -= 1

    if (timerRemaining.value === 0) {
      timerActive.value = false
      timerDone.value = true
      completedSessions.value += 1
      totalFocusedMinutes.value += timerMinutes.value
    }
  }, 1000)

  return {
    timerMinutes,
    timerActive,
    timerRemaining,
    timerDone,
    completedSessions,
    totalFocusedMinutes,
    tasks,
    newTaskTitle,
    doneTasksCount,
    focusScore,
    timerDisplay,
    timerProgress,
    setDuration,
    startTimer,
    stopTimer,
    restartTimer,
    addTask,
    toggleTask,
    removeTask,
  }
}
