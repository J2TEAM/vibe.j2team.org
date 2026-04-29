import { computed, type Ref } from 'vue'
import type { TechCategory, TechProfile, SystemMetrics } from '../types'
import { techMap } from '../data/technologies'

export function useSimulationEngine(selectedTechs: Ref<Map<TechCategory, string>>) {
  const selectedProfiles = computed<TechProfile[]>(() => {
    const profiles: TechProfile[] = []
    for (const techId of selectedTechs.value.values()) {
      const tech = techMap.get(techId)
      if (tech) profiles.push(tech)
    }
    return profiles
  })

  const selectedIds = computed(() => new Set(selectedTechs.value.values()))

  // Synergy: each pair gives +8% throughput bonus
  const synergyPairs = computed(() => {
    const pairs: Array<{ a: string; b: string }> = []
    const ids = selectedIds.value
    for (const tech of selectedProfiles.value) {
      for (const synergyId of tech.synergies) {
        if (ids.has(synergyId)) {
          const key = [tech.id, synergyId].sort().join(':')
          if (!pairs.some((p) => [p.a, p.b].sort().join(':') === key)) {
            pairs.push({ a: tech.id, b: synergyId })
          }
        }
      }
    }
    return pairs
  })

  const synergyMultiplier = computed(() => Math.min(1.5, 1 + synergyPairs.value.length * 0.08))

  // Conflict: each pair gives -10% penalty
  const conflictPairs = computed(() => {
    const pairs: Array<{ a: string; b: string }> = []
    const ids = selectedIds.value
    for (const tech of selectedProfiles.value) {
      for (const conflictId of tech.conflicts) {
        if (ids.has(conflictId)) {
          const key = [tech.id, conflictId].sort().join(':')
          if (!pairs.some((p) => [p.a, p.b].sort().join(':') === key)) {
            pairs.push({ a: tech.id, b: conflictId })
          }
        }
      }
    }
    return pairs
  })

  const conflictPenalty = computed(() => Math.max(0.4, 1 - conflictPairs.value.length * 0.1))

  // Missing requirements
  const missingRequirements = computed(() => {
    const missing: Array<{ techId: string; requiresCategory: TechCategory }> = []
    const selectedCats = new Set(selectedTechs.value.keys())
    for (const tech of selectedProfiles.value) {
      for (const reqCat of tech.requires) {
        if (!selectedCats.has(reqCat)) {
          missing.push({ techId: tech.id, requiresCategory: reqCat })
        }
      }
    }
    return missing
  })

  // Throughput: bottleneck of backend/database × multipliers
  const throughput = computed(() => {
    const backendAndDb = selectedProfiles.value.filter(
      (t) => t.category === 'backend' || t.category === 'database',
    )
    if (backendAndDb.length === 0) return 0

    const bottleneck = Math.min(...backendAndDb.map((t) => t.metrics.throughput))

    // Load balancer boost
    const lb = selectedProfiles.value.find((t) => t.category === 'load-balancer')
    const lbMultiplier = lb ? lb.metrics.scalingFactor : 1

    // Cache boost
    const cache = selectedProfiles.value.find((t) => t.category === 'cache')
    const cacheMultiplier = cache ? 1 + cache.metrics.scalingFactor * 0.4 : 1

    // CDN boost
    const cdn = selectedProfiles.value.find((t) => t.category === 'cdn')
    const cdnMultiplier = cdn ? 1 + cdn.metrics.scalingFactor * 0.25 : 1

    return Math.round(
      bottleneck *
        lbMultiplier *
        cacheMultiplier *
        cdnMultiplier *
        synergyMultiplier.value *
        conflictPenalty.value,
    )
  })

  // Latency: sum of relevant component latencies
  const latency = computed(() => {
    if (selectedProfiles.value.length === 0) return 0

    let total = 0
    for (const tech of selectedProfiles.value) {
      total += tech.metrics.latency
    }

    // Cache reduces latency
    const hasCache = selectedProfiles.value.some((t) => t.category === 'cache')
    if (hasCache) total *= 0.6

    // CDN reduces latency
    const hasCdn = selectedProfiles.value.some((t) => t.category === 'cdn')
    if (hasCdn) total *= 0.7

    // Synergies reduce, conflicts increase
    total = (total / synergyMultiplier.value) * (2 - conflictPenalty.value)

    return Math.max(5, Math.round(total))
  })

  // Security: weighted average + bonus for dedicated security tools
  const security = computed(() => {
    if (selectedProfiles.value.length === 0) return 0

    const securityTechs = selectedProfiles.value.filter((t) => t.category === 'security')
    const otherTechs = selectedProfiles.value.filter((t) => t.category !== 'security')

    let score = 0
    let weight = 0

    for (const tech of otherTechs) {
      score += tech.metrics.security
      weight++
    }

    // Security tools add flat bonus
    for (const sec of securityTechs) {
      score += sec.metrics.security * 0.5
    }

    const baseScore = weight > 0 ? score / weight : 0

    // Synergy bonus
    const synergyBonus = Math.min(10, synergyPairs.value.length * 2)

    return Math.min(100, Math.round(baseScore + synergyBonus))
  })

  // Cost: sum of all costs
  const cost = computed(() => {
    return selectedProfiles.value.reduce((sum, t) => sum + t.metrics.cost, 0)
  })

  // Reliability: product model
  const reliability = computed(() => {
    const reliableTechs = selectedProfiles.value.filter(
      (t) =>
        t.category === 'backend' ||
        t.category === 'database' ||
        t.category === 'cache' ||
        t.category === 'load-balancer' ||
        t.category === 'container',
    )

    if (reliableTechs.length === 0) return 0

    let combined = 1
    for (const tech of reliableTechs) {
      combined *= tech.metrics.reliability / 100
    }
    let score = combined * 100

    // Monitoring bonus
    const hasMonitoring = selectedProfiles.value.some((t) => t.category === 'monitoring')
    if (hasMonitoring) score = Math.min(99.99, score * 1.03)

    // Container/K8s bonus (self-healing)
    const hasContainer = selectedProfiles.value.some((t) => t.category === 'container')
    if (hasContainer) score = Math.min(99.99, score * 1.02)

    // CI/CD bonus (reliable deploys)
    const hasCiCd = selectedProfiles.value.some((t) => t.category === 'ci-cd')
    if (hasCiCd) score = Math.min(99.99, score * 1.01)

    return Math.round(score * 100) / 100
  })

  // Warnings
  const warnings = computed(() => {
    const w: string[] = []

    if (missingRequirements.value.length > 0) {
      for (const m of missingRequirements.value) {
        const tech = techMap.get(m.techId)
        if (tech) {
          w.push(`${tech.nameVi} yêu cầu có ${m.requiresCategory} nhưng chưa chọn`)
        }
      }
    }

    if (conflictPairs.value.length > 0) {
      for (const c of conflictPairs.value) {
        const a = techMap.get(c.a)
        const b = techMap.get(c.b)
        if (a && b) {
          w.push(`⚡ Xung đột: ${a.nameVi} và ${b.nameVi} không nên dùng cùng nhau`)
        }
      }
    }

    if (!selectedTechs.value.has('database') && selectedTechs.value.has('backend')) {
      w.push('Backend không có database — dữ liệu lưu ở đâu?')
    }

    return w
  })

  const systemMetrics = computed<SystemMetrics>(() => ({
    throughput: throughput.value,
    latency: latency.value,
    security: security.value,
    cost: cost.value,
    reliability: reliability.value,
  }))

  return {
    selectedProfiles,
    systemMetrics,
    throughput,
    latency,
    security,
    cost,
    reliability,
    warnings,
    synergyPairs,
    conflictPairs,
    missingRequirements,
  }
}
