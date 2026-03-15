<script setup lang="ts">
import { ref, computed } from 'vue'

type EqType = 'simul' | 'poly'
type SimulSize = 2 | 3 | 4
type PolyDeg = 2 | 3 | 4

const eqType = ref<EqType>('simul')
const simulSize = ref<SimulSize>(2)
const polyDeg = ref<PolyDeg>(2)

// ── Simultaneous equation coefficients ──
// For n unknowns: n rows × (n+1) cols (last col = constants)
const simulCoeffs = ref<number[][]>(makeSimulGrid(2))
const simulResult = ref<string[] | null>(null)
const simulError = ref('')

// ── Polynomial coefficients ──
// Degree d: d+1 coefficients (highest power first)
const polyCoeffs = ref<number[]>(makePolyGrid(2))
const polyResult = ref<string[] | null>(null)
const polyError = ref('')

// Active input tracking
const activeRow = ref(0)
const activeCol = ref(0)
const inputValue = ref('')

function makeSimulGrid(n: number): number[][] {
  return Array.from({ length: n }, () => Array(n + 1).fill(0) as number[])
}

function makePolyGrid(d: number): number[] {
  return Array(d + 1).fill(0) as number[]
}

function setSimulSize(n: SimulSize) {
  simulSize.value = n
  simulCoeffs.value = makeSimulGrid(n)
  simulResult.value = null
  simulError.value = ''
}

function setPolyDeg(d: PolyDeg) {
  polyDeg.value = d
  polyCoeffs.value = makePolyGrid(d)
  polyResult.value = null
  polyError.value = ''
}

function switchType(t: EqType) {
  eqType.value = t
  simulResult.value = null
  polyResult.value = null
  simulError.value = ''
  polyError.value = ''
}

// ── Labels ──
const varLabels = ['x', 'y', 'z', 'w']

const simulHeaders = computed(() => {
  const n = simulSize.value
  const vars = varLabels.slice(0, n)
  return [...vars, '=']
})

const polyLabels = computed(() => {
  const d: number = polyDeg.value
  const labels: string[] = []
  for (let i = d; i >= 0; i--) {
    if (i === 0) labels.push('c')
    else if (i === 1) labels.push('x')
    else labels.push(`x${superscript(i)}`)
  }
  return labels
})

function superscript(n: number): string {
  const sup: Record<string, string> = {
    '0': '⁰',
    '1': '¹',
    '2': '²',
    '3': '³',
    '4': '⁴',
    '5': '⁵',
    '6': '⁶',
    '7': '⁷',
    '8': '⁸',
    '9': '⁹',
  }
  return String(n)
    .split('')
    .map((c) => sup[c] ?? c)
    .join('')
}

// ── Simultaneous solver (Gaussian elimination with partial pivoting) ──
function solveSimultaneous() {
  const n = simulSize.value
  // Build augmented matrix (deep copy)
  const m: number[][] = simulCoeffs.value.map((row) => [...row])

  for (let col = 0; col < n; col++) {
    // Partial pivoting
    let maxRow = col
    let maxVal = Math.abs(m[col]![col]!)
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(m[row]![col]!) > maxVal) {
        maxVal = Math.abs(m[row]![col]!)
        maxRow = row
      }
    }
    if (maxVal < 1e-12) {
      simulError.value = 'Hệ phương trình vô nghiệm hoặc vô số nghiệm'
      simulResult.value = null
      return
    }
    if (maxRow !== col) {
      ;[m[col], m[maxRow]] = [m[maxRow]!, m[col]!]
    }

    // Eliminate below
    for (let row = col + 1; row < n; row++) {
      const factor = m[row]![col]! / m[col]![col]!
      for (let j = col; j <= n; j++) {
        m[row]![j] = m[row]![j]! - factor * m[col]![j]!
      }
    }
  }

  // Back substitution
  const result = Array.from<number>({ length: n })
  for (let i = n - 1; i >= 0; i--) {
    let sum = m[i]![n]!
    for (let j = i + 1; j < n; j++) {
      sum -= m[i]![j]! * result[j]!
    }
    if (Math.abs(m[i]![i]!) < 1e-12) {
      simulError.value = 'Hệ phương trình vô nghiệm hoặc vô số nghiệm'
      simulResult.value = null
      return
    }
    result[i] = sum / m[i]![i]!
  }

  simulError.value = ''
  simulResult.value = result.map((v, i) => `${varLabels[i]} = ${formatNum(v)}`)
}

