<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useMusicPlayer } from './useMusicPlayer'
import {
  createStars,
  drawStars,
  drawConstellationLines,
  drawProducts,
  drawCenterText,
  createProductTiles,
  updateProductPositions,
  getProductAtPosition,
} from './canvasRenderer'
import { COLORS } from './types'
import type { ProductItem, PageInfo, Star } from './types'
import HelpPopup from './HelpPopup.vue'
import SettingsPopup from './SettingsPopup.vue'
import ContextMenuPopup from './ContextMenuPopup.vue'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  close: []
  navigate: [path: string]
}>()

// Audio state
const isMuted = ref(false)

// Help popup state
const showHelp = ref(false)

// Settings popup state
const showSettings = ref(false)
const productCount = ref(30) // default 30 products
const showControls = ref(true) // toggle visibility of controls

// Filter state
const categoryFilter = ref('')
const authorFilter = ref('')
const allCategories = ref<string[]>([])
const allAuthors = ref<string[]>([])

// Context menu state
const showContextMenu = ref(false)
const contextMenuX = ref(0)
const contextMenuY = ref(0)
const contextMenuProduct = ref<ProductItem | null>(null)

function handleClose() {
  emit('close')
}

function toggleMute() {
  isMuted.value = !isMuted.value
  if (isMuted.value) {
    stopMusic()
  } else {
    playMusic().catch(console.warn)
  }
}

function toggleHelp() {
  showHelp.value = !showHelp.value
  showContextMenu.value = false
  showSettings.value = false
}

function toggleSettings() {
  showSettings.value = !showSettings.value
  showContextMenu.value = false
  showHelp.value = false
}

function toggleControls() {
  showControls.value = !showControls.value
}

function applySettings() {
  // Clamp value between 0-141
  productCount.value = Math.max(0, Math.min(141, productCount.value))
  showSettings.value = false
  // Reload and apply filters
  loadPages().then((pages) => {
    const filtered = applyFilters(pages)
    initTiles(filtered)
  })
}

function clearFilters() {
  categoryFilter.value = ''
  authorFilter.value = ''
  productCount.value = 30
  showSettings.value = false
  loadPages().then((pages) => {
    initTiles(pages)
  })
}

function applyFilters(pages: PageInfo[]): PageInfo[] {
  let filtered = pages

  // Apply category filter
  if (categoryFilter.value) {
    filtered = filtered.filter((p) => p.category === categoryFilter.value)
  }

  // Apply author filter
  if (authorFilter.value) {
    filtered = filtered.filter((p) => p.author === authorFilter.value)
  }

  // Apply count limit
  filtered = filtered.slice(0, productCount.value)

  return filtered
}

function updateProductCount(event: Event) {
  const target = event.target as HTMLInputElement
  productCount.value = Number(target.value)
  loadPages().then((pages) => {
    const filtered = applyFilters(pages)
    initTiles(filtered)
  })
}

function handleContextMenu(event: MouseEvent) {
  event.preventDefault()

  const canvas = canvasRef.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const clickY = event.clientY - rect.top

  const product = getProductAtPosition(clickX, clickY, productTiles.value, isMobile.value)
  if (product) {
    contextMenuProduct.value = product
    contextMenuX.value = event.clientX
    contextMenuY.value = event.clientY
    showContextMenu.value = true
  } else {
    showContextMenu.value = false
  }
}

function closeContextMenu() {
  showContextMenu.value = false
  contextMenuProduct.value = null
}

// Close context menu when clicking outside
function handleGlobalClick(event: MouseEvent) {
  if (showContextMenu.value) {
    const target = event.target as HTMLElement
    if (!target.closest('.context-menu-popup')) {
      closeContextMenu()
    }
  }
}

// Close context menu on escape key
function handleGlobalKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && showContextMenu.value) {
    closeContextMenu()
  }
}

