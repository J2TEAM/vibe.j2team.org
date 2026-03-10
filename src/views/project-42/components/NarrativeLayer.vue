<script setup lang="ts">
import { SCENES } from "../scenes/config";

defineProps<{
  currentScene: number;
  scrollProgress: number;
}>();
</script>

<template>
  <Transition name="narrative-motion">
    <div
      :key="currentScene"
      class="fixed inset-0 flex flex-col items-center justify-center pointer-events-none px-6 text-center select-none"
    >
      <!-- Scene Type: Opening (Subtle & Elegant) -->
      <template v-if="SCENES[currentScene]?.type === 'opening'">
        <h1
          class="font-display text-xl md:text-3xl lg:text-4xl font-thin tracking-[0.2em] md:tracking-[0.5em] text-transparent uppercase text-outline-cinematic animate-reveal"
        >
          {{ SCENES[currentScene]?.text || "" }}
        </h1>
        <div
          v-if="scrollProgress < 0.1"
          class="mt-12 md:mt-16 animate-pulse-slow font-body text-white/60 text-[9px] md:text-[10px] tracking-[0.8em] md:tracking-[1.5em] uppercase px-4"
        >
          {{ SCENES[currentScene]?.subtext || "" }}
        </div>
      </template>

      <!-- Scene Type: Prologue (Atmospheric) -->
      <template v-else-if="SCENES[currentScene]?.type === 'prologue'">
        <p
          class="font-body text-white/50 text-sm md:text-2xl tracking-[0.1em] md:tracking-[0.15em] font-extralight italic leading-relaxed max-w-4xl px-4"
        >
          {{ SCENES[currentScene]?.text || "" }}
        </p>
      </template>

      <!-- Scene Type: Title (Gentle & Elegant) -->
      <template v-else-if="SCENES[currentScene]?.type === 'title'">
        <div class="flex flex-col items-center opacity-75 blur-[0.6px]">
          <h2
            class="font-display text-lg md:text-4xl lg:text-5xl tracking-[0.3em] md:tracking-[0.5em] font-extralight transition-all duration-1000 mb-4 px-4"
            :style="{
              color: SCENES[currentScene]?.accent || 'rgba(255, 255, 255, 0.75)',
              textShadow: `0 0 35px ${SCENES[currentScene]?.accent || 'rgba(255, 255, 255, 0.25)'}`,
            }"
          >
            {{ SCENES[currentScene]?.text || "" }}
          </h2>
          <p
            v-if="SCENES[currentScene]?.subtext"
            class="font-body text-xs md:text-lg tracking-[0.1em] md:tracking-[0.2em] font-light italic px-4"
            :style="{
              color: SCENES[currentScene]?.subtextAccent || 'rgba(255, 255, 255, 0.3)',
              textShadow: SCENES[currentScene]?.subtextAccent
                ? `0 0 20px ${SCENES[currentScene]?.subtextAccent}`
                : 'none',
            }"
          >
            {{ SCENES[currentScene]?.subtext || "" }}
          </p>
        </div>
      </template>

      <!-- Scene Type: Credits (Final Signature) -->
      <template v-else-if="SCENES[currentScene]?.type === 'credits'">
        <div class="flex flex-col items-center opacity-80 blur-[0.5px]">
          <p
            class="font-body text-[8px] md:text-xs tracking-[1em] md:tracking-[1.5em] uppercase text-white/30 mb-8 px-4 animate-reveal"
          >
            {{ SCENES[currentScene]?.text || "" }}
          </p>
          <h2
            class="font-display text-2xl md:text-6xl tracking-[0.4em] md:tracking-[0.8em] font-extralight text-white px-4"
            style="text-shadow: 0 0 40px rgba(255, 255, 255, 0.2)"
          >
            {{ SCENES[currentScene]?.subtext || "" }}
          </h2>
        </div>
      </template>
      <!-- Final Finale: Community Button -->
      <template v-else-if="currentScene === 50 && scrollProgress >= 1350.0">
        <div class="flex flex-col items-center opacity-95 blur-[0.2px] animate-reveal">
          <!-- Final Call to Action -->
          <a
            href="https://www.facebook.com/groups/j2team.community"
            target="_blank"
            rel="noopener noreferrer"
            class="pointer-events-auto terminal-btn group relative px-16 py-6 border border-[#38BDF8]/20 bg-black/70 backdrop-blur-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] transition-all hover:border-[#38BDF8]/60 inline-block no-underline"
          >
            <!-- Matrix/Scanline Texture -->
            <div class="absolute inset-0 bg-scanline opacity-10 group-hover:opacity-20"></div>

            <div class="relative flex flex-col items-center gap-1">
              <span
                class="text-[8px] text-white/30 group-hover:text-[#38BDF8]/80 transition-colors uppercase font-mono tracking-[0.4em] md:tracking-[0.6em] mb-2"
              >
                [ JOURNEY COMPLETE ]
              </span>
              <h2
                class="font-display text-lg md:text-3xl tracking-[0.2em] md:tracking-[0.3em] font-extralight text-white group-hover:text-[#38BDF8] group-hover:drop-shadow-[0_0_20px_rgba(56,189,248,0.6)] transition-all uppercase px-4"
              >
                Join J2TEAM Community
              </h2>
            </div>

            <!-- Kinetic Border Highlight -->
            <div
              class="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#38BDF8]/40 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-1000"
            ></div>
          </a>
        </div>
      </template>

      <template v-else>
        <div class="max-w-3xl flex flex-col items-center opacity-70 blur-[0.4px]">
          <p
            class="font-body text-base md:text-xl tracking-widest leading-loose font-extralight mb-4 px-4"
            :style="{
              color: SCENES[currentScene]?.accent || 'rgba(255, 255, 255, 0.4)',
              textShadow: `0 0 20px ${SCENES[currentScene]?.accent || 'rgba(255, 255, 255, 0.1)'}`,
            }"
          >
            {{ SCENES[currentScene]?.text || "" }}
          </p>
          <p
            v-if="SCENES[currentScene]?.subtext"
            class="font-body text-sm md:text-base tracking-[0.15em] font-light italic"
            :style="{
              color: SCENES[currentScene]?.subtextAccent || 'rgba(255, 255, 255, 0.3)',
              textShadow: SCENES[currentScene]?.subtextAccent
                ? `0 0 15px ${SCENES[currentScene]?.subtextAccent}`
                : 'none',
            }"
          >
            {{ SCENES[currentScene]?.subtext || "" }}
          </p>
        </div>
      </template>
    </div>
  </Transition>
