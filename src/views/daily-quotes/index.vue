<script setup lang="ts">
import { ref, computed, onUnmounted, nextTick } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useIntervalFn, useClipboard } from '@vueuse/core'

interface Quote {
  content: string
  author: string
}

// ── Fallback quotes ────────────────────────────────────────────────────────────
const fallbackQuotes: Quote[] = [
  {
    content: 'The only way to do great work is to love what you do.',
    author: 'Steve Jobs',
  },
  {
    content: 'In the middle of every difficulty lies opportunity.',
    author: 'Albert Einstein',
  },
  {
    content: 'It does not matter how slowly you go as long as you do not stop.',
    author: 'Confucius',
  },
  {
    content: 'Life is what happens when you are busy making other plans.',
    author: 'John Lennon',
  },
  {
    content: 'The future belongs to those who believe in the beauty of their dreams.',
    author: 'Eleanor Roosevelt',
  },
  {
    content: 'Strive not to be a success, but rather to be of value.',
    author: 'Albert Einstein',
  },
  {
    content: 'Two roads diverged in a wood, and I took the one less traveled by.',
    author: 'Robert Frost',
  },
  {
    content: "You miss 100% of the shots you don't take.",
    author: 'Wayne Gretzky',
  },
  {
    content: 'Whether you think you can or you think you cannot, you are right.',
    author: 'Henry Ford',
  },
  {
    content: 'The best time to plant a tree was 20 years ago. The second best time is now.',
    author: 'Chinese Proverb',
  },
  {
    content: 'An unexamined life is not worth living.',
    author: 'Socrates',
  },
  {
    content: 'Spread love everywhere you go. Let no one ever come to you without leaving happier.',
    author: 'Mother Teresa',
  },
  {
    content: 'When you reach the end of your rope, tie a knot in it and hang on.',
    author: 'Franklin D. Roosevelt',
  },
  {
    content: 'Always remember that you are absolutely unique. Just like everyone else.',
    author: 'Margaret Mead',
  },
  {
    content: "Don't judge each day by the harvest you reap but by the seeds that you plant.",
    author: 'Robert Louis Stevenson',
  },
  {
    content: 'The only impossible journey is the one you never begin.',
    author: 'Tony Robbins',
  },
  {
    content: 'In three words I can sum up everything I have learned about life: it goes on.',
    author: 'Robert Frost',
  },
  {
    content: 'Love the life you live. Live the life you love.',
    author: 'Bob Marley',
  },
  {
    content: 'Life is either a daring adventure or nothing at all.',
    author: 'Helen Keller',
  },
  {
    content:
      "Many of life's failures are people who did not realize how close they were to success when they gave up.",
    author: 'Thomas A. Edison',
  },
]

function getRandomFallbackQuote(): Quote {
  const index = Math.floor(Math.random() * fallbackQuotes.length)
  return fallbackQuotes[index]!
}

const DURATION = 60 // total seconds per quote
const PREFETCH_AT = 10 // start prefetching when this many seconds remain

// ── State ──────────────────────────────────────────────────────────────────────
const currentQuote = ref<Quote>({ content: '', author: '' })
const isTransitioning = ref(false)
const timeLeft = ref(DURATION)
const copiedMsg = ref(false)
const usingFallback = ref(false)
const nextQuote = ref<Quote | null>(null)
const nextIsFallback = ref(false)
const isPrefetching = ref(false)

const { copy } = useClipboard()

// ── API logic ──────────────────────────────────────────────────────────────────
async function fetchFromApi(): Promise<Quote | null> {
  try {
    const res = await fetch('https://api.quotable.io/random?maxLength=200')
    if (!res.ok) return null
    const data = (await res.json()) as { content?: string; author?: string }
    if (!data.content || !data.author) return null
    return { content: data.content, author: data.author }
  } catch {
    return null
  }
}

// ── Pick a fallback different from the current quote ──────────────────────────
function getDifferentFallbackQuote(): Quote {
  const available = fallbackQuotes.filter((q) => q.content !== currentQuote.value.content)
  const pool = available.length > 0 ? available : fallbackQuotes
  return pool[Math.floor(Math.random() * pool.length)]!
}

// ── Prefetch next quote in background ─────────────────────────────────────────
async function prefetchNextQuote() {
  if (isPrefetching.value || nextQuote.value) return
  isPrefetching.value = true

  let apiQuote = await fetchFromApi()
  // Retry once if the API returned the same quote as current
  if (apiQuote && apiQuote.content === currentQuote.value.content) {
    apiQuote = await fetchFromApi()
  }

  if (apiQuote && apiQuote.content !== currentQuote.value.content) {
    nextQuote.value = apiQuote
    nextIsFallback.value = false
  } else {
    nextQuote.value = getDifferentFallbackQuote()
    nextIsFallback.value = true
  }
  isPrefetching.value = false
}

