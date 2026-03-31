<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useEventListener } from '@vueuse/core'
import { useGame } from './composables/useGame'
import { challenges, loadChallenges } from './data/challenges'
import { loadTechnologies } from './data/technologies'
import type { PlayMode, TechCategory } from './types'
import { CATEGORY_LABELS, DIFFICULTY_COLORS, DIFFICULTY_LABELS } from './types'
import ModeSelector from './components/ModeSelector.vue'
import LevelGrid from './components/LevelGrid.vue'
import CustomerDialog from './components/CustomerDialog.vue'
import TechSelector from './components/TechSelector.vue'
import AnalysisPanel from './components/AnalysisPanel.vue'
import ResultScreen from './components/ResultScreen.vue'
import StarRating from './components/StarRating.vue'
import CustomAnalysis from './components/CustomAnalysis.vue'

const dataLoaded = ref(false)

onMounted(async () => {
  await Promise.all([loadChallenges(), loadTechnologies()])
  dataLoaded.value = true
})

const game = useGame()

const hasNextLevel = computed(() => {
  if (!game.currentChallenge.value) return false
  return challenges.some((c) => c.id === game.currentChallenge.value!.id + 1)
})

const missingCategoryLabels = computed(() =>
  game.missingCategories.value.map((cat) => CATEGORY_LABELS[cat as TechCategory] ?? cat),
)

function handleModeSelect(mode: PlayMode) {
  game.playMode.value = mode
  if (mode === 'random') {
    game.startRandom()
  } else if (mode === 'custom') {
    game.startCustom()
  } else if (mode === 'level') {
    // Auto-start the highest unlocked level
    const currentLevel = Math.min(game.progress.value.unlockedLevel, challenges.length)
    game.startLevel(currentLevel)
  }
}

function handleSelectTech(category: TechCategory, techId: string) {
  game.selectTech(category, techId)
}

function handleDeselectTech(category: TechCategory) {
  game.deselectTech(category)
}

function handleSubmit() {
  game.submitSolution()
}

