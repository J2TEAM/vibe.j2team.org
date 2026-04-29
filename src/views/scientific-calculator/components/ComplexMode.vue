<script setup lang="ts">
import { ref, computed } from 'vue'
import { cycleAngleMode, getAngleMode } from '../engine'
import type { AngleMode } from '../types'
import CalcKeyboard from './CalcKeyboard.vue'

const kbRef = ref<InstanceType<typeof CalcKeyboard>>()

type ComplexNum = { re: number; im: number }
type DisplayMode = 'rect' | 'polar'

const displayMode = ref<DisplayMode>('rect')
const expr = ref('')
const cursor = ref(0)
const resultText = ref('')
const isResult = ref(false)
const isError = ref(false)
const history = ref<{ expr: string; result: string }[]>([])
const histIdx = ref(-1)
const showOptn = ref(false)

// Angle mode (shared with keyboard)
const angleMode = ref<AngleMode>(getAngleMode())

// Undo stack
const undoStack = ref<{ e: string; c: number }[]>([])

const exprBefore = computed(() => expr.value.slice(0, cursor.value))
const exprAfter = computed(() => expr.value.slice(cursor.value))

function styledExpr(s: string) {
  return s.replace(/[×÷+\-−]/g, (m) => `<span class="op-sym">${m}</span>`)
}

const MULTI_TOKENS = [
  'Conjg(',
  'Abs(',
  'Arg(',
  'ReP(',
  'ImP(',
  'sin(',
  'cos(',
  'tan(',
  'asin(',
  'acos(',
  'atan(',
  'sqrt(',
  'cbrt(',
  'log(',
  'ln(',
  'exp(',
  'abs(',
  'nPr(',
  'nCr(',
].sort((a, b) => b.length - a.length)

function pushUndo() {
  undoStack.value.push({ e: expr.value, c: cursor.value })
  if (undoStack.value.length > 50) undoStack.value.shift()
}
function undo() {
  const s = undoStack.value.pop()
  if (s) {
    expr.value = s.e
    cursor.value = s.c
    isResult.value = false
    isError.value = false
  }
}

function optnInsert(text: string) {
  insert(text)
  showOptn.value = false
}

function optnAngle() {
  toggleAngle()
  showOptn.value = false
}

