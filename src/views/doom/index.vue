<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useHead } from '@unhead/vue'
import { useFullscreen, useMediaQuery, useScriptTag } from '@vueuse/core'

type DosEvent = 'bnd-play' | 'ci-ready' | 'emu-ready' | 'fullscreen-change' | 'loading' | 'open-key'

interface DosPlayer {
  stop(): Promise<void>
}

interface DosOptions {
  autoStart?: boolean
  mouseCapture?: boolean
  noCloud?: boolean
  noNetworking?: boolean
  onEvent?: (event: DosEvent, data?: number) => void
  renderAspect?: '4/3' | 'Fit'
  url?: string
  workerThread?: boolean
}

type DosFactory = (element: HTMLDivElement, options?: DosOptions) => DosPlayer

const isMobile = useMediaQuery('(max-width: 768px)')
const isLandscape = useMediaQuery('(orientation: landscape)')
const isLoaded = ref(false)
const isLoading = ref(true)
const loadProgress = ref(0)
const error = ref<string | null>(null)
const dosContainer = ref<HTMLDivElement | null>(null)
const gameShell = ref<HTMLDivElement | null>(null)
const showDesktopControls = ref(false)
const showMobileControls = ref(true)

const JS_DOS_BASE_URL = 'https://v8.js-dos.com/latest/'
const JS_DOS_BUNDLE_URL = '/doom/doom.jsdos'
const UI_VERSION_MOBILE = 'UI v4 mobile-ready'
const UI_VERSION_DESKTOP = 'UI desktop'

let dosInstance: DosPlayer | null = null
declare global {
  interface Window {
    Dos?: DosFactory
    emulators?: {
      pathPrefix?: string
    }
  }
}

const controlsVisible = computed(() =>
  isMobile.value ? showMobileControls.value : showDesktopControls.value,
)
const controlsToggleLabelDesktop = computed(() =>
  showDesktopControls.value ? 'Ẩn hướng dẫn điều khiển' : 'Hiện hướng dẫn điều khiển',
)
const controlsToggleLabelMobile = computed(() =>
  showMobileControls.value ? 'Ẩn hướng dẫn' : 'Hiện hướng dẫn',
)
const uiVersionLabel = computed(() => (isMobile.value ? UI_VERSION_MOBILE : UI_VERSION_DESKTOP))
const mobileStatusLabel = computed(() => {
  if (!isLandscape.value) {
    return 'Xoay ngang điện thoại để nhìn rõ hơn'
  }

  return 'Chạm vào khung game để hiện touch controls'
})

const { isFullscreen, toggle: toggleFullscreen } = useFullscreen(gameShell)

useHead({
  title: 'DOOM - Game tuổi thơ huyền thoại',
  link: [
    {
      rel: 'stylesheet',
      href: `${JS_DOS_BASE_URL}js-dos.css`,
    },
  ],
})

const { load: loadJsDos } = useScriptTag(`${JS_DOS_BASE_URL}js-dos.js`, undefined, {
  manual: true,
})

async function initDoom() {
  try {
    error.value = null
    isLoaded.value = false
    isLoading.value = true
    loadProgress.value = 10

    if (dosInstance) {
      await dosInstance.stop()
      dosInstance = null
    }

    await loadJsDos()

    loadProgress.value = 30
    await nextTick()

    if (!window.Dos) {
      throw new Error('js-dos not initialized')
    }

    loadProgress.value = 50

    if (!dosContainer.value) {
      throw new Error('DOOM container not ready')
    }

    dosInstance = window.Dos(dosContainer.value, {
      url: JS_DOS_BUNDLE_URL,
      autoStart: true,
      mouseCapture: !isMobile.value,
      noCloud: true,
      noNetworking: true,
      renderAspect: '4/3',
      workerThread: true,
      onEvent: (event) => {
        if (event === 'emu-ready') {
          loadProgress.value = 80
        }

        if (event === 'ci-ready') {
          loadProgress.value = 100
          isLoaded.value = true
          isLoading.value = false
        }
      },
    })
    loadProgress.value = 60
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Unknown error'
    isLoading.value = false
  }
}

onMounted(() => {
  void initDoom()
})

async function stopDoom() {
  if (!dosInstance) {
    return
  }

  try {
    await dosInstance.stop()
  } catch {
    // ignore cleanup errors from third-party player
  } finally {
    dosInstance = null
  }
}

onUnmounted(() => {
  void stopDoom()
})

function handleToggleControls() {
  showDesktopControls.value = !showDesktopControls.value
}

