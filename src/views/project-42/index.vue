<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * PROJECT 42 - Immersive Scroll-driven 3D Web Experience
 * Author: sanghynh
 */
import { onMounted, onUnmounted, watch } from "vue";
import { RouterLink } from "vue-router";
import { useThree } from "./composables/useThree";
import { preloadAudio, initAudio, tickAudio, cleanupAudio } from "./audio";
import NarrativeLayer from "./components/NarrativeLayer.vue";

const { canvasRef, isLoading, loadingProgress, currentScene, scrollProgress, init, cleanup } =
  useThree();

let _audioStarted = false;

const startAudio = () => {
  if (_audioStarted || loadingProgress.value < 100) return;

  const ToneLib = (window as unknown as { Tone: any }).Tone;
  if (!ToneLib) return;

  _audioStarted = true;

  ToneLib.start().then(() => {
    initAudio().then(() => {
      tickAudio(scrollProgress.value);
    });
  });

  // Cleanup all possible triggers
  window.removeEventListener("click", startAudio);
  window.removeEventListener("keydown", startAudio);
  window.removeEventListener("wheel", startAudio);
  window.removeEventListener("touchstart", startAudio);
};

// Bind global triggers for first interaction — Click and Keydown are safe
window.addEventListener("click", startAudio, { once: true });
window.addEventListener("keydown", startAudio, { once: true });

const handleBegin = () => {
  startAudio();
  // Smoothly exit loading screen
  setTimeout(() => {
    isLoading.value = false;
  }, 400);
};

watch(scrollProgress, (val) => {
  tickAudio(val);
});

onMounted(async () => {
  // Song song: 3D engine + Tone CDN preload
  await Promise.all([init(), preloadAudio()]);
});

onUnmounted(() => {
  cleanup();
  cleanupAudio();
  window.removeEventListener("click", startAudio);
  window.removeEventListener("keydown", startAudio);
});
</script>

<template>
  <div class="fixed inset-0 bg-black text-white overflow-hidden cursor-none select-none">
    <!-- 3D Canvas Context -->
    <canvas ref="canvasRef" class="absolute inset-0 w-full h-full" />

    <!-- UI Core Layer -->
    <div class="relative z-10 flex flex-col min-h-screen pointer-events-none">
      <!-- Top Navigation -->
      <nav class="p-6 pointer-events-auto">
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 border border-white/10 bg-black/40 backdrop-blur-md px-4 py-2 text-[10px] tracking-[0.2em] uppercase transition-all hover:bg-white/5 group shadow-lg"
        >
          <span class="group-hover:-translate-x-1 transition-transform">&larr;</span>
          J2Team Home
        </RouterLink>
      </nav>

      <!-- Narrative & Loading Layer -->
      <div class="flex-1 flex flex-col items-center justify-center px-10 text-center">
        <Transition name="fade-fast">
          <div
            v-if="isLoading"
            class="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm"
            :class="{ 'cursor-pointer pointer-events-auto': loadingProgress === 100 }"
            @click="loadingProgress === 100 && handleBegin()"
          >
            <!-- Outline/Fill Text -->
            <div class="relative mb-8 select-none">
              <h1
                class="font-display text-4xl md:text-7xl lg:text-8xl font-black tracking-[0.3em] uppercase text-outline"
              >
                J2TEAM
              </h1>
              <h1
                class="absolute top-0 left-0 font-display text-4xl md:text-7xl lg:text-8xl font-black tracking-[0.3em] uppercase text-fill overflow-hidden transition-all duration-300"
                :style="{ width: loadingProgress + '%' }"
              >
                J2TEAM
              </h1>
            </div>

            <!-- Technical Progress Bar -->
            <div class="w-48 md:w-64 h-1 bg-white/5 rounded-full overflow-hidden relative">
              <div
                class="absolute top-0 left-0 h-full bg-[#38BDF8] shadow-[0_0_15px_#38BDF8] transition-all duration-500 ease-out"
                :style="{ width: loadingProgress + '%' }"
              ></div>
            </div>

            <div
              v-if="loadingProgress === 100"
              class="mt-8 font-display text-[12px] tracking-[0.5em] uppercase text-[#38BDF8] animate-pulse transition-colors"
            >
              [ click anywhere to begin ]
            </div>
            <div
              v-else
              class="mt-4 font-display text-[10px] tracking-[0.5em] uppercase text-[#38BDF8]/60 animate-pulse"
            >
              System Initialization: {{ loadingProgress }}%
            </div>
          </div>
          <NarrativeLayer
            v-else
            :current-scene="currentScene"
            :scroll-progress="scrollProgress"
          />
        </Transition>
      </div>

      <!-- Footer Info -->
      <footer
        class="p-8 flex justify-between items-end opacity-20 transition-opacity hover:opacity-100"
      >
        <div class="font-display text-[10px] tracking-[0.3em] uppercase text-white/40">
          Vol.42 / 2026
        </div>
        <div class="flex flex-col items-end gap-1">
          <div class="font-display text-[10px] tracking-[0.3em] uppercase text-white/40">
            Auth: sanghynh
          </div>
          <div class="w-24 h-0.5 bg-white/5 overflow-hidden relative">
            <div
              class="absolute inset-0 bg-[#38BDF8] transition-transform duration-300 origin-left shadow-[0_0_10px_#38BDF8]"
              :style="{ transform: `scaleX(${Math.min(scrollProgress / 20, 1)})` }"
            ></div>
          </div>
        </div>
      </footer>
    </div>
  </div>
</template>

<style scoped>
canvas {
  touch-action: none;
}

.text-outline {
  -webkit-text-stroke: 1px rgba(255, 255, 255, 0.1);
  color: transparent;
}

.text-fill {
  color: #38bdf8;
  text-shadow: 0 0 30px rgba(56, 189, 248, 0.5);
}

.fade-fast-enter-active,
.fade-fast-leave-active {
  transition: opacity 0.5s ease;
}

.fade-fast-enter-from,
.fade-fast-leave-to {
  opacity: 0;
}
</style>
