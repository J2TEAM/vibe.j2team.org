<script setup lang="ts">
import { computed } from 'vue'
import IdiomOfDay from '../components/flashcard/IdiomOfDay.vue'
import FlipCardDeck from '../components/flashcard/FlipCardDeck.vue'
import StreakBadge from '../components/gamification/StreakBadge.vue'
import XpBar from '../components/gamification/XpBar.vue'
import { useIdiomOfDay } from '../composables/useIdiomOfDay'
import { useProgress } from '../composables/useProgress'
import { idioms } from '../data/idioms'

const { idiomOfDay } = useIdiomOfDay()
const { progress, markLearned, unmarkLearned, currentLevel, nextLevel } = useProgress()

const unlearnedIdioms = computed(() =>
  idioms.filter((i) => !progress.value.learnedIds.includes(i.id)),
)
</script>

<template>
  <div class="space-y-6">
    <!-- Streak + XP summary -->
    <div class="grid grid-cols-2 gap-4 animate-fade-up">
      <StreakBadge :current="progress.streak.current" :longest="progress.streak.longest" />
      <XpBar
        :xp="progress.xp"
        :level-label="currentLevel.label"
        :next-level-min="nextLevel?.min ?? null"
      />
    </div>

    <!-- Idiom of the Day -->
    <section class="animate-fade-up animate-delay-2">
      <h2
        class="mb-4 flex items-center gap-3 font-display text-2xl font-semibold text-text-primary"
      >
        <span class="font-display text-sm tracking-widest text-accent-coral">//</span>
        Flex Của Ngày
      </h2>
      <IdiomOfDay :idiom="idiomOfDay" />
    </section>

    <!-- Flashcard Deck -->
    <section class="animate-fade-up animate-delay-4">
      <h2
        class="mb-4 flex items-center gap-3 font-display text-2xl font-semibold text-text-primary"
      >
        <span class="font-display text-sm tracking-widest text-accent-coral">//</span>
        Học Idiom Mới
      </h2>
      <p v-if="unlearnedIdioms.length === 0" class="text-center py-8 text-text-secondary">
        🎉 Tuyệt vời! Mày đã học hết tất cả idioms rồi!
      </p>
      <FlipCardDeck
        v-else
        :idioms="unlearnedIdioms"
        :learned-ids="progress.learnedIds"
        @learned="markLearned"
        @relearn="unmarkLearned"
      />
    </section>
  </div>
</template>
