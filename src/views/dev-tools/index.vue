<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'

interface OsintLink {
  label: string
  url: string
  description: string
}

const osintTypes = [
  { value: 'email', label: 'Email' },
  { value: 'domain', label: 'Domain' },
  { value: 'username', label: 'Username' },
  { value: 'ip', label: 'IP' },
] as const

type OsintType = (typeof osintTypes)[number]['value']

interface SecurityHeaderCheck {
  name: string
  present: boolean
  value: string
}

interface SecurityScanResult {
  baseUrl: string
  score: number
  headers: SecurityHeaderCheck[]
  robotsTxtFound: boolean
  securityTxtFound: boolean
  robotsTxtUrl: string
  securityTxtUrl: string
}

interface JwtDecoded {
  header: string
  payload: string
  error: string
}

interface TimestampResult {
  humanLocal: string
  humanUtc: string
  seconds: string
  millis: string
  error: string
}

// Base64
const base64Input = ref('')
const base64Mode = ref<'encode' | 'decode'>('encode')
const base64Result = computed(() => {
  const s = base64Input.value
  if (!s.trim()) return { output: '', error: '' }
  try {
    if (base64Mode.value === 'encode') {
      return { output: btoa(unescape(encodeURIComponent(s))), error: '' }
    }
    return { output: decodeURIComponent(escape(atob(s))), error: '' }
  } catch {
    return { output: '', error: 'Dữ liệu không hợp lệ cho Base64.' }
  }
})

// URL
const urlInput = ref('')
const urlMode = ref<'encode' | 'decode'>('encode')
const urlResult = computed(() => {
  const s = urlInput.value
  if (!s.trim()) return { output: '', error: '' }
  try {
    if (urlMode.value === 'encode') return { output: encodeURIComponent(s), error: '' }
    return { output: decodeURIComponent(s), error: '' }
  } catch {
    return { output: '', error: 'Chuỗi URL không hợp lệ.' }
  }
})

// JSON
const jsonInput = ref('')
const jsonResult = computed(() => {
  const s = jsonInput.value.trim()
  if (!s) return { output: '', error: '' }
  try {
    const parsed = JSON.parse(s) as unknown
    return { output: JSON.stringify(parsed, null, 2), error: '' }
  } catch (e) {
    return { output: '', error: e instanceof Error ? e.message : 'JSON không hợp lệ.' }
  }
})

// JWT decode (header + payload, KHÔNG verify chữ ký)
const jwtInput = ref('')
const jwtResult = computed<JwtDecoded>(() => {
  const raw = jwtInput.value.trim()
  if (!raw) {
    return { header: '', payload: '', error: '' }
  }

  const parts = raw.split('.')
  if (parts.length < 2) {
    return { header: '', payload: '', error: 'Chuỗi JWT không hợp lệ (thiếu phần header/payload).' }
  }

  const headerPart = parts[0] ?? ''
  const payloadPart = parts[1] ?? ''
  try {
    const headerJson = atob(base64UrlToBase64(headerPart))
    const payloadJson = atob(base64UrlToBase64(payloadPart))

    let headerPretty = headerJson
    let payloadPretty = payloadJson

    try {
      headerPretty = JSON.stringify(JSON.parse(headerJson) as unknown, null, 2)
    } catch {
      // giữ raw
    }

    try {
      payloadPretty = JSON.stringify(JSON.parse(payloadJson) as unknown, null, 2)
    } catch {
      // giữ raw
    }

    return { header: headerPretty, payload: payloadPretty, error: '' }
  } catch {
    return { header: '', payload: '', error: 'Không thể decode JWT.' }
  }
})

