<script setup lang="ts">
import { ref, computed, onUnmounted, watch } from 'vue'
import { RouterLink } from 'vue-router'

// ─── Types ───────────────────────────────────────────────────
interface Question {
  text: string
  options: string[]
  correctIndex: number
}

// ─── State ───────────────────────────────────────────────────
type Screen = 'intro' | 'level' | 'roast' | 'game' | 'gameover' | 'win'
const screen = ref<Screen>('intro')
const age = ref<number | null>(null)
const selectedLevel = ref('')
const currentQ = ref(0)
const score = ref(0)
const timer = ref(0)
const roastMsg = ref('')
const gameOverMsg = ref('')
const shakeScreen = ref(false)
const selectedOption = ref<number | null>(null)
const answeredWrong = ref(false)

let timerInterval: ReturnType<typeof setInterval> | null = null

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})

// ─── Level Definitions ──────────────────────────────────────
const levels = [
  'Lớp 1',
  'Lớp 2',
  'Lớp 3',
  'Lớp 4',
  'Lớp 5',
  'Lớp 6',
  'Lớp 7',
  'Lớp 8',
  'Lớp 9',
  'Lớp 10',
  'Lớp 11',
  'Lớp 12',
  'Đại Học',
  'Thạc Sĩ',
  'Giáo Sư',
  'Vi Thần',
  'Ngẫu Nhiên',
]

function levelToAge(level: string): number {
  const map: Record<string, number> = {
    'Lớp 1': 6,
    'Lớp 2': 7,
    'Lớp 3': 8,
    'Lớp 4': 9,
    'Lớp 5': 10,
    'Lớp 6': 11,
    'Lớp 7': 12,
    'Lớp 8': 13,
    'Lớp 9': 14,
    'Lớp 10': 15,
    'Lớp 11': 16,
    'Lớp 12': 17,
    'Đại Học': 22,
    'Thạc Sĩ': 26,
    'Giáo Sư': 35,
    'Vi Thần': 99,
    'Ngẫu Nhiên': 18,
  }
  return map[level] ?? 18
}

function levelIcon(level: string): string {
  if (level.startsWith('Lớp')) {
    const n = Number(level.replace('Lớp ', ''))
    if (n <= 5) return '📐'
    if (n <= 9) return '📊'
    return '📈'
  }
  const icons: Record<string, string> = {
    'Đại Học': '🎓',
    'Thạc Sĩ': '🔬',
    'Giáo Sư': '🧠',
    'Vi Thần': '👁️‍🗨️',
    'Ngẫu Nhiên': '🎲',
  }
  return icons[level] ?? '📝'
}

// ─── Roast Generator ────────────────────────────────────────
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!
}

function generateRoast(userAge: number, level: string): string {
  if (level === 'Vi Thần') {
    return pickRandom([
      `Chọn Vi Thần à? Xin lỗi vì đã đánh giá thấp bạn. Hoặc bạn là một vị thần giáng thế, hoặc bạn sắp phải đi mổ não sau 20 câu này.`,
      `Chà, Vi Thần! ${userAge} tuổi mà dám click vào đây thì độ liều lĩnh của bạn phải sánh ngang với việc nhảy dù không cần dù. Chúc bạn bảo toàn được nơ-ron thần kinh.`,
    ])
  }

  const levelAge = levelToAge(level)
  const diff = userAge - levelAge

  if (level === 'Ngẫu Nhiên') {
    return pickRandom([
      `${userAge} tuổi mà chọn Ngẫu Nhiên? Hay là không đủ tự tin chọn đúng trình độ của mình nên phải nhờ ông Trời xếp hộ?`,
      `Ngẫu Nhiên à? ${userAge} tuổi rồi mà không biết mình ở level nào thì cũng đáng lo đấy.`,
    ])
  }

  if (diff >= 10) {
    return pickRandom([
      `${userAge} tuổi đầu rồi mà chọn ${level}?! Lòng tự trọng của bạn rẻ hơn kẹo mút trường tiểu học. Già đầu đi tranh kẹo với con nít, nhục không?`,
      `Ôi trời ơi, ${userAge} tuổi chọn ${level}! Thế bạn đi thi đấu võ với trẻ sơ sinh cho oai luôn đi? Tự trọng của bạn đang nằm ở đáy Mariana Trench kìa.`,
    ])
  }

  if (diff >= 4) {
    return pickRandom([
      `${userAge} tuổi đầu mà chọn ${level} à? Hèn vừa thôi bạn ơi. Lớn rồi mà vẫn sợ toán cơ bản thì cũng hiểu sao cuộc đời khó khăn.`,
      `Hmm, ${userAge} tuổi → ${level}. Bạn thuộc team "an toàn là trên hết" đúng không? Sợ thất bại đến mức không dám thử thách à?`,
    ])
  }

  if (diff < -5) {
    return pickRandom([
      `${userAge} tuổi mà dám chọn ${level}? Ngựa non háu đá! Chưa đỗ ông nghè đã đe hàng tổng. Ảo tưởng sức mạnh quá trời luôn.`,
      `Ủa, ${userAge} tuổi chọn ${level}? Bạn còn chưa biết chia cho 7 mà đòi leo lên đỉnh Olympus? Quay về thực tại đi nha.`,
    ])
  }

  if (diff < 0) {
    return pickRandom([
      `${userAge} tuổi chọn ${level}? Có chút tham vọng đấy. Nhưng tham vọng mà không có thực lực thì gọi là... viển vông. Chúc may mắn!`,
    ])
  }

  return pickRandom([
    `${userAge} tuổi chọn ${level}? Đúng chuẩn bài vở nhỉ, an toàn kinh khủng. Kiểu người qua đường thấy vỏ chuối cũng đi vòng sang làn khác.`,
    `Ồ, ${userAge} tuổi đúng ${level} luôn. Chính xác tuyệt đối. Bạn là kiểu học sinh ngoan, không bao giờ nổi loạn, đúng không?`,
  ])
}

