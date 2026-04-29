import type { AngleMode, CalcResult } from './types'

// ── Shunting-Yard expression parser (replaces mathjs) ──
type Token =
  | { t: 'num'; v: number }
  | { t: 'op'; v: string }
  | { t: 'fn'; v: string }
  | { t: '(' }
  | { t: ')' }
  | { t: ',' }

const PREC: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 2, '%': 2, '^': 3 }
const RIGHT_ASSOC = new Set(['^'])

function tokenize(expr: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  while (i < expr.length) {
    const ch = expr[i]!
    if (ch === ' ') {
      i++
      continue
    }
    if (ch === '(') {
      tokens.push({ t: '(' })
      i++
      continue
    }
    if (ch === ')') {
      tokens.push({ t: ')' })
      i++
      continue
    }
    if (ch === ',') {
      tokens.push({ t: ',' })
      i++
      continue
    }
    // Factorial postfix
    if (ch === '!') {
      tokens.push({ t: 'op', v: '!' })
      i++
      continue
    }
    // Number (including scientific notation like 3.14e-5)
    if (/[\d.]/.test(ch)) {
      let num = ''
      while (i < expr.length && /[\d.]/.test(expr[i]!)) num += expr[i++]
      if (i < expr.length && /[eE]/.test(expr[i]!)) {
        num += expr[i++]
        if (i < expr.length && /[+-]/.test(expr[i]!)) num += expr[i++]
        while (i < expr.length && /\d/.test(expr[i]!)) num += expr[i++]
      }
      tokens.push({ t: 'num', v: parseFloat(num) })
      continue
    }
    // Operator
    if (ch === '+' || ch === '*' || ch === '/' || ch === '^' || ch === '%') {
      tokens.push({ t: 'op', v: ch })
      i++
      continue
    }
    // Minus: unary vs binary
    if (ch === '-') {
      const prev = tokens[tokens.length - 1]
      if (!prev || prev.t === 'op' || prev.t === '(' || prev.t === ',') {
        tokens.push({ t: 'num', v: 0 })
      }
      tokens.push({ t: 'op', v: '-' })
      i++
      continue
    }
    // Function or identifier
    if (/[a-zA-Z_]/.test(ch)) {
      let name = ''
      while (i < expr.length && /[a-zA-Z_\d]/.test(expr[i]!)) name += expr[i++]
      tokens.push({ t: 'fn', v: name })
      continue
    }
    throw new Error('Syntax Error')
  }
  return tokens
}

