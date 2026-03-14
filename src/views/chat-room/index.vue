<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { RouterLink } from 'vue-router'

interface Message {
  id: string
  text: string
  sender: string
  isMine: boolean
  timestamp: number
}

// State
const messages = ref<Message[]>([])
const newMessage = ref('')
const username = ref('')
const isConnected = ref(false)
const isEditingName = ref(true)
const chatContainer = ref<HTMLElement | null>(null)

// Constants
const WEBSOCKET_URL =
  'wss://free.blr2.piesocket.com/v3/1?api_key=UxkDRisVvzzxwowiBMvQaEOnB6ozuPKIOoA0c6F0&notify_self=1'
let socket: WebSocket | null = null

// Random Name Generator
const adjectives = ['Night', 'Swift', 'Silent', 'Dancing', 'Sleepy', 'Vibe', 'Hyper']
const nouns = ['Owl', 'Fox', 'Wolf', 'Panda', 'Coder', 'Hacker', 'Ninja']
const generateRandomName = () => {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  return `${adj} ${noun} ${Math.floor(Math.random() * 1000)}`
}

// Initialization
onMounted(() => {
  const savedName = localStorage.getItem('vibe_chat_username')
  if (savedName) {
    username.value = savedName
    isEditingName.value = false
    connectWebSocket()
  } else {
    username.value = generateRandomName()
  }
})

onUnmounted(() => {
  if (socket) {
    socket.close()
  }
})

const saveNameAndConnect = () => {
  if (!username.value.trim()) {
    username.value = generateRandomName()
  }
  localStorage.setItem('vibe_chat_username', username.value)
  isEditingName.value = false
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    connectWebSocket()
  }
}

const connectWebSocket = () => {
  try {
    socket = new WebSocket(WEBSOCKET_URL)

    socket.onopen = () => {
      isConnected.value = true
      addSystemMessage('Đã kết nối vào phòng chat!')
    }

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'chat') {
          // If we received our own message via broadcast, ignore it to prevent duplicates if we already added it.
          // Piesocket notify_self echoes it back.
          if (data.sender !== username.value) {
            messages.value.push({
              id: data.id,
              text: data.text,
              sender: data.sender,
              isMine: false,
              timestamp: data.timestamp,
            })
            scrollToBottom()
          }
        }
      } catch (e) {
        console.error('Invalid message format', e)
      }
    }

    socket.onclose = () => {
      isConnected.value = false
      addSystemMessage('Đã ngắt kết nối. Đang thử lại...')
      setTimeout(connectWebSocket, 5000)
    }

    socket.onerror = (err) => {
      console.error('WebSocket Error:', err)
      socket?.close()
    }
  } catch (err) {
    console.error('Failed to connect:', err)
  }
}

const sendMessage = () => {
  const text = newMessage.value.trim()
  if (!text || !isConnected.value) return

  const messageData = {
    type: 'chat',
    id: Math.random().toString(36).substr(2, 9),
    text: text,
    sender: username.value,
    timestamp: Date.now(),
  }

  // Add to local state
  messages.value.push({
    ...messageData,
    isMine: true,
  })

  scrollToBottom()

  // Send to WebSocket server
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(messageData))
  }

  newMessage.value = ''
}

const addSystemMessage = (text: string) => {
  messages.value.push({
    id: `sys-${Date.now()}`,
    text,
    sender: 'System',
    isMine: false,
    timestamp: Date.now(),
  })
  scrollToBottom()
}

