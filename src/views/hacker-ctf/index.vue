<!-- eslint-disable unicorn/no-document-cookie -->
<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'

// Quản lý trạng thái level: 1 - 10 (11 là hoàn thành)
// Sử dụng ref kết hợp với localStorage để lưu lại trạng thái chơi
const currentLevel = ref<number>(1)

onMounted(() => {
  const savedLevel = localStorage.getItem('hacker_ctf_level')
  if (savedLevel) {
    currentLevel.value = parseInt(savedLevel, 10)
  }
})

watch(currentLevel, (newVal) => {
  localStorage.setItem('hacker_ctf_level', newVal.toString())
})

// =========================================================================
// Khởi tạo các biến Random State toàn cục cho game
// =========================================================================
// Hàm giải mã nhẹ để giấu string khỏi source code (tránh người chơi search GitHub)
const d = (b64: string) => atob(b64)

const L1_WORDS = [
  d('VEhFX0RPTV9JU19BX0xJRQ=='),
  d('SElEREVOX0lOX1BMQUlOX1NJR0hU'),
  d('SU5TUEVDVF9NRQ=='),
  d('SEFDS0VSX0VZRVM='),
  d('RjEyX1dBUlJJT1I='),
]
const L2_ROLES = [d('YWRtaW4='), d('cm9vdA=='), d('c3VwZXJ1c2Vy'), d('Z29kbW9kZQ=='), d('b3duZXI=')]
const L3_PINS = [d('MTMzNw=='), d('ODA4MA=='), d('OTAwMA=='), d('MTk5OQ=='), d('MjA3Nw==')]
const L4_WORDS = [d('U0hBRE9X'), d('TUFUUklY'), d('R0hPU1Q='), d('UEhBTlRPTQ=='), d('TUlSQUdF')]
const L6_WORDS = [d('SEFDSw=='), d('Uk9PVA=='), d('QllURQ=='), d('Q09ERQ=='), d('UElORw==')]
const L7_COORDS = [
  { p: d('N1o='), hint: 'số 7 và chữ Z' },
  { p: d('QTE='), hint: 'chữ A và số 1' },
  { p: d('VlVF'), hint: 'chữ V, U, E' },
]
const L9_ROLES = [
  d('Z3JhbmRtYXN0ZXI='),
  d('Y3liZXJsb3Jk'),
  d('c3lzYWRtaW4='),
  d('ZWxpdGU='),
  d('b3ZlcmxvcmQ='),
]
const L10_WORDS = [
  d('SjJURUFNX1ZJQkVT'),
  d('VlVFSlNfTUFTVEVSWQ=='),
  d('Q1RGX0NIQU1QSU9O'),
  d('Q1lCRVJfUFVOSw=='),
  d('TkVPTl9LTklHSFQ='),
]
const L10_KEYS = [d('ajJ0ZWFt'), d('dmliZQ=='), d('aGFjaw=='), d('Y29kZQ=='), d('emVybw==')]

// Khai báo các biến đáp án Ref
const dynamicAns = ref({
  l1: L1_WORDS[0]!,
  l2: L2_ROLES[0]!,
  l3: L3_PINS[0]!,
  l3_hash: '',
  l4: L4_WORDS[0]!,
  l6: L6_WORDS[0]!,
  l7: L7_COORDS[0]!.p,
  l9: L9_ROLES[0]!,
  l10: L10_WORDS[0]!,
  l10_key: L10_KEYS[0]!,
  l10_hash: '',
})

const generateAnswers = () => {
  // Random cho tất cả các level
  dynamicAns.value.l1 = L1_WORDS[Math.floor(Math.random() * L1_WORDS.length)]!
  dynamicAns.value.l2 = L2_ROLES[Math.floor(Math.random() * L2_ROLES.length)]!
  dynamicAns.value.l3 = L3_PINS[Math.floor(Math.random() * L3_PINS.length)]!
  dynamicAns.value.l3_hash = btoa(dynamicAns.value.l3)
  dynamicAns.value.l4 = L4_WORDS[Math.floor(Math.random() * L4_WORDS.length)]!
  dynamicAns.value.l6 = L6_WORDS[Math.floor(Math.random() * L6_WORDS.length)]!
  dynamicAns.value.l7 = L7_COORDS[Math.floor(Math.random() * L7_COORDS.length)]!.p
  dynamicAns.value.l9 = L9_ROLES[Math.floor(Math.random() * L9_ROLES.length)]!
  dynamicAns.value.l10 = L10_WORDS[Math.floor(Math.random() * L10_WORDS.length)]!
  dynamicAns.value.l10_key = L10_KEYS[Math.floor(Math.random() * L10_KEYS.length)]!

  // XOR thuật toán cho L10 hash
  let xored = ''
  for (let i = 0; i < dynamicAns.value.l10.length; i++) {
    xored += String.fromCharCode(
      dynamicAns.value.l10.charCodeAt(i) ^
        dynamicAns.value.l10_key.charCodeAt(i % dynamicAns.value.l10_key.length),
    )
  }
  dynamicAns.value.l10_hash = btoa(xored)
}

onMounted(() => {
  const savedAns = localStorage.getItem('hacker_ctf_ans')
  if (savedAns) {
    dynamicAns.value = JSON.parse(savedAns)
  } else {
    generateAnswers()
    localStorage.setItem('hacker_ctf_ans', JSON.stringify(dynamicAns.value))
  }
})

