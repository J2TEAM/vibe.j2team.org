<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import type { Card, StatKey } from './types'
import { useI18n } from './composables/useI18n'
import { useGame } from './composables/useGame'
import { Icon } from '@iconify/vue'
import { trackIcon, UI_LUCIDE } from './constants/icons'
import GameTitle from './components/GameTitle.vue'
import OnboardingIntro from './components/OnboardingIntro.vue'
import TutorialOverlay from './components/TutorialOverlay.vue'
import TurnHeader from './components/TurnHeader.vue'
import StatsBar from './components/StatsBar.vue'
import EventBanner from './components/EventBanner.vue'
import ActiveSlots from './components/ActiveSlots.vue'
import TurnTransition from './components/TurnTransition.vue'
import CardDetail from './components/CardDetail.vue'
import HandPanel from './components/HandPanel.vue'
import EndingScreen from './components/EndingScreen.vue'

const {
  state,
  derived,
  year,
  startGame,
  startGameWithTutorial,
  beginTutorial,
  advanceOnboarding,
  skipOnboarding,
  dismissTransition,
  restartGame,
  goToMenu,
  chooseEvent,
  toggleCardSelection,
  spendEnergyForExtraCard,
  confirmSelection,
  deactivateSlot,
  removeFromSlot,
  getProductionTotals,
} = useGame()

const production = computed(() => getProductionTotals())

const { locale } = useI18n()
const showHand = ref(false)
const inspectedCard = ref<Card | null>(null)

const pendingCards = computed(() => state.hand.filter((c) => state.selectedIds.has(c.id)))
const playedThisTurnIds = computed(() => new Set(state.playedThisTurn.map((c) => c.id)))

// ── Unlock toast system ──────────────────────────────────────────────────
const unlockToast = ref<{ icon: string; text: string; color: string } | null>(null)
const showFlash = ref(false)
const prevStatSnapshot = ref<Record<StatKey, number>>({
  nature: 0,
  human: 0,
  economy: 0,
  digital: 0,
})

const STAT_LABELS: Record<StatKey, { vi: string; en: string }> = {
  nature: { vi: 'Sinh Thái', en: 'Nature' },
  human: { vi: 'Nhân Sinh', en: 'Human' },
  economy: { vi: 'Giao Thương', en: 'Economy' },
  digital: { vi: 'Số Hóa', en: 'Digital' },
}

const STAT_COLORS: Record<StatKey, string> = {
  nature: '#4ADE80',
  human: '#FFB830',
  economy: '#FF6B4A',
  digital: '#38BDF8',
}

const activeTimers = new Set<ReturnType<typeof setTimeout>>()

function safeTimeout(fn: () => void, ms: number) {
  const id = setTimeout(() => {
    activeTimers.delete(id)
    fn()
  }, ms)
  activeTimers.add(id)
}

watch(
  () => ({ ...state.stats }),
  (newStats) => {
    for (const key of ['nature', 'human', 'economy', 'digital'] as StatKey[]) {
      const prev = prevStatSnapshot.value[key]
      const curr = newStats[key]
      if (prev < 30 && curr >= 30) {
        const label = STAT_LABELS[key]
        // Screen flash
        showFlash.value = true
        safeTimeout(() => {
          showFlash.value = false
        }, 400)
        // Toast with color
        unlockToast.value = {
          icon: trackIcon(key),
          color: STAT_COLORS[key],
          text:
            locale.value === 'vi'
              ? `${label.vi} đạt 30 — Mở khóa thẻ Văn Hóa!`
              : `${label.en} hit 30 — Culture cards unlocked!`,
        }
        safeTimeout(() => {
          unlockToast.value = null
        }, 4000)
      }
    }
    prevStatSnapshot.value = { ...newStats }
  },
  { deep: true },
)

// ── Confirm button state ─────────────────────────────────────────────────
const confirmReady = computed(() => state.selectedIds.size > 0 || state.playedThisTurn.length > 0)

const isConfirming = ref(false)
function handleConfirm() {
  isConfirming.value = true
  safeTimeout(() => {
    isConfirming.value = false
  }, 300)
  confirmSelection()
}

onUnmounted(() => {
  activeTimers.forEach(clearTimeout)
})

function handleSkipFromTitle() {
  startGame()
}
</script>

