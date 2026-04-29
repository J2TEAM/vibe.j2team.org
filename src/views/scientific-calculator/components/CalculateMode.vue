<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  calc,
  convertUnit,
  cycleAngleMode,
  decToDMS,
  formatResult,
  getAngleMode,
  getVar,
  setVar,
  solve,
  toFraction,
  toMixedFraction,
  verify,
  SCIENTIFIC_CONSTANTS,
  UNIT_CONVERSIONS,
} from '../engine'
import type { AngleMode, HistoryEntry } from '../types'
import CalcKeyboard from './CalcKeyboard.vue'

const kbRef = ref<InstanceType<typeof CalcKeyboard>>()

// ── Expression State ──
const expr = ref('')
const cursor = ref(0)
const resultText = ref('0')
const isResult = ref(false)
const isError = ref(false)

// ── UI State ──
const angleMode = ref<AngleMode>(getAngleMode())
const showTools = ref(false)
const showVars = ref(false)
const showHist = ref(false)
const showConst = ref(false)
const showConv = ref(false)
const convResult = ref('')
const constFilter = ref('')
const convFilter = ref('')

// ── Result format ──
type Fmt = 'std' | 'frac' | 'mixed'
const fmt = ref<Fmt>('std')
const lastRaw = ref(0)

// ── Memory ──
const mem = ref(0)
const hasMem = ref(false)

// ── History ──
const history = ref<HistoryEntry[]>([])
const histIdx = ref(-1)

// ── Undo ──
const undoStack = ref<{ e: string; c: number }[]>([])

// ── Computed display ──
const exprBefore = computed(() => expr.value.slice(0, cursor.value))
const exprAfter = computed(() => expr.value.slice(cursor.value))

function styledExpr(s: string) {
  return s.replace(/[×÷+\-−]/g, (m) => `<span class="op-sym">${m}</span>`)
}

const formattedResult = computed(() => {
  if (isError.value || !isResult.value) return resultText.value
  const raw = lastRaw.value
  if (fmt.value === 'frac') {
    const f = toFraction(raw)
    if (f) return `${f.num}⁄${f.den}`
  } else if (fmt.value === 'mixed') {
    const m = toMixedFraction(raw)
    if (m) return `${m.whole} ${m.num}⁄${m.den}`
  }
  return resultText.value
})

// ── Multi-char tokens for smart deletion ──
const MULTI_TOKENS = [
  'sinh(',
  'cosh(',
  'tanh(',
  'asinh(',
  'acosh(',
  'atanh(',
  'asin(',
  'acos(',
  'atan(',
  'sin(',
  'cos(',
  'tan(',
  'sqrt(',
  'cbrt(',
  'log(',
  'ln(',
  'exp(',
  'abs(',
  'nPr(',
  'nCr(',
  'Rnd(',
  'PreAns',
  'Ans',
  '×10^',
  'mod',
  'SOLVE(',
  'DMS(',
  'GCD(',
  'LCM(',
  'Σ(',
  '∏(',
  'RanInt(',
  'Pol(',
  'Rec(',
  'random()',
].sort((a, b) => b.length - a.length)

// ── Expression manipulation ──
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

function toolInsert(text: string) {
  insert(text)
  showTools.value = false
}

function toolEval() {
  doEval()
  showTools.value = false
}

function toolVars() {
  showVars.value = true
  showTools.value = false
}

function toolAngle() {
  toggleAngle()
  showTools.value = false
}

function insert(text: string) {
  // Handle special keyboard triggers from SHIFT+7=CONST, SHIFT+8=CONV
  if (text === 'CONST') {
    showConst.value = true
    return
  }
  if (text === 'CONV') {
    showConv.value = true
    return
  }

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
  resultText.value = '0'
  isResult.value = false
  isError.value = false
  fmt.value = 'std'
}

