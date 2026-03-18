import type { Rule } from './types'
import {
  TINH_THANH,
  MON_AN_VIET,
  IT_WORDS,
  MON_HOC,
  CA_DAO,
  THANH_NGU,
  LINH_VAT,
  DANH_NHAN,
  NAM_LICH_SU,
  SONG_NUI,
  HOA_QUA,
  CON_VAT,
  MAU_SAC,
  NGHE_NGHIEP,
  THE_THAO,
  NHAC_CU,
  DONG_VAT_BIEN,
  LOAI_CHIM,
  TINH_CACH,
  QUAN_HE,
  THOI_TIET,
  NGAY_LE,
  PHUONG_TIEN,
  DO_DUNG,
  NGUYEN_TO_HOA_HOC,
  DON_VI_DO,
  CHUC_DANH,
  TON_GIAO,
  TRIET_HOC,
  FORBIDDEN_WORDS,
} from './data'
import {
  normalize,
  randomFromList,
  shuffleWithSeed,
  getDigitSum,
  getDigits,
  getUniqueDigits,
  countVietnameseChars,
  isPrime,
  nextPrimeGap,
  getCharCodeSum,
  getWordCount,
  countVowels,
  countConsonants,
  containsOneOf,
  getCurrentMonth,
  getCurrentYear,
  getCurrentWeekday,
  getWeekdayVariants,
  getCurrentDate,
  getCurrentHour,
} from './utils'

function makeRule(
  id: number,
  title: string,
  description: string,
  validate: (password: string) => boolean,
  options?: {
    emoji?: string
    hint?: string | ((password: string) => string)
    category?: string
    targetCopy?: string
  },
): Rule {
  return { id, title, description, validate, ...options }
}

