<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'

import { useHead } from '@unhead/vue'
import { Icon } from '@iconify/vue'
import { useWindowSize } from '@vueuse/core'
import { useSequencer } from './composables/useSequencer'
import { useAudioEngine } from './composables/useAudioEngine'
import type { Pattern } from './types'
import TransportControls from './components/TransportControls.vue'
import PatternManager from './components/PatternManager.vue'
import ChannelRack from './components/ChannelRack.vue'
import AddTrackMenu from './components/AddTrackMenu.vue'
import SequencerGrid from './components/SequencerGrid.vue'
import PianoRoll from './components/PianoRoll.vue'
import ExportPanel from './components/ExportPanel.vue'

useHead({
  title: 'Beat Maker',
  meta: [{ name: 'description', content: 'Tạo beat ngay trên trình duyệt.' }],
})

const { setMasterVolume } = useAudioEngine()

const {
  patterns,
  activePatternId,
  activePattern,
  bpm,
  isPlaying,
  currentStep,
  metronomeEnabled,
  masterVolume,
  audioCtx,
  togglePlay,
  addPattern,
  removePattern,
  duplicatePattern,
  renamePattern,
  addTrack,
  removeTrack,
  toggleStep,
  setVelocity,
  addPianoNote,
  removePianoNote,
} = useSequencer()

watch(masterVolume, (v) => setMasterVolume(v))

// ── Responsive ─────────────────────────────────────────────────────
const { width: windowW } = useWindowSize()
const isMobile = computed(() => windowW.value < 640)

// ── UI State ────────────────────────────────────────────────────────
type Tab = 'sequencer' | 'pianoroll' | 'export'
const activeTab = ref<Tab>('sequencer')
const selectedTrackId = ref<string | null>(null)
const showAddMenu = ref(false)
// Channel rack hidden by default on mobile
const showChannelRack = ref(!isMobile.value)
// Mobile: bottom sheet for channel rack
const showMobileRack = ref(false)

// When pattern changes, select first track
watch(activePatternId, () => {
  selectedTrackId.value = activePattern.value?.tracks[0]?.id ?? null
})
onMounted(() => {
  selectedTrackId.value = activePattern.value?.tracks[0]?.id ?? null
  showChannelRack.value = !isMobile.value
})

// Stop playback when navigating away
onBeforeUnmount(() => {
  if (isPlaying.value) togglePlay()
})

const selectedTrack = computed(
  () => activePattern.value?.tracks.find((t) => t.id === selectedTrackId.value) ?? null,
)

// ── Track Handlers ──────────────────────────────────────────────────
const onSelectTrack = (trackId: string) => {
  selectedTrackId.value = trackId
  const t = activePattern.value?.tracks.find((t) => t.id === trackId)
  if (t?.type === 'melodic') activeTab.value = 'pianoroll'
  else activeTab.value = 'sequencer'
  // close mobile rack after selecting
  showMobileRack.value = false
}

const onAddTrack = (instrId: string) => {
  addTrack(instrId)
  const pat = activePattern.value
  const last = pat?.tracks[pat.tracks.length - 1]
  if (last) selectedTrackId.value = last.id
  showAddMenu.value = false
}

const onTrackVolumeUpdate = (trackId: string, val: number) => {
  const t = activePattern.value?.tracks.find((t) => t.id === trackId)
  if (t) t.volume = val
}
const onTrackPanUpdate = (trackId: string, val: number) => {
  const t = activePattern.value?.tracks.find((t) => t.id === trackId)
  if (t) t.pan = val
}
const onTrackFilterUpdate = (trackId: string, val: number) => {
  const t = activePattern.value?.tracks.find((t) => t.id === trackId)
  if (t) t.filterFreq = val
}
const onToggleMute = (trackId: string) => {
  const t = activePattern.value?.tracks.find((t) => t.id === trackId)
  if (t) t.muted = !t.muted
}
const onToggleSolo = (trackId: string) => {
  const t = activePattern.value?.tracks.find((t) => t.id === trackId)
  if (t) t.solo = !t.solo
}

