import type { CsvRow, JsonValue, JwtTimeField, ParsedHeader, RegexMatch } from '../types'

export function normalizeUrlInput(source: string) {
  if (source.startsWith('?')) return new URL(source, 'https://example.dev')

  try {
    return new URL(source)
  } catch {
    return new URL(source.startsWith('/') ? source : `/${source}`, 'https://example.dev')
  }
}

export function collectRegexMatches(expression: RegExp, sample: string) {
  if (!sample) return [] as RegexMatch[]

  if (expression.global) {
    return Array.from(sample.matchAll(expression)).map((match) => ({
      index: match.index ?? 0,
      text: match[0],
      groups: match.slice(1).filter((group): group is string => typeof group === 'string'),
    }))
  }

  const firstMatch = expression.exec(sample)
  if (!firstMatch) return [] as RegexMatch[]

  return [
    {
      index: firstMatch.index ?? 0,
      text: firstMatch[0],
      groups: firstMatch.slice(1).filter((group): group is string => typeof group === 'string'),
    },
  ]
}

export function encodeTextToBase64(value: string) {
  const bytes = new TextEncoder().encode(value)
  let binary = ''

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })

  return btoa(binary)
}

export function decodeBase64ToText(value: string) {
  const binary = atob(value.trim())
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function decodeBase64UrlToText(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4))

  return decodeBase64ToText(`${normalized}${padding}`)
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function unescapeHtml(value: string) {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
}

