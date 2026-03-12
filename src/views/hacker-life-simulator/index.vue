<template>
  <div class="page scanlines vignette">
    <canvas ref="matrixCanvas" class="matrix"></canvas>

    <div class="page-shell">
      <header class="page-header animate-fade-up">
        <div class="issue-badge">VOL.01 / 2026</div>

        <div class="hero-intro">
          <div class="hero-kicker">interactive fake terminal playground</div>
          <h1 class="page-title">
            Hacker Life Simulator
            <span>Mr. Robot Edition</span>
          </h1>
          <p class="page-description">
            Spam bàn phím để “hack” theo phong cách Hollywood với split terminal,
            fake intel monitor, popup ACCESS GRANTED và cyberpunk combo sound.
          </p>
        </div>

        <div class="dot-divider" aria-hidden="true">
          <span v-for="n in 40" :key="n" class="dot-divider-item" />
        </div>
      </header>

      <div class="app" :class="{ glitch: glitching, flash: flashing }">
        <section class="panel left">
          <div class="topbar">
            <div class="brand">
              <div class="led"></div>
              <div>
                <div class="title">Hacker Life Simulator // Mr. Robot Edition</div>
                <div class="subtitle">fake split terminal • access escalation • cyberpunk beeps</div>
              </div>
            </div>

            <div class="status-cluster">
              <div class="status-chip">SYSTEM: {{ systemStatus }}</div>
              <div class="status-chip">THREAT: {{ threatStatus }}</div>
            </div>
          </div>

          <div class="terminal-split">
            <div class="term-panel">
              <div class="term-head">
                <div class="dots">
                  <span class="dot"></span>
                  <span class="dot"></span>
                  <span class="dot"></span>
                </div>
                <div>shell://main-console</div>
                <div>{{ mainHeadStatus }}</div>
              </div>

              <div ref="terminalMainRef" class="term-body">
                <p
                  v-for="(line, i) in terminalMain"
                  :key="`main-${i}`"
                  class="line"
                  :class="line.type"
                  v-html="line.html"
                />
              </div>
            </div>

            <div class="term-panel">
              <div class="term-head">
                <div class="dots">
                  <span class="dot"></span>
                  <span class="dot"></span>
                  <span class="dot"></span>
                </div>
                <div>sys://intel-monitor</div>
                <div>{{ intelHeadStatus }}</div>
              </div>

              <div ref="terminalIntelRef" class="term-body">
                <div class="sys-grid">
                  <div class="sys-card">
                    <div class="sys-label">INTRUSION HEAT</div>
                    <div class="sys-value">{{ heat }}%</div>
                    <div class="mini-meter"><span :style="{ width: `${heat}%` }"></span></div>
                  </div>

                  <div class="sys-card">
                    <div class="sys-label">TRACE RISK</div>
                    <div class="sys-value">{{ trace }}%</div>
                    <div class="mini-meter"><span :style="{ width: `${trace}%` }"></span></div>
                  </div>

                  <div class="sys-card">
                    <div class="sys-label">SIGNAL LOCK</div>
                    <div class="sys-value">{{ signal }}%</div>
                    <div class="mini-meter"><span :style="{ width: `${signal}%` }"></span></div>
                  </div>

                  <div class="sys-card">
                    <div class="sys-label">ACTIVE SESSION</div>
                    <div class="sys-value">{{ sessionValue }}</div>
                  </div>
                </div>

                <div style="height: 12px"></div>

                <div>
                  <p
                    v-for="(line, i) in intelLog"
                    :key="`intel-${i}`"
                    class="line"
                    :class="line.type"
                  >
                    {{ line.text }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div class="left-foot">
            <div>
              Spam bất kỳ phím nào để hack. Nhấn <span class="kbd">R</span> reset,
              <span class="kbd">M</span> mute,
              <span class="kbd">C</span> copy kết quả.
            </div>
            <div>
              LAST KEY:
              <span class="kbd">{{ lastKeyLabel }}</span>
            </div>
          </div>
        </section>

        <aside class="right">
          <section class="panel card">
            <h3 class="section-title">
              <span class="section-marker marker-coral">//</span>
              LIVE STATS
            </h3>
            <div class="stats-grid">
              <div class="stat">
                <div class="label">KEYS PRESSED</div>
                <div class="value">{{ keysPressed.toLocaleString('en-US') }}</div>
                <small>Tổng số phím đã spam</small>
              </div>

              <div class="stat">
                <div class="label">KEYS / SECOND</div>
                <div class="value">{{ kps.toFixed(1) }}</div>
                <small>Tốc độ hiện tại</small>
              </div>

              <div class="stat">
                <div class="label">MISSION TIME</div>
                <div class="value">{{ formatTime(elapsed) }}</div>
                <small>Thời gian hack</small>
              </div>

              <div class="stat">
                <div class="label">SYSTEMS BREACHED</div>
                <div class="value">{{ breached }}</div>
                <small>Target đã chiếm quyền</small>
              </div>
            </div>
          </section>

          <section class="panel card">
            <h3 class="section-title">
              <span class="section-marker marker-amber">//</span>
              MISSION PROGRESS
            </h3>
            <div class="progress-wrap">
              <div class="progress-head">
                <span>{{ missionLabel }}</span>
                <strong>{{ Math.floor(progress) }}%</strong>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
              </div>
            </div>
          </section>

          <section class="panel card">
            <h3 class="section-title">
              <span class="section-marker marker-sky">//</span>
              TARGET CHAIN
            </h3>
            <div class="targets">
              <div
                v-for="(target, index) in targets"
                :key="target"
                class="target"
                :class="{ active: index === activeTarget && !finished }"
              >
                <span>
                  {{
                    index < breached
                      ? `✔ ${target}`
                      : index === activeTarget && !finished
                        ? `▶ ${target}`
                        : `• ${target}`
                  }}
                </span>
                <span class="badge">
                  {{
                    index < breached
                      ? 'BREACHED'
                      : index === activeTarget && !finished
                        ? 'ACTIVE'
                        : 'PENDING'
                  }}
                </span>
              </div>
            </div>
          </section>

          <section class="panel card">
            <h3 class="section-title">
              <span class="section-marker marker-coral">//</span>
              RANK & CONTROL
            </h3>
            <div class="rank-box">
              <div>
                <div class="rank-name">{{ rankName }}</div>
                <div class="rank-sub">{{ rankSub }}</div>
              </div>
              <div class="badge">AUDIO: {{ muted ? 'OFF' : 'ON' }}</div>
            </div>

            <div class="controls">
              <button @click="copyResult">Copy kết quả</button>
              <button class="secondary" @click="resetMission">Reset mission</button>
              <button class="secondary" @click="toggleMute">Mute / Unmute</button>
            </div>
          </section>

          <section class="panel card">
            <div class="footer-note">
              Project giải trí giả lập “hack cho ngầu” theo kiểu phim ảnh. Không thực hiện hành vi xâm nhập thật.
            </div>
          </section>
        </aside>
      </div>

      <div class="back-home-wrap animate-fade-up">
        <RouterLink to="/" class="back-home-link">
          <Icon icon="lucide:arrow-left" class="back-home-icon" />
          Về trang chủ
        </RouterLink>
      </div>
    </div>

    <div class="overlay" :class="{ hidden: started }">
      <div class="hero">
        <h1>PRESS ANY KEY TO START HACKING</h1>
        <div class="big-kbd">MR. ROBOT MODE // SPLIT TERMINAL ENABLED</div>
        <p>
          Spam càng nhanh, terminal trái càng cháy, intel monitor bên phải càng báo động,
          combo sound càng cyberpunk, và khi đủ tiến độ sẽ bật popup
          <b>ACCESS GRANTED</b> ở giữa màn hình.
        </p>
        <div class="mini">Mẹo: giữ nhịp 6–10 phím/giây để rank cao và hiệu ứng đẹp hơn.</div>
      </div>
    </div>

    <div class="center-popup" :class="{ show: popupVisible, shake: popupShaking }">
      <div class="popup-glow"></div>
      <div class="popup-title">ACCESS GRANTED</div>
      <div class="popup-sub">
        {{ popupSub }}
      </div>
    </div>

    <div class="toast" :class="{ show: toastVisible }">
      {{ toastMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'

type MainLine = {
  html: string
  type: string
}

type IntelLine = {
  text: string
  type: string
}

type AudioContextCtor = new () => AudioContext

const matrixCanvas = ref<HTMLCanvasElement | null>(null)
const terminalMainRef = ref<HTMLDivElement | null>(null)
const terminalIntelRef = ref<HTMLDivElement | null>(null)

const started = ref(false)
const finished = ref(false)
const muted = ref(false)

const glitching = ref(false)
const flashing = ref(false)
const popupVisible = ref(false)
const popupShaking = ref(false)

const toastVisible = ref(false)
const toastMessage = ref('')

const terminalMain = ref<MainLine[]>([])
const intelLog = ref<IntelLine[]>([])

const keysPressed = ref(0)
const progress = ref(0)
const breached = ref(0)
const activeTarget = ref(0)
const elapsed = ref(0)
const kps = ref(0)

const systemStatus = ref('IDLE')
const threatStatus = ref('LOW')
const mainHeadStatus = ref('offline')
const intelHeadStatus = ref('standby')
const missionLabel = ref('Initializing cinematic exploit stack...')
const lastKeyLabel = ref('-')

const popupSub = ref(
  'Root shell established. Mainframe compromised. You are now officially too cool for a normal terminal.',
)

const recentKeys = ref<number[]>([])
const startTime = ref(0)
const stageIndex = ref(0)

let audioCtx: AudioContext | null = null
let toastTimer: number | null = null
let popupTimer: number | null = null
let tickRaf = 0
let matrixRaf = 0
let cleanupMatrixResize: (() => void) | null = null

const targets = [
  'PERIMETER FIREWALL',
  'MAIL GATEWAY',
  'OPS BASTION NODE',
  'ARCHIVE VAULT',
  'SATELLITE UPLINK',
  'SHADOW MAINFRAME',
] as const

const stages = [
  'Initializing cinematic exploit stack...',
  'Scanning open ports across hostile subnet...',
  'Fingerprinting services and weak signatures...',
  'Bypassing perimeter firewall with movie logic...',
  'Injecting payload into suspicious endpoint...',
  'Escalating privileges into root fantasy...',
  'Decrypting vault archives in style...',
  'Exfiltrating definitely-not-real data packets...',
  'Cleaning traces and forging elegant logs...',
  'Mainframe close to collapse. Keep typing...',
] as const

const mainCommands = [
  '> loading exploit kernel...',
  '> tracing tcp routes through ghost relays...',
  '> syncing rogue agent signatures...',
  '> hijacking session tokens...',
  '> brute forcing cinematic password vault...',
  '> patching shell into privileged daemon...',
  '> poisoning cache with false telemetry...',
  '> spinning up covert proxy tunnel...',
  '> extracting shadow env variables...',
  '> replaying authorized credentials...',
  '> scraping metadata from dormant node...',
  '> reassembling fragmented packets...',
  '> deobfuscating suspicious javascript bundle...',
  '> brute syncing hash table [%HASH%]...',
  '> mounting encrypted volume /mnt/%VOL%...',
  '> traversing hidden route /deep/%ROUTE%...',
  '> correlating intel across %N% mirrors...',
  '> synthesizing admin cookie injection...',
  '> bypassing 2FA using pure confidence...',
  '> escalating through forgotten daemon...',
] as const

const intelLines = [
  '[intel] packet anomaly detected',
  '[intel] thermal noise increasing',
  '[intel] trace daemon heartbeat unstable',
  '[intel] secondary relay handshake accepted',
  '[intel] vault checksum mismatch',
  '[intel] outbound tunnel stability good',
  '[intel] spoofed token accepted by edge node',
  '[intel] signal lock improving',
  '[intel] watching counter-intrusion patterns',
  '[intel] cinematic intrusion heat rising',
] as const

const okLines = [
  'root access handshake accepted',
  'stealth tunnel stable',
  'payload executed cleanly',
  'privilege escalation confirmed',
  'archive decryption unlocked',
  'trace wipe completed',
  'mainframe trust compromised',
] as const

const warnLines = [
  'WARNING: IDS signature matched',
  'ALERT: counter-intrusion signal detected',
  'NOTICE: target rerouting traffic',
  'CAUTION: encryption layer thickening',
] as const

const heat = computed(() => clamp(Math.floor(progress.value * 0.88 + kps.value * 3), 0, 100))
const trace = computed(() =>
  clamp(Math.floor(progress.value * 0.52 + Math.max(0, 14 - kps.value) * 2), 0, 100),
)
const signal = computed(() => clamp(Math.floor(progress.value * 0.95 + kps.value * 2.2), 0, 100))

const sessionValue = computed(() => {
  if (!started.value) return 'NONE'
  return finished.value ? 'ROOT_SHELL' : 'INTRUSION'
})

const rankInfo = computed(() => getRank(kps.value, progress.value, elapsed.value))
const rankName = computed(() => rankInfo.value[0])
const rankSub = computed(() => rankInfo.value[1])

watch(trace, (value) => {
  if (value > 70) threatStatus.value = 'HIGH'
  else if (value > 35) threatStatus.value = 'MEDIUM'
  else threatStatus.value = 'LOW'
})

watch(
  terminalMain,
  async () => {
    await nextTick()
    const el = terminalMainRef.value
    if (el) el.scrollTop = el.scrollHeight
  },
  { deep: true },
)

watch(
  intelLog,
  async () => {
    await nextTick()
    const el = terminalIntelRef.value
    if (el) el.scrollTop = el.scrollHeight
  },
  { deep: true },
)

function choice<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

function formatTime(s: number): string {
  return `${s.toFixed(1)}s`
}

function fakeHash(): string {
  const chars = 'abcdef0123456789'
  let out = ''
  for (let i = 0; i < 12; i++) {
    out += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return out
}

function fakeVol(): string {
  return choice(['blackbox', 'vault-x', 'phi-node', 'ghostdisk', 'archive-7'] as const)
}

function fakeRoute(): string {
  return choice(['shadow', 'alpha', 'echo', 'omega', 'relay', 'delta'] as const)
}

function escapeHtml(str: string): string {
  return String(str).replace(/[&<>"']/g, (m) => {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    }
    return map[m] ?? m
  })
}

function showToast(msg: string): void {
  toastMessage.value = msg
  toastVisible.value = true

  if (toastTimer) window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => {
    toastVisible.value = false
  }, 1800)
}

function addMainLine(html: string, type = 'dim'): void {
  terminalMain.value.push({ html, type })
  if (terminalMain.value.length > 150) terminalMain.value.shift()
}

function addIntelLine(text: string, type = 'dim'): void {
  intelLog.value.push({ text, type })
  if (intelLog.value.length > 100) intelLog.value.shift()
}

function glitchUI(): void {
  glitching.value = false
  requestAnimationFrame(() => {
    glitching.value = true
    window.setTimeout(() => {
      glitching.value = false
    }, 120)
  })
}

function flashUI(): void {
  flashing.value = false
  requestAnimationFrame(() => {
    flashing.value = true
    window.setTimeout(() => {
      flashing.value = false
    }, 150)
  })
}

function shakePopup(): void {
  popupShaking.value = false
  requestAnimationFrame(() => {
    popupShaking.value = true
    window.setTimeout(() => {
      popupShaking.value = false
    }, 220)
  })
}

function getAudioContextCtor(): AudioContextCtor | null {
  const w = window as Window & {
    webkitAudioContext?: AudioContextCtor
  }

  if (typeof window.AudioContext !== 'undefined') {
    return window.AudioContext as AudioContextCtor
  }

  if (typeof w.webkitAudioContext !== 'undefined') {
    return w.webkitAudioContext
  }

  return null
}

function beep(
  freq = 220,
  duration = 0.03,
  type: OscillatorType = 'square',
  gainValue = 0.015,
): void {
  if (muted.value) return

  try {
    if (!audioCtx) {
      const AudioCtor = getAudioContextCtor()
      if (!AudioCtor) return
      audioCtx = new AudioCtor()
    }

    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()

    osc.type = type
    osc.frequency.value = freq
    gain.gain.value = gainValue

    osc.connect(gain)
    gain.connect(audioCtx.destination)

    osc.start()
    osc.stop(audioCtx.currentTime + duration)
  } catch {
    // ignore audio errors
  }
}

function comboSound(currentKps: number): void {
  const base = 180 + Math.min(900, currentKps * 34 + (keysPressed.value % 7) * 15)
  beep(base, 0.028, Math.random() > 0.45 ? 'square' : 'sawtooth', 0.012)

  if (currentKps >= 6) {
    window.setTimeout(() => beep(base + 90, 0.022, 'triangle', 0.01), 20)
  }
  if (currentKps >= 9) {
    window.setTimeout(() => beep(base + 170, 0.018, 'square', 0.008), 40)
  }
}

function finishChord(): void {
  beep(760, 0.08, 'triangle', 0.022)
  window.setTimeout(() => beep(920, 0.1, 'triangle', 0.02), 90)
  window.setTimeout(() => beep(1180, 0.13, 'triangle', 0.018), 180)
}

function computeKps(): void {
  const cutoff = performance.now() - 1000
  recentKeys.value = recentKeys.value.filter((t) => t >= cutoff)
  kps.value = recentKeys.value.length
}

function getRank(
  currentKps: number,
  progressValue: number,
  elapsedValue: number,
): [string, string] {
  if (progressValue >= 100) {
    if (currentKps >= 11) return ['Mr. Robot', 'Bạn vừa hack như đang ở đoạn cao trào cuối phim.']
    if (currentKps >= 8) {
      return ['Cyber Phantom', 'Terminal cháy sáng, mainframe gãy gọn, rất điện ảnh.']
    }
    if (currentKps >= 6) {
      return ['Elite Intruder', 'Nhịp spam đẹp, shell sạch, phong thái lạnh lùng.']
    }
    if (currentKps >= 4) return ['Shadow Operator', 'Mission hoàn thành với độ ngầu ổn định.']
    return ['Script Kiddie+', 'Đã xong nhiệm vụ, nhưng vẫn còn dư địa để ngầu hơn.']
  }

  if (!started.value) return ['Script Kiddie', 'Nhấn phím để bật cinematic intrusion mode.']
  if (currentKps >= 10) return ['Cyber Phantom', 'Bàn phím của bạn đang bước vào hyperspace.']
  if (currentKps >= 7) {
    return ['Elite Intruder', 'Nhịp spam rất đẹp. Intel monitor đang phát sáng.']
  }
  if (currentKps >= 4) {
    return ['Shadow Operator', 'Tiến độ tăng đều, đúng phong cách lạnh lùng.']
  }
  if (elapsedValue > 0 && currentKps < 2) {
    return ['AFK Intruder', 'Spam ít quá. Counter-intrusion sắp bắt kịp rồi.']
  }
  return ['Script Kiddie', 'Khởi động ổn, cần thêm tốc độ để ngầu hơn.']
}

function updateStage(): void {
  const idx = Math.min(stages.length - 1, Math.floor((progress.value / 100) * stages.length))
  if (idx !== stageIndex.value) {
    stageIndex.value = idx
    missionLabel.value = stages[idx] ?? stages[0]
    addIntelLine(`[intel] stage shift -> ${missionLabel.value}`, 'cyan')
  }
}

function randomMainBurst(key: string): void {
  const count = rand(1, 3)

  for (let i = 0; i < count; i++) {
    const selected = choice(mainCommands)
    let cmd = selected
      .replace('%HASH%', fakeHash())
      .replace('%VOL%', fakeVol())
      .replace('%ROUTE%', fakeRoute())
      .replace('%N%', String(rand(2, 9)))

    const roll = Math.random()
    let type = 'dim'

    if (roll < 0.12) {
      cmd = `> ${choice(warnLines).toLowerCase()}`
      type = 'warn'
    } else if (roll < 0.26) {
      cmd = `> ${choice(okLines).toLowerCase()}`
      type = 'ok'
    }

    addMainLine(cmd, type)
  }

  addMainLine(
    `<span class="prompt">key@capture</span>:<span class="path">~/input</span>$ "${escapeHtml(
      key,
    )}"<span class="fake-cursor"></span>`,
    'dim',
  )
}

function randomIntelBurst(currentKps: number): void {
  const n = Math.random() < 0.72 ? 1 : 2

  for (let i = 0; i < n; i++) {
    const line = choice(intelLines)
    const type = Math.random() < 0.16 ? 'warn' : Math.random() < 0.28 ? 'ok' : 'cyan'
    addIntelLine(line, type)
  }

  if (currentKps >= 8 && Math.random() < 0.35) {
    addIntelLine('[intel] combo sound resonance stable', 'ok')
  }
}

function maybeBreach(): void {
  const should =
    breached.value < targets.length &&
    progress.value >= ((breached.value + 1) * 100) / targets.length

  if (!should) return

  breached.value += 1
  activeTarget.value = Math.min(targets.length - 1, breached.value)

  const breachedTarget = targets[breached.value - 1] ?? targets[0]

  addMainLine(`> target "${breachedTarget.toLowerCase()}" breached successfully.`, 'ok')
  addIntelLine(`[intel] ${breachedTarget.toLowerCase()} marked compromised`, 'ok')

  systemStatus.value = breached.value >= targets.length ? 'CORE ACCESS' : 'BREACH CONFIRMED'

  flashUI()
  beep(620, 0.06, 'sawtooth', 0.02)

  if (Math.random() < 0.5) {
    window.setTimeout(() => beep(760, 0.03, 'triangle', 0.014), 55)
  }
}

function showAccessPopup(): void {
  popupSub.value = `Root shell established in ${formatTime(elapsed.value)} with ${
    keysPressed.value
  } keys pressed and ${breached.value}/${targets.length} targets breached.`

  popupVisible.value = true
  shakePopup()

  if (popupTimer) window.clearTimeout(popupTimer)
  popupTimer = window.setTimeout(() => {
    popupVisible.value = false
  }, 2300)
}

function finishMission(): void {
  finished.value = true
  progress.value = 100
  systemStatus.value = 'ROOT ACCESS GRANTED'
  mainHeadStatus.value = 'root'
  intelHeadStatus.value = 'breached'

  addMainLine('> root access granted.', 'ok')
  addMainLine('> exfiltration complete. logs cleaned. ego boosted.', 'ok')
  addIntelLine('[intel] all target layers collapsed', 'ok')
  addIntelLine('[intel] counter-intrusion signal lost', 'ok')

  finishChord()
  flashUI()
  showAccessPopup()
  showToast('ACCESS GRANTED.')
}

function addBoot(): void {
  const boot: readonly string[] = [
    '<span class="prompt">root@fsociety</span>:<span class="path">~/console</span>$ init --mr-robot-mode',
    'loading split terminal environment...',
    'binding fake shell + intel monitor...',
    'synchronizing matrix rain...',
    'arming cyberpunk sound engine...',
    'operator ready. smash the keyboard.',
  ]

  boot.forEach((line, i) => {
    window.setTimeout(() => addMainLine(line, i === 0 ? 'ok' : 'dim'), i * 85)
  })

  const intelBoot: readonly string[] = [
    '[intel] monitor online',
    '[intel] passive trace daemon online',
    '[intel] standby mode engaged',
  ]

  intelBoot.forEach((line, i) => {
    window.setTimeout(() => addIntelLine(line, 'cyan'), i * 90)
  })
}

function toggleMute(): void {
  muted.value = !muted.value
  showToast(muted.value ? 'Đã tắt âm.' : 'Đã bật âm.')
}

async function copyResult(): Promise<void> {
  const text = `Hacker Life Simulator // Mr. Robot Edition
Rank: ${rankName.value}
Keys pressed: ${keysPressed.value}
Keys/second: ${kps.value.toFixed(1)}
Mission time: ${formatTime(elapsed.value)}
Systems breached: ${breached.value}
Progress: ${Math.floor(progress.value)}%`

  try {
    await navigator.clipboard.writeText(text)
    showToast('Đã copy kết quả.')
  } catch {
    showToast('Trình duyệt chặn clipboard.')
  }
}

function resetMission(): void {
  started.value = false
  finished.value = false
  keysPressed.value = 0
  progress.value = 0
  breached.value = 0
  activeTarget.value = 0
  elapsed.value = 0
  recentKeys.value = []
  startTime.value = 0
  stageIndex.value = 0

  terminalMain.value = []
  intelLog.value = []
  popupVisible.value = false

  systemStatus.value = 'IDLE'
  threatStatus.value = 'LOW'
  mainHeadStatus.value = 'offline'
  intelHeadStatus.value = 'standby'
  missionLabel.value = stages[0]
  lastKeyLabel.value = '-'

  addMainLine(
    '<span class="prompt">root@fsociety</span>:<span class="path">~/console</span>$ reset --mission',
    'ok',
  )
  addMainLine('waiting for operator input...', 'dim')
  addIntelLine('[intel] monitor cleared', 'cyan')
}

function handleKeydown(e: KeyboardEvent): void {
  if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(e.key)) return
  if (e.repeat && !started.value) return

  const key = e.key

  if (!started.value) {
    started.value = true
    startTime.value = performance.now() / 1000
    systemStatus.value = 'INTRUSION ACTIVE'
    mainHeadStatus.value = 'live'
    intelHeadStatus.value = 'tracking'
    addBoot()
  }

  if (key.toLowerCase() === 'r') {
    resetMission()
    return
  }
  if (key.toLowerCase() === 'm') {
    toggleMute()
    return
  }
  if (key.toLowerCase() === 'c') {
    void copyResult()
    return
  }
  if (finished.value) return

  keysPressed.value += 1
  recentKeys.value.push(performance.now())
  computeKps()

  lastKeyLabel.value = key.length === 1 ? key.toUpperCase() : key

  const gain = 0.42 + Math.min(2.2, kps.value * 0.085)
  progress.value = clamp(progress.value + gain, 0, 100)

  randomMainBurst(key)
  randomIntelBurst(kps.value)
  comboSound(kps.value)

  if (Math.random() < 0.22) glitchUI()
  if (Math.random() < 0.09) flashUI()

  updateStage()
  maybeBreach()

  if (progress.value >= 100) {
    finishMission()
  }
}

function tick(): void {
  computeKps()

  if (started.value && !finished.value) {
    elapsed.value = performance.now() / 1000 - startTime.value
  }

  tickRaf = requestAnimationFrame(tick)
}

function startMatrix(): void {
  if (matrixCanvas.value === null) return

  const canvasEl: HTMLCanvasElement = matrixCanvas.value
  const maybeContext = canvasEl.getContext('2d')
  if (maybeContext === null) return

  const context: CanvasRenderingContext2D = maybeContext

  let drops: number[] = []
  let cols = 0
  let fontSize = 16

  const chars = 'アァカサタナハマヤャラワン0123456789ABCDEF<>/*+-=%$#@{}[];:|'

  const resize = (): void => {
    const dpr = Math.max(1, window.devicePixelRatio || 1)

    canvasEl.width = Math.floor(window.innerWidth * dpr)
    canvasEl.height = Math.floor(window.innerHeight * dpr)
    canvasEl.style.width = `${window.innerWidth}px`
    canvasEl.style.height = `${window.innerHeight}px`

    context.setTransform(1, 0, 0, 1, 0, 0)
    context.scale(dpr, dpr)

    fontSize = window.innerWidth < 700 ? 13 : 16
    cols = Math.floor(window.innerWidth / fontSize)
    drops = Array.from({ length: cols }, () => rand(-40, 0))
  }

  const draw = (): void => {
    context.fillStyle = 'rgba(15, 25, 35, 0.11)'
    context.fillRect(0, 0, window.innerWidth, window.innerHeight)
    context.font = `${fontSize}px Consolas, monospace`

    for (let i = 0; i < drops.length; i++) {
      const index = Math.floor(Math.random() * chars.length)
      const text = chars.charAt(index)
      const x = i * fontSize
      const currentDrop = drops[i] ?? 0
      const y = currentDrop * fontSize

      context.fillStyle = i % 7 === 0 ? 'rgba(255, 184, 48, 0.72)' : 'rgba(56, 189, 248, 0.42)'
      context.fillText(text, x, y)

      if (y > window.innerHeight && Math.random() > 0.975) {
        drops[i] = rand(-10, 0)
      } else {
        drops[i] = currentDrop + 1
      }
    }

    matrixRaf = requestAnimationFrame(draw)
  }

  resize()
  draw()

  const handleResize = (): void => {
    resize()
  }

  window.addEventListener('resize', handleResize)
  cleanupMatrixResize = () => {
    window.removeEventListener('resize', handleResize)
  }
}

onMounted(() => {
  addMainLine(
    '<span class="prompt">root@fsociety</span>:<span class="path">~/console</span>$ status',
    'ok',
  )
  addMainLine('mr. robot edition loaded.', 'dim')
  addMainLine('press any key to begin.', 'dim')
  addIntelLine('[intel] standby', 'cyan')

  window.addEventListener('keydown', handleKeydown)
  tick()
  startMatrix()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)

  if (tickRaf) cancelAnimationFrame(tickRaf)
  if (matrixRaf) cancelAnimationFrame(matrixRaf)
  if (toastTimer) window.clearTimeout(toastTimer)
  if (popupTimer) window.clearTimeout(popupTimer)
  if (cleanupMatrixResize) cleanupMatrixResize()

  if (audioCtx) {
    void audioCtx.close().catch(() => undefined)
    audioCtx = null
  }
})
</script>

<style scoped>
:global(html),
:global(body),
.page {
  height: 100%;
  margin: 0;
}

.page {
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at top, rgba(255, 107, 74, 0.06), transparent 30%),
    linear-gradient(180deg, #0f1923 0%, #132130 38%, #0f1923 100%);
  color: #f0ede6;
  font-family: 'Be Vietnam Pro', sans-serif;
  letter-spacing: 0.2px;
}

.page-shell {
  position: relative;
  z-index: 2;
  max-width: 1280px;
  margin: 0 auto;
  padding: 24px;
}

.page-header {
  position: relative;
  margin-bottom: 24px;
  text-align: center;
}

.issue-badge {
  position: absolute;
  top: 0;
  right: 0;
  background: #ff6b4a;
  color: #0f1923;
  font-family: 'Anybody', sans-serif;
  font-weight: 800;
  font-size: 12px;
  letter-spacing: 0.12em;
  padding: 8px 12px;
  transform: rotate(3deg);
}

.hero-intro {
  padding-top: 8px;
}

.hero-kicker {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #253549;
  background: #162232;
  color: #4a6180;
  font-family: 'Anybody', sans-serif;
  font-size: 12px;
  letter-spacing: 0.14em;
  padding: 8px 12px;
  text-transform: uppercase;
}

.page-title {
  margin: 18px 0 0;
  font-family: 'Anybody', sans-serif;
  font-size: clamp(42px, 7vw, 84px);
  line-height: 0.95;
  font-weight: 800;
  color: #ff6b4a;
  letter-spacing: -0.04em;
}

.page-title span {
  display: block;
  color: #f0ede6;
}

.page-description {
  max-width: 760px;
  margin: 18px auto 0;
  color: #8b9db5;
  font-size: 18px;
  line-height: 1.7;
}

.dot-divider {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: 22px;
}

.dot-divider-item {
  width: 4px;
  height: 4px;
  border-radius: 999px;
  background: #253549;
}

.matrix {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  opacity: 0.22;
}

.scanlines::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 5;
  background:
    repeating-linear-gradient(
      to bottom,
      rgba(255, 255, 255, 0.02) 0px,
      rgba(255, 255, 255, 0.02) 1px,
      transparent 2px,
      transparent 4px
    );
  opacity: 0.18;
  mix-blend-mode: screen;
}

