<script setup lang="ts">
import { ref, watch } from 'vue'
import { useHead } from '@unhead/vue'
import AppHeader from './components/layout/AppHeader.vue'
import AppFooter from './components/layout/AppFooter.vue'
import HomeTab from './views/HomeTab.vue'
import QuizTab from './views/QuizTab.vue'
import CollectionTab from './views/CollectionTab.vue'
import SpinTab from './views/SpinTab.vue'
import StatsTab from './views/StatsTab.vue'
import BadgeUnlock from './components/gamification/BadgeUnlock.vue'
import { useProgress } from './composables/useProgress'
import { badges } from './data/badges'
import type { Badge } from './data/types'

useHead({
  title: 'GolingDuo Idiom 🦜 — Học thành ngữ kiểu lầy',
})

type TabId = 'home' | 'quiz' | 'collection' | 'spin' | 'stats'
const activeTab = ref<TabId>('home')

const { progress, checkBadges } = useProgress()

const newBadge = ref<Badge | null>(null)

// Check for new badges whenever progress changes
watch(
  () => progress.value.learnedIds.length + progress.value.xp + progress.value.spinHistory.length,
  () => {
    const newIds = checkBadges()
    if (newIds.length > 0) {
      const badge = badges.find((b) => b.id === newIds[0])
      if (badge) newBadge.value = badge
    }
  },
)
</script>

<template>
  <div class="min-h-screen bg-bg-deep font-body">
    <AppHeader
      :active-tab="activeTab"
      :streak="progress.streak.current"
      :xp="progress.xp"
      @update:active-tab="(tab) => (activeTab = tab as TabId)"
    />

    <main class="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <HomeTab v-if="activeTab === 'home'" />
      <QuizTab v-else-if="activeTab === 'quiz'" @go-home="activeTab = 'home'" />
      <CollectionTab v-else-if="activeTab === 'collection'" />
      <SpinTab v-else-if="activeTab === 'spin'" />
      <StatsTab v-else-if="activeTab === 'stats'" />
    </main>

    <AppFooter />

    <!-- Badge unlock popup -->
    <BadgeUnlock :badge="newBadge" />
  </div>
</template>
