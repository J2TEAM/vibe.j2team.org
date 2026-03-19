<template>
  <div class="grapher" :class="theme">
    <header class="header">
      <a href="/" class="back-link">← Trang chủ</a>
      <h1 class="title">Đồ Thị Toán Học</h1>
      <button class="theme-toggle" @click="toggleTheme">
        <span v-if="theme === 'dark'">☀️</span><span v-else>🌙</span>
      </button>
      <span class="author">by deku</span>
    </header>

    <div class="workspace">
      <!-- Mobile backdrop -->
      <div v-if="sidebarOpen" class="sidebar-backdrop" @click="sidebarOpen = false" />

      <aside class="sidebar" :class="{ 'sidebar-open': sidebarOpen }">
        <!-- Function list -->
        <div class="fn-list">
          <div
            v-for="(fn, i) in functions"
            :key="fn.id"
            class="fn-item"
            :class="{ 'fn-active': activeIdx === i, error: !!fn.error, disabled: !fn.enabled }"
            @click="selectFn(i)"
          >
            <button
              class="color-dot"
              :style="{ background: fn.color }"
              @click.stop="toggleEnabled(i)"
            />
            <div class="fn-expr-display">
              <template v-if="activeIdx === i">
                <span class="expr-text">{{ fn.expr.slice(0, cursorPos) }}</span>
                <span class="fn-caret" />
                <span class="expr-text">{{ fn.expr.slice(cursorPos) }}</span>
              </template>
              <span v-else class="expr-text muted">{{ fn.expr || 'Nhập hàm số…' }}</span>
            </div>
            <span v-if="fn.error" class="fn-error-icon" :title="fn.error">!</span>
            <button class="fn-remove" @click.stop="removeFn(i)">×</button>
          </div>
        </div>

        <!-- Hidden real input for paste support -->
        <input
          ref="hiddenInput"
          class="hidden-input"
          v-model="activeExpr"
          @input="onHiddenInput"
          @paste="onPaste"
          @keydown="onKeyDown"
          @focus="hiddenFocused = true"
          @blur="hiddenFocused = false"
          spellcheck="false"
          autocomplete="off"
        />

        <button class="add-btn" @click="addFn">+ Thêm hàm số</button>

        <!-- Virtual Keyboard -->
        <div class="vkb">
          <div class="vkb-header">
            <span class="vkb-title">Bàn phím toán học</span>
          </div>

          <div class="vkb-tabs">
            <button
              v-for="tab in kbTabs"
              :key="tab.id"
              class="vkb-tab"
              :class="{ active: activeTab === tab.id }"
              @click="activeTab = tab.id"
            >
              {{ tab.label }}
            </button>
          </div>

          <div class="vkb-grid">
            <button
              v-for="key in currentTabKeys"
              :key="key.label"
              class="vkb-btn"
              :class="key.cls"
              @click="insertKey(key)"
            >
              {{ key.label }}
            </button>
          </div>

          <div class="vkb-actions">
            <button class="vkb-btn vkb-del" @click="deleteChar">⌫</button>
            <button class="vkb-clear vkb-btn" @click="clearExpr">CLR</button>
            <button class="vkb-btn vkb-nav" @click="moveCursor(-1)">◀</button>
            <button class="vkb-btn vkb-nav" @click="moveCursor(1)">▶</button>
          </div>

          <!-- Preview -->
          <div class="vkb-preview" v-if="functions[activeIdx]">
            <span class="preview-label">f =</span>
            <span class="preview-body">
              <span class="expr-text">{{ functions[activeIdx].expr.slice(0, cursorPos) }}</span>
              <span class="fn-caret" />
              <span class="expr-text">{{ functions[activeIdx].expr.slice(cursorPos) }}</span>
            </span>
          </div>
        </div>

        <div class="divider" />

        <div class="controls">
          <label>X min<input v-model.number="view.xMin" type="number" @change="render()" /></label>
          <label>X max<input v-model.number="view.xMax" type="number" @change="render()" /></label>
          <label>Y min<input v-model.number="view.yMin" type="number" @change="render()" /></label>
          <label>Y max<input v-model.number="view.yMax" type="number" @change="render()" /></label>
          <button class="reset-btn" @click="resetView">↺ Reset</button>
        </div>

        <div class="divider" />
        <div class="hints">
          <p><strong>Hàm số:</strong> sin(x), x^2, sqrt(x)</p>
          <p><strong>Ẩn:</strong> x^2+y^2=1 (vòng tròn)</p>
          <p><strong>Trái tim:</strong> (x^2+y^2-1)^3-x^2*y^3=0</p>
        </div>
      </aside>

      <div class="canvas-area">
        <button class="sidebar-toggle" @click="sidebarOpen = !sidebarOpen">
          {{ sidebarOpen ? '✕ Đóng' : '⚙ Hàm số' }}
        </button>
        <div class="canvas-wrap" ref="canvasWrap">
          <canvas
            ref="canvas"
            @wheel.prevent="onWheel"
            @mousedown="onMouseDown"
            @mousemove="onMouseMove"
            @mouseup="onMouseUp"
            @mouseleave="onMouseUp"
            @touchstart.prevent="onTouchStart"
            @touchmove.prevent="onTouchMove"
            @touchend="onTouchEnd"
          />
          <div class="canvas-hint">Cuộn để zoom · Kéo để di chuyển</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'

