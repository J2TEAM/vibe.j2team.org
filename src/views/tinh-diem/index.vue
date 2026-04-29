<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { Icon } from '@iconify/vue'

// ─── Types ─────────────────────────────────────────────────────────────────
interface Player {
  id: string
  name: string
  colorIndex: number
  score: number
}

interface RoundRecord {
  id: string
  number: number
  timestamp: number
  deltas: Record<string, number>
  nameSnapshot: Record<string, string>
}

interface GameSession {
  players: Player[]
  rounds: RoundRecord[]
  currentRoundDeltas: Record<string, number>
  roundNumber: number
  targetScore: number | null
  zeroSum: boolean
  startedAt: number
}

interface UndoEntry {
  changes: Array<{ playerId: string; delta: number }>
}

// ─── Constants ─────────────────────────────────────────────────────────────
const PLAYER_COLORS = [
  { border: 'border-l-accent-coral', text: 'text-accent-coral', muted: 'text-accent-coral/50' },
  { border: 'border-l-accent-amber', text: 'text-accent-amber', muted: 'text-accent-amber/50' },
  { border: 'border-l-accent-sky', text: 'text-accent-sky', muted: 'text-accent-sky/50' },
  { border: 'border-l-rose-400', text: 'text-rose-400', muted: 'text-rose-400/50' },
  { border: 'border-l-teal-400', text: 'text-teal-400', muted: 'text-teal-400/50' },
  { border: 'border-l-orange-400', text: 'text-orange-400', muted: 'text-orange-400/50' },
  { border: 'border-l-lime-400', text: 'text-lime-400', muted: 'text-lime-400/50' },
  { border: 'border-l-pink-400', text: 'text-pink-400', muted: 'text-pink-400/50' },
]

const QUICK_AMOUNTS = [-10, -1, 1, 10]

// ─── State ─────────────────────────────────────────────────────────────────
function makeDefaultSession(): GameSession {
  return {
    players: [],
    rounds: [],
    currentRoundDeltas: {},
    roundNumber: 1,
    targetScore: null,
    zeroSum: false,
    startedAt: Date.now(),
  }
}

const session = useLocalStorage<GameSession>('tinh-diem-session', makeDefaultSession())
const undoStack = ref<UndoEntry[]>([])
const activeTab = ref<'players' | 'history'>('players')
const sortByRank = ref(false)

// Add player
const showAddPlayer = ref(false)
const newPlayerName = ref('')
const addPlayerInputEl = ref<HTMLInputElement | null>(null)

// Custom score input
const customScorePlayerId = ref<string | null>(null)
const customScoreValue = ref('')

// Inline name edit
const editingNameId = ref<string | null>(null)
const editingNameValue = ref('')

// Remove confirm (inline)
const pendingRemoveId = ref<string | null>(null)

// Overlays
const showResetConfirm = ref(false)
const showSettings = ref(false)
const targetScoreInput = ref('')
const zeroSumInput = ref(false)

// ─── Computed ──────────────────────────────────────────────────────────────
const displayedPlayers = computed(() => {
  const withRanks = session.value.players.map((p) => {
    const rank = session.value.players.filter((o) => o.score > p.score).length + 1
    return { ...p, rank }
  })
  if (!sortByRank.value) return withRanks
  return [...withRanks].sort((a, b) => a.rank - b.rank)
})

const hasCurrentRoundActivity = computed(() =>
  Object.values(session.value.currentRoundDeltas).some((v) => v !== 0),
)

const winners = computed(() => {
  if (!session.value.targetScore) return []
  return session.value.players.filter((p) => p.score >= (session.value.targetScore ?? 0))
})

// ─── Helpers ───────────────────────────────────────────────────────────────
function getColor(colorIndex: number) {
  return PLAYER_COLORS[colorIndex % PLAYER_COLORS.length]!
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 5)
}

function getCurrentDelta(playerId: string) {
  return session.value.currentRoundDeltas[playerId] ?? 0
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
}

// ─── Player Actions ────────────────────────────────────────────────────────
async function openAddPlayer() {
  showAddPlayer.value = true
  await nextTick()
  addPlayerInputEl.value?.focus()
}

function confirmAddPlayer() {
  const name = newPlayerName.value.trim()
  if (!name) return
  const player: Player = {
    id: generateId(),
    name,
    colorIndex: session.value.players.length,
    score: 0,
  }
  session.value.players.push(player)
  session.value.currentRoundDeltas[player.id] = 0
  newPlayerName.value = ''
  showAddPlayer.value = false
}

