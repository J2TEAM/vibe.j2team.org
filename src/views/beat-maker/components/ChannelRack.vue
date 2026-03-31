<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { Track } from '../types'

defineProps<{
  tracks: Track[]
  selectedTrackId: string | null
}>()

const emit = defineEmits<{
  (e: 'select', trackId: string): void
  (e: 'remove', trackId: string): void
  (e: 'update:volume', trackId: string, value: number): void
  (e: 'update:pan', trackId: string, value: number): void
  (e: 'update:filterFreq', trackId: string, value: number): void
  (e: 'toggleMute', trackId: string): void
  (e: 'toggleSolo', trackId: string): void
  (e: 'addTrack'): void
}>()
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-border-default">
      <h3 class="font-display text-xs uppercase tracking-widest text-text-secondary">
        Channel Rack
      </h3>
    </div>

    <!-- Track rows -->
    <div class="flex-1 overflow-y-auto">
      <div
        v-for="track in tracks"
        :key="track.id"
        @click="emit('select', track.id)"
        class="group relative px-3 py-2 border-b border-border-default cursor-pointer transition-colors"
        :class="selectedTrackId === track.id ? 'bg-bg-elevated' : 'hover:bg-bg-surface'"
      >
        <div class="flex items-center gap-2 mb-2">
          <!-- Color dot -->
          <div class="size-2 flex-shrink-0" :style="{ backgroundColor: track.color }"></div>
          <!-- Name -->
          <span class="flex-1 text-[11px] font-display text-text-primary truncate">{{
            track.name
          }}</span>
          <!-- M/S buttons -->
          <button
            @click.stop="emit('toggleMute', track.id)"
            class="text-[9px] px-1 py-0.5 font-display transition-colors"
            :class="
              track.muted
                ? 'bg-accent-amber text-bg-deep'
                : 'text-text-secondary hover:text-accent-amber'
            "
          >
            M
          </button>
          <button
            @click.stop="emit('toggleSolo', track.id)"
            class="text-[9px] px-1 py-0.5 font-display transition-colors"
            :class="
              track.solo
                ? 'bg-accent-sky text-bg-deep'
                : 'text-text-secondary hover:text-accent-sky'
            "
          >
            S
          </button>
          <!-- Delete -->
          <button
            @click.stop="emit('remove', track.id)"
            class="opacity-0 group-hover:opacity-100 text-text-secondary hover:text-accent-coral transition-all"
          >
            <Icon icon="lucide:x" class="size-3" />
          </button>
        </div>

        <!-- Vol / Pan / Filter -->
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="text-[8px] font-display text-text-secondary w-3">V</span>
            <input
              type="range"
              :value="track.volume * 100"
              min="0"
              max="100"
              step="1"
              class="flex-1 h-0.5 accent-accent-coral cursor-pointer"
              @input="
                emit(
                  'update:volume',
                  track.id,
                  Number(($event.target as HTMLInputElement).value) / 100,
                )
              "
              @click.stop
            />
          </div>
          <div class="flex items-center gap-2">
            <span class="text-[8px] font-display text-text-secondary w-3">P</span>
            <input
              type="range"
              :value="track.pan * 50 + 50"
              min="0"
              max="100"
              step="1"
              class="flex-1 h-0.5 accent-accent-amber cursor-pointer"
              @input="
                emit(
                  'update:pan',
                  track.id,
                  (Number(($event.target as HTMLInputElement).value) - 50) / 50,
                )
              "
              @click.stop
            />
          </div>
          <div class="flex items-center gap-2">
            <span class="text-[8px] font-display text-text-secondary w-3">F</span>
            <input
              type="range"
              :value="track.filterFreq"
              min="200"
              max="20000"
              step="100"
              class="flex-1 h-0.5 accent-accent-sky cursor-pointer"
              @input="
                emit(
                  'update:filterFreq',
                  track.id,
                  Number(($event.target as HTMLInputElement).value),
                )
              "
              @click.stop
            />
          </div>
        </div>

        <!-- Selected indicator -->
        <div
          v-if="selectedTrackId === track.id"
          class="absolute left-0 top-0 bottom-0 w-0.5"
          :style="{ backgroundColor: track.color }"
        ></div>
      </div>

      <!-- Add track button -->
      <button
        @click="emit('addTrack')"
        class="w-full flex items-center gap-2 px-4 py-3 text-text-secondary hover:text-accent-coral hover:bg-bg-elevated transition-colors border-b border-border-default"
      >
        <Icon icon="lucide:plus" class="size-4" />
        <span class="text-[10px] font-display uppercase tracking-widest">Thêm Nhạc Cụ</span>
      </button>
    </div>
  </div>
</template>
