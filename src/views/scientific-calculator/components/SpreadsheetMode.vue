<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { calc } from '../engine'

// ── Grid config ──
const COLS = 5 // A–E
const ROWS = 45
const colLetters = Array.from({ length: COLS }, (_, i) => String.fromCharCode(65 + i))

// ── Cell data: raw input strings ──
const cells = ref<string[][]>(
  Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => '')),
)

// ── Active cell ──
const activeRow = ref(0)
const activeCol = ref(0)
const editing = ref(false)
const editInput = ref<HTMLInputElement | null>(null)

// ── Scroll anchor ──
const gridBody = ref<HTMLDivElement | null>(null)

// ── Cell addressing ──
function cellId(r: number, c: number): string {
  return `${colLetters[c]}${r + 1}`
}

// ── Resolve cell references & evaluate formula ──
// Pattern: A1, B12, etc. (case-insensitive)
const cellRefRe = /\b([A-Ea-e])(\d{1,2})\b/g

function resolveRefs(expr: string, visited: Set<string>): string {
  return expr.replace(cellRefRe, (match, colStr: string, rowStr: string) => {
    const c = colStr.toUpperCase().charCodeAt(0) - 65
    const r = parseInt(rowStr, 10) - 1
    if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return 'NaN'
    const id = cellId(r, c)
    if (visited.has(id)) return 'NaN' // circular
    visited.add(id)
    const raw = cells.value[r]?.[c] ?? ''
    if (raw === '') return '0'
    if (raw.startsWith('=')) {
      const inner = resolveRefs(raw.slice(1), visited)
      const result = calc(inner)
      return result.ok ? String(result.raw) : 'NaN'
    }
    const n = parseFloat(raw)
    return isFinite(n) ? String(n) : 'NaN'
  })
}

// ── Built-in spreadsheet functions ──
// SUM(A1:A5), AVERAGE(A1:A5), MIN(A1:A5), MAX(A1:A5), COUNT(A1:A5)
const funcRe = /\b(SUM|AVERAGE|AVG|MIN|MAX|COUNT)\(([A-Ea-e])(\d{1,2}):([A-Ea-e])(\d{1,2})\)/gi

function expandFunctions(expr: string, visited: Set<string>): string {
  return expr.replace(
    funcRe,
    (_, fn: string, c1s: string, r1s: string, c2s: string, r2s: string) => {
      const c1 = c1s.toUpperCase().charCodeAt(0) - 65
      const c2 = c2s.toUpperCase().charCodeAt(0) - 65
      const r1 = parseInt(r1s, 10) - 1
      const r2 = parseInt(r2s, 10) - 1

      const rMin = Math.min(r1, r2),
        rMax = Math.max(r1, r2)
      const cMin = Math.min(c1, c2),
        cMax = Math.max(c1, c2)

      const vals: number[] = []
      for (let r = rMin; r <= rMax; r++) {
        for (let c = cMin; c <= cMax; c++) {
          if (r < 0 || r >= ROWS || c < 0 || c >= COLS) continue
          const id = cellId(r, c)
          if (visited.has(id)) continue
          visited.add(id)
          const raw = cells.value[r]?.[c] ?? ''
          if (raw === '') continue
          let v: number
          if (raw.startsWith('=')) {
            const inner = resolveRefs(expandFunctions(raw.slice(1), new Set(visited)), visited)
            const result = calc(inner)
            v = result.ok ? result.raw : NaN
          } else {
            v = parseFloat(raw)
          }
          if (isFinite(v)) vals.push(v)
        }
      }

      const name = fn.toUpperCase()
      if (vals.length === 0) return '0'
      if (name === 'SUM') return String(vals.reduce((a, b) => a + b, 0))
      if (name === 'AVERAGE' || name === 'AVG')
        return String(vals.reduce((a, b) => a + b, 0) / vals.length)
      if (name === 'MIN') return String(Math.min(...vals))
      if (name === 'MAX') return String(Math.max(...vals))
      if (name === 'COUNT') return String(vals.length)
      return '0'
    },
  )
}

// ── Evaluate a cell ──
function evalCell(r: number, c: number): string {
  const raw = cells.value[r]?.[c] ?? ''
  if (raw === '') return ''
  if (!raw.startsWith('=')) {
    const n = parseFloat(raw)
    if (isFinite(n)) return fmtNum(n)
    return raw // text
  }
  const visited = new Set<string>()
  visited.add(cellId(r, c))
  let expr = raw.slice(1)
  expr = expandFunctions(expr, visited)
  expr = resolveRefs(expr, visited)
  const result = calc(expr)
  if (result.ok) return fmtNum(result.raw)
  return 'ERR'
}

