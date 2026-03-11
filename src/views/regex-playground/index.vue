<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col items-center px-4">
    <!-- Header -->
    <header class="w-full max-w-5xl mx-auto flex items-center justify-between py-6">
      <a
        href="/"
        class="flex items-center gap-2 text-text-dim hover:text-accent-coral transition-colors font-display text-xs tracking-wider"
      >
        <Icon icon="ph:arrow-left-bold" width="16" />
        <span>J2TEAM</span>
      </a>
      <div class="font-display text-3xl font-bold text-text-primary">
        <span class="text-text-dim">/</span>regex<span class="text-accent-coral">playground</span>
        <span class="text-accent-coral animate-pulse">_</span>
      </div>
      <div class="flex items-center gap-2 text-xs font-display tracking-wide text-text-dim">
        <span class="rx-dot" :class="statusClass"></span>
        <span class="uppercase">{{ statusText }}</span>
      </div>
    </header>

    <main class="w-full max-w-5xl mx-auto flex flex-col gap-6 pb-16">
      <!-- Pattern Input -->
      <section
        class="border border-border-default bg-bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5"
      >
        <h2
          class="font-display text-lg font-semibold text-text-primary mb-4 flex items-center gap-3"
        >
          <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
          PATTERN
        </h2>
        <div
          class="flex items-center bg-bg-deep border border-border-default transition-colors focus-within:border-accent-coral focus-within:ring-1 focus-within:ring-accent-coral"
        >
          <span class="px-4 py-3 text-text-dim text-xl font-bold select-none shrink-0">/</span>
          <input
            v-model="pattern"
            class="flex-1 bg-transparent border-none outline-none font-mono text-lg text-accent-coral placeholder:text-text-dim/50 py-3 min-w-0"
            placeholder="([a-z]+)\d+"
            spellcheck="false"
            autocomplete="off"
          />
          <span class="px-4 py-3 text-text-dim text-xl font-bold select-none shrink-0">/</span>
          <div class="flex gap-1 p-1.5 border-l border-border-default shrink-0">
            <button
              v-for="flag in allFlags"
              :key="flag.char"
              class="w-8 h-8 flex items-center justify-center border border-border-default text-text-dim font-mono text-sm font-semibold cursor-pointer transition-all hover:text-text-primary hover:border-text-primary"
              :class="{
                'bg-accent-coral text-bg-deep border-accent-coral hover:text-bg-deep hover:border-accent-coral':
                  flags.includes(flag.char),
              }"
              :title="flag.label"
              @click="toggleFlag(flag.char)"
            >
              {{ flag.char }}
            </button>
          </div>
        </div>

        <!-- Error -->
        <div
          v-if="regexError"
          class="flex items-center gap-2 mt-3 text-sm text-accent-coral font-body"
        >
          <Icon icon="ph:warning-circle-bold" width="16" />
          {{ regexError }}
        </div>

        <!-- Presets -->
        <div class="flex items-center gap-2 mt-4 flex-wrap">
          <span class="text-sm text-text-dim font-display shrink-0 tracking-wide uppercase"
            >Presets:</span
          >
          <button
            v-for="p in presets"
            :key="p.label"
            class="px-3 py-1 border border-border-default text-text-dim font-mono text-xs cursor-pointer transition-all hover:border-accent-amber hover:text-accent-amber hover:bg-accent-amber/5"
            @click="applyPreset(p)"
          >
            {{ p.label }}
          </button>
        </div>

        <!-- Code Snippets -->
        <div class="mt-8 pt-6 border-t border-border-default">
          <div class="flex items-center justify-between mb-3">
            <h3
              class="font-display text-sm font-semibold text-text-secondary flex items-center gap-2"
            >
              <Icon icon="ph:code" width="16" />
              SNIPPETS
            </h3>
            <div class="flex gap-1 border border-border-default p-1 bg-bg-deep rounded-sm">
              <button
                v-for="lang in ['JS', 'TS', 'React', 'Vue'] as const"
                :key="lang"
                class="px-3 py-1 text-[11px] font-display font-semibold transition-colors cursor-pointer"
                :class="
                  activeSnippetTab === lang
                    ? 'bg-bg-elevated text-text-primary shadow-sm'
                    : 'text-text-dim hover:text-text-secondary'
                "
                @click="activeSnippetTab = lang"
              >
                {{ lang }}
              </button>
            </div>
          </div>

          <div class="relative group">
            <pre
              class="bg-bg-deep border border-border-default p-4 font-mono text-xs text-text-primary overflow-x-auto leading-relaxed h-[180px] custom-scrollbar focus-within:border-accent-sky transition-colors"
            ><code>{{ codeSnippets[activeSnippetTab] }}</code></pre>

            <button
              @click="copySnippet"
              class="absolute top-3 right-3 p-1.5 flex items-center justify-center border transition-all"
              :class="
                snippetStatus === 'copied'
                  ? 'bg-accent-sky/10 border-accent-sky text-accent-sky'
                  : 'bg-bg-surface border-border-default text-text-dim hover:text-text-primary hover:border-text-primary'
              "
              :title="snippetStatus === 'copied' ? 'Copied!' : 'Copy to clipboard'"
            >
              <Icon :icon="snippetStatus === 'copied' ? 'ph:check-bold' : 'ph:copy'" width="16" />
            </button>
          </div>
        </div>
      </section>

      <!-- Two column layout -->
      <div class="grid gap-6 md:grid-cols-2 mt-6">
        <!-- Test String -->
        <section
          class="border border-border-default bg-bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5 flex flex-col"
        >
          <div class="flex items-center justify-between mb-4">
            <h2
              class="font-display text-lg font-semibold text-text-primary flex items-center gap-3"
            >
              <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
              TEST STRING
            </h2>
            <span
              class="bg-accent-coral text-bg-deep text-xs font-bold px-2 py-0.5 tracking-wide"
              v-if="matches.length"
              >{{ matches.length }} MATCH{{ matches.length > 1 ? 'ES' : '' }}</span
            >
          </div>
          <div
            class="relative h-64 border border-border-default bg-bg-deep focus-within:border-accent-coral transition-colors flex-1"
          >
            <!-- Highlight layer -->
            <div
              class="absolute inset-0 w-full h-full font-mono text-base leading-relaxed p-4 box-border whitespace-pre-wrap break-words overflow-auto text-transparent pointer-events-none select-none z-[1]"
              aria-hidden="true"
              v-html="highlightedHtml"
            ></div>
            <!-- Editable textarea -->
            <textarea
              v-model="testString"
              class="absolute inset-0 w-full h-full font-mono text-base leading-relaxed p-4 box-border whitespace-pre-wrap break-words overflow-auto bg-transparent border-none outline-none text-text-primary caret-accent-coral resize-none z-[2] placeholder:text-text-dim/40"
              placeholder="Nhập văn bản cần kiểm tra..."
              spellcheck="false"
              @scroll="syncScroll"
              ref="textareaRef"
            ></textarea>
          </div>
        </section>

        <!-- Results panel -->
        <section
          class="border border-border-default bg-bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5 flex flex-col max-h-[400px]"
        >
          <h2
            class="font-display text-lg font-semibold text-text-primary mb-4 flex items-center gap-3 shrink-0"
          >
            <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
            RESULTS
          </h2>

          <div class="overflow-y-auto flex-1 pr-2 custom-scrollbar">
            <div
              v-if="!compiledRegex"
              class="h-full flex flex-col items-center justify-center gap-3 p-8 text-text-dim text-sm font-display"
            >
              <Icon icon="ph:terminal-window" width="32" />
              <p>Nhập pattern để bắt đầu</p>
            </div>

            <div
              v-else-if="matches.length === 0 && testString"
              class="h-full flex flex-col items-center justify-center gap-3 p-8 text-accent-coral/70 text-sm font-display"
            >
              <Icon icon="ph:x-circle" width="32" />
              <p>NO MATCHES FOUND</p>
            </div>

            <div v-else class="flex flex-col gap-3">
              <div
                v-for="(match, i) in matches"
                :key="i"
                class="bg-bg-deep border border-border-default border-l-4 p-3 text-sm"
                :style="{ '--accent': matchColors[i % matchColors.length] }"
              >
                <div class="flex items-center justify-between mb-2">
                  <span
                    class="font-display text-xs font-bold tracking-wider"
                    :style="{ color: 'var(--accent)' }"
                    >MATCH #{{ i + 1 }}</span
                  >
                  <span class="text-xs text-text-dim"
                    >index {{ match.index }}–{{ match.index + match[0].length }}</span
                  >
                </div>
                <div class="flex items-baseline gap-2 mb-1">
                  <span class="text-xs text-text-dim font-display shrink-0">FULL:</span>
                  <code
                    class="text-text-primary text-sm break-all font-mono"
                    :style="{ color: 'var(--accent)' }"
                    >{{ match[0] || '(empty)' }}</code
                  >
                </div>
                <div
                  v-if="match.length > 1"
                  class="flex flex-col gap-1 pl-3 border-l border-border-default mt-2"
                >
                  <div
                    v-for="(group, gi) in match.slice(1)"
                    :key="gi"
                    class="flex items-baseline gap-2"
                  >
                    <span class="text-xs text-text-dim font-display shrink-0">
                      Group {{ gi + 1 }}
                      <span v-if="namedGroups[i]?.[gi]" class="text-accent-sky text-[10px]"
                        >«{{ namedGroups[i][gi] }}»</span
                      >
                    </span>
                    <code class="text-text-primary text-sm break-all font-mono">{{
                      group ?? 'undefined'
                    }}</code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- Explanation -->
      <section
        class="border border-border-default bg-bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5"
        v-if="explanation.length"
      >
        <h2
          class="font-display text-lg font-semibold text-text-primary mb-4 flex items-center gap-3"
        >
          <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
          EXPLANATION
        </h2>
        <div class="flex flex-wrap gap-2">
          <div
            v-for="(part, i) in explanation"
            :key="i"
            class="flex items-center gap-2 bg-bg-deep border border-border-default px-3 py-1.5 transition-colors hover:border-accent-amber"
          >
            <code class="text-accent-amber text-sm font-semibold shrink-0 font-mono">{{
              part.token
            }}</code>
            <span class="text-text-dim text-xs font-display">{{ part.desc }}</span>
          </div>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer
      class="w-full max-w-5xl mx-auto text-center py-6 text-xs text-text-dim font-display tracking-widest border-t border-border-default mt-auto"
    >
      <span>vibe.j2team.org</span>
      <span class="mx-2">·</span>
      <span
        >by
        <a
          href="https://nguyenquocanh.io.vn/"
          target="_blank"
          rel="noopener noreferrer"
          class="hover:text-accent-coral transition-colors underline decoration-border-default hover:decoration-accent-coral underline-offset-4"
          >Nguyễn Quốc Anh</a
        ></span
      >
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Icon } from '@iconify/vue'

