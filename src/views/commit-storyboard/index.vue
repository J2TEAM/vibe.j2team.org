<script setup lang="ts">
import { computed } from 'vue'
import StoryboardCommandGuide from './components/StoryboardCommandGuide.vue'
import StoryboardHeader from './components/StoryboardHeader.vue'
import StoryboardInputPanel from './components/StoryboardInputPanel.vue'
import StoryboardReleaseNotes from './components/StoryboardReleaseNotes.vue'
import StoryboardStatsPanel from './components/StoryboardStatsPanel.vue'
import StoryboardTimeline from './components/StoryboardTimeline.vue'
import { KIND_LABEL } from './constants'
import { useCommitStoryboard } from './composables/useCommitStoryboard'

const {
  breakingCount,
  clearLog,
  copyExport,
  copyDraft,
  draftReleaseNotes,
  downloadExport,
  hasExportData,
  includeHash,
  isCsvCopied,
  isClipboardSupported,
  isDraftCopied,
  isJsonCopied,
  isMarkdownCopied,
  logInput,
  parsedCommits,
  releaseDate,
  releaseRisk,
  restoreSample,
  storyChapters,
  typeBreakdown,
  versionTag,
} = useCommitStoryboard()

const isCopyDisabled = computed(() => draftReleaseNotes.value.length === 0 || !isClipboardSupported.value)
</script>

<template>
  <div class="min-h-screen bg-bg-deep px-4 py-10 text-text-primary">
    <div class="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <StoryboardHeader @clear-log="clearLog" @restore-sample="restoreSample" />

      <StoryboardCommandGuide />

      <section class="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <StoryboardInputPanel
          v-model:include-hash="includeHash"
          v-model:log-input="logInput"
          v-model:release-date="releaseDate"
          v-model:version-tag="versionTag"
        />

        <StoryboardStatsPanel
          :breaking-count="breakingCount"
          :commits-count="parsedCommits.length"
          :copied="isDraftCopied"
          :copy-disabled="isCopyDisabled"
          :kind-label="KIND_LABEL"
          :release-risk="releaseRisk"
          :type-breakdown="typeBreakdown"
          @copy-draft="copyDraft"
        />
      </section>

      <StoryboardTimeline :include-hash="includeHash" :story-chapters="storyChapters" />

      <StoryboardReleaseNotes
        :draft-release-notes="draftReleaseNotes"
        :has-export-data="hasExportData"
        :is-clipboard-supported="isClipboardSupported"
        :is-csv-copied="isCsvCopied"
        :is-json-copied="isJsonCopied"
        :is-markdown-copied="isMarkdownCopied"
        @copy-format="copyExport"
        @download-format="downloadExport"
      />
    </div>
  </div>
</template>
