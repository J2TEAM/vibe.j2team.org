<script setup lang="ts">
import {
  ref,
  defineAsyncComponent,
  onMounted,
  onUnmounted,
  computed,
  nextTick,
  watch,
  type Component,
} from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BackToTop from '@/components/BackToTop.vue'
import VibeUniverse from './components/VibeUniverse.vue'

const route = useRoute()
const router = useRouter()

// Page from query
const pageName = computed(() => route.query.page as string | undefined)

// Dynamic import page component
const PageComponent = computed(() => {
  if (!pageName.value) return null
  const componentPath = `/src/views/${pageName.value}/index.vue`
  return defineAsyncComponent({
    loader: async () => {
      try {
        const modules = import.meta.glob('@/views/*/index.vue')
        const loader = modules[componentPath]
        if (loader) {
          return (await loader()) as Promise<Component>
        }
      } catch (e) {
        console.error('Failed to load:', e)
      }
      return { template: '<div class="p-8 text-center text-text-dim">Page not found</div>' }
    },
  })
})

// Home page components
const HeroSection = defineAsyncComponent(() => import('@/components/home/HeroSection.vue'))
const PagesGrid = defineAsyncComponent(() => import('@/components/home/PagesGrid.vue'))
const TechStackSection = defineAsyncComponent(
  () => import('@/components/home/TechStackSection.vue'),
)
const ContributeSection = defineAsyncComponent(
  () => import('@/components/home/ContributeSection.vue'),
)
const RulesSection = defineAsyncComponent(() => import('@/components/home/RulesSection.vue'))
const ProductsSection = defineAsyncComponent(() => import('@/components/home/ProductsSection.vue'))
const SponsorsSection = defineAsyncComponent(() => import('@/components/home/SponsorsSection.vue'))
const SiteFooter = defineAsyncComponent(() => import('@/components/home/SiteFooter.vue'))

// State
const isFlipped = ref(true) // mặc định lật ngược
const showPopup = ref(true)
const keyCaptured = ref(false)
const isMobile = ref(false)
const customKey = ref('j')
const progress = ref(0)

const easterEggEnabled = ref(false)
const easterEggShown = ref(false)
const showEasterEgg = ref(false)
const showEasterEggIntro = ref(false)
let progressInterval: ReturnType<typeof setInterval> | null = null

// Detect mobile
function detectMobile() {
  isMobile.value = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  )
}

// Desktop: Giữ custom key để flip lại, buông để lật ngược
function handleKeyDown(e: KeyboardEvent) {
  const key = e.key.toLowerCase()

  // Easter egg
  if (key === 'j' && easterEggEnabled.value && !showPopup.value) {
    openEasterEgg()
    return
  }

  // Nếu nhấn phím khác 'j' trong khi đang chọn key -> tắt easter egg
  if (key !== 'j' && showPopup.value && !keyCaptured.value) {
    easterEggEnabled.value = false
  }

  // Nếu popup đang hiển thị và chưa capture key -> capture key
  if (showPopup.value && !isMobile.value && !keyCaptured.value) {
    customKey.value = key
    keyCaptured.value = true
    localStorage.setItem('mirror-custom-key', customKey.value)

    // Enable easter egg nếu nhấn đúng phím j
    if (key === 'j') {
      easterEggEnabled.value = true
    }

    // Start progress bar - 1 giây
    progress.value = 0
    const totalTime = 1000 // 1 second
    const intervalTime = 20 // update every 20ms
    const steps = totalTime / intervalTime
    const progressPerStep = 100 / steps

    progressInterval = setInterval(() => {
      progress.value += progressPerStep
      if (progress.value >= 100) {
        progress.value = 100
        showPopup.value = false
        if (progressInterval) {
          clearInterval(progressInterval)
          progressInterval = null
        }
      }
    }, intervalTime)
    return
  }

  // Nếu đã capture key rồi nhưng user nhấn lại -> chỉ tiếp tục progress nếu đúng phím đã chọn
  if (showPopup.value && !isMobile.value && keyCaptured.value && !progressInterval) {
    // Chỉ tiếp tục progress nếu nhấn đúng phím đã chọn
    if (key !== customKey.value) {
      return // Ignore other keys
    }

    const currentProgress = progress.value
    const remainingProgress = 100 - currentProgress
    const remainingTime = (remainingProgress / 100) * 1000 // 1 giây tổng

    const intervalTime = 20
    const steps = remainingTime / intervalTime
    const progressPerStep = remainingProgress / steps

    progressInterval = setInterval(() => {
      progress.value += progressPerStep
      if (progress.value >= 100) {
        progress.value = 100
        showPopup.value = false
        if (progressInterval) {
          clearInterval(progressInterval)
          progressInterval = null
        }
      }
    }, intervalTime)
    return
  }

  if (key === customKey.value) {
    isFlipped.value = false
  }
}

function handleKeyUp(e: KeyboardEvent) {
  const key = e.key.toLowerCase()

  // Stop/dừng progress chỉ khi nhả đúng phím đã chọn
  if (showPopup.value && !isMobile.value && keyCaptured.value && progressInterval) {
    if (key === customKey.value) {
      clearInterval(progressInterval)
      progressInterval = null
    }
  }

  if (key === customKey.value) {
    isFlipped.value = true
  }
}

