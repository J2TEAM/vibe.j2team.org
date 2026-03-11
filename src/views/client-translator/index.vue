<script setup lang="ts">
import { ref, computed } from 'vue'
import { translations, type Translation } from './data/phrases'

defineOptions({
  name: 'ClientTranslatorView',
})

// State
const inputText = ref('')
const isAnalyzing = ref(false)
const showResult = ref(false)
const errorMsg = ref('')
const currentTranslation = ref<Translation | null>(null)
const displayOutput = ref('')
const analysisProgress = ref(0)

// Computed list for suggestions based on input
const suggestions = computed(() => {
  if (!inputText.value.trim()) return translations
  const lowerInput = inputText.value.toLowerCase()
  return translations.filter((t) => t.client.toLowerCase().includes(lowerInput))
})

// Actions
const selectPhrase = (phrase: Translation) => {
  inputText.value = phrase.client
  currentTranslation.value = phrase
  errorMsg.value = ''
  showResult.value = false
  displayOutput.value = ''
}

const handleAnalyze = () => {
  if (!inputText.value.trim()) {
    errorMsg.value = 'Vui lòng nhập "yêu cầu" của khách hàng...'
    return
  }

  const inputWords = inputText.value
    .toLowerCase()
    .split(/[\s.,?!]+/)
    .filter((w) => w.length > 0)

  let bestMatch: Translation | null = null
  let maxScore = 0

  for (const t of translations) {
    let score = 0
    // Check keyword occurrences
    for (const kw of t.keywords) {
      const kwLower = kw.toLowerCase()
      if (inputWords.includes(kwLower)) {
        score += 2 // Exact word match
      } else if (inputWords.some((w) => w.includes(kwLower) || kwLower.includes(w))) {
        score += 0.5 // Partial word match
      }
    }

    // Exact sentence match gets a massive boost
    if (t.client.toLowerCase() === inputText.value.trim().toLowerCase()) {
      score += 100
    }

    if (score > maxScore) {
      maxScore = score
      bestMatch = t
    } else if (score === maxScore && score > 0) {
      // Random tie breaker
      if (Math.random() > 0.5) bestMatch = t
    }
  }

  let targetTranslation = bestMatch

  if (!targetTranslation || maxScore < 1) {
    targetTranslation = {
      id: 'custom',
      client: inputText.value,
      coder:
        'Tóm lại là đéo hiểu khách muốn gì. Vote từ chối yêu cầu hoặc bắt viết Document đàng hoàng.',
      category: 'Unknown/Chaos',
      keywords: [],
    }
  }

  currentTranslation.value = targetTranslation
  errorMsg.value = ''
  showResult.value = false
  isAnalyzing.value = true
  analysisProgress.value = 0
  displayOutput.value = ''

  // Fake loading animation
  const interval = setInterval(() => {
    analysisProgress.value += Math.floor(Math.random() * 15) + 5
    if (analysisProgress.value >= 100) {
      analysisProgress.value = 100
      clearInterval(interval)
      setTimeout(() => {
        isAnalyzing.value = false
        showResult.value = true
        typewriterEffect(currentTranslation.value!.coder) // Fixed .value required access
      }, 500)
    }
  }, 100)
}

// Simple typewriter effect for the output string
const typewriterEffect = (text: string) => {
  let i = 0
  displayOutput.value = ''
  const typeInterval = setInterval(() => {
    if (i < text.length) {
      displayOutput.value += text.charAt(i)
      i++
    } else {
      clearInterval(typeInterval)
    }
  }, 30)
}
</script>

