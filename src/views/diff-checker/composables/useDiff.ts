import { computed, type Ref } from 'vue'
import { escapeHtml } from '../utils/escapeHtml'

export interface DiffResult {
  type: 'equal' | 'delete' | 'insert'
  value: string
}

export interface PanelLine {
  ln: number
  html: string
  type: 'equal' | 'delete' | 'insert' | 'modified'
}

export interface AlignedRow {
  left: PanelLine | null
  right: PanelLine | null
}

export interface TwoPanelData {
  rows: AlignedRow[]
}

export interface UnifiedLine {
  type: 'equal' | 'delete' | 'insert'
  oldLn: number | null
  newLn: number | null
  value: string
}

export interface CharDiffPart {
  value: string
  added?: boolean
  removed?: boolean
}

const MAX_DP_CELLS = 10_000_000

/**
 * Line-level diff using LCS-based edit distance. O(N*M) time.
 * Each delete/insert result is a single line.
 * Adjacent equal results are merged (multi-line value with \n).
 * Falls back to simple delete-all + insert-all when N*M exceeds threshold.
 */
export function diffLines(oldText: string, newText: string): DiffResult[] {
  const oldLines = splitLines(oldText)
  const newLines = splitLines(newText)
  const N = oldLines.length
  const M = newLines.length

  if (N === 0 && M === 0) return []
  if (N === 0) return newLines.map((line) => ({ type: 'insert' as const, value: line }))
  if (M === 0) return oldLines.map((line) => ({ type: 'delete' as const, value: line }))

  if (N * M > MAX_DP_CELLS) {
    return simpleDiffLines(oldLines, newLines)
  }

  const dp: number[][] = Array.from({ length: N + 1 }, () => Array(M + 1).fill(0))

  for (let i = 1; i <= N; i++) dp[i]![0] = i
  for (let j = 1; j <= M; j++) dp[0]![j] = j

  for (let i = 1; i <= N; i++) {
    for (let j = 1; j <= M; j++) {
      const row = dp[i]!
      const prevRow = dp[i - 1]!
      if (oldLines[i - 1] === newLines[j - 1]) {
        row[j] = prevRow[j - 1]!
      } else {
        row[j] = 1 + Math.min(prevRow[j]!, row[j - 1]!)
      }
    }
  }

  const result: DiffResult[] = []
  let i = N
  let j = M

  while (i > 0 || j > 0) {
    const di = dp[i]
    const di1 = dp[i - 1]
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      result.unshift({ type: 'equal', value: oldLines[i - 1] ?? '' })
      i--
      j--
    } else if (j > 0 && (i === 0 || (di?.[j - 1] ?? 0) <= (di1?.[j] ?? 0))) {
      result.unshift({ type: 'insert', value: newLines[j - 1] ?? '' })
      j--
    } else {
      result.unshift({ type: 'delete', value: oldLines[i - 1] ?? '' })
      i--
    }
  }

  return mergeAdjacentEqual(result)
}

function splitLines(text: string): string[] {
  if (text === '') return []
  return text.split(/\r\n|\r|\n/)
}

/**
 * O(N+M) fallback for large inputs: line-by-line comparison,
 * then all remaining lines as delete/insert.
 */
function simpleDiffLines(oldLines: string[], newLines: string[]): DiffResult[] {
  const result: DiffResult[] = []
  const minLen = Math.min(oldLines.length, newLines.length)

  for (let i = 0; i < minLen; i++) {
    if (oldLines[i] === newLines[i]) {
      result.push({ type: 'equal', value: oldLines[i]! })
    } else {
      result.push({ type: 'delete', value: oldLines[i]! })
      result.push({ type: 'insert', value: newLines[i]! })
    }
  }

  for (let i = minLen; i < oldLines.length; i++) {
    result.push({ type: 'delete', value: oldLines[i]! })
  }
  for (let i = minLen; i < newLines.length; i++) {
    result.push({ type: 'insert', value: newLines[i]! })
  }

  return mergeAdjacentEqual(result)
}

function mergeAdjacentEqual(diffs: DiffResult[]): DiffResult[] {
  const out: DiffResult[] = []
  for (const d of diffs) {
    const last = out[out.length - 1]
    if (d.type === 'equal' && last?.type === 'equal') {
      last.value += '\n' + d.value
    } else {
      out.push({ ...d })
    }
  }
  return out
}