function shuntingYard(expr: string, scope: Record<string, (...args: number[]) => number>): number {
  const tokens = tokenize(expr)
  const output: number[] = []
  const ops: (Token & { argCount?: number })[] = []

  function applyOp(op: string) {
    if (op === '!') {
      const a = output.pop()
      if (a === undefined) throw new Error('Syntax Error')
      if (a < 0 || !Number.isInteger(a) || a > 170) throw new Error('Math Error')
      let r = 1
      for (let j = 2; j <= a; j++) r *= j
      output.push(r)
      return
    }
    const b = output.pop(),
      a = output.pop()
    if (a === undefined || b === undefined) throw new Error('Syntax Error')
    switch (op) {
      case '+':
        output.push(a + b)
        break
      case '-':
        output.push(a - b)
        break
      case '*':
        output.push(a * b)
        break
      case '/':
        output.push(a / b)
        break
      case '%':
        output.push(a % b)
        break
      case '^':
        output.push(Math.pow(a, b))
        break
      default:
        throw new Error('Syntax Error')
    }
  }

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i]!
    if (tok.t === 'num') {
      output.push(tok.v)
    } else if (tok.t === 'fn') {
      // Check if followed by '(' → function call; otherwise treat as scope constant
      if (tokens[i + 1]?.t === '(') {
        ops.push({ ...tok, argCount: 0 })
      } else {
        // It's a bare identifier — look up in scope as 0-arg or error
        const fn = scope[tok.v]
        if (!fn) throw new Error('Syntax Error')
        output.push(fn())
      }
    } else if (tok.t === ',') {
      while (ops.length && ops[ops.length - 1]!.t !== '(') {
        const op = ops.pop()!
        if (op.t === 'op') applyOp(op.v)
      }
      // Increment arg count on the function
      const fnTok = [...ops].reverse().find((o) => o.t === 'fn')
      if (fnTok && fnTok.argCount !== undefined) fnTok.argCount++
    } else if (tok.t === 'op') {
      if (tok.v === '!') {
        // Postfix: apply immediately
        applyOp('!')
      } else {
        const p = PREC[tok.v]!
        while (ops.length) {
          const top = ops[ops.length - 1]!
          if (
            top.t === 'op' &&
            top.v !== '!' &&
            PREC[top.v] !== undefined &&
            (PREC[top.v]! > p || (PREC[top.v]! === p && !RIGHT_ASSOC.has(tok.v)))
          ) {
            ops.pop()
            applyOp(top.v)
          } else break
        }
        ops.push(tok)
      }
    } else if (tok.t === '(') {
      ops.push(tok)
      // If preceded by a function, set initial arg count to 1 (unless next is ')')
      if (ops.length >= 2 && ops[ops.length - 2]?.t === 'fn') {
        const fnTok = ops[ops.length - 2]!
        if (fnTok.argCount !== undefined) {
          fnTok.argCount = tokens[i + 1]?.t === ')' ? 0 : 1
        }
      }
    } else if (tok.t === ')') {
      while (ops.length && ops[ops.length - 1]!.t !== '(') {
        const op = ops.pop()!
        if (op.t === 'op') applyOp(op.v)
        else throw new Error('Syntax Error')
      }
      if (!ops.length) throw new Error('Syntax Error')
      ops.pop() // remove '('
      // If a function is on top, apply it
      if (ops.length && ops[ops.length - 1]?.t === 'fn') {
        const fnTok = ops.pop() as Token & { t: 'fn'; v: string; argCount?: number }
        const fn = scope[fnTok.v]
        if (!fn) throw new Error('Syntax Error')
        const argc = fnTok.argCount ?? 0
        const args: number[] = []
        for (let j = 0; j < argc; j++) {
          const v = output.pop()
          if (v === undefined) throw new Error('Syntax Error')
          args.unshift(v)
        }
        output.push(fn(...args))
      }
    }
  }

  while (ops.length) {
    const op = ops.pop()!
    if (op.t === '(' || op.t === ')') throw new Error('Syntax Error')
    if (op.t === 'op') applyOp(op.v)
    else throw new Error('Syntax Error')
  }

  if (output.length !== 1) throw new Error('Syntax Error')
  return output[0]!
}

function formatNum(value: number, precision: number): string {
  if (!isFinite(value)) return String(value)
  const s = value.toPrecision(precision)
  // toPrecision may return scientific notation for very large/small values
  if (s.includes('e') || s.includes('E')) return s
  if (s.includes('.')) return s.replace(/0+$/, '').replace(/\.$/, '')
  return s
}

let angleMode: AngleMode = 'DEG'
let ans = 0
let preAns = 0
const vars: Record<string, number> = {}

export function setAngleMode(mode: AngleMode): void {
  angleMode = mode
}

export function getAngleMode(): AngleMode {
  return angleMode
}

export function cycleAngleMode(): AngleMode {
  const modes: AngleMode[] = ['DEG', 'RAD', 'GRA']
  angleMode = modes[(modes.indexOf(angleMode) + 1) % 3] as AngleMode
  return angleMode
}

export function setVar(name: string, value: number): void {
  vars[name] = value
}

export function getVar(name: string): number | undefined {
  return vars[name]
}

export function getAllVars(): Record<string, number> {
  return { ...vars }
}

export function getAns(): number {
  return ans
}

export function getPreAns(): number {
  return preAns
}

export function toRad(x: number): number {
  if (angleMode === 'DEG') return (x * Math.PI) / 180
  if (angleMode === 'GRA') return (x * Math.PI) / 200
  return x
}

export function fromRad(x: number): number {
  if (angleMode === 'DEG') return (x * 180) / Math.PI
  if (angleMode === 'GRA') return (x * 200) / Math.PI
  return x
}

