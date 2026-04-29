<script setup lang="ts">
import { ref, computed } from 'vue'

// ── Distribution type ──
type Dist = 'normal' | 'binomial' | 'poisson'
type CalcType = 'cdf' | 'upper' | 'between' | 'inverse' | 'pmf'

const dist = ref<Dist>('normal')
const calcType = ref<CalcType>('cdf')

// ── Parameters ──
const mu = ref(0)
const sigma = ref(1)
const xVal = ref(0)
const xLower = ref(0)
const xUpper = ref(1)
const pVal = ref(0.5)

const nTrials = ref(10)
const prob = ref(0.5)
const kVal = ref(0)
const kLower = ref(0)
const kUpper = ref(5)

const lambda = ref(1)
const pKVal = ref(0)
const pKLower = ref(0)
const pKUpper = ref(3)

// ── Result ──
const result = ref<string | null>(null)
const error = ref('')

// ── Math helpers ──
function erf(x: number): number {
  const a1 = 0.254829592,
    a2 = -0.284496736,
    a3 = 1.421413741
  const a4 = -1.453152027,
    a5 = 1.061405429,
    p = 0.3275911
  const sign = x < 0 ? -1 : 1
  x = Math.abs(x)
  const t = 1 / (1 + p * x)
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)
  return sign * y
}

function normalCDF(x: number, mean: number, sd: number): number {
  if (sd <= 0) return NaN
  return 0.5 * (1 + erf((x - mean) / (sd * Math.SQRT2)))
}

function inverseNormal(p: number, mean: number, sd: number): number {
  if (p <= 0 || p >= 1 || sd <= 0) return NaN
  // Rational approximation (Peter Acklam)
  const a = [
    -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2,
    -3.066479806614716e1, 2.506628277459239,
  ]
  const b = [
    -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1,
    -1.328068155288572e1,
  ]
  const c = [
    -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734,
    4.374664141464968, 2.938163982698783,
  ]
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416]

  const pLow = 0.02425,
    pHigh = 1 - pLow
  let q: number, r: number, x: number

  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p))
    x =
      (((((c[0]! * q + c[1]!) * q + c[2]!) * q + c[3]!) * q + c[4]!) * q + c[5]!) /
      ((((d[0]! * q + d[1]!) * q + d[2]!) * q + d[3]!) * q + 1)
  } else if (p <= pHigh) {
    q = p - 0.5
    r = q * q
    x =
      ((((((a[0]! * r + a[1]!) * r + a[2]!) * r + a[3]!) * r + a[4]!) * r + a[5]!) * q) /
      (((((b[0]! * r + b[1]!) * r + b[2]!) * r + b[3]!) * r + b[4]!) * r + 1)
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p))
    x =
      -(((((c[0]! * q + c[1]!) * q + c[2]!) * q + c[3]!) * q + c[4]!) * q + c[5]!) /
      ((((d[0]! * q + d[1]!) * q + d[2]!) * q + d[3]!) * q + 1)
  }

  // Refine with Newton's method
  for (let i = 0; i < 3; i++) {
    const e = normalCDF(x, 0, 1) - p
    const u = e * Math.sqrt(2 * Math.PI) * Math.exp(0.5 * x * x)
    x -= u
  }

  return mean + x * sd
}

function lnGamma(z: number): number {
  const c = [
    76.18009172947146, -86.50532032941678, 24.01409824083091, -1.231739572450155,
    0.1208650973866179e-2, -0.5395239384953e-5,
  ]
  const x = z
  let y = z
  let tmp = x + 5.5
  tmp -= (x + 0.5) * Math.log(tmp)
  let ser = 1.000000000190015
  for (let j = 0; j < 6; j++) {
    y++
    ser += c[j]! / y
  }
  return -tmp + Math.log((2.506628274631001 * ser) / x)
}

function binomCoeff(n: number, k: number): number {
  if (k < 0 || k > n) return 0
  return Math.exp(lnGamma(n + 1) - lnGamma(k + 1) - lnGamma(n - k + 1))
}

function binomialPMF(k: number, n: number, p: number): number {
  if (k < 0 || k > n || !Number.isInteger(k)) return 0
  return binomCoeff(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k)
}

function binomialCDF(k: number, n: number, p: number): number {
  let sum = 0
  for (let i = 0; i <= Math.floor(k); i++) sum += binomialPMF(i, n, p)
  return Math.min(sum, 1)
}

function poissonPMF(k: number, lam: number): number {
  if (k < 0 || !Number.isInteger(k)) return 0
  return Math.exp(k * Math.log(lam) - lam - lnGamma(k + 1))
}

function poissonCDF(k: number, lam: number): number {
  let sum = 0
  for (let i = 0; i <= Math.floor(k); i++) sum += poissonPMF(i, lam)
  return Math.min(sum, 1)
}

