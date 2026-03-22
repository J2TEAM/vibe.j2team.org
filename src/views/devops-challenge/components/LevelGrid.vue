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

const DIFFICULTY_BG: Record<Difficulty, string> = {
  beginner: 'border-accent-sky/20',
  easy: 'border-green-500/20',
  medium: 'border-accent-amber/20',
  hard: 'border-accent-coral/20',
  expert: 'border-red-500/20',
}

const DIFFICULTY_HOVER: Record<Difficulty, string> = {
  beginner: 'hover:border-accent-sky/50 hover:shadow-accent-sky/5',
  easy: 'hover:border-green-500/50 hover:shadow-green-500/5',
  medium: 'hover:border-accent-amber/50 hover:shadow-accent-amber/5',
  hard: 'hover:border-accent-coral/50 hover:shadow-accent-coral/5',
  expert: 'hover:border-red-500/50 hover:shadow-red-500/5',
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

function completedCount(group: DifficultyGroup): number {
  return group.challenges.filter(
    (c) => c.id <= props.progress.unlockedLevel && (props.progress.stars[c.id] ?? 0) > 0,
  ).length
}
</script>

<template>
  <div class="space-y-8">
    <div v-for="group in groupedChallenges" :key="group.difficulty">
      <!-- Section header -->
      <div class="mb-4 flex items-center gap-3">
        <div
          class="flex items-center gap-2 border px-3 py-1 font-display text-xs font-bold tracking-wider"
          :class="[DIFFICULTY_COLORS[group.difficulty], DIFFICULTY_BG[group.difficulty]]"
        >
          {{ DIFFICULTY_LABELS[group.difficulty] }}
        </div>
        <div class="h-px flex-1 bg-border-default" />
        <span class="font-display text-xs tabular-nums text-text-dim">
          {{ completedCount(group) }}/{{ group.challenges.length }}
        </span>
      </div>

      <!-- Level cards -->
      <div class="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        <button
          v-for="challenge in group.challenges"
          :key="challenge.id"
          class="group relative border bg-bg-surface p-3 sm:p-4 text-left transition-all duration-300"
          :class="
            challenge.id <= progress.unlockedLevel
              ? [
                  'cursor-pointer hover:-translate-y-1 hover:shadow-lg active:scale-[0.98]',
                  DIFFICULTY_BG[challenge.difficulty],
                  DIFFICULTY_HOVER[challenge.difficulty],
                ]
              : 'border-border-default/30 opacity-40 cursor-not-allowed grayscale'
          "
          @click="handleSelect(challenge, challenge.id <= progress.unlockedLevel)"
        >
          <!-- Level number watermark -->
          <div
            class="absolute right-2 top-1 font-display text-3xl font-black leading-none"
            :class="
              challenge.id <= progress.unlockedLevel ? 'text-text-primary/5' : 'text-text-primary/3'
            "
          >
            {{ String(challenge.id).padStart(2, '0') }}
          </div>

          <!-- Top row: icon + stars -->
          <div class="flex items-start justify-between">
            <div
              v-if="challenge.id > progress.unlockedLevel"
              class="flex size-8 items-center justify-center border border-border-default bg-bg-deep"
            >
              <Icon icon="lucide:lock" class="size-3.5 text-text-dim" />
            </div>
            <div
              v-else
              class="flex size-8 items-center justify-center border bg-bg-deep"
              :class="DIFFICULTY_BG[challenge.difficulty]"
            >
              <Icon :icon="challenge.customerAvatar" class="size-4 text-accent-sky" />
            </div>
          </div>

          <!-- Customer name -->
          <h4 class="mt-2 text-xs sm:text-sm font-semibold text-text-primary line-clamp-1">
            {{ challenge.customerName }}
          </h4>

          <!-- Short requirement -->
          <p class="mt-1 text-[10px] sm:text-[11px] text-text-dim line-clamp-2 leading-relaxed">
            {{ challenge.requirement }}
          </p>

          <!-- Stars row -->
          <div class="mt-2 flex items-center justify-between">
            <StarRating
              v-if="challenge.id <= progress.unlockedLevel"
              :stars="getStars(challenge.id)"
              size="sm"
            />
            <span v-else class="text-[10px] text-text-dim/50 font-display">---</span>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>
