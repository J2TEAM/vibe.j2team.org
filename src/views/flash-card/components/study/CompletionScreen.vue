<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { CardSet } from '../../types'
import { getSetById } from '../../services/set-service'
import { getSessionsBySet } from '../../services/session-service'
import { getCardsBySet } from '../../services/card-service'
import { useNavigation } from '../../composables/use-navigation'
import type { CardLevel } from '../../types'

const props = defineProps<{
  folderId?: string
  setId?: string
}>()

const { goToEditor, goToStudyConfig } = useNavigation()

const set = ref<CardSet | undefined>()
const totalCards = ref(0)
const timeSpent = ref(0)
const cardsReviewed = ref(0)
const cardsCorrect = ref(0)
const levelBreakdown = ref<Record<CardLevel, number>>({ 0: 0, 1: 0, 2: 0, 3: 0 })

onMounted(async () => {
  if (!props.setId) return
  set.value = await getSetById(props.setId)

  const cards = await getCardsBySet(props.setId)
  totalCards.value = cards.length

  const breakdown: Record<CardLevel, number> = { 0: 0, 1: 0, 2: 0, 3: 0 }
  for (const card of cards) {
    breakdown[card.level]++
  }
  levelBreakdown.value = breakdown

  const sessions = await getSessionsBySet(props.setId)
  const lastSession = sessions[0]
  if (lastSession) {
    cardsReviewed.value = lastSession.cardsReviewed
    cardsCorrect.value = lastSession.cardsCorrect
    if (lastSession.completedAt && lastSession.startedAt) {
      timeSpent.value = lastSession.completedAt - lastSession.startedAt
    }
  }
})

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function accuracy(): number {
  if (cardsReviewed.value === 0) return 0
  return Math.round((cardsCorrect.value / cardsReviewed.value) * 100)
}
</script>

<template>
  <div class="max-w-md mx-auto text-center animate-fade-up animate-delay-1">
    <div class="text-6xl mb-4">🎉</div>
    <h2 class="font-display text-3xl font-bold text-accent-coral mb-2">Hoàn thành!</h2>
    <p class="text-text-secondary mb-8">{{ set?.name }}</p>

    <!-- Stats grid -->
    <div class="grid grid-cols-2 gap-4 mb-8">
      <div class="border border-border-default bg-bg-surface p-4">
        <p class="text-text-dim text-xs font-display tracking-wide mb-1">TỔNG THẺ</p>
        <p class="font-display text-2xl font-bold text-text-primary">{{ totalCards }}</p>
      </div>
      <div class="border border-border-default bg-bg-surface p-4">
        <p class="text-text-dim text-xs font-display tracking-wide mb-1">THỜI GIAN</p>
        <p class="font-display text-2xl font-bold text-text-primary">{{ formatTime(timeSpent) }}</p>
      </div>
      <div class="border border-border-default bg-bg-surface p-4">
        <p class="text-text-dim text-xs font-display tracking-wide mb-1">LƯỢT LUYỆN</p>
        <p class="font-display text-2xl font-bold text-text-primary">{{ cardsReviewed }}</p>
      </div>
      <div class="border border-border-default bg-bg-surface p-4">
        <p class="text-text-dim text-xs font-display tracking-wide mb-1">ĐỘ CHÍNH XÁC</p>
        <p class="font-display text-2xl font-bold text-accent-sky">{{ accuracy() }}%</p>
      </div>
    </div>

    <!-- Level breakdown -->
    <div class="border border-border-default bg-bg-surface p-5 mb-8 text-left">
      <p class="font-display text-sm font-semibold text-text-primary mb-3">Phân bổ mức độ</p>
      <div class="space-y-2">
        <div class="flex items-center gap-3 text-sm">
          <span class="w-16 text-accent-sky font-display text-xs">Thuộc</span>
          <div class="flex-1 h-2 bg-bg-elevated overflow-hidden">
            <div
              class="h-full bg-accent-sky"
              :style="{
                width: totalCards > 0 ? `${(levelBreakdown[3] / totalCards) * 100}%` : '0%',
              }"
            />
          </div>
          <span class="text-text-dim text-xs w-8 text-right">{{ levelBreakdown[3] }}</span>
        </div>
        <div class="flex items-center gap-3 text-sm">
          <span class="w-16 text-accent-amber font-display text-xs">Lv.2</span>
          <div class="flex-1 h-2 bg-bg-elevated overflow-hidden">
            <div
              class="h-full bg-accent-amber"
              :style="{
                width: totalCards > 0 ? `${(levelBreakdown[2] / totalCards) * 100}%` : '0%',
              }"
            />
          </div>
          <span class="text-text-dim text-xs w-8 text-right">{{ levelBreakdown[2] }}</span>
        </div>
        <div class="flex items-center gap-3 text-sm">
          <span class="w-16 text-accent-coral font-display text-xs">Lv.1</span>
          <div class="flex-1 h-2 bg-bg-elevated overflow-hidden">
            <div
              class="h-full bg-accent-coral"
              :style="{
                width: totalCards > 0 ? `${(levelBreakdown[1] / totalCards) * 100}%` : '0%',
              }"
            />
          </div>
          <span class="text-text-dim text-xs w-8 text-right">{{ levelBreakdown[1] }}</span>
        </div>
        <div class="flex items-center gap-3 text-sm">
          <span class="w-16 text-text-dim font-display text-xs">Mới</span>
          <div class="flex-1 h-2 bg-bg-elevated overflow-hidden">
            <div
              class="h-full bg-text-dim"
              :style="{
                width: totalCards > 0 ? `${(levelBreakdown[0] / totalCards) * 100}%` : '0%',
              }"
            />
          </div>
          <span class="text-text-dim text-xs w-8 text-right">{{ levelBreakdown[0] }}</span>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex items-center justify-center gap-4">
      <button
        class="px-6 py-3 text-sm border border-accent-coral bg-accent-coral/10 text-accent-coral font-semibold transition hover:bg-accent-coral hover:text-bg-deep"
        @click="goToStudyConfig(folderId!, setId!, undefined, set?.name)"
      >
        Học lại
      </button>
      <button
        class="px-6 py-3 text-sm border border-border-default text-text-secondary font-semibold transition hover:border-accent-coral hover:text-text-primary"
        @click="goToEditor(folderId!, setId!, undefined, set?.name)"
      >
        Về bộ thẻ
      </button>
    </div>
  </div>
</template>
