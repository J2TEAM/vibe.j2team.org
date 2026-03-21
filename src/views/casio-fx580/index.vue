<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import { CalcEngine } from './engine'

const eng = new CalcEngine()

// ── State ─────────────────────────────────────────────────────────────────
const isShift = ref(false)
const isAlpha = ref(false)
const isHyp = ref(false)
const inputLine = ref('')
const outputLine = ref('')
const hasResult = ref(false)
const errorMsg = ref('')
const history = ref<{ expr: string; result: string }[]>([])
const histIdx = ref(-1) // -1 = not browsing history
const cursorPos = ref(0) // tracks insert position in inputLine
const activeKey = ref('') // briefly lit key for physical-keyboard feedback

// Menu / Wizard overlay
type Screen = 'COMP' | 'MENU' | 'WIZ'
type WizType = 'EQN2' | 'EQN3' | 'SYS2' | 'SYS3' | 'DERIV' | 'INTEG' | 'CPLX'
const screen = ref<Screen>('COMP')
const menuIdx = ref(0)
const wizType = ref<WizType>('EQN2')
const wizStep = ref(0) // 0 = title, 1..n = input fields
const wizInputs = ref<string[]>([])
const wizResult = ref('')

const menuItems: { label: string; sub: string; type: WizType }[] = [
  { label: 'PT bậc 2', sub: 'ax²+bx+c=0', type: 'EQN2' },
  { label: 'PT bậc 3', sub: 'ax³+bx²+cx+d=0', type: 'EQN3' },
  { label: 'Hệ 2 ẩn', sub: 'a₁x+b₁y=c₁', type: 'SYS2' },
  { label: 'Hệ 3 ẩn', sub: 'a₁x+b₁y+c₁z=d₁', type: 'SYS3' },
  { label: 'Đạo hàm', sub: "f'(a) tại X=a", type: 'DERIV' },
  { label: 'Tích phân', sub: '∫f(X)dx từ a→b', type: 'INTEG' },
  { label: 'Số phức', sub: 'A±Bi op C±Di', type: 'CPLX' },
]

const wizDefs: Record<WizType, { title: string; prompts: string[] }> = {
  EQN2: { title: 'ax²+bx+c=0', prompts: ['a=', 'b=', 'c='] },
  EQN3: { title: 'ax³+bx²+cx+d=0', prompts: ['a=', 'b=', 'c=', 'd='] },
  SYS2: {
    title: 'a₁x+b₁y=c₁ / a₂x+b₂y=c₂',
    prompts: ['a₁=', 'b₁=', 'c₁=', 'a₂=', 'b₂=', 'c₂='],
  },
  SYS3: {
    title: 'a₁x+b₁y+c₁z=d₁ / …',
    prompts: ['a₁=', 'b₁=', 'c₁=', 'd₁=', 'a₂=', 'b₂=', 'c₂=', 'd₂=', 'a₃=', 'b₃=', 'c₃=', 'd₃='],
  },
  DERIV: { title: 'd/dx f(X) tại X=a\n(dùng X làm biến)', prompts: ['f(X)=', 'a='] },
  INTEG: { title: '∫f(X)dx từ a đến b\n(dùng X làm biến)', prompts: ['f(X)=', 'a=', 'b='] },
  CPLX: {
    title: 'Số phức A+Bi op C+Di',
    prompts: ['A(re)=', 'A(im)=', 'C(re)=', 'C(im)=', 'op(+,-,×,|A|,arg)='],
  },
}

// ── Audio ──────────────────────────────────────────────────────────────────
let audioCtx: AudioContext | null = null
function beep() {
  try {
    if (!audioCtx) audioCtx = new AudioContext()
    const o = audioCtx.createOscillator()
    const g = audioCtx.createGain()
    o.connect(g)
    g.connect(audioCtx.destination)
    o.frequency.value = 880
    g.gain.value = 0.04
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.03)
    o.start()
    o.stop(audioCtx.currentTime + 0.03)
  } catch {
    /* ignore */
  }
}

// ── LCD computed lines ─────────────────────────────────────────────────────
const lcdTop = computed((): string => {
  if (screen.value === 'MENU')
    return `[${menuIdx.value + 1}/${menuItems.length}] ${menuItems[menuIdx.value]?.label ?? ''}`
  if (screen.value === 'WIZ') {
    if (wizResult.value) return wizResult.value
    const def = wizDefs[wizType.value]
    if (wizStep.value === 0) return def.title
    return (def.prompts[wizStep.value - 1] ?? '') + ' ' + (inputLine.value || '_')
  }
  if (errorMsg.value) return errorMsg.value
  if (hasResult.value && !inputLine.value) return 'Ans'
  return inputLine.value
})

const lcdBot = computed((): string => {
  if (screen.value === 'MENU') return menuItems[menuIdx.value]?.sub ?? ''
  if (screen.value === 'WIZ') {
    if (wizResult.value) return 'AC để thoát'
    if (wizStep.value === 0) return '= để nhập'
    const total = wizDefs[wizType.value].prompts.length
    return `Bước ${wizStep.value}/${total}`
  }
  if (errorMsg.value) return ''
  return outputLine.value
})