interface FnItem {
  id: number
  expr: string
  color: string
  enabled: boolean
  error: string
}
interface VKey {
  label: string
  insert: string
  cls?: string
  moveBefore?: number
}

const COLORS = [
  '#e05252',
  '#4f9ef8',
  '#3ecf8e',
  '#f7a84a',
  '#b06ef7',
  '#f74ab0',
  '#50c8c8',
  '#f7e24a',
]
let idCounter = 0

const kbTabs = [
  { id: 'basic', label: 'Cơ bản' },
  { id: 'trig', label: 'Lượng giác' },
  { id: 'misc', label: 'Khác' },
]

const KB: Record<string, VKey[]> = {
  basic: [
    { label: 'x', insert: 'x', cls: 'vkb-var' },
    { label: 'y', insert: 'y', cls: 'vkb-var' },
    { label: '7', insert: '7' },
    { label: '8', insert: '8' },
    { label: '9', insert: '9' },
    { label: '4', insert: '4' },
    { label: '5', insert: '5' },
    { label: '6', insert: '6' },
    { label: '1', insert: '1' },
    { label: '2', insert: '2' },
    { label: '3', insert: '3' },
    { label: '0', insert: '0' },
    { label: '.', insert: '.' },
    { label: '+', insert: '+' },
    { label: '−', insert: '-' },
    { label: '×', insert: '*' },
    { label: '÷', insert: '/' },
    { label: '^', insert: '^' },
    { label: '=', insert: '=' },
    { label: '(', insert: '(' },
    { label: ')', insert: ')' },
    { label: 'π', insert: 'pi', cls: 'vkb-fn' },
    { label: 'e', insert: 'e', cls: 'vkb-fn' },
  ],
  trig: [
    { label: 'sin', insert: 'sin()', cls: 'vkb-fn', moveBefore: 1 },
    { label: 'cos', insert: 'cos()', cls: 'vkb-fn', moveBefore: 1 },
    { label: 'tan', insert: 'tan()', cls: 'vkb-fn', moveBefore: 1 },
    { label: 'asin', insert: 'asin()', cls: 'vkb-fn', moveBefore: 1 },
    { label: 'acos', insert: 'acos()', cls: 'vkb-fn', moveBefore: 1 },
    { label: 'atan', insert: 'atan()', cls: 'vkb-fn', moveBefore: 1 },
    { label: 'sinh', insert: 'sinh()', cls: 'vkb-fn', moveBefore: 1 },
    { label: 'cosh', insert: 'cosh()', cls: 'vkb-fn', moveBefore: 1 },
    { label: 'tanh', insert: 'tanh()', cls: 'vkb-fn', moveBefore: 1 },
    { label: 'atan2', insert: 'atan2(,)', cls: 'vkb-fn', moveBefore: 2 },
  ],
  misc: [
    { label: '√', insert: 'sqrt()', cls: 'vkb-fn', moveBefore: 1 },
    { label: '|x|', insert: 'abs()', cls: 'vkb-fn', moveBefore: 1 },
    { label: 'exp', insert: 'exp()', cls: 'vkb-fn', moveBefore: 1 },
    { label: 'log', insert: 'log()', cls: 'vkb-fn', moveBefore: 1 },
    { label: 'log2', insert: 'log2()', cls: 'vkb-fn', moveBefore: 1 },
    { label: 'floor', insert: 'floor()', cls: 'vkb-fn', moveBefore: 1 },
    { label: 'ceil', insert: 'ceil()', cls: 'vkb-fn', moveBefore: 1 },
    { label: 'round', insert: 'round()', cls: 'vkb-fn', moveBefore: 1 },
    { label: 'min', insert: 'min(,)', cls: 'vkb-fn', moveBefore: 2 },
    { label: 'max', insert: 'max(,)', cls: 'vkb-fn', moveBefore: 2 },
    { label: '<', insert: '<' },
    { label: '>', insert: '>' },
    { label: '≤', insert: '<=' },
    { label: '≥', insert: '>=' },
  ],
}