// ── Polynomial solver ──
function solvePolynomial() {
  const d = polyDeg.value
  const c = [...polyCoeffs.value]

  if (Math.abs(c[0]!) < 1e-15) {
    polyError.value = 'Hệ số bậc cao nhất không được bằng 0'
    polyResult.value = null
    return
  }

  let roots: { re: number; im: number }[] = []

  if (d === 2) {
    roots = solveQuadratic(c[0]!, c[1]!, c[2]!)
  } else if (d === 3) {
    roots = solveCubic(c[0]!, c[1]!, c[2]!, c[3]!)
  } else if (d === 4) {
    roots = solveQuartic(c[0]!, c[1]!, c[2]!, c[3]!, c[4]!)
  }

  polyError.value = ''
  polyResult.value = roots.map((r, i) => `x${subscript(i + 1)} = ${formatComplex(r.re, r.im)}`)
}

function subscript(n: number): string {
  const sub: Record<string, string> = {
    '1': '₁',
    '2': '₂',
    '3': '₃',
    '4': '₄',
  }
  return sub[String(n)] ?? String(n)
}

function formatNum(v: number): string {
  if (Number.isInteger(v) && Math.abs(v) < 1e12) return String(v)
  const s = v.toPrecision(10)
  return s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s
}

function formatComplex(re: number, im: number): string {
  if (Math.abs(im) < 1e-10) return formatNum(re)
  const rStr = Math.abs(re) < 1e-10 ? '' : formatNum(re)
  const iAbs = Math.abs(im)
  const iStr = iAbs === 1 ? '' : formatNum(iAbs)
  const sign = im > 0 ? (rStr ? ' + ' : '') : rStr ? ' − ' : '−'
  return `${rStr}${sign}${iStr}i`
}

function solveQuadratic(a: number, b: number, c: number): { re: number; im: number }[] {
  const disc = b * b - 4 * a * c
  if (disc >= 0) {
    const sqrtD = Math.sqrt(disc)
    return [
      { re: (-b + sqrtD) / (2 * a), im: 0 },
      { re: (-b - sqrtD) / (2 * a), im: 0 },
    ]
  }
  const sqrtAbs = Math.sqrt(-disc)
  return [
    { re: -b / (2 * a), im: sqrtAbs / (2 * a) },
    { re: -b / (2 * a), im: -sqrtAbs / (2 * a) },
  ]
}

function solveCubic(a: number, b: number, c: number, d: number): { re: number; im: number }[] {
  // Depress: t = x + b/(3a)
  const p = (3 * a * c - b * b) / (3 * a * a)
  const q = (2 * b * b * b - 9 * a * b * c + 27 * a * a * d) / (27 * a * a * a)
  const disc = -(4 * p * p * p + 27 * q * q)
  const shift = -b / (3 * a)

  if (disc > 1e-10) {
    // Three distinct real roots
    const m = 2 * Math.sqrt(-p / 3)
    const theta = Math.acos((3 * q) / (p * m)) / 3
    return [
      { re: m * Math.cos(theta) + shift, im: 0 },
      { re: m * Math.cos(theta - (2 * Math.PI) / 3) + shift, im: 0 },
      { re: m * Math.cos(theta - (4 * Math.PI) / 3) + shift, im: 0 },
    ]
  }

  // Use Cardano's formula
  const halfQ = q / 2
  const inner = halfQ * halfQ + (p * p * p) / 27
  if (inner >= 0) {
    const sqrtInner = Math.sqrt(inner)
    const u = Math.cbrt(-halfQ + sqrtInner)
    const v = Math.cbrt(-halfQ - sqrtInner)
    const r1 = u + v + shift
    const realPart = -(u + v) / 2 + shift
    const imagPart = ((u - v) * Math.sqrt(3)) / 2
    if (Math.abs(imagPart) < 1e-10) {
      return [
        { re: r1, im: 0 },
        { re: realPart, im: 0 },
        { re: realPart, im: 0 },
      ]
    }
    return [
      { re: r1, im: 0 },
      { re: realPart, im: imagPart },
      { re: realPart, im: -imagPart },
    ]
  }
  // Complex inner — use trigonometric
  const abs = Math.sqrt(-inner)
  const angle = Math.atan2(abs, -halfQ)
  const r = Math.cbrt(Math.sqrt(halfQ * halfQ - inner))
  const u = r * Math.cos(angle / 3)
  const v = r * Math.cos(-angle / 3)
  const r1 = u + v + shift
  const realPart = -(u + v) / 2 + shift
  const imagPart = ((u - v) * Math.sqrt(3)) / 2
  return [
    { re: r1, im: 0 },
    { re: realPart, im: imagPart },
    { re: realPart, im: -imagPart },
  ]
}

