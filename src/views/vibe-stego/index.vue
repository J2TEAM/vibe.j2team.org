<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { useClipboard, useScriptTag } from '@vueuse/core'

type Tab = 'encode' | 'decode'
const activeTab = ref<Tab>('encode')
const encodeFileInput = ref<HTMLInputElement | null>(null)
const decodeFileInput = ref<HTMLInputElement | null>(null)

// --- CONSTANTS ---
const MAGIC_SIGNATURE = 'VIBE'
const MAGIC_V2 = 'VB2!'
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/bmp', 'image/gif']

// --- Load UPNG.js for 16-bit PNG support ---
const upngReady = ref(false)
// Load pako (zlib) first — UPNG.js depends on it
const { load: loadPako } = useScriptTag(
  'https://cdn.jsdelivr.net/npm/pako@2.1.0/dist/pako.min.js',
  () => {
    // Then load UPNG.js after pako is ready
    loadUPNG()
  },
  { manual: true },
)
const { load: loadUPNG } = useScriptTag(
  'https://cdn.jsdelivr.net/npm/upng-js@2.1.0/UPNG.min.js',
  () => {
    upngReady.value = true
  },
  { manual: true },
)
loadPako()

// UPNG global type
interface UPNGDecoded {
  width: number
  height: number
  depth: number
  ctype: number
  data: ArrayBuffer
  frames: Array<Record<string, unknown>>
}

/** Extract raw pixel data from UPNG decoded image */
function getFrameData(img: UPNGDecoded): Uint8Array {
  // For static PNGs, frames is empty — data is in img.data directly
  const d = img.data as unknown
  if (d instanceof Uint8Array) return new Uint8Array(d)
  if (d instanceof ArrayBuffer) return new Uint8Array(d)
  // ArrayBufferView (e.g. Uint16Array)
  if (d && typeof d === 'object' && 'buffer' in d) {
    const view = d as { buffer: ArrayBuffer; byteOffset: number; byteLength: number }
    return new Uint8Array(view.buffer, view.byteOffset, view.byteLength)
  }

  // Try frames as fallback (for animated PNGs)
  const frame = img.frames[0]
  if (frame) {
    for (const key of Object.keys(frame)) {
      const val = frame[key]
      if (val instanceof Uint8Array) return new Uint8Array(val)
      if (val instanceof ArrayBuffer) return new Uint8Array(val)
    }
  }

  throw new Error('Không thể đọc pixel data từ PNG.')
}
interface UPNGLib {
  decode: (buf: ArrayBuffer) => UPNGDecoded
  encode: (imgs: ArrayBuffer[], w: number, h: number, cnum: number) => ArrayBuffer
  toRGBA8: (img: UPNGDecoded) => ArrayBuffer[]
}

function getUPNG(): UPNGLib | null {
  const w = window as unknown as Record<string, unknown>
  return (w.UPNG as UPNGLib) ?? null
}

// --- Toast ---
const toastMessage = ref('')
const toastType = ref<'success' | 'error' | 'info'>('info')
const toastVisible = ref(false)
let toastTimer = 0

function showToast(msg: string, type: 'success' | 'error' | 'info' = 'info') {
  toastMessage.value = msg
  toastType.value = type
  toastVisible.value = true
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => {
    toastVisible.value = false
  }, 4000)
}

// --- AES CRYPTO (Web Crypto API) ---
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

async function aesEncrypt(plaintext: string, password: string): Promise<Uint8Array> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(password, salt)
  const encoded = new TextEncoder().encode(plaintext)
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    encoded as BufferSource,
  )
  const result = new Uint8Array(16 + 12 + ciphertext.byteLength)
  result.set(salt, 0)
  result.set(iv, 16)
  result.set(new Uint8Array(ciphertext), 28)
  return result
}

async function aesDecrypt(data: Uint8Array, password: string): Promise<string> {
  const salt = data.slice(0, 16)
  const iv = data.slice(16, 28)
  const ciphertext = data.slice(28)
  const key = await deriveKey(password, salt)
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    ciphertext as BufferSource,
  )
  return new TextDecoder().decode(decrypted)
}

// --- BIT UTILS ---
function bytesToBits(bytes: Uint8Array): number[] {
  const bits: number[] = []
  for (const b of bytes) {
    for (let i = 7; i >= 0; i--) {
      bits.push((b >> i) & 1)
    }
  }
  return bits
}

