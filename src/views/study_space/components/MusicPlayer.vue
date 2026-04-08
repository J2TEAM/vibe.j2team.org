<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { Icon } from '@iconify/vue'

interface AmbientSound {
  id: string
  name: string
  icon: string
  src: string
}

const lofiTracks = [
  { id: 'lofi1', name: 'Lo-fi Chill', src: '/sounds/study_space/music/lofi1.mp3' },
  { id: 'lofi2', name: 'Lo-fi Jazz', src: '/sounds/study_space/music/lofi2.mp3' },
  { id: 'lofi3', name: 'Lo-fi Sleep', src: '/sounds/study_space/music/lofi3.mp3' },
]

const ambientSounds: AmbientSound[] = [
  {
    id: 'rain1',
    name: 'Mưa nặng',
    icon: 'lucide:cloud-rain',
    src: '/sounds/study_space/ambiances/rain1.mp3',
  },
  {
    id: 'rain2',
    name: 'Mưa nhẹ',
    icon: 'lucide:cloud-drizzle',
    src: '/sounds/study_space/ambiances/rain2.mp3',
  },
  {
    id: 'bird1',
    name: 'Tiếng chim',
    icon: 'lucide:bird',
    src: '/sounds/study_space/ambiances/bird1.mp3',
  },
  {
    id: 'wave',
    name: 'Sóng biển',
    icon: 'lucide:waves',
    src: '/sounds/study_space/ambiances/wave.mp3',
  },
  {
    id: 'wind',
    name: 'Tiếng gió',
    icon: 'lucide:wind',
    src: '/sounds/study_space/ambiances/wind.mp3',
  },
  {
    id: 'thunder',
    name: 'Sấm sét',
    icon: 'lucide:cloud-lightning',
    src: '/sounds/study_space/ambiances/thunder.mp3',
  },
  {
    id: 'betawave',
    name: 'Beta Wave',
    icon: 'lucide:brain',
    src: '/sounds/study_space/ambiances/beta wave.mp3',
  },
]

// --- State ---
const isExpanded = ref(false)
const isLofiPlaying = ref(false)
const currentLofiIndex = useLocalStorage('study-space-lofi', 0)
const lofiVolume = useLocalStorage('study-space-lofi-volume', 70)
const activeAmbients = ref<Set<string>>(new Set())
const ambientVolumes = useLocalStorage<Record<string, number>>('study-space-ambient-volumes', {})

// --- Lo-fi Audio ---
const lofiAudio = ref<HTMLAudioElement | null>(null)

const currentTrack = computed(() => lofiTracks[currentLofiIndex.value] ?? lofiTracks[0]!)

function createLofiAudio() {
  if (lofiAudio.value) {
    lofiAudio.value.pause()
    lofiAudio.value.src = ''
  }
  const audio = new Audio(currentTrack.value.src)
  audio.volume = lofiVolume.value / 100
  audio.loop = true
  lofiAudio.value = audio
  return audio
}

function toggleLofi() {
  if (isLofiPlaying.value) {
    lofiAudio.value?.pause()
    isLofiPlaying.value = false
  } else {
    if (!lofiAudio.value) createLofiAudio()
    lofiAudio.value!.play().catch(() => {})
    isLofiPlaying.value = true
  }
}

function switchTrack(index: number) {
  const wasPlaying = isLofiPlaying.value
  currentLofiIndex.value = index
  const audio = createLofiAudio()
  if (wasPlaying) {
    audio.play().catch(() => {})
  }
}

function nextLofi() {
  switchTrack((currentLofiIndex.value + 1) % lofiTracks.length)
}

function prevLofi() {
  switchTrack((currentLofiIndex.value - 1 + lofiTracks.length) % lofiTracks.length)
}

watch(lofiVolume, (v) => {
  if (lofiAudio.value) lofiAudio.value.volume = v / 100
})

// --- Ambient Sounds ---
const ambientAudios = new Map<string, HTMLAudioElement>()

function getOrInitVolume(id: string): number {
  if (ambientVolumes.value[id] === undefined) {
    ambientVolumes.value[id] = 50
  }
  return ambientVolumes.value[id]!
}

function toggleAmbient(sound: AmbientSound) {
  if (activeAmbients.value.has(sound.id)) {
    // Stop
    activeAmbients.value.delete(sound.id)
    const audio = ambientAudios.get(sound.id)
    if (audio) {
      audio.pause()
      audio.currentTime = 0
      ambientAudios.delete(sound.id)
    }
  } else {
    // Start
    activeAmbients.value.add(sound.id)
    const audio = new Audio(sound.src)
    audio.loop = true
    audio.volume = getOrInitVolume(sound.id) / 100
    audio.play().catch(() => {})
    ambientAudios.set(sound.id, audio)
  }
  // Trigger reactivity
  activeAmbients.value = new Set(activeAmbients.value)
}

function updateAmbientVolume(soundId: string, volume: number) {
  ambientVolumes.value[soundId] = volume
  const audio = ambientAudios.get(soundId)
  if (audio) audio.volume = volume / 100
}

onMounted(() => {
  createLofiAudio()
})

