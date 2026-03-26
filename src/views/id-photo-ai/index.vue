<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'

type CropType = '4x6' | '3x4' | '2x2' | 'custom'
type ExportFormat = 'image/png' | 'image/jpeg'
type PresetType = 'natural' | 'passport' | 'bw'
type BgValue = 'white' | 'blue' | 'red' | 'gray'

// --- State ---
const imageLoaded = ref(false)
const displayImage = ref('')
const originalImage = ref('')
const imageUrl = ref('')
const isProcessing = ref(false)
const processingLabel = ref('Đang xử lý ảnh...')
const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// Background removal
const isRemovingBg = ref(false)
const bgRemoved = ref(false)
const removeBgProgress = ref(0)
const beforeRemoveBgImage = ref('')

// Transform
const scale = ref(100)
const rotation = ref(0)
const offsetX = ref(0)
const offsetY = ref(0)
const flipX = ref(false)
const flipY = ref(false)
const cropType = ref<CropType>('4x6')

// Filters
const brightness = ref(100)
const contrast = ref(100)
const saturation = ref(100)
const grayscale = ref(0)
const blur = ref(0)

// Export
const exportFormat = ref<ExportFormat>('image/png')
const exportQuality = ref(92)
const customWidth = ref(900)
const customHeight = ref(1200)

// Active tab for mobile control panel
const activeTab = ref<'adjust' | 'crop' | 'filter' | 'bg'>('adjust')

// Crop
const cropMode = ref(false)
const isCropping = ref(false)
const previewContainer = ref<HTMLElement | null>(null)
const cropStart = ref({ x: 0, y: 0 })
const cropEnd = ref({ x: 0, y: 0 })
const cropBox = ref({ x: 0, y: 0, w: 0, h: 0 })
const hasCropSelection = ref(false)
const beforeCropImage = ref('')

function getCropCoords(e: MouseEvent | TouchEvent) {
  if (!previewContainer.value) return { x: 0, y: 0 }
  const rect = previewContainer.value.getBoundingClientRect()
  const clientX = 'touches' in e ? e.touches[0]!.clientX : e.clientX
  const clientY = 'touches' in e ? e.touches[0]!.clientY : e.clientY
  return {
    x: Math.max(0, Math.min(clientX - rect.left, rect.width)),
    y: Math.max(0, Math.min(clientY - rect.top, rect.height)),
  }
}

function startCrop(e: MouseEvent | TouchEvent) {
  if (!cropMode.value) return
  const coords = getCropCoords(e)
  cropStart.value = coords
  cropEnd.value = coords
  isCropping.value = true
  hasCropSelection.value = false
}

function moveCrop(e: MouseEvent | TouchEvent) {
  if (!isCropping.value) return
  e.preventDefault()
  cropEnd.value = getCropCoords(e)
  const x = Math.min(cropStart.value.x, cropEnd.value.x)
  const y = Math.min(cropStart.value.y, cropEnd.value.y)
  const w = Math.abs(cropEnd.value.x - cropStart.value.x)
  const h = Math.abs(cropEnd.value.y - cropStart.value.y)
  cropBox.value = { x, y, w, h }
}

function endCrop() {
  if (!isCropping.value) return
  isCropping.value = false
  if (cropBox.value.w > 10 && cropBox.value.h > 10) {
    hasCropSelection.value = true
  } else {
    hasCropSelection.value = false
  }
}

function applyCrop() {
  if (!hasCropSelection.value || !previewContainer.value) return
  clearMessages()

  const container = previewContainer.value
  const rect = container.getBoundingClientRect()
  const imgEl = container.querySelector('img')
  if (!imgEl) return

  beforeCropImage.value = displayImage.value

  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    const imgRect = imgEl.getBoundingClientRect()

    // Map crop box from container coords to actual image coords
    const ratioX = img.naturalWidth / imgRect.width
    const ratioY = img.naturalHeight / imgRect.height
    const imgOffsetX = imgRect.left - rect.left
    const imgOffsetY = imgRect.top - rect.top

    const srcX = Math.max(0, (cropBox.value.x - imgOffsetX) * ratioX)
    const srcY = Math.max(0, (cropBox.value.y - imgOffsetY) * ratioY)
    const srcW = Math.min(cropBox.value.w * ratioX, img.naturalWidth - srcX)
    const srcH = Math.min(cropBox.value.h * ratioY, img.naturalHeight - srcY)

    if (srcW < 10 || srcH < 10) {
      errorMessage.value = 'Vùng cắt quá nhỏ. Vui lòng chọn lại.'
      return
    }

    const canvas = document.createElement('canvas')
    canvas.width = srcW
    canvas.height = srcH
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH)

    displayImage.value = canvas.toDataURL('image/png')
    cancelCrop()
    successMessage.value = 'Đã cắt ảnh thành công!'
  }
  img.src = displayImage.value
}

function undoCrop() {
  if (beforeCropImage.value) {
    displayImage.value = beforeCropImage.value
    beforeCropImage.value = ''
    successMessage.value = 'Đã hoàn tác cắt ảnh'
  }
}

function cancelCrop() {
  cropMode.value = false
  isCropping.value = false
  hasCropSelection.value = false
  cropBox.value = { x: 0, y: 0, w: 0, h: 0 }
}

function toggleCropMode() {
  if (cropMode.value) {
    cancelCrop()
  } else {
    cropMode.value = true
    hasCropSelection.value = false
    activeTab.value = 'crop'
    clearMessages()
  }
}

// Background
const backgroundOptions: { value: BgValue; color: string; label: string }[] = [
  { value: 'white', color: '#ffffff', label: 'Trắng' },
  { value: 'blue', color: '#dbeafe', label: 'Xanh dương' },
  { value: 'red', color: '#fee2e2', label: 'Đỏ nhạt' },
  { value: 'gray', color: '#e5e7eb', label: 'Xám' },
]
const activeBackground = ref<BgValue>('white')

// --- Computed ---
const scaleValue = computed(() => scale.value / 100)

