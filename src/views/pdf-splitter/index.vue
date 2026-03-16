<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body px-4 py-8 md:px-8">
    <!-- Header -->
    <header class="flex items-center gap-4 mb-10 max-w-7xl mx-auto animate-fade-up">
      <div
        class="w-11 h-11 bg-accent-coral flex items-center justify-content-center justify-center text-xl shrink-0"
      >
        ✂️
      </div>
      <h1 class="font-display text-2xl font-bold tracking-tight">
        PDF <span class="text-accent-coral">Splitter</span>
      </h1>
      <div
        class="ml-auto border border-border-default px-3 py-1 font-display text-xs tracking-widest text-text-dim uppercase"
      >
        v1.0
      </div>
      <RouterLink
        to="/"
        class="border border-border-default bg-bg-surface px-4 py-2 text-xs text-text-secondary font-display tracking-wide transition hover:border-accent-coral hover:text-text-primary"
      >
        ← Home
      </RouterLink>
    </header>

    <div class="max-w-7xl mx-auto">
      <!-- Drop Zone -->
      <div
        v-if="!pdfLoaded"
        class="border-2 border-dashed border-border-default bg-bg-surface p-16 text-center cursor-pointer transition-all duration-300 animate-fade-up animate-delay-2"
        :class="
          isDragOver
            ? 'border-accent-coral bg-bg-elevated'
            : 'hover:border-accent-coral hover:bg-bg-elevated'
        "
        @dragover.prevent="isDragOver = true"
        @dragleave="isDragOver = false"
        @drop.prevent="onDrop"
      >
        <div class="text-5xl mb-4 block">📄</div>
        <div class="font-display text-xl font-bold mb-2">Kéo &amp; thả file PDF vào đây</div>
        <div class="text-text-secondary text-sm mb-6">hoặc nhấn nút bên dưới để chọn file</div>
        <div class="relative inline-block">
          <button
            type="button"
            class="inline-flex items-center gap-2 bg-accent-coral text-bg-deep font-display font-bold text-sm tracking-wide px-7 py-3 uppercase transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent-coral/30"
          >
            📁 Chọn file PDF
          </button>
          <input
            type="file"
            accept=".pdf"
            class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            @change="onFileChange"
          />
        </div>
      </div>

      <!-- Main layout -->
      <div v-if="pdfLoaded" class="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
        <!-- PDF Info bar -->
        <div
          class="xl:col-span-2 border border-border-default bg-bg-surface px-5 py-4 flex items-center gap-4 animate-fade-up"
        >
          <div class="text-2xl">📄</div>
          <div class="flex-1 min-w-0">
            <div class="font-display font-bold text-sm truncate">{{ pdfName }}</div>
            <div class="text-text-dim text-xs mt-0.5">{{ totalPages }} trang • {{ pdfSize }}</div>
          </div>
          <div
            class="hidden sm:flex items-center gap-2 border border-accent-coral/30 bg-accent-coral/10 px-3 py-1.5 text-accent-coral text-xs font-display tracking-wide"
          >
            <span class="font-bold">{{
              currentMode === 'select' ? selectedPages.size : ranges.length
            }}</span>
            {{ currentMode === 'select' ? 'trang' : 'khoảng' }} đã chọn
          </div>
          <button
            class="border border-border-default px-4 py-2 text-xs text-text-secondary font-display tracking-wide transition hover:border-accent-coral hover:text-text-primary"
            @click="resetApp"
          >
            ↺ Tải file khác
          </button>
        </div>

        <!-- Pages Preview -->
        <div class="border border-border-default bg-bg-surface p-6 animate-fade-up animate-delay-2">
          <div class="flex items-center justify-between mb-5">
            <h2
              class="font-display text-sm font-semibold uppercase tracking-widest flex items-center gap-2"
            >
              <span class="text-accent-coral">//</span>
              Preview trang
            </h2>
            <div class="flex gap-2">
              <button
                v-for="(label, action) in {
                  selectAll: 'Tất cả',
                  deselectAll: 'Bỏ chọn',
                  invertSelection: 'Đảo',
                }"
                :key="action"
                class="border border-border-default bg-bg-elevated px-3 py-1.5 text-xs text-text-secondary font-display tracking-wide transition hover:border-accent-coral hover:text-text-primary"
                @click="
                  (action === 'selectAll'
                    ? selectAll
                    : action === 'deselectAll'
                      ? deselectAll
                      : invertSelection)()
                "
              >
                {{ label }}
              </button>
            </div>
          </div>

          <div
            class="grid gap-3 overflow-y-auto pr-1 max-h-150"
            style="
              grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
              scrollbar-width: thin;
              scrollbar-color: #253549 transparent;
            "
          >
            <div
              v-for="i in totalPages"
              :key="i"
              class="relative cursor-pointer border-2 transition-all duration-200 bg-bg-elevated hover:-translate-y-0.5"
              :class="
                selectedPages.has(i)
                  ? 'border-accent-coral shadow-lg shadow-accent-coral/10'
                  : 'border-border-default hover:border-accent-coral/50'
              "
              style="aspect-ratio: 0.707"
              @click="togglePage(i)"
            >
              <!-- Loading -->
              <div
                v-if="!pageCanvases[i]"
                class="absolute inset-0 flex items-center justify-center bg-bg-elevated"
              >
                <div
                  class="w-6 h-6 border-2 border-border-default border-t-accent-coral rounded-full animate-spin"
                ></div>
              </div>
              <!-- Canvas placeholder -->
              <canvas
                v-if="pageCanvases[i]"
                :ref="(el) => mountCanvas(el as HTMLCanvasElement | null, i)"
                class="w-full h-full block object-contain"
              ></canvas>
              <!-- Check mark -->
              <div
                v-if="selectedPages.has(i)"
                class="absolute top-1.5 right-1.5 w-5 h-5 bg-accent-coral text-bg-deep flex items-center justify-center text-xs font-bold"
              >
                ✓
              </div>
              <!-- Page number -->
              <div
                class="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/70 to-transparent pt-5 pb-1.5 text-center text-[10px] text-white/70"
              >
                Trang {{ i }}
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="flex flex-col gap-4 animate-fade-up animate-delay-3">
          <!-- Split Mode -->
          <div class="border border-border-default bg-bg-surface p-5">
            <div
              class="font-display text-xs tracking-widest text-text-dim uppercase mb-4 flex items-center gap-2"
            >
              <span class="text-accent-amber">//</span> Chế độ cắt
            </div>

            <!-- Tabs -->
            <div class="flex bg-bg-elevated p-0.5 mb-4 gap-0.5">
              <button
                v-for="{ id, label } in [
                  { id: 'select', label: 'Chọn trang' },
                  { id: 'range', label: 'Khoảng trang' },
                ]"
                :key="id"
                class="flex-1 py-2 text-xs font-display tracking-wide transition-all"
                :class="
                  currentMode === id
                    ? 'bg-accent-coral text-bg-deep font-bold'
                    : 'text-text-secondary hover:text-text-primary'
                "
                @click="switchMode(id as 'select' | 'range')"
              >
                {{ label }}
              </button>
            </div>

            <!-- Select mode hint -->
            <div
              v-if="currentMode === 'select'"
              class="text-text-secondary text-xs leading-relaxed"
            >
              Click vào các trang bên trái để chọn. Tất cả trang được chọn sẽ xuất thành
              <strong class="text-text-primary">1 file PDF</strong>.
            </div>

            <!-- Range mode -->
            <div v-if="currentMode === 'range'">
              <div class="mb-4">
                <div class="flex justify-between text-xs text-text-dim mb-2">
                  <span>Từ trang</span>
                  <span>Đến trang</span>
                </div>
                <div class="grid grid-cols-2 gap-2 mb-2">
                  <input
                    type="number"
                    v-model.number="rangeFrom"
                    :min="1"
                    :max="totalPages"
                    class="bg-bg-elevated border border-border-default text-text-primary px-3 py-2 text-center text-sm font-body focus:outline-none focus:border-accent-coral transition w-full"
                  />
                  <input
                    type="number"
                    v-model.number="rangeTo"
                    :min="1"
                    :max="totalPages"
                    class="bg-bg-elevated border border-border-default text-text-primary px-3 py-2 text-center text-sm font-body focus:outline-none focus:border-accent-coral transition w-full"
                  />
                </div>
                <button
                  class="w-full border border-dashed border-border-default bg-bg-elevated py-2.5 text-xs text-accent-amber font-display tracking-wide uppercase transition hover:border-accent-amber hover:bg-accent-amber/5"
                  @click="addRange"
                >
                  + Thêm khoảng trang
                </button>
              </div>

              <div class="flex flex-col gap-2">
                <div
                  v-if="ranges.length === 0"
                  class="text-center text-text-dim text-xs py-4 border border-dashed border-border-default"
                >
                  Chưa có khoảng trang nào.<br />Mỗi khoảng → 1 file PDF.
                </div>
                <div
                  v-for="(r, idx) in ranges"
                  :key="idx"
                  class="flex items-center gap-2 border border-border-default bg-bg-elevated px-3 py-2.5"
                >
                  <div
                    class="w-2 h-2 rounded-full shrink-0"
                    :style="{ background: COLORS[idx % COLORS.length] }"
                  ></div>
                  <div class="flex-1 text-xs font-body">
                    Trang {{ r.from }} → {{ r.to }}
                    <span class="text-text-dim">({{ r.to - r.from + 1 }} trang)</span>
                  </div>
                  <button
                    class="text-text-dim hover:text-accent-coral text-base transition leading-none"
                    @click="removeRange(idx)"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Output settings -->
          <div class="border border-border-default bg-bg-surface p-5">
            <div
              class="font-display text-xs tracking-widest text-text-dim uppercase mb-4 flex items-center gap-2"
            >
              <span class="text-accent-sky">//</span> Cài đặt xuất
            </div>
            <div
              class="border-b border-border-default py-3 flex items-center justify-between text-xs"
            >
              <span class="text-text-secondary">Đặt tên file tự động</span>
              <button
                class="relative w-9 h-5 transition-colors duration-200 shrink-0"
                :class="autoName ? 'bg-accent-coral' : 'bg-border-default'"
                @click="autoName = !autoName"
              >
                <span
                  class="absolute top-0.5 w-4 h-4 bg-bg-deep transition-transform duration-200"
                  :class="autoName ? 'translate-x-4' : 'translate-x-0.5'"
                ></span>
              </button>
            </div>
            <div class="pt-3 flex items-center justify-between text-xs gap-3">
              <span class="text-text-secondary">Prefix tên file</span>
              <input
                type="text"
                v-model="filePrefix"
                class="bg-bg-elevated border border-border-default text-text-primary px-3 py-1.5 text-xs font-body focus:outline-none focus:border-accent-coral transition w-24"
              />
            </div>
          </div>

          <!-- Split button -->
          <div class="border border-border-default bg-bg-surface p-5">
            <button
              class="w-full bg-accent-coral text-bg-deep font-display font-bold text-base tracking-widest uppercase py-4 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:shadow-lg hover:enabled:shadow-accent-coral/30 hover:enabled:-translate-y-0.5"
              :disabled="!canSplit || isSplitting"
              @click="splitPDF"
            >
              {{ isSplitting ? '⏳ Đang xử lý...' : '✂️ Cắt & Tải về' }}
            </button>
            <div v-if="isSplitting" class="mt-3 h-1 bg-border-default overflow-hidden">
              <div
                class="h-full bg-accent-coral transition-all duration-300"
                :style="{ width: progress + '%' }"
              ></div>
            </div>
            <div v-if="isSplitting" class="mt-2 text-center text-xs text-text-dim">
              {{ statusMsg }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div
      class="fixed bottom-8 left-1/2 -translate-x-1/2 border px-6 py-3 text-sm font-body transition-all duration-300 z-50 whitespace-nowrap"
      :class="[
        toastVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 pointer-events-none',
        toastError
          ? 'border-accent-coral text-accent-coral bg-bg-surface'
          : 'border-accent-amber text-accent-amber bg-bg-surface',
      ]"
    >
      {{ toastMsg }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { RouterLink } from 'vue-router'

/* eslint-disable @typescript-eslint/no-explicit-any */
declare const pdfjsLib: any
declare const PDFLib: any

const COLORS = ['#FF6B4A', '#FFB830', '#38BDF8', '#a78bfa', '#34d399']

// State
const pdfLoaded = ref(false)
const pdfName = ref('')
const pdfSize = ref('')
const totalPages = ref(0)
const selectedPages = ref(new Set<number>())
const ranges = ref<{ from: number; to: number }[]>([])
const currentMode = ref<'select' | 'range'>('select')
const rangeFrom = ref(1)
const rangeTo = ref(1)
const autoName = ref(true)
const filePrefix = ref('split')
const isDragOver = ref(false)
const isSplitting = ref(false)
const progress = ref(0)
const statusMsg = ref('')
const toastVisible = ref(false)
const toastError = ref(false)
const toastMsg = ref('')

// pageCanvases[i] = offscreen canvas already rendered for page i
const pageCanvases = ref<Record<number, HTMLCanvasElement>>({})
// mounted canvas DOM refs
const domCanvases: Record<number, HTMLCanvasElement> = {}

let pdfJsDoc: any = null
let pdfBytes: ArrayBuffer | null = null

const canSplit = computed(() => {
  if (currentMode.value === 'select') return selectedPages.value.size > 0
  return ranges.value.length > 0
})

// Called by Vue :ref on each <canvas>
function mountCanvas(el: HTMLCanvasElement | null, pageNum: number) {
  if (!el) return
  domCanvases[pageNum] = el
  const src = pageCanvases.value[pageNum]
  if (src) {
    el.width = src.width
    el.height = src.height
    el.getContext('2d')!.drawImage(src, 0, 0)
  }
}

async function ensureScriptsLoaded() {
  if (typeof pdfjsLib === 'undefined') {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js')
    ;(window as any).pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
  }
  if (typeof PDFLib === 'undefined') {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js')
  }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = src
    s.onload = () => resolve()
    s.onerror = reject
    document.head.appendChild(s)
  })
}

