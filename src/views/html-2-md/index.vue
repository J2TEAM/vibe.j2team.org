<script setup lang="ts">
import { ref, computed } from 'vue'
import { useClipboard, useScriptTag } from '@vueuse/core'
import { Icon } from '@iconify/vue'

type Tab = 'raw' | 'preview'

const url = ref('')
const markdown = ref('')
const isLoading = ref(false)
const error = ref('')
const activeTab = ref<Tab>('raw')
const isMarkedLoaded = ref(false)

const { copy, copied } = useClipboard({ source: markdown })

const { load: loadMarked } = useScriptTag(
  'https://cdn.jsdelivr.net/npm/marked@15/marked.min.js',
  () => {
    isMarkedLoaded.value = true
  },
  { manual: true },
)

const isValidUrl = computed(() => {
  if (!url.value.trim()) return null
  try {
    new URL(url.value)
    return true
  } catch {
    return false
  }
})

const hasResult = computed(() => markdown.value.length > 0)
const charCount = computed(() => markdown.value.length)
const wordCount = computed(() => markdown.value.split(/\s+/).filter(Boolean).length)
const lineCount = computed(() => markdown.value.split('\n').length)

const previewHtml = computed(() => {
  if (!markdown.value) return ''
  if (isMarkedLoaded.value) {
    const w = window as Window & { marked?: { parse: (md: string) => string } }
    if (w.marked) {
      return String(w.marked.parse(markdown.value))
    }
  }
  const escaped = markdown.value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return `<pre class="font-mono text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">${escaped}</pre>`
})

async function convert() {
  const trimmedUrl = url.value.trim()
  if (!trimmedUrl) return

  if (!isValidUrl.value) {
    error.value = 'Invalid URL — please enter a full URL, e.g. https://example.com'
    return
  }

  isLoading.value = true
  error.value = ''
  markdown.value = ''

  try {
    const response = await fetch(`https://r.jina.ai/${trimmedUrl}`, {
      headers: { Accept: 'text/markdown' },
    })

    if (!response.ok) {
      throw new Error(`Failed to load page (HTTP ${response.status})`)
    }

    markdown.value = await response.text()
    activeTab.value = 'raw'
    loadMarked()
  } catch (e) {
    error.value =
      e instanceof Error ? e.message : 'An error occurred. Please check the URL and try again.'
  } finally {
    isLoading.value = false
  }
}

function downloadMarkdown() {
  const blob = new Blob([markdown.value], { type: 'text/markdown;charset=utf-8' })
  const anchor = document.createElement('a')
  const objectUrl = URL.createObjectURL(blob)
  anchor.href = objectUrl

  try {
    const domain = new URL(url.value).hostname.replace(/^www\./, '')
    anchor.download = `${domain}.md`
  } catch {
    anchor.download = 'output.md'
  }

  anchor.click()
  URL.revokeObjectURL(objectUrl)
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
    convert()
  }
}