function bitsToBytes(bits: number[]): Uint8Array {
  const bytes = new Uint8Array(Math.floor(bits.length / 8))
  for (let i = 0; i < bytes.length; i++) {
    let byte = 0
    for (let j = 0; j < 8; j++) {
      byte = (byte << 1) | bits[i * 8 + j]!
    }
    bytes[i] = byte
  }
  return bytes
}

// --- CUSTOM PNG ENCODER (supports 16-bit output) ---
interface PakoLib { deflate: (data: Uint8Array) => Uint8Array }
function getPako(): PakoLib {
  return (window as unknown as Record<string, unknown>).pako as PakoLib
}

function buildPNG(pixelData: Uint8Array, w: number, h: number, depth: number, ctype: number): ArrayBuffer {
  const pk = getPako()
  const channelCounts = [1, 0, 3, 1, 2, 0, 4] as const
  const ch = channelCounts[ctype]!
  const bpp = ch * (depth / 8) // bytes per pixel
  const bpr = w * bpp // bytes per row

  // Add filter byte (0 = None) before each scanline
  const filtered = new Uint8Array(h * (1 + bpr))
  for (let y = 0; y < h; y++) {
    filtered[y * (1 + bpr)] = 0
    filtered.set(pixelData.subarray(y * bpr, y * bpr + bpr), y * (1 + bpr) + 1)
  }

  const compressed = pk.deflate(filtered)

  // CRC32 lookup table
  const crcTab: number[] = []
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1)
    crcTab.push(c >>> 0)
  }
  function crc32(buf: Uint8Array, off: number, len: number): number {
    let c = 0xffffffff
    for (let i = 0; i < len; i++) c = (crcTab[(c ^ buf[off + i]!) & 0xff]! ^ (c >>> 8)) >>> 0
    return (c ^ 0xffffffff) >>> 0
  }
  function wU32(buf: Uint8Array, p: number, v: number) {
    buf[p] = (v >>> 24) & 0xff
    buf[p + 1] = (v >>> 16) & 0xff
    buf[p + 2] = (v >>> 8) & 0xff
    buf[p + 3] = v & 0xff
  }

  // sig(8) + IHDR(25) + IDAT(12+compressed) + IEND(12)
  const out = new Uint8Array(8 + 25 + 12 + compressed.length + 12)
  let p = 0

  // PNG Signature
  out.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], p); p += 8

  // IHDR
  wU32(out, p, 13); p += 4 // chunk length
  out.set([0x49, 0x48, 0x44, 0x52], p); p += 4 // "IHDR"
  wU32(out, p, w); p += 4
  wU32(out, p, h); p += 4
  out[p++] = depth
  out[p++] = ctype
  out[p++] = 0 // compression
  out[p++] = 0 // filter
  out[p++] = 0 // interlace
  wU32(out, p, crc32(out, 12, 17)); p += 4

  // IDAT
  wU32(out, p, compressed.length); p += 4
  out.set([0x49, 0x44, 0x41, 0x54], p); p += 4 // "IDAT"
  out.set(compressed, p)
  wU32(out, p + compressed.length, crc32(out, p - 4, compressed.length + 4))
  p += compressed.length + 4

  // IEND
  wU32(out, p, 0); p += 4
  out.set([0x49, 0x45, 0x4e, 0x44], p); p += 4
  wU32(out, p, crc32(out, p - 4, 4)); p += 4

  return out.buffer.slice(0, p) as ArrayBuffer
}

// --- LSB HELPERS for multi-depth support ---

/** Get byte indices suitable for LSB embedding (R,G,B low bytes, skip Alpha) */
function getLSBByteIndices(
  width: number,
  height: number,
  depth: number,
  ctype: number,
): number[] {
  const bytesPerChannel = depth / 8 // 1 for 8-bit, 2 for 16-bit
  const totalPixels = width * height
  const indices: number[] = []

  // Channels per pixel
  let channels: number
  let hasAlpha: boolean
  if (ctype === 6) {
    channels = 4
    hasAlpha = true
  } else if (ctype === 4) {
    channels = 2
    hasAlpha = true
  } else if (ctype === 2) {
    channels = 3
    hasAlpha = false
  } else {
    channels = 1
    hasAlpha = false
  }

  const bytesPerPixel = channels * bytesPerChannel
  const colorChannels = hasAlpha ? channels - 1 : channels

  for (let p = 0; p < totalPixels; p++) {
    const base = p * bytesPerPixel
    for (let c = 0; c < colorChannels; c++) {
      // Low byte of each color channel (for 8-bit it's the only byte, for 16-bit it's byte[1])
      indices.push(base + c * bytesPerChannel + (bytesPerChannel - 1))
    }
  }

  return indices
}