async function loadPDF(file: File) {
  try {
    await ensureScriptsLoaded()
    const buffer = await file.arrayBuffer()
    pdfBytes = buffer.slice(0)
    const typed = new Uint8Array(buffer.slice(0))
    pdfJsDoc = await (window as any).pdfjsLib.getDocument({ data: typed }).promise
    totalPages.value = pdfJsDoc.numPages
    pdfName.value = file.name
    pdfSize.value = (file.size / 1024 / 1024).toFixed(2) + ' MB'
    rangeFrom.value = 1
    rangeTo.value = totalPages.value
    pageCanvases.value = {}
    pdfLoaded.value = true
    await nextTick()
    renderAllPages()
  } catch (e: any) {
    showToast('❌ Lỗi đọc file PDF: ' + e.message, true)
  }
}

async function renderAllPages() {
  for (let i = 1; i <= totalPages.value; i++) {
    try {
      const page = await pdfJsDoc.getPage(i)
      const vp = page.getViewport({ scale: 0.4 })
      const canvas = document.createElement('canvas')
      canvas.width = vp.width
      canvas.height = vp.height
      await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise
      pageCanvases.value = { ...pageCanvases.value, [i]: canvas }
      await nextTick()
      const dom = domCanvases[i]
      if (dom) {
        dom.width = canvas.width
        dom.height = canvas.height
        dom.getContext('2d')!.drawImage(canvas, 0, 0)
      }
    } catch (e) {
      console.warn('Page render error', e)
    }
  }
}

