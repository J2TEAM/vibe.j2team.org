import type { CostReport, ChartConfig, ChartDataset, ChartType } from '../types'

// Chart color palette for data series (distinct, accessible)
export const CHART_COLORS = [
  '#FF6B4A', // coral
  '#FFB830', // amber
  '#38BDF8', // sky
  '#A78BFA', // violet
  '#34D399', // emerald
  '#F472B6', // pink
  '#FB923C', // orange
  '#60A5FA', // blue
  '#4ADE80', // green
  '#E879F9', // fuchsia
] as const

const CHART_GRID_COLOR = 'rgba(37, 53, 73, 0.8)' // border-default
const CHART_TEXT_COLOR = '#8B9DB5' // text-secondary
const CHART_BG_COLOR = 'rgba(22, 34, 50, 0.95)' // bg-surface
const CHART_FONT_FAMILY = "'Anybody', 'Be Vietnam Pro', sans-serif"

function formatUSD(value: number): string {
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`
  return `$${value.toFixed(2)}`
}

export function buildChartConfig(report: CostReport, chartType: ChartType): ChartConfig {
  const { timeSeries, serviceBreakdown } = report
  const labels = timeSeries.map((p) => p.label)
  const services = serviceBreakdown.map((s) => s.service)

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 400 },
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: {
          color: CHART_TEXT_COLOR,
          font: { family: CHART_FONT_FAMILY },
          padding: 16,
          boxWidth: 12,
        },
      },
      tooltip: {
        backgroundColor: CHART_BG_COLOR,
        titleColor: '#F0EDE6',
        bodyColor: CHART_TEXT_COLOR,
        borderColor: '#253549',
        borderWidth: 1,
        callbacks: {
          label: (ctx: { dataset: { label?: string }; raw: number }) =>
            ` ${ctx.dataset.label ?? ''}: ${formatUSD(ctx.raw)}`,
        },
      },
    },
  }

  if (chartType === 'pie') {
    return {
      type: 'doughnut',
      data: {
        labels: services,
        datasets: [
          {
            label: 'Cost by Service',
            data: serviceBreakdown.map((s) => s.cost),
            backgroundColor: CHART_COLORS.slice(0, services.length),
            borderColor: '#162232',
            borderWidth: 2,
            hoverOffset: 8,
          },
        ],
      },
      options: {
        ...commonOptions,
        layout: { padding: 16 },
        plugins: {
          ...commonOptions.plugins,
          tooltip: {
            ...commonOptions.plugins.tooltip,
            callbacks: {
              label: (ctx: { label?: string; raw: number; dataset: { data: number[] } }) => {
                const total = ctx.dataset.data.reduce((a, b) => a + b, 0)
                const pct = total > 0 ? ((ctx.raw / total) * 100).toFixed(1) : '0'
                return ` ${ctx.label ?? ''}: ${formatUSD(ctx.raw)} (${pct}%)`
              },
            },
          },
        },
      },
    }
  }

  if (chartType === 'line') {
    const datasets: ChartDataset[] = services.map((svc, i) => ({
      label: svc,
      data: timeSeries.map((p) => p.services[svc] ?? 0),
      backgroundColor: (CHART_COLORS[i % CHART_COLORS.length] ?? '#FF6B4A') + '20',
      borderColor: CHART_COLORS[i % CHART_COLORS.length] ?? '#FF6B4A',
      borderWidth: 2,
      fill: false,
      tension: 0.4,
    }))

    return {
      type: 'line',
      data: { labels, datasets },
      options: {
        ...commonOptions,
        scales: {
          x: {
            grid: { color: CHART_GRID_COLOR },
            ticks: {
              color: CHART_TEXT_COLOR,
              font: { family: CHART_FONT_FAMILY },
              maxRotation: 45,
            },
            border: { display: false },
          },
          y: {
            grid: { color: CHART_GRID_COLOR },
            ticks: {
              color: CHART_TEXT_COLOR,
              callback: (v: number | string) => formatUSD(Number(v)),
            },
            border: { display: false },
          },
        },
      },
    }
  }

  if (chartType === 'stacked') {
    const datasets: ChartDataset[] = services.map((svc, i) => ({
      label: svc,
      data: timeSeries.map((p) => p.services[svc] ?? 0),
      backgroundColor: CHART_COLORS[i % CHART_COLORS.length] ?? '#FF6B4A',
      borderColor: '#162232',
      borderWidth: 1,
      stack: 'total',
    }))

    return {
      type: 'bar',
      data: { labels, datasets },
      options: {
        ...commonOptions,
        scales: {
          x: {
            stacked: true,
            grid: { color: CHART_GRID_COLOR },
            ticks: { color: CHART_TEXT_COLOR, maxRotation: 45 },
            border: { display: false },
          },
          y: {
            stacked: true,
            grid: { color: CHART_GRID_COLOR },
            ticks: {
              color: CHART_TEXT_COLOR,
              callback: (v: number | string) => formatUSD(Number(v)),
            },
            border: { display: false },
          },
        },
      },
    }
  }

  // Default: grouped bar chart
  const datasets: ChartDataset[] = services.map((svc, i) => ({
    label: svc,
    data: timeSeries.map((p) => p.services[svc] ?? 0),
    backgroundColor: CHART_COLORS[i % CHART_COLORS.length] ?? '#FF6B4A',
    borderColor: '#162232',
    borderWidth: 1,
  }))

  return {
    type: 'bar',
    data: { labels, datasets },
    options: {
      ...commonOptions,
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: CHART_TEXT_COLOR, maxRotation: 45 },
          border: { display: false },
        },
        y: {
          grid: { color: CHART_GRID_COLOR },
          ticks: {
            color: CHART_TEXT_COLOR,
            callback: (v: number | string) => formatUSD(Number(v)),
          },
          border: { display: false },
        },
      },
    },
  }
}
