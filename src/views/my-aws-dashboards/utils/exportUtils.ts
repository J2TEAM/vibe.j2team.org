import type { CostReport, XLSXLibrary } from '../types'

function formatUSD(value: number): string {
  return `$${value.toFixed(2)}`
}

function csvEscape(value: string | number): string {
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function buildCsvRows(report: CostReport): (string | number)[][] {
  const { timeSeries, serviceBreakdown, dateRange, granularity, totalCost, currency } = report
  const services = serviceBreakdown.map((s) => s.service)

  const rows: (string | number)[][] = []

  // Header metadata
  rows.push(['AWS Cost Report'])
  rows.push(['Date Range', `${dateRange.start} to ${dateRange.end}`])
  rows.push(['Granularity', granularity])
  rows.push(['Total Cost', formatUSD(totalCost)])
  rows.push(['Currency', currency])
  rows.push([])

  // Time series section
  rows.push(['Cost Over Time'])
  rows.push(['Period', ...services, 'Total'])
  timeSeries.forEach((point) => {
    const row: (string | number)[] = [point.label]
    services.forEach((svc) => row.push(point.services[svc] ?? 0))
    row.push(point.total)
    rows.push(row)
  })

  rows.push([])

  // Service breakdown section
  rows.push(['Service Breakdown'])
  rows.push(['Service', 'Total Cost (USD)', 'Percentage (%)'])
  serviceBreakdown.forEach((entry) => {
    rows.push([entry.service, entry.cost, `${entry.percentage}%`])
  })

  return rows
}

export function downloadCsv(report: CostReport): void {
  const rows = buildCsvRows(report)
  const csv = rows.map((row) => row.map((cell) => csvEscape(cell)).join(',')).join('\n')

  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `aws-cost-report-${report.dateRange.start}-to-${report.dateRange.end}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export async function downloadXlsx(report: CostReport, xlsxLib: XLSXLibrary): Promise<void> {
  const { timeSeries, serviceBreakdown, dateRange, granularity, totalCost, currency } = report
  const services = serviceBreakdown.map((s) => s.service)

  // Summary sheet
  const summaryData: (string | number)[][] = [
    ['AWS Cost Report'],
    ['Date Range', `${dateRange.start} to ${dateRange.end}`],
    ['Granularity', granularity],
    ['Total Cost', totalCost],
    ['Currency', currency],
  ]

  // Time series sheet
  const timeSeriesData: (string | number)[][] = [
    ['Period', ...services, 'Total'],
    ...timeSeries.map((point) => {
      const row: (string | number)[] = [point.label]
      services.forEach((svc) => row.push(point.services[svc] ?? 0))
      row.push(point.total)
      return row
    }),
  ]

  // Service breakdown sheet
  const breakdownData: (string | number)[][] = [
    ['Service', 'Total Cost (USD)', 'Percentage (%)'],
    ...serviceBreakdown.map((entry) => [entry.service, entry.cost, entry.percentage]),
  ]

  const wb = xlsxLib.utils.book_new()
  xlsxLib.utils.book_append_sheet(wb, xlsxLib.utils.aoa_to_sheet(summaryData), 'Summary')
  xlsxLib.utils.book_append_sheet(wb, xlsxLib.utils.aoa_to_sheet(timeSeriesData), 'Cost Over Time')
  xlsxLib.utils.book_append_sheet(
    wb,
    xlsxLib.utils.aoa_to_sheet(breakdownData),
    'Service Breakdown',
  )

  xlsxLib.writeFile(wb, `aws-cost-report-${dateRange.start}-to-${dateRange.end}.xlsx`)
}
