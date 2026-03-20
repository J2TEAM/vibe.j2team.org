<script setup lang="ts">
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { RouterLink } from 'vue-router'

type Mode = 'idle' | 'loading' | 'roast' | 'praise'
type Tab = 'random' | 'code'

// ─── State ─────────────────────────────────────────────────────────────────
const mode = ref<Mode>('idle')
const activeTab = ref<Tab>('random')
const message = ref('')
const isTyping = ref(false)
const cowMood = ref<'idle' | 'happy' | 'angry' | 'thinking'>('idle')
const charCount = ref(0)
const currentDisplayMessage = ref('')
const codeInput = ref('')
const codeIssues = ref<string[]>([])

let typingTimer: ReturnType<typeof setTimeout> | null = null

// ─── Random messages ────────────────────────────────────────────────────────
const roastMessages = [
  'Oke nghe nè, code của mày chắc viết bằng não trái thôi 😭 stack overflow còn phải né mày ra. Senior 5 năm mà vẫn Google "how to center a div" — không phán, chỉ thương 💀',
  'Bro ơi... commit message "fix bug" là không ổn nha. "fix bug" cái gì? Bug nào? Từ bao giờ? Deploy production mà code review như xem phim không cần não 😮‍💨',
  'Dân IT mà deadline thì miss, meeting thì ngủ gật, review code thì comment "lgtm" không đọc — bro đang cosplay PM hay cosplay intern vậy 💀',
  'Terminal của bro chắc toàn màu đỏ. Không phải vì dark mode, mà vì lỗi nhiều quá đỏ hết rồi 😭 npm install xong pray thầm là nó chạy được kkk',
  'Ôi bro check GitHub contribution graph của bro đi — trắng tinh như tâm hồn, chỉ có mỗi ngày 1/1 commit "initial project" rồi thôi 💀 codebase bỏ hoang hơn ex cũ',
  'Tech stack của bro: jQuery + PHP thuần + XAMPP + phpMyAdmin. Năm 2024 mà vẫn "nó chạy được là oke nhé" 😭 bro ơi có cái gì đó gọi là framework đó',
  'PR của bro +2000 lines không có test, không có docs, description là "update stuff" — merge vào main lúc 11pm thứ 6. Bro đang tự làm khó team hay troll cả công ty vậy 🥲',
  'Bro debug bằng cách console.log("here"), console.log("here2"), console.log("HEEERE") — anh ơi, debugger tool không phải đồ trang trí 😭',
  'Interview hỏi "em biết gì về clean code?" — trả lời "em biết code sạch là không có comment thừa" rồi nộp file 500 dòng không break line 💀 không phải clean, là desert',
  'Bro deploy bằng cách FTP file lên server production trực tiếp lúc peak hour. CI/CD là gì? Git là gì? Bro sống ở timeline nào vậy 😮‍💨',
]

const praiseMessages = [
  'Wow bro ơi, code của bro clean hơn tâm hồn tôi lúc chưa có cà phê ☕✨ đọc function của bro mà ngộ ra triết lý sống luôn — naming convention chuẩn bài, comment đủ không thừa, 10đ không cần chờ',
  'Okayy bro này pro thật sự chứ không phải fake— pull request của bro là PR mẫu để cả team học theo. Description chi tiết, test coverage đủ, không có conflict — bro là ánh sáng trong team 🌟',
  'Bro debug vấn đề trong 10 phút mà senior khác loay hoay 2 tiếng — não bro đang chạy thuật toán gì vậy, share cho tôi với 🧠⚡ thực sự impressed nha không phải xã giao',
  'Architecture của bro scalable, readable, và maintainable cùng lúc — ba điều mà 90% dev nghĩ chúng mâu thuẫn kkk. Bro là living proof rằng code đẹp là có thật 💎',
  'Bro commit đều mỗi ngày, message rõ ràng, không bao giờ push lên main trực tiếp — bro đang sống đúng nghĩa của "software engineer" không phải "code monkey" 🫡',
  'Tech stack của bro chọn đúng tool cho đúng job — không over-engineer, không under-engineer. Cái sự tỉnh táo đó hiếm lắm bro ơi, team nào có bro là team đó lucky 🍀',
  'Bro viết docs mà tôi đọc hiểu ngay không cần hỏi lại — biết bro là người thật không phải AI vì AI còn lười hơn bro đó 😌📝 docs champion real',
  'Performance của app bro viết: load 0.8s, Lighthouse 98/100, zero layout shift — bro không phải dev nữa, bro là nghệ sĩ 🎨⚡ user experience God level',
  'Code review của bro: constructive, không toxic, chỉ ra vấn đề kèm giải pháp — bro là loại senior mà junior nào cũng ước có trong team 💌 mentor material 100%',
  'Bro tự học thêm, theo dõi industry trends, experiment side projects — cái passion đó mới là thứ tạo ra sự khác biệt. Không phải bằng cấp, không phải title, là cái lửa trong mắt 🔥',
]

