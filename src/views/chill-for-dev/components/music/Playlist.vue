<script setup lang="ts">
import { ref } from 'vue'
defineOptions({ name: 'MusicPlaylist' })
import { Icon } from '@iconify/vue'
import { useMusicStore } from '../../stores/musicStore'
import type { Track } from '../../stores/musicStore'
import { getDeezerPlaylistTracks, parseDeezerPlaylistId, type DeezerTrack } from '../../api/deezer'

const store = useMusicStore()
const playlistUrl = ref('')
const loading = ref(false)
const error = ref('')

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

async function addPlaylist() {
  const url = playlistUrl.value.trim()
  if (!url) return
  const playlistId = parseDeezerPlaylistId(url)
  if (!playlistId) {
    error.value = 'Chỉ hỗ trợ link playlist Deezer (vd: deezer.com/playlist/123456)'
    return
  }
  error.value = ''
  loading.value = true
  try {
    const tracks = await getDeezerPlaylistTracks(playlistId)
    if (!tracks.length) {
      error.value = 'Playlist trống hoặc không lấy được danh sách.'
      return
    }
    const list = tracks.map(deezerToTrack)
    store.addTracks(list)
    playlistUrl.value = ''
  } catch {
    error.value = 'Không thể tải playlist. Thử lại sau.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div
    class="border border-border-default bg-bg-surface p-4 transition-all duration-300 hover:border-accent-sky/50"
  >
    <h3 class="font-display text-sm tracking-widest text-accent-sky mb-3">// Playlist</h3>
    <p class="text-text-secondary text-sm mb-4">
      Dán link playlist Deezer — toàn bộ bài trong playlist sẽ được thêm vào danh sách của bạn.
    </p>
    <div class="flex gap-2">
      <input
        v-model="playlistUrl"
        type="url"
        placeholder="https://www.deezer.com/playlist/123456789"
        class="flex-1 border border-border-default bg-bg-deep px-4 py-2 text-text-primary placeholder:text-text-dim outline-none transition focus:border-accent-sky"
        @keydown.enter="addPlaylist"
      />
      <button
        type="button"
        class="shrink-0 border border-accent-sky bg-bg-elevated px-4 py-2 text-sm text-accent-sky transition hover:bg-accent-sky hover:text-bg-deep disabled:opacity-50"
        :disabled="loading"
        @click="addPlaylist"
      >
        <Icon v-if="loading" icon="lucide:loader-2" class="size-4 animate-spin" />
        <Icon v-else icon="lucide:list-plus" class="size-4" />
        Thêm danh sách
      </button>
    </div>
    <p v-if="error" class="mt-2 text-xs text-accent-coral">
      {{ error }}
    </p>
    <p class="mt-2 text-text-dim text-xs">
      Mở Deezer → chọn playlist → copy link (ví dụ: deezer.com/playlist/...). Tất cả bài có preview
      sẽ được thêm vào "Danh sách của tôi".
    </p>
  </div>
</template>
