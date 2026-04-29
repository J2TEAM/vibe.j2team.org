export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
export type RuleMethod = HttpMethod | 'ANY'

export type JsonPrimitive = string | number | boolean | null
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[]
export type JsonObject = { [key: string]: JsonValue }

export interface PairEntry {
  id: string
  key: string
  value: string
}

export interface MatcherEntry {
  id: string
  key: string
  expected: string
}

export interface BodyMatcherEntry {
  id: string
  path: string
  expected: string
}

export interface ResponseMapEntry {
  id: string
  key: string
  status: number
  message: string
  body: string
}

export interface MockRule {
  id: string
  name: string
  description: string
  enabled: boolean
  method: RuleMethod
  endpointPattern: string
  queryMatchers: MatcherEntry[]
  headerMatchers: MatcherEntry[]
  bodyMatchers: BodyMatcherEntry[]
  statusSelectorHeader: string
  statusSelectorQuery: string
  statusSelectorBodyPath: string
  statusMap: ResponseMapEntry[]
  defaultStatusKey: string
}

export interface RequestDraft {
  method: HttpMethod
  endpoint: string
  query: PairEntry[]
  headers: PairEntry[]
  body: string
}

export interface RequestContext {
  method: HttpMethod
  endpoint: string
  queryLookup: Record<string, string>
  headerLookup: Record<string, string>
  body: JsonValue
}

export interface SimulationResult {
  matchedRuleName: string | null
  status: number
  statusKey: string
  latencyMs: number
  reason: string
  responseHeaders: Record<string, string>
  responseBody: string
  diagnostics?: string[]
}

export interface SimulationRunOutput {
  result: SimulationResult | null
  error: string
}

export type CopyTarget = 'curl' | 'response' | ''
