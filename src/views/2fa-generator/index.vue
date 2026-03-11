<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useClipboard, useIntervalFn } from '@vueuse/core'

// ==========================================
// TOTP (Time-based One-Time Password) Logic
// Thuật toán TOTP theo RFC 6238
// ==========================================

/**
 * Chuyển chuỗi Base32 thành Uint8Array
 * Base32 là định dạng phổ biến để encode secret key của TOTP
 */
function base32ToBytes(base32: string): Uint8Array {
  // Bảng ký tự Base32 theo RFC 4648
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  // Xóa khoảng trắng, chuyển hoa, loại ký tự padding '='
  const cleanInput = base32.toUpperCase().replace(/\s/g, '').replace(/=/g, '')

  let bits = 0
  let value = 0
  let index = 0
  const output = new Uint8Array(Math.floor((cleanInput.length * 5) / 8))

  for (const char of cleanInput) {
    const charIndex = alphabet.indexOf(char)
    if (charIndex === -1) continue // Bỏ qua ký tự không hợp lệ

    // Mỗi ký tự Base32 đại diện 5 bits
    value = (value << 5) | charIndex
    bits += 5

    // Khi đủ 8 bits, lấy ra 1 byte
    if (bits >= 8) {
      output[index++] = (value >>> (bits - 8)) & 0xff
      bits -= 8
    }
  }

  return output.slice(0, index)
}

/**
 * Tính HMAC-SHA1 từ key và message
 * TOTP dùng HMAC-SHA1 để sinh mã OTP
 */
async function hmacSHA1(key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key as BufferSource,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, message as BufferSource)
  return new Uint8Array(signature)
}

/**
 * Tính số khoảng thời gian TOTP hiện tại
 * Mỗi khoảng 30 giây theo chuẩn TOTP
 */
function getCurrentTimeStep(): number {
  return Math.floor(Date.now() / 1000 / 30)
}

/**
 * Chuyển số nguyên thành mảng 8 bytes (big-endian)
 * Dùng để encode time step vào HMAC message
 */
function numberToBytes(num: number): Uint8Array {
  const bytes = new Uint8Array(8)
  for (let i = 7; i >= 0; i--) {
    bytes[i] = num & 0xff
    num = Math.floor(num / 256) // Dùng floor để tránh lỗi bitwise trên số lớn
  }
  return bytes
}

/**
 * Sinh mã TOTP 6 chữ số từ secret key
 * @param secret - Secret key ở dạng Base32
 * @returns Chuỗi 6 chữ số hoặc null nếu lỗi
 */
async function generateTOTP(secret: string): Promise<string | null> {
  try {
    const keyBytes = base32ToBytes(secret)
    if (keyBytes.length === 0) return null

    const timeStep = getCurrentTimeStep()
    const timeBytes = numberToBytes(timeStep)

    // Tính HMAC-SHA1
    const hmac = await hmacSHA1(keyBytes, timeBytes)

    // Dynamic Truncation: lấy 4 bytes bắt đầu từ offset
    const lastByte = hmac[hmac.length - 1]
    const offset = (lastByte !== undefined ? lastByte : 0) & 0x0f
    const binaryCode =
      (((hmac[offset] ?? 0) & 0x7f) << 24) |
      (((hmac[offset + 1] ?? 0) & 0xff) << 16) |
      (((hmac[offset + 2] ?? 0) & 0xff) << 8) |
      ((hmac[offset + 3] ?? 0) & 0xff)

    // Lấy 6 chữ số cuối
    const otp = binaryCode % 1_000_000
    return otp.toString().padStart(6, '0')
  } catch {
    return null
  }
}

/**
 * Tính số giây còn lại trong khoảng 30 giây hiện tại
 */
function getSecondsRemaining(): number {
  return 30 - (Math.floor(Date.now() / 1000) % 30)
}

// ==========================================
// Reactive State
// ==========================================

const router = useRouter()
const route = useRoute()

// Secret key người dùng nhập vào
const secretInput = ref('')
// Mã TOTP được sinh ra
const totpCode = ref('')
// Số giây còn lại trước khi code hết hạn
const secondsLeft = ref(getSecondsRemaining())
// Trạng thái loading khi đang tính TOTP
const isGenerating = ref(false)
// Thông báo lỗi nếu secret key không hợp lệ
const errorMessage = ref('')
// Trạng thái đã có kết quả
const hasResult = ref(false)
const isScanningQR = ref(false)

