import { ref, computed, onUnmounted, onMounted, nextTick } from 'vue'
import { getRandomWords } from './wordList'
import type { GameState, WordItem, TypingRecord } from './types'
import { WORD_COUNT, HISTORY_STORAGE_KEY, HISTORY_MAX, ROW_HEIGHT_THRESHOLD } from './types'

export function useTypingGame(selectedTime: { value: number }) {
  const gameState = ref<GameState>('idle')
  const wordItems = ref<WordItem[]>([])
  const currentIndex = ref(0)
  const inputValue = ref('')
  const totalTimeSeconds = ref(60)
  const timeLeft = ref(60)
  const correctCount = ref(0)
  const incorrectCount = ref(0)
  const history = ref<TypingRecord[]>([])
  const timerStarted = ref(false)
  const inputRef = ref<HTMLInputElement | null>(null)
  const wordsContainerRef = ref<HTMLElement | null>(null)
  const wordsInnerRef = ref<HTMLElement | null>(null)

  let lastActiveWordTop = 0
  let currentScrollOffsetPx = 0
  let timer: ReturnType<typeof setInterval> | null = null

  // ─── Computed ─────────────────────────────────────────────────────────────

  const wpm = computed(() => {
    const elapsed = totalTimeSeconds.value - timeLeft.value
    if (elapsed <= 0) return 0
    return Math.round((correctCount.value / elapsed) * 60)
  })

  const accuracy = computed(() => {
    const total = correctCount.value + incorrectCount.value
    if (total === 0) return 100
    return Math.round((correctCount.value / total) * 100)
  })

  const progressPercent = computed(() => {
    const total = totalTimeSeconds.value
    if (total === 0) return 0
    return ((total - timeLeft.value) / total) * 100
  })

  const timerColor = computed(() => {
    if (timeLeft.value > 20) return 'text-accent-sky'
    if (timeLeft.value > 10) return 'text-accent-amber'
    return 'text-accent-coral'
  })

  const currentInputIsValid = computed(() => {
    if (gameState.value !== 'playing') return true
    const typed = inputValue.value
    if (!typed) return true
    const cur = wordItems.value[currentIndex.value]
    if (!cur) return true
    return cur.word.startsWith(typed)
  })

  // ─── Character styling ────────────────────────────────────────────────────

  function getCharClass(wordIdx: number, charIdx: number): string {
    const item = wordItems.value[wordIdx]
    if (!item) return 'text-text-dim'
    if (item.status === 'pending') return 'text-text-dim'
    if (item.status === 'correct') return 'text-accent-sky'
    if (item.status === 'incorrect') {
      const typedChar = item.typed[charIdx]
      if (typedChar === undefined) return 'text-accent-coral/40'
      return typedChar === item.word[charIdx] ? 'text-accent-sky/60' : 'text-accent-coral'
    }
    const typed = inputValue.value
    if (charIdx < typed.length) {
      return typed[charIdx] === item.word[charIdx] ? 'text-accent-sky' : 'text-accent-coral'
    }
    if (charIdx === typed.length) return 'char-cursor text-text-primary'
    return 'text-text-dim'
  }

  function getExtraTyped(wordIdx: number): string[] {
    const item = wordItems.value[wordIdx]
    if (!item || item.status !== 'active') return []
    const typed = inputValue.value
    if (typed.length > item.word.length) {
      return typed.slice(item.word.length).split('')
    }
    return []
  }

  // ─── Scroll ───────────────────────────────────────────────────────────────

  function maybeUpdateScrollPosition() {
    nextTick(() => {
      const inner = wordsInnerRef.value
      const activeWordEl = wordsContainerRef.value?.querySelector<HTMLElement>('.word-active')
      if (!inner || !activeWordEl) return

      inner.style.transition = 'none'
      inner.style.transform = 'translateY(0)'

      requestAnimationFrame(() => {
        const wordTop = activeWordEl.offsetTop
        const isNewLine = wordTop > lastActiveWordTop + ROW_HEIGHT_THRESHOLD
        lastActiveWordTop = wordTop

        if (!isNewLine) {
          inner.style.transform = `translateY(-${currentScrollOffsetPx}px)`
          return
        }

        const wordHeight = activeWordEl.offsetHeight
        const rowWithGap = wordHeight + 14
        const targetOffset = Math.max(0, wordTop - rowWithGap)
        currentScrollOffsetPx = targetOffset

        inner.style.transition = 'transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        inner.style.transform = `translateY(-${targetOffset}px)`
      })
    })
  }

  // ─── Game logic ───────────────────────────────────────────────────────────

  function initGame() {
    const ws = getRandomWords(WORD_COUNT)
    wordItems.value = ws.map((w, i) => ({
      word: w,
      status: i === 0 ? 'active' : 'pending',
      typed: '',
    }))
    currentIndex.value = 0
    inputValue.value = ''
    timeLeft.value = selectedTime.value
    totalTimeSeconds.value = selectedTime.value
    correctCount.value = 0
    incorrectCount.value = 0
    timerStarted.value = false
    lastActiveWordTop = 0
    currentScrollOffsetPx = 0
    if (wordsInnerRef.value) {
      wordsInnerRef.value.style.transition = 'none'
      wordsInnerRef.value.style.transform = 'translateY(0)'
    }
  }

  function startTimer() {
    if (timer) return
    timer = setInterval(() => {
      timeLeft.value--
      if (timeLeft.value <= 0) endGame()
    }, 1000)
  }

  function startGame() {
    initGame()
    gameState.value = 'playing'
    nextTick(() => {
      inputRef.value?.focus()
      const activeEl = wordsContainerRef.value?.querySelector<HTMLElement>('.word-active')
      if (activeEl) lastActiveWordTop = activeEl.offsetTop
    })
  }

  function endGame() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
    gameState.value = 'finished'
    saveRecord()
  }

  function restartGame() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
    gameState.value = 'idle'
    initGame()
  }

  // ─── History ──────────────────────────────────────────────────────────────

  function loadHistory() {
    try {
      const raw = localStorage.getItem(HISTORY_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as TypingRecord[]
        history.value = Array.isArray(parsed) ? parsed.slice(0, HISTORY_MAX) : []
      }
    } catch {
      history.value = []
    }
  }

  function formatRecordDate(iso: string): string {
    const d = new Date(iso)
    const now = new Date()
    const sameDay =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    if (sameDay) {
      return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    }
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function saveRecord() {
    const total = correctCount.value + incorrectCount.value
    if (total === 0) return
    const record: TypingRecord = {
      wpm: wpm.value,
      accuracy: accuracy.value,
      correct: correctCount.value,
      incorrect: incorrectCount.value,
      durationSeconds: totalTimeSeconds.value,
      date: new Date().toISOString(),
    }
    const next = [record, ...history.value].slice(0, HISTORY_MAX)
    history.value = next
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next))
    } catch {
      // ignore
    }
  }

  // ─── Input ────────────────────────────────────────────────────────────────

  function onInput(e: Event) {
    if (gameState.value !== 'playing') return
    const val = (e.target as HTMLInputElement).value

    if (!timerStarted.value && val.length > 0) {
      timerStarted.value = true
      startTimer()
    }

    if (val.endsWith(' ')) {
      const typed = val.trim()
      const current = wordItems.value[currentIndex.value]
      if (!current) return

      current.typed = typed
      if (typed === current.word) {
        current.status = 'correct'
        correctCount.value++
      } else {
        current.status = 'incorrect'
        incorrectCount.value++
      }

      const nextIdx = currentIndex.value + 1
      if (nextIdx >= wordItems.value.length) {
        endGame()
        return
      }
      const nextWord = wordItems.value[nextIdx]
      if (!nextWord) return
      nextWord.status = 'active'
      currentIndex.value = nextIdx
      inputValue.value = ''
      maybeUpdateScrollPosition()
      return
    }

    inputValue.value = val
  }

  onMounted(loadHistory)
  onUnmounted(() => {
    if (timer) clearInterval(timer)
  })

  return {
    gameState,
    wordItems,
    currentIndex,
    inputValue,
    totalTimeSeconds,
    timeLeft,
    correctCount,
    incorrectCount,
    history,
    timerStarted,
    inputRef,
    wordsContainerRef,
    wordsInnerRef,
    wpm,
    accuracy,
    progressPercent,
    timerColor,
    currentInputIsValid,
    getCharClass,
    getExtraTyped,
    startGame,
    endGame,
    restartGame,
    onInput,
    formatRecordDate,
    WORD_COUNT,
  }
}
