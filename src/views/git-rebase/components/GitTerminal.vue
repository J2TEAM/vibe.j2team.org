<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Icon } from '@iconify/vue'

defineProps<{
  history: string[]
}>()

const emit = defineEmits<{
  (e: 'command', cmd: string): void
}>()

const input = ref('')
const terminalRef = ref<HTMLElement | null>(null)
const logContainerRef = ref<HTMLElement | null>(null)

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    if (input.value.trim()) {
      emit('command', input.value)
      input.value = ''
      scrollToBottom()
    }
  }
}

const scrollToBottom = () => {
  setTimeout(() => {
    if (logContainerRef.value) {
      logContainerRef.value.scrollTop = logContainerRef.value.scrollHeight
    }
  }, 0)
}

onMounted(() => {
  terminalRef.value?.focus()
})
</script>

<template>
  <div
    class="flex flex-col h-[300px] bg-bg-deep border border-border-default font-mono text-sm overflow-hidden shadow-sm"
  >
    <!-- Terminal Header -->
    <div
      class="flex items-center justify-between px-4 py-2 border-b border-border-default bg-bg-surface"
    >
      <div class="flex items-center gap-3">
        <span class="text-accent-amber font-display text-xs tracking-widest">//</span>
        <span class="text-[10px] uppercase font-display tracking-widest text-text-dim"
          >Terminal / Output</span
        >
      </div>
      <Icon icon="lucide:terminal" class="text-text-dim size-3" />
    </div>

    <!-- Logs container -->
    <div ref="logContainerRef" class="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-thin">
      <div v-for="(line, i) in history" :key="i" class="flex gap-3">
        <span class="text-text-dim shrink-0">$</span>
        <span :class="line.startsWith('Error') ? 'text-red-400' : 'text-text-primary'">{{
          line
        }}</span>
      </div>

      <!-- Input line -->
      <div class="flex items-center gap-3">
        <span class="text-accent-coral font-bold shrink-0">$</span>
        <input
          ref="terminalRef"
          v-model="input"
          @keydown="handleKeyDown"
          class="flex-1 bg-transparent border-none outline-none text-accent-sky caret-accent-coral"
          type="text"
          spellcheck="false"
          placeholder="type git command..."
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
input::placeholder {
  color: var(--color-text-dim);
  opacity: 0.3;
}
</style>
