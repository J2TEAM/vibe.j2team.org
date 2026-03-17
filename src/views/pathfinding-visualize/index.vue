<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import type { Cell } from './composables/useGrid'
import { useGrid } from './composables/useGrid'
import { usePathfinding } from './composables/usePathfinding'
import CodeViewer from './components/CodeViewer.vue'
import { algorithmNotes } from './data/algorithmNotes'

const speed = ref(20)
const explored = ref(0)
const algorithm = ref<'astar' | 'bfs' | 'dfs' | 'dijkstra' | 'prim' | 'greedy'>('astar')

const { grid, rows, cols, start, end, toggleWall, clearGrid, resetVisited, randomWalls } = useGrid()

const { runAStar, runBFS, runDFS, runDijkstra, runPrim, runGreedy } = usePathfinding(
  grid,
  rows,
  cols,
)

function clickCell(cell: Cell) {
  if (!start.value) {
    cell.type = 'start'
    start.value = cell
    return
  }

  if (!end.value && cell !== start.value) {
    cell.type = 'end'
    end.value = cell
    return
  }

  toggleWall(cell)
}

async function startSearch() {
  if (!start.value || !end.value) return

  explored.value = 0

  resetVisited()

  if (algorithm.value === 'astar') {
    await runAStar(start.value, end.value, speed.value, explored)
  }

  if (algorithm.value === 'bfs') {
    await runBFS(start.value, end.value, speed.value, explored)
  }
  if (algorithm.value === 'dfs') {
    await runDFS(start.value, end.value, speed.value, explored)
  }
  if (algorithm.value === 'dijkstra') {
    await runDijkstra(start.value, end.value, speed.value, explored)
  }
  if (algorithm.value === 'prim') {
    await runPrim(start.value, end.value, speed.value, explored)
  }
  if (algorithm.value === 'greedy') {
    await runGreedy(start.value, end.value, speed.value, explored)
  }
}
</script>

<template>
  <div
    class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col items-center px-4 py-6 sm:px-6 sm:py-8"
  >
    <div class="w-full max-w-5xl mx-auto">
      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 sm:px-5 sm:py-2.5 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary mb-4 sm:mb-6"
      >
        ← Trang chủ
      </RouterLink>

      <h1
        class="font-display text-xl sm:text-2xl font-semibold text-text-primary mb-2 flex items-center gap-3 animate-fade-up"
      >
        <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
        Pathfinding Visualizer
      </h1>

      <p class="text-text-secondary text-sm mb-4 sm:mb-6 animate-fade-up animate-delay-1">
        Click ô để đặt Start → End → Tường. Chọn thuật toán rồi bấm Start.
      </p>

      <div class="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6 animate-fade-up animate-delay-2">
        <select
          v-model="algorithm"
          class="w-full sm:w-auto bg-bg-surface border border-border-default px-3 py-2.5 sm:py-2 text-base sm:text-sm text-text-primary focus:border-accent-coral focus:outline-none transition min-w-0 min-h-[44px] sm:min-h-0"
        >
          <option value="astar">A*</option>
          <option value="dijkstra">Dijkstra</option>
          <option value="bfs">BFS</option>
          <option value="dfs">DFS</option>
          <option value="prim">Prim</option>
          <option value="greedy">Greedy</option>
        </select>

        <button
          @click="startSearch"
          class="shrink-0 px-4 py-2 bg-accent-coral text-bg-deep font-display text-sm font-semibold transition hover:bg-accent-coral/90"
        >
          Start
        </button>

        <button
          @click="clearGrid"
          class="shrink-0 px-4 py-2 border border-border-default bg-bg-surface text-text-secondary text-sm transition hover:border-accent-coral hover:text-text-primary"
        >
          Clear
        </button>

        <button
          @click="randomWalls()"
          class="shrink-0 px-4 py-2 border border-border-default bg-bg-surface text-text-secondary text-sm transition hover:border-accent-coral hover:text-text-primary"
        >
          Random Walls
        </button>

        <div class="flex items-center gap-2 text-text-secondary text-sm w-full sm:w-auto">
          <span class="text-text-dim shrink-0">Speed</span>
          <input
            type="range"
            min="5"
            max="100"
            v-model="speed"
            class="accent-accent-coral flex-1 min-w-0"
          />
        </div>
      </div>

      <div
        class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-start justify-items-center w-full"
      >
        <!-- GRID -->
        <div class="flex flex-col items-center w-full max-w-full animate-fade-up animate-delay-3">
          <div
            class="w-full max-w-[400px] aspect-square border border-border-default bg-bg-surface p-1.5 sm:p-2"
          >
            <div
              class="grid w-full h-full"
              :style="{
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
                gridTemplateRows: `repeat(${rows}, 1fr)`,
              }"
            >
              <div v-for="(row, rowIndex) in grid" :key="rowIndex" class="contents">
                <div
                  v-for="cell in row"
                  :key="cell.r + '-' + cell.c"
                  @click="clickCell(cell)"
                  class="border border-border-default cursor-pointer transition touch-manipulation min-w-0 min-h-0"
                  :class="{
                    'bg-accent-coral': cell.type === 'start',
                    'bg-accent-amber': cell.type === 'end',
                    'bg-text-secondary/50': cell.type === 'wall',
                    'bg-accent-sky/30': cell.type === 'visited',
                    'bg-accent-amber/60': cell.type === 'path',
                  }"
                />
              </div>
            </div>
          </div>
          <p class="mt-3 text-xs text-text-dim font-display tracking-wide">
            Nodes explored: {{ explored }}
          </p>
        </div>

        <!-- CODE -->
        <div class="w-full min-w-0 max-w-xl animate-fade-up animate-delay-4">
          <h2
            class="font-display text-lg font-semibold text-text-primary mb-3 flex items-center gap-3"
          >
            <span class="text-accent-amber font-display text-sm tracking-widest">//</span>
            Algorithm Code
          </h2>
          <div
            class="border border-border-default bg-bg-surface overflow-auto max-h-48 sm:max-h-64"
          >
            <CodeViewer :algorithm="algorithm" />
          </div>
          <div class="mt-4 border border-border-default bg-bg-elevated p-4">
            <h3 class="font-display text-sm font-semibold text-text-primary mb-2">
              {{ algorithmNotes[algorithm as keyof typeof algorithmNotes].title }}
            </h3>
            <p class="text-sm text-text-secondary whitespace-pre-line mb-3 font-body">
              {{ algorithmNotes[algorithm as keyof typeof algorithmNotes].content }}
            </p>
            <div class="text-xs text-text-dim whitespace-pre-line font-display tracking-wide">
              {{ algorithmNotes[algorithm as keyof typeof algorithmNotes].complexity }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
