<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'

// --- Types ---
interface Token {
  index: number
  content: string
  length: number
  isWhitespace: boolean
}

// --- Constants & Data ---
const modelPricing: Record<string, { input: number; output: number }> = {
  'gpt-5': { input: 1.25, output: 10.0 },
  'gpt-5-mini': { input: 0.25, output: 2.0 },
  'gpt-5-nano': { input: 0.05, output: 0.4 },
  'gpt-4.1': { input: 2.0, output: 8.0 },
  'gpt-4.1-mini': { input: 0.4, output: 1.6 },
  'gpt-4.1-nano': { input: 0.1, output: 0.4 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
}

const words = [
  'lorem',
  'ipsum',
  'dolor',
  'sit',
  'amet',
  'consectetur',
  'adipiscing',
  'elit',
  'sed',
  'do',
  'eiusmod',
  'tempor',
  'incididunt',
  'ut',
  'labore',
  'et',
  'dolore',
  'magna',
  'aliqua',
  'enim',
  'ad',
  'minim',
  'veniam',
  'quis',
  'nostrud',
  'exercitation',
  'ullamco',
  'laboris',
  'nisi',
  'aliquip',
  'ex',
  'ea',
  'commodo',
  'consequat',
  'duis',
  'aute',
  'irure',
  'in',
  'reprehenderit',
  'voluptate',
  'velit',
  'esse',
  'cillum',
  'fugiat',
  'nulla',
  'pariatur',
  'excepteur',
  'sint',
  'occaecat',
  'cupidatat',
  'non',
  'proident',
  'sunt',
  'culpa',
  'qui',
  'officia',
  'deserunt',
  'mollit',
  'anim',
  'id',
  'est',
  'laborum',
  'con',
  'cáo',
  'nâu',
  'nhanh',
  'nhẹn',
  'nhảy',
  'qua',
  'con',
  'chó',
  'lười',
  'xin',
  'chào',
  'thế',
  'giới',
  'chương',
  'trình',
  'mã',
  'nguồn',
  'hàm',
  'biến',
  'dữ',
  'liệu',
  'hệ',
  'thống',
  'máy',
  'tính',
  'api',
  'web',
  'ứng',
  'dụng',
  'phát',
  'triển',
  'phần',
  'mềm',
  'công',
  'nghệ',
]
const punctuation = ['.', ',', '!', '?', ';', ':']

// --- State ---
const activeTab = ref<'tokenize' | 'generate'>('tokenize')

// Tokenize Tab State
const inputText = ref('')
const modelTokenize = ref('gpt-4o-mini')
const priceTypeTokenize = ref<'input' | 'output'>('input')

// Generate Tab State
const targetTokenCount = ref(100)
const modelGenerate = ref('gpt-4o-mini')
const priceTypeGenerate = ref<'input' | 'output'>('input')
const generatedText = ref('')

// --- Logic ---
function tokenize(text: string): Token[] {
  if (!text) return []
  const pattern = /[\w]+|[^\w\s]|\s+/g
  const tokens: Token[] = []
  let match
  let index = 0
  while ((match = pattern.exec(text)) !== null) {
    const content = match[0]
    tokens.push({
      index: index++,
      content,
      length: content.length,
      isWhitespace: /^\s+$/.test(content),
    })
  }
  return tokens
}

function countTokens(tokens: Token[]): number {
  return tokens.filter((t) => !t.isWhitespace).length
}

function calculateCost(tokenCount: number, model: string, type: 'input' | 'output'): string {
  const pricing = modelPricing[model] ?? modelPricing['gpt-4o-mini']!
  const ratePer1M = pricing[type]
  const cost = (tokenCount / 1000000) * ratePer1M
  return '$' + cost.toFixed(6)
}

// (generateLorem removed - unused)

// Fixed generator to work with ref
const handleGenerate = () => {
  let val = targetTokenCount.value
  if (val < 1) val = 1
  if (val > 100000) val = 100000
  targetTokenCount.value = val

  const result: string[] = []
  let currentTokens = 0
  const random = (arr: string[]): string => arr[Math.floor(Math.random() * arr.length)]!

  while (currentTokens < val) {
    const sentenceLength = Math.floor(Math.random() * 11) + 5
    const sentence: string[] = []
    for (let i = 0; i < sentenceLength; i++) {
      if (currentTokens >= val) break
      sentence.push(random(words))
      currentTokens++
    }
    if (sentence.length > 0) {
      const first = sentence[0]!
      sentence[0] = first.charAt(0).toUpperCase() + first.slice(1)
      const lastIdx = sentence.length - 1
      const punct = random(punctuation)
      if (punct === '.' || Math.random() > 0.3) {
        sentence[lastIdx] += '.'
      } else {
        sentence[lastIdx] += punct
      }
      result.push(sentence.join(' '))
    }
  }
  generatedText.value = result.join(' ')
}

// --- Computed ---
const tokenizeTokens = computed(() => tokenize(inputText.value))
const tokenizeTokenCount = computed(() => countTokens(tokenizeTokens.value))
const tokenizeCharCount = computed(() => inputText.value.length)
const tokenizeCost = computed(() =>
  calculateCost(tokenizeTokenCount.value, modelTokenize.value, priceTypeTokenize.value),
)

const generateTokens = computed(() => tokenize(generatedText.value))
const generateTokenCount = computed(() => countTokens(generateTokens.value))
const generateCharCount = computed(() => generatedText.value.length)
const generateCost = computed(() =>
  calculateCost(generateTokenCount.value, modelGenerate.value, priceTypeGenerate.value),
)

onMounted(() => {
  inputText.value =
    'Xin chào thế giới! Đây là một bản demo token hóa. OpenAI sử dụng BPE (Byte Pair Encoding) để chia nhỏ văn bản thành các token.'
})
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body pb-20">
    <!-- Header -->
    <header
      class="max-w-5xl mx-auto pt-16 pb-12 px-6 text-center border-b border-border-default mb-12 relative overflow-hidden"
    >
      <div class="absolute top-0 right-0 p-4 opacity-10 pointer-events-none rotate-12">
        <span class="font-display text-8xl font-bold text-accent-coral">TK</span>
      </div>

      <h1 class="font-display text-5xl md:text-6xl font-bold text-accent-coral animate-fade-up">
        Trực quan hóa Token
      </h1>
      <p class="mt-4 text-text-secondary text-lg animate-fade-up animate-delay-1">
        Công cụ tính toán Token OpenAI & Tạo văn bản mẫu
      </p>

      <div class="mt-8 flex justify-center animate-fade-up animate-delay-2">
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-5 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
        >
          &larr; Về trang chủ
        </RouterLink>
      </div>
    </header>

    <main class="max-w-5xl mx-auto px-6">
      <!-- Tabs -->
      <nav class="flex justify-center gap-4 mb-12 animate-fade-up animate-delay-2">
        <button
          @click="activeTab = 'tokenize'"
          :class="[
            'px-6 py-3 border transition-all duration-300 font-display font-semibold flex items-center gap-2',
            activeTab === 'tokenize'
              ? 'border-accent-coral bg-bg-surface text-accent-coral'
              : 'border-border-default bg-bg-surface text-text-secondary hover:border-accent-coral/50',
          ]"
        >
          <span class="text-xl"></span> Văn bản → Tokenize
        </button>
        <button
          @click="activeTab = 'generate'"
          :class="[
            'px-6 py-3 border transition-all duration-300 font-display font-semibold flex items-center gap-2',
            activeTab === 'generate'
              ? 'border-accent-sky bg-bg-surface text-accent-sky'
              : 'border-border-default bg-bg-surface text-text-secondary hover:border-accent-sky/50',
          ]"
        >
          <span class="text-xl"></span> Số lượng Token → Tạo
        </button>
      </nav>

      <!-- Tokenize Tab Content -->
      <section v-if="activeTab === 'tokenize'" class="animate-fade-up">
        <div class="grid lg:grid-cols-3 gap-8 mb-12">
          <!-- Inputs -->
          <div class="lg:col-span-2 space-y-6">
            <div class="bg-bg-surface border border-border-default p-6 space-y-4">
              <h2 class="font-display text-xl font-semibold flex items-center gap-2">
                <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
                Cấu hình Đầu vào
              </h2>

              <div class="grid sm:grid-cols-2 gap-4 text-sm">
                <div class="space-y-2">
                  <label class="text-text-secondary">Chọn Mô hình:</label>
                  <select
                    v-model="modelTokenize"
                    class="w-full bg-bg-deep border border-border-default p-2 text-text-primary focus:border-accent-coral outline-none appearance-none cursor-pointer"
                  >
                    <option v-for="(_, model) in modelPricing" :key="model" :value="model">
                      {{ model }}
                    </option>
                  </select>
                </div>
                <div class="space-y-2">
                  <label class="text-text-secondary">Loại giá:</label>
                  <div class="flex border border-border-default">
                    <button
                      @click="priceTypeTokenize = 'input'"
                      :class="[
                        'flex-1 py-2 transition-colors',
                        priceTypeTokenize === 'input'
                          ? 'bg-accent-coral text-bg-deep font-bold'
                          : 'hover:bg-bg-elevated text-text-secondary',
                      ]"
                    >
                      Đầu vào
                    </button>
                    <button
                      @click="priceTypeTokenize = 'output'"
                      :class="[
                        'flex-1 py-2 transition-colors',
                        priceTypeTokenize === 'output'
                          ? 'bg-accent-coral text-bg-deep font-bold'
                          : 'hover:bg-bg-elevated text-text-secondary',
                      ]"
                    >
                      Đầu ra
                    </button>
                  </div>
                </div>
              </div>

              <div class="space-y-2">
                <label class="text-text-secondary">Nhập văn bản của bạn:</label>
                <textarea
                  v-model="inputText"
                  placeholder="Nhập hoặc dán văn bản của bạn vào đây..."
                  class="w-full min-h-[160px] bg-bg-deep border border-border-default p-4 text-text-primary font-mono text-sm focus:border-accent-coral outline-none resize-y"
                ></textarea>
              </div>
            </div>
          </div>

          <!-- Stats -->
          <div class="space-y-4">
            <div
              class="bg-bg-surface border border-border-default p-6 text-center hover:border-accent-coral transition-colors"
            >
              <div class="text-xs text-text-dim font-display uppercase tracking-widest mb-1">
                Tổng số Token
              </div>
              <div class="text-4xl font-bold font-mono text-accent-sky">
                {{ tokenizeTokenCount.toLocaleString() }}
              </div>
            </div>
            <div
              class="bg-bg-surface border border-border-default p-6 text-center hover:border-accent-amber transition-colors"
            >
              <div class="text-xs text-text-dim font-display uppercase tracking-widest mb-1">
                Ký tự
              </div>
              <div class="text-4xl font-bold font-mono text-accent-amber">
                {{ tokenizeCharCount.toLocaleString() }}
              </div>
            </div>
            <div
              class="bg-bg-surface border border-border-default p-6 text-center hover:border-accent-coral transition-colors"
            >
              <div class="text-xs text-text-dim font-display uppercase tracking-widest mb-1">
                Chi phí Ước tính
              </div>
              <div class="text-4xl font-bold font-mono text-text-primary">{{ tokenizeCost }}</div>
            </div>
          </div>
        </div>

        <!-- Visualization -->
        <div class="bg-bg-surface border border-border-default p-6 mb-12">
          <h2 class="font-display text-xl font-semibold flex items-center justify-between mb-6">
            <div class="flex items-center gap-2">
              <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
              Trực quan hóa Token
            </div>
            <span
              class="text-xs font-mono bg-bg-deep px-3 py-1 text-text-secondary border border-border-default"
            >
              {{ tokenizeTokenCount }} tokens
            </span>
          </h2>

          <div
            v-if="tokenizeTokens.length"
            class="flex flex-wrap gap-1 font-mono text-sm leading-relaxed"
          >
            <template v-for="(token, i) in tokenizeTokens" :key="i">
              <span v-if="token.isWhitespace" class="whitespace-pre opacity-30">{{
                token.content
              }}</span>
              <span
                v-else
                :class="[
                  'px-1 group relative cursor-help transition-all duration-200 border-b-2',
                  [
                    'border-accent-coral',
                    'border-accent-amber',
                    'border-accent-sky',
                    'border-white/40',
                  ][token.index % 4],
                ]"
              >
                {{ token.content }}
                <!-- Tooltip -->
                <div
                  class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max bg-bg-elevated border border-border-default p-2 text-[10px] invisible group-hover:visible z-50 shadow-xl pointer-events-none"
                >
                  <div class="text-text-dim">
                    Chỉ số: <span class="text-text-primary">{{ token.index }}</span>
                  </div>
                  <div class="text-text-dim">
                    Độ dài: <span class="text-text-primary">{{ token.length }}</span>
                  </div>
                </div>
              </span>
            </template>
          </div>
          <div v-else class="text-center py-12 text-text-dim opacity-40 italic">
            Không có token nào để hiển thị. Bắt đầu nhập ở trên...
          </div>
        </div>

        <!-- Table -->
        <div class="bg-bg-surface border border-border-default overflow-hidden">
          <h2
            class="font-display text-lg font-semibold bg-bg-elevated px-6 py-4 border-b border-border-default flex items-center gap-2"
          >
            <span class="text-accent-amber font-display text-sm tracking-widest">//</span>
            Chi tiết Token
          </h2>
          <div class="overflow-x-auto max-h-[400px]">
            <table class="w-full text-left font-mono text-sm">
              <thead class="bg-bg-deep sticky top-0 z-10">
                <tr>
                  <th
                    class="px-6 py-4 text-text-dim font-display tracking-widest text-xs uppercase"
                  >
                    #
                  </th>
                  <th
                    class="px-6 py-4 text-text-dim font-display tracking-widest text-xs uppercase"
                  >
                    Nội dung
                  </th>
                  <th
                    class="px-6 py-4 text-text-dim font-display tracking-widest text-xs uppercase"
                  >
                    Độ dài
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border-default">
                <template v-for="(token, i) in tokenizeTokens" :key="i">
                  <tr v-if="!token.isWhitespace" class="hover:bg-bg-elevated transition-colors">
                    <td
                      class="px-6 py-3 font-bold"
                      :class="
                        [
                          'text-accent-coral',
                          'text-accent-amber',
                          'text-accent-sky',
                          'text-text-primary',
                        ][token.index % 4]
                      "
                    >
                      {{ token.index }}
                    </td>
                    <td
                      class="px-6 py-3 border-x border-border-default/50 truncate max-w-[300px]"
                      :title="token.content"
                    >
                      {{ token.content }}
                    </td>
                    <td class="px-6 py-3 text-text-secondary">{{ token.length }}</td>
                  </tr>
                </template>
                <tr v-if="!tokenizeTokenCount">
                  <td colspan="3" class="px-6 py-12 text-center text-text-dim italic">
                    Không có dữ liệu
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- Generate Tab Content -->
      <section v-if="activeTab === 'generate'" class="animate-fade-up">
        <div class="grid lg:grid-cols-3 gap-8 mb-12">
          <!-- Inputs -->
          <div class="lg:col-span-2 space-y-6">
            <div class="bg-bg-surface border border-border-default p-6 space-y-4">
              <h2 class="font-display text-xl font-semibold flex items-center gap-2">
                <span class="text-accent-sky font-display text-sm tracking-widest">//</span>
                Cấu hình Tạo
              </h2>

              <div class="grid sm:grid-cols-2 gap-4 text-sm">
                <div class="space-y-2">
                  <label class="text-text-secondary">Chọn Mô hình:</label>
                  <select
                    v-model="modelGenerate"
                    class="w-full bg-bg-deep border border-border-default p-2 text-text-primary focus:border-accent-sky outline-none appearance-none cursor-pointer"
                  >
                    <option v-for="(_, model) in modelPricing" :key="model" :value="model">
                      {{ model }}
                    </option>
                  </select>
                </div>
                <div class="space-y-2">
                  <label class="text-text-secondary">Loại giá:</label>
                  <div class="flex border border-border-default">
                    <button
                      @click="priceTypeGenerate = 'input'"
                      :class="[
                        'flex-1 py-2 transition-colors',
                        priceTypeGenerate === 'input'
                          ? 'bg-accent-sky text-bg-deep font-bold'
                          : 'hover:bg-bg-elevated text-text-secondary',
                      ]"
                    >
                      Đầu vào
                    </button>
                    <button
                      @click="priceTypeGenerate = 'output'"
                      :class="[
                        'flex-1 py-2 transition-colors',
                        priceTypeGenerate === 'output'
                          ? 'bg-accent-sky text-bg-deep font-bold'
                          : 'hover:bg-bg-elevated text-text-secondary',
                      ]"
                    >
                      Đầu ra
                    </button>
                  </div>
                </div>
              </div>

              <div class="space-y-2">
                <label class="text-text-secondary">Số lượng token mong muốn (1 - 100,000):</label>
                <div class="flex gap-2">
                  <input
                    type="number"
                    v-model.number="targetTokenCount"
                    min="1"
                    max="100000"
                    class="bg-bg-deep border border-border-default p-4 text-text-primary font-mono text-sm focus:border-accent-sky outline-none flex-1"
                  />
                  <button
                    @click="handleGenerate"
                    class="bg-accent-sky text-bg-deep px-6 font-display font-bold hover:brightness-110 active:scale-95 transition-all"
                  >
                    TẠO
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Stats -->
          <div class="space-y-4">
            <div
              class="bg-bg-surface border border-border-default p-6 text-center hover:border-accent-sky transition-colors"
            >
              <div class="text-xs text-text-dim font-display uppercase tracking-widest mb-1">
                Token Thực tế
              </div>
              <div class="text-4xl font-bold font-mono text-accent-sky">
                {{ generateTokenCount.toLocaleString() }}
              </div>
            </div>
            <div
              class="bg-bg-surface border border-border-default p-6 text-center hover:border-accent-amber transition-colors"
            >
              <div class="text-xs text-text-dim font-display uppercase tracking-widest mb-1">
                Ký tự
              </div>
              <div class="text-4xl font-bold font-mono text-accent-amber">
                {{ generateCharCount.toLocaleString() }}
              </div>
            </div>
            <div
              class="bg-bg-surface border border-border-default p-6 text-center hover:border-accent-sky transition-colors"
            >
              <div class="text-xs text-text-dim font-display uppercase tracking-widest mb-1">
                Chi phí Ước tính
              </div>
              <div class="text-4xl font-bold font-mono text-text-primary">{{ generateCost }}</div>
            </div>
          </div>
        </div>

        <!-- Result Text -->
        <div class="bg-bg-surface border border-border-default p-6 mb-12">
          <h2 class="font-display text-xl font-semibold flex items-center justify-between mb-6">
            <div class="flex items-center gap-2">
              <span class="text-accent-sky font-display text-sm tracking-widest">//</span>
              Văn bản được tạo
            </div>
            <span
              class="text-xs font-mono bg-bg-deep px-3 py-1 text-text-secondary border border-border-default"
            >
              {{ generateTokenCount }} tokens
            </span>
          </h2>

          <div
            v-if="generatedText"
            class="font-body text-sm leading-relaxed p-4 bg-bg-deep/50 border border-border-default block whitespace-pre-wrap"
          >
            {{ generatedText }}
          </div>
          <div v-else class="text-center py-12 text-text-dim opacity-40 italic">
            Nhấp "TẠO" để tạo văn bản...
          </div>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer class="max-w-5xl mx-auto px-6 mt-12 py-12 border-t border-border-default text-center">
      <div class="text-text-dim text-xs tracking-widest font-display animate-fade-up">
        <a
          href="https://github.com/LTPPPP"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-block hover:text-accent-coral transition-colors"
          aria-label="GitHub - LTPPPP"
          title="GitHub - LTPPPP"
        >
          VOL.01 / 2026 // TRỰC QUAN HÓA TOKEN // PHÁT TRIỂN BỞI LTPPPP
        </a>
      </div>
      <p class="mt-4 text-text-secondary text-xs opacity-50 max-w-lg mx-auto leading-relaxed">
        Phần mềm mang tính chất minh họa giáo dục. Giá cả mang tính chất tham khảo dựa trên báo giá
        của OpenAI.
      </p>
      <div class="mt-6 flex justify-center animate-fade-up">
        <a
          href="https://github.com/LTPPPP"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 text-text-secondary hover:text-accent-coral transition-colors"
          aria-label="GitHub - LTPPPP"
          title="GitHub - LTPPPP"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path
              d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.089-.744.083-.729.083-.729 1.205.085 1.84 1.236 1.84 1.236 1.07 1.835 2.807 1.305 3.492.998.108-.775.418-1.305.762-1.605-2.665-.305-5.467-1.335-5.467-5.93 0-1.31.468-2.381 1.236-3.221-.123-.303-.536-1.523.117-3.176 0 0 1.008-.322 3.301 1.23a11.52 11.52 0 0 1 3.003-.403c1.018.005 2.042.138 3.003.403 2.291-1.552 3.297-1.23 3.297-1.23.655 1.653.242 2.873.12 3.176.77.84 1.234 1.911 1.234 3.221 0 4.61-2.807 5.624-5.48 5.92.43.372.823 1.102.823 2.222 0 1.606-.015 2.898-.015 3.293 0 .32.218.694.825.576C20.565 22.092 24 17.593 24 12.297 24 5.67 18.63.297 12 .297z"
            />
          </svg>
        </a>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* Specific overrides for geometric sharp design */
select {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%238B9DB5' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: calc(100% - 12px) center;
}

input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type='number'] {
  -moz-appearance: textfield;
}

/* Scrollbar adjustment for retro feel */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: var(--color-bg-deep);
}
::-webkit-scrollbar-thumb {
  background: var(--color-border-default);
}
::-webkit-scrollbar-thumb:hover {
  background: var(--color-accent-coral);
}
</style>
