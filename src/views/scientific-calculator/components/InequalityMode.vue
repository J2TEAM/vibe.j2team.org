<script setup lang="ts">
import { ref, computed } from 'vue'
import { formatResult } from '../engine'

const degree = ref(2)
const direction = ref<'<' | '<=' | '>' | '>='>('<')
const coeffs = ref([1, 0, -4]) // ax² + bx + c  < 0 => x² - 4 < 0

const dirOptions: { label: string; value: '<' | '<=' | '>' | '>=' }[] = [
  { label: '< 0', value: '<' },
  { label: '≤ 0', value: '<=' },
  { label: '> 0', value: '>' },
  { label: '≥ 0', value: '>=' },
]

function setDegree(d: number) {
  degree.value = d
  coeffs.value = Array(d + 1).fill(0) as number[]
  ;(coeffs.value as number[])[0] = 1
}

const roots = computed(() => {
  try {
    const c = coeffs.value
    const d = degree.value
    if (d === 2) return solveQuad(c[0]!, c[1]!, c[2]!)
    if (d === 3) return solveCubic(c[0]!, c[1]!, c[2]!, c[3]!)
    if (d === 4) return solveQuartic(c)
    return []
  } catch {
    return []
  }
})

function solveQuad(a: number, b: number, c: number): number[] {
  if (Math.abs(a) < 1e-12) return Math.abs(b) < 1e-12 ? [] : [-c / b]
  const disc = b * b - 4 * a * c
  if (disc < -1e-12) return []
  if (Math.abs(disc) < 1e-12) return [-b / (2 * a)]
  const sd = Math.sqrt(disc)
  return [(-b - sd) / (2 * a), (-b + sd) / (2 * a)].sort((x, y) => x - y)
}

function solveCubic(a: number, b: number, c: number, d: number): number[] {
  if (Math.abs(a) < 1e-12) return solveQuad(b, c, d)
  // Depressed cubic: t³ + pt + q = 0  with x = t - b/(3a)
  const p = (3 * a * c - b * b) / (3 * a * a)
  const q = (2 * b * b * b - 9 * a * b * c + 27 * a * a * d) / (27 * a * a * a)
  const disc = -(4 * p * p * p + 27 * q * q)
  const shift = -b / (3 * a)
  const realRoots: number[] = []

  if (disc > 1e-12) {
    // Three real roots
    const m = 2 * Math.sqrt(-p / 3)
    const theta = Math.acos((3 * q) / (p * m)) / 3
    for (let k = 0; k < 3; k++) {
      realRoots.push(m * Math.cos(theta - (2 * Math.PI * k) / 3) + shift)
    }
  } else {
    // One or two real roots via Cardano
    const sqrtDisc27 = Math.sqrt((q * q) / 4 + (p * p * p) / 27)
    const A = Math.cbrt(-q / 2 + sqrtDisc27)
    const B = Math.cbrt(-q / 2 - sqrtDisc27)
    realRoots.push(A + B + shift)
    // Check if double root
    if (Math.abs(disc) < 1e-8) {
      realRoots.push(-(A + B) / 2 + shift)
    }
  }
  return [...new Set(realRoots.map((r) => (Math.abs(r) < 1e-10 ? 0 : r)))].sort((a, b) => a - b)
}

function solveQuartic(c: number[]): number[] {
  // Numerical approach: find roots by companion matrix eigenvalue would be complex.
  // Use Newton-Raphson to find roots numerically
  const f = (x: number) =>
    c[0]! * x ** 4 + c[1]! * x ** 3 + c[2]! * x ** 2 + (c[3] ?? 0) * x + (c[4] ?? 0)
  const df = (x: number) => 4 * c[0]! * x ** 3 + 3 * c[1]! * x ** 2 + 2 * c[2]! * x + (c[3] ?? 0)
  const foundRoots: number[] = []
  // Search with many starting points
  for (let start = -100; start <= 100; start += 0.5) {
    let x = start
    for (let i = 0; i < 50; i++) {
      const d = df(x)
      if (Math.abs(d) < 1e-15) break
      x = x - f(x) / d
    }
    if (Math.abs(f(x)) < 1e-6) {
      const r = Math.abs(x) < 1e-10 ? 0 : parseFloat(x.toFixed(10))
      if (!foundRoots.some((rr) => Math.abs(rr - r) < 1e-6)) {
        foundRoots.push(r)
      }
    }
  }
  return foundRoots.sort((a, b) => a - b)
}

