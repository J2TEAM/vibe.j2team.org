import type {
  BodyMatcherEntry,
  JsonObject,
  JsonValue,
  MatcherEntry,
  MockRule,
  PairEntry,
  RequestContext,
  RequestDraft,
  ResponseMapEntry,
  RuleMethod,
  SimulationRunOutput,
} from '../types'

import type { HttpMethod } from '../types'

export const REQUEST_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
export const RULE_METHODS: RuleMethod[] = ['ANY', ...REQUEST_METHODS]

export function createId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36)}`
}

export function createPair(key = '', value = ''): PairEntry {
  return { id: createId('pair'), key, value }
}

export function createMatcher(key = '', expected = ''): MatcherEntry {
  return { id: createId('matcher'), key, expected }
}

export function createBodyMatcher(path = '', expected = ''): BodyMatcherEntry {
  return { id: createId('body'), path, expected }
}

export function createStatusEntry(key: string, status: number, message: string, body: string): ResponseMapEntry {
  return { id: createId('status'), key, status, message, body }
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function stripWrappingQuotes(value: string): string {
  const trimmed = value.trim()
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
    || (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

export function normalizeEndpoint(rawValue: string): string {
  const value = stripWrappingQuotes(rawValue)
  if (!value) {
    return '/'
  }

  if (value.startsWith('http://') || value.startsWith('https://')) {
    try {
      return new URL(value).pathname || '/'
    } catch {
      return '/'
    }
  }

  const clean = value.split('?')[0] ?? value
  if (clean.startsWith('/')) {
    return clean
  }

  return `/${clean}`
}

function isJsonObject(value: JsonValue): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function safeParseJson(text: string, fallbackToObject = true): { ok: true; value: JsonValue } | { ok: false; error: string } {
  const value = text.trim()
  if (!value) {
    return { ok: true, value: fallbackToObject ? {} : '' }
  }

  try {
    return { ok: true, value: JSON.parse(value) as JsonValue }
  } catch {
    return { ok: false, error: 'Body phải là JSON hợp lệ.' }
  }
}

function parseResponseBody(text: string): string {
  const parsed = safeParseJson(text, false)
  if (parsed.ok) {
    if (typeof parsed.value === 'string') {
      return parsed.value
    }
    return JSON.stringify(parsed.value, null, 2)
  }
  return text
}

function valueToText(value: JsonValue): string {
  if (typeof value === 'string') {
    return value
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  if (value === null) {
    return 'null'
  }
  return JSON.stringify(value)
}

function getPathValue(root: JsonValue, rawPath: string): string | null {
  const path = rawPath.trim()
  if (!path) {
    return null
  }

  const segments = path.split('.').map((segment) => segment.trim()).filter(Boolean)
  let current: JsonValue = root

  for (const segment of segments) {
    if (Array.isArray(current)) {
      const index = Number(segment)
      if (!Number.isInteger(index)) {
        return null
      }

      const next = current[index]
      if (next === undefined) {
        return null
      }
      current = next
      continue
    }

    if (!isJsonObject(current)) {
      return null
    }

    const next = current[segment]
    if (next === undefined) {
      return null
    }

    current = next
  }

  return valueToText(current)
}

function toLookup(pairs: PairEntry[]): Record<string, string> {
  const map: Record<string, string> = {}
  for (const pair of pairs) {
    const key = pair.key.trim().toLowerCase()
    if (!key) {
      continue
    }
    map[key] = pair.value.trim()
  }
  return map
}

function matchExpected(expectedValue: string, actualValue: string | undefined): boolean {
  if (actualValue === undefined) {
    return false
  }

  const expected = expectedValue.trim()
  const actual = actualValue.trim()

  if (expected === '*') {
    return true
  }

  if (expected.startsWith('re:')) {
    try {
      const pattern = expected.slice(3)
      return new RegExp(pattern, 'i').test(actual)
    } catch {
      return false
    }
  }

  if (expected.includes('*')) {
    const regexSource = `^${escapeRegex(expected).replace(/\\\*/g, '.*')}$`
    return new RegExp(regexSource, 'i').test(actual)
  }

  return actual.toLowerCase() === expected.toLowerCase()
}

function matchEndpoint(patternValue: string, endpointValue: string): boolean {
  const pattern = stripWrappingQuotes(patternValue)
  if (!pattern || pattern === '*') {
    return true
  }

  const normalizedPattern = normalizeEndpoint(pattern)
  const normalizedEndpoint = normalizeEndpoint(endpointValue)
  const regexSource = `^${escapeRegex(normalizedPattern).replace(/\\\*/g, '.*')}$`
  return new RegExp(regexSource, 'i').test(normalizedEndpoint)
}

function getFailedKeyMatchers(matchers: MatcherEntry[], lookup: Record<string, string>): string[] {
  const failures: string[] = []

  for (const matcher of matchers) {
    const key = matcher.key.trim().toLowerCase()
    const expected = matcher.expected.trim()
    if (!key || !expected) {
      continue
    }

    const actual = lookup[key]
    if (!matchExpected(expected, actual)) {
      failures.push(`${key} expected "${expected}" but got "${actual ?? '(missing)'}"`)
    }
  }

  return failures
}

function getFailedBodyMatchers(matchers: BodyMatcherEntry[], body: JsonValue): string[] {
  const failures: string[] = []

  for (const matcher of matchers) {
    const path = matcher.path.trim()
    const expected = matcher.expected.trim()
    if (!path || !expected) {
      continue
    }

    const actual = getPathValue(body, path)
    if (actual === null || !matchExpected(expected, actual)) {
      failures.push(`${path} expected "${expected}" but got "${actual ?? '(missing)'}"`)
    }
  }

  return failures
}

export function ensureRuleConsistency(rule: MockRule): void {
  if (rule.statusMap.length === 0) {
    rule.statusMap.push(createStatusEntry('ok', 200, 'Fallback response', '{\n  "ok": true\n}'))
  }

  const normalizedDefault = rule.defaultStatusKey.trim().toLowerCase()
  const hasDefault = rule.statusMap.some((entry) => entry.key.trim().toLowerCase() === normalizedDefault)

  if (!hasDefault) {
    const first = rule.statusMap[0]
    rule.defaultStatusKey = first ? first.key : 'ok'
  }
}

function resolveStatusKey(rule: MockRule, context: RequestContext): string {
  const headerKey = rule.statusSelectorHeader.trim().toLowerCase()
  const queryKey = rule.statusSelectorQuery.trim().toLowerCase()
  const bodyPath = rule.statusSelectorBodyPath.trim()

  const fromHeader = headerKey ? context.headerLookup[headerKey] : undefined
  const fromQuery = queryKey ? context.queryLookup[queryKey] : undefined
  const fromBody = bodyPath ? getPathValue(context.body, bodyPath) : null

  const candidate = fromHeader ?? fromQuery ?? fromBody ?? rule.defaultStatusKey
  const normalized = candidate.trim().toLowerCase()
  if (!normalized) {
    return rule.defaultStatusKey.trim().toLowerCase()
  }
  return normalized
}

function resolveTemplateToken(token: string, context: RequestContext, statusKey: string): string {
  if (token === 'request.method') {
    return context.method
  }
  if (token === 'request.endpoint') {
    return context.endpoint
  }
  if (token === 'statusKey') {
    return statusKey
  }
  if (token === 'timestamp') {
    return new Date().toISOString()
  }
  if (token.startsWith('query.')) {
    return context.queryLookup[token.slice(6).toLowerCase()] ?? ''
  }
  if (token.startsWith('header.')) {
    return context.headerLookup[token.slice(7).toLowerCase()] ?? ''
  }
  if (token.startsWith('body.')) {
    return getPathValue(context.body, token.slice(5)) ?? ''
  }
  return ''
}

function renderResponseTemplate(template: string, context: RequestContext, statusKey: string): string {
  return template.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_match, token) =>
    resolveTemplateToken(token.trim(), context, statusKey),
  )
}

function clampStatusCode(status: number): number {
  if (Number.isFinite(status) && status >= 100 && status <= 599) {
    return Math.round(status)
  }
  return 200
}

function shellEscapeSingleQuote(value: string): string {
  return value.replace(/'/g, `"'"'`)
}