// Clipboard để copy mã
const { copy, copied } = useClipboard()

/**
 * Trích xuất secret key từ chuỗi mã QR (thường là định dạng otpauth://)
 */
function extractSecretFromQR(text: string): string | null {
  try {
    // Nếu là URL otpauth://
    if (text.startsWith('otpauth://')) {
      const url = new URL(text)
      return url.searchParams.get('secret')
    }
    // Nếu người dùng dán thẳng secret key
    return text.length >= 8 ? text : null
  } catch {
    return null
  }
}

/**
 * Phân tích ảnh để tìm mã QR bằng thư viện jsQR tải từ CDN
 */
async function scanQRCode(blob: Blob) {
  isScanningQR.value = true
  errorMessage.value = ''

  try {
    // Tải thư viện jsQR động từ CDN (không cần cài package)
    // @ts-expect-error - jsqr is loaded from remote CDN
    const { default: jsQR } = await import('https://esm.sh/jsqr@1.4.0')

    const img = new Image()
    const imageUrl = URL.createObjectURL(blob)

    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
      img.src = imageUrl
    })

    // Tạo canvas để lấy dữ liệu ảnh (jsQR cần ImageData)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) throw new Error('Could not create canvas context')

    canvas.width = img.width
    canvas.height = img.height
    ctx.drawImage(img, 0, 0)

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    })

    URL.revokeObjectURL(imageUrl)

    if (code) {
      const secret = extractSecretFromQR(code.data)

      if (secret) {
        secretInput.value = secret
        // Cập nhật URL
        router.replace({
          query: { ...route.query, secret: secret },
        })
        await regenerateCode()
      } else {
        errorMessage.value = 'Không tìm thấy Secret Key hợp lệ trong mã QR này.'
      }
    } else {
      errorMessage.value = 'Không tìm thấy mã QR trong ảnh này.'
    }
  } catch (err) {
    console.error('QR Scan Error:', err)
    errorMessage.value = 'Có lỗi xảy ra khi phân tích ảnh hoặc trình duyệt chặn tải thư viện quét mã.'
  } finally {
    isScanningQR.value = false
  }
}

/**
 * Xử lý khi dán ảnh từ clipboard
 */
async function handlePaste(event: ClipboardEvent) {
  const items = event.clipboardData?.items
  if (!items) return

  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile()
      if (file) await scanQRCode(file)
      break
    }
  }
}

/**
 * Xử lý khi thả file vào
 */
async function handleDrop(event: DragEvent) {
  const files = event.dataTransfer?.files
  if (!files || files.length === 0) return

  const file = files[0]
  if (file && file.type.startsWith('image/')) {
    await scanQRCode(file)
  }
}

/**
 * Tính toán phần trăm tiến trình của thanh đếm ngược
 * 100% = còn 30 giây, 0% = hết hạn
 */
const progressPercent = computed(() => {
  return (secondsLeft.value / 30) * 100
})

/**
 * Màu thanh tiến trình theo thời gian còn lại
 */
const progressColor = computed(() => {
  if (secondsLeft.value > 10) return 'bg-accent-sky'
  if (secondsLeft.value > 5) return 'bg-accent-amber'
  return 'bg-accent-coral'
})

/**
 * Màu văn bản đếm ngược
 */
const countdownTextColor = computed(() => {
  if (secondsLeft.value > 10) return 'text-accent-sky'
  if (secondsLeft.value > 5) return 'text-accent-amber'
  return 'text-accent-coral'
})

// ==========================================
// Tạo mã TOTP và cập nhật UI
// ==========================================

/**
 * Sinh mã TOTP từ secret đang có trong input
 */
async function regenerateCode() {
  const secret = secretInput.value.trim()
  if (!secret) return

  isGenerating.value = true
  errorMessage.value = ''

  const code = await generateTOTP(secret)

  isGenerating.value = false

  if (code) {
    totpCode.value = code
    hasResult.value = true
    errorMessage.value = ''
  } else {
    totpCode.value = ''
    hasResult.value = false
    errorMessage.value = 'Secret key không hợp lệ. Vui lòng kiểm tra lại định dạng Base32.'
  }
}

