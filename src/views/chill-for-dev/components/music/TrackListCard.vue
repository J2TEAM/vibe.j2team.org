<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useMusicStore } from '../../stores/musicStore'
import { useChillI18n } from '../../composables/useChillI18n'
import type { Track } from '../../stores/musicStore'

const store = useMusicStore()
const { t } = useChillI18n()

function onTrackClick(track: Track) {
  store.playTrack(track)
}
</script>

<template>
  <div
    class="border border-border-default bg-bg-surface p-4 transition-all duration-300 hover:border-accent-amber/50 h-full flex flex-col"
  >
    <div class="mb-3">
      <slot name="header">
        <h3 class="font-display text-sm tracking-widest text-accent-amber">
          {{ t.myList }}
        </h3>
      </slot>
    </div>
    <ul class="space-y-1 flex-1 overflow-y-auto min-h-0 max-h-[50vh] sm:max-h-[60vh]">
      <li
        v-for="track in store.trackList"
        :key="track.id"
        class="flex items-center gap-3 border border-border-default bg-bg-deep p-2 transition hover:border-accent-amber/50 cursor-pointer group"
        :class="{ 'border-accent-amber': store.currentTrack?.id === track.id }"
        @click="onTrackClick(track)"
      >
        <img
          v-if="track.cover"
          :src="track.cover"
          :alt="track.title"
          class="h-10 w-10 shrink-0 object-cover"
        />
        <div class="min-w-0 flex-1">
          <span class="font-display text-sm text-text-primary truncate block">
            {{ track.title }}
          </span>
          <span class="text-xs text-text-dim">{{ track.artist }}</span>
        </div>
        <Icon
          v-if="store.currentTrack?.id === track.id && store.isPlaying"
          icon="lucide:volume-2"
          class="size-4 text-accent-amber shrink-0"
        />
        <Icon
          v-else
          icon="lucide:play"
          class="size-4 text-text-dim group-hover:text-accent-amber shrink-0"
        />
        <button
          type="button"
          class="shrink-0 text-text-dim hover:text-accent-coral transition opacity-0 group-hover:opacity-100"
          :aria-label="t.remove"
          @click.stop="store.removeTrack(track.id)"
        >
          <Icon icon="lucide:x" class="size-4" />
        </button>
      </li>
      <li
        v-if="!store.trackList.length"
        class="border border-dashed border-border-default p-4 text-center text-text-dim text-sm"
      >
        {{ t.emptyListHint }}
      </li>
    </ul>
  </div>
</template>