function fmtNum(v: number): string {
  if (!isFinite(v) || isNaN(v)) return 'ERR'
  if (Math.abs(v) < 1e-12) return '0'
  if (Math.abs(v) >= 1e9) return v.toExponential(3)
  const s = parseFloat(v.toPrecision(10)).toString()
  return s
}

// ── All evaluated values (cached) ──
const evaluated = computed(() => cells.value.map((row, r) => row.map((_, c) => evalCell(r, c))))

// ── Editing ──
function startEdit(r: number, c: number) {
  activeRow.value = r
  activeCol.value = c
  editing.value = true
  nextTick(() => editInput.value?.focus())
}

function finishEdit() {
  editing.value = false
}

function onCellKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === 'Tab') {
    e.preventDefault()
    finishEdit()
    // Move down on Enter, right on Tab
    if (e.key === 'Enter' && activeRow.value < ROWS - 1) {
      activeRow.value++
    } else if (e.key === 'Tab' && activeCol.value < COLS - 1) {
      activeCol.value++
    }
    nextTick(() => startEdit(activeRow.value, activeCol.value))
  } else if (e.key === 'Escape') {
    finishEdit()
  }
}

function selectCell(r: number, c: number) {
  if (editing.value) finishEdit()
  activeRow.value = r
  activeCol.value = c
}

// ── Navigation arrows (when not editing) ──
function onGridKeydown(e: KeyboardEvent) {
  if (editing.value) return
  const { key } = e
  if (key === 'ArrowUp' && activeRow.value > 0) {
    e.preventDefault()
    activeRow.value--
  } else if (key === 'ArrowDown' && activeRow.value < ROWS - 1) {
    e.preventDefault()
    activeRow.value++
  } else if (key === 'ArrowLeft' && activeCol.value > 0) {
    e.preventDefault()
    activeCol.value--
  } else if (key === 'ArrowRight' && activeCol.value < COLS - 1) {
    e.preventDefault()
    activeCol.value++
  } else if (key === 'Enter' || key === 'F2') {
    e.preventDefault()
    startEdit(activeRow.value, activeCol.value)
  } else if (key === 'Delete' || key === 'Backspace') {
    e.preventDefault()
    const row = cells.value[activeRow.value]
    if (row) row[activeCol.value] = ''
  }
}

// ── Clear all ──
function clearAll() {
  cells.value = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => ''))
  activeRow.value = 0
  activeCol.value = 0
  editing.value = false
}

// ── Ensure active cell is visible ──
watch([activeRow, activeCol], () => {
  nextTick(() => {
    const el = document.querySelector('.ss-grid .cell.active')
    el?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  })
})
</script>

<template>
  <div class="ss-mode" @keydown="onGridKeydown" tabindex="0">
    <!-- Formula bar -->
    <div class="formula-bar">
      <span class="cell-addr">{{ cellId(activeRow, activeCol) }}</span>
      <span class="fx-icon">fx</span>
      <input
        ref="editInput"
        class="formula-input"
        :value="cells[activeRow]?.[activeCol] ?? ''"
        @input="
          (e) => {
            const row = cells[activeRow]
            if (row) row[activeCol] = (e.target as HTMLInputElement).value
          }
        "
        @keydown="onCellKeydown"
        @focus="editing = true"
        @blur="finishEdit"
        placeholder="Nhập giá trị hoặc =công thức"
      />
    </div>

    <!-- Grid -->
    <div class="ss-grid" ref="gridBody">
      <!-- Header row -->
      <div class="grid-row header-row">
        <div class="row-num corner"></div>
        <div v-for="c in colLetters" :key="c" class="col-hdr">{{ c }}</div>
      </div>

      <!-- Data rows -->
      <div v-for="r in ROWS" :key="r" class="grid-row">
        <div class="row-num" :class="{ 'active-num': activeRow === r - 1 }">{{ r }}</div>
        <div
          v-for="(cl, ci) in colLetters"
          :key="cl"
          class="cell"
          :class="{
            active: activeRow === r - 1 && activeCol === ci,
            'has-formula': (cells[r - 1]?.[ci] ?? '').startsWith('='),
            'err-cell': evaluated[r - 1]?.[ci] === 'ERR',
          }"
          @click="selectCell(r - 1, ci)"
          @dblclick="startEdit(r - 1, ci)"
        >
          <span class="cell-text">{{ evaluated[r - 1]?.[ci] ?? '' }}</span>
        </div>
      </div>
    </div>

    <!-- Bottom bar -->
    <div class="bottom-bar">
      <button class="act-btn act-clear" @click="clearAll">AC</button>
      <div class="hint">Nhấp đúp hoặc Enter để sửa • =SUM(A1:A5)</div>
    </div>
  </div>
