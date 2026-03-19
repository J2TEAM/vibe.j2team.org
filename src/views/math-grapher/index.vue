<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'

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
type CompiledFn = (x: number, y?: number) => number

const COLORS: string[] = [
  '#FF6B4A',
  '#FFB830',
  '#38BDF8',
  '#a78bfa',
  '#34d399',
  '#f472b6',
  '#60a5fa',
  '#fbbf24',
]
let idCounter = 0

const kbTabs = [
  { id: 'basic', label: 'Cơ bản' },
  { id: 'trig', label: 'Lượng giác' },
  { id: 'misc', label: 'Khác' },
]

const KB: Record<string, VKey[]> = {
  basic: [
    { label: 'x', insert: 'x', cls: 'key-var' },
    { label: 'y', insert: 'y', cls: 'key-var' },
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
    { label: 'π', insert: 'pi', cls: 'key-fn' },
    { label: 'e', insert: 'e', cls: 'key-fn' },
  ],
  trig: [
    { label: 'sin', insert: 'sin()', cls: 'key-fn', moveBefore: 1 },
    { label: 'cos', insert: 'cos()', cls: 'key-fn', moveBefore: 1 },
    { label: 'tan', insert: 'tan()', cls: 'key-fn', moveBefore: 1 },
    { label: 'asin', insert: 'asin()', cls: 'key-fn', moveBefore: 1 },
    { label: 'acos', insert: 'acos()', cls: 'key-fn', moveBefore: 1 },
    { label: 'atan', insert: 'atan()', cls: 'key-fn', moveBefore: 1 },
    { label: 'sinh', insert: 'sinh()', cls: 'key-fn', moveBefore: 1 },
    { label: 'cosh', insert: 'cosh()', cls: 'key-fn', moveBefore: 1 },
    { label: 'tanh', insert: 'tanh()', cls: 'key-fn', moveBefore: 1 },
    { label: 'atan2', insert: 'atan2(,)', cls: 'key-fn', moveBefore: 2 },
  ],
  misc: [
    { label: '√', insert: 'sqrt()', cls: 'key-fn', moveBefore: 1 },
    { label: '|x|', insert: 'abs()', cls: 'key-fn', moveBefore: 1 },
    { label: 'exp', insert: 'exp()', cls: 'key-fn', moveBefore: 1 },
    { label: 'log', insert: 'log()', cls: 'key-fn', moveBefore: 1 },
    { label: 'log2', insert: 'log2()', cls: 'key-fn', moveBefore: 1 },
    { label: 'floor', insert: 'floor()', cls: 'key-fn', moveBefore: 1 },
    { label: 'ceil', insert: 'ceil()', cls: 'key-fn', moveBefore: 1 },
    { label: 'round', insert: 'round()', cls: 'key-fn', moveBefore: 1 },
    { label: 'min', insert: 'min(,)', cls: 'key-fn', moveBefore: 2 },
    { label: 'max', insert: 'max(,)', cls: 'key-fn', moveBefore: 2 },
    { label: '<', insert: '<' },
    { label: '>', insert: '>' },
    { label: '≤', insert: '<=' },
    { label: '≥', insert: '>=' },
  ],
}

// ─── State ────────────────────────────────────────────────────────────────
const sidebarOpen = ref(false)
const activeTab = ref('basic')
const activeIdx = ref(0)
const cursorPos = ref(0)

const canvas = ref<HTMLCanvasElement | null>(null)
const canvasWrap = ref<HTMLDivElement | null>(null)
const hiddenInput = ref<HTMLInputElement | null>(null)