const UPPERCASE_VIET_REGEX =
  /[A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/u
const LETTER_OR_DIGIT_NEIGHBOR_REGEX = /([A-Za-zÀ-ỹ]\d|\d[A-Za-zÀ-ỹ])/u
const TWO_CONSECUTIVE_UPPERCASE_REGEX =
  /[A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]{2}/u

export function createRuleSet(seed: number): Rule[] {
  const currentMonth = getCurrentMonth()
  const currentYear = getCurrentYear()
  const currentWeekday = getCurrentWeekday()
  const currentDate = getCurrentDate()
  const currentHour = getCurrentHour()

  // Random selections based on seed
  const city = randomFromList(seed + 3, TINH_THANH)
  const food = randomFromList(seed + 5, MON_AN_VIET)
  const subject = randomFromList(seed + 7, MON_HOC)
  const proverb = randomFromList(seed + 11, CA_DAO)
  const idiom = randomFromList(seed + 13, THANH_NGU)
  const mascot = randomFromList(seed + 17, LINH_VAT)
  const itWord = randomFromList(seed + 19, IT_WORDS)
  const danhNhan = randomFromList(seed + 23, DANH_NHAN)
  const namLichSu = randomFromList(seed + 29, NAM_LICH_SU)
  const songNui = randomFromList(seed + 31, SONG_NUI)
  const hoaQua = randomFromList(seed + 37, HOA_QUA)
  const conVat = randomFromList(seed + 41, CON_VAT)
  const mauSac = randomFromList(seed + 43, MAU_SAC)
  const ngheNghiep = randomFromList(seed + 47, NGHE_NGHIEP)
  const theThao = randomFromList(seed + 53, THE_THAO)
  const nhacCu = randomFromList(seed + 59, NHAC_CU)
  const dongVatBien = randomFromList(seed + 61, DONG_VAT_BIEN)
  const loaiChim = randomFromList(seed + 67, LOAI_CHIM)
  const tinhCach = randomFromList(seed + 71, TINH_CACH)
  const quanHe = randomFromList(seed + 73, QUAN_HE)
  const thoiTiet = randomFromList(seed + 79, THOI_TIET)
  const ngayLe = randomFromList(seed + 83, NGAY_LE)
  const phuongTien = randomFromList(seed + 89, PHUONG_TIEN)
  const doDung = randomFromList(seed + 97, DO_DUNG)
  const nguyenTo = randomFromList(seed + 101, NGUYEN_TO_HOA_HOC)
  const donVi = randomFromList(seed + 103, DON_VI_DO)
  const chucDanh = randomFromList(seed + 107, CHUC_DANH)
  const tonGiao = randomFromList(seed + 109, TON_GIAO)
  const trietHoc = randomFromList(seed + 113, TRIET_HOC)

  // Dynamic targets based on seed
  const targetDigitMultiple = 3 + (seed % 6) // 3-8, ít conflict hơn yêu cầu tổng chính xác
  const targetCharCodeMod = 3 + (seed % 7) // 3-9
  const targetMinLength = 8 + (seed % 8) // 8-15
  const targetWordCount = 3 + (seed % 4) // 3-6
  const targetVowelCount = 4 + (seed % 6) // 4-9
  const targetConsonantCount = 5 + (seed % 7) // 5-11
  const targetDigitCount = 2 + (seed % 4) // 2-5
  const targetPrimeLength = [17, 19, 23, 29, 31][seed % 5]!
  const targetEndsWith = String((seed % 9) + 1) // 1-9
  const targetStartsWith = ['V', 'N', 'H', 'T', 'M', 'S', 'L', 'C'][seed % 8]!
  const targetMathPair = [2 + (seed % 5), 5 + (seed % 8)] as const
  const targetFibonacci = ['1', '2', '3', '5', '8', '13', '21'][seed % 7]!
  const targetSquare = ['4', '9', '16', '25', '36', '49', '64'][seed % 7]!

  // ========== CORE RULES (luôn có, không conflict) ==========
  const coreRules: Rule[] = [
    makeRule(
      1,
      `Mật khẩu phải có ít nhất ${targetMinLength} ký tự`,
      'Cần đủ độ dài để bắt đầu.',
      (p) => p.length >= targetMinLength,
      { emoji: '🔑', category: 'core' },
    ),
    makeRule(
      2,
      'Mật khẩu phải có ít nhất 1 chữ hoa (kể cả tiếng Việt)',
      'Thêm chữ viết hoa.',
      (p) => UPPERCASE_VIET_REGEX.test(p),
      { emoji: '🅰️', category: 'core' },
    ),
    makeRule(
      3,
      `Phải có ít nhất ${targetDigitCount} chữ số`,
      'Bổ sung chữ số.',
      (p) => getDigits(p).length >= targetDigitCount,
      { emoji: '🔢', category: 'core' },
    ),
    makeRule(
      4,
      'Phải có ít nhất 1 ký tự đặc biệt',
      '! @ # $ %...',
      (p) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(p),
      { emoji: '✨', category: 'core' },
    ),
    makeRule(5, 'Phải chứa "Việt Nam"', 'Tự hào dân tộc.', (p) => p.includes('Việt Nam'), {
      emoji: '🇻🇳',
      category: 'viet',
      targetCopy: 'Việt Nam',
    }),
    makeRule(
      6,
      `Tổng các chữ số phải là bội số của ${targetDigitMultiple}`,
      `Cộng tất cả chữ số rồi chia hết cho ${targetDigitMultiple}.`,
      (p) => {
        const sum = getDigitSum(p)
        return sum > 0 && sum % targetDigitMultiple === 0
      },
      {
        emoji: '➕',
        hint: (p) => `Tổng hiện tại: ${getDigitSum(p)}. Cần chia hết cho ${targetDigitMultiple}.`,
        category: 'math',
      },
    ),
    makeRule(
      7,
      `Phải chứa tỉnh/thành: ${city}`,
      'Màn địa lý.',
      (p) => normalize(p).includes(normalize(city)),
      { emoji: '🗺️', category: 'viet', targetCopy: city },
    ),
    makeRule(
      8,
      'Phải có ít nhất 3 ký tự tiếng Việt có dấu',
      'Không dấu chưa đủ Việt.',
      (p) => countVietnameseChars(p) >= 3,
      {
        emoji: '🗣️',
        hint: (p) => `Hiện có ${countVietnameseChars(p)} ký tự có dấu.`,
        category: 'viet',
      },
    ),
    makeRule(9, `Phải chứa emoji ${mascot}`, 'Linh vật ngẫu nhiên.', (p) => p.includes(mascot), {
      emoji: mascot,
      category: 'culture',
      targetCopy: mascot,
    }),
    makeRule(
      10,
      `Phải chứa từ IT "${itWord}"`,
      'Hơi thở dân code.',
      (p) => normalize(p).includes(normalize(itWord)),
      { emoji: '💻', category: 'it', targetCopy: itWord },
    ),
    makeRule(
      11,
      `Phải chứa tháng hiện tại (${currentMonth})`,
      'Nhìn lịch mà nhập.',
      (p) => p.includes(String(currentMonth)),
      { emoji: '📅', category: 'time', targetCopy: String(currentMonth) },
    ),
    makeRule(12, 'Phải chứa "J2TEAM"', 'Không thể thiếu.', (p) => p.includes('J2TEAM'), {
      emoji: '👥',
      category: 'it',
      targetCopy: 'J2TEAM',
    }),
    makeRule(
      13,
      `Phải chứa môn học "${subject}"`,
      'Ngẫu nhiên từ 14 môn.',
      (p) => normalize(p).includes(normalize(subject)),
      { emoji: '📚', category: 'subject', targetCopy: subject },
    ),
    makeRule(
      14,
      `Phải nhắc tới hôm nay: ${currentWeekday}`,
      'Viết đầy đủ hoặc tắt.',
      (p) => getWeekdayVariants(currentWeekday).some((v) => normalize(p).includes(normalize(v))),
      { emoji: '📆', hint: getWeekdayVariants(currentWeekday).join(' | '), category: 'time' },
    ),
    makeRule(
      15,
      `Phải chứa món ăn "${food}"`,
      'Ẩm thực Việt.',
      (p) => normalize(p).includes(normalize(food)),
      { emoji: '🍜', category: 'viet', targetCopy: food },
    ),
    makeRule(
      16,
      `Độ dài phải là số nguyên tố HOẶC đúng ${targetPrimeLength}`,
      'Sắp xếp lại chuỗi.',
      (p) => isPrime(p.length) || p.length === targetPrimeLength,
      { emoji: '🔬', hint: (p) => nextPrimeGap(p.length), category: 'math' },
    ),
    makeRule(
      17,
      `Phải chứa năm ${currentYear}`,
      'Ghi nhớ thời gian.',
      (p) => p.includes(String(currentYear)),
      { emoji: '🕰️', category: 'time', targetCopy: String(currentYear) },
    ),
    makeRule(
      18,
      'Phải chứa "xin chào" hoặc "hello"',
      'Lịch sự cơ bản.',
      (p) => {
        const n = normalize(p)
        return n.includes('xin chao') || n.includes('hello')
      },
      { emoji: '👋', category: 'language', targetCopy: 'xin chào' },
    ),
    makeRule(
      19,
      'Không chứa từ quá phổ biến',
      'Cấm password, 123456...',
      (p) => FORBIDDEN_WORDS.every((w) => !normalize(p).includes(normalize(w))),
      { emoji: '🙅', category: 'core' },
    ),
    makeRule(
      20,
      `Phải kết thúc bằng "${targetEndsWith}"`,
      'Chiếc neo logic.',
      (p) => p.endsWith(targetEndsWith),
      { emoji: '🏁', category: 'logic', targetCopy: targetEndsWith },
    ),
  ]

  const mediumRules: Rule[] = [
    makeRule(
      21,
      'Phải có ít nhất 2 dấu cách',
      'Giống cụm từ thực.',
      (p) => (p.match(/\s/g)?.length ?? 0) >= 2,
      { emoji: '␠', category: 'language' },
    ),
    makeRule(
      22,
      `Phải có ít nhất ${targetWordCount} từ`,
      'Đếm theo khoảng trắng.',
      (p) => getWordCount(p) >= targetWordCount,
      { emoji: '📝', hint: (p) => `Hiện có ${getWordCount(p)} từ.`, category: 'language' },
    ),
    makeRule(
      23,
      `Phải bắt đầu bằng "${targetStartsWith}"`,
      'Mở đầu có quy luật.',
      (p) => p.startsWith(targetStartsWith),
      { emoji: '🚪', category: 'logic', targetCopy: targetStartsWith },
    ),
    makeRule(
      24,
      'Phải có ít nhất 2 chữ số khác nhau',
      'Không spam cùng số.',
      (p) => getUniqueDigits(p).length >= 2,
      { emoji: '🎲', category: 'math' },
    ),
    makeRule(
      25,
      `Phải có ít nhất ${targetVowelCount} nguyên âm`,
      'Cân bằng chữ.',
      (p) => countVowels(p) >= targetVowelCount,
      { emoji: '🔤', hint: (p) => `Hiện có ${countVowels(p)} nguyên âm.`, category: 'language' },
    ),
    makeRule(
      26,
      `Phải có ít nhất ${targetConsonantCount} phụ âm`,
      'Không toàn nguyên âm.',
      (p) => countConsonants(p) >= targetConsonantCount,
      { emoji: '🧩', hint: (p) => `Hiện có ${countConsonants(p)} phụ âm.`, category: 'language' },
    ),
    makeRule(
      27,
      `Tổng mã Unicode chia hết cho ${targetCharCodeMod}`,
      'Tính hoặc thử chiến lược.',
      (p) => p.length > 0 && getCharCodeSum(p) % targetCharCodeMod === 0,
      { emoji: '🧮', hint: (p) => `Tổng mã: ${getCharCodeSum(p)}.`, category: 'math' },
    ),
    makeRule(
      28,
      `Phải chứa câu ca dao: "${proverb}"`,
      'Văn học dân gian.',
      (p) => normalize(p).includes(normalize(proverb)),
      { emoji: '🌾', category: 'folk', targetCopy: proverb },
    ),
    makeRule(
      29,
      `Phải chứa thành ngữ: "${idiom}"`,
      'Biết tiếng Việt.',
      (p) => normalize(p).includes(normalize(idiom)),
      { emoji: '📖', category: 'folk', targetCopy: idiom },
    ),

    // Math Operations
    makeRule(30, 'Phải có phép cộng (vd: 2+3)', 'Toán học cơ bản.', (p) => /\d+\+\d+/.test(p), {
      emoji: '➕',
      category: 'math',
    }),
    makeRule(31, 'Phải có phép trừ (vd: 9-4)', 'Phép trừ.', (p) => /\d+-\d+/.test(p), {
      emoji: '➖',
      category: 'math',
    }),
    makeRule(
      32,
      'Phải có phép nhân (vd: 2x3)',
      'Phép nhân.',
      (p) => /\d+\s*([x*])\s*\d+/i.test(p),
      { emoji: '✖️', category: 'math' },
    ),
    makeRule(33, 'Phải có phép chia (vd: 8/2)', 'Phép chia.', (p) => /\d+\/\d+/.test(p), {
      emoji: '➗',
      category: 'math',
    }),
    makeRule(
      34,
      `Phải chứa cả hai số ${targetMathPair[0]} và ${targetMathPair[1]}`,
      'Ghi nhớ số mục tiêu.',
      (p) => p.includes(String(targetMathPair[0])) && p.includes(String(targetMathPair[1])),
      { emoji: '🎯', category: 'math', targetCopy: `${targetMathPair[0]} ${targetMathPair[1]}` },
    ),
    makeRule(
      35,
      'Phải có số chẵn và số lẻ',
      'Cân bằng âm dương.',
      (p) => {
        const d = getDigits(p)
        return d.some((n) => n % 2 === 0) && d.some((n) => n % 2 === 1)
      },
      { emoji: '⚖️', category: 'math' },
    ),
    makeRule(
      36,
      'Phải có ít nhất 3 số khác nhau',
      'Đa dạng số.',
      (p) => getUniqueDigits(p).length >= 3,
      { emoji: '🧠', category: 'math' },
    ),
    makeRule(
      37,
      `Phải chứa số Fibonacci ${targetFibonacci}`,
      'Dãy Fibonacci.',
      (p) => p.includes(targetFibonacci),
      { emoji: '🌀', category: 'math', targetCopy: targetFibonacci },
    ),
    makeRule(
      38,
      `Phải chứa số chính phương ${targetSquare}`,
      'Số chính phương.',
      (p) => p.includes(targetSquare),
      { emoji: '🟦', category: 'math', targetCopy: targetSquare },
    ),
    makeRule(
      39,
      'Phải có số nguyên tố (2,3,5,7,11...)',
      'Số nguyên tố.',
      (p) => ['2', '3', '5', '7', '11', '13'].some((n) => p.includes(n)),
      { emoji: '🔺', category: 'math' },
    ),
    makeRule(
      40,
      'Phải có số > 20',
      'Số lớn hơn 20.',
      (p) => /\b(2[1-9]|[3-9]\d|\d{3,})\b/.test(p),
      { emoji: '📈', category: 'math' },
    ),
    makeRule(41, 'Phải có cặp ngoặc đơn (abc)', 'Ngoặc đơn.', (p) => /\([^()]+\)/.test(p), {
      emoji: '🫧',
      category: 'logic',
    }),
    makeRule(42, 'Phải có dấu gạch nối -', 'Gạch nối.', (p) => p.includes('-'), {
      emoji: '➖',
      category: 'logic',
    }),
    makeRule(43, 'Phải có dấu phẩy hoặc chấm phẩy', 'Tiết tấu câu.', (p) => /[,;]/.test(p), {
      emoji: '🪶',
      category: 'language',
    }),
    makeRule(
      44,
      'Phải có 2 emoji',
      'Đa dạng cảm xúc.',
      (p) => [...p].filter((c) => /\p{Extended_Pictographic}/u.test(c)).length >= 2,
      { emoji: '😵', category: 'culture' },
    ),
    makeRule(45, 'Phải có cặp ngoặc vuông [abc]', 'Ngoặc vuông.', (p) => /\[[^[\]]+\]/.test(p), {
      emoji: '🧱',
      category: 'logic',
    }),
    makeRule(46, 'Phải có dấu hai chấm :', 'Nhịp cú pháp.', (p) => p.includes(':'), {
      emoji: '📌',
      category: 'logic',
    }),
    makeRule(47, 'Phải có cặp chữ lặp (aa, bb)', 'Chữ lặp.', (p) => /(.)\1/u.test(p), {
      emoji: '🪞',
      category: 'logic',
    }),
    makeRule(
      48,
      'Phải có chữ số cạnh chữ cái (A2)',
      'Chữ-số liền kề.',
      (p) => LETTER_OR_DIGIT_NEIGHBOR_REGEX.test(p),
      { emoji: '🔗', category: 'logic' },
    ),
    makeRule(
      49,
      'Phải có 2 chữ thường',
      'Không toàn hoa.',
      (p) => (p.match(/[a-zà-ỹ]/gu)?.length ?? 0) >= 2,
      { emoji: '🔡', category: 'core' },
    ),
    makeRule(
      50,
      'Phải có môn tự nhiên (Toán/Lý/Hóa/Sinh)',
      'Khoa học tự nhiên.',
      (p) => ['toan', 'ly', 'hoa', 'sinh'].some((s) => normalize(p).includes(s)),
      { emoji: '🧪', category: 'subject' },
    ),
    makeRule(
      51,
      'Phải có môn xã hội (Văn/Sử/Địa/GDCD)',
      'Khoa học xã hội.',
      (p) => ['van', 'su', 'dia', 'gdcd'].some((s) => normalize(p).includes(s)),
      { emoji: '🏛️', category: 'subject' },
    ),
    makeRule(
      52,
      'Phải có môn nghệ thuật/thể chất',
      'Âm nhạc/Mỹ thuật/Thể dục.',
      (p) => ['am nhac', 'my thuat', 'the duc'].some((s) => normalize(p).includes(s)),
      { emoji: '🎨', category: 'subject' },
    ),
    makeRule(
      53,
      'Phải có môn ngoại ngữ/công nghệ',
      'Anh/Tin/Công nghệ.',
      (p) => ['anh', 'tin', 'cong nghe'].some((s) => normalize(p).includes(s)),
      { emoji: '🌐', category: 'subject' },
    ),
    makeRule(
      54,
      'Phải có viết tắt học đường (THPT/ĐH/HS/SV)',
      'Ký hiệu học đường.',
      (p) => /\b(THPT|ĐH|HS|SV)\b/u.test(p),
      { emoji: '🏫', category: 'subject' },
    ),
    makeRule(
      55,
      'Phải có biểu tượng học tập (📚/✏️/🧠)',
      'Học tập.',
      (p) => ['📚', '✏️', '🧠'].some((e) => p.includes(e)),
      { emoji: '📚', category: 'subject' },
    ),
    makeRule(
      56,
      `Phải chứa "${tinhCach}"`,
      'Tính cách.',
      (p) => normalize(p).includes(normalize(tinhCach)),
      { emoji: '💭', category: 'subject', targetCopy: tinhCach },
    ),
    makeRule(
      57,
      `Phải chứa danh nhân "${danhNhan}"`,
      'Danh nhân Việt.',
      (p) => normalize(p).includes(normalize(danhNhan)),
      { emoji: '👤', category: 'viet', targetCopy: danhNhan },
    ),
    makeRule(
      58,
      `Phải chứa năm lịch sử ${namLichSu.nam}`,
      namLichSu.su_kien,
      (p) => p.includes(namLichSu.nam),
      { emoji: '📜', hint: namLichSu.su_kien, category: 'history', targetCopy: namLichSu.nam },
    ),
    makeRule(
      59,
      `Phải chứa địa danh "${songNui}"`,
      'Sông núi Việt Nam.',
      (p) => normalize(p).includes(normalize(songNui)),
      { emoji: '🏔️', category: 'viet', targetCopy: songNui },
    ),
    makeRule(
      60,
      `Phải chứa loại quả "${hoaQua}"`,
      'Hoa quả Việt.',
      (p) => normalize(p).includes(normalize(hoaQua)),
      { emoji: '🍎', category: 'viet', targetCopy: hoaQua },
    ),
    makeRule(
      61,
      `Phải chứa con vật "${conVat}"`,
      'Động vật.',
      (p) => normalize(p).includes(normalize(conVat)),
      { emoji: '🐾', category: 'viet', targetCopy: conVat },
    ),
    makeRule(
      62,
      `Phải chứa màu sắc "${mauSac}"`,
      'Màu sắc.',
      (p) => normalize(p).includes(normalize(mauSac)),
      { emoji: '🎨', category: 'culture', targetCopy: mauSac },
    ),
    makeRule(
      63,
      'Phải có địa danh du lịch (Sapa/Hạ Long...)',
      'Du lịch Việt.',
      (p) => containsOneOf(p, ['Sa Pa', 'Hạ Long', 'Tràng An', 'Phú Quốc', 'Mộc Châu']) !== null,
      { emoji: '🏞️', category: 'viet' },
    ),
    makeRule(
      64,
      `Phải chứa nghề nghiệp "${ngheNghiep}"`,
      'Nghề nghiệp.',
      (p) => normalize(p).includes(normalize(ngheNghiep)),
      { emoji: '💼', category: 'folk', targetCopy: ngheNghiep },
    ),
    makeRule(
      65,
      `Phải chứa môn thể thao "${theThao}"`,
      'Thể thao.',
      (p) => normalize(p).includes(normalize(theThao)),
      { emoji: '⚽', category: 'folk', targetCopy: theThao },
    ),
    makeRule(
      66,
      `Phải chứa nhạc cụ "${nhacCu}"`,
      'Âm nhạc dân tộc.',
      (p) => normalize(p).includes(normalize(nhacCu)),
      { emoji: '🎵', category: 'folk', targetCopy: nhacCu },
    ),
    makeRule(
      67,
      `Phải chứa động vật biển "${dongVatBien}"`,
      'Động vật biển.',
      (p) => normalize(p).includes(normalize(dongVatBien)),
      { emoji: '🐠', category: 'folk', targetCopy: dongVatBien },
    ),
    makeRule(
      68,
      `Phải chứa loài chim "${loaiChim}"`,
      'Chim Việt Nam.',
      (p) => normalize(p).includes(normalize(loaiChim)),
      { emoji: '🐦', category: 'folk', targetCopy: loaiChim },
    ),
    makeRule(
      69,
      `Phải chứa quan hệ "${quanHe}"`,
      'Gia đình.',
      (p) => normalize(p).includes(normalize(quanHe)),
      { emoji: '👨‍👩‍👧', category: 'folk', targetCopy: quanHe },
    ),
    makeRule(
      70,
      `Phải chứa thời tiết "${thoiTiet}"`,
      'Thời tiết.',
      (p) => normalize(p).includes(normalize(thoiTiet)),
      { emoji: '🌤️', category: 'folk', targetCopy: thoiTiet },
    ),
    makeRule(
      71,
      `Phải chứa ngày lễ "${ngayLe}"`,
      'Ngày lễ Việt.',
      (p) => normalize(p).includes(normalize(ngayLe)),
      { emoji: '🎉', category: 'folk', targetCopy: ngayLe },
    ),
    makeRule(
      72,
      `Phải chứa phương tiện "${phuongTien}"`,
      'Phương tiện.',
      (p) => normalize(p).includes(normalize(phuongTien)),
      { emoji: '🚗', category: 'folk', targetCopy: phuongTien },
    ),
    makeRule(
      73,
      `Phải chứa đồ dùng "${doDung}"`,
      'Đồ dùng.',
      (p) => normalize(p).includes(normalize(doDung)),
      { emoji: '📦', category: 'folk', targetCopy: doDung },
    ),
  ]

  const hardRules: Rule[] = [
    makeRule(
      74,
      `Phải chứa nguyên tố hóa học "${nguyenTo}"`,
      'Bảng tuần hoàn.',
      (p) => normalize(p).includes(normalize(nguyenTo)),
      { emoji: '⚗️', category: 'science', targetCopy: nguyenTo },
    ),
    makeRule(
      75,
      `Phải chứa đơn vị đo "${donVi}"`,
      'Đơn vị đo lường.',
      (p) => normalize(p).includes(normalize(donVi)),
      { emoji: '📏', category: 'science', targetCopy: donVi },
    ),
    makeRule(
      76,
      `Phải chứa chức danh "${chucDanh}"`,
      'Chức danh.',
      (p) => normalize(p).includes(normalize(chucDanh)),
      { emoji: '👔', category: 'science', targetCopy: chucDanh },
    ),
    makeRule(
      77,
      `Phải có "${tonGiao}" hoặc "${trietHoc}"`,
      'Tôn giáo hoặc triết học.',
      (p) =>
        normalize(p).includes(normalize(tonGiao)) || normalize(p).includes(normalize(trietHoc)),
      { emoji: '☸️', category: 'science', targetCopy: tonGiao },
    ),
    makeRule(
      78,
      `Phải chứa ngày hiện tại (${currentDate})`,
      'Ngày hôm nay.',
      (p) => p.includes(String(currentDate)),
      { emoji: '📅', category: 'time', targetCopy: String(currentDate) },
    ),
    makeRule(
      79,
      `Phải chứa giờ hiện tại (${currentHour}h)`,
      'Giờ hiện tại.',
      (p) => p.includes(`${currentHour}h`) || p.includes(`${currentHour}:`),
      { emoji: '⏰', category: 'time', targetCopy: `${currentHour}h` },
    ),
    makeRule(
      80,
      'Phải có từ chỉ buổi trong ngày',
      'Sáng/trưa/chiều/tối.',
      (p) => ['sáng', 'trưa', 'chiều', 'tối', 'đêm'].some((s) => normalize(p).includes(s)),
      { emoji: '🌅', category: 'time' },
    ),
    makeRule(
      81,
      'Phải có chữ in hoa liên tiếp (AB, XY)',
      'Hai chữ hoa liền.',
      (p) => TWO_CONSECUTIVE_UPPERCASE_REGEX.test(p),
      { emoji: '🔠', category: 'logic' },
    ),
    makeRule(82, 'Phải có 3 chữ số liên tiếp', 'Ba số liền nhau.', (p) => /\d{3}/.test(p), {
      emoji: '🔢',
      category: 'logic',
    }),
    makeRule(
      83,
      'Phải có chữ đầu tiên viết hoa',
      'Chữ đầu viết hoa.',
      (p) => UPPERCASE_VIET_REGEX.test(p.charAt(0)),
      { emoji: '🅰️', category: 'logic' },
    ),
    makeRule(84, 'Phải có dấu chấm than !', 'Chấm than.', (p) => p.includes('!'), {
      emoji: '❗',
      category: 'logic',
    }),
    makeRule(85, 'Phải có dấu hỏi ?', 'Dấu hỏi.', (p) => p.includes('?'), {
      emoji: '❓',
      category: 'logic',
    }),
    makeRule(86, "Phải có dấu nháy đơn '", 'Nháy đơn.', (p) => p.includes("'"), {
      emoji: "'",
      category: 'logic',
    }),
    makeRule(87, 'Phải có dấu nháy kép "', 'Nháy kép.', (p) => p.includes('"'), {
      emoji: '"',
      category: 'logic',
    }),
    makeRule(
      88,
      'Phải chứa từ "mật khẩu"',
      'Meta rule.',
      (p) => normalize(p).includes('mat khau'),
      { emoji: '🔐', category: 'meta' },
    ),
    makeRule(89, 'Phải chứa từ "địa ngục"', 'Tên game.', (p) => normalize(p).includes('dia nguc'), {
      emoji: '🔥',
      category: 'meta',
    }),
    makeRule(90, 'Phải chứa từ "quy tắc"', 'Meta rule.', (p) => normalize(p).includes('quy tac'), {
      emoji: '📋',
      category: 'meta',
    }),
    makeRule(91, 'Phải có số chẵn ở đầu', 'Bắt đầu bằng số chẵn.', (p) => /^[02468]/.test(p), {
      emoji: '2️⃣',
      category: 'logic',
    }),
    makeRule(92, 'Phải có số lẻ ở cuối', 'Kết thúc bằng số lẻ.', (p) => /[13579]$/.test(p), {
      emoji: '1️⃣',
      category: 'logic',
    }),
    makeRule(
      93,
      'Phải có ít nhất 1 chữ in đậm (dùng *)',
      'In đậm markdown.',
      (p) => /\*[^*]+\*/.test(p),
      { emoji: '*', category: 'logic' },
    ),
    makeRule(
      94,
      'Phải có ít nhất 1 chữ in nghiêng (dùng _)',
      'In nghiêng markdown.',
      (p) => /_[^_]+_/.test(p),
      { emoji: '_', category: 'logic' },
    ),
    makeRule(
      95,
      'Phải nhắc tới một hành tinh',
      'Thiên văn cơ bản.',
      (p) => containsOneOf(p, ['Sao Hỏa', 'Sao Kim', 'Sao Mộc', 'Sao Thổ']) !== null,
      { emoji: '🪐', category: 'science' },
    ),
    makeRule(
      96,
      'Phải có từ khóa vật lý',
      'Lực, vận tốc, điện...',
      (p) =>
        ['lực', 'gia tốc', 'vận tốc', 'điện', 'nhiệt'].some((s) =>
          normalize(p).includes(normalize(s)),
        ),
      { emoji: '⚙️', category: 'science' },
    ),
    makeRule(
      97,
      'Phải có từ khóa hóa học',
      'Phản ứng, axit, bazơ...',
      (p) =>
        ['phản ứng', 'axit', 'bazơ', 'phân tử', 'nguyên tử'].some((s) =>
          normalize(p).includes(normalize(s)),
        ),
      { emoji: '🧫', category: 'science' },
    ),
    makeRule(
      98,
      'Phải có từ khóa sinh học',
      'Tế bào, ADN, hệ sinh thái...',
      (p) =>
        ['tế bào', 'adn', 'gen', 'hệ sinh thái', 'quang hợp'].some((s) =>
          normalize(p).includes(normalize(s)),
        ),
      { emoji: '🧬', category: 'science' },
    ),
    makeRule(
      99,
      'Phải có từ khóa địa lý',
      'Khí hậu, đồng bằng, cao nguyên...',
      (p) =>
        ['khí hậu', 'đồng bằng', 'cao nguyên', 'bản đồ', 'vĩ độ'].some((s) =>
          normalize(p).includes(normalize(s)),
        ),
      { emoji: '🌍', category: 'subject' },
    ),
    makeRule(
      100,
      'Phải có từ khóa lịch sử',
      'Triều đại, khởi nghĩa...',
      (p) =>
        ['triều', 'khởi nghĩa', 'chiến thắng', 'độc lập', 'cách mạng'].some((s) =>
          normalize(p).includes(normalize(s)),
        ),
      { emoji: '🏺', category: 'history' },
    ),
    makeRule(
      101,
      'Phải có từ khóa văn học',
      'Thơ, truyện, nhân vật...',
      (p) =>
        ['thơ', 'truyện', 'nhân vật', 'tác giả', 'ẩn dụ'].some((s) =>
          normalize(p).includes(normalize(s)),
        ),
      { emoji: '✍️', category: 'subject' },
    ),
    makeRule(
      102,
      'Phải chứa một thể thơ',
      'Lục bát, song thất lục bát...',
      (p) => containsOneOf(p, ['lục bát', 'thất ngôn', 'song thất lục bát', 'tự do']) !== null,
      { emoji: '📜', category: 'subject' },
    ),
    makeRule(
      103,
      'Phải có từ gợi dân gian',
      'Trầu cau, cánh cò, sân đình...',
      (p) =>
        ['trầu cau', 'cánh cò', 'sân đình', 'con đò', 'giếng nước'].some((s) =>
          normalize(p).includes(normalize(s)),
        ),
      { emoji: '🪷', category: 'folk' },
    ),
    makeRule(
      104,
      'Phải có một giác quan',
      'Mắt, tai, mũi, lưỡi, da.',
      (p) => containsOneOf(p, ['mắt', 'tai', 'mũi', 'lưỡi', 'da']) !== null,
      { emoji: '👁️', category: 'science' },
    ),
    makeRule(
      105,
      'Phải có một cơ quan cơ thể',
      'Tim, phổi, gan...',
      (p) => containsOneOf(p, ['tim', 'phổi', 'gan', 'não', 'thận']) !== null,
      { emoji: '🫀', category: 'science' },
    ),
    makeRule(
      106,
      'Phải nhắc tới môi trường sống',
      'Rừng, biển, sa mạc...',
      (p) => containsOneOf(p, ['rừng', 'biển', 'sa mạc', 'đầm lầy', 'hang động']) !== null,
      { emoji: '🌿', category: 'science' },
    ),
    makeRule(
      107,
      'Phải có một loại đá/kim loại',
      'Đá vôi, than đá, đồng...',
      (p) => containsOneOf(p, ['đá vôi', 'than đá', 'đồng', 'sắt', 'nhôm']) !== null,
      { emoji: '⛏️', category: 'science' },
    ),
    makeRule(
      108,
      'Phải có từ khóa bản đồ',
      'Kinh độ, vĩ độ, tọa độ...',
      (p) =>
        ['kinh độ', 'vĩ độ', 'tọa độ', 'bán cầu', 'la bàn'].some((s) =>
          normalize(p).includes(normalize(s)),
        ),
      { emoji: '🧭', category: 'subject' },
    ),
    makeRule(
      109,
      'Phải có một triều đại Việt Nam',
      'Lý, Trần, Lê, Nguyễn...',
      (p) => containsOneOf(p, ['nhà Lý', 'nhà Trần', 'nhà Lê', 'nhà Nguyễn']) !== null,
      { emoji: '👑', category: 'history' },
    ),
    makeRule(
      110,
      'Phải chứa tên một tác phẩm quen thuộc',
      'Truyện Kiều, Lão Hạc...',
      (p) =>
        containsOneOf(p, ['Truyện Kiều', 'Lão Hạc', 'Tắt đèn', 'Đất rừng phương Nam']) !== null,
      { emoji: '📚', category: 'subject' },
    ),
    makeRule(
      111,
      'Phải có tên một biện pháp tu từ',
      'So sánh, nhân hóa...',
      (p) => containsOneOf(p, ['so sánh', 'ẩn dụ', 'nhân hóa', 'điệp ngữ', 'hoán dụ']) !== null,
      { emoji: '🖋️', category: 'subject' },
    ),
    makeRule(
      112,
      'Phải có một loại năng lượng',
      'Điện, nhiệt, mặt trời...',
      (p) =>
        containsOneOf(p, ['điện năng', 'nhiệt năng', 'năng lượng mặt trời', 'gió', 'thủy điện']) !==
        null,
      { emoji: '🔋', category: 'science' },
    ),
    makeRule(
      113,
      'Phải có một hiện tượng thời tiết cực đoan',
      'Bão, lũ, hạn hán...',
      (p) => containsOneOf(p, ['bão', 'lũ', 'hạn hán', 'sấm sét', 'mưa đá']) !== null,
      { emoji: '⛈️', category: 'subject' },
    ),
    makeRule(
      114,
      'Phải có một loại bản đồ hoặc biểu đồ',
      'Bản đồ nhiệt, biểu đồ cột...',
      (p) => containsOneOf(p, ['bản đồ', 'biểu đồ cột', 'biểu đồ tròn', 'lược đồ']) !== null,
      { emoji: '📊', category: 'subject' },
    ),
    makeRule(
      115,
      'Phải có tên một vùng kinh tế hoặc miền',
      'Tây Bắc, Tây Nguyên...',
      (p) =>
        containsOneOf(p, [
          'Tây Bắc',
          'Đông Bắc',
          'Tây Nguyên',
          'Đồng bằng sông Cửu Long',
          'Duyên hải miền Trung',
        ]) !== null,
      { emoji: '🧱', category: 'subject' },
    ),
    makeRule(
      116,
      'Phải có một kiểu câu hỏi văn',
      'Cảm nhận, phân tích, chứng minh...',
      (p) => containsOneOf(p, ['cảm nhận', 'phân tích', 'chứng minh', 'bình luận']) !== null,
      { emoji: '📝', category: 'subject' },
    ),
    makeRule(
      117,
      'Phải có tên một nhân vật cổ tích',
      'Tấm, Cám, Thạch Sanh...',
      (p) => containsOneOf(p, ['Tấm', 'Cám', 'Thạch Sanh', 'Sọ Dừa', 'Cây tre trăm đốt']) !== null,
      { emoji: '🧚', category: 'folk' },
    ),
    makeRule(
      118,
      'Phải có một câu mở đầu truyện dân gian',
      'Ngày xửa ngày xưa...',
      (p) =>
        ['ngày xửa ngày xưa', 'thuở ấy', 'chuyện kể rằng'].some((s) =>
          normalize(p).includes(normalize(s)),
        ),
      { emoji: '📕', category: 'folk' },
    ),
    makeRule(
      119,
      'Phải nhắc tới một loài cây quen thuộc',
      'Tre, lúa, sen...',
      (p) => containsOneOf(p, ['tre', 'lúa', 'sen', 'dừa', 'bàng']) !== null,
      { emoji: '🌾', category: 'folk' },
    ),
    makeRule(
      120,
      'Phải có tên một biển báo hoặc ký hiệu',
      'STOP, cấm, nguy hiểm...',
      (p) => containsOneOf(p, ['stop', 'cấm', 'nguy hiểm', 'lối ra']) !== null,
      { emoji: '🚧', category: 'logic' },
    ),
    makeRule(
      121,
      'Phải có 2 cặp ngoặc khác loại',
      'Ví dụ () và [].',
      (p) => /\([^()]+\)/.test(p) && /\[[^[\]]+\]/.test(p),
      { emoji: '🗃️', category: 'logic' },
    ),
    makeRule(122, 'Phải có chữ cái La Mã', 'I, V, X, L, C...', (p) => /\b[IVXLCDM]+\b/.test(p), {
      emoji: '🏛️',
      category: 'history',
    }),
    makeRule(
      123,
      'Phải có một mốc thời gian thế kỷ',
      'thế kỷ 19, TK XXI...',
      (p) => /thế kỷ\s*\d+|tk\s*[ivxlcdm]+/iu.test(p),
      { emoji: '⌛', category: 'history' },
    ),
    makeRule(
      124,
      'Phải có ký hiệu công thức',
      'Ví dụ H2O, CO2, NaCl.',
      (p) => /\b([A-Z][a-z]?\d?){2,}\b/.test(p),
      { emoji: '🧪', category: 'science' },
    ),
    makeRule(
      125,
      'Phải có một động từ học tập',
      'Học, đọc, nhớ, hiểu...',
      (p) => containsOneOf(p, ['học', 'đọc', 'nhớ', 'hiểu', 'ôn']) !== null,
      { emoji: '🎓', category: 'subject' },
    ),
    makeRule(
      126,
      'Phải có một khái niệm toán nâng cao',
      'hàm số, đạo hàm, xác suất...',
      (p) => containsOneOf(p, ['hàm số', 'đạo hàm', 'xác suất', 'ma trận', 'hình học']) !== null,
      { emoji: '📐', category: 'math' },
    ),
    makeRule(
      127,
      'Phải có một cấu trúc lập luận',
      'vì, nên, tuy nhiên...',
      (p) => containsOneOf(p, ['vì', 'nên', 'tuy nhiên', 'do đó', 'mặt khác']) !== null,
      { emoji: '🧠', category: 'language' },
    ),
    makeRule(
      128,
      'Phải nhắc tới một nguồn tài nguyên',
      'than, dầu, gió, nước...',
      (p) => containsOneOf(p, ['than', 'dầu mỏ', 'khí đốt', 'nước', 'gió']) !== null,
      { emoji: '🛢️', category: 'subject' },
    ),
    makeRule(
      129,
      'Phải có một từ chỉ bản sắc Việt',
      'quê hương, non sông, dân tộc...',
      (p) => containsOneOf(p, ['quê hương', 'non sông', 'dân tộc', 'đồng bào', 'Tổ quốc']) !== null,
      { emoji: '🇻🇳', category: 'culture' },
    ),
  ]

  const selectedMedium = shuffleWithSeed(mediumRules, seed).slice(0, 8)
  const selectedHard = shuffleWithSeed(hardRules, seed + 997).slice(0, 7)
  const allSelected = [...coreRules, ...selectedMedium, ...selectedHard]

  // Re-index IDs sequentially
  return allSelected.map((rule, index) => ({ ...rule, id: index + 1 }))
}

export function getValidRules(seed = Date.now() % 100000): Rule[] {
  return createRuleSet(seed)
}

export {
  TINH_THANH,
  MON_AN_VIET,
  IT_WORDS,
  MON_HOC,
  getDigitSum,
  isPrime,
  getCurrentMonth,
  getCurrentYear,
  getCurrentWeekday,
}
