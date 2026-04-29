<script setup lang="ts">
import { ref, computed } from 'vue'
import { formatResult, getAngleMode } from '../engine'
import type { AngleMode } from '../types'
import CalcKeyboard from './CalcKeyboard.vue'

const kbRef = ref<InstanceType<typeof CalcKeyboard>>()

type Vec = number[]

const dim = ref<2 | 3>(3)
const vctVars: Record<string, Vec> = {}
const editing = ref('A')
const vctData = ref<Vec>([0, 0, 0])
const result = ref<Vec | null>(null)
const resultScalar = ref('')
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

function setDim(d: 2 | 3) {
  dim.value = d
  vctData.value = d === 2 ? [0, 0] : [0, 0, 0]
}
function storeVector() {
  vctVars[editing.value] = [...vctData.value]
}
function loadVector(name: string) {
  editing.value = name
  const v = vctVars[name]
  if (v) {
    dim.value = v.length as 2 | 3
    vctData.value = [...v]
  } else {
    vctData.value = dim.value === 2 ? [0, 0] : [0, 0, 0]
  }
}

function getVec(name: string): Vec {
  const v = vctVars[name]
  if (!v) throw new Error(`Vct${name} not defined`)
  return v
}
function vecAdd(a: Vec, b: Vec): Vec {
  if (a.length !== b.length) throw new Error('Dimension Error')
  return a.map((v, i) => v + b[i]!)
}
function vecSub(a: Vec, b: Vec): Vec {
  if (a.length !== b.length) throw new Error('Dimension Error')
  return a.map((v, i) => v - b[i]!)
}
function vecScalar(a: Vec, s: number): Vec {
  return a.map((v) => v * s)
}
function vecDot(a: Vec, b: Vec): number {
  if (a.length !== b.length) throw new Error('Dimension Error')
  return a.reduce((sum, v, i) => sum + v * b[i]!, 0)
}
function vecCross(a: Vec, b: Vec): Vec {
  if (a.length !== 3 || b.length !== 3) throw new Error('Dimension Error')
  return [
    a[1]! * b[2]! - a[2]! * b[1]!,
    a[2]! * b[0]! - a[0]! * b[2]!,
    a[0]! * b[1]! - a[1]! * b[0]!,
  ]
}
function vecMag(a: Vec): number {
  return Math.sqrt(a.reduce((s, v) => s + v * v, 0))
}
function vecAngle(a: Vec, b: Vec): number {
  const d = vecDot(a, b)
  const ma = vecMag(a)
  const mb = vecMag(b)
  if (ma < 1e-12 || mb < 1e-12) throw new Error('Math Error')
  return (Math.acos(Math.max(-1, Math.min(1, d / (ma * mb)))) * 180) / Math.PI
}
function vecUnit(a: Vec): Vec {
  const m = vecMag(a)
  if (m < 1e-12) throw new Error('Math Error')
  return a.map((v) => v / m)
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

    const absMatch = s.match(/^Abs\(Vct([A-D])\)$/i)
    if (absMatch) {
      resultScalar.value = formatResult(vecMag(getVec(absMatch[1]!.toUpperCase())))
      isResult.value = true
      return
    }
    const angMatch = s.match(/^Angle\(Vct([A-D]),\s*Vct([A-D])\)$/i)
    if (angMatch) {
      resultScalar.value =
        formatResult(
          vecAngle(getVec(angMatch[1]!.toUpperCase()), getVec(angMatch[2]!.toUpperCase())),
        ) + '°'
      isResult.value = true
      return
    }
    const unitMatch = s.match(/^UnitV\(Vct([A-D])\)$/i)
    if (unitMatch) {
      result.value = vecUnit(getVec(unitMatch[1]!.toUpperCase()))
      isResult.value = true
      return
    }
    const dotMatch = s.match(/^DotP\(Vct([A-D]),\s*Vct([A-D])\)$/i)
    if (dotMatch) {
      resultScalar.value = formatResult(
        vecDot(getVec(dotMatch[1]!.toUpperCase()), getVec(dotMatch[2]!.toUpperCase())),
      )
      isResult.value = true
      return
    }
    const crossMatch = s.match(/^CrossP\(Vct([A-D]),\s*Vct([A-D])\)$/i)
    if (crossMatch) {
      result.value = vecCross(
        getVec(crossMatch[1]!.toUpperCase()),
        getVec(crossMatch[2]!.toUpperCase()),
      )
      isResult.value = true
      return
    }
    const scMatch = s.match(/^(\d+\.?\d*)\s*[×*]\s*Vct([A-D])$/i)
    if (scMatch) {
      result.value = vecScalar(getVec(scMatch[2]!.toUpperCase()), parseFloat(scMatch[1]!))
      isResult.value = true
      return
    }
    const binMatch = s.match(/^Vct([A-D])\s*([+-])\s*Vct([A-D])$/i)
    if (binMatch) {
      const a = getVec(binMatch[1]!.toUpperCase()),
        b = getVec(binMatch[3]!.toUpperCase())
      result.value = binMatch[2] === '+' ? vecAdd(a, b) : vecSub(a, b)
      isResult.value = true
      return
    }
    const singleMatch = s.match(/^Vct([A-D])$/i)
    if (singleMatch) {
      result.value = getVec(singleMatch[1]!.toUpperCase())
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

const dimLabels = ['x', 'y', 'z']
const vctNames = ['A', 'B', 'C', 'D']
</script>

<template>
  <div class="vector-mode">
    <!-- ═══ DISPLAY ═══ -->
    <div class="calc-display">
      <div class="status-bar">
        <span class="st-angle" :class="{ highlight: angleMode !== 'DEG' }">{{ angleMode }}</span>
        <span v-if="kbRef?.isShift" class="st-shift">S</span>
        <span v-if="kbRef?.isAlpha" class="st-alpha">A</span>
        <span v-if="kbRef?.isSto" class="st-shift">STO</span>
      </div>
      <div class="mode-bar">
        <span class="mode-label">VECTOR</span>
        <div class="dim-switch">
          <button :class="{ active: dim === 2 }" @click="setDim(2)">2D</button>
          <button :class="{ active: dim === 3 }" @click="setDim(3)">3D</button>
        </div>
        <button class="toggle-editor" @click="showEditor = !showEditor">
          {{ showEditor ? '▲ Ẩn' : '▼ Sửa' }}
        </button>
      </div>
      <div class="expr-line">
        <span v-html="styledExpr(exprBefore)"></span><span class="cursor-blink">│</span
        ><span v-html="styledExpr(exprAfter)"></span>
      </div>
      <div v-if="isError" class="result-line error">{{ errorText }}</div>
      <div v-else-if="resultScalar" class="result-line">{{ resultScalar }}</div>
    </div>

    <!-- Vector editor (collapsible) -->
    <div v-if="showEditor" class="editor-panel">
      <div class="vct-tabs">
        <button
          v-for="n in vctNames"
          :key="n"
          :class="{ active: editing === n }"
          @click="loadVector(n)"
        >
          Vct{{ n }}
        </button>
      </div>
      <div class="vct-editor">
        <div v-for="(_, i) in vctData" :key="i" class="vct-field">
          <label>{{ dimLabels[i] }}</label>
          <input v-model.number="vctData[i]" type="number" step="any" />
        </div>
      </div>
      <button class="store-btn" @click="storeVector">Lưu Vct{{ editing }}</button>
    </div>

    <!-- Result vector -->
    <div v-if="result" class="result-vec">
      <span class="res-paren">(</span>
      <span v-for="(v, i) in result" :key="i" class="res-comp">
        {{ formatResult(v) }}<span v-if="i < result.length - 1" class="res-sep">,</span>
      </span>
      <span class="res-paren">)</span>
    </div>

    <!-- ═══ OPTN Popup ═══ -->
    <div v-if="showOptn" class="popup-overlay" @click.self="showOptn = false">
      <div class="popup-box">
        <div class="popup-title">OPTN — Véc-tơ</div>
        <button v-for="n in vctNames" :key="n" class="tool-item" @click="optnInsert(`Vct${n}`)">
          Vct{{ n }} — Chèn Vct{{ n }}
        </button>
        <button class="tool-item" @click="optnInsert('DotP(')">DotP — Tích vô hướng</button>
        <button class="tool-item" @click="optnInsert('CrossP(')">CrossP — Tích có hướng</button>
        <button class="tool-item" @click="optnInsert('Abs(')">Abs — Độ lớn |v|</button>
        <button class="tool-item" @click="optnInsert('Angle(')">Angle — Góc giữa 2 véc-tơ</button>
        <button class="tool-item" @click="optnInsert('UnitV(')">UnitV — Véc-tơ đơn vị</button>
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
.vector-mode {
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
  gap: 8px;
}
.mode-label {
  font-family: var(--font-display);
  font-size: 10px;
  font-weight: 700;
  color: var(--color-accent-sky);
}
.dim-switch {
  display: flex;
  gap: 4px;
}
.dim-switch button {
  padding: 2px 8px;
  font-size: 9px;
  border: 1px solid var(--color-border-default);
  background: #131f2e;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-family: inherit;
  border-radius: 3px;
}
.dim-switch button.active {
  background: #1e3a55;
  border-color: var(--color-accent-sky);
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
  margin-left: auto;
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

/* Editor */
.editor-panel {
  padding: 0 12px 6px;
}
.vct-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 6px;
}
.vct-tabs button {
  padding: 3px 6px;
  font-size: 9px;
  border: 1px solid var(--color-border-default);
  background: #131f2e;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-family: inherit;
  border-radius: 3px;
  flex: 1;
}
.vct-tabs button.active {
  background: #1e3a55;
  border-color: var(--color-accent-sky);
  color: var(--color-accent-sky);
}
.vct-editor {
  display: flex;
  gap: 6px;
  margin-bottom: 6px;
}
.vct-field {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  flex: 1;
}
.vct-field label {
  font-size: 10px;
  color: var(--color-text-dim);
  font-weight: 600;
}
.vct-field input {
  width: 100%;
  background: #0a1218;
  border: 1px solid #1e2d42;
  color: #c8d6e5;
  text-align: center;
  padding: 8px 4px;
  font-size: 16px;
  font-family: 'Courier New', monospace;
  border-radius: 3px;
}
.vct-field input:focus {
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

/* Result vector */
.result-vec {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 0 12px 6px;
  background: #0a1218;
  border: 1px solid #1e2d42;
  border-radius: 8px;
  padding: 12px;
  font-family: 'Courier New', monospace;
  font-size: 15px;
  color: #c8d6e5;
}
.res-paren {
  font-size: 22px;
  color: var(--color-text-dim);
}
.res-sep {
  color: var(--color-text-dim);
  margin-right: 8px;
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
