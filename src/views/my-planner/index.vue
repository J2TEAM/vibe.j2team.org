<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { useLocalStorage, useIntervalFn } from '@vueuse/core'
import { toPng } from 'html-to-image'
import { Icon } from '@iconify/vue'

// ─── Types ───────────────────────────────────────────────────────────────────
interface Subtask {
  id: string
  text: string
  completed: boolean
  completedAt?: string
  createdAt: string
}

interface Task {
  id: string
  text: string
  completed: boolean // only for tasks with no subtasks
  completedAt?: string
  subtasks: Subtask[]
  expanded: boolean
  createdAt: string
}

interface DayData {
  tasks: Task[]
  commitment: string
}

type Tab = 'today' | 'history'
type HistoryFilter = 'week' | 'month' | 'all'

// ─── Constants ───────────────────────────────────────────────────────────────
const RADIUS = 54
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const CONFETTI_COLORS = ['#FF6B4A', '#FFB830', '#38BDF8', '#F0EDE6', '#FF6B4A', '#FFB830']
const VN_DAYS = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy']

// ─── UI State ────────────────────────────────────────────────────────────────
const activeTab = ref<Tab>('today')
const newTaskText = ref('')
const editingTaskId = ref<string | null>(null)
const editingText = ref('')
const addingSubtaskForId = ref<string | null>(null)
const newSubtaskText = ref('')
const showCompleted = ref(false)
const showShareModal = ref(false)
const isGenerating = ref(false)
const showCelebration = ref(false)
const copiedUrl = ref(false)
const historyFilter = ref<HistoryFilter>('week')
const shareCardRef = ref<HTMLElement | null>(null)
const addInputRef = ref<HTMLInputElement | null>(null)
const draggingId = ref<string | null>(null)
const dragOverId = ref<string | null>(null)
const dragOverPosition = ref<'before' | 'after'>('before')
const expandedTextIds = ref<string[]>([])

// Timer state
const TIMER_R = 40
const TIMER_C = 2 * Math.PI * TIMER_R
const timerTotal = ref(25 * 60) // seconds
const timerRemaining = ref(25 * 60)
const timerTaskIds = ref<Set<string>>(new Set())
const showTimerDone = ref(false)
const timerMinInput = ref(25)
const timerSecInput = ref(0)

// ─── Storage ─────────────────────────────────────────────────────────────────
const storage = useLocalStorage<{
  days: Record<string, DayData>
  streak: { current: number; lastDate: string; best: number }
}>('my-planner-v3', {
  days: {},
  streak: { current: 0, lastDate: '', best: 0 },
})

// ─── Date Helpers ─────────────────────────────────────────────────────────────
function getDayKey() {
  return new Date().toISOString().slice(0, 10)
}

function ensureDay(key: string): DayData {
  if (!storage.value.days[key]) {
    storage.value.days[key] = { tasks: [], commitment: '' }
  }
  return storage.value.days[key]!
}

const todayKey = computed(() => getDayKey())
const todayData = computed(() => ensureDay(todayKey.value))
const tasks = computed(() => todayData.value.tasks)

const commitment = computed({
  get: () => todayData.value.commitment,
  set: (v: string) => {
    todayData.value.commitment = v
  },
})

// ─── Task Helpers ─────────────────────────────────────────────────────────────
function isTaskDone(task: Task): boolean {
  if (task.subtasks.length === 0) return task.completed
  return task.subtasks.length > 0 && task.subtasks.every((s) => s.completed)
}

function taskProgress(task: Task): { done: number; total: number } {
  if (task.subtasks.length === 0) return { done: task.completed ? 1 : 0, total: 1 }
  return {
    done: task.subtasks.filter((s) => s.completed).length,
    total: task.subtasks.length,
  }
}

// ─── Today Stats ──────────────────────────────────────────────────────────────
const activeTasks = computed(() => tasks.value.filter((t) => !isTaskDone(t)))
const completedTasks = computed(() => tasks.value.filter((t) => isTaskDone(t)))
const totalCount = computed(() => tasks.value.length)
const completedCount = computed(() => completedTasks.value.length)
const isComplete = computed(() => totalCount.value > 0 && completedCount.value === totalCount.value)

const percentage = computed(() => {
  let total = 0
  let done = 0
  for (const task of tasks.value) {
    const p = taskProgress(task)
    total += p.total
    done += p.done
  }
  return total === 0 ? 0 : Math.round((done / total) * 100)
})

const strokeDashoffset = computed(() => CIRCUMFERENCE - (percentage.value / 100) * CIRCUMFERENCE)
const progressColor = computed(() => (isComplete.value ? '#FFB830' : '#FF6B4A'))

// ─── Streak ───────────────────────────────────────────────────────────────────
function updateStreak() {
  const today = getDayKey()
  const s = storage.value.streak
  if (s.lastDate === today) return
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  s.current = s.lastDate === yesterday.toISOString().slice(0, 10) ? s.current + 1 : 1
  s.lastDate = today
  s.best = Math.max(s.current, s.best)
}

watch(isComplete, (newVal, oldVal) => {
  if (newVal && !oldVal) {
    showCelebration.value = true
    setTimeout(() => {
      showCelebration.value = false
    }, 3500)
    updateStreak()
  }
})

// ─── Task Actions ─────────────────────────────────────────────────────────────
function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

function addTask() {
  const text = newTaskText.value.trim()
  if (!text) return
  todayData.value.tasks.push({
    id: genId(),
    text,
    completed: false,
    subtasks: [],
    expanded: false,
    createdAt: new Date().toISOString(),
  })
  newTaskText.value = ''
  nextTick(() => addInputRef.value?.focus())
}

function toggleTask(id: string) {
  const task = tasks.value.find((t) => t.id === id)
  if (!task || task.subtasks.length !== 0) return
  task.completed = !task.completed
  task.completedAt = task.completed ? new Date().toISOString() : undefined
}

function deleteTask(id: string) {
  const idx = tasks.value.findIndex((t) => t.id === id)
  if (idx !== -1) tasks.value.splice(idx, 1)
}

function toggleExpanded(id: string) {
  const task = tasks.value.find((t) => t.id === id)
  if (task) task.expanded = !task.expanded
}

function toggleAllSubtasks(taskId: string) {
  const task = tasks.value.find((t) => t.id === taskId)
  if (!task || task.subtasks.length === 0) return
  const allDone = task.subtasks.every((s) => s.completed)
  const now = new Date().toISOString()
  for (const sub of task.subtasks) {
    sub.completed = !allDone
    sub.completedAt = !allDone ? now : undefined
  }
  task.completedAt = !allDone ? now : undefined
}

function toggleTextExpand(id: string) {
  const idx = expandedTextIds.value.indexOf(id)
  if (idx === -1) {
    expandedTextIds.value.push(id)
  } else {
    expandedTextIds.value.splice(idx, 1)
  }
}

function startEditTask(task: Task) {
  editingTaskId.value = task.id
  editingText.value = task.text
  nextTick(() => document.querySelector<HTMLInputElement>('.task-edit-input')?.focus())
}

function confirmEditTask(id: string) {
  const text = editingText.value.trim()
  if (text) {
    const task = tasks.value.find((t) => t.id === id)
    if (task) task.text = text
  }
  editingTaskId.value = null
}

