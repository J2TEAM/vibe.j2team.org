export type CardLevel = 0 | 1 | 2 | 3

export interface Folder {
  id: string
  name: string
  description: string
  color: string
  icon: string
  createdAt: number
  updatedAt: number
}

export interface CardSet {
  id: string
  folderId: string
  name: string
  description: string
  createdAt: number
  updatedAt: number
}

export interface Card {
  id: string
  setId: string
  front: string
  back: string
  level: CardLevel
  order: number
  createdAt: number
  updatedAt: number
}

export interface StudySession {
  id: string
  setId: string
  startedAt: number
  completedAt: number | null
  cardsReviewed: number
  cardsCorrect: number
}

export type ViewName =
  | 'folder-list'
  | 'set-list'
  | 'card-editor'
  | 'study-config'
  | 'study-mode'
  | 'study-complete'

export interface NavState {
  view: ViewName
  folderId?: string
  setId?: string
  folderName?: string
  setName?: string
}

export interface StudyConfig {
  cardSide: 'front' | 'back' | 'random'
  cardOrder: 'sequential' | 'random'
}

export interface HistoryEntry {
  cardId: string
  previousLevel: CardLevel
  wasCorrect: boolean
}
