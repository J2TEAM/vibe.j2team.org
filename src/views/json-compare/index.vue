<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { RouterLink } from 'vue-router'

type DiffRow =
  | { type: 'same'; a: string; b: string }
  | { type: 'removed'; a: string }
  | { type: 'added'; b: string }
  | { type: 'changed'; a: string; b: string }

type DiffOp =
  | { type: 'same'; a: string; b: string }
  | { type: 'ins'; b: string }
  | { type: 'del'; a: string }

type PanelLeft = { ln: number | ''; html: string; type: 'same' | 'removed' | 'changed' | 'empty' }
type PanelRight = { ln: number | ''; html: string; type: 'same' | 'added' | 'changed' | 'empty' }

const inputA = ref('')
const inputB = ref('')
const labelA = ref('JSON gốc')
const labelB = ref('JSON so sánh')
const statusA = ref('')
const statusB = ref('')
const errorA = ref('')
const errorB = ref('')
const compareError = ref('')
const hideSame = ref(false)
const copyLabel = ref('Copy diff')
const hasResults = ref(false)

const diffLeftRef = ref<HTMLElement | null>(null)
const diffRightRef = ref<HTMLElement | null>(null)
let syncing = false

const stats = ref({ added: 0, removed: 0, changed: 0, same: 0 })
const rows = ref<DiffRow[]>([])
const leftPanels = ref<PanelLeft[]>([])
const rightPanels = ref<PanelRight[]>([])

const leftLines = computed(() => leftPanels.value)
const rightLines = computed(() => rightPanels.value)
const visibleRowIndices = computed(() => {
  const indices: number[] = []
  rows.value.forEach((row, index) => {
    if (!hideSame.value || row.type !== 'same') indices.push(index)
  })
  return indices
})

const summaryCards = computed(() => [
  {
    value: stats.value.added,
    label: 'Dòng thêm',
    highlight: '(+)',
    className: 'bg-green-50 border border-green-200 text-green-700',
    labelClass: 'text-green-600',
  },
  {
    value: stats.value.removed,
    label: 'Dòng xoá',
    highlight: '(-)',
    className: 'bg-red-50 border border-red-200 text-red-700',
    labelClass: 'text-red-600',
  },
  {
    value: stats.value.changed,
    label: 'Dòng thay đổi',
    highlight: '(~)',
    className: 'bg-amber-50 border border-amber-200 text-amber-700',
    labelClass: 'text-amber-600',
  },
  {
    value: stats.value.same,
    label: 'Dòng giống nhau',
    highlight: '(=)',
    className: 'bg-slate-50 border border-slate-200 text-slate-700',
    labelClass: 'text-slate-500',
  },
])

function validatePanel(side: 'a' | 'b') {
  const input = (side === 'a' ? inputA : inputB).value.trim()
  const errorEl = side === 'a' ? errorA : errorB
  const statusEl = side === 'a' ? statusA : statusB

  if (!input) {
    errorEl.value = ''
    statusEl.value = ''
    return null
  }

  try {
    const parsed = JSON.parse(input)
    errorEl.value = ''
    statusEl.value = '✓ hợp lệ'
    return parsed
  } catch (error) {
    errorEl.value = `Lỗi: ${(error as Error).message}`
    statusEl.value = '✗ không hợp lệ'
    return null
  }
}

function clearPanel(side: 'a' | 'b') {
  if (side === 'a') {
    inputA.value = ''
    errorA.value = ''
    statusA.value = ''
    labelA.value = 'JSON gốc'
  } else {
    inputB.value = ''
    errorB.value = ''
    statusB.value = ''
    labelB.value = 'JSON so sánh'
  }
}

function formatPanel(side: 'a' | 'b') {
  const target = side === 'a' ? inputA : inputB
  if (!target.value.trim()) return
  try {
    target.value = JSON.stringify(JSON.parse(target.value), null, 2)
    validatePanel(side)
  } catch {
    // ignore
  }
}

function formatBoth() {
  formatPanel('a')
  formatPanel('b')
}