onUnmounted(() => {
  lofiAudio.value?.pause()
  ambientAudios.forEach((a) => a.pause())
  ambientAudios.clear()
})
</script>

<template>
  <!-- Collapsed mini button -->
  <div class="fixed bottom-4 right-4 z-50">
    <button
      v-if="!isExpanded"
      class="flex items-center gap-2 border border-white/20 bg-black/50 px-4 py-2.5 text-white/80 backdrop-blur-md transition-all hover:border-white/40 hover:bg-black/60 hover:text-white"
      @click="isExpanded = true"
    >
      <Icon
        icon="lucide:music"
        class="size-5 transition-colors"
        :class="isLofiPlaying ? 'animate-pulse text-accent-coral' : ''"
      />
      <span class="hidden text-sm sm:inline">Âm nhạc</span>
      <span
        v-if="activeAmbients.size > 0"
        class="flex size-4 items-center justify-center rounded-full bg-accent-amber/80 text-[9px] font-bold text-black"
      >
        {{ activeAmbients.size }}
      </span>
    </button>

    <!-- Expanded Panel -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-4 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-4 scale-95"
    >
      <div
        v-if="isExpanded"
        class="w-72 border border-white/20 bg-black/70 backdrop-blur-xl sm:w-80"
      >
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <h3 class="font-display text-sm font-semibold tracking-wide text-white">
            <Icon icon="lucide:headphones" class="mr-1.5 inline size-4" />
            Âm nhạc & Âm thanh
          </h3>
          <button class="text-white/50 transition hover:text-white" @click="isExpanded = false">
            <Icon icon="lucide:x" class="size-4" />
          </button>
        </div>

        <!-- Lo-fi Section -->
        <div class="border-b border-white/10 p-4">
          <div class="mb-3 text-xs font-medium uppercase tracking-widest text-white/50">
            Lo-fi Music
          </div>

          <!-- Track name -->
          <div class="mb-3 text-center text-xs font-medium text-white/70">
            {{ currentTrack.name }}
          </div>

          <!-- Controls -->
          <div class="flex items-center justify-between">
            <button class="text-white/60 transition hover:text-white" @click="prevLofi">
              <Icon icon="lucide:skip-back" class="size-4" />
            </button>
            <button
              class="flex size-10 items-center justify-center border text-white transition-all"
              :class="
                isLofiPlaying
                  ? 'border-accent-coral bg-accent-coral/20'
                  : 'border-white/20 hover:border-white/40'
              "
              @click="toggleLofi"
            >
              <Icon :icon="isLofiPlaying ? 'lucide:pause' : 'lucide:play'" class="size-5" />
            </button>
            <button class="text-white/60 transition hover:text-white" @click="nextLofi">
              <Icon icon="lucide:skip-forward" class="size-4" />
            </button>
          </div>

          <!-- Track dots -->
          <div class="mt-3 flex justify-center gap-1.5">
            <button
              v-for="(track, i) in lofiTracks"
              :key="track.id"
              class="h-1 rounded-full transition-all"
              :class="i === currentLofiIndex ? 'w-4 bg-accent-coral' : 'w-1 bg-white/30'"
              @click="switchTrack(i)"
            />
          </div>

          <!-- Volume -->
          <div class="mt-3 flex items-center gap-2">
            <Icon icon="lucide:volume-1" class="size-3.5 shrink-0 text-white/40" />
            <input
              v-model.number="lofiVolume"
              type="range"
              min="0"
              max="100"
              class="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-accent-coral [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent-coral"
            />
          </div>
        </div>

        <!-- Ambient Sounds Section -->
        <div class="p-4">
          <div class="mb-3 text-xs font-medium uppercase tracking-widest text-white/50">
            Âm thanh
          </div>
          <div class="grid grid-cols-4 gap-1.5">
            <button
              v-for="sound in ambientSounds"
              :key="sound.id"
              class="flex flex-col items-center gap-1 border px-1 py-2 text-[10px] transition-all"
              :class="
                activeAmbients.has(sound.id)
                  ? 'border-accent-amber bg-accent-amber/20 text-white'
                  : 'border-white/10 text-white/60 hover:border-white/20 hover:text-white'
              "
              @click="toggleAmbient(sound)"
            >
              <Icon :icon="sound.icon" class="size-4" />
              <span class="text-center leading-tight">{{ sound.name }}</span>
            </button>
          </div>

          <!-- Volume sliders for active ambients -->
          <div v-if="activeAmbients.size > 0" class="mt-3 space-y-2 border-t border-white/10 pt-3">
            <div
              v-for="sound in ambientSounds.filter((s) => activeAmbients.has(s.id))"
              :key="sound.id"
              class="flex items-center gap-2"
            >
              <Icon :icon="sound.icon" class="size-3 shrink-0 text-accent-amber" />
              <input
                :value="ambientVolumes[sound.id] ?? 50"
                type="range"
                min="0"
                max="100"
                class="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-accent-amber [&::-webkit-slider-thumb]:size-2.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent-amber"
                @input="
                  updateAmbientVolume(sound.id, Number(($event.target as HTMLInputElement).value))
                "
              />
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>