// Timestamp convert
const timestampInput = ref('')
const timestampResult = computed<TimestampResult>(() => {
  const raw = timestampInput.value.trim()
  if (!raw) {
    return { humanLocal: '', humanUtc: '', seconds: '', millis: '', error: '' }
  }

  const numeric = Number(raw)
  let date: Date

  if (Number.isFinite(numeric)) {
    const millis = raw.length > 10 ? Math.trunc(numeric) : Math.trunc(numeric * 1000)
    date = new Date(millis)
  } else {
    date = new Date(raw)
  }

  if (Number.isNaN(date.getTime())) {
    return {
      humanLocal: '',
      humanUtc: '',
      seconds: '',
      millis: '',
      error: 'Không parse được timestamp / datetime.',
    }
  }

  const millis = date.getTime()
  const seconds = Math.floor(millis / 1000)

  return {
    humanLocal: date.toLocaleString(),
    humanUtc: date.toISOString(),
    seconds: seconds.toString(),
    millis: millis.toString(),
    error: '',
  }
})

// OSINT Fast
const osintInput = ref('')
const osintType = ref<OsintType>('email')
const osintLinks = computed<OsintLink[]>(() => {
  const raw = osintInput.value.trim()
  if (!raw) return []
  const encoded = encodeURIComponent(raw)
  const links: OsintLink[] = []

  if (osintType.value === 'email') {
    links.push(
      {
        label: 'Google search',
        url: `https://www.google.com/search?q="${encoded}"`,
        description: 'Tìm email trên Google (dork).',
      },
      {
        label: 'Have I Been Pwned',
        url: `https://haveibeenpwned.com/account/${encoded}`,
        description: 'Kiểm tra email đã từng bị lộ dữ liệu chưa.',
      },
      {
        label: 'GitHub search',
        url: `https://github.com/search?q=${encoded}&type=users`,
        description: 'Tìm tài khoản GitHub có dùng email này.',
      },
      {
        label: 'Facebook search',
        url: `https://www.facebook.com/search/top?q=${encoded}`,
        description: 'Tìm dấu vết email trên Facebook.',
      },
      {
        label: 'Google username check',
        url: `https://www.google.com/search?q=${encodeURIComponent(
          `username "${raw.split('@')[0]}"`,
        )}`,
        description: 'Dò username từ local-part của email.',
      },
    )
  } else if (osintType.value === 'domain') {
    links.push(
      {
        label: 'Google site search',
        url: `https://www.google.com/search?q=site:${encoded}`,
        description: 'Liệt kê trang con với Google.',
      },
      {
        label: 'crt.sh',
        url: `https://crt.sh/?q=${encoded}`,
        description: 'Xem certificate history (subdomain).',
      },
      {
        label: 'SecurityHeaders (web UI)',
        url: `https://securityheaders.com/?q=${encodeURIComponent(`https://${raw}`)}`,
        description: 'Scan nhanh security headers trên securityheaders.com.',
      },
      {
        label: 'Shodan',
        url: `https://www.shodan.io/search?query=${encoded}`,
        description: 'Tìm thông tin hạ tầng trên Shodan.',
      },
      {
        label: 'Censys',
        url: `https://search.censys.io/search?resource=hosts&q=${encoded}`,
        description: 'Tìm host liên quan trên Censys.',
      },
    )
  } else if (osintType.value === 'username') {
    const quoted = `"${raw}"`
    links.push(
      {
        label: 'Google search',
        url: `https://www.google.com/search?q=${encodeURIComponent(quoted)}`,
        description: 'Tìm username trên Google.',
      },
      {
        label: 'GitHub users',
        url: `https://github.com/search?q=${encoded}&type=users`,
        description: 'Tìm username trên GitHub.',
      },
      {
        label: 'Twitter / X',
        url: `https://x.com/search?q=${encoded}`,
        description: 'Tìm dấu vết trên X (Twitter).',
      },
      {
        label: 'Namechk (manual)',
        url: 'https://namechk.com/',
        description: 'Mở Namechk để check username trên nhiều dịch vụ.',
      },
    )
  } else if (osintType.value === 'ip') {
    links.push(
      {
        label: 'ipinfo.io',
        url: `https://ipinfo.io/${encoded}`,
        description: 'Thông tin IP cơ bản.',
      },
      {
        label: 'Shodan host',
        url: `https://www.shodan.io/host/${encoded}`,
        description: 'Mở host detail trên Shodan.',
      },
      {
        label: 'VirusTotal',
        url: `https://www.virustotal.com/gui/ip-address/${encoded}`,
        description: 'Check IP trên VirusTotal.',
      },
      {
        label: 'AbuseIPDB',
        url: `https://www.abuseipdb.com/check/${encoded}`,
        description: 'Xem IP có report xấu không.',
      },
    )
  }

  return links
})