function solveQuartic(
  a: number,
  b: number,
  c: number,
  d: number,
  e: number,
): { re: number; im: number }[] {
  // Depress to t⁴ + pt² + qt + r = 0
  const p = (8 * a * c - 3 * b * b) / (8 * a * a)
  const q = (b * b * b - 4 * a * b * c + 8 * a * a * d) / (8 * a * a * a)

  const r2 =
    (-3 * b ** 4 + 256 * a ** 3 * e - 64 * a ** 2 * b * d + 16 * a * b ** 2 * c) / (256 * a ** 4)

  const shift = -b / (4 * a)

  // Actually, use Ferrari's resolvent cubic: 8y³ - 4py² - 8ry + 4pr - q² = 0
  const ferrari = solveCubic(8, -4 * p, -8 * r2, 4 * p * r2 - q * q)
  // Pick a real root
  let y = 0
  for (const root of ferrari) {
    if (Math.abs(root.im) < 1e-10) {
      y = root.re
      break
    }
  }

  const sq2y_p = 2 * y - p
  if (sq2y_p < -1e-10) {
    // Fall back to companion matrix eigenvalue method via two quadratics
    // Simplified: just solve as two quadratics with complex arithmetic
    const sqrtVal = Math.sqrt(Math.abs(sq2y_p))
    const qOver = q / (2 * sqrtVal)
    const roots1 = solveQuadratic(1, sqrtVal, y + qOver)
    const roots2 = solveQuadratic(1, -sqrtVal, y - qOver)
    return [...roots1, ...roots2].map((root) => ({ re: root.re + shift, im: root.im }))
  }

  const sqrtVal = Math.sqrt(Math.max(0, sq2y_p))
  if (sqrtVal < 1e-12) {
    // q ≈ 0 case: biquadratic
    const inner1 = solveQuadratic(1, 0, p / 2 + Math.sqrt(Math.max(0, (p * p) / 4 - r2)))
    const inner2 = solveQuadratic(1, 0, p / 2 - Math.sqrt(Math.max(0, (p * p) / 4 - r2)))
    return [...inner1, ...inner2].map((root) => ({ re: root.re + shift, im: root.im }))
  }

  const qOver = q / (2 * sqrtVal)
  const roots1 = solveQuadratic(1, sqrtVal, y + qOver)
  const roots2 = solveQuadratic(1, -sqrtVal, y - qOver)
  return [...roots1, ...roots2].map((root) => ({ re: root.re + shift, im: root.im }))
}

// ── Input handling ──
function focusCell(row: number, col: number) {
  activeRow.value = row
  activeCol.value = col
  if (eqType.value === 'simul') {
    inputValue.value =
      simulCoeffs.value[row]![col]! === 0 ? '' : String(simulCoeffs.value[row]![col]!)
  } else {
    inputValue.value = polyCoeffs.value[col]! === 0 ? '' : String(polyCoeffs.value[col]!)
  }
}

function commitCell() {
  const val = parseFloat(inputValue.value) || 0
  if (eqType.value === 'simul') {
    simulCoeffs.value[activeRow.value]![activeCol.value] = val
  } else {
    polyCoeffs.value[activeCol.value] = val
  }
}

function clearAll() {
  if (eqType.value === 'simul') {
    simulCoeffs.value = makeSimulGrid(simulSize.value)
    simulResult.value = null
    simulError.value = ''
  } else {
    polyCoeffs.value = makePolyGrid(polyDeg.value)
    polyResult.value = null
    polyError.value = ''
  }
  inputValue.value = ''
}