function onDrop(e: DragEvent) {
  isDragOver.value = false
  const file = e.dataTransfer?.files[0]
  if (file?.type === 'application/pdf') loadPDF(file)
  else showToast('⚠️ Vui lòng chọn file PDF!', true)
}

function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) loadPDF(file)
}

function togglePage(num: number) {
  const s = new Set(selectedPages.value)
  if (s.has(num)) s.delete(num)
  else s.add(num)
  selectedPages.value = s
}

function selectAll() {
  const s = new Set<number>()
  for (let i = 1; i <= totalPages.value; i++) s.add(i)
  selectedPages.value = s
}

function deselectAll() {
  selectedPages.value = new Set()
}

function invertSelection() {
  const s = new Set<number>()
  for (let i = 1; i <= totalPages.value; i++) {
    if (!selectedPages.value.has(i)) s.add(i)
  }
  selectedPages.value = s
}

function switchMode(mode: 'select' | 'range') {
  currentMode.value = mode
}

function addRange() {
  const from = rangeFrom.value
  const to = rangeTo.value
  if (isNaN(from) || isNaN(to) || from < 1 || to < from || to > totalPages.value) {
    showToast('⚠️ Khoảng trang không hợp lệ!', true)
    return
  }
  ranges.value = [...ranges.value, { from, to }]
  highlightRangePages()
}

