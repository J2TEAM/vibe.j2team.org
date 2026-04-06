<script setup lang="ts">
import { computed, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useGridState } from './composables/useGridState'
import { useDragEngine } from './composables/useDragEngine'
import { useCodeGenerator } from './composables/useCodeGenerator'
import ConfigPanel from './components/ConfigPanel.vue'
import GridCanvas from './components/GridCanvas.vue'
import CodeOutput from './components/CodeOutput.vue'

const {
  config,
  items,
  canPlace,
  addItem,
  removeItem,
  moveItem,
  resizeItem,
  resetItems,
  pruneOutOfBounds,
} = useGridState()

const {
  isDragging,
  previewCol,
  previewRow,
  previewColSpan,
  previewRowSpan,
  dragState,
  startDrag,
  setGridElement,
} = useDragEngine(config, items, canPlace, moveItem, resizeItem)

const { generatedHtml, generatedCss } = useCodeGenerator(config, items)

const dragItemId = computed(() => dragState.value?.itemId ?? null)

// When config changes, prune items that are now out of bounds
watch(
  () => [config.columns, config.rows],
  () => {
    pruneOutOfBounds()
  },
)

function handleAddItem(col: number, row: number) {
  addItem(col, row)
}

function handleRemoveItem(id: number) {
  removeItem(id)
}

function handleStartMove(id: number, event: PointerEvent) {
  startDrag(id, 'move', event)
}

function handleStartResize(id: number, event: PointerEvent) {
  startDrag(id, 'resize', event)
}

function handleGridMounted(el: HTMLElement) {
  setGridElement(el)
}

function handleConfigUpdate(patch: Partial<import('./types').GridConfig>) {
  Object.assign(config, patch)
  pruneOutOfBounds()
}
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <!-- Header -->
      <header class="mb-8 animate-fade-up">
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
              <span class="text-text-dim font-display text-xs tracking-widest uppercase">Tool</span>
            </div>
            <h1 class="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary">
              CSS Grid
              <span class="text-accent-coral">Generator</span>
            </h1>
            <p class="mt-3 text-text-secondary text-sm sm:text-base max-w-xl">
              Tạo CSS Grid layout trực quan bằng cách click, kéo thả &amp; resize. Code HTML/CSS
              được sinh tự động, sẵn sàng copy.
            </p>
            <p class="mt-1.5 text-text-dim text-xs font-display tracking-wide">
              Tác giả: Himakevolution
            </p>
          </div>
          <RouterLink
            to="/"
            class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-5 py-2.5 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary shrink-0 self-start"
          >
            <Icon icon="lucide:arrow-left" class="size-4" />
            Về trang chủ
          </RouterLink>
        </div>
      </header>

      <!-- How to use hints -->
      <div class="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fade-up animate-delay-1">
        <div class="border border-border-default bg-bg-surface/50 p-3 flex items-start gap-3">
          <div
            class="size-8 border border-accent-coral/30 bg-accent-coral/10 flex items-center justify-center shrink-0"
          >
            <Icon icon="lucide:mouse-pointer-click" class="size-4 text-accent-coral" />
          </div>
          <div>
            <p class="text-xs font-display font-semibold text-text-primary">Click ô trống</p>
            <p class="text-xs text-text-dim mt-0.5">Thêm phần tử mới vào lưới</p>
          </div>
        </div>
        <div class="border border-border-default bg-bg-surface/50 p-3 flex items-start gap-3">
          <div
            class="size-8 border border-accent-amber/30 bg-accent-amber/10 flex items-center justify-center shrink-0"
          >
            <Icon icon="lucide:move" class="size-4 text-accent-amber" />
          </div>
          <div>
            <p class="text-xs font-display font-semibold text-text-primary">Kéo để di chuyển</p>
            <p class="text-xs text-text-dim mt-0.5">Giữ và kéo phần tử sang ô khác</p>
          </div>
        </div>
        <div class="border border-border-default bg-bg-surface/50 p-3 flex items-start gap-3">
          <div
            class="size-8 border border-accent-sky/30 bg-accent-sky/10 flex items-center justify-center shrink-0"
          >
            <Icon icon="lucide:maximize-2" class="size-4 text-accent-sky" />
          </div>
          <div>
            <p class="text-xs font-display font-semibold text-text-primary">Kéo góc để resize</p>
            <p class="text-xs text-text-dim mt-0.5">Mở rộng phần tử qua nhiều ô</p>
          </div>
        </div>
      </div>

      <!-- Config Panel — full width on top -->
      <div class="animate-fade-up animate-delay-2">
        <ConfigPanel :config="config" @reset="resetItems" @update:config="handleConfigUpdate" />
      </div>

      <!-- Grid Canvas — full width -->
      <div class="mt-5 animate-fade-up animate-delay-3">
        <GridCanvas
          :config="config"
          :items="items"
          :is-dragging="isDragging"
          :preview-col="previewCol"
          :preview-row="previewRow"
          :preview-col-span="previewColSpan"
          :preview-row-span="previewRowSpan"
          :drag-item-id="dragItemId"
          @add-item="handleAddItem"
          @remove-item="handleRemoveItem"
          @start-move="handleStartMove"
          @start-resize="handleStartResize"
          @grid-mounted="handleGridMounted"
        />
      </div>

      <!-- Code Output — full width bottom, HTML & CSS side by side -->
      <div class="mt-5 animate-fade-up animate-delay-4">
        <CodeOutput :html="generatedHtml" :css="generatedCss" />
      </div>
    </div>
  </div>
</template>