function handleFile(event: Event, side: 'a' | 'b') {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (ev) => {
    const value = String(ev.target?.result ?? '')
    if (side === 'a') {
      inputA.value = value
      labelA.value = file.name
      validatePanel('a')
    } else {
      inputB.value = value
      labelB.value = file.name
      validatePanel('b')
    }
  }
  reader.readAsText(file)
  input.value = ''
}

function handleDrop(event: DragEvent, side: 'a' | 'b') {
  event.preventDefault()
  const file = event.dataTransfer?.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    const value = String(ev.target?.result ?? '')
    if (side === 'a') {
      inputA.value = value
      labelA.value = file.name
      validatePanel('a')
    } else {
      inputB.value = value
      labelB.value = file.name
      validatePanel('b')
    }
  }
  reader.readAsText(file)
}

function resetResults() {
  compareError.value = ''
  hasResults.value = false
  rows.value = []
  stats.value = { added: 0, removed: 0, changed: 0, same: 0 }
  leftPanels.value = []
  rightPanels.value = []
}

function swapPanels() {
  const temp = inputA.value
  inputA.value = inputB.value
  inputB.value = temp

  const tempLabel = labelA.value
  labelA.value = labelB.value
  labelB.value = tempLabel

  validatePanel('a')
  validatePanel('b')
}

function esc(value: string) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function inlineDiff(strA: string, strB: string) {
  let start = 0
  const minLen = Math.min(strA.length, strB.length)
  while (start < minLen && strA[start] === strB[start]) start++

  let endA = strA.length
  let endB = strB.length
  while (endA > start && endB > start && strA[endA - 1] === strB[endB - 1]) {
    endA--
    endB--
  }

  return {
    aHtml:
      esc(strA.slice(0, start)) +
      (endA > start ? `<mark>${esc(strA.slice(start, endA))}</mark>` : '') +
      esc(strA.slice(endA)),
    bHtml:
      esc(strB.slice(0, start)) +
      (endB > start ? `<mark>${esc(strB.slice(start, endB))}</mark>` : '') +
      esc(strB.slice(endB)),
  }
}

function computeLineDiff(linesA: string[], linesB: string[]) {
  const m = linesA.length
  const n = linesB.length
  const width = n + 1
  const dp = new Int32Array((m + 1) * width)

  const at = (i: number, j: number) => dp[i * width + j] ?? 0
  const set = (i: number, j: number, value: number) => {
    dp[i * width + j] = value
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const left = linesA[i - 1]
      const right = linesB[j - 1]
      set(
        i,
        j,
        left !== undefined && right !== undefined && left === right
          ? at(i - 1, j - 1) + 1
          : Math.max(at(i - 1, j), at(i, j - 1)),
      )
    }
  }

  const ops: DiffOp[] = []
  let i = m
  let j = n

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && linesA[i - 1] === linesB[j - 1]) {
      ops.unshift({ type: 'same', a: linesA[i - 1]!, b: linesB[j - 1]! })
      i--
      j--
    } else if (j > 0 && (i === 0 || at(i, j - 1) >= at(i - 1, j))) {
      ops.unshift({ type: 'ins', b: linesB[j - 1]! })
      j--
    } else {
      ops.unshift({ type: 'del', a: linesA[i - 1]! })
      i--
    }
  }

  return ops
}

function buildRows(ops: DiffOp[]) {
  const rows: DiffRow[] = []
  let i = 0

  while (i < ops.length) {
    const op = ops[i]!
    if (op.type === 'same') {
      rows.push({ type: 'same', a: op.a, b: op.b })
      i++
    } else {
      const dels: string[] = []
      const ins: string[] = []
      while (i < ops.length) {
        const current = ops[i]!
        if (current.type === 'same') break
        if (current.type === 'del') dels.push(current.a)
        if (current.type === 'ins') ins.push(current.b)
        i++
      }
      const len = Math.max(dels.length, ins.length)
      for (let k = 0; k < len; k++) {
        const delLine = dels[k]
        const insLine = ins[k]
        if (delLine !== undefined && insLine !== undefined)
          rows.push({ type: 'changed', a: delLine, b: insLine })
        else if (delLine !== undefined) rows.push({ type: 'removed', a: delLine })
        else if (insLine !== undefined) rows.push({ type: 'added', b: insLine })
      }
    }
  }

  return rows
}

