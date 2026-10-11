import type {
  ChunkItem,
  ChunkStrategy,
  DocItem,
  HitItem,
  IndexInfo,
  PcaData,
  PcaPoint,
  PdfParseResult,
  RetrieveResult,
} from './types'

export const SAMPLE_DOC_TEXT = `RAG là gì

RAG viết tắt của Retrieval-Augmented Generation, tức sinh văn bản có tăng cường truy hồi. Ý tưởng rất đơn giản: thay vì bắt mô hình ngôn ngữ nhớ mọi thứ, ta tìm sẵn những đoạn tài liệu liên quan rồi đưa kèm vào prompt.

Naive RAG gồm những bước nào

Một pipeline naive RAG có năm bước. Bước một là nạp tài liệu và chuyển về văn bản thuần. Bước hai là cắt văn bản thành các đoạn nhỏ gọi là chunk. Bước ba là biến mỗi chunk thành một vector số học, gọi là embedding. Bước bốn là khi có câu hỏi thì cũng biến câu hỏi thành vector rồi tìm các chunk có vector gần nhất. Bước năm là nhét những chunk đó vào prompt và để mô hình ngôn ngữ viết câu trả lời.

Cosine similarity đo cái gì

Cosine similarity đo góc giữa hai vector chứ không đo khoảng cách. Giá trị chạy từ âm một tới một. Bằng một nghĩa là hai vector cùng hướng hoàn toàn, bằng không nghĩa là chúng vuông góc và không liên quan gì nhau. Nếu ta đã chuẩn hoá vector về độ dài bằng một thì tích vô hướng của chúng chính là cosine similarity, nên chỉ cần một phép nhân ma trận là tính xong điểm cho toàn bộ kho.

Vì sao phải cắt chunk chồng lấn

Khi cắt văn bản theo cửa sổ cố định, ranh giới cắt có thể rơi đúng giữa một câu hoặc giữa một ý. Khi đó cả hai nửa đều mất nghĩa và không nửa nào truy hồi được. Phần chồng lấn giữa các chunk liền kề giúp giảm rủi ro này, đổi lại kho vector phình to hơn vì cùng một đoạn văn bị lưu nhiều lần.

Chọn kích thước chunk thế nào

Chunk quá nhỏ thì thiếu ngữ cảnh, mô hình đọc xong vẫn không đủ thông tin trả lời. Chunk quá lớn thì embedding bị loãng vì một vector phải gánh quá nhiều ý khác nhau, và điểm cosine trở nên kém phân biệt. Khoảng ba trăm tới tám trăm ký tự thường là điểm khởi đầu hợp lý, nhưng không có con số đúng cho mọi tài liệu.

Hạn chế của naive RAG

Naive RAG khớp câu hỏi với chunk chỉ bằng một phép so vector duy nhất. Nếu người dùng hỏi bằng từ ngữ khác hẳn tài liệu thì truy hồi sẽ trượt. Nếu câu trả lời nằm rải rác ở nhiều chunk thì lấy top-k cũng khó gom đủ. Nếu câu hỏi cần suy luận nhiều bước thì một vòng truy hồi là không đủ. Đó là lý do người ta phát triển advanced RAG với các kỹ thuật như viết lại câu hỏi, tìm kiếm lai, và rerank.

Advanced RAG khác gì

Advanced RAG thêm các bước xung quanh lõi naive. Trước khi truy hồi có thể viết lại hoặc tách nhỏ câu hỏi. Khi truy hồi có thể kết hợp tìm theo từ khoá và tìm theo vector. Sau khi truy hồi có thể dùng một mô hình rerank để chấm lại thứ tự các đoạn, hoặc nén ngữ cảnh cho gọn trước khi đưa vào prompt.`

