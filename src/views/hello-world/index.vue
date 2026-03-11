<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import {
  useLocalStorage,
  useClipboard,
  useEventListener,
  useMouse,
  useWindowSize,
  useOnline,
  useMediaQuery,
  useNow,
  useIntervalFn,
  refDebounced,
} from '@vueuse/core'

// --- Section 1: useLocalStorage ---
const userName = useLocalStorage('hello-world-name', '')
const favoriteColor = useLocalStorage('hello-world-color', '#FF6B4A')

// --- Section 2: useClipboard ---
const sampleCode = "import { useClipboard } from '@vueuse/core'"
const { copy, copied } = useClipboard()

// --- Section 3: useMouse + useEventListener ---
const { x: mouseX, y: mouseY } = useMouse()
const trackingArea = ref<HTMLElement | null>(null)
const clickCount = ref(0)
useEventListener(trackingArea, 'click', () => {
  clickCount.value++
})

const relativePos = computed(() => {
  if (!trackingArea.value) return { x: 0, y: 0 }
  const rect = trackingArea.value.getBoundingClientRect()
  return {
    x: Math.round(mouseX.value - rect.left),
    y: Math.round(mouseY.value - rect.top),
  }
})

// --- Section 4: useWindowSize + useMediaQuery ---
const { width: winWidth, height: winHeight } = useWindowSize()
const isMobile = useMediaQuery('(max-width: 640px)')
const isTablet = useMediaQuery('(min-width: 641px) and (max-width: 1024px)')
const isDesktop = useMediaQuery('(min-width: 1025px)')
const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

// --- Section 5: useOnline ---
const isOnline = useOnline()

// --- Section 6: useNow + useIntervalFn ---
const now = useNow({ interval: 1000 })
const counter = ref(0)
const { pause, resume, isActive } = useIntervalFn(() => {
  counter.value++
}, 1000)

function resetCounter() {
  counter.value = 0
}

// --- Section 7: refDebounced ---
const searchInput = ref('')
const debouncedSearch = refDebounced(searchInput, 500)
const debounceLog = ref<string[]>([])

let lastDebouncedValue = ''
useIntervalFn(() => {
  if (debouncedSearch.value !== lastDebouncedValue && debouncedSearch.value !== '') {
    lastDebouncedValue = debouncedSearch.value
    debounceLog.value = [
      `[${new Date().toLocaleTimeString('vi-VN')}] "${debouncedSearch.value}"`,
      ...debounceLog.value,
    ].slice(0, 5)
  }
}, 100)

// --- Section 8: Iconify Icons ---
interface IconSetInfo {
  name: string
  prefix: string
  icons: string[]
}

const iconSets: IconSetInfo[] = [
  {
    name: 'Lucide (mặc định)',
    prefix: 'lucide',
    icons: [
      'home',
      'settings',
      'heart',
      'search',
      'user',
      'star',
      'bell',
      'mail',
      'code',
      'terminal',
      'globe',
      'zap',
    ],
  },
  {
    name: 'Material Design Icons',
    prefix: 'mdi',
    icons: ['home', 'cog', 'heart', 'magnify', 'account', 'star'],
  },
  {
    name: 'Heroicons',
    prefix: 'heroicons',
    icons: ['home', 'cog-6-tooth', 'heart', 'magnifying-glass', 'user', 'star'],
  },
  {
    name: 'Phosphor',
    prefix: 'ph',
    icons: ['house', 'gear', 'heart', 'magnifying-glass', 'user', 'star'],
  },
  {
    name: 'Tabler',
    prefix: 'tabler',
    icons: ['home', 'settings', 'heart', 'search', 'user', 'star'],
  },
]

const selectedSize = ref(24)
const iconSizes = [16, 20, 24, 32, 40, 48]

const { copy: copyIcon, copied: iconCopied } = useClipboard()
const lastCopiedIcon = ref('')

