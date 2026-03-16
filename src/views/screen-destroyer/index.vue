<script setup lang="ts">
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import { RouterLink } from 'vue-router'
import { useEventListener, useIntervalFn } from '@vueuse/core'

type ToolId = 'hammer' | 'gun' | 'flame' | 'virus' | 'antivirus'

interface CrackMark {
  id: number
  x: number
  y: number
  paths: string[]
}

interface BulletMark {
  id: number
  x: number
  y: number
  size: number
}

interface FireMark {
  id: number
  x: number
  y: number
  w: number
  h: number
}

interface VirusMsg {
  title: string
  body: string
}

interface VirusWin {
  id: number
  x: number
  y: number
  msg: VirusMsg
  wiggling: boolean
}

const activeTool = ref<ToolId>('hammer')
const cracks = ref<CrackMark[]>([])
const bullets = ref<BulletMark[]>([])
const fires = ref<FireMark[]>([])
const viruses = ref<VirusWin[]>([])
const shaking = ref(false)
const virusSpamActive = ref(false)
let uid = 0
let virusSpamTimer: ReturnType<typeof setTimeout> | undefined

const currentTime = ref(getTime())
useIntervalFn(() => {
  currentTime.value = getTime()
}, 1000)

function getTime(): string {
  return new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

function spawnRandomVirus() {
  const idx = Math.floor(Math.random() * VIRUS_MSGS.length)
  const msg = VIRUS_MSGS[idx] ?? VIRUS_MSGS[0]!
  viruses.value.push({
    id: uid++,
    x: rnd(2, 55),
    y: rnd(2, 60),
    msg,
    wiggling: false,
  })
}

function scheduleNextSpawn() {
  if (!virusSpamActive.value) return
  // interval shrinks as more viruses pile up, min 400ms
  const count = viruses.value.length
  const delay = Math.max(400, 2000 - count * 120)
  virusSpamTimer = setTimeout(
    () => {
      if (!virusSpamActive.value) return
      spawnRandomVirus()
      scheduleNextSpawn()
    },
    delay + rnd(-150, 150),
  )
}

function toggleVirusSpam() {
  virusSpamActive.value = !virusSpamActive.value
  if (virusSpamActive.value) {
    scheduleNextSpawn()
  } else {
    clearTimeout(virusSpamTimer)
  }
}

const TOOLS: { id: ToolId; icon: string; label: string; key: string; desc: string }[] = [
  { id: 'hammer', icon: 'lucide:hammer', label: 'Búa', key: '1', desc: 'Đập vỡ màn hình' },
  { id: 'gun', icon: 'lucide:crosshair', label: 'Súng', key: '2', desc: 'Bắn thủng màn hình' },
  { id: 'flame', icon: 'lucide:flame', label: 'Phun Lửa', key: '3', desc: 'Đốt màn hình' },
  { id: 'virus', icon: 'lucide:bug', label: 'Thả Virus', key: '4', desc: 'Tạo popup virus' },
  {
    id: 'antivirus',
    icon: 'lucide:shield-check',
    label: 'Diệt Virus',
    key: '5',
    desc: 'Xóa popup virus',
  },
]

const TOOL_COLORS: Record<ToolId, string> = {
  hammer: '#FFB830',
  gun: '#FF6B4A',
  flame: '#FF4500',
  virus: '#22c55e',
  antivirus: '#38BDF8',
}

const VIRUS_MSGS = [
  {
    title: '⚠️ CẢNH BÁO KHẨN CẤP!',
    body: 'Máy tính của bạn đã bị nhiễm 69 VIRUS!\nDữ liệu đang bị đánh cắp ngay lúc này!\n\n☎ Gọi ngay: 1800-SCAM-999',
  },
  {
    title: '🔴 LỖI HỆ THỐNG NGHIÊM TRỌNG',
    body: 'Windows phát hiện 47 mối đe dọa!\nHệ thống của bạn có thể BỊ XÓA.\nNhấn OK để sửa NGAY (Miễn phí 100%!)',
  },
  {
    title: '💀 BẠN ĐÃ BỊ HACK!',
    body: 'Hacker đang xem webcam của bạn 👀\nTất cả ảnh đang upload lên dark web!\n\n💳 Thanh toán $999 trong 30 giây!',
  },
  {
    title: '🚨 FBI ĐÃ KHÓA MÁY TÍNH CỦA BẠN',
    body: 'Phát hiện hoạt động bất hợp pháp!\nĐịa chỉ IP của bạn đã bị ghi lại.\n\n📧 fbi-vietnam@totallyfake.gov',
  },
  {
    title: '🎉 BẠN ĐÃ THẮNG!',
    body: 'Chúc mừng! Bạn là người dùng thứ 1.000.000!\nBạn đã trúng iPhone 99 Pro Max Ultra!\n\n💰 Chỉ cần thanh toán phí vận chuyển $199',
  },
]

const DESKTOP_ICONS: { icon: string; label: string }[] = [
  { icon: 'lucide:monitor', label: 'My Computer' },
  { icon: 'lucide:folder', label: 'My Documents' },
  { icon: 'lucide:globe', label: 'Internet' },
  { icon: 'lucide:trash-2', label: 'Recycle Bin' },
  { icon: 'lucide:file-text', label: 'README.txt' },
]

function rnd(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function genCrackPaths(): string[] {
  const paths: string[] = []
  const arms = Math.floor(rnd(6, 11))
  for (let i = 0; i < arms; i++) {
    const base = (i / arms) * 2 * Math.PI + rnd(-0.25, 0.25)
    const totalLen = rnd(28, 46)
    let cx = 50
    let cy = 50
    let angle = base
    let d = 'M 50 50'
    const steps = Math.floor(rnd(2, 5))
    for (let s = 0; s < steps; s++) {
      angle += rnd(-0.3, 0.3)
      const l = (totalLen / steps) * rnd(0.7, 1.3)
      cx += Math.cos(angle) * l
      cy += Math.sin(angle) * l
      d += ` L ${cx.toFixed(1)} ${cy.toFixed(1)}`
    }
    paths.push(d)
    // branch crack
    if (Math.random() > 0.35) {
      const t = rnd(0.3, 0.65)
      const bx = 50 + Math.cos(base) * totalLen * t
      const by = 50 + Math.sin(base) * totalLen * t
      const ba = base + (Math.random() > 0.5 ? 1 : -1) * rnd(0.4, 0.9)
      const bl = totalLen * rnd(0.15, 0.35)
      paths.push(
        `M ${bx.toFixed(1)} ${by.toFixed(1)} L ${(bx + Math.cos(ba) * bl).toFixed(1)} ${(by + Math.sin(ba) * bl).toFixed(1)}`,
      )
    }
  }
  return paths
}

let shakeTimer: ReturnType<typeof setTimeout> | undefined

function doShake() {
  shaking.value = true
  clearTimeout(shakeTimer)
  shakeTimer = setTimeout(() => {
    shaking.value = false
  }, 380)
}

function onScreenClick(e: MouseEvent) {
  const el = e.currentTarget as HTMLElement
  const r = el.getBoundingClientRect()
  const px = ((e.clientX - r.left) / r.width) * 100
  const py = ((e.clientY - r.top) / r.height) * 100

  if (activeTool.value === 'hammer') {
    cracks.value.push({ id: uid++, x: px, y: py, paths: genCrackPaths() })
    doShake()
  } else if (activeTool.value === 'gun') {
    bullets.value.push({ id: uid++, x: px, y: py, size: rnd(2, 4) })
    doShake()
  } else if (activeTool.value === 'flame') {
    fires.value.push({ id: uid++, x: px, y: py, w: rnd(4, 8), h: rnd(7, 12) })
  } else if (activeTool.value === 'virus') {
    const idx = Math.floor(Math.random() * VIRUS_MSGS.length)
    const msg = VIRUS_MSGS[idx] ?? VIRUS_MSGS[0]!
    viruses.value.push({
      id: uid++,
      x: Math.min(Math.max(px - 10, 1), 55),
      y: Math.min(Math.max(py - 5, 1), 60),
      msg,
      wiggling: false,
    })
  }
}

function handleVirusClick(id: number, e: MouseEvent) {
  e.stopPropagation()
  if (activeTool.value === 'antivirus') {
    viruses.value = viruses.value.filter((v) => v.id !== id)
  } else {
    const v = viruses.value.find((w) => w.id === id)
    if (v) {
      v.x = Math.min(Math.max(rnd(2, 55), 2), 55)
      v.y = Math.min(Math.max(rnd(2, 60), 2), 60)
      v.wiggling = true
      setTimeout(() => {
        const found = viruses.value.find((w) => w.id === id)
        if (found) found.wiggling = false
      }, 600)
    }
  }
}

function reset() {
  cracks.value = []
  bullets.value = []
  fires.value = []
  viruses.value = []
  virusSpamActive.value = false
  clearTimeout(virusSpamTimer)
}

const KEY_MAP: Record<string, ToolId> = {
  '1': 'hammer',
  '2': 'gun',
  '3': 'flame',
  '4': 'virus',
  '5': 'antivirus',
}

useEventListener('keydown', (e: KeyboardEvent) => {
  const tool = KEY_MAP[e.key]
  if (tool) activeTool.value = tool
  if (e.key === 's' || e.key === 'S') toggleVirusSpam()
})
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col">
    <!-- Header -->
    <header class="flex items-center gap-3 px-4 py-3 border-b border-border-default shrink-0">
      <RouterLink
        to="/"
        class="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition border border-border-default bg-bg-surface px-3 py-1.5 hover:border-accent-coral"
      >
        <Icon icon="lucide:arrow-left" class="size-4" />
        Về trang chủ
      </RouterLink>
      <h1 class="font-display text-lg font-bold text-accent-coral flex-1 text-center">
        💥 Screen Destroyer
      </h1>
      <button
        class="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-accent-coral transition border border-border-default bg-bg-surface px-3 py-1.5 hover:border-accent-coral"
        @click="reset"
      >
        <Icon icon="lucide:rotate-ccw" class="size-4" />
        Đặt lại
      </button>
    </header>

    <!-- Main -->
    <div class="flex flex-1 gap-3 p-3 min-h-0 flex-col sm:flex-row">
      <!-- Toolbar -->
      <aside class="flex sm:flex-col flex-row gap-2 shrink-0 sm:w-[88px]">
        <button
          v-for="tool in TOOLS"
          :key="tool.id"
          class="flex flex-col items-center gap-1 p-2 border transition-all font-display text-xs flex-1 sm:flex-none sm:w-full"
          :class="[
            activeTool === tool.id
              ? 'border-accent-coral bg-bg-elevated'
              : 'border-border-default bg-bg-surface text-text-secondary hover:border-accent-coral/60 hover:text-text-primary',
          ]"
          :style="{ color: activeTool === tool.id ? TOOL_COLORS[tool.id] : undefined }"
          :title="tool.desc"
          @click="activeTool = tool.id"
        >
          <Icon :icon="tool.icon" class="size-5 sm:size-6" />
          <span class="hidden sm:block leading-tight text-center text-[11px]">{{
            tool.label
          }}</span>
          <span class="text-text-dim text-[9px]">[{{ tool.key }}]</span>
        </button>

        <!-- Virus spam toggle -->
        <button
          class="flex flex-col items-center gap-1 p-2 border transition-all font-display text-xs flex-1 sm:flex-none sm:w-full"
          :class="[
            virusSpamActive
              ? 'border-accent-coral bg-accent-coral/10 text-accent-coral animate-pulse'
              : 'border-border-default bg-bg-surface text-text-secondary hover:border-accent-coral/60 hover:text-accent-coral',
          ]"
          title="Bật/tắt virus tự động spam"
          @click="toggleVirusSpam"
        >
          <Icon icon="lucide:zap" class="size-5 sm:size-6" />
          <span class="hidden sm:block leading-tight text-center text-[11px]">{{
            virusSpamActive ? 'STOP!' : 'Auto Spam'
          }}</span>
          <span class="text-[9px] opacity-60">[S]</span>
        </button>
      </aside>

      <!-- Screen container -->
      <div
        class="flex-1 relative overflow-hidden select-none border border-border-default min-h-[55vw] sm:min-h-0"
        :class="
          activeTool === 'antivirus'
            ? 'cursor-crosshair'
            : activeTool === 'virus'
              ? 'cursor-default'
              : 'cursor-crosshair'
        "
        @click="onScreenClick"
      >
        <!-- Fake XP desktop (pointer-events-none so clicks pass through) -->
        <div class="absolute inset-0 pointer-events-none xp-desktop">
          <!-- Desktop icons -->
          <div class="absolute top-3 left-3 flex flex-col gap-4">
            <div
              v-for="dicon in DESKTOP_ICONS"
              :key="dicon.label"
              class="flex flex-col items-center gap-1 w-14 text-white"
            >
              <Icon :icon="dicon.icon" class="size-7 drop-shadow-lg text-white" />
              <span class="text-[10px] text-center leading-tight drop-shadow-lg">{{
                dicon.label
              }}</span>
            </div>
          </div>

          <!-- Taskbar -->
          <div class="absolute bottom-0 left-0 right-0 h-7 xp-taskbar flex items-center gap-1 px-1">
            <div
              class="flex items-center gap-1 bg-green-600 hover:bg-green-500 text-white text-[11px] font-bold px-2 h-5 rounded-sm"
            >
              <Icon icon="lucide:layout-grid" class="size-3" />
              Start
            </div>
            <div class="flex-1" />
            <div
              class="xp-clock text-white text-[11px] px-2 h-5 flex items-center border border-[#1030A0]/60"
            >
              {{ currentTime }}
            </div>
          </div>
        </div>

        <!-- Shake wrapper -->
        <div class="absolute inset-0 pointer-events-none" :class="{ 'screen-shake': shaking }">
          <!-- Glass sheen overlay -->
          <div
            class="absolute inset-0"
            style="
              background: linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, transparent 60%);
            "
          />
        </div>

        <!-- Crack SVGs -->
        <svg
          v-for="crack in cracks"
          :key="crack.id"
          class="absolute pointer-events-none"
          :style="{
            left: `calc(${crack.x}% - 100px)`,
            top: `calc(${crack.y}% - 100px)`,
            width: '200px',
            height: '200px',
          }"
          viewBox="0 0 100 100"
          overflow="visible"
        >
          <path
            v-for="(p, i) in crack.paths"
            :key="`d${i}`"
            :d="p"
            stroke="rgba(0,0,0,0.9)"
            stroke-width="1.8"
            fill="none"
            stroke-linecap="round"
          />
          <path
            v-for="(p, i) in crack.paths"
            :key="`w${i}`"
            :d="p"
            stroke="rgba(255,255,255,0.4)"
            stroke-width="0.6"
            fill="none"
            stroke-linecap="round"
          />
          <!-- Impact center -->
          <circle cx="50" cy="50" r="5" fill="rgba(0,0,0,0.95)" />
          <circle cx="48" cy="48" r="1.5" fill="rgba(255,255,255,0.3)" />
        </svg>

        <!-- Bullet holes -->
        <div
          v-for="b in bullets"
          :key="b.id"
          class="absolute pointer-events-none rounded-full bullet-hole"
          :style="{
            left: `${b.x}%`,
            top: `${b.y}%`,
            width: `${b.size}%`,
            paddingBottom: `${b.size}%`,
            transform: 'translate(-50%, -50%)',
          }"
        />

        <!-- Fire effects -->
        <div
          v-for="f in fires"
          :key="f.id"
          class="absolute pointer-events-none fire-wrapper"
          :style="{
            left: `${f.x}%`,
            top: `${f.y}%`,
            width: `${f.w}%`,
            height: `${f.h}%`,
            transform: 'translate(-50%, -100%)',
          }"
        >
          <div class="fire-outer" />
          <div class="fire-mid" />
          <div class="fire-inner" />
          <div class="fire-core" />
        </div>

        <!-- Virus popups — pointer-events-auto to intercept clicks -->
        <div
          v-for="v in viruses"
          :key="v.id"
          class="absolute virus-window pointer-events-auto"
          :class="{ 'virus-wiggle': v.wiggling }"
          :style="{ left: `${v.x}%`, top: `${v.y}%`, zIndex: 100 }"
          @click="handleVirusClick(v.id, $event)"
        >
          <!-- Classic Windows title bar -->
          <div class="virus-titlebar flex items-center justify-between px-1.5 py-0.5">
            <div class="flex items-center gap-1 min-w-0">
              <Icon icon="lucide:alert-triangle" class="size-3 text-yellow-300 shrink-0" />
              <span class="text-white text-[11px] font-bold truncate">{{ v.msg.title }}</span>
            </div>
            <div class="flex gap-0.5 shrink-0 ml-2">
              <button
                class="virus-btn text-black text-[11px] font-bold leading-none"
                @click="handleVirusClick(v.id, $event)"
              >
                ✕
              </button>
            </div>
          </div>
          <!-- Body -->
          <div class="virus-body px-3 pt-3 pb-2">
            <div class="flex gap-2 items-start mb-3">
              <Icon icon="lucide:alert-circle" class="size-8 text-red-600 shrink-0 mt-0.5" />
              <p class="text-[11px] text-black whitespace-pre-line leading-relaxed">
                {{ v.msg.body }}
              </p>
            </div>
            <div class="flex justify-end gap-1 pt-2 border-t border-[#808080]">
              <button class="virus-action-btn" @click="handleVirusClick(v.id, $event)">OK</button>
              <button class="virus-action-btn" @click="handleVirusClick(v.id, $event)">Hủy</button>
            </div>
          </div>
          <!-- Hint when antivirus selected -->
          <div
            v-if="activeTool === 'antivirus'"
            class="absolute -top-6 left-0 right-0 text-center text-[10px] text-accent-sky font-display animate-pulse"
          >
            Click để tiêu diệt!
          </div>
        </div>
      </div>
    </div>

    <!-- Footer hint -->
    <footer
      class="px-4 py-2 border-t border-border-default text-xs text-text-dim text-center shrink-0"
    >
      Chọn công cụ và click vào màn hình để phá hoại • Dùng
      <span class="text-accent-sky">Diệt Virus [5]</span> để xóa popup •
      <span class="text-accent-coral">[S]</span> bật Auto Spam virus • Phím tắt:
      <span class="text-text-secondary">1–5, S</span>
    </footer>
  </div>
