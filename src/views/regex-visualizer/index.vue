
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'

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
  { id: 'cheatsheet', name: 'Bảng tra cứu' },
]

const availableFlags = [
  { value: 'g' },
  { value: 'i' },
  { value: 'm' },
  { value: 'u' }
]

interface Example {
  name: string
  regex: string
  flags: string[]
  text: string
}

const examples: Record<string, Example> = {
  email: { name: 'Email', regex: '^\\S+@\\S+\\.\\S+$', flags: ['g', 'i'], text: 'test@example.com' },
  url: { name: 'Đường dẫn URL', regex: '^https?:\\/\\/\\S+$', flags: ['g'], text: 'https://vibe.j2team.org' },
  ipv4: { name: 'Địa chỉ IPv4', regex: '^\\d{1,3}(\\.\\d{1,3}){3}$', flags: [], text: '192.168.1.1' },
  phone: { name: 'Số điện thoại', regex: '^\\+?\\d{10,14}$', flags: ['g'], text: '+84123456789' }
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
      let result = testString.value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      const cloneRe = new RegExp(regexInput.value, flags.includes('g') ? flags : flags + 'g')

      let match;
      let lastIndex = 0;
      let safeHtml = '';

      while ((match = cloneRe.exec(testString.value)) !== null) {
        if(match[0].length === 0) { cloneRe.lastIndex++; continue; }
        const before = testString.value.substring(lastIndex, match.index)
        const matchedText = match[0]
        safeHtml += escapeHtml(before)
        safeHtml += `<span class="bg-[#38bdf8]/30 rounded px-1 text-white">${escapeHtml(matchedText)}</span>`
        lastIndex = match.index + match[0].length
      }
      safeHtml += escapeHtml(testString.value.substring(lastIndex))
      matchHtml.value = safeHtml
    }

    explainRegex(regexInput.value)
    simulateSteps()
    analyzePerformance(re, testString.value)

    // Check catastrophic backtracking explicitly
    if (regexInput.value.match(/\([^)]+([+*])\)[+*]/)) {
      catastrophicWarning.value = true
    }

  } catch (e) {
    regexError.value = e.message
  }
}

const escapeHtml = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

const explainRegex = (str) => {
  const tokens = []
  let i = 0
  while (i < str.length) {
    let char = str[i]
    if (char === '\\') {
      const ms = { 'd': 'khớp chữ số', 'w': 'khớp chữ/số', 's': 'khớp khoảng trắng' }
      tokens.push({ raw: '\\' + str[i+1], meaning: ms[str[i+1]] || 'ký tự đã thoát (escaped)' })
      i += 2
    } else if (['{', '['].includes(char)) {
      const cls = char === '{' ? '}' : ']'
      const endIndex = str.indexOf(cls, i)
      if(endIndex > -1) {
        tokens.push({ raw: str.substring(i, endIndex+1), meaning: char === '{' ? 'nhiều lần lặp' : 'nhóm ký tự' })
        i = endIndex + 1
      } else { tokens.push({ raw: char, meaning: 'nguyên văn: ' + char }); i++ }
    } else {
      const ms = { '^': 'bắt đầu chuỗi', '$': 'kết thúc chuỗi', '.': 'bất kỳ ký tự nào', '+': '1 hoặc nhiều lần lặp', '*': '0 hoặc nhiều lần lặp', '?': 'tùy chọn (0 hoặc 1)', '(': 'bắt đầu nhóm', ')': 'kết thúc nhóm' }
      tokens.push({ raw: char, meaning: ms[char] || 'nguyên văn: ' + char })
      i++
    }
  }
  explanationTokens.value = tokens
}

const simulateSteps = () => {
  simulatedSteps.value = [
    { desc: 'Bước 1: Regex Engine bắt đầu từ index 0' },
    { desc: 'Bước 2: Đối chiếu token với ký tự' },
    { desc: 'Bước 3: Di chuyển đến index tiếp theo (nếu tiếp tục)' }
  ]
}

const analyzePerformance = (re, txt) => {
  const start = performance.now()
  try {
    for (let i = 0; i < 50; i++) {
      re.test(txt || 'test')
    }
  } catch (e) {}
  perfTime.value = performance.now() - start
}

const clearAll = () => {
  regexInput.value = ''; testString.value = ''; activeFlags.value = ['g']
  analyzeRegex()
}

const loadExample = () => {
  const ex = examples[selectedExample.value]
  if (ex) {
    regexInput.value = ex.regex; testString.value = ex.text; activeFlags.value = ex.flags
    analyzeRegex()
  }
}

