<template>
  <div
    class="h-full bg-bg-surface border-r border-default flex flex-col transition-all duration-300 z-20 shadow-2xl relative"
    :class="collapsed ? 'w-16' : 'w-72'"
  >
    <!-- Toggle Button -->
    <button
      @click="$emit('toggle-collapse')"
      class="absolute -right-3 top-6 w-6 h-6 bg-bg-elevated border border-default rounded-full flex items-center justify-center text-text-dim hover:text-white hover:border-accent-sky z-50 transition-colors"
    >
      {{ collapsed ? '»' : '«' }}
    </button>

    <!-- Header -->
    <div class="p-4 border-b border-default shrink-0 flex items-center gap-3 overflow-hidden">
      <div
        class="w-8 h-8 rounded bg-bg-elevated border border-default flex items-center justify-center text-accent-sky font-bold shrink-0 shadow-[0_0_15px_rgba(56,189,248,0.2)]"
      >
        SA
      </div>
      <div class="flex-1 min-w-0" v-if="!collapsed">
        <h1 class="font-display tracking-widest text-sm text-text-primary truncate">
          SYSTEM ARCHITECT
        </h1>
        <div class="text-[9px] text-text-dim/60 font-mono tracking-wider truncate">
          SIMULATION & DESIGN
        </div>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
      <!-- Node Toolbox -->
      <div class="p-4">
        <div
          class="text-[9px] text-text-dim uppercase tracking-widest mb-3 font-display shrink-0 whitespace-nowrap hidden sm:block overflow-hidden"
          :class="collapsed ? 'text-center' : ''"
        >
          {{ collapsed ? 'NODES' : 'COMPONENTS' }}
        </div>
        <div class="grid gap-2" :class="collapsed ? 'grid-cols-1' : 'grid-cols-2'">
          <div
            v-for="type in nodeTypes"
            :key="type.type"
            draggable="true"
            @dragstart="(e) => $emit('drag-start', e, type)"
            class="bg-bg-elevated/40 border-l-2 p-2 cursor-grab active:cursor-grabbing hover:bg-bg-elevated transition-colors group flex items-center gap-2"
            :style="{ borderLeftColor: type.color }"
            :title="type.desc"
          >
            <div class="text-lg shrink-0 w-6 text-center" :class="collapsed ? 'mx-auto' : ''">
              {{ type.icon }}
            </div>
            <div v-if="!collapsed" class="min-w-0">
              <div
                class="text-[10px] font-display tracking-wider truncate"
                :style="{ color: type.color }"
              >
                {{ type.label }}
              </div>
              <div
                class="text-[9px] text-text-dim truncate group-hover:text-text-secondary transition-colors"
              >
                {{ type.desc }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Templates -->
      <div class="p-4 border-t border-default/50" v-if="!collapsed">
        <div class="text-[9px] text-text-dim uppercase tracking-widest mb-3 font-display">
          Templates
        </div>
        <div class="space-y-1.5">
          <button
            v-for="tpl in templates"
            :key="tpl.name"
            @click="$emit('load-template', tpl)"
            class="w-full text-left bg-bg-elevated/20 hover:bg-bg-elevated/60 border border-default/30 p-2 text-[10px] font-display tracking-wide flex items-center gap-2 transition-colors rounded-sm"
          >
            <span>{{ tpl.icon }}</span> {{ tpl.name }}
          </button>
        </div>
      </div>

      <!-- Chaos Events -->
      <div class="p-4 border-t border-default/50" v-if="!collapsed">
        <div class="flex items-center justify-between mb-3 pl-1">
          <div
            class="text-[9px] text-text-dim uppercase tracking-widest font-display flex items-center gap-1.5"
          >
            <span class="text-[12px]">⚠️</span> Chaos Events
          </div>
          <button
            v-if="activeStressEventId"
            @click="$emit('stop-stress-event')"
            class="text-[9px] bg-accent-coral/20 text-accent-coral border border-accent-coral/30 px-1.5 py-0.5 rounded-sm hover:bg-accent-coral hover:text-bg-deep transition-colors"
          >
            STOP
          </button>
        </div>
        <div class="space-y-1.5 flex flex-col items-stretch">
          <button
            v-for="evt in stressEvents"
            :key="evt.id"
            @click="$emit('trigger-stress-event', evt)"
            :disabled="timelineRunning && activeStressEventId !== null"
            class="w-full text-left border p-2 text-[10px] tracking-wide flex flex-col gap-1 transition-all rounded-sm disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
            :class="[
              activeStressEventId === evt.id
                ? 'bg-accent-coral/10 border-accent-coral/50 text-accent-coral shadow-[inset_0_0_10px_rgba(255,107,74,0.2)] bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,107,74,0.05)_10px,rgba(255,107,74,0.05)_20px)] animate-[pan_10s_linear_infinite]'
                : 'bg-bg-elevated/20 border-default/30 hover:border-default hover:bg-bg-elevated/60 text-text-primary',
            ]"
            :style="
              activeStressEventId === evt.id
                ? {}
                : { borderLeftColor: evt.color, borderLeftWidth: '2px' }
            "
          >
            <div class="flex items-center gap-2 font-display">
              <span class="text-sm shrink-0">{{ evt.icon }}</span>
              <span class="font-bold relative z-10">{{ evt.name }}</span>
            </div>
            <div class="text-[8px] opacity-70 flex items-center justify-between mt-0.5">
              <span>{{ evt.desc }}</span>
              <span class="font-mono bg-bg-deep/50 px-1 py-0.5 rounded-sm"
                >{{ evt.duration }}s</span
              >
            </div>

            <div
              v-if="activeStressEventId === evt.id"
              class="absolute top-0 left-0 w-full h-0.5 bg-accent-coral/30"
            >
              <div class="h-full bg-accent-coral animate-flow w-[30%]"></div>
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="p-4 border-t border-default shrink-0 bg-bg-surface flex flex-col gap-2">
      <button
        @click="$emit('start-simulation')"
        :disabled="timelineRunning"
        class="w-full bg-accent-sky/10 border border-accent-sky/50 text-accent-sky hover:bg-accent-sky hover:text-bg-deep font-display py-2 text-[11px] tracking-wider transition-all duration-300 shadow-[0_0_15px_rgba(56,189,248,0.15)] flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span v-if="collapsed">▶</span>
        <span v-else>▶ SIMULATE</span>
      </button>

      <button
        @click="$emit('reset-simulation')"
        v-if="!collapsed"
        class="w-full bg-bg-elevated border border-default text-text-primary hover:bg-bg-elevated/80 font-display py-1.5 text-[10px] tracking-wider transition-colors"
      >
        RESET SIMULATION
      </button>

      <button
        @click="$emit('clear-canvas')"
        v-if="!collapsed"
        class="w-full border border-accent-coral/30 text-accent-coral hover:bg-accent-coral/10 font-display py-1.5 text-[10px] tracking-wider transition-colors mt-2"
      >
        CLEAR CANVAS
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nodeTypes, templates, stressEvents } from '../constants'
import type { NodeType, Template, StressEvent } from '../types'

defineOptions({ name: 'SimulatorSidebar' })

defineProps<{
  collapsed: boolean
  timelineRunning: boolean
  activeStressEventId?: string | null
}>()

defineEmits<{
  (e: 'toggle-collapse'): void
  (e: 'drag-start', event: DragEvent, type: NodeType): void
  (e: 'load-template', tpl: Template): void
  (e: 'start-simulation'): void
  (e: 'reset-simulation'): void
  (e: 'clear-canvas'): void
  (e: 'trigger-stress-event', event: StressEvent): void
  (e: 'stop-stress-event'): void
}>()
</script>
