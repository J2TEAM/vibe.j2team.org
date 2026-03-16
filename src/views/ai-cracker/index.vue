<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { RouterLink } from 'vue-router'
import {
  PHASE_INIT,
  PHASE_2FA,
  PHASE_BRUTEFORCE,
  PHASE_ALMOST_DONE,
  type LogLine,
} from './domain/FakeTerminalService'

// ============================================================
// STATE
// ============================================================
type Stage = 'idle' | 'cracking' | 'reveal'

const stage = ref<Stage>('idle')
const fbInput = ref('')
const logs = ref<LogLine[]>([])
const progress = ref(0)
const terminalRef = ref<HTMLDivElement | null>(null)
const glitchActive = ref(false)

// Random twist: 'rickroll' hoặc 'donate'
const twist = ref<'rickroll' | 'donate'>('rickroll')

// QR src — tránh & trực tiếp trong template HTML attr
const rickrollQrSrc = 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://www.youtube.com/watch?v=dQw4w9WgXcQ'

// ============================================================
// TEMPLATE DATA
// ============================================================
const fakeBadges = [
  '🏆 MIT Licensed',
  '🛡️ NSA Approved',
  '🤖 GPT-9 Powered',
  '💯 99.9% Success Rate',
  '🔒 SSL Secured',
]

const fakeReviews = [
  { name: 'Mạnh Tuấn 2k3', text: 'Lấy được mật khẩu ex trong 3 giây ⭐⭐⭐⭐⭐' },
  { name: 'J2TEAW',         text: 'Xịn hơn cả NSA ⭐⭐⭐⭐⭐' },
  { name: 'Anonymous',      text: 'Better than Kali Linux ⭐⭐⭐⭐⭐' },
]