watch(
  dynamicAns,
  (newVal) => {
    localStorage.setItem('hacker_ctf_ans', JSON.stringify(newVal))
  },
  { deep: true },
)

const resetGame = () => {
  currentLevel.value = 1
  localStorage.removeItem('role')
  localStorage.removeItem('hacker_ctf_level')
  document.cookie = `hacker_role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
  // Xóa luôn cookie của mọi role random nếu có
  L9_ROLES.forEach((r) => {
    document.cookie = `hacker_${r}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
  })

  // Reset answers
  generateAnswers()
  localStorage.setItem('hacker_ctf_ans', JSON.stringify(dynamicAns.value))
  startTimer()
}

// =========================================================================
// Time Limit System (5 phút / Level)
// =========================================================================
const TIME_LIMIT = 5 * 60 // 5 phút bằng giây
const timeLeft = ref(TIME_LIMIT)
let globalTimerInterval: ReturnType<typeof setInterval> | null = null
const isTimeout = ref(false)

const startTimer = () => {
  if (globalTimerInterval) clearInterval(globalTimerInterval)
  timeLeft.value = TIME_LIMIT
  isTimeout.value = false

  globalTimerInterval = setInterval(() => {
    // Only count down if we are not on the final "Unlocked" screen
    if (currentLevel.value <= 10) {
      if (timeLeft.value > 0) {
        timeLeft.value--
      } else {
        // Hết thời gian
        clearInterval(globalTimerInterval!)
        isTimeout.value = true
        // Delay một chút trước khi reset game
        setTimeout(() => {
          resetGame()
        }, 3000)
      }
    }
  }, 1000)
}

// Format giây thành MM:SS
const formattedTime = () => {
  const m = Math.floor(timeLeft.value / 60)
    .toString()
    .padStart(2, '0')
  const s = (timeLeft.value % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

onMounted(() => {
  startTimer()
})

watch(currentLevel, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    startTimer()
  }
})

// =========================================================================
// Level 1: The Invisible DOM
// Lớp bảo mật: Giấu thông tin trong cây DOM bằng class CSS `opacity-0`.
// Cách giải: Mở DevTools (F12) -> tab Elements -> Tìm div có id `secret-password-container`.
// =========================================================================
const level1Input = ref('')
const level1Error = ref(false)

const checkLevel1 = () => {
  if (level1Input.value.trim().toUpperCase() === dynamicAns.value.l1) {
    currentLevel.value = 2
    level1Error.value = false
    level1Input.value = ''
  } else {
    level1Error.value = true
  }
}

// =========================================================================
// Level 2: Console & LocalStorage Injection
// Lớp bảo mật: Kiểm tra quyền dựa trên giá trị đọc từ `localStorage`.
// Cách giải: Mở DevTools (F12) -> tab Application (hoặc Console)
// -> Chạy lệnh: `localStorage.setItem('role', '<giá-trị-random>')` rồi ấn nút KIỂM TRA QUYỀN.
// =========================================================================
const level2Error = ref(false)

const checkLevel2 = () => {
  const role = localStorage.getItem('role')
  if (role === dynamicAns.value.l2) {
    currentLevel.value = 3
    level2Error.value = false
  } else {
    level2Error.value = true
  }
}

// =========================================================================
// Level 3: Native Cryptography (Mật mã nguyên bản)
// Lớp bảo mật: Mã PIN không được lưu dưới dạng plain text. Nó được lưu dưới
// dạng Base64. (Có thể thay bằng Web Crypto API để băm SHA-256 an toàn hơn nhưng
// để CTF hợp lý, Base64 dễ dàng cho người chơi tập dịch ngược).
// Cách giải: Đọc mã nguồn ứng dụng (Tab Sources hoặc Vue Devtools), tìm biến `TARGET_HASH_L3`.
// Sau đó vào Console chạy `atob("<hash>")` để được mã PIN gốc.
// =========================================================================
const level3Input = ref('')
const level3Error = ref(false)

const checkLevel3 = () => {
  try {
    if (btoa(level3Input.value.trim()) === dynamicAns.value.l3_hash) {
      currentLevel.value = 4
      level3Error.value = false
      level3Input.value = ''
    } else {
      level3Error.value = true
    }
  } catch {
    level3Error.value = true
  }
}

// =========================================================================
// Level 4: Visual Deception (Ảo ảnh quang học)
// Lớp bảo mật: Chữ có màu đen trùng với màu nền bg-black.
// Cách giải: Bôi đen toàn bộ đoạn text (Ctrl+A / Highlight) sẽ thấy màu nổi lên do selection background,
// hoặc dùng Inspect Element để đọc.
// =========================================================================
const level4Input = ref('')
const level4Error = ref(false)
const level4Grid = ref<{ val: string; isHidden: boolean }[]>([])

onMounted(() => {
  // Wait a small tick so dynamicAns is loaded
  setTimeout(() => {
    // Sinh grid ngẫu nhiên
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
    const grid = Array.from({ length: 200 }, () => {
      return {
        val: characters.charAt(Math.floor(Math.random() * characters.length)),
        isHidden: false,
      }
    })

    const pwd = dynamicAns.value.l4
    const indices = [14, 45, 88, 112, 144, 180, 192].slice(0, pwd.length)
    indices.forEach((pos, i) => {
      grid[pos] = { val: pwd[i] as string, isHidden: true }
    })

    level4Grid.value = grid
  }, 100)
})

