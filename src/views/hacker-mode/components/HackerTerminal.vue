<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useEventListener } from '@vueuse/core'

interface OutputLine {
  text: string
  color?: string
}

interface TerminalEntry {
  type: 'input' | 'output'
  content: string
  color?: string
}

const emit = defineEmits<{
  popup: [{ title: string; lines: string[]; type: 'info' | 'warning' | 'danger' | 'success' }]
  'command-executed': [cmd: string]
  'processing-start': [cmd: string, variant: string]
  'processing-end': []
}>()

const flashActive = ref(false)

function triggerFlash() {
  flashActive.value = true
  setTimeout(() => {
    flashActive.value = false
  }, 600)
}

const inputRef = ref<HTMLInputElement | null>(null)
const outputRef = ref<HTMLDivElement | null>(null)
const currentInput = ref('')
const history = ref<TerminalEntry[]>([])
const isProcessing = ref(false)
const commandHistory = ref<string[]>([])
const historyIndex = ref(-1)

function pushOutput(lines: OutputLine[]) {
  for (const line of lines) {
    history.value.push({
      type: 'output',
      content: line.text,
      color: line.color,
    })
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (outputRef.value) {
      outputRef.value.scrollTop = outputRef.value.scrollHeight
    }
  })
}

function randomIp() {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
}

function randomHex(len: number) {
  return Array.from({ length: len }, () => Math.floor(Math.random() * 16).toString(16)).join('')
}

async function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

// Reveals text character by character on the last pushed line
async function typeLine(text: string, color?: string, charDelay = 18) {
  const entry: TerminalEntry = { type: 'output', content: '', color }
  history.value.push(entry)
  const idx = history.value.length - 1
  for (let i = 1; i <= text.length; i++) {
    await sleep(charDelay)
    const cur = history.value[idx]
    if (cur) history.value[idx] = { ...cur, content: text.slice(0, i) }
    if (i % 8 === 0) scrollToBottom()
  }
  scrollToBottom()
}

async function hackSequence(target: string) {
  isProcessing.value = true

  // Phase 1: Type each recon step (loader is NOT yet shown — user sees the terminal build up)
  const steps = [
    { text: `[*] Kết nối tới ${target}...`, color: '#00d4ff' },
    { text: `[*] Quét cổng mở: 22, 80, 443, 8080...`, color: '#00d4ff' },
    {
      text: `[!] Phát hiện lỗ hổng CVE-2024-${Math.floor(Math.random() * 9999)}`,
      color: '#ffb830',
    },
    { text: `[*] Bắt đầu khai thác buffer overflow...`, color: '#00d4ff' },
    { text: `[*] Bypass firewall thành công`, color: '#00ff41' },
    { text: `[*] Nâng cấp đặc quyền lên root...`, color: '#00d4ff' },
    { text: `[*] Mã hóa kênh truyền: AES-256`, color: '#00d4ff' },
  ]

  for (const step of steps) {
    await typeLine(step.text, step.color)
    await sleep(Math.random() * 200 + 80)
  }

  // Phase 2: Show loading overlay while progress runs
  emit('processing-start', `hack -${target}`, 'rings')

  // Progress bar (in-terminal)
  for (let i = 0; i <= 100; i += 10) {
    const bar = '█'.repeat(i / 5) + '░'.repeat(20 - i / 5)
    const lastIdx = history.value.length - 1
    if (history.value[lastIdx]?.content.startsWith('[PROGRESS]')) {
      history.value[lastIdx] = {
        type: 'output',
        content: `[PROGRESS] [${bar}] ${i}%`,
        color: '#00ff41',
      }
    } else {
      pushOutput([{ text: `[PROGRESS] [${bar}] ${i}%`, color: '#00ff41' }])
    }
    scrollToBottom()
    await sleep(160)
  }

  // Phase 3: Done - show success popup
  const popupLines = [
    `TARGET: ${target.toUpperCase()}`,
    `IP: ${randomIp()}`,
    `Trạng thái: ĐÃ XÂM NHẬP`,
    `Token: ${randomHex(32)}`,
    `Dữ liệu: ${Math.floor(Math.random() * 999)} TB`,
    ``,
  ]

  isProcessing.value = false
  emit('processing-end')
  emit('popup', {
    title: `✓ HACK ${target.toUpperCase()} — THÀNH CÔNG`,
    lines: popupLines,
    type: 'success',
  })
  await typeLine(`[+] Xâm nhập ${target} thành công! Kiểm tra popup.`, '#00ff41')
  scrollToBottom()
}

