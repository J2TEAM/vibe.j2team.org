<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useClipboard } from '@vueuse/core'

const regexInput = ref<string>('')
const testString = ref<string>('')
const activeFlags = ref<string[]>(['g'])
const regexError = ref<string | null>(null)
const shareCopied = ref<boolean>(false)

const activeTab = ref<string>('explanation')
const tabs = [
  { id: 'explanation', name: 'Giải thích' },
  { id: 'matches', name: 'Trùng khớp' },
  { id: 'steps', name: 'Các bước' },
  { id: 'graph', name: 'Đồ thị' },
  { id: 'performance', name: 'Hiệu suất' },
  { id: 'code', name: 'Mã nguồn' },
  { id: 'cheatsheet', name: 'Bảng tra cứu' },
]

const availableFlags = [
  { value: 'g', desc: 'Global (Tìm tất cả các khớp)' },
  { value: 'i', desc: 'Case Insensitive (Không phân biệt hoa/thường)' },
  { value: 'm', desc: 'Multiline (Đa dòng ^ và $)' },
  { value: 's', desc: 'DotAll (Dấu chấm khớp cả newline)' },
  { value: 'u', desc: 'Unicode (Xử lý chữ Unicode chính xác)' },
  { value: 'y', desc: 'Sticky (Khớp chính xác từ vị trí dính)' },
]

interface Example {
  name: string
  regex: string
  flags: string[]
  text: string
}

const examples: Record<string, Example> = {
  email: {
    name: 'Email cơ bản',
    regex: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
    flags: ['g', 'i'],
    text: 'Liên hệ qua test@example.com hoặc admin@vibe.vn',
  },
  url: {
    name: 'Đường dẫn URL',
    regex:
      'https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)',
    flags: ['g'],
    text: 'Ghé thăm https://vibe.j2team.org/docs và http://example.com/path?q=1',
  },
  ipv4: {
    name: 'Địa chỉ IPv4',
    regex:
      '^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$',
    flags: ['m'],
    text: 'Valid: 192.168.1.1\nInvalid: 256.0.0.1\nValid: 127.0.0.1',
  },
  phone: {
    name: 'Số điện thoại VN',
    regex: '(?<=\\s|^)(03|05|07|08|09)\\d{8}(?=\\s|$)',
    flags: ['g'],
    text: 'SĐT hợp lệ: 0912345678, 0334567890. Không hợp lệ: 01234567890.',
  },
  hex_color: {
    name: 'Mã màu Hex',
    regex: '#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})\\b',
    flags: ['g'],
    text: 'Các màu hợp lệ: #ffffff, #F00, 123456. Các màu lỗi: #ff, #1234567.',
  },
  html_tag: {
    name: 'Thẻ HTML',
    regex: '<(\\/?[a-z]+)[^>]*>',
    flags: ['g', 'i'],
    text: '<div class="alert">Đây là đoạn <b>bold</b>.</div>\n<br/>',
  },
  pwd: {
    name: 'Mật khẩu mạnh',
    regex: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$',
    flags: ['m'],
    text: 'Pass123! -> Khớp\nweakpass -> Không khớp (thiếu chữ hoa, số, ký tự đb)\nShort1! -> Không khớp (dưới 8 ký tự)',
  },
}
const selectedExample = ref<string>('')

interface Token {
  raw: string
  meaning: string
}

interface Step {
  desc: string
}

const matchHtml = ref<string>('')
const explanationTokens = ref<Token[]>([])
const simulatedSteps = ref<Step[]>([])
const perfTime = ref<number>(0)
const catastrophicWarning = ref<boolean>(false)

onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search)
  const r = urlParams.get('regex')
  const t = urlParams.get('text')

  if (r) regexInput.value = r
  if (t) testString.value = t

  if (r || t) analyzeRegex()
})

const analyzeRegex = () => {
  regexError.value = null
  matchHtml.value = testString.value || ''
  explanationTokens.value = []
  simulatedSteps.value = []
  catastrophicWarning.value = false

  if (!regexInput.value) return

  try {
    const flags = activeFlags.value.join('')
    const re = new RegExp(regexInput.value, flags)

    if (testString.value) {
      const cloneRe = new RegExp(regexInput.value, flags.includes('g') ? flags : flags + 'g')

      let match: RegExpExecArray | null = null
      let lastIndex = 0
      let safeHtml = ''

      while ((match = cloneRe.exec(testString.value)) !== null) {
        if (match[0].length === 0) {
          cloneRe.lastIndex++
          continue
        }
        const before = testString.value.substring(lastIndex, match.index)
        const matchedText = match[0]
        safeHtml += escapeHtml(before)
        safeHtml += `<span class="bg-accent-sky/30 border-b-2 border-accent-sky px-1 text-text-primary ml-[1px] mr-[1px] font-bold">${escapeHtml(matchedText)}</span>`
        lastIndex = match.index + match[0].length
      }
      safeHtml += escapeHtml(testString.value.substring(lastIndex))
      matchHtml.value = safeHtml
    }

    explainRegex(regexInput.value)
    simulateSteps(re, testString.value)

    // Check catastrophic backtracking explicitly
    const isCatastrophic = !!regexInput.value.match(/\([^)]+([+*])\)[+*]/)
    catastrophicWarning.value = isCatastrophic

    analyzePerformance(re, testString.value, isCatastrophic)
  } catch (e) {
    regexError.value = (e as Error).message
  }
}

