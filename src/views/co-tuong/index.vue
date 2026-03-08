<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { RouterLink } from 'vue-router'
import type { Board, GameMode, Move, PieceColor, Turn } from './types'
import { PIECE_CHAR, PIECE_VN, COL_NAMES, svgIcons } from './constants'
import { initBoard, getLegalMoves, isInCheck, isCheckmate } from './composables/useGameEngine'
import { useAI } from './composables/useAI'
import { useBoard } from './composables/useBoard'
import { useWebRTC } from './composables/useWebRTC'

// ═══════════════════════════════════════════════════════════════════════════
// GAME STATE
// ═══════════════════════════════════════════════════════════════════════════

const gameMode = ref<GameMode>('menu')
const board = ref<Board>(initBoard())
const turn = ref<Turn>('red')
const selectedPos = ref<[number, number] | null>(null)
const validMoves = ref<[number, number][]>([])
const moveHistory = ref<Move[]>([])
const check = ref(false)
const gameOver = ref(false)
const winner = ref<PieceColor | null>(null)
const myColor = ref<PieceColor>('red')
const isFlipped = ref(false)

// ═══════════════════════════════════════════════════════════════════════════
// COMPOSABLES
// ═══════════════════════════════════════════════════════════════════════════

const { canvasRef, drawBoard, canvasToBoard } = useBoard(board, selectedPos, validMoves, check, turn, isFlipped)
const { aiThinking, aiColor, triggerAiMove } = useAI(board, gameOver, turn, makeMove)
const rtc = useWebRTC({
  onRemoteMove: (from, to) => makeMove(from[0], from[1], to[0], to[1]),
  onRemoteResign: () => { gameOver.value = true; winner.value = myColor.value },
  onRemoteSync: (msg) => {
    board.value = msg.board; turn.value = msg.turn; moveHistory.value = msg.moveHistory
    check.value = isInCheck(board.value, turn.value)
    nextTick(drawBoard)
  },
  onEnterOnlineGame: () => enterOnlineGame(),
  onEnterSpectator: () => enterSpectator(),
  getGameState: () => ({ board: board.value, turn: turn.value, moveHistory: moveHistory.value }),
})

// ═══════════════════════════════════════════════════════════════════════════
// GAME LOGIC
// ═══════════════════════════════════════════════════════════════════════════

function resetGame() {
  board.value = initBoard()
  turn.value = 'red'; selectedPos.value = null; validMoves.value = []
  moveHistory.value = []; check.value = false; gameOver.value = false; winner.value = null
}

function handleCanvasClick(e: MouseEvent | TouchEvent) {
  if (gameOver.value || aiThinking.value) return
  if (gameMode.value === 'spectator') return
  if (gameMode.value === 'online-play' && turn.value !== myColor.value) return
  if (gameMode.value === 'ai' && turn.value === aiColor.value) return

  const ev = 'touches' in e ? e.touches[0]! : e
  const pos = canvasToBoard(ev.clientX, ev.clientY)
  if (!pos) return
  const [r, c] = pos

  if (selectedPos.value) {
    const [sr, sc] = selectedPos.value
    if (validMoves.value.some(([mr, mc]) => mr === r && mc === c)) {
      makeMove(sr, sc, r, c)
      if (gameMode.value === 'online-play') rtc.sendMove([sr, sc], [r, c])
      return
    }
    const p = board.value[r]?.[c]
    if (p && p.color === turn.value) { selectPiece(r, c); return }
    selectedPos.value = null; validMoves.value = []
    nextTick(drawBoard)
    return
  }

  const p = board.value[r]?.[c]
  if (p && p.color === turn.value) selectPiece(r, c)
}

function selectPiece(r: number, c: number) {
  selectedPos.value = [r, c]
  validMoves.value = getLegalMoves(board.value, r, c)
  nextTick(drawBoard)
}

