<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useClipboard, useEventListener } from '@vueuse/core'
import { Icon } from '@iconify/vue'

// --- State ---
const imageInput = ref<HTMLInputElement | null>(null)
const hiddenCanvas = document.createElement('canvas')
const sourceImage = ref<HTMLImageElement | null>(null)
const isDragging = ref(false)

// Controls
const resolution = ref(80) // Reduced default for better mobile perf
const contrast = ref(1.1)
const asciiResult = ref('')
const customCharset = ref('@%#*+=-:. ') // Standard 10-level grayscale
const monoColor = ref('#FF6B4A') // accent-coral default

// Status
const isProcessing = ref(false)

// --- Logic ---
// --- I18n ---
const lang = ref<'vi' | 'en'>('vi')
const t = computed(
  () =>
    ({
      vi: {
        title: 'ASCII',
        subtitle: 'STUDIO',
        description:
          'Biến đổi pixel thành dữ liệu ký tự thô. Một sự tôn vinh cho nghệ thuật kỹ thuật số và phong cách J2TEAM.',
        back: 'Quay lại',
        controls: 'THÔNG SỐ',
        dropzone: 'Thả ảnh vào hoặc',
        browse: 'chọn tệp',
        ready: 'Dữ liệu đã nạp',
        resolution: 'Mật độ',
        contrast: 'Tương phản',
        charset: 'Bộ ký tự (Sáng → Tối)',
        copy: 'Chép mã',
        download: 'Tải về',
        tip: 'Mẹo: Dùng chuỗi "@%#*+=-:. " để có độ chuyển mịn nhất. Tăng tương phản để làm nổi bật chủ thể!',
        awaiting: 'Hệ thống đang chờ dữ liệu...',
        copied: 'Đã copy vào bộ nhớ tạm!',
        artIsCode: 'Nghệ thuật là mã nguồn // Mã nguồn là nghệ thuật',
      },
      en: {
        title: 'ASCII',
        subtitle: 'STUDIO',
        description:
          'Transform pixels into raw character data. A tribute to digital art and the J2TEAM vibe.',
        back: 'Back',
        controls: 'PARAMETERS',
        dropzone: 'Drop image or',
        browse: 'browse',
        ready: 'Data Loaded',
        resolution: 'Density',
        contrast: 'Contrast',
        charset: 'Charset (Bright → Dark)',
        copy: 'Copy',
        download: 'Export',
        tip: 'Tip: Use "@%#*+=-:. " for smooth gradients. Increase contrast to make subjects pop!',
        awaiting: 'System awaiting input...',
        copied: 'Copied to clipboard!',
        artIsCode: 'Art is code // Code is art',
      },
    })[lang.value],
)

const handleFile = (file: File) => {
  if (!file.type.startsWith('image/')) {
    alert(lang.value === 'vi' ? 'Vui lòng chọn một tệp hình ảnh!' : 'Please select an image file!')
    return
  }
  // ... rest of logic stays same

  const reader = new FileReader()
  reader.onload = (e) => {
    const img = new Image()
    img.onload = () => {
      sourceImage.value = img
      processImage()
    }
    img.src = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

const onFileChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) handleFile(file)
}

const onDrop = (e: DragEvent) => {
  isDragging.value = false
  const file = e.dataTransfer?.files[0]
  if (file) handleFile(file)
}

const processImage = () => {
  if (!sourceImage.value) return
  isProcessing.value = true

  const img = sourceImage.value
  const res = resolution.value

  // Aspect ratio math: ASCII characters are taller than wide (~2.5 ratio)
  // To keep image proportional, we adjust the height
  const width = res
  const height = Math.floor((img.height / img.width) * res * 0.45)

  const ctx = hiddenCanvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return

  hiddenCanvas.width = width
  hiddenCanvas.height = height

  // Draw and get pixel data
  ctx.drawImage(img, 0, 0, width, height)
  const imageData = ctx.getImageData(0, 0, width, height).data

  let result = ''
  const charset = customCharset.value
  const charLen = charset.length

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4
      // Extract pixel values safely
      const r = imageData[offset] ?? 0
      const g = imageData[offset + 1] ?? 0
      const b = imageData[offset + 2] ?? 0

      // Calculate brightness (Luminance) with contrast adjustment
      let brightness = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
      brightness = Math.pow(brightness, contrast.value) // Simple contrast

      const charIndex = Math.floor((1 - brightness) * (charLen - 1))
      const char = charset[charIndex] || ' '

      // If color mode, we'd need a more complex rendering (HTML vs Text)
      // For now, we focus on generating the core string
      result += char
    }
    result += '\n'
  }

  asciiResult.value = result
  isProcessing.value = false
}

