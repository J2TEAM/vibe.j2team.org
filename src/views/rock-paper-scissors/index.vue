<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'

type Choice = 'rock' | 'paper' | 'scissors'
type Result = 'win' | 'lose' | 'draw' | null

const choices: { id: Choice; label: string }[] = [
  { id: 'rock', label: 'Búa' },
  { id: 'paper', label: 'Bao' },
  { id: 'scissors', label: 'Kéo' },
]

const playerChoice = ref<Choice | null>(null)
const computerChoice = ref<Choice | null>(null)
const result = ref<Result>(null)
const playerScore = ref(0)
const computerScore = ref(0)
const isRevealing = ref(false)

const winningMove: Record<Choice, Choice> = {
  rock: 'paper',
  paper: 'scissors',
  scissors: 'rock',
}

function getComputerChoice(playerPick: Choice): Choice {
  // 80% máy chọn nước thắng, 20% chọn ngẫu nhiên
  if (Math.random() < 0.8) {
    return winningMove[playerPick]
  }
  const options: Choice[] = ['rock', 'paper', 'scissors']
  return options[Math.floor(Math.random() * 3)] as Choice
}

function getResult(player: Choice, computer: Choice): Result {
  if (player === computer) return 'draw'
  if (
    (player === 'rock' && computer === 'scissors') ||
    (player === 'paper' && computer === 'rock') ||
    (player === 'scissors' && computer === 'paper')
  ) {
    return 'win'
  }
  return 'lose'
}

function play(choice: Choice) {
  if (isRevealing.value) return

  isRevealing.value = true
  playerChoice.value = choice
  computerChoice.value = null
  result.value = null

  setTimeout(() => {
    const cpuChoice = getComputerChoice(choice)
    computerChoice.value = cpuChoice
    const roundResult = getResult(choice, cpuChoice)
    result.value = roundResult

    if (roundResult === 'win') playerScore.value++
    if (roundResult === 'lose') computerScore.value++

    isRevealing.value = false
  }, 600)
}

const resultMessage = computed(() => {
  if (result.value === 'win') return 'BẠN THẮNG'
  if (result.value === 'lose') return 'BẠN THUA'
  if (result.value === 'draw') return 'HOÀ'
  return ''
})

const resultColorClass = computed(() => {
  if (result.value === 'win') return 'text-accent-coral'
  if (result.value === 'lose') return 'text-accent-sky'
  if (result.value === 'draw') return 'text-accent-amber'
  return ''
})
</script>

