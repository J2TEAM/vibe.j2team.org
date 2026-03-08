import { computed, ref } from 'vue'

import type { CaseVariant, JsonValue, JwtTimeField, OutputTone } from '../types'
import {
  decodeBase64UrlToText,
  extractJwtTimeFields,
  generateTypeScriptType,
  splitWords,
  toCamelCase,
  toPascalCase,
} from '../lib/utils'

export function useBuilderTools() {
  const jwtInput = ref(
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpXVCBEZWNvZGVyIiwiaWF0IjoxNzQxMzA0MjAwLCJleHAiOjE3NDEzMDc4MDB9.signature',
  )
  const hashInput = ref('Dev Pocket Tools')
  const hashAlgorithm = ref('SHA-256')
  const hashOutput = ref('')
  const hashStatus = ref<{ tone: OutputTone; message: string }>({
    tone: 'default',
    message: 'Nhập text và sinh hash bằng Web Crypto API.',
  })
  const caseInput = ref('dev pocket tools v2')
  const jsonTypeInput = ref(
    '{\n  "id": 1,\n  "name": "J2TEAM",\n  "tags": ["tools", "dev"],\n  "profile": {\n    "active": true,\n    "score": 9.8\n  }\n}',
  )
  const uuidCount = ref(3)
  const uuidList = ref<string[]>([])

  const jwtResult = computed(() => {
    const source = jwtInput.value.trim()
    if (!source)
      return {
        tone: 'default' as const,
        message: 'Dán JWT để decode header và payload.',
        header: '',
        payload: '',
        timeFields: [] as JwtTimeField[],
      }

    const segments = source.split('.')
    if (segments.length < 2)
      return {
        tone: 'error' as const,
        message: 'JWT phải có ít nhất 2 phần: header.payload.',
        header: '',
        payload: '',
        timeFields: [] as JwtTimeField[],
      }

    try {
      const headerText = decodeBase64UrlToText(segments[0] ?? '')
      const payloadText = decodeBase64UrlToText(segments[1] ?? '')
      const headerJson = JSON.parse(headerText) as JsonValue
      const payloadJson = JSON.parse(payloadText) as JsonValue

      return {
        tone: 'success' as const,
        message: 'Đã decode JWT. Signature chưa được verify trong v2.',
        header: JSON.stringify(headerJson, null, 2),
        payload: JSON.stringify(payloadJson, null, 2),
        timeFields: extractJwtTimeFields(payloadJson),
      }
    } catch (error) {
      return {
        tone: 'error' as const,
        message: error instanceof Error ? error.message : 'Không thể decode JWT.',
        header: '',
        payload: '',
        timeFields: [] as JwtTimeField[],
      }
    }
  })

  const caseVariants = computed(() => {
    const words = splitWords(caseInput.value)
    return [
      { label: 'camelCase', value: toCamelCase(words) },
      { label: 'snake_case', value: words.join('_') },
      { label: 'kebab-case', value: words.join('-') },
      { label: 'PascalCase', value: toPascalCase(words) },
      { label: 'CONSTANT_CASE', value: words.join('_').toUpperCase() },
    ] satisfies CaseVariant[]
  })

  const jsonTypeResult = computed(() => {
    const source = jsonTypeInput.value.trim()
    if (!source)
      return {
        tone: 'default' as const,
        message: 'Nhập JSON mẫu để sinh interface TypeScript.',
        output: '',
      }

    try {
      const parsed = JSON.parse(source) as JsonValue
      return {
        tone: 'success' as const,
        message: 'Đã sinh TypeScript từ JSON mẫu.',
        output: generateTypeScriptType('RootPayload', parsed),
      }
    } catch (error) {
      return {
        tone: 'error' as const,
        message: error instanceof Error ? error.message : 'JSON không hợp lệ.',
        output: '',
      }
    }
  })

  async function generateHash() {
    const source = hashInput.value
    if (!source) {
      hashOutput.value = ''
      hashStatus.value = { tone: 'error', message: 'Nhập nội dung trước khi sinh hash.' }
      return
    }

    if (!('crypto' in window) || !('subtle' in window.crypto)) {
      hashOutput.value = ''
      hashStatus.value = {
        tone: 'error',
        message: 'Trình duyệt hiện tại không hỗ trợ Web Crypto API.',
      }
      return
    }

    try {
      const digest = await window.crypto.subtle.digest(
        hashAlgorithm.value,
        new TextEncoder().encode(source),
      )
      hashOutput.value = Array.from(new Uint8Array(digest))
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('')
      hashStatus.value = { tone: 'success', message: `Đã sinh ${hashAlgorithm.value}.` }
    } catch (error) {
      hashOutput.value = ''
      hashStatus.value = {
        tone: 'error',
        message: error instanceof Error ? error.message : 'Không thể sinh hash.',
      }
    }
  }

  function generateUuids() {
    const total = Math.min(Math.max(uuidCount.value, 1), 20)
    uuidCount.value = total
    uuidList.value = Array.from({ length: total }, () => window.crypto.randomUUID())
  }

  generateHash()
  generateUuids()

  return {
    caseInput,
    caseVariants,
    generateHash,
    generateUuids,
    hashAlgorithm,
    hashInput,
    hashOutput,
    hashStatus,
    jsonTypeInput,
    jsonTypeResult,
    jwtInput,
    jwtResult,
    uuidCount,
    uuidList,
  }
}
