import type { CronFormat } from '../types'
import { splitCronExpression } from './cron'

export interface NaturalLanguageSuggestion {
  label: string
  value: string
}

export type NaturalLanguageConfidence = 'high' | 'medium' | 'low'

export type NaturalLanguageResult =
  | {
      ok: true
      expression: string
      format: CronFormat
      title: string
      explanation: string
      confidence: NaturalLanguageConfidence
      notes: string[]
    }
  | {
      ok: false
      message: string
      suggestions: NaturalLanguageSuggestion[]
    }

interface TimeParts {
  hour: number
  minute: number
}

interface HourRange {
  start: number
  end: number
}

const WEEKDAY_PATTERNS: Array<{ pattern: RegExp; value: number; label: string }> = [
  { pattern: /\b(?:sun|sunday|chu nhat|cn)\b/, value: 0, label: 'Chủ nhật' },
  { pattern: /\b(?:mon|monday|thu hai)\b/, value: 1, label: 'Thứ Hai' },
  { pattern: /\b(?:tue|tuesday|thu ba)\b/, value: 2, label: 'Thứ Ba' },
  { pattern: /\b(?:wed|wednesday|thu tu)\b/, value: 3, label: 'Thứ Tư' },
  { pattern: /\b(?:thursday|thu nam)\b/, value: 4, label: 'Thứ Năm' },
  { pattern: /\b(?:fri|friday|thu sau)\b/, value: 5, label: 'Thứ Sáu' },
  { pattern: /\b(?:sat|saturday|thu bay)\b/, value: 6, label: 'Thứ Bảy' },
]

const SUGGESTIONS: NaturalLanguageSuggestion[] = [
  { label: 'Mỗi 5 phút', value: 'mỗi 5 phút' },
  { label: 'Mỗi ngày lúc 09:00', value: 'mỗi ngày lúc 09:00' },
  { label: 'Mỗi thứ Hai lúc 08:30', value: 'mỗi thứ Hai lúc 08:30' },
  { label: 'Every 10 seconds', value: 'every 10 seconds' },
]

