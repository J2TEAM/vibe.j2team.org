<script setup lang="ts">
import { ref, computed } from 'vue'
import { useIntervalFn } from '@vueuse/core'

const props = defineProps<{
  command: string
  variant?: 'rings' | 'flood' | 'crack' | 'exploit' | 'trace' | 'pulse'
}>()

const currentVariant = computed(() => props.variant ?? 'rings')

// ── Shared ──────────────────────────────────────────
const MESSAGES: Record<string, string[]> = {
  rings: [
    'Bypass firewall layer 3...',
    'Mã hóa kết nối TOR...',
    'Khai thác CVE...',
    'Tải module exploit...',
    'Escalating privileges...',
    'Injecting shellcode...',
  ],
  flood: [
    'Gửi packet 10Gbps...',
    'Kết nối botnet nodes...',
    'Amplifying UDP flood...',
    'Bypass rate limiter...',
    'SYN flood active...',
    'DNS amplification...',
  ],
  crack: [
    'Thử combination #',
    'Dictionary attack...',
    'Rainbow table lookup...',
    'Brute forcing hash...',
    'Đang thử password...',
    'Kiểm tra entropy...',
  ],
  exploit: [
    'Inject payload EternalBlue...',
    'Ghi đè SMB buffer...',
    'Patch kernel memory...',
    'Vô hiệu hóa DEP/ASLR...',
    'Mở reverse shell...',
    'Escalating to SYSTEM...',
  ],
  trace: [
    'Ping TTL=1...',
    'ICMP echo request...',
    'Phân tích route table...',
    'BGP path lookup...',
    'Kiểm tra latency...',
    'Mapping topology...',
  ],
  pulse: [
    'Quét subnet /24...',
    'ARP probe...',
    'Fingerprint OS...',
    'Port sweep 1-65535...',
    'Phát hiện firewall...',
    'SNMP enumeration...',
  ],
}

const progress = ref(0)
const dots = ref(0)
const msgIdx = ref(0)
const msgCounter = ref(0)

useIntervalFn(() => {
  dots.value = (dots.value + 1) % 4
}, 400)
useIntervalFn(() => {
  progress.value = Math.min(99, progress.value + Math.random() * 11 + 2)
  msgCounter.value++
  if (msgCounter.value % 3 === 0) {
    const msgs = MESSAGES[currentVariant.value] ?? MESSAGES['rings']!
    msgIdx.value = (msgIdx.value + 1) % msgs.length
  }
}, 280)

// ── Variant: FLOOD (DDoS) ───────────────────────────
const FLOOD_BARS = 20
const floodBars = ref<number[]>(Array.from({ length: FLOOD_BARS }, () => Math.random()))
useIntervalFn(() => {
  floodBars.value = floodBars.value.map((v) => {
    const next = v + (Math.random() - 0.3) * 0.25
    return Math.min(1, Math.max(0.05, next))
  })
}, 120)

// ── Variant: CRACK (Brute-force) ────────────────────
const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
const crackSlots = ref<string[]>(
  Array.from({ length: 12 }, () => CHARSET[Math.floor(Math.random() * CHARSET.length)] ?? '?'),
)
const crackFound = ref<boolean[]>(Array(12).fill(false))
const crackedCount = ref(0)
useIntervalFn(() => {
  crackSlots.value = crackSlots.value.map((c, i) => {
    if (crackFound.value[i]) return c
    return CHARSET[Math.floor(Math.random() * CHARSET.length)] ?? '?'
  })
  // Progressively "find" characters based on progress
  const found = Math.floor((progress.value / 100) * 12)
  if (found > crackedCount.value) {
    crackFound.value[crackedCount.value] = true
    crackedCount.value = found
  }
}, 80)

// ── Variant: EXPLOIT (Binary grid) ──────────────────
const GRID_COLS = 20
const GRID_ROWS = 8
const exploitGrid = ref<number[][]>(
  Array.from({ length: GRID_ROWS }, () =>
    Array.from({ length: GRID_COLS }, () => Math.floor(Math.random() * 2)),
  ),
)
const exploitScanRow = ref(0)
useIntervalFn(() => {
  const row = exploitScanRow.value
  exploitGrid.value = exploitGrid.value.map((r, ri) =>
    r.map((c, ci) => {
      if (ri === row && ci <= Math.floor((progress.value / 100) * GRID_COLS)) return 2 // highlighted
      return Math.random() > 0.97 ? 1 - c : c
    }),
  )
  if (Math.random() > 0.7) exploitScanRow.value = Math.floor(Math.random() * GRID_ROWS)
}, 150)

