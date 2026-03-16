<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import MusicPlayer from '../components/music/MusicPlayer.vue'
import TrackListCard from '../components/music/TrackListCard.vue'
import SoundMix from '../components/ambience/SoundMix.vue'
import BackgroundSelector from '../components/workspace/BackgroundSelector.vue'
import { useWorkspaceStore } from '../stores/workspaceStore'
import { useMusicStore } from '../stores/musicStore'
import type { Track } from '../stores/musicStore'
import { searchDeezer } from '../api/deezer'
import type { DeezerTrack } from '../api/deezer'
import { DEFAULT_CHILL_TRACKS } from '../data/chillTracks'
import { useChillI18n } from '../composables/useChillI18n'

const workspaceStore = useWorkspaceStore()
const musicStore = useMusicStore()
const { t, lang, setLang } = useChillI18n()

const searchQuery = ref('')
const searchResults = ref<Track[]>([])
const searchLoading = ref(false)
const searchDropdownOpen = ref(false)
const searchDropdownRef = ref<HTMLElement | null>(null)
const searchInputRef = ref<HTMLInputElement | null>(null)

const showVisualsPopup = ref(false)
const showSoundsPopup = ref(false)
const showChillMusicPopup = ref(false)
const chillTracks = DEFAULT_CHILL_TRACKS
const chillPopupRef = ref<HTMLElement | null>(null)
const visualsPopupRef = ref<HTMLElement | null>(null)
const soundsPopupRef = ref<HTMLElement | null>(null)

const LIST_CARD_STORAGE = 'chill-for-dev-list-card-pos'
const listCardPos = ref<{ x: number; y: number } | null>(null)
const listCardRef = ref<HTMLElement | null>(null)
let dragStart = { mouseX: 0, mouseY: 0, posX: 0, posY: 0 }

const isVideoBg = computed(() => workspaceStore.backgroundType === 'video')

const listCardStyle = computed(() => {
  if (listCardPos.value === null) {
    return { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }
  }
  return {
    left: `${listCardPos.value.x}px`,
    top: `${listCardPos.value.y}px`,
    transform: 'none',
  }
})

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

async function doSearch() {
  const q = searchQuery.value.trim()
  if (!q) {
    searchResults.value = []
    searchDropdownOpen.value = false
    return
  }
  searchLoading.value = true
  searchDropdownOpen.value = true
  try {
    const data = await searchDeezer(q)
    searchResults.value = data.map(deezerToTrack)
  } catch {
    searchResults.value = []
  } finally {
    searchLoading.value = false
  }
}

function closePopupsIfOutside(e: MouseEvent) {
  const target = e.target as Node
  if (
    chillPopupRef.value?.contains(target) ||
    visualsPopupRef.value?.contains(target) ||
    soundsPopupRef.value?.contains(target)
  )
    return
  showChillMusicPopup.value = false
  showVisualsPopup.value = false
  showSoundsPopup.value = false
}

function onChillTrackClick(track: Track) {
  musicStore.playTrackOnly(track)
  showChillMusicPopup.value = false
}

function onSearchResultClick(track: Track) {
  musicStore.playTrack(track)
  searchDropdownOpen.value = false
}

function closeSearchDropdown(e: MouseEvent) {
  const el = searchDropdownRef.value
  const input = searchInputRef.value
  if (el?.contains(e.target as Node) || input?.contains(e.target as Node)) return
  searchDropdownOpen.value = false
}