const imageStyle = computed(() => ({
  transform: `translate(${offsetX.value}px, ${offsetY.value}px) rotate(${rotation.value}deg) scale(${scaleValue.value * (flipX.value ? -1 : 1)}, ${scaleValue.value * (flipY.value ? -1 : 1)})`,
  filter: `brightness(${brightness.value}%) contrast(${contrast.value}%) saturate(${saturation.value}%) grayscale(${grayscale.value}%) blur(${blur.value}px)`,
}))

const previewBgStyle = computed(() => {
  if (bgRemoved.value) {
    return { backgroundColor: getBackgroundColor(activeBackground.value) }
  }
  return {}
})

const hasAdjustments = computed(() => {
  return (
    scale.value !== 100 ||
    rotation.value !== 0 ||
    offsetX.value !== 0 ||
    offsetY.value !== 0 ||
    flipX.value ||
    flipY.value ||
    brightness.value !== 100 ||
    contrast.value !== 100 ||
    saturation.value !== 100 ||
    grayscale.value !== 0 ||
    blur.value !== 0
  )
})

const cropLabel = computed(() => {
  const labels: Record<CropType, string> = {
    '4x6': '4×6 cm',
    '3x4': '3×4 cm',
    '2x2': '2×2 inch',
    custom: 'Tùy chọn',
  }
  return labels[cropType.value]
})

function getBackgroundColor(bg: BgValue): string {
  const colors: Record<BgValue, string> = {
    white: '#ffffff',
    blue: '#dbeafe',
    red: '#fee2e2',
    gray: '#e5e7eb',
  }
  return colors[bg]
}

// --- File Handling ---
function handleFileSelect(event: Event) {
  clearMessages()
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) processFile(file)
}

function handleDrop(event: DragEvent) {
  isDragging.value = false
  clearMessages()
  const file = event.dataTransfer?.files?.[0]
  if (file) processFile(file)
}

function processFile(file: File) {
  if (file.size > 10 * 1024 * 1024) {
    errorMessage.value = 'File quá lớn! Vui lòng chọn ảnh dưới 10MB.'
    return
  }
  if (!file.type.startsWith('image/')) {
    errorMessage.value = 'Vui lòng chọn file hình ảnh (JPG, PNG).'
    return
  }
  const reader = new FileReader()
  reader.onload = (e) => {
    loadImage(e.target?.result as string)
  }
  reader.readAsDataURL(file)
}

async function loadFromUrl() {
  if (!imageUrl.value.trim()) return
  clearMessages()
  isProcessing.value = true
  processingLabel.value = 'Đang tải ảnh...'
  try {
    const response = await fetch(imageUrl.value)
    const blob = await response.blob()
    if (blob.size > 10 * 1024 * 1024) {
      throw new Error('Ảnh quá lớn')
    }
    const url = URL.createObjectURL(blob)
    loadImage(url)
  } catch {
    errorMessage.value = 'Không thể tải ảnh từ URL. Vui lòng thử lại.'
  } finally {
    isProcessing.value = false
  }
}

function loadImage(src: string) {
  resetAllStates()
  originalImage.value = src
  displayImage.value = src
  imageLoaded.value = true
}

function clearMessages() {
  errorMessage.value = ''
  successMessage.value = ''
}

// --- Controls ---
function applyPreset(preset: PresetType) {
  clearMessages()
  if (preset === 'natural') {
    brightness.value = 105
    contrast.value = 108
    saturation.value = 110
    grayscale.value = 0
    blur.value = 0
    successMessage.value = 'Đã áp dụng preset Tự nhiên'
  } else if (preset === 'passport') {
    brightness.value = 112
    contrast.value = 115
    saturation.value = 95
    grayscale.value = 0
    blur.value = 0.2
    activeBackground.value = 'white'
    successMessage.value = 'Đã áp dụng preset Ảnh thẻ'
  } else {
    brightness.value = 105
    contrast.value = 115
    saturation.value = 0
    grayscale.value = 100
    blur.value = 0
    successMessage.value = 'Đã áp dụng preset Đen trắng'
  }
}

function rotate(deg: number) {
  rotation.value += deg
}

function resetAllStates() {
  scale.value = 100
  rotation.value = 0
  brightness.value = 100
  contrast.value = 100
  saturation.value = 100
  grayscale.value = 0
  blur.value = 0
  offsetX.value = 0
  offsetY.value = 0
  flipX.value = false
  flipY.value = false
  activeBackground.value = 'white'
  clearMessages()
  bgRemoved.value = false
  removeBgProgress.value = 0
  beforeRemoveBgImage.value = ''
  beforeCropImage.value = ''
  cancelCrop()
}

function resetAdjustments() {
  scale.value = 100
  rotation.value = 0
  brightness.value = 100
  contrast.value = 100
  saturation.value = 100
  grayscale.value = 0
  blur.value = 0
  offsetX.value = 0
  offsetY.value = 0
  flipX.value = false
  flipY.value = false
  clearMessages()
  successMessage.value = 'Đã reset tất cả chỉnh sửa'
}

function resetToOriginal() {
  displayImage.value = originalImage.value
  resetAllStates()
  successMessage.value = 'Đã khôi phục ảnh gốc'
}

function uploadNewImage() {
  imageLoaded.value = false
  imageUrl.value = ''
  clearMessages()
  if (fileInput.value) fileInput.value.value = ''
}

function getExportDimensions(): { width: number; height: number } {
  if (cropType.value === '4x6') return { width: 800, height: 1200 }
  if (cropType.value === '3x4') return { width: 750, height: 1000 }
  if (cropType.value === '2x2') return { width: 600, height: 600 }
  return {
    width: Math.max(200, customWidth.value),
    height: Math.max(200, customHeight.value),
  }
}