// --- DRAG & DROP ---
const encodeDragOver = ref(false)
const decodeDragOver = ref(false)

function handleDrop(e: DragEvent, target: 'encode' | 'decode') {
  e.preventDefault()
  encodeDragOver.value = false
  decodeDragOver.value = false
  const file = e.dataTransfer?.files[0]
  if (!file) return
  if (!ALLOWED_TYPES.includes(file.type)) {
    showToast('Chỉ chấp nhận file hình ảnh (PNG, JPG, WebP, BMP, GIF).', 'error')
    return
  }
  processFile(file, target)
}

function handleDragOver(e: DragEvent, target: 'encode' | 'decode') {
  e.preventDefault()
  if (target === 'encode') encodeDragOver.value = true
  else decodeDragOver.value = true
}

function handleDragLeave(target: 'encode' | 'decode') {
  if (target === 'encode') encodeDragOver.value = false
  else decodeDragOver.value = false
}

// --- FILE PROCESSING ---
function processFile(file: File, target: 'encode' | 'decode') {
  const previewUrl = URL.createObjectURL(file)
  const isPNG = file.type === 'image/png'

  if (target === 'encode') {
    encodePreview.value = previewUrl
    encodeBuffer.value = null
    encodeDepth.value = 8
    encodeFormat.value = file.type
    file.arrayBuffer().then((buf) => {
      encodeBuffer.value = buf
      if (isPNG) {
        detectDepth(buf)
      } else {
        // Non-PNG: use Canvas (8-bit), calculate capacity from image dimensions
        showToast(
          'Ảnh không phải PNG — sẽ tự động convert sang PNG lossless để bảo toàn dữ liệu ẩn.',
          'info',
        )
        const img = new Image()
        img.onload = () => {
          maxChars.value = Math.floor((img.width * img.height * 3 - 200) / 8)
        }
        img.src = previewUrl
      }
    })
  } else {
    decodePreview.value = previewUrl
    decodeBuffer.value = null
    decodedText.value = null
    decodeError.value = ''
    file.arrayBuffer().then((buf) => {
      decodeBuffer.value = buf
    })
  }
}

function detectDepth(buf: ArrayBuffer) {
  const upng = getUPNG()
  if (!upng) return
  try {
    const img = upng.decode(buf)
    encodeDepth.value = img.depth
    encodeCtype.value = img.ctype
    const indices = getLSBByteIndices(img.width, img.height, img.depth, img.ctype)
    maxChars.value = Math.floor((indices.length - 200) / 8)
  } catch {
    // Not a valid PNG for UPNG, use canvas fallback
    encodeDepth.value = 8
  }
}

// --- ENCODE STATE ---
const encodePreview = ref<string | null>(null)
const encodeBuffer = ref<ArrayBuffer | null>(null)
const encodeDepth = ref(8)
const encodeCtype = ref(6)
const encodeFormat = ref('image/png')
const encodeText = ref('')
const encodePass = ref('')
const encodedResult = ref<string | null>(null)
const isEncoding = ref(false)
const maxChars = ref(0)

watch(encodeBuffer, (buf) => {
  if (!buf) maxChars.value = 0
})

const capacityPercent = computed(() => {
  if (maxChars.value === 0) return 0
  return Math.min(100, Math.round((encodeText.value.length / maxChars.value) * 100))
})

const isOverCapacity = computed(() => capacityPercent.value > 90)

async function handleEncodeFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (!ALLOWED_TYPES.includes(file.type)) {
    showToast('Chỉ chấp nhận file hình ảnh (PNG, JPG, WebP, BMP, GIF).', 'error')
    input.value = ''
    return
  }
  processFile(file, 'encode')
}

