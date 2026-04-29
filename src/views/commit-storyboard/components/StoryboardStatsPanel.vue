<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { CommitKind, ReleaseRisk, TypeBreakdownItem } from '../types'

interface Props {
  breakingCount: number
  commitsCount: number
  copied: boolean
  copyDisabled: boolean
  kindLabel: Record<CommitKind, string>
  releaseRisk: ReleaseRisk
  typeBreakdown: TypeBreakdownItem[]
}

defineProps<Props>()

const emit = defineEmits<{
  copyDraft: []
}>()
</script>

<template>
  <article class="border border-border-default bg-bg-surface p-6 animate-fade-up animate-delay-3">
    <h2 class="mb-5 flex items-center gap-3 font-display text-2xl font-semibold">
      <span class="text-sm tracking-widest text-accent-amber">//</span>
      Story Stats
    </h2>

    <div class="grid gap-3 sm:grid-cols-2">
      <div class="border border-border-default bg-bg-deep p-4">
        <p class="text-xs uppercase tracking-widest text-text-dim">Commits</p>
        <p class="mt-2 font-display text-3xl font-bold text-accent-coral">{{ commitsCount }}</p>
      </div>
      <div class="border border-border-default bg-bg-deep p-4">
        <p class="text-xs uppercase tracking-widest text-text-dim">Breaking</p>
        <p class="mt-2 font-display text-3xl font-bold text-accent-amber">{{ breakingCount }}</p>
      </div>
    </div>

    <div class="mt-4 border border-border-default bg-bg-deep p-4">
      <p class="text-xs uppercase tracking-widest text-text-dim">Release risk</p>
      <p class="mt-2 font-display text-xl font-semibold text-accent-sky">{{ releaseRisk.label }}</p>
      <p class="mt-1 text-sm text-text-secondary">{{ releaseRisk.hint }}</p>
    </div>

    <div class="mt-4 border border-border-default bg-bg-deep p-4">
      <p class="text-xs uppercase tracking-widest text-text-dim">Type breakdown</p>
      <ul class="mt-3 grid gap-2 text-sm text-text-secondary">
        <li
          v-for="item in typeBreakdown"
          :key="item.kind"
          class="flex items-center justify-between border border-border-default px-3 py-2"
        >
          <span>{{ kindLabel[item.kind] }}</span>
          <span class="font-display text-text-primary">{{ item.count }}</span>
        </li>
      </ul>
    </div>

    <button
      type="button"
      class="mt-4 inline-flex w-full items-center justify-center gap-2 border border-border-default px-4 py-2 text-sm text-text-secondary transition-colors hover:border-accent-coral hover:text-text-primary"
      :disabled="copyDisabled"
      @click="emit('copyDraft')"
    >
      <Icon icon="lucide:clipboard" class="size-4" />
      {{ copied ? 'Đã copy release draft' : 'Copy release draft' }}
    </button>
  </article>
</template>
