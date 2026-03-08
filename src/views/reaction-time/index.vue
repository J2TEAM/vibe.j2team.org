<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'

type GameState = 'idle' | 'waiting' | 'ready' | 'result' | 'too-soon'

const state = ref<GameState>('idle')
const reactionTime = ref(0)
const history = ref<number[]>([])
const isNewBest = ref(false)
const ripples = ref<{ id: number; x: number; y: number }[]>([])
const clickZoneRef = ref<HTMLElement | null>(null)
let startTime = 0
let waitTimer: ReturnType<typeof setTimeout> | null = null
let rippleId = 0

const best = computed(() => (history.value.length ? Math.min(...history.value) : null))
const average = computed(() =>
  history.value.length
    ? Math.round(history.value.reduce((a, b) => a + b, 0) / history.value.length)
    : null,
)

const ratingConfig = computed(() => {
  if (!history.value.length) return null
  const avg = average.value!
  if (avg < 180)
    return {
      text: 'Phản xạ siêu nhân',
      barColor: 'bg-accent-sky',
      textColor: 'text-accent-sky',
      width: '100%',
    }
  if (avg < 220)
    return {
      text: 'Phản xạ xuất sắc',
      barColor: 'bg-accent-sky',
      textColor: 'text-accent-sky',
      width: '85%',
    }
  if (avg < 270)
    return {
      text: 'Phản xạ tốt',
      barColor: 'bg-accent-amber',
      textColor: 'text-accent-amber',
      width: '70%',
    }
  if (avg < 330)
    return {
      text: 'Bình thường',
      barColor: 'bg-accent-amber',
      textColor: 'text-accent-amber',
      width: '52%',
    }
  if (avg < 400)
    return {
      text: 'Chậm một chút',
      barColor: 'bg-accent-coral',
      textColor: 'text-accent-coral',
      width: '35%',
    }
  return {
    text: 'Cần luyện tập',
    barColor: 'bg-accent-coral',
    textColor: 'text-accent-coral',
    width: '18%',
  }
})

const resultComment = computed(() => {
  const t = reactionTime.value
  if (t < 150) return 'Phi thường!'
  if (t < 200) return 'Cực kỳ nhanh!'
  if (t < 250) return 'Rất tốt!'
  if (t < 300) return 'Không tệ!'
  if (t < 400) return 'Ổn thôi...'
  return 'Thử lại nào!'
})

function barWidth(t: number): string {
  const min = Math.min(...history.value)
  const max = Math.max(...history.value)
  if (max === min) return '100%'
  const pct = 1 - (t - min) / (max - min)
  return `${Math.round(20 + pct * 80)}%`
}

function addRipple(x: number, y: number) {
  const id = rippleId++
  ripples.value.push({ id, x, y })
  setTimeout(() => {
    ripples.value = ripples.value.filter((r) => r.id !== id)
  }, 700)
}

function advanceGame() {
  if (state.value === 'idle' || state.value === 'result' || state.value === 'too-soon') {
    isNewBest.value = false
    state.value = 'waiting'
    const delay = 1500 + Math.random() * 3500
    waitTimer = setTimeout(() => {
      state.value = 'ready'
      // Bắt đầu tính giờ sau khi frame hiển thị tín hiệu được vẽ lên màn hình,
      // tránh cộng thêm độ trễ render (~8–16ms) vào kết quả đo
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          startTime = performance.now()
        })
      })
    }, delay)
    return
  }
  if (state.value === 'waiting') {
    if (waitTimer) clearTimeout(waitTimer)
    state.value = 'too-soon'
    return
  }
  if (state.value === 'ready') {
    const elapsed = Math.max(0, Math.round(performance.now() - startTime) - 100)
    const prevBest = best.value
    reactionTime.value = elapsed
    history.value.push(elapsed)
    isNewBest.value = prevBest === null || elapsed < prevBest
    state.value = 'result'
  }
}

function handleAreaClick(e: MouseEvent) {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  addRipple(e.clientX - rect.left, e.clientY - rect.top)
  advanceGame()
}