/**
 * Xử lý khi người dùng nhập/thay đổi secret key
 */
async function handleSecretChange() {
  const secret = secretInput.value.trim()

  // Cập nhật URL một cách im lặng khi gõ
  router.replace({
    query: { ...route.query, secret: secret || undefined },
  })

  if (!secret) {
    totpCode.value = ''
    hasResult.value = false
    errorMessage.value = ''
    return
  }
  await regenerateCode()
}

/**
 * Cập nhật bộ đếm ngược mỗi giây
 * Khi hết 30 giây, tự động tái sinh mã TOTP
 */
async function tick() {
  secondsLeft.value = getSecondsRemaining()

  // Khi bước sang khoảng thời gian mới (giây = 30 hoặc vừa reset về 30)
  if (secondsLeft.value === 30 && hasResult.value) {
    await regenerateCode()
  }
}

// Interval chạy mỗi giây để cập nhật countdown và tái sinh mã
useIntervalFn(tick, 1000)

// ==========================================
// Khởi tạo từ URL parameter
// ==========================================

onMounted(async () => {
  // Đọc secret từ URL parameter ?secret=XXXXXX
  const paramSecret = route.query.secret as string | undefined
  if (paramSecret) {
    secretInput.value = paramSecret
    await regenerateCode()
  }
})

/**
 * Format mã TOTP thành dạng "XXX XXX" cho dễ đọc
 */
function formatCode(code: string): string {
  if (code.length !== 6) return code
  return `${code.slice(0, 3)} ${code.slice(3)}`
}

/**
 * Copy mã TOTP không có khoảng trắng
 */
function copyCode() {
  copy(totpCode.value)
}

/**
 * Xóa secret và reset về trạng thái ban đầu
 */
function clearSecret() {
  secretInput.value = ''
  totpCode.value = ''
  hasResult.value = false
  errorMessage.value = ''
  // Xóa secret khỏi URL
  router.replace({
    query: { ...route.query, secret: undefined },
  })
}

/**
 * Copy URL hiện tại kèm secret
 */
const { copy: copyUrl, copied: copiedUrl } = useClipboard()
function handleCopyShareLink() {
  copyUrl(window.location.href)
}