.vignette::after {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 4;
  box-shadow: inset 0 0 160px rgba(0, 0, 0, 0.85);
}

.app {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: 1.35fr 0.9fr;
  gap: 14px;
  min-height: 72vh;
}

.panel {
  position: relative;
  border: 1px solid #253549;
  background: rgba(22, 34, 50, 0.9);
  border-radius: 0;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.015) inset,
    0 14px 34px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  backdrop-filter: blur(6px);
}

.panel::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.03), transparent 18%);
}

.left {
  display: grid;
  grid-template-rows: auto 1fr auto;
  min-height: 0;
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-bottom: 1px solid #253549;
  background: rgba(15, 25, 35, 0.62);
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.led {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #ff6b4a;
  box-shadow: 0 0 12px rgba(255, 107, 74, 0.7);
  animation: pulse 1.05s infinite alternate;
  flex: 0 0 auto;
}

@keyframes pulse {
  from {
    opacity: 0.7;
    transform: scale(0.96);
  }
  to {
    opacity: 1;
    transform: scale(1.08);
  }
}

.title {
  font-size: 18px;
  font-weight: 700;
  color: #f0ede6;
  font-family: 'Anybody', sans-serif;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.subtitle {
  font-size: 11px;
  margin-top: 3px;
  color: #8b9db5;
  font-family: 'Anybody', sans-serif;
  letter-spacing: 0.08em;
}

.status-cluster {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.status-chip {
  border: 1px solid #253549;
  background: #162232;
  color: #f0ede6;
  padding: 8px 10px;
  border-radius: 0;
  font-size: 12px;
  white-space: nowrap;
  font-family: 'Anybody', sans-serif;
  letter-spacing: 0.06em;
}

.terminal-split {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  min-height: 0;
  background: linear-gradient(180deg, rgba(15, 25, 35, 0.96), rgba(22, 34, 50, 0.96));
}

.term-panel {
  min-height: 0;
  position: relative;
  overflow: hidden;
}

.term-panel + .term-panel {
  border-left: 1px solid #253549;
  background: rgba(30, 47, 66, 0.78);
}

.term-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 9px 12px;
  border-bottom: 1px solid #253549;
  background: rgba(15, 25, 35, 0.4);
  font-size: 12px;
  color: #8b9db5;
  font-family: 'Anybody', sans-serif;
}

.dots {
  display: flex;
  gap: 6px;
  align-items: center;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
}

.dot:nth-child(1) {
  background: #ff6b4a;
}
.dot:nth-child(2) {
  background: #ffb830;
}
.dot:nth-child(3) {
  background: #38bdf8;
}

.term-body {
  height: 100%;
  min-height: 0;
  overflow: auto;
  padding: 12px;
  padding-bottom: 38px;
  scroll-behavior: smooth;
}

.term-body::-webkit-scrollbar {
  width: 10px;
}

.term-body::-webkit-scrollbar-thumb {
  background: rgba(74, 97, 128, 0.4);
}

.term-body::-webkit-scrollbar-track {
  background: transparent;
}

.line {
  margin: 0 0 8px 0;
  line-height: 1.42;
  font-size: 13px;
  word-break: break-word;
  text-shadow: 0 0 8px rgba(56, 189, 248, 0.08);
  font-family: Consolas, Monaco, 'Courier New', monospace;
}

.line.dim {
  color: #8b9db5;
}
.line.ok {
  color: #38bdf8;
}
.line.warn {
  color: #ffb830;
}
.line.err {
  color: #ff6b4a;
}
.line.cyan {
  color: #f0ede6;
}

:deep(.prompt) {
  color: #f0ede6;
}
:deep(.path) {
  color: #38bdf8;
}
:deep(.accent) {
  color: #ffb830;
}

:deep(.fake-cursor) {
  display: inline-block;
  width: 10px;
  height: 16px;
  background: rgba(255, 107, 74, 0.88);
  vertical-align: middle;
  animation: blink 1s step-end infinite;
  margin-left: 4px;
  box-shadow: 0 0 10px rgba(255, 107, 74, 0.25);
}

@keyframes blink {
  0%,
  45% {
    opacity: 1;
  }
  46%,
  100% {
    opacity: 0;
  }
}

.sys-grid {
  display: grid;
  gap: 10px;
}

.sys-card {
  border: 1px solid #253549;
  border-radius: 0;
  padding: 10px 11px;
  background: #1e2f42;
}

.sys-label {
  font-size: 11px;
  color: #8b9db5;
  margin-bottom: 6px;
  font-family: 'Anybody', sans-serif;
  letter-spacing: 0.08em;
}

.sys-value {
  font-size: 20px;
  font-weight: 700;
  color: #f0ede6;
  font-family: 'Anybody', sans-serif;
}

.mini-meter {
  margin-top: 8px;
  height: 8px;
  border-radius: 0;
  background: rgba(255, 255, 255, 0.06);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.03);
}

.mini-meter > span {
  display: block;
  height: 100%;
  width: 0%;
  background: linear-gradient(90deg, rgba(255, 107, 74, 0.7), rgba(255, 184, 48, 0.95));
  box-shadow: 0 0 10px rgba(255, 107, 74, 0.18);
  transition: width 0.09s linear;
}

.left-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-top: 1px solid #253549;
  background: rgba(15, 25, 35, 0.4);
  font-size: 13px;
  color: #8b9db5;
  flex-wrap: wrap;
}

.kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 30px;
  height: 26px;
  padding: 0 8px;
  border-radius: 0;
  border: 1px solid #253549;
  background: #1e2f42;
  color: #f0ede6;
  font-size: 12px;
  font-family: 'Anybody', sans-serif;
}

.right {
  display: grid;
  grid-template-rows: auto auto auto 1fr auto;
  gap: 14px;
  min-height: 0;
}

.card {
  padding: 14px;
}

.section-title {
  margin: 0 0 10px;
  font-size: 13px;
  color: #f0ede6;
  letter-spacing: 1px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: 'Anybody', sans-serif;
}

.section-marker {
  font-size: 12px;
  tracking: 0.18em;
}

.marker-coral {
  color: #ff6b4a;
}
.marker-amber {
  color: #ffb830;
}
.marker-sky {
  color: #38bdf8;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.stat {
  border: 1px solid #253549;
  border-radius: 0;
  background: #1e2f42;
  padding: 12px;
}

.stat .label {
  font-size: 11px;
  color: #8b9db5;
  margin-bottom: 6px;
  font-family: 'Anybody', sans-serif;
  letter-spacing: 0.08em;
}

.stat .value {
  font-size: 24px;
  font-weight: 700;
  color: #f0ede6;
  font-family: 'Anybody', sans-serif;
}

