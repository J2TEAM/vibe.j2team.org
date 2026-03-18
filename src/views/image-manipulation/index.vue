<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { Icon } from '@iconify/vue'

// Tabs
const activeTab = ref<'crop' | 'merge'>('crop')

// ===== CROP TAB =====
const cropInput = ref<HTMLInputElement>()
const cropImageData = ref<string | null>(null)
const cropMode = ref<'upload' | 'url'>('upload')
const cropUrlInput = ref('')
const cropCanvas = ref<HTMLCanvasElement>()
const cropX = ref(20)
const cropY = ref(20)
const cropWidth = ref(200)
const cropHeight = ref(200)
const isCropImageLoaded = ref(false)
const originalImageWidth = ref(0)
const originalImageHeight = ref(0)
// Drag selection
const isDraggingCrop = ref(false)
const dragStartX = ref(0)
const dragStartY = ref(0)
const dragEndX = ref(0)
const dragEndY = ref(0)
// Zoom mode
const isCropZoomed = ref(false)
// Manual edit mode
const showCropSliders = ref(true)

// ===== MERGE TAB =====
const mergeInput = ref<HTMLInputElement>()
const mergeImages = ref<Array<{ id: string; src: string; file: File }>>([])
const mergeGridCols = ref(2)
const mergeGridRows = ref(2)
const mergeGridGap = ref(0)
const mergePreview = ref<HTMLElement>()
const draggedImageId = ref<string | null>(null)
const mergeStatus = ref<{ type: 'success' | 'error'; message: string } | null>(null)

// ===== CROP FUNCTIONS =====
const loadCropImage = async (source: 'upload' | 'url') => {
  try {
    let imageUrl = ''

    if (source === 'upload' && cropInput.value?.files?.[0]) {
      imageUrl = URL.createObjectURL(cropInput.value.files[0])
    } else if (source === 'url' && cropUrlInput.value) {
      imageUrl = cropUrlInput.value
    }

    if (!imageUrl) return

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      originalImageWidth.value = img.width
      originalImageHeight.value = img.height
      cropImageData.value = imageUrl
      isCropImageLoaded.value = true
      cropX.value = Math.max(0, (img.width - 200) / 2)
      cropY.value = Math.max(0, (img.height - 200) / 2)
      cropWidth.value = Math.min(200, img.width)
      cropHeight.value = Math.min(200, img.height)

      nextTick(() => {
        drawCropCanvas()
      })
    }
    img.onerror = () => {
      alert('Không thể tải ảnh. Vui lòng kiểm tra URL hoặc file.')
    }
    img.src = imageUrl
  } catch (error) {
    console.error('Error loading crop image:', error)
  }
}

const drawCropCanvas = () => {
  if (!cropCanvas.value || !cropImageData.value || !isCropImageLoaded.value) return

  const ctx = cropCanvas.value.getContext('2d')
  if (!ctx) return

  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    // Calculate display dimensions
    let displayWidth = 500
    let displayHeight = (500 * originalImageHeight.value) / originalImageWidth.value

    // If zoomed, show zoomed area
    if (isCropZoomed.value) {
      const zoomScale = 1.8
      displayWidth = (cropWidth.value * 500) / (originalImageWidth.value / zoomScale)
      displayHeight = (cropHeight.value * 500) / (originalImageHeight.value / zoomScale)
    }

    cropCanvas.value!.width = displayWidth
    cropCanvas.value!.height = displayHeight

    const scaleX = displayWidth / originalImageWidth.value
    const scaleY = displayHeight / originalImageHeight.value

    if (isCropZoomed.value) {
      // Draw zoomed area
      ctx.drawImage(
        img,
        cropX.value,
        cropY.value,
        cropWidth.value,
        cropHeight.value,
        0,
        0,
        displayWidth,
        displayHeight,
      )
    } else {
      // Draw full image
      ctx.drawImage(img, 0, 0, displayWidth, displayHeight)

      // Overlay dark
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
      ctx.fillRect(0, 0, displayWidth, displayHeight)

      // Clear crop area
      ctx.clearRect(
        cropX.value * scaleX,
        cropY.value * scaleY,
        cropWidth.value * scaleX,
        cropHeight.value * scaleY,
      )

      // Draw crop border
      ctx.strokeStyle = '#FF6B4A'
      ctx.lineWidth = 3
      ctx.strokeRect(
        cropX.value * scaleX,
        cropY.value * scaleY,
        cropWidth.value * scaleX,
        cropHeight.value * scaleY,
      )

      // Draw grab handles
      const handleSize = 8
      const handles = [
        [cropX.value * scaleX, cropY.value * scaleY],
        [(cropX.value + cropWidth.value) * scaleX, cropY.value * scaleY],
        [cropX.value * scaleX, (cropY.value + cropHeight.value) * scaleY],
        [(cropX.value + cropWidth.value) * scaleX, (cropY.value + cropHeight.value) * scaleY],
      ]

      handles.forEach((handle) => {
        if (handle && handle[0] !== undefined && handle[1] !== undefined) {
          ctx.fillStyle = '#FF6B4A'
          ctx.fillRect(
            handle[0] - handleSize / 2,
            handle[1] - handleSize / 2,
            handleSize,
            handleSize,
          )
        }
      })
    }

    // Draw drag preview if dragging
    if (isDraggingCrop.value && !isCropZoomed.value) {
      const x = Math.min(dragStartX.value, dragEndX.value)
      const y = Math.min(dragStartY.value, dragEndY.value)
      const w = Math.abs(dragEndX.value - dragStartX.value)
      const h = Math.abs(dragEndY.value - dragStartY.value)

      ctx.strokeStyle = '#FFB830'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.strokeRect(x, y, w, h)
      ctx.setLineDash([])
    }
  }
  img.src = cropImageData.value
}