function insert(text: string) {
  if (isError.value) {
    expr.value = ''
    cursor.value = 0
    isError.value = false
  }
  if (isResult.value) {
    if (/^[\d.πe]/.test(text) || /^[a-zA-Z]+\(/.test(text)) {
      pushUndo()
      expr.value = ''
      cursor.value = 0
    }
    isResult.value = false
  }
  pushUndo()
  expr.value = expr.value.slice(0, cursor.value) + text + expr.value.slice(cursor.value)
  cursor.value += text.length
}

function del() {
  if (isResult.value || isError.value) {
    clearAll()
    return
  }
  if (cursor.value === 0) return
  pushUndo()
  const before = expr.value.slice(0, cursor.value)
  for (const tok of MULTI_TOKENS) {
    if (before.endsWith(tok)) {
      expr.value = before.slice(0, -tok.length) + expr.value.slice(cursor.value)
      cursor.value -= tok.length
      return
    }
  }
  expr.value = before.slice(0, -1) + expr.value.slice(cursor.value)
  cursor.value--
}

function moveL() {
  if (isResult.value) {
    isResult.value = false
    cursor.value = expr.value.length
    return
  }
  if (cursor.value > 0) cursor.value--
}
function moveR() {
  if (cursor.value < expr.value.length) cursor.value++
}
function moveHome() {
  cursor.value = 0
}
function moveEnd() {
  cursor.value = expr.value.length
}
function clearAll() {
  pushUndo()
  expr.value = ''
  cursor.value = 0
  resultText.value = ''
  isResult.value = false
  isError.value = false
}

// ── Complex number engine ──
function parse(s: string): ComplexNum | null {
  s = s.trim()
  const pureIm = s.match(/^([+-]?\d*\.?\d*)i$/)
  if (pureIm) {
    const v = pureIm[1] ?? ''
    return { re: 0, im: v === '' || v === '+' ? 1 : v === '-' ? -1 : parseFloat(v) }
  }
  const rect = s.match(/^([+-]?\d*\.?\d+)\s*([+-])\s*(\d*\.?\d*)i$/)
  if (rect) {
    const re = parseFloat(rect[1]!)
    const imStr = rect[3] ?? ''
    return { re, im: (rect[2] === '-' ? -1 : 1) * (imStr === '' ? 1 : parseFloat(imStr)) }
  }
  const polar = s.match(/^([+-]?\d*\.?\d+)\s*∠\s*([+-]?\d*\.?\d+)$/)
  if (polar) {
    const r = parseFloat(polar[1]!)
    const t = (parseFloat(polar[2]!) * Math.PI) / 180
    return { re: r * Math.cos(t), im: r * Math.sin(t) }
  }
  const n = parseFloat(s)
  if (!isNaN(n)) return { re: n, im: 0 }
  return null
}

function fmt(n: number): string {
  if (Number.isInteger(n) && Math.abs(n) < 1e12) return String(n)
  return parseFloat(n.toPrecision(10)).toString()
}

function fmtComplex(z: ComplexNum): string {
  if (displayMode.value === 'polar') {
    const r = Math.sqrt(z.re * z.re + z.im * z.im)
    const theta = (Math.atan2(z.im, z.re) * 180) / Math.PI
    return `${fmt(r)}∠${fmt(theta)}°`
  }
  if (Math.abs(z.im) < 1e-12) return fmt(z.re)
  if (Math.abs(z.re) < 1e-12) {
    if (Math.abs(z.im - 1) < 1e-12) return 'i'
    if (Math.abs(z.im + 1) < 1e-12) return '-i'
    return `${fmt(z.im)}i`
  }
  const sign = z.im >= 0 ? '+' : '-'
  const absIm = Math.abs(z.im)
  const imStr = Math.abs(absIm - 1) < 1e-12 ? '' : fmt(absIm)
  return `${fmt(z.re)}${sign}${imStr}i`
}

function cAdd(a: ComplexNum, b: ComplexNum): ComplexNum {
  return { re: a.re + b.re, im: a.im + b.im }
}
function cSub(a: ComplexNum, b: ComplexNum): ComplexNum {
  return { re: a.re - b.re, im: a.im - b.im }
}
function cMul(a: ComplexNum, b: ComplexNum): ComplexNum {
  return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re }
}
function cDiv(a: ComplexNum, b: ComplexNum): ComplexNum {
  const d = b.re * b.re + b.im * b.im
  if (d === 0) throw new Error('Math Error')
  return { re: (a.re * b.re + a.im * b.im) / d, im: (a.im * b.re - a.re * b.im) / d }
}
function cConj(z: ComplexNum): ComplexNum {
  return { re: z.re, im: -z.im }
}
function cAbs(z: ComplexNum): ComplexNum {
  return { re: Math.sqrt(z.re * z.re + z.im * z.im), im: 0 }
}
function cArg(z: ComplexNum): ComplexNum {
  return { re: (Math.atan2(z.im, z.re) * 180) / Math.PI, im: 0 }
}
function cPow(z: ComplexNum, n: number): ComplexNum {
  const r = Math.sqrt(z.re * z.re + z.im * z.im)
  const theta = Math.atan2(z.im, z.re)
  const rn = Math.pow(r, n)
  return { re: rn * Math.cos(n * theta), im: rn * Math.sin(n * theta) }
}
function cInv(z: ComplexNum): ComplexNum {
  return cDiv({ re: 1, im: 0 }, z)
}

