<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useLocalStorage, useEventListener } from '@vueuse/core'
import { Icon } from '@iconify/vue'
import { useSpaceSettings } from '../composables/useSpaceSettings'

const settings = useSpaceSettings()

interface Scene {
  id: string
  name: string
  icon: string
  videoId: string
}

const scenes: Scene[] = [
  { id: 'cafe', name: 'Quán Cafe', icon: 'lucide:coffee', videoId: '0QKdqm5TX6c' },
  { id: 'nature', name: 'Thiên Nhiên', icon: 'lucide:trees', videoId: 'qRTVg8HHzUo' },
  { id: 'night', name: 'Đêm Phố', icon: 'lucide:moon-star', videoId: 'oGfg0_Lti9M' },
  { id: 'library', name: 'Thư Viện', icon: 'lucide:book-open', videoId: 'RoLCX6fwXRM' },
  { id: 'rain', name: 'Mưa Phố', icon: 'lucide:cloud-rain', videoId: 'mPZkdNFkNps' },
  { id: 'fireplace', name: 'Lò Sưởi', icon: 'lucide:flame', videoId: 'UgHKb_7884o' },
]

const defaultScene: Scene = scenes[0]!

const selectedSceneId = useLocalStorage('study-space-scene', 'cafe')
const showScenePicker = ref(false)
// 0 = muted (default for autoplay), 1-100 = volume level
const videoVolume = useLocalStorage('study-space-video-volume', 0)

const currentScene = computed(() => {
  return scenes.find((s) => s.id === selectedSceneId.value) ?? defaultScene
})

const videoSrc = computed(() => {
  const scene = currentScene.value
  return `https://www.youtube.com/embed/${scene.videoId}?autoplay=1&mute=1&loop=1&playlist=${scene.videoId}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&enablejsapi=1&start=30`
})

function postToIframe(func: string, args: unknown[] = []) {
  const iframe = document.querySelector<HTMLIFrameElement>('.video-bg-iframe')
  iframe?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), '*')
}

function applyVideoVolume() {
  if (videoVolume.value === 0) {
    postToIframe('mute')
  } else {
    postToIframe('unMute')
    postToIframe('setVolume', [videoVolume.value])
  }
}

// Khi YouTube iframe sẵn sàng, áp dụng volume đã lưu
useEventListener(window, 'message', (e: MessageEvent) => {
  try {
    const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data
    if (data?.event === 'onReady' || data?.info === 1) {
      applyVideoVolume()
    }
  } catch {
    // ignore parse errors
  }
})

watch(videoVolume, () => applyVideoVolume())

function selectScene(id: string) {
  selectedSceneId.value = id
  showScenePicker.value = false
  // Re-apply volume sau khi iframe load lại
  setTimeout(applyVideoVolume, 3000)
}
</script>

<template>
  <!-- Video Background -->
  <div class="fixed inset-0 z-0 overflow-hidden bg-black">
    <iframe
      :key="currentScene.videoId"
      :src="videoSrc"
      class="video-bg-iframe pointer-events-none absolute left-1/2 top-1/2 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 border-0"
      allow="autoplay; encrypted-media"
      allowfullscreen
    />
    <div
      class="absolute inset-0 bg-black transition-opacity duration-500"
      :style="{ opacity: settings.overlayOpacity / 100 }"
    />
  </div>

  <!-- Scene Picker Toggle -->
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0 -translate-x-2"
    enter-to-class="opacity-100 translate-x-0"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100 translate-x-0"
    leave-to-class="opacity-0 -translate-x-2"
  >
    <button
      v-show="settings.showScenePicker && !settings.zenMode"
      class="fixed left-4 top-4 z-50 flex items-center gap-2 border border-white/20 bg-black/50 px-3 py-2 text-sm text-white/80 backdrop-blur-md transition-all hover:border-white/40 hover:bg-black/60 hover:text-white"
      @click="showScenePicker = !showScenePicker"
    >
      <Icon :icon="currentScene.icon" class="size-4" />
      <span class="hidden sm:inline">{{ currentScene.name }}</span>
      <Icon
        icon="lucide:chevron-down"
        class="size-3 transition-transform"
        :class="{ 'rotate-180': showScenePicker }"
      />
    </button>
  </Transition>

  <!-- Scene Picker Dropdown -->
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0 -translate-y-2"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 -translate-y-2"
  >
    <div
      v-if="showScenePicker"
      class="fixed left-4 top-16 z-50 w-56 border border-white/20 bg-black/70 p-3 backdrop-blur-xl sm:w-64"
    >
      <!-- Scene grid -->
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <button
          v-for="scene in scenes"
          :key="scene.id"
          class="flex flex-col items-center gap-1.5 border px-3 py-2.5 text-xs transition-all"
          :class="
            selectedSceneId === scene.id
              ? 'border-accent-coral bg-accent-coral/20 text-white'
              : 'border-white/10 text-white/70 hover:border-white/30 hover:bg-white/10 hover:text-white'
          "
          @click="selectScene(scene.id)"
        >
          <Icon :icon="scene.icon" class="size-5" />
          <span>{{ scene.name }}</span>
        </button>
      </div>

      <!-- Spaces Audio Volume -->
      <div class="mt-3 border-t border-white/10 pt-3">
        <div class="mb-2 text-[10px] font-medium uppercase tracking-widest text-white/40">
          Spaces Audio
        </div>
        <div class="flex items-center gap-2">
          <Icon
            :icon="
              videoVolume === 0
                ? 'lucide:volume-x'
                : videoVolume < 50
                  ? 'lucide:volume-1'
                  : 'lucide:volume-2'
            "
            class="size-4 shrink-0 text-white/60"
          />
          <input
            v-model.number="videoVolume"
            type="range"
            min="0"
            max="100"
            step="5"
            class="h-1 w-full cursor-pointer appearance-none bg-white/20 accent-accent-coral [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent-coral"
          />
          <span class="w-7 text-right text-[10px] text-white/40">{{ videoVolume }}</span>
        </div>
        <p class="mt-1.5 text-[10px] text-white/25">Kéo từ 0 để bật tiếng video</p>
      </div>
    </div>
  </Transition>
</template>