// Watchers for Real-time
watch([resolution, contrast, customCharset, lang], () => {
  if (sourceImage.value) processImage()
})

const { copy } = useClipboard()

const copyToClipboard = async () => {
  await copy(asciiResult.value)
  alert(t.value.copied)
}

const downloadAscii = () => {
  const blob = new Blob([asciiResult.value], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `j2team-vibe-ascii-${Date.now()}.txt`
  link.click()
  URL.revokeObjectURL(url)
}

onMounted(() => {
  // Setup global drag listeners
  useEventListener(window, 'dragover', (e) => {
    e.preventDefault()
    isDragging.value = true
  })
  useEventListener(window, 'dragleave', (e) => {
    e.preventDefault()
    isDragging.value = false
  })
})
</script>

<template>
  <div
    class="min-h-screen bg-bg-deep text-text-primary font-body overflow-x-hidden selection:bg-accent-coral selection:text-bg-deep"
  >
    <!-- Top Decorative Line -->
    <div class="h-1 bg-accent-coral animate-pulse-border"></div>

    <main class="max-w-7xl mx-auto px-6 py-12">
      <!-- Header Section -->
      <header
        class="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8 animate-fade-up"
      >
        <div class="space-y-4">
          <div class="flex items-center gap-4">
            <div
              class="inline-block bg-accent-coral text-bg-deep font-display font-bold text-xs tracking-widest px-3 py-1.5 rotate-2"
            >
              VOL.01 / 2026 / EXPERIMENTAL
            </div>
            <!-- Language Switcher -->
            <button
              @click="lang = lang === 'vi' ? 'en' : 'vi'"
              class="border border-border-default px-2 py-1 text-[10px] font-display tracking-widest uppercase hover:border-accent-coral transition-colors"
            >
              {{ lang === 'vi' ? 'EN' : 'VI' }}
            </button>
          </div>
          <h1
            class="font-display text-6xl md:text-8xl font-bold text-text-primary uppercase tracking-tighter leading-none"
          >
            {{ t.title }}<br /><span class="text-accent-coral">{{ t.subtitle }}</span>
          </h1>
          <p
            class="text-text-secondary max-w-xl text-lg font-medium border-l-2 border-accent-amber pl-4"
          >
            {{ t.description }}
          </p>
        </div>

        <RouterLink
          to="/"
          class="group flex items-center gap-3 font-display uppercase tracking-widest text-sm hover:text-accent-coral transition-colors"
        >
          <span class="text-accent-coral group-hover:-translate-x-1 transition-transform">//</span>
          {{ t.back }}
        </RouterLink>
      </header>

      <!-- Dot Divider -->
      <div class="flex gap-2 mb-16 opacity-30">
        <span v-for="n in 60" :key="n" class="w-1 h-1 rounded-full bg-border-default" />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <!-- Sidebar Controls -->
        <aside class="lg:col-span-4 space-y-8 animate-fade-up animate-delay-1">
          <section class="border border-border-default bg-bg-surface p-8 relative overflow-hidden">
            <span
              class="absolute top-4 right-4 font-display text-4xl font-bold text-accent-amber/5 select-none pointer-events-none"
              >01</span
            >

            <h2 class="font-display text-xl font-semibold mb-6 flex items-center gap-3">
              <span class="text-accent-amber font-display text-sm tracking-widest">//</span>
              {{ t.controls }}
            </h2>

            <!-- File Upload -->
            <div
              class="border-2 border-dashed border-border-default h-48 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 mb-8 px-4 text-center group"
              :class="[
                isDragging
                  ? 'border-accent-coral bg-accent-coral/5 scale-[0.98]'
                  : 'hover:border-accent-amber hover:bg-bg-elevated',
              ]"
              @click="imageInput?.click()"
              @drop.prevent="onDrop"
              @dragover.prevent="isDragging = true"
              @dragleave.prevent="isDragging = false"
            >
              <input
                type="file"
                ref="imageInput"
                class="hidden"
                accept="image/*"
                @change="onFileChange"
              />
              <Icon
                icon="lucide:upload-cloud"
                class="text-4xl mb-4 text-text-dim group-hover:text-accent-coral transition-colors"
              />
              <p v-if="!sourceImage" class="text-text-secondary text-sm">
                {{ t.dropzone }} <span class="text-accent-sky underline">{{ t.browse }}</span>
              </p>
              <p v-else class="text-accent-amber text-sm font-bold truncate max-w-full">
                {{ t.ready }}
              </p>
            </div>

            <!-- Param Sliders -->
            <div class="space-y-6">
              <div class="space-y-3">
                <div class="flex justify-between text-xs font-display tracking-widest uppercase">
                  <label class="text-text-dim">{{ t.resolution }}</label>
                  <span class="text-accent-coral">{{ resolution }}px</span>
                </div>
                <input
                  type="range"
                  v-model.number="resolution"
                  min="20"
                  max="300"
                  step="5"
                  class="w-full h-1.5 bg-bg-deep rounded-none appearance-none cursor-pointer accent-accent-coral border border-border-default"
                />
              </div>

              <div class="space-y-3">
                <div class="flex justify-between text-xs font-display tracking-widest uppercase">
                  <label class="text-text-dim">{{ t.contrast }}</label>
                  <span class="text-accent-amber">{{ contrast }}x</span>
                </div>
                <input
                  type="range"
                  v-model.number="contrast"
                  min="0.5"
                  max="3.0"
                  step="0.1"
                  class="w-full h-1.5 bg-bg-deep rounded-none appearance-none cursor-pointer accent-accent-amber border border-border-default"
                />
              </div>

              <div class="space-y-3">
                <label class="text-xs font-display tracking-widest uppercase text-text-dim">{{
                  t.charset
                }}</label>
                <input
                  type="text"
                  v-model="customCharset"
                  class="w-full bg-bg-deep border border-border-default px-4 py-2 text-sm font-mono text-accent-sky focus:border-accent-coral outline-none transition-colors"
                />
              </div>

              <div class="flex flex-wrap gap-4 pt-4">
                <button
                  @click="copyToClipboard"
                  class="flex-1 min-w-[120px] bg-bg-deep border border-border-default px-4 py-3 text-xs font-display tracking-widest uppercase text-text-secondary hover:border-accent-coral hover:text-text-primary transition-all flex items-center justify-center gap-2"
                >
                  <Icon icon="lucide:copy" /> {{ t.copy }}
                </button>
                <button
                  @click="downloadAscii"
                  class="flex-1 min-w-[120px] bg-bg-deep border border-border-default px-4 py-3 text-xs font-display tracking-widest uppercase text-text-secondary hover:border-accent-coral hover:text-text-primary transition-all flex items-center justify-center gap-2"
                >
                  <Icon icon="lucide:download" /> {{ t.download }}
                </button>
              </div>
            </div>
          </section>

          <!-- Tips Section -->
          <div class="bg-accent-coral/5 border-l-4 border-accent-coral p-6 space-y-2 opacity-80">
            <h4 class="font-display text-sm font-bold text-accent-coral tracking-widest uppercase">
              Geek Tip:
            </h4>
            <p class="text-text-secondary text-sm leading-relaxed">
              {{ t.tip }}
            </p>
          </div>
        </aside>

        <!-- Preview Area -->
        <section class="lg:col-span-8 animate-fade-up animate-delay-2">
          <div
            class="border border-border-default bg-bg-surface h-full min-h-[500px] flex flex-col relative overflow-hidden"
          >
            <!-- Terminal Header -->
            <div
              class="border-b border-border-default px-6 py-4 flex items-center justify-between bg-bg-deep"
            >
              <div class="flex gap-1.5">
                <div class="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                <div class="w-2.5 h-2.5 rounded-full bg-accent-amber/50"></div>
                <div class="w-2.5 h-2.5 rounded-full bg-accent-sky/50"></div>
              </div>
              <div class="font-display text-[10px] tracking-widest uppercase text-text-dim">
                Real-time ASCII Renderer // v1.0.0
              </div>
            </div>

            <!-- Content Area -->
            <div class="flex-1 overflow-auto p-8 flex flex-col items-center justify-center">
              <!-- Empty State -->
              <div
                v-if="!sourceImage"
                class="flex flex-col items-center justify-center space-y-8 animate-pulse"
              >
                <div class="relative flex items-center justify-center">
                  <!-- Outer Spinning Frame -->
                  <div class="w-32 h-32 border border-accent-amber/10 animate-spin-slow"></div>
                  <!-- Inner Rotating Frame -->
                  <div
                    class="absolute w-24 h-24 border border-accent-coral/20 -rotate-45 animate-spin duration-[6s] linear"
                  ></div>
                  <!-- Static Icon -->
                  <Icon icon="lucide:image" class="absolute text-5xl text-accent-amber/20" />
                </div>
                <div class="space-y-2 text-center">
                  <p
                    class="font-display uppercase tracking-[0.4em] text-accent-coral/60 text-xs font-bold"
                  >
                    {{ t.awaiting }}
                  </p>
                  <div class="h-0.5 w-12 bg-border-default mx-auto opacity-30"></div>
                </div>
              </div>

              <!-- Fixed Monospace ASCII Table -->
              <template v-else>
                <pre
                  class="font-mono text-[6px] md:text-[8px] leading-[1] whitespace-pre text-center select-all bg-transparent w-full h-full p-4 overflow-auto scrollbar-hide"
                  :style="{ color: monoColor }"
                  >{{ asciiResult }}</pre
                >

                <!-- Quick Action Color Presets (Moved inside v-else) -->
                <div class="absolute bottom-6 right-6 flex flex-col gap-3 animate-fade-up">
                  <button
                    @click="monoColor = '#FF6B4A'"
                    class="w-6 h-6 bg-[#FF6B4A] border border-white/10 hover:scale-110 transition-transform shadow-lg shadow-[#FF6B4A]/20"
                  />
                  <button
                    @click="monoColor = '#10b981'"
                    class="w-6 h-6 bg-[#10b981] border border-white/10 hover:scale-110 transition-transform shadow-lg shadow-[#10b981]/20"
                  />
                  <button
                    @click="monoColor = '#facc15'"
                    class="w-6 h-6 bg-[#facc15] border border-white/10 hover:scale-110 transition-transform shadow-lg shadow-[#facc15]/20"
                  />
                  <button
                    @click="monoColor = '#38bdf8'"
                    class="w-6 h-6 bg-[#38bdf8] border border-white/10 hover:scale-110 transition-transform shadow-lg shadow-[#38bdf8]/20"
                  />
                  <button
                    @click="monoColor = '#F0EDE6'"
                    class="w-6 h-6 bg-[#F0EDE6] border border-white/10 hover:scale-110 transition-transform shadow-lg shadow-[#F0EDE6]/20"
                  />
                </div>
              </template>
            </div>
          </div>
        </section>
      </div>

      <!-- Footer Branding -->
      <footer
        class="mt-20 border-t border-border-default pt-8 pb-12 flex flex-col items-center gap-6 animate-fade-up animate-delay-3"
      >
        <div
          class="font-display text-4xl font-extrabold text-bg-surface select-none pointer-events-none"
        >
          J2TEAM VIBE 2026
        </div>
        <div class="text-text-dim text-[10px] tracking-[0.3em] uppercase">
          {{ t.artIsCode }}
        </div>
      </footer>
    </main>
  </div>
</template>

<style scoped>
/* Custom Range Input Styling for Chrome/Safari */
input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  height: 16px;
  width: 16px;
  background: white;
  border-radius: 0;
  cursor: pointer;
}

input[type='range']::-moz-range-thumb {
  height: 16px;
  width: 16px;
  background: white;
  border-radius: 0;
  cursor: pointer;
  border: none;
}

/* Scrollbar styling for the pre area */
pre::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
pre::-webkit-scrollbar-track {
  background: transparent;
}
pre::-webkit-scrollbar-thumb {
  background: var(--border-default);
}
pre::-webkit-scrollbar-thumb:hover {
  background: var(--accent-coral);
}
</style>
