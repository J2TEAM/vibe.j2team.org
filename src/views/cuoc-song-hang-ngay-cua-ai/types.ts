export type Sender = 'user' | 'ai'

export type AgentState = 'idle' | 'working' | 'gathering' | 'sleeping' | 'walking'

export interface Point {
  x: number
  y: number
}

export interface Agent {
  id: string
  name: string
  pos: Point
  target: Point
  state: AgentState
  currentTask?: string
  color: string
  spriteIdx: number // Để dùng nhiều nhân vật khác nhau
}

export interface RoomObject extends Point {
  name: string
  width: number
  height: number
  type: 'desk' | 'table' | 'pc' | 'book' | 'bed' | 'window' | 'door'
}

export interface Message {
  id: string
  sender: Sender
  text: string
  timestamp: number
  status?: 'sending' | 'streaming' | 'done' | 'error'
  agentName?: string
}

export interface AgentAsset {
  body: HTMLImageElement
  hair: HTMLImageElement
  outfit: HTMLImageElement
}

export interface Rect {
  x1: number
  y1: number
  x2: number
  y2: number
}

export interface ActionZone {
  name: string
  icon: string | null
  delay: number
  rect?: Rect
  rects?: Rect[]
  targetPos?: Point
}

export interface SmartAgent extends Agent {
  path: Point[]
  targetNodeIdx: number
  statusText: string
  statusIcon: string | null
  delayUntil: number
  isResponding: boolean
}
