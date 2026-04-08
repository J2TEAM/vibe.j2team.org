<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useRafFn, useWindowSize } from '@vueuse/core'
import { Icon } from '@iconify/vue'

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
const RADIUS = 12

interface Hop {
  comment: string
  ts: number
}

interface PhysDot {
  x: number
  y: number
  vx: number
  vy: number
}

const route = useRoute()
const router = useRouter()

const { width: svgW, height: svgH } = useWindowSize()

const hops = ref<Hop[]>([])
const chainId = ref('')
const comment = ref('')
const loading = ref(true)
const sharing = ref(false)
const shared = ref(false)
const alreadyShared = ref(false) // true when restored from localStorage on load
const panelOpen = ref(true)
const error = ref('')
const dots = ref<PhysDot[]>([])

function initDots(count: number) {
  const w = svgW.value || 400
  const h = svgH.value || 500
  dots.value = Array.from({ length: count }, () => ({
    x: RADIUS + Math.random() * (w - RADIUS * 2),
    y: RADIUS + Math.random() * (h - RADIUS * 2),
    vx: (Math.random() - 0.5) * 1.5,
    vy: (Math.random() - 0.5) * 1.5,
  }))
}

// "you" dot — initialized to window center
const youDot = ref<PhysDot>({
  x: (svgW.value || 400) / 2,
  y: (svgH.value || 500) / 2,
  vx: 1.1,
  vy: 0.8,
})

useRafFn(() => {
  const w = svgW.value || 400
  const h = svgH.value || 500
  // bounce all hop dots
  for (const d of dots.value) {
    d.x += d.vx
    d.y += d.vy
    if (d.x < RADIUS) {
      d.x = RADIUS
      d.vx = Math.abs(d.vx)
    }
    if (d.x > w - RADIUS) {
      d.x = w - RADIUS
      d.vx = -Math.abs(d.vx)
    }
    if (d.y < RADIUS) {
      d.y = RADIUS
      d.vy = Math.abs(d.vy)
    }
    if (d.y > h - RADIUS) {
      d.y = h - RADIUS
      d.vy = -Math.abs(d.vy)
    }
  }
  // bounce you dot
  const d = youDot.value
  d.x += d.vx
  d.y += d.vy
  if (d.x < RADIUS) {
    d.x = RADIUS
    d.vx = Math.abs(d.vx)
  }
  if (d.x > w - RADIUS) {
    d.x = w - RADIUS
    d.vx = -Math.abs(d.vx)
  }
  if (d.y < RADIUS) {
    d.y = RADIUS
    d.vy = Math.abs(d.vy)
  }
  if (d.y > h - RADIUS) {
    d.y = h - RADIUS
    d.vy = -Math.abs(d.vy)
  }
})

async function createChain(): Promise<string> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/truyen_tay_chains`, {
    method: 'POST',
    headers: API_HEADERS,
    body: JSON.stringify({ hops: [] }),
  })
  if (!res.ok) throw new Error('Không thể tạo chain')
  const data = await res.json()
  return data[0].id as string
}

async function fetchChain(id: string): Promise<Hop[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/truyen_tay_chains?id=eq.${id}&select=hops`, {
    headers: API_HEADERS,
  })
  if (!res.ok) throw new Error('Không tìm thấy chain')
  const data = await res.json()
  if (!data.length) throw new Error('Chain không tồn tại')
  return (data[0].hops ?? []) as Hop[]
}

