<script setup lang="ts">
import { computed } from 'vue'
import type { GitState } from '../types'

const props = defineProps<{
  state: GitState
}>()

const nodes = computed(() => {
  return props.state.commits.map((commit) => {
    const isHead =
      props.state.head === commit.hash ||
      props.state.branches.some((b) => b.name === props.state.head && b.commitHash === commit.hash)

    const activeBranches = props.state.branches.filter((b) => b.commitHash === commit.hash)

    return {
      ...commit,
      isHead,
      activeBranches,
    }
  })
})

const edges = computed(() => {
  const allEdges: { id: string; path: string }[] = []
  props.state.commits.forEach((c) => {
    c.parentHashes.forEach((parentHash) => {
      const parent = props.state.commits.find((p) => p.hash === parentHash)
      if (!parent) return

      const dx = c.x - parent.x
      const xMid = parent.x + dx / 2
      const path = `M ${parent.x} ${parent.y} C ${xMid} ${parent.y}, ${xMid} ${c.y}, ${c.x} ${c.y}`

      allEdges.push({
        id: `${c.hash}-${parentHash}`,
        path,
      })
    })
  })
  return allEdges
})
</script>

<template>
  <div
    class="relative w-full h-[450px] bg-bg-deep border border-border-default overflow-hidden group"
  >
    <!-- Sophisticated Background -->
    <div
      class="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--color-bg-surface)_0%,var(--color-bg-deep)_100%)] opacity-50"
    ></div>

    <svg class="w-full h-full relative z-10">
      <defs>
        <pattern id="grid-dots" width="40" height="40" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="var(--color-border-default)" fill-opacity="0.2" />
        </pattern>

        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="20"
          refY="3.5"
          orientation="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="var(--color-border-default)" />
        </marker>
      </defs>

      <rect width="100%" height="100%" fill="url(#grid-dots)" />

      <!-- Connections (Curved) -->
      <path
        v-for="edge in edges"
        :key="edge!.id"
        :d="edge!.path"
        fill="none"
        stroke="var(--color-border-default)"
        stroke-width="2"
        stroke-linecap="round"
        class="transition-all duration-700 ease-in-out opacity-40 group-hover:opacity-60"
        marker-end="url(#arrowhead)"
      />

      <!-- Commit Nodes -->
      <g v-for="node in nodes" :key="node.hash" class="transition-all duration-700 ease-in-out">
        <!-- Commit Halo/Glow -->
        <circle
          v-if="node.isHead"
          :cx="node.x"
          :cy="node.y"
          r="18"
          class="fill-accent-coral/20 animate-pulse"
        />

        <!-- Commit Circle -->
        <circle
          :cx="node.x"
          :cy="node.y"
          r="10"
          :class="[
            node.isHead
              ? 'fill-accent-coral stroke-white shadow-lg'
              : 'fill-bg-elevated stroke-border-default hover:stroke-accent-amber',
            'transition-all duration-500 cursor-pointer',
          ]"
          stroke-width="2"
          filter="url(#glow)"
        />

        <!-- Hash Label -->
        <text
          :x="node.x"
          :y="node.y + 28"
          text-anchor="middle"
          class="text-[9px] font-mono fill-text-dim tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {{ node.hash }}
        </text>

        <!-- Branch Labels -->
        <g v-for="(branch, idx) in node.activeBranches" :key="branch.name">
          <!-- Sharp Card Style for Branch - Dynamic Width -->
          <rect
            :x="node.x - Math.max(70, branch.name.length * 8 + 10) / 2"
            :y="node.y - 45 - idx * 24"
            :width="Math.max(70, branch.name.length * 8 + 10)"
            height="20"
            :fill="
              state.head === branch.name ? 'var(--color-accent-sky)' : 'var(--color-bg-surface)'
            "
            stroke="var(--color-border-default)"
            stroke-width="1"
          />
          <text
            :x="node.x"
            :y="node.y - 31 - idx * 24"
            text-anchor="middle"
            class="text-[10px] font-display font-bold uppercase tracking-wider"
            :fill="
              state.head === branch.name ? 'var(--color-bg-deep)' : 'var(--color-text-primary)'
            "
          >
            {{ branch.name }}
          </text>
          <!-- Small Triangle Pointer -->
          <path
            v-if="idx === 0"
            :d="`M ${node.x - 4} ${node.y - 25} L ${node.x + 4} ${node.y - 25} L ${node.x} ${node.y - 18} Z`"
            :fill="
              state.head === branch.name ? 'var(--color-accent-sky)' : 'var(--color-bg-surface)'
            "
            stroke="var(--color-border-default)"
            stroke-width="0.5"
          />
        </g>

        <!-- HEAD indicator (Only if detached) -->
        <g v-if="state.head === node.hash">
          <rect
            :x="node.x - 35"
            :y="node.y - 45 - node.activeBranches.length * 24"
            width="70"
            height="20"
            fill="var(--color-accent-amber)"
          />
          <text
            :x="node.x"
            :y="node.y - 31 - node.activeBranches.length * 24"
            text-anchor="middle"
            class="text-[10px] font-display font-bold uppercase tracking-wider"
            fill="var(--color-bg-deep)"
          >
            HEAD
          </text>
        </g>
      </g>
    </svg>

    <!-- Legend -->
    <div
      class="absolute bottom-6 right-6 flex flex-col gap-2 bg-bg-surface/80 border border-border-default px-4 py-3 backdrop-blur-md z-20"
    >
      <div
        class="text-[8px] font-display font-bold uppercase tracking-[0.2em] text-text-dim mb-1 border-b border-border-default pb-1"
      >
        Z-Index Legend
      </div>
      <div class="flex items-center gap-3 text-[10px] font-display font-medium text-text-secondary">
        <span
          class="w-3 h-3 rounded-full bg-accent-coral shadow-[0_0_8px_rgba(255,111,97,0.5)]"
        ></span>
        CURRENT HEAD
      </div>
      <div class="flex items-center gap-3 text-[10px] font-display font-medium text-text-secondary">
        <span class="w-3 h-3 rounded-full bg-bg-elevated border border-border-default"></span>
        COMMIT NODE
      </div>
      <div class="flex items-center gap-3 text-[10px] font-display font-medium text-text-secondary">
        <div class="w-5 h-2 bg-accent-sky"></div>
        ACTIVE BRANCH
      </div>
    </div>

    <!-- Background Gradient Title -->
    <div class="absolute top-6 left-6 z-20 pointer-events-none opacity-20">
      <div
        class="text-4xl font-display font-black italic text-white/10 uppercase tracking-tighter select-none"
      >
        Git State Visualizer
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.2;
    transform: scale(1);
  }
  50% {
    opacity: 0.4;
    transform: scale(1.2);
  }
}

path {
  transition: d 0.7s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
