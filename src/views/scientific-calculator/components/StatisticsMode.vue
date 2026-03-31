<script setup lang="ts">
import { ref, computed } from 'vue'

// ── Mode: 1-var or 2-var ──
type StatType = '1var' | '2var'
const statType = ref<StatType>('1var')

// ── Data ──
type Row1 = { x: number; freq: number }
type Row2 = { x: number; y: number; freq: number }
const data1 = ref<Row1[]>([{ x: 0, freq: 1 }])
const data2 = ref<Row2[]>([{ x: 0, y: 0, freq: 1 }])

// ── Regression type (2-var only) ──
type RegType = 'lin' | 'quad' | 'log' | 'exp' | 'power' | 'ab_exp' | 'inv'
const regType = ref<RegType>('lin')
const regLabels: { id: RegType; label: string; eq: string }[] = [
  { id: 'lin', label: 'Tuyến tính', eq: 'y = a + bx' },
  { id: 'quad', label: 'Bậc hai', eq: 'y = a + bx + cx²' },
  { id: 'log', label: 'Logarit', eq: 'y = a + b·ln(x)' },
  { id: 'exp', label: 'Lũy thừa e', eq: 'y = a·eᵇˣ' },
  { id: 'power', label: 'Lũy thừa', eq: 'y = a·xᵇ' },
  { id: 'ab_exp', label: 'AB lũy thừa', eq: 'y = a·bˣ' },
  { id: 'inv', label: 'Nghịch đảo', eq: 'y = a + b/x' },
]

// ── Results toggle ──
const showResults = ref(false)

// ── Data manipulation ──
function addRow() {
  if (statType.value === '1var') data1.value.push({ x: 0, freq: 1 })
  else data2.value.push({ x: 0, y: 0, freq: 1 })
}
function removeRow(i: number) {
  if (statType.value === '1var') {
    if (data1.value.length > 1) data1.value.splice(i, 1)
  } else {
    if (data2.value.length > 1) data2.value.splice(i, 1)
  }
}
function clearData() {
  data1.value = [{ x: 0, freq: 1 }]
  data2.value = [{ x: 0, y: 0, freq: 1 }]
  showResults.value = false
}

function switchType(t: StatType) {
  statType.value = t
  showResults.value = false
}

// ── 1-var stats ──
const stats1 = computed(() => {
  const rows = data1.value
  let n = 0,
    sx = 0,
    sx2 = 0
  const vals: number[] = []

  for (const r of rows) {
    const f = Math.max(1, Math.round(r.freq))
    n += f
    sx += r.x * f
    sx2 += r.x * r.x * f
    for (let i = 0; i < f; i++) vals.push(r.x)
  }

  if (n === 0) return null
  const mean = sx / n
  const popVar = sx2 / n - mean * mean
  const sigmaX = Math.sqrt(Math.max(0, popVar))
  const sampleVar = n > 1 ? (sx2 - (sx * sx) / n) / (n - 1) : 0
  const sX = Math.sqrt(Math.max(0, sampleVar))

  vals.sort((a, b) => a - b)
  const min = vals[0]!
  const max = vals[vals.length - 1]!

  const quartile = (arr: number[], q: number) => {
    const pos = (arr.length - 1) * q
    const lo = Math.floor(pos)
    const hi = Math.ceil(pos)
    return arr[lo]! + (arr[hi]! - arr[lo]!) * (pos - lo)
  }

  return {
    n,
    mean,
    sumX: sx,
    sumX2: sx2,
    sigmaX,
    sX,
    min,
    max,
    q1: quartile(vals, 0.25),
    median: quartile(vals, 0.5),
    q3: quartile(vals, 0.75),
  }
})

