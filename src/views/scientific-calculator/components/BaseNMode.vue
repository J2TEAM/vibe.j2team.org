<script setup lang="ts">
import { ref, computed } from 'vue'
import { getAngleMode } from '../engine'
import type { AngleMode } from '../types'
import CalcKeyboard from './CalcKeyboard.vue'

const kbRef = ref<InstanceType<typeof CalcKeyboard>>()

type Base = 'DEC' | 'HEX' | 'BIN' | 'OCT'
const base = ref<Base>('DEC')
const expr = ref('')
const cursor = ref(0)
const resultText = ref('')
const isResult = ref(false)
const isError = ref(false)
const showOptn = ref(false)

const angleMode = ref<AngleMode>(getAngleMode())

const DIGITS: Record<Base, string> = {
  BIN: '01',
  OCT: '01234567',
  DEC: '0123456789',
  HEX: '0123456789ABCDEF',
}

const undoStack = ref<{ e: string; c: number }[]>([])
const exprBefore = computed(() => expr.value.slice(0, cursor.value))
const exprAfter = computed(() => expr.value.slice(cursor.value))

function styledExpr(s: string) {
  return s.replace(/[×÷+\-−]/g, (m) => `<span class="op-sym">${m}</span>`)
}

function toSigned32(n: number): number {
  return n | 0
}

function parseLiteral(s: string): number {
  s = s.trim().toUpperCase()
  if (s.startsWith('0B') || s.startsWith('B')) return toSigned32(parseInt(s.replace(/^0?B/, ''), 2))
  if (s.startsWith('0O') || s.startsWith('O')) return toSigned32(parseInt(s.replace(/^0?O/, ''), 8))
  if (s.startsWith('0X') || s.startsWith('H'))
    return toSigned32(parseInt(s.replace(/^0?[XH]/, ''), 16))
  return toSigned32(parseInt(s, { DEC: 10, HEX: 16, BIN: 2, OCT: 8 }[base.value]))
}

function formatInBase(n: number, b: Base): string {
  const v = n >>> 0
  switch (b) {
    case 'BIN':
      return v.toString(2)
    case 'OCT':
      return v.toString(8)
    case 'HEX':
      return v.toString(16).toUpperCase()
    case 'DEC':
      return String(toSigned32(n))
  }
}

const converted = computed(() => {
  if (!resultText.value || isError.value) return null
  const n = parseInt(resultText.value, { DEC: 10, HEX: 16, BIN: 2, OCT: 8 }[base.value])
  if (isNaN(n)) return null
  return {
    DEC: String(toSigned32(n)),
    HEX: (n >>> 0).toString(16).toUpperCase(),
    BIN: (n >>> 0).toString(2),
    OCT: (n >>> 0).toString(8),
  }
})

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

function optnSwitchBase(b: Base) {
  switchBase(b)
  showOptn.value = false
}

