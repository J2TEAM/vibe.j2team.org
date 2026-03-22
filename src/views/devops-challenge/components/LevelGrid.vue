<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import type { Challenge, GameProgress, Difficulty } from '../types'
import { DIFFICULTY_COLORS, DIFFICULTY_LABELS } from '../types'
import StarRating from './StarRating.vue'

const props = defineProps<{
  challenges: Challenge[]
  progress: GameProgress
}>()

const emit = defineEmits<{
  selectLevel: [levelId: number]
}>()

interface DifficultyGroup {
  difficulty: Difficulty
  challenges: Challenge[]
}

const groupedChallenges = computed<DifficultyGroup[]>(() => {
  const order: Difficulty[] = ['beginner', 'easy', 'medium', 'hard', 'expert']
  const map = new Map<Difficulty, Challenge[]>()
  for (const c of props.challenges) {
    const list = map.get(c.difficulty)
    if (list) {
      list.push(c)
    } else {
      map.set(c.difficulty, [c])
    }
  }
  return order.filter((d) => map.has(d)).map((d) => ({ difficulty: d, challenges: map.get(d)! }))
})

function getStars(challengeId: number): 0 | 1 | 2 | 3 {
  const s = props.progress.stars[challengeId] ?? 0
  return Math.min(3, Math.max(0, s)) as 0 | 1 | 2 | 3
}

function handleSelect(challenge: Challenge, unlocked: boolean) {
  if (unlocked) {
    emit('selectLevel', challenge.id)
  }
}
</script>

<template>
  <div class="space-y-6">
    <div v-for="group in groupedChallenges" :key="group.difficulty">
      <!-- Section header -->
      <div class="mb-3 flex items-center gap-2">
        <span
          class="font-display text-xs font-semibold tracking-wider"
          :class="DIFFICULTY_COLORS[group.difficulty]"
        >
          {{ DIFFICULTY_LABELS[group.difficulty] }}
        </span>
        <div class="h-px flex-1 bg-border-default" />
        <span class="text-xs text-text-dim"> {{ group.challenges.length }} level </span>
      </div>

      <!-- Level cards -->
      <div class="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        <button
          v-for="challenge in group.challenges"
          :key="challenge.id"
          class="group relative border bg-bg-surface p-3 sm:p-4 text-left transition-all duration-300"
          :class="
            challenge.id <= progress.unlockedLevel
              ? 'border-border-default hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated cursor-pointer'
              : 'border-border-default/50 opacity-50 cursor-not-allowed'
          "
          @click="handleSelect(challenge, challenge.id <= progress.unlockedLevel)"
        >
          <!-- Level number -->
          <div
            class="absolute right-2 top-2 font-display text-2xl sm:text-3xl font-bold text-bg-elevated"
          >
            {{ challenge.id }}
          </div>

          <!-- Lock / avatar icon -->
          <Icon
            v-if="challenge.id > progress.unlockedLevel"
            icon="lucide:lock"
            class="size-4 sm:size-5 text-text-dim"
          />
          <Icon v-else :icon="challenge.customerAvatar" class="size-4 sm:size-5 text-accent-sky" />

          <!-- Customer name -->
          <h4 class="mt-2 text-xs sm:text-sm font-semibold text-text-primary line-clamp-1">
            {{ challenge.customerName }}
          </h4>

          <!-- Short requirement -->
          <p class="mt-1 text-[11px] sm:text-xs text-text-secondary line-clamp-2 leading-relaxed">
            {{ challenge.requirement }}
          </p>

          <!-- Stars -->
          <div class="mt-2 sm:mt-3">
            <StarRating
              v-if="challenge.id <= progress.unlockedLevel"
              :stars="getStars(challenge.id)"
              size="sm"
            />
          </div>
        </button>
      </div>
    </div>
  </div>
</template>