// ── Wizard compute ─────────────────────────────────────────────────────────
function runWizard() {
  try {
    switch (wizType.value) {
      case 'EQN2': {
        const [a, b, c] = wizInputs.value.map((s) => parseFloat(s || '0')) as [
          number,
          number,
          number,
        ]
        const roots = eng.solveQuadratic(a, b, c)
        wizResult.value = roots
          .map((r, i) =>
            r.im === 0
              ? `x${i + 1}=${eng.format(r.re)}`
              : `x${i + 1}=${eng.format(r.re)}${r.im >= 0 ? '+' : ''}${eng.format(r.im)}i`,
          )
          .join('  ')
        break
      }
      case 'EQN3': {
        const [a, b, c, d] = wizInputs.value.map((s) => parseFloat(s || '0')) as [
          number,
          number,
          number,
          number,
        ]
        wizResult.value = eng
          .solveCubic(a, b, c, d)
          .map((r, i) => `x${i + 1}=${eng.format(r)}`)
          .join('  ')
        break
      }
      case 'SYS2': {
        const [a1, b1, c1, a2, b2, c2] = wizInputs.value.map((s) => parseFloat(s || '0')) as [
          number,
          number,
          number,
          number,
          number,
          number,
        ]
        const [x, y] = eng.solve2x2(a1, b1, c1, a2, b2, c2)
        wizResult.value = `x=${eng.format(x)}  y=${eng.format(y)}`
        break
      }
      case 'SYS3': {
        const n = wizInputs.value.map((s) => parseFloat(s || '0'))
        const [x, y, z] = eng.solve3x3(
          n[0]!,
          n[1]!,
          n[2]!,
          n[3]!,
          n[4]!,
          n[5]!,
          n[6]!,
          n[7]!,
          n[8]!,
          n[9]!,
          n[10]!,
          n[11]!,
        )
        wizResult.value = `x=${eng.format(x)}  y=${eng.format(y)}  z=${eng.format(z)}`
        break
      }
      case 'DERIV': {
        const expr = wizInputs.value[0] ?? 'X'
        const a = parseFloat(wizInputs.value[1] || '0')
        wizResult.value = `f'(${a})=${eng.format(eng.derivative(expr, a))}`
        break
      }
      case 'INTEG': {
        const expr = wizInputs.value[0] ?? 'X'
        const a = parseFloat(wizInputs.value[1] || '0')
        const b = parseFloat(wizInputs.value[2] || '1')
        wizResult.value = `∫=${eng.format(eng.integrate(expr, a, b))}`
        break
      }
      case 'CPLX': {
        const re1 = parseFloat(wizInputs.value[0] || '0')
        const im1 = parseFloat(wizInputs.value[1] || '0')
        const re2 = parseFloat(wizInputs.value[2] || '0')
        const im2 = parseFloat(wizInputs.value[3] || '0')
        const op = (wizInputs.value[4] ?? '+').trim()
        const A = { re: re1, im: im1 }
        const B = { re: re2, im: im2 }
        if (op === '|A|') {
          wizResult.value = `|A|=${eng.format(eng.complexAbs(A))}`
          break
        }
        if (op === 'arg') {
          wizResult.value = `arg(A)=${eng.format(eng.complexArg(A))}`
          break
        }
        const r =
          op === '×'
            ? eng.complexMul(A, B)
            : op === '-'
              ? eng.complexAdd(A, { re: -B.re, im: -B.im })
              : eng.complexAdd(A, B)
        wizResult.value = `${eng.format(r.re)}${r.im >= 0 ? '+' : ''}${eng.format(r.im)}i`
        break
      }
    }
  } catch (e: unknown) {
    wizResult.value = e instanceof Error ? e.message : 'Math ERROR'
  }
}

// ── Insert at cursor position ──────────────────────────────────────────────
function ins(t: string) {
  const s = inputLine.value
  const p = cursorPos.value
  inputLine.value = s.slice(0, p) + t + s.slice(p)
  cursorPos.value = p + t.length
}

