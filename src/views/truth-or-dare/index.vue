<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useLocalStorage, useClipboard } from '@vueuse/core'
import { Icon } from '@iconify/vue'

// ─── Types ─────────────────────────────────────────────────────────────────
interface Card {
  id: string
  type: 'truth' | 'dare'
  content: string
}

interface Player {
  id: string
  name: string
  colorIndex: number
}

type GamePhase = 'lobby' | 'game' | 'reveal'

// ─── Constants ─────────────────────────────────────────────────────────────
const PLAYER_COLORS = [
  { text: 'text-accent-coral', bg: 'bg-accent-coral/10', border: 'border-accent-coral' },
  { text: 'text-accent-amber', bg: 'bg-accent-amber/10', border: 'border-accent-amber' },
  { text: 'text-accent-sky', bg: 'bg-accent-sky/10', border: 'border-accent-sky' },
  { text: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400' },
  { text: 'text-teal-400', bg: 'bg-teal-400/10', border: 'border-teal-400' },
  { text: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400' },
  { text: 'text-lime-400', bg: 'bg-lime-400/10', border: 'border-lime-400' },
  { text: 'text-pink-400', bg: 'bg-pink-400/10', border: 'border-pink-400' },
]

const DEFAULT_CARDS: Omit<Card, 'id'>[] = [
  { type: 'truth', content: 'Điều xấu hổ nhất bạn từng làm là gì?' },
  { type: 'truth', content: 'Crush hiện tại hoặc gần đây nhất của bạn là ai?' },
  { type: 'truth', content: 'Bạn đã từng nói dối ai trong nhóm này chưa? Về điều gì?' },
  { type: 'truth', content: 'Kỷ niệm ngớ ngẩn nhất bạn muốn xoá khỏi trí nhớ là gì?' },
  { type: 'truth', content: 'Điều ngốc nghếch nhất bạn từng làm vì crush là gì?' },
  { type: 'truth', content: 'Nếu chỉ giữ lại 1 người trong danh bạ, bạn giữ ai và tại sao?' },
  { type: 'truth', content: 'Lần cuối bạn khóc là vì lý do gì?' },
  { type: 'truth', content: 'Bạn có bí mật gì chưa kể cho ai trong nhóm không?' },
  { type: 'truth', content: 'Ai trong nhóm này mà bạn nghĩ là người khó tính nhất?' },
  { type: 'truth', content: 'Điều bạn tự ti nhất về bản thân là gì?' },
  { type: 'dare', content: 'Nhảy 20 cái tại chỗ trong khi hô to tên mình.' },
  { type: 'dare', content: 'Gọi điện cho một người trong danh bạ và hát Happy Birthday.' },
  { type: 'dare', content: 'Bắt chước giọng nói và cử chỉ của người ngồi bên trái trong 1 phút.' },
  { type: 'dare', content: 'Làm khuôn mặt xấu nhất có thể và giữ nguyên trong 30 giây.' },
  {
    type: 'dare',
    content: 'Nói câu "Tôi là thiên tài" với giọng khóc và mặt cực kỳ nghiêm túc 3 lần liên tiếp.',
  },
  { type: 'dare', content: 'Sáng tác và biểu diễn một điệu nhảy của riêng bạn trong 30 giây.' },
  {
    type: 'dare',
    content:
      'Nhắn tin cho một người thân: "Con/Em đang học bài chăm chỉ lắm." dù đang không làm vậy.',
  },
  {
    type: 'dare',
    content: 'Chụp selfie xấu nhất có thể và đặt làm ảnh đại diện trong 5 phút.',
  },
  {
    type: 'dare',
    content: 'Kể liên tục một câu chuyện cười trong 60 giây, không được im lặng quá 3 giây.',
  },
  {
    type: 'dare',
    content: 'Bắt chước 3 con vật khác nhau — âm thanh và cử chỉ — trong 30 giây.',
  },
]

const AI_PROMPT = `Tạo bộ bài Truth Or Dare gồm 20 lá (10 Truth + 10 Dare) về chủ đề "[CHỦ ĐỀ CỦA BẠN]".

Chỉ trả lời bằng JSON array thuần túy, KHÔNG kèm giải thích hay markdown:

[
  {"type":"truth","content":"Câu hỏi thật lòng"},
  {"type":"dare","content":"Nội dung thử thách"}
]

Quy tắc:
- "type": "truth" = câu hỏi thật lòng | "dare" = thử thách vui
- "content": tiếng Việt, cụ thể, vui vẻ, phù hợp nhóm bạn bè
- Cân bằng 50% truth và 50% dare`

// ─── State ─────────────────────────────────────────────────────────────────
const players = useLocalStorage<Player[]>('tod-players', [])
const customCards = useLocalStorage<Card[]>('tod-custom-cards', [])
const useCustomOnly = useLocalStorage('tod-custom-only', false)
const noRepeat = useLocalStorage('tod-no-repeat', true)

const { copy: clipboardCopy, copied: promptCopied } = useClipboard({ legacy: true })

const gamePhase = ref<GamePhase>('lobby')
const currentPlayerIndex = ref(0)
const usedCardIds = ref<string[]>([])
const currentCard = ref<Card | null>(null)
const cardKey = ref(0)

// Add player
const newPlayerName = ref('')
const showAddPlayer = ref(false)
const addPlayerInputEl = ref<HTMLInputElement | null>(null)

// Import overlay
const showImport = ref(false)
const importText = ref('')
const importPreview = ref<Card[]>([])
const importError = ref('')
const importMode = ref<'replace' | 'append'>('append')

// Deck overlay
const showDeck = ref(false)
const deckFilter = ref<'all' | 'truth' | 'dare'>('all')

// ─── Computed ──────────────────────────────────────────────────────────────
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 5)
}

