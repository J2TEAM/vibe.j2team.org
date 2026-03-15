<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'

// --- CẤU TRÚC DỮ LIỆU ---
interface Player {
  id: number
  hp: number
  pos: { x: number; y: number }
  color: string
}
interface Obstacle {
  x: number
  y: number
  r: number
}
interface Medkit {
  x: number
  y: number
  r: number
  active: boolean
}
type GameStatus = 'idle' | 'firing' | 'win' | 'hit' | 'collision' | 'fail' | 'opponent_left'

// --- EMITS ---
const emit = defineEmits(['back'])

// --- TRẠNG THÁI GAME ---
const p1 = ref<Player>({ id: 1, hp: 100, pos: { x: 100, y: 400 }, color: '#22d3ee' })
const p2 = ref<Player>({ id: 2, hp: 100, pos: { x: 850, y: 400 }, color: '#f43f5e' })
const myId = ref(1)
const turn = ref(1)
const isFiring = ref(false)
const rawInput = ref('')
const gameStatus = ref<GameStatus>('idle')
const obstacles = ref<Obstacle[]>([])
const medkits = ref<Medkit[]>([])
const pathRef = ref<SVGPathElement | null>(null)

// Timer State - Fix lỗi 'any'
const timeLeft = ref(50)
let timerInterval: ReturnType<typeof setInterval> | null = null

// WebRTC State
const connState = ref<'idle' | 'creating' | 'joining' | 'connected'>('idle')
const offerSdp = ref('')
const answerSdp = ref('')
const pastedSdp = ref('')
const pc = ref<RTCPeerConnection | null>(null)
let dataChannel: RTCDataChannel | null = null

const activePlayer = computed(() => (turn.value === 1 ? p1.value : p2.value))
const targetPlayer = computed(() => (turn.value === 1 ? p2.value : p1.value))

const finalPath = computed(() => {
  return (
    `M ${activePlayer.value.pos.x} ${activePlayer.value.pos.y} ` +
    rawInput.value.replace(/^M\s*[\d.]+\s+[\d.]+/i, '').trim()
  )
})

const shuffleOnline = () => {
  if (myId.value !== 1) return
  p1.value.pos = { x: 50 + Math.random() * 150, y: 100 + Math.random() * 600 }
  p2.value.pos = { x: 800 + Math.random() * 150, y: 100 + Math.random() * 600 }
  obstacles.value = Array.from({ length: 5 }, () => ({
    x: 300 + Math.random() * 400,
    y: 100 + Math.random() * 600,
    r: 30 + Math.random() * 30,
  }))
  medkits.value = [
    { x: 400 + Math.random() * 200, y: 100 + Math.random() * 600, r: 20, active: true },
  ]

  if (dataChannel?.readyState === 'open') {
    dataChannel.send(
      JSON.stringify({
        type: 'sync',
        obs: obstacles.value,
        medkits: medkits.value,
        p1: p1.value.pos,
        p2: p2.value.pos,
      }),
    )
  }
}

const switchTurn = () => {
  turn.value = turn.value === 1 ? 2 : 1
  rawInput.value = ''
  gameStatus.value = 'idle'
  if (myId.value === 1) shuffleOnline()
  startTimer()
}

const startTimer = () => {
  if (timerInterval) clearInterval(timerInterval)
  timeLeft.value = 50
  timerInterval = setInterval(() => {
    if (gameStatus.value !== 'idle' || isFiring.value) return
    timeLeft.value--
    if (timeLeft.value <= 0) switchTurn()
  }, 1000)
}

const setupChannel = (ch: RTCDataChannel) => {
  dataChannel = ch
  ch.onopen = () => {
    connState.value = 'connected'
    if (myId.value === 1) shuffleOnline()
    startTimer()
  }
  ch.onmessage = (e) => {
    const msg = JSON.parse(e.data)
    if (msg.type === 'fire') {
      rawInput.value = msg.path
      executeFireLogic()
    }
    if (msg.type === 'sync') {
      obstacles.value = msg.obs
      medkits.value = msg.medkits
      p1.value.pos = msg.p1
      p2.value.pos = msg.p2
      startTimer()
    }
    if (msg.type === 'quit') {
      gameStatus.value = 'opponent_left'
      if (timerInterval) clearInterval(timerInterval)
    }
  }
}

const setupPC = () => {
  pc.value = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
  pc.value.onicecandidate = (e) => {
    if (!e.candidate && pc.value?.localDescription) {
      offerSdp.value = btoa(JSON.stringify(pc.value.localDescription))
    }
  }
  pc.value.ondatachannel = (e) => setupChannel(e.channel)
  pc.value.onconnectionstatechange = () => {
    if (pc.value?.connectionState === 'disconnected') gameStatus.value = 'opponent_left'
  }
}

const createRoom = async () => {
  connState.value = 'creating'
  setupPC()
  if (pc.value) {
    const ch = pc.value.createDataChannel('sniper')
    setupChannel(ch)
    const offer = await pc.value.createOffer()
    await pc.value.setLocalDescription(offer)
    myId.value = 1
  }
}