function handleMouseDown(event: MouseEvent) {
  const canvas = canvasRef.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const clickY = event.clientY - rect.top

  const product = getProductAtPosition(clickX, clickY, productTiles.value, isMobile.value)
  if (product) {
    draggedProduct.value = product
    product.isDragging = true
    dragOffsetX.value = clickX - product.x
    dragOffsetY.value = clickY - product.y

    // Track click time for double click detection
    const now = Date.now()
    if (now - product.lastClickTime < 300) {
      // This is a double click - will be handled in mouseup
      event.preventDefault()
    }
  }
}

function handleMouseMove(event: MouseEvent) {
  if (!draggedProduct.value) return

  const canvas = canvasRef.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const clickY = event.clientY - rect.top

  draggedProduct.value.x = clickX - dragOffsetX.value
  draggedProduct.value.y = clickY - dragOffsetY.value

  // Reset velocity when dragging
  draggedProduct.value.vx = 0
  draggedProduct.value.vy = 0
}

function handleMouseUp() {
  if (draggedProduct.value) {
    const now = Date.now()
    const product = draggedProduct.value
    const timeSinceLastClick = now - product.lastClickTime

    // Check for double click (within 300ms)
    if (timeSinceLastClick < 300) {
      // Double click - open in new tab
      window.open(`https://vibe.j2team.org/${product.path}`, '_blank')
    }

    product.lastClickTime = now
    product.isDragging = false
    draggedProduct.value = null
  }
}

// Touch handlers for mobile
function handleTouchStart(event: TouchEvent) {
  event.preventDefault()
  hasDragged.value = false
  const canvas = canvasRef.value
  if (!canvas) return

  const touch = event.touches[0]
  if (!touch) return
  const rect = canvas.getBoundingClientRect()
  const touchX = touch.clientX - rect.left
  const touchY = touch.clientY - rect.top

  const product = getProductAtPosition(touchX, touchY, productTiles.value, isMobile.value)
  if (product) {
    draggedProduct.value = product
    product.isDragging = true
    dragOffsetX.value = touchX - product.x
    dragOffsetY.value = touchY - product.y
  }
}

function handleTouchMove(event: TouchEvent) {
  event.preventDefault()
  if (!draggedProduct.value) return

  hasDragged.value = true

  const canvas = canvasRef.value
  if (!canvas) return

  const touch = event.touches[0]
  if (!touch) return
  const rect = canvas.getBoundingClientRect()
  const touchX = touch.clientX - rect.left
  const touchY = touch.clientY - rect.top

  draggedProduct.value.x = touchX - dragOffsetX.value
  draggedProduct.value.y = touchY - dragOffsetY.value

  draggedProduct.value.vx = 0
  draggedProduct.value.vy = 0
}

function handleTouchEnd(event: TouchEvent) {
  if (draggedProduct.value) {
    if (!hasDragged.value) {
      const now = Date.now()
      const touch = event.changedTouches[0]
      if (!touch) return
      const canvas = canvasRef.value
      if (canvas) {
        const rect = canvas.getBoundingClientRect()
        const touchX = touch.clientX - rect.left
        const touchY = touch.clientY - rect.top
        const product = getProductAtPosition(touchX, touchY, productTiles.value, isMobile.value)

        if (product) {
          const timeSinceLastTap = now - lastTapTime.value
          if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
            emit('navigate', product.path)
          }
          lastTapTime.value = now
        }
      }
    }

    draggedProduct.value.isDragging = false
    draggedProduct.value = null
    hasDragged.value = false
  }
}

const { play: playMusic, stop: stopMusic } = useMusicPlayer('intro')

const canvasRef = ref<HTMLCanvasElement | null>(null)
const animFrameRef = ref(0)
const startTimeRef = ref(0)
const loading = ref(true)
const loadingError = ref<string | null>(null)

const productTiles = ref<ProductItem[]>([])
const stars = ref<Star[]>([])
const isMobile = ref(false)

// Drag state
const draggedProduct = ref<ProductItem | null>(null)
const dragOffsetX = ref(0)
const dragOffsetY = ref(0)
const hasDragged = ref(false)
const lastTapTime = ref(0)

function detectMobile() {
  isMobile.value = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  )
}

