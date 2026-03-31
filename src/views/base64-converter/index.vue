<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

// ===== Types =====
interface BuildResult {
  blob: Blob
  url: string
  mime: string
}

interface NormalizedInput {
  mime: string | null
  b64: string
}

// ===== Base64 → Image =====
const base64input = ref<string>('')
const forceMime = ref<string>('')
const filename = ref<string>('image.png')
const errorMsg = ref<string>('')
const previewUrl = ref<string>('')
const previewMime = ref<string>('')
const previewSize = ref<number>(0)
const showControls = ref<boolean>(false)
const isDragging = ref<boolean>(false)

function showError(msg: string): void {
  errorMsg.value = msg
}
function clearError(): void {
  errorMsg.value = ''
}

function base64ToUint8Array(b64: string): Uint8Array | null {
  try {
    const binary = atob(b64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return bytes
  } catch {
    return null
  }
}

function detectMime(u8arr: Uint8Array): string | null {
  if (!u8arr || u8arr.length < 12) return null
  if (u8arr[0] === 0x89 && u8arr[1] === 0x50 && u8arr[2] === 0x4e && u8arr[3] === 0x47)
    return 'image/png'
  if (u8arr[0] === 0xff && u8arr[1] === 0xd8 && u8arr[2] === 0xff) return 'image/jpeg'
  if (u8arr[0] === 0x47 && u8arr[1] === 0x49 && u8arr[2] === 0x46) return 'image/gif'
  if (
    u8arr[0] === 0x52 &&
    u8arr[1] === 0x49 &&
    u8arr[2] === 0x46 &&
    u8arr[3] === 0x46 &&
    u8arr[8] === 0x57 &&
    u8arr[9] === 0x45 &&
    u8arr[10] === 0x42 &&
    u8arr[11] === 0x50
  )
    return 'image/webp'
  return null
}

function normalizeInput(text: string): NormalizedInput | null {
  if (!text) return null
  text = text.trim()
  const match = text.match(/^data:([\w\\/\-+.]+);base64,(.+)$/i)
  if (match) return { mime: match[1] ?? null, b64: match[2] ?? '' }
  return { mime: null, b64: text.replace(/\s+/g, '') }
}

function buildImageFromBase64(text: string): BuildResult | null {
  clearError()
  const norm = normalizeInput(text)
  if (!norm?.b64) {
    showError('Base64 data not found')
    return null
  }
  const u8 = base64ToUint8Array(norm.b64)
  if (!u8) {
    showError('Base64 data is invalid or too large to process')
    return null
  }
  const mime = forceMime.value || norm.mime || detectMime(u8) || 'image/png'
  const blob = new Blob([u8.buffer as ArrayBuffer], { type: mime })
  const url = URL.createObjectURL(blob)
  return { blob, url, mime }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

function sanitizeFilename(name: string): string {
  if (!name) return ''
  return name.replace(/[^a-z0-9_\-.]/gi, '_')
}

const mimeExtMap: Record<string, string> = {
  'image/png': 'image.png',
  'image/jpeg': 'image.jpg',
  'image/gif': 'image.gif',
  'image/webp': 'image.webp',
}

function defaultFilenameForMime(mime: string): string {
  return mimeExtMap[mime] ?? 'image.bin'
}

function setPreview(result: BuildResult): void {
  previewUrl.value = result.url
  previewMime.value = result.mime
  previewSize.value = result.blob.size
  showControls.value = true
}

function doConvert(): void {
  const text = base64input.value.trim()
  if (!text) {
    showError('Please paste base64 or select a .txt file containing base64')
    return
  }
  const result = buildImageFromBase64(text)
  if (result) setPreview(result)
}

function onPaste(): void {
  setTimeout(() => {
    const text = base64input.value.trim()
    if (!text) return
    const result = buildImageFromBase64(text)
    if (result) setPreview(result)
  }, 50)
}

function processFile(f: File): void {
  clearError()
  if (f.type?.startsWith('image/')) {
    previewUrl.value = URL.createObjectURL(f)
    previewMime.value = f.type
    previewSize.value = f.size
    showControls.value = true
    return
  }
  const reader = new FileReader()
  reader.onload = (ev: ProgressEvent<FileReader>) => {
    const text = ((ev.target?.result as string) || '').trim()
    if (!text) {
      showError('File is empty or does not contain base64')
      return
    }
    base64input.value = text
    const result = buildImageFromBase64(text)
    if (result) setPreview(result)
  }
  reader.onerror = () => showError('Cannot read file')
  reader.readAsText(f)
}

function onFileInput(e: Event): void {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) processFile(file)
}

function onDrop(e: DragEvent): void {
  e.preventDefault()
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) processFile(file)
}