const joinRoom = async () => {
  setupPC()
  const decoded = JSON.parse(atob(pastedSdp.value))
  if (pc.value) {
    await pc.value.setRemoteDescription(decoded)
    const answer = await pc.value.createAnswer()
    await pc.value.setLocalDescription(answer)
    setTimeout(() => {
      if (pc.value?.localDescription)
        answerSdp.value = btoa(JSON.stringify(pc.value.localDescription))
    }, 1000)
    myId.value = 2
    connState.value = 'joining'
  }
}

const acceptAnswer = async () => {
  const decoded = JSON.parse(atob(pastedSdp.value))
  if (pc.value) await pc.value.setRemoteDescription(decoded)
}

const checkAction = (): GameStatus => {
  if (!pathRef.value) return 'fail'
  const path = pathRef.value
  const length = path.getTotalLength()
  let healed = false
  for (let i = 0; i <= 500; i++) {
    const pt = path.getPointAtLength((i / 500) * length)
    for (const ob of obstacles.value) {
      if (Math.sqrt((pt.x - ob.x) ** 2 + (pt.y - ob.y) ** 2) < ob.r) return 'collision'
    }
    for (const kit of medkits.value) {
      if (kit.active && Math.sqrt((pt.x - kit.x) ** 2 + (pt.y - kit.y) ** 2) < kit.r) {
        kit.active = false
        healed = true
      }
    }
  }
  if (healed) activePlayer.value.hp = Math.min(100, activePlayer.value.hp + 15)
  const end = path.getPointAtLength(length)
  const dist = Math.sqrt(
    (end.x - targetPlayer.value.pos.x) ** 2 + (end.y - targetPlayer.value.pos.y) ** 2,
  )
  if (dist < 30) {
    targetPlayer.value.hp -= 20
    return targetPlayer.value.hp <= 0 ? 'win' : 'hit'
  }
  return 'fail'
}

const executeFireLogic = () => {
  isFiring.value = true
  gameStatus.value = 'idle'
  if (timerInterval) clearInterval(timerInterval)
  setTimeout(() => {
    isFiring.value = false
    gameStatus.value = checkAction()
    if (gameStatus.value !== 'win') setTimeout(switchTurn, 2500)
  }, 2000)
}

const fire = () => {
  if (isFiring.value || !rawInput.value) return
  if (turn.value === myId.value && dataChannel?.readyState === 'open') {
    dataChannel.send(JSON.stringify({ type: 'fire', path: rawInput.value }))
  }
  executeFireLogic()
}

const quitToLobby = () => {
  if (dataChannel?.readyState === 'open') {
    dataChannel.send(JSON.stringify({ type: 'quit' }))
  }
  pc.value?.close()
  if (timerInterval) clearInterval(timerInterval)
  emit('back')
}

onUnmounted(() => {
  if (dataChannel?.readyState === 'open') dataChannel.send(JSON.stringify({ type: 'quit' }))
  pc.value?.close()
  if (timerInterval) clearInterval(timerInterval)
})
</script>