const scrollToBottom = async () => {
  await nextTick()
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

const formatTime = (ts: number) => {
  const date = new Date(ts)
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}
</script>

<template>
  <div
    class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col p-4 md:p-8 relative"
  >
    <!-- Header with Back Button -->
    <div class="flex items-center justify-between mb-6">
      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary rounded-lg shadow-sm"
      >
        &larr; Về trang chủ
      </RouterLink>
      <div class="flex items-center gap-2">
        <span class="relative flex h-3 w-3">
          <span
            v-if="isConnected"
            class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"
          ></span>
          <span
            :class="isConnected ? 'bg-green-500' : 'bg-red-500'"
            class="relative inline-flex rounded-full h-3 w-3"
          ></span>
        </span>
        <span class="text-sm font-medium" :class="isConnected ? 'text-green-400' : 'text-red-400'">
          {{ isConnected ? 'Online' : 'Offline' }}
        </span>
      </div>
    </div>

    <!-- Main Chat Workspace -->
    <div
      class="flex-1 max-w-4xl w-full mx-auto flex flex-col bg-bg-surface border border-border-default rounded-xl shadow-2xl relative overflow-hidden"
    >
      <!-- Name Setup Overlay -->
      <div
        v-if="isEditingName"
        class="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 rounded-xl"
      >
        <div
          class="bg-bg-deep border border-border-default p-6 md:p-8 rounded-xl shadow-xl max-w-md w-full animate-fade-up"
        >
          <h2 class="text-2xl font-display font-bold text-accent-coral mb-2">Chào thím!</h2>
          <p class="text-text-secondary text-sm mb-6">Jalo - Phòng chat số 19.</p>

          <div class="mb-4">
            <label class="block text-sm font-medium text-text-secondary mb-1"
              >Đặt tên đi đạo hữu:</label
            >
            <input
              v-model="username"
              @keyup.enter="saveNameAndConnect"
              type="text"
              class="w-full bg-bg-surface border border-border-default rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:border-accent-coral focus:ring-1 focus:ring-accent-coral transition"
              placeholder="Nhập tên..."
              maxlength="20"
            />
          </div>
          <button
            @click="saveNameAndConnect"
            class="w-full bg-accent-coral hover:bg-opacity-90 text-white font-medium py-3 rounded-lg transition"
          >
            Vào phòng chat
          </button>
        </div>
      </div>

      <!-- Chat Header -->
      <div
        class="px-6 py-4 border-b border-border-default bg-black/20 flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <h1 class="text-xl font-bold font-display text-accent-coral">Alo - Jalo</h1>
          <p class="text-xs text-text-secondary">Không mang văn phòng về nhà bạn.</p>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-sm text-text-secondary"
            >Vai: <strong class="text-text-primary">{{ username }}</strong></span
          >
          <button
            @click="isEditingName = true"
            class="text-xs border border-border-default rounded px-2 py-1 hover:bg-border-default transition"
          >
            Đổi tên
          </button>
        </div>
      </div>

      <!-- Chat Messages Area -->
      <div ref="chatContainer" class="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 scroll-smooth">
        <div
          v-for="msg in messages"
          :key="msg.id"
          class="flex flex-col"
          :class="[
            msg.isMine ? 'items-end' : 'items-start',
            msg.sender === 'System' ? 'items-center' : '',
          ]"
        >
          <!-- System Message -->
          <div
            v-if="msg.sender === 'System'"
            class="my-2 bg-black/20 rounded-full px-4 py-1 text-xs text-text-secondary border border-border-default"
          >
            {{ msg.text }}
          </div>

          <!-- User Message -->
          <div v-else class="max-w-[85%] md:max-w-[70%]">
            <div
              class="text-[10px] text-text-secondary mb-1 flex items-center gap-2"
              :class="msg.isMine ? 'flex-row-reverse' : ''"
            >
              <span
                class="font-semibold"
                :class="msg.isMine ? 'text-accent-coral' : 'text-blue-400'"
                >{{ msg.sender }}</span
              >
              <span>{{ formatTime(msg.timestamp) }}</span>
            </div>

            <div
              class="px-4 py-2.5 rounded-2xl break-words whitespace-pre-wrap shadow-sm"
              :class="
                msg.isMine
                  ? 'bg-accent-coral text-white rounded-tr-sm'
                  : 'bg-[#2a2d3e] text-text-primary rounded-tl-sm border border-border-default'
              "
            >
              {{ msg.text }}
            </div>
          </div>
        </div>
      </div>

      <!-- Message Input -->
      <div class="p-4 bg-black/20 border-t border-border-default">
        <form @submit.prevent="sendMessage" class="flex gap-2 relative">
          <input
            v-model="newMessage"
            type="text"
            placeholder="Nhập tin nhắn..."
            class="flex-1 bg-bg-deep border border-border-default rounded-full pl-5 pr-12 py-3 text-sm text-text-primary focus:outline-none focus:border-accent-coral focus:ring-1 focus:ring-accent-coral transition shadow-inner"
            :disabled="!isConnected || isEditingName"
          />
          <button
            type="submit"
            class="absolute right-2 top-1.5 bottom-1.5 aspect-square bg-accent-coral hover:bg-opacity-90 text-white rounded-full flex items-center justify-center transition disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="!newMessage.trim() || !isConnected || isEditingName"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              class="w-4 h-4 ml-1"
            >
              <path
                d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z"
              />
            </svg>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Optional custom scrollbar to match dark vibe */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #3f4354;
  border-radius: 10px;
}
::-webkit-scrollbar-thumb:hover {
  background: #f06292; /* accent-coral approx */
}
</style>
