export type InstanceTier = 'nano' | 'micro' | 'small' | 'medium' | 'large' | 'xlarge' | 'custom'

export interface HardwareSpec {
  vCpu: number
  ramGb: number
  costPerMo: number
}

export const INSTANCE_TIERS: Record<string, HardwareSpec> = {
  nano: { vCpu: 0.5, ramGb: 1, costPerMo: 5 },
  micro: { vCpu: 1, ramGb: 2, costPerMo: 10 },
  small: { vCpu: 2, ramGb: 4, costPerMo: 20 },
  medium: { vCpu: 4, ramGb: 8, costPerMo: 40 },
  large: { vCpu: 8, ramGb: 16, costPerMo: 80 },
  xlarge: { vCpu: 16, ramGb: 32, costPerMo: 160 },
  custom: { vCpu: 1, ramGb: 2, costPerMo: 0 }, // Custom is evaluated dynamically
}

export interface ResourceProfile {
  vCpuPerReq: number
  ramMbPerReq: number
}

/**
 * How much hardware resources 1 request per second consumes for each node type.
 * Compute heavy = needs more vCPU.
 * Memory heavy = needs more RAM.
 */
export const RESOURCE_PROFILES: Record<string, ResourceProfile> = {
  CLIENT: { vCpuPerReq: 0, ramMbPerReq: 0 },
  CDN: { vCpuPerReq: 0.0001, ramMbPerReq: 0.05 }, // Highly optimized
  RATELIMIT: { vCpuPerReq: 0.0002, ramMbPerReq: 0.05 },
  LB: { vCpuPerReq: 0.0002, ramMbPerReq: 0.1 },
  GATEWAY: { vCpuPerReq: 0.001, ramMbPerReq: 0.5 },
  SERVICE: { vCpuPerReq: 0.005, ramMbPerReq: 1 }, // Compute heavy
  CACHE: { vCpuPerReq: 0.0005, ramMbPerReq: 0.5 }, // Memory heavy
  QUEUE: { vCpuPerReq: 0.002, ramMbPerReq: 1 },
  DB: { vCpuPerReq: 0.01, ramMbPerReq: 5 }, // I/O and Memory heavy
}