interface CurlPreviewOptions {
  baseOrigin?: string
  basePath?: string
}

function normalizeCurlBasePath(rawPath: string | undefined): string {
  const value = (rawPath ?? '').trim()
  if (!value) {
    return ''
  }

  const withLeadingSlash = value.startsWith('/') ? value : `/${value}`
  const noTrailingSlash = withLeadingSlash.replace(/\/+$/g, '')
  return noTrailingSlash === '/' ? '' : noTrailingSlash
}

export function buildCurlPreview(requestDraft: RequestDraft, options: CurlPreviewOptions = {}): string {
  const endpoint = normalizeEndpoint(requestDraft.endpoint)
  const queryEntries = requestDraft.query
    .map((pair) => ({ key: pair.key.trim(), value: pair.value.trim() }))
    .filter((pair) => pair.key)
  const queryString = queryEntries.map((pair) => `${encodeURIComponent(pair.key)}=${encodeURIComponent(pair.value)}`).join('&')
  const origin = options.baseOrigin?.trim() || 'https://mock.local'
  const basePath = normalizeCurlBasePath(options.basePath)

  const url = `${origin}${basePath}${endpoint}${queryString ? `?${queryString}` : ''}`

  const lines: string[] = [`curl -X ${requestDraft.method} '${url}'`]
  for (const header of requestDraft.headers) {
    const key = header.key.trim()
    if (!key) {
      continue
    }
    lines.push(`  -H '${shellEscapeSingleQuote(`${key}: ${header.value.trim()}`)}'`)
  }

  const bodyText = requestDraft.body.trim()
  if (bodyText) {
    lines.push(`  -d '${shellEscapeSingleQuote(bodyText)}'`)
  }

  return lines.join(' \\\n')
}

