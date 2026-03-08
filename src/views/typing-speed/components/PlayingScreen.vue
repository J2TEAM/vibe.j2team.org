<script setup lang="ts">
import { computed, inject, unref } from 'vue'
import type { WordItem } from '../types'

const game = inject<ReturnType<typeof import('../useTypingGame').useTypingGame>>('typingGame')

const wordItemsList = computed<WordItem[]>(() => unref(game?.wordItems) ?? [])
const correctCountValue = computed(() => unref(game?.correctCount) ?? 0)
const incorrectCountValue = computed(() => unref(game?.incorrectCount) ?? 0)
const accuracyPercent = computed(() => {
  const c = correctCountValue.value
  const i = incorrectCountValue.value
  return c + i > 0 ? Math.round((c / (c + i)) * 100) : 100
})
const currentIndexValue = computed(() => unref(game?.currentIndex) ?? 0)
const inputValueDisplay = computed(() => unref(game?.inputValue) ?? '')
</script>

<template>
  <div v-if="game" class="flex flex-col gap-5 w-full animate-fade-up">
    <div class="flex items-center justify-between flex-wrap gap-2">
      <div class="flex items-baseline gap-2">
        <span
          :class="[
            game.timerColor,
            'font-display text-4xl sm:text-5xl font-bold tabular-nums transition-colors duration-500',
          ]"
        >
          {{ game.timeLeft }}
        </span>
        <span class="text-text-dim text-xs">giây</span>
        <span v-if="!game.timerStarted" class="text-text-dim text-xs ml-2"
          >— Gõ ký tự đầu tiên để bắt đầu đếm giờ</span
        >
      </div>
      <div class="flex gap-5 text-center">
        <div>
          <p class="font-display font-bold text-accent-sky text-xl">{{ game.correctCount }}</p>
          <p class="text-text-dim text-xs">Đúng</p>
        </div>
        <div>
          <p class="font-display font-bold text-accent-coral text-xl">{{ game.incorrectCount }}</p>
          <p class="text-text-dim text-xs">Sai</p>
        </div>
        <div>
          <p class="font-display font-bold text-accent-amber text-xl">{{ accuracyPercent }}%</p>
          <p class="text-text-dim text-xs">Đúng</p>
        </div>
      </div>
    </div>

    <div class="w-full h-0.5 bg-bg-elevated">
      <div
        class="h-full bg-accent-coral transition-all duration-1000"
        :style="{ width: `${game.progressPercent}%` }"
      />
    </div>

    <div
      :ref="game.wordsContainerRef"
      class="border border-border-default bg-bg-surface overflow-hidden relative cursor-text select-none"
      style="height: 9.5rem"
      @click="game.inputRef?.value?.focus?.()"
    >
      <div
        class="absolute bottom-0 left-0 right-0 h-10 pointer-events-none z-10"
        style="background: linear-gradient(to top, #162232 30%, transparent)"
      />
      <div :ref="game.wordsInnerRef" class="flex flex-wrap px-5 pt-5 pb-8" style="gap: 10px 16px">
        <span
          v-for="(item, idx) in wordItemsList"
          :key="idx"
          :class="[
            'word-item inline-flex font-body text-xl leading-snug tracking-wide',
            item.status === 'active' && 'word-active',
          ]"
        >
          <span
            v-for="(char, ci) in item.word.split('')"
            :key="ci"
            :class="game.getCharClass(idx, ci)"
            style="white-space: pre"
            >{{ char }}</span
          >
          <span
            v-for="(char, ei) in game.getExtraTyped(idx)"
            :key="'e' + ei"
            class="text-accent-coral"
            style="white-space: pre"
            >{{ char }}</span
          >
        </span>
      </div>
    </div>

    <div class="flex flex-col gap-2">
      <input
        :ref="game.inputRef"
        :value="inputValueDisplay"
        type="text"
        autocomplete="off"
        autocorrect="off"
        autocapitalize="off"
        spellcheck="false"
        placeholder="Bắt đầu gõ..."
        class="w-full bg-bg-elevated border-2 px-4 py-3 text-base sm:text-lg text-text-primary font-body outline-none transition-colors placeholder:text-text-dim font-mono"
        :class="
          game.currentInputIsValid
            ? 'border-border-default focus:border-accent-amber'
            : 'border-accent-coral'
        "
        @input="game.onInput"
      />
      <p class="text-text-dim text-xs text-right">
        Từ <span class="text-text-secondary font-semibold">{{ currentIndexValue + 1 }}</span> /
        {{ game.WORD_COUNT }} &nbsp;·&nbsp; Sử dụng
        <kbd
          class="inline-block px-1.5 border border-border-default bg-bg-elevated text-xs font-mono text-accent-amber"
          >Space</kbd
        >
        để chuyển từ
      </p>
    </div>
  </div>
</template>

<style scoped>
.char-cursor {
  position: relative;
}
.char-cursor::before {
  content: '';
  position: absolute;
  left: -1px;
  top: 10%;
  height: 80%;
  width: 2px;
  background: #ffb830;
  animation: blink-cursor 1s step-end infinite;
}
@keyframes blink-cursor {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}
.word-item {
  font-variant-ligatures: none;
}
</style>
