<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import type { AngleMode } from '../types'

// ── Props ──
defineProps<{
  angleMode: AngleMode
  hasMem?: boolean
}>()

// ── Emits ──
const emit = defineEmits<{
  insert: [text: string]
  delete: []
  clear: []
  eval: []
  undo: []
  moveLeft: []
  moveRight: []
  moveHome: []
  moveEnd: []
  toggleShift: []
  toggleAngle: []
  toggleFmt: []
  /** alpha-input: user pressed ALPHA then a key → emit the variable name */
  alphaInput: [varName: string]
  /** STO then a key → emit the variable to store into */
  storeVar: [varName: string]
  /** OPTN pressed */
  optn: []
  /** CALC pressed */
  calc: []
  /** MENU pressed → parent shows mode selector */
  menu: []
  /** M+ */
  memAdd: []
  /** M- */
  memSub: []
  /** SHIFT+RCL → recall */
  memRecall: []
  /** ON pressed */
  on: []
  /** History navigation (up/down in D-pad) */
  histUp: []
  histDown: []
}>()

// ── Internal state ──
const isShift = ref(false)
const isAlpha = ref(false)
const isSto = ref(false)

defineExpose({ isShift, isAlpha, isSto })

function toggleShift() {
  isShift.value = !isShift.value
  isAlpha.value = false
  isSto.value = false
  emit('toggleShift')
}

function toggleAlpha() {
  isAlpha.value = !isAlpha.value
  isShift.value = false
  isSto.value = false
}

function activateSto() {
  // STO: next key press stores result into that variable
  isSto.value = true
  isShift.value = false
  isAlpha.value = false
}

// ── Alpha key mapping (red labels) ──
// Pressing ALPHA then a key types the red-labeled variable
const ALPHA_MAP: Record<string, string> = {
  // Row 3 function keys
  '(-)': 'A',
  '°′″': 'B',
  'x⁻¹': 'C',
  sin: 'D',
  cos: 'E',
  tan: 'F',
  // Row 4
  STO: '', // STO has no alpha
  ENG: '',
  '(': 'X',
  ')': 'Y',
  'S⇔D': 'Z',
  'M+': 'M',
  // Number keys (for hex digits in Base-N, and variable access)
  '7': '',
  '8': '',
  '9': '',
  '4': '',
  '5': '',
  '6': '',
  '1': '',
  '2': '',
  '3': '',
  '0': '',
  '·': '',
  '×10ˣ': 'e', // ALPHA+×10ˣ = e (Euler's number)
  Ans: '',
  '=': '',
}

// ── Button type ──
type Btn = {
  label: string
  shift?: string // shift label (yellow)
  alpha?: string // alpha label (red)
  action: () => void
  shiftAction?: () => void
  alphaAction?: () => void
  cls?: string
}

function press(b: Btn) {
  // STO mode: if a button has alpha label, store to that variable
  if (isSto.value) {
    const varName = b.alpha || ALPHA_MAP[b.label]
    if (varName && varName.length === 1 && /[A-Z]/.test(varName)) {
      emit('storeVar', varName)
    }
    isSto.value = false
    return
  }
  // ALPHA mode: if button has alpha mapping, emit variable name
  if (isAlpha.value) {
    const varName = b.alpha || ALPHA_MAP[b.label]
    if (varName) {
      emit('alphaInput', varName)
    }
    isAlpha.value = false
    return
  }
  // SHIFT mode
  if (isShift.value && b.shiftAction) {
    b.shiftAction()
    isShift.value = false
    return
  }
  // Normal press
  b.action()
  isShift.value = false
}

// ═══════════════════════════════════════
// Button Layout
// ═══════════════════════════════════════

// Row 1 left: OPTN / CALC — right: ∫ / x
const row1L: Btn[] = [
  {
    label: 'OPTN',
    shift: 'SOLVE',
    action: () => emit('optn'),
    shiftAction: () => {
      emit('insert', 'SOLVE(')
      isShift.value = false
    },
    cls: 'btn-fn',
  },
  {
    label: 'CALC',
    action: () => emit('calc'),
    cls: 'btn-fn',
  },
]
const row1R: Btn[] = [
  {
    label: '∫',
    shift: 'd/dx',
    action: () => emit('insert', '∫('),
    shiftAction: () => emit('insert', 'd/dx('),
    cls: 'btn-fn',
  },
  {
    label: 'x',
    action: () => emit('insert', 'X'),
    cls: 'btn-fn',
  },
]