const SIMILARITY_THRESHOLD = 0.4

/**
 * O(n) similarity heuristic using character frequency overlap.
 * Returns ratio [0..1]. Determines if two lines are "modifications"
 * of each other (worth char-level diff) vs completely unrelated.
 *
 * "vibe.j2team.org" vs "const x = 10;" → ~0.14 (below threshold → separate)
 * "const y = 20;"   vs "const y = 30;" → ~0.86 (above threshold → paired)
 */
function lineSimilarity(a: string, b: string): number {
  if (a === b) return 1
  if (a.length === 0 && b.length === 0) return 1
  if (a.length === 0 || b.length === 0) return 0

  const maxLen = Math.max(a.length, b.length)
  const minLen = Math.min(a.length, b.length)
  if (minLen / maxLen < 0.3) return 0

  const freqA = new Map<string, number>()
  for (const c of a) freqA.set(c, (freqA.get(c) ?? 0) + 1)

  let overlap = 0
  for (const c of b) {
    const count = freqA.get(c)
    if (count && count > 0) {
      overlap++
      freqA.set(c, count - 1)
    }
  }

  return (2 * overlap) / (a.length + b.length)
}

function renderCharDiffLeft(parts: CharDiffPart[]): string {
  let html = ''
  for (const p of parts) {
    if (p.added) continue
    const escaped = escapeHtml(p.value)
    html += p.removed ? `<mark class="char-del">${escaped}</mark>` : escaped
  }
  return html
}

function renderCharDiffRight(parts: CharDiffPart[]): string {
  let html = ''
  for (const p of parts) {
    if (p.removed) continue
    const escaped = escapeHtml(p.value)
    html += p.added ? `<mark class="char-ins">${escaped}</mark>` : escaped
  }
  return html
}

/**
 * GitHub-style row-aligned two-panel data.
 *
 * 1. Line-level diff first (diffLines)
 * 2. For each change block (consecutive dels + ins):
 *    - Pair del[i] ↔ ins[i] → "modified" row with char-level diff
 *    - Unpaired dels → left only, right = null (padding)
 *    - Unpaired ins → left = null (padding), right only
 * 3. Equal lines → both sides, same row
 */
export function toTwoPanels(diffs: DiffResult[]): TwoPanelData {
  const rows: AlignedRow[] = []
  let oldLn = 1
  let newLn = 1

  let i = 0
  while (i < diffs.length) {
    const d = diffs[i]
    if (!d) break

    if (d.type === 'equal') {
      for (const line of d.value.split('\n')) {
        const html = escapeHtml(line)
        rows.push({
          left: { ln: oldLn++, html, type: 'equal' },
          right: { ln: newLn++, html, type: 'equal' },
        })
      }
      i++
    } else {
      const dels: string[] = []
      const ins: string[] = []
      while (i < diffs.length && diffs[i]?.type === 'delete') {
        const cur = diffs[i]
        if (cur) dels.push(cur.value)
        i++
      }
      while (i < diffs.length && diffs[i]?.type === 'insert') {
        const cur = diffs[i]
        if (cur) ins.push(cur.value)
        i++
      }

      const paired = Math.min(dels.length, ins.length)

      for (let j = 0; j < paired; j++) {
        const delVal = dels[j]!
        const insVal = ins[j]!

        if (lineSimilarity(delVal, insVal) >= SIMILARITY_THRESHOLD) {
          const charParts = diffChars(delVal, insVal)
          rows.push({
            left: { ln: oldLn++, html: renderCharDiffLeft(charParts), type: 'modified' },
            right: { ln: newLn++, html: renderCharDiffRight(charParts), type: 'modified' },
          })
        } else {
          rows.push({
            left: { ln: oldLn++, html: escapeHtml(delVal), type: 'delete' },
            right: null,
          })
          rows.push({
            left: null,
            right: { ln: newLn++, html: escapeHtml(insVal), type: 'insert' },
          })
        }
      }

      for (let j = paired; j < dels.length; j++) {
        rows.push({
          left: { ln: oldLn++, html: escapeHtml(dels[j]!), type: 'delete' },
          right: null,
        })
      }

      for (let j = paired; j < ins.length; j++) {
        rows.push({
          left: null,
          right: { ln: newLn++, html: escapeHtml(ins[j]!), type: 'insert' },
        })
      }
    }
  }

  return { rows }
}