async function loadPages(): Promise<PageInfo[]> {
  try {
    const res = await fetch('/data/pages.json')
    const pages: PageInfo[] = await res.json()
    console.log('[EasterEgg] Loaded pages:', pages.length)

    // Extract unique categories and authors
    const categories = new Set<string>()
    const authors = new Set<string>()
    pages.forEach((p) => {
      if (p.category) categories.add(p.category)
      if (p.author) authors.add(p.author)
    })
    allCategories.value = Array.from(categories).sort()
    allAuthors.value = Array.from(authors).sort()

    return pages.filter((p) => p.name && p.path)
  } catch (e) {
    console.error('[EasterEgg] Failed to load pages:', e)
    return []
  }
}

function initTiles(pages: PageInfo[]) {
  const w = window.innerWidth || 800
  const h = window.innerHeight || 600

  stars.value = createStars(w, h, isMobile.value)
  productTiles.value = createProductTiles(pages, productCount.value, isMobile.value)
  console.log('[EasterEgg] Created product tiles:', productTiles.value.length)
}

function animate() {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const w = window.innerWidth
  const h = window.innerHeight

  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w || 800
    canvas.height = h || 600
  }

  ctx.fillStyle = COLORS.bgDeep
  ctx.fillRect(0, 0, w || 800, h || 600)

  const elapsed = (performance.now() - startTimeRef.value) / 1000

  drawStars(ctx, w || 800, h || 600, elapsed, stars.value)

  updateProductPositions(productTiles.value, isMobile.value)

  drawConstellationLines(ctx, productTiles.value)

  drawProducts(ctx, productTiles.value, isMobile.value)

  drawCenterText(ctx, w || 800, h || 600, isMobile.value)

  animFrameRef.value = requestAnimationFrame(animate)
}

async function startAnimation() {
  startTimeRef.value = performance.now()
  detectMobile()

  loading.value = false
  const pages = await loadPages()
  initTiles(pages)

  // Start music
  playMusic().catch(console.warn)

  animFrameRef.value = requestAnimationFrame(animate)
}

function stopAnimation() {
  cancelAnimationFrame(animFrameRef.value)
  stopMusic()
}

watch(
  () => props.show,
  async (newVal) => {
    if (newVal) {
      startAnimation()
    } else {
      stopAnimation()
    }
  },
)

onMounted(() => {
  if (props.show) {
    startAnimation()
  }
  // Add global event listeners
  window.addEventListener('click', handleGlobalClick)
  window.addEventListener('keydown', handleGlobalKeydown)
})

