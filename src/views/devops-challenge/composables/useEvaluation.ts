import type { Challenge, EvaluationResult, MetricBreakdown, SystemMetrics } from '../types'
import { techMap } from '../data/technologies'

function computeSubScore(actual: number, required: number, higherIsBetter: boolean): number {
  if (required === 0) return 100
  const ratio = higherIsBetter ? actual / required : required / actual
  if (ratio >= 1.5) return 100
  if (ratio >= 1.0) return 70 + (ratio - 1.0) * 60
  return Math.max(0, ratio * 50)
}

function generateTips(breakdown: MetricBreakdown[]): string[] {
  const tips: string[] = []

  for (const item of breakdown) {
    if (item.subScore < 40) {
      switch (item.metric) {
        case 'throughput':
          tips.push(
            `⚠️ Throughput quá thấp (${item.actual} vs yêu cầu ${item.required} req/s). Hãy thêm Load Balancer, Cache hoặc chọn backend nhanh hơn (Go, Rust).`,
          )
          break
        case 'latency':
          tips.push(
            `⚠️ Độ trễ quá cao (${item.actual}ms vs yêu cầu ${item.required}ms). Cache và CDN giúp giảm latency đáng kể.`,
          )
          break
        case 'security':
          tips.push(
            `⚠️ Bảo mật quá thấp (${item.actual} vs yêu cầu ${item.required}). Thêm WAF, Auth system, SSL vào stack.`,
          )
          break
        case 'cost':
          tips.push(
            `⚠️ Vượt ngân sách ($${item.actual} vs giới hạn $${item.required}/tháng). Chọn tech rẻ hơn hoặc bỏ những thứ chưa cần.`,
          )
          break
        case 'reliability':
          tips.push(
            `⚠️ Độ tin cậy thấp (${item.actual}% vs yêu cầu ${item.required}%). Container (K8s) và Monitoring giúp tăng uptime.`,
          )
          break
      }
    } else if (item.subScore < 70) {
      switch (item.metric) {
        case 'throughput':
          tips.push(
            `💡 Throughput gần đạt. Thêm Cache hoặc CDN để đạt yêu cầu ${item.required} req/s.`,
          )
          break
        case 'latency':
          tips.push(
            `💡 Latency gần đạt (${item.actual}ms). Thử thêm Cache layer để giảm xuống dưới ${item.required}ms.`,
          )
          break
        case 'security':
          tips.push(`💡 Bảo mật chưa đủ. Thêm 1-2 công cụ security nữa (WAF, Rate Limiter, Vault).`)
          break
        case 'cost':
          tips.push(`💡 Gần vượt ngân sách. Cân nhắc thay tech đắt bằng lựa chọn rẻ hơn.`)
          break
        case 'reliability':
          tips.push(`💡 Độ tin cậy gần đạt. Monitoring và CI/CD giúp tăng thêm vài %.`)
          break
      }
    } else if (item.subScore >= 90) {
      switch (item.metric) {
        case 'throughput':
          tips.push(`✅ Throughput xuất sắc! Hệ thống xử lý tốt ${item.actual} req/s.`)
          break
        case 'latency':
          tips.push(`✅ Latency rất thấp (${item.actual}ms). Trải nghiệm người dùng sẽ mượt mà.`)
          break
        case 'security':
          tips.push(`✅ Bảo mật vững chắc (${item.actual}/100). Hệ thống được bảo vệ tốt.`)
          break
        case 'cost':
          tips.push(`✅ Chi phí tối ưu ($${item.actual}/tháng). Tiết kiệm tốt!`)
          break
        case 'reliability':
          tips.push(`✅ Độ tin cậy cao (${item.actual}%). Hệ thống rất ổn định.`)
          break
      }
    }
  }

  return tips
}

