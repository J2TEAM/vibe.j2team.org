<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useFileDialog } from '@vueuse/core'
import { Icon } from '@iconify/vue'

const originalImage = ref<HTMLImageElement | null>(null)
const originalFile = ref<File | null>(null)
const previewUrl = ref<string>('')

const width = ref<number>(800)
const height = ref<number>(600)
const keepAspectRatio = ref(true)
const quality = ref(0.9)
const outputFormat = ref<'png' | 'jpeg' | 'webp'>('jpeg')

const originalWidth = ref(0)
const originalHeight = ref(0)
const originalSize = ref(0)
const resizedSize = ref(0)
const activePreset = ref<string | null>(null)
const previewKey = ref(0)

const aspectRatio = computed(() => {
  if (originalWidth.value && originalHeight.value) {
    return originalWidth.value / originalHeight.value
  }
  return 1
})

const presets = [
  { name: 'Instagram Post', width: 1080, height: 1080 },
  { name: 'Facebook Cover', width: 820, height: 312 },
  { name: 'Twitter Header', width: 1500, height: 500 },
  { name: 'YouTube Thumbnail', width: 1280, height: 720 },
  { name: 'Full HD', width: 1920, height: 1080 },
  { name: 'Avatar', width: 400, height: 400 },
]

const { open, onChange } = useFileDialog({
  accept: 'image/*',
  multiple: false,
})

onChange((files) => {
  const file = files?.[0]
  if (file) {
    handleFileSelect(file)
  }
})