export function isJsonObject(value: JsonValue): value is { [key: string]: JsonValue } {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function extractJwtTimeFields(value: JsonValue) {
  if (!isJsonObject(value)) {
    return [] as JwtTimeField[]
  }

  return ['iat', 'exp', 'nbf']
    .map((key) => {
      const rawValue = value[key]

      if (typeof rawValue !== 'number') {
        return null
      }

      return {
        key,
        raw: rawValue.toString(),
        formatted: new Date(rawValue * 1000).toLocaleString('vi-VN'),
      }
    })
    .filter((field): field is JwtTimeField => field !== null)
}

export function toSlug(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function formatDateTimeLocal(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export function splitWords(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.toLowerCase())
}

export function toCamelCase(words: string[]) {
  return words
    .map((word, index) => (index === 0 ? word : `${word.charAt(0).toUpperCase()}${word.slice(1)}`))
    .join('')
}

export function toPascalCase(words: string[]) {
  return words.map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`).join('')
}

function jsonValueToType(value: JsonValue, indentLevel: number): string {
  if (value === null) {
    return 'null'
  }

  if (Array.isArray(value)) {
    if (!value.length) {
      return 'never[]'
    }

    const itemTypes = Array.from(
      new Set(value.map((item) => jsonValueToType(item, indentLevel))),
    ).join(' | ')
    return `(${itemTypes})[]`
  }

  if (isJsonObject(value)) {
    const indent = '  '.repeat(indentLevel)
    const childIndent = '  '.repeat(indentLevel + 1)
    const lines = Object.entries(value).map(
      ([key, child]) =>
        `${childIndent}${formatPropertyKey(key)}: ${jsonValueToType(child, indentLevel + 1)}`,
    )

    return `{\n${lines.join(';\n')};\n${indent}}`
  }

  if (typeof value === 'string') {
    return 'string'
  }

  if (typeof value === 'number') {
    return 'number'
  }

  return 'boolean'
}

function formatPropertyKey(key: string) {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? key : `'${key}'`
}

export function generateTypeScriptType(name: string, value: JsonValue) {
  const typeName = toPascalCase(splitWords(name)) || 'GeneratedType'
  const body = jsonValueToType(value, 0)

  if (isJsonObject(value)) {
    return `interface ${typeName} ${body}`
  }

  return `type ${typeName} = ${body}`
}

export function describeCronField(value: string, label: string) {
  if (value === '*') {
    return `mỗi ${label}`
  }

  if (value.startsWith('*/')) {
    return `mỗi ${value.slice(2)} ${label}`
  }

  if (value.includes(',')) {
    return `${label} thuộc các giá trị ${value}`
  }

  if (value.includes('-')) {
    return `${label} trong khoảng ${value}`
  }

  return `${label} = ${value}`
}

export function formatRelativeTime(diffMs: number) {
  const formatter = new Intl.RelativeTimeFormat('vi', { numeric: 'auto' })
  const minutes = Math.round(diffMs / 60000)
  const hours = Math.round(diffMs / 3600000)
  const days = Math.round(diffMs / 86400000)

  if (Math.abs(days) >= 1) {
    return formatter.format(days, 'day')
  }

  if (Math.abs(hours) >= 1) {
    return formatter.format(hours, 'hour')
  }

  return formatter.format(minutes, 'minute')
}

export function parseCsv(source: string) {
  const rows: string[][] = []
  let currentCell = ''
  let currentRow: string[] = []
  let inQuotes = false

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index] ?? ''
    const nextCharacter = source[index + 1] ?? ''

    if (character === '"') {
      if (inQuotes && nextCharacter === '"') {
        currentCell += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (character === ',' && !inQuotes) {
      currentRow.push(currentCell)
      currentCell = ''
      continue
    }

    if ((character === '\n' || character === '\r') && !inQuotes) {
      if (character === '\r' && nextCharacter === '\n') {
        index += 1
      }

      currentRow.push(currentCell)
      rows.push(currentRow)
      currentCell = ''
      currentRow = []
      continue
    }

    currentCell += character
  }

  if (inQuotes) {
    throw new Error('CSV có dấu nháy kép chưa đóng.')
  }

  currentRow.push(currentCell)
  rows.push(currentRow)

  return rows.filter((row) => row.some((cell) => cell.length > 0))
}

export function csvRowToObject(headers: string[], row: string[]) {
  return headers.reduce<CsvRow>((result, header, index) => {
    result[header] = row[index] ?? ''
    return result
  }, {})
}

export function normalizeHexColor(value: string) {
  if (/^#?[0-9a-fA-F]{3}$/.test(value)) {
    const raw = value.replace('#', '')
    return `#${raw
      .split('')
      .map((char) => `${char}${char}`)
      .join('')}`
  }

  if (/^#?[0-9a-fA-F]{6}$/.test(value)) {
    return value.startsWith('#') ? value : `#${value}`
  }

  return ''
}

export function hexToRgb(hex: string) {
  const raw = hex.replace('#', '')

  return {
    r: Number.parseInt(raw.slice(0, 2), 16),
    g: Number.parseInt(raw.slice(2, 4), 16),
    b: Number.parseInt(raw.slice(4, 6), 16),
  }
}

export function rgbToHsl(r: number, g: number, b: number) {
  const red = r / 255
  const green = g / 255
  const blue = b / 255
  const max = Math.max(red, green, blue)
  const min = Math.min(red, green, blue)
  const lightness = (max + min) / 2
  const delta = max - min

  if (delta === 0) {
    return { h: 0, s: 0, l: Math.round(lightness * 100) }
  }

  const saturation = delta / (1 - Math.abs(2 * lightness - 1))
  let hue = 0

  if (max === red) {
    hue = ((green - blue) / delta) % 6
  } else if (max === green) {
    hue = (blue - red) / delta + 2
  } else {
    hue = (red - green) / delta + 4
  }

  return {
    h: Math.round(hue * 60 < 0 ? hue * 60 + 360 : hue * 60),
    s: Math.round(saturation * 100),
    l: Math.round(lightness * 100),
  }
}

export function headersToJson(headers: ParsedHeader[]) {
  return headers.length
    ? JSON.stringify(
        Object.fromEntries(headers.map((header) => [header.key, header.value])),
        null,
        2,
      )
    : ''
}