function getOptimalTechIds(challenge: Challenge): string[] {
  const optimal: string[] = []
  const difficulty = challenge.difficulty

  // Simple heuristic: pick best tech per required category based on difficulty
  const categoryPicks: Record<string, string> = {
    frontend: difficulty === 'expert' || difficulty === 'hard' ? 'nextjs' : 'vue',
    backend:
      difficulty === 'expert'
        ? 'java-spring'
        : difficulty === 'hard'
          ? 'golang'
          : difficulty === 'medium'
            ? 'nodejs'
            : 'php-laravel',
    database:
      challenge.constraints.minSecurity >= 80
        ? 'postgresql'
        : difficulty === 'expert'
          ? 'cassandra'
          : 'postgresql',
    cache: 'redis',
    'message-queue': difficulty === 'expert' ? 'kafka' : 'rabbitmq',
    cdn: 'cloudflare-cdn',
    'load-balancer': difficulty === 'expert' ? 'haproxy' : 'nginx-lb',
    container: difficulty === 'hard' || difficulty === 'expert' ? 'kubernetes' : 'docker-compose',
    monitoring: difficulty === 'expert' ? 'prometheus-grafana' : 'sentry',
    'ci-cd': 'github-actions',
    security: challenge.constraints.minSecurity >= 90 ? 'vault' : 'cloudflare-waf',
    storage: 'aws-s3',
  }

  for (const cat of challenge.constraints.requiredCategories) {
    const pick = categoryPicks[cat]
    if (pick && techMap.has(pick)) {
      optimal.push(pick)
    }
  }

  // Add security extras for high security requirements
  if (challenge.constraints.minSecurity >= 70 && !optimal.includes('auth0')) {
    optimal.push('auth0')
  }
  if (challenge.constraints.minSecurity >= 80 && !optimal.includes('letsencrypt')) {
    optimal.push('letsencrypt')
  }

  return optimal
}

export function evaluateSolution(challenge: Challenge, metrics: SystemMetrics): EvaluationResult {
  const breakdown: MetricBreakdown[] = [
    {
      metric: 'throughput',
      metricVi: 'Thông lượng',
      actual: metrics.throughput,
      required: challenge.constraints.minThroughput,
      subScore: Math.round(
        computeSubScore(metrics.throughput, challenge.constraints.minThroughput, true),
      ),
      unit: 'req/s',
    },
    {
      metric: 'latency',
      metricVi: 'Độ trễ',
      actual: metrics.latency,
      required: challenge.constraints.maxLatency,
      subScore: Math.round(
        computeSubScore(metrics.latency, challenge.constraints.maxLatency, false),
      ),
      unit: 'ms',
    },
    {
      metric: 'security',
      metricVi: 'Bảo mật',
      actual: metrics.security,
      required: challenge.constraints.minSecurity,
      subScore: Math.round(
        computeSubScore(metrics.security, challenge.constraints.minSecurity, true),
      ),
      unit: '/100',
    },
    {
      metric: 'cost',
      metricVi: 'Chi phí',
      actual: metrics.cost,
      required: challenge.constraints.maxCost,
      subScore: Math.round(computeSubScore(metrics.cost, challenge.constraints.maxCost, false)),
      unit: '$/tháng',
    },
    {
      metric: 'reliability',
      metricVi: 'Độ tin cậy',
      actual: metrics.reliability,
      required: challenge.constraints.minReliability,
      subScore: Math.round(
        computeSubScore(metrics.reliability, challenge.constraints.minReliability, true),
      ),
      unit: '%',
    },
  ]

  const score = Math.round(
    breakdown[0]!.subScore * 0.25 +
      breakdown[1]!.subScore * 0.25 +
      breakdown[2]!.subScore * 0.2 +
      breakdown[3]!.subScore * 0.15 +
      breakdown[4]!.subScore * 0.15,
  )

  let stars: 0 | 1 | 2 | 3 = 0
  if (score >= challenge.starThresholds.three) stars = 3
  else if (score >= challenge.starThresholds.two) stars = 2
  else if (score >= challenge.starThresholds.one) stars = 1

  const tips = generateTips(breakdown)
  const optimalTechIds = getOptimalTechIds(challenge)

  return {
    score,
    stars,
    passed: stars > 0,
    breakdown,
    tips,
    optimalTechIds,
  }
}