function renderTables() {
  let leftLine = 0
  let rightLine = 0

  const additions = { added: 0, removed: 0, changed: 0, same: 0 }
  const panelsLeft: PanelLeft[] = []
  const panelsRight: PanelRight[] = []

  rows.value.forEach((row) => {
    if (row.type === 'same') {
      leftLine++
      rightLine++
      additions.same++
      const text = esc(row.a)
      panelsLeft.push({ ln: leftLine, html: text, type: 'same' })
      panelsRight.push({ ln: rightLine, html: text, type: 'same' })
    } else if (row.type === 'removed') {
      leftLine++
      additions.removed++
      panelsLeft.push({ ln: leftLine, html: esc(row.a), type: 'removed' })
      panelsRight.push({ ln: '', html: '', type: 'empty' })
    } else if (row.type === 'added') {
      rightLine++
      additions.added++
      panelsLeft.push({ ln: '', html: '', type: 'empty' })
      panelsRight.push({ ln: rightLine, html: esc(row.b), type: 'added' })
    } else {
      leftLine++
      rightLine++
      additions.changed++
      const { aHtml, bHtml } = inlineDiff(row.a, row.b)
      panelsLeft.push({ ln: leftLine, html: aHtml, type: 'changed' })
      panelsRight.push({ ln: rightLine, html: bHtml, type: 'changed' })
    }
  })

  stats.value = additions
  leftPanels.value = panelsLeft
  rightPanels.value = panelsRight
}

function compare() {
  compareError.value = ''

  const rawA = inputA.value.trim()
  const rawB = inputB.value.trim()

  if (!rawA || !rawB) {
    compareError.value = 'Vui lòng nhập JSON vào cả hai ô trước khi so sánh.'
    hasResults.value = false
    leftPanels.value = []
    rightPanels.value = []
    return
  }

  resetResults()

  const linesA = rawA
  const linesB = rawB

  let jsonA: unknown
  let jsonB: unknown

  try {
    jsonA = JSON.parse(linesA)
  } catch (error) {
    compareError.value = `JSON A không hợp lệ: ${(error as Error).message}`
    hasResults.value = false
    leftPanels.value = []
    rightPanels.value = []
    return
  }

  try {
    jsonB = JSON.parse(linesB)
  } catch (error) {
    compareError.value = `JSON B không hợp lệ: ${(error as Error).message}`
    hasResults.value = false
    leftPanels.value = []
    rightPanels.value = []
    return
  }

  const formattedA = JSON.stringify(jsonA, null, 2).split('\n')
  const formattedB = JSON.stringify(jsonB, null, 2).split('\n')

  const ops = computeLineDiff(formattedA, formattedB)
  rows.value = buildRows(ops)
  renderTables()
  hasResults.value = true
  if (rows.value.length === 0) {
    leftPanels.value = []
    rightPanels.value = []
  }

  nextTick(() => {
    if (hideSame.value) {
      syncScroll('left')
    }
  })
}

function syncScroll(source: 'left' | 'right') {
  if (syncing) return
  const left = diffLeftRef.value
  const right = diffRightRef.value
  if (!left || !right) return

  syncing = true
  if (source === 'left') {
    right.scrollTop = left.scrollTop
  } else {
    left.scrollTop = right.scrollTop
  }
  syncing = false
}

function applyHideSame() {
  if (!hideSame.value) return
  syncScroll('left')
}

function handleCopyError() {
  copyLabel.value = 'Không thể copy'
  setTimeout(() => {
    copyLabel.value = 'Copy diff'
  }, 2000)
}

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, '')
}