function makeMove(fr: number, fc: number, tr: number, tc: number) {
  const piece = board.value[fr]?.[fc]
  if (!piece) return
  const captured = board.value[tr]?.[tc] ?? null
  board.value[tr]![tc] = piece
  board.value[fr]![fc] = null
  moveHistory.value.push({ from: [fr, fc], to: [tr, tc], piece, captured })

  selectedPos.value = null; validMoves.value = []
  turn.value = turn.value === 'red' ? 'black' : 'red'

  check.value = isInCheck(board.value, turn.value)
  if (isCheckmate(board.value, turn.value)) {
    gameOver.value = true
    winner.value = turn.value === 'red' ? 'black' : 'red'
  }
  nextTick(drawBoard)

  if (gameMode.value === 'ai' && turn.value === aiColor.value && !gameOver.value) {
    nextTick(triggerAiMove)
  }
}

function resign() {
  gameOver.value = true
  winner.value = turn.value === 'red' ? 'black' : 'red'
  if (gameMode.value === 'online-play') rtc.sendResign()
}

function enterOnlineGame() {
  rtc.connState.value = 'connected'
  gameMode.value = 'online-play'
  if (rtc.answerSdp.value) { myColor.value = 'black'; isFlipped.value = true }
  else { myColor.value = 'red'; isFlipped.value = false }
  resetGame()
  rtc.reattachStreams()
  nextTick(drawBoard)
  rtc.sendSync(board.value, turn.value, moveHistory.value)
}

function enterSpectator() {
  rtc.connState.value = 'connected'
  gameMode.value = 'spectator'
  isFlipped.value = false
}

function startLocal() { gameMode.value = 'local'; resetGame(); nextTick(drawBoard) }
function startAi() { gameMode.value = 'ai'; aiColor.value = 'black'; myColor.value = 'red'; isFlipped.value = false; resetGame(); nextTick(drawBoard) }
function startOnline() { gameMode.value = 'online-setup'; resetGame() }
function backToMenu() { rtc.disconnectRTC(); gameMode.value = 'menu'; resetGame() }
function flipBoard() { isFlipped.value = !isFlipped.value; nextTick(drawBoard) }

const lastMove = computed(() => {
  if (moveHistory.value.length === 0) return null
  const m = moveHistory.value[moveHistory.value.length - 1]!
  const ch = PIECE_CHAR[m.piece.type]![m.piece.color]
  const vn = PIECE_VN[m.piece.type]
  return `${ch} ${vn} (${COL_NAMES[m.from[1]]},${m.from[0]+1}) → (${COL_NAMES[m.to[1]]},${m.to[0]+1})${m.captured ? ' ✕' : ''}`
})

const turnLabel = computed(() => turn.value === 'red' ? 'Hồng tiên' : 'Hắc hậu')
const moveCount = computed(() => moveHistory.value.length)

onMounted(() => { window.addEventListener('resize', () => { if (gameMode.value !== 'menu') drawBoard() }) })
onUnmounted(() => { rtc.disconnectRTC() })

watch(board, () => { nextTick(drawBoard) }, { deep: true })
</script>

