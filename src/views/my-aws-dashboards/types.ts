/** @deprecated Use CognitoConfig + CognitoSession instead */
export interface AwsCredentials {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  sessionToken: string
  region: string
}

/** Non-secret Cognito Identity Pool configuration stored in localStorage */
export interface CognitoConfig {
  identityPoolId: string
  region: string
  /** ARN of the unauthenticated IAM role attached to the Identity Pool */
  roleArn: string
}

/** Temporary credentials obtained from Cognito — stored in memory only, never persisted */
export interface CognitoSession {
  accessKeyId: string
  secretAccessKey: string
  sessionToken: string
  identityId: string
  region: string
  /** Unix timestamp (ms) at which this app session expires (5 min from login) */
  expiresAt: number
}

export type Granularity = 'DAILY' | 'MONTHLY'

export type ChartType = 'bar' | 'line' | 'pie' | 'stacked'

export type SortField = 'service' | 'cost' | 'percentage'

export type SortDir = 'asc' | 'desc'

export interface ServiceCostEntry {
  service: string
  cost: number
  percentage: number
  unit: string
}

export interface TimeSeriesPoint {
  period: string
  label: string
  services: Record<string, number>
  total: number
}

export interface CostReport {
  dateRange: { start: string; end: string }
  granularity: Granularity
  currency: string
  totalCost: number
  previousTotalCost: number
  timeSeries: TimeSeriesPoint[]
  serviceBreakdown: ServiceCostEntry[]
}

// Chart.js types (loaded via CDN)
export interface ChartDataset {
  label: string
  data: number[]
  backgroundColor?: string | string[]
  borderColor?: string | string[]
  borderWidth?: number
  fill?: boolean
  tension?: number
  stack?: string
  hoverOffset?: number
}

export interface ChartData {
  labels: string[]
  datasets: ChartDataset[]
}

export interface ChartScaleConfig {
  stacked?: boolean
  display?: boolean
  grid?: { color?: string; display?: boolean }
  ticks?: {
    color?: string
    callback?: (value: number | string) => string
    maxRotation?: number
    font?: { family?: string }
  }
  border?: { display?: boolean }
}

export interface ChartTitleConfig {
  display?: boolean
  text?: string
  color?: string
}

export interface ChartLegendConfig {
  display?: boolean
  position?: string
  labels?: { color?: string; font?: { family?: string }; padding?: number; boxWidth?: number }
}

export interface ChartTooltipCallbacks {
  label?: (context: ChartCallbackContext) => string
  title?: (contexts: ChartCallbackContext[]) => string
}

export interface ChartConfig {
  type: string
  data: ChartData
  options: {
    responsive: boolean
    maintainAspectRatio: boolean
    animation?: { duration?: number }
    plugins?: {
      legend?: ChartLegendConfig
      tooltip?: {
        callbacks?: ChartTooltipCallbacks
        backgroundColor?: string
        titleColor?: string
        bodyColor?: string
        borderColor?: string
        borderWidth?: number
      }
      title?: ChartTitleConfig
    }
    scales?: Record<string, ChartScaleConfig>
    layout?: { padding?: number | { top?: number; bottom?: number; left?: number; right?: number } }
  }
}

export interface ChartJsInstance {
  destroy(): void
  update(): void
  data: ChartData
}

export interface ChartCallbackContext {
  label: string
  raw: number
  dataset: ChartDataset
  dataIndex: number
  formattedValue: string
}

export type ChartJsConstructor = new (
  canvas: HTMLCanvasElement,
  config: ChartConfig,
) => ChartJsInstance

export interface XLSXWorksheet {
  [key: string]: { v: string | number; t: string } | { '!ref': string }
}

export interface XLSXWorkbook {
  SheetNames: string[]
  Sheets: Record<string, XLSXWorksheet>
}

export interface XLSXLibrary {
  utils: {
    book_new(): XLSXWorkbook
    book_append_sheet(wb: XLSXWorkbook, ws: XLSXWorksheet, name: string): void
    aoa_to_sheet(data: (string | number)[][]): XLSXWorksheet
  }
  writeFile(wb: XLSXWorkbook, filename: string): void
}
