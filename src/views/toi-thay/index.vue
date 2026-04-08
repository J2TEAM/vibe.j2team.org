<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useEventListener, useLocalStorage, useTimeoutFn } from '@vueuse/core'

// Supabase anon key — intentionally public, security enforced by Row Level Security policies
const SUPABASE_URL = 'https://brmumezhzfiufcvqgqra.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJybXVtZXpoemZpdWZjdnFncXJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NDY5NTgsImV4cCI6MjA4OTUyMjk1OH0.QZD6x73wX2NPdDKzeGJp4NZ5bdNEVYGi-42F6lQhPjM'
const API_HEADERS = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
}

const NOTE_COLORS = [
  '#fef08a',
  '#fde68a',
  '#fed7aa',
  '#bbf7d0',
  '#bfdbfe',
  '#fbcfe8',
  '#ddd6fe',
  '#fca5a5',
]
const CANVAS_SIZE = 3000
const NOTE_SIZE = 96

const CATEGORY_VI: Record<string, string> = {
  'Smileys & Emotion': 'Cảm xúc',
  'People & Body': 'Con người',
  'Animals & Nature': 'Thiên nhiên',
  'Food & Drink': 'Đồ ăn',
  'Travel & Places': 'Du lịch',
  Activities: 'Hoạt động',
  Objects: 'Đồ vật',
  Symbols: 'Ký hiệu',
  Flags: 'Cờ',
}

const emojiCategories = ref<Record<string, string[]>>({})

interface Submission {
  id: string
  emojis: string
  created_at: string
  pos_x: number | null
  pos_y: number | null
}

const todayKey = new Date().toLocaleDateString('en-CA')
const savedDate = useLocalStorage('toi-thay-date', '')
const savedEmojis = useLocalStorage('toi-thay-emojis', '')
const savedId = useLocalStorage('toi-thay-id', '')
const hasSubmittedToday = computed(() => savedDate.value === todayKey)

const selected = ref<string[]>([])
const activeCategory = ref('')
const submissions = ref<Submission[]>([])
const loading = ref(false)
const fetchError = ref('')
const phoneOpen = ref(true)

// Board pan/zoom
const boardOffset = ref({ x: 0, y: 0 })
const scale = ref(1)
const MIN_SCALE = 0.3
const MAX_SCALE = 4
const activePointers = new Map<number, { x: number; y: number }>()
const lastPinchDist = ref(-1)
const isDragging = ref(false)

// Placement mode
const placingMode = ref(false)
const ghostCanvasPos = ref({ x: CANVAS_SIZE / 2, y: CANVAS_SIZE / 2 })

const showEmptyHint = ref(false)
const { start: startHintTimer } = useTimeoutFn(
  () => {
    showEmptyHint.value = false
  },
  2000,
  { immediate: false },
)

const showInfo = ref(false)
const infoRef = ref<HTMLElement | null>(null)

function toggleInfo() {
  showInfo.value = !showInfo.value
}

useEventListener(document, 'pointerdown', (e: PointerEvent) => {
  if (showInfo.value && infoRef.value && !infoRef.value.contains(e.target as Node)) {
    showInfo.value = false
  }
})

// Deterministic seeded random — consistent across reloads
function seeded(id: string, salt: number): number {
  let h = salt * 2654435761
  for (const c of id) h = Math.imul(h ^ c.charCodeAt(0), 2654435761)
  return (h >>> 0) / 0xffffffff
}

function noteColor(id: string): string {
  const idx = Math.floor(seeded(id, 4) * NOTE_COLORS.length)
  return NOTE_COLORS[idx] ?? NOTE_COLORS[0] ?? '#fef08a'
}

function noteStyle(s: Submission) {
  const x = s.pos_x ?? seeded(s.id, 1) * (CANVAS_SIZE - NOTE_SIZE)
  const y = s.pos_y ?? seeded(s.id, 2) * (CANVAS_SIZE - NOTE_SIZE)
  const rot = (seeded(s.id, 3) - 0.5) * 18
  return {
    left: `${x}px`,
    top: `${y}px`,
    transform: `rotate(${rot}deg)`,
    backgroundColor: noteColor(s.id),
  }
}