.stat small {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #4a6180;
}

.progress-wrap {
  border: 1px solid #253549;
  border-radius: 0;
  background: #1e2f42;
  overflow: hidden;
}

.progress-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  padding: 12px 12px 8px;
  color: #f0ede6;
  font-size: 13px;
}

.progress-bar {
  height: 20px;
  margin: 0 12px 12px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 0;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.04);
  position: relative;
}

.progress-fill {
  height: 100%;
  width: 0%;
  background: linear-gradient(90deg, rgba(255, 107, 74, 0.92), rgba(255, 184, 48, 0.98));
  box-shadow: 0 0 20px rgba(255, 107, 74, 0.18);
  transition: width 0.09s linear;
  position: relative;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  width: 54px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.34));
  opacity: 0.6;
}

.targets {
  display: grid;
  gap: 8px;
}

.target {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border: 1px solid #253549;
  border-radius: 0;
  padding: 10px 12px;
  background: #1e2f42;
  font-size: 13px;
}

.target.active {
  box-shadow:
    0 0 0 1px rgba(255, 107, 74, 0.08) inset,
    0 0 16px rgba(255, 107, 74, 0.06);
  border-color: #ff6b4a;
}

.badge {
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 0;
  border: 1px solid #253549;
  background: rgba(255, 184, 48, 0.08);
  color: #f0ede6;
  white-space: nowrap;
  font-family: 'Anybody', sans-serif;
  letter-spacing: 0.06em;
}