<template>
  <div
    class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col relative overflow-hidden selection:bg-accent-coral/30"
  >
    <!-- Noise Overlay (matches design system) -->
    <div class="fixed inset-0 pointer-events-none opacity-[0.02] z-50 bg-noise"></div>

    <!-- Header / Navigation -->
    <header
      class="z-40 bg-bg-deep/80 backdrop-blur-md border-b border-border-default shrink-0 sticky top-0"
    >
      <div class="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <RouterLink to="/" class="flex items-center gap-2 group">
          <span
            class="font-display text-[11px] sm:text-[13px] font-black tracking-[0.2em] uppercase text-text-secondary group-hover:text-accent-coral transition-colors"
          >
            HOME
          </span>
        </RouterLink>
        <div
          class="bg-accent-coral text-bg-deep font-display font-bold text-[10px] sm:text-xs tracking-widest px-3 py-1.5 rotate-2 shadow-sm border border-bg-deep/10 pointer-events-none"
        >
          VOL.01 / 2026
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main
      class="grow max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 flex flex-col items-center"
    >
      <!-- Title Section -->
      <div class="w-full mb-10 text-center animate-fade-up">
        <h1
          class="font-display text-4xl sm:text-6xl font-bold tracking-tight text-text-primary mb-4 flex flex-col items-center justify-center gap-2"
        >
          <span>
            <span
              class="text-accent-amber font-display text-lg tracking-widest mr-2 align-middle opacity-80"
              >//</span
            >
            Client<span class="text-accent-coral animate-pulse">_</span>Translator
          </span>
        </h1>
        <p class="text-text-secondary text-sm sm:text-lg max-w-2xl mx-auto">
          Công cụ dịch ngôn ngữ "Khách hàng" sang "Tiếng Coder" chân thực nhất. Dành cho những ngày
          bạn đọc spec mà trầm cảm.
        </p>
      </div>

      <!-- Content Grid -->
      <div class="w-full grid lg:grid-cols-12 gap-6 items-start">
        <!-- Left Column: Input Form -->
        <div class="lg:col-span-7 flex flex-col gap-6 animate-fade-up animate-delay-2">
          <div
            class="border border-border-default bg-bg-surface p-5 sm:p-6 transition-all duration-300 hover:border-accent-amber/50 relative group"
          >
            <h2
              class="font-display text-xl font-semibold text-text-primary mb-4 flex items-center gap-2 w-full"
            >
              <span class="text-accent-amber text-xs tracking-widest">//</span>
              Yêu cầu của Khách:
            </h2>

            <textarea
              v-model="inputText"
              rows="4"
              class="w-full bg-bg-deep/50 border border-border-default p-4 text-text-primary font-body text-base placeholder-text-dim focus:outline-none focus:border-accent-amber transition-colors resize-none mb-2"
              placeholder="Nhập yêu cầu mông lung của khách hàng vào đây..."
              @focus="errorMsg = ''"
            ></textarea>

            <div
              v-if="errorMsg"
              class="flex items-center gap-2 text-accent-coral text-sm mt-1 animate-pulse"
            >
              <span>⚠</span> {{ errorMsg }}
            </div>

            <div class="mt-4 flex justify-end">
              <button
                @click="handleAnalyze"
                :disabled="isAnalyzing"
                class="px-8 py-3 bg-bg-elevated border hover:-translate-y-0.5"
                :class="
                  isAnalyzing
                    ? 'border-border-default opacity-50 cursor-not-allowed'
                    : 'border-accent-amber hover:bg-accent-amber/10 hover:shadow-[0_0_15px_rgba(255,184,48,0.2)] hover:border-accent-amber cursor-pointer transition-all duration-300 group/btn'
                "
              >
                <span
                  class="font-display font-bold text-sm tracking-widest uppercase text-accent-amber group-hover/btn:text-accent-amber transition-colors flex items-center gap-2"
                >
                  {{ isAnalyzing ? 'ĐANG DỊCH...' : 'DỊCH NGAY' }}
                  <span v-if="!isAnalyzing" class="text-lg leading-none">»</span>
                  <span
                    v-else
                    class="w-4 h-4 border-2 border-accent-amber border-t-transparent animate-spin rounded-full"
                  ></span>
                </span>
              </button>
            </div>

            <!-- Deco blocks -->
            <div
              class="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-accent-amber opacity-50 transition-opacity group-hover:opacity-100"
            ></div>
          </div>

          <!-- Phrase Suggestions -->
          <div class="border border-border-default bg-bg-surface p-4 sm:p-5">
            <h3
              class="font-display text-sm font-semibold text-text-secondary mb-3 flex items-center gap-2 uppercase tracking-wide"
            >
              Mẫu yêu cầu thường gặp:
            </h3>
            <div class="flex flex-wrap gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
              <button
                v-for="phrase in suggestions"
                :key="phrase.id"
                @click="selectPhrase(phrase)"
                class="text-left text-xs sm:text-sm px-3 py-1.5 border border-border-default hover:border-accent-sky hover:bg-accent-sky/5 text-text-secondary hover:text-text-primary transition-colors truncate max-w-full"
                :title="phrase.client"
              >
                "{{ phrase.client.substring(0, 40) }}{{ phrase.client.length > 40 ? '...' : '' }}"
              </button>
              <div
                v-if="suggestions.length === 0"
                class="text-text-dim text-sm italic w-full text-center py-4"
              >
                (Không tìm thấy mẫu có sẵn, tự gõ thôi dev ơi...)
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Output / Result -->
        <div class="lg:col-span-5 h-full animate-fade-up animate-delay-3">
          <div
            class="border border-border-default bg-[#0A1016] p-5 sm:p-6 h-full min-h-[400px] flex flex-col relative"
            :class="{ 'animate-pulse-border': isAnalyzing }"
          >
            <!-- Terminal Header Decoration -->
            <div class="flex items-center gap-2 border-b border-border-default pb-4 mb-4">
              <div class="w-3 h-3 rounded-full bg-border-default"></div>
              <div class="w-3 h-3 rounded-full bg-border-default"></div>
              <div
                class="w-3 h-3 rounded-full"
                :class="
                  isAnalyzing
                    ? 'bg-accent-coral animate-pulse'
                    : showResult
                      ? 'bg-accent-sky'
                      : 'bg-border-default'
                "
              ></div>
              <span class="ml-2 font-display text-xs text-text-dim tracking-widest"
                >TRANSLATOR_TERMINAL.EXE</span
              >
            </div>

            <!-- Idle State -->
            <div
              v-if="!isAnalyzing && !showResult"
              class="grow flex flex-col items-center justify-center opacity-30 select-none"
            >
              <span class="text-6xl mb-4">🤖</span>
              <span class="font-display font-black text-xl tracking-widest text-text-dim uppercase"
                >Waiting for input...</span
              >
            </div>

            <!-- Analyzing State -->
            <div
              v-if="isAnalyzing"
              class="grow flex flex-col items-start justify-start pt-4 gap-4 font-mono w-full"
            >
              <div class="text-accent-amber text-sm">> System analyzing client's bullshit...</div>
              <div
                class="w-full bg-bg-deep border border-border-default h-6 relative overflow-hidden"
              >
                <div
                  class="h-full bg-accent-amber transition-all duration-100"
                  :style="`width: ${analysisProgress}%`"
                ></div>
              </div>
              <div class="text-text-dim text-xs mt-1">
                {{ analysisProgress }}% - Parsing irrational requests...
              </div>

              <div class="mt-4 flex flex-col gap-1 w-full opacity-60">
                <div class="text-xs text-[#8B9DB5]" v-for="i in 3" :key="i">
                  [{{ new Date().toISOString() }}] WARN: Logic conflict detected in client specs.
                </div>
              </div>
            </div>

            <!-- Result State -->
            <div
              v-if="showResult && currentTranslation"
              class="grow flex flex-col w-full relative group"
            >
              <div
                class="absolute -top-1 -right-1 text-[8px] sm:text-[10px] text-accent-sky font-black tracking-widest uppercase border border-accent-sky/20 px-2 py-1 bg-accent-sky/5"
              >
                Category: {{ currentTranslation.category }}
              </div>

              <h3
                class="font-display font-medium text-text-secondary text-sm mb-2 mt-4 flex items-center gap-2"
              >
                <span class="text-accent-sky text-xs">></span> Coder Translation:
              </h3>

              <div
                class="grow mt-2 text-text-primary text-lg sm:text-xl font-body leading-relaxed border-l-2 border-accent-coral pl-4 bg-accent-coral/5 p-4 rounded-r-sm shadow-[inset_4px_0_0_0_rgba(255,107,74,0.3)]"
              >
                {{ displayOutput
                }}<span class="animate-pulse inline-block w-2 bg-text-primary leading-none ml-1"
                  >&nbsp;</span
                >
              </div>

              <!-- Watermark / Footer of terminal -->
              <div
                class="mt-8 pt-4 border-t border-border-default/50 flex justify-between uppercase text-[10px] font-display font-bold text-text-dim w-full tracking-widest"
              >
                <span>Translated roughly</span>
                <span class="text-accent-coral">/// BUSTED ///</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.bg-noise {
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
}

/* Custom Scrollbar for suggestions */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: var(--color-bg-deep);
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--color-border-default);
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: var(--color-accent-sky);
}

/* Pulse Border specific for analyzing state */
@keyframes pulse-border-amber {
  0% {
    border-color: var(--color-border-default);
    box-shadow: 0 0 0 transparent;
  }

  50% {
    border-color: var(--color-accent-amber);
    box-shadow: 0 0 15px rgba(255, 184, 48, 0.2);
  }

  100% {
    border-color: var(--color-border-default);
    box-shadow: 0 0 0 transparent;
  }
}

.animate-pulse-border {
  animation: pulse-border-amber 1.5s infinite ease-in-out;
}
</style>
