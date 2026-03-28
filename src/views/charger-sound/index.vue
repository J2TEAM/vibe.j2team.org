<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useBattery, useLocalStorage } from '@vueuse/core'
import { Icon } from '@iconify/vue'

// Base URL for raw audio files on GitHub
const BASE_WAV_URL = 'https://raw.githubusercontent.com/mhqb365/charger-sound/master/wav/'

// List of all .wav files from the repository
const WAV_FILES = [
  'ack.wav',
  'ahh.wav',
  'applepay.wav',
  'bone-crack.wav',
  'ceeday-huh-sound-effect.wav',
  'censor-beep-1.wav',
  'ding-sound-effect_2.wav',
  'discord-notification.wav',
  'dry-fart.wav',
  'error_CDOxCYm.wav',
  'gey-echo.wav',
  'gunshotjbudden.wav',
  'iphone-1-4-charging-sound.wav',
  'magsafe.wav',
  'maro-jump-sound-effect_1.wav',
  'movie_1.wav',
  'oh-my-god-meme.wav',
  'perfect-fart.wav',
  'shocked-sound-effect.wav',
  'spiderman-meme-song.wav',
  'taco-bell-bong-sfx.wav',
  'uhh.wav',
  'undertakers-bell_2UwFCIe.wav',
  'vine-boom.wav',
  'wrong-answer-sound-effect.wav',
  'yamete kudasai.wav',
  'yamete.wav',
]

// State management
const { charging, isSupported, level } = useBattery()
const isEnabled = useLocalStorage('charger-sound-enabled', true)
const plugSound = useLocalStorage('charger-sound-plug', 'ahh.wav')
const unplugSound = useLocalStorage('charger-sound-unplug', 'uhh.wav')
const lastChargingState = ref(charging.value)
const isAudioBlocked = ref(false)

// Audio context and preloading
const audioCache = new Map<string, HTMLAudioElement>()

const preloadSounds = () => {
  WAV_FILES.forEach((filename) => {
    const audio = new Audio(BASE_WAV_URL + encodeURIComponent(filename))
    audio.preload = 'auto'
    audioCache.set(filename, audio)
  })
}

const playSound = async (filename: string) => {
  if (!isEnabled.value) return

  const audio = audioCache.get(filename) || new Audio(BASE_WAV_URL + encodeURIComponent(filename))
  audio.currentTime = 0

  try {
    await audio.play()
    isAudioBlocked.value = false
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'NotAllowedError') {
      isAudioBlocked.value = true
      console.warn('Audio blocked: User must interact with the page first.')
    }
  }
}

const previewSound = async (filename: string) => {
  const audio = audioCache.get(filename) || new Audio(BASE_WAV_URL + encodeURIComponent(filename))
  audio.currentTime = 0
  try {
    await audio.play()
    isAudioBlocked.value = false
  } catch (err) {
    console.error('Preview failed:', err)
  }
}

// Watch for charging state changes
watch(charging, (isCharging) => {
  if (!isEnabled.value) return

  if (isCharging && !lastChargingState.value) {
    playSound(plugSound.value)
  } else if (!isCharging && lastChargingState.value) {
    playSound(unplugSound.value)
  }
  lastChargingState.value = isCharging
})

onMounted(() => {
  lastChargingState.value = charging.value
  preloadSounds()
})

// UI Helper
const getIcon = (isCharging: boolean) => {
  if (isCharging) return 'lucide:battery-charging'
  if (level.value > 0.8) return 'lucide:battery-full'
  if (level.value > 0.3) return 'lucide:battery-medium'
  return 'lucide:battery-low'
}
</script>

