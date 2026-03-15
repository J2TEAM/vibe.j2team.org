<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useEventListener } from '@vueuse/core'
import { useHead } from '@unhead/vue'
import { useVimGame } from './composables/useVimGame'
import { LEVELS } from './data/questions'
import metaData from './meta'

useHead({
  title: `${metaData.name} - Vibe Coding`,
  meta: [{ name: 'description', content: metaData.description }],
})

const {
  state,
  currentLevelId,
  currentQuestion,
  score,
  time,
  progress,
  inputBuffer,
  isWrong,
  showHint,
  hintText,
  unlockedLevels,
  startGame,
  resetGame,
  handleKey,
  toggleHint,
} = useVimGame()

// Global key listener
useEventListener('keydown', (e: KeyboardEvent) => {
  if (state.value !== 'PLAYING') return

  // Prevent default for common Vim keys that might scroll or trigger browser shortcuts
  if (['j', 'k', 'd', 'u', '/', ':'].includes(e.key) || (e.ctrlKey && e.key === 'r')) {
    e.preventDefault()
  }

  // Handle Control combos
  if (e.ctrlKey && e.key === 'r') {
    handleKey('Control')
    handleKey('r')
    return
  }

  handleKey(e.key)
})

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body selection:bg-accent-coral/30">
    <div class="max-w-5xl mx-auto px-6 py-12">
      <!-- Header -->
      <header
        class="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 overflow-hidden"
      >
        <div class="animate-fade-up">
          <div class="text-accent-coral font-display text-sm tracking-widest mb-2">
            // VIM MASTER CHALLENGE
          </div>
          <h1 class="font-display text-6xl md:text-7xl font-bold tracking-tight">
            Vim <span class="text-accent-coral italic">Zen</span>
          </h1>
        </div>

        <div class="animate-fade-up animate-delay-1 flex items-center gap-4">
          <div
            class="bg-accent-coral text-bg-deep font-display font-bold text-xs tracking-widest px-3 py-1.5 rotate-3 shadow-lg shadow-accent-coral/20"
          >
            VOL.01 / 2026
          </div>
          <RouterLink
            to="/"
            class="hidden md:flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors text-sm font-display tracking-wide uppercase"
          >
            <Icon icon="lucide:arrow-left" class="size-4" />
            Back Home
          </RouterLink>
        </div>
      </header>

      <!-- Main Content -->
      <main class="relative min-h-[500px]">
        <!-- MENU SCREEN -->
        <div v-if="state === 'MENU'" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="(level, idx) in LEVELS"
            :key="level.id"
            class="group relative border border-border-default bg-bg-surface p-8 transition-all duration-500 hover:-translate-y-2 hover:border-accent-coral hover:bg-bg-elevated animate-fade-up"
            :class="[
              !unlockedLevels.includes(level.id)
                ? 'opacity-50 grayscale cursor-not-allowed pointer-events-none'
                : 'cursor-pointer',
              `animate-delay-${idx + 1}`,
            ]"
            @click="startGame(level.id)"
          >
            <!-- Background Number -->
            <span
              class="absolute top-4 right-6 font-display text-7xl font-bold text-accent-amber/5 select-none pointer-events-none group-hover:text-accent-coral/10 transition-colors"
            >
              0{{ level.id }}
            </span>

            <Icon
              :icon="level.icon"
              class="size-10 text-accent-coral mb-6 group-hover:scale-110 transition-transform duration-500"
            />

            <h2 class="font-display text-2xl font-semibold mb-3 flex items-center gap-2">
              {{ level.title }}
              <Icon
                v-if="!unlockedLevels.includes(level.id)"
                icon="lucide:lock"
                class="size-4 text-text-dim"
              />
            </h2>

            <p class="text-text-secondary leading-relaxed mb-8">
              {{ level.description }}
            </p>

            <div class="mt-auto flex items-center justify-between">
              <span class="text-xs font-display tracking-widest text-text-dim uppercase"
                >Level {{ level.id }}</span
              >
              <span
                v-if="unlockedLevels.includes(level.id)"
                class="text-accent-coral text-sm font-display opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all"
              >
                START &rarr;
              </span>
            </div>
          </div>
        </div>

        <!-- PLAYING SCREEN -->
        <div v-if="state === 'PLAYING'" class="animate-fade-up max-w-3xl mx-auto">
          <div class="flex items-center justify-between mb-8">
            <button
              @click="resetGame"
              class="flex items-center gap-2 text-text-dim hover:text-text-primary transition-colors text-sm uppercase tracking-widest font-display"
            >
              <Icon icon="lucide:x" /> Abort
            </button>
            <div class="flex items-center gap-4">
              <button
                @click="toggleHint"
                class="flex items-center gap-2 px-3 py-1.5 border border-border-default hover:border-accent-amber transition-all text-[10px] uppercase tracking-widest font-display"
                :class="{
                  'text-accent-amber border-accent-amber bg-accent-amber/5': showHint,
                  'text-text-dim': !showHint,
                }"
              >
                <Icon
                  :icon="showHint ? 'lucide:lightbulb' : 'lucide:lightbulb-off'"
                  class="size-3"
                />
                {{ showHint ? 'Hide Hint' : 'Show Hint' }}
              </button>
              <div class="flex items-center gap-6">
                <div class="text-right">
                  <div class="text-[10px] text-text-dim uppercase tracking-widest font-display">
                    Time
                  </div>
                  <div class="text-xl font-display font-bold text-accent-amber tabular-nums">
                    {{ formatTime(time) }}
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-[10px] text-text-dim uppercase tracking-widest font-display">
                    Score
                  </div>
                  <div class="text-xl font-display font-bold text-accent-sky tabular-nums">
                    {{ score }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="h-1 bg-border-default mb-16 overflow-hidden">
            <div
              class="h-full bg-accent-coral transition-all duration-500 ease-out"
              :style="{ width: `${progress}%` }"
            ></div>
          </div>

          <!-- Question Display -->
          <div
            class="relative bg-bg-surface border border-border-default p-12 md:p-20 text-center transition-all duration-300"
            :class="{ 'border-red-500 shake bg-red-500/5': isWrong }"
          >
            <div class="text-text-dim font-display tracking-[0.2em] mb-4 uppercase text-xs">
              Mission {{ currentLevelId }}
            </div>
            <h2
              class="font-display text-3xl md:text-4xl font-bold mb-6 text-text-primary leading-tight"
            >
              {{ currentQuestion?.description }}
            </h2>
            <p class="text-text-secondary italic mb-6">"{{ currentQuestion?.descriptionEn }}"</p>

            <!-- Hint Display -->
            <div
              class="h-12 flex items-center justify-center mb-6 transition-all duration-500 overflow-hidden"
              :class="showHint ? 'opacity-100' : 'opacity-0'"
            >
              <div
                class="flex items-center gap-3 px-4 py-2 bg-accent-amber/10 border border-accent-amber/20 text-accent-amber font-mono text-xl tracking-[0.3em] font-bold"
              >
                <Icon icon="lucide:keyboard" class="size-5" />
                {{ hintText }}
              </div>
            </div>

            <!-- Input Buffer Visualizer -->
            <div class="flex justify-center gap-4 min-h-[80px]">
              <div
                v-for="(key, i) in inputBuffer"
                :key="i"
                class="size-16 flex items-center justify-center border-2 border-accent-coral bg-bg-elevated font-display text-2xl font-bold text-accent-coral animate-bounce-in"
              >
                {{ key === 'Enter' ? '↵' : key === ' ' ? '␣' : key }}
              </div>
              <div
                v-if="inputBuffer.length === 0"
                class="size-16 flex items-center justify-center border border-dashed border-border-default text-text-dim font-display animate-pulse"
              >
                _
              </div>
            </div>
          </div>

          <div class="mt-12 text-center text-text-dim text-sm space-y-2">
            <p>Gõ lệnh Vim để hoàn thành thử thách.</p>
            <p class="text-[10px] uppercase tracking-widest opacity-50">
              Keyboard detected: Type now
            </p>
          </div>
        </div>

        <!-- RESULT SCREEN -->
        <div v-if="state === 'RESULT'" class="max-w-xl mx-auto animate-fade-up">
          <div
            class="border border-border-default bg-bg-surface p-12 text-center relative overflow-hidden"
          >
            <div class="absolute inset-0 pointer-events-none opacity-5">
              <div
                class="absolute -top-10 -left-10 w-40 h-40 bg-accent-coral rounded-full blur-3xl"
              ></div>
              <div
                class="absolute -bottom-10 -right-10 w-40 h-40 bg-accent-amber rounded-full blur-3xl"
              ></div>
            </div>

            <Icon icon="lucide:trophy" class="size-20 text-accent-amber mx-auto mb-6" />
            <h2 class="font-display text-4xl font-bold mb-2">Sứ mệnh Hoàn tất!</h2>
            <p class="text-text-secondary mb-12">
              Bạn đã làm chủ cấp độ này với phong cách của một bậc thầy.
            </p>

            <div class="grid grid-cols-2 gap-8 mb-12">
              <div class="p-6 border border-border-default bg-bg-deep">
                <div class="text-xs text-text-dim uppercase tracking-widest mb-2 font-display">
                  Thời gian
                </div>
                <div class="text-3xl font-display font-bold text-accent-sky">
                  {{ formatTime(time) }}
                </div>
              </div>
              <div class="p-6 border border-border-default bg-bg-deep">
                <div class="text-xs text-text-dim uppercase tracking-widest mb-2 font-display">
                  Điểm số
                </div>
                <div class="text-3xl font-display font-bold text-accent-coral">{{ score }}</div>
              </div>
            </div>

            <div class="flex flex-col sm:flex-row gap-4">
              <button
                @click="resetGame"
                class="flex-1 bg-white hover:bg-accent-coral text-bg-deep hover:text-white px-8 py-4 font-display font-bold text-sm tracking-widest uppercase transition-all duration-300"
              >
                Chọn màn khác
              </button>
              <button
                v-if="currentLevelId < 5"
                @click="startGame(currentLevelId + 1)"
                class="flex-1 border border-border-default hover:border-accent-coral px-8 py-4 font-display font-bold text-sm tracking-widest uppercase transition-all duration-300"
              >
                Màn tiếp theo &rarr;
              </button>
            </div>
          </div>
        </div>
      </main>

      <!-- Footer Decorative -->
      <footer class="mt-20 pt-12 border-t border-border-default">
        <div class="flex flex-col md:flex-row items-center justify-between gap-8">
          <div class="flex gap-1.5 opacity-30">
            <span v-for="n in 20" :key="n" class="w-1 h-1 rounded-full bg-border-default" />
          </div>
          <div class="flex-1 flex justify-center">
            <a
              v-if="metaData.author"
              :href="metaData.facebook"
              target="_blank"
              rel="noopener noreferrer"
              class="group flex items-center gap-2 text-[10px] uppercase tracking-widest font-display text-text-dim hover:text-accent-coral transition-colors"
            >
              <span class="opacity-50">By</span> {{ metaData.author }}
              <Icon
                icon="lucide:external-link"
                class="size-2.5 opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </a>
          </div>
          <div class="flex gap-1.5 opacity-30">
            <span v-for="n in 20" :key="n" class="w-1 h-1 rounded-full bg-border-default" />
          </div>
        </div>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.shake {
  animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
  transform: translate3d(0, 0, 0);
}

@keyframes shake {
  10%,
  90% {
    transform: translate3d(-1px, 0, 0);
  }
  20%,
  80% {
    transform: translate3d(2px, 0, 0);
  }
  30%,
  50%,
  70% {
    transform: translate3d(-4px, 0, 0);
  }
  40%,
  60% {
    transform: translate3d(4px, 0, 0);
  }
}

.animate-bounce-in {
  animation: bounce-in 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes bounce-in {
  0% {
    transform: scale(0.3);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