function evalComplex(input: string): string {
  const s = input.trim()
  const conjgMatch = s.match(/^Conjg\((.+)\)$/)
  if (conjgMatch) {
    const inner = parse(conjgMatch[1]!)
    if (!inner) throw new Error('Syntax Error')
    return fmtComplex(cConj(inner))
  }
  const absMatch = s.match(/^Abs\((.+)\)$/)
  if (absMatch) {
    const inner = parse(absMatch[1]!)
    if (!inner) throw new Error('Syntax Error')
    return fmtComplex(cAbs(inner))
  }
  const argMatch = s.match(/^Arg\((.+)\)$/)
  if (argMatch) {
    const inner = parse(argMatch[1]!)
    if (!inner) throw new Error('Syntax Error')
    return fmtComplex(cArg(inner))
  }
  const repMatch = s.match(/^ReP\((.+)\)$/)
  if (repMatch) {
    const inner = parse(repMatch[1]!)
    if (!inner) throw new Error('Syntax Error')
    return fmt(inner.re)
  }
  const impMatch = s.match(/^ImP\((.+)\)$/)
  if (impMatch) {
    const inner = parse(impMatch[1]!)
    if (!inner) throw new Error('Syntax Error')
    return fmt(inner.im)
  }
  const powMatch = s.match(/^(.+)\^(\d+)$/)
  if (powMatch) {
    const base = parse(powMatch[1]!)
    if (!base) throw new Error('Syntax Error')
    return fmtComplex(cPow(base, parseInt(powMatch[2]!)))
  }
  if (s.endsWith('⁻¹')) {
    const base = parse(s.slice(0, -2))
    if (!base) throw new Error('Syntax Error')
    return fmtComplex(cInv(base))
  }

  let depth = 0,
    opIdx = -1,
    opChar = ''
  for (let i = s.length - 1; i >= 0; i--) {
    if (s[i] === ')') depth++
    else if (s[i] === '(') depth--
    else if (depth === 0 && (s[i] === '+' || s[i] === '-') && i > 0) {
      opIdx = i
      opChar = s[i]!
      break
    }
  }
  if (opIdx === -1) {
    depth = 0
    for (let i = s.length - 1; i >= 0; i--) {
      if (s[i] === ')') depth++
      else if (s[i] === '(') depth--
      else if (
        depth === 0 &&
        (s[i] === '×' || s[i] === '*' || s[i] === '÷' || s[i] === '/') &&
        i > 0
      ) {
        opIdx = i
        opChar = s[i]!
        break
      }
    }
  }
  if (opIdx > 0) {
    const left = parse(s.slice(0, opIdx))
    const right = parse(s.slice(opIdx + 1))
    if (left && right) {
      switch (opChar) {
        case '+':
          return fmtComplex(cAdd(left, right))
        case '-':
          return fmtComplex(cSub(left, right))
        case '×':
        case '*':
          return fmtComplex(cMul(left, right))
        case '÷':
        case '/':
          return fmtComplex(cDiv(left, right))
      }
    }
  }
  const z = parse(s)
  if (z) return fmtComplex(z)
  throw new Error('Syntax Error')
}

function doEval() {
  if (!expr.value.trim()) return
  try {
    const result = evalComplex(expr.value)
    resultText.value = result
    isError.value = false
    isResult.value = true
    history.value.unshift({ expr: expr.value, result })
    if (history.value.length > 50) history.value.pop()
    histIdx.value = -1
  } catch (err) {
    resultText.value = err instanceof Error ? err.message : 'Error'
    isError.value = true
    isResult.value = false
  }
}

function onAlphaInput(v: string) {
  insert(v)
}
function onStoreVar() {
  /* no variable store in complex mode */
}

function histUp() {
  if (history.value.length === 0) return
  if (histIdx.value < history.value.length - 1) {
    histIdx.value++
    const h = history.value[histIdx.value]
    if (h) {
      expr.value = h.expr
      cursor.value = h.expr.length
      isResult.value = false
      isError.value = false
    }
  }
}
function histDown() {
  if (histIdx.value > 0) {
    histIdx.value--
    const h = history.value[histIdx.value]
    if (h) {
      expr.value = h.expr
      cursor.value = h.expr.length
      isResult.value = false
      isError.value = false
    }
  } else if (histIdx.value === 0) {
    histIdx.value = -1
    expr.value = ''
    cursor.value = 0
  }
}

function onOptn() {
  showOptn.value = true
}
function toggleAngle() {
  angleMode.value = cycleAngleMode()
}
</script>

