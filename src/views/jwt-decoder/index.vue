<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useClipboard } from '@vueuse/core'
import { Icon } from '@iconify/vue'

// ===== Types =====
interface JwtHeader {
  alg?: string
  typ?: string
  [key: string]: unknown
}

interface JwtPayload {
  exp?: number
  iat?: number
  nbf?: number
  sub?: string
  iss?: string
  aud?: string | string[]
  [key: string]: unknown
}

interface DecodedJwt {
  header: JwtHeader
  payload: JwtPayload
  signature: string
  rawParts: [string, string, string]
}

interface ValidationResult {
  valid: boolean
  message: string
}

// ===== State =====
const jwtInput = ref('')
const secretKey = ref('')
const decoded = ref<DecodedJwt | null>(null)
const validationErrors = ref<string[]>([])
const signatureStatus = ref<'idle' | 'valid' | 'invalid' | 'verifying'>('idle')
const expandedSections = ref<Record<string, boolean>>({
  header: true,
  payload: true,
  signature: true,
})

// Collapsible JSON state
const collapsedPaths = ref<Set<string>>(new Set())

const { copy: copyToClipboard } = useClipboard()
const copiedSection = ref('')

// ===== Base64URL Decode =====
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const pad = base64.length % 4
  if (pad === 2) base64 += '=='
  else if (pad === 3) base64 += '='
  try {
    return decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    )
  } catch {
    return atob(base64)
  }
}

function isValidBase64Url(str: string): boolean {
  return /^[A-Za-z0-9_-]+={0,2}$/.test(str)
}

// ===== Decode JWT =====
function decodeJwt(token: string): DecodedJwt | null {
  const parts = token.trim().split('.')
  if (parts.length !== 3) return null

  const [headerB64, payloadB64, signatureB64] = parts as [string, string, string]

  if (!isValidBase64Url(headerB64) || !isValidBase64Url(payloadB64)) return null

  try {
    const header = JSON.parse(base64UrlDecode(headerB64)) as JwtHeader
    const payload = JSON.parse(base64UrlDecode(payloadB64)) as JwtPayload
    return {
      header,
      payload,
      signature: signatureB64,
      rawParts: [headerB64, payloadB64, signatureB64],
    }
  } catch {
    return null
  }
}

// ===== Validation =====
function validateToken(token: string): ValidationResult[] {
  const results: ValidationResult[] = []
  const parts = token.trim().split('.')

  // Check 3 parts
  results.push({
    valid: parts.length === 3,
    message:
      parts.length === 3
        ? 'Token có đủ 3 phần (Header.Payload.Signature)'
        : `Token có ${parts.length} phần, cần đúng 3 phần`,
  })

  if (parts.length !== 3) return results

  const [headerB64, payloadB64] = parts

  // Check Base64URL validity
  results.push({
    valid: isValidBase64Url(headerB64 ?? ''),
    message: isValidBase64Url(headerB64 ?? '')
      ? 'Header Base64URL hợp lệ'
      : 'Header Base64URL không hợp lệ',
  })

  results.push({
    valid: isValidBase64Url(payloadB64 ?? ''),
    message: isValidBase64Url(payloadB64 ?? '')
      ? 'Payload Base64URL hợp lệ'
      : 'Payload Base64URL không hợp lệ',
  })

  // Check JSON parse
  try {
    const header = JSON.parse(base64UrlDecode(headerB64 ?? '')) as JwtHeader
    results.push({ valid: true, message: 'Header JSON hợp lệ' })

    if (header.alg) {
      results.push({ valid: true, message: `Thuật toán: ${header.alg}` })
    }
    if (header.typ === 'JWT') {
      results.push({ valid: true, message: 'Type: JWT' })
    }
  } catch {
    results.push({ valid: false, message: 'Không thể parse Header JSON' })
  }

  try {
    JSON.parse(base64UrlDecode(payloadB64 ?? ''))
    results.push({ valid: true, message: 'Payload JSON hợp lệ' })
  } catch {
    results.push({ valid: false, message: 'Không thể parse Payload JSON' })
  }

  return results
}

// ===== Algorithm Detection =====
const algorithm = computed(() => {
  if (!decoded.value) return null
  return decoded.value.header.alg ?? 'unknown'
})

