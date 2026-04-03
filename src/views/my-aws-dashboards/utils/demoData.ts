import type { TimeSeriesPoint, ServiceCostEntry, CostReport } from '../types'

export const AWS_REGIONS = [
  { value: 'us-east-1', label: 'US East (N. Virginia)' },
  { value: 'us-east-2', label: 'US East (Ohio)' },
  { value: 'us-west-1', label: 'US West (N. California)' },
  { value: 'us-west-2', label: 'US West (Oregon)' },
  { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
  { value: 'ap-southeast-2', label: 'Asia Pacific (Sydney)' },
  { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' },
  { value: 'ap-south-1', label: 'Asia Pacific (Mumbai)' },
  { value: 'eu-west-1', label: 'Europe (Ireland)' },
  { value: 'eu-central-1', label: 'Europe (Frankfurt)' },
  { value: 'sa-east-1', label: 'South America (São Paulo)' },
] as const

export const DEMO_SERVICES = [
  'Amazon EC2',
  'Amazon RDS',
  'Amazon S3',
  'AWS Lambda',
  'Amazon CloudFront',
  'Amazon Route 53',
  'AWS WAF',
  'Amazon ElastiCache',
  'AWS Data Transfer',
  'Amazon SES',
] as const

// Base monthly costs (USD) per service
const MONTHLY_BASE: Record<string, number> = {
  'Amazon EC2': 1234.56,
  'Amazon RDS': 456.78,
  'Amazon S3': 89.12,
  'AWS Lambda': 23.45,
  'Amazon CloudFront': 67.89,
  'Amazon Route 53': 5.0,
  'AWS WAF': 45.0,
  'Amazon ElastiCache': 234.56,
  'AWS Data Transfer': 123.45,
  'Amazon SES': 12.34,
}

// Growth multipliers per month (simulates organic growth)
const MONTHLY_GROWTH = [0.82, 0.88, 0.93, 0.97, 1.0, 1.04]

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function addNoise(base: number, seed: number): number {
  // Deterministic "noise" based on seed so data is stable
  const noise = (((seed * 9301 + 49297) % 233280) / 233280) * 0.2 - 0.1
  return round2(base * (1 + noise))
}

function formatPeriod(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

function formatPeriodLabel(period: string): string {
  const [year, month] = period.split('-')
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]
  const monthIndex = parseInt(month ?? '1') - 1
  return `${months[monthIndex] ?? month} ${year}`
}

function generateMonthlyPeriods(start: string, end: string): string[] {
  const periods: string[] = []
  const [sy, sm] = start.split('-').map(Number)
  const [ey, em] = end.split('-').map(Number)

  if (sy === undefined || sm === undefined || ey === undefined || em === undefined) return periods

  let year = sy
  let month = sm
  while (year < ey || (year === ey && month <= em)) {
    periods.push(formatPeriod(year, month))
    month++
    if (month > 12) {
      month = 1
      year++
    }
  }
  return periods
}

function generateDailyPeriods(start: string, end: string): string[] {
  const periods: string[] = []
  const startDate = new Date(start + 'T00:00:00')
  const endDate = new Date(end + 'T00:00:00')

  const curr = new Date(startDate)
  while (curr <= endDate) {
    periods.push(curr.toISOString().slice(0, 10))
    curr.setDate(curr.getDate() + 1)
  }
  return periods
}

export function generateDemoReport(
  start: string,
  end: string,
  granularity: 'DAILY' | 'MONTHLY',
  selectedServices: string[],
): CostReport {
  const services = selectedServices.length > 0 ? selectedServices : [...DEMO_SERVICES]

  // Reference date for growth index
  const refYear = 2025
  const refMonth = 11 // November 2025

  let timeSeries: TimeSeriesPoint[]

  if (granularity === 'MONTHLY') {
    const periods = generateMonthlyPeriods(start.slice(0, 7), end.slice(0, 7))
    timeSeries = periods.map((period, idx) => {
      const [year, month] = period.split('-').map(Number)
      if (year === undefined || month === undefined)
        return { period, label: period, services: {}, total: 0 }

      const monthsFromRef = (year - refYear) * 12 + (month - refMonth)
      const growthIdx = Math.min(Math.max(monthsFromRef + 3, 0), MONTHLY_GROWTH.length - 1)
      const growth = MONTHLY_GROWTH[growthIdx] ?? 1.0

      const servicesMap: Record<string, number> = {}
      let total = 0
      services.forEach((svc, svcIdx) => {
        const base = (MONTHLY_BASE[svc] ?? 10) * growth
        const cost = addNoise(base, idx * 13 + svcIdx * 7)
        servicesMap[svc] = cost
        total += cost
      })

      return {
        period,
        label: formatPeriodLabel(period),
        services: servicesMap,
        total: round2(total),
      }
    })
  } else {
    const periods = generateDailyPeriods(start, end)
    timeSeries = periods.map((period, idx) => {
      const date = new Date(period + 'T00:00:00')
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      const monthsFromRef = (year - refYear) * 12 + (month - refMonth)
      const growthIdx = Math.min(Math.max(monthsFromRef + 3, 0), MONTHLY_GROWTH.length - 1)
      const growth = MONTHLY_GROWTH[growthIdx] ?? 1.0

      const servicesMap: Record<string, number> = {}
      let total = 0
      services.forEach((svc, svcIdx) => {
        const dailyBase = ((MONTHLY_BASE[svc] ?? 10) / 30) * growth
        const cost = addNoise(dailyBase, idx * 13 + svcIdx * 7)
        servicesMap[svc] = cost
        total += cost
      })

      return { period, label: period, services: servicesMap, total: round2(total) }
    })
  }

  const totalCost = round2(timeSeries.reduce((s, p) => s + p.total, 0))

  // Calculate previous period total (same length, shifted back)
  const periodCount = timeSeries.length
  const prevTimeSeries = [...timeSeries].slice(0, Math.ceil(periodCount / 2))
  const previousTotalCost = round2(prevTimeSeries.reduce((s, p) => s + p.total, 0) * 0.95)

  // Service breakdown
  const serviceBreakdown: ServiceCostEntry[] = services
    .map((svc) => ({
      service: svc,
      cost: round2(timeSeries.reduce((s, p) => s + (p.services[svc] ?? 0), 0)),
      percentage: 0,
      unit: 'USD',
    }))
    .map((entry) => ({
      ...entry,
      percentage: totalCost > 0 ? round2((entry.cost / totalCost) * 100) : 0,
    }))
    .sort((a, b) => b.cost - a.cost)

  return {
    dateRange: { start, end },
    granularity,
    currency: 'USD',
    totalCost,
    previousTotalCost,
    timeSeries,
    serviceBreakdown,
  }
}