export function toUnified(diffs: DiffResult[]): UnifiedLine[] {
  const lines: UnifiedLine[] = []
  let oldLn = 1
  let newLn = 1

  for (const d of diffs) {
    const lineStrs = d.value.split('\n')
    for (const line of lineStrs) {
      if (d.type === 'equal') {
        lines.push({ type: 'equal', oldLn, newLn, value: line })
        oldLn++
        newLn++
      } else if (d.type === 'delete') {
        lines.push({ type: 'delete', oldLn, newLn: null, value: line })
        oldLn++
      } else {
        lines.push({ type: 'insert', oldLn: null, newLn, value: line })
        newLn++
      }
    }
  }

  return lines
}

/**
 * Character-level diff using LCS edit distance.
 * Used within modified lines for inline highlighting.
 * Falls back to full remove+add when N*M exceeds threshold.
 */
export function diffChars(oldLine: string, newLine: string): CharDiffPart[] {
  const a = [...oldLine]
  const b = [...newLine]
  const N = a.length
  const M = b.length

  if (N === 0 && M === 0) return []
  if (N === 0) return [{ value: newLine, added: true }]
  if (M === 0) return [{ value: oldLine, removed: true }]

  if (N * M > MAX_DP_CELLS) {
    return [
      { value: oldLine, removed: true },
      { value: newLine, added: true },
    ]
  }

  const dp: number[][] = Array.from({ length: N + 1 }, () => Array(M + 1).fill(0))

  for (let i = 1; i <= N; i++) dp[i]![0] = i
  for (let j = 1; j <= M; j++) dp[0]![j] = j

  for (let i = 1; i <= N; i++) {
    for (let j = 1; j <= M; j++) {
      const row = dp[i]!
      const prevRow = dp[i - 1]!
      if (a[i - 1] === b[j - 1]) {
        row[j] = prevRow[j - 1]!
      } else {
        row[j] = 1 + Math.min(prevRow[j]!, row[j - 1]!)
      }
    }
  }

  let i = N
  let j = M
  const path: Array<'eq' | 'del' | 'ins'> = []

  while (i > 0 || j > 0) {
    const di = dp[i]
    const di1 = dp[i - 1]
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      path.unshift('eq')
      i--
      j--
    } else if (j > 0 && (i === 0 || (di?.[j - 1] ?? 0) <= (di1?.[j] ?? 0))) {
      path.unshift('ins')
      j--
    } else {
      path.unshift('del')
      i--
    }
  }

  const parts: CharDiffPart[] = []
  let ai = 0
  let bi = 0
  for (const move of path) {
    if (move === 'eq') {
      parts.push({ value: a[ai] ?? '' })
      ai++
      bi++
    } else if (move === 'del') {
      parts.push({ value: a[ai] ?? '', removed: true })
      ai++
    } else {
      parts.push({ value: b[bi] ?? '', added: true })
      bi++
    }
  }

  return mergeCharParts(parts)
}

function mergeCharParts(parts: CharDiffPart[]): CharDiffPart[] {
  const out: CharDiffPart[] = []
  for (const p of parts) {
    const last = out[out.length - 1]
    if (last && !!last.added === !!p.added && !!last.removed === !!p.removed) {
      last.value += p.value
    } else {
      out.push({ ...p })
    }
  }
  return out
}

export function useDiff(oldText: Ref<string>, newText: Ref<string>) {
  const isLargeInput = computed(() => {
    const oldCount = oldText.value === '' ? 0 : splitLines(oldText.value).length
    const newCount = newText.value === '' ? 0 : splitLines(newText.value).length
    return oldCount * newCount > MAX_DP_CELLS
  })

  const rawDiff = computed(() => diffLines(oldText.value, newText.value))

  const twoPanels = computed(() => toTwoPanels(rawDiff.value))

  const unified = computed(() => toUnified(rawDiff.value))

  const stats = computed(() => {
    let additions = 0
    let deletions = 0
    for (const d of rawDiff.value) {
      const count = (d.value.match(/\n/g)?.length ?? 0) + 1
      if (d.type === 'insert') additions += count
      else if (d.type === 'delete') deletions += count
    }
    return { additions, deletions }
  })

  return { rawDiff, twoPanels, unified, stats, isLargeInput }
}