const solution = computed(() => {
  const r = roots.value
  const d = direction.value
  const isStrict = d === '<' || d === '>'
  const isGreater = d === '>' || d === '>='

  if (r.length === 0) {
    // No real roots → polynomial never crosses zero
    const testVal = evalPoly(0)
    if (isGreater ? testVal > 0 : testVal < 0) return 'ℝ (tất cả số thực)'
    if (!isStrict && testVal === 0) return 'ℝ'
    return '∅ (vô nghiệm)'
  }

  const sorted = [...r].sort((a, b) => a - b)
  // Test sign in each interval
  const intervals: string[] = []
  const testPoints: number[] = [sorted[0]! - 1]
  for (let i = 0; i < sorted.length - 1; i++) {
    testPoints.push((sorted[i]! + sorted[i + 1]!) / 2)
  }
  testPoints.push(sorted[sorted.length - 1]! + 1)

  const br = isStrict ? '(' : '['
  const bl = isStrict ? ')' : ']'

  for (let i = 0; i < testPoints.length; i++) {
    const val = evalPoly(testPoints[i]!)
    const satisfies = isGreater
      ? isStrict
        ? val > 1e-12
        : val >= -1e-12
      : isStrict
        ? val < -1e-12
        : val <= 1e-12
    if (satisfies) {
      const left = i === 0 ? '(−∞' : `${br}${formatResult(sorted[i - 1]!)}`
      const right = i === testPoints.length - 1 ? '+∞)' : `${formatResult(sorted[i]!)}${bl}`
      intervals.push(`${left}; ${right}`)
    }
  }

  if (!isStrict) {
    // Include root points
    for (const root of sorted) {
      const rs = formatResult(root)
      const alreadyIncluded = intervals.some((iv) => iv.includes(rs))
      if (!alreadyIncluded) intervals.push(`{${rs}}`)
    }
  }

  return intervals.length > 0 ? intervals.join(' ∪ ') : '∅ (vô nghiệm)'
})

function evalPoly(x: number): number {
  const c = coeffs.value
  let result = 0
  for (let i = 0; i <= degree.value; i++) {
    result += (c[i] ?? 0) * Math.pow(x, degree.value - i)
  }
  return result
}

const polyDisplay = computed(() => {
  const c = coeffs.value
  const d = degree.value
  const parts: string[] = []
  for (let i = 0; i <= d; i++) {
    const power = d - i
    const val = c[i] ?? 0
    if (Math.abs(val) < 1e-12 && power > 0) continue
    let term = ''
    if (parts.length > 0 && val >= 0) term += '+ '
    if (val < 0) term += '− '
    const absVal = Math.abs(val)
    if (power === 0) term += formatResult(absVal)
    else if (absVal !== 1) term += formatResult(absVal)
    if (power > 1) term += `x${superscript(power)}`
    else if (power === 1) term += 'x'
    parts.push(term)
  }
  return (
    (parts.join(' ') || '0') +
    ` ${direction.value === '<' ? '<' : direction.value === '<=' ? '≤' : direction.value === '>' ? '>' : '≥'} 0`
  )
})

function superscript(n: number): string {
  const map: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴' }
  return String(n)
    .split('')
    .map((c) => map[c] ?? c)
    .join('')
}

const coeffLabels = computed(() => {
  const d = degree.value
  const labels: string[] = []
  for (let i = 0; i <= d; i++) {
    const power = d - i
    if (power > 1) labels.push(`x${superscript(power)}`)
    else if (power === 1) labels.push('x')
    else labels.push('const')
  }
  return labels
})
</script>

