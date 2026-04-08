import { ref, computed } from 'vue'
import type { CostReport, Granularity } from '../types'
import { generateDemoReport } from '../utils/demoData'
import { signRequest } from '../utils/sigv4'

export type FetchStatus = 'idle' | 'loading' | 'demo' | 'error'

type AwsCostResponse = {
  ResultsByTime: {
    TimePeriod: { Start: string }
    Groups: { Keys: string[]; Metrics: { BlendedCost: { Amount: string; Unit: string } } }[]
    Total?: { BlendedCost?: { Amount: string } }
  }[]
}

function parseAwsResponse(
  data: AwsCostResponse,
  start: string,
  end: string,
  granularity: Granularity,
  selectedServices: string[],
): CostReport {
  const allServices = new Set<string>()
  data.ResultsByTime.forEach((result) => {
    result.Groups.forEach((g) => {
      const svc = g.Keys[0]
      if (svc) allServices.add(svc)
    })
  })

  const services = [...allServices]
  const filtered =
    selectedServices.length > 0 ? services.filter((s) => selectedServices.includes(s)) : services

  const timeSeries = data.ResultsByTime.map((result) => {
    const period = result.TimePeriod.Start
    const servicesMap: Record<string, number> = {}
    let total = 0

    result.Groups.filter((g) => {
      const svc = g.Keys[0]
      return svc && (filtered.length === 0 || filtered.includes(svc))
    }).forEach((g) => {
      const svc = g.Keys[0] ?? ''
      const amount = parseFloat(g.Metrics.BlendedCost.Amount)
      servicesMap[svc] = Math.round(amount * 100) / 100
      total += amount
    })

    total = Math.round(total * 100) / 100
    return { period, label: period, services: servicesMap, total }
  })

  const totalCost = Math.round(timeSeries.reduce((s, p) => s + p.total, 0) * 100) / 100
  const serviceBreakdown = filtered
    .map((svc) => ({
      service: svc,
      cost: Math.round(timeSeries.reduce((s, p) => s + (p.services[svc] ?? 0), 0) * 100) / 100,
      percentage: 0,
      unit: 'USD',
    }))
    .map((e) => ({
      ...e,
      percentage: totalCost > 0 ? Math.round((e.cost / totalCost) * 10000) / 100 : 0,
    }))
    .sort((a, b) => b.cost - a.cost)

  return {
    dateRange: { start, end },
    granularity,
    currency: 'USD',
    totalCost,
    previousTotalCost: 0,
    timeSeries,
    serviceBreakdown,
  }
}