// ─── Code Issue Detectors ───────────────────────────────────────────────────
interface IssueRule {
  id: string
  detect: (code: string) => boolean
  roastLine: string
  label: string
}

const issueRules: IssueRule[] = [
  {
    id: 'console_log',
    detect: code => /console\.log\s*\(/g.test(code),
    label: 'console.log còn nguyên',
    roastLine:
      'Bro để nguyên `console.log` trong production như để lại dấu vết tại hiện trường 💀 debugger tool ngồi khóc không ai dùng',
  },
  {
    id: 'var_usage',
    detect: code => /\bvar\s+\w+/g.test(code),
    label: 'Dùng var thay vì let/const',
    roastLine:
      '`var` hả bro? 2025 rồi mà vẫn dùng `var` như đang viết IE6 polyfill 😭 `let` và `const` không phải decoration đâu nha',
  },
  {
    id: 'any_type',
    detect: code => /:\s*any\b/g.test(code),
    label: 'Dùng type any',
    roastLine:
      '`: any` nhiều quá — bro đang dùng TypeScript hay đang escape TypeScript vậy 🥲 any là "tôi chịu thua" viết bằng code',
  },
  {
    id: 'todo_comment',
    detect: code => /\/\/\s*(TODO|FIXME|HACK|XXX)/gi.test(code),
    label: 'TODO/FIXME chưa giải quyết',
    roastLine:
      'TODO comment nhiều như danh sách new year resolution — đầy tham vọng, không bao giờ done 😮‍💨 "fix later" = không bao giờ fix',
  },
  {
    id: 'magic_number',
    detect: code => /[^.\w]((?!0|1|2|-1)\d{2,})[^.\w\d]/g.test(code),
    label: 'Magic number không giải thích',
    roastLine:
      'Magic number xuất hiện khắp nơi như `86400`, `3600`, `1440` mà không có tên — 3 tháng sau chính bro cũng không biết số đó là cái gì 💀',
  },
  {
    id: 'empty_catch',
    detect: code => /catch\s*\([^)]*\)\s*\{\s*\}/g.test(code),
    label: 'Empty catch block',
    roastLine:
      'Empty catch block — nuốt error vào bụng rồi im lặng như người lớn 😭 bug xảy ra mà không ai biết, rồi blame người khác sau',
  },
  {
    id: 'long_function',
    detect: (code) => {
      const lines = code.split('\n')
      return lines.length > 60
    },
    label: 'Function/file quá dài',
    roastLine:
      `Code dài hơn tiểu thuyết Dostoyevsky mà không có chapter nào 😭 Single Responsibility Principle ơi, bro có nghe qua chưa?`,
  },
  {
    id: 'nested_callback',
    detect: code =>
      /\}\s*\)\s*\}\s*\)\s*\}\s*\)/.test(code) ||
      (code.match(/\.then\s*\(/g) ?? []).length >= 3,
    label: 'Callback hell / Promise chain dài',
    roastLine:
      'Callback lồng nhau như bắp cải — bóc ra không biết bao nhiêu lớp mới xong 😭 `async/await` sinh ra để giải phóng bro khỏi địa ngục này',
  },
  {
    id: 'single_letter_var',
    detect: (code) => {
      const matches = code.match(/\b(?:const|let|var)\s+([a-zA-Z])\s*[=;]/g) ?? []
      return matches.filter(m => !/ [ijk] /.test(m)).length >= 2
    },
    label: 'Biến tên 1 chữ cái',
    roastLine:
      'Tên biến `a`, `b`, `c`, `x` — bro đang viết code hay đang giải phương trình trung học vậy 💀 naming convention là để người khác đọc được, không phải để flex bí ẩn',
  },
  {
    id: 'hardcoded_url',
    detect: code => /["'`]https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(code),
    label: 'Hard-coded IP/URL',
    roastLine:
      'Hard-code IP address thẳng vào code — deploy lên production là xịt ngay, rồi lại "không biết tại sao không chạy" 😭 environment variable nghe quen không bro',
  },
  {
    id: 'no_error_handling',
    detect: code =>
      /\bfetch\s*\(/.test(code) &&
      !/(try|catch|\.catch)/.test(code),
    label: 'fetch() không có error handling',
    roastLine:
      '`fetch()` mà không có `.catch()` hay `try/catch` — mạng chết 1 giây là app của bro crash không recover 😭 error handling không phải optional feature',
  },
  {
    id: 'duplicate_code',
    detect: (code) => {
      const lines = code.split('\n').map(l => l.trim()).filter(l => l.length > 15)
      const seen = new Set<string>()
      let dups = 0
      for (const line of lines) {
        if (seen.has(line)) dups++
        seen.add(line)
      }
      return dups >= 3
    },
    label: 'Code lặp lại (copy-paste)',
    roastLine:
      'Copy-paste code như dân chuyên nghiệp — Ctrl+C Ctrl+V xong gọi là "implement feature" 💀 DRY principle: Don\'t Repeat Yourself, nhưng bro đang Repeat Yourself rất Yourself',
  },
  {
    id: 'password_in_code',
    detect: code =>
      /(?:password|secret|apikey|api_key|token)\s*[:=]\s*["'`][^"'`]{4,}/gi.test(code),
    label: '🚨 Credential/secret trong code',
    roastLine:
      '🚨 SECRET KEY / PASSWORD trong source code?! Bro đang define thế nào là security breach không 😭 GitHub scan thấy là toast ngay, hacker cảm ơn bro lắm',
  },
  {
    id: 'long_line',
    detect: code => code.split('\n').some(l => l.length > 180),
    label: 'Dòng code quá dài',
    roastLine:
      'Có dòng code dài hơn cả mối quan hệ của tôi — cuộn ngang để đọc thì ai chịu nổi 😭 line break sinh ra không phải để làm decoration',
  },
  {
    id: 'alert_usage',
    detect: code => /\balert\s*\(\s*["'`]/.test(code),
    label: 'Dùng alert() trong production',
    roastLine:
      '`alert()` trong production code — 2005 gọi lại đòi UI pattern của họ 😭 bro chưa nghe qua toast notification, modal, hay ít nhất là console.error à',
  },
  {
    id: 'object_assign_instead_of_spread',
    detect: code =>
      (code.match(/Object\.assign\s*\(/g) ?? []).length >= 3,
    label: 'Object.assign thay vì spread operator',
    roastLine:
      'Dùng `Object.assign` nhiều quá khi spread operator `{...obj}` sạch hơn và readable hơn nhiều — có khi bro học JS từ tutorial năm 2016 chưa update? 😅',
  },
  {
    id: '== instead_of ===',
    detect: code => /[^=!<>]={2}[^=]/.test(code.replace(/["'`][^"'`]*["'`]/g, '')),
    label: 'Dùng == thay vì ===',
    roastLine:
      '`==` thay vì `===` — "truthy/falsy coercion is a feature not a bug" bro nói 😭 `0 == ""` là `true` đó, tự enjoy với nó đi',
  },
]

// ─── Code analyzer ──────────────────────────────────────────────────────────
function analyzeCode(code: string): { issues: IssueRule[]; summary: string } {
  const found = issueRules.filter(rule => rule.detect(code))
  if (found.length === 0) {
    return {
      issues: [],
      summary:
        'Ơ... thật ra code nhìn khá ổn đó bro 👀 Không tìm ra lỗi rõ ràng nào — hoặc là bro code clean thật, hoặc là con bò chưa học đủ để chê nâng cao hơn 🐄✨ Nhưng mà tự kiểm tra lại business logic với edge case nhé, bò không biết đọc ý bro đâu',
    }
  }

  const roastLines = found.map(r => `• ${r.roastLine}`)
  const intro =
    found.length >= 4
      ? `Ồ wow okay... con bò xem xong code của bro và cần uống nước 🥲 Tìm ra **${found.length} vấn đề** — đây là bản án:\n\n`
      : found.length >= 2
        ? `Hmm, code của bro có **${found.length} điểm cần cải thiện** — không tệ không tốt, tầm trung như quán cơm văn phòng 😅\n\n`
        : `Có 1 vấn đề nhỏ bro ơi, sửa nhanh thôi :\n\n`

  return {
    issues: found,
    summary: intro + roastLines.join('\n\n'),
  }
}

// ─── Type writer ─────────────────────────────────────────────────────────────
function typeWriterEffect(text: string) {
  isTyping.value = true
  currentDisplayMessage.value = ''
  let i = 0

  function typeChar() {
    if (i < text.length) {
      currentDisplayMessage.value += text[i]
      i++
      typingTimer = setTimeout(typeChar, 14)
    } else {
      isTyping.value = false
    }
  }

  typeChar()
}

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ─── Actions ─────────────────────────────────────────────────────────────────
async function triggerRoast() {
  if (typingTimer) clearTimeout(typingTimer)
  mode.value = 'loading'
  cowMood.value = 'thinking'
  await sleep(1200)
  const msg = getRandomItem(roastMessages)
  message.value = msg
  mode.value = 'roast'
  cowMood.value = 'angry'
  codeIssues.value = []
  typeWriterEffect(msg)
  charCount.value++
}

async function triggerPraise() {
  if (typingTimer) clearTimeout(typingTimer)
  mode.value = 'loading'
  cowMood.value = 'thinking'
  await sleep(1200)
  const msg = getRandomItem(praiseMessages)
  message.value = msg
  mode.value = 'praise'
  cowMood.value = 'happy'
  codeIssues.value = []
  typeWriterEffect(msg)
  charCount.value++
}

async function reviewCode() {
  if (!codeInput.value.trim()) return
  if (typingTimer) clearTimeout(typingTimer)
  mode.value = 'loading'
  cowMood.value = 'thinking'
  await sleep(1400)
  const { issues, summary } = analyzeCode(codeInput.value)
  codeIssues.value = issues.map(i => i.label)
  message.value = summary
  if (issues.length === 0) {
    mode.value = 'praise'
    cowMood.value = 'happy'
  } else {
    mode.value = 'roast'
    cowMood.value = 'angry'
  }
  typeWriterEffect(summary)
  charCount.value++
}

// ─── Computed ──────────────────────────────────────────────────────────────
const cowEmoji = computed(() => {
  if (cowMood.value === 'angry') return '😤'
  if (cowMood.value === 'happy') return '🥰'
  if (cowMood.value === 'thinking') return '🤔'
  return '😐'
})

const bubbleColor = computed(() => {
  if (mode.value === 'roast') return 'border-accent-coral'
  if (mode.value === 'praise') return 'border-accent-amber'
  return 'border-border-default'
})

const bubbleBg = computed(() => {
  if (mode.value === 'roast') return 'bg-accent-coral/5'
  if (mode.value === 'praise') return 'bg-accent-amber/5'
  return 'bg-bg-surface'
})

const modeLabel = computed(() => {
  if (mode.value === 'roast') return { text: 'ĐANG CHÊ', color: 'text-accent-coral' }
  if (mode.value === 'praise') return { text: 'ĐANG KHEN', color: 'text-accent-amber' }
  if (mode.value === 'loading') return { text: 'ĐANG NGHĨ', color: 'text-accent-sky' }
  return null
})

const codeCharCount = computed(() => codeInput.value.length)
const codeLineCount = computed(() => codeInput.value.split('\n').length)
const canReview = computed(() => codeInput.value.trim().length > 10)
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body overflow-x-hidden">
    <!-- Background glow -->
    <div class="fixed inset-0 pointer-events-none overflow-hidden">
      <div class="absolute top-[-20%] right-[-10%] w-96 h-96 rounded-full bg-accent-coral/3 blur-3xl" />
      <div class="absolute bottom-[-20%] left-[-10%] w-96 h-96 rounded-full bg-accent-amber/3 blur-3xl" />
    </div>

    <div class="relative z-10 max-w-2xl mx-auto px-4 py-12 flex flex-col items-center gap-8">

      <!-- Header -->
      <div class="w-full flex flex-col items-center gap-4 animate-fade-up">
        <div class="flex items-center gap-2">
          <span class="font-display text-sm tracking-widest text-accent-coral">//</span>
          <span class="font-display text-xs tracking-widest text-text-dim uppercase">Gen-Z IT Bot</span>
        </div>
        <h1 class="font-display text-4xl md:text-6xl font-bold text-center leading-tight">
          🐄 Đừng Chê IT
        </h1>
        <p class="text-text-secondary text-center text-sm md:text-base max-w-sm">
          Con bò AI phán xét dân dev — khen
          <span class="text-accent-amber font-semibold">sịn sò</span> hoặc chê
          <span class="text-accent-coral font-semibold">thối não</span>,
          giờ còn review thẳng code của bro 💀
        </p>
        <div
          v-if="charCount > 0"
          class="flex items-center gap-2 border border-border-default bg-bg-surface px-3 py-1.5 text-xs text-text-dim font-display tracking-wide"
        >
          <Icon icon="lucide:zap" class="size-3 text-accent-amber" />
          Đã phán {{ charCount }} lần
        </div>
      </div>

      <!-- Dot divider -->
      <div class="flex gap-1.5 animate-fade-up animate-delay-1">
        <span v-for="n in 30" :key="n" class="w-1 h-1 rounded-full bg-border-default" />
      </div>

      <!-- COW MASCOT -->
      <div class="relative flex flex-col items-center gap-2 animate-fade-up animate-delay-2">
        <div
          v-if="modeLabel"
          class="flex items-center gap-1.5 px-3 py-1 text-xs font-display tracking-widest border border-current"
          :class="modeLabel.color"
        >
          <span
            v-if="mode === 'loading'"
            class="inline-block w-1.5 h-1.5 rounded-full bg-current animate-pulse"
          />
          {{ modeLabel.text }}
        </div>

        <div
          class="relative select-none transition-all duration-500"
          :class="{
            'scale-110': cowMood === 'happy',
            'scale-95 rotate-2': cowMood === 'angry',
            'animate-bounce': cowMood === 'thinking',
          }"
        >
          <svg viewBox="0 0 200 220" class="w-36 h-40 md:w-44 md:h-48 drop-shadow-lg" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="100" cy="150" rx="65" ry="55" fill="#f0ede6" />
            <ellipse cx="70" cy="140" rx="20" ry="16" fill="#1e2f42" :class="{ 'opacity-60': cowMood === 'happy' }" />
            <ellipse cx="130" cy="165" rx="14" ry="10" fill="#1e2f42" />
            <ellipse cx="110" cy="130" rx="10" ry="8" fill="#1e2f42" />
            <ellipse cx="100" cy="80" rx="48" ry="42" fill="#f0ede6" />
            <ellipse cx="80" cy="70" rx="12" ry="10" fill="#1e2f42" />
            <ellipse cx="52" cy="55" rx="14" ry="10" fill="#f0ede6" transform="rotate(-20, 52, 55)" />
            <ellipse cx="52" cy="55" rx="8" ry="5" fill="#ff6b4a" transform="rotate(-20, 52, 55)" />
            <ellipse cx="148" cy="55" rx="14" ry="10" fill="#f0ede6" transform="rotate(20, 148, 55)" />
            <ellipse cx="148" cy="55" rx="8" ry="5" fill="#ff6b4a" transform="rotate(20, 148, 55)" />
            <path d="M62 42 Q50 20 42 18 Q48 30 58 40" fill="#ffb830" stroke="#ffb830" stroke-width="2" />
            <path d="M138 42 Q150 20 158 18 Q152 30 142 40" fill="#ffb830" stroke="#ffb830" stroke-width="2" />
            <ellipse cx="100" cy="100" rx="24" ry="16" fill="#f5d0b0" />
            <ellipse cx="91" cy="104" rx="5" ry="4" fill="#253549" />
            <ellipse cx="109" cy="104" rx="5" ry="4" fill="#253549" />
            <!-- Eyes -->
            <template v-if="cowMood === 'idle' || cowMood === 'thinking'">
              <circle cx="82" cy="72" r="9" fill="white" /><circle cx="82" cy="72" r="5" fill="#0f1923" /><circle cx="84" cy="70" r="2" fill="white" />
              <circle cx="118" cy="72" r="9" fill="white" /><circle cx="118" cy="72" r="5" fill="#0f1923" /><circle cx="120" cy="70" r="2" fill="white" />
            </template>
            <template v-if="cowMood === 'happy'">
              <path d="M73 75 Q82 65 91 75" stroke="#0f1923" stroke-width="3" fill="none" />
              <path d="M109 75 Q118 65 127 75" stroke="#0f1923" stroke-width="3" fill="none" />
              <ellipse cx="75" cy="83" rx="10" ry="6" fill="#ff6b4a" opacity="0.25" />
              <ellipse cx="125" cy="83" rx="10" ry="6" fill="#ff6b4a" opacity="0.25" />
            </template>
            <template v-if="cowMood === 'angry'">
              <circle cx="82" cy="72" r="9" fill="white" /><circle cx="82" cy="74" r="5" fill="#ff6b4a" /><circle cx="84" cy="72" r="2" fill="white" />
              <circle cx="118" cy="72" r="9" fill="white" /><circle cx="118" cy="74" r="5" fill="#ff6b4a" /><circle cx="120" cy="72" r="2" fill="white" />
              <path d="M73 63 Q82 58 91 63" stroke="#0f1923" stroke-width="3" fill="none" />
              <path d="M109 63 Q118 58 127 63" stroke="#0f1923" stroke-width="3" fill="none" />
            </template>
            <!-- Mouth -->
            <template v-if="cowMood === 'idle'">
              <path d="M88 112 Q100 118 112 112" stroke="#253549" stroke-width="2" fill="none" />
            </template>
            <template v-if="cowMood === 'happy'">
              <path d="M84 110 Q100 122 116 110" stroke="#0f1923" stroke-width="3" fill="none" stroke-linecap="round" />
            </template>
            <template v-if="cowMood === 'angry'">
              <path d="M87 116 Q100 110 113 116" stroke="#ff6b4a" stroke-width="2.5" fill="none" />
            </template>
            <template v-if="cowMood === 'thinking'">
              <path d="M90 113 Q100 116 110 113" stroke="#253549" stroke-width="2" fill="none" />
              <circle cx="125" cy="60" r="4" fill="#38bdf8" opacity="0.8" />
              <circle cx="136" cy="52" r="6" fill="#38bdf8" opacity="0.6" />
              <circle cx="150" cy="42" r="8" fill="#38bdf8" opacity="0.4" />
            </template>
            <!-- Legs -->
            <rect x="70" y="195" width="18" height="20" rx="4" fill="#f0ede6" />
            <rect x="112" y="195" width="18" height="20" rx="4" fill="#f0ede6" />
            <rect x="78" y="205" width="10" height="8" rx="2" fill="#1e2f42" />
            <rect x="120" y="205" width="10" height="8" rx="2" fill="#1e2f42" />
            <path d="M165 150 Q185 140 180 160 Q175 180 165 170" stroke="#f0ede6" stroke-width="4" fill="none" stroke-linecap="round" />
            <circle cx="164" cy="170" r="5" fill="#ffb830" />
          </svg>
          <div v-if="cowMood === 'happy'" class="absolute -top-4 -right-4 text-2xl animate-bounce">✨</div>
          <div v-if="cowMood === 'angry'" class="absolute -top-4 -right-4 text-2xl animate-bounce">💢</div>
        </div>
        <div class="text-4xl transition-all duration-300">{{ cowEmoji }}</div>
      </div>

      <!-- Speech bubble -->
      <div
        class="w-full transition-all duration-500"
        :class="mode !== 'idle' ? 'opacity-100' : 'opacity-0 pointer-events-none h-0 overflow-hidden'"
      >
        <div
          class="relative border p-5 transition-all duration-500 min-h-20"
          :class="[bubbleColor, bubbleBg]"
        >
          <!-- Loading -->
          <div v-if="mode === 'loading'" class="flex items-center justify-center gap-2 py-4">
            <span class="w-2 h-2 rounded-full bg-accent-sky animate-bounce" style="animation-delay: 0ms" />
            <span class="w-2 h-2 rounded-full bg-accent-sky animate-bounce" style="animation-delay: 150ms" />
            <span class="w-2 h-2 rounded-full bg-accent-sky animate-bounce" style="animation-delay: 300ms" />
            <span class="text-text-dim text-sm font-display tracking-wide ml-2">Bò đang phán xét...</span>
          </div>

          <!-- Message -->
          <div v-else>
            <!-- Issue badges (code review only) -->
            <div v-if="codeIssues.length > 0" class="flex flex-wrap gap-1.5 mb-4">
              <span
                v-for="issue in codeIssues"
                :key="issue"
                class="text-xs font-display tracking-wide px-2 py-0.5 bg-accent-coral/15 text-accent-coral border border-accent-coral/30"
              >
                {{ issue }}
              </span>
            </div>

            <div class="flex items-start gap-3 mb-3">
              <Icon
                v-if="mode === 'roast'"
                icon="lucide:flame"
                class="size-5 text-accent-coral shrink-0 mt-0.5"
              />
              <Icon
                v-else-if="mode === 'praise'"
                icon="lucide:star"
                class="size-5 text-accent-amber shrink-0 mt-0.5"
              />
              <!-- Render newlines properly -->
              <p class="text-text-primary text-sm leading-relaxed font-body whitespace-pre-line">{{ currentDisplayMessage }}<span v-if="isTyping" class="inline-block w-0.5 h-4 bg-text-secondary animate-pulse ml-0.5 align-middle" /></p>
            </div>

            <div class="flex items-center gap-2 pt-3 border-t border-border-default">
              <span
                class="text-xs font-display tracking-widest uppercase"
                :class="mode === 'roast' ? 'text-accent-coral' : 'text-accent-amber'"
              >
                {{ mode === 'roast' ? '— Con Bò Chê' : '— Con Bò Khen' }}
              </span>
              <span class="text-text-dim text-xs">// IT Bot 🐄</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Idle placeholder -->
      <div
        v-if="mode === 'idle'"
        class="w-full border border-dashed border-border-default bg-bg-surface p-5 text-center"
      >
        <p class="text-text-dim text-sm font-body">Nhấn nút bên dưới hoặc paste code vào để con bò phán xét 👇</p>
      </div>

      <!-- ── TABS ──────────────────────────────────────────────────────────── -->
      <div class="w-full animate-fade-up animate-delay-3">
        <div class="flex border-b border-border-default mb-5">
          <button
            class="flex items-center gap-2 px-5 py-2.5 text-sm font-display tracking-wide transition-all duration-200 cursor-pointer border-b-2"
            :class="activeTab === 'random'
              ? 'border-accent-coral text-text-primary'
              : 'border-transparent text-text-dim hover:text-text-secondary'"
            @click="activeTab = 'random'"
          >
            <Icon icon="lucide:shuffle" class="size-4" />
            RANDOM
          </button>
          <button
            class="flex items-center gap-2 px-5 py-2.5 text-sm font-display tracking-wide transition-all duration-200 cursor-pointer border-b-2"
            :class="activeTab === 'code'
              ? 'border-accent-amber text-text-primary'
              : 'border-transparent text-text-dim hover:text-text-secondary'"
            @click="activeTab = 'code'"
          >
            <Icon icon="lucide:code-2" class="size-4" />
            REVIEW CODE
            <span class="text-xs bg-accent-amber/20 text-accent-amber px-1.5 py-0.5 font-display tracking-wide">NEW</span>
          </button>
        </div>

        <!-- Random tab -->
        <div v-if="activeTab === 'random'" class="flex flex-col gap-4">
          <div class="grid grid-cols-2 gap-4">
            <button
              :disabled="mode === 'loading'"
              class="group flex flex-col items-center gap-3 border border-border-default bg-bg-surface p-5 transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/10 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 cursor-pointer"
              @click="triggerRoast"
            >
              <div class="w-12 h-12 flex items-center justify-center border border-border-default bg-bg-deep transition-all duration-300 group-hover:border-accent-coral group-hover:bg-accent-coral/10">
                <Icon icon="lucide:flame" class="size-6 text-accent-coral" />
              </div>
              <div class="text-center">
                <p class="font-display text-sm font-semibold tracking-wide text-text-primary">🔥 CHÊ TÔI ĐI</p>
                <p class="text-xs text-text-dim mt-0.5">Roast thẳng tay</p>
              </div>
            </button>

            <button
              :disabled="mode === 'loading'"
              class="group flex flex-col items-center gap-3 border border-border-default bg-bg-surface p-5 transition-all duration-300 hover:-translate-y-1 hover:border-accent-amber hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-amber/10 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 cursor-pointer"
              @click="triggerPraise"
            >
              <div class="w-12 h-12 flex items-center justify-center border border-border-default bg-bg-deep transition-all duration-300 group-hover:border-accent-amber group-hover:bg-accent-amber/10">
                <Icon icon="lucide:star" class="size-6 text-accent-amber" />
              </div>
              <div class="text-center">
                <p class="font-display text-sm font-semibold tracking-wide text-text-primary">⭐ KHEN TÔI ĐI</p>
                <p class="text-xs text-text-dim mt-0.5">Boost tự tin</p>
              </div>
            </button>
          </div>

          <button
            :disabled="mode === 'loading'"
            class="group w-full flex items-center justify-center gap-2 border border-border-default bg-bg-surface px-6 py-3.5 text-sm font-display tracking-wide text-text-secondary transition-all duration-300 hover:border-accent-sky hover:text-text-primary hover:bg-bg-elevated disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            @click="Math.random() > 0.5 ? triggerRoast() : triggerPraise()"
          >
            <Icon icon="lucide:shuffle" class="size-4 text-accent-sky transition-transform duration-300 group-hover:rotate-180" />
            RANDOM — Bò Tự Quyết
          </button>
        </div>

        <!-- Code review tab -->
        <div v-if="activeTab === 'code'" class="flex flex-col gap-4">
          <!-- Code textarea -->
          <div class="relative">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <span class="text-accent-amber font-display text-xs tracking-widest">//</span>
                <span class="text-text-dim text-xs font-display tracking-wide">PASTE CODE VÀO ĐÂY</span>
              </div>
              <div class="flex items-center gap-3 text-xs text-text-dim font-display">
                <span>{{ codeLineCount }} dòng</span>
                <span>{{ codeCharCount }} ký tự</span>
              </div>
            </div>

            <textarea
              v-model="codeInput"
              placeholder="// Paste code của bro vào đây...
// Bất kỳ ngôn ngữ nào: JS, TS, Python, Java, PHP...
// Con bò sẽ chê thẳng mặt không ngại ngùng 🐄"
              class="w-full h-48 bg-bg-surface border border-border-default text-text-primary text-sm font-mono p-4 resize-y placeholder-text-dim focus:outline-none focus:border-accent-amber transition-colors duration-200 leading-relaxed"
              spellcheck="false"
            />

            <!-- Detected issues preview -->
            <div
              v-if="codeInput.trim().length > 0"
              class="mt-2 flex flex-wrap gap-1.5"
            >
              <template v-for="rule in issueRules" :key="rule.id">
                <span
                  v-if="rule.detect(codeInput)"
                  class="text-xs px-2 py-0.5 font-display tracking-wide border border-accent-coral/40 text-accent-coral/80 bg-accent-coral/5"
                >
                  ⚠ {{ rule.label }}
                </span>
              </template>
              <span
                v-if="issueRules.every(r => !r.detect(codeInput))"
                class="text-xs px-2 py-0.5 font-display tracking-wide border border-accent-amber/40 text-accent-amber/80 bg-accent-amber/5"
              >
                ✓ Trông khá ổn...
              </span>
            </div>
          </div>

          <button
            :disabled="!canReview || mode === 'loading'"
            class="group w-full flex items-center justify-center gap-3 border bg-bg-surface px-6 py-4 text-sm font-display tracking-wide transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            :class="canReview
              ? 'border-accent-amber hover:border-accent-coral hover:shadow-accent-coral/10 text-text-primary'
              : 'border-border-default text-text-dim'"
            @click="reviewCode"
          >
            <Icon icon="lucide:search-code" class="size-5 text-accent-amber group-hover:text-accent-coral transition-colors duration-300" />
            <span>🐄 BÒ REVIEW CODE NÀY</span>
          </button>

          <!-- What the bot detects -->
          <div class="border border-border-default bg-bg-surface p-4">
            <p class="text-xs font-display tracking-widest text-text-dim mb-3">
              <span class="text-accent-sky">//</span> CON BÒ PHÁT HIỆN ĐƯỢC
            </p>
            <div class="grid grid-cols-2 gap-x-4 gap-y-1.5">
              <div
                v-for="rule in issueRules"
                :key="rule.id"
                class="flex items-center gap-1.5 text-xs text-text-dim"
              >
                <Icon icon="lucide:check-circle" class="size-3 shrink-0 text-border-default" />
                <span>{{ rule.label }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Dot divider -->
      <div class="flex gap-1.5">
        <span v-for="n in 30" :key="n" class="w-1 h-1 rounded-full bg-border-default" />
      </div>

      <!-- Footer -->
      <div class="flex flex-col items-center gap-4">
        <div class="border border-border-default bg-bg-surface px-4 py-3 text-center text-xs text-text-dim font-body max-w-sm">
          💡 Disclaimer: analysis này dựa trên pattern matching, không phải AI đọc hiểu. Bò không biết business logic của bro đâu nhé 🐄
        </div>
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-5 py-2.5 text-sm text-text-secondary transition-all duration-300 hover:border-accent-coral hover:text-text-primary"
        >
          <Icon icon="lucide:arrow-left" class="size-4" />
          Back to home
        </RouterLink>
      </div>

    </div>
  </div>
</template>