<template>
  <div class="co-tuong-root min-h-screen font-body relative overflow-hidden">
    <!-- Decorative corner ornaments -->
    <div class="corner-ornament top-0 left-0" />
    <div class="corner-ornament top-0 right-0 rotate-90" />
    <div class="corner-ornament bottom-0 right-0 rotate-180" />
    <div class="corner-ornament bottom-0 left-0 -rotate-90" />

    <div class="max-w-5xl mx-auto px-4 py-8 relative z-10">

      <!-- ═══════ MENU ═══════ -->
      <div v-if="gameMode === 'menu'" class="min-h-[80vh] flex flex-col items-center justify-center">
        <div class="text-center animate-fade-up">
          <svg class="w-16 h-16 mx-auto mb-4 ancient-gold" viewBox="0 0 24 24" fill="currentColor" v-html="svgIcons.chess" />
          <h1 class="font-display text-5xl sm:text-7xl font-bold ancient-gold mb-3 tracking-widest" style="font-variant: small-caps;">棋 Cờ Tướng</h1>
          <p class="ancient-silver text-base sm:text-lg mb-1">Kỳ Đài Luận Anh Hùng</p>
          <div class="ornament-line my-6" />
          <p class="ancient-dim text-xs font-display tracking-[0.3em] mb-10">XIANGQI · CANVAS · WEBRTC</p>
        </div>

        <div class="grid gap-5 sm:grid-cols-3 max-w-2xl w-full animate-fade-up animate-delay-1">
          <button class="ancient-card group" @click="startLocal">
            <svg class="w-8 h-8 mx-auto ancient-gold mb-3 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor" v-html="svgIcons.local" />
            <p class="font-display text-lg font-semibold mb-1 ancient-gold">Đối Ẩm Kỳ Cuộc</p>
            <p class="text-sm ancient-dim">Hai người, một bàn cờ</p>
          </button>
          <button class="ancient-card group" @click="startAi">
            <svg class="w-8 h-8 mx-auto ancient-gold mb-3 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor" v-html="svgIcons.robot" />
            <p class="font-display text-lg font-semibold mb-1 ancient-gold">Tập Dợt</p>
            <p class="text-sm ancient-dim">Đấu với máy · Trung bình</p>
          </button>
          <button class="ancient-card group" @click="startOnline">
            <svg class="w-8 h-8 mx-auto ancient-gold mb-3 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor" v-html="svgIcons.online" />
            <p class="font-display text-lg font-semibold mb-1 ancient-gold">Thiên Hạ Kỳ Thủ</p>
            <p class="text-sm ancient-dim">Giao đấu qua WebRTC</p>
          </button>
        </div>

        <div class="mt-10 animate-fade-up animate-delay-2">
          <RouterLink to="/" class="ancient-btn-ghost">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" v-html="svgIcons.home" />
            Hồi Cung
          </RouterLink>
        </div>
      </div>

      <!-- ═══════ ONLINE SETUP ═══════ -->
      <div v-if="gameMode === 'online-setup'" class="max-w-lg mx-auto py-8 animate-fade-up">
        <div class="flex items-center gap-3 mb-6">
          <button class="ancient-dim hover:text-[#C8A96E] transition text-sm" @click="backToMenu">&larr; Hồi</button>
          <div class="ornament-line flex-1" />
          <h2 class="font-display text-xl font-bold ancient-gold tracking-wider">Thiên Hạ Kỳ Thủ</h2>
        </div>

        <div v-if="rtc.connError.value" class="mb-4 ancient-alert-error">{{ rtc.connError.value }}</div>

        <!-- IDLE -->
        <div v-if="rtc.connState.value === 'idle'" class="space-y-4">
          <div class="grid gap-4 sm:grid-cols-2">
            <button class="ancient-card" @click="rtc.createRoom()">
              <svg class="w-6 h-6 mx-auto ancient-gold mb-2" viewBox="0 0 24 24" fill="currentColor" v-html="svgIcons.signal" />
              <p class="font-display font-semibold mb-1 ancient-gold">Lập Kỳ Đài</p>
              <p class="text-xs ancient-dim">Tạo mã thiệp mời đối thủ</p>
            </button>
            <div class="ancient-panel text-center">
              <svg class="w-5 h-5 mx-auto ancient-gold mb-2" viewBox="0 0 24 24" fill="currentColor" v-html="svgIcons.join" />
              <p class="font-display font-semibold ancient-gold mb-2">Nhập Cuộc</p>
              <textarea v-model="rtc.pastedOffer.value" placeholder="Dán thiệp mời tại đây..." class="ancient-textarea h-16" />
              <div class="flex gap-2 mt-2">
                <button class="flex-1 ancient-btn-accent" :disabled="!rtc.pastedOffer.value.trim()" @click="rtc.joinRoom()">Giao Đấu</button>
                <button class="flex-1 ancient-btn-ghost text-xs" :disabled="!rtc.pastedOffer.value.trim()" @click="rtc.joinAsSpectator()">
                  <svg class="w-3.5 h-3.5 inline mr-1" viewBox="0 0 24 24" fill="currentColor" v-html="svgIcons.eye" />
                  Khán Đài
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- CREATING OFFER -->
        <div v-if="rtc.connState.value === 'creating-offer'" class="space-y-4">
          <div v-if="rtc.iceProgress.value && !rtc.offerSdp.value" class="ancient-panel text-center">
            <div class="ice-spinner mx-auto mb-2" />
            <p class="ancient-gold text-sm font-display">{{ rtc.iceProgress.value }}</p>
          </div>
          <div class="ancient-panel">
            <p class="font-display text-sm font-semibold ancient-gold mb-2">Bước nhất · Sao chép thiệp mời</p>
            <textarea :value="rtc.offerSdp.value" readonly class="ancient-textarea h-20" />
            <button class="mt-2 w-full ancient-btn-primary" :disabled="!rtc.offerSdp.value" @click="rtc.safeCopy(rtc.offerSdp.value)">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" v-html="rtc.copied.value ? svgIcons.check : svgIcons.copy" />
              {{ rtc.copied.value ? 'Đã sao chép!' : 'Sao chép thiệp mời' }}
            </button>
          </div>
          <div class="ancient-panel">
            <p class="font-display text-sm font-semibold ancient-gold mb-2">Bước nhì · Dán hồi tín</p>
            <textarea v-model="rtc.pastedAnswer.value" placeholder="Dán hồi tín từ đối thủ..." class="ancient-textarea h-20" />
            <button class="mt-2 w-full ancient-btn-accent" :disabled="!rtc.pastedAnswer.value.trim()" @click="rtc.acceptAnswer()">Kết Nối</button>
          </div>
        </div>

        <!-- JOINING (Player) -->
        <div v-if="rtc.connState.value === 'joining'" class="space-y-4">
          <div class="ancient-panel">
            <p class="font-display text-sm font-semibold ancient-gold mb-2">Hồi tín · Gửi cho kỳ chủ</p>
            <textarea :value="rtc.answerSdp.value" readonly class="ancient-textarea h-20" />
            <button class="mt-2 w-full ancient-btn-primary" @click="rtc.safeCopy(rtc.answerSdp.value)">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" v-html="rtc.copied.value ? svgIcons.check : svgIcons.copy" />
              {{ rtc.copied.value ? 'Đã sao chép!' : 'Sao chép hồi tín' }}
            </button>
          </div>
          <p class="ancient-dim text-xs text-center">Kỳ chủ dán hồi tín → kết nối tự động</p>
        </div>

        <!-- SPECTATOR-JOINING -->
        <div v-if="rtc.connState.value === 'spectator-joining'" class="space-y-4">
          <div class="ancient-panel">
            <p class="font-display text-sm font-semibold ancient-gold mb-2">
              <svg class="w-4 h-4 inline mr-1" viewBox="0 0 24 24" fill="currentColor" v-html="svgIcons.eye" />
              Khán Đài · Hồi tín
            </p>
            <textarea :value="rtc.answerSdp.value" readonly class="ancient-textarea h-20" />
            <button class="mt-2 w-full ancient-btn-primary" @click="rtc.safeCopy(rtc.answerSdp.value)">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" v-html="rtc.copied.value ? svgIcons.check : svgIcons.copy" />
              {{ rtc.copied.value ? 'Đã sao chép!' : 'Sao chép hồi tín khán đài' }}
            </button>
          </div>
          <p class="ancient-dim text-xs text-center">Gửi hồi tín cho kỳ chủ → chờ kết nối tự động</p>
        </div>

        <!-- CONNECTED -->
        <div v-if="rtc.connState.value === 'connected' && gameMode === 'online-setup'">
          <div class="ancient-panel text-center border-[#4A7A3A]/60">
            <svg class="w-8 h-8 text-[#4A7A3A] mx-auto mb-2" viewBox="0 0 24 24" fill="currentColor" v-html="svgIcons.check" />
            <p class="text-[#7ABA6A] font-display font-semibold mb-3">Kết nối thành công!</p>
            <button class="ancient-btn-enter" @click="enterOnlineGame">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" v-html="svgIcons.play" />
              KHAI CUỘC
            </button>
          </div>
        </div>
      </div>

      <!-- ═══════ GAME BOARD ═══════ -->
      <div v-if="gameMode === 'local' || gameMode === 'ai' || gameMode === 'online-play' || gameMode === 'spectator'" class="animate-fade-up">
        <!-- Top bar -->
        <div class="flex items-center justify-between mb-4">
          <button class="ancient-dim hover:text-[#C8A96E] transition text-sm flex items-center gap-1" @click="backToMenu">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" v-html="svgIcons.home" /> Hồi
          </button>
          <div class="flex items-center gap-3">
            <span class="font-display text-sm font-semibold tracking-wider" :class="turn === 'red' ? 'text-[#C84B31]' : 'ancient-silver'">{{ turnLabel }}</span>
            <span v-if="check && !gameOver" class="text-xs ancient-alert-badge">將 CHIẾU</span>
            <span v-if="aiThinking" class="text-xs ancient-thinking-badge"><span class="ice-spinner inline-block w-3 h-3 align-middle mr-1" /> Suy nghĩ...</span>
            <span v-if="rtc.spectatorCount.value > 0" class="text-xs px-1.5 py-0.5 font-display tracking-wider" style="background:#1A120C;border:1px solid #C8A96E44;color:#C8A96E">
              <svg class="w-3 h-3 inline mr-0.5" viewBox="0 0 24 24" fill="currentColor" v-html="svgIcons.eye" /> {{ rtc.spectatorCount.value }}
            </span>
          </div>
          <span class="ancient-dim text-xs font-display tracking-wider">第 {{ moveCount }} 手</span>
        </div>

        <div class="flex flex-col lg:flex-row gap-4 items-start">
          <!-- Webcam panels (online with camera) -->
          <div v-if="gameMode === 'online-play' && rtc.hasCamera.value" class="w-full lg:w-48 flex lg:flex-col gap-2">
            <div class="flex-1 ancient-panel overflow-hidden relative p-0">
              <video :ref="(el: any) => { rtc.remoteVideoRef.value = el }" autoplay playsinline muted class="w-full aspect-video object-cover" style="transform: scaleX(-1)" />
              <span class="absolute bottom-1 left-1 text-xs px-1.5 py-0.5 font-display" :class="myColor === 'red' ? 'ancient-silver' : 'text-[#C84B31]'" style="background: rgba(15,10,5,0.8)">{{ myColor === 'red' ? '黑 Đối thủ' : '紅 Đối thủ' }}</span>
              <span v-if="rtc.remoteMuted.value" class="absolute top-1 right-1 p-1 rounded" style="background: rgba(15,10,5,0.8)">
                <svg class="w-3.5 h-3.5 text-red-400" viewBox="0 0 24 24" fill="currentColor" v-html="svgIcons.micOff" />
              </span>
              <span v-if="rtc.remoteCameraOff.value" class="absolute top-1 right-7 p-1 rounded" style="background: rgba(15,10,5,0.8)">
                <svg class="w-3.5 h-3.5 text-red-400" viewBox="0 0 24 24" fill="currentColor" v-html="svgIcons.camOff" />
              </span>
            </div>
            <div class="flex-1 ancient-panel overflow-hidden relative p-0">
              <video :ref="(el: any) => { rtc.localVideoRef.value = el }" autoplay playsinline muted class="w-full aspect-video object-cover" style="transform: scaleX(-1)" />
              <span class="absolute bottom-1 left-1 text-xs px-1.5 py-0.5 font-display" :class="myColor === 'red' ? 'text-[#C84B31]' : 'ancient-silver'" style="background: rgba(15,10,5,0.8)">{{ myColor === 'red' ? '紅 Bạn' : '黑 Bạn' }}</span>
              <span v-if="rtc.isMuted.value" class="absolute top-1 right-1 p-1 rounded" style="background: rgba(15,10,5,0.8)">
                <svg class="w-3.5 h-3.5 text-yellow-400" viewBox="0 0 24 24" fill="currentColor" v-html="svgIcons.micOff" />
              </span>
              <span v-if="rtc.isCameraOff.value" class="absolute top-1 right-7 p-1 rounded" style="background: rgba(15,10,5,0.8)">
                <svg class="w-3.5 h-3.5 text-yellow-400" viewBox="0 0 24 24" fill="currentColor" v-html="svgIcons.camOff" />
              </span>
            </div>
            <div class="flex lg:flex-col gap-1">
              <button class="flex-1 ancient-btn-sm" @click="rtc.toggleMute()">
                <svg class="w-4 h-4 mx-auto" viewBox="0 0 24 24" fill="currentColor" v-html="rtc.isMuted.value ? svgIcons.micOff : svgIcons.mic" />
              </button>
              <button class="flex-1 ancient-btn-sm" @click="rtc.toggleCamera()">
                <svg class="w-4 h-4 mx-auto" viewBox="0 0 24 24" fill="currentColor" v-html="rtc.isCameraOff.value ? svgIcons.camOff : svgIcons.cam" />
              </button>
            </div>
          </div>

          <!-- No camera banner -->
          <div v-if="gameMode === 'online-play' && !rtc.hasCamera.value" class="w-full lg:w-48">
            <div class="ancient-panel text-center py-4">
              <svg class="w-6 h-6 mx-auto ancient-dim mb-2" viewBox="0 0 24 24" fill="currentColor" v-html="svgIcons.camOff" />
              <p class="text-xs ancient-dim">Chơi không camera</p>
            </div>
          </div>

          <!-- Spectator badge -->
          <div v-if="gameMode === 'spectator'" class="w-full lg:w-48">
            <div class="ancient-panel text-center py-4">
              <svg class="w-8 h-8 mx-auto ancient-gold mb-2" viewBox="0 0 24 24" fill="currentColor" v-html="svgIcons.eye" />
              <p class="text-sm ancient-gold font-display">觀 Khán Đài</p>
              <p class="text-xs ancient-dim mt-1">Chỉ xem, không tham chiến</p>
            </div>
          </div>

          <!-- Board -->
          <div class="flex-shrink-0 board-frame">
            <canvas ref="canvasRef" class="block cursor-pointer" @click="handleCanvasClick" @touchstart.prevent="handleCanvasClick" />
          </div>

          <!-- Side panel -->
          <div class="flex-1 min-w-0 lg:max-w-[260px] space-y-3">
            <!-- Controls -->
            <div class="flex flex-wrap gap-2">
              <button class="ancient-btn-sm" @click="flipBoard">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" v-html="svgIcons.flip" />
                <span class="text-xs">Lật</span>
              </button>
              <button v-if="!gameOver" class="ancient-btn-sm text-[#C84B31]" @click="resign">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" v-html="svgIcons.flag" />
                <span class="text-xs">Đầu hàng</span>
              </button>
              <button v-if="gameOver" class="ancient-btn-sm text-[#C8A96E]" @click="resetGame(); nextTick(drawBoard)">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" v-html="svgIcons.refresh" />
                <span class="text-xs">Ván mới</span>
              </button>
            </div>

            <!-- Host: Spectator panel -->
            <div v-if="gameMode === 'online-play' && rtc.isHosting.value" class="ancient-panel">
              <p class="ancient-dim text-xs font-display mb-2 tracking-wider">
                <svg class="w-3.5 h-3.5 inline mr-1" viewBox="0 0 24 24" fill="currentColor" v-html="svgIcons.eye" />
                觀 KHÁN ĐÀI
              </p>
              <div v-if="!rtc.spectatorOfferSdp.value && !rtc.spectatorIceProgress.value">
                <button class="w-full ancient-btn-primary text-xs" @click="rtc.createSpectatorOffer()">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" v-html="svgIcons.signal" />
                  Tạo mã khán đài
                </button>
              </div>
              <div v-if="rtc.spectatorIceProgress.value" class="text-center py-2">
                <div class="ice-spinner mx-auto mb-1" style="width:16px;height:16px" />
                <p class="text-xs ancient-gold">{{ rtc.spectatorIceProgress.value }}</p>
              </div>
              <div v-if="rtc.spectatorOfferSdp.value">
                <p class="text-xs ancient-silver mb-1">Gửi mã này cho khán giả:</p>
                <textarea :value="rtc.spectatorOfferSdp.value" readonly class="ancient-textarea h-14 text-[10px]" />
                <button class="mt-1 w-full ancient-btn-sm text-xs" @click="rtc.safeCopy(rtc.spectatorOfferSdp.value)">
                  <svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor" v-html="rtc.copied.value ? svgIcons.check : svgIcons.copy" />
                  {{ rtc.copied.value ? 'Đã sao chép!' : 'Sao chép' }}
                </button>
                <p class="text-xs ancient-silver mt-2 mb-1">Dán hồi tín từ khán giả:</p>
                <textarea v-model="rtc.spectatorPastedAnswer.value" placeholder="Dán mã trả lời..." class="ancient-textarea h-14 text-[10px]" />
                <button class="mt-1 w-full ancient-btn-accent text-xs" :disabled="!rtc.spectatorPastedAnswer.value.trim()" @click="rtc.acceptSpectatorAnswer()">
                  Kết nối khán giả
                </button>
              </div>
            </div>

            <!-- Game Over -->
            <div v-if="gameOver" class="ancient-panel text-center" :class="winner === 'red' ? 'border-[#C84B31]/50' : 'border-[#8B7355]/50'">
              <p class="font-display text-xl font-bold tracking-wider" :class="winner === 'red' ? 'text-[#C84B31]' : 'ancient-silver'">
                {{ winner === 'red' ? '紅 方 勝' : '黑 方 勝' }}
              </p>
              <p class="ancient-dim text-xs mt-1">{{ check ? '將死 — Chiếu bí!' : '投降 — Đầu hàng' }}</p>
            </div>

            <!-- Last move -->
            <div v-if="lastMove" class="ancient-panel">
              <p class="ancient-dim text-xs font-display mb-1 tracking-wider">末手 NƯỚC CUỐI</p>
              <p class="text-sm ancient-silver">{{ lastMove }}</p>
            </div>

            <!-- Move history scroll -->
            <div class="ancient-panel max-h-48 overflow-y-auto ancient-scrollbar">
              <p class="ancient-dim text-xs font-display mb-1 tracking-wider">棋譜 KỲ PHỔ ({{ moveCount }})</p>
              <div v-if="moveHistory.length === 0" class="ancient-dim text-xs italic">Kỳ cuộc chưa khai</div>
              <div v-for="(m, i) in moveHistory" :key="i" class="text-xs py-0.5 border-b border-[#2A1F14]" :class="m.piece.color === 'red' ? 'text-[#C84B31]' : 'ancient-silver'">
                {{ i + 1 }}. {{ PIECE_CHAR[m.piece.type]![m.piece.color] }} {{ PIECE_VN[m.piece.type] }}
                ({{ COL_NAMES[m.from[1]] }},{{ m.from[0]+1 }}) → ({{ COL_NAMES[m.to[1]] }},{{ m.to[0]+1 }})
                <span v-if="m.captured" class="text-[#C8A96E]">斬 {{ PIECE_CHAR[m.captured.type]![m.captured.color] }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="mt-8 text-center">
          <div class="ornament-line mb-3" />
          <p class="ancient-dim text-xs font-display tracking-[0.25em]">棋 CỜ TƯỚNG · XIANGQI × WEBRTC × CANVAS · 開發 HWG</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import './styles.css';
</style>
