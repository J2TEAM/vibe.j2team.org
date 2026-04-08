/**
 * AWS Signature Version 4 (SigV4) signing for browser fetch requests.
 * Uses the Web Crypto API (SubtleCrypto) — no external dependencies required.
 */

async function sha256Hex(message: string): Promise<string> {
  const data = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function hmacSha256(key: BufferSource, message: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  return crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(message))
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function getAmzDate(date: Date): string {
  // Format: YYYYMMDDTHHMMSSZ
  return (
    date
      .toISOString()
      .replace(/[:-]|\.\d{3}/g, '')
      .slice(0, 15) + 'Z'
  )
}

function getDateStamp(date: Date): string {
  // Format: YYYYMMDD
  return date.toISOString().slice(0, 10).replace(/-/g, '')
}

export interface SigV4Params {
  accessKeyId: string
  secretAccessKey: string
  sessionToken?: string
  region: string
  service: string
  host: string
  method: string
  /** URL path, e.g. "/" */
  path: string
  body: string
  /** e.g. "AWSInsightsIndexService.GetCostAndUsage" */
  amzTarget: string
  contentType: string
}

/**
 * Returns signed headers to attach to the fetch request.
 * The caller should spread these into the `headers` option of fetch().
 */
export async function signRequest(params: SigV4Params): Promise<Record<string, string>> {
  const {
    accessKeyId,
    secretAccessKey,
    sessionToken,
    region,
    service,
    host,
    method,
    path,
    body,
    amzTarget,
    contentType,
  } = params

  const now = new Date()
  const amzDate = getAmzDate(now)
  const dateStamp = getDateStamp(now)
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`

  // Canonical headers — must be sorted alphabetically by header name
  const rawHeaders: [string, string][] = [
    ['content-type', contentType],
    ['host', host],
    ['x-amz-date', amzDate],
    ['x-amz-target', amzTarget],
  ]
  if (sessionToken) rawHeaders.push(['x-amz-security-token', sessionToken])
  rawHeaders.sort(([a], [b]) => a.localeCompare(b))

  const canonicalHeaders = rawHeaders.map(([k, v]) => `${k}:${v}`).join('\n') + '\n'
  const signedHeaders = rawHeaders.map(([k]) => k).join(';')

  const payloadHash = await sha256Hex(body)

  const canonicalRequest = [
    method.toUpperCase(),
    path,
    '', // canonical query string (empty for POST)
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n')

  const hashedCanonicalRequest = await sha256Hex(canonicalRequest)

  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, credentialScope, hashedCanonicalRequest].join(
    '\n',
  )

  // Derive signing key
  const kSecret = new TextEncoder().encode('AWS4' + secretAccessKey)
  const kDate = await hmacSha256(kSecret, dateStamp)
  const kRegion = await hmacSha256(kDate, region)
  const kService = await hmacSha256(kRegion, service)
  const kSigning = await hmacSha256(kService, 'aws4_request')

  const signatureHex = toHex(await hmacSha256(kSigning, stringToSign))

  const authorization = [
    `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}`,
    `SignedHeaders=${signedHeaders}`,
    `Signature=${signatureHex}`,
  ].join(', ')

  const result: Record<string, string> = {
    'Content-Type': contentType,
    'X-Amz-Date': amzDate,
    'X-Amz-Target': amzTarget,
    Authorization: authorization,
  }

  if (sessionToken) result['X-Amz-Security-Token'] = sessionToken

  return result
}