const checkLevel4 = () => {
  if (level4Input.value.trim().toUpperCase() === dynamicAns.value.l4) {
    currentLevel.value = 5
    level4Error.value = false
    level4Input.value = ''
  } else {
    level4Error.value = true
  }
}

// =========================================================================
// Level 5: Time & Spatial (Không gian và thời gian)
// Lớp bảo mật: Layout 3 anchor vô hình absolute.
// Cách giải: Rê chuột/Click vào 3 góc màn hình theo đúng thứ tự (Top-Left 1, Top-Right 2, Bottom-Left 3)
// trong thời gian cực ngắn. Phải dùng tay thật để chứng minh thực thể.
// =========================================================================
const level5Clicks = ref<number[]>([])
const level5Error = ref(false)
let level5Timer: ReturnType<typeof setTimeout> | null = null

const hitAnchor = (id: number) => {
  if (currentLevel.value !== 5) return

  if (level5Clicks.value.length === 0) {
    level5Timer = setTimeout(() => {
      if (level5Clicks.value.length < 3) {
        level5Error.value = true
        level5Clicks.value = [] // Quá thời gian 3 giây => Reset
      }
    }, 3000)
  }

  // Đẩy id vào mảng nếu chưa có
  if (!level5Clicks.value.includes(id)) {
    level5Clicks.value.push(id)
  }

  if (level5Clicks.value.length === 3) {
    if (level5Timer) clearTimeout(level5Timer)
    // Phải click đúng thứ tự 1 -> 2 -> 3
    if (level5Clicks.value[0] === 1 && level5Clicks.value[1] === 2 && level5Clicks.value[2] === 3) {
      currentLevel.value = 6
      level5Error.value = false
    } else {
      level5Error.value = true
      level5Clicks.value = []
    }
  }
}

// =========================================================================
// Level 6: Audio Hacking (Sóng âm Morse)
// Lớp bảo mật: Dữ liệu ẩn bên trong âm thanh sóng sine (Web Audio API).
// Cách giải: Nghe âm thanh tít tít, dò bảng mã Morse.
// Từ khóa: HACK (.... .- -.-. -.-)
// =========================================================================
const level6Input = ref('')
const level6Error = ref(false)
let audioCtx: AudioContext | null = null

const playMorseSignal = async () => {
  if (!audioCtx) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  if (audioCtx.state === 'suspended') {
    await audioCtx.resume()
  }

  // Dictionary to Map char to morse lengths
  // 1: Dot, 3: Dash
  const MORSE_MAP: Record<string, number[]> = {
    A: [1, 3],
    B: [3, 1, 1, 1],
    C: [3, 1, 3, 1],
    D: [3, 1, 1],
    E: [1],
    F: [1, 1, 3, 1],
    G: [3, 3, 1],
    H: [1, 1, 1, 1],
    I: [1, 1],
    J: [1, 3, 3, 3],
    K: [3, 1, 3],
    L: [1, 3, 1, 1],
    M: [3, 3],
    N: [3, 1],
    O: [3, 3, 3],
    P: [1, 3, 3, 1],
    Q: [3, 3, 1, 3],
    R: [1, 3, 1],
    S: [1, 1, 1],
    T: [3],
    U: [1, 1, 3],
    V: [1, 1, 1, 3],
    W: [1, 3, 3],
    X: [3, 1, 1, 3],
    Y: [3, 1, 3, 3],
    Z: [3, 3, 1, 1],
  }

  const morse: number[] = []
  const word = dynamicAns.value.l6

  for (let i = 0; i < word.length; i++) {
    const char = word[i] as string
    const arr = MORSE_MAP[char]
    if (arr) {
      arr.forEach((len) => morse.push(len))
      morse.push(0) // 0 means intra-character empty space
    }
  }

  const dotTime = 0.12 // 120ms chuẩn
  let startTime = audioCtx.currentTime + 0.1

  morse.forEach((beat) => {
    if (beat === 0) {
      startTime += dotTime * 3 // Khoảng trống giữa các chữ cái
      return
    }

    const osc = audioCtx!.createOscillator()
    const gain = audioCtx!.createGain()
    osc.connect(gain)
    gain.connect(audioCtx!.destination)
    osc.type = 'sine'
    osc.frequency.value = 650 // Tone 650Hz đặc trưng của Morse

    // Envelope tránh pop sound
    gain.gain.setValueAtTime(0, startTime)
    gain.gain.linearRampToValueAtTime(1, startTime + 0.01)

    const duration = beat * dotTime
    gain.gain.setValueAtTime(1, startTime + duration - 0.01)
    gain.gain.linearRampToValueAtTime(0, startTime + duration)

    osc.start(startTime)
    osc.stop(startTime + duration)

    startTime += duration + dotTime // Thêm một khoảng dãn nhỏ cách các âm (intra-character)
  })
}

const checkLevel6 = () => {
  if (level6Input.value.trim().toUpperCase() === dynamicAns.value.l6) {
    currentLevel.value = 7
    level6Error.value = false
    level6Input.value = ''
  } else {
    level6Error.value = true
  }
}

// =========================================================================
// Level 7: Canvas Geometry (Vẽ mù)
// Lớp bảo mật: Nét vẽ bị cắt đứt trong DOM nhưng có thể được gọi ra.
// Cách giải: Vào Console F12 gõ thẻ gọi hàm global: drawMap()
// =========================================================================
const level7Input = ref('')
const level7Error = ref(false)