// ── Key press ─────────────────────────────────────────────────────────────
function press(key: string) {
  beep()
  errorMsg.value = ''

  // ── MENU screen ──
  if (screen.value === 'MENU') {
    if (key === 'AC' || key === 'ON' || key === 'MENU') {
      screen.value = 'COMP'
      return
    }
    if (key === 'NAV_UP') {
      menuIdx.value = (menuIdx.value - 1 + menuItems.length) % menuItems.length
      return
    }
    if (key === 'NAV_DOWN') {
      menuIdx.value = (menuIdx.value + 1) % menuItems.length
      return
    }
    if (key === '=') {
      wizType.value = menuItems[menuIdx.value]!.type
      wizStep.value = 0
      wizInputs.value = []
      wizResult.value = ''
      inputLine.value = ''
      cursorPos.value = 0
      screen.value = 'WIZ'
      return
    }
    // number shortcuts
    const n = parseInt(key)
    if (!isNaN(n) && n >= 1 && n <= menuItems.length) {
      menuIdx.value = n - 1
      wizType.value = menuItems[n - 1]!.type
      wizStep.value = 0
      wizInputs.value = []
      wizResult.value = ''
      inputLine.value = ''
      cursorPos.value = 0
      screen.value = 'WIZ'
      return
    }
    return
  }

  // ── WIZARD screen ──
  if (screen.value === 'WIZ') {
    if (key === 'AC' || key === 'ON') {
      screen.value = 'COMP'
      wizResult.value = ''
      inputLine.value = ''
      cursorPos.value = 0
      return
    }
    if (wizResult.value) {
      screen.value = 'COMP'
      wizResult.value = ''
      inputLine.value = ''
      cursorPos.value = 0
      return
    }
    if (key === '=') {
      if (wizStep.value === 0) {
        wizStep.value = 1
        inputLine.value = ''
        cursorPos.value = 0
        return
      }
      wizInputs.value[wizStep.value - 1] = inputLine.value
      inputLine.value = ''
      cursorPos.value = 0
      const total = wizDefs[wizType.value].prompts.length
      if (wizStep.value < total) {
        wizStep.value++
        return
      }
      runWizard()
      return
    }
    if (key === 'DEL') {
      if (cursorPos.value > 0) {
        inputLine.value =
          inputLine.value.slice(0, cursorPos.value - 1) + inputLine.value.slice(cursorPos.value)
        cursorPos.value--
      }
      return
    }
    if (key === '(-)') {
      ins('-')
      return
    }
    // DERIV/INTEG f(X) field and CPLX op field accept text/expressions
    const isTextStep =
      (wizType.value === 'DERIV' && wizStep.value === 1) ||
      (wizType.value === 'INTEG' && wizStep.value === 1) ||
      (wizType.value === 'CPLX' && wizStep.value === 5)
    if (isTextStep) {
      const textMap: Record<string, string> = {
        '×': '*',
        '÷': '/',
        '−': '-',
        π: 'π',
        ℯ: 'e',
      }
      const fnMap: Record<string, string> = {
        sin: 'sin(',
        cos: 'cos(',
        tan: 'tan(',
        log: 'log(',
        ln: 'ln(',
        'x²': '^2',
        'x³': '^3',
        '√(': 'sqrt(',
      }
      if (fnMap[key]) {
        ins(fnMap[key]!)
        return
      }
      if (key.length === 1 || textMap[key]) {
        ins(textMap[key] ?? key)
        return
      }
    } else {
      if (/^[\d.]$/.test(key) || key === '-') {
        ins(key)
        return
      }
    }
    if (key === 'NAV_LEFT') {
      wizStep.value = Math.max(0, wizStep.value - 1)
      inputLine.value = wizInputs.value[wizStep.value - 1] ?? ''
      cursorPos.value = inputLine.value.length
      return
    }
    return
  }

  // ── COMP screen ──
  const shift = isShift.value
  const alpha = isAlpha.value
  const hyp = isHyp.value

  if (key !== 'SHIFT') isShift.value = false
  if (key !== 'ALPHA') isAlpha.value = false
  if (key !== 'HYP') isHyp.value = false

  if (key === 'SHIFT') {
    isShift.value = !shift
    isAlpha.value = false
    isHyp.value = false
    return
  }
  if (key === 'ALPHA') {
    isAlpha.value = !alpha
    isShift.value = false
    isHyp.value = false
    return
  }
  if (key === 'HYP') {
    isHyp.value = !hyp
    isShift.value = false
    isAlpha.value = false
    return
  }
  if (key === 'MENU') {
    screen.value = 'MENU'
    menuIdx.value = 0
    return
  }

  if (key === 'ON') {
    if (shift) {
      // SHIFT+ON = cycle angle mode (DRG)
      const m = ['DEG', 'RAD', 'GRAD'] as const
      eng.angleMode = m[(m.indexOf(eng.angleMode) + 1) % 3]!
      return
    }
    inputLine.value = ''
    outputLine.value = ''
    hasResult.value = false
    histIdx.value = -1
    cursorPos.value = 0
    return
  }
  if (key === 'AC') {
    inputLine.value = ''
    outputLine.value = ''
    hasResult.value = false
    histIdx.value = -1
    cursorPos.value = 0
    return
  }
  if (key === 'DEL') {
    if (hasResult.value) {
      inputLine.value = ''
      hasResult.value = false
      cursorPos.value = 0
      return
    }
    if (cursorPos.value === 0) return
    // Delete multi-char tokens ending at cursor
    const multi = [
      'sin⁻¹(',
      'cos⁻¹(',
      'tan⁻¹(',
      'sinh⁻¹(',
      'cosh⁻¹(',
      'tanh⁻¹(',
      'sinh(',
      'cosh(',
      'tanh(',
      'sin(',
      'cos(',
      'tan(',
      'log(',
      'ln(',
      '√(',
      '∛(',
      'nCr(',
      'nPr(',
      'Abs(',
      '×10^',
      '10^(',
      'ℯ^(',
    ]
    const before = inputLine.value.slice(0, cursorPos.value)
    for (const t of multi) {
      if (before.endsWith(t)) {
        inputLine.value = before.slice(0, -t.length) + inputLine.value.slice(cursorPos.value)
        cursorPos.value -= t.length
        return
      }
    }
    inputLine.value = before.slice(0, -1) + inputLine.value.slice(cursorPos.value)
    cursorPos.value--
    return
  }

  // Navigation in COMP = history / cursor
  if (key === 'NAV_UP') {
    if (history.value.length === 0) return
    histIdx.value = Math.min(histIdx.value + 1, history.value.length - 1)
    const h = history.value[histIdx.value]
    if (h) {
      inputLine.value = h.expr
      outputLine.value = h.result
      hasResult.value = true
      cursorPos.value = h.expr.length
    }
    return
  }
  if (key === 'NAV_DOWN') {
    histIdx.value = Math.max(histIdx.value - 1, -1)
    if (histIdx.value === -1) {
      inputLine.value = ''
      outputLine.value = ''
      hasResult.value = false
      cursorPos.value = 0
    } else {
      const h = history.value[histIdx.value]
      if (h) {
        inputLine.value = h.expr
        outputLine.value = h.result
        hasResult.value = true
        cursorPos.value = h.expr.length
      }
    }
    return
  }
  if (key === 'NAV_LEFT') {
    cursorPos.value = Math.max(0, cursorPos.value - 1)
    return
  }
  if (key === 'NAV_RIGHT') {
    cursorPos.value = Math.min(inputLine.value.length, cursorPos.value + 1)
    return
  }
  if (key === 'NAV_OK') {
    press('=')
    return
  }

  if (key === 'DRG') {
    const m = ['DEG', 'RAD', 'GRAD'] as const
    eng.angleMode = m[(m.indexOf(eng.angleMode) + 1) % 3]!
    return
  }

  // Memory
  if (key === 'STO') {
    eng.memory.M = eng.memory.Ans
    outputLine.value = 'M←' + eng.format(eng.memory.Ans)
    return
  }
  if (key === 'RCL') {
    ins('M')
    return
  }
  if (key === 'M+') {
    eng.memory.M += eng.memory.Ans
    outputLine.value = 'M=' + eng.format(eng.memory.M)
    return
  }
  if (key === 'M-') {
    eng.memory.M -= eng.memory.Ans
    outputLine.value = 'M=' + eng.format(eng.memory.M)
    return
  }

  // S⇔D must come BEFORE 'Continue from Ans' so hasResult is still true
  if (key === 'S⇔D') {
    if (hasResult.value && outputLine.value) {
      try {
        const v = eng.eval(inputLine.value)
        const frac = eng.toFraction(v)
        outputLine.value = outputLine.value === frac ? eng.format(v) : (frac ?? eng.format(v))
      } catch {
        /* ignore */
      }
    }
    return
  }

  // Continue from Ans
  if (hasResult.value) {
    if ('+-×÷^'.includes(key) || key === '×10^') {
      inputLine.value = 'Ans'
      cursorPos.value = 3
      hasResult.value = false
    } else {
      inputLine.value = ''
      cursorPos.value = 0
      hasResult.value = false
    }
    histIdx.value = -1
  }

  if (key === '=') {
    if (!inputLine.value.trim()) return
    try {
      const result = eng.eval(inputLine.value)
      eng.memory.Ans = result
      const fmt = eng.format(result)
      outputLine.value = fmt
      history.value.unshift({ expr: inputLine.value, result: fmt })
      if (history.value.length > 30) history.value.pop()
      hasResult.value = true
      histIdx.value = -1
    } catch (e: unknown) {
      errorMsg.value = e instanceof Error ? e.message : 'Math ERROR'
    }
    return
  }

  // ── Trig with hyp / shift ──
  if (key === 'sin') {
    if (hyp && shift) ins('sinh⁻¹(')
    else if (hyp) ins('sinh(')
    else if (shift) ins('sin⁻¹(')
    else ins('sin(')
    return
  }
  if (key === 'cos') {
    if (hyp && shift) ins('cosh⁻¹(')
    else if (hyp) ins('cosh(')
    else if (shift) ins('cos⁻¹(')
    else ins('cos(')
    return
  }
  if (key === 'tan') {
    if (hyp && shift) ins('tanh⁻¹(')
    else if (hyp) ins('tanh(')
    else if (shift) ins('tan⁻¹(')
    else ins('tan(')
    return
  }

  // ── Shift variants ──
  if (key === 'log') {
    ins(shift ? '10^(' : 'log(')
    return
  }
  if (key === 'ln') {
    ins(shift ? 'ℯ^(' : 'ln(')
    return
  }
  if (key === 'x²') {
    ins(shift ? '√(' : '^2')
    return
  }
  if (key === 'x³') {
    ins(shift ? '∛(' : '^3')
    return
  }
  if (key === 'xᵐ') {
    ins(shift ? 'nthroot(' : '^')
    return
  }
  if (key === 'nCr') {
    ins(shift ? 'nPr(' : 'nCr(')
    return
  }
  if (key === 'n!') {
    ins('!')
    return
  }
  if (key === '(') {
    ins(shift ? 'Abs(' : '(')
    return
  }
  if (key === ')') {
    ins(shift ? '%' : ')')
    return
  }
  if (key === 'STO_KEY') {
    if (shift) {
      ins('M')
    } else {
      eng.memory.M = eng.memory.Ans
      outputLine.value = 'M←' + eng.format(eng.memory.Ans)
    }
    return
  }
  if (key === 'M+_KEY') {
    if (shift) {
      eng.memory.M -= eng.memory.Ans
      outputLine.value = 'M=' + eng.format(eng.memory.M)
    } else if (alpha) {
      ins('M')
    } else {
      eng.memory.M += eng.memory.Ans
      outputLine.value = 'M=' + eng.format(eng.memory.M)
    }
    return
  }

  // (−) key: normal → insert '-', SHIFT → insert '!' (factorial)
  if (key === '(-)') {
    ins(shift ? '!' : '-')
    return
  }

  // Direct insert map
  const directMap: Record<string, string> = {
    π: 'π',
    ℯ: 'ℯ',
    Ans: 'Ans',
    '×': '×',
    '÷': '÷',
    '−': '-',
    '×10^': '×10^',
    '%': '%',
    Abs: 'Abs(',
    ',': ',',
  }

  if (directMap[key] !== undefined) {
    ins(directMap[key]!)
    return
  }

  // Single char / digit / operator passthrough
  if (key.length === 1) {
    ins(key)
  }
}

