<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";
import type { Feedback, RoundStats } from "../composables/useGameLogic";

const props = defineProps<{
  round: number;
  timer: number;
  bannedLetters: string[];
  acceptedWords: string[];
  allUsedWords: string[];
  currentWord: string;
  feedback: Feedback | null;
  isValidating: boolean;
  roundPassed: boolean | null;
  roundStats: RoundStats | null;
  showRoundOverlay: boolean;
  minWordsToPass: number;
}>();

const emit = defineEmits<{
  (e: "update:currentWord", value: string): void;
  (e: "submitWord"): void;
}>();

const inputRef = ref<HTMLInputElement | null>(null);

// Full keyboard layout for visual keyboard
const keyboardRows = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"],
];

const timerPercent = computed(() => {
  const total = 30 + Math.floor((props.round - 1) / 5) * 10;
  return Math.max(0, (props.timer / total) * 100);
});

const timerColor = computed(() => {
  if (props.timer <= 5) return "bg-accent-coral";
  if (props.timer <= 10) return "bg-accent-amber";
  return "bg-accent-sky";
});

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === "Enter" && !props.isValidating) {
    e.preventDefault();
    emit("submitWord");
  }
}

function handleKeyboardClick(letter: string) {
  if (props.bannedLetters.includes(letter)) return;
  emit("update:currentWord", props.currentWord + letter.toLowerCase());
  inputRef.value?.focus();
}

function handleInput(e: Event) {
  emit("update:currentWord", (e.target as HTMLInputElement).value);
}

// Auto focus input after validation
watch(
  () => [props.isValidating, props.feedback],
  () => {
    if (!props.isValidating) {
      nextTick(() => inputRef.value?.focus());
    }
  },
);
</script>