<template>
  <!-- Title screen -->
  <GameTitle
    v-if="state.screen === 'title'"
    @start="handleSkipFromTitle"
    @tutorial="startGameWithTutorial"
  />

  <!-- Onboarding intro -->
  <OnboardingIntro
    v-else-if="state.screen === 'onboarding'"
    @begin="beginTutorial"
    @skip="handleSkipFromTitle"
  />

  <!-- Ending screen -->
  <EndingScreen
    v-else-if="state.screen === 'ending' && state.resolvedEnding"
    :world-title="state.resolvedEnding.title"
    :narrative="state.resolvedEnding.narrative"
    :vision-ids="state.resolvedEnding.visionIds"
    :stats="state.stats"
    :derived="derived"
    @restart="restartGame"
  />

  <!-- Game screen -->
  <div
    v-else-if="state.screen === 'playing'"
    class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col"
  >
    <!-- Header -->
    <TurnHeader
      :turn="state.turn"
      :year="year"
      :budget="state.budget"
      :energy="state.energy"
      :food="state.food"
      :materials="state.materials"
      :knowledge="state.knowledge"
    />

    <!-- Game nav -->
    <div class="flex items-center justify-between px-3 pt-1 pb-0">
      <button class="game-nav-btn" @click="goToMenu">← Menu</button>
      <button class="game-nav-btn" @click="restartGame">
        ↺ {{ locale === 'vi' ? 'Chơi lại' : 'Restart' }}
      </button>
    </div>

    <!-- Main content — cards front and center -->
    <div class="flex-1 overflow-y-auto">
      <div class="max-w-md mx-auto px-3 py-3 flex flex-col gap-3">
        <!-- Stats strip -->
        <StatsBar :stats="state.stats" :derived="derived" :production="production" />

        <!-- Card grid — the hero -->
        <ActiveSlots
          :slots="state.slots"
          :can-add="state.phase === 'select'"
          :pending-cards="pendingCards"
          :played-this-turn-ids="playedThisTurnIds"
          @deactivate="deactivateSlot"
          @remove="removeFromSlot"
          @add="showHand = true"
          @inspect="inspectedCard = $event"
        />

        <!-- Confirm button -->
        <button
          v-if="state.phase === 'select'"
          :class="[
            'w-full py-3 rounded-lg text-sm font-bold font-display tracking-wide touch-manipulation confirm-btn',
            confirmReady
              ? 'bg-gradient-to-r from-accent-coral to-accent-amber text-bg-deep confirm-ready'
              : 'bg-bg-surface/50 text-text-dim border border-border-default/30 cursor-not-allowed',
            isConfirming ? 'confirm-press' : '',
          ]"
          :disabled="!confirmReady"
          @click="handleConfirm"
        >
          {{ locale === 'vi' ? 'Xác nhận' : 'Confirm' }}
        </button>

        <div v-else class="text-center text-text-dim text-xs py-2 processing-dots">
          {{ locale === 'vi' ? 'Đang xử lý' : 'Processing' }}
          <span class="dot-1">.</span><span class="dot-2">.</span><span class="dot-3">.</span>
        </div>
      </div>
    </div>

    <!-- Event popup -->
    <EventBanner
      v-if="state.phase === 'event' && state.currentEvents.length > 0"
      :events="state.currentEvents"
      @choose="chooseEvent"
    />

    <!-- Turn transition cutscene -->
    <TurnTransition
      v-if="state.phase === 'transition'"
      :turn="state.turn"
      :year="state.turn * 5"
      :stats="state.stats"
      :derived="derived"
      :energy="state.energy"
      @continue="dismissTransition"
    />

    <!-- Hand modal -->
    <HandPanel
      v-if="showHand && state.phase === 'select'"
      :hand="state.hand"
      :selected-ids="state.selectedIds"
      :budget="state.budget"
      :energy="state.energy"
      :food="state.food"
      :materials="state.materials"
      :knowledge="state.knowledge"
      @toggle="toggleCardSelection"
      @extra-card="spendEnergyForExtraCard"
      @close="showHand = false"
    />

    <!-- Card detail -->
    <CardDetail v-if="inspectedCard" :card="inspectedCard" @close="inspectedCard = null" />

    <!-- Tutorial -->
    <TutorialOverlay
      v-if="state.onboardingStep !== null && state.onboardingStep >= 1"
      :step="state.onboardingStep"
      @next="advanceOnboarding"
      @skip="skipOnboarding"
    />

    <!-- Screen flash on unlock -->
    <Transition name="flash">
      <div
        v-if="showFlash"
        class="fixed inset-0 z-50 pointer-events-none screen-flash"
        :style="{ backgroundColor: unlockToast?.color ?? '#fff' }"
      />
    </Transition>

    <!-- Unlock toast — dramatic -->
    <Transition name="unlock">
      <div
        v-if="unlockToast"
        class="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none unlock-burst"
      >
        <!-- Glow rings -->
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="unlock-ring ring-1" :style="{ borderColor: unlockToast.color }" />
          <div class="unlock-ring ring-2" :style="{ borderColor: unlockToast.color }" />
        </div>

        <!-- Content -->
        <div
          class="relative bg-bg-surface/95 backdrop-blur-md border rounded-xl px-6 py-4 text-center shadow-2xl unlock-card"
          :style="{ borderColor: unlockToast.color + '60' }"
        >
          <div class="flex items-center justify-center gap-2 mb-1">
            <Icon :icon="UI_LUCIDE.unlock" class="w-4 h-4" :style="{ color: unlockToast.color }" />
            <Icon
              :icon="unlockToast.icon"
              class="w-5 h-5 unlock-icon-spin"
              :style="{ color: unlockToast.color }"
            />
            <Icon :icon="UI_LUCIDE.unlock" class="w-4 h-4" :style="{ color: unlockToast.color }" />
          </div>
          <p class="text-sm font-display font-bold text-text-primary">
            {{ unlockToast.text }}
          </p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* ── Game nav buttons ───────────────────────────────────────── */
