import type { InstanceTier } from './hardware'

export interface NodeType {
  type: string
  label: string
  icon: string
  desc: string
  color: string
  defaultCapacity: number
  defaultLatency: number
  costPerInstance: number
  defaultReplicas: number
  defaultErrorRate: number
}

export interface NodeData {
  id: string
  type: string
  x: number
  y: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: Record<string, any> & {
    instanceTier?: InstanceTier
    customVCpu?: number
    customRamGb?: number
    autoScale?: boolean
    minReplicas?: number
    maxReplicas?: number
    scaleUpThreshold?: number
  }
  isOverloaded?: boolean
  hasWarning?: boolean
  currentTraffic?: number
  currentErrorRate?: number
  circuitOpen?: boolean
}

export interface EdgeData {
  id: string
  fromNodeId: string
  toNodeId: string
  traffic?: number
}

export interface SimHint {
  icon: string
  title: string
  message: string
  color: string
  action?: { label: string; apply: () => void }
}

export interface SimStats {
  p50Latency: number
  p99Latency: number
  successRate: number
}

export interface Template {
  name: string
  icon: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  nodes: Array<{ type: string; x: number; y: number; config?: Record<string, any> }>
  edges: Array<{ from: number; to: number }>
}

export interface EventLog {
  id: string
  time: string
  source: string
  message: string
  type: 'info' | 'warning' | 'error' | 'debug'
}

export interface StressEvent {
  id: string
  name: string
  icon: string
  desc: string
  color: string
  trafficMultiplier: number
  readPercentOverride?: number
  duration: number
  rampUp?: boolean
}