function doDownload(): void {
  const a = document.createElement('a')
  a.href = previewUrl.value
  a.download = sanitizeFilename(filename.value) || defaultFilenameForMime(previewMime.value)
  a.click()
}

function doOpenTab(): void {
  window.open(previewUrl.value, '_blank', 'noopener')
}

function doClear(): void {
  base64input.value = ''
  previewUrl.value = ''
  previewMime.value = ''
  previewSize.value = 0
  showControls.value = false
  clearError()
}

// ===== Image → Base64 =====
const previewImage2 = ref<string>('')
const base64output = ref<string>('')
const isDragging2 = ref<boolean>(false)

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e: ProgressEvent<FileReader>) => resolve(e.target?.result as string)
    reader.readAsDataURL(file)
  })
}

async function handleImage(file: File): Promise<void> {
  if (!file || !file.type.startsWith('image/')) return
  const base64 = await fileToBase64(file)
  previewImage2.value = base64
  base64output.value = base64
}

function onImgInput(e: Event): void {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) handleImage(file)
}

function onDrop2(e: DragEvent): void {
  e.preventDefault()
  isDragging2.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) handleImage(file)
}

function copyBase64(): void {
  if (!base64output.value.trim()) {
    alert('No Base64 to copy!')
    return
  }
  navigator.clipboard.writeText(base64output.value)
  alert('Copied ✅')
}