function solve() {
  commitCell()
  if (eqType.value === 'simul') solveSimultaneous()
  else solvePolynomial()
}

// ── Equation display string ──
const simulEqStrings = computed(() => {
  const n = simulSize.value
  return simulCoeffs.value.map((row) => {
    const terms = row
      .slice(0, n)
      .map((c, i) => {
        if (c === 0) return ''
        const sign = c > 0 && i > 0 ? '+' : ''
        const coeff = Math.abs(c) === 1 ? (c < 0 ? '−' : '') : `${c}`
        return `${sign}${coeff}${varLabels[i]}`
      })
      .filter(Boolean)
      .join(' ')
    return `${terms || '0'} = ${row[n]}`
  })
})
</script>

<template>
  <div class="eq-mode">
    <!-- Type selector -->
    <div class="type-bar">
      <button :class="['type-btn', { active: eqType === 'simul' }]" @click="switchType('simul')">
        Hệ PT
      </button>
      <button :class="['type-btn', { active: eqType === 'poly' }]" @click="switchType('poly')">
        PT bậc n
      </button>
    </div>

    <!-- Size/degree selector -->
    <div class="size-bar">
      <template v-if="eqType === 'simul'">
        <button
          v-for="n in [2, 3, 4] as SimulSize[]"
          :key="n"
          :class="['size-btn', { active: simulSize === n }]"
          @click="setSimulSize(n)"
        >
          {{ n }} ẩn
        </button>
      </template>
      <template v-else>
        <button
          v-for="d in [2, 3, 4] as PolyDeg[]"
          :key="d"
          :class="['size-btn', { active: polyDeg === d }]"
          @click="setPolyDeg(d)"
        >
          Bậc {{ d }}
        </button>
      </template>
    </div>

    <!-- Simultaneous equations input -->
    <div v-if="eqType === 'simul'" class="input-area">
      <div class="eq-preview">
        <div v-for="(s, i) in simulEqStrings" :key="i" class="eq-line">{{ s }}</div>
      </div>

      <table class="coeff-table">
        <thead>
          <tr>
            <th />
            <th v-for="(h, ci) in simulHeaders" :key="ci">{{ h }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, ri) in simulCoeffs" :key="ri">
            <td class="row-label">{{ ri + 1 }}</td>
            <td v-for="(val, ci) in row" :key="ci">
              <input
                type="number"
                class="coeff-input"
                :class="{ focused: activeRow === ri && activeCol === ci }"
                :value="val || ''"
                inputmode="decimal"
                @focus="focusCell(ri, ci)"
                @input="
                  (e) => {
                    inputValue = (e.target as HTMLInputElement).value
                    simulCoeffs[ri]![ci] = parseFloat(inputValue) || 0
                  }
                "
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Polynomial input -->
    <div v-else class="input-area">
      <div class="eq-preview">
        <div class="eq-line">
          {{
            polyCoeffs
              .map((c, i) => {
                const deg = polyDeg - i
                if (c === 0) return ''
                const sign = c > 0 && i > 0 ? ' + ' : c < 0 && i > 0 ? ' − ' : ''
                const absC = Math.abs(c)
                const coeff = absC === 1 && deg > 0 ? '' : String(absC)
                const x = deg === 0 ? '' : deg === 1 ? 'x' : `x${superscript(deg)}`
                return `${i === 0 && c < 0 ? '−' : sign}${coeff}${x}`
              })
              .filter(Boolean)
              .join('') || '0'
          }}
          = 0
        </div>
      </div>

      <table class="coeff-table">
        <thead>
          <tr>
            <th v-for="(l, i) in polyLabels" :key="i">{{ l }}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td v-for="(val, ci) in polyCoeffs" :key="ci">
              <input
                type="number"
                class="coeff-input"
                :class="{ focused: activeCol === ci }"
                :value="val || ''"
                inputmode="decimal"
                @focus="focusCell(0, ci)"
                @input="
                  (e) => {
                    inputValue = (e.target as HTMLInputElement).value
                    polyCoeffs[ci] = parseFloat(inputValue) || 0
                  }
                "
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Results -->
    <div class="result-area">
      <template v-if="eqType === 'simul'">
        <div v-if="simulError" class="err">{{ simulError }}</div>
        <div v-else-if="simulResult" class="results">
          <div v-for="(r, i) in simulResult" :key="i" class="result-row">{{ r }}</div>
        </div>
      </template>
      <template v-else>
        <div v-if="polyError" class="err">{{ polyError }}</div>
        <div v-else-if="polyResult" class="results">
          <div v-for="(r, i) in polyResult" :key="i" class="result-row">{{ r }}</div>
        </div>
      </template>
    </div>

    <!-- Action buttons -->
    <div class="actions">
      <button class="act-btn act-clear" @click="clearAll">AC</button>
      <button class="act-btn act-solve" @click="solve">Giải</button>
    </div>
  </div>