function stripDiacritics(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function normalizeInput(value: string) {
  return stripDiacritics(value)
    .toLowerCase()
    .replace(/[^\w\s:/-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function isCronExpressionLike(value: string) {
  const fields = splitCronExpression(value)
  return fields.length === 5 || fields.length === 6
}

function parseTimeFragment(text: string) {
  const keywordMatch = text.match(
    /(?:at|luc|vao luc|vao|tai)\s+(\d{1,2})(?::(\d{1,2}))?\s*(am|pm)?\b/,
  )
  const match =
    keywordMatch ?? [...text.matchAll(/\b(\d{1,2})(?::(\d{1,2}))?\s*(am|pm)?\b/g)].pop() ?? null

  if (!match) {
    return null
  }

  let hour = Number.parseInt(match[1] ?? '', 10)
  const minute = Number.parseInt(match[2] ?? '0', 10)
  const suffix = match[3]

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return null
  }

  if (suffix === 'pm' && hour < 12) {
    hour += 12
  } else if (suffix === 'am' && hour === 12) {
    hour = 0
  }

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null
  }

  return {
    hour,
    minute,
  } satisfies TimeParts
}

function parseHourRange(text: string) {
  const match = text.match(/\b(?:from|tu)\s+(\d{1,2})\s+(?:to|den)\s+(\d{1,2})\b/)

  if (!match) {
    return null
  }

  const start = Number.parseInt(match[1] ?? '', 10)
  const end = Number.parseInt(match[2] ?? '', 10)

  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return null
  }

  if (start < 0 || start > 23 || end < 0 || end > 23 || start > end) {
    return null
  }

  return {
    start,
    end,
  } satisfies HourRange
}

function findWeekday(text: string) {
  for (const entry of WEEKDAY_PATTERNS) {
    if (entry.pattern.test(text)) {
      return entry
    }
  }

  return null
}

function buildDailyCron(time: TimeParts) {
  return `${time.minute} ${time.hour} * * *`
}

function buildWeeklyCron(time: TimeParts, weekday: number) {
  return `${time.minute} ${time.hour} * * ${weekday}`
}

function buildMonthlyCron(time: TimeParts, dayOfMonth: number) {
  return `${time.minute} ${time.hour} ${dayOfMonth} * *`
}

function buildIntervalCron(
  unit: 'seconds' | 'minutes' | 'hours',
  interval: number,
  range?: HourRange,
) {
  if (unit === 'seconds') {
    return {
      format: 'quartz' as CronFormat,
      expression: `${interval === 1 ? '*' : `*/${interval}`} * * * * *`,
      title: interval === 1 ? 'Mỗi giây' : `Mỗi ${interval} giây`,
      explanation:
        interval === 1
          ? 'Biểu thức sẽ chạy mỗi giây ở chế độ Quartz.'
          : `Biểu thức sẽ chạy mỗi ${interval} giây ở chế độ Quartz.`,
      confidence: 'high' as const,
    }
  }

  if (unit === 'minutes') {
    const minuteField = interval === 1 ? '*' : `*/${interval}`
    const hourField = range ? `${range.start}-${range.end}` : '*'

    return {
      format: 'linux' as CronFormat,
      expression: `${minuteField} ${hourField} * * *`,
      title: interval === 1 ? 'Mỗi phút' : `Mỗi ${interval} phút`,
      explanation:
        range && range.start !== 0
          ? `Biểu thức chạy mỗi ${interval} phút trong khung giờ ${range.start}:00 đến ${range.end}:00.`
          : `Biểu thức chạy mỗi ${interval} phút trong toàn bộ ngày.`,
      confidence: 'high' as const,
    }
  }

  const minuteField = '0'
  const hourField = interval === 1 ? '*' : `*/${interval}`
  const cronHourField = range
    ? `${range.start}-${range.end}${interval > 1 ? `/${interval}` : ''}`
    : hourField

  return {
    format: 'linux' as CronFormat,
    expression: `${minuteField} ${cronHourField} * * *`,
    title: interval === 1 ? 'Mỗi giờ' : `Mỗi ${interval} giờ`,
    explanation: range
      ? `Biểu thức chạy mỗi ${interval} giờ trong khung giờ ${range.start}:00 đến ${range.end}:00.`
      : `Biểu thức chạy mỗi ${interval} giờ.`,
    confidence: 'high' as const,
  }
}

function buildResult(
  expression: string,
  format: CronFormat,
  title: string,
  explanation: string,
  confidence: NaturalLanguageConfidence,
  notes: string[] = [],
): NaturalLanguageResult {
  return {
    ok: true,
    expression,
    format,
    title,
    explanation,
    confidence,
    notes,
  }
}

export function parseNaturalLanguage(input: string): NaturalLanguageResult {
  const normalized = normalizeInput(input)

  if (!normalized) {
    return {
      ok: false,
      message: 'Nhập một câu mô tả ngắn hoặc dán cron vào ô này.',
      suggestions: SUGGESTIONS,
    }
  }

  if (isCronExpressionLike(input)) {
    const fields = splitCronExpression(input)
    const format: CronFormat = fields.length === 6 ? 'quartz' : 'linux'
    return buildResult(
      input.trim(),
      format,
      'Đã nhận diện cron sẵn có',
      'Chuỗi bạn nhập đã là biểu thức cron hợp lệ, nên không cần chuyển đổi lại.',
      'high',
      ['Có thể bấm áp dụng ngay vào trình phân tích.'],
    )
  }

  const intervalMatch = normalized.match(
    /^(?:every|moi)\s+(\d+)\s+(seconds?|giay|minutes?|phut|hours?|gio)\b/,
  )
  if (intervalMatch) {
    const interval = Number.parseInt(intervalMatch[1] ?? '', 10)
    const unit = intervalMatch[2] ?? ''

    if (!Number.isFinite(interval) || interval <= 0) {
      return {
        ok: false,
        message: 'Không đọc được khoảng lặp hợp lệ.',
        suggestions: SUGGESTIONS,
      }
    }

    const range = parseHourRange(normalized)

    if (unit.startsWith('second') || unit === 'giay') {
      const result = buildIntervalCron('seconds', interval)
      return buildResult(
        result.expression,
        result.format,
        result.title,
        result.explanation,
        result.confidence,
        ['Phù hợp để test job ngắn hoặc demo Quartz.'],
      )
    }

    if (unit.startsWith('minute') || unit === 'phut') {
      const result = buildIntervalCron('minutes', interval, range ?? undefined)
      return buildResult(
        result.expression,
        result.format,
        result.title,
        result.explanation,
        result.confidence,
        ['Cron Linux 5 field.'],
      )
    }

    const result = buildIntervalCron('hours', interval, range ?? undefined)
    return buildResult(
      result.expression,
      result.format,
      result.title,
      result.explanation,
      result.confidence,
      ['Cron Linux 5 field.'],
    )
  }

  if (/^(?:every|moi)\s+(?:second|seconds|giay)\b/.test(normalized)) {
    return buildResult(
      '* * * * * *',
      'quartz',
      'Mỗi giây',
      'Biểu thức chạy mỗi giây ở chế độ Quartz.',
      'high',
      ['Hỗ trợ các workload cần tick liên tục.'],
    )
  }

  if (/^(?:every|moi)\s+(?:minute|minutes|phut)\b/.test(normalized)) {
    return buildResult(
      '* * * * *',
      'linux',
      'Mỗi phút',
      'Biểu thức chạy mỗi phút ở chế độ Linux.',
      'high',
      ['Có thể dùng cho healthcheck hoặc sync nhẹ.'],
    )
  }

  if (/^(?:every|moi)\s+(?:hour|hours|gio)\b/.test(normalized)) {
    return buildResult(
      '0 * * * *',
      'linux',
      'Mỗi giờ',
      'Biểu thức chạy vào phút 0 của mỗi giờ.',
      'high',
      ['Dễ dùng cho report hoặc batch theo giờ.'],
    )
  }

  const time = parseTimeFragment(normalized)
  const weekday = findWeekday(normalized)

  if (weekday && time && /^(?:every|moi)\b/.test(normalized)) {
    return buildResult(
      buildWeeklyCron(time, weekday.value),
      'linux',
      `Mỗi ${weekday.label} lúc ${time.hour.toString().padStart(2, '0')}:${time.minute.toString().padStart(2, '0')}`,
      `Biểu thức chạy vào ${weekday.label.toLowerCase()} lúc ${time.hour.toString().padStart(2, '0')}:${time.minute.toString().padStart(2, '0')}.`,
      'high',
      ['Cron Linux 5 field.'],
    )
  }

  if (/^(?:every|moi)\s+(?:day|ngay)\b/.test(normalized) && time) {
    return buildResult(
      buildDailyCron(time),
      'linux',
      `Mỗi ngày lúc ${time.hour.toString().padStart(2, '0')}:${time.minute.toString().padStart(2, '0')}`,
      'Biểu thức chạy mỗi ngày vào đúng giờ đã nhập.',
      'high',
      ['Cron Linux 5 field.'],
    )
  }

  const monthlyMatch = normalized.match(
    /(?:every|moi)\s+(?:month|thang)\s+(?:on\s+)?(?:day|ngay)\s+(\d{1,2})\b/,
  )
  if (/^(?:every|moi)\s+(?:month|thang)\b/.test(normalized) && monthlyMatch && time) {
    const dayOfMonth = Number.parseInt(monthlyMatch[1] ?? '', 10)

    if (Number.isFinite(dayOfMonth) && dayOfMonth >= 1 && dayOfMonth <= 31) {
      return buildResult(
        buildMonthlyCron(time, dayOfMonth),
        'linux',
        `Mỗi tháng ngày ${dayOfMonth} lúc ${time.hour.toString().padStart(2, '0')}:${time.minute.toString().padStart(2, '0')}`,
        'Biểu thức chạy mỗi tháng vào ngày đã chọn.',
        'high',
        ['Cron Linux 5 field.'],
      )
    }
  }

  return {
    ok: false,
    message:
      'Chưa hiểu câu mô tả này. Hãy thử một câu ngắn, ví dụ "mỗi 5 phút" hoặc "every monday at 09:00".',
    suggestions: SUGGESTIONS,
  }
}

export function formatNaturalLanguageConfidence(confidence: NaturalLanguageConfidence) {
  if (confidence === 'high') {
    return 'Độ tin cậy cao'
  }

  if (confidence === 'medium') {
    return 'Độ tin cậy trung bình'
  }

  return 'Độ tin cậy thấp'
}