const steps = [
  {
    icon: 'lucide:link',
    title: 'Enter URL',
    desc: 'Paste any webpage URL — blog posts, documentation, news articles all work.',
  },
  {
    icon: 'lucide:sparkles',
    title: 'Convert',
    desc: 'Content is extracted and converted to clean Markdown via the Jina Reader API.',
  },
  {
    icon: 'lucide:download',
    title: 'Download',
    desc: 'Preview instantly, copy to clipboard, or download as a .md file.',
  },
]
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary">
    <!-- Header -->
    <header class="border-b border-border-default sticky top-0 z-10 bg-bg-deep/90 backdrop-blur">
      <div class="mx-auto flex max-w-5xl items-center justify-between px-6 py-3.5">
        <RouterLink
          to="/"
          class="flex items-center gap-2 font-display text-sm tracking-wide text-text-secondary transition-colors hover:text-accent-coral"
          aria-label="Back to homepage"
        >
          <Icon icon="lucide:arrow-left" class="size-4" />
          Home
        </RouterLink>
        <div class="flex items-center gap-2">
          <Icon icon="lucide:file-down" class="size-4 text-accent-coral" />
          <span class="font-display text-sm font-semibold tracking-wide">HTML → MD</span>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-5xl px-6 py-10">
      <!-- Hero -->
      <div class="mb-10 animate-fade-up">
        <div class="mb-3 flex items-center gap-3">
          <span class="font-display text-sm tracking-widest text-accent-coral">//</span>
          <span class="font-display text-sm tracking-widest text-text-dim uppercase">Tool</span>
        </div>
        <h1 class="mb-3 font-display text-4xl font-bold text-text-primary md:text-5xl">
          HTML <span class="text-accent-coral">→</span> Markdown
        </h1>
        <p class="max-w-xl text-lg text-text-secondary">
          Enter a website URL, click
          <span class="font-semibold text-accent-amber">Convert</span> — content is converted to
          clean Markdown instantly.
        </p>
      </div>

      <!-- URL Input -->
      <div class="mb-6 animate-fade-up animate-delay-2">
        <div class="flex">
          <div class="relative flex-1">
            <div class="pointer-events-none absolute inset-y-0 left-4 flex items-center">
              <Icon icon="lucide:globe" class="size-4 text-text-dim" />
            </div>
            <input
              v-model="url"
              type="url"
              placeholder="https://example.com/article"
              class="w-full border border-r-0 border-border-default bg-bg-surface py-3.5 pl-11 pr-4 font-body text-sm text-text-primary placeholder-text-dim transition-colors focus:border-accent-coral focus:outline-none"
              :class="{ 'border-red-500': isValidUrl === false }"
              aria-label="Website URL to convert"
              @keydown="handleKeydown"
            />
          </div>
          <button
            :disabled="isLoading || !url.trim()"
            class="flex items-center gap-2 whitespace-nowrap bg-accent-coral px-6 py-3.5 font-display text-sm font-semibold tracking-wide text-bg-deep transition-all hover:bg-accent-coral/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Convert to Markdown"
            @click="convert"
          >
            <Icon v-if="isLoading" icon="lucide:loader-2" class="size-4 animate-spin" />
            <Icon v-else icon="lucide:sparkles" class="size-4" />
            {{ isLoading ? 'Processing…' : 'Convert' }}
          </button>
        </div>

        <div class="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p v-if="isValidUrl === false" class="flex items-center gap-1 text-xs text-red-400">
            <Icon icon="lucide:alert-circle" class="size-3" />
            Invalid URL — e.g. https://example.com/article
          </p>
          <p v-else class="text-xs text-text-dim">
            Press
            <kbd
              class="rounded-sm border border-border-default bg-bg-elevated px-1.5 py-0.5 font-mono text-xs"
              >Ctrl+Enter</kbd
            >
            to convert quickly
          </p>
        </div>
      </div>

      <!-- Error -->
      <div
        v-if="error"
        class="mb-6 flex items-start gap-3 border border-red-500/30 bg-red-500/5 p-4 animate-fade-up"
      >
        <Icon icon="lucide:x-circle" class="mt-0.5 size-5 shrink-0 text-red-400" />
        <div>
          <p class="text-sm font-semibold text-red-400">An error occurred</p>
          <p class="mt-0.5 text-sm text-text-secondary">{{ error }}</p>
        </div>
      </div>

      <!-- Loading skeleton -->
      <div v-if="isLoading" class="space-y-3 animate-fade-up">
        <div class="border border-border-default bg-bg-surface p-6">
          <div class="space-y-3">
            <div class="h-4 w-3/4 animate-pulse bg-bg-elevated" />
            <div class="h-4 w-full animate-pulse bg-bg-elevated" />
            <div class="h-4 w-5/6 animate-pulse bg-bg-elevated" />
            <div class="h-4 w-4/6 animate-pulse bg-bg-elevated" />
            <div class="h-4 w-full animate-pulse bg-bg-elevated" />
            <div class="h-4 w-2/3 animate-pulse bg-bg-elevated" />
          </div>
        </div>
        <p class="text-center text-xs text-text-dim">Loading and converting content…</p>
      </div>

      <!-- Results -->
      <div v-if="hasResult && !isLoading" class="animate-fade-up">
        <!-- Toolbar -->
        <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
          <!-- Tabs + stats -->
          <div class="flex flex-wrap items-center gap-4">
            <div class="flex border border-border-default">
              <button
                class="flex items-center gap-1.5 px-4 py-2 font-display text-sm tracking-wide transition-colors"
                :class="
                  activeTab === 'raw'
                    ? 'bg-accent-coral text-bg-deep font-semibold'
                    : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
                "
                @click="activeTab = 'raw'"
              >
                <Icon icon="lucide:code-2" class="size-3.5" />
                Raw
              </button>
              <button
                class="flex items-center gap-1.5 px-4 py-2 font-display text-sm tracking-wide transition-colors"
                :class="
                  activeTab === 'preview'
                    ? 'bg-accent-coral text-bg-deep font-semibold'
                    : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
                "
                @click="activeTab = 'preview'"
              >
                <Icon icon="lucide:eye" class="size-3.5" />
                Preview
              </button>
            </div>

            <div class="flex items-center gap-3 text-xs text-text-dim">
              <span class="flex items-center gap-1">
                <Icon icon="lucide:file-text" class="size-3" />
                {{ charCount.toLocaleString() }} chars
              </span>
              <span class="flex items-center gap-1">
                <Icon icon="lucide:align-left" class="size-3" />
                {{ wordCount.toLocaleString() }} words
              </span>
              <span class="flex items-center gap-1">
                <Icon icon="lucide:list" class="size-3" />
                {{ lineCount.toLocaleString() }} lines
              </span>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2">
            <button
              class="flex items-center gap-1.5 border border-border-default px-3 py-1.5 font-display text-xs text-text-secondary transition-all hover:border-accent-coral hover:text-text-primary"
              :aria-label="copied ? 'Copied!' : 'Copy Markdown'"
              @click="copy(markdown)"
            >
              <Icon :icon="copied ? 'lucide:check' : 'lucide:copy'" class="size-3.5" />
              {{ copied ? 'Copied!' : 'Copy' }}
            </button>
            <button
              class="flex items-center gap-1.5 border border-accent-coral px-3 py-1.5 font-display text-xs text-accent-coral transition-all hover:bg-accent-coral hover:text-bg-deep"
              aria-label="Download Markdown file"
              @click="downloadMarkdown"
            >
              <Icon icon="lucide:download" class="size-3.5" />
              Download .md
            </button>
          </div>
        </div>

        <!-- Raw panel -->
        <div v-if="activeTab === 'raw'" class="border border-border-default bg-bg-surface">
          <div
            class="flex items-center gap-2 border-b border-border-default bg-bg-elevated px-4 py-2"
          >
            <Icon icon="lucide:file-code" class="size-3.5 text-accent-amber" />
            <span class="font-mono text-xs text-text-dim">output.md</span>
          </div>
          <pre
            class="max-h-[600px] overflow-auto p-5 font-mono text-sm leading-relaxed text-text-secondary whitespace-pre-wrap"
            >{{ markdown }}</pre
          >
        </div>

        <!-- Preview panel -->
        <div v-else class="border border-border-default bg-bg-surface">
          <div
            class="flex items-center gap-2 border-b border-border-default bg-bg-elevated px-4 py-2"
          >
            <Icon icon="lucide:eye" class="size-3.5 text-accent-sky" />
            <span class="font-mono text-xs text-text-dim">Preview</span>
            <span
              v-if="!isMarkedLoaded"
              class="ml-auto flex items-center gap-1 text-xs text-text-dim"
            >
              <Icon icon="lucide:loader-2" class="size-3 animate-spin" />
              Loading renderer…
            </span>
          </div>
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div class="md-preview max-h-[600px] overflow-auto p-6" v-html="previewHtml" />
        </div>
      </div>

      <!-- How it works (empty state) -->
      <div v-if="!hasResult && !isLoading" class="mt-14 animate-fade-up animate-delay-3">
        <h2
          class="mb-6 flex items-center gap-3 font-display text-xl font-semibold text-text-primary"
        >
          <span class="font-display text-sm tracking-widest text-accent-sky">//</span>
          How It Works
        </h2>
        <div class="grid gap-5 sm:grid-cols-3">
          <div
            v-for="(step, i) in steps"
            :key="i"
            class="border border-border-default bg-bg-surface p-5 transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated"
          >
            <div class="mb-3 flex items-center gap-2">
              <div
                class="flex size-8 items-center justify-center border border-accent-coral/30 bg-accent-coral/10"
              >
                <Icon :icon="step.icon" class="size-4 text-accent-coral" />
              </div>
              <span class="font-display text-lg font-bold text-accent-coral">0{{ i + 1 }}</span>
            </div>
            <h3 class="mb-1 font-display text-base font-semibold text-text-primary">
              {{ step.title }}
            </h3>
            <p class="text-sm leading-relaxed text-text-secondary">{{ step.desc }}</p>
          </div>
        </div>

        <!-- Disclaimer -->
        <div
          class="mt-8 flex items-start gap-3 border border-accent-amber/20 bg-accent-amber/5 p-4"
        >
          <Icon icon="lucide:info" class="mt-0.5 size-4 shrink-0 text-accent-amber" />
          <p class="text-sm text-text-secondary">
            This tool uses the
            <a
              href="https://jina.ai/reader"
              target="_blank"
              rel="noopener noreferrer"
              class="text-accent-sky hover:underline"
              >Jina Reader API</a
            >
            to extract content — free, no API key required. Some pages may be blocked due to their
            bot-protection mechanisms.
          </p>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* Markdown preview typography */
