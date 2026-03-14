<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useLocale } from './composables/useLocale'
import { useQuiz } from './composables/useQuiz'
import { ui } from './data/ui'

const { locale, toggle: toggleLocale } = useLocale()
const t = computed(() => ui[locale.value])

const {
  loading,
  phase,
  currentQuestion,
  progress,
  handleAnswer,
  mbtiType,
  mbtiResult,
  traitPcts,
  devilCount,
  showDevilPanel,
  devilResult,
  resetQuiz,
} = useQuiz()

const activeTab = ref<'mbti' | 'devil'>('mbti')

const traitPairs = [
  { a: 'E', b: 'I' },
  { a: 'S', b: 'N' },
  { a: 'T', b: 'F' },
  { a: 'J', b: 'P' },
] as const

function onAnswer(label: string) {
  handleAnswer(label)
}

function onReset() {
  activeTab.value = 'mbti'
  resetQuiz()
}
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body">
    <!-- Header -->
    <header class="px-4 py-3 border-b border-border-default flex items-center justify-between">
      <RouterLink
        to="/"
        class="text-xs text-text-secondary hover:text-accent-coral transition-colors"
      >
        {{ t.backHome }}
      </RouterLink>
      <button
        class="text-xs border border-border-default px-3 py-1 text-text-dim hover:border-accent-coral hover:text-text-primary transition-all cursor-pointer font-mono"
        @click="toggleLocale"
      >
        {{ locale === 'vi' ? 'EN' : 'VI' }}
      </button>
    </header>

    <!-- INTRO -->
    <Transition name="fade" mode="out-in">
      <div v-if="phase === 'intro'" key="intro" class="max-w-xl mx-auto px-4 py-16 animate-fade-up">
        <div class="text-center mb-10">
          <div class="text-6xl mb-4">🧠</div>
          <h1 class="font-display text-4xl md:text-5xl mb-3">
            <span class="text-accent-coral">//</span> IT MBTI Test
          </h1>
          <p class="text-text-secondary text-lg">{{ t.tagline }}</p>
        </div>

        <div class="bg-bg-surface border border-border-default p-6 mb-8">
          <p class="text-text-secondary text-sm leading-relaxed mb-4">{{ t.introCopy }}</p>
          <div class="flex gap-4 text-xs text-text-dim">
            <span>{{ t.introStats.time }}</span>
            <span>{{ t.introStats.questions }}</span>
            <span>{{ t.introStats.results }}</span>
          </div>
        </div>

        <button
          class="w-full bg-accent-coral text-white font-display text-lg py-4 hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="loading"
          @click="phase = 'question'"
        >
          {{ loading ? '...' : t.startBtn }}
        </button>
      </div>
    </Transition>

    <!-- QUESTION -->
    <Transition name="fade" mode="out-in">
      <div
        v-if="phase === 'question' && currentQuestion"
        key="question"
        class="max-w-2xl mx-auto px-4 py-8"
      >
        <!-- Progress -->
        <div class="mb-6">
          <div class="flex justify-between text-xs text-text-dim mb-2">
            <span>{{ t.questionLabel(progress.current, progress.total) }}</span>
            <span>{{ progress.pct }}%</span>
          </div>
          <div class="h-1 bg-bg-elevated w-full">
            <div
              class="h-full bg-accent-coral transition-all duration-500"
              :style="{ width: `${progress.pct}%` }"
            />
          </div>
        </div>

        <!-- Question card -->
        <Transition name="slide" mode="out-in">
          <div :key="currentQuestion.id">
            <div class="mb-1">
              <span class="text-xs text-text-dim uppercase tracking-widest">{{
                currentQuestion.axis
              }}</span>
            </div>
            <h2 class="font-display text-xl md:text-2xl mb-6 text-text-primary leading-snug">
              {{ currentQuestion.question }}
            </h2>

            <!-- All options rendered uniformly — hidden option looks the same as others -->
            <div class="flex flex-col gap-3">
              <button
                v-for="opt in currentQuestion.options"
                :key="opt.label"
                class="group flex items-start gap-4 text-left border border-border-default bg-bg-surface p-4 hover:border-accent-coral hover:bg-bg-elevated transition-all cursor-pointer"
                @click="onAnswer(opt.label)"
              >
                <span
                  class="shrink-0 w-7 h-7 flex items-center justify-center border border-border-default text-text-dim text-sm font-mono group-hover:border-accent-coral group-hover:text-accent-coral transition-colors"
                >
                  {{ opt.label }}
                </span>
                <span
                  class="text-sm text-text-secondary group-hover:text-text-primary transition-colors whitespace-pre-line leading-relaxed"
                >
                  {{ opt.text }}
                </span>
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>

    <!-- CALCULATING -->
    <Transition name="fade" mode="out-in">
      <div
        v-if="phase === 'calculating'"
        key="calculating"
        class="max-w-xl mx-auto px-4 py-32 text-center"
      >
        <div class="text-5xl mb-6 animate-pulse">⚙️</div>
        <p class="font-display text-2xl text-accent-coral mb-2">{{ t.calculating }}</p>
        <p class="text-text-dim text-sm">{{ t.calculatingDesc }}</p>
      </div>
    </Transition>

    <!-- RESULT -->
    <Transition name="fade" mode="out-in">
      <div
        v-if="phase === 'result'"
        key="result"
        class="max-w-2xl mx-auto px-4 py-10 animate-fade-up"
      >
        <!-- Tab bar — only visible when devil panel is unlocked -->
        <div v-if="showDevilPanel" class="flex mb-8 border-b border-border-default">
          <button
            class="px-5 py-3 text-sm font-display transition-colors cursor-pointer"
            :class="
              activeTab === 'mbti'
                ? 'text-text-primary border-b-2 border-accent-coral -mb-px'
                : 'text-text-dim hover:text-text-secondary'
            "
            @click="activeTab = 'mbti'"
          >
            {{ t.tabMbti }}
          </button>
          <button
            class="px-5 py-3 text-sm font-display transition-colors cursor-pointer"
            :class="
              activeTab === 'devil'
                ? 'text-red-400 border-b-2 border-red-600 -mb-px'
                : 'text-text-dim hover:text-red-400'
            "
            @click="activeTab = 'devil'"
          >
            {{ t.tabDevil }}
          </button>
        </div>

        <!-- ===== MBTI TAB ===== -->
        <div v-if="mbtiResult" v-show="activeTab === 'mbti'">
          <!-- Type header -->
          <div class="text-center mb-8">
            <div class="text-5xl mb-3">🧠</div>
            <div class="font-display text-7xl font-bold text-accent-coral mb-1 tracking-wider">
              {{ mbtiType }}
            </div>
            <h2 class="font-display text-2xl text-text-primary mb-1">{{ mbtiResult.name }}</h2>
            <p class="text-text-dim text-sm uppercase tracking-widest">{{ mbtiResult.subtitle }}</p>
          </div>

          <!-- Trait bars -->
          <div class="bg-bg-surface border border-border-default p-5 mb-6">
            <h3 class="text-xs text-text-dim uppercase tracking-widest mb-4">
              {{ t.traitAnalysis }}
            </h3>
            <div class="flex flex-col gap-3">
              <div v-for="pair in traitPairs" :key="pair.a" class="flex items-center gap-3 text-xs">
                <span class="w-16 text-right text-text-secondary">{{ pair.a }}</span>
                <div class="flex-1 h-2 bg-bg-elevated relative">
                  <div
                    class="absolute left-0 top-0 h-full bg-accent-coral transition-all duration-1000"
                    :style="{ width: `${traitPcts[pair.a]}%` }"
                  />
                </div>
                <span class="w-16 text-text-secondary">{{ pair.b }}</span>
                <span class="w-8 text-right text-accent-coral font-mono"
                  >{{ traitPcts[pair.a] }}%</span
                >
              </div>
            </div>
          </div>

          <!-- Overview -->
          <div class="bg-bg-surface border border-border-default p-5 mb-4">
            <h3 class="font-display text-sm text-accent-coral mb-3">
              <span class="text-accent-coral">{{ t.overview }}</span>
            </h3>
            <p class="text-text-secondary text-sm leading-relaxed whitespace-pre-line">
              {{ mbtiResult.overview }}
            </p>
          </div>

          <!-- Strengths & Weaknesses -->
          <div class="grid md:grid-cols-2 gap-4 mb-4">
            <div class="bg-bg-surface border border-border-default p-5">
              <h3 class="font-display text-sm text-accent-coral mb-3">
                <span class="text-accent-coral">{{ t.strengths }}</span>
              </h3>
              <ul class="flex flex-col gap-2">
                <li
                  v-for="(s, i) in mbtiResult.strengths"
                  :key="i"
                  class="text-text-secondary text-sm flex gap-2"
                >
                  <span class="text-accent-coral shrink-0">+</span>
                  <span>{{ s }}</span>
                </li>
              </ul>
            </div>
            <div class="bg-bg-surface border border-border-default p-5">
              <h3 class="font-display text-sm text-accent-amber mb-3">
                <span class="text-accent-amber">{{ t.weaknesses }}</span>
              </h3>
              <ul class="flex flex-col gap-2">
                <li
                  v-for="(w, i) in mbtiResult.weaknesses"
                  :key="i"
                  class="text-text-secondary text-sm flex gap-2"
                >
                  <span class="text-accent-amber shrink-0">−</span>
                  <span>{{ w }}</span>
                </li>
              </ul>
            </div>
          </div>

          <!-- Role & Ally -->
          <div class="grid md:grid-cols-2 gap-4 mb-4">
            <div class="bg-bg-surface border border-border-default p-5">
              <h3 class="font-display text-sm text-accent-sky mb-1">
                <span class="text-accent-sky">{{ t.roleLabel }}</span>
              </h3>
              <p class="text-accent-sky font-display mb-2">{{ mbtiResult.roleTitle }}</p>
              <p class="text-text-secondary text-sm">{{ mbtiResult.role }}</p>
            </div>
            <div class="bg-bg-surface border border-border-default p-5">
              <h3 class="font-display text-sm text-accent-coral mb-1">
                <span class="text-accent-coral">{{ t.ally }}</span>
              </h3>
              <p class="text-accent-coral font-display mb-2">{{ mbtiResult.ally }}</p>
              <p class="text-text-secondary text-sm whitespace-pre-line">
                {{ mbtiResult.allyDesc }}
              </p>
            </div>
          </div>

          <!-- Nemesis dialogue -->
          <div class="bg-bg-surface border border-border-default p-5 mb-4">
            <h3 class="font-display text-sm text-text-dim mb-3">
              <span class="text-accent-coral">{{ t.nemesis(mbtiResult.nemesis) }}</span>
            </h3>
            <div class="flex flex-col gap-2">
              <div v-for="(line, i) in mbtiResult.nemesisLines" :key="i" class="flex gap-2 text-sm">
                <span class="shrink-0 font-mono text-accent-coral text-xs pt-0.5"
                  >{{ line.speaker }}:</span
                >
                <span class="text-text-secondary italic">{{ line.text }}</span>
              </div>
            </div>
          </div>

          <!-- Soulmate -->
          <div class="bg-bg-surface border border-border-default p-5 mb-4">
            <h3 class="font-display text-sm text-accent-amber mb-1">
              <span class="text-accent-amber">{{ t.soulmate(mbtiResult.soulmate) }}</span>
            </h3>
            <p class="text-text-secondary text-sm whitespace-pre-line">
              {{ mbtiResult.soulmateDesc }}
            </p>
          </div>

          <!-- Prophecy -->
          <div class="bg-bg-surface border border-border-default p-5 mb-4">
            <h3 class="font-display text-sm text-text-dim mb-2">
              <span class="text-accent-coral">{{ t.prophecy }}</span>
            </h3>
            <p class="text-text-secondary text-sm italic whitespace-pre-line">
              {{ mbtiResult.prophecy }}
            </p>
          </div>

          <!-- Warning -->
          <div class="border border-accent-amber/30 bg-accent-amber/5 p-5 mb-6">
            <h3 class="font-display text-sm text-accent-amber mb-2">{{ t.warning }}</h3>
            <p class="text-text-secondary text-sm whitespace-pre-line">{{ mbtiResult.warning }}</p>
          </div>
        </div>

        <!-- ===== DEVIL TAB ===== -->
        <div v-if="devilResult" v-show="activeTab === 'devil' && showDevilPanel">
          <!-- Devil header -->
          <div class="text-center mb-8">
            <div class="text-6xl mb-3">👿</div>
            <div class="font-display text-5xl font-bold text-red-500 mb-1 tracking-wider">
              {{ devilResult.type }}
            </div>
            <h2 class="font-display text-2xl text-text-primary mb-1">{{ devilResult.name }}</h2>
            <p class="text-text-dim text-sm uppercase tracking-widest">
              {{ devilResult.subtitle }}
            </p>
            <p class="text-text-dim text-xs mt-2">{{ t.devilHeader(devilCount) }}</p>
          </div>

          <!-- Overview -->
          <div class="border border-red-900/40 bg-bg-surface p-5 mb-4">
            <h3 class="font-display text-sm text-red-400 mb-3">
              <span class="text-red-500">//</span> Overview
            </h3>
            <p class="text-text-secondary text-sm leading-relaxed whitespace-pre-line">
              {{ devilResult.overview }}
            </p>
          </div>

          <!-- Traits -->
          <div class="border border-red-900/40 bg-bg-surface p-5 mb-4">
            <h3 class="font-display text-sm text-red-400 mb-3">
              <span class="text-red-500">{{ t.devilTraits }}</span>
            </h3>
            <ul class="flex flex-col gap-2">
              <li
                v-for="(t, i) in devilResult.traits"
                :key="i"
                class="text-text-secondary text-sm flex gap-2"
              >
                <span class="text-red-500 shrink-0">•</span>
                <span>{{ t }}</span>
              </li>
            </ul>
          </div>

          <!-- Signs -->
          <div class="border border-red-900/40 bg-bg-surface p-5 mb-4">
            <h3 class="font-display text-sm text-red-400 mb-3">
              <span class="text-red-500">{{ t.devilSigns }}</span>
            </h3>
            <ul class="flex flex-col gap-2">
              <li
                v-for="(s, i) in devilResult.signs"
                :key="i"
                class="text-text-secondary text-sm flex gap-2"
              >
                <span class="text-red-500 shrink-0 font-mono text-xs pt-0.5">{{ i + 1 }}.</span>
                <span>{{ s }}</span>
              </li>
            </ul>
          </div>

          <!-- Nemesis & Soulmate -->
          <div class="grid md:grid-cols-2 gap-4 mb-4">
            <div class="border border-red-900/40 bg-bg-surface p-5">
              <h3 class="font-display text-sm text-red-400 mb-1">
                <span class="text-red-500">//</span> Thiên địch
              </h3>
              <p class="text-red-400 font-display mb-2">{{ devilResult.nemesis }}</p>
              <p class="text-text-secondary text-sm">{{ devilResult.nemesisDesc }}</p>
            </div>
            <div class="border border-red-900/40 bg-bg-surface p-5">
              <h3 class="font-display text-sm text-red-400 mb-1">
                <span class="text-red-500">//</span> Cốt
              </h3>
              <p class="text-red-400 font-display mb-2">{{ devilResult.soulmate }}</p>
              <p class="text-text-secondary text-sm">{{ devilResult.soulmateDesc }}</p>
            </div>
          </div>

          <!-- Prophecy -->
          <div class="border border-red-900/40 bg-bg-surface p-5 mb-4">
            <h3 class="font-display text-sm text-text-dim mb-2">
              <span class="text-red-500">{{ t.devilProphecy }}</span>
            </h3>
            <p class="text-text-secondary text-sm italic whitespace-pre-line">
              {{ devilResult.prophecy }}
            </p>
          </div>

          <!-- Warning -->
          <div class="border border-red-900/50 bg-red-950/20 p-5 mb-6">
            <h3 class="font-display text-sm text-red-400 mb-2">{{ t.devilWarning }}</h3>
            <p class="text-text-secondary text-sm whitespace-pre-line">{{ devilResult.warning }}</p>
          </div>
        </div>

        <!-- Retry -->
        <button
          class="w-full border border-border-default text-text-secondary py-3 hover:border-accent-coral hover:text-text-primary transition-all cursor-pointer text-sm"
          @click="onReset"
        >
          {{ t.retry }}
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.slide-enter-from {
  opacity: 0;
  transform: translateX(16px);
}
.slide-leave-to {
  opacity: 0;
  transform: translateX(-16px);
}
</style>
