<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useClipboard, useEventListener } from '@vueuse/core'
import type {
  BenchmarkResult,
  ChatMessage,
  ChunkItem,
  ChunkStrategy,
  DocItem,
  EmbedderType,
  IndexInfo,
  PcaData,
  RetrieveResult,
} from './core/types'
import {
  ClientRagPipeline,
  computeClientPca,
  parsePdfFile,
  SAMPLE_DOC_TEXT,
} from './core/rag-engine'

// --- Cấu hình & Trạng thái Engine ---
const bridgeUrl = ref('http://127.0.0.1:8000')
const engineMode = ref<'python' | 'browser'>('browser')
const isBridgeConnected = ref(false)

// Trạng thái đọc file PDF (PyMuPDF / PDF.js)
const isParsingFile = ref(false)
const parsingStatusText = ref('')
const lastParsedPdfInfo = ref<{ name: string; pages: number; parser: string } | null>(null)

// Trạng thái Pipeline
const currentStep = ref<number>(0) // 0: chưa chạy, 1: LOAD, 2: CHUNK, 3: EMBED, 4: RETRIEVE, 5: GENERATE
const isIndexing = ref(false)
const isRetrieving = ref(false)
const isBenchmarking = ref(false)

// Dữ liệu tài liệu & cài đặt
const docs = ref<DocItem[]>([
  { name: 'tai-lieu-mau-rag.txt', content: SAMPLE_DOC_TEXT, length: SAMPLE_DOC_TEXT.length },
])
const directTextInput = ref(SAMPLE_DOC_TEXT)
// Modal Chỉnh sửa Văn bản Toàn diện (Modal to)
const isDocEditorOpen = ref(false)
const docEditorText = ref('')
const docEditorFilename = ref('tai-lieu-mau-rag.txt')
const autoIndexAfterSave = ref(true)

const docEditorStats = computed(() => {
  const text = docEditorText.value
  const chars = text.length
  const words = text.trim() ? text.trim().split(/\s+/).length : 0
  const lines = text ? text.split('\n').length : 0
  const approxTokens = Math.round(chars / 4)
  return { chars, words, lines, approxTokens }
})

const chunkStrategy = ref<ChunkStrategy>('By Paragraph')
const chunkSize = ref(500)
const chunkOverlap = ref(100)
const minChunkChars = ref(80)

const embedder = ref<EmbedderType>('TF-IDF')
const topK = ref(4)
const minScore = ref(0.05)

// Kết quả xử lý
const indexInfo = ref<IndexInfo | null>(null)
const chunks = ref<ChunkItem[]>([])
const lastResult = ref<RetrieveResult | null>(null)
const pcaData = ref<PcaData | null>(null)
const benchmarkResult = ref<BenchmarkResult | null>(null)

interface ScoreEntry {
  id: number
  score: number
  rank?: number
  isTop: boolean
}

// Sắp xếp các thanh điểm số theo thứ tự điểm giảm dần khi có kết quả truy hồi
const sortedScores = computed<ScoreEntry[]>(() => {
  if (!lastResult.value || !lastResult.value.all_scores.length) return []
  const currentLastResult = lastResult.value
  const items: ScoreEntry[] = currentLastResult.all_scores.map((score, id) => {
    const hit = currentLastResult.hits.find((h) => h.id === id)
    const isTop = Boolean(hit?.rank && hit.rank <= topK.value && score >= minScore.value)
    return {
      id,
      score,
      rank: hit?.rank,
      isTop,
    }
  })
  return items.sort((a, b) => b.score - a.score || a.id - b.id)
})

// Sắp xếp vị trí các chunk theo thứ tự điểm giảm dần khi có điểm
const sortedChunks = computed<ChunkItem[]>(() => {
  if (!lastResult.value || !lastResult.value.all_scores.length) {
    return chunks.value
  }
  const currentScores = lastResult.value.all_scores
  return [...chunks.value].sort((a, b) => {
    const scoreA = currentScores[a.id] ?? 0
    const scoreB = currentScores[b.id] ?? 0
    return scoreB - scoreA || a.id - b.id
  })
})

// Chat & Query
const userQuery = ref('')
const chatHistory = ref<ChatMessage[]>([])
const chatContainer = ref<HTMLElement | null>(null)
const isScrolledUp = ref(false)
const copiedMessageId = ref<string | null>(null)
const activeTab = ref<'scores' | 'vectors' | 'chunks' | 'prompt' | 'compare'>('scores')

// --- Chế độ hiển thị Vector (3D / 2D) & Camera 3D tương tác ---
const vectorViewMode = ref<'3d' | '2d'>('3d') // Mặc định 3D cho trải nghiệm hiện đại
const yaw3D = ref(0.65) // Góc xoay quanh trục Y (radians)
const pitch3D = ref(0.35) // Góc nghiêng nhìn từ trên xuống (radians)
const zoom3D = ref(1.05) // Hệ số thu phóng
const isDragging3D = ref(false)
const dragStartPos = ref({ x: 0, y: 0 })
const dragStartAngles = ref({ yaw: 0.65, pitch: 0.35 })

function resetCamera3D(): void {
  yaw3D.value = 0.65
  pitch3D.value = 0.35
  zoom3D.value = 1.05
}

function onStartDrag3D(e: PointerEvent): void {
  if (e.pointerType === 'mouse' && e.button !== 0) return
  isDragging3D.value = true
  dragStartPos.value = { x: e.clientX, y: e.clientY }
  dragStartAngles.value = { yaw: yaw3D.value, pitch: pitch3D.value }
  hoveredChunk.value = null
}

function onDrag3D(e: PointerEvent): void {
  if (!isDragging3D.value) return
  const dx = e.clientX - dragStartPos.value.x
  const dy = e.clientY - dragStartPos.value.y

  yaw3D.value = dragStartAngles.value.yaw - dx * 0.012
  pitch3D.value = Math.max(-1.3, Math.min(1.3, dragStartAngles.value.pitch + dy * 0.012))
}

function onStopDrag3D(): void {
  isDragging3D.value = false
}

function onWheel3D(e: WheelEvent): void {
  e.preventDefault()
  const delta = e.deltaY > 0 ? -0.08 : 0.08
  zoom3D.value = Math.max(0.6, Math.min(2.5, Math.round((zoom3D.value + delta) * 100) / 100))
}

useEventListener(window, 'pointermove', (e: PointerEvent) => {
  if (isDragging3D.value) {
    onDrag3D(e)
  }
})

useEventListener(window, 'pointerup', () => {
  if (isDragging3D.value) {
    onStopDrag3D()
  }
})

interface ProjectedPoint3D {
  id: number
  x: number
  y: number
  z: number
  sx: number
  sy: number
  depth: number
  projScale: number
  score: number
  is_top: boolean
}

function project3D(
  x: number,
  y: number,
  z: number,
): { sx: number; sy: number; depth: number; scale: number } {
  const fov = 3.2
  const cosY = Math.cos(yaw3D.value)
  const sinY = Math.sin(yaw3D.value)
  const cosP = Math.cos(pitch3D.value)
  const sinP = Math.sin(pitch3D.value)

  // 1. Xoay quanh trục Y (Yaw)
  const x1 = x * cosY + z * sinY
  const z1 = -x * sinY + z * cosY

  // 2. Xoay quanh trục X (Pitch)
  const y2 = y * cosP - z1 * sinP
  const z2 = y * sinP + z1 * cosP

  // 3. Phép chiếu phối cảnh Perspective
  const perspective = fov / (fov + z2)
  const scale = perspective * zoom3D.value

  return {
    sx: x1 * scale,
    sy: y2 * scale,
    depth: z2,
    scale,
  }
}

// Danh sách các điểm Chunk 3D được sắp xếp theo độ sâu (Z-sorting)
const projectedChunkPoints3D = computed<ProjectedPoint3D[]>(() => {
  if (!pcaData.value || pcaData.value.points.length === 0) return []
  const list: ProjectedPoint3D[] = pcaData.value.points.map((pt) => {
    const p = project3D(pt.x, pt.y, pt.z ?? 0)
    return {
      id: pt.id,
      x: pt.x,
      y: pt.y,
      z: pt.z ?? 0,
      sx: p.sx,
      sy: p.sy,
      depth: p.depth,
      projScale: p.scale,
      score: pt.score,
      is_top: pt.is_top,
    }
  })
  // Painter's algorithm: vẽ điểm sâu (xa) trước, điểm gần vẽ sau
  return list.sort((a, b) => b.depth - a.depth)
})

// Điểm Query trong không gian 3D
const projectedQueryPoint3D = computed(() => {
  if (!pcaData.value?.query) return null
  const q = pcaData.value.query
  const p = project3D(q.x, q.y, q.z ?? 0)
  return {
    sx: p.sx,
    sy: p.sy,
    depth: p.depth,
    scale: p.scale,
  }
})

// Đường liên kết từ Query tới các Top-K Chunks trong 3D
const projectedQueryLinks3D = computed(() => {
  if (!pcaData.value?.query) return []
  const q = project3D(pcaData.value.query.x, pcaData.value.query.y, pcaData.value.query.z ?? 0)
  const topPoints = pcaData.value.points.filter((p) => p.is_top)
  return topPoints.map((pt) => {
    const target = project3D(pt.x, pt.y, pt.z ?? 0)
    return {
      x1: q.sx,
      y1: q.sy,
      x2: target.sx,
      y2: target.sy,
    }
  })
})

// Các trục tọa độ 3D (PC1: Coral, PC2: Sky, PC3: Amber)
const projectedAxes3D = computed(() => {
  const origin = project3D(0, 0, 0)
  const axX = project3D(0.85, 0, 0)
  const axY = project3D(0, -0.85, 0)
  const axZ = project3D(0, 0, 0.85)
  return {
    origin,
    x: { ...axX, label: 'PC1', color: '#FF6B6B' },
    y: { ...axY, label: 'PC2', color: '#38BDF8' },
    z: { ...axZ, label: 'PC3', color: '#FFB830' },
  }
})

interface Line3D {
  x1: number
  y1: number
  x2: number
  y2: number
  depth: number
}

// Khung lồng không gian 3D (3D Bounding Cube Cage)
const projectedWireframe3D = computed<Line3D[]>(() => {
  const s = 0.75
  const rawEdges: Array<[[number, number, number], [number, number, number]]> = [
    // Mặt đáy (Floor)
    [
      [-s, s, -s],
      [s, s, -s],
    ],
    [
      [s, s, -s],
      [s, s, s],
    ],
    [
      [s, s, s],
      [-s, s, s],
    ],
    [
      [-s, s, s],
      [-s, s, -s],
    ],
    // Cột đứng
    [
      [-s, -s, -s],
      [-s, s, -s],
    ],
    [
      [s, -s, -s],
      [s, s, -s],
    ],
    [
      [s, -s, s],
      [s, s, s],
    ],
    [
      [-s, -s, s],
      [-s, s, s],
    ],
    // Mặt trên (Ceiling)
    [
      [-s, -s, -s],
      [s, -s, -s],
    ],
    [
      [s, -s, -s],
      [s, -s, s],
    ],
    [
      [s, -s, s],
      [-s, -s, s],
    ],
    [
      [-s, -s, s],
      [-s, -s, -s],
    ],
  ]

  return rawEdges.map(([p1, p2]) => {
    const a = project3D(p1[0]!, p1[1]!, p1[2]!)
    const b = project3D(p2[0]!, p2[1]!, p2[2]!)
    return {
      x1: a.sx,
      y1: a.sy,
      x2: b.sx,
      y2: b.sy,
      depth: (a.depth + b.depth) / 2,
    }
  })
})

function onChatScroll(): void {
  if (!chatContainer.value) return
  const { scrollTop, scrollHeight, clientHeight } = chatContainer.value
  isScrolledUp.value = scrollHeight - scrollTop - clientHeight > 80
}

function scrollToBottom(smooth = true): void {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTo({
        top: chatContainer.value.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      })
    }
  })
}

function copyMessageText(id: string, text: string): void {
  copy(text)
  copiedMessageId.value = id
  setTimeout(() => {
    if (copiedMessageId.value === id) {
      copiedMessageId.value = null
    }
  }, 2000)
}

function clearChatHistory(): void {
  chatHistory.value = []
}

watch(
  () => chatHistory.value.length,
  () => {
    scrollToBottom()
  },
  { flush: 'post' },
)

watch(isRetrieving, (retrieving) => {
  if (retrieving) {
    scrollToBottom()
  }
})

// Modal Popup State (Chi tiết Chunk chuẩn UI/UX)
const selectedChunk = ref<ChunkItem | null>(null)
const selectedChunkScore = ref<number | null>(null)
const selectedChunkRank = ref<number | null>(null)

// Floating Hover Popup State (Hiển thị nổi khi hover, không giật layout)
interface HoveredChunkInfo {
  id: number
  score: number
  rank?: number
  text: string
  source: string
  chars: number
}

const hoveredChunk = ref<HoveredChunkInfo | null>(null)
const hoverPos = ref({ x: 0, y: 0 })

function openChunkModal(chunkId: number): void {
  hoveredChunk.value = null
  const c = chunks.value.find((item) => item.id === chunkId)
  if (!c) return
  selectedChunk.value = c
  if (lastResult.value) {
    selectedChunkScore.value = lastResult.value.all_scores[chunkId] ?? null
    const hit = lastResult.value.hits.find((h) => h.id === chunkId)
    selectedChunkRank.value = hit?.rank ?? null
  } else {
    selectedChunkScore.value = null
    selectedChunkRank.value = null
  }
}

function closeChunkModal(): void {
  selectedChunk.value = null
}

function copySelectedChunkText(): void {
  if (selectedChunk.value) {
    copy(selectedChunk.value.text)
  }
}

function updateHoverPos(e: MouseEvent): void {
  const popupWidth = 360
  const popupHeight = 200
  const margin = 12

  let x = e.clientX + margin
  let y = e.clientY + margin

  if (x + popupWidth > window.innerWidth - margin) {
    x = Math.max(margin, e.clientX - popupWidth - margin)
  }
  if (y + popupHeight > window.innerHeight - margin) {
    y = Math.max(margin, e.clientY - popupHeight - margin)
  }

  hoverPos.value = { x, y }
}

