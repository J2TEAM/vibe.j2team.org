<script setup lang="ts">
import { ref } from 'vue'
import { useEventListener } from '@vueuse/core'
import { RouterLink } from 'vue-router'
import MatrixRain from './components/MatrixRain.vue'
import HackerTerminal from './components/HackerTerminal.vue'
import RadarChart from './components/RadarChart.vue'
import SystemMonitor from './components/SystemMonitor.vue'
import PopupWindow from './components/PopupWindow.vue'
import LogFeed from './components/LogFeed.vue'
import FakeCam from './components/FakeCam.vue'
import NetworkGraph from './components/NetworkGraph.vue'
import HackerLoader from './components/HackerLoader.vue'

const started = ref(false)
const matrixOpacity = ref(0.12)
const lastCmd = ref('')
const cmdCount = ref(0)
const isLoading = ref(false)
const activeCmd = ref('')
const loaderVariant = ref<'rings' | 'flood' | 'crack' | 'exploit' | 'trace' | 'pulse'>('rings')

interface PopupData {
  title: string
  lines: string[]
  type: 'info' | 'warning' | 'danger' | 'success'
}

const popup = ref<PopupData | null>(null)

const IGNORED_KEYS = new Set([
  'F1',
  'F2',
  'F3',
  'F4',
  'F5',
  'F6',
  'F7',
  'F8',
  'F9',
  'F10',
  'F11',
  'F12',
  'Tab',
  'CapsLock',
  'OS',
  'Meta',
  'Alt',
  'Shift',
  'Control',
  'Escape',
])

useEventListener(document, 'keydown', (e: KeyboardEvent) => {
  if (!started.value && !IGNORED_KEYS.has(e.key)) {
    started.value = true
  }
})

function handlePopup(data: PopupData) {
  popup.value = data
}

function closePopup() {
  popup.value = null
}

function handleCommandExecuted(cmd: string) {
  if (cmd) {
    lastCmd.value = cmd
    cmdCount.value++
  }
}

function handleProcessingStart(cmd: string, variant: string) {
  activeCmd.value = cmd
  loaderVariant.value =
    (variant as 'rings' | 'flood' | 'crack' | 'exploit' | 'trace' | 'pulse') || 'rings'
  isLoading.value = true
}

function handleProcessingEnd() {
  isLoading.value = false
  activeCmd.value = ''
}

const currentTime = ref(new Date().toLocaleTimeString('vi-VN', { hour12: false }))
setInterval(() => {
  currentTime.value = new Date().toLocaleTimeString('vi-VN', { hour12: false })
}, 1000)
</script>