// Website Security Scanner Lite (best effort, phụ thuộc CORS)
const securityDomain = ref('')
const securityLoading = ref(false)
const securityError = ref('')
const securityResult = ref<SecurityScanResult | null>(null)

async function runSecurityScan(): Promise<void> {
  securityError.value = ''
  securityResult.value = null

  const raw = securityDomain.value.trim()
  if (!raw) {
    securityError.value = 'Vui lòng nhập domain, ví dụ: example.com.'
    return
  }

  let baseUrl: URL
  try {
    const normalized =
      raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`
    baseUrl = new URL(normalized)
  } catch {
    securityError.value = 'Domain không hợp lệ.'
    return
  }

  securityLoading.value = true

  try {
    const mainUrl = baseUrl.toString()
    const robotsTxtUrl = new URL('/robots.txt', baseUrl).toString()
    const securityTxtUrl = new URL('/.well-known/security.txt', baseUrl).toString()

    const [mainRes, robotsRes, securityTxtRes] = await Promise.allSettled([
      fetch(mainUrl),
      fetch(robotsTxtUrl),
      fetch(securityTxtUrl),
    ])

    const headers: SecurityHeaderCheck[] = []

    if (mainRes.status === 'fulfilled') {
      const res = mainRes.value
      const xfo = res.headers.get('x-frame-options') ?? res.headers.get('X-Frame-Options') ?? null
      const csp =
        res.headers.get('content-security-policy') ??
        res.headers.get('Content-Security-Policy') ??
        null

      headers.push(
        {
          name: 'X-Frame-Options',
          present: Boolean(xfo),
          value: xfo ?? '-',
        },
        {
          name: 'Content-Security-Policy',
          present: Boolean(csp),
          value: csp ?? '-',
        },
      )
    }

    let robotsTxtFound = false
    if (robotsRes.status === 'fulfilled') {
      robotsTxtFound = robotsRes.value.ok
    }

    let securityTxtFound = false
    if (securityTxtRes.status === 'fulfilled') {
      securityTxtFound = securityTxtRes.value.ok
    }

    let score = 0
    const xfoCheck = headers.find((h) => h.name === 'X-Frame-Options')
    const cspCheck = headers.find((h) => h.name === 'Content-Security-Policy')

    if (xfoCheck?.present) score += 3
    if (cspCheck?.present) score += 4
    if (robotsTxtFound) score += 1
    if (securityTxtFound) score += 2
    if (score === 0) score = 3
    if (score > 10) score = 10

    securityResult.value = {
      baseUrl: baseUrl.toString(),
      score,
      headers,
      robotsTxtFound,
      securityTxtFound,
      robotsTxtUrl,
      securityTxtUrl,
    }
  } catch {
    securityError.value =
      'Không thể fetch thông tin bảo mật (có thể bị chặn CORS hoặc domain không phản hồi).'
  } finally {
    securityLoading.value = false
  }
}

function base64UrlToBase64(segment: string): string {
  let output = segment.replace(/-/g, '+').replace(/_/g, '/')
  const padding = output.length % 4
  if (padding === 2) {
    output += '=='
  } else if (padding === 3) {
    output += '='
  } else if (padding === 1) {
    output += '==='
  }
  return output
}

function copyToClipboard(text: string): void {
  void navigator.clipboard.writeText(text).catch(() => {})
}
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body">
    <header class="border-b border-border-default bg-bg-surface">
      <div class="mx-auto max-w-5xl px-6 py-6 sm:py-8">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="animate-fade-up">
            <h1 class="font-display text-2xl font-bold text-accent-coral sm:text-3xl">
              // Osint-fast
            </h1>
            <p class="mt-1 text-sm text-text-secondary">
              Dev Debug Toolbox · OSINT Fast · Website Security Scanner Lite — chạy 100% trên trình
              duyệt, không lưu dữ liệu.
            </p>
          </div>
          <RouterLink
            to="/"
            class="inline-flex w-fit items-center gap-2 border border-border-default bg-bg-surface px-4 py-2.5 text-sm text-text-secondary transition hover:border-accent-coral hover:bg-bg-elevated hover:text-text-primary animate-fade-up animate-delay-2"
          >
            &larr; Về trang chủ
          </RouterLink>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-5xl px-6 py-8 sm:py-10">
      <div class="flex gap-1.5 animate-fade-up animate-delay-1">
        <span
          v-for="n in 40"
          :key="n"
          class="h-1 w-1 rounded-full bg-border-default"
          aria-hidden="true"
        />
      </div>

      <!-- Dev Debug Toolbox -->
      <section class="mt-10 space-y-8">
        <!-- Base64 -->
        <article
          class="border border-border-default bg-bg-surface p-5 transition-all duration-300 hover:border-accent-coral/50 hover:bg-bg-elevated sm:p-6 animate-fade-up animate-delay-2"
        >
          <div class="mb-4 flex flex-wrap items-center gap-3">
            <h2
              class="font-display text-lg font-semibold text-text-primary flex items-center gap-2"
            >
              <span class="font-display text-sm tracking-widest text-accent-coral">//</span>
              Base64
            </h2>
            <div class="flex rounded border border-border-default bg-bg-deep p-0.5">
              <button
                type="button"
                :class="[
                  'px-3 py-1.5 text-xs font-medium transition',
                  base64Mode === 'encode'
                    ? 'bg-accent-coral text-bg-deep'
                    : 'text-text-secondary hover:text-text-primary',
                ]"
                @click="base64Mode = 'encode'"
              >
                Encode
              </button>
              <button
                type="button"
                :class="[
                  'px-3 py-1.5 text-xs font-medium transition',
                  base64Mode === 'decode'
                    ? 'bg-accent-coral text-bg-deep'
                    : 'text-text-secondary hover:text-text-primary',
                ]"
                @click="base64Mode = 'decode'"
              >
                Decode
              </button>
            </div>
          </div>
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label for="base64-in" class="mb-1 block text-xs text-text-dim">Input</label>
              <textarea
                id="base64-in"
                v-model="base64Input"
                rows="4"
                class="w-full border border-border-default bg-bg-deep px-3 py-2 text-sm text-text-primary placeholder:text-text-dim focus:border-accent-coral focus:outline-none"
                :placeholder="
                  base64Mode === 'encode' ? 'Nhập text cần encode...' : 'Nhập Base64 cần decode...'
                "
              />
            </div>
            <div>
              <div class="mb-1 flex items-center justify-between">
                <label for="base64-out" class="block text-xs text-text-dim">Output</label>
                <button
                  v-if="base64Result.output"
                  type="button"
                  class="text-xs text-accent-sky hover:underline"
                  @click="copyToClipboard(base64Result.output)"
                >
                  Copy
                </button>
              </div>
              <textarea
                id="base64-out"
                :value="base64Result.output"
                rows="4"
                readonly
                class="w-full border border-border-default bg-bg-deep px-3 py-2 text-sm text-text-primary placeholder:text-text-dim"
                :placeholder="base64Result.error || 'Kết quả hiển thị tại đây'"
              />
              <p v-if="base64Result.error" class="mt-1 text-xs text-accent-coral">
                {{ base64Result.error }}
              </p>
            </div>
          </div>
        </article>

        <!-- URL -->
        <article
          class="border border-border-default bg-bg-surface p-5 transition-all duration-300 hover:border-accent-amber/50 hover:bg-bg-elevated sm:p-6 animate-fade-up animate-delay-3"
        >
          <div class="mb-4 flex flex-wrap items-center gap-3">
            <h2
              class="font-display text-lg font-semibold text-text-primary flex items-center gap-2"
            >
              <span class="font-display text-sm tracking-widest text-accent-amber">//</span>
              URL Encode / Decode
            </h2>
            <div class="flex rounded border border-border-default bg-bg-deep p-0.5">
              <button
                type="button"
                :class="[
                  'px-3 py-1.5 text-xs font-medium transition',
                  urlMode === 'encode'
                    ? 'bg-accent-amber text-bg-deep'
                    : 'text-text-secondary hover:text-text-primary',
                ]"
                @click="urlMode = 'encode'"
              >
                Encode
              </button>
              <button
                type="button"
                :class="[
                  'px-3 py-1.5 text-xs font-medium transition',
                  urlMode === 'decode'
                    ? 'bg-accent-amber text-bg-deep'
                    : 'text-text-secondary hover:text-text-primary',
                ]"
                @click="urlMode = 'decode'"
              >
                Decode
              </button>
            </div>
          </div>
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label for="url-in" class="mb-1 block text-xs text-text-dim">Input</label>
              <textarea
                id="url-in"
                v-model="urlInput"
                rows="3"
                class="w-full border border-border-default bg-bg-deep px-3 py-2 text-sm text-text-primary placeholder:text-text-dim focus:border-accent-amber focus:outline-none"
                :placeholder="
                  urlMode === 'encode' ? 'Chuỗi cần encode...' : 'Chuỗi %XX cần decode...'
                "
              />
            </div>
            <div>
              <div class="mb-1 flex items-center justify-between">
                <label for="url-out" class="block text-xs text-text-dim">Output</label>
                <button
                  v-if="urlResult.output"
                  type="button"
                  class="text-xs text-accent-sky hover:underline"
                  @click="copyToClipboard(urlResult.output)"
                >
                  Copy
                </button>
              </div>
              <textarea
                id="url-out"
                :value="urlResult.output"
                rows="3"
                readonly
                class="w-full border border-border-default bg-bg-deep px-3 py-2 text-sm text-text-primary placeholder:text-text-dim"
                :placeholder="urlResult.error || 'Kết quả'"
              />
              <p v-if="urlResult.error" class="mt-1 text-xs text-accent-coral">
                {{ urlResult.error }}
              </p>
            </div>
          </div>
        </article>

        <!-- JSON -->
        <article
          class="border border-border-default bg-bg-surface p-5 transition-all duration-300 hover:border-accent-sky/50 hover:bg-bg-elevated sm:p-6 animate-fade-up animate-delay-4"
        >
          <h2
            class="mb-4 font-display text-lg font-semibold text-text-primary flex items-center gap-2"
          >
            <span class="font-display text-sm tracking-widest text-accent-sky">//</span>
            Format JSON
          </h2>
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label for="json-in" class="mb-1 block text-xs text-text-dim">
                JSON (minified hoặc lộn xộn)
              </label>
              <textarea
                id="json-in"
                v-model="jsonInput"
                rows="8"
                class="w-full border border-border-default bg-bg-deep px-3 py-2 font-mono text-sm text-text-primary placeholder:text-text-dim focus:border-accent-sky focus:outline-none"
                placeholder='{"key": "value"}'
              />
            </div>
            <div>
              <div class="mb-1 flex items-center justify-between">
                <label for="json-out" class="block text-xs text-text-dim">
                  JSON đã format (indent 2)
                </label>
                <button
                  v-if="jsonResult.output"
                  type="button"
                  class="text-xs text-accent-sky hover:underline"
                  @click="copyToClipboard(jsonResult.output)"
                >
                  Copy
                </button>
              </div>
              <textarea
                id="json-out"
                :value="jsonResult.output"
                rows="8"
                readonly
                class="w-full border border-border-default bg-bg-deep px-3 py-2 font-mono text-sm text-text-primary placeholder:text-text-dim"
                :placeholder="jsonResult.error || 'Kết quả'"
              />
              <p v-if="jsonResult.error" class="mt-1 text-xs text-accent-coral">
                {{ jsonResult.error }}
              </p>
            </div>
          </div>
        </article>

        <!-- JWT decode -->
        <article
          class="border border-border-default bg-bg-surface p-5 transition-all duration-300 hover:border-accent-amber/50 hover:bg-bg-elevated sm:p-6 animate-fade-up animate-delay-5"
        >
          <h2
            class="mb-2 font-display text-lg font-semibold text-text-primary flex items-center gap-2"
          >
            <span class="font-display text-sm tracking-widest text-accent-amber">//</span>
            JWT Decode
          </h2>
          <p class="mb-4 text-xs text-text-secondary">
            Giải mã phần header và payload của JWT để debug nhanh. Không verify chữ ký, chỉ dùng cho
            mục đích học tập / phân tích.
          </p>
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label for="jwt-in" class="mb-1 block text-xs text-text-dim">JWT</label>
              <textarea
                id="jwt-in"
                v-model="jwtInput"
                rows="5"
                class="w-full border border-border-default bg-bg-deep px-3 py-2 text-xs text-text-primary placeholder:text-text-dim focus:border-accent-amber focus:outline-none"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              />
            </div>
            <div>
              <label for="jwt-header" class="mb-1 block text-xs text-text-dim">Header</label>
              <textarea
                id="jwt-header"
                :value="jwtResult.header"
                rows="3"
                readonly
                class="w-full border border-border-default bg-bg-deep px-3 py-2 font-mono text-xs text-text-primary placeholder:text-text-dim"
                placeholder="Kết quả header"
              />
              <label for="jwt-payload" class="mt-3 mb-1 block text-xs text-text-dim">Payload</label>
              <textarea
                id="jwt-payload"
                :value="jwtResult.payload"
                rows="4"
                readonly
                class="w-full border border-border-default bg-bg-deep px-3 py-2 font-mono text-xs text-text-primary placeholder:text-text-dim"
                placeholder="Kết quả payload"
              />
              <p v-if="jwtResult.error" class="mt-2 text-xs text-accent-coral">
                {{ jwtResult.error }}
              </p>
            </div>
          </div>
        </article>

        <!-- Timestamp convert -->
        <article
          class="border border-border-default bg-bg-surface p-5 transition-all duration-300 hover:border-accent-sky/50 hover:bg-bg-elevated sm:p-6 animate-fade-up animate-delay-6"
        >
          <h2
            class="mb-2 font-display text-lg font-semibold text-text-primary flex items-center gap-2"
          >
            <span class="font-display text-sm tracking-widest text-accent-sky">//</span>
            Timestamp Convert
          </h2>
          <p class="mb-4 text-xs text-text-secondary">
            Chuyển đổi giữa Unix timestamp (seconds / milliseconds) và thời gian dạng người đọc
            được.
          </p>
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label for="ts-in" class="mb-1 block text-xs text-text-dim">
                Timestamp hoặc datetime
              </label>
              <input
                id="ts-in"
                v-model="timestampInput"
                type="text"
                class="w-full border border-border-default bg-bg-deep px-3 py-2 text-sm text-text-primary placeholder:text-text-dim focus:border-accent-sky focus:outline-none"
                placeholder="1735689600 / 1735689600000 / 2025-01-01T00:00:00Z"
              />
              <p class="mt-2 text-[11px] text-text-dim sm:text-xs">
                Nếu là số 10 chữ số → seconds, 13 chữ số → milliseconds. Chuỗi khác sẽ parse như
                Date().
              </p>
            </div>
            <div class="space-y-2 text-xs sm:text-sm">
              <div>
                <p class="text-[11px] text-text-dim sm:text-xs">Local time</p>
                <p class="mt-0.5 font-mono text-sm">
                  {{ timestampResult.humanLocal || '—' }}
                </p>
              </div>
              <div>
                <p class="text-[11px] text-text-dim sm:text-xs">UTC (ISO)</p>
                <p class="mt-0.5 font-mono text-sm">
                  {{ timestampResult.humanUtc || '—' }}
                </p>
              </div>
              <div class="flex gap-4">
                <div>
                  <p class="text-[11px] text-text-dim sm:text-xs">Seconds</p>
                  <p class="mt-0.5 font-mono text-sm">
                    {{ timestampResult.seconds || '—' }}
                  </p>
                </div>
                <div>
                  <p class="text-[11px] text-text-dim sm:text-xs">Milliseconds</p>
                  <p class="mt-0.5 font-mono text-sm">
                    {{ timestampResult.millis || '—' }}
                  </p>
                </div>
              </div>
              <p v-if="timestampResult.error" class="mt-1 text-xs text-accent-coral">
                {{ timestampResult.error }}
              </p>
            </div>
          </div>
        </article>
      </section>

      <!-- OSINT Fast + Security -->
      <section class="mt-12 space-y-8">
        <div class="flex items-center gap-3 animate-fade-up">
          <span class="font-display text-sm tracking-widest text-accent-amber">//</span>
          <h2 class="font-display text-xl font-semibold text-text-primary">
            OSINT Fast & Website Security
          </h2>
        </div>

        <!-- OSINT Fast -->
        <article
          class="border border-border-default bg-bg-surface p-5 transition-all duration-300 hover:border-accent-amber/50 hover:bg-bg-elevated sm:p-6 animate-fade-up animate-delay-3"
        >
          <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3
                class="font-display text-lg font-semibold text-text-primary flex items-center gap-2"
              >
                <span class="font-display text-sm tracking-widest text-accent-amber">//</span>
                OSINT Fast
              </h3>
              <p class="mt-1 text-xs text-text-secondary">
                Nhập email, domain, username hoặc IP — trang sẽ generate link truy vấn nhanh tới các
                tool OSINT phổ biến.
              </p>
            </div>
            <div class="flex flex-wrap gap-2 text-xs">
              <button
                v-for="type in osintTypes"
                :key="type.value"
                type="button"
                :class="[
                  'px-3 py-1 border border-border-default transition',
                  osintType === type.value
                    ? 'bg-accent-amber text-bg-deep'
                    : 'bg-bg-deep text-text-secondary hover:text-text-primary',
                ]"
                @click="osintType = type.value"
              >
                {{ type.label }}
              </button>
            </div>
          </div>
          <div>
            <label for="osint-input" class="mb-1 block text-xs text-text-dim">
              Giá trị cần tra cứu
            </label>
            <input
              id="osint-input"
              v-model="osintInput"
              type="text"
              class="w-full border border-border-default bg-bg-deep px-3 py-2 text-sm text-text-primary placeholder:text-text-dim focus:border-accent-amber focus:outline-none"
              :placeholder="
                osintType === 'email'
                  ? 'Ví dụ: abc@gmail.com'
                  : osintType === 'domain'
                    ? 'Ví dụ: example.com'
                    : osintType === 'username'
                      ? 'Ví dụ: hackerpro'
                      : 'Ví dụ: 1.2.3.4'
              "
            />
            <p class="mt-2 text-[11px] text-text-dim sm:text-xs">
              Chỉ generate link trên client, không gửi dữ liệu về server.
            </p>

            <ul v-if="osintLinks.length" class="mt-4 space-y-2">
              <li
                v-for="link in osintLinks"
                :key="link.label"
                class="flex items-center justify-between gap-3 border border-border-default bg-bg-deep px-3 py-2 text-xs sm:text-sm"
              >
                <div>
                  <p class="font-medium text-text-primary">
                    {{ link.label }}
                  </p>
                  <p class="text-[11px] text-text-dim sm:text-xs">
                    {{ link.description }}
                  </p>
                </div>
                <a
                  :href="link.url"
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  class="text-[11px] text-accent-sky link-underline sm:text-xs"
                >
                  Mở
                </a>
              </li>
            </ul>
          </div>
        </article>

        <!-- Website Security Scanner Lite -->
        <article
          class="border border-border-default bg-bg-surface p-5 transition-all duration-300 hover:border-accent-sky/50 hover:bg-bg-elevated sm:p-6 animate-fade-up animate-delay-4"
        >
          <h3
            class="mb-2 font-display text-lg font-semibold text-text-primary flex items-center gap-2"
          >
            <span class="font-display text-sm tracking-widest text-accent-sky">//</span>
            Website Security Scanner Lite
          </h3>
          <p class="mb-4 text-xs text-text-secondary">
            Check nhanh security headers, robots.txt và security.txt cho một domain. Kết quả phụ
            thuộc cấu hình CORS của website, nên đôi khi không đọc được đầy đủ.
          </p>
          <div class="grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <div>
              <label for="sec-domain" class="mb-1 block text-xs text-text-dim">Domain</label>
              <input
                id="sec-domain"
                v-model="securityDomain"
                type="text"
                class="w-full border border-border-default bg-bg-deep px-3 py-2 text-sm text-text-primary placeholder:text-text-dim focus:border-accent-sky focus:outline-none"
                placeholder="example.com hoặc https://example.com"
              />
              <button
                type="button"
                class="mt-3 inline-flex items-center justify-center border border-border-default bg-bg-deep px-4 py-2 text-xs text-text-secondary transition hover:border-accent-sky hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="securityLoading"
                @click="runSecurityScan"
              >
                <span v-if="securityLoading">Đang scan...</span>
                <span v-else>Scan</span>
              </button>
              <p class="mt-2 text-[11px] text-text-dim sm:text-xs">
                Fetch trực tiếp từ domain; nhiều site không bật CORS nên có thể chỉ xem được một
                phần thông tin.
              </p>
              <p v-if="securityError" class="mt-2 text-xs text-accent-coral">
                {{ securityError }}
              </p>
            </div>
            <div v-if="securityResult" class="space-y-3 text-xs sm:text-sm">
              <p>
                Security Score:
                <span class="font-display text-lg text-accent-coral">
                  {{ securityResult.score }}/10
                </span>
              </p>
              <p class="break-all text-text-secondary">
                {{ securityResult.baseUrl }}
              </p>
              <div>
                <p class="text-[11px] text-text-dim sm:text-xs">Security headers</p>
                <ul class="mt-1 space-y-1">
                  <li
                    v-for="header in securityResult.headers"
                    :key="header.name"
                    class="flex items-start justify-between gap-3"
                  >
                    <span class="text-text-secondary">
                      {{ header.name }}
                    </span>
                    <span
                      class="max-w-xs truncate text-[11px] font-mono text-text-dim sm:text-xs"
                      :title="header.value"
                    >
                      {{ header.value }}
                    </span>
                  </li>
                </ul>
              </div>
              <div class="flex flex-wrap gap-3 text-[11px] sm:text-xs">
                <a
                  :href="securityResult.robotsTxtUrl"
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  class="text-accent-sky link-underline"
                >
                  robots.txt
                  <span v-if="securityResult.robotsTxtFound" class="text-text-secondary">
                    (tìm thấy / phản hồi OK)
                  </span>
                  <span v-else class="text-text-dim"> (không truy cập được) </span>
                </a>
                <a
                  :href="securityResult.securityTxtUrl"
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  class="text-accent-sky link-underline"
                >
                  security.txt
                  <span v-if="securityResult.securityTxtFound" class="text-text-secondary">
                    (tìm thấy / phản hồi OK)
                  </span>
                  <span v-else class="text-text-dim"> (không truy cập được) </span>
                </a>
              </div>
            </div>
          </div>
        </article>
      </section>

      <footer
        class="mt-12 border-t border-border-default pt-6 text-center text-xs text-text-dim animate-fade-up animate-delay-5"
      >
        <p>osint-fast Toolbox · vibe.j2team.org · Tác giả: Nguyen Hoang Thong</p>
      </footer>
    </main>
  </div>
</template>
