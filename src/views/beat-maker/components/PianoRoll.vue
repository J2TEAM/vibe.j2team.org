<script setup lang="ts">
import { ref, computed } from 'vue'
import { useElementSize } from '@vueuse/core'
import { Icon } from '@iconify/vue'
import type { PianoNote } from '../types'

const props = defineProps<{
  notes: PianoNote[]
  stepCount: number
  currentStep: number
}>()

const emit = defineEmits<{
  (e: 'addNote', pitch: number, startStep: number, duration: number): void
  (e: 'removeNote', noteId: string): void
}>()

// ── Layout constants ───────────────────────────────────────────────
const PIANO_W = 64
const CELL_H = 18
const MIN_PITCH = 24 // C1
const MAX_PITCH = 84 // C6
const NUM_PITCHES = MAX_PITCH - MIN_PITCH + 1

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const isBlack = (pitch: number) => [1, 3, 6, 8, 10].includes(pitch % 12)
const noteName = (pitch: number) => NOTE_NAMES[pitch % 12]!
const octave = (pitch: number) => Math.floor(pitch / 12) - 1
const isCNote = (pitch: number) => pitch % 12 === 0

// Measure the full wrapper to compute cell width
const wrapperRef = ref<HTMLElement | null>(null)
const { width: wrapperW } = useElementSize(wrapperRef)

// Cell width fills the available grid area (no horizontal overflow)
const cellW = computed(() => {
  const available = wrapperW.value - PIANO_W
  return available > 0 ? available / props.stepCount : 40
})

const gridH = computed(() => NUM_PITCHES * CELL_H)

// ── Mode ────────────────────────────────────────────────────────────
type DrawMode = 'draw' | 'erase'
const mode = ref<DrawMode>('draw')
const snapToGrid = ref(true)

// ── Preview state while drawing ──────────────────────────────────────
const preview = ref<{ pitch: number; startStep: number; duration: number } | null>(null)

// ── Helpers ─────────────────────────────────────────────────────────
const pitchToRow = (pitch: number) => MAX_PITCH - pitch
const rowToPitch = (row: number) => MAX_PITCH - row

const xToStep = (x: number) => {
  // x is relative to the grid div (piano keys are a sibling)
  const raw = x / cellW.value
  return snapToGrid.value ? Math.floor(raw) : raw
}

const yToRow = (y: number) => Math.floor(y / CELL_H)