const escapeHtml = (t: string) =>
  t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const explainRegex = (str: string) => {
  const tokens: Token[] = []
  let i = 0
  while (i < str.length) {
    const char = str[i]
    if (char === '\\') {
      const nextChar = str[i + 1]
      const ms: Record<string, string> = {
        d: 'chữ số [0-9]',
        D: 'không phải chữ số',
        w: 'chữ/số/gạch dưới [a-zA-Z0-9_]',
        W: 'không phải chữ/số',
        s: 'khoảng trắng (khoảng cách, tab, newline)',
        S: 'không phải khoảng trắng',
        b: 'ranh giới từ (word boundary)',
        B: 'không phải ranh giới từ',
        n: 'xuống dòng (newline)',
        t: 'dấu tab',
        r: 'carriage return',
      }
      if (nextChar && /[1-9]/.test(nextChar)) {
        tokens.push({
          raw: '\\' + nextChar,
          meaning: 'tham chiếu ngược (backreference) nhóm ' + nextChar,
        })
      } else if (nextChar) {
        tokens.push({
          raw: '\\' + nextChar,
          meaning: ms[nextChar] || 'ký tự đã thoát: ' + nextChar,
        })
      }
      i += 2
    } else if (char === '(스와)') {
      // Just a safeguard to skip parsing broken manually
      i++
    } else if (char && ['{', '['].includes(char)) {
      const cls = char === '{' ? '}' : ']'
      const endIndex = str.indexOf(cls, i)
      if (endIndex > -1) {
        let meaning =
          char === '{' ? 'định lượng lặp (quantifier)' : 'nhóm hoặc lớp ký tự (character class)'
        const content = str.substring(i + 1, endIndex)
        if (char === '[' && content.startsWith('^')) meaning = 'nhóm ký tự phủ định (negated set)'
        tokens.push({
          raw: str.substring(i, endIndex + 1),
          meaning: meaning,
        })
        i = endIndex + 1
      } else if (char) {
        tokens.push({ raw: char, meaning: 'nguyên văn: ' + char })
        i++
      } else {
        // Should not happen with valid loop range
        i++
      }
    } else if (char === '(') {
      if (str.substring(i, i + 3) === '(?:') {
        const endIndex = str.indexOf(')', i)
        if (endIndex > -1) {
          tokens.push({ raw: '(?:', meaning: 'bắt đầu nhóm không bắt giữ (non-capturing group)' })
          i += 3
          continue
        }
      } else if (str.substring(i, i + 3) === '(?=') {
        const endIndex = str.indexOf(')', i)
        if (endIndex > -1) {
          tokens.push({ raw: '(?=', meaning: 'tiên đoán dương (positive lookahead)' })
          i += 3
          continue
        }
      } else if (str.substring(i, i + 3) === '(?!') {
        const endIndex = str.indexOf(')', i)
        if (endIndex > -1) {
          tokens.push({ raw: '(?!', meaning: 'tiên đoán âm (negative lookahead)' })
          i += 3
          continue
        }
      } else if (str.substring(i, i + 4) === '(?<=') {
        const endIndex = str.indexOf(')', i)
        if (endIndex > -1) {
          tokens.push({ raw: '(?<=', meaning: 'hậu kiểm dương (positive lookbehind)' })
          i += 4
          continue
        }
      } else if (str.substring(i, i + 4) === '(?<!') {
        const endIndex = str.indexOf(')', i)
        if (endIndex > -1) {
          tokens.push({ raw: '(?<!', meaning: 'hậu kiểm âm (negative lookbehind)' })
          i += 4
          continue
        }
      }
      tokens.push({ raw: '(', meaning: 'bắt đầu nhóm bắt giữ (capturing group)' })
      i++
    } else {
      const ms: Record<string, string> = {
        '^': 'bắt đầu chuỗi/dòng',
        $: 'kết thúc chuỗi/dòng',
        '.': 'bất kỳ ký tự nào (trừ newline)',
        '+': '1 hoặc nhiều lần lặp (greedy)',
        '*': '0 hoặc nhiều lần lặp (greedy)',
        '?': 'tùy chọn (0 hoặc 1), hoặc lazy',
        ')': 'kết thúc nhóm',
        '|': 'hoặc (OR)',
      }
      if (char) {
        tokens.push({ raw: char, meaning: ms[char] || 'nguyên văn: ' + char })
      }
      i++
    }
  }
  explanationTokens.value = tokens
}

const simulateSteps = (re: RegExp, txt: string) => {
  const steps: Step[] = [
    { desc: `Bước 1: Khởi tạo Regex Engine với mẫu /${re.source}/${re.flags}` },
    { desc: `Bước 2: Quét chuỗi kiểm tra độ dài ${txt.length} ký tự` },
  ]

  try {
    const rx = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g')
    const matches: RegExpExecArray[] = []
    let mVar: RegExpExecArray | null = null
    while ((mVar = rx.exec(txt)) !== null) {
      matches.push(mVar)
      if (mVar[0].length === 0) rx.lastIndex++
    }

    if (matches.length > 0) {
      steps.push({ desc: `Bước 3: Tìm thấy ${matches.length} kết quả trùng khớp` })
      matches.forEach((m, idx) => {
        steps.push({ desc: `Kết quả ${idx + 1}: Tại index [${m.index}], khớp "${m[0]}"` })
        if (m.length > 1) {
          for (let j = 1; j < m.length; j++) {
            if (m[j] !== undefined) steps.push({ desc: `   Nhóm ${j}: "${m[j]}"` })
          }
        }
      })
    } else {
      steps.push({ desc: `Bước 3: Không tìm thấy kết quả trùng khớp nào` })
    }
  } catch {
    steps.push({ desc: `Bước 3: Đã xảy ra lỗi khi kiểm tra` })
  }

  steps.push({ desc: `Bước 4: Trả về kết quả và kết thúc` })
  simulatedSteps.value = steps
}

const analyzePerformance = (re: RegExp, txt: string, isCatastrophic: boolean) => {
  if (isCatastrophic) {
    perfTime.value = 9999.99 // Mock max time to avoid browser crash
    return
  }
  const start = performance.now()
  const iterations = 500000
  try {
    for (let i = 0; i < iterations; i++) {
      re.test(txt || 'test')
    }
  } catch {
    // Ignore error
  }
  perfTime.value = performance.now() - start
}

const clearAll = () => {
  regexInput.value = ''
  testString.value = ''
  activeFlags.value = ['g']
  analyzeRegex()
}