const theme = ref<'dark' | 'light'>('dark')
const sidebarOpen = ref(false)
const activeTab = ref('basic')
const activeIdx = ref(0)
const cursorPos = ref(0)
const hiddenFocused = ref(false)

const canvas = ref<HTMLCanvasElement | null>(null)
const canvasWrap = ref<HTMLDivElement | null>(null)
const hiddenInput = ref<HTMLInputElement | null>(null)

const functions = reactive<FnItem[]>([
  { id: idCounter++, expr: 'sin(x)', color: COLORS[0], enabled: true, error: '' },
  { id: idCounter++, expr: '(x^2+y^2-1)^3-x^2*y^3=0', color: COLORS[4], enabled: true, error: '' },
])

const view = reactive({ xMin: -3, xMax: 3, yMin: -2, yMax: 2 })
const DEFAULT_VIEW = { xMin: -3, xMax: 3, yMin: -2, yMax: 2 }

let dragging = false
let dragStart = { x: 0, y: 0 }
let dragView = { xMin: 0, xMax: 0, yMin: 0, yMax: 0 }
let lastTouchDist = 0
let renderTimer: ReturnType<typeof setTimeout> | null = null
let resizeObserver: ResizeObserver | null = null

const currentTabKeys = computed(() => KB[activeTab.value] ?? [])

const activeExpr = computed({
  get: () => functions[activeIdx.value]?.expr ?? '',
  set: (val: string) => {
    if (functions[activeIdx.value]) functions[activeIdx.value].expr = val
  },
})

const colors = computed(() =>
  theme.value === 'dark'
    ? { bg: '#0f1117', grid: '#1e2130', axis: '#3a4060', label: '#4a5068' }
    : { bg: '#f0f4ff', grid: '#dde2f0', axis: '#a0b0d0', label: '#8090b0' },
)

type CompiledFn = (x: number, y?: number) => number
function compileExpr(raw: string): { mode: 'explicit' | 'implicit'; fn: CompiledFn } {
  const expr = raw
    .trim()
    .replace(/\^/g, '**')
    .replace(/\bsin\b/g, 'Math.sin')
    .replace(/\bcos\b/g, 'Math.cos')
    .replace(/\btan\b/g, 'Math.tan')
    .replace(/\basin\b/g, 'Math.asin')
    .replace(/\bacos\b/g, 'Math.acos')
    .replace(/\batan2\b/g, 'Math.atan2')
    .replace(/\batan\b/g, 'Math.atan')
    .replace(/\bsinh\b/g, 'Math.sinh')
    .replace(/\bcosh\b/g, 'Math.cosh')
    .replace(/\btanh\b/g, 'Math.tanh')
    .replace(/\bsqrt\b/g, 'Math.sqrt')
    .replace(/\babs\b/g, 'Math.abs')
    .replace(/\bexp\b/g, 'Math.exp')
    .replace(/\blog2\b/g, 'Math.log2')
    .replace(/\blog\b/g, 'Math.log')
    .replace(/\bln\b/g, 'Math.log')
    .replace(/\bfloor\b/g, 'Math.floor')
    .replace(/\bceil\b/g, 'Math.ceil')
    .replace(/\bround\b/g, 'Math.round')
    .replace(/\bmin\b/g, 'Math.min')
    .replace(/\bmax\b/g, 'Math.max')
    .replace(/\bpi\b/g, 'Math.PI')

  const eqIdx = expr.indexOf('=')
  if (eqIdx !== -1) {
    const lhs = expr.slice(0, eqIdx).trim()
    const rhs = expr.slice(eqIdx + 1).trim()
    if (lhs === 'y') {
       
      return {
        mode: 'explicit',
        fn: new Function('x', `"use strict"; return (${rhs})`) as CompiledFn,
      }
    }
     
    return {
      mode: 'implicit',
      fn: new Function('x', 'y', `"use strict"; return ((${lhs}) - (${rhs}))`) as CompiledFn,
    }
  }
   
  return {
    mode: 'explicit',
    fn: new Function('x', `"use strict"; return (${expr})`) as CompiledFn,
  }
}

function toCanvasX(x: number, w: number) {
  return ((x - view.xMin) / (view.xMax - view.xMin)) * w
}
function toCanvasY(y: number, h: number) {
  return h - ((y - view.yMin) / (view.yMax - view.yMin)) * h
}
function toWorldX(cx: number, w: number) {
  return view.xMin + (cx / w) * (view.xMax - view.xMin)
}
function toWorldY(cy: number, h: number) {
  return view.yMin + ((h - cy) / h) * (view.yMax - view.yMin)
}

