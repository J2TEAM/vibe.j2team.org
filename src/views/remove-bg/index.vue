<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'

// ===== TYPES =====
export type BgEngineType = 'cloud' | 'local'

export type BackgroundPreset = 'transparent' | 'white' | 'id_red' | 'id_blue' | 'custom'

export type BrushMode = 'none' | 'erase' | 'restore'

export interface BgRemovalProgress {
  percentage: number
  message: string
}

// ===== CONSTANTS =====
const LOCAL_MODEL_ID = 'briaai/RMBG-1.4'
const PRIMARY_BIREFNET_SPACE = 'ZhengPeng7/BiRefNet_demo'
const FALLBACK_CLOUD_SPACE = 'not-lain/background-removal'

// Module-level caches for singletons
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedModel: any = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedProcessor: any = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedBiRefNetClient: any = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedFallbackClient: any = null

// ===== COMPONENT STATE =====
const selectedEngine = ref<BgEngineType>('cloud')
const activeTab = ref<'slider' | 'canvas'>('slider')
const selectedPreset = ref<BackgroundPreset>('transparent')
const customColor = ref<string>('#0066cc')

// Image Files & URLs
const currentFile = ref<File | null>(null)
const originalUrl = ref<string | null>(null)
const processedBlob = ref<Blob | null>(null)
const processedUrl = ref<string | null>(null)