function handleFileSelect(file: File) {
  originalFile.value = file
  originalSize.value = file.size

  const reader = new FileReader()
  reader.onload = (e) => {
    const img = new Image()
    img.onload = () => {
      originalImage.value = img
      originalWidth.value = img.width
      originalHeight.value = img.height
      width.value = img.width
      height.value = img.height
      generatePreview()
    }
    img.src = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

watch([width, height, quality, outputFormat], () => {
  if (originalImage.value) {
    generatePreview()
  }
})

watch(width, (newWidth) => {
  if (keepAspectRatio.value && originalImage.value && activePreset.value === null) {
    height.value = Math.round(newWidth / aspectRatio.value)
  }
})

watch(height, (newHeight) => {
  if (keepAspectRatio.value && originalImage.value && activePreset.value === null) {
    width.value = Math.round(newHeight * aspectRatio.value)
  }
})

function generatePreview() {
  if (!originalImage.value) return

  const canvas = document.createElement('canvas')
  canvas.width = width.value
  canvas.height = height.value

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Enable high-quality image smoothing
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  ctx.drawImage(originalImage.value, 0, 0, width.value, height.value)

  canvas.toBlob(
    (blob) => {
      if (blob) {
        // Revoke old preview URL before creating new one
        if (previewUrl.value) {
          URL.revokeObjectURL(previewUrl.value)
        }
        resizedSize.value = blob.size
        previewUrl.value = URL.createObjectURL(blob)
        // Force re-render by updating key
        previewKey.value++
      }
    },
    `image/${outputFormat.value}`,
    quality.value,
  )
}

function applyPreset(preset: { name: string; width: number; height: number }) {
  width.value = preset.width
  height.value = preset.height
  activePreset.value = preset.name
}

function downloadImage() {
  if (!originalImage.value) return

  const canvas = document.createElement('canvas')
  canvas.width = width.value
  canvas.height = height.value

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Enable high-quality image smoothing
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  ctx.drawImage(originalImage.value, 0, 0, width.value, height.value)

  canvas.toBlob(
    (blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `resized-${Date.now()}.${outputFormat.value}`
        a.click()
        URL.revokeObjectURL(url)
      }
    },
    `image/${outputFormat.value}`,
    quality.value,
  )
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

function reset() {
  // Revoke old preview URL to free memory
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }

  originalImage.value = null
  originalFile.value = null
  previewUrl.value = ''
  width.value = 800
  height.value = 600
  originalWidth.value = 0
  originalHeight.value = 0
  originalSize.value = 0
  resizedSize.value = 0
  activePreset.value = null
  previewKey.value = 0
}
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body py-12 px-4">
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-12 animate-fade-up">
        <h1 class="font-display text-5xl md:text-6xl font-bold text-accent-coral mb-4">
          Image Resizer
        </h1>
        <p class="text-text-secondary text-lg max-w-2xl mx-auto">
          Thay đổi kích thước ảnh nhanh chóng, hỗ trợ nhiều định dạng. Xử lý hoàn toàn trên trình
          duyệt, không upload lên server.
        </p>
      </div>

      <!-- Upload Area -->
      <div v-if="!originalImage" class="space-y-8">
        <div
          class="border-2 border-dashed border-border-default bg-bg-surface p-12 text-center transition hover:border-accent-coral animate-fade-up animate-delay-2 cursor-pointer"
          @click="() => open()"
          @dragover.prevent
          @drop.prevent="
            (e) => {
              const file = e.dataTransfer?.files[0]
              if (file && file.type.startsWith('image/')) {
                handleFileSelect(file)
              }
            }
          "
        >
          <Icon icon="lucide:upload" class="size-16 mx-auto text-accent-coral mb-4" />
          <p class="text-text-primary text-lg font-display mb-2">
            Kéo thả ảnh vào đây hoặc click để chọn
          </p>
          <p class="text-text-secondary text-sm">Hỗ trợ: JPG, PNG, WebP, GIF</p>
        </div>

        <!-- Features -->
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-up animate-delay-3">
          <div class="border border-border-default bg-bg-surface p-6">
            <Icon icon="lucide:maximize-2" class="size-8 text-accent-coral mb-3" />
            <h3 class="font-display text-lg font-semibold mb-2">Tùy chỉnh kích thước</h3>
            <p class="text-text-secondary text-sm">
              Nhập kích thước tùy ý hoặc chọn từ các preset có sẵn cho social media
            </p>
          </div>

          <div class="border border-border-default bg-bg-surface p-6">
            <Icon icon="lucide:image" class="size-8 text-accent-amber mb-3" />
            <h3 class="font-display text-lg font-semibold mb-2">Nhiều định dạng</h3>
            <p class="text-text-secondary text-sm">
              Xuất ảnh dưới dạng JPEG, PNG hoặc WebP với chất lượng tùy chỉnh
            </p>
          </div>

          <div class="border border-border-default bg-bg-surface p-6">
            <Icon icon="lucide:shield-check" class="size-8 text-accent-sky mb-3" />
            <h3 class="font-display text-lg font-semibold mb-2">Bảo mật tuyệt đối</h3>
            <p class="text-text-secondary text-sm">
              Xử lý hoàn toàn trên trình duyệt, ảnh không được upload lên server
            </p>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div v-else class="grid lg:grid-cols-2 gap-8">
        <!-- Left: Controls -->
        <div class="space-y-6 animate-fade-up animate-delay-2">
          <!-- Image Info -->
          <div class="border border-border-default bg-bg-surface p-6">
            <h2 class="font-display text-xl font-semibold mb-4 flex items-center gap-2">
              <span class="text-accent-amber text-sm">//</span>
              Thông tin ảnh
            </h2>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-text-secondary">Kích thước gốc:</span>
                <span class="text-text-primary font-display">
                  {{ originalWidth }} × {{ originalHeight }}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-text-secondary">Dung lượng gốc:</span>
                <span class="text-text-primary font-display">{{
                  formatFileSize(originalSize)
                }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-text-secondary">Kích thước mới:</span>
                <span class="text-accent-coral font-display">{{ width }} × {{ height }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-text-secondary">Dung lượng mới:</span>
                <span class="text-accent-coral font-display">{{
                  formatFileSize(resizedSize)
                }}</span>
              </div>
            </div>
          </div>

          <!-- Size Controls -->
          <div class="border border-border-default bg-bg-surface p-6">
            <h2 class="font-display text-xl font-semibold mb-4 flex items-center gap-2">
              <span class="text-accent-amber text-sm">//</span>
              Kích thước
            </h2>
            <div class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm text-text-secondary mb-2">Chiều rộng (px)</label>
                  <input
                    v-model.number="width"
                    type="number"
                    min="1"
                    class="w-full bg-bg-deep border border-border-default px-3 py-2 text-text-primary focus:border-accent-coral focus:outline-none"
                    @input="activePreset = null"
                  />
                </div>
                <div>
                  <label class="block text-sm text-text-secondary mb-2">Chiều cao (px)</label>
                  <input
                    v-model.number="height"
                    type="number"
                    min="1"
                    class="w-full bg-bg-deep border border-border-default px-3 py-2 text-text-primary focus:border-accent-coral focus:outline-none"
                    @input="activePreset = null"
                  />
                </div>
              </div>

              <label class="flex items-center gap-2 cursor-pointer">
                <input v-model="keepAspectRatio" type="checkbox" class="size-4" />
                <span class="text-sm text-text-secondary">Giữ tỷ lệ khung hình</span>
              </label>
            </div>
          </div>

          <!-- Presets -->
          <div class="border border-border-default bg-bg-surface p-6">
            <h2 class="font-display text-xl font-semibold mb-4 flex items-center gap-2">
              <span class="text-accent-amber text-sm">//</span>
              Kích thước có sẵn
            </h2>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="preset in presets"
                :key="preset.name"
                :class="[
                  'border px-3 py-2 text-sm transition',
                  activePreset === preset.name
                    ? 'border-accent-coral bg-accent-coral/10 text-accent-coral'
                    : 'border-border-default bg-bg-deep text-text-secondary hover:border-accent-coral hover:text-text-primary',
                ]"
                @click="applyPreset(preset)"
              >
                {{ preset.name }}
                <div
                  class="text-xs"
                  :class="activePreset === preset.name ? 'text-accent-coral/70' : 'text-text-dim'"
                >
                  {{ preset.width }}×{{ preset.height }}
                </div>
              </button>
            </div>
          </div>

          <!-- Format & Quality -->
          <div class="border border-border-default bg-bg-surface p-6">
            <h2 class="font-display text-xl font-semibold mb-4 flex items-center gap-2">
              <span class="text-accent-amber text-sm">//</span>
              Định dạng & Chất lượng
            </h2>
            <div class="space-y-4">
              <div>
                <label class="block text-sm text-text-secondary mb-2">Định dạng</label>
                <select
                  v-model="outputFormat"
                  class="w-full bg-bg-deep border border-border-default px-3 py-2 text-text-primary focus:border-accent-coral focus:outline-none"
                >
                  <option value="jpeg">JPEG</option>
                  <option value="png">PNG</option>
                  <option value="webp">WebP</option>
                </select>
              </div>

              <div v-if="outputFormat !== 'png'">
                <label class="block text-sm text-text-secondary mb-2">
                  Chất lượng: {{ Math.round(quality * 100) }}%
                </label>
                <input
                  v-model.number="quality"
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  class="w-full"
                />
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-3">
            <button
              class="flex-1 bg-accent-coral text-bg-deep font-display font-semibold px-6 py-3 transition hover:bg-accent-coral/90"
              @click="downloadImage"
            >
              <Icon icon="lucide:download" class="inline size-5 mr-2" />
              Tải xuống
            </button>
            <button
              class="border border-border-default bg-bg-surface px-6 py-3 text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
              @click="reset"
            >
              <Icon icon="lucide:refresh-cw" class="inline size-5" />
            </button>
          </div>
        </div>

        <!-- Right: Preview -->
        <div class="animate-fade-up animate-delay-3">
          <div class="border border-border-default bg-bg-surface p-6 sticky top-6">
            <h2 class="font-display text-xl font-semibold mb-4 flex items-center gap-2">
              <span class="text-accent-amber text-sm">//</span>
              Xem trước
            </h2>
            <div class="bg-bg-deep p-4 flex items-center justify-center min-h-[400px]">
              <img
                v-if="previewUrl"
                :key="previewKey"
                :src="previewUrl"
                alt="Preview"
                class="max-w-full max-h-[600px] object-contain"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Back Link -->
      <div class="mt-12 text-center animate-fade-up animate-delay-4">
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-5 py-2.5 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
        >
          &larr; Về trang chủ
        </RouterLink>
      </div>
    </div>
  </div>
</template>
