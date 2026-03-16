<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import { useChillI18n } from '../../composables/useChillI18n'
import { backgroundOptions } from '../../data/backgrounds'

const store = useWorkspaceStore()
const { t } = useChillI18n()

function select(bg: { url: string; type: 'image' | 'gif' | 'video' }) {
  store.setBackground(bg.url, bg.type)
}
</script>

<template>
  <div
    class="border border-border-default bg-bg-surface p-4 transition-all duration-300 hover:border-accent-sky/50"
  >
    <p class="text-text-secondary text-sm mb-4">
      {{ t.visualsDescription }}
    </p>
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <button
        v-for="bg in backgroundOptions"
        :key="bg.id"
        type="button"
        :class="[
          'relative block w-full overflow-hidden border-2 transition text-left',
          store.background === bg.url
            ? 'border-accent-sky'
            : 'border-border-default hover:border-accent-sky/50',
        ]"
        @click="select(bg)"
      >
        <template v-if="bg.type === 'video'">
          <video
            :src="bg.url"
            class="h-24 w-full object-cover"
            muted
            loop
            playsinline
            preload="metadata"
          />
        </template>
        <div
          v-else
          class="h-24 w-full bg-cover bg-center"
          :style="{ backgroundImage: `url(${bg.thumb || bg.url})` }"
        />
        <span
          class="absolute bottom-0 left-0 right-0 bg-bg-deep/90 px-2 py-1 font-display text-xs text-text-primary"
        >
          {{ t.backgroundNames[bg.id] ?? bg.name }}
        </span>
        <span
          v-if="bg.type === 'video'"
          class="absolute top-1 right-1 rounded bg-bg-deep/80 px-1.5 py-0.5 text-[10px] text-text-dim"
        >
          <Icon icon="lucide:video" class="size-3 inline" />
        </span>
      </button>
    </div>
    <button
      type="button"
      class="mt-3 flex items-center gap-2 border border-border-default px-3 py-2 text-xs text-text-dim transition hover:border-accent-coral hover:text-text-primary"
      @click="store.clearBackground()"
    >
      <Icon icon="lucide:image-off" class="size-4" />
      {{ t.clearBackground }}
    </button>
  </div>
</template>