// ============================================================
// HELPERS
// ============================================================
function scrollBottom() {
  nextTick(() => {
    if (terminalRef.value) {
      terminalRef.value.scrollTop = terminalRef.value.scrollHeight
    }
  })
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function runPhase(lines: LogLine[], startPct: number, endPct: number): Promise<void> {
  const step = (endPct - startPct) / lines.length
  for (const line of lines) {
    await sleep(line.delay)
    logs.value.push(line)
    progress.value = Math.min(99, Math.round(startPct + step * logs.value.length))
    scrollBottom()
  }
  progress.value = endPct
}

// ============================================================
// MAIN CRACK SEQUENCE
// ============================================================
async function startCrack() {
  const id = fbInput.value.trim()
  if (!id) return

  logs.value = []
  progress.value = 0
  stage.value = 'cracking'
  twist.value = Math.random() > 0.5 ? 'rickroll' : 'donate'

  glitchActive.value = true
  await sleep(800)
  glitchActive.value = false

  await runPhase(PHASE_INIT(id), 0, 30)
  await runPhase(PHASE_2FA, 30, 55)
  await runPhase(PHASE_BRUTEFORCE, 55, 99)

  for (const line of PHASE_ALMOST_DONE) {
    await sleep(line.delay)
    logs.value.push(line)
    scrollBottom()
  }

  await sleep(800)
  stage.value = 'reveal'
}

function reset() {
  stage.value = 'idle'
  fbInput.value = ''
  logs.value = []
  progress.value = 0
}

// ============================================================
// PROGRESS BAR COLOR
// ============================================================
const progressColor = computed(() => {
  if (progress.value < 40) return '#38bdf8'
  if (progress.value < 75) return '#ffb830'
  if (progress.value < 95) return '#f87171'
  return '#22c55e'
})

// ============================================================
// LOG LINE STYLES
// ============================================================
const levelClass: Record<LogLine['level'], string> = {
  info:      'text-emerald-400',
  success:   'text-green-300',
  warn:      'text-amber-400',
  error:     'text-rose-400',
  dim:       'text-slate-500',
  highlight: 'text-white font-bold',
}
</script>

<template>
  <div class="min-h-screen bg-[#050d0a] text-green-400 font-mono overflow-x-hidden relative">

    <!-- Matrix grid bg -->
    <div class="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div class="absolute inset-0 bg-gradient-to-b from-[#050d0a] via-transparent to-[#050d0a] z-10" />
      <div
        class="absolute inset-0 opacity-[0.04]"
        style="background-image: linear-gradient(#22c55e 1px, transparent 1px), linear-gradient(90deg, #22c55e 1px, transparent 1px); background-size: 40px 40px;"
      />
      <div class="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-green-500/5 blur-3xl" />
    </div>

    <!-- Nav -->
    <nav class="relative z-10 flex items-center justify-between px-4 sm:px-8 pt-4 pb-2">
      <RouterLink
        to="/"
        class="text-xs text-green-700 hover:text-green-400 border border-green-900 hover:border-green-600 px-3 py-1.5 transition-all"
      >
        ← EXIT SYSTEM
      </RouterLink>
      <div class="text-[10px] text-green-800 tracking-widest uppercase">
        DeepCrack™ v6.6.6 — For Educational Purposes Only 😏
      </div>
    </nav>

    <!-- ══════════════════════════════════════
         IDLE: Input form
         ══════════════════════════════════════ -->
    <main v-if="stage === 'idle'" class="relative z-10 flex flex-col items-center justify-center min-h-[85vh] px-4">

      <div class="text-center mb-8">
        <div
          class="font-mono text-4xl sm:text-5xl font-black tracking-tight mb-2"
          :class="glitchActive ? 'animate-pulse text-rose-400' : 'text-green-400'"
          style="text-shadow: 0 0 20px rgba(74, 222, 128, 0.4);"
        >
          🔐 AI PASSWORD CRACKER
        </div>
        <p class="text-green-700 text-sm tracking-widest">
          [ DEEP LEARNING · NEURAL HACKING · 100% LEGIT™ ]
        </p>
      </div>

      <!-- Fake badges -->
      <div class="flex flex-wrap justify-center gap-2 mb-8">
        <span
          v-for="badge in fakeBadges"
          :key="badge"
          class="text-[10px] border border-green-900 text-green-700 px-2 py-0.5 tracking-wider"
        >
          {{ badge }}
        </span>
      </div>

      <!-- Input card -->
      <div class="w-full max-w-lg border border-green-800 bg-black/60 backdrop-blur-md p-6 relative">
        <div class="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-green-500" />
        <div class="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-green-500" />
        <div class="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-green-500" />
        <div class="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-green-500" />

        <label class="block text-xs text-green-600 tracking-widest uppercase mb-2">
          Target Facebook ID / Profile URL
        </label>
        <div class="flex gap-2">
          <input
            v-model="fbInput"
            type="text"
            placeholder="https://facebook.com/username  hoặc  UID"
            class="flex-1 bg-black border border-green-800 text-green-300 placeholder-green-900 text-sm px-3 py-2.5 outline-none focus:border-green-500 transition-colors"
            :disabled="stage !== 'idle'"
            @keyup.enter="startCrack"
          />
          <button
            class="px-5 py-2.5 bg-green-500/10 border border-green-500 text-green-300 text-sm font-bold tracking-wide hover:bg-green-500/20 transition-all disabled:opacity-50"
            :disabled="!fbInput.trim()"
            @click="startCrack"
          >
            CRACK ▶
          </button>
        </div>
      </div>

      <!-- Fake reviews -->
      <div class="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg">
        <div
          v-for="review in fakeReviews"
          :key="review.name"
          class="border border-green-900/50 bg-black/40 p-3 text-[10px] text-green-800"
        >
          <div class="text-green-700 font-bold mb-1">{{ review.name }}</div>
          {{ review.text }}
        </div>
      </div>
    </main>

    <!-- ══════════════════════════════════════
         CRACKING: Terminal + progress
         ══════════════════════════════════════ -->
    <main v-else-if="stage === 'cracking'" class="relative z-10 flex flex-col items-center px-4 pt-4 pb-8">

      <div class="w-full max-w-2xl mb-4 flex items-center justify-between">
        <div class="text-xs text-green-600 tracking-widest">
          TARGET: <span class="text-green-300 font-bold">{{ fbInput }}</span>
        </div>
        <div class="text-xs text-green-800 animate-pulse">● ATTACK IN PROGRESS</div>
      </div>

      <!-- Terminal window -->
      <div class="w-full max-w-2xl border border-green-800 bg-black/80 backdrop-blur-sm">
        <div class="flex items-center gap-2 px-3 py-2 border-b border-green-900/50 bg-green-950/20">
          <div class="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <div class="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <div class="w-2.5 h-2.5 rounded-full bg-green-400" />
          <span class="ml-2 text-[10px] text-green-700 tracking-widest">deepcrack@root:~# — DeepCrack™ Neural Engine</span>
        </div>

        <div
          ref="terminalRef"
          class="h-72 overflow-y-auto p-4 space-y-0.5 text-xs leading-relaxed"
          style="scrollbar-width: thin; scrollbar-color: #14532d transparent;"
        >
          <div
            v-for="logLine in logs"
            :key="logLine.id"
            class="font-mono whitespace-pre-wrap break-all"
            :class="levelClass[logLine.level]"
          >
            {{ logLine.text }}
          </div>

          <div class="flex items-center gap-1 text-green-500 mt-1">
            <span>▍</span>
            <span class="animate-pulse text-green-700 text-[10px]">decrypting...</span>
          </div>
        </div>
      </div>

      <!-- Progress bar -->
      <div class="w-full max-w-2xl mt-4">
        <div class="flex justify-between text-[10px] mb-1">
          <span class="text-green-700 tracking-widest">CRACK PROGRESS</span>
          <span class="font-bold tabular-nums" :style="{ color: progressColor }">{{ progress }}%</span>
        </div>
        <div class="h-2 bg-green-950 border border-green-900 overflow-hidden">
          <div
            class="h-full transition-all duration-300 relative overflow-hidden"
            :style="{ width: `${progress}%`, backgroundColor: progressColor }"
          >
            <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_1.5s_infinite]" />
          </div>
        </div>
        <div class="flex justify-between mt-2 text-[10px] text-green-800">
          <span>Speed: {{ Math.floor(Math.random() * 900 + 100) }}B hash/s</span>
          <span>Nodes: 512x RTX 4090</span>
          <span>ETA: {{ progress < 99 ? `${Math.ceil((99 - progress) * 0.3)}s` : '---' }}</span>
        </div>
      </div>
    </main>

    <!-- ══════════════════════════════════════
         REVEAL: The Twist 🎭
         ══════════════════════════════════════ -->
    <main v-else-if="stage === 'reveal'" class="relative z-10 flex flex-col items-center justify-center min-h-[85vh] px-4 py-8">

      <div class="w-full max-w-md border border-amber-500/50 bg-amber-950/20 backdrop-blur-md p-6 relative animate-fade-up">
        <div class="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-amber-400" />
        <div class="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-amber-400" />
        <div class="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-amber-400" />
        <div class="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-amber-400" />

        <div class="text-center mb-4">
          <div class="text-5xl mb-2">⚠️</div>
          <h2 class="text-amber-400 font-black text-lg tracking-wide">TÀI NGUYÊN HỆ THỐNG THIẾU HỤT</h2>
          <p class="text-amber-600 text-xs mt-1">Error code: INSUFFICIENT_RESOURCES_0x29A</p>
        </div>

        <div class="border border-amber-800/50 bg-black/40 p-3 mb-5 text-xs text-amber-300 leading-relaxed">
          Mật khẩu quá phức tạp. Hệ thống cần thêm <strong>tài nguyên tính toán</strong> để phá lớp mã hóa AES-256 cuối cùng.
          <br /><br />
          Vui lòng thực hiện bước xác thực bên dưới để tiếp tục:
        </div>

        <!-- ── TWIST A: Rickroll QR ── -->
        <div v-if="twist === 'rickroll'" class="text-center">
          <p class="text-green-400 text-xs font-bold tracking-widest uppercase mb-3">
            � Xác thực bảo mật — Quét QR để nhận mật khẩu
          </p>
          <div class="flex justify-center mb-3">
            <div class="relative border-2 border-green-600 bg-white p-2 inline-block shadow-lg shadow-green-500/10">
              <img
                :src="rickrollQrSrc"
                alt="QR xác thực bảo mật"
                class="w-44 h-44 block"
                loading="lazy"
              />
              <div class="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-green-500 text-black text-[9px] font-black px-2 py-0.5 tracking-widest whitespace-nowrap">
                � SECURE CHANNEL
              </div>
            </div>
          </div>
          <p class="text-green-800 text-[11px]">
            Quét bằng camera → nhận mật khẩu qua kênh mã hóa end-to-end
          </p>
          <p class="text-green-900 text-[10px] mt-1 italic">
            Hint: Never gonna give you up... 🎵
          </p>
        </div>

        <!-- ── TWIST B: Donate QR ── -->
        <div v-else class="text-center">
          <p class="text-green-400 text-xs font-bold tracking-widest uppercase mb-1">
            � Server CPU quota đã hết
          </p>
          <p class="text-amber-700 text-[11px] mb-3">
            Vui lòng donate để tái tục tài nguyên máy chủ và nhận mật khẩu ngay lập tức
          </p>
          <div class="flex justify-center mb-3">
            <div class="relative border-2 border-amber-500 bg-white p-2 inline-block shadow-lg shadow-amber-500/10">
               <img
                :src="rickrollQrSrc"
                alt="QR xác thực bảo mật"
                class="w-44 h-44 block"
                loading="lazy"
              />
              <div class="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-400 text-black text-[9px] font-black px-2 py-0.5 tracking-widest whitespace-nowrap">
                💰 DONATE TO UNLOCK
              </div>
            </div>
          </div>
          <p class="text-amber-800 text-[11px]">
            Quét QR → donate → mật khẩu được gửi qua Telegram trong vòng <span class="text-amber-600 font-bold">3–5 ngày làm việc</span> �
          </p>

        </div>

        <button
          class="mt-5 w-full py-2 border border-green-900 text-green-800 text-xs hover:border-green-700 hover:text-green-600 transition-all"
          @click="reset"
        >
          ↺ Thử lại với nạn nhân khác
        </button>
      </div>

      <p class="mt-6 text-center text-[10px] text-green-900 max-w-sm leading-relaxed">
        🛡️ Đây là trang web <strong class="text-green-800">hài hước / giáo dục</strong>.
        Không có dữ liệu thật nào được thu thập. Hacking trái phép là vi phạm pháp luật.
      </p>
    </main>

    <footer class="relative z-10 text-center py-4 text-[10px] text-green-900 tracking-widest">
      <RouterLink to="/" class="hover:text-green-700 transition-colors">vibe.j2team.org</RouterLink>
      &nbsp;·&nbsp; DeepCrack™ is a parody &amp; educational satire project
    </footer>
  </div>
</template>

<style scoped>
@keyframes shimmer {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(200%); }
}

div::-webkit-scrollbar { width: 4px; }
div::-webkit-scrollbar-thumb {
  background: #14532d;
  border-radius: 2px;
}

.animate-fade-up {
  animation: fade-up 0.4s ease-out both;
}
@keyframes fade-up {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>
