<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { FileSystem } from './domain/FileSystem'
import { CommandExecutor, type OutputLine } from './domain/CommandExecutor'
import TerminalWindow from './components/TerminalWindow.vue'
import TerminalPrompt from './components/TerminalPrompt.vue'

// ---- Core state ----------------------------------------------------------
const fs = new FileSystem()
const executor = new CommandExecutor(fs)

const lines = ref<OutputLine[]>([])
const currentInput = ref('')
const promptRef = ref<InstanceType<typeof TerminalPrompt> | null>(null)
const scrollRef = ref<HTMLDivElement | null>(null)

// History navigation
const historyIndex = ref(-1)

// Boot sequence shown on mount
const BOOT_LINES: OutputLine[] = [
  { id: -10, type: 'info', text: '  ██╗     ██╗███╗   ██╗██╗   ██╗██╗  ██╗' },
  { id: -9,  type: 'info', text: '  ██║     ██║████╗  ██║██║   ██║╚██╗██╔╝' },
  { id: -8,  type: 'info', text: '  ██║     ██║██╔██╗ ██║██║   ██║ ╚███╔╝ ' },
  { id: -7,  type: 'info', text: '  ██║     ██║██║╚██╗██║██║   ██║ ██╔██╗ ' },
  { id: -6,  type: 'info', text: '  ███████╗██║██║ ╚████║╚██████╔╝██╔╝ ██╗' },
  { id: -5,  type: 'info', text: '  ╚══════╝╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚═╝  ╚═╝' },
  { id: -4,  type: 'output', text: '' },
  { id: -3,  type: 'success', text: '  Linux Terminal Simulator v1.0 — vibe.j2team.org' },
  { id: -2,  type: 'output', text: '  Gõ "help" để xem danh sách lệnh. Tab để autocomplete. ↑↓ lịch sử.' },
  { id: -1,  type: 'output', text: '' },
]

// ---- Scroll to bottom ----------------------------------------------------
async function scrollBottom() {
  await nextTick()
  if (scrollRef.value) {
    scrollRef.value.scrollTop = scrollRef.value.scrollHeight
  }
}

// ---- Command submit -------------------------------------------------------
function submitCommand(value: string) {
  const trimmed = value.trim()

  // Ensure prompt gets the updated value before clearing
  currentInput.value = ''
  historyIndex.value = -1

  if (!trimmed) {
    // Empty enter — just show blank prompt line
    lines.value.push({ id: Date.now(), type: 'command', text: '', prompt: executor.getPrompt() })
    scrollBottom()
    return
  }

  const newLines = executor.execute(trimmed)

  // Check for clear signal
  if (newLines.some(l => l.text === '__CLEAR__')) {
    lines.value = []
    scrollBottom()
    return
  }

  lines.value.push(...newLines)
  scrollBottom()
}

// ---- Tab autocomplete ----------------------------------------------------
function handleTab() {
  const parts = currentInput.value.split(' ')
  const suggestions = executor.autocomplete(currentInput.value)

  if (suggestions.length === 0) return
  if (suggestions.length === 1) {
    parts[parts.length - 1] = suggestions[0] ?? ''
    currentInput.value = parts.join(' ')
    return
  }

  // Show suggestions
  lines.value.push({
    id: Date.now(),
    type: 'output',
    text: suggestions.join('  '),
  })
  scrollBottom()
}

// ---- History navigation --------------------------------------------------
function historyUp() {
  const history = executor.getHistory()
  if (history.length === 0) return
  if (historyIndex.value === -1) {
    historyIndex.value = history.length - 1
  } else if (historyIndex.value > 0) {
    historyIndex.value--
  }
  currentInput.value = history[historyIndex.value] ?? ''
}

function historyDown() {
  const history = executor.getHistory()
  if (historyIndex.value === -1) return
  if (historyIndex.value < history.length - 1) {
    historyIndex.value++
    currentInput.value = history[historyIndex.value] ?? ''
  } else {
    historyIndex.value = -1
    currentInput.value = ''
  }
}