</template>

<style scoped>
.ss-mode {
  display: flex;
  flex-direction: column;
  height: 480px;
  outline: none;
}

/* ── Formula bar ── */
.formula-bar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 8px;
  border-bottom: 1px solid #1a2d42;
  background: #0a1218;
  flex-shrink: 0;
}
.cell-addr {
  font-family: var(--font-display, 'Anybody', sans-serif);
  font-size: 11px;
  font-weight: 700;
  color: var(--color-accent-sky);
  min-width: 32px;
  text-align: center;
  padding: 3px 6px;
  background: #0d1520;
  border: 1px solid #1e2d42;
  border-radius: 3px;
}
.fx-icon {
  font-size: 10px;
  font-style: italic;
  color: #3a5060;
  font-family: serif;
  flex-shrink: 0;
}
.formula-input {
  flex: 1;
  min-width: 0;
  padding: 4px 6px;
  background: #0d1520;
  border: 1px solid #1e2d42;
  border-radius: 3px;
  color: #c8d6e5;
  font-family: var(--font-display, 'Anybody', sans-serif);
  font-size: 16px;
  font-weight: 600;
  outline: none;
}
.formula-input:focus {
  border-color: var(--color-accent-sky);
}
.formula-input::placeholder {
  color: #2a3d52;
  font-weight: 400;
}

/* ── Grid ── */
.ss-grid {
  flex: 1;
  overflow: auto;
  scrollbar-width: thin;
  scrollbar-color: #1e2d42 transparent;
}

.grid-row {
  display: flex;
  border-bottom: 1px solid #111e2d;
}
.header-row {
  position: sticky;
  top: 0;
  z-index: 2;
  background: #0a1218;
  border-bottom: 1px solid #1a2d42;
}
.row-num {
  width: 30px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 600;
  color: #3a5060;
  background: #0a1218;
  border-right: 1px solid #152030;
  position: sticky;
  left: 0;
  z-index: 1;
}
.row-num.active-num {
  color: var(--color-accent-sky);
}
.corner {
  background: #0a1218;
  z-index: 3;
}
.col-hdr {
  flex: 1;
  min-width: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 5px 0;
  font-family: var(--font-display, 'Anybody', sans-serif);
  font-size: 10px;
  font-weight: 700;
  color: var(--color-accent-sky);
  border-right: 1px solid #152030;
}

/* ── Cells ── */
.cell {
  flex: 1;
  min-width: 70px;
  min-height: 28px;
  display: flex;
  align-items: center;
  padding: 0 5px;
  border-right: 1px solid #111e2d;
  cursor: cell;
  user-select: none;
  transition: background 0.08s;
}
.cell:hover {
  background: #111e2d;
}
.cell.active {
  background: #162840;
  outline: 2px solid var(--color-accent-sky);
  outline-offset: -2px;
  z-index: 1;
}
.cell.has-formula .cell-text {
  color: #7dd3fc;
}
.cell.err-cell .cell-text {
  color: var(--color-accent-coral);
}

.cell-text {
  font-family: var(--font-display, 'Anybody', sans-serif);
  font-size: 12px;
  font-weight: 600;
  color: #c8d6e5;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

/* ── Bottom bar ── */
.bottom-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border-top: 1px solid #1a2d42;
  background: #0a1218;
  flex-shrink: 0;
}
.act-btn {
  padding: 6px 14px;
  font-family: var(--font-display, 'Anybody', sans-serif);
  font-weight: 700;
  font-size: 11px;
  border: 1px solid #1e2d42;
  border-radius: 4px;
  cursor: pointer;
  touch-action: manipulation;
}
.act-btn:active {
  transform: scale(0.96);
}
.act-clear {
  background: #1a1015;
  color: var(--color-accent-coral);
}
.act-clear:hover {
  border-color: var(--color-accent-coral);
}
.hint {
  font-size: 9px;
  color: #3a5060;
  flex: 1;
  text-align: right;
}
</style>
