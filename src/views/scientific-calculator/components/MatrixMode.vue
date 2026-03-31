<script setup lang="ts">
import { ref, computed } from 'vue'
import { formatResult, getAngleMode } from '../engine'
import type { AngleMode } from '../types'
import CalcKeyboard from './CalcKeyboard.vue'

const kbRef = ref<InstanceType<typeof CalcKeyboard>>()

type MatrixData = number[][]

const size = ref<[number, number]>([3, 3])
const matVars: Record<string, MatrixData> = {}
const editing = ref<string>('A')
const matData = ref<MatrixData>(createEmpty(3, 3))
const result = ref<MatrixData | null>(null)
const resultScalar = ref<string>('')
const expr = ref('')
const cursor = ref(0)
const isResult = ref(false)
const isError = ref(false)
const errorText = ref('')
const showEditor = ref(true)
const showOptn = ref(false)

const angleMode = ref<AngleMode>(getAngleMode())
const undoStack = ref<{ e: string; c: number }[]>([])

const exprBefore = computed(() => expr.value.slice(0, cursor.value))
const exprAfter = computed(() => expr.value.slice(cursor.value))

function styledExpr(s: string) {
  return s.replace(/[×÷+\-−]/g, (m) => `<span class="op-sym">${m}</span>`)
}

function createEmpty(rows: number, cols: number): MatrixData {
  return Array.from({ length: rows }, () => Array(cols).fill(0) as number[])
}

function setSize(rows: number, cols: number) {
  size.value = [rows, cols]
  matData.value = createEmpty(rows, cols)
}

function storeMatrix() {
  matVars[editing.value] = matData.value.map((r) => [...r])
}

function loadMatrix(name: string) {
  editing.value = name
  const m = matVars[name]
  if (m) {
    size.value = [m.length, m[0]!.length]
    matData.value = m.map((r) => [...r])
  } else {
    matData.value = createEmpty(size.value[0], size.value[1])
  }
}

function matAdd(a: MatrixData, b: MatrixData): MatrixData {
  if (a.length !== b.length || a[0]!.length !== b[0]!.length) throw new Error('Dimension Error')
  return a.map((row, i) => row.map((v, j) => v + b[i]![j]!))
}
function matSub(a: MatrixData, b: MatrixData): MatrixData {
  if (a.length !== b.length || a[0]!.length !== b[0]!.length) throw new Error('Dimension Error')
  return a.map((row, i) => row.map((v, j) => v - b[i]![j]!))
}
function matMul(a: MatrixData, b: MatrixData): MatrixData {
  if (a[0]!.length !== b.length) throw new Error('Dimension Error')
  const rows = a.length,
    cols = b[0]!.length,
    n = b.length
  const res = createEmpty(rows, cols)
  for (let i = 0; i < rows; i++)
    for (let j = 0; j < cols; j++) for (let k = 0; k < n; k++) res[i]![j]! += a[i]![k]! * b[k]![j]!
  return res
}
function matScalar(a: MatrixData, s: number): MatrixData {
  return a.map((row) => row.map((v) => v * s))
}
function matTranspose(a: MatrixData): MatrixData {
  const rows = a[0]!.length,
    cols = a.length
  return Array.from({ length: rows }, (_, i) => Array.from({ length: cols }, (_, j) => a[j]![i]!))
}
function matDet(a: MatrixData): number {
  const n = a.length
  if (n !== a[0]!.length) throw new Error('Not square')
  if (n === 1) return a[0]![0]!
  if (n === 2) return a[0]![0]! * a[1]![1]! - a[0]![1]! * a[1]![0]!
  let det = 0
  for (let j = 0; j < n; j++) {
    const minor = a.slice(1).map((row) => [...row.slice(0, j), ...row.slice(j + 1)])
    det += (j % 2 === 0 ? 1 : -1) * a[0]![j]! * matDet(minor)
  }
  return det
}
function matInverse(a: MatrixData): MatrixData {
  const n = a.length
  if (n !== a[0]!.length) throw new Error('Not square')
  const det = matDet(a)
  if (Math.abs(det) < 1e-12) throw new Error('Math Error')
  const aug = a.map((row, i) => [...row, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))])
  for (let i = 0; i < n; i++) {
    let maxRow = i
    for (let k = i + 1; k < n; k++)
      if (Math.abs(aug[k]![i]!) > Math.abs(aug[maxRow]![i]!)) maxRow = k
    ;[aug[i], aug[maxRow]] = [aug[maxRow]!, aug[i]!]
    const pivot = aug[i]![i]!
    if (Math.abs(pivot) < 1e-12) throw new Error('Math Error')
    for (let j = 0; j < 2 * n; j++) aug[i]![j]! /= pivot
    for (let k = 0; k < n; k++) {
      if (k === i) continue
      const f = aug[k]![i]!
      for (let j = 0; j < 2 * n; j++) aug[k]![j]! -= f * aug[i]![j]!
    }
  }
  return aug.map((row) => row.slice(n))
}
function matIdentity(n: number): MatrixData {
  return Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)))
}
function matAbs(a: MatrixData): MatrixData {
  return a.map((row) => row.map((v) => Math.abs(v)))
}