const functions = reactive<FnItem[]>([
  { id: idCounter++, expr: 'sin(x)', color: COLORS[0] as string, enabled: true, error: '' },
  {
    id: idCounter++,
    expr: '(x^2+y^2-1)^3-x^2*y^3=0',
    color: COLORS[2] as string,
    enabled: true,
    error: '',
  },
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
const activeFn = computed(() => functions[activeIdx.value] ?? null)
const activeExpr = computed(() => activeFn.value?.expr ?? '')

// ─── Expression compiler ──────────────────────────────────────────────────
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
      fn: new Function('x', 'y', `"use strict"; return ((${lhs})-(${rhs}))`) as CompiledFn,
    }
  }

  return {
    mode: 'explicit',
    fn: new Function('x', `"use strict"; return (${expr})`) as CompiledFn,
  }
}

// ─── Coordinate helpers ───────────────────────────────────────────────────
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

// ─── Render ───────────────────────────────────────────────────────────────
function render() {
  const cvs = canvas.value
  if (!cvs) return
  const ctx = cvs.getContext('2d')!
  const w = cvs.width,
    h = cvs.height

  ctx.fillStyle = '#0F1923'
  ctx.fillRect(0, 0, w, h)
  drawGrid(ctx, w, h)
  drawAxes(ctx, w, h)
  for (const fn of functions) {
    if (!fn.enabled || !fn.expr.trim()) continue
    fn.error = ''
    try {
      const compiled = compileExpr(fn.expr)
      if (compiled.mode === 'explicit') drawExplicit(ctx, w, h, compiled.fn, fn.color)
      else drawImplicit(ctx, w, h, compiled.fn, fn.color)
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

function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const pxPerUnit = w / (view.xMax - view.xMin)
  const step = niceStep(60 / pxPerUnit)
  ctx.strokeStyle = '#253549'
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
  ctx.fillStyle = '#4A6180'
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

function drawAxes(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.strokeStyle = '#8B9DB5'
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
  fn: CompiledFn,
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
  fn: CompiledFn,
  color: string,
) {
  const CELL = 4
  const cols = Math.ceil(w / CELL),
    rows = Math.ceil(h / CELL)
  const vals = new Float64Array((rows + 1) * (cols + 1))
  for (let row = 0; row <= rows; row++) {
    for (let col = 0; col <= cols; col++) {
      try {
        vals[row * (cols + 1) + col] = fn(toWorldX(col * CELL, w), toWorldY(row * CELL, h))
      } catch {
        vals[row * (cols + 1) + col] = NaN
      }
    }
  }
  ctx.beginPath()
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const v00 = vals[row * (cols + 1) + col]!
      const v10 = vals[row * (cols + 1) + col + 1]!
      const v01 = vals[(row + 1) * (cols + 1) + col]!
      const v11 = vals[(row + 1) * (cols + 1) + col + 1]!
      if (!isFinite(v00) || !isFinite(v10) || !isFinite(v01) || !isFinite(v11)) continue
      const interp = (
        a: number,
        b: number,
        pa: [number, number],
        pb: [number, number],
      ): [number, number] => {
        const t = a / (a - b)
        return [pa[0] + t * (pb[0] - pa[0]), pa[1] + t * (pb[1] - pa[1])]
      }
      const corners: { v: number; p: [number, number] }[] = [
        { v: v00, p: [col * CELL, row * CELL] },
        { v: v10, p: [(col + 1) * CELL, row * CELL] },
        { v: v11, p: [(col + 1) * CELL, (row + 1) * CELL] },
        { v: v01, p: [col * CELL, (row + 1) * CELL] },
      ]
      const crossings: [number, number][] = []
      for (let k = 0; k < 4; k++) {
        const a = corners[k]!,
          b = corners[(k + 1) % 4]!
        if (a.v >= 0 !== b.v >= 0) crossings.push(interp(a.v, b.v, a.p, b.p))
      }
      if (crossings.length >= 2) {
        const c0 = crossings[0]!,
          c1 = crossings[1]!
        ctx.moveTo(c0[0], c0[1])
        ctx.lineTo(c1[0], c1[1])
      }
    }
  }
  ctx.stroke()
}

// ─── Virtual keyboard ─────────────────────────────────────────────────────
function clampCursor() {
  const fn = activeFn.value
  if (fn) cursorPos.value = Math.max(0, Math.min(fn.expr.length, cursorPos.value))
}
function insertKey(key: VKey) {
  const fn = activeFn.value
  if (!fn) return
  clampCursor()
  const p = cursorPos.value
  fn.expr = fn.expr.slice(0, p) + key.insert + fn.expr.slice(p)
  cursorPos.value = p + key.insert.length - (key.moveBefore ?? 0)
  scheduleRender()
}
function deleteChar() {
  const fn = activeFn.value
  if (!fn || cursorPos.value === 0) return
  clampCursor()
  fn.expr = fn.expr.slice(0, cursorPos.value - 1) + fn.expr.slice(cursorPos.value)
  cursorPos.value--
  scheduleRender()
}
function clearExpr() {
  const fn = activeFn.value
  if (!fn) return
  fn.expr = ''
  cursorPos.value = 0
  scheduleRender()
}
function moveCursor(d: number) {
  const fn = activeFn.value
  if (!fn) return
  cursorPos.value = Math.max(0, Math.min(fn.expr.length, cursorPos.value + d))
}

// ─── Hidden input ──────────────────────────────────────────────────────────
function selectFn(i: number) {
  activeIdx.value = i
  cursorPos.value = functions[i]?.expr.length ?? 0
  nextTick(() => hiddenInput.value?.focus())
}
function onHiddenInput(e: Event) {
  const fn = activeFn.value
  if (!fn) return
  const input = e.target as HTMLInputElement
  fn.expr = input.value
  cursorPos.value = input.selectionStart ?? fn.expr.length
  scheduleRender()
}
function onPaste(e: ClipboardEvent) {
  e.preventDefault()
  const text = e.clipboardData?.getData('text') ?? ''
  if (!text) return
  const fn = activeFn.value
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
  const fn = activeFn.value
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
    if (hiddenInput.value) hiddenInput.value.value = activeFn.value?.expr ?? ''
  })
})

