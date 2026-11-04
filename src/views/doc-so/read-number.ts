const DIGITS = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'] as const

const SCALES = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ', 'tỷ tỷ'] as const

const MAX_DIGITS = SCALES.length * 3

function digit(value: number): string {
  const word = DIGITS[value]
  if (word === undefined) throw new Error(`Chữ số không hợp lệ: ${value}`)
  return word
}

export function readGroup(value: number, showZeroHundreds: boolean): string {
  const hundreds = Math.floor(value / 100)
  const tens = Math.floor((value % 100) / 10)
  const units = value % 10
  const parts: string[] = []

  if (hundreds > 0) parts.push(`${digit(hundreds)} trăm`)
  else if (showZeroHundreds && (tens > 0 || units > 0)) parts.push('không trăm')

  if (tens > 1) {
    parts.push(`${digit(tens)} mươi`)
    if (units === 1) parts.push('mốt')
    else if (units === 4) parts.push('tư')
    else if (units === 5) parts.push('lăm')
    else if (units > 0) parts.push(digit(units))
  } else if (tens === 1) {
    parts.push('mười')
    if (units === 5) parts.push('lăm')
    else if (units > 0) parts.push(digit(units))
  } else if (units > 0) {
    if (hundreds > 0 || showZeroHundreds) parts.push('linh')
    parts.push(digit(units))
  }

  return parts.join(' ')
}

export function readInteger(raw: string): string {
  if (!/^\d+$/.test(raw)) throw new Error('Không phải số nguyên')
  const digits = raw.replace(/^0+(?=\d)/, '')
  if (digits === '0') return 'không'

  const groups: number[] = []
  for (let end = digits.length; end > 0; end -= 3) {
    const start = Math.max(0, end - 3)
    groups.unshift(Number(digits.slice(start, end)))
  }
  if (groups.length > SCALES.length) throw new Error('Số quá lớn')

  const parts: string[] = []
  groups.forEach((group, index) => {
    if (group === 0) return
    const scale = SCALES[groups.length - 1 - index]
    if (scale === undefined) throw new Error('Số quá lớn')
    const words = readGroup(group, index > 0)
    parts.push(scale ? `${words} ${scale}` : words)
  })
  return parts.join(' ')
}

export function normalizeInteger(input: string): string {
  const compact = input.trim().replace(/\s+/g, '')
  if (!compact) throw new Error('Nhập một số')

  let negative = false
  let body = compact
  if (body.startsWith('-') || body.startsWith('−')) {
    negative = true
    body = body.slice(1)
  }

  if (/^\d{1,3}([.,]\d{3})+$/.test(body)) body = body.replace(/[.,]/g, '')
  if (!/^\d+$/.test(body)) {
    throw new Error('Chỉ nhận số nguyên. Dấu chấm hoặc phẩy chỉ để ngăn hàng nghìn.')
  }
  if (body.length > MAX_DIGITS) throw new Error(`Chỉ đọc tới ${MAX_DIGITS} chữ số`)

  const digits = body.replace(/^0+(?=\d)/, '')
  if (digits === '0') return '0'
  return negative ? `-${digits}` : digits
}

export function readNumber(input: string, withCurrency = false): string {
  const normalized = normalizeInteger(input)
  const negative = normalized.startsWith('-')
  const words = readInteger(negative ? normalized.slice(1) : normalized)
  const signed = negative ? `âm ${words}` : words
  const sentence = signed.charAt(0).toUpperCase() + signed.slice(1)
  return withCurrency ? `${sentence} đồng` : sentence
}