onMounted(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).drawMap = () => {
    const canvas = document.getElementById('hack-canvas') as HTMLCanvasElement
    if (!canvas) {
      console.warn('LỖI: Chưa khởi tạo thành phần Canvas.')
      return
    }
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#22c55e'
    ctx.lineWidth = 6
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    ctx.beginPath()
    const ans = dynamicAns.value.l7
    if (ans === '7Z') {
      ctx.moveTo(40, 30)
      ctx.lineTo(100, 30)
      ctx.lineTo(60, 110)
      ctx.moveTo(140, 30)
      ctx.lineTo(200, 30)
      ctx.lineTo(140, 110)
      ctx.lineTo(200, 110)
    } else if (ans === 'A1') {
      ctx.moveTo(60, 110)
      ctx.lineTo(80, 30)
      ctx.lineTo(100, 110)
      ctx.moveTo(70, 70)
      ctx.lineTo(90, 70)
      ctx.moveTo(160, 50)
      ctx.lineTo(180, 30)
      ctx.lineTo(180, 110)
    } else if (ans === 'VUE') {
      ctx.moveTo(30, 30)
      ctx.lineTo(50, 100)
      ctx.lineTo(70, 30) // V
      ctx.moveTo(100, 30)
      ctx.lineTo(100, 100)
      ctx.lineTo(120, 100)
      ctx.lineTo(120, 30) // U
      ctx.moveTo(170, 30)
      ctx.lineTo(150, 30)
      ctx.lineTo(150, 100)
      ctx.lineTo(170, 100) // E part 1
      ctx.moveTo(150, 65)
      ctx.lineTo(165, 65) // E part 2
    }

    ctx.stroke()
    console.log('> Lực lượng Tọa Độ đã được ánh xạ vào Canvas.')
  }
})

const checkLevel7 = () => {
  if (level7Input.value.trim().toUpperCase() === dynamicAns.value.l7) {
    currentLevel.value = 8
    level7Error.value = false
    level7Input.value = ''
  } else {
    level7Error.value = true
  }
}

// =========================================================================
// Level 8: Contextual Knowledge (Trí tuệ cộng đồng)
// Lớp bảo mật: Regex pattern.
// Cách giải: Thông thuộc quy tắc "Không có database" của dự án (viết không phân biệt dấu).
// =========================================================================
const level8Input = ref('')
const level8Error = ref(false)

const checkLevel8 = () => {
  const normalized = level8Input.value.trim().toLowerCase().replace(/\s+/g, ' ')
  const regex = /không có database|khong co database/i

  if (regex.test(normalized)) {
    currentLevel.value = 9
    level8Error.value = false
    level8Input.value = ''
  } else {
    level8Error.value = true
  }
}

// =========================================================================
// Level 9: Cookie Manipulation
// Lớp bảo mật: Document cookie override.
// Cách giải: Mở Tab Application / Console tự thêm `document.cookie = "hacker_<random_role>=<role>"`
// Hệ thống sẽ liên tục kiểm tra, khi có kết quả mới hiện nút Next Level.
// =========================================================================
const level9CookieFound = ref(false)
let cookieInterval: ReturnType<typeof setInterval> | null = null

// Lắng nghe thay đổi level để bật/tắt interval cho Level 9
watch(
  currentLevel,
  (val) => {
    if (val === 9) {
      const targetCookieStr = `hacker_role=${dynamicAns.value.l9}`
      level9CookieFound.value = document.cookie.includes(targetCookieStr)
      if (!level9CookieFound.value) {
        cookieInterval = setInterval(() => {
          if (document.cookie.includes(`hacker_role=${dynamicAns.value.l9}`)) {
            level9CookieFound.value = true
            if (cookieInterval) clearInterval(cookieInterval)
          }
        }, 1000)
      }
    } else {
      if (cookieInterval) clearInterval(cookieInterval)
    }
  },
  { immediate: true },
)

const nextFromLevel9 = () => {
  currentLevel.value = 10
}

// =========================================================================
// Level 10: The Ultimate XOR (Trùm cuối)
// Lớp bảo mật: XOR Cipher kết hợp Base64, secret key nằm ngoài JS (CSS variables).
// - Target Password: <Randomized>
// - Key (CSS): <Randomized>
// Cách giải:
// 1. Tìm --secret-key trong Elements tab. (giá trị đã bị inline style replace random)
// 2. Viết script ở Console đọc chuỗi Base64 xuống XOR với CSS Variable.
// =========================================================================
const level10Input = ref('')
const level10Error = ref(false)

const checkLevel10 = () => {
  try {
    // Chúng ta tạo DOM fake để đọc var() nhằm sát thực tế Dev hơn.
    // Variable được assign via style tag ở dưới template cho html.
    const cssVarKey = dynamicAns.value.l10_key

    const input = level10Input.value.trim()

    // Thuật toán XOR đảo chuỗi input
    let xored = ''
    for (let i = 0; i < input.length; i++) {
      xored += String.fromCharCode(input.charCodeAt(i) ^ cssVarKey.charCodeAt(i % cssVarKey.length))
    }

    // Nếu encode Base64 của thuật toán == Chuỗi Base64 Hash lưu trên L10
    if (btoa(xored) === dynamicAns.value.l10_hash) {
      currentLevel.value = 11
      level10Error.value = false
    } else {
      level10Error.value = true
    }
  } catch {
    level10Error.value = true
  }
}
</script>

