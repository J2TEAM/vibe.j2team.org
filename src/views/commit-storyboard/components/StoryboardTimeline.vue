<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { ParsedCommit, StoryChapter } from '../types'
import { formatCommitLine } from '../utils/commit-parser'

interface Props {
  includeHash: boolean
  storyChapters: StoryChapter[]
}

const props = defineProps<Props>()

function displayCommitLine(commit: ParsedCommit): string {
  return formatCommitLine(commit, props.includeHash)
}
</script>

<template>
  <section class="border border-border-default bg-bg-surface p-6 animate-fade-up animate-delay-4">
    <h2 class="mb-5 flex items-center gap-3 font-display text-2xl font-semibold">
      <span class="text-sm tracking-widest text-accent-sky">//</span>
      Storyboard Timeline
    </h2>

    <p v-if="storyChapters.length === 0" class="text-sm text-text-secondary">
      Chưa có commit để kể chuyện. Thử paste git log --oneline hoặc bấm "Tải sample log".
    </p>

    <ol v-else class="grid gap-4">
      <li
        v-for="chapter in storyChapters"
        :key="chapter.id"
        class="border border-border-default bg-bg-deep p-4"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="flex items-center gap-2 font-display text-lg font-semibold">
              <Icon :icon="chapter.icon" class="size-5 text-accent-amber" />
              {{ chapter.title }}
            </p>
            <p class="mt-1 text-sm text-text-secondary">{{ chapter.note }}</p>
          </div>
          <span class="border border-border-default px-2 py-1 text-xs text-text-dim"> {{ chapter.commits.length }} commits </span>
        </div>

        <ul class="mt-3 grid gap-2 text-sm text-text-secondary">
          <li
            v-for="commit in chapter.commits"
            :key="commit.raw"
            class="border border-border-default px-3 py-2"
          >
            <span class="text-text-primary">{{ displayCommitLine(commit) }}</span>
            <span v-if="commit.breaking" class="ml-2 text-xs font-semibold text-accent-coral">BREAKING</span>
          </li>
        </ul>
      </li>
    </ol>
  </section>
</template>