function handleKey(e: KeyboardEvent) {
  if (e.code === 'Space') {
    e.preventDefault()
    const el = clickZoneRef.value
    if (el) {
      const rect = el.getBoundingClientRect()
      addRipple(rect.width / 2, rect.height / 2)
    }
    advanceGame()
  }
}

function reset() {
  if (waitTimer) clearTimeout(waitTimer)
  state.value = 'idle'
  reactionTime.value = 0
  history.value = []
  isNewBest.value = false
}

onMounted(() => window.addEventListener('keydown', handleKey))
onUnmounted(() => window.removeEventListener('keydown', handleKey))
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col">
    <!-- Header -->
    <header
      class="flex items-center justify-between px-6 py-4 border-b border-border-default animate-fade-up shrink-0"
    >
      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 text-sm text-text-secondary transition hover:text-text-primary"
      >
        &larr; Về trang chủ
      </RouterLink>
      <div class="flex items-center gap-3">
        <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
        <span class="font-display text-sm font-semibold tracking-wide text-text-primary"
          >REACTION TIME</span
        >
      </div>
    </header>

    <!-- Body: click zone + sidebar -->
    <div class="flex-1 flex flex-col lg:flex-row min-h-0">
      <!-- Click Zone -->
      <div
        ref="clickZoneRef"
        class="relative flex-1 flex flex-col items-center justify-center cursor-pointer overflow-hidden select-none min-h-[55vh] lg:min-h-0"
        :class="{
          'bg-bg-deep': state === 'idle' || state === 'result',
          'bg-bg-surface': state === 'waiting',
          'bg-accent-sky/10': state === 'ready',
          'bg-accent-coral/5': state === 'too-soon',
        }"
        role="button"
        tabindex="0"
        aria-label="Vùng nhấn phản xạ"
        @click="handleAreaClick"
      >
        <!-- Left accent bar -->
        <div
          class="absolute left-0 inset-y-0 w-0.5 transition-colors duration-300"
          :class="{
            'bg-accent-coral/30': state === 'idle',
            'bg-accent-amber/50': state === 'waiting',
            'bg-accent-sky': state === 'ready',
            'bg-accent-coral': state === 'result',
            'bg-accent-coral/40': state === 'too-soon',
          }"
        />

        <!-- Ripples -->
        <span
          v-for="r in ripples"
          :key="r.id"
          class="ripple"
          :style="{ left: `${r.x}px`, top: `${r.y}px` }"
        />

        <!-- State content -->
        <Transition name="fade-state" mode="out-in">
          <!-- Idle -->
          <div
            v-if="state === 'idle'"
            key="idle"
            class="flex flex-col items-center gap-4 text-center px-6"
          >
            <div
              class="font-display text-[5rem] sm:text-[8rem] font-bold leading-none text-border-default"
            >
              TAP
            </div>
            <p class="text-text-secondary text-sm">
              Nhấn hoặc bấm
              <kbd
                class="inline-block border border-border-default bg-bg-surface px-1.5 py-0.5 font-display text-xs leading-none mx-1"
                >SPACE</kbd
              >
              để bắt đầu
            </p>
          </div>

          <!-- Waiting -->
          <div
            v-else-if="state === 'waiting'"
            key="waiting"
            class="flex flex-col items-center gap-5 text-center px-6"
          >
            <div class="font-display text-4xl sm:text-6xl font-bold text-accent-amber leading-none">
              Hãy chờ...
            </div>
            <p class="text-text-dim text-sm">Đừng nhấn vội! Chờ tín hiệu xanh</p>
            <div class="flex gap-2 mt-1">
              <span
                v-for="n in 5"
                :key="n"
                class="w-2 h-2 rounded-full bg-accent-amber/40 animate-pulse"
                :style="{ animationDelay: `${(n - 1) * 180}ms` }"
              />
            </div>
          </div>

          <!-- Ready -->
          <div
            v-else-if="state === 'ready'"
            key="ready"
            class="flex flex-col items-center gap-3 text-center px-6"
          >
            <div class="font-display text-5xl sm:text-8xl font-bold text-accent-sky leading-none">
              NHẤN!
            </div>
            <p class="text-accent-sky/60 text-sm">Ngay bây giờ!</p>
          </div>

          <!-- Result -->
          <div
            v-else-if="state === 'result'"
            key="result"
            class="flex flex-col items-center gap-3 text-center px-6"
          >
            <div
              v-if="isNewBest"
              class="bg-accent-coral text-bg-deep font-display font-bold text-xs tracking-widest px-3 py-1.5 rotate-1 mb-1"
            >
              ★ KỶ LỤC MỚI
            </div>
            <div class="flex items-end gap-2 leading-none">
              <span class="font-display text-7xl sm:text-9xl font-bold text-accent-coral">{{
                reactionTime
              }}</span>
              <span class="font-display text-2xl text-text-secondary pb-2 sm:pb-4">ms</span>
            </div>
            <p class="text-text-secondary font-display text-base sm:text-xl tracking-wide">
              {{ resultComment }}
            </p>
            <p class="text-text-dim text-xs mt-2">Nhấn để thử lại</p>
          </div>

          <!-- Too soon -->
          <div
            v-else-if="state === 'too-soon'"
            key="too-soon"
            class="flex flex-col items-center gap-3 text-center px-6"
          >
            <div class="font-display text-5xl sm:text-7xl font-bold text-accent-coral leading-none">
              Quá sớm!
            </div>
            <p class="text-text-secondary text-sm">Phải đợi tín hiệu xanh mới được nhấn</p>
            <p class="text-text-dim text-xs mt-1">Nhấn để thử lại</p>
          </div>
        </Transition>

        <!-- Separators -->
        <div class="absolute inset-x-0 bottom-0 h-px bg-border-default lg:hidden" />
        <div class="absolute inset-y-0 right-0 w-px bg-border-default hidden lg:block" />
      </div>

      <!-- Sidebar -->
      <aside class="w-full lg:w-72 xl:w-80 bg-bg-surface flex flex-col overflow-y-auto shrink-0">
        <!-- Stats -->
        <section class="p-5 border-b border-border-default">
          <div class="flex items-center gap-3 mb-4">
            <span class="text-accent-amber font-display text-sm tracking-widest">//</span>
            <span
              class="font-display text-xs font-semibold text-text-primary tracking-widest uppercase"
              >Thống kê</span
            >
            <button
              v-if="history.length"
              class="ml-auto text-xs text-text-dim hover:text-accent-coral transition-colors"
              @click.stop="reset"
            >
              Xóa
            </button>
          </div>
          <div v-if="history.length" class="grid grid-cols-3 gap-2">
            <div class="border border-border-default p-3 text-center">
              <div class="font-display text-2xl font-bold text-text-primary">
                {{ history.length }}
              </div>
              <div class="text-xs text-text-dim mt-1 leading-none">Lần thử</div>
            </div>
            <div class="border border-border-default p-3 text-center">
              <div class="font-display text-2xl font-bold text-accent-amber">{{ average }}</div>
              <div class="text-xs text-text-dim mt-1 leading-none">TB (ms)</div>
            </div>
            <div class="border border-accent-coral/40 p-3 text-center">
              <div class="font-display text-2xl font-bold text-accent-coral">{{ best }}</div>
              <div class="text-xs text-text-dim mt-1 leading-none">Tốt nhất</div>
            </div>
          </div>
          <div v-else class="text-xs text-text-dim text-center py-6">Chưa có dữ liệu</div>
        </section>

        <!-- Rating -->
        <section v-if="ratingConfig" class="p-5 border-b border-border-default">
          <div class="flex items-center gap-3 mb-3">
            <span class="text-accent-sky font-display text-sm tracking-widest">//</span>
            <span
              class="font-display text-xs font-semibold text-text-primary tracking-widest uppercase"
              >Đánh giá</span
            >
          </div>
          <div class="flex items-center justify-between mb-2">
            <span class="font-display text-sm font-semibold" :class="ratingConfig.textColor">{{
              ratingConfig.text
            }}</span>
          </div>
          <div class="w-full h-1 bg-border-default">
            <div
              class="h-full transition-all duration-700 ease-out"
              :class="ratingConfig.barColor"
              :style="{ width: ratingConfig.width }"
            />
          </div>
        </section>

        <!-- History chart -->
        <section v-if="history.length > 1" class="p-5">
          <div class="flex items-center gap-3 mb-4">
            <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
            <span
              class="font-display text-xs font-semibold text-text-primary tracking-widest uppercase"
              >Lịch sử</span
            >
          </div>
          <div class="space-y-2">
            <div
              v-for="(t, i) in [...history].reverse().slice(0, 8)"
              :key="i"
              class="flex items-center gap-2"
            >
              <span class="w-5 text-right font-display text-xs text-text-dim shrink-0">{{
                history.length - i
              }}</span>
              <div class="flex-1 h-6 bg-bg-elevated relative overflow-hidden">
                <div
                  class="h-full transition-all duration-500 ease-out"
                  :class="t === best ? 'bg-accent-coral' : 'bg-accent-amber/40'"
                  :style="{ width: barWidth(t) }"
                />
                <span
                  class="absolute inset-0 flex items-center px-2 font-display text-xs"
                  :class="t === best ? 'text-bg-deep font-bold' : 'text-text-secondary'"
                >
                  {{ t }}ms
                </span>
              </div>
            </div>
          </div>
        </section>

        <!-- Instructions (no history yet) -->
        <section v-if="!history.length" class="p-5">
          <div class="flex items-center gap-3 mb-4">
            <span class="text-accent-sky font-display text-sm tracking-widest">//</span>
            <span
              class="font-display text-xs font-semibold text-text-primary tracking-widest uppercase"
              >Hướng dẫn</span
            >
          </div>
          <ol class="space-y-4">
            <li class="flex gap-3 items-start">
              <span
                class="text-accent-coral font-display font-bold text-sm leading-none mt-0.5 shrink-0"
                >01</span
              >
              <span class="text-text-secondary text-sm leading-snug"
                >Nhấn vào vùng bên trái (hoặc SPACE) để bắt đầu</span
              >
            </li>
            <li class="flex gap-3 items-start">
              <span
                class="text-accent-amber font-display font-bold text-sm leading-none mt-0.5 shrink-0"
                >02</span
              >
              <span class="text-text-secondary text-sm leading-snug"
                >Chờ màu nền chuyển xanh và chữ "NHẤN!" xuất hiện</span
              >
            </li>
            <li class="flex gap-3 items-start">
              <span
                class="text-accent-sky font-display font-bold text-sm leading-none mt-0.5 shrink-0"
                >03</span
              >
              <span class="text-text-secondary text-sm leading-snug"
                >Nhấn ngay lúc đó — càng nhanh càng tốt!</span
              >
            </li>
          </ol>
          <div class="mt-5 border border-border-default p-3 text-xs text-text-dim leading-relaxed">
            Thời gian phản xạ trung bình của người bình thường là khoảng
            <span class="text-text-secondary">250ms</span>. Vận động viên chuyên nghiệp đạt dưới
            <span class="text-text-secondary">200ms</span>.
          </div>
        </section>

        <div class="flex-1" />

        <!-- Author -->
        <div class="p-4 border-t border-border-default">
          <p class="text-xs text-text-dim text-center font-display tracking-wide">
            by <span class="text-text-secondary">THNDEV05</span>
          </p>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.fade-state-enter-active {
  transition:
    opacity 0.12s ease,
    transform 0.12s ease;
}
.fade-state-leave-active {
  transition:
    opacity 0.08s ease,
    transform 0.08s ease;
}
.fade-state-enter-from {
  opacity: 0;
  transform: scale(0.96) translateY(6px);
}
.fade-state-leave-to {
  opacity: 0;
  transform: scale(1.02);
}

.ripple {
  position: absolute;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  transform: translate(-50%, -50%) scale(0);
  background-color: currentColor;
  opacity: 0.1;
  animation: ripple-out 0.7s ease-out forwards;
  pointer-events: none;
}

@keyframes ripple-out {
  to {
    transform: translate(-50%, -50%) scale(8);
    opacity: 0;
  }
}
</style>