function downloadTxt(): void {
  const base64 = base64output.value.trim()
  if (!base64) {
    alert('No data to download!')
    return
  }
  const blob = new Blob([base64], { type: 'text/plain' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'image_base64.txt'
  a.click()
}

function clearImg(): void {
  previewImage2.value = ''
  base64output.value = ''
}

// ===== Theme =====
const darkMode = ref<boolean>(false)
function toggleTheme(): void {
  darkMode.value = !darkMode.value
  document.body.classList.toggle('dark-theme', darkMode.value)
}

// ===== Global paste for image→base64 =====
function onGlobalPaste(e: ClipboardEvent): void {
  const item = [...(e.clipboardData?.items ?? [])].find((i) => i.type.includes('image'))
  if (item) handleImage(item.getAsFile() as File)
}

onMounted(() => {
  document.addEventListener('paste', onGlobalPaste)
})

onUnmounted(() => {
  document.removeEventListener('paste', onGlobalPaste)
})
</script>

<template>
  <!-- Theme toggle -->
  <button class="btn fixed top-4 right-4 z-50" @click="toggleTheme">
    {{ darkMode ? '☀️ Light Mode' : '🌙 Dark Mode' }}
  </button>

  <!-- Row 1: Base64 → Image -->
  <div class="wrap max-w-5xl mx-auto flex flex-wrap gap-5 p-6">
    <!-- Left panel -->
    <div class="panel flex-1 min-w-[340px]">
      <h1>Base64 to Image</h1>
      <p class="text-sm text-gray-400 mb-3">Paste Base64 or upload .txt</p>

      <label class="text-sm mb-1 block">Base64 input (data URL or raw base64)</label>
      <textarea
        v-model="base64input"
        class="field h-44 resize-y"
        placeholder="Paste base64 string here (can include data:image/png;base64,...)"
        @paste="onPaste"
      ></textarea>

      <div class="flex flex-wrap gap-3 items-end mt-3">
        <label class="upload-btn">
          📁 Choose file .txt
          <input type="file" accept=".txt" hidden @change="onFileInput" />
        </label>
        <button class="btn" @click="doConvert">Convert</button>
      </div>

      <div class="flex flex-wrap gap-3 mt-3">
        <div class="flex-1 min-w-[180px]">
          <label class="text-sm mb-1 block">If auto-detect fails, choose MIME type</label>
          <select v-model="forceMime" class="field">
            <option value="">Auto detect</option>
            <option value="image/png">image/png</option>
            <option value="image/jpeg">image/jpeg</option>
            <option value="image/gif">image/gif</option>
            <option value="image/webp">image/webp</option>
          </select>
        </div>
        <div class="flex-1 min-w-[140px]">
          <label class="text-sm mb-1 block">Filename for download</label>
          <input v-model="filename" type="text" class="field" placeholder="image.png" />
        </div>
      </div>

      <!-- Dropzone -->
      <div
        class="dropzone mt-3"
        :class="{ 'border-blue-500': isDragging }"
        @dragover.prevent="isDragging = true"
        @dragleave="isDragging = false"
        @drop="onDrop"
      >
        Drag & drop a .txt file here (or paste into textarea)
      </div>

      <div v-if="errorMsg" class="error mt-2">{{ errorMsg }}</div>
      <footer class="text-xs text-gray-400 mt-3">
        Supports data URLs (<code>data:image/...;base64,...</code>) or raw base64. Small images
        recommended.
      </footer>
    </div>

    <!-- Right panel: Preview -->
    <div class="panel flex-1 min-w-[340px]">
      <h1>Preview</h1>
      <div class="preview-area">
        <img v-if="previewUrl" :src="previewUrl" class="preview-img" />
        <div v-else class="text-gray-400 text-sm">No image yet</div>
      </div>

      <div v-if="showControls" class="flex flex-wrap gap-2 justify-center mt-4">
        <a class="btn secondary cursor-pointer" @click="doDownload">Download</a>
        <button class="btn" @click="doOpenTab">Open in new tab</button>
        <button class="btn secondary" @click="doClear">Clear</button>
        <div class="w-full text-center text-xs text-gray-500 mt-1">
          MIME: {{ previewMime }} · Size: {{ formatBytes(previewSize) }}
        </div>
      </div>
    </div>
  </div>

  <!-- Row 2: Image → Base64 -->
  <div class="wrap max-w-5xl mx-auto flex flex-wrap gap-5 px-6 mt-12 pb-16">
    <!-- Left: upload image -->
    <div class="panel flex-1 min-w-[340px]">
      <h1>Image → Base64</h1>
      <div class="mb-4">
        <label class="upload-btn">
          🖼️ Choose image
          <input type="file" accept="image/*" hidden @change="onImgInput" />
        </label>
      </div>

      <div
        class="dropzone min-h-[200px] flex items-center justify-center"
        :class="{ 'border-cyan-400': isDragging2 }"
        @dragenter.prevent="isDragging2 = true"
        @dragover.prevent="isDragging2 = true"
        @dragleave="isDragging2 = false"
        @drop="onDrop2"
      >
        <img v-if="previewImage2" :src="previewImage2" class="preview-img max-h-48" alt="preview" />
        <span v-else class="text-sm text-gray-400">Drop image here or paste from clipboard</span>
      </div>

      <button class="btn secondary mt-3" @click="clearImg">Delete image</button>
    </div>

    <!-- Right: base64 output -->
    <div class="panel flex-1 min-w-[340px]">
      <h1>Result</h1>
      <textarea
        v-model="base64output"
        class="field h-64 resize-y"
        placeholder="Base64 will appear here..."
        readonly
      ></textarea>
      <div class="flex flex-wrap gap-2 mt-3">
        <button class="btn" @click="copyBase64">Copy Base64</button>
        <button class="btn secondary" @click="downloadTxt">Download .txt</button>
      </div>
    </div>
  </div>

  <RouterLink to="/" class="btn secondary fixed bottom-4 left-4 z-50 blink">
    🏠 Trang chủ
  </RouterLink>

  <a
    href="https://guns.lol/vubinh127"
    target="_blank"
    rel="noopener noreferrer"
    class="btn secondary fixed bottom-16 right-4 z-50 blink"
  >
    🔗 Profile
  </a>

  <a
    href="https://linktr.ee/bowtuckle"
    target="_blank"
    rel="noopener noreferrer"
    class="btn secondary fixed bottom-4 right-4 z-50 blink"
  >
    Our System
  </a>
</template>

<style scoped>
/* ── Custom properties ── */
:root {
  --pink: #ff9ecb;
  --pink-dark: #ff6cab;
}

/* ── Reusable components not expressible purely in Tailwind ── */

h1 {
  font-size: 18px;
  font-weight: 700;
  color: #ff6cab;
  margin-bottom: 12px;
}

.blink {
  animation: pulse-border 2s ease-in-out infinite;
}

@keyframes pulse-border {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(255, 158, 203, 0.7);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(255, 158, 203, 0);
  }
}

.panel {
  background: white;
  border-radius: 16px;
  padding: 20px;
  border: 2px solid #ffe2f3;
  box-shadow: 0 3px 15px rgba(255, 167, 231, 0.25);
}

/* Shared input / select / textarea style */
.field {
  width: 100%;
  padding: 12px;
  border-radius: 12px;
  border: 2px solid #ffd6ec;
  background: #fff;
  font-family: monospace;
  font-size: 14px;
  box-sizing: border-box;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}
.field:focus {
  outline: none;
  border-color: #ff9ecb;
  box-shadow: 0 0 0 4px #ffd6ec6a;
}

/* Buttons */
.btn {
  background: #ff9ecb;
  border: none;
  padding: 10px 16px;
  border-radius: 12px;
  color: white;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition:
    background 0.25s,
    transform 0.25s;
  text-decoration: none;
  display: inline-block;
}
.btn:hover {
  background: #ff6cab;
  transform: translateY(-1px);
}

.btn.secondary {
  background: #fff;
  color: #ff6cab;
  border: 2px solid #ff9ecb;
}
.btn.secondary:hover {
  background: #ff9ecb;
  color: white;
}

/* Upload label button */
.upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #ffb7e1, #ff7fcf);
  padding: 12px 20px;
  border-radius: 12px;
  cursor: pointer;
  color: #fff;
  font-weight: 600;
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(255, 140, 193, 0.4);
  transition:
    transform 0.2s,
    box-shadow 0.2s;
  user-select: none;
}
.upload-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 14px rgba(255, 140, 193, 0.55);
}
.upload-btn:active {
  transform: translateY(0);
}