.rank-box {
  border: 1px solid #253549;
  border-radius: 0;
  padding: 12px;
  background: #1e2f42;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.rank-name {
  font-size: 20px;
  font-weight: 700;
  color: #f0ede6;
  text-shadow: 0 0 12px rgba(255, 107, 74, 0.08);
  font-family: 'Anybody', sans-serif;
}

.rank-sub {
  margin-top: 4px;
  font-size: 12px;
  color: #8b9db5;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
}

button {
  appearance: none;
  border: 1px solid #253549;
  outline: none;
  cursor: pointer;
  font: inherit;
  color: #0f1923;
  background: #ff6b4a;
  padding: 10px 14px;
  border-radius: 0;
  font-weight: 800;
  font-family: 'Anybody', sans-serif;
  letter-spacing: 0.04em;
  transition:
    transform 0.08s ease,
    background 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
}

button:hover {
  background: #ff7a5d;
}

button:active {
  transform: translateY(1px) scale(0.99);
}

button.secondary {
  background: #162232;
  color: #8b9db5;
  border: 1px solid #253549;
  box-shadow: none;
}

button.secondary:hover {
  color: #f0ede6;
  border-color: #ff6b4a;
  background: #1e2f42;
}

.footer-note {
  font-size: 11px;
  color: #8b9db5;
  line-height: 1.6;
}