// ── Evaluate ──
function doEval() {
  const s = expr.value.trim()
  if (!s) return
  const r = calc(s)
  if (r.ok) {
    history.value.unshift({ expr: s, result: r.value, raw: r.raw })
    if (history.value.length > 100) history.value.pop()
    resultText.value = r.value
    lastRaw.value = r.raw
    isResult.value = true
    isError.value = false
    fmt.value = 'std'
    histIdx.value = -1
  } else {
    resultText.value = r.error
    isError.value = true
    isResult.value = false
  }
}

// ── S⇔D format toggle ──
function toggleFmt() {
  if (!isResult.value) return
  const fmts: Fmt[] = ['std', 'frac', 'mixed']
  fmt.value = fmts[(fmts.indexOf(fmt.value) + 1) % fmts.length] as Fmt
}

// ── Angle mode ──
function toggleAngle() {
  angleMode.value = cycleAngleMode()
}

// ── Variables ──
const VAR_NAMES = ['A', 'B', 'C', 'D', 'E', 'F', 'X', 'Y', 'Z', 'M'] as const

function insertVar(n: string) {
  insert(n)
  showVars.value = false
}

function storeVar(n: string) {
  if (isResult.value) setVar(n, lastRaw.value)
  showVars.value = false
}

// ── Alpha input (from keyboard ALPHA modifier) ──
function onAlphaInput(varName: string) {
  insert(varName)
}

function onStoreVar(varName: string) {
  if (isResult.value) setVar(varName, lastRaw.value)
}

// ── Memory ──
function mAdd() {
  if (isResult.value) {
    mem.value += lastRaw.value
    hasMem.value = true
  }
}
function mSub() {
  if (isResult.value) {
    mem.value -= lastRaw.value
    hasMem.value = true
  }
}
function mRcl() {
  insert(String(mem.value))
}
function mClr() {
  mem.value = 0
  hasMem.value = false
}

// ── History navigation (D-pad up/down) ──
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

function loadHist(e: HistoryEntry) {
  expr.value = e.expr
  cursor.value = e.expr.length
  isResult.value = false
  isError.value = false
  showHist.value = false
}

// ── OPTN / TOOLS actions ──
function onOptn() {
  showTools.value = true
}

function doSolve() {
  showTools.value = false
  const r = solve(expr.value, 'X')
  if (r.ok) {
    resultText.value = `X = ${r.value}`
    lastRaw.value = r.raw
    isResult.value = true
    isError.value = false
    setVar('X', r.raw)
  } else {
    resultText.value = r.error
    isError.value = true
    isResult.value = false
  }
}

function doVerify() {
  showTools.value = false
  const r = verify(expr.value)
  if (r) {
    resultText.value = r.result ? 'TRUE' : 'FALSE'
    isResult.value = true
    isError.value = false
  } else {
    resultText.value = 'Syntax Error'
    isError.value = true
  }
}

function doDMS() {
  showTools.value = false
  if (isResult.value) resultText.value = decToDMS(lastRaw.value)
}

// ── Constants & Conversions ──
const filteredConsts = computed(() => {
  const q = constFilter.value.toLowerCase()
  return SCIENTIFIC_CONSTANTS.filter(
    (c) => !q || c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q),
  )
})
const constCategories = computed(() => {
  const map = new Map<string, typeof SCIENTIFIC_CONSTANTS>()
  for (const c of filteredConsts.value) {
    const arr = map.get(c.category) ?? []
    arr.push(c)
    map.set(c.category, arr)
  }
  return map
})

function insertConst(val: number) {
  insert(String(val))
  showConst.value = false
}

const filteredConvs = computed(() => {
  const q = convFilter.value.toLowerCase()
  return UNIT_CONVERSIONS.filter(
    (c) =>
      !q ||
      c.from.toLowerCase().includes(q) ||
      c.to.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q),
  )
})
const convCategories = computed(() => {
  const map = new Map<string, typeof UNIT_CONVERSIONS>()
  for (const c of filteredConvs.value) {
    const arr = map.get(c.category) ?? []
    arr.push(c)
    map.set(c.category, arr)
  }
  return map
})