// ─── State ───────────────────────────────────────────────────────────────────
const pattern = ref('(\\w+)@(\\w+\\.\\w+)')
const flags = ref('g')
const testString = ref('Liên hệ: hello@j2team.dev hoặc support@example.com để được hỗ trợ.')
const regexError = ref('')
const textareaRef = ref<HTMLTextAreaElement | null>(null)

const allFlags = [
  { char: 'g', label: 'Global — tìm tất cả' },
  { char: 'i', label: 'Case-insensitive' },
  { char: 'm', label: 'Multiline' },
  { char: 's', label: 'Dotall (. khớp \\n)' },
]

const matchColors = ['#FF6B4A', '#FFB830', '#38BDF8', '#F0EDE6']

// ─── Presets ─────────────────────────────────────────────────────────────────
const presets = [
  {
    label: 'Email',
    pattern: '[\\w.+-]+@[\\w-]+\\.[a-z]{2,}',
    flags: 'gi',
    test: 'Gửi tới user@domain.com và admin@example.org nhé.',
  },
  {
    label: 'URL',
    pattern: 'https?:\\/\\/[\\w./?=#&%-]+',
    flags: 'g',
    test: 'Truy cập https://j2team.dev hoặc http://example.com/path?q=1',
  },
  {
    label: 'Số điện thoại VN',
    pattern: '(0|\\+84)(3|5|7|8|9)\\d{8}',
    flags: 'g',
    test: 'Gọi cho tôi: 0912345678 hoặc +84987654321',
  },
  {
    label: 'Hashtag',
    pattern: '#[\\wÀ-ỹ]+',
    flags: 'g',
    test: 'Bài viết về #JavaScript và #LậpTrình hôm nay.',
  },
  {
    label: 'IPv4',
    pattern: '\\b(\\d{1,3}\\.){3}\\d{1,3}\\b',
    flags: 'g',
    test: 'Server IP: 192.168.1.1 và 10.0.0.254',
  },
  {
    label: 'Hex color',
    pattern: '#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\\b',
    flags: 'g',
    test: 'Màu sắc: #fff, #1a2b3c, #FF5733 và invalid #GGGGGG',
  },
]