<template>
  <div class="hacker-root">
    <MatrixRain :opacity="matrixOpacity" />

    <!-- ====== INTRO SCREEN ====== -->
    <Transition name="fade">
      <div v-if="!started" class="intro-screen">
        <div class="scanlines" />
        <div class="intro-content">
          <div class="intro-topbar">
            <span class="intro-tag">SYS: MATRIX_OS v13.37</span>
            <span class="intro-tag">{{ currentTime }}</span>
            <span class="intro-tag">⬤ SECURE</span>
          </div>

          <pre class="ascii-title">
 ██╗  ██╗ █████╗  ██████╗██╗  ██╗███████╗██████╗
 ██║  ██║██╔══██╗██╔════╝██║ ██╔╝██╔════╝██╔══██╗
 ███████║███████║██║     █████╔╝ █████╗  ██████╔╝
 ██╔══██║██╔══██║██║     ██╔═██╗ ██╔══╝  ██╔══██╗
 ██║  ██║██║  ██║╚██████╗██║  ██╗███████╗██║  ██║
 ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝</pre
          >

          <div class="intro-subtitle">M O D E</div>

          <div class="intro-blink-wrap">
            <span class="intro-blink">[ NHẤN PHÍM BẤT KỲ ĐỂ KHỞI ĐỘNG HỆ THỐNG ]</span>
          </div>

          <div class="intro-warning">
            ⚠ CẢNH BÁO: Đây là mô phỏng. Không có hành vi xâm nhập thực tế nào được thực hiện.
          </div>

          <RouterLink to="/" class="intro-home-link">← Về trang chủ</RouterLink>
        </div>
      </div>
    </Transition>

    <!-- ====== MAIN HUD ====== -->
    <Transition name="slide-in">
      <div v-if="started" class="hud-root">
        <div class="scanlines" />

        <!-- Top HUD bar -->
        <div class="hud-topbar">
          <div class="hud-logo">⬡ MATRIX OS</div>
          <div class="hud-center">
            <span class="hud-status-dot" />
            <span class="hud-status-text">KẾT NỐI AN TOÀN — TOR NETWORK ACTIVE</span>
          </div>
          <div class="hud-right">
            <span v-if="lastCmd" class="hud-last-cmd">
              <span class="hud-last-label">LAST:</span> {{ lastCmd }}
              <span class="hud-cmd-badge">{{ cmdCount }}</span>
            </span>
            <span class="hud-time">{{ currentTime }}</span>
            <RouterLink to="/" class="hud-home">← Trang Chủ</RouterLink>
          </div>
        </div>

        <!-- ===== MAIN LAYOUT: 3 columns ===== -->
        <div class="hud-main">
          <!-- LEFT: cam + network map (stacked) -->
          <div class="hud-left-col">
            <div class="chart-panel">
              <FakeCam />
            </div>
            <div class="chart-panel">
              <NetworkGraph />
            </div>
          </div>

          <!-- CENTER: Terminal (full height) -->
          <div class="hud-terminal-col">
            <HackerTerminal
              @popup="handlePopup"
              @command-executed="handleCommandExecuted"
              @processing-start="handleProcessingStart"
              @processing-end="handleProcessingEnd"
            />
          </div>

          <!-- RIGHT: Radar + SystemMonitor + LogFeed -->
          <div class="hud-right-col">
            <div class="chart-panel">
              <RadarChart />
            </div>
            <div class="chart-panel">
              <SystemMonitor />
            </div>
            <div class="chart-panel log-panel">
              <div class="log-title">// SYSTEM LOG</div>
              <LogFeed />
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ====== LOADER ====== -->
    <Transition name="fade">
      <HackerLoader v-if="isLoading" :command="activeCmd" :variant="loaderVariant" />
    </Transition>

    <!-- ====== POPUP ====== -->
    <Transition name="fade">
      <PopupWindow v-if="popup" :title="popup.title" :type="popup.type" @close="closePopup">
        <div v-for="(line, i) in popup.lines" :key="i">{{ line }}&nbsp;</div>
      </PopupWindow>
    </Transition>
  </div>
</template>

<style scoped>
/* ===== ROOT ===== */
.hacker-root {
  position: relative;
  height: 100vh;
  background: #000000;
  overflow: hidden;
  font-family: 'Courier New', monospace;
}

/* ===== SCANLINES ===== */
.scanlines {
  position: fixed;
  inset: 0;
  background: repeating-linear-gradient(
    to bottom,
    transparent 0px,
    transparent 2px,
    rgba(0, 0, 0, 0.08) 2px,
    rgba(0, 0, 0, 0.08) 4px
  );
  pointer-events: none;
  z-index: 5;
}