// ── GCD / LCM ──
export function gcd(a: number, b: number): number {
  a = Math.abs(Math.round(a))
  b = Math.abs(Math.round(b))
  while (b) {
    ;[a, b] = [b, a % b]
  }
  return a
}

export function lcm(a: number, b: number): number {
  a = Math.abs(Math.round(a))
  b = Math.abs(Math.round(b))
  if (a === 0 && b === 0) return 0
  return (a / gcd(a, b)) * b
}

// ── Prime factorization ──
export function primeFactors(n: number): string {
  n = Math.abs(Math.round(n))
  if (n < 2) return String(n)
  if (n > 9999999999) return 'Error'
  const factors: [number, number][] = []
  let d = 2
  while (d * d <= n) {
    let count = 0
    while (n % d === 0) {
      n /= d
      count++
    }
    if (count > 0) factors.push([d, count])
    d++
  }
  if (n > 1) factors.push([n, 1])
  return factors.map(([p, e]) => (e > 1 ? `${p}^${e}` : String(p))).join(' × ')
}

// ── Remainder division ──
export function divRemainder(a: number, b: number): { quotient: number; remainder: number } | null {
  if (b === 0) return null
  const q = Math.trunc(a / b)
  const r = a - q * b
  return { quotient: q, remainder: r }
}

// ── Percentage ──
export function percent(x: number): number {
  return x / 100
}

// ── Coordinate conversion ──
export function pol(x: number, y: number): { r: number; theta: number } {
  const r = Math.sqrt(x * x + y * y)
  const theta = fromRad(Math.atan2(y, x))
  return { r, theta }
}

export function rec(r: number, theta: number): { x: number; y: number } {
  const rad = toRad(theta)
  return { x: r * Math.cos(rad), y: r * Math.sin(rad) }
}

// ── Numerical integration (Simpson's rule) ──
export function integrate(exprStr: string, a: number, b: number, n = 100): number {
  if (a === b) return 0
  if (n % 2 !== 0) n++
  const h = (b - a) / n
  const f = (x: number): number => {
    const saved = vars['X']
    vars['X'] = x
    try {
      const r = calc(exprStr)
      return r.ok ? r.raw : 0
    } finally {
      if (saved !== undefined) vars['X'] = saved
      else delete vars['X']
    }
  }
  let sum = f(a) + f(b)
  for (let i = 1; i < n; i++) {
    sum += (i % 2 === 0 ? 2 : 4) * f(a + i * h)
  }
  return (h / 3) * sum
}

// ── Numerical differentiation ──
export function differentiate(exprStr: string, x0: number): number {
  const h = 1e-5
  const f = (x: number): number => {
    const saved = vars['X']
    vars['X'] = x
    try {
      const r = calc(exprStr)
      return r.ok ? r.raw : 0
    } finally {
      if (saved !== undefined) vars['X'] = saved
      else delete vars['X']
    }
  }
  return (-f(x0 + 2 * h) + 8 * f(x0 + h) - 8 * f(x0 - h) + f(x0 - 2 * h)) / (12 * h)
}

// ── Sigma summation ──
export function sigma(exprStr: string, start: number, end: number): number {
  let sum = 0
  for (let i = Math.round(start); i <= Math.round(end); i++) {
    const saved = vars['X']
    vars['X'] = i
    try {
      const r = calc(exprStr)
      if (r.ok) sum += r.raw
    } finally {
      if (saved !== undefined) vars['X'] = saved
      else delete vars['X']
    }
  }
  return sum
}

// ── Pi product ──
export function product(exprStr: string, start: number, end: number): number {
  let prod = 1
  for (let i = Math.round(start); i <= Math.round(end); i++) {
    const saved = vars['X']
    vars['X'] = i
    try {
      const r = calc(exprStr)
      if (r.ok) prod *= r.raw
    } finally {
      if (saved !== undefined) vars['X'] = saved
      else delete vars['X']
    }
  }
  return prod
}

// ── Random integer ──
export function ranInt(a: number, b: number): number {
  a = Math.ceil(a)
  b = Math.floor(b)
  return Math.floor(Math.random() * (b - a + 1)) + a
}