<template>
  <div class="min-h-screen p-3 md:p-6 flex flex-col max-w-5xl mx-auto">
    <!-- Header Stats Bar -->
    <div class="flex items-stretch gap-2 md:gap-4 mb-4 md:mb-6 animate-fade-up">
      <!-- Round -->
      <div
        class="flex-1 border border-border-default bg-bg-surface p-3 md:p-4 text-center relative overflow-hidden"
      >
        <span
          class="absolute top-1 right-2 font-display text-4xl font-bold text-accent-amber/5 select-none pointer-events-none"
        >
          R
        </span>
        <span class="block text-[10px] text-text-dim font-display tracking-[0.15em] uppercase"
          >Vòng</span
        >
        <span class="block text-2xl md:text-3xl font-display font-bold text-accent-amber">
          {{ round }}
        </span>
      </div>

      <!-- Timer -->
      <div
        class="flex-1 border border-border-default bg-bg-surface p-3 md:p-4 text-center relative overflow-hidden"
      >
        <span
          class="absolute top-1 right-2 font-display text-4xl font-bold text-accent-coral/5 select-none pointer-events-none"
        >
          T
        </span>
        <span class="block text-[10px] text-text-dim font-display tracking-[0.15em] uppercase"
          >Thời gian</span
        >
        <span
          class="block text-2xl md:text-3xl font-display font-bold tabular-nums"
          :class="{
            'text-accent-coral animate-pulse': timer <= 5,
            'text-accent-amber': timer > 5 && timer <= 10,
            'text-accent-sky': timer > 10,
          }"
        >
          {{ timer }}s
        </span>
        <!-- Timer progress bar -->
        <div class="absolute bottom-0 left-0 right-0 h-1 bg-bg-elevated">
          <div
            class="h-full transition-all duration-200"
            :class="timerColor"
            :style="{ width: `${timerPercent}%` }"
          />
        </div>
      </div>

      <!-- Words Count -->
      <div
        class="flex-1 border border-border-default bg-bg-surface p-3 md:p-4 text-center relative overflow-hidden"
      >
        <span
          class="absolute top-1 right-2 font-display text-4xl font-bold text-accent-sky/5 select-none pointer-events-none"
        >
          W
        </span>
        <span class="block text-[10px] text-text-dim font-display tracking-[0.15em] uppercase"
          >Từ</span
        >
        <span class="block text-2xl md:text-3xl font-display font-bold">
          <span
            :class="
              acceptedWords.length >= minWordsToPass ? 'text-accent-sky' : 'text-text-primary'
            "
          >
            {{ acceptedWords.length }}
          </span>
          <span class="text-text-dim">/{{ minWordsToPass }}</span>
        </span>
      </div>
    </div>

    <!-- Visual Keyboard -->
    <div class="mb-4 md:mb-6 animate-fade-up animate-delay-1">
      <h2
        class="text-xs text-text-dim font-display tracking-[0.15em] uppercase mb-3 text-center flex items-center justify-center gap-2"
      >
        <span class="text-accent-coral text-sm">//</span>
        Bàn phím
        <span class="text-text-dim">—</span>
        <span class="text-accent-coral"> {{ bannedLetters.length }} chữ bị cấm </span>
      </h2>
      <div class="flex flex-col items-center gap-1.5">
        <div
          v-for="(row, rowIdx) in keyboardRows"
          :key="rowIdx"
          class="flex gap-1 md:gap-1.5"
          :style="{ paddingLeft: rowIdx === 1 ? '1rem' : rowIdx === 2 ? '2.5rem' : '0' }"
        >
          <button
            v-for="letter in row"
            :key="letter"
            type="button"
            class="relative flex items-center justify-center font-display font-bold text-sm md:text-base transition-all duration-200 select-none"
            :class="
              bannedLetters.includes(letter)
                ? 'w-7 h-8 md:w-9 md:h-10 bg-accent-coral/15 text-accent-coral border border-accent-coral/30 cursor-not-allowed line-through decoration-accent-coral/60'
                : 'w-7 h-8 md:w-9 md:h-10 bg-bg-surface text-text-primary border border-border-default cursor-pointer hover:border-accent-sky hover:text-accent-sky hover:-translate-y-0.5 active:translate-y-0'
            "
            :disabled="bannedLetters.includes(letter)"
            @click="handleKeyboardClick(letter)"
          >
            {{ letter }}
          </button>
        </div>
      </div>
    </div>

    <!-- Input Section -->
    <div class="flex gap-2 md:gap-3 mb-3 animate-fade-up animate-delay-2">
      <input
        ref="inputRef"
        :value="currentWord"
        type="text"
        placeholder="Gõ một từ..."
        :disabled="isValidating"
        class="flex-1 p-3 md:p-4 text-lg md:text-xl border border-border-default bg-bg-surface text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent-coral transition-colors disabled:opacity-60 font-body"
        autocomplete="off"
        autocorrect="off"
        autocapitalize="off"
        spellcheck="false"
        @input="handleInput"
        @keydown="handleKeyDown"
      />
      <button
        :disabled="isValidating || !currentWord.trim()"
        class="px-5 md:px-7 text-base md:text-lg font-display font-bold border-none bg-accent-coral text-bg-deep cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent-coral/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 tracking-wide"
        @click="$emit('submitWord')"
      >
        {{ isValidating ? "..." : "Gửi" }}
      </button>
    </div>

    <!-- Feedback -->
    <div
      v-if="feedback"
      class="p-3 mb-3 text-center text-sm md:text-base font-medium border animate-fade-up"
      :class="
        feedback.type === 'success'
          ? 'bg-accent-sky/10 text-accent-sky border-accent-sky/20'
          : 'bg-accent-coral/10 text-accent-coral border-accent-coral/20'
      "
    >
      {{ feedback.message }}
    </div>

    <!-- Words Grid -->
    <div
      class="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 overflow-hidden animate-fade-up animate-delay-3"
    >
      <!-- Current round words -->
      <div class="md:col-span-2 flex flex-col overflow-hidden">
        <h3
          class="text-xs text-text-dim font-display tracking-[0.15em] uppercase mb-2 flex items-center gap-2"
        >
          <span class="text-accent-sky text-sm">//</span>
          Vòng này ({{ acceptedWords.length }})
        </h3>
        <div
          class="flex-1 overflow-y-auto flex flex-wrap gap-2 p-3 border border-border-default bg-bg-surface min-h-20 md:min-h-28 content-start"
        >
          <span v-if="acceptedWords.length === 0" class="text-text-dim italic p-2 text-sm">
            Chưa có từ nào. Bắt đầu gõ!
          </span>
          <span
            v-for="(word, idx) in acceptedWords"
            :key="idx"
            class="px-3 py-1 bg-accent-sky/10 text-accent-sky border border-accent-sky/20 text-sm font-medium"
          >
            {{ word }}
          </span>
        </div>
      </div>

      <!-- All used words sidebar -->
      <div class="flex flex-col border border-border-default bg-bg-surface p-3 overflow-hidden">
        <h3
          class="text-xs text-text-dim font-display tracking-[0.15em] uppercase mb-1 flex items-center gap-2"
        >
          <span class="text-accent-amber text-sm">//</span>
          Đã dùng ({{ allUsedWords.length }})
        </h3>
        <p class="text-[10px] text-text-dim mb-2 hidden md:block">Mỗi từ chỉ được dùng một lần</p>
        <div class="flex-1 overflow-y-auto">
          <span v-if="allUsedWords.length === 0" class="text-text-dim italic text-sm">
            Chưa có
          </span>
          <div v-else class="flex flex-wrap gap-1">
            <span
              v-for="(word, idx) in allUsedWords"
              :key="idx"
              class="px-2 py-0.5 bg-bg-elevated text-text-secondary text-xs font-medium"
            >
              {{ word }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Round End Overlay -->
    <Transition
      enter-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-300"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showRoundOverlay && roundStats"
        class="fixed inset-0 flex items-center justify-center bg-bg-deep/80 z-50 backdrop-blur-sm"
      >
        <div
          class="text-center p-8 border-2"
          :class="
            roundPassed ? 'bg-bg-surface border-accent-sky' : 'bg-bg-surface border-accent-coral'
          "
        >
          <h2
            class="text-3xl md:text-4xl font-display font-bold mb-4"
            :class="roundPassed ? 'text-accent-sky' : 'text-accent-coral'"
          >
            {{ roundPassed ? "VƯỢT QUA!" : "THẤT BẠI" }}
          </h2>
          <p class="text-xl text-text-secondary font-display">
            {{ roundStats.wordsSubmitted }}/{{ roundStats.minRequired }} từ
          </p>
        </div>
      </div>
    </Transition>
  </div>
</template>
