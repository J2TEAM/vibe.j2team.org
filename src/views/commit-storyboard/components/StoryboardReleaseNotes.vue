<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { ExportFormat } from '../types'

interface Props {
  draftReleaseNotes: string
  hasExportData: boolean
  isClipboardSupported: boolean
  isCsvCopied: boolean
  isJsonCopied: boolean
  isMarkdownCopied: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  'copy-format': [format: ExportFormat]
  'download-format': [format: ExportFormat]
}>()
</script>

<template>
  <section class="border border-border-default bg-bg-surface p-6 animate-fade-up animate-delay-5">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 class="mb-2 flex items-center gap-3 font-display text-2xl font-semibold">
          <span class="text-sm tracking-widest text-accent-coral">//</span>
          Draft Release Notes
        </h2>
        <p class="text-sm text-text-secondary">Export nhanh theo Markdown, JSON hoặc CSV để chia sẻ với team.</p>
      </div>

      <p class="border border-border-default px-3 py-1 text-xs text-text-dim">Export center</p>
    </div>

    <div class="mt-4 grid gap-3 md:grid-cols-3">
      <article class="border border-border-default bg-bg-deep p-3">
        <p class="font-display text-sm text-text-primary">Markdown (.md)</p>
        <div class="mt-3 flex gap-2">
          <button
            type="button"
            class="inline-flex items-center gap-2 border border-border-default px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-accent-coral hover:text-text-primary"
            :disabled="!isClipboardSupported || !hasExportData"
            @click="emit('copy-format', 'markdown')"
          >
            <Icon icon="lucide:clipboard" class="size-4" />
            {{ isMarkdownCopied ? 'Đã copy' : 'Copy' }}
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-2 border border-border-default px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-accent-amber hover:text-text-primary"
            :disabled="!hasExportData"
            @click="emit('download-format', 'markdown')"
          >
            <Icon icon="lucide:download" class="size-4" />
            Tải
          </button>
        </div>
      </article>

      <article class="border border-border-default bg-bg-deep p-3">
        <p class="font-display text-sm text-text-primary">JSON (.json)</p>
        <div class="mt-3 flex gap-2">
          <button
            type="button"
            class="inline-flex items-center gap-2 border border-border-default px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-accent-coral hover:text-text-primary"
            :disabled="!isClipboardSupported || !hasExportData"
            @click="emit('copy-format', 'json')"
          >
            <Icon icon="lucide:clipboard" class="size-4" />
            {{ isJsonCopied ? 'Đã copy' : 'Copy' }}
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-2 border border-border-default px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-accent-amber hover:text-text-primary"
            :disabled="!hasExportData"
            @click="emit('download-format', 'json')"
          >
            <Icon icon="lucide:download" class="size-4" />
            Tải
          </button>
        </div>
      </article>

      <article class="border border-border-default bg-bg-deep p-3">
        <p class="font-display text-sm text-text-primary">CSV (.csv)</p>
        <div class="mt-3 flex gap-2">
          <button
            type="button"
            class="inline-flex items-center gap-2 border border-border-default px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-accent-coral hover:text-text-primary"
            :disabled="!isClipboardSupported || !hasExportData"
            @click="emit('copy-format', 'csv')"
          >
            <Icon icon="lucide:clipboard" class="size-4" />
            {{ isCsvCopied ? 'Đã copy' : 'Copy' }}
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-2 border border-border-default px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-accent-amber hover:text-text-primary"
            :disabled="!hasExportData"
            @click="emit('download-format', 'csv')"
          >
            <Icon icon="lucide:download" class="size-4" />
            Tải
          </button>
        </div>
      </article>
    </div>

    <textarea
      :value="draftReleaseNotes"
      rows="14"
      readonly
      class="mt-4 w-full border border-border-default bg-bg-deep px-3 py-2 font-mono text-sm text-text-primary outline-none"
      placeholder="Release notes sẽ xuất hiện ở đây"
    />
  </section>
</template>