function ghostStyle() {
  return {
    left: `${ghostCanvasPos.value.x}px`,
    top: `${ghostCanvasPos.value.y}px`,
    backgroundColor: NOTE_COLORS[0],
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'vừa xong'
  if (mins < 60) return `${mins}ph`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

function clampOffset(x: number, y: number) {
  const boardH = window.innerHeight - 48
  return {
    x: Math.min(0, Math.max(-(CANVAS_SIZE * scale.value - window.innerWidth), x)),
    y: Math.min(0, Math.max(-(CANVAS_SIZE * scale.value - boardH), y)),
  }
}

function zoomAt(pivotScreenX: number, pivotScreenY: number, newScale: number) {
  newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, newScale))
  const ratio = newScale / scale.value
  const newOffsetX = pivotScreenX - (pivotScreenX - boardOffset.value.x) * ratio
  const newOffsetY = pivotScreenY - 48 - (pivotScreenY - 48 - boardOffset.value.y) * ratio
  scale.value = newScale
  boardOffset.value = clampOffset(newOffsetX, newOffsetY)
}

// Ghost note drag
const isDraggingGhost = ref(false)
const ghostDragAnchor = { screenX: 0, screenY: 0, canvasX: 0, canvasY: 0 }

function onGhostPointerDown(e: PointerEvent) {
  e.stopPropagation()
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  isDraggingGhost.value = true
  ghostDragAnchor.screenX = e.clientX
  ghostDragAnchor.screenY = e.clientY
  ghostDragAnchor.canvasX = ghostCanvasPos.value.x
  ghostDragAnchor.canvasY = ghostCanvasPos.value.y
}

function onGhostPointerMove(e: PointerEvent) {
  e.stopPropagation()
  if (!isDraggingGhost.value) return
  const dx = (e.clientX - ghostDragAnchor.screenX) / scale.value
  const dy = (e.clientY - ghostDragAnchor.screenY) / scale.value
  ghostCanvasPos.value = {
    x: Math.min(Math.max(0, ghostDragAnchor.canvasX + dx), CANVAS_SIZE - NOTE_SIZE),
    y: Math.min(Math.max(0, ghostDragAnchor.canvasY + dy), CANVAS_SIZE - NOTE_SIZE),
  }
}

function onGhostPointerUp(e: PointerEvent) {
  e.stopPropagation()
  isDraggingGhost.value = false
}

function onBoardPointerDown(e: PointerEvent) {
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
  isDragging.value = true
  lastPinchDist.value = -1
}

function onBoardPointerMove(e: PointerEvent) {
  const prev = activePointers.get(e.pointerId)
  if (!prev) return
  activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
  if (activePointers.size === 2) {
    const [p0, p1] = [...activePointers.values()]
    if (!p0 || !p1) return
    const dist = Math.hypot(p0.x - p1.x, p0.y - p1.y)
    if (lastPinchDist.value > 0) {
      const cx = (p0.x + p1.x) / 2
      const cy = (p0.y + p1.y) / 2
      zoomAt(cx, cy, scale.value * (dist / lastPinchDist.value))
    }
    lastPinchDist.value = dist
  } else if (activePointers.size === 1) {
    boardOffset.value = clampOffset(
      boardOffset.value.x + (e.clientX - prev.x),
      boardOffset.value.y + (e.clientY - prev.y),
    )
  }
}

function onBoardPointerUp(e: PointerEvent) {
  activePointers.delete(e.pointerId)
  isDragging.value = activePointers.size > 0
  lastPinchDist.value = -1
}

function onBoardWheel(e: WheelEvent) {
  const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1
  zoomAt(e.clientX, e.clientY, scale.value * factor)
}