const angleLabel = computed(() => eng.angleMode)

// ── Physical keyboard ──────────────────────────────────────────────────────
let activeKeyTimer: ReturnType<typeof setTimeout> | null = null
function flashKey(k: string) {
  activeKey.value = k
  if (activeKeyTimer) clearTimeout(activeKeyTimer)
  activeKeyTimer = setTimeout(() => {
    activeKey.value = ''
  }, 120)
}

function onKey(ev: KeyboardEvent) {
  // Ignore if typing in an input somewhere
  const tag = (ev.target as HTMLElement).tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA') return

  const m: Record<string, string> = {
    '0': '0',
    '1': '1',
    '2': '2',
    '3': '3',
    '4': '4',
    '5': '5',
    '6': '6',
    '7': '7',
    '8': '8',
    '9': '9',
    '.': '.',
    '+': '+',
    '-': '(−)',
    '*': '×',
    '/': '÷',
    '(': '(',
    ')': ')',
    '^': '^',
    '%': '%',
    Enter: '=',
    Backspace: 'DEL',
    Escape: 'AC',
    ArrowUp: 'NAV_UP',
    ArrowDown: 'NAV_DOWN',
    ArrowLeft: 'NAV_LEFT',
    ArrowRight: 'NAV_RIGHT',
  }
  const k = m[ev.key]
  if (k) {
    ev.preventDefault()
    flashKey(k)
    press(k)
  }
}
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
  if (activeKeyTimer) clearTimeout(activeKeyTimer)
  audioCtx?.close()
})

