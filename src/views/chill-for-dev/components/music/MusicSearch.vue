<script setup lang="ts">
import { ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { useMusicStore } from '../../stores/musicStore'
import type { Track } from '../../stores/musicStore'
import { searchDeezer } from '../../api/deezer'
import type { DeezerTrack } from '../../api/deezer'

const store = useMusicStore()
const query = ref(store.searchQuery)
const results = ref<Track[]>([])
const loading = ref(false)
const searched = ref(false)

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s < 10 ? '0' : ''}${s}`
}

function deezerToTrack(d: DeezerTrack): Track {
  return {
    id: `deezer-${d.id}`,
    title: d.title,
    artist: d.artist.name,
    duration: formatDuration(d.duration),
    durationSec: d.duration,
    source: 'deezer',
    preview: d.preview,
    cover: d.album.cover_medium,
  }
}

async function search() {
  const q = query.value.trim()
  if (!q) {
    results.value = []
    searched.value = false
    return
  }
  loading.value = true
  searched.value = true
  try {
    const data = await searchDeezer(q)
    results.value = data.map(deezerToTrack)
    store.setSearchQuery(q)
  } catch {
    results.value = []
  } finally {
    loading.value = false
  }
}

function onResultClick(track: Track) {
  store.playTrack(track)
}

function onListTrackClick(track: Track) {
  store.playTrack(track)
}

watch(query, () => {
  if (!query.value.trim()) {
    results.value = []
    searched.value = false
  }
})
</script>

<template>
  <div
    class="border border-border-default bg-bg-surface p-4 transition-all duration-300 hover:border-accent-coral/50"
  >
    <h3 class="font-display text-sm tracking-widest text-accent-coral mb-3">// Music</h3>
    <p class="text-text-secondary text-sm mb-4">
      Tìm bài hát trực tuyến — bấm vào bài để phát và thêm vào danh sách.
    </p>
    <div class="mb-4 flex gap-2">
      <input
        v-model="query"
        type="search"
        placeholder="Tìm bài hát, nghệ sĩ..."
        class="flex-1 border border-border-default bg-bg-deep px-4 py-2 text-text-primary placeholder:text-text-dim outline-none transition focus:border-accent-coral"
        @keydown.enter="search"
      />
      <button
        type="button"
        class="shrink-0 border border-accent-coral bg-bg-elevated px-4 py-2 text-sm text-accent-coral transition hover:bg-accent-coral hover:text-bg-deep flex items-center gap-2"
        :disabled="loading"
        @click="search"
      >
        <Icon v-if="loading" icon="lucide:loader-2" class="size-4 animate-spin" />
        <Icon v-else icon="lucide:search" class="size-4" />
        Tìm
      </button>
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <h4 class="font-display text-xs tracking-widest text-text-dim mb-2">Kết quả tìm kiếm</h4>
        <div v-if="loading" class="flex items-center justify-center py-8 text-text-dim">
          <Icon icon="lucide:loader-2" class="size-6 animate-spin" />
        </div>
        <ul v-else class="space-y-1 max-h-64 overflow-y-auto">
          <li
            v-for="track in results"
            :key="track.id"
            class="flex items-center gap-3 border border-border-default bg-bg-deep p-2 transition hover:border-accent-coral/50 cursor-pointer group"
            @click="onResultClick(track)"
          >
            <img
              v-if="track.cover"
              :src="track.cover"
              :alt="track.title"
              class="h-10 w-10 shrink-0 object-cover"
            />
            <div class="min-w-0 flex-1">
              <span
                class="font-display text-sm text-text-primary truncate block group-hover:text-accent-coral"
              >
                {{ track.title }}
              </span>
              <span class="text-xs text-text-dim">{{ track.artist }} · {{ track.duration }}</span>
            </div>
            <Icon
              icon="lucide:play"
              class="size-4 text-text-dim group-hover:text-accent-coral shrink-0"
            />
          </li>
          <li
            v-if="searched && !loading && !results.length"
            class="border border-dashed border-border-default p-4 text-center text-text-dim text-sm"
          >
            Không tìm thấy. Thử từ khóa khác.
          </li>
          <li
            v-if="!searched && !query.trim()"
            class="border border-dashed border-border-default p-4 text-center text-text-dim text-sm"
          >
            Nhập từ khóa và bấm Tìm.
          </li>
        </ul>
      </div>
      <div>
        <h4 class="font-display text-xs tracking-widest text-text-dim mb-2">Danh sách của tôi</h4>
        <ul class="space-y-1 max-h-64 overflow-y-auto">
          <li
            v-for="track in store.trackList"
            :key="track.id"
            class="flex items-center gap-3 border border-border-default bg-bg-deep p-2 transition hover:border-accent-amber/50 cursor-pointer group"
            :class="{ 'border-accent-amber': store.currentTrack?.id === track.id }"
            @click="onListTrackClick(track)"
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
              aria-label="Xóa"
              @click.stop="store.removeTrack(track.id)"
            >
              <Icon icon="lucide:x" class="size-4" />
            </button>
          </li>
          <li
            v-if="!store.trackList.length"
            class="border border-dashed border-border-default p-4 text-center text-text-dim text-sm"
          >
            Bấm bài từ kết quả tìm kiếm để thêm và phát.
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
