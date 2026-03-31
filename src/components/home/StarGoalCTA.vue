<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { Icon } from '@iconify/vue'
import { REPO_URL } from '@/data/constants'

const CACHE_KEY = 'vibe-star-count'
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const STAR_COUNT = 12

const stars = ref(0)
const loaded = ref(false)
const failed = ref(false)
const showParticles = ref(false)
const inView = ref(true)
const sectionRef = ref<HTMLElement>()

// Pre-compute trig values for particles
const particles = Array.from({ length: STAR_COUNT }, () => {
  const angle = Math.random() * 360
  const distance = 30 + Math.random() * 60
  const rad = (angle * Math.PI) / 180
  return {
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 8 + Math.random() * 12,
    delay: Math.random() * 0.6,
    duration: 0.8 + Math.random() * 0.6,
    flyX: `${Math.cos(rad) * distance}px`,
    flyY: `${Math.sin(rad) * distance}px`,
  }
})

const goal = computed(() => Math.ceil((stars.value + 1) / 100) * 100)
const progress = computed(() => Math.min((stars.value / goal.value) * 100, 100))
const prevMilestone = computed(() => goal.value - 100)

// Pause infinite animations when out of viewport
let observer: IntersectionObserver | undefined

function setupObserver() {
  if (!sectionRef.value) return
  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0]) inView.value = entries[0].isIntersecting
    },
    { threshold: 0 },
  )
  observer.observe(sectionRef.value)
}

onBeforeUnmount(() => observer?.disconnect())

async function fetchStars() {
  const cached = sessionStorage.getItem(CACHE_KEY)
  if (cached) {
    try {
      const { value, timestamp } = JSON.parse(cached)
      if (Date.now() - timestamp < CACHE_TTL) {
        stars.value = value
        loaded.value = true
        return
      }
    } catch {
      // ignore invalid cache
    }
  }

  try {
    const res = await fetch('https://img.shields.io/github/stars/J2TEAM/vibe.j2team.org.json')
    if (!res.ok) throw new Error('Failed to fetch')
    const data = await res.json()
    const count = parseInt(data.value, 10)
    if (Number.isNaN(count)) throw new Error('Invalid star count')

    stars.value = count
    loaded.value = true

    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ value: count, timestamp: Date.now() }))
  } catch {
    failed.value = true
  }
}

onMounted(async () => {
  await fetchStars()
  if (loaded.value) {
    // Wait a tick for the section to render before observing
    requestAnimationFrame(() => {
      setupObserver()
      showParticles.value = true
      setTimeout(() => {
        showParticles.value = false
      }, 2000)
    })
  }
})
</script>