function doConvert(from: string, to: string) {
  const v = isResult.value ? lastRaw.value : 0
  const r = convertUnit(v, from, to)
  if (r != null) {
    convResult.value = `${formatResult(v)} ${from} = ${formatResult(r)} ${to}`
    resultText.value = formatResult(r)
    lastRaw.value = r
    isResult.value = true
  }
}

// ── ON button: clear all ──
function onBtn() {
  clearAll()
}

// ── MENU: show history panel as substitute (parent handles mode switch) ──
function onMenu() {
  showHist.value = !showHist.value
}
</script>

<template>
  <div class="calc-mode">
    <!-- ═══ DISPLAY ═══ -->
    <div class="calc-display">
      <div class="status-bar">
        <span class="st-angle" :class="{ highlight: angleMode !== 'DEG' }">{{ angleMode }}</span>
        <span v-if="kbRef?.isShift" class="st-shift">S</span>
        <span v-if="kbRef?.isAlpha" class="st-alpha">A</span>
        <span v-if="kbRef?.isSto" class="st-shift">STO</span>
        <span v-if="hasMem" class="st-mem">M</span>
        <span class="flex-1" />
        <button class="st-btn" @click="showHist = !showHist">
          {{ showHist ? '✕' : 'HIST' }}
        </button>
      </div>

      <template v-if="!showHist">
        <div class="expr-line">
          <span v-html="styledExpr(exprBefore)"></span><span class="cursor-blink">│</span
          ><span v-html="styledExpr(exprAfter)"></span>
        </div>
        <div class="result-line" :class="{ error: isError }">
          {{ formattedResult }}
        </div>
      </template>

      <div v-else class="hist-panel">
        <p v-if="history.length === 0" class="empty-hist">Chưa có lịch sử</p>
        <button v-for="(h, i) in history" :key="i" class="hist-entry" @click="loadHist(h)">
          <div class="hist-expr">{{ h.expr }}</div>
          <div class="hist-result">{{ h.result }}</div>
        </button>
      </div>
    </div>

    <!-- ═══ VAR Popup ═══ -->
    <div v-if="showVars" class="popup-overlay" @click.self="showVars = false">
      <div class="popup-box">
        <div class="popup-title">Biến số</div>
        <div class="var-grid">
          <button
            v-for="n in VAR_NAMES"
            :key="n"
            class="var-cell"
            @click="insertVar(n)"
            @contextmenu.prevent="storeVar(n)"
          >
            <span class="var-letter">{{ n }}</span>
            <span class="var-val">{{ getVar(n)?.toFixed(4) ?? '—' }}</span>
          </button>
        </div>
        <p v-if="isResult" class="store-hint">Chuột phải / nhấn giữ để lưu kết quả</p>
        <div class="popup-actions">
          <button class="popup-action" @click="mAdd">M+</button>
          <button class="popup-action" @click="mSub">M−</button>
          <button class="popup-action" @click="mRcl">MR</button>
          <button class="popup-action" @click="mClr">MC</button>
        </div>
      </div>
    </div>

    <!-- ═══ TOOLS Popup ═══ -->
    <div v-if="showTools" class="popup-overlay" @click.self="showTools = false">
      <div class="popup-box">
        <div class="popup-title">OPTN — Công cụ</div>
        <button class="tool-item" @click="toolEval()">CALC — Tính biểu thức</button>
        <button class="tool-item" @click="doSolve">SOLVE — Giải phương trình (X)</button>
        <button class="tool-item" @click="doVerify">VERIFY — Kiểm tra đẳng thức</button>
        <button class="tool-item" @click="doDMS">DMS — Chuyển đổi độ phút giây</button>
        <button class="tool-item" @click="toolInsert('GCD(')">GCD — Ước chung lớn nhất</button>
        <button class="tool-item" @click="toolInsert('LCM(')">LCM — Bội chung nhỏ nhất</button>
        <button class="tool-item" @click="toolInsert('Σ(')">Σ — Tổng sigma</button>
        <button class="tool-item" @click="toolInsert('∏(')">∏ — Tích product</button>
        <button class="tool-item" @click="toolInsert('RanInt(')">
          RanInt — Số nguyên ngẫu nhiên
        </button>
        <button class="tool-item" @click="toolInsert('%')">% — Phần trăm</button>
        <button class="tool-item" @click="toolInsert(' mod ')">mod — Phép chia dư</button>
        <button class="tool-item" @click="toolVars()">VAR — Biến số / Bộ nhớ</button>
        <button class="tool-item" @click="toolAngle()">Đơn vị góc: {{ angleMode }}</button>
      </div>
    </div>

    <!-- ═══ CONST Popup ═══ -->
    <div v-if="showConst" class="popup-overlay" @click.self="showConst = false">
      <div class="popup-box popup-scroll">
        <div class="popup-title">Hằng số khoa học</div>
        <input v-model="constFilter" class="popup-filter" placeholder="Tìm kiếm..." />
        <template v-for="[cat, items] in constCategories" :key="cat">
          <div class="popup-cat">{{ cat }}</div>
          <button
            v-for="c in items"
            :key="c.symbol"
            class="const-item"
            @click="insertConst(c.value)"
          >
            <span class="const-sym">{{ c.symbol }}</span>
            <span class="const-name">{{ c.name }}</span>
            <span class="const-val">{{ c.value.toExponential(4) }}</span>
          </button>
        </template>
      </div>
    </div>

    <!-- ═══ CONV Popup ═══ -->
    <div v-if="showConv" class="popup-overlay" @click.self="showConv = false">
      <div class="popup-box popup-scroll">
        <div class="popup-title">Chuyển đổi đơn vị</div>
        <input v-model="convFilter" class="popup-filter" placeholder="Tìm kiếm..." />
        <div v-if="convResult" class="conv-result">{{ convResult }}</div>
        <template v-for="[cat, items] in convCategories" :key="cat">
          <div class="popup-cat">{{ cat }}</div>
          <button
            v-for="c in items"
            :key="`${c.from}-${c.to}`"
            class="conv-item"
            @click="doConvert(c.from, c.to)"
          >
            {{ c.from }} → {{ c.to }}
          </button>
        </template>
      </div>
    </div>

    <!-- ═══ SHARED KEYBOARD ═══ -->
    <CalcKeyboard
      ref="kbRef"
      :angle-mode="angleMode"
      :has-mem="hasMem"
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
      @toggle-fmt="toggleFmt"
      @alpha-input="onAlphaInput"
      @store-var="onStoreVar"
      @optn="onOptn"
      @calc="doEval"
      @menu="onMenu"
      @on="onBtn"
      @mem-add="mAdd"
      @mem-sub="mSub"
      @mem-recall="mRcl"
      @hist-up="histUp"
      @hist-down="histDown"
    />
  </div>
