<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useIntervalFn, useClipboard, useOnline } from '@vueuse/core'

interface Quote {
  content: string
  author: string
}

// ── State ──────────────────────────────────────────────────────────────────────
const currentQuote = ref<Quote>({ content: '', author: '' })
const isLoading = ref(false)
const isTransitioning = ref(false)
const error = ref('')
const timeLeft = ref(60) // 1 minute in seconds
const copiedMsg = ref(false)

const { copy } = useClipboard()
const isOnline = useOnline()

// ── API logic ──────────────────────────────────────────────────────────────────
async function fetchFromApi(): Promise<Quote | null> {
  try {
    const res = await fetch('https://api.quotable.io/random?maxLength=200')
    if (!res.ok) throw new Error('API error')
    const data = (await res.json()) as { content: string; author: string }
    return { content: data.content, author: data.author }
  } catch {
    return null
  }
}

// ── Quote refresh ──────────────────────────────────────────────────────────────
async function refreshQuote(animate = true) {
  if (isLoading.value) return

  if (animate) {
    isTransitioning.value = true
    await new Promise((r) => setTimeout(r, 400))
  }

  isLoading.value = true
  error.value = ''

  const quote = await fetchFromApi()
  if (quote) {
    currentQuote.value = quote
  } else {
    error.value = 'Could not load a quote. Please check your connection.'
  }

  isLoading.value = false

  if (animate) {
    await new Promise((r) => setTimeout(r, 50))
    isTransitioning.value = false
  }

  timeLeft.value = 60
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
  if (timeLeft.value <= 1) {
    refreshQuote()
  } else {
    timeLeft.value--
  }
}, 1000)

const timerProgress = computed(() => ((60 - timeLeft.value) / 60) * 100)

// ── Init ───────────────────────────────────────────────────────────────────────
refreshQuote(false)

onUnmounted(() => {
  pauseCountdown()
})
</script>

<template>
  <div class="min-h-screen bg-bg-deep flex flex-col">
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
            >Daily Quote</span
          >
        </div>
      </div>
    </header>

    <!-- Main content -->
    <main class="flex-1 flex flex-col items-center justify-center px-6 py-12">
      <!-- Quote -->
      <div
        class="w-full max-w-2xl text-center animate-fade-up animate-delay-2 px-4"
        :class="isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'"
        style="
          transition:
            opacity 0.4s ease,
            transform 0.4s ease;
        "
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

      <!-- Offline notice -->
      <div
        v-if="!isOnline"
        class="mt-6 flex items-center gap-2 border border-accent-amber/30 bg-accent-amber/5 px-4 py-2 animate-fade-up"
      >
        <Icon icon="lucide:wifi-off" class="size-4 text-accent-amber" />
        <span class="font-display text-xs text-accent-amber tracking-wide">
          Offline — showing curated quotes
        </span>
      </div>

      <!-- Error notice -->
      <div
        v-if="error"
        class="mt-6 flex items-center gap-2 border border-accent-coral/30 bg-accent-coral/5 px-4 py-2 animate-fade-up"
      >
        <Icon icon="lucide:alert-triangle" class="size-4 text-accent-coral" />
        <span class="font-display text-xs text-accent-coral tracking-wide">{{ error }}</span>
      </div>
    </main>

    <!-- Footer -->
    <footer class="border-t border-border-default py-4">
      <div
        class="max-w-5xl mx-auto px-6 flex flex-wrap items-center justify-between gap-2 text-text-dim"
      >
        <span class="font-display text-xs tracking-wide">
          Daily Quote — by
          <a
            href="https://www.facebook.com/huy.nguyen.682"
            target="_blank"
            rel="noopener noreferrer"
            class="text-accent-coral hover:underline"
          >
            huynguyen260398
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