.md-preview :deep(h1) {
  font-family: var(--font-display);
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  border-bottom: 1px solid var(--color-border-default);
  padding-bottom: 0.5rem;
}

.md-preview :deep(h2) {
  font-family: var(--font-display);
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--color-accent-coral);
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
}

.md-preview :deep(h3) {
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-top: 1.25rem;
  margin-bottom: 0.5rem;
}

.md-preview :deep(h4),
.md-preview :deep(h5),
.md-preview :deep(h6) {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-top: 1rem;
  margin-bottom: 0.375rem;
}

.md-preview :deep(p) {
  color: var(--color-text-secondary);
  line-height: 1.75;
  margin-bottom: 0.875rem;
}

.md-preview :deep(a) {
  color: var(--color-accent-sky);
  text-decoration: none;
}

.md-preview :deep(a:hover) {
  text-decoration: underline;
}

.md-preview :deep(strong) {
  color: var(--color-text-primary);
  font-weight: 600;
}

.md-preview :deep(em) {
  color: var(--color-text-secondary);
  font-style: italic;
}

.md-preview :deep(code) {
  background-color: var(--color-bg-elevated);
  color: var(--color-accent-amber);
  padding: 0.125rem 0.375rem;
  font-size: 0.875em;
  font-family: monospace;
}