function cancelAddPlayer() {
  newPlayerName.value = ''
  showAddPlayer.value = false
}

function handleAddPlayerKey(e: KeyboardEvent) {
  if (e.key === 'Escape') cancelAddPlayer()
}

function requestRemove(playerId: string) {
  pendingRemoveId.value = playerId
}

function confirmRemove() {
  const id = pendingRemoveId.value
  if (!id) return
  session.value.players = session.value.players.filter((p) => p.id !== id)
  delete session.value.currentRoundDeltas[id]
  undoStack.value = undoStack.value.filter((u) => !u.changes.some((c) => c.playerId === id))
  pendingRemoveId.value = null
}

function cancelRemove() {
  pendingRemoveId.value = null
}

// ─── Score Actions ─────────────────────────────────────────────────────────
function changeScore(playerId: string, delta: number) {
  const player = session.value.players.find((p) => p.id === playerId)
  if (!player) return

  player.score += delta
  session.value.currentRoundDeltas[playerId] = getCurrentDelta(playerId) + delta

  const changes: Array<{ playerId: string; delta: number }> = [{ playerId, delta }]

  if (session.value.zeroSum && session.value.players.length > 1) {
    const others = session.value.players.filter((p) => p.id !== playerId)
    const counter = -delta
    let distributed = 0
    for (let i = 0; i < others.length; i++) {
      const p = others[i]!
      const share =
        i === others.length - 1 ? counter - distributed : Math.trunc(counter / others.length)
      if (share !== 0) {
        p.score += share
        session.value.currentRoundDeltas[p.id] = getCurrentDelta(p.id) + share
        changes.push({ playerId: p.id, delta: share })
      }
      distributed += share
    }
  }

  undoStack.value.push({ changes })
}

async function openCustomScore(playerId: string) {
  customScorePlayerId.value = playerId
  customScoreValue.value = ''
  await nextTick()
  document.querySelector<HTMLInputElement>(`#custom-score-${playerId}`)?.focus()
}

function applyCustomPositive() {
  const id = customScorePlayerId.value
  if (!id) return
  const val = parseInt(customScoreValue.value)
  if (!isNaN(val) && val !== 0) changeScore(id, Math.abs(val))
  customScorePlayerId.value = null
}

function applyCustomNegative() {
  const id = customScorePlayerId.value
  if (!id) return
  const val = parseInt(customScoreValue.value)
  if (!isNaN(val) && val !== 0) changeScore(id, -Math.abs(val))
  customScorePlayerId.value = null
}

function cancelCustomScore() {
  customScorePlayerId.value = null
  customScoreValue.value = ''
}

function handleCustomScoreKey(e: KeyboardEvent) {
  if (e.key === 'Enter') applyCustomPositive()
  if (e.key === 'Escape') cancelCustomScore()
}

function undoLast() {
  const entry = undoStack.value.pop()
  if (!entry) return
  for (const { playerId, delta } of entry.changes) {
    const p = session.value.players.find((x) => x.id === playerId)
    if (!p) continue
    p.score -= delta
    session.value.currentRoundDeltas[playerId] = getCurrentDelta(playerId) - delta
  }
}

// ─── Name Edit ─────────────────────────────────────────────────────────────
async function startEditName(player: Player) {
  editingNameId.value = player.id
  editingNameValue.value = player.name
  await nextTick()
  const el = document.querySelector<HTMLInputElement>(`#edit-name-${player.id}`)
  el?.focus()
  el?.select()
}

function saveEditName(playerId: string) {
  const name = editingNameValue.value.trim()
  if (name) {
    const p = session.value.players.find((x) => x.id === playerId)
    if (p) p.name = name
  }
  editingNameId.value = null
}

function handleEditNameKey(e: KeyboardEvent, playerId: string) {
  if (e.key === 'Enter') saveEditName(playerId)
  if (e.key === 'Escape') {
    editingNameId.value = null
  }
}

// ─── Round Actions ─────────────────────────────────────────────────────────
function endRound() {
  const snapshot: Record<string, string> = {}
  for (const p of session.value.players) snapshot[p.id] = p.name

  session.value.rounds.push({
    id: generateId(),
    number: session.value.roundNumber,
    timestamp: Date.now(),
    deltas: { ...session.value.currentRoundDeltas },
    nameSnapshot: snapshot,
  })

  session.value.roundNumber++
  for (const id of Object.keys(session.value.currentRoundDeltas)) {
    session.value.currentRoundDeltas[id] = 0
  }
  undoStack.value = []
}