<template>
  <div class="flex h-screen bg-[#020617] text-slate-300 font-mono overflow-hidden">
    <div class="relative flex-[3] border-r border-slate-800 bg-[#020617]">
      <div
        v-if="connState === 'connected'"
        class="absolute top-5 left-0 right-0 flex flex-col items-center z-50"
      >
        <div
          class="text-2xl font-black"
          :class="timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-cyan-400'"
        >
          {{ timeLeft }}s
        </div>
        <div class="flex justify-between w-full px-10 mt-2">
          <div class="w-48">
            <div class="h-2 bg-slate-800 rounded-full">
              <div class="h-full bg-cyan-500 transition-all" :style="{ width: p1.hp + '%' }"></div>
            </div>
          </div>
          <div class="w-48">
            <div class="h-2 bg-slate-800 rounded-full">
              <div
                class="h-full bg-rose-500 transition-all ml-auto"
                :style="{ width: p2.hp + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <svg viewBox="0 0 1000 800" class="w-full h-full">
        <rect width="100%" height="100%" fill="url(#grid)" />
        <defs>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#1e293b" stroke-width="0.5" />
          </pattern>
        </defs>

        <circle
          v-for="(ob, i) in obstacles"
          :key="'ob-' + i"
          :cx="ob.x"
          :cy="ob.y"
          :r="ob.r"
          fill="#000"
          stroke="#475569"
          stroke-width="1"
        />

        <rect
          v-for="(kit, i) in medkits"
          :key="'kit-' + i"
          v-show="kit.active"
          :x="kit.x - 15"
          :y="kit.y - 15"
          width="30"
          height="30"
          fill="#22c55e"
          rx="4"
          class="animate-pulse"
        />

        <path
          v-if="isFiring || gameStatus === 'win' || gameStatus === 'hit'"
          ref="pathRef"
          :d="finalPath"
          fill="none"
          :stroke="activePlayer.color"
          stroke-width="5"
          stroke-linecap="round"
          class="animate-shoot"
        />

        <circle
          :cx="p1.pos.x"
          :cy="p1.pos.y"
          r="22"
          :fill="p1.color"
          :class="{ 'ring-4 ring-white': turn === 1 }"
        />
        <circle
          :cx="p2.pos.x"
          :cy="p2.pos.y"
          r="22"
          :fill="p2.color"
          :class="{ 'ring-4 ring-white': turn === 2 }"
        />
      </svg>

      <div
        v-if="gameStatus !== 'idle'"
        class="absolute inset-0 bg-black/40 flex items-center justify-center z-[100]"
      >
        <h1
          class="text-6xl font-black italic uppercase"
          :class="
            gameStatus === 'win' || gameStatus === 'opponent_left'
              ? 'text-green-500'
              : 'text-rose-500'
          "
        >
          {{
            gameStatus === 'win'
              ? 'VICTORY!'
              : gameStatus === 'opponent_left'
                ? 'OPPONENT LEFT - YOU WIN!'
                : 'ACTION ENDED'
          }}
        </h1>
      </div>
    </div>

    <div class="w-96 p-8 bg-slate-950 flex flex-col gap-6">
      <div v-if="connState !== 'connected'" class="space-y-4">
        <h2 class="text-cyan-400 font-black uppercase text-center">P2P Online Setup</h2>
        <div v-if="connState === 'idle'" class="space-y-4">
          <button
            @click="createRoom"
            class="w-full py-4 bg-purple-600 rounded-xl font-bold uppercase hover:bg-purple-500 transition-colors"
          >
            Host Room
          </button>
          <textarea
            v-model="pastedSdp"
            placeholder="Paste invite code..."
            class="w-full h-24 bg-black p-2 rounded-xl text-[10px] border border-slate-800"
          />
          <button
            @click="joinRoom"
            class="w-full py-4 bg-blue-600 rounded-xl font-bold uppercase hover:bg-blue-500 transition-colors"
          >
            Join Room
          </button>
        </div>
        <div v-if="connState === 'creating'" class="space-y-2">
          <p class="text-[10px] text-yellow-500 uppercase font-bold">
            1. Send this code to friend:
          </p>
          <textarea
            :value="offerSdp"
            readonly
            class="w-full h-24 bg-black p-2 text-[8px] border border-slate-800"
          />
          <p class="text-[10px] text-yellow-500 uppercase font-bold">2. Paste response below:</p>
          <textarea
            v-model="pastedSdp"
            class="w-full h-24 bg-black p-2 text-[8px] border border-slate-800"
          />
          <button
            @click="acceptAnswer"
            class="w-full py-4 bg-green-600 rounded-xl font-bold hover:bg-green-500 transition-colors"
          >
            Connect
          </button>
        </div>
        <div v-if="connState === 'joining'" class="space-y-2">
          <p class="text-[10px] text-yellow-500 uppercase font-bold">
            Send this response back to Host:
          </p>
          <textarea
            :value="answerSdp"
            readonly
            class="w-full h-24 bg-black p-2 text-[8px] border border-slate-800"
          />
          <p class="text-[10px] text-slate-500 italic text-center animate-pulse">
            Waiting for host to connect...
          </p>
        </div>
      </div>

      <div v-else class="flex-1 flex flex-col gap-4">
        <div
          class="p-3 bg-slate-900 rounded-xl text-center"
          :class="turn === myId ? 'border-green-500 border border-opacity-50' : 'opacity-50'"
        >
          <span
            class="text-[10px] font-bold uppercase tracking-widest"
            :class="turn === myId ? 'text-green-400' : 'text-slate-500'"
          >
            {{ turn === myId ? '● Your Turn' : '○ Opponent Thinking...' }}
          </span>
        </div>
        <textarea
          v-model="rawInput"
          :disabled="turn !== myId || isFiring"
          class="flex-1 bg-black/80 p-5 rounded-2xl border border-slate-800 text-cyan-300 font-mono text-sm resize-none focus:border-cyan-500 focus:outline-none"
          placeholder="Enter Path (L 800 400...)"
        />
        <button
          @click="fire"
          :disabled="turn !== myId || isFiring || !rawInput"
          class="py-5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-30 disabled:hover:bg-cyan-600 text-white font-black rounded-2xl uppercase tracking-widest transition-all active:scale-95"
        >
          FIRE
        </button>
      </div>
      <button
        @click="quitToLobby"
        class="text-[10px] uppercase opacity-30 hover:opacity-100 transition-opacity text-center tracking-tighter"
      >
        Quit to Lobby
      </button>
    </div>
  </div>
</template>

<style scoped>
.animate-shoot {
  stroke-dashoffset: 4000;
  animation: dash 2s linear forwards;
}
@keyframes dash {
  from {
    stroke-dashoffset: 4000;
  }
  to {
    stroke-dashoffset: 0;
  }
}
</style>