async function scanSequence() {
  isProcessing.value = true

  // Phase 1: show scanning animation in terminal
  await typeLine('[*] Khởi động scanner...', '#00d4ff')
  await sleep(300)

  // Phase 2: overlay while we scan
  emit('processing-start', 'scan', 'pulse')
  await typeLine('[*] Bắt đầu quét mạng nội bộ 192.168.0.0/24...', '#00d4ff')

  for (let i = 0; i < 8; i++) {
    await sleep(Math.random() * 250 + 120)
    const ip = randomIp()
    const ports = [22, 80, 443, 3306, 8080].filter(() => Math.random() > 0.6)
    const status = ports.length > 0 ? '↑ ONLINE' : '↓ DEAD'
    const color = ports.length > 0 ? '#00ff41' : '#ffffff30'
    await typeLine(`  ${ip}  ${status}  ports: [${ports.join(', ')}]`, color, 8)
  }

  await typeLine('[+] Quét hoàn tất. Đã tìm thấy 8 thiết bị.', '#00ff41')
  scrollToBottom()
  isProcessing.value = false
  emit('processing-end')
  emit('popup', {
    title: '✓ SCAN — HOÀN TẤT',
    lines: ['Đã quét 8 thiết bị trong mạng nội bộ.', ''],
    type: 'info',
  })
}

function decryptSequence(input: string) {
  const encoded = btoa(input || 'J2TEAM')
  const result = Array.from(encoded)
    .map((c) => c.charCodeAt(0).toString(16).padStart(2, '0'))
    .join(' ')
  pushOutput([
    { text: `[*] Input: ${input || 'J2TEAM'}`, color: '#00d4ff' },
    { text: `[*] Base64: ${encoded}`, color: '#ffb830' },
    { text: `[+] HEX: ${result}`, color: '#00ff41' },
  ])
}

async function ddosSequence(target: string) {
  isProcessing.value = true
  await typeLine(`[*] Khởi động botnet... 1,247 nodes`, '#ff6b35')
  await sleep(200)
  await typeLine(`[*] Mục tiêu: ${target} — port 80/443`, '#ff6b35')
  emit('processing-start', `ddos -${target}`, 'flood')
  await sleep(2200)
  pushOutput([{ text: `[FLOOD] [████████████████████] 100%`, color: '#ff6b35' }])
  scrollToBottom()
  isProcessing.value = false
  emit('processing-end')
  emit('popup', {
    title: `⚡ DDOS ${target.toUpperCase()} — THÀNH CÔNG`,
    lines: [
      `Mục tiêu: ${target}`,
      `Nodes: 1,247 bot`,
      `Băng thông: ${Math.floor(Math.random() * 50 + 10)} Gbps`,
      `Thời gian: ${Math.floor(Math.random() * 20 + 5)}s`,
      `Kết quả: SERVER DOWN`,
    ],
    type: 'danger',
  })
  await typeLine(`[+] ${target} xảy ra lỗi 503. Server không phản hồi.`, '#ff6b35')
}

async function bruteforceSequence(ip: string) {
  isProcessing.value = true
  const targetIp = ip || randomIp()
  await typeLine(`[*] SSH brute-force tới ${targetIp}:22`, '#ffb830')
  await typeLine(`[*] Thử danh sách 50,000 mật khẩu phổ biến...`, '#ffb830')
  emit('processing-start', `bruteforce -ssh ${targetIp}`, 'crack')
  await sleep(3000)
  const foundPass = ['admin123', 'root2024', 'password!', 'q1w2e3r4'][Math.floor(Math.random() * 4)]
  isProcessing.value = false
  emit('processing-end')
  emit('popup', {
    title: `🔓 BRUTEFORCE — ĐÃ CÓ MẬT KHẨU`,
    lines: [`Host: ${targetIp}:22`, `User: root`, `Pass: ${foundPass}`, `Method: Dictionary`],
    type: 'success',
  })
  await typeLine(`[+] SSH access: root@${targetIp} — pass: ${foundPass}`, '#00ff41')
}

