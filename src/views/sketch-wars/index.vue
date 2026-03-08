<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import {
  useWebrtcGameConnection,
  type GameMessage,
  type DrawMessage,
} from './use-webrtc-game-connection'
import { useSketchWarsGameCanvas, PLAYER_COLORS } from './use-sketch-wars-game-canvas'

const canvasRef = ref<HTMLCanvasElement | null>(null)
const isHost = ref(false)
const peerReady = ref(false)
const joinInput = ref('')
const answerInput = ref('')
const copied = ref(false)

const conn = useWebrtcGameConnection()
const game = useSketchWarsGameCanvas(canvasRef, isHost)

/** Whether both peers are connected and game can start */
const canStart = computed(() => conn.state.value === 'connected' && isHost.value)
const isConnected = computed(() => conn.state.value === 'connected')
const showCanvas = computed(() => conn.state.value === 'connected')

/** Current player label */
const playerLabel = computed(() => (isHost.value ? 'Player 1 (Coral)' : 'Player 2 (Sky)'))
const playerColor = computed(() =>
  isHost.value ? PLAYER_COLORS.p1.hex : PLAYER_COLORS.p2.hex,
)

/** Round result text */
const roundResultText = computed(() => {
  if (game.isPlaying.value) return ''
  const { p1, p2 } = game.scores.value
  if (p1 === 0 && p2 === 0) return ''
  if (p1 > p2) return 'Player 1 thắng round này!'
  if (p2 > p1) return 'Player 2 thắng round này!'
  return 'Hòa!'
})

/** Match winner text */
const matchResultText = computed(() => {
  if (!game.winner.value) return ''
  if (game.winner.value === 'draw') return 'Trận đấu hòa!'
  return game.winner.value === 'p1'
    ? 'Player 1 (Coral) chiến thắng!'
    : 'Player 2 (Sky) chiến thắng!'
})

// Wire up WebRTC messages to game canvas
conn.onMessage((msg: GameMessage) => {
  if (msg.t === 'draw') {
    game.handleRemoteDraw(msg as DrawMessage)
  }
  if (msg.t === 'ready') {
    peerReady.value = true
  }
  if (msg.t === 'start') {
    game.startRound()
  }
  if (msg.t === 'end') {
    game.endRound()
  }
})

// Wire up local draw events to send over WebRTC
game.onDraw((e) => {
  conn.send({ t: 'draw', x: e.x, y: e.y, px: e.px, py: e.py, s: e.s, d: e.d })
})

async function handleCreateRoom() {
  isHost.value = true
  await conn.createOffer()
}

async function handleJoin() {
  isHost.value = false
  await conn.joinWithOffer(joinInput.value)
}

async function handleAcceptAnswer() {
  await conn.acceptAnswer(answerInput.value)
}

function handleStartGame() {
  conn.send({ t: 'start' })
  game.startRound()
}

function handleNextRound() {
  conn.send({ t: 'start' })
  game.nextRound()
}

function handleNewMatch() {
  game.resetMatch()
  conn.send({ t: 'start' })
  game.startRound()
}

async function copyToClipboard(text: string) {
  await navigator.clipboard.writeText(text)
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}

