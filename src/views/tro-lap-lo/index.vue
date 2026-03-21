<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useHead } from '@unhead/vue'
import { useEventListener } from '@vueuse/core'
import { Icon } from '@iconify/vue'

useHead({
  title: 'Lấp lỗ — vibe.j2team.org',
  meta: [
    {
      name: 'description',
      content:
        'Mini game kéo thả: lấp từng ô, tầng sau khó dần, chơi không giới hạn. Zoom in / zoom out góc nhìn thư giãn. Gợi ý thư giãn, không thay thế tư vấn chuyên môn.',
    },
  ],
})

type Phase = 'play' | 'levelComplete'

interface HoleDef {
  id: number
  xPct: number
  yPct: number
}

interface PatchState {
  id: number
  onHole: number | null
  xPct: number
  yPct: number
}

/** Dãy tăng dần — dùng để scale số lỗ theo tầng (implementation). */
function seqAt(seqIndex: number): number {
  if (seqIndex <= 0) return 1
  if (seqIndex === 1) return 1
  let a = 1
  let b = 1
  for (let i = 2; i <= seqIndex; i++) {
    const c = a + b
    a = b
    b = c
  }
  return b
}

function holeCountForLevel(level: number): number {
  const idx = level + 3
  return Math.max(2, seqAt(idx))
}

function buildGridHoles(count: number): HoleDef[] {
  const left = 8
  const right = 92
  const top = 8
  const bottom = 62
  const w = right - left
  const h = bottom - top
  const aspect = w / h
  let cols = Math.max(1, Math.round(Math.sqrt(count * aspect)))
  if (cols > count) cols = count
  const rows = Math.ceil(count / cols)
  const list: HoleDef[] = []
  for (let i = 0; i < count; i++) {
    const r = Math.floor(i / cols)
    const c = i % cols
    const inLast = r === rows - 1
    const nLast = count - (rows - 1) * cols
    const cw = inLast ? nLast : cols
    const xPct = cw <= 1 ? 50 : left + (c / (cw - 1)) * w
    const yPct = rows <= 1 ? (top + bottom) / 2 : top + (r / (rows - 1)) * h
    list.push({ id: i, xPct, yPct })
  }
  return list
}

function dockPosition(index: number, count: number): { xPct: number; yPct: number } {
  const perRow = Math.min(count, Math.max(5, Math.ceil(Math.sqrt(count * 2))))
  const rows = Math.ceil(count / perRow)
  const row = Math.floor(index / perRow)
  const col = index % perRow
  const inLastRow = row === rows - 1
  const nLast = count - (rows - 1) * perRow
  const cw = inLastRow ? nLast : perRow
  const xPct = cw <= 1 ? 50 : 4 + (col / Math.max(1, cw - 1)) * 92
  const bandTop = 68
  const bandBot = 97
  const yPct =
    rows <= 1
      ? (bandTop + bandBot) / 2
      : bandTop + (row / Math.max(1, rows - 1)) * (bandBot - bandTop)
  return { xPct, yPct }
}

function snapPctForCount(count: number): number {
  const d = 48 / Math.sqrt(Math.max(count, 2))
  return Math.min(16, Math.max(5, d))
}

const levelIndex = ref(0)
const holes = ref<HoleDef[]>(buildGridHoles(holeCountForLevel(0)))
const patches = ref<PatchState[]>([])

function syncPatchesFromHoles() {
  const list = holes.value
  const n = list.length
  patches.value = list.map((_, i) => {
    const d = dockPosition(i, n)
    return { id: i, onHole: null, xPct: d.xPct, yPct: d.yPct }
  })
}

syncPatchesFromHoles()

const phase = ref<Phase>('play')
const playAreaRef = ref<HTMLElement | null>(null)
const dragPatchId = ref<number | null>(null)
const dragOffset = ref({ x: 0, y: 0 })
const showPhilosophy = ref(false)
const philosophyZoom = ref(false)

const filledCount = computed(() => patches.value.filter((p) => p.onHole !== null).length)
const levelNumber = computed(() => levelIndex.value + 1)
const currentHoleCount = computed(() => holes.value.length)
const nextHoleCount = computed(() => holeCountForLevel(levelIndex.value + 1))
const snapPct = computed(() => snapPctForCount(holes.value.length))
const progressPct = computed(() =>
  holes.value.length === 0 ? 0 : Math.round((filledCount.value / holes.value.length) * 100),
)

