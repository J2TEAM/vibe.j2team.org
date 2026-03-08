export type QueryParam = {
  key: string
  value: string
}

export type RegexMatch = {
  index: number
  text: string
  groups: string[]
}

export type JwtTimeField = {
  key: string
  raw: string
  formatted: string
}

export type CaseVariant = {
  label: string
  value: string
}

export type DiffLine = {
  type: 'same' | 'added' | 'removed' | 'changed'
  left: string
  right: string
}

export type ParsedHeader = {
  key: string
  value: string
}

export type CsvRow = Record<string, string>

export type ToolPageId = 'builders' | 'data' | 'time' | 'inspect'

export type JsonPrimitive = string | number | boolean | null
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }

export type OutputTone = 'default' | 'success' | 'error'

export type CopyStatus = {
  key: string
  state: OutputTone
  message: string
}
