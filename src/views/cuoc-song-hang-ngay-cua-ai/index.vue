<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { useClipboard } from '@vueuse/core'
import type { Message, SmartAgent } from './types'
import { useAI } from './useAI'
import { usePixelWorld } from './composables/usePixelWorld'
import { GRID_W, GRID_H } from './constants'
import { INITIAL_AGENTS } from './config/agents'
import { houseImg, wallImg, sunImg, moonImg, agentAssets } from './utils/assets'

// --- Components ---
import AppHeader from './components/AppHeader.vue'
import PixelCanvas from './components/PixelCanvas.vue'
import ChatBox from './components/ChatBox.vue'
import AgentSidebar from './components/AgentSidebar.vue'

// --- Styles ---
import './assets/pixel-world.css'

const messages = reactive<Message[]>([])
const { askStreaming, isProcessing } = useAI()
const currentTime = ref(new Date())

const isDaytime = computed(() => {
  const hour = currentTime.value.getHours()
  return hour >= 6 && hour < 18
})

const agents = reactive<SmartAgent[]>([...INITIAL_AGENTS])

// --- Cấu hình AI tổng hợp ---
const GLOBAL_SYSTEM_PROMPT = `Bạn là một hệ thống AI hợp nhất đặc biệt, được tạo ra bởi ngducnhat.
Hệ thống của bạn là sự kết hợp sức mạnh của 6 AI hàng đầu: ChatGPT, Claude, Copilot, DeepSeek, Gemini và Grok.
Bạn đang sống trong một thế giới Pixel vui nhộn.
Trong mỗi câu trả lời, hãy đóng vai một trong các AI trên (tên của AI sẽ được gửi kèm).
Hãy trả lời ngắn gọn, thông minh và thỉnh thoảng nhắc đến người tạo ra bạn là ngducnhat nếu phù hợp.`

const { collisionGrid, getRandomValidPos, setAgentTarget, updateAgents } = usePixelWorld(agents)

const selectedAgentId = ref<string | null>(null)
const selectAgent = (id: string) => {
  selectedAgentId.value = id
  setTimeout(() => {
    if (selectedAgentId.value === id) selectedAgentId.value = null
  }, 500)
}

const agentBuffer = document.createElement('canvas')
agentBuffer.width = 32
agentBuffer.height = 32
const bufferCtx = agentBuffer.getContext('2d')

const handleSendMessage = async (text: string) => {
  messages.push({
    id: Math.random().toString(36).substring(7),
    sender: 'user',
    text,
    timestamp: Date.now(),
  })

  agents.forEach((a, i) => {
    a.isResponding = true
    a.delayUntil = 0
    a.path = []

    a.statusText = 'ĐANG TRẢ LỜI'
    a.statusIcon = '💬'
    a.state = 'gathering'

    // Di chuyển ngay lập tức đến vị trí máy tính { x: 17.3, y: 6.3 }
    const rx = 17.3 + (i % 3) * 0.4 - 0.4
    const ry = 6.3 + Math.floor(i / 3) * 0.4 - 0.4
    setAgentTarget(a, { x: rx, y: ry }, 'gathering')
  })

  const respondingAgent = agents[Math.floor(Math.random() * agents.length)]
  const respondingAgentName = respondingAgent?.name || 'AGENT'

  const currentContext = `${GLOBAL_SYSTEM_PROMPT}\nHiện tại bạn đang đóng vai: ${respondingAgentName}.`

  const aiMsgId = Math.random().toString(36).substring(7)
  messages.push({
    id: aiMsgId,
    sender: 'ai',
    text: '',
    timestamp: Date.now(),
    status: 'streaming',
    agentName: respondingAgentName,
  })
  const aiMsgIdx = messages.findIndex((m) => m.id === aiMsgId)

  try {
    await askStreaming(
      text,
      (chunk) => {
        if (aiMsgIdx !== -1 && messages[aiMsgIdx]) messages[aiMsgIdx].text += chunk
      },
      currentContext,
    )
    if (aiMsgIdx !== -1 && messages[aiMsgIdx]) messages[aiMsgIdx].status = 'done'
  } catch {
    if (aiMsgIdx !== -1 && messages[aiMsgIdx]) messages[aiMsgIdx].status = 'error'
  } finally {
    const pauseTime = Date.now() + 1000
    agents.forEach((a) => {
      a.isResponding = false
      a.state = 'idle'
      a.statusText = 'THONG THẢ'
      a.statusIcon = null
      a.delayUntil = pauseTime
    })

    setTimeout(() => {
      agents.forEach((a) => {
        setAgentTarget(a, getRandomValidPos(), 'idle')
      })
    }, 1000)
  }
}

const { copy } = useClipboard()

const handleCanvasClick = (pos: { gx: number; gy: number }) => {
  const coord = `{ x: ${pos.gx}, y: ${pos.gy} }`
  copy(coord)
}