// ── 2-var stats ──
const stats2 = computed(() => {
  const rows = data2.value
  let n = 0,
    sx = 0,
    sy = 0,
    sx2 = 0,
    sy2 = 0,
    sxy = 0
  const xs: number[] = [],
    ys: number[] = []

  for (const r of rows) {
    const f = Math.max(1, Math.round(r.freq))
    n += f
    sx += r.x * f
    sy += r.y * f
    sx2 += r.x * r.x * f
    sy2 += r.y * r.y * f
    sxy += r.x * r.y * f
    for (let i = 0; i < f; i++) {
      xs.push(r.x)
      ys.push(r.y)
    }
  }

  if (n === 0) return null
  const meanX = sx / n,
    meanY = sy / n
  const sigX = Math.sqrt(Math.max(0, sx2 / n - meanX * meanX))
  const sigY = Math.sqrt(Math.max(0, sy2 / n - meanY * meanY))
  const sXv = n > 1 ? Math.sqrt(Math.max(0, (sx2 - (sx * sx) / n) / (n - 1))) : 0
  const sYv = n > 1 ? Math.sqrt(Math.max(0, (sy2 - (sy * sy) / n) / (n - 1))) : 0

  xs.sort((a, b) => a - b)
  ys.sort((a, b) => a - b)
  const minX = xs[0]!,
    maxX = xs[xs.length - 1]!
  const minY = ys[0]!,
    maxY = ys[ys.length - 1]!

  return {
    n,
    meanX,
    meanY,
    sumX: sx,
    sumY: sy,
    sumX2: sx2,
    sumY2: sy2,
    sumXY: sxy,
    sigX,
    sigY,
    sX: sXv,
    sY: sYv,
    minX,
    maxX,
    minY,
    maxY,
  }
})

// ── Regression ──
const regression = computed(() => {
  const rows = data2.value
  const rt = regType.value
  const pts: { x: number; y: number; f: number }[] = []
  for (const r of rows) {
    const f = Math.max(1, Math.round(r.freq))
    pts.push({ x: r.x, y: r.y, f })
  }

  const txs: number[] = [],
    tys: number[] = []
  for (const p of pts) {
    let tx = p.x,
      ty = p.y
    if (rt === 'log') tx = Math.log(p.x)
    else if (rt === 'exp') ty = Math.log(p.y)
    else if (rt === 'power') {
      tx = Math.log(p.x)
      ty = Math.log(p.y)
    } else if (rt === 'ab_exp') {
      ty = Math.log(p.y)
    } else if (rt === 'inv') {
      tx = 1 / p.x
    }

    if (!isFinite(tx) || !isFinite(ty)) return null
    for (let i = 0; i < p.f; i++) {
      txs.push(tx)
      tys.push(ty)
    }
  }

  const n = txs.length
  if (n < 2) return null

  if (rt === 'quad') {
    // y = a + bx + cx²: solve normal equations
    let s0 = 0,
      s1 = 0,
      s2 = 0,
      s3 = 0,
      s4 = 0,
      t0 = 0,
      t1 = 0,
      t2 = 0
    for (const p of pts) {
      const f = p.f,
        x = p.x,
        y = p.y
      s0 += f
      s1 += x * f
      s2 += x * x * f
      s3 += x * x * x * f
      s4 += x * x * x * x * f
      t0 += y * f
      t1 += x * y * f
      t2 += x * x * y * f
    }
    // [s0 s1 s2 | t0]
    // [s1 s2 s3 | t1]
    // [s2 s3 s4 | t2]
    const m = [
      [s0, s1, s2, t0],
      [s1, s2, s3, t1],
      [s2, s3, s4, t2],
    ]
    // Gaussian elimination
    for (let col = 0; col < 3; col++) {
      let maxR = col
      for (let row = col + 1; row < 3; row++) {
        if (Math.abs(m[row]![col]!) > Math.abs(m[maxR]![col]!)) maxR = row
      }
      ;[m[col], m[maxR]] = [m[maxR]!, m[col]!]
      const pivot = m[col]![col]!
      if (Math.abs(pivot) < 1e-15) return null
      for (let j = col; j < 4; j++) m[col]![j]! /= pivot
      for (let row = 0; row < 3; row++) {
        if (row === col) continue
        const factor = m[row]![col]!
        for (let j = col; j < 4; j++) m[row]![j]! -= factor * m[col]![j]!
      }
    }
    const a = m[0]![3]!,
      b = m[1]![3]!,
      c = m[2]![3]!

    // R² for quad
    const yMean = t0 / s0
    let ssTot = 0,
      ssRes = 0
    for (const p of pts) {
      for (let i = 0; i < p.f; i++) {
        const yHat = a + b * p.x + c * p.x * p.x
        ssTot += (p.y - yMean) ** 2
        ssRes += (p.y - yHat) ** 2
      }
    }
    const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0

    return { type: 'quad' as const, a, b, c, r: Math.sqrt(Math.max(0, r2)), r2 }
  }

  // Linear regression on transformed data
  let stx = 0,
    sty = 0,
    stx2 = 0,
    stxy = 0
  for (let i = 0; i < n; i++) {
    stx += txs[i]!
    sty += tys[i]!
    stx2 += txs[i]! * txs[i]!
    stxy += txs[i]! * tys[i]!
  }
  const det = n * stx2 - stx * stx
  if (Math.abs(det) < 1e-15) return null

  const tA = (sty * stx2 - stx * stxy) / det
  const tB = (n * stxy - stx * sty) / det

  // Correlation
  const sty2 = tys.reduce((s, v) => s + v * v, 0)
  const detR = Math.sqrt((n * stx2 - stx * stx) * (n * sty2 - sty * sty))
  const r = detR > 0 ? (n * stxy - stx * sty) / detR : 0

  let a: number, b: number
  if (rt === 'exp') {
    a = Math.exp(tA)
    b = tB
  } else if (rt === 'power') {
    a = Math.exp(tA)
    b = tB
  } else if (rt === 'ab_exp') {
    a = Math.exp(tA)
    b = Math.exp(tB)
  } else {
    a = tA
    b = tB
  }

  return { type: rt, a, b, r, r2: r * r }
})

