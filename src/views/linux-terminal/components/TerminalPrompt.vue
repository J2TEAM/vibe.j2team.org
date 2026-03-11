<script setup lang="ts">
import { ref} from 'vue'
import type { OutputLine } from '../domain/CommandExecutor'

defineProps<{
  lines: OutputLine[]
  prompt: string
  input: string
}>()

const emit = defineEmits<{
  submit: [value: string]
  'update:input': [value: string]
  tab: []
  'history-up': []
  'history-down': []
  interrupt: []
}>()

const inputRef = ref<HTMLInputElement | null>(null)

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault()
    emit('submit', (e.target as HTMLInputElement).value)
  } else if (e.key === 'Tab') {
    e.preventDefault()
    emit('tab')
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    emit('history-up')
  } else if (e.key === 'ArrowDown') {
    e.preventDefault()
    emit('history-down')
  } else if (e.key === 'c' && e.ctrlKey) {
    e.preventDefault()
    emit('interrupt')
  } else if (e.key === 'l' && e.ctrlKey) {
    e.preventDefault()
    emit('submit', 'clear')
  }
}

function onInput(e: Event) {
  emit('update:input', (e.target as HTMLInputElement).value)
}

function focus() {
  inputRef.value?.focus()
}

defineExpose({ focus })
</script>

<template>
  <div
    class="font-mono text-sm leading-relaxed flex items-start gap-2 mt-1"
    @click="focus"
  >
    <!-- Prompt -->
    <span class="shrink-0 select-none">
      <span class="text-emerald-400 font-bold">{{ prompt.split(':')[0] }}</span>
      <span class="text-text-dim">:</span>
      <span class="text-sky-400 font-bold">{{ prompt.split(':')[1]?.split('$')[0] }}</span>
      <span class="text-text-dim">$</span>
    </span>
    <!-- Input -->
    <input
      ref="inputRef"
      :value="input"
      type="text"
      class="flex-1 bg-transparent outline-none border-none text-text-primary caret-emerald-400 min-w-0"
      autocomplete="off"
      autocorrect="off"
      autocapitalize="off"
      spellcheck="false"
      @keydown="onKeyDown"
      @input="onInput"
    />
  </div>
</template>
