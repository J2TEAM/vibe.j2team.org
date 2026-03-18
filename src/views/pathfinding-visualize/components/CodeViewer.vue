<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { codeToHtml } from 'shiki'
import { algorithmCode } from '../data/algorithmCode'

const props = defineProps<{
  algorithm: string
}>()

const html = ref('')

watchEffect(async () => {
  const code = algorithmCode[props.algorithm as keyof typeof algorithmCode] ?? ''

  html.value = await codeToHtml(code, {
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