// Row 2: fraction / √ / x² / x^n / log / ln
const row2: Btn[] = [
  { label: 'a⁄b', shift: '⇔', action: () => emit('toggleFmt'), cls: 'btn-fn' },
  {
    label: '√',
    shift: '³√',
    action: () => emit('insert', 'sqrt('),
    shiftAction: () => emit('insert', 'cbrt('),
    cls: 'btn-fn',
  },
  {
    label: 'x²',
    shift: 'x³',
    action: () => emit('insert', '^2'),
    shiftAction: () => emit('insert', '^3'),
    cls: 'btn-fn',
  },
  {
    label: 'xⁿ',
    shift: 'ⁿ√x',
    action: () => emit('insert', '^'),
    shiftAction: () => emit('insert', '^(1/'),
    cls: 'btn-fn',
  },
  {
    label: 'log',
    shift: '10ˣ',
    action: () => emit('insert', 'log('),
    shiftAction: () => emit('insert', '10^'),
    cls: 'btn-fn',
  },
  {
    label: 'ln',
    shift: 'eˣ',
    action: () => emit('insert', 'ln('),
    shiftAction: () => emit('insert', 'exp('),
    cls: 'btn-fn',
  },
]

// Row 3: (−) / ° ' " / x⁻¹ / sin / cos / tan
const row3: Btn[] = [
  {
    label: '(−)',
    shift: 'FACT',
    alpha: 'A',
    action: () => emit('insert', '(-)'),
    shiftAction: () => emit('insert', '!'),
    cls: 'btn-fn',
  },
  {
    label: '° ′ ″',
    shift: 'DMS',
    alpha: 'B',
    action: () => emit('insert', '°'),
    shiftAction: () => emit('insert', 'DMS('),
    cls: 'btn-fn',
  },
  {
    label: 'x⁻¹',
    shift: 'x!',
    alpha: 'C',
    action: () => emit('insert', '^(-1)'),
    shiftAction: () => emit('insert', '!'),
    cls: 'btn-fn',
  },
  {
    label: 'sin',
    shift: 'sin⁻¹',
    alpha: 'D',
    action: () => emit('insert', 'sin('),
    shiftAction: () => emit('insert', 'asin('),
    cls: 'btn-fn',
  },
  {
    label: 'cos',
    shift: 'cos⁻¹',
    alpha: 'E',
    action: () => emit('insert', 'cos('),
    shiftAction: () => emit('insert', 'acos('),
    cls: 'btn-fn',
  },
  {
    label: 'tan',
    shift: 'tan⁻¹',
    alpha: 'F',
    action: () => emit('insert', 'tan('),
    shiftAction: () => emit('insert', 'atan('),
    cls: 'btn-fn',
  },
]

// Row 4: STO / ENG / ( / ) / S⇔D / M+
const row4: Btn[] = [
  {
    label: 'STO',
    shift: 'RCL',
    action: activateSto,
    shiftAction: () => emit('memRecall'),
    cls: 'btn-fn',
  },
  {
    label: 'ENG',
    shift: 'Abs',
    action: () => emit('insert', 'E'),
    shiftAction: () => emit('insert', 'abs('),
    cls: 'btn-fn',
  },
  {
    label: '(',
    shift: ',',
    alpha: 'X',
    action: () => emit('insert', '('),
    shiftAction: () => emit('insert', ','),
    cls: 'btn-fn',
  },
  { label: ')', alpha: 'Y', action: () => emit('insert', ')'), cls: 'btn-fn' },
  { label: 'S⇔D', alpha: 'Z', action: () => emit('toggleFmt'), cls: 'btn-fn' },
  {
    label: 'M+',
    shift: 'M−',
    alpha: 'M',
    action: () => emit('memAdd'),
    shiftAction: () => emit('memSub'),
    cls: 'btn-fn',
  },
]

