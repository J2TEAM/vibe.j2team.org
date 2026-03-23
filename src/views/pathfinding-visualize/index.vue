<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useEventListener } from '@vueuse/core'
import type { Cell } from './composables/useGrid'
import { useGrid } from './composables/useGrid'
import { usePathfinding } from './composables/usePathfinding'
import CodeViewer from './components/CodeViewer.vue'
import { algorithmNotes } from './data/algorithmNotes'

const speed = ref(20)
const explored = ref(0)
const pathNotFound = ref(false)
const algorithm = ref<'astar' | 'bfs' | 'dfs' | 'dijkstra' | 'prim' | 'greedy'>('astar')

const { grid, rows, cols, start, end, toggleWall, setWall, clearGrid, resetVisited, randomWalls } =
  useGrid()

const { runAStar, runBFS, runDFS, runDijkstra, runPrim, runGreedy } = usePathfinding(
  grid,
  rows,
  cols,
)

const gridContainerRef = ref<HTMLElement | null>(null)
const isDragging = ref(false)
const lastCell = ref<Cell | null>(null)
const mouseDownCell = ref<Cell | null>(null)

function getLineCells(r0: number, c0: number, r1: number, c1: number): { r: number; c: number }[] {
  const cells: { r: number; c: number }[] = []
  const dr = Math.abs(r1 - r0)
  const dc = Math.abs(c1 - c0)
  const sr = r0 < r1 ? 1 : -1
  const sc = c0 < c1 ? 1 : -1
  let err = dr - dc
  let r = r0
  let c = c0
  while (true) {
    cells.push({ r, c })
    if (r === r1 && c === c1) break
    const e2 = 2 * err
    if (e2 > -dc) {
      err -= dc
      r += sr
    }
    if (e2 < dr) {
      err += dr
      c += sc
    }
  }
  return cells
}

function getCellFromPoint(clientX: number, clientY: number): Cell | null {
  const el = gridContainerRef.value
  if (!el) return null
  const rect = el.getBoundingClientRect()
  const cellWidth = rect.width / cols
  const cellHeight = rect.height / rows
  const c = Math.floor((clientX - rect.left) / cellWidth)
  const r = Math.floor((clientY - rect.top) / cellHeight)
  if (r < 0 || r >= rows || c < 0 || c >= cols) return null
  return grid.value[r]?.[c] ?? null
}

function onMouseDown(cell: Cell, e: MouseEvent) {
  e.preventDefault()

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

  if (cell.type === 'start' || cell.type === 'end') return

  mouseDownCell.value = cell
  lastCell.value = cell
}

function onMouseMove(e: MouseEvent) {
  if (mouseDownCell.value === null) return
  const cell = getCellFromPoint(e.clientX, e.clientY)
  if (!cell || cell === lastCell.value) return
  if (cell.type === 'start' || cell.type === 'end') return

  if (!isDragging.value) isDragging.value = true

  const cells = getLineCells(lastCell.value!.r, lastCell.value!.c, cell.r, cell.c)
  for (const { r, c } of cells) {
    const target = grid.value[r]?.[c]
    if (target && target.type !== 'start' && target.type !== 'end') {
      setWall(target)
    }
  }
  lastCell.value = cell
}

function onMouseUp() {
  if (isDragging.value) {
    isDragging.value = false
    lastCell.value = null
    mouseDownCell.value = null
    return
  }
  if (mouseDownCell.value) {
    toggleWall(mouseDownCell.value)
    mouseDownCell.value = null
  }
}

useEventListener(document, 'mousemove', onMouseMove)
useEventListener(document, 'mouseup', onMouseUp)

async function startSearch() {
  if (!start.value || !end.value) return

  explored.value = 0
  pathNotFound.value = false
  resetVisited()

  let found = false
  if (algorithm.value === 'astar') {
    found = await runAStar(start.value, end.value, speed.value, explored)
  } else if (algorithm.value === 'bfs') {
    found = await runBFS(start.value, end.value, speed.value, explored)
  } else if (algorithm.value === 'dfs') {
    found = await runDFS(start.value, end.value, speed.value, explored)
  } else if (algorithm.value === 'dijkstra') {
    found = await runDijkstra(start.value, end.value, speed.value, explored)
  } else if (algorithm.value === 'prim') {
    found = await runPrim(start.value, end.value, speed.value, explored)
  } else if (algorithm.value === 'greedy') {
    found = await runGreedy(start.value, end.value, speed.value, explored)
  }

  if (!found) pathNotFound.value = true
}

function handleClear() {
  pathNotFound.value = false
  clearGrid()
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
        Click ô để đặt Start → End → Tường. Có thể giữ chuột và kéo để vẽ tường nhanh. Chọn thuật
        toán rồi bấm Start.
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
          @click="handleClear"
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
              ref="gridContainerRef"
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
                  @mousedown="onMouseDown(cell, $event)"
                  class="border border-border-default cursor-pointer transition touch-manipulation min-w-0 min-h-0 select-none"
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
          <p v-if="pathNotFound" class="mt-2 text-sm text-accent-coral font-body">
            Không tìm thấy đường đi giữa Start và End.
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
