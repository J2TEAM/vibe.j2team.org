<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useClipboard } from '@vueuse/core'

// --- Types ---
type FieldType = 'string' | 'number' | 'boolean' | 'null' | 'array' | 'object'

interface ParsedField {
  key: string
  value: unknown
  detectedType: FieldType | 'unknown'
  customName: string
  customType: FieldType | 'auto'
}

// --- State ---
const inputText = ref(`{
  userId: 123,
  name: 'Nguyen Van A',
  active: true,
  roles: ['admin', 'editor'],
  meta: undefined,
  createdAt: 2024-01-15T08:30:00.000Z
}`)

const parsedFields = ref<ParsedField[]>([])
const parseError = ref('')
const activeTab = ref<'parse' | 'generate'>('parse')

// --- Random value generators ---
const RANDOM_NAMES = ['Alice', 'Bob', 'Charlie', 'Diana', 'Ethan', 'Fiona', 'George', 'Hannah']
const RANDOM_EMAILS = ['alice@example.com', 'bob@test.io', 'charlie@mail.com', 'diana@web.org']
const RANDOM_WORDS = ['hello', 'world', 'vibe', 'data', 'test', 'sample', 'value', 'lorem']

function randomInt(min = 1, max = 1000) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T
}

function generateRandom(name: string, type: FieldType | 'auto'): unknown {
  const n = name.toLowerCase()

  if (type === 'null') return null
  if (type === 'boolean') return Math.random() > 0.5

  if (
    type === 'number' ||
    (type === 'auto' &&
      /^(id|count|age|price|qty|quantity|amount|score|rank|size|total|limit|offset|page|index|num|year|month|day|duration|ms|status)/.test(
        n,
      ))
  ) {
    if (/price|amount|total|score/.test(n)) return Math.round(Math.random() * 999900) / 100
    return randomInt(1, n.endsWith('id') ? 9999 : 100)
  }

  if (type === 'array' || (type === 'auto' && /s$|list|items|tags|roles|ids/.test(n))) {
    const item = generateRandom(n.replace(/s$/, ''), 'auto')
    return [item, generateRandom(n.replace(/s$/, ''), 'auto')]
  }

  if (
    type === 'object' ||
    (type === 'auto' && /meta|config|settings|data|info|payload|body/.test(n))
  ) {
    return { id: randomInt(1, 999), value: pick(RANDOM_WORDS) }
  }

  // string heuristics by name
  if (/email|mail/.test(n)) return pick(RANDOM_EMAILS)
  if (/name|user|author|creator/.test(n)) return pick(RANDOM_NAMES)
  if (/url|link|href|src/.test(n)) return `https://example.com/${pick(RANDOM_WORDS)}`
  if (/phone|tel/.test(n)) return `+84${randomInt(100000000, 999999999)}`
  if (/date|time|at$|created|updated/.test(n)) {
    const d = new Date(Date.now() - randomInt(0, 86400000 * 365))
    return d.toISOString()
  }
  if (/color|colour/.test(n)) return pick(['#ff6b4a', '#38bdf8', '#ffb830', '#a78bfa', '#34d399'])
  if (/token|key|secret|hash/.test(n)) {
    return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
  }
  if (/active|enable|is|has|can|show|visible|flag/.test(n)) return Math.random() > 0.5

  return pick(RANDOM_WORDS)
}

// --- Helpers ---
function detectType(val: unknown): ParsedField['detectedType'] {
  if (val === null || val === undefined) return 'null'
  if (Array.isArray(val)) return 'array'
  if (typeof val === 'object') return 'object'
  if (typeof val === 'number') return 'number'
  if (typeof val === 'boolean') return 'boolean'
  return 'string'
}

function castValue(raw: unknown, targetType: ParsedField['customType']): unknown {
  if (targetType === 'auto') return raw
  if (targetType === 'null') return null
  if (targetType === 'boolean') return raw === 'false' ? false : Boolean(raw)
  if (targetType === 'number') return Number(raw)
  if (targetType === 'string') return String(raw)
  if (targetType === 'array') {
    if (Array.isArray(raw)) return raw
    try {
      return JSON.parse(String(raw))
    } catch {
      return [raw]
    }
  }
  if (targetType === 'object') {
    if (typeof raw === 'object' && raw !== null) return raw
    try {
      return JSON.parse(String(raw))
    } catch {
      return { value: raw }
    }
  }
  return raw
}

