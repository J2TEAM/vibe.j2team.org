/**
 * Math Expression Parser & Evaluator
 * Shunting-yard algorithm — no eval()
 */

export type TokenType =
  | 'NUMBER'
  | 'IDENT'
  | 'OP'
  | 'LPAREN'
  | 'RPAREN'
  | 'COMMA'
  | 'FACTORIAL'
  | 'PERCENT'
  | 'EOF'

export interface Token {
  type: TokenType
  value: string
}

// ── Tokenizer ─────────────────────────────────────────────────────────────
export function tokenize(input: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  const src = input.trim()

  while (i < src.length) {
    const ch = src[i]!

    // whitespace
    if (/\s/.test(ch)) {
      i++
      continue
    }

    // number (including scientific)
    if (
      /[\d.]/.test(ch) ||
      (ch === '-' && tokens.length === 0) ||
      (ch === '-' && ['OP', 'LPAREN', 'COMMA'].includes(tokens[tokens.length - 1]?.type ?? ''))
    ) {
      let num = ''
      if (ch === '-') {
        num = '-'
        i++
      }
      while (i < src.length && /[\d.]/.test(src[i]!)) {
        num += src[i++]
      }
      if (i < src.length && src[i] === 'E') {
        num += 'E'
        i++
        if (i < src.length && (src[i] === '+' || src[i] === '-')) num += src[i++]
        while (i < src.length && /\d/.test(src[i]!)) num += src[i++]
      }
      tokens.push({ type: 'NUMBER', value: num })
      continue
    }

    // identifier / function
    if (/[a-zA-Zπℯ∞]/.test(ch)) {
      let id = ''
      while (i < src.length && /[a-zA-Z0-9πℯ⁻¹_]/.test(src[i]!)) id += src[i++]
      // handle superscript inverse like sin⁻¹
      if (i < src.length && src.slice(i, i + 2) === '⁻¹') {
        id += '⁻¹'
        i += 2
      }
      tokens.push({ type: 'IDENT', value: id })
      continue
    }

    // operators
    if (['+', '-', '*', '×', '÷', '/', '^', '='].includes(ch)) {
      tokens.push({ type: 'OP', value: ch === '×' ? '*' : ch === '÷' ? '/' : ch })
      i++
      continue
    }
    if (ch === '(') {
      tokens.push({ type: 'LPAREN', value: '(' })
      i++
      continue
    }
    if (ch === ')') {
      tokens.push({ type: 'RPAREN', value: ')' })
      i++
      continue
    }
    if (ch === ',') {
      tokens.push({ type: 'COMMA', value: ',' })
      i++
      continue
    }
    if (ch === '!') {
      tokens.push({ type: 'FACTORIAL', value: '!' })
      i++
      continue
    }
    if (ch === '%') {
      tokens.push({ type: 'PERCENT', value: '%' })
      i++
      continue
    }

    // ×10^  notation
    if (src.slice(i, i + 4) === '×10^') {
      tokens.push({ type: 'OP', value: 'E' })
      i += 4
      continue
    }

    i++ // skip unknown
  }

  tokens.push({ type: 'EOF', value: '' })
  return tokens
}

// ── Operator table ─────────────────────────────────────────────────────────
const OPS: Record<string, { prec: number; right: boolean }> = {
  '+': { prec: 1, right: false },
  '-': { prec: 1, right: false },
  '*': { prec: 2, right: false },
  '/': { prec: 2, right: false },
  '^': { prec: 4, right: true },
  E: { prec: 5, right: false },
}

// ── AST nodes ──────────────────────────────────────────────────────────────
export type ASTNode =
  | { kind: 'num'; value: number }
  | { kind: 'var'; name: string }
  | { kind: 'binop'; op: string; left: ASTNode; right: ASTNode }
  | { kind: 'unary'; op: string; arg: ASTNode }
  | { kind: 'call'; fn: string; args: ASTNode[] }
  | { kind: 'factorial'; arg: ASTNode }

// ── Recursive descent parser ───────────────────────────────────────────────
export class Parser {
  private tokens: Token[]
  private pos = 0

  constructor(input: string) {
    this.tokens = tokenize(input)
  }

  private peek(): Token {
    return this.tokens[this.pos] ?? { type: 'EOF', value: '' }
  }
  private eat(): Token {
    return this.tokens[this.pos++] ?? { type: 'EOF', value: '' }
  }

  parse(): ASTNode {
    const node = this.parseExpr(0)
    return node
  }

  private parseExpr(minPrec: number): ASTNode {
    let left = this.parseUnary()

    while (true) {
      const tok = this.peek()
      if (tok.type === 'PERCENT') {
        this.eat()
        left = { kind: 'unary', op: '%', arg: left }
        continue
      }
      if (tok.type === 'FACTORIAL') {
        this.eat()
        left = { kind: 'factorial', arg: left }
        continue
      }
      if (tok.type !== 'OP') break
      const op = tok.value
      const info = OPS[op]
      if (!info || info.prec < minPrec) break
      this.eat()
      const right = this.parseExpr(info.right ? info.prec : info.prec + 1)
      // implicit multiply before paren: 2(3) → but handled in unary
      left = { kind: 'binop', op, left, right }
    }

    // implicit multiply: number/ident followed by ( or ident
    const next = this.peek()
    if (left && (next.type === 'LPAREN' || next.type === 'IDENT')) {
      if (minPrec <= 2) {
        const right = this.parseExpr(3)
        left = { kind: 'binop', op: '*', left, right }
      }
    }

    return left
  }

  private parseUnary(): ASTNode {
    const tok = this.peek()
    if (tok.type === 'OP' && tok.value === '-') {
      this.eat()
      return { kind: 'unary', op: '-', arg: this.parseUnary() }
    }
    if (tok.type === 'OP' && tok.value === '+') {
      this.eat()
      return this.parseUnary()
    }
    return this.parsePrimary()
  }

  private parsePrimary(): ASTNode {
    const tok = this.peek()

    if (tok.type === 'NUMBER') {
      this.eat()
      return { kind: 'num', value: parseFloat(tok.value) }
    }

    if (tok.type === 'LPAREN') {
      this.eat()
      const node = this.parseExpr(0)
      if (this.peek().type === 'RPAREN') this.eat()
      return node
    }

    if (tok.type === 'IDENT') {
      this.eat()
      const name = tok.value.toLowerCase()

      // constants
      if (name === 'π' || name === 'pi') return { kind: 'num', value: Math.PI }
      if (name === 'ℯ' || name === 'e') return { kind: 'num', value: Math.E }
      if (name === 'ans') return { kind: 'var', name: 'ans' }

      // function call
      if (this.peek().type === 'LPAREN') {
        this.eat()
        const args: ASTNode[] = []
        if (this.peek().type !== 'RPAREN') {
          args.push(this.parseExpr(0))
          while (this.peek().type === 'COMMA') {
            this.eat()
            args.push(this.parseExpr(0))
          }
        }
        if (this.peek().type === 'RPAREN') this.eat()
        return { kind: 'call', fn: name, args }
      }

      // variable / memory
      return { kind: 'var', name: tok.value }
    }

    // fallback
    return { kind: 'num', value: 0 }
  }
}
