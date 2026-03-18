<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useEventListener } from '@vueuse/core'
const htmlToImage = () => import('html-to-image')
import { useSvgEditor } from './composables/use-svg-editor'
import type { SvgElement, ToolType } from './types'
import { getBBox } from './types'
import EditorHeader from './components/EditorHeader.vue'
import ToolBar from './components/ToolBar.vue'
import SvgCanvas from './components/SvgCanvas.vue'
import PropertiesPanel from './components/PropertiesPanel.vue'
import LayersPanel from './components/LayersPanel.vue'
import CodeModal from './components/CodeModal.vue'
import ImportModal from './components/ImportModal.vue'
import StatusBar from './components/StatusBar.vue'

const editor = useSvgEditor()
const {
  elements,
  gradients,
  selectedIds,
  selectedElement,
  activeTool,
  fillColor,
  strokeColor,
  strokeWidth,
  elementOpacity,
  fontSize,
  strokeDasharray,
  lineCap,
  lineJoin,
  zoom,
  panX,
  panY,
  grid,
  canUndo,
  canRedo,
  undo,
  redo,
  generateId,
  snapToGrid,
  addElement,
  deleteSelected,
  duplicateSelected,
  moveUp,
  moveDown,
  clearAll,
  updateSelected,
  commitUpdate,
  alignElements,
  groupSelected,
  ungroupSelected,
  toggleVisibility,
  toggleLock,
  exportSvg,
  importSvg,
  importImage,
  zoomIn,
  zoomOut,
  zoomFit,
} = editor

const canvasComp = ref<InstanceType<typeof SvgCanvas> | null>(null)
const importComp = ref<InstanceType<typeof ImportModal> | null>(null)
const isDrawing = ref(false)
const startPoint = ref({ x: 0, y: 0 })
const currentPoint = ref({ x: 0, y: 0 })
const pathPoints = ref<{ x: number; y: number }[]>([])
const polygonPoints = ref<{ x: number; y: number }[]>([])
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })
const showCode = ref(false)
const showImport = ref(false)

// --- Canvas coordinate helpers ---
function getSvgPoint(e: MouseEvent): { x: number; y: number } {
  const svg = canvasComp.value?.canvasRef
  if (!svg) return { x: 0, y: 0 }
  const rect = svg.getBoundingClientRect()
  const rawX = ((e.clientX - rect.left) / rect.width) * 800
  const rawY = ((e.clientY - rect.top) / rect.height) * 600

  let x = rawX
  let y = rawY

  // Shift constraint for straight lines or perfect shapes
  if (
    e.shiftKey &&
    (isDrawing.value || activeTool.value === 'polygon' || activeTool.value === 'path')
  ) {
    const fromX = startPoint.value.x
    const fromY = startPoint.value.y
    const dx = Math.abs(x - fromX)
    const dy = Math.abs(y - fromY)

    if (['line', 'path', 'polygon'].includes(activeTool.value)) {
      if (dx > dy) y = fromY
      else x = fromX
    } else if (['rect', 'circle', 'ellipse'].includes(activeTool.value)) {
      const size = Math.max(dx, dy)
      x = fromX + size * Math.sign(x - fromX)
      y = fromY + size * Math.sign(y - fromY)
    }
  }

  return { x: snapToGrid(Math.round(x)), y: snapToGrid(Math.round(y)) }
}

// --- Hit-test ---
function hitTest(pt: { x: number; y: number }, el: SvgElement): boolean {
  if (!el.visible || el.locked) return false
  const pad = 8
  const box = getBBox(el)
  return (
    pt.x >= box.x - pad &&
    pt.x <= box.x + box.w + pad &&
    pt.y >= box.y - pad &&
    pt.y <= box.y + box.h + pad
  )
}

function findAt(pt: { x: number; y: number }): SvgElement | null {
  for (let i = elements.value.length - 1; i >= 0; i--) {
    const el = elements.value[i]
    if (el && hitTest(pt, el)) return el
  }
  return null
}

// --- Mouse handlers ---
function handleMouseDown(e: MouseEvent) {
  const pt = getSvgPoint(e)
  startPoint.value = pt
  currentPoint.value = pt

  if (activeTool.value === 'select') {
    const hitEl = findAt(pt)
    if (hitEl) {
      if (e.shiftKey) {
        const newSet = new Set(selectedIds.value)
        if (newSet.has(hitEl.id)) newSet.delete(hitEl.id)
        else newSet.add(hitEl.id)
        selectedIds.value = newSet
      } else {
        if (!selectedIds.value.has(hitEl.id)) {
          selectedIds.value = new Set([hitEl.id])
        }
        isDragging.value = true
        const box = getBBox(hitEl)
        dragOffset.value = { x: pt.x - box.x, y: pt.y - box.y }
      }
    } else {
      selectedIds.value = new Set()
    }
    return
  }

  if (activeTool.value === 'polygon') {
    polygonPoints.value.push(pt)
    return
  }

  if (activeTool.value === 'text') {
    addElement(
      editor.createDefaultElement({
        id: generateId(),
        type: 'text',
        fill: fillColor.value,
        stroke: 'none',
        strokeWidth: 0,
        opacity: elementOpacity.value,
        x: pt.x,
        y: pt.y,
        text: 'Text',
        fontSize: fontSize.value,
        fontFamily: 'sans-serif',
      }),
    )
    activeTool.value = 'select'
    return
  }

  isDrawing.value = true
  if (activeTool.value === 'path') pathPoints.value = [pt]
}

