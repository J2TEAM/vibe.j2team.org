// ---------------------------------------------------------------------------
// FakeTerminalService.ts
// Quản lý toàn bộ kịch bản log giả — hoàn toàn tách biệt khỏi UI
// ---------------------------------------------------------------------------

export type LogLevel = 'info' | 'success' | 'warn' | 'error' | 'dim' | 'highlight'

export interface LogLine {
  id: number
  text: string
  level: LogLevel
  delay: number   // ms từ lần line trước
}

let _id = 0
const l = (text: string, level: LogLevel = 'info', delay = 280): LogLine =>
  ({ id: ++_id, text, level, delay })

// ---------------------------------------------------------------------------
// Phases — mỗi phase là 1 mảng LogLine
// ---------------------------------------------------------------------------

export const PHASE_INIT = (fbId: string): LogLine[] => [
  l('[SYS]  Initializing DeepCrack™ Neural Engine v6.6.6...', 'dim', 400),
  l('[SYS]  Loading pre-trained model: facebook-hash-breaker-XL.onnx', 'dim'),
  l('[NET]  Connecting to FB Graph API endpoint...', 'info'),
  l('[NET]  TLS handshake → api.facebook.com:443 ✓', 'success', 350),
  l(`[NET]  Resolving target profile: ${fbId}`, 'highlight', 200),
  l('[FB]   Scraping public metadata...', 'info'),
  l('[FB]   birthday leak: ████-██-██  ✓', 'success'),
  l('[FB]   pet name detected: "Bi", "Bông", "Mochi" (85% confidence)', 'success'),
  l('[FB]   hometown: Detected via tagged photos', 'success'),
  l('[AI]   Feeding metadata into Transformer model...', 'info', 400),
  l('[AI]   Epoch 1/3  loss=1.4231  acc=34.2%', 'dim'),
  l('[AI]   Epoch 2/3  loss=0.8812  acc=61.7%', 'dim'),
  l('[AI]   Epoch 3/3  loss=0.1093  acc=97.4%  ✓', 'success'),
]

export const PHASE_2FA: LogLine[] = [
  l('[2FA]  Detecting 2-Factor Auth...', 'warn', 350),
  l('[2FA]  SMS OTP intercepted via SS7 protocol exploit 🔓', 'success'),
  l('[2FA]  OTP token: 4█████  →  bypassed ✓', 'success'),
  l('[VPN]  Rotating IP through 47 exit nodes...', 'info'),
  l('[VPN]  Current node: Nga → Triều Tiên → Nam Cực → Hà Nội ✓', 'success'),
  l('[HASH] Extracting password hash from session token...', 'info', 350),
  l('[HASH] Hash type detected: bcrypt $2b$12$... (cost factor 12)', 'dim'),
]

export const PHASE_BRUTEFORCE: LogLine[] = [
  l('[BF]   Launching distributed brute-force attack...', 'warn', 350),
  l('[BF]   Cluster: 512 RTX 4090s online ✓', 'success'),
  l('[BF]   Dictionary: RockYou2024.txt (10B entries)', 'dim'),
  l('[BF]   Trying: "123456"         → ✗', 'dim', 150),
  l('[BF]   Trying: "iloveyou"       → ✗', 'dim', 150),
  l('[BF]   Trying: "Bi2003"         → ✗', 'dim', 150),
  l('[BF]   Trying: "Mochi@123"      → ✗', 'dim', 150),
  l('[BF]   Trying: "FbPa$$w0rd!"    → ✗', 'dim', 150),
  l('[BF]   Trying: "NguyenVanA1999" → ✗', 'dim', 150),
  l('[ML]   Switching to GAN-based password prediction...', 'info', 400),
  l('[ML]   Generating adversarial candidates...', 'dim'),
  l('[ML]   Top candidate confidence: 99.3%', 'success'),
  l('[SYS]  Computing SHA-3 collision...', 'info', 350),
  l('[SYS]  Cracking in progress ██████████████████░░  91%', 'info', 500),
  l('[SYS]  Cracking in progress ████████████████████░ 97%', 'info', 600),
  l('[SYS]  Cracking in progress █████████████████████ 99%', 'success', 800),
]

export const PHASE_ALMOST_DONE: LogLine[] = [
  l('[!]    PASSWORD FOUND — Decrypting...', 'highlight', 600),
  l('[!]    Mật khẩu: ***************', 'highlight', 300),
  l('[!]    Cần thêm tài nguyên để giải mã lớp cuối...', 'warn', 400),
]

// ---------------------------------------------------------------------------
// Helper — tính tổng thời gian ước tính của 1 phase
// ---------------------------------------------------------------------------
export function phaseDuration(phase: LogLine[]): number {
  return phase.reduce((acc, l) => acc + l.delay, 0)
}