function insert(text: string) {
  // Filter digits based on current base
  if (/^[0-9A-F]$/i.test(text) && !DIGITS[base.value].includes(text.toUpperCase())) return
  // Ignore CONST/CONV in Base-N
  if (text === 'CONST' || text === 'CONV') return

  if (isError.value) {
    expr.value = ''
    cursor.value = 0
    isError.value = false
  }
  if (isResult.value) {
    if (/^[0-9A-F]$/i.test(text)) {
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
  resultText.value = ''
  isResult.value = false
  isError.value = false
}

function doEval() {
  if (!expr.value.trim()) return
  try {
    let s = expr.value.toUpperCase()
    s = s
      .replace(/\bAND\b/g, '&')
      .replace(/\bOR\b/g, '|')
      .replace(/\bXOR\b/g, '^')
    s = s
      .replace(/\bXNOR\b/g, '~^')
      .replace(/\bNOT\b\s*/g, '~')
      .replace(/\bNEG\b\s*/g, '-')
    const tokens = s.match(/[~-]?[0-9A-F]+|[+\-*/&|^~()]/g)
    if (!tokens) throw new Error('Syntax Error')
    let result = 0,
      op = '+'
    for (const tok of tokens) {
      if ('+-*/&|^'.includes(tok)) {
        op = tok
        continue
      }
      if (tok === '~') {
        op = '~'
        continue
      }
      const val = parseLiteral(tok)
      switch (op) {
        case '+':
          result = toSigned32(result + val)
          break
        case '-':
          result = toSigned32(result - val)
          break
        case '*':
          result = toSigned32(result * val)
          break
        case '/':
          if (val === 0) throw new Error('Math Error')
          result = toSigned32(Math.trunc(result / val))
          break
        case '&':
          result = result & val
          break
        case '|':
          result = result | val
          break
        case '^':
          result = result ^ val
          break
        case '~':
          result = ~val
          op = '+'
          break
        default:
          result = val
      }
    }
    resultText.value = formatInBase(result, base.value)
    isError.value = false
    isResult.value = true
  } catch (err) {
    resultText.value = err instanceof Error ? err.message : 'Error'
    isError.value = true
    isResult.value = false
  }
}

function switchBase(b: Base) {
  if (resultText.value && !isError.value) {
    const n = parseInt(resultText.value, { DEC: 10, HEX: 16, BIN: 2, OCT: 8 }[base.value])
    base.value = b
    if (!isNaN(n)) resultText.value = formatInBase(n, b)
  } else {
    base.value = b
  }
}

// ALPHA inserts hex digits in Base-N mode
function onAlphaInput(v: string) {
  if ('ABCDEF'.includes(v) && base.value === 'HEX') insert(v)
}
function onStoreVar() {
  /* not used */
}

function onOptn() {
  showOptn.value = true
}
</script>

<template>
  <div class="basen-mode">
    <!-- ═══ DISPLAY ═══ -->
    <div class="calc-display">
      <div class="status-bar">
        <span class="st-angle">{{ 'DEC' }}</span>
        <span v-if="kbRef?.isShift" class="st-shift">S</span>
        <span v-if="kbRef?.isAlpha" class="st-alpha">A</span>
        <span v-if="kbRef?.isSto" class="st-shift">STO</span>
      </div>
      <div class="mode-bar">
        <span class="mode-label">BASE-N</span>
        <div class="base-tabs">
          <button
            v-for="b in ['DEC', 'HEX', 'BIN', 'OCT'] as Base[]"
            :key="b"
            :class="{ active: base === b }"
            @click="switchBase(b)"
          >
            {{ b }}
          </button>
        </div>
      </div>
      <div class="expr-line">
        <span v-html="styledExpr(exprBefore)"></span><span class="cursor-blink">│</span
        ><span v-html="styledExpr(exprAfter)"></span>
      </div>
      <div class="result-line" :class="{ error: isError }">{{ resultText || '—' }}</div>
    </div>

    <!-- Conversion table -->
    <div v-if="converted" class="conv-table">
      <div
        v-for="b in ['DEC', 'HEX', 'BIN', 'OCT'] as const"
        :key="b"
        class="conv-row"
        :class="{ active: base === b }"
      >
        <span class="conv-label">{{ b }}</span>
        <span class="conv-val">{{ converted[b] }}</span>
      </div>
    </div>

    <!-- ═══ OPTN Popup ═══ -->
    <div v-if="showOptn" class="popup-overlay" @click.self="showOptn = false">
      <div class="popup-box">
        <div class="popup-title">OPTN — Cơ số n</div>
        <button class="tool-item" @click="optnInsert(' AND ')">AND — Phép AND</button>
        <button class="tool-item" @click="optnInsert(' OR ')">OR — Phép OR</button>
        <button class="tool-item" @click="optnInsert(' XOR ')">XOR — Phép XOR</button>
        <button class="tool-item" @click="optnInsert(' XNOR ')">XNOR — Phép XNOR</button>
        <button class="tool-item" @click="optnInsert('NOT ')">NOT — Phép NOT</button>
        <button class="tool-item" @click="optnInsert('NEG ')">NEG — Đảo dấu</button>
        <button class="tool-item" @click="optnSwitchBase('DEC')">DEC — Thập phân</button>
        <button class="tool-item" @click="optnSwitchBase('HEX')">HEX — Thập lục phân</button>
        <button class="tool-item" @click="optnSwitchBase('BIN')">BIN — Nhị phân</button>
        <button class="tool-item" @click="optnSwitchBase('OCT')">OCT — Bát phân</button>
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
.basen-mode {
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
.base-tabs {
  display: flex;
  gap: 4px;
}
.base-tabs button {
  padding: 2px 6px;
  font-size: 9px;
  border: 1px solid var(--color-border-default);
  background: #131f2e;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-family: inherit;
  border-radius: 3px;
  font-weight: 600;
}
.base-tabs button.active {
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
  word-break: break-all;
}
.result-line.error {
  color: var(--color-accent-coral);
  font-size: 16px;
}

.conv-table {
  margin: 0 12px 6px;
}
.conv-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 8px;
  font-size: 11px;
  font-family: 'Courier New', monospace;
  color: var(--color-text-dim);
  border-bottom: 1px solid #16232f;
}
.conv-row.active {
  color: var(--color-accent-sky);
}
.conv-label {
  font-weight: 700;
  width: 36px;
}
.conv-val {
  text-align: right;
  word-break: break-all;
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