// Number rows (5 columns)
const numRows: Btn[][] = [
  // Row 5: 7 8 9 DEL AC
  [
    {
      label: '7',
      shift: 'CONST',
      action: () => emit('insert', '7'),
      shiftAction: () => emit('insert', 'CONST'),
      cls: 'btn-num',
    },
    {
      label: '8',
      shift: 'CONV',
      action: () => emit('insert', '8'),
      shiftAction: () => emit('insert', 'CONV'),
      cls: 'btn-num',
    },
    { label: '9', shift: 'RESET', action: () => emit('insert', '9'), cls: 'btn-num' },
    {
      label: 'DEL',
      shift: 'INS',
      action: () => emit('delete'),
      shiftAction: () => emit('undo'),
      cls: 'btn-del',
    },
    { label: 'AC', shift: 'OFF', action: () => emit('clear'), cls: 'btn-ac' },
  ],
  // Row 6: 4 5 6 × ÷
  [
    { label: '4', action: () => emit('insert', '4'), cls: 'btn-num' },
    { label: '5', action: () => emit('insert', '5'), cls: 'btn-num' },
    { label: '6', action: () => emit('insert', '6'), cls: 'btn-num' },
    {
      label: '×',
      shift: 'nPr',
      action: () => emit('insert', '×'),
      shiftAction: () => emit('insert', 'nPr('),
      cls: 'btn-op',
    },
    {
      label: '÷',
      shift: 'nCr',
      action: () => emit('insert', '÷'),
      shiftAction: () => emit('insert', 'nCr('),
      cls: 'btn-op',
    },
  ],
  // Row 7: 1 2 3 + −
  [
    { label: '1', action: () => emit('insert', '1'), cls: 'btn-num' },
    { label: '2', action: () => emit('insert', '2'), cls: 'btn-num' },
    { label: '3', action: () => emit('insert', '3'), cls: 'btn-num' },
    {
      label: '+',
      shift: 'Pol(',
      action: () => emit('insert', '+'),
      shiftAction: () => emit('insert', 'Pol('),
      cls: 'btn-op',
    },
    {
      label: '−',
      shift: 'Rec(',
      action: () => emit('insert', '-'),
      shiftAction: () => emit('insert', 'Rec('),
      cls: 'btn-op',
    },
  ],
  // Row 8: 0 . ×10ˣ Ans =
  [
    { label: '0', shift: 'Rnd', action: () => emit('insert', '0'), cls: 'btn-num' },
    {
      label: '·',
      shift: 'Ran#',
      action: () => emit('insert', '.'),
      shiftAction: () => emit('insert', 'random()'),
      cls: 'btn-num',
    },
    {
      label: '×10ˣ',
      shift: 'π',
      alpha: 'e',
      action: () => emit('insert', '×10^'),
      shiftAction: () => emit('insert', 'π'),
      cls: 'btn-num btn-exp',
    },
    {
      label: 'Ans',
      shift: 'PreAns',
      action: () => emit('insert', 'Ans'),
      shiftAction: () => emit('insert', 'PreAns'),
      cls: 'btn-num btn-exp',
    },
    {
      label: '=',
      shift: '≈',
      action: () => emit('eval'),
      shiftAction: () => emit('eval'),
      cls: 'btn-exe',
    },
  ],
]