const loadExample = () => {
  const ex = examples[selectedExample.value]
  if (ex) {
    regexInput.value = ex.regex
    testString.value = ex.text
    activeFlags.value = ex.flags
    analyzeRegex()
  }
}

const { copy } = useClipboard()

const shareURL = () => {
  const url = new URL(window.location.href)
  url.searchParams.set('regex', encodeURIComponent(regexInput.value))
  url.searchParams.set('text', encodeURIComponent(testString.value))
  copy(url.toString())
  shareCopied.value = true
  setTimeout(() => (shareCopied.value = false), 2000)
}

const truncate = (s: string, l: number) => (s.length > l ? s.substring(0, l - 2) + '..' : s)
const getRectWidth = (raw: string) => Math.max(45, truncate(raw, 10).length * 9)
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
<template>
  <div
    class="min-h-screen bg-bg-deep text-text-primary font-body p-4 md:p-8 flex flex-col relative overflow-hidden"
  >
    <!-- Noise overlay & Issue Badge -->
    <div
      class="absolute top-3 right-4 bg-accent-coral text-bg-deep font-display font-bold text-xs tracking-widest px-3 py-1.5 rotate-3 z-10 shadow-lg"
    >
      VOL.01 / 2026
    </div>

    <header
      class="mb-8 flex flex-col md:flex-row md:items-start justify-between gap-4 relative z-10 mt-6"
    >
      <div class="animate-fade-up">
        <h1
          class="font-display text-4xl sm:text-5xl font-bold flex items-center gap-3 text-text-primary"
        >
          <span class="text-accent-coral">//</span> Regex Visualizer
        </h1>
        <p class="text-text-secondary mt-2 text-lg">
          Trực quan hóa và debug Biểu thức Chính quy (Regular Expressions)
        </p>
      </div>

      <div class="flex items-center gap-2 flex-wrap text-sm animate-fade-up animate-delay-1">
        <RouterLink
          to="/"
          class="px-4 py-2 bg-bg-surface hover:bg-bg-elevated transition-colors border border-border-default hover:border-accent-coral flex items-center gap-2 font-display"
        >
          &larr; Quay lại
        </RouterLink>
        <RouterLink
          to="/content-policy"
          class="px-3 py-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          Chính sách
        </RouterLink>
        <a
          href="https://github.com/J2TEAM/vibe.j2team.org"
          target="_blank"
          rel="noopener noreferrer"
          class="px-3 py-2 text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1"
        >
          GitHub <span class="text-xs">↗</span>
        </a>
      </div>
    </header>

    <!-- Dot Divider -->
    <div
      class="flex gap-1.5 mb-8 animate-fade-up animate-delay-2 overflow-hidden"
      aria-hidden="true"
    >
      <span v-for="n in 60" :key="n" class="w-1 h-1 rounded-full bg-border-default flex-shrink-0" />
    </div>

    <main
      class="flex-1 grid grid-cols-1 lg:grid-cols-10 gap-6 relative z-10 max-w-7xl mx-auto w-full animate-fade-up animate-delay-3 mb-10"
    >
      <!-- Left Panel (30%) -->
      <section class="lg:col-span-3 flex flex-col gap-6">
        <div
          class="bg-bg-surface border border-border-default p-6 flex flex-col gap-5 transition-all duration-300 hover:border-accent-coral relative"
        >
          <!-- Background Number -->
          <span
            class="absolute top-2 right-4 font-display text-6xl font-bold text-accent-amber/5 select-none pointer-events-none"
          >
            01
          </span>

          <div>
            <label class="block text-sm font-display font-medium text-text-secondary mb-2"
              >Biểu thức (Regex)</label
            >
            <div
              class="flex bg-bg-deep border border-border-default p-1 focus-within:border-accent-sky transition-all group"
            >
              <span class="px-3 py-2 text-accent-sky font-mono select-none">/</span>
              <input
                v-model="regexInput"
                type="text"
                placeholder="^\d{3}-\d{2}-\d{4}$"
                class="flex-1 bg-transparent border-none outline-none text-text-primary font-mono py-2 w-full placeholder:text-text-dim"
                @input="analyzeRegex"
              />
              <span class="px-3 py-2 text-accent-sky font-mono select-none">/</span>
            </div>
            <div
              v-if="regexError"
              class="mt-2 text-xs text-red-400 break-all p-2 bg-red-900/10 border border-red-900/30"
            >
              {{ regexError }}
            </div>
          </div>

          <div>
            <label class="block text-sm font-display font-medium text-text-secondary mb-3"
              >Cờ (Flags)</label
            >
            <div class="flex flex-wrap gap-4">
              <label
                v-for="flag in availableFlags"
                :key="flag.value"
                class="flex items-center gap-2 cursor-pointer group"
                :title="flag.desc"
              >
                <input
                  type="checkbox"
                  v-model="activeFlags"
                  :value="flag.value"
                  class="w-4 h-4 rounded-none border-border-default text-accent-sky bg-bg-deep focus:ring-accent-sky focus:ring-1"
                  @change="analyzeRegex"
                />
                <span
                  class="text-sm text-text-primary font-mono group-hover:text-accent-sky transition-colors relative"
                  >{{ flag.value }}
                  <span
                    class="absolute -top-8 left-1/2 -translate-x-1/2 bg-bg-surface border border-border-default text-text-primary text-xs px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity font-body z-20"
                    >{{ flag.desc }}</span
                  >
                </span>
              </label>
            </div>
          </div>

          <div>
            <label class="block text-sm font-display font-medium text-text-secondary mb-2"
              >Chuỗi Kiểm tra (Test String)</label
            >
            <textarea
              v-model="testString"
              rows="5"
              class="w-full bg-bg-deep border border-border-default p-3 text-text-primary font-mono text-sm focus:border-accent-amber outline-none transition-all resize-none placeholder:text-text-dim"
              placeholder="Nhập chuỗi cần kiểm tra..."
              @input="analyzeRegex"
            ></textarea>
          </div>

          <div class="flex flex-wrap gap-3 mt-2">
            <button
              @click="analyzeRegex"
              class="px-5 py-2.5 bg-accent-coral hover:bg-opacity-90 text-bg-deep text-sm font-bold font-display transition-colors flex-1 shadow-[4px_4px_0px_#FFA07A] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#FFA07A]"
            >
              P H Â N T Í C H
            </button>
            <button
              @click="clearAll"
              class="px-5 py-2.5 bg-bg-surface hover:bg-bg-elevated border border-border-default text-text-primary text-sm font-body transition-colors hover:border-accent-coral"
            >
              XÓA HẾT
            </button>
          </div>

          <div class="flex flex-wrap gap-2 pt-2 border-t border-border-default">
            <select
              v-model="selectedExample"
              @change="loadExample"
              class="flex-1 bg-bg-deep border border-border-default px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-sky transition-colors appearance-none"
            >
              <option value="" disabled selected>Tải Ví dụ...</option>
              <option v-for="(ex, key) in examples" :key="key" :value="key">{{ ex.name }}</option>
            </select>
            <button
              @click="shareURL"
              class="px-4 py-2 bg-bg-surface hover:bg-bg-elevated text-text-primary border border-border-default text-sm transition-colors hover:border-accent-sky"
              title="Chia sẻ URL"
            >
              CHIA SẺ
            </button>
          </div>

          <div
            v-if="shareCopied"
            class="text-xs text-accent-sky text-center font-display tracking-widest uppercase mt-1"
          >
            Đã chép URL vào clipboard!
          </div>
        </div>
      </section>

      <!-- Right Panel (70%) -->
      <section
        class="lg:col-span-7 flex flex-col bg-bg-surface border border-border-default overflow-hidden min-h-[550px] transition-all duration-300 hover:border-accent-amber relative"
      >
        <span
          class="absolute top-2 right-4 font-display text-4xl font-bold text-accent-coral/5 select-none pointer-events-none z-0"
        >
          02
        </span>
        <!-- Tabs -->
        <div
          class="flex overflow-x-auto border-b border-border-default bg-bg-deep/50 no-scrollbar relative z-10"
        >
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            class="px-5 py-4 text-sm font-display font-medium whitespace-nowrap transition-colors border-b-2"
            :class="
              activeTab === tab.id
                ? 'border-accent-amber text-accent-amber bg-bg-elevated'
                : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-bg-surface/50'
            "
          >
            {{ tab.name.toUpperCase() }}
          </button>
        </div>

        <!-- Tab Content -->
        <div class="p-6 flex-1 overflow-y-auto relative z-10">
          <!-- Explanation Tab -->
          <div v-if="activeTab === 'explanation'" class="space-y-4 animate-fade-up">
            <div v-if="!regexInput" class="text-text-dim text-center py-16 font-display text-lg">
              Vui lòng nhập regex để xem giải thích chi tiết.
            </div>
            <div v-else class="overflow-hidden border border-border-default">
              <table class="w-full text-sm text-left">
                <thead
                  class="bg-bg-deep text-text-secondary border-b border-border-default font-display uppercase tracking-wider text-xs"
                >
                  <tr>
                    <th class="px-4 py-4 font-semibold">Ký hiệu (Token)</th>
                    <th class="px-4 py-4 font-semibold">Ý nghĩa (Meaning)</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-border-default">
                  <tr
                    v-for="(token, i) in explanationTokens"
                    :key="i"
                    class="hover:bg-bg-elevated transition-colors"
                  >
                    <td
                      class="px-4 py-3 font-mono text-accent-sky bg-bg-deep/30 font-bold whitespace-nowrap border-r border-border-default w-[30%]"
                    >
                      {{ token.raw }}
                    </td>
                    <td class="px-4 py-3 text-text-primary">{{ token.meaning }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Matches Tab -->
          <div v-if="activeTab === 'matches'" class="space-y-4 animate-fade-up">
            <h3
              class="font-display text-lg font-semibold text-text-primary flex items-center gap-2 mb-4"
            >
              <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
              Kết quả Trùng khớp
            </h3>
            <div
              class="bg-bg-deep border border-border-default p-5 font-mono text-sm leading-[1.8] whitespace-pre-wrap word-break-all text-text-primary min-h-[200px] shadow-inner"
            >
              <span v-if="matchHtml" v-html="matchHtml"></span>
              <span v-else class="text-text-dim italic">Không tìm thấy kết quả khớp nào.</span>
            </div>
          </div>

          <!-- Steps Tab -->
          <div v-if="activeTab === 'steps'" class="space-y-4 animate-fade-up">
            <h3
              class="font-display text-lg font-semibold text-text-primary flex items-center gap-2 mb-6"
            >
              <span class="text-accent-amber font-display text-sm tracking-widest">//</span>
              Mô phỏng Engine
            </h3>
            <div
              v-if="!regexInput || !testString"
              class="text-text-dim text-center py-10 font-display"
            >
              Vui lòng cung cấp regex và chuỗi kiểm tra.
            </div>
            <div v-else class="relative border-l-2 border-border-default ml-4 space-y-8 pb-4">
              <div v-for="(step, i) in simulatedSteps" :key="i" class="relative pl-8">
                <div
                  class="absolute w-4 h-4 bg-bg-deep border-[3px] border-accent-amber rounded-full -left-[9px] top-1"
                ></div>
                <div
                  class="bg-bg-surface border border-border-default p-4 hover:-translate-y-1 transition-transform duration-300 hover:border-accent-amber hover:shadow-lg hover:shadow-accent-amber/5"
                >
                  <span
                    class="text-xs font-bold text-accent-amber mb-2 block font-display tracking-wider uppercase"
                    >Bước {{ i + 1 }}</span
                  >
                  <p class="text-sm text-text-primary font-body">{{ step.desc }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Graph Tab -->
          <div v-if="activeTab === 'graph'" class="space-y-4 flex flex-col h-full animate-fade-up">
            <h3
              class="font-display text-lg font-semibold text-text-primary flex items-center gap-2 mb-2"
            >
              <span class="text-accent-sky font-display text-sm tracking-widest">//</span>
              Sơ đồ
            </h3>
            <div v-if="!regexInput" class="text-text-dim text-center py-16 font-display">
              Nhập regex để xem sơ đồ đồ thị.
            </div>
            <div
              v-else
              class="flex-1 bg-bg-deep border border-border-default p-4 overflow-auto min-h-[300px] relative"
            >
              <div
                class="absolute inset-0 bg-[linear-gradient(rgba(42,53,73,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(42,53,73,0.3)_1px,transparent_1px)] bg-[size:20px_20px]"
              ></div>
              <svg
                :width="explanationTokens.length * 150 + 200"
                height="100%"
                class="min-w-[600px] min-h-[200px] relative z-10 m-auto"
              >
                <g transform="translate(40, 100)">
                  <circle
                    cx="0"
                    cy="0"
                    r="16"
                    fill="#0F1923"
                    stroke="#38BDF8"
                    stroke-width="2"
                    class="opacity-90"
                  />
                  <text
                    x="0"
                    y="5"
                    text-anchor="middle"
                    fill="#38BDF8"
                    font-size="10"
                    font-family="monospace"
                  >
                    start
                  </text>

                  <g v-for="(token, i) in explanationTokens" :key="'graph-' + i">
                    <!-- Edge -->
                    <line
                      :x1="Number(i) * 150 + 20"
                      cy1="0"
                      :x2="Number(i) * 150 + 150 - 40"
                      cy2="0"
                      stroke="#4A6180"
                      stroke-width="2"
                      marker-end="url(#arrowhead)"
                    />
                    <!-- Node -->
                    <rect
                      :x="Number(i) * 150 + 110 - getRectWidth(token.raw) / 2"
                      y="-18"
                      :width="getRectWidth(token.raw)"
                      height="36"
                      rx="4"
                      fill="#162232"
                      stroke="#FF6B4A"
                      stroke-width="1.5"
                      class="hover:fill-[#1E2F42] hover:stroke-[#FFB830] transition-colors cursor-pointer"
                    />
                    <text
                      :x="Number(i) * 150 + 110"
                      y="4"
                      text-anchor="middle"
                      fill="#F0EDE6"
                      font-size="13"
                      font-family="monospace"
                      font-weight="bold"
                    >
                      {{ truncate(token.raw, 10) }}
                    </text>
                  </g>

                  <line
                    :x1="explanationTokens.length * 150 - 20"
                    cy1="0"
                    :x2="explanationTokens.length * 150 + 40"
                    cy2="0"
                    stroke="#4A6180"
                    stroke-width="2"
                    marker-end="url(#arrowhead)"
                  />
                  <circle
                    :cx="explanationTokens.length * 150 + 60"
                    cy="0"
                    r="16"
                    fill="#0F1923"
                    stroke="#38BDF8"
                    stroke-width="2"
                    class="opacity-90"
                  />
                  <text
                    :x="explanationTokens.length * 150 + 60"
                    y="25"
                    text-anchor="middle"
                    fill="#38BDF8"
                    font-size="10"
                    font-family="monospace"
                  >
                    end
                  </text>
                </g>
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3.5, 0 7" fill="#4A6180" />
                  </marker>
                </defs>
              </svg>
            </div>
          </div>

          <!-- Performance Tab -->
          <div v-if="activeTab === 'performance'" class="space-y-6 animate-fade-up">
            <h3
              class="font-display text-lg font-semibold text-text-primary flex items-center gap-2 mb-2"
            >
              <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
              Đánh giá Hiệu năng (500,000 Loop)
            </h3>
            <div v-if="!regexInput" class="text-text-dim text-center py-10 font-display">
              Nhập regex để phân tích hiệu suất.
            </div>
            <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div
                class="bg-bg-deep border border-border-default p-6 hover:-translate-y-1 transition-all duration-300 hover:border-accent-sky"
              >
                <h4
                  class="font-display text-sm font-bold text-text-secondary mb-3 uppercase tracking-wider"
                >
                  Thời gian Thực thi
                </h4>
                <div class="flex items-end gap-2">
                  <span class="text-4xl font-bold text-accent-sky font-display">
                    {{ perfTime.toFixed(2) }}
                  </span>
                  <span class="text-text-dim font-mono mb-1">ms</span>
                </div>
              </div>

              <div
                class="bg-bg-deep border border-border-default p-6 hover:-translate-y-1 transition-all duration-300 hover:border-accent-coral"
              >
                <div v-if="catastrophicWarning">
                  <h4
                    class="font-display text-sm font-bold text-red-400 mb-2 uppercase tracking-wider"
                  >
                    ⚠ Cảnh báo: Catastrophic backtracking
                  </h4>
                  <p class="text-sm text-text-secondary">
                    Pattern chứa lượng từ lồng nhau gây nguy hiểm lặp vô hạn, ví dụ:
                    <code>(a+)+</code>. Hãy tối ưu lại biểu thức này.
                  </p>
                </div>
                <div v-else>
                  <h4
                    class="font-display text-sm font-bold text-emerald-400 mb-2 uppercase tracking-wider"
                  >
                    ✓ Biểu thức An toàn
                  </h4>
                  <p class="text-sm text-text-secondary">
                    Biểu thức tĩnh, thời gian khớp tuyến tính.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Code Tab -->
          <div v-if="activeTab === 'code'" class="space-y-4 animate-fade-up">
            <h3
              class="font-display text-lg font-semibold text-text-primary flex items-center gap-2 mb-4"
            >
              <span class="text-accent-sky font-display text-sm tracking-widest">//</span>
              Mã nguồn Tích hợp
            </h3>
            <div v-if="!regexInput" class="text-text-dim text-center py-10 font-display">
              Nhập regex để tạo sinh mã nguồn.
            </div>
            <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <!-- JavaScript -->
              <div
                class="bg-bg-deep border border-border-default p-5 group hover:border-accent-amber transition-colors"
              >
                <div class="flex items-center justify-between mb-3">
                  <h4
                    class="font-display text-sm font-bold text-accent-amber uppercase tracking-wider"
                  >
                    JavaScript / TypeScript
                  </h4>
                </div>
                <pre
                  class="text-sm font-mono text-text-primary overflow-x-auto whitespace-pre-wrap"
                ><code class="language-js">const pattern = /{{ regexInput }}/{{ activeFlags.join('') }};
const str = "{{ testString.replace(/\n/g, '\\n').replace(/"/g, '\\"') || 'text' }}";

