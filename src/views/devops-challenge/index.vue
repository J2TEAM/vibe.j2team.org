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
    <div class="mx-auto max-w-6xl px-4 py-4 sm:px-6 md:py-8">
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

      <!-- ========== PLAYING VIEW ========== -->
      <template v-else-if="game.gameView.value === 'playing' && game.currentChallenge.value">
        <!-- Top bar -->
        <div class="flex items-center justify-between animate-fade-up">
          <button
            class="inline-flex items-center gap-1.5 border border-border-default bg-bg-surface px-3 py-1.5 text-xs text-text-dim transition hover:border-text-dim hover:text-text-primary active:scale-95"
            @click="game.backToMenu()"
          >
            <Icon icon="lucide:arrow-left" class="size-3.5" />
            <span class="hidden sm:inline">Menu</span>
          </button>

          <!-- Level info -->
          <div class="flex items-center gap-2 sm:gap-3">
            <span
              class="border border-border-default bg-bg-surface px-2 py-1 font-display text-xs tabular-nums text-text-secondary"
            >
              {{ game.currentChallenge.value.id }}/{{ challenges.length }}
            </span>
            <span class="hidden text-xs text-text-dim sm:inline">
              {{ game.currentChallenge.value.customerName }}
            </span>
          </div>
        </div>

        <!-- Customer dialog (shown initially) -->
        <div v-if="game.showCustomerDialog.value" class="mt-4 sm:mt-6">
          <CustomerDialog
            :challenge="game.currentChallenge.value"
            @start="game.dismissCustomerDialog()"
          />
        </div>

        <!-- Main playing area -->
        <template v-else>
          <!-- Desktop: side by side -->
          <div class="mt-4 grid gap-4 sm:gap-6 lg:grid-cols-[1fr_340px]">
            <!-- Left: Tech selector -->
            <div class="animate-fade-up">
              <TechSelector
                :selected-techs="game.selectedTechs.value"
                :required-categories="game.currentChallenge.value.constraints.requiredCategories"
                @select="handleSelectTech"
                @deselect="handleDeselectTech"
              />

              <!-- Hints -->
              <details class="mt-4 border border-border-default bg-bg-surface overflow-hidden">
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
            </div>

            <!-- Right: Analysis panel (desktop only) -->
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
            class="fixed inset-x-0 bottom-0 z-40 border-t border-border-default bg-bg-deep/95 backdrop-blur-sm lg:hidden"
          >
            <div class="mx-auto flex max-w-5xl items-center gap-2 px-3 py-2.5 sm:px-4">
              <!-- Quick stats -->
              <div class="flex-1">
                <div class="flex items-center gap-2 text-xs">
                  <span class="flex items-center gap-1 text-text-dim">
                    <Icon icon="lucide:check-square" class="size-3" />
                    <span
                      class="font-display font-bold tabular-nums"
                      :class="game.canSubmit.value ? 'text-green-400' : 'text-text-primary'"
                    >
                      {{ game.selectedCategoriesCount.value }}/{{
                        game.currentChallenge.value.constraints.requiredCategories.length
                      }}
                    </span>
                  </span>
                  <span
                    v-if="game.systemMetrics.value.throughput > 0"
                    class="text-text-dim tabular-nums"
                  >
                    {{ game.systemMetrics.value.throughput.toLocaleString() }} req/s
                  </span>
                </div>
              </div>

              <!-- View analysis -->
              <button
                class="flex items-center gap-1 border border-accent-sky/30 bg-accent-sky/10 px-2.5 py-2 text-[11px] font-display font-semibold text-accent-sky transition hover:bg-accent-sky/20 active:scale-95"
                @click="showMobileAnalysis = true"
              >
                <Icon icon="lucide:bar-chart-3" class="size-3.5" />
                <span class="hidden xs:inline">Phân tích</span>
              </button>

              <!-- Submit -->
              <button
                class="flex items-center gap-1 border px-3 py-2 text-[11px] font-display font-bold transition active:scale-95"
                :class="
                  game.canSubmit.value
                    ? 'border-accent-coral bg-accent-coral/10 text-accent-coral hover:bg-accent-coral/20'
                    : 'border-border-default bg-bg-surface text-text-dim cursor-not-allowed'
                "
                :disabled="!game.canSubmit.value"
                @click="handleSubmit"
              >
                <Icon icon="lucide:send" class="size-3.5" />
                Nộp
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
                class="fixed inset-0 z-50 flex items-end bg-black/60 backdrop-blur-sm lg:hidden"
                @click.self="showMobileAnalysis = false"
              >
                <Transition
                  enter-active-class="transition duration-250 ease-out"
                  enter-from-class="translate-y-full"
                  enter-to-class="translate-y-0"
                  leave-active-class="transition duration-200 ease-in"
                  leave-from-class="translate-y-0"
                  leave-to-class="translate-y-full"
                  appear
                >
                  <div
                    v-if="showMobileAnalysis"
                    class="max-h-[85vh] w-full overflow-y-auto border-t border-border-default bg-bg-deep"
                  >
                    <!-- Handle bar -->
                    <div class="flex justify-center py-2">
                      <div class="h-1 w-10 bg-text-dim/30" />
                    </div>
                    <div class="px-4 pb-6">
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
              </div>
            </Transition>
          </Teleport>

          <!-- Spacer for mobile bottom bar -->
          <div class="h-16 lg:hidden" />
        </template>
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