// ── Physical keyboard handler ──
function onKey(e: KeyboardEvent) {
  if (e.ctrlKey && e.key === 'z') {
    emit('undo')
    e.preventDefault()
    return
  }
  if (e.ctrlKey || e.metaKey || e.altKey) return
  const k = e.key
  if (/^\d$/.test(k)) {
    emit('insert', k)
    e.preventDefault()
  } else if (k === '.') {
    emit('insert', '.')
    e.preventDefault()
  } else if (k === '+') {
    emit('insert', '+')
    e.preventDefault()
  } else if (k === '-') {
    emit('insert', '-')
    e.preventDefault()
  } else if (k === '*') {
    emit('insert', '×')
    e.preventDefault()
  } else if (k === '/') {
    emit('insert', '÷')
    e.preventDefault()
  } else if (k === '(') {
    emit('insert', '(')
    e.preventDefault()
  } else if (k === ')') {
    emit('insert', ')')
    e.preventDefault()
  } else if (k === '^') {
    emit('insert', '^')
    e.preventDefault()
  } else if (k === '!') {
    emit('insert', '!')
    e.preventDefault()
  } else if (k === 'Enter' || k === '=') {
    emit('eval')
    e.preventDefault()
  } else if (k === 'Backspace') {
    emit('delete')
    e.preventDefault()
  } else if (k === 'ArrowLeft') {
    emit('moveLeft')
    e.preventDefault()
  } else if (k === 'ArrowRight') {
    emit('moveRight')
    e.preventDefault()
  } else if (k === 'Home') {
    emit('moveHome')
    e.preventDefault()
  } else if (k === 'End') {
    emit('moveEnd')
    e.preventDefault()
  } else if (k === 'Escape') {
    emit('clear')
    e.preventDefault()
  }
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="btn-grid">
    <!-- ── Top control row: SHIFT / ALPHA / D-pad / MENU / ON ── -->
    <div class="control-row">
      <button
        :class="['cb', 'btn-ctrl', 'btn-round', isShift ? 'active-shift' : '']"
        @click="toggleShift"
      >
        <span class="ctrl-lbl">SHIFT</span>
      </button>
      <button
        :class="['cb', 'btn-ctrl', 'btn-round', isAlpha ? 'active-alpha' : '']"
        @click="toggleAlpha"
      >
        <span class="ctrl-lbl">ALPHA</span>
      </button>

      <!-- D-pad -->
      <div class="dpad">
        <button class="dpad-btn dpad-up" @click="emit('histUp')">▲</button>
        <button class="dpad-btn dpad-left" @click="emit('moveLeft')">◀︎</button>
        <button class="dpad-btn dpad-right" @click="emit('moveRight')">▶︎</button>
        <button class="dpad-btn dpad-down" @click="emit('histDown')">▼</button>
        <div class="dpad-center" />
      </div>

      <button class="cb btn-ctrl btn-round" @click="emit('menu')">
        <span class="ctrl-lbl">MENU</span>
      </button>
      <button class="cb btn-ctrl btn-round" @click="emit('on')">
        <span class="ctrl-lbl">ON</span>
      </button>
    </div>

    <!-- ── Row 1: OPTN CALC | ∫ x ── -->
    <div class="btn-row fn-row">
      <div v-for="b in row1L" :key="b.label" class="btn-wrap">
        <div class="lbl-row">
          <span v-if="b.shift && !isShift" class="sl">{{ b.shift }}</span>
        </div>
        <button :class="['cb', b.cls]" @click="press(b)">
          {{ isShift && b.shift ? b.shift : b.label }}
        </button>
      </div>
      <div class="fn-spacer" />
      <div v-for="b in row1R" :key="b.label" class="btn-wrap">
        <div class="lbl-row">
          <span v-if="b.shift && !isShift" class="sl">{{ b.shift }}</span>
        </div>
        <button :class="['cb', b.cls]" @click="press(b)">
          {{ isShift && b.shift ? b.shift : b.label }}
        </button>
      </div>
    </div>

    <!-- ── Row 2–4: 6-column scientific rows ── -->
    <div v-for="(row, i) in [row2, row3, row4]" :key="'r' + i" class="btn-row sci-row">
      <div v-for="b in row" :key="b.label" class="btn-wrap">
        <div class="lbl-row">
          <span v-if="b.shift && !isShift" class="sl">{{ b.shift }}</span>
          <span v-if="b.alpha" class="al">{{ b.alpha }}</span>
        </div>
        <button :class="['cb', b.cls]" @click="press(b)">
          {{ isShift && b.shift ? b.shift : b.label }}
        </button>
      </div>
    </div>

    <!-- ── Separator ── -->
    <div class="sep" />

    <!-- ── Number rows: 5 columns ── -->
    <div v-for="(row, i) in numRows" :key="'n' + i" class="btn-row num-row">
      <div v-for="b in row" :key="b.label" class="btn-wrap">
        <div class="lbl-row">
          <span v-if="b.shift && !isShift" class="sl">{{ b.shift }}</span>
          <span v-if="b.alpha" class="al">{{ b.alpha }}</span>
        </div>
        <button :class="['cb', b.cls]" @click="press(b)">
          <span :class="{ 'shift-lbl': isShift && b.shift }">{{
            isShift && b.shift ? b.shift : b.label
          }}</span>
        </button>
      </div>
    </div>

    <!-- Keyboard hint -->
    <p class="kbd-hint">Phím: số, phép tính, Enter, ←→, Esc, Ctrl+Z</p>
  </div>
</template>

<style scoped>
/* ══════════ BUTTON GRID ══════════ */
.btn-grid {
  padding: 4px 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* ── Control row: SHIFT / ALPHA / D-pad / MENU / ON ── */
.control-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 6px 4px 4px;
}
.btn-ctrl {
  width: 36px;
  height: 36px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0;
  padding: 0;
  flex-shrink: 0;
}
.btn-round {
  border-radius: 50% !important;
  border: 1px solid var(--color-border-default);
  background: #131f2e;
  cursor: pointer;
  touch-action: manipulation;
  transition:
    background 0.1s,
    border-color 0.1s;
}
.btn-round:hover {
  background: #1a2d42;
}
.btn-round.active-shift {
  background: #2a2508;
  border-color: #fbbf24;
}
.btn-round.active-alpha {
  background: #2a1518;
  border-color: #ff4444;
}
.ctrl-lbl {
  font-family: var(--font-display, 'Anybody', sans-serif);
  font-size: 8px;
  font-weight: 700;
  color: var(--color-text-secondary);
  line-height: 1;
}

/* ── D-pad ── */
.dpad {
  position: relative;
  width: 110px;
  height: 110px;
  flex-shrink: 0;
  background: radial-gradient(circle, #131f2e 30%, #0d1820 70%);
  border-radius: 50%;
  border: 2px solid #1e2d42;
}
.dpad-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #1a2d42;
  border: 1px solid var(--color-border-default);
}
.dpad-btn {
  position: absolute;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: #6b8299;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: manipulation;
  padding: 0;
}
.dpad-btn:hover {
  color: var(--color-accent-sky);
}
.dpad-up {
  top: 4px;
  left: 50%;
  transform: translateX(-50%);
}
.dpad-down {
  bottom: 4px;
  left: 50%;
  transform: translateX(-50%);
}
.dpad-left {
  left: 4px;
  top: 50%;
  transform: translateY(-50%);
}
.dpad-right {
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
}

/* ── Generic button ── */
.cb {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display, 'Anybody', sans-serif);
  font-weight: 600;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
  transition: all 0.1s ease;
}
.cb:active {
  transform: scale(0.93);
}