// Match
const matches = str.match(pattern);
console.log(matches);

// Test
const isValid = pattern.test(str);
console.log(isValid);</code></pre>
              </div>

              <!-- Python -->
              <div
                class="bg-bg-deep border border-border-default p-5 group hover:border-accent-sky transition-colors"
              >
                <div class="flex items-center justify-between mb-3">
                  <h4
                    class="font-display text-sm font-bold text-accent-sky uppercase tracking-wider"
                  >
                    Python
                  </h4>
                </div>
                <pre
                  class="text-sm font-mono text-text-primary overflow-x-auto whitespace-pre-wrap"
                ><code class="language-python">import re

pattern = re.compile(r'{{ regexInput }}'{{ activeFlags.includes('i') ? ', re.IGNORECASE' : '' }})
text = "{{ testString.replace(/\n/g, '\\n').replace(/"/g, '\\"') || 'text' }}"

# Match
matches = pattern.findall(text)
print(matches)

# Test
is_valid = bool(pattern.search(text))
print(is_valid)</code></pre>
              </div>

              <!-- PHP -->
              <div
                class="bg-bg-deep border border-border-default p-5 group hover:border-[#8892bf] transition-colors"
              >
                <div class="flex items-center justify-between mb-3">
                  <h4
                    class="font-display text-sm font-bold text-[#8892bf] uppercase tracking-wider"
                  >
                    PHP
                  </h4>
                </div>
                <pre
                  class="text-sm font-mono text-text-primary overflow-x-auto whitespace-pre-wrap"
                ><code class="language-php">$pattern = '/{{ regexInput.replace(/\//g, '\\/') }}/{{ activeFlags.join('') }}';