let leaveTimer: ReturnType<typeof setTimeout> | null = null

function cancelLeaveTimer(): void {
  if (leaveTimer) {
    clearTimeout(leaveTimer)
    leaveTimer = null
  }
}

function onHoverBar(e: MouseEvent, idx: number, score: number): void {
  cancelLeaveTimer()
  const c = chunks.value.find((item) => item.id === idx)
  if (!c) return
  const hit = lastResult.value?.hits.find((h) => h.id === idx)
  hoveredChunk.value = {
    id: idx,
    score,
    rank: hit?.rank,
    text: c.text,
    source: c.source,
    chars: c.n_chars,
  }
  updateHoverPos(e)
}

function onHoverVector(e: MouseEvent, ptId: number): void {
  cancelLeaveTimer()
  const c = chunks.value.find((item) => item.id === ptId)
  if (!c) return
  const sc = lastResult.value?.all_scores[ptId] ?? 0
  const hit = lastResult.value?.hits.find((h) => h.id === ptId)
  hoveredChunk.value = {
    id: ptId,
    score: sc,
    rank: hit?.rank,
    text: c.text,
    source: c.source,
    chars: c.n_chars,
  }
  updateHoverPos(e)
}

function onHoverChunk(e: MouseEvent, c: ChunkItem): void {
  cancelLeaveTimer()
  const sc = lastResult.value?.all_scores[c.id] ?? 0
  const hit = lastResult.value?.hits.find((h) => h.id === c.id)
  hoveredChunk.value = {
    id: c.id,
    score: sc,
    rank: hit?.rank,
    text: c.text,
    source: c.source,
    chars: c.n_chars,
  }
  updateHoverPos(e)
}

function onMoveBar(e: MouseEvent): void {
  cancelLeaveTimer()
  if (hoveredChunk.value) {
    updateHoverPos(e)
  }
}

function onLeaveBar(): void {
  cancelLeaveTimer()
  leaveTimer = setTimeout(() => {
    hoveredChunk.value = null
  }, 80)
}

onUnmounted(() => {
  cancelLeaveTimer()
})

useEventListener(window, 'keydown', (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    if (isDocEditorOpen.value) {
      closeDocEditorModal()
      return
    }
    if (selectedChunk.value) {
      closeChunkModal()
      return
    }
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && isDocEditorOpen.value) {
    e.preventDefault()
    saveAndApplyDoc(autoIndexAfterSave.value)
  }
})

// Clipboard
const { copy, copied } = useClipboard()

// Browser pipeline instance fallback
const clientPipeline = new ClientRagPipeline()

// Tính toán tổng ký tự
const totalDocChars = computed(() => {
  return docs.value.reduce((acc, d) => acc + (d.content?.length || 0), 0)
})

const embedderExplanations: Record<EmbedderType, string> = {
  'TF-IDF':
    'Khớp từ khóa chính xác (Exact keyword matching). Không tải model, minh bạch và giải thích rõ nguyên nhân điểm số.',
  Hashing:
    'Hashing trick vào 512 dimensions cố định. Không cần fit từ điển, có thể va chạm băm (hash collision).',
  'Sentence-Transformers':
    'Semantic Embedding đa ngôn ngữ (chạy qua Python Bridge). Hiểu từ đồng nghĩa và ngữ cảnh sâu.',
}

// --- Kết nối Python Bridge (Tự động nhận diện ngầm nếu có) ---
async function checkBridgeConnection(): Promise<boolean> {
  try {
    const res = await fetch(`${bridgeUrl.value}/api/status`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
    if (res.ok) {
      const data = await res.json()
      isBridgeConnected.value = true
      engineMode.value = 'python'
      if (data.info && data.chunks && data.chunks.length > 0) {
        indexInfo.value = data.info
        chunks.value = data.chunks
        if (data.pca) pcaData.value = data.pca
        currentStep.value = 3
      }
      return true
    } else {
      isBridgeConnected.value = false
      return false
    }
  } catch {
    isBridgeConnected.value = false
    return false
  }
}

// --- Thao tác tài liệu ---
function loadSampleDocument(): void {
  docs.value = [
    { name: 'tai-lieu-mau-rag.txt', content: SAMPLE_DOC_TEXT, length: SAMPLE_DOC_TEXT.length },
  ]
  directTextInput.value = SAMPLE_DOC_TEXT
  docEditorFilename.value = 'tai-lieu-mau-rag.txt'
  resetPipelineProgress()
}

async function handleFileUpload(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return

  const fileList = Array.from(input.files)
  isParsingFile.value = true
  lastParsedPdfInfo.value = null

  try {
    const newDocs: DocItem[] = []

    for (const file of fileList) {
      const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf'

      if (isPdf) {
        parsingStatusText.value = `Đang phân tách "${file.name}"`
        try {
          const parsed = await parsePdfFile(file, bridgeUrl.value)
          newDocs.push({
            name: file.name,
            content: parsed.text,
            length: parsed.text.length,
          })
          lastParsedPdfInfo.value = {
            name: file.name,
            pages: parsed.pages,
            parser: parsed.parser === 'pymupdf' ? 'PyMuPDF' : 'PDF.js Client',
          }
        } catch (pdfErr) {
          const msg = pdfErr instanceof Error ? pdfErr.message : String(pdfErr)
          alert(`Không thể đọc tệp PDF "${file.name}":\n${msg}`)
        }
      } else {
        parsingStatusText.value = `Đang đọc "${file.name}"...`
        const text = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => resolve((e.target?.result as string) || '')
          reader.onerror = () => resolve('')
          reader.readAsText(file)
        })
        newDocs.push({
          name: file.name,
          content: text,
          length: text.length,
        })
      }
    }

    if (newDocs.length > 0) {
      docs.value = newDocs
      directTextInput.value = newDocs.map((d) => d.content).join('\n\n')
      if (newDocs[0]) {
        docEditorFilename.value = newDocs[0].name
      }

      // Tự động đồng bộ lên Python Bridge nếu đang kết nối
      if (engineMode.value === 'python' && isBridgeConnected.value) {
        try {
          await fetch(`${bridgeUrl.value}/api/upload`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ docs: newDocs }),
          })
        } catch (syncErr) {
          console.warn('Lỗi đồng bộ docs lên bridge:', syncErr)
        }
      }

      resetPipelineProgress()
    }
  } finally {
    isParsingFile.value = false
    parsingStatusText.value = ''
    input.value = ''
  }
}

function openDocEditorModal(): void {
  if (docs.value.length > 0) {
    docEditorText.value = docs.value.map((d) => d.content).join('\n\n')
    docEditorFilename.value = docs.value[0]?.name || 'tai-lieu-rag.txt'
  } else {
    docEditorText.value = directTextInput.value || SAMPLE_DOC_TEXT
    docEditorFilename.value = 'tai-lieu-rag.txt'
  }
  isDocEditorOpen.value = true
}

function closeDocEditorModal(): void {
  isDocEditorOpen.value = false
}

function resetEditorToSample(): void {
  docEditorText.value = SAMPLE_DOC_TEXT
  docEditorFilename.value = 'tai-lieu-mau-rag.txt'
}

function clearEditorText(): void {
  docEditorText.value = ''
}

function copyEditorText(): void {
  copy(docEditorText.value)
}

function saveAndApplyDoc(reindex = false): void {
  const trimmed = docEditorText.value.trim()
  if (!trimmed) return

  const filename = docEditorFilename.value.trim() || 'tai-lieu-tuy-chinh.txt'
  docs.value = [
    {
      name: filename,
      content: docEditorText.value,
      length: docEditorText.value.length,
    },
  ]
  directTextInput.value = docEditorText.value
  isDocEditorOpen.value = false
  resetPipelineProgress()

  if (reindex || autoIndexAfterSave.value) {
    buildIndex()
  }
}

function resetPipelineProgress(): void {
  currentStep.value = 1
  indexInfo.value = null
  chunks.value = []
  lastResult.value = null
  pcaData.value = null
}

// --- Lập chỉ mục (BUILD INDEX) ---
async function buildIndex(): Promise<void> {
  if (docs.value.length === 0) return
  isIndexing.value = true
  currentStep.value = 2

  try {
    if (engineMode.value === 'python' && isBridgeConnected.value) {
      await fetch(`${bridgeUrl.value}/api/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docs: docs.value.map((d) => ({ name: d.name, content: d.content })),
        }),
      })

      currentStep.value = 3

      const res = await fetch(`${bridgeUrl.value}/api/index`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategy: chunkStrategy.value,
          size: chunkSize.value,
          overlap: chunkOverlap.value,
          min_chars: minChunkChars.value,
          embedder: embedder.value,
        }),
      })

      if (!res.ok) {
        const errJson = await res.json()
        throw new Error(errJson.error || 'Lỗi khi lập chỉ mục bằng Python')
      }

      const data = await res.json()
      indexInfo.value = data.info
      chunks.value = data.chunks
      pcaData.value = data.pca
    } else {
      currentStep.value = 3
      clientPipeline.docs = docs.value
      const result = clientPipeline.index(
        chunkStrategy.value,
        chunkSize.value,
        chunkOverlap.value,
        minChunkChars.value,
      )
      indexInfo.value = result.info
      chunks.value = result.chunks
      const initialScores = Array.from({ length: result.chunks.length }, () => 0)
      pcaData.value = computeClientPca(clientPipeline.vectors, null, initialScores, [])
    }
  } catch (error) {
    console.error('Index failed:', error)
  } finally {
    isIndexing.value = false
  }
}

// --- Thực hiện Truy hồi (Retrieve / Ask) ---
async function runRetrieve(): Promise<void> {
  const query = userQuery.value.trim()
  if (!query || chunks.value.length === 0) return

  isRetrieving.value = true
  currentStep.value = 4

  const userMsgId = String(Date.now())
  chatHistory.value.push({
    id: userMsgId,
    role: 'user',
    content: query,
  })

  userQuery.value = ''
  scrollToBottom()

  try {
    let result: RetrieveResult

    if (engineMode.value === 'python' && isBridgeConnected.value) {
      const res = await fetch(`${bridgeUrl.value}/api/retrieve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          top_k: topK.value,
          min_score: minScore.value,
        }),
      })

      if (!res.ok) {
        const errJson = await res.json()
        throw new Error(errJson.error || 'Lỗi khi truy hồi từ Python')
      }

      result = await res.json()
    } else {
      result = clientPipeline.retrieve(query, topK.value, minScore.value)
    }

    lastResult.value = result
    if (result.pca) {
      pcaData.value = result.pca
    }

    currentStep.value = 5 // GENERATE hoàn thành (Retrieve-Only)

    let warningMsg = ''
    if (result.hits.length === 0) {
      warningMsg =
        'Không có đoạn nào vượt score threshold. Thử hạ threshold xuống để mở rộng tìm kiếm.'
    } else {
      const topScore = result.hits[0]?.score ?? 0
      if (topScore < 0.15) {
        warningMsg =
          '⚠ Max score rất thấp (< 0.15). Naive RAG vẫn trả về chunks dù có thể không liên quan — hệ thống không tự phát hiện câu hỏi ngoài phạm vi tài liệu.'
      } else if (result.margin < 0.03) {
        warningMsg =
          '⚠ Score giữa rank 1 và rank 2 gần bằng nhau (margin thấp) — việc truy hồi đang bị mơ hồ (ambiguous).'
      }
    }

    chatHistory.value.push({
      id: String(Date.now() + 1),
      role: 'assistant',
      content: result.extractive_answer,
      query,
      hits: result.hits,
      stats: result.stats,
      margin: result.margin,
      elapsed_ms: result.elapsed_ms,
      warning: warningMsg,
    })
  } catch (err) {
    console.error('Retrieve error:', err)
    chatHistory.value.push({
      id: String(Date.now() + 1),
      role: 'assistant',
      content: `Lỗi truy hồi: ${String(err)}`,
      warning: 'Gặp lỗi trong quá trình thực thi truy hồi.',
    })
  } finally {
    isRetrieving.value = false
    scrollToBottom()
  }
}

function askPreset(preset: string): void {
  userQuery.value = preset
  runRetrieve()
}