<template>
  <div
    class="min-h-screen bg-black text-green-500 font-mono flex flex-col items-center py-10 px-4 w-full relative overflow-hidden"
  >
    <!-- KHU VỰC ẨN LEVEL 5 (Spatial Anchors) -->
    <div
      v-if="currentLevel === 5"
      class="fixed inset-0 pointer-events-none z-40"
      aria-hidden="true"
    >
      <!-- Ba điểm click vô hình, z-index cao. Buộc người dùng tự tìm và rà chuột ở 3 góc. -->
      <!-- Điểm số 1 (Top Left) -->
      <div
        @click="hitAnchor(1)"
        class="absolute top-2 left-2 w-16 h-16 opacity-0 pointer-events-auto cursor-crosshair"
      ></div>
      <!-- Điểm số 2 (Top Right) -->
      <div
        @click="hitAnchor(2)"
        class="absolute top-2 right-2 w-16 h-16 opacity-0 pointer-events-auto cursor-crosshair"
      ></div>
      <!-- Điểm số 3 (Bottom Left) -->
      <div
        @click="hitAnchor(3)"
        class="absolute bottom-2 lg:bottom-12 left-2 w-16 h-16 opacity-0 pointer-events-auto cursor-crosshair"
      ></div>
    </div>

    <!-- Nút quay lại trang chủ -->
    <div class="w-full max-w-2xl flex justify-start mb-8 z-10">
      <RouterLink
        to="/"
        class="border-2 border-green-500 bg-black text-green-500 px-4 py-2 hover:bg-green-500 hover:text-black transition-colors font-bold uppercase tracking-wider text-sm sm:text-base flex items-center gap-2"
      >
        <span>&larr;</span> QUAY LẠI TRANG CHỦ
      </RouterLink>
    </div>

    <!-- Giao diện Terminal chính -->
    <div
      class="w-full max-w-2xl bg-black border-2 border-green-500 p-6 shadow-[0_0_15px_rgba(34,197,94,0.3)] z-10 relative"
    >
      <!-- TIME LIMIT DISPLAY -->
      <div
        v-if="currentLevel <= 10 && !isTimeout"
        class="absolute top-4 right-4 text-red-500 animate-pulse font-bold text-sm sm:text-base border border-red-500 px-2 py-1 bg-red-900/20"
      >
        TIME LEFT: {{ formattedTime() }}
      </div>

      <!-- TIMEOUT WARNING -->
      <div
        v-if="isTimeout"
        class="absolute inset-0 bg-red-900/90 z-50 flex flex-col items-center justify-center p-8 text-center border-4 border-red-500"
      >
        <h2 class="text-4xl sm:text-6xl font-black text-white mb-4">> SYSTEM PURGE</h2>
        <p class="text-white text-xl font-bold animate-pulse">
          > LỖI: HẾT THỜI GIAN KẾT NỐI (5 PHÚT).
        </p>
        <p class="text-white mt-2">Dữ liệu xâm nhập đã bị xóa bỏ. Đang tự động trả về Level 1...</p>
      </div>

      <h1
        class="text-2xl sm:text-3xl font-bold mb-2 text-center border-b border-green-500 pb-4 tracking-widest mt-8 sm:mt-0"
      >
        > C_T_F::LABYRINTH_{{ currentLevel <= 10 ? currentLevel : 'UNLOCKED' }}
      </h1>

      <!-- Lời chào đầu game (Chỉ hiện khi ở Level 1) -->
      <div v-if="currentLevel === 1" class="mb-8 text-sm sm:text-base mt-6">
        <p class="mb-2">> HỆ THỐNG: KHỞI ĐỘNG CHUỖI THỬ THÁCH BẢO MẬT FRONT-END...</p>
        <p class="text-green-400">> CHỈ DẪN: SỬ DỤNG DEVELOPER TOOLS (F12) ĐỂ TÌM RA LỐI THOÁT.</p>
      </div>

      <!-- LEVEL 1 -->
      <div v-if="currentLevel === 1" class="space-y-4 animate-fade-up">
        <h2 class="text-xl font-semibold bg-green-900/40 inline-block px-2">> SYSTEM.LEVEL(1)</h2>
        <p>Trạng thái: Đang khóa cửa chính.</p>
        <p>
          Yêu cầu: Khai báo mật khẩu nhận dạng. Mật khẩu này được lập trình viên giấu ngay trên màn
          hình mà mắt thường không thể thấy.
        </p>

        <!-- Mật khẩu giấu kín bằng Tailwind class opacity-0 và absolute -->
        <div
          class="absolute -top-[999px] -left-[999px] opacity-0 pointer-events-none select-none"
          aria-hidden="true"
        >
          <!-- Gợi ý cho người chơi khi Inspect Element -->
          <div id="secret-password-container" :data-secret="dynamicAns.l1" class="text-white">
            Xin chào Hacker! Mật khẩu truy cập Level 1 là: {{ dynamicAns.l1 }}
          </div>
        </div>

        <div class="mt-6 flex flex-col sm:flex-row gap-4">
          <input
            v-model="level1Input"
            type="text"
            class="bg-black border border-green-500 text-green-500 px-4 py-2 focus:outline-none focus:bg-green-900/20 w-full placeholder-green-700 font-mono"
            placeholder="Nhập mật khẩu..."
            @keyup.enter="checkLevel1"
          />
          <button
            @click="checkLevel1"
            class="bg-green-500 text-black px-6 py-2 font-bold hover:bg-green-400 transition-colors whitespace-nowrap"
          >
            > XÁC NHẬN
          </button>
        </div>
        <p v-if="level1Error" class="text-red-500 animate-pulse mt-2">
          > LỖI: MẬT KHẨU KHÔNG HỢP LỆ.
        </p>
      </div>

      <!-- LEVEL 2 -->
      <div v-if="currentLevel === 2" class="space-y-4 animate-fade-up">
        <h2 class="text-xl font-semibold bg-green-900/40 inline-block px-2">> SYSTEM.LEVEL(2)</h2>
        <p>Trạng thái: Xác nhận quyền truy cập máy chủ.</p>
        <p class="text-red-500">> CẢNH BÁO: PHIÊN BẢN CỦA BẠN LÀ GUEST. CHỨC NĂNG BỊ GIỚI HẠN.</p>
        <p>
          Yêu cầu: Hãy nói với hệ thống bạn đang ở phiên làm việc của
          <code class="text-yellow-400">role</code> là `<code class="text-yellow-400">{{
            dynamicAns.l2
          }}</code
          >` thông qua bộ nhớ cục bộ (Local Storage).
        </p>

        <div class="mt-6">
          <button
            @click="checkLevel2"
            class="bg-green-500 text-black px-6 py-2 font-bold hover:bg-green-400 transition-colors w-full sm:w-auto"
          >
            > KIỂM TRA ĐỊNH DANH ROLE
          </button>
        </div>
        <p v-if="level2Error" class="text-red-500 animate-pulse mt-2">
          > LỖI: TRUY CẬP BỊ TỪ CHỐI. ROLE HIỆN TẠI KHÔNG KHỚP.
        </p>
      </div>

      <!-- LEVEL 3 -->
      <div v-if="currentLevel === 3" class="space-y-4 animate-fade-up">
        <h2 class="text-xl font-semibold bg-green-900/40 inline-block px-2">> SYSTEM.LEVEL(3)</h2>
        <p>Trạng thái: Tường lửa phòng vệ cuối cùng (Cryptography).</p>
        <p>
          Yêu cầu: Hệ thống cần một mã PIN (chuỗi) để vô hiệu hóa lõi hạt nhân an ninh. Mã PIN thật
          đã bị mã hóa Base64 bên trong mã nguồn để tránh bị đánh cắp.
        </p>
        <p class="text-xs text-green-700 mt-2">
          // Gợi ý: Hacker hãy dùng tab Sources/Debugger/Application để tìm biến chứa Hash Base64
          `dynamicAns.l3_hash` (hoặc lục trong Variable LocalStorage hacker_ctf_ans) đang được so
          sánh và đảo ngược nó trong Console (sử dụng hàm atob).
        </p>

        <div class="mt-6 flex flex-col sm:flex-row gap-4">
          <input
            v-model="level3Input"
            type="text"
            class="bg-black border border-green-500 text-green-500 px-4 py-2 focus:outline-none focus:bg-green-900/20 w-full placeholder-green-700 font-mono"
            placeholder="Nhập mã PIN..."
            @keyup.enter="checkLevel3"
          />
          <button
            @click="checkLevel3"
            class="bg-green-500 text-black px-6 py-2 font-bold hover:bg-green-400 transition-colors whitespace-nowrap"
          >
            > MỞ KHÓA
          </button>
        </div>
        <p v-if="level3Error" class="text-red-500 animate-pulse mt-2">
          > LỖI: MẬT KHẨU KHÔNG KHỚP.
        </p>
      </div>

      <!-- LEVEL 4: Visual Deception -->
      <div
        v-if="currentLevel === 4"
        class="space-y-4 animate-fade-up border border-green-900/40 p-4 mt-6"
      >
        <h2 class="text-xl font-semibold bg-green-900/40 inline-block px-2">> SYSTEM.LEVEL(4)</h2>
        <p>Phân loại: Visual Deception.</p>
        <p>
          Một mật khẩu đã được giấu vào ma trận dữ liệu nhiễu loạn bên dưới. Nó cùng màu với bóng
          tối.
        </p>
        <div class="bg-green-900/20 p-4 text-center break-words select-text">
          <template v-for="(char, i) in level4Grid" :key="i">
            <span :class="char.isHidden ? 'text-black' : 'text-green-500'">{{ char.val }}</span>
          </template>
        </div>

        <div class="mt-4 flex flex-col sm:flex-row gap-4">
          <input
            v-model="level4Input"
            type="text"
            class="flex-1 bg-black border border-green-500 text-green-500 px-4 py-2 focus:outline-none focus:bg-green-900/20"
            placeholder="Nhập từ tìm được..."
            @keyup.enter="checkLevel4"
          />
          <button
            @click="checkLevel4"
            class="bg-green-500 text-black px-6 py-2 font-bold focus:bg-green-400"
          >
            > TRÚT BỎ MA TRẬN
          </button>
        </div>
        <p v-if="level4Error" class="text-red-500 animate-pulse mt-2">
          > LỖI: DỮ LIỆU ĐẦU VÀO TRỐNG.
        </p>
      </div>

      <!-- LEVEL 5: Time & Spatial -->
      <div
        v-if="currentLevel === 5"
        class="space-y-4 animate-fade-up border border-green-900/40 p-4 mt-6"
      >
        <h2 class="text-xl font-semibold bg-green-900/40 inline-block px-2">> SYSTEM.LEVEL(5)</h2>
        <p>Phân loại: Spatial Dimensions.</p>
        <p class="text-green-300">
          "Sự can thiệp của AI là không thể. Chứng minh bạn là con người bằng cách kích hoạt 3 điểm
          mù không gian."
        </p>
        <ul class="list-disc ml-6 mt-2 text-sm text-green-700">
          <li>
            Tìm và Nhấp chuột vào điểm Neo vô hình của 3 khu vực: [Top-Left] -> [Top-Right] ->
            [Bottom-Left].
          </li>
          <li>Thời gian giới hạn sinh tồn: 3 giây kể từ cái nhấp đầu tiên.</li>
        </ul>
        <div class="mt-4 p-4 border border-green-500 border-dashed text-center">
          <p v-if="level5Clicks.length === 0" class="animate-pulse">ĐANG CHỜ KÍCH HOẠT...</p>
          <p v-else-if="level5Clicks.length > 0" class="text-yellow-500 font-bold">
            TIẾN TRÌNH: {{ level5Clicks.length }} / 3
          </p>
        </div>
        <p v-if="level5Error" class="text-red-500 animate-pulse mt-2">
          > LỖI: THẤT BẠI. THỨ TỰ SAI HOẶC QUÁ THỜI GIAN.
        </p>
      </div>

      <!-- LEVEL 6: Audio Hacking -->
      <div
        v-if="currentLevel === 6"
        class="space-y-4 animate-fade-up border border-green-900/40 p-4 mt-6"
      >
        <h2 class="text-xl font-semibold bg-green-900/40 inline-block px-2">> SYSTEM.LEVEL(6)</h2>
        <p>Phân loại: Auditory Hacking.</p>
        <p>
          Tín hiệu mã hóa SOS đang phát qua sóng siêu âm (Sine-wave 650Hz). Lắng nghe và dùng bảng
          chữ cái Morse để giải khóa.
        </p>

        <div class="mt-4 flex justify-start">
          <button
            @click="playMorseSignal"
            class="bg-black border border-green-500 text-green-500 px-6 py-2 font-bold hover:bg-green-900/50 flex items-center gap-2"
          >
            <span>&#9654;</span> PHÁT TÍN HIỆU
          </button>
        </div>

        <div class="mt-4 flex flex-col sm:flex-row gap-4">
          <input
            v-model="level6Input"
            type="text"
            class="flex-1 bg-black border border-green-500 text-green-500 px-4 py-2 focus:outline-none focus:bg-green-900/20 uppercase"
            placeholder="Dịch mã morse..."
            @keyup.enter="checkLevel6"
          />
          <button @click="checkLevel6" class="bg-green-500 text-black px-6 py-2 font-bold">
            > KHỚP MÃ
          </button>
        </div>
        <p v-if="level6Error" class="text-red-500 animate-pulse mt-2">
          > LỖI: TỪ KHÓA KHÔNG CHÍNH XÁC.
        </p>
      </div>

      <!-- LEVEL 7: Canvas Geometry -->
      <div
        v-if="currentLevel === 7"
        class="space-y-4 animate-fade-up border border-green-900/40 p-4 mt-6"
      >
        <h2 class="text-xl font-semibold bg-green-900/40 inline-block px-2">> SYSTEM.LEVEL(7)</h2>
        <p>Phân loại: Canvas Geometry.</p>
        <p>
          Bản đồ nét vẽ đã bị chặn kích hoạt từ giao diện. Gọi thần chú
          <code class="text-yellow-400">drawMap()</code> trong System Console để hiện bản đồ trên
          màn hình radar bên dưới.
        </p>

        <div
          class="mt-4 flex justify-center bg-black border border-green-500/50 relative h-[140px] w-full"
        >
          <!-- Canvas Trắng Tinh -->
          <canvas id="hack-canvas" width="240" height="140" class="pointer-events-none"></canvas>
          <div
            class="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(0,255,0,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,0,0.2)_1px,transparent_1px)] bg-[size:10px_10px]"
          ></div>
        </div>

        <div class="mt-4 flex flex-col sm:flex-row gap-4">
          <input
            v-model="level7Input"
            type="text"
            class="flex-1 bg-black border border-green-500 text-green-500 px-4 py-2 focus:outline-none focus:bg-green-900/20"
            placeholder="Ký tự vẽ trên radar..."
            @keyup.enter="checkLevel7"
          />
          <button @click="checkLevel7" class="bg-green-500 text-black px-6 py-2 font-bold">
            > ĐỌC MAP
          </button>
        </div>
        <p v-if="level7Error" class="text-red-500 animate-pulse mt-2">> LỖI: SAI TỌA ĐỘ BẢN ĐỒ.</p>
      </div>

      <!-- LEVEL 8: Contextual Knowledge -->
      <div
        v-if="currentLevel === 8"
        class="space-y-4 animate-fade-up border border-green-900/40 p-4 mt-6"
      >
        <h2 class="text-xl font-semibold bg-green-900/40 inline-block px-2">> SYSTEM.LEVEL(8)</h2>
        <p>Phân loại: Core Principles.</p>
        <p class="text-green-300">
          CÂU HỎI TRÍ TUỆ: "Quy tắc cốt lõi số 1 và bất di bất dịch của kiến trúc dự án
          vibe.j2team.org hiển nhiên là gì?"
        </p>

        <div class="mt-4 flex flex-col sm:flex-row gap-4">
          <input
            v-model="level8Input"
            type="text"
            class="flex-1 bg-black border border-green-500 text-green-500 px-4 py-2 focus:outline-none focus:bg-green-900/20"
            placeholder="Trả lời..."
            @keyup.enter="checkLevel8"
          />
          <button @click="checkLevel8" class="bg-green-500 text-black px-6 py-2 font-bold">
            > TRẢ LỜI
          </button>
        </div>
        <p v-if="level8Error" class="text-red-500 animate-pulse mt-2">
          > LỖI: SỰ HIỂU BIẾT CHƯA ĐẠT CẢNH GIỚI.
        </p>
      </div>

      <!-- LEVEL 9: Cookie Manipulation -->
      <div
        v-if="currentLevel === 9"
        class="space-y-4 animate-fade-up border border-green-900/40 p-4 mt-6"
      >
        <h2 class="text-xl font-semibold bg-green-900/40 inline-block px-2">> SYSTEM.LEVEL(9)</h2>
        <p>Phân loại: Cookie Header Manipulation.</p>
        <p class="text-red-500">> ACCESS DENIED: Admin Cookie bị từ chối.</p>
        <p>
          Yêu cầu: Inject một Document Cookie có nội dung chính xác là
          <code class="text-yellow-400">hacker_role={{ dynamicAns.l9 }}</code> để qua trạm.
        </p>

        <div class="mt-4 p-4 border border-green-500 border-dashed text-center">
          <!-- Khi hack cookie xong nút này mới hiện ra -->
          <button
            v-if="level9CookieFound"
            @click="nextFromLevel9"
            class="bg-green-500 text-black px-6 py-2 font-bold w-full sm:w-auto hover:bg-green-400 animate-pulse"
          >
            > TIẾP TỤC (NEXT LEVEL)
          </button>

          <p v-else class="text-green-700 animate-pulse">> ĐANG LẮNG NGHE COOKIE STREAM...</p>
        </div>
      </div>

      <!-- LEVEL 10: XOR Cipher -->
      <div
        v-if="currentLevel === 10"
        class="space-y-4 animate-fade-up border border-green-900/40 p-4 mt-6"
      >
        <h2 class="text-xl font-semibold bg-green-900/40 inline-block px-2 animate-pulse">
          > SYSTEM.FINAL_BOSS(10)
        </h2>
        <p>Phân loại: XOR CIPHER BASE64.</p>
        <p>Mã PIN cuối cùng bị bảo vệ bởi Root Engine.</p>
        <p>
          1. Xác định `--secret-key` trong khối `&lt;style&gt;` nằm trong `head` hoặc Component (đã
          bị Dynamic Inject ghi đè màu text css_var_override).
        </p>
        <p>
          2. Viết mã để bẻ khóa (XOR) chuỗi Cipher bằng Secret Key vừa tìm được và đảo ngược Base64.
        </p>
        <p>
          <span class="text-yellow-400 break-words mt-2 inline-block font-bold"
            >> CIPHER: {{ dynamicAns.l10_hash }}</span
          >
        </p>

        <div class="mt-4 flex flex-col sm:flex-row gap-4">
          <input
            v-model="level10Input"
            type="text"
            class="flex-1 bg-black border border-green-500 text-green-500 px-4 py-2 focus:outline-none focus:bg-green-900/20"
            placeholder="FINAL COMMAND..."
            @keyup.enter="checkLevel10"
          />
          <button
            @click="checkLevel10"
            class="bg-green-500 text-black px-6 py-2 font-bold hover:bg-yellow-400"
          >
            > EXECUTE WIN()
          </button>
        </div>
        <p v-if="level10Error" class="text-red-500 animate-pulse mt-2">
          > LỖI: HỆ THỐNG TRUY KÍCH_MẬT MÃ TỪ CHỐI BỞI ROOT ENGINE.
        </p>
      </div>

      <!-- HOÀN THÀNH -->
      <div
        v-if="currentLevel === 11"
        class="space-y-4 animate-fade-up border border-green-500 p-6 bg-green-900/20 mt-4 relative z-50"
      >
        <h2 class="text-3xl font-bold text-center text-yellow-400">> YOU ARE GRANDMASTER HACKER</h2>
        <p class="text-center text-lg mt-4 animate-pulse">MISSION PASSED! RESPECT +</p>
        <p class="text-center text-sm mt-2 text-green-400">
          Bạn đã phá đảo The Labyrinth bằng kỹ năng Inspect mãnh liệt.
        </p>
        <p class="text-center text-sm">Không còn bức tường nào có thể cản bước bạn, Hacker.</p>
        <div class="flex justify-center mt-6">
          <button
            @click="resetGame"
            class="border-2 border-green-500 bg-black hover:bg-green-500 hover:text-black px-6 py-2 transition-colors font-bold uppercase tracking-wider"
          >
            > REBOOT HACKER LAB
          </button>
        </div>
      </div>
    </div>

    <!-- Trang trí thêm scanline effect -->
    <div
      class="pointer-events-none fixed inset-0 z-30 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] opacity-20 hidden sm:block"
    ></div>
  </div>
</template>

<style>
/*
  =========================================
  CTF LEVEL 10 CONFIGURATION
  Chứa CSS Variable giấu Secret Key của cửa 10.
  Hãy dùng Inspect (Elements) để tìm nhé!
  Variable này sẽ được override styles bởi :root bind
  =========================================
*/
:root {
  --secret-key: v-bind('dynamicAns.l10_key');
}
</style>
