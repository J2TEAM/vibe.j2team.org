<script setup lang="ts">
import { computed } from 'vue'
import { useNow, useFullscreen } from '@vueuse/core'
import { Icon } from '@iconify/vue'
import VideoBackground from './components/VideoBackground.vue'
import MusicPlayer from './components/MusicPlayer.vue'
import PomodoroTimer from './components/PomodoroTimer.vue'
import TodoList from './components/TodoList.vue'
import SettingsPanel from './components/SettingsPanel.vue'
import { useSpaceSettings } from './composables/useSpaceSettings'

const now = useNow()
const { isFullscreen, toggle: toggleFullscreen } = useFullscreen()
const settings = useSpaceSettings()

const currentTime = computed(() => {
  const d = now.value
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
})

const currentDate = computed(() => {
  return now.value.toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})
</script>

<template>
  <div class="relative min-h-screen select-none overflow-hidden">
    <!-- Video Background (always visible) -->
    <VideoBackground />

    <!-- Center Clock -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-show="settings.showClock && !settings.zenMode"
        class="pointer-events-none relative z-10 flex min-h-screen flex-col items-center justify-center"
      >
        <div class="animate-fade-up text-center">
          <div
            class="font-display text-8xl font-bold tabular-nums tracking-tight text-white drop-shadow-2xl sm:text-9xl"
          >
            {{ currentTime }}
          </div>
          <Transition
            enter-active-class="transition duration-300 ease-out"
            enter-from-class="opacity-0 -translate-y-2"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition duration-200 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 -translate-y-2"
          >
            <div
              v-show="settings.showDate"
              class="mt-2 font-body text-lg text-white/60 drop-shadow-lg sm:text-xl"
            >
              {{ currentDate }}
            </div>
          </Transition>
        </div>

        <Transition
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="opacity-0 translate-y-2"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition duration-200 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 translate-y-2"
        >
          <div v-show="settings.showQuote" class="mt-8 animate-fade-up animate-delay-2">
            <p class="text-center font-body text-sm text-white/40 italic sm:text-base">
              "Tập trung là nghệ thuật loại bỏ những điều không cần thiết."
            </p>
          </div>
        </Transition>
      </div>
    </Transition>

    <!-- Pomodoro Timer -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <PomodoroTimer v-show="settings.showPomodoro && !settings.zenMode" />
    </Transition>

    <!-- Music Player -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-2"
    >
      <MusicPlayer v-show="settings.showMusic && !settings.zenMode" />
    </Transition>

    <!-- Todo List -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-2"
    >
      <TodoList v-show="settings.showTodo && !settings.zenMode" />
    </Transition>

    <!-- Bottom Bar -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-2"
    >
      <div
        v-show="!settings.zenMode"
        class="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2"
      >
        <RouterLink
          to="/"
          class="flex items-center gap-2 border border-white/20 bg-black/50 px-3 py-2 text-sm text-white/60 backdrop-blur-md transition-all hover:border-white/40 hover:bg-black/60 hover:text-white"
        >
          <Icon icon="lucide:home" class="size-4" />
          <span class="hidden sm:inline">Trang chủ</span>
        </RouterLink>

        <button
          class="flex items-center gap-2 border border-white/20 bg-black/50 px-3 py-2 text-sm text-white/60 backdrop-blur-md transition-all hover:border-white/40 hover:bg-black/60 hover:text-white"
          @click="toggleFullscreen"
        >
          <Icon :icon="isFullscreen ? 'lucide:minimize' : 'lucide:maximize'" class="size-4" />
          <span class="hidden sm:inline">{{ isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình' }}</span>
        </button>

        <!-- Settings trigger (self-contained in SettingsPanel) -->
        <SettingsPanel />
      </div>
    </Transition>

    <!-- Zen Mode Exit — subtle hint at bottom -->
    <Transition
      enter-active-class="transition duration-500 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-300 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="settings.zenMode" class="group fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
        <button
          class="flex items-center gap-2 border border-white/0 bg-transparent px-4 py-2 text-sm text-white/0 transition-all duration-300 group-hover:border-white/20 group-hover:bg-black/50 group-hover:text-white/70 group-hover:backdrop-blur-md"
          @click="settings.zenMode = false"
        >
          <Icon icon="lucide:eye" class="size-4" />
          <span>Thoát Zen Mode</span>
        </button>
      </div>
    </Transition>
  </div>
</template>
