<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body relative">
    <!-- Header -->
    <header
      class="w-full flex items-center justify-between px-6 py-4 border-b border-border-default animate-fade-up"
    >
      <RouterLink
        to="/"
        class="font-display text-sm tracking-widest text-text-secondary hover:text-accent-coral transition-colors"
      >
        HOME
      </RouterLink>
      <div
        class="bg-accent-coral text-bg-deep font-display font-bold text-xs tracking-widest px-3 py-1.5 rotate-3"
      >
        VOL.01 / 2026
      </div>
    </header>

    <main class="max-w-4xl mx-auto px-6 py-12">
      <!-- Tiêu đề -->
      <div class="text-center mb-10 animate-fade-up">
        <h1 class="font-display text-5xl md:text-7xl font-bold tracking-tight">
          <span class="text-accent-coral font-display text-sm tracking-widest block mb-2">//</span>
          <span class="text-text-primary">Senior</span>
          <span class="text-accent-amber">_Dev</span>
          <span class="text-accent-coral">.exe</span>
        </h1>
        <p class="mt-4 text-text-secondary text-lg">
          Terminal giả lập — Gõ lệnh, bị Senior mắng miễn phí.
        </p>
        <p class="mt-1 text-text-dim text-sm italic">
          "15 năm kinh nghiệm. 10 năm stress. 5 năm muốn nghỉ việc."
        </p>
      </div>

      <!-- Terminal -->
      <div
        class="border border-border-default bg-bg-surface animate-fade-up animate-delay-1 relative"
      >
        <!-- Terminal header -->
        <div
          class="flex items-center justify-between px-4 py-2.5 border-b border-border-default bg-bg-elevated"
        >
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-accent-coral"></span>
            <span class="w-3 h-3 rounded-full bg-accent-amber"></span>
            <span class="w-3 h-3 rounded-full bg-accent-sky"></span>
          </div>
          <span class="font-display text-xs tracking-widest text-text-dim">
            SENIOR_DEV_SIMULATOR.EXE
          </span>
          <span class="font-display text-xs tracking-widest text-accent-coral">
            {{ commandCount }} cmds
          </span>
        </div>

        <!-- Terminal body -->
        <div
          ref="terminalBody"
          class="p-4 md:p-6 h-[500px] overflow-y-auto font-mono text-sm leading-relaxed terminal-scroll"
        >
          <!-- Welcome message -->
          <div v-for="(line, i) in welcomeDisplay" :key="'w' + i" class="text-accent-sky">
            {{ line }}
          </div>

          <!-- Lịch sử lệnh -->
          <div v-for="(entry, i) in terminalHistory" :key="'h' + i" class="mt-2">
            <!-- User input -->
            <div class="flex items-start gap-2">
              <span class="text-accent-amber font-bold select-none">junior@dev:~$</span>
              <span class="text-text-primary">{{ entry.input }}</span>
            </div>
            <!-- Senior response -->
            <div class="mt-1 pl-0">
              <span class="text-accent-coral font-bold">{{ entry.emoji }} Senior:</span>
              <span class="text-text-secondary ml-2">{{ entry.response }}</span>
              <div class="flex items-center gap-2 mt-1">
                <span class="text-text-dim text-xs">Mức khó chịu:</span>
                <span class="text-xs">
                  <span v-for="a in 5" :key="'a' + a">{{
                    a <= entry.annoyanceLevel ? '😤' : '·'
                  }}</span>
                </span>
              </div>
            </div>
          </div>

          <!-- Typing indicator -->
          <div v-if="isTyping" class="mt-2">
            <div class="flex items-start gap-2">
              <span class="text-accent-amber font-bold select-none">junior@dev:~$</span>
              <span class="text-text-primary">{{ currentInput }}</span>
            </div>
            <div class="mt-1 flex items-center gap-1">
              <span class="text-accent-coral font-bold">Senior:</span>
              <span class="text-text-dim ml-2 animate-pulse">đang gõ...</span>
            </div>
          </div>

          <!-- Input hiện tại (khi chưa submit) -->
          <div v-if="!isTyping" class="mt-2 flex items-start gap-2">
            <span class="text-accent-amber font-bold select-none">junior@dev:~$</span>
            <span class="text-accent-coral animate-pulse">▌</span>
          </div>
        </div>

        <!-- Input bar -->
        <div class="border-t border-border-default bg-bg-deep/50 px-4 py-3 flex items-center gap-3">
          <span class="text-accent-amber font-mono text-sm font-bold select-none whitespace-nowrap"
            >junior@dev:~$</span
          >
          <input
            ref="inputEl"
            v-model="currentInput"
            type="text"
            class="flex-1 bg-transparent text-text-primary font-mono text-sm outline-none placeholder:text-text-dim"
            placeholder="Gõ lệnh hoặc câu hỏi..."
            :disabled="isTyping"
            @keydown.enter="handleSubmit"
            @keydown.up="navigateHistory(-1)"
            @keydown.down="navigateHistory(1)"
          />
        </div>
      </div>

      <!-- Gợi ý lệnh -->
      <div class="mt-6 animate-fade-up animate-delay-2">
        <div class="flex items-center gap-3 mb-3">
          <span class="text-accent-sky font-display text-sm tracking-widest">//</span>
          <h2 class="font-display text-sm font-semibold text-text-secondary">THỬ CÁC LỆNH NÀY</h2>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="cmd in suggestedCommands"
            :key="cmd"
            class="border border-border-default bg-bg-surface px-3 py-1.5 text-xs font-mono text-text-dim transition-all duration-300 hover:border-accent-coral hover:text-accent-coral cursor-pointer"
            @click="fillCommand(cmd)"
          >
            {{ cmd }}
          </button>
        </div>
      </div>

      <!-- Chấm trang trí -->
      <div class="flex gap-1.5 justify-center mt-16 animate-fade-up animate-delay-3">
        <span v-for="n in 40" :key="n" class="w-1 h-1 rounded-full bg-border-default" />
      </div>

      <!-- Footer -->
      <div class="text-center mt-8 mb-12 animate-fade-up animate-delay-4">
        <p class="text-text-dim text-xs font-display tracking-widest">
          KHÔNG CÓ SENIOR NÀO BỊ TỔN THƯƠNG TRONG QUÁ TRÌNH LÀM APP NÀY (CHẮC VẬY)
        </p>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue'