function removeRange(idx: number) {
  ranges.value = ranges.value.filter((_, i) => i !== idx)
  highlightRangePages()
}

function highlightRangePages() {
  const s = new Set<number>()
  for (const r of ranges.value) {
    for (let i = r.from; i <= r.to; i++) s.add(i)
  }
  selectedPages.value = s
}

async function splitPDF() {
  if (!pdfBytes) return
  isSplitting.value = true
  progress.value = 0
  try {
    const lib = (window as any).PDFLib
    const sourcePdf = await lib.PDFDocument.load(pdfBytes.slice(0))
    const prefix = filePrefix.value || 'split'

    if (currentMode.value === 'select') {
      const pages = Array.from(selectedPages.value).sort((a, b) => a - b)
      statusMsg.value = `Đang tạo PDF từ ${pages.length} trang...`
      progress.value = 20
      const newPdf = await lib.PDFDocument.create()
      const copied = await newPdf.copyPages(
        sourcePdf,
        pages.map((p) => p - 1),
      )
      copied.forEach((page: any) => newPdf.addPage(page))
      progress.value = 80
      statusMsg.value = 'Đang lưu file...'
      const bytes = await newPdf.save()
      const filename = autoName.value
        ? `${prefix}_pages_${pages[0]}-${pages[pages.length - 1]}.pdf`
        : `${prefix}.pdf`
      downloadBytes(bytes, filename)
      progress.value = 100
      showToast(`✅ Đã tải về: ${filename}`)
    } else {
      for (let i = 0; i < ranges.value.length; i++) {
        const r = ranges.value[i]
        if (!r) continue
        progress.value = Math.round((i / ranges.value.length) * 80) + 10
        statusMsg.value = `Đang xử lý khoảng ${i + 1}/${ranges.value.length}...`
        const newPdf = await lib.PDFDocument.create()
        const idxs = []
        for (let p = r.from; p <= r.to; p++) idxs.push(p - 1)
        const copied = await newPdf.copyPages(sourcePdf, idxs)
        copied.forEach((page: any) => newPdf.addPage(page))
        const bytes = await newPdf.save()
        const filename = autoName.value
          ? `${prefix}_pages_${r.from}-${r.to}.pdf`
          : `${prefix}_${i + 1}.pdf`
        downloadBytes(bytes, filename)
        await new Promise((res) => setTimeout(res, 300))
      }
      progress.value = 100
      showToast(`✅ Đã tải về ${ranges.value.length} file PDF`)
    }
  } catch (e: any) {
    showToast('❌ Lỗi khi cắt PDF: ' + e.message, true)
  }
  setTimeout(() => {
    isSplitting.value = false
    progress.value = 0
  }, 2000)
}

function downloadBytes(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function resetApp() {
  pdfLoaded.value = false
  pdfJsDoc = null
  pdfBytes = null
  selectedPages.value = new Set()
  ranges.value = []
  pageCanvases.value = {}
}

let toastTimer: ReturnType<typeof setTimeout> | null = null
function showToast(msg: string, isError = false) {
  toastMsg.value = msg
  toastError.value = isError
  toastVisible.value = true
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toastVisible.value = false), 3000)
}
</script>