export function useAwsCost() {
  const status = ref<FetchStatus>('idle')
  const errorMessage = ref('')
  const report = ref<CostReport | null>(null)
  const isDemoMode = ref(true)

  const isLoading = computed(() => status.value === 'loading')
  const hasReport = computed(() => report.value !== null)

  function loadDemoData(
    start: string,
    end: string,
    granularity: Granularity,
    selectedServices: string[],
  ): void {
    status.value = 'loading'
    // Simulate a small async delay for UX
    setTimeout(() => {
      report.value = generateDemoReport(start, end, granularity, selectedServices)
      status.value = 'demo'
      isDemoMode.value = true
    }, 400)
  }

  /**
   * NOTE: AWS Cost Explorer API does NOT support CORS for browser requests.
   * Direct browser calls to https://ce.us-east-1.amazonaws.com/ will fail
   * with a CORS error regardless of credentials.
   *
   * This function signs each request with AWS Signature Version 4 (SigV4) and
   * attempts the call, then falls back to demo mode on failure.
   * To use real data without CORS issues, run the equivalent AWS CLI command:
   *   aws ce get-cost-and-usage --time-period Start=<start>,End=<end> \
   *     --granularity MONTHLY --group-by Type=DIMENSION,Key=SERVICE \
   *     --metrics BlendedCost
   */
  async function loadRealData(
    accessKeyId: string,
    secretAccessKey: string,
    sessionToken: string,
    region: string,
    start: string,
    end: string,
    granularity: Granularity,
    selectedServices: string[],
  ): Promise<void> {
    status.value = 'loading'
    errorMessage.value = ''

    try {
      const SERVICE = 'ce'
      // Cost Explorer endpoint is always us-east-1 regardless of the account region
      const HOST = 'ce.us-east-1.amazonaws.com'
      const TARGET = 'AWSInsightsIndexService.GetCostAndUsage'
      const CONTENT_TYPE = 'application/x-amz-json-1.1'

      const body = JSON.stringify({
        TimePeriod: { Start: start, End: end },
        Granularity: granularity,
        GroupBy: [{ Type: 'DIMENSION', Key: 'SERVICE' }],
        Metrics: ['BlendedCost'],
      })

      const signedHeaders = await signRequest({
        accessKeyId,
        secretAccessKey,
        sessionToken: sessionToken || undefined,
        region: 'us-east-1', // CE is a global service, always us-east-1
        service: SERVICE,
        host: HOST,
        method: 'POST',
        path: '/',
        body,
        amzTarget: TARGET,
        contentType: CONTENT_TYPE,
      })

      const response = await fetch(`https://${HOST}/`, {
        method: 'POST',
        headers: signedHeaders,
        body,
        signal: AbortSignal.timeout(15000),
      })

      if (!response.ok) {
        // Parse AWS error body for a more helpful message
        let awsErrorMsg = `HTTP ${response.status}`
        try {
          const errBody = (await response.json()) as {
            __type?: string
            message?: string
            Message?: string
          }
          const errType = errBody.__type?.split('#').pop() ?? ''
          const errDetail = errBody.message ?? errBody.Message ?? ''
          if (errType) awsErrorMsg += `: ${errType}`
          if (errDetail) awsErrorMsg += ` — ${errDetail}`

          if (response.status === 400) {
            if (errType.includes('InvalidSignature') || errType.includes('AuthFailure')) {
              awsErrorMsg =
                'Authentication failed (HTTP 400 InvalidSignatureException). Check that your Access Key ID and Secret Access Key are correct and have not expired.'
            } else if (errType.includes('UnknownOperation')) {
              awsErrorMsg =
                'HTTP 400 UnknownOperationException — AWS could not identify the requested operation. ' +
                'This usually means Cost Explorer has not been activated for your account. ' +
                'Go to AWS Billing Console → Cost Explorer → "Enable Cost Explorer" and wait up to 24 hours for data to become available. ' +
                'If you already enabled it, note that CORS-bypass browser extensions can strip signed headers, causing this error.'
            } else if (errType.includes('ValidationException')) {
              awsErrorMsg = `Invalid request parameters (HTTP 400 ValidationException): ${errDetail}`
            } else if (errType.includes('DataUnavailable')) {
              awsErrorMsg =
                'Cost data is not yet available for this account (HTTP 400 DataUnavailableException). Cost Explorer must be enabled in the AWS Billing console first.'
            } else if (!errType) {
              awsErrorMsg =
                'HTTP 400 Bad Request — The request was rejected by AWS. This is usually caused by missing or invalid AWS Signature headers. Ensure your credentials are valid.'
            }
          } else if (response.status === 403) {
            awsErrorMsg = `Access denied (HTTP 403${errType ? ` ${errType}` : ''}). Ensure your IAM user has the "ce:GetCostAndUsage" permission.`
          }
        } catch {
          // could not parse JSON body — keep the generic message
        }
        throw new Error(awsErrorMsg)
      }

      // Parse the response
      const data = (await response.json()) as AwsCostResponse
      if (!data.ResultsByTime) throw new Error('Unexpected response format')

      // Parse and store
      report.value = parseAwsResponse(data, start, end, granularity, selectedServices)
      status.value = 'idle'
      isDemoMode.value = false
    } catch (err) {
      let msg: string
      if (err instanceof TypeError) {
        // Network-level failure — almost always a CORS block
        msg =
          'CORS Error: AWS Cost Explorer does not allow direct browser requests. Showing demo data instead. Use the AWS CLI for real data.'
      } else if (err instanceof DOMException && err.name === 'TimeoutError') {
        msg = 'Request timed out. Check your network connection and try again.'
      } else if (err instanceof Error) {
        msg = err.message
      } else {
        msg = 'Unknown error'
      }

      errorMessage.value = msg
      status.value = 'error'
      // Fall back to demo data
      loadDemoData(start, end, granularity, selectedServices)
    }
  }

  /**
   * Parse and load data from pasted AWS CLI JSON output.
   * Accepts the raw JSON string returned by:
   *   aws ce get-cost-and-usage --granularity MONTHLY ...
   */
  function loadFromCliOutput(
    jsonString: string,
    granularity: Granularity,
    selectedServices: string[],
  ): string | null {
    let parsed: unknown
    try {
      parsed = JSON.parse(jsonString.trim())
    } catch {
      return 'Invalid JSON — paste the raw output from the AWS CLI command.'
    }

    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('ResultsByTime' in parsed) ||
      !Array.isArray((parsed as Record<string, unknown>).ResultsByTime)
    ) {
      return 'Unrecognised format. Expected AWS CLI output with a "ResultsByTime" array.'
    }

    const data = parsed as AwsCostResponse
    if (data.ResultsByTime.length === 0) {
      return 'No cost data found in the provided output. The date range may have no billing data.'
    }

    const start = data.ResultsByTime[0]?.TimePeriod.Start ?? ''
    const last = data.ResultsByTime[data.ResultsByTime.length - 1]
    const end = last?.TimePeriod.Start ?? start

    report.value = parseAwsResponse(data, start, end, granularity, selectedServices)
    status.value = 'idle'
    isDemoMode.value = false
    errorMessage.value = ''
    return null // success
  }

  return {
    status,
    errorMessage,
    report,
    isDemoMode,
    isLoading,
    hasReport,
    loadDemoData,
    loadRealData,
    loadFromCliOutput,
  }
}
