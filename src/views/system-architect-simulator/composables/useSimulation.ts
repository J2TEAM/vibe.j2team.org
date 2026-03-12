import { ref, type Ref } from 'vue'
import type { NodeData, EdgeData, SimHint, SimStats, EventLog, StressEvent } from '../types'
import { nodeTypeMap } from '../constants'
import { getEffectiveCapacity, formatTraffic, getNodeCost } from '../utils'

import type { InstanceTier } from '../hardware'

const TIER_ORDER: InstanceTier[] = ['nano', 'micro', 'small', 'medium', 'large', 'xlarge']

function downsizeTier(current: string): InstanceTier {
  const idx = TIER_ORDER.indexOf(current as InstanceTier)
  return idx > 0 ? TIER_ORDER[idx - 1]! : (current as InstanceTier)
}

function upsizeTier(current: string): InstanceTier {
  const idx = TIER_ORDER.indexOf(current as InstanceTier)
  return idx >= 0 && idx < TIER_ORDER.length - 1 ? TIER_ORDER[idx + 1]! : (current as InstanceTier)
}

export function useSimulation(
  nodes: Ref<NodeData[]>,
  edges: Ref<EdgeData[]>,
  totalMonthlyCost: Ref<number>,
) {
  const simulationHints = ref<SimHint[]>([])
  const simulationStats = ref<SimStats | null>(null)
  const timelineRunning = ref(false)
  const timelineProgress = ref(0)
  const eventLogs = ref<EventLog[]>([])
  const showEventLogs = ref(true)
  const activeStressEvent = ref<StressEvent | null>(null)

  const addLog = (
    source: string,
    message: string,
    type: 'info' | 'warning' | 'error' | 'debug' = 'info',
  ) => {
    const now = new Date()
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`
    eventLogs.value.push({ id: `log-${Date.now()}-${Math.random()}`, time, source, message, type })
    if (eventLogs.value.length > 100) eventLogs.value.shift()
  }

  const resetSimulation = () => {
    nodes.value.forEach((n) => {
      n.currentTraffic = 0
      n.isOverloaded = false
      n.hasWarning = false
      n.currentErrorRate = 0
      n.circuitOpen = false
    })
    edges.value.forEach((e) => {
      e.traffic = 0
    })
    timelineRunning.value = false
    timelineProgress.value = 0
  }

  const runSimulation = (trafficMultiplier = 1, readPercentOverride?: number) => {
    resetSimulation()

    const clients = nodes.value.filter((n) => n.type === 'CLIENT')
    interface QueueItem {
      id: string
      readTraffic: number
      writeTraffic: number
    }
    const queue: QueueItem[] = []

    clients.forEach((c) => {
      const total = (c.config.inputTraffic || 0) * trafficMultiplier
      const readPct = (readPercentOverride ?? c.config.readPercent ?? 70) / 100
      c.currentTraffic = total
      queue.push({ id: c.id, readTraffic: total * readPct, writeTraffic: total * (1 - readPct) })
    })

    let iterations = 0
    const latencyPaths: number[] = []
    let totalRequests = 0
    let failedRequests = 0

    while (queue.length > 0 && iterations < 2000) {
      const current = queue.shift()!
      iterations++
      const totalTraffic = current.readTraffic + current.writeTraffic
      if (totalTraffic <= 0) continue

      const currentNode = nodes.value.find((n) => n.id === current.id)
      if (!currentNode) continue

      let effectiveRead = current.readTraffic
      let effectiveWrite = current.writeTraffic

      if (currentNode.type === 'RATELIMIT') {
        const limit = currentNode.config.rateLimit || getEffectiveCapacity(currentNode)
        const total = effectiveRead + effectiveWrite
        if (total > limit) {
          const ratio = limit / total
          const dropped = total - limit
          failedRequests += dropped
          effectiveRead *= ratio
          effectiveWrite *= ratio
          if (Math.random() < 0.05)
            addLog(
              currentNode.id,
              `Rate limit exceeded. Dropped ${formatTraffic(dropped)} req/s.`,
              'warning',
            )
        }
      }

      if (currentNode.type !== 'CLIENT') {
        const cap = getEffectiveCapacity(currentNode)
        if (cap > 0 && (currentNode.currentTraffic || 0) > cap * 1.2) {
          if (!currentNode.circuitOpen) {
            addLog(
              currentNode.id,
              `CIRCUIT BREAKER OPENED! Load exceeded 120% capacity (${formatTraffic(currentNode.currentTraffic || 0)}/${formatTraffic(cap)} req/s).`,
              'error',
            )
          }
          currentNode.circuitOpen = true
          failedRequests += effectiveRead + effectiveWrite
          continue
        }
      }

      const outEdges = edges.value.filter((e) => e.fromNodeId === current.id)
      if (outEdges.length === 0) {
        totalRequests += effectiveRead + effectiveWrite
        latencyPaths.push(currentNode.config.latency || 0)
        continue
      }

      const perEdgeRead = effectiveRead / outEdges.length
      const perEdgeWrite = effectiveWrite / outEdges.length

      outEdges.forEach((edge) => {
        const target = nodes.value.find((n) => n.id === edge.toNodeId)
        if (!target) return

        let nodeRead = perEdgeRead
        let nodeWrite = perEdgeWrite

        if (target.type === 'CACHE') nodeWrite = 0
        if (target.type === 'QUEUE') nodeRead = 0

        const nodeTraffic = nodeRead + nodeWrite
        edge.traffic = (edge.traffic || 0) + nodeTraffic
        target.currentTraffic = (target.currentTraffic || 0) + nodeTraffic

        if (target.type !== 'CLIENT') {
          const cap = getEffectiveCapacity(target)
          const util = cap > 0 ? (target.currentTraffic || 0) / cap : 0
          const baseErr = target.config.chaosErrorRate ?? target.config.baseErrorRate ?? 0
          const loadErr = util > 0.8 ? Math.pow((util - 0.8) * 5, 2) * 10 : 0
          target.currentErrorRate = Math.min(100, baseErr + loadErr)
          failedRequests += nodeTraffic * (target.currentErrorRate / 100)

          if (target.currentErrorRate > 10 && Math.random() < 0.05) {
            addLog(
              target.id,
              `High error rate detected: ${target.currentErrorRate.toFixed(1)}% due to ${Math.round(util * 100)}% load.`,
              'warning',
            )
          }
        }

        totalRequests += nodeTraffic
        latencyPaths.push(target.config.latency || 0)
        queue.push({ id: target.id, readTraffic: nodeRead, writeTraffic: nodeWrite })
      })
    }

    // Diagnostics & Hints
    const hints: SimHint[] = []
    let overloadCount = 0,
      warningCount = 0

    nodes.value.forEach((node) => {
      if (node.type === 'CLIENT') return
      const cap = getEffectiveCapacity(node)
      const util = cap > 0 ? ((node.currentTraffic || 0) / cap) * 100 : 0

      if ((node.currentTraffic || 0) > cap && cap > 0) {
        node.isOverloaded = true
        overloadCount++
        const currentTier = node.config.instanceTier || 'micro'
        const nextTier = upsizeTier(currentTier)
        hints.push({
          icon: '🔴',
          color: 'text-accent-coral',
          title: `${node.id} · ${nodeTypeMap[node.type]?.label} QUÁ TẢI`,
          message: `${formatTraffic(node.currentTraffic || 0)}/${formatTraffic(cap)} req/s (${Math.round(util)}%). ${(node.config.replicas || 1) > 1 ? 'Tăng thêm replica' : 'Thêm replica (hiện có 1)'} hoặc nâng cấu hình.`,
          action:
            nextTier !== currentTier
              ? {
                  label: `Scale lên ${nextTier.toUpperCase()} + thêm 1 replica`,
                  apply: () => {
                    node.config.instanceTier = nextTier
                    node.config.replicas = (node.config.replicas || 1) + 1
                  },
                }
              : {
                  label: `Thêm 1 replica`,
                  apply: () => {
                    node.config.replicas = (node.config.replicas || 1) + 1
                  },
                },
        })
      } else if ((node.currentTraffic || 0) > cap * 0.8 && cap > 0) {
        node.hasWarning = true
        warningCount++
        hints.push({
          icon: '🟡',
          color: 'text-accent-amber',
          title: `${node.id} CẢNH BÁO (${Math.round(util)}%)`,
          message: `Gần ngưỡng quá tải. Cân nhắc scale lên ${(node.config.replicas || 1) + 1} replica.`,
          action: {
            label: `Tăng lên ${(node.config.replicas || 1) + 1} replica`,
            apply: () => {
              node.config.replicas = (node.config.replicas || 1) + 1
            },
          },
        })
      }
      if (node.circuitOpen) {
        hints.push({
          icon: '🔌',
          color: 'text-accent-coral',
          title: `${node.id} CIRCUIT BREAKER OPEN`,
          message: 'Node bị ngắt do quá tải >120%. Traffic bị reject hoàn toàn.',
          action: {
            label: 'Tăng 2 replica',
            apply: () => {
              node.config.replicas = (node.config.replicas || 1) + 2
            },
          },
        })
      }
    })

    nodes.value.forEach((node) => {
      if (
        !edges.value.some((e) => e.fromNodeId === node.id || e.toNodeId === node.id) &&
        nodes.value.length > 1
      ) {
        hints.push({
          icon: '⚪',
          color: 'text-text-dim',
          title: `${node.id} CHƯA KẾT NỐI`,
          message: 'Node chưa nối với hệ thống.',
        })
      }
    })

    if (overloadCount === 0 && warningCount === 0 && nodes.value.length > 1) {
      hints.unshift({
        icon: '✅',
        color: 'text-accent-sky',
        title: 'HỆ THỐNG ỔN ĐỊNH',
        message: `Không phát hiện nút cổ chai. Chi phí: $${totalMonthlyCost.value}/tháng.`,
      })
    } else if (overloadCount > 0) {
      hints.unshift({
        icon: '⚠️',
        color: 'text-accent-coral',
        title: `${overloadCount} NÚT CỔ CHAI`,
        message: `${overloadCount} node quá tải, ${warningCount} cảnh báo.`,
      })
    }

    if (overloadCount > 0) {
      if (!nodes.value.some((n) => n.type === 'LB'))
        hints.push({
          icon: '💡',
          color: 'text-accent-sky',
          title: 'GỢI Ý: THÊM LOAD BALANCER',
          message: 'Phân phối traffic đều hơn giữa các instance.',
        })
      if (!nodes.value.some((n) => n.type === 'CACHE'))
        hints.push({
          icon: '💡',
          color: 'text-accent-sky',
          title: 'GỢI Ý: THÊM CACHE',
          message: 'Giảm tải read requests. Cache xử lý 20k req/s với $60/tháng.',
        })
      if (!nodes.value.some((n) => n.type === 'QUEUE'))
        hints.push({
          icon: '💡',
          color: 'text-accent-sky',
          title: 'GỢI Ý: THÊM QUEUE',
          message: 'Xử lý write async, tránh overload downstream.',
        })
      if (!nodes.value.some((n) => n.type === 'CDN'))
        hints.push({
          icon: '💡',
          color: 'text-accent-sky',
          title: 'GỢI Ý: THÊM CDN',
          message: 'CDN xử lý 100k req/s ở edge, giảm tải origin server chỉ $50/tháng.',
        })
    }

    const costHints: SimHint[] = []
    let totalSavings = 0

    nodes.value.forEach((node) => {
      if (node.type === 'CLIENT' || node.type === 'RATELIMIT') return

      const cap = getEffectiveCapacity(node)
      const traffic = node.currentTraffic || 0
      const replicas = node.config.replicas || 1
      const typeDef = nodeTypeMap[node.type]
      const tier = node.config.instanceTier || 'micro'

      if (!typeDef || cap === 0) return
      const util = (traffic / cap) * 100

      // Right-sizing replicas
      if (replicas > 1 && util < 50) {
        const singleCap = cap / replicas
        const neededReplicas = Math.max(1, Math.ceil(traffic / singleCap / 0.7))
        if (neededReplicas < replicas) {
          const savings =
            (replicas - neededReplicas) *
            getNodeCost({ ...node, config: { ...node.config, replicas: 1 } })
          totalSavings += savings
          costHints.push({
            icon: '💰',
            color: 'text-accent-amber',
            title: `${node.id} THỪA REPLICA`,
            message: `Chỉ dùng ${Math.round(util)}% capacity với ${replicas} replica. Giảm còn ${neededReplicas} replica vẫn đạt ~70% utilization. Tiết kiệm $${savings}/tháng.`,
            action: {
              label: `Giảm còn ${neededReplicas} replica`,
              apply: () => {
                node.config.replicas = neededReplicas
              },
            },
          })
        }
      }

      // Downsizing instance type
      if (replicas === 1 && util < 30 && traffic > 0 && tier !== 'nano' && tier !== 'custom') {
        const lowerTier = downsizeTier(tier)
        costHints.push({
          icon: '📉',
          color: 'text-accent-amber',
          title: `${node.id} CẤU HÌNH QUÁ CAO`,
          message: `Chỉ dùng ${Math.round(util)}% capacity (${formatTraffic(traffic)}/${formatTraffic(cap)} req/s). Cân nhắc hạ Instance Tier (hiện tại: ${tier.toUpperCase()}) xuống mức thấp hơn để giảm chi phí.`,
          action: {
            label: `Hạ xuống ${lowerTier.toUpperCase()}`,
            apply: () => {
              node.config.instanceTier = lowerTier
            },
          },
        })
      }

      // Expensive node with low traffic
      if (getNodeCost(node) >= 80 && traffic < cap * 0.2) {
        const lowerTier = downsizeTier(tier)
        costHints.push({
          icon: '🏷️',
          color: 'text-accent-amber',
          title: `${node.id} CHI PHÍ CAO, TẢI THẤP`,
          message: `Đang trả $${getNodeCost(node)}/tháng nhưng chỉ dùng ${Math.round(util)}% tài nguyên. Xem xét dùng tier nhỏ hơn hoặc serverless.`,
          action:
            tier !== 'nano' && tier !== 'custom'
              ? {
                  label: `Hạ xuống ${lowerTier.toUpperCase()}`,
                  apply: () => {
                    node.config.instanceTier = lowerTier
                  },
                }
              : undefined,
        })
      }
    })

    const servicesByType: Record<string, NodeData[]> = {}
    nodes.value.forEach((n) => {
      if (n.type !== 'CLIENT' && n.type !== 'LB' && n.type !== 'CDN') {
        if (!servicesByType[n.type]) servicesByType[n.type] = []
        servicesByType[n.type]!.push(n)
      }
    })

    Object.entries(servicesByType).forEach(([type, svcNodes]) => {
      if (svcNodes.length >= 2) {
        const allLowUtil = svcNodes.every((n) => {
          const cap = getEffectiveCapacity(n)
          return cap > 0 && (n.currentTraffic || 0) < cap * 0.3
        })
        if (allLowUtil) {
          const typeDef = nodeTypeMap[type]
          const savingsIfMerge = (svcNodes.length - 1) * (typeDef?.costPerInstance || 0)
          totalSavings += savingsIfMerge
          costHints.push({
            icon: '🔗',
            color: 'text-accent-amber',
            title: `GỘP ${svcNodes.length} ${typeDef?.label || type}`,
            message: `${svcNodes.map((n) => n.id).join(', ')} đều dưới 30% tải. Gộp lại thành 1 node tiết kiệm ~$${savingsIfMerge}/tháng.`,
          })
        }
      }
    })

    const cacheNodes = nodes.value.filter((n) => n.type === 'CACHE')
    const dbNodes = nodes.value.filter((n) => n.type === 'DB')
    if (cacheNodes.length > 0 && dbNodes.length > 0) {
      dbNodes.forEach((db) => {
        const dbTraffic = db.currentTraffic || 0
        const dbCap = getEffectiveCapacity(db)
        if (dbTraffic > dbCap * 0.7) {
          costHints.push({
            icon: '⚡',
            color: 'text-accent-sky',
            title: `${db.id} TỐI ƯU CACHE HIT RATE`,
            message: `Database tải ${Math.round((dbTraffic / dbCap) * 100)}%. Tăng cache TTL hoặc warm-up cache để giảm read xuống DB, thay vì scale DB ($${nodeTypeMap['DB']?.costPerInstance || 200}/replica).`,
          })
        }
      })
    }

    const highLatencyNodes = nodes.value.filter(
      (n) => n.type !== 'CLIENT' && (n.config.latency || 0) > 30 && (n.currentTraffic || 0) > 0,
    )
    if (highLatencyNodes.length > 0 && overloadCount === 0) {
      const nodeSummary = highLatencyNodes.map((n) => `${n.id} (${n.config.latency}ms)`).join(', ')
      costHints.push({
        icon: '⏱️',
        color: 'text-accent-sky',
        title: 'TRADEOFF: LATENCY vs CHI PHÍ',
        message: `${nodeSummary} có latency cao. Nếu chấp nhận latency hiện tại, không cần thêm cache/replica. Nếu cần giảm P99, thêm cache trước node chậm.`,
      })
    }

    if (totalSavings > 0) {
      costHints.unshift({
        icon: '💵',
        color: 'text-accent-amber',
        title: `TIẾT KIỆM TỚI ~$${totalSavings}/THÁNG`,
        message: `Áp dụng các gợi ý bên dưới để giảm chi phí từ $${totalMonthlyCost.value} xuống ~$${totalMonthlyCost.value - totalSavings}/tháng mà vẫn đảm bảo hệ thống hoạt động ổn.`,
      })
    } else if (nodes.value.length > 1 && overloadCount === 0) {
      costHints.push({
        icon: '✅',
        color: 'text-accent-sky',
        title: 'CHI PHÍ HỢP LÝ',
        message: `$${totalMonthlyCost.value}/tháng cho ${nodes.value.length - nodes.value.filter((n) => n.type === 'CLIENT').length} node. Chưa phát hiện lãng phí rõ ràng.`,
      })
    }

    simulationHints.value = [...hints, ...costHints]

    const sorted = [...latencyPaths].sort((a, b) => a - b)
    const cumulative = sorted.reduce((acc: number[], v) => {
      acc.push((acc.length ? acc[acc.length - 1]! : 0) + v)
      return acc
    }, [])
    const p50 = cumulative[Math.floor(sorted.length * 0.5)] || 0
    const p99 = cumulative[Math.floor(sorted.length * 0.99)] || 0
    const successRate =
      totalRequests > 0
        ? Math.max(0, ((totalRequests - failedRequests) / totalRequests) * 100)
        : 100

    simulationStats.value = {
      p50Latency: Math.round(p50),
      p99Latency: Math.round(p99),
      successRate: Math.round(successRate * 10) / 10,
    }
  }

  const startTimelineSimulation = () => {
    if (nodes.value.length === 0) return
    timelineRunning.value = true
    showEventLogs.value = true
    timelineProgress.value = 0
    eventLogs.value = []

    const event = activeStressEvent.value
    if (event) {
      addLog('SYSTEM', `Started Stress Event: ${event.name}`, 'warning')
    } else {
      addLog('SYSTEM', 'Timeline simulation started', 'info')
    }
    const totalBaseTraffic = nodes.value
      .filter((n) => n.type === 'CLIENT')
      .reduce((sum, c) => sum + (c.config.inputTraffic || 0), 0)

    const steps = event ? Math.ceil(event.duration / 0.4) : 20
    let step = 0

    const interval = setInterval(() => {
      step++
      timelineProgress.value = (step / steps) * 100

      let multiplier = 0.1 + (step / steps) * 1.9
      let readOverride = undefined

      if (event) {
        readOverride = event.readPercentOverride
        if (event.rampUp) {
          multiplier = 1 + (step / steps) * (event.trafficMultiplier - 1)
        } else {
          const ramp = Math.min(1, step / 3) // Fast ramp in ~1.2s
          multiplier = 1 + ramp * (event.trafficMultiplier - 1)
        }
      }

      const currentTraffic = Math.round(totalBaseTraffic * multiplier)

      if (step % 4 === 1)
        addLog(
          'TRAFFIC',
          `Traffic load at ${Math.round(multiplier * 100)}% (${formatTraffic(currentTraffic)} req/s total)`,
          'debug',
        )

      runSimulation(multiplier, readOverride)

      // Auto-scale Logic
      nodes.value.forEach((n) => {
        if (n.type === 'CLIENT' || n.type === 'RATELIMIT') return
        if (n.config.autoScale) {
          const cap = getEffectiveCapacity(n)
          const traffic = n.currentTraffic || 0
          const util = cap > 0 ? traffic / cap : 0
          const threshold = (n.config.scaleUpThreshold || 80) / 100

          if (util > threshold) {
            const lastScale = n.config._lastScaleStep || 0
            if (step - lastScale >= 3) {
              const current = n.config.replicas || 1
              const max = n.config.maxReplicas || 10
              if (current < max) {
                n.config.replicas = current + 1
                n.config._lastScaleStep = step
                addLog(n.id, `⚡ Auto-scaled from ${current} → ${current + 1} replicas`, 'info')
              }
            }
          }
        }
      })

      if (step >= steps) {
        clearInterval(interval)
        setTimeout(() => {
          timelineRunning.value = false
          addLog('SYSTEM', 'Simulation completed. Generating analysis report...', 'info')
          if (event) stopStressEvent()
        }, 500)
      }
    }, 400)
  }

  const triggerStressEvent = (event: StressEvent) => {
    activeStressEvent.value = event

    if (event.id === 'region-failover') {
      addLog('CHAOS', '💥 Region Failover triggered! Halving replicas for all services...', 'error')
      nodes.value.forEach((n) => {
        if (['SERVICE', 'CACHE', 'DB', 'GATEWAY', 'QUEUE'].includes(n.type)) {
          const r = n.config.replicas || 1
          if (r > 1) n.config.replicas = Math.max(1, Math.floor(r / 2))
        }
      })
    } else if (event.id === 'cascade-failure') {
      const services = nodes.value.filter((n) => n.type === 'SERVICE')
      if (services.length > 0) {
        const target = services[Math.floor(Math.random() * services.length)]
        if (target) {
          addLog(
            'CHAOS',
            `⛓️ Cascade Failure: Injecting 100% error rate into ${target.id}`,
            'error',
          )
          target.config.chaosErrorRate = 100
        }
      }
    }

    startTimelineSimulation()
  }

  const stopStressEvent = () => {
    if (activeStressEvent.value?.id === 'cascade-failure') {
      nodes.value.forEach((n) => {
        delete n.config.chaosErrorRate
      })
    }
    activeStressEvent.value = null
  }

  return {
    simulationHints,
    simulationStats,
    timelineRunning,
    timelineProgress,
    eventLogs,
    showEventLogs,
    addLog,
    resetSimulation,
    runSimulation,
    startTimelineSimulation,
    triggerStressEvent,
    stopStressEvent,
    activeStressEvent,
  }
}