// ---- Ctrl+C interrupt ----------------------------------------------------
function handleInterrupt() {
  lines.value.push({
    id: Date.now(),
    type: 'command',
    text: currentInput.value + '^C',
    prompt: executor.getPrompt(),
  })
  currentInput.value = ''
  historyIndex.value = -1
  scrollBottom()
}

// ---- Click anywhere to focus input ---------------------------------------
function focusInput() {
  promptRef.value?.focus()
}

// ---- Global keyboard listener -------------------------------------------
function onGlobalKeydown(e: KeyboardEvent) {
  // If user presses printable key and focus is not already on input, focus it
  if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
    const active = document.activeElement
    if (active?.tagName !== 'INPUT' && active?.tagName !== 'TEXTAREA') {
      focusInput()
    }
  }
}

// ---- Current prompt computed ---------------------------------------------
const currentPrompt = computed(() => executor.getPrompt())

// ---- Lifecycle -----------------------------------------------------------
onMounted(() => {
  lines.value = [...BOOT_LINES]
  scrollBottom()
  focusInput()
  window.addEventListener('keydown', onGlobalKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onGlobalKeydown)
})
</script>

<template>
  <div
    class="h-screen w-full bg-[#0d1117] flex flex-col overflow-hidden select-none font-mono"
    @click="focusInput"
  >
    <!-- Title bar (macOS-style with linux feel) -->
    <div
      class="shrink-0 h-9 bg-[#161b22] border-b border-[#30363d] flex items-center px-4 gap-3"
    >
      <!-- Traffic lights -->
      <div class="flex items-center gap-1.5">
        <RouterLink
          to="/"
          class="w-3 h-3 rounded-full bg-[#ff5f56] hover:brightness-110 transition flex items-center justify-center group"
          title="Về trang chủ"
        >
          <span class="text-[7px] text-[#800000] opacity-0 group-hover:opacity-100 font-bold leading-none">×</span>
        </RouterLink>
        <div class="w-3 h-3 rounded-full bg-[#ffbd2e]" />
        <div class="w-3 h-3 rounded-full bg-[#27c93f]" />
      </div>

      <!-- Title -->
      <div class="flex-1 text-center text-xs text-[#8b949e] tracking-wide select-none">
        user@vibe-machine: {{ fs.cwdDisplay() }} — bash
      </div>

      <!-- Shortcuts hint -->
      <div class="text-[10px] text-[#484f58] hidden sm:block">
        Tab: autocomplete &nbsp;|&nbsp; ↑↓: history &nbsp;|&nbsp; Ctrl+C: interrupt
      </div>
    </div>

    <!-- Terminal body -->
    <div
      ref="scrollRef"
      class="flex-1 overflow-y-auto bg-[#0d1117] px-4 py-3"
      style="scrollbar-width: thin; scrollbar-color: #30363d transparent;"
    >
      <!-- Output history -->
      <TerminalWindow
        :lines="lines"
        :prompt="currentPrompt"
        :current-input="currentInput"
      />

      <!-- Active prompt line -->
      <TerminalPrompt
        ref="promptRef"
        :lines="lines"
        :prompt="currentPrompt"
        :input="currentInput"
        @submit="submitCommand"
        @update:input="currentInput = $event"
        @tab="handleTab"
        @history-up="historyUp"
        @history-down="historyDown"
        @interrupt="handleInterrupt"
      />

      <!-- Invisible spacer so last line is never hidden under scroll -->
      <div class="h-4" />
    </div>

    <!-- Status bar -->
    <div
      class="shrink-0 h-6 bg-[#161b22] border-t border-[#30363d] flex items-center px-4 gap-4 text-[10px] text-[#484f58]"
    >
      <span>🐧 Arch Linux</span>
      <span>bash 5.2.21</span>
      <span class="text-emerald-600">● UTF-8</span>
      <span class="ml-auto">{{ lines.length }} lines</span>
    </div>
  </div>
</template>

<style scoped>
/* Custom scrollbar for terminal body */
div::-webkit-scrollbar {
  width: 6px;
}
div::-webkit-scrollbar-track {
  background: transparent;
}
div::-webkit-scrollbar-thumb {
  background: #30363d;
  border-radius: 3px;
}
div::-webkit-scrollbar-thumb:hover {
  background: #484f58;
}
</style>