function getColor(colorIndex: number) {
  return PLAYER_COLORS[colorIndex % PLAYER_COLORS.length]!
}

const defaultCardsWithId = computed<Card[]>(() =>
  DEFAULT_CARDS.map((c, i) => ({ ...c, id: `default-${i}` })),
)

const allCards = computed<Card[]>(() =>
  useCustomOnly.value ? customCards.value : [...defaultCardsWithId.value, ...customCards.value],
)

const activeDeck = computed<Card[]>(() => {
  if (!noRepeat.value) return allCards.value
  return allCards.value.filter((c) => !usedCardIds.value.includes(c.id))
})

const currentPlayer = computed(() => players.value[currentPlayerIndex.value] ?? null)

const deckStats = computed(() => ({
  total: allCards.value.length,
  truth: allCards.value.filter((c) => c.type === 'truth').length,
  dare: allCards.value.filter((c) => c.type === 'dare').length,
  custom: customCards.value.length,
  remaining: activeDeck.value.length,
}))

const filteredDeckCards = computed(() => {
  if (deckFilter.value === 'all') return allCards.value
  return allCards.value.filter((c) => c.type === deckFilter.value)
})

// ─── Player actions ────────────────────────────────────────────────────────
async function openAddPlayer() {
  showAddPlayer.value = true
  await nextTick()
  addPlayerInputEl.value?.focus()
}