function handleMouseMove(e: MouseEvent) {
  const pt = getSvgPoint(e)
  currentPoint.value = pt

  if (isDragging.value && selectedElement.value) {
    const el = selectedElement.value
    if (el.locked) return
    const nx = pt.x - dragOffset.value.x
    const ny = pt.y - dragOffset.value.y
    if (el.type === 'rect' || el.type === 'text' || el.type === 'image')
      updateSelected({ x: nx, y: ny })
    else if (el.type === 'circle' || el.type === 'ellipse') {
      const box = getBBox(el)
      updateSelected({ cx: nx + box.w / 2, cy: ny + box.h / 2 })
    } else if (el.type === 'line') {
      const dx = nx - (el.x1 ?? 0)
      const dy = ny - (el.y1 ?? 0)
      updateSelected({ x1: nx, y1: ny, x2: (el.x2 ?? 0) + dx, y2: (el.y2 ?? 0) + dy })
    }
    return
  }

  if (!isDrawing.value) return
  if (activeTool.value === 'path') {
    const last = pathPoints.value[pathPoints.value.length - 1]
    if (!last || Math.abs(pt.x - last.x) > 2 || Math.abs(pt.y - last.y) > 2) {
      pathPoints.value.push(pt)
    }
  }
}

function handleMouseUp() {
  if (isDragging.value) {
    isDragging.value = false
    commitUpdate('Di chuyển')
    return
  }
  if (!isDrawing.value) return
  isDrawing.value = false

  const s = startPoint.value
  const c = currentPoint.value
  const minSize = 5
  const base = {
    strokeDasharray: strokeDasharray.value,
    lineCap: lineCap.value,
    lineJoin: lineJoin.value,
  }

  if (activeTool.value === 'rect') {
    const w = Math.abs(c.x - s.x)
    const h = Math.abs(c.y - s.y)
    if (w < minSize && h < minSize) return
    addElement(
      editor.createDefaultElement({
        ...base,
        id: generateId(),
        type: 'rect',
        fill: fillColor.value,
        stroke: strokeColor.value,
        strokeWidth: strokeWidth.value,
        opacity: elementOpacity.value,
        x: Math.min(s.x, c.x),
        y: Math.min(s.y, c.y),
        width: w,
        height: h,
      }),
    )
  } else if (activeTool.value === 'circle') {
    const r = Math.round(Math.sqrt((c.x - s.x) ** 2 + (c.y - s.y) ** 2))
    if (r < minSize) return
    addElement(
      editor.createDefaultElement({
        ...base,
        id: generateId(),
        type: 'circle',
        fill: fillColor.value,
        stroke: strokeColor.value,
        strokeWidth: strokeWidth.value,
        opacity: elementOpacity.value,
        cx: s.x,
        cy: s.y,
        r,
      }),
    )
  } else if (activeTool.value === 'ellipse') {
    const rx = Math.abs(c.x - s.x)
    const ry = Math.abs(c.y - s.y)
    if (rx < minSize && ry < minSize) return
    addElement(
      editor.createDefaultElement({
        ...base,
        id: generateId(),
        type: 'ellipse',
        fill: fillColor.value,
        stroke: strokeColor.value,
        strokeWidth: strokeWidth.value,
        opacity: elementOpacity.value,
        cx: s.x,
        cy: s.y,
        rx,
        ry,
      }),
    )
  } else if (activeTool.value === 'line') {
    if (Math.abs(c.x - s.x) < minSize && Math.abs(c.y - s.y) < minSize) return
    addElement(
      editor.createDefaultElement({
        ...base,
        id: generateId(),
        type: 'line',
        fill: 'none',
        stroke: strokeColor.value,
        strokeWidth: strokeWidth.value,
        opacity: elementOpacity.value,
        x1: s.x,
        y1: s.y,
        x2: c.x,
        y2: c.y,
      }),
    )
  } else if (activeTool.value === 'path') {
    if (pathPoints.value.length < 2) return
    const pts = pathPoints.value
    let d = `M${pts[0]!.x},${pts[0]!.y}`

    if (pts.length === 2) {
      d += ` L${pts[1]!.x},${pts[1]!.y}`
    } else {
      // Smoothing using Quadratic Bezier (Midpoint algorithm)
      for (let i = 1; i < pts.length - 1; i++) {
        const p1 = pts[i]!
        const p2 = pts[i + 1]!
        const xc = (p1.x + p2.x) / 2
        const yc = (p1.y + p2.y) / 2
        d += ` Q${p1.x},${p1.y} ${xc},${yc}`
      }
      const lastPt = pts[pts.length - 1]!
      d += ` L${lastPt.x},${lastPt.y}`
    }

    addElement(
      editor.createDefaultElement({
        ...base,
        id: generateId(),
        type: 'path',
        fill: 'none',
        stroke: strokeColor.value,
        strokeWidth: strokeWidth.value,
        opacity: elementOpacity.value,
        d,
      }),
    )
    pathPoints.value = []
  }
}

