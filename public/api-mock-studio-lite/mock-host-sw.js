const DEFAULT_BASE_PATH = '/api-mock-studio-lite/mock'

const runtimeConfig = {
  enabled: false,
  basePath: DEFAULT_BASE_PATH,
  rules: [],
}

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('message', (event) => {
  const data = event.data || {}
  if (data.type === 'configure') {
    const payload = data.payload || {}
    runtimeConfig.enabled = payload.enabled === true
    runtimeConfig.basePath = normalizeBasePath(payload.basePath)
    runtimeConfig.rules = Array.isArray(payload.rules) ? payload.rules : []

    const port = event.ports && event.ports[0]
    if (port) {
      port.postMessage({ type: 'configured' })
    }
    return
  }

  if (data.type === 'get-state') {
    const port = event.ports && event.ports[0]
    if (port) {
      port.postMessage({
        type: 'state',
        payload: {
          enabled: runtimeConfig.enabled,
          basePath: runtimeConfig.basePath,
          rulesCount: runtimeConfig.rules.length,
        },
      })
    }
  }
})

self.addEventListener('fetch', (event) => {
  if (!runtimeConfig.enabled) {
    return
  }

  const requestUrl = new URL(event.request.url)
  if (!isPathInsideBase(requestUrl.pathname, runtimeConfig.basePath)) {
    return
  }

  event.respondWith(handleMockRequest(event.request, requestUrl))
})

async function handleMockRequest(request, requestUrl) {
  if (request.method.toUpperCase() === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: buildCorsHeaders(),
    })
  }

  const endpointPath = normalizeEndpoint(requestUrl.pathname.slice(runtimeConfig.basePath.length) || '/')

  if (endpointPath === '/__health') {
    return buildJsonResponse(
      {
        enabled: runtimeConfig.enabled,
        basePath: runtimeConfig.basePath,
        rulesCount: runtimeConfig.rules.length,
      },
      200,
      {
        'x-mock-host': 'api-mock-studio-lite',
      },
    )
  }

  let requestBody = ''
  try {
    requestBody = await request.text()
  } catch {
    requestBody = ''
  }

  const requestDraft = {
    method: request.method.toUpperCase(),
    endpoint: endpointPath,
    query: Array.from(requestUrl.searchParams.entries()).map(([key, value]) => ({ key, value })),
    headers: Array.from(request.headers.entries()).map(([key, value]) => ({ key, value })),
    body: requestBody,
  }

  const output = runMockSimulation(runtimeConfig.rules, requestDraft)

  if (output.error) {
    return buildJsonResponse(
      {
        error: 'invalid_request_body',
        message: output.error,
      },
      400,
      {
        'x-mock-host': 'api-mock-studio-lite',
      },
    )
  }

  if (!output.result) {
    return buildJsonResponse(
      {
        error: 'simulation_failed',
      },
      500,
      {
        'x-mock-host': 'api-mock-studio-lite',
      },
    )
  }

  const headers = {
    ...buildCorsHeaders(),
    ...output.result.responseHeaders,
    'x-mock-host': 'api-mock-studio-lite',
    'x-mock-latency-ms': String(output.result.latencyMs),
  }

  return new Response(output.result.responseBody, {
    status: output.result.status,
    headers,
  })
}

function buildCorsHeaders() {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'access-control-allow-headers': '*',
  }
}

function buildJsonResponse(payload, status, extraHeaders) {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: {
      ...buildCorsHeaders(),
      'content-type': 'application/json',
      ...extraHeaders,
    },
  })
}

function normalizeBasePath(pathValue) {
  const value = typeof pathValue === 'string' ? pathValue.trim() : ''
  if (!value) {
    return DEFAULT_BASE_PATH
  }

  const withLeadingSlash = value.startsWith('/') ? value : `/${value}`
  const noTrailingSlash = withLeadingSlash.replace(/\/+$/g, '')
  return noTrailingSlash || DEFAULT_BASE_PATH
}

