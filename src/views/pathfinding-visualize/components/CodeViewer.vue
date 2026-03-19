<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { algorithmCode } from '../data/algorithmCode'

const props = defineProps<{
  algorithm: string
}>()

const html = ref('')

watchEffect(async () => {
  const code = algorithmCode[props.algorithm as keyof typeof algorithmCode] ?? ''

  const { createHighlighterCore } = await import('shiki/core')
  const { createJavaScriptRegexEngine } = await import('shiki/engine/javascript')
  const highlighter = await createHighlighterCore({
    themes: [import('@shikijs/themes/github-dark')],
    langs: [import('@shikijs/langs/javascript')],
    engine: createJavaScriptRegexEngine(),
  })
  html.value = highlighter.codeToHtml(code, {
    lang: 'javascript',
    theme: 'github-dark',
  })
})
</script>

<template>
  <div
    class="text-sm overflow-auto p-4 text-text-secondary font-mono [&_pre]:bg-transparent! [&_pre]:p-0! [&_pre]:text-inherit"
    v-html="html"
  />
</template>
