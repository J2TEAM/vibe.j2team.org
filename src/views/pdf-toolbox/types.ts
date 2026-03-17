export type Tab = 'merger' | 'splitter' | 'history'

export interface HistoryItem {
  id: string
  action: string
  fileName: string
  date: string
  details?: string
  fileSize?: number
  downloadCount?: number
}

export interface SplitterRange {
  id: string
  start: number
  end: number
}