// ── Calc type options per distribution ──
const calcOptions = computed(() => {
  if (dist.value === 'normal') {
    return [
      { id: 'cdf' as CalcType, label: 'P(X ≤ x)' },
      { id: 'upper' as CalcType, label: 'P(X ≥ x)' },
      { id: 'between' as CalcType, label: 'P(a ≤ X ≤ b)' },
      { id: 'inverse' as CalcType, label: 'Inverse (p → x)' },
    ]
  }
  return [
    { id: 'pmf' as CalcType, label: 'P(X = k)' },
    { id: 'cdf' as CalcType, label: 'P(X ≤ k)' },
    { id: 'upper' as CalcType, label: 'P(X ≥ k)' },
    { id: 'between' as CalcType, label: 'P(a ≤ X ≤ b)' },
  ]
})

function switchDist(d: Dist) {
  dist.value = d
  calcType.value = d === 'normal' ? 'cdf' : 'pmf'
  result.value = null
  error.value = ''
}

function fmt(v: number): string {
  if (isNaN(v) || !isFinite(v)) return 'Không xác định'
  if (Math.abs(v) < 1e-12) return '0'
  if (Math.abs(v) >= 1e10 || (Math.abs(v) < 1e-6 && v !== 0)) return v.toExponential(8)
  return v.toPrecision(10).replace(/\.?0+$/, '')
}

function compute() {
  error.value = ''
  result.value = null

  try {
    if (dist.value === 'normal') {
      const s = sigma.value
      if (s <= 0) {
        error.value = 'σ phải > 0'
        return
      }

      if (calcType.value === 'cdf') {
        result.value = fmt(normalCDF(xVal.value, mu.value, s))
      } else if (calcType.value === 'upper') {
        result.value = fmt(1 - normalCDF(xVal.value, mu.value, s))
      } else if (calcType.value === 'between') {
        const lo = normalCDF(xLower.value, mu.value, s)
        const hi = normalCDF(xUpper.value, mu.value, s)
        result.value = fmt(hi - lo)
      } else if (calcType.value === 'inverse') {
        const p = pVal.value
        if (p <= 0 || p >= 1) {
          error.value = 'p phải nằm trong (0, 1)'
          return
        }
        result.value = fmt(inverseNormal(p, mu.value, s))
      }
    } else if (dist.value === 'binomial') {
      const n = nTrials.value,
        p = prob.value
      if (!Number.isInteger(n) || n < 1) {
        error.value = 'n phải là số nguyên ≥ 1'
        return
      }
      if (p < 0 || p > 1) {
        error.value = 'p phải nằm trong [0, 1]'
        return
      }

      if (calcType.value === 'pmf') {
        result.value = fmt(binomialPMF(kVal.value, n, p))
      } else if (calcType.value === 'cdf') {
        result.value = fmt(binomialCDF(kVal.value, n, p))
      } else if (calcType.value === 'upper') {
        result.value = fmt(1 - binomialCDF(kVal.value - 1, n, p))
      } else if (calcType.value === 'between') {
        result.value = fmt(binomialCDF(kUpper.value, n, p) - binomialCDF(kLower.value - 1, n, p))
      }
    } else {
      const lam = lambda.value
      if (lam <= 0) {
        error.value = 'λ phải > 0'
        return
      }

      if (calcType.value === 'pmf') {
        result.value = fmt(poissonPMF(pKVal.value, lam))
      } else if (calcType.value === 'cdf') {
        result.value = fmt(poissonCDF(pKVal.value, lam))
      } else if (calcType.value === 'upper') {
        result.value = fmt(1 - poissonCDF(pKVal.value - 1, lam))
      } else if (calcType.value === 'between') {
        result.value = fmt(poissonCDF(pKUpper.value, lam) - poissonCDF(pKLower.value - 1, lam))
      }
    }
  } catch {
    error.value = 'Lỗi tính toán'
  }
}

function selectCalcType(id: CalcType) {
  calcType.value = id
  result.value = null
}

function clearAll() {
  mu.value = 0
  sigma.value = 1
  xVal.value = 0
  xLower.value = 0
  xUpper.value = 1
  pVal.value = 0.5
  nTrials.value = 10
  prob.value = 0.5
  kVal.value = 0
  kLower.value = 0
  kUpper.value = 5
  lambda.value = 1
  pKVal.value = 0
  pKLower.value = 0
  pKUpper.value = 3
  result.value = null
  error.value = ''
}
</script>