function preprocess(expr: string): string {
  let s = expr
  s = s.replace(/×/g, '*')
  s = s.replace(/÷/g, '/')
  s = s.replace(/π/g, `(${Math.PI})`)
  s = s.replace(/PreAns/g, `(${preAns})`)
  s = s.replace(/Ans/g, `(${ans})`)
  for (const [k, v] of Object.entries(vars)) {
    s = s.replace(new RegExp(`(?<![a-zA-Z])${k}(?![a-zA-Z(])`, 'g'), `(${v})`)
  }
  s = s.replace(/(?<![a-zA-Z\d])e(?![a-zA-Z(])/g, `(${Math.E})`)
  s = s.replace(/\bmod\b/gi, ' % ')
  // Implicit multiplication
  s = s.replace(/(\d)\s*([a-zA-Z])/g, '$1*$2')
  s = s.replace(/(\d)\s*\(/g, '$1*(')
  s = s.replace(/\)\s*(\d)/g, ')*$1')
  s = s.replace(/\)\s*\(/g, ')*(')
  s = s.replace(/\)\s*([a-zA-Z])/g, ')*$1')
  return s
}

function buildScope(): Record<string, (...args: number[]) => number> {
  return {
    sin: (x: number) => Math.sin(toRad(x)),
    cos: (x: number) => Math.cos(toRad(x)),
    tan: (x: number) => {
      const r = toRad(x)
      if (Math.abs(Math.cos(r)) < 1e-15) throw new Error('Math Error')
      return Math.tan(r)
    },
    asin: (x: number) => {
      if (Math.abs(x) > 1) throw new Error('Math Error')
      return fromRad(Math.asin(x))
    },
    acos: (x: number) => {
      if (Math.abs(x) > 1) throw new Error('Math Error')
      return fromRad(Math.acos(x))
    },
    atan: (x: number) => fromRad(Math.atan(x)),
    sinh: Math.sinh,
    cosh: Math.cosh,
    tanh: Math.tanh,
    asinh: Math.asinh,
    acosh: (x: number) => {
      if (x < 1) throw new Error('Math Error')
      return Math.acosh(x)
    },
    atanh: (x: number) => {
      if (Math.abs(x) >= 1) throw new Error('Math Error')
      return Math.atanh(x)
    },
    log: (x: number) => {
      if (x <= 0) throw new Error('Math Error')
      return Math.log10(x)
    },
    logbase: (base: number, x: number) => {
      if (x <= 0 || base <= 0 || base === 1) throw new Error('Math Error')
      return Math.log(x) / Math.log(base)
    },
    ln: (x: number) => {
      if (x <= 0) throw new Error('Math Error')
      return Math.log(x)
    },
    sqrt: (x: number) => {
      if (x < 0) throw new Error('Math Error')
      return Math.sqrt(x)
    },
    cbrt: Math.cbrt,
    abs: Math.abs,
    exp: Math.exp,
    nPr: (n: number, r: number) => {
      if (n < 0 || r < 0 || r > n || !Number.isInteger(n) || !Number.isInteger(r))
        throw new Error('Math Error')
      let res = 1
      for (let i = 0; i < r; i++) res *= n - i
      return res
    },
    nCr: (n: number, r: number) => {
      if (n < 0 || r < 0 || r > n || !Number.isInteger(n) || !Number.isInteger(r))
        throw new Error('Math Error')
      let res = 1
      for (let i = 0; i < r; i++) res = (res * (n - i)) / (i + 1)
      return Math.round(res)
    },
    Rnd: (x: number) => Math.round(x * 1e10) / 1e10,
    Int: Math.trunc,
    Intg: Math.floor,
    Frac: (x: number) => x - Math.trunc(x),
    GCD: (a: number, b: number) => gcd(a, b),
    LCM: (a: number, b: number) => lcm(a, b),
    Pol: (x: number, y: number) => pol(x, y).r,
    Rec: (r: number, t: number) => rec(r, t).x,
    RanInt: (a: number, b: number) => ranInt(a, b),
    random: () => Math.random(),
  }
}