function applyPreset(p: (typeof presets)[0]) {
  pattern.value = p.pattern
  flags.value = p.flags
  testString.value = p.test
}

// ─── Compiled Regex ───────────────────────────────────────────────────────────
const compiledRegex = computed<RegExp | null>(() => {
  if (!pattern.value) return null
  try {
    return new RegExp(pattern.value, flags.value)
  } catch {
    return null
  }
})

watch(
  [pattern, flags],
  () => {
    if (!pattern.value) {
      regexError.value = ''
      return
    }
    try {
      new RegExp(pattern.value, flags.value)
      regexError.value = ''
    } catch (e: unknown) {
      if (e instanceof Error) {
        regexError.value = e.message
      } else {
        regexError.value = 'Lỗi cú pháp'
      }
    }
  },
  { immediate: true },
)

// ─── Snippets ─────────────────────────────────────────────────────────────────
type SnippetLang = 'JS' | 'TS' | 'React' | 'Vue'
const activeSnippetTab = ref<SnippetLang>('JS')
const snippetStatus = ref<'idle' | 'copied'>('idle')

const getJSCode = (p: string, f: string) => `// Vanilla JavaScript
const regex = /${p}/${f};
const str = \`${testString.value.replace(/`/g, '\\`')}\`;

// Test if it matches
const isMatch = regex.test(str);
console.log('Match exists:', isMatch);

// Get all matches
const matches = [...str.matchAll(regex)];
matches.forEach((match, index) => {
  console.log(\`Match \${index}: \${match[0]}\`);
});`