function render() {
  const cvs = canvas.value
  if (!cvs) return
  const ctx = cvs.getContext('2d')!
  const w = cvs.width,
    h = cvs.height,
    c = colors.value
  ctx.fillStyle = c.bg
  ctx.fillRect(0, 0, w, h)
  drawGrid(ctx, w, h, c)
  drawAxes(ctx, w, h, c)
  for (const fn of functions) {
    if (!fn.enabled || !fn.expr.trim()) continue
    fn.error = ''
    try {
      const compiled = compileExpr(fn.expr)
      if (compiled.mode === 'explicit') drawExplicit(ctx, w, h, compiled.fn, fn.color)
      else drawImplicit(ctx, w, h, compiled.fn as (x: number, y: number) => number, fn.color)
    } catch (e: unknown) {
      fn.error = e instanceof Error ? e.message : String(e)
    }
  }
}

function niceStep(minStep: number) {
  const mag = Math.pow(10, Math.floor(Math.log10(minStep)))
  for (const c of [1, 2, 2.5, 5, 10]) if (c * mag >= minStep) return c * mag
  return 10 * mag
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  c: { bg: string; grid: string; axis: string; label: string },
) {
  // Derive ONE step from X axis so units are identical on both axes → square cells
  const pxPerUnit = w / (view.xMax - view.xMin)
  const step = niceStep(60 / pxPerUnit) // aim for ~60-150px between grid lines

  ctx.strokeStyle = c.grid
  ctx.lineWidth = 1
  for (let x = Math.ceil(view.xMin / step) * step; x <= view.xMax + step * 0.01; x += step) {
    ctx.beginPath()
    ctx.moveTo(toCanvasX(x, w), 0)
    ctx.lineTo(toCanvasX(x, w), h)
    ctx.stroke()
  }
  for (let y = Math.ceil(view.yMin / step) * step; y <= view.yMax + step * 0.01; y += step) {
    ctx.beginPath()
    ctx.moveTo(0, toCanvasY(y, h))
    ctx.lineTo(w, toCanvasY(y, h))
    ctx.stroke()
  }
  ctx.fillStyle = c.label
  ctx.font = '11px monospace'
  const axisY = Math.min(Math.max(toCanvasY(0, h), 2), h - 14)
  const axisX = Math.min(Math.max(toCanvasX(0, w), 4), w - 4)
  ctx.textAlign = 'center'
  for (let x = Math.ceil(view.xMin / step) * step; x <= view.xMax + step * 0.01; x += step) {
    if (Math.abs(x) < step * 0.01) continue
    ctx.fillText(String(Math.round(x / step) * step), toCanvasX(x, w), axisY + 12)
  }
  ctx.textAlign = 'right'
  for (let y = Math.ceil(view.yMin / step) * step; y <= view.yMax + step * 0.01; y += step) {
    if (Math.abs(y) < step * 0.01) continue
    ctx.fillText(String(Math.round(y / step) * step), axisX - 4, toCanvasY(y, h) + 4)
  }
}

function drawAxes(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  c: { bg: string; grid: string; axis: string; label: string },
) {
  ctx.strokeStyle = c.axis
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(0, toCanvasY(0, h))
  ctx.lineTo(w, toCanvasY(0, h))
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(toCanvasX(0, w), 0)
  ctx.lineTo(toCanvasX(0, w), h)
  ctx.stroke()
}

function drawExplicit(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  fn: (x: number) => number,
  color: string,
) {
  const steps = w * 2
  ctx.beginPath()
  ctx.strokeStyle = color
  ctx.lineWidth = 2.2
  ctx.lineJoin = 'round'
  let penDown = false,
    prevY = 0
  for (let i = 0; i <= steps; i++) {
    const x = view.xMin + (i / steps) * (view.xMax - view.xMin)
    let y: number
    try {
      y = fn(x)
    } catch {
      penDown = false
      continue
    }
    if (!isFinite(y) || isNaN(y)) {
      penDown = false
      continue
    }
    if (penDown && Math.abs(y - prevY) > (view.yMax - view.yMin) * 3) penDown = false
    const cx = toCanvasX(x, w),
      cy = toCanvasY(y, h)
    if (penDown) {
      ctx.lineTo(cx, cy)
    } else {
      ctx.moveTo(cx, cy)
    }
    penDown = true
    prevY = y
  }
  ctx.stroke()
}

