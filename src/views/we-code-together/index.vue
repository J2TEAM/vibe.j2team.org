<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick, shallowRef } from 'vue'
import { Icon } from '@iconify/vue'
import { useClipboard } from '@vueuse/core'
import type { HighlighterCore } from 'shiki/core'

// 1. STATE
const code = ref('// Start coding...')
const highlightedHtml = ref('')
const { copy, copied } = useClipboard()

// Use shallowRef and the proper Highlighter type instead of 'any'
const highlighter = shallowRef<HighlighterCore | null>(null)

const textareaRef = ref<HTMLTextAreaElement | null>(null)
const preContainerRef = ref<HTMLDivElement | null>(null)
const gutterRef = ref<HTMLDivElement | null>(null)

onMounted(async () => {
  const [{ createHighlighterCore }, { createJavaScriptRegexEngine }] = await Promise.all([
    import('shiki/core'),
    import('shiki/engine/javascript'),
  ])
  // Switching to 'vitesse-dark' for much better colors
  highlighter.value = await createHighlighterCore({
    themes: [import('@shikijs/themes/vitesse-dark')],
    langs: [
      import('@shikijs/langs/typescript'),
      import('@shikijs/langs/javascript'),
      import('@shikijs/langs/html'),
      import('@shikijs/langs/css'),
      import('@shikijs/langs/java'),
      import('@shikijs/langs/python'),
      import('@shikijs/langs/json'),
    ],
    engine: createJavaScriptRegexEngine(),
  })
  updateHighlight()

  const hash = window.location.hash
  if (hash.startsWith('#doc=')) {
    try {
      const encoded = hash.replace('#doc=', '')
      code.value = decodeURIComponent(escape(atob(encoded)))
    } catch (e) {
      console.error('URL Load failed' + e)
    }
  }
})

const updateHighlight = () => {
  if (highlighter.value) {
    // Defaulting to 'typescript' makes variables/constants look much better
    highlightedHtml.value = highlighter.value.codeToHtml(code.value, {
      lang: 'typescript',
      theme: 'vitesse-dark',
    })
  }
}

const handleScroll = () => {
  if (textareaRef.value) {
    const top = textareaRef.value.scrollTop
    const left = textareaRef.value.scrollLeft
    if (gutterRef.value) gutterRef.value.scrollTop = top
    if (preContainerRef.value) {
      preContainerRef.value.scrollTop = top
      preContainerRef.value.scrollLeft = left
    }
  }
}

const handleTab = (e: KeyboardEvent) => {
  if (e.key === 'Tab') {
    e.preventDefault()
    const start = textareaRef.value!.selectionStart
    const end = textareaRef.value!.selectionEnd
    code.value = code.value.substring(0, start) + '  ' + code.value.substring(end)
    nextTick(() => {
      textareaRef.value!.selectionStart = textareaRef.value!.selectionEnd = start + 2
      updateHighlight()
    })
  }
}

onBeforeUnmount(() => {
  highlighter.value?.dispose()
})

watch(code, () => {
  updateHighlight()
  try {
    const encoded = btoa(unescape(encodeURIComponent(code.value)))
    window.history.replaceState(null, '', `#doc=${encoded}`)
  } catch {
    /* Limit check */
  }
})

const handleShare = () => copy(window.location.href)
</script>

<template>
  <div class="h-screen flex flex-col bg-[#050505] text-gray-300 font-sans overflow-hidden">
    <header
      class="h-12 flex items-center justify-between px-6 bg-[#0a0a0a] border-b border-white/5 z-30 shadow-2xl"
    >
      <div class="flex items-center gap-4">
        <a href="/" class="p-1.5 hover:bg-white/5 rounded-full transition-colors text-gray-500">
          <Icon icon="lucide:chevron-left" class="w-4 h-4" />
        </a>
        <h1 class="font-bold text-gray-100 text-sm tracking-tight flex items-center gap-2">
          WeCode
          <span
            class="text-[9px] px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-md border border-blue-500/30 font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(59,130,246,0.2)]"
            >Together</span
          >
        </h1>
      </div>

      <button
        @click="handleShare"
        class="bg-blue-600 hover:bg-blue-500 text-white px-5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.3)] active:scale-95 transition-all"
      >
        <Icon :icon="copied ? 'lucide:check' : 'lucide:link-2'" class="w-3.5 h-3.5" />
        {{ copied ? 'Link Copied' : 'Share Code' }}
      </button>
    </header>

    <main class="flex-1 flex flex-col items-center p-2 md:pt-4 bg-[#050505]">
      <div
        class="w-full max-w-4xl h-[82vh] bg-[#121212] rounded-2xl border border-white/10 flex shadow-[0_0_60px_rgba(0,0,0,0.8)] overflow-hidden relative"
      >
        <div
          ref="gutterRef"
          class="w-12 pt-8 pb-8 text-right pr-3 select-none font-mono text-[11px] leading-6 bg-[#121212] border-r border-white/5 opacity-10 overflow-hidden z-20"
        >
          <div v-for="n in code.split('\n').length" :key="n" class="text-gray-400">{{ n }}</div>
        </div>

        <div class="flex-1 relative overflow-hidden bg-transparent">
          <div
            ref="preContainerRef"
            class="absolute inset-0 p-8 font-mono text-[15px] leading-6 pointer-events-none overflow-hidden whitespace-pre shiki-renderer z-0"
            v-html="highlightedHtml"
          ></div>

          <textarea
            ref="textareaRef"
            v-model="code"
            @scroll="handleScroll"
            @keydown="handleTab"
            spellcheck="false"
            class="absolute inset-0 w-full h-full p-8 font-mono text-[15px] outline-none resize-none bg-transparent leading-6 text-transparent caret-blue-400 block whitespace-pre overflow-auto code-scrollbar z-10"
            placeholder="// Paste your code here..."
          ></textarea>
        </div>
      </div>
      <p class="text-[9px] text-gray-800 mt-4 uppercase tracking-[0.3em] font-bold">
        Vitesse Dark Edition • Encoded via URL Hash
      </p>
    </main>
  </div>
</template>

<style scoped>
/* Force Pro Typography */
textarea,
.shiki-renderer :deep(pre),
.font-mono {
  font-family: 'JetBrains Mono', 'Fira Code', 'Menlo', 'Consolas', monospace !important;
  font-size: 14.5px !important; /* Slightly smaller looks "sharper" */
  line-height: 24px !important;
}

.shiki-renderer :deep(pre) {
  background-color: transparent !important;
  margin: 0 !important;
  padding: 0 !important;
}

textarea {
  color: transparent !important;
  -webkit-text-fill-color: transparent;
}

/* Vibrant Scrollbar */
.code-scrollbar::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}
.code-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  border: 3px solid #121212;
}
.code-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.15);
}

/* Subtle Glow for the whole editor */
.shiki-renderer {
  filter: saturate(1.2); /* Makes colors punchier */
}
</style>