export function formatResult(value: number): string {
  if (Number.isInteger(value) && Math.abs(value) < 1e15) return String(value)
  const s = formatNum(value, 10)
  if (s.includes('.') && !s.includes('e')) {
    return s.replace(/0+$/, '').replace(/\.$/, '')
  }
  return s
}

export function calc(expression: string): CalcResult {
  const trimmed = expression.trim()
  if (!trimmed) return { ok: false, error: 'Syntax Error' }
  try {
    const processed = preprocess(trimmed)
    const result = shuntingYard(processed, buildScope())
    if (typeof result !== 'number' || !isFinite(result)) {
      return { ok: false, error: 'Math Error' }
    }
    preAns = ans
    ans = result
    return { ok: true, value: formatResult(result), raw: result }
  } catch (err) {
    if (err instanceof Error && err.message.includes('Math Error'))
      return { ok: false, error: 'Math Error' }
    return { ok: false, error: 'Syntax Error' }
  }
}

export function toFraction(value: number): { num: number; den: number } | null {
  if (!isFinite(value) || Number.isInteger(value)) return null
  const sign = value < 0 ? -1 : 1
  const abs = Math.abs(value)
  let bestNum = 0,
    bestDen = 1,
    bestErr = abs
  for (let d = 2; d <= 10000; d++) {
    const n = Math.round(abs * d)
    const err = Math.abs(abs - n / d)
    if (err < bestErr) {
      bestNum = n
      bestDen = d
      bestErr = err
    }
    if (err < 1e-12) break
  }
  if (bestErr > 1e-9) return null
  const g = gcd(bestNum, bestDen)
  return { num: sign * (bestNum / g), den: bestDen / g }
}

export function toMixedFraction(value: number): { whole: number; num: number; den: number } | null {
  const f = toFraction(value)
  if (!f) return null
  const whole = Math.trunc(f.num / f.den)
  const num = Math.abs(f.num) - Math.abs(whole) * f.den
  if (num === 0) return null
  return { whole, num, den: f.den }
}

export function decToDMS(decimal: number): string {
  const sign = decimal < 0 ? '-' : ''
  const abs = Math.abs(decimal)
  const deg = Math.floor(abs)
  const minDec = (abs - deg) * 60
  const min = Math.floor(minDec)
  const sec = Math.round((minDec - min) * 60 * 100) / 100
  return `${sign}${deg}°${min}′${sec}″`
}

export function dmsToDec(deg: number, min: number, sec: number): number {
  const sign = deg < 0 ? -1 : 1
  return sign * (Math.abs(deg) + min / 60 + sec / 3600)
}

export function solve(expr: string, varName: string, guess = 0): CalcResult {
  const h = 1e-8
  const maxIter = 200
  const tol = 1e-12
  let x = guess

  const evalAt = (val: number): number => {
    const saved = vars[varName]
    vars[varName] = val
    try {
      const r = calc(expr)
      if (!r.ok) throw new Error(r.error)
      return r.raw
    } finally {
      if (saved !== undefined) vars[varName] = saved
      else delete vars[varName]
    }
  }

  try {
    for (let i = 0; i < maxIter; i++) {
      const fx = evalAt(x)
      if (Math.abs(fx) < tol) return { ok: true, value: formatResult(x), raw: x }
      const dfx = (evalAt(x + h) - evalAt(x - h)) / (2 * h)
      if (Math.abs(dfx) < 1e-15) return { ok: false, error: "Can't Solve" }
      x -= fx / dfx
    }
    if (Math.abs(evalAt(x)) < 1e-6) return { ok: true, value: formatResult(x), raw: x }
    return { ok: false, error: "Can't Solve" }
  } catch {
    return { ok: false, error: 'Math Error' }
  }
}