function cancelEditTask() {
  editingTaskId.value = null
}

// ─── Subtask Actions ──────────────────────────────────────────────────────────
function startAddSubtask(taskId: string) {
  addingSubtaskForId.value = taskId
  newSubtaskText.value = ''
  const task = tasks.value.find((t) => t.id === taskId)
  if (task) task.expanded = true
  nextTick(() => document.querySelector<HTMLInputElement>('.subtask-add-input')?.focus())
}

function confirmAddSubtask(taskId: string) {
  const text = newSubtaskText.value.trim()
  if (text) {
    const task = tasks.value.find((t) => t.id === taskId)
    if (task) {
      task.subtasks.push({
        id: genId(),
        text,
        completed: false,
        createdAt: new Date().toISOString(),
      })
    }
  }
  addingSubtaskForId.value = null
  newSubtaskText.value = ''
}

function cancelAddSubtask() {
  addingSubtaskForId.value = null
  newSubtaskText.value = ''
}

function toggleSubtask(taskId: string, subtaskId: string) {
  const task = tasks.value.find((t) => t.id === taskId)
  if (!task) return
  const sub = task.subtasks.find((s) => s.id === subtaskId)
  if (!sub) return
  sub.completed = !sub.completed
  sub.completedAt = sub.completed ? new Date().toISOString() : undefined
  if (task.subtasks.every((s) => s.completed)) {
    task.completedAt = new Date().toISOString()
  } else {
    task.completedAt = undefined
  }
}

function deleteSubtask(taskId: string, subtaskId: string) {
  const task = tasks.value.find((t) => t.id === taskId)
  if (!task) return
  const idx = task.subtasks.findIndex((s) => s.id === subtaskId)
  if (idx !== -1) task.subtasks.splice(idx, 1)
}