/* Button wrapper: labels above button */
.btn-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
}
.lbl-row {
  display: flex;
  justify-content: space-between;
  width: 100%;
  height: 12px;
  padding: 0 2px;
  box-sizing: border-box;
  line-height: 12px;
  align-items: flex-end;
}
.btn-wrap .cb {
  width: 100%;
}

/* Shift label (yellow, above-left) */
.sl {
  font-size: 8px;
  color: #fbbf24;
  font-weight: 700;
  opacity: 0.85;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Alpha label (red, above-right) */
.al {
  font-size: 8px;
  color: #ff4444;
  font-weight: 700;
  opacity: 0.85;
  margin-left: auto;
}

/* ── Function row (OPTN/CALC | ∫ x) ── */
.fn-row {
  display: flex;
  gap: 3px;
  align-items: flex-end;
}
.fn-row > .btn-wrap {
  flex: 1;
}
.fn-spacer {
  flex: 1;
}

.btn-fn {
  padding: 4px 4px;
  font-size: 12px;
  background: #131f2e;
  color: var(--color-text-secondary);
  border: 1px solid #1e2d42;
  border-radius: 4px;
  min-width: 0;
}
.btn-fn:hover {
  background: #1a2d42;
  border-color: #3a5a7a;
}

/* ── 6-column scientific rows ── */
.sci-row {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 3px;
}
.sci-row .btn-fn {
  padding: 6px 2px;
  font-size: 13px;
}

/* ── Separator ── */
.sep {
  border-top: 1px solid #1a2d42;
  margin: 3px 0;
}

/* ── 5-column number rows ── */
.num-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 4px;
}
.num-row .cb {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  box-sizing: border-box;
}
.shift-lbl {
  font-size: 13px;
}

.btn-num {
  font-size: 20px;
  font-weight: 700;
  background: #1e2d3d;
  color: #ffffff;
  border: 1px solid #2a3d52;
  border-radius: 5px;
}
.btn-num:hover {
  background: #263b4f;
  border-color: #3a5a7a;
}

.btn-exp {
  font-size: 13px;
  font-weight: 600;
}

.btn-op {
  font-size: 40px;
  font-weight: 700;
  background: #162232;
  color: var(--color-accent-sky);
  border: 1px solid #1e3a55;
  border-radius: 5px;
}
.btn-op:hover {
  background: #1a3a55;
  border-color: var(--color-accent-sky);
}

.btn-del {
  font-size: 15px;
  font-weight: 700;
  background: #162848;
  color: #60a5fa;
  border: 1px solid #1e3a65;
  border-radius: 5px;
}
.btn-del:hover {
  background: #1e3a65;
  border-color: #60a5fa;
}

.btn-ac {
  font-size: 15px;
  font-weight: 700;
  background: #162848;
  color: #60a5fa;
  border: 1px solid #1e3a65;
  border-radius: 5px;
}
.btn-ac:hover {
  background: #1e3a65;
  border-color: #60a5fa;
}

.btn-exe {
  font-size: 20px;
  font-weight: 800;
  background: var(--color-accent-sky);
  color: #0a1520;
  border: 1px solid #5cc8fa;
  border-radius: 5px;
}
.btn-exe:hover {
  background: #5cc8fa;
}
.btn-exe:active {
  background: #2a9bd8;
}

/* ── Keyboard hint ── */
.kbd-hint {
  text-align: center;
  font-size: 9px;
  color: #3a5060;
  padding: 6px;
  display: none;
}
@media (min-width: 640px) {
  .kbd-hint {
    display: block;
  }
}
</style>
