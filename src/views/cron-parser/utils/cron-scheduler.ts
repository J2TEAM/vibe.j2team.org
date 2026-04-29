export type CronResolution = 'minute' | 'second'

export interface CronFieldSet {
  raw: string
  values: number[]
  isWildcard: boolean
}

export interface ParsedCronExpression {
  raw: string
  rawFieldCount: 5 | 6
  resolution: CronResolution
  second: CronFieldSet
  minute: CronFieldSet
  hour: CronFieldSet
  dayOfMonth: CronFieldSet
  month: CronFieldSet
  dayOfWeek: CronFieldSet
}

export type ParseResult =
  | {
      ok: true
      value: ParsedCronExpression
    }
  | {
      ok: false
      error: string
    }

interface LocalDateParts {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
}

const MONTH_ALIASES: Record<string, number> = {
  JAN: 1,
  FEB: 2,
  MAR: 3,
  APR: 4,
  MAY: 5,
  JUN: 6,
  JUL: 7,
  AUG: 8,
  SEP: 9,
  OCT: 10,
  NOV: 11,
  DEC: 12,
}

const WEEKDAY_ALIASES: Record<string, number> = {
  SUN: 0,
  MON: 1,
  TUE: 2,
  WED: 3,
  THU: 4,
  FRI: 5,
  SAT: 6,
}

const formatterCache = new Map<string, Intl.DateTimeFormat>()

function splitCronExpression(expression: string) {
  return expression.trim().split(/\s+/).filter(Boolean)
}

function getFormatter(timezone: string) {
  const cached = formatterCache.get(timezone)
  if (cached) {
    return cached
  }

  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    calendar: 'gregory',
    numberingSystem: 'latn',
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  formatterCache.set(timezone, formatter)
  return formatter
}

function getTimezoneParts(date: Date, timezone: string): LocalDateParts {
  const parts = getFormatter(timezone).formatToParts(date)
  const result: LocalDateParts = {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    hour: date.getUTCHours(),
    minute: date.getUTCMinutes(),
    second: date.getUTCSeconds(),
  }

  for (const part of parts) {
    if (part.type === 'year') {
      result.year = Number.parseInt(part.value, 10)
    } else if (part.type === 'month') {
      result.month = Number.parseInt(part.value, 10)
    } else if (part.type === 'day') {
      result.day = Number.parseInt(part.value, 10)
    } else if (part.type === 'hour') {
      result.hour = Number.parseInt(part.value, 10)
    } else if (part.type === 'minute') {
      result.minute = Number.parseInt(part.value, 10)
    } else if (part.type === 'second') {
      result.second = Number.parseInt(part.value, 10)
    }
  }

  return result
}

function sameLocalParts(left: LocalDateParts, right: LocalDateParts) {
  return (
    left.year === right.year &&
    left.month === right.month &&
    left.day === right.day &&
    left.hour === right.hour &&
    left.minute === right.minute &&
    left.second === right.second
  )
}

function localPartsToUtcGuess(parts: LocalDateParts) {
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second)
}

function zonedTimeToUtc(parts: LocalDateParts, timezone: string) {
  let utcGuess = localPartsToUtcGuess(parts)

  for (let iteration = 0; iteration < 4; iteration += 1) {
    const actualParts = getTimezoneParts(new Date(utcGuess), timezone)
    const actualGuess = localPartsToUtcGuess(actualParts)
    const targetGuess = localPartsToUtcGuess(parts)
    const diff = targetGuess - actualGuess

    if (diff === 0) {
      return new Date(utcGuess)
    }

    utcGuess += diff
  }

  const finalParts = getTimezoneParts(new Date(utcGuess), timezone)
  return sameLocalParts(finalParts, parts) ? new Date(utcGuess) : null
}

function localDatePartsFromDate(date: Date) {
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    hour: date.getUTCHours(),
    minute: date.getUTCMinutes(),
    second: date.getUTCSeconds(),
  }
}

function addLocalUnit(parts: LocalDateParts, resolution: CronResolution) {
  const utcDate = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second),
  )

  if (resolution === 'second') {
    utcDate.setUTCSeconds(utcDate.getUTCSeconds() + 1)
  } else {
    utcDate.setUTCMinutes(utcDate.getUTCMinutes() + 1)
    utcDate.setUTCSeconds(0)
  }

  return localDatePartsFromDate(utcDate)
}

