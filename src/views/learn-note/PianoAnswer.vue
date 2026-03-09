<script setup lang="ts">
import { computed } from 'vue'
import type { NoteInfo, AccidentalMode } from './useLearnNote'
import { ALL_NOTES_FOR_PIANO } from './useLearnNote'

const props = defineProps<{
  accidentalMode: AccidentalMode
  disabled: boolean
  feedback: boolean | null
  correctNote: NoteInfo | null
  lastAnswered: NoteInfo | null
}>()

const emit = defineEmits<{
  answer: [note: NoteInfo]
}>()

const ONE_OCTAVE = 4

const octaveNotes = computed(() => ALL_NOTES_FOR_PIANO.filter((n) => n.octave === ONE_OCTAVE))

const whiteKeys = computed(() => octaveNotes.value.filter((n) => n.accidental === ''))

const blackKeys = computed(() => octaveNotes.value.filter((n) => n.accidental === '#'))

function blackKeyStyle(note: NoteInfo): Record<string, string> {
  const notes = octaveNotes.value
  const wks = whiteKeys.value
  const totalWhite = wks.length
  const noteIdx = notes.indexOf(note)
  let whiteCount = 0
  for (let i = 0; i < noteIdx; i++) {
    if (notes[i]?.accidental === '') whiteCount++
  }
  const wPercent = 100 / totalWhite
  return {
    left: `${whiteCount * wPercent - wPercent * 0.3}%`,
    width: `${wPercent * 0.6}%`,
  }
}

function sameNote(a: NoteInfo, b: NoteInfo): boolean {
  return a.name === b.name && a.accidental === b.accidental
}

function isCorrectKey(note: NoteInfo): boolean {
  if (props.feedback === null || !props.correctNote) return false
  return sameNote(note, props.correctNote)
}

function isWrongAnswered(note: NoteInfo): boolean {
  if (props.feedback !== false || !props.lastAnswered) return false
  return sameNote(note, props.lastAnswered)
}

function whiteKeyClass(note: NoteInfo): string {
  if (isCorrectKey(note)) return 'bg-accent-sky/80 border-accent-sky'
  if (isWrongAnswered(note)) return 'bg-accent-coral/80 border-accent-coral'
  return 'bg-text-primary hover:bg-gray-200 border-border-default'
}

function blackKeyClass(note: NoteInfo): string {
  if (isCorrectKey(note)) return 'bg-accent-sky border-accent-sky'
  if (isWrongAnswered(note)) return 'bg-accent-coral border-accent-coral'
  return 'bg-bg-deep hover:bg-bg-elevated border-bg-elevated'
}

function onAnswer(note: NoteInfo) {
  if (props.disabled) return
  emit('answer', note)
}

function shortLabel(note: NoteInfo): string {
  const acc = note.accidental === '#' ? '♯' : note.accidental === 'b' ? '♭' : ''
  return `${note.name}${acc}`
}
</script>

<template>
  <div class="w-full select-none">
    <div class="relative" style="height: 240px">
      <div class="flex h-full absolute inset-0 z-0">
        <button
          v-for="key in whiteKeys"
          :key="key.fullName"
          class="relative flex-1 border flex flex-col items-center justify-end pb-1 transition-all duration-100 cursor-pointer"
          :class="[whiteKeyClass(key), disabled ? 'cursor-not-allowed opacity-60' : '']"
          :disabled="disabled"
          @click="onAnswer(key)"
        >
          <span
            class="text-[9px] sm:text-[11px] font-display font-semibold text-text-dim leading-none"
          >
            {{ shortLabel(key) }}
          </span>
        </button>
      </div>

      <button
        v-for="key in blackKeys"
        :key="key.fullName"
        class="absolute top-0 z-10 flex flex-col items-center justify-end pb-1 transition-all duration-100 cursor-pointer border"
        :class="[blackKeyClass(key), disabled ? 'cursor-not-allowed opacity-60' : '']"
        :style="{ ...blackKeyStyle(key), height: '60%' }"
        :disabled="disabled"
        @click="onAnswer(key)"
      >
        <span
          class="text-[7px] sm:text-[9px] font-display font-semibold"
          :class="isCorrectKey(key) || isWrongAnswered(key) ? 'text-white' : 'text-text-dim'"
        >
          {{ shortLabel(key) }}
        </span>
      </button>
    </div>
  </div>
</template>