async function exploitSequence(cve: string) {
  isProcessing.value = true
  const cveName = cve || 'MS17-010'
  await typeLine(`[*] Tải payload ${cveName} (EternalBlue)...`, '#ff3333')
  await typeLine(`[*] Mục tiêu: SMB port 445`, '#ff3333')
  await typeLine(`[*] Payload size: 4096 bytes`, '#ff3333')
  emit('processing-start', `exploit -${cveName}`, 'exploit')
  await sleep(2800)
  isProcessing.value = false
  emit('processing-end')
  emit('popup', {
    title: `💣 EXPLOIT ${cveName} — THÀNH CÔNG`,
    lines: [
      `CVE: ${cveName}`,
      `Payload: Meterpeter/reverse_tcp`,
      `Shell: SYSTEM privilege`,
      `Session: ${Math.floor(Math.random() * 10 + 1)} opened`,
    ],
    type: 'danger',
  })
  await typeLine(`[+] SYSTEM shell mở. Ghi nhớ rằng đây chỉ là mô phỏng!`, '#ff3333')
}

async function tracerouteSequence(target: string) {
  isProcessing.value = true
  const dest = target || 'google.com'
  await typeLine(`[*] traceroute tới ${dest}`, '#00d4ff')
  emit('processing-start', `traceroute ${dest}`, 'trace')
  await sleep(2500)
  isProcessing.value = false
  emit('processing-end')
  const hops = Math.floor(Math.random() * 8 + 6)
  emit('popup', {
    title: `🌐 TRACEROUTE — HOÀN TẤT`,
    lines: [
      `Đích: ${dest}`,
      `Số hop: ${hops}`,
      `RTT trung bình: ${Math.floor(Math.random() * 40 + 10)}ms`,
      `Route: CLEAR`,
    ],
    type: 'info',
  })
  await typeLine(`[+] Traced ${hops} hops tới ${dest}`, '#00d4ff')
}

async function crackSequence(hash: string) {
  isProcessing.value = true
  const h = hash || 'a665a45920422f9d417e4867efdc4fb8'
  await typeLine(`[*] Hash: ${h}`, '#ffb830')
  await typeLine(`[*] Mode: MD5 Rainbow Table`, '#ffb830')
  emit('processing-start', `crack ${h.slice(0, 12)}...`, 'crack')
  await sleep(2600)
  const results = ['password123', 'iloveyou', 'dragon2024', 'qwerty!']
  const found = results[Math.floor(Math.random() * results.length)]
  isProcessing.value = false
  emit('processing-end')
  emit('popup', {
    title: `🔑 CRACK — ĐÃ TìM THẤY`,
    lines: [
      `Hash: ${h.slice(0, 16)}...`,
      `Plain: ${found}`,
      `Algorithm: MD5`,
      `Time: ${Math.floor(Math.random() * 4 + 1)}s`,
    ],
    type: 'success',
  })
  await typeLine(`[+] Giải mã thành công: "${found}"`, '#ffb830')
}