.game-nav-btn {
  font-size: 0.7rem;
  color: var(--color-text-dim);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  transition: color 0.15s;
}
.game-nav-btn:hover {
  color: var(--color-text-secondary);
}

/* ── Confirm button ─────────────────────────────────────────── */
.confirm-btn {
  transition:
    transform 0.15s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.15s ease;
}

.confirm-ready {
  animation: confirm-pulse 2s ease-in-out infinite;
}
@keyframes confirm-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(255, 107, 74, 0);
  }
  50% {
    box-shadow: 0 0 12px 3px rgba(255, 107, 74, 0.2);
  }
}

.confirm-btn:active,
.confirm-press {
  transform: scale(0.96);
  transition-duration: 0.08s;
}

/* ── Processing dots ────────────────────────────────────────── */
.processing-dots .dot-1 {
  animation: dot-bounce 1.4s ease-in-out 0s infinite;
}
.processing-dots .dot-2 {
  animation: dot-bounce 1.4s ease-in-out 0.2s infinite;
}
.processing-dots .dot-3 {
  animation: dot-bounce 1.4s ease-in-out 0.4s infinite;
}
@keyframes dot-bounce {
  0%,
  80%,
  100% {
    opacity: 0.3;
  }
  40% {
    opacity: 1;
  }
}

/* ── Screen flash ───────────────────────────────────────────── */
.screen-flash {
  animation: flash-burst 0.4s ease-out forwards;
}
@keyframes flash-burst {
  0% {
    opacity: 0.5;
  }
  100% {
    opacity: 0;
  }
}
.flash-enter-active {
  animation: flash-burst 0.4s ease-out forwards;
}
.flash-leave-active {
  display: none;
}

/* ── Unlock toast ───────────────────────────────────────────── */
.unlock-enter-active {
  animation: unlock-appear 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.unlock-leave-active {
  animation: unlock-fade 0.4s ease-in forwards;
}
@keyframes unlock-appear {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.3);
  }
  60% {
    transform: translate(-50%, -50%) scale(1.05);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}
@keyframes unlock-fade {
  0% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.9) translateY(-20px);
  }
}

/* Expanding glow rings */
.unlock-ring {
  position: absolute;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 2px solid;
  opacity: 0;
}
.ring-1 {
  animation: ring-expand 1s ease-out 0.1s forwards;
}
.ring-2 {
  animation: ring-expand 1s ease-out 0.3s forwards;
}
@keyframes ring-expand {
  0% {
    width: 40px;
    height: 40px;
    opacity: 0.6;
  }
  100% {
    width: 200px;
    height: 200px;
    opacity: 0;
  }
}

/* Card entrance */
.unlock-card {
  animation: card-slam 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes card-slam {
  0% {
    transform: scale(0.5) rotate(-3deg);
  }
  60% {
    transform: scale(1.03) rotate(1deg);
  }
  100% {
    transform: scale(1) rotate(0);
  }
}

/* Icon spin */
.unlock-icon-spin {
  animation: icon-spin-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes icon-spin-pop {
  0% {
    transform: scale(0) rotate(-180deg);
  }
  100% {
    transform: scale(1) rotate(0);
  }
}
</style>