function drawImplicit(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  fn: (x: number, y: number) => number,
  color: string,
) {
  const CELL = 4
  const cols = Math.ceil(w / CELL),
    rows = Math.ceil(h / CELL)
  const vals: number[][] = []
  for (let row = 0; row <= rows; row++) {
    vals[row] = []
    for (let col = 0; col <= cols; col++) {
      try {
        vals[row][col] = fn(toWorldX(col * CELL, w), toWorldY(row * CELL, h))
      } catch {
        vals[row][col] = NaN
      }
    }
  }
  ctx.beginPath()
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const v00 = vals[row][col],
        v10 = vals[row][col + 1],
        v01 = vals[row + 1][col],
        v11 = vals[row + 1][col + 1]
      if ([v00, v10, v01, v11].some((v) => isNaN(v) || !isFinite(v))) continue
      const interp = (a: number, b: number, pa: number[], pb: number[]) => {
        const t = a / (a - b)
        return [pa[0] + t * (pb[0] - pa[0]), pa[1] + t * (pb[1] - pa[1])]
      }
      const corners = [
        { v: v00, p: [col * CELL, row * CELL] },
        { v: v10, p: [(col + 1) * CELL, row * CELL] },
        { v: v11, p: [(col + 1) * CELL, (row + 1) * CELL] },
        { v: v01, p: [col * CELL, (row + 1) * CELL] },
      ]
      const crossings: number[][] = []
      for (let k = 0; k < 4; k++) {
        const a = corners[k],
          b = corners[(k + 1) % 4]
        if (a.v >= 0 !== b.v >= 0) crossings.push(interp(a.v, b.v, a.p, b.p))
      }
      if (crossings.length >= 2) {
        ctx.moveTo(crossings[0][0], crossings[0][1])
        ctx.lineTo(crossings[1][0], crossings[1][1])
      }
    }
  }
  ctx.stroke()
}

function clampCursor() {
  const fn = functions[activeIdx.value]
  if (fn) cursorPos.value = Math.max(0, Math.min(fn.expr.length, cursorPos.value))
}

function insertKey(key: VKey) {
  const fn = functions[activeIdx.value]
  if (!fn) return
  clampCursor()
  const p = cursorPos.value
  fn.expr = fn.expr.slice(0, p) + key.insert + fn.expr.slice(p)
  cursorPos.value = p + key.insert.length - (key.moveBefore ?? 0)
  scheduleRender()
}

function deleteChar() {
  const fn = functions[activeIdx.value]
  if (!fn || cursorPos.value === 0) return
  clampCursor()
  fn.expr = fn.expr.slice(0, cursorPos.value - 1) + fn.expr.slice(cursorPos.value)
  cursorPos.value--
  scheduleRender()
}

function clearExpr() {
  const fn = functions[activeIdx.value]
  if (!fn) return
  fn.expr = ''
  cursorPos.value = 0
  scheduleRender()
}

function moveCursor(d: number) {
  const fn = functions[activeIdx.value]
  if (!fn) return
  cursorPos.value = Math.max(0, Math.min(fn.expr.length, cursorPos.value + d))
}

function selectFn(i: number) {
  activeIdx.value = i
  cursorPos.value = functions[i]?.expr.length ?? 0
  nextTick(() => hiddenInput.value?.focus())
}

function onHiddenInput() {
  const fn = functions[activeIdx.value]
  if (!fn) return
  const input = hiddenInput.value
  if (!input) return
  fn.expr = input.value
  cursorPos.value = input.selectionStart ?? fn.expr.length
  scheduleRender()
}

function onPaste(e: ClipboardEvent) {
  e.preventDefault()
  const text = e.clipboardData?.getData('text') ?? ''
  if (!text) return
  const fn = functions[activeIdx.value]
  if (!fn) return
  clampCursor()
  const p = cursorPos.value
  fn.expr = fn.expr.slice(0, p) + text + fn.expr.slice(p)
  cursorPos.value = p + text.length
  nextTick(() => {
    if (hiddenInput.value) hiddenInput.value.value = fn.expr
  })
  scheduleRender()
}

function onKeyDown(e: KeyboardEvent) {
  const fn = functions[activeIdx.value]
  if (!fn) return
  if (e.key === 'ArrowLeft') {
    e.preventDefault()
    moveCursor(-1)
  } else if (e.key === 'ArrowRight') {
    e.preventDefault()
    moveCursor(1)
  } else if (e.key === 'Backspace') {
    e.preventDefault()
    deleteChar()
  } else if (e.key === 'Delete') {
    e.preventDefault()
    clampCursor()
    fn.expr = fn.expr.slice(0, cursorPos.value) + fn.expr.slice(cursorPos.value + 1)
    scheduleRender()
  }
}

watch(activeIdx, () => {
  nextTick(() => {
    if (hiddenInput.value) hiddenInput.value.value = functions[activeIdx.value]?.expr ?? ''
  })
})

function addFn() {
  functions.push({
    id: idCounter++,
    expr: '',
    color: COLORS[functions.length % COLORS.length],
    enabled: true,
    error: '',
  })
  activeIdx.value = functions.length - 1
  cursorPos.value = 0
  nextTick(() => hiddenInput.value?.focus())
}

