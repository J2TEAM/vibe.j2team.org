<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import {
  useLearnNote,
  ALL_NOTES_FOR_PIANO,
  NATURAL_NOTES_FOR_PIANO,
  DIFFICULTY_RANGES,
} from './useLearnNote'
import type { NoteInfo, SessionStats } from './useLearnNote'
import StaffDisplay from './StaffDisplay.vue'
import PianoAnswer from './PianoAnswer.vue'

const {
  screen,
  selectedDuration,
  selectedDifficulty,
  selectedClef,
  selectedAccidental,
  customLowNote,
  customHighNote,
  timeLeft,
  correctCount,
  incorrectCount,
  currentNote,
  lastAnswerCorrect,
  lastAnsweredNote,
  sessionStats,
  history,
  progressPercent,
  timerColor,
  accuracy,
  startSession,
  cancelSession,
  answerNote,
  formatTime,
} = useLearnNote()

const DURATION_OPTIONS = [1, 3, 5, 10]
const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Dễ',
  medium: 'Trung bình',
  hard: 'Khó',
  custom: 'Tuỳ chọn',
}
const CLEF_LABELS: Record<string, string> = {
  treble: 'Khoá Sol',
  bass: 'Khoá Fa',
}
const ACCIDENTAL_LABELS: Record<string, string> = {
  natural: 'Bình thường',
  sharp: 'Thăng (♯)',
  flat: 'Giáng (♭)',
  all: 'Tất cả',
}

const naturalNotes = NATURAL_NOTES_FOR_PIANO
const allNotes = ALL_NOTES_FOR_PIANO

// Note options for custom range selector
const customNoteOptions = computed<NoteInfo[]>(() => {
  if (selectedAccidental.value === 'natural') return naturalNotes
  return allNotes
})

function noteDisplayName(n: NoteInfo): string {
  const acc = n.accidental === '#' ? '♯' : n.accidental === 'b' ? '♭' : ''
  return `${n.name}${acc}${n.octave}`
}

function difficultyRangeLabel(d: string): string {
  if (d === 'custom') return ''
  const r = DIFFICULTY_RANGES[d as keyof typeof DIFFICULTY_RANGES]
  if (!r) return ''
  const clefRange = r[selectedClef.value]
  return `${noteDisplayName(clefRange.low)} – ${noteDisplayName(clefRange.high)}`
}

const canStart = computed(() => {
  if (selectedDifficulty.value !== 'custom') return true
  return customLowNote.value.midiNumber < customHighNote.value.midiNumber
})

const CHART_W = 400
const CHART_H = 80
const BAR_GAP = 4