async function buildPayload(): Promise<Uint8Array> {
  if (encodePass.value) {
    const encrypted = await aesEncrypt(encodeText.value, encodePass.value)
    const header = new TextEncoder().encode(MAGIC_V2)
    const lengthBytes = new Uint8Array(4)
    lengthBytes[0] = (encrypted.length >> 24) & 0xff
    lengthBytes[1] = (encrypted.length >> 16) & 0xff
    lengthBytes[2] = (encrypted.length >> 8) & 0xff
    lengthBytes[3] = encrypted.length & 0xff
    const payload = new Uint8Array(header.length + 4 + encrypted.length)
    payload.set(header, 0)
    payload.set(lengthBytes, 4)
    payload.set(encrypted, 8)
    return payload
  } else {
    const textBytes = new TextEncoder().encode(encodeText.value)
    const header = new TextEncoder().encode(MAGIC_SIGNATURE)
    const lengthBytes = new Uint8Array(4)
    lengthBytes[0] = (textBytes.length >> 24) & 0xff
    lengthBytes[1] = (textBytes.length >> 16) & 0xff
    lengthBytes[2] = (textBytes.length >> 8) & 0xff
    lengthBytes[3] = textBytes.length & 0xff
    const payload = new Uint8Array(header.length + 4 + textBytes.length)
    payload.set(header, 0)
    payload.set(lengthBytes, 4)
    payload.set(textBytes, 8)
    return payload
  }
}

async function startEncode() {
  if (!encodeBuffer.value || !encodeText.value) return
  isEncoding.value = true

  try {
    const payload = await buildPayload()
    const payloadBits = bytesToBits(payload)

    const upng = getUPNG()
    let usedUPNG = false

    if (upng) {
      try {
        // --- UPNG pipeline: decode at native depth for correct LSB reading ---
        const img = upng.decode(encodeBuffer.value)
        const depth = img.depth
        const ctype = img.ctype

        // Get raw pixel data at original depth
        const rawData = new Uint8Array(getFrameData(img))
        const indices = getLSBByteIndices(img.width, img.height, depth, ctype)

        if (payloadBits.length > indices.length) {
          showToast('Dữ liệu quá lớn so với kích thước ảnh!', 'error')
          isEncoding.value = false
          return
        }

        // Inject LSBs into raw pixel data at native depth
        for (let i = 0; i < payloadBits.length; i++) {
          const idx = indices[i]!
          rawData[idx] = (rawData[idx]! & 0xfe) | payloadBits[i]!
        }

        // Re-encode PNG at original depth using custom encoder
        const outBuf = buildPNG(rawData, img.width, img.height, depth, ctype)
        const blob = new Blob([outBuf], { type: 'image/png' })
        encodedResult.value = URL.createObjectURL(blob)
        showToast(`Giấu tin thành công! (${depth}-bit PNG)`, 'success')
        usedUPNG = true
      } catch {
        // Non-PNG file (WebP, JPEG, etc.) — fall through to Canvas
      }
    }

    if (!usedUPNG) {
      // --- Canvas fallback: handles WebP, JPEG, BMP, GIF → output 8-bit PNG ---
      await encodeWithCanvas(payloadBits)
    }
  } catch (err) {
    showToast('Lỗi mã hóa: ' + (err as Error).message, 'error')
  }

  isEncoding.value = false
}

async function encodeWithCanvas(payloadBits: number[]) {
  const img = new Image()
  img.src = encodePreview.value!
  await new Promise((resolve) => (img.onload = resolve))

  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height
  const ctx = canvas.getContext('2d', { willReadFrequently: true, colorSpace: 'srgb' })!
  ctx.drawImage(img, 0, 0)

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data

  if (payloadBits.length > data.length * 0.75) {
    showToast('Dữ liệu quá lớn so với kích thước ảnh!', 'error')
    return
  }

  let bitIdx = 0
  for (let i = 0; i < data.length && bitIdx < payloadBits.length; i++) {
    if ((i + 1) % 4 === 0) continue
    data[i] = (data[i]! & 0xfe) | payloadBits[bitIdx]!
    bitIdx++
  }

  ctx.putImageData(imageData, 0, 0)
  encodedResult.value = canvas.toDataURL('image/png')
  showToast('Giấu tin thành công! (8-bit PNG)', 'success')
}

// --- DECODE STATE ---
const decodePreview = ref<string | null>(null)
const decodeBuffer = ref<ArrayBuffer | null>(null)
const decodePass = ref('')
const decodedText = ref<string | null>(null)
const decodeError = ref('')
const isDecoding = ref(false)
const { copy, copied } = useClipboard()

async function handleDecodeFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (!ALLOWED_TYPES.includes(file.type)) {
    showToast('Chỉ chấp nhận file hình ảnh (PNG, JPG, WebP, BMP, GIF).', 'error')
    input.value = ''
    return
  }
  decodedText.value = null
  decodeError.value = ''
  processFile(file, 'decode')
}