</template>

<style scoped>
.calc-mode {
  display: flex;
  flex-direction: column;
  position: relative;
}

/* ══════════ DISPLAY ══════════ */
.calc-display {
  margin: 10px 12px 6px;
  padding: 14px 14px 10px;
  background: #0a1218;
  border: 2px solid #1a2d42;
  border-radius: 8px;
  min-height: 100px;
}

.status-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  color: var(--color-text-dim);
  margin-bottom: 8px;
}
.st-angle {
  font-weight: 600;
}
.st-angle.highlight {
  color: var(--color-accent-sky);
}
.st-mem {
  color: #fbbf24;
}
.st-shift {
  color: #fbbf24;
  font-weight: 700;
}
.st-alpha {
  color: #ff4444;
  font-weight: 700;
}
.st-btn {
  background: none;
  border: 1px solid var(--color-border-default);
  color: var(--color-text-dim);
  padding: 2px 6px;
  font-size: 9px;
  cursor: pointer;
  font-family: inherit;
}
.st-btn:hover {
  color: var(--color-text-secondary);
  border-color: var(--color-text-dim);
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
  font-size: 28px;
  font-weight: 700;
  color: #ffffff;
  text-align: right;
  min-height: 36px;
  margin-top: 4px;
  overflow-x: auto;
  white-space: nowrap;
}
.result-line.error {
  color: var(--color-accent-coral);
  font-size: 20px;
}