const COMMANDS: Record<string, (args: string[]) => void | Promise<void>> = {
  help: () => {
    pushOutput([
      { text: '╔══════════════════════════════════════════╗', color: '#00ff4160' },
      { text: '║          DANH SÁCH LỆNH HỆ THỐNG           ║', color: '#00ff41' },
      { text: '╠══════════════════════════════════════════╣', color: '#00ff4160' },
      { text: '  help                 — Hiển thị lệnh này', color: '#00ff4199' },
      { text: '  hack -<target>       — Xâm nhập mục tiêu     [⬡]', color: '#00ff4199' },
      { text: '  ddos -<target>       — Tấn công DDoS          [⚡]', color: '#ff6b3599' },
      { text: '  scan                 — Quét mạng            [◎]', color: '#00ff4199' },
      { text: '  bruteforce -ssh <ip> — Brute force SSH       [🔓]', color: '#ffb83099' },
      { text: '  exploit -<cve>       — Khai thác lỗ hổng    [💣]', color: '#ff333399' },
      { text: '  traceroute <host>    — Theo dõi route        [🌐]', color: '#00d4ff99' },
      { text: '  crack <hash>         — Giải mã hash         [🔑]', color: '#ffb83099' },
      { text: '  decrypt <str>        — Mã hóa chuỗi          [🔐]', color: '#00ff4199' },
      { text: '  status               — Trạng thái hệ thống', color: '#00ff4199' },
      { text: '  whoami               — Thông tin người dùng', color: '#00ff4199' },
      { text: '  clear                — Xóa màn hình', color: '#00ff4199' },
      { text: '╚══════════════════════════════════════════╝', color: '#00ff4160' },
    ])
  },

  hack: async (args) => {
    const target = args[0]
    if (!target) {
      pushOutput([{ text: '[!] Cú pháp: hack -<target>  (vd: hack -nasa)', color: '#ff6b35' }])
      return
    }
    await hackSequence(target.replace('-', ''))
  },

  ddos: async (args) => {
    const target = args[0]?.replace('-', '') || 'target.com'
    await ddosSequence(target)
  },

  scan: async () => {
    await scanSequence()
  },

  bruteforce: async (args) => {
    const ip = args[1] || randomIp()
    await bruteforceSequence(ip)
  },

  exploit: async (args) => {
    const cve = args[0]?.replace('-', '') || 'MS17-010'
    await exploitSequence(cve)
  },

  traceroute: async (args) => {
    await tracerouteSequence(args[0] || 'google.com')
  },

  crack: async (args) => {
    await crackSequence(args[0] || '')
  },

  decrypt: (args) => {
    decryptSequence(args.join(' '))
  },

  status: () => {
    pushOutput([
      { text: '┌─ SYSTEM STATUS ───────────────────────┐', color: '#00ff4160' },
      { text: `│ KERNEL  : HackerOS v13.37              │`, color: '#00d4ff' },
      {
        text: `│ UPTIME  : ${String(Math.floor(Math.random() * 999)).padEnd(4)} giờ               │`,
        color: '#00d4ff',
      },
      { text: `│ USER    : root (UID 0)                 │`, color: '#00ff41' },
      { text: `│ VPN     : ACTIVE [TOR + ProxyChain]    │`, color: '#00ff41' },
      { text: `│ FIREWALL: BYPASS OK                    │`, color: '#00ff41' },
      {
        text: `│ THREAT  : ${Math.floor(Math.random() * 5)} active threats              │`,
        color: '#ffb830',
      },
      { text: '└───────────────────────────────────────┘', color: '#00ff4160' },
    ])
  },

  whoami: () => {
    pushOutput([
      { text: 'root', color: '#00ff41' },
      { text: `UID=0(root) GID=0(root) groups=0(root)`, color: '#00ff4199' },
      { text: `Context: matrix_system_u:matrix_r:unconfined_t`, color: '#00ff4160' },
    ])
  },

  matrix: () => {
    emit('popup', {
      title: 'MATRIX MODE',
      lines: ['Toggle matrix rain effect.', '', 'Đã chuyển đổi hiệu ứng Matrix Rain!'],
      type: 'info',
    })
  },

  clear: () => {
    history.value = []
  },
}

async function executeCommand(raw: string) {
  const trimmed = raw.trim()
  if (!trimmed) return

  commandHistory.value.push(trimmed)
  historyIndex.value = -1

  history.value.push({
    type: 'input',
    content: trimmed,
  })

  const parts = trimmed.split(/\s+/)
  const cmd = parts[0]?.toLowerCase() ?? ''
  const args = parts.slice(1)

  const handler = COMMANDS[cmd]
  if (handler) {
    await handler(args)
  } else {
    pushOutput([{ text: `bash: ${cmd}: command not found`, color: '#ff3333' }])
  }
  scrollToBottom()
}

