/**
 * Regex-based syntax highlighter for JS/TS — zero dependency.
 * Pattern: diff-then-highlight (apply per line after diff).
 */

import { escapeHtml } from '../utils/escapeHtml'

const JS_RULES: Array<{ pattern: RegExp; cls: string }> = [
  { pattern: /\/\/.*$/, cls: 'hl-comment' },
  { pattern: /\/\*[\s\S]*?\*\//, cls: 'hl-comment' },
  { pattern: /(["'`])(?:(?!\1)[^\\]|\\.)*\1/, cls: 'hl-string' },
  { pattern: /\b\d+\.?\d*\b/, cls: 'hl-number' },
  {
    pattern:
      /\b(?:const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|class|extends|import|export|default|from|async|await|try|catch|finally|throw|new|this|typeof|instanceof|in|of)\b/,
    cls: 'hl-keyword',
  },
  { pattern: /\b(?:true|false|null|undefined)\b/, cls: 'hl-constant' },
  { pattern: /\b[A-Z][a-zA-Z0-9]*\b/, cls: 'hl-type' },
]

/** Get first matching rule at position. Rules ordered by priority. */
function matchAt(line: string, pos: number, rules: Array<{ pattern: RegExp; cls: string }>): { end: number; cls: string } | null {
  const rest = line.slice(pos)
  for (const { pattern, cls } of rules) {
    const m = pattern.exec(rest)
    if (m && m.index === 0) {
      return { end: pos + m[0].length, cls }
    }
  }
  return null
}

export function highlight(line: string, language = 'javascript'): string {
  const rules = language === 'javascript' || language === 'typescript' ? JS_RULES : []
  if (rules.length === 0) return escapeHtml(line)

  let out = ''
  let pos = 0

  while (pos < line.length) {
    const m = matchAt(line, pos, rules)
    if (m) {
      out += `<span class="${m.cls}">${escapeHtml(line.slice(pos, m.end))}</span>`
      pos = m.end
    } else {
      out += escapeHtml(line[pos] ?? '')
      pos++
    }
  }

  return out
}