$str = "{{ testString.replace(/\n/g, '\\n').replace(/"/g, '\\"') || 'text' }}";

// Match
preg_match_all($pattern, $str, $matches);
print_r($matches[0]);

// Test
$isValid = preg_match($pattern, $str);
var_dump((bool)$isValid);</code></pre>
              </div>

              <!-- Go -->
              <div
                class="bg-bg-deep border border-border-default p-5 group hover:border-[#00ADD8] transition-colors"
              >
                <div class="flex items-center justify-between mb-3">
                  <h4
                    class="font-display text-sm font-bold text-[#00ADD8] uppercase tracking-wider"
                  >
                    Go
                  </h4>
                </div>
                <pre
                  class="text-sm font-mono text-text-primary overflow-x-auto whitespace-pre-wrap"
                ><code class="language-go">package main

import (
	"fmt"
	"regexp"
)

func main() {
	pattern := regexp.MustCompile(`{{ activeFlags.includes('i') ? '(?i)' : '' }}{{ regexInput }}`)
	str := "{{ testString.replace(/\n/g, '\\n').replace(/"/g, '\\"') || 'text' }}"

	// Match
	matches := pattern.FindAllString(str, -1)
	fmt.Println(matches)

	// Test
	isValid := pattern.MatchString(str)
	fmt.Println(isValid)
}</code></pre>
              </div>
            </div>
          </div>

          <!-- Cheat Sheet Tab -->
          <div v-if="activeTab === 'cheatsheet'" class="animate-fade-up">
            <h3
              class="font-display text-lg font-semibold text-text-primary flex items-center gap-2 mb-6"
            >
              <span class="text-accent-amber font-display text-sm tracking-widest">//</span>
              Bảng tra cứu Mật mã
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <!-- Bộ ký tự cơ bản -->
              <div class="bg-bg-deep border border-border-default overflow-hidden flex flex-col">
                <h4
                  class="px-5 py-3 font-display font-bold text-sm bg-bg-surface border-b border-border-default text-accent-sky"
                >
                  KÝ TỰ & LỚP (CLASSES)
                </h4>
                <ul class="divide-y divide-border-default p-0 text-sm font-body flex-1">
                  <li
                    class="px-5 py-2.5 flex justify-between hover:bg-bg-surface transition-colors cursor-default"
                  >
                    <code
                      class="text-accent-coral font-bold font-mono px-2 py-0.5 bg-bg-surface border border-border-default"
                      >\d</code
                    >
                    <span class="text-text-secondary text-right">Chữ số [0-9]</span>
                  </li>
                  <li
                    class="px-5 py-2.5 flex justify-between hover:bg-bg-surface transition-colors cursor-default"
                  >
                    <code
                      class="text-accent-coral font-bold font-mono px-2 py-0.5 bg-bg-surface border border-border-default"
                      >\D</code
                    >
                    <span class="text-text-secondary text-right">Không phải chữ số</span>
                  </li>
                  <li
                    class="px-5 py-2.5 flex justify-between hover:bg-bg-surface transition-colors cursor-default"
                  >
                    <code
                      class="text-accent-coral font-bold font-mono px-2 py-0.5 bg-bg-surface border border-border-default"
                      >\w</code
                    >
                    <span class="text-text-secondary text-right">Chữ/số/gạch dưới</span>
                  </li>
                  <li
                    class="px-5 py-2.5 flex justify-between hover:bg-bg-surface transition-colors cursor-default"
                  >
                    <code
                      class="text-accent-coral font-bold font-mono px-2 py-0.5 bg-bg-surface border border-border-default"
                      >\W</code
                    >
                    <span class="text-text-secondary text-right">Không phải \w</span>
                  </li>
                  <li
                    class="px-5 py-2.5 flex justify-between hover:bg-bg-surface transition-colors cursor-default"
                  >
                    <code
                      class="text-accent-coral font-bold font-mono px-2 py-0.5 bg-bg-surface border border-border-default"
                      >\s</code
                    >
                    <span class="text-text-secondary text-right"
                      >Khoảng trắng (Space, Tab, \n)</span
                    >
                  </li>
                  <li
                    class="px-5 py-2.5 flex justify-between hover:bg-bg-surface transition-colors cursor-default"
                  >
                    <code
                      class="text-accent-coral font-bold font-mono px-2 py-0.5 bg-bg-surface border border-border-default"
                      >\S</code
                    >
                    <span class="text-text-secondary text-right">Không phải khoảng trắng</span>
                  </li>
                  <li
                    class="px-5 py-2.5 flex justify-between hover:bg-bg-surface transition-colors cursor-default"
                  >
                    <code
                      class="text-accent-coral font-bold font-mono px-2 py-0.5 bg-bg-surface border border-border-default"
                      >.</code
                    >
                    <span class="text-text-secondary text-right">Bất kỳ (trừ \n)</span>
                  </li>
                  <li
                    class="px-5 py-2.5 flex justify-between hover:bg-bg-surface transition-colors cursor-default"
                  >
                    <code
                      class="text-accent-coral font-bold font-mono px-2 py-0.5 bg-bg-surface border border-border-default"
                      >[abc]</code
                    >
                    <span class="text-text-secondary text-right">Một trong (a, b, c)</span>
                  </li>
                  <li
                    class="px-5 py-2.5 flex justify-between hover:bg-bg-surface transition-colors cursor-default"
                  >
                    <code
                      class="text-accent-coral font-bold font-mono px-2 py-0.5 bg-bg-surface border border-border-default"
                      >[^abc]</code
                    >
                    <span class="text-text-secondary text-right">Khác (a, b, c)</span>
                  </li>
                  <li
                    class="px-5 py-2.5 flex justify-between hover:bg-bg-surface transition-colors cursor-default"
                  >
                    <code
                      class="text-accent-coral font-bold font-mono px-2 py-0.5 bg-bg-surface border border-border-default"
                      >[a-z]</code
                    >
                    <span class="text-text-secondary text-right">Khoảng từ a đến z</span>
                  </li>
                </ul>
              </div>

              <!-- Định lượng -->
              <div class="bg-bg-deep border border-border-default overflow-hidden flex flex-col">
                <h4
                  class="px-5 py-3 font-display font-bold text-sm bg-bg-surface border-b border-border-default text-accent-amber"
                >
                  ĐỊNH LƯỢNG (QUANTIFIERS)
                </h4>
                <ul class="divide-y divide-border-default p-0 text-sm font-body flex-1">
                  <li
                    class="px-5 py-2.5 flex justify-between hover:bg-bg-surface transition-colors cursor-default"
                  >
                    <code
                      class="text-accent-amber font-bold font-mono px-2 py-0.5 bg-bg-surface border border-border-default"
                      >+</code
                    >
                    <span class="text-text-secondary text-right">1 hoặc nhiều (Greedy)</span>
                  </li>
                  <li
                    class="px-5 py-2.5 flex justify-between hover:bg-bg-surface transition-colors cursor-default"
                  >
                    <code
                      class="text-accent-amber font-bold font-mono px-2 py-0.5 bg-bg-surface border border-border-default"
                      >*</code
                    >
                    <span class="text-text-secondary text-right">0 hoặc nhiều (Greedy)</span>
                  </li>
                  <li
                    class="px-5 py-2.5 flex justify-between hover:bg-bg-surface transition-colors cursor-default"
                  >
                    <code
                      class="text-accent-amber font-bold font-mono px-2 py-0.5 bg-bg-surface border border-border-default"
                      >?</code
                    >
                    <span class="text-text-secondary text-right">0 hoặc 1 (Tùy chọn)</span>
                  </li>
                  <li
                    class="px-5 py-2.5 flex justify-between hover:bg-bg-surface transition-colors cursor-default"
                  >
                    <code
                      class="text-accent-amber font-bold font-mono px-2 py-0.5 bg-bg-surface border border-border-default"
                      >{n}</code
                    >
                    <span class="text-text-secondary text-right">Đúng n lần</span>
                  </li>
                  <li
                    class="px-5 py-2.5 flex justify-between hover:bg-bg-surface transition-colors cursor-default"
                  >
                    <code
                      class="text-accent-amber font-bold font-mono px-2 py-0.5 bg-bg-surface border border-border-default"
                      >{n,}</code
                    >
                    <span class="text-text-secondary text-right">Lớn hơn hoặc bằng n lần</span>
                  </li>
                  <li
                    class="px-5 py-2.5 flex justify-between hover:bg-bg-surface transition-colors cursor-default"
                  >
                    <code
                      class="text-accent-amber font-bold font-mono px-2 py-0.5 bg-bg-surface border border-border-default"
                      >{n,m}</code
                    >
                    <span class="text-text-secondary text-right">Từ n đến m lần</span>
                  </li>
                  <li
                    class="px-5 py-2.5 flex justify-between hover:bg-bg-surface transition-colors cursor-default"
                  >
                    <code
                      class="text-accent-amber font-bold font-mono px-2 py-0.5 bg-bg-surface border border-border-default"
                      >+?</code
                    >
                    <span class="text-text-secondary text-right">1 hoặc nhiều (Lazy)</span>
                  </li>
                  <li
                    class="px-5 py-2.5 flex justify-between hover:bg-bg-surface transition-colors cursor-default"
                  >
                    <code
                      class="text-accent-amber font-bold font-mono px-2 py-0.5 bg-bg-surface border border-border-default"
                      >*?</code
                    >
                    <span class="text-text-secondary text-right">0 hoặc nhiều (Lazy)</span>
                  </li>
                </ul>
              </div>

              <!-- Nhóm và Biên -->
              <div class="bg-bg-deep border border-border-default overflow-hidden flex flex-col">
                <h4
                  class="px-5 py-3 font-display font-bold text-sm bg-bg-surface border-b border-border-default text-[#8892bf]"
                >
                  BIÊN & NHÓM (ANCHORS & GROUPS)
                </h4>
                <ul class="divide-y divide-border-default p-0 text-sm font-body flex-1">
                  <li
                    class="px-5 py-2.5 flex justify-between hover:bg-bg-surface transition-colors cursor-default"
                  >
                    <code
                      class="text-[#8892bf] font-bold font-mono px-2 py-0.5 bg-bg-surface border border-border-default"
                      >^</code
                    >
                    <span class="text-text-secondary text-right">Bắt đầu chuỗi/dòng</span>
                  </li>
                  <li
                    class="px-5 py-2.5 flex justify-between hover:bg-bg-surface transition-colors cursor-default"
                  >
                    <code
                      class="text-[#8892bf] font-bold font-mono px-2 py-0.5 bg-bg-surface border border-border-default"
                      >$</code
                    >
                    <span class="text-text-secondary text-right">Kết thúc chuỗi/dòng</span>
                  </li>
                  <li
                    class="px-5 py-2.5 flex justify-between hover:bg-bg-surface transition-colors cursor-default"
                  >
                    <code
                      class="text-[#8892bf] font-bold font-mono px-2 py-0.5 bg-bg-surface border border-border-default"
                      >\b</code
                    >
                    <span class="text-text-secondary text-right">Ranh giới từ (Word boundary)</span>
                  </li>
                  <li
                    class="px-5 py-2.5 flex justify-between hover:bg-bg-surface transition-colors cursor-default"
                  >
                    <code
                      class="text-[#8892bf] font-bold font-mono px-2 py-0.5 bg-bg-surface border border-border-default"
                      >\B</code
                    >
                    <span class="text-text-secondary text-right">Không phải ranh giới từ</span>
                  </li>
                  <li
                    class="px-5 py-2.5 flex justify-between hover:bg-bg-surface transition-colors cursor-default"
                  >
                    <code
                      class="text-[#8892bf] font-bold font-mono px-2 py-0.5 bg-bg-surface border border-border-default"
                      >(abc)</code
                    >
                    <span class="text-text-secondary text-right">Nhóm bắt giữ (Capture)</span>
                  </li>
                  <li
                    class="px-5 py-2.5 flex justify-between hover:bg-bg-surface transition-colors cursor-default"
                  >
                    <code
                      class="text-[#8892bf] font-bold font-mono px-2 py-0.5 bg-bg-surface border border-border-default"
                      >(?:abc)</code
                    >
                    <span class="text-text-secondary text-right"
                      >Nhóm không bắt giữ (Non-capture)</span
                    >
                  </li>
                  <li
                    class="px-5 py-2.5 flex justify-between hover:bg-bg-surface transition-colors cursor-default"
                  >
                    <code
                      class="text-[#8892bf] font-bold font-mono px-2 py-0.5 bg-bg-surface border border-border-default"
                      >\1</code
                    >
                    <span class="text-text-secondary text-right"
                      >Tham chiếu ngược nhóm 1 (Backref)</span
                    >
                  </li>
                  <li
                    class="px-5 py-2.5 flex justify-between hover:bg-bg-surface transition-colors cursor-default"
                  >
                    <code
                      class="text-[#8892bf] font-bold font-mono px-2 py-0.5 bg-bg-surface border border-border-default"
                      >a|b</code
                    >
                    <span class="text-text-secondary text-right">a Hoặc b (Alternation)</span>
                  </li>
                </ul>
              </div>

              <!-- Tiên đoán / Hậu kiểm -->
              <div
                class="bg-bg-deep border border-border-default overflow-hidden flex flex-col md:col-span-2 lg:col-span-3"
              >
                <h4
                  class="px-5 py-3 font-display font-bold text-sm bg-bg-surface border-b border-border-default text-accent-coral"
                >
                  TIÊN ĐOÁN / HẬU KIỂM (LOOKAROUND)
                </h4>
                <ul
                  class="divide-y divide-border-default p-0 text-sm font-body flex-1 grid grid-cols-1 md:grid-cols-2"
                >
                  <li
                    class="px-5 py-2.5 flex justify-between hover:bg-bg-surface transition-colors cursor-default"
                  >
                    <code
                      class="text-accent-coral font-bold font-mono px-2 py-0.5 bg-bg-surface border border-border-default"
                      >(?=abc)</code
                    >
                    <span class="text-text-secondary text-right"
                      >Tiên đoán dương: Theo sau bởi 'abc'</span
                    >
                  </li>
                  <li
                    class="px-5 py-2.5 flex justify-between hover:bg-bg-surface transition-colors cursor-default"
                  >
                    <code
                      class="text-accent-coral font-bold font-mono px-2 py-0.5 bg-bg-surface border border-border-default"
                      >(?!abc)</code
                    >
                    <span class="text-text-secondary text-right"
                      >Tiên đoán âm: Không theo sau bởi 'abc'</span
                    >
                  </li>
                  <li
                    class="px-5 py-2.5 flex justify-between hover:bg-bg-surface transition-colors cursor-default border-r border-border-default"
                  >
                    <code
                      class="text-accent-coral font-bold font-mono px-2 py-0.5 bg-bg-surface border border-border-default"
                      >(?&lt;=abc)</code
                    >
                    <span class="text-text-secondary text-right"
                      >Hậu kiểm dương: Đứng trước là 'abc'</span
                    >
                  </li>
                  <li
                    class="px-5 py-2.5 flex justify-between hover:bg-bg-surface transition-colors cursor-default"
                  >
                    <code
                      class="text-accent-coral font-bold font-mono px-2 py-0.5 bg-bg-surface border border-border-default"
                      >(?&lt;!abc)</code
                    >
                    <span class="text-text-secondary text-right"
                      >Hậu kiểm âm: Không đứng trước là 'abc'</span
                    >
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>
