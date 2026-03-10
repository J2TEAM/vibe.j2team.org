import { diffLines } from 'diff'
import type { JsonProcessResult, DiffResult, IndentSize } from '../types'

export function useJsonTools() {
  const formatJson = (input: string, indent: IndentSize = 2): JsonProcessResult => {
    try {
      if (!input.trim()) return { success: true, data: '' }

      // Basic "Repair" logic: remove trailing commas and fix common typos
      let sanitized = input.trim()
      sanitized = sanitized.replace(/,\s*([\]}])/g, '$1') // Remove trailing commas

      const parsed = JSON.parse(sanitized)
      const space = indent === 'tab' ? '\t' : indent
      return {
        success: true,
        data: JSON.stringify(parsed, null, space),
      }
    } catch (err) {
      return {
        success: false,
        data: input,
        error: err instanceof Error ? err.message : String(err),
      }
    }
  }

  const minifyJson = (input: string): JsonProcessResult => {
    try {
      if (!input.trim()) return { success: true, data: '' }
      const parsed = JSON.parse(input)
      return {
        success: true,
        data: JSON.stringify(parsed),
      }
    } catch (err) {
      return {
        success: false,
        data: input,
        error: err instanceof Error ? err.message : String(err),
      }
    }
  }

  const sortKeys = (input: string, indent: IndentSize = 2): JsonProcessResult => {
    try {
      if (!input.trim()) return { success: true, data: '' }
      const parsed = JSON.parse(input)

      const sortObject = (obj: unknown): unknown => {
        if (obj === null || typeof obj !== 'object') return obj
        if (Array.isArray(obj)) return obj.map(sortObject)

        const record = obj as Record<string, unknown>
        return Object.keys(record)
          .sort()
          .reduce((acc: Record<string, unknown>, key) => {
            acc[key] = sortObject(record[key])
            return acc
          }, {})
      }

      const sorted = sortObject(parsed)
      const space = indent === 'tab' ? '\t' : indent
      return {
        success: true,
        data: JSON.stringify(sorted, null, space),
      }
    } catch (err) {
      return {
        success: false,
        data: input,
        error: err instanceof Error ? err.message : String(err),
      }
    }
  }

  const compareJson = (oldStr: string, newStr: string): DiffResult => {
    try {
      // We use diffLines for a more "standard" diff look,
      // but we could use diffJson if we only care about structural changes
      const changes = diffLines(oldStr, newStr)
      const hasChanges = changes.some((c) => c.added || c.removed)

      return {
        changes: changes.map((c) => ({
          value: c.value,
          added: c.added,
          removed: c.removed,
        })),
        hasChanges,
      }
    } catch {
      return { changes: [], hasChanges: false }
    }
  }

  return {
    formatJson,
    minifyJson,
    sortKeys,
    compareJson,
  }
}
