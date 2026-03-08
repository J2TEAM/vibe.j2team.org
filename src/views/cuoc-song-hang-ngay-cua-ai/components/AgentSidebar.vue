<script setup lang="ts">
import type { SmartAgent } from "../types";

defineProps<{
  agents: SmartAgent[];
}>();

const emit = defineEmits(["select"]);
</script>

<template>
  <div class="grid grid-cols-3 sm:flex sm:flex-col gap-3 w-full sm:w-32 shrink-0 p-2 border border-border-default bg-bg-surface overflow-y-auto scrollbar-thin scrollbar-thumb-border-default">
    <div
      v-for="agent in agents"
      :key="agent.id"
      @click="emit('select', agent.id)"
      class="group cursor-pointer border border-border-default bg-bg-deep hover:border-accent-coral hover:bg-bg-elevated transition-all duration-300 flex flex-col items-center justify-center p-2 sm:p-3 relative overflow-hidden min-h-20 sm:min-h-0"
    >
      <!-- Background ID number decoration -->
      <span class="absolute -bottom-2 -right-1 font-pixel text-4xl font-bold text-white/5 select-none pointer-events-none group-hover:text-accent-coral/10 transition-colors">
        0{{ agents.indexOf(agent) + 1 }}
      </span>

      <div class="font-pixel text-base sm:text-lg text-text-primary font-bold uppercase tracking-widest mb-2 group-hover:text-accent-coral transition-colors">
        {{ agent.name }}
      </div>

      <div class="h-10 flex items-center justify-center">
        <div
          v-if="agent.statusText && agent.statusText !== 'THONG THẢ'"
          class="text-sm text-accent-sky font-bold flex flex-row items-center gap-1.5 leading-tight font-pixel uppercase tracking-tighter"
        >
          <span class="text-xl" v-if="agent.statusIcon">{{ agent.statusIcon }}</span>
          <span>{{ agent.statusText }}</span>
        </div>
        <div v-else class="w-1.5 h-1.5 bg-accent-amber animate-pulse shadow-[0_0_8px_rgba(255,184,48,0.5)]"></div>
      </div>    </div>
  </div>
</template>