// ESC to go back
useEventListener('keydown', (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    if (game.gameView.value === 'result' || game.gameView.value === 'playing') {
      game.backToMenu()
    }
  }
})
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary">
    <!-- Loading state -->
    <div v-if="!dataLoaded" class="flex min-h-screen items-center justify-center">
      <div class="text-center">
        <Icon icon="lucide:loader-2" class="mx-auto size-8 animate-spin text-accent-coral" />
        <p class="mt-3 font-display text-sm text-text-dim">Loading...</p>
      </div>
    </div>

    <div v-else class="mx-auto max-w-5xl px-4 py-4 sm:px-6 md:py-8">
      <!-- ========== MENU VIEW ========== -->
      <template v-if="game.gameView.value === 'menu'">
        <!-- Back -->
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-3 py-1.5 text-xs text-text-dim transition hover:border-text-dim hover:text-text-primary animate-fade-up"
        >
          <Icon icon="lucide:arrow-left" class="size-3.5" />
          Trang chủ
        </RouterLink>

        <!-- Hero -->
        <div class="mt-6 sm:mt-10 animate-fade-up animate-delay-1">
          <div class="flex items-center gap-2">
            <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
            <div class="h-px w-12 bg-accent-coral/50" />
          </div>
          <h1 class="mt-2 font-display text-4xl font-black sm:text-5xl md:text-6xl">
            DevOps
            <span class="text-accent-coral">Challenge</span>
          </h1>
          <p class="mt-3 max-w-xl text-sm leading-relaxed text-text-secondary sm:text-base">
            Thiết kế hệ thống theo yêu cầu khách hàng thực tế. Học DevOps, System Design và Cloud
            Architecture qua từng level.
          </p>
        </div>

        <!-- Stats bar -->
        <div
          class="mt-6 flex flex-wrap items-center gap-3 sm:gap-4 animate-fade-up animate-delay-2"
        >
          <div
            class="flex items-center gap-2 border border-accent-amber/20 bg-accent-amber/5 px-3 py-1.5"
          >
            <StarRating :stars="1" size="sm" />
            <span class="font-display text-sm font-bold tabular-nums text-text-primary">
              {{ game.totalStars.value
              }}<span class="text-text-dim">/{{ challenges.length * 3 }}</span>
            </span>
          </div>
          <div
            class="flex items-center gap-2 border border-border-default bg-bg-surface px-3 py-1.5"
          >
            <Icon icon="lucide:layers" class="size-3.5 text-accent-sky" />
            <span class="font-display text-sm tabular-nums text-text-secondary">
              Level {{ Math.min(game.progress.value.unlockedLevel, challenges.length) }}/{{
                challenges.length
              }}
            </span>
          </div>
          <button
            v-if="game.totalStars.value > 0"
            class="ml-auto flex items-center gap-1 text-xs text-text-dim transition hover:text-accent-coral"
            @click="game.resetProgress()"
          >
            <Icon icon="lucide:rotate-ccw" class="size-3" />
            Reset
          </button>
        </div>

        <!-- Mode selector -->
        <div class="mt-8 sm:mt-10 animate-fade-up animate-delay-3">
          <ModeSelector @select="handleModeSelect" />
        </div>

        <!-- Level grid -->
        <div
          v-if="game.playMode.value === 'level'"
          class="mt-8 sm:mt-10 animate-fade-up animate-delay-4"
        >
          <div class="mb-5 flex items-center gap-3">
            <h2 class="font-display text-base font-bold sm:text-lg">
              <span class="text-accent-coral">//</span> Chọn Level
            </h2>
            <div class="h-px flex-1 bg-border-default" />
          </div>
          <LevelGrid
            :challenges="challenges"
            :progress="game.progress.value"
            @select-level="game.startLevel"
          />
        </div>

        <!-- Footer -->
        <footer
          class="mt-16 sm:mt-20 border-t border-border-default pt-6 text-center animate-fade-up animate-delay-5"
        >
          <p class="text-xs text-text-dim">
            Tạo bởi
            <a
              href="https://www.facebook.com/tuhachiz/"
              target="_blank"
              rel="noopener noreferrer"
              class="text-accent-sky hover:text-accent-coral transition"
            >
              Hachi Tu
            </a>
            — Mọi dữ liệu mô phỏng phục vụ mục đích giáo dục
          </p>
        </footer>
      </template>

      <!-- ========== PLAYING VIEW (Level/Random) ========== -->
      <template
        v-else-if="
          game.gameView.value === 'playing' &&
          game.playMode.value !== 'custom' &&
          game.currentChallenge.value
        "
      >
        <!-- Top bar -->
        <div class="flex items-center justify-between animate-fade-up">
          <button
            class="inline-flex items-center gap-1.5 border border-border-default bg-bg-surface px-3 py-1.5 text-xs text-text-dim transition hover:border-text-dim hover:text-text-primary active:scale-95"
            @click="game.backToMenu()"
          >
            <Icon icon="lucide:arrow-left" class="size-3.5" />
            <span class="hidden sm:inline">Menu</span>
          </button>
          <div class="flex items-center gap-2 sm:gap-3">
            <span
              class="border border-border-default bg-bg-surface px-2 py-1 font-display text-xs tabular-nums text-text-secondary"
            >
              {{ game.currentChallenge.value.id }}/{{ challenges.length }}
            </span>
            <span
              class="border px-1.5 py-0.5 text-[10px] font-display"
              :class="[
                DIFFICULTY_COLORS[game.currentChallenge.value.difficulty],
                'border-current/30',
              ]"
            >
              {{ DIFFICULTY_LABELS[game.currentChallenge.value.difficulty] }}
            </span>
          </div>
        </div>

        <!-- Customer dialog (shown initially, before playing) -->
        <div v-if="game.showCustomerDialog.value" class="mt-4 sm:mt-6">
          <CustomerDialog
            :challenge="game.currentChallenge.value"
            @start="game.dismissCustomerDialog()"
          />
        </div>

        <!-- Main playing area — single column, everything inline -->
        <template v-else>
          <!-- Requirement summary (always visible at top) -->
          <div class="mt-4 border border-border-default bg-bg-surface p-3 sm:p-4 animate-fade-up">
            <div class="flex items-start gap-3">
              <Icon
                :icon="game.currentChallenge.value.customerAvatar"
                class="size-5 shrink-0 text-accent-sky mt-0.5"
              />
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <span class="font-display text-sm font-bold text-text-primary">
                    {{ game.currentChallenge.value.customerName }}
                  </span>
                </div>
                <p
                  class="mt-1 text-xs text-text-secondary leading-relaxed line-clamp-2 sm:line-clamp-none"
                >
                  "{{ game.currentChallenge.value.requirement }}"
                </p>
              </div>
              <!-- Key constraints compact -->
              <div
                class="hidden sm:flex items-center gap-3 shrink-0 text-[11px] text-text-dim tabular-nums"
              >
                <span
                  >{{
                    game.currentChallenge.value.constraints.minThroughput.toLocaleString()
                  }}
                  req/s</span
                >
                <span>&lt;{{ game.currentChallenge.value.constraints.maxLatency }}ms</span>
                <span
                  >${{ game.currentChallenge.value.constraints.maxCost.toLocaleString() }}/th</span
                >
              </div>
            </div>
          </div>

          <!-- Tech selector -->
          <div class="mt-4 animate-fade-up">
            <TechSelector
              :selected-techs="game.selectedTechs.value"
              :required-categories="game.currentChallenge.value.constraints.requiredCategories"
              @select="handleSelectTech"
              @deselect="handleDeselectTech"
            />
          </div>

          <!-- Hints -->
          <details
            class="mt-4 border border-border-default bg-bg-surface overflow-hidden animate-fade-up"
          >
            <summary
              class="flex cursor-pointer items-center gap-2 px-4 py-3 text-xs font-display font-semibold text-accent-amber select-none hover:bg-bg-elevated transition"
            >
              <Icon icon="lucide:lightbulb" class="size-3.5" />
              Gợi ý ({{ game.currentChallenge.value.hints.length }})
              <Icon icon="lucide:chevron-down" class="ml-auto size-3.5 text-text-dim" />
            </summary>
            <ul class="space-y-1.5 border-t border-border-default px-4 py-3">
              <li
                v-for="(hint, i) in game.currentChallenge.value.hints"
                :key="i"
                class="flex items-start gap-2 text-xs text-text-secondary leading-relaxed"
              >
                <span
                  class="mt-0.5 flex size-4 shrink-0 items-center justify-center border border-accent-amber/20 bg-accent-amber/5 font-display text-[10px] text-accent-amber"
                >
                  {{ i + 1 }}
                </span>
                {{ hint }}
              </li>
            </ul>
          </details>

          <!-- Analysis panel (below hints, always visible) -->
          <div class="mt-4 animate-fade-up">
            <AnalysisPanel
              :system-metrics="game.systemMetrics.value"
              :challenge="game.currentChallenge.value"
              :warnings="game.warnings.value"
              :can-submit="game.canSubmit.value"
              :missing-categories="missingCategoryLabels"
              @submit="handleSubmit"
            />
          </div>
        </template>
      </template>

      <!-- ========== PLAYING VIEW (Custom mode) ========== -->
      <template v-else-if="game.gameView.value === 'playing' && game.playMode.value === 'custom'">
        <!-- Top bar -->
        <div class="flex items-center justify-between animate-fade-up">
          <button
            class="inline-flex items-center gap-1.5 border border-border-default bg-bg-surface px-3 py-1.5 text-xs text-text-dim transition hover:border-text-dim hover:text-text-primary active:scale-95"
            @click="game.backToMenu()"
          >
            <Icon icon="lucide:arrow-left" class="size-3.5" />
            <span class="hidden sm:inline">Menu</span>
          </button>
          <div class="flex items-center gap-2">
            <Icon icon="lucide:wrench" class="size-3.5 text-accent-sky" />
            <span class="font-display text-xs font-bold text-accent-sky">Chế độ tự do</span>
          </div>
        </div>

        <!-- Description -->
        <div class="mt-4 border border-accent-sky/20 bg-accent-sky/5 p-3 sm:p-4 animate-fade-up">
          <p class="text-xs sm:text-sm text-text-secondary leading-relaxed">
            Tự do chọn công nghệ từ các danh mục bên dưới. Hệ thống sẽ phân tích
            <strong class="text-text-primary">ưu nhược điểm</strong> của từng lựa chọn và gợi ý
            <strong class="text-text-primary">loại dự án phù hợp</strong> với tech stack của bạn.
          </p>
        </div>

        <!-- Tech selector (no required categories in custom mode) -->
        <div class="mt-4 animate-fade-up">
          <TechSelector
            :selected-techs="game.selectedTechs.value"
            :required-categories="[]"
            @select="handleSelectTech"
            @deselect="handleDeselectTech"
          />
        </div>

        <!-- Custom analysis (pros/cons/suitable projects) -->
        <div class="mt-4 animate-fade-up">
          <CustomAnalysis
            :selected-techs="game.selectedTechs.value"
            :system-metrics="game.systemMetrics.value"
            :warnings="game.warnings.value"
            :synergy-pairs="game.synergyPairs.value"
            :conflict-pairs="game.conflictPairs.value"
          />
        </div>
      </template>

      <!-- ========== RESULT VIEW ========== -->
      <template
        v-else-if="
          game.gameView.value === 'result' && game.lastResult.value && game.currentChallenge.value
        "
      >
        <button
          class="inline-flex items-center gap-1.5 border border-border-default bg-bg-surface px-3 py-1.5 text-xs text-text-dim transition hover:border-text-dim hover:text-text-primary active:scale-95 animate-fade-up"
          @click="game.backToMenu()"
        >
          <Icon icon="lucide:arrow-left" class="size-3.5" />
          Menu
        </button>

        <div class="mt-4 sm:mt-6">
          <ResultScreen
            :result="game.lastResult.value"
            :challenge="game.currentChallenge.value"
            :has-next-level="hasNextLevel"
            @retry="game.retryLevel()"
            @next="game.nextLevel()"
            @menu="game.backToMenu()"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
/* Custom scrollbar for this page */
:deep(.scrollbar-thin) {
  scrollbar-width: thin;
  scrollbar-color: var(--color-border-default, #253549) transparent;
}

:deep(.scrollbar-thin)::-webkit-scrollbar {
  height: 4px;
}

:deep(.scrollbar-thin)::-webkit-scrollbar-track {
  background: transparent;
}

:deep(.scrollbar-thin)::-webkit-scrollbar-thumb {
  background-color: var(--color-border-default, #253549);
}

:deep(.scrollbar-thin)::-webkit-scrollbar-thumb:hover {
  background-color: var(--color-text-dim, #4a6a8a);
}
</style>