// Step count update propagates to tracks
const onStepCountUpdate = (count: 16 | 32 | 64) => {
  const pat = activePattern.value
  if (!pat) return
  if (pat.stepCount === count) return
  pat.stepCount = count
  pat.tracks.forEach((track) => {
    if (track.steps.length < count) {
      while (track.steps.length < count) track.steps.push({ active: false, velocity: 100 })
    } else {
      track.steps = track.steps.slice(0, count)
    }
  })
}

// ── Import ──────────────────────────────────────────────────────────
const handleImport = (newPatterns: Pattern[], newBpm: number) => {
  patterns.value.splice(0, patterns.value.length, ...newPatterns)
  activePatternId.value = newPatterns[0]?.id ?? ''
  bpm.value = newBpm
}

const tabs = [
  { id: 'sequencer' as Tab, label: 'Sequencer', icon: 'lucide:grid-3x3' },
  { id: 'pianoroll' as Tab, label: 'Piano Roll', icon: 'lucide:music-4' },
  { id: 'export' as Tab, label: 'Export', icon: 'lucide:share-2' },
]

// Track label column width; smaller on mobile
const trackLabelW = computed(() => (isMobile.value ? 72 : 100))
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col">
    <!-- ─── Header ──────────────────────────────────────────────── -->
    <header
      class="flex items-center gap-2 sm:gap-4 px-3 sm:px-4 py-2 sm:py-3 bg-bg-surface border-b border-border-default flex-shrink-0 animate-fade-up"
    >
      <RouterLink
        to="/"
        class="group flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center bg-bg-elevated text-text-secondary transition-colors hover:text-accent-coral flex-shrink-0"
      >
        <Icon
          icon="lucide:arrow-left"
          class="size-4 transition-transform group-hover:-translate-x-0.5"
        />
      </RouterLink>

      <div class="min-w-0 flex-shrink">
        <h1
          class="font-display text-base sm:text-lg uppercase tracking-tighter leading-none truncate"
        >
          <span class="text-accent-coral">//</span> Beat Maker
        </h1>
        <p
          class="text-[8px] sm:text-[9px] font-display uppercase tracking-[0.2em] text-text-secondary hidden xs:block"
        >
          Homemade Step Sequencer
        </p>
      </div>

      <!-- Mobile: Channel Rack toggle button -->
      <button
        v-if="isMobile"
        @click="showMobileRack = true"
        class="flex h-8 w-8 items-center justify-center bg-bg-elevated text-text-secondary hover:text-accent-coral transition-colors"
      >
        <Icon icon="lucide:sliders-horizontal" class="size-4" />
      </button>

      <!-- Tabs -->
      <nav class="ml-auto flex items-center gap-0.5 flex-shrink-0">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          class="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-[10px] font-display uppercase tracking-wider transition-colors"
          :class="
            activeTab === tab.id
              ? 'bg-accent-coral text-white'
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
          "
        >
          <Icon :icon="tab.icon" class="size-3.5 flex-shrink-0" />
          <span class="hidden sm:inline">{{ tab.label }}</span>
        </button>
      </nav>
    </header>

    <!-- ─── Transport ───────────────────────────────────────────── -->
    <TransportControls
      class="animate-fade-up animate-delay-1"
      :bpm="bpm"
      :is-playing="isPlaying"
      :metronome-enabled="metronomeEnabled"
      :step-count="activePattern?.stepCount ?? 16"
      :master-volume="masterVolume"
      @toggle-play="togglePlay"
      @update:bpm="bpm = $event"
      @update:master-volume="masterVolume = $event"
      @update:metronome-enabled="metronomeEnabled = $event"
      @update:step-count="onStepCountUpdate"
    />

    <!-- ─── Pattern Manager ─────────────────────────────────────── -->
    <PatternManager
      class="animate-fade-up animate-delay-2"
      :patterns="patterns"
      :active-pattern-id="activePatternId"
      @select="activePatternId = $event"
      @add="addPattern"
      @duplicate="duplicatePattern"
      @remove="removePattern"
      @rename="renamePattern"
    />

    <!-- ─── Main Workspace ──────────────────────────────────────── -->
    <div class="flex flex-1 overflow-hidden animate-fade-up animate-delay-3">
      <!-- Left: Channel Rack (desktop only; on mobile it's a bottom sheet) -->
      <div
        v-if="!isMobile"
        class="relative flex-shrink-0 border-r border-border-default"
        :style="{ width: showChannelRack ? '200px' : '40px' }"
      >
        <!-- Collapse toggle -->
        <button
          @click.stop="showChannelRack = !showChannelRack"
          class="absolute -right-3.5 top-4 z-20 h-7 w-7 bg-bg-elevated border border-border-default flex items-center justify-center hover:border-accent-coral text-text-secondary hover:text-accent-coral transition-colors"
        >
          <Icon
            :icon="showChannelRack ? 'lucide:chevron-left' : 'lucide:chevron-right'"
            class="size-3"
          />
        </button>

        <div
          v-if="showChannelRack"
          class="h-full overflow-hidden flex flex-col"
          style="width: 200px"
        >
          <ChannelRack
            :tracks="activePattern?.tracks ?? []"
            :selected-track-id="selectedTrackId"
            @select="onSelectTrack"
            @remove="removeTrack"
            @update:volume="onTrackVolumeUpdate"
            @update:pan="onTrackPanUpdate"
            @update:filter-freq="onTrackFilterUpdate"
            @toggle-mute="onToggleMute"
            @toggle-solo="onToggleSolo"
            @add-track="showAddMenu = !showAddMenu"
          />
        </div>
        <div v-else class="flex flex-col items-center gap-3 pt-4">
          <Icon icon="lucide:sliders-horizontal" class="size-4 text-text-secondary" />
        </div>
      </div>

      <!-- Center: Main Content -->
      <div class="flex-1 flex flex-col overflow-hidden min-w-0">
        <!-- Track labels + grid -->
        <div
          v-if="activeTab === 'sequencer' || activeTab === 'pianoroll'"
          class="flex flex-1 overflow-hidden"
        >
          <!-- Track name labels column -->
          <div
            class="flex-shrink-0 bg-bg-surface border-r border-border-default overflow-y-auto"
            :style="{ width: `${trackLabelW}px` }"
          >
            <!-- Header spacer -->
            <div
              style="height: 28px"
              class="border-b border-border-default/30 px-2 flex items-center"
            >
              <span class="text-[8px] font-display uppercase tracking-widest text-text-secondary"
                >Track</span
              >
            </div>
            <div
              v-for="track in activePattern?.tracks ?? []"
              :key="track.id"
              class="flex items-center gap-1 px-1.5 sm:px-2 cursor-pointer border-b border-border-default/20 transition-colors"
              style="height: 41px"
              :class="selectedTrackId === track.id ? 'bg-bg-elevated' : 'hover:bg-bg-surface'"
              @click="onSelectTrack(track.id)"
            >
              <div
                class="size-1.5 rounded-full flex-shrink-0"
                :style="{ backgroundColor: track.color }"
              ></div>
              <span class="text-[9px] sm:text-[10px] font-display text-text-primary truncate">{{
                track.name
              }}</span>
              <Icon
                v-if="track.muted"
                icon="lucide:volume-x"
                class="size-2.5 text-accent-amber ml-auto flex-shrink-0"
              />
            </div>
          </div>

          <!-- Grid area -->
          <div class="flex-1 overflow-auto bg-bg-deep min-w-0">
            <!-- Sequencer Grid Tab -->
            <div v-if="activeTab === 'sequencer'" class="h-full">
              <SequencerGrid
                :tracks="activePattern?.tracks ?? []"
                :current-step="currentStep"
                :step-count="activePattern?.stepCount ?? 16"
                :selected-track-id="selectedTrackId"
                @toggle-step="toggleStep"
                @set-velocity="setVelocity"
                @select-track="onSelectTrack"
              />
            </div>

            <!-- Piano Roll Tab -->
            <div v-else-if="activeTab === 'pianoroll'" class="h-full">
              <div v-if="selectedTrack?.type === 'melodic'" class="h-full">
                <PianoRoll
                  :notes="selectedTrack.pianoNotes"
                  :step-count="activePattern?.stepCount ?? 16"
                  :current-step="currentStep"
                  @add-note="(p, s, d) => addPianoNote(selectedTrackId!, p, s, d)"
                  @remove-note="(id) => removePianoNote(selectedTrackId!, id)"
                />
              </div>
              <div
                v-else
                class="flex flex-col items-center justify-center h-48 text-text-secondary gap-3 px-4 text-center"
              >
                <Icon icon="lucide:music-4" class="size-10 opacity-30" />
                <p class="text-sm font-display">
                  Chọn một track Melodic (Synth, Bass, Pad) để dùng Piano Roll
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Export Tab -->
        <div v-else-if="activeTab === 'export'" class="flex-1 overflow-auto">
          <ExportPanel :patterns="patterns" :bpm="bpm" @import="handleImport" />
        </div>
      </div>
    </div>

    <!-- ─── Mobile: Channel Rack Bottom Sheet ──────────────────── -->
    <Transition name="slide-up">
      <div
        v-if="isMobile && showMobileRack"
        class="fixed inset-x-0 bottom-0 z-50 bg-bg-surface border-t border-border-default shadow-2xl flex flex-col"
        style="max-height: 70vh"
        @click.stop
      >
        <!-- Handle bar + close -->
        <div
          class="flex items-center justify-between px-4 py-2 border-b border-border-default flex-shrink-0"
        >
          <span class="text-[9px] font-display uppercase tracking-widest text-text-secondary"
            >Tracks &amp; Mixer</span
          >
          <button
            @click="showMobileRack = false"
            class="text-text-secondary hover:text-accent-coral transition-colors"
          >
            <Icon icon="lucide:x" class="size-4" />
          </button>
        </div>
        <div class="flex-1 overflow-hidden">
          <ChannelRack
            :tracks="activePattern?.tracks ?? []"
            :selected-track-id="selectedTrackId"
            @select="onSelectTrack"
            @remove="removeTrack"
            @update:volume="onTrackVolumeUpdate"
            @update:pan="onTrackPanUpdate"
            @update:filter-freq="onTrackFilterUpdate"
            @toggle-mute="onToggleMute"
            @toggle-solo="onToggleSolo"
            @add-track="showAddMenu = !showAddMenu"
          />
        </div>
      </div>
    </Transition>
    <div
      v-if="isMobile && showMobileRack"
      class="fixed inset-0 z-40 bg-black/50"
      @click="showMobileRack = false"
    ></div>

    <!-- ─── Add Track Slide-over ────────────────────────────────── -->
    <Transition name="slide-left">
      <div
        v-if="showAddMenu"
        class="fixed inset-y-0 left-0 z-50 flex flex-col bg-bg-surface border-r border-border-default shadow-xl"
        style="width: min(280px, 90vw)"
        @click.stop
      >
        <AddTrackMenu @add="onAddTrack" @close="showAddMenu = false" />
      </div>
    </Transition>
    <div
      v-if="showAddMenu"
      class="fixed inset-0 z-40 bg-black/40"
      @click="showAddMenu = false"
    ></div>

    <!-- ─── Status Bar ───────────────────────────────────────────── -->
    <footer
      class="flex-shrink-0 flex items-center justify-between px-3 sm:px-4 py-1.5 bg-bg-deep border-t border-border-default animate-fade-up animate-delay-4"
    >
      <span
        class="text-[8px] font-display uppercase tracking-widest text-border-default hidden sm:inline"
        >Beat Maker</span
      >
      <div
        class="flex items-center gap-2 sm:gap-4 text-[8px] font-display uppercase tracking-widest w-full sm:w-auto justify-between sm:justify-start"
      >
        <span :class="isPlaying ? 'text-accent-coral animate-pulse' : 'text-border-default'">
          {{ isPlaying ? '● Playing' : '■ Stopped' }}
        </span>
        <span class="text-border-default"
          >Step {{ currentStep >= 0 ? currentStep + 1 : '–' }} /
          {{ activePattern?.stepCount ?? 16 }}</span
        >
        <span class="text-border-default hidden sm:inline">{{ audioCtx?.state ?? 'no ctx' }}</span>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.slide-left-enter-active,
.slide-left-leave-active {
  transition: transform 0.25s ease;
}
.slide-left-enter-from,
.slide-left-leave-to {
  transform: translateX(-100%);
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}
.animate-pulse {
  animation: pulse 1.5s ease-in-out infinite;
}
</style>