const patchRadiusPx = computed(() => {
  const n = holes.value.length
  if (n >= 89) return 7
  if (n >= 55) return 8
  if (n >= 34) return 10
  if (n >= 21) return 12
  if (n >= 13) return 14
  if (n >= 8) return 16
  return 18
})

const holeOuterPx = computed(() => {
  const n = holes.value.length
  if (n >= 55) return 18
  if (n >= 34) return 22
  if (n >= 21) return 26
  if (n >= 13) return 30
  return 36
})

const holeInnerPx = computed(() => Math.max(8, Math.round(holeOuterPx.value * 0.38)))

let flowTimer: ReturnType<typeof setTimeout> | null = null

function clearFlowTimer() {
  if (flowTimer !== null) {
    clearTimeout(flowTimer)
    flowTimer = null
  }
}

function applyLevel(level: number) {
  holes.value = buildGridHoles(holeCountForLevel(level))
  syncPatchesFromHoles()
}

function playAreaMetrics() {
  const el = playAreaRef.value
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { left: r.left, top: r.top, width: r.width, height: r.height }
}

function clientToPct(clientX: number, clientY: number): { xPct: number; yPct: number } | null {
  const m = playAreaMetrics()
  if (!m || m.width < 1 || m.height < 1) return null
  const xPct = ((clientX - m.left) / m.width) * 100
  const yPct = ((clientY - m.top) / m.height) * 100
  return { xPct, yPct }
}

function distancePct(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx
  const dy = ay - by
  return Math.sqrt(dx * dx + dy * dy)
}

function onPatchPointerDown(e: PointerEvent, patch: PatchState) {
  if (phase.value !== 'play' || patch.onHole !== null || dragPatchId.value !== null) return
  e.preventDefault()
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  const pct = clientToPct(e.clientX, e.clientY)
  if (!pct) return
  dragPatchId.value = patch.id
  dragOffset.value = { x: pct.xPct - patch.xPct, y: pct.yPct - patch.yPct }
}

function onPatchPointerMove(e: PointerEvent, patch: PatchState) {
  if (dragPatchId.value !== patch.id) return
  const pct = clientToPct(e.clientX, e.clientY)
  if (!pct) return
  const nx = pct.xPct - dragOffset.value.x
  const ny = pct.yPct - dragOffset.value.y
  patch.xPct = Math.min(100, Math.max(0, nx))
  patch.yPct = Math.min(100, Math.max(0, ny))
}

function goNextLevel() {
  phase.value = 'levelComplete'
  clearFlowTimer()
  flowTimer = setTimeout(() => {
    levelIndex.value += 1
    applyLevel(levelIndex.value)
    phase.value = 'play'
    dragPatchId.value = null
    flowTimer = null
  }, 1400)
}

function onPatchPointerUp(e: PointerEvent, patch: PatchState) {
  if (dragPatchId.value !== patch.id) return
  try {
    ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
  } catch {
    /* ignore */
  }
  dragPatchId.value = null

  if (patch.onHole !== null) return

  let best: HoleDef | null = null
  let bestD = 1e9
  for (const h of holes.value) {
    const taken = patches.value.some((p) => p.onHole === h.id)
    if (taken) continue
    const d = distancePct(patch.xPct, patch.yPct, h.xPct, h.yPct)
    if (d < bestD) {
      bestD = d
      best = h
    }
  }

  const n = holes.value.length
  if (best && bestD <= snapPct.value) {
    patch.onHole = best.id
    patch.xPct = best.xPct
    patch.yPct = best.yPct
    if (patches.value.every((p) => p.onHole !== null)) {
      goNextLevel()
    }
  } else {
    const d = dockPosition(patch.id, n)
    patch.xPct = d.xPct
    patch.yPct = d.yPct
  }
}

useEventListener(typeof window !== 'undefined' ? window : null, 'pointercancel', () => {
  if (dragPatchId.value === null) return
  const id = dragPatchId.value
  const patch = patches.value.find((p) => p.id === id)
  dragPatchId.value = null
  if (patch && patch.onHole === null) {
    const d = dockPosition(patch.id, holes.value.length)
    patch.xPct = d.xPct
    patch.yPct = d.yPct
  }
})

