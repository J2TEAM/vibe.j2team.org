<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  includeHash: boolean
  logInput: string
  releaseDate: string
  versionTag: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:includeHash': [value: boolean]
  'update:logInput': [value: string]
  'update:releaseDate': [value: string]
  'update:versionTag': [value: string]
}>()

const versionTagModel = computed({
  get: () => props.versionTag,
  set: (value: string) => emit('update:versionTag', value),
})

const releaseDateModel = computed({
  get: () => props.releaseDate,
  set: (value: string) => emit('update:releaseDate', value),
})

const includeHashModel = computed({
  get: () => props.includeHash,
  set: (value: boolean) => emit('update:includeHash', value),
})

const logInputModel = computed({
  get: () => props.logInput,
  set: (value: string) => emit('update:logInput', value),
})
</script>

<template>
  <article class="border border-border-default bg-bg-surface p-6 animate-fade-up animate-delay-2">
    <h2 class="mb-5 flex items-center gap-3 font-display text-2xl font-semibold">
      <span class="text-sm tracking-widest text-accent-coral">//</span>
      Input
    </h2>

    <div class="grid gap-3 sm:grid-cols-2">
      <label class="flex flex-col gap-2 text-sm text-text-secondary">
        Version
        <input
          v-model="versionTagModel"
          type="text"
          class="border border-border-default bg-bg-deep px-3 py-2 text-text-primary outline-none transition-colors focus:border-accent-coral"
          placeholder="v0.1.0"
        >
      </label>
      <label class="flex flex-col gap-2 text-sm text-text-secondary">
        Release date
        <input
          v-model="releaseDateModel"
          type="date"
          class="border border-border-default bg-bg-deep px-3 py-2 text-text-primary outline-none transition-colors focus:border-accent-coral"
        >
      </label>
    </div>

    <label class="mt-4 inline-flex items-center gap-2 text-sm text-text-secondary">
      <input
        v-model="includeHashModel"
        type="checkbox"
        class="size-4 border border-border-default bg-bg-deep accent-accent-coral"
      >
      Hiển thị commit hash trong draft
    </label>

    <label class="mt-4 flex flex-col gap-2 text-sm text-text-secondary">
      Commit log
      <textarea
        v-model="logInputModel"
        rows="16"
        class="resize-y border border-border-default bg-bg-deep px-3 py-2 font-mono text-sm text-text-primary outline-none transition-colors focus:border-accent-coral"
        placeholder="Paste git log --oneline vào đây"
      />
    </label>
  </article>
</template>
