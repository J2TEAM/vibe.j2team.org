<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'

interface Quote {
  content: string
  author: string
  source: string
}

const FORTUNE_VN_URL = 'https://raw.githubusercontent.com/icy/fortune-vn/master/fortune-vn'
const RANDOM_QUOTES_URL = 'https://random-quotes-freeapi.vercel.app/api/random'
const ADVICE_SLIP_URL = 'https://api.adviceslip.com/advice'

const currentQuote = ref<Quote>({ content: '', author: '', source: '' })
const isLoading = ref(true)
let fortuneVnQuotes: string[] = []

async function loadFortuneVn(): Promise<void> {
  try {
    const res = await fetch(FORTUNE_VN_URL)
    const text = await res.text()
    fortuneVnQuotes = text
      .split('\n%\n')
      .map((q) => q.trim())
      .filter((q) => q.length > 0)
  } catch {
    fortuneVnQuotes = []
  }
}

function getFortuneVn(): Quote {
  const raw = fortuneVnQuotes[Math.floor(Math.random() * fortuneVnQuotes.length)] ?? ''
  return { content: raw, author: '', source: 'fortune-vn' }
}

async function getRandomQuote(): Promise<Quote> {
  const res = await fetch(RANDOM_QUOTES_URL)
  const data = await res.json()
  return { content: data.quote, author: data.author, source: 'random-quotes' }
}

async function getAdviceSlip(): Promise<Quote> {
  const res = await fetch(`${ADVICE_SLIP_URL}?t=${Date.now()}`)
  const data = await res.json()
  return { content: data.slip.advice, author: '', source: 'advice-slip' }
}

async function fetchQuote(): Promise<void> {
  isLoading.value = true
  try {
    const sources = [
      ...(fortuneVnQuotes.length > 0 ? [getFortuneVn] : []),
      getRandomQuote,
      getAdviceSlip,
    ]
    const pick = sources[Math.floor(Math.random() * sources.length)]
    currentQuote.value =
      typeof pick === 'function' && pick.constructor.name !== 'AsyncFunction'
        ? (pick as () => Quote)()
        : await (pick as () => Promise<Quote>)()
  } catch {
    currentQuote.value = {
      content: 'Không thể tải danh ngôn. Hãy thử lại nhé!',
      author: '',
      source: '',
    }
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await loadFortuneVn()
  await fetchQuote()
})
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body px-4 py-8">
    <div
      class="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-2xl flex-col items-center justify-center"
    >
      <!-- Header -->
      <div class="text-center animate-fade-up">
        <h1
          class="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-accent-coral tracking-wide"
        >
          Fortune Quotes
        </h1>
        <p class="mt-3 text-text-secondary text-sm sm:text-base max-w-md mx-auto">
          Những câu nói hay về cuộc sống, sự nghiệp và nhiều chủ đề khác
        </p>
      </div>

      <!-- Quote Card -->
      <div
        class="quote-card mt-8 w-full rounded-lg border border-border-default bg-bg-surface p-6 sm:p-8 animate-fade-up animate-delay-1 transition-all duration-400"
        :class="{ 'opacity-50': isLoading }"
      >
        <div class="relative">
          <span
            class="absolute -top-2 -left-1 text-4xl text-accent-coral/30 font-display select-none"
            >&ldquo;</span
          >

          <p
            class="text-lg sm:text-xl md:text-2xl font-medium leading-relaxed pl-6 pr-2 text-text-primary whitespace-pre-line"
          >
            {{ currentQuote.content }}
          </p>
        </div>

        <div v-if="currentQuote.author" class="mt-6 pl-6">
          <p class="text-accent-amber text-sm sm:text-base font-medium">
            — {{ currentQuote.author }}
          </p>
        </div>
      </div>

      <!-- Action Button -->
      <button
        type="button"
        class="mt-6 group inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent-coral text-bg-deep font-display text-sm font-bold tracking-wide transition-all duration-200 hover:bg-accent-coral/90 active:scale-95 animate-fade-up animate-delay-2"
        :disabled="isLoading"
        @click="fetchQuote"
      >
        <svg
          class="w-4 h-4 transition-transform duration-300"
          :class="isLoading ? 'animate-spin' : 'group-hover:rotate-180'"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        Câu khác
      </button>

      <!-- Back to Home -->
      <RouterLink
        to="/"
        class="mt-10 inline-flex items-center gap-2 border border-border-default bg-bg-surface px-5 py-2.5 text-sm text-text-secondary transition hover:border-accent-coral hover:bg-bg-elevated hover:text-text-primary animate-fade-up animate-delay-3"
      >
        &larr; Về trang chủ
      </RouterLink>

      <!-- Source & Author Credit -->
      <div class="mt-8 text-center text-text-dim text-xs space-y-1 animate-fade-up animate-delay-4">
        <p>Nguồn danh ngôn:</p>
        <div class="flex flex-wrap justify-center gap-x-1 gap-y-1">
          <a
            href="https://github.com/icy/fortune-vn"
            target="_blank"
            rel="noopener noreferrer"
            class="text-accent-sky hover:text-accent-coral transition-colors link-underline"
            >icy/fortune-vn</a
          ><span>,</span>
          <a
            href="https://random-quotes-freeapi.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            class="text-accent-sky hover:text-accent-coral transition-colors link-underline"
            >Random Quotes API</a
          ><span>,</span>
          <a
            href="https://api.adviceslip.com"
            target="_blank"
            rel="noopener noreferrer"
            class="text-accent-sky hover:text-accent-coral transition-colors link-underline"
            >Advice Slip API</a
          >
        </div>
        <p class="pt-1">Tạo bởi <span class="text-text-secondary">Trọng Thăng</span></p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.quote-card {
  box-shadow: 0 4px 24px rgb(0 0 0 / 20%);
}
</style>