const handleCanvasMouseDown = (e: MouseEvent) => {
  if (!cropCanvas.value || isCropZoomed.value) return

  const rect = cropCanvas.value.getBoundingClientRect()
  dragStartX.value = e.clientX - rect.left
  dragStartY.value = e.clientY - rect.top
  isDraggingCrop.value = true
}

const handleCanvasMouseMove = (e: MouseEvent) => {
  if (!isDraggingCrop.value || !cropCanvas.value) return

  const rect = cropCanvas.value.getBoundingClientRect()
  dragEndX.value = e.clientX - rect.left
  dragEndY.value = e.clientY - rect.top

  drawCropCanvas()
}

const handleCanvasMouseUp = () => {
  if (!isDraggingCrop.value) return

  isDraggingCrop.value = false

  if (dragStartX.value === dragEndX.value || dragStartY.value === dragEndY.value) {
    return // No selection made
  }

  // Calculate crop area from drag - need to account for canvas scaling
  const displayWidth = cropCanvas.value?.width || 500
  const displayHeight = cropCanvas.value?.height || 500

  const scaleX = originalImageWidth.value / displayWidth
  const scaleY = originalImageHeight.value / displayHeight

  const x = Math.min(dragStartX.value, dragEndX.value) * scaleX
  const y = Math.min(dragStartY.value, dragEndY.value) * scaleY
  const w = Math.abs(dragEndX.value - dragStartX.value) * scaleX
  const h = Math.abs(dragEndY.value - dragStartY.value) * scaleY

  // Ensure minimum size
  if (w < 50 || h < 50) return

  // Update crop values
  cropX.value = Math.max(0, Math.min(x, originalImageWidth.value - w))
  cropY.value = Math.max(0, Math.min(y, originalImageHeight.value - h))
  cropWidth.value = Math.min(w, originalImageWidth.value - cropX.value)
  cropHeight.value = Math.min(h, originalImageHeight.value - cropY.value)

  // Auto zoom to crop area
  zoomToCropArea()
}

const zoomToCropArea = () => {
  isCropZoomed.value = true
  nextTick(() => {
    drawCropCanvas()
  })
}

const resetCropZoom = () => {
  isCropZoomed.value = false
  nextTick(() => {
    drawCropCanvas()
  })
}

const exportCroppedImage = async () => {
  if (!cropImageData.value || !isCropImageLoaded.value) return

  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    const canvas = document.createElement('canvas')
    canvas.width = cropWidth.value
    canvas.height = cropHeight.value
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(
        img,
        cropX.value,
        cropY.value,
        cropWidth.value,
        cropHeight.value,
        0,
        0,
        cropWidth.value,
        cropHeight.value,
      )
      const link = document.createElement('a')
      link.href = canvas.toDataURL('image/png')
      link.download = 'cropped-image.png'
      link.click()
    }
  }
  img.src = cropImageData.value
}

// ===== MERGE FUNCTIONS =====
const addMergeImages = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const files = input.files

  if (!files) return

  for (const file of files) {
    if (!file.type.startsWith('image/')) continue

    const reader = new FileReader()
    reader.onload = (e) => {
      const src = e.target?.result as string
      mergeImages.value.push({
        id: `${Date.now()}-${Math.random()}`,
        src,
        file,
      })
    }
    reader.readAsDataURL(file)
  }

  input.value = ''
}

