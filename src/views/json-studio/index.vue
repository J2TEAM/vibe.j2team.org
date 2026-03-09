<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue'
import { useTitle } from '@vueuse/core'
import { Icon } from '@iconify/vue'
import Prism from 'prismjs'
import 'prismjs/components/prism-json'
import 'prismjs/themes/prism-tomorrow.css'

import { useJsonTools } from './composables/useJsonTools'
import type { ViewMode, IndentSize, DiffChange } from './types'
import meta from './meta'

useTitle(`${meta.name} | J2TEAM Vibe`)

const { formatJson, minifyJson, sortKeys, compareJson } = useJsonTools()

// --- State ---
const mode = ref<ViewMode>('formatter')
const indent = ref<IndentSize>(2)
const inputLeft = ref('')
const inputRight = ref('') // Used in Diff mode
const output = ref('') // Used in Formatter mode
const diffResult = ref<DiffChange[]>([])
const error = ref('')
const lang = ref<'vi' | 'en'>('vi')

// UI Status
const isCopied = ref(false)
const dragOver = ref(false)

// --- I18n ---
const t = computed(
  () =>
    ({
      vi: {
        title: 'JSON',
        subtitle: 'STUDIO',
        description: meta.description,
        back: 'Quay lại',
        formatter: 'Định dạng',
        diff: 'So sánh',
        input: 'Dữ liệu nguồn',
        oldJson: 'JSON cũ',
        newJson: 'JSON mới',
        output: 'Kết quả',
        format: 'Làm đẹp',
        minify: 'Nén lại',
        sort: 'Sắp xếp Key',
        repair: 'Tự động sửa',
        compare: 'So sánh ngay',
        copy: 'Sao chép',
        download: 'Tải về',
        clear: 'Xóa sạch',
        sample: 'Dữ liệu mẫu',
        indentation: 'Độ thụt lề',
        error: 'Phát hiện lỗi Syntal',
        noChange: 'Dữ liệu giống hệt nhau!',
        dropzone: 'Thả file .json vào đây',
        copied: 'Đã sao chép!',
      },
      en: {
        title: 'JSON',
        subtitle: 'STUDIO',
        description:
          'Ultra-lightweight JSON Formatter, Minifier and Diff Studio with Retro-Futuristic vibes.',
        back: 'Back',
        formatter: 'Formatter',
        diff: 'Diff Studio',
        input: 'Input Data',
        oldJson: 'Old JSON',
        newJson: 'New JSON',
        output: 'Output',
        format: 'Prettify',
        minify: 'Minify',
        sort: 'Sort Keys',
        repair: 'Auto Repair',
        compare: 'Compare',
        copy: 'Copy',
        download: 'Export',
        clear: 'Clear',
        sample: 'Sampler',
        indentation: 'Indentation',
        error: 'Syntax Error detected',
        noChange: 'No changes detected!',
        dropzone: 'Drop .json file here',
        copied: 'Copied!',
      },
    })[lang.value],
)

// --- Logic ---
const handleFormat = () => {
  error.value = ''
  const res = formatJson(inputLeft.value, indent.value)
  if (res.success) {
    output.value = res.data
    highlight()
  } else {
    error.value = res.error || 'Unknown error'
  }
}

const handleMinify = () => {
  error.value = ''
  const res = minifyJson(inputLeft.value)
  if (res.success) {
    output.value = res.data
    highlight()
  } else {
    error.value = res.error || 'Unknown error'
  }
}

const handleSort = () => {
  error.value = ''
  const res = sortKeys(inputLeft.value, indent.value)
  if (res.success) {
    output.value = res.data
    highlight()
  } else {
    error.value = res.error || 'Unknown error'
  }
}

const handleCompare = () => {
  error.value = ''
  try {
    // Attempt to format both first for clean diff
    const leftRaw = formatJson(inputLeft.value, 2).data
    const rightRaw = formatJson(inputRight.value, 2).data
    const res = compareJson(leftRaw, rightRaw)
    diffResult.value = res.changes
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  }
}

const highlight = () => {
  nextTick(() => {
    Prism.highlightAll()
  })
}