async function startDecode() {
  if (!decodeBuffer.value) return
  isDecoding.value = true
  decodedText.value = null
  decodeError.value = ''

  try {
    let bits: number[]

    const upng = getUPNG()
    let usedUPNG = false

    if (upng) {
      try {
        // --- UPNG pipeline: handles 8-bit and 16-bit PNG ---
        const img = upng.decode(decodeBuffer.value)
        const rawData = getFrameData(img)
        const indices = getLSBByteIndices(img.width, img.height, img.depth, img.ctype)

        bits = []
        for (const idx of indices) {
          bits.push(rawData[idx]! & 1)
        }
        usedUPNG = true
      } catch {
        // Non-PNG file — fall through to Canvas
        bits = []
      }
    } else {
      bits = []
    }

    if (!usedUPNG) {
      // --- Canvas fallback: handles WebP, JPEG, etc. ---
      bits = await decodeWithCanvas()
    }

    // Read header
    const headerBytes = bitsToBytes(bits.slice(0, 64))
    const headerStr = new TextDecoder().decode(headerBytes)
    const magic = headerStr.substring(0, 4)

    if (magic === MAGIC_V2) {
      if (!decodePass.value) {
        decodeError.value = 'Ảnh này được mã hóa AES-256. Hãy nhập mật khẩu để giải mã.'
        isDecoding.value = false
        return
      }
      const length =
        (headerBytes[4]! << 24) | (headerBytes[5]! << 16) | (headerBytes[6]! << 8) | headerBytes[7]!
      const totalBits = (8 + length) * 8
      const allBytes = bitsToBytes(bits.slice(0, totalBits))
      const encryptedData = allBytes.slice(8)
      try {
        decodedText.value = await aesDecrypt(encryptedData, decodePass.value)
        showToast('Giải mã AES thành công!', 'success')
      } catch {
        decodeError.value = 'Sai mật khẩu hoặc dữ liệu bị hỏng.'
      }
    } else if (magic === MAGIC_SIGNATURE) {
      const length =
        (headerBytes[4]! << 24) | (headerBytes[5]! << 16) | (headerBytes[6]! << 8) | headerBytes[7]!
      const totalBits = (8 + length) * 8
      const allBytes = bitsToBytes(bits.slice(0, totalBits))
      const content = new TextDecoder().decode(allBytes.slice(8))
      decodedText.value = content
      showToast('Giải mã thành công!', 'success')
    } else {
      decodeError.value =
        'Không tìm thấy mật thư trong ảnh này. Lưu ý: ảnh phải là file PNG gốc, không qua nén/resize/chụp màn hình.'
    }
  } catch (err) {
    decodeError.value = 'Lỗi: ' + (err as Error).message
  }

  isDecoding.value = false
}

async function decodeWithCanvas(): Promise<number[]> {
  const img = new Image()
  img.src = decodePreview.value!
  await new Promise((resolve) => (img.onload = resolve))

  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height
  const ctx = canvas.getContext('2d', { willReadFrequently: true, colorSpace: 'srgb' })!
  ctx.drawImage(img, 0, 0)

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const pixelData = imageData.data

  const bits: number[] = []
  for (let i = 0; i < pixelData.length; i++) {
    if ((i + 1) % 4 === 0) continue
    bits.push(pixelData[i]! & 1)
  }
  return bits
}
</script>