const shareURL = () => {
  const url = new URL(window.location.href)
  url.searchParams.set('regex', encodeURIComponent(regexInput.value))
  url.searchParams.set('text', encodeURIComponent(testString.value))
  navigator.clipboard.writeText(url.toString())
  shareCopied.value = true; setTimeout(() => shareCopied.value = false, 2000)
}

const truncate = (s, l) => s.length > l ? s.substring(0, l-2) + '..' : s
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
<template>
  <div class="min-h-screen bg-[#0f172a] text-[#e5e7eb] font-sans p-4 md:p-8 flex flex-col">
    <header class="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold flex items-center gap-2">
          Công cụ Trực quan hóa Regex
        </h1>
        <p class="text-gray-400 mt-1">Trực quan hóa và debug Biểu thức Chính quy (Regular Expressions)</p>
      </div>

      <div class="flex items-center gap-2 flex-wrap text-sm">
        <RouterLink to="/" class="px-4 py-2 bg-[#1f2937] hover:bg-slate-700 rounded-xl transition-colors border border-slate-700 flex items-center gap-2">
          &larr; Quay lại Trang chủ
        </RouterLink>
        <RouterLink to="/content-policy" class="px-3 py-2 text-slate-400 hover:text-slate-200 transition-colors">
          Chính sách nội dung
        </RouterLink>
        <a href="https://github.com/j2team/vibe" target="_blank" class="px-3 py-2 text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1">
          GitHub <span class="text-xs">↗</span>
        </a>
      </div>
    </header>

    <main class="flex-1 grid grid-cols-1 lg:grid-cols-10 gap-6">
      <!-- Left Panel (30%) -->
      <section class="lg:col-span-3 flex flex-col gap-6 ">
        <div class="bg-[#111827] rounded-xl shadow border border-[#1f2937] p-4 flex flex-col gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-400 mb-1">Biểu thức (Regex)</label>
            <div class="flex bg-[#0f172a] rounded-lg border border-[#1f2937] p-1 focus-within:border-[#38bdf8] transition-all">
              <span class="px-3 py-2 text-[#38bdf8] font-mono select-none">/</span>
              <input
                v-model="regexInput"
                type="text"
                placeholder="^\d{3}-\d{2}-\d{4}$"
                class="flex-1 bg-transparent border-none outline-none text-[#e5e7eb] font-mono py-2 w-full"
                @input="analyzeRegex"
              />
              <span class="px-3 py-2 text-[#38bdf8] font-mono select-none">/</span>
            </div>
            <div v-if="regexError" class="mt-2 text-xs text-red-400 break-all p-2 rounded bg-red-900/10 border border-red-900/30">
              {{ regexError }}
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-400 mb-2">Cờ (Flags)</label>
            <div class="flex flex-wrap gap-4">
              <label v-for="flag in availableFlags" :key="flag.value" class="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  v-model="activeFlags"
                  :value="flag.value"
                  class="w-4 h-4 rounded border-slate-600 text-[#38bdf8] bg-slate-900"
                  @change="analyzeRegex"
                />
                <span class="text-sm text-gray-300 font-mono">{{ flag.value }}</span>
              </label>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-400 mb-1">Chuỗi Kiểm tra (Test String)</label>
            <textarea
              v-model="testString"
              rows="4"
              class="w-full bg-[#0f172a] rounded-lg border border-[#1f2937] p-3 text-[#e5e7eb] font-mono text-sm focus:border-[#38bdf8] outline-none transition-all resize-none"
              placeholder="Nhập chuỗi cần kiểm tra..."
              @input="analyzeRegex"
            ></textarea>
          </div>

          <div class="flex flex-wrap gap-2 mt-2">
            <button @click="analyzeRegex" class="px-4 py-2 bg-[#38bdf8] hover:opacity-90 text-[#0f172a] rounded-lg text-sm font-medium transition-colors flex-1">
              Phân tích
            </button>
            <button @click="clearAll" class="px-4 py-2 bg-[#1f2937] hover:bg-slate-700 text-gray-200 rounded-lg text-sm transition-colors">
              Xóa hết
            </button>
          </div>

          <div class="flex flex-wrap gap-2">
            <select v-model="selectedExample" @change="loadExample" class="flex-1 bg-[#1f2937] border border-[#1f2937] rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none">
              <option value="" disabled selected>Tải Ví dụ...</option>
              <option v-for="(ex, key) in examples" :key="key" :value="key">{{ ex.name }}</option>
            </select>
            <button @click="shareURL" class="px-3 py-2 bg-[#1f2937] hover:bg-slate-700 text-gray-200 rounded-lg text-sm transition-colors" title="Chia sẻ URL">
              Chia sẻ URL
            </button>
          </div>

          <div v-if="shareCopied" class="text-xs text-[#38bdf8] text-center">
            Đã chép URL vào khay nhớ tạm!
          </div>
        </div>
      </section>

      <!-- Right Panel (70%) -->
      <section class="lg:col-span-7 flex flex-col bg-[#111827] rounded-xl shadow border border-[#1f2937] overflow-hidden min-h-[500px]">
        <!-- Tabs -->
        <div class="flex overflow-x-auto border-b border-[#1f2937] no-scrollbar">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            class="px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2"
            :class="activeTab === tab.id ? 'border-[#38bdf8] text-[#38bdf8]' : 'border-transparent text-gray-400 hover:text-gray-200'"
          >
            {{ tab.name }}
          </button>
        </div>

        <!-- Tab Content -->
        <div class="p-5 flex-1 overflow-y-auto">
          <!-- Explanation Tab -->
          <div v-if="activeTab === 'explanation'" class="space-y-4">
            <div v-if="!regexInput" class="text-gray-500 text-center py-10">Vui lòng nhập regex để xem giải thích chi tiết.</div>
            <div v-else class="overflow-hidden rounded-lg border border-[#1f2937]">
              <table class="w-full text-sm text-left">
                <thead class="bg-[#0f172a] text-gray-400 border-b border-[#1f2937]">
                  <tr>
                    <th class="px-4 py-3 font-medium">Ký hiệu (Token)</th>
                    <th class="px-4 py-3 font-medium">Ý nghĩa (Meaning)</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800">
                  <tr v-for="(token, i) in explanationTokens" :key="i">
                    <td class="px-4 py-3 font-mono text-[#38bdf8] bg-[#0f172a]/50 font-bold whitespace-nowrap">{{ token.raw }}</td>
                    <td class="px-4 py-3 text-gray-300">{{ token.meaning }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Matches Tab -->
          <div v-if="activeTab === 'matches'" class="space-y-4">
            <div class="bg-[#0f172a] rounded-lg border border-[#1f2937] p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap word-break-all text-gray-300 min-h-[150px]">
              <template v-if="matchHtml" v-html="matchHtml"></template>
              <span v-else class="text-gray-600">Không tìm thấy kết quả khớp nào.</span>
            </div>
          </div>

          <!-- Steps Tab -->
          <div v-if="activeTab === 'steps'" class="space-y-4">
            <div v-if="!regexInput || !testString" class="text-gray-500 text-center py-10">
              Vui lòng cung cấp regex và chuỗi kiểm tra.
            </div>
            <div v-else class="relative border-l-2 border-[#1f2937] ml-3 space-y-6 pb-4">
              <div v-for="(step, i) in simulatedSteps" :key="i" class="relative pl-6">
                <div class="absolute w-3 h-3 bg-[#38bdf8] rounded-full -left-[7px] top-1.5 focus:outline-none"></div>
                <div class="bg-[#0f172a] border border-[#1f2937] rounded-lg p-3">
                  <span class="text-xs font-bold text-[#38bdf8] mb-1 block">Bước {{ i + 1 }}</span>
                  <p class="text-sm text-gray-300 font-mono">{{ step.desc }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Graph Tab -->
          <div v-if="activeTab === 'graph'" class="space-y-4 flex flex-col h-full">
            <div v-if="!regexInput" class="text-gray-500 text-center py-10">Nhập regex để xem sơ đồ đồ thị.</div>
            <div v-else class="flex-1 bg-[#0f172a] border border-[#1f2937] rounded-lg p-4 overflow-auto min-h-[300px] flex items-center justify-center">
              <svg class="w-full h-full min-w-[600px] min-h-[200px]">
                <g transform="translate(40, 100)">
                  <circle cx="0" cy="0" r="15" fill="#0f172a" stroke="#38bdf8" stroke-width="2" />
                  <text x="0" y="5" text-anchor="middle" fill="#38bdf8" font-size="10" font-family="monospace">start</text>

                  <g v-for="(token, i) in explanationTokens" :key="'graph-'+i">
                    <!-- Edge -->
                    <line
                      :x1="i * 100 + 15" cy1="0"
                      :x2="i * 100 + 100 - 25" cy2="0"
                      stroke="#475569" stroke-width="2"
                      marker-end="url(#arrowhead)"
                    />
                    <!-- Node -->
                    <rect
                      :x="i * 100 + 75" y="-15"
                      width="40" height="30" rx="4"
                      fill="#1f2937" stroke="#475569" stroke-width="1"
                    />
                    <text
                      :x="i * 100 + 95" y="4"
                      text-anchor="middle" fill="#e5e7eb"
                      font-size="12" font-family="monospace"
                    >
                      {{ truncate(token.raw, 5) }}
                    </text>
                  </g>

                  <line
                    :x1="explanationTokens.length * 100 + 15" cy1="0"
                    :x2="explanationTokens.length * 100 + 100 - 15" cy2="0"
                    stroke="#475569" stroke-width="2"
                    marker-end="url(#arrowhead)"
                  />
                  <circle
                    :cx="explanationTokens.length * 100 + 100" cy="0"
                    r="15" fill="#0f172a" stroke="#38bdf8" stroke-width="2"
                  />
                  <text :x="explanationTokens.length * 100 + 100" y="25" text-anchor="middle" fill="#38bdf8" font-size="10" font-family="monospace">end</text>
                </g>
                <defs>
                  <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#475569" />
                  </marker>
                </defs>
              </svg>
            </div>
          </div>

          <!-- Performance Tab -->
          <div v-if="activeTab === 'performance'" class="space-y-6">
            <div v-if="!regexInput" class="text-gray-500 text-center py-10">Nhập regex để phân tích hiệu suất.</div>
            <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="bg-[#0f172a] border border-[#1f2937] rounded-lg p-4">
                <h4 class="text-sm font-medium text-gray-400 mb-2">Thời gian Thực thi (Execution Time)</h4>
                <div class="flex items-end gap-2">
                  <span class="text-3xl font-bold text-[#38bdf8]">
                    {{ perfTime.toFixed(2) }}
                  </span>
                  <span class="text-gray-500 mb-1">ms</span>
                </div>
              </div>

              <div class="bg-[#0f172a] border border-[#1f2937] rounded-lg p-4">
                <div v-if="catastrophicWarning">
                  <h4 class="text-sm font-bold text-red-400 mb-1">Cảnh báo: Catastrophic backtracking (Lặp vô hạn)</h4>
                  <p class="text-xs text-gray-400">
                    Pattern chứa lượng từ lồng nhau gây nguy hiểm, ví dụ: (a+)+
                  </p>
                </div>
                <div v-else>
                  <h4 class="text-sm font-bold text-emerald-400">Biểu thức An toàn (Safe Pattern)</h4>
                </div>
              </div>
            </div>
          </div>

          <!-- Cheat Sheet Tab -->
          <div v-if="activeTab === 'cheatsheet'">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="bg-[#0f172a] border border-[#1f2937] rounded-lg overflow-hidden">
                <ul class="divide-y divide-[#1f2937] p-0 text-sm">
                  <li class="px-3 py-2 flex justify-between"><code class="text-[#38bdf8]">\\d</code> <span class="text-gray-400">chữ số (digit)</span></li>
                  <li class="px-3 py-2 flex justify-between"><code class="text-[#38bdf8]">\\w</code> <span class="text-gray-400">ký tự chữ/số (word char)</span></li>
                  <li class="px-3 py-2 flex justify-between"><code class="text-[#38bdf8]">\\s</code> <span class="text-gray-400">khoảng trắng (whitespace)</span></li>
                  <li class="px-3 py-2 flex justify-between"><code class="text-[#38bdf8]">^</code> <span class="text-gray-400">bắt đầu dòng (start)</span></li>
                  <li class="px-3 py-2 flex justify-between"><code class="text-[#38bdf8]">$</code> <span class="text-gray-400">kết thúc dòng (end)</span></li>
                </ul>
              </div>
              <div class="bg-[#0f172a] border border-[#1f2937] rounded-lg overflow-hidden">
                <ul class="divide-y divide-[#1f2937] p-0 text-sm">
                  <li class="px-3 py-2 flex justify-between"><code class="text-[#38bdf8]">+</code> <span class="text-gray-400">1 hoặc nhiều lần (1 or more)</span></li>
                  <li class="px-3 py-2 flex justify-between"><code class="text-[#38bdf8]">*</code> <span class="text-gray-400">0 hoặc nhiều lần (0 or more)</span></li>
                  <li class="px-3 py-2 flex justify-between"><code class="text-[#38bdf8]">[]</code> <span class="text-gray-400">nhóm ký tự (char class)</span></li>
                  <li class="px-3 py-2 flex justify-between"><code class="text-[#38bdf8]">()</code> <span class="text-gray-400">nhóm bắt giữ (capture group)</span></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>
