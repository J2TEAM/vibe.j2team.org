import { VOWELS, PRIMES } from './data'

export function normalize(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

export function randomFromList<T>(seed: number, list: T[]): T {
  return list[seed % list.length] ?? list[0]!
}

export function shuffleWithSeed<T>(items: T[], seed: number): T[] {
  const result = [...items]
  let s = seed
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) % 4294967296
    const j = s % (i + 1)
    ;[result[i], result[j]] = [result[j]!, result[i]!]
  }
  return result
}

export function getDigits(password: string): number[] {
  return password
    .split('')
    .filter((c) => /\d/.test(c))
    .map(Number)
}

export function getDigitSum(password: string): number {
  return getDigits(password).reduce((s, d) => s + d, 0)
}

export function getUniqueDigits(password: string): number[] {
  return [...new Set(getDigits(password))]
}

export function countViet(password: string): number {
  return (
    password.match(
      /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/g,
    )?.length ?? 0
  )
}

export function countVietnameseChars(password: string): number {
  return countViet(password)
}

export function countVowels(password: string): number {
  return [...normalize(password)].filter((c) => VOWELS.includes(c)).length
}

export function countConsonants(password: string): number {
  return [...normalize(password)].filter((c) => /[a-z]/.test(c) && !VOWELS.includes(c)).length
}

export function countEmoji(password: string): number {
  return [...password].filter((c) => /\p{Extended_Pictographic}/u.test(c)).length
}

export function getWordCount(password: string): number {
  return password.trim().split(/\s+/).filter(Boolean).length
}

export function getCharCodeSum(password: string): number {
  return [...password].reduce((s, c) => s + (c.codePointAt(0) ?? 0), 0)
}

export function containsOneOf(password: string, values: string[]): string | null {
  const low = normalize(password)
  for (const v of values) {
    if (low.includes(normalize(v))) return v
  }
  return null
}

export function isPrime(n: number): boolean {
  return PRIMES.includes(n)
}

export function nextPrimeHint(n: number): string {
  const prev = [...PRIMES].reverse().find((p) => p <= n) ?? 2
  const next = PRIMES.find((p) => p >= n) ?? 97
  if (prev === next) return `Độ dài ${n} đã là số nguyên tố ✓`
  return `Hiện tại ${n} ký tự — bớt về ${prev} hoặc thêm lên ${next}`
}

export function nextPrimeGap(n: number): string {
  return nextPrimeHint(n)
}

export function getCurrentMonth(): number {
  return new Date().getMonth() + 1
}

export function getCurrentYear(): number {
  return new Date().getFullYear()
}

export function getCurrentWeekday(): string {
  return (
    ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'][
      new Date().getDay()
    ] ?? 'Thứ Hai'
  )
}

export function getCurrentDate(): number {
  return new Date().getDate()
}

export function getCurrentHour(): number {
  return new Date().getHours()
}

export function getWeekdayVariants(w: string): string[] {
  const map: Record<string, string[]> = {
    'Chủ Nhật': ['chủ nhật', 'chu nhat', 'cn'],
    'Thứ Hai': ['thứ hai', 'thu hai', 't2'],
    'Thứ Ba': ['thứ ba', 'thu ba', 't3'],
    'Thứ Tư': ['thứ tư', 'thu tu', 't4'],
    'Thứ Năm': ['thứ năm', 'thu nam', 't5'],
    'Thứ Sáu': ['thứ sáu', 'thu sau', 't6'],
    'Thứ Bảy': ['thứ bảy', 'thu bay', 't7'],
  }
  return map[w] ?? [w.toLowerCase()]
}