function normalizeFieldValue(raw: string, fieldName: string) {
  const token = raw.trim().toUpperCase()

  if (fieldName === 'month') {
    const alias = MONTH_ALIASES[token.slice(0, 3)]
    if (alias !== undefined) {
      return alias
    }
  }

  if (fieldName === 'dayOfWeek') {
    const alias = WEEKDAY_ALIASES[token.slice(0, 3)]
    if (alias !== undefined) {
      return alias
    }
  }

  if (!/^\d+$/.test(token)) {
    return null
  }

  const value = Number.parseInt(token, 10)

  if (fieldName === 'dayOfWeek' && value === 7) {
    return 0
  }

  return value
}

function buildRange(
  start: number,
  end: number,
  step: number,
  min: number,
  max: number,
  cyclic: boolean,
) {
  if (step <= 0) {
    return null
  }

  const values: number[] = []

  if (!cyclic || start <= end) {
    for (let value = start; value <= end; value += step) {
      if (value >= min && value <= max) {
        values.push(value)
      }
    }

    return values
  }

  for (let value = start; value <= max; value += step) {
    values.push(value)
  }

  const wrappedStart = min
  for (let value = wrappedStart; value <= end; value += step) {
    values.push(value)
  }

  return values
}

function expandToken(token: string, fieldName: string, min: number, max: number, cyclic: boolean) {
  const [baseToken, stepToken] = token.split('/')
  const step = stepToken ? Number.parseInt(stepToken, 10) : 1

  if (!Number.isInteger(step) || step <= 0) {
    return null
  }

  const base = (baseToken ?? '').trim()

  if (base === '*' || base === '?') {
    return buildRange(min, max, step, min, max, cyclic)
  }

  if (base.includes('-')) {
    const [startToken, endToken] = base.split('-')
    const start = normalizeFieldValue(startToken ?? '', fieldName)
    const end = normalizeFieldValue(endToken ?? '', fieldName)

    if (start === null || end === null) {
      return null
    }

    const ranged = buildRange(start, end, step, min, max, cyclic)
    return ranged
  }

  const start = normalizeFieldValue(base, fieldName)
  if (start === null) {
    return null
  }

  const rangeEnd = stepToken ? max : start
  return buildRange(start, rangeEnd, step, min, max, cyclic)
}

function parseField(
  source: string,
  fieldName: string,
  min: number,
  max: number,
  cyclic: boolean,
): CronFieldSet | null {
  const trimmed = source.trim()
  const tokens = trimmed.split(',')
  const values = new Set<number>()

  for (const token of tokens) {
    if (!token) {
      return null
    }

    const expanded = expandToken(token, fieldName, min, max, cyclic)
    if (!expanded) {
      return null
    }

    for (const value of expanded) {
      if (value < min || value > max) {
        return null
      }

      values.add(value)
    }
  }

  const sortedValues = Array.from(values).sort((left, right) => left - right)
  if (!sortedValues.length) {
    return null
  }

  return {
    raw: trimmed,
    values: sortedValues,
    isWildcard: trimmed === '*' || trimmed === '?',
  }
}

export function parseCronExpression(expression: string): ParseResult {
  const rawFields = splitCronExpression(expression)

  if (rawFields.length !== 5 && rawFields.length !== 6) {
    return {
      ok: false,
      error: 'Cron chỉ hỗ trợ 5 field (Linux) hoặc 6 field (Quartz).',
    }
  }

  const hasSecondField = rawFields.length === 6
  const minuteIndex = hasSecondField ? 1 : 0

  const second = hasSecondField
    ? parseField(rawFields[0] ?? '', 'second', 0, 59, true)
    : {
        raw: '0',
        values: [0],
        isWildcard: false,
      }
  const minute = parseField(rawFields[minuteIndex] ?? '', 'minute', 0, 59, true)
  const hour = parseField(rawFields[minuteIndex + 1] ?? '', 'hour', 0, 23, true)
  const dayOfMonth = parseField(rawFields[minuteIndex + 2] ?? '', 'dayOfMonth', 1, 31, false)
  const month = parseField(rawFields[minuteIndex + 3] ?? '', 'month', 1, 12, true)
  const dayOfWeek = parseField(rawFields[minuteIndex + 4] ?? '', 'dayOfWeek', 0, 6, true)

  if (!second || !minute || !hour || !dayOfMonth || !month || !dayOfWeek) {
    return {
      ok: false,
      error: 'Cron không hợp lệ. Kiểm tra lại các field và ký tự đặc biệt.',
    }
  }

  return {
    ok: true,
    value: {
      raw: expression.trim(),
      rawFieldCount: rawFields.length as 5 | 6,
      resolution: hasSecondField ? 'second' : 'minute',
      second,
      minute,
      hour,
      dayOfMonth,
      month,
      dayOfWeek,
    },
  }
}

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