const isAlgorithmDangerous = computed(() => {
  if (!algorithm.value) return false
  return algorithm.value.toLowerCase() === 'none'
})

const algorithmInfo = computed(() => {
  const alg = algorithm.value
  if (!alg) return null

  const info: Record<string, { label: string; description: string; color: string }> = {
    HS256: {
      label: 'HS256',
      description: 'HMAC với SHA-256 — Symmetric',
      color: 'text-accent-sky',
    },
    HS384: {
      label: 'HS384',
      description: 'HMAC với SHA-384 — Symmetric',
      color: 'text-accent-sky',
    },
    HS512: {
      label: 'HS512',
      description: 'HMAC với SHA-512 — Symmetric',
      color: 'text-accent-sky',
    },
    RS256: {
      label: 'RS256',
      description: 'RSA Signature với SHA-256 — Asymmetric',
      color: 'text-accent-amber',
    },
    RS384: {
      label: 'RS384',
      description: 'RSA Signature với SHA-384 — Asymmetric',
      color: 'text-accent-amber',
    },
    RS512: {
      label: 'RS512',
      description: 'RSA Signature với SHA-512 — Asymmetric',
      color: 'text-accent-amber',
    },
    ES256: {
      label: 'ES256',
      description: 'ECDSA với P-256 và SHA-256 — Asymmetric',
      color: 'text-accent-amber',
    },
    PS256: {
      label: 'PS256',
      description: 'RSA-PSS với SHA-256 — Asymmetric',
      color: 'text-accent-amber',
    },
    none: {
      label: 'none',
      description: '⚠️ KHÔNG CÓ CHỮ KÝ — Token không được bảo vệ!',
      color: 'text-red-500',
    },
  }

  return (
    info[alg] ?? {
      label: alg,
      description: 'Thuật toán không xác định',
      color: 'text-text-secondary',
    }
  )
})

// ===== Expiration =====
interface TimeInfo {
  label: string
  timestamp: number
  readable: string
  relative: string
  status: 'valid' | 'expired' | 'future' | 'info'
}

function formatTimestamp(ts: number): string {
  return new Date(ts * 1000).toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  })
}

function getRelativeTime(ts: number): string {
  const now = Date.now() / 1000
  const diff = ts - now
  const absDiff = Math.abs(diff)

  if (absDiff < 60)
    return diff > 0 ? `trong ${Math.round(absDiff)} giây` : `${Math.round(absDiff)} giây trước`
  if (absDiff < 3600) {
    const mins = Math.round(absDiff / 60)
    return diff > 0 ? `trong ${mins} phút` : `${mins} phút trước`
  }
  if (absDiff < 86400) {
    const hours = Math.round(absDiff / 3600)
    return diff > 0 ? `trong ${hours} giờ` : `${hours} giờ trước`
  }
  const days = Math.round(absDiff / 86400)
  return diff > 0 ? `trong ${days} ngày` : `${days} ngày trước`
}

const tokenTimeInfo = computed<TimeInfo[]>(() => {
  if (!decoded.value) return []
  const p = decoded.value.payload
  const now = Date.now() / 1000
  const items: TimeInfo[] = []

  if (p.iat !== undefined) {
    items.push({
      label: 'Issued At (iat)',
      timestamp: p.iat,
      readable: formatTimestamp(p.iat),
      relative: getRelativeTime(p.iat),
      status: 'info',
    })
  }

  if (p.nbf !== undefined) {
    items.push({
      label: 'Not Before (nbf)',
      timestamp: p.nbf,
      readable: formatTimestamp(p.nbf),
      relative: getRelativeTime(p.nbf),
      status: p.nbf > now ? 'future' : 'valid',
    })
  }

  if (p.exp !== undefined) {
    items.push({
      label: 'Expires At (exp)',
      timestamp: p.exp,
      readable: formatTimestamp(p.exp),
      relative: getRelativeTime(p.exp),
      status: p.exp < now ? 'expired' : 'valid',
    })
  }

  return items
})

const isTokenExpired = computed(() => {
  if (!decoded.value?.payload.exp) return null
  return decoded.value.payload.exp < Date.now() / 1000
})