const getTSCode = (p: string, f: string) => `// TypeScript
const regex: RegExp = /${p}/${f};
const str: string = \`${testString.value.replace(/`/g, '\\`')}\`;

const isMatch: boolean = regex.test(str);
console.log('Match exists:', isMatch);

const matches: RegExpMatchArray[] = Array.from(str.matchAll(regex));
matches.forEach((match: RegExpMatchArray, index: number) => {
  console.log(\`Match \${index}: \${match[0]}\`);
});`

const getReactCode = (p: string, f: string) => `// React Component (TSX)
import React, { useMemo } from 'react';

export function RegexHighlighter({ text }: { text: string }) {
  const regex = useMemo(() => /${p}/${f}, []);
  
  // Example of finding matches and splitting text
  const parts = useMemo(() => {
    // Note: this implementation depends on your specific regex needs
    const matches = Array.from(text.matchAll(regex));
    return matches.length > 0 ? \`Found \${matches.length} matches\` : 'No match';
  }, [text, regex]);

  return (
    <div className="regex-result">
      {parts}
    </div>
  );
}`

const getVueCode = (p: string, f: string) =>
  `<!-- Vue Component (SFC) -->
<scr` +
  `ipt setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ text: string }>()
const regex = /${p}/${f}

const matches = computed(() => {
  return Array.from(props.text.matchAll(regex))
})
</scr` +
  `ipt>

<templ` +
  `ate>
  <div class="match-results">
    <p v-if="matches.length === 0">No matches found</p>
    <ul v-else>
      <li v-for="(match, i) in matches" :key="i">
        Match {{ i }}: {{ match[0] }}
      </li>
    </ul>
  </div>
</templ` +
  `ate>`