function finishPolygon() {
  if (polygonPoints.value.length < 3) return
  const pts = polygonPoints.value.map((p) => `${p.x},${p.y}`).join(' ')
  addElement(
    editor.createDefaultElement({
      id: generateId(),
      type: 'polygon',
      fill: fillColor.value,
      stroke: strokeColor.value,
      strokeWidth: strokeWidth.value,
      opacity: elementOpacity.value,
      points: pts,
      strokeDasharray: strokeDasharray.value,
      lineCap: lineCap.value,
      lineJoin: lineJoin.value,
    }),
  )
  polygonPoints.value = []
}

// --- Property updates ---
function onPropUpdate(key: string, value: string | number) {
  updateSelected({ [key]: value })
  nextTick(() => commitUpdate('Cập nhật thuộc tính'))
}

function onRotate(deg: number) {
  updateSelected({ rotation: deg })
  nextTick(() => commitUpdate('Xoay'))
}

// --- Layer select ---
function selectLayer(id: string) {
  selectedIds.value = new Set([id])
  activeTool.value = 'select'
}

// --- Downloads ---
function downloadSvg() {
  const blob = new Blob([exportSvg()], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'drawing.svg'
  a.click()
  URL.revokeObjectURL(url)
}

async function downloadPng() {
  const svg = canvasComp.value?.canvasRef
  if (!svg) return
  try {
    const { toPng } = await htmlToImage()
    const dataUrl = await toPng(svg as unknown as HTMLElement, { pixelRatio: 2 })
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = 'drawing.png'
    a.click()
  } catch {
    const { toJpeg } = await htmlToImage()
    const dataUrl = await toJpeg(svg as unknown as HTMLElement, { quality: 0.95 })
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = 'drawing.jpg'
    a.click()
  }
}

// --- Import functions ---
function handleImportSvg(code: string) {
  const ok = importSvg(code)
  if (ok) {
    showImport.value = false
  } else {
    importComp.value?.setError('Không thể đọc mã SVG. Kiểm tra lại định dạng.')
  }
}

function handleImportImage(file: File) {
  importImage(file)
  showImport.value = false
}

function handleCodeApply(code: string) {
  if (importSvg(code)) showCode.value = false
}

// --- Grid toggles ---
function handleToggleGrid() {
  grid.value = { ...grid.value, enabled: !grid.value.enabled }
}
function handleToggleSnap() {
  grid.value = { ...grid.value, snap: !grid.value.snap }
}

// --- Keyboard shortcuts ---
useEventListener('keydown', (e: KeyboardEvent) => {
  const tag = (e.target as HTMLElement).tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
  if (e.key === 'Delete' || e.key === 'Backspace') {
    e.preventDefault()
    deleteSelected()
  }
  if (e.key === 'z' && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
    e.preventDefault()
    undo()
  }
  if (e.key === 'z' && (e.metaKey || e.ctrlKey) && e.shiftKey) {
    e.preventDefault()
    redo()
  }
  if (e.key === 'y' && (e.metaKey || e.ctrlKey)) {
    e.preventDefault()
    redo()
  }
  if (e.key === 'd' && (e.metaKey || e.ctrlKey)) {
    e.preventDefault()
    duplicateSelected()
  }
  if (e.key === 'g' && (e.metaKey || e.ctrlKey)) {
    e.preventDefault()
    groupSelected()
  }
  if (e.key === '=' && (e.metaKey || e.ctrlKey)) {
    e.preventDefault()
    zoomIn()
  }
  if (e.key === '-' && (e.metaKey || e.ctrlKey)) {
    e.preventDefault()
    zoomOut()
  }
  if (e.key === '0' && (e.metaKey || e.ctrlKey)) {
    e.preventDefault()
    zoomFit()
  }
  if (e.key === '[') {
    strokeWidth.value = Math.max(0.5, strokeWidth.value - 0.5)
  }
  if (e.key === ']') {
    strokeWidth.value = Math.min(100, strokeWidth.value + 0.5)
  }
  if (e.key === 'Escape') {
    if (showCode.value) {
      showCode.value = false
      return
    }
    if (showImport.value) {
      showImport.value = false
      return
    }
    selectedIds.value = new Set()
    if (polygonPoints.value.length > 0) finishPolygon()
  }
  if (e.metaKey || e.ctrlKey) return
  const toolMap: Record<string, ToolType> = {
    v: 'select',
    r: 'rect',
    c: 'circle',
    e: 'ellipse',
    l: 'line',
    p: 'path',
    g: 'polygon',
    t: 'text',
  }
  if (toolMap[e.key]) activeTool.value = toolMap[e.key]!
})

// --- Zoom wheel ---
useEventListener(
  'wheel',
  (e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      if (e.deltaY < 0) zoomIn()
      else zoomOut()
    }
  },
  { passive: false },
)