<template>
  <div
    class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col items-center py-12 px-4 selection:bg-accent-coral/30"
  >
    <!-- Header -->
    <header class="w-full max-w-2xl mb-12 mt-12 animate-fade-up">
      <h1 class="font-display text-5xl md:text-6xl font-bold tracking-tight text-text-primary">
        Charger<span class="text-accent-coral">.</span>Sound
      </h1>

      <div
        class="mt-8 border-l-4 border-accent-amber pl-5 max-w-2xl animate-fade-up animate-delay-3"
      >
        <p class="text-lg text-text-secondary leading-relaxed">
          Giả lập âm thanh vui nhộn khi cắm hoặc rút sạc trên laptop
        </p>
      </div>
    </header>

    <main class="w-full max-w-2xl flex flex-col gap-8">
      <!-- Audio Blocked Notice -->
      <div
        v-if="isAudioBlocked"
        class="p-4 bg-accent-coral/20 border border-accent-coral/50 animate-pulse cursor-pointer transition-all hover:bg-accent-coral/30"
        @click="isAudioBlocked = false"
      >
        <div class="flex items-center gap-3">
          <Icon icon="lucide:volume-x" class="text-accent-coral size-5" />
          <p class="text-sm font-display font-medium text-text-primary">
            Âm thanh đang bị trình duyệt chặn. Click vào đây để kích hoạt
          </p>
        </div>
      </div>

      <!-- Feature Notice -->
      <div
        v-if="!isSupported"
        class="p-6 bg-accent-amber/10 border border-accent-amber/30 animate-fade-up animate-delay-1"
      >
        <div class="flex items-start gap-4">
          <Icon icon="lucide:alert-triangle" class="text-accent-amber size-6 shrink-0" />
          <div>
            <h3 class="font-display font-bold text-accent-amber mb-1 uppercase tracking-wider">
              Lỗi trình duyệt
            </h3>
            <p class="text-sm text-text-secondary">
              Trình duyệt của bạn không hỗ trợ Battery API. Vui lòng sử dụng Chrome hoặc các trình
              duyệt nhân Chromium
            </p>
          </div>
        </div>
      </div>

      <!-- Main Controls -->
      <div
        class="p-8 bg-bg-surface border border-border-default animate-fade-up animate-delay-2 relative overflow-hidden group"
      >
        <!-- Decorative Number -->
        <span
          class="absolute top-4 right-6 font-display text-7xl font-bold text-accent-coral/5 select-none pointer-events-none group-hover:text-accent-coral/10 transition-colors"
          >01</span
        >

        <div class="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div class="flex items-center gap-6">
            <div class="relative">
              <div
                class="size-20 bg-bg-deep border border-border-default flex items-center justify-center relative overflow-hidden"
              >
                <Icon
                  :icon="getIcon(charging)"
                  class="size-10 transition-colors duration-500"
                  :class="charging ? 'text-accent-coral' : 'text-text-secondary'"
                />
                <!-- Charge Level Fill -->
                <div
                  class="absolute bottom-0 left-0 w-full bg-accent-coral/10 transition-all duration-1000"
                  :style="{ height: `${level * 100}%` }"
                ></div>
              </div>
            </div>
            <div>
              <div class="font-display text-3xl font-bold mb-0.5 tracking-tight">
                {{ Math.round(level * 100) }}%
              </div>
              <div
                class="text-xs uppercase tracking-widest font-display"
                :class="charging ? 'text-accent-coral animate-pulse' : 'text-text-dim'"
              >
                {{ charging ? 'Đang sạc pin' : 'Đang dùng pin' }}
              </div>
            </div>
          </div>

          <button
            @click="isEnabled = !isEnabled"
            class="flex items-center gap-3 px-6 py-4 border transition-all duration-300 relative group/btn overflow-hidden"
            :class="
              isEnabled
                ? 'border-accent-coral bg-bg-elevated'
                : 'border-border-default bg-bg-surface hover:border-text-dim'
            "
          >
            <div
              class="size-3 transition-colors duration-300"
              :class="
                isEnabled ? 'bg-accent-coral shadow-[0_0_12px_rgba(255,107,74,0.5)]' : 'bg-text-dim'
              "
            ></div>
            <span class="font-display font-bold text-sm tracking-wider uppercase">
              {{ isEnabled ? 'Đang hoạt động' : 'Đang tắt' }}
            </span>
          </button>
        </div>

        <p
          v-if="isEnabled"
          class="mt-8 text-xs text-text-dim italic border-t border-border-default/50 pt-4 flex items-center gap-2"
        >
          <Icon icon="lucide:info" class="size-3" />
          Lưu ý: Bạn cần để tab này mở hoặc thu nhỏ để tính năng hoạt động
        </p>
      </div>

      <!-- Settings Section -->
      <div class="grid md:grid-cols-2 gap-8 animate-fade-up animate-delay-3">
        <!-- Plugged In -->
        <div
          class="p-6 bg-bg-surface border border-border-default flex flex-col gap-4 group hover:border-accent-coral transition-colors"
        >
          <div class="flex items-center justify-between">
            <h3
              class="font-display font-bold text-sm tracking-widest uppercase text-text-secondary group-hover:text-text-primary transition-colors"
            >
              Khi cắm sạc
            </h3>
            <Icon icon="lucide:zap" class="text-accent-coral size-5" />
          </div>

          <div class="flex gap-2">
            <select
              v-model="plugSound"
              class="flex-1 bg-bg-deep border border-border-default px-3 py-2 text-sm focus:outline-none focus:border-accent-coral transition-colors appearance-none cursor-pointer font-body"
            >
              <optgroup label="Danh sách âm thanh">
                <option v-for="sound in WAV_FILES" :key="sound" :value="sound">
                  {{ sound.replace('.wav', '') }}
                </option>
              </optgroup>
            </select>
            <button
              @click="previewSound(plugSound)"
              title="Nghe thử"
              class="size-10 bg-bg-deep border border-border-default flex items-center justify-center hover:bg-bg-elevated hover:border-accent-coral hover:text-accent-coral transition-all"
            >
              <Icon icon="lucide:play" class="size-4" />
            </button>
          </div>
        </div>

        <!-- Unplugged -->
        <div
          class="p-6 bg-bg-surface border border-border-default flex flex-col gap-4 group hover:border-accent-sky transition-colors"
        >
          <div class="flex items-center justify-between">
            <h3
              class="font-display font-bold text-sm tracking-widest uppercase text-text-secondary group-hover:text-text-primary transition-colors"
            >
              Khi rút sạc
            </h3>
            <Icon icon="lucide:unplug" class="text-accent-sky size-5" />
          </div>

          <div class="flex gap-2">
            <select
              v-model="unplugSound"
              class="flex-1 bg-bg-deep border border-border-default px-3 py-2 text-sm focus:outline-none focus:border-accent-sky transition-colors appearance-none cursor-pointer font-body"
            >
              <optgroup label="Danh sách âm thanh">
                <option v-for="sound in WAV_FILES" :key="sound" :value="sound">
                  {{ sound.replace('.wav', '') }}
                </option>
              </optgroup>
            </select>
            <button
              @click="previewSound(unplugSound)"
              title="Nghe thử"
              class="size-10 bg-bg-deep border border-border-default flex items-center justify-center hover:bg-bg-elevated hover:border-accent-sky hover:text-accent-sky transition-all"
            >
              <Icon icon="lucide:play" class="size-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- Footer / Actions -->
      <footer
        class="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 animate-fade-up animate-delay-4"
      >
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 text-sm text-text-dim hover:text-accent-coral transition-colors font-display tracking-widest uppercase group"
        >
          <Icon
            icon="lucide:arrow-left"
            class="size-4 group-hover:-translate-x-1 transition-transform"
          />
          Về trang chủ
        </RouterLink>

        <!-- Separator -->
        <div class="hidden sm:block w-px h-4 bg-border-default"></div>

        <a
          href="https://github.com/mhqb365/charger-sound"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 text-sm text-text-dim hover:text-accent-coral transition-colors font-display tracking-widest uppercase group"
        >
          <Icon icon="mdi:github" class="size-5" />
          Windows App
          <Icon
            icon="lucide:external-link"
            class="size-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"
          />
        </a>
      </footer>
    </main>
  </div>
</template>

<style scoped>
/* Custom select appearance for better aesthetics */
select {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%238B9DB5' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 1rem;
}

select optgroup {
  background-color: var(--bg-bg-deep);
  color: var(--text-text-primary);
}
</style>
