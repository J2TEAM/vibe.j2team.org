<script setup lang="ts">
import { ref, computed } from 'vue'
import { calc } from '../engine'

const fExpr = ref('')
const gExpr = ref('')
const startVal = ref(0)
const endVal = ref(10)
const stepVal = ref(1)

const hasG = ref(false)

type Row = { x: string; fx: string; gx?: string; err: boolean }
const rows = ref<Row[]>([])
const tableError = ref('')

function generate() {
  const f = fExpr.value.trim()
  if (!f) {
    tableError.value = 'Nhập hàm f(x)'
    return
  }

  const start = startVal.value
  const end = endVal.value
  const step = stepVal.value

  if (step === 0) {
    tableError.value = 'Bước nhảy không được bằng 0'
    return
  }
  if ((end - start) / step < 0) {
    tableError.value = 'Bước nhảy không hợp lệ'
    return
  }
  if (Math.abs((end - start) / step) > 1000) {
    tableError.value = 'Quá nhiều giá trị (tối đa 1000)'
    return
  }

  tableError.value = ''
  const result: Row[] = []
  const g = hasG.value ? gExpr.value.trim() : ''

  for (let x = start; step > 0 ? x <= end + 1e-12 : x >= end - 1e-12; x += step) {
    const xRounded = Math.round(x * 1e10) / 1e10
    const exprF = f.replace(/x/gi, `(${xRounded})`)
    const rF = calc(exprF)

    let gxStr: string | undefined
    if (g) {
      const exprG = g.replace(/x/gi, `(${xRounded})`)
      const rG = calc(exprG)
      gxStr = rG.ok ? formatVal(rG.raw) : 'Err'
    }

    result.push({
      x: formatVal(xRounded),
      fx: rF.ok ? formatVal(rF.raw) : 'Err',
      gx: gxStr,
      err: !rF.ok,
    })
  }

  rows.value = result
}

function formatVal(v: number): string {
  if (Number.isInteger(v) && Math.abs(v) < 1e12) return String(v)
  const s = v.toPrecision(8)
  if (s.includes('.') && !s.includes('e')) return s.replace(/0+$/, '').replace(/\.$/, '')
  return s
}

function clearAll() {
  fExpr.value = ''
  gExpr.value = ''
  startVal.value = 0
  endVal.value = 10
  stepVal.value = 1
  rows.value = []
  tableError.value = ''
}

const showInput = computed(() => rows.value.length === 0)
</script>

<template>
  <div class="tbl-mode">
    <!-- Input form -->
    <div v-if="showInput" class="input-section">
      <div class="field">
        <label>f(x) =</label>
        <input
          v-model="fExpr"
          type="text"
          placeholder="vd: x^2 + 2x + 1"
          class="expr-input"
          @keydown.enter="generate"
        />
      </div>

      <div class="g-toggle">
        <button class="toggle-btn" :class="{ active: hasG }" @click="hasG = !hasG">
          {{ hasG ? '− Bỏ g(x)' : '+ Thêm g(x)' }}
        </button>
      </div>

      <div v-if="hasG" class="field">
        <label>g(x) =</label>
        <input
          v-model="gExpr"
          type="text"
          placeholder="vd: 2x - 3"
          class="expr-input"
          @keydown.enter="generate"
        />
      </div>

      <div class="range-row">
        <div class="range-field">
          <label>Bắt đầu</label>
          <input v-model.number="startVal" type="number" class="num-input" inputmode="decimal" />
        </div>
        <div class="range-field">
          <label>Kết thúc</label>
          <input v-model.number="endVal" type="number" class="num-input" inputmode="decimal" />
        </div>
        <div class="range-field">
          <label>Bước</label>
          <input v-model.number="stepVal" type="number" class="num-input" inputmode="decimal" />
        </div>
      </div>

      <div v-if="tableError" class="err">{{ tableError }}</div>

      <div class="actions">
        <button class="act-btn act-clear" @click="clearAll">AC</button>
        <button class="act-btn act-gen" @click="generate">Tạo bảng</button>
      </div>
    </div>

    <!-- Results table -->
    <div v-else class="result-section">
      <div class="result-header">
        <div class="result-info">
          <span class="fn-label">f(x) = {{ fExpr }}</span>
          <span v-if="hasG && gExpr" class="fn-label">g(x) = {{ gExpr }}</span>
        </div>
        <button class="back-btn" @click="rows = []">Sửa</button>
      </div>

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>x</th>
              <th>f(x)</th>
              <th v-if="hasG">g(x)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, i) in rows" :key="i" :class="{ 'row-err': r.err }">
              <td class="col-x">{{ r.x }}</td>
              <td class="col-val">{{ r.fx }}</td>
              <td v-if="hasG" class="col-val">{{ r.gx }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="result-footer">
        <span class="row-count">{{ rows.length }} giá trị</span>
        <button class="act-btn act-clear" @click="clearAll">AC</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tbl-mode {
  display: flex;
  flex-direction: column;
}

/* ── Input section ── */
.input-section {
  padding: 16px;
}

.field {
  margin-bottom: 12px;
}
.field label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-dim);
  margin-bottom: 4px;
  font-family: var(--font-display, 'Anybody', sans-serif);
}