function fmt(v: number): string {
  if (!isFinite(v) || isNaN(v)) return '—'
  if (Math.abs(v) < 1e-12) return '0'
  if (Math.abs(v) >= 1e8) return v.toExponential(4)
  const s = v.toPrecision(8)
  if (s.includes('.') && !s.includes('e')) return s.replace(/0+$/, '').replace(/\.$/, '')
  return s
}
</script>

<template>
  <div class="stat-mode">
    <!-- Type toggle -->
    <div class="type-tabs">
      <button class="type-tab" :class="{ active: statType === '1var' }" @click="switchType('1var')">
        1 biến
      </button>
      <button class="type-tab" :class="{ active: statType === '2var' }" @click="switchType('2var')">
        2 biến
      </button>
    </div>

    <!-- Data table (input view) -->
    <template v-if="!showResults">
      <div class="data-section">
        <div class="data-header">
          <span class="col-idx">#</span>
          <span class="col-val">x</span>
          <span v-if="statType === '2var'" class="col-val">y</span>
          <span class="col-freq">Freq</span>
          <span class="col-act"></span>
        </div>

        <div class="data-scroll">
          <!-- 1-var rows -->
          <template v-if="statType === '1var'">
            <div v-for="(r, i) in data1" :key="i" class="data-row">
              <span class="col-idx">{{ i + 1 }}</span>
              <input v-model.number="r.x" type="number" class="d-input" inputmode="decimal" />
              <input
                v-model.number="r.freq"
                type="number"
                min="1"
                class="d-input freq"
                inputmode="numeric"
              />
              <button class="row-del" @click="removeRow(i)" :disabled="data1.length <= 1">✕</button>
            </div>
          </template>

          <!-- 2-var rows -->
          <template v-else>
            <div v-for="(r, i) in data2" :key="i" class="data-row">
              <span class="col-idx">{{ i + 1 }}</span>
              <input v-model.number="r.x" type="number" class="d-input" inputmode="decimal" />
              <input v-model.number="r.y" type="number" class="d-input" inputmode="decimal" />
              <input
                v-model.number="r.freq"
                type="number"
                min="1"
                class="d-input freq"
                inputmode="numeric"
              />
              <button class="row-del" @click="removeRow(i)" :disabled="data2.length <= 1">✕</button>
            </div>
          </template>
        </div>

        <button class="add-row-btn" @click="addRow">+ Thêm dòng</button>
      </div>

      <!-- Regression selector (2-var) -->
      <div v-if="statType === '2var'" class="reg-selector">
        <label class="reg-label">Hồi quy</label>
        <div class="reg-types">
          <button
            v-for="rt in regLabels"
            :key="rt.id"
            class="reg-btn"
            :class="{ active: regType === rt.id }"
            @click="regType = rt.id"
          >
            {{ rt.label }}
          </button>
        </div>
      </div>

      <div class="actions">
        <button class="act-btn act-clear" @click="clearData">AC</button>
        <button class="act-btn act-calc" @click="showResults = true">Tính</button>
      </div>
    </template>

    <!-- Results view -->
    <template v-else>
      <div class="result-section">
        <button class="back-btn" @click="showResults = false">← Sửa dữ liệu</button>

        <!-- 1-var results -->
        <template v-if="statType === '1var' && stats1">
          <div class="result-group">
            <div class="rg-title">Thống kê 1 biến</div>
            <div class="stat-grid">
              <div class="stat-item">
                <span class="sk">n</span><span class="sv">{{ stats1.n }}</span>
              </div>
              <div class="stat-item">
                <span class="sk">x̄</span><span class="sv">{{ fmt(stats1.mean) }}</span>
              </div>
              <div class="stat-item">
                <span class="sk">Σx</span><span class="sv">{{ fmt(stats1.sumX) }}</span>
              </div>
              <div class="stat-item">
                <span class="sk">Σx²</span><span class="sv">{{ fmt(stats1.sumX2) }}</span>
              </div>
              <div class="stat-item">
                <span class="sk">σx</span><span class="sv">{{ fmt(stats1.sigmaX) }}</span>
              </div>
              <div class="stat-item">
                <span class="sk">sx</span><span class="sv">{{ fmt(stats1.sX) }}</span>
              </div>
              <div class="stat-item">
                <span class="sk">Min</span><span class="sv">{{ fmt(stats1.min) }}</span>
              </div>
              <div class="stat-item">
                <span class="sk">Q₁</span><span class="sv">{{ fmt(stats1.q1) }}</span>
              </div>
              <div class="stat-item">
                <span class="sk">Med</span><span class="sv">{{ fmt(stats1.median) }}</span>
              </div>
              <div class="stat-item">
                <span class="sk">Q₃</span><span class="sv">{{ fmt(stats1.q3) }}</span>
              </div>
              <div class="stat-item">
                <span class="sk">Max</span><span class="sv">{{ fmt(stats1.max) }}</span>
              </div>
            </div>
          </div>
        </template>

        <!-- 2-var results -->
        <template v-if="statType === '2var' && stats2">
          <div class="result-group">
            <div class="rg-title">Thống kê 2 biến</div>
            <div class="stat-grid">
              <div class="stat-item">
                <span class="sk">n</span><span class="sv">{{ stats2.n }}</span>
              </div>
              <div class="stat-item">
                <span class="sk">x̄</span><span class="sv">{{ fmt(stats2.meanX) }}</span>
              </div>
              <div class="stat-item">
                <span class="sk">ȳ</span><span class="sv">{{ fmt(stats2.meanY) }}</span>
              </div>
              <div class="stat-item">
                <span class="sk">Σx</span><span class="sv">{{ fmt(stats2.sumX) }}</span>
              </div>
              <div class="stat-item">
                <span class="sk">Σy</span><span class="sv">{{ fmt(stats2.sumY) }}</span>
              </div>
              <div class="stat-item">
                <span class="sk">Σx²</span><span class="sv">{{ fmt(stats2.sumX2) }}</span>
              </div>
              <div class="stat-item">
                <span class="sk">Σy²</span><span class="sv">{{ fmt(stats2.sumY2) }}</span>
              </div>
              <div class="stat-item">
                <span class="sk">Σxy</span><span class="sv">{{ fmt(stats2.sumXY) }}</span>
              </div>
              <div class="stat-item">
                <span class="sk">σx</span><span class="sv">{{ fmt(stats2.sigX) }}</span>
              </div>
              <div class="stat-item">
                <span class="sk">σy</span><span class="sv">{{ fmt(stats2.sigY) }}</span>
              </div>
              <div class="stat-item">
                <span class="sk">sx</span><span class="sv">{{ fmt(stats2.sX) }}</span>
              </div>
              <div class="stat-item">
                <span class="sk">sy</span><span class="sv">{{ fmt(stats2.sY) }}</span>
              </div>
            </div>
          </div>

          <div v-if="regression" class="result-group">
            <div class="rg-title">Hồi quy — {{ regLabels.find((r) => r.id === regType)?.eq }}</div>
            <div class="stat-grid">
              <div class="stat-item">
                <span class="sk">a</span><span class="sv">{{ fmt(regression.a) }}</span>
              </div>
              <div class="stat-item">
                <span class="sk">b</span><span class="sv">{{ fmt(regression.b) }}</span>
              </div>
              <div v-if="regression.type === 'quad'" class="stat-item">
                <span class="sk">c</span><span class="sv">{{ fmt(regression.c) }}</span>
              </div>
              <div class="stat-item">
                <span class="sk">r</span><span class="sv">{{ fmt(regression.r) }}</span>
              </div>
              <div class="stat-item">
                <span class="sk">r²</span><span class="sv">{{ fmt(regression.r2) }}</span>
              </div>
            </div>
          </div>
          <div v-else class="err">Không thể tính hồi quy (dữ liệu không hợp lệ)</div>
        </template>

        <div
          v-if="(statType === '1var' && !stats1) || (statType === '2var' && !stats2)"
          class="err"
        >
          Chưa có dữ liệu
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.stat-mode {
  display: flex;
  flex-direction: column;
  padding: 14px;
  gap: 10px;
}