onMounted(() => {
  applyBackground()
  loadListCardPosition()
  document.addEventListener('click', closeSearchDropdown)
  document.addEventListener('click', closePopupsIfOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', closeSearchDropdown)
  document.removeEventListener('click', closePopupsIfOutside)
})

watch(
  () => [workspaceStore.background, workspaceStore.backgroundType],
  () => applyBackground(),
)

function applyBackground() {
  document.body.style.backgroundImage = ''
  document.body.style.backgroundSize = ''
  document.body.style.backgroundPosition = ''
  if (!workspaceStore.background) return
  if (workspaceStore.backgroundType === 'video') return
  document.body.style.backgroundImage = `url(${workspaceStore.background})`
  document.body.style.backgroundSize = 'cover'
  document.body.style.backgroundPosition = 'center'
}

function startListCardDrag(e: MouseEvent) {
  e.preventDefault()
  const el = listCardRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const x = listCardPos.value?.x ?? rect.left
  const y = listCardPos.value?.y ?? rect.top
  listCardPos.value = { x, y }
  dragStart = { mouseX: e.clientX, mouseY: e.clientY, posX: x, posY: y }
  document.addEventListener('mousemove', onListCardMouseMove)
  document.addEventListener('mouseup', onListCardMouseUp)
}

function onListCardMouseMove(e: MouseEvent) {
  if (!listCardPos.value) return
  listCardPos.value = {
    x: dragStart.posX + (e.clientX - dragStart.mouseX),
    y: dragStart.posY + (e.clientY - dragStart.mouseY),
  }
}

function onListCardMouseUp() {
  document.removeEventListener('mousemove', onListCardMouseMove)
  document.removeEventListener('mouseup', onListCardMouseUp)
  if (listCardPos.value && typeof localStorage !== 'undefined') {
    localStorage.setItem(LIST_CARD_STORAGE, JSON.stringify(listCardPos.value))
  }
}

function loadListCardPosition() {
  if (typeof localStorage === 'undefined') return
  try {
    const raw = localStorage.getItem(LIST_CARD_STORAGE)
    if (raw) {
      const p = JSON.parse(raw) as { x: number; y: number }
      if (Number.isFinite(p.x) && Number.isFinite(p.y)) listCardPos.value = p
    }
  } catch {
    // ignore
  }
}

function toggleWorkspaceOptions() {
  showChillMusicPopup.value = !showChillMusicPopup.value
  showVisualsPopup.value = false
  showSoundsPopup.value = false
}
</script>

<template>
  <div class="chill-workspace min-h-screen text-text-primary font-body">
    <!-- Full-screen background -->
    <div
      v-if="isVideoBg && workspaceStore.background"
      class="fixed inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      <video
        :src="workspaceStore.background"
        class="h-full w-full object-cover"
        autoplay
        muted
        loop
        playsinline
      />
      <div class="absolute inset-0 bg-bg-deep/40" />
    </div>
    <div
      v-else-if="workspaceStore.background && !isVideoBg"
      class="fixed inset-0 z-0 bg-bg-deep/50"
      aria-hidden
    />

    <div class="relative z-10 flex min-h-screen flex-col">
      <!-- Header: Về trang chủ | Chill for Dev | Ô tìm kiếm -->
      <header
        class="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-border-default/80 bg-bg-surface/95 px-4 py-3 backdrop-blur-sm"
      >
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 text-sm text-text-secondary transition hover:text-accent-coral shrink-0"
        >
          <Icon icon="lucide:arrow-left" class="size-4" />
          {{ t.backToHome }}
        </RouterLink>
        <h1
          class="font-display text-lg font-bold tracking-tight text-accent-coral shrink-0 order-first w-full sm:order-0 sm:w-auto sm:flex-1 sm:text-center"
        >
          {{ t.title }}
        </h1>
        <button
          type="button"
          class="shrink-0 text-sm text-text-dim hover:text-accent-coral transition"
          :aria-label="lang === 'vi' ? 'English' : 'Tiếng Việt'"
          @click="setLang(lang === 'vi' ? 'en' : 'vi')"
        >
          {{ lang === 'vi' ? 'EN' : 'VI' }}
        </button>
        <div class="relative shrink-0 w-full sm:w-64 md:w-80">
          <div class="flex gap-2">
            <input
              ref="searchInputRef"
              v-model="searchQuery"
              type="search"
              :placeholder="t.searchPlaceholder"
              class="flex-1 min-w-0 border border-border-default bg-bg-deep px-3 py-2 text-sm text-text-primary placeholder:text-text-dim outline-none transition focus:border-accent-coral"
              @keydown.enter="doSearch"
            />
            <button
              type="button"
              class="shrink-0 border border-accent-coral bg-bg-elevated px-3 py-2 text-sm text-accent-coral transition hover:bg-accent-coral hover:text-bg-deep disabled:opacity-50"
              :disabled="searchLoading"
              @click="doSearch"
            >
              <Icon v-if="searchLoading" icon="lucide:loader-2" class="size-4 animate-spin" />
              <Icon v-else icon="lucide:search" class="size-4" />
            </button>
          </div>
          <!-- Dropdown kết quả tìm kiếm -->
          <div
            v-if="searchDropdownOpen"
            ref="searchDropdownRef"
            class="absolute top-full left-0 right-0 mt-1 max-h-80 overflow-y-auto border border-border-default bg-bg-surface shadow-lg z-30"
          >
            <div v-if="searchLoading" class="flex items-center justify-center py-6 text-text-dim">
              <Icon icon="lucide:loader-2" class="size-6 animate-spin" />
            </div>
            <ul v-else class="py-1">
              <li
                v-for="track in searchResults"
                :key="track.id"
                class="flex items-center gap-3 border-b border-border-default/50 px-3 py-2 transition hover:bg-bg-elevated cursor-pointer group last:border-b-0"
                @click="onSearchResultClick(track)"
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
                  <span class="text-xs text-text-dim"
                    >{{ track.artist }} · {{ track.duration }}</span
                  >
                </div>
                <Icon
                  icon="lucide:play"
                  class="size-4 text-text-dim group-hover:text-accent-coral shrink-0"
                />
              </li>
              <li
                v-if="!searchLoading && searchResults.length === 0 && searchQuery.trim()"
                class="px-3 py-4 text-center text-text-dim text-sm"
              >
                {{ t.searchNoResults }}
              </li>
            </ul>
          </div>
        </div>
      </header>

      <!-- Main: để chỗ trống, card nổi bên trên -->
      <main class="flex-1" aria-hidden />

      <!-- Card Danh sách: mặc định giữa màn hình, kéo để di chuyển -->
      <div ref="listCardRef" class="fixed z-30 w-full max-w-85 select-none" :style="listCardStyle">
        <TrackListCard>
          <template #header>
            <div
              class="font-display text-sm tracking-widest text-accent-amber cursor-move flex items-center gap-2"
              @mousedown="startListCardDrag"
            >
              <Icon icon="lucide:grip-vertical" class="size-4 text-text-dim" />
              {{ t.myList }}
            </div>
          </template>
        </TrackListCard>
      </div>

      <!-- Footer: trình phát + Chill music / Visuals / Sounds — popup ngay phía trên nút -->
      <footer
        class="sticky bottom-0 z-20 flex items-center gap-4 border-t border-border-default/80 bg-bg-surface/95 px-4 py-3 backdrop-blur-sm"
      >
        <div class="min-w-0 flex-1">
          <MusicPlayer />
        </div>

        <!-- Chill music + dropdown -->
        <div ref="chillPopupRef" class="relative shrink-0">
          <button
            type="button"
            class="inline-flex items-center gap-2 border px-4 py-2.5 text-sm transition shrink-0"
            :class="
              showChillMusicPopup
                ? 'border-accent-coral bg-bg-elevated text-accent-coral'
                : 'border-border-default bg-bg-elevated text-text-secondary hover:border-accent-coral hover:text-accent-coral'
            "
            @click="toggleWorkspaceOptions"
          >
            <Icon icon="lucide:music" class="size-5" />
            {{ t.chillMusic }}
          </button>
          <div
            v-if="showChillMusicPopup"
            class="absolute bottom-full left-0 mb-1 z-50 w-[min(90vw,400px)] max-h-[70vh] overflow-hidden border border-border-default bg-bg-surface shadow-lg flex flex-col"
          >
            <div
              class="flex items-center justify-between border-b border-border-default bg-bg-surface px-4 py-3 shrink-0"
            >
              <span class="font-display text-sm tracking-widest text-accent-coral">{{
                t.chillMusicPopupTitle
              }}</span>
              <button
                type="button"
                class="text-text-dim hover:text-accent-coral transition p-1"
                :aria-label="t.close"
                @click="showChillMusicPopup = false"
              >
                <Icon icon="lucide:x" class="size-5" />
              </button>
            </div>
            <div class="p-2 overflow-y-auto min-h-0">
              <ul class="py-1">
                <li
                  v-for="track in chillTracks"
                  :key="track.id"
                  class="flex items-center gap-3 border-b border-border-default/50 px-3 py-2.5 transition hover:bg-bg-elevated cursor-pointer group last:border-b-0"
                  :class="{ 'bg-accent-coral/10': musicStore.currentTrack?.id === track.id }"
                  @click="onChillTrackClick(track)"
                >
                  <img
                    v-if="track.cover"
                    :src="track.cover"
                    :alt="track.title"
                    class="h-12 w-12 shrink-0 object-cover rounded"
                  />
                  <div class="min-w-0 flex-1">
                    <span
                      class="font-display text-sm text-text-primary truncate block group-hover:text-accent-coral"
                      >{{ track.title }}</span
                    >
                    <span class="text-xs text-text-dim"
                      >{{ track.artist }}{{ track.duration ? ` · ${track.duration}` : '' }}</span
                    >
                  </div>
                  <Icon
                    icon="lucide:play"
                    class="size-5 text-text-dim group-hover:text-accent-coral shrink-0"
                  />
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Visuals + dropdown -->
        <div ref="visualsPopupRef" class="relative shrink-0">
          <button
            type="button"
            class="inline-flex items-center gap-2 border px-4 py-2.5 text-sm transition shrink-0"
            :class="
              showVisualsPopup
                ? 'border-accent-sky bg-bg-elevated text-accent-sky'
                : 'border-border-default bg-bg-elevated text-text-secondary hover:border-accent-sky hover:text-accent-sky'
            "
            @click="
              showVisualsPopup = !showVisualsPopup
              showChillMusicPopup = false
              showSoundsPopup = false
            "
          >
            <Icon icon="lucide:image" class="size-5" />
            {{ t.visuals }}
          </button>
          <div
            v-if="showVisualsPopup"
            class="absolute bottom-full -right-1/2 mb-1 z-50 w-[min(90vw,600px)] max-h-[70vh] overflow-y-auto border border-border-default bg-bg-surface shadow-lg"
          >
            <div
              class="sticky top-0 flex items-center justify-between border-b border-border-default bg-bg-surface px-4 py-3"
            >
              <span class="font-display text-sm tracking-widest text-accent-sky">{{
                t.visualsTitle
              }}</span>
              <button
                type="button"
                class="text-text-dim hover:text-accent-coral transition p-1"
                :aria-label="t.close"
                @click="showVisualsPopup = false"
              >
                <Icon icon="lucide:x" class="size-5" />
              </button>
            </div>
            <div class="p-4">
              <BackgroundSelector />
            </div>
          </div>
        </div>

        <!-- Sounds + dropdown -->
        <div ref="soundsPopupRef" class="relative shrink-0">
          <button
            type="button"
            class="inline-flex items-center gap-2 border px-4 py-2.5 text-sm transition shrink-0"
            :class="
              showSoundsPopup
                ? 'border-accent-amber bg-bg-elevated text-accent-amber'
                : 'border-border-default bg-bg-elevated text-text-secondary hover:border-accent-amber hover:text-accent-amber'
            "
            @click="
              showSoundsPopup = !showSoundsPopup
              showChillMusicPopup = false
              showVisualsPopup = false
            "
          >
            <Icon icon="lucide:waves" class="size-5" />
            {{ t.sounds }}
          </button>
          <div
            v-if="showSoundsPopup"
            class="absolute bottom-full right-0 mb-1 z-50 w-[min(90vw,380px)] border border-border-default bg-bg-surface shadow-lg"
          >
            <div
              class="sticky top-0 flex items-center justify-between border-b border-border-default bg-bg-surface px-4 py-3"
            >
              <span class="font-display text-sm tracking-widest text-accent-amber">{{
                t.soundsTitle
              }}</span>
              <button
                type="button"
                class="text-text-dim hover:text-accent-coral transition p-1"
                :aria-label="t.close"
                @click="showSoundsPopup = false"
              >
                <Icon icon="lucide:x" class="size-5" />
              </button>
            </div>
            <div class="p-4">
              <SoundMix />
            </div>
          </div>
        </div>
      </footer>
    </div>
  </div>
</template>