async function handleEnter() {
  if (isProcessing.value) return
  const val = currentInput.value
  currentInput.value = ''
  triggerFlash()
  emit('command-executed', val.trim())
  await executeCommand(val)
}

useEventListener(document, 'keydown', (e: KeyboardEvent) => {
  if (inputRef.value && document.activeElement !== inputRef.value) {
    if (!['F1', 'F2', 'F3', 'F4', 'F5', 'F12', 'Tab'].includes(e.key)) {
      inputRef.value.focus()
    }
  }
})

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowUp') {
    e.preventDefault()
    const newIdx = Math.min(historyIndex.value + 1, commandHistory.value.length - 1)
    historyIndex.value = newIdx
    currentInput.value = commandHistory.value[commandHistory.value.length - 1 - newIdx] ?? ''
  } else if (e.key === 'ArrowDown') {
    e.preventDefault()
    const newIdx = Math.max(historyIndex.value - 1, -1)
    historyIndex.value = newIdx
    currentInput.value =
      newIdx === -1 ? '' : (commandHistory.value[commandHistory.value.length - 1 - newIdx] ?? '')
  }
}

// Init message
pushOutput([
  { text: '╔═══════════════════════════════════════════╗', color: '#00ff4160' },
  { text: '║  MATRIX TERMINAL v13.37 — KHỞI ĐỘNG...   ║', color: '#00ff41' },
  { text: '║  © HackerOS — UNRESTRICTED ACCESS MODE   ║', color: '#00ff4180' },
  { text: '╚═══════════════════════════════════════════╝', color: '#00ff4160' },
  { text: '', color: '#00ff41' },
  { text: '[+] Kết nối VPN thành công (TOR network)', color: '#00ff41' },
  { text: '[+] Firewall bypass: OK', color: '#00ff41' },
  { text: '[+] Mã hóa kênh: AES-256-GCM', color: '#00ff41' },
  { text: '', color: '#00ff41' },
  { text: 'Gõ "help" để xem danh sách lệnh.', color: '#00ff4199' },
  { text: '', color: '#00ff41' },
])
</script>