const chartData = computed(() => {
  const sessions: SessionStats[] = history.value.slice(-20)
  if (sessions.length === 0) return null
  const count = sessions.length
  const barW = Math.max(4, (CHART_W - BAR_GAP * (count - 1)) / count)
  return sessions.map((s, i) => {
    const x = i * (barW + BAR_GAP)
    const barH = Math.max(2, (s.accuracy / 100) * CHART_H)
    const y = CHART_H - barH
    const color =
      s.accuracy >= 80
        ? 'var(--color-accent-sky)'
        : s.accuracy >= 50
          ? 'var(--color-accent-amber)'
          : 'var(--color-accent-coral)'
    const date = new Date(s.timestamp).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
    })
    return { x, y, barW, barH, color, accuracy: s.accuracy, date, total: s.total }
  })
})
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col">
    <!-- Nav -->
    <nav class="w-full max-w-2xl mx-auto px-4 sm:px-6 pt-4 pb-2 animate-fade-up">
      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-3 sm:px-4 py-2 text-xs sm:text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
      >
        &larr; Về trang chủ
      </RouterLink>
    </nav>

    <!-- Header -->
    <header
      class="mt-4 w-full max-w-2xl mx-auto px-4 sm:px-6 pt-2 pb-4 animate-fade-up animate-delay-1"
    >
      <h1 class="font-display text-2xl sm:text-4xl font-bold text-accent-coral">
        🎼 Học note nhạc
      </h1>
      <p class="mt-1 text-text-secondary text-xs sm:text-sm">
        Luyện đọc khuôn nhạc nhanh hơn, chính xác hơn
      </p>
    </header>

    <!-- ═══════════════════════════════════════════════════════════════ -->
    <!-- SETTING SCREEN                                                  -->
    <!-- ═══════════════════════════════════════════════════════════════ -->
    <main
      v-if="screen === 'setting'"
      class="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 pb-8 flex flex-col gap-5 animate-fade-up animate-delay-2"
    >
      <!-- Lịch sử -->
      <div v-if="chartData" class="border border-border-default bg-bg-surface p-4">
        <h2
          class="font-display text-xs tracking-widest text-accent-amber flex items-center gap-2 mb-4"
        >
          <span>//</span> LỊCH SỬ LUYỆN TẬP
        </h2>
        <div class="overflow-x-auto">
          <svg
            :viewBox="`0 -10 ${CHART_W} ${CHART_H + 30}`"
            :width="CHART_W"
            :height="CHART_H + 30"
            class="w-full max-w-full"
          >
            <line
              x1="0"
              :y1="CHART_H"
              :x2="CHART_W"
              :y2="CHART_H"
              stroke="var(--color-border-default)"
              stroke-width="1"
            />
            <g v-for="(bar, i) in chartData" :key="i">
              <rect
                :x="bar.x"
                :y="bar.y"
                :width="bar.barW"
                :height="bar.barH"
                :fill="bar.color"
                opacity="0.85"
              />
              <text
                :x="bar.x + bar.barW / 2"
                :y="CHART_H + 14"
                text-anchor="middle"
                font-size="8"
                fill="var(--color-text-dim)"
                font-family="var(--font-display)"
              >
                {{ bar.date }}
              </text>
              <text
                v-if="bar.barH > 14"
                :x="bar.x + bar.barW / 2"
                :y="bar.y + bar.barH / 2 + 4"
                text-anchor="middle"
                font-size="9"
                font-weight="bold"
                fill="var(--color-bg-deep)"
                font-family="var(--font-display)"
              >
                {{ bar.accuracy }}%
              </text>
            </g>
            <text
              x="0"
              y="-2"
              font-size="9"
              fill="var(--color-text-dim)"
              font-family="var(--font-display)"
            >
              100%
            </text>
            <text
              x="0"
              :y="CHART_H / 2 + 3"
              font-size="9"
              fill="var(--color-text-dim)"
              font-family="var(--font-display)"
            >
              50%
            </text>
          </svg>
        </div>
        <p class="text-text-dim text-xs mt-1">
          {{ history.length }} phiên — hiện {{ chartData.length }} phiên gần nhất
        </p>
      </div>

      <!-- Session stats (hiện sau khi kết thúc) -->
      <div v-if="sessionStats" class="border border-accent-sky bg-accent-sky/5 p-4">
        <h2
          class="font-display text-sm tracking-widest text-accent-sky flex items-center gap-2 mb-3"
        >
          <span class="text-accent-sky">//</span>
          KẾT QUẢ VỪA RỒI
        </h2>
        <div class="grid grid-cols-3 gap-3 text-center">
          <div class="bg-bg-surface p-3">
            <div class="font-display text-2xl font-bold text-accent-sky">
              {{ sessionStats.correct }}
            </div>
            <div class="text-text-dim text-xs mt-0.5">Đúng</div>
          </div>
          <div class="bg-bg-surface p-3">
            <div class="font-display text-2xl font-bold text-accent-coral">
              {{ sessionStats.incorrect }}
            </div>
            <div class="text-text-dim text-xs mt-0.5">Sai</div>
          </div>
          <div class="bg-bg-surface p-3">
            <div class="font-display text-2xl font-bold text-accent-amber">
              {{ sessionStats.accuracy }}%
            </div>
            <div class="text-text-dim text-xs mt-0.5">Chính xác</div>
          </div>
        </div>
        <div class="mt-2 text-center text-text-dim text-xs">
          {{ sessionStats.total }} câu trong {{ sessionStats.durationSeconds / 60 }} phút
        </div>
      </div>

      <!-- Thời gian -->
      <div class="border border-border-default bg-bg-surface p-4">
        <h2
          class="font-display text-xs tracking-widest text-accent-coral flex items-center gap-2 mb-3"
        >
          <span>//</span> THỜI GIAN
        </h2>
        <div class="grid grid-cols-4 gap-2">
          <button
            v-for="d in DURATION_OPTIONS"
            :key="d"
            class="py-2 text-sm font-display font-semibold border transition"
            :class="
              selectedDuration === d
                ? 'border-accent-coral bg-accent-coral/10 text-accent-coral'
                : 'border-border-default text-text-secondary hover:border-accent-coral hover:text-text-primary'
            "
            @click="selectedDuration = d"
          >
            {{ d }} phút
          </button>
        </div>
      </div>

      <!-- Khoá nhạc -->
      <div class="border border-border-default bg-bg-surface p-4">
        <h2
          class="font-display text-xs tracking-widest text-accent-amber flex items-center gap-2 mb-3"
        >
          <span>//</span> KHOÁ NHẠC
        </h2>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="clef in ['treble', 'bass'] as const"
            :key="clef"
            class="py-2.5 text-sm font-display font-semibold border transition"
            :class="
              selectedClef === clef
                ? 'border-accent-amber bg-accent-amber/10 text-accent-amber'
                : 'border-border-default text-text-secondary hover:border-accent-amber hover:text-text-primary'
            "
            @click="selectedClef = clef"
          >
            {{ CLEF_LABELS[clef] }}
          </button>
        </div>
      </div>

      <!-- Dấu hoá -->
      <div class="border border-border-default bg-bg-surface p-4">
        <h2
          class="font-display text-xs tracking-widest text-accent-sky flex items-center gap-2 mb-3"
        >
          <span>//</span> DẤU HOÁ
        </h2>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="mode in ['natural', 'sharp', 'flat', 'all'] as const"
            :key="mode"
            class="py-2 text-sm font-display font-semibold border transition"
            :class="
              selectedAccidental === mode
                ? 'border-accent-sky bg-accent-sky/10 text-accent-sky'
                : 'border-border-default text-text-secondary hover:border-accent-sky hover:text-text-primary'
            "
            @click="selectedAccidental = mode"
          >
            {{ ACCIDENTAL_LABELS[mode] }}
          </button>
        </div>
      </div>

      <!-- Độ khó -->
      <div class="border border-border-default bg-bg-surface p-4">
        <h2
          class="font-display text-xs tracking-widest text-accent-coral flex items-center gap-2 mb-3"
        >
          <span>//</span> ĐỘ KHÓ
        </h2>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="diff in ['easy', 'medium', 'hard', 'custom'] as const"
            :key="diff"
            class="py-2 text-sm font-display font-semibold border transition flex flex-col items-center gap-0.5"
            :class="
              selectedDifficulty === diff
                ? 'border-accent-coral bg-accent-coral/10 text-accent-coral'
                : 'border-border-default text-text-secondary hover:border-accent-coral hover:text-text-primary'
            "
            @click="selectedDifficulty = diff"
          >
            <span>{{ DIFFICULTY_LABELS[diff] }}</span>
            <span v-if="diff !== 'custom'" class="text-[10px] font-body opacity-60">
              {{ difficultyRangeLabel(diff) }}
            </span>
          </button>
        </div>

        <!-- Custom range -->
        <div v-if="selectedDifficulty === 'custom'" class="mt-3 grid grid-cols-2 gap-3">
          <div>
            <label class="text-text-dim text-xs font-display tracking-wide block mb-1"
              >Từ note</label
            >
            <select
              class="w-full bg-bg-elevated border border-border-default text-text-primary text-sm px-2 py-1.5 font-display"
              :value="customLowNote.fullName"
              @change="
                customLowNote =
                  customNoteOptions.find(
                    (n) => n.fullName === ($event.target as HTMLSelectElement).value,
                  ) ?? customLowNote
              "
            >
              <option v-for="n in customNoteOptions" :key="n.fullName" :value="n.fullName">
                {{ noteDisplayName(n) }}
              </option>
            </select>
          </div>
          <div>
            <label class="text-text-dim text-xs font-display tracking-wide block mb-1"
              >Đến note</label
            >
            <select
              class="w-full bg-bg-elevated border border-border-default text-text-primary text-sm px-2 py-1.5 font-display"
              :value="customHighNote.fullName"
              @change="
                customHighNote =
                  customNoteOptions.find(
                    (n) => n.fullName === ($event.target as HTMLSelectElement).value,
                  ) ?? customHighNote
              "
            >
              <option v-for="n in customNoteOptions" :key="n.fullName" :value="n.fullName">
                {{ noteDisplayName(n) }}
              </option>
            </select>
          </div>
          <p v-if="!canStart" class="col-span-2 text-accent-coral text-xs">
            Note đầu phải thấp hơn note cuối.
          </p>
        </div>
      </div>

      <!-- Start button -->
      <button
        class="w-full py-3 font-display text-base font-bold border transition"
        :class="
          canStart
            ? 'border-accent-coral bg-accent-coral/10 text-accent-coral hover:bg-accent-coral hover:text-bg-deep'
            : 'border-border-default text-text-dim cursor-not-allowed'
        "
        :disabled="!canStart"
        @click="startSession"
      >
        BẮT ĐẦU LUYỆN TẬP
      </button>
    </main>

    <!-- ═══════════════════════════════════════════════════════════════ -->
    <!-- PLAYING SCREEN                                                  -->
    <!-- ═══════════════════════════════════════════════════════════════ -->
    <main
      v-else
      class="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 pb-8 flex flex-col gap-4 animate-fade-up"
    >
      <!-- Timer + stats bar -->
      <div class="border border-border-default bg-bg-surface p-3">
        <div class="flex items-center justify-between gap-4 mb-2">
          <div class="flex items-center gap-4">
            <!-- Timer -->
            <div class="text-center">
              <div class="font-display text-2xl font-bold" :class="timerColor">
                {{ formatTime(timeLeft) }}
              </div>
              <div class="text-text-dim text-[10px] font-display tracking-wide">còn lại</div>
            </div>

            <!-- Stats -->
            <div class="flex gap-3">
              <div class="text-center">
                <div class="font-display text-lg font-bold text-accent-sky">{{ correctCount }}</div>
                <div class="text-text-dim text-[10px] font-display tracking-wide">Đúng</div>
              </div>
              <div class="text-center">
                <div class="font-display text-lg font-bold text-accent-coral">
                  {{ incorrectCount }}
                </div>
                <div class="text-text-dim text-[10px] font-display tracking-wide">Sai</div>
              </div>
              <div class="text-center">
                <div class="font-display text-lg font-bold text-accent-amber">{{ accuracy }}%</div>
                <div class="text-text-dim text-[10px] font-display tracking-wide">Chính xác</div>
              </div>
            </div>
          </div>

          <!-- Cancel button -->
          <button
            class="border border-border-default bg-bg-elevated px-3 py-1.5 text-xs text-text-secondary font-display hover:border-accent-coral hover:text-accent-coral transition"
            @click="cancelSession"
          >
            Huỷ
          </button>
        </div>

        <!-- Progress bar -->
        <div class="h-1.5 bg-bg-elevated w-full">
          <div
            class="h-full bg-accent-coral transition-all duration-1000"
            :style="{ width: `${progressPercent}%` }"
          />
        </div>
      </div>

      <!-- Khuôn nhạc -->
      <div
        class="border border-border-default bg-bg-surface p-3 sm:p-5"
        :class="{
          'border-accent-sky': lastAnswerCorrect === true,
          'border-accent-coral': lastAnswerCorrect === false,
        }"
      >
        <div class="flex items-center gap-2 mb-2">
          <span class="font-display text-xs tracking-widest text-accent-amber">//</span>
          <span class="font-display text-xs tracking-widest text-text-dim uppercase">
            {{ selectedClef === 'treble' ? 'Khoá Sol' : 'Khoá Fa' }}
          </span>
        </div>
        <StaffDisplay :note="currentNote" :clef="selectedClef" :feedback="lastAnswerCorrect" />
      </div>

      <!-- Feedback message -->
      <div class="h-8 flex items-center justify-center">
        <div
          v-if="lastAnswerCorrect === true"
          class="font-display text-sm font-bold text-accent-sky tracking-widest animate-fade-up"
        >
          ✓ ĐÚNG! Tiếp theo...
        </div>
        <div
          v-else-if="lastAnswerCorrect === false"
          class="font-display text-sm font-bold text-accent-coral tracking-widest animate-fade-up"
        >
          ✗ SAI — đáp án:
          {{
            currentNote
              ? `${currentNote.name}${currentNote.accidental === '#' ? '♯' : currentNote.accidental === 'b' ? '♭' : ''}${currentNote.octave}`
              : ''
          }}
        </div>
        <div v-else class="text-text-dim text-xs font-display tracking-wide">
          Chọn note trên bàn phím bên dưới
        </div>
      </div>

      <!-- Piano -->
      <div class="border border-border-default bg-bg-surface p-3">
        <div class="flex items-center gap-2 mb-3">
          <span class="font-display text-xs tracking-widest text-accent-coral">//</span>
          <span class="font-display text-xs tracking-widest text-text-dim uppercase"
            >Bàn phím trả lời</span
          >
        </div>
        <PianoAnswer
          :accidental-mode="selectedAccidental"
          :disabled="lastAnswerCorrect !== null"
          :feedback="lastAnswerCorrect"
          :correct-note="currentNote"
          :last-answered="lastAnsweredNote"
          @answer="answerNote"
        />
      </div>
    </main>

    <footer class="text-center py-4 text-text-dim text-xs font-display tracking-wide">
      Được tạo bởi cộng đồng J2TEAM 🎶
    </footer>
  </div>
</template>