/* ── Type tabs ── */
.type-tabs {
  display: flex;
  gap: 3px;
  background: #0a1218;
  border-radius: 6px;
  padding: 3px;
}
.type-tab {
  flex: 1;
  padding: 8px 4px;
  font-family: var(--font-display, 'Anybody', sans-serif);
  font-weight: 600;
  font-size: 12px;
  color: var(--color-text-dim);
  background: none;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
}
.type-tab:hover {
  color: var(--color-text-secondary);
}
.type-tab.active {
  background: #162232;
  color: var(--color-accent-sky);
}

/* ── Data section ── */
.data-section {
  background: #0a1218;
  border: 1px solid #1a2d42;
  border-radius: 6px;
  overflow: hidden;
}
.data-header {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 8px;
  border-bottom: 1px solid #1a2d42;
  font-size: 10px;
  font-weight: 700;
  color: var(--color-accent-sky);
  font-family: var(--font-display, 'Anybody', sans-serif);
}
.col-idx {
  width: 24px;
  text-align: center;
  flex-shrink: 0;
}
.col-val {
  flex: 1;
  text-align: center;
}
.col-freq {
  width: 48px;
  text-align: center;
  flex-shrink: 0;
}
.col-act {
  width: 26px;
  flex-shrink: 0;
}