<template>
  <div class="mode-panel">
    <div class="mode-header">
      <h3>Bất phương trình</h3>
    </div>

    <div class="degree-row">
      <span class="label">Bậc:</span>
      <button
        v-for="d in [2, 3, 4]"
        :key="d"
        :class="{ active: degree === d }"
        @click="setDegree(d)"
      >
        {{ d }}
      </button>
      <span class="sep">|</span>
      <button
        v-for="opt in dirOptions"
        :key="opt.value"
        :class="{ active: direction === opt.value }"
        @click="direction = opt.value"
      >
        {{ opt.label }}
      </button>
    </div>

    <!-- Coefficient inputs -->
    <div class="coeff-grid">
      <div v-for="(label, i) in coeffLabels" :key="i" class="coeff-field">
        <label>{{ label }}</label>
        <input v-model.number="coeffs[i]" type="number" step="any" />
      </div>
    </div>

    <!-- Display -->
    <div class="display-box">
      <div class="poly-display">{{ polyDisplay }}</div>
    </div>

    <!-- Roots -->
    <div v-if="roots.length > 0" class="roots-section">
      <span class="sub-label">Nghiệm thực:</span>
      <span v-for="(r, i) in roots" :key="i" class="root-val">
        x{{ roots.length > 1 ? `₍${i + 1}₎` : '' }} = {{ formatResult(r) }}
      </span>
    </div>
    <div v-else class="roots-section">
      <span class="sub-label">Không có nghiệm thực</span>
    </div>

    <!-- Solution -->
    <div class="solution-box">
      <span class="sub-label">Tập nghiệm:</span>
      <div class="solution-text">{{ solution }}</div>
    </div>
  </div>
</template>

<style scoped>
.mode-panel {
  padding: 12px;
}
.mode-header {
  margin-bottom: 10px;
}
.mode-header h3 {
  font-family: var(--font-display, 'Anybody', sans-serif);
  font-size: 14px;
  color: #c8d6e5;
  margin: 0;
}
.degree-row {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}
.label {
  font-size: 11px;
  color: var(--color-text-secondary);
  margin-right: 4px;
}
.sep {
  color: var(--color-border-default);
  margin: 0 4px;
}
.degree-row button {
  padding: 4px 10px;
  font-size: 11px;
  border: 1px solid var(--color-border-default);
  background: #131f2e;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-family: inherit;
  border-radius: 4px;
}
.degree-row button.active {
  background: #1e3a55;
  border-color: var(--color-accent-sky);
  color: var(--color-accent-sky);
}
.coeff-grid {
  display: flex;
  gap: 6px;
  margin-bottom: 10px;
}
.coeff-field {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: 1;
}
.coeff-field label {
  font-size: 10px;
  color: var(--color-text-dim);
  font-weight: 600;
}
.coeff-field input {
  width: 100%;
  background: #0a1218;
  border: 1px solid #1e2d42;
  color: #c8d6e5;
  text-align: center;
  padding: 10px 4px;
  font-size: 16px;
  font-family: 'Courier New', monospace;
  border-radius: 4px;
}
.coeff-field input:focus {
  border-color: var(--color-accent-sky);
  outline: none;
}
.display-box {
  background: #0a1218;
  border: 2px solid #1a2d42;
  border-radius: 8px;
  padding: 14px;
  margin-bottom: 10px;
}
.poly-display {
  font-family: 'Courier New', monospace;
  font-size: 16px;
  color: #c8d6e5;
  text-align: center;
}
.roots-section {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  font-size: 12px;
  color: var(--color-text-secondary);
}
.sub-label {
  font-size: 11px;
  color: var(--color-text-dim);
}
.root-val {
  background: #131f2e;
  border: 1px solid #1e2d42;
  padding: 4px 8px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  color: #c8d6e5;
}
.solution-box {
  background: #0a1218;
  border: 2px solid #1e3a55;
  border-radius: 8px;
  padding: 14px;
}
.solution-text {
  font-family: 'Courier New', monospace;
  font-size: 16px;
  color: var(--color-accent-sky);
  text-align: center;
  margin-top: 6px;
  word-break: break-word;
}
</style>