// ===== Signature Verification =====
async function verifySignature(): Promise<void> {
  if (!decoded.value || !secretKey.value) return

  const alg = decoded.value.header.alg
  if (!alg || !alg.startsWith('HS')) {
    signatureStatus.value = 'invalid'
    return
  }

  signatureStatus.value = 'verifying'

  try {
    const encoder = new TextEncoder()
    const data = encoder.encode(`${decoded.value.rawParts[0]}.${decoded.value.rawParts[1]}`)
    const keyData = encoder.encode(secretKey.value)

    const hashAlg: Record<string, string> = {
      HS256: 'SHA-256',
      HS384: 'SHA-384',
      HS512: 'SHA-512',
    }

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: hashAlg[alg] ?? 'SHA-256' },
      false,
      ['sign'],
    )

    const signatureBytes = await crypto.subtle.sign('HMAC', cryptoKey, data)
    const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')

    signatureStatus.value = signatureB64 === decoded.value.rawParts[2] ? 'valid' : 'invalid'
  } catch {
    signatureStatus.value = 'invalid'
  }
}

// ===== JSON Tree =====
function togglePath(path: string): void {
  if (collapsedPaths.value.has(path)) {
    collapsedPaths.value.delete(path)
  } else {
    collapsedPaths.value.add(path)
  }
  // Trigger reactivity
  collapsedPaths.value = new Set(collapsedPaths.value)
}

function isCollapsed(path: string): boolean {
  return collapsedPaths.value.has(path)
}

function getValueType(value: unknown): string {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  return typeof value
}

// ===== Copy helpers =====
function handleCopy(text: string, section: string): void {
  copyToClipboard(text)
  copiedSection.value = section
  setTimeout(() => {
    copiedSection.value = ''
  }, 2000)
}

// ===== Sample JWT =====
function loadSample(): void {
  // This is a sample JWT with HS256 (secret: "j2team-vibe-secret")
  jwtInput.value =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJuYW1lIjoiVmliZSIsImlhdCI6MTcxMTMyNDgwMCwiZXhwIjoxNzc0MzEwNDAwfQ.vZnCalcJcMdU1GQWzjZIGEd45EeVseRme2evApJOaec'
}

// ===== Watch input =====
watch(jwtInput, (val) => {
  const trimmed = val.trim()
  if (!trimmed) {
    decoded.value = null
    validationErrors.value = []
    signatureStatus.value = 'idle'
    collapsedPaths.value = new Set()
    return
  }

  const results = validateToken(trimmed)
  validationErrors.value = results.filter((r) => !r.valid).map((r) => r.message)

  const d = decodeJwt(trimmed)
  decoded.value = d
  signatureStatus.value = 'idle'
  collapsedPaths.value = new Set()
})