</template>

<style scoped>
.eq-mode {
  display: flex;
  flex-direction: column;
}

.type-bar {
  display: flex;
  border-bottom: 1px solid #1a2d42;
}
.type-btn {
  flex: 1;
  padding: 10px;
  font-size: 12px;
  font-family: var(--font-display, 'Anybody', sans-serif);
  font-weight: 600;
  color: var(--color-text-dim);
  background: #0a1218;
  border: none;
  cursor: pointer;
  transition: all 0.15s;
}
.type-btn.active {
  color: var(--color-accent-sky);
  background: #0d1a28;
  box-shadow: inset 0 -2px 0 var(--color-accent-sky);
}

.size-bar {
  display: flex;
  gap: 1px;
  background: #1a2d42;
  border-bottom: 1px solid #1a2d42;
}
.size-btn {
  flex: 1;
  padding: 8px;
  font-size: 11px;
  font-family: inherit;
  font-weight: 600;
  color: var(--color-text-dim);
  background: #0d1520;
  border: none;
  cursor: pointer;
  transition: all 0.15s;
}
.size-btn.active {
  color: #fbbf24;
  background: #1a1a08;
}

.input-area {
  padding: 12px;
}

.eq-preview {
  margin-bottom: 10px;
  padding: 8px 10px;
  background: #0a1218;
  border: 1px solid #1a2d42;
  border-radius: 6px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  color: var(--color-text-secondary);
}
.eq-line {
  min-height: 20px;
}

.coeff-table {
  width: 100%;
  border-collapse: collapse;
}
.coeff-table th {
  font-size: 10px;
  font-weight: 600;
  color: var(--color-text-dim);
  padding: 4px;
  text-align: center;
}
.coeff-table td {
  padding: 2px;
}
.row-label {
  width: 20px;
  text-align: center;
  font-size: 10px;
  color: var(--color-text-dim);
  font-weight: 600;
}

.coeff-input {
  width: 100%;
  padding: 8px 4px;
  background: #162232;
  border: 1px solid #1e2d42;
  border-radius: 4px;
  color: #ffffff;
  font-family: var(--font-display, 'Anybody', sans-serif);
  font-size: 16px;
  font-weight: 600;
  text-align: center;
  outline: none;
  transition: border-color 0.15s;
  appearance: textfield;
  -moz-appearance: textfield;
}
.coeff-input::-webkit-outer-spin-button,
.coeff-input::-webkit-inner-spin-button {
  appearance: none;
  -webkit-appearance: none;
  margin: 0;
}
.coeff-input:focus,
.coeff-input.focused {
  border-color: var(--color-accent-sky);
  background: #0d1a28;
}

.result-area {
  padding: 0 12px;
  min-height: 40px;
}
.err {
  color: var(--color-accent-coral);
  font-size: 13px;
  font-weight: 600;
  text-align: center;
  padding: 8px 0;
}
.results {
  padding: 8px 0;
}
.result-row {
  font-family: var(--font-display, 'Anybody', sans-serif);
  font-size: 16px;
  font-weight: 700;
  color: var(--color-accent-sky);
  padding: 4px 0;
  text-align: center;
}

.actions {
  display: flex;
  gap: 3px;
  padding: 8px 12px 12px;
}
.act-btn {
  flex: 1;
  padding: 14px;
  font-family: var(--font-display, 'Anybody', sans-serif);
  font-weight: 700;
  font-size: 14px;
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
}
.act-clear:hover {
  border-color: var(--color-accent-coral);
}
.act-solve {
  background: var(--color-accent-sky);
  color: #0a1520;
  flex: 2;
}
.act-solve:hover {
  background: #5cc8fa;
}
</style>