const loadSample = () => {
  const sample = {
    project: 'J2TEAM Vibe',
    version: '1.0.0',
    features: ['ASCII Art', 'JSON Studio', 'Commit Gen'],
    meta: {
      author: 'd4phuclam',
      safe: true,
    },
  }
  inputLeft.value = JSON.stringify(sample, null, 2)
  if (mode.value === 'diff') {
    const sample2 = JSON.parse(JSON.stringify(sample))
    sample2.version = '1.0.1'
    sample2.features.push('Responsive Diff')
    inputRight.value = JSON.stringify(sample2, null, 2)
  }
  nextTick(() => {
    if (mode.value === 'formatter') handleFormat()
    else handleCompare()
  })
}

const clearAll = () => {
  inputLeft.value = ''
  inputRight.value = ''
  output.value = ''
  diffResult.value = []
  error.value = ''
}

const copyResult = async () => {
  const text =
    mode.value === 'formatter' ? output.value : diffResult.value.map((c) => c.value).join('')
  await navigator.clipboard.writeText(text)
  isCopied.value = true
  setTimeout(() => (isCopied.value = false), 2000)
}

const downloadFile = () => {
  const text =
    mode.value === 'formatter' ? output.value : diffResult.value.map((c) => c.value).join('')
  const blob = new Blob([text], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `j2team-vibe-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

const handleFileUpload = (e: DragEvent, side: 'left' | 'right' = 'left') => {
  dragOver.value = false
  const file = e.dataTransfer?.files[0]
  if (file && (file.type === 'application/json' || file.name.endsWith('.json'))) {
    const reader = new FileReader()
    reader.onload = (ev) => {
      if (side === 'left') inputLeft.value = ev.target?.result as string
      else inputRight.value = ev.target?.result as string
      nextTick(() => {
        if (mode.value === 'formatter') handleFormat()
      })
    }
    reader.readAsText(file)
  }
}

onMounted(() => {
  highlight()
})
</script>

<template>
  <div
    class="min-h-screen bg-bg-deep text-text-primary font-body overflow-x-hidden selection:bg-accent-sky selection:text-bg-deep"
  >
    <!-- Top Decorative Line -->
    <div class="h-1 bg-accent-sky animate-pulse-border"></div>

    <main class="max-w-7xl mx-auto px-6 py-12">
      <!-- Header Section -->
      <header
        class="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8 animate-fade-up"
      >
        <div class="space-y-4">
          <div class="flex items-center gap-4">
            <div
              class="inline-block bg-accent-sky text-bg-deep font-display font-bold text-xs tracking-widest px-3 py-1.5 -rotate-1"
            >
              DATA // STUDIO // V1.0
            </div>
            <button
              @click="lang = lang === 'vi' ? 'en' : 'vi'"
              class="border border-border-default px-2 py-1 text-[10px] font-display tracking-widest uppercase hover:border-accent-sky transition-colors"
            >
              {{ lang === 'vi' ? 'EN' : 'VI' }}
            </button>
          </div>
          <h1
            class="font-display text-6xl md:text-8xl font-bold text-text-primary uppercase tracking-tighter leading-none"
          >
            {{ t.title }}<span class="text-accent-sky">.</span><br />
            <span class="text-text-dim/20">{{ t.subtitle }}</span>
          </h1>
          <p
            class="text-text-secondary max-w-xl text-lg font-medium border-l-2 border-accent-sky pl-4"
          >
            {{ t.description }}
          </p>
        </div>

        <RouterLink
          to="/"
          class="group flex items-center gap-3 font-display uppercase tracking-widest text-sm hover:text-accent-sky transition-colors"
        >
          <span class="text-accent-sky group-hover:-translate-x-1 transition-transform">//</span>
          {{ t.back }}
        </RouterLink>
      </header>

      <!-- View Switcher -->
      <div class="flex gap-4 mb-8 animate-fade-up animate-delay-1">
        <button
          @click="mode = 'formatter'"
          :class="[
            mode === 'formatter'
              ? 'bg-accent-sky text-bg-deep'
              : 'border border-border-default text-text-secondary hover:border-accent-sky',
          ]"
          class="px-6 py-2 text-xs font-display font-bold tracking-widest uppercase transition-all duration-300"
        >
          {{ t.formatter }}
        </button>
        <button
          @click="mode = 'diff'"
          :class="[
            mode === 'diff'
              ? 'bg-accent-sky text-bg-deep'
              : 'border border-border-default text-text-secondary hover:border-accent-sky',
          ]"
          class="px-6 py-2 text-xs font-display font-bold tracking-widest uppercase transition-all duration-300"
        >
          {{ t.diff }}
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <!-- Input & Control Panel -->
        <aside class="lg:col-span-5 space-y-6 animate-fade-up animate-delay-2">
          <div class="border border-border-default bg-bg-surface p-6 space-y-4">
            <div class="flex items-center justify-between mb-2">
              <h2 class="font-display text-sm font-bold tracking-widest uppercase text-accent-sky">
                // {{ mode === 'formatter' ? t.input : t.oldJson }}
              </h2>
              <div class="flex gap-2">
                <button
                  @click="loadSample"
                  class="text-[10px] uppercase tracking-widest text-text-dim hover:text-accent-sky underline"
                >
                  {{ t.sample }}
                </button>
                <button
                  @click="clearAll"
                  class="text-[10px] uppercase tracking-widest text-text-dim hover:text-accent-coral underline"
                >
                  {{ t.clear }}
                </button>
              </div>
            </div>

            <!-- Text Area for Input -->
            <div class="relative group">
              <textarea
                v-model="inputLeft"
                @dragover.prevent="dragOver = true"
                @dragleave.prevent="dragOver = false"
                @drop.prevent="handleFileUpload($event, 'left')"
                :placeholder="t.dropzone"
                class="w-full h-80 bg-bg-deep border border-border-default p-4 font-mono text-sm text-accent-sky/80 focus:outline-none focus:border-accent-sky transition-colors resize-none overflow-auto"
                :class="{
                  'border-accent-sky bg-accent-sky/5 shadow-[0_0_15px_rgba(56,189,248,0.1)]':
                    dragOver,
                }"
              ></textarea>
              <div
                v-if="dragOver"
                class="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <Icon icon="lucide:upload-cloud" class="text-4xl text-accent-sky animate-bounce" />
              </div>
            </div>

            <!-- Second Input for Diff Mode -->
            <div v-if="mode === 'diff'" class="space-y-4 pt-4 border-t border-border-default/30">
              <h2
                class="font-display text-sm font-bold tracking-widest uppercase text-accent-amber"
              >
                // {{ t.newJson }}
              </h2>
              <textarea
                v-model="inputRight"
                @drop.prevent="handleFileUpload($event, 'right')"
                placeholder="..."
                class="w-full h-80 bg-bg-deep border border-border-default p-4 font-mono text-sm text-accent-amber/80 focus:outline-none focus:border-accent-amber transition-colors resize-none overflow-auto"
              ></textarea>
            </div>

            <!-- Control Buttons -->
            <div class="grid grid-cols-2 gap-3 pt-4">
              <template v-if="mode === 'formatter'">
                <button
                  @click="handleFormat"
                  class="col-span-1 border border-border-default py-3 text-[10px] font-display font-bold tracking-widest uppercase hover:bg-accent-sky hover:text-bg-deep transition-all"
                >
                  {{ t.format }}
                </button>
                <button
                  @click="handleMinify"
                  class="col-span-1 border border-border-default py-3 text-[10px] font-display font-bold tracking-widest uppercase hover:bg-accent-sky hover:text-bg-deep transition-all"
                >
                  {{ t.minify }}
                </button>
                <button
                  @click="handleSort"
                  class="col-span-2 border border-border-default py-3 text-[10px] font-display font-bold tracking-widest uppercase hover:border-accent-sky transition-all flex items-center justify-center gap-2"
                >
                  <Icon icon="lucide:arrow-down-az" /> {{ t.sort }}
                </button>
              </template>
              <button
                v-else
                @click="handleCompare"
                class="col-span-2 bg-accent-sky text-bg-deep py-3 text-[11px] font-display font-bold tracking-widest uppercase hover:scale-[1.02] transition-all"
              >
                {{ t.compare }}
              </button>
            </div>

            <!-- Error Display -->
            <div
              v-if="error"
              class="bg-accent-coral/10 border-l-2 border-accent-coral p-3 flex flex-col gap-1"
            >
              <span
                class="text-[10px] font-display font-bold text-accent-coral tracking-widest uppercase"
                >⚠ {{ t.error }}</span
              >
              <p class="text-xs text-text-secondary font-mono break-all">{{ error }}</p>
            </div>
          </div>

          <!-- Options Section -->
          <div
            class="border border-border-default bg-bg-surface p-4 flex items-center justify-between"
          >
            <span
              class="text-[10px] font-display font-bold tracking-widest uppercase text-text-dim"
              >{{ t.indentation }}</span
            >
            <div class="flex gap-4">
              <button
                v-for="size in [2, 4, 'tab'] as const"
                :key="size"
                @click="indent = size"
                :class="[
                  indent === size ? 'text-accent-sky' : 'text-text-dim hover:text-text-primary',
                ]"
                class="text-[10px] font-display font-bold tracking-widest uppercase transition-colors"
              >
                {{ size === 'tab' ? 'TAB' : `${size} SPACES` }}
              </button>
            </div>
          </div>
        </aside>

        <!-- Output / Results Area -->
        <section class="lg:col-span-7 h-full flex flex-col animate-fade-up animate-delay-3">
          <div
            class="border border-border-default bg-bg-surface h-full min-h-[600px] flex flex-col relative overflow-hidden group/out"
          >
            <!-- Scanline Effect Overlay -->
            <div class="absolute inset-0 pointer-events-none bg-scanline opacity-10 z-10"></div>

            <div
              class="border-b border-border-default px-6 py-4 flex items-center justify-between bg-bg-deep"
            >
              <div class="flex gap-1.5">
                <div
                  class="w-2 h-2 rounded-full"
                  :class="error ? 'bg-accent-coral' : 'bg-accent-sky'"
                ></div>
                <div class="w-8 h-1 bg-border-default rounded-full self-center"></div>
              </div>
              <div
                class="font-display text-[10px] tracking-widest uppercase text-text-dim flex items-center gap-4"
              >
                <span class="hidden md:inline">SYSTEM STATUS: {{ error ? 'HALT' : 'READY' }}</span>
                <div class="flex gap-2">
                  <button
                    @click="copyResult"
                    class="hover:text-accent-sky transition-colors flex items-center gap-1"
                  >
                    <Icon :icon="isCopied ? 'lucide:check' : 'lucide:copy'" />
                    {{ isCopied ? t.copied : t.copy }}
                  </button>
                  <button
                    @click="downloadFile"
                    class="hover:text-accent-sky transition-colors flex items-center gap-1"
                  >
                    <Icon icon="lucide:download" /> {{ t.download }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Content Area -->
            <div class="flex-1 overflow-auto p-4 bg-[#1d1f21] selection:bg-accent-sky/30">
              <!-- Formatter Output -->
              <pre
                v-if="mode === 'formatter'"
                class="m-0 h-full"
              ><code class="language-json">{{ output || '{}' }}</code></pre>

              <!-- Diff Output -->
              <div v-else class="font-mono text-[11px] md:text-xs leading-relaxed">
                <div
                  v-if="diffResult.length === 0"
                  class="h-[500px] flex flex-col items-center justify-center text-text-dim opacity-30 select-none"
                >
                  <Icon icon="lucide:unfold-vertical" class="text-6xl mb-4" />
                  <span class="tracking-[0.3em] font-display uppercase">{{ t.compare }}</span>
                </div>
                <div v-else class="space-y-0.5">
                  <div
                    v-for="(change, i) in diffResult"
                    :key="i"
                    :class="[
                      change.added
                        ? 'bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500'
                        : change.removed
                          ? 'bg-accent-coral/10 text-accent-coral border-l-2 border-accent-coral'
                          : 'text-text-secondary opacity-60 border-l-2 border-transparent',
                    ]"
                    class="px-3 py-0.5 whitespace-pre-wrap flex gap-3"
                  >
                    <span class="w-4 select-none opacity-40">{{
                      change.added ? '+' : change.removed ? '-' : ' '
                    }}</span>
                    <span>{{ change.value }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Visual Feedback Label -->
            <div
              class="absolute bottom-4 right-6 pointer-events-none opacity-20 group-hover/out:opacity-40 transition-opacity"
            >
              <span class="font-display text-4xl font-extrabold text-bg-deep italic"
                >J2TEAM // VIBE</span
              >
            </div>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* Custom Scanline Effect */
.bg-scanline {
  background:
    linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.1) 50%),
    linear-gradient(90deg, rgba(255, 0, 0, 0.02), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.02));
  background-size:
    100% 2px,
    3px 100%;
}

/* Prism Overrides */
:deep(pre[class*='language-']) {
  background: transparent !important;
  margin: 0;
  padding: 0;
}

:deep(code[class*='language-']) {
  text-shadow: none !important;
  font-family: inherit;
}

/* Custom Scrollbar */
::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}
::-webkit-scrollbar-track {
  background: var(--bg-deep);
}
::-webkit-scrollbar-thumb {
  background: var(--border-default);
}
::-webkit-scrollbar-thumb:hover {
  background: var(--accent-sky);
}
</style>