// Cursor display helpers
const inputBeforeCursor = computed(() => inputLine.value.slice(0, cursorPos.value))
const inputAfterCursor = computed(() => inputLine.value.slice(cursorPos.value))

// Label helpers for shift/hyp-aware buttons
function sinLabel() {
  if (isHyp.value && isShift.value) return 'sinh⁻¹'
  if (isHyp.value) return 'sinh'
  if (isShift.value) return 'sin⁻¹'
  return 'sin'
}
function cosLabel() {
  if (isHyp.value && isShift.value) return 'cosh⁻¹'
  if (isHyp.value) return 'cosh'
  if (isShift.value) return 'cos⁻¹'
  return 'cos'
}
function tanLabel() {
  if (isHyp.value && isShift.value) return 'tanh⁻¹'
  if (isHyp.value) return 'tanh'
  if (isShift.value) return 'tan⁻¹'
  return 'tan'
}
</script>

<template>
  <div class="flex flex-col justify-center items-center bg-bg-deep p-2 w-full min-h-dvh font-body">
    <!-- Back to Home Button -->
    <RouterLink
      to="/"
      class="top-2 sm:top-4 left-2 sm:left-4 z-50 fixed flex items-center gap-2 bg-bg-surface/80 hover:bg-bg-elevated shadow-lg backdrop-blur-sm px-3 py-2 border border-border-default rounded-lg font-medium text-text-secondary hover:text-text-primary text-xs transition-colors"
    >
      <Icon icon="lucide:arrow-left" class="size-4" />
      Về trang chủ
    </RouterLink>

    <div class="flex flex-col w-full max-w-[360px] max-h-[850px] sm:max-h-[720px] calc-shell">
      <!-- Brand bar -->
      <div class="flex flex-shrink-0 justify-between items-center px-3 pt-2 pb-1.5 brand-bar">
        <RouterLink to="/" class="hover:opacity-80 transition casio-text">CASIO</RouterLink>
        <div class="text-right">
          <div class="font-display font-bold text-[#F0EDE6] text-[11px] tracking-widest">
            fx-580VN X
          </div>
          <div class="font-display text-[#8B9DB5] text-[7px] tracking-[1px]">Eintes steinla</div>
        </div>
      </div>

      <!-- LCD -->
      <div class="flex-shrink-0 mx-2.5 mt-1 mb-1 screen-outer">
        <div class="screen-lcd">
          <!-- Status row -->
          <div class="flex items-center gap-1.5 mb-0.5 min-h-[13px]">
            <span v-if="isShift" class="bg-[#FFB830] text-[#0d1520] st-badge">S</span>
            <span v-if="isAlpha" class="bg-[#FF6B4A] text-white st-badge">A</span>
            <span v-if="isHyp" class="bg-[#a8e0c8] text-[#0d1520] st-badge">HYP</span>
            <span v-if="eng.memory.M !== 0" class="bg-[#38BDF8] text-[#0d1520] st-badge">M</span>
            <span class="st-dim">{{ angleLabel }}</span>
            <span v-if="screen === 'MENU'" class="text-[#b8700a] st-dim">MENU</span>
            <span v-if="screen === 'WIZ'" class="text-[#1a7a6a] st-dim">{{ wizType }}</span>
            <span class="ml-auto st-dim">{{ hasResult && screen === 'COMP' ? 'Ans' : '' }}</span>
          </div>

          <!-- Top line: input expression -->
          <div class="screen-line-top">
            <span v-if="errorMsg" class="font-bold text-[11px] text-red-800">{{ errorMsg }}</span>
            <template v-else-if="screen === 'COMP'">
              <span class="lcd-expr">{{ inputBeforeCursor }}</span>
              <span v-if="!hasResult" class="lcd-cur" />
              <span class="lcd-expr">{{ inputAfterCursor }}</span>
            </template>
            <template v-else>
              <span class="lcd-sub" style="white-space: pre-line">{{ lcdTop }}</span>
            </template>
          </div>

          <!-- Separator -->
          <div class="lcd-sep" />

          <!-- Bottom line: result -->
          <div class="screen-line-bot">
            <span v-if="screen === 'MENU' || screen === 'WIZ'" class="lcd-sub">{{ lcdBot }}</span>
            <span v-else class="lcd-result">{{ lcdBot }}</span>
          </div>
        </div>
      </div>

      <!-- Keypad -->
      <div class="flex flex-col gap-[3px] px-2 pt-1 pb-2 min-h-0 overflow-hidden">
        <!-- ROW 0: SHIFT ALPHA [nav] MENU ON -->
        <div class="flex flex-1 items-center gap-[3px]">
          <button
            @click="press('SHIFT')"
            class="flex-1 key-mod"
            :class="isShift ? '!bg-[#FFB830] !text-[#0d1520]' : ''"
          >
            SHIFT
          </button>
          <button
            @click="press('ALPHA')"
            class="flex-1 key-mod"
            :class="isAlpha ? '!bg-[#FF6B4A] !text-white' : ''"
          >
            ALPHA
          </button>
          <!-- D-pad -->
          <div class="flex flex-col flex-shrink-0 items-center gap-[2px]">
            <button @click="press('NAV_UP')" class="nav-btn">▲</button>
            <div class="flex items-center gap-[2px]">
              <button @click="press('NAV_LEFT')" class="nav-btn">◀</button>
              <button @click="press('NAV_OK')" class="nav-center">OK</button>
              <button @click="press('NAV_RIGHT')" class="nav-btn">▶</button>
            </div>
            <button @click="press('NAV_DOWN')" class="nav-btn">▼</button>
          </div>
          <button
            @click="press('MENU')"
            class="flex-1 key-mod"
            :class="screen === 'MENU' ? '!bg-[#38BDF8] !text-[#0d1520]' : ''"
          >
            MENU
          </button>
          <div class="relative flex flex-col flex-1" style="min-width: 0">
            <!-- <div class="top-0 left-0.5 absolute sl-y">DRG</div> -->
            <button @click="press('ON')" class="flex-1 !bg-[#1a3a1a] !text-[#90ee90] key-mod">
              ON
            </button>
          </div>
        </div>

        <!-- ROW 1: OPTN  CALC  HYP  nCr  (-)  DEL  AC (7 cols, 2+2+1 merged) -->
        <!-- Simplified to 5 useful keys -->
        <div class="flex-shrink-0 key-row-5">
          <div class="kc">
            <div class="sl-y">SOLVE</div>
            <button @click="press('OPTN')" class="text-[9px] key-dark">OPTN</button>
          </div>
          <div class="kc">
            <div class="sl-y">∫dx</div>
            <button @click="press('CALC')" class="text-[9px] key-dark">CALC</button>
          </div>
          <div class="kc">
            <div class="sl-y">sinh</div>
            <button
              @click="press('HYP')"
              class="text-[9px] key-dark"
              :class="isHyp ? '!bg-[#a8e0c8] !text-[#0d1520]' : ''"
            >
              HYP
            </button>
          </div>
          <div class="kc">
            <div class="sl-y">n!</div>
            <div class="sl-r">A-LOCK</div>
            <button @click="press('nCr')" class="text-[9px] key-dark">nCr</button>
          </div>
          <div class="kc">
            <div class="sl-r">CONST</div>
            <button
              @click="press('x')"
              class="font-bold text-[#FFB830] text-[10px] italic key-dark"
            >
              x
            </button>
          </div>
        </div>

        <!-- ROW 2: (-)  π  x³  xᵐ  sin -->
        <div class="flex-shrink-0 key-row-5">
          <div class="kc">
            <div class="sl-y">n!</div>
            <button @click="press('(-)')" class="text-[9px] key-dark">
              {{ isShift ? 'n!' : '(−)' }}
            </button>
          </div>
          <div class="kc">
            <div class="sl-r">i</div>
            <button @click="press('π')" class="font-bold text-[#FFB830] text-[11px] key-dark">
              π
            </button>
          </div>
          <div class="kc">
            <div class="sl-y">∛</div>
            <button @click="press('x³')" class="text-[10px] key-dark">
              {{ isShift ? '∛(' : 'x³' }}
            </button>
          </div>
          <div class="kc">
            <div class="sl-y">ˣ√y</div>
            <button @click="press('xᵐ')" class="text-[9px] key-dark">xᵐ</button>
          </div>
          <div class="kc">
            <div class="sl-y">{{ isHyp ? (isShift ? 'sinh⁻¹' : 'sinh') : 'sin⁻¹' }}</div>
            <button @click="press('sin')" class="text-[10px] key-dark">{{ sinLabel() }}</button>
          </div>
        </div>

        <!-- ROW 3: log  ln  x²  cos  tan -->
        <div class="flex-shrink-0 key-row-5">
          <div class="kc">
            <div class="sl-y">10ˣ</div>
            <button @click="press('log')" class="text-[10px] key-dark">log</button>
          </div>
          <div class="kc">
            <div class="sl-y">eˣ</div>
            <button @click="press('ln')" class="text-[10px] key-dark">ln</button>
          </div>
          <div class="kc">
            <div class="sl-y">√</div>
            <button @click="press('x²')" class="text-[10px] key-dark">
              {{ isShift ? '√' : 'x²' }}
            </button>
          </div>
          <div class="kc">
            <div class="sl-y">{{ isHyp ? (isShift ? 'cosh⁻¹' : 'cosh') : 'cos⁻¹' }}</div>
            <button @click="press('cos')" class="text-[10px] key-dark">{{ cosLabel() }}</button>
          </div>
          <div class="kc">
            <div class="sl-y">{{ isHyp ? (isShift ? 'tanh⁻¹' : 'tanh') : 'tan⁻¹' }}</div>
            <button @click="press('tan')" class="text-[10px] key-dark">{{ tanLabel() }}</button>
          </div>
        </div>

        <!-- ROW 4: STO  ENG  (  )  S⇔D  M+  (6 cols) -->
        <div class="flex-shrink-0 key-row-6">
          <div class="kc">
            <div class="sl-y">RCL</div>
            <button @click="press(isShift ? 'RCL' : 'STO')" class="text-[9px] key-dark">STO</button>
          </div>
          <div class="kc">
            <div class="sl-y">CONV</div>
            <button @click="press('ENG')" class="text-[9px] key-dark">ENG</button>
          </div>
          <div class="kc">
            <div class="sl-y">Abs</div>
            <button @click="press('(')" class="text-[11px] key-dark">(</button>
          </div>
          <div class="kc">
            <div class="sl-y">%</div>
            <button @click="press(')')" class="text-[11px] key-dark">)</button>
          </div>
          <div class="kc">
            <button @click="press('S⇔D')" class="text-[8px] key-dark">S⇔D</button>
          </div>
          <div class="kc">
            <div class="sl-y">M−</div>
            <div class="sl-r">M</div>
            <button
              @click="press(isShift ? 'M-' : isAlpha ? 'RCL' : 'M+')"
              class="text-[9px] key-dark"
            >
              M+
            </button>
          </div>
        </div>

        <!-- ROW 5: 7 8 9 DEL AC -->
        <div class="flex-shrink-0 key-row-5">
          <div class="kc">
            <div class="sl-y">Rnd</div>
            <!-- <div class="sl-r">G</div> -->
            <button
              @click="press('7')"
              class="key-num"
              :class="activeKey === '7' ? 'key-active' : ''"
            >
              7
            </button>
          </div>
          <div class="kc">
            <!-- <div class="sl-r">H</div> -->
            <button
              @click="press('8')"
              class="key-num"
              :class="activeKey === '8' ? 'key-active' : ''"
            >
              8
            </button>
          </div>
          <div class="kc">
            <!-- <div class="sl-r">I</div> -->
            <button
              @click="press('9')"
              class="key-num"
              :class="activeKey === '9' ? 'key-active' : ''"
            >
              9
            </button>
          </div>
          <div class="kc">
            <div class="sl-y">INS</div>
            <button
              @click="press('DEL')"
              class="key-del"
              :class="activeKey === 'DEL' ? 'key-active' : ''"
            >
              DEL
            </button>
          </div>
          <div class="kc">
            <div class="sl-y">OFF</div>
            <button
              @click="press('AC')"
              class="key-ac"
              :class="activeKey === 'AC' ? 'key-active' : ''"
            >
              AC
            </button>
          </div>
        </div>

        <!-- ROW 6: 4 5 6 × ÷ -->
        <div class="flex-shrink-0 key-row-5">
          <div class="kc">
            <!-- <div class="sl-r">J</div> -->
            <button
              @click="press('4')"
              class="key-num"
              :class="activeKey === '4' ? 'key-active' : ''"
            >
              4
            </button>
          </div>
          <div class="kc">
            <!-- <div class="sl-y">nCr</div> -->
            <!-- <div class="sl-r">K</div> -->
            <button
              @click="press('5')"
              class="key-num"
              :class="activeKey === '5' ? 'key-active' : ''"
            >
              5
            </button>
          </div>
          <div class="kc">
            <!-- <div class="sl-r">L</div> -->
            <button
              @click="press('6')"
              class="key-num"
              :class="activeKey === '6' ? 'key-active' : ''"
            >
              6
            </button>
          </div>
          <div class="kc">
            <button
              @click="press('×')"
              class="key-op"
              :class="activeKey === '×' ? 'key-active' : ''"
            >
              ×
            </button>
          </div>
          <div class="kc">
            <div class="sl-y">%</div>
            <button
              @click="press('÷')"
              class="key-op"
              :class="activeKey === '÷' ? 'key-active' : ''"
            >
              ÷
            </button>
          </div>
        </div>

        <!-- ROW 7: 1 2 3 + − -->
        <div class="flex-shrink-0 key-row-5">
          <div class="kc">
            <!-- <div class="sl-r">M</div> -->
            <button
              @click="press('1')"
              class="key-num"
              :class="activeKey === '1' ? 'key-active' : ''"
            >
              1
            </button>
          </div>
          <div class="kc">
            <!-- <div class="sl-r">N</div> -->
            <button
              @click="press('2')"
              class="key-num"
              :class="activeKey === '2' ? 'key-active' : ''"
            >
              2
            </button>
          </div>
          <div class="kc">
            <!-- <div class="sl-y">π</div> -->
            <!-- <div class="sl-r">O</div> -->
            <button
              @click="press('3')"
              class="key-num"
              :class="activeKey === '3' ? 'key-active' : ''"
            >
              3
            </button>
          </div>
          <div class="kc">
            <!-- <div class="sl-r">+</div> -->
            <button
              @click="press('+')"
              class="key-op"
              :class="activeKey === '+' ? 'key-active' : ''"
            >
              +
            </button>
          </div>
          <div class="kc">
            <!-- <div class="sl-r">−</div> -->
            <button
              @click="press('−')"
              class="key-op"
              :class="activeKey === '−' ? 'key-active' : ''"
            >
              −
            </button>
          </div>
        </div>

        <!-- ROW 8: 0 · ×10ˣ Ans = -->
        <div class="flex-shrink-0 key-row-5">
          <div class="kc">
            <!-- <div class="sl-r">P</div> -->
            <button
              @click="press('0')"
              class="key-num"
              :class="activeKey === '0' ? 'key-active' : ''"
            >
              0
            </button>
          </div>
          <div class="kc">
            <div class="sl-y">RAN#</div>
            <!-- <div class="sl-r">Q</div> -->
            <button
              @click="press('.')"
              class="key-num"
              :class="activeKey === '.' ? 'key-active' : ''"
            >
              ·
            </button>
          </div>
          <div class="kc">
            <div class="sl-y">ENG</div>
            <button @click="press('×10^')" class="text-[8px] key-dark">×10ˣ</button>
          </div>
          <div class="kc">
            <div class="sl-r">R</div>
            <button @click="press('Ans')" class="text-[9px] key-dark">Ans</button>
          </div>
          <div class="kc kc-eq">
            <button
              @click="press('=')"
              class="w-full h-full key-eq"
              :class="activeKey === '=' ? 'key-active' : ''"
            >
              =
            </button>
          </div>
        </div>
      </div>
      <!-- end keypad -->
    </div>
    <!-- end calc-shell -->
  </div>