<template>
  <div class="min-h-screen bg-bg-deep px-4 py-3 font-body text-text-primary md:px-8 md:py-4">
    <!-- TOAST -->
    <Transition name="toast">
      <div
        v-if="toastVisible"
        :class="[
          'fixed top-4 left-1/2 z-50 -translate-x-1/2 flex items-center gap-2 px-5 py-3 text-sm font-semibold shadow-xl',
          toastType === 'success'
            ? 'bg-emerald-500 text-white'
            : toastType === 'error'
              ? 'bg-red-500 text-white'
              : 'bg-accent-sky text-bg-deep',
        ]"
      >
        <Icon
          :icon="
            toastType === 'success'
              ? 'lucide:check-circle'
              : toastType === 'error'
                ? 'lucide:x-circle'
                : 'lucide:info'
          "
          class="size-4 shrink-0"
        />
        {{ toastMessage }}
      </div>
    </Transition>

    <div class="mx-auto max-w-4xl">
      <!-- HEADER -->
      <div class="mb-4 flex items-center justify-between border-b border-border-default pb-3">
        <div class="flex items-center gap-3 animate-fade-up">
          <div class="flex h-9 w-9 items-center justify-center bg-accent-amber text-bg-deep">
            <Icon icon="lucide:file-lock" class="size-5" />
          </div>
          <div>
            <h1 class="font-display text-2xl font-bold uppercase tracking-tight">Vibe Stego</h1>
            <p class="font-display text-[10px] tracking-widest text-text-secondary">
              // GIẤU MẬT THƯ VÀO HÌNH ẢNH
              <a
                href="https://www.facebook.com/nmdung.dev"
                target="_blank"
                rel="noopener noreferrer"
                class="ml-2 font-bold tracking-[0.15em] text-text-dim uppercase transition-colors hover:text-accent-coral"
              >by nmdung.dev</a>
            </p>
          </div>
        </div>

        <RouterLink
          to="/"
          class="group hidden items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-sm font-bold uppercase tracking-widest transition-all hover:border-accent-coral md:flex"
        >
          <Icon icon="lucide:arrow-left" class="size-4 transition-transform group-hover:-translate-x-1" />
          Quay lại
        </RouterLink>
      </div>

      <!-- TABS -->
      <div class="mb-4 flex gap-2 animate-fade-up animate-delay-1">
        <button
          :class="[
            'flex-1 border px-4 py-2.5 font-display text-xs font-bold uppercase tracking-widest transition-all',
            activeTab === 'encode'
              ? 'border-accent-coral bg-bg-elevated text-accent-coral'
              : 'border-border-default bg-bg-surface text-text-dim hover:text-text-primary',
          ]"
          @click="activeTab = 'encode'"
        >
          <Icon icon="lucide:lock" class="mr-1.5 inline size-3.5" />
          Giấu mật thư
        </button>
        <button
          :class="[
            'flex-1 border px-4 py-2.5 font-display text-xs font-bold uppercase tracking-widest transition-all',
            activeTab === 'decode'
              ? 'border-accent-amber bg-bg-elevated text-accent-amber'
              : 'border-border-default bg-bg-surface text-text-dim hover:text-text-primary',
          ]"
          @click="activeTab = 'decode'"
        >
          <Icon icon="lucide:unlock" class="mr-1.5 inline size-3.5" />
          Giải mã mật thư
        </button>
      </div>

      <!-- ===== ENCODE PANEL ===== -->
      <div v-if="activeTab === 'encode'" class="grid gap-4 md:grid-cols-2 animate-fade-up animate-delay-2">
        <div class="space-y-3">
          <div class="space-y-2">
            <label class="font-display text-xs font-bold uppercase tracking-widest text-text-secondary">
              Bước 1: Chọn ảnh gốc
            </label>
            <div
              :class="[
                'relative flex min-h-[120px] cursor-pointer items-center justify-center border-2 border-dashed p-3 transition-all',
                encodeDragOver
                  ? 'border-accent-coral bg-accent-coral/10 scale-[1.01]'
                  : 'border-border-default bg-bg-surface hover:border-accent-coral/50',
              ]"
              @click="encodeFileInput?.click()"
              @drop="handleDrop($event, 'encode')"
              @dragover="handleDragOver($event, 'encode')"
              @dragleave="handleDragLeave('encode')"
            >
              <input
                ref="encodeFileInput"
                type="file"
                class="hidden"
                accept="image/*"
                @change="handleEncodeFile"
              />
              <img v-if="encodePreview" :src="encodePreview" class="max-h-[120px] w-full object-contain" />
              <div v-else class="flex flex-col items-center gap-1 text-text-dim">
                <Icon icon="lucide:upload-cloud" class="size-8" />
                <span class="text-[11px] font-medium">Click hoặc kéo thả ảnh vào đây</span>
                <span class="text-[9px] text-text-dim">PNG (8/16-bit), JPG, WebP, BMP, GIF</span>
              </div>
            </div>
            <!-- Depth & format badge -->
            <div v-if="encodePreview" class="space-y-1.5">
              <div class="flex items-center gap-2 flex-wrap">
                <span
                  :class="[
                    'inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold font-display uppercase',
                    encodeDepth === 16 ? 'bg-accent-sky/20 text-accent-sky' : 'bg-bg-elevated text-text-dim',
                  ]"
                >
                  <Icon icon="lucide:layers" class="size-3" />
                  {{ encodeDepth }}-bit
                </span>
                <span class="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold font-display uppercase bg-bg-elevated text-text-dim">
                  {{ encodeFormat.replace('image/', '').toUpperCase() }}
                </span>
                <span class="text-[10px] text-text-dim">
                  {{ maxChars > 0 ? `~${maxChars.toLocaleString()} ký tự` : '' }}
                </span>
              </div>
              <p v-if="encodeFormat !== 'image/png'" class="flex items-center gap-1 text-[10px] text-accent-amber">
                <Icon icon="lucide:arrow-right-left" class="size-3" />
                Output sẽ là PNG lossless — format gốc ({{ encodeFormat.replace('image/', '').toUpperCase() }}) không an toàn cho steganography
              </p>
            </div>
          </div>

          <div class="space-y-3">
            <div class="space-y-2">
              <label class="font-display text-xs font-bold uppercase tracking-widest text-text-secondary">
                Bước 2: Nội dung mật thư
              </label>
              <textarea
                v-model="encodeText"
                placeholder="Nhập nội dung cần giấu..."
                class="w-full border border-border-default bg-bg-surface p-3 text-sm focus:border-accent-coral focus:outline-none placeholder:text-text-dim"
                rows="2"
              />
              <div v-if="maxChars > 0" class="space-y-1">
                <div class="flex justify-between text-[10px] font-display">
                  <span class="text-text-dim">{{ encodeText.length.toLocaleString() }} / {{ maxChars.toLocaleString() }}</span>
                  <span :class="isOverCapacity ? 'text-red-400' : 'text-text-dim'">{{ capacityPercent }}%</span>
                </div>
                <div class="h-1.5 bg-bg-deep overflow-hidden">
                  <div
                    class="h-full transition-all duration-300"
                    :class="isOverCapacity ? 'bg-red-400' : capacityPercent > 70 ? 'bg-accent-amber' : 'bg-accent-coral'"
                    :style="{ width: Math.min(100, capacityPercent) + '%' }"
                  />
                </div>
              </div>
            </div>

            <div class="space-y-2">
              <label class="font-display text-xs font-bold uppercase tracking-widest text-text-secondary">
                Bước 3: Mật khẩu
                <span class="normal-case tracking-normal text-text-dim">(AES-256 nếu có)</span>
              </label>
              <div class="relative">
                <Icon icon="lucide:shield-check" class="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-text-dim" />
                <input
                  v-model="encodePass"
                  type="password"
                  placeholder="Để trống = không mã hóa"
                  class="w-full border border-border-default bg-bg-surface py-3 pl-12 pr-4 text-sm focus:border-accent-coral focus:outline-none"
                />
              </div>
              <p v-if="encodePass" class="flex items-center gap-1 text-[10px] text-emerald-400">
                <Icon icon="lucide:shield-check" class="size-3" />
                Mã hóa AES-256-GCM + PBKDF2 (100k iterations)
              </p>
            </div>

            <button
              :disabled="!encodeBuffer || !encodeText || isEncoding"
              class="flex w-full items-center justify-center gap-2 bg-accent-coral py-3 font-display text-xs font-bold uppercase tracking-widest text-bg-deep transition-transform active:scale-[0.98] disabled:opacity-30"
              @click="startEncode"
            >
              <Icon v-if="isEncoding" icon="lucide:loader-2" class="size-5 animate-spin" />
              <Icon v-else icon="lucide:zap" class="size-5" />
              Bắt đầu giấu tin
            </button>
          </div>
        </div>

        <!-- Result side -->
        <div class="flex flex-col border border-border-default bg-bg-surface p-4">
          <h3 class="mb-3 font-display text-sm font-bold text-text-primary">// Kết quả</h3>
          <div v-if="encodedResult" class="flex flex-col gap-3">
            <img :src="encodedResult" class="max-h-[150px] w-full object-contain border border-border-default shadow-xl" />
            <p class="text-xs italic text-text-dim">
              <Icon icon="lucide:alert-triangle" class="mr-1 inline size-3 text-accent-amber" />
              Phải tải ảnh PNG gốc — chia sẻ qua Zalo/Messenger sẽ bị nén hỏng dữ liệu.
            </p>
            <a
              :href="encodedResult"
              download="vibe_stego_result.png"
              class="flex items-center justify-center gap-2 border border-accent-sky bg-bg-elevated px-6 py-3 font-display text-xs font-bold uppercase tracking-widest text-accent-sky transition-colors hover:bg-accent-sky hover:text-bg-deep"
            >
              <Icon icon="lucide:download" class="size-4" />
              Tải ảnh PNG
            </a>
          </div>
          <div v-else class="flex flex-1 flex-col items-center justify-center text-center opacity-20">
            <Icon icon="lucide:image" class="size-24" />
            <p class="mt-4 text-sm">Ảnh đã giấu tin sẽ hiện ở đây</p>
          </div>
        </div>
      </div>

      <!-- ===== DECODE PANEL ===== -->
      <div v-else class="animate-fade-up animate-delay-2">
        <div class="grid gap-4 md:grid-cols-2">
          <div class="space-y-3">
            <div class="space-y-1">
              <label class="font-display text-xs font-bold uppercase tracking-widest text-text-secondary">
                Bước 1: Chọn ảnh có mật thư
              </label>
              <div
                :class="[
                  'relative flex min-h-[120px] cursor-pointer items-center justify-center border-2 border-dashed p-3 transition-all',
                  decodeDragOver
                    ? 'border-accent-amber bg-accent-amber/10 scale-[1.01]'
                    : 'border-border-default bg-bg-surface hover:border-accent-amber/50',
                ]"
                @click="decodeFileInput?.click()"
                @drop="handleDrop($event, 'decode')"
                @dragover="handleDragOver($event, 'decode')"
                @dragleave="handleDragLeave('decode')"
              >
                <input
                  ref="decodeFileInput"
                  type="file"
                  class="hidden"
                  accept="image/*"
                  @change="handleDecodeFile"
                />
                <img v-if="decodePreview" :src="decodePreview" class="max-h-[120px] w-full object-contain" />
                <div v-else class="flex flex-col items-center gap-1 text-text-dim">
                  <Icon icon="lucide:upload-cloud" class="size-8" />
                  <span class="text-[11px] font-medium">Click hoặc kéo thả ảnh vào đây</span>
                  <span class="text-[9px] text-text-dim">PNG (8/16-bit), JPG, WebP, BMP, GIF</span>
                </div>
              </div>
            </div>

            <div class="space-y-2">
              <label class="font-display text-xs font-bold uppercase tracking-widest text-text-secondary">
                Bước 2: Mật khẩu (Nếu có)
              </label>
              <div class="relative">
                <Icon icon="lucide:shield-check" class="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-text-dim" />
                <input
                  v-model="decodePass"
                  type="password"
                  placeholder="Nhập mật khẩu..."
                  class="w-full border border-border-default bg-bg-surface py-3 pl-12 pr-4 text-sm focus:border-accent-amber focus:outline-none"
                />
              </div>
            </div>

            <button
              :disabled="!decodeBuffer || isDecoding"
              class="flex w-full items-center justify-center gap-2 bg-accent-amber py-3 font-display text-xs font-bold uppercase tracking-widest text-bg-deep transition-transform active:scale-[0.98] disabled:opacity-30"
              @click="startDecode"
            >
              <Icon v-if="isDecoding" icon="lucide:loader-2" class="size-5 animate-spin" />
              <Icon v-else icon="lucide:search" class="size-5" />
              Bắt đầu giải mã
            </button>
          </div>

          <div class="flex flex-col border border-border-default bg-bg-surface p-4">
            <h3 class="mb-3 font-display text-sm font-bold text-accent-amber">// Nội dung giải mã</h3>

            <div v-if="decodeError" class="flex flex-col gap-3">
              <div class="flex items-start gap-2 border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-300">
                <Icon icon="lucide:alert-triangle" class="mt-0.5 size-4 shrink-0 text-red-400" />
                {{ decodeError }}
              </div>
            </div>

            <div v-else-if="decodedText" class="flex flex-col gap-4">
              <div class="whitespace-pre-wrap border border-border-default bg-bg-deep p-6 font-mono text-sm leading-relaxed text-accent-sky">
                {{ decodedText }}
              </div>
              <button
                class="flex items-center justify-center gap-2 border border-border-default px-4 py-2 text-xs font-bold uppercase tracking-widest hover:border-accent-sky hover:text-accent-sky"
                @click="copy(decodedText)"
              >
                <Icon :icon="copied ? 'lucide:check' : 'lucide:copy'" class="size-4" />
                {{ copied ? 'Đã sao chép' : 'Sao chép nội dung' }}
              </button>
            </div>

            <div v-else class="flex flex-1 flex-col items-center justify-center text-center opacity-20">
              <Icon icon="lucide:eye-off" class="size-24" />
              <p class="mt-4 text-sm">Mật thư sẽ được phục hồi tại đây</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
* {
  border-radius: 0 !important;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translate(-50%, -20px);
}

.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -20px);
}
</style>