function clearAll(): void {
  jwtInput.value = ''
  secretKey.value = ''
  decoded.value = null
  validationErrors.value = []
  signatureStatus.value = 'idle'
  collapsedPaths.value = new Set()
}
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body">
    <!-- Header -->
    <div class="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-4 animate-fade-up">
      <div class="flex items-center justify-between flex-wrap gap-4">
        <div class="flex items-center gap-3">
          <Icon icon="lucide:key-round" class="size-8 text-accent-coral" />
          <h1 class="font-display text-3xl sm:text-4xl font-bold text-text-primary">JWT Decoder</h1>
        </div>
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
        >
          <Icon icon="lucide:arrow-left" class="size-4" />
          Trang chủ
        </RouterLink>
      </div>
      <p class="mt-3 text-text-secondary text-sm sm:text-base max-w-2xl">
        Giải mã, phân tích và xác minh JWT token ngay trên trình duyệt — không gửi dữ liệu lên
        server.
      </p>
    </div>

    <div class="max-w-5xl mx-auto px-4 sm:px-6 pb-16">
      <!-- Input Section -->
      <div class="animate-fade-up animate-delay-1">
        <div class="border border-border-default bg-bg-surface p-4 sm:p-6">
          <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 class="font-display text-lg font-semibold flex items-center gap-2">
              <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
              Nhập JWT Token
            </h2>
            <div class="flex gap-2">
              <button
                class="inline-flex items-center gap-1.5 border border-border-default px-3 py-1.5 text-xs text-text-secondary transition hover:border-accent-amber hover:text-accent-amber"
                @click="loadSample"
              >
                <Icon icon="lucide:flask-conical" class="size-3.5" />
                Token mẫu
              </button>
              <button
                v-if="jwtInput"
                class="inline-flex items-center gap-1.5 border border-border-default px-3 py-1.5 text-xs text-text-secondary transition hover:border-red-500 hover:text-red-400"
                @click="clearAll"
              >
                <Icon icon="lucide:trash-2" class="size-3.5" />
                Xóa
              </button>
            </div>
          </div>
          <textarea
            v-model="jwtInput"
            class="w-full h-32 sm:h-28 bg-bg-deep border border-border-default text-text-primary font-mono text-sm p-3 resize-y focus:outline-none focus:border-accent-coral transition placeholder:text-text-dim"
            placeholder="Paste JWT token vào đây... (eyJhbGciOiJIUzI1...)"
            spellcheck="false"
          />
        </div>
      </div>

      <!-- Validation Errors -->
      <div
        v-if="validationErrors.length > 0"
        class="mt-4 border border-red-500/30 bg-red-500/5 p-4 animate-fade-up"
      >
        <div class="flex items-center gap-2 mb-2">
          <Icon icon="lucide:alert-triangle" class="size-5 text-red-400" />
          <span class="font-display text-sm font-semibold text-red-400">Lỗi Token</span>
        </div>
        <ul class="space-y-1">
          <li
            v-for="(error, i) in validationErrors"
            :key="i"
            class="text-sm text-red-300 flex items-start gap-2"
          >
            <Icon icon="lucide:x" class="size-4 mt-0.5 shrink-0" />
            {{ error }}
          </li>
        </ul>
      </div>

      <!-- Decoded Results -->
      <div v-if="decoded" class="mt-6 space-y-4">
        <!-- Algorithm & Expiration Row -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-up animate-delay-2">
          <!-- Algorithm Detection -->
          <div class="border border-border-default bg-bg-surface p-4 sm:p-5">
            <h3 class="font-display text-sm font-semibold flex items-center gap-2 mb-3">
              <span class="text-accent-amber font-display text-sm tracking-widest">//</span>
              Thuật toán
            </h3>
            <div v-if="algorithmInfo" class="flex items-center gap-3">
              <span
                class="font-mono text-xl font-bold"
                :class="[isAlgorithmDangerous ? 'text-red-500' : algorithmInfo.color]"
              >
                {{ algorithmInfo.label }}
              </span>
            </div>
            <p
              v-if="algorithmInfo"
              class="mt-2 text-sm"
              :class="[isAlgorithmDangerous ? 'text-red-400' : 'text-text-secondary']"
            >
              {{ algorithmInfo.description }}
            </p>
            <div
              v-if="isAlgorithmDangerous"
              class="mt-3 border border-red-500/30 bg-red-500/10 p-3"
            >
              <div class="flex items-start gap-2">
                <Icon icon="lucide:shield-alert" class="size-5 text-red-400 shrink-0 mt-0.5" />
                <p class="text-xs text-red-300">
                  Token với <code class="bg-red-500/20 px-1">alg: "none"</code> không có chữ ký bảo
                  vệ. Bất kỳ ai cũng có thể giả mạo token này!
                </p>
              </div>
            </div>
          </div>

          <!-- Token Expiration -->
          <div class="border border-border-default bg-bg-surface p-4 sm:p-5">
            <h3 class="font-display text-sm font-semibold flex items-center gap-2 mb-3">
              <span class="text-accent-sky font-display text-sm tracking-widest">//</span>
              Thời hạn Token
            </h3>
            <div v-if="tokenTimeInfo.length > 0" class="space-y-3">
              <div v-for="info in tokenTimeInfo" :key="info.label" class="flex flex-col gap-0.5">
                <div class="flex items-center gap-2">
                  <Icon
                    :icon="
                      info.status === 'expired'
                        ? 'lucide:clock-alert'
                        : info.status === 'future'
                          ? 'lucide:clock-arrow-up'
                          : info.status === 'valid'
                            ? 'lucide:clock-check'
                            : 'lucide:clock'
                    "
                    class="size-4 shrink-0"
                    :class="{
                      'text-red-400': info.status === 'expired',
                      'text-accent-amber': info.status === 'future',
                      'text-green-400': info.status === 'valid',
                      'text-text-dim': info.status === 'info',
                    }"
                  />
                  <span class="text-xs text-text-dim font-display tracking-wide">{{
                    info.label
                  }}</span>
                </div>
                <p class="text-sm text-text-primary ml-6">{{ info.readable }}</p>
                <p
                  class="text-xs ml-6"
                  :class="{
                    'text-red-400': info.status === 'expired',
                    'text-accent-amber': info.status === 'future',
                    'text-green-400': info.status === 'valid',
                    'text-text-dim': info.status === 'info',
                  }"
                >
                  {{ info.relative }}
                </p>
              </div>
            </div>
            <div v-else class="text-sm text-text-dim flex items-center gap-2">
              <Icon icon="lucide:info" class="size-4" />
              Token không chứa thông tin thời gian
            </div>

            <!-- Expiration badge -->
            <div v-if="isTokenExpired !== null" class="mt-3">
              <span
                v-if="isTokenExpired"
                class="inline-flex items-center gap-1.5 border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs text-red-400 font-display tracking-wide"
              >
                <Icon icon="lucide:shield-x" class="size-3.5" />
                ĐÃ HẾT HẠN
              </span>
              <span
                v-else
                class="inline-flex items-center gap-1.5 border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs text-green-400 font-display tracking-wide"
              >
                <Icon icon="lucide:shield-check" class="size-3.5" />
                CÒN HẠN
              </span>
            </div>
          </div>
        </div>

        <!-- Header Section -->
        <div class="border border-border-default bg-bg-surface animate-fade-up animate-delay-3">
          <button
            class="w-full flex items-center justify-between p-4 sm:p-5 transition hover:bg-bg-elevated"
            @click="expandedSections.header = !expandedSections.header"
          >
            <h3 class="font-display text-sm font-semibold flex items-center gap-2">
              <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
              Header
              <span class="text-xs text-text-dim font-mono">JOSE</span>
            </h3>
            <div class="flex items-center gap-2">
              <button
                class="p-1 text-text-dim hover:text-accent-sky transition"
                title="Copy Header JSON"
                @click.stop="handleCopy(JSON.stringify(decoded.header, null, 2), 'header')"
              >
                <Icon
                  :icon="copiedSection === 'header' ? 'lucide:check' : 'lucide:copy'"
                  class="size-4"
                />
              </button>
              <Icon
                icon="lucide:chevron-down"
                class="size-5 text-text-dim transition-transform duration-200"
                :class="{ '-rotate-180': expandedSections.header }"
              />
            </div>
          </button>
          <div
            v-if="expandedSections.header"
            class="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-border-default pt-4"
          >
            <div class="bg-bg-deep border border-border-default p-3 sm:p-4 overflow-x-auto">
              <!-- Recursive JSON Tree -->
              <div class="font-mono text-sm leading-relaxed">
                <template v-for="(value, key) in decoded.header" :key="String(key)">
                  <div class="flex items-start gap-1 py-0.5">
                    <button
                      v-if="typeof value === 'object' && value !== null"
                      class="text-text-dim hover:text-text-primary transition shrink-0 mt-0.5"
                      @click="togglePath('header.' + String(key))"
                    >
                      <Icon
                        :icon="
                          isCollapsed('header.' + String(key))
                            ? 'lucide:chevron-right'
                            : 'lucide:chevron-down'
                        "
                        class="size-3.5"
                      />
                    </button>
                    <span v-else class="w-3.5 shrink-0" />
                    <span class="text-accent-sky">"{{ key }}"</span>
                    <span class="text-text-dim">:</span>
                    <template v-if="typeof value === 'string'">
                      <span class="text-green-400">"{{ value }}"</span>
                    </template>
                    <template v-else-if="typeof value === 'number'">
                      <span class="text-accent-amber">{{ value }}</span>
                    </template>
                    <template v-else-if="typeof value === 'boolean'">
                      <span class="text-accent-coral">{{ value }}</span>
                    </template>
                    <template v-else-if="value === null">
                      <span class="text-text-dim">null</span>
                    </template>
                    <template
                      v-else-if="typeof value === 'object' && !isCollapsed('header.' + String(key))"
                    >
                      <span class="text-text-dim">{{ Array.isArray(value) ? '[' : '{' }}</span>
                      <span class="text-text-dim ml-1 text-xs">{{
                        Array.isArray(value)
                          ? `${value.length} items`
                          : `${Object.keys(value).length} keys`
                      }}</span>
                    </template>
                    <template
                      v-else-if="typeof value === 'object' && isCollapsed('header.' + String(key))"
                    >
                      <span class="text-text-dim">{{ Array.isArray(value) ? `[…]` : `{…}` }}</span>
                    </template>
                  </div>
                  <div
                    v-if="
                      typeof value === 'object' &&
                      value !== null &&
                      !isCollapsed('header.' + String(key))
                    "
                    class="ml-6 border-l border-border-default pl-3"
                  >
                    <div
                      v-for="(v, k) in value as Record<string, unknown>"
                      :key="String(k)"
                      class="flex items-start gap-1 py-0.5"
                    >
                      <span class="w-3.5 shrink-0" />
                      <span class="text-accent-sky">"{{ k }}"</span>
                      <span class="text-text-dim">:</span>
                      <span
                        :class="
                          getValueType(v) === 'string'
                            ? 'text-green-400'
                            : getValueType(v) === 'number'
                              ? 'text-accent-amber'
                              : 'text-text-dim'
                        "
                      >
                        {{ getValueType(v) === 'string' ? `"${v}"` : String(v) }}
                      </span>
                    </div>
                    <div class="text-text-dim">{{ Array.isArray(value) ? ']' : '}' }}</div>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>

        <!-- Payload Section -->
        <div class="border border-border-default bg-bg-surface animate-fade-up animate-delay-4">
          <button
            class="w-full flex items-center justify-between p-4 sm:p-5 transition hover:bg-bg-elevated"
            @click="expandedSections.payload = !expandedSections.payload"
          >
            <h3 class="font-display text-sm font-semibold flex items-center gap-2">
              <span class="text-accent-amber font-display text-sm tracking-widest">//</span>
              Payload
              <span class="text-xs text-text-dim font-mono">Claims</span>
            </h3>
            <div class="flex items-center gap-2">
              <button
                class="p-1 text-text-dim hover:text-accent-sky transition"
                title="Copy Payload JSON"
                @click.stop="handleCopy(JSON.stringify(decoded.payload, null, 2), 'payload')"
              >
                <Icon
                  :icon="copiedSection === 'payload' ? 'lucide:check' : 'lucide:copy'"
                  class="size-4"
                />
              </button>
              <Icon
                icon="lucide:chevron-down"
                class="size-5 text-text-dim transition-transform duration-200"
                :class="{ '-rotate-180': expandedSections.payload }"
              />
            </div>
          </button>
          <div
            v-if="expandedSections.payload"
            class="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-border-default pt-4"
          >
            <div class="bg-bg-deep border border-border-default p-3 sm:p-4 overflow-x-auto">
              <div class="font-mono text-sm leading-relaxed">
                <template v-for="(value, key) in decoded.payload" :key="String(key)">
                  <div class="flex items-start gap-1 py-0.5 flex-wrap">
                    <button
                      v-if="typeof value === 'object' && value !== null"
                      class="text-text-dim hover:text-text-primary transition shrink-0 mt-0.5"
                      @click="togglePath('payload.' + String(key))"
                    >
                      <Icon
                        :icon="
                          isCollapsed('payload.' + String(key))
                            ? 'lucide:chevron-right'
                            : 'lucide:chevron-down'
                        "
                        class="size-3.5"
                      />
                    </button>
                    <span v-else class="w-3.5 shrink-0" />
                    <span class="text-accent-sky">"{{ key }}"</span>
                    <span class="text-text-dim">:</span>
                    <template v-if="typeof value === 'string'">
                      <span class="text-green-400 break-all">"{{ value }}"</span>
                    </template>
                    <template v-else-if="typeof value === 'number'">
                      <span class="text-accent-amber">{{ value }}</span>
                      <!-- Show readable time for known timestamp fields -->
                      <span
                        v-if="['exp', 'iat', 'nbf', 'auth_time'].includes(String(key))"
                        class="text-text-dim text-xs ml-2"
                      >
                        → {{ formatTimestamp(value) }}
                      </span>
                    </template>
                    <template v-else-if="typeof value === 'boolean'">
                      <span class="text-accent-coral">{{ value }}</span>
                    </template>
                    <template v-else-if="value === null">
                      <span class="text-text-dim">null</span>
                    </template>
                    <template
                      v-else-if="
                        typeof value === 'object' && !isCollapsed('payload.' + String(key))
                      "
                    >
                      <span class="text-text-dim">{{ Array.isArray(value) ? '[' : '{' }}</span>
                    </template>
                    <template
                      v-else-if="typeof value === 'object' && isCollapsed('payload.' + String(key))"
                    >
                      <span class="text-text-dim">{{ Array.isArray(value) ? `[…]` : `{…}` }}</span>
                    </template>
                  </div>
                  <div
                    v-if="
                      typeof value === 'object' &&
                      value !== null &&
                      !isCollapsed('payload.' + String(key))
                    "
                    class="ml-6 border-l border-border-default pl-3"
                  >
                    <template v-if="Array.isArray(value)">
                      <div
                        v-for="(item, idx) in value"
                        :key="idx"
                        class="flex items-start gap-1 py-0.5"
                      >
                        <span class="w-3.5 shrink-0" />
                        <span
                          :class="
                            typeof item === 'string'
                              ? 'text-green-400'
                              : typeof item === 'number'
                                ? 'text-accent-amber'
                                : 'text-text-dim'
                          "
                        >
                          {{ typeof item === 'string' ? `"${item}"` : String(item)
                          }}{{ idx < value.length - 1 ? ',' : '' }}
                        </span>
                      </div>
                    </template>
                    <template v-else>
                      <div
                        v-for="(v, k) in value as Record<string, unknown>"
                        :key="String(k)"
                        class="flex items-start gap-1 py-0.5"
                      >
                        <span class="w-3.5 shrink-0" />
                        <span class="text-accent-sky">"{{ k }}"</span>
                        <span class="text-text-dim">:</span>
                        <span
                          :class="
                            getValueType(v) === 'string'
                              ? 'text-green-400'
                              : getValueType(v) === 'number'
                                ? 'text-accent-amber'
                                : 'text-text-dim'
                          "
                        >
                          {{ getValueType(v) === 'string' ? `"${v}"` : String(v) }}
                        </span>
                      </div>
                    </template>
                    <div class="text-text-dim">{{ Array.isArray(value) ? ']' : '}' }}</div>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>

        <!-- Signature Section -->
        <div class="border border-border-default bg-bg-surface animate-fade-up animate-delay-5">
          <button
            class="w-full flex items-center justify-between p-4 sm:p-5 transition hover:bg-bg-elevated"
            @click="expandedSections.signature = !expandedSections.signature"
          >
            <h3 class="font-display text-sm font-semibold flex items-center gap-2">
              <span class="text-accent-sky font-display text-sm tracking-widest">//</span>
              Signature
            </h3>
            <Icon
              icon="lucide:chevron-down"
              class="size-5 text-text-dim transition-transform duration-200"
              :class="{ '-rotate-180': expandedSections.signature }"
            />
          </button>
          <div
            v-if="expandedSections.signature"
            class="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-border-default pt-4"
          >
            <!-- Raw signature -->
            <div class="bg-bg-deep border border-border-default p-3 sm:p-4 mb-4">
              <p class="font-mono text-sm text-text-secondary break-all">
                {{ decoded.signature }}
              </p>
            </div>

            <!-- Verify section (only for HMAC algorithms) -->
            <div
              v-if="algorithm && algorithm.startsWith('HS')"
              class="border border-border-default p-4"
            >
              <h4
                class="font-display text-xs tracking-wide text-text-dim mb-3 flex items-center gap-2"
              >
                <Icon icon="lucide:shield-check" class="size-4 text-accent-sky" />
                XÁC MINH CHỮ KÝ ({{ algorithm }})
              </h4>
              <div class="flex flex-col sm:flex-row gap-3">
                <input
                  v-model="secretKey"
                  type="text"
                  class="flex-1 bg-bg-deep border border-border-default text-text-primary font-mono text-sm px-3 py-2 focus:outline-none focus:border-accent-coral transition placeholder:text-text-dim"
                  placeholder="Nhập secret key..."
                  spellcheck="false"
                  @keyup.enter="verifySignature"
                />
                <button
                  class="inline-flex items-center justify-center gap-2 border border-accent-sky bg-accent-sky/10 px-4 py-2 text-sm text-accent-sky transition hover:bg-accent-sky/20 font-display tracking-wide shrink-0"
                  :disabled="!secretKey || signatureStatus === 'verifying'"
                  @click="verifySignature"
                >
                  <Icon
                    :icon="
                      signatureStatus === 'verifying' ? 'lucide:loader-2' : 'lucide:shield-check'
                    "
                    class="size-4"
                    :class="{ 'animate-spin': signatureStatus === 'verifying' }"
                  />
                  Xác minh
                </button>
              </div>

              <!-- Verification result -->
              <div
                v-if="signatureStatus === 'valid'"
                class="mt-3 flex items-center gap-2 text-green-400"
              >
                <Icon icon="lucide:check-circle-2" class="size-5" />
                <span class="text-sm font-display tracking-wide"
                  >Chữ ký hợp lệ — Token chưa bị thay đổi</span
                >
              </div>
              <div
                v-else-if="signatureStatus === 'invalid'"
                class="mt-3 flex items-center gap-2 text-red-400"
              >
                <Icon icon="lucide:x-circle" class="size-5" />
                <span class="text-sm font-display tracking-wide"
                  >Chữ ký không hợp lệ — Token có thể đã bị thay đổi hoặc sai secret key</span
                >
              </div>
            </div>

            <!-- Non-HMAC info -->
            <div
              v-else-if="algorithm && !algorithm.startsWith('HS')"
              class="border border-border-default p-4"
            >
              <div class="flex items-start gap-2 text-text-secondary">
                <Icon icon="lucide:info" class="size-5 shrink-0 mt-0.5 text-accent-amber" />
                <p class="text-sm">
                  Thuật toán
                  <code class="bg-bg-deep px-1.5 py-0.5 text-accent-amber font-mono">{{
                    algorithm
                  }}</code>
                  sử dụng asymmetric key. Công cụ này hiện chỉ hỗ trợ xác minh chữ ký HMAC
                  (HS256/HS384/HS512).
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Validation Summary -->
        <div
          class="border border-border-default bg-bg-surface p-4 sm:p-5 animate-fade-up animate-delay-6"
        >
          <h3 class="font-display text-sm font-semibold flex items-center gap-2 mb-3">
            <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
            Kiểm tra cấu trúc
          </h3>
          <div class="space-y-2">
            <div
              v-for="(result, i) in validateToken(jwtInput.trim())"
              :key="i"
              class="flex items-center gap-2 text-sm"
            >
              <Icon
                :icon="result.valid ? 'lucide:check-circle-2' : 'lucide:x-circle'"
                class="size-4 shrink-0"
                :class="result.valid ? 'text-green-400' : 'text-red-400'"
              />
              <span :class="result.valid ? 'text-text-secondary' : 'text-red-300'">
                {{ result.message }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-if="!decoded && !jwtInput.trim()"
        class="mt-8 border border-border-default bg-bg-surface p-8 sm:p-12 text-center animate-fade-up animate-delay-2"
      >
        <Icon icon="lucide:scan-text" class="size-16 text-text-dim mx-auto mb-4" />
        <p class="text-text-secondary text-lg font-display">Paste JWT token để bắt đầu phân tích</p>
        <p class="text-text-dim text-sm mt-2">
          Hỗ trợ HS256, HS384, HS512, RS256, ES256 và nhiều thuật toán khác
        </p>
        <button
          class="mt-6 inline-flex items-center gap-2 border border-accent-coral bg-accent-coral/10 px-5 py-2.5 text-sm text-accent-coral transition hover:bg-accent-coral/20 font-display tracking-wide"
          @click="loadSample"
        >
          <Icon icon="lucide:flask-conical" class="size-4" />
          Thử với token mẫu
        </button>
      </div>

      <!-- Footer -->
      <div class="mt-12 text-center text-text-dim text-xs animate-fade-up animate-delay-7">
        <p>
          Tạo bởi
          <a
            href="https://www.facebook.com/datpahm2503/"
            target="_blank"
            rel="noopener noreferrer"
            class="text-accent-coral hover:text-accent-amber transition"
            >Phạm Đức Đạt</a
          >
          — Mọi dữ liệu được xử lý ngay trên trình duyệt
        </p>
      </div>
    </div>
  </div>
</template>