.back-home-wrap {
  margin-top: 18px;
  display: flex;
  justify-content: center;
}

.back-home-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #253549;
  background: #162232;
  color: #8b9db5;
  text-decoration: none;
  padding: 10px 16px;
  transition:
    border-color 0.2s ease,
    color 0.2s ease,
    background 0.2s ease;
}

.back-home-link:hover {
  border-color: #ff6b4a;
  color: #f0ede6;
  background: #1e2f42;
}

.back-home-icon {
  width: 16px;
  height: 16px;
}

.overlay {
  position: fixed;
  inset: 0;
  z-index: 6;
  display: grid;
  place-items: center;
  background: radial-gradient(circle at center, rgba(15, 25, 35, 0.2), rgba(15, 25, 35, 0.82));
  transition:
    opacity 0.25s ease,
    visibility 0.25s ease;
}

.overlay.hidden {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
}

.hero {
  width: min(860px, calc(100vw - 32px));
  border: 1px solid #253549;
  border-radius: 0;
  background: rgba(22, 34, 50, 0.96);
  box-shadow:
    0 20px 80px rgba(0, 0, 0, 0.58),
    0 0 40px rgba(255, 107, 74, 0.06);
  padding: 26px;
  text-align: center;
}

.hero h1 {
  margin: 0 0 8px;
  color: #ff6b4a;
  font-size: clamp(28px, 5vw, 50px);
  line-height: 1.02;
  text-shadow: 0 0 16px rgba(255, 107, 74, 0.08);
  font-family: 'Anybody', sans-serif;
}