// Reset key selection
function resetKeySelection() {
  // Stop progress if running
  if (progressInterval) {
    clearInterval(progressInterval)
    progressInterval = null
  }
  // Reset state
  customKey.value = 'j'
  keyCaptured.value = false
  progress.value = 0
  easterEggEnabled.value = false
  easterEggShown.value = false
  // Remove from localStorage
  localStorage.removeItem('mirror-custom-key')
}

// Mobile: Long press (500ms) để toggle (nếu không scroll)
let pressTimer: ReturnType<typeof setTimeout> | null = null
let isScrolling = false

function handleTouchStart() {
  isScrolling = false
  pressTimer = setTimeout(() => {
    if (!isScrolling) {
      isFlipped.value = !isFlipped.value
    }
  }, 500)
}

function handleTouchEnd() {
  if (pressTimer) {
    clearTimeout(pressTimer)
    pressTimer = null
  }
}

function handleTouchMove() {
  isScrolling = true
}

// Mobile: Double tap on SponsorsSection to trigger Easter Egg
let sponsorsLastTapTime = 0

function handleSponsorsTouchEnd() {
  const now = Date.now()
  const timeSinceLastTap = now - sponsorsLastTapTime

  if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
    // Double tap detected
    if (showPopup.value) {
      showPopup.value = false
    }
    openEasterEgg()
    sponsorsLastTapTime = 0
  } else {
    sponsorsLastTapTime = now
  }
}

// Navigate to mirror page
function navigateToMirrorPage(path: string) {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  router.push(`/mirror?page=${cleanPath}`)
}

// Handle navigation from EasterEgg
function handleEasterEggNavigate(path: string) {
  showEasterEgg.value = false
  showEasterEggIntro.value = false
  navigateToMirrorPage(path)
}

// Handle close from EasterEgg
function handleEasterEggClose() {
  showEasterEgg.value = false
  showEasterEggIntro.value = false
  // Reset state - show popup from beginning
  localStorage.removeItem('mirror-custom-key')
  customKey.value = 'j'
  keyCaptured.value = false
  progress.value = 0
  easterEggEnabled.value = false
  easterEggShown.value = false
  showPopup.value = true
}

// Open EasterEgg with intro animation
function openEasterEgg() {
  easterEggShown.value = true
  showEasterEggIntro.value = true

  // After 3 seconds, show the actual EasterEgg canvas
  setTimeout(() => {
    showEasterEggIntro.value = false
    showEasterEgg.value = true
  }, 3000)
}

// Modify all links to use ?page=xxx
function modifyLinks() {
  nextTick(() => {
    const container = document.querySelector('.mirror-container')
    if (!container) return

    // Modify all links (a tags)
    const links = container.querySelectorAll('a[href^="/"]')
    links.forEach((link) => {
      // Skip if already processed
      if (link.hasAttribute('data-mirror-processed')) return

      const href = link.getAttribute('href')
      if (!href) return

      // Skip external, special links
      if (
        href.startsWith('http') ||
        href.startsWith('#') ||
        href.includes('facebook.com') ||
        (link as HTMLAnchorElement).target === '_blank'
      ) {
        return
      }

      // Convert /xxx to /mirror?page=xxx
      const match = href.match(/^\/([^/]+)$/)
      if (match && match[1] && !match[1].includes('mirror')) {
        link.setAttribute('href', `/mirror?page=${match[1]}`)
        // Add click handler directly
        link.addEventListener(
          'click',
          (e) => {
            e.preventDefault()
            if (match[1]) {
              navigateToMirrorPage(match[1])
            }
          },
          true,
        )
        link.setAttribute('data-mirror-processed', 'true')
      }
    })
  })
}

onMounted(() => {
  // Detect mobile
  detectMobile()

  // Always reset cache when entering /mirror - show popup for user to choose key
  localStorage.removeItem('mirror-custom-key')
  customKey.value = 'j'
  keyCaptured.value = false
  easterEggShown.value = false

  // Show popup for mobile immediately
  if (isMobile.value) {
    showPopup.value = true
  }

  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
  modifyLinks()

  // Watch for route changes
  watch(
    () => route.fullPath,
    () => {
      nextTick(() => modifyLinks())
    },
  )

  // Listen to navigation
  const observer = new MutationObserver(() => {
    modifyLinks()
  })
  observer.observe(document.body, { childList: true, subtree: true })

  onUnmounted(() => {
    observer.disconnect()
  })
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
})
</script>