// ── Variant: TRACE (Network path) ───────────────────
const TRACE_HOPS = 8
const traceHops = ref(
  Array.from({ length: TRACE_HOPS }, (_, i) => ({
    ip: `${10 + i}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    ms: Math.floor(Math.random() * 80 + 5),
    active: false,
  })),
)
const traceActiveHop = ref(-1)
useIntervalFn(() => {
  const hop = Math.floor((progress.value / 100) * TRACE_HOPS)
  if (hop !== traceActiveHop.value) {
    traceActiveHop.value = hop
    traceHops.value = traceHops.value.map((h, i) => ({ ...h, active: i <= hop }))
  }
}, 300)

// ── Variant: PULSE (Sonar scan) ─────────────────────
const pulseRings = ref([0.2, 0.5, 0.8])
useIntervalFn(() => {
  pulseRings.value = pulseRings.value.map((r) => (r >= 1 ? 0 : r + 0.015))
}, 50)

// ── Computed message ─────────────────────────────────
const currentMsg = computed(() => {
  const msgs = MESSAGES[currentVariant.value] ?? MESSAGES['rings']!
  const base = msgs[msgIdx.value] ?? ''
  if (currentVariant.value === 'crack') {
    return base + (base.endsWith('#') ? String(Math.floor(Math.random() * 9999999)) : '')
  }
  return base + '.'.repeat(dots.value)
})

const VARIANT_COLORS: Record<string, string> = {
  rings: '#00ff41',
  flood: '#ff6b35',
  crack: '#ffb830',
  exploit: '#ff3333',
  trace: '#00d4ff',
  pulse: '#00ff41',
}

const accentColor = computed(() => VARIANT_COLORS[currentVariant.value] ?? '#00ff41')
</script>

<template>
  <div class="loader-overlay">
    <div class="loader-scanlines" />

    <div
      class="loader-card"
      :style="{
        borderColor: accentColor,
        boxShadow: `0 0 40px ${accentColor}40, 0 0 80px ${accentColor}15, inset 0 0 40px ${accentColor}05`,
      }"
    >
      <!-- Top bar -->
      <div class="loader-topbar">
        <span class="loader-tag" :style="{ color: accentColor }">⬤ EXECUTING</span>
        <span class="loader-tag">{{
          new Date().toLocaleTimeString('vi-VN', { hour12: false })
        }}</span>
        <span class="loader-tag">{{ currentVariant.toUpperCase() }} MODE</span>
      </div>

      <!-- ═════════ VARIANT: RINGS ════════════════════ -->
      <div v-if="currentVariant === 'rings'" class="anim-rings">
        <div
          class="ring ring-1"
          :style="{ borderTopColor: accentColor, borderRightColor: accentColor + '30' }"
        />
        <div
          class="ring ring-2"
          :style="{ borderTopColor: accentColor + '80', borderLeftColor: accentColor + '40' }"
        />
        <div
          class="ring ring-3"
          :style="{ borderTopColor: '#00d4ff', borderBottomColor: '#00d4ff30' }"
        />
        <span
          class="core-symbol"
          :style="{ color: accentColor, textShadow: `0 0 20px ${accentColor}` }"
          >⬡</span
        >
      </div>

      <!-- ═════════ VARIANT: FLOOD (DDoS) ════════════ -->
      <div v-else-if="currentVariant === 'flood'" class="anim-flood">
        <div class="flood-label" :style="{ color: accentColor }">
          PACKET FLOOD — {{ Math.floor(progress * 100) }} MB/s
        </div>
        <div class="flood-bars">
          <div
            v-for="(h, i) in floodBars"
            :key="i"
            class="flood-bar"
            :style="{
              height: `${h * 100}%`,
              background: accentColor,
              boxShadow: `0 0 6px ${accentColor}`,
            }"
          />
        </div>
        <div class="flood-hits">
          <span :style="{ color: accentColor }"
            >PACKETS SENT: {{ Math.floor(progress * 847293) }}</span
          >
          <span :style="{ color: accentColor }"
            >DROP RATE: {{ Math.floor(Math.random() * 5) }}%</span
          >
        </div>
      </div>

      <!-- ═════════ VARIANT: CRACK ════════════════════ -->
      <div v-else-if="currentVariant === 'crack'" class="anim-crack">
        <div class="crack-label" :style="{ color: accentColor }">BRUTE FORCE ATTACK</div>
        <div class="crack-slots">
          <span
            v-for="(ch, i) in crackSlots"
            :key="i"
            class="crack-slot"
            :style="{
              color: crackFound[i] ? '#00ff41' : accentColor + '99',
              background: crackFound[i] ? '#00ff4120' : 'transparent',
              border: `1px solid ${crackFound[i] ? '#00ff41' : accentColor + '40'}`,
              textShadow: crackFound[i] ? '0 0 8px #00ff41' : 'none',
            }"
            >{{ ch }}</span
          >
        </div>
        <div class="crack-stats" :style="{ color: accentColor }">
          {{ crackedCount }}/12 chars found · {{ Math.floor(progress * 10000) }} tries/sec
        </div>
      </div>

      <!-- ═════════ VARIANT: EXPLOIT ══════════════════ -->
      <div v-else-if="currentVariant === 'exploit'" class="anim-exploit">
        <div class="exploit-label" :style="{ color: accentColor }">MEMORY INJECTION</div>
        <div class="exploit-grid">
          <div v-for="(row, ri) in exploitGrid" :key="ri" class="exploit-row">
            <span
              v-for="(cell, ci) in row"
              :key="ci"
              class="exploit-cell"
              :style="{
                color: cell === 2 ? accentColor : cell === 1 ? '#00ff4160' : '#ffffff15',
                textShadow: cell === 2 ? `0 0 6px ${accentColor}` : 'none',
                fontWeight: cell === 2 ? 'bold' : 'normal',
              }"
              >{{ cell === 0 ? '0' : '1' }}</span
            >
          </div>
        </div>
      </div>

      <!-- ═════════ VARIANT: TRACE ════════════════════ -->
      <div v-else-if="currentVariant === 'trace'" class="anim-trace">
        <div class="trace-label" :style="{ color: accentColor }">NETWORK TRACE</div>
        <div class="trace-hops">
          <div v-for="(hop, i) in traceHops" :key="i" class="trace-hop">
            <span class="trace-num" :style="{ color: hop.active ? accentColor : '#333' }">{{
              i + 1
            }}</span>
            <span
              class="trace-line"
              :style="{
                background: hop.active ? accentColor : '#222',
                boxShadow: hop.active ? `0 0 6px ${accentColor}` : 'none',
              }"
            />
            <span class="trace-ip" :style="{ color: hop.active ? accentColor : '#333' }">
              {{ hop.active ? hop.ip : '* * *' }}
            </span>
            <span class="trace-ms" :style="{ color: hop.active ? '#ffffff60' : '#222' }">
              {{ hop.active ? `${hop.ms}ms` : '' }}
            </span>
          </div>
        </div>
      </div>

      <!-- ═════════ VARIANT: PULSE (sonar) ════════════ -->
      <div v-else-if="currentVariant === 'pulse'" class="anim-pulse">
        <svg width="120" height="120" class="pulse-svg">
          <circle
            v-for="(r, i) in pulseRings"
            :key="i"
            cx="60"
            cy="60"
            :r="r * 55"
            fill="none"
            :stroke="accentColor"
            :stroke-width="1"
            :opacity="1 - r"
          />
          <circle
            cx="60"
            cy="60"
            r="6"
            :fill="accentColor"
            :style="{ filter: `drop-shadow(0 0 8px ${accentColor})` }"
          />
          <!-- sweep line -->
          <line
            x1="60"
            y1="60"
            :x2="60 + 50 * Math.cos((progress / 100) * Math.PI * 2 - Math.PI / 2)"
            :y2="60 + 50 * Math.sin((progress / 100) * Math.PI * 2 - Math.PI / 2)"
            :stroke="accentColor"
            stroke-width="1.5"
            opacity="0.7"
          />
        </svg>
      </div>

      <!-- Command display -->
      <div class="loader-cmd">
        <span class="loader-prompt" :style="{ color: accentColor }">root@matrix:~#</span>
        <span class="loader-cmd-text">{{ props.command }}</span>
        <span class="loader-cursor" :style="{ color: accentColor }">|</span>
      </div>

      <!-- Status message -->
      <div class="loader-status" :style="{ color: accentColor + 'dd' }">{{ currentMsg }}</div>

      <!-- Progress bar -->
      <div class="loader-progress-wrap" :style="{ borderColor: accentColor + '40' }">
        <div
          class="loader-progress-bar"
          :style="{
            width: `${progress}%`,
            background: `linear-gradient(to right, ${accentColor}, ${accentColor}cc)`,
            boxShadow: `0 0 10px ${accentColor}80`,
          }"
        />
        <span class="loader-progress-pct" :style="{ color: accentColor }"
          >{{ Math.floor(progress) }}%</span
        >
      </div>

      <!-- Warning -->
      <div class="loader-warning">⚠ KHÔNG NGẮT KẾT NỐI — ĐANG XỬ LÝ</div>
    </div>
  </div>
</template>

<style scoped>
.loader-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
}
.loader-scanlines {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    to bottom,
    transparent 0px,
    transparent 2px,
    rgba(0, 0, 0, 0.15) 2px,
    rgba(0, 0, 0, 0.15) 4px
  );
  pointer-events: none;
}
.loader-card {
  position: relative;
  width: min(500px, 92vw);
  background: rgba(0, 3, 0, 0.98);
  border: 1px solid;
  padding: 22px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  animation: card-appear 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes card-appear {
  from {
    transform: scale(0.88) translateY(10px);
    opacity: 0;
  }
  to {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}
.loader-topbar {
  width: 100%;
  display: flex;
  justify-content: space-between;
  font-family: 'Courier New', monospace;
  font-size: 10px;
}
.loader-tag {
  color: rgba(0, 255, 65, 0.5);
  letter-spacing: 1px;
}

/* ── RINGS ─────────────────── */
.anim-rings {
  position: relative;
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ring {
  position: absolute;
  border-radius: 50%;
  border: 1.5px solid transparent;
}
.ring-1 {
  width: 120px;
  height: 120px;
  animation: spin 1.1s linear infinite;
}
.ring-2 {
  width: 88px;
  height: 88px;
  animation: spin 0.7s linear infinite reverse;
}
.ring-3 {
  width: 58px;
  height: 58px;
  animation: spin 1.5s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.core-symbol {
  font-size: 28px;
  animation: core-pulse 1.4s ease infinite;
  position: relative;
  z-index: 1;
}
@keyframes core-pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.18);
  }
}

/* ── FLOOD ─────────────────── */
.anim-flood {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.flood-label {
  font-family: 'Courier New', monospace;
  font-size: 11px;
  letter-spacing: 2px;
}
.flood-bars {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 80px;
  width: 100%;
}
.flood-bar {
  flex: 1;
  border-radius: 1px 1px 0 0;
  transition: height 0.1s ease;
  min-height: 4px;
}
.flood-hits {
  display: flex;
  justify-content: space-between;
  width: 100%;
  font-family: 'Courier New', monospace;
  font-size: 10px;
}

/* ── CRACK ─────────────────── */
.anim-crack {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.crack-label {
  font-family: 'Courier New', monospace;
  font-size: 11px;
  letter-spacing: 2px;
}
.crack-slots {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  justify-content: center;
}
.crack-slot {
  width: 26px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Courier New', monospace;
  font-size: 16px;
  font-weight: bold;
  transition: all 0.15s;
}
.crack-stats {
  font-family: 'Courier New', monospace;
  font-size: 10px;
  text-align: center;
}

/* ── EXPLOIT ───────────────── */
.anim-exploit {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.exploit-label {
  font-family: 'Courier New', monospace;
  font-size: 11px;
  letter-spacing: 2px;
}
.exploit-grid {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.exploit-row {
  display: flex;
  gap: 4px;
}
.exploit-cell {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  width: 12px;
  text-align: center;
  transition:
    color 0.1s,
    text-shadow 0.1s;
}

/* ── TRACE ─────────────────── */
.anim-trace {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.trace-label {
  font-family: 'Courier New', monospace;
  font-size: 11px;
  letter-spacing: 2px;
  text-align: center;
}
.trace-hops {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
}
.trace-hop {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: 'Courier New', monospace;
  font-size: 10px;
}
.trace-num {
  width: 14px;
  text-align: right;
  flex-shrink: 0;
}
.trace-line {
  width: 18px;
  height: 1px;
  flex-shrink: 0;
  transition:
    background 0.3s,
    box-shadow 0.3s;
}
.trace-ip {
  flex: 1;
}
.trace-ms {
  flex-shrink: 0;
}

/* ── PULSE ─────────────────── */
.anim-pulse {
  display: flex;
  align-items: center;
  justify-content: center;
}
.pulse-svg {
  display: block;
}

/* ── SHARED BOTTOM ─────────── */
.loader-cmd {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 7px;
  width: 100%;
  overflow: hidden;
}
.loader-prompt {
  flex-shrink: 0;
}
.loader-cmd-text {
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.loader-cursor {
  animation: cur-blink 0.6s step-end infinite;
}
@keyframes cur-blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}
.loader-status {
  font-family: 'Courier New', monospace;
  font-size: 11px;
  width: 100%;
  text-align: center;
  letter-spacing: 1px;
  min-height: 1.4em;
}
.loader-progress-wrap {
  width: 100%;
  position: relative;
  height: 5px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid;
}
.loader-progress-bar {
  height: 100%;
  transition: width 0.22s ease;
}
.loader-progress-pct {
  position: absolute;
  right: 6px;
  top: -17px;
  font-family: 'Courier New', monospace;
  font-size: 10px;
}
.loader-warning {
  font-family: 'Courier New', monospace;
  font-size: 10px;
  color: rgba(255, 184, 48, 0.7);
  letter-spacing: 2px;
  animation: cur-blink 1.6s step-end infinite;
}
</style>