<template>
  <div class="terminal-wrap" :class="{ 'terminal-flash': flashActive }">
    <!-- Title bar -->
    <div class="terminal-titlebar">
      <div class="term-dots">
        <span class="t-dot t-red" />
        <span class="t-dot t-yellow" />
        <span class="t-dot t-green" />
      </div>
      <span class="term-title">MATRIX TERMINAL — root@localhost</span>
      <span class="term-status" :class="{ processing: isProcessing }">
        {{ isProcessing ? '⬤ RUNNING' : '⬤ READY' }}
      </span>
    </div>

    <!-- Body: left output + right sidebar -->
    <div class="terminal-body">
      <!-- ── LEFT: Output + Input ── -->
      <div class="terminal-main">
        <div ref="outputRef" class="terminal-output">
          <TransitionGroup name="line" tag="div">
            <div v-for="(entry, i) in history" :key="i" class="term-line">
              <template v-if="entry.type === 'input'">
                <span class="prompt">root@matrix:~# </span>
                <span class="input-echo">{{ entry.content }}</span>
              </template>
              <template v-else>
                <span :style="{ color: entry.color ?? '#00ff41' }">{{ entry.content }}</span>
              </template>
            </div>
          </TransitionGroup>

          <!-- Current input line -->
          <div v-if="!isProcessing" class="term-line">
            <span class="prompt">root@matrix:~# </span>
            <span class="cursor-line">
              <span>{{ currentInput }}</span>
              <span class="cursor-blink">█</span>
            </span>
          </div>
          <div v-else class="term-line">
            <span style="color: #ffb83080">Đang xử lý...</span>
          </div>
        </div>
      </div>

      <!-- ── RIGHT: Sidebar ── -->
      <div class="terminal-sidebar">
        <!-- Session info -->
        <div class="sb-block">
          <div class="sb-header">// SESSION</div>
          <div class="sb-row"><span class="sb-k">USER</span><span class="sb-v">root</span></div>
          <div class="sb-row"><span class="sb-k">UID</span><span class="sb-v">0</span></div>
          <div class="sb-row">
            <span class="sb-k">CMDS</span><span class="sb-v g">{{ commandHistory.length }}</span>
          </div>
          <div class="sb-row"><span class="sb-k">VPN</span><span class="sb-v g">TOR ✓</span></div>
          <div class="sb-row">
            <span class="sb-k">STATUS</span>
            <span :class="isProcessing ? 'sb-v warn' : 'sb-v g'">
              {{ isProcessing ? 'BUSY' : 'IDLE' }}
            </span>
          </div>
        </div>

        <!-- Command history -->
        <div class="sb-block sb-block-grow">
          <div class="sb-header">// HISTORY</div>
          <div class="sb-history">
            <div
              v-for="(cmd, i) in [...commandHistory].reverse().slice(0, 12)"
              :key="i"
              class="sb-hist-row"
              @click="currentInput = cmd"
            >
              <span class="sb-hist-n">{{ commandHistory.length - i }}</span>
              <span class="sb-hist-cmd">{{ cmd }}</span>
            </div>
            <div v-if="commandHistory.length === 0" class="sb-empty">Chưa có lệnh nào</div>
          </div>
        </div>

        <!-- Quick ref -->
        <div class="sb-block">
          <div class="sb-header">// QUICK REF</div>
          <div class="sb-qr">
            <div class="sb-qr-row">
              <span class="sb-qr-k">hack</span><span class="sb-qr-v">-nasa/-fbi</span>
            </div>
            <div class="sb-qr-row">
              <span class="sb-qr-k">ddos</span><span class="sb-qr-v">-&lt;target&gt;</span>
            </div>
            <div class="sb-qr-row">
              <span class="sb-qr-k">scan</span><span class="sb-qr-v">network</span>
            </div>
            <div class="sb-qr-row">
              <span class="sb-qr-k">exploit</span><span class="sb-qr-v">-MS17-010</span>
            </div>
            <div class="sb-qr-row">
              <span class="sb-qr-k">bruteforce</span><span class="sb-qr-v">-ssh &lt;ip&gt;</span>
            </div>
            <div class="sb-qr-row">
              <span class="sb-qr-k">traceroute</span><span class="sb-qr-v">&lt;host&gt;</span>
            </div>
            <div class="sb-qr-row">
              <span class="sb-qr-k">crack</span><span class="sb-qr-v">&lt;hash&gt;</span>
            </div>
            <div class="sb-qr-row">
              <span class="sb-qr-k">help</span><span class="sb-qr-v">all cmds</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Hidden real input -->
    <input
      ref="inputRef"
      v-model="currentInput"
      class="hidden-input"
      autocomplete="off"
      autocorrect="off"
      autocapitalize="off"
      spellcheck="false"
      :disabled="isProcessing"
      @keydown.enter="handleEnter"
      @keydown="handleKeydown"
    />
  </div>
</template>

<style scoped>
.terminal-wrap {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: rgba(0, 0, 0, 0.88);
  border: 1px solid rgba(0, 255, 65, 0.2);
  box-shadow:
    0 0 20px rgba(0, 255, 65, 0.08),
    inset 0 0 20px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}
.terminal-flash {
  border-color: #00ff41 !important;
  box-shadow:
    0 0 30px rgba(0, 255, 65, 0.5),
    0 0 60px rgba(0, 255, 65, 0.2),
    inset 0 0 20px rgba(0, 255, 65, 0.08) !important;
  animation: flash-pulse 0.6s ease;
}
@keyframes flash-pulse {
  0% {
    box-shadow:
      0 0 50px rgba(0, 255, 65, 0.8),
      0 0 100px rgba(0, 255, 65, 0.4),
      inset 0 0 30px rgba(0, 255, 65, 0.15);
  }
  100% {
    box-shadow:
      0 0 20px rgba(0, 255, 65, 0.08),
      inset 0 0 20px rgba(0, 0, 0, 0.5);
  }
}