// Scroll to top
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body">
    <!-- Nội dung chính -->
    <div class="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <!-- Thanh điều hướng trên cùng -->
      <nav class="flex items-center justify-between mb-6 animate-fade-up">
        <!-- Nút về trang chủ -->
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
        >
          <Icon icon="lucide:home" class="size-4" />
          <span class="hidden sm:inline">Trang chủ</span>
        </RouterLink>

        <!-- Badge VOL.01 / 2026 -->
        <div
          class="bg-accent-coral text-bg-deep font-display font-bold text-xs tracking-widest px-3 py-1.5 rotate-3"
        >
          VOL.01 / 2026
        </div>
      </nav>

      <!-- Hero Section -->
      <header class="mb-6 text-center">
        <!-- Dot divider trên -->
        <div class="flex gap-1.5 justify-center mb-4">
          <span v-for="n in 20" :key="n" class="w-1 h-1 rounded-full bg-border-default" />
        </div>

        <h1 class="font-display text-4xl sm:text-6xl font-bold text-accent-coral animate-fade-up">
          2FA Generator
        </h1>
        <p
          class="mt-4 text-text-secondary text-lg max-w-xl mx-auto animate-fade-up animate-delay-2"
        >
          Tạo mã xác thực
          <span class="text-accent-amber">TOTP</span>
          từ secret key — tự động làm mới sau mỗi
          <span class="text-accent-sky">30 giây</span>.
        </p>
        <p class="mt-2 text-text-dim text-sm animate-fade-up animate-delay-3">
          Hỗ trợ nhập thủ công hoặc truyền qua URL parameter
          <code class="text-accent-amber">?secret=XXX</code>
        </p>

        <!-- Dot divider dưới -->
        <div class="flex gap-1.5 justify-center mt-4">
          <span v-for="n in 20" :key="n" class="w-1 h-1 rounded-full bg-border-default" />
        </div>
      </header>

      <!-- Main Card: nhập secret key -->
      <section class="mb-5 animate-fade-up animate-delay-4">
        <h2 class="font-display text-2xl font-semibold flex items-center gap-3 mb-3">
          <span class="text-accent-coral text-sm tracking-widest font-display">//</span>
          Secret Key
        </h2>

        <div
          class="border border-border-default bg-bg-surface p-6 relative group"
          @paste="handlePaste"
          @dragover.prevent
          @drop.prevent="handleDrop"
        >
          <!-- Số trang trang trí -->
          <span
            class="absolute top-3 right-4 font-display text-6xl font-bold text-accent-amber/5 select-none pointer-events-none"
          >
            01
          </span>

          <p class="text-text-secondary text-sm mb-5">
            Nhập secret key ở định dạng
            <span class="text-accent-amber font-mono">Base32</span>
            (thường thấy khi thiết lập 2FA trên các dịch vụ).
          </p>

          <!-- Input field -->
          <div class="flex items-stretch gap-2 mb-4">
            <div class="relative flex-1">
              <Icon
                v-if="isScanningQR"
                icon="lucide:loader-2"
                class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-accent-coral animate-spin"
              />
              <Icon
                v-else
                icon="lucide:key-round"
                class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-text-dim pointer-events-none"
              />
              <input
                v-model="secretInput"
                type="text"
                placeholder="JBSWY3DPEHPK3PXP"
                autocomplete="off"
                spellcheck="false"
                class="w-full bg-bg-elevated border border-border-default pl-10 pr-4 py-3 text-sm text-text-primary placeholder:text-text-dim font-mono focus:border-accent-coral focus:outline-none transition tracking-widest"
                :disabled="isScanningQR"
                @input="handleSecretChange"
              />
            </div>
            <button
              v-if="secretInput"
              class="border border-border-default bg-bg-elevated px-4 text-text-dim transition hover:border-accent-coral hover:text-accent-coral flex items-center gap-2 group/copy shrink-0"
              :title="copiedUrl ? 'Đã copy link!' : 'Copy link chia sẻ'"
              :disabled="isScanningQR"
              @click="handleCopyShareLink"
            >
              <Icon
                :icon="copiedUrl ? 'lucide:check' : 'lucide:share-2'"
                class="size-4"
                :class="{ 'text-green-500': copiedUrl }"
              />
              <span v-if="copiedUrl" class="text-xs text-green-500 font-display"
                >Đã copy link!</span
              >
            </button>
            <!-- Nút xóa -->
            <button
              v-if="secretInput"
              class="border border-border-default bg-bg-elevated px-4 text-text-dim transition hover:border-accent-coral hover:text-accent-coral"
              title="Xóa"
              :disabled="isScanningQR"
              @click="clearSecret"
            >
              <Icon icon="lucide:x" class="size-4" />
            </button>
          </div>

          <!-- Thông báo lỗi -->
          <div
            v-if="errorMessage"
            class="flex items-center gap-2 border border-accent-coral/30 bg-accent-coral/10 px-4 py-3 text-sm text-accent-coral"
          >
            <Icon icon="lucide:alert-circle" class="size-4 shrink-0" />
            {{ errorMessage }}
          </div>

          <!-- Hướng dẫn nếu chưa nhập -->
          <div
            v-if="!secretInput && !errorMessage"
            class="border-2 border-dashed border-border-default bg-bg-elevated p-6 text-center transition-colors group-hover:border-accent-coral/50"
          >
            <div v-if="isScanningQR" class="py-4">
              <Icon
                icon="lucide:loader-2"
                class="size-8 text-accent-coral mx-auto mb-2 animate-spin"
              />
              <p class="text-text-primary text-sm font-display">Đang phân tích mã QR...</p>
            </div>
            <div v-else>
              <Icon icon="lucide:qr-code" class="size-8 text-text-dim mx-auto mb-2" />
              <p class="text-text-dim text-sm">
                Nhập key, dán ảnh QR (Ctrl+V) hoặc kéo thả ảnh vào đây
              </p>
              <p class="text-text-dim text-xs mt-2">
                Hoặc truyền qua URL:
                <code class="text-accent-sky">/2fa-generator?secret=YOUR_SECRET</code>
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Hiển thị mã OTP -->
      <section v-if="hasResult" class="mb-5 scroll-reveal">
        <h2 class="font-display text-2xl font-semibold flex items-center gap-3 mb-3">
          <span class="text-accent-sky text-sm tracking-widest font-display">//</span>
          Mã xác thực
        </h2>

        <div class="border border-border-default bg-bg-surface p-6 relative overflow-hidden">
          <!-- Số trang trang trí -->
          <span
            class="absolute top-3 right-4 font-display text-6xl font-bold text-accent-sky/5 select-none pointer-events-none"
          >
            02
          </span>

          <!-- Thanh tiến trình đếm ngược -->
          <div class="mb-6">
            <div class="flex items-center justify-between mb-2">
              <span class="text-text-dim text-xs font-display tracking-wide"
                >Thời gian còn lại</span
              >
              <span class="font-display font-bold text-sm tabular-nums" :class="countdownTextColor">
                {{ secondsLeft }}s
              </span>
            </div>
            <!-- Thanh progress bar -->
            <div class="h-1.5 w-full bg-bg-elevated border border-border-default overflow-hidden">
              <div
                class="h-full transition-all duration-1000 ease-linear"
                :class="progressColor"
                :style="{ width: `${progressPercent}%` }"
              />
            </div>
          </div>

          <!-- Mã OTP lớn, dễ đọc -->
          <div class="text-center mb-6">
            <div v-if="isGenerating" class="flex items-center justify-center gap-3 py-4">
              <Icon icon="lucide:loader-2" class="size-6 text-text-dim animate-spin" />
              <span class="text-text-dim">Đang tạo mã...</span>
            </div>
            <div v-else>
              <!-- Mã OTP với font lớn dễ đọc -->
              <div
                class="font-display font-bold tracking-[0.4em] text-5xl sm:text-7xl text-text-primary select-all leading-none py-2"
              >
                <span class="text-accent-sky">{{ totpCode.slice(0, 3) }}</span>
                <span class="text-text-dim mx-2">·</span>
                <span class="text-accent-sky">{{ totpCode.slice(3, 6) }}</span>
              </div>
              <p class="text-text-dim text-xs mt-3 font-mono">
                {{ formatCode(totpCode) }} — Nhấn copy để sao chép
              </p>
            </div>
          </div>

          <!-- Nút copy -->
          <div class="flex gap-2 justify-center">
            <button
              class="flex items-center gap-2 border px-6 py-2.5 text-sm font-display font-semibold transition"
              :class="
                copied
                  ? 'border-green-500 bg-green-500/10 text-green-400'
                  : 'border-accent-sky bg-accent-sky/10 text-accent-sky hover:bg-accent-sky/20'
              "
              :disabled="isGenerating"
              @click="copyCode"
            >
              <Icon :icon="copied ? 'lucide:check' : 'lucide:copy'" class="size-4" />
              {{ copied ? 'Đã copy!' : 'Copy mã' }}
            </button>
          </div>

          <!-- Ghi chú tự động làm mới -->
          <div class="mt-5 border-t border-border-default pt-4 flex items-start gap-2">
            <Icon icon="lucide:refresh-cw" class="size-4 text-text-dim shrink-0 mt-0.5" />
            <p class="text-text-dim text-xs">
              Mã sẽ tự động làm mới sau
              <span :class="countdownTextColor" class="font-bold">{{ secondsLeft }} giây</span>.
              TOTP tuân theo chuẩn RFC 6238 với chu kỳ 30 giây.
            </p>
          </div>
        </div>
      </section>

      <!-- Hướng dẫn sử dụng -->
      <section class="mb-6 scroll-reveal">
        <h2 class="font-display text-2xl font-semibold flex items-center gap-3 mb-3">
          <span class="text-accent-amber text-sm tracking-widest font-display">//</span>
          Hướng dẫn
        </h2>

        <div class="grid gap-4 sm:grid-cols-3">
          <!-- Bước 1 -->
          <div
            class="border border-border-default bg-bg-surface p-5 relative transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5"
          >
            <span
              class="absolute top-3 right-4 font-display text-5xl font-bold text-accent-amber/5 select-none pointer-events-none"
            >
              1
            </span>
            <Icon icon="lucide:key-round" class="size-6 text-accent-coral mb-3" />
            <h3 class="font-display font-semibold text-text-primary mb-2">Lấy Secret Key</h3>
            <p class="text-text-secondary text-sm">
              Vào phần cài đặt bảo mật của dịch vụ (Google, GitHub, v.v.), tìm mục
              <span class="text-accent-amber">Two-Factor Authentication</span>
              và lấy secret key.
            </p>
          </div>

          <!-- Bước 2 -->
          <div
            class="border border-border-default bg-bg-surface p-5 relative transition-all duration-300 hover:-translate-y-1 hover:border-accent-amber hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-amber/5"
          >
            <span
              class="absolute top-3 right-4 font-display text-5xl font-bold text-accent-amber/5 select-none pointer-events-none"
            >
              2
            </span>
            <Icon icon="lucide:type" class="size-6 text-accent-amber mb-3" />
            <h3 class="font-display font-semibold text-text-primary mb-2">
              Nhập hoặc truyền qua URL
            </h3>
            <p class="text-text-secondary text-sm">
              Nhập secret key vào ô bên trên, hoặc truyền qua URL:
              <code class="text-accent-sky text-xs block mt-1 break-all">?secret=YOUR_KEY</code>
            </p>
          </div>

          <!-- Bước 3 -->
          <div
            class="border border-border-default bg-bg-surface p-5 relative transition-all duration-300 hover:-translate-y-1 hover:border-accent-sky hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-sky/5"
          >
            <span
              class="absolute top-3 right-4 font-display text-5xl font-bold text-accent-amber/5 select-none pointer-events-none"
            >
              3
            </span>
            <Icon icon="lucide:shield-check" class="size-6 text-accent-sky mb-3" />
            <h3 class="font-display font-semibold text-text-primary mb-2">Copy & Sử dụng</h3>
            <p class="text-text-secondary text-sm">
              Copy mã 6 chữ số và dán vào trang đăng nhập. Mã tự
              <span class="text-accent-coral">làm mới mỗi 30 giây</span>
              theo chuẩn TOTP.
            </p>
          </div>
        </div>
      </section>

      <!-- Cảnh báo bảo mật -->
      <section class="mb-6 scroll-reveal">
        <div class="border border-accent-amber/30 bg-accent-amber/5 p-5 flex items-start gap-3">
          <Icon icon="lucide:triangle-alert" class="size-5 text-accent-amber shrink-0 mt-0.5" />
          <div>
            <h3 class="font-display font-semibold text-accent-amber mb-1">Lưu ý bảo mật</h3>
            <p class="text-text-secondary text-sm">
              Secret key là thông tin
              <span class="text-accent-coral font-semibold">cực kỳ nhạy cảm</span>. Công cụ này chạy
              hoàn toàn trên trình duyệt của bạn (client-side), không gửi dữ liệu lên server. Không
              chia sẻ secret key với bất kỳ ai.
            </p>
          </div>
        </div>
      </section>

      <!-- Nút về trang chủ và về đầu trang -->
      <div
        class="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8 border-t border-border-default"
      >
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-5 py-2.5 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
        >
          <Icon icon="lucide:arrow-left" class="size-4" />
          Về trang chủ
        </RouterLink>

        <button
          class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-5 py-2.5 text-sm text-text-secondary transition hover:border-accent-sky hover:text-text-primary"
          @click="scrollToTop"
        >
          <Icon icon="lucide:arrow-up" class="size-4" />
          Về đầu trang
        </button>
      </div>

      <!-- Credits Footer -->
      <footer class="mt-12 mb-2 text-center animate-fade-up animate-delay-7">
        <div
          class="flex items-center justify-center gap-2 text-text-dim/60 text-[10px] font-display uppercase tracking-[0.2em]"
        >
          <span>Made by</span>
          <a
            href="https://github.com/canhhungit"
            target="_blank"
            rel="noopener noreferrer"
            class="text-accent-coral font-bold hover:text-accent-coral/80 transition-all group relative px-1"
          >
            @canhhungit
            <span
              class="absolute -bottom-0.5 left-0 w-0 h-px bg-accent-coral transition-all group-hover:w-full"
            ></span>
          </a>
        </div>
      </footer>
    </div>
  </div>
</template>