<template>
  <div class="dist-mode">
    <!-- Distribution selector -->
    <div class="dist-tabs">
      <button
        v-for="d in [
          { id: 'normal', label: 'Chuẩn' },
          { id: 'binomial', label: 'Nhị thức' },
          { id: 'poisson', label: 'Poisson' },
        ] as { id: Dist; label: string }[]"
        :key="d.id"
        class="dist-tab"
        :class="{ active: dist === d.id }"
        @click="switchDist(d.id)"
      >
        {{ d.label }}
      </button>
    </div>

    <!-- Calc type selector -->
    <div class="calc-types">
      <button
        v-for="opt in calcOptions"
        :key="opt.id"
        class="calc-type-btn"
        :class="{ active: calcType === opt.id }"
        @click="selectCalcType(opt.id)"
      >
        {{ opt.label }}
      </button>
    </div>

    <div class="params">
      <!-- ═══ NORMAL ═══ -->
      <template v-if="dist === 'normal'">
        <div class="param-row">
          <div class="param-field">
            <label>μ (trung bình)</label>
            <input v-model.number="mu" type="number" class="p-input" inputmode="decimal" />
          </div>
          <div class="param-field">
            <label>σ (độ lệch chuẩn)</label>
            <input v-model.number="sigma" type="number" class="p-input" inputmode="decimal" />
          </div>
        </div>

        <div v-if="calcType === 'cdf' || calcType === 'upper'" class="param-row">
          <div class="param-field full">
            <label>x</label>
            <input v-model.number="xVal" type="number" class="p-input" inputmode="decimal" />
          </div>
        </div>

        <div v-if="calcType === 'between'" class="param-row">
          <div class="param-field">
            <label>a (dưới)</label>
            <input v-model.number="xLower" type="number" class="p-input" inputmode="decimal" />
          </div>
          <div class="param-field">
            <label>b (trên)</label>
            <input v-model.number="xUpper" type="number" class="p-input" inputmode="decimal" />
          </div>
        </div>

        <div v-if="calcType === 'inverse'" class="param-row">
          <div class="param-field full">
            <label>p (xác suất)</label>
            <input
              v-model.number="pVal"
              type="number"
              step="0.01"
              min="0"
              max="1"
              class="p-input"
              inputmode="decimal"
            />
          </div>
        </div>
      </template>

      <!-- ═══ BINOMIAL ═══ -->
      <template v-if="dist === 'binomial'">
        <div class="param-row">
          <div class="param-field">
            <label>n (số phép thử)</label>
            <input
              v-model.number="nTrials"
              type="number"
              min="1"
              class="p-input"
              inputmode="numeric"
            />
          </div>
          <div class="param-field">
            <label>p (xác suất)</label>
            <input
              v-model.number="prob"
              type="number"
              step="0.01"
              min="0"
              max="1"
              class="p-input"
              inputmode="decimal"
            />
          </div>
        </div>

        <div
          v-if="calcType === 'pmf' || calcType === 'cdf' || calcType === 'upper'"
          class="param-row"
        >
          <div class="param-field full">
            <label>k</label>
            <input
              v-model.number="kVal"
              type="number"
              min="0"
              class="p-input"
              inputmode="numeric"
            />
          </div>
        </div>

        <div v-if="calcType === 'between'" class="param-row">
          <div class="param-field">
            <label>a (dưới)</label>
            <input
              v-model.number="kLower"
              type="number"
              min="0"
              class="p-input"
              inputmode="numeric"
            />
          </div>
          <div class="param-field">
            <label>b (trên)</label>
            <input
              v-model.number="kUpper"
              type="number"
              min="0"
              class="p-input"
              inputmode="numeric"
            />
          </div>
        </div>
      </template>

      <!-- ═══ POISSON ═══ -->
      <template v-if="dist === 'poisson'">
        <div class="param-row">
          <div class="param-field full">
            <label>λ (tỉ lệ)</label>
            <input
              v-model.number="lambda"
              type="number"
              min="0"
              step="0.1"
              class="p-input"
              inputmode="decimal"
            />
          </div>
        </div>

        <div
          v-if="calcType === 'pmf' || calcType === 'cdf' || calcType === 'upper'"
          class="param-row"
        >
          <div class="param-field full">
            <label>k</label>
            <input
              v-model.number="pKVal"
              type="number"
              min="0"
              class="p-input"
              inputmode="numeric"
            />
          </div>
        </div>

        <div v-if="calcType === 'between'" class="param-row">
          <div class="param-field">
            <label>a (dưới)</label>
            <input
              v-model.number="pKLower"
              type="number"
              min="0"
              class="p-input"
              inputmode="numeric"
            />
          </div>
          <div class="param-field">
            <label>b (trên)</label>
            <input
              v-model.number="pKUpper"
              type="number"
              min="0"
              class="p-input"
              inputmode="numeric"
            />
          </div>
        </div>
      </template>
    </div>

    <!-- Error -->
    <div v-if="error" class="err">{{ error }}</div>

    <!-- Result -->
    <div v-if="result !== null" class="result-box">
      <span class="result-label">Kết quả</span>
      <span class="result-val">{{ result }}</span>
    </div>

    <!-- Actions -->
    <div class="actions">
      <button class="act-btn act-clear" @click="clearAll">AC</button>
      <button class="act-btn act-calc" @click="compute">Tính</button>
    </div>

    <!-- Formula hint -->
    <div class="formula-hint">
      <template v-if="dist === 'normal'">
        <p>X ~ N(μ, σ²)</p>
        <p v-if="calcType === 'cdf'">P(X ≤ x) = Φ((x − μ) / σ)</p>
        <p v-if="calcType === 'upper'">P(X ≥ x) = 1 − Φ((x − μ) / σ)</p>
        <p v-if="calcType === 'between'">P(a ≤ X ≤ b) = Φ((b−μ)/σ) − Φ((a−μ)/σ)</p>
        <p v-if="calcType === 'inverse'">Tìm x sao cho P(X ≤ x) = p</p>
      </template>
      <template v-if="dist === 'binomial'">
        <p>X ~ B(n, p)</p>
        <p v-if="calcType === 'pmf'">P(X = k) = C(n,k) · pᵏ · (1−p)ⁿ⁻ᵏ</p>
        <p v-if="calcType === 'cdf'">P(X ≤ k) = Σᵢ₌₀ᵏ P(X = i)</p>
        <p v-if="calcType === 'upper'">P(X ≥ k) = 1 − P(X ≤ k−1)</p>
        <p v-if="calcType === 'between'">P(a ≤ X ≤ b) = P(X ≤ b) − P(X ≤ a−1)</p>
      </template>
      <template v-if="dist === 'poisson'">
        <p>X ~ Poisson(λ)</p>
        <p v-if="calcType === 'pmf'">P(X = k) = e⁻λ · λᵏ / k!</p>
        <p v-if="calcType === 'cdf'">P(X ≤ k) = Σᵢ₌₀ᵏ P(X = i)</p>
        <p v-if="calcType === 'upper'">P(X ≥ k) = 1 − P(X ≤ k−1)</p>
        <p v-if="calcType === 'between'">P(a ≤ X ≤ b) = P(X ≤ b) − P(X ≤ a−1)</p>
      </template>
    </div>
  </div>
