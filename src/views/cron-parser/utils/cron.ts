import type { CronAlert, CronAnalysis, CronFormat } from '../types'
import { parseCronExpression } from './cron-scheduler'

const RELATIVE_TIME_FORMATTER = new Intl.RelativeTimeFormat('vi', {
  numeric: 'auto',
})

export function splitCronExpression(expression: string) {
  return expression.trim().split(/\s+/).filter(Boolean)
}

function parseStep(value: string) {
  const match = value.match(/^(?:\*|\d+)\/(\d+)$/)

  if (!match) {
    return null
  }

  const step = Number.parseInt(match[1] ?? '', 10)
  return Number.isFinite(step) ? step : null
}

function isWildcard(value: string) {
  return value === '*' || value === '?'
}

function createAlert(level: CronAlert['level'], title: string, message: string): CronAlert {
  return {
    level,
    title,
    message,
  }
}

function describeField(value: string, unit: string) {
  if (isWildcard(value)) {
    return `mỗi ${unit}`
  }

  const step = parseStep(value)
  if (step !== null) {
    return `mỗi ${step} ${unit}`
  }

  if (value.includes(',')) {
    return `${unit} thuộc các giá trị ${value}`
  }

  if (value.includes('-')) {
    return `${unit} trong khoảng ${value}`
  }

  return `${unit} = ${value}`
}

export function buildFallbackDescription(expression: string) {
  const fields = splitCronExpression(expression)

  if (fields.length === 5) {
    const [minute = '*', hour = '*', dayOfMonth = '*', month = '*', dayOfWeek = '*'] = fields

    if (
      minute.startsWith('*/') &&
      hour === '*' &&
      dayOfMonth === '*' &&
      month === '*' &&
      dayOfWeek === '*'
    ) {
      return `Mỗi ${minute.slice(2)} phút`
    }

    if (
      minute === '0' &&
      hour !== '*' &&
      dayOfMonth === '*' &&
      month === '*' &&
      dayOfWeek === '*'
    ) {
      return `Hằng ngày lúc ${hour.padStart(2, '0')}:00`
    }

    return `Chạy ${describeField(minute, 'phút')}, ${describeField(hour, 'giờ')}, ${describeField(dayOfMonth, 'ngày trong tháng')}, ${describeField(month, 'tháng')}, ${describeField(dayOfWeek, 'thứ trong tuần')}`
  }

  if (fields.length === 6) {
    const [second = '*', minute = '*', hour = '*', dayOfMonth = '*', month = '*', dayOfWeek = '*'] =
      fields

    if (
      second === '0' &&
      minute.startsWith('*/') &&
      hour === '*' &&
      dayOfMonth === '*' &&
      month === '*' &&
      dayOfWeek === '*'
    ) {
      return `Mỗi ${minute.slice(2)} phút`
    }

    if (
      second === '0' &&
      minute === '0' &&
      hour !== '*' &&
      dayOfMonth === '*' &&
      month === '*' &&
      dayOfWeek === '*'
    ) {
      return `Hằng ngày lúc ${hour.padStart(2, '0')}:00:00`
    }

    return `Chạy ${describeField(second, 'giây')}, ${describeField(minute, 'phút')}, ${describeField(hour, 'giờ')}, ${describeField(dayOfMonth, 'ngày trong tháng')}, ${describeField(month, 'tháng')}, ${describeField(dayOfWeek, 'thứ trong tuần')}`
  }

  return 'Biểu thức Cron không hợp lệ'
}

export function formatRelativeTime(diffMs: number) {
  const absoluteMs = Math.abs(diffMs)

  if (absoluteMs < 45_000) {
    return diffMs >= 0 ? 'trong vài giây' : 'vài giây trước'
  }

  const minutes = Math.round(diffMs / 60_000)
  const hours = Math.round(diffMs / 3_600_000)
  const days = Math.round(diffMs / 86_400_000)

  if (Math.abs(days) >= 1) {
    return RELATIVE_TIME_FORMATTER.format(days, 'day')
  }

  if (Math.abs(hours) >= 1) {
    return RELATIVE_TIME_FORMATTER.format(hours, 'hour')
  }

  return RELATIVE_TIME_FORMATTER.format(minutes, 'minute')
}

export function formatDateTimeInTimeZone(
  date: Date,
  timezone: string,
  options: Intl.DateTimeFormatOptions = {},
) {
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      ...options,
      timeZone: timezone,
    }).format(date)
  } catch {
    return new Intl.DateTimeFormat('vi-VN', options).format(date)
  }
}