function removeFn(i: number) {
  functions.splice(i, 1)
  activeIdx.value = Math.max(0, Math.min(activeIdx.value, functions.length - 1))
  scheduleRender()
}

function toggleEnabled(i: number) {
  functions[i].enabled = !functions[i].enabled
  scheduleRender()
}
function resetView() {
  Object.assign(view, DEFAULT_VIEW)
  fitCanvas()
}
function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
  nextTick(render)
}

function onWheel(e: WheelEvent) {
  const cvs = canvas.value!
  const rect = cvs.getBoundingClientRect()
  const wx = toWorldX(e.clientX - rect.left, cvs.width)
  const wy = toWorldY(e.clientY - rect.top, cvs.height)
  const f = e.deltaY > 0 ? 1.12 : 1 / 1.12
  view.xMin = wx + (view.xMin - wx) * f
  view.xMax = wx + (view.xMax - wx) * f
  view.yMin = wy + (view.yMin - wy) * f
  view.yMax = wy + (view.yMax - wy) * f
  scheduleRender()
}

function onMouseDown(e: MouseEvent) {
  dragging = true
  dragStart = { x: e.clientX, y: e.clientY }
  dragView = { ...view }
}
function onMouseMove(e: MouseEvent) {
  if (!dragging) return
  const cvs = canvas.value!
  const dx = ((e.clientX - dragStart.x) / cvs.width) * (dragView.xMax - dragView.xMin)
  const dy = ((e.clientY - dragStart.y) / cvs.height) * (dragView.yMax - dragView.yMin)
  view.xMin = dragView.xMin - dx
  view.xMax = dragView.xMax - dx
  view.yMin = dragView.yMin + dy
  view.yMax = dragView.yMax + dy
  scheduleRender()
}
function onMouseUp() {
  dragging = false
}

function onTouchStart(e: TouchEvent) {
  if (e.touches.length === 1) {
    dragging = true
    dragStart = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    dragView = { ...view }
  } else if (e.touches.length === 2) lastTouchDist = getTouchDist(e)
}
function onTouchMove(e: TouchEvent) {
  const cvs = canvas.value!
  if (e.touches.length === 1 && dragging) {
    const dx = ((e.touches[0].clientX - dragStart.x) / cvs.width) * (dragView.xMax - dragView.xMin)
    const dy = ((e.touches[0].clientY - dragStart.y) / cvs.height) * (dragView.yMax - dragView.yMin)
    view.xMin = dragView.xMin - dx
    view.xMax = dragView.xMax - dx
    view.yMin = dragView.yMin + dy
    view.yMax = dragView.yMax + dy
    scheduleRender()
  } else if (e.touches.length === 2) {
    const dist = getTouchDist(e)
    const f = lastTouchDist / dist
    const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2
    const my = (e.touches[0].clientY + e.touches[1].clientY) / 2
    const wx = toWorldX(mx, cvs.width),
      wy = toWorldY(my, cvs.height)
    view.xMin = wx + (view.xMin - wx) * f
    view.xMax = wx + (view.xMax - wx) * f
    view.yMin = wy + (view.yMin - wy) * f
    view.yMax = wy + (view.yMax - wy) * f
    lastTouchDist = dist
    scheduleRender()
  }
}
function onTouchEnd() {
  dragging = false
}
function getTouchDist(e: TouchEvent) {
  const dx = e.touches[0].clientX - e.touches[1].clientX
  const dy = e.touches[0].clientY - e.touches[1].clientY
  return Math.sqrt(dx * dx + dy * dy)
}

function scheduleRender() {
  if (renderTimer) clearTimeout(renderTimer)
  renderTimer = setTimeout(render, 20)
}

function fitCanvas() {
  const cvs = canvas.value,
    wrap = canvasWrap.value
  if (!cvs || !wrap) return
  cvs.width = wrap.clientWidth
  cvs.height = wrap.clientHeight
  // Enforce square grid: Y range derived from X range and pixel dimensions
  const unitPx = cvs.width / (view.xMax - view.xMin)
  const yRange = cvs.height / unitPx
  const yMid = (view.yMin + view.yMax) / 2
  view.yMin = yMid - yRange / 2
  view.yMax = yMid + yRange / 2
  render()
}

onMounted(async () => {
  await nextTick()
  fitCanvas()
  resizeObserver = new ResizeObserver(fitCanvas)
  resizeObserver.observe(canvasWrap.value!)
  cursorPos.value = functions[0]?.expr.length ?? 0
  if (hiddenInput.value) hiddenInput.value.value = functions[0]?.expr ?? ''
})
onUnmounted(() => {
  resizeObserver?.disconnect()
  if (renderTimer) clearTimeout(renderTimer)
})
</script>