/* ── History ── */
.hist-panel {
  max-height: 120px;
  overflow-y: auto;
}
.empty-hist {
  text-align: center;
  color: var(--color-text-dim);
  font-size: 12px;
  padding: 16px 0;
}
.hist-entry {
  display: block;
  width: 100%;
  text-align: right;
  padding: 6px 0;
  border: none;
  background: none;
  cursor: pointer;
  font-family: inherit;
  border-bottom: 1px solid #16232f;
}
.hist-entry:hover {
  background: #0d1a26;
}
.hist-expr {
  font-size: 10px;
  color: var(--color-text-dim);
}
.hist-result {
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 700;
  color: var(--color-accent-sky);
}

/* ══════════ POPUPS ══════════ */
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
.store-hint {
  font-size: 10px;
  color: var(--color-text-dim);
  text-align: center;
  margin: 8px 0;
}
.var-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
  margin-bottom: 12px;
}
.var-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 4px;
  border: 1px solid var(--color-border-default);
  background: #162232;
  cursor: pointer;
  font-family: inherit;
  border-radius: 4px;
}
.var-cell:hover {
  border-color: var(--color-accent-sky);
}
.var-letter {
  font-weight: 700;
  color: var(--color-accent-sky);
  font-size: 14px;
}
.var-val {
  font-size: 9px;
  color: var(--color-text-dim);
  margin-top: 2px;
}
.popup-actions {
  display: flex;
  gap: 6px;
}
.popup-action {
  flex: 1;
  padding: 8px;
  border: 1px solid var(--color-border-default);
  background: #162232;
  color: #fbbf24;
  font-weight: 600;
  font-size: 12px;
  cursor: pointer;
  font-family: inherit;
  border-radius: 4px;
}
.popup-action:hover {
  border-color: #fbbf24;
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

/* ── Popup scroll / filter ── */
.popup-scroll {
  max-height: 80vh;
  overflow-y: auto;
}
.popup-filter {
  width: 100%;
  padding: 6px 8px;
  margin-bottom: 8px;
  background: #0a1218;
  border: 1px solid var(--color-border-default);
  color: #c8d6e5;
  font-size: 16px;
  border-radius: 4px;
  font-family: inherit;
}
.popup-filter:focus {
  border-color: var(--color-accent-sky);
  outline: none;
}
.popup-cat {
  font-size: 10px;
  color: var(--color-accent-sky);
  font-weight: 700;
  margin: 6px 0 2px;
  text-transform: uppercase;
}
.const-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 8px;
  border: none;
  border-bottom: 1px solid #16232f;
  background: none;
  color: #c8d6e5;
  font-size: 11px;
  cursor: pointer;
  font-family: inherit;
  text-align: left;
}
.const-item:hover {
  background: #162232;
}
.const-sym {
  font-weight: 700;
  color: var(--color-accent-sky);
  min-width: 28px;
}
.const-name {
  flex: 1;
  color: var(--color-text-secondary);
}
.const-val {
  font-family: 'Courier New', monospace;
  font-size: 10px;
  color: var(--color-text-dim);
}
.conv-item {
  display: inline-block;
  padding: 6px 10px;
  margin: 2px;
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
  background: #131f2e;
  color: #c8d6e5;
  font-size: 11px;
  cursor: pointer;
  font-family: inherit;
}
.conv-item:hover {
  background: #1e3a55;
  border-color: var(--color-accent-sky);
  color: var(--color-accent-sky);
}
.conv-result {
  background: #0a1218;
  border: 1px solid #1e3a55;
  border-radius: 4px;
  padding: 8px;
  margin-bottom: 8px;
  font-size: 12px;
  color: var(--color-accent-sky);
  text-align: center;
  font-family: 'Courier New', monospace;
}
</style>