<template>
  <div
    class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col items-center px-4 py-10 sm:py-16"
  >
    <!-- Header -->
    <div class="text-center animate-fade-up">
      <h1
        class="font-display text-4xl min-[375px]:text-5xl sm:text-6xl font-bold text-accent-coral tracking-tight"
      >
        Kéo Búa Bao
      </h1>
      <p class="mt-3 text-text-secondary text-base sm:text-lg">Đấu với máy tính — AI sẽ thắng!</p>
    </div>

    <!-- Scoreboard -->
    <div class="mt-8 sm:mt-10 flex items-center gap-4 sm:gap-8 animate-fade-up animate-delay-1">
      <div
        class="border border-border-default bg-bg-surface px-5 sm:px-8 py-4 text-center min-w-[100px]"
      >
        <div class="font-display text-xs tracking-widest text-text-dim uppercase mb-1">Bạn</div>
        <div class="font-display text-3xl sm:text-4xl font-bold text-accent-coral">
          {{ playerScore }}
        </div>
      </div>
      <div class="font-display text-2xl text-text-dim select-none">VS</div>
      <div
        class="border border-border-default bg-bg-surface px-5 sm:px-8 py-4 text-center min-w-[100px]"
      >
        <div class="font-display text-xs tracking-widest text-text-dim uppercase mb-1">AI</div>
        <div class="font-display text-3xl sm:text-4xl font-bold text-accent-sky">
          {{ computerScore }}
        </div>
      </div>
    </div>

    <!-- Battle Arena -->
    <div v-if="playerChoice !== null" class="mt-8 sm:mt-10 flex items-center gap-6 sm:gap-12">
      <!-- Player pick -->
      <div class="text-center battle-emoji">
        <div class="w-16 h-16 sm:w-24 sm:h-24 flex items-center justify-center">
          <!-- Rock -->
          <svg
            v-if="playerChoice === 'rock'"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            class="w-full h-full"
          >
            <rect
              x="14"
              y="18"
              width="36"
              height="32"
              rx="8"
              class="fill-accent-coral/20 stroke-accent-coral"
              stroke-width="2"
            />
            <rect x="18" y="24" width="28" height="8" rx="3" class="fill-accent-coral/30" />
            <rect x="18" y="34" width="28" height="8" rx="3" class="fill-accent-coral/30" />
            <line
              x1="32"
              y1="18"
              x2="32"
              y2="12"
              class="stroke-accent-coral"
              stroke-width="2"
              stroke-linecap="round"
            />
            <circle cx="32" cy="10" r="3" class="fill-accent-coral/40" />
          </svg>
          <!-- Paper -->
          <svg
            v-if="playerChoice === 'paper'"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            class="w-full h-full"
          >
            <rect
              x="12"
              y="10"
              width="40"
              height="48"
              class="fill-accent-coral/20 stroke-accent-coral"
              stroke-width="2"
            />
            <line
              x1="20"
              y1="22"
              x2="44"
              y2="22"
              class="stroke-accent-coral/50"
              stroke-width="2"
              stroke-linecap="round"
            />
            <line
              x1="20"
              y1="30"
              x2="44"
              y2="30"
              class="stroke-accent-coral/50"
              stroke-width="2"
              stroke-linecap="round"
            />
            <line
              x1="20"
              y1="38"
              x2="36"
              y2="38"
              class="stroke-accent-coral/50"
              stroke-width="2"
              stroke-linecap="round"
            />
            <line
              x1="20"
              y1="46"
              x2="40"
              y2="46"
              class="stroke-accent-coral/50"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
          <!-- Scissors -->
          <svg
            v-if="playerChoice === 'scissors'"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            class="w-full h-full"
          >
            <circle
              cx="22"
              cy="48"
              r="8"
              class="fill-accent-coral/20 stroke-accent-coral"
              stroke-width="2"
            />
            <circle
              cx="42"
              cy="48"
              r="8"
              class="fill-accent-coral/20 stroke-accent-coral"
              stroke-width="2"
            />
            <line
              x1="26"
              y1="42"
              x2="38"
              y2="14"
              class="stroke-accent-coral"
              stroke-width="2.5"
              stroke-linecap="round"
            />
            <line
              x1="38"
              y1="42"
              x2="26"
              y2="14"
              class="stroke-accent-coral"
              stroke-width="2.5"
              stroke-linecap="round"
            />
            <circle cx="32" cy="28" r="3" class="fill-accent-coral/40" />
          </svg>
        </div>
        <div class="mt-2 font-display text-xs tracking-widest text-text-dim uppercase">Bạn</div>
      </div>

      <!-- VS -->
      <div class="flex flex-col items-center gap-1">
        <div class="w-px h-6 bg-border-default"></div>
        <div class="font-display text-sm text-text-dim tracking-widest">VS</div>
        <div class="w-px h-6 bg-border-default"></div>
      </div>

      <!-- Computer pick -->
      <div class="text-center" :class="computerChoice ? 'battle-emoji' : ''">
        <div class="w-16 h-16 sm:w-24 sm:h-24 flex items-center justify-center">
          <!-- Thinking state -->
          <svg
            v-if="!computerChoice"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            class="w-full h-full thinking-icon"
          >
            <rect
              x="16"
              y="16"
              width="32"
              height="32"
              class="stroke-text-dim"
              stroke-width="2"
              stroke-dasharray="4 4"
            />
            <circle cx="26" cy="32" r="2" class="fill-text-dim" />
            <circle cx="32" cy="32" r="2" class="fill-text-dim" />
            <circle cx="38" cy="32" r="2" class="fill-text-dim" />
          </svg>
          <!-- Rock -->
          <svg
            v-if="computerChoice === 'rock'"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            class="w-full h-full"
          >
            <rect
              x="14"
              y="18"
              width="36"
              height="32"
              rx="8"
              class="fill-accent-sky/20 stroke-accent-sky"
              stroke-width="2"
            />
            <rect x="18" y="24" width="28" height="8" rx="3" class="fill-accent-sky/30" />
            <rect x="18" y="34" width="28" height="8" rx="3" class="fill-accent-sky/30" />
            <line
              x1="32"
              y1="18"
              x2="32"
              y2="12"
              class="stroke-accent-sky"
              stroke-width="2"
              stroke-linecap="round"
            />
            <circle cx="32" cy="10" r="3" class="fill-accent-sky/40" />
          </svg>
          <!-- Paper -->
          <svg
            v-if="computerChoice === 'paper'"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            class="w-full h-full"
          >
            <rect
              x="12"
              y="10"
              width="40"
              height="48"
              class="fill-accent-sky/20 stroke-accent-sky"
              stroke-width="2"
            />
            <line
              x1="20"
              y1="22"
              x2="44"
              y2="22"
              class="stroke-accent-sky/50"
              stroke-width="2"
              stroke-linecap="round"
            />
            <line
              x1="20"
              y1="30"
              x2="44"
              y2="30"
              class="stroke-accent-sky/50"
              stroke-width="2"
              stroke-linecap="round"
            />
            <line
              x1="20"
              y1="38"
              x2="36"
              y2="38"
              class="stroke-accent-sky/50"
              stroke-width="2"
              stroke-linecap="round"
            />
            <line
              x1="20"
              y1="46"
              x2="40"
              y2="46"
              class="stroke-accent-sky/50"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
          <!-- Scissors -->
          <svg
            v-if="computerChoice === 'scissors'"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            class="w-full h-full"
          >
            <circle
              cx="22"
              cy="48"
              r="8"
              class="fill-accent-sky/20 stroke-accent-sky"
              stroke-width="2"
            />
            <circle
              cx="42"
              cy="48"
              r="8"
              class="fill-accent-sky/20 stroke-accent-sky"
              stroke-width="2"
            />
            <line
              x1="26"
              y1="42"
              x2="38"
              y2="14"
              class="stroke-accent-sky"
              stroke-width="2.5"
              stroke-linecap="round"
            />
            <line
              x1="38"
              y1="42"
              x2="26"
              y2="14"
              class="stroke-accent-sky"
              stroke-width="2.5"
              stroke-linecap="round"
            />
            <circle cx="32" cy="28" r="3" class="fill-accent-sky/40" />
          </svg>
        </div>
        <div class="mt-2 font-display text-xs tracking-widest text-text-dim uppercase">AI</div>
      </div>
    </div>

    <!-- Result -->
    <div v-if="result" class="mt-6 result-pop">
      <div
        class="font-display text-2xl sm:text-3xl font-bold tracking-wide"
        :class="resultColorClass"
      >
        {{ resultMessage }}
      </div>
    </div>

    <!-- Choices -->
    <div class="mt-8 sm:mt-10 animate-fade-up animate-delay-2">
      <div
        class="font-display text-sm tracking-widest text-text-dim uppercase mb-4 text-center flex items-center justify-center gap-2"
      >
        <span class="text-accent-amber">//</span>
        Chọn nước đi
      </div>
      <div class="flex gap-3 sm:gap-5">
        <button
          v-for="c in choices"
          :key="c.id"
          :disabled="isRevealing"
          class="group border border-border-default bg-bg-surface px-5 sm:px-8 py-4 sm:py-6 transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:border-border-default disabled:hover:bg-bg-surface flex flex-col items-center gap-3"
          @click="play(c.id)"
        >
          <div
            class="w-10 h-10 sm:w-12 sm:h-12 transition-transform duration-300 group-hover:scale-110"
          >
            <!-- Rock icon -->
            <svg
              v-if="c.id === 'rock'"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              class="w-full h-full"
            >
              <rect
                x="14"
                y="18"
                width="36"
                height="32"
                rx="8"
                class="fill-text-dim/10 stroke-text-secondary group-hover:fill-accent-coral/20 group-hover:stroke-accent-coral"
                stroke-width="2"
                style="transition: all 0.3s"
              />
              <rect
                x="18"
                y="24"
                width="28"
                height="8"
                rx="3"
                class="fill-text-dim/20 group-hover:fill-accent-coral/30"
                style="transition: all 0.3s"
              />
              <rect
                x="18"
                y="34"
                width="28"
                height="8"
                rx="3"
                class="fill-text-dim/20 group-hover:fill-accent-coral/30"
                style="transition: all 0.3s"
              />
              <line
                x1="32"
                y1="18"
                x2="32"
                y2="12"
                class="stroke-text-secondary group-hover:stroke-accent-coral"
                stroke-width="2"
                stroke-linecap="round"
                style="transition: all 0.3s"
              />
              <circle
                cx="32"
                cy="10"
                r="3"
                class="fill-text-dim/30 group-hover:fill-accent-coral/40"
                style="transition: all 0.3s"
              />
            </svg>
            <!-- Paper icon -->
            <svg
              v-if="c.id === 'paper'"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              class="w-full h-full"
            >
              <rect
                x="12"
                y="10"
                width="40"
                height="48"
                class="fill-text-dim/10 stroke-text-secondary group-hover:fill-accent-coral/20 group-hover:stroke-accent-coral"
                stroke-width="2"
                style="transition: all 0.3s"
              />
              <line
                x1="20"
                y1="22"
                x2="44"
                y2="22"
                class="stroke-text-dim/40 group-hover:stroke-accent-coral/50"
                stroke-width="2"
                stroke-linecap="round"
                style="transition: all 0.3s"
              />
              <line
                x1="20"
                y1="30"
                x2="44"
                y2="30"
                class="stroke-text-dim/40 group-hover:stroke-accent-coral/50"
                stroke-width="2"
                stroke-linecap="round"
                style="transition: all 0.3s"
              />
              <line
                x1="20"
                y1="38"
                x2="36"
                y2="38"
                class="stroke-text-dim/40 group-hover:stroke-accent-coral/50"
                stroke-width="2"
                stroke-linecap="round"
                style="transition: all 0.3s"
              />
              <line
                x1="20"
                y1="46"
                x2="40"
                y2="46"
                class="stroke-text-dim/40 group-hover:stroke-accent-coral/50"
                stroke-width="2"
                stroke-linecap="round"
                style="transition: all 0.3s"
              />
            </svg>
            <!-- Scissors icon -->
            <svg
              v-if="c.id === 'scissors'"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              class="w-full h-full"
            >
              <circle
                cx="22"
                cy="48"
                r="8"
                class="fill-text-dim/10 stroke-text-secondary group-hover:fill-accent-coral/20 group-hover:stroke-accent-coral"
                stroke-width="2"
                style="transition: all 0.3s"
              />
              <circle
                cx="42"
                cy="48"
                r="8"
                class="fill-text-dim/10 stroke-text-secondary group-hover:fill-accent-coral/20 group-hover:stroke-accent-coral"
                stroke-width="2"
                style="transition: all 0.3s"
              />
              <line
                x1="26"
                y1="42"
                x2="38"
                y2="14"
                class="stroke-text-secondary group-hover:stroke-accent-coral"
                stroke-width="2.5"
                stroke-linecap="round"
                style="transition: all 0.3s"
              />
              <line
                x1="38"
                y1="42"
                x2="26"
                y2="14"
                class="stroke-text-secondary group-hover:stroke-accent-coral"
                stroke-width="2.5"
                stroke-linecap="round"
                style="transition: all 0.3s"
              />
              <circle
                cx="32"
                cy="28"
                r="3"
                class="fill-text-dim/30 group-hover:fill-accent-coral/40"
                style="transition: all 0.3s"
              />
            </svg>
          </div>
          <span
            class="font-display text-xs tracking-widest text-text-secondary group-hover:text-accent-coral transition-colors uppercase"
          >
            {{ c.label }}
          </span>
        </button>
      </div>
    </div>

    <!-- Back to home -->
    <RouterLink
      to="/"
      class="mt-8 inline-flex items-center gap-2 border border-border-default bg-bg-surface px-5 py-2.5 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary animate-fade-up animate-delay-3"
    >
      &larr; Về trang chủ
    </RouterLink>
  </div>
</template>

<style scoped>
.battle-emoji {
  animation: pop-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes pop-in {
  from {
    opacity: 0;
    transform: scale(0.3) rotate(-15deg);
  }
  to {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}

.thinking-icon {
  animation: pulse-think 1s ease-in-out infinite;
}

@keyframes pulse-think {
  0%,
  100% {
    opacity: 0.4;
  }
  50% {
    opacity: 1;
  }
}

.result-pop {
  animation: result-bounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes result-bounce {
  from {
    opacity: 0;
    transform: scale(0.5) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>