async function updateChain(id: string, newHops: Hop[]): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/truyen_tay_chains?id=eq.${id}`, {
    method: 'PATCH',
    headers: API_HEADERS,
    body: JSON.stringify({ hops: newHops }),
  })
  if (!res.ok) throw new Error('Không thể cập nhật chain')
}

function lsKey(id: string) {
  return `truyen-tay:${id}`
}

onMounted(async () => {
  const idParam = route.query.id as string | undefined
  try {
    if (idParam) {
      chainId.value = idParam
      const fetched = await fetchChain(idParam)
      hops.value = fetched
      if (localStorage.getItem(lsKey(idParam))) {
        shared.value = true
        alreadyShared.value = true
      }
    } else {
      const id = await createChain()
      chainId.value = id
      await router.replace({ query: { id } })
    }
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Đã có lỗi xảy ra'
  } finally {
    loading.value = false
    initDots(hops.value.length)
  }
})

const chainUrl = computed(() => {
  if (!chainId.value) return ''
  const base = window.location.origin + window.location.pathname
  return `${base}?id=${chainId.value}`
})

const hopCount = computed(() => hops.value.length)

async function shareChain() {
  if (sharing.value) return
  sharing.value = true
  error.value = ''
  try {
    const newHop: Hop = {
      comment: comment.value.trim().slice(0, 40),
      ts: Date.now(),
    }
    const updated = [...hops.value, newHop]
    await updateChain(chainId.value, updated)
    hops.value = updated
    dots.value.push({
      x: youDot.value.x + (Math.random() - 0.5) * 40,
      y: youDot.value.y + (Math.random() - 0.5) * 40,
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5,
    })
    comment.value = ''
    shared.value = true
    localStorage.setItem(lsKey(chainId.value), '1')
    await copyUrl()
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Đã có lỗi xảy ra'
  } finally {
    sharing.value = false
  }
}

async function copyUrl() {
  try {
    await navigator.clipboard.writeText(chainUrl.value)
  } catch {
    // fallback: do nothing
  }
}

// dot colors
function dotColor(idx: number): string {
  const last = hops.value.length - 1
  if (idx === last) return '#FFB830' // accent-amber — last hop
  return '#1E2F42' // bg-elevated — older
}

const commentLen = computed(() => comment.value.length)
const showInfo = ref(false)

function bubbleWidth(text: string): number {
  return Math.max(44, Math.min(120, text.length * 6 + 20))
}
</script>

<template>
  <div class="font-body relative min-h-screen bg-bg-deep text-text-primary">
    <!-- Header -->
    <div class="relative z-10 mx-auto max-w-6xl px-4 pb-4 pt-8">
      <RouterLink
        to="/"
        class="absolute left-4 top-8 inline-flex items-center gap-1.5 text-sm text-text-dim transition hover:text-text-primary"
      >
        <Icon icon="lucide:arrow-left" class="size-4" />
        <span class="hidden sm:inline">Trang chủ</span>
      </RouterLink>
      <div class="text-center">
        <h1
          class="inline-flex items-center gap-1.5 font-display text-2xl font-bold text-accent-coral"
        >
          Truyền Tay
          <button
            class="flex size-4 items-center justify-center rounded-full border border-accent-coral/40 text-[10px] text-accent-coral/60 transition hover:border-accent-coral hover:text-accent-coral"
            @click="showInfo = !showInfo"
          >
            ?
          </button>
        </h1>
        <p class="text-xs text-text-dim">Thử nghiệm lan truyền - Mỗi người một câu!</p>
        <p class="mt-2 text-xs text-text-dim">
          đã truyền tay
          <span class="font-display text-3xl font-bold text-text-primary leading-none">{{
            hopCount
          }}</span>
          lần
        </p>
      </div>
    </div>

    <!-- Info popover -->
    <Transition name="info">
      <div
        v-if="showInfo"
        class="fixed inset-0 z-50 flex items-center justify-center bg-bg-deep/70 px-4 backdrop-blur-sm"
        @click.self="showInfo = false"
      >
        <div class="w-full max-w-sm border border-border-default bg-bg-surface p-5 shadow-xl">
          <div class="mb-3 flex items-center justify-between">
            <span class="font-display font-semibold text-accent-coral">Truyền Tay là gì?</span>
            <button
              class="text-text-dim transition hover:text-text-primary"
              @click="showInfo = false"
            >
              <Icon icon="lucide:x" class="size-4" />
            </button>
          </div>
          <div class="space-y-3 text-sm text-text-secondary">
            <p>
              Một thử nghiệm xã hội đơn giản: link này được truyền từ người này sang người khác —
              mỗi người để lại một câu, rồi gửi tiếp cho ai đó.
            </p>
            <div>
              <p class="mb-1 font-semibold text-text-primary">Cách tham gia</p>
              <ol class="list-decimal space-y-1 pl-4 text-text-dim">
                <li>Viết một câu ngắn (tuỳ chọn)</li>
                <li>Nhấn <span class="text-accent-coral">Truyền tay →</span></li>
                <li>Gửi link được copy cho ít nhất một người</li>
              </ol>
            </div>
            <div>
              <p class="mb-1 font-semibold text-text-primary">Tính vào số đếm</p>
              <ul class="list-disc space-y-1 pl-4 text-text-dim">
                <li>Mỗi người nhấn "Truyền tay" từ link nhận được</li>
                <li>Gửi tiếp cho người khác — không phải gửi lại chính mình</li>
              </ul>
            </div>
            <div>
              <p class="mb-1 font-semibold text-text-primary">Không tính</p>
              <ul class="list-disc space-y-1 pl-4 text-text-dim">
                <li>Reload trang cùng link — hệ thống nhớ bạn đã tham gia</li>
                <li>Tự gửi link cho chính mình nhiều lần</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Loading -->
    <div v-if="loading" class="flex min-h-[60vh] items-center justify-center">
      <span class="animate-pulse text-text-dim">Đang kết nối...</span>
    </div>

    <!-- Error -->
    <div v-else-if="error && !chainId" class="flex flex-1 items-center justify-center px-6">
      <p class="text-center text-red-400">{{ error }}</p>
    </div>

    <!-- Main -->
    <template v-else>
      <!-- SVG Physics canvas — fixed fullscreen -->
      <div class="pointer-events-none fixed inset-0 z-0">
        <svg class="h-full w-full">
          <!-- Lines between consecutive hops -->
          <template v-for="(d, i) in dots" :key="`line-${i}`">
            <line
              v-if="i < dots.length - 1 && dots[i + 1]"
              :x1="d.x"
              :y1="d.y"
              :x2="(dots[i + 1] as PhysDot).x"
              :y2="(dots[i + 1] as PhysDot).y"
              stroke="#253549"
              stroke-width="1.5"
            />
          </template>
          <!-- Line from last hop dot to you dot -->
          <line
            v-if="dots.length > 0 && dots[dots.length - 1]"
            :x1="(dots[dots.length - 1] as PhysDot).x"
            :y1="(dots[dots.length - 1] as PhysDot).y"
            :x2="youDot.x"
            :y2="youDot.y"
            stroke="#253549"
            stroke-width="1.5"
            stroke-dasharray="4 3"
          />

          <!-- Hop dots + always-on thought bubbles -->
          <g v-for="(d, i) in dots" :key="`dot-${i}`">
            <!-- thought bubble above dot -->
            <g pointer-events="none">
              <rect
                :x="d.x - bubbleWidth(hops[i]?.comment || `#${i + 1}`) / 2"
                :y="d.y - RADIUS - 26"
                :width="bubbleWidth(hops[i]?.comment || `#${i + 1}`)"
                height="20"
                rx="4"
                fill="#162232"
                stroke="#253549"
                stroke-width="1"
              />
              <polygon
                :points="`${d.x - 4},${d.y - RADIUS - 6} ${d.x + 4},${d.y - RADIUS - 6} ${d.x},${d.y - RADIUS - 1}`"
                fill="#162232"
              />
              <text
                :x="d.x"
                :y="d.y - RADIUS - 12"
                text-anchor="middle"
                font-size="9"
                fill="#f0ede6"
              >
                {{ hops[i]?.comment || `#${i + 1}` }}
              </text>
            </g>
            <!-- dot -->
            <circle
              :cx="d.x"
              :cy="d.y"
              :r="RADIUS"
              :fill="dotColor(i)"
              stroke="#253549"
              stroke-width="1"
            />
            <text
              :x="d.x"
              :y="d.y + 4"
              text-anchor="middle"
              font-size="9"
              fill="#F0EDE6"
              pointer-events="none"
            >
              {{ i + 1 }}
            </text>
          </g>

          <!-- "You" dot + thought bubble -->
          <g>
            <g pointer-events="none">
              <rect
                :x="youDot.x - bubbleWidth(comment || 'ghi chú của bạn...') / 2"
                :y="youDot.y - RADIUS - 26"
                :width="bubbleWidth(comment || 'ghi chú của bạn...')"
                height="20"
                rx="4"
                fill="#1a0a0e"
                stroke="#ff6b4a"
                stroke-width="1"
              />
              <polygon
                :points="`${youDot.x - 4},${youDot.y - RADIUS - 6} ${youDot.x + 4},${youDot.y - RADIUS - 6} ${youDot.x},${youDot.y - RADIUS - 1}`"
                fill="#1a0a0e"
              />
              <text
                :x="youDot.x"
                :y="youDot.y - RADIUS - 12"
                text-anchor="middle"
                font-size="9"
                fill="#ff6b4a"
              >
                {{ comment || (shared ? 'Ghi chú tiếp theo...' : 'ghi chú của bạn...') }}
              </text>
            </g>
            <circle
              :cx="youDot.x"
              :cy="youDot.y"
              :r="RADIUS"
              fill="#FF6B4A"
              stroke="#FF6B4A"
              stroke-width="1.5"
              stroke-dasharray="3 2"
            />
            <text
              :x="youDot.x"
              :y="youDot.y + 4"
              text-anchor="middle"
              font-size="9"
              fill="#0F1923"
              pointer-events="none"
            >
              bạn
            </text>
          </g>
        </svg>
      </div>

      <!-- Bottom panel -->
      <div
        class="fixed bottom-0 left-0 right-0 z-10 border-t border-border-default bg-bg-surface/90 backdrop-blur-sm"
      >
        <!-- Toggle tab -->
        <button
          class="absolute -top-7 right-4 flex items-center gap-1 border border-b-0 border-border-default bg-bg-surface/90 px-3 py-1 text-xs text-text-dim transition hover:text-text-primary"
          @click="panelOpen = !panelOpen"
        >
          <Icon :icon="panelOpen ? 'lucide:chevron-down' : 'lucide:chevron-up'" class="size-3" />
          {{ panelOpen ? 'Thu gọn' : 'Mở rộng' }}
        </button>

        <div v-if="panelOpen" class="px-4 py-4">
          <!-- Status -->
          <div v-if="shared && !alreadyShared" class="mb-3 text-right text-sm text-accent-sky">
            Đã sao chép link!
          </div>

          <!-- Error inline -->
          <p v-if="error" class="mb-2 text-sm text-red-400">{{ error }}</p>

          <template v-if="!shared">
            <!-- Comment input -->
            <div class="mb-3">
              <div class="mb-1 flex items-center justify-between text-xs text-text-dim">
                <label>Ghi chú của bạn (tuỳ chọn)</label>
                <span :class="commentLen > 35 ? 'text-accent-amber' : ''">{{ commentLen }}/40</span>
              </div>
              <input
                v-model="comment"
                maxlength="40"
                placeholder="Một câu ngắn thôi..."
                class="w-full border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder-text-dim outline-none transition focus:border-accent-coral"
              />
            </div>

            <!-- Share button -->
            <button
              :disabled="sharing"
              class="w-full border border-accent-coral bg-accent-coral/10 py-2.5 text-sm font-semibold text-accent-coral transition hover:bg-accent-coral hover:text-bg-deep disabled:opacity-40"
              @click="shareChain"
            >
              <span v-if="sharing">Đang truyền...</span>
              <span v-else>Truyền tay →</span>
            </button>
          </template>

          <template v-else>
            <p class="mb-3 text-center text-xs text-accent-amber">
              Bạn đã truyền tay link này rồi — hãy gửi cho người tiếp theo!
            </p>
            <!-- Copy again -->
            <button
              class="w-full border border-border-default bg-bg-elevated py-2.5 text-sm font-semibold text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
              @click="copyUrl"
            >
              Copy link lần nữa
            </button>
          </template>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.info-enter-active,
.info-leave-active {
  transition: opacity 0.15s ease;
}
.info-enter-active > div,
.info-leave-active > div {
  transition:
    transform 0.15s ease,
    opacity 0.15s ease;
}
.info-enter-from,
.info-leave-to {
  opacity: 0;
}
.info-enter-from > div,
.info-leave-to > div {
  transform: scale(0.95);
  opacity: 0;
}
</style>