<template>
  <section
    v-if="!failed"
    ref="sectionRef"
    class="max-w-5xl mx-auto px-4 sm:px-6 -mt-4 mb-8 animate-fade-up"
  >
    <!-- Loaded state -->
    <a
      v-if="loaded"
      :href="REPO_URL"
      target="_blank"
      rel="noopener noreferrer nofollow"
      class="group relative block border border-border-default bg-bg-surface p-5 sm:p-6 transition-all duration-300 hover:border-accent-coral/50 overflow-hidden"
    >
      <!-- Star particles on load -->
      <div v-if="showParticles" class="pointer-events-none absolute inset-0" aria-hidden="true">
        <!-- Shared symbol definition -->
        <svg class="absolute w-0 h-0">
          <defs>
            <symbol id="star-icon" viewBox="0 0 24 24">
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              />
            </symbol>
          </defs>
        </svg>
        <svg
          v-for="(p, i) in particles"
          :key="i"
          class="star-particle absolute text-accent-amber"
          fill="currentColor"
          :style="{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            '--fly-x': p.flyX,
            '--fly-y': p.flyY,
          }"
        >
          <use href="#star-icon" />
        </svg>
      </div>

      <!-- Header row -->
      <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div class="flex items-center gap-2.5">
          <Icon icon="lucide:star" class="w-5 h-5 text-accent-amber" />
          <span class="font-display text-sm tracking-widest text-accent-amber uppercase">
            Mục tiêu Star
          </span>
        </div>
        <span
          class="inline-flex items-center gap-2 border border-accent-coral/30 bg-accent-coral/10 px-4 py-1.5 font-display text-sm font-semibold text-accent-coral tracking-wide transition-all duration-300 group-hover:bg-accent-coral group-hover:text-bg-deep"
        >
          <Icon icon="lucide:github" class="w-4 h-4" />
          Tặng một sao trên GitHub
        </span>
      </div>

      <!-- Star count display -->
      <div class="flex items-baseline gap-2 mb-3">
        <span class="font-display text-3xl sm:text-4xl font-bold text-accent-coral tabular-nums">
          {{ stars.toLocaleString() }}
        </span>
        <span class="text-text-dim text-sm">/</span>
        <span class="font-display text-lg font-semibold text-text-secondary tabular-nums">
          {{ goal.toLocaleString() }}
        </span>
        <span class="text-text-dim text-sm">stars</span>
      </div>

      <!-- Progress bar -->
      <div class="relative h-3">
        <!-- Track -->
        <div class="absolute inset-0 bg-bg-deep rounded-full overflow-hidden">
          <!-- Filled bar -->
          <div
            class="progress-fill absolute inset-y-0 left-0 rounded-full"
            :class="{ 'is-paused': !inView }"
            :style="{ width: `${progress}%` }"
          >
            <!-- Animated stripes -->
            <div class="progress-stripes absolute inset-0 rounded-full" />
            <!-- Shimmer sweep -->
            <div class="progress-shimmer absolute inset-0 rounded-full" />
          </div>
        </div>
        <!-- Glow dot at the tip (outside overflow-hidden so glow is visible) -->
        <div
          class="progress-tip absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white transition-all duration-1000 ease-out"
          :class="{ 'is-paused': !inView }"
          :style="{ left: `calc(${progress}% - 10px)` }"
        />
      </div>

      <!-- Milestones -->
      <div class="flex justify-between mt-2 text-xs text-text-dim font-display tabular-nums">
        <span>{{ prevMilestone.toLocaleString() }}</span>
        <span>{{ goal.toLocaleString() }}</span>
      </div>
    </a>

    <!-- Skeleton loading state -->
    <div
      v-else
      class="block border border-border-default bg-bg-surface p-5 sm:p-6 animate-pulse"
      aria-hidden="true"
    >
      <!-- Header row skeleton -->
      <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div class="flex items-center gap-2.5">
          <div class="w-5 h-5 rounded bg-bg-deep" />
          <div class="h-4 w-28 rounded bg-bg-deep" />
        </div>
        <div class="h-8 w-48 rounded bg-bg-deep" />
      </div>

      <!-- Star count skeleton -->
      <div class="flex items-baseline gap-2 mb-3">
        <div class="h-9 sm:h-10 w-24 rounded bg-bg-deep" />
        <div class="h-4 w-2 rounded bg-bg-deep" />
        <div class="h-5 w-16 rounded bg-bg-deep" />
        <div class="h-4 w-10 rounded bg-bg-deep" />
      </div>

      <!-- Progress bar skeleton -->
      <div class="h-3 rounded-full bg-bg-deep" />

      <!-- Milestones skeleton -->
      <div class="flex justify-between mt-2">
        <div class="h-3 w-10 rounded bg-bg-deep" />
        <div class="h-3 w-10 rounded bg-bg-deep" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.progress-fill {
  background: linear-gradient(90deg, #ff6b4a, #ffb830);
  transition: width 1s ease-out;
}

/* Diagonal moving stripes */
.progress-stripes {
  background: repeating-linear-gradient(
    -45deg,
    transparent,
    transparent 6px,
    rgba(255, 255, 255, 0.1) 6px,
    rgba(255, 255, 255, 0.1) 12px
  );
  background-size: 17px 17px;
  animation: stripes-move 0.6s linear infinite;
}

@keyframes stripes-move {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 17px 0;
  }
}

/* Shimmer sweep across the bar */
.progress-shimmer {
  background: linear-gradient(
    105deg,
    transparent 35%,
    rgba(255, 255, 255, 0.25) 45%,
    rgba(255, 255, 255, 0.4) 50%,
    rgba(255, 255, 255, 0.25) 55%,
    transparent 65%
  );
  background-size: 200% 100%;
  animation: shimmer-sweep 2.5s ease-in-out infinite;
}

@keyframes shimmer-sweep {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Pause infinite animations when out of viewport */
.is-paused .progress-stripes,
.is-paused .progress-shimmer {
  animation-play-state: paused;
}

.progress-tip.is-paused {
  animation-play-state: paused;
}

/* Star particles burst on load */
.star-particle {
  animation: star-fly ease-out forwards;
  opacity: 0;
}

@keyframes star-fly {
  0% {
    opacity: 0;
    transform: translate(0, 0) scale(0) rotate(0deg);
  }
  20% {
    opacity: 1;
    transform: translate(0, 0) scale(1) rotate(0deg);
  }
  100% {
    opacity: 0;
    transform: translate(var(--fly-x), var(--fly-y)) scale(0.3) rotate(180deg);
  }
}

/* Glow pulse on the tip dot */
.progress-tip {
  animation: tip-pulse 2s ease-in-out infinite;
}

@keyframes tip-pulse {
  0%,
  100% {
    box-shadow:
      0 0 4px 1px rgba(255, 184, 48, 0.5),
      0 0 8px 3px rgba(255, 107, 74, 0.3);
  }
  50% {
    box-shadow:
      0 0 8px 3px rgba(255, 184, 48, 0.7),
      0 0 16px 6px rgba(255, 107, 74, 0.4);
  }
}
</style>