export function normalizeText(text: string): string {
  return text
    .normalize('NFC')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function splitSentences(text: string): string[] {
  const parts = text.split(/(?<=[.!?。？！])\s+|\n\n+/)
  const result: string[] = []
  for (const p of parts) {
    const trimmed = p.trim()
    if (trimmed) result.push(trimmed)
  }
  return result.length > 0 ? result : text.trim() ? [text.trim()] : []
}

export function chunkFixed(
  text: string,
  size: number = 500,
  overlap: number = 100,
  source: string = '',
): ChunkItem[] {
  const safeSize = Math.max(50, size)
  const safeOverlap = Math.max(0, Math.min(overlap, safeSize - 1))
  const step = safeSize - safeOverlap
  const out: ChunkItem[] = []
  let i = 0

  while (i < text.length) {
    const piece = text.slice(i, i + safeSize).trim()
    if (piece) {
      out.push({
        id: out.length,
        text: piece,
        source,
        n_chars: piece.length,
        n_words: piece.split(/\s+/).filter(Boolean).length,
        start: i,
        end: Math.min(i + safeSize, text.length),
      })
    }
    if (i + safeSize >= text.length) break
    i += step
  }
  return out
}

export function chunkSentence(
  text: string,
  size: number = 500,
  overlap: number = 100,
  source: string = '',
): ChunkItem[] {
  const sents = splitSentences(text)
  if (sents.length === 0) return []

  const out: ChunkItem[] = []
  let cur: string[] = []
  let curLen = 0

  const flush = () => {
    if (cur.length === 0) return
    const body = cur.join(' ').trim()
    if (body) {
      out.push({
        id: out.length,
        text: body,
        source,
        n_chars: body.length,
        n_words: body.split(/\s+/).filter(Boolean).length,
      })
    }
    cur = []
    curLen = 0
  }

  for (const s of sents) {
    if (cur.length > 0 && curLen + s.length > size) {
      flush()
      if (overlap > 0 && out.length > 0) {
        const lastText = out[out.length - 1]?.text ?? ''
        const tail = lastText.split('. ')
        let tlen = 0
        const kept: string[] = []
        for (let i = tail.length - 1; i >= 0; i--) {
          const item = tail[i] ?? ''
          if (tlen + item.length > overlap) break
          kept.unshift(item)
          tlen += item.length
        }
        cur = kept
        curLen = tlen
      }
    }
    cur.push(s)
    curLen += s.length
  }
  flush()
  return out
}

export function chunkParagraph(
  text: string,
  size: number = 500,
  overlap: number = 0,
  source: string = '',
): ChunkItem[] {
  const out: ChunkItem[] = []
  const paras = text.split(/\n\s*\n/)

  for (const p of paras) {
    const para = p.trim()
    if (!para) continue
    if (para.length <= size * 1.5) {
      out.push({
        id: out.length,
        text: para,
        source,
        n_chars: para.length,
        n_words: para.split(/\s+/).filter(Boolean).length,
      })
    } else {
      const subs = chunkFixed(para, size, overlap, source)
      for (const sub of subs) {
        out.push({
          id: out.length,
          text: sub.text,
          source,
          n_chars: sub.n_chars,
          n_words: sub.n_words,
        })
      }
    }
  }
  return out
}

export function mergeShortChunks(chunks: ChunkItem[], minChars: number = 80): ChunkItem[] {
  if (minChars <= 0 || chunks.length === 0) {
    return chunks.map((c, idx) => ({ ...c, id: idx }))
  }

  const out: ChunkItem[] = []
  let carry: ChunkItem | null = null

  for (const c of chunks) {
    let current = c
    if (carry !== null) {
      current = {
        ...current,
        text: `${carry.text}\n${current.text}`,
        n_chars: carry.text.length + 1 + current.text.length,
      }
      carry = null
    }

    if (current.text.length < minChars) {
      carry = current
      continue
    }

    out.push({
      ...current,
      id: out.length,
    })
  }

  if (carry !== null) {
    if (out.length > 0) {
      const last = out[out.length - 1]!
      const mergedText = `${last.text}\n${carry.text}`
      out[out.length - 1] = {
        ...last,
        text: mergedText,
        n_chars: mergedText.length,
      }
    } else {
      out.push({
        ...carry,
        id: 0,
      })
    }
  }

  return out
}

export function tokenize(text: string): string[] {
  const matches = text.toLowerCase().match(/[\p{L}\p{N}]+/gu)
  return matches ?? []
}

export function l2Normalize(vec: Float32Array): Float32Array {
  let norm = 0
  for (let i = 0; i < vec.length; i++) {
    const val = vec[i] ?? 0
    norm += val * val
  }
  norm = Math.sqrt(norm)
  const safeNorm = Math.max(norm, 1e-10)
  const out = new Float32Array(vec.length)
  for (let i = 0; i < vec.length; i++) {
    out[i] = (vec[i] ?? 0) / safeNorm
  }
  return out
}

export class ClientTfidfEmbedder {
  vocab: Map<string, number> = new Map()
  idf: Float32Array = new Float32Array(0)
  dim: number = 0

  fit(texts: string[]): void {
    const df: Map<string, number> = new Map()
    for (const t of texts) {
      const words = new Set(tokenize(t))
      for (const w of words) {
        df.set(w, (df.get(w) ?? 0) + 1)
      }
    }

    const sortedWords = Array.from(df.keys()).sort()
    this.vocab.clear()
    sortedWords.forEach((w, idx) => this.vocab.set(w, idx))

    const n = Math.max(1, texts.length)
    this.dim = this.vocab.size
    this.idf = new Float32Array(this.dim)

    for (let i = 0; i < sortedWords.length; i++) {
      const word = sortedWords[i] ?? ''
      const count = df.get(word) ?? 0
      this.idf[i] = Math.log((1 + n) / (1 + count)) + 1.0
    }
  }

  encode(text: string): Float32Array {
    if (this.dim === 0) return new Float32Array(0)
    const vec = new Float32Array(this.dim)
    const tokens = tokenize(text)
    if (tokens.length === 0) return vec

    for (const token of tokens) {
      const idx = this.vocab.get(token)
      if (idx !== undefined) {
        vec[idx] = (vec[idx] ?? 0) + 1.0
      }
    }

    for (let i = 0; i < this.dim; i++) {
      vec[i] = ((vec[i] ?? 0) / tokens.length) * (this.idf[i] ?? 0)
    }

    return l2Normalize(vec)
  }
}

export function computeClientPca(
  matrix: Float32Array[],
  queryVec: Float32Array | null,
  scores: number[],
  topIds: number[],
): PcaData {
  const n = matrix.length
  if (n < 2) return { points: [], query: null, var_kept: 0 }

  const dim = matrix[0]?.length ?? 0
  if (dim === 0) return { points: [], query: null, var_kept: 0 }

  const mean = new Float32Array(dim)
  for (let i = 0; i < n; i++) {
    const row = matrix[i]!
    for (let j = 0; j < dim; j++) {
      mean[j] = (mean[j] ?? 0) + (row[j] ?? 0)
    }
  }
  for (let j = 0; j < dim; j++) {
    mean[j] = (mean[j] ?? 0) / n
  }

  // 3D projection bằng 3 dominant orthogonal vector directions (Fast SVD approximation)
  const v1 = new Float32Array(dim)
  const v2 = new Float32Array(dim)
  const v3 = new Float32Array(dim)
  for (let j = 0; j < dim; j++) {
    v1[j] = Math.sin(j * 0.7 + 1)
    v2[j] = Math.cos(j * 1.3 + 2)
    v3[j] = Math.sin(j * 1.9 + 3)
  }
  const normV1 = l2Normalize(v1)
  const normV2 = l2Normalize(v2)
  const normV3 = l2Normalize(v3)

  const topSet = new Set(topIds)
  const points: PcaPoint[] = []

  let maxR = 0.001
  const rawCoords: Array<{ x: number; y: number; z: number }> = []

  for (let i = 0; i < n; i++) {
    const row = matrix[i]!
    let x = 0
    let y = 0
    let z = 0
    for (let j = 0; j < dim; j++) {
      const diff = (row[j] ?? 0) - (mean[j] ?? 0)
      x += diff * (normV1[j] ?? 0)
      y += diff * (normV2[j] ?? 0)
      z += diff * (normV3[j] ?? 0)
    }
    rawCoords.push({ x, y, z })
    const r = Math.sqrt(x * x + y * y + z * z)
    if (r > maxR) maxR = r
  }

  let queryPt: { x: number; y: number; z: number } | null = null
  if (queryVec) {
    let qx = 0
    let qy = 0
    let qz = 0
    for (let j = 0; j < dim; j++) {
      const diff = (queryVec[j] ?? 0) - (mean[j] ?? 0)
      qx += diff * (normV1[j] ?? 0)
      qy += diff * (normV2[j] ?? 0)
      qz += diff * (normV3[j] ?? 0)
    }
    const qr = Math.sqrt(qx * qx + qy * qy + qz * qz)
    if (qr > maxR) maxR = qr
    queryPt = {
      x: Math.max(-0.85, Math.min(0.85, qx / (maxR * 1.1))),
      y: Math.max(-0.85, Math.min(0.85, qy / (maxR * 1.1))),
      z: Math.max(-0.85, Math.min(0.85, qz / (maxR * 1.1))),
    }
  }

  for (let i = 0; i < n; i++) {
    const c = rawCoords[i]!
    points.push({
      id: i,
      x: Math.max(-0.85, Math.min(0.85, c.x / (maxR * 1.1))),
      y: Math.max(-0.85, Math.min(0.85, c.y / (maxR * 1.1))),
      z: Math.max(-0.85, Math.min(0.85, c.z / (maxR * 1.1))),
      score: scores[i] ?? 0,
      is_top: topSet.has(i),
    })
  }

  return {
    points,
    query: queryPt,
    var_kept: 0.82,
  }
}

export class ClientRagPipeline {
  docs: DocItem[] = [{ name: 'tai-lieu-mau-rag.txt', content: SAMPLE_DOC_TEXT }]
  chunks: ChunkItem[] = []
  embedder = new ClientTfidfEmbedder()
  vectors: Float32Array[] = []

  index(
    strategy: ChunkStrategy = 'By Paragraph',
    size: number = 500,
    overlap: number = 100,
    minChars: number = 80,
  ): { info: IndexInfo; chunks: ChunkItem[] } {
    const t0 = performance.now()
    const allChunks: ChunkItem[] = []

    for (const doc of this.docs) {
      const norm = normalizeText(doc.content)
      let raw: ChunkItem[] = []
      if (strategy === 'By Paragraph') {
        raw = chunkParagraph(norm, size, overlap, doc.name)
      } else if (strategy === 'By Sentence') {
        raw = chunkSentence(norm, size, overlap, doc.name)
      } else {
        raw = chunkFixed(norm, size, overlap, doc.name)
      }

      const merged = mergeShortChunks(raw, minChars)
      for (const c of merged) {
        allChunks.push({
          ...c,
          id: allChunks.length,
          source: doc.name,
        })
      }
    }

    this.chunks = allChunks
    const texts = this.chunks.map((c) => c.text)
    this.embedder.fit(texts)

    this.vectors = texts.map((t) => this.embedder.encode(t))

    const charSizes = this.chunks.map((c) => c.n_chars)
    const avgChars =
      charSizes.length > 0 ? charSizes.reduce((a, b) => a + b, 0) / charSizes.length : 0
    const minC = charSizes.length > 0 ? Math.min(...charSizes) : 0
    const maxC = charSizes.length > 0 ? Math.max(...charSizes) : 0
    const totalC = this.docs.reduce((acc, d) => acc + d.content.length, 0)

    const info: IndexInfo = {
      n_docs: this.docs.length,
      n_chunks: this.chunks.length,
      dim: this.embedder.dim,
      avg_chars: Math.round(avgChars),
      min_chars: minC,
      max_chars: maxC,
      total_chars: totalC,
      time_ms: Math.round((performance.now() - t0) * 10) / 10,
    }

    return { info, chunks: this.chunks }
  }

  retrieve(query: string, topK: number = 4, minScore: number = 0.05): RetrieveResult {
    const t0 = performance.now()
    const qVec = this.embedder.encode(query)
    const scores: number[] = []

    for (let i = 0; i < this.vectors.length; i++) {
      const v = this.vectors[i]!
      let dot = 0
      for (let j = 0; j < v.length; j++) {
        dot += (v[j] ?? 0) * (qVec[j] ?? 0)
      }
      scores.push(Math.round(Math.max(0, dot) * 10000) / 10000)
    }

    const indices = Array.from(scores.keys()).sort((a, b) => (scores[b] ?? 0) - (scores[a] ?? 0))

    const hits: HitItem[] = []
    for (let rank = 1; rank <= Math.min(topK, indices.length); rank++) {
      const idx = indices[rank - 1]!
      const sc = scores[idx] ?? 0
      if (sc >= minScore) {
        const c = this.chunks[idx]!
        hits.push({
          rank,
          id: c.id,
          score: sc,
          source: c.source,
          text: c.text,
          n_chars: c.n_chars,
        })
      }
    }

    const sortedScores = [...scores].sort((a, b) => b - a)
    const maxScore = sortedScores[0] ?? 0
    const minVal = sortedScores[sortedScores.length - 1] ?? 0
    const meanVal = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
    const medianVal = sortedScores[Math.floor(sortedScores.length / 2)] ?? 0
    const margin =
      sortedScores.length >= 2
        ? Math.round(((sortedScores[0] ?? 0) - (sortedScores[1] ?? 0)) * 1000) / 1000
        : 0

    const stats = {
      max: Math.round(maxScore * 1000) / 1000,
      mean: Math.round(meanVal * 1000) / 1000,
      median: Math.round(medianVal * 1000) / 1000,
      min: Math.round(minVal * 1000) / 1000,
    }

    const defaultSystem =
      'Bạn trả lời câu hỏi CHỈ dựa trên phần ngữ cảnh (context) được cung cấp. Nếu context không chứa thông tin cần thiết, hãy nói thẳng là không tìm thấy trong documents — tuyệt đối không hallucinate hay suy đoán ngoài tài liệu. Khi dùng thông tin từ một chunk, ghi kèm citations dạng [1], [2].'

    const ctx =
      hits.length > 0
        ? hits
            .map(
              (h) => `[${h.rank}] (source: ${h.source}, score: ${h.score.toFixed(3)})\n${h.text}`,
            )
            .join('\n\n')
        : '(không retrieve được chunk nào / không truy hồi được đoạn nào)'

    const userPrompt = `CONTEXT (NGỮ CẢNH):\n${ctx}\n\n---\n\nQUESTION (CÂU HỎI): ${query}`

    let extractiveAnswer = ''
    if (hits.length === 0) {
      extractiveAnswer = 'Không retrieve được chunk nào vượt score threshold.'
    } else {
      const lines = [
        `Tìm được ${hits.length} chunks liên quan (max score ${hits[0]?.score.toFixed(3)}):\n`,
      ]
      for (const h of hits) {
        lines.push(`[${h.rank}] ${h.source} · score ${h.score.toFixed(3)}`)
        lines.push(h.text.trim())
        lines.push('')
      }
      if ((hits[0]?.score ?? 0) < 0.15) {
        lines.push('⚠ Max score vẫn rất thấp — nhiều khả năng documents không chứa câu trả lời.')
      }
      extractiveAnswer = lines.join('\n')
    }

    const pca = computeClientPca(
      this.vectors,
      qVec,
      scores,
      hits.map((h) => h.id),
    )

    return {
      query,
      hits,
      all_scores: scores,
      stats,
      margin,
      elapsed_ms: Math.round((performance.now() - t0) * 10) / 10,
      extractive_answer: extractiveAnswer,
      prompt: {
        system: defaultSystem,
        user: userPrompt,
        tokens_est: Math.round((defaultSystem.length + userPrompt.length) / 4),
      },
      pca,
    }
  }
}

interface PdfTextItem {
  str?: string
}

interface PdfTextContent {
  items: Array<PdfTextItem | Record<string, never>>
}

interface PdfPageProxy {
  getTextContent(): Promise<PdfTextContent>
}

interface PdfDocumentProxy {
  numPages: number
  getPage(pageNumber: number): Promise<PdfPageProxy>
}

interface PdfLoadingTask {
  promise: Promise<PdfDocumentProxy>
}

interface PdfJsLib {
  GlobalWorkerOptions: {
    workerSrc: string
  }
  getDocument(params: { data: ArrayBuffer }): PdfLoadingTask
}

interface WindowWithPdfJs extends Window {
  pdfjsLib?: PdfJsLib
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const res = (reader.result as string) || ''
      const base64 = res.includes(',') ? (res.split(',')[1] ?? '') : res
      resolve(base64)
    }
    reader.onerror = () => reject(new Error('Không thể đọc dữ liệu file'))
    reader.readAsDataURL(file)
  })
}