function handleToggleMobileControls() {
  showMobileControls.value = !showMobileControls.value
}

async function handleToggleFullscreen() {
  await toggleFullscreen()
}
</script>

<template>
  <div class="relative min-h-screen bg-bg-deep text-text-primary font-body flex flex-col">
    <!-- Header -->
    <header class="border-b border-border-default bg-bg-surface px-4 py-3 sm:py-4">
      <div class="mx-auto w-full max-w-4xl">
        <!-- Title row — always centered -->
        <div class="text-center mb-3 sm:mb-0">
          <h1 class="font-display text-xl font-bold tracking-wide text-accent-coral">DOOM</h1>
          <p class="text-xs text-text-dim">Game tuổi thơ huyền thoại</p>
          <div class="mt-1.5 flex items-center justify-center gap-2 text-[11px] text-text-dim">
            <span class="border border-border-default bg-bg-deep px-2 py-0.5">{{
              uiVersionLabel
            }}</span>
            <span class="hidden sm:inline font-mono">vibe.j2team.org</span>
          </div>
        </div>

        <!-- Bottom row: back button (mobile: full width, desktop: left) + controls (desktop only) -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <RouterLink
            to="/"
            class="inline-flex self-start shrink-0 items-center gap-2 whitespace-nowrap border border-border-default bg-bg-deep px-3 py-2 text-sm font-medium text-text-secondary transition hover:border-accent-coral hover:bg-bg-elevated hover:text-text-primary"
            aria-label="Về trang chủ"
          >
            <Icon icon="lucide:arrow-left" class="size-4" />
            <span class="whitespace-nowrap leading-none">Về trang chủ</span>
          </RouterLink>

          <button
            v-if="!isMobile"
            class="inline-flex shrink-0 items-center gap-2 border border-accent-amber/40 bg-bg-elevated px-3 py-2 text-sm font-medium text-text-primary transition hover:border-accent-amber hover:bg-bg-surface"
            :aria-label="controlsToggleLabelDesktop"
            @click="handleToggleControls"
          >
            <span
              class="inline-flex size-7 items-center justify-center border border-border-default bg-bg-deep text-accent-amber"
            >
              <Icon :icon="showDesktopControls ? 'lucide:eye-off' : 'lucide:eye'" class="size-4" />
            </span>
            <span>{{ controlsToggleLabelDesktop }}</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Mobile tip -->
    <div
      v-if="isMobile"
      class="border-b border-border-default bg-bg-elevated px-4 py-2.5 text-xs text-text-dim text-center sm:hidden"
    >
      Xoay ngang điện thoại để chơi dễ hơn
    </div>

    <!-- Game Container -->
    <main class="flex-1 flex flex-col items-center justify-center p-4">
      <!-- Error State -->
      <div v-if="error" class="text-center max-w-md animate-fade-up">
        <Icon icon="lucide:alert-triangle" class="size-16 text-red-500 mx-auto mb-4" />
        <h2 class="font-display text-xl text-accent-coral mb-2">Lỗi</h2>
        <p class="text-text-secondary mb-4">{{ error }}</p>
        <button
          class="border border-accent-coral text-accent-coral px-4 py-2 hover:bg-accent-coral hover:text-bg-deep transition"
          @click="initDoom"
        >
          Thử lại
        </button>
      </div>

      <!-- Game Canvas -->
      <div v-else class="w-full max-w-4xl">
        <div
          v-if="isMobile && isLoaded"
          class="mb-4 border border-border-default bg-bg-surface p-3 animate-fade-up"
        >
          <div class="flex items-start gap-3 text-sm text-text-secondary">
            <Icon icon="lucide:smartphone" class="mt-0.5 size-4 shrink-0 text-accent-amber" />
            <div class="space-y-1">
              <p class="font-medium text-text-primary">{{ mobileStatusLabel }}</p>
              <p>Nhấn toàn màn hình để có vùng chơi lớn hơn và vuốt dễ hơn.</p>
            </div>
          </div>
        </div>

        <div ref="gameShell" class="relative">
          <div
            ref="dosContainer"
            class="w-full aspect-[4/3] bg-black border border-border-default"
            style="image-rendering: pixelated"
          />

          <div
            v-if="isLoading"
            class="absolute inset-0 flex flex-col items-center justify-center bg-bg-deep/95 text-center animate-fade-up"
          >
            <div class="mb-8">
              <Icon
                icon="game-icons:skull-trophy"
                class="size-20 text-accent-coral mx-auto animate-pulse"
              />
            </div>
            <p class="text-text-secondary mb-6 font-display text-lg">Đang tải DOOM...</p>
            <div
              class="w-56 sm:w-64 h-1.5 bg-bg-surface border border-border-default overflow-hidden"
            >
              <div
                class="h-full bg-accent-coral animate-pulse transition-all duration-500"
                :style="{ width: `${loadProgress}%` }"
              />
            </div>
            <p class="text-text-dim text-sm mt-3 font-mono">{{ loadProgress }}%</p>
          </div>
        </div>

        <div v-if="isMobile && isLoaded" class="mt-4 grid grid-cols-2 gap-3">
          <button
            class="inline-flex items-center justify-center gap-2 border border-border-default bg-bg-surface px-4 py-3 text-sm font-medium text-text-secondary transition hover:border-accent-amber hover:text-text-primary"
            :title="isFullscreen ? 'Thoát toàn màn hình' : 'Bật toàn màn hình'"
            @click="handleToggleFullscreen"
          >
            <Icon :icon="isFullscreen ? 'lucide:minimize' : 'lucide:maximize'" class="size-4" />
            <span>{{ isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình' }}</span>
          </button>

          <button
            class="inline-flex items-center justify-center gap-2 border border-border-default bg-bg-surface px-4 py-3 text-sm font-medium text-text-secondary transition hover:border-accent-amber hover:text-text-primary"
            :title="controlsToggleLabelMobile"
            @click="handleToggleMobileControls"
          >
            <Icon :icon="showMobileControls ? 'lucide:eye-off' : 'lucide:eye'" class="size-4" />
            <span>{{ controlsToggleLabelMobile }}</span>
          </button>
        </div>

        <!-- Controls Info (Desktop) -->
        <div
          v-if="controlsVisible && !isMobile && isLoaded"
          class="mt-4 border border-border-default bg-bg-surface p-4"
        >
          <h3 class="font-display text-lg text-accent-amber mb-3 flex items-center gap-2">
            <Icon icon="lucide:keyboard" class="size-5" />
            Điều khiển
          </h3>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <span class="text-text-dim">Di chuyển</span>
              <p class="text-text-secondary font-mono">WASD / Mũi tên</p>
            </div>
            <div>
              <span class="text-text-dim">Bắn</span>
              <p class="text-text-secondary font-mono">Space / Ctrl</p>
            </div>
            <div>
              <span class="text-text-dim">Xoay</span>
              <p class="text-text-secondary font-mono">← →</p>
            </div>
            <div>
              <span class="text-text-dim">Nâng cao</span>
              <p class="text-text-secondary font-mono">Enter / Tab</p>
            </div>
          </div>
        </div>

        <!-- Mobile Controls -->
        <div v-if="controlsVisible && isMobile && isLoaded" class="mt-4">
          <div class="border border-border-default bg-bg-surface p-4">
            <h3 class="font-display text-base text-accent-amber mb-3 flex items-center gap-2">
              <Icon icon="lucide:gamepad-2" class="size-5" />
              Hướng dẫn chơi trên mobile
            </h3>
            <div class="space-y-3 text-sm text-text-secondary">
              <p>Chạm vào màn hình game để js-dos hiện touch controls.</p>
              <p>Vuốt ở nửa trái để di chuyển, chạm ở nửa phải để thao tác và bắn.</p>
              <p>Nếu điều khiển chưa hiện, thử bật toàn màn hình rồi chạm lại vào khung game.</p>
              <div class="flex items-center gap-2 text-text-dim">
                <Icon icon="lucide:gamepad" class="size-4" />
                <span>Kết nối tay cầm Bluetooth sẽ cho trải nghiệm tốt hơn.</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Game Info -->
        <div v-if="isLoaded" class="mt-4 text-center">
          <p class="text-text-dim text-xs">
            Sử dụng <span class="text-accent-amber font-mono">IDDQD</span> để bất tử |
            <span class="text-accent-amber font-mono">IDKFA</span> để lấy vũ khí
          </p>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="p-4 border-t border-border-default bg-bg-surface text-center">
      <p class="text-text-dim text-xs">
        Powered by
        <a
          href="https://js-dos.com"
          target="_blank"
          rel="noopener noreferrer"
          class="text-accent-sky hover:underline"
        >
          js-dos
        </a>
        v8 | Game data from
        <a
          href="https://dos.zone"
          target="_blank"
          rel="noopener noreferrer"
          class="text-accent-sky hover:underline"
        >
          DOS.zone
        </a>
      </p>
    </footer>
  </div>
</template>