.expr-input {
  width: 100%;
  padding: 10px 12px;
  background: #0a1218;
  border: 1px solid #1e2d42;
  border-radius: 6px;
  color: #ffffff;
  font-family: 'Courier New', monospace;
  font-size: 16px;
  outline: none;
  transition: border-color 0.15s;
}
.expr-input:focus {
  border-color: var(--color-accent-sky);
}
.expr-input::placeholder {
  color: #2a3d52;
}

.g-toggle {
  margin-bottom: 12px;
}
.toggle-btn {
  background: none;
  border: 1px dashed var(--color-border-default);
  color: var(--color-text-dim);
  padding: 6px 12px;
  font-size: 11px;
  font-family: inherit;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.15s;
}
.toggle-btn:hover,
.toggle-btn.active {
  color: var(--color-accent-sky);
  border-color: var(--color-accent-sky);
}

.range-row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.range-field {
  flex: 1;
}
.range-field label {
  display: block;
  font-size: 10px;
  font-weight: 600;
  color: var(--color-text-dim);
  margin-bottom: 4px;
}
.num-input {
  width: 100%;
  padding: 8px 6px;
  background: #0a1218;
  border: 1px solid #1e2d42;
  border-radius: 4px;
  color: #ffffff;
  font-family: var(--font-display, 'Anybody', sans-serif);
  font-size: 16px;
  font-weight: 600;
  text-align: center;
  outline: none;
  appearance: textfield;
  -moz-appearance: textfield;
}
.num-input::-webkit-outer-spin-button,
.num-input::-webkit-inner-spin-button {
  appearance: none;
  -webkit-appearance: none;
  margin: 0;
}
.num-input:focus {
  border-color: var(--color-accent-sky);
}

.err {
  color: var(--color-accent-coral);
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 12px;
}

.actions {
  display: flex;
  gap: 3px;
}
.act-btn {
  flex: 1;
  padding: 12px;
  font-family: var(--font-display, 'Anybody', sans-serif);
  font-weight: 700;
  font-size: 13px;
  border: 1px solid #1e2d42;
  border-radius: 6px;
  cursor: pointer;
  touch-action: manipulation;
  transition: all 0.1s;
}
.act-btn:active {
  transform: scale(0.96);
}
.act-clear {
  background: #1a1015;
  color: var(--color-accent-coral);
  flex: 0 0 auto;
  padding-inline: 20px;
}
.act-clear:hover {
  border-color: var(--color-accent-coral);
}
.act-gen {
  background: var(--color-accent-sky);
  color: #0a1520;
  flex: 2;
}
.act-gen:hover {
  background: #5cc8fa;
}

/* ── Result section ── */
.result-section {
  display: flex;
  flex-direction: column;
}

.result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid #1a2d42;
  background: #0a1218;
}
.result-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.fn-label {
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: #6b8299;
}
.back-btn {
  background: none;
  border: 1px solid var(--color-border-default);
  color: var(--color-text-dim);
  padding: 4px 10px;
  font-size: 10px;
  font-family: inherit;
  cursor: pointer;
  border-radius: 4px;
}
.back-btn:hover {
  color: var(--color-accent-sky);
  border-color: var(--color-accent-sky);
}

.table-wrap {
  max-height: 400px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #1e2d42 transparent;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}
.data-table th {
  position: sticky;
  top: 0;
  background: #0d1520;
  font-size: 11px;
  font-weight: 700;
  color: var(--color-accent-sky);
  padding: 8px 10px;
  text-align: right;
  border-bottom: 1px solid #1a2d42;
  font-family: var(--font-display, 'Anybody', sans-serif);
}
.data-table th:first-child {
  text-align: center;
  width: 70px;
}
.data-table td {
  padding: 6px 10px;
  font-size: 13px;
  font-family: var(--font-display, 'Anybody', sans-serif);
  font-weight: 600;
  color: #c8d6e5;
  border-bottom: 1px solid #111e2d;
  text-align: right;
}
.col-x {
  text-align: center !important;
  color: #6b8299;
  font-size: 12px;
}
.row-err .col-val {
  color: var(--color-accent-coral);
}

.result-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-top: 1px solid #1a2d42;
}
.row-count {
  font-size: 10px;
  color: var(--color-text-dim);
}
.result-footer .act-btn {
  flex: 0;
  padding: 6px 16px;
  font-size: 11px;
}
</style>