// Processing & Progress
const isProcessing = ref<boolean>(false)
const progress = ref<BgRemovalProgress>({
  percentage: 0,
  message: 'Sẵn sàng xử lý',
})
const error = ref<string | null>(null)
const isDraggingOver = ref<boolean>(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

// Comparison Slider State
const sliderPosition = ref<number>(50)
const isSliderDragging = ref<boolean>(false)
const sliderContainerRef = ref<HTMLDivElement | null>(null)

// Canvas Preview & Brush State
const canvasRef = ref<HTMLCanvasElement | null>(null)
const subjectCanvasRef = ref<HTMLCanvasElement | null>(null)
const originalImageRef = ref<HTMLImageElement | null>(null)
const dimensions = ref<{ width: number; height: number }>({ width: 0, height: 0 })
const brushMode = ref<BrushMode>('none')
const brushSize = ref<number>(24)
const isDrawing = ref<boolean>(false)
const hasEdits = ref<boolean>(false)
const isExporting = ref<boolean>(false)
const downloadSuccess = ref<boolean>(false)

// Helper to import dynamic ESM packages from CDN without compile-time module resolution errors
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const importRemote = (url: string): Promise<any> => {
  return new Function('u', 'return import(u)')(url)
}

// ===== INFERENCE ENGINES (CYTOOLS 1-TO-1) =====

/**
 * Cloud Studio Inference via HuggingFace Space BiRefNet (@gradio/client)
 * Primary: ZhengPeng7/BiRefNet_demo (/image endpoint with resolution 1024x1024)
 * Fallback: not-lain/background-removal (/png endpoint)
 */
async function processViaCloudStudio(imageInput: File | Blob): Promise<Blob> {
  progress.value = {
    percentage: 15,
    message: 'Đang kết nối tới Studio BiRefNet AI trên HuggingFace Cloud...',
  }

  const { Client, handle_file } = await importRemote('https://esm.sh/@gradio/client@2.7.2')
  const filePayload = handle_file(imageInput)

  try {
    if (!cachedBiRefNetClient) {
      cachedBiRefNetClient = await Client.connect(PRIMARY_BIREFNET_SPACE)
    }

    progress.value = {
      percentage: 45,
      message: 'BiRefNet AI đang phân tích đa tầng & bóc tách từng sợi tóc...',
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = await cachedBiRefNetClient.predict('/image', {
      images: filePayload,
      resolution: '1024x1024',
      weights_file: 'General',
    })

    progress.value = {
      percentage: 85,
      message: 'Đang tải kết quả PNG trong suốt chuẩn Studio HD về trình duyệt...',
    }

    let fileUrl: string | null = null
    const rawData = result?.data
    if (Array.isArray(rawData) && rawData.length > 0) {
      const firstElem = rawData[0]
      if (Array.isArray(firstElem) && firstElem.length >= 2) {
        fileUrl = firstElem[1]?.url || (typeof firstElem[1] === 'string' ? firstElem[1] : null)
      } else if (firstElem && typeof firstElem === 'object' && 'url' in firstElem) {
        fileUrl = (firstElem as { url?: string }).url || null
      } else if (typeof firstElem === 'string') {
        fileUrl = firstElem
      }
    }

    if (!fileUrl) {
      throw new Error('BiRefNet Cloud không trả về URL hình ảnh hợp lệ.')
    }

    const response = await fetch(fileUrl)
    if (!response.ok) {
      throw new Error(`Không thể tải ảnh kết quả từ Cloud: HTTP ${response.status}`)
    }

    return await response.blob()
  } catch (primaryErr) {
    console.warn('BiRefNet primary space unavailable, trying fallback cloud space:', primaryErr)
    progress.value = {
      percentage: 35,
      message: 'Đang kết nối Cloud dự phòng (Background Removal AI)...',
    }

    if (!cachedFallbackClient) {
      cachedFallbackClient = await Client.connect(FALLBACK_CLOUD_SPACE)
    }

    progress.value = {
      percentage: 60,
      message: 'Đang bóc tách nền qua server dự phòng...',
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fallbackResult: any = await cachedFallbackClient.predict('/png', { f: filePayload })
    const outputInfo = fallbackResult?.data?.[0]
    const fallbackUrl = outputInfo?.url || (typeof outputInfo === 'string' ? outputInfo : null)

    if (!fallbackUrl) {
      throw new Error('Cloud dự phòng không trả về URL hình ảnh hợp lệ.')
    }

    const response = await fetch(fallbackUrl)
    if (!response.ok) {
      throw new Error(`Không thể tải ảnh từ Cloud dự phòng: HTTP ${response.status}`)
    }

    return await response.blob()
  }
}

/**
 * Local Fast Inference via In-Browser RMBG-1.4 (ONNX WebAssembly / WebGPU FP32)
 * Ported 1-to-1 from Cytools useBackgroundRemoval.ts
 */
async function processViaLocalRMBG(imageInput: File | Blob): Promise<Blob> {
  progress.value = {
    percentage: 10,
    message: 'Đang nạp mô hình RMBG-1.4 FP32 trên WebAssembly SIMD...',
  }

  const { AutoModel, AutoProcessor, RawImage, Tensor, env } = await importRemote(
    'https://esm.sh/@huggingface/transformers@3.8.1'
  )

  env.allowLocalModels = false
  env.allowRemoteModels = true

  const hasWebGPU = typeof navigator !== 'undefined' && 'gpu' in navigator

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleProgressCallback = (p: any) => {
    if (!p) return
    if (p.status === 'initiate') {
      progress.value = {
        percentage: 15,
        message: `Khởi tạo nạp mô hình RMBG-1.4: ${p.file || 'model files'}...`,
      }
    } else if (p.status === 'progress') {
      const pct = typeof p.progress === 'number' ? Math.round(p.progress) : 25
      const loadedMb = p.loaded ? (p.loaded / (1024 * 1024)).toFixed(1) : null
      const totalMb = p.total ? (p.total / (1024 * 1024)).toFixed(1) : null
      const sizeInfo = loadedMb && totalMb ? ` (${loadedMb}MB / ${totalMb}MB)` : ''
      progress.value = {
        percentage: Math.min(85, pct),
        message: `Đang tải mô hình RMBG-1.4: ${p.file || ''}${sizeInfo}`,
      }
    } else if (p.status === 'done') {
      progress.value = {
        percentage: 85,
        message: 'Đã nạp xong mô hình. Chuẩn bị suy luận mạng nơ-ron...',
      }
    }
  }

  // 1. Ensure Model is loaded (fp32 to prevent quantization degradation)
  if (!cachedModel) {
    try {
      cachedModel = await AutoModel.from_pretrained(LOCAL_MODEL_ID, {
        device: hasWebGPU ? 'webgpu' : 'wasm',
        dtype: 'fp32',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        config: { model_type: 'custom' } as any,
        progress_callback: handleProgressCallback,
      })
    } catch (err) {
      console.warn('WebGPU failed or unsupported. Falling back to WASM SIMD fp32:', err)
      cachedModel = await AutoModel.from_pretrained(LOCAL_MODEL_ID, {
        device: 'wasm',
        dtype: 'fp32',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        config: { model_type: 'custom' } as any,
        progress_callback: handleProgressCallback,
      })
    }
  }

  // 2. Ensure Processor is loaded with native Hub configuration
  if (!cachedProcessor) {
    cachedProcessor = await AutoProcessor.from_pretrained(LOCAL_MODEL_ID, {
      progress_callback: handleProgressCallback,
    })
  }

  // 3. Load image using Transformers.js native RawImage utility
  const image = await RawImage.read(imageInput)
  if (image.width === 0 || image.height === 0) {
    throw new Error('Kích thước hình ảnh không hợp lệ.')
  }

  progress.value = {
    percentage: 88,
    message: 'Đang chuẩn hóa ảnh & suy luận mạng nơ-ron RMBG-1.4...',
  }

  // 4. Preprocess via natural processor (mean [0.5, 0.5, 0.5], std [1, 1, 1], resize 1024x1024)
  const { pixel_values } = await cachedProcessor(image)

  // 5. Run ONNX Model Inference
  const { output } = await cachedModel({ input: pixel_values })

  progress.value = {
    percentage: 95,
    message: 'Đang áp dụng Contrast Clamping & khôi phục kích thước ảnh gốc...',
  }

  // 6. Direct Contrast Clamping without Double Sigmoid:
  // RMBG-1.4 ONNX output is ALREADY normalized to [0.0, 1.0].
  // Clamping values <= 0.03 to 0 and >= 0.97 to 255 eliminates background bleed and preserves fine fur edges.
  const rawData = output[0].data as Float32Array
  const uint8Data = new Uint8ClampedArray(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    const v = rawData[i] ?? 0
    if (v <= 0.03) {
      uint8Data[i] = 0
    } else if (v >= 0.97) {
      uint8Data[i] = 255
    } else {
      uint8Data[i] = Math.round(((v - 0.03) / 0.94) * 255)
    }
  }

  // 7. Convert to 1024x1024 RawImage Mask
  const uint8Tensor = new Tensor('uint8', uint8Data, output[0].dims)
  const mask1024 = RawImage.fromTensor(uint8Tensor)

  // 8. Native Mask Rescaling back to Original Image Dimensions (bilinear interpolation)
  const resizedMask = await mask1024.resize(image.width, image.height)

  // 9. Soft Alpha Mapping: Apply resized mask to the alpha channel of the original image
  const composite = image.clone().putAlpha(resizedMask)

  // 10. Composite to HTML5 Canvas and export transparent PNG Blob
  const finalCanvas = document.createElement('canvas')
  finalCanvas.width = composite.width
  finalCanvas.height = composite.height
  const finalCtx = finalCanvas.getContext('2d')
  if (!finalCtx) {
    throw new Error('Không thể khởi tạo Canvas 2D context.')
  }

  const imgData = new ImageData(new Uint8ClampedArray(composite.data), composite.width, composite.height)
  finalCtx.putImageData(imgData, 0, 0)

  return await new Promise<Blob>((resolve, reject) => {
    finalCanvas.toBlob((b) => {
      if (b) {
        resolve(b)
      } else {
        reject(new Error('Xuất Blob ảnh trong suốt từ Canvas thất bại.'))
      }
    }, 'image/png')
  })
}

/**
 * Coordinates AI background removal with automatic fallback.
 */
async function removeBg(imageInput: File | Blob, engine: BgEngineType = 'cloud'): Promise<Blob> {
  if (engine === 'cloud') {
    try {
      return await processViaCloudStudio(imageInput)
    } catch (cloudErr) {
      console.warn(
        'BiRefNet Cloud Studio bận hoặc không thể kết nối. Đang tự động chuyển về Engine RMBG-1.4 cục bộ:',
        cloudErr
      )
      progress.value = {
        percentage: 30,
        message: 'Hàng đợi Cloud bận, đang tự động chuyển sang Engine RMBG-1.4 cục bộ...',
      }
      return await processViaLocalRMBG(imageInput)
    }
  } else {
    return await processViaLocalRMBG(imageInput)
  }
}

// ===== CANVAS PREVIEW & REFINE BRUSH LOGIC (1-TO-1 PORT) =====

function renderComposite(): void {
  const canvas = canvasRef.value
  const subjectCanvas = subjectCanvasRef.value
  if (!canvas || !subjectCanvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // 1. Render Background Preset
  if (selectedPreset.value === 'white') {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  } else if (selectedPreset.value === 'id_red') {
    ctx.fillStyle = '#cc0000'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  } else if (selectedPreset.value === 'id_blue') {
    ctx.fillStyle = '#0066cc'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  } else if (selectedPreset.value === 'custom') {
    ctx.fillStyle = customColor.value
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }
  // If 'transparent', background remains cleared!

  // 2. Draw Subject on top
  ctx.drawImage(subjectCanvas, 0, 0)
}

function initCanvases(): void {
  if (!processedBlob.value) return

  const procUrl = URL.createObjectURL(processedBlob.value)
  const procImg = new Image()

  procImg.onload = () => {
    const width = procImg.naturalWidth
    const height = procImg.naturalHeight
    dimensions.value = { width, height }

    // Create or resize offscreen subject canvas
    const subCanvas = document.createElement('canvas')
    subCanvas.width = width
    subCanvas.height = height
    const subCtx = subCanvas.getContext('2d')
    if (subCtx) {
      subCtx.clearRect(0, 0, width, height)
      subCtx.drawImage(procImg, 0, 0)
    }
    subjectCanvasRef.value = subCanvas

    // Set display canvas dimensions
    if (canvasRef.value) {
      canvasRef.value.width = width
      canvasRef.value.height = height
    }

    renderComposite()
    URL.revokeObjectURL(procUrl)
    hasEdits.value = false
  }

  procImg.src = procUrl

  // Load original image for restoration brush
  if (currentFile.value) {
    const origUrl = URL.createObjectURL(currentFile.value)
    const origImg = new Image()
    origImg.onload = () => {
      originalImageRef.value = origImg
    }
    origImg.src = origUrl
  }
}

function applyBrush(clientX: number, clientY: number): void {
  const canvas = canvasRef.value
  const subjectCanvas = subjectCanvasRef.value
  if (!canvas || !subjectCanvas || brushMode.value === 'none') return

  const subCtx = subjectCanvas.getContext('2d')
  if (!subCtx) return

  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  const x = (clientX - rect.left) * scaleX
  const y = (clientY - rect.top) * scaleY
  const radius = (brushSize.value * scaleX) / 2

  if (brushMode.value === 'erase') {
    // Erase unwanted background leftovers
    subCtx.save()
    subCtx.globalCompositeOperation = 'destination-out'
    subCtx.beginPath()
    subCtx.arc(x, y, radius, 0, Math.PI * 2)
    subCtx.fill()
    subCtx.restore()
  } else if (brushMode.value === 'restore' && originalImageRef.value) {
    // Restore pixels from the original image
    subCtx.save()
    subCtx.beginPath()
    subCtx.arc(x, y, radius, 0, Math.PI * 2)
    subCtx.clip()
    subCtx.globalCompositeOperation = 'source-over'
    subCtx.drawImage(originalImageRef.value, 0, 0, subjectCanvas.width, subjectCanvas.height)
    subCtx.restore()
  }

  hasEdits.value = true
  renderComposite()
}

function handleCanvasMouseDown(e: MouseEvent): void {
  if (brushMode.value === 'none') return
  isDrawing.value = true
  applyBrush(e.clientX, e.clientY)
}

function handleCanvasMouseMove(e: MouseEvent): void {
  if (!isDrawing.value || brushMode.value === 'none') return
  applyBrush(e.clientX, e.clientY)
}

function handleCanvasMouseUp(): void {
  isDrawing.value = false
}

function handleCanvasMouseLeave(): void {
  isDrawing.value = false
}

watch([selectedPreset, customColor], () => {
  renderComposite()
})

watch(activeTab, (tab) => {
  if (tab === 'canvas') {
    setTimeout(() => {
      initCanvases()
    }, 50)
  }
})

// ===== DOWNLOAD EXPORT LOGIC (1-TO-1 WITH CYTOOLS PREFIX) =====

function handleDownload(): void {
  const canvas = canvasRef.value
  if (!canvas || !currentFile.value) return

  isExporting.value = true

  const isTransparent = selectedPreset.value === 'transparent'
  const mimeType = isTransparent ? 'image/png' : 'image/jpeg'
  const extension = isTransparent ? 'png' : 'jpg'

  canvas.toBlob(
    (blob) => {
      if (!blob) {
        isExporting.value = false
        return
      }

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const originalFileName = currentFile.value?.name || 'image.png'
      const cleanName = originalFileName.substring(0, originalFileName.lastIndexOf('.')) || 'image'

      // Prepend Cytools branded domain prefix
      link.download = `[cytools.io.vn]_${cleanName}_nobg_${selectedPreset.value}.${extension}`
      link.href = url
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      isExporting.value = false
      downloadSuccess.value = true
      setTimeout(() => {
        downloadSuccess.value = false
      }, 2500)
    },
    mimeType,
    0.95
  )
}

// ===== FILE & FLOW HANDLERS =====

function cleanupUrls(): void {
  if (originalUrl.value) {
    URL.revokeObjectURL(originalUrl.value)
    originalUrl.value = null
  }
  if (processedUrl.value) {
    URL.revokeObjectURL(processedUrl.value)
    processedUrl.value = null
  }
}

async function handleFiles(files: FileList | File[]): Promise<void> {
  const imageFiles = Array.from(files).filter((f) =>
    ['image/jpeg', 'image/png', 'image/webp'].includes(f.type)
  )

  if (imageFiles.length === 0) return

  const file = imageFiles[0]
  if (!file) return

  cleanupUrls()
  error.value = null
  currentFile.value = file
  originalUrl.value = URL.createObjectURL(file)
  processedBlob.value = null
  processedUrl.value = null

  isProcessing.value = true
  progress.value = {
    percentage: 5,
    message: 'Khởi tạo bóc tách nền hình ảnh...',
  }

  try {
    const result = await removeBg(file, selectedEngine.value)
    processedBlob.value = result
    processedUrl.value = URL.createObjectURL(result)
    progress.value = {
      percentage: 100,
      message: 'Tách nền AI hoàn tất với độ nét chuẩn xác & viền mềm mại!',
    }
    // Initialize canvas if user is already on canvas tab
    if (activeTab.value === 'canvas') {
      setTimeout(() => initCanvases(), 50)
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Đã có lỗi xảy ra khi xử lý tách nền.'
    console.error('Lỗi tách nền:', err)
    error.value = errMsg
  } finally {
    isProcessing.value = false
  }
}

function handleReset(): void {
  cleanupUrls()
  currentFile.value = null
  processedBlob.value = null
  error.value = null
  progress.value = { percentage: 0, message: 'Sẵn sàng xử lý' }
  brushMode.value = 'none'
  hasEdits.value = false
  selectedPreset.value = 'transparent'
}

function handleDragOver(e: DragEvent): void {
  e.preventDefault()
  isDraggingOver.value = true
}

function handleDragLeave(e: DragEvent): void {
  e.preventDefault()
  isDraggingOver.value = false
}

function handleDrop(e: DragEvent): void {
  e.preventDefault()
  isDraggingOver.value = false
  if (e.dataTransfer?.files) {
    handleFiles(e.dataTransfer.files)
  }
}

function handlePaste(e: ClipboardEvent): void {
  const items = e.clipboardData?.items
  if (!items) return

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (item && item.type.startsWith('image/')) {
      const file = item.getAsFile()
      if (file) {
        handleFiles([file])
        break
      }
    }
  }
}

// Comparison Slider Pointer Events
function handlePointerDown(e: PointerEvent): void {
  isSliderDragging.value = true
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  if (sliderContainerRef.value) {
    const rect = sliderContainerRef.value.getBoundingClientRect()
    const x = e.clientX - rect.left
    sliderPosition.value = Math.max(0, Math.min(100, (x / rect.width) * 100))
  }
}

function handlePointerMove(e: PointerEvent): void {
  if (!isSliderDragging.value || !sliderContainerRef.value) return
  const rect = sliderContainerRef.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  sliderPosition.value = Math.max(0, Math.min(100, (x / rect.width) * 100))
}

function handlePointerUp(e: PointerEvent): void {
  isSliderDragging.value = false
  try {
    ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
  } catch {
    // ignore
  }
}

onMounted(() => {
  window.addEventListener('paste', handlePaste)
})

onUnmounted(() => {
  window.removeEventListener('paste', handlePaste)
  cleanupUrls()
})
</script>

<template>
  <div class="min-h-screen bg-neutral-950 text-neutral-100 selection:bg-rose-500 selection:text-white px-4 py-6 sm:px-6 lg:px-8">
    <div class="max-w-6xl mx-auto space-y-6">
      <!-- Top Navigation & Header -->
      <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800/80">
        <div class="flex items-center gap-3">
          <RouterLink
            to="/"
            class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 text-xs font-medium transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Quay lại trang chủ</span>
          </RouterLink>
          <div class="h-4 w-px bg-neutral-800 hidden sm:block"></div>
          <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/20 text-xs font-semibold">
            <span class="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse"></span>
            Cytools AI Studio Engine
          </span>
        </div>

        <div class="flex items-center gap-2 text-xs text-neutral-400">
          <span class="inline-flex items-center gap-1">
            <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Bảo mật tuyệt đối • Xử lý trực tiếp hoặc qua Studio AI
          </span>
        </div>
      </header>

      <!-- Page Title -->
      <div class="space-y-2">
        <h1 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Xóa Phông Ảnh Bằng AI (Chuẩn Cytools)
        </h1>
        <p class="text-sm text-neutral-400 max-w-2xl leading-relaxed">
          Tách nền hình ảnh chuẩn từng sợi tóc với công nghệ AI BiRefNet hoặc xử lý nhanh 100% trên trình duyệt qua RMBG-1.4.
        </p>
      </div>

      <!-- Compact Modern AI Engine Segmented Control -->
      <div class="flex items-center justify-between gap-4 py-1">
        <span class="text-xs font-semibold text-neutral-300">
          Engine xử lý:
        </span>

        <div class="inline-flex p-1 rounded-xl bg-neutral-900 border border-neutral-800">
          <button
            type="button"
            @click="selectedEngine = 'cloud'"
            class="px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer"
            :class="selectedEngine === 'cloud' ? 'bg-neutral-800 text-pink-400 font-semibold border border-neutral-700/60 shadow-sm' : 'text-neutral-400 hover:text-white'"
          >
            Studio (Cloud BiRefNet)
          </button>
          <button
            type="button"
            @click="selectedEngine = 'local'"
            class="px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer"
            :class="selectedEngine === 'local' ? 'bg-neutral-800 text-pink-400 font-semibold border border-neutral-700/60 shadow-sm' : 'text-neutral-400 hover:text-white'"
          >
            Nhanh (Local RMBG-1.4)
          </button>
        </div>
      </div>

      <!-- Main Upload Dropzone (When no file selected) -->
      <div
        v-if="!currentFile"
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
        @drop="handleDrop"
        @click="fileInputRef?.click()"
        class="relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-4"
        :class="isDraggingOver ? 'border-pink-500 bg-pink-500/5' : 'border-neutral-800 hover:border-pink-500/40 bg-neutral-900/40 hover:bg-neutral-900/70'"
      >
        <input
          ref="fileInputRef"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          class="hidden"
          @change="(e) => (e.target as HTMLInputElement).files && handleFiles((e.target as HTMLInputElement).files!)"
        />

        <div class="w-16 h-16 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-500">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>

        <div class="space-y-1">
          <p class="text-base font-bold text-neutral-100">
            Kéo thả hình ảnh vào đây hoặc click để chọn file
          </p>
          <p class="text-sm text-neutral-400 max-w-xl mx-auto leading-relaxed">
            Hỗ trợ định dạng JPG, PNG, WebP • Đang kích hoạt: {{ selectedEngine === 'cloud' ? 'Studio (Cloud BiRefNet)' : 'Nhanh (Local RMBG-1.4)' }}
          </p>
        </div>

        <div class="flex flex-wrap items-center justify-center gap-2 pt-2">
          <span class="text-xs font-semibold px-2.5 py-1 rounded-md bg-neutral-800 text-neutral-300 border border-neutral-700">
            {{ selectedEngine === 'cloud' ? 'BiRefNet Deep Learning' : '100% Client-Side WASM' }}
          </span>
          <span class="text-xs font-semibold px-2.5 py-1 rounded-md bg-neutral-800 text-neutral-300 border border-neutral-700">
            Cọ Khôi Phục & Xóa Tức Thì
          </span>
          <span class="text-xs font-semibold px-2.5 py-1 rounded-md bg-neutral-800 text-neutral-300 border border-neutral-700">
            Độ nét HD gốc
          </span>
        </div>
      </div>

      <!-- Progress Bar Display -->
      <div v-if="isProcessing" class="p-6 rounded-xl bg-neutral-900 border border-neutral-800 space-y-4">
        <div class="flex items-center justify-between text-xs">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-pink-500 animate-spin shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span class="font-semibold text-neutral-200">
              {{ selectedEngine === 'cloud' ? 'Đang xử lý qua Cloud AI (BiRefNet)... Vui lòng đợi vài giây' : progress.message }}
            </span>
          </div>
          <span class="font-mono font-bold text-pink-500">{{ progress.percentage }}%</span>
        </div>

        <!-- Animated Progress Bar -->
        <div class="w-full h-2 rounded-full bg-neutral-800 overflow-hidden">
          <div
            class="h-full bg-pink-500 transition-all duration-300 ease-out"
            :style="{ width: `${progress.percentage}%` }"
          />
        </div>

        <div class="flex items-center justify-between text-xs text-neutral-400">
          <span>{{ progress.message }}</span>
          <span class="hidden sm:inline">
            {{ selectedEngine === 'cloud' ? 'BiRefNet Studio • Tự động fallback RMBG-1.4 nếu cần' : 'Mô hình RMBG-1.4 FP32 WASM/WebGPU' }}
          </span>
        </div>
      </div>

      <!-- Error Banner -->
      <div
        v-if="error"
        class="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-red-300 text-xs"
      >
        <svg class="w-4 h-4 shrink-0 mt-0.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div class="space-y-1">
          <p class="font-semibold">Đã xảy ra lỗi khi tách nền:</p>
          <p class="text-red-400/90">{{ error }}</p>
          <button
            @click="handleReset"
            class="mt-2 px-3 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/40 text-xs transition-colors cursor-pointer"
          >
            Thử lại với ảnh khác
          </button>
        </div>
      </div>

      <!-- Single Image Result Workspace -->
      <div v-if="currentFile && originalUrl && processedBlob && processedUrl" class="space-y-6">
        <!-- Workspace Navigation Bar -->
        <div class="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-neutral-900 border border-neutral-800">
          <div class="flex items-center gap-2">
            <button
              @click="activeTab = 'slider'"
              class="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer"
              :class="activeTab === 'slider' ? 'bg-pink-500/10 text-pink-400 border border-pink-500/30' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <span>So sánh Trước / Sau</span>
            </button>

            <button
              @click="activeTab = 'canvas'"
              class="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer"
              :class="activeTab === 'canvas' ? 'bg-pink-500/10 text-pink-400 border border-pink-500/30' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4 5 5 0 015-5 4 4 0 014 4v1a2 2 0 002 2h2a2 2 0 002-2 7 7 0 00-7-7 9 9 0 00-9 9c0 1.5.5 3 2 4" />
              </svg>
              <span>Thay Phông Nền & Cọ Tinh Chỉnh HD</span>
            </button>
          </div>

          <button
            @click="handleReset"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Xóa ảnh & thử ảnh khác</span>
          </button>
        </div>

        <!-- Tab 1: ComparisonSlider View -->
        <div v-if="activeTab === 'slider'" class="space-y-4">
          <div
            ref="sliderContainerRef"
            @pointerdown="handlePointerDown"
            @pointermove="handlePointerMove"
            @pointerup="handlePointerUp"
            @pointercancel="handlePointerUp"
            class="relative w-full overflow-hidden rounded-xl border border-neutral-800 select-none cursor-ew-resize aspect-video md:aspect-[16/10] bg-neutral-950 flex items-center justify-center touch-none"
          >
            <!-- Background Layer: Processed Image (Transparent Checkerboard) -->
            <div class="absolute inset-0 w-full h-full bg-[conic-gradient(#1e293b_25%,#0f172a_0_50%,#1e293b_0_75%,#0f172a_0)] bg-[size:16px_16px] flex items-center justify-center">
              <img
                :src="processedUrl"
                alt="Đã xóa nền"
                class="w-full h-full object-contain pointer-events-none"
              />
              <div class="absolute top-3 right-3 px-2 py-1 rounded bg-black/60 backdrop-blur-md text-[11px] font-semibold text-emerald-400 border border-emerald-500/30">
                Đã Tách Nền AI
              </div>
            </div>

            <!-- Foreground Layer: Original Image (Clipped by slider position) -->
            <div
              class="absolute inset-0 w-full h-full overflow-hidden flex items-center justify-center pointer-events-none"
              :style="{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }"
            >
              <img
                :src="originalUrl"
                alt="Ảnh gốc"
                class="w-full h-full object-contain pointer-events-none"
              />
              <div class="absolute top-3 left-3 px-2 py-1 rounded bg-black/60 backdrop-blur-md text-[11px] font-semibold text-neutral-300 border border-neutral-700/60">
                Ảnh Gốc
              </div>
            </div>

            <!-- Draggable Divider Line -->
            <div
              class="absolute top-0 bottom-0 w-0.5 bg-white shadow-2xl pointer-events-none z-10 flex items-center justify-center"
              :style="{ left: `${sliderPosition}%` }"
            >
              <div class="w-8 h-8 -ml-4 rounded-full bg-white text-neutral-900 shadow-xl flex items-center justify-center border border-neutral-300 pointer-events-auto cursor-ew-resize">
                <svg class="w-4 h-4 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l-3 3 3 3m8-6l3 3-3 3" />
                </svg>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-between text-xs text-neutral-400 px-2">
            <span>Kéo thả thanh trượt ở giữa để kiểm tra độ chính xác của viền tách.</span>
            <button
              @click="activeTab = 'canvas'"
              class="text-pink-400 hover:underline font-medium cursor-pointer"
            >
              Chuyển sang Thay Phông Nền & Cọ Tinh Chỉnh →
            </button>
          </div>
        </div>

        <!-- Tab 2: BgPresetsBar & CanvasPreview View -->
        <div v-else class="space-y-4">
          <!-- BgPresetsBar Component (Cytools 1-to-1) -->
          <div class="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-neutral-900/70 border border-neutral-800">
            <span class="text-xs font-semibold text-neutral-400 mr-1 flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4 5 5 0 015-5 4 4 0 014 4v1a2 2 0 002 2h2a2 2 0 002-2 7 7 0 00-7-7 9 9 0 00-9 9c0 1.5.5 3 2 4" />
              </svg>
              Chọn phông nền:
            </span>

            <!-- Preset: Trong suốt -->
            <button
              @click="selectedPreset = 'transparent'"
              class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer"
              :class="selectedPreset === 'transparent' ? 'bg-sky-500/10 border-sky-500/50 text-sky-300' : 'bg-neutral-800/80 border-neutral-700/60 text-neutral-300 hover:bg-neutral-800'"
            >
              <div class="w-4 h-4 rounded bg-[conic-gradient(#cbd5e1_25%,#94a3b8_0_50%,#cbd5e1_0_75%,#94a3b8_0)] bg-[size:6px_6px] border border-neutral-600 shrink-0"></div>
              <span>Trong suốt (PNG gốc)</span>
              <svg v-if="selectedPreset === 'transparent'" class="w-3 h-3 text-sky-400 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </button>

            <!-- Preset: Trắng tinh khôi -->
            <button
              @click="selectedPreset = 'white'"
              class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer"
              :class="selectedPreset === 'white' ? 'bg-sky-500/10 border-sky-500/50 text-sky-300' : 'bg-neutral-800/80 border-neutral-700/60 text-neutral-300 hover:bg-neutral-800'"
            >
              <div class="w-4 h-4 rounded bg-white border border-neutral-300 shrink-0"></div>
              <span>Trắng TMĐT</span>
              <svg v-if="selectedPreset === 'white'" class="w-3 h-3 text-sky-400 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </button>

            <!-- Preset: Nền Đỏ Ảnh Thẻ -->
            <button
              @click="selectedPreset = 'id_red'"
              class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer"
              :class="selectedPreset === 'id_red' ? 'bg-sky-500/10 border-sky-500/50 text-sky-300' : 'bg-neutral-800/80 border-neutral-700/60 text-neutral-300 hover:bg-neutral-800'"
            >
              <div class="w-4 h-4 rounded bg-[#cc0000] border border-red-700 shrink-0"></div>
              <span>Ảnh thẻ Đỏ (#cc0000)</span>
              <svg v-if="selectedPreset === 'id_red'" class="w-3 h-3 text-sky-400 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </button>

            <!-- Preset: Nền Xanh Ảnh Thẻ -->
            <button
              @click="selectedPreset = 'id_blue'"
              class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer"
              :class="selectedPreset === 'id_blue' ? 'bg-sky-500/10 border-sky-500/50 text-sky-300' : 'bg-neutral-800/80 border-neutral-700/60 text-neutral-300 hover:bg-neutral-800'"
            >
              <div class="w-4 h-4 rounded bg-[#0066cc] border border-blue-700 shrink-0"></div>
              <span>Ảnh thẻ Xanh (#0066cc)</span>
              <svg v-if="selectedPreset === 'id_blue'" class="w-3 h-3 text-sky-400 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </button>

            <!-- Preset: Tùy chỉnh màu -->
            <label
              class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-all"
              :class="selectedPreset === 'custom' ? 'bg-sky-500/10 border-sky-500/50 text-sky-300' : 'bg-neutral-800/80 border-neutral-700/60 text-neutral-300 hover:bg-neutral-800'"
            >
              <div
                class="w-4 h-4 rounded border border-neutral-500 shrink-0"
                :style="{ backgroundColor: customColor }"
              ></div>
              <span>Màu tùy chọn</span>
              <input
                type="color"
                v-model="customColor"
                @input="selectedPreset = 'custom'"
                class="w-0 h-0 opacity-0 absolute pointer-events-none"
              />
              <svg v-if="selectedPreset === 'custom'" class="w-3 h-3 text-sky-400 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </label>
          </div>

          <!-- CanvasPreview Component (Cytools 1-to-1) -->
          <div class="space-y-4">
            <!-- Refine Brush Control Bar -->
            <div class="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-neutral-900 border border-neutral-800">
              <div class="flex items-center gap-2">
                <span class="text-xs font-semibold text-neutral-300 mr-1 flex items-center gap-1.5">
                  <svg class="w-3.5 h-3.5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Cọ Tinh Chỉnh Nhanh:
                </span>

                <div class="flex rounded-lg bg-neutral-950 p-1 border border-neutral-800">
                  <button
                    @click="brushMode = 'none'"
                    class="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all cursor-pointer"
                    :class="brushMode === 'none' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-200'"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>Xem</span>
                  </button>

                  <button
                    @click="brushMode = 'erase'"
                    class="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all cursor-pointer"
                    :class="brushMode === 'erase' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'text-neutral-400 hover:text-neutral-200'"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Cọ Xóa Nền</span>
                  </button>

                  <button
                    @click="brushMode = 'restore'"
                    class="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all cursor-pointer"
                    :class="brushMode === 'restore' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-neutral-400 hover:text-neutral-200'"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Cọ Khôi Phục</span>
                  </button>
                </div>
              </div>

              <!-- Brush size & Reset -->
              <div class="flex items-center gap-4">
                <div v-if="brushMode !== 'none'" class="flex items-center gap-2">
                  <span class="text-[11px] text-neutral-400 font-mono">Cỡ cọ: {{ brushSize }}px</span>
                  <input
                    type="range"
                    min="8"
                    max="64"
                    v-model.number="brushSize"
                    class="w-24 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                  />
                </div>

                <button
                  v-if="hasEdits"
                  @click="initCanvases"
                  class="px-2.5 py-1 rounded text-[11px] font-medium text-neutral-300 hover:text-white bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700/60 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Đặt lại nét vẽ</span>
                </button>
              </div>
            </div>

            <!-- Canvas Viewport Container -->
            <div
              class="relative w-full rounded-xl overflow-hidden border border-neutral-800 flex items-center justify-center aspect-video md:aspect-[16/10] select-none"
              :class="selectedPreset === 'transparent' ? 'bg-[conic-gradient(#1e293b_25%,#0f172a_0_50%,#1e293b_0_75%,#0f172a_0)] bg-[size:16px_16px]' : 'bg-neutral-950'"
            >
              <canvas
                ref="canvasRef"
                @mousedown="handleCanvasMouseDown"
                @mousemove="handleCanvasMouseMove"
                @mouseup="handleCanvasMouseUp"
                @mouseleave="handleCanvasMouseLeave"
                class="max-w-full max-h-full object-contain transition-all"
                :class="brushMode === 'none' ? 'cursor-default' : 'cursor-crosshair'"
              />

              <!-- Dynamic Brush Mode Hint -->
              <div
                v-if="brushMode !== 'none'"
                class="absolute top-3 left-3 px-3 py-1.5 rounded-lg bg-black/80 backdrop-blur-md text-xs font-medium text-neutral-200 border border-neutral-700/80 flex items-center gap-2"
              >
                <template v-if="brushMode === 'erase'">
                  <svg class="w-3.5 h-3.5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Đang bật Cọ Xóa: Di chuột để xóa các mảng nền còn sót lại</span>
                </template>
                <template v-else>
                  <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Đang bật Cọ Khôi Phục: Di chuột để lấy lại các chi tiết gốc bị lẹm</span>
                </template>
              </div>

              <!-- Resolution Badge -->
              <div
                v-if="dimensions.width > 0"
                class="absolute bottom-3 left-3 px-2.5 py-1 rounded bg-black/60 backdrop-blur-md text-[11px] font-mono text-neutral-300 border border-neutral-700/60"
              >
                Độ phân giải HD: {{ dimensions.width }} × {{ dimensions.height }} px {{ hasEdits ? '• Đã chỉnh sửa' : '' }}
              </div>
            </div>

            <!-- Download Action Row (Cytools 1-to-1) -->
            <div class="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-neutral-900 border border-neutral-800">
              <div class="space-y-0.5">
                <p class="text-xs font-semibold text-neutral-200">
                  Xuất file chất lượng cao (HD Resolution)
                </p>
                <p class="text-[11px] text-neutral-400">
                  Giữ nguyên độ sắc nét {{ dimensions.width }} × {{ dimensions.height }} px gốc cùng toàn bộ tinh chỉnh cọ vẽ. Tự động gắn tiền tố thương hiệu <code class="text-pink-400 font-mono">[cytools.io.vn]</code>.
                </p>
              </div>

              <button
                @click="handleDownload"
                :disabled="isExporting"
                class="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-neutral-950 font-bold text-xs active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                <template v-if="downloadSuccess">
                  <svg class="w-4 h-4 text-neutral-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Đã Tải Thành Công!</span>
                </template>
                <template v-else>
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>
                    {{ selectedPreset === 'transparent' ? 'Tải Ảnh PNG Trong Suốt HD' : 'Tải Ảnh Với Phông Nền HD' }}
                  </span>
                </template>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Credit & Cytools Link -->
      <footer class="pt-8 pb-4 text-center border-t border-neutral-900 text-xs text-neutral-500 space-y-1">
        <p>
          Phát triển bởi <span class="font-semibold text-neutral-300">Nguyễn Đăng Khánh</span> — Khám phá thêm công cụ tại
          <a
            href="https://cytools.io.vn"
            target="_blank"
            rel="noopener noreferrer"
            class="text-pink-400 hover:text-pink-300 font-semibold underline decoration-pink-500/30 underline-offset-2 transition-colors"
          >
            cytools.io.vn
          </a>
        </p>
        <p class="text-[11px] text-neutral-600">
          Chạy 100% bằng WebAssembly & WebGPU trên trình duyệt máy bạn • Bảo mật toàn diện, không lưu trữ hình ảnh
        </p>
      </footer>
    </div>
  </div>
</template>