.hero p {
  margin: 12px auto 0;
  max-width: 700px;
  font-size: 15px;
  line-height: 1.72;
  color: #8b9db5;
}

.big-kbd {
  margin: 18px auto 12px;
  width: max-content;
  padding: 12px 18px;
  border: 1px solid #253549;
  border-radius: 0;
  background: #1e2f42;
  color: #f0ede6;
  font-size: 14px;
  letter-spacing: 1px;
  font-family: 'Anybody', sans-serif;
}

.mini {
  margin-top: 12px;
  font-size: 12px;
  color: #4a6180;
}

.center-popup {
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%) scale(0.96);
  z-index: 9;
  width: min(720px, calc(100vw - 40px));
  border: 1px solid #ff6b4a;
  border-radius: 0;
  background: linear-gradient(180deg, rgba(22, 34, 50, 0.96), rgba(15, 25, 35, 0.98));
  box-shadow:
    0 24px 90px rgba(0, 0, 0, 0.64),
    0 0 26px rgba(255, 107, 74, 0.08);
  padding: 22px;
  text-align: center;
  opacity: 0;
  visibility: hidden;
  transition:
    opacity 0.2s ease,
    transform 0.2s ease,
    visibility 0.2s ease;
  pointer-events: none;
}

.center-popup.show {
  opacity: 1;
  visibility: visible;
  transform: translate(-50%, -50%) scale(1);
}

