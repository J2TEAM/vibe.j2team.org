import { ref, computed } from 'vue'

export function useTimer() {
    const totalSeconds = ref(0)
    const remainingSeconds = ref(0)
    const isRunning = ref(false)
    let intervalId: ReturnType<typeof setInterval> | null = null

    const minutes = computed(() => Math.floor(remainingSeconds.value / 60))
    const seconds = computed(() => remainingSeconds.value % 60)
    const displayTime = computed(() => {
        const m = String(minutes.value).padStart(2, '0')
        const s = String(seconds.value).padStart(2, '0')
        return `${m}:${s}`
    })
    const isExpired = computed(() => remainingSeconds.value <= 0 && totalSeconds.value > 0)
    const isCountingUp = ref(false)
    const elapsedSeconds = computed(() =>
        isCountingUp.value ? totalSeconds.value : totalSeconds.value - remainingSeconds.value
    )

    function start(durationSeconds: number) {
        stop()
        totalSeconds.value = durationSeconds
        remainingSeconds.value = durationSeconds
        isCountingUp.value = false
        isRunning.value = true
        intervalId = setInterval(() => {
            if (remainingSeconds.value > 0) {
                remainingSeconds.value--
            } else {
                stop()
            }
        }, 1000)
    }

    function pause() {
        if (intervalId) {
            clearInterval(intervalId)
            intervalId = null
        }
        isRunning.value = false
    }

    function resume() {
        if (!isRunning.value && remainingSeconds.value > 0) {
            isRunning.value = true
            intervalId = setInterval(() => {
                if (remainingSeconds.value > 0) {
                    remainingSeconds.value--
                } else {
                    stop()
                }
            }, 1000)
        }
    }

    function stop() {
        if (intervalId) {
            clearInterval(intervalId)
            intervalId = null
        }
        isRunning.value = false
    }

    function reset() {
        stop()
        remainingSeconds.value = totalSeconds.value
    }

    // For modes without time limit — count up
    function startCountUp() {
        stop()
        totalSeconds.value = 0
        remainingSeconds.value = 0
        isCountingUp.value = true
        isRunning.value = true
        intervalId = setInterval(() => {
            totalSeconds.value++
            remainingSeconds.value = totalSeconds.value
        }, 1000)
    }

    return {
        totalSeconds,
        remainingSeconds,
        isRunning,
        minutes,
        seconds,
        displayTime,
        isExpired,
        elapsedSeconds,
        start,
        pause,
        resume,
        stop,
        reset,
        startCountUp,
    }
}