// --- Background Removal ---
async function removeBackground() {
  if (!displayImage.value || isRemovingBg.value) return

  isRemovingBg.value = true
  removeBgProgress.value = 0
  clearMessages()
  beforeRemoveBgImage.value = displayImage.value

  try {
    removeBgProgress.value = 10
    const { removeBackground: removeBg } = (await import(
      /* @vite-ignore */ 'https://esm.sh/@imgly/background-removal@1.5.5'
    )) as {
      removeBackground: (src: string | Blob, config?: Record<string, unknown>) => Promise<Blob>
    }

    removeBgProgress.value = 20

    const response = await fetch(displayImage.value)
    const blob = await response.blob()

    removeBgProgress.value = 30

    const resultBlob = await removeBg(blob, {
      progress: (_key: string, current: number, total: number) => {
        if (total > 0) {
          removeBgProgress.value = 30 + Math.round((current / total) * 60)
        }
      },
    })

    removeBgProgress.value = 95
    const resultUrl = URL.createObjectURL(resultBlob)
    displayImage.value = resultUrl
    bgRemoved.value = true
    removeBgProgress.value = 100
    successMessage.value = 'Tách nền thành công! Chọn màu nền mới bên dưới.'
  } catch (err) {
    console.error('Background removal failed:', err)
    errorMessage.value =
      'Tách nền thất bại. Thử ảnh nhỏ hơn hoặc dùng trình duyệt Chrome/Edge mới nhất.'
  } finally {
    isRemovingBg.value = false
  }
}

function undoRemoveBackground() {
  if (beforeRemoveBgImage.value) {
    displayImage.value = beforeRemoveBgImage.value
    bgRemoved.value = false
    beforeRemoveBgImage.value = ''
    successMessage.value = 'Đã hoàn tác tách nền'
  }
}

