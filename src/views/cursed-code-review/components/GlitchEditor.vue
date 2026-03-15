<script setup lang="ts">
import { computed } from 'vue'
import type { Bug } from '../types'

const props = defineProps<{
  code: string
  bugs: Bug[]
  foundBugIds: string[]
  isGlitching: boolean
  safeMode?: boolean
}>()

const emit = defineEmits<{
  (e: 'bugClick', bug: Bug): void
  (e: 'missClick'): void
}>()

const lines = computed(() => props.code.split('\n'))

const handleLineClick = (lineIdx: number) => {
  const lineNum = lineIdx + 1
  const bug = props.bugs.find((b) => b.line === lineNum)

  if (bug) {
    emit('bugClick', bug)
  } else {
    emit('missClick')
  }
}

const getLineClass = (lineIdx: number) => {
  const lineNum = lineIdx + 1
  const bug = props.bugs.find((b) => b.line === lineNum)
  const isFound = bug && props.foundBugIds.includes(bug.id)

  return {
    'bg-accent-coral/20 border-l-2 border-accent-coral': isFound,
    'hover:bg-white/5': !isFound,
    'animate-pulse': !props.safeMode && props.isGlitching && Math.random() > 0.7,
  }
}
</script>

<template>
  <div
    class="relative font-mono text-sm overflow-hidden bg-bg-surface border border-border-default shadow-2xl"
    :class="{ 'glitch-border': isGlitching }"
  >
    <!-- CRT Scanlines overlay -->
    <div
      v-if="!safeMode"
      class="absolute inset-0 pointer-events-none z-10 scanlines opacity-10"
    ></div>

    <div class="p-6 relative z-0">
      <div
        v-for="(line, idx) in lines"
        :key="idx"
        @click="handleLineClick(idx)"
        class="flex gap-4 px-4 py-1 cursor-crosshair transition-all group relative"
        :class="getLineClass(idx)"
      >
        <span class="w-8 text-text-dim text-right select-none opacity-50">{{ idx + 1 }}</span>
        <code class="text-text-primary whitespace-pre">{{ line }}</code>

        <!-- Glitch line effect -->
        <div
          v-if="!safeMode && isGlitching && Math.random() > 0.9"
          class="absolute inset-x-0 h-px bg-accent-coral blur-[2px] opacity-50 animate-glitch-line"
        ></div>
      </div>
    </div>

    <!-- VHS Noise Overlay -->
    <div
      v-if="!safeMode && isGlitching"
      class="absolute inset-0 pointer-events-none z-20 opacity-10 bg-[url('https://media.giphy.com/media/oEI9uWUeez9ZK/giphy.gif')] mix-blend-screen"
    ></div>
  </div>
</template>

<style scoped>
.scanlines {
  background: linear-gradient(to bottom, transparent 50%, rgba(0, 0, 0, 0.5) 50%);
  background-size: 100% 4px;
}

.glitch-border {
  animation: border-glitch 0.2s infinite;
}

@keyframes border-glitch {
  0% {
    border-color: var(--color-accent-coral);
  }
  50% {
    border-color: transparent;
  }
  100% {
    border-color: var(--color-accent-sky);
  }
}

@keyframes glitch-line {
  0% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(10px);
  }
}

.cursor-crosshair {
  cursor: crosshair;
}
</style>