.data-scroll {
  max-height: 220px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #1e2d42 transparent;
}

.data-row {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-bottom: 1px solid #111e2d;
}
.data-row .col-idx {
  font-size: 9px;
  color: #3a5060;
}

.d-input {
  flex: 1;
  min-width: 0;
  padding: 5px 4px;
  background: #0d1520;
  border: 1px solid #1e2d42;
  border-radius: 3px;
  color: #c8d6e5;
  font-family: var(--font-display, 'Anybody', sans-serif);
  font-size: 16px;
  font-weight: 600;
  text-align: center;
  outline: none;
  appearance: textfield;
  -moz-appearance: textfield;
}
.d-input::-webkit-outer-spin-button,
.d-input::-webkit-inner-spin-button {
  appearance: none;
  -webkit-appearance: none;
  margin: 0;
}
.d-input:focus {
  border-color: var(--color-accent-sky);
}
.d-input.freq {
  width: 48px;
  flex: 0 0 48px;
  color: #6b8299;
  font-size: 11px;
}

.row-del {
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  background: none;
  border: none;
  color: #3a5060;
  font-size: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
}
.row-del:hover:not(:disabled) {
  background: #1a1015;
  color: var(--color-accent-coral);
}
.row-del:disabled {
  opacity: 0.2;
  cursor: not-allowed;
}

