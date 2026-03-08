<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import type { StudyConfig } from './types'
import { useDb } from './composables/use-db'
import { useNavigation } from './composables/use-navigation'
import FolderList from './components/folders/FolderList.vue'
import SetList from './components/sets/SetList.vue'
import CardEditor from './components/cards/CardEditor.vue'
import StudyConfigVue from './components/study/StudyConfig.vue'
import StudyMode from './components/study/StudyMode.vue'
import CompletionScreen from './components/study/CompletionScreen.vue'

const { isReady, error } = useDb()
const { currentView, currentFolderId, currentSetId, breadcrumbs, goToStudy } = useNavigation()

const studyConfig = ref<StudyConfig>({ cardSide: 'front', cardOrder: 'sequential' })

function handleStudyStart(config: StudyConfig) {
  studyConfig.value = config
  if (currentFolderId.value && currentSetId.value) {
    goToStudy(currentFolderId.value, currentSetId.value)
  }
}

const viewComponent = computed(() => {
  const map: Record<string, object> = {
    'folder-list': FolderList,
    'set-list': SetList,
    'card-editor': CardEditor,
    'study-config': StudyConfigVue,
    'study-mode': StudyMode,
    'study-complete': CompletionScreen,
  }
  return map[currentView.value] ?? FolderList
})
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body overflow-x-hidden">
    <div class="max-w-5xl mx-auto px-6 py-8">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8 animate-fade-up">
        <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
          <RouterLink
            to="/"
            class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary shrink-0"
          >
            &larr; Về trang chủ
          </RouterLink>

          <template v-for="(crumb, i) in breadcrumbs" :key="i">
            <span class="text-text-dim">/</span>
            <button
              v-if="crumb.action"
              class="text-sm text-text-secondary hover:text-accent-coral transition-colors truncate max-w-40 sm:max-w-none"
              @click="crumb.action"
            >
              {{ crumb.label }}
            </button>
            <span v-else class="text-sm text-text-secondary truncate max-w-40 sm:max-w-none">{{
              crumb.label
            }}</span>
          </template>
        </div>
      </div>

      <!-- Error state -->
      <div v-if="error" class="text-center py-20 animate-fade-up animate-delay-1">
        <p class="text-accent-coral text-lg font-display">{{ error }}</p>
      </div>

      <!-- Loading state -->
      <div v-else-if="!isReady" class="text-center py-20 animate-fade-up animate-delay-1">
        <p class="text-text-secondary">Đang tải...</p>
      </div>

      <!-- Study config (needs special handling for start event) -->
      <StudyConfigVue
        v-else-if="currentView === 'study-config'"
        :folder-id="currentFolderId"
        :set-id="currentSetId"
        @start="handleStudyStart"
      />

      <!-- Study mode (needs config prop) -->
      <StudyMode
        v-else-if="currentView === 'study-mode'"
        :folder-id="currentFolderId"
        :set-id="currentSetId"
        :config="studyConfig"
      />

      <!-- All other views -->
      <component v-else :is="viewComponent" :folder-id="currentFolderId" :set-id="currentSetId" />
    </div>
  </div>
</template>