watch(activeTool, () => {
  if (activeTool.value !== 'select') selectedIds.value = new Set()
  if (activeTool.value !== 'polygon') {
    if (polygonPoints.value.length >= 3) finishPolygon()
    else polygonPoints.value = []
  }
})
</script>

<template>
  <div class="h-screen bg-bg-deep text-text-primary font-body flex flex-col overflow-hidden">
    <EditorHeader
      :can-undo="canUndo"
      :can-redo="canRedo"
      :zoom="zoom"
      @undo="undo"
      @redo="redo"
      @zoom-in="zoomIn"
      @zoom-out="zoomOut"
      @zoom-fit="zoomFit"
      @show-import="showImport = true"
      @show-code="showCode = true"
      @download="downloadSvg"
      @export-png="downloadPng"
      @clear-all="clearAll"
    />

    <div class="flex flex-1 overflow-hidden animate-fade-up animate-delay-1">
      <ToolBar
        :active-tool="activeTool"
        :fill-color="fillColor"
        :stroke-color="strokeColor"
        :stroke-width="strokeWidth"
        :stroke-dasharray="strokeDasharray"
        :line-cap="lineCap"
        :line-join="lineJoin"
        :grid="grid"
        @update:active-tool="activeTool = $event"
        @update:fill-color="fillColor = $event"
        @update:stroke-color="strokeColor = $event"
        @update:stroke-width="strokeWidth = $event"
        @update:stroke-dasharray="strokeDasharray = $event"
        @update:line-cap="lineCap = $event"
        @update:line-join="lineJoin = $event"
        @toggle-grid="handleToggleGrid"
        @toggle-snap="handleToggleSnap"
      />

      <SvgCanvas
        ref="canvasComp"
        :elements="elements"
        :selected-ids="selectedIds"
        :active-tool="activeTool"
        :fill-color="fillColor"
        :stroke-color="strokeColor"
        :stroke-width="strokeWidth"
        :zoom="zoom"
        :pan-x="panX"
        :pan-y="panY"
        :grid="grid"
        :is-drawing="isDrawing"
        :start-point="startPoint"
        :current-point="currentPoint"
        :path-points="pathPoints"
        :polygon-points="polygonPoints"
        :gradients="gradients"
        @mousedown="handleMouseDown"
        @mousemove="handleMouseMove"
        @mouseup="handleMouseUp"
      />

      <aside
        class="w-[240px] border-l border-border-default bg-bg-surface shrink-0 hidden lg:flex flex-col overflow-hidden"
      >
        <div class="shrink-0 overflow-y-auto max-h-[45vh]">
          <PropertiesPanel
            :selected-element="selectedElement"
            :selected-count="selectedIds.size"
            @update-prop="onPropUpdate"
            @duplicate="duplicateSelected"
            @move-up="moveUp"
            @move-down="moveDown"
            @delete="deleteSelected"
            @group="groupSelected"
            @ungroup="ungroupSelected"
            @align="alignElements"
            @rotate="onRotate"
          />
        </div>
        <LayersPanel
          class="flex-1 min-h-0"
          :elements="elements"
          :selected-ids="selectedIds"
          @select="selectLayer"
          @toggle-visibility="toggleVisibility"
          @toggle-lock="toggleLock"
        />
      </aside>
    </div>

    <Teleport to="body">
      <CodeModal
        v-if="showCode"
        :svg-code="exportSvg()"
        @close="showCode = false"
        @apply="handleCodeApply"
      />
      <ImportModal
        v-if="showImport"
        ref="importComp"
        @close="showImport = false"
        @import="handleImportSvg"
        @import-image="handleImportImage"
      />
    </Teleport>

    <StatusBar :active-tool="activeTool" :element-count="elements.length" :zoom="zoom" />
  </div>
</template>
