<script setup lang="ts">
import type { OutputLine } from '../domain/CommandExecutor'

defineProps<{
  lines: OutputLine[]
  prompt: string
  currentInput: string
}>()

// ESC char as a string constant — avoids no-control-regex lint rule
const ESC = String.fromCharCode(27)

function renderText(text: string): string {
  return text
    .split(ESC + '[bold]').join('')
    .split(ESC + '[cyan]').join('')
    .split(ESC + '[reset]').join('')
    // highlight dir entries in ls short output
    .replace(
      new RegExp(ESC.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\[dir\\](\\S+)', 'g'),
      '<span class="text-sky-400 font-bold">$1</span>',
    )
}
</script>

<template>
  <div class="flex-1 overflow-y-auto px-4 py-3 space-y-0.5 text-sm font-mono leading-relaxed">
    <template v-for="line in lines" :key="line.id">
      <!-- Command line with prompt -->
      <div v-if="line.type === 'command'" class="flex items-start gap-2">
        <span class="shrink-0 select-none whitespace-nowrap">
          <span class="text-emerald-400 font-bold">{{ line.prompt?.split(':')[0] }}</span>
          <span class="text-slate-500">:</span>
          <span class="text-sky-400 font-bold">{{ line.prompt?.split(':')[1]?.split('$')[0] }}</span>
          <span class="text-slate-500">$</span>
        </span>
        <span class="text-text-primary break-all">{{ line.text }}</span>
      </div>

      <!-- Error output -->
      <div
        v-else-if="line.type === 'error'"
        class="text-rose-400 whitespace-pre-wrap break-words pl-1"
        v-html="renderText(line.text)"
      />

      <!-- Info output -->
      <div
        v-else-if="line.type === 'info'"
        class="text-amber-400 whitespace-pre-wrap break-words pl-1"
        v-html="renderText(line.text)"
      />

      <!-- Success output -->
      <div
        v-else-if="line.type === 'success'"
        class="text-emerald-400 whitespace-pre-wrap break-words pl-1"
        v-html="renderText(line.text)"
      />

      <!-- Normal output -->
      <div
        v-else
        class="text-slate-300 whitespace-pre-wrap break-words pl-1"
        v-html="renderText(line.text)"
      />
    </template>
  </div>
</template>