// ── Swap to prefetched quote with fade-out / fade-in ──────────────────────────
async function swapQuote() {
  isTransitioning.value = true
  await new Promise((r) => setTimeout(r, 500)) // wait for fade-out

  if (nextQuote.value) {
    currentQuote.value = nextQuote.value
    usingFallback.value = nextIsFallback.value
    nextQuote.value = null
    nextIsFallback.value = false
  } else {
    currentQuote.value = getDifferentFallbackQuote()
    usingFallback.value = true
  }

  timeLeft.value = DURATION
  await nextTick() // ensure DOM reflects new content before fading in
  isTransitioning.value = false
}

// ── Copy to clipboard ──────────────────────────────────────────────────────────
async function copyQuote() {
  const text = `"${currentQuote.value.content}" — ${currentQuote.value.author}`
  await copy(text)
  copiedMsg.value = true
  setTimeout(() => {
    copiedMsg.value = false
  }, 2000)
}

// ── Countdown timer ────────────────────────────────────────────────────────────
const { pause: pauseCountdown } = useIntervalFn(() => {
  if (isTransitioning.value) return
  timeLeft.value--

  if (timeLeft.value <= PREFETCH_AT && !nextQuote.value && !isPrefetching.value) {
    prefetchNextQuote()
  }

  if (timeLeft.value <= 0) {
    swapQuote()
  }
}, 1000)

const timerProgress = computed(() => ((DURATION - timeLeft.value) / DURATION) * 100)

// ── Init ───────────────────────────────────────────────────────────────────────
;(async () => {
  const apiQuote = await fetchFromApi()
  if (apiQuote) {
    currentQuote.value = apiQuote
    usingFallback.value = false
  } else {
    currentQuote.value = getRandomFallbackQuote()
    usingFallback.value = true
  }
})()

onUnmounted(() => {
  pauseCountdown()
})
</script>

<template>
  <div class="min-h-screen bg-black flex flex-col">
    <!-- Header -->
    <header class="border-b border-border-default">
      <div class="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <RouterLink
          to="/"
          class="flex items-center gap-2 text-text-secondary hover:text-accent-coral transition-colors"
        >
          <Icon icon="lucide:arrow-left" class="size-4" />
          <span class="font-display text-sm tracking-wide">Back to Home</span>
        </RouterLink>

        <div class="flex items-center gap-2">
          <span class="font-display text-xs tracking-widest text-text-dim uppercase"
            >Daily Quotes</span
          >
        </div>
      </div>
    </header>

    <!-- Main content -->
    <main class="flex-1 flex flex-col items-center justify-center px-6 py-12">
      <!-- Tagline -->
      <p
        class="font-display text-xs tracking-widest text-text-dim uppercase mb-10 animate-fade-up animate-delay-1"
      >
        A thought to carry through your day
      </p>

      <!-- Quote -->
      <div
        class="w-full max-w-2xl text-center px-4"
        :class="isTransitioning ? 'opacity-0' : 'opacity-100'"
        style="transition: opacity 0.5s ease"
      >
        <blockquote class="mb-6">
          <p class="font-body text-2xl md:text-3xl text-text-primary leading-relaxed">
            "{{ currentQuote.content }}"
          </p>
        </blockquote>

        <footer class="flex items-center justify-center gap-3">
          <span class="w-8 h-px bg-accent-coral flex-shrink-0" />
          <cite
            class="font-display text-sm font-semibold text-accent-coral not-italic tracking-wide"
          >
            {{ currentQuote.author }}
          </cite>
          <span class="w-8 h-px bg-accent-coral flex-shrink-0" />
        </footer>
      </div>

      <!-- Actions row -->
      <div class="mt-8 flex items-center justify-center animate-fade-up animate-delay-3">
        <!-- Copy button -->
        <button
          class="flex items-center gap-2 border border-border-default bg-bg-surface px-5 py-2.5 font-display text-sm text-text-secondary hover:border-accent-amber hover:text-accent-amber hover:bg-bg-elevated transition-all duration-200 active:scale-95"
          @click="copyQuote"
        >
          <Icon :icon="copiedMsg ? 'lucide:check' : 'lucide:copy'" class="size-4" />
          {{ copiedMsg ? 'Copied!' : 'Copy' }}
        </button>
      </div>

      <!-- Timer progress bar -->
      <div class="mt-10 animate-fade-up animate-delay-4">
        <div class="w-48 h-0.5 bg-border-default overflow-hidden">
          <div
            class="h-full bg-accent-coral transition-all duration-1000 ease-linear"
            :style="{ width: `${timerProgress}%` }"
          />
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="border-t border-border-default py-4">
      <div
        class="max-w-5xl mx-auto px-6 flex flex-wrap items-center justify-between gap-2 text-text-dim"
      >
        <span class="font-display text-xs tracking-wide">
          Daily Quotes — by
          <a
            href="https://api.quotable.io/"
            target="_blank"
            rel="noopener noreferrer"
            class="text-accent-coral hover:underline"
          >
            api.quotable.io
          </a>
        </span>
        <RouterLink
          to="/"
          class="font-display text-xs tracking-wide hover:text-accent-coral transition-colors"
        >
          ← vibe.j2team.org
        </RouterLink>
      </div>
    </footer>
  </div>
</template>