<template>
  <div
    class="mirror-container min-h-screen bg-bg-deep text-text-primary font-body"
    :class="{ 'is-normal': !isFlipped }"
    @touchstart="handleTouchStart"
    @touchend="handleTouchEnd"
    @touchmove="handleTouchMove"
  >
    <!-- Popup hướng dẫn -->
    <Teleport to="body">
      <div v-if="showPopup" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
        <div class="bg-bg-surface border border-border-default p-8 rounded-xl max-w-md text-center">
          <!-- Header line -->
          <div class="w-12 h-1 bg-accent-coral mx-auto mb-6 rounded-full"></div>

          <template v-if="!isMobile">
            <template v-if="!keyCaptured">
              <p class="text-lg text-text-primary mb-2">Welcome to Mirror</p>
              <p class="text-sm text-text-dim">Press any key</p>
            </template>
            <template v-else>
              <p class="text-lg text-text-primary mb-4">Từ bây giờ hãy nhấn giữ phím này :)</p>
              <p class="text-5xl font-bold text-accent-coral mb-4">
                {{ customKey.toUpperCase() }}
              </p>
              <!-- Progress bar -->
              <div class="w-full h-2 bg-bg-deep rounded-full overflow-hidden">
                <div
                  class="h-full bg-accent-coral transition-all duration-100"
                  :style="{ width: progress + '%' }"
                ></div>
              </div>
              <!-- Reset button -->
              <button
                class="mt-4 px-4 py-2 text-sm font-display tracking-wide border border-accent-coral text-accent-coral bg-accent-coral/10 rounded-lg hover:bg-accent-coral hover:text-bg-deep transition-colors cursor-pointer"
                @click="resetKeySelection"
              >
                Reset
              </button>
            </template>
          </template>
          <template v-else>
            <p class="text-lg text-text-primary mb-2">Nhấn giữ màn hình để lật lại nhé :)</p>
            <button
              class="mt-6 px-6 py-2.5 text-sm font-display tracking-wide border border-accent-coral text-accent-coral bg-accent-coral/10 rounded-lg hover:bg-accent-coral hover:text-bg-deep transition-colors cursor-pointer"
              @click="showPopup = false"
            >
              OK
            </button>
          </template>
        </div>
      </div>
    </Teleport>

    <!-- Easter Egg intro: Welcome to vibe.j2team.org -->
    <Teleport to="body">
      <div
        v-if="showEasterEggIntro"
        class="fixed inset-0 z-[99] flex items-center justify-center"
        style="background-color: #0f1923"
      >
        <div class="text-center intro-fade-in">
          <p class="text-sm text-[#8B9DB5] mb-2">Welcome to</p>
          <p class="text-4xl font-bold" style="font-family: 'Anybody', sans-serif">
            <span class="text-[#F0EDE6]">vibe</span>
            <span class="text-[#FF6B4A]">.</span>
            <span class="text-[#F0EDE6]">j2team</span>
            <span class="text-[#FF6B4A]">.</span>
            <span class="text-[#F0EDE6]">org</span>
          </p>
          <!-- Progress bar -->
          <div class="w-48 h-1 bg-[#253549] rounded-full mt-4 mx-auto overflow-hidden">
            <div class="h-full bg-[#FF6B4A] intro-progress"></div>
          </div>
          <!-- Easter egg credit -->
          <a
            href="https://gachbong.yellowstudio.vn"
            target="_blank"
            rel="noopener noreferrer"
            class="block mt-3 text-xs transition-colors"
            style="color: #4a6180"
          >
            Easter Egg from <span class="text-[#FF6B4A]">gachbong.yellowstudio.vn</span>
          </a>
        </div>
      </div>
    </Teleport>

    <!-- Easter Egg: J2TEAM flip animation with fireworks -->
    <VibeUniverse
      :show="showEasterEgg"
      @close="handleEasterEggClose"
      @navigate="handleEasterEggNavigate"
    />

    <!-- Nếu có page query → hiển thị page đó -->
    <template v-if="pageName">
      <div class="p-4">
        <a href="/mirror" class="inline-flex items-center gap-2 text-accent-coral hover:underline">
          ← Quay lại
        </a>
      </div>
      <component :is="PageComponent" :key="pageName" v-if="PageComponent" />
      <div v-else class="p-8 text-center text-text-dim">Loading...</div>
    </template>

    <!-- Ngược lại → hiển thị home page -->
    <template v-else>
      <!-- Hero Section -->
      <div>
        <HeroSection />
      </div>

      <!-- Pages Grid -->
      <div>
        <PagesGrid />
      </div>

      <!-- Tech Stack -->
      <div>
        <TechStackSection />
      </div>

      <!-- Contribute -->
      <div>
        <ContributeSection />
      </div>

      <!-- Rules -->
      <div>
        <RulesSection />
      </div>

      <!-- Products -->
      <div>
        <ProductsSection />
      </div>

      <div class="sponsors-wrapper" @touchend.stop="handleSponsorsTouchEnd">
        <SponsorsSection />
      </div>
      <SiteFooter />
    </template>

    <BackToTop />
  </div>
</template>

<style scoped>
.mirror-container {
  transform: scaleX(-1);
  transform-origin: center center;
  transition: transform 0.2s ease;
}

.mirror-container.is-normal {
  transform: scaleX(1);
}

/* Easter Egg Intro animations */
.intro-fade-in {
  animation: fadeIn 1s ease-out forwards;
}

.intro-progress {
  animation: progressFill 3s linear forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes progressFill {
  from {
    width: 0%;
  }
  to {
    width: 100%;
  }
}
</style>