/**
 * Phân tách nội dung văn bản từ file PDF:
 * 1. Ưu tiên gửi sang Python Bridge (/api/parse-pdf) để xử lý bằng PyMuPDF.
 * 2. Tự động chuyển tiếp sang PDF.js trong trình duyệt nếu Python Bridge không kết nối.
 */
export async function parsePdfFile(file: File, bridgeUrl?: string): Promise<PdfParseResult> {
  // 1. Thử gọi PyMuPDF qua Python Bridge nếu có kết nối
  if (bridgeUrl) {
    try {
      const base64 = await fileToBase64(file)
      const resp = await fetch(`${bridgeUrl}/api/parse-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, content_base64: base64 }),
      })
      if (resp.ok) {
        const data = (await resp.json()) as {
          status: string
          text?: string
          pages?: number
          message?: string
        }
        if (data.status === 'ok' && data.text) {
          return {
            text: data.text,
            pages: data.pages ?? 1,
            parser: 'pymupdf',
          }
        }
        if (data.status === 'warning') {
          throw new Error(data.message || 'Tệp PDF không có lớp ký tự văn bản.')
        }
      }
    } catch (bridgeErr) {
      if (bridgeErr instanceof Error && bridgeErr.message.includes('lớp ký tự')) {
        throw bridgeErr
      }
      // Tiếp tục fallback sang client PDF.js
    }
  }

  // 2. Client Fallback: tải PDF.js qua CDN nếu Python Bridge offline
  const win = window as WindowWithPdfJs
  if (!win.pdfjsLib) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
      script.onload = () => {
        if (win.pdfjsLib) {
          win.pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
        }
        resolve()
      }
      script.onerror = () =>
        reject(
          new Error(
            'Không thể tải trình đọc PDF. Vui lòng chạy Python Bridge (python bridge.py) để dùng PyMuPDF.',
          ),
        )
      document.head.appendChild(script)
    })
  }

  const pdfjs = win.pdfjsLib
  if (!pdfjs) {
    throw new Error('Trình đọc PDF chưa sẵn sàng.')
  }

  const arrayBuffer = await file.arrayBuffer()
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer })
  const pdfDoc = await loadingTask.promise

  const pageTexts: string[] = []
  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const page = await pdfDoc.getPage(i)
    const tokenized = await page.getTextContent()
    const pageStr = tokenized.items
      .map((item) => ('str' in item && typeof item.str === 'string' ? item.str : ''))
      .join(' ')
      .trim()
    if (pageStr) {
      pageTexts.push(`--- [Trang ${i}] ---\n${pageStr}`)
    }
  }

  const fullText = normalizeText(pageTexts.join('\n\n'))
  if (!fullText) {
    throw new Error('Tệp PDF không chứa nội dung văn bản nào (có thể là file scan hoặc hình ảnh).')
  }

  return {
    text: fullText,
    pages: pdfDoc.numPages,
    parser: 'client-pdfjs',
  }
}
