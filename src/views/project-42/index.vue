<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
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

  window.removeEventListener("click", startAudio);
  window.removeEventListener("keydown", startAudio);
  window.removeEventListener("wheel", startAudio);
  window.removeEventListener("touchstart", startAudio);
};

window.addEventListener("click", startAudio);
window.addEventListener("keydown", startAudio);
window.addEventListener("wheel", startAudio);
window.addEventListener("touchstart", startAudio);

const handleBegin = () => {
  startAudio();
  setTimeout(() => {
    isLoading.value = false;
  }, 400);
};

watch(scrollProgress, (val) => {
  tickAudio(val);
});

onMounted(async () => {
  await Promise.all([init(), preloadAudio()]);
});

onUnmounted(() => {
  cleanup();
  cleanupAudio();
  window.removeEventListener("click", startAudio);
  window.removeEventListener("keydown", startAudio);
  window.removeEventListener("wheel", startAudio);
  window.removeEventListener("touchstart", startAudio);
});
</script>

<template>
  <div class="fixed inset-0 bg-bg-deep text-text-primary overflow-hidden cursor-none select-none">
    <!-- 3D Canvas Context -->
    <canvas ref="canvasRef" class="absolute inset-0 w-full h-full" />

    <!-- UI Core Layer -->
    <div class="relative z-10 flex flex-col min-h-screen pointer-events-none">
      <!-- Top Navigation -->
      <nav class="p-6 pointer-events-auto z-[60]">
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-5 py-2.5 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
        >
          &larr; J2Team Home
        </RouterLink>
      </nav>

      <!-- Narrative & Loading Layer -->
      <div class="flex-1 flex flex-col items-center justify-center px-10 text-center">
        <Transition name="fade-fast">
          <div
            v-if="isLoading"
            class="absolute inset-0 z-50 flex flex-col items-center justify-center bg-bg-deep/60 backdrop-blur-sm"
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
                class="absolute top-0 left-0 h-full bg-[#FF6B4A] transition-all duration-500 ease-out"
                :style="{ width: loadingProgress + '%' }"
              ></div>
            </div>

            <div
              v-if="loadingProgress === 100"
              class="mt-8 font-display text-[12px] tracking-[0.5em] uppercase text-[#FF6B4A] animate-pulse transition-colors"
            >
              [ click anywhere to begin ]
            </div>
            <div
              v-else
              class="mt-4 font-display text-[10px] tracking-[0.5em] uppercase text-[#FF6B4A]/60 animate-pulse"
            >
              System Initialization: {{ loadingProgress }}%
            </div>
          </div>
          <NarrativeLayer v-else :current-scene="currentScene" :scroll-progress="scrollProgress" />
        </Transition>
      </div>

      <!-- Footer Info -->
      <footer
        class="p-8 flex justify-between items-end opacity-50 md:opacity-20 transition-opacity md:hover:opacity-100"
      >
        <div
          class="font-display text-[9px] md:text-[10px] tracking-[0.2em] md:tracking-[0.3em] uppercase text-text-dim"
        >
          Vol.42 / 2026
        </div>
        <div class="flex flex-col items-end gap-1">
          <div
            class="font-display text-[9px] md:text-[10px] tracking-[0.2em] md:tracking-[0.3em] uppercase text-text-dim"
          >
            Auth: sanghynh
          </div>
          <div class="w-16 md:w-24 h-0.5 bg-white/5 overflow-hidden relative">
            <div
              class="absolute inset-0 bg-[#FF6B4A] transition-transform duration-300 origin-left shadow-[0_0_10px_#FF6B4A]"
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
  color: #ff6b4a;
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