function getMatrix(name: string): MatrixData {
  const m = matVars[name]
  if (!m) throw new Error(`Mat${name} not defined`)
  return m
}

// Expression manipulation
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

function insert(text: string) {
  if (text === 'CONST' || text === 'CONV') return
  if (isError.value) {
    expr.value = ''
    cursor.value = 0
    isError.value = false
  }
  if (isResult.value) {
    pushUndo()
    expr.value = ''
    cursor.value = 0
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
  expr.value = expr.value.slice(0, cursor.value - 1) + expr.value.slice(cursor.value)
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
  result.value = null
  resultScalar.value = ''
  isResult.value = false
  isError.value = false
  errorText.value = ''
}

function doEval() {
  if (!expr.value.trim()) return
  try {
    const s = expr.value.trim()
    result.value = null
    resultScalar.value = ''
    isError.value = false

    const detMatch = s.match(/^Det\(Mat([A-D])\)$/i)
    if (detMatch) {
      resultScalar.value = formatResult(matDet(getMatrix(detMatch[1]!.toUpperCase())))
      isResult.value = true
      return
    }
    const trnMatch = s.match(/^Trn\(Mat([A-D])\)$/i)
    if (trnMatch) {
      result.value = matTranspose(getMatrix(trnMatch[1]!.toUpperCase()))
      isResult.value = true
      return
    }
    const idMatch = s.match(/^Identity\((\d)\)$/)
    if (idMatch) {
      result.value = matIdentity(parseInt(idMatch[1]!))
      isResult.value = true
      return
    }
    const invMatch = s.match(/^Mat([A-D])⁻¹$/i)
    if (invMatch) {
      result.value = matInverse(getMatrix(invMatch[1]!.toUpperCase()))
      isResult.value = true
      return
    }
    const sqMatch = s.match(/^Mat([A-D])²$/i)
    if (sqMatch) {
      const m = getMatrix(sqMatch[1]!.toUpperCase())
      result.value = matMul(m, m)
      isResult.value = true
      return
    }
    const absMatch = s.match(/^Abs\(Mat([A-D])\)$/i)
    if (absMatch) {
      result.value = matAbs(getMatrix(absMatch[1]!.toUpperCase()))
      isResult.value = true
      return
    }
    const scalarMatch = s.match(/^(\d+\.?\d*)\s*[×*]\s*Mat([A-D])$/i)
    if (scalarMatch) {
      result.value = matScalar(
        getMatrix(scalarMatch[2]!.toUpperCase()),
        parseFloat(scalarMatch[1]!),
      )
      isResult.value = true
      return
    }
    const binMatch = s.match(/^Mat([A-D])\s*([+\-×*])\s*Mat([A-D])$/i)
    if (binMatch) {
      const a = getMatrix(binMatch[1]!.toUpperCase()),
        b = getMatrix(binMatch[3]!.toUpperCase())
      switch (binMatch[2]) {
        case '+':
          result.value = matAdd(a, b)
          break
        case '-':
          result.value = matSub(a, b)
          break
        case '×':
        case '*':
          result.value = matMul(a, b)
          break
      }
      isResult.value = true
      return
    }
    const singleMatch = s.match(/^Mat([A-D])$/i)
    if (singleMatch) {
      result.value = getMatrix(singleMatch[1]!.toUpperCase())
      isResult.value = true
      return
    }
    throw new Error('Syntax Error')
  } catch (err) {
    isError.value = true
    errorText.value = err instanceof Error ? err.message : 'Error'
    result.value = null
    resultScalar.value = ''
  }
}

function onAlphaInput(v: string) {
  insert(v)
}
function onStoreVar() {
  /* not used */
}
function onOptn() {
  showOptn.value = true
}

const sizeOptions = [
  [1, 1],
  [1, 2],
  [1, 3],
  [1, 4],
  [2, 1],
  [2, 2],
  [2, 3],
  [2, 4],
  [3, 1],
  [3, 2],
  [3, 3],
  [3, 4],
  [4, 1],
  [4, 2],
  [4, 3],
  [4, 4],
]
const matNames = ['A', 'B', 'C', 'D']
</script>

<template>
  <div class="matrix-mode">
    <!-- ═══ DISPLAY (screen contains everything) ═══ -->
    <div class="calc-display">
      <div class="status-bar">
        <span class="st-angle" :class="{ highlight: angleMode !== 'DEG' }">{{ angleMode }}</span>
        <span v-if="kbRef?.isShift" class="st-shift">S</span>
        <span v-if="kbRef?.isAlpha" class="st-alpha">A</span>
        <span v-if="kbRef?.isSto" class="st-shift">STO</span>
      </div>
      <div class="mode-bar">
        <span class="mode-label">MATRIX</span>
        <button class="toggle-editor" @click="showEditor = !showEditor">
          {{ showEditor ? '▲ Ẩn' : '▼ Sửa' }}
        </button>
      </div>

      <!-- Matrix editor (collapsible, inside screen) -->
      <div v-if="showEditor" class="editor-panel">
        <div class="editor-header">
          <div class="mat-tabs">
            <button
              v-for="n in matNames"
              :key="n"
              :class="{ active: editing === n }"
              @click="loadMatrix(n)"
            >
              Mat{{ n }}
            </button>
          </div>
          <select
            @change="
              (e) => {
                const v = (e.target as HTMLSelectElement).value.split('x')
                setSize(+v[0]!, +v[1]!)
              }
            "
            :value="`${size[0]}x${size[1]}`"
            class="size-sel"
          >
            <option v-for="s in sizeOptions" :key="`${s[0]}x${s[1]}`" :value="`${s[0]}x${s[1]}`">
              {{ s[0] }}×{{ s[1] }}
            </option>
          </select>
        </div>
        <div class="mat-editor">
          <div v-for="(row, i) in matData" :key="i" class="mat-row">
            <input
              v-for="(_, j) in row"
              :key="j"
              v-model.number="matData[i]![j]!"
              type="number"
              class="mat-cell"
              step="any"
            />
          </div>
        </div>
        <button class="store-btn" @click="storeMatrix">Lưu Mat{{ editing }}</button>
      </div>

      <div class="expr-line">
        <span v-html="styledExpr(exprBefore)"></span><span class="cursor-blink">│</span
        ><span v-html="styledExpr(exprAfter)"></span>
      </div>
      <div v-if="isError" class="result-line error">{{ errorText }}</div>
      <div v-else-if="resultScalar" class="result-line">{{ resultScalar }}</div>

      <!-- Result matrix (inside screen) -->
      <div v-if="result" class="result-matrix">
        <div class="res-bracket">[</div>
        <div>
          <div v-for="(row, i) in result" :key="i" class="res-row">
            <span v-for="(v, j) in row" :key="j" class="res-cell">{{ formatResult(v) }}</span>
          </div>
        </div>
        <div class="res-bracket">]</div>
      </div>
    </div>

    <!-- ═══ OPTN Popup ═══ -->
    <div v-if="showOptn" class="popup-overlay" @click.self="showOptn = false">
      <div class="popup-box">
        <div class="popup-title">OPTN — Ma trận</div>
        <button v-for="n in matNames" :key="n" class="tool-item" @click="optnInsert(`Mat${n}`)">
          Mat{{ n }} — Chèn Mat{{ n }}
        </button>
        <button class="tool-item" @click="optnInsert('Det(')">Det — Định thức</button>
        <button class="tool-item" @click="optnInsert('Trn(')">Trn — Chuyển vị</button>
        <button class="tool-item" @click="optnInsert('Abs(')">Abs — Trị tuyệt đối</button>
        <button class="tool-item" @click="optnInsert('Identity(')">
          Identity — Ma trận đơn vị
        </button>
        <button class="tool-item" @click="optnInsert('⁻¹')">⁻¹ — Ma trận nghịch đảo</button>
        <button class="tool-item" @click="optnInsert('²')">² — Bình phương</button>
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
      @alpha-input="onAlphaInput"
      @store-var="onStoreVar"
      @optn="onOptn"
      @calc="doEval"
      @on="clearAll"
    />
  </div>
</template>

<style scoped>
.matrix-mode {
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
  min-height: 70px;
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
.toggle-editor {
  padding: 2px 8px;
  font-size: 9px;
  border: 1px solid var(--color-border-default);
  background: #131f2e;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-family: inherit;
  border-radius: 3px;
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
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  text-align: right;
  margin-top: 4px;
}
.result-line.error {
  color: var(--color-accent-coral);
  font-size: 14px;
}

/* Editor (inside screen) */
.editor-panel {
  margin-bottom: 8px;
  border-bottom: 1px solid #1a2d42;
  padding-bottom: 8px;
}
.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.mat-tabs {
  display: flex;
  gap: 4px;
}
.mat-tabs button {
  padding: 3px 6px;
  font-size: 9px;
  border: 1px solid var(--color-border-default);
  background: #131f2e;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-family: inherit;
  border-radius: 3px;
}
.mat-tabs button.active {
  background: #1e3a55;
  border-color: var(--color-accent-sky);
  color: var(--color-accent-sky);
}
.size-sel {
  background: #131f2e;
  border: 1px solid var(--color-border-default);
  color: #c8d6e5;
  padding: 3px;
  font-size: 10px;
  border-radius: 3px;
}
.mat-row {
  display: flex;
  gap: 3px;
  margin-bottom: 3px;
}
.mat-cell {
  flex: 1;
  background: #0a1218;
  border: 1px solid #1e2d42;
  color: #c8d6e5;
  text-align: center;
  padding: 6px 2px;
  font-size: 16px;
  font-family: 'Courier New', monospace;
  border-radius: 3px;
  width: 0;
}
.mat-cell:focus {
  border-color: var(--color-accent-sky);
  outline: none;
}
.store-btn {
  width: 100%;
  padding: 6px;
  background: #162232;
  border: 1px solid var(--color-border-default);
  color: var(--color-accent-sky);
  font-size: 11px;
  cursor: pointer;
  font-family: inherit;
  border-radius: 4px;
  margin-bottom: 4px;
}
.store-btn:hover {
  background: #1e3a55;
}

/* Result matrix (inside screen) */
.result-matrix {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  border-top: 1px solid #1a2d42;
  padding-top: 8px;
}
.res-bracket {
  font-size: 28px;
  color: var(--color-text-dim);
  font-weight: 300;
}
.res-row {
  display: flex;
  gap: 10px;
  padding: 2px 0;
}
.res-cell {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #c8d6e5;
  min-width: 40px;
  text-align: right;
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