function isPathInsideBase(pathname, basePath) {
  if (pathname === basePath) {
    return true
  }
  return pathname.startsWith(`${basePath}/`)
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function stripWrappingQuotes(value) {
  const trimmed = String(value || '').trim()
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

function normalizeEndpoint(rawValue) {
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

  const clean = value.split('?')[0] || value
  return clean.startsWith('/') ? clean : `/${clean}`
}

function safeParseJson(text, fallbackToObject) {
  const value = String(text || '').trim()
  if (!value) {
    return { ok: true, value: fallbackToObject ? {} : '' }
  }

  try {
    return { ok: true, value: JSON.parse(value) }
  } catch {
    return { ok: false, error: 'Body phải là JSON hợp lệ.' }
  }
}

function parseResponseBody(text) {
  const parsed = safeParseJson(text, false)
  if (parsed.ok) {
    if (typeof parsed.value === 'string') {
      return parsed.value
    }
    return JSON.stringify(parsed.value, null, 2)
  }
  return text
}

function valueToText(value) {
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

function isJsonObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function getPathValue(root, rawPath) {
  const path = String(rawPath || '').trim()
  if (!path) {
    return null
  }

  const segments = path
    .split('.')
    .map((segment) => segment.trim())
    .filter(Boolean)
  let current = root

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

function toLookup(pairs) {
  const map = {}
  for (const pair of pairs) {
    const key = String(pair.key || '').trim().toLowerCase()
    if (!key) {
      continue
    }
    map[key] = String(pair.value || '').trim()
  }
  return map
}

function matchExpected(expectedValue, actualValue) {
  if (actualValue === undefined) {
    return false
  }

  const expected = String(expectedValue || '').trim()
  const actual = String(actualValue || '').trim()

  if (expected === '*') {
    return true
  }

  if (expected.startsWith('re:')) {
    try {
      return new RegExp(expected.slice(3), 'i').test(actual)
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

function matchEndpoint(patternValue, endpointValue) {
  const pattern = stripWrappingQuotes(patternValue)
  if (!pattern || pattern === '*') {
    return true
  }

  const normalizedPattern = normalizeEndpoint(pattern)
  const normalizedEndpoint = normalizeEndpoint(endpointValue)
  const regexSource = `^${escapeRegex(normalizedPattern).replace(/\\\*/g, '.*')}$`
  return new RegExp(regexSource, 'i').test(normalizedEndpoint)
}

function getFailedKeyMatchers(matchers, lookup) {
  const failures = []

  for (const matcher of matchers || []) {
    const key = String(matcher.key || '').trim().toLowerCase()
    const expected = String(matcher.expected || '').trim()
    if (!key || !expected) {
      continue
    }

    const actual = lookup[key]
    if (!matchExpected(expected, actual)) {
      failures.push(`${key} expected "${expected}" but got "${actual || '(missing)'}"`)
    }
  }

  return failures
}

function getFailedBodyMatchers(matchers, body) {
  const failures = []

  for (const matcher of matchers || []) {
    const path = String(matcher.path || '').trim()
    const expected = String(matcher.expected || '').trim()
    if (!path || !expected) {
      continue
    }

    const actual = getPathValue(body, path)
    if (actual === null || !matchExpected(expected, actual)) {
      failures.push(`${path} expected "${expected}" but got "${actual || '(missing)'}"`)
    }
  }

  return failures
}

function resolveStatusKey(rule, context) {
  const headerKey = String(rule.statusSelectorHeader || '').trim().toLowerCase()
  const queryKey = String(rule.statusSelectorQuery || '').trim().toLowerCase()
  const bodyPath = String(rule.statusSelectorBodyPath || '').trim()

  const fromHeader = headerKey ? context.headerLookup[headerKey] : undefined
  const fromQuery = queryKey ? context.queryLookup[queryKey] : undefined
  const fromBody = bodyPath ? getPathValue(context.body, bodyPath) : null

  const fallback = String(rule.defaultStatusKey || '').trim()
  const candidate = fromHeader || fromQuery || fromBody || fallback
  const normalized = String(candidate || '').trim().toLowerCase()
  return normalized || fallback.toLowerCase()
}

function resolveTemplateToken(token, context, statusKey) {
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
    return context.queryLookup[token.slice(6).toLowerCase()] || ''
  }
  if (token.startsWith('header.')) {
    return context.headerLookup[token.slice(7).toLowerCase()] || ''
  }
  if (token.startsWith('body.')) {
    return getPathValue(context.body, token.slice(5)) || ''
  }
  return ''
}

function renderResponseTemplate(template, context, statusKey) {
  return String(template || '').replace(/\{\{\s*([^}]+)\s*\}\}/g, (_match, token) =>
    resolveTemplateToken(token.trim(), context, statusKey),
  )
}

function clampStatusCode(status) {
  const value = Number(status)
  if (Number.isFinite(value) && value >= 100 && value <= 599) {
    return Math.round(value)
  }
  return 200
}

function runMockSimulation(rules, requestDraft) {
  const parsedBody = safeParseJson(requestDraft.body, true)
  if (!parsedBody.ok) {
    return {
      result: null,
      error: parsedBody.error,
    }
  }

  const context = {
    method: requestDraft.method,
    endpoint: normalizeEndpoint(requestDraft.endpoint),
    queryLookup: toLookup(requestDraft.query),
    headerLookup: toLookup(requestDraft.headers),
    body: parsedBody.value,
  }

  const diagnostics = []
  let matchedRule

  for (const rule of rules || []) {
    const reasons = []
    const ruleName = String(rule.name || '').trim() || '(untitled rule)'
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
        responseBody:
          '{\n  "error": "mock_rule_not_found",\n  "hint": "Kiểm tra method, endpoint pattern, matcher của query/header/body."\n}',
        diagnostics,
      },
      error: '',
    }
  }

  const statusKey = resolveStatusKey(matchedRule, context)
  const byStatusKey = (matchedRule.statusMap || []).find(
    (entry) => String(entry.key || '').trim().toLowerCase() === statusKey,
  )
  const defaultKey = String(matchedRule.defaultStatusKey || '').trim().toLowerCase()
  const byDefault = (matchedRule.statusMap || []).find(
    (entry) => String(entry.key || '').trim().toLowerCase() === defaultKey,
  )
  const selectedEntry = byStatusKey || byDefault || (matchedRule.statusMap || [])[0]

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