<template>
  <div class="complex-mode">
    <!-- ═══ DISPLAY ═══ -->
    <div class="calc-display">
      <div class="status-bar">
        <span class="st-angle" :class="{ highlight: angleMode !== 'DEG' }">{{ angleMode }}</span>
        <span v-if="kbRef?.isShift" class="st-shift">S</span>
        <span v-if="kbRef?.isAlpha" class="st-alpha">A</span>
        <span v-if="kbRef?.isSto" class="st-shift">STO</span>
      </div>
      <div class="mode-bar">
        <span class="mode-label">CMPLX</span>
        <div class="toggle-group">
          <button :class="{ active: displayMode === 'rect' }" @click="displayMode = 'rect'">
            a+bi
          </button>
          <button :class="{ active: displayMode === 'polar' }" @click="displayMode = 'polar'">
            r∠θ
          </button>
        </div>
      </div>
      <div class="expr-line">
        <span v-html="styledExpr(exprBefore)"></span><span class="cursor-blink">│</span
        ><span v-html="styledExpr(exprAfter)"></span>
      </div>
      <div class="result-line" :class="{ error: isError }">{{ resultText || '—' }}</div>
    </div>

    <!-- ═══ OPTN Popup ═══ -->
    <div v-if="showOptn" class="popup-overlay" @click.self="showOptn = false">
      <div class="popup-box">
        <div class="popup-title">OPTN — Số phức</div>
        <button class="tool-item" @click="optnInsert('i')">i — Đơn vị ảo</button>
        <button class="tool-item" @click="optnInsert('∠')">∠ — Dạng cực r∠θ</button>
        <button class="tool-item" @click="optnInsert('Conjg(')">Conjg — Liên hợp</button>
        <button class="tool-item" @click="optnInsert('Abs(')">Abs — Mô-đun |z|</button>
        <button class="tool-item" @click="optnInsert('Arg(')">Arg — Argument</button>
        <button class="tool-item" @click="optnInsert('ReP(')">ReP — Phần thực</button>
        <button class="tool-item" @click="optnInsert('ImP(')">ImP — Phần ảo</button>
        <button class="tool-item" @click="optnAngle()">Đơn vị góc: {{ angleMode }}</button>
      </div>
    </div>

    <!-- ═══ SHARED KEYBOARD ═══ -->
    <CalcKeyboard
      ref="kbRef"
      :angle-mode="angleMode"
      @insert="insert"
      @delete="del"
      @clear="clearAll"
      @eval="doEval"
      @undo="undo"
      @move-left="moveL"
      @move-right="moveR"
      @move-home="moveHome"
      @move-end="moveEnd"
      @toggle-angle="toggleAngle"
      @alpha-input="onAlphaInput"
      @store-var="onStoreVar"
      @optn="onOptn"
      @calc="doEval"
      @on="clearAll"
      @hist-up="histUp"
      @hist-down="histDown"
    />
  </div>
</template>

<style scoped>
.complex-mode {
  display: flex;
  flex-direction: column;
  position: relative;
}

.calc-display {
  margin: 10px 12px 6px;
  padding: 14px 14px 10px;
  background: #0a1218;
  border: 2px solid #1a2d42;
  border-radius: 8px;
  min-height: 90px;
}
.status-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  color: var(--color-text-dim);
  margin-bottom: 4px;
}
.st-angle {
  font-weight: 600;
}
.st-angle.highlight {
  color: var(--color-accent-sky);
}
.st-shift {
  color: #fbbf24;
  font-weight: 700;
}
.st-alpha {
  color: #ff4444;
  font-weight: 700;
}
.mode-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.mode-label {
  font-family: var(--font-display);
  font-size: 10px;
  font-weight: 700;
  color: var(--color-accent-sky);
}
.toggle-group {
  display: flex;
  gap: 4px;
}
.toggle-group button {
  padding: 2px 8px;
  font-size: 9px;
  border: 1px solid var(--color-border-default);
  background: #131f2e;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-family: inherit;
  border-radius: 3px;
}
.toggle-group button.active {
  background: #1e3a55;
  border-color: var(--color-accent-sky);
  color: var(--color-accent-sky);
}

.expr-line {
  font-family: var(--font-display, 'Anybody', sans-serif);
  font-size: 26px;
  font-weight: 600;
  color: var(--color-text-secondary);
  min-height: 28px;
  text-align: left;
  overflow-x: auto;
  white-space: nowrap;
  scrollbar-width: none;
}
.expr-line::-webkit-scrollbar {
  display: none;
}
.expr-line :deep(.op-sym) {
  font-size: 1.5em;
  vertical-align: middle;
  line-height: 1;
}
.cursor-blink {
  color: var(--color-accent-sky);
  animation: blink 1s step-end infinite;
}
@keyframes blink {
  50% {
    opacity: 0;
  }
}
.result-line {
  font-family: var(--font-display, 'Anybody', sans-serif);
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  text-align: right;
  min-height: 32px;
  margin-top: 4px;
}
.result-line.error {
  color: var(--color-accent-coral);
  font-size: 16px;
}

/* Popup */
.popup-overlay {
  position: absolute;
  inset: 0;
  z-index: 50;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.popup-box {
  width: 100%;
  max-width: 320px;
  background: #0d1520;
  border: 1px solid var(--color-border-default);
  border-radius: 8px;
  padding: 16px;
}
.popup-title {
  font-family: var(--font-display);
  font-weight: 700;
  color: #c8d6e5;
  margin-bottom: 12px;
  font-size: 14px;
}
.tool-item {
  display: block;
  width: 100%;
  text-align: left;
  padding: 10px 12px;
  border: none;
  border-bottom: 1px solid #16232f;
  background: none;
  color: #c8d6e5;
  font-size: 13px;
  cursor: pointer;
  font-family: inherit;
}
.tool-item:hover {
  background: #162232;
  color: var(--color-accent-sky);
}
.tool-item:last-child {
  border-bottom: none;
}
</style>
