<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useEventListener } from '@vueuse/core'
import { useGame } from './composables/useGame'
import { challenges } from './data/challenges'
import type { PlayMode, TechCategory } from './types'
import { CATEGORY_LABELS } from './types'
import ModeSelector from './components/ModeSelector.vue'
import LevelGrid from './components/LevelGrid.vue'
import CustomerDialog from './components/CustomerDialog.vue'
import TechSelector from './components/TechSelector.vue'
import AnalysisPanel from './components/AnalysisPanel.vue'
import ResultScreen from './components/ResultScreen.vue'
import StarRating from './components/StarRating.vue'

const game = useGame()
const showMobileAnalysis = ref(false)

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
  }
}

function handleSelectTech(category: TechCategory, techId: string) {
  game.selectTech(category, techId)
}

function handleDeselectTech(category: TechCategory) {
  game.deselectTech(category)
}

function handleSubmit() {
  showMobileAnalysis.value = false
  game.submitSolution()
}

// ESC to go back
useEventListener('keydown', (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    if (showMobileAnalysis.value) {
      showMobileAnalysis.value = false
    } else if (game.gameView.value === 'result' || game.gameView.value === 'playing') {
      game.backToMenu()
    }
  }
})
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary">
    <div class="mx-auto max-w-6xl px-4 py-4 sm:px-6 md:py-10">
      <!-- ========== MENU VIEW ========== -->
      <template v-if="game.gameView.value === 'menu'">
        <!-- Back -->
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary animate-fade-up"
        >
          <Icon icon="lucide:arrow-left" class="size-4" />
          Trang chủ
        </RouterLink>

        <!-- Header -->
        <div class="mt-6 sm:mt-8 animate-fade-up animate-delay-1">
          <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
          <h1 class="font-display text-3xl font-bold sm:text-4xl md:text-5xl">DevOps Challenge</h1>
          <p class="mt-2 max-w-2xl text-sm text-text-secondary sm:text-base">
            Thử thách thiết kế hệ thống theo yêu cầu khách hàng thực tế. Học DevOps, System Design
            và Cloud Architecture qua từng level.
          </p>
        </div>

        <!-- Stats bar -->
        <div
          class="mt-4 flex flex-wrap items-center gap-3 sm:gap-6 animate-fade-up animate-delay-2"
        >
          <div
            class="flex items-center gap-2 border border-border-default bg-bg-surface px-3 py-1.5"
          >
            <StarRating :stars="1" size="sm" />
            <span class="font-display text-sm text-text-primary">
              {{ game.totalStars.value }}/{{ challenges.length * 3 }}
            </span>
          </div>
          <div class="flex items-center gap-1.5 text-xs text-text-dim">
            <Icon icon="lucide:layers" class="size-3.5" />
            Level {{ Math.min(game.progress.value.unlockedLevel, challenges.length) }}/{{
              challenges.length
            }}
          </div>
          <button
            v-if="game.totalStars.value > 0"
            class="ml-auto text-xs text-text-dim hover:text-accent-coral transition"
            @click="game.resetProgress()"
          >
            <Icon icon="lucide:rotate-ccw" class="mr-1 inline size-3" />
            Reset
          </button>
        </div>

        <!-- Mode selector -->
        <div class="mt-6 sm:mt-8 animate-fade-up animate-delay-3">
          <ModeSelector @select="handleModeSelect" />
        </div>

        <!-- Level grid -->
        <div
          v-if="game.playMode.value === 'level'"
          class="mt-6 sm:mt-8 animate-fade-up animate-delay-4"
        >
          <h2 class="mb-4 font-display text-lg font-semibold">
            <span class="text-accent-coral">//</span> Chọn Level
          </h2>
          <LevelGrid
            :challenges="challenges"
            :progress="game.progress.value"
            @select-level="game.startLevel"
          />
        </div>

        <!-- Footer -->
        <footer
          class="mt-12 sm:mt-16 border-t border-border-default pt-4 sm:pt-6 text-center animate-fade-up animate-delay-5"
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

      <!-- ========== PLAYING VIEW ========== -->
      <template v-else-if="game.gameView.value === 'playing' && game.currentChallenge.value">
        <!-- Top bar -->
        <div class="flex items-center justify-between animate-fade-up">
          <button
            class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
            @click="game.backToMenu()"
          >
            <Icon icon="lucide:arrow-left" class="size-4" />
            <span class="hidden sm:inline">Về menu</span>
          </button>
          <div class="flex items-center gap-3 text-xs text-text-dim">
            <span>Level {{ game.currentChallenge.value.id }}/{{ challenges.length }}</span>
            <span class="hidden sm:inline">·</span>
            <span class="hidden sm:inline">{{ game.currentChallenge.value.customerName }}</span>
          </div>
        </div>

        <!-- Customer dialog (shown initially) -->
        <div v-if="game.showCustomerDialog.value" class="mt-4">
          <CustomerDialog
            :challenge="game.currentChallenge.value"
            @start="game.dismissCustomerDialog()"
          />
        </div>

        <!-- Main playing area -->
        <template v-else>
          <!-- Desktop: side by side -->
          <div class="mt-4 grid gap-6 lg:grid-cols-[1fr_340px]">
            <!-- Left: Tech selector -->
            <div class="animate-fade-up">
              <TechSelector
                :selected-techs="game.selectedTechs.value"
                :required-categories="game.currentChallenge.value.constraints.requiredCategories"
                @select="handleSelectTech"
                @deselect="handleDeselectTech"
              />

              <!-- Hints (collapsible on mobile) -->
              <details class="mt-4 border border-border-default bg-bg-surface" open>
                <summary
                  class="flex cursor-pointer items-center gap-2 p-3 text-xs font-display text-accent-amber select-none"
                >
                  <Icon icon="lucide:lightbulb" class="size-3.5" />
                  Gợi ý ({{ game.currentChallenge.value.hints.length }})
                </summary>
                <ul class="space-y-1 px-3 pb-3">
                  <li
                    v-for="(hint, i) in game.currentChallenge.value.hints"
                    :key="i"
                    class="text-xs text-text-secondary leading-relaxed"
                  >
                    {{ i + 1 }}. {{ hint }}
                  </li>
                </ul>
              </details>
            </div>

            <!-- Right: Analysis panel (hidden on mobile, shown as overlay) -->
            <div class="hidden lg:block animate-fade-up animate-delay-1">
              <div class="sticky top-4">
                <AnalysisPanel
                  :system-metrics="game.systemMetrics.value"
                  :challenge="game.currentChallenge.value"
                  :warnings="game.warnings.value"
                  :can-submit="game.canSubmit.value"
                  :missing-categories="missingCategoryLabels"
                  @submit="handleSubmit"
                />
              </div>
            </div>
          </div>

          <!-- Mobile: floating bottom bar -->
          <div
            class="fixed inset-x-0 bottom-0 z-40 border-t border-border-default bg-bg-deep/95 p-3 backdrop-blur-sm lg:hidden"
          >
            <div class="mx-auto flex max-w-5xl items-center gap-3">
              <!-- Quick stats -->
              <div class="flex-1 text-xs">
                <div class="flex items-center gap-3">
                  <span class="text-text-dim">
                    Đã chọn:
                    <span class="text-text-primary font-display"
                      >{{ game.selectedCategoriesCount.value }}/{{
                        game.currentChallenge.value.constraints.requiredCategories.length
                      }}</span
                    >
                  </span>
                  <span v-if="game.systemMetrics.value.throughput > 0" class="text-text-dim">
                    {{ game.systemMetrics.value.throughput.toLocaleString() }} req/s
                  </span>
                </div>
              </div>

              <!-- View analysis -->
              <button
                class="border border-accent-sky/30 bg-accent-sky/10 px-3 py-2 text-xs text-accent-sky transition hover:bg-accent-sky/20"
                @click="showMobileAnalysis = true"
              >
                <Icon icon="lucide:bar-chart-3" class="mr-1 inline size-3.5" />
                Phân tích
              </button>

              <!-- Submit -->
              <button
                class="border px-4 py-2 text-xs font-display font-semibold transition"
                :class="
                  game.canSubmit.value
                    ? 'border-accent-coral bg-accent-coral/10 text-accent-coral hover:bg-accent-coral/20'
                    : 'border-border-default bg-bg-surface text-text-dim cursor-not-allowed'
                "
                :disabled="!game.canSubmit.value"
                @click="handleSubmit"
              >
                Nộp bài
              </button>
            </div>
          </div>

          <!-- Mobile analysis overlay -->
          <Teleport to="body">
            <Transition
              enter-active-class="transition duration-200"
              enter-from-class="opacity-0"
              enter-to-class="opacity-100"
              leave-active-class="transition duration-150"
              leave-from-class="opacity-100"
              leave-to-class="opacity-0"
            >
              <div
                v-if="showMobileAnalysis && game.currentChallenge.value"
                class="fixed inset-0 z-50 flex items-end bg-black/60 lg:hidden"
                @click.self="showMobileAnalysis = false"
              >
                <div
                  class="max-h-[85vh] w-full overflow-y-auto border-t border-border-default bg-bg-deep p-4"
                >
                  <div class="mb-3 flex items-center justify-between">
                    <h3 class="font-display text-sm font-semibold text-text-primary">
                      Phân tích hệ thống
                    </h3>
                    <button
                      class="text-text-dim hover:text-text-primary"
                      @click="showMobileAnalysis = false"
                    >
                      <Icon icon="lucide:x" class="size-5" />
                    </button>
                  </div>
                  <AnalysisPanel
                    :system-metrics="game.systemMetrics.value"
                    :challenge="game.currentChallenge.value"
                    :warnings="game.warnings.value"
                    :can-submit="game.canSubmit.value"
                    :missing-categories="missingCategoryLabels"
                    @submit="handleSubmit"
                  />
                </div>
              </div>
            </Transition>
          </Teleport>

          <!-- Spacer for mobile bottom bar -->
          <div class="h-20 lg:hidden" />
        </template>
      </template>

      <!-- ========== RESULT VIEW ========== -->
      <template
        v-else-if="
          game.gameView.value === 'result' && game.lastResult.value && game.currentChallenge.value
        "
      >
        <button
          class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary animate-fade-up"
          @click="game.backToMenu()"
        >
          <Icon icon="lucide:arrow-left" class="size-4" />
          Về menu
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
