import { computed, ref } from 'vue'

import type { DiffLine, ParsedHeader } from '../types'
import {
  csvRowToObject,
  headersToJson,
  hexToRgb,
  normalizeHexColor,
  parseCsv,
  rgbToHsl,
} from '../lib/utils'

export function useInspectTools() {
  const diffLeft = ref('alpha\nbeta\ngamma\ndelta')
  const diffRight = ref('alpha\nbeta updated\ngamma\nepsilon')
  const numberBaseInput = ref('255')
  const numberBase = ref<'10' | '2' | '8' | '16'>('10')
  const rawHeadersInput = ref(
    'Content-Type: application/json\nAuthorization: Bearer token\nX-Request-ID: abc-123',
  )
  const csvInput = ref('name,role,active\nJ2TEAM,community,true\nKhiem,author,true')
  const colorInput = ref('#ff6b4a')

  const diffResult = computed(() => {
    const leftLines = diffLeft.value.split('\n')
    const rightLines = diffRight.value.split('\n')
    const total = Math.max(leftLines.length, rightLines.length)
    const lines: DiffLine[] = []

    for (let index = 0; index < total; index += 1) {
      const left = leftLines[index] ?? ''
      const right = rightLines[index] ?? ''

      if (left === right) lines.push({ type: 'same', left, right })
      else if (!left && right) lines.push({ type: 'added', left: '', right })
      else if (left && !right) lines.push({ type: 'removed', left, right: '' })
      else lines.push({ type: 'changed', left, right })
    }

    return {
      lines,
      summary: `${lines.filter((line) => line.type !== 'same').length} dòng có khác biệt.`,
    }
  })

  const numberBaseResult = computed(() => {
    const source = numberBaseInput.value.trim()
    if (!source)
      return {
        tone: 'default' as const,
        message: 'Nhập số và chọn hệ cơ số nguồn.',
        decimal: '',
        binary: '',
        octal: '',
        hex: '',
      }

    const parsed = Number.parseInt(source, Number(numberBase.value))
    if (Number.isNaN(parsed))
      return {
        tone: 'error' as const,
        message: 'Giá trị không hợp lệ cho hệ cơ số đã chọn.',
        decimal: '',
        binary: '',
        octal: '',
        hex: '',
      }

    return {
      tone: 'success' as const,
      message: 'Đã chuyển đổi giữa các hệ cơ số phổ biến.',
      decimal: parsed.toString(10),
      binary: parsed.toString(2),
      octal: parsed.toString(8),
      hex: parsed.toString(16).toUpperCase(),
    }
  })

  const parsedHeaders = computed(() => {
    const headers = rawHeadersInput.value
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const separatorIndex = line.indexOf(':')
        return separatorIndex === -1
          ? null
          : {
              key: line.slice(0, separatorIndex).trim(),
              value: line.slice(separatorIndex + 1).trim(),
            }
      })
      .filter((header): header is ParsedHeader => header !== null)

    return { headers, json: headersToJson(headers) }
  })

  const csvResult = computed(() => {
    const source = csvInput.value.trim()
    if (!source)
      return {
        tone: 'default' as const,
        message: 'Dán CSV có header ở dòng đầu để convert sang JSON.',
        output: '',
        rowCount: 0,
      }

    try {
      const rows = parseCsv(source)
      if (rows.length < 2)
        return {
          tone: 'error' as const,
          message: 'CSV cần ít nhất một dòng header và một dòng dữ liệu.',
          output: '',
          rowCount: 0,
        }

      const [headers = [], ...dataRows] = rows
      const normalizedHeaders = headers.map((header, index) => header || `column_${index + 1}`)
      const objects = dataRows.map((row) => csvRowToObject(normalizedHeaders, row))
      return {
        tone: 'success' as const,
        message: `Đã convert ${objects.length} dòng CSV sang JSON.`,
        output: JSON.stringify(objects, null, 2),
        rowCount: objects.length,
      }
    } catch (error) {
      return {
        tone: 'error' as const,
        message: error instanceof Error ? error.message : 'Không thể parse CSV.',
        output: '',
        rowCount: 0,
      }
    }
  })

  const colorResult = computed(() => {
    const normalized = normalizeHexColor(colorInput.value.trim())
    if (!normalized)
      return {
        tone: 'error' as const,
        message: 'Nhập màu dạng HEX như #FF6B4A hoặc #F64.',
        hex: '',
        rgb: '',
        hsl: '',
      }

    const { r, g, b } = hexToRgb(normalized)
    const { h, s, l } = rgbToHsl(r, g, b)
    return {
      tone: 'success' as const,
      message: 'Đã convert màu sang RGB và HSL.',
      hex: normalized.toUpperCase(),
      rgb: `rgb(${r}, ${g}, ${b})`,
      hsl: `hsl(${h}, ${s}%, ${l}%)`,
    }
  })

  return {
    colorInput,
    colorResult,
    csvInput,
    csvResult,
    diffLeft,
    diffResult,
    diffRight,
    numberBase,
    numberBaseInput,
    numberBaseResult,
    parsedHeaders,
    rawHeadersInput,
  }
}