<style scoped>
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.grapher.dark {
  --bg: #0f1117;
  --surface: #13161f;
  --surface2: #1a1e2e;
  --border: #1e2130;
  --border2: #23273a;
  --text: #c8cde4;
  --text-title: #e8ecff;
  --text-muted: #4a5068;
  --accent: #4a9ef7;
  --accent-hover: #1e2438;
  --error: #e05252;
  --vkb-btn: #1a1e2e;
  --vkb-btn-hover: #232840;
  --vkb-fn: #1a2a3a;
  --vkb-fn-hover: #1e3456;
  --vkb-fn-text: #4a9ef7;
  --vkb-var: #1a2e1a;
  --vkb-var-text: #3ecf8e;
  --active-border: #4a9ef7;
}
.grapher.light {
  --bg: #f0f4ff;
  --surface: #ffffff;
  --surface2: #f4f6fb;
  --border: #dde2f0;
  --border2: #e8ecf8;
  --text: #2a3050;
  --text-title: #111827;
  --text-muted: #8090b0;
  --accent: #2563eb;
  --accent-hover: #eff3ff;
  --error: #dc2626;
  --vkb-btn: #e8ecf8;
  --vkb-btn-hover: #dce3f5;
  --vkb-fn: #dbeafe;
  --vkb-fn-hover: #bfdbfe;
  --vkb-fn-text: #1d4ed8;
  --vkb-var: #dcfce7;
  --vkb-var-text: #15803d;
  --active-border: #2563eb;
}

.grapher {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  background: var(--bg);
  color: var(--text);
  font-family: 'Fira Code', 'Cascadia Code', 'Menlo', monospace;
  overflow: hidden;
  transition:
    background 0.2s,
    color 0.2s;
}

.header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.back-link {
  color: var(--accent);
  text-decoration: none;
  font-size: 13px;
  opacity: 0.8;
  transition: opacity 0.15s;
  white-space: nowrap;
}
.back-link:hover {
  opacity: 1;
}
.title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-title);
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.theme-toggle {
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 8px;
  width: 34px;
  height: 34px;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}
.theme-toggle:hover {
  background: var(--accent-hover);
}
.author {
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
}

.workspace {
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
}

/* Backdrop for mobile */
.sidebar-backdrop {
  display: none;
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 15;
}

.sidebar {
  width: 260px;
  flex-shrink: 0;
  background: var(--surface);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 12px 10px;
  gap: 0;
  transition: background 0.2s;
}

.fn-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.fn-item {
  display: flex;
  align-items: center;
  gap: 7px;
  background: var(--surface2);
  border: 1.5px solid var(--border2);
  border-radius: 8px;
  padding: 7px 8px;
  cursor: pointer;
  transition: border-color 0.15s;
  min-height: 36px;
}
.fn-item:hover {
  border-color: var(--text-muted);
}
.fn-item.fn-active {
  border-color: var(--active-border);
}
.fn-item.error {
  border-color: var(--error);
}
.fn-item.disabled {
  opacity: 0.4;
}

.color-dot {
  width: 13px;
  height: 13px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  flex-shrink: 0;
  transition: transform 0.15s;
}
.color-dot:hover {
  transform: scale(1.3);
}

.fn-expr-display {
  flex: 1;
  font-size: 13px;
  color: var(--text-title);
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  display: flex;
  align-items: center;
}
.expr-text {
  white-space: pre;
}
.expr-text.muted {
  color: var(--text-muted);
  font-style: italic;
}

.fn-error-icon {
  color: var(--error);
  font-weight: bold;
  font-size: 13px;
  cursor: help;
  flex-shrink: 0;
}
.fn-remove {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 16px;
  cursor: pointer;
  padding: 0 2px;
  transition: color 0.15s;
  flex-shrink: 0;
}
.fn-remove:hover {
  color: var(--error);
}

.fn-caret {
  display: inline-block;
  width: 2px;
  height: 1em;
  background: var(--active-border);
  border-radius: 1px;
  margin: 0 1px;
  flex-shrink: 0;
  vertical-align: text-bottom;
  animation: blink 0.85s step-start infinite;
}
@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

.hidden-input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
  width: 1px;
  height: 1px;
  left: -9999px;
}

.add-btn {
  margin-top: 8px;
  background: var(--surface2);
  border: 1px dashed var(--border2);
  border-radius: 8px;
  color: var(--accent);
  font-family: inherit;
  font-size: 13px;
  padding: 7px;
  cursor: pointer;
  transition: background 0.15s;
  text-align: center;
  flex-shrink: 0;
}
.add-btn:hover {
  background: var(--accent-hover);
}

