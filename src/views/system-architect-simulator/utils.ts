import type { NodeData } from './types'
import { nodeTypeMap } from './constants'
import { INSTANCE_TIERS, RESOURCE_PROFILES } from './hardware'

export const getEffectiveCapacity = (node: NodeData) => {
  // If it's a structural node, use legacy logic
  if (node.type === 'CLIENT' || node.type === 'RATELIMIT') {
    const base = node.config.maxCapacity || 0
    const replicas = node.config.replicas || 1
    return base * replicas
  }

  const tier = node.config.instanceTier || 'micro'
  const hw =
    tier === 'custom'
      ? { vCpu: node.config.customVCpu || 1, ramGb: node.config.customRamGb || 2, costPerMo: 0 }
      : INSTANCE_TIERS[tier]

  const profile = RESOURCE_PROFILES[node.type]

  // Safety check just in case
  if (!hw || !profile) return (node.config.maxCapacity || 0) * (node.config.replicas || 1)

  // Calculate maximum requests per second bounded by CPU and RAM
  const cpuLimit = profile.vCpuPerReq > 0 ? hw.vCpu / profile.vCpuPerReq : Infinity
  const ramMb = hw.ramGb * 1024
  const ramLimit = profile.ramMbPerReq > 0 ? ramMb / profile.ramMbPerReq : Infinity

  const baseCapacity = Math.floor(Math.min(cpuLimit, ramLimit))
  const replicas = node.config.replicas || 1

  return baseCapacity * replicas
}

export const getNodeCost = (node: NodeData): number => {
  // Structural nodes have generic cost
  if (node.type === 'CLIENT') return 0
  if (node.type === 'RATELIMIT') return 20 * (node.config.replicas || 1)

  const tier = node.config.instanceTier || 'micro'
  const replicas = node.config.replicas || 1

  if (tier === 'custom') {
    const vCpu = node.config.customVCpu || 1
    const ramGb = node.config.customRamGb || 2
    // Typical cloud pricing approx: $10 per vCPU, $2 per GB RAM
    const customCost = vCpu * 10 + ramGb * 2
    return customCost * replicas
  }

  const hw = INSTANCE_TIERS[tier]
  if (!hw) {
    const typeDef = nodeTypeMap[node.type]
    if (!typeDef) return 0
    return typeDef.costPerInstance * replicas
  }

  return hw.costPerMo * replicas
}

export const formatTraffic = (n: number): string => {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return Math.round(n).toString()
}