// ─── Question Generation ────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

function rng(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function makeHardExpression(val: number): string {
  const type = rng(1, 7)
  const v = Math.abs(val)
  let expr = ''

  switch (type) {
    case 1:
      expr = `√(${v * v})`
      break
    case 2:
      expr = `∫₀¹ ${v} dx`
      break
    case 3:
      expr = `lim(x→0) (${v} * sin(x)) / x`
      break
    case 4:
      expr = `d/dx (${v}x) tại x=2026`
      break
    case 5:
      expr = v <= 10 ? `log₂(${Math.pow(2, v)})` : `∛(${v * v * v})`
      break
    case 6:
      expr = `det[[${v}, 0], [0, 1]]`
      break
    case 7:
      expr = `∑(i=1..${v}) 1`
      break
  }
  return val < 0 ? `-(${expr})` : expr
}

function generateCloseNumbers(correct: number): { options: string[]; correctIndex: number } {
  const opts = new Set<number>([correct])

  const addOpt = (val: number) => {
    if (correct >= 0 && val < 0) val = correct + (correct - val)
    opts.add(val)
  }

  const tensOffset = (Math.random() > 0.5 ? 10 : -10) * (Math.random() > 0.5 ? 1 : 2)
  addOpt(correct + tensOffset)

  addOpt(correct + (Math.random() > 0.5 ? 1 : -1))
  addOpt(correct + (Math.random() > 0.5 ? 2 : -2))

  let attempts = 0
  while (opts.size < 4 && attempts < 100) {
    const randomOffset = rng(3, 9) * (Math.random() > 0.5 ? 1 : -1)
    addOpt(correct + randomOffset)
    attempts++
  }

  let fill = 1
  while (opts.size < 4) {
    addOpt(correct + fill * 10)
    fill++
  }

  const arr = shuffle(Array.from(opts))
  return { options: arr.map(String), correctIndex: arr.indexOf(correct) }
}

function createNumericQ(text: string, correct: number): Question {
  const { options, correctIndex } = generateCloseNumbers(correct)
  return { text, options, correctIndex }
}

function createCustomQ(text: string, correctAns: string, wrongAns: string[]): Question {
  const opts = [correctAns, ...shuffle(wrongAns).slice(0, 3)]
  const finalOpts = shuffle(opts)
  return { text, options: finalOpts, correctIndex: finalOpts.indexOf(correctAns) }
}

// Lớp 1-3
function genTier1(): Question {
  const isWordProblem = Math.random() > 0.5
  if (isWordProblem) {
    const a = rng(5, 15),
      b = rng(2, a - 1)
    return createNumericQ(
      `Tranh nhau kẹo, bé A cướp được ${a} viên, bị bé B giật mất ${b} viên. Hỏi bé A còn mấy viên?`,
      a - b,
    )
  } else {
    const a = rng(1, 15),
      b = rng(1, 15)
    return Math.random() > 0.5
      ? createNumericQ(`${a} + ${b} = ?`, a + b)
      : createNumericQ(`${a + b} − ${b} = ?`, a)
  }
}

// Lớp 4-6
function genTier2(): Question {
  const isWordProblem = Math.random() > 0.5
  if (isWordProblem) {
    const a = rng(3, 9),
      b = rng(3, 9)
    return createNumericQ(
      `Một đàn vịt chia làm ${a} nhóm, mỗi nhóm có ${b} con đi lạc. Hỏi có tổng cộng bao nhiêu con vịt đi lạc?`,
      a * b,
    )
  } else {
    const a = rng(2, 9),
      b = rng(2, 9)
    return Math.random() > 0.5
      ? createNumericQ(`${a} × ${b} = ?`, a * b)
      : createNumericQ(`${a * b} ÷ ${a} = ?`, b)
  }
}

// Lớp 7-9
function genTier3(): Question {
  const isWordProblem = Math.random() > 0.5
  if (isWordProblem) {
    const a = rng(15, 30),
      b = rng(2, 5),
      c = rng(10, 20)
    return createNumericQ(
      `Mua ${b} cốc trà sữa giá ${a}k/cốc, bị thu thêm tiền phạt đỗ xe ${c}k. Tổng thiệt hại là bao nhiêu k?`,
      a * b + c,
    )
  } else {
    const a = rng(2, 9),
      b = rng(2, 9),
      c = rng(1, 20)
    return Math.random() > 0.5
      ? createNumericQ(`${a} × ${b} + ${c} = ?`, a * b + c)
      : createNumericQ(`(${a + b}) × ${rng(2, 5)} = ?`, (a + b) * rng(2, 5))
  }
}

// Lớp 10-12
function genTier4(): Question {
  const isWordProblem = Math.random() > 0.5
  if (isWordProblem) {
    const a = rng(10, 20),
      x = rng(5, 15),
      b = rng(10, 30)
    const c = a * x + b
    return createNumericQ(
      `Taxi tính tiền ${a}k/km, phí mở cửa ${b}k. Bạn bị thu tổng cộng ${c}k. Hỏi bạn đã đi bao nhiêu km?`,
      x,
    )
  } else {
    const a = rng(2, 9),
      x = rng(1, 12),
      b = rng(1, 20)
    return createNumericQ(`Tìm x: ${a}x + ${b} = ${a * x + b}`, x)
  }
}

// Đại Học+
function genTier5(): Question {
  const isWordProblem = Math.random() > 0.5
  if (isWordProblem) {
    const n = rng(3, 5),
      t = rng(2, 4)
    const ans = n * (n - 1) * Math.pow(t, n - 2)
    return createCustomQ(
      `Vị trí 1 chiếc lá rơi thỏa mãn s(t) = t^${n}. Hỏi gia tốc của chiếc lá tại t = ${t} là bao nhiêu?`,
      String(ans),
      [String(ans + 2), String(ans * 2), String(ans - 4), String(ans + 10)],
    )
  } else {
    const type = rng(1, 2)
    if (type === 1) {
      const n = rng(2, 6)
      return createCustomQ(`d/dx (x^${n}) = ?`, `${n}x^${n - 1}`, [
        `${n - 1}x^${n}`,
        `${n}x^${n}`,
        `x^${n - 1}`,
      ])
    } else {
      const x1 = rng(1, 5),
        x2 = rng(2, 6)
      return createCustomQ(`Nghiệm của: x² - ${x1 + x2}x + ${x1 * x2} = 0`, `x=${x1}, x=${x2}`, [
        `x=${x1}, x=-${x2}`,
        `x=-${x1}, x=${x2}`,
        `Vô nghiệm`,
      ])
    }
  }
}

function genFunny(): Question {
  const funnies = [
    {
      q: 'Từ Việt Trì đến trường là 5km. Lan đi học muộn nên đạp xe vắt chân lên cổ mất đúng 18 giây. Tính theo công thức vật lý ($v=s/t$), vận tốc xe đạp của Lan là bao nhiêu?',
      a: '1000 km/h',
      w: ['360 km/h', '277 km/h', '500 km/h', '2000 km/h'],
    },
    {
      q: 'Code child theme "tuancute" có 100 dòng. Cứ gõ 10 dòng đẻ ra 3 bug. Để sửa 1 bug gõ bù 5 dòng. Sau khi gõ 10 dòng và fix hết 3 bug đó, file có bao nhiêu dòng?',
      a: '125 dòng',
      w: ['115 dòng', '130 dòng', '110 dòng', '140 dòng'],
    },
    {
      q: 'Lan 10 tuổi, mẹ 100 tuổi. Nếu mỗi năm cả 2 tăng 1 tuổi, tính bằng phương trình đại số thì đúng bao nhiêu năm nữa tuổi mẹ sẽ gấp đôi tuổi Lan?',
      a: '80 năm',
      w: ['90 năm', '45 năm', '50 năm', '100 năm'],
    },
    {
      q: 'Render video FFmpeg báo còn 10 phút. Cứ 1 phút thực tế trôi qua, máy lag nên cộng thêm 2 phút. Sau đúng 5 phút đồng hồ, app hiển thị còn bao nhiêu phút?',
      a: '15 phút',
      w: ['20 phút', '5 phút', '0 phút', '10 phút'],
    },
    {
      q: 'Nam ăn 3 bát cơm mất 15 phút. Hôm sau nhai tốc độ x2 (thời gian ăn 1 bát giảm một nửa). Tính chính xác thì Nam ăn 6 bát cơm mất bao nhiêu phút?',
      a: '15 phút',
      w: ['30 phút', '7.5 phút', '20 phút', '10 phút'],
    },
  ]
  const f = funnies[rng(0, funnies.length - 1)]!
  return createCustomQ(f.q, f.a, f.w)
}

function generateQuestions(level: string): Question[] {
  const actualLevel =
    level === 'Ngẫu Nhiên' ? levels[Math.floor(Math.random() * (levels.length - 2))]! : level

  const qs: Question[] = []
  const usedTexts = new Set<string>()

  if (actualLevel === 'Vi Thần') {
    while (qs.length < 20) {
      const type = rng(1, 9)
      let baseText = ''
      let correctNum = 0

      switch (type) {
        case 1: // Hóa học
          const m = rng(2, 5) * 18
          baseText = `Hòa tan ${m}g nước (H2O, M=18). Hỏi số mol nước là bao nhiêu?`
          correctNum = m / 18
          break
        case 2: // Sinh học
          baseText = `Ruồi giấm có 2n = 8. Một tế bào ở kì sau nguyên phân có bao nhiêu NST đơn?`
          correctNum = 16
          break
        case 3: // Lịch sử
          baseText = `(Năm giải phóng miền Nam - Năm Cách mạng tháng Tám) chia cho 3 bằng mấy?`
          correctNum = (1975 - 1945) / 3
          break
        case 4: // Triết học
          baseText = `Số quy luật cơ bản của phép biện chứng duy vật (Mác-Lênin) nhân với số nguyên tố chẵn duy nhất?`
          correctNum = 3 * 2
          break
        case 5: // Lập trình
          baseText = `Trong JS: parseInt("11", 2) + [1, 2, 3].length bằng bao nhiêu?`
          correctNum = 3 + 3
          break
        case 6: // Tích phân
          const aInt = rng(2, 5)
          baseText = `Giá trị của ∫₀¹ ${aInt}x dx nhân với 2 bằng bao nhiêu?`
          correctNum = aInt
          break
        case 7: // Ma trận
          const a = rng(1, 5),
            b = rng(1, 5),
            c = rng(1, 3),
            d = rng(1, 5)
          baseText = `Định thức của ma trận vuông [[${a}, ${b}], [${c}, ${d}]] bằng bao nhiêu?`
          correctNum = a * d - b * c
          break
        case 8: // Đạo hàm
          const nDeriv = rng(2, 4)
          baseText = `Đạo hàm f'(1) của hàm số f(x) = x^${nDeriv} + 5x là?`
          correctNum = nDeriv + 5
          break
        case 9: // Cơ bản
          const aBasic = rng(10, 30),
            bBasic = rng(10, 30)
          baseText = `${aBasic} + ${bBasic} = ?`
          correctNum = aBasic + bBasic
          break
      }

      const { options: numericOpts, correctIndex } = generateCloseNumbers(correctNum)
      const obfuscatedOpts = numericOpts.map((valStr) => makeHardExpression(Number(valStr)))

      const q: Question = { text: baseText, options: obfuscatedOpts, correctIndex }
      if (!usedTexts.has(q.text)) {
        usedTexts.add(q.text)
        qs.push(q)
      }
    }
    return qs
  }

  const idx = levels.indexOf(actualLevel)
  let baseTier = 1
  if (idx >= 12) baseTier = 5
  else if (idx >= 9) baseTier = 4
  else if (idx >= 6) baseTier = 3
  else if (idx >= 3) baseTier = 2

  function getQuestionForTier(tier: number): Question {
    if (Math.random() < 0.15) return genFunny()
    switch (Math.min(tier, 5)) {
      case 1:
        return genTier1()
      case 2:
        return genTier2()
      case 3:
        return genTier3()
      case 4:
        return genTier4()
      case 5:
      default:
        return genTier5()
    }
  }

  while (qs.length < 10) {
    const qNum = qs.length + 1
    let targetTier = baseTier

    if (qNum >= 7 && qNum <= 9) targetTier = baseTier + 1
    if (qNum === 10) targetTier = baseTier + 2

    let q = getQuestionForTier(targetTier)
    if (qNum === 10 && baseTier >= 3 && q.options.length < 3) {
      q = genTier5()
    }

    if (!usedTexts.has(q.text)) {
      usedTexts.add(q.text)
      qs.push(q)
    }
  }

  return qs
}

// ─── Game State ─────────────────────────────────────────────
const questions = ref<Question[]>([])

const currentQuestion = computed(() => questions.value[currentQ.value] ?? null)
const isDarkMode = computed(
  () => currentQ.value >= questions.value.length / 2 && screen.value === 'game',
)
const isBossMode = computed(
  () => currentQ.value === questions.value.length - 1 && screen.value === 'game',
)
const totalQuestions = computed(() => questions.value.length)

const timeLimit = computed(() => {
  if (selectedLevel.value === 'Vi Thần') return 0 // Vô hạn thời gian cho Vi Thần
  if (currentQ.value >= 9) return 5
  if (currentQ.value >= 5) return 10
  return 0
})
const progressPercent = computed(() => (currentQ.value / Math.max(totalQuestions.value, 1)) * 100)

// ─── Screen Transitions ─────────────────────────────────────
function goToIntro() {
  screen.value = 'intro'
  age.value = null
  selectedLevel.value = ''
  currentQ.value = 0
  score.value = 0
  shakeScreen.value = false
  selectedOption.value = null
  answeredWrong.value = false
  stopTimer()
}

function startGame() {
  if (!age.value || age.value < 1 || age.value > 120) return
  screen.value = 'level'
}

function selectLevel(level: string) {
  selectedLevel.value = level
  roastMsg.value = generateRoast(age.value ?? 18, level)
  screen.value = 'roast'
}

function startPlaying() {
  questions.value = generateQuestions(selectedLevel.value)
  currentQ.value = 0
  score.value = 0
  selectedOption.value = null
  answeredWrong.value = false
  screen.value = 'game'
  startTimerIfNeeded()
}

// ─── Timer ──────────────────────────────────────────────────
function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

function startTimerIfNeeded() {
  stopTimer()
  const limit = timeLimit.value
  if (limit <= 0) {
    timer.value = 0
    return
  }
  timer.value = limit
  timerInterval = setInterval(() => {
    timer.value--
    if (timer.value <= 0) {
      stopTimer()
      triggerGameOver()
    }
  }, 1000)
}

watch(currentQ, () => {
  if (screen.value === 'game') startTimerIfNeeded()
})

// ─── Answer Logic ───────────────────────────────────────────
function selectAnswer(idx: number) {
  if (selectedOption.value !== null) return
  selectedOption.value = idx
  const q = currentQuestion.value
  if (!q) return

  if (idx === q.correctIndex) {
    score.value++
    stopTimer()
    setTimeout(() => {
      if (currentQ.value >= totalQuestions.value - 1) {
        screen.value = 'win'
        return
      }
      currentQ.value++
      selectedOption.value = null
      answeredWrong.value = false
    }, 500)
  } else {
    answeredWrong.value = true
    stopTimer()
    setTimeout(() => triggerGameOver(), 700)
  }
}

function triggerGameOver() {
  stopTimer()
  const userAge = age.value ?? 0
  const q = currentQ.value + 1
  const lvl = selectedLevel.value
  const tq = totalQuestions.value

  gameOverMsg.value = pickRandom([
    `Nhục nhã! Đã ${userAge} tuổi đầu rồi mà không qua nổi câu ${q} của cái game ${lvl}. Đề nghị xé bằng tốt nghiệp!`,
    `${userAge} tuổi, ${q - 1}/${tq} câu. Thành tích này mà đem khoe thì cả họ mất mặt luôn á. Về hỏi lại thầy cô có dạy bạn không?`,
    `Game Over! ${userAge} tuổi mà trượt ở câu ${q}. Tổ tiên cũng đang lắc đầu ngán ngẩm.`,
    `Thua rồi! Bạn nên chuyển sang ngành không cần tính toán. À khoan, thở thôi cũng cần tính oxy. RIP.`,
  ])
  shakeScreen.value = true
  screen.value = 'gameover'
  setTimeout(() => {
    shakeScreen.value = false
  }, 800)
}

// ─── Option Styling ─────────────────────────────────────────
function optionClass(idx: number): string {
  const q = currentQuestion.value
  if (!q) return ''

  const normalBase = 'border border-border-default bg-bg-surface text-text-primary'
  const darkBase = 'border border-red-900/50 bg-red-950/30 text-red-100'
  const base = isDarkMode.value ? darkBase : normalBase

  if (selectedOption.value === null) {
    return isDarkMode.value
      ? `${base} hover:border-red-500 hover:bg-red-900/40 cursor-pointer`
      : `${base} hover:border-accent-coral hover:bg-bg-elevated cursor-pointer`
  }

  if (idx === q.correctIndex) {
    return 'border border-emerald-500 bg-emerald-500/20 text-emerald-300'
  }
  if (idx === selectedOption.value && idx !== q.correctIndex) {
    return 'border border-red-500 bg-red-500/20 text-red-300 animate-wrong'
  }
  return `${base} opacity-40`
}
</script>

<template>
  <div
    class="min-h-screen font-body transition-all duration-700 relative"
    :class="[
      screen === 'gameover' ? 'bg-red-950' : isDarkMode ? 'bg-gray-950' : 'bg-bg-deep',
      shakeScreen ? 'animate-shake' : '',
    ]"
  >
    <div
      v-if="screen === 'intro'"
      class="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6"
    >
      <div class="w-full max-w-lg animate-fade-up">
        <div class="text-center mb-10">
          <div
            class="inline-block bg-accent-coral text-bg-deep font-display font-bold text-xs tracking-widest px-3 py-1.5 rotate-2 mb-5"
          >
            MATH CHALLENGE
          </div>
          <h1 class="font-display text-5xl sm:text-6xl font-bold text-text-primary tracking-tight">
            Giải Toán<br /><span class="text-accent-coral">Vui</span>
          </h1>
          <p class="text-text-secondary mt-4 text-sm sm:text-base max-w-sm mx-auto">
            Kiểm tra trình độ toán học từ Lớp 1 đến Vi Thần. Bạn sẽ vượt qua được bao nhiêu câu?
          </p>
        </div>

        <div
          class="border border-border-default bg-bg-surface p-6 sm:p-8 animate-fade-up animate-delay-2"
        >
          <div class="flex items-center gap-3 mb-5">
            <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
            <span class="font-display text-sm font-semibold text-text-primary tracking-wide"
              >Thông tin người chơi</span
            >
          </div>

          <label class="block mb-2 text-text-secondary text-sm"> Tuổi của bạn </label>
          <input
            v-model.number="age"
            type="number"
            min="1"
            max="120"
            placeholder="VD: 25"
            class="w-full bg-bg-deep border border-border-default px-4 py-3 text-text-primary font-body text-base outline-none transition-colors focus:border-accent-coral placeholder:text-text-dim"
            @keyup.enter="startGame"
          />

          <button
            :disabled="!age || age < 1 || age > 120"
            class="mt-6 w-full border border-accent-coral bg-accent-coral/10 px-5 py-3 font-display text-sm font-semibold tracking-wider text-accent-coral transition-all duration-300 hover:bg-accent-coral hover:text-bg-deep disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-accent-coral/10 disabled:hover:text-accent-coral"
            @click="startGame"
          >
            TIẾP TỤC →
          </button>
        </div>

        <div class="mt-8 text-center animate-fade-up animate-delay-3">
          <RouterLink
            to="/"
            class="text-text-secondary text-sm link-underline inline-flex items-center gap-1.5"
          >
            &larr; Về trang chủ
          </RouterLink>
        </div>
      </div>
    </div>

    <div
      v-if="screen === 'level'"
      class="min-h-screen flex flex-col items-center px-4 sm:px-6 py-12"
    >
      <div class="w-full max-w-2xl">
        <div class="text-center mb-10 animate-fade-up">
          <h2
            class="font-display text-2xl sm:text-3xl font-semibold text-text-primary flex items-center justify-center gap-3"
          >
            <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
            Chọn cấp độ
          </h2>
          <p class="text-text-secondary text-sm mt-3">
            Mỗi cấp có 10 câu hỏi. (Riêng chế độ Vi Thần có 20 câu hỏi thập cẩm).
          </p>
        </div>

        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 animate-fade-up animate-delay-2">
          <button
            v-for="lvl in levels"
            :key="lvl"
            class="border border-border-default bg-bg-surface p-4 font-display text-sm font-semibold text-text-primary transition-all duration-300 text-left hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5 flex items-center gap-3"
            :class="[
              lvl === 'Ngẫu Nhiên'
                ? 'sm:col-span-2 lg:col-span-3 justify-center border-accent-amber/30 hover:border-accent-amber hover:shadow-accent-amber/5'
                : '',
              lvl === 'Vi Thần'
                ? 'border-purple-500/50 text-purple-300 hover:border-purple-400 hover:shadow-purple-500/10'
                : '',
            ]"
            @click="selectLevel(lvl)"
          >
            <span class="text-lg">{{ levelIcon(lvl) }}</span>
            <span
              :class="
                lvl === 'Ngẫu Nhiên'
                  ? 'text-accent-amber'
                  : lvl === 'Vi Thần'
                    ? 'text-purple-400 font-bold tracking-widest'
                    : ''
              "
              >{{ lvl }}</span
            >
          </button>
        </div>

        <div class="mt-10 text-center animate-fade-up animate-delay-3">
          <button
            class="text-text-dim text-xs font-display tracking-wide hover:text-text-secondary transition-colors"
            @click="goToIntro"
          >
            &larr; Quay lại
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="screen === 'roast'"
      class="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6"
    >
      <div class="w-full max-w-lg animate-fade-up">
        <div class="border border-accent-coral bg-bg-surface p-6 sm:p-8 relative">
          <span
            class="absolute top-3 right-4 font-display text-6xl font-bold text-accent-coral/5 select-none pointer-events-none"
          >
            !?
          </span>

          <div class="flex items-center gap-3 mb-4">
            <span class="text-accent-amber font-display text-sm tracking-widest">//</span>
            <span class="font-display text-sm font-semibold text-text-primary tracking-wide"
              >Nhận xét</span
            >
          </div>

          <p class="text-text-primary leading-relaxed text-sm sm:text-base">
            {{ roastMsg }}
          </p>

          <div class="mt-8 flex flex-col sm:flex-row gap-3">
            <button
              class="flex-1 border border-border-default bg-bg-elevated px-4 py-3 font-display text-xs font-semibold tracking-wide text-text-secondary transition-all duration-300 hover:border-accent-sky hover:text-text-primary"
              @click="screen = 'level'"
            >
              Nhục quá, chọn lại
            </button>
            <button
              class="flex-1 border border-accent-coral bg-accent-coral/10 px-4 py-3 font-display text-xs font-semibold tracking-wide text-accent-coral transition-all duration-300 hover:bg-accent-coral hover:text-bg-deep"
              @click="startPlaying"
            >
              Sợ quái gì, chơi tiếp
            </button>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="screen === 'game' && currentQuestion"
      class="min-h-screen flex flex-col px-4 sm:px-6 py-8 transition-all duration-700"
    >
      <div class="w-full max-w-xl mx-auto flex flex-col flex-1">
        <div class="mb-6">
          <div class="flex items-center justify-between mb-3">
            <span
              class="font-display text-xs tracking-widest"
              :class="isDarkMode ? 'text-red-400' : 'text-accent-amber'"
            >
              // Câu {{ currentQ + 1 }} / {{ totalQuestions }}
            </span>

            <div class="flex items-center gap-3">
              <span
                class="font-display text-xs tracking-wide"
                :class="isDarkMode ? 'text-red-400/50' : 'text-text-dim'"
              >
                {{ selectedLevel }}
              </span>
              <span
                v-if="timeLimit > 0"
                class="font-display text-sm font-bold tabular-nums"
                :class="
                  timer <= 3
                    ? 'text-red-400 animate-pulse'
                    : isDarkMode
                      ? 'text-red-300'
                      : 'text-accent-coral'
                "
              >
                {{ timer }}s
              </span>
              <span
                v-else-if="selectedLevel === 'Vi Thần'"
                class="text-xs font-display text-purple-400 animate-pulse"
              >
                ∞ Thời gian
              </span>
            </div>
          </div>

          <div class="h-0.5 w-full" :class="isDarkMode ? 'bg-red-950' : 'bg-border-default'">
            <div
              class="h-full transition-all duration-500 ease-out"
              :class="isDarkMode ? 'bg-red-500' : 'bg-accent-coral'"
              :style="{ width: `${progressPercent}%` }"
            />
          </div>
        </div>

        <div
          class="p-6 sm:p-8 mb-8 transition-all duration-500 relative overflow-hidden"
          :class="[
            isBossMode
              ? 'border-2 border-red-500 bg-red-950/60'
              : selectedLevel === 'Vi Thần'
                ? 'border border-purple-500/50 bg-purple-900/10 shadow-[0_0_30px_rgba(168,85,247,0.1)]'
                : isDarkMode
                  ? 'border border-red-900/50 bg-gray-900/80'
                  : 'border border-border-default bg-bg-surface',
          ]"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1">
              <p
                v-if="isBossMode"
                class="text-[10px] font-display tracking-widest text-red-400 mb-3 uppercase"
              >
                Câu hỏi cuối cùng
              </p>
              <p
                v-else-if="selectedLevel === 'Vi Thần'"
                class="text-[10px] font-display tracking-widest text-purple-400 mb-3"
              >
                Cảnh báo: Tính toán cẩn thận đáp án
              </p>
              <p
                v-else-if="isDarkMode"
                class="text-[10px] font-display tracking-widest text-red-400/60 mb-3"
              >
                Thời gian giới hạn
              </p>

              <h3
                class="font-display text-lg sm:text-xl font-bold leading-relaxed"
                :class="isDarkMode ? 'text-red-100' : 'text-text-primary'"
              >
                {{ currentQuestion.text }}
              </h3>
            </div>

            <span
              class="font-display text-5xl font-bold select-none pointer-events-none shrink-0"
              :class="
                selectedLevel === 'Vi Thần'
                  ? 'text-purple-500/10'
                  : isDarkMode
                    ? 'text-red-500/5'
                    : 'text-accent-amber/5'
              "
            >
              {{ String(currentQ + 1).padStart(2, '0') }}
            </span>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          <button
            v-for="(opt, idx) in currentQuestion.options"
            :key="idx"
            :class="optionClass(idx)"
            class="p-4 font-display text-base font-semibold text-center transition-all duration-200"
            :disabled="selectedOption !== null"
            @click="selectAnswer(idx)"
          >
            <span class="mr-2 text-xs font-normal opacity-40">{{ ['A', 'B', 'C', 'D'][idx] }}.</span
            >{{ opt }}
          </button>
        </div>

        <div class="mt-auto pt-4 text-center">
          <span
            class="font-display text-xs tracking-widest"
            :class="isDarkMode ? 'text-red-400/40' : 'text-text-dim'"
          >
            Điểm: {{ score }} / {{ totalQuestions }}
          </span>
        </div>
      </div>
    </div>

    <div
      v-if="screen === 'gameover'"
      class="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6"
    >
      <div class="w-full max-w-lg text-center animate-fade-up">
        <div class="text-6xl sm:text-7xl mb-6 animate-bounce-slow select-none">💀</div>

        <h2 class="font-display text-3xl sm:text-4xl font-bold text-red-400 mb-2">GAME OVER</h2>

        <div class="border border-red-800 bg-red-950/50 p-6 sm:p-8 mt-6 mb-8">
          <p class="text-red-200 leading-relaxed text-sm sm:text-base">
            {{ gameOverMsg }}
          </p>

          <div
            class="mt-5 pt-4 border-t border-red-800/40 flex items-center justify-center gap-4 text-xs font-display tracking-wide text-red-400/50"
          >
            <span>{{ age }} tuổi</span>
            <span class="w-1 h-1 rounded-full bg-red-400/30" />
            <span>{{ selectedLevel }}</span>
            <span class="w-1 h-1 rounded-full bg-red-400/30" />
            <span>{{ score }}/{{ totalQuestions }}</span>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            class="border border-red-700 bg-red-900/40 px-6 py-3 font-display text-sm font-semibold tracking-wide text-red-300 transition-all duration-300 hover:bg-red-700 hover:text-white"
            @click="startPlaying"
          >
            Chơi lại
          </button>
          <button
            class="border border-red-800/50 px-6 py-3 font-display text-xs tracking-wide text-red-400/50 transition-all duration-300 hover:border-red-600 hover:text-red-300"
            @click="goToIntro"
          >
            Về đầu
          </button>
        </div>

        <div class="mt-8">
          <RouterLink
            to="/"
            class="text-red-400/30 text-xs font-display tracking-wide hover:text-red-300 transition-colors"
          >
            &larr; Về trang chủ
          </RouterLink>
        </div>
      </div>
    </div>

    <div
      v-if="screen === 'win'"
      class="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 bg-bg-deep"
    >
      <div class="w-full max-w-lg text-center animate-fade-up">
        <div class="text-6xl sm:text-7xl mb-6 select-none">🏆</div>

        <h2 class="font-display text-3xl sm:text-4xl font-bold text-accent-amber mb-2">
          Hoàn thành!
        </h2>

        <div class="border border-accent-amber bg-bg-surface p-6 sm:p-8 mt-6 mb-8">
          <p
            v-if="selectedLevel === 'Vi Thần'"
            class="text-purple-400 leading-relaxed text-sm sm:text-base font-bold"
          >
            Tôn ngộ không cũng phải gọi bạn bằng sư phụ. Vượt qua 20/20 câu Vi Thần. Kính nể!!
          </p>
          <p v-else class="text-text-primary leading-relaxed text-sm sm:text-base">
            {{ age }} tuổi, vượt qua {{ totalQuestions }}/{{ totalQuestions }} câu
            {{ selectedLevel }} — kể cả câu trùm cuối quái thai. Hoặc bạn là thiên tài, hoặc bạn xài
            ChatGPT. Dù sao cũng xin chúc mừng.
          </p>

          <div
            class="mt-5 pt-4 border-t border-accent-amber/20 flex items-center justify-center gap-4 text-xs font-display tracking-wide text-accent-amber/60"
          >
            <span>{{ age }} tuổi</span>
            <span class="w-1 h-1 rounded-full bg-accent-amber/30" />
            <span>{{ selectedLevel }}</span>
            <span class="w-1 h-1 rounded-full bg-accent-amber/30" />
            <span>{{ score }}/{{ totalQuestions }}</span>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            class="border border-accent-amber bg-accent-amber/10 px-6 py-3 font-display text-sm font-semibold tracking-wide text-accent-amber transition-all duration-300 hover:bg-accent-amber hover:text-bg-deep"
            @click="goToIntro"
          >
            Chơi lại
          </button>
          <RouterLink
            to="/"
            class="border border-border-default px-6 py-3 font-display text-sm tracking-wide text-text-secondary transition-all duration-300 hover:border-accent-coral hover:text-text-primary inline-block"
          >
            &larr; Về trang chủ
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  10%,
  30%,
  50%,
  70%,
  90% {
    transform: translateX(-6px);
  }
  20%,
  40%,
  60%,
  80% {
    transform: translateX(6px);
  }
}

@keyframes wrong-flash {
  0% {
    background-color: rgba(239, 68, 68, 0.3);
  }
  50% {
    background-color: rgba(239, 68, 68, 0.1);
  }
  100% {
    background-color: rgba(239, 68, 68, 0.3);
  }
}

@keyframes bounce-slow {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-12px);
  }
}

.animate-shake {
  animation: shake 0.6s ease-in-out;
}

.animate-wrong {
  animation: wrong-flash 0.4s ease-in-out 2;
}

.animate-bounce-slow {
  animation: bounce-slow 2s ease-in-out infinite;
}

input[type='number']::-webkit-outer-spin-button,
input[type='number']::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type='number'] {
  -moz-appearance: textfield;
}
</style>