</template>

<style scoped>
/* Cinematic Transition: Blur + Slide + Fade */
.narrative-motion-enter-active,
.narrative-motion-leave-active {
  transition: all 1.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.narrative-motion-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
  filter: blur(20px);
}

.narrative-motion-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(1.05);
  filter: blur(10px);
}

/* Typography Enhancements */
h1,
h2,
p {
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
}

.text-outline-cinematic {
  -webkit-text-stroke: 1px rgba(255, 255, 255, 0.15);
  text-stroke: 1px rgba(255, 255, 255, 0.15);
  letter-spacing: 0.8em;
  filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.1));
}

@keyframes title-reveal {
  0% {
    letter-spacing: 1.2em;
    opacity: 0;
    filter: blur(15px);
  }
  100% {
    letter-spacing: 0.6em;
    opacity: 1;
    filter: blur(0px);
  }
}

.animate-reveal {
  animation: title-reveal 3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.animate-reveal-slow {
  animation: title-reveal 2.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes pulse-slow {
  0%,
  100% {
    opacity: 0.2;
    transform: translateY(0);
  }
  50% {
    opacity: 0.5;
    transform: translateY(-5px);
  }
}

.animate-pulse-slow {
  animation: pulse-slow 5s ease-in-out infinite;
}

.terminal-btn {
  clip-path: polygon(
    0% 10px,
    10px 0%,
    calc(100% - 10px) 0%,
    100% 10px,
    100% calc(100% - 10px),
    calc(100% - 10px) 100%,
    10px 100%,
    0% calc(100% - 10px)
  );
}

.bg-scanline {
  background: linear-gradient(
    to bottom,
    transparent 50%,
    rgba(255, 255, 255, 0.05) 50%,
    transparent 51%
  );
  background-size: 100% 4px;
}

/* Glassy Backdrop for legibility if needed */
.narrative-content {
  text-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}
</style>