export function cloneRule(rule: MockRule): MockRule {
  return {
    ...rule,
    id: createId('rule'),
    name: `${rule.name} (copy)`,
    queryMatchers: rule.queryMatchers.map((matcher) => ({ ...matcher, id: createId('matcher') })),
    headerMatchers: rule.headerMatchers.map((matcher) => ({ ...matcher, id: createId('matcher') })),
    bodyMatchers: rule.bodyMatchers.map((matcher) => ({ ...matcher, id: createId('body') })),
    statusMap: rule.statusMap.map((entry) => ({ ...entry, id: createId('status') })),
  }
}

export function runMockSimulation(rules: MockRule[], requestDraft: RequestDraft): SimulationRunOutput {
  const parsedBody = safeParseJson(requestDraft.body)
  if (!parsedBody.ok) {
    return {
      result: null,
      error: parsedBody.error,
    }
  }

  const context: RequestContext = {
    method: requestDraft.method,
    endpoint: normalizeEndpoint(requestDraft.endpoint),
    queryLookup: toLookup(requestDraft.query),
    headerLookup: toLookup(requestDraft.headers),
    body: parsedBody.value,
  }

  const diagnostics: string[] = []

  let matchedRule: MockRule | undefined
  for (const rule of rules) {
    const reasons: string[] = []

    const ruleName = rule.name?.trim() || '(untitled rule)'
    const isEnabled = rule.enabled !== false
    if (!isEnabled) {
      reasons.push('disabled')
    }

    const method = rule.method || 'ANY'
    if (method !== 'ANY' && method !== context.method) {
      reasons.push(`method mismatch (${method} != ${context.method})`)
    }

    if (!matchEndpoint(rule.endpointPattern, context.endpoint)) {
      reasons.push(`endpoint mismatch (${rule.endpointPattern || '(empty)'} != ${context.endpoint})`)
    }

    const queryFailures = getFailedKeyMatchers(rule.queryMatchers, context.queryLookup)
    if (queryFailures.length > 0) {
      reasons.push(`query: ${queryFailures.join('; ')}`)
    }

    const headerFailures = getFailedKeyMatchers(rule.headerMatchers, context.headerLookup)
    if (headerFailures.length > 0) {
      reasons.push(`header: ${headerFailures.join('; ')}`)
    }

    const bodyFailures = getFailedBodyMatchers(rule.bodyMatchers, context.body)
    if (bodyFailures.length > 0) {
      reasons.push(`body: ${bodyFailures.join('; ')}`)
    }

    if (reasons.length === 0) {
      matchedRule = rule
      diagnostics.push(`MATCHED ${ruleName}`)
      break
    }

    diagnostics.push(`${ruleName}: ${reasons.join(' | ')}`)
  }

  if (!matchedRule) {
    return {
      result: {
        matchedRuleName: null,
        status: 404,
        statusKey: 'none',
        latencyMs: Math.floor(100 + Math.random() * 220),
        reason: 'Không có rule nào khớp với request hiện tại.',
        responseHeaders: {
          'content-type': 'application/json',
          'x-mock-rule': 'none',
        },
        responseBody: '{\n  "error": "mock_rule_not_found",\n  "hint": "Kiểm tra method, endpoint pattern, matcher của query/header/body."\n}',
        diagnostics,
      },
      error: '',
    }
  }

  const statusKey = resolveStatusKey(matchedRule, context)
  const byStatusKey = matchedRule.statusMap.find((entry) => entry.key.trim().toLowerCase() === statusKey)
  const byDefault = matchedRule.statusMap.find(
    (entry) => entry.key.trim().toLowerCase() === matchedRule.defaultStatusKey.trim().toLowerCase(),
  )
  const selectedEntry = byStatusKey ?? byDefault ?? matchedRule.statusMap[0]

  if (!selectedEntry) {
    return {
      result: {
        matchedRuleName: matchedRule.name,
        status: 500,
        statusKey,
        latencyMs: 0,
        reason: 'Rule không có status map hợp lệ.',
        responseHeaders: {
          'content-type': 'application/json',
          'x-mock-rule': matchedRule.name,
        },
        responseBody: '{\n  "error": "invalid_status_map"\n}',
      },
      error: '',
    }
  }

  const renderedBody = renderResponseTemplate(selectedEntry.body, context, statusKey)
  return {
    result: {
      matchedRuleName: matchedRule.name,
      status: clampStatusCode(selectedEntry.status),
      statusKey,
      latencyMs: Math.floor(80 + Math.random() * 520),
      reason: selectedEntry.message,
      responseHeaders: {
        'content-type': 'application/json',
        'x-mock-rule': matchedRule.name,
        'x-mock-status-key': statusKey,
        'x-mock-method': context.method,
      },
      responseBody: parseResponseBody(renderedBody),
      diagnostics,
    },
    error: '',
  }
}
