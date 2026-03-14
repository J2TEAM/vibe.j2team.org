export function uuid(): string {
  return crypto.randomUUID()
}

export async function sha512hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-512', new TextEncoder().encode(s))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function hmacSha512(key: string, msg: string): Promise<string> {
  const enc = new TextEncoder()
  const ck = await crypto.subtle.importKey(
    'raw',
    enc.encode(key),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', ck, enc.encode(msg))
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function deriveRoll(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
): Promise<number> {
  const hash = await hmacSha512(serverSeed, `${clientSeed}-${nonce}`)
  let i = 0
  let lucky = parseInt(hash.slice(i * 5, i * 5 + 5), 16)
  while (lucky >= 1_000_000) {
    i++
    lucky = parseInt(hash.slice(i * 5, i * 5 + 5), 16)
    if (i * 5 + 5 > 128) {
      lucky = 9999
      break
    }
  }
  return Math.floor((lucky % 10_000) / 100) // 0–99
}
