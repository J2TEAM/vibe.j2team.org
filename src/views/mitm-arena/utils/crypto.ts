/** Public metadata bound to the authenticated message and its per-round key. */
export interface CryptoContext {
  roomId: string
  round: number
  senderId: string
  recipientId: string
}

export interface CipherEnvelope {
  iv: string
  ciphertext: string
}

const encoder = new TextEncoder()
const MAX_CIPHERTEXT_BYTES = 8192

/** ASCII letters with a combining mark belong to an accented grapheme: leave them intact. */
export function caesar(text: string, shift: number): string {
  if (!Number.isInteger(shift)) throw new RangeError('Khóa Caesar phải là số nguyên.')
  const offset = ((shift % 26) + 26) % 26
  return text.replace(/[A-Za-z](?!\p{M})/gu, (letter) => {
    const code = letter.charCodeAt(0)
    const base = code <= 90 ? 65 : 97
    return String.fromCharCode(base + ((code - base + offset) % 26))
  })
}

function encode(bytes: Uint8Array<ArrayBuffer>): string {
  return btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''))
}

function decode(value: string, maxBytes: number): Uint8Array<ArrayBuffer> {
  if (
    value.length > Math.ceil(maxBytes / 3) * 4 ||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)
  ) {
    throw new Error('Bản mã không đúng định dạng Base64.')
  }
  const bytes = Uint8Array.from(atob(value), (character) => character.charCodeAt(0))
  if (bytes.byteLength > maxBytes) throw new Error('Bản mã vượt giới hạn.')
  return bytes
}

function associatedData(context: CryptoContext): Uint8Array<ArrayBuffer> {
  return encoder.encode(
    JSON.stringify([
      'mitm-arena-v1',
      context.roomId,
      context.round,
      context.senderId,
      context.recipientId,
    ]),
  )
}

/** Generate again on every role rotation. The private key never leaves this client. */
export function generateExchangeKey(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveBits'])
}

/** Only this public value may be relayed by the room host, including a host playing C. */
export async function exportExchangePublicKey(publicKey: CryptoKey): Promise<string> {
  return encode(new Uint8Array(await crypto.subtle.exportKey('raw', publicKey)))
}

/** Both A and B derive the same non-extractable AES key without sending it through C. */
export async function deriveSessionKey(
  privateKey: CryptoKey,
  remotePublicKeyBase64: string,
  context: CryptoContext,
): Promise<CryptoKey> {
  const remotePublicKey = await crypto.subtle.importKey(
    'raw',
    decode(remotePublicKeyBase64, 65),
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    [],
  )
  const sharedSecret = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: remotePublicKey },
    privateKey,
    256,
  )
  const material = await crypto.subtle.importKey('raw', sharedSecret, 'HKDF', false, ['deriveKey'])
  const salt = await crypto.subtle.digest('SHA-256', associatedData(context))
  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt,
      info: encoder.encode('mitm-arena/aes-gcm/round-key/v1'),
    },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function encryptMessage(
  key: CryptoKey,
  text: string,
  context: CryptoContext,
): Promise<CipherEnvelope> {
  const plaintext = encoder.encode(text)
  if (plaintext.byteLength > MAX_CIPHERTEXT_BYTES - 16) {
    throw new Error('Tin nhắn vượt giới hạn mã hóa.')
  }
  // A fresh 96-bit IV for each encryption; each round also uses a fresh ECDH-derived key.
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: associatedData(context), tagLength: 128 },
    key,
    plaintext,
  )
  return { iv: encode(iv), ciphertext: encode(new Uint8Array(ciphertext)) }
}

/** Authentication failures reject the promise; callers must distinguish them from timeouts. */
export async function decryptMessage(
  key: CryptoKey,
  envelope: CipherEnvelope,
  context: CryptoContext,
): Promise<string> {
  const iv = decode(envelope.iv, 12)
  const ciphertext = decode(envelope.ciphertext, MAX_CIPHERTEXT_BYTES)
  if (iv.byteLength !== 12 || ciphertext.byteLength < 16) {
    throw new Error('Bản mã hoặc IV không hợp lệ.')
  }
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv, additionalData: associatedData(context), tagLength: 128 },
    key,
    ciphertext,
  )
  return new TextDecoder('utf-8', { fatal: true }).decode(plaintext)
}

/** C can flip a real ciphertext bit, but never receives a decryption key. */
export function tamperEnvelope(envelope: CipherEnvelope): CipherEnvelope {
  const ciphertext = decode(envelope.ciphertext, MAX_CIPHERTEXT_BYTES)
  if (ciphertext.byteLength < 16) throw new Error('Bản mã không hợp lệ.')
  ciphertext[0] = ciphertext[0]! ^ 1
  return { iv: envelope.iv, ciphertext: encode(ciphertext) }
}