</template>

<style scoped>
.dist-mode {
  display: flex;
  flex-direction: column;
  padding: 14px;
  gap: 12px;
}

/* ── Distribution tabs ── */
.dist-tabs {
  display: flex;
  gap: 3px;
  background: #0a1218;
  border-radius: 6px;
  padding: 3px;
}
.dist-tab {
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
.dist-tab:hover {
  color: var(--color-text-secondary);
}
.dist-tab.active {
  background: #162232;
  color: var(--color-accent-sky);
}

/* ── Calc type buttons ── */
.calc-types {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.calc-type-btn {
  flex: 1;
  min-width: 0;
  padding: 6px 4px;
  font-family: 'Courier New', monospace;
  font-size: 10px;
  font-weight: 600;
  color: #6b8299;
  background: #0a1218;
  border: 1px solid #1e2d42;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.calc-type-btn:hover {
  border-color: var(--color-accent-sky);
  color: var(--color-text-secondary);
}
.calc-type-btn.active {
  background: #162232;
  border-color: var(--color-accent-sky);
  color: var(--color-accent-sky);
}

/* ── Parameters ── */
.params {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.param-row {
  display: flex;
  gap: 8px;
}
.param-field {
  flex: 1;
}
.param-field.full {
  flex: 1;
}
.param-field label {
  display: block;
  font-size: 10px;
  font-weight: 600;
  color: var(--color-text-dim);
  margin-bottom: 3px;
  font-family: var(--font-display, 'Anybody', sans-serif);
}
.p-input {
  width: 100%;
  padding: 8px 8px;
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
  transition: border-color 0.15s;
}
.p-input::-webkit-outer-spin-button,
.p-input::-webkit-inner-spin-button {
  appearance: none;
  -webkit-appearance: none;
  margin: 0;
}
.p-input:focus {
  border-color: var(--color-accent-sky);
}

/* ── Error ── */
.err {
  color: var(--color-accent-coral);
  font-size: 12px;
  font-weight: 600;
  text-align: center;
}

/* ── Result ── */
.result-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: #0a1218;
  border: 1px solid #1a2d42;
  border-radius: 6px;
}
.result-label {
  font-size: 11px;
  color: var(--color-text-dim);
  font-weight: 600;
}
.result-val {
  font-family: var(--font-display, 'Anybody', sans-serif);
  font-size: 20px;
  font-weight: 700;
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

/* ── Formula hint ── */
.formula-hint {
  text-align: center;
  padding: 8px;
  border-top: 1px solid #111e2d;
}
.formula-hint p {
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: #3a5060;
  line-height: 1.6;
}
</style>