// ─── Functions management ──────────────────────────────────────────────────
function addFn() {
  functions.push({
    id: idCounter++,
    expr: '',
    color: COLORS[functions.length % COLORS.length] as string,
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
  const fn = functions[i]
  if (!fn) return
  fn.enabled = !fn.enabled
  scheduleRender()
}
function resetView() {
  Object.assign(view, DEFAULT_VIEW)
  fitCanvas()
}

// ─── Canvas interactions ───────────────────────────────────────────────────
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
  const t0 = e.touches[0]
  if (e.touches.length === 1 && t0) {
    dragging = true
    dragStart = { x: t0.clientX, y: t0.clientY }
    dragView = { ...view }
  } else if (e.touches.length === 2) lastTouchDist = getTouchDist(e)
}
function onTouchMove(e: TouchEvent) {
  const cvs = canvas.value!
  const t0 = e.touches[0]
  if (e.touches.length === 1 && dragging && t0) {
    const dx = ((t0.clientX - dragStart.x) / cvs.width) * (dragView.xMax - dragView.xMin)
    const dy = ((t0.clientY - dragStart.y) / cvs.height) * (dragView.yMax - dragView.yMin)
    view.xMin = dragView.xMin - dx
    view.xMax = dragView.xMax - dx
    view.yMin = dragView.yMin + dy
    view.yMax = dragView.yMax + dy
    scheduleRender()
  } else if (e.touches.length === 2) {
    const dist = getTouchDist(e)
    const f = lastTouchDist / dist
    const t1 = e.touches[1]
    if (!t0 || !t1) return
    const wx = toWorldX((t0.clientX + t1.clientX) / 2, cvs.width)
    const wy = toWorldY((t0.clientY + t1.clientY) / 2, cvs.height)
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
  const t0 = e.touches[0],
    t1 = e.touches[1]
  if (!t0 || !t1) return 0
  return Math.sqrt((t0.clientX - t1.clientX) ** 2 + (t0.clientY - t1.clientY) ** 2)
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

<template>
  <div class="flex flex-col bg-bg-deep min-h-screen font-body text-text-primary">
    <!-- Header -->
    <header
      class="flex flex-shrink-0 items-center gap-4 bg-bg-surface px-4 sm:px-6 py-3 border-border-default border-b"
    >
      <RouterLink
        to="/"
        class="inline-flex flex-shrink-0 items-center gap-2 px-3 py-1.5 border border-border-default hover:border-accent-coral text-text-secondary hover:text-text-primary text-sm transition"
      >
        <Icon icon="lucide:arrow-left" class="size-3.5" />
        Trang chủ
      </RouterLink>
      <h1 class="flex-1 font-display font-semibold text-lg truncate text-accent-coral">
        Đồ Thị Toán Học
      </h1>
      <span class="hidden sm:block font-display text-text-dim text-xs">by deku</span>
    </header>

    <!-- Workspace -->
    <div class="relative flex flex-1 overflow-hidden">
      <!-- Mobile backdrop -->
      <div
        v-if="sidebarOpen"
        class="sm:hidden z-10 absolute inset-0 bg-bg-deep/70"
        @click="sidebarOpen = false"
      />

      <!-- Sidebar -->
      <aside
        class="top-0 left-0 z-20 absolute sm:relative flex flex-col flex-shrink-0 bg-bg-surface border-border-default border-r w-64 h-full overflow-y-auto transition-transform sm:translate-y-0 duration-300"
        :class="sidebarOpen ? 'translate-y-0' : '-translate-y-full sm:translate-y-0'"
      >
        <div class="flex flex-col flex-1 gap-3 p-3">
          <!-- Section: Hàm số -->
          <div>
            <h2
              class="flex items-center gap-2 mb-2 font-display text-text-dim text-xs tracking-widest"
            >
              <span class="text-accent-coral">//</span> HÀM SỐ
            </h2>
            <div class="flex flex-col gap-1.5">
              <div
                v-for="(fn, i) in functions"
                :key="fn.id"
                class="flex items-center gap-2 bg-bg-deep px-2.5 py-2 border border-border-default transition cursor-pointer"
                :class="{
                  'border-accent-coral': activeIdx === i,
                  'border-red-500/60': !!fn.error,
                  'opacity-40': !fn.enabled,
                  'hover:border-border-default': activeIdx !== i && !fn.error,
                }"
                @click="selectFn(i)"
              >
                <button
                  class="flex-shrink-0 rounded-full size-3 hover:scale-125 transition"
                  :style="{ background: fn.color }"
                  @click.stop="toggleEnabled(i)"
                />
                <div
                  class="flex flex-1 items-center min-w-0 overflow-hidden font-mono text-text-primary text-xs whitespace-nowrap"
                >
                  <template v-if="activeIdx === i">
                    <span class="whitespace-pre">{{ fn.expr.slice(0, cursorPos) }}</span>
                    <span
                      class="inline-block flex-shrink-0 mx-px w-0.5 h-3.5 animate-[blink_0.85s_step-start_infinite] bg-accent-coral"
                    />
                    <span class="whitespace-pre">{{ fn.expr.slice(cursorPos) }}</span>
                  </template>
                  <span v-else class="text-text-secondary truncate italic">{{
                    fn.expr || 'Nhập hàm số…'
                  }}</span>
                </div>
                <span
                  v-if="fn.error"
                  class="flex-shrink-0 text-red-400 text-xs cursor-help"
                  :title="fn.error"
                  >!</span
                >
                <button
                  class="flex-shrink-0 text-text-dim hover:text-red-400 text-sm transition"
                  @click.stop="removeFn(i)"
                >
                  ×
                </button>
              </div>
            </div>

            <!-- Hidden input for paste/keyboard -->
            <input
              ref="hiddenInput"
              class="-left-[9999px] absolute opacity-0 w-px h-px pointer-events-none"
              :value="activeExpr"
              @input="onHiddenInput"
              @paste="onPaste"
              @keydown="onKeyDown"
              spellcheck="false"
              autocomplete="off"
            />

            <button
              class="mt-2 py-1.5 border border-border-default hover:border-accent-coral border-dashed w-full font-display text-text-dim text-xs tracking-wide transition hover:text-accent-coral"
              @click="addFn"
            >
              + Thêm hàm số
            </button>
          </div>

          <!-- Section: Bàn phím -->
          <div>
            <h2
              class="flex items-center gap-2 mb-2 font-display text-text-dim text-xs tracking-widest"
            >
              <span class="text-accent-amber">//</span> BÀN PHÍM
            </h2>

            <!-- Preview -->
            <div
              class="flex items-center gap-1 bg-bg-deep mb-2 px-3 py-1.5 border border-accent-coral/40 min-h-8 overflow-hidden font-mono text-xs"
            >
              <span class="flex-shrink-0 text-text-dim">f =</span>
              <span class="flex items-center overflow-hidden text-text-primary whitespace-pre">
                <template v-if="activeFn">
                  <span class="whitespace-pre">{{ activeFn.expr.slice(0, cursorPos) }}</span>
                  <span
                    class="inline-block flex-shrink-0 mx-px w-0.5 h-3.5 animate-[blink_0.85s_step-start_infinite] bg-accent-coral"
                  />
                  <span class="whitespace-pre">{{ activeFn.expr.slice(cursorPos) }}</span>
                </template>
              </span>
            </div>

            <!-- Tabs -->
            <div class="flex gap-1 mb-1.5">
              <button
                v-for="tab in kbTabs"
                :key="tab.id"
                class="flex-1 py-1 border font-display text-xs tracking-wide transition"
                :class="
                  activeTab === tab.id
                    ? 'border-accent-amber bg-accent-amber/10 text-accent-amber'
                    : 'border-border-default text-text-dim hover:text-text-secondary hover:border-border-default'
                "
                @click="activeTab = tab.id"
              >
                {{ tab.label }}
              </button>
            </div>

            <!-- Keys -->
            <div class="gap-1 grid grid-cols-5">
              <button
                v-for="key in currentTabKeys"
                :key="key.label"
                class="py-1.5 border font-mono text-xs active:scale-95 transition"
                :class="{
                  'border-accent-sky/40 bg-accent-sky/10 text-accent-sky hover:bg-accent-sky/20':
                    key.cls === 'key-fn',
                  'border-accent-coral/40 bg-accent-coral/10 text-accent-coral font-bold hover:bg-accent-coral/20':
                    key.cls === 'key-var',
                  'border-border-default text-text-secondary hover:border-accent-amber hover:text-text-primary':
                    !key.cls,
                }"
                @click="insertKey(key)"
              >
                {{ key.label }}
              </button>
            </div>

            <!-- Actions -->
            <div class="gap-1 grid grid-cols-4 mt-1">
              <button
                class="py-1.5 border border-border-default hover:border-red-500/50 text-red-400 text-xs active:scale-95 transition"
                @click="deleteChar"
              >
                ⌫
              </button>
              <button
                class="py-1.5 border border-border-default hover:border-red-500/50 font-display text-red-400 text-xs tracking-wide active:scale-95 transition"
                @click="clearExpr"
              >
                CLR
              </button>
              <button
                class="py-1.5 border border-border-default hover:border-accent-sky/50 text-xs active:scale-95 transition text-accent-sky"
                @click="moveCursor(-1)"
              >
                ◀
              </button>
              <button
                class="py-1.5 border border-border-default hover:border-accent-sky/50 text-xs active:scale-95 transition text-accent-sky"
                @click="moveCursor(1)"
              >
                ▶
              </button>
            </div>
          </div>

          <!-- Section: Viewport -->
          <div>
            <h2
              class="flex items-center gap-2 mb-2 font-display text-text-dim text-xs tracking-widest"
            >
              <span class="text-accent-sky">//</span> VIEWPORT
            </h2>
            <div class="gap-1.5 grid grid-cols-2">
              <label class="flex flex-col gap-0.5">
                <span class="text-text-dim text-xs">X min</span>
                <input
                  v-model.number="view.xMin"
                  type="number"
                  @change="render()"
                  class="bg-bg-deep px-2 py-1 border border-border-default focus:border-accent-coral focus:outline-none font-mono text-text-primary text-xs transition"
                />
              </label>
              <label class="flex flex-col gap-0.5">
                <span class="text-text-dim text-xs">X max</span>
                <input
                  v-model.number="view.xMax"
                  type="number"
                  @change="render()"
                  class="bg-bg-deep px-2 py-1 border border-border-default focus:border-accent-coral focus:outline-none font-mono text-text-primary text-xs transition"
                />
              </label>
              <label class="flex flex-col gap-0.5">
                <span class="text-text-dim text-xs">Y min</span>
                <input
                  v-model.number="view.yMin"
                  type="number"
                  @change="render()"
                  class="bg-bg-deep px-2 py-1 border border-border-default focus:border-accent-coral focus:outline-none font-mono text-text-primary text-xs transition"
                />
              </label>
              <label class="flex flex-col gap-0.5">
                <span class="text-text-dim text-xs">Y max</span>
                <input
                  v-model.number="view.yMax"
                  type="number"
                  @change="render()"
                  class="bg-bg-deep px-2 py-1 border border-border-default focus:border-accent-coral focus:outline-none font-mono text-text-primary text-xs transition"
                />
              </label>
            </div>
            <button
              class="mt-1.5 py-1.5 border border-border-default hover:border-accent-sky w-full font-display text-text-dim text-xs tracking-wide transition hover:text-accent-sky"
              @click="resetView"
            >
              ↺ Reset view
            </button>
          </div>

          <!-- Hints -->
          <div class="space-y-1 bg-bg-deep p-3 border border-border-default text-text-dim text-xs">
            <p>
              <span class="text-accent-coral">sin(x)</span> ·
              <span class="text-accent-coral">x^2</span> ·
              <span class="text-accent-coral">sqrt(x)</span>
            </p>
            <p><span class="text-accent-amber">x^2+y^2=1</span> — vòng tròn</p>
            <p><span class="text-accent-sky">(x^2+y^2-1)^3-x^2*y^3=0</span></p>
          </div>
        </div>
      </aside>

      <!-- Canvas area -->
      <div class="flex flex-col flex-1 overflow-hidden">
        <!-- Mobile toggle -->
        <button
          class="sm:hidden flex items-center gap-2 bg-bg-surface px-4 py-2.5 border-border-default border-b text-text-secondary text-sm transition hover:text-accent-coral"
          @click="sidebarOpen = !sidebarOpen"
        >
          <Icon :icon="sidebarOpen ? 'lucide:x' : 'lucide:sliders-horizontal'" class="size-4" />
          {{ sidebarOpen ? 'Đóng' : 'Hàm số & Bàn phím' }}
        </button>

        <div
          class="relative flex-1 overflow-hidden cursor-grab active:cursor-grabbing"
          ref="canvasWrap"
        >
          <canvas
            ref="canvas"
            class="block w-full h-full"
            @wheel.prevent="onWheel"
            @mousedown="onMouseDown"
            @mousemove="onMouseMove"
            @mouseup="onMouseUp"
            @mouseleave="onMouseUp"
            @touchstart.prevent="onTouchStart"
            @touchmove.prevent="onTouchMove"
            @touchend="onTouchEnd"
          />
          <p
            class="right-4 bottom-3 absolute opacity-40 text-text-dim text-xs pointer-events-none select-none"
          >
            Cuộn để zoom · Kéo để di chuyển
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}
</style>