.popup-title {
  font-size: clamp(28px, 5vw, 54px);
  font-weight: 900;
  letter-spacing: 2px;
  color: #ff6b4a;
  text-shadow: 0 0 12px rgba(255, 107, 74, 0.12);
  margin: 0 0 8px;
  font-family: 'Anybody', sans-serif;
}

.popup-sub {
  font-size: 14px;
  color: #8b9db5;
  line-height: 1.68;
}

.popup-glow {
  position: absolute;
  inset: -2px;
  border-radius: 0;
  pointer-events: none;
  box-shadow:
    0 0 0 1px rgba(255, 107, 74, 0.08),
    0 0 30px rgba(255, 107, 74, 0.05);
}

.toast {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 10;
  max-width: min(520px, calc(100vw - 32px));
  padding: 12px 14px;
  border-radius: 0;
  border: 1px solid #253549;
  background: rgba(22, 34, 50, 0.96);
  color: #f0ede6;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.28);
  font-size: 13px;
  opacity: 0;
  transform: translateY(10px);
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
  pointer-events: none;
}

.toast.show {
  opacity: 1;
  transform: translateY(0);
}

.glitch {
  animation: glitch 0.11s linear 1;
}

.flash {
  animation: flash 0.14s linear 1;
}

.shake {
  animation: shake 0.18s linear 1;
}

@keyframes glitch {
  0% {
    transform: translate(0);
  }
  20% {
    transform: translate(-1px, 1px);
  }
  40% {
    transform: translate(1px, -1px);
  }
  60% {
    transform: translate(-1px, 0);
  }
  80% {
    transform: translate(1px, 1px);
  }
  100% {
    transform: translate(0);
  }
}

@keyframes flash {
  0% {
    filter: brightness(1);
  }
  45% {
    filter: brightness(1.12);
  }
  100% {
    filter: brightness(1);
  }
}

@keyframes shake {
  0% {
    transform: translate(-50%, -50%) translateX(0);
  }
  20% {
    transform: translate(-50%, -50%) translateX(-2px);
  }
  40% {
    transform: translate(-50%, -50%) translateX(2px);
  }
  60% {
    transform: translate(-50%, -50%) translateX(-2px);
  }
  80% {
    transform: translate(-50%, -50%) translateX(2px);
  }
  100% {
    transform: translate(-50%, -50%) translateX(0);
  }
}

@media (max-width: 1050px) {
  .page-shell {
    padding: 16px;
  }

  .issue-badge {
    position: static;
    display: inline-block;
    margin-bottom: 14px;
  }

  .app {
    grid-template-columns: 1fr;
    grid-template-rows: minmax(56vh, 1fr) auto;
    min-height: auto;
  }

  .terminal-split {
    grid-template-columns: 1fr;
  }

  .term-panel + .term-panel {
    border-left: none;
    border-top: 1px solid #253549;
  }
}
</style>