import { commands, defaultResponses, welcomeLines } from './data/commands'

interface TerminalEntry {
  input: string
  response: string
  emoji: string
  annoyanceLevel: number
}

// Refs
const terminalBody = ref<HTMLElement | null>(null)
const inputEl = ref<HTMLInputElement | null>(null)

// State
const currentInput = ref('')
const isTyping = ref(false)
const commandCount = ref(0)
const terminalHistory = ref<TerminalEntry[]>([])
const inputHistory = ref<string[]>([])
const historyIndex = ref(-1)
const welcomeDisplay = ref<string[]>([])

// Các lệnh gợi ý
const suggestedCommands = [
  'git push -f',
  'console.log',
  'npm install',
  'deploy',
  'any',
  '!important',
  'var x = 1',
  'chatgpt',
  'help',
  'deadline',
  'bug',
  'test',
]

// Hiển thị welcome message từng dòng
const showWelcome = async () => {
  for (const line of welcomeLines) {
    welcomeDisplay.value.push(line)
    await new Promise((r) => setTimeout(r, 80))
    scrollToBottom()
  }
}

// Cuộn xuống cuối terminal
const scrollToBottom = async () => {
  await nextTick()
  if (terminalBody.value) {
    terminalBody.value.scrollTop = terminalBody.value.scrollHeight
  }
}

// Tìm câu trả lời dựa trên input
const findResponse = (
  input: string,
): { response: string; emoji: string; annoyanceLevel: number } => {
  const lowerInput = input.toLowerCase()

  // Tìm command khớp
  for (const cmd of commands) {
    for (const pattern of cmd.patterns) {
      if (lowerInput.includes(pattern.toLowerCase())) {
        const randomResponse = cmd.responses[Math.floor(Math.random() * cmd.responses.length)]!
        return {
          response: randomResponse,
          emoji: cmd.emoji,
          annoyanceLevel: cmd.annoyanceLevel,
        }
      }
    }
  }

  // Không match — dùng default
  const randomDefault = defaultResponses[Math.floor(Math.random() * defaultResponses.length)]!
  return {
    response: randomDefault,
    emoji: '🤷',
    annoyanceLevel: 2,
  }
}

// Xử lý lệnh khi nhấn Enter
const handleSubmit = async () => {
  const input = currentInput.value.trim()
  if (!input || isTyping.value) return

  // Lưu lịch sử input
  inputHistory.value.push(input)
  historyIndex.value = inputHistory.value.length

  isTyping.value = true
  const userInput = input
  currentInput.value = ''

  scrollToBottom()

  // Giả lập thời gian senior "suy nghĩ"
  const thinkTime = 800 + Math.random() * 1200
  await new Promise((r) => setTimeout(r, thinkTime))

  // Tìm response
  const result = findResponse(userInput)

  // Thêm vào lịch sử terminal
  terminalHistory.value.push({
    input: userInput,
    response: result.response,
    emoji: result.emoji,
    annoyanceLevel: result.annoyanceLevel,
  })

  commandCount.value++
  isTyping.value = false

  scrollToBottom()

  // Focus lại input
  await nextTick()
  inputEl.value?.focus()
}

// Điền lệnh gợi ý vào input
const fillCommand = (cmd: string) => {
  currentInput.value = cmd
  inputEl.value?.focus()
}

// Điều hướng lịch sử input bằng phím mũi tên
const navigateHistory = (direction: number) => {
  if (inputHistory.value.length === 0) return

  historyIndex.value += direction

  if (historyIndex.value < 0) historyIndex.value = 0
  if (historyIndex.value >= inputHistory.value.length) {
    historyIndex.value = inputHistory.value.length
    currentInput.value = ''
    return
  }

  currentInput.value = inputHistory.value[historyIndex.value] ?? ''
}

// Khởi tạo
onMounted(async () => {
  await showWelcome()
  inputEl.value?.focus()
})
</script>

<style scoped>
/* Scrollbar tối cho terminal */
.terminal-scroll::-webkit-scrollbar {
  width: 6px;
}

.terminal-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.terminal-scroll::-webkit-scrollbar-thumb {
  background: #253549;
  border-radius: 3px;
}

.terminal-scroll::-webkit-scrollbar-thumb:hover {
  background: #4a6180;
}
</style>