onUnmounted(() => {
  clearFlowTimer()
})

function resetGame() {
  clearFlowTimer()
  levelIndex.value = 0
  applyLevel(0)
  phase.value = 'play'
  dragPatchId.value = null
  showPhilosophy.value = false
  philosophyZoom.value = false
}

function openPhilosophy() {
  if (showPhilosophy.value && philosophyZoom.value) return
  showPhilosophy.value = true
  philosophyZoom.value = false
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      philosophyZoom.value = true
    })
  })
}

function closePhilosophy() {
  if (!showPhilosophy.value && !philosophyZoom.value) return
  showPhilosophy.value = false
  philosophyZoom.value = false
}

const isBoardZoomedOut = computed(() => showPhilosophy.value && philosophyZoom.value)
</script>

<template>
  <div
    class="relative min-h-screen overflow-x-hidden bg-bg-deep px-4 pb-12 pt-6 font-body text-text-primary sm:px-6 sm:pb-16 sm:pt-10"
  >
    <div
      class="pointer-events-none absolute inset-0 opacity-[0.35]"
      aria-hidden="true"
      style="
        background-image:
          linear-gradient(to right, rgb(37 53 73 / 0.45) 1px, transparent 1px),
          linear-gradient(to bottom, rgb(37 53 73 / 0.45) 1px, transparent 1px);
        background-size: 24px 24px;
        mask-image: radial-gradient(ellipse 80% 70% at 50% 0%, black, transparent 75%);
      "
    />

    <div class="relative mx-auto max-w-md">
      <header
        class="animate-fade-up mb-6 flex items-start justify-between gap-4 border-b border-border-default pb-6"
      >
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <span
              class="inline-block size-2 shrink-0 bg-accent-coral shadow-[0_0_12px_rgb(255_107_74_/_0.65)]"
              aria-hidden="true"
            />
            <p
              class="font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-text-dim"
            >
              focus mode
            </p>
          </div>
          <h1
            class="font-display mt-3 text-[1.65rem] font-bold leading-none tracking-tight text-text-primary sm:text-3xl"
          >
            Lấp lỗ
          </h1>
          <p class="mt-2 max-w-[20rem] text-sm leading-snug text-text-secondary">
            Kéo vòng vào ô trống. Tầng sau nhiều ô hơn — chill tới khi muốn dừng.
          </p>
        </div>
        <div class="flex shrink-0 flex-col items-end gap-2">
          <RouterLink
            to="/"
            class="inline-flex size-10 items-center justify-center border border-border-default bg-bg-surface text-text-secondary transition-colors hover:border-accent-coral hover:text-accent-coral"
            aria-label="Về trang chủ"
          >
            <Icon icon="lucide:home" class="size-[18px]" aria-hidden="true" />
          </RouterLink>
          <div
            class="flex border border-border-default bg-bg-deep/60"
            role="group"
            aria-label="Thu phóng góc nhìn"
          >
            <button
              type="button"
              class="inline-flex min-w-0 flex-1 items-center justify-center gap-1 whitespace-nowrap px-1.5 py-2 font-display text-[8px] font-semibold uppercase tracking-wide transition-colors min-[360px]:gap-1.5 min-[360px]:px-2 min-[360px]:text-[9px] sm:px-2.5 sm:text-[10px] sm:tracking-wider"
              :class="
                isBoardZoomedOut
                  ? 'bg-bg-elevated text-accent-coral'
                  : 'text-text-dim hover:bg-bg-elevated/80 hover:text-text-secondary'
              "
              aria-label="Zoom out — lùi ra, mở góc nhìn"
              @click="openPhilosophy"
            >
              <Icon icon="lucide:zoom-out" class="size-3.5 shrink-0 sm:size-4" aria-hidden="true" />
              Zoom out
            </button>
            <span class="w-px shrink-0 self-stretch bg-border-default" aria-hidden="true" />
            <button
              type="button"
              class="inline-flex min-w-0 flex-1 items-center justify-center gap-1 whitespace-nowrap px-1.5 py-2 font-display text-[8px] font-semibold uppercase tracking-wide transition-colors min-[360px]:gap-1.5 min-[360px]:px-2 min-[360px]:text-[9px] sm:px-2.5 sm:text-[10px] sm:tracking-wider"
              :class="
                !isBoardZoomedOut
                  ? 'bg-bg-elevated text-accent-sky'
                  : 'text-text-dim hover:bg-bg-elevated/80 hover:text-text-secondary'
              "
              aria-label="Zoom in — tập trung vào bàn chơi"
              @click="closePhilosophy"
            >
              <Icon icon="lucide:zoom-in" class="size-3.5 shrink-0 sm:size-4" aria-hidden="true" />
              Zoom in
            </button>
          </div>
        </div>
      </header>

      <div class="animate-fade-up animate-delay-1 relative mx-auto w-full">
        <div
          class="pointer-events-none absolute left-1/2 top-4 -z-10 w-[88%] -translate-x-1/2 sm:top-6"
          aria-hidden="true"
        >
          <div
            v-for="layer in 4"
            :key="layer"
            class="absolute left-0 right-0 border border-accent-sky/15 bg-bg-elevated/20"
            :style="{
              top: (layer - 1) * 6 + 'px',
              height: 'min(300px, 68vw)',
              zIndex: -layer,
              opacity: 0.12 + layer * 0.07,
              transform: `scale(${1 - layer * 0.02})`,
            }"
          />
        </div>

        <div
          class="relative border border-border-default bg-bg-surface shadow-[0_0_0_1px_rgb(255_107_74_/_0.12),0_24px_48px_-24px_rgb(0_0_0_/_0.55)] transition-[transform,opacity,box-shadow] duration-[2s] ease-[cubic-bezier(0.22,1,0.36,1)]"
          :class="
            philosophyZoom
              ? 'origin-[50%_35%] scale-[0.22] opacity-[0.72]'
              : 'scale-100 opacity-100'
          "
        >
          <div
            class="flex items-center justify-between gap-3 border-b border-border-default bg-bg-elevated/90 px-3 py-2.5 sm:px-4"
          >
            <div class="flex items-center gap-2 sm:gap-3">
              <span
                class="font-display text-[11px] font-bold tabular-nums text-accent-coral sm:text-xs"
              >
                LV {{ levelNumber }}
              </span>
              <span class="hidden h-3 w-px bg-border-default sm:block" aria-hidden="true" />
              <span
                class="font-display text-[10px] uppercase tracking-wider text-text-dim sm:text-[11px]"
              >
                endless
              </span>
            </div>
            <div class="flex min-w-0 flex-1 flex-col items-end gap-1 sm:max-w-[55%]">
              <div class="flex w-full items-center gap-2">
                <div class="h-1 min-w-0 flex-1 overflow-hidden bg-bg-deep">
                  <div
                    class="h-full bg-gradient-to-r from-accent-coral to-accent-amber transition-[width] duration-300 ease-out"
                    :style="{ width: progressPct + '%' }"
                  />
                </div>
                <span class="font-display text-[10px] tabular-nums text-text-secondary sm:text-xs">
                  {{ filledCount }}/{{ currentHoleCount }}
                </span>
              </div>
              <p class="truncate font-display text-[9px] text-text-dim sm:text-[10px]">
                Sau: <span class="text-accent-amber">{{ nextHoleCount }}</span> ô
              </p>
            </div>
          </div>

          <div class="relative min-h-[20rem] w-full touch-none select-none sm:min-h-[24rem]">
            <div ref="playAreaRef" class="relative min-h-[16rem] overflow-visible sm:min-h-[18rem]">
              <div
                v-for="h in holes"
                :key="'hole-' + h.id"
                class="pointer-events-none absolute z-0 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center"
                :style="{ left: h.xPct + '%', top: h.yPct + '%' }"
              >
                <div
                  class="flex items-center justify-center border border-border-default bg-bg-deep/90 shadow-inner shadow-black/50 ring-1 ring-accent-sky/20"
                  :style="{ width: holeOuterPx + 'px', height: holeOuterPx + 'px' }"
                  aria-hidden="true"
                >
                  <span
                    class="bg-black/80 ring-1 ring-border-default"
                    :style="{ width: holeInnerPx + 'px', height: holeInnerPx + 'px' }"
                  />
                </div>
              </div>

              <div
                v-for="p in patches"
                :key="'patch-' + p.id"
                class="absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center"
                :class="
                  p.onHole !== null
                    ? 'pointer-events-none touch-none'
                    : 'cursor-grab active:cursor-grabbing'
                "
                :style="{ left: p.xPct + '%', top: p.yPct + '%' }"
                @pointerdown="onPatchPointerDown($event, p)"
                @pointermove="onPatchPointerMove($event, p)"
                @pointerup="onPatchPointerUp($event, p)"
              >
                <div
                  class="box-border flex shrink-0 items-center justify-center rounded-full border-2 border-accent-amber/90 bg-accent-coral shadow-[0_4px_20px_rgb(0_0_0_/_0.45)] transition-transform duration-150"
                  :style="{ width: patchRadiusPx * 2 + 'px', height: patchRadiusPx * 2 + 'px' }"
                  :class="
                    dragPatchId === p.id
                      ? 'scale-110 ring-2 ring-accent-sky ring-offset-2 ring-offset-bg-deep'
                      : ''
                  "
                  aria-hidden="true"
                ></div>
              </div>
            </div>

            <div
              class="flex items-center justify-between gap-2 border-t border-dashed border-border-default bg-bg-deep/40 px-3 py-2 sm:px-4"
            >
              <span
                class="font-display text-[9px] font-semibold uppercase tracking-[0.18em] text-text-dim"
              >
                buffer
              </span>
              <span class="font-display text-[10px] tabular-nums text-text-secondary">
                {{ holes.length }} token
              </span>
            </div>
          </div>

          <div
            v-if="phase === 'levelComplete'"
            class="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-bg-deep/95 px-5 text-center backdrop-blur-[2px]"
          >
            <div
              class="flex size-14 items-center justify-center border border-accent-coral/40 bg-bg-elevated"
            >
              <Icon icon="lucide:check" class="size-7 text-accent-coral" aria-hidden="true" />
            </div>
            <p class="font-display text-lg font-bold tracking-tight text-text-primary sm:text-xl">
              Clear
            </p>
            <p class="max-w-[16rem] text-xs leading-relaxed text-text-secondary">
              Tầng {{ levelNumber }} xong. Đang mở layout tiếp —
              <span class="text-accent-amber">{{ nextHoleCount }}</span> ô.
            </p>
          </div>
        </div>
      </div>

      <div
        v-if="showPhilosophy"
        class="animate-fade-up animate-delay-2 mt-8 border border-border-default bg-bg-surface p-6 sm:p-8"
      >
        <div class="flex items-center justify-between gap-3 border-b border-border-default pb-4">
          <p class="font-display text-xs font-semibold uppercase tracking-[0.2em] text-accent-sky">
            Nhìn xa một nhịp
          </p>
          <button
            type="button"
            class="font-display text-[10px] uppercase tracking-wider text-text-dim hover:text-accent-coral"
            @click="closePhilosophy"
          >
            Đóng
          </button>
        </div>
        <p
          class="font-display mt-6 text-2xl font-bold leading-tight text-text-primary md:text-[1.75rem]"
        >
          Màn hình chỉ là một khung.
        </p>
        <p class="mt-3 text-sm leading-relaxed text-text-secondary">
          Game nhỏ thôi — nhưng đôi khi mình cần nhớ: còn cả ngày, cả phòng, cả thế giới bên ngoài
          tab này.
        </p>
        <p class="mt-4 text-sm text-accent-amber">Lùi một bước, thở chậm, rồi quay lại nếu muốn.</p>
        <p class="mt-6 font-display text-[10px] uppercase tracking-wider text-text-dim">
          Gợi ý: hít 4 nhịp · thở ra 6 nhịp
        </p>
      </div>

      <div class="animate-fade-up animate-delay-3 mt-8 flex justify-center">
        <button
          type="button"
          class="border border-border-default bg-transparent px-5 py-2.5 font-display text-[11px] font-semibold uppercase tracking-wider text-text-secondary transition-colors hover:border-accent-coral hover:text-accent-coral"
          @click="resetGame"
        >
          Chơi lại từ LV 1
        </button>
      </div>
    </div>
  </div>
</template>