// Convert all single-quoted strings to double-quoted, handling nested/array contexts
function normalizeSingleQuotes(s: string): string {
  let result = ''
  let i = 0
  while (i < s.length) {
    const ch = s[i]
    if (ch === '"') {
      result += ch
      i++
      while (i < s.length) {
        if (s[i] === '\\') {
          result += s[i]! + s[i + 1]!
          i += 2
          continue
        }
        if (s[i] === '"') {
          result += s[i]
          i++
          break
        }
        result += s[i]
        i++
      }
    } else if (ch === "'") {
      result += '"'
      i++
      while (i < s.length) {
        if (s[i] === '\\' && s[i + 1] === "'") {
          result += "'"
          i += 2
          continue
        }
        if (s[i] === '\\') {
          result += s[i]! + s[i + 1]!
          i += 2
          continue
        }
        if (s[i] === '"') {
          result += '\\"'
          i++
          continue
        }
        if (s[i] === "'") {
          result += '"'
          i++
          break
        }
        result += s[i]
        i++
      }
    } else {
      result += ch
      i++
    }
  }
  return result
}

function looseParse(text: string): Record<string, unknown> {
  let s = text.trim()
  s = s.replace(
    /^(?:console\.log|log|print|debug|info|warn|error)\s*\(\s*([\s\S]*)\s*\)\s*;?\s*$/,
    '$1',
  )
  if ((s.startsWith("'") && s.endsWith("'")) || (s.startsWith('"') && s.endsWith('"'))) {
    s = s.slice(1, -1)
  }
  s = normalizeSingleQuotes(s)
  s = s.replace(/([{,[]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)(\s*:)/g, '$1"$2"$3')
  s = s.replace(/:\s*undefined\b/g, ': null')
  s = s.replace(/:\s*NaN\b/g, ': null')
  s = s.replace(/:\s*Infinity\b/g, ': null')
  s = s.replace(/:\s*(\d{4}-\d{2}-\d{2}T[^\s,}\]]*)/g, ': "$1"')
  s = s.replace(/:\s*([A-Za-z][A-Za-z0-9_\-.]*)\b(?!\s*[:{])/g, (_, v) => {
    if (['true', 'false', 'null'].includes(v)) return `: ${v}`
    return `: "${v}"`
  })
  s = s.replace(/,\s*([}\]])/g, '$1')
  return JSON.parse(s) as Record<string, unknown>
}

// --- Tab: Parse ---
function resetParse() {
  inputText.value = ''
  parsedFields.value = []
  parseError.value = ''
}

function parseInput() {
  parseError.value = ''
  parsedFields.value = []
  const text = inputText.value.trim()
  if (!text) return
  try {
    const obj = looseParse(text)
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
      parseError.value = 'Input phải là một object (key-value pairs).'
      return
    }
    parsedFields.value = Object.entries(obj).map(([key, value]) => ({
      key,
      value,
      detectedType: detectType(value),
      customName: key,
      customType: 'auto',
    }))
  } catch (e) {
    parseError.value = `Không thể parse: ${(e as Error).message}`
  }
}

function removeField(index: number) {
  parsedFields.value.splice(index, 1)
}

// --- Tab: Generate ---
const generateFields = ref<{ name: string; type: FieldType | 'auto'; generatedValue: unknown }[]>([
  { name: 'id', type: 'number', generatedValue: null },
  { name: 'name', type: 'string', generatedValue: null },
  { name: 'email', type: 'string', generatedValue: null },
  { name: 'active', type: 'boolean', generatedValue: null },
])

function addGenerateField() {
  generateFields.value.push({
    name: `field${generateFields.value.length + 1}`,
    type: 'auto',
    generatedValue: null,
  })
}

function removeGenerateField(i: number) {
  generateFields.value.splice(i, 1)
}

function generateAll() {
  for (const f of generateFields.value) {
    f.generatedValue = generateRandom(f.name, f.type)
  }
}

function regenerateOne(f: { name: string; type: FieldType | 'auto'; generatedValue: unknown }) {
  f.generatedValue = generateRandom(f.name, f.type)
}

const generateOutput = computed(() => {
  const hasValues = generateFields.value.some((f) => f.generatedValue !== null)
  if (!hasValues) return ''
  const result: Record<string, unknown> = {}
  for (const f of generateFields.value) {
    if (f.name.trim()) result[f.name.trim()] = f.generatedValue
  }
  return JSON.stringify(result, null, 2)
})

// --- Shared output/copy ---
const { copy } = useClipboard()
const copiedParse = ref(false)
const copiedGen = ref(false)

