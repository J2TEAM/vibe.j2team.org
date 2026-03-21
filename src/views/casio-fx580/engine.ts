/**
 * Calculator Engine
 * Evaluates AST, handles modes, memory, advanced features
 */
import { Parser, type ASTNode } from './parser'

export type AngleMode = 'DEG' | 'RAD' | 'GRAD'

export interface CalcMemory {
  A: number
  B: number
  C: number
  D: number
  X: number
  Y: number
  M: number
  Ans: number
}

export interface ComplexNum {
  re: number
  im: number
}

// ── Engine ────────────────────────────────────────────────────────────────
export class CalcEngine {
  angleMode: AngleMode = 'DEG'
  memory: CalcMemory = { A: 0, B: 0, C: 0, D: 0, X: 0, Y: 0, M: 0, Ans: 0 }

  // ── Angle helpers ──────────────────────────────────────────────────────
  toRad(x: number): number {
    if (this.angleMode === 'RAD') return x
    if (this.angleMode === 'GRAD') return (x * Math.PI) / 200
    return (x * Math.PI) / 180
  }
  fromRad(x: number): number {
    if (this.angleMode === 'RAD') return x
    if (this.angleMode === 'GRAD') return (x * 200) / Math.PI
    return (x * 180) / Math.PI
  }

  // ── Evaluate expression string ─────────────────────────────────────────
  eval(expr: string): number {
    if (!expr.trim()) throw new Error('Empty expression')
    const parser = new Parser(this.preprocess(expr))
    const ast = parser.parse()
    return this.evalNode(ast)
  }

  preprocess(expr: string): string {
    return expr
      .replace(/×10\^/g, 'E')
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/−/g, '-')
      .replace(/²/g, '^2')
      .replace(/³/g, '^3')
      .replace(/√\(/g, 'sqrt(')
      .replace(/∛\(/g, 'cbrt(')
      .replace(/π/g, 'π')
      .replace(/ℯ/g, 'e')
  }

  private evalNode(node: ASTNode): number {
    switch (node.kind) {
      case 'num':
        return node.value
      case 'var': {
        const k = node.name.toUpperCase() as keyof CalcMemory
        if (k in this.memory) return this.memory[k]
        return 0
      }
      case 'unary': {
        const v = this.evalNode(node.arg)
        if (node.op === '-') return -v
        if (node.op === '%') return v / 100
        return v
      }
      case 'factorial': {
        const n = Math.round(this.evalNode(node.arg))
        if (n < 0 || n > 69) throw new Error('Math ERROR')
        let r = 1
        for (let i = 2; i <= n; i++) r *= i
        return r
      }
      case 'binop': {
        const l = this.evalNode(node.left)
        const r = this.evalNode(node.right)
        switch (node.op) {
          case '+':
            return l + r
          case '-':
            return l - r
          case '*':
            return l * r
          case '/':
            if (r === 0) throw new Error('Math ERROR')
            return l / r
          case '^':
            return Math.pow(l, r)
          case 'E':
            return l * Math.pow(10, r)
          default:
            throw new Error('Unknown op')
        }
      }
      case 'call':
        return this.evalFn(
          node.fn,
          node.args.map((a) => this.evalNode(a)),
        )
    }
  }

  private evalFn(fn: string, args: number[]): number {
    const a = args[0] ?? 0
    const b = args[1] ?? 0
    switch (fn) {
      // trig
      case 'sin':
        return Math.sin(this.toRad(a))
      case 'cos':
        return Math.cos(this.toRad(a))
      case 'tan':
        return Math.tan(this.toRad(a))
      case 'sin⁻¹':
      case 'asin':
        return this.fromRad(Math.asin(a))
      case 'cos⁻¹':
      case 'acos':
        return this.fromRad(Math.acos(a))
      case 'tan⁻¹':
      case 'atan':
        return this.fromRad(Math.atan(a))
      // hyperbolic
      case 'sinh':
        return Math.sinh(a)
      case 'cosh':
        return Math.cosh(a)
      case 'tanh':
        return Math.tanh(a)
      case 'sinh⁻¹':
      case 'asinh':
        return Math.asinh(a)
      case 'cosh⁻¹':
      case 'acosh':
        return Math.acosh(a)
      case 'tanh⁻¹':
      case 'atanh':
        return Math.atanh(a)
      // log
      case 'log':
        return b !== 0 ? Math.log(b) / Math.log(a) : Math.log10(a)
      case 'log10':
        return Math.log10(a)
      case 'ln':
        return Math.log(a)
      // root
      case 'sqrt':
      case '√':
        return Math.sqrt(a)
      case 'cbrt':
      case '∛':
        return Math.cbrt(a)
      case 'nthroot':
        return Math.pow(b, 1 / a)
      // misc
      case 'abs':
      case 'Abs':
        return Math.abs(a)
      case 'int':
        return Math.trunc(a)
      case 'frac':
        return a - Math.trunc(a)
      case 'round':
        return Math.round(a)
      case 'floor':
        return Math.floor(a)
      case 'ceil':
        return Math.ceil(a)
      case 'sign':
        return Math.sign(a)
      case 'exp':
        return Math.exp(a)
      // combinations
      case 'npr': {
        const n = Math.round(a),
          r = Math.round(b)
        return this.perm(n, r)
      }
      case 'ncr': {
        const n = Math.round(a),
          r = Math.round(b)
        return this.comb(n, r)
      }
      case 'gcd':
        return this.gcd(Math.round(a), Math.round(b))
      case 'lcm':
        return Math.abs(a * b) / this.gcd(Math.round(a), Math.round(b))
      case 'mod':
        return a % b
      case 'random':
        return Math.random()
      case 'ranint':
        return Math.floor(a + Math.random() * (b - a + 1))
      case 'max':
        return Math.max(...args)
      case 'min':
        return Math.min(...args)
      case 'sum':
        return args.reduce((s, x) => s + x, 0)
      default:
        throw new Error(`Unknown function: ${fn}`)
    }
  }

  private perm(n: number, r: number): number {
    if (r > n || r < 0) throw new Error('Math ERROR')
    let result = 1
    for (let i = 0; i < r; i++) result *= n - i
    return result
  }
  private comb(n: number, r: number): number {
    if (r > n || r < 0) throw new Error('Math ERROR')
    r = Math.min(r, n - r)
    let num = 1,
      den = 1
    for (let i = 0; i < r; i++) {
      num *= n - i
      den *= i + 1
    }
    return num / den
  }
  private gcd(a: number, b: number): number {
    a = Math.abs(a)
    b = Math.abs(b)
    while (b) {
      const t = b
      b = a % b
      a = t
    }
    return a
  }

  // ── Derivative (numerical) ─────────────────────────────────────────────
  derivative(expr: string, x: number, h = 1e-8): number {
    const f = (v: number) => {
      this.memory.X = v
      return this.eval(expr)
    }
    return (f(x + h) - f(x - h)) / (2 * h)
  }

  // ── Definite integral (Simpson's rule) ────────────────────────────────
  integrate(expr: string, a: number, b: number, n = 1000): number {
    if (n % 2 !== 0) n++
    const h = (b - a) / n
    const f = (x: number) => {
      this.memory.X = x
      return this.eval(expr)
    }
    let s = f(a) + f(b)
    for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 === 0 ? 2 : 4)
    return (s * h) / 3
  }