function copyIconName(prefix: string, icon: string) {
  const name = `${prefix}:${icon}`
  copyIcon(name)
  lastCopiedIcon.value = name
}
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <!-- Hero -->
      <header class="mb-16 text-center">
        <h1
          class="font-display text-4xl min-[375px]:text-5xl sm:text-6xl font-bold text-accent-coral animate-fade-up"
        >
          VueUse & Iconify
        </h1>
        <p
          class="mt-4 text-text-secondary text-lg max-w-2xl mx-auto animate-fade-up animate-delay-2"
        >
          Trang demo tương tác — tham khảo cách sử dụng các composable
          <span class="text-accent-amber">VueUse</span> và icon
          <span class="text-accent-sky">Iconify</span> trước khi xây trang mới.
        </p>
        <p class="mt-2 text-text-dim text-sm animate-fade-up animate-delay-3">
          Mỗi phần bên dưới là một demo hoạt động — hãy thử tương tác!
        </p>
      </header>

      <!-- Section 1: useLocalStorage -->
      <section class="mb-16 scroll-reveal">
        <h2 class="font-display text-2xl font-semibold flex items-center gap-3 mb-6">
          <span class="text-accent-coral text-sm tracking-widest font-display">//</span>
          useLocalStorage
        </h2>
        <div class="border border-border-default bg-bg-surface p-6">
          <p class="text-text-secondary text-sm mb-4">
            Dữ liệu được lưu vào localStorage — thử nhập rồi reload trang, giá trị vẫn còn.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 mb-4">
            <div class="flex-1">
              <label class="block text-text-dim text-xs mb-1">Tên của bạn</label>
              <input
                v-model="userName"
                type="text"
                placeholder="Nhập tên..."
                class="w-full bg-bg-elevated border border-border-default px-3 py-2 text-sm text-text-primary placeholder:text-text-dim focus:border-accent-coral focus:outline-none transition"
              />
            </div>
            <div>
              <label class="block text-text-dim text-xs mb-1">Màu yêu thích</label>
              <input
                v-model="favoriteColor"
                type="color"
                class="h-9 w-16 bg-bg-elevated border border-border-default cursor-pointer"
              />
            </div>
          </div>
          <div v-if="userName" class="border border-border-default bg-bg-elevated p-4 text-center">
            <span class="font-display text-xl font-semibold" :style="{ color: favoriteColor }">
              Xin chào, {{ userName }}!
            </span>
          </div>
          <code class="block mt-3 text-xs text-text-dim font-mono">
            const name = useLocalStorage('key', '')
          </code>
        </div>
      </section>

      <!-- Section 2: useClipboard -->
      <section class="mb-16 scroll-reveal">
        <h2 class="font-display text-2xl font-semibold flex items-center gap-3 mb-6">
          <span class="text-accent-amber text-sm tracking-widest font-display">//</span>
          useClipboard
        </h2>
        <div class="border border-border-default bg-bg-surface p-6">
          <p class="text-text-secondary text-sm mb-4">
            Copy nội dung vào clipboard chỉ với một dòng. Trạng thái
            <code class="text-accent-amber">copied</code> tự động reset sau 1.5s.
          </p>
          <div class="flex items-stretch gap-2">
            <div
              class="flex-1 bg-bg-elevated border border-border-default px-4 py-2.5 font-mono text-sm text-text-secondary overflow-x-auto"
            >
              {{ sampleCode }}
            </div>
            <button
              class="border border-border-default bg-bg-surface px-4 text-sm transition flex items-center gap-2"
              :class="
                copied
                  ? 'border-green-500 text-green-400'
                  : 'text-text-secondary hover:border-accent-amber hover:text-text-primary'
              "
              @click="copy(sampleCode)"
            >
              <Icon :icon="copied ? 'lucide:check' : 'lucide:copy'" class="size-4" />
              {{ copied ? 'Đã copy' : 'Copy' }}
            </button>
          </div>
          <code class="block mt-3 text-xs text-text-dim font-mono">
            const { copy, copied } = useClipboard()
          </code>
        </div>
      </section>

      <!-- Section 3: useMouse + useEventListener -->
      <section class="mb-16 scroll-reveal">
        <h2 class="font-display text-2xl font-semibold flex items-center gap-3 mb-6">
          <span class="text-accent-sky text-sm tracking-widest font-display">//</span>
          useMouse + useEventListener
        </h2>
        <div class="border border-border-default bg-bg-surface p-6">
          <p class="text-text-secondary text-sm mb-4">
            Theo dõi vị trí chuột realtime và đếm click trong vùng bên dưới.
          </p>
          <!-- Desktop -->
          <div
            ref="trackingArea"
            class="hidden sm:block relative border border-border-default bg-bg-elevated cursor-crosshair overflow-hidden"
            style="min-height: 200px"
          >
            <div
              class="absolute inset-0 flex items-center justify-center text-text-dim text-sm pointer-events-none"
            >
              Di chuột và click trong vùng này
            </div>
            <div
              class="absolute top-3 left-3 font-mono text-xs text-text-secondary pointer-events-none space-y-1"
            >
              <div>
                x: <span class="text-accent-sky">{{ relativePos.x }}</span>
              </div>
              <div>
                y: <span class="text-accent-sky">{{ relativePos.y }}</span>
              </div>
              <div>
                clicks: <span class="text-accent-coral">{{ clickCount }}</span>
              </div>
            </div>
          </div>
          <!-- Mobile fallback -->
          <div class="sm:hidden border border-border-default bg-bg-elevated p-4 text-center">
            <p class="text-text-dim text-sm">
              <Icon icon="lucide:monitor" class="inline size-4 -mt-0.5" />
              Mở trên desktop để xem demo theo dõi chuột
            </p>
          </div>
          <code class="block mt-3 text-xs text-text-dim font-mono">
            const { x, y } = useMouse()
          </code>
        </div>
      </section>

      <!-- Section 4: useWindowSize + useMediaQuery -->
      <section class="mb-16 scroll-reveal">
        <h2 class="font-display text-2xl font-semibold flex items-center gap-3 mb-6">
          <span class="text-accent-coral text-sm tracking-widest font-display">//</span>
          useWindowSize + useMediaQuery
        </h2>
        <div class="border border-border-default bg-bg-surface p-6">
          <p class="text-text-secondary text-sm mb-4">
            Kích thước cửa sổ và media query reactive — thử resize browser.
          </p>
          <div class="font-mono text-3xl sm:text-4xl font-bold text-center mb-4">
            <span class="text-accent-coral">{{ winWidth }}</span>
            <span class="text-text-dim mx-1">&times;</span>
            <span class="text-accent-amber">{{ winHeight }}</span>
          </div>
          <div class="flex flex-wrap justify-center gap-2 mb-3">
            <span
              class="border px-3 py-1 text-xs font-mono transition"
              :class="
                isMobile
                  ? 'border-accent-sky bg-accent-sky/10 text-accent-sky'
                  : 'border-border-default text-text-dim'
              "
            >
              <Icon icon="lucide:smartphone" class="inline size-3 -mt-0.5 mr-1" />Mobile
            </span>
            <span
              class="border px-3 py-1 text-xs font-mono transition"
              :class="
                isTablet
                  ? 'border-accent-sky bg-accent-sky/10 text-accent-sky'
                  : 'border-border-default text-text-dim'
              "
            >
              <Icon icon="lucide:tablet" class="inline size-3 -mt-0.5 mr-1" />Tablet
            </span>
            <span
              class="border px-3 py-1 text-xs font-mono transition"
              :class="
                isDesktop
                  ? 'border-accent-sky bg-accent-sky/10 text-accent-sky'
                  : 'border-border-default text-text-dim'
              "
            >
              <Icon icon="lucide:monitor" class="inline size-3 -mt-0.5 mr-1" />Desktop
            </span>
          </div>
          <p v-if="prefersReducedMotion" class="text-center text-text-dim text-xs">
            <Icon icon="lucide:eye-off" class="inline size-3 -mt-0.5" /> prefers-reduced-motion: on
          </p>
          <code class="block mt-3 text-xs text-text-dim font-mono text-center">
            const { width, height } = useWindowSize()
          </code>
        </div>
      </section>

      <!-- Section 5: useOnline -->
      <section class="mb-16 scroll-reveal">
        <h2 class="font-display text-2xl font-semibold flex items-center gap-3 mb-6">
          <span class="text-accent-amber text-sm tracking-widest font-display">//</span>
          useOnline
        </h2>
        <div class="border border-border-default bg-bg-surface p-6">
          <p class="text-text-secondary text-sm mb-4">
            Phát hiện trạng thái mạng realtime — thử tắt WiFi để xem thay đổi.
          </p>
          <div class="flex items-center justify-center gap-3">
            <span class="relative flex size-3">
              <span
                class="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                :class="isOnline ? 'bg-green-400' : 'bg-red-400'"
              />
              <span
                class="relative inline-flex size-3 rounded-full"
                :class="isOnline ? 'bg-green-500' : 'bg-red-500'"
              />
            </span>
            <Icon
              :icon="isOnline ? 'lucide:wifi' : 'lucide:wifi-off'"
              class="size-5"
              :class="isOnline ? 'text-green-400' : 'text-red-400'"
            />
            <span
              class="font-display font-semibold"
              :class="isOnline ? 'text-green-400' : 'text-red-400'"
            >
              {{ isOnline ? 'Trực tuyến' : 'Ngoại tuyến' }}
            </span>
          </div>
          <code class="block mt-4 text-xs text-text-dim font-mono text-center">
            const isOnline = useOnline()
          </code>
        </div>
      </section>

      <!-- Section 6: useNow + useIntervalFn -->
      <section class="mb-16 scroll-reveal">
        <h2 class="font-display text-2xl font-semibold flex items-center gap-3 mb-6">
          <span class="text-accent-sky text-sm tracking-widest font-display">//</span>
          useNow + useIntervalFn
        </h2>
        <div class="border border-border-default bg-bg-surface p-6">
          <p class="text-text-secondary text-sm mb-4">
            Thời gian thực reactive và bộ đếm với khả năng pause/resume.
          </p>
          <div class="text-center mb-4">
            <div class="font-mono text-text-secondary text-sm">
              {{ now.toLocaleString('vi-VN') }}
            </div>
          </div>
          <div class="flex flex-col items-center gap-4">
            <div class="font-display text-5xl font-bold text-accent-sky tabular-nums">
              {{ counter }}
            </div>
            <div class="flex gap-2">
              <button
                class="border border-border-default bg-bg-surface px-4 py-2 text-sm transition flex items-center gap-2"
                :class="
                  isActive
                    ? 'hover:border-accent-amber hover:text-accent-amber text-text-secondary'
                    : 'hover:border-green-500 hover:text-green-400 text-text-secondary'
                "
                @click="isActive ? pause() : resume()"
              >
                <Icon :icon="isActive ? 'lucide:pause' : 'lucide:play'" class="size-4" />
                {{ isActive ? 'Tạm dừng' : 'Tiếp tục' }}
              </button>
              <button
                class="border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-accent-coral flex items-center gap-2"
                @click="resetCounter"
              >
                <Icon icon="lucide:rotate-ccw" class="size-4" />
                Reset
              </button>
            </div>
          </div>
          <code class="block mt-4 text-xs text-text-dim font-mono text-center">
            const { pause, resume, isActive } = useIntervalFn(callback, 1000)
          </code>
        </div>
      </section>

      <!-- Section 7: refDebounced -->
      <section class="mb-16 scroll-reveal">
        <h2 class="font-display text-2xl font-semibold flex items-center gap-3 mb-6">
          <span class="text-accent-coral text-sm tracking-widest font-display">//</span>
          refDebounced
        </h2>
        <div class="border border-border-default bg-bg-surface p-6">
          <p class="text-text-secondary text-sm mb-4">
            Debounce giá trị reactive — hữu ích cho search input, API call. Delay: 500ms.
          </p>
          <input
            v-model="searchInput"
            type="text"
            placeholder="Nhập gì đó..."
            class="w-full bg-bg-elevated border border-border-default px-3 py-2 text-sm text-text-primary placeholder:text-text-dim focus:border-accent-coral focus:outline-none transition mb-4"
          />
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div class="border border-border-default bg-bg-elevated p-3">
              <div class="text-text-dim text-xs mb-1">Giá trị gốc (realtime)</div>
              <div class="font-mono text-sm text-text-primary min-h-5 break-all">
                {{ searchInput || '—' }}
              </div>
            </div>
            <div class="border border-border-default bg-bg-elevated p-3">
              <div class="text-text-dim text-xs mb-1">Giá trị debounced (500ms)</div>
              <div class="font-mono text-sm text-accent-coral min-h-5 break-all">
                {{ debouncedSearch || '—' }}
              </div>
            </div>
          </div>
          <div v-if="debounceLog.length" class="border border-border-default bg-bg-elevated p-3">
            <div class="text-text-dim text-xs mb-2">Log (5 gần nhất)</div>
            <div
              v-for="(entry, i) in debounceLog"
              :key="i"
              class="font-mono text-xs text-text-secondary"
            >
              {{ entry }}
            </div>
          </div>
          <code class="block mt-3 text-xs text-text-dim font-mono">
            const debounced = refDebounced(source, 500)
          </code>
        </div>
      </section>

      <!-- Section 8: Iconify Icons -->
      <section class="mb-16 scroll-reveal">
        <h2 class="font-display text-2xl font-semibold flex items-center gap-3 mb-6">
          <span class="text-accent-amber text-sm tracking-widest font-display">//</span>
          Iconify Icons
        </h2>
        <div class="border border-border-default bg-bg-surface p-6">
          <p class="text-text-secondary text-sm mb-4">
            200,000+ icon từ 150+ bộ icon. Click vào icon để copy tên.
          </p>

          <!-- Size selector -->
          <div class="flex flex-wrap items-center gap-2 mb-6">
            <span class="text-text-dim text-xs">Kích thước:</span>
            <button
              v-for="size in iconSizes"
              :key="size"
              class="border px-2.5 py-1 text-xs font-mono transition"
              :class="
                selectedSize === size
                  ? 'border-accent-amber bg-accent-amber/10 text-accent-amber'
                  : 'border-border-default text-text-dim hover:border-accent-amber hover:text-text-secondary'
              "
              @click="selectedSize = size"
            >
              {{ size }}
            </button>
          </div>

          <!-- Copied toast -->
          <div
            v-if="iconCopied && lastCopiedIcon"
            class="mb-4 border border-green-500/30 bg-green-500/10 px-3 py-2 text-xs text-green-400 font-mono flex items-center gap-2"
          >
            <Icon icon="lucide:check" class="size-3" />
            Đã copy: {{ lastCopiedIcon }}
          </div>

          <!-- Icon sets -->
          <div v-for="set in iconSets" :key="set.prefix" class="mb-6 last:mb-0">
            <h3 class="text-text-secondary text-sm font-semibold mb-3">
              {{ set.name }}
              <span class="text-text-dim font-normal font-mono text-xs ml-1"
                >{{ set.prefix }}:</span
              >
            </h3>
            <div class="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
              <button
                v-for="icon in set.icons"
                :key="icon"
                class="border border-border-default bg-bg-elevated p-3 flex flex-col items-center gap-2 transition hover:border-accent-amber hover:bg-bg-elevated/80 cursor-pointer group"
                @click="copyIconName(set.prefix, icon)"
              >
                <Icon
                  :icon="`${set.prefix}:${icon}`"
                  :width="selectedSize"
                  :height="selectedSize"
                  class="text-text-secondary group-hover:text-accent-amber transition"
                />
                <span
                  class="text-text-dim text-[10px] font-mono leading-tight text-center break-all group-hover:text-text-secondary transition"
                >
                  {{ icon }}
                </span>
              </button>
            </div>
          </div>

          <code class="block mt-4 text-xs text-text-dim font-mono">
            &lt;Icon icon="lucide:home" class="size-5" /&gt;
          </code>
        </div>
      </section>

      <!-- Back to Home -->
      <div class="text-center">
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-5 py-2.5 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
        >
          <Icon icon="lucide:arrow-left" class="size-4" />
          Về trang chủ
        </RouterLink>
      </div>
    </div>
  </div>
</template>