const removeMergeImage = (id: string) => {
  mergeImages.value = mergeImages.value.filter((img) => img.id !== id)
}

const moveImage = (fromIndex: number, toIndex: number) => {
  if (toIndex < 0 || toIndex >= mergeImages.value.length) return
  const removed = mergeImages.value.splice(fromIndex, 1)[0]
  if (removed) {
    mergeImages.value.splice(toIndex, 0, removed)
  }
}

const calculateGridLayout = computed(() => {
  const totalImages = mergeImages.value.length
  if (totalImages === 0) {
    return {
      cols: mergeGridCols.value,
      rows: mergeGridRows.value,
      totalCells: mergeGridCols.value * mergeGridRows.value,
    }
  }

  let cols = mergeGridCols.value
  let rows = mergeGridRows.value

  // Validate grid
  if (cols * rows < totalImages) {
    // Find minimum valid grid
    for (let r = 1; r <= totalImages; r++) {
      for (let c = 1; c <= totalImages; c++) {
        if (c * r >= totalImages) {
          cols = c
          rows = r
          break
        }
      }
      if (cols * rows >= totalImages) break
    }
  }

  return {
    cols,
    rows,
    totalCells: cols * rows,
  }
})

const drawMergeCanvas = async () => {
  if (mergeImages.value.length === 0) {
    mergeStatus.value = { type: 'error', message: 'Vui lòng tải ít nhất 1 ảnh' }
    return
  }

  try {
    mergeStatus.value = null
    const layout = calculateGridLayout.value
    const images = await Promise.all(
      mergeImages.value.map(
        (img) =>
          new Promise<{ img: HTMLImageElement; src: string; width: number; height: number }>(
            (resolve) => {
              const image = new Image()
              image.crossOrigin = 'anonymous'
              image.onload = () => {
                resolve({ img: image, src: img.src, width: image.width, height: image.height })
              }
              image.src = img.src
            },
          ),
      ),
    )

    if (images.length === 0) return

    // Validate all images have same size
    const firstImage = images[0]
    if (!firstImage) return
    const cellWidth = firstImage.width
    const cellHeight = firstImage.height

    const allSameSize = images.every((img) => img.width === cellWidth && img.height === cellHeight)

    if (!allSameSize) {
      mergeStatus.value = {
        type: 'error',
        message: `✗ Tất cả ảnh phải có cùng kích thước. Ảnh đầu tiên: ${cellWidth}x${cellHeight}px. Vui lòng crop ảnh để cùng kích thước.`,
      }
      return
    }

    const canvasWidth = layout.cols * cellWidth + (layout.cols - 1) * mergeGridGap.value
    const canvasHeight = layout.rows * cellHeight + (layout.rows - 1) * mergeGridGap.value

    const canvas = document.createElement('canvas')
    canvas.width = canvasWidth
    canvas.height = canvasHeight
    const ctx = canvas.getContext('2d')

    if (!ctx) return

    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    images.forEach((data, index) => {
      if (index >= layout.totalCells) return

      const col = index % layout.cols
      const row = Math.floor(index / layout.cols)
      const x = col * (cellWidth + mergeGridGap.value)
      const y = row * (cellHeight + mergeGridGap.value)

      ctx.drawImage(data.img, x, y, cellWidth, cellHeight)
    })

    const link = document.createElement('a')
    link.href = canvas.toDataURL('image/png')
    link.download = 'merged-image.png'
    link.click()

    mergeStatus.value = {
      type: 'success',
      message: `✓ Đã export ảnh merged (${canvasWidth}x${canvasHeight}px)`,
    }
  } catch (error) {
    console.error('Error drawing merge canvas:', error)
    mergeStatus.value = {
      type: 'error',
      message: 'Lỗi khi gộp ảnh. Vui lòng thử lại.',
    }
  }
}

watch(cropImageData, () => {
  drawCropCanvas()
})

