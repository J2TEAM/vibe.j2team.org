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
import { nodeTypes, templates } from '../constants'
import type { NodeType, Template } from '../types'

defineOptions({ name: 'SimulatorSidebar' })

defineProps<{
  collapsed: boolean
  timelineRunning: boolean
}>()

defineEmits<{
  (e: 'toggle-collapse'): void
  (e: 'drag-start', event: DragEvent, type: NodeType): void
  (e: 'load-template', tpl: Template): void
  (e: 'start-simulation'): void
  (e: 'reset-simulation'): void
  (e: 'clear-canvas'): void
}>()
</script>