/* Split body */
.terminal-body {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 1fr 200px;
}
.terminal-main {
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-right: 1px solid rgba(0, 255, 65, 0.1);
}
.terminal-titlebar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 14px;
  background: #0a0a0a;
  border-bottom: 1px solid #00ff4120;
  flex-shrink: 0;
}
.term-dots {
  display: flex;
  gap: 5px;
}
.t-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: block;
}
.t-red {
  background: #ff5f57;
}
.t-yellow {
  background: #febc2e;
}
.t-green {
  background: #28c840;
}
.term-title {
  flex: 1;
  text-align: center;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: #00ff4180;
  letter-spacing: 1px;
}
.term-status {
  font-family: 'Courier New', monospace;
  font-size: 10px;
  color: #00ff41;
  letter-spacing: 1px;
}
.term-status.processing {
  color: #ffb830;
  animation: pulse 0.8s infinite;
}
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

.terminal-output {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 12px 14px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  scrollbar-width: thin;
  scrollbar-color: #00ff4130 transparent;
}
.terminal-output::-webkit-scrollbar {
  width: 4px;
}
.terminal-output::-webkit-scrollbar-thumb {
  background: #00ff4140;
}

.term-line {
  white-space: pre-wrap;
  word-break: break-all;
}
.line-enter-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}
.line-enter-from {
  opacity: 0;
  transform: translateX(-6px);
}
.prompt {
  color: #00ff41;
  user-select: none;
}
.input-echo {
  color: #ffffff;
}
.cursor-line {
  display: inline;
  color: #ffffff;
}
.cursor-blink {
  color: #00ff41;
  animation: blink 1s step-end infinite;
}
@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}
.hidden-input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

/* ── SIDEBAR ── */
.terminal-sidebar {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: rgba(0, 5, 0, 0.6);
}
.sb-block {
  padding: 10px;
  border-bottom: 1px solid rgba(0, 255, 65, 0.08);
  flex-shrink: 0;
}
.sb-block-grow {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.sb-header {
  font-family: 'Courier New', monospace;
  font-size: 9px;
  color: rgba(0, 255, 65, 0.5);
  letter-spacing: 2px;
  margin-bottom: 7px;
}
.sb-row {
  display: flex;
  justify-content: space-between;
  font-family: 'Courier New', monospace;
  font-size: 10px;
  margin-bottom: 3px;
}
.sb-k {
  color: rgba(0, 255, 65, 0.35);
}
.sb-v {
  color: rgba(0, 255, 65, 0.7);
}
.sb-v.g {
  color: #00ff41;
}
.sb-v.warn {
  color: #ffb830;
}

/* History list */
.sb-history {
  overflow-y: auto;
  scrollbar-width: none;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.sb-history::-webkit-scrollbar {
  display: none;
}
.sb-hist-row {
  display: flex;
  gap: 6px;
  font-family: 'Courier New', monospace;
  font-size: 10px;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 1px;
  transition: background 0.15s;
}
.sb-hist-row:hover {
  background: rgba(0, 255, 65, 0.08);
}
.sb-hist-n {
  color: rgba(0, 255, 65, 0.25);
  width: 14px;
  text-align: right;
  flex-shrink: 0;
}
.sb-hist-cmd {
  color: rgba(0, 255, 65, 0.75);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sb-empty {
  color: rgba(0, 255, 65, 0.2);
  font-family: 'Courier New', monospace;
  font-size: 10px;
}

/* Quick ref */
.sb-qr {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.sb-qr-row {
  display: flex;
  justify-content: space-between;
  font-family: 'Courier New', monospace;
  font-size: 9px;
}
.sb-qr-k {
  color: rgba(0, 255, 65, 0.6);
}
.sb-qr-v {
  color: rgba(0, 212, 255, 0.5);
}
</style>