/* ===== INTRO ===== */
.intro-screen {
  position: fixed;
  inset: 0;
  z-index: 20;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
}
.intro-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 20px;
  max-width: 700px;
  width: 100%;
  text-align: center;
}
.intro-topbar {
  display: flex;
  gap: 24px;
  font-size: 11px;
  color: rgba(0, 255, 65, 0.5);
  letter-spacing: 2px;
  flex-wrap: wrap;
  justify-content: center;
}
.intro-tag {
  color: rgba(0, 255, 65, 0.5);
}
.ascii-title {
  color: #00ff41;
  font-size: clamp(5px, 1.3vw, 13px);
  line-height: 1.2;
  text-shadow: 0 0 20px rgba(0, 255, 65, 0.5);
  white-space: pre;
  overflow-x: auto;
  margin: 0;
}
.intro-subtitle {
  font-size: clamp(16px, 4vw, 32px);
  letter-spacing: 20px;
  color: rgba(0, 255, 65, 0.6);
}
.intro-blink-wrap {
  margin: 10px 0;
}
.intro-blink {
  color: #00ff41;
  font-size: clamp(11px, 2vw, 15px);
  letter-spacing: 3px;
  animation: blink 1.2s step-end infinite;
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
.intro-warning {
  font-size: 11px;
  color: rgba(255, 184, 48, 0.7);
  max-width: 500px;
  line-height: 1.6;
}
.intro-home-link {
  color: rgba(0, 255, 65, 0.5);
  text-decoration: none;
  font-size: 12px;
  letter-spacing: 2px;
  transition: color 0.2s;
}
.intro-home-link:hover {
  color: #00ff41;
}

/* ===== HUD ROOT ===== */
.hud-root {
  position: relative;
  z-index: 10;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* ===== TOP BAR ===== */
.hud-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 14px;
  background: rgba(0, 0, 0, 0.85);
  border-bottom: 1px solid rgba(0, 255, 65, 0.2);
  flex-shrink: 0;
  flex-wrap: wrap;
  gap: 8px;
}
.hud-logo {
  font-size: 13px;
  font-weight: bold;
  color: #00ff41;
  letter-spacing: 3px;
  text-shadow: 0 0 10px rgba(0, 255, 65, 0.5);
}
.hud-center {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  letter-spacing: 1px;
}
.hud-status-dot {
  width: 7px;
  height: 7px;
  background: #00ff41;
  border-radius: 50%;
  animation: pulse-dot 2s infinite;
  display: inline-block;
  box-shadow: 0 0 6px #00ff41;
}
@keyframes pulse-dot {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}
.hud-status-text {
  color: rgba(0, 255, 65, 0.7);
}
.hud-right {
  display: flex;
  align-items: center;
  gap: 14px;
}
.hud-last-cmd {
  font-family: 'Courier New', monospace;
  font-size: 10px;
  color: rgba(0, 212, 255, 0.8);
  display: flex;
  align-items: center;
  gap: 5px;
  animation: cmd-appear 0.3s ease;
}
@keyframes cmd-appear {
  from {
    opacity: 0;
    transform: translateY(-3px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.hud-last-label {
  color: rgba(0, 212, 255, 0.4);
}
.hud-cmd-badge {
  background: rgba(0, 255, 65, 0.15);
  border: 1px solid rgba(0, 255, 65, 0.3);
  color: #00ff41;
  font-size: 9px;
  padding: 1px 5px;
  min-width: 18px;
  text-align: center;
}
.hud-time {
  color: #00d4ff;
  font-size: 13px;
  font-weight: bold;
  letter-spacing: 2px;
}
.hud-home {
  color: rgba(0, 255, 65, 0.5);
  text-decoration: none;
  font-size: 11px;
  letter-spacing: 2px;
  border: 1px solid rgba(0, 255, 65, 0.2);
  padding: 3px 10px;
  transition: all 0.2s;
}
.hud-home:hover {
  color: #00ff41;
  border-color: #00ff41;
  box-shadow: 0 0 8px rgba(0, 255, 65, 0.3);
}

/* ===== 3-COLUMN MAIN LAYOUT ===== */
.hud-main {
  flex: 1;
  display: grid;
  grid-template-columns: 240px 1fr 260px;
  gap: 10px;
  padding: 10px;
  height: calc(100vh - 46px);
  min-height: 0;
}

/* Left col: cam + network stacked */
.hud-left-col {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: none;
}
.hud-left-col::-webkit-scrollbar {
  display: none;
}

/* Center col: terminal */
.hud-terminal-col {
  min-height: 0;
  height: 100%;
}

/* Right col: radar + monitor + log */
.hud-right-col {
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  scrollbar-width: none;
}
.hud-right-col::-webkit-scrollbar {
  display: none;
}

/* ===== PANELS ===== */
.chart-panel {
  background: rgba(0, 0, 0, 0.85);
  border: 1px solid rgba(0, 255, 65, 0.13);
  padding: 10px;
  flex-shrink: 0;
  box-shadow: 0 0 10px rgba(0, 255, 65, 0.04);
}
.log-panel {
  flex: 1;
  min-height: 120px;
}
.log-title {
  color: #00ff41;
  font-size: 10px;
  letter-spacing: 2px;
  opacity: 0.8;
  margin-bottom: 8px;
}

/* ===== TRANSITIONS ===== */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.slide-in-enter-active {
  transition: all 0.5s ease;
}
.slide-in-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

/* ===== RESPONSIVE ===== */
@media (max-width: 900px) {
  .hud-main {
    grid-template-columns: 1fr 220px;
    grid-template-rows: auto 1fr;
    height: auto;
    min-height: calc(100vh - 46px);
  }
  .hud-left-col {
    grid-column: 1 / -1;
    flex-direction: row;
    overflow-x: auto;
    overflow-y: visible;
  }
  .hud-left-col .chart-panel {
    flex-shrink: 0;
    min-width: 200px;
  }
  .hud-terminal-col {
    height: 55vh;
  }
}
@media (max-width: 600px) {
  .hud-main {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
  }
  .hud-terminal-col {
    height: 55vh;
  }
  .hud-right-col {
    overflow-y: visible;
  }
  .ascii-title {
    font-size: 5px;
  }
  .hud-center {
    display: none;
  }
  .hud-last-cmd {
    display: none;
  }
}
</style>