// ─── Settings / Reset ──────────────────────────────────────────────────────
function openSettings() {
  targetScoreInput.value = session.value.targetScore?.toString() ?? ''
  zeroSumInput.value = session.value.zeroSum
  showSettings.value = true
}

function saveSettings() {
  const val = parseInt(targetScoreInput.value)
  session.value.targetScore = !isNaN(val) && val > 0 ? val : null
  session.value.zeroSum = zeroSumInput.value
  showSettings.value = false
}

function resetGame() {
  session.value = makeDefaultSession()
  undoStack.value = []
  showResetConfirm.value = false
  activeTab.value = 'players'
}
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body">
    <!-- ── Header ──────────────────────────────────────────── -->
    <header class="sticky top-0 z-20 border-b border-border-default bg-bg-deep/95 backdrop-blur-sm">
      <div class="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <div>
          <h1 class="flex items-center gap-2 font-display text-xl font-bold text-text-primary">
            <span class="text-sm text-accent-coral tracking-widest">//</span>
            BẢNG TÍNH ĐIỂM
          </h1>
        </div>

        <div class="flex items-center gap-2">
          <!-- Home -->
          <RouterLink
            to="/"
            class="flex items-center gap-1.5 border border-border-default bg-bg-surface px-3 py-1.5 font-display text-xs tracking-wide text-text-secondary transition hover:border-accent-coral hover:text-accent-coral"
          >
            <Icon icon="lucide:house" class="size-4" />
            <span class="hidden sm:inline">Trang chủ</span>
          </RouterLink>

          <!-- Undo -->
          <button
            :disabled="undoStack.length === 0"
            class="flex items-center gap-1.5 border border-border-default bg-bg-surface px-3 py-1.5 text-xs text-text-secondary transition hover:border-accent-amber hover:text-accent-amber disabled:cursor-not-allowed disabled:opacity-30"
            title="Hoàn tác"
            @click="undoLast"
          >
            <Icon icon="lucide:undo-2" class="size-4" />
            <span class="hidden sm:inline">Hoàn tác</span>
          </button>

          <!-- Settings -->
          <button
            class="flex items-center gap-1.5 border border-border-default bg-bg-surface px-3 py-1.5 text-xs text-text-secondary transition hover:border-accent-sky hover:text-accent-sky"
            title="Cài đặt"
            @click="openSettings"
          >
            <Icon icon="lucide:settings-2" class="size-4" />
          </button>

          <!-- Reset -->
          <button
            class="flex items-center gap-1.5 border border-border-default bg-bg-surface px-3 py-1.5 text-xs text-text-secondary transition hover:border-rose-400 hover:text-rose-400"
            title="Chơi lại từ đầu"
            @click="showResetConfirm = true"
          >
            <Icon icon="lucide:rotate-ccw" class="size-4" />
          </button>
        </div>
      </div>
    </header>

    <!-- ── Round info bar ──────────────────────────────────── -->
    <div class="border-b border-border-default bg-bg-surface/50">
      <div class="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-1 px-6 py-2">
        <span class="font-display text-xs tracking-widest text-text-dim">
          VÁN
          <span class="ml-1 font-bold text-accent-coral">{{ session.roundNumber }}</span>
        </span>
        <span v-if="session.targetScore" class="font-display text-xs tracking-widest text-text-dim">
          MỤC TIÊU
          <span class="ml-1 font-bold text-accent-amber">{{
            session.targetScore.toLocaleString()
          }}</span>
        </span>
        <span v-if="session.rounds.length > 0" class="text-xs text-text-dim">
          {{ session.rounds.length }} ván đã xong
        </span>
        <span
          v-if="session.zeroSum"
          class="flex items-center gap-1 font-display text-xs tracking-widest text-teal-400"
        >
          <Icon icon="lucide:scale" class="size-3" />
          CÂN BẰNG ĐIỂM
        </span>
      </div>
    </div>

    <!-- ── Winner banner ──────────────────────────────────── -->
    <div
      v-if="winners.length > 0"
      class="border-b border-accent-amber/50 bg-accent-amber/10 px-6 py-3"
    >
      <div class="mx-auto max-w-5xl flex items-center gap-3">
        <Icon icon="lucide:trophy" class="size-5 text-accent-amber" />
        <span class="font-display text-sm font-semibold text-accent-amber">
          🏆 Người thắng:
          <span v-for="(w, i) in winners" :key="w.id">
            {{ w.name }}{{ i < winners.length - 1 ? ', ' : '' }}
          </span>
        </span>
      </div>
    </div>

    <!-- ── Tabs ────────────────────────────────────────────── -->
    <div class="border-b border-border-default bg-bg-surface/30">
      <div class="mx-auto flex max-w-5xl px-6">
        <button
          class="border-b-2 px-4 py-3 font-display text-sm tracking-wide transition"
          :class="
            activeTab === 'players'
              ? 'border-accent-coral text-accent-coral'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          "
          @click="activeTab = 'players'"
        >
          <Icon icon="lucide:users" class="mr-1.5 inline size-4" />
          Người chơi ({{ session.players.length }})
        </button>
        <button
          class="border-b-2 px-4 py-3 font-display text-sm tracking-wide transition"
          :class="
            activeTab === 'history'
              ? 'border-accent-coral text-accent-coral'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          "
          @click="activeTab = 'history'"
        >
          <Icon icon="lucide:history" class="mr-1.5 inline size-4" />
          Lịch sử ({{ session.rounds.length }})
        </button>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════ -->
    <!--  TAB: PLAYERS                                         -->
    <!-- ══════════════════════════════════════════════════════ -->
    <div v-if="activeTab === 'players'" class="mx-auto max-w-5xl px-6 py-8">
      <!-- Empty state -->
      <div
        v-if="session.players.length === 0"
        class="flex flex-col items-center justify-center py-24 text-center"
      >
        <Icon icon="lucide:users" class="mb-4 size-16 text-text-dim" />
        <p class="font-display text-lg text-text-secondary">Chưa có người chơi</p>
        <p class="mb-6 mt-2 text-sm text-text-dim">Thêm người chơi để bắt đầu</p>
        <button
          class="flex items-center gap-2 border border-border-default bg-bg-surface px-6 py-3 font-display text-sm tracking-wide text-text-secondary transition hover:border-accent-coral hover:text-accent-coral"
          @click="openAddPlayer"
        >
          <Icon icon="lucide:plus" class="size-4" />
          THÊM NGƯỜI CHƠI
        </button>
      </div>

      <template v-else>
        <!-- Sort toggle -->
        <div class="mb-4 flex items-center justify-between">
          <p class="text-xs text-text-dim">
            Nhấn vào tên để đổi tên · Nhấn
            <kbd class="rounded bg-bg-elevated px-1 py-0.5 font-display text-[10px]">±</kbd>
            để nhập điểm tuỳ chỉnh
          </p>
          <button
            class="flex items-center gap-1.5 text-xs text-text-secondary transition hover:text-text-primary"
            @click="sortByRank = !sortByRank"
          >
            <Icon :icon="sortByRank ? 'lucide:list-ordered' : 'lucide:shuffle'" class="size-3.5" />
            {{ sortByRank ? 'Theo xếp hạng' : 'Theo thứ tự thêm' }}
          </button>
        </div>

        <!-- Players grid -->
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="player in displayedPlayers"
            :key="player.id"
            class="relative border border-border-default border-l-4 bg-bg-surface transition-all duration-200 hover:bg-bg-elevated"
            :class="getColor(player.colorIndex).border"
          >
            <!-- Remove confirm overlay -->
            <div
              v-if="pendingRemoveId === player.id"
              class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-bg-elevated/95"
            >
              <Icon icon="lucide:trash-2" class="size-8 text-rose-400" />
              <p class="font-display text-sm text-text-secondary">Xoá {{ player.name }}?</p>
              <div class="flex gap-2">
                <button
                  class="border border-rose-400/50 bg-rose-400/10 px-4 py-1.5 text-xs text-rose-400 transition hover:bg-rose-400/20"
                  @click="confirmRemove"
                >
                  Xoá
                </button>
                <button
                  class="border border-border-default px-4 py-1.5 text-xs text-text-secondary transition hover:border-text-secondary"
                  @click="cancelRemove"
                >
                  Huỷ
                </button>
              </div>
            </div>

            <div class="p-4">
              <!-- Card header: rank + name + remove -->
              <div class="mb-3 flex items-start justify-between">
                <div class="flex min-w-0 flex-1 items-center gap-2">
                  <span
                    class="shrink-0 font-display text-xs tracking-widest"
                    :class="player.rank === 1 ? getColor(player.colorIndex).text : 'text-text-dim'"
                  >
                    #{{ player.rank }}
                  </span>
                  <!-- Editable name -->
                  <input
                    v-if="editingNameId === player.id"
                    :id="`edit-name-${player.id}`"
                    v-model="editingNameValue"
                    class="min-w-0 flex-1 border-b border-accent-coral bg-transparent font-display text-sm font-semibold text-text-primary outline-none"
                    @blur="saveEditName(player.id)"
                    @keydown="handleEditNameKey($event, player.id)"
                  />
                  <button
                    v-else
                    class="min-w-0 flex-1 truncate text-left font-display text-sm font-semibold text-text-primary transition hover:text-accent-coral"
                    :title="`${player.name} — nhấn để đổi tên`"
                    @click="startEditName(player)"
                  >
                    {{ player.name }}
                  </button>
                </div>
                <button
                  class="ml-2 shrink-0 text-text-dim transition hover:text-rose-400"
                  title="Xoá người chơi"
                  @click="requestRemove(player.id)"
                >
                  <Icon icon="lucide:x" class="size-4" />
                </button>
              </div>

              <!-- Score display -->
              <div class="my-4 text-center">
                <div
                  class="font-display text-5xl font-bold leading-none"
                  :class="getColor(player.colorIndex).text"
                >
                  {{ player.score.toLocaleString('vi-VN') }}
                </div>
                <div class="mt-1 font-display text-xs tracking-widest text-text-dim">ĐIỂM</div>

                <!-- Target progress bar -->
                <div v-if="session.targetScore" class="mt-3">
                  <div class="mb-1 flex justify-between text-[10px] text-text-dim">
                    <span>{{ Math.min(player.score, session.targetScore).toLocaleString() }}</span>
                    <span>{{ session.targetScore.toLocaleString() }}</span>
                  </div>
                  <div class="h-1 w-full bg-bg-elevated">
                    <div
                      class="h-1 transition-all duration-500"
                      :class="getColor(player.colorIndex).border.replace('border-l-', 'bg-')"
                      :style="`width: ${Math.min(100, Math.max(0, (player.score / session.targetScore) * 100))}%`"
                    />
                  </div>
                </div>

                <!-- Current round delta -->
                <div class="mt-2 h-5">
                  <span
                    v-if="getCurrentDelta(player.id) !== 0"
                    class="font-display text-xs"
                    :class="getCurrentDelta(player.id) > 0 ? 'text-teal-400' : 'text-rose-400'"
                  >
                    Ván này: {{ getCurrentDelta(player.id) > 0 ? '+' : ''
                    }}{{ getCurrentDelta(player.id).toLocaleString('vi-VN') }}
                  </span>
                </div>
              </div>

              <!-- Quick score buttons -->
              <div class="grid grid-cols-4 gap-1">
                <button
                  v-for="amount in QUICK_AMOUNTS"
                  :key="amount"
                  class="border border-border-default py-2 font-display text-xs font-semibold transition"
                  :class="
                    amount > 0
                      ? 'text-teal-400 hover:border-teal-400 hover:bg-teal-400/10'
                      : 'text-rose-400 hover:border-rose-400 hover:bg-rose-400/10'
                  "
                  @click="changeScore(player.id, amount)"
                >
                  {{ amount > 0 ? `+${amount}` : amount }}
                </button>
              </div>

              <!-- Custom score input -->
              <div class="mt-2">
                <div v-if="customScorePlayerId === player.id" class="flex gap-1">
                  <input
                    :id="`custom-score-${player.id}`"
                    v-model="customScoreValue"
                    type="number"
                    min="0"
                    placeholder="Nhập điểm..."
                    class="min-w-0 flex-1 border border-border-default bg-bg-deep px-2 py-1.5 text-center font-display text-sm text-text-primary outline-none focus:border-accent-coral [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    @keydown="handleCustomScoreKey"
                  />
                  <button
                    class="border border-teal-400/50 bg-teal-400/10 px-2 py-1.5 font-display text-xs font-bold text-teal-400 transition hover:bg-teal-400/20"
                    title="Cộng điểm"
                    @click="applyCustomPositive"
                  >
                    +
                  </button>
                  <button
                    class="border border-rose-400/50 bg-rose-400/10 px-2 py-1.5 font-display text-xs font-bold text-rose-400 transition hover:bg-rose-400/20"
                    title="Trừ điểm"
                    @click="applyCustomNegative"
                  >
                    −
                  </button>
                  <button
                    class="border border-border-default px-2 py-1.5 text-xs text-text-dim transition hover:text-text-secondary"
                    @click="cancelCustomScore"
                  >
                    <Icon icon="lucide:x" class="size-3" />
                  </button>
                </div>
                <button
                  v-else
                  class="w-full border border-border-default py-1.5 font-display text-xs tracking-wide text-text-dim transition hover:border-accent-amber hover:text-accent-amber"
                  @click="openCustomScore(player.id)"
                >
                  ± Nhập điểm tuỳ chỉnh
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Bottom actions -->
        <div class="mt-4 flex gap-3">
          <button
            class="flex flex-1 items-center justify-center gap-2 border border-dashed border-border-default py-3 font-display text-sm tracking-wide text-text-dim transition hover:border-accent-coral hover:text-accent-coral"
            @click="openAddPlayer"
          >
            <Icon icon="lucide:plus" class="size-4" />
            THÊM NGƯỜI CHƠI
          </button>
          <button
            :disabled="!hasCurrentRoundActivity"
            class="flex items-center gap-2 border border-border-default bg-bg-surface px-6 py-3 font-display text-sm tracking-wide text-text-secondary transition hover:border-accent-coral hover:bg-bg-elevated hover:text-accent-coral disabled:cursor-not-allowed disabled:opacity-30"
            @click="endRound"
          >
            <Icon icon="lucide:chevrons-right" class="size-4" />
            VÁN TIẾP THEO
          </button>
        </div>
      </template>
    </div>

    <!-- ══════════════════════════════════════════════════════ -->
    <!--  TAB: HISTORY                                         -->
    <!-- ══════════════════════════════════════════════════════ -->
    <div v-else class="mx-auto max-w-5xl px-6 py-8">
      <!-- Empty -->
      <div
        v-if="session.rounds.length === 0"
        class="flex flex-col items-center justify-center py-24 text-center"
      >
        <Icon icon="lucide:scroll" class="mb-4 size-16 text-text-dim" />
        <p class="font-display text-lg text-text-secondary">Chưa có ván nào hoàn thành</p>
        <p class="mt-2 text-sm text-text-dim">Kết thúc ván để xem lịch sử</p>
      </div>

      <!-- Current standings table (shown at top of history) -->
      <div v-if="session.players.length > 0" class="mb-8">
        <h2 class="mb-4 flex items-center gap-3 font-display text-lg font-semibold">
          <span class="text-xs tracking-widest text-accent-coral">//</span>
          XẾP HẠNG HIỆN TẠI
        </h2>
        <div class="overflow-x-auto">
          <table class="w-full border-collapse text-sm">
            <thead>
              <tr class="border-b border-border-default">
                <th class="py-2 pr-4 text-left font-display text-xs tracking-widest text-text-dim">
                  #
                </th>
                <th class="py-2 pr-4 text-left font-display text-xs tracking-widest text-text-dim">
                  NGƯỜI CHƠI
                </th>
                <th class="py-2 text-right font-display text-xs tracking-widest text-text-dim">
                  TỔNG ĐIỂM
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="player in displayedPlayers.slice().sort((a, b) => a.rank - b.rank)"
                :key="player.id"
                class="border-b border-border-default/50 transition hover:bg-bg-surface"
              >
                <td class="py-2.5 pr-4 font-display text-sm text-text-dim">{{ player.rank }}</td>
                <td class="py-2.5 pr-4">
                  <span
                    class="inline-block w-2 h-2 rounded-full mr-2"
                    :class="getColor(player.colorIndex).border.replace('border-l-', 'bg-')"
                  />
                  <span class="font-display text-sm text-text-primary">{{ player.name }}</span>
                  <span v-if="player.rank === 1" class="ml-2 text-xs text-accent-amber">🏆</span>
                </td>
                <td
                  class="py-2.5 text-right font-display font-bold"
                  :class="getColor(player.colorIndex).text"
                >
                  {{ player.score.toLocaleString('vi-VN') }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Round history -->
      <h2 class="mb-4 flex items-center gap-3 font-display text-lg font-semibold">
        <span class="text-xs tracking-widest text-accent-sky">//</span>
        LỊCH SỬ TỪNG VÁN
      </h2>

      <div class="space-y-3">
        <div
          v-for="round in [...session.rounds].reverse()"
          :key="round.id"
          class="border border-border-default bg-bg-surface"
        >
          <div
            class="flex items-center justify-between border-b border-border-default/50 px-4 py-2.5"
          >
            <span class="font-display text-sm font-semibold text-text-primary">
              <span class="text-accent-coral">VÁN {{ round.number }}</span>
            </span>
            <span class="text-xs text-text-dim">
              {{ formatDate(round.timestamp) }} — {{ formatTime(round.timestamp) }}
            </span>
          </div>
          <div class="divide-y divide-border-default/30">
            <div
              v-for="[playerId, delta] in Object.entries(round.deltas).filter(([, d]) => d !== 0)"
              :key="playerId"
              class="flex items-center justify-between px-4 py-2"
            >
              <span class="text-sm text-text-secondary">
                {{ round.nameSnapshot[playerId] ?? 'Người chơi đã xoá' }}
              </span>
              <span
                class="font-display text-sm font-semibold"
                :class="delta > 0 ? 'text-teal-400' : 'text-rose-400'"
              >
                {{ delta > 0 ? '+' : '' }}{{ delta.toLocaleString('vi-VN') }}
              </span>
            </div>
            <div
              v-if="Object.values(round.deltas).every((d) => d === 0)"
              class="px-4 py-2 text-sm text-text-dim italic"
            >
              Không có thay đổi điểm
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Author signature ──────────────────────────────────── -->
    <footer class="mt-auto border-t border-border-default/50 bg-bg-surface/30">
      <div class="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-4">
        <div class="flex items-center gap-3">
          <span class="font-display text-xs tracking-widest text-text-dim">//</span>
          <div>
            <p class="font-display text-sm font-semibold text-text-secondary">Hachi Tu</p>
            <p class="text-xs text-text-dim">Tác giả</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <a
            href="https://github.com/hachitubg"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-1.5 border border-border-default px-3 py-1.5 text-xs text-text-dim transition hover:border-text-secondary hover:text-text-secondary"
          >
            <Icon icon="lucide:github" class="size-3.5" />
            GitHub
          </a>
          <a
            href="https://www.facebook.com/tuhachiz/"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-1.5 border border-border-default px-3 py-1.5 text-xs text-text-dim transition hover:border-accent-sky hover:text-accent-sky"
          >
            <Icon icon="lucide:facebook" class="size-3.5" />
            Facebook
          </a>
        </div>
      </div>
    </footer>

    <!-- ══════════════════════════════════════════════════════ -->
    <!--  OVERLAY: Add Player                                  -->
    <!-- ══════════════════════════════════════════════════════ -->
    <div
      v-if="showAddPlayer"
      class="fixed inset-0 z-30 flex items-center justify-center bg-bg-deep/80 backdrop-blur-sm"
      @click.self="cancelAddPlayer"
    >
      <div class="w-full max-w-sm border border-accent-coral/50 bg-bg-surface mx-4">
        <div class="flex items-center justify-between border-b border-border-default px-5 py-4">
          <h3 class="font-display text-base font-semibold">
            <span class="mr-2 text-accent-coral text-xs tracking-widest">//</span>
            THÊM NGƯỜI CHƠI
          </h3>
          <button class="text-text-dim hover:text-text-primary" @click="cancelAddPlayer">
            <Icon icon="lucide:x" class="size-5" />
          </button>
        </div>
        <div class="p-5">
          <input
            ref="addPlayerInputEl"
            v-model="newPlayerName"
            type="text"
            placeholder="Nhập tên người chơi..."
            maxlength="30"
            class="w-full border border-border-default bg-bg-deep px-4 py-2.5 font-display text-sm text-text-primary outline-none focus:border-accent-coral placeholder:text-text-dim"
            @keydown.enter="confirmAddPlayer"
            @keydown="handleAddPlayerKey"
          />
        </div>
        <div class="flex gap-2 border-t border-border-default px-5 py-4">
          <button
            class="flex-1 border border-accent-coral/50 bg-accent-coral/10 py-2 font-display text-sm tracking-wide text-accent-coral transition hover:bg-accent-coral/20"
            @click="confirmAddPlayer"
          >
            THÊM
          </button>
          <button
            class="border border-border-default px-4 py-2 text-sm text-text-secondary transition hover:border-text-secondary"
            @click="cancelAddPlayer"
          >
            Huỷ
          </button>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════ -->
    <!--  OVERLAY: Settings                                    -->
    <!-- ══════════════════════════════════════════════════════ -->
    <div
      v-if="showSettings"
      class="fixed inset-0 z-30 flex items-center justify-center bg-bg-deep/80 backdrop-blur-sm"
      @click.self="showSettings = false"
    >
      <div class="w-full max-w-sm border border-border-default bg-bg-surface mx-4">
        <div class="flex items-center justify-between border-b border-border-default px-5 py-4">
          <h3 class="font-display text-base font-semibold">
            <span class="mr-2 text-accent-sky text-xs tracking-widest">//</span>
            CÀI ĐẶT
          </h3>
          <button class="text-text-dim hover:text-text-primary" @click="showSettings = false">
            <Icon icon="lucide:x" class="size-5" />
          </button>
        </div>
        <div class="divide-y divide-border-default/50">
          <div class="p-5">
            <label class="block">
              <span class="mb-2 block font-display text-xs tracking-wide text-text-secondary">
                MỤC TIÊU ĐIỂM (để trống = không giới hạn)
              </span>
              <input
                v-model="targetScoreInput"
                type="number"
                min="1"
                placeholder="Ví dụ: 100"
                class="w-full border border-border-default bg-bg-deep px-4 py-2.5 font-display text-sm text-text-primary outline-none focus:border-accent-coral [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </label>
            <p class="mt-2 text-xs text-text-dim">
              Khi người chơi đạt hoặc vượt mục tiêu, banner chiến thắng sẽ xuất hiện.
            </p>
          </div>

          <div class="p-5">
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1">
                <span class="block font-display text-xs tracking-wide text-text-secondary">
                  CÂN BẰNG ĐIỂM
                </span>
                <p class="mt-1 text-xs text-text-dim leading-relaxed">
                  Điểm nhận bởi người này sẽ tự động bị trừ đều vào những người còn lại — tổng thay
                  đổi điểm mỗi lượt luôn bằng 0.
                </p>
              </div>
              <button
                class="mt-0.5 shrink-0 transition"
                :class="zeroSumInput ? 'text-teal-400' : 'text-text-dim hover:text-text-secondary'"
                @click="zeroSumInput = !zeroSumInput"
              >
                <Icon
                  :icon="zeroSumInput ? 'lucide:toggle-right' : 'lucide:toggle-left'"
                  class="size-8"
                />
              </button>
            </div>
          </div>
        </div>
        <div class="flex gap-2 border-t border-border-default px-5 py-4">
          <button
            class="flex-1 border border-accent-coral/50 bg-accent-coral/10 py-2 font-display text-sm tracking-wide text-accent-coral transition hover:bg-accent-coral/20"
            @click="saveSettings"
          >
            LƯU
          </button>
          <button
            class="border border-border-default px-4 py-2 text-sm text-text-secondary transition hover:border-text-secondary"
            @click="showSettings = false"
          >
            Huỷ
          </button>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════ -->
    <!--  OVERLAY: Reset Confirm                               -->
    <!-- ══════════════════════════════════════════════════════ -->
    <div
      v-if="showResetConfirm"
      class="fixed inset-0 z-30 flex items-center justify-center bg-bg-deep/80 backdrop-blur-sm"
      @click.self="showResetConfirm = false"
    >
      <div class="w-full max-w-sm border border-rose-400/50 bg-bg-surface mx-4">
        <div class="flex items-center gap-3 border-b border-border-default px-5 py-4">
          <Icon icon="lucide:triangle-alert" class="size-5 text-rose-400" />
          <h3 class="font-display text-base font-semibold text-text-primary">Đặt lại trò chơi?</h3>
        </div>
        <div class="px-5 py-4">
          <p class="text-sm text-text-secondary">
            Toàn bộ điểm số, lịch sử ván và người chơi sẽ bị xoá. Hành động này không thể hoàn tác.
          </p>
        </div>
        <div class="flex gap-2 border-t border-border-default px-5 py-4">
          <button
            class="flex-1 border border-rose-400/50 bg-rose-400/10 py-2 font-display text-sm tracking-wide text-rose-400 transition hover:bg-rose-400/20"
            @click="resetGame"
          >
            ĐẶT LẠI
          </button>
          <button
            class="border border-border-default px-4 py-2 text-sm text-text-secondary transition hover:border-text-secondary"
            @click="showResetConfirm = false"
          >
            Huỷ
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