function confirmAddPlayer() {
  const name = newPlayerName.value.trim()
  if (!name) return
  players.value.push({ id: generateId(), name, colorIndex: players.value.length })
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

function removePlayer(id: string) {
  players.value = players.value.filter((p) => p.id !== id)
}

// ─── Game actions ──────────────────────────────────────────────────────────
function startGame() {
  if (players.value.length < 2) return
  gamePhase.value = 'game'
  currentPlayerIndex.value = 0
  usedCardIds.value = []
  currentCard.value = null
}

function drawCard() {
  let deck = activeDeck.value
  if (deck.length === 0) {
    usedCardIds.value = []
    deck = allCards.value
  }
  const card = deck[Math.floor(Math.random() * deck.length)]!
  if (noRepeat.value) usedCardIds.value = [...usedCardIds.value, card.id]
  currentCard.value = card
  cardKey.value++
  gamePhase.value = 'reveal'
}

function nextTurn() {
  currentPlayerIndex.value = (currentPlayerIndex.value + 1) % players.value.length
  gamePhase.value = 'game'
}

function backToLobby() {
  gamePhase.value = 'lobby'
}

// ─── AI Import ─────────────────────────────────────────────────────────────
function openImport() {
  importText.value = ''
  importPreview.value = []
  importError.value = ''
  showImport.value = true
}

function copyPrompt() {
  clipboardCopy(AI_PROMPT)
}

function parseImport() {
  importError.value = ''
  importPreview.value = []
  const text = importText.value.trim()
  if (!text) {
    importError.value = 'Vui lòng dán nội dung trả lời từ AI vào ô trên.'
    return
  }
  try {
    const match = text.match(/\[[\s\S]*\]/)
    if (!match) throw new Error('Không tìm thấy JSON array hợp lệ trong nội dung.')
    const parsed = JSON.parse(match[0]) as unknown[]
    if (!Array.isArray(parsed)) throw new Error('Dữ liệu phải là một mảng JSON.')
    const cards: Card[] = []
    for (const item of parsed) {
      if (item !== null && typeof item === 'object' && 'type' in item && 'content' in item) {
        const obj = item as Record<string, unknown>
        if (
          (obj['type'] === 'truth' || obj['type'] === 'dare') &&
          typeof obj['content'] === 'string' &&
          obj['content'].trim()
        ) {
          cards.push({ id: generateId(), type: obj['type'], content: obj['content'].trim() })
        }
      }
    }
    if (cards.length === 0) throw new Error('Không tìm thấy lá bài hợp lệ nào trong dữ liệu.')
    importPreview.value = cards
  } catch (e) {
    importError.value = e instanceof Error ? e.message : 'Định dạng không hợp lệ, vui lòng thử lại.'
  }
}

function confirmImport() {
  if (!importPreview.value.length) return
  customCards.value =
    importMode.value === 'replace'
      ? importPreview.value
      : [...customCards.value, ...importPreview.value]
  showImport.value = false
}

function cancelImport() {
  showImport.value = false
}

function removeCustomCard(id: string) {
  customCards.value = customCards.value.filter((c) => c.id !== id)
}

function clearCustomCards() {
  customCards.value = []
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-bg-deep font-body text-text-primary">
    <!-- ── Header ──────────────────────────────────────────── -->
    <header class="sticky top-0 z-20 border-b border-border-default bg-bg-deep/95 backdrop-blur-sm">
      <div class="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
        <div class="flex items-center gap-3">
          <button
            v-if="gamePhase !== 'lobby'"
            class="flex items-center gap-1 text-xs text-text-dim transition hover:text-text-secondary"
            @click="backToLobby"
          >
            <Icon icon="lucide:arrow-left" class="size-4" />
          </button>
          <RouterLink
            v-else
            to="/"
            class="flex items-center gap-1 text-xs text-text-dim transition hover:text-text-secondary"
          >
            <Icon icon="lucide:arrow-left" class="size-4" />
          </RouterLink>

          <h1 class="flex items-center gap-2 font-display text-xl font-bold text-text-primary">
            <span class="text-sm tracking-widest text-accent-coral">//</span>
            TRUTH OR DARE
          </h1>
        </div>

        <div
          v-if="gamePhase !== 'lobby'"
          class="font-display text-xs tracking-widest text-text-dim"
        >
          CÒN
          <span class="ml-1 font-bold text-accent-coral">{{ deckStats.remaining }}</span>
          /{{ deckStats.total }} LÁ
        </div>
      </div>
    </header>

    <!-- ══════════════════════════════════════════════════════ -->
    <!--  LOBBY                                                -->
    <!-- ══════════════════════════════════════════════════════ -->
    <div v-if="gamePhase === 'lobby'" class="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
      <!-- Players section -->
      <section class="mb-8">
        <h2 class="mb-4 flex items-center gap-3 font-display text-lg font-semibold">
          <span class="text-xs tracking-widest text-accent-coral">//</span>
          NGƯỜI CHƠI
          <span class="ml-auto font-display text-xs font-normal text-text-dim"
            >Tối thiểu 2 người</span
          >
        </h2>

        <div class="space-y-2">
          <div
            v-for="(player, idx) in players"
            :key="player.id"
            class="flex items-center gap-3 border border-border-default bg-bg-surface px-4 py-3 transition hover:bg-bg-elevated"
          >
            <span
              class="font-display text-xs tracking-widest"
              :class="getColor(player.colorIndex).text"
            >
              #{{ idx + 1 }}
            </span>
            <span class="flex-1 font-display text-sm text-text-primary">{{ player.name }}</span>
            <button
              class="text-text-dim transition hover:text-rose-400"
              @click="removePlayer(player.id)"
            >
              <Icon icon="lucide:x" class="size-4" />
            </button>
          </div>

          <div
            v-if="players.length === 0"
            class="flex items-center justify-center border border-dashed border-border-default py-8 text-sm text-text-dim"
          >
            Chưa có người chơi nào
          </div>
        </div>

        <div class="mt-2">
          <div
            v-if="showAddPlayer"
            class="flex items-center gap-2 border border-accent-coral/40 bg-bg-surface p-3"
          >
            <Icon icon="lucide:user-plus" class="size-4 shrink-0 text-accent-coral" />
            <input
              ref="addPlayerInputEl"
              v-model="newPlayerName"
              type="text"
              placeholder="Tên người chơi..."
              maxlength="20"
              class="min-w-0 flex-1 bg-transparent font-display text-sm text-text-primary outline-none placeholder:text-text-dim"
              @keydown.enter="confirmAddPlayer"
              @keydown="handleAddPlayerKey"
            />
            <button
              class="border border-accent-coral/50 bg-accent-coral/10 px-4 py-1 font-display text-xs tracking-wide text-accent-coral transition hover:bg-accent-coral/20"
              @click="confirmAddPlayer"
            >
              THÊM
            </button>
            <button class="text-text-dim hover:text-text-secondary" @click="cancelAddPlayer">
              <Icon icon="lucide:x" class="size-4" />
            </button>
          </div>
          <button
            v-else
            class="flex w-full items-center justify-center gap-2 border border-dashed border-border-default py-2.5 font-display text-sm tracking-wide text-text-dim transition hover:border-accent-coral hover:text-accent-coral"
            @click="openAddPlayer"
          >
            <Icon icon="lucide:plus" class="size-4" />
            THÊM NGƯỜI CHƠI
          </button>
        </div>
      </section>

      <!-- Deck section -->
      <section class="mb-8">
        <h2 class="mb-4 flex items-center gap-3 font-display text-lg font-semibold">
          <span class="text-xs tracking-widest text-accent-amber">//</span>
          BỘ BÀI
        </h2>

        <div class="mb-4 grid grid-cols-3 gap-3">
          <div class="border border-border-default bg-bg-surface p-4 text-center">
            <div class="font-display text-2xl font-bold text-text-primary">
              {{ deckStats.total }}
            </div>
            <div class="mt-1 font-display text-xs tracking-widest text-text-dim">TỔNG LÁ</div>
          </div>
          <div class="border border-border-default bg-bg-surface p-4 text-center">
            <div class="font-display text-2xl font-bold text-accent-coral">
              {{ deckStats.truth }}
            </div>
            <div class="mt-1 font-display text-xs tracking-widest text-text-dim">TRUTH</div>
          </div>
          <div class="border border-border-default bg-bg-surface p-4 text-center">
            <div class="font-display text-2xl font-bold text-accent-amber">
              {{ deckStats.dare }}
            </div>
            <div class="mt-1 font-display text-xs tracking-widest text-text-dim">DARE</div>
          </div>
        </div>

        <div class="mb-4 space-y-2">
          <div
            class="flex cursor-pointer items-center justify-between border border-border-default bg-bg-surface px-4 py-3 transition hover:bg-bg-elevated"
          >
            <div>
              <p class="font-display text-sm text-text-secondary">Không lặp lại lá bài</p>
              <p class="mt-0.5 text-xs text-text-dim">
                Mỗi lá chỉ xuất hiện một lần, hết bài sẽ tự xáo lại
              </p>
            </div>
            <button
              class="shrink-0 transition"
              :class="noRepeat ? 'text-teal-400' : 'text-text-dim'"
              @click="noRepeat = !noRepeat"
            >
              <Icon
                :icon="noRepeat ? 'lucide:toggle-right' : 'lucide:toggle-left'"
                class="size-8"
              />
            </button>
          </div>

          <div
            class="flex cursor-pointer items-center justify-between border border-border-default bg-bg-surface px-4 py-3 transition hover:bg-bg-elevated"
          >
            <div>
              <p class="font-display text-sm text-text-secondary">Chỉ dùng bài tuỳ chỉnh</p>
              <p class="mt-0.5 text-xs text-text-dim">
                Bỏ qua bộ bài mặc định, chỉ dùng bài bạn import từ AI
              </p>
            </div>
            <button
              class="shrink-0 transition"
              :class="useCustomOnly ? 'text-teal-400' : 'text-text-dim'"
              @click="useCustomOnly = !useCustomOnly"
            >
              <Icon
                :icon="useCustomOnly ? 'lucide:toggle-right' : 'lucide:toggle-left'"
                class="size-8"
              />
            </button>
          </div>
        </div>

        <div class="flex gap-2">
          <button
            class="flex flex-1 items-center justify-center gap-2 border border-border-default bg-bg-surface py-2.5 font-display text-xs tracking-wide text-text-secondary transition hover:border-accent-amber hover:text-accent-amber"
            @click="openImport"
          >
            <Icon icon="lucide:bot" class="size-4" />
            NHẬP TỪ AI
          </button>
          <button
            class="flex flex-1 items-center justify-center gap-2 border border-border-default bg-bg-surface py-2.5 font-display text-xs tracking-wide text-text-secondary transition hover:border-accent-sky hover:text-accent-sky"
            @click="showDeck = true"
          >
            <Icon icon="lucide:layers" class="size-4" />
            XEM BỘ BÀI
            <span v-if="customCards.length > 0" class="text-accent-amber"
              >(+{{ customCards.length }})</span
            >
          </button>
        </div>
      </section>

      <button
        :disabled="players.length < 2 || deckStats.total === 0"
        class="w-full border border-accent-coral bg-accent-coral/10 py-4 font-display text-lg font-bold tracking-widest text-accent-coral transition hover:bg-accent-coral/20 disabled:cursor-not-allowed disabled:opacity-30"
        @click="startGame"
      >
        BẮT ĐẦU CHƠI
      </button>
      <p v-if="players.length < 2" class="mt-2 text-center text-xs text-text-dim">
        Cần ít nhất 2 người chơi
      </p>
    </div>

    <!-- ══════════════════════════════════════════════════════ -->
    <!--  GAME — Draw card screen                              -->
    <!-- ══════════════════════════════════════════════════════ -->
    <div
      v-else-if="gamePhase === 'game'"
      class="flex flex-1 flex-col items-center justify-center px-6 py-10"
    >
      <div class="mb-10 text-center animate-fade-up">
        <p class="font-display text-xs tracking-widest text-text-dim">LƯỢT CỦA</p>
        <p
          class="mt-2 font-display text-4xl font-bold"
          :class="currentPlayer ? getColor(currentPlayer.colorIndex).text : 'text-text-primary'"
        >
          {{ currentPlayer?.name ?? '...' }}
        </p>
      </div>

      <button class="group animate-fade-up animate-delay-2" @click="drawCard">
        <div
          class="flex size-52 flex-col items-center justify-center gap-4 border-2 border-border-default bg-bg-surface transition-all duration-300 group-hover:-translate-y-1 group-hover:border-accent-coral group-hover:bg-bg-elevated group-hover:shadow-2xl group-hover:shadow-accent-coral/10"
        >
          <Icon
            icon="mdi:cards-playing-outline"
            class="size-16 text-text-dim transition-colors group-hover:text-accent-coral"
          />
          <span
            class="font-display text-sm tracking-widest text-text-secondary transition-colors group-hover:text-accent-coral"
          >
            RÚT BÀI
          </span>
        </div>
      </button>

      <p
        class="mt-8 font-display text-xs tracking-widest text-text-dim animate-fade-up animate-delay-3"
      >
        {{ deckStats.remaining }} LÁ CÒN LẠI
      </p>
    </div>

    <!-- ══════════════════════════════════════════════════════ -->
    <!--  REVEAL — Show card                                   -->
    <!-- ══════════════════════════════════════════════════════ -->
    <div
      v-else-if="gamePhase === 'reveal' && currentCard"
      class="flex flex-1 flex-col items-center justify-center px-6 py-10"
    >
      <p
        class="mb-6 font-display text-sm tracking-widest"
        :class="currentPlayer ? getColor(currentPlayer.colorIndex).text : 'text-text-dim'"
      >
        {{ currentPlayer?.name ?? '' }}
      </p>

      <div
        :key="cardKey"
        class="relative w-full max-w-md border-l-4 bg-bg-surface p-8 shadow-2xl animate-fade-up"
        :class="currentCard.type === 'truth' ? 'border-l-accent-coral' : 'border-l-accent-amber'"
      >
        <div class="mb-6 flex items-center gap-3">
          <Icon
            :icon="currentCard.type === 'truth' ? 'lucide:help-circle' : 'lucide:flame'"
            class="size-6"
            :class="currentCard.type === 'truth' ? 'text-accent-coral' : 'text-accent-amber'"
          />
          <span
            class="font-display text-xs font-bold tracking-widest"
            :class="currentCard.type === 'truth' ? 'text-accent-coral' : 'text-accent-amber'"
          >
            {{ currentCard.type === 'truth' ? 'THẬT LÒNG' : 'THỬ THÁCH' }}
          </span>
        </div>

        <p class="text-xl font-semibold leading-relaxed text-text-primary">
          {{ currentCard.content }}
        </p>

        <span
          class="pointer-events-none absolute right-4 top-3 select-none font-display text-8xl font-bold"
          :class="currentCard.type === 'truth' ? 'text-accent-coral/5' : 'text-accent-amber/5'"
        >
          {{ currentCard.type === 'truth' ? 'T' : 'D' }}
        </span>
      </div>

      <div class="mt-8 flex w-full max-w-md gap-3 animate-fade-up animate-delay-2">
        <button
          class="flex-1 border border-border-default bg-bg-surface py-3 font-display text-sm tracking-wide text-text-secondary transition hover:border-rose-400 hover:text-rose-400"
          @click="nextTurn"
        >
          <Icon icon="lucide:skip-forward" class="mr-2 inline size-4" />
          BỎ QUA
        </button>
        <button
          class="flex-1 border border-teal-400/50 bg-teal-400/10 py-3 font-display text-sm tracking-wide text-teal-400 transition hover:bg-teal-400/20"
          @click="nextTurn"
        >
          <Icon icon="lucide:check" class="mr-2 inline size-4" />
          HOÀN THÀNH
        </button>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════ -->
    <!--  OVERLAY: AI Import                                   -->
    <!-- ══════════════════════════════════════════════════════ -->
    <div
      v-if="showImport"
      class="fixed inset-0 z-30 flex items-start justify-center overflow-y-auto bg-bg-deep/85 p-4 backdrop-blur-sm"
      @click.self="cancelImport"
    >
      <div class="my-8 w-full max-w-xl border border-border-default bg-bg-surface">
        <div class="flex items-center justify-between border-b border-border-default px-5 py-4">
          <h3 class="font-display text-base font-semibold">
            <span class="mr-2 text-xs tracking-widest text-accent-amber">//</span>
            NHẬP BỘ BÀI TỪ AI
          </h3>
          <button class="text-text-dim hover:text-text-primary" @click="cancelImport">
            <Icon icon="lucide:x" class="size-5" />
          </button>
        </div>

        <div class="space-y-5 p-5">
          <!-- Step 1 -->
          <div>
            <p class="mb-2 font-display text-xs tracking-wide text-text-secondary">
              BƯỚC 1 — SAO CHÉP PROMPT NÀY
            </p>
            <div class="relative border border-border-default bg-bg-deep">
              <pre
                class="overflow-x-auto p-4 pr-28 text-xs leading-relaxed text-text-secondary whitespace-pre-wrap"
                >{{ AI_PROMPT }}</pre
              >
              <button
                class="absolute right-2 top-2 flex items-center gap-1.5 border px-3 py-1.5 font-display text-xs tracking-wide transition"
                :class="
                  promptCopied
                    ? 'border-teal-400/50 bg-teal-400/10 text-teal-400'
                    : 'border-border-default bg-bg-elevated text-text-dim hover:border-accent-amber hover:text-accent-amber'
                "
                @click="copyPrompt"
              >
                <Icon :icon="promptCopied ? 'lucide:check' : 'lucide:copy'" class="size-3.5" />
                {{ promptCopied ? 'ĐÃ SAO CHÉP' : 'SAO CHÉP' }}
              </button>
            </div>
            <p class="mt-2 text-xs text-text-dim">
              Thay <span class="font-bold text-accent-amber">[CHỦ ĐỀ CỦA BẠN]</span> bằng chủ đề bạn
              muốn (ví dụ: "tình yêu học đường", "công sở", "du lịch"...) rồi dán vào ChatGPT,
              Gemini, Claude hoặc bất kỳ AI nào bạn thích.
            </p>
          </div>

          <!-- Step 2 -->
          <div>
            <p class="mb-2 font-display text-xs tracking-wide text-text-secondary">
              BƯỚC 2 — DÁN KẾT QUẢ TỪ AI VÀO ĐÂY
            </p>
            <textarea
              v-model="importText"
              rows="6"
              placeholder='Dán JSON từ AI vào đây...&#10;[{"type":"truth","content":"..."},{"type":"dare","content":"..."}]'
              class="w-full resize-y border border-border-default bg-bg-deep px-4 py-3 font-mono text-xs text-text-primary outline-none focus:border-accent-amber placeholder:text-text-dim"
            />
          </div>

          <button
            class="w-full border border-accent-amber/50 bg-accent-amber/10 py-2.5 font-display text-sm tracking-wide text-accent-amber transition hover:bg-accent-amber/20"
            @click="parseImport"
          >
            <Icon icon="lucide:scan-text" class="mr-2 inline size-4" />
            PHÂN TÍCH DỮ LIỆU
          </button>

          <div
            v-if="importError"
            class="flex items-start gap-2 border border-rose-400/30 bg-rose-400/5 p-3 text-sm text-rose-400"
          >
            <Icon icon="lucide:triangle-alert" class="mt-0.5 size-4 shrink-0" />
            {{ importError }}
          </div>

          <div v-if="importPreview.length > 0">
            <div class="mb-3 flex items-center justify-between">
              <p class="font-display text-xs tracking-wide text-teal-400">
                <Icon icon="lucide:check-circle" class="mr-1 inline size-3.5" />
                TÌM THẤY {{ importPreview.length }} LÁ BÀI
              </p>
              <span class="text-xs text-text-dim">
                {{ importPreview.filter((c) => c.type === 'truth').length }} Truth ·
                {{ importPreview.filter((c) => c.type === 'dare').length }} Dare
              </span>
            </div>
            <div
              class="max-h-48 space-y-1.5 overflow-y-auto border border-border-default bg-bg-deep p-3"
            >
              <div
                v-for="card in importPreview"
                :key="card.id"
                class="flex items-start gap-2 text-xs"
              >
                <span
                  class="mt-0.5 shrink-0 font-display font-bold"
                  :class="card.type === 'truth' ? 'text-accent-coral' : 'text-accent-amber'"
                >
                  {{ card.type === 'truth' ? 'T' : 'D' }}
                </span>
                <span class="text-text-secondary">{{ card.content }}</span>
              </div>
            </div>

            <div class="mt-3 flex gap-2">
              <button
                class="flex-1 border py-2 font-display text-xs tracking-wide transition"
                :class="
                  importMode === 'append'
                    ? 'border-teal-400/50 bg-teal-400/10 text-teal-400'
                    : 'border-border-default text-text-dim hover:border-text-secondary'
                "
                @click="importMode = 'append'"
              >
                THÊM VÀO BỘ BÀI CŨ
              </button>
              <button
                class="flex-1 border py-2 font-display text-xs tracking-wide transition"
                :class="
                  importMode === 'replace'
                    ? 'border-accent-amber/50 bg-accent-amber/10 text-accent-amber'
                    : 'border-border-default text-text-dim hover:border-text-secondary'
                "
                @click="importMode = 'replace'"
              >
                THAY THẾ BÀI CŨ
              </button>
            </div>
          </div>
        </div>

        <div class="flex gap-2 border-t border-border-default px-5 py-4">
          <button
            :disabled="importPreview.length === 0"
            class="flex-1 border border-teal-400/50 bg-teal-400/10 py-2 font-display text-sm tracking-wide text-teal-400 transition hover:bg-teal-400/20 disabled:cursor-not-allowed disabled:opacity-30"
            @click="confirmImport"
          >
            XÁC NHẬN IMPORT
          </button>
          <button
            class="border border-border-default px-4 py-2 text-sm text-text-secondary transition hover:border-text-secondary"
            @click="cancelImport"
          >
            Huỷ
          </button>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════ -->
    <!--  OVERLAY: View Deck                                   -->
    <!-- ══════════════════════════════════════════════════════ -->
    <div
      v-if="showDeck"
      class="fixed inset-0 z-30 flex items-start justify-center overflow-y-auto bg-bg-deep/85 p-4 backdrop-blur-sm"
      @click.self="showDeck = false"
    >
      <div class="my-8 w-full max-w-xl border border-border-default bg-bg-surface">
        <div class="flex items-center justify-between border-b border-border-default px-5 py-4">
          <h3 class="font-display text-base font-semibold">
            <span class="mr-2 text-xs tracking-widest text-accent-sky">//</span>
            BỘ BÀI ({{ deckStats.total }} lá)
          </h3>
          <button class="text-text-dim hover:text-text-primary" @click="showDeck = false">
            <Icon icon="lucide:x" class="size-5" />
          </button>
        </div>

        <div class="flex border-b border-border-default">
          <button
            v-for="f in ['all', 'truth', 'dare'] as const"
            :key="f"
            class="flex-1 border-b-2 py-2.5 font-display text-xs tracking-wide transition"
            :class="
              deckFilter === f
                ? 'border-accent-sky text-accent-sky'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            "
            @click="deckFilter = f"
          >
            {{
              f === 'all'
                ? `TẤT CẢ (${deckStats.total})`
                : f === 'truth'
                  ? `TRUTH (${deckStats.truth})`
                  : `DARE (${deckStats.dare})`
            }}
          </button>
        </div>

        <div class="max-h-96 divide-y divide-border-default/30 overflow-y-auto">
          <div
            v-for="card in filteredDeckCards"
            :key="card.id"
            class="flex items-start gap-3 px-5 py-3 transition hover:bg-bg-elevated"
          >
            <span
              class="mt-0.5 shrink-0 font-display text-xs font-bold"
              :class="card.type === 'truth' ? 'text-accent-coral' : 'text-accent-amber'"
            >
              {{ card.type === 'truth' ? 'T' : 'D' }}
            </span>
            <span class="flex-1 text-sm text-text-secondary">{{ card.content }}</span>
            <span
              v-if="card.id.startsWith('default-')"
              class="shrink-0 font-display text-xs text-text-dim"
            >
              mặc định
            </span>
            <button
              v-else
              class="shrink-0 text-text-dim transition hover:text-rose-400"
              @click="removeCustomCard(card.id)"
            >
              <Icon icon="lucide:trash-2" class="size-3.5" />
            </button>
          </div>
        </div>

        <div class="flex gap-2 border-t border-border-default px-5 py-4">
          <button
            v-if="customCards.length > 0"
            class="border border-rose-400/40 bg-rose-400/5 px-4 py-2 font-display text-xs tracking-wide text-rose-400 transition hover:bg-rose-400/10"
            @click="clearCustomCards"
          >
            XOÁ BÀI TUỲ CHỈNH ({{ customCards.length }})
          </button>
          <button
            class="ml-auto border border-border-default px-4 py-2 text-sm text-text-secondary transition hover:border-text-secondary"
            @click="showDeck = false"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>

    <!-- ── Footer signature ────────────────────────────────── -->
    <footer class="mt-auto border-t border-border-default/50 bg-bg-surface/30">
      <div class="mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-3 px-6 py-4">
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
  </div>
</template>