// --- Download ---
function downloadImage() {
  if (!imageLoaded.value) return
  clearMessages()
  isProcessing.value = true
  processingLabel.value = 'Đang xuất ảnh...'

  const img = new Image()
  img.crossOrigin = 'anonymous'

  img.onload = () => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      isProcessing.value = false
      errorMessage.value = 'Không thể tạo bộ xử lý ảnh.'
      return
    }

    const { width, height } = getExportDimensions()
    canvas.width = width
    canvas.height = height

    ctx.fillStyle = getBackgroundColor(activeBackground.value)
    ctx.fillRect(0, 0, width, height)

    const fitScale = Math.min((width * 0.9) / img.width, (height * 0.9) / img.height)
    const baseWidth = img.width * fitScale
    const baseHeight = img.height * fitScale

    ctx.save()
    ctx.translate(width / 2 + offsetX.value, height / 2 + offsetY.value)
    ctx.rotate((rotation.value * Math.PI) / 180)
    ctx.scale(scaleValue.value * (flipX.value ? -1 : 1), scaleValue.value * (flipY.value ? -1 : 1))
    ctx.filter = `brightness(${brightness.value}%) contrast(${contrast.value}%) saturate(${saturation.value}%) grayscale(${grayscale.value}%) blur(${blur.value}px)`
    ctx.drawImage(img, -baseWidth / 2, -baseHeight / 2, baseWidth, baseHeight)
    ctx.restore()

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `id-photo-${Date.now()}.${exportFormat.value === 'image/png' ? 'png' : 'jpg'}`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
          successMessage.value = 'Đã tải ảnh về thành công!'
        }
        isProcessing.value = false
      },
      exportFormat.value,
      exportFormat.value === 'image/jpeg' ? exportQuality.value / 100 : undefined,
    )
  }

  img.onerror = () => {
    isProcessing.value = false
    errorMessage.value = 'Không thể xử lý ảnh hiện tại.'
  }

  img.src = displayImage.value
}
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <!-- Header -->
      <header class="mb-10 animate-fade-up">
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 text-text-secondary text-sm transition hover:text-accent-coral mb-4"
        >
          <Icon icon="lucide:arrow-left" class="size-4" />
          Về trang chủ
        </RouterLink>

        <div class="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 class="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-accent-coral">
              Ảnh Thẻ AI
            </h1>
            <p
              class="mt-2 text-text-secondary text-sm sm:text-base animate-fade-up animate-delay-2"
            >
              Tách nền, chỉnh sửa và xuất ảnh thẻ chuyên nghiệp — hoàn toàn miễn phí.
            </p>
          </div>

          <!-- Status Badges -->
          <div v-if="imageLoaded" class="flex items-center gap-2 animate-fade-up animate-delay-3">
            <span
              class="border px-2.5 py-1 text-xs font-display tracking-wide"
              :class="
                bgRemoved
                  ? 'border-accent-coral/40 bg-accent-coral/10 text-accent-coral'
                  : 'border-border-default text-text-dim'
              "
            >
              <Icon icon="lucide:scissors" class="inline size-3 -mt-0.5 mr-1" />
              {{ bgRemoved ? 'Đã tách nền' : 'Chưa tách nền' }}
            </span>
            <span
              class="border border-border-default px-2.5 py-1 text-xs font-display tracking-wide text-text-dim"
            >
              {{ cropLabel }}
            </span>
          </div>
        </div>
      </header>

      <!-- ═══════════ UPLOAD STATE ═══════════ -->
      <div v-if="!imageLoaded" class="max-w-2xl mx-auto animate-fade-up animate-delay-3">
        <!-- Features Row -->
        <div class="grid grid-cols-3 gap-3 mb-8">
          <div class="border border-border-default bg-bg-surface p-4 text-center">
            <Icon icon="lucide:scissors" class="size-8 mx-auto mb-2 text-accent-coral" />
            <p class="text-text-secondary text-xs font-display">Tách nền AI</p>
          </div>
          <div class="border border-border-default bg-bg-surface p-4 text-center">
            <Icon icon="lucide:sliders-horizontal" class="size-8 mx-auto mb-2 text-accent-amber" />
            <p class="text-text-secondary text-xs font-display">Chỉnh sửa pro</p>
          </div>
          <div class="border border-border-default bg-bg-surface p-4 text-center">
            <Icon icon="lucide:download" class="size-8 mx-auto mb-2 text-accent-sky" />
            <p class="text-text-secondary text-xs font-display">Xuất HD miễn phí</p>
          </div>
        </div>

        <!-- Drop Zone -->
        <div
          class="border-2 border-dashed p-10 sm:p-16 text-center cursor-pointer transition-all duration-300 group"
          :class="
            isDragging
              ? 'border-accent-coral bg-accent-coral/5'
              : 'border-border-default hover:border-accent-coral/50 hover:bg-bg-surface'
          "
          @click="fileInput?.click()"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleDrop"
        >
          <div
            class="size-20 mx-auto mb-5 border-2 border-dashed flex items-center justify-center transition-colors duration-300"
            :class="
              isDragging
                ? 'border-accent-coral text-accent-coral'
                : 'border-border-default text-text-dim group-hover:border-accent-coral/50 group-hover:text-accent-coral/70'
            "
          >
            <Icon icon="lucide:image-plus" class="size-10" />
          </div>
          <h3 class="font-display text-xl font-semibold mb-2">Kéo thả ảnh vào đây</h3>
          <p class="text-text-secondary text-sm">hoặc click để chọn file</p>
          <p class="text-text-dim text-xs mt-4">
            <Icon icon="lucide:info" class="inline size-3 -mt-0.5 mr-1" />
            Hỗ trợ JPG, PNG — Tối đa 10MB — Xử lý hoàn toàn trên thiết bị của bạn
          </p>
        </div>

        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          class="hidden"
          @change="handleFileSelect"
        />

        <!-- Divider -->
        <div class="flex items-center gap-4 my-8">
          <div class="flex-1 h-px bg-border-default"></div>
          <span class="text-text-dim text-xs font-display tracking-widest">HOẶC</span>
          <div class="flex-1 h-px bg-border-default"></div>
        </div>

        <!-- URL Input -->
        <div class="flex gap-2">
          <input
            v-model="imageUrl"
            type="text"
            placeholder="Dán link ảnh vào đây..."
            class="flex-1 bg-bg-surface border border-border-default px-4 py-3 text-sm text-text-primary placeholder:text-text-dim focus:border-accent-coral focus:outline-none transition"
            @keyup.enter="loadFromUrl"
          />
          <button
            class="border border-accent-coral bg-accent-coral/10 px-5 py-3 text-sm text-accent-coral font-semibold transition hover:bg-accent-coral/20 disabled:opacity-40 flex items-center gap-2"
            :disabled="!imageUrl.trim() || isProcessing"
            @click="loadFromUrl"
          >
            <Icon icon="lucide:link" class="size-4" />
            Tải
          </button>
        </div>

        <!-- Error -->
        <p
          v-if="errorMessage"
          class="mt-4 text-sm text-accent-coral border border-accent-coral/30 bg-accent-coral/5 px-4 py-3 flex items-start gap-2"
        >
          <Icon icon="lucide:alert-circle" class="size-4 shrink-0 mt-0.5" />
          {{ errorMessage }}
        </p>
      </div>

      <!-- ═══════════ EDITOR STATE ═══════════ -->
      <div v-else class="animate-fade-up animate-delay-2">
        <!-- Messages -->
        <div
          v-if="successMessage"
          class="mb-4 border border-accent-sky/30 bg-accent-sky/5 px-4 py-2.5 text-sm text-accent-sky flex items-center gap-2"
        >
          <Icon icon="lucide:check-circle" class="size-4 shrink-0" />
          {{ successMessage }}
        </div>
        <div
          v-if="errorMessage"
          class="mb-4 border border-accent-coral/30 bg-accent-coral/5 px-4 py-2.5 text-sm text-accent-coral flex items-center gap-2"
        >
          <Icon icon="lucide:alert-circle" class="size-4 shrink-0" />
          {{ errorMessage }}
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
          <!-- ═══ PREVIEW PANEL ═══ -->
          <div>
            <h2 class="font-display text-lg font-semibold flex items-center gap-3 mb-4">
              <span class="text-accent-coral text-sm tracking-widest font-display">//</span>
              Xem trước
            </h2>

            <!-- Preview Canvas -->
            <div
              ref="previewContainer"
              class="border overflow-hidden flex items-center justify-center relative select-none"
              :class="cropMode ? 'border-accent-amber cursor-crosshair' : 'border-border-default'"
              :style="previewBgStyle"
              style="aspect-ratio: 3 / 4"
              @mousedown="startCrop"
              @mousemove="moveCrop"
              @mouseup="endCrop"
              @mouseleave="endCrop"
              @touchstart.passive="startCrop"
              @touchmove="moveCrop"
              @touchend="endCrop"
            >
              <!-- Checkerboard pattern for transparency -->
              <div
                v-if="bgRemoved"
                class="absolute inset-0 opacity-10 pointer-events-none"
                style="
                  background-image: repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%);
                  background-size: 16px 16px;
                "
              ></div>

              <img
                :src="displayImage"
                :style="imageStyle"
                alt="Ảnh xem trước"
                class="max-w-full max-h-full object-contain transition-all duration-300 relative z-10 pointer-events-none"
              />

              <!-- Crop overlay -->
              <template v-if="cropMode">
                <!-- Dark overlay outside crop area -->
                <div
                  v-if="hasCropSelection || isCropping"
                  class="absolute inset-0 bg-bg-deep/50 z-20 pointer-events-none"
                ></div>

                <!-- Crop selection box -->
                <div
                  v-if="(hasCropSelection || isCropping) && cropBox.w > 2 && cropBox.h > 2"
                  class="absolute z-30 border-2 border-accent-amber pointer-events-none"
                  :style="{
                    left: cropBox.x + 'px',
                    top: cropBox.y + 'px',
                    width: cropBox.w + 'px',
                    height: cropBox.h + 'px',
                    boxShadow: '0 0 0 9999px rgba(15, 25, 35, 0.55)',
                  }"
                >
                  <!-- Corner handles -->
                  <div class="absolute -top-1 -left-1 size-2.5 bg-accent-amber"></div>
                  <div class="absolute -top-1 -right-1 size-2.5 bg-accent-amber"></div>
                  <div class="absolute -bottom-1 -left-1 size-2.5 bg-accent-amber"></div>
                  <div class="absolute -bottom-1 -right-1 size-2.5 bg-accent-amber"></div>

                  <!-- Size label -->
                  <div
                    class="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-mono text-accent-amber whitespace-nowrap bg-bg-deep/80 px-1.5 py-0.5"
                  >
                    {{ Math.round(cropBox.w) }} × {{ Math.round(cropBox.h) }}
                  </div>
                </div>

                <!-- Crop mode hint -->
                <div
                  v-if="!hasCropSelection && !isCropping"
                  class="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
                >
                  <div
                    class="bg-bg-deep/70 backdrop-blur-sm px-4 py-2 text-sm text-accent-amber font-display flex items-center gap-2"
                  >
                    <Icon icon="lucide:crop" class="size-4" />
                    Kéo chuột để chọn vùng cắt
                  </div>
                </div>
              </template>

              <!-- BG removal progress overlay -->
              <div
                v-if="isRemovingBg"
                class="absolute inset-0 bg-bg-deep/70 backdrop-blur-sm flex flex-col items-center justify-center z-20"
              >
                <div
                  class="size-16 mb-4 border-2 border-accent-coral border-t-transparent rounded-full animate-spin"
                ></div>
                <p class="font-display text-sm font-semibold text-text-primary mb-1">
                  {{
                    removeBgProgress < 25
                      ? 'Đang tải AI model...'
                      : removeBgProgress < 80
                        ? 'Đang phân tích ảnh...'
                        : 'Gần xong...'
                  }}
                </p>
                <div class="w-48 h-1.5 bg-bg-elevated overflow-hidden mt-2">
                  <div
                    class="h-full bg-accent-coral transition-all duration-500"
                    :style="{ width: removeBgProgress + '%' }"
                  ></div>
                </div>
                <span class="text-text-dim text-xs font-mono mt-1">{{ removeBgProgress }}%</span>
              </div>
            </div>

            <!-- Quick Toolbar -->
            <div
              class="border border-border-default bg-bg-surface mt-2 px-3 py-2 flex items-center justify-between flex-wrap gap-2"
            >
              <!-- Transform buttons -->
              <div class="flex items-center gap-1">
                <button
                  class="size-8 transition flex items-center justify-center"
                  :class="
                    cropMode ? 'text-accent-amber' : 'text-text-secondary hover:text-accent-amber'
                  "
                  title="Cắt ảnh"
                  @click="toggleCropMode"
                >
                  <Icon icon="lucide:crop" class="size-4" />
                </button>
                <div class="w-px h-5 bg-border-default mx-0.5"></div>
                <button
                  class="size-8 text-text-secondary transition hover:text-accent-sky flex items-center justify-center"
                  title="Xoay trái 15°"
                  @click="rotate(-15)"
                >
                  <Icon icon="lucide:rotate-ccw" class="size-4" />
                </button>
                <button
                  class="size-8 text-text-secondary transition hover:text-accent-sky flex items-center justify-center"
                  title="Xoay phải 15°"
                  @click="rotate(15)"
                >
                  <Icon icon="lucide:rotate-cw" class="size-4" />
                </button>
                <div class="w-px h-5 bg-border-default mx-0.5"></div>
                <button
                  class="size-8 transition flex items-center justify-center"
                  :class="flipX ? 'text-accent-coral' : 'text-text-secondary hover:text-accent-sky'"
                  title="Lật ngang"
                  @click="flipX = !flipX"
                >
                  <Icon icon="lucide:flip-horizontal" class="size-4" />
                </button>
                <button
                  class="size-8 transition flex items-center justify-center"
                  :class="flipY ? 'text-accent-coral' : 'text-text-secondary hover:text-accent-sky'"
                  title="Lật dọc"
                  @click="flipY = !flipY"
                >
                  <Icon icon="lucide:flip-vertical" class="size-4" />
                </button>
              </div>

              <!-- Zoom -->
              <div class="flex items-center gap-1">
                <button
                  class="size-8 text-text-secondary transition hover:text-accent-amber flex items-center justify-center font-mono text-sm"
                  @click="scale = Math.max(50, scale - 10)"
                >
                  −
                </button>
                <span class="text-text-dim text-xs font-mono w-10 text-center">{{ scale }}%</span>
                <button
                  class="size-8 text-text-secondary transition hover:text-accent-amber flex items-center justify-center font-mono text-sm"
                  @click="scale = Math.min(200, scale + 10)"
                >
                  +
                </button>
                <button
                  class="px-2 h-8 text-text-secondary transition hover:text-accent-sky text-xs font-mono"
                  @click="scale = 100"
                >
                  1:1
                </button>
              </div>
            </div>
          </div>

          <!-- ═══ CONTROL PANEL ═══ -->
          <div>
            <h2 class="font-display text-lg font-semibold flex items-center gap-3 mb-4">
              <span class="text-accent-amber text-sm tracking-widest font-display">//</span>
              Công cụ
            </h2>

            <div class="border border-border-default bg-bg-surface flex flex-col">
              <!-- ★ Tách Nền AI — Hero Section -->
              <div class="p-5 border-b border-border-default">
                <div class="flex items-center gap-2 mb-3">
                  <Icon icon="lucide:sparkles" class="size-4 text-accent-coral" />
                  <span class="text-text-dim text-xs font-display tracking-wide">TÁCH NỀN AI</span>
                </div>

                <div v-if="!bgRemoved" class="flex flex-col gap-2">
                  <button
                    class="w-full border border-accent-coral bg-accent-coral/10 px-4 py-3 text-sm font-semibold text-accent-coral transition hover:bg-accent-coral/20 disabled:opacity-40 flex items-center justify-center gap-2"
                    :disabled="isRemovingBg || isProcessing"
                    @click="removeBackground"
                  >
                    <Icon
                      :icon="isRemovingBg ? 'lucide:loader-2' : 'lucide:scissors'"
                      class="size-4"
                      :class="{ 'animate-spin': isRemovingBg }"
                    />
                    {{ isRemovingBg ? 'Đang xử lý...' : 'Tách nền ngay' }}
                  </button>
                  <p class="text-text-dim text-xs text-center">
                    Chạy trực tiếp trên trình duyệt — không upload lên server
                  </p>
                </div>

                <div v-else class="flex flex-col gap-2">
                  <div class="flex items-center gap-2 text-accent-sky text-sm">
                    <Icon icon="lucide:check-circle" class="size-4" />
                    <span class="font-semibold">Đã tách nền thành công</span>
                  </div>
                  <button
                    class="w-full border border-border-default bg-bg-elevated px-4 py-2 text-xs text-text-secondary transition hover:border-accent-amber hover:text-accent-amber flex items-center justify-center gap-2"
                    @click="undoRemoveBackground"
                  >
                    <Icon icon="lucide:undo" class="size-3" />
                    Hoàn tác tách nền
                  </button>
                </div>
              </div>

              <!-- Tab Navigation (mobile-friendly) -->
              <div class="flex border-b border-border-default">
                <button
                  class="flex-1 px-3 py-2.5 text-xs font-display tracking-wide transition flex items-center justify-center gap-1.5"
                  :class="
                    activeTab === 'adjust'
                      ? 'text-accent-coral border-b-2 border-accent-coral bg-accent-coral/5'
                      : 'text-text-dim hover:text-text-secondary'
                  "
                  @click="activeTab = 'adjust'"
                >
                  <Icon icon="lucide:move" class="size-3" />
                  Điều chỉnh
                </button>
                <button
                  class="flex-1 px-3 py-2.5 text-xs font-display tracking-wide transition flex items-center justify-center gap-1.5"
                  :class="
                    activeTab === 'crop'
                      ? 'text-accent-amber border-b-2 border-accent-amber bg-accent-amber/5'
                      : 'text-text-dim hover:text-text-secondary'
                  "
                  @click="activeTab = 'crop'"
                >
                  <Icon icon="lucide:crop" class="size-3" />
                  Cắt ảnh
                </button>
                <button
                  class="flex-1 px-3 py-2.5 text-xs font-display tracking-wide transition flex items-center justify-center gap-1.5"
                  :class="
                    activeTab === 'filter'
                      ? 'text-accent-amber border-b-2 border-accent-amber bg-accent-amber/5'
                      : 'text-text-dim hover:text-text-secondary'
                  "
                  @click="activeTab = 'filter'"
                >
                  <Icon icon="lucide:sliders-horizontal" class="size-3" />
                  Bộ lọc
                </button>
                <button
                  class="flex-1 px-3 py-2.5 text-xs font-display tracking-wide transition flex items-center justify-center gap-1.5"
                  :class="
                    activeTab === 'bg'
                      ? 'text-accent-sky border-b-2 border-accent-sky bg-accent-sky/5'
                      : 'text-text-dim hover:text-text-secondary'
                  "
                  @click="activeTab = 'bg'"
                >
                  <Icon icon="lucide:palette" class="size-3" />
                  Nền & Xuất
                </button>
              </div>

              <!-- Tab Content -->
              <div class="p-4 flex flex-col gap-4 max-h-[calc(100vh-500px)] overflow-y-auto">
                <!-- ═══ TAB: Adjust ═══ -->
                <template v-if="activeTab === 'adjust'">
                  <!-- Size -->
                  <div>
                    <label class="text-text-dim text-xs font-display tracking-wide block mb-2"
                      >KÍCH THƯỚC</label
                    >
                    <select
                      v-model="cropType"
                      class="w-full bg-bg-elevated border border-border-default px-3 py-2 text-sm text-text-primary focus:border-accent-coral focus:outline-none transition"
                    >
                      <option value="4x6">4×6 cm — Lý lịch, CMND</option>
                      <option value="3x4">3×4 cm — Hộ khẩu, bằng lái</option>
                      <option value="2x2">2×2 inch — Hộ chiếu, visa</option>
                      <option value="custom">Tự chọn kích thước</option>
                    </select>
                  </div>

                  <div v-if="cropType === 'custom'" class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="text-text-dim text-xs block mb-1">Rộng (px)</label>
                      <input
                        v-model.number="customWidth"
                        type="number"
                        min="200"
                        max="3000"
                        class="w-full bg-bg-elevated border border-border-default px-3 py-2 text-sm text-text-primary focus:border-accent-coral focus:outline-none"
                      />
                    </div>
                    <div>
                      <label class="text-text-dim text-xs block mb-1">Cao (px)</label>
                      <input
                        v-model.number="customHeight"
                        type="number"
                        min="200"
                        max="3000"
                        class="w-full bg-bg-elevated border border-border-default px-3 py-2 text-sm text-text-primary focus:border-accent-coral focus:outline-none"
                      />
                    </div>
                  </div>

                  <!-- Scale -->
                  <div>
                    <div class="flex justify-between items-center mb-1">
                      <label class="text-text-dim text-xs">Phóng to</label>
                      <span class="text-text-dim text-xs font-mono">{{ scale }}%</span>
                    </div>
                    <input
                      v-model.number="scale"
                      type="range"
                      min="50"
                      max="200"
                      class="w-full accent-accent-coral"
                    />
                  </div>

                  <!-- Offset -->
                  <div>
                    <div class="flex justify-between items-center mb-1">
                      <label class="text-text-dim text-xs">Dịch ngang</label>
                      <span class="text-text-dim text-xs font-mono">{{ offsetX }}px</span>
                    </div>
                    <input
                      v-model.number="offsetX"
                      type="range"
                      min="-150"
                      max="150"
                      class="w-full accent-accent-amber"
                    />
                  </div>
                  <div>
                    <div class="flex justify-between items-center mb-1">
                      <label class="text-text-dim text-xs">Dịch dọc</label>
                      <span class="text-text-dim text-xs font-mono">{{ offsetY }}px</span>
                    </div>
                    <input
                      v-model.number="offsetY"
                      type="range"
                      min="-150"
                      max="150"
                      class="w-full accent-accent-amber"
                    />
                  </div>
                </template>

                <!-- ═══ TAB: Crop ═══ -->
                <template v-if="activeTab === 'crop'">
                  <div>
                    <div class="flex items-center gap-2 mb-3">
                      <Icon icon="lucide:crop" class="size-4 text-accent-amber" />
                      <span class="text-text-dim text-xs font-display tracking-wide">CẮT ẢNH</span>
                    </div>

                    <p class="text-text-dim text-xs mb-4">
                      Kéo chuột trên ảnh để chọn vùng muốn giữ lại. Phần bên ngoài sẽ bị loại bỏ.
                    </p>

                    <!-- Toggle crop mode -->
                    <button
                      class="w-full border px-4 py-2.5 text-sm font-semibold transition flex items-center justify-center gap-2 mb-3"
                      :class="
                        cropMode
                          ? 'border-accent-amber bg-accent-amber/10 text-accent-amber hover:bg-accent-amber/20'
                          : 'border-border-default bg-bg-elevated text-text-secondary hover:border-accent-amber hover:text-accent-amber'
                      "
                      @click="toggleCropMode"
                    >
                      <Icon :icon="cropMode ? 'lucide:x' : 'lucide:crop'" class="size-4" />
                      {{ cropMode ? 'Tắt chế độ cắt' : 'Bật chế độ cắt' }}
                    </button>

                    <!-- Apply / Cancel crop -->
                    <div v-if="hasCropSelection" class="flex gap-2">
                      <button
                        class="flex-1 border border-accent-amber bg-accent-amber px-4 py-2.5 text-sm font-bold text-bg-deep transition hover:bg-accent-amber/90 flex items-center justify-center gap-2"
                        @click="applyCrop"
                      >
                        <Icon icon="lucide:check" class="size-4" />
                        Áp dụng cắt
                      </button>
                      <button
                        class="border border-border-default bg-bg-elevated px-4 py-2.5 text-sm text-text-secondary transition hover:border-accent-coral hover:text-accent-coral flex items-center justify-center gap-2"
                        @click="cancelCrop"
                      >
                        <Icon icon="lucide:x" class="size-4" />
                        Hủy
                      </button>
                    </div>

                    <!-- Undo crop -->
                    <button
                      v-if="beforeCropImage && !cropMode"
                      class="w-full border border-border-default bg-bg-elevated px-4 py-2 text-xs text-text-secondary transition hover:border-accent-amber hover:text-accent-amber flex items-center justify-center gap-2 mt-2"
                      @click="undoCrop"
                    >
                      <Icon icon="lucide:undo" class="size-3" />
                      Hoàn tác cắt ảnh
                    </button>
                  </div>

                  <!-- Tips -->
                  <div class="border border-border-default bg-bg-elevated p-3">
                    <p class="text-text-dim text-xs font-display tracking-wide mb-2">MẸO</p>
                    <ul class="text-text-dim text-xs flex flex-col gap-1.5">
                      <li class="flex items-start gap-1.5">
                        <Icon
                          icon="lucide:mouse-pointer"
                          class="size-3 shrink-0 mt-0.5 text-accent-amber"
                        />
                        Kéo chuột trên ảnh xem trước để vẽ vùng cắt
                      </li>
                      <li class="flex items-start gap-1.5">
                        <Icon
                          icon="lucide:smartphone"
                          class="size-3 shrink-0 mt-0.5 text-accent-amber"
                        />
                        Trên mobile: dùng ngón tay kéo trên ảnh
                      </li>
                      <li class="flex items-start gap-1.5">
                        <Icon
                          icon="lucide:layers"
                          class="size-3 shrink-0 mt-0.5 text-accent-amber"
                        />
                        Có thể cắt nhiều lần liên tiếp
                      </li>
                    </ul>
                  </div>
                </template>

                <!-- ═══ TAB: Filters ═══ -->
                <template v-if="activeTab === 'filter'">
                  <!-- Presets -->
                  <div>
                    <label class="text-text-dim text-xs font-display tracking-wide block mb-2"
                      >PRESET</label
                    >
                    <div class="grid grid-cols-3 gap-2">
                      <button
                        class="border border-border-default bg-bg-elevated px-3 py-2.5 text-xs text-text-secondary transition hover:border-accent-amber hover:text-accent-amber flex flex-col items-center gap-1"
                        @click="applyPreset('natural')"
                      >
                        <Icon icon="lucide:sun" class="size-4" />
                        Tự nhiên
                      </button>
                      <button
                        class="border border-border-default bg-bg-elevated px-3 py-2.5 text-xs text-text-secondary transition hover:border-accent-amber hover:text-accent-amber flex flex-col items-center gap-1"
                        @click="applyPreset('passport')"
                      >
                        <Icon icon="lucide:id-card" class="size-4" />
                        Ảnh thẻ
                      </button>
                      <button
                        class="border border-border-default bg-bg-elevated px-3 py-2.5 text-xs text-text-secondary transition hover:border-accent-amber hover:text-accent-amber flex flex-col items-center gap-1"
                        @click="applyPreset('bw')"
                      >
                        <Icon icon="lucide:contrast" class="size-4" />
                        Đen trắng
                      </button>
                    </div>
                  </div>

                  <!-- Sliders -->
                  <div>
                    <div class="flex justify-between items-center mb-1">
                      <label class="text-text-dim text-xs">Độ sáng</label>
                      <span class="text-text-dim text-xs font-mono">{{ brightness }}%</span>
                    </div>
                    <input
                      v-model.number="brightness"
                      type="range"
                      min="50"
                      max="180"
                      class="w-full accent-accent-coral"
                    />
                  </div>
                  <div>
                    <div class="flex justify-between items-center mb-1">
                      <label class="text-text-dim text-xs">Tương phản</label>
                      <span class="text-text-dim text-xs font-mono">{{ contrast }}%</span>
                    </div>
                    <input
                      v-model.number="contrast"
                      type="range"
                      min="50"
                      max="180"
                      class="w-full accent-accent-coral"
                    />
                  </div>
                  <div>
                    <div class="flex justify-between items-center mb-1">
                      <label class="text-text-dim text-xs">Bão hòa</label>
                      <span class="text-text-dim text-xs font-mono">{{ saturation }}%</span>
                    </div>
                    <input
                      v-model.number="saturation"
                      type="range"
                      min="0"
                      max="200"
                      class="w-full accent-accent-amber"
                    />
                  </div>
                  <div>
                    <div class="flex justify-between items-center mb-1">
                      <label class="text-text-dim text-xs">Đen trắng</label>
                      <span class="text-text-dim text-xs font-mono">{{ grayscale }}%</span>
                    </div>
                    <input
                      v-model.number="grayscale"
                      type="range"
                      min="0"
                      max="100"
                      class="w-full accent-accent-sky"
                    />
                  </div>
                  <div>
                    <div class="flex justify-between items-center mb-1">
                      <label class="text-text-dim text-xs">Làm mịn</label>
                      <span class="text-text-dim text-xs font-mono">{{ blur }}px</span>
                    </div>
                    <input
                      v-model.number="blur"
                      type="range"
                      min="0"
                      max="6"
                      step="0.2"
                      class="w-full accent-accent-sky"
                    />
                  </div>
                </template>

                <!-- ═══ TAB: Background & Export ═══ -->
                <template v-if="activeTab === 'bg'">
                  <!-- Background Color -->
                  <div>
                    <label class="text-text-dim text-xs font-display tracking-wide block mb-2">
                      MÀU NỀN {{ bgRemoved ? '(thay nền mới)' : '(khi xuất ảnh)' }}
                    </label>
                    <div class="flex gap-3">
                      <button
                        v-for="bg in backgroundOptions"
                        :key="bg.value"
                        class="size-11 border-2 transition-all duration-200 flex items-center justify-center"
                        :class="
                          activeBackground === bg.value
                            ? 'border-accent-coral scale-110'
                            : 'border-border-default hover:border-text-dim'
                        "
                        :style="{ backgroundColor: bg.color }"
                        :title="bg.label"
                        @click="activeBackground = bg.value"
                      >
                        <Icon
                          v-if="activeBackground === bg.value"
                          icon="lucide:check"
                          class="size-4"
                          :class="bg.value === 'white' ? 'text-accent-coral' : 'text-accent-coral'"
                        />
                      </button>
                    </div>
                  </div>

                  <!-- Export Format -->
                  <div>
                    <label class="text-text-dim text-xs font-display tracking-wide block mb-2"
                      >ĐỊNH DẠNG</label
                    >
                    <div class="grid grid-cols-2 gap-2">
                      <button
                        class="border px-3 py-2.5 text-xs transition flex items-center justify-center gap-1.5"
                        :class="
                          exportFormat === 'image/png'
                            ? 'border-accent-sky bg-accent-sky/10 text-accent-sky'
                            : 'border-border-default text-text-secondary hover:border-accent-sky'
                        "
                        @click="exportFormat = 'image/png'"
                      >
                        <Icon icon="lucide:file-image" class="size-3" />
                        PNG
                      </button>
                      <button
                        class="border px-3 py-2.5 text-xs transition flex items-center justify-center gap-1.5"
                        :class="
                          exportFormat === 'image/jpeg'
                            ? 'border-accent-sky bg-accent-sky/10 text-accent-sky'
                            : 'border-border-default text-text-secondary hover:border-accent-sky'
                        "
                        @click="exportFormat = 'image/jpeg'"
                      >
                        <Icon icon="lucide:file-image" class="size-3" />
                        JPG
                      </button>
                    </div>
                  </div>

                  <!-- JPG Quality -->
                  <div v-if="exportFormat === 'image/jpeg'">
                    <div class="flex justify-between items-center mb-1">
                      <label class="text-text-dim text-xs">Chất lượng</label>
                      <span class="text-text-dim text-xs font-mono">{{ exportQuality }}%</span>
                    </div>
                    <input
                      v-model.number="exportQuality"
                      type="range"
                      min="60"
                      max="100"
                      class="w-full accent-accent-coral"
                    />
                  </div>
                </template>
              </div>

              <!-- ═══ Action Buttons (always visible) ═══ -->
              <div class="p-4 border-t border-border-default flex flex-col gap-2">
                <!-- Download -->
                <button
                  class="w-full border border-accent-coral bg-accent-coral px-4 py-3 text-sm font-bold text-bg-deep transition hover:bg-accent-coral/90 disabled:opacity-40 flex items-center justify-center gap-2"
                  :disabled="isProcessing || isRemovingBg"
                  @click="downloadImage"
                >
                  <Icon icon="lucide:download" class="size-4" />
                  Tải ảnh về
                </button>

                <!-- Secondary actions -->
                <div class="grid grid-cols-2 gap-2">
                  <button
                    v-if="hasAdjustments"
                    class="border border-border-default bg-bg-surface px-3 py-2 text-xs text-text-secondary transition hover:border-accent-amber hover:text-accent-amber flex items-center justify-center gap-1.5"
                    :disabled="isProcessing"
                    @click="resetAdjustments"
                  >
                    <Icon icon="lucide:undo-2" class="size-3" />
                    Reset
                  </button>
                  <button
                    v-else
                    class="border border-border-default bg-bg-surface px-3 py-2 text-xs text-text-secondary transition hover:border-accent-coral hover:text-accent-coral flex items-center justify-center gap-1.5"
                    :disabled="isProcessing"
                    @click="resetToOriginal"
                  >
                    <Icon icon="lucide:image" class="size-3" />
                    Ảnh gốc
                  </button>

                  <button
                    class="border border-border-default bg-bg-surface px-3 py-2 text-xs text-text-secondary transition hover:border-text-primary hover:text-text-primary flex items-center justify-center gap-1.5"
                    @click="uploadNewImage"
                  >
                    <Icon icon="lucide:replace" class="size-3" />
                    Ảnh khác
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Processing Overlay -->
      <Teleport to="body">
        <div
          v-if="isProcessing"
          class="fixed inset-0 z-[9999] bg-bg-deep/80 backdrop-blur-sm flex items-center justify-center"
        >
          <div class="border border-border-default bg-bg-surface p-8 text-center">
            <div
              class="size-12 mx-auto mb-4 border-2 border-accent-sky border-t-transparent rounded-full animate-spin"
            ></div>
            <p class="font-display text-lg font-semibold text-text-primary">
              {{ processingLabel }}
            </p>
            <p class="text-text-dim text-sm mt-1">Vui lòng đợi một chút</p>
          </div>
        </div>
      </Teleport>

      <!-- Footer -->
      <div class="text-center mt-12 animate-fade-up animate-delay-5">
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