onBeforeUnmount(() => {
  stopAnimation()
  // Remove global event listeners
  window.removeEventListener('click', handleGlobalClick)
  window.removeEventListener('keydown', handleGlobalKeydown)
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 z-[100] overflow-hidden"
      style="background-color: #0f1923"
    >
      <!-- Loading state -->
      <div
        v-if="loading"
        class="absolute inset-0 flex items-center justify-center"
        style="background-color: #0f1923"
      >
        <div class="text-center">
          <div
            class="w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4"
            style="border-color: #253549; border-top-color: #ff6b4a"
          />
          <p class="text-sm" style="color: #8b9db5">Loading...</p>
        </div>
      </div>

      <!-- Error state -->
      <div
        v-else-if="loadingError"
        class="absolute inset-0 flex items-center justify-center"
        style="background-color: #0f1923"
      >
        <p style="color: #ff6b4a">{{ loadingError }}</p>
      </div>

      <!-- Canvas -->
      <canvas
        v-show="!loading && !loadingError"
        ref="canvasRef"
        class="block w-full h-full cursor-grab active:cursor-grabbing"
        @mousedown="handleMouseDown"
        @mousemove="handleMouseMove"
        @mouseup="handleMouseUp"
        @mouseleave="handleMouseUp"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
        @contextmenu="handleContextMenu"
      />

      <!-- Top right controls -->
      <div v-if="showControls" class="absolute top-6 right-6 flex flex-col gap-3 z-10">
        <!-- Buttons row: Mute, Help, Settings, X -->
        <div class="flex gap-3">
          <!-- Mute button -->
          <button
            v-show="!loading && !loadingError"
            class="w-10 h-10 flex items-center justify-center border transition-colors"
            style="background-color: rgba(22, 34, 50, 0.9); border-color: #253549; color: #8b9db5"
            @click="toggleMute"
          >
            <svg
              v-if="!isMuted"
              xmlns="http://www.w3.org/2000/svg"
              class="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
              />
            </svg>
            <svg
              v-else
              xmlns="http://www.w3.org/2000/svg"
              class="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
              />
            </svg>
          </button>

          <!-- Help button -->
          <button
            v-show="!loading && !loadingError"
            class="w-10 h-10 flex items-center justify-center border transition-colors"
            style="background-color: rgba(22, 34, 50, 0.9); border-color: #253549; color: #8b9db5"
            @click="toggleHelp"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>

          <!-- Settings button -->
          <button
            v-show="!loading && !loadingError"
            class="w-10 h-10 flex items-center justify-center border transition-colors"
            style="background-color: rgba(22, 34, 50, 0.9); border-color: #253549; color: #8b9db5"
            @click="toggleSettings"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>

          <!-- Close button -->
          <button
            v-show="!loading && !loadingError"
            class="w-10 h-10 flex items-center justify-center border transition-colors"
            style="background-color: rgba(22, 34, 50, 0.9); border-color: #253549; color: #8b9db5"
            @click="handleClose"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      <!-- Product count slider -->
      <div
        v-if="showControls"
        class="absolute top-[75px] right-6 flex items-center gap-3 z-10 px-4 py-2 rounded-lg"
        style="background-color: rgba(22, 34, 50, 0.9); border: 1px solid #253549"
      >
        <input
          type="range"
          :min="0"
          :max="141"
          :value="productCount"
          @input="updateProductCount"
          class="w-32 h-1.5 rounded-lg appearance-none cursor-pointer"
          :style="{
            background: `linear-gradient(to right, #FF6B4A 0%, #FF6B4A ${(productCount / 141) * 100}%, #253549 ${(productCount / 141) * 100}%, #253549 100%)`,
          }"
        />
        <span class="text-xs w-6 text-center" style="color: #f0ede6">{{ productCount }}</span>
      </div>

      <!-- Toggle controls visibility button (eye) -->
      <button
        class="absolute bottom-6 right-6 w-10 h-10 flex items-center justify-center border rounded-lg transition-colors z-10"
        style="background-color: rgba(22, 34, 50, 0.9); border-color: #253549; color: #8b9db5"
        @click="toggleControls"
      >
        <svg
          v-if="showControls"
          xmlns="http://www.w3.org/2000/svg"
          class="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          class="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
          />
        </svg>
      </button>

      <!-- Help popup -->
      <HelpPopup :show="showHelp" @close="showHelp = false" />

      <!-- Settings popup -->
      <SettingsPopup
        :show="showSettings"
        :product-count="productCount"
        :category-filter="categoryFilter"
        :author-filter="authorFilter"
        :all-categories="allCategories"
        :all-authors="allAuthors"
        @close="showSettings = false"
        @update="productCount = $event"
        @update-category="categoryFilter = $event"
        @update-author="authorFilter = $event"
        @apply="applySettings"
        @clear="clearFilters"
      />

      <!-- Context menu popup -->
      <ContextMenuPopup
        :show="showContextMenu"
        :x="contextMenuX"
        :y="contextMenuY"
        :product="contextMenuProduct"
        @close="closeContextMenu"
      />

      <!-- Bottom link -->
      <!-- <a
        v-show="!loading && !loadingError"
        href="https://gachbong.yellowstudio.vn"
        target="_blank"
        rel="noopener noreferrer"
        class="absolute bottom-8 left-1/2 -translate-x-1/2 text-sm transition-colors"
        style="color: #4A6180"
      >
        Easter Egg from gachbong.yellowstudio.vn
      </a>-->
    </div>
  </Teleport>
</template>