const codeSnippets = computed<Record<SnippetLang, string>>(() => {
  // Fallbacks if input is somehow invalid to render in string templates
  const safePattern = pattern.value || '(?:)'
  const safeFlags = flags.value || ''

  return {
    JS: getJSCode(safePattern, safeFlags),
    TS: getTSCode(safePattern, safeFlags),
    React: getReactCode(safePattern, safeFlags),
    Vue: getVueCode(safePattern, safeFlags),
  }
})

async function copySnippet() {
  if (snippetStatus.value === 'copied') return
  try {
    const textToCopy = codeSnippets.value[activeSnippetTab.value]
    await navigator.clipboard.writeText(textToCopy)
    snippetStatus.value = 'copied'
    setTimeout(() => {
      snippetStatus.value = 'idle'
    }, 2000)
  } catch (err) {
    console.error('Failed to copy regex code snippet:', err)
  }
}

// ─── Matches ──────────────────────────────────────────────────────────────────
const matches = computed<RegExpExecArray[]>(() => {
  if (!compiledRegex.value || !testString.value) return []
  const result: RegExpExecArray[] = []
  const re = new RegExp(
    compiledRegex.value.source,
    compiledRegex.value.flags.includes('g')
      ? compiledRegex.value.flags
      : compiledRegex.value.flags + 'g',
  )
  let m: RegExpExecArray | null
  let safety = 0
  while ((m = re.exec(testString.value)) !== null && safety++ < 200) {
    result.push(m)
    if (!re.global) break
    if (m[0].length === 0) re.lastIndex++
  }
  return result
})

// ─── Named Groups ─────────────────────────────────────────────────────────────
const namedGroups = computed(() => {
  return matches.value.map((m) => {
    if (!m.groups) return {}
    const names = Object.keys(m.groups)
    const byIndex: Record<number, string> = {}
    names.forEach((name, ni) => {
      byIndex[ni] = name
    })
    return byIndex
  })
})

// ─── Status ───────────────────────────────────────────────────────────────────
const statusClass = computed(() => {
  if (regexError.value) return 'error'
  if (!compiledRegex.value) return 'idle'
  if (matches.value.length) return 'match'
  return 'miss'
})
const statusText = computed(() => {
  if (regexError.value) return 'Lỗi cú pháp'
  if (!compiledRegex.value) return 'Sẵn sàng'
  if (matches.value.length) return `${matches.value.length} match`
  return 'Không khớp'
})

// ─── Highlight ────────────────────────────────────────────────────────────────
const highlightedHtml = computed(() => {
  if (!compiledRegex.value || matches.value.length === 0) {
    return escapeHtml(testString.value)
  }
  let result = ''
  let lastIndex = 0
  const src = testString.value
  matches.value.forEach((m, i) => {
    const color = matchColors[i % matchColors.length]
    result += escapeHtml(src.slice(lastIndex, m.index))
    result += `<mark style="background-color: color-mix(in srgb, ${color} 25%, transparent); border-bottom: 2px solid ${color}; border-radius: 2px; color: transparent;" class="rx-hl">${escapeHtml(m[0])}</mark>`
    lastIndex = m.index + m[0].length
  })
  result += escapeHtml(src.slice(lastIndex))
  return result
})

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// ─── Sync scroll ──────────────────────────────────────────────────────────────
function syncScroll(e: Event) {
  const ta = e.target as HTMLTextAreaElement
  const hl = ta.previousElementSibling as HTMLElement
  if (hl) {
    hl.scrollTop = ta.scrollTop
    hl.scrollLeft = ta.scrollLeft
  }
}

