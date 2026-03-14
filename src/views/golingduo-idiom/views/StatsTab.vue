<script setup lang="ts">
import { computed } from 'vue'
import StreakBadge from '../components/gamification/StreakBadge.vue'
import XpBar from '../components/gamification/XpBar.vue'
import { useProgress } from '../composables/useProgress'
import { idioms } from '../data/idioms'
import { badges } from '../data/badges'

const { progress, currentLevel, nextLevel } = useProgress()

const learnedPercent = computed(() =>
  idioms.length > 0 ? Math.round((progress.value.learnedIds.length / idioms.length) * 100) : 0,
)

const recentQuizzes = computed(() => [...progress.value.quizScores].reverse().slice(0, 5))

// Streak calendar: last 30 days
const calendarDays = computed(() => {
  const days: { date: string; active: boolean }[] = []
  const today = new Date()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    days.push({
      date: dateStr,
      active:
        dateStr === progress.value.streak.lastActiveDate ||
        (progress.value.streak.current > 0 && i < progress.value.streak.current),
    })
  }
  return days
})
</script>

<template>
  <div class="space-y-6">
    <h2
      class="flex items-center gap-3 font-display text-2xl font-semibold text-text-primary animate-fade-up"
    >
      <span class="font-display text-sm tracking-widest text-accent-coral">//</span>
      Thống Kê Của Mày
    </h2>

    <!-- Streak + XP -->
    <div class="grid grid-cols-2 gap-4 animate-fade-up animate-delay-1">
      <StreakBadge :current="progress.streak.current" :longest="progress.streak.longest" />
      <XpBar
        :xp="progress.xp"
        :level-label="currentLevel.label"
        :next-level-min="nextLevel?.min ?? null"
      />
    </div>

    <!-- Learning progress circle -->
    <div
      class="border border-border-default bg-bg-surface p-6 text-center animate-fade-up animate-delay-2"
    >
      <p class="text-xs font-display tracking-widest text-accent-coral">// TIẾN ĐỘ HỌC</p>
      <div
        class="mx-auto my-4 flex size-24 items-center justify-center border-4 border-accent-coral"
      >
        <span class="font-display text-2xl font-bold text-accent-coral">{{ learnedPercent }}%</span>
      </div>
      <p class="text-sm text-text-secondary">
        {{ progress.learnedIds.length }} / {{ idioms.length }} idioms đã thuộc
      </p>
    </div>

    <!-- Streak Calendar -->
    <div class="border border-border-default bg-bg-surface p-4 animate-fade-up animate-delay-3">
      <p class="mb-3 text-xs font-display tracking-widest text-accent-amber">// LỊCH HỌC 30 NGÀY</p>
      <div class="grid grid-cols-10 gap-1">
        <div
          v-for="day in calendarDays"
          :key="day.date"
          class="aspect-square"
          :class="day.active ? 'bg-accent-coral' : 'bg-bg-elevated'"
          :title="day.date"
        />
      </div>
    </div>

    <!-- Badges -->
    <div class="border border-border-default bg-bg-surface p-4 animate-fade-up animate-delay-4">
      <p class="mb-3 text-xs font-display tracking-widest text-accent-sky">// BADGES</p>
      <div class="grid grid-cols-3 gap-3 sm:grid-cols-6">
        <div
          v-for="badge in badges"
          :key="badge.id"
          class="flex flex-col items-center gap-1 p-2 text-center"
          :class="progress.unlockedBadges.includes(badge.id) ? '' : 'opacity-30 grayscale'"
        >
          <span class="text-3xl">
            {{ progress.unlockedBadges.includes(badge.id) ? badge.emoji : '❓' }}
          </span>
          <span class="text-xs font-display text-text-secondary">{{ badge.name }}</span>
        </div>
      </div>
    </div>

    <!-- Recent quizzes -->
    <div
      v-if="recentQuizzes.length > 0"
      class="border border-border-default bg-bg-surface p-4 animate-fade-up animate-delay-5"
    >
      <p class="mb-3 text-xs font-display tracking-widest text-accent-amber">// QUIZ GẦN ĐÂY</p>
      <div class="space-y-2">
        <div
          v-for="(q, idx) in recentQuizzes"
          :key="idx"
          class="flex items-center justify-between border-b border-border-default pb-2 last:border-b-0"
        >
          <div class="text-sm">
            <span class="font-display text-text-primary">{{ q.score }}/{{ q.total }}</span>
            <span class="ml-2 text-text-dim">{{ q.mode === 'time-attack' ? '⏰' : '📝' }}</span>
          </div>
          <span class="text-xs text-text-dim">{{ q.date }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