watch([cropX, cropY, cropWidth, cropHeight], () => {
  drawCropCanvas()
})
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body">
    <!-- Back to Home Link -->
    <RouterLink
      to="/"
      class="fixed top-4 left-4 z-50 flex items-center gap-2 border border-border-default bg-bg-surface px-3 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary hover:bg-bg-elevated animate-fade-up"
    >
      <Icon icon="lucide:arrow-left" class="w-4 h-4" />
      Home
    </RouterLink>

    <div class="py-12 px-6">
      <div class="max-w-5xl mx-auto">
        <!-- Header -->
        <div class="text-center mb-12 animate-fade-up">
          <h1 class="font-display text-5xl md:text-6xl font-bold text-accent-coral mb-4">
            Image Manipulation
          </h1>
          <p class="text-text-secondary text-lg max-w-2xl mx-auto">
            Crop ảnh hoặc gộp nhiều ảnh lại thành một. Hỗ trợ upload hoặc URL.
          </p>
        </div>

        <!-- Tabs -->
        <div class="flex gap-4 mb-12 justify-center animate-fade-up animate-delay-1">
          <button
            :class="[
              'px-6 py-3 font-display font-semibold transition-all duration-300',
              activeTab === 'crop'
                ? 'border-b-2 border-accent-coral text-accent-coral'
                : 'border-b-2 border-transparent text-text-secondary hover:text-text-primary',
            ]"
            @click="activeTab = 'crop'"
          >
            <Icon icon="lucide:crop" class="inline w-5 h-5 mr-2" />
            Crop Ảnh
          </button>
          <button
            :class="[
              'px-6 py-3 font-display font-semibold transition-all duration-300',
              activeTab === 'merge'
                ? 'border-b-2 border-accent-coral text-accent-coral'
                : 'border-b-2 border-transparent text-text-secondary hover:text-text-primary',
            ]"
            @click="activeTab = 'merge'"
          >
            <Icon icon="lucide:image" class="inline w-5 h-5 mr-2" />
            Gộp Ảnh
          </button>
        </div>

        <!-- CROP TAB -->
        <div v-if="activeTab === 'crop'" class="space-y-8 animate-fade-up animate-delay-2">
          <!-- Load Image Section -->
          <div class="border border-border-default bg-bg-surface p-6">
            <h2
              class="font-display text-xl font-semibold text-text-primary mb-6 flex items-center gap-3"
            >
              <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
              Tải Ảnh
            </h2>

            <div class="space-y-4">
              <!-- Mode Toggle -->
              <div class="flex gap-4">
                <button
                  :class="[
                    'px-4 py-2 transition-all duration-300',
                    cropMode === 'upload'
                      ? 'bg-accent-coral text-bg-deep font-semibold'
                      : 'border border-border-default text-text-secondary hover:text-text-primary',
                  ]"
                  @click="cropMode = 'upload'"
                >
                  Upload
                </button>
                <button
                  :class="[
                    'px-4 py-2 transition-all duration-300',
                    cropMode === 'url'
                      ? 'bg-accent-coral text-bg-deep font-semibold'
                      : 'border border-border-default text-text-secondary hover:text-text-primary',
                  ]"
                  @click="cropMode = 'url'"
                >
                  URL
                </button>
              </div>

              <!-- Upload Input -->
              <div v-if="cropMode === 'upload'" class="space-y-2">
                <label class="block text-sm text-text-secondary">Chọn ảnh từ máy</label>
                <input
                  ref="cropInput"
                  type="file"
                  accept="image/*"
                  class="w-full px-4 py-2 border border-border-default bg-bg-deep text-text-primary cursor-pointer hover:border-accent-coral transition"
                  @change="loadCropImage('upload')"
                />
              </div>

              <!-- URL Input -->
              <div v-else class="space-y-2">
                <label class="block text-sm text-text-secondary">Nhập URL ảnh</label>
                <div class="flex gap-2">
                  <input
                    v-model="cropUrlInput"
                    type="url"
                    placeholder="https://..."
                    class="flex-1 px-4 py-2 border border-border-default bg-bg-deep text-text-primary placeholder-text-dim focus:outline-none focus:border-accent-coral"
                  />
                  <button
                    class="px-4 py-2 bg-accent-coral text-bg-deep font-semibold hover:bg-opacity-90 transition"
                    @click="loadCropImage('url')"
                  >
                    Tải
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Canvas Section -->
          <div v-if="isCropImageLoaded" class="border border-border-default bg-bg-surface p-6">
            <h2
              class="font-display text-xl font-semibold text-text-primary mb-6 flex items-center gap-3"
            >
              <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
              Chỉnh sửa Vùng Crop
            </h2>

            <div class="space-y-6">
              <!-- Canvas -->
              <div class="flex flex-col items-center gap-2">
                <canvas
                  ref="cropCanvas"
                  class="border border-accent-coral/30 bg-bg-deep max-w-full"
                  :class="isCropZoomed ? 'cursor-pointer' : 'cursor-crosshair select-none'"
                  @mousedown="handleCanvasMouseDown"
                  @mousemove="handleCanvasMouseMove"
                  @mouseup="handleCanvasMouseUp"
                  @mouseleave="isDraggingCrop = false"
                />
                <p
                  class="text-xs text-text-secondary text-center"
                  :class="{ 'text-accent-amber font-semibold': !isCropZoomed }"
                >
                  {{ isCropZoomed ? 'Vùng crop zoom' : 'Kéo chuột để chọn vùng cần crop' }}
                </p>
              </div>

              <!-- Controls -->
              <div v-show="showCropSliders" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label
                    class="block text-xs text-text-secondary mb-2 font-display tracking-wide cursor-help hover:text-accent-coral transition"
                    @dblclick="showCropSliders = !showCropSliders"
                    :title="showCropSliders ? 'Double-click để ẩn' : 'Double-click để hiện'"
                  >
                    X: {{ cropX }}
                  </label>
                  <input
                    v-model.number="cropX"
                    type="range"
                    :min="0"
                    :max="originalImageWidth - cropWidth"
                    class="w-full"
                  />
                </div>
                <div>
                  <label
                    class="block text-xs text-text-secondary mb-2 font-display tracking-wide cursor-help hover:text-accent-coral transition"
                    @dblclick="showCropSliders = !showCropSliders"
                    :title="showCropSliders ? 'Double-click để ẩn' : 'Double-click để hiện'"
                  >
                    Y: {{ cropY }}
                  </label>
                  <input
                    v-model.number="cropY"
                    type="range"
                    :min="0"
                    :max="originalImageHeight - cropHeight"
                    class="w-full"
                  />
                </div>
                <div>
                  <label
                    class="block text-xs text-text-secondary mb-2 font-display tracking-wide cursor-help hover:text-accent-coral transition"
                    @dblclick="showCropSliders = !showCropSliders"
                    :title="showCropSliders ? 'Double-click để ẩn' : 'Double-click để hiện'"
                  >
                    Width: {{ cropWidth }}
                  </label>
                  <input
                    v-model.number="cropWidth"
                    type="range"
                    :min="50"
                    :max="originalImageWidth - cropX"
                    class="w-full"
                  />
                </div>
                <div>
                  <label
                    class="block text-xs text-text-secondary mb-2 font-display tracking-wide cursor-help hover:text-accent-coral transition"
                    @dblclick="showCropSliders = !showCropSliders"
                    :title="showCropSliders ? 'Double-click để ẩn' : 'Double-click để hiện'"
                  >
                    Height: {{ cropHeight }}
                  </label>
                  <input
                    v-model.number="cropHeight"
                    type="range"
                    :min="50"
                    :max="originalImageHeight - cropY"
                    class="w-full"
                  />
                </div>
              </div>

              <!-- Reset Zoom Button -->
              <div v-if="isCropZoomed" class="flex gap-2">
                <button
                  class="flex-1 px-4 py-2 border border-accent-sky bg-accent-sky/10 text-accent-sky font-display font-semibold transition hover:bg-accent-sky/20"
                  @click="resetCropZoom"
                >
                  <Icon icon="lucide:zoom-out" class="inline w-4 h-4 mr-2" />
                  Reset Zoom
                </button>
              </div>

              <!-- Export Button -->
              <button
                class="w-full px-6 py-3 bg-accent-coral text-bg-deep font-display font-semibold hover:bg-opacity-90 transition flex items-center justify-center gap-2"
                @click="exportCroppedImage"
              >
                <Icon icon="lucide:download" class="w-5 h-5" />
                Export Ảnh Crop
              </button>
            </div>
          </div>
        </div>

        <!-- MERGE TAB -->
        <div v-if="activeTab === 'merge'" class="space-y-8 animate-fade-up animate-delay-2">
          <!-- Upload Section -->
          <div class="border border-border-default bg-bg-surface p-6">
            <h2
              class="font-display text-xl font-semibold text-text-primary mb-6 flex items-center gap-3"
            >
              <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
              Tải Ảnh
            </h2>

            <div class="space-y-4">
              <p class="text-sm text-text-secondary">
                Chọn nhiều ảnh cùng kích cỡ để gộp lại. (Tất cả ảnh phải có chiều rộng và chiều cao
                giống nhau)
              </p>
              <input
                ref="mergeInput"
                type="file"
                multiple
                accept="image/*"
                class="w-full px-4 py-2 border border-border-default bg-bg-deep text-text-primary cursor-pointer hover:border-accent-coral transition"
                @change="addMergeImages"
              />
            </div>
          </div>

          <!-- Images Grid Section -->
          <div v-if="mergeImages.length > 0" class="border border-border-default bg-bg-surface p-6">
            <h2
              class="font-display text-xl font-semibold text-text-primary mb-6 flex items-center gap-3"
            >
              <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
              Ảnh của Bạn ({{ mergeImages.length }})
            </h2>

            <div class="space-y-6">
              <!-- Status Message -->
              <div
                v-if="mergeStatus"
                :class="[
                  'p-4 border',
                  mergeStatus.type === 'success'
                    ? 'border-accent-sky bg-accent-sky/10 text-accent-sky'
                    : 'border-accent-coral bg-accent-coral/10 text-accent-coral',
                ]"
              >
                {{ mergeStatus.message }}
              </div>
              <!-- Grid Preview -->
              <div
                ref="mergePreview"
                class="p-6 bg-bg-deep border border-border-default/50"
                :style="{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${Math.min(mergeGridCols, mergeImages.length)}, 1fr)`,
                  gap: '0.75rem',
                }"
              >
                <div
                  v-for="(img, index) in mergeImages"
                  :key="img.id"
                  class="relative group cursor-move hover:opacity-80 transition"
                  draggable="true"
                  @dragstart="draggedImageId = img.id"
                  @dragover.prevent
                  @drop.prevent="
                    () => {
                      if (draggedImageId) {
                        const fromIndex = mergeImages.findIndex((i) => i.id === draggedImageId)
                        moveImage(fromIndex, index)
                      }
                    }
                  "
                >
                  <img
                    :src="img.src"
                    :alt="`Image ${index + 1}`"
                    loading="lazy"
                    class="w-full h-auto border border-border-default"
                  />
                  <button
                    class="absolute top-2 right-2 p-2 bg-accent-coral/90 text-bg-deep opacity-0 group-hover:opacity-100 transition"
                    @click="removeMergeImage(img.id)"
                  >
                    <Icon icon="lucide:x" class="w-4 h-4" />
                  </button>
                </div>
              </div>

              <!-- Layout Controls -->
              <div class="grid gap-4 sm:grid-cols-3">
                <div>
                  <label class="block text-xs text-text-secondary mb-2 font-display tracking-wide">
                    Cột: {{ mergeGridCols }}
                  </label>
                  <input
                    v-model.number="mergeGridCols"
                    type="range"
                    :min="1"
                    :max="10"
                    class="w-full"
                  />
                </div>
                <div>
                  <label class="block text-xs text-text-secondary mb-2 font-display tracking-wide">
                    Hàng: {{ mergeGridRows }}
                  </label>
                  <input
                    v-model.number="mergeGridRows"
                    type="range"
                    :min="1"
                    :max="10"
                    class="w-full"
                  />
                </div>
                <div>
                  <label class="block text-xs text-text-secondary mb-2 font-display tracking-wide">
                    Khoảng cách: {{ mergeGridGap }}px
                  </label>
                  <input
                    v-model.number="mergeGridGap"
                    type="range"
                    :min="0"
                    :max="20"
                    class="w-full"
                  />
                </div>
              </div>

              <!-- Info -->
              <div
                class="p-4 border border-border-default/50 bg-bg-deep text-sm text-text-secondary"
              >
                <p>
                  Grid hiện tại:
                  <span class="text-accent-coral"
                    >{{ calculateGridLayout.cols }} x {{ calculateGridLayout.rows }}</span
                  >
                  ({{ calculateGridLayout.totalCells }} ô) - Bạn tải {{ mergeImages.length }} ảnh
                </p>
                <p v-if="calculateGridLayout.totalCells > mergeImages.length" class="mt-2">
                  ⚠️ Sẽ có {{ calculateGridLayout.totalCells - mergeImages.length }} ô trống
                </p>
                <p
                  v-if="calculateGridLayout.totalCells < mergeImages.length"
                  class="mt-2 text-accent-coral"
                >
                  ✓ Tất cả {{ mergeImages.length }} ảnh sẽ được sử dụng (thêm hàng cần thiết)
                </p>
              </div>

              <!-- Export Button -->
              <button
                class="w-full px-6 py-3 bg-accent-coral text-bg-deep font-display font-semibold hover:bg-opacity-90 transition flex items-center justify-center gap-2"
                @click="drawMergeCanvas"
              >
                <Icon icon="lucide:download" class="w-5 h-5" />
                Export Ảnh Merged
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