function matchesDayOfWeek(dayOfWeek: CronFieldSet, weekday: number) {
  return dayOfWeek.isWildcard || dayOfWeek.values.includes(weekday)
}

function matchesDayOfMonth(dayOfMonth: CronFieldSet, day: number) {
  return dayOfMonth.isWildcard || dayOfMonth.values.includes(day)
}

function matchingDaysInMonth(expression: ParsedCronExpression, year: number, month: number) {
  const totalDays = daysInMonth(year, month)
  const days: number[] = []

  for (let day = 1; day <= totalDays; day += 1) {
    const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay()
    const domMatches = matchesDayOfMonth(expression.dayOfMonth, day)
    const dowMatches = matchesDayOfWeek(expression.dayOfWeek, weekday)

    if (expression.dayOfMonth.isWildcard && expression.dayOfWeek.isWildcard) {
      days.push(day)
      continue
    }

    if (expression.dayOfMonth.isWildcard) {
      if (dowMatches) {
        days.push(day)
      }
      continue
    }

    if (expression.dayOfWeek.isWildcard) {
      if (domMatches) {
        days.push(day)
      }
      continue
    }

    if (domMatches || dowMatches) {
      days.push(day)
    }
  }

  return days
}

function findNextLocalMatch(cursor: LocalDateParts, expression: ParsedCronExpression) {
  const yearLimit = cursor.year + 10

  for (let year = cursor.year; year <= yearLimit; year += 1) {
    const monthStart = year === cursor.year ? cursor.month : 1
    const allowedMonths = expression.month.values.filter((month) => month >= monthStart)

    for (const month of allowedMonths) {
      const dayStart = year === cursor.year && month === cursor.month ? cursor.day : 1
      const allowedDays = matchingDaysInMonth(expression, year, month).filter(
        (day) => day >= dayStart,
      )

      for (const day of allowedDays) {
        const hourStart =
          year === cursor.year && month === cursor.month && day === cursor.day ? cursor.hour : 0
        const allowedHours = expression.hour.values.filter((hour) => hour >= hourStart)

        for (const hour of allowedHours) {
          const minuteStart =
            year === cursor.year &&
            month === cursor.month &&
            day === cursor.day &&
            hour === cursor.hour
              ? cursor.minute
              : 0
          const allowedMinutes = expression.minute.values.filter((minute) => minute >= minuteStart)

          for (const minute of allowedMinutes) {
            const secondStart =
              year === cursor.year &&
              month === cursor.month &&
              day === cursor.day &&
              hour === cursor.hour &&
              minute === cursor.minute
                ? cursor.second
                : 0
            const allowedSeconds = expression.second.values.filter(
              (second) => second >= secondStart,
            )

            for (const second of allowedSeconds) {
              return {
                year,
                month,
                day,
                hour,
                minute,
                second,
              } satisfies LocalDateParts
            }
          }
        }
      }
    }
  }

  return null
}

export function generateNextRuns(
  expression: string,
  timezone: string,
  count = 5,
  afterDate = new Date(),
) {
  const parsed = parseCronExpression(expression)
  if (!parsed.ok) {
    return []
  }

  const runs: Date[] = []
  const currentTimezoneParts = getTimezoneParts(afterDate, timezone)
  let cursor = addLocalUnit(currentTimezoneParts, parsed.value.resolution)

  for (let index = 0; index < count; index += 1) {
    const match = findNextLocalMatch(cursor, parsed.value)
    if (!match) {
      break
    }

    const utcDate = zonedTimeToUtc(match, timezone)
    if (!utcDate) {
      cursor = addLocalUnit(match, parsed.value.resolution)
      index -= 1
      continue
    }

    runs.push(utcDate)
    cursor = addLocalUnit(match, parsed.value.resolution)
  }

  return runs
}

export function generateOccurrencesInRange(
  expression: string,
  timezone: string,
  startDate: Date,
  endDate: Date,
  limit = 240,
) {
  const parsed = parseCronExpression(expression)
  if (!parsed.ok || endDate.getTime() < startDate.getTime()) {
    return []
  }

  const runs: Date[] = []
  let cursor = getTimezoneParts(startDate, timezone)

  for (let index = 0; index < limit; index += 1) {
    const match = findNextLocalMatch(cursor, parsed.value)
    if (!match) {
      break
    }

    const utcDate = zonedTimeToUtc(match, timezone)
    if (!utcDate) {
      cursor = addLocalUnit(match, parsed.value.resolution)
      continue
    }

    if (utcDate.getTime() > endDate.getTime()) {
      break
    }

    runs.push(utcDate)
    cursor = addLocalUnit(match, parsed.value.resolution)
  }

  return runs
}