// ─── Flags toggle ─────────────────────────────────────────────────────────────
function toggleFlag(f: string) {
  if (flags.value.includes(f)) {
    flags.value = flags.value.replace(f, '')
  } else {
    flags.value += f
  }
}

// ─── Pattern Explanation ─────────────────────────────────────────────────────
const TOKENS: [RegExp, (m: RegExpMatchArray) => string][] = [
  [/^\(\?<([^>]+)>/, (m) => `Named group «${m[1]}»`],
  [/^\((?!\?)/, () => 'Mở capturing group'],
  [/^\(?:/, () => 'Non-capturing group'],
  [/^\(?=/, () => 'Positive lookahead'],
  [/^\(?!/, () => 'Negative lookahead'],
  [/^\(?<=/, () => 'Positive lookbehind'],
  [/^\(?<!/, () => 'Negative lookbehind'],
  [/^\)/, () => 'Đóng group'],
  [/^\[(\^?)([^\]]+)\]/, (m) => `Character class${m[1] ? ' (phủ định)' : ''}: ${m[2]}`],
  [/^\\d/, () => '\\d — chữ số [0-9]'],
  [/^\\D/, () => '\\D — không phải chữ số'],
  [/^\\w/, () => '\\w — ký tự từ [a-zA-Z0-9_]'],
  [/^\\W/, () => '\\W — không phải ký tự từ'],
  [/^\\s/, () => '\\s — khoảng trắng'],
  [/^\\S/, () => '\\S — không phải khoảng trắng'],
  [/^\\b/, () => '\\b — word boundary'],
  [/^\\n/, () => '\\n — xuống dòng'],
  [/^\\t/, () => '\\t — tab'],
  [/^\\\(/, () => '\\( — ký tự ( (escaped)'],
  [/^\\\)/, () => '\\) — ký tự ) (escaped)'],
  [/^\\\./, () => '\\. — ký tự . (escaped)'],
  [/^\\([^dDwWsSbBntr])/, (m) => `\\ — escaped ký tự: ${m[1]}`],
  [/^\^/, () => '^ — đầu chuỗi/dòng'],
  [/^\$/, () => '$ — cuối chuỗi/dòng'],
  [/^\./, () => '. — bất kỳ ký tự nào (trừ \\n)'],
  [/^\{(\d+),(\d+)\}/, (m) => `{${m[1]},${m[2]}} — lặp từ ${m[1]} đến ${m[2]} lần`],
  [/^\{(\d+),\}/, (m) => `{${m[1]},} — lặp ít nhất ${m[1]} lần`],
  [/^\{(\d+)\}/, (m) => `{${m[1]}} — lặp đúng ${m[1]} lần`],
  [/^\*\?/, () => '*? — 0 hoặc nhiều lần (lazy)'],
  [/^\+\?/, () => '+? — 1 hoặc nhiều lần (lazy)'],
  [/^\?\?/, () => '?? — 0 hoặc 1 lần (lazy)'],
  [/^\*/, () => '* — 0 hoặc nhiều lần (greedy)'],
  [/^\+/, () => '+ — 1 hoặc nhiều lần (greedy)'],
  [/^\?/, () => '? — 0 hoặc 1 lần (optional)'],
  [/^\|/, () => '| — hoặc (alternation)'],
  [/^[a-zA-Z0-9]/, (m) => `"${m[0]}" — ký tự literal`],
  [/^./, (m) => `"${m[0]}" — ký tự literal`],
]

const explanation = computed<{ token: string; desc: string }[]>(() => {
  if (!pattern.value) return []
  const result: { token: string; desc: string }[] = []
  let src = pattern.value
  let safety = 0
  while (src.length > 0 && safety++ < 100) {
    let matched = false
    for (const [re, fn] of TOKENS) {
      const m = src.match(re)
      if (m) {
        result.push({ token: m[0], desc: fn(m) })
        src = src.slice(m[0].length)
        matched = true
        break
      }
    }
    if (!matched) {
      src = src.slice(1)
    }
  }
  return result
})
</script>