/* Dropzone */
.dropzone {
  border-radius: 12px;
  border: 2px dashed #ffaad6;
  background: #fff3fa;
  padding: 18px;
  text-align: center;
  color: #d45fa5;
  font-size: 14px;
  transition: border-color 0.2s;
}

/* Preview area */
.preview-area {
  border: 2px dashed #666;
  border-radius: 12px;
  padding: 12px;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.preview-img {
  max-width: 100%;
  border-radius: 16px;
  border: 2px solid #ffd6ec;
  margin-top: 10px;
}

/* Error blink */
.error {
  color: red;
  font-weight: bold;
  font-size: 14px;
  animation: blink 5s infinite;
}
@keyframes blink {
  0%,
  50%,
  100% {
    opacity: 1;
  }
  25%,
  75% {
    opacity: 0;
  }
}

/* ── Dark theme (toggled on <body>) ── */
body.dark-theme {
  background: #2b1f3b;
  color: #eee;
}

body.dark-theme .panel {
  background: #3a2a4d;
  border-color: #5b3a7a;
  box-shadow: 0 3px 15px rgba(200, 150, 255, 0.25);
}
body.dark-theme h1 {
  color: #a463d9;
}

body.dark-theme .field {
  background: #4b365e;
  color: #eee;
  border-color: #6a4b85;
}

body.dark-theme .dropzone,
body.dark-theme .preview-area {
  background: #452f5b;
  border-color: #5e3f84;
  color: #d0baff;
}

body.dark-theme .btn {
  background: #d29bff;
}
body.dark-theme .btn:hover {
  background: #a463d9;
}
body.dark-theme .btn.secondary {
  background: #3a2a4d;
  color: #d29bff;
  border-color: #d29bff;
}
body.dark-theme .btn.secondary:hover {
  background: #d29bff;
  color: white;
}
</style>
