export interface ChunkItem {
  id: number
  text: string
  source: string
  n_chars: number
  n_words?: number
  start?: number
  end?: number
}

export interface HitItem {
  rank: number
  id: number
  score: number
  source: string
  text: string
  n_chars?: number
}

export interface IndexInfo {
  n_docs: number
  n_chunks: number
  dim: number
  avg_chars: number
  min_chars: number
  max_chars: number
  total_chars: number
  time_ms?: number
}

export interface PcaPoint {
  id: number
  x: number
  y: number
  z?: number
  score: number
  is_top: boolean
}

export interface PcaData {
  points: PcaPoint[]
  query?: { x: number; y: number; z?: number } | null
  var_kept: number
}

export interface PromptData {
  system: string
  user: string
  tokens_est: number
}

export interface RetrieveResult {
  query: string
  hits: HitItem[]
  all_scores: number[]
  stats: Record<string, number>
  margin: number
  elapsed_ms: number
  extractive_answer: string
  prompt: PromptData
  pca?: PcaData
}

export interface DocItem {
  name: string
  content: string
  length?: number
}

export interface BenchmarkRow {
  embedder: string
  strategy: string
  chunks: number
  scores: number[]
  snr: number
}

export interface BenchmarkResult {
  queries: string[]
  rows: BenchmarkRow[]
  raw_report: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  query?: string
  hits?: HitItem[]
  stats?: Record<string, number>
  margin?: number
  elapsed_ms?: number
  warning?: string
}

export type ChunkStrategy = 'By Paragraph' | 'Fixed Character' | 'By Sentence'
export type EmbedderType = 'TF-IDF' | 'Hashing' | 'Sentence-Transformers'

export interface PdfParseResult {
  text: string
  pages: number
  parser: 'pymupdf' | 'client-pdfjs'
}