export function analyzeCronExpression(expression: string, format: CronFormat): CronAnalysis {
  const fields = splitCronExpression(expression)
  const fieldCount = fields.length
  const expectedFieldCount = format === 'quartz' ? 6 : 5
  const modeLabel = format === 'quartz' ? 'Quartz (6 field)' : 'Linux (5 field)'
  const alerts: CronAlert[] = []

  if (fieldCount === 0) {
    return {
      fieldCount: 0,
      expectedFieldCount,
      modeLabel,
      cadenceLabel: 'Chưa nhập cron',
      cadenceTone: 'accent-sky',
      fieldSummary: '',
      alerts,
    }
  }

  if (fieldCount !== 5 && fieldCount !== 6) {
    return {
      fieldCount,
      expectedFieldCount,
      modeLabel,
      cadenceLabel: 'Cần 5 hoặc 6 field',
      cadenceTone: 'accent-coral',
      fieldSummary: fields.join(' · '),
      alerts: [
        createAlert('error', 'Cron không hợp lệ', 'Cron Linux dùng 5 field, Quartz dùng 6 field.'),
      ],
    }
  }

  const parsed = parseCronExpression(expression)
  if (!parsed.ok) {
    return {
      fieldCount,
      expectedFieldCount,
      modeLabel,
      cadenceLabel: 'Cron không hợp lệ',
      cadenceTone: 'accent-coral',
      fieldSummary: fields.join(' · '),
      alerts: [createAlert('error', 'Cron không hợp lệ', parsed.error)],
    }
  }

  if (fieldCount !== expectedFieldCount) {
    alerts.push(
      createAlert(
        'warning',
        format === 'quartz' ? 'Thiếu field giây' : 'Đang ở chế độ Linux',
        format === 'quartz'
          ? 'Biểu thức hiện tại có 5 field; field giây sẽ mặc định là 0.'
          : 'Biểu thức hiện tại có 6 field. Hãy chuyển sang chế độ Quartz nếu muốn giữ trường giây.',
      ),
    )
  }

  const { second, minute, hour, dayOfMonth, month, dayOfWeek } = parsed.value

  const secondStep = parseStep(second.raw)
  const minuteStep = parseStep(minute.raw)
  const minuteWild = isWildcard(minute.raw)
  const hourWild = isWildcard(hour.raw)
  const dayWild = isWildcard(dayOfMonth.raw)
  const monthWild = isWildcard(month.raw)
  const weekdayWild = isWildcard(dayOfWeek.raw)

  let cadenceLabel = 'Lịch tuỳ chỉnh'
  let cadenceTone: CronAnalysis['cadenceTone'] = 'accent-sky'

  if (fieldCount === 6 && (second.raw === '*' || (secondStep !== null && secondStep <= 10))) {
    cadenceTone = 'accent-amber'
    cadenceLabel = second.raw === '*' ? 'Mỗi giây' : `Mỗi ${secondStep} giây`
    alerts.push(
      createAlert(
        'warning',
        'Tần suất cao',
        second.raw === '*'
          ? 'Biểu thức này chạy mỗi giây và có thể gây spam.'
          : `Biểu thức này chạy mỗi ${secondStep} giây.`,
      ),
    )
  } else if (minuteWild && hourWild && dayWild && monthWild && weekdayWild) {
    cadenceTone = 'accent-amber'
    cadenceLabel = 'Mỗi phút'
    alerts.push(
      createAlert(
        'info',
        'Tần suất dày',
        'Biểu thức này chạy mỗi phút. Hãy cân nhắc tải hệ thống.',
      ),
    )
  } else if (
    minuteStep !== null &&
    minuteStep <= 5 &&
    hourWild &&
    dayWild &&
    monthWild &&
    weekdayWild
  ) {
    cadenceTone = 'accent-amber'
    cadenceLabel = `Mỗi ${minuteStep} phút`
    alerts.push(
      createAlert('warning', 'Tần suất dày', `Biểu thức này chạy mỗi ${minuteStep} phút.`),
    )
  }

  if (!dayWild && !weekdayWild) {
    alerts.push(
      createAlert(
        'warning',
        'Hai trường ngày đều được gắn giá trị',
        'Một số parser hiểu ngày trong tháng và thứ trong tuần theo logic OR. Hãy kiểm tra kết quả thực tế.',
      ),
    )
  }

  return {
    fieldCount,
    expectedFieldCount,
    modeLabel,
    cadenceLabel,
    cadenceTone,
    fieldSummary: fields.join(' · '),
    alerts,
  }
}
