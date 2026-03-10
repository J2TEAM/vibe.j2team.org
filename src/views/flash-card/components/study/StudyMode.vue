<script setup lang="ts">
import { shallowRef, ref, computed, onMounted, watch } from 'vue'
import type { Card, StudyConfig, StudySession } from '../../types'
import { getCardsBySet } from '../../services/card-service'
import { getSetById } from '../../services/set-service'
import { createSession, completeSession } from '../../services/session-service'
import { useStudy } from '../../composables/use-study'
import { useSwipe } from '../../composables/use-swipe'
import { useKeyboard } from '../../composables/use-keyboard'
import { useNavigation } from '../../composables/use-navigation'
import FlipCard from './FlipCard.vue'
import StudyControls from './StudyControls.vue'
import StudyProgress from './StudyProgress.vue'
import RoundCompleteOverlay from './RoundCompleteOverlay.vue'

const props = defineProps<{
  folderId?: string
  setId?: string
  config: StudyConfig
}>()

const { goToStudyComplete } = useNavigation()

const cards = ref<Card[]>([])
const setName = ref('')
const isLoading = ref(true)
const session = shallowRef<StudySession | null>(null)
const cardRef = ref<HTMLElement | null>(null)

const study = shallowRef<ReturnType<typeof useStudy> | null>(null)

function handleSwipeRight() {
  study.value?.answerCorrect()
}

function handleSwipeLeft() {
  study.value?.answerIncorrect()
}

const { offsetX, wasDragged, triggerSwipe } = useSwipe(cardRef, {
  onSwipeRight: handleSwipeRight,
  onSwipeLeft: handleSwipeLeft,
})

const swipeIndicatorOpacity = computed(() => Math.min(1, Math.abs(offsetX.value) / 120))
const swipeDirection = computed<'left' | 'right' | null>(() => {
  if (Math.abs(offsetX.value) < 20) return null
  return offsetX.value > 0 ? 'right' : 'left'
})

onMounted(async () => {
  if (!props.setId) return

  const [set, loadedCards] = await Promise.all([
    getSetById(props.setId),
    getCardsBySet(props.setId),
  ])
  setName.value = set?.name ?? ''
  cards.value = loadedCards

  if (cards.value.length === 0) return

  session.value = await createSession(props.setId)
  study.value = useStudy(cards.value, props.config)
  isLoading.value = false
})

watch(
  () => study.value?.status.value,
  async (newStatus) => {
    if (newStatus === 'completed' && session.value && study.value) {
      const stats = study.value.sessionStats.value
      await completeSession(session.value, stats.cardsReviewed, stats.cardsCorrect)
      if (props.folderId && props.setId) {
        goToStudyComplete(props.folderId, props.setId)
      }
    }
  },
)

function handleFlip() {
  // Don't flip if user just finished dragging
  if (wasDragged.value) return
  study.value?.flip()
}

function handleCorrect() {
  triggerSwipe('right')
}

function handleIncorrect() {
  triggerSwipe('left')
}

function handleUndo() {
  study.value?.undo()
}

useKeyboard({
  onFlip: handleFlip,
  onRight: handleCorrect,
  onLeft: handleIncorrect,
  onUndo: handleUndo,
})
</script>

<template>
  <div class="animate-fade-up animate-delay-1">
    <div v-if="isLoading" class="text-center py-20">
      <p class="text-text-secondary">Đang tải...</p>
    </div>

    <template v-else-if="study">
      <div class="text-center mb-6">
        <h2 class="font-display text-xl font-semibold text-text-primary">{{ setName }}</h2>
      </div>

      <StudyProgress
        :round="study.progress.value.round"
        :remaining="study.progress.value.remaining"
        :total="study.progress.value.total"
        class="mb-8"
      />

      <div class="mb-8 relative" v-if="study.currentCard.value">
        <!-- Swipe indicators (outside cardRef so they don't fly off) -->
        <div
          v-if="swipeDirection === 'right'"
          class="absolute inset-0 z-10 flex items-center justify-center pointer-events-none max-w-lg mx-auto aspect-[3/2]"
          :style="{ opacity: swipeIndicatorOpacity }"
        >
          <div class="absolute inset-0 border-2 border-accent-sky bg-accent-sky/5" />
          <span class="relative font-display text-xl font-bold text-accent-sky tracking-wide">
            ĐÃ NHỚ
          </span>
        </div>
        <div
          v-if="swipeDirection === 'left'"
          class="absolute inset-0 z-10 flex items-center justify-center pointer-events-none max-w-lg mx-auto aspect-[3/2]"
          :style="{ opacity: swipeIndicatorOpacity }"
        >
          <div class="absolute inset-0 border-2 border-accent-coral bg-accent-coral/5" />
          <span class="relative font-display text-xl font-bold text-accent-coral tracking-wide">
            CHƯA NHỚ
          </span>
        </div>

        <!-- Card (this element flies off on swipe) -->
        <div ref="cardRef">
          <FlipCard
            :key="study.currentCard.value.id"
            :front="study.currentCard.value.front"
            :back="study.currentCard.value.back"
            :show-front-first="study.showFrontFirst.value"
            :is-flipped="study.isFlipped.value"
            :offset-x="offsetX"
            @flip="handleFlip"
          />
        </div>
      </div>

      <StudyControls
        :can-undo="study.canUndo.value"
        @flip="handleFlip"
        @correct="handleCorrect"
        @incorrect="handleIncorrect"
        @undo="handleUndo"
      />

      <RoundCompleteOverlay
        v-if="study.roundCompleted.value"
        :round="study.roundCompleted.value"
        @dismiss="study.dismissRoundComplete()"
      />
    </template>
  </div>
</template>