export function verify(
  expression: string,
): { result: boolean; left: string; right: string } | null {
  const match = expression.match(/^(.+?)(=|≠|<|>|≤|≥)(.+)$/)
  if (!match) return null
  const [, leftExpr, op, rightExpr] = match as RegExpMatchArray
  const left = calc(leftExpr!)
  const right = calc(rightExpr!)
  if (!left.ok || !right.ok) return null

  let result: boolean
  switch (op) {
    case '=':
      result = Math.abs(left.raw - right.raw) < 1e-10
      break
    case '≠':
      result = Math.abs(left.raw - right.raw) >= 1e-10
      break
    case '<':
      result = left.raw < right.raw
      break
    case '>':
      result = left.raw > right.raw
      break
    case '≤':
      result = left.raw <= right.raw + 1e-10
      break
    case '≥':
      result = left.raw >= right.raw - 1e-10
      break
    default:
      return null
  }
  return { result, left: left.value, right: right.value }
}

// ── 47 Scientific Constants (CODATA) ──
export const SCIENTIFIC_CONSTANTS: {
  name: string
  symbol: string
  value: number
  unit: string
  category: string
}[] = [
  { name: 'Proton mass', symbol: 'mp', value: 1.67262192e-27, unit: 'kg', category: 'Atomic' },
  { name: 'Neutron mass', symbol: 'mn', value: 1.6749275e-27, unit: 'kg', category: 'Atomic' },
  { name: 'Electron mass', symbol: 'me', value: 9.1093837e-31, unit: 'kg', category: 'Atomic' },
  { name: 'Muon mass', symbol: 'mμ', value: 1.88353163e-28, unit: 'kg', category: 'Atomic' },
  { name: 'Bohr radius', symbol: 'a₀', value: 5.29177211e-11, unit: 'm', category: 'Atomic' },
  {
    name: 'Planck constant',
    symbol: 'h',
    value: 6.62607015e-34,
    unit: 'J·s',
    category: 'Universal',
  },
  {
    name: 'Reduced Planck',
    symbol: 'ℏ',
    value: 1.05457182e-34,
    unit: 'J·s',
    category: 'Universal',
  },
  { name: 'Speed of light', symbol: 'c₀', value: 299792458, unit: 'm/s', category: 'Universal' },
  {
    name: 'Vacuum permittivity',
    symbol: 'ε₀',
    value: 8.85418782e-12,
    unit: 'F/m',
    category: 'Universal',
  },
  {
    name: 'Vacuum permeability',
    symbol: 'μ₀',
    value: 1.25663706e-6,
    unit: 'N/A²',
    category: 'Universal',
  },
  {
    name: 'Impedance of vacuum',
    symbol: 'Z₀',
    value: 376.730313668,
    unit: 'Ω',
    category: 'Universal',
  },
  {
    name: 'Gravitational constant',
    symbol: 'G',
    value: 6.6743e-11,
    unit: 'N·m²/kg²',
    category: 'Universal',
  },
  { name: 'Planck length', symbol: 'lP', value: 1.61626e-35, unit: 'm', category: 'Universal' },
  { name: 'Planck time', symbol: 'tP', value: 5.39125e-44, unit: 's', category: 'Universal' },
  { name: 'Nuclear magneton', symbol: 'μN', value: 5.05078375e-27, unit: 'J/T', category: 'EM' },
  { name: 'Bohr magneton', symbol: 'μB', value: 9.27401008e-24, unit: 'J/T', category: 'EM' },
  { name: 'Elementary charge', symbol: 'e', value: 1.60217663e-19, unit: 'C', category: 'EM' },
  {
    name: 'Magnetic flux quantum',
    symbol: 'Φ₀',
    value: 2.06783383e-15,
    unit: 'Wb',
    category: 'EM',
  },
  { name: 'Conductance quantum', symbol: 'G₀', value: 7.74809173e-5, unit: 'S', category: 'EM' },
  { name: 'Josephson constant', symbol: 'KJ', value: 4.83597849e14, unit: 'Hz/V', category: 'EM' },
  { name: 'von Klitzing constant', symbol: 'RK', value: 25812.80745, unit: 'Ω', category: 'EM' },
  {
    name: 'Fine-structure constant',
    symbol: 'α',
    value: 7.29735257e-3,
    unit: '',
    category: 'Atomic',
  },
  {
    name: 'Classical electron radius',
    symbol: 're',
    value: 2.81794033e-15,
    unit: 'm',
    category: 'Atomic',
  },
  {
    name: 'Compton wavelength',
    symbol: 'λc',
    value: 2.42631024e-12,
    unit: 'm',
    category: 'Atomic',
  },
  {
    name: 'Proton gyromagnetic',
    symbol: 'γp',
    value: 2.67522188e8,
    unit: 'rad/(s·T)',
    category: 'Atomic',
  },
  { name: 'Proton Compton wl', symbol: 'λcp', value: 1.32141e-15, unit: 'm', category: 'Atomic' },
  {
    name: 'Neutron Compton wl',
    symbol: 'λcn',
    value: 1.31959091e-15,
    unit: 'm',
    category: 'Atomic',
  },
  { name: 'Rydberg constant', symbol: 'R∞', value: 1.09737316e7, unit: '1/m', category: 'Atomic' },
  {
    name: 'Proton magnetic moment',
    symbol: 'μp',
    value: 1.41060674e-26,
    unit: 'J/T',
    category: 'Atomic',
  },
  {
    name: 'Electron magnetic moment',
    symbol: 'μe',
    value: -9.28476378e-24,
    unit: 'J/T',
    category: 'Atomic',
  },
  {
    name: 'Neutron magnetic moment',
    symbol: 'μn',
    value: -9.6623651e-27,
    unit: 'J/T',
    category: 'Atomic',
  },
  {
    name: 'Muon magnetic moment',
    symbol: 'μμ',
    value: -4.49044831e-26,
    unit: 'J/T',
    category: 'Atomic',
  },
  { name: 'Tau mass', symbol: 'mτ', value: 3.16754e-27, unit: 'kg', category: 'Atomic' },
  {
    name: 'Atomic mass unit',
    symbol: 'u',
    value: 1.66053907e-27,
    unit: 'kg',
    category: 'PhysChem',
  },
  {
    name: 'Faraday constant',
    symbol: 'F',
    value: 96485.33212,
    unit: 'C/mol',
    category: 'PhysChem',
  },
  {
    name: 'Avogadro constant',
    symbol: 'NA',
    value: 6.02214076e23,
    unit: '1/mol',
    category: 'PhysChem',
  },
  {
    name: 'Boltzmann constant',
    symbol: 'k',
    value: 1.38064852e-23,
    unit: 'J/K',
    category: 'PhysChem',
  },
  {
    name: 'Molar gas volume',
    symbol: 'Vm',
    value: 0.02271095,
    unit: 'm³/mol',
    category: 'PhysChem',
  },
  { name: 'Gas constant', symbol: 'R', value: 8.31446262, unit: 'J/(mol·K)', category: 'PhysChem' },
  {
    name: 'First radiation constant',
    symbol: 'c₁',
    value: 3.7417722e-16,
    unit: 'W·m²',
    category: 'PhysChem',
  },
  {
    name: 'Second radiation constant',
    symbol: 'c₂',
    value: 1.4387777e-2,
    unit: 'm·K',
    category: 'PhysChem',
  },
  {
    name: 'Stefan-Boltzmann constant',
    symbol: 'σ',
    value: 5.67037442e-8,
    unit: 'W/(m²·K⁴)',
    category: 'PhysChem',
  },
  { name: 'Standard gravity', symbol: 'g', value: 9.80665, unit: 'm/s²', category: 'Adopted' },
  { name: 'Standard atmosphere', symbol: 'atm', value: 101325, unit: 'Pa', category: 'Adopted' },
  {
    name: 'von Klitzing (conv.)',
    symbol: 'RK-90',
    value: 25812.807,
    unit: 'Ω',
    category: 'Adopted',
  },
  {
    name: 'Josephson (conv.)',
    symbol: 'KJ-90',
    value: 4.8359787e14,
    unit: 'Hz/V',
    category: 'Adopted',
  },
  { name: 'Celsius temperature', symbol: 't', value: 273.15, unit: 'K', category: 'Other' },
]