</template>

<style scoped>
.xp-desktop {
  background:
    radial-gradient(ellipse 100% 35% at 50% 90%, #2e7d32 0%, #388e3c 40%, transparent 100%),
    radial-gradient(ellipse 130% 45% at 20% 95%, #1b5e20 0%, #2e7d32 50%, transparent 100%),
    radial-gradient(ellipse 80% 30% at 80% 88%, #33691e 0%, #558b2f 50%, transparent 100%),
    linear-gradient(
      180deg,
      #4a9de6 0%,
      #87ceeb 42%,
      #a8d8f0 48%,
      #6dbf6d 48%,
      #4caf50 65%,
      #2e7d32 100%
    );
}

.xp-taskbar {
  background: linear-gradient(180deg, #245edc 0%, #1941a5 100%);
  border-top: 1px solid #3a7ae8;
}

.xp-clock {
  background: rgba(20, 50, 140, 0.5);
}

.screen-shake {
  animation: screen-shake 0.38s ease-in-out;
}

@keyframes screen-shake {
  0%,
  100% {
    transform: translate(0, 0) rotate(0);
  }
  10% {
    transform: translate(-5px, -3px) rotate(-0.4deg);
  }
  20% {
    transform: translate(5px, 3px) rotate(0.4deg);
  }
  30% {
    transform: translate(-6px, 2px) rotate(-0.3deg);
  }
  40% {
    transform: translate(6px, -3px) rotate(0.3deg);
  }
  50% {
    transform: translate(-4px, 4px) rotate(-0.4deg);
  }
  60% {
    transform: translate(4px, -2px) rotate(0.4deg);
  }
  70% {
    transform: translate(-5px, 2px) rotate(-0.2deg);
  }
  80% {
    transform: translate(5px, -2px) rotate(0.2deg);
  }
  90% {
    transform: translate(-2px, 1px) rotate(0);
  }
}

.bullet-hole {
  background: radial-gradient(
    circle at 35% 35%,
    #555 0%,
    #1a1a1a 30%,
    #000 55%,
    rgba(0, 0, 0, 0.5) 75%,
    transparent 100%
  );
  box-shadow:
    0 0 8px 3px rgba(0, 0, 0, 0.7),
    inset 0 0 3px rgba(255, 255, 255, 0.08);
}

.fire-wrapper {
  position: absolute;
}

.fire-outer {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 100%,
    #ff4500 0%,
    #ff6a00 35%,
    rgba(255, 100, 0, 0.2) 70%,
    transparent 100%
  );
  animation: flicker-a 0.3s infinite alternate ease-in-out;
  filter: blur(2px);
}

.fire-mid {
  position: absolute;
  inset: 8% 12%;
  background: radial-gradient(ellipse at 50% 100%, #ff8c00 0%, #ff6a00 40%, transparent 80%);
  animation: flicker-b 0.22s infinite alternate ease-in-out;
  filter: blur(1px);
}

.fire-inner {
  position: absolute;
  inset: 20% 25%;
  background: radial-gradient(ellipse at 50% 100%, #ffcc00 0%, #ff8c00 50%, transparent 85%);
  animation: flicker-c 0.18s infinite alternate ease-in-out;
}

.fire-core {
  position: absolute;
  inset: 40% 38%;
  background: radial-gradient(ellipse at 50% 100%, #fff 0%, #ffee88 50%, transparent 90%);
  animation: flicker-a 0.15s infinite alternate ease-in-out;
}

@keyframes flicker-a {
  0% {
    transform: scaleX(1) scaleY(1);
    opacity: 0.9;
  }
  100% {
    transform: scaleX(0.88) scaleY(1.06);
    opacity: 1;
  }
}

@keyframes flicker-b {
  0% {
    transform: scaleX(0.94) scaleY(1.06) translateY(4%);
    opacity: 0.85;
  }
  100% {
    transform: scaleX(1.06) scaleY(0.94) translateY(-4%);
    opacity: 1;
  }
}

@keyframes flicker-c {
  0% {
    transform: scaleX(1.08) scaleY(0.92) translateY(-5%);
    opacity: 0.9;
  }
  100% {
    transform: scaleX(0.92) scaleY(1.08) translateY(5%);
    opacity: 1;
  }
}

.virus-window {
  min-width: 230px;
  max-width: 280px;
  border: 2px solid #003399;
  box-shadow:
    2px 2px 0 #000,
    inset 1px 1px 0 rgba(255, 255, 255, 0.5);
}

.virus-titlebar {
  background: linear-gradient(90deg, #000082 0%, #1084d0 60%, #0050c8 100%);
  padding: 3px 4px;
}

.virus-btn {
  width: 16px;
  height: 14px;
  background: linear-gradient(180deg, #d4d0c8 0%, #b8b4ac 100%);
  border-top: 1px solid #dfdfdf;
  border-left: 1px solid #dfdfdf;
  border-bottom: 1px solid #808080;
  border-right: 1px solid #808080;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  cursor: pointer;
}

.virus-btn:hover {
  background: linear-gradient(180deg, #cc0000 0%, #aa0000 100%);
  color: white;
}

.virus-body {
  background: #d4d0c8;
}

.virus-action-btn {
  padding: 2px 16px;
  background: linear-gradient(180deg, #d4d0c8 0%, #c0bdb5 100%);
  border-top: 1px solid #dfdfdf;
  border-left: 1px solid #dfdfdf;
  border-bottom: 1px solid #808080;
  border-right: 1px solid #808080;
  font-size: 11px;
  color: black;
  cursor: pointer;
}

.virus-action-btn:hover {
  background: linear-gradient(180deg, #e0ddd5 0%, #ccc9c1 100%);
}

.virus-wiggle {
  animation: wiggle 0.55s ease-in-out;
}

@keyframes wiggle {
  0%,
  100% {
    transform: rotate(0) scale(1);
  }
  12% {
    transform: rotate(-5deg) scale(1.04);
  }
  25% {
    transform: rotate(5deg) scale(1.04);
  }
  37% {
    transform: rotate(-4deg) scale(1.02);
  }
  50% {
    transform: rotate(4deg) scale(1.02);
  }
  62% {
    transform: rotate(-2deg) scale(1.01);
  }
  75% {
    transform: rotate(2deg) scale(1.01);
  }
  87% {
    transform: rotate(-1deg);
  }
}
</style>