function enterPlacingMode() {
  if (loading.value) return
  if (selected.value.length === 0) {
    showEmptyHint.value = true
    startHintTimer()
    return
  }
  placingMode.value = true
  // init ghost to center of current viewport
  const centerX = (window.innerWidth / 2 - boardOffset.value.x) / scale.value
  const centerY = ((window.innerHeight - 48) / 2 - boardOffset.value.y) / scale.value
  ghostCanvasPos.value = {
    x: Math.min(Math.max(0, centerX - NOTE_SIZE / 2), CANVAS_SIZE - NOTE_SIZE),
    y: Math.min(Math.max(0, centerY - NOTE_SIZE / 2), CANVAS_SIZE - NOTE_SIZE),
  }
}

function cancelPlacingMode() {
  placingMode.value = false
}

function confirmPlacement() {
  placeAndSubmit()
}

async function placeAndSubmit() {
  loading.value = true
  fetchError.value = ''
  placingMode.value = false
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/submissions`, {
      method: 'POST',
      headers: API_HEADERS,
      body: JSON.stringify({
        emojis: selected.value.join(''),
        pos_x: ghostCanvasPos.value.x,
        pos_y: ghostCanvasPos.value.y,
      }),
    })
    if (!res.ok) throw new Error('Submit failed')
    const data = await res.json()
    savedDate.value = todayKey
    savedEmojis.value = selected.value.join('')
    savedId.value = data[0]?.id ?? ''
    phoneOpen.value = true
    await loadSubmissions()
    if (savedId.value) {
      const fresh = submissions.value.find((s) => s.id === savedId.value)
      if (fresh) centerOn(fresh)
    }
  } catch {
    fetchError.value = 'Có lỗi xảy ra, thử lại nhé!'
    phoneOpen.value = true
  } finally {
    loading.value = false
  }
}

function toggleEmoji(emoji: string) {
  if (selected.value.length < 5) {
    selected.value.push(emoji)
  }
}

function removeSlot(index: number) {
  selected.value.splice(index, 1)
}

function removeLast() {
  selected.value.pop()
}

function setCategory(category: string) {
  activeCategory.value = category
}

function openPhone() {
  phoneOpen.value = true
}

function closePhone() {
  phoneOpen.value = false
}

function noteCanvasPos(s: Submission) {
  return {
    x: s.pos_x ?? seeded(s.id, 1) * (CANVAS_SIZE - NOTE_SIZE),
    y: s.pos_y ?? seeded(s.id, 2) * (CANVAS_SIZE - NOTE_SIZE),
  }
}

function centerOn(s: Submission) {
  const { x, y } = noteCanvasPos(s)
  boardOffset.value = clampOffset(
    window.innerWidth / 2 - (x + NOTE_SIZE / 2) * scale.value,
    (window.innerHeight - 48) / 2 - (y + NOTE_SIZE / 2) * scale.value,
  )
}

function centerOnTarget() {
  const target =
    (savedId.value && submissions.value.find((s) => s.id === savedId.value)) || submissions.value[0]
  if (target) centerOn(target)
}

async function loadSubmissions() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/submissions?select=*&order=created_at.desc&limit=200`,
      { headers: API_HEADERS },
    )
    if (!res.ok) throw new Error()
    submissions.value = await res.json()
    centerOnTarget()
  } catch {
    // board is non-critical
  }
}

async function loadEmojis() {
  try {
    const res = await fetch('/toi-thay/emojis.json')
    if (!res.ok) throw new Error()
    emojiCategories.value = await res.json()
    activeCategory.value = Object.keys(emojiCategories.value)[0] ?? ''
  } catch {
    // fail silently
  }
}

onMounted(() => {
  loadSubmissions()
  loadEmojis()
})
</script>