// ── 40+ Unit Conversions ──
export const UNIT_CONVERSIONS: { from: string; to: string; factor: number; category: string }[] = [
  { from: 'in', to: 'cm', factor: 2.54, category: 'Length' },
  { from: 'cm', to: 'in', factor: 1 / 2.54, category: 'Length' },
  { from: 'ft', to: 'm', factor: 0.3048, category: 'Length' },
  { from: 'm', to: 'ft', factor: 1 / 0.3048, category: 'Length' },
  { from: 'yd', to: 'm', factor: 0.9144, category: 'Length' },
  { from: 'm', to: 'yd', factor: 1 / 0.9144, category: 'Length' },
  { from: 'mile', to: 'km', factor: 1.609344, category: 'Length' },
  { from: 'km', to: 'mile', factor: 1 / 1.609344, category: 'Length' },
  { from: 'n mile', to: 'm', factor: 1852, category: 'Length' },
  { from: 'm', to: 'n mile', factor: 1 / 1852, category: 'Length' },
  { from: 'pc', to: 'km', factor: 3.08567758e13, category: 'Length' },
  { from: 'km', to: 'pc', factor: 1 / 3.08567758e13, category: 'Length' },
  { from: 'acre', to: 'm²', factor: 4046.8564224, category: 'Area' },
  { from: 'm²', to: 'acre', factor: 1 / 4046.8564224, category: 'Area' },
  { from: 'gal(US)', to: 'L', factor: 3.785411784, category: 'Volume' },
  { from: 'L', to: 'gal(US)', factor: 1 / 3.785411784, category: 'Volume' },
  { from: 'gal(UK)', to: 'L', factor: 4.54609, category: 'Volume' },
  { from: 'L', to: 'gal(UK)', factor: 1 / 4.54609, category: 'Volume' },
  { from: 'oz', to: 'g', factor: 28.349523125, category: 'Mass' },
  { from: 'g', to: 'oz', factor: 1 / 28.349523125, category: 'Mass' },
  { from: 'lb', to: 'kg', factor: 0.45359237, category: 'Mass' },
  { from: 'kg', to: 'lb', factor: 1 / 0.45359237, category: 'Mass' },
  { from: 'km/h', to: 'm/s', factor: 1 / 3.6, category: 'Velocity' },
  { from: 'm/s', to: 'km/h', factor: 3.6, category: 'Velocity' },
  { from: 'atm', to: 'Pa', factor: 101325, category: 'Pressure' },
  { from: 'Pa', to: 'atm', factor: 1 / 101325, category: 'Pressure' },
  { from: 'mmHg', to: 'Pa', factor: 133.322387415, category: 'Pressure' },
  { from: 'Pa', to: 'mmHg', factor: 1 / 133.322387415, category: 'Pressure' },
  { from: 'kgf/cm²', to: 'Pa', factor: 98066.5, category: 'Pressure' },
  { from: 'Pa', to: 'kgf/cm²', factor: 1 / 98066.5, category: 'Pressure' },
  { from: 'lbf/in²', to: 'kPa', factor: 6.89475729, category: 'Pressure' },
  { from: 'kPa', to: 'lbf/in²', factor: 1 / 6.89475729, category: 'Pressure' },
  { from: 'kgf·m', to: 'J', factor: 9.80665, category: 'Energy' },
  { from: 'J', to: 'kgf·m', factor: 1 / 9.80665, category: 'Energy' },
  { from: 'J', to: 'cal', factor: 1 / 4.1868, category: 'Energy' },
  { from: 'cal', to: 'J', factor: 4.1868, category: 'Energy' },
  { from: 'hp', to: 'kW', factor: 0.7457, category: 'Power' },
  { from: 'kW', to: 'hp', factor: 1 / 0.7457, category: 'Power' },
]

export function convertUnit(value: number, from: string, to: string): number | null {
  // Temperature special case
  if (from === '°F' && to === '°C') return ((value - 32) * 5) / 9
  if (from === '°C' && to === '°F') return (value * 9) / 5 + 32
  const conv = UNIT_CONVERSIONS.find((c) => c.from === from && c.to === to)
  if (!conv) return null
  return value * conv.factor
}

export function resetAll(): void {
  ans = 0
  preAns = 0
  for (const k of Object.keys(vars)) delete vars[k]
}

export function resetAnswer(): void {
  ans = 0
  preAns = 0
}