.vkb {
  margin-top: 10px;
  flex-shrink: 0;
}
.vkb-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.vkb-title {
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.vkb-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 6px;
}
.vkb-tab {
  background: var(--vkb-btn);
  border: 1px solid var(--border2);
  border-radius: 6px;
  color: var(--text-muted);
  font-family: inherit;
  font-size: 11px;
  padding: 4px 8px;
  cursor: pointer;
  transition:
    background 0.1s,
    color 0.1s;
}
.vkb-tab.active {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}
.vkb-tab:not(.active):hover {
  background: var(--vkb-btn-hover);
  color: var(--text);
}

.vkb-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 4px;
}
.vkb-btn {
  background: var(--vkb-btn);
  border: 1px solid var(--border2);
  border-radius: 6px;
  color: var(--text);
  font-family: inherit;
  font-size: 12px;
  padding: 7px 2px;
  cursor: pointer;
  transition:
    background 0.1s,
    transform 0.08s;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.vkb-btn:hover {
  background: var(--vkb-btn-hover);
}
.vkb-btn:active {
  transform: scale(0.93);
}
.vkb-btn.vkb-fn {
  background: var(--vkb-fn);
  color: var(--vkb-fn-text);
  font-size: 11px;
}
.vkb-btn.vkb-fn:hover {
  background: var(--vkb-fn-hover);
}
.vkb-btn.vkb-var {
  background: var(--vkb-var);
  color: var(--vkb-var-text);
  font-weight: 700;
  font-size: 13px;
}

.vkb-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
  margin-top: 4px;
}
.vkb-del,
.vkb-clear {
  color: var(--error) !important;
}
.vkb-nav {
  color: var(--accent) !important;
}
.vkb-clear {
  font-size: 11px !important;
}

.vkb-preview {
  margin-top: 8px;
  background: var(--surface2);
  border: 1px solid var(--active-border);
  border-radius: 7px;
  padding: 6px 10px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 34px;
  overflow: hidden;
}
.preview-label {
  color: var(--text-muted);
  flex-shrink: 0;
}
.preview-body {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  display: flex;
  align-items: center;
  color: var(--text-title);
}

.divider {
  height: 1px;
  background: var(--border);
  margin: 10px 0;
  flex-shrink: 0;
}
.controls {
  display: flex;
  flex-direction: column;
  gap: 7px;
  flex-shrink: 0;
}
.controls label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-muted);
}
.controls input[type='number'] {
  width: 78px;
  background: var(--surface2);
  border: 1px solid var(--border2);
  border-radius: 5px;
  color: var(--text);
  font-family: inherit;
  font-size: 12px;
  padding: 4px 6px;
  outline: none;
}
.controls input[type='number']:focus {
  border-color: var(--accent);
}
.reset-btn {
  background: var(--surface2);
  border: 1px solid var(--border2);
  border-radius: 6px;
  color: var(--accent);
  font-family: inherit;
  font-size: 12px;
  padding: 6px;
  cursor: pointer;
  transition: background 0.15s;
}
.reset-btn:hover {
  background: var(--accent-hover);
}

.hints {
  font-size: 11px;
  color: var(--text-muted);
  line-height: 1.9;
  flex-shrink: 0;
}
.hints strong {
  color: var(--accent);
}

.canvas-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}
.sidebar-toggle {
  display: none;
}
.canvas-wrap {
  flex: 1;
  position: relative;
  overflow: hidden;
  cursor: grab;
}
.canvas-wrap:active {
  cursor: grabbing;
}
canvas {
  display: block;
  width: 100%;
  height: 100%;
}
.canvas-hint {
  position: absolute;
  bottom: 10px;
  right: 14px;
  font-size: 11px;
  color: var(--text-muted);
  opacity: 0.35;
  pointer-events: none;
}

@media (max-width: 700px) {
  .sidebar-backdrop {
    display: block;
  }

  .sidebar-toggle {
    display: block;
    background: var(--surface);
    border: none;
    border-bottom: 1px solid var(--border);
    color: var(--accent);
    font-family: inherit;
    font-size: 13px;
    padding: 9px 16px;
    cursor: pointer;
    text-align: left;
    flex-shrink: 0;
  }
  .sidebar {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    max-height: 75dvh;
    border-right: none;
    border-bottom: 1px solid var(--border);
    z-index: 20;
    transform: translateY(-110%);
    transition: transform 0.25s ease;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
  }
  .sidebar.sidebar-open {
    transform: translateY(0);
  }
  .vkb-grid {
    grid-template-columns: repeat(6, 1fr);
  }
  .author {
    display: none;
  }
}
</style>