// --- Benchmark So sánh ---
async function runCompareBenchmark(): Promise<void> {
  isBenchmarking.value = true
  try {
    if (engineMode.value === 'python' && isBridgeConnected.value) {
      const res = await fetch(`${bridgeUrl.value}/api/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (res.ok) {
        benchmarkResult.value = await res.json()
      }
    } else {
      const sampleQueries = [
        'Cosine similarity đo cái gì?',
        'Vì sao phải cắt chunk chồng lấn?',
        'Nên chọn kích thước chunk bao nhiêu?',
        'Cách nấu phở bò',
      ]
      const strategies: ChunkStrategy[] = ['By Paragraph', 'Fixed Character', 'By Sentence']
      const rows = []

      for (const strat of strategies) {
        const testPipe = new ClientRagPipeline()
        testPipe.docs = docs.value
        const { info } = testPipe.index(strat, 500, 100, 80)
        const scores = []
        for (const q of sampleQueries) {
          const ret = testPipe.retrieve(q, 1, 0)
          scores.push(ret.hits[0]?.score ?? 0)
        }
        const signal = (scores[0]! + scores[1]! + scores[2]!) / 3
        const noise = Math.max(scores[3]!, 0.0001)
        const snr = Math.round((signal / noise) * 10) / 10

        rows.push({
          embedder: 'TF-IDF',
          strategy: strat,
          chunks: info.n_chunks,
          scores,
          snr,
        })
      }

      benchmarkResult.value = {
        queries: sampleQueries,
        rows,
        raw_report:
          'Báo cáo Benchmark so sánh tỉ lệ Tín hiệu / Nhiễu (Signal-to-Noise Ratio) giữa các chiến lược cắt chunk.',
      }
    }
  } catch (err) {
    console.error('Benchmark failed:', err)
  } finally {
    isBenchmarking.value = false
    activeTab.value = 'compare'
  }
}

function copyCurrentPrompt(): void {
  if (lastResult.value?.prompt) {
    const text = `=== SYSTEM PROMPT ===\n${lastResult.value.prompt.system}\n\n=== USER PROMPT ===\n${lastResult.value.prompt.user}`
    copy(text)
  }
}

// Khởi tạo ban đầu — Vào web là sử dụng được luôn
onMounted(async () => {
  const connected = await checkBridgeConnection()
  if (!connected || !indexInfo.value) {
    await buildIndex()
  }

  userQuery.value = 'RAG là gì?'
  await runRetrieve()
})
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary selection:bg-accent-coral/20">
    <!-- Top Bar Navigation (Rộng rãi toàn màn hình) -->
    <header
      class="border-b border-border-default/60 bg-bg-surface/90 backdrop-blur-md sticky top-0 z-40"
    >
      <div
        class="max-w-[1820px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4"
      >
        <!-- Logo & Breadcrumb -->
        <div class="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <RouterLink
            to="/"
            class="flex items-center gap-1.5 text-xs text-text-secondary hover:text-accent-coral transition-colors"
            title="Quay lại Trang chủ vibe.j2team.org"
            aria-label="Quay lại Trang chủ"
          >
            <Icon icon="lucide:arrow-left" class="size-4 shrink-0" />
            <span class="hidden sm:inline">Trang chủ</span>
          </RouterLink>
          <span class="text-border-default">/</span>
          <div class="flex items-center gap-1.5 sm:gap-2">
            <span class="text-accent-coral font-display font-bold text-sm tracking-widest">//</span>
            <span
              class="font-display font-bold text-base sm:text-lg text-text-primary tracking-tight whitespace-nowrap"
            >
              NAIVE RAG LAB
            </span>
          </div>
          <span
            class="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 border border-accent-amber/30 bg-accent-amber/10 text-accent-amber rounded-sm whitespace-nowrap"
          >
            <Icon icon="lucide:shield-check" class="size-3" />
            Retrieve-Only
          </span>
        </div>

        <!-- Right Side: Thông tin tác giả (Nguyên tắc 09) -->
        <div class="flex items-center gap-2">
          <div
            class="inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 border border-border-default/60 bg-bg-elevated/40 text-text-secondary rounded-sm whitespace-nowrap"
            title="Tác giả: Phạm Quốc Thái"
          >
            <Icon icon="lucide:user" class="size-3.5 text-accent-coral" />
            <span
              >Tác giả: <strong class="text-text-primary font-medium">Phạm Quốc Thái</strong></span
            >
          </div>
        </div>
      </div>
    </header>

    <!-- Modern Ribbon Stepper (Pipeline Flow - Dãn rộng thoải mái) -->
    <div class="border-b border-border-default/50 bg-bg-surface/50">
      <div class="max-w-[1820px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 items-center">
          <!-- Step 1: LOAD -->
          <div
            class="flex items-center gap-2.5 p-2 rounded-sm border transition-all"
            :class="
              currentStep >= 1
                ? 'border-accent-sky/40 bg-accent-sky/5 text-text-primary'
                : 'border-border-default/50 bg-bg-deep/40 text-text-dim'
            "
          >
            <div
              class="size-7 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0"
              :class="
                currentStep >= 1
                  ? 'bg-accent-sky text-bg-deep'
                  : 'bg-bg-elevated text-text-dim border border-border-default'
              "
            >
              1
            </div>
            <div class="truncate">
              <div
                class="text-xs font-display font-semibold truncate"
                :class="currentStep >= 1 ? 'text-text-primary' : 'text-text-dim'"
              >
                LOAD
              </div>
              <div class="text-[10px] text-text-secondary font-mono truncate">
                {{ docs.length }} docs ({{ totalDocChars }}c)
              </div>
            </div>
          </div>

          <!-- Step 2: CHUNK -->
          <div
            class="flex items-center gap-2.5 p-2 rounded-sm border transition-all"
            :class="
              currentStep >= 2
                ? 'border-accent-sky/40 bg-accent-sky/5 text-text-primary'
                : 'border-border-default/50 bg-bg-deep/40 text-text-dim'
            "
          >
            <div
              class="size-7 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0"
              :class="
                currentStep >= 2
                  ? 'bg-accent-sky text-bg-deep'
                  : 'bg-bg-elevated text-text-dim border border-border-default'
              "
            >
              2
            </div>
            <div class="truncate">
              <div
                class="text-xs font-display font-semibold truncate"
                :class="currentStep >= 2 ? 'text-text-primary' : 'text-text-dim'"
              >
                CHUNK
              </div>
              <div class="text-[10px] text-text-secondary font-mono truncate">
                {{ chunkSize }}c · {{ chunkOverlap }}c lap
              </div>
            </div>
          </div>

          <!-- Step 3: EMBED -->
          <div
            class="flex items-center gap-2.5 p-2 rounded-sm border transition-all"
            :class="
              currentStep >= 3
                ? 'border-accent-sky/40 bg-accent-sky/5 text-text-primary'
                : 'border-border-default/50 bg-bg-deep/40 text-text-dim'
            "
          >
            <div
              class="size-7 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0"
              :class="
                currentStep >= 3
                  ? 'bg-accent-sky text-bg-deep'
                  : 'bg-bg-elevated text-text-dim border border-border-default'
              "
            >
              3
            </div>
            <div class="truncate">
              <div
                class="text-xs font-display font-semibold truncate"
                :class="currentStep >= 3 ? 'text-text-primary' : 'text-text-dim'"
              >
                EMBED
              </div>
              <div class="text-[10px] text-text-secondary font-mono truncate">
                {{ embedder }} ({{ indexInfo?.dim ?? 0 }}d)
              </div>
            </div>
          </div>

          <!-- Step 4: RETRIEVE -->
          <div
            class="flex items-center gap-2.5 p-2 rounded-sm border transition-all"
            :class="
              currentStep >= 4
                ? 'border-accent-sky/40 bg-accent-sky/5 text-text-primary'
                : 'border-border-default/50 bg-bg-deep/40 text-text-dim'
            "
          >
            <div
              class="size-7 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0"
              :class="
                currentStep >= 4
                  ? 'bg-accent-sky text-bg-deep'
                  : 'bg-bg-elevated text-text-dim border border-border-default'
              "
            >
              4
            </div>
            <div class="truncate">
              <div
                class="text-xs font-display font-semibold truncate"
                :class="currentStep >= 4 ? 'text-text-primary' : 'text-text-dim'"
              >
                RETRIEVE
              </div>
              <div class="text-[10px] text-text-secondary font-mono truncate">
                Top-{{ topK }} · min {{ minScore }}
              </div>
            </div>
          </div>

          <!-- Step 5: GENERATE (Retrieve-Only) -->
          <div
            class="flex items-center gap-2.5 p-2 rounded-sm border col-span-2 sm:col-span-1 transition-all"
            :class="
              currentStep >= 5
                ? 'border-accent-amber/40 bg-accent-amber/5 text-text-primary'
                : 'border-border-default/50 bg-bg-deep/40 text-text-dim'
            "
          >
            <div
              class="size-7 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0"
              :class="
                currentStep >= 5
                  ? 'bg-accent-amber text-bg-deep'
                  : 'bg-bg-elevated text-text-dim border border-border-default'
              "
            >
              5
            </div>
            <div class="truncate">
              <div class="text-xs font-display font-semibold truncate text-accent-amber">
                GENERATE
              </div>
              <div class="text-[10px] text-text-secondary font-mono truncate">Retrieve-Only</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Workspace (DÃN RỘNG 3 CỘT THOẢI MÁI) -->
    <main class="max-w-[1820px] mx-auto px-4 sm:px-6 lg:px-8 py-5">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <!-- CỘT 1: CẤU HÌNH PIPELINE (3.3 cols trên desktop) -->
        <aside class="lg:col-span-4 xl:col-span-3 space-y-4">
          <!-- CARD 1: DOCUMENTS -->
          <div
            class="border border-border-default/80 bg-bg-surface/85 backdrop-blur-sm p-4 rounded-sm space-y-3 shadow-xs"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Icon icon="lucide:file-text" class="size-4 text-accent-coral" />
                <h2 class="font-display text-sm font-semibold text-text-primary">1 · Documents</h2>
              </div>
              <span
                class="text-[11px] font-mono px-2 py-0.5 bg-bg-elevated border border-border-default text-text-secondary rounded-sm"
              >
                {{ docs.length }} tệp · {{ totalDocChars }}c
              </span>
            </div>

            <!-- Upload & Sample Actions -->
            <div class="grid grid-cols-2 gap-2">
              <label
                class="flex items-center justify-center gap-2 py-2 px-3 border border-border-default bg-bg-deep/60 hover:bg-bg-elevated text-xs font-medium cursor-pointer hover:border-accent-coral/60 transition-all rounded-sm text-center"
                :class="isParsingFile ? 'opacity-60 pointer-events-none' : ''"
              >
                <Icon
                  :icon="isParsingFile ? 'lucide:loader-2' : 'lucide:upload'"
                  class="size-3.5 text-accent-sky"
                  :class="isParsingFile ? 'animate-spin' : ''"
                />
                <span>{{ isParsingFile ? 'Đang đọc...' : 'Nạp tệp...' }}</span>
                <input
                  type="file"
                  multiple
                  accept=".txt,.md,.markdown,.json,.py,.csv,.pdf,application/pdf"
                  class="hidden"
                  :disabled="isParsingFile"
                  @change="handleFileUpload"
                />
              </label>

              <button
                type="button"
                class="flex items-center justify-center gap-2 py-2 px-3 border border-border-default bg-bg-deep/60 hover:bg-bg-elevated text-xs font-medium hover:border-accent-amber/60 transition-all rounded-sm cursor-pointer"
                :disabled="isParsingFile"
                @click="loadSampleDocument"
              >
                <Icon icon="lucide:book-open" class="size-3.5 text-accent-amber" />
                <span>Tài liệu mẫu</span>
              </button>
            </div>

            <!-- Trạng thái phân tách PDF (PyMuPDF) -->
            <div
              v-if="isParsingFile"
              class="p-2 bg-accent-sky/10 border border-accent-sky/30 rounded-xs text-[11px] text-accent-sky flex items-center gap-2 animate-pulse"
            >
              <Icon icon="lucide:loader-2" class="size-3.5 animate-spin shrink-0" />
              <span class="truncate">{{ parsingStatusText }}</span>
            </div>

            <div
              v-else-if="lastParsedPdfInfo"
              class="p-2 bg-accent-coral/10 border border-accent-coral/30 rounded-xs text-[11px] text-text-primary flex items-center justify-between gap-1.5"
            >
              <div class="flex items-center gap-1.5 truncate">
                <Icon icon="lucide:file-check" class="size-3.5 text-accent-coral shrink-0" />
                <span class="truncate">
                  Đã đọc <b>{{ lastParsedPdfInfo.name }}</b> ({{ lastParsedPdfInfo.pages }} trang)
                  qua
                  <span class="text-accent-coral font-semibold">{{
                    lastParsedPdfInfo.parser
                  }}</span>
                </span>
              </div>
              <button
                type="button"
                class="text-text-dim hover:text-text-primary text-[10px] ml-1 shrink-0 cursor-pointer"
                title="Đóng thông báo"
                @click="lastParsedPdfInfo = null"
              >
                ✕
              </button>
            </div>

            <div
              class="text-[10px] text-text-dim flex items-center justify-between font-mono px-0.5"
            >
              <span>Hỗ trợ: .txt, .md, .pdf</span>
            </div>

            <!-- Xem & chỉnh sửa văn bản (Mở Modal To) -->
            <div>
              <button
                type="button"
                class="w-full py-2 px-3 border border-border-default/80 bg-bg-deep/60 hover:bg-bg-elevated text-xs text-text-secondary hover:text-text-primary hover:border-accent-coral/50 transition-all flex items-center justify-between rounded-sm cursor-pointer group shadow-xs"
                @click="openDocEditorModal"
              >
                <span class="flex items-center gap-2">
                  <Icon
                    icon="lucide:file-edit"
                    class="size-3.5 text-accent-coral group-hover:scale-110 transition-transform"
                  />
                  <span class="font-medium text-text-primary">Xem & chỉnh sửa văn bản</span>
                </span>
                <span
                  class="flex items-center gap-1.5 text-[11px] font-mono text-text-dim group-hover:text-accent-coral transition-colors"
                >
                  <span>Mở modal</span>
                  <Icon icon="lucide:maximize-2" class="size-3" />
                </span>
              </button>
            </div>
          </div>

          <!-- CARD 2: CHUNKING & EMBEDDING -->
          <div
            class="border border-border-default/80 bg-bg-surface/85 backdrop-blur-sm p-4 rounded-sm space-y-4 shadow-xs"
          >
            <div class="flex items-center gap-2">
              <Icon icon="lucide:scissors" class="size-4 text-accent-sky" />
              <h2 class="font-display text-sm font-semibold text-text-primary">
                2 · Chunking & Embedding
              </h2>
            </div>

            <!-- Chunk Strategy Tabs -->
            <div class="space-y-1.5">
              <label class="text-xs text-text-secondary flex justify-between">
                <span>Chiến lược phân đoạn:</span>
                <span class="text-accent-amber font-mono font-medium">{{ chunkStrategy }}</span>
              </label>
              <div
                class="grid grid-cols-3 gap-1 bg-bg-deep p-1 border border-border-default rounded-sm"
              >
                <button
                  type="button"
                  class="py-1 text-[11px] font-medium rounded-xs transition-colors cursor-pointer"
                  :class="
                    chunkStrategy === 'By Paragraph'
                      ? 'bg-accent-coral text-bg-deep font-semibold'
                      : 'text-text-secondary hover:text-text-primary'
                  "
                  @click="chunkStrategy = 'By Paragraph'"
                >
                  Đoạn văn
                </button>
                <button
                  type="button"
                  class="py-1 text-[11px] font-medium rounded-xs transition-colors cursor-pointer"
                  :class="
                    chunkStrategy === 'Fixed Character'
                      ? 'bg-accent-coral text-bg-deep font-semibold'
                      : 'text-text-secondary hover:text-text-primary'
                  "
                  @click="chunkStrategy = 'Fixed Character'"
                >
                  Ký tự
                </button>
                <button
                  type="button"
                  class="py-1 text-[11px] font-medium rounded-xs transition-colors cursor-pointer"
                  :class="
                    chunkStrategy === 'By Sentence'
                      ? 'bg-accent-coral text-bg-deep font-semibold'
                      : 'text-text-secondary hover:text-text-primary'
                  "
                  @click="chunkStrategy = 'By Sentence'"
                >
                  Theo câu
                </button>
              </div>
            </div>

            <!-- Chunk Sliders -->
            <div class="space-y-3 pt-1">
              <div class="space-y-1">
                <div class="flex justify-between text-xs">
                  <span class="text-text-secondary">Chunk size:</span>
                  <span class="text-accent-sky font-mono font-semibold">{{ chunkSize }} chars</span>
                </div>
                <input
                  v-model.number="chunkSize"
                  type="range"
                  min="100"
                  max="1500"
                  step="50"
                  class="w-full accent-accent-coral cursor-pointer"
                />
              </div>

              <div class="space-y-1">
                <div class="flex justify-between text-xs">
                  <span class="text-text-secondary">Chunk overlap:</span>
                  <span class="text-accent-sky font-mono font-semibold"
                    >{{ chunkOverlap }} chars</span
                  >
                </div>
                <input
                  v-model.number="chunkOverlap"
                  type="range"
                  min="0"
                  max="400"
                  step="20"
                  class="w-full accent-accent-coral cursor-pointer"
                />
              </div>

              <div class="space-y-1">
                <div class="flex justify-between text-xs">
                  <span class="text-text-secondary">Gộp đoạn ngắn:</span>
                  <span class="text-accent-sky font-mono font-semibold"
                    >{{ minChunkChars }} chars</span
                  >
                </div>
                <input
                  v-model.number="minChunkChars"
                  type="range"
                  min="0"
                  max="300"
                  step="20"
                  class="w-full accent-accent-coral cursor-pointer"
                />
                <p class="text-[10px] text-text-dim">
                  Đặt 0 để kiểm tra bẫy "orphan heading" (tiêu đề mồ côi ăn điểm cao vô lý).
                </p>
              </div>
            </div>

            <!-- Embedding Selection -->
            <div class="space-y-2 pt-2 border-t border-border-default/50">
              <label class="text-xs text-text-secondary">Mô hình Embedding:</label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  class="p-2 border rounded-sm text-left transition-all cursor-pointer"
                  :class="
                    embedder === 'TF-IDF'
                      ? 'border-accent-coral bg-accent-coral/10 text-accent-coral shadow-xs'
                      : 'border-border-default bg-bg-deep/50 text-text-secondary hover:border-border-default'
                  "
                  @click="embedder = 'TF-IDF'"
                >
                  <div class="font-bold text-xs font-mono">TF-IDF</div>
                  <div class="text-[10px] text-text-dim">Keyword Matching</div>
                </button>

                <button
                  type="button"
                  class="p-2 border rounded-sm text-left transition-all cursor-pointer"
                  :class="
                    embedder === 'Hashing'
                      ? 'border-accent-coral bg-accent-coral/10 text-accent-coral shadow-xs'
                      : 'border-border-default bg-bg-deep/50 text-text-secondary hover:border-border-default'
                  "
                  @click="embedder = 'Hashing'"
                >
                  <div class="font-bold text-xs font-mono">Hashing</div>
                  <div class="text-[10px] text-text-dim">512 dimensions</div>
                </button>
              </div>

              <p
                class="text-[11px] text-text-secondary bg-bg-deep/70 p-2.5 border border-border-default/60 rounded-sm"
              >
                {{ embedderExplanations[embedder] }}
              </p>
            </div>

            <!-- BUILD INDEX BUTTON -->
            <button
              type="button"
              class="w-full py-2.5 px-4 bg-gradient-to-r from-accent-coral to-accent-coral/90 text-bg-deep font-display font-bold text-sm tracking-wide flex items-center justify-center gap-2 hover:opacity-95 transition-all shadow-sm rounded-sm active:translate-y-0.5 cursor-pointer"
              :disabled="isIndexing"
              @click="buildIndex"
            >
              <Icon
                :icon="isIndexing ? 'lucide:refresh-cw' : 'lucide:play'"
                class="size-4"
                :class="{ 'animate-spin': isIndexing }"
              />
              <span>{{ isIndexing ? 'ĐANG LẬP CHỈ MỤC...' : '⟳ LẬP CHỈ MỤC (BUILD INDEX)' }}</span>
            </button>

            <!-- Thống kê sau khi index -->
            <div
              v-if="indexInfo"
              class="p-2.5 bg-bg-deep/80 border border-border-default text-xs font-mono rounded-sm space-y-1 text-text-secondary"
            >
              <div class="flex justify-between">
                <span>Số Chunks:</span>
                <span class="text-accent-sky font-bold">{{ indexInfo.n_chunks }} chunks</span>
              </div>
              <div class="flex justify-between">
                <span>Không gian Vector:</span>
                <span class="text-accent-amber font-bold">{{ indexInfo.dim }} dimensions</span>
              </div>
              <div class="flex justify-between text-[11px] text-text-dim">
                <span>Độ dài trung bình:</span>
                <span
                  >{{ indexInfo.avg_chars }} chars (min {{ indexInfo.min_chars }} - max
                  {{ indexInfo.max_chars }})</span
                >
              </div>
            </div>
          </div>

          <!-- CARD 3: RETRIEVAL & GENERATE PARAMS -->
          <div
            class="border border-border-default/80 bg-bg-surface/85 backdrop-blur-sm p-4 rounded-sm space-y-3 shadow-xs"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Icon icon="lucide:search" class="size-4 text-accent-amber" />
                <h2 class="font-display text-sm font-semibold text-text-primary">
                  3 · Tham số Truy hồi
                </h2>
              </div>
              <span
                class="text-[10px] font-mono px-2 py-0.5 bg-accent-amber/10 border border-accent-amber/30 text-accent-amber rounded-sm"
              >
                Retrieve-Only
              </span>
            </div>

            <div class="space-y-2.5">
              <div class="space-y-1">
                <div class="flex justify-between text-xs">
                  <span class="text-text-secondary">Top-K kết quả:</span>
                  <span class="text-accent-sky font-mono font-semibold">{{ topK }} chunks</span>
                </div>
                <input
                  v-model.number="topK"
                  type="range"
                  min="1"
                  max="12"
                  step="1"
                  class="w-full accent-accent-coral cursor-pointer"
                />
              </div>

              <div class="space-y-1">
                <div class="flex justify-between text-xs">
                  <span class="text-text-secondary">Ngưỡng điểm (Threshold):</span>
                  <span class="text-accent-sky font-mono font-semibold">{{
                    minScore.toFixed(2)
                  }}</span>
                </div>
                <input
                  v-model.number="minScore"
                  type="range"
                  min="0.0"
                  max="0.6"
                  step="0.02"
                  class="w-full accent-accent-coral cursor-pointer"
                />
              </div>
            </div>

            <div
              class="p-2.5 bg-bg-deep/60 border-l-2 border-accent-amber text-[11px] text-text-secondary leading-relaxed rounded-r-sm"
            >
              <span class="text-accent-amber font-semibold">Retrieve-Only:</span> Trích xuất trực
              tiếp các chunk đạt ngưỡng điểm từ kho vector mà không sinh từ LLM.
            </div>
          </div>
        </aside>

        <!-- CỘT 2: RETRIEVAL CONSOLE & CHAT TRÍCH XUẤT (ChatGPT-style UI) -->
        <section class="lg:col-span-8 xl:col-span-5 flex flex-col space-y-4">
          <div
            class="border border-border-default/80 bg-bg-surface/85 backdrop-blur-sm rounded-sm shadow-xs flex flex-col min-h-[640px] overflow-hidden"
          >
            <!-- Console Header -->
            <div
              class="p-3.5 border-b border-border-default bg-bg-deep/60 flex items-center justify-between"
            >
              <div class="flex items-center gap-2">
                <Icon icon="lucide:messages-square" class="size-4 text-accent-coral" />
                <span class="font-display text-xs font-semibold tracking-wide">
                  RETRIEVAL CONSOLE & HỎI ĐÁP
                </span>
                <span
                  class="text-[10px] font-mono px-2 py-0.5 bg-accent-sky/15 text-accent-sky border border-accent-sky/30 rounded-xs"
                >
                  {{ chatHistory.length }} tin nhắn
                </span>
              </div>

              <div class="flex items-center gap-2">
                <button
                  v-if="chatHistory.length > 0"
                  type="button"
                  class="text-[11px] font-mono text-text-dim hover:text-accent-coral flex items-center gap-1 transition-colors px-2 py-1 rounded-xs hover:bg-bg-elevated cursor-pointer"
                  title="Xoá toàn bộ lịch sử hỏi đáp"
                  @click="clearChatHistory"
                >
                  <Icon icon="lucide:trash-2" class="size-3.5" />
                  <span class="hidden sm:inline">Làm mới chat</span>
                </button>
              </div>
            </div>

            <!-- Messages Stream (ChatGPT-Style Message Feed with Auto-Scroll) -->
            <div
              ref="chatContainer"
              class="flex-1 p-4 overflow-y-auto space-y-5 max-h-[580px] custom-scrollbar relative scroll-smooth"
              @scroll="onChatScroll"
            >
              <!-- Empty State (Welcome Prompt Cards) -->
              <div
                v-if="chatHistory.length === 0"
                class="h-full min-h-[360px] flex flex-col items-center justify-center text-center p-6 space-y-4 my-auto animate-in fade-in"
              >
                <div
                  class="size-14 rounded-2xl bg-gradient-to-br from-accent-sky/20 to-accent-coral/10 border border-accent-sky/30 flex items-center justify-center text-accent-sky shadow-sm"
                >
                  <Icon icon="lucide:bot" class="size-7" />
                </div>
                <div class="space-y-1.5 max-w-sm">
                  <h3 class="font-display font-bold text-sm sm:text-base text-text-primary">
                    Trò chuyện ngữ cảnh Naive RAG
                  </h3>
                  <p class="text-xs text-text-secondary leading-relaxed">
                    Đặt câu hỏi về tài liệu. Hệ thống sẽ tính toán vector TF-IDF/Hashing và trích
                    xuất các đoạn văn bản tương đồng nhất.
                  </p>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md pt-1">
                  <button
                    type="button"
                    class="p-2.5 text-left border border-border-default/70 hover:border-accent-sky bg-bg-deep/50 hover:bg-bg-elevated/60 transition-all rounded-sm text-xs text-text-secondary hover:text-text-primary flex items-start gap-2 cursor-pointer group"
                    @click="askPreset('Cosine similarity đo cái gì?')"
                  >
                    <Icon
                      icon="lucide:sparkles"
                      class="size-3.5 text-accent-sky shrink-0 mt-0.5 group-hover:scale-110 transition-transform"
                    />
                    <span class="line-clamp-2">Cosine similarity đo cái gì?</span>
                  </button>
                  <button
                    type="button"
                    class="p-2.5 text-left border border-border-default/70 hover:border-accent-sky bg-bg-deep/50 hover:bg-bg-elevated/60 transition-all rounded-sm text-xs text-text-secondary hover:text-text-primary flex items-start gap-2 cursor-pointer group"
                    @click="askPreset('Vì sao phải cắt chunk chồng lấn?')"
                  >
                    <Icon
                      icon="lucide:sparkles"
                      class="size-3.5 text-accent-sky shrink-0 mt-0.5 group-hover:scale-110 transition-transform"
                    />
                    <span class="line-clamp-2">Vì sao cần cắt chunk chồng lấn?</span>
                  </button>
                  <button
                    type="button"
                    class="p-2.5 text-left border border-border-default/70 hover:border-accent-sky bg-bg-deep/50 hover:bg-bg-elevated/60 transition-all rounded-sm text-xs text-text-secondary hover:text-text-primary flex items-start gap-2 cursor-pointer group"
                    @click="askPreset('Chọn kích thước chunk thế nào?')"
                  >
                    <Icon
                      icon="lucide:sparkles"
                      class="size-3.5 text-accent-sky shrink-0 mt-0.5 group-hover:scale-110 transition-transform"
                    />
                    <span class="line-clamp-2">Chọn kích thước chunk thế nào?</span>
                  </button>
                  <button
                    type="button"
                    class="p-2.5 text-left border border-border-default/70 hover:border-accent-amber bg-bg-deep/50 hover:bg-bg-elevated/60 transition-all rounded-sm text-xs text-accent-amber hover:text-accent-amber flex items-start gap-2 cursor-pointer group"
                    @click="askPreset('Cách nấu phở bò (out-of-domain)')"
                  >
                    <Icon
                      icon="lucide:help-circle"
                      class="size-3.5 text-accent-amber shrink-0 mt-0.5 group-hover:scale-110 transition-transform"
                    />
                    <span class="line-clamp-2">Cách nấu phở bò (ngoài tài liệu)</span>
                  </button>
                </div>
              </div>

              <!-- Messages List -->
              <template v-else>
                <div v-for="msg in chatHistory" :key="msg.id" class="space-y-4">
                  <!-- USER MESSAGE (Aligned Right, ChatGPT-Style Bubble) -->
                  <div
                    v-if="msg.role === 'user'"
                    class="flex justify-end items-start gap-2.5 max-w-[85%] ml-auto group"
                  >
                    <div class="flex flex-col items-end space-y-1">
                      <div
                        class="bg-gradient-to-r from-accent-coral/15 to-accent-coral/25 border border-accent-coral/35 text-text-primary px-4 py-2.5 rounded-2xl rounded-tr-xs text-xs sm:text-sm font-medium leading-relaxed shadow-xs select-text"
                      >
                        {{ msg.content }}
                      </div>
                    </div>
                    <div
                      class="size-8 rounded-full bg-accent-coral/20 border border-accent-coral/40 text-accent-coral flex items-center justify-center shrink-0 text-xs font-semibold mt-0.5 shadow-xs"
                      title="Bạn"
                    >
                      <Icon icon="lucide:user" class="size-4" />
                    </div>
                  </div>

                  <!-- ASSISTANT MESSAGE (Aligned Left, ChatGPT-Style Bot Card) -->
                  <div
                    v-else
                    class="flex items-start gap-3 w-full group animate-in fade-in duration-150"
                  >
                    <!-- Bot Avatar -->
                    <div
                      class="size-8 rounded-full bg-accent-sky/15 border border-accent-sky/30 text-accent-sky flex items-center justify-center shrink-0 shadow-xs mt-0.5"
                      title="Naive RAG Assistant"
                    >
                      <Icon icon="lucide:bot" class="size-4.5" />
                    </div>

                    <!-- Content Container -->
                    <div
                      class="bg-bg-surface/90 border border-border-default/70 hover:border-border-default rounded-2xl rounded-tl-xs p-4 space-y-3.5 flex-1 shadow-xs transition-all"
                    >
                      <!-- Card Top Header -->
                      <div
                        class="flex items-center justify-between pb-2 border-b border-border-default/40"
                      >
                        <div class="flex items-center gap-2">
                          <span class="font-display font-semibold text-xs text-text-primary"
                            >Naive RAG</span
                          >
                          <span
                            class="px-1.5 py-0.2 bg-accent-amber/15 text-accent-amber border border-accent-amber/30 text-[9px] font-mono font-medium rounded-xs"
                          >
                            Retrieve-Only
                          </span>
                          <span v-if="msg.elapsed_ms" class="text-[10px] font-mono text-text-dim">
                            {{ msg.elapsed_ms }}ms
                          </span>
                        </div>

                        <div class="flex items-center gap-1">
                          <button
                            type="button"
                            class="p-1 text-text-dim hover:text-text-primary hover:bg-bg-elevated rounded-xs transition-colors cursor-pointer text-[10px] flex items-center gap-1"
                            title="Sao chép toàn bộ kết quả"
                            @click="copyMessageText(msg.id, msg.content)"
                          >
                            <Icon
                              :icon="copiedMessageId === msg.id ? 'lucide:check' : 'lucide:copy'"
                              class="size-3.5"
                              :class="copiedMessageId === msg.id ? 'text-accent-sky' : ''"
                            />
                            <span class="hidden sm:inline">
                              {{ copiedMessageId === msg.id ? 'Đã sao chép' : 'Sao chép' }}
                            </span>
                          </button>
                        </div>
                      </div>

                      <!-- Intro Summary Text -->
                      <div
                        v-if="msg.hits && msg.hits.length > 0"
                        class="text-xs text-text-secondary leading-relaxed"
                      >
                        Trích xuất được
                        <strong class="text-text-primary font-semibold"
                          >{{ msg.hits.length }} đoạn trích</strong
                        >
                        có điểm tương đồng cao nhất:
                      </div>

                      <!-- Citation Cards (Thẻ trích đoạn chuẩn UX) -->
                      <div v-if="msg.hits && msg.hits.length > 0" class="space-y-2.5">
                        <div
                          v-for="h in msg.hits"
                          :key="`card-${h.id}`"
                          class="border border-border-default/60 hover:border-accent-sky/60 bg-bg-deep/60 hover:bg-bg-deep/90 transition-all rounded-sm p-3 space-y-2 group/citation"
                        >
                          <!-- Citation Header -->
                          <div class="flex items-center justify-between text-xs font-mono">
                            <div class="flex items-center gap-2">
                              <span
                                class="px-1.5 py-0.5 bg-accent-sky/15 text-accent-sky font-bold text-[10px] rounded-xs border border-accent-sky/30"
                              >
                                [{{ h.rank }}]
                              </span>
                              <button
                                type="button"
                                class="font-bold text-accent-coral hover:underline cursor-pointer text-xs"
                                title="Rà chuột xem popup, click mở modal"
                                @click="openChunkModal(h.id)"
                                @mouseenter="onHoverBar($event, h.id, h.score)"
                                @mousemove="onMoveBar($event)"
                                @mouseleave="onLeaveBar"
                              >
                                Chunk #{{ h.id }}
                              </button>
                              <span
                                class="text-text-dim text-[10px] truncate max-w-[140px] sm:max-w-[200px]"
                              >
                                {{ h.source }}
                              </span>
                            </div>

                            <div class="flex items-center gap-1.5">
                              <span class="text-[10px] text-text-dim">Cosine:</span>
                              <span class="font-bold text-accent-sky text-xs">{{
                                h.score.toFixed(3)
                              }}</span>
                            </div>
                          </div>

                          <!-- Citation Quote Body -->
                          <div
                            class="p-2.5 bg-bg-surface/60 border-l-2 border-accent-sky rounded-r-xs font-mono text-xs leading-relaxed text-text-primary select-text whitespace-pre-wrap"
                          >
                            {{ h.text.trim() }}
                          </div>

                          <!-- Citation Footer Actions -->
                          <div
                            class="flex items-center justify-between pt-0.5 text-[10px] font-mono text-text-dim"
                          >
                            <span>{{ h.n_chars ?? h.text.length }} ký tự</span>
                            <div class="flex items-center gap-2">
                              <button
                                type="button"
                                class="text-accent-sky hover:underline flex items-center gap-1 cursor-pointer"
                                @click="openChunkModal(h.id)"
                              >
                                <Icon icon="lucide:maximize-2" class="size-3" />
                                <span>Chi tiết</span>
                              </button>
                              <span class="text-border-default">·</span>
                              <button
                                type="button"
                                class="hover:text-text-primary flex items-center gap-1 cursor-pointer"
                                @click="copyMessageText(`chunk-${h.id}`, h.text)"
                              >
                                <Icon
                                  :icon="
                                    copiedMessageId === `chunk-${h.id}`
                                      ? 'lucide:check'
                                      : 'lucide:copy'
                                  "
                                  class="size-3"
                                  :class="
                                    copiedMessageId === `chunk-${h.id}` ? 'text-accent-sky' : ''
                                  "
                                />
                                <span>{{
                                  copiedMessageId === `chunk-${h.id}` ? 'Đã chép' : 'Sao chép'
                                }}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <!-- Empty Results Warning -->
                      <div
                        v-else-if="!msg.hits || msg.hits.length === 0"
                        class="p-3 bg-accent-amber/10 border border-accent-amber/30 rounded-sm flex items-start gap-2.5 text-xs text-text-secondary"
                      >
                        <Icon
                          icon="lucide:alert-circle"
                          class="size-4 text-accent-amber shrink-0 mt-0.5"
                        />
                        <div class="space-y-1">
                          <div class="font-semibold text-text-primary">
                            Không tìm thấy đoạn trích phù hợp
                          </div>
                          <p class="text-[11px] leading-relaxed">
                            Không có đoạn văn bản nào đạt ngưỡng điểm (Threshold: {{ minScore }}).
                            Naive RAG không tìm được câu trả lời phù hợp trong tài liệu cho câu hỏi
                            này.
                          </p>
                        </div>
                      </div>

                      <!-- Warning Note (Nhận định Naive RAG) -->
                      <div
                        v-if="msg.warning"
                        class="p-3 bg-accent-coral/10 border-l-3 border-accent-coral rounded-r-sm space-y-1"
                      >
                        <div
                          class="font-semibold text-accent-coral text-xs flex items-center gap-1.5"
                        >
                          <Icon icon="lucide:alert-triangle" class="size-3.5" />
                          <span>Nhận định Naive RAG:</span>
                        </div>
                        <p class="text-text-primary text-[11px] leading-relaxed">
                          {{ msg.warning }}
                        </p>
                      </div>

                      <!-- Metrics Footnote -->
                      <div
                        v-if="msg.stats"
                        class="pt-2 border-t border-border-default/50 flex flex-wrap items-center gap-3 text-[10px] font-mono text-text-dim"
                      >
                        <span
                          >Max: <strong class="text-accent-sky">{{ msg.stats.max }}</strong></span
                        >
                        <span>Mean: {{ msg.stats.mean }}</span>
                        <span v-if="msg.margin !== undefined">Margin (1-2): {{ msg.margin }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Loading Thinking Bubble (When isRetrieving is true) -->
                <div
                  v-if="isRetrieving"
                  class="flex items-start gap-3 w-full animate-in fade-in duration-200"
                >
                  <div
                    class="size-8 rounded-full bg-accent-sky/15 border border-accent-sky/30 text-accent-sky flex items-center justify-center shrink-0 shadow-xs mt-0.5"
                  >
                    <Icon icon="lucide:bot" class="size-4.5 animate-pulse" />
                  </div>
                  <div
                    class="bg-bg-deep/80 border border-border-default/70 rounded-2xl rounded-tl-xs p-3.5 flex items-center gap-3 shadow-xs"
                  >
                    <div class="flex items-center gap-1">
                      <span
                        class="size-2 rounded-full bg-accent-sky animate-bounce [animation-delay:-0.3s]"
                      ></span>
                      <span
                        class="size-2 rounded-full bg-accent-sky animate-bounce [animation-delay:-0.15s]"
                      ></span>
                      <span class="size-2 rounded-full bg-accent-sky animate-bounce"></span>
                    </div>
                    <span class="text-xs text-text-secondary font-mono"
                      >Đang so khớp vector & trích xuất ngữ cảnh...</span
                    >
                  </div>
                </div>
              </template>

              <!-- Floating Scroll to Bottom Button -->
              <button
                v-if="isScrolledUp"
                type="button"
                class="sticky bottom-2 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-bg-surface/95 border border-accent-sky/60 text-accent-sky shadow-xl hover:bg-bg-elevated flex items-center gap-1.5 transition-all animate-in fade-in zoom-in cursor-pointer z-20 text-xs font-mono backdrop-blur-sm"
                title="Cuộn xuống tin nhắn mới nhất"
                @click="scrollToBottom(true)"
              >
                <Icon icon="lucide:arrow-down" class="size-3.5 animate-bounce" />
                <span>Xuống cuối</span>
              </button>
            </div>

            <!-- ChatGPT-style Query Input Bar & Quick Chips -->
            <div class="p-3.5 border-t border-border-default bg-bg-surface space-y-2.5">
              <!-- Rounded Input Container -->
              <form
                class="relative flex items-center bg-bg-deep border border-border-default hover:border-accent-coral/60 focus-within:border-accent-coral focus-within:ring-1 focus-within:ring-accent-coral/30 rounded-xl transition-all shadow-xs p-1"
                @submit.prevent="runRetrieve"
              >
                <input
                  v-model="userQuery"
                  type="text"
                  placeholder="Hỏi về tài liệu (vd: Cosine similarity đo cái gì?)..."
                  class="flex-1 px-3.5 py-2 bg-transparent text-xs sm:text-sm font-body text-text-primary placeholder:text-text-dim focus:outline-none"
                  :disabled="isRetrieving || chunks.length === 0"
                />
                <button
                  type="submit"
                  class="size-8 rounded-lg bg-accent-coral text-bg-deep font-semibold flex items-center justify-center hover:bg-accent-coral/90 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-xs shrink-0 active:scale-95"
                  :disabled="isRetrieving || !userQuery.trim() || chunks.length === 0"
                  title="Gửi câu hỏi (Enter)"
                >
                  <Icon
                    :icon="isRetrieving ? 'lucide:refresh-cw' : 'lucide:arrow-up'"
                    class="size-4"
                    :class="{ 'animate-spin': isRetrieving }"
                  />
                </button>
              </form>

              <!-- Quick Presets -->
              <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
                <span class="text-[10px] text-text-dim shrink-0 flex items-center gap-1 font-mono">
                  <Icon icon="lucide:sparkles" class="size-3 text-accent-sky" />
                  Gợi ý:
                </span>
                <button
                  type="button"
                  class="text-[11px] px-2.5 py-1 border border-border-default bg-bg-deep/60 hover:bg-bg-elevated hover:border-accent-coral/50 text-text-secondary hover:text-text-primary transition-all rounded-full cursor-pointer whitespace-nowrap shrink-0"
                  @click="askPreset('Cosine similarity đo cái gì?')"
                >
                  Cosine similarity đo gì?
                </button>
                <button
                  type="button"
                  class="text-[11px] px-2.5 py-1 border border-border-default bg-bg-deep/60 hover:bg-bg-elevated hover:border-accent-coral/50 text-text-secondary hover:text-text-primary transition-all rounded-full cursor-pointer whitespace-nowrap shrink-0"
                  @click="askPreset('Vì sao phải cắt chunk chồng lấn?')"
                >
                  Vì sao cần overlap?
                </button>
                <button
                  type="button"
                  class="text-[11px] px-2.5 py-1 border border-border-default bg-bg-deep/60 hover:bg-bg-elevated hover:border-accent-coral/50 text-text-secondary hover:text-text-primary transition-all rounded-full cursor-pointer whitespace-nowrap shrink-0"
                  @click="askPreset('Chọn kích thước chunk thế nào?')"
                >
                  Kích thước chunk?
                </button>
                <button
                  type="button"
                  class="text-[11px] px-2.5 py-1 border border-border-default bg-bg-deep/60 hover:bg-bg-elevated hover:border-accent-amber/50 text-accent-amber hover:text-accent-amber transition-all rounded-full cursor-pointer whitespace-nowrap shrink-0"
                  title="Thử câu hỏi ngoài tài liệu để xem sàn điểm"
                  @click="askPreset('Cách nấu phở bò (out-of-domain)')"
                >
                  Phở bò (ngoài tài liệu)
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- CỘT 3: VISUAL STUDIO & DEEP ANALYSIS (4.0 cols trên desktop) -->
        <section class="lg:col-span-12 xl:col-span-4 space-y-4">
          <div
            class="border border-border-default/80 bg-bg-surface/85 backdrop-blur-sm rounded-sm shadow-xs flex flex-col min-h-[640px] overflow-hidden"
          >
            <!-- Tab Navigation Header (Không còn thanh cuộn ngang thừa) -->
            <div
              class="grid grid-cols-5 border-b border-border-default bg-bg-deep/60 text-xs text-center select-none"
            >
              <button
                type="button"
                class="py-3 px-1 font-display font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer border-b-2"
                :class="
                  activeTab === 'scores'
                    ? 'border-accent-coral text-accent-coral bg-bg-surface'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                "
                @click="activeTab = 'scores'"
              >
                <Icon icon="lucide:bar-chart-2" class="size-3.5" />
                <span class="truncate">Scores</span>
              </button>

              <button
                type="button"
                class="py-3 px-1 font-display font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer border-b-2"
                :class="
                  activeTab === 'vectors'
                    ? 'border-accent-coral text-accent-coral bg-bg-surface'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                "
                @click="activeTab = 'vectors'"
              >
                <Icon icon="lucide:compass" class="size-3.5" />
                <span class="truncate">Vectors</span>
              </button>

              <button
                type="button"
                class="py-3 px-1 font-display font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer border-b-2"
                :class="
                  activeTab === 'chunks'
                    ? 'border-accent-coral text-accent-coral bg-bg-surface'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                "
                @click="activeTab = 'chunks'"
              >
                <Icon icon="lucide:layers" class="size-3.5" />
                <span class="truncate hidden sm:inline">Chunks ({{ chunks.length }})</span>
                <span class="truncate sm:hidden">Chunks</span>
              </button>

              <button
                type="button"
                class="py-3 px-1 font-display font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer border-b-2"
                :class="
                  activeTab === 'prompt'
                    ? 'border-accent-coral text-accent-coral bg-bg-surface'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                "
                @click="activeTab = 'prompt'"
              >
                <Icon icon="lucide:file-text" class="size-3.5" />
                <span class="truncate">Prompt</span>
              </button>

              <button
                type="button"
                class="py-3 px-1 font-display font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer border-b-2"
                :class="
                  activeTab === 'compare'
                    ? 'border-accent-coral text-accent-coral bg-bg-surface'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                "
                @click="activeTab = 'compare'"
              >
                <Icon icon="lucide:zap" class="size-3.5" />
                <span class="truncate">Compare</span>
              </button>
            </div>

            <!-- Tab Panels Content (Custom scrollbar mượt mà, không giật layout) -->
            <div class="p-4 flex-1 overflow-y-auto max-h-[580px] custom-scrollbar">
              <!-- TAB 1: SCORES SPECTRUM (Click mở Popup chuẩn UI/UX, không giật layout khi hover) -->
              <div v-if="activeTab === 'scores'" class="space-y-3">
                <div class="flex items-center justify-between text-xs">
                  <span class="text-text-secondary"
                    >Cosine Similarity theo thứ hạng (Bấm để xem chi tiết):</span
                  >
                  <span class="text-accent-coral font-mono text-[11px]"
                    >Threshold: {{ minScore }}</span
                  >
                </div>

                <div v-if="!lastResult" class="text-center py-16 text-text-dim text-xs">
                  Đang tải hoặc chưa có câu hỏi nào...
                </div>

                <div v-else class="space-y-2">
                  <div
                    v-for="(item, rankIdx) in sortedScores.slice(0, 16)"
                    :key="item.id"
                    class="p-2 border border-border-default/50 hover:border-accent-sky/60 bg-bg-deep/50 hover:bg-bg-elevated/60 transition-all rounded-xs cursor-pointer group space-y-1.5"
                    title="Rà chuột để xem nhanh, bấm để mở cửa sổ chi tiết"
                    @click="openChunkModal(item.id)"
                    @mouseenter="onHoverBar($event, item.id, item.score)"
                    @mousemove="onMoveBar($event)"
                    @mouseleave="onLeaveBar"
                  >
                    <div class="flex justify-between items-center font-mono text-[10px]">
                      <div class="flex items-center gap-1.5">
                        <span class="text-text-dim text-[9px] font-semibold"
                          >#{{ rankIdx + 1 }}</span
                        >
                        <span
                          class="font-bold"
                          :class="item.isTop ? 'text-accent-sky' : 'text-text-dim'"
                        >
                          Chunk #{{ item.id }}
                        </span>
                        <span
                          v-if="item.rank"
                          class="px-1.5 py-0.2 bg-accent-sky/15 text-accent-sky text-[9px] font-semibold rounded-xs border border-accent-sky/30"
                        >
                          Top-{{ item.rank }}
                        </span>
                      </div>
                      <div class="flex items-center gap-2">
                        <span class="text-text-primary font-medium">{{
                          item.score.toFixed(3)
                        }}</span>
                        <Icon
                          icon="lucide:arrow-right"
                          class="size-3 text-text-dim group-hover:text-accent-sky transition-colors"
                        />
                      </div>
                    </div>

                    <!-- Modern Bar with Threshold Line -->
                    <div
                      class="w-full bg-bg-deep h-3.5 relative overflow-hidden border border-border-default/40 rounded-xs"
                    >
                      <div
                        class="absolute top-0 bottom-0 w-0.5 bg-accent-coral z-10 shadow-xs"
                        :style="{
                          left: `${Math.min(100, (minScore / Math.max(0.01, lastResult.stats.max || 1)) * 100)}%`,
                        }"
                      ></div>
                      <div
                        class="h-full transition-all duration-300 rounded-xs"
                        :class="
                          item.isTop
                            ? 'bg-gradient-to-r from-accent-sky/80 to-accent-sky'
                            : 'bg-text-dim/30'
                        "
                        :style="{
                          width: `${Math.min(100, (item.score / Math.max(0.01, lastResult.stats.max || 1)) * 100)}%`,
                        }"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- TAB 2: VECTORS 3D / 2D (PCA) -->
              <div v-if="activeTab === 'vectors'" class="space-y-3.5">
                <!-- Header Controls: Title, Variance, Reset Camera, 2D/3D Switcher -->
                <div class="flex flex-wrap justify-between items-center gap-2">
                  <div class="flex items-center gap-2">
                    <span class="text-xs text-text-secondary font-medium">
                      {{
                        vectorViewMode === '3d'
                          ? 'Không gian vector 3D PCA'
                          : 'Không gian vector 2D PCA'
                      }}:
                    </span>
                    <span
                      class="text-[10px] font-mono px-2 py-0.5 bg-bg-deep border border-border-default text-text-dim rounded-xs"
                    >
                      Variance ~{{
                        Math.round(
                          (pcaData?.var_kept ?? (vectorViewMode === '3d' ? 0.82 : 0.65)) * 100,
                        )
                      }}%
                    </span>
                  </div>

                  <div class="flex items-center gap-2">
                    <!-- Nút Reset Camera 3D -->
                    <button
                      v-if="vectorViewMode === '3d'"
                      type="button"
                      class="px-2 py-0.5 text-[10px] font-mono text-text-secondary hover:text-text-primary border border-border-default hover:border-accent-sky/60 bg-bg-deep rounded-xs transition-colors flex items-center gap-1 cursor-pointer"
                      title="Khôi phục góc xoay và phóng to mặc định"
                      @click="resetCamera3D"
                    >
                      <Icon icon="lucide:rotate-ccw" class="size-2.5 text-accent-sky" />
                      <span>Reset góc nhìn</span>
                    </button>

                    <!-- Toggle 2D / 3D -->
                    <div
                      class="inline-flex p-0.5 bg-bg-deep border border-border-default rounded-xs font-mono text-[11px]"
                    >
                      <button
                        type="button"
                        class="px-2.5 py-0.5 rounded-2xs font-semibold transition-all cursor-pointer flex items-center gap-1"
                        :class="
                          vectorViewMode === '3d'
                            ? 'bg-accent-coral text-bg-deep shadow-xs'
                            : 'text-text-dim hover:text-text-primary'
                        "
                        @click="vectorViewMode = '3d'"
                      >
                        <Icon icon="lucide:box" class="size-3" />
                        <span>3D</span>
                      </button>
                      <button
                        type="button"
                        class="px-2.5 py-0.5 rounded-2xs font-semibold transition-all cursor-pointer flex items-center gap-1"
                        :class="
                          vectorViewMode === '2d'
                            ? 'bg-accent-sky text-bg-deep shadow-xs'
                            : 'text-text-dim hover:text-text-primary'
                        "
                        @click="vectorViewMode = '2d'"
                      >
                        <Icon icon="lucide:square" class="size-3" />
                        <span>2D</span>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Viewport Container (Drag to rotate, Scroll to zoom, Dblclick to reset) -->
                <div
                  class="w-full h-80 sm:h-96 bg-bg-deep border border-border-default relative flex items-center justify-center p-3 rounded-xs overflow-hidden select-none touch-none"
                  :class="
                    vectorViewMode === '3d'
                      ? isDragging3D
                        ? 'cursor-grabbing'
                        : 'cursor-grab'
                      : ''
                  "
                  @pointerdown="vectorViewMode === '3d' ? onStartDrag3D($event) : null"
                  @wheel="vectorViewMode === '3d' ? onWheel3D($event) : null"
                  @dblclick="vectorViewMode === '3d' ? resetCamera3D() : null"
                >
                  <!-- 3D Controls hint badge -->
                  <div
                    v-if="vectorViewMode === '3d'"
                    class="absolute bottom-2.5 left-2.5 z-10 px-2 py-1 bg-bg-surface/85 backdrop-blur-xs border border-border-default/60 rounded-xs text-[10px] font-mono text-text-dim pointer-events-none flex items-center gap-1.5 shadow-xs"
                  >
                    <Icon icon="lucide:move-3d" class="size-3 text-accent-sky" />
                    <span>Kéo để xoay 360° · Cuộn để zoom · Đúp chuột để reset</span>
                  </div>

                  <!-- 3D SVG VIEWPORT -->
                  <svg
                    v-if="vectorViewMode === '3d' && pcaData && pcaData.points.length > 0"
                    viewBox="-1.2 -1.2 2.4 2.4"
                    class="w-full h-full"
                  >
                    <!-- 3D Bounding Cube Wireframe -->
                    <g class="pointer-events-none opacity-30">
                      <line
                        v-for="(edge, eIdx) in projectedWireframe3D"
                        :key="`edge-${eIdx}`"
                        :x1="edge.x1"
                        :y1="edge.y1"
                        :x2="edge.x2"
                        :y2="edge.y2"
                        stroke="#4A6180"
                        stroke-width="0.008"
                        stroke-dasharray="0.04"
                      />
                    </g>

                    <!-- 3D Coordinate Axes (PC1, PC2, PC3) -->
                    <g class="pointer-events-none">
                      <!-- Trục PC1 (X - Coral) -->
                      <line
                        :x1="projectedAxes3D.origin.sx"
                        :y1="projectedAxes3D.origin.sy"
                        :x2="projectedAxes3D.x.sx"
                        :y2="projectedAxes3D.x.sy"
                        stroke="#FF6B6B"
                        stroke-width="0.012"
                        opacity="0.75"
                      />
                      <text
                        :x="projectedAxes3D.x.sx + 0.03"
                        :y="projectedAxes3D.x.sy + 0.03"
                        font-size="0.06"
                        fill="#FF6B6B"
                        font-family="monospace"
                        font-weight="bold"
                      >
                        PC1
                      </text>

                      <!-- Trục PC2 (Y - Sky) -->
                      <line
                        :x1="projectedAxes3D.origin.sx"
                        :y1="projectedAxes3D.origin.sy"
                        :x2="projectedAxes3D.y.sx"
                        :y2="projectedAxes3D.y.sy"
                        stroke="#38BDF8"
                        stroke-width="0.012"
                        opacity="0.75"
                      />
                      <text
                        :x="projectedAxes3D.y.sx + 0.03"
                        :y="projectedAxes3D.y.sy + 0.03"
                        font-size="0.06"
                        fill="#38BDF8"
                        font-family="monospace"
                        font-weight="bold"
                      >
                        PC2
                      </text>

                      <!-- Trục PC3 (Z - Amber) -->
                      <line
                        :x1="projectedAxes3D.origin.sx"
                        :y1="projectedAxes3D.origin.sy"
                        :x2="projectedAxes3D.z.sx"
                        :y2="projectedAxes3D.z.sy"
                        stroke="#FFB830"
                        stroke-width="0.012"
                        opacity="0.75"
                      />
                      <text
                        :x="projectedAxes3D.z.sx + 0.03"
                        :y="projectedAxes3D.z.sy + 0.03"
                        font-size="0.06"
                        fill="#FFB830"
                        font-family="monospace"
                        font-weight="bold"
                      >
                        PC3
                      </text>
                    </g>

                    <!-- 3D Lines connecting Query to Top-K Chunks -->
                    <g v-if="projectedQueryPoint3D" class="pointer-events-none">
                      <line
                        v-for="(link, lIdx) in projectedQueryLinks3D"
                        :key="`link3d-${lIdx}`"
                        :x1="link.x1"
                        :y1="link.y1"
                        :x2="link.x2"
                        :y2="link.y2"
                        stroke="#FFB830"
                        stroke-width="0.014"
                        stroke-dasharray="0.03"
                        opacity="0.8"
                      />
                    </g>

                    <!-- 3D Query Point with Pulse -->
                    <g v-if="projectedQueryPoint3D" class="pointer-events-none">
                      <circle
                        :cx="projectedQueryPoint3D.sx"
                        :cy="projectedQueryPoint3D.sy"
                        :r="0.08 * projectedQueryPoint3D.scale"
                        fill="#FFB830"
                        opacity="0.25"
                        class="animate-ping pointer-events-none"
                      />
                      <circle
                        :cx="projectedQueryPoint3D.sx"
                        :cy="projectedQueryPoint3D.sy"
                        :r="0.06 * projectedQueryPoint3D.scale"
                        fill="#FFB830"
                        stroke="#FFFFFF"
                        :stroke-width="0.012 * projectedQueryPoint3D.scale"
                      />
                      <text
                        :x="projectedQueryPoint3D.sx + 0.08 * projectedQueryPoint3D.scale"
                        :y="projectedQueryPoint3D.sy + 0.03 * projectedQueryPoint3D.scale"
                        :font-size="0.07 * projectedQueryPoint3D.scale"
                        fill="#FFB830"
                        font-family="monospace"
                        font-weight="bold"
                      >
                        Query
                      </text>
                    </g>

                    <!-- 3D Chunk Points (Depth-sorted, tương tác chính xác) -->
                    <g
                      v-for="pt in projectedChunkPoints3D"
                      :key="`pt3d-${pt.id}`"
                      class="cursor-pointer"
                      @click="openChunkModal(pt.id)"
                      @mouseenter="onHoverVector($event, pt.id)"
                      @mousemove="onMoveBar($event)"
                      @mouseleave="onLeaveBar"
                    >
                      <!-- Quầng sáng hiệu ứng khi hover -->
                      <circle
                        v-if="hoveredChunk?.id === pt.id"
                        :cx="pt.sx"
                        :cy="pt.sy"
                        :r="(pt.is_top ? 0.08 : 0.06) * pt.projScale"
                        :fill="pt.is_top ? '#38BDF8' : '#4A6180'"
                        opacity="0.35"
                        class="pointer-events-none"
                      />

                      <!-- Điểm vector 3D trực quan -->
                      <circle
                        :cx="pt.sx"
                        :cy="pt.sy"
                        :r="
                          (hoveredChunk?.id === pt.id
                            ? pt.is_top
                              ? 0.068
                              : 0.046
                            : pt.is_top
                              ? 0.055
                              : 0.035) * pt.projScale
                        "
                        :fill="pt.is_top ? '#38BDF8' : '#4A6180'"
                        :stroke="
                          hoveredChunk?.id === pt.id ? '#FFFFFF' : pt.is_top ? '#FFFFFF' : '#162232'
                        "
                        :stroke-width="(hoveredChunk?.id === pt.id ? 0.015 : 0.01) * pt.projScale"
                        :opacity="Math.max(0.45, Math.min(1.0, 0.9 - pt.depth * 0.25))"
                        class="transition-all duration-150"
                      />
                    </g>
                  </svg>

                  <!-- 2D SVG VIEWPORT (Chế độ phẳng truyền thống) -->
                  <svg
                    v-else-if="vectorViewMode === '2d' && pcaData && pcaData.points.length > 0"
                    viewBox="-1.2 -1.2 2.4 2.4"
                    class="w-full h-full"
                  >
                    <!-- Coordinate Grid -->
                    <line
                      x1="-1.1"
                      y1="0"
                      x2="1.1"
                      y2="0"
                      stroke="#253549"
                      stroke-dasharray="0.05"
                      stroke-width="0.01"
                      class="pointer-events-none"
                    />
                    <line
                      x1="0"
                      y1="-1.1"
                      x2="0"
                      y2="1.1"
                      stroke="#253549"
                      stroke-dasharray="0.05"
                      stroke-width="0.01"
                      class="pointer-events-none"
                    />

                    <!-- Links from query to top-k -->
                    <g v-if="pcaData.query" class="pointer-events-none">
                      <line
                        v-for="pt in pcaData.points.filter((p) => p.is_top)"
                        :key="`line-${pt.id}`"
                        :x1="pcaData.query.x"
                        :y1="pcaData.query.y"
                        :x2="pt.x"
                        :y2="pt.y"
                        stroke="#FFB830"
                        stroke-width="0.015"
                        stroke-dasharray="0.03"
                        opacity="0.8"
                        class="pointer-events-none"
                      />
                    </g>

                    <!-- Query Point with Pulse -->
                    <g v-if="pcaData.query" class="pointer-events-none">
                      <circle
                        :cx="pcaData.query.x"
                        :cy="pcaData.query.y"
                        r="0.09"
                        fill="#FFB830"
                        opacity="0.25"
                        class="animate-ping pointer-events-none"
                      />
                      <circle
                        :cx="pcaData.query.x"
                        :cy="pcaData.query.y"
                        r="0.06"
                        fill="#FFB830"
                        stroke="#FFFFFF"
                        stroke-width="0.015"
                        class="pointer-events-none"
                      />
                      <text
                        :x="pcaData.query.x + 0.08"
                        :y="pcaData.query.y + 0.03"
                        font-size="0.07"
                        fill="#FFB830"
                        font-family="monospace"
                        font-weight="bold"
                        class="pointer-events-none"
                      >
                        Query
                      </text>
                    </g>

                    <!-- Chunk Points 2D -->
                    <g
                      v-for="pt in pcaData.points"
                      :key="`pt2d-${pt.id}`"
                      class="cursor-pointer"
                      @click="openChunkModal(pt.id)"
                      @mouseenter="onHoverVector($event, pt.id)"
                      @mousemove="onMoveBar($event)"
                      @mouseleave="onLeaveBar"
                    >
                      <!-- Quầng sáng hiệu ứng khi hover -->
                      <circle
                        v-if="hoveredChunk?.id === pt.id"
                        :cx="pt.x"
                        :cy="pt.y"
                        :r="pt.is_top ? 0.08 : 0.06"
                        :fill="pt.is_top ? '#38BDF8' : '#4A6180'"
                        opacity="0.3"
                        class="pointer-events-none"
                      />

                      <!-- Điểm vector 2D -->
                      <circle
                        :cx="pt.x"
                        :cy="pt.y"
                        :r="
                          hoveredChunk?.id === pt.id
                            ? pt.is_top
                              ? 0.068
                              : 0.046
                            : pt.is_top
                              ? 0.055
                              : 0.035
                        "
                        :fill="pt.is_top ? '#38BDF8' : '#4A6180'"
                        :stroke="
                          hoveredChunk?.id === pt.id ? '#FFFFFF' : pt.is_top ? '#FFFFFF' : '#162232'
                        "
                        :stroke-width="hoveredChunk?.id === pt.id ? 0.015 : 0.01"
                        class="transition-all duration-150"
                      />
                    </g>
                  </svg>

                  <div v-else class="text-xs text-text-dim text-center">
                    Chưa có vector embedding. Hãy nhấn Lập chỉ mục.
                  </div>
                </div>

                <!-- Legend -->
                <div
                  class="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-[11px] font-mono text-text-secondary"
                >
                  <div class="flex items-center gap-1.5">
                    <span class="size-2.5 rounded-full bg-accent-amber"></span>
                    <span>Query Vector</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <span class="size-2.5 rounded-full bg-accent-sky"></span>
                    <span>Top-K Chunks</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <span class="size-2.5 rounded-full bg-[#4A6180]"></span>
                    <span>Khác</span>
                  </div>
                  <div
                    v-if="vectorViewMode === '3d'"
                    class="hidden md:flex items-center gap-2 text-text-dim border-l border-border-default/60 pl-4"
                  >
                    <span>Trục:</span>
                    <span class="text-[#FF6B6B]">PC1 (X)</span>
                    <span class="text-[#38BDF8]">PC2 (Y)</span>
                    <span class="text-[#FFB830]">PC3 (Z)</span>
                  </div>
                </div>
              </div>

              <!-- TAB 3: CHUNKS EXPLORER -->
              <div v-if="activeTab === 'chunks'" class="space-y-3">
                <div class="text-xs text-text-secondary flex justify-between items-center">
                  <div class="flex items-center gap-1.5">
                    <span>Toàn bộ {{ chunks.length }} chunks</span>
                    <span
                      v-if="lastResult && lastResult.all_scores.length"
                      class="text-[10px] font-mono px-1.5 py-0.2 bg-accent-sky/15 text-accent-sky rounded-xs border border-accent-sky/30"
                    >
                      Điểm giảm dần ↓
                    </span>
                  </div>
                  <span class="text-[11px] text-accent-sky font-mono">Tô màu sky = lọt Top-K</span>
                </div>

                <div class="space-y-2 pr-1">
                  <div
                    v-for="c in sortedChunks"
                    :key="c.id"
                    class="p-2.5 border text-xs space-y-1 rounded-sm transition-all cursor-pointer hover:border-accent-sky"
                    :class="
                      lastResult?.hits.some((h) => h.id === c.id)
                        ? 'border-accent-sky/70 bg-accent-sky/5 shadow-xs'
                        : 'border-border-default/60 bg-bg-deep/60 hover:bg-bg-elevated/40'
                    "
                    title="Rà chuột để xem nhanh, bấm để mở cửa sổ chi tiết"
                    @click="openChunkModal(c.id)"
                    @mouseenter="onHoverChunk($event, c)"
                    @mousemove="onMoveBar($event)"
                    @mouseleave="onLeaveBar"
                  >
                    <div class="flex items-center justify-between font-mono text-[11px]">
                      <div class="flex items-center gap-1.5">
                        <span class="font-bold text-accent-coral">Chunk #{{ c.id }}</span>
                        <span
                          v-if="lastResult?.hits.some((h) => h.id === c.id)"
                          class="px-1.5 py-0.2 bg-accent-sky/20 text-accent-sky font-semibold rounded-xs border border-accent-sky/30 text-[10px]"
                        >
                          Top-{{ lastResult.hits.find((h) => h.id === c.id)?.rank }}
                        </span>
                      </div>
                      <div class="flex items-center gap-2">
                        <span
                          v-if="lastResult && lastResult.all_scores[c.id] !== undefined"
                          class="font-medium"
                          :class="
                            lastResult?.hits.some((h) => h.id === c.id)
                              ? 'text-accent-sky font-bold'
                              : 'text-text-dim'
                          "
                        >
                          score {{ lastResult.all_scores[c.id]?.toFixed(3) }}
                        </span>
                        <span class="text-text-dim">{{ c.n_chars }} ký tự</span>
                      </div>
                    </div>
                    <p
                      class="text-text-secondary font-mono text-[11px] leading-relaxed line-clamp-2"
                    >
                      {{ c.text }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- TAB 4: AUGMENTED PROMPT -->
              <div v-if="activeTab === 'prompt'" class="space-y-3">
                <div class="flex items-center justify-between text-xs">
                  <span class="text-text-secondary"
                    >Cấu trúc Prompt được lắp ghép (Augmented Context):</span
                  >
                  <button
                    type="button"
                    class="text-accent-coral flex items-center gap-1 hover:underline text-[11px] cursor-pointer"
                    @click="copyCurrentPrompt"
                  >
                    <Icon :icon="copied ? 'lucide:check' : 'lucide:copy'" class="size-3" />
                    <span>{{ copied ? 'Đã chép!' : 'Sao chép prompt' }}</span>
                  </button>
                </div>

                <div v-if="!lastResult" class="text-center py-16 text-text-dim text-xs">
                  Chưa có dữ liệu prompt.
                </div>

                <div v-else class="space-y-3 font-mono text-xs">
                  <div class="space-y-1">
                    <span class="text-accent-sky font-bold text-[10px]">SYSTEM PROMPT</span>
                    <pre
                      class="p-2.5 bg-bg-deep border border-border-default whitespace-pre-wrap text-[10px] text-text-secondary rounded-xs custom-scrollbar max-h-36 overflow-y-auto"
                      >{{ lastResult.prompt.system }}</pre
                    >
                  </div>

                  <div class="space-y-1">
                    <span class="text-accent-amber font-bold text-[10px]"
                      >USER PROMPT (CONTEXT + QUERY)</span
                    >
                    <pre
                      class="p-2.5 bg-bg-deep border border-border-default whitespace-pre-wrap text-[10px] text-text-secondary max-h-60 overflow-y-auto rounded-xs custom-scrollbar"
                      >{{ lastResult.prompt.user }}</pre
                    >
                  </div>

                  <div
                    class="p-2.5 bg-bg-elevated border border-border-default text-[10px] text-text-dim rounded-xs"
                  >
                    Ước tính token: ~{{ lastResult.prompt.tokens_est }} tokens.
                  </div>
                </div>
              </div>

              <!-- TAB 5: BENCHMARK -->
              <div v-if="activeTab === 'compare'" class="space-y-3">
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="font-display font-semibold text-xs text-text-primary">
                      Benchmark: 3 Chiến lược Chunking
                    </h3>
                    <p class="text-[11px] text-text-secondary">
                      Đo lường tỉ lệ Tín hiệu / Nhiễu (Signal-to-Noise Ratio - SNR).
                    </p>
                  </div>
                  <button
                    type="button"
                    class="py-1.5 px-3 bg-accent-sky text-bg-deep font-semibold text-xs rounded-sm hover:opacity-90 transition-all flex items-center gap-1 cursor-pointer"
                    :disabled="isBenchmarking"
                    @click="runCompareBenchmark"
                  >
                    <Icon
                      :icon="isBenchmarking ? 'lucide:refresh-cw' : 'lucide:zap'"
                      class="size-3.5"
                      :class="{ 'animate-spin': isBenchmarking }"
                    />
                    <span>{{ isBenchmarking ? 'Đang chạy...' : 'Chạy so sánh' }}</span>
                  </button>
                </div>

                <div v-if="benchmarkResult" class="space-y-2 font-mono text-xs">
                  <div
                    class="overflow-x-auto border border-border-default rounded-xs custom-scrollbar"
                  >
                    <table class="w-full text-left text-[11px] min-w-[380px]">
                      <thead class="bg-bg-deep border-b border-border-default text-text-dim">
                        <tr>
                          <th class="p-2">Chiến lược</th>
                          <th class="p-2">Chunks</th>
                          <th class="p-2">Signal (Avg Q1-Q3)</th>
                          <th class="p-2">Noise (Q4)</th>
                          <th class="p-2 text-accent-coral">SNR</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="(row, rIdx) in benchmarkResult.rows"
                          :key="rIdx"
                          class="border-b border-border-default/40 hover:bg-bg-elevated/40"
                        >
                          <td class="p-2 font-semibold text-text-primary">{{ row.strategy }}</td>
                          <td class="p-2 text-text-dim">{{ row.chunks }}</td>
                          <td class="p-2 text-accent-sky">
                            {{
                              ((row.scores[0]! + row.scores[1]! + row.scores[2]!) / 3).toFixed(3)
                            }}
                          </td>
                          <td class="p-2 text-accent-amber">{{ row.scores[3]?.toFixed(3) }}</td>
                          <td class="p-2 font-bold text-accent-coral">{{ row.snr }}×</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>

    <!-- Floating Hover Popup (Hiển thị nổi khi hover chuột, không giật layout) -->
    <Teleport to="body">
      <div
        v-if="hoveredChunk && !selectedChunk"
        class="fixed z-50 pointer-events-none transition-opacity duration-150 animate-in fade-in"
        :style="{ left: `${hoverPos.x}px`, top: `${hoverPos.y}px` }"
      >
        <div
          class="w-80 md:w-96 max-w-[calc(100vw-24px)] pointer-events-none select-none bg-bg-surface/95 backdrop-blur-md border border-accent-sky/60 rounded-sm shadow-2xl p-3 space-y-2 text-xs text-text-primary"
        >
          <!-- Popup Header -->
          <div
            class="flex items-center justify-between border-b border-border-default/60 pb-1.5 font-mono text-[11px]"
          >
            <div class="flex items-center gap-1.5">
              <span class="font-bold text-accent-coral">Chunk #{{ hoveredChunk.id }}</span>
              <span
                v-if="hoveredChunk.rank"
                class="px-1.5 py-0.2 bg-accent-sky/20 text-accent-sky font-semibold rounded-xs border border-accent-sky/30 text-[10px]"
              >
                Top-{{ hoveredChunk.rank }}
              </span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-text-dim text-[10px]">Score:</span>
              <span class="font-bold text-accent-sky">{{ hoveredChunk.score.toFixed(3) }}</span>
            </div>
          </div>

          <!-- Popup Body: Chunk snippet -->
          <div
            class="p-2.5 bg-bg-deep/90 border border-border-default/60 rounded-xs font-mono text-[11px] leading-relaxed text-text-secondary max-h-36 overflow-hidden line-clamp-5 select-none"
          >
            {{ hoveredChunk.text }}
          </div>

          <!-- Popup Footer hint -->
          <div class="flex items-center justify-between text-[10px] text-text-dim font-mono pt-0.5">
            <span>{{ hoveredChunk.chars }} ký tự</span>
            <span class="flex items-center gap-1 text-accent-amber font-semibold">
              <Icon icon="lucide:mouse-pointer-click" class="size-3" />
              <span>Bấm để xem đầy đủ</span>
            </span>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal Popup Chi tiết Chunk (Chuẩn UI/UX, Backdrop Blur, Esc / Click outside to close) -->
    <Teleport to="body">
      <div
        v-if="selectedChunk"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-deep/80 backdrop-blur-md transition-all duration-200"
        @click.self="closeChunkModal"
      >
        <div
          class="w-full max-w-2xl bg-bg-surface border border-border-default shadow-2xl rounded-sm overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150"
        >
          <!-- Modal Header -->
          <div
            class="p-4 border-b border-border-default bg-bg-elevated/40 flex items-center justify-between"
          >
            <div class="flex items-center gap-2.5">
              <Icon icon="lucide:file-text" class="size-4.5 text-accent-coral" />
              <div>
                <h3
                  class="font-display font-semibold text-sm text-text-primary flex items-center gap-2"
                >
                  <span>Chi tiết Chunk #{{ selectedChunk.id }}</span>
                  <span
                    v-if="selectedChunkRank"
                    class="px-2 py-0.5 bg-accent-sky/15 text-accent-sky text-[10px] font-mono font-bold rounded-xs border border-accent-sky/40"
                  >
                    ★ Top-{{ selectedChunkRank }}
                  </span>
                </h3>
                <div class="text-[11px] font-mono text-text-dim">
                  Nguồn: {{ selectedChunk.source || 'tài liệu' }}
                </div>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <div
                v-if="selectedChunkScore !== null"
                class="px-2.5 py-1 bg-bg-deep border border-border-default font-mono text-xs rounded-xs flex items-center gap-1.5"
              >
                <span class="text-text-dim text-[10px]">Cosine Score:</span>
                <span class="text-accent-sky font-bold">{{ selectedChunkScore.toFixed(4) }}</span>
              </div>

              <button
                type="button"
                class="size-8 rounded-sm border border-border-default hover:border-accent-coral hover:bg-bg-elevated flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                title="Đóng cửa sổ (Esc)"
                @click="closeChunkModal"
              >
                <Icon icon="lucide:x" class="size-4" />
              </button>
            </div>
          </div>

          <!-- Metadata Strip -->
          <div
            class="px-4 py-2 border-b border-border-default/60 bg-bg-deep/50 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono text-text-dim"
          >
            <span
              >Độ dài: <strong class="text-text-primary">{{ selectedChunk.n_chars }}</strong> ký
              tự</span
            >
            <span
              >Số từ:
              <strong class="text-text-primary">{{
                selectedChunk.n_words ?? selectedChunk.text.split(/\s+/).length
              }}</strong>
              từ</span
            >
            <span v-if="selectedChunk.start !== undefined"
              >Vị trí:
              <strong class="text-text-primary"
                >{{ selectedChunk.start }} → {{ selectedChunk.end }}</strong
              ></span
            >
          </div>

          <!-- Modal Body: Văn bản đầy đủ -->
          <div class="p-4 flex-1 overflow-y-auto custom-scrollbar bg-bg-deep/30">
            <div
              class="p-4 bg-bg-deep border border-border-default rounded-xs font-mono text-xs leading-relaxed text-text-primary whitespace-pre-wrap select-text"
            >
              {{ selectedChunk.text }}
            </div>
          </div>

          <!-- Modal Footer -->
          <div
            class="p-3.5 border-t border-border-default bg-bg-elevated/30 flex items-center justify-between"
          >
            <span class="text-[11px] text-text-dim font-mono"
              >Nhấn Esc hoặc click ra ngoài để đóng</span
            >
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="px-3.5 py-1.5 border border-border-default hover:border-accent-sky text-xs text-text-primary rounded-sm transition-all flex items-center gap-1.5 cursor-pointer bg-bg-deep"
                @click="copySelectedChunkText"
              >
                <Icon
                  :icon="copied ? 'lucide:check' : 'lucide:copy'"
                  class="size-3.5"
                  :class="copied ? 'text-accent-sky' : ''"
                />
                <span>{{ copied ? 'Đã sao chép!' : 'Sao chép đoạn văn' }}</span>
              </button>
              <button
                type="button"
                class="px-4 py-1.5 bg-accent-coral text-bg-deep font-semibold text-xs rounded-sm hover:opacity-90 transition-all cursor-pointer"
                @click="closeChunkModal"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ========================================================================= -->
    <!-- MODAL TO: XEM VÀ CHỈNH SỬA VĂN BẢN (KNOWLEDGE BASE EDITOR) -->
    <!-- ========================================================================= -->
    <Teleport to="body">
      <div
        v-if="isDocEditorOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-bg-deep/85 backdrop-blur-md transition-all duration-200"
        @click.self="closeDocEditorModal"
      >
        <div
          class="w-full max-w-5xl bg-bg-surface border border-border-default shadow-2xl rounded-sm overflow-hidden flex flex-col h-[85vh] max-h-[850px] animate-in fade-in zoom-in-95 duration-150"
        >
          <!-- Modal Header -->
          <div
            class="p-4 border-b border-border-default bg-bg-elevated/40 flex items-center justify-between gap-3"
          >
            <div class="flex items-center gap-3 min-w-0">
              <div
                class="size-9 rounded-sm bg-accent-coral/10 border border-accent-coral/30 flex items-center justify-center shrink-0"
              >
                <Icon icon="lucide:file-edit" class="size-5 text-accent-coral" />
              </div>
              <div class="min-w-0">
                <h3
                  class="font-display font-semibold text-sm sm:text-base text-text-primary truncate"
                >
                  Xem & Chỉnh sửa Văn bản Nguồn (Knowledge Base)
                </h3>
                <div class="flex items-center gap-2 text-[11px] font-mono text-text-dim mt-0.5">
                  <span>Tên tệp:</span>
                  <input
                    v-model="docEditorFilename"
                    type="text"
                    placeholder="tai-lieu.txt"
                    class="px-2 py-0.5 bg-bg-deep border border-border-default rounded-xs text-text-primary text-[11px] font-mono focus:border-accent-coral outline-none w-44 sm:w-60"
                  />
                </div>
              </div>
            </div>

            <!-- Header Stats & Close Button -->
            <div class="flex items-center gap-2 shrink-0">
              <div class="hidden md:flex items-center gap-2 font-mono text-[11px]">
                <span
                  class="px-2.5 py-1 bg-bg-deep border border-border-default text-text-secondary rounded-xs"
                >
                  <strong class="text-text-primary">{{
                    docEditorStats.chars.toLocaleString()
                  }}</strong>
                  ký tự
                </span>
                <span
                  class="px-2.5 py-1 bg-bg-deep border border-border-default text-text-secondary rounded-xs"
                >
                  <strong class="text-text-primary">{{
                    docEditorStats.words.toLocaleString()
                  }}</strong>
                  từ
                </span>
                <span
                  class="px-2.5 py-1 bg-bg-deep border border-border-default text-text-secondary rounded-xs"
                >
                  <strong class="text-text-primary">{{
                    docEditorStats.lines.toLocaleString()
                  }}</strong>
                  dòng
                </span>
              </div>

              <button
                type="button"
                class="size-8 rounded-sm border border-border-default hover:border-accent-coral hover:bg-bg-elevated flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                title="Đóng cửa sổ (Esc)"
                @click="closeDocEditorModal"
              >
                <Icon icon="lucide:x" class="size-4" />
              </button>
            </div>
          </div>

          <!-- Toolbar strip -->
          <div
            class="px-4 py-2 border-b border-border-default/60 bg-bg-deep/50 flex flex-wrap items-center justify-between gap-2 text-xs"
          >
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="px-2.5 py-1 border border-border-default hover:border-accent-amber/60 bg-bg-surface hover:bg-bg-elevated text-text-secondary hover:text-text-primary rounded-xs transition-colors flex items-center gap-1.5 cursor-pointer text-xs"
                @click="resetEditorToSample"
              >
                <Icon icon="lucide:rotate-ccw" class="size-3 text-accent-amber" />
                <span>Nạp lại tài liệu mẫu</span>
              </button>

              <button
                type="button"
                class="px-2.5 py-1 border border-border-default hover:border-accent-sky/60 bg-bg-surface hover:bg-bg-elevated text-text-secondary hover:text-text-primary rounded-xs transition-colors flex items-center gap-1.5 cursor-pointer text-xs"
                @click="copyEditorText"
              >
                <Icon
                  :icon="copied ? 'lucide:check' : 'lucide:copy'"
                  class="size-3"
                  :class="copied ? 'text-accent-sky' : 'text-text-dim'"
                />
                <span>{{ copied ? 'Đã sao chép!' : 'Sao chép' }}</span>
              </button>

              <button
                type="button"
                class="px-2.5 py-1 border border-border-default hover:border-rose-500/60 bg-bg-surface hover:bg-bg-elevated text-text-secondary hover:text-rose-400 rounded-xs transition-colors flex items-center gap-1.5 cursor-pointer text-xs"
                @click="clearEditorText"
              >
                <Icon icon="lucide:trash-2" class="size-3 text-text-dim" />
                <span>Xóa trắng</span>
              </button>
            </div>

            <!-- Auto-index checkbox toggle -->
            <label
              class="flex items-center gap-2 text-text-secondary font-mono text-[11px] cursor-pointer select-none"
            >
              <input
                v-model="autoIndexAfterSave"
                type="checkbox"
                class="rounded-xs accent-accent-coral cursor-pointer"
              />
              <span>Tự động Lập chỉ mục (Index) ngay sau khi lưu</span>
            </label>
          </div>

          <!-- Modal Body: Large Textarea -->
          <div class="p-4 flex-1 min-h-0 bg-bg-deep/30 flex flex-col">
            <textarea
              v-model="docEditorText"
              class="w-full flex-1 p-4 bg-bg-deep border border-border-default rounded-xs font-mono text-xs leading-relaxed text-text-primary placeholder:text-text-dim/60 focus:outline-none focus:border-accent-coral/80 transition-colors custom-scrollbar resize-none select-text"
              placeholder="Dán hoặc nhập toàn bộ nội dung văn bản nguồn tại đây. Hệ thống RAG sẽ tiến hành phân đoạn (chunking), tạo embedding và tính điểm cosine similarity dựa trên văn bản này..."
              spellcheck="false"
            ></textarea>
          </div>

          <!-- Modal Footer -->
          <div
            class="p-3.5 border-t border-border-default bg-bg-elevated/30 flex flex-wrap items-center justify-between gap-3"
          >
            <!-- Keyboard shortcut hint -->
            <div class="flex items-center gap-2 text-[11px] text-text-dim font-mono">
              <Icon icon="lucide:keyboard" class="size-3.5 text-accent-sky shrink-0" />
              <span>
                Phím tắt:
                <kbd
                  class="px-1.5 py-0.5 bg-bg-deep border border-border-default rounded-xs text-text-secondary"
                  >Ctrl + Enter</kbd
                >
                để lưu nhanh ·
                <kbd
                  class="px-1.5 py-0.5 bg-bg-deep border border-border-default rounded-xs text-text-secondary"
                  >Esc</kbd
                >
                để đóng
              </span>
            </div>

            <!-- Action buttons -->
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="px-4 py-1.5 border border-border-default hover:border-border-default/80 text-xs text-text-secondary hover:text-text-primary rounded-sm transition-all cursor-pointer bg-bg-deep"
                @click="closeDocEditorModal"
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                class="px-4 py-1.5 border border-accent-sky/50 bg-accent-sky/10 hover:bg-accent-sky/20 text-accent-sky font-medium text-xs rounded-sm transition-all flex items-center gap-1.5 cursor-pointer"
                @click="saveAndApplyDoc(false)"
              >
                <Icon icon="lucide:save" class="size-3.5" />
                <span>Lưu văn bản</span>
              </button>

              <button
                type="button"
                class="px-4 py-1.5 bg-accent-coral text-bg-deep font-semibold text-xs rounded-sm hover:opacity-90 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                @click="saveAndApplyDoc(true)"
              >
                <Icon icon="lucide:play" class="size-3.5 fill-current" />
                <span>Lưu & Lập chỉ mục ngay</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
/* Custom Scrollbar mảnh mai, chuẩn Dark Theme */
.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #253549;
  border-radius: 9999px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #38bdf8;
}

/* Firefox scrollbar */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #253549 transparent;
}

/* Ẩn triệt để thanh cuộn ngang */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
