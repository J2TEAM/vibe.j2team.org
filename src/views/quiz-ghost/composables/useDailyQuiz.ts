import { ref, computed, onMounted, watch } from 'vue'

const API_URL = 'https://script.google.com/macros/s/AKfycbwUU-wsgQtys3V_E-9X8IS6DlMfV4aSfJxpCef5xWayTR1nIBVAp74u3xJe6AAVviXFBA/exec'

export interface QuizState<TGuess = unknown> {
  guesses: TGuess[][] 
  status: ('playing' | 'won' | 'lost')[]
  serverHints: string[][] 
}

export function useDailyQuiz<TQuestion extends { id: string }, TGuess = unknown>(
  mode: string,
  limit = 5
) {
  const todayStr = new Date().toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
  const storageKey = `quiz-ghost-api-${mode}-${todayStr}`

  const questions = ref<TQuestion[]>([])
  const options = ref<string[]>([])
  
  const guesses = ref<TGuess[][]>([])
  const status = ref<('playing' | 'won' | 'lost')[]>([])
  const serverHints = ref<string[][]>([])
  
  const isLoading = ref(true)
  const isGuessing = ref(false)
  const isError = ref(false)
  const currentQ = ref(0) // Now managed via state

  onMounted(async () => {
    // 1. Load from storage
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      try {
        const parsed: QuizState<TGuess> = JSON.parse(saved)
        guesses.value = parsed.guesses || Array.from({ length: limit }, () => [])
        status.value = parsed.status || Array.from({ length: limit }, () => 'playing')
        serverHints.value = parsed.serverHints || Array.from({ length: limit }, () => [])
      } catch {
        initEmptyState(limit)
      }
    } else {
      initEmptyState(limit)
    }

    // 2. Fetch today's questions and options
    try {
      isLoading.value = true
      
      const res = await fetch(`${API_URL}?mode=${mode}`)
      if (!res.ok) throw new Error('API Error')
      const data = await res.json()
      
      if (data.error) throw new Error(data.error)
      
      if (Array.isArray(data)) {
        questions.value = data
        options.value = data.map(q => q.name)
      } else {
        questions.value = data.questions || []
        options.value = data.options || []
      }

      if (questions.value.length === 0) {
        throw new Error('Không có câu hỏi nào được trả về từ Server.')
      }
      
      // Determine initial currentQ (first unbroken question, or last if all done)
      const firstIncomplete = status.value.findIndex(s => s === 'playing')
      currentQ.value = firstIncomplete === -1 ? limit - 1 : firstIncomplete
      
    } catch (err) {
      console.error(err)
      isError.value = true
    } finally {
      isLoading.value = false
    }
  })

  function initEmptyState(limit: number) {
    guesses.value = Array.from({ length: limit }, () => [])
    status.value = Array.from({ length: limit }, () => 'playing')
    serverHints.value = Array.from({ length: limit }, () => [])
  }

  // Persist state
  watch([guesses, status, serverHints], () => {
    if (guesses.value.length === 0) return
    localStorage.setItem(storageKey, JSON.stringify({
      guesses: guesses.value,
      status: status.value,
      serverHints: serverHints.value
    }))
  }, { deep: true })

  const addGuessAsync = async (qIndex: number, guessValue: string) => {
    if (status.value[qIndex] !== 'playing') return
    if (!questions.value[qIndex]) return
    
    isGuessing.value = true
    
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8' 
        },
        body: JSON.stringify({
          mode,
          targetId: questions.value[qIndex].id,
          guessValue
        })
      })
      
      const result = await res.json()
      
      if (result.error) {
        console.error(result.error)
        return
      }

      const guessObj = typeof result.guessResult === 'object' && result.comparison
        ? { ...result.guessResult, _comparison: result.comparison }
        : result.guessResult
        
      if (!guesses.value[qIndex]) {
        guesses.value[qIndex] = []
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      guesses.value[qIndex].push(guessObj as any)
      
      if (result.hints && result.hints.length > 0) {
        serverHints.value[qIndex] = result.hints
      }
      
      if (result.isCorrect) {
        status.value[qIndex] = 'won'
      }

    } catch (err) {
      console.error('Lỗi check đáp án', err)
    } finally {
      isGuessing.value = false
    }
  }

  const nextQuestion = () => {
    if (currentQ.value < limit - 1) {
      currentQ.value++
    }
  }

  const goToQuestion = (idx: number) => {
    const maxUnlocked = status.value.findIndex(s => s === 'playing')
    const limitIdx = maxUnlocked === -1 ? limit - 1 : maxUnlocked
    if (idx >= 0 && idx <= limitIdx) {
      currentQ.value = idx
    }
  }

  const isUnlocked = (idx: number) => {
    if (status.value.length === 0) return false
    const maxUnlocked = status.value.findIndex(s => s === 'playing')
    const limitIdx = maxUnlocked === -1 ? limit - 1 : maxUnlocked
    return idx <= limitIdx
  }

  const isFinished = computed(() => {
    if (status.value.length === 0) return false
    return status.value.every(s => s === 'won' || s === 'lost')
  })

  const score = computed(() => {
    return status.value.filter(s => s === 'won').length
  })

  return { 
    questions, 
    options,
    guesses, 
    status, 
    serverHints, 
    addGuessAsync, 
    currentQ,
    nextQuestion,
    goToQuestion,
    isUnlocked,
    isFinished, 
    score, 
    isLoading, 
    isGuessing, 
    isError 
  }
}