.md-preview :deep(pre) {
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-border-default);
  padding: 1rem 1.25rem;
  overflow-x: auto;
  margin-bottom: 1rem;
}

.md-preview :deep(pre code) {
  background: none;
  padding: 0;
  font-size: 0.8125rem;
  color: var(--color-accent-amber);
}

.md-preview :deep(blockquote) {
  border-left: 3px solid var(--color-accent-coral);
  padding-left: 1rem;
  margin: 1rem 0;
  color: var(--color-text-secondary);
  font-style: italic;
}

.md-preview :deep(ul) {
  list-style: disc;
  padding-left: 1.5rem;
  margin-bottom: 0.875rem;
  color: var(--color-text-secondary);
}

.md-preview :deep(ol) {
  list-style: decimal;
  padding-left: 1.5rem;
  margin-bottom: 0.875rem;
  color: var(--color-text-secondary);
}

.md-preview :deep(li) {
  margin-bottom: 0.25rem;
  line-height: 1.6;
}

.md-preview :deep(hr) {
  border: none;
  border-top: 1px solid var(--color-border-default);
  margin: 1.5rem 0;
}

.md-preview :deep(img) {
  max-width: 100%;
  height: auto;
  margin: 0.75rem 0;
}

.md-preview :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.md-preview :deep(th) {
  background-color: var(--color-bg-elevated);
  color: var(--color-text-primary);
  padding: 0.5rem 0.75rem;
  text-align: left;
  border: 1px solid var(--color-border-default);
  font-family: var(--font-display);
  font-weight: 600;
}

.md-preview :deep(td) {
  color: var(--color-text-secondary);
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border-default);
}

.md-preview :deep(tr:hover td) {
  background-color: var(--color-bg-elevated);
}
</style>
