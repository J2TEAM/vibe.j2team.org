import { computed, ref } from 'vue'

import type { QueryParam } from '../types'
import {
  decodeBase64ToText,
  encodeTextToBase64,
  escapeHtml,
  normalizeUrlInput,
  unescapeHtml,
} from '../lib/utils'

export function useDataTools(
  setCopyStatus: (key: string, state: 'default' | 'success' | 'error', message: string) => void,
) {
  const jsonInput = ref(
    '{\n  "name": "J2TEAM",\n  "tools": ["json", "base64", "regex"],\n  "active": true\n}',
  )
  const base64Text = ref('Xin chào J2TEAM')
  const base64Value = ref('WGluIGNow6BvIEoyVEVBTQ==')
  const urlInput = ref('https://example.com/search?q=vibe%20code&lang=vi&sort=newest')
  const queryBuilderInput = ref('q=dev tools\nlang=vi\nsort=newest')
  const htmlInput = ref('<button title="Dev & Tools">Click me</button>')

  const jsonResult = computed(() => {
    const source = jsonInput.value.trim()
    if (!source)
      return {
        tone: 'default' as const,
        message: 'Dán JSON thô vào đây để format hoặc kiểm tra cú pháp.',
        output: '',
      }

    try {
      const parsed: object = JSON.parse(source) as object
      return {
        tone: 'success' as const,
        message: 'JSON hợp lệ.',
        output: JSON.stringify(parsed, null, 2),
      }
    } catch (error) {
      return {
        tone: 'error' as const,
        message: error instanceof Error ? error.message : 'Không thể phân tích JSON.',
        output: '',
      }
    }
  })

  const urlResult = computed(() => {
    const source = urlInput.value.trim()
    if (!source)
      return {
        tone: 'default' as const,
        encoded: '',
        decoded: '',
        origin: '',
        pathname: '',
        queryParams: [] as QueryParam[],
        message: 'Nhập URL đầy đủ hoặc chỉ phần query để encode, decode và parse.',
      }

    const encoded = encodeURIComponent(source)
    let decoded = source
    try {
      decoded = decodeURIComponent(source)
    } catch {
      decoded = 'Chuỗi hiện tại không phải dữ liệu URL-encoded hợp lệ để decode toàn phần.'
    }

    try {
      const url = normalizeUrlInput(source)
      return {
        tone: 'success' as const,
        encoded,
        decoded,
        origin: url.origin,
        pathname: `${url.pathname}${url.hash}`,
        queryParams: Array.from(url.searchParams.entries()).map(([key, value]) => ({ key, value })),
        message: url.searchParams.size
          ? `Đã parse ${url.searchParams.size} query param.`
          : 'URL hợp lệ nhưng không có query param.',
      }
    } catch (error) {
      return {
        tone: 'error' as const,
        encoded,
        decoded,
        origin: '',
        pathname: '',
        queryParams: [] as QueryParam[],
        message: error instanceof Error ? error.message : 'Không thể phân tích URL.',
      }
    }
  })

  const queryBuilderResult = computed(() => {
    const entries = queryBuilderInput.value
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const separatorIndex = line.indexOf('=')
        return separatorIndex === -1
          ? { key: line, value: '' }
          : {
              key: line.slice(0, separatorIndex).trim(),
              value: line.slice(separatorIndex + 1).trim(),
            }
      })
      .filter((entry) => entry.key)

    const params = new URLSearchParams()
    entries.forEach((entry) => {
      params.append(entry.key, entry.value)
    })

    return {
      entries,
      query: params.toString(),
      preview: params.toString() ? `?${params.toString()}` : '',
    }
  })

  const htmlEscapeResult = computed(() => {
    const source = htmlInput.value
    if (!source)
      return {
        tone: 'default' as const,
        escaped: '',
        unescaped: '',
        message: 'Nhập HTML hoặc text để escape và unescape.',
      }

    const escaped = escapeHtml(source)
    return {
      tone: 'success' as const,
      escaped,
      unescaped: unescapeHtml(source),
      message: 'Đã chuyển đổi giữa dạng raw và escaped.',
    }
  })

  function formatJson() {
    if (jsonResult.value.output) jsonInput.value = jsonResult.value.output
  }

  function encodeBase64() {
    base64Value.value = encodeTextToBase64(base64Text.value)
  }

  function decodeBase64() {
    try {
      base64Text.value = decodeBase64ToText(base64Value.value)
    } catch (error) {
      setCopyStatus(
        'base64',
        'error',
        error instanceof Error ? error.message : 'Base64 không hợp lệ.',
      )
    }
  }

  function useDecodedUrl() {
    if (urlResult.value.decoded && !urlResult.value.decoded.startsWith('Chuỗi hiện tại'))
      urlInput.value = urlResult.value.decoded
  }

  return {
    base64Text,
    base64Value,
    decodeBase64,
    encodeBase64,
    formatJson,
    htmlEscapeResult,
    htmlInput,
    jsonInput,
    jsonResult,
    queryBuilderInput,
    queryBuilderResult,
    urlInput,
    urlResult,
    useDecodedUrl,
  }
}