async function copyDiff() {
  const lines: string[] = []
  visibleRowIndices.value.forEach((index) => {
    const row = rows.value[index]
    if (!row) return

    const leftRow = leftLines.value[index]
    const rightRow = rightLines.value[index]

    if (row.type === 'removed') {
      lines.push(`- ${leftRow?.html ? stripHtml(leftRow.html) : ''}`)
    } else if (row.type === 'added') {
      lines.push(`+ ${rightRow?.html ? stripHtml(rightRow.html) : ''}`)
    } else if (row.type === 'changed') {
      lines.push(`- ${leftRow?.html ? stripHtml(leftRow.html) : ''}`)
      lines.push(`+ ${rightRow?.html ? stripHtml(rightRow.html) : ''}`)
    } else {
      lines.push(`  ${leftRow?.html ? stripHtml(leftRow.html) : ''}`)
    }
  })

  try {
    await navigator.clipboard.writeText(lines.join('\n'))
    copyLabel.value = 'Đã copy!'
    setTimeout(() => {
      copyLabel.value = 'Copy diff'
    }, 2000)
  } catch {
    handleCopyError()
  }
}
</script>

<template>
  <div
    class="min-h-screen bg-bg-deep text-text-primary font-body px-4 py-8"
    @keydown.ctrl.enter="compare"
  >
    <div class="mx-auto max-w-7xl">
      <RouterLink
        to="/"
        class="fixed left-4 top-4 z-10 inline-flex items-center gap-1 text-accent-sky transition hover:text-accent-coral"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 transition-transform group-hover:-translate-x-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        <span class="font-medium">Trang chủ</span>
      </RouterLink>

      <header class="mb-6 text-center">
        <h1 class="text-3xl font-extrabold text-text-primary">JSON Compare</h1>
        <p class="text-sm text-text-dim">
          So sánh hai JSON theo dạng side-by-side · Hỗ trợ paste và upload file
        </p>
      </header>

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div class="overflow-hidden rounded-xl border border-border-default bg-bg-surface">
          <div class="flex items-center justify-between bg-accent-sky px-4 py-2.5 text-white">
            <h2 class="flex items-center gap-2 text-sm font-semibold">
              <span class="rounded bg-white px-2 py-0.5 text-xs font-extrabold text-accent-sky"
                >A</span
              >
              <span>JSON gốc</span>
            </h2>
            <div class="flex items-center gap-3 text-xs">
              <span class="text-white/80">{{ statusA }}</span>
              <button
                class="text-white/80 hover:text-white"
                type="button"
                @click="formatPanel('a')"
              >
                Format
              </button>
              <button class="text-white/80 hover:text-white" type="button" @click="clearPanel('a')">
                Xoá
              </button>
              <label class="flex cursor-pointer items-center gap-1 text-white/80 hover:text-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                <span>Chọn file</span>
                <input
                  type="file"
                  accept=".json,application/json,text/plain"
                  class="hidden"
                  @change="handleFile($event, 'a')"
                />
              </label>
            </div>
          </div>
          <div class="relative" @dragover.prevent @drop.prevent="handleDrop($event, 'a')">
            <textarea
              v-model="inputA"
              class="h-56 w-full resize-none border-0 bg-transparent p-3 font-mono text-xs text-text-secondary outline-none"
              placeholder="Dán JSON vào đây hoặc kéo thả file..."
              spellcheck="false"
              @input="validatePanel('a')"
            />
          </div>
          <div
            v-if="errorA"
            class="border-t border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600"
          >
            {{ errorA }}
          </div>
        </div>

        <div class="overflow-hidden rounded-xl border border-border-default bg-bg-surface">
          <div class="flex items-center justify-between bg-accent-coral px-4 py-2.5 text-white">
            <h2 class="flex items-center gap-2 text-sm font-semibold">
              <span class="rounded bg-white px-2 py-0.5 text-xs font-extrabold text-accent-coral"
                >B</span
              >
              <span>JSON so sánh</span>
            </h2>
            <div class="flex items-center gap-3 text-xs">
              <span class="text-white/80">{{ statusB }}</span>
              <button
                class="text-white/80 hover:text-white"
                type="button"
                @click="formatPanel('b')"
              >
                Format
              </button>
              <button class="text-white/80 hover:text-white" type="button" @click="clearPanel('b')">
                Xoá
              </button>
              <label class="flex cursor-pointer items-center gap-1 text-white/80 hover:text-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                <span>Chọn file</span>
                <input
                  type="file"
                  accept=".json,application/json,text/plain"
                  class="hidden"
                  @change="handleFile($event, 'b')"
                />
              </label>
            </div>
          </div>
          <div class="relative" @dragover.prevent @drop.prevent="handleDrop($event, 'b')">
            <textarea
              v-model="inputB"
              class="h-56 w-full resize-none border-0 bg-transparent p-3 font-mono text-xs text-text-secondary outline-none"
              placeholder="Dán JSON vào đây hoặc kéo thả file..."
              spellcheck="false"
              @input="validatePanel('b')"
            />
          </div>
          <div
            v-if="errorB"
            class="border-t border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600"
          >
            {{ errorB }}
          </div>
        </div>
      </div>

      <div class="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          class="flex items-center gap-2 rounded-xl border border-border-default bg-bg-surface px-4 py-2.5 text-sm font-medium text-text-secondary shadow-sm transition hover:border-border-strong"
          @click="swapPanels"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
            />
          </svg>
          <span>Hoán đổi</span>
        </button>

        <button
          type="button"
          class="flex items-center gap-2 rounded-xl bg-accent-sky px-6 py-2.5 text-sm font-bold text-white shadow-lg transition hover:brightness-110"
          @click="compare"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <span>So Sánh</span>
        </button>

        <button
          type="button"
          class="flex items-center gap-2 rounded-xl border border-border-default bg-bg-surface px-4 py-2.5 text-sm font-medium text-text-secondary shadow-sm transition hover:border-border-strong"
          @click="formatBoth"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h7"
            />
          </svg>
          <span>Format cả hai</span>
        </button>
      </div>

      <div
        v-if="compareError"
        class="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-600"
      >
        {{ compareError }}
      </div>

      <div v-if="hasResults" class="mt-6 space-y-4">
        <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div
            v-for="card in summaryCards"
            :key="card.label"
            class="rounded-xl border p-4 text-center"
            :class="card.className"
          >
            <div class="text-3xl font-extrabold">{{ card.value }}</div>
            <div
              class="mt-1 text-xs font-semibold uppercase tracking-wide"
              :class="card.labelClass"
            >
              {{ card.label }} <span class="font-bold">{{ card.highlight }}</span>
            </div>
          </div>
        </div>

        <div class="overflow-hidden rounded-xl border border-border-default bg-bg-surface">
          <div
            class="flex flex-wrap items-center justify-between gap-2 border-b border-border-default bg-bg-elevated px-4 py-2.5"
          >
            <div class="flex flex-wrap items-center gap-4 text-xs text-text-dim">
              <span class="flex items-center gap-1.5">
                <span
                  class="inline-block h-3 w-3 rounded-sm border border-red-300 bg-red-200"
                ></span>
                <span>Xoá / thay đổi (A)</span>
              </span>
              <span class="flex items-center gap-1.5">
                <span
                  class="inline-block h-3 w-3 rounded-sm border border-green-300 bg-green-200"
                ></span>
                <span>Thêm / thay đổi (B)</span>
              </span>
            </div>
            <div class="flex items-center gap-4">
              <label class="flex items-center gap-2 text-sm text-text-secondary">
                <input
                  v-model="hideSame"
                  type="checkbox"
                  class="rounded border-border-default"
                  @change="applyHideSame"
                />
                <span>Ẩn dòng giống nhau</span>
              </label>
              <button
                class="flex items-center gap-1 text-xs font-medium text-accent-sky"
                type="button"
                @click="copyDiff"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                <span>{{ copyLabel }}</span>
              </button>
            </div>
          </div>

          <div class="flex border-b border-border-default text-xs font-semibold">
            <div
              class="flex-1 min-w-0 border-r border-border-default bg-accent-sky/10 px-3 py-2 text-accent-sky"
            >
              <span class="rounded bg-accent-sky px-1.5 py-0.5 text-[10px] font-bold text-white"
                >A</span
              >
              <span class="ml-2">{{ labelA }}</span>
            </div>
            <div class="flex-1 min-w-0 bg-accent-coral/10 px-3 py-2 text-accent-coral">
              <span class="rounded bg-accent-coral px-1.5 py-0.5 text-[10px] font-bold text-white"
                >B</span
              >
              <span class="ml-2">{{ labelB }}</span>
            </div>
          </div>

          <div class="flex" style="max-height: 68vh">
            <div
              ref="diffLeftRef"
              class="flex-1 min-w-0 border-r border-border-default overflow-auto"
              @scroll="syncScroll('left')"
            >
              <table class="w-full border-collapse font-mono text-xs">
                <tbody>
                  <tr v-for="index in visibleRowIndices" :key="index">
                    <td
                      class="w-10 select-none border-r border-border-default px-2 py-0.5 text-right text-text-dim"
                      :class="{
                        'bg-red-100':
                          leftLines[index]?.type === 'removed' ||
                          leftLines[index]?.type === 'changed',
                        'bg-bg-elevated': leftLines[index]?.type === 'empty',
                      }"
                    >
                      {{ leftLines[index]?.ln ?? '' }}
                    </td>
                    <td
                      class="w-1/2 px-3 py-0.5 whitespace-pre-wrap break-all"
                      :class="{
                        'bg-red-50 text-red-700':
                          leftLines[index]?.type === 'removed' ||
                          leftLines[index]?.type === 'changed',
                        'bg-bg-elevated': leftLines[index]?.type === 'empty',
                      }"
                      v-html="leftLines[index]?.html || '&nbsp;'"
                    />
                  </tr>
                  <tr v-if="rows.length === 0">
                    <td class="px-3 py-4 text-center text-text-dim" colspan="2">
                      Không có sự khác biệt
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div
              ref="diffRightRef"
              class="flex-1 min-w-0 overflow-auto"
              @scroll="syncScroll('right')"
            >
              <table class="w-full border-collapse font-mono text-xs">
                <tbody>
                  <tr v-for="index in visibleRowIndices" :key="index">
                    <td
                      class="w-10 select-none border-r border-border-default px-2 py-0.5 text-right text-text-dim"
                      :class="{
                        'bg-green-100':
                          rightLines[index]?.type === 'added' ||
                          rightLines[index]?.type === 'changed',
                        'bg-bg-elevated': rightLines[index]?.type === 'empty',
                      }"
                    >
                      {{ rightLines[index]?.ln ?? '' }}
                    </td>
                    <td
                      class="w-1/2 px-3 py-0.5 whitespace-pre-wrap break-all"
                      :class="{
                        'bg-green-50 text-green-700':
                          rightLines[index]?.type === 'added' ||
                          rightLines[index]?.type === 'changed',
                        'bg-bg-elevated': rightLines[index]?.type === 'empty',
                      }"
                      v-html="rightLines[index]?.html || '&nbsp;'"
                    />
                  </tr>
                  <tr v-if="rows.length === 0">
                    <td class="px-3 py-4 text-center text-text-dim" colspan="2">
                      Không có sự khác biệt
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <footer class="mt-10 text-center text-sm text-text-dim">
        <p>
          JSON Compare ·
          <RouterLink to="/" class="transition hover:text-text-primary"
            >Dev Tools Collection</RouterLink
          >
        </p>
      </footer>
    </div>
  </div>
</template>

<style scoped>
textarea {
  font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
  tab-size: 2;
}

:deep(mark) {
  border-radius: 2px;
  background: #ffb3b3;
}

:deep(.bg-green-50 mark) {
  background: #82f0a4;
}
</style>