// ── Grid mouse interaction ───────────────────────────────────────────
const onGridMousedown = (e: MouseEvent) => {
  // Only handle left-click — right-click is handled by onGridRightClick
  if (e.button !== 0) return

  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top

  const step = Math.floor(xToStep(x))
  const row = yToRow(y)
  const pitch = rowToPitch(row)

  if (step < 0 || step >= props.stepCount) return

  if (mode.value === 'erase') {
    // findLast → delete the topmost (last rendered) note at cursor
    const hit = [...props.notes]
      .reverse()
      .find((n) => n.pitch === pitch && step >= n.startStep && step < n.startStep + n.duration)
    if (hit) emit('removeNote', hit.id)
    return
  }

  // Draw mode: drag to set duration
  preview.value = { pitch, startStep: step, duration: 1 }

  const onMove = (me: MouseEvent) => {
    const mx = me.clientX - rect.left
    const endStep = Math.floor(xToStep(mx))
    const duration = Math.max(1, endStep - step + 1)
    preview.value = { pitch, startStep: step, duration }
  }

  const onUp = (me: MouseEvent) => {
    const mx = me.clientX - rect.left
    const endStep = Math.floor(xToStep(mx))
    const duration = Math.max(1, endStep - step + 1)
    emit('addNote', pitch, step, duration)
    preview.value = null
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }

  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

const onGridRightClick = (e: MouseEvent) => {
  e.preventDefault()
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const step = Math.floor(xToStep(x))
  const pitch = rowToPitch(yToRow(y))
  // findLast → delete the topmost (last rendered) note at cursor position
  const hit = [...props.notes]
    .reverse()
    .find((n) => n.pitch === pitch && step >= n.startStep && step < n.startStep + n.duration)
  if (hit) emit('removeNote', hit.id)
}

const hoveredNoteId = ref<string | null>(null)
</script>

<template>
  <div class="flex flex-col h-full bg-bg-deep overflow-hidden">
    <!-- ── Toolbar ─────────────────────────────────────────────── -->
    <div
      class="flex items-center gap-3 px-4 py-2 bg-bg-surface border-b border-border-default flex-shrink-0"
    >
      <span class="text-[9px] font-display uppercase tracking-widest text-text-secondary"
        >Chế độ:</span
      >

      <button
        @click="mode = 'draw'"
        class="flex items-center gap-1.5 px-3 py-1 text-[10px] font-display uppercase tracking-wider transition-all"
        :class="
          mode === 'draw'
            ? 'bg-accent-sky text-white'
            : 'bg-bg-elevated text-text-secondary hover:text-text-primary'
        "
      >
        <Icon icon="lucide:pencil" class="size-3" />
        Vẽ Nốt
      </button>

      <button
        @click="mode = 'erase'"
        class="flex items-center gap-1.5 px-3 py-1 text-[10px] font-display uppercase tracking-wider transition-all"
        :class="
          mode === 'erase'
            ? 'bg-accent-coral text-white'
            : 'bg-bg-elevated text-text-secondary hover:text-text-primary'
        "
      >
        <Icon icon="lucide:eraser" class="size-3" />
        Xóa Nốt
      </button>

      <div class="h-4 w-px bg-border-default mx-1"></div>

      <button
        @click="snapToGrid = !snapToGrid"
        class="flex items-center gap-1.5 px-3 py-1 text-[10px] font-display uppercase tracking-wider transition-all"
        :class="
          snapToGrid
            ? 'bg-accent-amber text-bg-deep'
            : 'bg-bg-elevated text-text-secondary hover:text-text-primary'
        "
      >
        <Icon icon="lucide:magnet" class="size-3" />
        Snap
      </button>

      <div class="ml-auto flex items-center gap-2 text-[9px] text-text-secondary font-display">
        <Icon icon="lucide:mouse-pointer-2" class="size-3" />
        <span v-if="mode === 'draw'">Click + kéo để vẽ nốt • Chuột phải để xóa</span>
        <span v-else>Click vào nốt để xóa</span>
      </div>
    </div>

    <!-- ── Piano + Grid: vertical scroll only ─────────────────── -->
    <!--
      wrapperRef measures the full width (piano + grid).
      overflow-x-hidden: no horizontal scroll.
      overflow-y-auto: vertical scroll for all pitches.
    -->
    <div ref="wrapperRef" class="flex flex-1 overflow-x-hidden overflow-y-auto">
      <!-- Piano keys: sticky left so they don't scroll horizontally -->
      <div
        class="sticky left-0 z-10 flex-shrink-0 flex flex-col border-r border-border-default/50 bg-bg-deep"
        :style="{ width: `${PIANO_W}px` }"
      >
        <div
          v-for="row in NUM_PITCHES"
          :key="row - 1"
          class="flex items-center justify-end pr-2 flex-shrink-0 border-b select-none"
          :style="{ height: `${CELL_H}px` }"
          :class="[
            isBlack(rowToPitch(row - 1))
              ? 'bg-[#1a1a2e] border-border-default/30'
              : 'bg-bg-elevated border-border-default/20',
            isCNote(rowToPitch(row - 1)) ? 'border-t border-accent-amber/40' : '',
          ]"
        >
          <span
            v-if="isCNote(rowToPitch(row - 1))"
            class="text-[9px] font-display font-bold text-accent-amber leading-none"
            >C{{ octave(rowToPitch(row - 1)) }}</span
          >
          <span
            v-else-if="!isBlack(rowToPitch(row - 1))"
            class="text-[8px] font-display text-text-secondary/60 leading-none"
            >{{ noteName(rowToPitch(row - 1)) }}</span
          >
        </div>
      </div>

      <!-- Grid area: expands to fill all remaining width, fixed height = all pitches -->
      <div
        class="flex-1 relative"
        :style="{ height: `${gridH}px` }"
        :class="mode === 'draw' ? 'cursor-crosshair' : 'cursor-cell'"
        @mousedown="onGridMousedown"
        @contextmenu="onGridRightClick"
      >
        <!-- Row stripes -->
        <div
          v-for="row in NUM_PITCHES"
          :key="`row-${row}`"
          class="absolute left-0 right-0 border-b"
          :style="{ top: `${(row - 1) * CELL_H}px`, height: `${CELL_H}px` }"
          :class="[
            isBlack(rowToPitch(row - 1))
              ? 'bg-[#111827]/80 border-border-default/10'
              : 'bg-bg-surface/40 border-border-default/15',
            isCNote(rowToPitch(row - 1)) ? 'border-t border-accent-amber/20' : '',
          ]"
        ></div>

        <!-- Beat dividers (vertical) -->
        <div
          v-for="step in stepCount + 1"
          :key="`col-${step}`"
          class="absolute top-0 bottom-0"
          :style="{ left: `${(step - 1) * cellW}px`, width: '1px' }"
          :class="(step - 1) % 4 === 0 ? 'bg-border-default/50' : 'bg-border-default/15'"
        ></div>

        <!-- Beat group number labels -->
        <template v-for="step in stepCount" :key="`label-${step}`">
          <div
            v-if="(step - 1) % 4 === 0"
            class="absolute text-[8px] font-display text-accent-amber/60 pointer-events-none"
            :style="{ left: `${(step - 1) * cellW + 3}px`, top: '2px' }"
          >
            {{ Math.floor((step - 1) / 4) + 1 }}
          </div>
        </template>

        <!-- Existing notes -->
        <div
          v-for="note in notes"
          :key="note.id"
          class="absolute flex items-center overflow-hidden border border-white/30 transition-opacity"
          :style="{
            left: `${note.startStep * cellW + 1}px`,
            top: `${pitchToRow(note.pitch) * CELL_H + 2}px`,
            width: `${note.duration * cellW - 2}px`,
            height: `${CELL_H - 4}px`,
            backgroundColor: `rgba(107, 202, 255, ${0.5 + (note.velocity / 127) * 0.5})`,
            borderColor: 'rgba(107, 202, 255, 0.8)',
            borderRadius: '2px',
          }"
          @mouseenter="hoveredNoteId = note.id"
          @mouseleave="hoveredNoteId = null"
        >
          <span
            class="px-1 text-[8px] font-display text-white font-bold truncate leading-none select-none"
          >
            {{ noteName(note.pitch) }}{{ octave(note.pitch) }}
          </span>
          <button
            v-if="hoveredNoteId === note.id"
            class="ml-auto mr-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center bg-white/20 hover:bg-accent-coral rounded-sm transition-colors"
            @click.stop="emit('removeNote', note.id)"
            @mousedown.stop
          >
            <Icon icon="lucide:x" class="size-2.5 text-white" />
          </button>
        </div>

        <!-- Preview note while dragging -->
        <div
          v-if="preview"
          class="absolute pointer-events-none border border-dashed border-white/60"
          :style="{
            left: `${preview.startStep * cellW + 1}px`,
            top: `${pitchToRow(preview.pitch) * CELL_H + 2}px`,
            width: `${preview.duration * cellW - 2}px`,
            height: `${CELL_H - 4}px`,
            backgroundColor: 'rgba(107, 202, 255, 0.3)',
            borderRadius: '2px',
          }"
        ></div>

        <!-- Playhead column highlight -->
        <div
          v-if="currentStep >= 0"
          class="absolute top-0 bottom-0 pointer-events-none"
          :style="{
            left: `${currentStep * cellW}px`,
            width: `${cellW}px`,
            backgroundColor: 'rgba(255, 200, 0, 0.06)',
            borderLeft: '2px solid rgba(255, 200, 0, 0.5)',
          }"
        ></div>
      </div>
    </div>

    <!-- ── Legend ──────────────────────────────────────────────── -->
    <div
      class="flex items-center gap-4 px-4 py-2 bg-bg-surface border-t border-border-default flex-shrink-0"
    >
      <div class="flex items-center gap-1.5">
        <div class="size-3" style="background: rgba(107, 202, 255, 0.8); border-radius: 2px"></div>
        <span class="text-[9px] font-display text-text-secondary">Nốt nhạc</span>
      </div>
      <div class="flex items-center gap-1.5">
        <div
          class="size-3 border border-dashed border-white/50"
          style="background: rgba(107, 202, 255, 0.25); border-radius: 2px"
        ></div>
        <span class="text-[9px] font-display text-text-secondary">Preview</span>
      </div>
      <div class="flex items-center gap-1.5">
        <div
          class="size-3 border-l-2"
          style="border-color: rgba(255, 200, 0, 0.6); background: rgba(255, 200, 0, 0.06)"
        ></div>
        <span class="text-[9px] font-display text-text-secondary">Playhead</span>
      </div>
      <span class="ml-auto text-[9px] font-display text-text-secondary"
        >{{ notes.length }} nốt</span
      >
    </div>
  </div>
</template>

<style scoped>
/* Thin, subtle vertical scrollbar */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: rgba(255, 107, 107, 0.3);
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 107, 107, 0.6);
}
</style>