  // ── Solve quadratic ax²+bx+c=0 ────────────────────────────────────────
  solveQuadratic(a: number, b: number, c: number): ComplexNum[] {
    const disc = b * b - 4 * a * c
    if (disc >= 0) {
      return [
        { re: (-b + Math.sqrt(disc)) / (2 * a), im: 0 },
        { re: (-b - Math.sqrt(disc)) / (2 * a), im: 0 },
      ]
    }
    return [
      { re: -b / (2 * a), im: Math.sqrt(-disc) / (2 * a) },
      { re: -b / (2 * a), im: -Math.sqrt(-disc) / (2 * a) },
    ]
  }

  // ── Solve cubic ax³+bx²+cx+d=0 (Cardano) ─────────────────────────────
  solveCubic(a: number, b: number, c: number, d: number): number[] {
    // Normalize
    b /= a
    c /= a
    d /= a
    const p = c - (b * b) / 3
    const q = (2 * b * b * b) / 27 - (b * c) / 3 + d
    const D = (q * q) / 4 + (p * p * p) / 27
    if (D > 0) {
      const u = Math.cbrt(-q / 2 + Math.sqrt(D))
      const v = Math.cbrt(-q / 2 - Math.sqrt(D))
      return [u + v - b / 3]
    } else if (D === 0) {
      const u = Math.cbrt(-q / 2)
      return [2 * u - b / 3, -u - b / 3]
    } else {
      const r = Math.sqrt((-p * p * p) / 27)
      const theta = Math.acos(-q / (2 * r))
      const m = 2 * Math.cbrt(r)
      return [
        m * Math.cos(theta / 3) - b / 3,
        m * Math.cos((theta + 2 * Math.PI) / 3) - b / 3,
        m * Math.cos((theta + 4 * Math.PI) / 3) - b / 3,
      ]
    }
  }