onMounted(() => {
  game.initCanvas()
})
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col items-center px-4 py-8">
    <!-- Header -->
    <div class="w-full max-w-2xl animate-fade-up">
      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
      >
        &larr; Về trang chủ
      </RouterLink>

      <h1 class="mt-6 font-display text-4xl sm:text-5xl font-bold text-accent-coral">
        Sketch Wars
      </h1>
      <p class="mt-2 text-text-secondary">
        Vẽ đối kháng real-time — chiếm lãnh thổ bằng màu sắc!
      </p>
    </div>

    <!-- Connection Setup -->
    <div v-if="!isConnected" class="w-full max-w-2xl mt-8 space-y-6 animate-fade-up animate-delay-2">
      <!-- Create or Join -->
      <div v-if="conn.state.value === 'idle'" class="flex flex-col sm:flex-row gap-4">
        <button
          class="flex-1 border border-accent-coral bg-accent-coral/10 px-6 py-4 font-display font-semibold text-accent-coral transition hover:bg-accent-coral/20"
          @click="handleCreateRoom"
        >
          Tạo phòng (Player 1)
        </button>
        <div class="flex-1 space-y-3">
          <input
            v-model="joinInput"
            placeholder="Dán mã mời vào đây..."
            class="w-full border border-border-default bg-bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-dim focus:border-accent-sky focus:outline-none"
          />
          <button
            :disabled="!joinInput.trim()"
            class="w-full border border-accent-sky bg-accent-sky/10 px-6 py-3 font-display font-semibold text-accent-sky transition hover:bg-accent-sky/20 disabled:opacity-40 disabled:cursor-not-allowed"
            @click="handleJoin"
          >
            Tham gia (Player 2)
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="conn.isLoading.value" class="text-text-secondary text-center py-4">
        Đang kết nối...
      </div>

      <!-- Host: Show offer code -->
      <div v-if="conn.state.value === 'waiting-answer'" class="space-y-4">
        <p class="text-text-secondary text-sm">
          Gửi mã mời này cho đối thủ:
        </p>
        <textarea
          :value="conn.offerSdp.value"
          readonly
          class="w-full h-20 border border-border-default bg-bg-surface px-4 py-3 text-xs text-text-dim font-mono resize-none focus:outline-none"
        />
        <button
          class="w-full border-2 border-accent-coral bg-accent-coral/15 px-6 py-3 font-display font-bold text-accent-coral transition hover:bg-accent-coral/25 active:bg-accent-coral/30"
          @click="copyToClipboard(conn.offerSdp.value)"
        >
          {{ copied ? '✓ Đã copy mã mời!' : 'Copy mã mời' }}
        </button>
        <p class="text-text-secondary text-sm">
          Sau đó dán mã trả lời từ đối thủ:
        </p>
        <input
          v-model="answerInput"
          placeholder="Dán mã trả lời..."
          class="w-full border border-border-default bg-bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-dim focus:border-accent-coral focus:outline-none"
        />
        <button
          :disabled="!answerInput.trim()"
          class="border border-accent-amber bg-accent-amber/10 px-6 py-3 font-display font-semibold text-accent-amber transition hover:bg-accent-amber/20 disabled:opacity-40 disabled:cursor-not-allowed"
          @click="handleAcceptAnswer"
        >
          Kết nối
        </button>
      </div>

      <!-- Guest: Show answer code -->
      <div v-if="conn.state.value === 'joining' && conn.answerSdp.value" class="space-y-4">
        <p class="text-text-secondary text-sm">
          Gửi mã trả lời này cho người tạo phòng:
        </p>
        <textarea
          :value="conn.answerSdp.value"
          readonly
          class="w-full h-20 border border-border-default bg-bg-surface px-4 py-3 text-xs text-text-dim font-mono resize-none focus:outline-none"
        />
        <button
          class="w-full border-2 border-accent-sky bg-accent-sky/15 px-6 py-3 font-display font-bold text-accent-sky transition hover:bg-accent-sky/25 active:bg-accent-sky/30"
          @click="copyToClipboard(conn.answerSdp.value)"
        >
          {{ copied ? '✓ Đã copy mã trả lời!' : 'Copy mã trả lời' }}
        </button>
        <p class="text-accent-sky text-sm">Đang chờ kết nối...</p>
      </div>

      <!-- Error -->
      <p v-if="conn.errorMessage.value" class="text-red-400 text-sm">
        {{ conn.errorMessage.value }}
      </p>
    </div>

    <!-- Game Area -->
    <div v-if="showCanvas" class="w-full max-w-2xl mt-8 space-y-4 animate-fade-up">
      <!-- Game Info Bar -->
      <div class="flex items-center justify-between border border-border-default bg-bg-surface px-4 py-3">
        <div class="flex items-center gap-3">
          <span
            class="w-3 h-3 inline-block"
            :style="{ backgroundColor: playerColor }"
          />
          <span class="font-display text-sm font-semibold">{{ playerLabel }}</span>
        </div>
        <div class="font-display text-sm text-text-secondary">
          Round {{ game.round.value }}/{{ game.totalRounds }}
        </div>
        <div class="flex items-center gap-4 text-sm">
          <span class="text-accent-coral font-display font-bold">
            {{ game.roundWins.value.p1 }}
          </span>
          <span class="text-text-dim">—</span>
          <span class="text-accent-sky font-display font-bold">
            {{ game.roundWins.value.p2 }}
          </span>
        </div>
      </div>

      <!-- Timer -->
      <div v-if="game.isPlaying.value" class="text-center">
        <span
          class="font-display text-3xl font-bold"
          :class="game.timeLeft.value <= 10 ? 'text-red-400' : 'text-accent-amber'"
        >
          {{ game.timeLeft.value }}s
        </span>
      </div>

      <!-- Canvas -->
      <div class="border border-border-default bg-bg-surface p-1">
        <canvas
          ref="canvasRef"
          class="w-full cursor-crosshair"
          :class="{ 'pointer-events-none opacity-70': !game.isPlaying.value }"
          :style="{ aspectRatio: `${game.canvasWidth} / ${game.canvasHeight}` }"
          @pointerdown="game.handlePointerDown"
          @pointermove="game.handlePointerMove"
          @pointerup="game.handlePointerUp"
          @pointerleave="game.handlePointerUp"
        />
      </div>

      <!-- Start / Round Result / Match Result -->
      <div class="text-center space-y-4">
        <!-- Before game starts -->
        <button
          v-if="canStart && !game.isPlaying.value && !game.winner.value && game.round.value === 1 && game.scores.value.p1 === 0"
          class="border border-accent-coral bg-accent-coral/10 px-8 py-3 font-display font-bold text-accent-coral transition hover:bg-accent-coral/20"
          @click="handleStartGame"
        >
          Bắt đầu!
        </button>

        <!-- Waiting for host to start (guest view) -->
        <p
          v-if="!isHost && !game.isPlaying.value && !game.winner.value && game.round.value === 1 && game.scores.value.p1 === 0"
          class="text-text-secondary text-sm"
        >
          Chờ Player 1 bắt đầu trận đấu...
        </p>

        <!-- Round result -->
        <div v-if="!game.isPlaying.value && roundResultText && !game.winner.value" class="space-y-3">
          <p class="font-display text-xl font-bold text-accent-amber">{{ roundResultText }}</p>
          <p class="text-text-secondary text-sm">
            Coral: {{ game.scores.value.p1.toLocaleString() }} px —
            Sky: {{ game.scores.value.p2.toLocaleString() }} px
          </p>
          <button
            v-if="isHost"
            class="border border-accent-amber bg-accent-amber/10 px-8 py-3 font-display font-bold text-accent-amber transition hover:bg-accent-amber/20"
            @click="handleNextRound"
          >
            Round tiếp theo
          </button>
          <p v-else class="text-text-secondary text-sm">Chờ Player 1 bắt đầu round tiếp...</p>
        </div>

        <!-- Match winner -->
        <div v-if="game.winner.value" class="space-y-3">
          <p class="font-display text-2xl font-bold" :class="game.winner.value === 'p1' ? 'text-accent-coral' : game.winner.value === 'p2' ? 'text-accent-sky' : 'text-accent-amber'">
            {{ matchResultText }}
          </p>
          <p class="text-text-secondary text-sm">
            Coral: {{ game.roundWins.value.p1 }} wins — Sky: {{ game.roundWins.value.p2 }} wins
          </p>
          <button
            v-if="isHost"
            class="border border-accent-coral bg-accent-coral/10 px-8 py-3 font-display font-bold text-accent-coral transition hover:bg-accent-coral/20"
            @click="handleNewMatch"
          >
            Chơi lại
          </button>
        </div>
      </div>

      <!-- Disconnect -->
      <div class="text-center pt-4">
        <button
          class="border border-border-default px-4 py-2 text-sm text-text-dim transition hover:border-red-400 hover:text-red-400"
          @click="conn.disconnect()"
        >
          Ngắt kết nối
        </button>
      </div>
    </div>

    <!-- How to play -->
    <div v-if="!isConnected" class="w-full max-w-2xl mt-12 animate-fade-up animate-delay-3">
      <h2 class="font-display text-xl font-semibold text-text-primary mb-4 flex items-center gap-3">
        <span class="text-accent-amber font-display text-sm tracking-widest">//</span>
        Cách chơi
      </h2>
      <div class="grid gap-4 sm:grid-cols-2">
        <div class="border border-border-default bg-bg-surface p-4">
          <p class="font-display text-sm font-semibold text-accent-coral mb-2">1. Kết nối</p>
          <p class="text-text-secondary text-sm">Player 1 tạo phòng, gửi mã mời cho Player 2. Player 2 dán mã và gửi lại mã trả lời.</p>
        </div>
        <div class="border border-border-default bg-bg-surface p-4">
          <p class="font-display text-sm font-semibold text-accent-sky mb-2">2. Vẽ</p>
          <p class="text-text-secondary text-sm">Mỗi người có 60 giây để vẽ và chiếm lãnh thổ trên canvas bằng màu của mình.</p>
        </div>
        <div class="border border-border-default bg-bg-surface p-4">
          <p class="font-display text-sm font-semibold text-accent-amber mb-2">3. Tính điểm</p>
          <p class="text-text-secondary text-sm">Hết giờ, hệ thống đếm pixel. Ai có nhiều pixel hơn thắng round đó.</p>
        </div>
        <div class="border border-border-default bg-bg-surface p-4">
          <p class="font-display text-sm font-semibold text-text-primary mb-2">4. Best of 3</p>
          <p class="text-text-secondary text-sm">Ai thắng 2/3 round sẽ là người chiến thắng!</p>
        </div>
      </div>
    </div>
  </div>
</template>