<template>
  <div class="fixed inset-0 overflow-hidden">
    <!-- Header -->
    <div
      class="absolute left-0 right-0 top-0 z-20 flex items-center justify-between border-b border-border-default bg-bg-surface/90 px-4 py-3 backdrop-blur-sm"
    >
      <RouterLink
        to="/"
        class="flex items-center gap-1 text-sm text-text-dim transition hover:text-text-primary"
      >
        <Icon icon="lucide:arrow-left" class="size-4" />
      </RouterLink>
      <div class="relative" ref="infoRef">
        <div class="flex items-center justify-center gap-1.5">
          <h1 class="font-display text-lg font-bold leading-none text-accent-coral">Tôi thấy...</h1>
          <button
            class="flex size-4 items-center justify-center rounded-full border border-text-dim text-[10px] font-bold text-text-dim transition hover:border-text-primary hover:text-text-primary"
            @click="toggleInfo"
          >
            ?
          </button>
        </div>
        <p class="text-center text-xs text-text-dim">{{ submissions.length }} ghi chú</p>
        <Transition name="fade">
          <div
            v-if="showInfo"
            class="absolute left-1/2 top-full z-40 mt-2 w-56 -translate-x-1/2 border border-border-default bg-bg-surface p-3 text-xs text-text-secondary shadow-xl"
          >
            <p class="mb-1 font-semibold text-text-primary">Tôi thấy... là gì?</p>
            <p>Chọn 1–5 emoji mô tả cảm xúc hôm nay của bạn, rồi ghim lên bảng chung.</p>
            <p class="mt-1.5">Mỗi người ghim một lần mỗi ngày — bảng reset mỗi sáng.</p>
          </div>
        </Transition>
      </div>
      <div class="w-8" />
    </div>

    <!-- Draggable corkboard -->
    <div
      class="absolute inset-0 top-[48px] select-none touch-none"
      :class="placingMode ? 'cursor-crosshair' : isDragging ? 'cursor-grabbing' : 'cursor-default'"
      @pointerdown="onBoardPointerDown"
      @pointermove="onBoardPointerMove"
      @pointerup="onBoardPointerUp"
      @pointercancel="onBoardPointerUp"
      @wheel.prevent="onBoardWheel"
    >
      <div
        class="absolute"
        :style="{
          width: `${CANVAS_SIZE}px`,
          height: `${CANVAS_SIZE}px`,
          transform: `translate(${boardOffset.x}px, ${boardOffset.y}px) scale(${scale})`,
          transformOrigin: '0 0',
          backgroundColor: '#1e3a5c',
          backgroundImage: `url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2224%22 height=%2224%22><rect width=%2224%22 height=%2224%22 fill=%22%231e3a5c%22/><circle cx=%2212%22 cy=%2212%22 r=%221.2%22 fill=%22rgba(255,255,255,0.12)%22/></svg>')`,
        }"
      >
        <div
          v-if="submissions.length === 0 && !placingMode"
          class="flex h-screen items-center justify-center"
        >
          <p class="text-sm text-white/50">Chưa có ai ghim — bạn là người đầu tiên!</p>
        </div>

        <!-- Sticky notes -->
        <div
          v-for="(s, i) in submissions"
          :key="s.id"
          class="absolute flex flex-col items-center justify-center p-2 shadow-lg"
          :style="[
            noteStyle(s),
            { width: `${NOTE_SIZE}px`, height: `${NOTE_SIZE}px`, zIndex: submissions.length - i },
          ]"
        >
          <div
            class="absolute -top-2 left-1/2 size-3 -translate-x-1/2 rounded-full bg-red-500 shadow-sm"
          />
          <div class="text-center text-xl leading-tight">{{ s.emojis }}</div>
          <div class="mt-1 text-[10px] text-black/40">{{ timeAgo(s.created_at) }}</div>
        </div>

        <!-- Ghost note (placing mode) — draggable -->
        <div
          v-if="placingMode"
          class="absolute flex flex-col items-center justify-center p-2 opacity-90 ring-2 ring-accent-coral"
          :class="isDraggingGhost ? 'cursor-grabbing' : 'cursor-grab'"
          :style="[ghostStyle(), { width: `${NOTE_SIZE}px`, height: `${NOTE_SIZE}px` }]"
          @pointerdown="onGhostPointerDown"
          @pointermove="onGhostPointerMove"
          @pointerup="onGhostPointerUp"
          @pointercancel="onGhostPointerUp"
        >
          <div
            class="absolute -top-2 left-1/2 size-3 -translate-x-1/2 rounded-full bg-red-400 shadow-sm"
          />
          <div class="text-center text-xl leading-tight">{{ selected.join('') }}</div>
        </div>
      </div>
    </div>

    <!-- Placing mode instruction -->
    <Transition name="fade">
      <div v-if="placingMode" class="absolute left-1/2 top-[60px] z-30 -translate-x-1/2">
        <div
          class="border border-border-default bg-bg-surface/95 px-4 py-2 text-xs text-text-primary shadow-xl backdrop-blur-sm"
        >
          Kéo ghi chú để đặt vị trí
        </div>
      </div>
    </Transition>

    <!-- Phone open tab (shown when phone is hidden and not placing) -->
    <button
      v-if="!phoneOpen && !placingMode"
      class="absolute bottom-4 left-1/2 z-30 -translate-x-1/2 flex items-center gap-1.5 border border-border-default bg-bg-surface/95 px-4 py-2 text-xs text-text-dim shadow-xl backdrop-blur-sm transition hover:text-text-primary"
      @click="openPhone"
    >
      <Icon icon="lucide:smartphone" class="size-3.5" />
      Ghim ghi chú
    </button>

    <!-- Fake phone UI -->
    <div
      class="absolute left-1/2 z-20 transition-transform duration-300 ease-out"
      :style="{
        bottom: 'env(safe-area-inset-bottom, 0px)',
        transform: `translateX(-50%) translateY(${phoneOpen ? '50%' : '100%'})`,
      }"
    >
      <div
        class="relative rounded-[2rem] bg-[#1c1c1e] shadow-2xl"
        style="width: 300px; height: 600px"
      >
        <!-- Volume buttons (left) -->
        <div class="absolute -left-1 top-[72px] h-7 w-1.5 rounded-l-sm bg-[#2a2a2a]" />
        <div class="absolute -left-1 top-[108px] h-7 w-1.5 rounded-l-sm bg-[#2a2a2a]" />
        <!-- Power button (right) -->
        <div class="absolute -right-1 top-[88px] h-10 w-1.5 rounded-r-sm bg-[#2a2a2a]" />

        <!-- Screen — height capped to visible top half (300px - 7px top inset - 7px bottom gap = 286px) -->
        <div
          class="absolute inset-x-[7px] top-[7px] h-[286px] flex flex-col overflow-hidden rounded-[1.5rem] bg-bg-deep"
        >
          <!-- Status bar -->
          <div class="relative flex shrink-0 items-center justify-center pt-2.5 pb-1">
            <button
              class="absolute left-3 text-text-dim transition hover:text-text-primary"
              @click="closePhone"
            >
              <Icon icon="lucide:chevron-down" class="size-4" />
            </button>
            <div class="h-[18px] w-16 rounded-full bg-black" />
          </div>

          <!-- Placing mode — confirm/cancel -->
          <template v-if="placingMode">
            <div class="flex flex-col items-center gap-3 px-4 pt-6">
              <div
                class="px-4 py-3 text-center text-2xl shadow-md"
                style="background: #fef08a; transform: rotate(-2deg)"
              >
                {{ selected.join('') }}
              </div>
              <p class="text-center text-xs text-text-dim">Kéo ghi chú trên bảng để đặt đúng chỗ</p>
              <button
                class="w-full border border-accent-coral bg-accent-coral/10 py-2 text-sm font-semibold text-accent-coral transition hover:bg-accent-coral hover:text-bg-deep disabled:opacity-40"
                :disabled="loading"
                @click="confirmPlacement"
              >
                {{ loading ? '...' : 'Xác nhận vị trí' }}
              </button>
              <button
                class="text-xs text-text-dim transition hover:text-text-primary"
                @click="cancelPlacingMode"
              >
                Huỷ
              </button>
            </div>
          </template>

          <!-- Picker — not yet submitted -->
          <template v-else-if="!hasSubmittedToday">
            <div class="flex flex-1 flex-col gap-1.5 overflow-hidden px-2 pb-1">
              <!-- 5 slots + delete -->
              <div class="flex shrink-0 gap-1">
                <button
                  v-for="i in 5"
                  :key="i"
                  class="flex h-8 flex-1 items-center justify-center border text-base transition-colors"
                  :class="
                    selected[i - 1]
                      ? 'border-accent-coral bg-bg-elevated'
                      : 'border-border-default bg-bg-elevated/40 text-text-dim'
                  "
                  @click="removeSlot(i - 1)"
                >
                  {{ selected[i - 1] ?? '·' }}
                </button>
                <button
                  class="shrink-0 border border-border-default bg-bg-elevated/40 px-2 text-text-dim transition hover:border-red-400 hover:text-red-400 disabled:opacity-30"
                  :disabled="selected.length === 0"
                  @click="removeLast"
                >
                  <Icon icon="lucide:delete" class="size-3.5" />
                </button>
              </div>

              <!-- Ghim button + hint -->
              <div class="relative shrink-0">
                <button
                  class="w-full border border-accent-coral bg-accent-coral/10 py-1 text-xs font-semibold text-accent-coral transition hover:bg-accent-coral hover:text-bg-deep disabled:opacity-40"
                  :disabled="loading"
                  @click="enterPlacingMode"
                >
                  {{ loading ? '...' : 'Ghim lên bảng' }}
                </button>
                <Transition name="fade">
                  <div
                    v-if="showEmptyHint"
                    class="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap border border-border-default bg-bg-surface px-2 py-1 text-[10px] text-text-primary shadow"
                  >
                    Chọn ít nhất 1 emoji nhé!
                  </div>
                </Transition>
              </div>

              <!-- Category tabs -->
              <div
                class="flex shrink-0 gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none]"
              >
                <button
                  v-for="cat in Object.keys(emojiCategories)"
                  :key="cat"
                  class="shrink-0 border px-1.5 py-0.5 text-[10px] transition-colors"
                  :class="
                    activeCategory === cat
                      ? 'border-accent-coral bg-accent-coral text-bg-deep'
                      : 'border-border-default text-text-dim'
                  "
                  @click="setCategory(cat)"
                >
                  {{ CATEGORY_VI[cat] ?? cat }}
                </button>
              </div>

              <!-- Emoji grid — scrollable -->
              <div class="flex-1 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none]">
                <div class="grid grid-cols-8 gap-px pb-4">
                  <button
                    v-for="emoji in emojiCategories[activeCategory]"
                    :key="emoji"
                    class="flex aspect-square items-center justify-center text-lg transition-all"
                    :class="
                      selected.includes(emoji)
                        ? 'bg-accent-coral/20 ring-1 ring-accent-coral/60'
                        : 'hover:bg-bg-elevated'
                    "
                    @click="toggleEmoji(emoji)"
                  >
                    {{ emoji }}
                  </button>
                </div>
              </div>

              <p v-if="fetchError" class="shrink-0 text-center text-[10px] text-red-400">
                {{ fetchError }}
              </p>
            </div>
          </template>

          <!-- Already submitted — content in top half (bottom half hidden behind screen edge) -->
          <template v-else>
            <div class="flex flex-col items-center gap-3 px-4 pt-6">
              <div
                class="px-4 py-3 text-center text-2xl shadow-md"
                style="background: #fef08a; transform: rotate(-2deg)"
              >
                {{ savedEmojis }}
              </div>
              <p class="text-sm font-semibold text-text-primary">Hôm nay bạn đã ghim ✓</p>
              <p class="text-xs text-text-dim">{{ submissions.length }} người đã ghim hôm nay</p>
            </div>
          </template>

          <!-- Home bar -->
          <div class="flex shrink-0 justify-center py-2">
            <div class="h-1 w-16 rounded-full bg-text-dim/30" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