  // ── Solve 2×2 linear system ──────────────────────────────────────────
  solve2x2(
    a1: number,
    b1: number,
    c1: number,
    a2: number,
    b2: number,
    c2: number,
  ): [number, number] {
    const det = a1 * b2 - a2 * b1
    if (Math.abs(det) < 1e-12) throw new Error('No unique solution')
    return [(c1 * b2 - c2 * b1) / det, (a1 * c2 - a2 * c1) / det]
  }

  // ── Solve 3×3 linear system ──────────────────────────────────────────
  solve3x3(
    a1: number,
    b1: number,
    c1: number,
    d1: number,
    a2: number,
    b2: number,
    c2: number,
    d2: number,
    a3: number,
    b3: number,
    c3: number,
    d3: number,
  ): [number, number, number] {
    const det = a1 * (b2 * c3 - b3 * c2) - b1 * (a2 * c3 - a3 * c2) + c1 * (a2 * b3 - a3 * b2)
    if (Math.abs(det) < 1e-12) throw new Error('No unique solution')
    const x = (d1 * (b2 * c3 - b3 * c2) - b1 * (d2 * c3 - d3 * c2) + c1 * (d2 * b3 - d3 * b2)) / det
    const y = (a1 * (d2 * c3 - d3 * c2) - d1 * (a2 * c3 - a3 * c2) + c1 * (a2 * d3 - a3 * d2)) / det
    const z = (a1 * (b2 * d3 - b3 * d2) - b1 * (a2 * d3 - a3 * d2) + d1 * (a2 * b3 - a3 * b2)) / det
    return [x, y, z]
  }

  // ── Matrix ops (2×2) ────────────────────────────────────────────────
  matDet2(m: number[][]): number {
    return (m[0]![0] ?? 0) * (m[1]![1] ?? 0) - (m[0]![1] ?? 0) * (m[1]![0] ?? 0)
  }
  matInv2(m: number[][]): number[][] {
    const det = this.matDet2(m)
    if (Math.abs(det) < 1e-12) throw new Error('Singular matrix')
    return [
      [(m[1]![1] ?? 0) / det, -(m[0]![1] ?? 0) / det],
      [-(m[1]![0] ?? 0) / det, (m[0]![0] ?? 0) / det],
    ]
  }
  matMul(a: number[][], b: number[][]): number[][] {
    const rows = a.length,
      cols = b[0]!.length,
      inner = b.length
    return Array.from({ length: rows }, (_, i) =>
      Array.from({ length: cols }, (_, j) =>
        Array.from({ length: inner }, (_, k) => (a[i]![k] ?? 0) * (b[k]![j] ?? 0)).reduce(
          (s, v) => s + v,
          0,
        ),
      ),
    )
  }

  // ── Complex arithmetic ───────────────────────────────────────────────
  complexAdd(a: ComplexNum, b: ComplexNum): ComplexNum {
    return { re: a.re + b.re, im: a.im + b.im }
  }
  complexMul(a: ComplexNum, b: ComplexNum): ComplexNum {
    return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re }
  }
  complexAbs(a: ComplexNum): number {
    return Math.sqrt(a.re * a.re + a.im * a.im)
  }
  complexArg(a: ComplexNum): number {
    return this.fromRad(Math.atan2(a.im, a.re))
  }

  // ── Table generation ────────────────────────────────────────────────
  generateTable(
    expr: string,
    start: number,
    end: number,
    step: number,
  ): { x: number; y: number }[] {
    const rows: { x: number; y: number }[] = []
    for (let x = start; x <= end + step * 0.001; x += step) {
      this.memory.X = x
      try {
        rows.push({ x, y: this.eval(expr) })
      } catch {
        rows.push({ x, y: NaN })
      }
    }
    return rows
  }

  // ── Format output ───────────────────────────────────────────────────
  format(val: number, fracMode = false): string {
    if (isNaN(val)) return 'Math ERROR'
    if (!isFinite(val)) return val > 0 ? '+∞' : '-∞'
    if (fracMode) {
      const frac = this.toFraction(val)
      if (frac) return frac
    }
    if (Number.isInteger(val) && Math.abs(val) < 1e12) return val.toString()
    if (Math.abs(val) >= 1e10 || (Math.abs(val) < 1e-9 && val !== 0)) {
      return val
        .toExponential(9)
        .replace(/\.?0+(e)/, '$1')
        .replace('e+', '×10^')
        .replace('e-', '×10^-')
    }
    return parseFloat(val.toPrecision(10)).toString()
  }

  toFraction(x: number): string | null {
    const MAX_DENOM = 1000
    for (let d = 1; d <= MAX_DENOM; d++) {
      const n = Math.round(x * d)
      if (Math.abs(n / d - x) < 1e-9 && d > 1) {
        const g = this.gcd(Math.abs(n), d)
        return `${n / g}/${d / g}`
      }
    }
    return null
  }
}