let rafId: number
let timerId: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  timerId = setInterval(() => {
    currentTime.value = new Date()
  }, 60000)
  messages.push({
    id: 'initial-greeting',
    sender: 'ai',
    status: 'done',
    text: 'Xin chào! Chúng tôi là những AI mạnh mẽ nhất hiện nay và đây là cuộc sống hàng ngày của chúng tôi.',
    timestamp: Date.now(),
    agentName: agents[Math.floor(Math.random() * agents.length)]?.name || 'AGENT',
  })

  wallImg.onload = () => {
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = GRID_W
    tempCanvas.height = GRID_H
    const tCtx = tempCanvas.getContext('2d')
    if (!tCtx) return
    tCtx.drawImage(wallImg, 0, 0, GRID_W, GRID_H)
    const imageDataObj = tCtx.getImageData(0, 0, GRID_W, GRID_H)
    if (!imageDataObj) return
    const imgData = imageDataObj.data
    const grid: boolean[][] = []
    for (let y = 0; y < GRID_H; y++) {
      grid[y] = []
      for (let x = 0; x < GRID_W; x++) {
        const idx = (y * GRID_W + x) * 4 + 3
        const alpha = imgData[idx] ?? 0
        grid[y]![x] = alpha > 0
      }
    }
    collisionGrid.value = grid
    agents.forEach((a) => {
      const pos = getRandomValidPos()
      a.pos = { ...pos }
      a.target = { ...pos }
    })
  }

  let lastTime = 0
  const renderLoop = (time: number) => {
    const dt = time - (lastTime || time)
    lastTime = time
    updateAgents(dt)

    const now = Date.now()
    agents.forEach((a) => {
      const isAvailable =
        (a.state === 'idle' || a.state === 'working' || a.state === 'sleeping') &&
        !a.isResponding &&
        now >= a.delayUntil
      if (isAvailable && Math.random() < 0.015) setAgentTarget(a, getRandomValidPos(), 'idle')
    })
    rafId = requestAnimationFrame(renderLoop)
  }
  rafId = requestAnimationFrame(renderLoop)
})

onUnmounted(() => {
  if (rafId) cancelAnimationFrame(rafId)
  if (timerId) clearInterval(timerId)
})
</script>

<template>
  <div
    class="min-h-screen bg-bg-deep text-text-primary font-pixel overflow-x-hidden selection:bg-accent-coral/30"
  >
    <!-- Top Bar / Issue Badge -->
    <div class="fixed top-6 right-6 z-50 animate-fade-up">
      <div
        class="bg-accent-coral text-bg-deep font-pixel font-bold text-xs tracking-widest px-3 py-1.5 rotate-3 shadow-lg"
      >
        VOL.01 / 2026
      </div>
    </div>

    <div class="max-w-350 mx-auto px-6 py-12 md:py-20">
      <AppHeader class="animate-fade-up" />

      <div class="flex flex-col xl:flex-row gap-8 items-start justify-between">
        <!-- Main Stage -->
        <div class="w-fit mx-auto xl:mx-0 animate-fade-up animate-delay-2 shrink-0">
          <div class="relative border border-border-default bg-bg-surface p-0 shadow-2xl">
            <PixelCanvas
              :agents="agents"
              :is-daytime="isDaytime"
              :selected-agent-id="selectedAgentId"
              :assets="{ houseImg, sunImg, moonImg, agentAssets, agentBuffer, bufferCtx }"
              @canvas-click="handleCanvasClick"
            />
            <!-- Decorative corner elements -->
            <div
              class="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-accent-coral"
            ></div>
            <div
              class="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-accent-coral"
            ></div>
          </div>
        </div>

        <!-- Interface Side -->
        <div
          class="w-full xl:flex-1 flex flex-col-reverse sm:flex-col lg:flex-row gap-4 h-auto xl:h-120.5 animate-fade-up animate-delay-3 min-w-0"
        >
          <ChatBox
            class="w-full h-[750] xl:h-full xl:flex-1 min-w-0"
            :messages="messages"
            :is-processing="isProcessing"
            @send="handleSendMessage"
          />
          <AgentSidebar :agents="agents" @select="selectAgent" />
        </div>
      </div>

      <!-- Proper Editorial Footer -->
      <footer
        class="mt-20 pt-8 border-t border-border-default flex flex-col md:flex-row justify-between items-center gap-6 font-pixel animate-fade-up animate-delay-4"
      >
        <div class="flex flex-col items-center md:items-start">
          <span class="text-xl font-bold text-text-primary uppercase tracking-tighter"
            >VIBE.J2TEAM.ORG</span
          >
        </div>

        <div class="flex flex-col items-center">
          <span class="text-[10px] text-text-dim tracking-[0.3em] uppercase mb-1">Created by</span>
          <span class="text-3xl font-bold text-accent-coral uppercase italic tracking-tighter"
            >NGDUCNHAT</span
          >
        </div>

        <div class="flex flex-col items-center md:items-end text-right">
          <span class="text-[10px] text-text-dim tracking-[0.3em] uppercase mb-1"
            >Release Version</span
          >
          <span class="text-xl font-bold text-text-primary italic tracking-tighter">V.2.0.26</span>
        </div>
      </footer>
    </div>
  </div>
</template>