.add-row-btn {
  width: 100%;
  padding: 8px;
  background: none;
  border: none;
  border-top: 1px dashed #1a2d42;
  color: var(--color-text-dim);
  font-size: 11px;
  font-family: inherit;
  cursor: pointer;
  transition: color 0.15s;
}
.add-row-btn:hover {
  color: var(--color-accent-sky);
}

/* ── Regression selector ── */
.reg-selector {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.reg-label {
  font-size: 10px;
  font-weight: 600;
  color: var(--color-text-dim);
  font-family: var(--font-display, 'Anybody', sans-serif);
}
.reg-types {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
}
.reg-btn {
  padding: 5px 8px;
  font-size: 10px;
  font-family: var(--font-display, 'Anybody', sans-serif);
  font-weight: 600;
  color: #6b8299;
  background: #0a1218;
  border: 1px solid #1e2d42;
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.15s;
}
.reg-btn:hover {
  border-color: var(--color-accent-sky);
}
.reg-btn.active {
  background: #162232;
  border-color: var(--color-accent-sky);
  color: var(--color-accent-sky);
}

/* ── Actions ── */
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
.act-calc {
  background: var(--color-accent-sky);
  color: #0a1520;
  flex: 2;
}
.act-calc:hover {
  background: #5cc8fa;
}

/* ── Results ── */
.result-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.back-btn {
  align-self: flex-start;
  background: none;
  border: 1px solid var(--color-border-default);
  color: var(--color-text-dim);
  padding: 5px 10px;
  font-size: 11px;
  font-family: inherit;
  cursor: pointer;
  border-radius: 4px;
}
.back-btn:hover {
  color: var(--color-accent-sky);
  border-color: var(--color-accent-sky);
}

.result-group {
  background: #0a1218;
  border: 1px solid #1a2d42;
  border-radius: 6px;
  overflow: hidden;
}
.rg-title {
  padding: 8px 10px;
  font-size: 11px;
  font-weight: 700;
  color: var(--color-accent-sky);
  border-bottom: 1px solid #1a2d42;
  font-family: var(--font-display, 'Anybody', sans-serif);
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0;
}
.stat-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  border-bottom: 1px solid #111e2d;
  border-right: 1px solid #111e2d;
}
.stat-item:nth-child(2n) {
  border-right: none;
}
.sk {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #6b8299;
  font-weight: 600;
}
.sv {
  font-family: var(--font-display, 'Anybody', sans-serif);
  font-size: 13px;
  font-weight: 700;
  color: #c8d6e5;
}

.err {
  color: var(--color-accent-coral);
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  padding: 10px;
}
</style>