// ─── Focus Timer ──────────────────────────────────────────────────────────────
const timerDisplay = computed(() => {
  const m = Math.floor(timerRemaining.value / 60)
  const s = timerRemaining.value % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

const timerStrokeDashoffset = computed(() =>
  timerTotal.value === 0 ? TIMER_C : TIMER_C * (1 - timerRemaining.value / timerTotal.value),
)

function onTimerComplete() {
  const now = new Date().toISOString()
  for (const taskId of timerTaskIds.value) {
    const task = tasks.value.find((t) => t.id === taskId)
    if (!task) continue
    if (task.subtasks.length === 0) {
      task.completed = true
      task.completedAt = now
    } else {
      for (const sub of task.subtasks) {
        sub.completed = true
        sub.completedAt = now
      }
      task.completedAt = now
    }
  }
  showTimerDone.value = true
  setTimeout(() => {
    showTimerDone.value = false
  }, 4000)
}

const {
  pause: pauseTimer,
  resume: startTimer,
  isActive: timerRunning,
} = useIntervalFn(
  () => {
    if (timerRemaining.value <= 1) {
      timerRemaining.value = 0
      pauseTimer()
      onTimerComplete()
      return
    }
    timerRemaining.value -= 1
  },
  1000,
  { immediate: false },
)

function setTimerPreset(minutes: number) {
  if (timerRunning.value) pauseTimer()
  timerTotal.value = minutes * 60
  timerRemaining.value = minutes * 60
  timerMinInput.value = minutes
  timerSecInput.value = 0
}

function applyCustomTimer() {
  if (timerRunning.value) pauseTimer()
  const total = timerMinInput.value * 60 + timerSecInput.value
  if (total <= 0) return
  timerTotal.value = total
  timerRemaining.value = total
}

function toggleTimer() {
  if (timerRemaining.value === 0) {
    timerRemaining.value = timerTotal.value
  }
  if (timerRunning.value) {
    pauseTimer()
  } else {
    startTimer()
  }
}

function resetTimer() {
  pauseTimer()
  timerRemaining.value = timerTotal.value
}

function toggleTimerTask(taskId: string) {
  const next = new Set(timerTaskIds.value)
  if (next.has(taskId)) {
    next.delete(taskId)
  } else {
    next.add(taskId)
  }
  timerTaskIds.value = next
}

// Remove task from timer if deleted
watch(activeTasks, (newTasks) => {
  const ids = new Set(newTasks.map((t) => t.id))
  const next = new Set([...timerTaskIds.value].filter((id) => ids.has(id)))
  if (next.size !== timerTaskIds.value.size) timerTaskIds.value = next
})

// ─── Drag & Drop ─────────────────────────────────────────────────────────────
function onDragStart(e: DragEvent, id: string) {
  draggingId.value = id
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
  }
}

function onDragOver(e: DragEvent, id: string) {
  e.preventDefault()
  if (draggingId.value === id) return
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  dragOverPosition.value = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after'
  dragOverId.value = id
}

function onDragLeave(e: DragEvent) {
  const related = e.relatedTarget as HTMLElement | null
  if (!related || !(e.currentTarget as HTMLElement).contains(related)) dragOverId.value = null
}

function onDrop(e: DragEvent, targetId: string) {
  e.preventDefault()
  const fromId = draggingId.value
  if (!fromId || fromId === targetId) {
    draggingId.value = null
    dragOverId.value = null
    return
  }
  const list = todayData.value.tasks
  const fromIdx = list.findIndex((t) => t.id === fromId)
  let toIdx = list.findIndex((t) => t.id === targetId)
  if (fromIdx === -1 || toIdx === -1) {
    draggingId.value = null
    dragOverId.value = null
    return
  }
  const removed = list.splice(fromIdx, 1)
  const item = removed[0]
  if (!item) return
  toIdx = list.findIndex((t) => t.id === targetId)
  list.splice(dragOverPosition.value === 'after' ? toIdx + 1 : toIdx, 0, item)
  draggingId.value = null
  dragOverId.value = null
}

function onDragEnd() {
  draggingId.value = null
  dragOverId.value = null
}

// ─── History ──────────────────────────────────────────────────────────────────
const historyDays = computed(() => {
  const today = getDayKey()
  const now = new Date()

  return Object.entries(storage.value.days)
    .filter(([key, data]) => {
      // Filter by period
      if (historyFilter.value === 'week') {
        const weekAgo = new Date(now)
        weekAgo.setDate(now.getDate() - 6)
        if (key < weekAgo.toISOString().slice(0, 10)) return false
      } else if (historyFilter.value === 'month') {
        if (!key.startsWith(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`))
          return false
      }
      // Only days that have at least 1 completed task
      return data.tasks.some((t) => isTaskDone(t))
    })
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, data]) => {
      const date = new Date(key + 'T00:00:00')
      const isToday = key === today
      const dateLabel = isToday
        ? 'Hôm nay'
        : `${VN_DAYS[date.getDay()] ?? ''}, ${date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' })}`
      return {
        key,
        dateLabel,
        isToday,
        completedTasks: data.tasks.filter((t) => isTaskDone(t)),
      }
    })
})

const historyTotalCompleted = computed(() =>
  historyDays.value.reduce((sum, d) => sum + d.completedTasks.length, 0),
)

function formatTime(iso?: string): string {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

// ─── Share ────────────────────────────────────────────────────────────────────
async function downloadCard() {
  if (!shareCardRef.value) return
  isGenerating.value = true
  try {
    const dataUrl = await toPng(shareCardRef.value, { pixelRatio: 2, backgroundColor: '#0F1923' })
    const link = document.createElement('a')
    link.download = `planner-${todayKey.value}.png`
    link.href = dataUrl
    link.click()
  } catch (e) {
    console.error(e)
  } finally {
    isGenerating.value = false
  }
}

// Strip heavy fields before encoding to keep URL short
interface ShareTask {
  i: string
  t: string
  c: boolean
  s: Array<{ i: string; t: string; c: boolean }>
}
interface SharePayload {
  key: string
  commitment: string
  tasks: ShareTask[]
}

function buildSharePayload(): SharePayload {
  return {
    key: todayKey.value,
    commitment: commitment.value,
    tasks: tasks.value.map((task) => ({
      i: task.id,
      t: task.text,
      c: task.completed,
      s: task.subtasks.map((sub) => ({ i: sub.id, t: sub.text, c: sub.completed })),
    })),
  }
}

function restoreFromShare(payload: SharePayload): Task[] {
  const now = new Date().toISOString()
  return payload.tasks.map((t) => ({
    id: t.i,
    text: t.t,
    completed: t.c,
    subtasks: t.s.map((s) => ({ id: s.i, text: s.t, completed: s.c, createdAt: now })),
    expanded: false,
    createdAt: now,
  }))
}

async function copyShareUrl() {
  const encoded = btoa(encodeURIComponent(JSON.stringify(buildSharePayload())))
  const url = `${window.location.origin}${window.location.pathname}?share=${encoded}`
  const shareData = {
    title: 'My Planner',
    text: `Kế hoạch hôm nay: ${completedCount.value}/${totalCount.value} việc (${percentage.value}%)`,
    url,
  }
  // Mobile: native share sheet (Zalo, Messenger, etc.)
  if (navigator.canShare?.(shareData)) {
    try {
      await navigator.share(shareData)
      return
    } catch (e) {
      if ((e as Error).name === 'AbortError') return
    }
  }
  // Desktop: copy to clipboard
  await navigator.clipboard.writeText(url)
  copiedUrl.value = true
  setTimeout(() => {
    copiedUrl.value = false
  }, 2000)
}

function checkUrlImport() {
  const params = new URLSearchParams(window.location.search)
  const encoded = params.get('share')
  if (!encoded) return
  try {
    const payload = JSON.parse(decodeURIComponent(atob(encoded))) as SharePayload
    if (confirm('Nhập danh sách được chia sẻ vào hôm nay?')) {
      const day = ensureDay(payload.key)
      day.tasks = restoreFromShare(payload)
      day.commitment = payload.commitment
    }
  } catch {
    /* ignore */
  }
  history.replaceState(null, '', window.location.pathname)
}

// ─── Confetti ─────────────────────────────────────────────────────────────────
function confettiStyle(i: number) {
  const color = CONFETTI_COLORS[(i - 1) % CONFETTI_COLORS.length]!
  const size = 6 + ((i * 3) % 10)
  return {
    left: `${((i - 1) / 24) * 100}%`,
    top: '-16px',
    width: `${size}px`,
    height: `${size}px`,
    backgroundColor: color,
    animationDelay: `${((i - 1) % 6) * 0.12}s`,
    animationDuration: `${2.5 + (i % 4) * 0.4}s`,
    borderRadius: i % 3 === 0 ? '50%' : '2px',
  }
}

checkUrlImport()
</script>

<template>
  <div
    class="min-h-screen bg-bg-deep text-text-primary pb-16 overflow-x-hidden w-full max-w-[100vw]"
  >
    <!-- Celebration overlay -->
    <div v-if="showCelebration" class="celebration-overlay" aria-hidden="true">
      <div v-for="i in 25" :key="i" class="confetti" :style="confettiStyle(i)" />
    </div>

    <div class="max-w-5xl mx-auto px-6 py-8 md:py-12 overflow-hidden">
      <!-- Header -->
      <header class="flex items-start justify-between gap-4 mb-8 animate-fade-up">
        <div>
          <div class="flex items-center gap-2 mb-2">
            <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
            <RouterLink
              to="/"
              class="text-text-dim text-xs hover:text-text-secondary transition font-display tracking-widest"
            >
              TRANG CHỦ
            </RouterLink>
          </div>
          <h1 class="font-display text-4xl md:text-5xl font-bold tracking-tight">My Planner</h1>
          <p class="text-text-secondary text-sm mt-1.5">Kế hoạch · Theo dõi · Hoàn thành</p>
        </div>

        <!-- Streak badge -->
        <div
          class="border bg-bg-surface px-4 py-3 text-center shrink-0 min-w-20 transition-colors duration-500"
          :class="storage.streak.current > 0 ? 'border-accent-coral/50' : 'border-border-default'"
        >
          <div class="flex items-center justify-center gap-1">
            <Icon
              icon="lucide:flame"
              class="size-5 transition-colors"
              :class="storage.streak.current > 0 ? 'text-accent-coral' : 'text-text-dim'"
            />
            <span
              class="font-display text-3xl font-bold leading-none"
              :class="storage.streak.current > 0 ? 'text-accent-coral' : 'text-text-dim'"
            >
              {{ storage.streak.current }}
            </span>
          </div>
          <p class="text-text-dim text-xs font-display tracking-widest mt-1">STREAK</p>
          <p class="text-text-dim text-xs mt-0.5">Kỷ lục: {{ storage.streak.best }}</p>
        </div>
      </header>

      <!-- Tabs -->
      <div
        class="flex border border-border-default bg-bg-surface mb-6 animate-fade-up animate-delay-1"
      >
        <button
          v-for="tab in ['today', 'history'] as Tab[]"
          :key="tab"
          class="flex-1 py-3 text-sm font-display tracking-wide transition-all relative flex items-center justify-center gap-2"
          :class="
            activeTab === tab
              ? 'text-text-primary bg-bg-elevated'
              : 'text-text-dim hover:text-text-secondary hover:bg-bg-elevated/30'
          "
          @click="activeTab = tab"
        >
          <Icon
            :icon="tab === 'today' ? 'lucide:calendar-check' : 'lucide:history'"
            class="size-3.5"
          />
          {{ tab === 'today' ? 'Hôm nay' : 'Lịch sử' }}
          <div
            v-if="activeTab === tab"
            class="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-coral"
          />
        </button>
      </div>

      <!-- ═══ TAB: HÔM NAY ═══ -->
      <div
        v-if="activeTab === 'today'"
        class="grid gap-5 lg:grid-cols-[300px_1fr] animate-fade-up animate-delay-2 overflow-hidden"
      >
        <!-- Left panel -->
        <div class="flex flex-col gap-4">
          <!-- Progress ring -->
          <div
            class="border bg-bg-surface p-6 text-center transition-colors duration-700"
            :class="isComplete ? 'border-accent-amber' : 'border-border-default'"
          >
            <div class="relative inline-flex items-center justify-center">
              <svg width="148" height="148" viewBox="0 0 148 148" class="-rotate-90">
                <circle
                  cx="74"
                  cy="74"
                  :r="RADIUS"
                  fill="none"
                  stroke="#253549"
                  stroke-width="10"
                />
                <circle
                  cx="74"
                  cy="74"
                  :r="RADIUS"
                  fill="none"
                  :stroke="progressColor"
                  stroke-width="10"
                  :stroke-dasharray="CIRCUMFERENCE"
                  :stroke-dashoffset="strokeDashoffset"
                  class="ring-progress"
                />
              </svg>
              <div class="absolute flex flex-col items-center">
                <span
                  class="font-display text-4xl font-bold transition-colors duration-500"
                  :class="isComplete ? 'text-accent-amber' : 'text-text-primary'"
                >
                  {{ percentage }}%
                </span>
                <span class="text-text-dim text-xs">hôm nay</span>
              </div>
            </div>
            <p class="text-text-secondary text-sm mt-3">
              <span class="font-semibold text-text-primary">{{ completedCount }}</span>
              / {{ totalCount }} việc
            </p>
            <p class="text-text-dim text-xs mt-1 capitalize">
              {{
                new Date().toLocaleDateString('vi-VN', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })
              }}
            </p>
            <Transition name="complete-badge">
              <div
                v-if="isComplete"
                class="mt-3 font-display text-xs tracking-widest text-accent-amber"
              >
                ✦ HOÀN THÀNH ✦
              </div>
            </Transition>
          </div>

          <!-- Focus Timer -->
          <div
            class="border bg-bg-surface p-4 transition-colors duration-500"
            :class="
              showTimerDone
                ? 'border-accent-amber'
                : timerRunning
                  ? 'border-accent-sky/50'
                  : 'border-border-default'
            "
          >
            <div class="flex items-center justify-between mb-3">
              <p class="text-xs font-display tracking-widest text-accent-sky">// FOCUS TIMER</p>
              <Transition name="complete-badge">
                <span
                  v-if="showTimerDone"
                  class="text-xs font-display text-accent-amber tracking-widest"
                  >✦ HẾT GIỜ ✦</span
                >
              </Transition>
            </div>

            <!-- Ring + time display -->
            <div class="flex items-center gap-4 mb-3">
              <div class="relative shrink-0 inline-flex items-center justify-center">
                <svg width="96" height="96" viewBox="0 0 96 96" class="-rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    :r="TIMER_R"
                    fill="none"
                    stroke="#253549"
                    stroke-width="6"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    :r="TIMER_R"
                    fill="none"
                    :stroke="showTimerDone ? '#FFB830' : timerRunning ? '#38BDF8' : '#FF6B4A'"
                    stroke-width="6"
                    :stroke-dasharray="TIMER_C"
                    :stroke-dashoffset="timerStrokeDashoffset"
                    class="timer-ring-progress"
                  />
                </svg>
                <span
                  class="absolute font-display text-lg font-bold text-text-primary tabular-nums"
                >
                  {{ timerDisplay }}
                </span>
              </div>

              <!-- Preset buttons + custom input -->
              <div class="flex-1 min-w-0 space-y-2">
                <div class="flex gap-1 flex-wrap">
                  <button
                    v-for="m in [5, 15, 25, 45]"
                    :key="m"
                    class="px-2 py-1 text-xs font-display border transition-all"
                    :class="
                      timerTotal === m * 60 && timerRemaining === timerTotal
                        ? 'border-accent-sky text-accent-sky bg-accent-sky/10'
                        : 'border-border-default text-text-dim hover:border-accent-sky hover:text-accent-sky'
                    "
                    @click="setTimerPreset(m)"
                  >
                    {{ m }}'
                  </button>
                </div>
                <div class="flex items-center gap-1">
                  <input
                    type="number"
                    v-model.number="timerMinInput"
                    min="0"
                    max="99"
                    class="w-12 bg-bg-deep border border-border-default px-2 py-1 text-xs text-center text-text-primary outline-none focus:border-accent-sky tabular-nums"
                    @change="applyCustomTimer"
                  />
                  <span class="text-text-dim text-xs">:</span>
                  <input
                    type="number"
                    v-model.number="timerSecInput"
                    min="0"
                    max="59"
                    class="w-12 bg-bg-deep border border-border-default px-2 py-1 text-xs text-center text-text-primary outline-none focus:border-accent-sky tabular-nums"
                    @change="applyCustomTimer"
                  />
                  <span class="text-text-dim text-xs">mm:ss</span>
                </div>
              </div>
            </div>

            <!-- Controls -->
            <div class="flex gap-2 mb-3">
              <button
                class="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-display tracking-wide border transition-all"
                :class="
                  timerRunning
                    ? 'border-accent-sky text-accent-sky hover:bg-accent-sky/10'
                    : 'border-accent-coral text-accent-coral hover:bg-accent-coral/10'
                "
                @click="toggleTimer"
              >
                <Icon :icon="timerRunning ? 'lucide:pause' : 'lucide:play'" class="size-3.5" />
                {{
                  timerRunning
                    ? 'Tạm dừng'
                    : timerRemaining < timerTotal && timerRemaining > 0
                      ? 'Tiếp tục'
                      : 'Bắt đầu'
                }}
              </button>
              <button
                class="border border-border-default text-text-dim hover:text-text-primary hover:border-border-default px-3 py-2 text-xs transition-all"
                @click="resetTimer"
              >
                <Icon icon="lucide:rotate-ccw" class="size-3.5" />
              </button>
            </div>

            <!-- Task mapping -->
            <div v-if="activeTasks.length > 0">
              <p class="text-xs text-text-dim mb-2 flex items-center gap-1">
                <Icon icon="lucide:link" class="size-3" />
                Gắn task — tự hoàn thành khi hết giờ
              </p>
              <div class="space-y-1.5 max-h-32 overflow-y-auto timer-task-list">
                <label
                  v-for="task in activeTasks"
                  :key="task.id"
                  class="flex items-center gap-2 cursor-pointer group/timer"
                >
                  <button
                    class="size-4 border-2 shrink-0 flex items-center justify-center transition-all"
                    :class="
                      timerTaskIds.has(task.id)
                        ? 'border-accent-sky bg-accent-sky'
                        : 'border-border-default group-hover/timer:border-accent-sky'
                    "
                    @click="toggleTimerTask(task.id)"
                  >
                    <Icon
                      v-if="timerTaskIds.has(task.id)"
                      icon="lucide:check"
                      class="size-2.5 text-bg-deep"
                    />
                  </button>
                  <span
                    class="text-xs text-text-secondary truncate flex-1 group-hover/timer:text-text-primary transition-colors"
                    :title="task.text"
                  >
                    {{ task.text }}
                  </span>
                </label>
              </div>
            </div>
            <p v-else-if="tasks.length > 0" class="text-xs text-text-dim italic">
              Tất cả task đã hoàn thành!
            </p>
          </div>

          <!-- Share actions -->
          <div class="grid grid-cols-2 gap-2">
            <button
              class="border border-border-default bg-bg-surface px-3 py-2.5 text-xs font-display tracking-wide text-text-secondary hover:border-accent-coral hover:text-text-primary transition-all flex items-center justify-center gap-1.5"
              @click="showShareModal = true"
            >
              <Icon icon="lucide:image" class="size-3.5" /> Lưu ảnh
            </button>
            <button
              class="border px-3 py-2.5 text-xs font-display tracking-wide transition-all flex items-center justify-center gap-1.5"
              :class="
                copiedUrl
                  ? 'border-accent-sky text-accent-sky bg-accent-sky/5'
                  : 'border-border-default bg-bg-surface text-text-secondary hover:border-accent-sky hover:text-text-primary'
              "
              @click="copyShareUrl"
            >
              <Icon :icon="copiedUrl ? 'lucide:check' : 'lucide:share-2'" class="size-3.5" />
              {{ copiedUrl ? 'Đã sao chép!' : 'Chia sẻ' }}
            </button>
          </div>

          <RouterLink
            to="/"
            class="hidden lg:inline-flex items-center gap-2 border border-border-default bg-bg-surface px-5 py-2.5 text-sm text-text-secondary transition-all hover:border-accent-coral hover:text-text-primary"
          >
            ← Về trang chủ
          </RouterLink>
        </div>

        <!-- Right panel -->
        <div
          class="border border-border-default bg-bg-surface flex flex-col min-w-0 overflow-hidden"
        >
          <!-- Header -->
          <div
            class="px-5 py-4 border-b border-border-default flex items-center justify-between shrink-0"
          >
            <span class="font-display text-xs tracking-widest text-text-dim">// VIỆC CẦN LÀM</span>
            <span class="text-xs text-text-dim hidden sm:flex items-center gap-1">
              <Icon icon="lucide:grip-vertical" class="size-3" /> Kéo để sắp xếp · Nhấp để mở rộng
            </span>
          </div>

          <!-- Active tasks -->
          <div class="flex-1 overflow-y-auto task-list-area">
            <!-- Empty state -->
            <div
              v-if="tasks.length === 0"
              class="flex flex-col items-center justify-center py-16 px-6 text-center"
            >
              <p class="text-5xl mb-4 select-none">📋</p>
              <p class="text-text-secondary text-sm font-display">Chưa có việc gì cả!</p>
              <p class="text-text-dim text-xs mt-1">Thêm công việc đầu tiên phía dưới.</p>
            </div>

            <!-- Active task list -->
            <TransitionGroup
              v-if="activeTasks.length > 0"
              name="task-item"
              tag="div"
              class="relative divide-y divide-border-default"
            >
              <div
                v-for="task in activeTasks"
                :key="task.id"
                class="task-row-wrapper overflow-hidden"
                :class="{
                  'opacity-40': draggingId === task.id,
                  'drop-before': dragOverId === task.id && dragOverPosition === 'before',
                  'drop-after': dragOverId === task.id && dragOverPosition === 'after',
                }"
                draggable="true"
                @dragstart="onDragStart($event, task.id)"
                @dragover="onDragOver($event, task.id)"
                @dragleave="onDragLeave"
                @drop="onDrop($event, task.id)"
                @dragend="onDragEnd"
              >
                <div
                  class="group flex items-center gap-2 px-4 py-3 hover:bg-bg-elevated transition-colors min-w-0"
                >
                  <span
                    class="hidden sm:inline-flex shrink-0 text-text-dim hover:text-text-secondary cursor-grab active:cursor-grabbing"
                  >
                    <Icon icon="lucide:grip-vertical" class="size-4" />
                  </span>

                  <!-- Checkbox (no subtasks) -->
                  <button
                    v-if="task.subtasks.length === 0"
                    class="size-5 border-2 shrink-0 flex items-center justify-center transition-all duration-200"
                    :class="
                      task.completed
                        ? 'border-accent-coral bg-accent-coral'
                        : 'border-border-default hover:border-accent-coral'
                    "
                    @click="toggleTask(task.id)"
                  >
                    <Transition name="check-icon">
                      <Icon v-if="task.completed" icon="lucide:check" class="size-3 text-white" />
                    </Transition>
                  </button>

                  <!-- Mini ring (has subtasks) — click to check/uncheck all -->
                  <button v-else class="shrink-0" @click="toggleAllSubtasks(task.id)">
                    <svg width="22" height="22" viewBox="0 0 22 22" class="-rotate-90">
                      <circle cx="11" cy="11" r="8" fill="none" stroke="#253549" stroke-width="3" />
                      <circle
                        cx="11"
                        cy="11"
                        r="8"
                        fill="none"
                        :stroke="isTaskDone(task) ? '#FFB830' : '#FF6B4A'"
                        stroke-width="3"
                        :stroke-dasharray="`${2 * Math.PI * 8}`"
                        :stroke-dashoffset="`${2 * Math.PI * 8 * (1 - taskProgress(task).done / taskProgress(task).total)}`"
                        class="mini-ring-progress"
                      />
                    </svg>
                  </button>

                  <!-- Task text -->
                  <div class="flex-1 min-w-0 overflow-hidden w-0">
                    <div v-if="task.subtasks.length > 0" class="mb-0.5">
                      <div class="flex items-center gap-1.5 min-w-0 overflow-hidden">
                        <p
                          v-if="editingTaskId !== task.id"
                          class="text-sm leading-relaxed flex-1 min-w-0 transition-all duration-200"
                          :class="
                            expandedTextIds.includes(task.id)
                              ? 'text-expanded cursor-text'
                              : 'truncate cursor-pointer'
                          "
                          :title="task.text"
                          @click.stop="toggleTextExpand(task.id)"
                          @dblclick="startEditTask(task)"
                        >
                          {{ task.text }}
                        </p>
                        <input
                          v-else
                          class="task-edit-input flex-1 min-w-0 w-0 bg-bg-deep border border-accent-coral px-2 py-0.5 text-sm text-text-primary outline-none"
                          v-model="editingText"
                          @keydown.enter="confirmEditTask(task.id)"
                          @keydown.escape="cancelEditTask"
                          @blur="confirmEditTask(task.id)"
                        />
                        <span
                          class="shrink-0 text-xs font-display font-semibold tabular-nums text-accent-coral"
                        >
                          {{ taskProgress(task).done }}/{{ taskProgress(task).total }}
                        </span>
                      </div>
                      <div class="h-0.5 bg-bg-elevated mt-1.5 overflow-hidden">
                        <div
                          class="h-full bg-accent-coral transition-all duration-500"
                          :style="{
                            width: `${(taskProgress(task).done / taskProgress(task).total) * 100}%`,
                          }"
                        />
                      </div>
                    </div>
                    <div v-else class="min-w-0 overflow-hidden">
                      <p
                        v-if="editingTaskId !== task.id"
                        class="text-sm leading-relaxed text-text-primary transition-all duration-200"
                        :class="
                          expandedTextIds.includes(task.id)
                            ? 'text-expanded cursor-text'
                            : 'truncate cursor-pointer'
                        "
                        :title="task.text"
                        @click.stop="toggleTextExpand(task.id)"
                        @dblclick="startEditTask(task)"
                      >
                        {{ task.text }}
                      </p>
                      <input
                        v-else
                        class="task-edit-input w-full min-w-0 max-w-full bg-bg-deep border border-accent-coral px-2 py-0.5 text-sm text-text-primary outline-none"
                        v-model="editingText"
                        @keydown.enter="confirmEditTask(task.id)"
                        @keydown.escape="cancelEditTask"
                        @blur="confirmEditTask(task.id)"
                      />
                    </div>
                  </div>

                  <!-- Actions -->
                  <div
                    class="shrink-0 flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                  >
                    <button
                      class="hidden sm:flex size-6 items-center justify-center text-text-dim hover:text-accent-sky transition-colors"
                      @click.stop="startAddSubtask(task.id)"
                    >
                      <Icon icon="lucide:list-plus" class="size-3.5" />
                    </button>
                    <button
                      v-if="task.subtasks.length > 0"
                      class="size-6 flex items-center justify-center text-text-dim hover:text-text-primary transition-colors"
                      @click.stop="toggleExpanded(task.id)"
                    >
                      <Icon
                        :icon="task.expanded ? 'lucide:chevron-up' : 'lucide:chevron-down'"
                        class="size-3.5"
                      />
                    </button>
                    <button
                      class="size-6 flex items-center justify-center text-text-dim hover:text-red-400 transition-colors"
                      @click.stop="deleteTask(task.id)"
                    >
                      <Icon icon="lucide:trash-2" class="size-3.5" />
                    </button>
                  </div>
                </div>

                <!-- Subtasks -->
                <Transition name="subtask-area">
                  <div
                    v-if="
                      (task.subtasks.length > 0 || addingSubtaskForId === task.id) && task.expanded
                    "
                    class="bg-bg-deep/40 border-t border-border-default"
                  >
                    <TransitionGroup name="subtask-item" tag="div">
                      <div
                        v-for="sub in task.subtasks"
                        :key="sub.id"
                        class="group/sub flex items-center gap-2.5 pl-10 pr-4 py-2.5 hover:bg-bg-elevated/50 transition-colors border-b border-border-default/50"
                      >
                        <span class="shrink-0 text-text-dim/40 text-xs select-none">└</span>
                        <button
                          class="size-4 border-2 shrink-0 flex items-center justify-center transition-all duration-200"
                          :class="
                            sub.completed
                              ? 'border-accent-coral bg-accent-coral'
                              : 'border-border-default hover:border-accent-coral'
                          "
                          @click="toggleSubtask(task.id, sub.id)"
                        >
                          <Transition name="check-icon">
                            <Icon
                              v-if="sub.completed"
                              icon="lucide:check"
                              class="size-2.5 text-white"
                            />
                          </Transition>
                        </button>
                        <p
                          class="flex-1 min-w-0 text-xs leading-relaxed truncate"
                          :class="
                            sub.completed ? 'line-through text-text-dim' : 'text-text-secondary'
                          "
                          :title="sub.text"
                        >
                          {{ sub.text }}
                        </p>
                        <button
                          class="shrink-0 size-5 flex items-center justify-center text-text-dim hover:text-red-400 transition-colors opacity-0 group-hover/sub:opacity-100"
                          @click="deleteSubtask(task.id, sub.id)"
                        >
                          <Icon icon="lucide:x" class="size-3" />
                        </button>
                      </div>
                    </TransitionGroup>
                    <div
                      v-if="addingSubtaskForId === task.id"
                      class="flex items-center gap-2 pl-10 pr-4 py-2 border-b border-border-default/50"
                    >
                      <span class="shrink-0 text-text-dim/40 text-xs select-none">└</span>
                      <div class="size-4 border-2 border-dashed border-border-default shrink-0" />
                      <input
                        class="subtask-add-input flex-1 min-w-0 bg-transparent text-xs text-text-primary outline-none placeholder-text-dim border-b border-accent-coral/50 pb-0.5 focus:border-accent-coral"
                        placeholder="Nhập việc nhỏ..."
                        v-model="newSubtaskText"
                        @keydown.enter="confirmAddSubtask(task.id)"
                        @keydown.escape="cancelAddSubtask"
                        @blur="confirmAddSubtask(task.id)"
                      />
                    </div>
                    <button
                      v-if="addingSubtaskForId !== task.id"
                      class="w-full flex items-center gap-2 pl-10 pr-4 py-2 text-xs text-text-dim hover:text-accent-sky hover:bg-accent-sky/5 transition-all"
                      @click="startAddSubtask(task.id)"
                    >
                      <Icon icon="lucide:plus" class="size-3" /> Thêm việc nhỏ
                    </button>
                  </div>
                </Transition>
              </div>
            </TransitionGroup>

            <!-- Show completed toggle -->
            <div v-if="completedTasks.length > 0" class="border-t border-border-default">
              <button
                class="w-full flex items-center justify-between px-5 py-3 text-xs text-text-dim hover:text-text-secondary hover:bg-bg-elevated/30 transition-all"
                @click="showCompleted = !showCompleted"
              >
                <span class="flex items-center gap-2">
                  <Icon icon="lucide:check-circle-2" class="size-3.5 text-accent-coral" />
                  <span class="font-display tracking-wide"
                    >{{ completedTasks.length }} việc đã hoàn thành</span
                  >
                </span>
                <Icon
                  :icon="showCompleted ? 'lucide:chevron-up' : 'lucide:chevron-down'"
                  class="size-3.5 transition-transform"
                />
              </button>

              <Transition name="subtask-area">
                <div v-if="showCompleted" class="divide-y divide-border-default/50 bg-bg-deep/30">
                  <div v-for="task in completedTasks" :key="task.id" class="group">
                    <div
                      class="flex items-center gap-2 px-4 py-3 opacity-60 hover:opacity-80 transition-opacity min-w-0"
                    >
                      <span class="size-4 shrink-0" />
                      <!-- Re-toggle checkbox -->
                      <button
                        v-if="task.subtasks.length === 0"
                        class="size-5 border-2 shrink-0 border-accent-coral bg-accent-coral flex items-center justify-center"
                        @click="toggleTask(task.id)"
                      >
                        <Icon icon="lucide:check" class="size-3 text-white" />
                      </button>
                      <button
                        v-else
                        class="size-5 shrink-0 border-2 border-accent-amber bg-accent-amber/20 flex items-center justify-center hover:bg-accent-amber/40 transition-colors"
                        @click="toggleAllSubtasks(task.id)"
                      >
                        <Icon icon="lucide:check" class="size-3 text-accent-amber" />
                      </button>
                      <p class="flex-1 min-w-0 text-sm line-through text-text-dim truncate">
                        {{ task.text }}
                      </p>
                      <span v-if="task.completedAt" class="text-xs text-text-dim shrink-0">{{
                        formatTime(task.completedAt)
                      }}</span>
                      <button
                        class="size-6 shrink-0 flex items-center justify-center text-text-dim hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                        @click="deleteTask(task.id)"
                      >
                        <Icon icon="lucide:trash-2" class="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </Transition>
            </div>
          </div>

          <!-- Add task input -->
          <div class="border-t border-border-default p-4 shrink-0">
            <div class="flex gap-2">
              <input
                ref="addInputRef"
                v-model="newTaskText"
                placeholder="Thêm việc cần làm..."
                class="flex-1 min-w-0 bg-bg-deep border border-border-default px-4 py-2.5 text-sm text-text-primary placeholder-text-dim outline-none focus:border-accent-coral transition-colors"
                @keydown.enter="addTask"
              />
              <button
                class="border border-accent-coral bg-accent-coral/10 px-4 py-2.5 text-accent-coral hover:bg-accent-coral hover:text-white transition-all"
                @click="addTask"
              >
                <Icon icon="lucide:plus" class="size-4" />
              </button>
            </div>
            <p class="text-text-dim text-xs mt-2 flex items-center gap-1">
              <Icon icon="lucide:info" class="size-3 shrink-0" />
              <span class="sm:hidden"
                >Nhấp text để mở rộng · Nhấn
                <Icon icon="lucide:chevron-down" class="size-3 inline" /> để thêm việc nhỏ</span
              >
              <span class="hidden sm:inline"
                >Nhấp để mở rộng text · Nhấp đúp để chỉnh sửa ·
                <Icon icon="lucide:list-plus" class="size-3" /> để thêm việc nhỏ</span
              >
            </p>
          </div>
        </div>
      </div>

      <!-- ═══ TAB: LỊCH SỬ ═══ -->
      <div v-else class="animate-fade-up animate-delay-2">
        <!-- History header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <!-- Filter pills -->
          <div class="flex gap-1 border border-border-default bg-bg-surface p-1">
            <button
              v-for="f in ['week', 'month', 'all'] as HistoryFilter[]"
              :key="f"
              class="px-4 py-1.5 text-xs font-display tracking-wide transition-all"
              :class="
                historyFilter === f
                  ? 'bg-bg-elevated text-text-primary border border-border-default'
                  : 'text-text-dim hover:text-text-secondary'
              "
              @click="historyFilter = f"
            >
              {{ f === 'week' ? 'Tuần này' : f === 'month' ? 'Tháng này' : 'Tất cả' }}
            </button>
          </div>

          <!-- Stats -->
          <div class="flex items-center gap-4 text-sm">
            <div class="text-center">
              <p class="font-display text-2xl font-bold text-accent-coral">
                {{ historyTotalCompleted }}
              </p>
              <p class="text-text-dim text-xs">việc hoàn thành</p>
            </div>
            <div class="w-px h-8 bg-border-default" />
            <div class="text-center">
              <p class="font-display text-2xl font-bold text-accent-amber">
                {{ historyDays.length }}
              </p>
              <p class="text-text-dim text-xs">ngày hoạt động</p>
            </div>
            <div class="w-px h-8 bg-border-default" />
            <div class="text-center">
              <p class="font-display text-2xl font-bold text-accent-sky">
                {{ storage.streak.best }}
              </p>
              <p class="text-text-dim text-xs">streak kỷ lục</p>
            </div>
          </div>
        </div>

        <!-- Empty history -->
        <div
          v-if="historyDays.length === 0"
          class="border border-border-default bg-bg-surface flex flex-col items-center justify-center py-20 text-center px-6"
        >
          <p class="text-5xl mb-4 select-none">🗓️</p>
          <p class="text-text-secondary font-display text-sm">Chưa có lịch sử nào</p>
          <p class="text-text-dim text-xs mt-1">
            Hoàn thành các việc trong ngày để xem lịch sử tại đây.
          </p>
        </div>

        <!-- History timeline -->
        <div v-else class="space-y-4">
          <div
            v-for="day in historyDays"
            :key="day.key"
            class="border border-border-default bg-bg-surface overflow-hidden"
          >
            <!-- Date header -->
            <div
              class="px-5 py-3.5 border-b border-border-default flex items-center justify-between bg-bg-elevated/50"
            >
              <div class="flex items-center gap-3">
                <div class="w-1.5 h-1.5 rounded-full bg-accent-coral shrink-0" />
                <p
                  class="font-display text-sm font-semibold capitalize"
                  :class="day.isToday ? 'text-accent-coral' : 'text-text-primary'"
                >
                  {{ day.dateLabel }}
                </p>
              </div>
              <span class="text-xs font-display text-text-dim">
                {{ day.completedTasks.length }} việc
              </span>
            </div>

            <!-- Completed tasks in this day -->
            <div class="divide-y divide-border-default/50">
              <div v-for="task in day.completedTasks" :key="task.id" class="group">
                <!-- Task row -->
                <div class="flex items-center gap-3 px-5 py-3 min-w-0">
                  <div
                    class="size-5 border-2 shrink-0 flex items-center justify-center border-accent-coral bg-accent-coral/10"
                  >
                    <Icon icon="lucide:check" class="size-3 text-accent-coral" />
                  </div>
                  <div class="flex-1 min-w-0 overflow-hidden">
                    <p class="text-sm text-text-secondary line-through truncate">{{ task.text }}</p>
                    <!-- Subtask count if any -->
                    <p v-if="task.subtasks.length > 0" class="text-xs text-text-dim mt-0.5">
                      {{ task.subtasks.length }} việc nhỏ
                    </p>
                  </div>
                  <span
                    v-if="task.completedAt"
                    class="text-xs text-text-dim shrink-0 font-display tabular-nums"
                  >
                    {{ formatTime(task.completedAt) }}
                  </span>
                </div>

                <!-- Completed subtasks -->
                <div
                  v-if="task.subtasks.length > 0 && task.subtasks.some((s) => s.completed)"
                  class="pb-2"
                >
                  <div
                    v-for="sub in task.subtasks.filter((s) => s.completed)"
                    :key="sub.id"
                    class="flex items-center gap-2.5 pl-12 pr-5 py-1 min-w-0"
                  >
                    <span class="text-text-dim/40 text-xs select-none">└</span>
                    <div
                      class="size-3.5 border border-accent-coral/50 shrink-0 flex items-center justify-center"
                    >
                      <Icon icon="lucide:check" class="size-2 text-accent-coral/70" />
                    </div>
                    <p class="text-xs text-text-dim line-through flex-1 min-w-0 truncate">
                      {{ sub.text }}
                    </p>
                    <span
                      v-if="sub.completedAt"
                      class="text-xs text-text-dim tabular-nums shrink-0"
                      >{{ formatTime(sub.completedAt) }}</span
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Back home (mobile) -->
      <div class="mt-6 lg:hidden animate-fade-up animate-delay-3">
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-5 py-2.5 text-sm text-text-secondary transition-all hover:border-accent-coral hover:text-text-primary"
        >
          ← Về trang chủ
        </RouterLink>
      </div>
    </div>

    <!-- ── Share Modal ── -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div
          v-if="showShareModal"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          @click.self="showShareModal = false"
        >
          <div class="bg-bg-surface border border-border-default w-full max-w-sm">
            <div class="px-5 py-4 border-b border-border-default flex items-center justify-between">
              <span class="font-display text-xs tracking-widest text-text-dim"
                >// CHIA SẺ HÔM NAY</span
              >
              <button class="text-text-dim hover:text-text-primary" @click="showShareModal = false">
                <Icon icon="lucide:x" class="size-4" />
              </button>
            </div>
            <div class="p-4">
              <div ref="shareCardRef" class="bg-bg-deep p-5 border border-border-default">
                <div class="flex items-start justify-between mb-4">
                  <div>
                    <p
                      style="
                        color: #ff6b4a;
                        font-size: 10px;
                        letter-spacing: 0.15em;
                        font-weight: 600;
                        margin-bottom: 4px;
                      "
                    >
                      // MY PLANNER
                    </p>
                    <p
                      style="color: #f0ede6; font-size: 20px; font-weight: 700; margin-bottom: 2px"
                    >
                      Hôm nay
                    </p>
                    <p style="color: #4a6180; font-size: 11px; text-transform: capitalize">
                      {{
                        new Date().toLocaleDateString('vi-VN', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
                      }}
                    </p>
                  </div>
                  <div style="text-align: right">
                    <p
                      style="font-size: 42px; font-weight: 700; line-height: 1"
                      :style="{ color: isComplete ? '#FFB830' : '#FF6B4A' }"
                    >
                      {{ percentage }}%
                    </p>
                    <p style="color: #4a6180; font-size: 11px; margin-top: 2px">
                      {{ completedCount }}/{{ totalCount }} việc
                    </p>
                  </div>
                </div>
                <div style="height: 3px; background: #1e2f42; margin-bottom: 16px">
                  <div
                    style="height: 100%"
                    :style="{
                      width: percentage + '%',
                      background: isComplete ? '#FFB830' : '#FF6B4A',
                    }"
                  />
                </div>
                <div style="margin-bottom: 14px">
                  <div
                    v-for="task in tasks.slice(0, 6)"
                    :key="task.id"
                    style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px"
                  >
                    <div
                      style="
                        width: 14px;
                        height: 14px;
                        border: 2px solid;
                        flex-shrink: 0;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                      "
                      :style="{
                        borderColor: isTaskDone(task) ? '#FF6B4A' : '#253549',
                        background: isTaskDone(task) ? '#FF6B4A' : 'transparent',
                      }"
                    >
                      <span
                        v-if="isTaskDone(task)"
                        style="color: white; font-size: 9px; line-height: 1"
                        >✓</span
                      >
                    </div>
                    <span
                      style="
                        font-size: 12px;
                        flex: 1;
                        overflow: hidden;
                        white-space: nowrap;
                        text-overflow: ellipsis;
                      "
                      :style="{
                        color: isTaskDone(task) ? '#4a6180' : '#8b9db5',
                        textDecoration: isTaskDone(task) ? 'line-through' : 'none',
                      }"
                      >{{ task.text }}</span
                    >
                    <span
                      v-if="task.subtasks.length > 0"
                      style="font-size: 10px; font-weight: 600; flex-shrink: 0"
                      :style="{ color: isTaskDone(task) ? '#FFB830' : '#FF6B4A' }"
                      >{{ taskProgress(task).done }}/{{ taskProgress(task).total }}</span
                    >
                  </div>
                  <p
                    v-if="tasks.length > 6"
                    style="color: #4a6180; font-size: 11px; padding-left: 22px"
                  >
                    và {{ tasks.length - 6 }} việc khác...
                  </p>
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between">
                  <p style="color: #4a6180; font-size: 11px">vibe.j2team.org</p>
                  <div
                    v-if="storage.streak.current > 0"
                    style="display: flex; align-items: center; gap: 4px; font-size: 11px"
                  >
                    <span>🔥</span>
                    <span style="color: #ff6b4a; font-weight: 700">{{
                      storage.streak.current
                    }}</span>
                    <span style="color: #4a6180">ngày streak</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="px-4 pb-4">
              <button
                class="w-full border border-accent-coral bg-accent-coral/10 text-accent-coral px-4 py-3 font-display text-sm tracking-wide hover:bg-accent-coral hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                :disabled="isGenerating"
                @click="downloadCard"
              >
                <Icon
                  :icon="isGenerating ? 'lucide:loader-2' : 'lucide:download'"
                  class="size-4"
                  :class="{ 'animate-spin': isGenerating }"
                />
                {{ isGenerating ? 'Đang tạo ảnh...' : 'Tải xuống ảnh' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.ring-progress {
  transition:
    stroke-dashoffset 0.7s cubic-bezier(0.4, 0, 0.2, 1),
    stroke 0.5s ease;
}
.mini-ring-progress {
  transition:
    stroke-dashoffset 0.4s cubic-bezier(0.4, 0, 0.2, 1),
    stroke 0.3s ease;
}
.timer-ring-progress {
  transition:
    stroke-dashoffset 0.9s linear,
    stroke 0.4s ease;
}

.task-list-area {
  max-height: 540px;
}

/* Expanded long text: force wrap at any character boundary */
.text-expanded {
  overflow-wrap: anywhere;
  word-break: break-all;
  white-space: normal;
}
@media (max-width: 1024px) {
  .task-list-area {
    max-height: 380px;
  }
}

.task-list-area::-webkit-scrollbar,
.timer-task-list::-webkit-scrollbar {
  width: 3px;
}
.task-list-area::-webkit-scrollbar-track,
.timer-task-list::-webkit-scrollbar-track {
  background: transparent;
}
.task-list-area::-webkit-scrollbar-thumb,
.timer-task-list::-webkit-scrollbar-thumb {
  background: #253549;
  border-radius: 999px;
}
.task-list-area::-webkit-scrollbar-thumb:hover,
.timer-task-list::-webkit-scrollbar-thumb:hover {
  background: #38bdf8;
}
.task-list-area {
  scrollbar-width: thin;
  scrollbar-color: #253549 transparent;
}
.timer-task-list {
  scrollbar-width: thin;
  scrollbar-color: #253549 transparent;
}

.task-row-wrapper {
  position: relative;
  transition: opacity 0.15s ease;
}
.drop-before::before {
  content: '';
  position: absolute;
  top: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: #ff6b4a;
  z-index: 10;
  border-radius: 1px;
}
.drop-after::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: #ff6b4a;
  z-index: 10;
  border-radius: 1px;
}

.task-item-enter-active {
  transition: all 0.25s ease;
}
.task-item-leave-active {
  transition: all 0.2s ease;
  position: absolute;
  width: 100%;
}
.task-item-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}
.task-item-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
.task-item-move {
  transition: transform 0.2s ease;
}

.subtask-area-enter-active {
  transition: all 0.25s ease;
  overflow: hidden;
}
.subtask-area-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}
.subtask-area-enter-from {
  opacity: 0;
  max-height: 0;
}
.subtask-area-enter-to {
  opacity: 1;
  max-height: 800px;
}
.subtask-area-leave-from {
  opacity: 1;
  max-height: 800px;
}
.subtask-area-leave-to {
  opacity: 0;
  max-height: 0;
}

.subtask-item-enter-active {
  transition: all 0.2s ease;
}
.subtask-item-leave-active {
  transition: all 0.15s ease;
  position: absolute;
  width: 100%;
}
.subtask-item-enter-from {
  opacity: 0;
  transform: translateX(-8px);
}
.subtask-item-leave-to {
  opacity: 0;
}

.check-icon-enter-active,
.check-icon-leave-active {
  transition: all 0.15s ease;
}
.check-icon-enter-from,
.check-icon-leave-to {
  opacity: 0;
  transform: scale(0);
}

.complete-badge-enter-active,
.complete-badge-leave-active {
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.complete-badge-enter-from,
.complete-badge-leave-to {
  opacity: 0;
  transform: scale(0.7);
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.celebration-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 999;
  overflow: hidden;
}
.confetti {
  position: absolute;
  animation: confetti-fall linear forwards;
}
@keyframes confetti-fall {
  0% {
    transform: translateY(-20px) rotate(0deg);
    opacity: 1;
  }
  75% {
    opacity: 1;
  }
  100% {
    transform: translateY(105vh) rotate(540deg);
    opacity: 0;
  }
}
</style>
