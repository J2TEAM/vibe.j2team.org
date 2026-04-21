<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import type { GridConfig, GridItem } from '../types'
import GridItemComp from './GridItem.vue'

const props = defineProps<{
  config: GridConfig
  items: GridItem[]
  isDragging: boolean
  previewCol: number | null
  previewRow: number | null
  previewColSpan: number | null
  previewRowSpan: number | null
  dragItemId: number | null
}>()

const emit = defineEmits<{
  addItem: [col: number, row: number]
  removeItem: [id: number]
  startMove: [id: number, event: PointerEvent]
  startResize: [id: number, event: PointerEvent]
  gridMounted: [el: HTMLElement]
}>()

const gridRef = ref<HTMLElement | null>(null)

watch(gridRef, (el) => {
  if (el) emit('gridMounted', el)
})

const gridStyle = computed(() => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${props.config.columns}, minmax(60px, 1fr))`,
  gridTemplateRows: `repeat(${props.config.rows}, 60px)`,
  gap: `${props.config.gap}px`,
}))

// Build a map of which cells are occupied by which item
const cellMap = computed(() => {
  const map = new Map<string, GridItem>()
  props.items.forEach((item) => {
    for (let r = item.row; r < item.row + item.rowSpan; r++) {
      for (let c = item.col; c < item.col + item.colSpan; c++) {
        map.set(`${r}-${c}`, item)
      }
    }
  })
  return map
})

// For rendering: we need to produce cells for empty spots and items at their anchor positions
interface CellInfo {
  type: 'empty' | 'item' | 'occupied'
  col: number
  row: number
  item?: GridItem
}

const cells = computed<CellInfo[]>(() => {
  const result: CellInfo[] = []
  const itemAnchors = new Set(props.items.map((item) => `${item.row}-${item.col}`))

  for (let r = 1; r <= props.config.rows; r++) {
    for (let c = 1; c <= props.config.columns; c++) {
      const key = `${r}-${c}`
      const occupant = cellMap.value.get(key)

      if (!occupant) {
        result.push({ type: 'empty', col: c, row: r })
      } else if (itemAnchors.has(key)) {
        result.push({ type: 'item', col: c, row: r, item: occupant })
      }
      // Skip 'occupied' cells — items handle their own span
    }
  }
  return result
})

function getItemStyle(item: GridItem) {
  const style: Record<string, string> = {
    gridColumn: `${item.col} / span ${item.colSpan}`,
    gridRow: `${item.row} / span ${item.rowSpan}`,
  }

  // If this item is being dragged and we have preview position
  if (props.dragItemId === item.id && props.previewCol !== null && props.previewRow !== null) {
    style.gridColumn = `${props.previewCol} / span ${props.previewColSpan ?? item.colSpan}`
    style.gridRow = `${props.previewRow} / span ${props.previewRowSpan ?? item.rowSpan}`
  }

  return style
}
</script>

<template>
  <div class="border border-border-default bg-bg-surface p-4">
    <h2
      class="font-display text-sm font-semibold tracking-widest text-text-secondary uppercase mb-4 flex items-center gap-2"
    >
      <Icon icon="lucide:grid-3x3" class="size-4 text-accent-amber" />
      Canvas
    </h2>

    <div class="overflow-x-auto">
      <div ref="gridRef" :style="gridStyle" class="min-w-[200px]">
        <!-- Empty cells -->
        <template v-for="cell in cells" :key="`${cell.row}-${cell.col}`">
          <button
            v-if="cell.type === 'empty'"
            class="border border-dashed border-border-default bg-bg-elevated/30 flex items-center justify-center text-text-dim hover:text-accent-coral hover:border-accent-coral/50 hover:bg-accent-coral/5 transition-all duration-150 cursor-pointer"
            :style="{
              gridColumn: `${cell.col}`,
              gridRow: `${cell.row}`,
            }"
            @click="emit('addItem', cell.col, cell.row)"
          >
            <Icon icon="lucide:plus" class="size-4" />
          </button>

          <!-- Grid items -->
          <div v-else-if="cell.type === 'item' && cell.item" :style="getItemStyle(cell.item)">
            <GridItemComp
              :item-id="cell.item.id"
              :color="cell.item.color"
              :is-dragging="isDragging"
              :is-being-dragged="dragItemId === cell.item.id"
              class="w-full h-full min-h-[60px]"
              @remove="(id: number) => emit('removeItem', id)"
              @start-move="(id: number, ev: PointerEvent) => emit('startMove', id, ev)"
              @start-resize="(id: number, ev: PointerEvent) => emit('startResize', id, ev)"
            />
          </div>
        </template>
      </div>
    </div>

    <!-- Grid info -->
    <div class="mt-3 flex items-center gap-4 text-xs text-text-dim font-mono">
      <span>{{ config.columns }}×{{ config.rows }}</span>
      <span>gap: {{ config.gap }}px</span>
      <span>{{ items.length }} phần tử</span>
    </div>
  </div>
</template>