</template>

<style scoped>
.calc-shell {
  background:
    repeating-linear-gradient(
      45deg,
      rgba(255, 255, 255, 0.012) 0,
      rgba(255, 255, 255, 0.012) 1px,
      transparent 1px,
      transparent 7px
    ),
    linear-gradient(165deg, #1e2638 0%, #111825 55%, #0c1018 100%);
  border-radius: 10px 10px 14px 14px;
  border: 1.5px solid #253549;
  box-shadow:
    0 0 0 3px #07090e,
    0 24px 64px rgba(0, 0, 0, 0.9),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  overflow: hidden;
}
.brand-bar {
  background: linear-gradient(90deg, #12202e 0%, #0e1826 100%);
  border-bottom: 1px solid #1e2e40;
}
.casio-text {
  font-family: 'Arial Black', 'Arial', sans-serif;
  font-size: 20px;
  font-weight: 900;
  color: #ff6b4a;
  letter-spacing: 5px;
  text-decoration: none;
}

/* Screen */
.screen-outer {
  background: #0d180a;
  border-radius: 4px;
  border: 2px solid #060e04;
  box-shadow: inset 0 2px 12px rgba(0, 0, 0, 0.8);
  padding: 2px;
}
.screen-lcd {
  background: linear-gradient(165deg, #c4d88e 0%, #aac274 100%);
  padding: 6px 10px 7px;
  border-radius: 2px;
  min-height: 80px;
}
.st-badge {
  font-size: 7px;
  font-weight: 700;
  padding: 0 3px;
  border-radius: 2px;
  line-height: 12px;
}
.st-dim {
  font-size: 8px;
  color: #2d4a18;
  font-family: monospace;
}
.screen-line-top {
  text-align: right;
  min-height: 20px;
  word-break: break-all;
  white-space: pre-wrap;
}
.lcd-expr {
  font-family: 'Courier New', monospace;
  color: #0d2208;
  font-size: 12px;
  letter-spacing: 0.05em;
}
.lcd-cur {
  display: inline-block;
  width: 1.5px;
  height: 13px;
  background: #0d2208;
  margin-left: 1px;
  vertical-align: text-bottom;
  animation: blink 0.8s step-start infinite;
}
.lcd-sep {
  height: 1px;
  background: rgba(0, 0, 0, 0.12);
  margin: 3px 0 2px;
}
.screen-line-bot {
  text-align: right;
  min-height: 26px;
}
.lcd-result {
  font-family: 'Courier New', monospace;
  font-weight: 700;
  color: #071a03;
  font-size: 22px;
  letter-spacing: 0.04em;
}
.lcd-sub {
  font-family: 'Courier New', monospace;
  color: #1a4010;
  font-size: 11px;
  word-break: break-all;
}
@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

/* Grids */
.key-row-5 {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 3px;
  padding: 0 1px;
}
.key-row-6 {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 3px;
  padding: 0 1px;
}

/* Cell — flexible height, labels float above the button */
.kc {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  position: relative;
  height: 100%; /* fill available row height */
  min-height: 40px; /* fallback for very short screens */
  padding-top: 10px; /* reserve 10px at top for labels */
}
.kc-eq {
}

/* Labels — both absolutely positioned so they don't affect button height */
.sl-y {
  font-size: 6px;
  color: #ffb830;
  font-family: monospace;
  line-height: 10px;
  padding-left: 2px;
  overflow: hidden;
  white-space: nowrap;
  position: absolute;
  top: 0;
  left: 0;
}
.sl-r {
  font-size: 6px;
  color: #ff6b4a;
  font-family: monospace;
  line-height: 10px;
  padding-right: 2px;
  overflow: hidden;
  white-space: nowrap;
  position: absolute;
  top: 0;
  right: 0;
}

/* Keys — base */
.key-mod,
.key-dark,
.key-num,
.key-op,
.key-del,
.key-ac,
.key-eq {
  flex: 1;
  width: 100%;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-family: 'Courier New', monospace;
  font-weight: 700;
  font-size: 11px;
  box-shadow: 0 2.5px 0 rgba(0, 0, 0, 0.6);
  transition:
    filter 0.06s,
    transform 0.06s;
  outline: none;
  user-select: none;
  -webkit-user-select: none;
}
.key-mod:active,
.key-dark:active,
.key-num:active,
.key-op:active,
.key-del:active,
.key-ac:active,
.key-eq:active,
.key-active {
  transform: translateY(2px);
  box-shadow: 0 0.5px 0 rgba(0, 0, 0, 0.5);
  filter: brightness(0.75);
}

.key-mod {
  background: linear-gradient(180deg, #3a3050 0%, #2a2040 100%);
  color: #b8a8e0;
  font-size: 9px;
}
.key-dark {
  background: linear-gradient(180deg, #1e3050 0%, #162240 100%);
  color: #c8daf0;
}
.key-num {
  background: linear-gradient(180deg, #ece8dc 0%, #ccc8b8 100%);
  color: #111;
  font-size: 15px;
}
.key-op {
  background: linear-gradient(180deg, #c8a060 0%, #a07838 100%);
  color: #fff;
  font-size: 15px;
}
.key-del {
  background: linear-gradient(180deg, #1e6aaa 0%, #124e80 100%);
  color: #fff;
  font-size: 10px;
}
.key-ac {
  background: linear-gradient(180deg, #cc2818 0%, #981000 100%);
  color: #fff;
  font-size: 10px;
}
.key-eq {
  background: linear-gradient(180deg, #ff6b4a 0%, #cc3820 100%);
  color: #fff;
  font-size: 20px;
  font-weight: 900;
}

/* Nav */
.nav-btn {
  background: linear-gradient(180deg, #3a4860, #28364c);
  border: none;
  border-radius: 2px;
  color: #8b9db5;
  cursor: pointer;
  font-size: 7px;
  padding: 2px 5px;
  box-shadow: 0 1.5px 0 rgba(0, 0, 0, 0.4);
  transition: filter 0.07s;
  user-select: none;
  -webkit-user-select: none;
}
.nav-btn:active {
  filter: brightness(0.7);
  transform: translateY(1px);
}
.nav-center {
  background: radial-gradient(circle, #5a6880 0%, #384858 100%);
  border: none;
  border-radius: 50%;
  width: 22px;
  height: 22px;
  color: #c8d8e8;
  font-size: 6px;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  user-select: none;
  -webkit-user-select: none;
}
.nav-center:active {
  filter: brightness(0.7);
}
</style>
