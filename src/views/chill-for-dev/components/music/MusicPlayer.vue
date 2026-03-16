<script setup lang="ts">
import { ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { useMusicStore } from '../../stores/musicStore'
import { useChillI18n } from '../../composables/useChillI18n'

const store = useMusicStore()
const { t } = useChillI18n()
const audioEl = ref<HTMLAudioElement | null>(null)

watch(
  () => store.currentTrack,
  (track) => {
    if (!audioEl.value) return
    if (track?.preview) {
      audioEl.value.src = track.preview
      audioEl.value.play().catch(() => {})
    } else {
      audioEl.value.pause()
      audioEl.value.removeAttribute('src')
    }
  },
  { immediate: true },
)

watch(
  () => store.isPlaying,
  (playing) => {
    if (!audioEl.value) return
    if (playing) audioEl.value.play().catch(() => {})
    else audioEl.value.pause()
  },
)

function togglePlay() {
  store.setPlaying(!store.isPlaying)
}

function onEnded() {
  store.setPlaying(false)
}
</script>

<template>
  <div
    v-if="store.currentTrack"
    class="border border-border-default bg-bg-surface p-4 transition-all duration-300 hover:border-accent-amber/50 flex items-center gap-4"
  >
    <img
      v-if="store.currentTrack.cover"
      :src="store.currentTrack.cover"
      :alt="store.currentTrack.title"
      class="h-16 w-16 shrink-0 object-cover border border-border-default"
    />
    <div class="min-w-0 flex-1">
      <div class="font-display text-sm font-semibold text-text-primary truncate">
        {{ store.currentTrack.title }}
      </div>
      <div class="text-xs text-text-dim">{{ store.currentTrack.artist }}</div>
      <p class="text-text-dim text-xs mt-1">
        <template v-if="store.currentTrack.source === 'lofi'">
          {{ t.fullTrackLofi }}
        </template>
        <template v-else>
          {{ t.previewDeezer }}
          <a
            :href="`https://www.deezer.com/search/${encodeURIComponent(store.currentTrack.title)}`"
            target="_blank"
            rel="noopener"
            class="text-accent-sky link-underline"
          >
            {{ t.deezer }}
          </a>
        </template>
      </p>
    </div>
    <div class="flex items-center gap-2 shrink-0">
      <button
        type="button"
        class="flex size-10 items-center justify-center rounded-full border border-border-default bg-bg-elevated text-text-primary transition hover:border-accent-amber hover:text-accent-amber"
        @click="togglePlay"
      >
        <Icon :icon="store.isPlaying ? 'lucide:pause' : 'lucide:play'" class="size-5" />
      </button>
      <button
        type="button"
        class="flex size-10 items-center justify-center border border-border-default bg-bg-elevated text-text-dim transition hover:border-accent-coral hover:text-accent-coral"
        :aria-label="t.stop"
        @click="store.stop()"
      >
        <Icon icon="lucide:square" class="size-4" />
      </button>
    </div>
    <audio ref="audioEl" class="hidden" @ended="onEnded" />
  </div>
  <div
    v-else
    class="border border-dashed border-border-default bg-bg-surface/50 p-6 text-center text-text-dim text-sm"
  >
    {{ t.noTrackPlaying }}
  </div>
</template>
