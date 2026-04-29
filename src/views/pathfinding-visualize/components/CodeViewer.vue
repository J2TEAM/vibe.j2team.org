<script setup lang="ts">
import { ref, watch, onBeforeUnmount, shallowRef } from 'vue'
import type { HighlighterCore } from 'shiki/core'
import { algorithmCode } from '../data/algorithmCode'

const props = defineProps<{
  algorithm: string
}>()

const html = ref('')
const highlighter = shallowRef<HighlighterCore | null>(null)

async function ensureHighlighter() {
  if (highlighter.value) return highlighter.value
  const [{ createHighlighterCore }, { createJavaScriptRegexEngine }] = await Promise.all([
    import('shiki/core'),
    import('shiki/engine/javascript'),
  ])
  highlighter.value = await createHighlighterCore({
    themes: [import('@shikijs/themes/github-dark')],
    langs: [import('@shikijs/langs/javascript')],
    engine: createJavaScriptRegexEngine(),
  })
  return highlighter.value
}

watch(
  () => props.algorithm,
  async (algo) => {
    const code = algorithmCode[algo as keyof typeof algorithmCode] ?? ''
    const hl = await ensureHighlighter()
    html.value = hl.codeToHtml(code, { lang: 'javascript', theme: 'github-dark' })
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  highlighter.value?.dispose()
})
</script>

<template>
  <div
    class="text-sm overflow-auto p-4 text-text-secondary font-mono [&_pre]:bg-transparent! [&_pre]:p-0! [&_pre]:text-inherit"
    v-html="html"
  />
</template>
