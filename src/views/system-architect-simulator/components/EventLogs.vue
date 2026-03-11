<template>
  <div
    v-if="isVisible || logs.length > 0"
    class="absolute top-4 left-4 w-64 bg-bg-surface/90 backdrop-blur-md border border-default rounded-sm shadow-xl pointer-events-auto flex flex-col transition-all duration-300"
    :style="{ maxHeight: isExpanded ? '300px' : '36px', 'z-index': 30 }"
  >
    <div
      class="px-3 py-2 border-b border-default/50 flex justify-between items-center cursor-pointer bg-bg-elevated/50 shrink-0"
      @click="$emit('toggle')"
    >
      <div class="flex items-center gap-2">
        <span class="text-xs">📋</span>
        <span class="font-display text-[9px] tracking-widest text-text-secondary">SYSTEM LOGS</span>
        <span class="px-1.5 py-0.5 rounded-sm bg-black/30 text-[8px] font-mono text-text-dim">{{
          logs.length
        }}</span>
      </div>
      <button
        @click.stop="$emit('clear')"
        class="text-text-dim hover:text-white text-[10px] transition-colors"
        title="Clear Logs"
      >
        ✕
      </button>
    </div>
    <div
      class="flex-1 overflow-y-auto p-2 space-y-1.5 font-mono text-[9px] flex flex-col-reverse custom-scrollbar"
    >
      <div
        v-for="log in logs.slice().reverse()"
        :key="log.id"
        class="px-2 py-1.5 rounded-sm border-l-2"
        :class="{
          'bg-accent-coral/10 border-accent-coral text-accent-coral': log.type === 'error',
          'bg-accent-amber/10 border-accent-amber text-accent-amber': log.type === 'warning',
          'bg-accent-sky/10 border-accent-sky text-text-secondary': log.type === 'info',
          'bg-text-dim/10 border-text-dim text-text-dim': log.type === 'debug',
        }"
      >
        <span class="opacity-50 mr-1.5">[{{ log.time }}]</span>
        <span class="font-bold mr-1">{{ log.source }}:</span>
        <span>{{ log.message }}</span>
      </div>
      <div v-if="logs.length === 0" class="text-center text-text-dim/50 py-4 italic">
        No events recorded yet...
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { EventLog } from '../types'

defineProps<{
  logs: EventLog[]
  isVisible: boolean
  isExpanded: boolean
}>()

defineEmits<{
  (e: 'toggle'): void
  (e: 'clear'): void
}>()
</script>