async function copyParse() {
  await copy(parseJsonOutput.value)
  copiedParse.value = true
  setTimeout(() => {
    copiedParse.value = false
  }, 1500)
}

async function copyGen() {
  await copy(generateOutput.value)
  copiedGen.value = true
  setTimeout(() => {
    copiedGen.value = false
  }, 1500)
}

// --- Parse output ---
const parseJsonOutput = computed(() => {
  if (!parsedFields.value.length) return ''
  const result: Record<string, unknown> = {}
  for (const f of parsedFields.value) {
    const name = f.customName.trim() || f.key
    result[name] = castValue(f.value, f.customType)
  }
  return JSON.stringify(result, null, 2)
})

const TYPE_OPTIONS: (FieldType | 'auto')[] = [
  'auto',
  'string',
  'number',
  'boolean',
  'null',
  'array',
  'object',
]

const TYPE_BADGE: Record<string, string> = {
  string: 'bg-accent-sky/20 text-accent-sky',
  number: 'bg-accent-amber/20 text-accent-amber',
  boolean: 'bg-green-500/20 text-green-400',
  null: 'bg-text-dim/30 text-text-dim',
  array: 'bg-purple-500/20 text-purple-400',
  object: 'bg-accent-coral/20 text-accent-coral',
  unknown: 'bg-text-dim/30 text-text-dim',
  auto: 'bg-text-dim/20 text-text-secondary',
}
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body px-4 py-8">
    <div class="mx-auto max-w-5xl">
      <!-- Header -->
      <header class="mb-8 animate-fade-up">
        <h1 class="font-display text-4xl font-bold text-accent-coral sm:text-5xl">Object → JSON</h1>
        <p class="mt-2 text-text-secondary">
          Parse object/console.log sang JSON, hoặc định nghĩa fields và generate dữ liệu random theo
          tên & kiểu.
        </p>
        <RouterLink
          to="/"
          class="mt-4 inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
        >
          &larr; Về trang chủ
        </RouterLink>
      </header>

      <!-- Tabs -->
      <div class="mb-6 flex gap-1 border-b border-border-default animate-fade-up animate-delay-1">
        <button
          @click="activeTab = 'parse'"
          class="px-5 py-2 text-sm font-display font-semibold transition border-b-2 -mb-px"
          :class="
            activeTab === 'parse'
              ? 'border-accent-coral text-text-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          "
        >
          ① Parse Object
        </button>
        <button
          @click="activeTab = 'generate'"
          class="px-5 py-2 text-sm font-display font-semibold transition border-b-2 -mb-px"
          :class="
            activeTab === 'generate'
              ? 'border-accent-coral text-text-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          "
        >
          ② Generate Random
        </button>
      </div>

      <!-- ======= TAB: PARSE ======= -->
      <div v-show="activeTab === 'parse'" class="animate-fade-up animate-delay-2">
        <div class="grid gap-6 lg:grid-cols-2">
          <!-- Left: Input + Fields -->
          <div class="space-y-4">
            <div>
              <label class="mb-2 block font-display text-sm font-semibold text-text-primary">
                Dán log / object vào đây
              </label>
              <textarea
                v-model="inputText"
                rows="10"
                spellcheck="false"
                class="w-full border border-border-default bg-bg-surface px-4 py-3 font-mono text-sm text-text-primary placeholder-text-dim focus:border-accent-coral focus:outline-none resize-y"
                placeholder="console.log({ userId: 123, name: 'An', active: true })"
              />
            </div>

            <div
              v-if="parseError"
              class="border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400"
            >
              {{ parseError }}
            </div>

            <div class="flex gap-3">
              <button
                @click="parseInput"
                class="bg-accent-coral px-6 py-2 font-display text-sm font-semibold text-bg-deep transition hover:brightness-110"
              >
                Parse →
              </button>
              <button
                @click="resetParse"
                class="border border-border-default px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
              >
                Xóa
              </button>
            </div>

            <!-- Quick examples -->
            <div class="pt-1">
              <p class="text-xs text-text-dim mb-2 font-display">Ví dụ nhanh:</p>
              <div class="flex flex-wrap gap-2">
                <button
                  @click="
                    inputText = `{ userId: 123, name: 'Nguyen Van A', active: true, roles: ['admin', 'editor'], createdAt: 2024-01-15T08:30:00.000Z }`
                  "
                  class="text-xs border border-border-default px-3 py-1 text-text-dim hover:text-text-primary hover:border-accent-sky transition"
                >
                  User object
                </button>
                <button
                  @click="
                    inputText = `console.log({ method: 'POST', url: '/api/login', status: 200, duration: 142, body: undefined })`
                  "
                  class="text-xs border border-border-default px-3 py-1 text-text-dim hover:text-text-primary hover:border-accent-sky transition"
                >
                  console.log
                </button>
                <button
                  @click="
                    inputText = `{ id: 9, title: 'Sản phẩm mới', price: 99.9, inStock: true, tags: ['sale', 'hot'] }`
                  "
                  class="text-xs border border-border-default px-3 py-1 text-text-dim hover:text-text-primary hover:border-accent-sky transition"
                >
                  Product
                </button>
              </div>
            </div>

            <!-- Fields editor -->
            <div v-if="parsedFields.length" class="pt-2 space-y-2">
              <p
                class="text-xs font-display font-semibold text-text-secondary uppercase tracking-wider"
              >
                Chỉnh sửa fields
              </p>
              <div
                v-for="(field, i) in parsedFields"
                :key="i"
                class="border border-border-default bg-bg-surface px-3 py-2.5 flex items-center gap-2"
              >
                <span
                  class="shrink-0 rounded px-1.5 py-0.5 text-xs font-mono font-semibold"
                  :class="TYPE_BADGE[field.detectedType]"
                  >{{ field.detectedType }}</span
                >

                <input
                  v-model="field.customName"
                  class="flex-1 min-w-0 border border-border-default bg-bg-elevated px-2 py-1 font-mono text-xs text-text-primary focus:border-accent-coral focus:outline-none"
                  placeholder="key name"
                />

                <select
                  v-model="field.customType"
                  class="w-24 border border-border-default bg-bg-elevated px-1.5 py-1 text-xs text-text-primary focus:border-accent-coral focus:outline-none"
                >
                  <option v-for="t in TYPE_OPTIONS" :key="t" :value="t">{{ t }}</option>
                </select>

                <span
                  class="hidden sm:block font-mono text-xs text-text-dim truncate max-w-[80px]"
                  :title="JSON.stringify(field.value)"
                >
                  {{ JSON.stringify(field.value) }}
                </span>

                <button
                  @click="removeField(i)"
                  class="shrink-0 text-text-dim hover:text-red-400 transition text-base leading-none px-1"
                >
                  ×
                </button>
              </div>
            </div>
          </div>

          <!-- Right: JSON Output -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <p class="font-display text-sm font-semibold text-text-primary">JSON Output</p>
              <button
                v-if="parseJsonOutput"
                @click="copyParse"
                class="flex items-center gap-1.5 border px-3 py-1.5 text-xs font-display transition"
                :class="
                  copiedParse
                    ? 'border-green-500 text-green-400 bg-green-500/10'
                    : 'border-border-default text-text-secondary hover:border-accent-coral hover:text-text-primary'
                "
              >
                {{ copiedParse ? '✓ Copied!' : 'Copy' }}
              </button>
            </div>

            <div
              v-if="!parseJsonOutput"
              class="border border-dashed border-border-default bg-bg-surface flex items-center justify-center"
              style="min-height: 240px"
            >
              <p class="text-sm text-text-dim">Parse object để xem kết quả</p>
            </div>
            <pre
              v-else
              class="w-full overflow-auto border border-border-default bg-bg-surface px-4 py-4 font-mono text-sm text-text-primary leading-relaxed"
              style="max-height: 70vh"
              >{{ parseJsonOutput }}</pre
            >
          </div>
        </div>
      </div>

      <!-- ======= TAB: GENERATE ======= -->
      <div v-show="activeTab === 'generate'" class="animate-fade-up animate-delay-2">
        <div class="grid gap-6 lg:grid-cols-2">
          <!-- Left: Fields definition -->
          <div class="space-y-3">
            <p class="text-sm text-text-secondary">
              Thêm tên và kiểu cho từng field, sau đó nhấn
              <span class="text-accent-coral font-semibold">Generate</span> để tạo dữ liệu random
              thông minh theo tên.
            </p>

            <div class="space-y-2">
              <div
                v-for="(field, i) in generateFields"
                :key="i"
                class="border border-border-default bg-bg-surface px-3 py-2.5 flex items-center gap-2"
              >
                <!-- name input -->
                <input
                  v-model="field.name"
                  class="flex-1 min-w-0 border border-border-default bg-bg-elevated px-2 py-1.5 font-mono text-sm text-text-primary focus:border-accent-coral focus:outline-none"
                  placeholder="field name..."
                />

                <!-- type select -->
                <select
                  v-model="field.type"
                  class="w-28 border border-border-default bg-bg-elevated px-2 py-1.5 text-sm text-text-primary focus:border-accent-coral focus:outline-none"
                >
                  <option v-for="t in TYPE_OPTIONS" :key="t" :value="t">{{ t }}</option>
                </select>

                <!-- re-roll single -->
                <button
                  v-if="field.generatedValue !== null"
                  @click="regenerateOne(field)"
                  class="shrink-0 text-text-dim hover:text-accent-amber transition text-sm px-1"
                  title="Generate lại field này"
                >
                  ↻
                </button>

                <!-- remove -->
                <button
                  @click="removeGenerateField(i)"
                  class="shrink-0 text-text-dim hover:text-red-400 transition text-base leading-none px-1"
                >
                  ×
                </button>
              </div>
            </div>

            <div class="flex gap-3 pt-1">
              <button
                @click="addGenerateField"
                class="border border-border-default px-4 py-2 text-sm text-text-secondary transition hover:border-accent-sky hover:text-text-primary"
              >
                + Thêm field
              </button>
              <button
                @click="generateAll"
                class="bg-accent-coral px-6 py-2 font-display text-sm font-semibold text-bg-deep transition hover:brightness-110"
              >
                Generate →
              </button>
            </div>

            <!-- Quick presets -->
            <div class="pt-2">
              <p class="text-xs text-text-dim mb-2 font-display">Preset nhanh:</p>
              <div class="flex flex-wrap gap-2">
                <button
                  @click="
                    generateFields = [
                      { name: 'id', type: 'number', generatedValue: null },
                      { name: 'name', type: 'string', generatedValue: null },
                      { name: 'email', type: 'string', generatedValue: null },
                      { name: 'phone', type: 'string', generatedValue: null },
                      { name: 'active', type: 'boolean', generatedValue: null },
                      { name: 'createdAt', type: 'string', generatedValue: null },
                    ]
                  "
                  class="text-xs border border-border-default px-3 py-1 text-text-dim hover:text-text-primary hover:border-accent-sky transition"
                >
                  User
                </button>
                <button
                  @click="
                    generateFields = [
                      { name: 'id', type: 'number', generatedValue: null },
                      { name: 'title', type: 'string', generatedValue: null },
                      { name: 'price', type: 'number', generatedValue: null },
                      { name: 'inStock', type: 'boolean', generatedValue: null },
                      { name: 'tags', type: 'array', generatedValue: null },
                    ]
                  "
                  class="text-xs border border-border-default px-3 py-1 text-text-dim hover:text-text-primary hover:border-accent-sky transition"
                >
                  Product
                </button>
                <button
                  @click="
                    generateFields = [
                      { name: 'method', type: 'string', generatedValue: null },
                      { name: 'url', type: 'string', generatedValue: null },
                      { name: 'status', type: 'number', generatedValue: null },
                      { name: 'duration', type: 'number', generatedValue: null },
                      { name: 'token', type: 'string', generatedValue: null },
                    ]
                  "
                  class="text-xs border border-border-default px-3 py-1 text-text-dim hover:text-text-primary hover:border-accent-sky transition"
                >
                  API Request
                </button>
              </div>
            </div>
          </div>

          <!-- Right: Generated JSON output -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <p class="font-display text-sm font-semibold text-text-primary">JSON Output</p>
              <button
                v-if="generateOutput"
                @click="copyGen"
                class="flex items-center gap-1.5 border px-3 py-1.5 text-xs font-display transition"
                :class="
                  copiedGen
                    ? 'border-green-500 text-green-400 bg-green-500/10'
                    : 'border-border-default text-text-secondary hover:border-accent-coral hover:text-text-primary'
                "
              >
                {{ copiedGen ? '✓ Copied!' : 'Copy' }}
              </button>
            </div>

            <div
              v-if="!generateOutput"
              class="border border-dashed border-border-default bg-bg-surface flex items-center justify-center"
              style="min-height: 240px"
            >
              <p class="text-sm text-text-dim">Nhấn Generate để tạo dữ liệu</p>
            </div>
            <pre
              v-else
              class="w-full overflow-auto border border-border-default bg-bg-surface px-4 py-4 font-mono text-sm text-text-primary leading-relaxed"
              style="max-height: 70vh"
              >{{ generateOutput }}</pre
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
